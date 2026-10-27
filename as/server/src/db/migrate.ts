import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "../config/env.ts";
import { createPool } from "./pool.ts";

const dir = join(dirname(fileURLToPath(import.meta.url)), "../../migrations");
const env = loadEnv();
const pool = createPool(env.DATABASE_URL);

try {
  await pool.query("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  const done = new Set((await pool.query("SELECT name FROM schema_migrations")).rows.map((r) => r.name as string));
  for (const file of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()) {
    if (done.has(file)) continue;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(await readFile(join(dir, file), "utf8"));
      await client.query("INSERT INTO schema_migrations(name) VALUES ($1) ON CONFLICT DO NOTHING", [file]);
      await client.query("COMMIT");
      console.log("aplicada:", file);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
  console.log("migracoes concluidas");
} finally {
  await pool.end();
}
