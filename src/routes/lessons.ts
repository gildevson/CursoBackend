import { Hono } from "hono";
import { getConnString, getDb } from "../lib/db";

export const lessons = new Hono<{
  Bindings: { PGHOST: string; PGDATABASE: string; PGUSER: string; PGPASSWORD: string; }
}>();

lessons.get("/:courseId", async (c) => {
  const { courseId } = c.req.param();
  const sql = getDb(getConnString(c.env));
  const data = await sql`
    select id, title, video_url, position
    from lessons
    where course_id = ${courseId}
    order by position asc
  `;
  return c.json(data);
});
