# Testes

## Executados (ambiente de desenvolvimento do assistente, Node 22.22)
`node --test test/clinical.test.ts test/security.test.ts`: **41 de 41 passaram.**
- Triagem: 17 mensagens urgentes detectadas; 7 mensagens comuns sem disparo.
- Guarda de saída: 9 respostas inseguras bloqueadas; 3 seguras aprovadas.
- Token de sessão, checagem de origem.
- Verificação de tipos (`tsc --strict`) nos módulos `clinical`, `origin-check` e `ai/provider`: sem erros.

Durante a execução, 2 defeitos reais foram encontrados e corrigidos: "garganta está fechando"
não era detectada, e "vou me cortar o cabelo" gerava alarme falso.

## Escritos, mas NÃO executados
- `test/env.test.ts` (precisa do pacote `zod`; sem acesso à rede no ambiente).

## Não verificado
- Instalação das dependências, `npm run migrate`, subida do servidor.
- Rotas de autenticação, middleware de sessão, rate limit, cabeçalhos.
- Verificação de tipos do restante do `src/` (depende de pacotes não instalados).
- Qualquer integração com IA real.

## Testes que ainda não existem
Isolamento entre usuários; criação/edição/exclusão; lembretes; exportação e exclusão; banco ou
provedor de IA indisponíveis; injeção de prompt; acessibilidade; responsividade; fluxos da landing page.
