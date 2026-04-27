import { useState } from "react";
import { genQR } from "../../utils.js";

export default function QRInput({ value, onScan }) {
  const [qr] = useState(genQR);
  return (
    <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
      <svg width={110} height={110} style={{border:"1px solid #e2e8f0",borderRadius:4,flexShrink:0,background:"white"}}>
        {qr.map((v,i)=>v?<rect key={i} x={(i%10)*11+2} y={Math.floor(i/10)*11+2} width={9} height={9} fill="#1D1D1B" rx={1}/>:null)}
      </svg>
      <div style={{paddingTop:4}}>
        <p style={{fontSize:12,color:"#64748b",margin:"0 0 10px"}}>Scanner le QR Code de certification</p>
        {value
          ? <div style={{fontSize:13,color:"#10b981",fontWeight:600}}>✓ {value} validé</div>
          : <button onClick={()=>onScan("QR-CERT-2025-ISO")}
              style={{padding:"7px 14px",borderRadius:8,border:"1px solid #5F3876",color:"#5F3876",background:"white",cursor:"pointer",fontSize:13,fontWeight:500}}>
              ▷ Simuler le scan
            </button>
        }
      </div>
    </div>
  );
}
