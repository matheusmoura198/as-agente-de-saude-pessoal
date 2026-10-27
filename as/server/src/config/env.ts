import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default("127.0.0.1"),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  COOKIE_SECRET: z.string().min(32, "COOKIE_SECRET precisa ter ao menos 32 caracteres"),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(24 * 90).default(168),
  AI_PROVIDER: z.enum(["none", "anthropic"]).default("none"),
  AI_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof schema> & { corsOrigins: string[] };

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    // Mostra so os nomes dos campos invalidos, nunca os valores.
    const fields = parsed.error.issues.map((i) => i.path.join(".") + ": " + i.message);
    throw new Error("Configuracao invalida:\n- " + fields.join("\n- "));
  }
  const env = parsed.data;
  if (env.NODE_ENV === "production" && env.AI_PROVIDER !== "none" && !env.AI_API_KEY) {
    throw new Error("Configuracao invalida: AI_API_KEY ausente com AI_PROVIDER ativo");
  }
  return {
    ...env,
    corsOrigins: env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
  };
}
