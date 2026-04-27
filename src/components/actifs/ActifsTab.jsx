import { useState, useMemo } from "react";
import AssetCard, { ASSET_CATEGORIES, ASSET_STATUSES, assetStatusInfo } from "./AssetCard.jsx";
import { createActif, updateActif, deleteActif } from "../../api.js";

const ASSET_TYPES = {
  pompes:       ["Pompe distributrice","Multi-produits","Pompe submersible","Pompe de récupération vapeur"],
  cuves:        ["Cuve enterrée","Cuve aérienne","Cuve double paroi","Citerne"],
  compteurs:    ["Compteur de débit","Débitmètre","Compteur électrique","Analyseur qualité"],
  securite:     ["Extincteur CO2","Extincteur poudre","Détecteur incendie","Système alarme","Séparateur hydrocarbures","Vanne de sécurité"],
  electrique:   ["Tableau électrique","Groupe électrogène","Éclairage LED","Transformateur"],
  informatique: ["Terminal point de vente","Borne de paiement","Serveur","Caméra de surveillance","Écran affichage"],
  vehicules:    ["Chariot élévateur","Camion ravitaillement","Véhicule de service"],
  autre:        ["Compresseur","Laveur haute pression","Balance","Autre équipement"],
};

export default function ActifsTab({ sites, perms={}, actifs=[], setActifs, produits: produitsList=[] }) {
  const blank = {
    site:"", categorie:"", type:"", nom:"", marque:"", serie:"",
    produit:"", cuveRattachee:"", pompesRattachees:[], indexInitial:"", indexActuel:"", codeBarre:"", dateMaintenance:"",
    statut:"actif", notes:""
  };

  const [form,      setForm]     = useState(blank);
  const [editId,    setEditId]   = useState(null);
  const [showForm,  setShowForm] = useState(false);

  const cuvesList = useMemo(() =>
    actifs.filter(a =>
      a.categorie === "cuves" &&
      (!form.site || !a.site || a.site === form.site)
    ), [actifs, form.site]);

  const [filterSite,setFltSite]  = useState("all");
  const [filterCat, setFltCat]   = useState("all");
  const [filterStat,setFltStat]  = useState("all");
  const [expandId,  setExpand]   = useState(null);
  const [sortBy,    setSortBy]   = useState("site");

  const F = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    if(!form.site){alert("Veuillez sélectionner une station.");return;}
    if(!form.categorie){alert("Veuillez sélectionner une catégorie.");return;}
    if(!form.nom.trim()){alert("Le nom de l'équipement est requis.");return;}
    try {
      let saved;
      if(editId) {
        saved = await updateActif(editId, form);
        setActifs(prev=>prev.map(a=>a.id===editId?saved:a));
      } else {
        saved = await createActif({...form, id: Date.now()});
        setActifs(prev=>[...prev, saved]);
      }
      if(form.categorie==="cuves" && form.pompesRattachees?.length>0) {
        const nomCuve = form.nom;
        const updates = actifs
          .filter(a=>a.categorie==="pompes"&&(!form.site||a.site===form.site))
          .filter(a=>form.pompesRattachees.includes(a.nom)||(a.cuveRattachee===nomCuve&&!form.pompesRattachees.includes(a.nom)))
          .map(a=>{
            const newCuve = form.pompesRattachees.includes(a.nom) ? nomCuve : "";
            return updateActif(a.id, {...a, cuveRattachee: newCuve})
              .then(u=>setActifs(prev=>prev.map(x=>x.id===a.id?u:x)));
          });
        await Promise.all(updates);
      }
      setForm(blank); setEditId(null); setShowForm(false);
    } catch(err) { alert(err.message); }
  };
  const openNew   = ()  => { setForm(blank); setEditId(null); setShowForm(true); };
  const startEdit = a   => {
    let extra = {};
    if(a.categorie==="cuves") {
      const linked = actifs.filter(p=>p.categorie==="pompes"&&p.cuveRattachee===a.nom).map(p=>p.nom);
      extra = {pompesRattachees: linked};
    }
    setForm({...blank,...a,...extra});
    setEditId(a.id);
    setShowForm(true);
  };
  const cancel = () => { setForm(blank); setEditId(null); setShowForm(false); };
  const del = async (id) => {
    if(!window.confirm("Supprimer cet équipement ?")) return;
    try { await deleteActif(id); setActifs(prev=>prev.filter(a=>a.id!==id)); } catch(err) { alert(err.message); }
  };

  const filtered = useMemo(() => actifs
    .filter(a =>
      (filterSite==="all" || a.site===filterSite) &&
      (filterCat ==="all" || a.categorie===filterCat) &&
      (filterStat==="all" || a.statut===filterStat)
    )
    .sort((a,b) => {
      if(sortBy==="site")      return (a.site||"").localeCompare(b.site||"");
      if(sortBy==="categorie") return (a.categorie||"").localeCompare(b.categorie||"");
      if(sortBy==="statut")    return (a.statut||"").localeCompare(b.statut||"");
      return (a.nom||"").localeCompare(b.nom||"");
    }), [actifs, filterSite, filterCat, filterStat, sortBy]);

  const stats = useMemo(() => ({
    total:       actifs.length,
    actif:       actifs.filter(a=>a.statut==="actif").length,
    maintenance: actifs.filter(a=>a.statut==="maintenance").length,
    hors:        actifs.filter(a=>a.statut==="hors_service").length,
  }), [actifs]);

  const fieldStyle = {width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,boxSizing:"border-box",fontFamily:"inherit",outline:"none",background:"white"};
  const labelStyle = {fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.4};
  const sH = label => <div style={{fontSize:11,fontWeight:700,color:"#5F3876",textTransform:"uppercase",letterSpacing:.8,padding:"8px 0 4px",borderBottom:"1px solid #F5F0FA",marginBottom:6}}>{label}</div>;
  const catInfo = id => ASSET_CATEGORIES.find(c=>c.id===id);

  return (
    <div style={{padding:14,display:"flex",flexDirection:"column",gap:12}}>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        {[
          {l:"Total",       v:stats.total,       c:"#1D1D1B", bg:"white"},
          {l:"En service",  v:stats.actif,        c:"#166534", bg:"#f0fdf4"},
          {l:"Maintenance", v:stats.maintenance,  c:"#92400e", bg:"#fffbeb"},
          {l:"Hors service",v:stats.hors,         c:"#991b1b", bg:"#fff5f5"},
        ].map(({l,v,c,bg})=>(
          <div key={l} style={{background:bg,borderRadius:10,padding:"10px 12px",border:"1px solid #F0EBF7",textAlign:"center"}}>
            <div style={{fontSize:9,color:"#9F8EAE",textTransform:"uppercase",letterSpacing:.5,fontWeight:700,marginBottom:4}}>{l}</div>
            <div style={{fontSize:22,fontWeight:800,color:c,lineHeight:1}}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{background:"white",borderRadius:12,border:"1px solid #F0EBF7",padding:"12px 14px",display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
        <div style={{display:"flex",flexDirection:"column",gap:3,minWidth:160}}>
          <label style={{fontSize:10,fontWeight:700,color:"#9F8EAE",textTransform:"uppercase",letterSpacing:.4}}>Station</label>
          <select value={filterSite} onChange={e=>setFltSite(e.target.value)}
            style={{...fieldStyle,color:filterSite!=="all"?"#5F3876":"#1D1D1B",fontWeight:filterSite!=="all"?700:400,border:filterSite!=="all"?"1px solid #5F3876":"1px solid #e2e8f0"}}>
            <option value="all">Toutes les stations</option>
            {sites.map(s=><option key={s.id} value={s.name}>{s.name.replace("Station ","")}</option>)}
          </select>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:3,minWidth:160}}>
          <label style={{fontSize:10,fontWeight:700,color:"#9F8EAE",textTransform:"uppercase",letterSpacing:.4}}>Catégorie</label>
          <select value={filterCat} onChange={e=>setFltCat(e.target.value)}
            style={{...fieldStyle,color:filterCat!=="all"?"#5F3876":"#1D1D1B",fontWeight:filterCat!=="all"?700:400,border:filterCat!=="all"?"1px solid #5F3876":"1px solid #e2e8f0"}}>
            <option value="all">Toutes les catégories</option>
            {ASSET_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:3,minWidth:140}}>
          <label style={{fontSize:10,fontWeight:700,color:"#9F8EAE",textTransform:"uppercase",letterSpacing:.4}}>Statut</label>
          <select value={filterStat} onChange={e=>setFltStat(e.target.value)}
            style={{...fieldStyle,color:filterStat!=="all"?"#5F3876":"#1D1D1B",fontWeight:filterStat!=="all"?700:400,border:filterStat!=="all"?"1px solid #5F3876":"1px solid #e2e8f0"}}>
            <option value="all">Tous les statuts</option>
            {ASSET_STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:3,minWidth:120}}>
          <label style={{fontSize:10,fontWeight:700,color:"#9F8EAE",textTransform:"uppercase",letterSpacing:.4}}>Trier par</label>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={fieldStyle}>
            <option value="site">Station</option>
            <option value="nom">Nom</option>
            <option value="categorie">Catégorie</option>
            <option value="statut">Statut</option>
          </select>
        </div>
        {(filterSite!=="all"||filterCat!=="all"||filterStat!=="all") && (
          <button onClick={()=>{setFltSite("all");setFltCat("all");setFltStat("all");}}
            style={{padding:"8px 12px",borderRadius:8,fontSize:12,cursor:"pointer",background:"#F5F0FA",color:"#5F3876",border:"1px solid #C9B8DC",fontWeight:600,alignSelf:"flex-end"}}>
            ✕ Réinitialiser
          </button>
        )}
        <div style={{marginLeft:"auto",alignSelf:"flex-end"}}>
          <button onClick={openNew}
            style={{display:"flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:10,background:"#5F3876",color:"white",border:"none",fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>
            ＋ Nouvel actif
          </button>
        </div>
      </div>

      {actifs.length===0 && (
        <div style={{textAlign:"center",padding:"48px 0",color:"#9F8EAE"}}>
          <div style={{fontSize:40,marginBottom:10}}>🔧</div>
          <div style={{fontSize:15,fontWeight:600,color:"#5F3876",marginBottom:6}}>Aucun équipement enregistré</div>
          <div style={{fontSize:13,marginBottom:20}}>Ajoutez les équipements de vos stations pour les suivre.</div>
          <button onClick={openNew} style={{padding:"10px 24px",borderRadius:10,background:"#5F3876",color:"white",border:"none",fontWeight:700,fontSize:14,cursor:"pointer"}}>
            ＋ Ajouter un équipement
          </button>
        </div>
      )}

      {actifs.length>0 && filtered.length===0 && (
        <div style={{textAlign:"center",padding:"32px 0",color:"#9F8EAE"}}>
          <div style={{fontSize:28,marginBottom:8}}>🔍</div>
          <div style={{fontSize:14,fontWeight:600,color:"#7A5499"}}>Aucun résultat pour ces filtres</div>
        </div>
      )}

      {sortBy==="categorie" ? (
        ASSET_CATEGORIES.filter(cat=>filtered.some(a=>a.categorie===cat.id)).map(cat=>(
          <div key={cat.id}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,paddingLeft:2}}>
              <span style={{fontSize:16}}>{cat.icon}</span>
              <span style={{fontSize:12,fontWeight:700,color:"#5F3876",textTransform:"uppercase",letterSpacing:.6}}>{cat.label}</span>
              <span style={{fontSize:11,color:"#9F8EAE",background:"#F5F0FA",borderRadius:10,padding:"1px 8px",border:"1px solid #C9B8DC"}}>
                {filtered.filter(a=>a.categorie===cat.id).length}
              </span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {filtered.filter(a=>a.categorie===cat.id).map(a=><AssetCard key={a.id} a={a} allActifs={actifs} expandId={expandId} setExpand={setExpand} startEdit={startEdit} del={del} perms={perms}/>)}
            </div>
          </div>
        ))
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {filtered.map(a=><AssetCard key={a.id} a={a} allActifs={actifs} expandId={expandId} setExpand={setExpand} startEdit={startEdit} del={del} perms={perms}/>)}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={cancel}>
          <div className="modal-box" style={{maxWidth:620}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"20px 24px 16px",borderBottom:"1px solid #F0EBF7",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:10,background:"#5F3876",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                {catInfo(form.categorie)?.icon||"🔧"}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:16,color:"#1D1D1B"}}>{editId?"Modifier l'équipement":"Nouvel équipement"}</div>
                <div style={{fontSize:11,color:"#9F8EAE",marginTop:1}}>Fiche de l'actif</div>
              </div>
              <button onClick={cancel} style={{border:"none",background:"none",fontSize:22,cursor:"pointer",color:"#9F8EAE",padding:4,lineHeight:1}}>×</button>
            </div>
            <div style={{padding:"16px 24px 24px",display:"flex",flexDirection:"column",gap:14,maxHeight:"75vh",overflowY:"auto"}}>
              {sH("📍 Localisation")}
              <div className="form-grid-2">
                <div style={{gridColumn:"1/-1"}}>
                  <label style={labelStyle}>Station *</label>
                  <select value={form.site} onChange={e=>F("site",e.target.value)} style={fieldStyle}>
                    <option value="">-- Sélectionner une station --</option>
                    {sites.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              {sH("🔧 Identification")}
              <div className="form-grid-2">
                <div>
                  <label style={labelStyle}>Catégorie *</label>
                  <select value={form.categorie} onChange={e=>{F("categorie",e.target.value);F("type","");}} style={fieldStyle}>
                    <option value="">-- Catégorie --</option>
                    {ASSET_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Type d'équipement *</label>
                  <select value={form.type} onChange={e=>F("type",e.target.value)} style={fieldStyle} disabled={!form.categorie}>
                    <option value="">-- Type --</option>
                    {(ASSET_TYPES[form.categorie]||[]).map(t=><option key={t} value={t}>{t}</option>)}
                    <option value="_custom">Autre (saisie libre)</option>
                  </select>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={labelStyle}>Nom de l'équipement *</label>
                  <input value={form.nom} onChange={e=>F("nom",e.target.value)}
                    placeholder={form.type && form.type!=="custom" ? form.type : "Ex: Pompe N°1 — Îlot A"}
                    style={fieldStyle}/>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={labelStyle}>Produit associé</label>
                  <select value={form.produit||""} onChange={e=>F("produit",e.target.value)} style={fieldStyle}>
                    <option value="">-- Aucun produit associé --</option>
                    {produitsList.filter(p=>p.actif!==false).map(p=>(
                      <option key={p.id} value={p.nom}>{p.nom}</option>
                    ))}
                  </select>
                  {produitsList.length===0 && <div style={{fontSize:11,color:"#9F8EAE",marginTop:4,fontStyle:"italic"}}>Aucun produit configuré — allez dans l'onglet Produits pour en créer.</div>}
                </div>
                {form.categorie === "pompes" && (
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={labelStyle}>Cuve rattachée</label>
                    <select value={form.cuveRattachee||""} onChange={e=>F("cuveRattachee",e.target.value)} style={fieldStyle}
                      disabled={cuvesList.length===0}>
                      <option value="">-- Aucune cuve rattachée --</option>
                      {cuvesList.map(c=>(
                        <option key={c.id} value={c.nom||c.id}>
                          {c.nom}{c.produit ? " — "+c.produit : ""}{c.serie ? " ("+c.serie+")" : ""}
                        </option>
                      ))}
                    </select>
                    {cuvesList.length===0 && (
                      <div style={{fontSize:11,color:"#9F8EAE",marginTop:4,fontStyle:"italic"}}>
                        {form.site
                          ? "Aucune cuve configurée dans cette station — créez des actifs de type Cuves."
                          : "Sélectionnez d'abord une station."}
                      </div>
                    )}
                  </div>
                )}
                {form.categorie === "cuves" && (
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={labelStyle}>Pompes rattachées à cette cuve</label>
                    {(() => {
                      const pompesDispo = actifs.filter(a =>
                        a.categorie==="pompes" &&
                        (!form.site || !a.site || a.site===form.site) &&
                        a.id !== editId
                      );
                      const nomCuve = form.nom||"";
                      const pompesDejaliees = pompesDispo.filter(p =>
                        p.cuveRattachee && (p.cuveRattachee===nomCuve || p.cuveRattachee===String(editId))
                      );
                      const selectedPompes = form.pompesRattachees||[];
                      const togglePompe = (pompeNom) => {
                        const cur = form.pompesRattachees||[];
                        F("pompesRattachees", cur.includes(pompeNom)
                          ? cur.filter(n=>n!==pompeNom)
                          : [...cur, pompeNom]);
                      };
                      return (
                        <div style={{display:"flex",flexDirection:"column",gap:8}}>
                          {pompesDispo.length===0
                            ? <div style={{fontSize:11,color:"#9F8EAE",fontStyle:"italic"}}>
                                {form.site
                                  ? "Aucune pompe dans cette station — créez des actifs de type Pompes."
                                  : "Sélectionnez d'abord une station."}
                              </div>
                            : <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                                {pompesDispo.map(p=>{
                                  const checked = selectedPompes.includes(p.nom) ||
                                    (!selectedPompes.length && pompesDejaliees.some(x=>x.id===p.id));
                                  return (
                                    <label key={p.id} onClick={()=>togglePompe(p.nom)}
                                      style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",
                                        borderRadius:8,cursor:"pointer",userSelect:"none",
                                        border:`1px solid ${checked?"#5F3876":"#e2e8f0"}`,
                                        background:checked?"#F5F0FA":"white",transition:"all .12s"}}>
                                      <div style={{width:16,height:16,borderRadius:4,flexShrink:0,
                                        border:`2px solid ${checked?"#5F3876":"#C9B8DC"}`,
                                        background:checked?"#5F3876":"white",
                                        display:"flex",alignItems:"center",justifyContent:"center"}}>
                                        {checked && <span style={{color:"white",fontSize:10,fontWeight:900,lineHeight:1}}>✓</span>}
                                      </div>
                                      <div style={{minWidth:0}}>
                                        <div style={{fontSize:12,fontWeight:600,color:"#1D1D1B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.nom}</div>
                                        {p.produit && <div style={{fontSize:10,color:"#9F8EAE"}}>📦 {p.produit}</div>}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                          }
                          {pompesDejaliees.length>0 && !selectedPompes.length && (
                            <div style={{fontSize:11,color:"#7A5499",background:"#F5F0FA",padding:"6px 10px",borderRadius:7,border:"1px solid #C9B8DC"}}>
                              💡 {pompesDejaliees.length} pompe{pompesDejaliees.length>1?"s":""} déjà liée{pompesDejaliees.length>1?"s":""} à cette cuve via leur propre fiche.
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
                <div>
                  <label style={labelStyle}>Marque</label>
                  <input value={form.marque} onChange={e=>F("marque",e.target.value)} placeholder="Ex: Gilbarco" style={fieldStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>N° de série</label>
                  <input value={form.serie} onChange={e=>F("serie",e.target.value)} placeholder="Ex: GV2024-00142" style={fieldStyle}/>
                </div>
              </div>
              {sH("📊 Index & compteurs")}
              <div className="form-grid-2">
                <div>
                  <label style={labelStyle}>Index initial</label>
                  <input type="number" value={form.indexInitial} onChange={e=>F("indexInitial",e.target.value)} placeholder="0" style={fieldStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>Index actuel</label>
                  <input type="number" value={form.indexActuel} onChange={e=>F("indexActuel",e.target.value)} placeholder="0" style={fieldStyle}/>
                </div>
              </div>
              {sH("🔍 Traçabilité")}
              <div className="form-grid-2">
                <div>
                  <label style={labelStyle}>Code-barres / QR</label>
                  <input value={form.codeBarre} onChange={e=>F("codeBarre",e.target.value)} placeholder="Ex: BC-2024-00142" style={fieldStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>Date dernière maintenance</label>
                  <input type="date" value={form.dateMaintenance} onChange={e=>F("dateMaintenance",e.target.value)} style={fieldStyle}/>
                </div>
              </div>
              {sH("🚦 Statut")}
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {ASSET_STATUSES.map(s=>(
                  <button key={s.id} onClick={()=>F("statut",s.id)}
                    style={{flex:1,minWidth:100,padding:"9px 8px",borderRadius:9,fontFamily:"inherit",fontSize:12,cursor:"pointer",
                      border:`2px solid ${form.statut===s.id?s.color:"#F0EBF7"}`,
                      background:form.statut===s.id?s.bg:"white",
                      color:form.statut===s.id?s.color:"#9F8EAE",
                      fontWeight:form.statut===s.id?700:400,transition:"all .12s"}}>
                    {s.label}
                  </button>
                ))}
              </div>
              <div>
                <label style={labelStyle}>Notes / Observations</label>
                <textarea value={form.notes} onChange={e=>F("notes",e.target.value)}
                  placeholder="Informations complémentaires, historique, remarques..."
                  style={{...fieldStyle,minHeight:60,resize:"vertical"}}/>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid #F0EBF7",paddingTop:14,marginTop:4}}>
                <button onClick={cancel} style={{padding:"9px 18px",borderRadius:9,border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:13,fontWeight:500}}>Annuler</button>
                <button onClick={save} style={{padding:"9px 22px",borderRadius:9,background:"#5F3876",color:"white",border:"none",fontWeight:700,cursor:"pointer",fontSize:13}}>
                  {editId?"✓ Enregistrer":"➕ Ajouter l'équipement"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
