import { test } from "node:test";
import assert from "node:assert/strict";
import { hashToken, newSessionToken } from "../src/security/session-token.ts";
import { isOriginAllowed } from "../src/security/origin-check.ts";

test("token de sessao: unico, longo e hash estavel", () => {
  const a = newSessionToken();
  const b = newSessionToken();
  assert.notEqual(a.token, b.token);
  assert.ok(a.token.length >= 43);
  assert.equal(hashToken(a.token), a.hash);
  assert.notEqual(a.hash, a.token);
});

test("origin check: POST sem Origin ou de origem estranha e bloqueado", () => {
  const allowed = ["http://localhost:5173"];
  assert.equal(isOriginAllowed("POST", undefined, allowed), false);
  assert.equal(isOriginAllowed("POST", "http://evil.com", allowed), false);
  assert.equal(isOriginAllowed("POST", "http://localhost:5173", allowed), true);
  assert.equal(isOriginAllowed("GET", undefined, allowed), true);
});
