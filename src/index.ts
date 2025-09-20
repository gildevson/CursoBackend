import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, CtxVars } from './lib/types';
import { withDb } from './lib/db';
import { auth } from './routes/auth';
import { usersRouter } from './routes/users';
import dbping from './routes/dbping';

const app = new Hono<{ Bindings: Env; Variables: CtxVars }>();

// Allowlist de origens (ajuste conforme seu ambiente)
const DEFAULT_ORIGINS = ['http://localhost:3000', 'http://localhost:5173'];

// CORS
app.use(
  '*',
  cors({
    origin: 'http://localhost:5174', // ⛳ ou '*', mas cuidado em produção
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // se estiver usando cookies
  })
);
// injeta DB no contexto (precisa fazer c.set('db', db) lá dentro)
app.use('*', withDb);

// rotas básicas
app.get('/', (c) => c.text('API rodando 🚀'));
app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }));

// sub-apps
app.route('/dbping', dbping);
app.route('/auth', auth);
app.route('/users', usersRouter);

// 404 padrão
app.notFound((c) => c.json({ message: 'Rota não encontrada' }, 404));

export default app;
