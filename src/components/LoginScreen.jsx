import { useState } from "react";
import { apiLogin } from "../api.js";

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const login = async () => {
    if (!username || !password) { setError("Veuillez renseigner tous les champs."); return; }
    setLoading(true); setError("");
    try {
      const data = await apiLogin(username, password);
      onLogin(data.user);
    } catch (err) {
      setError(err.message || "Identifiant ou mot de passe incorrect.");
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background:"linear-gradient(135deg,#F5F0FA 0%,#C9B8DC 40%,#5F3876 100%)",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <div style={{width:"100%",maxWidth:400,padding:"0 16px"}}>

        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:72,height:72,borderRadius:20,background:"white",margin:"0 auto 14px",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,
            boxShadow:"0 8px 32px rgba(249,115,22,0.25)"}}>⛽</div>
          <div style={{fontSize:26,fontWeight:700,color:"white",letterSpacing:-.5,textShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>StationCheck Pro</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.8)",marginTop:4}}>Éclairer, transformer, pérenniser.</div>
        </div>

        <div style={{background:"white",borderRadius:20,padding:28,boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
          <div style={{fontSize:18,fontWeight:700,color:"#1D1D1B",marginBottom:22}}>Connexion</div>

          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:5}}>Identifiant</label>
            <input value={username} onChange={e=>{setUsername(e.target.value);setError("");}}
              onKeyDown={e=>e.key==="Enter"&&login()}
              placeholder="Ex: jean.dupont"
              style={{width:"100%",padding:"10px 12px",borderRadius:10,boxSizing:"border-box",
                border:`1.5px solid ${error?"#fca5a5":"#e2e8f0"}`,fontSize:14,outline:"none",
                transition:"border-color .15s"}}
              onFocus={e=>e.target.style.borderColor="#5F3876"}
              onBlur={e=>e.target.style.borderColor=error?"#fca5a5":"#e2e8f0"}/>
          </div>

          <div style={{marginBottom:20}}>
            <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:5}}>Mot de passe</label>
            <div style={{position:"relative"}}>
              <input type={showPwd?"text":"password"} value={password}
                onChange={e=>{setPassword(e.target.value);setError("");}}
                onKeyDown={e=>e.key==="Enter"&&login()}
                placeholder="••••••••"
                style={{width:"100%",padding:"10px 40px 10px 12px",borderRadius:10,boxSizing:"border-box",
                  border:`1.5px solid ${error?"#fca5a5":"#e2e8f0"}`,fontSize:14,outline:"none",
                  transition:"border-color .15s"}}
                onFocus={e=>e.target.style.borderColor="#5F3876"}
                onBlur={e=>e.target.style.borderColor=error?"#fca5a5":"#e2e8f0"}/>
              <button onClick={()=>setShowPwd(v=>!v)}
                style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
                  border:"none",background:"none",cursor:"pointer",fontSize:16,color:"#94a3b8",padding:4}}>
                {showPwd?"🙈":"👁"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{marginBottom:14,padding:"8px 12px",borderRadius:8,background:"#fef2f2",
              border:"1px solid #fecaca",fontSize:13,color:"#dc2626",display:"flex",alignItems:"center",gap:6}}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={login} disabled={loading}
            style={{width:"100%",padding:"12px",borderRadius:10,background:loading?"#C9B8DC":"#5F3876",
              color:"white",border:"none",fontSize:15,fontWeight:700,cursor:loading?"default":"pointer",
              transition:"background .2s",boxShadow:"0 4px 14px rgba(249,115,22,0.35)"}}>
            {loading?"Connexion en cours…":"Se connecter"}
          </button>

          <div style={{marginTop:20,padding:10,borderRadius:8,background:"#F5F0FA",border:"1px solid #C9B8DC",fontSize:11,color:"#7A5499",display:"flex",gap:8,alignItems:"flex-start"}}>
            <span style={{fontSize:14,flexShrink:0}}>💡</span>
            <div>Connectez-vous avec votre identifiant et mot de passe. Contactez votre administrateur si vous n'avez pas encore de compte.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
