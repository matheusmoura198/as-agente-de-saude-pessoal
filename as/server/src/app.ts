import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import type { Pool } from "pg";
import type { Env } from "./config/env.ts";
import { authRoutes } from "./auth/routes.ts";
import { isOriginAllowed } from "./security/origin-check.ts";

export async function buildApp(deps: { env: Env; pool: Pool }) {
  const { env, pool } = deps;
  const app = Fastify({
    bodyLimit: 100 * 1024, // 100 KB
    trustProxy: env.NODE_ENV === "production", // ajuste conforme o proxy real da hospedagem
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      // Nunca registrar cabecalhos de credencial. Corpos de requisicao nao sao logados.
      redact: ["req.headers.cookie", "req.headers.authorization"],
    },
  });

  await app.register(helmet);
  await app.register(cors, { origin: env.corsOrigins, credentials: true });
  await app.register(cookie, { secret: env.COOKIE_SECRET });
  await app.register(rateLimit, { global: true, max: 100, timeWindow: "1 minute" });

  app.addHook("onRequest", async (req, reply) => {
    if (!isOriginAllowed(req.method, req.headers.origin, env.corsOrigins)) {
      return reply.code(403).send({ error: "origem_nao_permitida" });
    }
  });

  app.setErrorHandler((err, req, reply) => {
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    if (status >= 500) req.log.error({ reqId: req.id, name: err.name }, "erro interno");
    reply.code(status).send({ error: status >= 500 ? "erro_interno" : "requisicao_invalida" });
  });

  app.get("/health", async () => ({ status: "ok" }));
  app.get("/ready", async (_req, reply) => {
    try {
      await pool.query("SELECT 1");
      return { status: "ready" };
    } catch {
      return reply.code(503).send({ status: "indisponivel" });
    }
  });

  await app.register(authRoutes, { pool, env });
  return app;
}
