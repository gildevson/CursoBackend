import { sqliteTable, text } from "drizzle-orm/sqlite-core";
export const userRoles = sqliteTable("user_roles", {
  userId: text("user_id").notNull(),
  roleId: text("role_id").notNull(),
});