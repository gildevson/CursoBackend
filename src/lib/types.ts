// src/lib/types.ts (exemplo)
export type Env = {
  ALLOWED_ORIGIN: string;
  DATABASE_URL: string;

  // Email/Resend
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  APP_NAME?: string;

  // (se você usa isso em forgot-password)
  FRONTEND_URL?: string;

  // JWT etc.
  JWT_SECRET: string;
};
