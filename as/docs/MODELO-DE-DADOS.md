# Modelo de dados

Definição completa: `server/migrations/001_init.sql`.

| Tabela | Finalidade | Sensibilidade |
|---|---|---|
| `users` | Conta, preferências, aceite do onboarding, memória desligada por padrão | Pessoal |
| `sessions` | Sessões; só o **hash** do token é guardado; revogáveis | Pessoal |
| `consents` | Consentimentos por finalidade, versionados | Pessoal |
| `memory_items` | Memória em 3 categorias: `preference`, `routine`, `health` | **Saúde** |
| `checkins` | Registros de bem-estar informados pelo usuário | **Saúde** |
| `reminders`, `reminder_events` | Lembretes e idempotência de disparos | Pode ser **saúde** |
| `safety_events` | Dispara/bloqueia, **sem conteúdo** da conversa | Baixa |
| `audit_events` | login, logout, exportação, exclusão | Baixa |

Princípios: isolamento por `user_id` em toda consulta; `ON DELETE CASCADE` para exclusão de conta;
texto de notificação neutro por padrão; nenhuma tabela guarda o histórico completo do chat (decisão
a ser tomada na etapa 4, com consentimento explícito se for guardado).

**Retenção (proposta, a validar juridicamente):** sessões expiradas apagadas após 30 dias;
`audit_events` e `safety_events` 12 meses; dados do usuário até a exclusão da conta.
