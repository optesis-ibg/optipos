const router = require("express").Router();
const prisma  = require("../db");

const fmt = (r) => ({ id: r.id, name: r.name, scored: r.scored, orderIdx: r.orderIdx });

router.get("/", async (req, res) => {
  try {
    const rows = await prisma.category.findMany({
      where: { companyId: req.user.company_id },
      orderBy: [{ orderIdx: "asc" }, { id: "asc" }],
    });
    res.json(rows.map(fmt));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", async (req, res) => {
  const { name, scored, orderIdx } = req.body;
  if (!name) return res.status(400).json({ error: "Le nom est requis" });
  try {
    const row = await prisma.category.upsert({
      where: { companyId_name: { companyId: req.user.company_id, name } },
      update: { scored: scored !== false, orderIdx: orderIdx || 0 },
      create: { companyId: req.user.company_id, createdBy: req.user.id, name, scored: scored !== false, orderIdx: orderIdx || 0 },
    });
    res.status(201).json(fmt(row));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", async (req, res) => {
  const { name, scored, orderIdx } = req.body;
  try {
    const existing = await prisma.category.findFirst({ where: { id: +req.params.id, companyId: req.user.company_id } });
    if (!existing) return res.status(404).json({ error: "Catégorie introuvable" });
    const row = await prisma.category.update({
      where: { id: existing.id },
      data: { name, scored: scored !== false, orderIdx: orderIdx || 0 },
    });
    res.json(fmt(row));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

// Bulk replace — used when reordering
router.put("/", async (req, res) => {
  const cats = req.body;
  if (!Array.isArray(cats)) return res.status(400).json({ error: "Tableau attendu" });
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.category.deleteMany({ where: { companyId: req.user.company_id } });
      return Promise.all(
        cats.map((c, i) =>
          tx.category.create({
            data: { companyId: req.user.company_id, createdBy: req.user.id, name: c.name, scored: c.scored !== false, orderIdx: i },
          })
        )
      );
    });
    res.json(result.map(fmt));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.category.deleteMany({ where: { id: +req.params.id, companyId: req.user.company_id } });
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

module.exports = router;
