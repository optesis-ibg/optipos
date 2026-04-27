import { useState } from "react";
import ExcelImportPanel from "./shared/ExcelImportPanel.jsx";
import { hasPerm } from "../utils.js";
import { createSite, updateSite, deleteSite } from "../api.js";

const GERANT_TYPES = ["Locataire-gérant","Gérant mandataire","Propriétaire exploitant","Salarié gérant","Franchisé","Autre"];

export default function SitesTab({ sites, setSites, inspNames=[], perms={}, cities=[] }) {
  const blank = { name:"", addr:"", code:"", tel:"", gerantPrenom:"", gerantNom:"", dateContrat:"", typeGerant:"", cityId:"", inspecteurs:[], docs:[] };
  const [form,     setForm]    = useState(blank);
  const [editId,   setEditId]  = useState(null);
  const [showForm, setShowForm]= useState(false);
  const [expandId, setExpand]  = useState(null);

  const F = (k,v) => setForm(f=>({...f,[k]:v}));

  const addDocs = e => {
    const files = Array.from(e.target.files);
    Promise.all(files.map(f => new Promise(res => {
      const r = new FileReader();
      r.onload = () => res({ name:f.name, url:r.result, type:f.type, size:f.size });
      r.readAsDataURL(f);
    }))).then(nf => F("docs",[...(form.docs||[]),...nf]));
    e.target.value = "";
  };
  const delDoc = i => F("docs",(form.docs||[]).filter((_,j)=>j!==i));

  const save = async () => {
    if(!form.name){alert("Le nom de la station est requis.");return;}
    try {
      if(editId) {
        const updated = await updateSite(editId, form);
        setSites(ss=>ss.map(s=>s.id===editId?updated:s));
      } else {
        const created = await createSite(form);
        setSites(ss=>[...ss, created]);
      }
      setForm(blank); setEditId(null); setShowForm(false);
    } catch(err) { alert(err.message); }
  };
  const openNew   = ()  => { setForm(blank); setEditId(null); setShowForm(true); };
  const startEdit = s   => { setForm({...blank,...s,cityId:s.cityId||s.city_id||"",docs:s.docs||[]}); setEditId(s.id); setShowForm(true); };
  const cancel    = ()  => { setForm(blank); setEditId(null); setShowForm(false); };
  const del = async (id) => {
    if(!window.confirm("Supprimer ce site ?")) return;
    try { await deleteSite(id); setSites(ss=>ss.filter(s=>s.id!==id)); } catch(err) { alert(err.message); }
  };

  const fieldStyle  = {width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:14,boxSizing:"border-box",fontFamily:"inherit",outline:"none"};
  const labelStyle  = {fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.4};
  const sectionHead = label => (
    <div style={{fontSize:11,fontWeight:700,color:"#5F3876",textTransform:"uppercase",letterSpacing:.8,
      padding:"6px 0 4px",borderBottom:"1px solid #F5F0FA",marginBottom:2}}>{label}</div>
  );

  const importSites = (rows) => {
    let count = 0, skipped = 0;
    const newSites = [];
    const maxId = Math.max(0, ...sites.map(s=>s.id||0));
    rows.forEach(row => {
      const name = (row[0]||"").toString().trim();
      if (!name) { skipped++; return; }
      if (sites.find(s=>s.name===name)) { skipped++; return; }
      newSites.push({ id:maxId+newSites.length+1, name,
        code:(row[1]||"").toString().trim(), addr:(row[2]||"").toString().trim(),
        tel:(row[3]||"").toString().trim(), gerantPrenom:(row[4]||"").toString().trim(),
        gerantNom:(row[5]||"").toString().trim(), docs:[], inspecteurs:[] });
      count++;
    });
    if (newSites.length) setSites(ss=>[...ss,...newSites]);
    return { ok:true, count, skipped };
  };

  return (
    <div style={{padding:14,display:"flex",flexDirection:"column",gap:12}}>

      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:0}}>
          <span style={{fontSize:15,fontWeight:700,color:"#1D1D1B"}}>
            {sites.length} site{sites.length!==1?"s":""} configuré{sites.length!==1?"s":""}
          </span>
        </div>
        <ExcelImportPanel type="sites" templateFile="/template_sites.xlsx"
          fields={[{key:"name",label:"Nom station",required:true},{key:"code",label:"Code",required:false},{key:"addr",label:"Adresse",required:false},{key:"tel",label:"Téléphone",required:false}]}
          onImport={importSites}/>
        {hasPerm(perms,"sites","sites","creer") && (
          <button onClick={openNew}
            style={{display:"flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:10,
              background:"#5F3876",color:"white",border:"none",fontWeight:700,fontSize:13,
              cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>
            ＋ Nouveau site
          </button>
        )}
      </div>

      {sites.length===0 && (
        <div style={{textAlign:"center",padding:"48px 0",color:"#9F8EAE"}}>
          <div style={{fontSize:40,marginBottom:10}}>⛽</div>
          <div style={{fontSize:15,fontWeight:600,color:"#5F3876",marginBottom:6}}>Aucun site configuré</div>
          <div style={{fontSize:13,marginBottom:20}}>Ajoutez votre première station pour commencer.</div>
          {hasPerm(perms,"sites","sites","creer") && (
            <button onClick={openNew}
              style={{padding:"10px 24px",borderRadius:10,background:"#5F3876",color:"white",
                border:"none",fontWeight:700,fontSize:14,cursor:"pointer"}}>
              ＋ Ajouter un site
            </button>
          )}
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {sites.map(s=>{
          const isOpen = expandId===s.id;
          const gerant = [s.gerantPrenom,s.gerantNom].filter(Boolean).join(" ");
          const docsN  = (s.docs||[]).length;
          const city   = cities.find(c=>c.id===(s.cityId||s.city_id));
          return (
            <div key={s.id} style={{background:"white",borderRadius:12,
              border:`1px solid ${isOpen?"#5F3876":"#F0EBF7"}`,
              overflow:"hidden",transition:"border-color .2s",
              boxShadow:isOpen?"0 2px 12px rgba(95,56,118,0.1)":"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",cursor:"pointer"}}
                onClick={()=>setExpand(id=>id===s.id?null:s.id)}>
                <div style={{width:40,height:40,borderRadius:10,background:"#F5F0FA",border:"1px solid #C9B8DC",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>⛽</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,color:"#1D1D1B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                  <div style={{fontSize:12,color:"#9F8EAE",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {city?`🏙️ ${city.name}${city.region?" · "+city.region:""} · `:""}{gerant?`👤 ${gerant}${s.typeGerant?" · "+s.typeGerant:""}`:s.addr||s.code||"—"}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3,flexShrink:0}}>
                  {s.code && <div style={{fontSize:11,fontWeight:700,color:"#7A5499",padding:"2px 8px",borderRadius:6,background:"#F5F0FA"}}>{s.code}</div>}
                  {docsN>0 && <div style={{fontSize:10,color:"#9F8EAE",padding:"1px 7px",borderRadius:10,background:"#FDFAF6",border:"1px solid #F0EBF7"}}>📎 {docsN}</div>}
                </div>
                <span style={{color:"#C9B8DC",fontSize:12,transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s",flexShrink:0}}>▼</span>
              </div>
              {isOpen && (
                <div style={{borderTop:"1px solid #F0EBF7",padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
                  <div className="form-grid-2">
                    {[["🏙️ Ville",city?.name],["🗺️ Région",city?.region],["🌍 Pays",city?.pays],["📍 Adresse",s.addr],["📞 Téléphone",s.tel],["🔖 Code",s.code]].map(([l,v])=>v?(
                      <div key={l}><div style={{fontSize:10,color:"#9F8EAE",fontWeight:700,textTransform:"uppercase",marginBottom:2}}>{l}</div>
                        <div style={{fontSize:13,color:"#1D1D1B",fontWeight:500}}>{v}</div></div>):null)}
                  </div>
                  {(gerant||s.dateContrat||s.typeGerant) && (
                    <div style={{background:"#FDFAF6",borderRadius:8,padding:"10px 12px",border:"1px solid #F0EBF7"}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#5F3876",textTransform:"uppercase",marginBottom:6}}>👤 Gérant</div>
                      <div className="form-grid-2">
                        {gerant && <div><div style={{fontSize:10,color:"#9F8EAE",fontWeight:700,textTransform:"uppercase",marginBottom:2}}>Nom complet</div><div style={{fontSize:13,color:"#1D1D1B",fontWeight:600}}>{gerant}</div></div>}
                        {s.typeGerant && <div><div style={{fontSize:10,color:"#9F8EAE",fontWeight:700,textTransform:"uppercase",marginBottom:2}}>Type</div><div style={{fontSize:13,color:"#1D1D1B"}}>{s.typeGerant}</div></div>}
                        {s.dateContrat && <div><div style={{fontSize:10,color:"#9F8EAE",fontWeight:700,textTransform:"uppercase",marginBottom:2}}>Contrat</div><div style={{fontSize:13,color:"#1D1D1B"}}>{new Date(s.dateContrat).toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})}</div></div>}
                      </div>
                    </div>
                  )}
                  {(s.inspecteurs||[]).length>0 && (
                    <div style={{background:"#FDFAF6",borderRadius:8,padding:"10px 12px",border:"1px solid #F0EBF7"}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#5F3876",textTransform:"uppercase",marginBottom:6}}>🔍 Inspecteurs</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                        {(s.inspecteurs||[]).map(a=>(
                          <span key={a} style={{padding:"3px 10px",borderRadius:20,background:"#F5F0FA",border:"1px solid #C9B8DC",fontSize:12,color:"#5F3876",fontWeight:600}}>{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {docsN>0 && (
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:"#5F3876",textTransform:"uppercase",marginBottom:6}}>📎 Documents ({docsN})</div>
                      <div style={{display:"flex",flexDirection:"column",gap:5}}>
                        {(s.docs||[]).map((f,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:7,background:"#FDFAF6",border:"1px solid #F0EBF7"}}>
                            <span style={{fontSize:18,flexShrink:0}}>{f.type?.startsWith("image/")?"🖼️":f.type==="application/pdf"?"📄":"📁"}</span>
                            <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:"#1D1D1B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div><div style={{fontSize:10,color:"#9F8EAE"}}>{(f.size/1024).toFixed(1)} Ko</div></div>
                            <a href={f.url} download={f.name} style={{padding:"3px 8px",borderRadius:5,border:"1px solid #e2e8f0",background:"white",color:"#64748b",fontSize:11,textDecoration:"none",flexShrink:0}}>⬇</a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{display:"flex",gap:7,justifyContent:"flex-end",paddingTop:4,borderTop:"1px solid #F0EBF7"}}>
                    {hasPerm(perms,"sites","sites","modifier") && (
                      <button onClick={()=>startEdit(s)}
                        style={{padding:"6px 14px",borderRadius:8,border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:13,fontWeight:500}}>✏️ Modifier</button>
                    )}
                    {hasPerm(perms,"sites","sites","supprimer") && (
                      <button onClick={()=>del(s.id)}
                        style={{padding:"6px 14px",borderRadius:8,border:"1px solid #fee2e2",background:"#fff5f5",cursor:"pointer",fontSize:13,fontWeight:500,color:"#ef4444"}}>🗑️ Supprimer</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={cancel}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div style={{padding:"20px 24px 0",borderBottom:"1px solid #F0EBF7",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:10,paddingBottom:16}}>
                <div style={{width:38,height:38,borderRadius:10,background:"#5F3876",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>⛽</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:16,color:"#1D1D1B"}}>{editId?"Modifier le site":"Nouveau site"}</div>
                  <div style={{fontSize:11,color:"#9F8EAE",marginTop:1}}>Informations de la station</div>
                </div>
                <button onClick={cancel} style={{border:"none",background:"none",fontSize:22,cursor:"pointer",color:"#9F8EAE",padding:4,lineHeight:1}}>×</button>
              </div>
            </div>
            <div style={{padding:"0 24px 24px",display:"flex",flexDirection:"column",gap:14,maxHeight:"70vh",overflowY:"auto"}}>
              {sectionHead("⛽ Informations station")}
              <div className="form-grid-2">
                {[["Nom de la station *","name","Ex: Station Total – Lyon"],["Code site","code","Ex: LYO-001"],["Adresse complète","addr","12 Rue de la République"],["Téléphone","tel","04 72 00 00 00"]].map(([l,k,ph])=>(
                  <div key={k}><label style={labelStyle}>{l}</label><input value={form[k]||""} onChange={e=>F(k,e.target.value)} placeholder={ph} style={fieldStyle}/></div>
                ))}
              </div>
              <div>
                <label style={labelStyle}>🏙️ Ville</label>
                <select value={form.cityId||""} onChange={e=>F("cityId",e.target.value?parseInt(e.target.value):"")} style={{...fieldStyle,background:"white"}}>
                  <option value="">-- Sélectionner une ville --</option>
                  {cities.map(c=><option key={c.id} value={c.id}>{c.name}{c.region?" · "+c.region:""}</option>)}
                </select>
                {cities.length===0 && <div style={{fontSize:11,color:"#9F8EAE",marginTop:4}}>Aucune ville disponible — créez-en dans l'onglet Villes.</div>}
              </div>
              {sectionHead("👤 Gérant")}
              <div className="form-grid-2">
                <div><label style={labelStyle}>Prénom</label><input value={form.gerantPrenom||""} onChange={e=>F("gerantPrenom",e.target.value)} placeholder="Ex: Jean" style={fieldStyle}/></div>
                <div><label style={labelStyle}>Nom</label><input value={form.gerantNom||""} onChange={e=>F("gerantNom",e.target.value)} placeholder="Ex: Dupont" style={fieldStyle}/></div>
                <div><label style={labelStyle}>Date de contrat</label><input type="date" value={form.dateContrat||""} onChange={e=>F("dateContrat",e.target.value)} style={fieldStyle}/></div>
                <div><label style={labelStyle}>Type de gérance</label>
                  <select value={form.typeGerant||""} onChange={e=>F("typeGerant",e.target.value)} style={{...fieldStyle,background:"white"}}>
                    <option value="">-- Sélectionner --</option>
                    {GERANT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              {sectionHead("🔍 Inspecteurs assignés")}
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <select onChange={e=>{const v=e.target.value;if(!v)return;if(!(form.inspecteurs||[]).includes(v))F("inspecteurs",[...(form.inspecteurs||[]),v]);e.target.value="";}}
                  style={{...fieldStyle,background:"white",maxWidth:280}}>
                  <option value="">-- Assigner un inspecteur --</option>
                  {inspNames.filter(a=>!(form.inspecteurs||[]).includes(a)).map(a=><option key={a} value={a}>{a}</option>)}
                </select>
                {(form.inspecteurs||[]).length>0 && (
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {(form.inspecteurs||[]).map(a=>(
                      <span key={a} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,background:"#F5F0FA",border:"1px solid #C9B8DC",fontSize:12,color:"#5F3876",fontWeight:600}}>
                        {a}<button onClick={()=>F("inspecteurs",(form.inspecteurs||[]).filter(x=>x!==a))} style={{border:"none",background:"none",cursor:"pointer",fontSize:13,color:"#5F3876",padding:0,lineHeight:1}}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {sectionHead("📎 Documents")}
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <label style={{display:"inline-flex",alignItems:"center",gap:7,padding:"7px 14px",borderRadius:8,border:"1px dashed #C9B8DC",background:"#FDFAF6",cursor:"pointer",fontSize:13,color:"#64748b",alignSelf:"flex-start"}}>
                  <span>+</span> Ajouter des documents
                  <input type="file" multiple onChange={addDocs} style={{display:"none"}} accept="image/*,application/pdf,.doc,.docx,.txt,.csv"/>
                </label>
                {(form.docs||[]).map((f,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,background:"#FDFAF6",border:"1px solid #F0EBF7"}}>
                    <span style={{fontSize:20,flexShrink:0}}>{f.type?.startsWith("image/")?"🖼️":f.type==="application/pdf"?"📄":"📁"}</span>
                    <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"#1D1D1B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div><div style={{fontSize:10,color:"#9F8EAE"}}>{(f.size/1024).toFixed(1)} Ko</div></div>
                    <button onClick={()=>delDoc(i)} style={{padding:"3px 8px",borderRadius:5,border:"1px solid #fee2e2",background:"#fff5f5",color:"#ef4444",fontSize:11,cursor:"pointer",flexShrink:0}}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid #F0EBF7",paddingTop:14,marginTop:4}}>
                <button onClick={cancel} style={{padding:"9px 18px",borderRadius:9,border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:13,fontWeight:500}}>Annuler</button>
                {(editId ? hasPerm(perms,"sites","sites","modifier") : hasPerm(perms,"sites","sites","creer")) && (
                  <button onClick={save} style={{padding:"9px 22px",borderRadius:9,background:"#5F3876",color:"white",border:"none",fontWeight:700,cursor:"pointer",fontSize:13}}>
                    {editId?"✓ Enregistrer":"➕ Ajouter le site"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
