const router = require("express").Router();
const prisma  = require("../db");

const fmt = (r) => ({
  id:               Number(r.id),
  site:             r.site,
  categorie:        r.categorie,
  type:             r.type,
  nom:              r.nom,
  marque:           r.marque,
  serie:            r.serie,
  produit:          r.produit,
  cuveRattachee:    r.cuveRattachee,
  pompesRattachees: r.pompesRattachees || [],
  indexInitial:     r.indexInitial,
  indexActuel:      r.indexActuel,
  codeBarre:        r.codeBarre,
  dateMaintenance:  r.dateMaintenance ? r.dateMaintenance.toISOString().split("T")[0] : "",
  statut:           r.statut,
  notes:            r.notes,
});

router.get("/", async (req, res) => {
  try {
    const rows = await prisma.actif.findMany({ where: { companyId: req.user.company_id }, orderBy: { id: "asc" } });
    res.json(rows.map(fmt));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", async (req, res) => {
  const { id, site, categorie, type, nom, marque, serie, produit,
          cuveRattachee, pompesRattachees, indexInitial, indexActuel,
          codeBarre, dateMaintenance, statut, notes } = req.body;
  if (!nom) return res.status(400).json({ error: "Le nom est requis" });
  const recId = BigInt(id || Date.now());
  const data = {
    companyId: req.user.company_id, createdBy: req.user.id,
    site: site||"", categorie: categorie||"", type: type||"", nom,
    marque: marque||"", serie: serie||"", produit: produit||"",
    cuveRattachee: cuveRattachee||"", pompesRattachees: pompesRattachees||[],
    indexInitial: indexInitial||"", indexActuel: indexActuel||"",
    codeBarre: codeBarre||"",
    dateMaintenance: dateMaintenance ? new Date(dateMaintenance) : null,
    statut: statut||"actif", notes: notes||"",
  };
  try {
    const row = await prisma.actif.upsert({ where: { id: recId }, create: { id: recId, ...data }, update: data });
    res.status(201).json(fmt(row));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", async (req, res) => {
  const { site, categorie, type, nom, marque, serie, produit,
          cuveRattachee, pompesRattachees, indexInitial, indexActuel,
          codeBarre, dateMaintenance, statut, notes } = req.body;
  try {
    const existing = await prisma.actif.findFirst({ where: { id: BigInt(req.params.id), companyId: req.user.company_id } });
    if (!existing) return res.status(404).json({ error: "Actif introuvable" });
    const row = await prisma.actif.update({
      where: { id: existing.id },
      data: {
        site: site||"", categorie: categorie||"", type: type||"", nom,
        marque: marque||"", serie: serie||"", produit: produit||"",
        cuveRattachee: cuveRattachee||"", pompesRattachees: pompesRattachees||[],
        indexInitial: indexInitial||"", indexActuel: indexActuel||"",
        codeBarre: codeBarre||"",
        dateMaintenance: dateMaintenance ? new Date(dateMaintenance) : null,
        statut: statut||"actif", notes: notes||"",
      },
    });
    res.json(fmt(row));
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.actif.deleteMany({ where: { id: BigInt(req.params.id), companyId: req.user.company_id } });
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

module.exports = router;
