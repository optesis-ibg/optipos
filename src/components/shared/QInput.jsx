import SigCanvas from "./SigCanvas.jsx";
import QRInput from "./QRInput.jsx";

export default function QInput({ q, ans, onChange, answers, inspNames=[] }) {
  const v = ans?.value;
  const set = (value, score) => onChange({ value, score: score ?? 0 });

  if (q.type === "selection") return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {q.opts.map(opt => (
        <label key={opt.label} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,cursor:"pointer",
          border:`1px solid ${v===opt.label?"#5F3876":"#e2e8f0"}`,background:v===opt.label?"#F5F0FA":"white",transition:"all 0.15s"}}>
          <input type="radio" checked={v===opt.label} onChange={()=>set(opt.label,opt.score)} style={{accentColor:"#5F3876",flexShrink:0}}/>
          <span style={{flex:1,fontSize:14}}>{opt.label}</span>
          <span style={{fontSize:12,color:"#5F3876",fontWeight:700}}>{opt.score} pt</span>
        </label>
      ))}
    </div>
  );

  if (q.type === "text") return (
    <textarea value={v||""} onChange={e=>set(e.target.value, e.target.value.trim()?q.maxScore:0)}
      placeholder="Saisir votre observation..."
      style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:14,fontFamily:"inherit",resize:"vertical",minHeight:70,boxSizing:"border-box"}}/>
  );

  if (q.type === "date") return (
    <input type="date" value={v||""} onChange={e=>set(e.target.value, e.target.value?q.maxScore:0)}
      style={{padding:"8px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:14}}/>
  );

  if (q.type === "number") return (
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <input type="number" value={v??""} min={q.min??0} max={q.max??100}
        onChange={e=>{ const n=parseInt(e.target.value)||0; const s=q.maxScore>0?Math.round(Math.min(n,q.max||10)/(q.max||10)*q.maxScore):0; set(e.target.value,s); }}
        style={{width:100,padding:"8px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:14}}/>
      {q.min!==undefined && <span style={{fontSize:12,color:"#94a3b8"}}>Plage: {q.min} – {q.max}</span>}
    </div>
  );

  if (q.type === "formula") return (
    <div style={{display:"inline-flex",alignItems:"center",gap:12,padding:"10px 16px",borderRadius:8,background:"#FDFAF6",border:"1px solid #e2e8f0"}}>
      <span style={{fontSize:12,color:"#64748b"}}>= <code style={{color:"#5F3876",background:"#F5F0FA",padding:"2px 6px",borderRadius:4,fontFamily:"monospace"}}>{q.formula}</code></span>
      <span style={{fontSize:24,fontWeight:700,color:"#1D1D1B"}}>{v ?? 0}</span>
      <span style={{fontSize:12,color:"#94a3b8"}}>pts calculés automatiquement</span>
    </div>
  );

  if (q.type === "signature") return <SigCanvas value={v} onChange={sig=>set(sig, sig?q.maxScore:0)}/>;

  if (q.type === "barcode") return (
    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
      <div style={{fontFamily:"monospace",fontSize:22,letterSpacing:3,padding:"4px 10px",background:"#FDFAF6",border:"1px solid #e2e8f0",borderRadius:6,userSelect:"none"}}>▐▌▐▐▌▌▐▌▐▐</div>
      <input value={v||""} onChange={e=>set(e.target.value, e.target.value?q.maxScore:0)}
        placeholder="Scanner ou saisir le code-barres"
        style={{flex:1,minWidth:160,padding:"8px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:14}}/>
    </div>
  );

  if (q.type === "author") return (
    <select value={v||""} onChange={e=>set(e.target.value,0)}
      style={{padding:"8px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:14,background:"white",fontFamily:"inherit"}}>
      <option value="">-- Sélectionner un inspecteur --</option>
      {inspNames.map(a=><option key={a} value={a}>{a}</option>)}
    </select>
  );

  if (q.type === "location") return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {v && <div style={{padding:"8px 12px",borderRadius:8,background:"#f0fdf4",border:"1px solid #bbf7d0",fontSize:13,color:"#166534",fontFamily:"monospace"}}>📍 {v}</div>}
      <button onClick={()=>{ const lat=(43+Math.random()*6).toFixed(6); const lng=(-2+Math.random()*9).toFixed(6); set(`${lat}°N, ${lng}°E`, q.maxScore); }}
        style={{alignSelf:"flex-start",padding:"8px 16px",borderRadius:8,border:"1px solid #5F3876",color:"#5F3876",background:"white",cursor:"pointer",fontSize:13,fontWeight:600}}>
        📡 {v ? "Actualiser" : "Capturer"} la position GPS
      </button>
    </div>
  );

  if (q.type === "qrcode") return <QRInput value={v} onScan={code=>set(code,q.maxScore)}/>;

  return null;
}
