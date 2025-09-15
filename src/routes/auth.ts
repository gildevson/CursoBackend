import { Hono } from "hono";
import { getConnString, getDb } from "../lib/db";
import { signJwt } from "../lib/jwt";

export const auth = new Hono<{
  Bindings: {
    PGHOST: string; PGDATABASE: string; PGUSER: string; PGPASSWORD: string;
    JWT_SECRET: string;
  }
}>();

auth.post("/login", async (c) => {
  const { email, password } = await c.req.json();
  if (!email || !password) return c.json({ error: "Email e senha obrigatórios" }, 400);

  const sql = getDb(getConnString(c.env));
type UserRow = { id: string; name: string; password_hash: string };

const rows = (await sql`
  select id, name, password_hash
  from users
  where email = ${email}
  limit 1
`) as UserRow[];

const user = rows[0];

  if (!user) return c.json({ error: "Credenciais inválidas" }, 401);

  // MVP: comparação direta (trocar por bcrypt depois)
  if (user.password_hash !== password) {
    return c.json({ error: "Credenciais inválidas" }, 401);
  }

  const token = signJwt({ sub: user.id, name: user.name, email }, c.env.JWT_SECRET);
  return c.json({ token });
});
