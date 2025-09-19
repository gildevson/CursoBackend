// src/routes/users.ts
import { Hono } from 'hono';
import { requireAuth, requireRole } from '../lib/auth';
import { users } from '../db/tables/users';
import { eq, like } from 'drizzle-orm';
import type { Env, CtxVars } from '../lib/types';

export const usersRouter = new Hono<{ Bindings: Env; Variables: CtxVars }>();

// todas exigem login
usersRouter.use('*', requireAuth());

// apenas admin pode listar
usersRouter.get('/', requireRole('admin'), async (c) => {
  const db = c.var.db;
  const q = (c.req.query('q') ?? '').trim();

  const query = db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users);

  // drizzle aceita undefined em where; se preferir evitar, faça condicional
  const rows = q
    ? await query.where(like(users.name, `%${q}%`))
    : await query;

  return c.json(rows);
});

// admin pode deletar
usersRouter.delete('/:id', requireRole('admin'), async (c) => {
  const db = c.var.db;
  const id = c.req.param('id');
  await db.delete(users).where(eq(users.id, id));
  return c.body(null, 204);
});

export default usersRouter; // opcional: permite importar como default
