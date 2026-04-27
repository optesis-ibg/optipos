import { sc } from "../../utils.js";

export default function ScoreBadge({ score, max, scored }) {
  if (scored === false) return <span style={{fontSize:11,color:"#94a3b8",border:"1px solid #e2e8f0",borderRadius:12,padding:"2px 8px",flexShrink:0}}>—</span>;
  if (!max) return <span style={{fontSize:11,color:"#94a3b8",border:"1px solid #e2e8f0",borderRadius:12,padding:"2px 8px"}}>Info</span>;
  const p = Math.round((score/max)*100);
  return (
    <div style={{textAlign:"right",flexShrink:0}}>
      <div style={{fontSize:13,fontWeight:700,color:sc(p)}}>{score}/{max}</div>
      <div style={{width:52,height:4,background:"#F0EBF7",borderRadius:2,marginTop:3}}>
        <div style={{width:`${Math.min(p,100)}%`,height:"100%",background:sc(p),borderRadius:2,transition:"width 0.3s"}}/>
      </div>
    </div>
  );
}
