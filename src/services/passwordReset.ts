import dayjs from 'dayjs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { and, desc, eq, gt, isNull, ne, sql } from 'drizzle-orm';
import { users, passwordResetTokens } from '../db';
import { sendResetEmail } from '../lib/mail';

export async function requestReset(db: any, email: string) {
  const u = await db.query.users.findFirst({
    where: (t: any, { eq: eq2 }: any) => eq2(sql`lower(${t.email})`, email.toLowerCase()),
    columns: { id: true, email: true },
  });
  if (!u) return;

  const tokenPlain = crypto.randomBytes(32).toString('hex');
  const tokenHash  = await bcrypt.hash(tokenPlain, 10);
  const expiresAt  = dayjs().add(1, 'hour').toDate();

  await db.insert(passwordResetTokens).values({ userId: u.id, tokenHash, expiresAt });

  const base = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${base}/reset-password?token=${tokenPlain}&uid=${u.id}`;
  await sendResetEmail(u.email, resetUrl);
}

export async function resetPassword(db: any, uid: string, token: string, newPassword: string) {
  const tokens = await db.query.passwordResetTokens.findMany({
    where: (t: any, { and: and2, isNull: isNull2, gt: gt2 }: any) =>
      and2(eq(t.userId, uid), isNull2(t.usedAt), gt2(t.expiresAt, new Date())),
    orderBy: (t: any, { desc: desc2 }: any) => [desc2(t.createdAt)],
    limit: 5,
    columns: { id: true, tokenHash: true },
  });

  let matched: string | null = null;
  for (const t of tokens) {
    if (await bcrypt.compare(token, t.tokenHash)) { matched = t.id; break; }
  }
  if (!matched) throw new Error('INVALID_OR_EXPIRED_TOKEN');

  const passHash = await bcrypt.hash(newPassword, 10);

  await db.update(users)
    .set({ passwordHash: passHash, passwordChangedAt: new Date() })
    .where(eq(users.id, uid));

  await db.update(passwordResetTokens).set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, matched));

  await db.update(passwordResetTokens).set({ usedAt: new Date() })
    .where(and(eq(passwordResetTokens.userId, uid), ne(passwordResetTokens.id, matched), isNull(passwordResetTokens.usedAt)));
}
