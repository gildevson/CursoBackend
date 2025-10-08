// src/routes/clientesCriar.ts
import { Hono } from "hono";
import { requireAuth, requireRole } from "../lib/auth";
import { criarCliente } from "../controllers/criarCliente";
import type { Env, CtxVars } from "../lib/types";

const clientesCriar = new Hono<{ Bindings: Env; Variables: CtxVars }>();

clientesCriar.use("*", requireAuth());

// ➕ POST /clientes/criar
clientesCriar.post("/criar", requireRole("admin"), async (c) => {
  try {
    const db = c.var.db;
    const body = await c.req.json();
    const created = await criarCliente(db, body);
    return c.json(created, 201);
  } catch (err: any) {
    console.error("Erro ao criar cliente:", err);
    return c.json({ error: err.message || "Falha ao criar cliente" }, 500);
  }
});

export default clientesCriar;
