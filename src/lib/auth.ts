import { verifyJwt } from './jwt';
import { HonoRequest, MiddlewareHandler } from 'hono';

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return c.json({ message: 'Token não informado' }, 401);
  }

  try {
    const JWT = c.env?.JWT_SECRET ?? process.env.JWT_SECRET;
    const decoded = await verifyJwt(token, JWT);
    c.set('user', decoded); // você pode acessar com c.get('user')
    await next();
  } catch (err) {
    console.error('Erro ao verificar token:', err);
    return c.json({ message: 'Token inválido' }, 401);
  }
};

export const requireRole = (role: string): MiddlewareHandler => {
  return async (c, next) => {
    const user = c.get('user');
    if (!user?.roles?.includes(role)) {
      return c.json({ message: 'Acesso negado' }, 403);
    }
    await next();
  };
};
