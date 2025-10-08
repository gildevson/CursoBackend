// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, CtxVars } from './lib/types';
import { withDb } from './lib/db';

// Rotas
import { auth } from './routes/auth';
import usersRouter from './routes/users';
import { passwordResetRoutes } from './routes/passwordReset';
import dbping from './routes/dbping';

import clientesListar from "./routes/clientesListar";
import clientesCriar from "./routes/clientesCriar";

const app = new Hono<{ Bindings: Env; Variables: CtxVars }>();

// Middleware de CORS
// Middleware de CORS
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
    exposeHeaders: [
      'Content-Type',
      'Content-Length',
      // 👇 estes aqui são essenciais para a paginação
      'X-Total-Count',
      'X-Total-Pages',
      'X-Current-Page',
    ],
    credentials: true,
    maxAge: 86400,
  })
);


// Injeta db na req
app.use('*', withDb);

// Rotas básicas
app.get('/', (c) => c.text('API rodando 🚀'));
app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }));

// Sub-rotas
app.route('/dbping', dbping);
app.route('/auth', auth);                  // -> /auth/login
app.route('/users', usersRouter);
app.route('/password-reset', passwordResetRoutes); // -> /password-reset/request e /password-reset/confirm
app.route("/clientes", clientesListar);  // GET /clientes/listar
app.route("/clientes", clientesCriar);   // POST /clientes/criar




// 404
app.notFound((c) => c.json({ message: 'Rota não encontrada' }, 404));

export default app;
