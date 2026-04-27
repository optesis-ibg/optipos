import { useState, useMemo } from "react";
import { createProduit, updateProduit, deleteProduit } from "../api.js";

const PRODUCT_UNITS = [
  { id:"litre",    label:"Litre (L)" },
  { id:"m3",       label:"Mètre cube (m³)" },
  { id:"kg",       label:"Kilogramme (kg)" },
  { id:"tonne",    label:"Tonne (t)" },
  { id:"unite",    label:"Unité" },
  { id:"bouteille",label:"Bouteille" },
  { id:"carton",   label:"Carton" },
  { id:"sac",      label:"Sac" },
];

const PRODUCT_CATEGORIES = [
  { id:"carburant",  label:"Carburants",          icon:"⛽" },
  { id:"lubrifiant", label:"Lubrifiants & huiles", icon:"🛢️" },
  { id:"gaz",        label:"Gaz",                 icon:"🔥" },
  { id:"boutique",   label:"Boutique",             icon:"🛒" },
  { id:"lavage",     label:"Lavage & services",    icon:"🚿" },
  { id:"autre",      label:"Autre",                icon:"📦" },
];

export default function ProduitsTab({ sites, perms={}, produits=[], setProduits }) {
  const blankProd = { nom:"", categorie:"", unite:"litre", description:"", sites:[], actif:true };
  const blankPrix = { dateDebut:"", dateFin:"", prix:"", devise:"FCFA", notes:"" };
  const [form,      setForm]      = useState(blankProd);
  const [editId,    setEditId]    = useState(null);
  const [showForm,  setShowForm]  = useState(false);
  const [expandId,  setExpand]    = useState(null);
  const [prixModal, setPrixModal] = useState(null);
  const [prixForm,  setPrixForm]  = useState(blankPrix);
  const [filterCat, setFltCat]   = useState("all");
  const [filterSite,setFltSite]  = useState("all");

  const F  = (k,v) => setForm(f=>({...f,[k]:v}));
  const FP = (k,v) => setPrixForm(f=>({...f,[k]:v}));

  const saveProd = async () => {
    if(!form.nom.trim()){alert("Le nom du produit est requis.");return;}
    if(!form.categorie){alert("Veuillez sélectionner une catégorie.");return;}
    try {
      if(editId) {
        const record = {...form, prix: produits.find(p=>p.id===editId)?.prix||[] };
        const updated = await updateProduit(editId, record);
        setProduits(prev=>prev.map(p=>p.id===editId?updated:p));
      } else {
        const created = await createProduit({...form, id: Date.now(), prix:[]});
        setProduits(prev=>[...prev, created]);
      }
      setForm(blankProd); setEditId(null); setShowForm(false);
    } catch(err) { alert(err.message); }
  };
  const openNew    = ()  => { setForm(blankProd); setEditId(null); setShowForm(true); };
  const startEdit  = p   => { setForm({...blankProd,...p}); setEditId(p.id); setShowForm(true); };
  const cancelProd = ()  => { setForm(blankProd); setEditId(null); setShowForm(false); };
  const delProd = async (id) => {
    if(!window.confirm("Supprimer ce produit et son historique de prix ?")) return;
    try { await deleteProduit(id); setProduits(prev=>prev.filter(p=>p.id!==id)); } catch(err) { alert(err.message); }
  };

  const openPrixModal  = p  => { setPrixModal(p.id); setPrixForm(blankPrix); };
  const closePrixModal = () => { setPrixModal(null); setPrixForm(blankPrix); };
  const savePrix = async () => {
    if(!prixForm.prix||isNaN(parseFloat(prixForm.prix))){alert("Saisissez un prix valide.");return;}
    if(!prixForm.dateDebut){alert("La date de début est requise.");return;}
    const prod = produits.find(p=>p.id===prixModal);
    if(!prod) return;
    const newEntry = {...prixForm, id:Date.now(), prix:parseFloat(prixForm.prix)};
    const newPrix = [...(prod.prix||[]), newEntry].sort((a,b)=>b.dateDebut.localeCompare(a.dateDebut));
    try {
      const updated = await updateProduit(prixModal, {...prod, prix: newPrix});
      setProduits(prev=>prev.map(p=>p.id===prixModal?updated:p));
      setPrixForm(blankPrix);
    } catch(err) { alert(err.message); }
  };
  const delPrix = async (prodId, prixId) => {
    const prod = produits.find(p=>p.id===prodId);
    if(!prod) return;
    const newPrix = (prod.prix||[]).filter(x=>x.id!==prixId);
    try {
      const updated = await updateProduit(prodId, {...prod, prix: newPrix});
      setProduits(prev=>prev.map(p=>p.id===prodId?updated:p));
    } catch(err) { alert(err.message); }
  };

  const currentPrice = p => {
    const today = new Date().toISOString().split("T")[0];
    const active = (p.prix||[]).filter(x=>x.dateDebut<=today&&(!x.dateFin||x.dateFin>=today));
    return active.length ? active.sort((a,b)=>b.dateDebut.localeCompare(a.dateDebut))[0] : null;
  };

  const filtered = useMemo(()=> produits.filter(p=>
    (filterCat==="all"||p.categorie===filterCat) &&
    (filterSite==="all"||!(p.sites?.length)||(p.sites||[]).includes(filterSite))
  ), [produits,filterCat,filterSite]);

  const prixModalProd = produits.find(p=>p.id===prixModal);

  const fieldStyle = {width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,boxSizing:"border-box",fontFamily:"inherit",outline:"none",background:"white"};
  const labelStyle = {fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.4};
  const sH = label => <div style={{fontSize:11,fontWeight:700,color:"#5F3876",textTransform:"uppercase",letterSpacing:.8,padding:"8px 0 4px",borderBottom:"1px solid #F5F0FA",marginBottom:6}}>{label}</div>;
  const catInfo  = id => PRODUCT_CATEGORIES.find(c=>c.id===id);
  const unitInfo = id => PRODUCT_UNITS.find(u=>u.id===id);

  return (
    <div style={{padding:14,display:"flex",flexDirection:"column",gap:12}}>

      <div style={{background:"white",borderRadius:12,border:"1px solid #F0EBF7",padding:"12px 14px",display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
        <div style={{display:"flex",flexDirection:"column",gap:3,minWidth:160}}>
          <label style={{fontSize:10,fontWeight:700,color:"#9F8EAE",textTransform:"uppercase",letterSpacing:.4}}>Catégorie</label>
          <select value={filterCat} onChange={e=>setFltCat(e.target.value)}
            style={{...fieldStyle,color:filterCat!=="all"?"#5F3876":"#1D1D1B",fontWeight:filterCat!=="all"?700:400,border:filterCat!=="all"?"1px solid #5F3876":"1px solid #e2e8f0"}}>
            <option value="all">Toutes les catégories</option>
            {PRODUCT_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:3,minWidth:160}}>
          <label style={{fontSize:10,fontWeight:700,color:"#9F8EAE",textTransform:"uppercase",letterSpacing:.4}}>Station</label>
          <select value={filterSite} onChange={e=>setFltSite(e.target.value)}
            style={{...fieldStyle,color:filterSite!=="all"?"#5F3876":"#1D1D1B",fontWeight:filterSite!=="all"?700:400,border:filterSite!=="all"?"1px solid #5F3876":"1px solid #e2e8f0"}}>
            <option value="all">Toutes les stations</option>
            {sites.map(s=><option key={s.id} value={s.name}>{s.name.replace("Station ","")}</option>)}
          </select>
        </div>
        {(filterCat!=="all"||filterSite!=="all") && (
          <button onClick={()=>{setFltCat("all");setFltSite("all");}}
            style={{padding:"8px 12px",borderRadius:8,fontSize:12,cursor:"pointer",background:"#F5F0FA",color:"#5F3876",border:"1px solid #C9B8DC",fontWeight:600,alignSelf:"flex-end"}}>
            ✕ Réinitialiser
          </button>
        )}
        <div style={{marginLeft:"auto",alignSelf:"flex-end"}}>
          <button onClick={openNew}
            style={{display:"flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:10,background:"#5F3876",color:"white",border:"none",fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>
            ＋ Nouveau produit
          </button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {[
          {l:"Total produits",   v:produits.length,                           c:"#1D1D1B"},
          {l:"Actifs",           v:produits.filter(p=>p.actif!==false).length, c:"#166534"},
          {l:"Avec prix actuel", v:produits.filter(p=>currentPrice(p)).length, c:"#5F3876"},
        ].map(({l,v,c})=>(
          <div key={l} style={{background:"white",borderRadius:10,padding:"10px 12px",border:"1px solid #F0EBF7",textAlign:"center"}}>
            <div style={{fontSize:9,color:"#9F8EAE",textTransform:"uppercase",letterSpacing:.5,fontWeight:700,marginBottom:4}}>{l}</div>
            <div style={{fontSize:22,fontWeight:800,color:c,lineHeight:1}}>{v}</div>
          </div>
        ))}
      </div>

      {produits.length===0 && (
        <div style={{textAlign:"center",padding:"48px 0",color:"#9F8EAE"}}>
          <div style={{fontSize:40,marginBottom:10}}>📦</div>
          <div style={{fontSize:15,fontWeight:600,color:"#5F3876",marginBottom:6}}>Aucun produit enregistré</div>
          <div style={{fontSize:13,marginBottom:20}}>Créez votre catalogue de produits vendus en station.</div>
          <button onClick={openNew} style={{padding:"10px 24px",borderRadius:10,background:"#5F3876",color:"white",border:"none",fontWeight:700,fontSize:14,cursor:"pointer"}}>＋ Ajouter un produit</button>
        </div>
      )}

      {PRODUCT_CATEGORIES.filter(cat=>filtered.some(p=>p.categorie===cat.id)).map(cat=>(
        <div key={cat.id}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,paddingLeft:2}}>
            <span style={{fontSize:16}}>{cat.icon}</span>
            <span style={{fontSize:12,fontWeight:700,color:"#5F3876",textTransform:"uppercase",letterSpacing:.6}}>{cat.label}</span>
            <span style={{fontSize:11,color:"#9F8EAE",background:"#F5F0FA",borderRadius:10,padding:"1px 8px",border:"1px solid #C9B8DC"}}>
              {filtered.filter(p=>p.categorie===cat.id).length}
            </span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {filtered.filter(p=>p.categorie===cat.id).map(p=>{
              const cp   = currentPrice(p);
              const isOpen = expandId===p.id;
              const unit = unitInfo(p.unite);
              return (
                <div key={p.id} style={{background:"white",borderRadius:11,
                  border:`1px solid ${isOpen?"#5F3876":"#F0EBF7"}`,
                  overflow:"hidden",transition:"border-color .15s",
                  boxShadow:isOpen?"0 2px 12px rgba(95,56,118,0.1)":"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",cursor:"pointer"}}
                    onClick={()=>setExpand(id=>id===p.id?null:p.id)}>
                    <div style={{width:38,height:38,borderRadius:9,background:"#F5F0FA",border:"1px solid #C9B8DC",
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                      {cat.icon}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:13,color:"#1D1D1B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {p.nom}
                        {p.actif===false && <span style={{marginLeft:6,fontSize:10,padding:"1px 6px",borderRadius:10,background:"#fee2e2",color:"#dc2626",fontWeight:700}}>Inactif</span>}
                      </div>
                      <div style={{fontSize:11,color:"#9F8EAE",marginTop:1}}>
                        {unit?.label||p.unite} {p.description?" · "+p.description:""}
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      {cp
                        ? <div style={{fontSize:15,fontWeight:800,color:"#5F3876"}}>{parseFloat(cp.prix).toLocaleString("fr-FR")} <span style={{fontSize:10,fontWeight:500}}>{cp.devise}/{unit?.id==="litre"?"L":unit?.id==="kg"?"kg":"u."}</span></div>
                        : <div style={{fontSize:11,color:"#9F8EAE",fontStyle:"italic"}}>Pas de prix actuel</div>
                      }
                      <div style={{fontSize:10,color:"#C9B8DC",marginTop:1}}>{(p.prix||[]).length} tarif{(p.prix||[]).length!==1?"s":""}</div>
                    </div>
                    <span style={{color:"#C9B8DC",fontSize:12,transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s",flexShrink:0,marginLeft:4}}>▼</span>
                  </div>

                  {isOpen && (
                    <div style={{borderTop:"1px solid #F0EBF7",padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
                      {(p.sites||[]).length>0 && (
                        <div>
                          <div style={{fontSize:10,color:"#9F8EAE",fontWeight:700,textTransform:"uppercase",marginBottom:6}}>📍 Stations</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                            {(p.sites||[]).map(s=>(
                              <span key={s} style={{padding:"3px 10px",borderRadius:20,background:"#F5F0FA",border:"1px solid #C9B8DC",fontSize:12,color:"#5F3876",fontWeight:600}}>
                                {s.replace("Station ","")}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                          <div style={{fontSize:10,color:"#9F8EAE",fontWeight:700,textTransform:"uppercase",flex:1}}>💰 Historique des prix</div>
                          <button onClick={()=>openPrixModal(p)}
                            style={{padding:"4px 12px",borderRadius:7,background:"#5F3876",color:"white",border:"none",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                            ＋ Ajouter un tarif
                          </button>
                        </div>
                        {(p.prix||[]).length===0
                          ? <div style={{fontSize:12,color:"#9F8EAE",fontStyle:"italic",padding:"8px 0"}}>Aucun tarif enregistré</div>
                          : (
                            <div style={{display:"flex",flexDirection:"column",gap:5}}>
                              {(p.prix||[]).map(pr=>{
                                const today=new Date().toISOString().split("T")[0];
                                const isActive=pr.dateDebut<=today&&(!pr.dateFin||pr.dateFin>=today);
                                return (
                                  <div key={pr.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,
                                    background:isActive?"#F5F0FA":"#FDFAF6",
                                    border:`1px solid ${isActive?"#C9B8DC":"#F0EBF7"}`}}>
                                    {isActive && <span style={{fontSize:9,padding:"2px 6px",borderRadius:10,background:"#5F3876",color:"white",fontWeight:700,flexShrink:0}}>ACTIF</span>}
                                    <div style={{flex:1,minWidth:0}}>
                                      <div style={{fontSize:14,fontWeight:700,color:"#5F3876"}}>
                                        {parseFloat(pr.prix).toLocaleString("fr-FR")} {pr.devise}
                                        <span style={{fontSize:11,fontWeight:400,color:"#9F8EAE",marginLeft:4}}>/ {unit?.id==="litre"?"L":unit?.id==="kg"?"kg":unit?.label}</span>
                                      </div>
                                      <div style={{fontSize:11,color:"#9F8EAE",marginTop:2}}>
                                        Du {new Date(pr.dateDebut).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"})}
                                        {pr.dateFin ? " au "+new Date(pr.dateFin).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}) : " → en cours"}
                                      </div>
                                      {pr.notes && <div style={{fontSize:11,color:"#7A5499",marginTop:2,fontStyle:"italic"}}>{pr.notes}</div>}
                                    </div>
                                    <button onClick={()=>delPrix(p.id,pr.id)}
                                      style={{padding:"4px 8px",borderRadius:6,border:"1px solid #fee2e2",background:"#fff5f5",color:"#ef4444",fontSize:11,cursor:"pointer",flexShrink:0}}>🗑️</button>
                                  </div>
                                );
                              })}
                            </div>
                          )
                        }
                      </div>
                      <div style={{display:"flex",gap:7,justifyContent:"flex-end",paddingTop:4,borderTop:"1px solid #F0EBF7"}}>
                        <button onClick={()=>startEdit(p)} style={{padding:"6px 14px",borderRadius:8,border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:13}}>✏️ Modifier</button>
                        <button onClick={()=>delProd(p.id)} style={{padding:"6px 14px",borderRadius:8,border:"1px solid #fee2e2",background:"#fff5f5",cursor:"pointer",fontSize:13,color:"#ef4444"}}>🗑️ Supprimer</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {showForm && (
        <div className="modal-overlay" onClick={cancelProd}>
          <div className="modal-box" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"20px 24px 16px",borderBottom:"1px solid #F0EBF7",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:10,background:"#5F3876",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                {catInfo(form.categorie)?.icon||"📦"}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:16,color:"#1D1D1B"}}>{editId?"Modifier le produit":"Nouveau produit"}</div>
                <div style={{fontSize:11,color:"#9F8EAE",marginTop:1}}>Catalogue des produits</div>
              </div>
              <button onClick={cancelProd} style={{border:"none",background:"none",fontSize:22,cursor:"pointer",color:"#9F8EAE",padding:4,lineHeight:1}}>×</button>
            </div>
            <div style={{padding:"16px 24px 24px",display:"flex",flexDirection:"column",gap:14,maxHeight:"75vh",overflowY:"auto"}}>
              {sH("🏷️ Identification")}
              <div className="form-grid-2">
                <div style={{gridColumn:"1/-1"}}>
                  <label style={labelStyle}>Nom du produit *</label>
                  <input value={form.nom} onChange={e=>F("nom",e.target.value)} placeholder="Ex: SP95, Diesel B7, Huile 5W30…" style={fieldStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>Catégorie *</label>
                  <select value={form.categorie} onChange={e=>F("categorie",e.target.value)} style={fieldStyle}>
                    <option value="">-- Catégorie --</option>
                    {PRODUCT_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Unité de comptage *</label>
                  <select value={form.unite} onChange={e=>F("unite",e.target.value)} style={fieldStyle}>
                    {PRODUCT_UNITS.map(u=><option key={u.id} value={u.id}>{u.label}</option>)}
                  </select>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={labelStyle}>Description</label>
                  <input value={form.description||""} onChange={e=>F("description",e.target.value)} placeholder="Ex: Sans plomb 95, indice d'octane 95" style={fieldStyle}/>
                </div>
              </div>
              {sH("📍 Stations concernées")}
              <div>
                <select onChange={e=>{const v=e.target.value;if(!v)return;if(!(form.sites||[]).includes(v))F("sites",[...(form.sites||[]),v]);e.target.value="";}}
                  style={{...fieldStyle,maxWidth:300}}>
                  <option value="">-- Associer une station --</option>
                  {sites.filter(s=>!(form.sites||[]).includes(s.name)).map(s=><option key={s.id} value={s.name}>{s.name.replace("Station ","")}</option>)}
                </select>
                {(form.sites||[]).length>0 && (
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:8}}>
                    {(form.sites||[]).map(s=>(
                      <span key={s} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,background:"#F5F0FA",border:"1px solid #C9B8DC",fontSize:12,color:"#5F3876",fontWeight:600}}>
                        {s.replace("Station ","")}<button onClick={()=>F("sites",(form.sites||[]).filter(x=>x!==s))} style={{border:"none",background:"none",cursor:"pointer",fontSize:13,color:"#5F3876",padding:0,lineHeight:1}}>×</button>
                      </span>
                    ))}
                  </div>
                )}
                {sites.length===0 && <div style={{fontSize:12,color:"#9F8EAE",fontStyle:"italic",marginTop:6}}>Aucun site configuré — ajoutez des sites d'abord.</div>}
              </div>
              {sH("⚙️ Options")}
              <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",userSelect:"none"}}>
                <div onClick={()=>F("actif",!form.actif)}
                  style={{width:40,height:22,borderRadius:11,background:form.actif!==false?"#5F3876":"#e2e8f0",
                    position:"relative",transition:"background .2s",cursor:"pointer",flexShrink:0}}>
                  <div style={{position:"absolute",top:3,left:form.actif!==false?20:3,width:16,height:16,borderRadius:"50%",
                    background:"white",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
                </div>
                <span style={{fontSize:13,color:"#1D1D1B",fontWeight:500}}>Produit actif (visible dans les formulaires)</span>
              </label>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid #F0EBF7",paddingTop:14,marginTop:4}}>
                <button onClick={cancelProd} style={{padding:"9px 18px",borderRadius:9,border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:13,fontWeight:500}}>Annuler</button>
                <button onClick={saveProd} style={{padding:"9px 22px",borderRadius:9,background:"#5F3876",color:"white",border:"none",fontWeight:700,cursor:"pointer",fontSize:13}}>
                  {editId?"✓ Enregistrer":"➕ Créer le produit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {prixModal && prixModalProd && (
        <div className="modal-overlay" onClick={closePrixModal}>
          <div className="modal-box" style={{maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"20px 24px 16px",borderBottom:"1px solid #F0EBF7",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:10,background:"#F5F0FA",border:"1px solid #C9B8DC",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                {catInfo(prixModalProd.categorie)?.icon||"📦"}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:15,color:"#1D1D1B"}}>{prixModalProd.nom}</div>
                <div style={{fontSize:11,color:"#9F8EAE",marginTop:1}}>Historique des tarifs</div>
              </div>
              <button onClick={closePrixModal} style={{border:"none",background:"none",fontSize:22,cursor:"pointer",color:"#9F8EAE",padding:4,lineHeight:1}}>×</button>
            </div>
            <div style={{padding:"16px 24px 24px",display:"flex",flexDirection:"column",gap:14,maxHeight:"70vh",overflowY:"auto"}}>
              <div style={{background:"#F5F0FA",borderRadius:10,padding:"14px 16px",border:"1px solid #C9B8DC"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#5F3876",marginBottom:10}}>＋ Nouveau tarif</div>
                <div className="form-grid-2">
                  <div>
                    <label style={labelStyle}>Prix *</label>
                    <div style={{display:"flex",gap:6}}>
                      <input type="number" step="0.01" value={prixForm.prix} onChange={e=>FP("prix",e.target.value)}
                        placeholder="0.00" style={{...fieldStyle,flex:1}}/>
                      <select value={prixForm.devise} onChange={e=>FP("devise",e.target.value)}
                        style={{...fieldStyle,width:90,flexShrink:0}}>
                        {["FCFA","EUR","USD","MAD","XOF"].map(d=><option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{opacity:.6}}>
                    <label style={labelStyle}>Unité</label>
                    <div style={{padding:"8px 10px",borderRadius:8,background:"white",border:"1px solid #e2e8f0",fontSize:13,color:"#9F8EAE"}}>
                      par {unitInfo(prixModalProd.unite)?.label||prixModalProd.unite}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Date de début *</label>
                    <input type="date" value={prixForm.dateDebut} onChange={e=>FP("dateDebut",e.target.value)} style={fieldStyle}/>
                  </div>
                  <div>
                    <label style={labelStyle}>Date de fin <span style={{fontWeight:400,color:"#9F8EAE"}}>(vide = en cours)</span></label>
                    <input type="date" value={prixForm.dateFin} onChange={e=>FP("dateFin",e.target.value)} style={fieldStyle}/>
                  </div>
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={labelStyle}>Notes</label>
                    <input value={prixForm.notes} onChange={e=>FP("notes",e.target.value)} placeholder="Ex: Hausse liée aux tensions mondiales" style={fieldStyle}/>
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}>
                  <button onClick={savePrix}
                    style={{padding:"8px 20px",borderRadius:8,background:"#5F3876",color:"white",border:"none",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                    ＋ Ajouter ce tarif
                  </button>
                </div>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:"#9F8EAE",textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>
                  Historique ({(prixModalProd.prix||[]).length} tarif{(prixModalProd.prix||[]).length!==1?"s":""})
                </div>
                {(prixModalProd.prix||[]).length===0
                  ? <div style={{fontSize:12,color:"#9F8EAE",fontStyle:"italic",padding:"10px 0"}}>Aucun tarif pour ce produit.</div>
                  : (prixModalProd.prix||[]).map(pr=>{
                    const today=new Date().toISOString().split("T")[0];
                    const isActive=pr.dateDebut<=today&&(!pr.dateFin||pr.dateFin>=today);
                    return (
                      <div key={pr.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:9,
                        background:isActive?"#F5F0FA":"#FDFAF6",border:`1px solid ${isActive?"#C9B8DC":"#F0EBF7"}`,marginBottom:6}}>
                        {isActive && <span style={{fontSize:9,padding:"2px 6px",borderRadius:10,background:"#5F3876",color:"white",fontWeight:700,flexShrink:0,whiteSpace:"nowrap"}}>ACTIF</span>}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:15,fontWeight:700,color:"#5F3876"}}>
                            {parseFloat(pr.prix).toLocaleString("fr-FR")} {pr.devise}
                            <span style={{fontSize:11,fontWeight:400,color:"#9F8EAE",marginLeft:4}}>/ {unitInfo(prixModalProd.unite)?.id==="litre"?"L":unitInfo(prixModalProd.unite)?.id==="kg"?"kg":unitInfo(prixModalProd.unite)?.label}</span>
                          </div>
                          <div style={{fontSize:11,color:"#9F8EAE",marginTop:2}}>
                            {new Date(pr.dateDebut).toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})}
                            {pr.dateFin?" → "+new Date(pr.dateFin).toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"}):" → en cours"}
                          </div>
                          {pr.notes && <div style={{fontSize:11,color:"#7A5499",fontStyle:"italic",marginTop:1}}>{pr.notes}</div>}
                        </div>
                        <button onClick={()=>delPrix(prixModalProd.id,pr.id)}
                          style={{padding:"4px 8px",borderRadius:6,border:"1px solid #fee2e2",background:"#fff5f5",color:"#ef4444",fontSize:11,cursor:"pointer",flexShrink:0}}>🗑️</button>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
