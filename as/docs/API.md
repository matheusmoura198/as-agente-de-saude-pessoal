# API (implementada na fundação)

Todas as respostas são JSON. Métodos que alteram estado exigem cabeçalho `Origin` permitido.
Autenticação por cookie `as_session` (HttpOnly, assinado, `Secure` em produção).

| Método e rota | Auth | Descrição | Respostas |
|---|---|---|---|
| `GET /health` | não | Processo no ar | 200 |
| `GET /ready` | não | Banco acessível | 200 / 503 |
| `POST /auth/register` | não | `{email, password(≥12), displayName?}` | 201 / 400 / 409 |
| `POST /auth/login` | não | `{email, password}` | 200 + cookie / 401 |
| `POST /auth/logout` | sim | Revoga a sessão atual | 200 / 401 |
| `POST /auth/logout-all` | sim | Revoga todas as sessões | 200 / 401 |
| `GET /auth/me` | sim | Dados básicos e `onboardingDone` | 200 / 401 |
| `POST /auth/onboarding/ack` | sim | Registra leitura dos limites da AS | 200 / 401 |

Limites: corpo ≤ 100 KB; 100 req/min por IP; rotas de cadastro/login 10 req/min por IP + e-mail.

**Planejadas (etapa 4):** `/checkins`, `/reminders`, `/memory`, `/history`, `/chat`,
`/account/export`, `/account` (DELETE).
