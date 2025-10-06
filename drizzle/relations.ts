import { relations } from "drizzle-orm/relations";
import { users, passwordResetTokens, roles, rolePerms, permissions, userRoles } from "./schema";

export const passwordResetTokensRelations = relations(passwordResetTokens, ({one}) => ({
	user: one(users, {
		fields: [passwordResetTokens.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	passwordResetTokens: many(passwordResetTokens),
	userRoles: many(userRoles),
}));

export const rolePermsRelations = relations(rolePerms, ({one}) => ({
	role: one(roles, {
		fields: [rolePerms.roleId],
		references: [roles.id]
	}),
	permission: one(permissions, {
		fields: [rolePerms.permId],
		references: [permissions.id]
	}),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	rolePerms: many(rolePerms),
	userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({many}) => ({
	rolePerms: many(rolePerms),
}));

export const userRolesRelations = relations(userRoles, ({one}) => ({
	user: one(users, {
		fields: [userRoles.userId],
		references: [users.id]
	}),
	role: one(roles, {
		fields: [userRoles.roleId],
		references: [roles.id]
	}),
}));