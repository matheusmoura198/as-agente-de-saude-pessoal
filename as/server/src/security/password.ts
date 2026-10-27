import argon2 from "argon2";

const OPTIONS = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, OPTIONS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

// Hash descartavel para igualar o tempo de resposta quando o e-mail nao existe.
let dummy: string | undefined;
export async function dummyVerify(plain: string): Promise<void> {
  dummy ??= await hashPassword("valor-descartavel-nao-e-senha-real");
  await verifyPassword(dummy, plain);
}
