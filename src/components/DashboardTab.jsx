import { useState, useMemo, useCallback, useRef } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend
} from "recharts";
import { today } from "../utils.js";

const DASH_AXES = [
  {id:"inspector", label:"Par inspecteur",      icon:"👤"},
  {id:"site",      label:"Par site",            icon:"⛽"},
  {id:"category",  label:"Par catégorie",       icon:"📂"},
  {id:"month",     label:"Par mois",            icon:"📅"},
  {id:"level",     label:"Par niveau de score", icon:"🎯"},
  {id:"weekday",   label:"Par jour de semaine", icon:"🗓️"},
];
const DASH_METRICS = [
  {id:"avg",   label:"Score moyen (%)"},
  {id:"count", label:"Nombre d'inspections"},
  {id:"best",  label:"Meilleur score"},
  {id:"worst", label:"Score minimal"},
];
const DASH_CHARTS = [
  {id:"bar",   label:"Colonnes",  icon:"📊"},
  {id:"pie",   label:"Camembert", icon:"🥧"},
  {id:"radar", label:"Araignée",  icon:"🕸️"},
  {id:"table", label:"Tableau",   icon:"📋"},
];
const LEVEL_COLORS = {Excellent:"#10b981","Acceptable":"#5F3876",Insuffisant:"#ef4444",Critique:"#5F3876"};
const WEEKDAYS = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const MONTHS_FR = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const PALETTE = ["#5F3876","#10b981","#7A5499","#8b5cf6","#ef4444","#ec4899","#06b6d4","#FFDE90","#64748b","#1D1D1B"];

const INIT_DASH_CARDS = [
  { id:"kpis",    title:"Indicateurs clés",           type:"kpis",    order:0, cols:2, h:220, color:"#5F3876", visible:true },
  { id:"pie",     title:"Répartition des scores",     type:"pie",     order:1, cols:1, h:280, color:"#70BC80", visible:true },
  { id:"bar",     title:"Score moyen par site",       type:"bar",     order:2, cols:1, h:280, color:"#7A5499", visible:true },
  { id:"radar",   title:"Analyse par catégorie",      type:"radar",   order:3, cols:2, h:300, color:"#5F3876", visible:true },
  { id:"history", title:"Historique des inspections", type:"history", order:4, cols:2, h:300, color:"#5F3876", visible:true },
];

function computeCustomData(axis, metric, data) {
  let groups = {};
  if(axis==="inspector") data.forEach(i=>{ (groups[i.author]=groups[i.author]||[]).push(i); });
  else if(axis==="site")  data.forEach(i=>{ const k=i.site.split("–")[0].trim().replace("Station ",""); (groups[k]=groups[k]||[]).push(i); });
  else if(axis==="category") {
    const allCats = [...new Set(data.flatMap(i => Object.keys(i.cs||{})))];
    const cats = allCats.length ? allCats : ["Sécurité","Hygiène","Équipement","Conformité"];
    cats.forEach(cat=>{ groups[cat] = data.map(i=>({...i, pct: (i.cs||{})[cat]||0})); });
  }
  else if(axis==="month") data.forEach(i=>{ const d=new Date(i.date); const k=MONTHS_FR[d.getMonth()]+" "+d.getFullYear(); (groups[k]=groups[k]||[]).push(i); });
  else if(axis==="level") {
    groups = {Excellent:data.filter(i=>i.pct>=85),"Acceptable":data.filter(i=>i.pct>=65&&i.pct<85),Insuffisant:data.filter(i=>i.pct>=40&&i.pct<65),Critique:data.filter(i=>i.pct<40)};
  }
  else if(axis==="weekday") data.forEach(i=>{ const k=WEEKDAYS[new Date(i.date).getDay()]; (groups[k]=groups[k]||[]).push(i); });

  return Object.entries(groups).map(([name,items])=>{
    const vals = items.map(i=>i.pct);
    const value = metric==="avg"   ? (vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0)
                : metric==="count" ? vals.length
                : metric==="best"  ? (vals.length?Math.max(...vals):0)
                :                   (vals.length?Math.min(...vals):0);
    return {name, value, count:vals.length};
  }).filter(d=>d.count>0);
}

export default function DashboardTab({ sites, history=[], perms={} }) {
  const sc = p => p>=85?"#70BC80":p>=65?"#7A5499":"#E94C57";

  const inspData = useMemo(() => (history || []).map(rec => {
    if (!rec || typeof rec !== "object") return null;
    try {
      const cats      = Array.isArray(rec.cats)      ? rec.cats      : [];
      const questions = Array.isArray(rec.questions)  ? rec.questions : [];
      const answers   = rec.answers && typeof rec.answers === "object" ? rec.answers : {};
      const cs = {};
      cats.forEach(catObj => {
        if (!catObj || !catObj.name) return;
        const qs = questions.filter(q => q && q.cat === catObj.name);
        const catMax   = qs.reduce((s,q) => s + (q.scored===false ? 0 : (q.maxScore||0)), 0);
        const catScore = qs.reduce((s,q) => s + ((answers[q.id]?.score) || 0), 0);
        cs[catObj.name] = catMax > 0 ? Math.round((catScore / catMax) * 100) : 0;
      });
      if (cats.length === 0 && rec.pct) {
        ["Sécurité","Hygiène","Équipement","Conformité"].forEach(c => { cs[c] = rec.pct; });
      }
      return {
        id:     rec.id     || Date.now(),
        site:   rec.site   || "—",
        date:   rec.date   || today,
        author: rec.inspector || rec.author || "—",
        pct:    typeof rec.pct === "number" ? rec.pct : 0,
        cs,
      };
    } catch(e) { return null; }
  }).filter(Boolean), [history]);

  const [fltSite,    setFltSite]    = useState("all");
  const [fltAuthor,  setFltAuthor]  = useState("all");
  const [fltDateFrom,setFltDateFrom]= useState("");
  const [fltDateTo,  setFltDateTo]  = useState("");
  const [cards, setCards] = useState(() => {
    try {
      const saved = localStorage.getItem("sc_dash_cards");
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedMap = Object.fromEntries(parsed.map(c => [c.id, c]));
        return INIT_DASH_CARDS.map(c => savedMap[c.id] ? { ...c, ...savedMap[c.id] } : c)
          .concat(parsed.filter(c => !INIT_DASH_CARDS.find(d => d.id === c.id)));
      }
    } catch(e) {}
    return INIT_DASH_CARDS;
  });

  const saveCards = useCallback((newCards) => {
    setCards(newCards);
    try { localStorage.setItem("sc_dash_cards", JSON.stringify(newCards)); } catch(e) {}
  }, []);

  const [configId,   setConfigId]   = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({title:"",axis:"inspector",metric:"avg",chartType:"bar",color:"#5F3876"});
  const [dragId,     setDragId]     = useState(null);
  const [dragOver,   setDragOver]   = useState(null);
  const [resizing,   setResizing]   = useState(null);
  const containerRef                = useRef(null);

  const allAuthors = [...new Set(inspData.map(i=>i.author))].filter(Boolean).sort();
  const hasFilter  = fltSite!=="all" || fltAuthor!=="all" || fltDateFrom!=="" || fltDateTo!=="";
  const resetFilters = () => { setFltSite("all"); setFltAuthor("all"); setFltDateFrom(""); setFltDateTo(""); };
  const data = inspData.filter(i =>
    (fltSite==="all"   || i.site===fltSite) &&
    (fltAuthor==="all" || i.author===fltAuthor) &&
    (!fltDateFrom      || i.date>=fltDateFrom) &&
    (!fltDateTo        || i.date<=fltDateTo)
  );
  const avg = data.length ? Math.round(data.reduce((s,i)=>s+i.pct,0)/data.length) : 0;

  const pieData = useMemo(() => [
    {name:"Excellent ≥85%",    value:data.filter(i=>i.pct>=85).length,            c:"#70BC80"},
    {name:"Acceptable 65–84%", value:data.filter(i=>i.pct>=65&&i.pct<85).length,  c:"#7A5499"},
    {name:"Insuffisant 40–64%",value:data.filter(i=>i.pct>=40&&i.pct<65).length,  c:"#E94C57"},
    {name:"Critique <40%",     value:data.filter(i=>i.pct<40).length,             c:"#633F0F"},
  ].filter(d=>d.value>0), [data]);

  const barData = useMemo(() => {
    if (fltSite !== "all") {
      const grouped = {};
      data.forEach(i => { (grouped[i.author] = grouped[i.author]||[]).push(i); });
      return Object.entries(grouped).map(([name,items]) => ({
        name: name.split(" ")[0],
        score: Math.round(items.reduce((a,x)=>a+x.pct,0)/items.length),
        count: items.length,
      }));
    }
    return sites.map(s => {
      const ins = data.filter(i => i.site === s.name);
      return {
        name: s.name.split("–")[0].trim().replace("Station ",""),
        score: ins.length ? Math.round(ins.reduce((a,i)=>a+i.pct,0)/ins.length) : 0,
        count: ins.length,
      };
    }).filter(d => d.count > 0);
  }, [data, sites, fltSite]);

  const radarCats = useMemo(() => {
    const catSet = new Set();
    inspData.forEach(rec => { Object.keys(rec.cs || {}).forEach(c => catSet.add(c)); });
    const cats = [...catSet];
    return cats.length > 0 ? cats : ["Sécurité","Hygiène","Équipement","Conformité"];
  }, [inspData]);

  const radarData = useMemo(() =>
    radarCats.map(cat=>({cat, score:data.length?Math.round(data.reduce((s,i)=>s+(i.cs?.[cat]||0),0)/data.length):0})),
  [data, radarCats]);

  const updCard = (id,patch) => saveCards(cards.map(c=>c.id===id?{...c,...patch}:c));

  const createCard = () => {
    const ax = DASH_AXES.find(a=>a.id===createForm.axis);
    const title = createForm.title || (ax?.label+" — "+DASH_METRICS.find(m=>m.id===createForm.metric)?.label);
    const maxOrder = cards.reduce((m,c)=>Math.max(m,c.order||0),0);
    const newCard = {
      id: "custom_"+Date.now(),
      title, type:"custom",
      axis: createForm.axis, metric: createForm.metric,
      chartType: createForm.chartType, color: createForm.color,
      order: maxOrder+1, cols:2, h:280, visible:true,
    };
    saveCards([...cards, newCard]);
    setCreateForm({title:"",axis:"inspector",metric:"avg",chartType:"bar",color:"#5F3876"});
    setShowCreate(false);
  };

  const onDragStart = useCallback((e,id)=>{ setDragId(id); e.dataTransfer.effectAllowed="move"; e.dataTransfer.setData("text/plain",id); },[]);
  const onDragOver  = useCallback((e,id)=>{ e.preventDefault(); e.dataTransfer.dropEffect="move"; setDragOver(id); },[]);
  const onDrop = useCallback((e,targetId)=>{
    e.preventDefault();
    if(!dragId || dragId===targetId) { setDragId(null); setDragOver(null); return; }
    const arr = cards.slice().sort((a,b)=>(a.order||0)-(b.order||0));
    const fromIdx = arr.findIndex(c=>c.id===dragId);
    const toIdx   = arr.findIndex(c=>c.id===targetId);
    if(fromIdx>=0 && toIdx>=0) {
      const [moved] = arr.splice(fromIdx,1);
      arr.splice(toIdx,0,moved);
      saveCards(arr.map((c,i)=>({...c,order:i})));
    }
    setDragId(null); setDragOver(null);
  },[dragId, cards, saveCards]);
  const onDragEnd = useCallback(()=>{ setDragId(null); setDragOver(null); },[]);

  const startResize = useCallback((e,id)=>{
    e.preventDefault(); e.stopPropagation();
    const startY = e.clientY;
    const startH = cards.find(c=>c.id===id)?.h || 280;
    setResizing({id});
    const onMove = ev=>{
      const dy = ev.clientY - startY;
      saveCards(cards.map(c=>c.id===id ? {...c, h:Math.max(120, startH+dy)} : c));
    };
    const onUp = ()=>{
      setResizing(null);
      window.removeEventListener("mousemove",onMove);
      window.removeEventListener("mouseup",onUp);
    };
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
  },[cards, saveCards]);

  const configCard  = cards.find(c=>c.id===configId);
  const sortedCards = useMemo(()=>cards.filter(c=>c.visible).slice().sort((a,b)=>(a.order||0)-(b.order||0)),[cards]);

  const EmptyCard = ({inner}) => (
    <div style={{height:inner,display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",gap:8,color:"#C9B8DC",padding:16}}>
      <span style={{fontSize:32}}>🔍</span>
      <div style={{fontSize:13,fontWeight:600,color:"#9F8EAE",textAlign:"center"}}>Aucune donnée pour cette sélection</div>
      <div style={{fontSize:11,color:"#C9B8DC",textAlign:"center"}}>Modifiez les filtres site, inspecteur ou date</div>
    </div>
  );

  const renderContent = card => {
    const inner = card.h - 44;
    if(card.type==="kpis") {
      const total      = data.length;
      const excellent  = data.filter(i=>i.pct>=85).length;
      const acceptable = data.filter(i=>i.pct>=65&&i.pct<85).length;
      const insuffisant= data.filter(i=>i.pct>=40&&i.pct<65).length;
      const critique   = data.filter(i=>i.pct<40).length;
      const toImprove  = insuffisant + critique;
      const best       = total ? Math.max(...data.map(i=>i.pct)) : 0;
      const worst      = total ? Math.min(...data.map(i=>i.pct)) : 0;
      const avgAll = inspData.length ? Math.round(inspData.reduce((s,i)=>s+i.pct,0)/inspData.length) : 0;
      const trend  = total ? avg - avgAll : null;
      const catScores = ["Sécurité","Hygiène","Équipement","Conformité"].map(cat=>({
        cat, score: data.length ? Math.round(data.reduce((s,i)=>s+(i.cs?.[cat]||0),0)/data.length) : 0
      }));
      const weakCat = catScores.length ? catScores.reduce((a,b)=>a.score<b.score?a:b) : null;
      const filterLabel = [
        fltSite!=="all"   ? fltSite.replace("Station ","") : null,
        fltAuthor!=="all" ? fltAuthor.split(" ")[0]        : null,
        fltDateFrom       ? "depuis "+fltDateFrom          : null,
        fltDateTo         ? "jusqu'au "+fltDateTo          : null,
      ].filter(Boolean).join(" · ");

      const KpiCard = ({icon, label, value, sub, color, bg, bar, barColor}) => (
        <div style={{background:bg||"white",borderRadius:10,padding:"10px 12px",
          border:"1px solid #F0EBF7",display:"flex",flexDirection:"column",gap:4,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
            <span style={{fontSize:16}}>{icon}</span>
            <div style={{fontSize:9,color:"#9F8EAE",textTransform:"uppercase",letterSpacing:.5,fontWeight:700,lineHeight:1.2}}>{label}</div>
          </div>
          <div style={{fontSize:22,fontWeight:800,color:color||"#1D1D1B",lineHeight:1}}>{value}</div>
          {sub && <div style={{fontSize:10,color:"#9F8EAE",lineHeight:1.3,marginTop:1}}>{sub}</div>}
          {bar!=null && (
            <div style={{height:4,background:"#F0EBF7",borderRadius:2,marginTop:4}}>
              <div style={{width:Math.min(bar,100)+"%",height:"100%",background:barColor||color||"#5F3876",borderRadius:2,transition:"width .4s"}}/>
            </div>
          )}
        </div>
      );

      return (
        <div style={{padding:"10px 12px 12px",display:"flex",flexDirection:"column",gap:8}}>
          {(hasFilter||filterLabel) && (
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:8,
              background:"#F5F0FA",border:"1px solid #C9B8DC",fontSize:11,color:"#5F3876",fontWeight:600}}>
              <span>🔍</span>
              <span>{filterLabel || "Filtre actif"}</span>
              <span style={{marginLeft:"auto",color:"#9F8EAE",fontWeight:400}}>
                {total} inspection{total>1?"s":""} sélectionnée{total>1?"s":""}
              </span>
            </div>
          )}
          <div className="kpi-grid-4">
            <KpiCard icon="📋" label="Inspections" value={total}
              sub={total===0?"Aucune donnée":`sur ${inspData.length} au total`} color="#1D1D1B"/>
            <KpiCard icon="📊" label="Score moyen" value={avg+"%"}
              sub={trend!=null ? (trend>=0?"▲ +":`▼ `)+Math.abs(trend)+"% vs global" : "—"}
              color={sc(avg)} bar={avg} barColor={sc(avg)}/>
            <KpiCard icon="✅" label="Excellentes ≥85%" value={excellent}
              sub={total?Math.round(excellent/total*100)+"% des inspections":"—"}
              color="#70BC80" bg={excellent>0?"#f0fdf4":"white"}
              bar={total?Math.round(excellent/total*100):0} barColor="#70BC80"/>
            <KpiCard icon="⚠️" label="À améliorer <65%" value={toImprove}
              sub={total?Math.round(toImprove/total*100)+"% des inspections":"—"}
              color={toImprove>0?"#E94C57":"#9F8EAE"} bg={toImprove>0?"#fff5f5":"white"}
              bar={total?Math.round(toImprove/total*100):0} barColor="#E94C57"/>
          </div>
          <div className="kpi-grid-4">
            <KpiCard icon="🏆" label="Meilleur score" value={total?best+"%":"—"}
              color="#70BC80" bar={best} barColor="#70BC80"/>
            <KpiCard icon="📉" label="Score minimal" value={total?worst+"%":"—"}
              color={total?sc(worst):"#9F8EAE"} bar={worst} barColor={total?sc(worst):"#e2e8f0"}/>
            <KpiCard icon="📂" label="Catégorie faible"
              value={weakCat&&total?weakCat.score+"%":"—"}
              sub={weakCat&&total?weakCat.cat:""}
              color={weakCat&&total?sc(weakCat.score):"#9F8EAE"}
              bar={weakCat&&total?weakCat.score:0} barColor={weakCat&&total?sc(weakCat.score):"#e2e8f0"}/>
            <KpiCard icon="📅" label="Acceptables 65–84%" value={acceptable}
              sub={total?Math.round(acceptable/total*100)+"% des inspections":"—"}
              color="#7A5499" bar={total?Math.round(acceptable/total*100):0} barColor="#7A5499"/>
          </div>
        </div>
      );
    }
    if(card.type==="pie") {
      if(!data.length) return <EmptyCard inner={inner}/>;
      return (
        <div style={{height:inner,padding:"0 6px 6px"}}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius="36%" outerRadius="60%" dataKey="value"
                label={({name,value,percent})=>`${value} (${Math.round(percent*100)}%)`}
                labelLine={false} paddingAngle={3}>
                {pieData.map((e,i)=><Cell key={i} fill={e.c}/>)}
              </Pie>
              <Tooltip formatter={(v,n)=>[v+" inspection(s)",n]}/>
              <Legend iconSize={8} wrapperStyle={{fontSize:10}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }
    if(card.type==="bar") {
      if(!data.length) return <EmptyCard inner={inner}/>;
      const barLabel = fltSite!=="all" ? "Par inspecteur" : "Par site";
      return (
        <div style={{height:inner,padding:"0 6px 6px"}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{top:5,right:5,left:-28,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EBF7"/>
              <XAxis dataKey="name" tick={{fontSize:10}}/>
              <YAxis domain={[0,100]} tick={{fontSize:10}}/>
              <Tooltip formatter={(v,n,p)=>[v+"%",barLabel+" · "+p.payload.count+" inspection(s)"]}/>
              <Bar dataKey="score" radius={[5,5,0,0]}>
                {barData.map((e,i)=><Cell key={i} fill={sc(e.score)}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }
    if(card.type==="radar") {
      if(!data.length) return <EmptyCard inner={inner}/>;
      return (
        <div style={{height:inner,padding:"0 6px 6px"}}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{top:10,right:34,bottom:10,left:34}}>
              <PolarGrid stroke="#F0EBF7"/>
              <PolarAngleAxis dataKey="cat" tick={{fontSize:12,fill:"#7A5499",fontWeight:600}}/>
              <Radar dataKey="score" stroke={card.color} fill={card.color} fillOpacity={0.18} strokeWidth={2}/>
              <Tooltip formatter={v=>[v+"%","Score moyen"]}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      );
    }
    if(card.type==="history") {
      const sorted = data.slice().sort((a,b)=>b.date.localeCompare(a.date));
      return (
        <div style={{height:inner,overflowY:"auto",padding:"0 12px 8px"}}>
          {!data.length ? (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              height:"80%",gap:8,color:"#C9B8DC"}}>
              <span style={{fontSize:28}}>🔍</span>
              <div style={{fontSize:13,color:"#9F8EAE",textAlign:"center"}}>Aucune inspection pour cette sélection</div>
            </div>
          ) : (
            <>
              <div style={{display:"grid",gridTemplateColumns:"10px 1fr 90px 80px 60px",gap:"6px 10px",alignItems:"center",
                fontSize:10,color:"#9F8EAE",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,
                padding:"0 0 6px",borderBottom:"1px solid #F0EBF7",marginBottom:2,position:"sticky",top:0,background:"white"}}>
                <span/><span>Site</span><span>Inspecteur</span><span>Date</span><span style={{textAlign:"right"}}>Score</span>
              </div>
              {sorted.map(insp=>(
                <div key={insp.id} style={{display:"grid",gridTemplateColumns:"10px 1fr 90px 80px 60px",gap:"6px 10px",
                  alignItems:"center",padding:"7px 0",borderBottom:"1px solid #FDFAF6"}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:sc(insp.pct)}}/>
                  <div style={{fontSize:12,fontWeight:600,color:"#1D1D1B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{insp.site.split("–")[0].trim()}</div>
                  <div style={{fontSize:11,color:"#9F8EAE",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{insp.author.split(" ")[0]}</div>
                  <div style={{fontSize:11,color:"#9F8EAE",whiteSpace:"nowrap"}}>{insp.date}</div>
                  <div style={{textAlign:"right"}}>
                    <span style={{fontSize:13,fontWeight:700,color:sc(insp.pct)}}>{insp.pct}%</span>
                    <div style={{width:"100%",height:3,background:"#F0EBF7",borderRadius:2,marginTop:2}}>
                      <div style={{width:`${insp.pct}%`,height:"100%",background:sc(insp.pct),borderRadius:2,transition:"width .3s"}}/>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      );
    }
    if(card.type==="custom") {
      const cdata = computeCustomData(card.axis, card.metric, data);
      const isScore = card.metric!=="count";
      const metricLabel = DASH_METRICS.find(m=>m.id===card.metric)?.label||"";
      const fmt = v => isScore ? v+"%" : String(v);
      const clr = (name,v) => card.axis==="level" ? (LEVEL_COLORS[name]||card.color) : isScore ? sc(v) : card.color;
      if(card.chartType==="bar") return (
        <div style={{height:inner,padding:"0 6px 6px"}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cdata} margin={{top:5,right:5,left:-20,bottom:30}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EBF7"/>
              <XAxis dataKey="name" tick={{fontSize:10}} angle={-25} textAnchor="end" interval={0}/>
              <YAxis domain={isScore?[0,100]:["auto","auto"]} tick={{fontSize:10}}/>
              <Tooltip formatter={v=>[fmt(v),metricLabel]}/>
              <Bar dataKey="value" radius={[5,5,0,0]}>
                {cdata.map((e,i)=><Cell key={i} fill={clr(e.name,e.value)}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
      if(card.chartType==="pie") return (
        <div style={{height:inner,padding:"0 6px 6px"}}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={cdata} cx="50%" cy="50%" innerRadius="30%" outerRadius="58%" dataKey="value"
                paddingAngle={2} label={({name,value})=>name+": "+fmt(value)}>
                {cdata.map((e,i)=><Cell key={i} fill={clr(e.name,e.value)||PALETTE[i%PALETTE.length]}/>)}
              </Pie>
              <Tooltip formatter={v=>[fmt(v),metricLabel]}/>
              <Legend iconSize={8} wrapperStyle={{fontSize:10}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
      if(card.chartType==="radar") return (
        <div style={{height:inner,padding:"0 6px 6px"}}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={cdata.map(d=>({cat:d.name,score:d.value}))} margin={{top:10,right:34,bottom:10,left:34}}>
              <PolarGrid stroke="#e2e8f0"/>
              <PolarAngleAxis dataKey="cat" tick={{fontSize:11,fill:"#64748b",fontWeight:600}}/>
              <Radar dataKey="score" stroke={card.color} fill={card.color} fillOpacity={0.18} strokeWidth={2}/>
              <Tooltip formatter={v=>[fmt(v),metricLabel]}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      );
      if(card.chartType==="table") return (
        <div style={{height:inner,overflowY:"auto",padding:"0 12px 8px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:"6px 12px",
            fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",
            padding:"0 0 6px",borderBottom:"1px solid #F0EBF7",marginBottom:4}}>
            <span>{DASH_AXES.find(a=>a.id===card.axis)?.label}</span>
            <span style={{textAlign:"right"}}>{metricLabel}</span>
            <span style={{textAlign:"right"}}>Nb</span>
          </div>
          {cdata.sort((a,b)=>b.value-a.value).map((row,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:"6px 12px",
              alignItems:"center",padding:"7px 0",borderBottom:"1px solid #FDFAF6"}}>
              <div style={{fontSize:13,color:"#1D1D1B",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.name}</div>
              <div style={{textAlign:"right",minWidth:60}}>
                <span style={{fontSize:14,fontWeight:700,color:isScore?sc(row.value):card.color}}>{fmt(row.value)}</span>
                {isScore && <div style={{width:60,height:3,background:"#F0EBF7",borderRadius:2,marginTop:3,marginLeft:"auto"}}>
                  <div style={{width:row.value+"%",height:"100%",background:sc(row.value),borderRadius:2}}/>
                </div>}
              </div>
              <div style={{fontSize:12,color:"#94a3b8",textAlign:"right",minWidth:30}}>{row.count}</div>
            </div>
          ))}
          {cdata.length===0 && <div style={{textAlign:"center",color:"#94a3b8",padding:20,fontSize:13}}>Aucune donnée</div>}
        </div>
      );
    }
  };

  return (
    <div style={{padding:"10px 14px 24px"}}>

      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10,alignItems:"center"}}>
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          <label style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.4}}>Site</label>
          <select value={fltSite} onChange={e=>setFltSite(e.target.value)}
            style={{padding:"7px 10px",borderRadius:8,border:`1px solid ${fltSite!=="all"?"#5F3876":"#e2e8f0"}`,
              fontSize:13,background:"white",fontFamily:"inherit",outline:"none",minWidth:180,
              color:fltSite!=="all"?"#5F3876":"#1D1D1B",fontWeight:fltSite!=="all"?700:400}}>
            <option value="all">Tous les sites</option>
            {(sites.length > 0 ? sites.map(s=>s.name) : [...new Set(inspData.map(i=>i.site).filter(s=>s&&s!=="—"))]).map((name,i)=>(
              <option key={i} value={name}>{name.replace("Station ","")}</option>
            ))}
          </select>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          <label style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.4}}>Inspecteur</label>
          <select value={fltAuthor} onChange={e=>setFltAuthor(e.target.value)}
            style={{padding:"7px 10px",borderRadius:8,border:`1px solid ${fltAuthor!=="all"?"#5F3876":"#e2e8f0"}`,
              fontSize:13,background:"white",fontFamily:"inherit",outline:"none",minWidth:180,
              color:fltAuthor!=="all"?"#5F3876":"#1D1D1B",fontWeight:fltAuthor!=="all"?700:400}}>
            <option value="all">Tous les inspecteurs</option>
            {allAuthors.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          <label style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.4}}>Date — du</label>
          <input type="date" value={fltDateFrom} onChange={e=>setFltDateFrom(e.target.value)}
            style={{padding:"7px 10px",borderRadius:8,border:`1px solid ${fltDateFrom?"#5F3876":"#e2e8f0"}`,
              fontSize:13,fontFamily:"inherit",outline:"none",color:fltDateFrom?"#5F3876":"#1D1D1B",
              fontWeight:fltDateFrom?700:400,background:"white"}}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          <label style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.4}}>Au</label>
          <input type="date" value={fltDateTo} onChange={e=>setFltDateTo(e.target.value)}
            style={{padding:"7px 10px",borderRadius:8,border:`1px solid ${fltDateTo?"#5F3876":"#e2e8f0"}`,
              fontSize:13,fontFamily:"inherit",outline:"none",color:fltDateTo?"#5F3876":"#1D1D1B",
              fontWeight:fltDateTo?700:400,background:"white"}}/>
        </div>
        {hasFilter && (
          <button onClick={resetFilters}
            style={{alignSelf:"flex-end",padding:"7px 12px",borderRadius:8,fontSize:12,cursor:"pointer",
              background:"#F5F0FA",color:"#5F3876",border:"1px solid #C9B8DC",fontWeight:600,marginBottom:1}}>
            ✕ Réinitialiser filtres
          </button>
        )}
        <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"flex-end",paddingBottom:1}}>
          {cards.filter(c=>!c.visible).map(c=>(
            <button key={c.id} onClick={()=>updCard(c.id,{visible:true})}
              style={{padding:"4px 10px",borderRadius:20,fontSize:11,cursor:"pointer",
                background:"#FDFAF6",color:"#64748b",border:"1px dashed #cbd5e1"}}>
              + {c.title}
            </button>
          ))}
          <button onClick={()=>setShowCreate(true)}
            style={{padding:"7px 14px",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:700,
              background:"#5F3876",color:"white",border:"none"}}>
            + Nouvelle carte
          </button>
          <button onClick={()=>{ saveCards(INIT_DASH_CARDS); try{localStorage.removeItem('sc_dash_cards');}catch(e){} }}
            style={{padding:"7px 12px",borderRadius:8,fontSize:12,cursor:"pointer",
              background:"white",color:"#94a3b8",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",gap:5}}>
            ↺ Réinitialiser
          </button>
          <div style={{padding:"4px 10px",borderRadius:8,fontSize:11,background:"#F5F0FA",
            color:"#7A5499",border:"1px solid #C9B8DC",display:"flex",alignItems:"center",gap:4}}>
            💾 <span>Auto-sauvegardé</span>
          </div>
        </div>
      </div>

      {showCreate && (
        <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",
          background:"rgba(15,23,42,0.4)",backdropFilter:"blur(3px)"}}
          onClick={()=>setShowCreate(false)}>
          <div style={{background:"white",borderRadius:16,padding:24,width:420,maxHeight:"90vh",overflowY:"auto",
            boxShadow:"0 24px 64px rgba(0,0,0,0.25)",display:"flex",flexDirection:"column",gap:16}}
            onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{fontSize:20}}>📊</div>
              <div style={{fontWeight:700,fontSize:16,color:"#1D1D1B",flex:1}}>Nouvelle carte d'analyse</div>
              <button onClick={()=>setShowCreate(false)} style={{border:"none",background:"none",fontSize:20,color:"#94a3b8",cursor:"pointer"}}>×</button>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",display:"block",marginBottom:5}}>Titre (optionnel)</label>
              <input value={createForm.title} onChange={e=>setCreateForm(f=>({...f,title:e.target.value}))}
                placeholder="Généré automatiquement si vide"
                style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:14,boxSizing:"border-box",outline:"none"}}/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",display:"block",marginBottom:7}}>Axe d'analyse</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                {DASH_AXES.map(a=>(
                  <button key={a.id} onClick={()=>setCreateForm(f=>({...f,axis:a.id}))}
                    style={{padding:"8px 10px",borderRadius:8,border:`2px solid ${createForm.axis===a.id?"#5F3876":"#e2e8f0"}`,
                      background:createForm.axis===a.id?"#F5F0FA":"white",cursor:"pointer",
                      fontSize:13,fontWeight:createForm.axis===a.id?700:400,
                      color:createForm.axis===a.id?"#5F3876":"#475569",
                      display:"flex",alignItems:"center",gap:7,transition:"all .12s"}}>
                    <span>{a.icon}</span><span>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",display:"block",marginBottom:7}}>Métrique</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                {DASH_METRICS.map(m=>(
                  <button key={m.id} onClick={()=>setCreateForm(f=>({...f,metric:m.id}))}
                    style={{padding:"7px 10px",borderRadius:8,border:`2px solid ${createForm.metric===m.id?"#5F3876":"#e2e8f0"}`,
                      background:createForm.metric===m.id?"#F5F0FA":"white",cursor:"pointer",
                      fontSize:12,fontWeight:createForm.metric===m.id?700:400,
                      color:createForm.metric===m.id?"#5F3876":"#475569",transition:"all .12s"}}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",display:"block",marginBottom:7}}>Type de visualisation</label>
              <div style={{display:"flex",gap:7}}>
                {DASH_CHARTS.map(c=>(
                  <button key={c.id} onClick={()=>setCreateForm(f=>({...f,chartType:c.id}))}
                    style={{flex:1,padding:"8px 4px",borderRadius:8,border:`2px solid ${createForm.chartType===c.id?"#5F3876":"#e2e8f0"}`,
                      background:createForm.chartType===c.id?"#F5F0FA":"white",cursor:"pointer",
                      fontSize:13,fontWeight:createForm.chartType===c.id?700:400,
                      color:createForm.chartType===c.id?"#5F3876":"#475569",
                      display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all .12s"}}>
                    <span style={{fontSize:18}}>{c.icon}</span>
                    <span style={{fontSize:11}}>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",display:"block",marginBottom:7}}>Couleur</label>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {PALETTE.map(col=>(
                  <div key={col} onClick={()=>setCreateForm(f=>({...f,color:col}))}
                    style={{width:28,height:28,borderRadius:6,background:col,cursor:"pointer",
                      outline:createForm.color===col?`3px solid ${col}`:"3px solid transparent",
                      outlineOffset:2,transition:"all .1s"}}/>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:8,borderTop:"1px solid #F0EBF7",paddingTop:12}}>
              <button onClick={()=>setShowCreate(false)}
                style={{flex:1,padding:"9px",borderRadius:8,border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:13}}>Annuler</button>
              <button onClick={createCard}
                style={{flex:2,padding:"9px",borderRadius:8,background:"#5F3876",color:"white",border:"none",fontWeight:700,cursor:"pointer",fontSize:14}}>
                ✓ Créer la carte
              </button>
            </div>
          </div>
        </div>
      )}

      {configCard && (
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",
          background:"rgba(15,23,42,0.35)",backdropFilter:"blur(2px)"}}
          onClick={()=>setConfigId(null)}>
          <div style={{background:"white",borderRadius:16,padding:22,width:340,boxShadow:"0 24px 64px rgba(0,0,0,0.22)",
            display:"flex",flexDirection:"column",gap:16}}
            onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:4,height:20,borderRadius:2,background:configCard.color}}/>
              <div style={{fontWeight:700,fontSize:15,color:"#1D1D1B",flex:1}}>⚙️ Configuration</div>
              <button onClick={()=>setConfigId(null)}
                style={{border:"none",background:"none",fontSize:18,color:"#94a3b8",cursor:"pointer",lineHeight:1}}>×</button>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",display:"block",marginBottom:5}}>Titre de la carte</label>
              <input value={configCard.title} onChange={e=>updCard(configCard.id,{title:e.target.value})}
                style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:14,boxSizing:"border-box",outline:"none"}}/>
            </div>
            {["pie","radar","bar"].includes(configCard.type) && (
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",display:"block",marginBottom:6}}>Couleur principale</label>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  {PALETTE.map(col=>(
                    <div key={col} onClick={()=>updCard(configCard.id,{color:col})}
                      style={{width:30,height:30,borderRadius:7,background:col,cursor:"pointer",
                        outline:configCard.color===col?`3px solid ${col}`:"3px solid transparent",
                        outlineOffset:2,transition:"all .12s"}}/>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",display:"block",marginBottom:7}}>Largeur</label>
              <div style={{display:"flex",gap:8}}>
                {[{v:2,l:"Pleine largeur"},{v:1,l:"Demi largeur"}].map(({v,l})=>(
                  <button key={v} onClick={()=>updCard(configCard.id,{cols:v})}
                    style={{flex:1,padding:"8px",borderRadius:8,border:`2px solid ${configCard.cols===v?"#5F3876":"#F0EBF7"}`,
                      background:configCard.cols===v?"#F5F0FA":"white",cursor:"pointer",fontSize:12,
                      fontWeight:configCard.cols===v?700:400,color:configCard.cols===v?"#5F3876":"#9F8EAE",fontFamily:"inherit"}}>
                    {v===2?"⬛ "+l:"◻ "+l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",display:"block",marginBottom:5}}>
                Hauteur — <span style={{color:"#1D1D1B"}}>{configCard.h}px</span>
              </label>
              <input type="range" min={120} max={600} step={10} value={configCard.h}
                onChange={e=>updCard(configCard.id,{h:+e.target.value})}
                style={{width:"100%",accentColor:configCard.color}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#C9B8DC",marginTop:3}}>
                <span>120px</span><span>Compact</span><span>Standard</span><span>Spacieux</span><span>600px</span>
              </div>
            </div>
            <div style={{display:"flex",gap:8,borderTop:"1px solid #F0EBF7",paddingTop:12}}>
              <button onClick={()=>{updCard(configCard.id,{visible:false});setConfigId(null);}}
                style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid #fee2e2",background:"#fff5f5",
                  color:"#ef4444",cursor:"pointer",fontSize:13,fontWeight:600}}>
                🙈 Masquer
              </button>
              <button onClick={()=>setConfigId(null)}
                style={{flex:1,padding:"8px",borderRadius:8,background:"#5F3876",color:"white",
                  border:"none",fontWeight:700,cursor:"pointer",fontSize:13}}>
                ✓ Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={containerRef} className="dash-grid">
        {sortedCards.map(card=>{
          const isDragging = dragId===card.id;
          const isOver     = dragOver===card.id;
          const isCfg      = configId===card.id;
          return (
            <div key={card.id}
              className={card.cols===2 ? "card-full" : "card-half"}
              draggable
              onDragStart={e=>onDragStart(e,card.id)}
              onDragOver={e=>onDragOver(e,card.id)}
              onDrop={e=>onDrop(e,card.id)}
              onDragEnd={onDragEnd}
              style={{
                gridColumn: card.cols===2 ? "1 / -1" : "auto",
                height:card.h,
                background:"white",borderRadius:12,
                border:`1.5px solid ${isCfg?"#5F3876":isOver?"#C9B8DC":"#F0EBF7"}`,
                boxShadow:isDragging?"0 16px 40px rgba(95,56,118,0.22)":isCfg?"0 0 0 3px #EDE6F5":"0 2px 8px rgba(95,56,118,0.06)",
                display:"flex",flexDirection:"column",overflow:"hidden",
                opacity:isDragging?0.5:1,
                transition:"opacity .15s,box-shadow .2s,border-color .2s",
              }}>
              <div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 10px 8px 12px",
                borderBottom:"1px solid #F0EBF7",cursor:"grab",background:"white",flexShrink:0,
                userSelect:"none"}}>
                <div style={{width:4,height:16,borderRadius:2,background:card.color,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#1D1D1B",
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {card.type==="bar" && fltSite!=="all" ? "Score moyen par inspecteur" : card.title}
                  </div>
                  {hasFilter && card.type!=="kpis" && (
                    <div style={{fontSize:9,color:"#9F8EAE",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      🔍 {[fltSite!=="all"?fltSite.replace("Station ",""):null,fltAuthor!=="all"?fltAuthor.split(" ")[0]:null,fltDateFrom||fltDateTo?"Période filtrée":null].filter(Boolean).join(" · ")} · {data.length} résultat{data.length>1?"s":""}
                    </div>
                  )}
                </div>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{flexShrink:0,opacity:.35}}>
                  {[0,4,8].map(y=>[0,4,8].map(x=>(
                    <circle key={`${x}-${y}`} cx={x+2} cy={y+2} r="1.2" fill="#64748b"/>
                  )))}
                </svg>
                <button onMouseDown={e=>e.stopPropagation()} onClick={()=>setConfigId(id=>id===card.id?null:card.id)}
                  title="Configurer" style={{padding:"3px 7px",borderRadius:6,
                    border:`1px solid ${isCfg?"#5F3876":"#e2e8f0"}`,
                    background:isCfg?"#F5F0FA":"white",
                    cursor:"pointer",fontSize:11,color:isCfg?"#5F3876":"#64748b",
                    flexShrink:0,transition:"all .12s"}}>⚙️</button>
              </div>
              <div style={{flex:1,minHeight:0,overflow:"hidden"}}>
                {renderContent(card)}
              </div>
              <div onMouseDown={e=>startResize(e,card.id)} className="resize-handle">
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <path d="M1 5L5 9L9 5" stroke="#C9B8DC" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
