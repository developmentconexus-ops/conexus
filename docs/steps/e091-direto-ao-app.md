# Etapa 9.1: Direto ao app

## A página do fundador

**No fim desta etapa** quem entra pelo endereço de um app vê a tela de entrar e, logo depois, o
app, sem nenhuma tela do Hub no meio. No console do Neon, o projeto de cada empresa leva o apelido
dela no nome.

**O roteiro de uso.** No Hub publicado, com a Empresa A e a pasta `recados-1` da etapa 9.

1. Na Empresa A, crie o Projeto Pedidos (ou outro nome) e, em **Configurações**, envie
   `recados-1`. Aperte **Abrir app**: o Recados abre direto. Escreva um recado.
2. Saia do Hub. Abra `https://pedidos--<apelido da Empresa A>.conexusapp.tech/`: aparece **Entrar
   no Conexus**. Entre: a próxima tela é o Recados, com o recado. Não aparecem o menu do Hub, o
   título "Abrir app" nem "Abrindo o app…".
3. Troque `pedidos` por `nada` no endereço: "Este app não existe ou você não tem acesso a ele.",
   sem o menu do Hub, com o link **Ir para o Início**. O mesmo aparece para quem não é da empresa.
4. No console do Neon, na organização das empresas, o projeto da Empresa A se chama
   `<apelido>-<id da empresa>`, por exemplo `metalnobre-<32 letras e números>`, não
   mais `cx-…`. Abra o Recados de novo: o recado continua lá.
5. Crie uma empresa de teste, escolha o apelido e crie o primeiro Projeto: o projeto novo no Neon
   já nasce com `<apelido>-<id>`. Apague a empresa na Central: o projeto sai do console.

**O que você faz, e quando.** No começo: aprova esta página, e com ela as regras abaixo e as
chamadas da prova de U2. U2 usa a chave de prova da organização das empresas que já existe
(`cx-prova-e09`), a mesma da etapa 10; ela é apagada no fim da última das duas. Não há chave nova. No fim: faz o roteiro, diz o que viu e aprova os textos.

**As chamadas da prova de U2**, todas em projetos `cx-prova-`, apagados no fim: criar dois
projetos pelo SDK, buscar pelo id e por um pedaço do nome, renomear um e abrir uma conexão antes e
depois.

**Decisões já dadas** (2026-10-18): "Decisao 1: B": o Hub responde a passagem no servidor, com
redirecionamento direto ao app. "2. A": o nome é `<apelido>-<id>`, achado pelo final `-<id>`, e
os projetos que já existem são renomeados uma vez, sozinhos, quando o Hub sobe.

**O que muda nas regras, para você aprovar com esta página.**

- **S48 ganha um sexto tipo de acesso, `handoff`.** Só o endereço `/apps/open`, só leitura (GET),
  e o único que aceita uma navegação vinda de outro site, como a vinda do endereço do app. Ele só
  redireciona ou mostra "Este app não existe"; um `fetch` de outro site é recusado. Um navegador
  antigo, sem os cabeçalhos que dizem se é navegação, passa como hoje: o vínculo do navegador e o
  passe de uso único seguem protegendo.
- **S24 ganha uma frase**: esse endereço é a única exceção à mesma origem.
- **C36 ganha a exceção**: o passe de 60 s que esse GET grava, como o OAuth faz. **C35** diz que
  vale só para as operações da API; `/apps/open` não é uma.
- **O registro 0048** troca a chave do projeto no Neon de "o nome exato" (0040) para "o final
  `-<id>` exato", com a prova acima.

O texto delas fica na seção "As regras que mudam"; entra nos guias no pull request de fechamento
(delivery L20).

**Fica de fora.** O despachante não muda: continua mandando a `/apps/open`. Trocar o apelido pela
Central não existe ainda; quando existir, a partida renomeia. As issues `next-card` 25, 39 e 45:
nada nas pastas da 9.1.

**A decisão sua pedida nesta etapa.** Nenhuma pendente.

## As unidades

Base: `main` `20cde67` (v0.9.1). Estudo de 2026-10-18 e as respostas "Decisao 1: B" e "2. A".

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | Passagem por redirecionamento | `packages/hub-api/`, `apps/server/src/platform/`, `apps/server/src/hub/apps/`, `apps/web/src/`, `tests/e2e/`, `scripts/removals.json`, `package.json` | segurança | fastify-best-practices | a 9 fechada |
| U2 | Nome `<apelido>-<id>`, 0048 e a prova | `docs/decisions/`, `apps/server/src/platform/`, `apps/server/src/hub/projects/`, `apps/server/src/hub/operations/`, `docs/how-to/`, `docs/reference/`, `scripts/removals.json` | dados | neon:neon-postgres-agent-platforms | a chave `cx-prova-e09` |
| U3 | Renomear na partida | `apps/server/src/hub/projects/`, `apps/server/src/main.ts` | dados | neon:neon-postgres-agent-platforms | U2 |

U1 e U2 dividem `apps/server/src/platform/` e `scripts/removals.json`: uma depois da outra. Uma
revisão, um merge (L9, L13).

**Orçamento de código alterado** (sem testes nem gerados): U1 260 (120 escritas, 140 apagadas);
U2 120; U3 70. Total **450**, teto 4.000 (L2).

## Os critérios de aceite

| # | Unidade | Critério observável, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Uma rota `handoff` com outro método, outro caminho ou na escuta da borda: o servidor não sobe; `HEAD` ou `POST` em `/apps/open`: a página das telas com 404, nenhuma linha | `access.test.ts`, `app-handoff.test.ts` | must |
| 2 | U1 | `GET /apps/open` de membro, `Sec-Fetch-Site: cross-site`, `navigate`, `document`: 303 a `https://<rótulo>.<domínio>/__conexus/passagem?code=…`, `Referrer-Policy: no-referrer`, uma linha `apps.handoff`; cabeçalhos ausentes contam como navegação | `app-handoff.test.ts` | must |
| 3 | U1 | `Sec-Fetch-Mode` presente e diferente de `navigate`, ou `Sec-Fetch-Dest` presente e diferente de `document`: 403 `REQUEST_ORIGIN_REFUSED`, nenhuma linha | `access.test.ts`, `app-handoff.test.ts` | must |
| 4 | U1 | Sem sessão, ou sessão revogada, também entre a leitura e a gravação (`SESSION_REQUIRED`): 303 a `/login?redirect=` com o caminho e a busca codificados; nenhuma linha | idem | must |
| 5 | U1 | Rótulo desconhecido, de outra empresa, Projeto apagado, `host` ou `binding` fora da forma: 404 com a página das telas (`text/html`), nenhuma linha, o motivo só no registro (S10); banco fora: a página das telas com 503, nunca JSON | idem | must |
| 6 | U1 | `POST /api/apps/handoffs`: 404; o OpenAPI sem `createAppHandoff`; o registro nunca tem o `code` nem o `binding` (S41) | `app-handoff.test.ts`, `emit-openapi.test.ts` | must |
| 7 | U1 | Entrar com `redirect` em `/apps/open` carrega o documento (`reloadDocument`); outro `redirect` segue pelo roteador | `sign-in-form.test.tsx` | must |
| 8 | U1 | A tela `/apps/open`: sem moldura, a frase e **Ir para o Início**; a leitura da sessão falha: o `Error` comum; o roteador responde a `PAGES` e a `APP_OPEN_PATH` | `app-refused.test.tsx` (novo), `__root.test.tsx` | must |
| 9 | U1 | Chromium: endereço do app sem sessão do Hub → `/login` → o app; nenhum documento do Hub entre o login e o app; com sessão, **Abrir app** → o app; o Hub recebeu o cookie, `cross-site`, `navigate` e `document`; um `fetch` do app para `/apps/open`: recusado | `tests/e2e/app-open.test.ts` (novo) | must |
| 10 | U1 | Linhas `handoff-navigation-only` e `handoff-get-only` de `removals.json`: `caught` | `removals` | must |
| 11 | U2 | 0048 "Proposed" antes da prova; Result com as checagens 1 a 4 e as versões; nada `cx-prova-` vivo | o registro | must |
| 12 | U2 | `companyProjectName` dá `<apelido>-<id>`; `find(companyId)` acha `cx-<id>` e `<apelido>-<id>`, não acha `<x>-<id>y`, `<id>-x` nem outro id; o apelido de 30 dá 63 caracteres | `neon.test.ts` | must |
| 13 | U2 | O primeiro Projeto cria `<apelido>-<id>`; resposta cortada e nova tentativa adotam o achado pelo final, sem criar outro | `projects-database.test.ts` | must |
| 14 | U2 | Apagar a empresa apaga o projeto achado pelo final, `cx-<id>` incluído | `client-deletion-database.test.ts` | must |
| 15 | U3 | Ao subir: o projeto que o Hub registrou com nome velho sai `<apelido>-<id>`; a segunda partida não chama `rename`; projeto sem empresa ou não registrado fica; Neon fora: o Hub sobe e registra `COMPANY_DATABASE_RENAME_FAILED`; projeto apagado no meio (`not_found`): nada | `company-database-names.test.ts` (novo) | must |
| 16 | U1–U3 | `tests/e2e/app.test.ts` e `versions.test.ts` pela corrente nova | os testes | must |
| 17 | U1–U3 | Publicado: os passos 1 a 5 | firstmate (T13, T14) | must |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- |
| `/apps/open` (só quando o servidor recusa) | — | `Loading` comum enquanto lê a sessão | a leitura da sessão falha: `Error` comum com a frase da falha | "Este app não existe ou você não tem acesso a ele." e **Ir para o Início** | igual ao não encontrado (S10) |
| Entrar | a de hoje | a de hoje | a de hoje | — | a de hoje |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `host`, `binding` da busca de `/apps/open` | o despachante (`dispatch.ts`, sem mudança) | a rota `handoff` |
| `Location` do 303 | a rota `handoff` | o navegador; o despachante em `/__conexus/passagem` |
| `redirect` de `/login` | a rota `handoff` | `SignInForm` |
| `NeonProject.name` | o Neon | `find`, a passada de nomes |
| `NeonProject.id` | o Neon | `prepareDatabase`, a exclusão, a passada de nomes |
| `company_database.neon_project_id` | `markReady` (sem mudança) | a exclusão, a passada de nomes |

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Uma dependência fora | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `GET /apps/open` grava `apps.handoff` | dois passes; o primeiro resgatado vale, o outro vence em 60 s | uma instrução, uma transação: nada fica | banco: a página das telas com 503, `Error` comum | `APP_HANDOFF_CREATED` com `companyId`, `projectId` | 2, 4, 5, 8 |
| `projects.create` com o nome novo (biblioteca) | a reserva da 7 deixa um só | `NO_ANSWER` mantém a reserva; a próxima acha pelo final | `COMPANY_DATABASE_UNAVAILABLE`, como hoje | `NEON_FAILED` com o motivo | 13 |
| `projects.update` com o nome (biblioteca) | duas partidas dão o mesmo nome; repetir não causa dano; a exclusão apagou o projeto: `not_found`, nada a fazer | `NO_ANSWER`: fica para a próxima partida | o Hub sobe; a empresa fica para a próxima | `COMPANY_DATABASE_RENAMED` com `companyId`, `neonProjectId`; `COMPANY_DATABASE_RENAME_FAILED` com `companyId`, `reason` | 15 |
| `projects.delete` pelo achado no final | o `not_found` da 7 vale como apagado | `CLIENT_DELETION_PENDING`, como hoje | idem | `COMPANY_DATABASE_DELETED` | 14 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Tipo de acesso `handoff` | Nova | `apps/server/src/platform/access.ts` | — | S24, S48, pelo propósito |
| Rota `GET /apps/open` | Nova, no lugar de `createAppHandoff` | `apps/server/src/hub/apps/routes.ts` | — | S22, sem mudança |
| Tela de recusa sem moldura | Nova, no lugar de `open-app.tsx` | `apps/web/src/hub/apps/app-refused.tsx`, `apps/web/src/routes/_public/apps/open.tsx` | — | S10 |
| Nome e busca do projeto Neon | Nova, no lugar de `companyProjectName` | `apps/server/src/platform/neon.ts` | — | 0040, a chave exata pelo id |
| Passada de nomes na partida | Nova | `apps/server/src/hub/projects/company-database.ts` | — | arquitetura §8 |

**A medida do transplante.** Nada vem do código antigo.

**A dívida.** O despachante escreve `/apps/open` à mão (`dispatch.ts:65`); passa a ler
`APP_OPEN_PATH` quando a borda mudar de novo.

## As regras que mudam

Texto para o pull request de fechamento (L20); a construção segue o cartão aprovado (L7).

- **S48**, troca "The five access kinds" por "The six access kinds" e acrescenta, antes de
  "Writes follow S24": "`handoff`, a top-level `GET` of `/apps/open` on the public listener, the
  only route that accepts a navigation from another site: `Sec-Fetch-Site` may be any value when
  `Sec-Fetch-Mode` is `navigate` and `Sec-Fetch-Dest` is `document`, each or absent; its session is
  read first and may be absent; it answers a 303 or the screens' page with 404, never a body that
  names the person." Fim: "…the fifth with step 8's, the sixth with step 9.1's."
- **S24**, depois de "the browser leaves only for app handoff": "whose one door is the `handoff`
  kind of S48, the single exception to same-origin."
- **S48**, no `page`: "a read of any address outside `/api/` but `/apps/open`".
- **C35**, ao fim: "An operation's path; the `handoff` route of security S48 is not an operation."
- **C36**, ao fim: "The `handoff` kind of security S48 writes a one-use pass on `GET`, as an OAuth
  authorization endpoint does; a prefetch makes at most a pass that expires unused."
- **0048. A company's Neon project named by its nickname and id.** Decision: 2A, `<nickname>-<companyId>`;
  `find` lists with `search` set to the id and keeps the names ending exactly in `-<companyId>`, so
  `cx-<id>` still matches; the start renames once. Amends 0040's criterion 2 ("One exact name").
  Criterion: 1, create `cx-prova-<21 characters>-<32-character id>`, 63 characters: the name comes back
  exact; 2, `list` with `search` set to the 32-character id, and to a middle piece of the name, finds it; 3, `update`
  renames: project id, endpoint host and the owner connection string unchanged, a connection opened
  before answers after; 4, none left. If 2 fails, `find` lists the organization without `search`
  (0040 T3A: it holds only companies' projects). 0040 gains under State: "Its find key: 0048."

## U1 Passagem por redirecionamento

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/apps.ts`, `operation.ts`, `pages.ts`, `index.ts` | Muda; apaga `createAppHandoff` | servidor, web, `apps/edge/` (só `HANDOFF_PATH`, `createAppSession`) |
| `apps/server/src/platform/access.ts`, `http.ts` | Muda | toda rota |
| `apps/server/src/hub/apps/routes.ts`, `public.ts` | Muda | `apps/server/src/main.ts` |
| `apps/web/src/hub/apps/` (`open-app.tsx`, `.test.tsx`, `queries.ts`, `public.ts`), `routes/_app/apps/open.tsx` | Apaga ou troca | `routeTree.gen.ts` |
| `apps/web/src/routes/_public/apps/open.tsx`, `hub/apps/app-refused.tsx` | Cria | `routeTree.gen.ts` |
| `apps/web/src/hub/identity/sign-in-form.tsx` | Muda | `routes/_public/login.tsx` |
| `apps/web/src/routes/__root.test.tsx`, `apps/web/sweep-app-states.ts` (os estados de `/apps/open`: recusado e erro da sessão) | Muda | — |
| `tests/e2e/app.test.ts`, `versions.test.ts`, `apps-edge.ts`, `live-hub.ts`, `app-open.test.ts` | Muda; cria o último | — |
| `scripts/removals.json` | Muda: `handoff-navigation-only`, `handoff-get-only`; `write-origin-checked` e `edge-port-only` seguem | `npm run removals` |
| `package.json` da raiz | Muda: o script `e2e` lista `app-open.test.ts` | CI |

### Os contratos que a unidade cria

- `AccessKind` = `'page' | 'public' | 'entry' | 'session' | 'edge' | 'handoff'`, também no
  `AccessConfig` e no `ALLOWED` de `access.ts`. `Operation.access` passa a
  `Exclude<AccessKind, 'handoff'>`: nenhuma operação declara `handoff`.
- `APP_OPEN_PATH = '/apps/open'` e `AppOpenQuery = z.object({ host: HostLabel, binding: DoorSecret })`
  em `apps.ts`. `PAGES` perde `'/apps/open'`.
- Rota `GET /apps/open`, acesso `handoff`, escuta pública. Entrada: `AppOpenQuery` na busca.
  Saídas: 303 ao passe; 303 a `/login?redirect=`; 404 com `index.html`; 403
  `REQUEST_ORIGIN_REFUSED`; `SESSION_REQUIRED`, 303 ao login; outra falha, `index.html` com o status dela. Nunca JSON a uma navegação.
- `optionalSessionOf(request): SignedIn | undefined`, o `invitationSessionOf` de hoje com o nome
  geral, lido pelas rotas de convite e pela `handoff`.
- `sendPage(reply, status)` em `http.ts`: a página das telas com o status, usada pelo `NotFound` e
  pela `handoff`.

### A ordem do trabalho

1. O tipo `handoff` e o teste dele. Regras: C33, S24, S48 do cartão. O `checkSite` atual segue
   para os outros tipos.
2. A rota: lê a busca (fora da forma, 404), a sessão (ausente, 303 ao login), chama
   `createHandoff` sem mudança e responde 303. Regras: S10, S22, S41, C36 do cartão. Funções:
   `fastify` 5.12.5: `reply.redirect(url, 303)`.
3. A tela e o login. Regras: W1, W28. Funções: `@tanstack/react-router` 1.170.44:
   `router.navigate({ href, reloadDocument: true })`, só quando o caminho é `APP_OPEN_PATH`.
4. Apaga `createAppHandoff`, `openAppHandoff`, `open-app.tsx` e a rota antiga; os testes e a
   varredura seguem a corrente nova.

### Como se prova

`npm run test -w @conexus/server` (1 a 6), `npm run test -w @conexus/web` (7, 8),
`npm run e2e` (9, 16), `npm run removals` (10). O 9 prova no Chromium o que o estudo não
rodou: a navegação vinda do host do app leva o cookie `SameSite=Lax` do Hub e chega com
`cross-site`, `navigate`, `document`; se o arnês não puser os dois sites num navegador, a unidade
para e volta ao cartão.

## U2 Nome `<apelido>-<id>`

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/decisions/0048-…md`, `0040-…md`, `docs/index.md` | Cria; muda o State; a linha do 0048 | — |
| `apps/server/src/platform/neon.ts`, `test-neon.ts`, `neon.test.ts` | Muda | `hub/projects/`, `hub/operations/`, `main.ts`, `platform/test-app-ports.ts`, `hub/identity/test-hub.ts` |
| `projects-database.test.ts`, `projects-delete.test.ts`, `client-deletion-database.test.ts` | Muda: o nome novo e `find(companyId)` | — |
| `apps/server/src/hub/projects/company-database.ts`, `projects.ts`, `company-deletion.ts` | Muda | `hub/operations/` |
| `docs/how-to/hub-company-databases.md`, `docs/reference/boundaries.md` | Muda: "exact name" passa a "exact `-<id>` ending" | — |
| `scripts/removals.json` | `neon-exact-name` vira `neon-exact-suffix` (teste "find devolve só o final exato"); `company-database-claim`, `deletion-live-claim`, `deletion-removes-projects`, `deletion-neon-not-found` seguem e são conferidas | `npm run removals` |

### Os contratos que a unidade cria

- `NeonProjectName`: `^[a-z0-9]+(-[a-z0-9]+)*-[A-Za-z0-9]{32}$`, até 64 caracteres.
- `companyProjectName(input: { nickname: CompanyNickname; companyId: CompanyId }): NeonProjectName`.
- `export type NeonProject = { id: NeonProjectId; name: string }` e `NeonAnswer`, exportados de
  `neon.ts`.
- `NeonProjects.find(companyId: CompanyId): Promise<NeonAnswer<NeonProject[]>>`;
  `list(): Promise<NeonAnswer<NeonProject[]>>`;
  `rename(id: NeonProjectId, name: NeonProjectName): Promise<NeonAnswer<'renamed'>>`.
- `prepareDatabase(neon, input: { companyId; nickname })`. O apelido é lido hoje em `hostLabelFor`,
  dentro de `enterCreation`; os dois passam a devolvê-lo, e o `CLAIMED` da primeira transação de
  `create` o leva a `prepareDatabase`, fora de transação.
- `company-deletion.ts` chama `find(companyId)` e apaga os ids dos `NeonProject` achados.

### A ordem do trabalho

1. 0048 "Proposed", a prova com a chave `cx-prova-e09`, o Result. Regras: T14, L21. Funções:
   `@neon/sdk` 7.3.0: `projects.list({ search, org_id })`, `projects.update({ projectId, name })`,
   `postgres.connectionString`.
2. O adaptador, o falso e os chamadores. Regras: C56, C37, D22. O falso busca como a prova mostrou.
3. O how-to e a referência.

### Como se prova

`npm run test -w @conexus/server` (12 a 14), `npm run removals`, o registro (11).

## U3 Renomear na partida

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/projects/company-database.ts`, `public.ts` | Muda | `main.ts` |
| `apps/server/src/main.ts` | Muda: chama a passada depois de `LISTENING`, ao lado de `apps.repair()` | `main.test.ts` |
| `apps/server/src/hub/projects/company-database-names.test.ts` | Cria | — |

### Os contratos que a unidade cria

`Projects.nameDatabases(): Promise<void>`: um `list` da organização; para cada projeto cujo nome
termina em `-<CompanyId>`, lê no escopo da empresa a linha `ready` e o apelido; só renomeia o
projeto que o Hub registrou (`neon_project_id` igual) e cujo nome difere. Sem migração: nenhuma
leitura atravessa empresas.

### A ordem do trabalho

1. A passada e o teste. Regras: S41, D22, arquitetura §8. Uma falha por empresa fica no registro e
   não para as outras.
2. A chamada em `main.ts`. A partida nunca espera o Neon.

### Como se prova

`npm run test -w @conexus/server` (15); publicado, o passo 4 do roteiro (17).
