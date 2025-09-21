import { Hono } from 'hono';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import type { Env, CtxVars } from '../lib/types';

import { users } from '../db';
import { requireAuth } from '../mw/requireAuth';
import { requestReset, resetPassword } from '../services/passwordReset';

export const passwordResetRoutes =
  new Hono<{ Bindings: Env; Variables: CtxVars }>();

// público
passwordResetRoutes.post('/forgot-password', async (c) => {
  const db = c.var.db;
  const body = await c.req.json();
  const parsed = z.object({ email: z.string().email() }).safeParse(body);
  if (!parsed.success) return c.json({ error: 'Dados inválidos' }, 400);

  try { await requestReset(db, parsed.data.email); } catch (e) { console.error('forgot error', e); }
  return c.json({ ok: true, message: 'Se existir uma conta para este e-mail, enviaremos instruções.' });
});

// público
passwordResetRoutes.post('/reset-password', async (c) => {
  const db = c.var.db;
  const body = await c.req.json();
  const parsed = z.object({
    uid: z.string().uuid(),
    token: z.string().min(32),
    newPassword: z.string().min(8).max(128),
  }).safeParse(body);
  if (!parsed.success) return c.json({ error: 'Dados inválidos' }, 400);

  try {
    await resetPassword(db, parsed.data.uid, parsed.data.token, parsed.data.newPassword);
    return c.json({ ok: true, message: 'Senha alterada com sucesso.' });
  } catch (e: any) {
    if (e?.message === 'INVALID_OR_EXPIRED_TOKEN') return c.json({ error: 'Token inválido ou expirado' }, 400);
    console.error('reset error', e);
    return c.json({ error: 'Erro ao redefinir' }, 500);
  }
});

// opcional: trocar logado
passwordResetRoutes.post('/change-password', requireAuth(), async (c) => {
  const db = c.var.db;
  const body = await c.req.json();
  const parsed = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
  }).safeParse(body);
  if (!parsed.success) return c.json({ error: 'Dados inválidos' }, 400);

  const { currentPassword, newPassword } = parsed.data;
  const { userId } = c.get('auth') as { userId: string };

  const row = await db.query.users.findFirst({
    where: (t: typeof users, { eq: eq2 }: any) => eq2(t.id, userId),
    columns: { passwordHash: true },
  });
  if (!row) return c.json({ error: 'Usuário não encontrado' }, 404);

  if (!(await bcrypt.compare(currentPassword, row.passwordHash)))
    return c.json({ error: 'Senha atual incorreta' }, 400);

  if (await bcrypt.compare(newPassword, row.passwordHash))
    return c.json({ error: 'A nova senha não pode ser igual à atual' }, 400);

  const newHash = await bcrypt.hash(newPassword, 10);
  await db.update(users)
    .set({ passwordHash: newHash, passwordChangedAt: new Date() })
    .where(eq(users.id, userId));

  return c.json({ ok: true, message: 'Senha alterada com sucesso.' });
});
