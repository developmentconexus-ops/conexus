# Etapa 1: Hub no ar

Proposto em 2026-10-13, do estudo da etapa. Nenhum teste rodou.

## A página do fundador

**No fim desta etapa** você publica uma mudança no Hub da nuvem e volta atrás, sem terminal e sem
ajuda, e recebe o aviso por e-mail quando o Hub cai.

**O roteiro de uso.**

1. Abra o endereço do Hub. A página mostra a marca, a versão e uma frase.
2. O Firstmate aperta "Merge" no pull request de ensaio. Em até 10 minutos, recarregue a página: a
   frase nova aparece, com a versão nova.
3. No GitHub, abra a aba Actions, escolha "Voltar atrás" e aperte "Run workflow". Em até 5 minutos a
   frase antiga volta, com a versão antiga.
4. O Firstmate desliga o túnel por alguns minutos. O e-mail de aviso do Cloudflare chega na sua
   caixa. Depois ele religa, e a página volta.

**O que você faz, e quando.** Antes: entrega a conta Cloudflare com o domínio do Hub, uma chave
dessa conta que só mexe no túnel, no DNS e nos avisos daquele domínio, e o acesso ao servidor de São
Paulo. O servidor da Hostinger comprado para as provas serve: ele é apagado e reinstalado, e precisa
ser renovado antes de 9 de novembro. No começo: aprova esta página e responde a pergunta abaixo. No
fim: faz o roteiro, com a sua conta do GitHub, e diz o que viu.

**Fica de fora.** O banco, que nasce na etapa 2. Login, empresas e toda tela do produto. A página
é nova e pequena, pública e sem segredo, e não espera o estudo da interface. Em cada publicação o
Hub fica fora do ar por alguns segundos; publicar sem esse corte é a etapa 16. Nenhum segredo fica
no GitHub: os do servidor ficam num arquivo dele.

**A decisão sua pedida nesta etapa.** Quando o programa do Hub travar sem cair, você quer receber
e-mail? Exemplo: o servidor está ligado e o túnel conectado, mas o programa parou de responder; você
abre o endereço e vê "Bad gateway". Com o servidor desligado, o e-mail do Cloudflare chega em
qualquer opção.

- **A.** Não nesta etapa. O travamento aparece para quem abrir o Hub e na próxima publicação, que
  recusa uma imagem que não responde. Custo zero.
- **B.** Um serviço de monitoramento grátis, de fora, abre a rota de saúde do Hub a cada 5 minutos e
  manda e-mail se ela não responder. Custo zero, uma conta a mais só com o seu e-mail, nenhum
  segredo.
- **C.** O plano Pro do Cloudflare, que faz essa checagem. Cerca de US$ 20 a 25 por mês.

Recomendo **B**: a arquitetura promete que um programa travado também é visto, o plano grátis do
Cloudflare não faz isso, e B cumpre sem custo. O cartão segue com B, pendente da sua resposta.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 Esqueleto | A raiz do repositório, as conferências que os guias citam e o CI com um portão só | raiz, `scripts/`, `.github/workflows/ci.yml` | [entrega](../guides/delivery.md) | nada |
| U2 Servidor | Configuração, falha, acesso por rota, as rotas de saúde e de estado, desligamento | `apps/server/`, `packages/hub-api/` | [testes](../guides/testing.md) | U1 |
| U3 Página | A página com a marca, a versão lida do servidor e a frase | `apps/web/` | [web](../guides/web.md) | U2 |
| U4 Publicar | A imagem, o Compose com o túnel, publicar por merge, "Voltar atrás", o preparo do servidor e a prova do registro 0035 | `infra/`, `.github/workflows/publish.yml` e `rollback.yml`, `docs/how-to/`, `.dockerignore`, `docs/decisions/0035-…`, `docs/architecture.md` | [segurança](../guides/security.md) | U1; a prova espera U2 e U3 |

U1 vem sozinha. Depois dela, U2 e U4 correm em paralelo, porque não dividem pasta. U3 espera a U2,
porque importa `@conexus/hub-api`. A prova da U4 roda por último, no servidor de verdade.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U4 | Um merge em `main` fica no ar em até 10 minutos, com a versão do commit do merge, sem comando no servidor. Um push em outro ramo não publica: o job recusa ref diferente de `main` | Verificação 1 do [0035](../decisions/0035-publish-through-a-runner-on-the-server.md); `publish.yml` | must |
| 2 | U4 | "Voltar atrás" põe a imagem anterior em até 5 minutos. Sem imagem anterior, termina vermelho e o Hub não muda | Verificação 2 do 0035 | must |
| 3 | U4 | Uma imagem cujo programa não sobe (falta configuração) deixa a anterior respondendo, e a publicação termina vermelha | Verificação 3 do 0035 | must |
| 4 | U4 | O servidor não abre porta: uma varredura de fora não acha porta TCP aberta | Verificação 4 do 0035 | must |
| 5 | U4 | Um programa morto volta sozinho em até 1 minuto | Verificação 5 do 0035 | must |
| 6 | U4 | Com o túnel parado, o e-mail do Cloudflare chega ao fundador; a demora é registrada | Verificação 6 do 0035 | must |
| 7 | U4 | Durante a publicação nunca rodam dois programas do Hub | Verificação 7 do 0035 | must |
| 8 | U2 | Sem `CONEXUS_VERSION`, ou com um valor fora do formato, o programa não sobe, sai com código diferente de zero e escreve uma linha `CONFIG_INVALID` que nomeia a variável, sem abrir porta | `apps/server/src/main.test.ts`, "recusa subir sem configuração" (processo filho) | must |
| 9 | U2 | Uma rota sem tipo de acesso, ou com um tipo que não existe, impede a subida e o erro nomeia método e caminho | `apps/server/src/platform/access.test.ts` | must |
| 10 | U2 | `GET /api/health` responde 200 `{"status":"LIVE"}` sem tocar banco algum | `main.test.ts`, "saúde" | must |
| 11 | U2 | `GET /api/status` responde 200 `{"version":"<40 hex>"}` com a versão da configuração | `apps/server/src/hub/status/status.test.ts` | must |
| 12 | U2 | Caminho desconhecido: 404; JSON inválido, `Content-Length` errado ou linha malformada: 400; mídia errada: 415. Sempre `application/problem+json` com só `type`, `title`, `status`, `code` e `traceId`, nunca 500 nem o corpo do Fastify; log `info` | `main.test.ts`, um caso por recusa, com o status e o corpo literais | must |
| 13 | U2 | `HEAD` responde só nas páginas; `HEAD /api/status` responde 404 | `main.test.ts` | must |
| 14 | U2 | Toda resposta leva CSP com `script-src 'self'`, sem `unsafe-inline`, `frame-ancestors 'none'` e `Referrer-Policy: no-referrer`; nenhuma resposta leva cabeçalho de CORS | `main.test.ts`, "cabeçalhos" | must |
| 15 | U2 | Cada pedido deixa uma linha de log com rota, status, duração e id; um `traceparent` recebido não aparece no log nem na resposta | `main.test.ts`, "log por pedido" | should |
| 16 | U2 | No primeiro SIGTERM o programa fecha e sai com 0 antes do prazo; um segundo sinal logo depois sai na hora com 1 | `main.test.ts`, "desligamento" (processo filho) | must |
| 17 | U3 | A página mostra a marca, a versão que o servidor informa, em fonte mono, e a frase. Se a leitura falhar, mostra a frase da tabela de falhas, nunca uma versão vazia | `apps/web/src/hub/status/status-page.test.tsx`, dois casos | must |
| 18 | U3 | O console do navegador não mostra erro nem violação de CSP na página servida pela imagem | Prova da U4, no navegador | must |
| 19 | U1 | O CI recusa: import que fura parede, teste que importa o interior, teste que trava, zero testes, supressão sem mudar a contagem, documento acima do teto ou com link quebrado, mudança em skills ou guias com cartão em `docs/steps/` | `scripts/*.test.ts`, um caso ruim plantado por conferência | must |
| 20 | U1 | O portão `ci` falha quando um job falha, é pulado ou cancelado | Pull request de ensaio com um job cancelado | must |
| 21 | U1 | O CI confere a linha de aprovação do cartão no roteiro: o commit citado é ancestral da ponta e o cartão não mudou desde ele | `scripts/check-approval.test.ts` | must |
| 22 | U1 | O CI lista no resumo do job toda dependência nova do pull request | `scripts/list-new-dependencies.test.ts` | must |
| 23 | U1 | O servidor roda `.ts` direto, e o Vite empacota a página que importa `@conexus/hub-api`, que aponta para `.ts` | Jobs `test-server` e `image` do CI | must |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| `http` antigo (548 linhas) | Nova | `apps/server/src/platform/http.ts`, `platform/access.ts` | Não se aplica | Carrega, por propósito: tipo de acesso por rota, recusado na subida com o nome da rota (C33); 404 antes de ler o corpo (S27); `HEAD` só em páginas (C30); erro em cinco campos, `type` = `urn:conexus:problem:<CODE>` (C51); resposta conferida pelo schema (C31); `trustProxy: false` (S29); uma linha de log por pedido (C46); erro de biblioteca pelo status (C50); CSP `script-src 'self'` (S26); handler sem `request` nem `reply` (C14); tabela fechada de tipos (C21). Larga: os três ouvintes e os tipos `sign-in`, `host-write`, `hub-entry` ([0018], [0014]); `session` e `sign-out`, refeitos na etapa 3; as listas à mão de prefixos e de 17 caminhos; os hashes de CSP do Mastra ([0033]); `forceCloseConnections`, `traceId` só em `SYSTEM` e `strict-origin` (base: "implementado assim") |
| Cookies e conferência de origem (`cookies.ts`, `access.ts:54-122`) | Fica fora | Etapa 3 | Não se aplica | Sem sessão e sem escrita nesta etapa |
| Classe de erro (`failure.ts`, 75) | Nova | `apps/server/src/platform/failure.ts` | Não se aplica | Carrega: uma classe com código da tabela (C49); `cause` nunca serializada; log com tipos e quadros da cadeia, sem mensagem (S41, C54). Larga: herdar `MastraError` |
| Tabela de falhas (JSON, gerador e duas cópias geradas) | Nova | `packages/hub-api/src/failures.ts` | Não se aplica | Carrega: categoria, status, frase e ação (C48). Larga: o gerador, que servia a dois pacotes; agora um dono (C26) |
| Configuração (`config.ts`, 242) | Nova | `apps/server/src/platform/config.ts` | Não se aplica | Carrega: recusar subir nomeando o valor (C67). Larga: 30 das 33 variáveis; o código de saída 78, cuja base era o systemd |
| Logger e desligamento (`logger.ts`, `lifecycle.ts`) | Nova, nativa | `main.ts`, com o logger do Fastify e `close-with-grace` | Não se aplica | Carrega: fechar com prazo, segundo sinal sai na hora (C62). Larga: os tratadores à mão; trava de instância e migração vão para as etapas 2 e 3 |
| Tipo de operação (`operation.ts`, 78) | Nova | `packages/hub-api/src/operation.ts` | Não se aplica | Carrega: uma declaração por operação (C28). Larga, até haver consumidor: entrada, `malformed`, `effects`, binário |
| Marca (`conexus-mark.tsx`, 41), fontes, `favicon.svg` | Trazida | `apps/web/src/brand/mark.tsx`, `brand/fonts/`, `brand/favicon.svg` | Tamanhos do logotipo em classes do Tailwind | Carrega: `aria-hidden` na marca, `aria-label` no logotipo (V31); as duas peças (V25); fontes locais (V14) |
| Tokens (`tokens.css`, 143) | Nova, do guia de design | `apps/web/src/brand/tokens.css` | Não se aplica | Carrega: três blocos de tema (V4). Larga: `.light`/`.dark` do `ThemeProvider` ([0033]) e `cx-*` (W25). Valores do guia de design |
| CI antigo (`verify.yml` e três scripts) | Nova | `.github/workflows/ci.yml`, `scripts/` | Não se aplica | Carrega: um portão que falha em job falho, pulado ou cancelado (L15), agora por expressão nativa do Actions |
| Rotas de saúde e de estado, página, imagem, Compose, túnel, publicar, voltar atrás | Novas | Seções das unidades | Não se aplica | Nenhuma |

**A medida do transplante.** De `http`, cerca de 150 das 548 linhas têm consumidor nesta etapa, e
cada bloco muda mais de um terço; dos 35 casos de teste antigos, nenhum passa pela porta pública sem
mudar. Por isso `http`, a classe de erro, a configuração e o desligamento nascem novos, e o que os
testes antigos fixavam virou os critérios 8 a 16. A marca é trazida: o construtor conta as linhas e
para se passar de um terço.

**A dívida.** Nenhuma: nenhuma parte trazida deixa conserto pequeno para trás.

## U1 Esqueleto

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `package.json`, `package-lock.json` | Cria | npm, CI, Dockerfile |
| `.nvmrc` | Cria | CI (`actions/setup-node`), desenvolvedores |
| `tsconfig.base.json` | Cria | `tsconfig.json` de cada pacote |
| `biome.json`, `.dependency-cruiser.cjs`, `knip.json`, `.gitignore` | Cria | scripts da raiz, CI |
| `scripts/check-docs.ts`, `check-suppressions.ts`, `suppressions.json`, `check-approval.ts`, `check-method-freeze.ts`, `list-new-dependencies.ts`, `test-reporter.ts`, e um `*.test.ts` ao lado de cada script | Cria | scripts da raiz, `ci.yml` |
| `.github/workflows/ci.yml` | Cria | GitHub; o script de fusão do Firstmate lê o portão `ci` |

### Os contratos que a unidade cria

- Scripts da raiz: `verify` (tudo o que o CI roda, menos a imagem), `lint`, `typecheck`, `deps`,
  `knip`, `docs`, `test`. A raiz é um workspace npm com `apps/*` e `packages/*`.
- Node 24.21.0 em `.nvmrc`. TypeScript 6.0.3, porque o dependency-cruiser 18.4.0 não lê o 7.
  `tsconfig.base.json`: `strict`, `noEmit`, `module` e `moduleResolution` `nodenext`,
  `allowImportingTsExtensions`, `verbatimModuleSyntax`, `erasableSyntaxOnly`.
- Portas que um teste do servidor pode importar (T5): `apps/server/src/main.ts`, qualquer
  `public.ts`, e um arquivo de `apps/server/src/platform/` pelo teste ao lado dele, porque `platform`
  não tem `public.ts` e cada arquivo dele é a superfície que os outros importam.
- `suppressions.json`: `{ "<arquivo>": <número> }`. O CI falha se a contagem real diferir.
- Linha de aprovação no roteiro, uma por cartão, que `check-approval.ts` lê:
  `Cartão da etapa <n> aprovado em <AAAA-MM-DD> (commit <sha>): "<palavras>"`.
- `check-method-freeze.ts`: falha quando o pull request muda `.agents/skills/` ou `docs/guides/`
  enquanto a ponta tem um cartão em `docs/steps/`, salvo com o rótulo `emergência`.
- `ci.yml`: em `pull_request` e em `push` para `main`; jobs `check`, `test-server`, `test-web`,
  `image` (constrói sem publicar) e `ci`, que depende de todos com `if: always()` e falha se algum
  resultado for `failure`, `cancelled` ou `skipped`. Cada job tem `timeout-minutes` (o prazo global
  de T3).

### A ordem do trabalho

1. Workspace, `.nvmrc`, `tsconfig.base.json`, `.gitignore` com os arquivos de ambiente. Regras: C5,
   C24, C25, S37. Funções: npm workspaces; `typescript@6.0.3`.
2. Biome com largura de linha e tamanho de função e de arquivo, sem supressão. Regras: C11, C12,
   C18, C20, C24, C25, C53, C67, C77, T21. Funções: `@biomejs/biome@2.5.14`:
   `complexity/noExcessiveLinesPerFunction`, `style/noExcessiveLinesPerFile`,
   `style/noDefaultExport`, `style/noProcessEnv`, `style/noNonNullAssertion`,
   `suspicious/noExplicitAny`, `style/useImportType`, `style/noRestrictedImports`.
3. dependency-cruiser com a lei de imports e a porta dos testes. Regras: C3 a C8, C56, T5, W1, W4 a
   W6, W13. Funções: `dependency-cruiser@18.4.0`, regras `forbidden` com `path`/`pathNot` e
   `circular: true`, `tsPreCompilationDeps: true`.
4. knip. Regra: C74. Funções: `knip@6.38.0`, `workspaces`.
5. Os scripts, cada um com o caso ruim que prova a recusa e a data de revisão. Regras: C76, C78, L5,
   L6, L16, L20, L24, T4. Funções: `yaml@2.9.1` para o cabeçalho das skills; um reporter de
   `node:test` que falha com zero testes.
6. `ci.yml`. Regras: L15, L16, T3.

### Como se prova

`npm run verify` verde. Critério 19: cada conferência recusa um caso ruim plantado num diretório
temporário. Critério 20: um pull request de ensaio cancela um job e o portão fica vermelho.
Critérios 21 e 22: os testes dos scripts rodam num repositório Git temporário.

## U2 Servidor

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/package.json`, `src/index.ts`, `operation.ts`, `failures.ts`, `health.ts`, `status.ts` | Cria | `apps/server` (`access.ts`, `http.ts`, `health.ts`, `hub/status`), `apps/web` (U3) |
| `apps/server/package.json`, `tsconfig.json` | Cria | npm, CI, Dockerfile |
| `apps/server/src/main.ts`, `main.test.ts` | Cria | `CMD` da imagem; testes |
| `apps/server/src/platform/config.ts`, `failure.ts`, `access.ts`, `access.test.ts`, `http.ts`, `health.ts` | Cria | `main.ts`; `hub/status` |
| `apps/server/src/hub/status/public.ts`, `status.ts`, `status.test.ts` | Cria | `main.ts` |

### Os contratos que a unidade cria

- `type AccessKind = 'page' | 'public'`. `page`: `GET` e `HEAD`, sem credencial. `public`: `GET` em
  `/api/`, sem credencial.
- `type Operation`: `id`, `summary`, `access`, `method`, `path`, `success` (status para schema) e
  `failures` (lista de `FailureCode`).
- `getHealth`: `GET /api/health`, `public`, "Says the program is alive, without touching any
  database." 200 `Health = { status: 'LIVE' }`.
- `getStatus`: `GET /api/status`, `public`, "Reads the version of the Hub that is live." 200
  `HubStatus = { version: Version }`.
- `Version`: 40 caracteres hexadecimais, tipo marcado, criado só por parse.
- `FAILURES`, `FailureCode`: `INTERNAL_UNEXPECTED` (SYSTEM, 500), `NOT_FOUND` (USER, 404),
  `REQUEST_MALFORMED` (USER, 400, todo 4xx sem código próprio), `REQUEST_BODY_TOO_LARGE` (USER, 413),
  `REQUEST_MEDIA_TYPE_UNSUPPORTED` (USER, 415), `CONFIG_INVALID` (SYSTEM, 500, nunca enviado: só no
  log de subida). Cada linha com frase e ação em português.
- `Problem = { type, title, status, code, traceId }`; `traceId` é o id do pedido.
- `readConfig(env): Config`, com `Config = { version: Version; port: number; logLevel: LogLevel }`,
  lido de `CONEXUS_VERSION`, `HUB_PORT` e `LOG_LEVEL`, todos obrigatórios; falha
  `CONFIG_INVALID` com os nomes nos detalhes.
- `class Failure extends Error` com `code: FailureCode` e `details`; `logFailure(log, failure)`.
- `serve(app, operation, handler)`, com `handler(input) => Promise<resposta>` tipado pela
  operação; o registro recusa a subida se a rota não tiver tipo de acesso.
- `createStatus(deps: { version: Version })` devolve objeto congelado `{ read(): HubStatus }`.
- `createHub(config: Config): Promise<FastifyInstance>` em `main.ts`, sem escutar; com
  `import.meta.main`, `main.ts` lê a configuração, liga o `close-with-grace` e escuta em `HUB_PORT`.
- Prazos: `requestTimeout` 30 s, `connectionTimeout` 30 s, `keepAliveTimeout` acima do keep-alive de
  origem do cloudflared lido na versão instalada, prazo de desligamento 15 s.

### A ordem do trabalho

1. `packages/hub-api`. Regras: C23, C26, C28, C29, C39, C40, C48. Funções: `zod@4.6.5`
   (`z.object`, `z.literal`, `.brand`).
2. `failure.ts` e `config.ts`. Regras: C27, C49, C52 a C54, C67, S41. Funções: `z.prettifyError`;
   `Error` com `cause`.
3. `access.ts`. Regras: C14, C31, C33, C34, C42. Funções: `fastify@5.12.5` `addHook('onRoute')`,
   `addHook('onReady')`, `addHook('onRequest')`.
4. `http.ts` e `health.ts`. Regras: C43, C46, C47, C50, C51, C61, S24, S26, S27, S44. Funções:
   opções `requestTimeout`, `connectionTimeout`, `keepAliveTimeout`, `clientErrorHandler`,
   `disableRequestLogging`, `exposeHeadRoutes: false`, `trustProxy: false`, `genReqId`;
   `setErrorHandler`, `setNotFoundHandler`, `addHook('onResponse')`; `@fastify/helmet@13.1.1` com
   `style-src 'self'`, `frame-ancestors 'none'`, `frameguard: deny`; `@fastify/static@10.1.5` com
   `immutable` nos arquivos e `index.html` com `maxAge: 0`.
5. `hub/status`. Regras: C1, C2, C4, C13.
6. `main.ts`. Regras: C9, C62. Funções: `close-with-grace@2.5.0` (`delay`), `import.meta.main`.

### Como se prova

`node --test`, porta 0. Os critérios 10 a 15 entram por `createHub` e `inject`, com status e corpo
literais; o 9, pelo teste ao lado de `access.ts`. O 8 e o 16 sobem `main.ts` como processo filho e
conferem o código de saída e a linha do log. Esperar o pedido em curso é do `close()` do Fastify,
lido e não provado aqui.

## U3 Página

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/package.json`, `tsconfig.json`, `index.html`, `vite.config.ts`, `vitest.config.ts` | Cria | Vite, Vitest, CI, Dockerfile |
| `apps/web/src/main.tsx` | Cria | `index.html` |
| `apps/web/src/platform/hub.ts`, `platform/cache.ts` | Cria | `hub/status/queries.ts`, `main.tsx` |
| `apps/web/src/brand/tokens.css`, `mark.tsx`, `favicon.svg`, `fonts/*.woff2` e as licenças OFL | Cria | `main.tsx`, `index.html`, `hub/status/status-page.tsx` |
| `apps/web/src/hub/status/public.ts`, `queries.ts`, `status-page.tsx`, `status-page.test.tsx` | Cria | `main.tsx` |

### Os contratos que a unidade cria

- `hubQuery(operation)` em `platform/hub.ts`: monta o endereço pela operação, pede no mesmo
  domínio, valida a resposta com o schema da operação, e lê toda falha como `Problem` (C49).
- `statusQuery` em `hub/status/queries.ts`, de `hubQuery(getStatus)`.
- `StatusPage`: marca, versão em `fact` (mono), frase em português.
- Sem roteador: `main.tsx` monta só o cache e a página; o estudo da interface, antes da etapa 3,
  traz `routes/`.

### A ordem do trabalho

1. `brand/`. Regras: V3, V4, V9, V10, V11, V14, W25. Funções: `tailwindcss@4.3.3` com `@theme`,
   `@tailwindcss/vite@4.3.3`.
2. `platform/hub.ts` e `cache.ts`. Regras: W9, W13, C27, C49. Funções:
   `@tanstack/react-query@5.104.0` (`QueryClient`, `queryOptions`).
3. `hub/status`. Regras: W2, W19, W20, V38, V40, V43, C41. Funções: `useQuery`.
4. `main.tsx`, `index.html`, `vite.config.ts`. Funções: `vite@8.3.1`, `@vitejs/plugin-react@6.1.1`,
   `react@19.3.0`.

### Como se prova

`vitest` com Testing Library e `msw@3.0.0`: com resposta falsa que passa no schema de `getStatus`, a
versão aparece; com `INTERNAL_UNEXPECTED`, aparece a frase da tabela e nenhuma versão (critério 17),
achadas por papel e texto (T7). O 18, no navegador, na prova da U4.

## U4 Publicar

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `infra/hub.Dockerfile`, `.dockerignore` | Cria | `ci.yml` (job `image`), `publish.yml` |
| `infra/compose.yaml` | Cria | `infra/deploy.sh` |
| `infra/deploy.sh` | Cria | `publish.yml`, `rollback.yml`, pelo runner do servidor |
| `infra/setup-server.sh` | Cria | o Firstmate, uma vez, pelo how-to |
| `.github/workflows/publish.yml`, `rollback.yml` | Cria | GitHub, no push em `main`; o botão "Voltar atrás" |
| `docs/how-to/hub-server.md`, `docs/index.md` | Cria, muda | o Firstmate; `check-docs` |
| `docs/decisions/0035-publish-through-a-runner-on-the-server.md` | Muda: o Resultado | `docs/index.md` |
| `docs/architecture.md` | Muda: seção 7 cita [0035] e o aviso de queda segue a resposta do fundador | `docs/index.md` |

### Os contratos que a unidade cria

- Imagem `ghcr.io/developmentconexus-ops/conexus-hub:<commit>`, de `node:24-slim` fixada por digest,
  usuário `node`, `ARG`/`ENV CONEXUS_VERSION`, `HUB_PORT` e `LOG_LEVEL` definidos, `CMD node
  apps/server/src/main.ts`. Sem arquivo de ambiente nem segredo dentro.
- `compose.yaml`: serviço `hub` com imagem por digest, `init: true`, `restart: unless-stopped`,
  verificação de saúde em `/api/health`, `stop_grace_period` acima do prazo de 15 s, nenhuma porta
  publicada; serviço `cloudflared` `2026.10.0`, `tunnel --no-autoupdate run --token-file
  /run/secrets/tunnel_token`.
- Segredos no servidor: pasta `/etc/conexus/secrets/` (0700), um arquivo por segredo, 0400, dono o
  usuário do contêiner que o lê, montado como `secrets` do Compose; o ambiente leva só o caminho
  (S31). Nesta etapa só o token do túnel. A chave da instalação nasce aí na etapa 7, e a cópia do
  fundador fica no gerenciador de senhas dele. Nenhum segredo no GitHub.
- `deploy.sh <imagem>`: guarda a imagem em execução em `/var/lib/conexus/previous-image` e sobe a
  nova com `up --wait`; se não ficar saudável, volta a anterior e sai 1. `--previous`: sobe a
  anterior; sem ela, sai 2.
- `publish.yml`: no push em `main`, job `image` num runner do GitHub, que constrói e envia com
  `GITHUB_TOKEN` (`packages: write`) e mantém as dez últimas imagens; job `deploy` em
  `[self-hosted, hub]`, que recusa ref diferente de `refs/heads/main` e roda `deploy.sh` com o digest.
- `rollback.yml`: nome "Voltar atrás", `workflow_dispatch` sem entrada, em `[self-hosted, hub]`,
  recusa ref diferente de `main`, roda `deploy.sh --previous`.
- O aviso: Tunnel Health Alert do Cloudflare, por e-mail ao fundador. Com a resposta B, um monitor
  externo grátis em `/api/health`, a cada 5 minutos.

### A ordem do trabalho

1. Dockerfile e `.dockerignore`. Regras: S37, [0002]. Funções: build em estágios,
   `npm ci --omit=dev` mantendo os links do workspace (o Node recusa `.ts` sob `node_modules`).
2. `compose.yaml`. Regras: S31, C61, C62. Funções: Compose v5 `secrets` de arquivo, `init`,
   `healthcheck`, `restart`, `stop_grace_period`.
3. `deploy.sh`. Regras: C64, C73. Funções: `docker compose up --wait --wait-timeout`.
4. `publish.yml` e `rollback.yml`. Regras: L13, L17. Funções: `docker/build-push-action`,
   `workflow_dispatch`, `runs-on: [self-hosted, hub]`.
5. `setup-server.sh` e o how-to: Docker, o runner como serviço de um usuário sem login no grupo
   `docker`, a pasta de segredos, entrada fechada no firewall do provedor. O SSH, só com chave, fecha
   na verificação 4; sem console de emergência no provedor, o fundador decide.
6. A prova, depois de U2 e U3 no ramo da etapa: as sete verificações do [0035], o Resultado
   escrito no registro num commit à parte, e a seção 7 da arquitetura.

### Como se prova

As sete verificações do [0035] no servidor de verdade, com o que rodou e o que apareceu (critérios
1 a 7); o 18 no navegador. O job `image` do CI constrói a imagem em todo pull request.
