const router = require("express").Router();
const prisma  = require("../db");

const fmt = (s) => ({
  id:           s.id,
  name:         s.name,
  addr:         s.addr,
  code:         s.code,
  tel:          s.tel,
  cityId:       s.cityId || null,
  gerantPrenom: s.gerantPrenom,
  gerantNom:    s.gerantNom,
  dateContrat:  s.dateContrat ? s.dateContrat.toISOString().split("T")[0] : "",
  typeGerant:   s.typeGerant,
  inspecteurs:  s.inspecteurs || [],
  docs:         s.docs || [],
});

router.get("/", async (req, res) => {
  try {
    const rows = await prisma.site.findMany({ where: { companyId: req.user.company_id }, orderBy: { id: "asc" } });
    res.json(rows.map(fmt));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", async (req, res) => {
  const { name, addr, code, tel, cityId, gerantPrenom, gerantNom, dateContrat, typeGerant, inspecteurs, docs } = req.body;
  if (!name) return res.status(400).json({ error: "Le nom du site est requis" });
  try {
    const row = await prisma.site.create({
      data: {
        companyId: req.user.company_id, createdBy: req.user.id,
        name, addr: addr||"", code: code||"", tel: tel||"",
        cityId: cityId ? +cityId : null,
        gerantPrenom: gerantPrenom||"", gerantNom: gerantNom||"",
        dateContrat: dateContrat ? new Date(dateContrat) : null,
        typeGerant: typeGerant||"",
        inspecteurs: inspecteurs||[], docs: docs||[],
      },
    });
    res.status(201).json(fmt(row));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", async (req, res) => {
  const { name, addr, code, tel, cityId, gerantPrenom, gerantNom, dateContrat, typeGerant, inspecteurs, docs } = req.body;
  try {
    const existing = await prisma.site.findFirst({ where: { id: +req.params.id, companyId: req.user.company_id } });
    if (!existing) return res.status(404).json({ error: "Site introuvable" });
    const row = await prisma.site.update({
      where: { id: existing.id },
      data: {
        name, addr: addr||"", code: code||"", tel: tel||"",
        cityId: cityId ? +cityId : null,
        gerantPrenom: gerantPrenom||"", gerantNom: gerantNom||"",
        dateContrat: dateContrat ? new Date(dateContrat) : null,
        typeGerant: typeGerant||"",
        inspecteurs: inspecteurs||[], docs: docs||[],
      },
    });
    res.json(fmt(row));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.site.deleteMany({ where: { id: +req.params.id, companyId: req.user.company_id } });
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

module.exports = router;
