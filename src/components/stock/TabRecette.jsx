import { useMemo } from "react";

const MODES_PAIEMENT = [
  { id:"especes",      label:"Espèces",        icon:"💵" },
  { id:"credit",       label:"Crédit",         icon:"📋" },
  { id:"ticket",       label:"Ticket",         icon:"🎫" },
  { id:"carte",        label:"Carte bancaire",  icon:"💳" },
  { id:"orange_money", label:"Orange Money",   icon:"🟠" },
  { id:"wave",         label:"Wave",           icon:"🌊" },
  { id:"autres",       label:"Autres",         icon:"➕" },
];

export default function TabRecette({ controle, setControle, produits=[] }) {
  const locked   = controle.statut === "cloture";
  const { pompes=[], recette=[], paiements={} } = controle;

  const byPompe = useMemo(() => pompes.map(p => {
    const vol = (p.indexArrivee!==""&&p.indexArrivee!==undefined&&p.indexDepart!==""&&p.indexDepart!==undefined)
      ? Math.max(0, parseFloat(p.indexArrivee||0)-parseFloat(p.indexDepart||0)) : 0;
    return { ...p, volume: vol };
  }), [pompes]);

  const getPrix = (produitNom) => {
    const p = produits.find(x=>x.nom===produitNom);
    if(!p) return null;
    const today = new Date().toISOString().split("T")[0];
    const active = (p.prix||[]).filter(x=>x.dateDebut<=today&&(!x.dateFin||x.dateFin>=today));
    return active.length ? active.sort((a,b)=>b.dateDebut.localeCompare(a.dateDebut))[0] : null;
  };

  const getRec  = (key, k) => (recette.find(r=>r.key===key)||{})[k]||"";
  const setRec  = (key, k, v) => { if(locked) return; setControle(c=>{
    const arr=[...(c.recette||[])];
    const idx=arr.findIndex(r=>r.key===key);
    if(idx>=0) arr[idx]={...arr[idx],[k]:v};
    else arr.push({key,[k]:v});
    return {...c,recette:arr};
  });};

  const getPaie  = (mode)          => (paiements[mode]||[]);
  const setPaie  = (mode, lignes)  => { if(locked) return; setControle(c=>({...c,paiements:{...(c.paiements||{}),[mode]:lignes}})); };
  const addLigne = (mode)          => { if(locked) return; setPaie(mode,[...getPaie(mode),{id:Date.now(),libelle:"",date:"",montant:""}]); };
  const updLigne = (mode,id,k,v)   => { if(locked) return; setPaie(mode,getPaie(mode).map(l=>l.id===id?{...l,[k]:v}:l)); };
  const delLigne = (mode,id)       => { if(locked) return; setPaie(mode,getPaie(mode).filter(l=>l.id!==id)); };

  const totalRecettePompes = byPompe.reduce((s,p)=>{
    const px = getPrix(p.produit);
    const pu = parseFloat(getRec(p.actifId,"prixUnitaire")||(px?px.prix:0))||0;
    return s + p.volume*pu;
  },0);

  const totalParMode   = mode => getPaie(mode).reduce((s,l)=>s+parseFloat(l.montant||0),0);
  const totalPaiements = MODES_PAIEMENT.reduce((s,m)=>s+totalParMode(m.id),0);
  const ecartRec       = totalPaiements - totalRecettePompes;
  const ecartColor     = Math.abs(ecartRec)<1?"#166534":Math.abs(ecartRec)<5000?"#92400e":"#dc2626";

  const thStyle = {fontSize:10,fontWeight:700,color:"#5F3876",textTransform:"uppercase",letterSpacing:.5,padding:"8px 10px",borderBottom:"2px solid #F0EBF7",textAlign:"left",whiteSpace:"nowrap"};
  const tdStyle = {padding:"8px 10px",fontSize:13,color:"#1D1D1B",borderBottom:"1px solid #FDFAF6"};
  const tdNum   = {padding:"8px 6px",borderBottom:"1px solid #FDFAF6"};

  const inp = (val, onChange, ro=false, type="number") => (
    <input type={type} step="0.01" value={val||""} onChange={e=>!ro&&onChange(e.target.value)}
      readOnly={ro} placeholder={ro?"—":""}
      style={{width:"100%",padding:"6px 8px",borderRadius:7,fontSize:12,boxSizing:"border-box",
        fontFamily:"inherit",outline:"none",textAlign:type==="number"?"right":"left",
        border:ro?"1px solid #F0EBF7":"1px solid #e2e8f0",
        background:ro?"#FDFAF6":"white",color:ro?"#9F8EAE":"#1D1D1B",cursor:ro?"default":"text"}}/>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>

      <div style={{background:"white",borderRadius:12,border:"1px solid #F0EBF7",overflow:"hidden"}}>
        <div style={{background:"#F5F0FA",padding:"12px 16px",borderBottom:"1px solid #F0EBF7",display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>⛽</span>
          <span style={{fontWeight:700,fontSize:14,color:"#5F3876"}}>Recette par pompe</span>
          <span style={{fontSize:11,color:"#9F8EAE",marginLeft:4}}>({byPompe.length} pompe{byPompe.length!==1?"s":""})</span>
        </div>
        {byPompe.length===0
          ? <div style={{padding:"24px",textAlign:"center",color:"#9F8EAE",fontSize:13}}>
              Saisissez les index des pompes dans l'onglet Inventaire.
            </div>
          : <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:560}}>
                <thead>
                  <tr style={{background:"#FAF7FD"}}>
                    <th style={thStyle}>Pompe</th>
                    <th style={thStyle}>Produit</th>
                    <th style={{...thStyle,textAlign:"right"}}>Volume (L)</th>
                    <th style={{...thStyle,textAlign:"right"}}>Prix unitaire</th>
                    <th style={{...thStyle,textAlign:"right",color:"#166534"}}>Recette</th>
                  </tr>
                </thead>
                <tbody>
                  {byPompe.map((p,i)=>{
                    const px       = getPrix(p.produit);
                    const pu       = getRec(p.actifId,"prixUnitaire") || (px?px.prix:"");
                    const recPompe = p.volume*(parseFloat(pu)||0);
                    return (
                      <tr key={p.actifId} style={{background:i%2===0?"white":"#FDFAF6"}}>
                        <td style={tdStyle}>
                          <div style={{fontWeight:600}}>{p.nom}</div>
                          {p.serie&&<div style={{fontSize:10,color:"#9F8EAE",fontFamily:"monospace"}}>{p.serie}</div>}
                        </td>
                        <td style={{...tdStyle,color:"#7A5499",fontWeight:500}}>{p.produit}</td>
                        <td style={{...tdStyle,textAlign:"right",fontWeight:700,color:"#5F3876"}}>
                          {p.volume>0?p.volume.toLocaleString("fr-FR",{minimumFractionDigits:2}):<span style={{color:"#C9B8DC"}}>—</span>}
                        </td>
                        <td style={tdNum} width={140}>
                          {px&&<div style={{fontSize:10,color:"#9F8EAE",textAlign:"right",marginBottom:2}}>Catalogue: {px.prix} {px.devise}</div>}
                          {inp(pu, v=>setRec(p.actifId,"prixUnitaire",v), locked)}
                        </td>
                        <td style={{...tdNum,textAlign:"right",minWidth:110}}>
                          <span style={{fontWeight:700,fontSize:14,color:"#166534"}}>
                            {recPompe.toLocaleString("fr-FR",{maximumFractionDigits:0})}
                          </span>
                          {px&&<div style={{fontSize:10,color:"#9F8EAE"}}>{px.devise||"FCFA"}</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{background:"#F5F0FA"}}>
                    <td colSpan={4} style={{...thStyle,textAlign:"right",fontSize:12,borderTop:"2px solid #C9B8DC"}}>TOTAL RECETTE POMPES</td>
                    <td style={{...tdNum,textAlign:"right",padding:"10px 6px",borderTop:"2px solid #C9B8DC"}}>
                      <span style={{fontWeight:800,fontSize:16,color:"#5F3876"}}>
                        {totalRecettePompes.toLocaleString("fr-FR",{maximumFractionDigits:0})} FCFA
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
        }
      </div>

      <div style={{background:"white",borderRadius:12,border:"1px solid #F0EBF7",overflow:"hidden"}}>
        <div style={{background:"#F5F0FA",padding:"12px 16px",borderBottom:"1px solid #F0EBF7",display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>💳</span>
          <span style={{fontWeight:700,fontSize:14,color:"#5F3876"}}>Encaissements par mode de paiement</span>
        </div>
        <div style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:10}}>
          {MODES_PAIEMENT.map(mode=>{
            const lignes  = getPaie(mode.id);
            const totMode = totalParMode(mode.id);
            return (
              <div key={mode.id} style={{borderRadius:10,border:"1px solid #F0EBF7",overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",
                  background:totMode>0?"#F5F0FA":"#FDFAF6",borderBottom:lignes.length?"1px solid #F0EBF7":"none"}}>
                  <span style={{fontSize:16}}>{mode.icon}</span>
                  <span style={{fontWeight:700,fontSize:13,color:"#5F3876",flex:1}}>{mode.label}</span>
                  {totMode>0&&(
                    <span style={{fontWeight:700,fontSize:14,color:"#166534"}}>
                      {totMode.toLocaleString("fr-FR",{maximumFractionDigits:0})} FCFA
                    </span>
                  )}
                  {!locked&&(
                    <button onClick={()=>addLigne(mode.id)}
                      style={{padding:"4px 10px",borderRadius:7,background:"#5F3876",color:"white",border:"none",fontSize:11,fontWeight:700,cursor:"pointer",marginLeft:8}}>
                      ＋ Ajouter
                    </button>
                  )}
                </div>
                {lignes.length>0&&(
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",minWidth:480}}>
                      <thead>
                        <tr style={{background:"#FAF7FD"}}>
                          <th style={{...thStyle,width:"40%"}}>Libellé</th>
                          <th style={{...thStyle,width:"20%"}}>Date</th>
                          <th style={{...thStyle,textAlign:"right",width:"25%"}}>Montant</th>
                          {!locked&&<th style={{...thStyle,width:"15%"}}/>}
                        </tr>
                      </thead>
                      <tbody>
                        {lignes.map((l,j)=>(
                          <tr key={l.id} style={{background:j%2===0?"white":"#FDFAF6"}}>
                            <td style={{...tdNum,paddingLeft:10}}>
                              <input value={l.libelle||""} onChange={e=>updLigne(mode.id,l.id,"libelle",e.target.value)}
                                readOnly={locked} placeholder={locked?"—":"Ex: Vente matin, Règlement facture..."}
                                style={{width:"100%",padding:"5px 8px",borderRadius:7,fontSize:12,boxSizing:"border-box",
                                  fontFamily:"inherit",outline:"none",
                                  border:locked?"1px solid #F0EBF7":"1px solid #e2e8f0",
                                  background:locked?"#FDFAF6":"white",color:locked?"#9F8EAE":"#1D1D1B"}}/>
                            </td>
                            <td style={tdNum}>
                              <input type="date" value={l.date||""} onChange={e=>updLigne(mode.id,l.id,"date",e.target.value)}
                                readOnly={locked}
                                style={{width:"100%",padding:"5px 8px",borderRadius:7,fontSize:12,boxSizing:"border-box",
                                  fontFamily:"inherit",outline:"none",
                                  border:locked?"1px solid #F0EBF7":"1px solid #e2e8f0",
                                  background:locked?"#FDFAF6":"white",color:locked?"#9F8EAE":"#1D1D1B"}}/>
                            </td>
                            <td style={{...tdNum,textAlign:"right"}}>
                              {inp(l.montant, v=>updLigne(mode.id,l.id,"montant",v), locked)}
                            </td>
                            {!locked&&(
                              <td style={{...tdNum,textAlign:"center"}}>
                                <button onClick={()=>delLigne(mode.id,l.id)}
                                  style={{padding:"4px 8px",borderRadius:6,border:"1px solid #fee2e2",background:"#fff5f5",color:"#ef4444",fontSize:11,cursor:"pointer"}}>🗑️</button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                      {lignes.length>1&&(
                        <tfoot>
                          <tr style={{background:"#F5F0FA"}}>
                            <td colSpan={2} style={{...tdStyle,fontSize:11,fontWeight:700,color:"#5F3876",borderTop:"1px solid #C9B8DC",textAlign:"right"}}>
                              Sous-total {mode.label}
                            </td>
                            <td style={{...tdNum,textAlign:"right",borderTop:"1px solid #C9B8DC"}}>
                              <span style={{fontWeight:700,color:"#5F3876"}}>{totMode.toLocaleString("fr-FR",{maximumFractionDigits:0})} FCFA</span>
                            </td>
                            {!locked&&<td style={{borderTop:"1px solid #C9B8DC"}}/>}
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
              </div>
            );
          })}
          <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",padding:"12px 14px",
            background:"#F5F0FA",borderRadius:10,border:"1px solid #C9B8DC",marginTop:4}}>
            <span style={{fontWeight:700,fontSize:13,color:"#5F3876",marginRight:16}}>TOTAL ENCAISSEMENTS</span>
            <span style={{fontWeight:800,fontSize:17,color:"#5F3876"}}>
              {totalPaiements.toLocaleString("fr-FR",{maximumFractionDigits:0})} FCFA
            </span>
          </div>
        </div>
      </div>

      <div style={{background:"white",borderRadius:12,border:`2px solid ${Math.abs(ecartRec)<1?"#bbf7d0":Math.abs(ecartRec)<5000?"#fde68a":"#fecaca"}`,overflow:"hidden"}}>
        <div style={{background:Math.abs(ecartRec)<1?"#f0fdf4":Math.abs(ecartRec)<5000?"#fffbeb":"#fff5f5",
          padding:"16px 20px",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
          <span style={{fontSize:22}}>⚖️</span>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontWeight:700,fontSize:14,color:"#1D1D1B",marginBottom:6}}>Comparaison recette / encaissements</div>
            <div style={{display:"flex",gap:20,flexWrap:"wrap",fontSize:13}}>
              <div>
                <div style={{fontSize:10,color:"#9F8EAE",fontWeight:700,textTransform:"uppercase",marginBottom:2}}>Recette pompes</div>
                <div style={{fontWeight:700,color:"#5F3876"}}>{totalRecettePompes.toLocaleString("fr-FR",{maximumFractionDigits:0})} FCFA</div>
              </div>
              <div style={{fontSize:18,color:"#C9B8DC",alignSelf:"flex-end",paddingBottom:2}}>—</div>
              <div>
                <div style={{fontSize:10,color:"#9F8EAE",fontWeight:700,textTransform:"uppercase",marginBottom:2}}>Total encaissements</div>
                <div style={{fontWeight:700,color:"#5F3876"}}>{totalPaiements.toLocaleString("fr-FR",{maximumFractionDigits:0})} FCFA</div>
              </div>
              <div style={{fontSize:18,color:"#C9B8DC",alignSelf:"flex-end",paddingBottom:2}}>=</div>
              <div>
                <div style={{fontSize:10,color:"#9F8EAE",fontWeight:700,textTransform:"uppercase",marginBottom:2}}>Écart</div>
                <div style={{fontWeight:800,fontSize:18,color:ecartColor}}>
                  {ecartRec>0?"+":""}{ecartRec.toLocaleString("fr-FR",{maximumFractionDigits:0})} FCFA
                </div>
              </div>
            </div>
          </div>
          <div style={{fontSize:28}}>
            {Math.abs(ecartRec)<1?"✅":Math.abs(ecartRec)<5000?"⚠️":"❌"}
          </div>
        </div>
        {(totalRecettePompes>0||totalPaiements>0)&&(
          <div style={{padding:"10px 20px",fontSize:11,color:"#7A5499",background:"#FDFAF6",borderTop:"1px solid #F0EBF7"}}>
            💡 Un écart positif signifie que les encaissements dépassent la recette calculée (surplus). Un écart négatif signifie un manque d'encaissement.
          </div>
        )}
      </div>
    </div>
  );
}
