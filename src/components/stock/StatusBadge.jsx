export default function StatusBadge({ s }) {
  const cfg = {
    brouillon: { c:"#9F8EAE", bg:"#F5F0FA", l:"Brouillon" },
    en_cours:  { c:"#92400e", bg:"#fffbeb", l:"En cours" },
    cloture:   { c:"#166534", bg:"#f0fdf4", l:"Clôturé" },
  };
  const r = cfg[s] || cfg.brouillon;
  return (
    <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:r.bg,color:r.c,fontWeight:700,border:`1px solid ${r.c}40`}}>
      {r.l}
    </span>
  );
}
