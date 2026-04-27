import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
//const prisma = new PrismaClient();

async function seed() {
  const company = await prisma.company.upsert({
    where:  { code: "OPTESIS" },
    update: { name: "Optesis" },
    create: { name: "Optesis", code: "OPTESIS" },
  });

  const hash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where:  { username: "admin" },
    update: { passwordHash: hash, companyId: company.id },
    create: { companyId: company.id, prenom: "Admin", nom: "Système", username: "admin", passwordHash: hash, role: "admin" },
  });

  console.log(`✅ Company "Optesis" (id=${company.id}) et utilisateur admin créés/mis à jour (admin / admin123)`);
  await prisma.$disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
