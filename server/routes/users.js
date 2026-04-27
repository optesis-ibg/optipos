const router = require("express").Router();
const bcrypt  = require("bcrypt");
const prisma  = require("../db");

const fmt = (u) => ({
  id:          u.id,
  company_id:  u.companyId,
  prenom:      u.prenom,
  nom:         u.nom,
  username:    u.username,
  role:        u.role,
  customPerms: u.customPerms || {},
});

router.get("/", async (req, res) => {
  try {
    const rows = await prisma.user.findMany({ where: { companyId: req.user.company_id }, orderBy: { id: "asc" } });
    res.json(rows.map(fmt));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", async (req, res) => {
  const { prenom, nom, username, password, role, customPerms } = req.body;
  if (!prenom || !nom || !username || !password)
    return res.status(400).json({ error: "Champs obligatoires manquants" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const row = await prisma.user.create({
      data: { companyId: req.user.company_id, prenom, nom, username, passwordHash: hash, role: role||"inspecteur", customPerms: customPerms||{} },
    });
    res.status(201).json(fmt(row));
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Ce nom d'utilisateur est déjà pris" });
    console.error(err); res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/:id", async (req, res) => {
  const { prenom, nom, username, password, role, customPerms } = req.body;
  try {
    const existing = await prisma.user.findFirst({ where: { id: +req.params.id, companyId: req.user.company_id } });
    if (!existing) return res.status(404).json({ error: "Utilisateur introuvable" });
    const data = {};
    if (prenom)      data.prenom      = prenom;
    if (nom)         data.nom         = nom;
    if (username)    data.username     = username;
    if (password)    data.passwordHash = await bcrypt.hash(password, 10);
    if (role)        data.role         = role;
    if (customPerms) data.customPerms  = customPerms;
    const row = await prisma.user.update({ where: { id: existing.id }, data });
    res.json(fmt(row));
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Ce nom d'utilisateur est déjà pris" });
    console.error(err); res.status(500).json({ error: "Erreur serveur" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.user.deleteMany({ where: { id: +req.params.id, companyId: req.user.company_id } });
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

module.exports = router;
