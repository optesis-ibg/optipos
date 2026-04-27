import 'dotenv/config';
import { defineConfig, env } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"), // Define your connection URL here for Migrate/CLI
  },
  /*migrate: {
    adapter(env) {
      return new PrismaPg(new Pool({ connectionString: env.DATABASE_URL }));
    },
  }, */
  migrations: {
    path: "prisma/migrations",
    seed: "tsx seed.ts",
  },
});
