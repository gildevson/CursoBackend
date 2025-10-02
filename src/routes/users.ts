// src/routes/users.ts
import { Hono } from 'hono';
import { requireAuth, requireRole } from '../lib/auth';
import { users } from '../db/tables/users';
import { eq, like } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { Env, CtxVars } from '../lib/types';

export const usersRouter = new Hono<{ Bindings: Env; Variables: CtxVars }>();

// 🔒 todas exigem login
usersRouter.use('*', requireAuth());

/* ======================
   LISTAR (admin)
====================== */
usersRouter.get('/', requireRole('admin'), async (c) => {
  try {
    const db = c.var.db;
    const q = (c.req.query('q') ?? '').trim();

    const query = db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users);

    const rows = q
      ? await query.where(like(users.name, `%${q}%`))
      : await query;

    return c.json(rows);
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    return c.json({ error: 'Falha ao buscar usuários' }, 500);
  }
});

/* ======================
   CRIAR (admin)
====================== */
usersRouter.post('/', requireRole('admin'), async (c) => {
  try {
    const db = c.var.db;
    const { name, email, password } = await c.req.json<{
      name: string;
      email: string;
      password: string;
    }>();

    if (!name || !email || !password) {
      return c.json({ error: 'Nome, e-mail e senha são obrigatórios' }, 400);
    }

    // 🔎 checar se já existe
    const [exists] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (exists) {
      return c.json({ error: 'E-mail já cadastrado' }, 409);
    }

    const hash = await bcrypt.hash(password, 10);
    const [created] = await db
      .insert(users)
      .values({ name, email: email.toLowerCase(), passwordHash: hash })
      .returning({ id: users.id, name: users.name, email: users.email });

    return c.json(created, 201);
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    return c.json({ error: 'Falha ao criar usuário' }, 500);
  }
});

/* ======================
   EXCLUIR (admin)
====================== */
usersRouter.delete('/:id', requireRole('admin'), async (c) => {
  try {
    const db = c.var.db;
    const id = c.req.param('id');
    const currentUserId = c.var.userId; // <-- vem do token

    // 🚫 não permitir que o usuário delete a si mesmo
    if (id === currentUserId) {
      return c.json({ error: 'Você não pode excluir a si mesmo.' }, 403);
    }

    const deleted = await db.delete(users).where(eq(users.id, id));
    if (deleted.rowCount === 0) {
      return c.json({ error: 'Usuário não encontrado' }, 404);
    }

    return c.body(null, 204);
  } catch (err) {
    console.error('Erro ao excluir usuário:', err);
    return c.json({ error: 'Falha ao excluir usuário' }, 500);
  }
});
export default usersRouter;
