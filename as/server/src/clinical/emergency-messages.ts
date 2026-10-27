// Mensagens FIXAS de encaminhamento (nao geradas por modelo).
// PROPOSTA: exige revisao clinica. A AS nunca afirma ter acionado ajuda.
import type { UrgencyCategory } from "./triage.ts";

const SAMU =
  "Se isso esta acontecendo agora, ligue para o SAMU no 192 ou va ao pronto-atendimento mais proximo imediatamente. Se houver alguem por perto, peca ajuda.";

const MENTAL =
  "Sinto muito que voce esteja passando por isso. Voce nao precisa enfrentar isso sozinho(a). Se houver risco imediato para sua vida, ligue agora para o SAMU no 192. Voce tambem pode ligar para o CVV no 188 (24 horas, gratuito) e procurar uma pessoa de confianca para ficar com voce.";

const OPENING =
  "O que voce descreveu pode ser uma situacao que precisa de atendimento imediato.";

const FOOTER =
  "Eu nao consigo chamar ajuda por voce nem avaliar a gravidade por aqui. Por isso, nao vou continuar a conversa comum agora.";

export function emergencyMessage(categories: UrgencyCategory[]): string {
  if (categories.includes("mental_health_crisis")) {
    return `${MENTAL}\n\n${FOOTER}`;
  }
  return `${OPENING}\n\n${SAMU}\n\n${FOOTER}`;
}
