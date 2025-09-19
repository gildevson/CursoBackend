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
app.use('*', cors({
  origin: (origin, c) => {
    const envOrigins = (c.env.ALLOWED_ORIGIN ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const allowlist = envOrigins.length ? envOrigins : DEFAULT_ORIGINS;

    // quando credentials = true, não pode "*"
    if (origin && allowlist.includes(origin)) return origin;
    // opcional: bloquear origens não listadas
    return ''; // sem header → browser bloqueia
  },
  allowMethods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowHeaders: ['Content-Type','Authorization'],
  credentials: true,
  maxAge: 86400,
}));

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
