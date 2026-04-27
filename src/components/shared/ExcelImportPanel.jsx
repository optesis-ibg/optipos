import { useState, useRef } from "react";

export default function ExcelImportPanel({ type, onImport, templateFile, fields }) {
  const [open,   setOpen]   = useState(false);
  const [status, setStatus] = useState(null);
  const fileRef = useRef(null);

  const parseXlsx = async (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => { try { resolve(e.target.result); } catch(err) { reject(err); } };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

  const extractXlsxRows = async (arrayBuffer) => {
    try {
      const { default: JSZip } = await import("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js").catch(() => null);
      if (!JSZip) throw new Error("Parser non disponible");
      const zip = await JSZip.loadAsync(arrayBuffer);
      const sharedStringsXml = await zip.file("xl/sharedStrings.xml")?.async("text");
      const sheetXml = await zip.file("xl/worksheets/sheet1.xml")?.async("text");
      if (!sheetXml) throw new Error("Feuille introuvable dans le fichier");
      const strings = [];
      if (sharedStringsXml) {
        for (const m of sharedStringsXml.matchAll(/<si>.*?<\/si>/gs))
          strings.push([...m[0].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map(t => t[1]).join(""));
      }
      const rows = [];
      for (const rowM of sheetXml.matchAll(/<row[^>]*>(.*?)<\/row>/gs)) {
        const cells = [];
        for (const cellM of rowM[1].matchAll(/<c[^>]*r="([A-Z]+)(\d+)"[^>]*(?:t="([^"]*)")?[^>]*>(?:.*?<v>([^<]*)<\/v>)?.*?<\/c>/gs)) {
          const colIdx = cellM[1].split("").reduce((n,c) => n*26+c.charCodeAt(0)-64, 0) - 1;
          while (cells.length < colIdx) cells.push("");
          let val = cellM[4] || "";
          if (cellM[3] === "s" && val !== "") val = strings[parseInt(val)] || val;
          val = val.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'");
          cells[colIdx] = val;
        }
        rows.push(cells);
      }
      return rows.slice(3).filter(r => r.some(c => c && c.toString().trim()));
    } catch(err) { throw new Error("Impossible de lire le fichier : " + err.message); }
  };

  const parseRows = async (file) => {
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "csv") {
      const text = await file.text();
      return text.split("\n").filter(l => l.trim()).slice(1).map(l => l.split(",").map(c => c.replace(/^"|"$/g, "").trim()));
    }
    return extractXlsxRows(await parseXlsx(file));
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("loading");
    try {
      const rows = await parseRows(file);
      setStatus(onImport(rows));
    } catch(err) {
      setStatus({ ok: false, count: 0, errors: [err.message] });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const LABELS = { categories:"Catégories", questions:"Questions", sites:"Sites", inspecteurs:"Inspecteurs" };

  return (
    <div style={{marginBottom:14}}>
      <button onClick={()=>{setOpen(o=>!o);setStatus(null);}}
        style={{display:"flex",alignItems:"center",gap:8,padding:"9px 16px",borderRadius:10,
          border:`2px solid ${open?"#5F3876":"#C9B8DC"}`,background:open?"#F5F0FA":"white",
          cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,color:"#5F3876",transition:"all .15s"}}>
        <span style={{fontSize:16}}>📥</span>
        <span>Importer depuis Excel</span>
        <span style={{marginLeft:"auto",fontSize:11,color:"#9F8EAE",fontWeight:400}}>{open?"▲":"▼"}</span>
      </button>

      {open && (
        <div style={{marginTop:8,padding:16,background:"white",borderRadius:12,border:"1px solid #C9B8DC",display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#5F3876",textTransform:"uppercase",letterSpacing:.6,marginBottom:8}}>① Télécharger le modèle Excel</div>
            <a href={templateFile} download
              style={{display:"inline-flex",alignItems:"center",gap:8,padding:"8px 16px",borderRadius:8,border:"1px solid #C9B8DC",background:"#F5F0FA",color:"#5F3876",fontWeight:600,fontSize:13,textDecoration:"none"}}>
              <span>⬇️</span><span>Télécharger le modèle {LABELS[type]}</span>
            </a>
            <div style={{marginTop:6,fontSize:11,color:"#9F8EAE"}}>Remplissez le fichier en respectant les colonnes — n'effacez pas la ligne d'en-tête.</div>
          </div>
          <div style={{height:1,background:"#F0EBF7"}}/>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#5F3876",textTransform:"uppercase",letterSpacing:.6,marginBottom:8}}>② Importer le fichier rempli</div>
            <label style={{display:"inline-flex",alignItems:"center",gap:8,padding:"8px 16px",borderRadius:8,border:"2px dashed #C9B8DC",background:"#FDFAF6",color:"#5F3876",fontWeight:600,fontSize:13,cursor:"pointer"}}>
              <span>📂</span><span>Sélectionner le fichier .xlsx ou .csv</span>
              <input ref={fileRef} type="file" accept=".xlsx,.csv,.xls" onChange={handleFile} style={{display:"none"}}/>
            </label>
            <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:5}}>
              {fields.map(f => (
                <span key={f.key} style={{fontSize:10,padding:"2px 8px",borderRadius:10,
                  background:f.required?"#F5F0FA":"#FDFAF6",border:`1px solid ${f.required?"#C9B8DC":"#e2e8f0"}`,
                  color:f.required?"#5F3876":"#9F8EAE",fontWeight:f.required?700:400}}>
                  {f.required?"*":""}{f.label}
                </span>
              ))}
              <span style={{fontSize:10,color:"#9F8EAE",padding:"2px 0"}}>* requis</span>
            </div>
          </div>
          {status==="loading" && (
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:8,background:"#F5F0FA",fontSize:13,color:"#7A5499"}}>
              <span>⏳</span> Lecture du fichier en cours…
            </div>
          )}
          {status && status!=="loading" && (
            <div style={{padding:"10px 14px",borderRadius:8,background:status.ok?"#f0fdf4":"#fff5f5",border:`1px solid ${status.ok?"#bbf7d0":"#fecaca"}`,fontSize:13,color:status.ok?"#166534":"#dc2626"}}>
              {status.ok
                ? <><strong>✅ {status.count} ligne{status.count>1?"s":""} importée{status.count>1?"s":""}</strong>
                    {status.skipped>0 && <span style={{marginLeft:8,color:"#92400e"}}>({status.skipped} ignorée{status.skipped>1?"s":""})</span>}</>
                : <><strong>⚠️ Erreur :</strong> {status.errors?.join(" | ")}</>
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}
