import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./routes/auth";
import { courses } from "./routes/courses";
import { lessons } from "./routes/lessons";

const app = new Hono<{ Bindings: { ALLOWED_ORIGIN: string } }>();

app.use("*", cors({
  origin: (origin) => origin ?? "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET","POST","OPTIONS"]
}));

app.get("/health", (c) => c.json({ ok: true, ts: Date.now() }));
app.route("/auth", auth);
app.route("/courses", courses);
app.route("/lessons", lessons);

export default {
  fetch: (req: Request, env: any, ctx: ExecutionContext) => app.fetch(req, env, ctx)
};
