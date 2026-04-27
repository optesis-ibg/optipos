import { useRef } from "react";

export default function SigCanvas({ value, onChange }) {
  const cv = useRef(null);
  const drawing = useRef(false);
  const getXY = e => {
    const r = cv.current.getBoundingClientRect();
    return e.touches
      ? { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }
      : { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const start = e => { e.preventDefault(); drawing.current = true; const ctx = cv.current.getContext("2d"); const {x,y} = getXY(e); ctx.beginPath(); ctx.moveTo(x,y); };
  const draw  = e => { e.preventDefault(); if (!drawing.current) return; const ctx = cv.current.getContext("2d"); ctx.strokeStyle="#1D1D1B"; ctx.lineWidth=2; ctx.lineCap="round"; const {x,y}=getXY(e); ctx.lineTo(x,y); ctx.stroke(); };
  const end   = e => { e.preventDefault(); drawing.current = false; onChange(cv.current.toDataURL()); };
  const clear = ()  => { cv.current.getContext("2d").clearRect(0,0,280,90); onChange(null); };
  return (
    <div>
      <canvas ref={cv} width={280} height={90}
        style={{border:"1px solid #e2e8f0",borderRadius:8,background:"#FDFAF6",cursor:"crosshair",touchAction:"none",display:"block"}}
        onMouseDown={start} onMouseMove={draw} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={draw} onTouchEnd={end}/>
      <div style={{display:"flex",alignItems:"center",gap:10,marginTop:6}}>
        <button onClick={clear} style={{fontSize:12,padding:"3px 10px",borderRadius:6,border:"1px solid #e2e8f0",background:"white",cursor:"pointer"}}>Effacer</button>
        {value && <span style={{fontSize:12,color:"#10b981",fontWeight:600}}>✓ Signé</span>}
      </div>
    </div>
  );
}
