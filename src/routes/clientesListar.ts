// src/routes/clientesListar.ts
import { Hono } from "hono";
import { requireAuth, requireRole } from "../lib/auth";
import { listarClientes } from "../controllers/listarClientes";
import type { Env, CtxVars } from "../lib/types";

const clientesListar = new Hono<{ Bindings: Env; Variables: CtxVars }>();

clientesListar.use("*", requireAuth());

// 📋 GET /clientes/listar
clientesListar.get("/clientes", requireRole("admin"), async (c) => {
  try {
    const db = c.var.db;
    const q = (c.req.query("q") ?? "").trim();
    const page = parseInt(c.req.query("page") ?? "1", 10);
    const limit = parseInt(c.req.query("limit") ?? "10", 10);

    const { rows, total, totalPages } = await listarClientes(db, q, page, limit);

    c.header("X-Total-Count", String(total));
    c.header("X-Total-Pages", String(totalPages));
    c.header("X-Current-Page", String(page));

    return c.json(rows);
  } catch (err: any) {
    console.error("Erro ao listar clientes:", err);
    return c.json({ error: err.message || "Falha ao buscar clientes" }, 500);
  }
});

export default clientesListar;
