import { pgTable, foreignKey, uuid, text, timestamp, unique, boolean, uniqueIndex, varchar, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	tokenHash: text("token_hash").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	usedAt: timestamp("used_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "password_reset_tokens_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	passwordChangedAt: timestamp("password_changed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const clientes = pgTable("clientes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nome: varchar({ length: 255 }).notNull(),
	cnpj: varchar({ length: 20 }),
	emailContato: varchar("email_contato", { length: 255 }),
	ruaEndereco: varchar("rua_endereco", { length: 255 }),
	numeroEndereco: varchar("numero_endereco", { length: 20 }),
	complementoEndereco: varchar("complemento_endereco", { length: 100 }),
	bairroEndereco: varchar("bairro_endereco", { length: 100 }),
	cidadeEndereco: varchar("cidade_endereco", { length: 100 }),
	estadoEndereco: varchar("estado_endereco", { length: 100 }),
	cepEndereco: varchar("cep_endereco", { length: 20 }),
	telefone: varchar({ length: 20 }),
	ativo: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("ux_clientes_cnpjcpf").using("btree", table.cnpj.asc().nullsLast().op("text_ops")),
]);

export const roles = pgTable("roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
}, (table) => [
	unique("roles_name_unique").on(table.name),
]);

export const rolePerms = pgTable("role_perms", {
	roleId: uuid("role_id").notNull(),
	permId: uuid("perm_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "role_perms_role_id_roles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.permId],
			foreignColumns: [permissions.id],
			name: "role_perms_perm_id_permissions_id_fk"
		}).onDelete("cascade"),
]);

export const permissions = pgTable("permissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: text().notNull(),
}, (table) => [
	unique("permissions_code_unique").on(table.code),
]);

export const userRoles = pgTable("user_roles", {
	userId: uuid("user_id").notNull(),
	roleId: uuid("role_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_roles_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "user_roles_role_id_roles_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.userId, table.roleId], name: "user_roles_user_id_role_id_pk"}),
]);
