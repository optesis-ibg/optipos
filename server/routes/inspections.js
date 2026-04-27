const router = require("express").Router();
const prisma  = require("../db");

const fmt = (r) => ({
  id:         Number(r.id),
  site:       r.site,
  date:       r.date instanceof Date ? r.date.toISOString().split("T")[0] : r.date,
  inspector:  r.inspector,
  gpsCoords:  r.gpsCoords,
  headerSig:  r.headerSig,
  answers:    r.answers || {},
  totalScore: r.totalScore,
  totalMax:   r.totalMax,
  pct:        r.pct,
  questions:  r.questions || [],
  cats:       r.cats || [],
  createdBy:  r.createdBy,
  createdAt:  r.createdAt,
});

router.get("/", async (req, res) => {
  try {
    const rows = await prisma.inspection.findMany({
      where: { companyId: req.user.company_id },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    res.json(rows.map(fmt));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", async (req, res) => {
  const { id, site, date, inspector, gpsCoords, headerSig, answers, totalScore, totalMax, pct, questions, cats } = req.body;
  if (!site || !date) return res.status(400).json({ error: "Site et date requis" });
  const recId = BigInt(id || Date.now());
  try {
    const row = await prisma.inspection.upsert({
      where: { id: recId },
      create: {
        id: recId, companyId: req.user.company_id, createdBy: req.user.id,
        site, date: new Date(date), inspector: inspector||"",
        gpsCoords: gpsCoords||"", headerSig: headerSig||"",
        answers: answers||{}, totalScore: totalScore||0, totalMax: totalMax||0, pct: pct||0,
        questions: questions||[], cats: cats||[],
      },
      update: {
        site, date: new Date(date), inspector: inspector||"",
        gpsCoords: gpsCoords||"", headerSig: headerSig||"",
        answers: answers||{}, totalScore: totalScore||0, totalMax: totalMax||0, pct: pct||0,
        questions: questions||[], cats: cats||[],
      },
    });
    res.status(201).json(fmt(row));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.inspection.deleteMany({ where: { id: BigInt(req.params.id), companyId: req.user.company_id } });
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

module.exports = router;
