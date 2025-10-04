// src/lib/auth.ts
import type { Context, Next } from "hono";
import type { Env, CtxVars } from "../lib/types";
import { verifyJwt } from "./jwt";

/* ============================================
   🔒 Middleware de autenticação
============================================ */
export const requireAuth = () => {
  return async (c: Context<{ Bindings: Env; Variables: CtxVars }>, next: Next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Token ausente ou inválido" }, 401);
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = await verifyJwt(token, c.env.JWT_SECRET);
      if (!decoded?.sub) {
        return c.json({ error: "Token inválido" }, 401);
      }

      // ✅ Injeta informações no contexto
      c.set("userId", decoded.sub);
      c.set("role", decoded.roles?.[0] || "usuario"); // assume a primeira role
      c.set("roles", decoded.roles || []);

      await next();
    } catch (err) {
      console.error("Erro no requireAuth:", err);
      return c.json({ error: "Token inválido ou expirado" }, 401);
    }
  };
};

/* ============================================
   🛡 Middleware de autorização (por role)
============================================ */
export const requireRole = (rolesPermitidas: string | string[]) => {
  return async (c: Context<{ Bindings: Env; Variables: CtxVars }>, next: Next) => {
    const userRoles = c.get("roles") || [];
    const permitido =
      Array.isArray(rolesPermitidas)
        ? rolesPermitidas.some((r) => userRoles.includes(r))
        : userRoles.includes(rolesPermitidas);

    if (!permitido) {
      return c.json({ error: "Acesso negado" }, 403);
    }

    await next();
  };
};
