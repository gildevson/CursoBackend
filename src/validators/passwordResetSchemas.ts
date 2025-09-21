// src/validators/passwordResetSchemas.ts
import { z } from 'zod';

/**
 * POST /auth/forgot-password
 * body: { email }
 */
export const forgotSchema = z.object({
  email: z.string().email(),
});

/**
 * POST /auth/reset-password
 * body: { uid, token, newPassword }
 *  -> Se você decidir NÃO usar uid na URL/corpo, veja a variante sem uid abaixo.
 */
export const resetSchema = z.object({
  uid: z.string().uuid(),
  token: z.string().min(32, 'Token inválido'),
  newPassword: z
    .string()
    .min(8, 'A senha deve ter ao menos 8 caracteres')
    .max(128),
});

/**
 * (Opcional) POST /auth/change-password
 * body: { currentPassword, newPassword }
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: z.string().min(8).max(128),
});

// Tipos úteis (opcional)
export type ForgotInput = z.infer<typeof forgotSchema>;
export type ResetInput  = z.infer<typeof resetSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
