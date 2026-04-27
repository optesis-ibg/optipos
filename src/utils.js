import { DEFAULT_PERMISSIONS, MENU_OBJECTS } from "./constants.js";

export const ROLES_LIST = ["admin","superviseur","inspecteur"];

export const inspFullName = i => `${i.prenom} ${i.nom}`;

export const ROLES = [
  {id:"admin",       label:"Administrateur",  color:"#5F3876", bg:"#fef2f2", border:"#fecaca"},
  {id:"superviseur", label:"Superviseur",      color:"#5F3876", bg:"#F5F0FA", border:"#C9B8DC"},
  {id:"inspecteur",  label:"Inspecteur",       color:"#5F3876", bg:"#F5F0FA", border:"#C9B8DC"},
];
export const roleInfo = id => ROLES.find(r=>r.id===id) || ROLES[2];

export const today = new Date().toISOString().split("T")[0];

export const sc = p => p >= 85 ? "#70BC80" : p >= 65 ? "#7A5499" : "#E94C57";
export const sl = p => p >= 85 ? "Excellent" : p >= 65 ? "Acceptable" : p >= 40 ? "Insuffisant" : "Critique";

export const genQR = () => Array.from({length:100},(_,i)=>{
  const r=Math.floor(i/10), c=i%10;
  return (r<3&&c<3)||(r<3&&c>6)||(r>6&&c<3)||(!((r<3&&c<3)||(r<3&&c>6)||(r>6&&c<3))&&Math.random()>0.55);
});

export const resolvePerms = (user, rolePerms) => {
  const base = DEFAULT_PERMISSIONS[user.role] || DEFAULT_PERMISSIONS.inspecteur;
  const custom = (rolePerms || {})[user.role] || {};
  const result = { ...base };
  Object.entries(custom).forEach(([key, val]) => { result[key] = { ...base[key], ...val }; });
  if (user.customPerms) {
    Object.entries(user.customPerms).forEach(([key, val]) => { result[key] = { ...(result[key]||{}), ...val }; });
  }
  return result;
};

export const hasPerm = (perms, menu, obj, right) => {
  const key = `${menu}.${obj}`;
  return perms?.[key]?.[right] === true;
};

export const canAccessMenu = (perms, menuId) => {
  const objs = MENU_OBJECTS[menuId] || [];
  return objs.some(obj => perms?.[`${menuId}.${obj}`]?.lire === true);
};
