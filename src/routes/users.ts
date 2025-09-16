import { Hono } from 'hono';
import type { Env, CtxVars } from '../lib/types';
import { requireAuth } from '../lib/auth';

export const usersRouter = new Hono<{ Bindings: Env; Variables: CtxVars }>();

usersRouter.use('*', requireAuth);

usersRouter.get('/me', (c) => {
  return c.json({ me: c.var.auth });
});
