import { useState } from "react";
import StatusBadge from "./StatusBadge.jsx";
import ControleDetail from "./ControleDetail.jsx";
import { createControle, updateControle, deleteControle, updateActif } from "../../api.js";

export default function StockControleTab({ sites, perms={}, history=[], setHistory, actifs=[], setActifs, controles=[], setControles, produits=[], questions=[], cats=[] }) {
  const [view,        setView]       = useState("list");
  const [selected,    setSelected]   = useState(null);
  const [showNewForm, setShowNewForm]= useState(false);
  const [newForm,     setNewForm]    = useState({site:"",dateControle:new Date().toISOString().split("T")[0],notes:""});

  const _createControle = async () => {
    if(!newForm.site){alert("Veuillez sélectionner une station.");return;}
    const allActifs = actifs.filter(a=>a.site===newForm.site);
    const pompes = allActifs.filter(a=>a.categorie==="pompes").map(a=>({
      actifId:a.id,nom:a.nom,serie:a.serie||"",produit:a.produit||"",
      cuveRattachee:a.cuveRattachee||"",indexDepart:a.indexActuel||"",indexArrivee:"",
    }));
    const cuves = allActifs.filter(a=>a.categorie==="cuves").map(a=>({
      actifId:a.id,nom:a.nom,serie:a.serie||"",produit:a.produit||"",
      stockInitial:a.indexActuel||"",receptionManuelle:"",stockPhysique:"",
    }));
    const ctrl = {
      id:Date.now(),site:newForm.site,dateControle:newForm.dateControle,
      notes:newForm.notes,statut:"en_cours",pompes,cuves,recette:[],paiements:{},
    };
    try {
      const saved = await createControle(ctrl);
      setControles(prev=>[saved,...prev]);
      setSelected(saved);
      setView("detail");
      setShowNewForm(false);
      setNewForm({site:"",dateControle:new Date().toISOString().split("T")[0],notes:""});
    } catch(err) { alert(err.message); }
  };

  const saveControle = async (updated) => {
    try {
      const saved = await updateControle(updated.id, updated);
      setControles(prev=>prev.map(c=>c.id===updated.id?saved:c));
      setSelected(saved);
      if(updated.statut==="cloture") {
        const updates = [];
        actifs.forEach(actif => {
          if(actif.categorie==="pompes") {
            const p = (updated.pompes||[]).find(p=>p.actifId===actif.id);
            if(p && p.indexArrivee!=="" && p.indexArrivee!==undefined)
              updates.push(updateActif(actif.id,{...actif,indexActuel:p.indexArrivee})
                .then(u=>setActifs(prev=>prev.map(x=>x.id===actif.id?u:x))));
          }
          if(actif.categorie==="cuves") {
            const c = (updated.cuves||[]).find(c=>c.actifId===actif.id);
            if(c && c.stockPhysique!=="" && c.stockPhysique!==undefined)
              updates.push(updateActif(actif.id,{...actif,indexActuel:c.stockPhysique})
                .then(u=>setActifs(prev=>prev.map(x=>x.id===actif.id?u:x))));
          }
        });
        await Promise.all(updates);
      }
    } catch(err) { alert(err.message); }
  };

  const delControle = async (id) => {
    if(!window.confirm("Supprimer ce contrôle ?")) return;
    try { await deleteControle(id); setControles(prev=>prev.filter(c=>c.id!==id)); } catch(err) { alert(err.message); }
  };

  const fieldStyle = {width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,boxSizing:"border-box",fontFamily:"inherit",outline:"none",background:"white"};
  const labelStyle = {fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.4};

  if(view==="detail" && selected) return (
    <div style={{height:"calc(100vh - 120px)",display:"flex",flexDirection:"column"}}>
      <ControleDetail
        controle={controles.find(c=>c.id===selected.id)||selected}
        onSave={saveControle}
        onDelete={id=>{delControle(id);setView("list");setSelected(null);}}
        onClose={()=>{setView("list");setSelected(null);}}
        history={history}
        setHistory={setHistory}
        produits={produits}
        questions={questions}
        cats={cats}/>
    </div>
  );

  return (
    <div style={{padding:14,display:"flex",flexDirection:"column",gap:12}}>

      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <div style={{flex:1}}>
          <span style={{fontSize:15,fontWeight:700,color:"#1D1D1B"}}>
            {controles.length} contrôle{controles.length!==1?"s":" "} de stock
          </span>
        </div>
        <button onClick={()=>setShowNewForm(true)}
          style={{display:"flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:10,
            background:"#5F3876",color:"white",border:"none",fontWeight:700,fontSize:13,
            cursor:"pointer",whiteSpace:"nowrap"}}>
          ＋ Nouveau contrôle
        </button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {[
          {l:"Total",    v:controles.length,                                   c:"#1D1D1B"},
          {l:"En cours", v:controles.filter(c=>c.statut==="en_cours").length,   c:"#92400e"},
          {l:"Clôturés", v:controles.filter(c=>c.statut==="cloture").length,    c:"#166534"},
        ].map(({l,v,c})=>(
          <div key={l} style={{background:"white",borderRadius:10,padding:"10px 12px",border:"1px solid #F0EBF7",textAlign:"center"}}>
            <div style={{fontSize:9,color:"#9F8EAE",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>{l}</div>
            <div style={{fontSize:22,fontWeight:800,color:c}}>{v}</div>
          </div>
        ))}
      </div>

      {controles.length===0 && (
        <div style={{textAlign:"center",padding:"48px 0",color:"#9F8EAE"}}>
          <div style={{fontSize:40,marginBottom:10}}>📊</div>
          <div style={{fontSize:15,fontWeight:600,color:"#5F3876",marginBottom:6}}>Aucun contrôle de stock</div>
          <div style={{fontSize:13,marginBottom:20}}>Créez votre premier contrôle pour commencer le suivi.</div>
          <button onClick={()=>setShowNewForm(true)} style={{padding:"10px 24px",borderRadius:10,background:"#5F3876",color:"white",border:"none",fontWeight:700,fontSize:14,cursor:"pointer"}}>
            ＋ Nouveau contrôle
          </button>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {controles.map(c=>(
          <div key={c.id} style={{background:"white",borderRadius:12,border:"1px solid #F0EBF7",
            display:"flex",alignItems:"center",gap:0,
            transition:"border-color .15s,box-shadow .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#5F3876";e.currentTarget.style.boxShadow="0 2px 12px rgba(95,56,118,0.1)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#F0EBF7";e.currentTarget.style.boxShadow="none";}}>
            <div style={{flex:1,display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer",minWidth:0}}
              onClick={()=>{setSelected(c);setView("detail");}}>
              <div style={{width:44,height:44,borderRadius:11,background:"#F5F0FA",border:"1px solid #C9B8DC",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📊</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14,color:"#1D1D1B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {c.site?.replace("Station ","")}
                </div>
                <div style={{fontSize:12,color:"#9F8EAE",marginTop:2,display:"flex",gap:10,flexWrap:"wrap"}}>
                  <span>📅 {c.dateControle?new Date(c.dateControle).toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"}):""}</span>
                  <span>⛽ {(c.pompes||[]).length} pompe{(c.pompes||[]).length!==1?"s":""}</span>
                  <span>🛢️ {(c.cuves||[]).length} cuve{(c.cuves||[]).length!==1?"s":""}</span>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5,flexShrink:0}}>
                <StatusBadge s={c.statut}/>
              </div>
              <span style={{color:"#C9B8DC",fontSize:14,flexShrink:0,marginLeft:4}}>›</span>
            </div>
            <button
              onClick={e=>{e.stopPropagation();delControle(c.id);}}
              style={{padding:"6px 10px",marginRight:12,borderRadius:7,border:"1px solid #fee2e2",
                background:"#fff5f5",color:"#ef4444",fontSize:12,cursor:"pointer",flexShrink:0,
                lineHeight:1,display:"flex",alignItems:"center"}}>
              🗑️
            </button>
          </div>
        ))}
      </div>

      {showNewForm && (
        <div className="modal-overlay" onClick={()=>setShowNewForm(false)}>
          <div className="modal-box" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"20px 24px 16px",borderBottom:"1px solid #F0EBF7",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:10,background:"#5F3876",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>📊</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:16,color:"#1D1D1B"}}>Nouveau contrôle de stock</div>
                <div style={{fontSize:11,color:"#9F8EAE",marginTop:1}}>Les actifs de la station seront chargés automatiquement</div>
              </div>
              <button onClick={()=>setShowNewForm(false)} style={{border:"none",background:"none",fontSize:22,cursor:"pointer",color:"#9F8EAE",padding:4,lineHeight:1}}>×</button>
            </div>
            <div style={{padding:"16px 24px 24px",display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={labelStyle}>Station *</label>
                <select value={newForm.site} onChange={e=>setNewForm(f=>({...f,site:e.target.value}))} style={fieldStyle}>
                  <option value="">-- Sélectionner une station --</option>
                  {sites.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                {newForm.site && (()=>{
                  const a=actifs.filter(x=>x.site===newForm.site);
                  const p=a.filter(x=>x.categorie==="pompes").length;
                  const c=a.filter(x=>x.categorie==="cuves").length;
                  return <div style={{marginTop:6,fontSize:12,color:"#7A5499",background:"#F5F0FA",padding:"6px 10px",borderRadius:7,border:"1px solid #C9B8DC"}}>
                    ⛽ {p} pompe{p!==1?"s":""} · 🛢️ {c} cuve{c!==1?"s":""} trouvée{(p+c)!==1?"s":""}
                  </div>;
                })()}
              </div>
              <div>
                <label style={labelStyle}>Date du contrôle *</label>
                <input type="date" value={newForm.dateControle} onChange={e=>setNewForm(f=>({...f,dateControle:e.target.value}))} style={fieldStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea value={newForm.notes} onChange={e=>setNewForm(f=>({...f,notes:e.target.value}))}
                  placeholder="Observations, contexte du contrôle..."
                  style={{...fieldStyle,minHeight:60,resize:"vertical"}}/>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid #F0EBF7",paddingTop:14,marginTop:4}}>
                <button onClick={()=>setShowNewForm(false)} style={{padding:"9px 18px",borderRadius:9,border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:13}}>Annuler</button>
                <button onClick={_createControle} style={{padding:"9px 22px",borderRadius:9,background:"#5F3876",color:"white",border:"none",fontWeight:700,cursor:"pointer",fontSize:13}}>
                  ➕ Créer le contrôle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
