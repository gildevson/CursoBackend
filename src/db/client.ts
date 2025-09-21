import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';


export function makeDb(env: { DATABASE_URL?: string; MIGRATION_URL?: string }) {
  // Tenta DATABASE_URL (Worker) e, se faltar, usa MIGRATION_URL
  const url = env.DATABASE_URL ?? env.MIGRATION_URL;
  if (!url) throw new Error('DATABASE_URL não configurada');
  const sql = neon(url);
  return drizzle(sql);
}
