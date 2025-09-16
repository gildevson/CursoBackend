// src/routes/dbping.ts
import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { makeDb } from '../db/client';
import type { Env } from '../lib/types'; // <-- importe seu tipo de bindings

// tipa o Hono para que c.env seja do tipo Env
const dbping = new Hono<{ Bindings: Env }>();

dbping.get('', async (c) => {  // '' = /dbping sem barra final
  const db = makeDb(c.env);    // agora c.env é Env, não "unknown"
  const result: any = await db.execute(sql`select now()`);
  const row = Array.isArray(result) ? result[0] : result?.rows?.[0];
  return c.json({ now: row?.now ?? null });
});

export default dbping;
