import { clientes } from "../db/tables/clientes";
import { sql } from "drizzle-orm";

export async function listarClientes(db: any, q: string, page: number, limit: number) {
  const where = q
    ? sql`${clientes.nome} ILIKE ${'%' + q + '%'} OR ${clientes.cnpjCpf} ILIKE ${'%' + q + '%'}`
    : undefined;

  const totalResult = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(clientes)
    .where(where);

  const total = totalResult[0]?.count ?? 0;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const offset = (page - 1) * limit;

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
  return { rows, total, totalPages, page };
}
