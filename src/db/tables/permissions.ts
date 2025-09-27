// permissions.ts
import { pgTable, uuid, text } from "drizzle-orm/pg-core";

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(), // ex.: 'users:read', 'users:create'
});
