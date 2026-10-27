# AS — assistente de saúde e bem-estar

Plataforma de apoio informativo e organização de cuidados pessoais, em português brasileiro.
A AS **não é médica**, não diagnostica, não prescreve e não substitui profissionais de saúde.

> **Estado atual: fundação (etapas 2 e 3).** Não é um produto pronto, não foi validado
> clinicamente e não deve ser usado por pessoas reais para decisões de saúde.

## O que existe hoje

| Área | Estado |
|---|---|
| Documentos de planejamento (`docs/`) | Escritos |
| Esquema do banco (`server/migrations/001_init.sql`) | Escrito, **não executado** em um Postgres real |
| Autenticação (cadastro, login, logout, sessões revogáveis) | Escrita, **não executada** (dependências não instaladas no ambiente de desenvolvimento) |
| Triagem de urgência e guarda de saída da IA | Implementadas e **testadas** (41 testes passando) |
| Contrato da camada de IA | Interface pronta; **nenhum provedor conectado** |
| Chat, check-in, lembretes, memória, histórico, frontend, landing page | **Ainda não existem** |

## Estrutura

```
as/
├── docs/                 planejamento, modelo de dados, API, ameaças, segurança clínica, testes
└── server/
    ├── migrations/       SQL versionado
    ├── src/
    │   ├── app.ts        montagem do Fastify (helmet, CORS, rate limit, checagem de Origin)
    │   ├── server.ts     ponto de entrada
    │   ├── config/       validação de variáveis de ambiente
    │   ├── db/           pool e migrações
    │   ├── auth/         rotas de autenticação e middleware de sessão
    │   ├── security/     senha (argon2id), token de sessão, checagem de origem
    │   ├── clinical/     triagem de urgência, mensagens fixas, guarda de saída
    │   └── ai/           contrato LLMProvider (sem fornecedor acoplado)
    └── test/
```

## Como rodar

Requisitos: Node.js 22.18 ou superior, PostgreSQL 14 ou superior.

```bash
cd server
npm install
cp .env.example .env     # preencha DATABASE_URL e COOKIE_SECRET
npm run migrate
npm run dev
npm test
```

Testes que rodam sem banco: `test/clinical.test.ts`, `test/security.test.ts`.
`test/env.test.ts` precisa de `npm install` (usa `zod`).

## Limitações conhecidas

Veja `docs/TESTES.md` (seção "O que ainda não foi verificado") e `docs/SEGURANCA-CLINICA.md`.
