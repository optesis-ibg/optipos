import { useState } from "react";
import {
  DEMO_SITES, DEMO_INSPECTEURS, DEMO_CATS, DEMO_QUESTIONS,
  DEMO_USERS, DEMO_HISTORY, DEMO_ACTIFS, DEMO_PRODUITS,
  isDemoActif, isDemoItem, isDemoHistoryItem,
} from "../data/demoData.js";

export default function DemoTab({ sites, setSites, inspecteurs, setInspecteurs, cats, setCats,
                                  questions, setQuestions, users, setUsers, history, setHistory,
                                  actifs=[], setActifs, produits=[], setProduits }) {

  const [demoActifsActive, setDemoActifsActive] = useState(() => actifs.some(a=>isDemoActif(a.id)));
  const [demoProdActive,   setDemoProdActive]   = useState(() => produits.some(p=>isDemoItem(p.id)));

  const demoActive = {
    sites:       sites.some(s => isDemoItem(s.id)),
    inspecteurs: inspecteurs.some(i => isDemoItem(i.id)),
    cats:        cats.some(c => DEMO_CATS.find(d => d.name === c.name)),
    questions:   questions.some(q => isDemoItem(q.id)),
    users:       users.some(u => isDemoItem(u.id)),
    history:     history.some(h => isDemoHistoryItem(h.id)),
    actifs:      demoActifsActive,
    produits:    demoProdActive,
  };

  const allActive = Object.values(demoActive).every(Boolean);
  const anyActive = Object.values(demoActive).some(Boolean);

  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState(null);

  const flash = (text, ok=true) => { setMsg({text, ok}); setTimeout(() => setMsg(null), 3000); };

  const loadDemo = () => {
    setLoading(true);
    setTimeout(() => {
      setSites(ss => [...ss.filter(s => !isDemoItem(s.id)), ...DEMO_SITES]);
      setInspecteurs(is => [...is.filter(i => !isDemoItem(i.id)), ...DEMO_INSPECTEURS]);
      setCats(cs => [...cs.filter(c => !DEMO_CATS.find(d => d.name === c.name)), ...DEMO_CATS]);
      setQuestions(qs => [...qs.filter(q => !isDemoItem(q.id)), ...DEMO_QUESTIONS]);
      setUsers(us => [...us.filter(u => !isDemoItem(u.id)), ...DEMO_USERS]);
      setHistory(hs => [...hs.filter(h => !isDemoHistoryItem(h.id)), ...DEMO_HISTORY]);
      if (setActifs) setActifs(aa => [...aa.filter(a=>!isDemoActif(a.id)), ...DEMO_ACTIFS]);
      setDemoActifsActive(true);
      if (setProduits) setProduits(pp => [...pp.filter(p=>!isDemoItem(p.id)), ...DEMO_PRODUITS]);
      setDemoProdActive(true);
      setLoading(false);
      flash("✅ Données de démonstration chargées avec succès !");
    }, 800);
  };

  const removeDemo = () => {
    setSites(ss => ss.filter(s => !isDemoItem(s.id)));
    setInspecteurs(is => is.filter(i => !isDemoItem(i.id)));
    setCats(cs => cs.filter(c => !DEMO_CATS.find(d => d.name === c.name)));
    setQuestions(qs => qs.filter(q => !isDemoItem(q.id)));
    setUsers(us => us.filter(u => !isDemoItem(u.id)));
    setHistory(hs => hs.filter(h => !isDemoHistoryItem(h.id)));
    if (setActifs) setActifs(aa => aa.filter(a=>!isDemoActif(a.id)));
    setDemoActifsActive(false);
    if (setProduits) setProduits(pp => pp.filter(p=>!isDemoItem(p.id)));
    setDemoProdActive(false);
    flash("🗑️ Données de démonstration supprimées.", true);
  };

  const MODULES = [
    { key:"sites",       icon:"⛽", label:"Sites",        count: DEMO_SITES.length,       desc:"4 stations-service avec adresses et codes" },
    { key:"inspecteurs", icon:"👤", label:"Inspecteurs",  count: DEMO_INSPECTEURS.length,  desc:"4 inspecteurs avec affectations de stations" },
    { key:"cats",        icon:"📂", label:"Catégories",   count: DEMO_CATS.length,         desc:"Sécurité, Hygiène, Équipement, Conformité" },
    { key:"questions",   icon:"📝", label:"Questions",    count: DEMO_QUESTIONS.length,    desc:"11 questions couvrant les 4 catégories" },
    { key:"users",       icon:"🔐", label:"Utilisateurs", count: DEMO_USERS.length,        desc:"3 inspecteurs + 1 superviseur avec mots de passe" },
    { key:"history",     icon:"📋", label:"Inspections",  count: DEMO_HISTORY.length,      desc:"6 inspections réalisées avec scores et réponses" },
    { key:"actifs",      icon:"🔧", label:"Actifs",       count: DEMO_ACTIFS.length,       desc:"Pompes et cuves liées aux stations, avec index" },
    { key:"produits",    icon:"📦", label:"Produits",     count: DEMO_PRODUITS.length,     desc:"5 produits (carburants, lubrifiant) avec historique de prix" },
  ];

  return (
    <div style={{padding:20, display:"flex", flexDirection:"column", gap:20, maxWidth:640}}>

      <div style={{background:"linear-gradient(135deg,#5F3876,#7A5499)",borderRadius:16,padding:24,color:"white"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <span style={{fontSize:32}}>🧪</span>
          <div>
            <div style={{fontSize:18,fontWeight:700,lineHeight:1.2}}>Données de démonstration</div>
            <div style={{fontSize:12,opacity:.8,marginTop:3}}>Testez toutes les fonctionnalités de StationCheck Pro</div>
          </div>
        </div>
        <div style={{fontSize:13,opacity:.85,lineHeight:1.6}}>
          Chargez un jeu de données complet et réaliste : stations, inspecteurs, questions, utilisateurs
          et historique d'inspections. Ces données sont marquées et peuvent être supprimées à tout moment
          sans affecter vos données réelles.
        </div>
      </div>

      {msg && (
        <div style={{padding:"12px 16px",borderRadius:10,
          background:msg.ok?"#f0fdf4":"#fff5f5",
          border:`1px solid ${msg.ok?"#bbf7d0":"#fecaca"}`,
          fontSize:13,fontWeight:600,color:msg.ok?"#166534":"#dc2626",
          display:"flex",alignItems:"center",gap:8}}>
          {msg.text}
        </div>
      )}

      <div>
        <div style={{fontSize:12,fontWeight:700,color:"#5F3876",textTransform:"uppercase",letterSpacing:.6,marginBottom:10}}>
          Contenu du jeu de données démo
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {MODULES.map(m => (
            <div key={m.key} style={{background:"white",borderRadius:10,padding:"12px 14px",
              border:`1.5px solid ${demoActive[m.key]?"#5F3876":"#F0EBF7"}`,
              display:"flex",gap:10,alignItems:"flex-start",transition:"border-color .2s"}}>
              <div style={{width:38,height:38,borderRadius:9,flexShrink:0,
                background:demoActive[m.key]?"#5F3876":"#F5F0FA",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,
                transition:"background .2s"}}>
                {m.icon}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                  <span style={{fontWeight:700,fontSize:13,color:"#1D1D1B"}}>{m.label}</span>
                  <span style={{fontSize:10,padding:"1px 7px",borderRadius:10,fontWeight:700,
                    background:demoActive[m.key]?"#F5F0FA":"#f1f5f9",
                    color:demoActive[m.key]?"#5F3876":"#9F8EAE",
                    border:`1px solid ${demoActive[m.key]?"#C9B8DC":"#e2e8f0"}`}}>
                    {demoActive[m.key] ? "✓ Chargé" : `${m.count} éléments`}
                  </span>
                </div>
                <div style={{fontSize:11,color:"#9F8EAE",lineHeight:1.4}}>{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {demoActive.users && (
        <div style={{background:"white",borderRadius:12,border:"1px solid #C9B8DC",padding:16}}>
          <div style={{fontSize:12,fontWeight:700,color:"#5F3876",textTransform:"uppercase",letterSpacing:.6,marginBottom:10}}>
            🔐 Comptes de démonstration
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {[
              {u:"jean.dupont",  p:"insp001",  r:"Inspecteur",  n:"Jean Dupont"},
              {u:"marie.martin", p:"insp002",  r:"Inspecteur",  n:"Marie Martin"},
              {u:"s.leclerc",    p:"super001", r:"Superviseur", n:"Sophie Leclerc"},
              {u:"t.petit",      p:"insp003",  r:"Inspecteur",  n:"Thomas Petit"},
            ].map(({u,p,r,n}) => (
              <div key={u} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",
                borderRadius:8,background:"#FDFAF6",border:"1px solid #F0EBF7",fontSize:12}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:"#5F3876",
                  display:"flex",alignItems:"center",justifyContent:"center",color:"white",
                  fontSize:11,fontWeight:700,flexShrink:0}}>
                  {n.split(" ").map(x=>x[0]).join("")}
                </div>
                <div style={{flex:1}}>
                  <span style={{fontWeight:600,color:"#1D1D1B"}}>{n}</span>
                  <span style={{marginLeft:8,fontSize:10,padding:"1px 7px",borderRadius:10,
                    background:"#F5F0FA",color:"#7A5499",border:"1px solid #C9B8DC"}}>{r}</span>
                </div>
                <code style={{fontSize:11,color:"#5F3876",background:"#F5F0FA",padding:"2px 8px",borderRadius:5}}>{u}</code>
                <code style={{fontSize:11,color:"#9F8EAE",background:"#f1f5f9",padding:"2px 8px",borderRadius:5}}>{p}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <button onClick={loadDemo} disabled={loading || allActive}
          style={{flex:1,minWidth:160,padding:"12px 20px",borderRadius:10,border:"none",
            background: allActive?"#C9B8DC" : loading?"#9F8EAE":"#5F3876",
            color:"white",fontWeight:700,fontSize:14,cursor: allActive||loading?"default":"pointer",
            fontFamily:"inherit",transition:"all .2s",
            display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {loading
            ? <><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⏳</span> Chargement…</>
            : allActive ? "✓ Données déjà chargées" : "🚀 Charger les données démo"
          }
        </button>
        {anyActive && (
          <button onClick={removeDemo}
            style={{padding:"12px 20px",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer",
              fontFamily:"inherit",border:"2px solid #E94C57",background:"white",color:"#E94C57",
              transition:"all .2s",display:"flex",alignItems:"center",gap:8}}>
            🗑️ Supprimer les données démo
          </button>
        )}
      </div>

      <div style={{padding:"10px 14px",borderRadius:10,background:"#F5F0FA",
        border:"1px solid #C9B8DC",fontSize:11,color:"#7A5499",display:"flex",gap:8,alignItems:"flex-start"}}>
        <span style={{fontSize:14,flexShrink:0}}>💡</span>
        <div>
          Les données de démo sont identifiées par des IDs spéciaux (≥100 pour les sites/inspecteurs,
          ≥9000 pour les inspections) et n'écrasent jamais vos données existantes.
          Vous pouvez les charger et supprimer autant de fois que vous le souhaitez.
        </div>
      </div>
    </div>
  );
}
