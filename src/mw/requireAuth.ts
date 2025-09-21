import { jwtVerify } from 'jose';
import type { Context, Next } from 'hono';
import { users } from '../db';
import { eq } from 'drizzle-orm';

export function requireAuth() {
  return async (c: Context, next: Next) => {
    const auth = c.req.header('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
      const userId = String(payload.sub);

      // 👇 pega o db do contexto (withDb precisa estar registrado antes)
      const db = c.get('db');

      // invalida sessões emitidas antes de passwordChangedAt
      const row = await db.query.users.findFirst({
        where: (t, { eq }) => eq(t.id, userId),
        columns: { passwordChangedAt: true },
      });

      const iatMs = payload.iat ? Number(payload.iat) * 1000 : 0;
      if (row?.passwordChangedAt && iatMs < row.passwordChangedAt.getTime()) {
        return c.json({ error: 'Sessão expirada. Faça login novamente.' }, 401);
      }

      c.set('auth', { userId, iat: payload.iat });
      await next();
    } catch {
      return c.json({ error: 'Unauthorized' }, 401);
    }
  };
}
