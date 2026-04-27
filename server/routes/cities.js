const router = require("express").Router();
const prisma  = require("../db");

const fmt = (c) => ({ id: c.id, name: c.name, region: c.region, pays: c.pays });

router.get("/", async (req, res) => {
  try {
    const rows = await prisma.city.findMany({
      where: { companyId: req.user.company_id },
      orderBy: { name: "asc" },
    });
    res.json(rows.map(fmt));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", async (req, res) => {
  const { name, region, pays } = req.body;
  if (!name) return res.status(400).json({ error: "Le nom de la ville est requis" });
  try {
    const row = await prisma.city.create({
      data: { companyId: req.user.company_id, createdBy: req.user.id, name, region: region||"", pays: pays||"" },
    });
    res.status(201).json(fmt(row));
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Une ville avec ce nom existe déjà" });
    console.error(err); res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/:id", async (req, res) => {
  const { name, region, pays } = req.body;
  if (!name) return res.status(400).json({ error: "Le nom de la ville est requis" });
  try {
    const existing = await prisma.city.findFirst({ where: { id: +req.params.id, companyId: req.user.company_id } });
    if (!existing) return res.status(404).json({ error: "Ville introuvable" });
    const row = await prisma.city.update({ where: { id: existing.id }, data: { name, region: region||"", pays: pays||"" } });
    res.json(fmt(row));
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Une ville avec ce nom existe déjà" });
    console.error(err); res.status(500).json({ error: "Erreur serveur" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.city.deleteMany({ where: { id: +req.params.id, companyId: req.user.company_id } });
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

module.exports = router;
