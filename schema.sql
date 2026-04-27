-- ══════════════════════════════════════════════════════
--  StationCheck Pro — PostgreSQL Schema
-- ══════════════════════════════════════════════════════

-- ── Companies ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id         SERIAL       PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  code       VARCHAR(50)  UNIQUE NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Users ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL       PRIMARY KEY,
  company_id    INTEGER      NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  prenom        VARCHAR(100) NOT NULL,
  nom           VARCHAR(100) NOT NULL,
  username      VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50)  NOT NULL DEFAULT 'inspecteur',
  custom_perms  JSONB        NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Villes ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cities (
  id         SERIAL       PRIMARY KEY,
  company_id INTEGER      NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  name       VARCHAR(255) NOT NULL,
  region     VARCHAR(255) NOT NULL DEFAULT '',
  pays       VARCHAR(100) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, name)
);

-- ── Sites / stations-service ──────────────────────────
CREATE TABLE IF NOT EXISTS sites (
  id             SERIAL       PRIMARY KEY,
  company_id     INTEGER      NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by     INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  name           VARCHAR(255) NOT NULL,
  addr           TEXT         NOT NULL DEFAULT '',
  code           VARCHAR(50)  NOT NULL DEFAULT '',
  tel            VARCHAR(50)  NOT NULL DEFAULT '',
  gerant_prenom  VARCHAR(100) NOT NULL DEFAULT '',
  gerant_nom     VARCHAR(100) NOT NULL DEFAULT '',
  date_contrat   DATE,
  type_gerant    VARCHAR(50)  NOT NULL DEFAULT '',
  city_id        INTEGER      REFERENCES cities(id) ON DELETE SET NULL,
  inspecteurs    JSONB        NOT NULL DEFAULT '[]',
  docs           JSONB        NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Migration: add city_id to existing sites tables
ALTER TABLE sites ADD COLUMN IF NOT EXISTS city_id INTEGER REFERENCES cities(id) ON DELETE SET NULL;

-- ── Inspecteurs ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS inspecteurs (
  id           SERIAL       PRIMARY KEY,
  company_id   INTEGER      NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by   INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  prenom       VARCHAR(100) NOT NULL,
  nom          VARCHAR(100) NOT NULL,
  date_entree  DATE,
  stations     JSONB        NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Catégories de questions ───────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL       PRIMARY KEY,
  company_id INTEGER      NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  name       VARCHAR(100) NOT NULL,
  scored     BOOLEAN      NOT NULL DEFAULT TRUE,
  order_idx  INTEGER      NOT NULL DEFAULT 0,
  UNIQUE (company_id, name)
);

-- ── Questions d'inspection ────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id         SERIAL       PRIMARY KEY,
  company_id INTEGER      NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  cat        VARCHAR(100) NOT NULL,
  text       TEXT         NOT NULL,
  type       VARCHAR(50)  NOT NULL DEFAULT 'selection',
  scored     BOOLEAN      NOT NULL DEFAULT TRUE,
  max_score  INTEGER      NOT NULL DEFAULT 10,
  opts       JSONB        NOT NULL DEFAULT '[]',
  formula    VARCHAR(255),
  min_val    INTEGER,
  max_val    INTEGER
);

-- ── Inspections (historique) ──────────────────────────
CREATE TABLE IF NOT EXISTS inspections (
  id           BIGINT       PRIMARY KEY,
  company_id   INTEGER      NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by   INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  site         VARCHAR(255) NOT NULL,
  date         DATE         NOT NULL,
  inspector    VARCHAR(255) NOT NULL DEFAULT '',
  gps_coords   VARCHAR(100) NOT NULL DEFAULT '',
  header_sig   TEXT         NOT NULL DEFAULT '',
  answers      JSONB        NOT NULL DEFAULT '{}',
  total_score  INTEGER      NOT NULL DEFAULT 0,
  total_max    INTEGER      NOT NULL DEFAULT 0,
  pct          INTEGER      NOT NULL DEFAULT 0,
  questions    JSONB        NOT NULL DEFAULT '[]',
  cats         JSONB        NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Actifs (équipements) ──────────────────────────────
CREATE TABLE IF NOT EXISTS actifs (
  id                BIGINT       PRIMARY KEY,
  company_id        INTEGER      NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by        INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  site              VARCHAR(255) NOT NULL DEFAULT '',
  categorie         VARCHAR(50)  NOT NULL DEFAULT '',
  type              VARCHAR(100) NOT NULL DEFAULT '',
  nom               VARCHAR(255) NOT NULL,
  marque            VARCHAR(100) NOT NULL DEFAULT '',
  serie             VARCHAR(100) NOT NULL DEFAULT '',
  produit           VARCHAR(255) NOT NULL DEFAULT '',
  cuve_rattachee    VARCHAR(255) NOT NULL DEFAULT '',
  pompes_rattachees JSONB        NOT NULL DEFAULT '[]',
  index_initial     VARCHAR(50)  NOT NULL DEFAULT '',
  index_actuel      VARCHAR(50)  NOT NULL DEFAULT '',
  code_barre        VARCHAR(100) NOT NULL DEFAULT '',
  date_maintenance  DATE,
  statut            VARCHAR(50)  NOT NULL DEFAULT 'actif',
  notes             TEXT         NOT NULL DEFAULT ''
);

-- ── Produits ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produits (
  id          BIGINT       PRIMARY KEY,
  company_id  INTEGER      NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by  INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  nom         VARCHAR(255) NOT NULL,
  categorie   VARCHAR(50)  NOT NULL DEFAULT '',
  unite       VARCHAR(50)  NOT NULL DEFAULT 'litre',
  description TEXT         NOT NULL DEFAULT '',
  sites       JSONB        NOT NULL DEFAULT '[]',
  actif       BOOLEAN      NOT NULL DEFAULT TRUE,
  prix        JSONB        NOT NULL DEFAULT '[]'
);

-- ── Contrôles de stock ────────────────────────────────
CREATE TABLE IF NOT EXISTS controles (
  id             BIGINT       PRIMARY KEY,
  company_id     INTEGER      NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by     INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  site           VARCHAR(255) NOT NULL DEFAULT '',
  date_controle  DATE         NOT NULL,
  notes          TEXT         NOT NULL DEFAULT '',
  statut         VARCHAR(50)  NOT NULL DEFAULT 'en_cours',
  pompes         JSONB        NOT NULL DEFAULT '[]',
  cuves          JSONB        NOT NULL DEFAULT '[]',
  recette        JSONB        NOT NULL DEFAULT '[]',
  paiements      JSONB        NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Permissions par rôle (scoped par company) ─────────
CREATE TABLE IF NOT EXISTS role_permissions (
  company_id  INTEGER      NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role        VARCHAR(50)  NOT NULL,
  key         VARCHAR(100) NOT NULL,
  lire        BOOLEAN      NOT NULL DEFAULT FALSE,
  creer       BOOLEAN      NOT NULL DEFAULT FALSE,
  modifier    BOOLEAN      NOT NULL DEFAULT FALSE,
  supprimer   BOOLEAN      NOT NULL DEFAULT FALSE,
  PRIMARY KEY (company_id, role, key)
);

-- ══════════════════════════════════════════════════════
--  Seed: company + admin par défaut (mot de passe: admin123)
--  Hash bcrypt généré avec 10 rounds
-- ══════════════════════════════════════════════════════
INSERT INTO companies (name, code)
VALUES ('Optesis', 'OPTESIS')
ON CONFLICT (code) DO NOTHING;

INSERT INTO users (company_id, prenom, nom, username, password_hash, role)
SELECT id, 'Admin', 'Système', 'admin',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin'
FROM companies WHERE code = 'OPTESIS'
ON CONFLICT (username) DO NOTHING;
-- Note: le hash ci-dessus correspond au mot de passe "password".
-- Exécutez "npm run seed" dans server/ pour définir "admin123" correctement.
