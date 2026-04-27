import { useMemo } from "react";

export default function TabReconciliation({ controle }) {
  const { pompes=[], cuves=[] } = controle;

  const ventesPompes = useMemo(() => {
    const map = {};
    pompes.forEach(p => {
      if (!p.produit) return;
      const vol = (p.indexArrivee && p.indexDepart)
        ? Math.max(0, parseFloat(p.indexArrivee||0)-parseFloat(p.indexDepart||0)) : 0;
      map[p.produit] = (map[p.produit]||0) + vol;
    });
    return map;
  }, [pompes]);

  const varsCuves = useMemo(() => {
    const map = {};
    cuves.forEach(c => {
      if (!c.produit) return;
      if (c.stockPhysique===undefined||c.stockPhysique==="") return;
      const si = parseFloat(c.stockInitial||0);
      const rm = parseFloat(c.receptionManuelle||0);
      const pLiees = pompes.filter(p=>p.cuveRattachee===c.nom);
      const la = pLiees.reduce((a,p)=>a+Math.max(0,parseFloat(p.indexArrivee||0)-parseFloat(p.indexDepart||0)),0);
      const stockFinalCalc = si + rm - la;
      const variation = stockFinalCalc - parseFloat(c.stockPhysique||0);
      map[c.produit] = (map[c.produit]||0) + variation;
    });
    return map;
  }, [cuves, pompes]);

  const allProducts = [...new Set([...Object.keys(ventesPompes), ...Object.keys(varsCuves)])];

  const thStyle = {fontSize:10,fontWeight:700,color:"#5F3876",textTransform:"uppercase",
    letterSpacing:.5,padding:"10px 12px",borderBottom:"2px solid #F0EBF7",textAlign:"right",whiteSpace:"nowrap"};
  const tdStyle = {padding:"9px 12px",fontSize:13,color:"#1D1D1B",borderBottom:"1px solid #FDFAF6",textAlign:"right"};

  if(allProducts.length===0) return (
    <div style={{padding:"40px",textAlign:"center",color:"#9F8EAE"}}>
      <div style={{fontSize:32,marginBottom:10}}>⚖️</div>
      <div style={{fontSize:14,fontWeight:600,color:"#5F3876"}}>Aucune donnée à réconcilier</div>
      <div style={{fontSize:12,marginTop:6}}>Complétez l'inventaire (pompes et cuves) pour voir la réconciliation.</div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{background:"white",borderRadius:12,border:"1px solid #F0EBF7",overflow:"hidden"}}>
        <div style={{background:"#F5F0FA",padding:"12px 16px",borderBottom:"1px solid #F0EBF7",display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>⚖️</span>
          <span style={{fontWeight:700,fontSize:14,color:"#5F3876"}}>Réconciliation pompes ↔ cuves</span>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:560}}>
            <thead>
              <tr style={{background:"#FAF7FD"}}>
                <th style={{...thStyle,textAlign:"left"}}>Produit</th>
                <th style={thStyle}>Ventes pompes (L)</th>
                <th style={thStyle}>Sortie cuves (L)</th>
                <th style={{...thStyle,color:"#92400e"}}>Écart (L)</th>
                <th style={thStyle}>Écart (%)</th>
              </tr>
            </thead>
            <tbody>
              {allProducts.map((prod, i)=>{
                const vp = ventesPompes[prod]||0;
                const vc = varsCuves[prod]||0;
                const ecart = vp - vc;
                const pct = vc>0 ? ((ecart/vc)*100).toFixed(2) : null;
                const ok  = Math.abs(ecart) < 50;
                const ecartColor = Math.abs(ecart)<10?"#166534":Math.abs(ecart)<50?"#92400e":"#dc2626";
                return (
                  <tr key={prod} style={{background:i%2===0?"white":"#FDFAF6"}}>
                    <td style={{...tdStyle,textAlign:"left",fontWeight:600}}>{prod}</td>
                    <td style={tdStyle}>{vp.toLocaleString("fr-FR",{minimumFractionDigits:2})}</td>
                    <td style={tdStyle}>{vc>0?vc.toLocaleString("fr-FR",{minimumFractionDigits:2}):<span style={{color:"#C9B8DC"}}>—</span>}</td>
                    <td style={{...tdStyle,fontWeight:700,color:ecartColor,fontSize:14}}>
                      {ecart>0?"+":""}{ecart.toLocaleString("fr-FR",{minimumFractionDigits:2})}
                    </td>
                    <td style={{...tdStyle,color:ecartColor}}>
                      {pct!==null?<>{parseFloat(pct)>0?"+":""}{pct}%</>:<span style={{color:"#C9B8DC"}}>—</span>}
                      <span style={{marginLeft:6}}>{ok?"✅":"⚠️"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{padding:"12px 14px",borderRadius:10,background:"#F5F0FA",border:"1px solid #C9B8DC",fontSize:12,color:"#7A5499",display:"flex",gap:8}}>
        <span style={{fontSize:14,flexShrink:0}}>💡</span>
        <div><strong>Lecture :</strong> "Sortie cuves" = (Stock initial + Livraison) − Stock final. Un écart positif signifie plus vendu en pompe que sorti en cuve (manquant en cuve). Un écart négatif signifie plus sorti en cuve que vendu en pompe (surplus en pompe).</div>
      </div>
    </div>
  );
}
