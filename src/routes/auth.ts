import { Hono } from "hono";
import { eq, and, desc, gt, isNull, ne, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dayjs from "dayjs";
import { z } from "zod";

import { users } from "../db/tables/users";
import { roles } from "../db/tables/roles";
import { userRoles } from "../db/tables/userRoles";
import { passwordResetTokens } from "../db/tables/passwordResetTokens";
import { sendResetEmail } from "../lib/mail";
import { signJwt } from "../lib/jwt";
import type { Env, CtxVars } from "../lib/types";
import { requireAuth } from "../mw/requireAuth";

export const auth = new Hono<{ Bindings: Env; Variables: CtxVars }>();

/* ====================== */
/*     REGISTRO / LOGIN   */
/* ====================== */

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

    const [created] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!created) return c.json({ message: "Falha ao persistir cadastro." }, 500);

    const [roleUser] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, "usuario")).limit(1);
    if (roleUser) await db.insert(userRoles).values({ userId: created.id, roleId: roleUser.id });

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
    
    const rolesArr = ["usuario"]; // TODO: carregar de userRoles

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

/* ====================== */
/*  ESQUECI / REDEFINIR   */
/* ====================== */

/** POST /auth/forgot-password  { email } */
auth.post("/forgot-password", async (c) => {
  const db = c.var.db;
  const body = await c.req.json();
  const parsed = z.object({ email: z.string().email() }).safeParse(body);
  if (!parsed.success) return c.json({ error: "Dados inválidos" }, 400);
  const email = parsed.data.email.toLowerCase();

  const [u] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(sql`lower(${users.email})`, email))
    .limit(1);

  if (u) {
    const tokenPlain = crypto.randomBytes(32).toString("hex");
    const tokenHash  = await bcrypt.hash(tokenPlain, 10);
    const expiresAt  = dayjs().add(1, "hour").toDate();

    await db.insert(passwordResetTokens).values({
      userId: u.id,
      tokenHash,
      expiresAt,
    });

    const base = c.env?.FRONTEND_URL ?? process.env.FRONTEND_URL ?? "http://localhost:5173";
    const resetUrl = `${base}/reset-password?token=${tokenPlain}&uid=${u.id}`;

    try { 
      // ✅ Passando o c.env
      await sendResetEmail(u.email, resetUrl, c.env); 
    } catch (e) { 
      console.error("email error", e); 
    }
  }

  return c.json({ ok: true, message: "Se existir uma conta para este e-mail, enviaremos instruções." });
});

/** POST /auth/reset-password  { uid, token, newPassword } */
auth.post("/reset-password", async (c) => {
  const db = c.var.db;
  const body = await c.req.json();
  const parsed = z.object({
    uid: z.string().uuid(),
    token: z.string().min(32),
    newPassword: z.string().min(8).max(128),
  }).safeParse(body);
  if (!parsed.success) return c.json({ error: "Dados inválidos" }, 400);

  const { uid, token, newPassword } = parsed.data;

  const validTokens = await db
    .select({ id: passwordResetTokens.id, tokenHash: passwordResetTokens.tokenHash })
    .from(passwordResetTokens)
    .where(and(
      eq(passwordResetTokens.userId, uid),
      isNull(passwordResetTokens.usedAt),
      gt(passwordResetTokens.expiresAt, new Date())
    ))
    .orderBy(desc(passwordResetTokens.createdAt))
    .limit(5);

  let matched: string | null = null;
  for (const t of validTokens) {
    if (await bcrypt.compare(token, t.tokenHash)) { matched = t.id; break; }
  }
  if (!matched) return c.json({ error: "Token inválido ou expirado" }, 400);

  const passHash = await bcrypt.hash(newPassword, 10);
  await db.update(users)
    .set({ passwordHash: passHash, passwordChangedAt: new Date() })
    .where(eq(users.id, uid));

  await db.update(passwordResetTokens).set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, matched));
  await db.update(passwordResetTokens).set({ usedAt: new Date() })
    .where(and(
      eq(passwordResetTokens.userId, uid),
      ne(passwordResetTokens.id, matched),
      isNull(passwordResetTokens.usedAt)
    ));

  return c.json({ ok: true, message: "Senha alterada com sucesso." });
});

/* ====================== */
/*  TROCAR LOGADO (OPC)   */
/* ====================== */

auth.post("/change-password", requireAuth(), async (c) => {
  const db = c.var.db;
  const body = await c.req.json();
  const parsed = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
  }).safeParse(body);
  if (!parsed.success) return c.json({ error: "Dados inválidos" }, 400);

  const { currentPassword, newPassword } = parsed.data;
  const { userId } = c.get("auth") as { userId: string };

  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) return c.json({ error: "Usuário não encontrado" }, 404);

  const ok = await bcrypt.compare(currentPassword, row.passwordHash);
  if (!ok) return c.json({ error: "Senha atual incorreta" }, 400);

  const same = await bcrypt.compare(newPassword, row.passwordHash);
  if (same) return c.json({ error: "A nova senha não pode ser igual à atual" }, 400);

  const newHash = await bcrypt.hash(newPassword, 10);
  await db.update(users)
    .set({ passwordHash: newHash, passwordChangedAt: new Date() })
    .where(eq(users.id, userId));

  return c.json({ ok: true, message: "Senha alterada com sucesso." });
});
