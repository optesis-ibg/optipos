-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'inspecteur',
    "custom_perms" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "created_by" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "region" VARCHAR(255) NOT NULL DEFAULT '',
    "pays" VARCHAR(100) NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "created_by" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "addr" TEXT NOT NULL DEFAULT '',
    "code" VARCHAR(50) NOT NULL DEFAULT '',
    "tel" VARCHAR(50) NOT NULL DEFAULT '',
    "city_id" INTEGER,
    "gerant_prenom" VARCHAR(100) NOT NULL DEFAULT '',
    "gerant_nom" VARCHAR(100) NOT NULL DEFAULT '',
    "date_contrat" DATE,
    "type_gerant" VARCHAR(50) NOT NULL DEFAULT '',
    "inspecteurs" JSONB NOT NULL DEFAULT '[]',
    "docs" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspecteurs" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "created_by" INTEGER,
    "prenom" VARCHAR(100) NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "date_entree" DATE,
    "stations" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspecteurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "created_by" INTEGER,
    "name" VARCHAR(100) NOT NULL,
    "scored" BOOLEAN NOT NULL DEFAULT true,
    "order_idx" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "created_by" INTEGER,
    "cat" VARCHAR(100) NOT NULL,
    "text" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'selection',
    "scored" BOOLEAN NOT NULL DEFAULT true,
    "max_score" INTEGER NOT NULL DEFAULT 10,
    "opts" JSONB NOT NULL DEFAULT '[]',
    "formula" VARCHAR(255),
    "min_val" INTEGER,
    "max_val" INTEGER,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" BIGINT NOT NULL,
    "company_id" INTEGER NOT NULL,
    "created_by" INTEGER,
    "site" VARCHAR(255) NOT NULL,
    "date" DATE NOT NULL,
    "inspector" VARCHAR(255) NOT NULL DEFAULT '',
    "gps_coords" VARCHAR(100) NOT NULL DEFAULT '',
    "header_sig" TEXT NOT NULL DEFAULT '',
    "answers" JSONB NOT NULL DEFAULT '{}',
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "total_max" INTEGER NOT NULL DEFAULT 0,
    "pct" INTEGER NOT NULL DEFAULT 0,
    "questions" JSONB NOT NULL DEFAULT '[]',
    "cats" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actifs" (
    "id" BIGINT NOT NULL,
    "company_id" INTEGER NOT NULL,
    "created_by" INTEGER,
    "site" VARCHAR(255) NOT NULL DEFAULT '',
    "categorie" VARCHAR(50) NOT NULL DEFAULT '',
    "type" VARCHAR(100) NOT NULL DEFAULT '',
    "nom" VARCHAR(255) NOT NULL,
    "marque" VARCHAR(100) NOT NULL DEFAULT '',
    "serie" VARCHAR(100) NOT NULL DEFAULT '',
    "produit" VARCHAR(255) NOT NULL DEFAULT '',
    "cuve_rattachee" VARCHAR(255) NOT NULL DEFAULT '',
    "pompes_rattachees" JSONB NOT NULL DEFAULT '[]',
    "index_initial" VARCHAR(50) NOT NULL DEFAULT '',
    "index_actuel" VARCHAR(50) NOT NULL DEFAULT '',
    "code_barre" VARCHAR(100) NOT NULL DEFAULT '',
    "date_maintenance" DATE,
    "statut" VARCHAR(50) NOT NULL DEFAULT 'actif',
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "actifs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produits" (
    "id" BIGINT NOT NULL,
    "company_id" INTEGER NOT NULL,
    "created_by" INTEGER,
    "nom" VARCHAR(255) NOT NULL,
    "categorie" VARCHAR(50) NOT NULL DEFAULT '',
    "unite" VARCHAR(50) NOT NULL DEFAULT 'litre',
    "description" TEXT NOT NULL DEFAULT '',
    "sites" JSONB NOT NULL DEFAULT '[]',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "prix" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controles" (
    "id" BIGINT NOT NULL,
    "company_id" INTEGER NOT NULL,
    "created_by" INTEGER,
    "site" VARCHAR(255) NOT NULL DEFAULT '',
    "date_controle" DATE NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "statut" VARCHAR(50) NOT NULL DEFAULT 'en_cours',
    "pompes" JSONB NOT NULL DEFAULT '[]',
    "cuves" JSONB NOT NULL DEFAULT '[]',
    "recette" JSONB NOT NULL DEFAULT '[]',
    "paiements" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "controles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "company_id" INTEGER NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "lire" BOOLEAN NOT NULL DEFAULT false,
    "creer" BOOLEAN NOT NULL DEFAULT false,
    "modifier" BOOLEAN NOT NULL DEFAULT false,
    "supprimer" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("company_id","role","key")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_code_key" ON "companies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "cities_company_id_name_key" ON "cities"("company_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_company_id_name_key" ON "categories"("company_id", "name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecteurs" ADD CONSTRAINT "inspecteurs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actifs" ADD CONSTRAINT "actifs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits" ADD CONSTRAINT "produits_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controles" ADD CONSTRAINT "controles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
