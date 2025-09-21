// drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const url = process.env.MIGRATION_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error('MIGRATION_URL/DATABASE_URL não definida');

export default defineConfig({
  dialect: 'postgresql',
  driver: 'pg', // 👈 OBRIGATÓRIO para migrar via TCP
  dbCredentials: { url },
  schema: ['./src/db/tables/**/*.ts'],
  out: './drizzle',
  migrations: { table: '__drizzle_migrations__', schema: 'public' },
});

//  schema: './src/db/index.ts',
// out: './drizzle',
//  dialect: 'postgresql',
//  dbCredentials: { url },
//});
