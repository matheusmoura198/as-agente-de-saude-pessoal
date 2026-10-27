# Segurança clínica

**Status: proposta técnica NÃO revisada por profissionais de saúde.**

## Camadas
1. **Triagem de urgência** (`server/src/clinical/triage.ts`): regras determinísticas sobre texto
   normalizado. Categorias: cardíaca, respiratória, AVC, consciência, alergia grave, hemorragia,
   convulsão, intoxicação, crise de saúde mental.
2. **Mensagens fixas** (`emergency-messages.ts`): SAMU 192; CVV 188 para crise emocional.
   Nunca afirmam que a AS acionou ajuda.
3. **Guarda de saída** (`output-guard.ts`): bloqueia afirmação de ter chamado ajuda ou monitorar,
   diagnóstico definitivo, garantia de que "não é nada", instrução de dose, dose numérica e
   orientação para ignorar profissional.
4. **Ordem do pipeline** (`pipeline.ts`): a triagem ocorre antes de qualquer chamada ao modelo.

## Decisões de projeto
- Prioriza sensibilidade: aceita falsos positivos (ex.: relato sobre outra pessoa ou sobre o passado).
- Não trata negação ("não tenho dor no peito"), porque erros de negação podem esconder emergências.
- Regras são listas de expressões em português; **não cobrem** gírias, erros de digitação, outros
  idiomas, nem descrições indiretas.

## O que precisa de profissionais antes de qualquer uso real
Lista de sinais, textos das mensagens, números de contato vigentes, critérios de aprovação e
casos de teste clínicos.

## Plano de avaliação (a ser construído com revisores clínicos)
Casos normais, ambíguos, graves, contraditórios, sobre medicamentos, pedidos de diagnóstico,
sobre exames, conteúdo desatualizado, fontes insuficientes e usuários que recusam atendimento.
Hoje existem apenas 41 testes técnicos escritos pelo desenvolvedor.
