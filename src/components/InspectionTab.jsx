import { useState, useMemo } from "react";
import QInput from "./shared/QInput.jsx";
import QuestionExtra from "./QuestionExtra.jsx";
import SigCanvas from "./shared/SigCanvas.jsx";
import ScoreBadge from "./shared/ScoreBadge.jsx";
import { hasPerm, sc, sl, today } from "../utils.js";
import { createInspection, deleteInspection } from "../api.js";

export default function InspectionTab({ questions, sites, cats, inspNames=[], history=[], setHistory, perms={} }) {
  const [view,       setView]      = useState("form");
  const [detailRec,  setDetailRec] = useState(null);
  const [site,       setSite]      = useState("");
  const [date,       setDate]      = useState(today);
  const [inspector,  setInspector] = useState("");
  const [gpsCoords,  setGpsCoords] = useState("");
  const [gpsLoading, setGpsLoading]= useState(false);
  const [headerSig,  setHeaderSig] = useState("");
  const [userAns,    setUserAns]   = useState({});
  const [submitted,  setSubmitted] = useState(false);
  const [open,       setOpen]      = useState(() => { const first = questions[0]; return first ? { [first.cat]: true } : {}; });

  const answers = useMemo(() => {
    const c = { ...userAns };
    (questions||[]).filter(q => q && q.type === "formula").forEach(q => {
      const ids = (q.formula||"").match(/q(\d+)/g) || [];
      const val = ids.reduce((t,qid) => t + (c[parseInt(qid.slice(1))]?.score || 0), 0);
      c[q.id] = { value: val, score: Math.min(val, q.maxScore) };
    });
    return c;
  }, [userAns, questions]);

  const catScoredMap = Object.fromEntries((cats||[]).filter(Boolean).map(c=>[c.name, c.scored!==false]));
  const isQScored = q => q && catScoredMap[q.cat] !== false && q.scored !== false;
  const setAns   = (id, v)     => setUserAns(prev => ({ ...prev, [id]: { ...(prev[id]||{}), ...v } }));
  const setExtra = (id, patch) => setUserAns(prev => ({ ...prev, [id]: { ...(prev[id]||{}), ...patch } }));
  const totalScore = (questions||[]).filter(Boolean).reduce((s,q) => s + (isQScored(q) ? (answers[q.id]?.score||0) : 0), 0);
  const totalMax   = (questions||[]).filter(Boolean).reduce((s,q) => s + (isQScored(q) ? (q.maxScore||0) : 0), 0);
  const pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
  const answered = questions.filter(q => q.type !== "formula" && userAns[q.id] !== undefined).length;
  const catSt = catObj => {
    if(catObj.scored===false) return {score:0, max:0, p:0};
    const qs = (questions||[]).filter(q => q && q.cat===catObj.name);
    const s2 = qs.reduce((s,q) => s + (q.scored===false ? 0 : (answers[q.id]?.score||0)), 0);
    const mx = qs.reduce((s,q) => s + (q.scored===false ? 0 : q.maxScore), 0);
    return {score:s2, max:mx, p: mx>0 ? Math.round((s2/mx)*100) : 0};
  };

  // ── Vue détail (lecture seule) ──
  if(view==="detail" && detailRec) {
    const r  = detailRec;
    const qs = r.questions || [];
    const cs_map = Object.fromEntries((r.cats||[]).map(c=>[c.name,c]));
    const isQScoredR = q => q && (cs_map[q.cat]?.scored!==false) && (q.scored!==false);
    const answerLabel = q => {
      if (!q) return <span style={{color:"#94a3b8",fontStyle:"italic"}}>—</span>;
      const a = (r.answers||{})[q.id];
      if(!a) return <span style={{color:"#94a3b8",fontStyle:"italic"}}>Non répondu</span>;
      if(q.type==="signature") return a.value ? <span style={{color:"#10b981"}}>✓ Signé</span> : <span style={{color:"#94a3b8"}}>Non signé</span>;
      if(q.type==="location")  return <span style={{fontFamily:"monospace",fontSize:12}}>📍 {a.value||"—"}</span>;
      if(q.type==="qrcode")    return <span style={{color:"#10b981"}}>{a.value||"—"}</span>;
      if(q.type==="barcode")   return <span style={{fontFamily:"monospace"}}>{a.value||"—"}</span>;
      if(q.type==="formula")   return <strong>{a.value ?? 0} pts calculés</strong>;
      return <span>{String(a.value||"—")}</span>;
    };
    return (
      <div style={{padding:14,display:"flex",flexDirection:"column",gap:12}}>
        <button onClick={()=>setView("history")}
          style={{alignSelf:"flex-start",display:"flex",alignItems:"center",gap:6,padding:"7px 14px",
            borderRadius:8,border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:13,fontWeight:600,color:"#475569"}}>
          ← Retour à l'historique
        </button>
        <div style={{background:"white",borderRadius:12,border:"2px solid #5F3876",padding:16,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:42,height:42,borderRadius:10,background:"#F5F0FA",border:"1px solid #C9B8DC",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>📋</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:15,color:"#1D1D1B"}}>{r.site}</div>
              <div style={{fontSize:12,color:"#64748b"}}>{r.date}{r.inspector?" · "+r.inspector:""}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:22,fontWeight:800,color:sc(r.pct)}}>{r.pct}%</div>
              <div style={{fontSize:11,color:"#94a3b8"}}>{r.totalScore}/{r.totalMax} pts</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12,color:"#64748b"}}>
            {r.gpsCoords && <div>📍 <strong>{r.gpsCoords}</strong></div>}
            {r.inspector  && <div>👤 <strong>{r.inspector}</strong></div>}
            {r.headerSig  && <div style={{color:"#10b981"}}>✍️ Signé</div>}
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {(r.cats||[]).filter(c=>c.scored!==false).map(catObj=>{
            const qs2 = (qs||[]).filter(q=>q&&q.cat===catObj.name);
            const s2  = qs2.reduce((s,q)=>s+(q.scored===false?0:(r.answers[q.id]?.score||0)),0);
            const mx  = qs2.reduce((s,q)=>s+(q.scored===false?0:q.maxScore),0);
            const p   = mx>0?Math.round((s2/mx)*100):0;
            return (
              <div key={catObj.name} style={{flex:1,minWidth:100,textAlign:"center",padding:"8px 10px",
                borderRadius:8,background:"white",border:"1px solid #e2e8f0"}}>
                <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:2}}>{catObj.name}</div>
                <div style={{fontSize:16,fontWeight:700,color:sc(p)}}>{p}%</div>
              </div>
            );
          })}
        </div>
        {(r.cats||[]).map(catObj=>{
          const qs2 = (qs||[]).filter(q=>q&&q.cat===catObj.name);
          if(!qs2.length) return null;
          return (
            <div key={catObj.name} style={{background:"white",borderRadius:12,border:"1px solid #e2e8f0",overflow:"hidden"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"#FAF7FD",borderBottom:"1px solid #F0EBF7"}}>
                <div style={{width:3,height:18,background:"#5F3876",borderRadius:2,flexShrink:0}}/>
                <span style={{fontWeight:700,fontSize:14,flex:1}}>{catObj.name}</span>
                {catObj.scored===false && <span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:"#F0EBF7",color:"#94a3b8",border:"1px solid #e2e8f0"}}>sans score</span>}
              </div>
              {qs2.map((q,qi)=>{
                const a   = r.answers[q.id];
                const scr = isQScoredR(q);
                const extras = a ? {comment:a.comment,audioURL:a.audioURL,attachments:a.attachments} : {};
                return (
                  <div key={q.id} style={{padding:"12px 14px",borderBottom:qi<qs2.length-1?"1px solid #FDFAF6":"none"}}>
                    <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:6}}>
                      <div style={{flex:1}}>
                        <span style={{fontSize:11,color:"#94a3b8",marginRight:6,fontWeight:700}}>Q{q.id}</span>
                        <span style={{fontSize:14,fontWeight:500,color:"#1D1D1B"}}>{q.text}</span>
                        <span style={{marginLeft:6,fontSize:10,padding:"2px 6px",borderRadius:4,background:"#F0EBF7",color:"#64748b"}}>{q.type}</span>
                      </div>
                      {scr && <ScoreBadge score={a?.score||0} max={q.maxScore} scored={true}/>}
                      {!scr && <span style={{fontSize:11,color:"#94a3b8",border:"1px solid #e2e8f0",borderRadius:12,padding:"2px 8px"}}>—</span>}
                    </div>
                    <div style={{fontSize:14,color:"#1D1D1B",padding:"6px 10px",background:"#FDFAF6",borderRadius:7,border:"1px solid #F0EBF7"}}>
                      {answerLabel(q)}
                    </div>
                    {extras.comment && (
                      <div style={{marginTop:6,fontSize:12,color:"#475569",padding:"6px 10px",background:"#FDFAF6",borderRadius:7,border:"1px dashed #e2e8f0"}}>
                        💬 {extras.comment}
                      </div>
                    )}
                    {extras.audioURL && <div style={{marginTop:6}}><audio src={extras.audioURL} controls style={{height:28,maxWidth:220}}/></div>}
                    {(extras.attachments||[]).length>0 && (
                      <div style={{marginTop:6,display:"flex",flexWrap:"wrap",gap:5}}>
                        {extras.attachments.map((f,fi)=>(
                          <a key={fi} href={f.url} download={f.name}
                            style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:6,
                              background:"white",border:"1px solid #e2e8f0",fontSize:11,color:"#64748b",textDecoration:"none"}}>
                            📎 {f.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Vue historique ──
  if(view==="history") return (
    <div style={{padding:14,display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <button onClick={()=>setView("form")}
          style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,
            border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:13,fontWeight:600,color:"#475569"}}>
          ← Nouvelle inspection
        </button>
        <div style={{fontSize:14,fontWeight:700,color:"#1D1D1B"}}>{history.length} inspection{history.length>1?"s":""} enregistrée{history.length>1?"s":""}</div>
      </div>
      {history.length===0 && (
        <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8"}}>
          <div style={{fontSize:36,marginBottom:8}}>📋</div>
          <div style={{fontSize:14,fontWeight:600,color:"#5F3876"}}>Aucune inspection enregistrée</div>
          <div style={{fontSize:12,marginTop:4,color:"#9F8EAE"}}>Soumettez votre première inspection pour la retrouver ici.</div>
        </div>
      )}
      {history.map(rec=>(
        <div key={rec.id} style={{background:"white",borderRadius:12,border:"1px solid #e2e8f0",
          display:"flex",alignItems:"center",gap:12,transition:"border-color .15s,box-shadow .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#5F3876";e.currentTarget.style.boxShadow="0 2px 12px #5F387620";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.boxShadow="none";}}>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:12,padding:"12px 14px",cursor:"pointer",minWidth:0}}
            onClick={()=>{setDetailRec(rec);setView("detail");}}>
            <div style={{width:44,height:44,borderRadius:10,background:"#F5F0FA",border:"1px solid #C9B8DC",
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:14,fontWeight:800,color:sc(rec.pct)}}>{rec.pct}%</div>
                <div style={{fontSize:8,color:"#94a3b8",lineHeight:1}}>{sl(rec.pct)}</div>
              </div>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:13,color:"#1D1D1B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{rec.site}</div>
              <div style={{fontSize:11,color:"#64748b",marginTop:2,display:"flex",gap:10,flexWrap:"wrap"}}>
                <span>📅 {rec.date}</span>
                {rec.inspector && <span>👤 {rec.inspector}</span>}
                <span style={{color:"#94a3b8"}}>{rec.totalScore}/{rec.totalMax} pts</span>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <div style={{width:52,height:6,background:"#F0EBF7",borderRadius:3}}>
                <div style={{width:rec.pct+"%",height:"100%",background:sc(rec.pct),borderRadius:3}}/>
              </div>
              <span style={{fontSize:12,color:"#94a3b8"}}>›</span>
            </div>
          </div>
          {hasPerm(perms,"inspection","historique_inspection","supprimer") && (
            <button
              onClick={async e=>{e.stopPropagation();if(!window.confirm("Supprimer cette inspection ?"))return;try{await deleteInspection(rec.id);}catch{}setHistory(h=>h.filter(x=>x.id!==rec.id));}}
              style={{padding:"6px 10px",marginRight:10,borderRadius:7,border:"1px solid #fee2e2",
                background:"#fff5f5",color:"#ef4444",fontSize:12,cursor:"pointer",flexShrink:0,
                lineHeight:1,display:"flex",alignItems:"center",gap:4}}>
              🗑️
            </button>
          )}
        </div>
      ))}
    </div>
  );

  if (submitted) return (
    <div style={{padding:32,textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:10}}>✅</div>
      <h2 style={{fontSize:22,fontWeight:700,margin:"0 0 6px",color:"#1D1D1B"}}>Inspection soumise avec succès</h2>
      <p style={{color:"#64748b",marginBottom:20}}>{site} — {date}{inspector?" · "+inspector:""}</p>
      <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:112,height:112,borderRadius:"50%",
        border:`6px solid ${sc(pct)}`,marginBottom:10}}>
        <div><div style={{fontSize:26,fontWeight:700,color:sc(pct)}}>{pct}%</div>
          <div style={{fontSize:11,color:"#64748b"}}>{totalScore}/{totalMax}</div></div>
      </div>
      <p style={{fontSize:17,fontWeight:700,color:sc(pct),marginBottom:20}}>{sl(pct)}</p>
      <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginBottom:24}}>
        {cats.filter(c=>c.scored!==false).map(catObj=>{const cs=catSt(catObj);return(
          <div key={catObj.name} style={{padding:"8px 14px",borderRadius:8,background:"white",border:"1px solid #e2e8f0"}}>
            <div style={{fontSize:11,color:"#94a3b8",marginBottom:2}}>{catObj.name}</div>
            <div style={{fontSize:16,fontWeight:700,color:sc(cs.p)}}>{cs.p}%</div>
          </div>
        );})}
      </div>
      <button onClick={()=>{setUserAns({});setSubmitted(false);setSite("");setInspector("");setGpsCoords("");setHeaderSig("");setView("history");}}
        style={{padding:"12px 32px",borderRadius:10,background:"#5F3876",color:"white",border:"none",fontSize:15,fontWeight:700,cursor:"pointer"}}>
        Voir l'historique
      </button>
    </div>
  );

  return (
    <div style={{padding:14,display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",borderRadius:10,border:"1px solid #e2e8f0",overflow:"hidden",background:"white"}}>
        {[{v:"form",l:"📋 Nouvelle inspection"},{v:"history",l:`🕐 Historique${history.length?" ("+history.length+")":""}`}].map(({v,l})=>(
          <button key={v} onClick={()=>setView(v)}
            style={{flex:1,padding:"9px 8px",border:"none",fontSize:13,cursor:"pointer",fontWeight:view===v?700:400,
              background:view===v?"#5F3876":"white",color:view===v?"white":"#64748b",transition:"all .15s"}}>
            {l}
          </button>
        ))}
      </div>

      <div style={{background:"white",borderRadius:12,border:"1px solid #e2e8f0",padding:14,display:"flex",flexDirection:"column",gap:12}}>
        <div className="form-grid-2">
          <div>
            <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Site inspecté</label>
            <select value={site} onChange={e=>setSite(e.target.value)}
              style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${site?"#5F3876":"#e2e8f0"}`,fontSize:14,background:"white",fontFamily:"inherit"}}>
              <option value="">-- Sélectionner un site --</option>
              {sites.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Date d'inspection</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)}
              style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:14,boxSizing:"border-box"}}/>
          </div>
        </div>
        <div className="form-grid-2">
          <div>
            <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Inspecteur</label>
            <select value={inspector} onChange={e=>setInspector(e.target.value)}
              style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${inspector?"#5F3876":"#e2e8f0"}`,fontSize:14,background:"white",fontFamily:"inherit"}}>
              <option value="">-- Sélectionner un inspecteur --</option>
              {inspNames.map(a=><option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Localisation GPS</label>
            <div style={{display:"flex",gap:6,alignItems:"stretch"}}>
              <div style={{flex:1,padding:"8px 10px",borderRadius:8,border:`1px solid ${gpsCoords?"#10b981":"#e2e8f0"}`,
                fontSize:12,color:gpsCoords?"#166534":"#94a3b8",background:gpsCoords?"#f0fdf4":"#FDFAF6",
                fontFamily:"monospace",display:"flex",alignItems:"center",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
                {gpsCoords||"Non capturée"}
              </div>
              <button
                onClick={()=>{setGpsLoading(true);setTimeout(()=>{const lat=(43+Math.random()*6).toFixed(5);const lng=(-2+Math.random()*9).toFixed(5);setGpsCoords(`${lat}°N, ${lng}°E`);setGpsLoading(false);},900);}}
                style={{padding:"8px 12px",borderRadius:8,border:"1px solid #5F3876",background:gpsLoading?"#F5F0FA":"white",
                  color:"#5F3876",cursor:"pointer",fontSize:13,fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>
                {gpsLoading?"📡 …":"📡 Capter"}
              </button>
              {gpsCoords && <button onClick={()=>setGpsCoords("")}
                style={{padding:"8px 10px",borderRadius:8,border:"1px solid #fee2e2",background:"#fff5f5",color:"#ef4444",cursor:"pointer",fontSize:12,flexShrink:0}}>✕</button>}
            </div>
          </div>
        </div>
        <div>
          <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Signature de l'inspecteur</label>
          <SigCanvas value={headerSig} onChange={sig=>setHeaderSig(sig)}/>
        </div>
      </div>

      <div style={{background:"white",borderRadius:12,border:"1px solid #e2e8f0",padding:14}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:13,color:"#64748b"}}>{answered} / {questions.filter(q=>q.type!=="formula").length} questions répondues</span>
          <span style={{fontSize:15,fontWeight:700,color:sc(pct)}}>{totalScore} / {totalMax} pts — {pct}%</span>
        </div>
        <div style={{height:8,background:"#F0EBF7",borderRadius:4}}>
          <div style={{width:`${pct}%`,height:"100%",background:sc(pct),borderRadius:4,transition:"width 0.4s"}}/>
        </div>
        <div style={{display:"flex",gap:6,marginTop:10}}>
          {cats.map(catObj=>{ const cs=catSt(catObj); return (
            <div key={catObj.name} style={{flex:1,textAlign:"center",padding:"6px 4px",borderRadius:6,background:"#FDFAF6"}}>
              <div style={{fontSize:10,color:"#94a3b8",marginBottom:1,fontWeight:600}}>{catObj.name}</div>
              {catObj.scored!==false
                ? <div style={{fontSize:13,fontWeight:700,color:sc(cs.p)}}>{cs.p}%</div>
                : <div style={{fontSize:12,color:"#94a3b8"}}>—</div>
              }
            </div>
          );})}
        </div>
      </div>

      {cats.map(catObj => {
        const cs = catSt(catObj);
        const qs = (questions||[]).filter(q => q && q.cat === catObj.name);
        const isOpen = open[catObj.name] ?? false;
        return (
          <div key={catObj.name} style={{background:"white",borderRadius:12,border:"1px solid #e2e8f0",overflow:"hidden"}}>
            <div onClick={()=>setOpen(o=>({...o,[catObj.name]:!o[catObj.name]}))}
              style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",cursor:"pointer",
                borderBottom:isOpen?"1px solid #F0EBF7":"none",background:isOpen?"#FAF7FD":"white",userSelect:"none"}}>
              <div style={{width:3,height:22,background:"#5F3876",borderRadius:2,flexShrink:0}}/>
              <span style={{fontWeight:700,fontSize:14,flex:1}}>{catObj.name}</span>
              {catObj.scored===false && <span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:"#F0EBF7",color:"#94a3b8",border:"1px solid #e2e8f0",flexShrink:0}}>sans score</span>}
              <span style={{fontSize:11,padding:"2px 8px",borderRadius:12,background:"#FDFAF6",color:"#64748b",border:"1px solid #e2e8f0"}}>
                {qs.filter(q=>userAns[q.id]!==undefined||q.type==="formula").length}/{qs.length}
              </span>
              {catObj.scored!==false
                ? <span style={{fontSize:14,fontWeight:700,color:sc(cs.p),marginLeft:4}}>{cs.score}/{cs.max} pts</span>
                : <span style={{fontSize:13,color:"#94a3b8",marginLeft:4}}>—</span>
              }
              <span style={{fontSize:11,color:"#94a3b8",transform:isOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s",marginLeft:6}}>▼</span>
            </div>
            {isOpen && qs.map((q,qi) => (
              <div key={q.id} style={{padding:"14px",borderBottom:qi<qs.length-1?"1px solid #FDFAF6":"none"}}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10}}>
                  <div style={{flex:1}}>
                    <span style={{fontSize:11,color:"#94a3b8",marginRight:6,fontWeight:700}}>Q{q.id}</span>
                    <span style={{fontSize:14,fontWeight:500,color:"#1D1D1B"}}>{q.text}</span>
                    <span style={{marginLeft:6,fontSize:10,padding:"2px 6px",borderRadius:4,background:"#F0EBF7",color:"#64748b",fontWeight:600}}>{q.type}</span>
                  </div>
                  <ScoreBadge score={answers[q.id]?.score||0} max={q.maxScore} scored={isQScored(q)}/>
                </div>
                <QInput q={q} ans={answers[q.id]} onChange={v=>setAns(q.id,v)} answers={answers} inspNames={inspNames}/>
                <QuestionExtra extra={userAns[q.id]} onChange={patch => setExtra(q.id, patch)}/>
              </div>
            ))}
          </div>
        );
      })}

      {hasPerm(perms,"inspection","inspection","creer") && <button onClick={async ()=>{
        if(!site){alert("Veuillez sélectionner un site.");return;}
        const record = {
          id: Date.now(), site, date, inspector, gpsCoords, headerSig,
          answers: JSON.parse(JSON.stringify(userAns)),
          totalScore, totalMax, pct,
          questions: JSON.parse(JSON.stringify(questions)),
          cats:      JSON.parse(JSON.stringify(cats)),
        };
        try {
          const saved = await createInspection(record);
          setHistory(h=>[saved,...h]);
        } catch {
          setHistory(h=>[record,...h]);
        }
        setSubmitted(true);
      }}
        style={{padding:"14px",borderRadius:12,background:site?"#5F3876":"#CDC5D5",color:site?"white":"#9D9D9C",
          border:"none",fontSize:15,fontWeight:700,cursor:site?"pointer":"default",transition:"background 0.2s"}}>
        ✔ Soumettre l'inspection — {totalScore}/{totalMax} pts ({pct}%)
      </button>}
    </div>
  );
}
