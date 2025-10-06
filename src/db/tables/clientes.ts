// db/tables/empresas.ts
import {pgTable, bigserial, varchar, boolean, timestamp, uniqueIndex} from "drizzle-orm/pg-core";

export const clientes = pgTable("clientes", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 20 }),                 // opcional
  emailContato: varchar("email_contato", { length: 255 }),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  // garanta unicidade se usar CNPJ
  uniqCnpj: uniqueIndex("ux_empresas_cnpj").on(t.cnpj),
}));
