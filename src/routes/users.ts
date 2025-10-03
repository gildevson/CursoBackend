// src/routes/users.ts
import { Hono } from 'hono';
import { requireAuth, requireRole } from '../lib/auth';
import { users } from '../db/tables/users';
import { eq, like, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { Env, CtxVars } from '../lib/types';

export const usersRouter = new Hono<{ Bindings: Env; Variables: CtxVars }>();

// 🔒 todas exigem login
usersRouter.use('*', requireAuth());/*/* ======================
   LISTAR (admin) com paginação segura
====================== */
usersRouter.get('/', requireRole('admin'), async (c) => {
  try {
    const db = c.var.db;
    const q = (c.req.query('q') ?? '').trim();

    // paginação segura
    const rawPage = parseInt(c.req.query('page') ?? '1', 10);
    const limit = parseInt(c.req.query('limit') ?? '12', 10);

    // total de registros
    const totalResult = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(users);

    const total = totalResult[0]?.count ?? 0;
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    // força o page a ficar dentro do intervalo [1, totalPages]
    const page = Math.min(Math.max(rawPage, 1), totalPages);
    const offset = (page - 1) * limit;

    // consulta paginada
    let query = db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .limit(limit)
      .offset(offset);

    if (q) {
      query = query.where(
        sql`${users.name} ILIKE ${'%' + q + '%'} OR ${users.email} ILIKE ${'%' + q + '%'}`
      );
    }

    const rows = await query;

    // header para o frontend
    c.header('X-Total-Count', String(total));
    c.header('X-Total-Pages', String(totalPages));
    c.header('X-Current-Page', String(page));

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
