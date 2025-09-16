import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, CtxVars } from './lib/types';
import { withDb } from './lib/db';
import { auth } from './routes/auth';
import { usersRouter } from './routes/users';
import dbping from './routes/dbping'; // <-- novo

const app = new Hono<{ Bindings: Env; Variables: CtxVars }>();

// CORS (uma vez só)
// CORS (uma vez só)
app.use('*', cors({
  // (origin, c) => ...
  origin: (_origin, c) => c.env.ALLOWED_ORIGIN ?? '*',
  allowMethods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));


// Injeta DB no contexto
app.use('*', withDb);

// Rotas simples
app.get('/', (c) => c.text('API rodando 🚀'));
app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }));

// Monta sub-apps
app.route('/dbping', dbping);   // <-- agora /dbping existe
app.route('/auth', auth);
app.route('/users', usersRouter);

export default app;
