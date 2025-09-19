import { Hono } from "hono";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { users } from "../db/tables/users";
import { roles } from "../db/tables/roles";
import { userRoles } from "../db/tables/userRoles";
import { signJwt } from "../lib/jwt";
import type { Env, CtxVars } from "../lib/types";

export const auth = new Hono<{ Bindings: Env; Variables: CtxVars }>();

auth.post("/register", async (c) => {
  try {
    const db = c.var.db;
    const body = await c.req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!name || !email || !password) {
      return c.json({ message: "Dados inválidos. Informe nome, e-mail e senha." }, 400);
    }

    const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (exists) return c.json({ message: "E-mail já cadastrado." }, 409);

    const hash = await bcrypt.hash(password, 10);
    await db.insert(users).values({ name, email, passwordHash: hash });

    // buscar criado
    const [created] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!created) return c.json({ message: "Falha ao persistir cadastro." }, 500);

    // atribui role padrão "usuario" (crie na seed)
    const [roleUser] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, "usuario")).limit(1);
    if (roleUser) await db.insert(userRoles).values({ userId: created.id, roleId: roleUser.id });

    // gera token (se houver segredo)
    const JWT = c.env?.JWT_SECRET ?? process.env.JWT_SECRET;
    let token: string | null = null;
    if (JWT) token = await signJwt({ sub: created.id, email: created.email, name: created.name, roles: ["usuario"] }, JWT);

    c.header("Location", `/users/${created.id}`);
    return c.json({ message: "Cadastro realizado com sucesso.", user: created, token }, 201);
  } catch (err: any) {
    const msg = String(err?.message ?? "").toLowerCase();
    if (msg.includes("unique") || msg.includes("constraint")) {
      return c.json({ message: "E-mail já cadastrado." }, 409);
    }
    console.error("register error:", err);
    return c.json({ message: "Erro interno ao cadastrar." }, 500);
  }
});

auth.post("/login", async (c) => {
  try {
    const db = c.var.db;
    const body = await c.req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    const [row] = await db
      .select({ id: users.id, name: users.name, email: users.email, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email)).limit(1);
    if (!row) return c.json({ message: "Credenciais inválidas." }, 401);

    const ok = await bcrypt.compare(password, row.passwordHash);
    if (!ok) return c.json({ message: "Credenciais inválidas." }, 401);

    // carrega roles do usuário (simplificado)
    const rolesArr = ["usuario"]; // você pode ler de userRoles

    const JWT = c.env?.JWT_SECRET ?? process.env.JWT_SECRET;
    const token = JWT
      ? await signJwt({ sub: row.id, email: row.email, name: row.name, roles: rolesArr }, JWT)
      : null;

    return c.json({ message: "Login realizado com sucesso.", user: { id: row.id, name: row.name, email: row.email }, token });
  } catch (err) {
    console.error("login error:", err);
    return c.json({ message: "Erro interno ao autenticar." }, 500);
  }
});
