// roles.ts
import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import {id} from "../tables/users"

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(), // ex.: 'admin', 'gestor', 'usuario'
});
