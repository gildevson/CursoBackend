import { Hono } from 'hono';
import { requestReset, resetPassword } from '../services/passwordReset';
import type { Env } from '../lib/types';

export const passwordResetRoutes = new Hono<{ Bindings: Env }>();

// 1. Solicitar reset de senha
passwordResetRoutes.post('/request', async (c) => {
  try {
    const { email } = await c.req.json<{ email: string }>();
    if (!email) return c.json({ error: 'E-mail é obrigatório' }, 400);

    const db = c.get('db');
    await requestReset(db, c.env, email);

    return c.json({ message: 'Se o e-mail existir, enviaremos instruções.' });
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erro ao solicitar reset de senha' }, 500);
  }
});
