const router = require("express").Router();
const prisma  = require("../db");

const fmt = (r) => ({
  id:       r.id,
  cat:      r.cat,
  text:     r.text,
  type:     r.type,
  scored:   r.scored,
  maxScore: r.maxScore,
  opts:     r.opts || [],
  formula:  r.formula || "",
  min:      r.minVal,
  max:      r.maxVal,
});

router.get("/", async (req, res) => {
  try {
    const rows = await prisma.question.findMany({ where: { companyId: req.user.company_id }, orderBy: { id: "asc" } });
    res.json(rows.map(fmt));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", async (req, res) => {
  const { cat, text, type, scored, maxScore, opts, formula, min, max } = req.body;
  if (!cat || !text) return res.status(400).json({ error: "Catégorie et texte requis" });
  try {
    const row = await prisma.question.create({
      data: {
        companyId: req.user.company_id, createdBy: req.user.id,
        cat, text, type: type||"selection", scored: scored !== false,
        maxScore: maxScore||10, opts: opts||[], formula: formula||null,
        minVal: min||null, maxVal: max||null,
      },
    });
    res.status(201).json(fmt(row));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", async (req, res) => {
  const { cat, text, type, scored, maxScore, opts, formula, min, max } = req.body;
  try {
    const existing = await prisma.question.findFirst({ where: { id: +req.params.id, companyId: req.user.company_id } });
    if (!existing) return res.status(404).json({ error: "Question introuvable" });
    const row = await prisma.question.update({
      where: { id: existing.id },
      data: { cat, text, type, scored: scored !== false, maxScore: maxScore||10, opts: opts||[], formula: formula||null, minVal: min||null, maxVal: max||null },
    });
    res.json(fmt(row));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.question.deleteMany({ where: { id: +req.params.id, companyId: req.user.company_id } });
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

module.exports = router;
