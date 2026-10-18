# Etapa 8: App de exemplo

## A página do fundador

**No fim desta etapa** quem é da empresa e está no Hub abre o app de um Projeto no endereço dele;
mais ninguém abre; apagar o Projeto fecha o endereço.

**O roteiro de uso.** No Hub publicado. Antes: a Central cadastra a Empresa A, com o
dono na segunda caixa.

1. Na segunda caixa, aceite o convite: antes dos lugares da empresa, o Hub pede só o apelido,
   sugerido do nome ("empresa-a"), com o endereço que ele dá. "conexus": "Esse apelido é
   reservado." Salve "empresa-a": abrem os Projetos. Convide um membro na terceira caixa.
2. Crie "Pedidos": o formulário mostra `pedidos--empresa-a.<dominio>`. Abra Pedidos e clique em
   **Abrir app**: o navegador passa pelo Hub e mostra "Olá, <seu nome>. Este é o app do Projeto
   Pedidos." no endereço do app.
3. Na janela do membro, abra o mesmo endereço: abre. Numa janela anônima: vai para **Entrar**, e
   depois de entrar volta ao app; com uma conta de fora de A: "Este app não existe ou você não tem
   acesso a ele."
4. Na janela do membro, saia do Hub e recarregue o app: vai para **Entrar**. O app não tem **Sair**.
5. Na janela do dono, apague Pedidos. Recarregue o app: "Este app não existe."

**O que você faz, e quando.** Antes de U1: escolhe o domínio dos apps e confirma que é zona da
conta Cloudflare do Conexus por 2 anos ou mais, e que a conta tem o Workers for Platforms (US$ 25
por mês; assina se faltar); cria o token da prova (Workers Scripts e Routes, DNS da zona dos
apps, Connectivity Directory Admin, Tunnel leitura) e o apaga no fim. Com esta página: autoriza as
chamadas da prova. Antes de U2: a palavra do grant (D11). Antes de U6: um token só de publicar, num
arquivo protegido do servidor (0035); autoriza as criações da U6 e o app de ataque da U7. No
fim: o roteiro e os textos.

**As chamadas da prova U1**, todas `cx-prova-`, apagadas no fim: `wrangler dispatch-namespace
create`; `wrangler vpc service create`, pelo túnel do servidor à porta 8081 de um contêiner
`docker run --rm` na rede do Compose, sem porta publicada; um registro DNS `*` pela API; `wrangler
deploy` do despachante, do muro e de três apps, com a rota `*.<dominio>/*`; de fora,
`https` e um Chromium sem tela; os `delete` de cada um.

**Decisões já dadas** (2026-10-17): 1A; 2 `estoque--metal-nobre.<dominio>`; 2.2A; 3A; 4A; 5A. O
apelido: o dono o escolhe na configuração inicial (troca 2.1A); fixo na 8, a Central muda depois
(troca 2.3A); o firstmate apaga as empresas de teste antes de publicar; reservados A. O endereço é
guardado, único, até 63; renomear não o muda. Por isso o nome de um Projeto precisa de três letras
ou números ("TI" daria `ti--`, forma reservada), e um nome longo é cortado no endereço.

**O que muda na regra.** Um acesso novo, `edge`, só do despachante: issue 97, no PR de fechamento
da 7 (L20).

**O grant de U2.** O login do Hub grava passagens e sessões de app e acha o Projeto pelo endereço;
as rotas da empresa gravam o apelido.

**Fica de fora.** Banco da empresa, versões e envio (a 9). Limites (a 10). Preview (a 14). Quem só
usa um app (a 18). Renomear.

**A decisão sua pedida nesta etapa.** Quem publica a borda. A (recomendada, a deste cartão): o
runner do servidor, com o token num arquivo de lá (0035). B: um trabalho do GitHub, com o token num
segredo do GitHub, reabrindo 0035. Quem usa não vê diferença; com B, quem muda o fluxo alcança
o token.

## O que mudou desde o estudo

O registro é 0041 (a 7 tomou 0040). O `--` dispensa código de colisão. A sessão do app
vive com a do Hub (S18), sem **Sair**. Todo Projeto roda o exemplo (C30). **Abrir app** passa por
uma tela do Hub, para que o login volte a ela (C33, C35, C36, S48).

**Encaixes da etapa 7** (cartão em `main`; construção em `feat/conexus-e07-build`,
https://github.com/developmentconexus-ops/conexus/pull/95, lida em `1cab638`), conferidos quando a 7
entrar; se um faltar, a construção para:

| # | Encaixe | Onde |
| --- | --- | --- |
| E1 | `projects.project`; `insertProject` nas transações 1 e 2; `deleteProject` apaga a linha | `hub/projects/` |
| E2 | `auth.company.deleting_since`; `admitMember` com `readProjects` (`MEMBER`) recusa marcada com `NOT_FOUND` | `identity/` |
| E3 | `$companyId/projects/$projectId.tsx`, `create-project-form.tsx`; o guarda de `_app` vai a `/login?redirect=` e volta | `apps/web/src/` |
| E4 | `project-failures.ts` em `FAILURES`; `AccessKind` | `hub-api` |
| E5 | Nada no banco da empresa | cartão 7 |

## As issues abertas

88, 89 e 90 são da 6, fora do tema; nenhuma `next-card`. **Issues futuras**, abertas no fechamento:
a Public Suffix List e cookies entre apps irmãos (a 18); o que muda na borda se a prova
cair em 4B; um trabalho agendado que apague passagens vencidas.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | Registro 0041 e a prova | `docs/decisions/` | testes | cloudflare:wrangler, cloudflare:workers-best-practices | autorização |
| U2 | Tabelas, função, grants (PR próprio) | migrações | dados | neon-postgres | U1, D11, a 7 em `main` |
| U3 | Apelido, endereço, passagem, checagem | servidor, `hub-api` | segurança | better-auth-best-practices, fastify-best-practices | U2, a issue 97 |
| U4 | Despachante, muro, contrato, exemplo | `apps/edge/`, `app-contract` | segurança | cloudflare:workers-best-practices, cloudflare:wrangler | U1; o contrato de U3 |
| U5 | As telas | web | web | shadcn | U3 |
| U6 | Publicar e voltar a borda; 0042 | `.github/`, `infra/` | entrega | cloudflare:wrangler | U4, a decisão |
| U7 | Percurso e remoções | `tests/e2e/`, `scripts/` | testes | nenhuma | U5, U6 |

U4 e U5 correm após o contrato de U3. Uma revisão, um merge (L9, L13); a prova
não cria release (L17).

**Orçamento de código alterado** (sem testes nem gerados): U1 **0**; U2 **200**; U3 **650**, ~250
trazidas; U4 **600**; U5 **400**; U6 **200**; U7 **150**; espalhados **100**. Total **2.300**, teto
4.000 (L2).

## Os critérios de aceite

| # | Unidade | Critério observável, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | 0041 "proposed" antes de código; o Result, com a versão do `wrangler`; nenhum `cx-prova-` vivo | o registro | must |
| 2 | U2 | Colunas, restrições, função e grants do contrato; catálogo igual ao arquivo | `catalog.test.ts` | must |
| 3 | U2 | Uma empresa não grava apelido nem endereço de outra; a função devolve só `(project_id, company_id)`, só ao Hub | `isolation.test.ts` “apps” | must |
| 4 | U3 | `setCompanyNickname`, dono: 200; o mesmo: 200; outro: 409 `_SET`; tomado: 409 `_TAKEN`; reservado: 422 `_RESERVED`; forma: 400; administrador, membro, outra empresa: 404 (S10); duas juntas: um 200 | `companies.test.ts` “apelido”, barreira (C65) | must |
| 5 | U3 | `<nome>--<apelido>`, até 63, o nome cortado sem `-` nas pontas; "Ação" após "Acao": 409; menos de três letras ou dígitos: 422; sem apelido: 409 `COMPANY_SETUP_PENDING` | `address.test.ts`, `projects.test.ts` | must |
| 6 | U3 | `createAppHandoff`, membro: 201; sem sessão: 401; host desconhecido, outra empresa, empresa marcada: a mesma 404 (S10) | `app-handoff.test.ts` | must |
| 7 | U3 | Código com outro vínculo, outro host, vencido, certo, de novo: 403, 403, 403, 201, 403 (LT2); dois juntos: um 201 | idem, barreira | must |
| 8 | U3 | Checagem: 200; outro host, sessão do Hub apagada ou vencida: 401; tirado, empresa marcada: 403; Projeto apagado: 404; na chamada seguinte | idem | must |
| 9 | U3 | Chamada a uma `edge` na porta pública, ou a outra na de borda: 404; registrar `edge` na pública: o servidor não sobe | `access.test.ts` | must |
| 10 | U3 | Os registros da tabela de falhas, com ids; nunca código, sessão ou nome (S41) | idem | must |
| 11 | U4 | Primeira visita: vínculo, 303 ao Hub; passagem certa: sessão, 303 a `/`; 401: ao Hub; o resto, as páginas da matriz | `dispatcher.test.ts` | must |
| 12 | U4 | O app não recebe cookie `__Host-conexus-*` nem `/__conexus/`; o `Set-Cookie` dele com o prefixo sai; escrita de outro site: 403; CSP e cabeçalhos de S24 | `dispatcher.test.ts` “app” | must |
| 13 | U4 | `props` leva só `caller`; o exemplo mostra o nome da pessoa e do Projeto | `apps/edge/example/example.test.ts` | must |
| 14 | U5 | Cada célula da matriz; sem apelido, só a configuração; **Abrir app** a todos; `/apps/open` sem sessão: **Entrar** e volta; T23, também nas páginas do despachante | os testes de U5, navegador | must |
| 15 | U6 | O Release publica o Hub e depois a borda; a volta, a borda antes; na 7.x voltada, Criar Projeto funciona; o token fora de log | Release de ensaio | must |
| 16 | U7 | Tirar qualquer proteção com linha em `removals.json` faz o seu teste falhar | `npm run removals` | must |
| 17 | U7 | O roteiro, despachante em Node, namespace falso, Hub real nas duas portas | `tests/e2e/app.test.ts` | must |
| 18 | U7 | Publicado: passos 2 a 5; um app de ataque; LT13; a 8081 calada de fora | firstmate (T13, T14) | must |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido, recusado ou concorrência |
| --- | --- | --- | --- | --- | --- |
| Configurar a empresa (dono, sem apelido) | o campo Apelido, sugerido, e o endereço ao digitar | "Salvando…" | 409, 422 no campo; 503 e **Tentar de novo** | `NotFound`, também a outro papel | `COMPANY_NICKNAME_SET`: relê e abre Projetos |
| Criar Projeto | 7, e o endereço montado | 7 | 409, 422 de endereço no campo Nome | 7 | 7 |
| Projeto | nome, data, endereço, **Abrir app**; sem endereço, sem o botão | 7 | 7 | 7 | — |
| Hub, abrir app (`/apps/open`) | — | "Abrindo o app…" | 503 e **Tentar de novo** | "Este app não existe ou você não tem acesso a ele." | sem sessão: **Entrar**, e volta |
| App, primeira visita | vai ao Hub e volta | — | — | — | — |
| App | o exemplo | — | Hub fora: "O Conexus está fora do ar. Tente de novo em alguns minutos." 503; app: "O app não conseguiu responder agora." 502 | "Este app não existe." 404 | código recusado: "Este link de acesso não vale mais. Abra o app pelo Conexus." 403; tirado: "Você não tem acesso a este app." 403 |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Project.address`, `null` se feito na 7.x voltada | `insertProject` | página do Projeto |
| `Company.nickname` (`null` antes da configuração), `Company.appsDomain` (o `APPS_DOMAIN`) | rotas da empresa | configuração, formulário |
| `createAppHandoff` `{host, binding}` → `{location}` | tela `/apps/open` | Hub |
| `createAppSession`, `checkAppCall` | despachante | Hub, que devolve `Caller` ao app por `props` |

Falhas novas (C48), USER e settles salvo dito:
`COMPANY_NICKNAME_TAKEN` 409, "Esse apelido já é usado por outra empresa." / "Escolha outro.";
`COMPANY_NICKNAME_RESERVED` 422, "Esse apelido é reservado." / "Escolha outro.";
`COMPANY_NICKNAME_SET` 409, "O apelido já foi escolhido."; `PROJECT_ADDRESS_TAKEN` 409, "Já existe um
Projeto com esse endereço nesta empresa." / "Mude o nome."; `PROJECT_NAME_NO_ADDRESS` 422, "O nome
precisa ter ao menos três letras ou números."; `COMPANY_SETUP_PENDING` 409, SYSTEM;
`APP_HANDOFF_INVALID` 403; `APP_SESSION_INVALID` 401; `APP_ACCESS_REFUSED` 403; `APP_NOT_FOUND` 404.

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Dependência fora | O que imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Apelido; endereço em `insertProject` | `lockCompany`; único: 409 | rollback | banco: 503 | `COMPANY_NICKNAME_CHOSEN`, `PROJECT_CREATED` | 4, 5 |
| Emitir; resgatar por `DELETE … RETURNING` | cada uma vale uma vez; o segundo, 403 | rollback | banco: 503; corte: de novo ao Hub | `APP_HANDOFF_CREATED`, `APP_SESSION_CREATED` | 6, 7, 11 |
| Checar (leitura) | — | — | banco ou VPC: 503 | `APP_ACCESS_REFUSED` | 8, 11 |
| Migrações de U2 | uma vez no `migrate` (D9) | uma transação | `migrate` falha | código do `migrate` | 2 |
| Publicar a borda (runner) | `concurrency` do workflow | a borda anterior segue | Cloudflare: o Release falha | a saída do `wrangler` | 15 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Passagem e sessão | trazida | `hub/apps/handoff.ts` | sem Keycloak nem `workspace_id` | resgate atômico, 60 s (`application-host-routes.ts:64-84`); LT2 |
| CSP do app | trazida | `apps/edge/src/headers.ts` | para `Headers` | `application-csp.ts:4,14`; LT13 |
| Borda, contrato, exemplo | nova | `apps/edge/`, `packages/app-contract/` | — | [0018], [0019], S4 |
| Apelido e endereço | nova | `identity/nickname.ts`, `hub-api/src/address.ts` | — | [0024], resposta 2 |

**A medida do transplante.** ~250 de ~457 linhas (auditoria 3.10), menos de um terço mudado; CSP: 14.

**A dívida.** Passagens vencidas, e as de um Projeto apagado (`deleteProject`,
`deleteCompanyProjects` da 7; a checagem dá 404), saem só com a sessão do Hub, até o primeiro
trabalho agendado (§11). `host_label` anulável até a 9.

**Fechamento da 8.** 0024 ganha o formato do endereço e a palavra de 2026-10-17; 0039: o Hub lê `apps` sem
escopo, pois acha a linha pelo hash antes de saber a empresa; a arquitetura §8, a sessão de app dentro da do Hub.

## U1 Registro e prova

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/decisions/0041-app-session-check-through-workers-vpc.md`, `docs/index.md` | cria; a linha | U3, U4, `check-docs` |

### Os contratos que a unidade cria

0041: a checagem pergunta ao Hub pelo Workers VPC; a saída é 4B. Critério: (1) o despachante, que tem `dispatch_namespaces`, alcança
`cx-prova-borda:8081` pelo VPC; (2) a 8081 por endereço público: nada; (3) o muro recusa `fetch`,
`connect` e WebSocket do app; (4) `limits.cpu_ms` 50 no envio corta um laço em menos de 3 s; (5)
certificado válido em `x.<dominio>`, nenhum em `a.b.<dominio>`; (6) `ctx.props` chega ao app; (7)
LT13 no Chromium; (8) os tempos pelo VPC, de onde sai `HUB_CHECK_DEADLINE_MS`. Se 1 ou 2 falhar, a
8 volta ao fundador, com 4B. Fora: o Hub real (U7), carga.

### A ordem do trabalho

PR só de documentos (L13). A prova roda fora do repositório, com o `wrangler` mais novo, cujas
opções saem do `--help`; o Result registra a versão, que U4 fixa. Túnel em QUIC (UDP 7844). Regras:
L13, L21, T13, T14.

### Como se prova

1: o Result de 0041.

## U2 Tabelas, função e grants

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/migrations/`, `database-grants.sql`, `isolation.test.ts` | duas migrações; os grants; caso “apps” | `migrate`, `catalog.test.ts` |
| `hub/apps/tables.ts`; `hub/projects/tables.ts`; `hub/identity/tables.ts`, `auth.ts` | cria; `hostLabel`; `company.nickname`, `input: false` | U3 |
| `scripts/removals.json` | `nickname-unique`, `host-label-unique`, `host-lookup-definer` | `npm run removals` |

### Os contratos que a unidade cria

`auth.company.nickname` text anulável, único, check `^[a-z0-9]+(-[a-z0-9]+)*$` e 3 a 30.
`projects.project.host_label` text anulável, único, duas dessas formas unidas por `--`, até 63.
Esquema `apps` (D4), tudo not null: `handoff` (`code_hash` PK; `binding_hash`, `host_label`,
`person_id`, `company_id`, `project_id`; `hub_session_id` a `auth.session(id)` `ON DELETE CASCADE`,
D17; `expires_at`); `app_session` (`token_hash` PK; os mesmos, sem `binding_hash` e `expires_at`).
Só hashes (S22); lidos sem escopo, como `auth.session`.
`projects.project_of_host(label text) returns table(project_id text, company_id text)`, `SECURITY
DEFINER` de um papel NOLOGIN, como [0039] A1. Grants:
`hub_runtime` SELECT, INSERT, DELETE nas duas, EXECUTE na função, USAGE no esquema; `hub_company`
UPDATE(`nickname`) em `auth.company`.

### A ordem do trabalho

PR próprio, à espera da palavra (D11). Só adiciona (D6): `host_label` anulável, para a 7.x voltada
criar Projetos; a 8 sempre o grava; a migração de contrato da 9 preenche os nulos e põe NOT NULL. Regras: D4–D7,
D10–D12, D15, D17, [0039]. Funções: drizzle-orm 1.0.0-rc.4 `pgSchema`, `uniqueIndex`, `check`,
`foreignKey().onDelete('cascade')`.

### Como se prova

2, 3: `npm run test -w @conexus/server`, `npm run migrations -- --base origin/main`.

## U3 O apelido, a passagem e a checagem no Hub

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/` | cria `apps.ts`, `app-failures.ts`, `address.ts`; muda `operation.ts` (`edge`), `companies.ts`, `identity-failures.ts`, `projects.ts`, `project-failures.ts`, `failures.ts`, `index.ts` | servidor, despachante, web, OpenAPI |
| `hub/apps/`; `hub/projects/` | cria `handoff.ts`, `routes.ts`, `public.ts`; o endereço em `insertProject`, a porta `projectOfHost` | `main.ts`, `hub/apps` |
| `hub/identity/` | `nickname.ts`; `company-routes.ts`, `companies.ts`; `admission.ts`, `setCompanyNickname`; `public.ts`, a sessão do Hub pelo id | Projetos, apps |
| `platform/access.ts`, `http.ts`, `config.ts`; `main.ts` | `edge`; a escuta de borda; `HUB_EDGE_PORT`, `APPS_DOMAIN`; liga tudo | — |
| `scripts/removals.json` | `handoff-atomic`, `handoff-binding`, `handoff-host`, `app-session-cascade`, `edge-port-only`, `nickname-owner-once` | `npm run removals` |

### Os contratos que a unidade cria

- `edge`, o texto de S48 da issue 97: "Uma rota `edge` só existe na escuta `HUB_EDGE_PORT`, que
  só o despachante alcança; não lê sessão nem cookie, e não confere `Origin` nem `Sec-Fetch-Site`."
- `createAppHandoff`: POST `/api/apps/handoffs`, `session`, `{host, binding}`; 201 `{location}`, a
  `https://<host>.<APPS_DOMAIN>/__conexus/passagem?code=`; 404 a página única (S10). Passagem de 60 s.
- `createAppSession`: POST `/api/app-sessions`, `edge`, `{host, code, binding}`; 201 `{session}`; 403
  `APP_HANDOFF_INVALID` para todo motivo.
- `checkAppCall`: GET `/api/app-sessions/current`, `edge`, `X-Conexus-App-Session` e `host`; 200
  `{caller}`; 401, 403, 404 da lista de falhas.
- `setCompanyNickname`: PUT `/api/companies/{companyId}/nickname`, `session`, `{nickname}`; 200
  `{company}`. Ação `by: 'MEMBER'` com a declaração `CHOOSE_NICKNAME`, só do dono. `Company` ganha `nickname` e `appsDomain`;
  `Project`, `address`. `HostLabel`, `CompanyNickname` marcados (C23).
- `address.ts`, puro, o único dono da regra, de servidor e web (C26): o nome sem acento,
  minúsculo, cada trecho de outro caractere um `-`; cortado para caber em 63; depois sem `-` nas
  pontas; ao menos 3 caracteres; `--`; o apelido. `RESERVED_NICKNAMES`: `www`, `hub`, `api`, `app`,
  `apps`, `admin`, `central`, `conexus`, `suporte`, `mail`, `preview`.

### A ordem do trabalho

1. `setCompanyNickname` sob `lockCompany`; o endereço em `insertProject`. Regras: C23, C26, C37,
   C48, D15, D16, S7, S8.
2. `createAppHandoff`: `projectOfHost`, `admitMember` com `readProjects`. Regras: C33, C35, C36, S9,
   S10, S22, S24.
3. `createAppSession`: `DELETE … RETURNING` por hashes, host e prazo, e a sessão, numa transação.
   Regras: C65, S22.
4. `checkAppCall`: a sessão pelo hash e host; a do Hub viva (S18) por `identity/public.ts`;
   `admitMember`, cujo `NOT_FOUND` (tirado, marcada) vira 403. Regras: C26, S8, S13, S14.
5. Outra instância Fastify em `HUB_EDGE_PORT`. Funções: fastify 5.12.5 `listen`; `node:crypto`
   `randomBytes`, `createHash`.

### Como se prova

4–10: `npm run test -w @conexus/server` (T5, T6, T10); `npm run openapi`.

## U4 O despachante, o muro, o contrato e o exemplo

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/edge/` | cria `src/dispatcher.ts`, `hub.ts`, `headers.ts`, `pages.ts`, `outbound.ts`, `example/`, os `wrangler.jsonc`, o pacote e testes | o runner publica |
| `packages/app-contract/` | cria `Caller`, `AppProps` | `apps/edge`, `hub-api` |
| `.dependency-cruiser.cjs`, `knip.json`, `biome.json`, `package.json` | só `src/hub.ts` chama `env.HUB`; `wrangler types` fora do lint; `wrangler` na versão de 0041 | CI (L16) |
| `scripts/removals.json` | `edge-outbound-wall`, `edge-strip-hub-cookies`, `edge-strip-conexus-path`, `edge-drop-app-cookie`, `edge-cross-site-write`, `edge-csp`, `edge-props-caller-only`, com `cwd` `apps/edge` | `npm run removals` |

### Os contratos que a unidade cria

`Caller = {personId, personName, projectId, projectName}`, sem e-mail, empresa ou papel, pois o app
vê `props`. `AppProps = {caller}`. Cookies de S17, sem `Max-Age`: `__Host-conexus-binding`, apagado
no resgate, e `__Host-conexus-app`. `HubPort`, um adaptador sobre `env.HUB` com
`HUB_CHECK_DEADLINE_MS` (C56, C57). `HUB_PUBLIC_ORIGIN` em `vars`, do 303.

### A ordem do trabalho

`wrangler.jsonc`: `compatibility_date` do dia, `observability` e `traces`; `dispatch_namespaces`
com `outbound.service` ao muro; `vpc_services`; a rota. `Env` por `wrangler types` (C27). `env.DISPATCHER.get(nome, props,
{outbound})`, sem `limits` na chamada (falhou em D6 e D9); `limits.cpu_ms` 50 no envio do exemplo.
`crypto.getRandomValues` no vínculo. Exceção vira página (C50): HTML sem script, um `<style>`
com hash na CSP, os tokens do Hub. O exemplo: HTML sem script, de `ctx.props.caller`. Regras: C27, C50, C56, C57, S4, S5, S17, S24, S36.

### Como se prova

11–13: `npm run test -w @conexus/edge`, `node:test`, o `fetch` do despachante com `env` falso
(namespace e VPC dublês). Node basta, sem `@cloudflare/vitest-pool-workers` (L16): o despachante
usa só `fetch`, `Headers` e `crypto`; `props`, `outbound`, `limits` e VPC, U1 e o 18 provam (T14).

## U5 As telas

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/` | `projects/create-project-form.tsx`, `project.tsx`, `queries.ts`; cria `identity/company-setup.tsx`, `apps/open-app.tsx`; testes | rotas |
| `apps/web/src/routes/_app/` | cria `apps/open.tsx` e `companies/$companyId/setup.tsx`; `$companyId.tsx`, o `beforeLoad` que leva a ela sem apelido | roteador |
| `apps/web/src/platform/test-hub.tsx` | as respostas novas | testes |

### A ordem do trabalho

A configuração: um campo, sugerido por `address.ts`, e o endereço com `appsDomain` ao digitar.
**Abrir app**: um link para `Project.address`.
`/apps/open?host&binding`, lidos por `validateSearch` com zod, o vínculo fora de log (S41): sob
o guarda de `_app`, que já leva a **Entrar** e volta, chama
`createAppHandoff` e faz `location.assign` ao `location`. Regras: W1, W8–W13, W21–W24, V29, V35, V39.

### Como se prova

14: `npm run test -w @conexus/web`; navegador real em 1366, 390 e 320 px, dois temas, teclado (T23).

## U6 Publicar e voltar atrás a borda

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `publish.yml`, `rollback.yml`; `infra/compose.yaml` | o runner do servidor publica a borda depois do Hub, e a volta antes; `HUB_EDGE_PORT` sem `ports:` | Release |
| `docs/decisions/0042-cloudflare-token-in-one-call-environment.md` | cria: a exceção de 0036 vale para o token, que o `wrangler` só lê do ambiente | `check-docs` |
| `docs/how-to/apps-edge.md`, `index.md`, `architecture.md` §7 | namespace `conexus-apps`, VPC `conexus-hub-borda` a `hub:8081`, DNS `*`; o token; a volta | firstmate |

### A ordem do trabalho

`wrangler deploy` (e `--dispatch-namespace conexus-apps`) do código do Release, com
`CLOUDFLARE_API_TOKEN` lido do arquivo como em 0036, só no ambiente dessa chamada.
A volta publica o código antigo, um mecanismo para os três: um Worker de app não tem versões, e
`wrangler rollback` só voltaria os outros dois (C75). Regras: L16, L17,
[0035], [0036], S31, S36.

### Como se prova

15: um Release de ensaio, fora do esquema de L17, publicado e voltado.

## U7 Percurso e remoções

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `tests/e2e/`, `package.json` | cria `app.test.ts`; `live-hub.ts`, a porta de borda; a lista do `e2e` | `npm run e2e` |
| `scripts/removals.json` | confere as linhas de U2, U3 e U4 | `npm run removals` |

### Como se prova

16, 17: `npm run e2e`, `npm run removals`. 18: depois do Release, ataque ao Worker real e à 8081
de fora. Regras: T5, T6, T12, T13, T14, T20.
