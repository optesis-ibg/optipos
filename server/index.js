require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const auth    = require("./middleware/auth");

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:4173", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json({ limit: "20mb" })); // large limit for signatures/attachments

// Serialize BigInt (used for actifs/produits/controles/inspections ids) as numbers
app.set("json replacer", (_, v) => (typeof v === "bigint" ? Number(v) : v));

// ── Routes publiques ────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));

// ── Routes protégées (JWT requis) ───────────────────────────────────
app.use("/api/users",        auth, require("./routes/users"));
app.use("/api/cities",       auth, require("./routes/cities"));
app.use("/api/sites",        auth, require("./routes/sites"));
app.use("/api/inspecteurs",  auth, require("./routes/inspecteurs"));
app.use("/api/categories",   auth, require("./routes/categories"));
app.use("/api/questions",    auth, require("./routes/questions"));
app.use("/api/inspections",  auth, require("./routes/inspections"));
app.use("/api/actifs",       auth, require("./routes/actifs"));
app.use("/api/produits",     auth, require("./routes/produits"));
app.use("/api/controles",    auth, require("./routes/controles"));
app.use("/api/permissions",  auth, require("./routes/permissions"));

// ── Health check ────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// ── 404 handler ─────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Route introuvable" }));

// ── Error handler ───────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur interne du serveur" });
});

app.listen(PORT, () => {
  console.log(`✅ StationCheck API démarrée sur http://localhost:${PORT}`);
});
