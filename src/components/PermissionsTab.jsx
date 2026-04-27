import { useState } from "react";
import {
  DEFAULT_PERMISSIONS, RIGHTS, RIGHT_LABELS, RIGHT_ICONS,
  MENU_OBJECTS, OBJECT_LABELS, MENU_LABELS,
} from "../constants.js";
import { roleInfo } from "../utils.js";
import { savePermissions } from "../api.js";

export default function PermissionsTab({ rolePerms, setRolePerms }) {
  const [activeRole, setActiveRole] = useState("superviseur");
  const [saved,      setSaved]      = useState(false);

  const buildGrid = role => {
    const base = DEFAULT_PERMISSIONS[role] || {};
    const over = (rolePerms || {})[role] || {};
    const result = {};
    Object.keys(base).forEach(key => {
      result[key] = { ...base[key], ...(over[key] || {}) };
    });
    return result;
  };

  const [grid, setGrid] = useState(() => buildGrid(activeRole));

  const switchRole = r => { setActiveRole(r); setGrid(buildGrid(r)); setSaved(false); };

  const toggle = (key, right) => {
    setGrid(g => ({ ...g, [key]: { ...g[key], [right]: !g[key]?.[right] } }));
    setSaved(false);
  };

  const toggleRow = (key) => {
    const allOn = RIGHTS.every(r => grid[key]?.[r]);
    setGrid(g => ({ ...g, [key]: Object.fromEntries(RIGHTS.map(r => [r, !allOn])) }));
    setSaved(false);
  };

  const toggleCol = (right) => {
    const allOn = Object.keys(grid).every(k => grid[k]?.[right]);
    setGrid(g => {
      const n = { ...g };
      Object.keys(n).forEach(k => { n[k] = { ...n[k], [right]: !allOn }; });
      return n;
    });
    setSaved(false);
  };

  const toggleMenu = (menuId) => {
    const keys = (MENU_OBJECTS[menuId] || []).map(o => `${menuId}.${o}`);
    const allOn = keys.every(k => RIGHTS.every(r => grid[k]?.[r]));
    setGrid(g => {
      const n = { ...g };
      keys.forEach(k => { n[k] = Object.fromEntries(RIGHTS.map(r => [r, !allOn])); });
      return n;
    });
    setSaved(false);
  };

  const resetRole = () => { setGrid(buildGrid(activeRole)); setSaved(false); };

  const save = async () => {
    const newPerms = { ...rolePerms, [activeRole]: grid };
    setRolePerms(newPerms);
    try { await savePermissions(newPerms); } catch(err) { console.error(err); }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const editableRoles = ["superviseur", "inspecteur"];
  const defCell = {width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0};

  return (
    <div style={{padding:16, display:"flex", flexDirection:"column", gap:16}}>

      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10}}>
        <div>
          <div style={{fontSize:16, fontWeight:700, color:"#1D1D1B"}}>Gestion des permissions</div>
          <div style={{fontSize:12, color:"#9F8EAE", marginTop:2}}>Définissez les droits d'accès par rôle et par objet</div>
        </div>
        <div style={{display:"flex", gap:8}}>
          <button onClick={resetRole}
            style={{padding:"7px 14px", borderRadius:8, border:"1px solid #C9B8DC", background:"white",
              cursor:"pointer", fontSize:12, color:"#7A5499", fontWeight:500}}>
            ↺ Réinitialiser
          </button>
          <button onClick={save}
            style={{padding:"7px 18px", borderRadius:8, border:"none",
              background:saved?"#70BC80":"#5F3876", color:"white",
              cursor:"pointer", fontSize:12, fontWeight:700, transition:"background .3s",
              display:"flex", alignItems:"center", gap:6}}>
            {saved ? "✓ Enregistré" : "💾 Enregistrer"}
          </button>
        </div>
      </div>

      <div style={{display:"flex", gap:8}}>
        {editableRoles.map(r => {
          const ri = roleInfo(r);
          const active = activeRole === r;
          return (
            <button key={r} onClick={() => switchRole(r)}
              style={{padding:"8px 18px", borderRadius:10, border:`2px solid ${active?"#5F3876":"#C9B8DC"}`,
                background:active?"#5F3876":"white", color:active?"white":"#5F3876",
                cursor:"pointer", fontSize:13, fontWeight:active?700:500,
                fontFamily:"inherit", transition:"all .15s"}}>
              {ri.label}
              {active && <span style={{marginLeft:6, fontSize:10, opacity:.8}}>en cours d'édition</span>}
            </button>
          );
        })}
        <div style={{marginLeft:"auto", padding:"8px 14px", borderRadius:10,
          background:"#F5F0FA", border:"1px solid #C9B8DC",
          fontSize:12, color:"#9F8EAE", display:"flex", alignItems:"center", gap:5}}>
          🔒 <span>Administrateur : tous les droits (non modifiable)</span>
        </div>
      </div>

      <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
        {RIGHTS.map(r => (
          <div key={r} style={{display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#64748b"}}>
            <span style={{fontSize:14}}>{RIGHT_ICONS[r]}</span>
            <span style={{fontWeight:600}}>{RIGHT_LABELS[r]}</span>
          </div>
        ))}
      </div>

      <div style={{background:"white", borderRadius:14, border:"1px solid #F0EBF7", overflow:"hidden",
        boxShadow:"0 2px 12px rgba(95,56,118,0.06)"}}>

        <div style={{display:"flex", alignItems:"center", background:"#5F3876",
          padding:"0 16px", borderBottom:"1px solid rgba(255,255,255,0.15)"}}>
          <div style={{flex:1, fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.8)",
            textTransform:"uppercase", letterSpacing:.8, padding:"12px 0"}}>
            Objet / Module
          </div>
          {RIGHTS.map(r => (
            <div key={r} style={{...defCell, flexDirection:"column", cursor:"pointer",
              paddingTop:8, paddingBottom:8, height:"auto", gap:3}}
              onClick={() => toggleCol(r)}
              title={`Tout basculer — ${RIGHT_LABELS[r]}`}>
              <span style={{fontSize:14}}>{RIGHT_ICONS[r]}</span>
              <span style={{fontSize:9, color:"rgba(255,255,255,0.8)", fontWeight:700,
                textTransform:"uppercase", letterSpacing:.5}}>{RIGHT_LABELS[r]}</span>
            </div>
          ))}
        </div>

        {Object.entries(MENU_OBJECTS).map(([menuId, objs], mi) => {
          const menuKeys = objs.map(o => `${menuId}.${o}`);
          const menuAllOn = menuKeys.every(k => RIGHTS.every(r => grid[k]?.[r]));
          const menuSomeOn = menuKeys.some(k => RIGHTS.some(r => grid[k]?.[r]));
          return (
            <div key={menuId}>
              <div style={{display:"flex", alignItems:"center",
                background:"#FAF7FD", borderBottom:"1px solid #F0EBF7",
                padding:"0 16px", cursor:"pointer"}}
                onClick={() => toggleMenu(menuId)}>
                <div style={{flex:1, fontSize:12, fontWeight:700, color:"#5F3876",
                  textTransform:"uppercase", letterSpacing:.6, padding:"9px 0",
                  display:"flex", alignItems:"center", gap:8}}>
                  <span>{["📊","📋","✏️","📍","👤","🔐"][mi]}</span>
                  <span>{MENU_LABELS[menuId]}</span>
                  <span style={{fontSize:10, padding:"2px 7px", borderRadius:10,
                    background: menuAllOn?"#5F3876":menuSomeOn?"#C9B8DC":"#F0EBF7",
                    color: menuAllOn||menuSomeOn?"white":"#9F8EAE", fontWeight:600,
                    marginLeft:4}}>
                    {menuAllOn?"Tout activé":menuSomeOn?"Partiel":"Aucun accès"}
                  </span>
                </div>
                {RIGHTS.map(r => {
                  const allOn = menuKeys.every(k => grid[k]?.[r]);
                  return <div key={r} style={{...defCell, color: allOn?"#5F3876":"#e2e8f0", fontSize:14}}>●</div>;
                })}
              </div>

              {objs.map((obj, oi) => {
                const key = `${menuId}.${obj}`;
                const rowAllOn = RIGHTS.every(r => grid[key]?.[r]);
                return (
                  <div key={key} style={{display:"flex", alignItems:"center",
                    padding:"0 16px 0 32px",
                    borderBottom: oi < objs.length-1 ? "1px solid #FAF7FD" : "1px solid #F0EBF7",
                    background:"white", transition:"background .1s"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#FDFAF6"}
                    onMouseLeave={e=>e.currentTarget.style.background="white"}>
                    <div style={{flex:1, fontSize:13, color:"#1D1D1B",
                      padding:"10px 0", display:"flex", alignItems:"center", gap:8, cursor:"pointer"}}
                      onClick={() => toggleRow(key)}>
                      <div style={{width:14, height:14, borderRadius:4,
                        border:`2px solid ${rowAllOn?"#5F3876":"#C9B8DC"}`,
                        background:rowAllOn?"#5F3876":"white",
                        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                        {rowAllOn && <span style={{color:"white", fontSize:9, fontWeight:900}}>✓</span>}
                      </div>
                      {OBJECT_LABELS[obj] || obj}
                    </div>
                    {RIGHTS.map(r => {
                      const on = grid[key]?.[r] === true;
                      return (
                        <div key={r} style={defCell}>
                          <button onClick={() => toggle(key, r)}
                            style={{width:28, height:28, borderRadius:7,
                              border:`2px solid ${on?"#5F3876":"#E2D9F3"}`,
                              background:on?"#5F3876":"white",
                              cursor:"pointer", display:"flex", alignItems:"center",
                              justifyContent:"center", fontSize:12, transition:"all .12s",
                              color:on?"white":"#C9B8DC"}}>
                            {on ? "✓" : "–"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div style={{padding:"10px 14px", borderRadius:10, background:"#F5F0FA",
        border:"1px solid #C9B8DC", fontSize:12, color:"#7A5499", display:"flex", gap:8, alignItems:"flex-start"}}>
        <span style={{fontSize:16, flexShrink:0}}>💡</span>
        <div>
          <strong>Astuce :</strong> Cliquez sur un nom de menu pour tout basculer, sur un nom d'objet pour activer/désactiver tous ses droits, ou sur un en-tête de colonne pour basculer ce droit sur tous les objets. Les modifications s'appliquent après avoir cliqué sur <strong>Enregistrer</strong>.
        </div>
      </div>
    </div>
  );
}
