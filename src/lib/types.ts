export interface Env {
  DATABASE_URL: string;
  MIGRATION_URL: string;

  RESEND_API_KEY: string;
  EMAIL_FROM?: string;
  APP_NAME?: string;
  FRONTEND_URL?: string;

  JWT_SECRET: string;
}
