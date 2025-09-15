import { Hono } from "hono";
import { getConnString, getDb } from "../lib/db";

export const courses = new Hono<{
  Bindings: { PGHOST: string; PGDATABASE: string; PGUSER: string; PGPASSWORD: string; }
}>();

courses.get("/", async (c) => {
  const sql = getDb(getConnString(c.env));
  const data = await sql`
    select id, title, description
    from courses
    order by created_at desc
  `;
  return c.json(data);
});
