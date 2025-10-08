import { clientes } from "../db/tables/clientes";
import { and, or, sql } from "drizzle-orm";

export async function listarClientes(
  db: any,
  q: string = "",
  page: number = 1,
  limit: number = 10
) {
  // 🔹 Monta o filtro de busca (case-insensitive)
  const where =
    q && q.trim() !== ""
      ? or(
          sql`${clientes.nome} ILIKE ${"%" + q + "%"}`,
          sql`${clientes.cnpjCpf} ILIKE ${"%" + q + "%"}`
        )
      : undefined;

  // 🔹 Conta o total de registros
  const totalResult = where
    ? await db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(clientes)
        .where(where)
    : await db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(clientes);

  const total = totalResult[0]?.count ?? 0;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const offset = (page - 1) * limit;

  // 🔹 Consulta paginada
  let query = db
    .select({
      id: clientes.id,
      nome: clientes.nome,
      cnpjCpf: clientes.cnpjCpf,
      emailContato: clientes.emailContato,
      telefone: clientes.telefone,
      cidadeEndereco: clientes.cidadeEndereco,
      ativo: clientes.ativo,
      createdAt: clientes.createdAt,
    })
    .from(clientes)
    .limit(limit)
    .offset(offset);

  if (where) query = query.where(where);

  const rows = await query;

  // 🔹 Retorno estruturado
  return {
    rows,
    total,
    totalPages,
    page,
  };
}
