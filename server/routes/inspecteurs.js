const router = require("express").Router();
const prisma  = require("../db");

const fmt = (r) => ({
  id:         r.id,
  prenom:     r.prenom,
  nom:        r.nom,
  dateEntree: r.dateEntree ? r.dateEntree.toISOString().split("T")[0] : "",
  stations:   r.stations || [],
});

router.get("/", async (req, res) => {
  try {
    const rows = await prisma.inspecteur.findMany({ where: { companyId: req.user.company_id }, orderBy: { id: "asc" } });
    res.json(rows.map(fmt));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", async (req, res) => {
  const { prenom, nom, dateEntree, stations } = req.body;
  if (!prenom || !nom) return res.status(400).json({ error: "Prénom et nom requis" });
  try {
    const row = await prisma.inspecteur.create({
      data: {
        companyId: req.user.company_id, createdBy: req.user.id,
        prenom, nom,
        dateEntree: dateEntree ? new Date(dateEntree) : null,
        stations: stations||[],
      },
    });
    res.status(201).json(fmt(row));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", async (req, res) => {
  const { prenom, nom, dateEntree, stations } = req.body;
  try {
    const existing = await prisma.inspecteur.findFirst({ where: { id: +req.params.id, companyId: req.user.company_id } });
    if (!existing) return res.status(404).json({ error: "Inspecteur introuvable" });
    const row = await prisma.inspecteur.update({
      where: { id: existing.id },
      data: { prenom, nom, dateEntree: dateEntree ? new Date(dateEntree) : null, stations: stations||[] },
    });
    res.json(fmt(row));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.inspecteur.deleteMany({ where: { id: +req.params.id, companyId: req.user.company_id } });
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

module.exports = router;
