import { useState, useRef } from "react";

export default function QuestionExtra({ extra = {}, onChange }) {
  const [open,      setOpen]      = useState(false);
  const [recording, setRecording] = useState(false);
  const [mrec,      setMrec]      = useState(null);
  const chunksRef                 = useRef([]);

  const comment     = extra.comment     || "";
  const audioURL    = extra.audioURL    || null;
  const attachments = extra.attachments || [];

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onChange({ audioURL: URL.createObjectURL(blob) });
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(); setMrec(mr); setRecording(true);
    } catch { alert("Accès au microphone refusé ou non disponible."); }
  };
  const stopRec  = () => { mrec?.stop(); setMrec(null); setRecording(false); };
  const delAudio = () => { if (audioURL) URL.revokeObjectURL(audioURL); onChange({ audioURL: null }); };

  const addFiles = e => {
    Promise.all(Array.from(e.target.files).map(f => new Promise(res => {
      const r = new FileReader();
      r.onload = () => res({ name: f.name, url: r.result, type: f.type, size: f.size });
      r.readAsDataURL(f);
    }))).then(newFiles => onChange({ attachments: [...attachments, ...newFiles] }));
    e.target.value = "";
  };
  const delFile = i => onChange({ attachments: attachments.filter((_,j) => j !== i) });

  const badge = (comment.trim() ? 1 : 0) + (audioURL ? 1 : 0) + attachments.length;

  const iconBtn = (icon, label, active, onClick, danger) => (
    <button onClick={onClick} title={label}
      style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:6,fontSize:12,cursor:"pointer",
        border:`1px solid ${danger?"#fee2e2":active?"#5F3876":"#e2e8f0"}`,
        background:danger?"#fff5f5":active?"#F5F0FA":"white",
        color:danger?"#ef4444":active?"#5F3876":"#64748b",fontWeight:active?700:400}}>
      {icon}<span>{label}</span>
    </button>
  );

  return (
    <div style={{marginTop:10,borderTop:"1px dashed #e2e8f0",paddingTop:8}}>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
        <button onClick={()=>setOpen(o=>!o)}
          style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:6,fontSize:12,cursor:"pointer",
            border:`1px solid ${open?"#5F3876":"#e2e8f0"}`,background:open?"#F5F0FA":"white",
            color:open?"#5F3876":"#64748b",fontWeight:open?700:400}}>
          {open?"▲":"▼"}<span>Commentaire & pièces jointes</span>
          {badge>0 && <span style={{background:"#5F3876",color:"white",borderRadius:10,padding:"1px 6px",fontSize:10,fontWeight:700,marginLeft:2}}>{badge}</span>}
        </button>
      </div>
      {open && (
        <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:10}}>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:4}}>💬 Commentaire</label>
            <textarea value={comment} onChange={e=>onChange({comment:e.target.value})}
              placeholder="Ajouter une observation, remarque ou note..."
              style={{width:"100%",boxSizing:"border-box",padding:"8px 12px",borderRadius:8,border:`1px solid ${comment.trim()?"#5F3876":"#e2e8f0"}`,fontSize:14,fontFamily:"inherit",resize:"vertical",minHeight:64,outline:"none",lineHeight:1.5}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:6}}>🎙️ Commentaire audio</label>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              {!recording
                ? iconBtn("⏺", audioURL?"Ré-enregistrer":"Enregistrer", false, startRec, false)
                : <button onClick={stopRec} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:6,fontSize:12,border:"1px solid #ef4444",background:"#fff5f5",color:"#ef4444",cursor:"pointer",fontWeight:700}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:"#ef4444",display:"inline-block"}}/>Arrêter
                  </button>
              }
              {audioURL && !recording && (<><audio src={audioURL} controls style={{height:30,maxWidth:220,borderRadius:6,outline:"none"}}/>{iconBtn("🗑","Supprimer",false,delAudio,true)}</>)}
              {recording && <span style={{fontSize:12,color:"#ef4444",fontWeight:600}}><span style={{width:7,height:7,borderRadius:"50%",background:"#ef4444",display:"inline-block",marginRight:4}}/>Enregistrement en cours…</span>}
            </div>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:6}}>📎 Pièces jointes</label>
            <label style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:7,border:"1px dashed #cbd5e1",background:"#FDFAF6",cursor:"pointer",fontSize:13,color:"#64748b"}}>
              <span style={{fontSize:16}}>+</span> Ajouter un fichier
              <input type="file" multiple onChange={addFiles} style={{display:"none"}} accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"/>
            </label>
            {attachments.length>0 && (
              <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:5}}>
                {attachments.map((f,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:8,background:"#FDFAF6",border:"1px solid #e2e8f0"}}>
                    {f.type.startsWith("image/")
                      ? <img src={f.url} alt={f.name} style={{width:36,height:36,objectFit:"cover",borderRadius:5,border:"1px solid #e2e8f0",flexShrink:0}}/>
                      : <span style={{fontSize:22,flexShrink:0}}>{f.type==="application/pdf"?"📄":"📁"}</span>
                    }
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:"#1D1D1B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div>
                      <div style={{fontSize:10,color:"#94a3b8"}}>{(f.size/1024).toFixed(1)} Ko</div>
                    </div>
                    <a href={f.url} download={f.name} style={{padding:"3px 7px",borderRadius:5,border:"1px solid #e2e8f0",background:"white",color:"#64748b",fontSize:11,textDecoration:"none",flexShrink:0}}>⬇</a>
                    <button onClick={()=>delFile(i)} style={{padding:"3px 7px",borderRadius:5,border:"1px solid #fee2e2",background:"#fff5f5",color:"#ef4444",fontSize:11,cursor:"pointer",flexShrink:0}}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
