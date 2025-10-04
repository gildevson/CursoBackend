// src/routes/users.ts
import { Hono } from 'hono';
import { requireAuth, requireRole } from '../lib/auth';
import { users } from '../db/tables/users';
import { eq, like, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { Env, CtxVars } from '../lib/types';

export const usersRouter = new Hono<{ Bindings: Env; Variables: CtxVars }>();

// 🔒 todas exigem login
usersRouter.use('*', requireAuth());

/* ======================
   LISTAR (admin) com paginação e filtro seguros
====================== */
usersRouter.get('/', requireRole('admin'), async (c) => {
  try {
    const db = c.var.db;
    const q = (c.req.query('q') ?? '').trim();

    // 🔹 paginação
    const rawPage = parseInt(c.req.query('page') ?? '1', 10);
    const limit = parseInt(c.req.query('limit') ?? '10', 10);

    // 🔹 filtro de busca
    const where = q
      ? sql`${users.name} ILIKE ${'%' + q + '%'} OR ${users.email} ILIKE ${'%' + q + '%'}`
      : undefined;

    // 🔹 total de registros (considerando o filtro)
    const totalResult = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(users)
      .where(where);

    const total = totalResult[0]?.count ?? 0;
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    // 🔹 força página dentro do limite
    const page = Math.min(Math.max(rawPage, 1), totalPages);
    const offset = (page - 1) * limit;

    // 🔹 busca paginada
    let query = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .limit(limit)
      .offset(offset);

    if (where) query = query.where(where);

    const rows = await query;

    // 🔹 headers pro frontend
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


/* ======================
   ATUALIZAR (admin ou próprio usuário)
====================== */
usersRouter.put('/:id', requireAuth(), async (c) => {
  try {
    const db = c.var.db;
    const id = c.req.param('id');
    const currentUserId = c.var.userId;
    const { name, email, password } = await c.req.json<{
      name?: string;
      email?: string;
      password?: string;
    }>();

    // 🚫 só admin ou o próprio usuário pode editar
    const role = c.var.role;
    if (id !== currentUserId && role !== 'admin') {
      return c.json({ error: 'Sem permissão para editar este usuário.' }, 403);
    }

    // prepara os campos a atualizar
    const dataToUpdate: Record<string, any> = {};
    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email.toLowerCase();
    if (password) dataToUpdate.passwordHash = await bcrypt.hash(password, 10);

    if (Object.keys(dataToUpdate).length === 0) {
      return c.json({ error: 'Nenhum campo para atualizar.' }, 400);
    }

    const [updated] = await db
      .update(users)
      .set(dataToUpdate)
      .where(eq(users.id, id))
      .returning({ id: users.id, name: users.name, email: users.email });

    if (!updated) return c.json({ error: 'Usuário não encontrado.' }, 404);

    return c.json(updated);
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    return c.json({ error: 'Falha ao atualizar usuário' }, 500);
  }
});


/* ======================
   OBTER UM USUÁRIO POR ID
====================== */
usersRouter.get('/:id', requireAuth(), async (c) => {
  try {
    const db = c.var.db;
    const id = c.req.param('id');

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return c.json({ error: 'Usuário não encontrado' }, 404);
    }

    return c.json(user);
  } catch (err) {
    console.error('Erro ao buscar usuário por ID:', err);
    return c.json({ error: 'Falha ao buscar usuário' }, 500);
  }
});



export default usersRouter;
