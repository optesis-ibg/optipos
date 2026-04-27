import { useState } from "react";
import StatusBadge from "./StatusBadge.jsx";
import TabInventaire from "./TabInventaire.jsx";
import TabRecette from "./TabRecette.jsx";
import TabReconciliation from "./TabReconciliation.jsx";
import TabBilan from "./TabBilan.jsx";
import TabInspectionControle from "./TabInspectionControle.jsx";

export default function ControleDetail({ controle: initControle, onSave, onClose, onDelete, history=[], setHistory, produits=[], questions=[], cats=[] }) {
  const [controle, setControle] = useState(initControle);
  const [subTab,   setSubTab]   = useState("inventaire");
  const [saving,   setSaving]   = useState(false);
  const [clotureDone, setClotureDone] = useState(false);

  const handleSave = (statut) => {
    setSaving(true);
    const isCloture = (statut||controle.statut) === "cloture" && controle.statut !== "cloture";
    const updated = {...controle, statut: statut||controle.statut, updatedAt: new Date().toISOString()};
    setTimeout(() => {
      onSave(updated);
      setSaving(false);
      if(isCloture) setClotureDone(true);
    }, 300);
  };

  const subTabs = [
    {id:"inventaire",    label:"Inventaire",    icon:"📦"},
    {id:"recette",       label:"Recette",        icon:"💰"},
    {id:"reconciliation",label:"Réconciliation", icon:"⚖️"},
    {id:"bilan",         label:"Bilan",          icon:"📊"},
    {id:"inspection",    label:"Inspection",     icon:"📋"},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{background:"white",borderBottom:"1px solid #F0EBF7",padding:"10px 14px",
        display:"flex",alignItems:"center",gap:8,flexShrink:0,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,width:"100%",minWidth:0}}>
          <button onClick={onClose}
            style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",borderRadius:8,
              border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:12,fontWeight:600,
              color:"#475569",flexShrink:0}}>
            ← <span className="subtab-label">Retour</span>
          </button>
          {onDelete && (
            <button onClick={()=>{if(window.confirm("Supprimer définitivement ce contrôle ?"))onDelete(controle.id);}}
              style={{padding:"6px 9px",borderRadius:8,border:"1px solid #fee2e2",background:"#fff5f5",
                color:"#ef4444",fontSize:12,cursor:"pointer",flexShrink:0}}>
              🗑️
            </button>
          )}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:14,color:"#1D1D1B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {controle.site?.replace("Station ","")}
            </div>
            <div style={{fontSize:10,color:"#9F8EAE",marginTop:1,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
              <span>{controle.dateControle?new Date(controle.dateControle).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}):""}</span>
              <StatusBadge s={controle.statut}/>
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            {clotureDone && (
              <div style={{padding:"5px 10px",borderRadius:8,background:"#f0fdf4",border:"1px solid #bbf7d0",
                fontSize:11,color:"#166534",fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
                ✅ <span className="subtab-label">Index mis à jour</span>
              </div>
            )}
            <button onClick={()=>handleSave()} disabled={saving}
              style={{padding:"6px 12px",borderRadius:8,border:"1px solid #C9B8DC",background:"white",
                color:"#5F3876",fontWeight:600,fontSize:12,cursor:"pointer",flexShrink:0}}>
              💾 <span className="subtab-label">Enregistrer</span>
            </button>
            {controle.statut!=="cloture" && (
              <button onClick={()=>handleSave("cloture")} disabled={saving}
                style={{padding:"6px 12px",borderRadius:8,border:"none",background:"#5F3876",
                  color:"white",fontWeight:700,fontSize:12,cursor:"pointer",flexShrink:0}}>
                ✅ <span className="subtab-label">Clôturer</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {controle.statut==="cloture" && (
        <div style={{background:"#f0fdf4",borderBottom:"1px solid #bbf7d0",padding:"8px 20px",
          display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#166534",fontWeight:600,flexShrink:0}}>
          <span style={{fontSize:16}}>🔒</span>
          Ce contrôle est clôturé — les données sont en lecture seule.
        </div>
      )}

      <div style={{background:"white",borderBottom:"1px solid #F0EBF7",flexShrink:0,
        overflowX:"auto",WebkitOverflowScrolling:"touch",
        scrollbarWidth:"none",msOverflowStyle:"none"}}>
        <div style={{display:"flex",gap:0,minWidth:"max-content",padding:"0 8px"}}>
          {subTabs.map(t=>(
            <button key={t.id} onClick={()=>setSubTab(t.id)}
              style={{padding:"10px 12px",border:"none",background:"transparent",cursor:"pointer",
                fontFamily:"inherit",fontSize:13,fontWeight:subTab===t.id?700:400,
                color:subTab===t.id?"#5F3876":"#9F8EAE",
                borderBottom:subTab===t.id?"2px solid #5F3876":"2px solid transparent",
                transition:"all .15s",whiteSpace:"nowrap",outline:"none",flexShrink:0}}>
              <span style={{fontSize:15}}>{t.icon}</span>
              <span className="subtab-label" style={{marginLeft:5}}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"16px 20px",background:"#FDFAF6"}}>
        {subTab==="inventaire"     && <TabInventaire     controle={controle} setControle={setControle}/>}
        {subTab==="recette"        && <TabRecette        controle={controle} setControle={setControle} produits={produits}/>}
        {subTab==="reconciliation" && <TabReconciliation controle={controle}/>}
        {subTab==="bilan"          && <TabBilan          controle={controle} produits={produits}/>}
        {subTab==="inspection"     && <TabInspectionControle controle={controle} setControle={setControle} history={history} setHistory={setHistory} questions={questions} cats={cats}/>}
      </div>
    </div>
  );
}
