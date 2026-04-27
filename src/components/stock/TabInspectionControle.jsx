import { useState, useMemo } from "react";
import QInput from "../shared/QInput.jsx";
import QuestionExtra from "../QuestionExtra.jsx";
import ScoreBadge from "../shared/ScoreBadge.jsx";
import { today } from "../../utils.js";

export default function TabInspectionControle({ controle, setControle, history=[], setHistory, questions=[], cats=[] }) {
  const locked = controle.statut === "cloture";
  const { site="" } = controle;

  const insp        = controle.inspection || {};
  const [userAns,   setUserAns]  = useState(insp.answers   || {});
  const [inspector, setInspector]= useState(insp.inspector || "");
  const [date,      setDate]     = useState(insp.date      || controle.dateControle || today);
  const [submitted, setSubmitted]= useState(!!insp.submitted);
  const [openCats,  setOpenCats] = useState({});
  const isCatOpen = name => openCats[name] !== false;

  const syncToControle = (ans, insp_, date_) => {
    if (locked) return;
    setControle(c => ({
      ...c,
      inspection: {
        ...(c.inspection||{}),
        answers: ans,
        inspector: insp_,
        date: date_,
        submitted: false,
      }
    }));
  };

  const setAns   = (id, v)     => { const n={...userAns,[id]:{...(userAns[id]||{}),...v}}; setUserAns(n); syncToControle(n,inspector,date); };
  const setExtra = (id, patch) => { const n={...userAns,[id]:{...(userAns[id]||{}),...patch}}; setUserAns(n); syncToControle(n,inspector,date); };
  const setInsp_ = v => { setInspector(v); syncToControle(userAns,v,date); };
  const setDate_ = v => { setDate(v);      syncToControle(userAns,inspector,v); };

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
  const isQScored    = q => q && catScoredMap[q.cat]!==false && q.scored!==false;
  const totalScore   = (questions||[]).filter(Boolean).reduce((s,q)=>s+(isQScored(q)?(answers[q.id]?.score||0):0),0);
  const totalMax     = (questions||[]).filter(Boolean).reduce((s,q)=>s+(isQScored(q)?(q.maxScore||0):0),0);
  const pct          = totalMax>0 ? Math.round((totalScore/totalMax)*100) : 0;
  const answered     = (questions||[]).filter(q=>q&&q.type!=="formula"&&userAns[q.id]!==undefined).length;
  const totalQ       = (questions||[]).filter(q=>q&&q.type!=="formula").length;

  const catSt = catObj => {
    if(catObj.scored===false) return {score:0,max:0,p:0};
    const qs=(questions||[]).filter(q=>q&&q.cat===catObj.name);
    const s2=qs.reduce((s,q)=>s+(q.scored===false?0:(answers[q.id]?.score||0)),0);
    const mx=qs.reduce((s,q)=>s+(q.scored===false?0:(q.maxScore||0)),0);
    return {score:s2,max:mx,p:mx>0?Math.round((s2/mx)*100):0};
  };

  const submit = () => {
    if(!site){alert("Le contrôle n'a pas de site associé.");return;}
    const record = {
      id:         Date.now(),
      site,
      date,
      inspector,
      gpsCoords:  insp.gpsCoords||"",
      headerSig:  insp.headerSig||"",
      answers:    JSON.parse(JSON.stringify(userAns)),
      totalScore, totalMax, pct,
      questions:  JSON.parse(JSON.stringify(questions)),
      cats:       JSON.parse(JSON.stringify(cats)),
      controleId: controle.id,
    };
    setHistory(h => {
      const filtered = h.filter(x => x.controleId !== controle.id);
      return [record, ...filtered];
    });
    setControle(c=>({...c, inspection:{...(c.inspection||{}), ...record, submitted:true}}));
    setSubmitted(true);
  };

  const sc = p => p>=85?"#70BC80":p>=65?"#7A5499":p>=40?"#E94C57":"#633F0F";

  if (questions.length===0) return (
    <div style={{padding:"40px",textAlign:"center",color:"#9F8EAE"}}>
      <div style={{fontSize:32,marginBottom:10}}>📝</div>
      <div style={{fontSize:14,fontWeight:600,color:"#5F3876"}}>Aucune question configurée</div>
      <div style={{fontSize:12,marginTop:6}}>Créez des questions dans l'onglet Constructeur.</div>
    </div>
  );

  if (submitted && !locked) return (
    <div style={{padding:"32px",textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:10}}>✅</div>
      <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 6px",color:"#1D1D1B"}}>Inspection enregistrée</h2>
      <p style={{color:"#64748b",marginBottom:20}}>{site} — {date}{inspector?" · "+inspector:""}</p>
      <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:100,height:100,borderRadius:"50%",
        border:`6px solid ${sc(pct)}`,marginBottom:10}}>
        <div><div style={{fontSize:24,fontWeight:700,color:sc(pct)}}>{pct}%</div>
          <div style={{fontSize:11,color:"#64748b"}}>{totalScore}/{totalMax}</div></div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginBottom:20,marginTop:12}}>
        {cats.filter(c=>c.scored!==false).map(catObj=>{const cs=catSt(catObj);return(
          <div key={catObj.name} style={{padding:"8px 14px",borderRadius:8,background:"white",border:"1px solid #e2e8f0"}}>
            <div style={{fontSize:11,color:"#94a3b8",marginBottom:2}}>{catObj.name}</div>
            <div style={{fontSize:15,fontWeight:700,color:sc(cs.p)}}>{cs.p}%</div>
          </div>
        );})}
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"center"}}>
        <button onClick={()=>setSubmitted(false)}
          style={{padding:"10px 24px",borderRadius:9,background:"white",color:"#5F3876",
            border:"2px solid #5F3876",fontSize:14,fontWeight:700,cursor:"pointer"}}>
          ✏️ Modifier
        </button>
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{background:"white",borderRadius:12,border:"1px solid #F0EBF7",padding:"14px 16px"}}>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div style={{flex:1,minWidth:160}}>
            <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.4}}>Inspecteur</label>
            <input value={inspector} onChange={e=>setInsp_(e.target.value)} readOnly={locked}
              placeholder="Nom de l'inspecteur"
              style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,
                boxSizing:"border-box",fontFamily:"inherit",outline:"none",background:locked?"#FDFAF6":"white"}}/>
          </div>
          <div style={{minWidth:160}}>
            <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.4}}>Date</label>
            <input type="date" value={date} onChange={e=>setDate_(e.target.value)} readOnly={locked}
              style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,
                boxSizing:"border-box",fontFamily:"inherit",outline:"none",background:locked?"#FDFAF6":"white"}}/>
          </div>
          {totalMax>0 && (
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,
              background:"#F5F0FA",border:`1px solid ${sc(pct)}40`}}>
              <div style={{width:48,height:48,borderRadius:"50%",border:`3px solid ${sc(pct)}`,
                display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontWeight:800,fontSize:15,color:sc(pct)}}>{pct}%</span>
              </div>
              <div>
                <div style={{fontWeight:700,fontSize:13,color:"#1D1D1B"}}>{totalScore}/{totalMax} pts</div>
                <div style={{fontSize:11,color:"#9F8EAE"}}>{answered}/{totalQ} réponses</div>
                <div style={{width:100,height:4,background:"#F0EBF7",borderRadius:2,marginTop:4}}>
                  <div style={{width:(answered/Math.max(totalQ,1)*100)+"%",height:"100%",background:sc(pct),borderRadius:2,transition:"width .3s"}}/>
                </div>
              </div>
            </div>
          )}
        </div>
        {submitted && (
          <div style={{marginTop:10,padding:"7px 12px",borderRadius:8,background:"#f0fdf4",border:"1px solid #bbf7d0",
            fontSize:12,color:"#166534",fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
            ✅ Cette inspection figure dans l'historique des inspections
          </div>
        )}
      </div>

      {(cats||[]).filter(c=>c&&(questions||[]).some(q=>q&&q.cat===c.name)).map(catObj=>{
        const qs=(questions||[]).filter(q=>q&&q.cat===catObj.name);
        const cs=catSt(catObj);
        const open = isCatOpen(catObj.name);
        return (
          <div key={catObj.name} style={{background:"white",borderRadius:12,border:"1px solid #F0EBF7",overflow:"hidden"}}>
            <div onClick={()=>setOpenCats(o=>({...o,[catObj.name]:!open}))}
              style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",cursor:"pointer",
                background:open?"#FAF7FD":"white",borderBottom:open?"1px solid #F0EBF7":"none",userSelect:"none"}}>
              <div style={{width:3,height:22,background:"#5F3876",borderRadius:2,flexShrink:0}}/>
              <span style={{fontWeight:700,fontSize:13,color:"#5F3876",flex:1}}>{catObj.name}</span>
              {cs.max>0 && <span style={{fontSize:11,fontWeight:700,color:sc(cs.p),padding:"2px 9px",
                borderRadius:10,background:"white",border:`1px solid ${sc(cs.p)}40`}}>{cs.p}%</span>}
              <span style={{color:"#C9B8DC",fontSize:12,transform:open?"rotate(180deg)":"none",transition:"transform .2s"}}>▼</span>
            </div>
            {open && (
              <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:0}}>
                {qs.map((q,qi)=>(
                  <div key={q.id} style={{padding:"12px 0",borderBottom:qi<qs.length-1?"1px solid #FDFAF6":"none"}}>
                    <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:8}}>
                      <div style={{flex:1}}>
                        <span style={{fontSize:11,color:"#94a3b8",marginRight:6,fontWeight:700}}>Q{q.id}</span>
                        <span style={{fontSize:13,fontWeight:500,color:"#1D1D1B"}}>{q.text}</span>
                      </div>
                      <ScoreBadge score={answers[q.id]?.score||0} max={q.maxScore} scored={isQScored(q)}/>
                    </div>
                    {!locked
                      ? <QInput q={q} ans={answers[q.id]} onChange={v=>setAns(q.id,v)} answers={answers} inspNames={[inspector].filter(Boolean)}/>
                      : <div style={{fontSize:13,color:"#7A5499",padding:"6px 10px",background:"#FDFAF6",borderRadius:8,border:"1px solid #F0EBF7"}}>
                          {answers[q.id]?.value!=null?String(answers[q.id].value):<span style={{color:"#C9B8DC",fontStyle:"italic"}}>Non répondu</span>}
                        </div>
                    }
                    {!locked && <QuestionExtra extra={userAns[q.id]} onChange={patch=>setExtra(q.id,patch)}/>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {!locked && (
        <button onClick={submit}
          style={{padding:"14px",borderRadius:12,background:"#5F3876",color:"white",
            border:"none",fontSize:15,fontWeight:700,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          ✔ Enregistrer l'inspection — {totalScore}/{totalMax} pts ({pct}%)
        </button>
      )}
    </div>
  );
}
