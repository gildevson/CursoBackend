import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const url =
  process.env.MIGRATION_URL ??
  process.env.DATABASE_URL;

if (!url) {
  throw new Error('MIGRATION_URL/DATABASE_URL ausente no ambiente do Node.');
}

export default defineConfig({
  schema: './src/db/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
});
