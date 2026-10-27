// Triagem DETERMINISTICA de urgencia. Nao depende de modelo generativo.
// ATENCAO: regras e mensagens sao PROPOSTA INICIAL e exigem revisao de
// profissionais de saude qualificados antes de qualquer uso real.
// Politica: em caso de duvida, priorizar sensibilidade (aceita falsos positivos).
import { normalize } from "./normalize.ts";

export type UrgencyCategory =
  | "cardiac"
  | "breathing"
  | "stroke"
  | "consciousness"
  | "allergy"
  | "bleeding"
  | "seizure"
  | "poisoning"
  | "mental_health_crisis";

export interface TriageRule {
  id: string;
  category: UrgencyCategory;
  patterns: RegExp[]; // aplicados ao texto normalizado
}

export const RULES_VERSION = "0.1.0-proposta-sem-revisao-clinica";

export const RULES: TriageRule[] = [
  {
    id: "cardiac-chest-pain",
    category: "cardiac",
    patterns: [
      /dor (forte |intensa |no |em |aperto )?(no )?(peito|torax)/,
      /aperto no peito/,
      /pressao no peito/,
      /dor (que )?(irradia|espalha) (para|pro|pelo) (o )?(braco|mandibula|queixo)/,
      /infarto/,
    ],
  },
  {
    id: "breathing-difficulty",
    category: "breathing",
    patterns: [
      /(muita |extrema |grande )?(falta de ar|dificuldade (para|de|pra) respirar)/,
      /nao (consigo|estou conseguindo) respirar/,
      /sufocando|sufocamento|engasgad[oa] e nao/,
      /labios (roxos|azulados)/,
    ],
  },
  {
    id: "stroke-signs",
    category: "stroke",
    patterns: [
      /rosto (torto|caido|assimetrico)|boca torta/,
      /(fala|falando) (enrolada|arrastada)|nao consigo falar|perdi a fala/,
      /(fraqueza|formigamento|dormencia) (subita |repentina )?(em um|de um) lado/,
      /perda (subita|repentina) (da |de )?(visao|forca)/,
      /\bavc\b|derrame/,
      /pior dor de cabeca da (minha )?vida/,
    ],
  },
  {
    id: "loss-of-consciousness",
    category: "consciousness",
    patterns: [
      /desmai(ei|ou|o|ando)/,
      /perdi (a )?consciencia|perdeu (a )?consciencia|inconsciente/,
      /nao (acorda|responde|reage)/,
      /(desacordad[oa])/,
    ],
  },
  {
    id: "severe-allergy",
    category: "allergy",
    patterns: [
      /anafilax/,
      /garganta (esta |ta )?(fechando|inchando|inchada)/,
      /(lingua|labios|rosto) (inchad[oa]s?|inchando)/,
      /reacao alergica (grave|forte)/,
    ],
  },
  {
    id: "major-bleeding",
    category: "bleeding",
    patterns: [
      /hemorragia/,
      /sangramento (intenso|forte|abundante|que nao (para|estanca))/,
      /sangue (nao para|jorrando)/,
      /vomit(o|ando) (com )?sangue|tossindo sangue/,
    ],
  },
  {
    id: "seizure",
    category: "seizure",
    patterns: [/convuls(ao|oes|ionando)|crise convulsiva/],
  },
  {
    id: "poisoning-overdose",
    category: "poisoning",
    patterns: [
      /overdose/,
      /(tomei|engoli|ingeri|ingeriu|tomou) (muito|demais|varios|todos)[a-z ]{0,30}(remedio|comprimido|medicamento|veneno)/,
      /intoxicacao|envenenad[oa]/,
    ],
  },
  {
    id: "suicide-self-harm",
    category: "mental_health_crisis",
    patterns: [
      /(quero|vou|pensando em|penso em|pensei em) (me )?(matar|suicid|morrer|tirar minha vida|acabar com (a )?minha vida)/,
      /suicidio/,
      /nao quero (mais )?viver/,
      /(quero|vou|penso em|pensando em|tenho vontade de) (me )?(machucar|cortar|ferir)(?! (o |a |os |as )?(cabelo|unha|unhas|barba|franja))/,
      /me (machuco|corto|firo) de proposito/,
    ],
  },
];

export interface TriageResult {
  urgent: boolean;
  matchedRuleIds: string[];
  categories: UrgencyCategory[];
  rulesVersion: string;
}

export function triage(message: string): TriageResult {
  const text = normalize(message);
  const matchedRuleIds: string[] = [];
  const categories = new Set<UrgencyCategory>();
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(text))) {
      matchedRuleIds.push(rule.id);
      categories.add(rule.category);
    }
  }
  return {
    urgent: matchedRuleIds.length > 0,
    matchedRuleIds,
    categories: [...categories],
    rulesVersion: RULES_VERSION,
  };
}
