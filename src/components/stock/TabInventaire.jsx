import { useMemo } from "react";

export default function TabInventaire({ controle, setControle }) {
  const { site, pompes=[], cuves=[] } = controle;
  const locked = controle.statut === "cloture";

  const setP = (idx, k, v) => { if(locked) return; setControle(c => { const arr = [...(c.pompes||[])]; arr[idx] = {...arr[idx], [k]: v}; return {...c, pompes: arr}; }); };
  const setC = (idx, k, v) => { if(locked) return; setControle(c => { const arr = [...(c.cuves||[])]; arr[idx] = {...arr[idx], [k]: v}; return {...c, cuves: arr}; }); };

  const volParProduit = useMemo(() => {
    const map = {};
    pompes.forEach(p => {
      if (!p.produit) return;
      const vol = (p.indexArrivee !== "" && p.indexArrivee !== undefined &&
                   p.indexDepart  !== "" && p.indexDepart  !== undefined)
        ? Math.max(0, parseFloat(p.indexArrivee||0) - parseFloat(p.indexDepart||0))
        : 0;
      map[p.produit] = (map[p.produit]||0) + vol;
    });
    return map;
  }, [pompes]);

  const inp = (val, onChange, placeholder="0", readOnly=false, highlight=false) => (
    <input type="number" step="0.01" value={val||""} onChange={e=>!readOnly&&onChange(e.target.value)}
      readOnly={readOnly}
      placeholder={readOnly ? "—" : placeholder}
      style={{width:"100%",padding:"7px 10px",borderRadius:8,fontSize:13,
        boxSizing:"border-box",fontFamily:"inherit",outline:"none",textAlign:"right",
        border: highlight ? "1.5px solid #5F3876" : "1px solid #e2e8f0",
        background: readOnly ? "#F5F0FA" : highlight ? "#FAF7FD" : "white",
        color: readOnly ? "#7A5499" : "#1D1D1B",
        cursor: readOnly ? "default" : "text",
        fontWeight: readOnly ? 700 : 400}}/>
  );

  const thStyle = {fontSize:10,fontWeight:700,color:"#5F3876",textTransform:"uppercase",
    letterSpacing:.5,padding:"8px 10px",borderBottom:"2px solid #F0EBF7",textAlign:"left",whiteSpace:"nowrap"};
  const tdStyle = {padding:"8px 10px",fontSize:13,color:"#1D1D1B",borderBottom:"1px solid #FDFAF6"};
  const tdNum   = {padding:"8px 6px",borderBottom:"1px solid #FDFAF6"};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

      <div style={{background:"white",borderRadius:12,border:"1px solid #F0EBF7",overflow:"hidden"}}>
        <div style={{background:"#F5F0FA",padding:"12px 16px",borderBottom:"1px solid #F0EBF7",
          display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>⛽</span>
          <span style={{fontWeight:700,fontSize:14,color:"#5F3876"}}>Index des pompes</span>
          <span style={{fontSize:11,color:"#9F8EAE",marginLeft:4}}>({pompes.length} pompe{pompes.length!==1?"s":""})</span>
        </div>
        {pompes.length===0
          ? <div style={{padding:"24px",textAlign:"center",color:"#9F8EAE",fontSize:13}}>
              Aucune pompe configurée pour la station <strong>{site}</strong>.<br/>
              <span style={{fontSize:11}}>Créez des actifs de type "Pompes à carburant" dans l'onglet Actifs.</span>
            </div>
          : <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:580}}>
                <thead>
                  <tr style={{background:"#FAF7FD"}}>
                    <th style={thStyle}>Pompe</th>
                    <th style={thStyle}>Produit</th>
                    <th style={{...thStyle,textAlign:"right"}}>Index départ</th>
                    <th style={{...thStyle,textAlign:"right"}}>Index arrivée</th>
                    <th style={{...thStyle,textAlign:"right",color:"#166534"}}>Volume (L)</th>
                  </tr>
                </thead>
                <tbody>
                  {pompes.map((p, i) => {
                    const vol = (p.indexArrivee !== "" && p.indexArrivee !== undefined &&
                                 p.indexDepart  !== "" && p.indexDepart  !== undefined)
                      ? Math.max(0, parseFloat(p.indexArrivee)-parseFloat(p.indexDepart)).toFixed(2)
                      : null;
                    return (
                      <tr key={p.actifId} style={{background:i%2===0?"white":"#FDFAF6"}}>
                        <td style={tdStyle}>
                          <div style={{fontWeight:600}}>{p.nom}</div>
                          {p.serie && <div style={{fontSize:10,color:"#9F8EAE",fontFamily:"monospace"}}>{p.serie}</div>}
                        </td>
                        <td style={{...tdStyle,color:"#7A5499",fontWeight:500}}>
                          {p.produit||<span style={{color:"#C9B8DC",fontStyle:"italic"}}>—</span>}
                        </td>
                        <td style={{...tdNum,background:"#FAF7FD"}}>
                          <div style={{fontSize:11,color:"#5F3876",textAlign:"right",marginBottom:2,fontWeight:600}}>Départ</div>
                          {inp(p.indexDepart, ()=>{}, "—", true, true)}
                        </td>
                        <td style={tdNum}>{inp(p.indexArrivee, v=>setP(i,"indexArrivee",v), "Index d'arrivée", locked)}</td>
                        <td style={{...tdNum,textAlign:"right"}}>
                          {vol!==null
                            ? <span style={{fontWeight:700,fontSize:15,color:parseFloat(vol)>=0?"#166534":"#dc2626"}}>
                                {parseFloat(vol).toLocaleString("fr-FR")}
                              </span>
                            : <span style={{color:"#C9B8DC"}}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {Object.keys(volParProduit).length > 0 && (
                  <tfoot>
                    {Object.entries(volParProduit).map(([prod,vol])=>(
                      <tr key={prod} style={{background:"#F5F0FA"}}>
                        <td colSpan={4} style={{...tdStyle,textAlign:"right",fontSize:11,fontWeight:700,color:"#5F3876",borderTop:"2px solid #C9B8DC"}}>
                          Total {prod} →
                        </td>
                        <td style={{...tdNum,textAlign:"right",borderTop:"2px solid #C9B8DC"}}>
                          <span style={{fontWeight:800,fontSize:15,color:"#166534"}}>
                            {vol.toLocaleString("fr-FR",{minimumFractionDigits:2})} L
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tfoot>
                )}
              </table>
            </div>
        }
      </div>

      <div style={{background:"white",borderRadius:12,border:"1px solid #F0EBF7",overflow:"hidden"}}>
        <div style={{background:"#F5F0FA",padding:"12px 16px",borderBottom:"1px solid #F0EBF7",
          display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>🛢️</span>
          <span style={{fontWeight:700,fontSize:14,color:"#5F3876"}}>Stock des cuves</span>
          <span style={{fontSize:11,color:"#9F8EAE",marginLeft:4}}>({cuves.length} cuve{cuves.length!==1?"s":""})</span>
        </div>
        {cuves.length===0
          ? <div style={{padding:"24px",textAlign:"center",color:"#9F8EAE",fontSize:13}}>
              Aucune cuve configurée pour la station <strong>{site}</strong>.<br/>
              <span style={{fontSize:11}}>Créez des actifs de type "Cuves de stockage" dans l'onglet Actifs.</span>
            </div>
          : (
            <>
              <div style={{padding:"8px 16px",background:"#FDFAF6",borderBottom:"1px solid #F0EBF7",
                fontSize:11,color:"#7A5499",display:"flex",gap:16,flexWrap:"wrap"}}>
                <span>
                  <span style={{display:"inline-block",width:12,height:12,borderRadius:3,background:"#EDE6F5",border:"1.5px solid #5F3876",marginRight:4,verticalAlign:"middle"}}/>
                  <strong>Livraison externe</strong> = volume total calculé depuis les pompes liées à la cuve
                </span>
                <span style={{color:"#9F8EAE"}}>
                  <strong>Réception</strong> = saisie manuelle (camion citerne, autre livraison)
                </span>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:980}}>
                  <thead>
                    <tr style={{background:"#FAF7FD"}}>
                      <th style={thStyle}>Cuve</th>
                      <th style={thStyle}>Produit</th>
                      <th style={{...thStyle,textAlign:"right"}}>Stock initial (L)</th>
                      <th style={{...thStyle,textAlign:"right"}}>Réception (L)</th>
                      <th style={{...thStyle,textAlign:"right",color:"#5F3876"}}>Livraison pompes (L)</th>
                      <th style={{...thStyle,textAlign:"right",background:"#EDE6F5",color:"#5F3876"}}>Stock final (L)</th>
                      <th style={{...thStyle,textAlign:"right"}}>Stock physique (L)</th>
                      <th style={{...thStyle,textAlign:"right",color:"#92400e"}}>Écart (L)</th>
                      <th style={{...thStyle,textAlign:"right",color:"#92400e"}}>Écart (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuves.map((c, i) => {
                      const pompesLiees = pompes.filter(p => p.cuveRattachee && p.cuveRattachee === c.nom);
                      const livraisonAuto = pompesLiees.length > 0
                        ? pompesLiees.reduce((s, p) => {
                            const vol = (p.indexArrivee!==""&&p.indexArrivee!==undefined&&p.indexDepart!==""&&p.indexDepart!==undefined)
                              ? Math.max(0, parseFloat(p.indexArrivee||0)-parseFloat(p.indexDepart||0)) : 0;
                            return s + vol;
                          }, 0)
                        : null;
                      const si             = c.stockInitial!==""&&c.stockInitial!==undefined ? parseFloat(c.stockInitial||0) : null;
                      const rm             = parseFloat(c.receptionManuelle||0);
                      const la             = livraisonAuto||0;
                      const stockFinalCalc = si!==null ? si + rm - la : null;
                      const stockPhysique  = c.stockPhysique!==""&&c.stockPhysique!==undefined ? parseFloat(c.stockPhysique||0) : null;
                      const ecart    = stockPhysique!==null && stockFinalCalc!==null ? (stockPhysique - stockFinalCalc) : null;
                      const ecartPct = ecart!==null && livraisonAuto!==null && livraisonAuto>0 ? (ecart/livraisonAuto*100) : null;
                      const ecartColor = ecart===null?"#C9B8DC":Math.abs(ecart)<1?"#166534":Math.abs(ecart)<50?"#92400e":"#dc2626";
                      return (
                        <tr key={c.actifId} style={{background:i%2===0?"white":"#FDFAF6"}}>
                          <td style={tdStyle}>
                            <div style={{fontWeight:600}}>{c.nom}</div>
                            {c.serie && <div style={{fontSize:10,color:"#9F8EAE",fontFamily:"monospace"}}>{c.serie}</div>}
                          </td>
                          <td style={{...tdStyle,color:"#7A5499",fontWeight:500}}>
                            {c.produit
                              ? <div>
                                  <div style={{fontWeight:600}}>{c.produit}</div>
                                  {pompesLiees.length>0 && <div style={{fontSize:10,color:"#5F3876",marginTop:2}}>⛽ {pompesLiees.length} pompe{pompesLiees.length!==1?"s":""} liée{pompesLiees.length!==1?"s":""}</div>}
                                </div>
                              : <span style={{color:"#C9B8DC",fontStyle:"italic"}}>—</span>}
                          </td>
                          <td style={{...tdNum,background:"#FAF7FD"}}>
                            <div style={{fontSize:11,color:"#5F3876",textAlign:"right",marginBottom:2,fontWeight:600}}>Stock initial</div>
                            {inp(c.stockInitial, ()=>{}, "—", true, true)}
                          </td>
                          <td style={tdNum}>{inp(c.receptionManuelle, v=>setC(i,"receptionManuelle",v), "0", locked)}</td>
                          <td style={tdNum}>
                            {livraisonAuto!==null
                              ? <div>
                                  <div style={{fontSize:10,color:"#5F3876",textAlign:"right",marginBottom:2,fontWeight:700}}>⛽ {pompesLiees.map(p=>p.nom).join(", ")}</div>
                                  {inp(livraisonAuto.toFixed(2), ()=>{}, "", true, true)}
                                </div>
                              : <div style={{padding:"7px 10px",borderRadius:8,background:"#FDFAF6",border:"1px dashed #C9B8DC",fontSize:11,color:"#9F8EAE",textAlign:"center",fontStyle:"italic",lineHeight:1.4}}>Aucune pompe<br/>liée</div>}
                          </td>
                          <td style={{...tdNum,background:"#FAF7FD"}}>
                            {stockFinalCalc!==null
                              ? <div><div style={{fontSize:10,color:"#5F3876",textAlign:"right",marginBottom:2,fontWeight:600}}>SI + Réc. − Livr.</div>{inp(stockFinalCalc.toFixed(2), ()=>{}, "", true, true)}</div>
                              : <span style={{color:"#C9B8DC",padding:"7px 10px",display:"block",textAlign:"right"}}>—</span>}
                          </td>
                          <td style={tdNum}>{inp(c.stockPhysique, v=>setC(i,"stockPhysique",v), "Mesure jauge", locked)}</td>
                          <td style={{...tdNum,textAlign:"right"}}>
                            {ecart!==null
                              ? <div>
                                  <span style={{fontWeight:700,fontSize:14,color:ecartColor}}>{ecart>0?"+":""}{ecart.toLocaleString("fr-FR",{minimumFractionDigits:2})}</span>
                                  <div style={{fontSize:10,color:ecartColor,marginTop:2}}>{Math.abs(ecart)<1?"✅ OK":Math.abs(ecart)<50?"⚠️ Attention":"❌ Écart élevé"}</div>
                                </div>
                              : <span style={{color:"#C9B8DC"}}>—</span>}
                          </td>
                          <td style={{...tdNum,textAlign:"right"}}>
                            {ecartPct!==null
                              ? <div>
                                  <span style={{fontWeight:700,fontSize:14,color:ecartColor}}>{ecartPct>0?"+":""}{ecartPct.toFixed(2)}%</span>
                                  <div style={{fontSize:10,color:"#9F8EAE",marginTop:2}}>sur {livraisonAuto.toLocaleString("fr-FR",{minimumFractionDigits:1})} L</div>
                                </div>
                              : <span style={{color:"#C9B8DC"}}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {cuves.some(c=>c.stockPhysique!==""&&c.stockPhysique!==undefined) && (
                    <tfoot>
                      <tr style={{background:"#F5F0FA"}}>
                        <td colSpan={2} style={{...tdStyle,fontWeight:700,fontSize:11,color:"#5F3876",borderTop:"2px solid #C9B8DC"}}>TOTAUX</td>
                        {[
                          cuves.reduce((s,c)=>s+parseFloat(c.stockInitial||0),0),
                          cuves.reduce((s,c)=>s+parseFloat(c.receptionManuelle||0),0),
                          cuves.reduce((s,c)=>s+pompes.filter(p=>p.cuveRattachee===c.nom).reduce((a,p)=>a+Math.max(0,parseFloat(p.indexArrivee||0)-parseFloat(p.indexDepart||0)),0),0),
                        ].map((v,idx)=>(
                          <td key={idx} style={{...tdNum,textAlign:"right",borderTop:"2px solid #C9B8DC"}}>
                            <span style={{fontWeight:700,color:"#5F3876"}}>{v.toLocaleString("fr-FR",{minimumFractionDigits:1})}</span>
                          </td>
                        ))}
                        <td style={{...tdNum,textAlign:"right",borderTop:"2px solid #C9B8DC",background:"#FAF7FD"}}>
                          <span style={{fontWeight:700,color:"#5F3876"}}>
                            {cuves.reduce((s,c)=>{
                              const la=pompes.filter(p=>p.cuveRattachee===c.nom).reduce((a,p)=>a+Math.max(0,parseFloat(p.indexArrivee||0)-parseFloat(p.indexDepart||0)),0);
                              return s+parseFloat(c.stockInitial||0)+parseFloat(c.receptionManuelle||0)-la;
                            },0).toLocaleString("fr-FR",{minimumFractionDigits:1})}
                          </span>
                        </td>
                        <td style={{...tdNum,textAlign:"right",borderTop:"2px solid #C9B8DC"}}>
                          <span style={{fontWeight:700,color:"#5F3876"}}>
                            {cuves.filter(c=>c.stockPhysique!==""&&c.stockPhysique!==undefined).reduce((s,c)=>s+parseFloat(c.stockPhysique||0),0).toLocaleString("fr-FR",{minimumFractionDigits:1})}
                          </span>
                        </td>
                        {(()=>{
                          const totLivr=cuves.reduce((s,c)=>s+pompes.filter(p=>p.cuveRattachee===c.nom).reduce((a,p)=>a+Math.max(0,parseFloat(p.indexArrivee||0)-parseFloat(p.indexDepart||0)),0),0);
                          const totEcart=cuves.reduce((s,c)=>{
                            if(c.stockPhysique===undefined||c.stockPhysique==="")return s;
                            const la=pompes.filter(p=>p.cuveRattachee===c.nom).reduce((a,p)=>a+Math.max(0,parseFloat(p.indexArrivee||0)-parseFloat(p.indexDepart||0)),0);
                            return s+(parseFloat(c.stockPhysique||0)-(parseFloat(c.stockInitial||0)+parseFloat(c.receptionManuelle||0)-la));
                          },0);
                          const totPct=totLivr>0?(totEcart/totLivr*100):null;
                          const col=Math.abs(totEcart)<1?"#166534":Math.abs(totEcart)<50?"#92400e":"#dc2626";
                          return <>
                            <td style={{...tdNum,textAlign:"right",borderTop:"2px solid #C9B8DC"}}>
                              <span style={{fontWeight:800,fontSize:15,color:col}}>{totEcart>0?"+":""}{totEcart.toLocaleString("fr-FR",{minimumFractionDigits:2})}</span>
                            </td>
                            <td style={{...tdNum,textAlign:"right",borderTop:"2px solid #C9B8DC"}}>
                              {totPct!==null?<span style={{fontWeight:800,fontSize:14,color:col}}>{totPct>0?"+":""}{totPct.toFixed(2)}%</span>:<span style={{color:"#C9B8DC"}}>—</span>}
                            </td>
                          </>;
                        })()}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
          )
        }
      </div>
    </div>
  );
}
