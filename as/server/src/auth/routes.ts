import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Pool } from "pg";
import { z } from "zod";
import type { Env } from "../config/env.ts";
import { dummyVerify, hashPassword, verifyPassword } from "../security/password.ts";
import { hashToken, newSessionToken } from "../security/session-token.ts";

export const COOKIE_NAME = "as_session";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  onboardingAckAt: Date | null;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
    sessionId?: string;
  }
}

const registerBody = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(12, "A senha precisa ter ao menos 12 caracteres").max(128),
  displayName: z.string().trim().min(1).max(80).optional(),
});

const loginBody = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});

function cookieOptions(env: Env) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    signed: true,
    maxAge: env.SESSION_TTL_HOURS * 3600,
  };
}

async function audit(pool: Pool, userId: string | null, action: string) {
  await pool.query("INSERT INTO audit_events(user_id, action) VALUES ($1, $2)", [userId, action]);
}

export function makeRequireAuth(pool: Pool) {
  return async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
    const raw = req.cookies[COOKIE_NAME];
    const unsigned = raw ? req.unsignCookie(raw) : null;
    if (!unsigned || !unsigned.valid || !unsigned.value) {
      return reply.code(401).send({ error: "nao_autenticado" });
    }
    const { rows } = await pool.query(
      `SELECT s.id AS session_id, u.id, u.email, u.display_name, u.onboarding_ack_at
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = $1 AND s.revoked_at IS NULL
          AND s.expires_at > now() AND u.deleted_at IS NULL`,
      [hashToken(unsigned.value)],
    );
    const row = rows[0];
    if (!row) return reply.code(401).send({ error: "nao_autenticado" });
    req.user = {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      onboardingAckAt: row.onboarding_ack_at,
    };
    req.sessionId = row.session_id;
  };
}

export async function authRoutes(app: FastifyInstance, opts: { pool: Pool; env: Env }) {
  const { pool, env } = opts;
  const requireAuth = makeRequireAuth(pool);
  const strictLimit = {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "1 minute",
        keyGenerator: (req: FastifyRequest) => {
          const email = (req.body as { email?: unknown } | undefined)?.email;
          return `${req.ip}:${typeof email === "string" ? email.toLowerCase() : ""}`;
        },
      },
    },
  };

  app.post("/auth/register", strictLimit, async (req, reply) => {
    const parsed = registerBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "dados_invalidos", detalhes: parsed.error.issues.map((i) => i.message) });
    }
    const { email, password, displayName } = parsed.data;
    const hash = await hashPassword(password);
    try {
      const { rows } = await pool.query(
        "INSERT INTO users(email, password_hash, display_name) VALUES ($1,$2,$3) RETURNING id",
        [email, hash, displayName ?? null],
      );
      await audit(pool, rows[0].id, "register");
      return reply.code(201).send({ ok: true });
    } catch (e) {
      if ((e as { code?: string }).code === "23505") {
        // Limitacao conhecida: revela que o e-mail existe. Mitigar com verificacao de e-mail.
        return reply.code(409).send({ error: "nao_foi_possivel_concluir_cadastro" });
      }
      throw e;
    }
  });

  app.post("/auth/login", strictLimit, async (req, reply) => {
    const parsed = loginBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "dados_invalidos" });
    const { email, password } = parsed.data;
    const { rows } = await pool.query(
      "SELECT id, password_hash FROM users WHERE email = $1 AND deleted_at IS NULL",
      [email],
    );
    const user = rows[0];
    const ok = user ? await verifyPassword(user.password_hash, password) : (await dummyVerify(password), false);
    if (!ok) return reply.code(401).send({ error: "credenciais_invalidas" });

    const { token, hash } = newSessionToken();
    await pool.query(
      `INSERT INTO sessions(user_id, token_hash, expires_at, user_agent)
       VALUES ($1,$2, now() + make_interval(hours => $3), $4)`,
      [user.id, hash, env.SESSION_TTL_HOURS, (req.headers["user-agent"] ?? "").slice(0, 300)],
    );
    await audit(pool, user.id, "login");
    reply.setCookie(COOKIE_NAME, token, cookieOptions(env));
    return reply.send({ ok: true });
  });

  app.post("/auth/logout", { preHandler: requireAuth }, async (req, reply) => {
    await pool.query("UPDATE sessions SET revoked_at = now() WHERE id = $1", [req.sessionId]);
    await audit(pool, req.user!.id, "logout");
    reply.clearCookie(COOKIE_NAME, { path: "/" });
    return reply.send({ ok: true });
  });

  app.post("/auth/logout-all", { preHandler: requireAuth }, async (req, reply) => {
    await pool.query("UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL", [req.user!.id]);
    await audit(pool, req.user!.id, "logout_all");
    reply.clearCookie(COOKIE_NAME, { path: "/" });
    return reply.send({ ok: true });
  });

  app.get("/auth/me", { preHandler: requireAuth }, async (req) => ({
    id: req.user!.id,
    email: req.user!.email,
    displayName: req.user!.displayName,
    onboardingDone: req.user!.onboardingAckAt !== null,
  }));

  app.post("/auth/onboarding/ack", { preHandler: requireAuth }, async (req, reply) => {
    await pool.query("UPDATE users SET onboarding_ack_at = now() WHERE id = $1", [req.user!.id]);
    return reply.send({ ok: true });
  });
}
