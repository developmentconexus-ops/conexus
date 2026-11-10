# Capacidade 1: O banco do app

O roteiro diz: "**Capacidade 1. O banco do app.** Abre no Projeto as tabelas e as linhas de um app
seu." O fundador aprovou a direção em 2026-11-09 ("Aprovado"), depois de ler o estudo e o parecer de
arquitetura de código: só leitura; uma página **Dados** no menu do Projeto, depois de Integrações;
vista por dono, administrador e desenvolvedor, pelos papéis do Better Auth; a forma de código do
parecer, com os seus seis ajustes. Este cartão escreve essa direção. Cada linha citada foi lida no
`main` em `21af1a55`, com `better-auth` 1.7.8, `@neondatabase/serverless` 1.2.0,
`@tanstack/react-router` 1.170.44, `@tanstack/react-query` 5.104.0, `zod` 4.6.5 e PostgreSQL 18. O
construtor de cada unidade reabre as linhas no `main` do dia.

## A página do fundador

**No fim desta capacidade** você abre um Projeto que já tem app, clica em **Dados** no menu do
Projeto e vê as tabelas do app, quantas linhas cada uma tem, e as linhas de cada tabela, 50 por
vez. Nada se edita ali.

**O roteiro de uso.** Você é dono da empresa, e o Projeto "CRM" tem um app publicado que já guardou
clientes e anotações.

1. No Projeto "CRM", o menu à esquerda tem **Dados** logo abaixo de Integrações. Clique. Aparecem
   as tabelas que o app criou, cada uma com o número de linhas: `clientes 1.284`, `anotacoes 37`,
   `metas 0`. Uma tabela com mais de 10.000 linhas mostra "mais de 10.000".
2. Clique em `clientes`. À direita aparecem as colunas e as primeiras 50 linhas. Um texto muito
   longo aparece cortado, terminando em "…". Uma célula sem valor aparece como um traço apagado.
3. Embaixo, toque **Ver mais**: vêm as 50 seguintes. **Primeira página** volta ao começo, e o
   Voltar do navegador volta uma página. Copie o endereço e abra numa aba nova: aparece a mesma
   tabela, na mesma página.
4. Abra `metas`: aparecem as colunas e a frase de que a tabela ainda não tem linhas.
5. Entre como uma pessoa que é **Membro** da empresa e abra o mesmo Projeto: **Dados** não aparece
   no menu, e o endereço que você copiou mostra "não encontrado".
6. No celular, **Dados** mostra a lista de tabelas; tocar numa tabela abre as linhas numa tela só
   dela, com a volta para a lista no alto.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. No fim: faz o roteiro
num Projeto seu, diz o que viu e aprova os textos das telas.

**Fica de fora.**

- **Editar, apagar ou acrescentar linhas.** Quem muda dado é o app, com as regras dele, ou o
  Builder. A Prévia usa os dados reais, então um erro ali apagaria dado de verdade (sua direção de
  2026-11-09: só leitura).
- **Buscar, filtrar, ordenar por coluna, abrir o valor inteiro de uma célula e exportar.** Entram
  depois, se você pedir.
- **Números de página ("‹ 1 2 3 ›").** A página usa a mesma paginação de toda lista do Hub: **Ver
  mais** e **Primeira página**.
- **As tabelas que o Sync vai copiar para a empresa.** A capacidade 2 decide onde elas moram; esta
  página mostra as tabelas do app.
- **Os avisos guardados para um cartão** (`next-card`, 137 abertos em 2026-11-09): nenhum toca o
  banco do app, a página Dados ou a leitura dos agentes, então todos esperam o cartão do assunto
  deles.

**As decisões suas nesta capacidade.** Nenhuma. As três que o estudo listou já têm a sua resposta
de 2026-11-09 (só ver; uma página no menu do Projeto; dono, administrador e desenvolvedor). As
frases das telas você aprova no fim, como em toda etapa.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 A leitura no servidor | A permissão `app: viewData` e a ação `viewAppData`; o contrato `app-data.ts` com `listAppTables` e `listAppRows`; as duas falhas novas; a lista de tabelas, a contagem e a página de linhas em `hub/apps`, sobre a leitura de hoje, que passa a aceitar valores ligados; o Construtor lendo a mesma lista, e a consulta própria dele apagada | `packages/hub-api/src/`, `apps/server/src/hub/{apps,identity}/`, `apps/server/src/platform/`, `apps/server/src/builder/{construtor,agents}/`, `apps/server/src/conversations-of.ts`, `apps/web/src/platform/test-may.ts`, `docs/explanation/hub-apps.md` | [data](../guides/data.md) | esta página aprovada |
| U2 A página Dados | As rotas `…/data` e `…/data/$table`; a lista com a contagem; as linhas em páginas; os estados; a entrada **Dados** no menu; as três peças de tabela exportadas de `ui/table.tsx` | `apps/web/src/hub/{apps,projects}/`, `apps/web/src/routes/_app/companies/$companyId/projects/`, `apps/web/src/ui/table.tsx`, `packages/hub-api/src/pages.ts`, `docs/reference/screens.md` | [web](../guides/web.md) | U1 |

As duas unidades vão juntas num só pull request de construção, um commit por unidade, a U1
primeiro e a U2 em cima dela: a U2 lê o contrato da U1, então não correm em paralelo. O CI roda uma
vez no pull request, e o revisor lê cada commit (mudança de método anunciada pelo fundador em
2026-11-09). Cada commit termina verde sozinho: a U1 não depende de nenhum arquivo da U2.

**O trilho de desenho.** A U2 muda `apps/web/src/ui/table.tsx`, que é do trilho de desenho
([delivery L1](../guides/delivery.md)): só exporta `Table`, `TableHeader` e `TableHead`, que já
estão escritas no arquivo, sem mudar a aparência. Em `21af1a55` não há cartão do trilho de desenho
em `docs/steps/`, então nada espera. Se um cartão de desenho entrar antes da U2 e tocar
`ui/table.tsx`, a U2 espera a unidade dele nesse arquivo.

**Orçamento de código alterado.** U1: ~650 linhas (permissão ~30, contrato e falhas ~110, leitura
com valores ~15, lista e contagem ~140, página de linhas ~150, rotas e porta ~60, Construtor ~-30,
documento ~5). U2: ~450 linhas (três rotas ~110, a lista ~110, as linhas ~160, consultas e porta
~25, menu ~10, `ui/table.tsx` ~5, `PAGES` e `screens.md` ~5). Total da capacidade: ~1.100 linhas,
abaixo do orçamento de [delivery L2](../guides/delivery.md).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `GET /api/companies/{c}/projects/{p}/tables` responde 200 ao dono, ao administrador e ao desenvolvedor. Ao membro, a uma pessoa com um papel próprio da empresa e a quem é de outra empresa, responde 404 `NOT_FOUND`, igual a um Projeto que não existe (S10); `…/tables/{t}/rows` recusa os mesmos três do mesmo jeito | `apps/server/src/hub/apps/app-data.test.ts`, "dados: quem vê e quem recebe não encontrado" | must |
| 2 | U1 | A lista traz as tabelas do esquema do app em ordem de nome, nunca o livro `conexus_migration`, cada uma com a contagem: `EXACT` com o número abaixo de 10.001 linhas, `OVER` a partir de 10.001 linhas | `app-data.test.ts`, "dados: a lista e a contagem" | must |
| 3 | U1 | Quando a contagem falha e a lista não, a resposta é 200 com cada tabela em `UNKNOWN`, nunca 0 (`docs/architecture.md:27-28`) | `app-data.test.ts`, "dados: a contagem que falha é indisponível" | must |
| 4 | U1 | Um Projeto sem app responde 200 `{ kind: 'NO_APP' }` na lista, e 404 `NOT_FOUND` nas linhas de qualquer tabela | `app-data.test.ts`, "dados: Projeto sem app" | must |
| 5 | U1 | As linhas vêm 50 por página, na ordem da chave primária (composta, na ordem da chave); `next` é `MORE` com uma ficha enquanto há mais e `END` na última; a ficha da página 2 traz as linhas 51 a 100. Uma tabela sem chave vem na ordem de `ctid`, e as páginas juntas trazem cada linha uma vez | `app-data.test.ts`, "dados: páginas pela chave" e "dados: tabela sem chave" | must |
| 6 | U1 | Cada célula chega como texto do PostgreSQL ou `null`: um texto de 24.000 caracteres chega com 100 e `cut: true`; `numeric`, `timestamptz`, `boolean`, `jsonb` e `bytea` chegam como o PostgreSQL os escreve em texto; uma página de 50 linhas com 30 colunas de 24.000 caracteres responde 200 | `app-data.test.ts`, "dados: cada célula vira texto, cortada" | must |
| 7 | U1 | Uma tabela que não existe, o nome `conexus_migration` e um nome com aspas e ponto e vírgula que não está no catálogo respondem 404 `NOT_FOUND`; uma tabela real cujo nome tem aspas e espaço é lida; um nome de 64 caracteres é recusado pela entrada do contrato (400 `REQUEST_MALFORMED`); uma ficha que não é de `pageOf` responde 400 `REQUEST_MALFORMED` | `app-data.test.ts`, "dados: o nome vem do catálogo" | must |
| 8 | U1 | Com o banco do app sem resposta, ou passado o prazo, as duas rotas respondem 503 `APP_DATABASE_UNAVAILABLE` com a frase da linha nova; uma página que passaria do teto de 1 MB (200 colunas de 100 caracteres acentuados) responde 422 `APP_TABLE_TOO_WIDE` | `app-data.test.ts`, "dados: o banco do app não responde" e "dados: tabela larga demais" | must |
| 9 | U1 | O registro de cada leitura da página leva só ids e o tipo da resposta (`APP_DATA_READ`), nunca o SQL, o nome da tabela nem uma linha (S41) | `app-data.test.ts`, "dados: o registro não leva dado" | must |
| 10 | U1 | O Construtor recebe as mesmas tabelas e colunas que a lista da página, pela porta de `hub/apps`; `TABLES_SQL` não existe mais no código | `apps/server/src/builder/construtor/app-tables.test.ts`, "as tabelas do app: o Construtor lê a lista do Hub"; `git grep TABLES_SQL` vazio | must |
| 11 | U1 | `getCompany` responde `may.viewAppData` verdadeiro para dono, administrador e desenvolvedor, falso para membro e papel próprio | `apps/server/src/hub/identity/developer.test.ts`, o caso de `may` | must |
| 12 | U2 | O menu do Projeto mostra **Dados** depois de Integrações para quem tem `may.viewAppData`, e não mostra para o membro; o membro que abre `…/data` vê "não encontrado" na área do conteúdo | `apps/web/src/hub/apps/data.test.tsx`, "Dados: o menu e quem não vê" | must |
| 13 | U2 | `…/data` mostra cada tabela com a contagem em português (`1.284`), "mais de 10.000" para `OVER` e "indisponível" para `UNKNOWN`; um Projeto sem app e um app sem tabelas mostram cada um a sua frase | `data.test.tsx`, "Dados: a lista" | must |
| 14 | U2 | `…/data/$table` mostra as colunas e as linhas; a célula cortada termina em "…"; a célula `null` mostra o traço com o nome acessível "sem valor"; **Ver mais** leva a `?page=<ficha>` e **Primeira página** a tira; abrir o endereço com `?page=` mostra a mesma página | `data.test.tsx`, "Dados: as linhas em páginas" | must |
| 15 | U2 | Uma tabela vazia mostra as colunas e a frase de tabela sem linhas; uma tabela que não existe mostra "não encontrado" na área das linhas, com a lista ao lado | `data.test.tsx`, "Dados: tabela vazia e tabela que não existe" | must |
| 16 | U2 | Com 503 `APP_DATABASE_UNAVAILABLE`, a área das linhas mostra a frase e **Tentar de novo**, a lista fica; tocar **Tentar de novo** lê de novo; enquanto carrega, só a área das linhas vira esqueleto | `data.test.tsx`, "Dados: o banco do app não respondeu" | must |
| 17 | U2 | A 390 px, `…/data` mostra só a lista e `…/data/$table` só as linhas, com o link "Tabelas" de volta; a página não rola de lado, a tabela rola dentro da sua caixa (V18) | `data.test.tsx`, "Dados: no celular"; captura de QA a 390 px | must |
| 18 | U2 | As duas rotas novas estão em `PAGES`, e o Hub abre a página das telas nelas | o teste da web que confere o roteador contra `PAGES` | must |
| 19 | U2 | QA percorre o roteiro de uso nos dois temas, a 1366 e a 390 px | relatório de QA ([testing T25](../guides/testing.md)) | should |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dados, a lista (`…/data`) | Projeto sem app: título **Dados** e a frase "Este Projeto ainda não tem app. Peça um ao Builder." (`Empty`) | App sem tabelas: "O app ainda não criou tabelas." (`Empty`) | A moldura do Projeto fica; esqueleto no conteúdo (`Loading`, W34) | 503 `APP_DATABASE_UNAVAILABLE`: a frase da linha e **Tentar de novo** (`RouteReadFailure`); contagem que falha: a lista aparece com "indisponível" no lugar do número | Projeto que não existe ou de outra empresa: `NotFound` | Membro ou papel próprio: sem a entrada no menu; o endereço dá `NotFound` (W34, S10) | não se aplica: só leitura |
| Dados, as linhas (`…/data/$table`) | não se aplica: só se chega por uma tabela da lista | Tabela sem linhas: o cabeçalho das colunas e "Esta tabela ainda não tem linhas." (`Empty`) | A lista fica; esqueleto só na área das linhas | 503: a frase e **Tentar de novo** na área das linhas, a lista fica; 422 `APP_TABLE_TOO_WIDE`: a frase da linha, sem botão | Tabela que não existe, nome que o contrato recusa, ficha estragada: `NotFound` na área das linhas | Igual à lista | não se aplica: só leitura |

As frases entre aspas são a proposta do cartão; o fundador aprova os textos das telas no fim
([delivery L23](../guides/delivery.md)).

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `CompanyMay.viewAppData` | U1, `hub/identity/companies.ts` por `allows(role, 'viewAppData')` | U2, `hub/projects/project-rail.tsx` (a entrada **Dados**) |
| `listAppTables` → `kind` (`NO_APP` ou `TABLES`) | U1, `hub/apps/app-tables.ts` | U2, `hub/apps/data.tsx` (frase de primeira vez ou lista) |
| `AppTableSummary.name` | U1, do catálogo | U2, o link para `…/data/$table` e o texto da lista |
| `AppTableSummary.rows` (`EXACT`, `OVER`, `UNKNOWN`) | U1, a contagem | U2, o número, "mais de 10.000" ou "indisponível" |
| `listAppRows` → `columns[].name` | U1, do catálogo da tabela | U2, o cabeçalho |
| `listAppRows` → `rows[][]` (`AppCell`: `null` ou `{ text, cut }`) | U1, `hub/apps/app-rows.ts` | U2, `hub/apps/data-rows.tsx` (texto, "…", traço) |
| `listAppRows` → `next` | U1, `pageOf` | U2, `Pager` |
| `AppTableName` (o parâmetro `table`) | U2, o link da lista, por `params` | U1, a entrada da rota e o catálogo |

Os tipos e a chave de cada coluna ficam no servidor (a ordem da página), e não entram no contrato:
nenhuma tela os lê nesta capacidade.

**O desenho de caixas.** O produto antigo não tinha esta tela (estudo, `e0353c36`), então não há
captura a seguir. As peças são as do Hub (`ui/states.tsx`, `ui/table.tsx`, `ui/pager.tsx`, a linha
de lista do `DESIGN.md:259-270`).

```
1280 px, …/data/clientes
┌ Projeto CRM ─────┬──────────────────────────────────────────────────────────────┐
│ Construir        │ Dados                                                        │
│ Conversas        │ ┌ Tabelas ─────────┐ ┌ clientes ──────────────────────────┐ │
│ Agentes          │ │ anotacoes     37 │ │ id │ nome          │ cidade │ criado│ │
│ Automações       │ │▌clientes   1.284 │ │ 1  │ Padaria Sol   │ Recife │ 2026-…│ │
│ Sobre            │ │ metas          0 │ │ 2  │ Mercado Lua   │ —      │ 2026-…│ │
│ Quem usa o app   │ │                  │ │ …  50 linhas, rolagem lateral só aqui│ │
│ Integrações      │ │                  │ │ Primeira página   Ver mais        │ │
│ Dados ◀          │ └──────────────────┘ └───────────────────────────────────┘ │
└──────────────────┴──────────────────────────────────────────────────────────────┘

390 px, …/data                         390 px, …/data/clientes
┌──────────────────────────┐          ┌──────────────────────────┐
│ ☰  CRM                   │          │ ☰  CRM                   │
│ Dados                    │          │ ‹ Tabelas                │
│ anotacoes             37 │          │ clientes                 │
│ clientes           1.284 │          │ id │ nome        │ cid… →│
│ metas                  0 │          │ 1  │ Padaria Sol │ Rec…  │
│                          │          │ Primeira página Ver mais │
└──────────────────────────┘          └──────────────────────────┘
```

## A tabela de falhas

Nenhuma gravação nova: a capacidade só lê. A única escrita que uma leitura da página pode disparar
é a de hoje, criar o login de leitura de um app antigo que não o tem (`ensureReadLogin`,
`apps/server/src/platform/app-read.ts:76-100`), que a página herda sem mudar.

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `ensureReadLogin`, herdada, disparada pela primeira leitura de um app sem login de leitura | A segunda recebe `42710` e lê de novo (`app-read.ts:98-99`) | Uma transação só, tudo ou nada (`app-read.ts:86-96`) | O dono não responde: `APP_DATABASE_UNAVAILABLE` na página | `APP_READ_LOGIN_FAILED` ou `APP_READ_LOGIN_CREATED`, só ids (`app-database.ts:160-163`) | 8, 9 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Entrada **Dados** no menu do Projeto | U2 | `apps/web/src/hub/projects/project-rail.tsx:81-149` `ProjectRailNav` (Construir … Integrações; "Each later one is added by its step", `:77`); `docs/guides/web.md` W31 já nomeia Dados depois de Integrações | `vibesdk@9da158d` `src/routes/chat/components/main-content-panel.tsx:26,72-74,405`; Supabase `cb52c0f4` Table Editor no menu do projeto; ToolJet `aa67409` `frontend/src/TooljetDatabase/` | vibesdk: aba `'database'` ao lado da prévia, só quando `databaseAvailable`. Supabase e ToolJet: seção própria | nativo: um `FrameLink` sob `may.viewAppData`, como Agentes (`project-rail.tsx:113-120`) | | 2026-11-09: "Aprovado" (página no menu do Projeto, depois de Integrações) | — |
| Quem vê a página | U1 | `apps/server/src/hub/identity/admission.ts:59-118` `ACTIONS` (sem ação de dados do app; `readAgents` usa `MANAGE_AGENTS`, `:98`); `roles.ts:41-46` `BUILD`; `:101` desenvolvedor | `better-auth@1.7.8` `createAccessControl`/`newRole` (uso em `roles.ts:67-109`) e `authorize` (em `allows`, `admission.ts:139-144`); vibesdk `worker/api/routes/codegenRoutes.ts:49-61` `AuthConfig.ownerOnly`; ToolJet `server/src/modules/tooljet-db/ability/index.ts:55-83` | vibesdk: só o dono. ToolJet: `VIEW_TABLE` para todos do espaço; criar e apagar tabelas para admin e construtor | nativo: a operação `viewData` no recurso `app`, dentro de `BUILD`; a ação `viewAppData` em `ACTIONS`, `MEMBER`, sem trava. Um papel próprio da empresa cai em `member` (`admission.ts:142`) e não vê | | 2026-11-09: "Veem o banco do app o dono, o administrador e quem constrói (papéis do Better Auth)" (`docs/roadmap.md`, resposta 5); "Aprovado" | — |
| Lista de tabelas e colunas, um dono para a página e o Construtor | U1 | `apps/server/src/builder/construtor/app-tables.ts:9-10` `TABLES_SQL` (`information_schema.columns`, só nomes) e a montagem em `:41-50` | vibesdk `space/src/space/inspector-wrapper.ts:55-82` (`sqlite_master` + `PRAGMA table_info`: nome, tipo, não nulo, chave); Supabase `packages/pg-meta` | vibesdk: nome, tipo e chave de cada coluna, do catálogo do próprio banco | nativo: o catálogo do PostgreSQL 18 (`pg_class`, `pg_namespace`, `pg_attribute`, `format_type`, `pg_index`, `has_table_privilege`) lido pelo login de leitura, numa função de `hub/apps` que o Construtor recebe pela porta | Estudo, prova local como `app_<p>_read`: `information_schema.columns` esconde o livro, mas `information_schema.table_constraints` não mostra a chave a quem só tem `SELECT` (0 linhas); `pg_index` mostra; `pg_class` lista o livro, por isso o filtro `has_table_privilege` | não precisa | `apps/server/src/hub/apps/app-tables.ts` |
| Contagem de linhas por tabela | U1 | nenhum | vibesdk `inspector-wrapper.ts:72-80` `COUNT(*)` exato, 0 quando falha; Supabase `packages/pg-meta/src/sql/studio/database/get-count-estimate.ts:3,13` (`THRESHOLD_COUNT = 50000`) e `rows.ts:6-12,92-95`; ToolJet `frontend/src/TooljetDatabase/Table/Footer.jsx:19-24` | vibesdk e ToolJet: exata. Supabase: exata até 50.000, acima uma estimativa por `EXPLAIN`, com regra própria para o −1 de tabela nunca analisada | embrulhado: uma segunda instrução, `union all` de `count(*)` sobre `limit 10001` por tabela, com os nomes do catálogo citados. O nosso acrescenta o teto, o rótulo "mais de 10.000" e "indisponível" quando a instrução falha | Estudo e parecer, prova local: `clientes 10001`, `anotacoes 30`, `sem_chave 120`, `vazia 0` em 1,3 ms; o plano para na linha 10.001; `reltuples` dá −1 antes do `ANALYZE`. No Neon, não medido | não precisa | `apps/server/src/hub/apps/app-tables.ts` |
| Linhas de uma tabela, página a página | U1, U2 | `apps/server/src/platform/app-read.ts:113-143` `readApp` (uma instrução, só texto); `packages/hub-api/src/companies.ts:85-101` `Next`, `PAGE_SIZE`, `Page`; `apps/server/src/platform/pages.ts:12-41` `pageOf`, `pageKey`; `apps/web/src/ui/pager.tsx:9-32` `Pager` | vibesdk `worker/api/controllers/appDatabase/controller.ts:54-55,138-163` (padrão 50, máx. 200, `limit`/`offset`) e `inspector-wrapper.ts:85-119` (nome conferido no catálogo, `LIMIT ? OFFSET ?` como valores); Supabase `packages/pg-meta/src/query/table-row-query.ts:110-129` (ordem padrão pela chave) e `apps/studio/data/table-rows/table-rows-query.ts:158-176,183` (`ctid` de desempate); ToolJet `Footer.jsx:12-16,35-36` | As três paginam por deslocamento; o Supabase ordena pela chave e desempata por `ctid` "so page order doesn't shuffle" | embrulhado: `PAGE_SIZE` 50, `pageOf`/`pageKey` com o deslocamento dentro da ficha, a ordem pela chave ou só por `ctid`, limite e deslocamento como valores ligados (D20). O nosso acrescenta o texto da instrução | Estudo e parecer, prova local: página ordenada lida pelo login de leitura; `ctid` legível por ele. O conflito com `docs/reference/boundaries.md:331-333` ("a page by offset shifts when a row arrives") fica registrado para o fechamento ([code C75](../guides/code.md)): uma tabela de app pode não ter chave, ou ter chave composta de qualquer tipo, que não cabe na ficha de 64 caracteres | não precisa | `apps/server/src/hub/apps/app-rows.ts`; `apps/web/src/hub/apps/data-rows.tsx` |
| Valor grande numa célula | U1, U2 | `apps/server/src/platform/app-sql.ts:32` `REPLY_CAP_BYTES = 1 MB`; `app-read.ts:122-127` → `APP_DATA_TOO_LARGE` | Supabase `table-row-query.ts:17-19` (`MAX_CHARACTERS` 10 KB), `:37-85` (corte por tipo dentro do SQL); vibesdk `src/routes/chat/components/database-viewer.tsx:244-316` (recebe tudo, corta na tela, diálogo com o valor inteiro) | Supabase corta texto, json e binário no SQL e devolve os outros tipos no tipo deles, para editar. vibesdk corta na tela | embrulhado: toda coluna vira texto e é cortada no SQL, `left(("c")::text, 101)`; 101 caracteres querem dizer cortado. O nosso acrescenta a regra única para todo tipo | Parecer: 30 linhas de 24.000 caracteres somam 705 kB pelo login de leitura, 50 passam de 1 MB, então cortar na tela não evita o teto. Um texto por toda coluna tira a dúvida de como o driver HTTP do Neon devolve `bigint`, `numeric` e datas, e com ela a gravação que [testing T26](../guides/testing.md) pediria | não precisa | `apps/server/src/hub/apps/app-rows.ts` |
| Só leitura | U1 | `app-read.ts:41-67` (`default_transaction_read_only = on`, só `SELECT`, `REVOKE` no livro); `apps/server/src/platform/company-postgres.ts:80-108` `readOnly: true` | `@neondatabase/serverless@1.2.0` `index.d.ts:489-504` (`readOnly`, padrão `false`); vibesdk `database-viewer.tsx:79,91-95` e `controller.ts:180-204` (rótulo "read-only", mas apaga tudo) | vibesdk lê e tem um botão que apaga o banco; Supabase e ToolJet editam | nativo: as permissões do PostgreSQL e a transação só de leitura do driver, herdadas | Estudo: `cannot execute INSERT in a read-only transaction` pelo login de leitura | 2026-11-09: "Aprovado" (só leitura) | — |
| Prévia e publicado: um só banco | U1 | `docs/explanation/hub-apps.md:101-110`; `packages/hub-api/src/app-login.ts` (`app_<id>`, `_run`, `_migrate`, `_read`) | vibesdk `controller.ts:60-85` (um banco por ramo) | vibesdk mostra o banco do ramo atual | nativo: herdado, um esquema por Projeto | | 2026-11-09: "A Prévia usa os dados reais" (`docs/roadmap.md`, resposta 5) | — |
| Endereço da página: a tabela no caminho, a página em `?page=` | U2 | `apps/web/src/routes/_app/companies/$companyId/projects/index.tsx:9-14` (`validateSearch`, `loaderDeps`); `$projectId_.agents.$agentId.tsx` (rota moldura com `Outlet`); `apps/web/src/platform/hub.ts:268-282` `readOrNotFound`, `idOrNotFound` | `@tanstack/react-router@1.170.44` (`node_modules/@tanstack/router-core/skills/router-core/data-loading/SKILL.md:62-79`, `search-params/SKILL.md:27`, `path-params/SKILL.md`); Supabase `apps/studio/pages/project/[ref]/editor/[id].tsx` | Supabase põe a tabela no caminho; vibesdk guarda a tabela em `useState`, fora do endereço | nativo: rota filha com `loader`, `pendingComponent`, `errorComponent` e `notFound` só na área das linhas; `params` codificado pelo roteador | | não precisa | `apps/web/src/routes/_app/companies/$companyId/projects/$projectId_.data.tsx`, `$projectId_.data.index.tsx`, `$projectId_.data.$table.tsx` |
| Estados: sem app, sem tabelas, tabela vazia, banco sem resposta | U1, U2 | `apps/server/src/hub/apps/app-database.ts:142-150` (`APP_DATA_NO_APP`, `APP_DATA_UNAVAILABLE`), `app-read.ts:128-138` (`APP_DATA_TIMEOUT`), só para o modelo; `packages/hub-api/src/failures.ts:78-85` `DATABASE_UNAVAILABLE` ("O banco do Conexus não respondeu", ação `NONE`); `apps/web/src/ui/states.tsx:85-90,105-127` | vibesdk `database-viewer.tsx:100-150` ("No tables yet.", "No rows.", faixa de erro); Mitra, lição E1 (`conexus-os@e0353c36 docs/research/mitra/full-study.md:1326`) | vibesdk separa sem tabelas, sem linhas e erro; Mitra: vazio, carregando e falhou são estados diferentes | nativo: `NO_APP` como estado da resposta (C22); a linha de falha `APP_DATABASE_UNAVAILABLE` com `RETRY` na tabela de falhas (C48); `Empty`, `Loading`, `RouteReadFailure`, `NotFound` | | não precisa | — |
| Tabela larga demais para uma página | U1, U2 | `app-read.ts:122-127` → `APP_DATA_TOO_LARGE`, só para o modelo | Supabase `table-row-query.ts:17-19` (corte por célula, sem teto da página) | Supabase corta cada célula e não tem teto da resposta | nativo: o teto de hoje, que a página traduz na linha de falha `APP_TABLE_TOO_WIDE` | | não precisa | — |
| Celular (390 px) | U2 | `apps/web/src/ui/table.tsx:7-17` (rolagem lateral dentro da caixa) | vibesdk `database-viewer.tsx:107` (lista fixa `w-56`, sem desenho de celular) | Nenhuma referência lida desenha para celular | nativo: a rota filha dá uma tela de cada vez; `useIsMobile` de `ui/use-mobile.ts` esconde a lista quando há tabela | | não precisa | — |
| Peças de tabela na tela | U2 | `ui/table.tsx:7,19,43` `Table`, `TableHeader`, `TableHead` escritas e não exportadas; `FramedTable` (`:73-100`) é de configurações, com cabeçalho escondido | `@shadcn/react@0.3.1`, a tabela copiada em `ui/table.tsx`; vibesdk `database-viewer.tsx:153` `<table>` puro | vibesdk usa `<table>` puro; Supabase e ToolJet usam grade porque editam | nativo: exportar as três peças. `@tanstack/react-table` não entra na web (dependência nova, [delivery L16](../guides/delivery.md), para ordenar e filtrar, que ficam de fora) | | não precisa | — |
| Registro do que se leu | U1 | `app-database.ts:126-130,166-189` (ids e o tipo da resposta, nunca o SQL nem uma linha) | vibesdk registra só erros (`controller.ts:110,174`) | | nativo: herdado ([code C50](../guides/code.md), [security S41](../guides/security.md)) | | não precisa | — |
| A leitura com valores ligados | U1 | `app-read.ts:113-119` `readApp(..., sql: string, ...)` manda `[{ text: sql }]`; `app-sql.ts:4` `SqlStatement` já tem `values`; `company-postgres.ts:88` já os liga | `@neondatabase/serverless@1.2.0` `sql.transaction` com `{ text, values }` | O driver liga os valores | nativo: `readApp`, `CompanyPostgres.readApp` e `readAppData` recebem um `SqlStatement` em vez do texto; a ferramenta dos agentes manda `{ text }` | | não precisa | — |

O Mastra não entra: o Studio do Mastra 1.82.0 não mostra tabelas de app
(`node_modules/@mastra/core/dist/docs/references`; estudo).

**A medida do transplante.** Nenhuma peça vem do produto antigo: ele não tinha tela de dados
(estudo, buscas em `conexus-os@e0353c36` `apps/web/src/routes`, `features` e `apps/hub/src`).

**A dívida.**

- `docs/reference/boundaries.md:331-333` diz que as listas do Hub não paginam por deslocamento; a
  página de linhas pagina. O fechamento escreve a exceção ao lado da entrada (C75).
- Uma tabela grande sem chave ordena por `ctid` a cada página; passado o prazo de 5 s, a página dá
  `APP_DATABASE_UNAVAILABLE`. Tempo no Neon não medido; se o uso do fundador mostrar, uma issue
  futura.
- A lista e a contagem são duas chamadas ao Neon ao abrir a página; tempo no Neon não medido.

## U1 A leitura no servidor

**Base e modelo.** `main` em `21af1a55`. Sonnet: os contratos estão escritos abaixo; o trabalho é
ligar camadas que já existem.

### As linhas da tabela

- **Quem vê a página.** Ler `apps/server/src/hub/identity/roles.ts:39-46` (`BUILD`), `:67-80`
  (`createAccessControl`), `:81-109` (os quatro papéis); `admission.ts:11-27` (constantes),
  `:28-49` (`ActionRule`), `:59-118` (`ACTIONS`), `:139-144` (`allows`); `companies.ts:96-106`
  (`may`); `packages/hub-api/src/roles.ts:47-53` (`CompanyMay`); `apps/web/src/platform/test-may.ts`.
  Modelo: `readAgents` (`admission.ts:98`) e `manageAgents` em `may` (`companies.ts:99`).
- **Lista de tabelas e colunas; contagem.** Ler `apps/server/src/builder/construtor/app-tables.ts`
  inteiro (o que sai), `apps/server/src/conversations-of.ts:55-60,144`,
  `apps/server/src/builder/agents/app-data.ts:10-22` (`AppDataPort`),
  `apps/server/src/builder/construtor/tools.ts:47-48` (`AppTable` no Construtor). Referência:
  vibesdk `inspector-wrapper.ts:49-51` (identificador citado) e `:92-96` (nome conferido no
  catálogo).
- **Linhas, valor grande, valores ligados.** Ler `apps/server/src/platform/app-read.ts:108-143`,
  `app-sql.ts:4,32-37`, `company-postgres.ts:58-66` (`CompanyPostgres`),
  `hub/apps/app-database.ts:106-193`, `platform/pages.ts:12-41`. Referência: vibesdk
  `inspector-wrapper.ts:113-116`; Supabase `table-rows-query.ts:158-183`.
- **Estados e falhas.** Ler `packages/hub-api/src/app-failures.ts` (o formato de uma linha),
  `failures.ts:270-280` (onde as famílias entram), `apps.ts:150-175` (`listAppVersions`, o modelo de
  operação).
- **Registro.** `app-database.ts:125-193`, que não muda de forma.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/{app-data,roles,app-failures,failures,index}.ts` | Cria `app-data.ts`; muda os outros | `apps/server`, `apps/web` |
| `apps/server/src/hub/identity/{roles,admission,companies}.ts` | Muda | `hub/apps`, as rotas de identidade |
| `apps/server/src/hub/apps/` | Cria `app-tables.ts`, `app-rows.ts`, `app-data.test.ts`; muda `app-database.ts`, `routes.ts`, `public.ts` | `apps/server/src/main.ts`, `apps/server/src/conversations-of.ts` |
| `apps/server/src/platform/{app-read,company-postgres}.ts` | Muda (`readApp` recebe `SqlStatement`) | `hub/apps/app-database.ts`, os dublês `platform/test-*.ts` |
| `apps/server/src/platform/test-*.ts` | Muda, se um dublê de `CompanyPostgres` existir | os testes |
| `apps/server/src/builder/agents/{app-data,public}.ts` | Muda (`AppDataPort` ganha `tables`; `read` manda `{ text }`) | `builder/construtor`, `conversations-of.ts` |
| `apps/server/src/builder/construtor/{app-tables,app-tables.test,tools,public}.ts` | Muda; `TABLES_SQL` e a montagem saem | `conversations-of.ts` |
| `apps/server/src/conversations-of.ts` | Muda (`appDataOf` liga `tables`) | `main.ts` |
| `apps/server/src/hub/identity/developer.test.ts` | Muda (o caso de `may`) | — |
| `apps/web/src/platform/test-may.ts` | Muda (o campo novo, para a web compilar) | os testes da web |
| `docs/explanation/hub-apps.md` | Muda a linha do login de leitura (`:107`) | — |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** `TABLES_SQL` e a montagem de
`builder/construtor/app-tables.ts:8-10,41-50`; `readApp(..., sql: string, ...)` vira
`readApp(..., statement: SqlStatement, ...)`.

`packages/hub-api/src/app-data.ts`, exportado por `index.ts`:

```ts
/** A table of an app's schema, as PostgreSQL names it: 1 to 63 characters (NAMEDATALEN − 1). */
export const AppTableName = z.string().min(1).max(63).brand<'AppTableName'>()
export type AppTableName = z.infer<typeof AppTableName>

/** How many rows a table has: exact below the cap, past it, or unknown when the count failed. */
export const ROW_COUNT_CAP = 10_000
export const RowCount = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('EXACT'), rows: z.int().min(0).max(ROW_COUNT_CAP) }),
  z.object({ kind: z.literal('OVER') }),
  z.object({ kind: z.literal('UNKNOWN') }),
])

export const AppTableSummary = z.object({ name: AppTableName, rows: RowCount })

export const AppTables = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('NO_APP') }),
  z.object({ kind: z.literal('TABLES'), tables: z.array(AppTableSummary) }),
])

/** The characters a cell shows; one more read from the database says it was cut. */
export const CELL_CHARACTERS = 100
export const AppCell = z
  .object({ text: z.string().max(CELL_CHARACTERS), cut: z.boolean() })
  .nullable()

export const listAppTables = defineOperation({
  id: 'listAppTables',
  summary: 'Lists the tables of a Projeto’s app with their row counts, for who builds.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/projects/{projectId}/tables',
  bodyLimit: 1024,
  input: { params: OfProject },
  success: { status: 200, body: AppTables },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE', 'APP_DATABASE_UNAVAILABLE'],
})

export const listAppRows = defineOperation({
  id: 'listAppRows',
  summary: 'Lists one page of a table of a Projeto’s app, each cell as text, for who builds.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/projects/{projectId}/tables/{table}/rows',
  bodyLimit: 1024,
  input: { params: OfProject.extend({ table: AppTableName }), query: Page },
  success: {
    status: 200,
    body: z.object({
      columns: z.array(z.object({ name: z.string() })),
      rows: z.array(z.array(AppCell)),
      next: Next,
    }),
  },
  failures: [
    'NOT_FOUND', 'SESSION_REQUIRED', 'REQUEST_MALFORMED', 'DATABASE_UNAVAILABLE',
    'APP_DATABASE_UNAVAILABLE', 'APP_TABLE_TOO_WIDE',
  ],
})
```

`OfProject` de `apps.ts:150` passa a ser exportado, ou `app-data.ts` declara o seu igual; o
construtor escolhe a primeira e diz no relatório.

`packages/hub-api/src/app-failures.ts` ganha `APP_DATA_FAILURES`, espalhado em `FAILURES`
(`failures.ts:274`):

```ts
export const APP_DATA_FAILURES = {
  APP_DATABASE_UNAVAILABLE: {
    category: 'THIRD_PARTY', settles: true, status: 503,
    phrase: 'O banco do app não respondeu.', action: 'Tente de novo em instantes.',
    actionKind: 'RETRY',
  },
  APP_TABLE_TOO_WIDE: {
    category: 'USER', settles: true, status: 422,
    phrase: 'Esta tabela tem colunas demais para mostrar aqui.',
    action: 'Peça ao Builder o que você quer ver dela.', actionKind: 'NONE',
  },
} as const satisfies Record<string, FailureRow>
```

`packages/hub-api/src/roles.ts`, `CompanyMay`: `viewAppData: z.boolean()`.

`apps/server/src/hub/identity/roles.ts`: `BUILD.app` = `['publish', 'viewData']`;
`createAccessControl` com `app: ['publish', 'viewData']`. `admission.ts`: `const VIEW_APP_DATA =
{ app: ['viewData'] } as const`, na união de `ActionRule`, e
`viewAppData: { by: 'MEMBER', statement: VIEW_APP_DATA, locks: false }` com um comentário de uma
linha que cite esta capacidade. `companies.ts`: `viewAppData: allows(admitted.role, 'viewAppData')`.
O nome `viewAppData` separa a ação da função `readAppData`, que serve os agentes ([code
C69](../guides/code.md)).

`apps/server/src/platform/app-read.ts` e `company-postgres.ts`:

```ts
readApp(context: Context, read: DatabaseUrl, statement: SqlStatement, signal: AbortSignal): Promise<AppReadAnswer>
// CompanyPostgres
readApp(read: DatabaseUrl, statement: SqlStatement, signal: AbortSignal): Promise<AppReadAnswer>
```

`apps/server/src/hub/apps/app-database.ts`: `readAppData` recebe `statement: SqlStatement` no lugar
de `sql: string`. `AppDataPort.read` (`builder/agents/app-data.ts:16-21`) também; a ferramenta dos
agentes manda `{ text: sql }`.

`apps/server/src/hub/apps/app-tables.ts` (camada de loja, [code C13](../guides/code.md)):

```ts
/** A column as the catalog names it; `type` is `format_type`'s text. */
export type AppColumn = { name: string; type: string }
/** A table the read login may read: its columns in order, and its primary key's columns in key order, empty when it has none. */
export type AppTable = { name: AppTableName; columns: AppColumn[]; key: string[] }
/** What a look at the app's tables gives: no app, the tables, or the app's database silent. */
export type AppTablesRead =
  | { kind: 'NO_APP' }
  | { kind: 'TABLES'; tables: AppTable[] }
  | { kind: 'FAILED'; code: 'APP_DATA_UNAVAILABLE' | 'APP_DATA_TIMEOUT' | 'APP_DATA_TOO_LARGE' }

export function appTablesOf(deps: AppDatabaseDeps, input: AppReadInput): Promise<AppTablesRead>
export function rowCountsOf(deps: AppDatabaseDeps, input: AppReadInput & { tables: readonly AppTableName[] }): Promise<Map<AppTableName, RowCount>>
/** One table by its name, bound as a value, or undefined when the catalog has none the login may read. */
export function appTableOf(deps: AppDatabaseDeps, input: AppReadInput & { name: AppTableName }): Promise<AppTablesRead | { kind: 'NONE' }>
```

`AppReadInput` é `{ scope: { companyId; personId }; projectId; signal }`, o que `readAppData`
recebe hoje sem o texto. `rowCountsOf` devolve `UNKNOWN` para cada tabela quando a leitura falha, e
não chama o banco para uma lista vazia.

`apps/server/src/hub/apps/app-rows.ts`:

```ts
export type AppRowsRead =
  | { kind: 'ROWS'; columns: { name: string }[]; rows: AppCell[][]; next: Next }
  | { kind: 'NONE' }
  | { kind: 'FAILED'; code: 'APP_DATA_UNAVAILABLE' | 'APP_DATA_TIMEOUT' | 'APP_DATA_TOO_LARGE' }

export function appRowsOf(deps: AppDatabaseDeps, input: AppReadInput & { name: AppTableName; page: string | undefined }): Promise<AppRowsRead>
```

`apps/server/src/hub/apps/public.ts`, em `createApps`: as rotas ganham `registerDataRoutes(app,
data)`, e a porta ganha `appTables: (input) => appTablesOf(deps, input)` para o Construtor.
`AppDataPort` ganha `tables(input): Promise<AppTablesRead>`, ligado em `conversations-of.ts:55-60`.
O Construtor não importa nada de dentro de `hub/apps` ([code C4](../guides/code.md)).

A forma de cada coisa:

- **Estados.** `AppTables` e `RowCount` discriminam por `kind` no contrato; `AppTablesRead` e
  `AppRowsRead` no servidor (C21, C22). "Sem app" é estado (`NO_APP`), não falha.
- **Ids.** `AppTableName` com marca, conferido pelo `serve` na entrada e pelo catálogo antes de
  qualquer SQL (C23). `CompanyId` e `ProjectId` como hoje.
- **Donos.** `PAGE_SIZE` de `companies.ts`; `ROW_COUNT_CAP` e `CELL_CHARACTERS` de `app-data.ts`;
  as frases de `app-failures.ts`; a lista de tabelas de `hub/apps/app-tables.ts`, para a página e
  para o Construtor (C26).
- **Entrada externa.** Os parâmetros e a ficha pelo esquema do contrato, no `serve`; a ficha por
  `pageKey(page, Offset)`, com `Offset = z.string().regex(/^[1-9]\d{0,8}$/)`; as linhas do catálogo,
  que vêm do banco, conferidas por um esquema Zod de linha antes de usar (C27).
- **Modelo.** `hub/apps/app-versions.ts` `list` (admissão numa leitura do Hub, depois o trabalho)
  cumpre C21, C23 e C26 e serve de modelo para a admissão. `builder/construtor/app-tables.ts` não é
  modelo: lê linhas sem esquema (`:42-47`).

### As skills e a leitura

- `fastify-best-practices` (`apps/server/src`), só o índice e as rotas: as rotas entram por `serve`.
- `organization-best-practices` (`better-auth`, `apps/server/src/hub`): papéis e permissões.
- `neon:neon-postgres` (`@neondatabase/serverless`, `apps/server/src/platform`): transação e
  valores ligados.
- `zod.dev/llms.txt` para `brand` e `discriminatedUnion` em Zod 4.

### A ordem do trabalho

1. **Permissão.** `roles.ts`, `admission.ts`, `companies.ts`, `CompanyMay`, `test-may.ts`,
   `developer.test.ts`, como os contratos dizem. Regras: S6, S10. Funções: `better-auth@1.7.8`:
   `createAccessControl`, `newRole`, `authorize`.
2. **Leitura com valores.** `readApp`, `CompanyPostgres.readApp`, `readAppData` e `AppDataPort.read`
   passam a `SqlStatement`; a ferramenta dos agentes (`builder/agents/app-data.ts:57-61`) manda
   `{ text: sql }`. Os testes de hoje (`builder/agents/app-data.test.ts`) passam sem mudar o que
   veem. Regras: D20.
3. **Contrato e falhas.** `app-data.ts`, `APP_DATA_FAILURES`, `index.ts`. Regras: C28, C29, C35,
   C48.
4. **A lista e a contagem.** `hub/apps/app-tables.ts`. A instrução do catálogo, sem valor de fora
   (provada no estudo e no parecer):

   ```sql
   select c.relname,
     (select coalesce(jsonb_agg(jsonb_build_object('name', a.attname,
         'type', format_type(a.atttypid, a.atttypmod)) order by a.attnum), '[]')
        from pg_attribute a where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped),
     (select coalesce(array_agg(a.attname order by array_position(i.indkey::int2[], a.attnum)), '{}')
        from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
       where i.indrelid = c.oid and i.indisprimary)
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = current_schema() and c.relkind in ('r', 'p')
     and has_table_privilege(c.oid, 'SELECT')
   order by c.relname
   ```

   `appTableOf` é a mesma instrução com `and c.relname = $1` e o nome como valor. A contagem, com os
   nomes do catálogo citados por `quoted` (`app-sql.ts:35-37`) e o teto como valor:
   `select $1::text, (select count(*) from (select 1 from "t" limit 10001) s) union all …`, uma
   linha por tabela, `$k` para cada nome. 10.001 vira `OVER`. A lista e a contagem chamam
   `readAppData`, o mesmo caminho dos agentes: o mesmo login, o mesmo prazo, o mesmo registro.
   Regras: D20, D22 (a admissão termina antes de qualquer chamada ao Neon), C57 (o sinal da
   requisição de `serve` junto com `APP_CALL_LIMITS.callDeadlineMs`).
5. **A página de linhas.** `hub/apps/app-rows.ts`: `appTableOf`; `NONE` vira 404 na rota. Depois
   `select left(("c1")::text, 101), … from "t" order by <"k1", "k2" | ctid> limit $1 offset $2`,
   com `[PAGE_SIZE + 1, offset]`. Uma célula de 101 caracteres vira `{ text: primeiros 100, cut:
   true }`. `pageOf(rows, () => String(offset + PAGE_SIZE))`. `APP_DATA_TOO_LARGE` vira
   `APP_TABLE_TOO_WIDE`; `APP_DATA_UNAVAILABLE` e `APP_DATA_TIMEOUT` viram
   `APP_DATABASE_UNAVAILABLE`.
6. **As rotas.** `registerDataRoutes` em `routes.ts`, ligada em `public.ts:72-75`. Cada handler
   admite `viewAppData` e o Projeto vivo numa leitura do Hub (como `admitTo` em `send.ts:42-51`, sem
   trava), e só depois lê o banco do app. Regras: C14, S10, S8.
7. **O Construtor.** `builder/construtor/app-tables.ts`: `appTablesOf(appData)` chama
   `appData.tables` e mapeia `NO_APP` para `null`, `FAILED` silencioso para `DATABASE_UNAVAILABLE`,
   como hoje (`:31-40`), e `TABLES` para `{ name, columns: nomes }`. `TABLES_SQL`, `hasApp` aqui e a
   montagem saem.
8. **Documento.** `docs/explanation/hub-apps.md:107`: o login de leitura serve também a página Dados.

### Como se prova

- Critérios 1 a 9: `apps/server/src/hub/apps/app-data.test.ts`, pela porta HTTP do Hub de teste
  (T5), com o app criado por `send` de `hub/apps/test-versions.ts` sobre `createCompanyDatabase` de
  `platform/test-company-postgres.ts`, como `builder/agents/app-data.test.ts:40-55`. As migrações
  do teste criam `clientes` com 10.001 linhas, uma tabela de chave composta, `sem_chave` com 120
  linhas, uma tabela vazia, uma com aspas e espaço no nome, uma com uma coluna de cada tipo do
  critério 6, uma de 30 colunas de 24.000 caracteres e uma de 200 colunas acentuadas. O banco sem
  resposta usa `unreachableDatabaseUrl` (`platform/test-database.ts`), como o teste dos agentes; a
  contagem que falha sozinha usa uma tabela que o login de leitura perde entre a lista e a contagem,
  ou um transporte que recusa só a segunda instrução: o construtor escolhe e diz.
- O critério 6 falha hoje: não há rota. O critério 10 falha hoje: `TABLES_SQL` existe.
- Nenhuma forma de biblioteca é escrita à mão: as células são texto do PostgreSQL (T26 não se
  aplica).
- Local: os testes tocados, `npm run typecheck`, `npm run lint`, `npm run docs`.

### Parar se

- O `serve` não aceitar um parâmetro de caminho com marca, ou recusar com um código diferente de
  `REQUEST_MALFORMED`: escrever no relatório o código que ele dá e seguir, sem novo mecanismo.
- A contagem `union all` passar do prazo de 5 s com tabelas grandes no teste local: parar e dizer;
  o teto mudaria a promessa da página do fundador.
- `has_table_privilege` listar uma tabela que a leitura recusa: parar; é uma premissa provada no
  estudo que falhou.

## U2 A página Dados

**Base e modelo.** O commit da U1, no mesmo pull request. Sonnet: telas com peças que já existem.

### As linhas da tabela

- **Entrada Dados.** `apps/web/src/hub/projects/project-rail.tsx:75-149`: um `FrameLink` com ícone
  de `lucide-react` (`DatabaseIcon`), sob `may.viewAppData`, depois de Integrações; o comentário
  de `:76-77` ganha "Dados".
- **Endereço.** Modelos: `$projectId_.integrations.tsx` (página ao lado do Construir),
  `$projectId_.agents.$agentId.tsx` (moldura com `Outlet`), `projects/index.tsx:9-14`
  (`validateSearch` com `listProjects.input.query`, `loaderDeps`). `idOrNotFound` e
  `readOrNotFound` de `platform/hub.ts:268-282`.
- **Linhas e páginas.** `ui/table.tsx:7-64`, `ui/pager.tsx:9-32` (`param="page"`), `ui/states.tsx`
  (`Loading`, `RouteReadFailure`, `NotFound`, `Empty`), `PageTitle` de `ui/list.tsx`.
- **Celular.** `ui/use-mobile.ts` `useIsMobile`.
- **Peças de tabela.** `ui/table.tsx:7,19,43`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/routes/_app/companies/$companyId/projects/$projectId_.data{,.index,.$table}.tsx` | Cria | o roteador |
| `apps/web/src/routeTree.gen.ts` | Gerado pelo plugin, nunca à mão (W1) | o roteador |
| `apps/web/src/hub/apps/` | Cria `data.tsx`, `data-rows.tsx`, `data.test.tsx`; muda `queries.ts`, `public.ts` | as rotas novas |
| `apps/web/src/hub/projects/project-rail.tsx` | Muda | `hub/projects` |
| `apps/web/src/ui/table.tsx` | Muda: exporta três peças (trilho de desenho) | `hub/apps/data-rows.tsx` |
| `packages/hub-api/src/pages.ts` | Muda: as duas rotas em `PAGES` | o servidor (`sendPage`), o teste da web |
| `docs/reference/screens.md` | Muda: as duas linhas novas | — |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** nada.

`apps/web/src/hub/apps/queries.ts`:

```ts
export function appTablesQuery(companyId: CompanyId, projectId: ProjectId)
export function appRowsQuery(companyId: CompanyId, projectId: ProjectId, table: AppTableName, page: string | undefined)
```

Ambas por `hubQuery` (W10, W11). `public.ts` exporta `DataPage`, `DataRows`, as duas consultas e
`tableParams` (`parse: (raw) => ({ table: idOrNotFound(AppTableName, raw.table) })`).

As rotas:

| Arquivo | Endereço | `loader` | Componentes |
| --- | --- | --- | --- |
| `$projectId_.data.tsx` | `…/projects/<p>/data` | `readOrNotFound` de `projectQuery` e `appTablesQuery` | `DataPage` (título, lista, `Outlet`); `errorComponent: RouteReadFailure` |
| `$projectId_.data.index.tsx` | `…/data` | nenhum | nada a mais (no computador, um espaço vazio à direita) |
| `$projectId_.data.$table.tsx` | `…/data/<t>?page=<ficha>` | `readOrNotFound(queryClient.fetchQuery(appRowsQuery(...)))`, fresco (W12) | `DataRows`; `pendingComponent: Loading`; `errorComponent: RouteReadFailure`; `notFoundComponent: NotFound` |

`staticData: { place: 'Dados' }` nas três. `validateSearch: listAppRows.input.query.catch({})`,
`loaderDeps: ({ search }) => ({ page: search.page })`.

A forma de cada coisa:

- **Estados.** `AppTables.kind` escolhe frase de primeira vez ou lista; `RowCount.kind` escolhe o
  número (`toLocaleString('pt-BR')`, V23 tabular), "mais de 10.000" ou "indisponível"; `AppCell`
  `null` escolhe o traço com `aria-label="sem valor"`, `cut` acrescenta "…" (C22).
- **Ids.** `AppTableName` pelo `tableParams`, nunca colado no texto do endereço (o roteador
  codifica `params`).
- **Donos.** As frases de falha vêm de `FAILURES` por `RouteReadFailure`; as frases de vazio e de
  primeira vez moram em `data.tsx` e `data-rows.tsx`, uma vez cada (C26).
- **Entrada externa.** A resposta do Hub conferida por `hubQuery` com o esquema do contrato.
- **Modelo.** `$projectId_.integrations.tsx` e `hub/projects/project-integrations.tsx` cumprem C21,
  C23 e C26.

### As skills e a leitura

- `router-core` (`node_modules/@tanstack/router-core/skills/router-core/`): `data-loading`,
  `search-params`, `path-params`, `not-found-and-errors`.
- `router-plugin` (`node_modules/@tanstack/router-plugin/skills/`): "Route Refactor Workflow".
- `shadcn`: as regras de tabela e de vazio.
- `tanstack.com/query/latest/llms.txt`, a seção de `fetchQuery`.

### A ordem do trabalho

1. `ui/table.tsx`: `export` em `Table`, `TableHeader`, `TableHead`. Nada mais muda ali.
2. `queries.ts` e `public.ts` de `hub/apps`.
3. As três rotas; rodar o plugin para regenerar `routeTree.gen.ts`. Regras: W1, W17, W18, W34.
4. `data.tsx`: `PageTitle` "Dados"; a lista como links (`Link` com `params={{ ...scope, table }}`),
   o nome à esquerda e a contagem à direita em algarismos tabulares; a tabela aberta marcada com
   `aria-current="page"`; no celular, com uma tabela aberta, a lista sai e o `Outlet` mostra "‹
   Tabelas". Regras: V18, V23, W22.
5. `data-rows.tsx`: o nome da tabela como título da área; `Table` com `TableHeader`/`TableHead`
   para as colunas e `TableBody`/`TableRow`/`TableCell` para as linhas; os valores em mono (V11);
   `Pager` com `param="page"` e `list` o nome da tabela.
6. `project-rail.tsx`: a entrada **Dados**.
7. `PAGES` e `docs/reference/screens.md`: duas linhas, Projeto, "owner, administrator, developer".

### Como se prova

- Critérios 12 a 17: `apps/web/src/hub/apps/data.test.tsx`, pelo roteador de teste da web com o Hub
  dublê e `mayOf` de `platform/test-may.ts`, como `hub/projects/project-integrations.test.tsx`.
- Critério 18: o teste da web que confere o roteador contra `PAGES`.
- Critério 19: QA ([testing T25](../guides/testing.md)) nos dois temas, a 1366 e a 390 px.
- Local: os testes tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- `ui/table.tsx` precisar de mudança de aparência para a tabela de dados funcionar: parar; é do
  trilho de desenho.
- O `notFoundComponent` da rota filha tomar a página inteira em vez da área das linhas: parar e
  dizer o que o roteador fez.
