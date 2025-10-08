// src/routes/clientesListar.ts
import { Hono } from "hono";
import { requireAuth, requireRole } from "../lib/auth";
import { listaClientes } from "../controllers/listaClientes";
import type { Env, CtxVars } from "../lib/types";

const clientesListas = new Hono<{ Bindings: Env; Variables: CtxVars }>();

clientesListas.use("*", requireAuth());

// 📋 GET /clientes
clientesListas.get("/", requireRole("admin"), async (c) => {
  try {
    const db = c.var.db;
    const q = (c.req.query("q") ?? "").trim();
    const page = parseInt(c.req.query("page") ?? "1", 10);
    const limit = parseInt(c.req.query("limit") ?? "10", 10);

    const { rows, total, totalPages } = await listaClientes(db, q, page, limit);

    // Cabeçalhos de paginação
    c.header("X-Total-Count", String(total));
    c.header("X-Total-Pages", String(totalPages));
    c.header("X-Current-Page", String(page));

    // Retorno JSON compatível com o frontend
    return c.json({
      rows,
      total,
      totalPages,
      page,
    });
  } catch (err: any) {
    console.error("Erro ao listar clientes:", err);
    return c.json({ error: err.message || "Falha ao buscar clientes" }, 500);
  }
});

export default clientesListas;