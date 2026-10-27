# Planejamento (Etapa 2)

## Escopo do MVP
Landing page; cadastro/login; onboarding com limites da AS; perfil e preferências; dashboard diário;
chat com IA real; check-in; lembretes; histórico; controles de memória; segurança clínica;
política de privacidade e termos; exportação e exclusão de dados; testes; documentação.

**Fora do MVP:** integrações com dispositivos, compartilhamento com cuidadores, RAG com corpus completo,
pagamentos, públicos infantis/adolescentes.

## Decisões de arquitetura
| Decisão | Escolha | Critério | Alternativa / migração |
|---|---|---|---|
| Estilo | Monólito modular | Simplicidade, custo baixo | Extrair módulos se houver carga |
| Linguagem | TypeScript (Node ≥ 22.18) | Um idioma, tipagem | — |
| API | Fastify + Zod | Leve, validação explícita | Express |
| Banco | PostgreSQL | Integridade, isolamento por `user_id`, pgvector depois | — |
| Sessão | Cookie HttpOnly + token aleatório, hash no banco | Revogação real | JWT (não escolhido: revogação difícil) |
| Senha | argon2id | Padrão atual recomendado | bcrypt |
| IA | Interface `LLMProvider` | Troca de fornecedor sem tocar na lógica clínica | — |
| Agendador | Fila em Postgres (pg-boss) — etapa 4 | Sem infraestrutura extra | Redis/BullMQ |
| Frontend | React + Vite, PWA — etapa 6 | Mobile-first, push web | — |

## Fluxo da mensagem do chat (etapa 4)
1. `preModelCheck` (triagem determinística). Se urgente: mensagem fixa e **sem chamada ao modelo**.
2. Montar contexto somente com memórias permitidas.
3. Chamar o provedor (timeout, limite de tokens, limite por usuário).
4. `postModelCheck` (guarda de saída). Se violar: resposta segura padrão.
5. Registrar evento técnico **sem conteúdo** (`safety_events`).
6. Provedor indisponível: avisar claramente; nunca inventar resposta.

## Integrações e credenciais necessárias
| Item | Para quê | Situação |
|---|---|---|
| PostgreSQL | Dados | Necessário para rodar |
| Chave do provedor de IA | Chat | **Pendente** (decisão do dono do projeto) |
| Serviço de e-mail transacional | Verificação de e-mail e recuperação de senha | **Pendente** |
| Chaves VAPID (web push) | Notificações | Gerar na etapa 4 |
| Hospedagem + domínio | Publicação | **Pendente** |

## Pendências que exigem especialistas
Revisão clínica das regras e mensagens; parecer jurídico (LGPD, base legal, DPIA/RIPD);
enquadramento regulatório na ANVISA; política de privacidade e termos redigidos por advogado.
