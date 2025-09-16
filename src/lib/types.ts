export type Env = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  ALLOWED_ORIGIN?: string;
};

export type CtxVars = {
  db: any; // drizzle instance (pode tipar fino depois)
  auth?: { userId: string; email: string; name?: string };
};
