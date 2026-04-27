import { useState } from "react";
import ExcelImportPanel from "./shared/ExcelImportPanel.jsx";
import { hasPerm } from "../utils.js";
import { createQuestion, updateQuestion, deleteQuestion, createCategorie, updateCategorie, deleteCategorie, bulkCategories } from "../api.js";

const QTYPES = [
  {v:"selection",l:"Sélection (radio)"},{v:"text",l:"Texte libre"},{v:"date",l:"Date"},
  {v:"number",l:"Nombre"},{v:"formula",l:"Formule calculée"},{v:"signature",l:"Signature"},
  {v:"barcode",l:"Code-barres"},{v:"author",l:"Auteur"},{v:"location",l:"Localisation GPS"},{v:"qrcode",l:"QR Code"},
];
const tColor = {selection:"#5F3876",text:"#70BC80",date:"#7A5499",number:"#9F8EAE",formula:"#E94C57",signature:"#7A5499",barcode:"#FFDE90",author:"#5F3876",location:"#70BC80",qrcode:"#7A5499"};

export default function BuilderTab({ questions, setQuestions, cats, setCats, perms={} }) {
  const blank = {cat:"",text:"",type:"selection",scored:true,maxScore:10,opts:[{label:"",score:10},{label:"",score:5},{label:"",score:0}],formula:"q1+q2",min:0,max:10};
  const [form, setForm]         = useState(blank);
  const [editId, setEditId]     = useState(null);
  const [show, setShow]         = useState(false);
  const [newCat, setNewCat]     = useState("");
  const [editCat, setEditCat]   = useState(null);
  const [showCats, setShowCats] = useState(false);
  const [dragCat, setDragCat]   = useState(null);

  const openEdit = q => { setForm({...blank,...q,opts:q.opts||[{label:"",score:10},{label:"",score:0}]}); setEditId(q.id); setShow(true); };

  const del = async (id) => {
    if(!window.confirm("Supprimer cette question ?")) return;
    try { await deleteQuestion(id); setQuestions(qs=>qs.filter(q=>q.id!==id)); } catch(err) { alert(err.message); }
  };

  const save = async () => {
    if(!form.text||!form.cat){alert("Catégorie et texte requis.");return;}
    try {
      if(editId) {
        const updated = await updateQuestion(editId, form);
        setQuestions(qs=>qs.map(q=>q.id===editId?updated:q));
      } else {
        const created = await createQuestion(form);
        setQuestions(qs=>[...qs, created]);
      }
      setEditId(null); setShow(false); setForm(blank);
    } catch(err) { alert(err.message); }
  };

  const addCat = async () => {
    const v = newCat.trim();
    if(!v) return;
    if(cats.some(c=>c.name===v)){alert("Cette catégorie existe déjà.");return;}
    try {
      const created = await createCategorie({name:v, scored:true, orderIdx:cats.length});
      setCats(cs=>[...cs, created]); setNewCat("");
    } catch(err) { alert(err.message); }
  };

  const renameCat = async () => {
    if(!editCat) return;
    const v = editCat.value.trim();
    if(!v) return;
    const old = cats[editCat.index];
    if(v!==old.name && cats.some(c=>c.name===v)){alert("Cette catégorie existe déjà.");return;}
    try {
      const updated = await updateCategorie(old.id, {...old, name:v});
      setCats(cs=>cs.map((c,i)=>i===editCat.index?updated:c));
      setQuestions(qs=>(qs||[]).map(q=>q&&q.cat===old.name?{...q,cat:v}:q));
      setEditCat(null);
    } catch(err) { alert(err.message); }
  };

  const moveCat = async (from, to) => {
    if(to < 0 || to >= cats.length) return;
    const newCats = [...cats]; const [r]=newCats.splice(from,1); newCats.splice(to,0,r);
    setCats(newCats);
    try { await bulkCategories(newCats); } catch(err) { console.error(err); }
  };

  const onCatDragStart = (e, i) => { setDragCat(i); e.dataTransfer.effectAllowed="move"; };
  const onCatDragOver  = (e, i) => { e.preventDefault(); if(dragCat!==null && dragCat!==i) moveCat(dragCat, i); setDragCat(i); };
  const onCatDragEnd   = ()     => setDragCat(null);

  const deleteCat = async (i) => {
    const c = cats[i];
    const nb = (questions||[]).filter(q=>q&&q.cat===c.name).length;
    if(nb>0 && !window.confirm(`Supprimer "${c.name}" et ses ${nb} question(s) ?`)) return;
    try {
      await Promise.all((questions||[]).filter(q=>q&&q.cat===c.name).map(q=>deleteQuestion(q.id)));
      await deleteCategorie(c.id);
      setQuestions(qs=>(qs||[]).filter(q=>q&&q.cat!==c.name));
      setCats(cs=>cs.filter((_,j)=>j!==i));
    } catch(err) { alert(err.message); }
  };

  const importCategories = (rows) => {
    let count = 0, skipped = 0;
    const newCats = [];
    rows.forEach(row => {
      const name = (row[0]||"").toString().trim();
      if (!name) { skipped++; return; }
      const scored = (row[1]||"oui").toString().trim().toLowerCase() !== "non";
      if (!cats.find(c=>c.name===name) && !newCats.find(c=>c.name===name)) {
        newCats.push({ name, scored }); count++;
      } else skipped++;
    });
    if (newCats.length) setCats(cs => [...cs, ...newCats]);
    return { ok: true, count, skipped };
  };

  const importQuestions = (rows) => {
    let count = 0, skipped = 0;
    const newQs = [];
    const maxId = Math.max(0, ...questions.map(q=>q.id||0));
    rows.forEach((row) => {
      const cat  = (row[0]||"").toString().trim();
      const text = (row[1]||"").toString().trim();
      const type = (row[2]||"text").toString().trim().toLowerCase();
      if (!cat || !text) { skipped++; return; }
      const maxScore = parseInt(row[3]) || 0;
      if (!cats.find(c=>c.name===cat) && !newQs.find(q=>q._newCat===cat)) {
        newQs.push({ _isCat: true, name: cat, scored: maxScore > 0 });
      }
      const q = { id: maxId + newQs.filter(x=>!x._isCat).length + 1, cat, text, type, maxScore, scored: true };
      if (type === "selection") {
        const optsRaw = (row[4]||"").toString().split("|");
        q.opts = optsRaw.map(o => { const parts = o.split(":"); return { label: parts[0].trim(), score: parseInt(parts[1]) || 0 }; }).filter(o=>o.label);
        if (!q.opts.length) q.opts = [{label:"Oui",score:maxScore},{label:"Non",score:0}];
      }
      if (type === "formula") q.formula = (row[5]||"").toString().trim() || "q1";
      if (type === "number") { const mm = (row[6]||"").toString().split("|"); q.min = parseInt(mm[0])||0; q.max = parseInt(mm[1])||10; }
      newQs.push(q); count++;
    });
    const newCatsFromImport = newQs.filter(x=>x._isCat).map(({_isCat,...rest})=>rest);
    const newQsOnly = newQs.filter(x=>!x._isCat);
    if (newCatsFromImport.length) setCats(cs=>[...cs, ...newCatsFromImport.filter(nc=>!cs.find(c=>c.name===nc.name))]);
    if (newQsOnly.length) setQuestions(qs=>[...qs, ...newQsOnly]);
    return { ok: true, count, skipped };
  };

  return (
    <div style={{padding:14,display:"flex",flexDirection:"column",gap:14}}>

      <ExcelImportPanel type="categories" templateFile="/template_categories.xlsx"
        fields={[{key:"name",label:"Nom catégorie",required:true},{key:"scored",label:"Avec score (oui/non)",required:false}]}
        onImport={importCategories}/>
      <ExcelImportPanel type="questions" templateFile="/template_questions.xlsx"
        fields={[{key:"cat",label:"Catégorie",required:true},{key:"text",label:"Question",required:true},{key:"type",label:"Type",required:true},{key:"score",label:"Score max",required:false},{key:"opts",label:"Options",required:false},{key:"formula",label:"Formule",required:false}]}
        onImport={importQuestions}/>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:15,fontWeight:700,color:"#1D1D1B"}}>{questions.length} questions configurées</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setShowCats(v=>!v)}
            style={{padding:"8px 14px",borderRadius:8,background:showCats?"#F5F0FA":"white",color:"#5F3876",border:"2px solid #5F3876",fontWeight:700,cursor:"pointer",fontSize:13}}>
            🗂 Catégories
          </button>
          {hasPerm(perms,"builder","questions","creer") && (
            <button onClick={()=>{setEditId(null);setForm(blank);setShow(true);}}
              style={{padding:"8px 16px",borderRadius:8,background:"#5F3876",color:"white",border:"none",fontWeight:700,cursor:"pointer",fontSize:13}}>
              + Nouvelle question
            </button>
          )}
        </div>
      </div>

      {showCats && (
        <div style={{background:"white",borderRadius:12,border:"2px solid #5F3876",padding:16,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontWeight:700,fontSize:14,color:"#1D1D1B"}}>🗂 Gestion des catégories</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {cats.map((c,i)=>(
              <div key={c.name} draggable
                onDragStart={e=>onCatDragStart(e,i)} onDragOver={e=>onCatDragOver(e,i)} onDragEnd={onCatDragEnd}
                style={{display:"flex",gap:6,alignItems:"center",background:dragCat===i?"#F5F0FA":"#FDFAF6",
                  borderRadius:8,padding:"7px 10px",
                  border:`1px solid ${dragCat===i?"#5F3876":"#e2e8f0"}`,
                  transition:"background .15s,border-color .15s",cursor:"grab"}}>
                <svg width="12" height="16" viewBox="0 0 12 16" fill="none" style={{flexShrink:0,opacity:.35,cursor:"grab"}}>
                  <circle cx="2" cy="2"  r="1.5" fill="#64748b"/><circle cx="7" cy="2"  r="1.5" fill="#64748b"/>
                  <circle cx="2" cy="6"  r="1.5" fill="#64748b"/><circle cx="7" cy="6"  r="1.5" fill="#64748b"/>
                  <circle cx="2" cy="10" r="1.5" fill="#64748b"/><circle cx="7" cy="10" r="1.5" fill="#64748b"/>
                </svg>
                {editCat?.index===i ? (
                  <>
                    <input autoFocus value={editCat.value} onChange={e=>setEditCat({...editCat,value:e.target.value})}
                      onKeyDown={e=>e.key==="Enter"&&renameCat()}
                      style={{flex:1,padding:"5px 8px",borderRadius:6,border:"1px solid #5F3876",fontSize:13,outline:"none"}}/>
                    <button onClick={renameCat} style={{padding:"4px 10px",borderRadius:6,background:"#5F3876",color:"white",border:"none",fontWeight:700,cursor:"pointer",fontSize:12}}>✓</button>
                    <button onClick={()=>setEditCat(null)} style={{padding:"4px 8px",borderRadius:6,border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:12}}>✕</button>
                  </>
                ) : (
                  <>
                    <span style={{flex:1,fontSize:14,color:"#1D1D1B",fontWeight:500,userSelect:"none"}}>{c.name}</span>
                    <span style={{fontSize:11,color:"#94a3b8",background:"#F0EBF7",borderRadius:10,padding:"2px 8px",flexShrink:0}}>
                      {(questions||[]).filter(q=>q&&q.cat===c.name).length} q.
                    </span>
                    <div style={{display:"flex",borderRadius:6,border:"1px solid #e2e8f0",overflow:"hidden",flexShrink:0}}>
                      {[{v:true,l:"Score"},{v:false,l:"Sans"}].map(({v,l})=>(
                        <button key={String(v)} onClick={()=>setCats(cs=>cs.map((x,j)=>j===i?{...x,scored:v}:x))}
                          style={{padding:"3px 8px",border:"none",fontSize:11,cursor:"pointer",
                            fontWeight:c.scored===v?700:400,
                            background:c.scored===v?(v?"#F5F0FA":"#F0EBF7"):"white",
                            color:c.scored===v?(v?"#5F3876":"#475569"):"#94a3b8",transition:"all .12s"}}>
                          {l}
                        </button>
                      ))}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:2,flexShrink:0}}>
                      <button onClick={()=>moveCat(i,i-1)} disabled={i===0} style={{padding:"1px 5px",borderRadius:4,border:"1px solid #e2e8f0",background:"white",cursor:i===0?"default":"pointer",fontSize:10,color:i===0?"#d1d5db":"#64748b",lineHeight:1.2}}>▲</button>
                      <button onClick={()=>moveCat(i,i+1)} disabled={i===cats.length-1} style={{padding:"1px 5px",borderRadius:4,border:"1px solid #e2e8f0",background:"white",cursor:i===cats.length-1?"default":"pointer",fontSize:10,color:i===cats.length-1?"#d1d5db":"#64748b",lineHeight:1.2}}>▼</button>
                    </div>
                    <button onClick={()=>setEditCat({index:i,value:c.name})} style={{padding:"4px 8px",borderRadius:6,border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:12,flexShrink:0}}>✏️</button>
                    <button onClick={()=>deleteCat(i)} style={{padding:"4px 8px",borderRadius:6,border:"1px solid #fee2e2",background:"#fff5f5",cursor:"pointer",fontSize:12,flexShrink:0}}>🗑️</button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8,paddingTop:4,borderTop:"1px solid #F0EBF7"}}>
            <input value={newCat} onChange={e=>setNewCat(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&addCat()}
              placeholder="Nouvelle catégorie..."
              style={{flex:1,padding:"7px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,outline:"none"}}/>
            <button onClick={addCat} style={{padding:"7px 16px",borderRadius:8,background:"#5F3876",color:"white",border:"none",fontWeight:700,cursor:"pointer",fontSize:13,whiteSpace:"nowrap"}}>
              + Ajouter
            </button>
          </div>
        </div>
      )}

      {show && (
        <div style={{background:"white",borderRadius:12,border:"2px solid #5F3876",padding:18,display:"flex",flexDirection:"column",gap:12}}>
          <div style={{fontWeight:700,fontSize:15,color:"#1D1D1B"}}>{editId?"Modifier":"Créer"} une question</div>
          <div className="form-grid-2">
            <div>
              <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:3,textTransform:"uppercase"}}>Catégorie</label>
              <select value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})}
                style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:14,background:"white",fontFamily:"inherit",boxSizing:"border-box"}}>
                <option value="">-- Choisir une catégorie --</option>
                {cats.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:3,textTransform:"uppercase"}}>Type de réponse</label>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}
                style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:14,background:"white",fontFamily:"inherit"}}>
                {QTYPES.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:3,textTransform:"uppercase"}}>Texte de la question</label>
            <textarea value={form.text} onChange={e=>setForm({...form,text:e.target.value})} placeholder="Libellé de la question..."
              style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:14,fontFamily:"inherit",resize:"vertical",minHeight:55,boxSizing:"border-box"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.4}}>Notation :</span>
            <div style={{display:"flex",borderRadius:8,border:"1px solid #e2e8f0",overflow:"hidden"}}>
              {[{v:true,l:"⭐ Avec score"},{v:false,l:"— Sans score"}].map(({v,l})=>(
                <button key={String(v)} onClick={()=>setForm(f=>({...f,scored:v,maxScore:v?f.maxScore:0}))}
                  style={{padding:"6px 14px",border:"none",fontSize:12,cursor:"pointer",fontWeight:form.scored===v?700:400,
                    background:form.scored===v?(v?"#F5F0FA":"#FDFAF6"):"white",
                    color:form.scored===v?(v?"#5F3876":"#475569"):"#94a3b8",transition:"all .15s"}}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:10}}>
            {form.scored && <div>
              <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:3,textTransform:"uppercase"}}>Score max</label>
              <input type="number" value={form.maxScore} onChange={e=>setForm({...form,maxScore:parseInt(e.target.value)||0})}
                style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:14,boxSizing:"border-box"}}/>
            </div>}
            {form.type==="formula" && <div>
              <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:3,textTransform:"uppercase"}}>Formule</label>
              <input value={form.formula} onChange={e=>setForm({...form,formula:e.target.value})} placeholder="q1+q2"
                style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:14,fontFamily:"monospace",boxSizing:"border-box"}}/>
            </div>}
            {form.type==="number" && <>
              <div>
                <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:3,textTransform:"uppercase"}}>Min</label>
                <input type="number" value={form.min} onChange={e=>setForm({...form,min:parseInt(e.target.value)||0})
} style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:14,boxSizing:"border-box"}}/>
              </div>
              <div>
                <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:3,textTransform:"uppercase"}}>Max</label>
                <input type="number" value={form.max} onChange={e=>setForm({...form,max:parseInt(e.target.value)||0})}
                  style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:14,boxSizing:"border-box"}}/>
              </div>
            </>}
          </div>
          {form.type==="selection" && (
            <div>
              <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:6,textTransform:"uppercase"}}>Options de réponse</label>
              {form.opts.map((opt,i)=>(
                <div key={i} style={{display:"flex",gap:6,marginBottom:5,alignItems:"center"}}>
                  <input value={opt.label} onChange={e=>{const o=[...form.opts];o[i]={...o[i],label:e.target.value};setForm({...form,opts:o});}}
                    placeholder={`Option ${i+1}`}
                    style={{flex:1,padding:"6px 10px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:13}}/>
                  {form.scored && <>
                    <input type="number" value={opt.score} onChange={e=>{const o=[...form.opts];o[i]={...o[i],score:parseInt(e.target.value)||0};setForm({...form,opts:o});}}
                      style={{width:64,padding:"6px 10px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:13}}/>
                    <span style={{fontSize:11,color:"#94a3b8",width:14}}>pt</span>
                  </>}
                  {form.opts.length>2 && <button onClick={()=>setForm({...form,opts:form.opts.filter((_,j)=>j!==i)})}
                    style={{border:"none",background:"none",color:"#ef4444",cursor:"pointer",fontSize:18,lineHeight:1,padding:0}}>×</button>}
                </div>
              ))}
              <button onClick={()=>setForm({...form,opts:[...form.opts,{label:"",score:0}]})}
                style={{fontSize:12,padding:"4px 10px",borderRadius:6,border:"1px dashed #cbd5e1",background:"transparent",color:"#64748b",cursor:"pointer",marginTop:2}}>
                + Ajouter une option
              </button>
            </div>
          )}
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid #F0EBF7",paddingTop:12}}>
            <button onClick={()=>{setShow(false);setEditId(null);}} style={{padding:"7px 16px",borderRadius:8,border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:13}}>Annuler</button>
            <button onClick={save} style={{padding:"7px 20px",borderRadius:8,background:"#5F3876",color:"white",border:"none",fontWeight:700,cursor:"pointer",fontSize:13}}>
              {editId?"Enregistrer les modifications":"Créer la question"}
            </button>
          </div>
        </div>
      )}

      {(cats||[]).filter(catObj=>catObj&&(questions||[]).some(q=>q&&q.cat===catObj.name)).map(catObj => (
        <div key={catObj.name}>
          <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1.2,marginBottom:6,paddingLeft:2,display:"flex",alignItems:"center",gap:8}}>
            <span>{catObj.name} <span style={{color:"#cbd5e1"}}>— {(questions||[]).filter(q=>q&&q.cat===catObj.name).length} questions</span></span>
            {catObj.scored===false && <span style={{fontSize:10,padding:"1px 7px",borderRadius:10,background:"#F0EBF7",border:"1px solid #e2e8f0",color:"#94a3b8",fontWeight:600,textTransform:"none",letterSpacing:0}}>sans score</span>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {(questions||[]).filter(q=>q&&q.cat===catObj.name).map(q=>q&&(
              <div key={q.id} style={{background:"white",borderRadius:10,border:"1px solid #e2e8f0",padding:"10px 12px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:tColor[q.type]||"#94a3b8",flexShrink:0}}/>
                <div style={{flex:1,fontSize:14,color:"#1D1D1B",lineHeight:1.3,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{q.text}</div>
                <span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:"#FDFAF6",border:"1px solid #e2e8f0",color:"#64748b",flexShrink:0,whiteSpace:"nowrap"}}>{q.type}</span>
                {q.scored===false
                  ? <span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:"#F0EBF7",border:"1px solid #e2e8f0",color:"#94a3b8",flexShrink:0,whiteSpace:"nowrap"}}>sans score</span>
                  : <span style={{fontSize:12,fontWeight:700,color:"#5F3876",minWidth:34,textAlign:"right",flexShrink:0}}>{q.maxScore}pt</span>
                }
                {hasPerm(perms,"builder","questions","modifier") && (
                  <button onClick={()=>openEdit(q)} style={{padding:"4px 8px",borderRadius:6,border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:12,flexShrink:0}}>✏️</button>
                )}
                {hasPerm(perms,"builder","questions","supprimer") && (
                  <button onClick={()=>del(q.id)} style={{padding:"4px 8px",borderRadius:6,border:"1px solid #fee2e2",background:"#fff5f5",cursor:"pointer",fontSize:12,flexShrink:0}}>🗑️</button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
