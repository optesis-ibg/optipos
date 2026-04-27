const ASSET_CATEGORIES = [
  { id:"pompes",       label:"Pompes à carburant",      icon:"⛽" },
  { id:"cuves",        label:"Cuves de stockage",        icon:"🛢️" },
  { id:"compteurs",    label:"Compteurs & mesureurs",    icon:"🔢" },
  { id:"securite",     label:"Équipements de sécurité",  icon:"🧯" },
  { id:"electrique",   label:"Électrique & éclairage",   icon:"⚡" },
  { id:"informatique", label:"Informatique & terminaux",  icon:"💻" },
  { id:"vehicules",    label:"Véhicules & engins",        icon:"🚗" },
  { id:"autre",        label:"Autre",                     icon:"🔧" },
];

const ASSET_STATUSES = [
  { id:"actif",        label:"En service",    color:"#70BC80", bg:"#f0fdf4" },
  { id:"maintenance",  label:"En maintenance", color:"#FFDE90", bg:"#fffbeb" },
  { id:"hors_service", label:"Hors service",   color:"#E94C57", bg:"#fff5f5" },
  { id:"reserve",      label:"En réserve",     color:"#9F8EAE", bg:"#F5F0FA" },
];
const assetStatusInfo = id => ASSET_STATUSES.find(s=>s.id===id) || ASSET_STATUSES[0];

export { ASSET_CATEGORIES, ASSET_STATUSES, assetStatusInfo };

export default function AssetCard({ a, allActifs=[], expandId, setExpand, startEdit, del, perms={} }) {
  const isOpen = expandId===a.id;
  const cat    = ASSET_CATEGORIES.find(c=>c.id===a.categorie);
  const stat   = assetStatusInfo(a.statut);
  const consommation = (a.indexActuel && a.indexInitial)
    ? Math.max(0, parseFloat(a.indexActuel)-parseFloat(a.indexInitial)).toLocaleString("fr-FR")
    : null;

  const maintAlert = a.dateMaintenance && (() => {
    const diff = (Date.now() - new Date(a.dateMaintenance).getTime()) / 86400000;
    return diff > 365 ? "⚠️ Maintenance > 1 an" : diff > 180 ? "⏰ Maintenance > 6 mois" : null;
  })();

  return (
    <div style={{background:"white",borderRadius:11,
      border:`1px solid ${isOpen?"#5F3876":"#F0EBF7"}`,
      overflow:"hidden",transition:"border-color .15s",
      boxShadow:isOpen?"0 2px 12px rgba(95,56,118,0.1)":"none"}}>

      <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",cursor:"pointer"}}
        onClick={()=>setExpand(id=>id===a.id?null:a.id)}>
        <div style={{width:38,height:38,borderRadius:9,background:stat.bg,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,
          border:`1px solid ${stat.color}40`}}>
          {cat?.icon||"🔧"}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:13,color:"#1D1D1B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {a.nom||"—"}
          </div>
          <div style={{fontSize:11,color:"#9F8EAE",marginTop:1,display:"flex",gap:8,flexWrap:"wrap"}}>
            <span>{a.site?.replace("Station ","") || "—"}</span>
            {a.marque && <span>· {a.marque}</span>}
            {a.serie  && <span style={{fontFamily:"monospace"}}>· {a.serie}</span>}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3,flexShrink:0}}>
          <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:stat.bg,
            color:stat.color,fontWeight:700,border:`1px solid ${stat.color}40`}}>
            {stat.label}
          </span>
          {cat && <span style={{fontSize:10,color:"#9F8EAE"}}>{cat.label}</span>}
        </div>
        <span style={{color:"#C9B8DC",fontSize:12,transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s",flexShrink:0,marginLeft:4}}>▼</span>
      </div>

      {isOpen && (
        <div style={{borderTop:"1px solid #F0EBF7",padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
          {maintAlert && (
            <div style={{padding:"7px 12px",borderRadius:8,background:"#fffbeb",border:"1px solid #fde68a",fontSize:12,color:"#92400e",fontWeight:600}}>
              {maintAlert}
            </div>
          )}
          {a.categorie==="pompes" && a.cuveRattachee && (
            <div style={{background:"#F5F0FA",borderRadius:8,padding:"9px 12px",border:"1px solid #C9B8DC",
              display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:16,flexShrink:0}}>🛢️</span>
              <div>
                <div style={{fontSize:10,color:"#9F8EAE",fontWeight:700,textTransform:"uppercase",marginBottom:1}}>Cuve rattachée</div>
                <div style={{fontSize:13,fontWeight:700,color:"#5F3876"}}>{a.cuveRattachee}</div>
              </div>
            </div>
          )}
          {a.categorie==="cuves" && (() => {
            const pompes = allActifs.filter(p=>p.categorie==="pompes"&&p.cuveRattachee===a.nom);
            if(!pompes.length) return null;
            return (
              <div style={{background:"#F5F0FA",borderRadius:8,padding:"9px 12px",border:"1px solid #C9B8DC"}}>
                <div style={{fontSize:10,color:"#9F8EAE",fontWeight:700,textTransform:"uppercase",marginBottom:7}}>
                  ⛽ Pompes rattachées ({pompes.length})
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {pompes.map(p=>(
                    <span key={p.id} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",
                      borderRadius:20,background:"white",border:"1px solid #C9B8DC",fontSize:12}}>
                      <span style={{fontSize:13}}>⛽</span>
                      <div>
                        <div style={{fontWeight:600,color:"#1D1D1B",lineHeight:1.2}}>{p.nom}</div>
                        {p.produit && <div style={{fontSize:10,color:"#9F8EAE"}}>📦 {p.produit}</div>}
                      </div>
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}
          <div className="form-grid-2">
            {[
              ["📂 Catégorie", cat?.label||"—"],
              ["🔧 Type", a.type||"—"],
              a.produit ? ["📦 Produit", a.produit] : null,
              ["🏷️ Marque", a.marque||"—"],
              ["🔢 N° Série", a.serie||"—"],
            ].filter(Boolean).map(([l,v])=>(
              <div key={l}>
                <div style={{fontSize:10,color:"#9F8EAE",fontWeight:700,textTransform:"uppercase",marginBottom:2}}>{l}</div>
                <div style={{fontSize:13,color:"#1D1D1B",fontWeight:500,fontFamily:l.includes("Série")?"monospace":"inherit"}}>{v}</div>
              </div>
            ))}
          </div>
          {(a.indexInitial||a.indexActuel) && (
            <div style={{background:"#FDFAF6",borderRadius:8,padding:"10px 12px",border:"1px solid #F0EBF7"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#5F3876",textTransform:"uppercase",marginBottom:8}}>📊 Index & consommation</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[["Index initial", a.indexInitial||"—"],["Index actuel", a.indexActuel||"—"],["Consommation", consommation?consommation+" L":"—"]].map(([l,v])=>(
                  <div key={l} style={{textAlign:"center",padding:"6px 8px",borderRadius:7,background:"white",border:"1px solid #F0EBF7"}}>
                    <div style={{fontSize:9,color:"#9F8EAE",fontWeight:700,textTransform:"uppercase",marginBottom:3}}>{l}</div>
                    <div style={{fontSize:15,fontWeight:700,color:"#5F3876"}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="form-grid-2">
            {a.codeBarre && (
              <div>
                <div style={{fontSize:10,color:"#9F8EAE",fontWeight:700,textTransform:"uppercase",marginBottom:2}}>🔍 Code-barres</div>
                <div style={{fontSize:13,fontFamily:"monospace",color:"#1D1D1B",background:"#FDFAF6",padding:"4px 8px",borderRadius:6,border:"1px solid #F0EBF7",display:"inline-block"}}>{a.codeBarre}</div>
              </div>
            )}
            {a.dateMaintenance && (
              <div>
                <div style={{fontSize:10,color:"#9F8EAE",fontWeight:700,textTransform:"uppercase",marginBottom:2}}>🔧 Dernière maintenance</div>
                <div style={{fontSize:13,color:"#1D1D1B",fontWeight:500}}>
                  {new Date(a.dateMaintenance).toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})}
                </div>
              </div>
            )}
          </div>
          {a.notes && (
            <div style={{padding:"8px 10px",borderRadius:8,background:"#FDFAF6",border:"1px dashed #C9B8DC",fontSize:12,color:"#475569"}}>
              💬 {a.notes}
            </div>
          )}
          <div style={{display:"flex",gap:7,justifyContent:"flex-end",paddingTop:4,borderTop:"1px solid #F0EBF7"}}>
            <button onClick={()=>startEdit(a)} style={{padding:"6px 14px",borderRadius:8,border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:13}}>✏️ Modifier</button>
            <button onClick={()=>del(a.id)}    style={{padding:"6px 14px",borderRadius:8,border:"1px solid #fee2e2",background:"#fff5f5",cursor:"pointer",fontSize:13,color:"#ef4444"}}>🗑️ Supprimer</button>
          </div>
        </div>
      )}
    </div>
  );
}
