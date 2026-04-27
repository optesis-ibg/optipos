const router = require("express").Router();
const prisma  = require("../db");

router.get("/", async (req, res) => {
  try {
    const rows = await prisma.rolePermission.findMany({ where: { companyId: req.user.company_id } });
    const result = {};
    rows.forEach(({ role, key, lire, creer, modifier, supprimer }) => {
      if (!result[role]) result[role] = {};
      result[role][key] = { lire, creer, modifier, supprimer };
    });
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/", async (req, res) => {
  const rolePerms = req.body;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { companyId: req.user.company_id } });
      const inserts = [];
      for (const [role, perms] of Object.entries(rolePerms)) {
        for (const [key, { lire, creer, modifier, supprimer }] of Object.entries(perms)) {
          inserts.push(tx.rolePermission.create({
            data: { companyId: req.user.company_id, role, key, lire: !!lire, creer: !!creer, modifier: !!modifier, supprimer: !!supprimer },
          }));
        }
      }
      await Promise.all(inserts);
    });
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

module.exports = router;
