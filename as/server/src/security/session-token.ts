import { createHash, randomBytes } from "node:crypto";

// Token aleatorio de 256 bits enviado no cookie; no banco fica so o hash SHA-256.
export function newSessionToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
