// src/lib/auth.ts
import type { MiddlewareHandler } from "hono";
import type { Env, CtxVars } from "../lib/types";
import { verifyJwt } from "./jwt";

export const requireAuth = (): MiddlewareHandler<{ Bindings: Env; Variables: CtxVars }> => {
  return async (c, next) => {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return c.json({ message: "Token não informado" }, 401);
    }

    try {
      const JWT = c.env.JWT_SECRET;
      const decoded = await verifyJwt(token, JWT);

      // exemplo: payload { sub, email, name, roles }
      c.set("auth", decoded);
      await next();
    } catch (err) {
      console.error("Erro ao verificar token:", err);
      return c.json({ message: "Token inválido" }, 401);
    }
  };
};

export const requireRole = (
  role: string
): MiddlewareHandler<{ Bindings: Env; Variables: CtxVars }> => {
  return async (c, next) => {
    const auth = c.get("auth") as { roles?: string[] };
    if (!auth?.roles?.includes(role)) {
      return c.json({ message: "Acesso negado" }, 403);
    }
    await next();
  };
};
