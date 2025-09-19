import { sqliteTable, text } from "drizzle-orm/sqlite-core";
export const roles = sqliteTable("roles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(), // ex.: 'admin', 'gestor', 'usuario'
});
