# Modelo de ameaças (versão inicial)

**Ativos:** dados de saúde; credenciais e sessões; chave do provedor de IA; orçamento de IA; reputação.
**Agentes:** atacante externo; usuário malicioso; outro usuário; conteúdo externo manipulado; insider; falha do provedor.

| # | Ameaça | Impacto | Prob. | Mitigação | Estado |
|---|---|---|---|---|---|
| 1 | Força bruta / credential stuffing | Alto | Média | argon2id; rate limit por IP+e-mail; (a fazer) bloqueio progressivo e MFA | Parcial |
| 2 | Roubo de sessão | Alto | Média | Cookie HttpOnly/Secure/SameSite; hash do token; revogação | Escrito, não executado |
| 3 | CSRF | Médio | Média | SameSite=Lax + checagem de `Origin` | Escrito; origem testada |
| 4 | Acesso a dados de outro usuário (IDOR) | Crítico | Média | Filtro por `user_id` em toda consulta; testes de isolamento | **Teste ainda não existe** |
| 5 | SQL injection | Alto | Baixa | Consultas parametrizadas | Aplicado |
| 6 | Enumeração de contas | Baixo | Alta | Login uniforme; **cadastro revela e-mail existente** | Limitação conhecida |
| 7 | Prompt injection / jailbreak | Alto | Alta | Triagem e guarda determinísticas; conteúdo externo tratado como dado | Parcial (sem IA conectada) |
| 8 | Vazamento de dados de saúde em logs | Alto | Média | Redação de cookies; corpos não logados; `safety_events` sem conteúdo | Parcial |
| 9 | Abuso de custo da IA | Médio | Média | Limites por usuário e tokens | Etapa 4 |
| 10 | Resposta clínica insegura | Crítico | Média | Triagem pré-modelo + guarda pós-modelo + revisão clínica | Parcial, **sem revisão clínica** |
| 11 | Segredos no repositório | Alto | Média | `.gitignore`, `.env.example`, verificação antes do commit | Aplicado |
| 12 | Perda de dados | Alto | Baixa | Backups e teste de restauração | Pendente (implantação) |

Nada aqui garante que o sistema seja seguro. É um ponto de partida para revisão especializada.
