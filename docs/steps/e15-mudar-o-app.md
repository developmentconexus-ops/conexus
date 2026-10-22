# Etapa 15: Mudar o app

## A página do fundador

**No fim desta etapa** você muda um app que já guarda dados, pela Conversa, e nada do que estava
guardado se perde: renomear um campo é acrescentar o novo e copiar; tirar um campo o tira das telas
e o dado fica. Uma migração que apagaria dado nunca chega ao banco.

**O roteiro de uso.** Padaria Sol, com Ana (dona). O "Encomendas" está na **Prévia** (14.1), com
Maria, (11) 99999-0000, bolo de cenoura, e João, sem telefone.

1. "Troque o telefone por WhatsApp." O plano diz, em **Dados salvos**: "o telefone de cada
   encomenda passa para o WhatsApp; nada é apagado". Ana aprova; a Prévia recarrega e a Maria
   aparece com WhatsApp (11) 99999-0000.
2. "Tire o campo produto." O campo some das telas. O plano: "o que já foi guardado fica
   guardado".
3. "Volte o campo produto." Ele volta, com "bolo de cenoura" na Maria.
4. "Telefone obrigatório." O formulário passa a pedir o WhatsApp numa encomenda nova; o João
   continua lá, sem nada quebrar.
5. Em **Alterações**, cada mudança é uma migração nova; a primeira não mudou.
6. No celular, o mesmo.

Se o Builder escrever uma migração que apaga, ou mexer numa antiga, a conferência recusa dentro do
turno e ele reescreve, sem você ver.

**O que você faz, e quando.** No começo: aprova esta página. No fim: faz o roteiro na nuvem e aprova
os textos das falhas novas.

**Respondidas em 2026-10-22**, pelo número da pergunta do estudo. 1 sim: o campo some das telas e o dado fica; renomear é
acrescentar e copiar (o Lovable e o Firebase fazem assim). 2 sim: a migração destrutiva é recusada
por padrão, por uma regra só, lida na conferência da máquina dentro do turno e no envio do Hub. 3
sim: uma transação, sem ensaio num ramo do Neon. 4 sim: migração aplicada não muda, recusada já na
máquina. 5 sim: os dados só andam para a frente. 6 sim, estreitado: só se recusa a função que dá
poder; uma função só lê, grava linha nova ou muda o próprio registro (`NEW`), nunca apaga nem
sobrescreve linha. P1 A: um `UPDATE` só grava coluna acrescentada na mesma migração. P2 A: campo obrigatório
recusado, tanto o que vira obrigatório quanto o novo sem valor padrão. P3: blocos `DO` e views
seguem recusados. A porta para apagar de verdade: B, a etapa seguinte.

**A porta, etapa 15.1 "Apagar de verdade".** Ana pede "apague mesmo o campo produto"; o Builder
pergunta no cartão "Apagar o campo produto e o que já foi guardado nele? Isso não volta."; com **Sim**,
o Hub deixa passar só aquela migração. O desenho fica no cartão dela.

**Fica de fora.** A porta (15.1); o ensaio num ramo do Neon (a B da 3), escolha cara da 17; fotos do
banco (a B da 5); views, até a issue #254, a única `next-card` que toca migração; o app do ar (17).

**A decisão sua pedida nesta etapa.** Uma: **A**, autoriza uma prova no Neon de prova (o da 14.1 B)
para ver se o motivo do banco ("coluna telefone da tabela encomenda") chega ao Hub pelo Neon; ou
**B**, sem prova: o Builder recebe só o código do erro (por exemplo 23502) até a 17.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | Registro 0057, roteiro | `docs/` | dados | 14 e 14.1 fechadas |
| U2 | A regra: o leitor de migrações | `packages/app-contract/` | dados | U1 |
| U3 | O passo `migrações` na conferência | `packages/app/src/check/`, `builder/machine/`, `hub/apps/public.ts` | segurança | U2, U4; 14 U4 |
| U4 | O envio do Hub recusa, e o motivo do banco volta | `hub/apps/`, `platform/company-postgres.ts`, `hub-api/`, `builder/runs/`, migrações, `apps/web/src/builder/preview/` | dados | U2; 14.1 U4 |
| U5 | A regra no Builder | `packages/app/skills/` | testes | U2; 14 U7 |
| U6 | Percurso e prova | `tests/e2e/`, `docs/how-to/` | testes | todas |

`builder/`, `hub/`, `platform/`: `apps/server/src/`; `hub-api/`: `packages/hub-api/src/`. U4 e U5 em
paralelo depois da U2; U3 depois da U4 (`hub/apps/`). QA (T25) antes das revisões (L9). **Pacote novo**: `libpg-query` 18.1.5, exato, em `packages/app-contract` (L16); raiz:
`package-lock.json`.

**Orçamento de código alterado** (sem testes nem gerados):

- U2 **260**
- U3 **140**
- U4 **220**
- U5 **90**, quase todo texto
- U6 **60**

Total: 770, teto 4.000 (L2).

## Os critérios de aceite

Pelas rotas e `main.ts`, com `Machines` dublê (`LocalSandbox`), Cloudflare e Neon dublês (o
transporte de `company-postgres.ts`) e modelo gravado; os da regra pela entrada exportada
`@conexus/app-contract/migrations`, a porta pública do pacote, como o SDK na 14; `company-postgres.test.ts` pelo `test-neon.ts` de hoje (T5). **Ao vivo**: firstmate, anotado no 0057; nenhum teste da
suíte chama serviço de fora (T14). Must, salvo "should".

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | 0057 "proposed" antes do código; roteiro: a 15 sem "O lote" (0045, 0047) e a 15.1 | o registro, `check-docs` | must |
| 2 | U2 | Aceitos: `CREATE TABLE` com `NOT NULL`; `ADD COLUMN` sem `NOT NULL` ou com `DEFAULT`; `ADD COLUMN` + `UPDATE` dela; `CREATE INDEX`; `… VIRTUAL` (sintaxe 18); `DROP NOT NULL`; `COMMENT`; `INSERT`; `CREATE TRIGGER`; função `NEW.updated_at = now()`; função que grava em histórico; função `sql` com `SELECT` | `migrations.test.ts` | must |
| 3 | U2 | Recusados, `APP_MIGRATION_REFUSED` com a migração, o comando (a partir de 1) e o tipo do nó (`CHANGES_DATA` num subcomando de `ALTER TABLE`, `NOT_ALLOWED` num comando fora da lista): `DROP COLUMN` (também junto de `ADD` no mesmo comando), `RENAME`, `ALTER COLUMN TYPE`, `DROP TABLE`, `TRUNCATE`, `DELETE`, `GRANT`, `ALTER DEFAULT PRIVILEGES`, `OWNER TO`, `CREATE SCHEMA`, `SET`, `BEGIN`, `DO`, `CREATE VIEW`, `ALTER FUNCTION` | idem | must |
| 4 | U2 | P1: `UPDATE encomenda SET telefone = NULL`: recusado, `OLD_COLUMN_UPDATE`; `UPDATE` que grava coluna acrescentada na mesma migração, ou de tabela criada nela: aceito | idem | must |
| 5 | U2 | P2: `SET NOT NULL`, `ADD CONSTRAINT … NOT NULL` em coluna antiga e `ADD COLUMN … NOT NULL` sem `DEFAULT`, identidade ou expressão gerada: recusados, `REQUIRED_WITHOUT_DEFAULT` | idem | must |
| 6 | U2 | Resposta 6: função `SECURITY DEFINER`; corpo com `DROP`, `TRUNCATE`, `GRANT`, `DELETE` ou `UPDATE` (também dentro de `IF`); `EXECUTE` de texto montado; linguagem fora de `sql` e `plpgsql`: recusados, `FUNCTION_POWER` | idem | must |
| 7 | U2 | SQL que o analisador não lê: `UNREADABLE`, sem lançar; migração congelada com outro resumo: `APP_MIGRATION_CHANGED` `edited`; ausente: `removed`; `migrationDigest` dá o mesmo resumo que o livro-razão de hoje | idem, `company-postgres.test.ts` | must |
| 8 | U2 | `SESSION_CONTROL` sai de `manifest.ts`; os manifestos de `tests/apps/` seguem válidos e sem problema; `BEGIN` e `SET` agora recusados pela regra | `manifest.test.ts`, `migrations.test.ts` | must |
| 9 | U2 | A recusa tem linha em `scripts/removals.json`: sem ela, o 3 falha (T12) | `npm run removals` | must |
| 10 | U3 | `migrações` roda depois de `manifesto`: uma migração com `DROP` falha com o arquivo e a linha do comando, `APP_MIGRATION_REFUSED`, e os passos seguintes pulam; o Worker montado não leva `libpg-query` | `check.test.ts` | must |
| 11 | U3 | Contra a lista congelada: `001` editada ou apagada dá `APP_MIGRATION_CHANGED` com o arquivo; `002` nova passa; Projeto sem versão na Prévia: nada congelado | idem | must |
| 12 | U3 | O servidor congela as migrações da versão da Prévia (`migrationDigest`), nunca as de uma que falhou | `conversation-check.test.ts` | must |
| 13 | U3 | Modelo gravado: o terminal grava `002` com `DROP`, `write_file` muda `001`; no mesmo turno um lembrete traz os dois; no fim, a `001` original e a `002` segura; monta | idem | must |
| 14 | U3 | `libpg-query` sem carga na máquina: `CHECK_PLATFORM_FAILED`, sem contar tentativa | idem | must |
| 15 | U4 | Envio manual (9) com `DROP`: 422 `APP_MIGRATION_REFUSED`, versão `failed`, nenhuma chamada ao Cloudflare nem ao Neon; o log tem migração, comando e tipo, nunca o SQL | `send-guards.test.ts` | must |
| 16 | U4 | Na prévia: `readPreview` `failed`, `APP_MIGRATION_REFUSED`; fica a última boa | `preview-send.test.ts` | must |
| 17 | U4 | O banco recusa (23505 com tabela e restrição): `APP_MIGRATION_FAILED`; `readPreview` e a parte `preview` levam `cause {sqlstate, table, constraint}`, lido de volta pelo esquema Zod; `detail` e a mensagem do banco em lugar nenhum; **Pedir ao Builder para corrigir** põe o código, a versão e o motivo no campo; prova o caminho com o dublê, o Neon é o 19 | `preview.test.ts`, `preview.test.tsx` | must |
| 18 | U4 | Leitor sem carga no Hub: não sobe | `boot.test.ts` | must |
| 19 | U4 | **Ao vivo**, se a resposta for A: pelo Neon de prova, a falha de `SET NOT NULL` com nulos chega com tabela e coluna | 0057 | should |
| 20 | U5 | `conexus-data` diz: só acrescenta; renomear é acrescentar e copiar; tirar é sumir da tela; obrigatório é no formulário; nomeia o leitor e não copia as listas; `conexus-plan-change` tem **Dados salvos**; os exemplos tipam | `skills.test.ts` | must |
| 21 | U6 | Os passos 1 a 5 do roteiro, com modelo gravado: a Maria com WhatsApp, o produto de volta com o valor, o João lá; `readChanges` mostra cada migração nova e a `001` sem mudança | `tests/e2e/app-change.test.ts` | must |
| 22 | U6 | **Ao vivo**: 3 corridas dos passos 1 a 4 com Gemini 3.8 Flash High e 1 com Claude: nenhuma recusa no Hub, nenhum turno "não montou" por migração, os dados intactos; lembretes da conferência anotados | 0057 | must |
| 23 | U6 | QA no commit candidato (T25); o roteiro publicado, pelo fundador (L17) | `conexus-qa`, fundador | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Prévia | a da 14.1 | a da 14.1 | a da 14.1 | "A versão N não montou." e a frase de `APP_MIGRATION_REFUSED` ou de `APP_MIGRATION_FAILED` com o motivo; **Pedir ao Builder para corrigir** | a da 14.1 | a da 14.1 | a da 14.1 |
| Envio manual (9) | a da 9 | — | a da 9 | a frase de `APP_MIGRATION_REFUSED` | a da 9 | a da 9 | — |
| Alterações (14.1) | sem mudança | sem mudança | sem mudança | sem mudança | sem mudança | sem mudança | sem mudança |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `MigrationProblem`, com `RefusalReason` | U2 | U3 (o `CheckReport`, por `problemText`), U4 (o log e a falha) |
| `APP_MIGRATION_CHANGED` no `MigrationProblem` | U2 | U3 (o passo); no Hub segue o do livro-razão |
| `MigrationCause` | U4 | `builder.run`, `readPreview`, a Prévia |
| `FrozenMigration[]` | U3 (servidor) | U3 (o passo na máquina) |
| `builder.run.preview_failure_cause` | U4 | `readPreview`, a parte `preview` |
| `cause` em `readPreview` e na parte `preview` | U4 | a tela Prévia (U4) |
| `APP_MIGRATION_REFUSED` em `app-failures.ts` | U4 | web, o Builder |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Carga do `libpg-query` (`loadModule`) | a biblioteca guarda a primeira | — | sem rede; falha: máquina `CHECK_PLATFORM_FAILED`, Hub não sobe | o erro de partida | 14, 18 |
| Passo `migrações` | um por chamada; só leitura | prazo do passo da 14 (C57) | a máquina: `CHECK_PLATFORM_FAILED` | `APP_CHECKED` (14) | 10, 11, 13 |
| Leitura da lista congelada | só leitura | — | o banco do Hub: a volta termina (13) | — | 12 |
| Recusa em `prepare` | a chave da 9: `REPLAY` | antes do upload: nada a desfazer | nenhuma chamada | `APP_MIGRATION_REFUSED` | 15, 16 |
| Migração com o motivo | o livro-razão (0046) | tudo ou nada | Neon: `NO_ANSWER`, `APP_VERSION_FAILED` | `APP_MIGRATION_FAILED` com SQLSTATE, tabela, coluna, restrição | 17, 19 |
| `builder.run.preview_failure_cause` | posse da 13 | na mesma gravação de `preview_failure` (14.1) | o banco: a volta termina | `RUN_SETTLED` | 17 |
| Migração do Hub que cria a coluna | `migrate` (D9) | uma transação | o banco: não sobe | a do `migrate` | 17 |
| Template do E2B com o `libpg-query` | um por firstmate | — | E2B: o template de antes segue | o nome | 10, 22 |

## O que nasce novo e o que é trazido

| Mecanismo | Nativo, nosso ou trazido | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base | Como Mastra, vibesdk e Conexus OS fazem, `file:line` |
| --- | --- | --- | --- | --- | --- |
| Analisador de SQL | nativo do PostgreSQL, em WASM | `packages/app-contract/src/migrations.ts` | — | gramática 18 (estudo do Mastra §3.5, 32 casos) | `libpg-query` 18.1.5 `README.md:59,94,162-170` (`parsePlPgSQL` só a partir da 18; os síncronos depois de `loadModule`); 1,8 MB desempacotado (`npm view`, `dist.unpackedSize`) |
| A regra (listas e leitura de funções) | trazida como desenho, escrita nova ([boundaries](../reference/boundaries.md), entrada da U2) | idem | lista do que pode, em vez de só controle de transação | carga e forma do erro | OS `apps/hub/src/app-runner/migration-sql.ts:2,21-36`; Mastra nenhuma faz (trava o caminho, `mastracode/sdk/src/agents/tool-availability.ts:62-89`); vibesdk nenhuma faz (`worker/agents/think/skills/app-file-structure/SKILL.md:86-93`) |
| Recusa dentro do turno | nativo | `builder/conversation/processors.ts` (14 U4), sem mudança | — | 3 retentativas (14) | `abort(…, {retry: true})`, `@mastra/core@1.78.0` `6a465f9d` `packages/core/src/loop/workflows/agentic-execution/llm-execution-step.ts:3150-3163,3256-3262` |
| Migração congelada na máquina | nosso, novo | `packages/app/src/check/migrations.ts` | — | D7 do Hub | `scripts/check-migrations.ts:43-58`; OS `apps/hub/src/builder/application-build.ts:49-54` (só no envio) |
| Recusa no envio | nosso, novo | `hub/apps/send.ts` | — | S2 | nenhuma faz |
| Motivo do banco | nativo | `platform/company-postgres.ts` | — | campos sem valor (C52) | `NeonDbError` (1.2.0) `index.d.ts:834-854` |
| Texto da skill e do plano | trazido, adaptado | `packages/app/skills/` | sem `conexus/` | "acrescentar, copiar, conferir" | OS `builder-skills/conexus-plan-change/references/plan-template.md:30`, `SKILL.md:37` |

**A medida do transplante.** Nenhum código copiado: o leitor do OS (36 linhas) muda quase todo e,
pela regra 5 do estudo, é escrito novo.

**A dívida.**

- Colunas esquecidas acumulam no banco do app (o custo da resposta 1); a 15.1 as limpa.
- `lock_timeout` no login de migração: hipótese do estudo (§6), sem prova; issue futura.
- Estreitar a regra recusaria migrações já aplicadas: o cartão que a estreitar decide.

## U1 Registro 0057 e o roteiro

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/decisions/0057-app-migrations-only-add.md` | cria | `check-docs` |
| `docs/roadmap.md`, `docs/architecture.md`, `docs/index.md` | muda | `check-docs` |

### Os contratos que a unidade cria

0057: as respostas de 2026-10-22 (1 a 6, P1 a P3); um dono da regra, dois leitores (a conferência e
o envio); a transação única (0046); a porta é a 15.1. Arquitetura §7: "Every migration only adds" vale
também para os apps. A mudança do guia de dados (D29 sem "[from step 15]", a regra de app com
`[app-contract, check, send]`) vai ao PR de fechamento (L20).

### Como se prova

1, por `check-docs`.

## U2 A regra: o leitor de migrações

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/app-contract/src/migrations.ts` | cria | a conferência (U3), `send.ts` (U4), `company-postgres.ts` |
| `packages/app-contract/src/manifest.ts` | muda: sai `SESSION_CONTROL` | Hub, runtime do app, `packages/app` |
| `packages/app-contract/package.json`, `package-lock.json` | muda: entrada `./migrations`, `libpg-query` | — |
| `apps/server/src/platform/company-postgres.ts` | muda: `migrationDigest` vem do módulo | `app-database.ts` |
| `scripts/removals.json`, `docs/reference/stack.md`, `docs/reference/boundaries.md` | muda | `npm run removals`, `check-docs` |

### Os contratos que a unidade cria

Na entrada `@conexus/app-contract/migrations`, nunca em `.` (o Worker do app importa `.`):

- `loadMigrationReader(): Promise<void>`, uma vez.
- `migrationProblems(migrations: Manifest['migrations'], frozen: readonly FrozenMigration[]):
  MigrationProblem[]`.
- `migrationDigest(migration: AppMigration): MigrationDigest`: o SHA-256 de
  `JSON.stringify(statements)`, o mesmo do livro-razão (`company-postgres.ts:97`), que passa a
  importá-lo.
- `problemText(problem: MigrationProblem): string`: a frase ao modelo, dona do texto (C26).
- `MigrationProblem = {code: 'APP_MIGRATION_REFUSED', migration: MigrationId, statement: number,
  kind: string, reason: RefusalReason} | {code: 'APP_MIGRATION_CHANGED', migration: MigrationId,
  change: 'edited' | 'removed'}` (C21, pelo `code`).
- `RefusalReason = 'NOT_ALLOWED' | 'CHANGES_DATA' | 'OLD_COLUMN_UPDATE' | 'REQUIRED_WITHOUT_DEFAULT'
  | 'FUNCTION_POWER' | 'UNREADABLE'`.
- `FrozenMigration = {id: MigrationId, sha256: MigrationDigest}`, esquema Zod (C27): chega do
  servidor à máquina. `MigrationId` (o `id` do `Manifest`) e `MigrationDigest` (64 hex) marcados,
  conferidos pelo esquema (C23).
- As listas do que pode, privadas ao módulo, donas da regra (C26): os nós de comando; os
  subcomandos de `ALTER TABLE` (`AT_AddColumn`, `AT_AddConstraint` salvo `NOT NULL`,
  `AT_ColumnDefault`, `AT_DropNotNull`); o corpo de função (`SelectStmt`, `InsertStmt` e a atribuição a `NEW`, só como quem chama). Base:
  estudo da 15 §8 U1; estudo do Mastra §3.5 e apêndice A, sem o `UpdateStmt` e o `DeleteStmt`
  dele: um gatilho disparado na própria migração apagaria linha.

Modelo: `manifest.ts` (cumpre C21, C26, C27; não marca id: as marcas seguem `OperationName` de `packages/app`, 14 U2, que cumpre C23).

### As skills e a leitura

`zod`: `zod.dev/llms.txt`. `libpg-query`: o `README.md` do pacote; linha nova em `stack.md`.

### A ordem do trabalho

1. Subtrair: tira `SESSION_CONTROL` e leva os casos dele ao teste da regra. Regras: C26.
2. O módulo. Regras: C21, C23, C26, C27, S2. Funções: `libpg-query@18.1.5` `loadModule`,
   `parseSync` (`subtype`, `stmt_location`), `parsePlPgSQLSync` (`PLpgSQL_stmt_dynexecute`).
3. A entrada em `boundaries.md` e a linha de `removals.json` (T12).

### Como se prova

2 a 9: `npm test -w @conexus/app-contract`; `npm run removals`. Recusas: 3 a 7.

## U3 O passo `migrações` na conferência

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/app/src/check/` | muda: o passo | `/opt/conexus/check`, `conexus_check`, `checkGate` |
| `apps/server/src/builder/machine/` | muda: `Machines.check` leva a lista | `builder/conversation/` |
| `apps/server/src/hub/apps/public.ts` | muda: `frozenMigrations` | `builder/conversation/` |
| `apps/server/src/builder/conversation/` | muda: passa a lista a `Machines.check` | `conexus_check`, `checkGate` |
| `infra/e2b/template.ts` | muda: o `libpg-query` no template | firstmate |

### Os contratos que a unidade cria

- O passo `migrações` logo depois de `manifesto` (14 U4), sobre as migrações que ele montou;
  cada `MigrationProblem` vira um problema do `CheckReport` com o arquivo da migração, a linha do
  comando e `problemText` (até 20 por passo, `CHECK_LIMITS` da 14).
- `Machines.check({projectId, frozen: readonly FrozenMigration[]})`: a lista chega pelo mesmo
  caminho da lista de pacotes da 14, nunca de um arquivo da árvore.
- `frozenMigrations(deps, {companyId, projectId}): Promise<readonly FrozenMigration[]>`: as
  migrações do manifesto da versão em `preview_version_id` (14.1 U2), resumidas por
  `migrationDigest`; sem versão na Prévia, `[]`.
- O `checkGate` da 14 não muda: o relatório já volta ao Builder.

Modelo: o caminho da lista de pacotes da 14 U4 (cumpre C26, C27).

**Depende da 14**: a pasta das migrações e quem monta `migrations[]` (`manifesto`, 14 U4; o estudo
da 14 diz `server/migrations/*.sql`); `CheckReport`, `checkGate`, `Machines.check`. Outra forma: L7.

### As skills e a leitura

`@mastra/core`, `@mastra/e2b`: skill `mastra`; ler `dist/docs/references/docs-agents-processors.md` (`:385-405`, `:910-942`: sem `maxProcessorRetries` o retry do passo não roda) e `reference-processors-processor-interface.md:229-231`.

### A ordem do trabalho

1. Regras: C26, C27, C57, S2. Funções: `@mastra/core@1.78.0` `processOutputStep`,
   `abort(reason, {retry: true})`, `maxProcessorRetries` (9, `model-accounts/processors.ts:27`),
   dividido com `accountPick` (hipótese do estudo do Mastra §6).

### Como se prova

10 a 14. Recusas: 10, 11, 13 (estudo do Mastra §3.3 provou a forma num rascunho).

## U4 O envio do Hub recusa, e o motivo do banco volta

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/apps/` | muda: `send.ts`, `app-database.ts`, `preview.ts` | `routes.ts`, o envio da prévia |
| `apps/server/src/platform/company-postgres.ts` | muda: `REFUSED` com o motivo | `app-database.ts` |
| `apps/server/src/builder/runs/` | muda: `preview_failure_cause` | `readPreview` |
| `apps/server/migrations/`, `apps/server/src/platform/catalog.test.ts` | cria a coluna; o retrato do catálogo | `migrate` |
| `packages/hub-api/src/` | muda: `app-failures.ts`, `apps.ts` | web, OpenAPI |
| `apps/web/src/builder/preview/` | muda: a frase do motivo | `routeTree.gen.ts` |
| `apps/server/src/main.ts` | muda: `loadMigrationReader` antes de ouvir | `boot.test.ts` |

### Os contratos que a unidade cria

- `prepare` em `send.ts`: antes de `uploadVersion`, `migrationProblems(manifest.migrations, [])`;
  um problema dá `{kind: 'FAILED', failure: 'APP_MIGRATION_REFUSED'}`. No Hub o congelado segue do
  livro-razão (0046, `APP_MIGRATION_CHANGED`).
- `APP_MIGRATION_REFUSED` em `app-failures.ts`: `USER`, 422, `settles`, frase e ação a aprovar
  (C48).
- `MigrationCause = {sqlstate: string, table?: string, column?: string, constraint?: string}` em
  `hub-api/apps.ts`, o dono (C26), esquema Zod com `sqlstate` de 5 caracteres, lido assim também ao
  voltar do `jsonb` (C27); nunca `detail` nem a mensagem, que trazem valores (C52, S40).
  `MigrateAnswer` `REFUSED` ganha `cause`; `migrateApp(...): Promise<undefined | {failure:
  VersionFailure, cause?: MigrationCause}>`.
- `builder.run.preview_failure_cause jsonb`, só com `preview_failure = 'APP_MIGRATION_FAILED'`
  (check, D15); muda só o retrato do catálogo (D11).
- `readPreview` `failed` e a parte `preview` ganham `cause?`.

Modelo: `app-database.ts` (cumpre C21, C48; sem id novo, C23 não se aplica; um dono por fato, C26).

### As skills e a leitura

`@neondatabase/serverless`: skills `neon:neon`, depois `neon:neon-postgres`. `fastify`: `fastify-best-practices`.
`drizzle-kit`: `drizzle`.

### A ordem do trabalho

1. Regras: C21, C48, C27, C50, C52, D9, D15, D18, S2, S40.
2. Funções: `@neondatabase/serverless@1.2.0` `NeonDbError` (`code`, `table`, `column`,
   `constraint`, só no tipo, `index.d.ts:834-854`; a página `neon.com/docs/serverless/serverless-driver`
   não os descreve); pelo proxy do Neon, não provado (estudo da 15 §11): o 19.

### Como se prova

15 a 19. Recusas: 15, 16, 17, 18.

## U5 A regra no Builder

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/app/skills/` | muda: `conexus-data`, `conexus-plan-change` | `createSkill`, o Builder |

### Os contratos que a unidade cria

`conexus-data`: uma migração só acrescenta; renomear é acrescentar a coluna, copiar com `UPDATE` e
trocar a tela; tirar é sumir da tela; obrigatório é no esquema da operação, não no banco; a
recusa vem da conferência, cuja regra está em `@conexus/app-contract/migrations` (cita, não copia,
C26). `conexus-plan-change`: a seção **Dados salvos**, em português, do OS.

**Depende da 14**: as skills da U7.

### As skills e a leitura

`mastra` (`createSkill`, `validateSkillContent`).

### A ordem do trabalho

1. Regras: T5, L23, C26.

### Como se prova

20.

## U6 Percurso e prova

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `tests/e2e/app-change.test.ts` | cria | `npm run e2e` |
| `docs/how-to/app-change.md`, `docs/index.md` | cria, muda | `check-docs` |

### Os contratos que a unidade cria

Nenhum.

### As skills e a leitura

`playwright-cli`.

### A ordem do trabalho

1. 21 e 23 (QA) no commit candidato; 19 e 22 antes do merge; 23 (fundador) depois do Release
   (L17). Regras: T14, T25.

### Como se prova

21 a 23.
