# Etapa 8: App de exemplo

## A página do fundador

**No fim desta etapa** quem é da empresa e está no Hub abre o app de um Projeto no endereço dele;
mais ninguém abre; apagar o Projeto fecha o endereço.

**O roteiro de uso.** No Hub publicado, sem terminal. Antes: a Central cadastra a Empresa A, com o
dono na segunda caixa.

1. Na segunda caixa, aceite o convite: antes dos lugares da empresa, o Hub pede só o apelido,
   sugerido do nome ("empresa-a"), com o endereço que ele dá. "conexus": "Esse apelido é
   reservado." Salve "empresa-a": abrem os Projetos. Convide um membro na terceira caixa.
2. Crie "Pedidos": o formulário mostra `pedidos--empresa-a.<dominio>`. Abra Pedidos e clique em
   **Abrir app**: o navegador passa pelo Hub e mostra "Olá, <seu nome>. Este é o app do Projeto
   Pedidos." no endereço do app.
3. Na janela do membro, abra o mesmo endereço: abre. Numa janela anônima: vai para **Entrar**; entre
   com uma conta de fora de A: "Este app não existe ou você não tem acesso a ele."
4. Na janela do membro, saia do Hub e recarregue o app: vai para **Entrar**.
5. Na janela do dono, apague Pedidos. Recarregue o app: "Este app não existe."

**O que você faz, e quando.** Antes de U1: (1) registra o domínio dos apps por 2 anos ou mais, como
zona na conta Cloudflare do Conexus; (2) assina o Workers for Platforms nela, US$ 25 por mês; (3)
cria um token temporário (Workers, DNS da zona dos apps, Workers VPC) para a prova, e o apaga no
fim. Com esta página: autoriza as chamadas da prova, abaixo. Antes de U2: a palavra sobre o grant
(D11). Antes de U6: um token da Cloudflare só de publicar, no segredo do GitHub; autoriza as três
criações da U6 e o app de ataque da U7. No fim: o roteiro e os textos.

**As chamadas da prova U1**, todas com nome `cx-prova-`, apagadas no fim:
1. criar o namespace `cx-prova-apps`;
2. criar o serviço VPC `cx-prova-borda`, do túnel do servidor à porta 8081;
3. no servidor, um contêiner de prova (`docker run --rm`) na porta 8081, fora do endereço público;
4. o registro DNS curinga `*` na zona dos apps;
5. publicar o despachante e o muro de prova, com a rota `*.<dominio>/*`, e três apps de prova;
6. de fora, chamadas `https` e um Chromium sem tela entre os dois domínios;
7. apagar tudo o que tem `cx-prova-`.

**Decisões já dadas** (2026-10-17): 1A; 2 `estoque--metal-nobre.<dominio>` ("Sim"); 2.1A, 2.2A,
2.3A; 3A; 4A, "sua recomendação vale a pena validarmos"; 5A. Apelido: na configuração inicial da
empresa (sua); não muda na 8 (A); antes de publicar, o firstmate apaga as empresas de teste da 7
(A); reservados A. O endereço é guardado e único, até 63; renomear não o muda.

**O que muda na regra.** A porta que só o despachante alcança é um quinto tipo de acesso, `edge`
(C33, S48). A regra muda no fechamento da 7, antes da 8 começar (L20). O registro 0024 ganha o
formato do endereço no fechamento da 8.

**O grant de U2.** O login do Hub cria, lê e apaga passagens e sessões de app e acha o Projeto pelo
endereço, por uma função só de leitura. As rotas da empresa gravam o apelido.

**Fica de fora.** Banco da empresa, versões e envio (a 9). Limites (a 10). Preview (a 14). Quem só
usa um app (a 18). Renomear.

**A decisão sua pedida nesta etapa.** Nenhuma.

## O que mudou desde o estudo

O registro é 0041: a 7 tomou 0040. O endereço usa `--`, que nem nome nem apelido têm: sem código de
colisão. A sessão do app vive enquanto vive a do Hub que a criou: sair do Hub, ser tirado ou o prazo
dele a fecham, sem prazo novo (S18). Sem **Sair** no app: com o Hub
aberto, entraria de novo. A checagem não devolve `script` (C30): todo Projeto roda o exemplo.

**Encaixes da etapa 7** (cartão em `main`, ramo `feat/conexus-e07-u2-grants`), conferidos quando a 7
entrar; se um faltar, a construção para:

| # | Encaixe | Onde |
| --- | --- | --- |
| E1 | `projects.project` (`id`, `company_id`, `name`, `attempt_key`, `created_at`) | `hub/projects/tables.ts` |
| E2 | `createProject` com `Idempotency-Key`, transações 1 e 2; `deleteProject` apaga a linha | `hub/projects/projects.ts` |
| E3 | `auth.company.deleting_since`; `admitCompany` recusa empresa marcada | `identity/admission.ts` |
| E4 | `ACTIONS.readProjects` (`MEMBER`) | idem |
| E5 | `$companyId/projects/$projectId.tsx`; `hub/projects/create-project-form.tsx` | `apps/web/src/` |
| E6 | `project-failures.ts`, espalhado em `FAILURES` | `packages/hub-api/src/` |
| E7 | Nenhum login nem esquema no banco da empresa | cartão 7 |

## As issues abertas

88, 89 e 90 são da 6, fora do tema; nenhuma `next-card`.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | Registro 0041 e a prova da borda | `docs/decisions/` | testes | cloudflare:wrangler, cloudflare:workers-best-practices | sua autorização |
| U2 | Apelido, endereço, passagem e sessão de app: tabelas, função, grants (PR próprio) | migrações, grants, tabelas | dados | neon-postgres | U1, sua palavra, a 7 em `main` |
| U3 | O apelido, a passagem e a checagem no Hub | `hub/apps/`, `hub/projects/`, `identity/`, `hub-api`, `main.ts` | segurança | better-auth-best-practices, fastify-best-practices | U2, a emenda de C33 |
| U4 | O despachante, o muro, o contrato e o exemplo | `apps/edge/`, `packages/app-contract/` | segurança | cloudflare:workers-best-practices, cloudflare:wrangler | U1; o contrato de U3 |
| U5 | As telas: configuração da empresa, endereço, **Abrir app** | web | web | shadcn | U3 |
| U6 | Publicar e voltar atrás a borda | `.github/`, `infra/`, `docs/how-to/` | entrega | cloudflare:wrangler | U4 |
| U7 | Percurso e remoções | `tests/e2e/`, `scripts/` | testes | nenhuma | U5, U6 |

U4 corre junto com U3 depois do contrato de U3; U5 junto com U4. Uma revisão, um merge (L9, L13). A
prova não cria release (L17).

**Orçamento de código alterado** (sem testes nem gerados): U1 **0**; U2 **200**; U3 **650**, ~250
trazidas; U4 **550**; U5 **350**; U6 **200**; U7 **100**; espalhados **100**. Total **2.150**, teto
4.000 (L2).

## Os critérios de aceite

| # | Unidade | Critério observável, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | 0041 "proposed" antes de código; o Result da prova autorizada; no fim, nenhum `cx-prova-` vivo | o registro | must |
| 2 | U2 | Colunas, restrições, função e grants do contrato; catálogo igual ao arquivo | `catalog.test.ts` | must |
| 3 | U2 | Sem filtro, uma empresa não grava apelido nem endereço de outra; a função só devolve `(project_id, company_id)`, só ao login do Hub | `isolation.test.ts` “apps” | must |
| 4 | U3 | `setCompanyNickname`, dono: 200; o mesmo de novo: 200; outro depois: 409 `COMPANY_NICKNAME_SET`; tomado: 409 `COMPANY_NICKNAME_TAKEN`; reservado: 422 `COMPANY_NICKNAME_RESERVED`; forma: 400; administrador, membro, outra empresa: 404 (S10); duas empresas, o mesmo, juntas: um 200 | `companies.test.ts` “apelido”, com barreira (C65) | must |
| 5 | U3 | Endereço `<nome>--<apelido>`, até 63; "Ação" depois de "Acao": 409 `PROJECT_ADDRESS_TAKEN`; nome sem letra nem dígito: 422 `PROJECT_NAME_NO_ADDRESS`; empresa sem apelido: 409 `COMPANY_SETUP_PENDING` | `projects.test.ts` “endereço” | must |
| 6 | U3 | `openApp`, membro: 303 ao host com o código; sem sessão: 303 a `/login?redirect=`; host desconhecido, outra empresa, empresa marcada: a mesma 404 (S10) | `app-handoff.test.ts` “abrir” | must |
| 7 | U3 | O código com outro vínculo, outro host, vencido, certo, de novo: 403, 403, 403, 201, 403 (LT2); dois juntos: um 201 | `app-handoff.test.ts` “resgatar”, com barreira | must |
| 8 | U3 | Checagem: 200 `{caller}`; outro host, sessão do Hub apagada ou vencida: 401; tirado, empresa marcada: 403; Projeto apagado: 404; na chamada seguinte | `app-handoff.test.ts` “checar” | must |
| 9 | U3 | Rota `edge` na porta pública, ou outra na de borda: 404; uma `edge` na pública: o servidor não sobe | `http.test.ts`, `access.test.ts` | must |
| 10 | U3 | `COMPANY_NICKNAME_CHOSEN`, `APP_HANDOFF_CREATED`, `APP_SESSION_CREATED`, `APP_ACCESS_REFUSED` com ids; nunca código, sessão ou nome (S41) | `app-handoff.test.ts` “log” | must |
| 11 | U4 | Primeira visita: cookie de vínculo, 303 ao Hub; passagem certa: cookie de sessão, 303 a `/`; 401: ao Hub; 403, 404, Hub fora, prazo: as páginas da matriz | `apps/edge/src/dispatcher.test.ts` | must |
| 12 | U4 | O app não recebe cookie `__Host-conexus-*` nem `/__conexus/`; o `Set-Cookie` dele com o prefixo sai; escrita de outro site: 403; CSP e cabeçalhos de S24 | `dispatcher.test.ts` “app” | must |
| 13 | U4 | `props` leva só `caller`; o exemplo mostra o nome da pessoa e do Projeto | `apps/edge/example/example.test.ts` | must |
| 14 | U5 | Cada célula da matriz; sem apelido, a empresa só abre a configuração; **Abrir app** a todos os papéis; T23 | `company-setup.test.tsx`, `create-project-form.test.tsx`, `project.test.tsx`, navegador | must |
| 15 | U6 | O Release publica o Hub e depois a borda; a volta põe a borda antiga antes do Hub; o token fora de log | um Release de ensaio (U6) | must |
| 16 | U7 | Tirar qualquer proteção com linha em `removals.json` faz o seu teste falhar | `npm run removals` | must |
| 17 | U7 | O roteiro, despachante em Node, namespace falso, Hub real nas duas portas | `tests/e2e/app.test.ts` | must |
| 18 | U7 | Publicado: passos 2 a 5, um app de ataque contra o muro, LT13 | firstmate, autorizado (T13, T14) | must |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido, recusado ou concorrência |
| --- | --- | --- | --- | --- | --- |
| Configurar a empresa (dono, sem apelido) | só o campo Apelido, sugerido do nome, e o endereço de exemplo ao digitar | "Salvando…" | 409, 422 no campo; 503: a frase e **Tentar de novo** | `NotFound` | `COMPANY_NICKNAME_SET`: relê e abre Projetos |
| Criar Projeto | 7, e o endereço montado | 7 | 409, 422 de endereço no campo Nome | 7 | 7 |
| Projeto | nome, data, endereço, **Abrir app** | 7 | 7 | 7 | — |
| Hub, abrir app | — | — | 503 do Hub | "Este app não existe ou você não tem acesso a ele." 404 | sem sessão: **Entrar**, e volta |
| App, primeira visita | vai ao Hub e volta | — | — | — | — |
| App | o exemplo | — | Hub fora: "O Conexus está fora do ar. Tente de novo em alguns minutos." 503; app: "O app não conseguiu responder agora." 502 | "Este app não existe." 404 | código recusado: "Este link de acesso não vale mais. Abra o app pelo Conexus." 403; tirado: "Você não tem acesso a este app." 403 |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Project.address` | `createProject`, pelo endereço guardado | página do Projeto, **Abrir app** |
| `Company.nickname`, `null` antes da configuração | `setCompanyNickname` | rota da empresa, formulário |
| `createAppSession` `{host, code, binding}` → `{session}` | despachante | Hub |
| `checkAppCall` → `{caller}` | Hub | despachante, que o põe em `props` |
| `Caller.{personId, personName, projectId, projectName}` | Hub | o app |

Falhas novas (C48), USER e settles salvo dito:
`COMPANY_NICKNAME_TAKEN` 409, "Esse apelido já é usado por outra empresa." / "Escolha outro.";
`COMPANY_NICKNAME_RESERVED` 422, "Esse apelido é reservado." / "Escolha outro.";
`COMPANY_NICKNAME_SET` 409, "O apelido já foi escolhido."; `PROJECT_ADDRESS_TAKEN` 409, "Já existe um
Projeto com esse endereço nesta empresa." / "Mude o nome."; `PROJECT_NAME_NO_ADDRESS` 422, "O nome
precisa ter uma letra ou um número."; `COMPANY_SETUP_PENDING` 409, SYSTEM; `APP_HANDOFF_INVALID` 403;
`APP_SESSION_INVALID` 401; `APP_ACCESS_REFUSED` 403; `APP_NOT_FOUND` 404, só para o despachante.

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Dependência fora | O que imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Gravar o apelido | `lockCompany`; único: 409 | rollback | banco: 503 | `COMPANY_NICKNAME_CHOSEN` | 4 |
| Criar Projeto, o endereço (transação 2 da 7) | `lockCompany`; único: 409 | rollback | banco: 503 | `PROJECT_CREATED` | 5 |
| Emitir passagem | duas, cada uma vale uma vez | rollback | banco: 503 | `APP_HANDOFF_CREATED` | 6 |
| Resgatar: `DELETE … RETURNING` e a sessão | o segundo, 403 | rollback: a passagem vale até vencer | banco: 503; corte: de novo ao Hub | `APP_SESSION_CREATED` | 7, 11 |
| Checar (leitura) | — | — | banco ou VPC: 503 | `APP_ACCESS_REFUSED` | 8, 11 |
| Migrações de U2 | uma vez no `migrate` (D9) | uma transação | `migrate` falha | código do `migrate` | 2 |
| Publicar a borda (CI) | `concurrency` do workflow | a borda anterior segue | Cloudflare: o Release falha | a saída do `wrangler` | 15 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Passagem e sessão de app | trazida | `hub/apps/handoff.ts` | sem Keycloak nem `workspace_id`; presa à sessão do Hub | resgate atômico, 60 s, host e navegador (`application-host-routes.ts:64-84`); propósito, LT2 |
| CSP do host do app | trazida | `apps/edge/src/headers.ts` | de Fastify para `Headers` | `script-src 'self'`, `frame-ancestors 'none'` (`application-csp.ts:4,14`); propósito, LT13 |
| Despachante, muro, contrato, exemplo | nova | `apps/edge/`, `packages/app-contract/` | — | [0018], [0019], S4 |
| Apelido e endereço | nova | `identity/nickname.ts`, `hub/projects/address.ts`, `company-setup.tsx` | — | [0024]; resposta 2 e a do apelido |

**A medida do transplante.** Passagem e sessão: ~250 de ~457 linhas (auditoria 3.10), menos de um
terço mudado; CSP: 14.

**A dívida.** Passagens vencidas saem só com a sessão do Hub, até o primeiro trabalho agendado (§11).

**Fechamento da 8.** 0024 ganha o formato do endereço e a palavra de 2026-10-17; a arquitetura §8, a
sessão de app dentro da do Hub.

## U1 Registro e prova

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/decisions/0041-app-session-check-through-workers-vpc.md`, `docs/index.md` | cria; a linha | U3, U4, `check-docs` |

### Os contratos que a unidade cria

0041: a checagem do app pergunta ao Hub pelo Workers VPC, até a 18; a saída é o Access com token de
serviço (4B). Critério: (1) o despachante, que tem `dispatch_namespaces`, alcança
`cx-prova-borda:8081` pelo VPC; (2) a 8081 por endereço público: nada; (3) o muro recusa `fetch`,
`connect` e WebSocket do app; (4) `limits.cpu_ms` 50 no envio corta um laço em menos de 3 s; (5)
certificado válido em `x.<dominio>`, nenhum em `a.b.<dominio>`; (6) `ctx.props` chega ao app; (7)
LT13 no Chromium; (8) mediana e primeira chamada pelo VPC, de onde sai `HUB_CHECK_DEADLINE_MS`. Se 1
ou 2 falhar, a 8 volta a você com 4B. Não coberto: o Hub de verdade na 8081 (U7), carga.

### A ordem do trabalho

PR só de documentos (L13). A prova roda fora do repositório, com o `wrangler` que U4 fixa e o token
temporário. Regras: L13, L21, T13, T14.

### Como se prova

1: o Result de 0041.

## U2 Tabelas, função e grants

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/migrations/`, `platform/isolation.test.ts` | duas migrações; caso “apps” | `migrate`, `catalog.test.ts` |
| `apps/server/database-grants.sql` | muda, dono do retrato | `catalog.test.ts` |
| `apps/server/src/hub/apps/tables.ts` | cria | U3, migrações |
| `apps/server/src/hub/projects/tables.ts` | `hostLabel` | U3 |
| `apps/server/src/hub/identity/tables.ts`, `auth.ts` | `company.nickname`, com `input: false` | U3 |
| `scripts/removals.json` | `nickname-unique`, `host-label-unique`, `host-lookup-definer` | `npm run removals` |

### Os contratos que a unidade cria

`auth.company.nickname` text anulável, único, check `^[a-z0-9]+(-[a-z0-9]+)*$` e 3 a 30.
`projects.project.host_label` text not null, único, duas dessas formas unidas por `--`, até 63.
Esquema `apps` (D4), tudo not null: `handoff` (`code_hash` PK; `binding_hash`, `host_label`,
`person_id`, `company_id`, `project_id`; `hub_session_id` a `auth.session(id)` `ON DELETE CASCADE`,
D17; `expires_at`); `app_session` (`token_hash` PK; os mesmos, sem `binding_hash` e `expires_at`).
Só hashes (S22); como `auth.session`, o login do Hub os lê sem escopo, e a admissão vem depois.
`projects.project_of_host(label text) returns table(project_id text, company_id text)`, `SECURITY
DEFINER` de um papel NOLOGIN, como [0039] A1. Grants:
`hub_runtime` SELECT, INSERT, DELETE em `apps.handoff` e `apps.app_session`, EXECUTE na função;
`hub_company` UPDATE(`nickname`) em `auth.company`; USAGE no esquema.

### A ordem do trabalho

PR próprio, à espera da palavra (D11). A migração falha se houver Projeto; o firstmate
apaga as empresas de teste antes. Regras: D4–D7, D10–D12, D15, D17, [0039]. Funções:
drizzle-orm 1.0.0-rc.4 `pgSchema`, `uniqueIndex`, `check`, `foreignKey().onDelete('cascade')`.

### Como se prova

2, 3: `npm run test -w @conexus/server`, `npm run migrations -- --base origin/main`.

## U3 O apelido, a passagem e a checagem no Hub

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/` | cria `apps.ts`, `app-failures.ts`; muda `companies.ts`, `identity-failures.ts`, `projects.ts`, `project-failures.ts`, `failures.ts`, `index.ts` | servidor, despachante, web, OpenAPI |
| `apps/server/src/hub/apps/` | cria `handoff.ts`, `routes.ts`, `public.ts` e testes | `main.ts` |
| `apps/server/src/hub/projects/` | `address.ts`; `projects.ts` grava o endereço | rotas |
| `apps/server/src/hub/identity/` | `nickname.ts`; `company-routes.ts`, `companies.ts`; `admission.ts`, `setCompanyNickname` só do dono; `public.ts`, a sessão do Hub pelo id | Projetos, apps |
| `apps/server/src/platform/access.ts`, `http.ts`, `config.ts` | `edge`; a segunda escuta; `HUB_EDGE_PORT`, `APPS_DOMAIN` | `main.ts` |
| `apps/server/src/main.ts` | liga `apps` e a escuta de borda | — |
| `scripts/removals.json` | `handoff-atomic`, `handoff-binding`, `handoff-host`, `app-session-cascade`, `edge-port-only`, `nickname-owner-once` | `npm run removals` |

### Os contratos que a unidade cria

- `openApp`: GET `/apps/open?host&binding`, `page`; 303 a `https://<host>.<APPS_DOMAIN>/__conexus/passagem?code=`;
  sem sessão, 303 a `/login?redirect=`; 404 a página única (S10). Passagem de 60 s; um prefetch só
  deixa uma que vence (C36).
- `createAppSession`: POST `/api/app-sessions`, `edge`, `{host, code, binding}`; 201 `{session}`; 403
  `APP_HANDOFF_INVALID`, um código só para todo motivo.
- `checkAppCall`: GET `/api/app-sessions/current`, `edge`, cabeçalho `X-Conexus-App-Session` e
  `host`; 200 `{caller: Caller}`; 401 `APP_SESSION_INVALID`; 403 `APP_ACCESS_REFUSED`; 404
  `APP_NOT_FOUND`.
- `setCompanyNickname`: PUT `/api/companies/{companyId}/nickname`, `session`, `{nickname}`; 200
  `{company}`; as falhas do critério 4, 401, 503. `Company` ganha `nickname`; `Project`, `address`. `HostLabel`, `CompanyNickname` marcados (C23).
- Endereço: o nome sem acento, minúsculo, cada trecho de outro caractere um `-`, sem `-` nas pontas,
  cortado para caber em 63; `--`; o apelido. `RESERVED_NICKNAMES`: `www`, `hub`, `api`, `app`, `apps`,
  `admin`, `central`, `conexus`, `suporte`, `mail`, `preview`.

### A ordem do trabalho

1. `setCompanyNickname` sob `lockCompany`, uma vez; o endereço na transação 2 da 7. Regras: C23,
   C26, C37, C48, D15, D16, S7, S8.
2. `openApp`: `project_of_host`, `admitCompany` com `readProjects`, a passagem. Regras: C33, C36, S9,
   S10, S22, S24.
3. `createAppSession`: `DELETE … RETURNING` por hashes, host e prazo; a sessão na mesma transação.
   Regras: C65, S22.
4. `checkAppCall`: a sessão pelo hash e host; a do Hub viva pelas regras da 3 (S18), por
   `identity/public.ts`; `admitCompany` e o Projeto. Regras: C26, S8, S13, S14.
5. Segunda instância Fastify em `HUB_EDGE_PORT`, só rotas `edge`. Funções: fastify 5.12.5 `listen`;
   `node:crypto` `randomBytes`, `createHash`.

### Como se prova

4–10: `npm run test -w @conexus/server` (T5, T6, T10); `npm run openapi`.

## U4 O despachante, o muro, o contrato e o exemplo

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/edge/` | cria `src/dispatcher.ts`, `hub.ts`, `headers.ts`, `pages.ts`, `outbound.ts`, `example/`, os `wrangler.jsonc`, o pacote e testes | o CI publica |
| `packages/app-contract/` | cria `Caller`, `AppProps` | `apps/edge`, `hub-api` |
| `.dependency-cruiser.cjs`, `knip.json`, `biome.json` | só `src/hub.ts` chama `env.HUB`; o gerado de `wrangler types` fora do lint | `npm run deps` |
| `package.json`, `package-lock.json` | `wrangler`, versão exata | CI (L16) |

### Os contratos que a unidade cria

`Caller = {personId, personName, projectId, projectName}`, sem e-mail, empresa ou papel: `props` é
visível ao app. `AppProps = {caller}`. Cookies na forma de S17, sem `Max-Age`:
`__Host-conexus-binding`, apagado no resgate, e `__Host-conexus-app`. `HubPort =
{createAppSession, checkAppCall}`, um adaptador sobre `env.HUB` com `HUB_CHECK_DEADLINE_MS` (C56,
C57). O nome do exemplo tem um dono (C26).

### A ordem do trabalho

`wrangler.jsonc` com `compatibility_date` do dia, `observability.enabled` e `traces.enabled`;
`dispatch_namespaces` com `outbound.service` ao muro; `vpc_services`; a rota `*.<APPS_DOMAIN>/*`;
`Env` por `wrangler types`, as variáveis lidas na fronteira (C27). `env.DISPATCHER.get(nome, props,
{outbound})`, sem `limits` na chamada (falhou em D6 e D9); `limits.cpu_ms` 50 no envio do exemplo.
`crypto.getRandomValues` no vínculo. Toda exceção vira página (C50). O exemplo responde
HTML sem script, de `ctx.props.caller`. Regras: C27, C50,
C56, C57, S4, S5, S17, S24, S36.

### Como se prova

11–13: `npm run test -w @conexus/edge`, `node:test`, o `fetch` do despachante com `env` falso
(namespace e VPC dublês, T14); o resto, no 18.

## U5 As telas

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/projects/` | `create-project-form.tsx`, `project.tsx`, `queries.ts` e testes | rotas |
| `apps/web/src/hub/identity/` | cria `company-setup.tsx` e teste | rota |
| `apps/web/src/routes/_app/companies/` | cria `$companyId/setup.tsx`; `$companyId.tsx`, o `beforeLoad` que leva a ela sem apelido | roteador |
| `apps/web/src/platform/test-hub.tsx` | as respostas novas | testes |

### A ordem do trabalho

A configuração: um campo, sugerido do nome da empresa pela regra do endereço, até 30, e o endereço
de exemplo ao digitar; nada além. **Abrir app**: um link para `Project.address`. Regras: W1, W8–W13,
W21–W24, V29, V35, V39.

### Como se prova

14: `npm run test -w @conexus/web`; navegador real em 1366, 390 e 320 px, dois temas, teclado (T23).

## U6 Publicar e voltar atrás a borda

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `.github/workflows/publish.yml`, `rollback.yml`, `ci.yml` | um trabalho num runner do GitHub publica a borda depois do Hub; a volta, antes | Release |
| `infra/compose.yaml` | `HUB_EDGE_PORT` sem `ports:` | `deploy.sh` |
| `docs/how-to/apps-edge.md`, `index.md`, `architecture.md` §7 | as três criações (namespace `conexus-apps`, serviço VPC `conexus-hub-borda` a `hub:8081`, DNS `*`), o token, a volta | firstmate |

### A ordem do trabalho

`wrangler deploy` e `wrangler deploy --dispatch-namespace conexus-apps` do código do Release, com
`CLOUDFLARE_API_TOKEN`; a volta publica o código antigo, um mecanismo para os três (um Worker de app
não tem versões). Regras: L16, L17, [0035], S31, S36.

### Como se prova

15: um Release de ensaio, fora do esquema de L17, publicado e voltado, com o app aberto nos dois.

## U7 Percurso e remoções

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `tests/e2e/` | cria `app.test.ts`; muda `live-hub.ts` (a porta de borda) | `npm run e2e` |
| `package.json` | a lista do `e2e` | `npm run e2e` |
| `scripts/removals.json` | confere as linhas de U2 e U3 | `npm run removals` |

### Como se prova

16, 17: `npm run e2e`, `npm run removals`. 18: depois do Release, ataque direto ao Worker real. Regras: T5, T6, T12, T13, T14, T20.
