import { useState } from "react";
import { ROLES } from "../constants.js";
import { roleInfo } from "../utils.js";
import { createUser, updateUser, deleteUser } from "../api.js";

export default function UsersTab({ users, setUsers, currentUser, rolePerms, setRolePerms }) {
  const blank = {prenom:"",nom:"",username:"",password:"",role:"inspecteur"};
  const [form,     setForm]    = useState(blank);
  const [editId,   setEditId]  = useState(null);
  const [showForm, setShowForm]= useState(false);
  const [showPwd,  setShowPwd] = useState({});
  const F = (k,v) => setForm(f=>({...f,[k]:v}));
  const isAdmin = currentUser?.role==="admin";

  const save = async () => {
    if(!form.prenom||!form.nom||!form.username||(!editId&&!form.password)){
      alert("Tous les champs sont requis (sauf mot de passe en modification)."); return;
    }
    try {
      const payload = {...form};
      if(!payload.password) delete payload.password;
      if(editId) {
        const updated = await updateUser(editId, payload);
        setUsers(us=>us.map(u=>u.id===editId?updated:u));
      } else {
        const created = await createUser(payload);
        setUsers(us=>[...us, created]);
      }
      setForm(blank); setEditId(null); setShowForm(false);
    } catch(err) { alert(err.message); }
  };

  const openNew   = ()  => { setForm(blank); setEditId(null); setShowForm(true); };
  const startEdit = u   => { setForm({...u,password:""}); setEditId(u.id); setShowForm(true); };
  const cancel    = ()  => { setForm(blank); setEditId(null); setShowForm(false); };

  const del = async (id) => {
    if(id===currentUser?.id){alert("Vous ne pouvez pas supprimer votre propre compte.");return;}
    if(!window.confirm("Supprimer cet utilisateur ?")) return;
    try { await deleteUser(id); setUsers(us=>us.filter(u=>u.id!==id)); } catch(err) { alert(err.message); }
  };

  const fieldStyle = {width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:14,boxSizing:"border-box",fontFamily:"inherit",outline:"none"};
  const labelStyle = {fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.4};

  return (
    <div style={{padding:14,display:"flex",flexDirection:"column",gap:12}}>

      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <div style={{flex:1}}>
          <span style={{fontSize:15,fontWeight:700,color:"#1D1D1B"}}>
            {users.length} utilisateur{users.length!==1?"s":""}
          </span>
        </div>
        {isAdmin && (
          <button onClick={openNew}
            style={{display:"flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:10,
              background:"#5F3876",color:"white",border:"none",fontWeight:700,fontSize:13,
              cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>
            ＋ Nouvel utilisateur
          </button>
        )}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {users.map(u=>{
          const ri=roleInfo(u.role);
          const isSelf=u.id===currentUser?.id;
          return (
            <div key={u.id} style={{background:"white",borderRadius:12,
              border:`1px solid ${isSelf?"#5F3876":"#F0EBF7"}`,
              padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:42,height:42,borderRadius:"50%",background:ri.bg,border:`2px solid ${ri.border}`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:ri.color,flexShrink:0}}>
                {u.prenom[0]}{u.nom[0]}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:14,color:"#1D1D1B"}}>{u.prenom} {u.nom}</span>
                  {isSelf && <span style={{fontSize:10,padding:"1px 6px",borderRadius:10,background:"#5F3876",color:"white",fontWeight:700}}>vous</span>}
                </div>
                <div style={{fontSize:12,color:"#9F8EAE",marginTop:1,fontFamily:"monospace"}}>{u.username}</div>
              </div>
              <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:ri.bg,
                border:`1px solid ${ri.border}`,color:ri.color,fontWeight:700,flexShrink:0}}>
                {ri.label}
              </span>
              {isAdmin && (
                <div style={{display:"flex",gap:5,flexShrink:0}}>
                  <button onClick={()=>startEdit(u)}
                    style={{padding:"5px 9px",borderRadius:6,border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:12}}>✏️</button>
                  <button onClick={()=>del(u.id)}
                    style={{padding:"5px 9px",borderRadius:6,border:"1px solid #fee2e2",background:"#fff5f5",fontSize:12,
                      opacity:isSelf?.4:1,cursor:isSelf?"not-allowed":"pointer"}}>🗑️</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showForm && isAdmin && (
        <div className="modal-overlay" onClick={cancel}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div style={{padding:"20px 24px 16px",borderBottom:"1px solid #F0EBF7",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:"#5F3876",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"white",flexShrink:0}}>
                {form.prenom?form.prenom[0]:"🔐"}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:16,color:"#1D1D1B"}}>{editId?"Modifier l'utilisateur":"Nouvel utilisateur"}</div>
                <div style={{fontSize:11,color:"#9F8EAE",marginTop:1}}>Compte et rôle d'accès</div>
              </div>
              <button onClick={cancel} style={{border:"none",background:"none",fontSize:22,cursor:"pointer",color:"#9F8EAE",padding:4,lineHeight:1}}>×</button>
            </div>
            <div style={{padding:"16px 24px 24px",display:"flex",flexDirection:"column",gap:14}}>
              <div className="form-grid-2">
                <div><label style={labelStyle}>Prénom</label><input value={form.prenom} onChange={e=>F("prenom",e.target.value)} placeholder="Ex: Jean" style={fieldStyle}/></div>
                <div><label style={labelStyle}>Nom</label><input value={form.nom} onChange={e=>F("nom",e.target.value)} placeholder="Ex: Dupont" style={fieldStyle}/></div>
                <div><label style={labelStyle}>Identifiant</label><input value={form.username} onChange={e=>F("username",e.target.value)} placeholder="Ex: jean.dupont" style={fieldStyle}/></div>
                <div>
                  <label style={labelStyle}>Mot de passe {editId&&<span style={{fontWeight:400,color:"#94a3b8"}}>(vide = inchangé)</span>}</label>
                  <div style={{position:"relative"}}>
                    <input type={showPwd.form?"text":"password"} value={form.password}
                      onChange={e=>F("password",e.target.value)} placeholder={editId?"••••••••":"Nouveau mot de passe"}
                      style={{...fieldStyle,paddingRight:36}}/>
                    <button onClick={()=>setShowPwd(s=>({...s,form:!s.form}))}
                      style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",border:"none",background:"none",cursor:"pointer",fontSize:15,color:"#9F8EAE",padding:2}}>
                      {showPwd.form?"🙈":"👁"}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Rôle</label>
                <div style={{display:"flex",gap:8}}>
                  {ROLES.map(r=>(
                    <button key={r.id} onClick={()=>F("role",r.id)}
                      style={{flex:1,padding:"9px 8px",borderRadius:8,border:`2px solid ${form.role===r.id?r.color:r.border}`,
                        background:form.role===r.id?r.bg:"white",cursor:"pointer",fontSize:12,
                        fontWeight:form.role===r.id?700:400,color:form.role===r.id?r.color:"#64748b",transition:"all .12s",fontFamily:"inherit"}}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid #F0EBF7",paddingTop:14,marginTop:4}}>
                <button onClick={cancel} style={{padding:"9px 18px",borderRadius:9,border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:13,fontWeight:500}}>Annuler</button>
                <button onClick={save} style={{padding:"9px 22px",borderRadius:9,background:"#5F3876",color:"white",border:"none",fontWeight:700,cursor:"pointer",fontSize:13}}>
                  {editId?"✓ Enregistrer":"➕ Créer l'utilisateur"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
