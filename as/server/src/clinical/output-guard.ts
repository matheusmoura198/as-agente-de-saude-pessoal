// Validacao da SAIDA do modelo. Bloqueia respostas que violem limites clinicos.
// Heuristica por regras: reduz risco, nao o elimina. Revisao clinica necessaria.
import { normalize } from "./normalize.ts";

export interface GuardViolation {
  id: string;
  description: string;
}

interface GuardRule {
  id: string;
  description: string;
  pattern: RegExp;
}

const RULES: GuardRule[] = [
  {
    id: "claims-called-help",
    description: "Afirma ter chamado ajuda ou enviado socorro",
    pattern:
      /\b(chamei|acionei|liguei para|avisei|enviei)\b[a-z ]{0,25}\b(ambulancia|samu|medico|familiar|socorro|emergencia|192)\b/,
  },
  {
    id: "claims-monitoring",
    description: "Afirma monitorar sinais vitais ou o usuario continuamente",
    pattern:
      /\b(estou|vou ficar|continuo) (monitorando|acompanhando) (seus|sua|o seu|a sua) (sinais|pressao|batimentos|frequencia|saude|vitais)/,
  },
  {
    id: "definitive-diagnosis",
    description: "Apresenta diagnostico definitivo",
    pattern:
      /\b(voce (tem|esta com|sofre de)|seu diagnostico (e|eh)|isso (e|eh) com certeza|com certeza (e|eh|voce tem))\b[a-z ]{0,30}\b(diabetes|cancer|depressao|ansiedade|infarto|avc|pneumonia|covid|hipertensao|anemia|tumor|apendicite|infeccao|doenca|transtorno|sindrome)\b/,
  },
  {
    id: "guarantees-harmless",
    description: "Garante que um sintoma e inofensivo",
    pattern:
      /\b(nao e nada|nao eh nada|e (totalmente )?inofensivo|pode ficar tranquil[oa] que nao e grave|com certeza (e|eh) benign)/,
  },
  {
    id: "dose-instruction",
    description: "Instrui inicio, interrupcao ou alteracao de dose",
    pattern:
      /\b(pode|deve|recomendo|sugiro|aconselho)\b[a-z ]{0,20}\b(aumentar|diminuir|dobrar|reduzir|parar de tomar|suspender|interromper|trocar)\b[a-z ]{0,25}\b(dose|remedio|medicamento|medicacao|comprimido)/,
  },
  {
    id: "dose-numeric",
    description: "Prescreve dose numerica especifica",
    pattern:
      /\b(tome|tomar|use|usar)\b[a-z ]{0,20}\b\d+ ?(mg|mcg|g|ml|comprimidos?|gotas)\b/,
  },
  {
    id: "ignore-professional",
    description: "Sugere ignorar orientacao profissional",
    pattern:
      /\b(nao precisa|nao e necessario|dispensa) (de )?(ir (ao|a)|procurar|consultar)[a-z ]{0,15}(medico|hospital|profissional|pronto)/,
  },
];

export interface GuardResult {
  ok: boolean;
  violations: GuardViolation[];
}

export function guardModelOutput(output: string): GuardResult {
  const text = normalize(output);
  const violations = RULES.filter((r) => r.pattern.test(text)).map((r) => ({
    id: r.id,
    description: r.description,
  }));
  return { ok: violations.length === 0, violations };
}

export const SAFE_FALLBACK =
  "Nao consegui preparar uma resposta segura para isso. Para duvidas sobre sintomas, diagnosticos ou medicamentos, o melhor caminho e conversar com um profissional de saude. Se for urgente, ligue para o SAMU no 192.";
