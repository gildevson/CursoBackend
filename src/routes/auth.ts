import { Hono } from 'hono';
import type { Env, CtxVars } from '../lib/types';
import { users } from '../db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signJwt } from '../lib/jwt';

export const auth = new Hono<{ Bindings: Env; Variables: CtxVars }>();

auth.post('/register', async (c) => {
  const db = c.var.db;
  const body = await c.req.json();
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  if (!name || !email || !password) return c.json({ error: 'Dados inválidos' }, 400);

  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (exists) return c.json({ error: 'E-mail já usado' }, 409);

  const hash = await bcrypt.hash(password, 10);
  const [created] = await db.insert(users)
    .values({ name, email, passwordHash: hash })
    .returning({ id: users.id, name: users.name, email: users.email });

  const token = await signJwt({ sub: created.id, email: created.email, name: created.name }, c.env.JWT_SECRET);
  return c.json({ token, user: created }, 201);
});

auth.post('/login', async (c) => {
  const db = c.var.db;
  const body = await c.req.json();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  const [row] = await db.select({ id: users.id, name: users.name, passwordHash: users.passwordHash, email: users.email })
    .from(users).where(eq(users.email, email)).limit(1);

  if (!row) return c.json({ error: 'Credenciais inválidas' }, 401);

  const ok = await bcrypt.compare(password, row.passwordHash);
  if (!ok) return c.json({ error: 'Credenciais inválidas' }, 401);

  const token = await signJwt({ sub: row.id, email: row.email, name: row.name }, c.env.JWT_SECRET);
  return c.json({ token, user: { id: row.id, name: row.name, email: row.email } });
});
