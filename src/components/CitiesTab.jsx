import { useState } from "react";
import { hasPerm } from "../utils.js";
import { createCity, updateCity, deleteCity } from "../api.js";

export default function CitiesTab({ cities=[], setCities, perms={} }) {
  const blank = { name:"", region:"", pays:"" };
  const [form,     setForm]    = useState(blank);
  const [editId,   setEditId]  = useState(null);
  const [showForm, setShowForm]= useState(false);
  const [expandId, setExpand]  = useState(null);

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name) { alert("Le nom de la ville est requis."); return; }
    try {
      if (editId) {
        const updated = await updateCity(editId, form);
        setCities(cs => cs.map(c => c.id === editId ? updated : c));
      } else {
        const created = await createCity(form);
        setCities(cs => [...cs, created]);
      }
      setForm(blank); setEditId(null); setShowForm(false);
    } catch (err) { alert(err.message); }
  };

  const openNew   = ()  => { setForm(blank); setEditId(null); setShowForm(true); };
  const startEdit = (c) => { setForm({ name:c.name, region:c.region||"", pays:c.pays||"" }); setEditId(c.id); setShowForm(true); };
  const cancel    = ()  => { setForm(blank); setEditId(null); setShowForm(false); };

  const del = async (id) => {
    if (!window.confirm("Supprimer cette ville ? Les sites rattachés ne seront plus associés à une ville.")) return;
    try { await deleteCity(id); setCities(cs => cs.filter(c => c.id !== id)); } catch (err) { alert(err.message); }
  };

  const fieldStyle = { width:"100%", padding:"7px 10px", borderRadius:8, border:"1px solid #e2e8f0", fontSize:14, boxSizing:"border-box", fontFamily:"inherit", outline:"none" };
  const labelStyle = { fontSize:11, color:"#64748b", fontWeight:700, display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:.4 };

  return (
    <div style={{padding:14, display:"flex", flexDirection:"column", gap:12}}>

      <div style={{display:"flex", alignItems:"center", gap:10, flexWrap:"wrap"}}>
        <div style={{flex:1, minWidth:0}}>
          <span style={{fontSize:15, fontWeight:700, color:"#1D1D1B"}}>
            {cities.length} ville{cities.length !== 1 ? "s" : ""} configurée{cities.length !== 1 ? "s" : ""}
          </span>
        </div>
        {hasPerm(perms, "cities", "cities", "creer") && (
          <button onClick={openNew}
            style={{display:"flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:10,
              background:"#5F3876", color:"white", border:"none", fontWeight:700, fontSize:13,
              cursor:"pointer", flexShrink:0, whiteSpace:"nowrap"}}>
            ＋ Nouvelle ville
          </button>
        )}
      </div>

      {cities.length === 0 && (
        <div style={{textAlign:"center", padding:"48px 0", color:"#9F8EAE"}}>
          <div style={{fontSize:40, marginBottom:10}}>🏙️</div>
          <div style={{fontSize:15, fontWeight:600, color:"#5F3876", marginBottom:6}}>Aucune ville configurée</div>
          <div style={{fontSize:13, marginBottom:20}}>Ajoutez des villes pour les rattacher à vos sites.</div>
          {hasPerm(perms, "cities", "cities", "creer") && (
            <button onClick={openNew}
              style={{padding:"10px 24px", borderRadius:10, background:"#5F3876", color:"white",
                border:"none", fontWeight:700, fontSize:14, cursor:"pointer"}}>
              ＋ Ajouter une ville
            </button>
          )}
        </div>
      )}

      <div style={{display:"flex", flexDirection:"column", gap:8}}>
        {cities.map(c => {
          const isOpen = expandId === c.id;
          return (
            <div key={c.id} style={{background:"white", borderRadius:12,
              border:`1px solid ${isOpen ? "#5F3876" : "#F0EBF7"}`,
              overflow:"hidden", transition:"border-color .2s",
              boxShadow: isOpen ? "0 2px 12px rgba(95,56,118,0.1)" : "none"}}>
              <div style={{display:"flex", alignItems:"center", gap:12, padding:"12px 14px", cursor:"pointer"}}
                onClick={() => setExpand(id => id === c.id ? null : c.id)}>
                <div style={{width:40, height:40, borderRadius:10, background:"#F5F0FA", border:"1px solid #C9B8DC",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0}}>🏙️</div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontWeight:700, fontSize:14, color:"#1D1D1B", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{c.name}</div>
                  <div style={{fontSize:12, color:"#9F8EAE", marginTop:1}}>
                    {[c.region, c.pays].filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>
                <span style={{color:"#C9B8DC", fontSize:12, transform:isOpen?"rotate(180deg)":"none", transition:"transform .2s", flexShrink:0}}>▼</span>
              </div>
              {isOpen && (
                <div style={{borderTop:"1px solid #F0EBF7", padding:"14px 16px", display:"flex", flexDirection:"column", gap:10}}>
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
                    {[["🗺️ Région", c.region], ["🌍 Pays", c.pays]].map(([l, v]) => v ? (
                      <div key={l}>
                        <div style={{fontSize:10, color:"#9F8EAE", fontWeight:700, textTransform:"uppercase", marginBottom:2}}>{l}</div>
                        <div style={{fontSize:13, color:"#1D1D1B", fontWeight:500}}>{v}</div>
                      </div>
                    ) : null)}
                  </div>
                  <div style={{display:"flex", gap:7, justifyContent:"flex-end", paddingTop:4, borderTop:"1px solid #F0EBF7"}}>
                    {hasPerm(perms, "cities", "cities", "modifier") && (
                      <button onClick={() => startEdit(c)}
                        style={{padding:"6px 14px", borderRadius:8, border:"1px solid #e2e8f0", background:"white", cursor:"pointer", fontSize:13, fontWeight:500}}>✏️ Modifier</button>
                    )}
                    {hasPerm(perms, "cities", "cities", "supprimer") && (
                      <button onClick={() => del(c.id)}
                        style={{padding:"6px 14px", borderRadius:8, border:"1px solid #fee2e2", background:"#fff5f5", cursor:"pointer", fontSize:13, fontWeight:500, color:"#ef4444"}}>🗑️ Supprimer</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={cancel}>
          <div className="modal-box" style={{maxWidth:440}} onClick={e => e.stopPropagation()}>
            <div style={{padding:"20px 24px 16px", borderBottom:"1px solid #F0EBF7", display:"flex", alignItems:"center", gap:10}}>
              <div style={{width:38, height:38, borderRadius:10, background:"#5F3876", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0}}>🏙️</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700, fontSize:16, color:"#1D1D1B"}}>{editId ? "Modifier la ville" : "Nouvelle ville"}</div>
                <div style={{fontSize:11, color:"#9F8EAE", marginTop:1}}>Informations géographiques</div>
              </div>
              <button onClick={cancel} style={{border:"none", background:"none", fontSize:22, cursor:"pointer", color:"#9F8EAE", padding:4, lineHeight:1}}>×</button>
            </div>
            <div style={{padding:"16px 24px 24px", display:"flex", flexDirection:"column", gap:14}}>
              <div>
                <label style={labelStyle}>Nom de la ville *</label>
                <input value={form.name} onChange={e => F("name", e.target.value)}
                  placeholder="Ex: Abidjan" style={fieldStyle}
                  onKeyDown={e => e.key === "Enter" && save()}/>
              </div>
              <div>
                <label style={labelStyle}>Région / District</label>
                <input value={form.region} onChange={e => F("region", e.target.value)}
                  placeholder="Ex: Lagunes" style={fieldStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Pays</label>
                <input value={form.pays} onChange={e => F("pays", e.target.value)}
                  placeholder="Ex: Côte d'Ivoire" style={fieldStyle}/>
              </div>
              <div style={{display:"flex", gap:8, justifyContent:"flex-end", borderTop:"1px solid #F0EBF7", paddingTop:14, marginTop:4}}>
                <button onClick={cancel} style={{padding:"9px 18px", borderRadius:9, border:"1px solid #e2e8f0", background:"white", cursor:"pointer", fontSize:13, fontWeight:500}}>Annuler</button>
                {(editId ? hasPerm(perms,"cities","cities","modifier") : hasPerm(perms,"cities","cities","creer")) && (
                  <button onClick={save} style={{padding:"9px 22px", borderRadius:9, background:"#5F3876", color:"white", border:"none", fontWeight:700, cursor:"pointer", fontSize:13}}>
                    {editId ? "✓ Enregistrer" : "➕ Ajouter la ville"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
