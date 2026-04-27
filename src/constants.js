export const ROLES = [
  {id:"admin",       label:"Administrateur",  color:"#5F3876", bg:"#fef2f2", border:"#fecaca"},
  {id:"superviseur", label:"Superviseur",      color:"#5F3876", bg:"#F5F0FA", border:"#C9B8DC"},
  {id:"inspecteur",  label:"Inspecteur",       color:"#5F3876", bg:"#F5F0FA", border:"#C9B8DC"},
];

export const MENU_OBJECTS = {
  dashboard:   ["indicateurs","graphiques","historique"],
  inspection:  ["inspection","historique_inspection"],
  actifs:      ["actifs"],
  produits:    ["produits"],
  stock:       ["controle_stock"],
  builder:     ["questions","categories"],
  cities:      ["cities"],
  sites:       ["sites"],
  inspecteurs: ["inspecteurs"],
  users:       ["utilisateurs","roles","permissions"],
};

export const OBJECT_LABELS = {
  indicateurs:          "Indicateurs clés",
  graphiques:           "Graphiques & charts",
  historique:           "Historique des données",
  inspection:           "Formulaire d'inspection",
  actifs:               "Équipements (actifs)",
  produits:             "Produits & tarifs",
  controle_stock:       "Contrôle de stock",
  historique_inspection:"Historique inspections",
  questions:            "Questions",
  categories:           "Catégories",
  cities:               "Villes",
  sites:                "Sites / stations",
  inspecteurs:          "Inspecteurs",
  utilisateurs:         "Utilisateurs",
  roles:                "Rôles",
  permissions:          "Permissions",
};

export const MENU_LABELS = {
  dashboard:   "Tableau de bord",
  inspection:  "Inspection",
  actifs:      "Actifs",
  produits:    "Produits",
  stock:       "Contrôle stock",
  builder:     "Constructeur",
  cities:      "Villes",
  sites:       "Sites",
  inspecteurs: "Inspecteurs",
  users:       "Utilisateurs",
};

export const RIGHTS = ["lire","creer","modifier","supprimer"];
export const RIGHT_LABELS = { lire:"Lire", creer:"Créer", modifier:"Modifier", supprimer:"Supprimer" };
export const RIGHT_ICONS  = { lire:"👁", creer:"➕", modifier:"✏️", supprimer:"🗑️" };

export const DEFAULT_PERMISSIONS = {
  admin: Object.fromEntries(
    Object.entries(MENU_OBJECTS).flatMap(([menu, objs]) =>
      objs.map(obj => [`${menu}.${obj}`, {lire:true,creer:true,modifier:true,supprimer:true}])
    )
  ),
  superviseur: {
    "dashboard.indicateurs":          {lire:true, creer:false,modifier:false,supprimer:false},
    "dashboard.graphiques":           {lire:true, creer:false,modifier:false,supprimer:false},
    "dashboard.historique":           {lire:true, creer:false,modifier:false,supprimer:false},
    "actifs.actifs":                  {lire:true, creer:true, modifier:true, supprimer:true},
    "produits.produits":              {lire:true, creer:true, modifier:true, supprimer:true},
    "stock.controle_stock":           {lire:true, creer:true, modifier:true, supprimer:false},
    "inspection.inspection":          {lire:true, creer:true, modifier:true, supprimer:false},
    "inspection.historique_inspection":{lire:true,creer:false,modifier:false,supprimer:false},
    "builder.questions":              {lire:true, creer:false,modifier:false,supprimer:false},
    "builder.categories":             {lire:true, creer:false,modifier:false,supprimer:false},
    "cities.cities":                  {lire:true, creer:false,modifier:false,supprimer:false},
    "sites.sites":                    {lire:true, creer:false,modifier:false,supprimer:false},
    "inspecteurs.inspecteurs":        {lire:true, creer:false,modifier:false,supprimer:false},
    "users.utilisateurs":             {lire:false,creer:false,modifier:false,supprimer:false},
    "users.roles":                    {lire:false,creer:false,modifier:false,supprimer:false},
    "users.permissions":              {lire:false,creer:false,modifier:false,supprimer:false},
  },
  inspecteur: {
    "dashboard.indicateurs":          {lire:true, creer:false,modifier:false,supprimer:false},
    "dashboard.graphiques":           {lire:true, creer:false,modifier:false,supprimer:false},
    "dashboard.historique":           {lire:false,creer:false,modifier:false,supprimer:false},
    "actifs.actifs":                  {lire:true, creer:false,modifier:false,supprimer:false},
    "produits.produits":              {lire:true, creer:false,modifier:false,supprimer:false},
    "stock.controle_stock":           {lire:true, creer:true, modifier:true, supprimer:false},
    "inspection.inspection":          {lire:true, creer:true, modifier:false,supprimer:false},
    "inspection.historique_inspection":{lire:true,creer:false,modifier:false,supprimer:false},
    "builder.questions":              {lire:false,creer:false,modifier:false,supprimer:false},
    "builder.categories":             {lire:false,creer:false,modifier:false,supprimer:false},
    "cities.cities":                  {lire:true, creer:false,modifier:false,supprimer:false},
    "sites.sites":                    {lire:true, creer:false,modifier:false,supprimer:false},
    "inspecteurs.inspecteurs":        {lire:true, creer:false,modifier:false,supprimer:false},
    "users.utilisateurs":             {lire:false,creer:false,modifier:false,supprimer:false},
    "users.roles":                    {lire:false,creer:false,modifier:false,supprimer:false},
    "users.permissions":              {lire:false,creer:false,modifier:false,supprimer:false},
  },
};

export const TABS = [
  { id:"dashboard",   label:"Tableau de bord",  icon:"📊" },
  { id:"inspection",  label:"Inspection",        icon:"📋" },
  { id:"actifs",      label:"Actifs",            icon:"🔧" },
  { id:"produits",    label:"Produits",          icon:"⛽" },
  { id:"stock",       label:"Contrôle stock",    icon:"📦" },
  { id:"builder",     label:"Constructeur",      icon:"🏗️" },
  { id:"cities",      label:"Villes",            icon:"🏙️" },
  { id:"sites",       label:"Sites",             icon:"📍" },
  { id:"inspecteurs", label:"Inspecteurs",       icon:"👥" },
  { id:"users",       label:"Utilisateurs",      icon:"🔐", adminOnly:true },
  { id:"permissions", label:"Permissions",       icon:"🛡️", adminOnly:true },
  { id:"demo",        label:"Données démo",      icon:"🧪", adminOnly:true },
];
