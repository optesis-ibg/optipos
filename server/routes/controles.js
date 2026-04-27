const router = require("express").Router();
const prisma  = require("../db");

const fmt = (r) => ({
  id:           Number(r.id),
  site:         r.site,
  dateControle: r.dateControle instanceof Date ? r.dateControle.toISOString().split("T")[0] : r.dateControle,
  notes:        r.notes,
  statut:       r.statut,
  pompes:       r.pompes || [],
  cuves:        r.cuves  || [],
  recette:      r.recette || [],
  paiements:    r.paiements || {},
  createdAt:    r.createdAt,
  updatedAt:    r.updatedAt,
});

router.get("/", async (req, res) => {
  try {
    const rows = await prisma.controle.findMany({ where: { companyId: req.user.company_id }, orderBy: { createdAt: "desc" } });
    res.json(rows.map(fmt));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", async (req, res) => {
  const { id, site, dateControle, notes, statut, pompes, cuves, recette, paiements } = req.body;
  if (!site) return res.status(400).json({ error: "Le site est requis" });
  const recId = BigInt(id || Date.now());
  const data = {
    companyId: req.user.company_id, createdBy: req.user.id,
    site, dateControle: new Date(dateControle || new Date().toISOString().slice(0, 10)),
    notes: notes||"", statut: statut||"en_cours",
    pompes: pompes||[], cuves: cuves||[], recette: recette||[], paiements: paiements||{},
  };
  try {
    const row = await prisma.controle.upsert({ where: { id: recId }, create: { id: recId, ...data }, update: { ...data, updatedAt: new Date() } });
    res.status(201).json(fmt(row));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", async (req, res) => {
  const { site, dateControle, notes, statut, pompes, cuves, recette, paiements } = req.body;
  try {
    const existing = await prisma.controle.findFirst({ where: { id: BigInt(req.params.id), companyId: req.user.company_id } });
    if (!existing) return res.status(404).json({ error: "Contrôle introuvable" });
    const row = await prisma.controle.update({
      where: { id: existing.id },
      data: {
        site, dateControle: new Date(dateControle), notes: notes||"", statut: statut||"en_cours",
        pompes: pompes||[], cuves: cuves||[], recette: recette||[], paiements: paiements||{},
        updatedAt: new Date(),
      },
    });
    res.json(fmt(row));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.controle.deleteMany({ where: { id: BigInt(req.params.id), companyId: req.user.company_id } });
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

module.exports = router;
