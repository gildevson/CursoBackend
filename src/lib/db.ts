import { neon } from "@neondatabase/serverless";

export function getConnString(env: {
    PGHOST: string; PGDATABASE: string; PGUSER: string; PGPASSWORD: string;
}) {
    const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = env;
    return `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require`;
}

export function getDb(connString: string) {
    return neon(connString);
}
