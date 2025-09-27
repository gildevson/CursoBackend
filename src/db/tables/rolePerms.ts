// rolePerms.ts
import { pgTable, uuid } from "drizzle-orm/pg-core";
import { roles } from "./roles";
import { permissions } from "./permissions";

export const rolePerms = pgTable("role_perms", {
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permId: uuid("perm_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
});
