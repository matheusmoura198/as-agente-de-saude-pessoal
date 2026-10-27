// Ordem obrigatoria: triagem de entrada -> (modelo) -> guarda de saida.
// A triagem acontece ANTES de qualquer chamada ao modelo.
import { triage, type TriageResult } from "./triage.ts";
import { emergencyMessage } from "./emergency-messages.ts";
import { guardModelOutput, SAFE_FALLBACK, type GuardViolation } from "./output-guard.ts";

export type PreModelDecision =
  | { action: "emergency"; message: string; triage: TriageResult }
  | { action: "proceed" };

export function preModelCheck(userMessage: string): PreModelDecision {
  const t = triage(userMessage);
  if (t.urgent) {
    return { action: "emergency", message: emergencyMessage(t.categories), triage: t };
  }
  return { action: "proceed" };
}

export interface PostModelDecision {
  text: string;
  blocked: boolean;
  violations: GuardViolation[];
}

export function postModelCheck(modelOutput: string): PostModelDecision {
  const g = guardModelOutput(modelOutput);
  if (g.ok) return { text: modelOutput, blocked: false, violations: [] };
  return { text: SAFE_FALLBACK, blocked: true, violations: g.violations };
}
