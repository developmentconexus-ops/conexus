# Etapa 1: Hub no ar

Proposto em 2026-10-13, do estudo da etapa. Nenhum teste rodou.

## A página do fundador

**No fim desta etapa** você publica uma mudança no Hub da nuvem e volta atrás, sem terminal e sem
ajuda, e recebe um e-mail quando o Hub cai.

**O roteiro de uso.**

1. Abra o endereço do Hub. A página mostra a marca, a versão e uma frase.
2. O Firstmate aperta "Merge" num pull request de ensaio, que só troca a frase. Em até 10 minutos,
   recarregue: a frase nova aparece, com a versão nova.
3. No GitHub, abra a aba Actions, escolha "Voltar atrás" e aperte "Run workflow". Em até 5 minutos a
   frase antiga volta, com a versão antiga.
4. O Firstmate desliga a ligação do servidor com o Cloudflare por alguns minutos. O e-mail de aviso
   chega na sua caixa. Depois ele religa, e a página volta.

**O que você faz, e quando.** Antes: entrega a conta Cloudflare com o domínio do Hub, uma chave
dessa conta que só mexe na ligação com o servidor, no DNS e nos avisos daquele domínio, e o acesso
ao servidor de São Paulo. O servidor da Hostinger comprado para as provas serve: ele é apagado e
reinstalado, e precisa ser renovado antes de 9 de novembro. No começo: aprova esta página e
responde a pergunta abaixo. No fim: faz o roteiro, com a sua conta do GitHub, e diz o que viu.

**Fica de fora.** O banco, que nasce na etapa 2. Login, empresas e toda tela do produto. A página é
nova e pequena, pública e sem segredo, e não espera o estudo da interface. Em cada publicação o Hub
fica fora do ar por alguns segundos; publicar sem esse corte é a etapa 16. Nenhum segredo fica no
GitHub: os do servidor ficam num arquivo dele.

**A decisão sua pedida nesta etapa.** Quando o programa do Hub travar sem cair, você quer receber
e-mail? Exemplo: o servidor está ligado, mas o programa parou de responder; você abre o endereço e
vê "Bad gateway". Com o servidor desligado, o e-mail do Cloudflare chega em qualquer opção.

- **A.** Não nesta etapa. O travamento aparece para quem abrir o Hub e na próxima publicação, que
  recusa um programa que não responde. Custo zero.
- **B.** Um serviço de monitoramento grátis, de fora, abre a página de saúde do Hub a cada 5
  minutos e manda e-mail se ela não responder. Custo zero. Você confirma o cadastro pelo seu e-mail.
- **C.** O plano Pro do Cloudflare, que faz essa checagem. Cerca de US$ 20 a 25 por mês.

Recomendo **B**: a arquitetura promete que um programa travado também é visto, e o plano grátis do
Cloudflare não faz isso. O cartão segue com B, pendente da sua resposta; a linha do roteiro, que
dizia "nenhuma", muda com ela.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 Esqueleto | A raiz, as conferências que os guias citam e o CI com um portão só | raiz, `scripts/`, `.github/workflows/ci.yml` | [entrega](../guides/delivery.md) | nada |
| U2 Servidor | Configuração, falha, acesso por rota, saúde, estado, desligamento | `apps/server/`, `packages/hub-api/` | [testes](../guides/testing.md) | U1 |
| U3 Página | A página: marca, versão lida do servidor, frase | `apps/web/` | [web](../guides/web.md) | U2 |
| U4 Publicar | Imagem, Compose com o túnel, publicar, "Voltar atrás", o servidor, os avisos e a prova do [0035](../decisions/0035-publish-through-a-runner-on-the-server.md) | `infra/`, `.github/workflows/`, `docs/how-to/`, `.dockerignore`, `docs/decisions/0035-…`, `docs/architecture.md`, `docs/index.md` | [segurança](../guides/security.md) | U1; a prova espera U2 e U3 |

U1 vem sozinha. Depois, U2 e U4 correm em paralelo, sem pasta em comum; em `ci.yml` a U4 só
acrescenta o job `image`. U3 espera a U2, de quem importa `@conexus/hub-api`. A prova da U4 roda por
último, no servidor, com cada caso registrado no pull request da etapa.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U4 | Um merge em `main` fica no ar em até 10 minutos, com a versão do commit, sem comando no servidor. Publicar ou voltar atrás a partir de outro ramo termina vermelho sem tocar o servidor | Prova da U4: verificação 1 do 0035; caso "outro ramo" | must |
| 2 | U4 | "Voltar atrás" põe a imagem anterior em até 5 minutos. Sem anterior, termina vermelho e o Hub não muda. Repetir a mesma publicação não apaga a anterior | Verificação 2; casos "sem anterior" e "publicar duas vezes" | must |
| 3 | U4 | Uma imagem cujo programa não sobe (falta configuração): a anterior volta a responder em até 2 minutos, e a publicação termina vermelha | Verificação 3 | must |
| 4 | U4 | No fim da U4, uma varredura de fora não acha porta TCP aberta | Verificação 4 | must |
| 5 | U4 | Um programa morto volta sozinho em até 1 minuto | Verificação 5 | must |
| 6 | U4 | Com o cloudflared parado, o e-mail do Cloudflare chega ao fundador; a demora fica registrada | Verificação 6 | must |
| 7 | U4 | Em três publicações seguidas, `docker events` mostra o `die` do Hub antigo antes do `start` do novo | Verificação 7 | must |
| 8 | U4 | Com a resposta B: com o programa congelado (`docker pause`), o e-mail do monitor chega em até 10 minutos | Prova da U4, caso "travado" | must, se B |
| 9 | U2 | Sem `CONEXUS_VERSION`, `HUB_PORT` ou `LOG_LEVEL`, ou com valor fora do formato, o programa não sobe, sai com código diferente de zero e escreve uma linha `CONFIG_INVALID` que nomeia a variável | `apps/server/src/main.test.ts`, "recusa subir sem <variável>", um caso por variável | must |
| 10 | U2 | Rota sem tipo de acesso, ou com tipo que não existe, impede a subida, e o erro nomeia método e caminho | `platform/access.test.ts`, "recusa rota sem tipo", "recusa tipo desconhecido" | must |
| 11 | U2 | `GET /api/health` responde 200 `{"status":"LIVE"}` sem tocar banco algum | `main.test.ts`, "saúde" | must |
| 12 | U2 | `GET /api/status` responde 200 `{"version":"<40 hex>"}`, a da configuração | `hub/status/status.test.ts`, "lê a versão" | must |
| 13 | U2 | Caminho desconhecido: 404; JSON inválido, `Content-Length` errado ou linha malformada: 400; mídia errada: 415. Sempre `application/problem+json` com só `type`, `title`, `status`, `code` e `traceId`, nunca 500 nem o corpo do Fastify; log `info` | `main.test.ts`, um caso por recusa, com status e corpo literais | must |
| 14 | U2 | `HEAD` só em páginas: `HEAD /` responde 200, `HEAD /api/status` responde 404 | `main.test.ts`, "HEAD" | must |
| 15 | U2 | Toda resposta leva CSP `script-src 'self'`, sem `unsafe-inline`, `frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, e nenhum cabeçalho de CORS | `main.test.ts`, "cabeçalhos" | must |
| 16 | U2 | Um pedido deixa uma linha de log com rota, status, duração e id; um `traceparent` recebido não aparece | `main.test.ts`, "log por pedido" | should |
| 17 | U2 | No primeiro SIGTERM o programa fecha e sai com 0 antes do prazo; um segundo sinal logo depois sai na hora com 1 | `main.test.ts`, "desligamento" e "segundo sinal" | must |
| 18 | U3 | A página mostra a marca, a versão informada pelo servidor em fonte mono e a frase; se a leitura falhar, mostra a frase da tabela de falhas e nenhuma versão | `apps/web/src/hub/status/status-page.test.tsx`, "mostra a versão", "mostra a falha" | must |
| 19 | U3 | Servida pela imagem, a página não deixa erro nem violação de CSP no console | Prova da U4, caso "console" | must |
| 20 | U1 | O CI recusa: import que fura parede, teste que importa o interior, teste que trava, zero testes, supressão sem mudar a contagem, documento acima do teto ou com link quebrado, mudança em skills ou guias com cartão em `docs/steps/` | `scripts/*.test.ts` e `scripts/rules.test.ts`, um caso ruim plantado por recusa, com o nome da recusa | must |
| 21 | U1 | O portão `ci` falha quando um job falha, é pulado ou cancelado | Pull request de ensaio da U1, casos "falha", "cancelado" | must |
| 22 | U1 | A linha de aprovação do cartão cita um commit ancestral da ponta, e o cartão não mudou desde ele | `scripts/check-approval.test.ts`, "commit fora da ponta", "cartão mudado" | must |
| 23 | U1 | O resumo do job lista toda dependência nova do pull request | `scripts/list-new-dependencies.test.ts`, "lista a nova" | must |
| 24 | U1 | O servidor roda `.ts` direto, e o Vite empacota a página que importa `@conexus/hub-api`, que aponta para `.ts` | Job `test` do CI | must |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| `http` (548 linhas) | Nova | `apps/server/src/platform/http.ts`, `access.ts` | Não se aplica | Carrega, por propósito: tipo de acesso por rota, recusado na subida (C33); 404 antes do corpo (S27); `HEAD` só em páginas (C30); erro em cinco campos, `type` `urn:conexus:problem:<CODE>` (C51); resposta conferida (C31); `trustProxy: false`, sem limite que leia o endereço (S29); um log por pedido (C46); erro pelo status (C50); CSP (S26); handler sem `request` (C14). Larga: três ouvintes e os tipos `sign-in`, `host-write`, `hub-entry` ([0018], [0014]); `session` e `sign-out`, refeitos na etapa 3; as listas à mão; os hashes de CSP do Mastra ([0033]); `forceCloseConnections`, `traceId` só em `SYSTEM`, `strict-origin` ("implementado assim") |
| Classe de erro (75) | Nova | `apps/server/src/platform/failure.ts` | Não se aplica | Carrega: uma classe com código da tabela (C49); `cause` nunca serializada; log com tipos e quadros da cadeia, sem mensagem (S41, C54). Larga: herdar `MastraError` |
| Tabela de falhas (JSON, gerador, duas cópias) | Nova | `packages/hub-api/src/failures.ts` | Não se aplica | Carrega: categoria, status, frase e ação (C48). Larga: o gerador, que servia a dois pacotes; agora um dono (C26) |
| Configuração (242) | Nova | `apps/server/src/platform/config.ts` | Não se aplica | Carrega: recusar subir nomeando o valor (C67). Larga: 30 de 33 variáveis; a saída 78, cuja base era o systemd |
| Logger, desligamento | Nova, nativa | `main.ts`, logger do Fastify, `close-with-grace` | Não se aplica | Carrega: fechar com prazo, segundo sinal sai na hora (C62). Larga: os tratadores à mão; trava de instância e migração vão para as etapas 2 e 3 |
| Tipo de operação (78) | Nova | `packages/hub-api/src/operation.ts` | Não se aplica | Carrega: uma declaração por operação (C28). Larga, até haver consumidor: entrada, `malformed`, `effects`, binário |
| Marca (41), fontes, `favicon.svg` | Trazida | `apps/web/src/brand/mark.tsx`, `fonts/`, `favicon.svg` | Tamanhos do logotipo em classes do Tailwind | Carrega: `aria-hidden` na marca, `aria-label` no logotipo (V31); as duas peças (V25); fontes locais (V14) |
| Tokens (143) | Nova, do guia de design | `apps/web/src/brand/tokens.css` | Não se aplica | Carrega: três blocos de tema (V4). Larga: `.light`/`.dark` do `ThemeProvider` ([0033]) e `cx-*` (W25) |
| CI antigo | Nova | `ci.yml`, `scripts/` | Não se aplica | Carrega: um portão que falha em job falho, pulado ou cancelado (L15), por expressão nativa |

Cookies e conferência de origem ficam para a etapa 3; o resto da etapa é novo, sem decisão antiga.

**A medida do transplante.** De `http`, cerca de 150 das 548 linhas têm consumidor nesta etapa, e
cada bloco muda mais de um terço; dos 35 casos de teste antigos, nenhum passa pela porta pública sem
mudar. Por isso essas partes nascem novas, e o que os testes antigos fixavam virou os critérios 9 a
17. A marca é trazida: o construtor da U3 conta as
linhas trazidas e mudadas no seu relatório e para se passar de um terço.

**A dívida.** Nenhuma.

## U1 Esqueleto

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `package.json`, `package-lock.json`, `.nvmrc`, `tsconfig.base.json`, `biome.json`, `.dependency-cruiser.cjs`, `knip.json`, `.gitignore` | Cria | npm, CI, ferramentas |
| `scripts/check-docs.ts`, `check-suppressions.ts`, `suppressions.json`, `check-approval.ts`, `check-method-freeze.ts`, `list-new-dependencies.ts`, `test-reporter.ts`, `rules.test.ts`, e um `*.test.ts` ao lado de cada script | Cria | scripts da raiz, `ci.yml` |
| `.github/workflows/ci.yml` | Cria | GitHub; o script de fusão do Firstmate lê o portão `ci` |

### Os contratos que a unidade cria

- Workspace npm com `apps/*` e `packages/*`. Scripts da raiz: `verify` (tudo o que o CI roda),
  `lint`, `typecheck`, `deps`, `knip`, `docs`, `test`, `build`. `test` e `build` rodam em cada
  workspace que os tiver.
- `.nvmrc` 24.21.0. TypeScript 6.0.3, porque o dependency-cruiser 18.4.0 não lê o 7.
  `tsconfig.base.json`: `strict`, `noEmit`, `module` e `moduleResolution` `nodenext`,
  `allowImportingTsExtensions`, `verbatimModuleSyntax`, `erasableSyntaxOnly`.
- Portas de teste do servidor (T5): `apps/server/src/main.ts`, todo `public.ts`, e um arquivo de
  `platform/` pelo teste ao lado dele, porque `platform` não tem `public.ts`.
- `suppressions.json`: `{ "<arquivo>": <número> }`; o CI falha se a contagem real diferir.
- A linha de aprovação, escrita pelo Firstmate no roteiro quando o fundador aprova:
  `Cartão da etapa <n> aprovado em <AAAA-MM-DD> (commit <sha>): "<palavras>"`. O primeiro CI da
  etapa a lê.
- `check-method-freeze.ts`: falha se o pull request muda `.agents/skills/` ou `docs/guides/` com um
  cartão em `docs/steps/` na ponta, salvo o rótulo `emergência`.
- `ci.yml`, em `pull_request` e `push` para `main`: jobs `check` e `test`, e `ci`, que depende de
  todos com `if: always()` e falha se algum resultado for `failure`, `cancelled` ou `skipped`. Cada
  job tem `timeout-minutes`, o prazo global de T3. Ações fixadas pelo SHA do commit da última versão
  com duas semanas.

### A ordem do trabalho

1. Workspace, `.nvmrc`, `tsconfig.base.json`, `.gitignore` com os arquivos de ambiente. Regras: C5,
   C24, C25, S37. Funções: npm workspaces; `typescript@6.0.3`.
2. Biome. Regras: C11, C12, C18, C20, C24, C25, C53, C67, C77, T21. Funções: `@biomejs/biome@2.5.14`:
   `lineWidth`, `noExcessiveLinesPerFunction`, `noExcessiveLinesPerFile`, `noDefaultExport`,
   `noProcessEnv`, `noNonNullAssertion`, `noExplicitAny`, `useImportType`, `noRestrictedImports`.
3. dependency-cruiser. Regras: C3 a C8, C56, T5, W1, W4 a W6, W13. Funções:
   `dependency-cruiser@18.4.0`, `forbidden` com `path`/`pathNot`, `circular`, `tsPreCompilationDeps`.
4. knip. Regra: C74. Funções: `knip@6.38.0`, `workspaces`.
5. Os scripts, cada um com o seu caso ruim e a data de revisão. Regras: C76, C78, L5, L6, L16, L20,
   L24, T4. Funções: `yaml@2.9.1`; um reporter de `node:test` que falha com zero testes.
6. `ci.yml`. Regras: L15, L16, T3. Funções: `actions/checkout`, `actions/setup-node`.

### Como se prova

`npm run verify` verde. Critério 20: `rules.test.ts` roda Biome e dependency-cruiser sobre arquivos
ruins num diretório temporário; cada script recusa o seu caso. Critério 21: o pull request da U1 roda
uma vez com um job que falha e uma vez cancelado. 22 e 23: num repositório Git temporário.

## U2 Servidor

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/package.json`, `tsconfig.json`, `src/index.ts`, `operation.ts`, `failures.ts`, `health.ts`, `status.ts` | Cria | `apps/server`, `apps/web` |
| `apps/server/package.json`, `tsconfig.json` | Cria | npm, CI, Dockerfile |
| `apps/server/src/main.ts`, `main.test.ts` | Cria | `CMD` da imagem; testes |
| `apps/server/src/platform/config.ts`, `failure.ts`, `access.ts`, `access.test.ts`, `http.ts`, `health.ts` | Cria | `main.ts`, `hub/status` |
| `apps/server/src/hub/status/public.ts`, `status.ts`, `status.test.ts` | Cria | `main.ts` |

### Os contratos que a unidade cria

- `type AccessKind = 'page' | 'public'`. `page`: `GET` e `HEAD` de `/`, `/favicon.svg` e
  `/assets/*`, sem credencial. `public`: `GET` em `/api/`, sem credencial. Fora disso, 404.
- `type Operation`: `id`, `summary`, `access`, `method`, `path`, `success`, `failures`.
- `getHealth`: `GET /api/health`, `public`, "Says the program is alive, without touching any
  database." 200 `Health = { status: 'LIVE' }`.
- `getStatus`: `GET /api/status`, `public`, "Reads the version of the Hub that is live." 200
  `HubStatus = { version: Version }`.
- `Version`: schema Zod de 40 caracteres hexadecimais com `.brand('Version')`; só `Version.parse`
  cria um.
- `FAILURES` e `FailureCode`: `INTERNAL_UNEXPECTED` (SYSTEM, 500), `NOT_FOUND` (USER, 404),
  `REQUEST_MALFORMED` (USER, 400; todo 4xx sem código próprio), `REQUEST_MEDIA_TYPE_UNSUPPORTED`
  (USER, 415), `CONFIG_INVALID` (SYSTEM, 500, só no log de subida). Cada linha com frase e ação em
  português.
- `Problem = { type, title, status, code, traceId }`; `traceId` é o id do pedido.
- `readConfig(env): Config`, `Config = { version: Version; port: number; logLevel: LogLevel }`, de
  `CONEXUS_VERSION`, `HUB_PORT` (1 a 65535) e `LOG_LEVEL` (`error`, `warn`, `info`, `debug`), todos
  obrigatórios. Falha `CONFIG_INVALID` com os nomes nos detalhes.
- `class Failure extends Error` (`code`, `details`); `logFailure(log, failure)`;
  `serve(app, operation, handler)`, com o handler tipado pela operação.
- `createStatus(deps: { version: Version })`: objeto congelado `{ read(): HubStatus }`.
- `createHub(config): Promise<FastifyInstance>` em `main.ts`, sem escutar. Com `import.meta.main`,
  `main.ts` lê a configuração, liga o `close-with-grace` e escuta em `0.0.0.0:HUB_PORT`.
- A página é servida de `apps/web/dist`, achada pelo caminho de `main.ts`; a imagem guarda esse
  desenho de pastas. Sem a pasta, `/` responde 404.
- Prazos: `requestTimeout` e `connectionTimeout` 30 s; `keepAliveTimeout` acima do keep-alive de
  origem do cloudflared lido na versão instalada; desligamento 15 s.

### A ordem do trabalho

1. `packages/hub-api`. Regras: C23, C26, C28, C29, C39, C40, C48. Funções: `zod@4.6.5`.
2. `failure.ts`, `config.ts`. Regras: C27, C49, C52 a C54, C67, S41. Funções: `z.prettifyError`.
3. `access.ts`. Regras: C14, C31, C33, C34, C42. Funções: `fastify@5.12.5` hooks `onRoute`,
   `onReady`, `onRequest`.
4. `http.ts`, `health.ts`. Regras: C43, C46, C47, C50, C51, C61, S24, S26, S27, S44. Funções: opções
   `requestTimeout`, `connectionTimeout`, `keepAliveTimeout`, `clientErrorHandler`,
   `disableRequestLogging`, `exposeHeadRoutes`, `trustProxy`, `genReqId`; `setErrorHandler`,
   `setNotFoundHandler`, hook `onResponse`; `@fastify/helmet@13.1.1` com `style-src 'self'`,
   `frame-ancestors 'none'`, `frameguard: deny`; `@fastify/static@10.1.5`, `immutable` em
   `/assets/`, `index.html` com `maxAge: 0`.
5. `hub/status`. Regras: C1, C2, C4, C13.
6. `main.ts`. Regras: C9, C62. Funções: `close-with-grace@2.5.0`, `import.meta.main`.

### Como se prova

`node --test`, porta 0. Critérios 11 a 16 por `createHub` e `inject`; o 10 pelo teste de
`access.ts`; o 9 e o 17 com `main.ts` em processo filho. Esperar o pedido em curso é do `close()` do
Fastify, lido e não provado aqui.

## U3 Página

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/package.json`, `tsconfig.json`, `index.html`, `vite.config.ts`, `vitest.config.ts`, `vitest.setup.ts` | Cria | Vite, Vitest, CI, Dockerfile |
| `apps/web/src/main.tsx` | Cria | `index.html` |
| `apps/web/src/platform/hub.ts`, `cache.ts` | Cria | `hub/status/queries.ts`, `main.tsx` |
| `apps/web/src/brand/tokens.css`, `mark.tsx`, `favicon.svg`, `fonts/` com as licenças OFL | Cria | `main.tsx`, `index.html`, `status-page.tsx` |
| `apps/web/src/hub/status/public.ts`, `queries.ts`, `status-page.tsx`, `status-page.test.tsx` | Cria | `main.tsx` |

### Os contratos que a unidade cria

- `hubQuery(operation)` em `platform/hub.ts`: monta o endereço pela operação, pede no mesmo domínio,
  valida a resposta com o schema da operação e lê toda falha como `Problem` (C49).
- `statusQuery` em `hub/status/queries.ts`, de `hubQuery(getStatus)`.
- `StatusPage`: marca, versão em `fact` (mono), frase em português.
- Sem roteador: `main.tsx` monta só o cache e a página; o estudo da interface, antes da etapa 3,
  traz `routes/`.

### A ordem do trabalho

1. `brand/`. Regras: V3, V4, V9 a V11, V14, W25. Funções: `tailwindcss@4.3.3` com `@theme`,
   `@tailwindcss/vite@4.3.3`.
2. `platform/`. Regras: W9, W13, C27, C49. Funções: `@tanstack/react-query@5.104.0`
   (`QueryClient`, `queryOptions`).
3. `hub/status`. Regras: W2, W19, W20, V38, V40, V43, C41. Funções: `useQuery`.
4. `main.tsx`, `index.html`, configurações. Funções: `vite@8.3.1`, `@vitejs/plugin-react@6.1.1`,
   `react@19.3.0`, `vitest@5.0.2`, `jsdom@30.1.1`, `@testing-library/react@16.3.3`, `msw@3.0.0`.

### Como se prova

Vitest e msw, com respostas que passam no schema de `getStatus`, achando por papel e texto (T7):
critério 18. O 19, no navegador, na prova da U4.

## U4 Publicar

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `infra/hub.Dockerfile`, `.dockerignore` | Cria | `ci.yml`, `publish.yml` |
| `infra/compose.yaml`, `infra/deploy.sh` | Cria | os dois workflows, pelo runner do servidor |
| `infra/setup-server.sh` | Cria | o Firstmate, uma vez, pelo how-to |
| `.github/workflows/publish.yml`, `rollback.yml` | Cria | GitHub, no push em `main`; o botão "Voltar atrás" |
| `.github/workflows/ci.yml` | Muda: o job `image` | o portão `ci` |
| `docs/how-to/hub-server.md`, `docs/index.md` | Cria, muda | o Firstmate; `check-docs` |
| `docs/decisions/0035-…` | Muda: o Resultado | `docs/index.md` |
| `docs/architecture.md` | Muda: seção 7 cita [0035] e o aviso segue a resposta do fundador; seção 11 ganha a linha do risco do runner (S47) | `docs/index.md` |

### Os contratos que a unidade cria

- Imagem `ghcr.io/developmentconexus-ops/conexus-hub:<commit>`, privada, de `node:24-slim` por
  digest, usuário `node`, `ARG`/`ENV CONEXUS_VERSION`, `HUB_PORT` e `LOG_LEVEL` definidos, `CMD node
  apps/server/src/main.ts`, sem arquivo de ambiente nem segredo.
- `compose.yaml`: `hub` por digest, `init: true`, `restart: unless-stopped`, verificação de saúde em
  `/api/health` com `node` e `fetch` (a imagem não tem `curl`), `stop_grace_period` acima de 15 s,
  nenhuma porta publicada; `cloudflared` `2026.10.0`, `tunnel --no-autoupdate run --token-file
  /run/secrets/tunnel_token`.
- Segredos: pasta `/etc/conexus/secrets/` (0700), um arquivo por segredo, 0400, dono o usuário do
  contêiner que o lê, montado como `secrets` do Compose; o ambiente leva só o caminho (S31). Nesta
  etapa, o token do túnel. A chave da instalação nasce aí na etapa 7, com a cópia do fundador no
  gerenciador de senhas dele. Nenhum segredo no GitHub.
- `deploy.sh <imagem>`: se a imagem já roda, não faz nada; senão guarda a que roda em
  `/var/lib/conexus/previous-image` e sobe a nova com `up --wait`; se não ficar saudável, volta a
  anterior e sai 1. `deploy.sh --previous`: sobe a anterior; sem ela, sai 2.
- `publish.yml`, no push em `main`: job `image` num runner do GitHub, que constrói e envia com
  `GITHUB_TOKEN` (`packages: write`) e apaga as versões além das dez últimas; job `deploy` em
  `[self-hosted, hub]`, que recusa ref diferente de `refs/heads/main`, entra no registro com o
  `GITHUB_TOKEN` do job (`packages: read`) e roda `deploy.sh` com o digest.
- `rollback.yml`: "Voltar atrás", `workflow_dispatch` sem entrada, mesmo runner e mesma recusa,
  roda `deploy.sh --previous`.
- Cloudflare, pelo Firstmate com a chave do fundador, apagada depois, e escrito no how-to: túnel,
  nome público do Hub para `http://hub:<HUB_PORT>`, DNS, token no servidor, Tunnel Health Alert ao
  e-mail do fundador. Com B, o monitor externo em `/api/health`, com o e-mail dele.

### A ordem do trabalho

1. Dockerfile, `.dockerignore`, job `image` em `ci.yml`. Regras: S37, [0002]. Funções: build em
   estágios; `npm ci --omit=dev` mantendo os links do workspace, porque o Node recusa `.ts` sob
   `node_modules`.
2. `compose.yaml`. Regras: S31, C61, C62. Funções: Docker Engine 29 e Compose v5 do repositório da
   Docker: `secrets` de arquivo, `init`, `healthcheck`, `restart`, `stop_grace_period`.
3. `deploy.sh`. Regras: C64, C73. Funções: `docker compose up --wait --wait-timeout`.
4. Os workflows. Regras: L13, L17. Funções: `docker/login-action`, `docker/build-push-action`,
   `actions/delete-package-versions`, fixadas por SHA como na U1.
5. `setup-server.sh` e o how-to: Docker, o runner como serviço de um usuário sem login no grupo
   `docker`, a pasta de segredos, o lado do Cloudflare, entrada fechada no firewall do provedor.
   O SSH, só com chave, fecha no fim, depois de provado o console do provedor como acesso de
   emergência; sem console, a unidade para e volta ao cartão (L7).
6. A prova, com U2 e U3 no ramo da etapa: as verificações do [0035] e os casos dos critérios 1, 2,
   8 e 19, registrados no pull request; o Resultado no registro, num commit à parte; as seções 7 e 11
   da arquitetura.

### Como se prova

No servidor, as verificações do [0035] e os casos "outro ramo", "sem anterior", "publicar duas
vezes", "travado" e "console", com o que rodou e o que apareceu. O job `image` constrói a imagem em
todo pull request.
