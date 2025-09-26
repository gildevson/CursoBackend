import dayjs from 'dayjs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { and, desc, eq, gt, isNull, ne, sql } from 'drizzle-orm';
import { users, passwordResetTokens } from '../db';
import { sendResetEmail } from '../lib/mail';
import type { Env } from '../lib/types';

export async function requestReset(db: any, env: Env, email: string) {
  const u = await db.query.users.findFirst({
    where: (t: any, { eq: eq2 }: any) => eq2(sql`lower(${t.email})`, email.toLowerCase()),
    columns: { id: true, email: true },
  });
  if (!u) return;

  const tokenPlain = crypto.randomBytes(32).toString('hex');
  const tokenHash  = await bcrypt.hash(tokenPlain, 10);
  const expiresAt  = dayjs().add(1, 'hour').toDate();

  await db.insert(passwordResetTokens).values({ userId: u.id, tokenHash, expiresAt });

  const base = env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${base}/reset-password?token=${tokenPlain}&uid=${u.id}`;

  // ✅ Passando env
  await sendResetEmail(u.email, resetUrl, env);
}
