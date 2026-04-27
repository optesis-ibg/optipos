export const DEMO_SITES = [
  { id:101, name:"Station Total – Lyon Centre",   addr:"12 Rue de la République, 69001 Lyon",   code:"LYO-001", tel:"04 72 10 10 10" },
  { id:102, name:"Station BP – Paris Nord",        addr:"45 Av. du Gén. de Gaulle, 75018 Paris", code:"PAR-018", tel:"01 42 20 20 20" },
  { id:103, name:"Station Shell – Marseille Sud",  addr:"8 Bd Michelet, 13008 Marseille",        code:"MAR-008", tel:"04 91 30 30 30" },
  { id:104, name:"Station Esso – Bordeaux Est",    addr:"23 Cours de la Somme, 33800 Bordeaux",  code:"BDX-033", tel:"05 56 40 40 40" },
];

export const DEMO_INSPECTEURS = [
  { id:101, prenom:"Jean",   nom:"Dupont",  dateEntree:"2020-01-15", stations:["Station Total – Lyon Centre","Station BP – Paris Nord"] },
  { id:102, prenom:"Marie",  nom:"Martin",  dateEntree:"2019-06-01", stations:["Station BP – Paris Nord"] },
  { id:103, prenom:"Sophie", nom:"Leclerc", dateEntree:"2022-09-01", stations:["Station Esso – Bordeaux Est"] },
  { id:104, prenom:"Thomas", nom:"Petit",   dateEntree:"2023-01-20", stations:["Station Total – Lyon Centre","Station Esso – Bordeaux Est"] },
];

export const DEMO_CATS = [
  { name:"Sécurité",   scored:true },
  { name:"Hygiène",    scored:true },
  { name:"Équipement", scored:true },
  { name:"Conformité", scored:true },
];

export const DEMO_QUESTIONS = [
  { id:101, cat:"Sécurité",   text:"Les extincteurs sont-ils accessibles et vérifiés ?", type:"selection", maxScore:10,
    opts:[{label:"Oui, tous vérifiés",score:10},{label:"Partiellement vérifiés",score:5},{label:"Non / Absent",score:0}] },
  { id:102, cat:"Sécurité",   text:"Signalisations de sécurité conformes et visibles ?", type:"selection", maxScore:10,
    opts:[{label:"Toutes conformes",score:10},{label:"Partiellement conformes",score:5},{label:"Absentes / Dégradées",score:0}] },
  { id:103, cat:"Sécurité",   text:"Date du dernier contrôle incendie", type:"date", maxScore:5 },
  { id:104, cat:"Hygiène",    text:"État général des sanitaires clients", type:"selection", maxScore:15,
    opts:[{label:"Excellent",score:15},{label:"Bon",score:10},{label:"Moyen",score:5},{label:"Mauvais",score:0}] },
  { id:105, cat:"Hygiène",    text:"Propreté de la boutique et des abords", type:"selection", maxScore:10,
    opts:[{label:"Très propre",score:10},{label:"Acceptable",score:6},{label:"Insuffisant",score:2},{label:"Très sale",score:0}] },
  { id:106, cat:"Hygiène",    text:"Observations complémentaires", type:"text", maxScore:5 },
  { id:107, cat:"Équipement", text:"État fonctionnel des pompes à carburant", type:"selection", maxScore:20,
    opts:[{label:"Toutes fonctionnelles",score:20},{label:"1 pompe en panne",score:12},{label:"Plusieurs pannes",score:5},{label:"Hors service",score:0}] },
  { id:108, cat:"Équipement", text:"Nombre de pompes en service", type:"number", maxScore:0, min:0, max:20 },
  { id:109, cat:"Conformité", text:"Localisation GPS de la station", type:"location", maxScore:5 },
  { id:110, cat:"Conformité", text:"Inspecteur responsable", type:"author", maxScore:0 },
  { id:111, cat:"Conformité", text:"Signature de validation", type:"signature", maxScore:5 },
];

export const DEMO_USERS = [
  { id:102, prenom:"Jean",   nom:"Dupont",  username:"jean.dupont",  password:"insp001",  role:"inspecteur" },
  { id:103, prenom:"Marie",  nom:"Martin",  username:"marie.martin", password:"insp002",  role:"inspecteur" },
  { id:104, prenom:"Sophie", nom:"Leclerc", username:"s.leclerc",    password:"super001", role:"superviseur" },
  { id:105, prenom:"Thomas", nom:"Petit",   username:"t.petit",      password:"insp003",  role:"inspecteur" },
];

const _mkAns = (q101, q102, q104, q105, q107, gps, insp) => ({
  101: { value: q101.label, score: q101.score },
  102: { value: q102.label, score: q102.score },
  103: { value: "2024-06-15", score: 5 },
  104: { value: q104.label, score: q104.score },
  105: { value: q105.label, score: q105.score },
  106: { value: "RAS", score: 5 },
  107: { value: q107.label, score: q107.score },
  108: { value: "6", score: 0 },
  109: { value: gps, score: 5 },
  110: { value: insp, score: 0 },
  111: { value: null, score: 0 },
});

export const DEMO_HISTORY = [
  { id:9001, site:"Station Total – Lyon Centre",  date:"2025-01-15", inspector:"Jean Dupont",
    answers:_mkAns({label:"Oui, tous vérifiés",score:10},{label:"Toutes conformes",score:10},
      {label:"Bon",score:10},{label:"Acceptable",score:6},{label:"Toutes fonctionnelles",score:20},
      "45.7640°N, 4.8357°E","Jean Dupont"),
    totalScore:71, totalMax:90, pct:79,
    cats:DEMO_CATS, questions:DEMO_QUESTIONS },
  { id:9002, site:"Station BP – Paris Nord",       date:"2025-01-18", inspector:"Marie Martin",
    answers:_mkAns({label:"Partiellement vérifiés",score:5},{label:"Toutes conformes",score:10},
      {label:"Excellent",score:15},{label:"Très propre",score:10},{label:"Toutes fonctionnelles",score:20},
      "48.8926°N, 2.3442°E","Marie Martin"),
    totalScore:80, totalMax:90, pct:89,
    cats:DEMO_CATS, questions:DEMO_QUESTIONS },
  { id:9003, site:"Station Shell – Marseille Sud", date:"2025-01-22", inspector:"Jean Dupont",
    answers:_mkAns({label:"Non / Absent",score:0},{label:"Partiellement conformes",score:5},
      {label:"Moyen",score:5},{label:"Insuffisant",score:2},{label:"Plusieurs pannes",score:5},
      "43.2561°N, 5.4011°E","Jean Dupont"),
    totalScore:37, totalMax:90, pct:41,
    cats:DEMO_CATS, questions:DEMO_QUESTIONS },
  { id:9004, site:"Station Esso – Bordeaux Est",   date:"2025-02-01", inspector:"Sophie Leclerc",
    answers:_mkAns({label:"Oui, tous vérifiés",score:10},{label:"Toutes conformes",score:10},
      {label:"Excellent",score:15},{label:"Très propre",score:10},{label:"Toutes fonctionnelles",score:20},
      "44.8378°N, -0.5792°E","Sophie Leclerc"),
    totalScore:85, totalMax:90, pct:94,
    cats:DEMO_CATS, questions:DEMO_QUESTIONS },
  { id:9005, site:"Station Total – Lyon Centre",  date:"2025-02-10", inspector:"Thomas Petit",
    answers:_mkAns({label:"Partiellement vérifiés",score:5},{label:"Partiellement conformes",score:5},
      {label:"Bon",score:10},{label:"Acceptable",score:6},{label:"1 pompe en panne",score:12},
      "45.7640°N, 4.8357°E","Thomas Petit"),
    totalScore:58, totalMax:90, pct:64,
    cats:DEMO_CATS, questions:DEMO_QUESTIONS },
  { id:9006, site:"Station BP – Paris Nord",       date:"2025-02-15", inspector:"Marie Martin",
    answers:_mkAns({label:"Oui, tous vérifiés",score:10},{label:"Toutes conformes",score:10},
      {label:"Excellent",score:15},{label:"Très propre",score:10},{label:"Toutes fonctionnelles",score:20},
      "48.8926°N, 2.3442°E","Marie Martin"),
    totalScore:85, totalMax:90, pct:94,
    cats:DEMO_CATS, questions:DEMO_QUESTIONS },
];

export const DEMO_ACTIFS = [
  { id:110, site:"Station Total – Lyon Centre", categorie:"pompes", type:"Pompe distributrice",
    nom:"Pompe P1 – Îlot A", marque:"Gilbarco", serie:"GV-2021-001", produit:"SP95",
    cuveRattachee:"Cuve C1 – SP95", indexInitial:"0", indexActuel:"12450", statut:"actif", notes:"" },
  { id:111, site:"Station Total – Lyon Centre", categorie:"pompes", type:"Pompe distributrice",
    nom:"Pompe P2 – Îlot B", marque:"Gilbarco", serie:"GV-2021-002", produit:"Diesel B7",
    cuveRattachee:"Cuve C2 – Diesel", indexInitial:"0", indexActuel:"18320", statut:"actif", notes:"" },
  { id:112, site:"Station Total – Lyon Centre", categorie:"cuves", type:"Cuve enterrée",
    nom:"Cuve C1 – SP95", marque:"Stolt", serie:"ST-2019-C1", produit:"SP95",
    cuveRattachee:"", indexInitial:"30000", indexActuel:"17550", statut:"actif", notes:"" },
  { id:113, site:"Station Total – Lyon Centre", categorie:"cuves", type:"Cuve double paroi",
    nom:"Cuve C2 – Diesel", marque:"Stolt", serie:"ST-2019-C2", produit:"Diesel B7",
    cuveRattachee:"", indexInitial:"50000", indexActuel:"31680", statut:"actif", notes:"" },
  { id:120, site:"Station BP – Paris Nord", categorie:"pompes", type:"Multi-produits",
    nom:"Pompe P1 – Multi", marque:"Wayne", serie:"WY-2022-001", produit:"SP98",
    cuveRattachee:"Cuve C1 – SP98", indexInitial:"0", indexActuel:"9870", statut:"actif", notes:"" },
  { id:121, site:"Station BP – Paris Nord", categorie:"pompes", type:"Pompe distributrice",
    nom:"Pompe P2 – Diesel", marque:"Wayne", serie:"WY-2022-002", produit:"Diesel B7",
    cuveRattachee:"Cuve C2 – Diesel", indexInitial:"0", indexActuel:"22100", statut:"actif", notes:"" },
  { id:122, site:"Station BP – Paris Nord", categorie:"cuves", type:"Cuve enterrée",
    nom:"Cuve C1 – SP98", marque:"Stolt", serie:"ST-2020-C1", produit:"SP98",
    cuveRattachee:"", indexInitial:"25000", indexActuel:"15130", statut:"actif", notes:"" },
  { id:123, site:"Station BP – Paris Nord", categorie:"cuves", type:"Cuve enterrée",
    nom:"Cuve C2 – Diesel", marque:"Stolt", serie:"ST-2020-C2", produit:"Diesel B7",
    cuveRattachee:"", indexInitial:"40000", indexActuel:"17900", statut:"actif", notes:"" },
  { id:130, site:"Station Total – Lyon Centre", categorie:"securite", type:"Extincteur CO2",
    nom:"Extincteur CO2 – Îlot A", marque:"Sicli", serie:"SC-2023-01",
    produit:"", cuveRattachee:"", indexInitial:"", indexActuel:"",
    dateMaintenance:"2024-03-15", statut:"actif", notes:"Vérification annuelle OK" },
  { id:131, site:"Station BP – Paris Nord", categorie:"securite", type:"Détecteur incendie",
    nom:"Détecteur incendie – Boutique", marque:"Honeywell", serie:"HW-2022-44",
    produit:"", cuveRattachee:"", indexInitial:"", indexActuel:"",
    dateMaintenance:"2023-11-20", statut:"actif", notes:"" },
];

export const DEMO_PRODUITS = [
  { id:101, nom:"SP95", categorie:"carburant", unite:"litre", description:"Sans plomb 95, indice d'octane 95",
    sites:["Station Total – Lyon Centre"], actif:true,
    prix:[
      {id:9001, dateDebut:"2024-01-01", dateFin:"2024-06-30", prix:780, devise:"FCFA", notes:"Tarif S1 2024"},
      {id:9002, dateDebut:"2024-07-01", dateFin:"",            prix:810, devise:"FCFA", notes:"Hausse juillet 2024"},
    ]},
  { id:102, nom:"SP98", categorie:"carburant", unite:"litre", description:"Sans plomb 98, haute performance",
    sites:["Station BP – Paris Nord"], actif:true,
    prix:[
      {id:9003, dateDebut:"2024-01-01", dateFin:"", prix:850, devise:"FCFA", notes:""},
    ]},
  { id:103, nom:"Diesel B7", categorie:"carburant", unite:"litre", description:"Gazole B7 – mélange 7% biodiesel",
    sites:["Station Total – Lyon Centre","Station BP – Paris Nord","Station Shell – Marseille Sud","Station Esso – Bordeaux Est"], actif:true,
    prix:[
      {id:9004, dateDebut:"2024-01-01", dateFin:"2024-09-30", prix:720, devise:"FCFA", notes:""},
      {id:9005, dateDebut:"2024-10-01", dateFin:"",            prix:745, devise:"FCFA", notes:"Révision tarifaire Q4"},
    ]},
  { id:104, nom:"Huile 5W30", categorie:"lubrifiant", unite:"litre", description:"Huile moteur synthétique polyvalente",
    sites:["Station Total – Lyon Centre","Station BP – Paris Nord"], actif:true,
    prix:[
      {id:9006, dateDebut:"2024-01-01", dateFin:"", prix:4500, devise:"FCFA", notes:""},
    ]},
  { id:105, nom:"GPL Carburant", categorie:"gaz", unite:"kg", description:"Gaz de pétrole liquéfié pour véhicules",
    sites:[], actif:false,
    prix:[
      {id:9007, dateDebut:"2024-01-01", dateFin:"2024-12-31", prix:480, devise:"FCFA", notes:"Tarif hors taxe"},
    ]},
];

export const isDemoActif = id => id >= 110 && id <= 200;
export const isDemoItem = id => id >= 100 && id <= 200;
export const isDemoHistoryItem = id => id >= 9000 && id <= 9999;
