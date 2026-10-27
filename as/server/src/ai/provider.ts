// Contrato da camada de IA. A logica clinica NAO depende de nenhum fornecedor.
export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface LLMProvider {
  readonly name: string;
  complete(input: { system: string; turns: ChatTurn[]; maxTokens: number; signal: AbortSignal }): Promise<string>;
}

export class AIUnavailableError extends Error {
  constructor(message = "Servico de IA indisponivel") {
    super(message);
    this.name = "AIUnavailableError";
  }
}

// Usado quando nao ha chave configurada: nunca inventa resposta.
export const unavailableProvider: LLMProvider = {
  name: "none",
  async complete() {
    throw new AIUnavailableError("Nenhum provedor de IA configurado");
  },
};
