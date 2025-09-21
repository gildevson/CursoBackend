// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, CtxVars } from './lib/types';
import { withDb } from './lib/db';
import { passwordResetRoutes } from './routes/passwordReset';


// 👉 Se o seu ./routes/auth já expõe login + forgot + reset:
import { auth } from './routes/auth';

// 👉 Seu router de usuários:
import { usersRouter } from './routes/users';

// Ping ao banco
import dbping from './routes/dbping';

const app = new Hono<{ Bindings: Env; Variables: CtxVars }>();

app.use(
  '*',
  cors({
    origin: (origin) => {
      const allow = new Set([
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
      ]);
      if (!origin) return 'http://localhost:5173'; // fallback dev
      return allow.has(origin) ? origin : ''; // vazio = bloqueia
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders: ['Content-Type', 'Content-Length'],
    credentials: true,
    maxAge: 86400,
  })
);

// injeta db na req
app.use('*', withDb);

// rotas básicas
app.get('/', (c) => c.text('API rodando 🚀'));
app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }));

// sub-rotas
app.route('/dbping', dbping);
app.route('/auth', auth);          // -> /auth/login, /auth/forgot-password, /auth/reset-password
app.route('/users', usersRouter);
app.route('/auth', passwordResetRoutes);  // 👈 agora /auth/forgot-password e /auth/reset-password existem


// 404
app.notFound((c) => c.json({ message: 'Rota não encontrada' }, 404));

export default app;
