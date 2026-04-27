const router  = require("express").Router();
const bcrypt  = require("bcrypt");
const jwt     = require("jsonwebtoken");
const prisma  = require("../db");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Identifiant et mot de passe requis" });
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect" });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, company_id: user.companyId },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.json({
      token,
      user: {
        id:          user.id,
        company_id:  user.companyId,
        prenom:      user.prenom,
        nom:         user.nom,
        username:    user.username,
        role:        user.role,
        customPerms: user.customPerms || {},
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
