# Etapa 7: Projeto

## A página do fundador

**No fim desta etapa** uma pessoa da empresa cria um Projeto, e o primeiro prepara o banco da
empresa no Neon; o dono ou um administrador apaga um Projeto; a Central apaga uma empresa com
banco, e o banco sai junto.

**O roteiro de uso.** No Hub publicado, sem terminal. Antes: a Empresa A ativa, com o dono na
segunda caixa e um membro na terceira.

1. Na janela do membro, em A, abra **Projetos**: "Nenhum Projeto ainda." Crie "Pedidos": o botão
   diz "Preparando o banco da empresa…" por alguns segundos, e Pedidos aparece.
2. Crie "pedidos": "Já existe um Projeto com esse nome nesta empresa." Crie "Estoque": rápido.
3. Abra Pedidos: o membro não vê **Apagar Projeto**. Na janela do dono, apague Pedidos digitando o
   nome: "Projeto apagado."
4. Na Central, apague A digitando o nome: "Cliente apagado." Na janela do membro, recarregue:
   **Página não encontrada**. No console do Neon, o projeto de A sumiu da organização das empresas.

**O que você faz.** Antes de U1: no console do Neon, cria a organização "Conexus empresas", no plano
grátis, e uma chave dela; o firstmate a grava no servidor. Se o Neon recusar a segunda organização,
a T3A volta a você. Com esta página, autoriza as chamadas da prova. Antes de U2: a palavra sobre o
grant (D11). No fim: o roteiro e os textos.

**Decisões já dadas** (2026-10-17): P1 A, P2 A, P3 A, P4 A, T1A, T2A, T3A, T4A.

- **Papéis** ("Q1 sua recomendação q2 A"): P1 A fica, e cada papel dá capacidades de Projeto.
- **P3 muda a sua etapa 5.** Lá: "Apagar não deixa estado". Agora, "P3. A": a empresa com banco
  fica "Exclusão em andamento", com **Tentar concluir exclusão**, até o banco sair; e ninguém cria
  Projeto nela. A tela não promete recuperar em 7 dias: no grátis não está provado.
- **T1A.** A sua cópia da chave de cifra vai para a 9 ou a 11; o roteiro muda nas etapas 7, 11 e 19.
- **T4A** é aposta: se a prova não recuperar, isso volta a você.

**As chamadas da prova**, só na organização das empresas, em projetos `cx-prova-…`: listar por
nome; criar em São Paulo, PostgreSQL 18; criar com a resposta cortada e listar; gravar uma linha;
apagar durante a criação; apagar; apagar de novo; recuperar e ler a linha; ler o projeto do Hub com a chave das empresas;
apagar no fim tudo o que a prova criou.

**O grant de U2.** Às rotas da empresa: ler, criar e apagar Projetos; ler, criar e marcar pronto o
banco da empresa. À Central: ler e apagar os dois na empresa que apaga.

**Fica de fora.** Renomear Projeto. Logins e esquemas dentro do banco (a 9). Limite de computação:
nenhum app roda na 7.

**A decisão sua pedida nesta etapa.** A P3 A dizia também "o Hub tenta de novo sozinho quando liga".
Isso pede ao Hub apagar ao ligar sem ninguém clicar: uma coluna (quem começou), uma leitura nova no
grant de U2 e o teste do banco dormindo de novo.

- **A.** Só **Tentar concluir exclusão** termina. Exemplo: o Neon cai no meio de apagar a Padaria e o
  Hub é atualizado à noite; de manhã ela segue "Exclusão em andamento", ninguém dela entra, e você
  clica.
- **B.** Como respondido: a atualização da noite termina sozinha, se o Neon voltou.

**Recomendo A**: o botão já mostra a verdade; B é autoridade sem pessoa para um caso de falha. O
cartão está escrito com A.

## O que mudou desde o estudo

A leitura crítica corrigiu: o cartão da 6 está em `main`; a ação é `changeRole`; T1A toca três
linhas do roteiro; criar não segura trava durante o Neon, reserva o banco por um prazo (D22); adotar
pelo nome exige igualdade exata e recusa dois. Decidido aqui: a marca de exclusão é da identidade,
`auth.company.deleting_since`, que a admissão já lê e a Central já muda: sem grant cruzado (C8) nem
cópia (C26). A senha de dono não é pedida ao Neon: ninguém a usa na 7 (C30).

**Encaixes da etapa 6**, vistos em `40afe57` do ramo da 6; conferir quando ela entrar em `main`; se
um faltar, a construção para:

| # | Encaixe | Onde |
| --- | --- | --- |
| E1 | `ACTIONS` com `by` e `statement`; `allows` lê `defaultRoles` | `identity/admission.ts` |
| E2 | `COMPANY_OPERATOR` só nas ações `COMPANY` | idem |
| E3 | `PEOPLE_FAILURES` em `people-failures.ts`, espalhado em `FAILURES` | `packages/hub-api/src/` |
| E4 | `remove` em `operations/clients.ts` sem mudança na 6 | operações |
| E5 | `test-hub.tsx`, `removals.json`, `boundaries.md` com a 6 | — |
| E6 | A migração de U1 da 6 no catálogo antes da de U2 | `migrations/` |
| E7 | A rota da empresa é Pessoas (`$companyId.tsx`) | `apps/web/src/routes/_app/companies/` |

## As issues abertas

| Issue | Na etapa 7? | Por quê |
| --- | --- | --- |
| 73, 74 | Sim | U5 reescreve `remove` e o diálogo de apagar cliente |
| 39 itens 20, 23; 25 item 6 (`next-card`) | Não | Fora do que muda; com A, nada roda sozinho |
| As demais | Não | Fora do tema |

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | Registro 0040 e a prova | `docs/decisions/` | testes | neon-postgres, neon-postgres-agent-platforms | sua autorização |
| U2 | Tabelas, políticas, grants (PR próprio) | migrações, grants, tabelas | dados | neon-postgres | U1, sua palavra |
| U3 | O adaptador do Neon e a configuração | `platform/`, `infra/`, `docs/how-to/` | segurança | neon-postgres-agent-platforms | U1 |
| U4 | Projetos no servidor | contrato, projetos, admissão | segurança | organization-best-practices | U2, U3 |
| U5 | Apagar empresa em fases | operações, identidade | dados | organization-best-practices | U4 |
| U6 | As telas | web | web | shadcn | U4; a Central, U5 |
| U7 | Percurso e remoções | `tests/e2e/`, `scripts/` | testes | nenhuma | U5, U6 |

U2 e U3 correm juntas. Depois, servidor (U4, U5) e telas (U6, desde o contrato de U4). Uma
revisão e um merge (L9, L13). A prova não cria release (L17).

**Orçamento de código alterado** (sem testes nem gerados): U1 **0**; U2 **250**; U3 **300**; U4
**700**; U5 **450**; U6 **1.100**; U7 **200**; espalhados **150**. Total **3.150**, teto 4.000 (L2).

## Os critérios de aceite

| # | Unidade | Critério observável, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | 0040 "proposed" antes de código; o Result da prova autorizada; no fim, nenhum `cx-prova-` vivo | o registro | must |
| 2 | U2 | Colunas, restrições, políticas e grants do contrato; catálogo igual ao arquivo | `catalog.test.ts` | must |
| 3 | U2 | Sem filtro, uma empresa não lê nem grava Projeto ou banco de outra; a Central só apaga os do escopo; a empresa não muda `deleting_since` | `isolation.test.ts` “projetos” | must |
| 4 | U3 | `find` só nome exato; `create` em São Paulo, PostgreSQL 18, na organização; `delete` de ausente: apagado; erro respondido: `REFUSED`; prazo ou rede: `NO_ANSWER`; `auth`: 500; a chave nunca em log | `platform/neon.test.ts`, `fetch` falso | must |
| 5 | U3 | Chave ausente ou legível por outros, sem organização, `http` fora desta máquina: `CONFIG_INVALID` com o nome | `config.test.ts` | must |
| 6 | U4 | Membro cria: 201; só o primeiro chama `create`; membro de B e a Central: 404 nas quatro rotas de A (S10) | `projects.test.ts` “criar” | must |
| 7 | U4 | Dois cliques, uma chave: um Projeto; a chave com outro nome: 409 `IDEMPOTENCY_CONFLICT`; nome igual sem caixa: 409 `PROJECT_NAME_TAKEN`, também dois juntos | `projects.test.ts` “repetir” | must |
| 8 | U4 | Recusa plantada entre o Neon e a transação 2, e a mesma chave: um banco, adotado, um Projeto; duas pessoas sem banco: um `create`, a segunda 409 `COMPANY_DATABASE_PREPARING`, depois 201; reserva vencida: assumida | `projects.test.ts` “banco”, com barreira (C65) | must |
| 9 | U4 | Neon recusa: 503 `COMPANY_DATABASE_UNAVAILABLE`, reserva solta; prazo: 503, reserva até vencer; dois nomes exatos: 500, nenhum Projeto | `projects.test.ts` “Neon fora” | must |
| 10 | U4 | Dono e administrador apagam: 204; membro: 404; outro nome: 422 `PROJECT_NAME_MISMATCH`; de novo: 404; o último não apaga o banco | `projects.test.ts` “apagar” | must |
| 11 | U4 | `PROJECT_CREATED`, `PROJECT_DELETED`, `COMPANY_DATABASE_CREATED` com ids, nunca o nome (S41) | `projects.test.ts` “log” | must |
| 12 | U5 | Sem banco: o apagar da 5, numa transação | `client-deletion.test.ts` | must |
| 13 | U5 | Com banco: o Neon apaga o id e todo nome exato; sai tudo da 5, mais Projetos e banco; 204 | `client-deletion.test.ts` “com banco” | must |
| 14 | U5 | Neon fora, ou recusa antes da fase 3: 503 `CLIENT_DELETION_PENDING`; cliente `DELETING`; membros: 404 na empresa, que some de Suas empresas; convite: 404; a mesma rota termina, 404 do Neon conta como apagado | “exclusão em andamento” | must |
| 15 | U5 | Reserva viva: 503, sem `delete`; vencida, apaga pelo nome; criar contra apagar, 20 vezes: nada sobra no Neon falso | “apagar contra criar” | must |
| 16 | U5 | Issues 73 (só nome e revisão) e 74 (a frase de `FAILURES`) | `client-deletion.test.ts`; `delete-client-dialog.test.tsx` | should |
| 17 | U6 | Cada célula da matriz renderiza; a chave de tentativa (W24); T23 | `projects.test.tsx`, `project.test.tsx`, `client.test.tsx`, navegador | must |
| 18 | U7 | Tirar qualquer proteção com linha em `removals.json` faz o seu teste falhar | `npm run removals` | must |
| 19 | U7 | O roteiro, com o Neon falso na porta HTTP dele | `tests/e2e/projects.test.ts` | must |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido, recusado ou concorrência |
| --- | --- | --- | --- | --- | --- |
| Projetos | "Nenhum Projeto ainda." e **Criar Projeto** | 4.1 | 4.1 | `NotFound` | 50 por página |
| Criar Projeto | campo Nome | "Criando…"; sem banco: "Preparando o banco da empresa…" | 409 no campo; 409 preparando e 503: frase com **Tentar de novo**; corte, 502: "Não confirmamos a criação. Tente de novo." | 404: `NotFound` | a chave fica (W24) |
| Projeto | nome e data; **Apagar Projeto** só se `mayDelete` | 4.1 | 4.1 | `NotFound` | — |
| Apagar Projeto | "Apagar {nome}? Isto não se desfaz." e o nome digitado | "Apagando…", diálogo aberto | corte, 502, 503: "Não confirmamos a exclusão. Veja a lista." | 404: fecha e vai à lista | 422 no campo; sucesso: "Projeto apagado." |
| Central, lista | 4.2 | 4.2 | 4.2 | — | `DELETING`: "Exclusão em andamento" |
| Central, cliente apagando | "Exclusão em andamento." e **Tentar concluir exclusão** | "Concluindo…" | 503: a frase da falha | 404: a lista | "Cliente apagado." |
| Apagar cliente | a 5 e "Os Projetos e o banco da empresa também serão apagados." | 5 | 503: fecha e relê | 5 | 5 |
| Suas empresas | a empresa marcada some | 4.1 | 4.1 | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `ProjectSummary.{id, name, createdAt}` | `createProject` | lista e página |
| `Project.mayDelete` | `getProject`, por `ACTIONS` | zona de risco |
| `listProjects.databaseReady` | `listProjects` | o texto pendente de Criar |
| corpo `{name}` de criar e apagar | formulário, diálogo | comando |
| `Client.state` `DELETING` | `readOperatedCompanies` | Central |

Falhas novas (C48), em `project-failures.ts` (E3), USER e settles salvo dito: `PROJECT_NAME_TAKEN`
409, "Já existe um Projeto com esse nome nesta empresa." / "Escolha outro nome."; `PROJECT_NAME_MISMATCH`
422, "O nome não confere."; `COMPANY_DATABASE_PREPARING` 409, não settles, RETRY, "O banco da empresa
está sendo preparado." / "Tente de novo em alguns segundos."; `COMPANY_DATABASE_UNAVAILABLE` 503
THIRD_PARTY, não settles, RETRY, "Não foi possível preparar o banco da empresa agora." / "Tente de
novo em alguns minutos."; `CLIENT_DELETION_PENDING` 503 THIRD_PARTY, não settles, RETRY, "A exclusão
começou, mas o banco da empresa ainda não saiu." / "Tente concluir a exclusão."

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Dependência fora | O que imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Criar, transação 1: reserva | trava da chave e da linha; 409 preparando | rollback | banco: 503 | — | 7, 8 |
| `find` e `create` no Neon | a reserva exclui; vencida, adota; dois: 500 | corte: reserva até vencer | Neon: 503 | `COMPANY_DATABASE_CREATED` | 8, 9 |
| Criar, transação 2: `ready` e o Projeto | trava da chave; índice único | rollback; adotado depois | banco: 503 | `PROJECT_CREATED` | 7, 8 |
| Apagar Projeto | linha `FOR UPDATE`; o segundo, 404 | rollback | banco: 503 | `PROJECT_DELETED` | 10 |
| Apagar empresa, fase 1: marca e convites | `lockCompany`; marca uma vez | rollback | banco: 503 | — | 13, 14 |
| Fase 2: `delete` no Neon | 404 do Neon é apagado; reserva viva: pendente | marca fica | Neon: 503 pendente | `COMPANY_DATABASE_DELETED` | 13–15 |
| Fase 3: a transação da 5, mais Projetos e banco | `lockCompany`; o segundo, 404 | rollback, marca fica | banco: 503, marca fica | `CLIENT_DELETED` | 13, 14 |
| Migrações de U2 | uma vez no `migrate` (D9) | uma transação | `migrate` falha | código do `migrate` | 2, 3 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Projetos e banco | nova | `hub/projects/`, `platform/neon.ts` | — | gravar a intenção antes do efeito (antigo `project/store.ts:61-82`); C37 |
| Apagar em fases | nova | `operations/clients.ts` | — | de fora primeiro (antigo `deletion.ts:57-95`); propósito |

**A medida do transplante.** Zero linhas: a ficha `project` supõe Git, Builder e esquema próprio.
**A dívida.** Nenhuma.

## U1 Registro e prova

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/decisions/0040-company-database-through-neon.md`, `docs/index.md` | cria; a linha | U3, `check-docs` |

### Os contratos que a unidade cria

0040: T2A, T3A e o Critério: (1) criar `cx-prova-<uuid>` em `aws-sa-east-1`, PostgreSQL 18, com a
chave das empresas, tempo medido; (2) resposta cortada, depois `find`: um só; (3) uma linha gravada
pela URI da criação, apagar, `recover`, a linha volta (T4A); (4) apagar de novo: `not_found`; (5) uma
operação com outra em curso: o SDK repete o 423 dentro do prazo; (6) a chave das empresas lê o
projeto do Hub: recusada (T3A); (7) o tempo de `create` dá `NEON_DEADLINE_MS` e a reserva. Não
coberto: plano pago, carga, apagado no limite de 100.

### A ordem do trabalho

PR só de documentos (L13). A prova roda fora do repositório, com `@neon/sdk@7.3.0`, depois
desta página aprovada. Regras: L13, L21, T14.

### Como se prova

1: o Result de 0040, com os números.

## U2 Tabelas, políticas e grants

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/migrations/`, `platform/isolation.test.ts` | duas migrações; caso “projetos” | `migrate`, `catalog.test.ts` |
| `apps/server/database-grants.sql` | muda, dono do retrato | `catalog.test.ts` |
| `apps/server/src/hub/projects/tables.ts` | cria | U4, U5, migrações |
| `apps/server/src/hub/identity/tables.ts` | `company.deletingSince` | admissão, U5 |
| `scripts/removals.json` | `project-company-policy`, `company-database-policy` | `npm run removals` |

### Os contratos que a unidade cria

Esquema `projects` (D4). `projects.project`: `id` text PK; `company_id` text, sem chave estrangeira
(D17, como `operations.client`); `name` text, 1 a `COMPANY_NAME_MAX_LENGTH`; `attempt_key` text;
`created_at` timestamptz; todos not null; únicos `(company_id, attempt_key)` e
`project_company_name_key (company_id, lower(name))`. `projects.company_database`: `company_id` text PK; `state` text `creating | ready`;
`neon_project_id` text único, anulável; `claimed_until` timestamptz; checks: `ready` se e só se há
id, `creating` se e só se há prazo. `auth.company.deleting_since` timestamptz anulável. Políticas:
`company_all` para `hub_company` com `company_id = conexus.company_id`; `operator_select` e
`operator_delete` com `ADMINISTRATOR` e a empresa do escopo. Grants: `hub_company` SELECT, INSERT,
DELETE em `project`; SELECT, INSERT, UPDATE(`state`, `neon_project_id`, `claimed_until`) em
`company_database`; `hub_operator` SELECT, DELETE nos dois; USAGE no esquema aos dois.

### A ordem do trabalho

PR próprio, à espera da palavra (D11). Regras: D4–D7, D10–D12, D15, D17, [0039]. Funções:
drizzle-orm 1.0.0-rc.4 `pgSchema`, `pgPolicy`, `uniqueIndex`, `check`; o que o Drizzle não gera,
no cabeçalho da migração (issue 72).

### Como se prova

2, 3: `npm run test -w @conexus/server`, `npm run migrations -- --base origin/main`.

## U3 O adaptador do Neon

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/neon.ts` | cria a porta e o adaptador | `main.ts`, U4, U5 |
| `apps/server/src/platform/config.ts`, `test-database.ts` | as três variáveis; a configuração de teste | `main.ts`, testes |
| `.dependency-cruiser.cjs` | só `neon.ts` importa `@neon/sdk` (C56) | `npm run deps` |
| `package.json`, `package-lock.json`, `apps/server/package.json` | `@neon/sdk` 7.3.0 exata | CI (L16) |
| `infra/compose.yaml`, `infra/deploy.sh` | o segredo `hub_neon_api_key` | a publicação |
| `docs/how-to/hub-company-databases.md`, `index.md`, `architecture.md` §7 e §11, `boundaries.md` | a chave no servidor; duas organizações e o risco da chave; nome exato antes de criar | firstmate, agentes |

### Os contratos que a unidade cria

`NeonProjectId` e `NeonProjectName` (marcados, C23). `NeonAnswer<T> = {kind: 'DONE'; value: T} |
{kind: 'REFUSED'} | {kind: 'NO_ANSWER'}`. `NeonProjects = {find(name): Promise<NeonAnswer<NeonProjectId[]>>;
create(name): Promise<NeonAnswer<NeonProjectId>>; delete(id): Promise<NeonAnswer<'deleted'>>}`.
`createNeonProjects(config): NeonProjects`. Configuração: `HUB_NEON_API_URL` (https, ou http só nesta
máquina, como `MailApiUrl`), `HUB_NEON_ORG_ID`, `HUB_NEON_API_KEY_FILE` (S31), `NeonApiKey` como
`Secret`. `NEON_DEADLINE_MS` do Result de 0040.

### A ordem do trabalho

`@neon/sdk@7.3.0` `createNeonClient`: `apiKey`, `baseUrl`, `orgId`, `throwOnError: true`,
`requestTimeoutMs` (padrão sem limite), `retries` padrão (2, em 423, 429, 503), `wait.timeoutMs`
dentro do prazo (padrão 300 000), `fetch` que corta a resposta (C59).
`projects.list({search, org_id})` filtrado por igualdade exata; `projects.create({name,
region_id: 'aws-sa-east-1', pg_version: 18, org_id})`; `projects.delete({projectId})`, com
`not_found` como `'deleted'`. `isNeonError` por `kind`: `auth`, `client`: `SYSTEM` com a causa; `timeout`,
`network`, `aborted`: `NO_ANSWER`; o resto: `REFUSED`. Regras: C23, C27, C49, C50, C56,
C57, C59, C67, S31, S36, S37, S41.

### Como se prova

4, 5: `npm run test -w @conexus/server`, `fetch` plantado (T14).

## U4 Projetos no servidor

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/` | cria `projects.ts`, `project-failures.ts`; muda `failures.ts`, `index.ts` | servidor, web, OpenAPI |
| `apps/server/src/hub/projects/` | cria `projects.ts`, `company-database.ts`, `routes.ts`, `public.ts` e testes | `main.ts` |
| `apps/server/src/hub/identity/` | `admission.ts`, `auth.ts`, `public.ts` | rotas de empresa, Projetos |
| `apps/server/src/main.ts` | liga `projects` com o adaptador | — |
| `scripts/removals.json` | `company-database-claim`, `neon-exact-name`, `project-delete-role`, `deleting-company-admission` | `npm run removals` |
| `docs/reference/boundaries.md` | a reserva com prazo | revisores |

### Os contratos que a unidade cria

- `listProjects`: GET `/api/companies/{companyId}/projects`, `session`, `page`; 200 `{projects:
  ProjectSummary[], next, databaseReady: boolean}`; 401, 404, 503.
- `getProject`: GET `/api/companies/{companyId}/projects/{projectId}`, `session`; 200 `{project:
  Project}`; 401, 404, 503. `Project = ProjectSummary & {mayDelete: boolean}`.
- `createProject`: POST `/api/companies/{companyId}/projects`, `session`, `Idempotency-Key`, corpo
  `{name: ProjectName}`, limite 1024; 201 `{project: Project}`; 400, 401, 404, 409
  `PROJECT_NAME_TAKEN`, `COMPANY_DATABASE_PREPARING`, `IDEMPOTENCY_CONFLICT`, 503
  `COMPANY_DATABASE_UNAVAILABLE`, 503.
- `deleteProject`: DELETE `/api/companies/{companyId}/projects/{projectId}`, `session`, corpo
  `{name}`; 204; 401, 404, 422 `PROJECT_NAME_MISMATCH`, 503.
- `ACTIONS` ganha `readProjects` (`MEMBER`), `createProject` (`{project: ['create']}`) e
  `deleteProject` (`{project: ['delete']}`). Quem cria e quem apaga vive num lugar só: os papéis
  que `auth.ts` dá ao plugin por `createAccessControl`, as instruções padrão mais `project`;
  `create` a todos, `delete` a dono e administrador (P1 A). `allows` lê esses papéis. `admit` e
  `admitCompany` recusam empresa marcada: 404, motivo `DELETING`.

### A ordem do trabalho

1. Criar. Transação 1 no escopo da empresa: `transactionLock` da chave; `admit`; replay pela chave;
   `company_database` `FOR UPDATE`: `ready`, insere o Projeto; ausente ou reserva vencida, grava
   `creating` com `claimed_until` = agora + reserva; reserva viva, 409. Sem transação:
   `find`, um adota, nenhum cria, dois `SYSTEM`; `REFUSED` solta a reserva, `NO_ANSWER` a mantém.
   Transação 2: chave; `admit` de novo (S8); `ready` com o id; o Projeto. Regras: C26, C29, C37,
   C44, C48, C49, C65, D15, D22, S7, S8, S10, S41.
2. Apagar: uma transação; `admit`; o Projeto `FOR UPDATE`; o nome; DELETE. Regras: C38, S10.
   Funções: better-auth 1.7.8 `createAccessControl`, `organization({ac, roles})`.

### Como se prova

6–11: `npm run test -w @conexus/server`, o adaptador falso injetado em `createHub` (T5, T6, T10);
`npm run openapi`.

## U5 Apagar empresa em fases

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/operations/` | `clients.ts`, `public.ts`, testes | rotas da Central |
| `apps/server/src/hub/identity/` | `clients.ts`, `companies.ts`, `public.ts` | operações |
| `apps/server/src/hub/projects/public.ts` | `releaseCompanyDatabase`, `deleteCompanyProjects` | operações |
| `packages/hub-api/src/operations.ts`, `failures.ts` | `DELETING`; `CLIENT_DELETION_PENDING` | web |
| `apps/web/src/hub/operations/delete-client-dialog.tsx` | issue 74 | Central |
| `scripts/removals.json` | `deletion-live-claim`, `deletion-neon-not-found`, `deletion-mark-first` | `npm run removals` |

### Os contratos que a unidade cria

`markCompanyDeleting(tx, {admitted, companyId})`: marca e apaga os convites, sob `lockCompany`.
`releaseCompanyDatabase({admitted, companyId}): Promise<void>`, que lança
`CLIENT_DELETION_PENDING`. `deleteCompanyProjects(tx, {admitted, companyId})`. `ClientState` ganha
`{kind: 'DELETING'}`. `correctClient` num cliente marcado: 404.

### A ordem do trabalho

Fase 1, transação: `lockCompany`, `admitOperator`, revisão e nome (issue 73); sem banco, a
transação da 5 e fim; com banco, `markCompanyDeleting`. Fase 2: `releaseCompanyDatabase`. Fase 3,
transação: `lockCompany`, `admitOperator`, `deleteCompanyProjects`, o cadastro, `deleteCompany`. A
retomada é a mesma rota com o mesmo corpo. Regras: C4, C38, C57, D22, S8, S10, S11.

### Como se prova

12–16: `npm run test -w @conexus/server`, corrida com barreira (C65, T20).

## U6 As telas

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/projects/` | cria `projects.tsx`, `project.tsx`, `create-project-form.tsx`, `delete-project-dialog.tsx`, `queries.ts`, `public.ts` e testes | rotas |
| `apps/web/src/routes/_app/companies/` | cria `$companyId/projects/index.tsx`, `$companyId/projects/$projectId.tsx`; Pessoas ganha o link | roteador |
| `apps/web/src/hub/operations/` | `clients.tsx`, `client.tsx`, `delete-client-dialog.tsx` | rotas da Central |
| `apps/web/src/platform/test-hub.tsx` | as operações de Projetos | testes |

### A ordem do trabalho

Regras: W1, W4, W6, W8–W13, W17, W18, W21–W24, V29, V35, V39, V55. Base UI 1.9.0 por
`ui/alert-dialog.tsx`; o diálogo não fecha sozinho na espera.

### Como se prova

17: `npm run test -w @conexus/web`; navegador real em 1366, 390 e 320 px, dois temas, teclado (T23).

## U7 Percurso e remoções

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `tests/e2e/` | cria `projects.test.ts` e o Neon falso; muda `live-hub.ts` | `npm run e2e` |
| `package.json` | a lista do `e2e` | `npm run e2e` |
| `scripts/removals.json` | confere as linhas de U2, U4 e U5 | `npm run removals` |

### Como se prova

18, 19: `npm run e2e`, `npm run removals`. Regras: T5, T6, T12, T14.
