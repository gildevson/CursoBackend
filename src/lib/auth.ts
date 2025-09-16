import type { MiddlewareHandler } from 'hono';
import type { Env, CtxVars } from './types';
import { verifyJwt } from './jwt';

export const requireAuth: MiddlewareHandler<{ Bindings: Env; Variables: CtxVars }> = async (c, next) => {
  const auth = c.req.header('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const p = await verifyJwt(token, c.env.JWT_SECRET);
    c.set('auth', { userId: String(p.sub), email: String(p.email), name: p.name ? String(p.name) : undefined });
    await next();
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
};
