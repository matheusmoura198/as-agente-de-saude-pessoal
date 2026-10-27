import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEnv } from "../src/config/env.ts";

const base = { DATABASE_URL: "postgres://x", COOKIE_SECRET: "a".repeat(32) };

test("env rejeita COOKIE_SECRET curto sem vazar o valor", () => {
  assert.throws(() => loadEnv({ ...base, COOKIE_SECRET: "curto" }), (e: Error) => {
    assert.match(e.message, /COOKIE_SECRET/);
    assert.doesNotMatch(e.message, /curto/);
    return true;
  });
});

test("env exige DATABASE_URL", () => {
  assert.throws(() => loadEnv({ COOKIE_SECRET: "a".repeat(32) }), /DATABASE_URL/);
});

test("env valido aplica padroes e separa origens", () => {
  const env = loadEnv({ ...base, CORS_ORIGINS: "http://a.com, http://b.com" });
  assert.deepEqual(env.corsOrigins, ["http://a.com", "http://b.com"]);
  assert.equal(env.AI_PROVIDER, "none");
});

test("producao com IA ativa exige AI_API_KEY", () => {
  assert.throws(() => loadEnv({ ...base, NODE_ENV: "production", AI_PROVIDER: "anthropic" }), /AI_API_KEY/);
});

