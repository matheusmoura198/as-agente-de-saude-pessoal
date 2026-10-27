import { loadEnv } from "./config/env.ts";
import { createPool } from "./db/pool.ts";
import { buildApp } from "./app.ts";

const env = loadEnv();
const pool = createPool(env.DATABASE_URL);
const app = await buildApp({ env, pool });

const close = async () => {
  await app.close();
  await pool.end();
  process.exit(0);
};
process.on("SIGINT", close);
process.on("SIGTERM", close);

await app.listen({ port: env.PORT, host: env.HOST });
