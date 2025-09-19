import type { Context, Next } from "hono";
import { verifyJwt } from "./jwt";

export function requireAuth() {
  return async (c: Context, next: Next) => {
    const JWT = c.env?.JWT_SECRET ?? process.env.JWT_SECRET;
    if (!JWT) return c.json({ message: "Configuração JWT ausente." }, 500);

    const auth = c.req.header("Authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return c.json({ message: "Não autenticado." }, 401);

    try {
      const payload = verifyJwt(token, JWT);
      c.set("auth", payload); // { sub, email, name, roles?, perms? }
      await next();
    } catch {
      return c.json({ message: "Token inválido ou expirado." }, 401);
    }
  };
}

export function requireRole(...allowed: string[]) {
  return async (c: any, next: Next) => {
    const auth = c.get("auth");
    const roles: string[] = auth?.roles ?? [];
    if (!roles.some(r => allowed.includes(r))) {
      return c.json({ message: "Acesso negado (role)." }, 403);
    }
    await next();
  };
}

export function requirePerm(...perms: string[]) {
  return async (c: any, next: Next) => {
    const auth = c.get("auth");
    const userPerms: string[] = auth?.perms ?? [];
    if (!perms.every(p => userPerms.includes(p))) {
      return c.json({ message: "Acesso negado (permissão)." }, 403);
    }
    await next();
  };
}
