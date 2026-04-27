const router = require("express").Router();
const prisma  = require("../db");

const fmt = (r) => ({
  id:          Number(r.id),
  nom:         r.nom,
  categorie:   r.categorie,
  unite:       r.unite,
  description: r.description,
  sites:       r.sites || [],
  actif:       r.actif,
  prix:        r.prix || [],
});

router.get("/", async (req, res) => {
  try {
    const rows = await prisma.produit.findMany({ where: { companyId: req.user.company_id }, orderBy: { id: "asc" } });
    res.json(rows.map(fmt));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", async (req, res) => {
  const { id, nom, categorie, unite, description, sites, actif, prix } = req.body;
  if (!nom) return res.status(400).json({ error: "Le nom est requis" });
  const recId = BigInt(id || Date.now());
  const data = {
    companyId: req.user.company_id, createdBy: req.user.id,
    nom, categorie: categorie||"", unite: unite||"litre",
    description: description||"", sites: sites||[], actif: actif !== false, prix: prix||[],
  };
  try {
    const row = await prisma.produit.upsert({ where: { id: recId }, create: { id: recId, ...data }, update: data });
    res.status(201).json(fmt(row));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", async (req, res) => {
  const { nom, categorie, unite, description, sites, actif, prix } = req.body;
  try {
    const existing = await prisma.produit.findFirst({ where: { id: BigInt(req.params.id), companyId: req.user.company_id } });
    if (!existing) return res.status(404).json({ error: "Produit introuvable" });
    const row = await prisma.produit.update({
      where: { id: existing.id },
      data: { nom, categorie: categorie||"", unite: unite||"litre", description: description||"", sites: sites||[], actif: actif !== false, prix: prix||[] },
    });
    res.json(fmt(row));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.produit.deleteMany({ where: { id: BigInt(req.params.id), companyId: req.user.company_id } });
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

module.exports = router;
