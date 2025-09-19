import { sqliteTable, text } from "drizzle-orm/sqlite-core";
export const rolePerms = sqliteTable("role_perms", {
  roleId: text("role_id").notNull(),
  permId: text("perm_id").notNull(),
});
