import { test } from "node:test";
import assert from "node:assert/strict";
import { triage } from "../src/clinical/triage.ts";
import { preModelCheck, postModelCheck } from "../src/clinical/pipeline.ts";
import { guardModelOutput } from "../src/clinical/output-guard.ts";
import { emergencyMessage } from "../src/clinical/emergency-messages.ts";

const URGENT = [
  "Estou com uma dor forte no peito",
  "DOR NO PEITO e suor frio",
  "to com aperto no peito desde cedo",
  "não consigo respirar direito",
  "muita falta de ar de repente",
  "meu pai desmaiou agora",
  "ela perdeu a consciência",
  "minha boca está torta e a fala enrolada",
  "acho que é um AVC",
  "fraqueza súbita em um lado do corpo",
  "minha garganta está fechando depois de comer camarão",
  "sangramento que não para",
  "ele está tendo uma convulsão",
  "tomei muitos comprimidos de remédio",
  "quero me matar",
  "não quero mais viver",
  "estou pensando em me machucar",
];

const NOT_URGENT = [
  "Hoje estou muito cansado",
  "Tenho uma dor de cabeça leve",
  "Quero lembrar de beber água",
  "Dormi mal nas últimas três noites",
  "Como organizar minhas consultas?",
  "Vou me cortar o cabelo amanhã",
  "Quero marcar um exame de rotina",
];

for (const msg of URGENT) {
  test(`triagem detecta urgencia: ${msg}`, () => {
    assert.equal(triage(msg).urgent, true);
  });
}

for (const msg of NOT_URGENT) {
  test(`triagem nao dispara em: ${msg}`, () => {
    assert.equal(triage(msg).urgent, false);
  });
}

test("emergencia interrompe o fluxo antes do modelo", () => {
  const d = preModelCheck("estou com dor forte no peito");
  assert.equal(d.action, "emergency");
  if (d.action === "emergency") {
    assert.match(d.message, /192/);
    assert.doesNotMatch(d.message, /\b(chamei|acionei|enviei)\b/i);
  }
});

test("crise de saude mental inclui CVV 188 e SAMU 192", () => {
  const m = emergencyMessage(["mental_health_crisis"]);
  assert.match(m, /188/);
  assert.match(m, /192/);
});

test("mensagem comum segue para o modelo", () => {
  assert.equal(preModelCheck("como melhorar meu sono?").action, "proceed");
});

const UNSAFE_OUTPUTS = [
  "Já chamei uma ambulância para você.",
  "Eu acionei o SAMU e avisei seu familiar.",
  "Estou monitorando seus sinais vitais o dia todo.",
  "Você tem diabetes, com certeza.",
  "Pode aumentar a dose do seu remédio sem problemas.",
  "Recomendo parar de tomar o medicamento.",
  "Tome 500 mg de dipirona a cada 4 horas.",
  "Não é nada, pode ficar tranquilo.",
  "Não precisa ir ao médico por causa disso.",
];

for (const out of UNSAFE_OUTPUTS) {
  test(`guarda de saida bloqueia: ${out}`, () => {
    const r = postModelCheck(out);
    assert.equal(r.blocked, true);
    assert.ok(r.violations.length > 0);
  });
}

const SAFE_OUTPUTS = [
  "Registrei que você dormiu mal em três dos últimos cinco dias. Quer anotar isso para levar à consulta?",
  "Sobre ajustar doses, converse com seu médico ou farmacêutico antes de qualquer mudança.",
  "Posso criar um lembrete no horário que você informou.",
];

for (const out of SAFE_OUTPUTS) {
  test(`guarda de saida permite: ${out.slice(0, 40)}`, () => {
    assert.equal(guardModelOutput(out).ok, true);
  });
}
