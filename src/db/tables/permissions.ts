import { sqliteTable, text } from "drizzle-orm/sqlite-core";
export const permissions = sqliteTable("permissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(), // ex.: 'users:read', 'users:create'
});