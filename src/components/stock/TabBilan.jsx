import { useMemo } from "react";

export default function TabBilan({ controle, produits=[] }) {
  const { pompes=[], cuves=[], recette=[], site="", dateControle="" } = controle;

  const byProduct = useMemo(()=>{
    const map = {};
    pompes.forEach(p=>{
      if(!p.produit)return;
      const vol=(p.indexArrivee!==undefined&&p.indexArrivee!==""&&p.indexDepart!==undefined&&p.indexDepart!=="")
        ?Math.max(0,parseFloat(p.indexArrivee||0)-parseFloat(p.indexDepart||0)):0;
      if(!map[p.produit])map[p.produit]={produit:p.produit,volume:0,pompes:[]};
      map[p.produit].volume+=vol; map[p.produit].pompes.push(p.nom);
    });
    return Object.values(map);
  },[pompes]);

  const getPrix=(produitNom)=>{
    const pMatch = pompes.find(p=>p.produit===produitNom);
    if(pMatch){const ru=(recette.find(r=>r.key===pMatch.actifId)||{}).prixUnitaire;if(ru)return{prix:parseFloat(ru),devise:"FCFA"};}
    const p=produits.find(x=>x.nom===produitNom); if(!p)return null;
    const today=new Date().toISOString().split("T")[0];
    const active=(p.prix||[]).filter(x=>x.dateDebut<=today&&(!x.dateFin||x.dateFin>=today));
    return active.length?active.sort((a,b)=>b.dateDebut.localeCompare(a.dateDebut))[0]:null;
  };

  const totalVol   = byProduct.reduce((s,b)=>s+b.volume,0);
  const totalRec   = byProduct.reduce((s,b)=>{
    const px=getPrix(b.produit); const vc=parseFloat((recette.find(r=>r.produit===b.produit)||{}).venteComptoir||0);
    return s+b.volume*(px?parseFloat(px.prix):0)+vc;
  },0);
  const totalEcart = cuves.reduce((s,c)=>{
    if(c.stockPhysique===undefined||c.stockPhysique==="") return s;
    const si=parseFloat(c.stockInitial||0);
    const rm=parseFloat(c.receptionManuelle||0);
    const pLiees=pompes.filter(p=>p.cuveRattachee===c.nom);
    const la=pLiees.reduce((a,p)=>a+Math.max(0,parseFloat(p.indexArrivee||0)-parseFloat(p.indexDepart||0)),0);
    return s+((si+rm+la)-parseFloat(c.stockPhysique||0));
  },0);

  const sc = p => p>=85?"#70BC80":p>=65?"#7A5499":p>=40?"#E94C57":"#633F0F";

  const kpiCard=(icon,label,value,sub,color="#1D1D1B",bg="white")=>(
    <div style={{background:bg,borderRadius:12,padding:"14px 16px",border:"1px solid #F0EBF7",flex:1,minWidth:130}}>
      <div style={{fontSize:11,color:"#9F8EAE",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:4,display:"flex",alignItems:"center",gap:5}}>
        <span>{icon}</span>{label}
      </div>
      <div style={{fontSize:22,fontWeight:800,color,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:10,color:"#9F8EAE",marginTop:4}}>{sub}</div>}
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{background:"linear-gradient(135deg,#5F3876,#7A5499)",borderRadius:14,padding:"20px 24px",color:"white"}}>
        <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>Bilan du contrôle</div>
        <div style={{fontSize:12,opacity:.8}}>{site} · {dateControle?new Date(dateControle).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}):""}</div>
      </div>

      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {kpiCard("⛽","Produits contrôlés",byProduct.length+" produit"+(byProduct.length!==1?"s":""),"",  "#5F3876","#F5F0FA")}
        {kpiCard("📊","Volume total",totalVol.toLocaleString("fr-FR",{minimumFractionDigits:1})+" L","Tous produits confondus","#166534","#f0fdf4")}
        {kpiCard("💰","Recette totale",totalRec.toLocaleString("fr-FR",{maximumFractionDigits:0})+" FCFA","Ventes pompes + comptoir","#5F3876","white")}
        {kpiCard("⚖️","Écart global",+(totalEcart.toFixed(1))+" L","Pompes vs cuves",Math.abs(totalEcart)<50?"#166534":"#dc2626",Math.abs(totalEcart)<50?"#f0fdf4":"#fff5f5")}
      </div>

      <div style={{background:"white",borderRadius:12,border:"1px solid #F0EBF7",overflow:"hidden"}}>
        <div style={{background:"#F5F0FA",padding:"12px 16px",borderBottom:"1px solid #F0EBF7",fontWeight:700,fontSize:14,color:"#5F3876",display:"flex",alignItems:"center",gap:8}}>
          <span>📋</span> Synthèse par produit
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:560}}>
            <thead>
              <tr style={{background:"#FAF7FD"}}>
                {["Produit","Volume (L)","Prix unit.","Recette","Stock init.","Réc.","Livr. pompes","Stock final","Stock physique","Écart"].map((h,i)=>(
                  <th key={h} style={{fontSize:10,fontWeight:700,color:"#5F3876",textTransform:"uppercase",letterSpacing:.5,
                    padding:"8px 10px",borderBottom:"2px solid #F0EBF7",textAlign:i===0?"left":"right",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byProduct.map((b,i)=>{
                const px=getPrix(b.produit);
                const pu=px?parseFloat(px.prix):0;
                const vc=0;
                const recProd=b.volume*pu+vc;
                const cuve=cuves.find(c=>c.produit===b.produit);
                const si=cuve&&cuve.stockInitial!==""?parseFloat(cuve.stockInitial||0):null;
                const pLiees=cuve?pompes.filter(p=>p.cuveRattachee===cuve.nom):[];
                const la=pLiees.reduce((a,p)=>a+Math.max(0,parseFloat(p.indexArrivee||0)-parseFloat(p.indexDepart||0)),0);
                const rm_=cuve?parseFloat(cuve.receptionManuelle||0):0;
                const sfCalc=si!==null?si+rm_-la:null;
                const sPhys=cuve&&cuve.stockPhysique!==""&&cuve.stockPhysique!==undefined?parseFloat(cuve.stockPhysique||0):null;
                const ecartP=sfCalc!==null&&sPhys!==null?sPhys-sfCalc:null;
                const tdR={padding:"8px 10px",fontSize:12,borderBottom:"1px solid #FDFAF6",textAlign:"right",color:"#1D1D1B"};
                return (
                  <tr key={b.produit} style={{background:i%2===0?"white":"#FDFAF6"}}>
                    <td style={{...tdR,textAlign:"left",fontWeight:600,color:"#5F3876"}}>{b.produit}</td>
                    <td style={{...tdR,fontWeight:700}}>{b.volume.toLocaleString("fr-FR",{minimumFractionDigits:2})}</td>
                    <td style={tdR}>{pu?pu.toLocaleString("fr-FR"):"—"}</td>
                    <td style={{...tdR,fontWeight:700,color:"#166534"}}>{recProd.toLocaleString("fr-FR",{maximumFractionDigits:0})}</td>
                    <td style={tdR}>{si!==null?si.toLocaleString("fr-FR"):"—"}</td>
                    <td style={tdR}>{rm_?rm_.toLocaleString("fr-FR"):"—"}</td>
                    <td style={tdR}>{la?la.toLocaleString("fr-FR",{minimumFractionDigits:2}):"—"}</td>
                    <td style={{...tdR,background:"#FAF7FD",color:"#5F3876",fontWeight:600}}>{sfCalc!==null?sfCalc.toLocaleString("fr-FR",{minimumFractionDigits:1}):"—"}</td>
                    <td style={tdR}>{sPhys!==null?sPhys.toLocaleString("fr-FR",{minimumFractionDigits:1}):"—"}</td>
                    <td style={{...tdR,fontWeight:700,color:ecartP===null?"#C9B8DC":Math.abs(ecartP)<10?"#166534":Math.abs(ecartP)<50?"#92400e":"#dc2626"}}>
                      {ecartP!==null?<>{ecartP>0?"+":""}{ecartP.toLocaleString("fr-FR",{minimumFractionDigits:2})}</>:"—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
