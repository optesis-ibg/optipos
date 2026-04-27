import { useState, useEffect, useRef, useCallback } from "react";
import {
  clearToken,
  fetchCities,
  fetchSites, fetchInspecteurs, fetchCategories, fetchQuestions,
  fetchInspections, fetchUsers, fetchPermissions, fetchActifs,
  fetchProduits, fetchControles,
} from "./src/api.js";
import { OPTESIS_FONT_STYLE } from "./src/styles.js";
import { TABS } from "./src/constants.js";
import { inspFullName, resolvePerms, canAccessMenu, roleInfo } from "./src/utils.js";

import LoginScreen     from "./src/components/LoginScreen.jsx";
import CitiesTab       from "./src/components/CitiesTab.jsx";
import DashboardTab    from "./src/components/DashboardTab.jsx";
import InspectionTab   from "./src/components/InspectionTab.jsx";
import BuilderTab      from "./src/components/BuilderTab.jsx";
import SitesTab        from "./src/components/SitesTab.jsx";
import InspecteursTab  from "./src/components/InspecteursTab.jsx";
import UsersTab        from "./src/components/UsersTab.jsx";
import PermissionsTab  from "./src/components/PermissionsTab.jsx";
import DemoTab         from "./src/components/DemoTab.jsx";
import ProduitsTab     from "./src/components/ProduitsTab.jsx";
import ActifsTab       from "./src/components/actifs/ActifsTab.jsx";
import StockControleTab from "./src/components/stock/StockControleTab.jsx";

export default function App() {
  const [currentUser,  setCurrentUser]  = useState(() => {
    try { const u = localStorage.getItem("sc_user"); return u ? JSON.parse(u) : null; } catch { return null; }
  });
  const [users,        setUsers]        = useState([]);
  const [tab,          setTab]          = useState("dashboard");
  const [cities,       setCities]       = useState([]);
  const [sites,        setSites]        = useState([]);
  const [questions,    setQuestions]    = useState([]);
  const [cats,         setCats]         = useState([]);
  const [inspecteurs,  setInspecteurs]  = useState([]);
  const [history,      setHistory]      = useState([]);
  const [rolePerms,    setRolePerms]    = useState({});
  const [actifs,       setActifs]       = useState([]);
  const [produits,     setProduits]     = useState([]);
  const [controles,    setControles]    = useState([]);
  const [sidebarOpen,  setSidebarOpen]  = useState(() => typeof window !== "undefined" ? window.innerWidth > 768 : true);
  const [pwaPrompt,    setPwaPrompt]    = useState(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);

  const pwaListenerAdded = useRef(false);
  if (!pwaListenerAdded.current) {
    pwaListenerAdded.current = true;
    if (typeof window !== "undefined") {
      window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); setPwaPrompt(e); });
      window.addEventListener("appinstalled", () => setPwaInstalled(true));
    }
  }

  const installPwa = useCallback(async () => {
    if (!pwaPrompt) return;
    pwaPrompt.prompt();
    const { outcome } = await pwaPrompt.userChoice;
    if (outcome === "accepted") setPwaInstalled(true);
    setPwaPrompt(null);
  }, [pwaPrompt]);

  useEffect(() => {
    if (!currentUser) return;
    fetchCities().then(setCities).catch(console.error);
    fetchSites().then(setSites).catch(console.error);
    fetchInspecteurs().then(setInspecteurs).catch(console.error);
    fetchCategories().then(setCats).catch(console.error);
    fetchQuestions().then(setQuestions).catch(console.error);
    fetchInspections().then(setHistory).catch(console.error);
    fetchUsers().then(setUsers).catch(console.error);
    fetchPermissions().then(setRolePerms).catch(console.error);
    fetchActifs().then(setActifs).catch(console.error);
    fetchProduits().then(setProduits).catch(console.error);
    fetchControles().then(setControles).catch(console.error);
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const inspNames   = inspecteurs.map(inspFullName);
  const isAdmin     = currentUser?.role === "admin";
  const perms       = currentUser ? resolvePerms(currentUser, rolePerms) : {};
  const visibleTabs = TABS.filter(t => {
    if (t.adminOnly) return isAdmin;
    return canAccessMenu(perms, t.id);
  });
  const ri = currentUser ? roleInfo(currentUser.role) : null;

  if (!currentUser) return <LoginScreen users={users} onLogin={u => { setCurrentUser(u); setTab("dashboard"); }}/>;

  return (
    <div style={{fontFamily:"'Poppins','Segoe UI',system-ui,sans-serif",display:"flex",minHeight:"100dvh",background:"#FDFAF6",position:"relative"}}>
      <style>{OPTESIS_FONT_STYLE}</style>

      {sidebarOpen && typeof window !== "undefined" && window.innerWidth <= 768 && (
        <div onClick={()=>setSidebarOpen(false)}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:40}}/>
      )}

      <div className={`sidebar-wrapper ${sidebarOpen?"open":"closed"}`}>
        <div style={{width:220,display:"flex",flexDirection:"column",height:"100%",overflowY:"auto"}}>

          <div style={{padding:"20px 14px 16px",borderBottom:"1px solid rgba(255,255,255,0.12)",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.15)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>⛽</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:"white",lineHeight:1.2,whiteSpace:"nowrap"}}>StationCheck Pro</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.55)",marginTop:1}}>Inspection & Conformité</div>
              </div>
              <button onClick={()=>setSidebarOpen(false)} title="Réduire le menu"
                style={{width:28,height:28,borderRadius:7,border:"none",flexShrink:0,
                  background:"rgba(255,255,255,0.12)",cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  color:"rgba(255,255,255,0.8)",fontSize:16,lineHeight:1}}>
                ‹
              </button>
            </div>
          </div>

          <nav style={{flex:1,padding:"12px 10px",display:"flex",flexDirection:"column",gap:3,overflowY:"auto"}}>
            {visibleTabs.map(t=>{
              const active = tab===t.id;
              return (
                <button key={t.id} onClick={()=>{setTab(t.id); if(window.innerWidth<=768) setSidebarOpen(false);}}
                  style={{
                    display:"flex",alignItems:"center",gap:10,
                    padding:"10px 12px",borderRadius:10,border:"none",
                    background:active?"rgba(255,255,255,0.18)":"transparent",
                    cursor:"pointer",fontFamily:"inherit",
                    fontSize:13,fontWeight:active?600:400,
                    color:active?"white":"rgba(255,255,255,0.65)",
                    transition:"all 0.15s",textAlign:"left",width:"100%",
                    outline:"none",whiteSpace:"nowrap",
                  }}>
                  <span style={{fontSize:15,flexShrink:0}}>{t.icon}</span>
                  <span style={{flex:1}}>{t.label}</span>
                  {active && <div style={{width:6,height:6,borderRadius:"50%",background:"white",flexShrink:0}}/>}
                </button>
              );
            })}
          </nav>

          {pwaPrompt && !pwaInstalled && (
            <div style={{margin:"8px 10px",padding:"10px 12px",borderRadius:10,
              background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.9)",fontWeight:600,marginBottom:6}}>
                📲 Installer l'application
              </div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",marginBottom:8,lineHeight:1.4}}>
                Accédez à StationCheck hors-ligne depuis votre écran d'accueil.
              </div>
              <button onClick={installPwa}
                style={{width:"100%",padding:"7px",borderRadius:8,border:"none",
                  background:"white",color:"#5F3876",fontWeight:700,
                  cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>
                ⬇ Installer
              </button>
            </div>
          )}
          {pwaInstalled && (
            <div style={{margin:"8px 10px",padding:"8px 12px",borderRadius:10,
              background:"rgba(255,255,255,0.1)",fontSize:11,color:"rgba(255,255,255,0.7)",textAlign:"center"}}>
              ✓ Application installée
            </div>
          )}

          <div style={{padding:"12px 10px 16px",borderTop:"1px solid rgba(255,255,255,0.12)",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:10}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,0.2)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:12,fontWeight:700,color:"white",flexShrink:0}}>
                {currentUser.prenom[0]}{currentUser.nom[0]}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,fontWeight:600,color:"white",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {currentUser.prenom} {currentUser.nom}
                </div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.55)",marginTop:1}}>{ri.label}</div>
              </div>
            </div>
            <button onClick={()=>{ clearToken(); setCurrentUser(null); }}
              style={{width:"100%",padding:"7px",borderRadius:8,
                border:"1px solid rgba(255,255,255,0.25)",
                background:"rgba(255,255,255,0.08)",
                cursor:"pointer",fontSize:12,color:"rgba(255,255,255,0.75)",
                fontWeight:500,fontFamily:"inherit",transition:"all 0.15s",
                display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <span>⏏</span> Se déconnecter
            </button>
          </div>

        </div>
      </div>

      <div className={`main-content ${sidebarOpen?"sidebar-open":"sidebar-closed"}`}>

        <div style={{background:"white",borderBottom:"1px solid #F0EBF7",
          padding:"12px 16px",
          display:"flex",alignItems:"center",gap:12,
          position:"sticky",top:0,zIndex:30,
          boxShadow:"0 1px 8px rgba(95,56,118,0.06)"}}>

          <button onClick={()=>setSidebarOpen(o=>!o)} title={sidebarOpen?"Réduire":"Afficher le menu"}
            style={{width:36,height:36,borderRadius:9,border:"1px solid #F0EBF7",
              background:sidebarOpen?"#F5F0FA":"white",
              cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:18,color:"#5F3876",flexShrink:0,transition:"all .2s",lineHeight:1}}>
            {sidebarOpen ? "✕" : "☰"}
          </button>

          <div style={{width:1,height:28,background:"#F0EBF7",flexShrink:0}}/>

          <span style={{fontSize:20,flexShrink:0}}>{visibleTabs.find(t=>t.id===tab)?.icon}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:15,fontWeight:600,color:"#1D1D1B",lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {visibleTabs.find(t=>t.id===tab)?.label}
            </div>
            <div style={{fontSize:10,color:"#9F8EAE",marginTop:1}}>optesis · StationCheck Pro</div>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px 4px 6px",
            borderRadius:20,background:"#F5F0FA",border:"1px solid #C9B8DC",flexShrink:0}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:"#5F3876",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:10,fontWeight:700,color:"white"}}>
              {currentUser.prenom[0]}{currentUser.nom[0]}
            </div>
            <span style={{fontSize:11,fontWeight:600,color:"#5F3876",whiteSpace:"nowrap"}}>{currentUser.prenom}</span>
          </div>
        </div>

        <div style={{flex:1,background:"#FDFAF6",paddingBottom:32}}>
          {tab==="actifs"      && <ActifsTab      sites={sites} perms={perms} actifs={actifs} setActifs={setActifs} produits={produits}/>}
          {tab==="produits"    && <ProduitsTab    sites={sites} perms={perms} produits={produits} setProduits={setProduits}/>}
          {tab==="stock"       && <StockControleTab sites={sites} perms={perms} history={history} setHistory={setHistory} actifs={actifs} setActifs={setActifs} controles={controles} setControles={setControles} produits={produits} questions={questions} cats={cats}/>}
          {tab==="inspection"  && <InspectionTab  questions={questions} sites={sites} cats={cats} inspNames={inspNames} history={history} setHistory={setHistory} perms={perms}/>}
          {tab==="builder"     && <BuilderTab     questions={questions} setQuestions={setQuestions} cats={cats} setCats={setCats} perms={perms}/>}
          {tab==="cities"      && <CitiesTab      cities={cities} setCities={setCities} perms={perms}/>}
          {tab==="sites"       && <SitesTab       sites={sites} setSites={setSites} inspNames={inspNames} perms={perms} cities={cities}/>}
          {tab==="inspecteurs" && <InspecteursTab inspecteurs={inspecteurs} setInspecteurs={setInspecteurs} sites={sites} perms={perms}/>}
          {tab==="dashboard"   && <DashboardTab   sites={sites} history={history} perms={perms}/>}
          {tab==="users"       && isAdmin && <UsersTab users={users} setUsers={setUsers} currentUser={currentUser} rolePerms={rolePerms} setRolePerms={setRolePerms}/>}
          {tab==="permissions" && isAdmin && <PermissionsTab rolePerms={rolePerms} setRolePerms={setRolePerms}/>}
          {tab==="demo"        && isAdmin && <DemoTab
            sites={sites} setSites={setSites}
            inspecteurs={inspecteurs} setInspecteurs={setInspecteurs}
            cats={cats} setCats={setCats}
            questions={questions} setQuestions={setQuestions}
            users={users} setUsers={setUsers}
            history={history} setHistory={setHistory}
            actifs={actifs} setActifs={setActifs}
            produits={produits} setProduits={setProduits}/>}
        </div>
      </div>
    </div>
  );
}
