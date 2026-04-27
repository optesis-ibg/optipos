import { useState } from "react";
import ExcelImportPanel from "./shared/ExcelImportPanel.jsx";
import { hasPerm } from "../utils.js";
import { createInspecteur, updateInspecteur, deleteInspecteur } from "../api.js";

export default function InspecteursTab({ inspecteurs, setInspecteurs, sites, perms={} }) {
  const blank = {prenom:"",nom:"",dateEntree:"",stations:[]};
  const [form,     setForm]    = useState(blank);
  const [editId,   setEditId]  = useState(null);
  const [showForm, setShowForm]= useState(false);
  const [expandId, setExpand]  = useState(null);

  const F = (k,v) => setForm(f=>({...f,[k]:v}));
  const toggleStation = name => F("stations", form.stations.includes(name)?form.stations.filter(s=>s!==name):[...form.stations,name]);

  const save = async () => {
    if(!form.prenom||!form.nom){alert("Prénom et nom requis.");return;}
    try {
      if(editId) {
        const updated = await updateInspecteur(editId, form);
        setInspecteurs(is=>is.map(i=>i.id===editId?updated:i));
      } else {
        const created = await createInspecteur(form);
        setInspecteurs(is=>[...is, created]);
      }
      setForm(blank); setEditId(null); setShowForm(false);
    } catch(err) { alert(err.message); }
  };

  const openNew   = ()  => { setForm(blank); setEditId(null); setShowForm(true); };
  const startEdit = i   => { setForm({...blank,...i,stations:i.stations||[]}); setEditId(i.id); setShowForm(true); };
  const cancel    = ()  => { setForm(blank); setEditId(null); setShowForm(false); };

  const del = async (id) => {
    if(!window.confirm("Supprimer cet inspecteur ?")) return;
    try { await deleteInspecteur(id); setInspecteurs(is=>is.filter(i=>i.id!==id)); } catch(err) { alert(err.message); }
  };

  const fieldStyle = {width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:14,boxSizing:"border-box",fontFamily:"inherit",outline:"none"};
  const labelStyle = {fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.4};
  const sectionHead = label => (
    <div style={{fontSize:11,fontWeight:700,color:"#5F3876",textTransform:"uppercase",letterSpacing:.8,
      padding:"6px 0 4px",borderBottom:"1px solid #F5F0FA",marginBottom:2}}>{label}</div>
  );

  const importInspecteurs = (rows) => {
    let count=0, skipped=0;
    const newInsp=[];
    const maxId=Math.max(0,...inspecteurs.map(i=>i.id||0));
    rows.forEach(row=>{
      const prenom=(row[0]||"").toString().trim(), nom=(row[1]||"").toString().trim();
      if(!prenom||!nom){skipped++;return;}
      if(inspecteurs.find(i=>i.prenom===prenom&&i.nom===nom)){skipped++;return;}
      const stations=(row[3]||"").toString().trim();
      newInsp.push({id:maxId+newInsp.length+1,prenom,nom,dateEntree:(row[2]||"").toString().trim(),
        stations:stations?stations.split("|").map(s=>s.trim()).filter(Boolean):[]});
      count++;
    });
    if(newInsp.length) setInspecteurs(is=>[...is,...newInsp]);
    return {ok:true,count,skipped};
  };

  return (
    <div style={{padding:14,display:"flex",flexDirection:"column",gap:12}}>

      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <div style={{flex:1}}>
          <span style={{fontSize:15,fontWeight:700,color:"#1D1D1B"}}>
            {inspecteurs.length} inspecteur{inspecteurs.length!==1?"s":""}
          </span>
        </div>
        <ExcelImportPanel type="inspecteurs" templateFile="/template_inspecteurs.xlsx"
          fields={[{key:"prenom",label:"Prénom",required:true},{key:"nom",label:"Nom",required:true},{key:"date",label:"Date d'entrée",required:false},{key:"stations",label:"Stations (|)",required:false}]}
          onImport={importInspecteurs}/>
        {hasPerm(perms,"inspecteurs","inspecteurs","creer") && (
          <button onClick={openNew}
            style={{display:"flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:10,
              background:"#5F3876",color:"white",border:"none",fontWeight:700,fontSize:13,
              cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>
            ＋ Nouvel inspecteur
          </button>
        )}
      </div>

      {inspecteurs.length===0 && (
        <div style={{textAlign:"center",padding:"48px 0",color:"#9F8EAE"}}>
          <div style={{fontSize:40,marginBottom:10}}>👤</div>
          <div style={{fontSize:15,fontWeight:600,color:"#5F3876",marginBottom:6}}>Aucun inspecteur configuré</div>
          <div style={{fontSize:13,marginBottom:20}}>Ajoutez votre premier inspecteur.</div>
          {hasPerm(perms,"inspecteurs","inspecteurs","creer") && (
            <button onClick={openNew} style={{padding:"10px 24px",borderRadius:10,background:"#5F3876",color:"white",border:"none",fontWeight:700,fontSize:14,cursor:"pointer"}}>
              ＋ Ajouter un inspecteur
            </button>
          )}
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {inspecteurs.map(insp=>{
          const isOpen=expandId===insp.id;
          const stationsN=(insp.stations||[]).length;
          return (
            <div key={insp.id} style={{background:"white",borderRadius:12,
              border:`1px solid ${isOpen?"#5F3876":"#F0EBF7"}`,
              overflow:"hidden",transition:"border-color .2s",
              boxShadow:isOpen?"0 2px 12px rgba(95,56,118,0.1)":"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",cursor:"pointer"}}
                onClick={()=>setExpand(id=>id===insp.id?null:insp.id)}>
                <div style={{width:40,height:40,borderRadius:"50%",background:"#F5F0FA",border:"2px solid #C9B8DC",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#5F3876",flexShrink:0}}>
                  {insp.prenom[0]}{insp.nom[0]}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,color:"#1D1D1B"}}>{insp.prenom} {insp.nom}</div>
                  <div style={{fontSize:12,color:"#9F8EAE",marginTop:1}}>
                    {insp.dateEntree?"Depuis le "+new Date(insp.dateEntree).toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"}):"Date non renseignée"}
                  </div>
                </div>
                {stationsN>0 && (
                  <div style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"#F5F0FA",border:"1px solid #C9B8DC",color:"#7A5499",fontWeight:600,flexShrink:0}}>
                    ⛽ {stationsN}
                  </div>
                )}
                <span style={{color:"#C9B8DC",fontSize:12,transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s",flexShrink:0}}>▼</span>
              </div>
              {isOpen && (
                <div style={{borderTop:"1px solid #F0EBF7",padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
                  {stationsN>0 && (
                    <div style={{background:"#FDFAF6",borderRadius:8,padding:"10px 12px",border:"1px solid #F0EBF7"}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#5F3876",textTransform:"uppercase",marginBottom:6}}>⛽ Stations</div>
                      <div style={{display:"flex",flexDirection:"column",gap:4}}>
                        {(insp.stations||[]).map((name,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#1D1D1B"}}>
                            <div style={{width:6,height:6,borderRadius:"50%",background:"#5F3876",flexShrink:0}}/>
                            {name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{display:"flex",gap:7,justifyContent:"flex-end",paddingTop:4,borderTop:"1px solid #F0EBF7"}}>
                    {hasPerm(perms,"inspecteurs","inspecteurs","modifier") && (
                      <button onClick={()=>startEdit(insp)} style={{padding:"6px 14px",borderRadius:8,border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:13}}>✏️ Modifier</button>
                    )}
                    {hasPerm(perms,"inspecteurs","inspecteurs","supprimer") && (
                      <button onClick={()=>del(insp.id)} style={{padding:"6px 14px",borderRadius:8,border:"1px solid #fee2e2",background:"#fff5f5",cursor:"pointer",fontSize:13,color:"#ef4444"}}>🗑️ Supprimer</button>
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
            <div style={{padding:"20px 24px 16px",borderBottom:"1px solid #F0EBF7",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:"#5F3876",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,color:"white",fontWeight:700}}>
                {form.prenom?form.prenom[0]:"👤"}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:16,color:"#1D1D1B"}}>{editId?"Modifier l'inspecteur":"Nouvel inspecteur"}</div>
                <div style={{fontSize:11,color:"#9F8EAE",marginTop:1}}>Identité et affectations</div>
              </div>
              <button onClick={cancel} style={{border:"none",background:"none",fontSize:22,cursor:"pointer",color:"#9F8EAE",padding:4,lineHeight:1}}>×</button>
            </div>
            <div style={{padding:"16px 24px 24px",display:"flex",flexDirection:"column",gap:14,maxHeight:"70vh",overflowY:"auto"}}>
              {sectionHead("👤 Identité")}
              <div className="form-grid-2">
                <div><label style={labelStyle}>Prénom *</label><input value={form.prenom} onChange={e=>F("prenom",e.target.value)} placeholder="Ex: Jean" style={fieldStyle}/></div>
                <div><label style={labelStyle}>Nom *</label><input value={form.nom} onChange={e=>F("nom",e.target.value)} placeholder="Ex: Dupont" style={fieldStyle}/></div>
                <div><label style={labelStyle}>Date d'entrée</label><input type="date" value={form.dateEntree} onChange={e=>F("dateEntree",e.target.value)} style={fieldStyle}/></div>
              </div>
              {sectionHead("⛽ Stations rattachées")}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {sites.map(s=>{
                  const checked=form.stations.includes(s.name);
                  return (
                    <label key={s.id} onClick={()=>toggleStation(s.name)}
                      style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,cursor:"pointer",
                        border:`1px solid ${checked?"#5F3876":"#e2e8f0"}`,background:checked?"#F5F0FA":"#FDFAF6",
                        transition:"all .15s",userSelect:"none"}}>
                      <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${checked?"#5F3876":"#C9B8DC"}`,
                        background:checked?"#5F3876":"white",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {checked && <span style={{color:"white",fontSize:10,fontWeight:900,lineHeight:1}}>✓</span>}
                      </div>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,color:"#1D1D1B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name.replace("Station ","")}</div>
                        <div style={{fontSize:10,color:"#9F8EAE"}}>{s.code}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {sites.length===0 && <div style={{fontSize:13,color:"#9F8EAE",fontStyle:"italic"}}>Aucun site configuré — ajoutez des sites d'abord.</div>}
              <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid #F0EBF7",paddingTop:14,marginTop:4}}>
                <button onClick={cancel} style={{padding:"9px 18px",borderRadius:9,border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:13,fontWeight:500}}>Annuler</button>
                {(editId?hasPerm(perms,"inspecteurs","inspecteurs","modifier"):hasPerm(perms,"inspecteurs","inspecteurs","creer")) && (
                  <button onClick={save} style={{padding:"9px 22px",borderRadius:9,background:"#5F3876",color:"white",border:"none",fontWeight:700,cursor:"pointer",fontSize:13}}>
                    {editId?"✓ Enregistrer":"➕ Ajouter l'inspecteur"}
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
