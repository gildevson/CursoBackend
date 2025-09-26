import type { MiddlewareHandler } from 'hono';
import type { Env } from '../lib/types';
import { makeDb } from '../db/client';


export const withDb: MiddlewareHandler<{ Bindings: Env; Variables: CtxVars }> = async (c, next) => {
  if (!c.var.db) c.set('db', makeDb(c.env));
  await next();
};
