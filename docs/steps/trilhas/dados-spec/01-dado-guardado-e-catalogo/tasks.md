# Plano de implementação: parte 1, o dado guardado e o catálogo

## Visão geral

Sete grupos, cada um um PR com uma rodada de CI. A ordem é a do grafo no fim.

| Grupo | O que entrega | Requisitos |
| --- | --- | --- |
| 0 | A coluna `column_state` e as duas permissões novas no banco do Hub. Palavra do fundador dada em 2026-11-14 (P2 do índice; data D11) | 2.4, 5.1 |
| 1 | O nome `sistema_tabela` e a descrição em toda cópia | 1, 2 |
| 2 | O login `conexus_read`, a rota `sampleCopy` e a coluna inativa | 3, 4, 5 |
| 3 | O contrato e a conformidade | 7 |
| 4 | `DataSources.catalog` e `DataSources.rows` no servidor | 6 |
| 5 | A página Dados | 8, 9, 10 |
| 6 | A QA das telas, por um agente que não construiu | 8, 9, 10 |

## Como ler este plano

- Todo caminho é relativo à raiz do repositório, no `main` em `0d4c5730`. `(novo)` marca o arquivo que não existe.
- Cada unidade é um commit. Siga a skill `conexus-build` passo a passo. Apague antes de acrescentar (passo 3).
- Os comandos de teste de um arquivo do servidor pedem antes `npm ci` e `npm run build -w @conexus/server`. Um arquivo roda com `MASTRA_AGENT_THREAD_LEASE_TTL_MS=3000 node scripts/test-run.ts --test-concurrency=1 --test-timeout=120000 apps/server/src/<caminho>.test.ts`. Os pacotes rodam com `npm test -w @conexus/connectors` e `npm test -w @conexus/hub-api`. A tela roda com `npm run test:unit -w @conexus/web -- <arquivo>`.
- "Molde" é o trecho do `main` que a unidade copia na forma. As decisões estão no `design.md` desta pasta (`C1` a `C8`). Este plano não as repete.
- Toda falha tem nome, log e resposta, como a tabela "Tratamento de erros" do `design.md`. Nenhum `catch` genérico. Um `catch` só mapeia uma falha nomeada e relança o resto (code C53), como `apps/server/src/hub/copies/project-view.ts:108-112`.
- Uma unidade que encontra uma lacuna da seção "Notas" para (AGENTS.md, "A missing decision stops the work").

## Tarefas

- [ ] 0. Grupo 0: o esquema e as permissões do banco do Hub (um PR, data D11; palavra do fundador dada em 2026-11-14 (P2 do índice); o PR a cita)
  - [ ] 0.1 A coluna `column_state` em `copies.copy` (um commit)
    - **Arquivos:** `apps/server/src/hub/copies/tables.ts`; `apps/server/migrations/<carimbo>_copy_column_state/migration.sql` e `snapshot.json` (novos, gerados).
    - **Referência a seguir:** `apps/server/src/hub/copies/tables.ts:54-55` (a coluna `definition`, `jsonb` com comentário) e `:89` (o `check('copy_definition', ...)`). A migração que só acrescenta: `apps/server/migrations/20261112030410_member_profile/migration.sql` (data D6).
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // tables.ts, dentro de copy, depois de lastRunId
      // Each source column's state: when it last came in a row, and since when it has not (parte 1, `C5`).
      columnState: jsonb('column_state').notNull().default({}),
      // na lista de restrições, depois de copy_definition
      check('copy_column_state', sql`jsonb_typeof(${table.columnState}) = 'object'`),
      ```
      Depois `npm run generate -w @conexus/server` e conferir que o SQL gerado só tem `ADD COLUMN ... DEFAULT '{}'::jsonb NOT NULL` e `ADD CONSTRAINT`. Acrescente no topo do `migration.sql` a linha `-- contract: ...` no molde de `20261114134855_model_accounts_access/migration.sql:1`, dizendo que a coluna nasce com padrão e todo insert da imagem anterior passa.
    - **Testes:** `npm run migrations -- --base origin/main` (o verificador de `D6`). `apps/server/src/platform/catalog.test.ts` continua verde nesta unidade porque a coluna nova ainda não tem permissão de escrita.
    - **Mutações à mão:** tirar o `.notNull()` faz o `check-migrations` ou o `catalog.test.ts` acusar a diferença; trocar `'object'` por `'array'` faz o insert de `insertedCopy` (`apps/server/src/hub/copies/accept.ts`) falhar em `enable.test.ts`.
    - **Pronto quando:** `npm run migrations -- --base origin/main` passa e `enable.test.ts` passa sobre o banco descartável migrado.
    - _Requisitos: 5.1_
  - [ ] 0.2 As permissões `UPDATE(column_state)` e `UPDATE(definition)` (um commit)
    - **Arquivos:** `apps/server/migrations/<carimbo>_copy_column_state_grants/migration.sql` e `snapshot.json` (novos); `apps/server/database-grants.sql`.
    - **Referência a seguir:** `apps/server/migrations/20261112030433_member_profile_grants/migration.sql` (SQL à mão, com o comentário de `D5` e de `D11`) e o bloco de `copies.copy` em `apps/server/database-grants.sql:373-381`.
    - **O que sai:** nada.
    - **O que entra:**
      ```sql
      -- migration.sql: Custom SQL: Drizzle cannot generate a grant (data D5). Parte 1 da camada de dados, with
      -- the founder's word of 2026-11-14 in a pull request of its own (data D11): a run writes the state of each source
      -- column of its copy, and fills the descriptions a template gives that the stored definition lacks.
      GRANT UPDATE (column_state, definition) ON TABLE copies.copy TO hub_company;
      ```
      ```sql
      -- database-grants.sql, depois de GRANT UPDATE(last_run_id) ON TABLE copies.copy TO hub_company;
      -- Parte 1 da camada de dados, founder 2026-11-14 ("P2 Okay"): a run writes the copy's column state and
      -- fills the template's descriptions the stored definition lacks.
      GRANT UPDATE(column_state) ON TABLE copies.copy TO hub_company;
      GRANT UPDATE(definition) ON TABLE copies.copy TO hub_company;
      ```
      A migração vazia nasce com `npm run generate -w @conexus/server -- --custom --name copy_column_state_grants`, como o par `member_profile` nasceu. O corpo do PR cita a palavra do fundador de 2026-11-14 (P2 do índice da spec).
    - **Testes:** `apps/server/src/platform/catalog.test.ts` (compara o catálogo do banco migrado com `database-grants.sql`).
    - **Mutações à mão:** apagar a linha `UPDATE(definition)` do `database-grants.sql` faz `catalog.test.ts` falhar; apagá-la da migração faz o mesmo teste falhar pelo outro lado.
    - **Pronto quando:** `catalog.test.ts` passa e o corpo do PR cita a palavra do fundador de 2026-11-14.
    - _Requisitos: 2.4, 5.1_
  - [ ] 0.3 Ponto de conferência do grupo 0
    - Rode `apps/server/src/platform/catalog.test.ts`, `apps/server/src/hub/copies/enable.test.ts`, `npm run check` e `npm run quality`.
    - Passos 6 e 7 da skill `conexus-build`: rode a migração num banco descartável, pstack `deslop` e `no-comments`, as mutações das unidades 0.1 e 0.2. Nenhum passo fica de fora.
    - Linha da tabela de referência no PR: nenhuma peça nova; o PR cita data D6, `D11` e `D18` (quem escreve: a rodada, unidades 1.3 e 2.3; quem lê: `shownOf`).
    - A CI roda `npm run check` com `quality --fast`, os shards do servidor e `catalog.test.ts`. O PR cita a palavra do fundador de 2026-11-14 (data D11, P2 do índice).

- [ ] 1. Grupo 1: o nome e a descrição (um PR; depende do grupo 0 no `main`)
  - [ ] 1.1 A regra de nome `sistema_tabela` (um commit)
    - **Arquivos:** `apps/server/src/hub/copies/naming.ts` (novo), `apps/server/src/hub/copies/naming.test.ts` (novo), `apps/server/src/hub/copies/enable.ts`, `apps/server/src/hub/copies/propose.ts`, `apps/server/src/hub/copies/test-proposals.ts`, e os testes que leem `sync.<modelo>` ou propõem um nome (lista abaixo).
    - **Referência a seguir:** `enable.ts:70-75` (`insertedCopy` com `name: model.id`); `propose.ts:219-233` (a ordem das recusas de `propose`); o item de recusa `MALFORMED` de `propose.ts:188-205`; a regra que o Construtor já recebe em `apps/server/src/builder/connectors/copy-propose.ts:47` ("`<system>_<data>`").
    - **O que sai:** `name: model.id` em `enable.ts:73`.
    - **O que entra:**
      ```ts
      // naming.ts
      import { CopyName } from '../connectors/public.ts'
      /** `mercado-livre` + `pedidos` = `mercado_livre_pedidos`: the connector's id with `-` as `_`. */
      export function copyPrefixOf(connectorId: string): string {
        return `${connectorId.replaceAll('-', '_')}_`
      }
      export function modelCopyName(connectorId: string, modelId: string): CopyName {
        return CopyName.parse(`${copyPrefixOf(connectorId)}${modelId}`)
      }
      /** The refusal's item when a proposed name lacks the connector's prefix; none when it has it. */
      export function namePrefixIssue(connectorId: string, name: CopyName): string | undefined {
        const prefix = copyPrefixOf(connectorId)
        return name.startsWith(prefix) ? undefined : `name: COPY_NAME_PREFIX: the name starts with "${prefix}".`
      }
      // enable.ts:73
      ...{ name: modelCopyName(linked.connectorId, model.id), label: model.label },
      // propose.ts, logo depois de `const { sources, connector } = sourced` (:230), antes de proofs
      const prefixed = namePrefixIssue(connector, name)
      if (prefixed !== undefined) return { kind: 'MALFORMED', issues: [prefixed] }
      ```
      A recusa é um item de `MALFORMED` (`apps/server/src/hub/connectors/builder-port.ts:80-81`), e não um tipo novo de resposta: o Construtor já lê os itens. A ordem de `propose` não muda. Um nome de mais de 40 caracteres continua recusado em `CopyName.safeParse` (`propose.ts:219-223`), com o item do zod que `issuesOf(name.error, 'name')` (`propose.ts:20-22`) monta. `namePrefixIssue` confere só o prefixo, depois que o conector é conhecido.
    - **Testes:**
      - `naming.test.ts`: "o prefixo troca o hífen" (`mercado-livre`), "cada modelo do kit cabe em 40 caracteres com o prefixo" (percorre `CONNECTORS` de `../connectors/public.ts` e chama `modelCopyName` em cada `copy.models`).
      - `apps/server/src/hub/copies/enable.test.ts`, caso "ligar: a linha, o esquema e a tabela" (`:49`): o nome guardado e a tabela `sync.sankhya_vendas`.
      - `apps/server/src/hub/copies/propose.test.ts`, caso novo "propor: o nome sem o sistema na frente" no molde de "propor: as recusas" (`:70`): `vendas` recusa com o item `COPY_NAME_PREFIX`; `sankhya_` seguido de 33 letras (41 caracteres) recusa com um item que começa por `name:` e não cita `COPY_NAME_PREFIX` (o item do zod de hoje); `sankhya_devolucoes` passa; nada é gravado (`copy_proposal` vazio).
      - `apps/server/src/hub/copies/test-proposals.ts`: o nome padrão `'devolucoes'` de `proposeAs` (`:47`) e de `proposed` (`:56`) vira `'sankhya_devolucoes'`. Sem isso todo `proposed(on)` volta `MALFORMED` e quebra `accept.test.ts`, `accept-v2.test.ts`, `delete.test.ts` e `routes.test.ts:296`. Os testes que passam outro nome a `proposeAs` ou `proposed` ganham o prefixo do conector da conexão proposta (`sankhya_` na versão 1; o prefixo do conector do dublê na versão 2, como `propose-v2.test.ts` monta). A lista sai de `git grep -ln "proposeAs(\|proposed(\|devolucoes" -- apps/server/src`.
      - Troque `sync.vendas`, `sync.clientes` e os outros nomes de modelo pelo nome com o prefixo nos testes que os leem. A lista sai de `git grep -ln "sync\.\(vendas\|clientes\|produtos\|vendedores\|itens_venda\)\|'vendas'\|'clientes'" -- apps/server/src`, e no `main` são 37 arquivos, 35 deles de teste (entre eles `grants.test.ts`, `delete.test.ts`, `run.test.ts`, `routes.test.ts`, `apps/server/src/hub/apps/copy-data.test.ts`, `apps/server/src/builder/app-data/*.test.ts`). O argumento de `on.enable('vendas')` continua o id do modelo. Os textos de exemplo de `apps/server/src/builder/app-data/context.ts:21` e `tools.ts:26` (`sync.vendas`) são da trilha Agentes e Apps e não mudam neste PR.
    - **Mutações à mão:** trocar `replaceAll('-', '_')` por nada faz "o prefixo troca o hífen" falhar; tirar a linha de `namePrefixIssue` em `propose.ts` faz "propor: o nome sem o sistema na frente" falhar; voltar `name: model.id` faz `enable.test.ts` falhar.
    - **Pronto quando:** os testes acima passam e `GET /api/companies/<c>/copies` depois de ligar `vendas` lista `sankhya_vendas`.
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [ ] 1.2 A descrição na versão 1, nos modelos do Sankhya e na proposta (um commit)
    - **Arquivos:** `packages/connectors/src/kernel/copy.ts`, `packages/connectors/src/kernel/definition.ts`, `packages/connectors/src/sankhya/copies.ts`, `packages/connectors/src/kernel/copy.test.ts`, `packages/connectors/src/sankhya/sankhya.test.ts`, `apps/server/src/hub/copies/propose.ts`, `apps/server/src/hub/copies/store.ts`, `apps/server/src/hub/copies/propose.test.ts`, `apps/server/src/hub/copies/propose-v2.test.ts`, `apps/server/src/hub/copies/routes.test.ts`.
    - **Referência a seguir:** os campos de descrição da versão 2 em `copy.ts:122` e `:129`; `assertCopy` em `definition.ts:132-139` e os seus testes em `packages/connectors/src/kernel/copy.test.ts:146-174` (`withCopy` e `MODEL`, `:132-144`); a função `model` de `sankhya/copies.ts:15-37`; `shownOf` em `store.ts:200-216`.
    - **O que sai:** o ramo da versão 1 de `shownOf` que devolve `description: null` (`store.ts:207-210`).
    - **O que entra:**
      ```ts
      // copy.ts, CopyDefinitionV1: dois campos opcionais (a linha guardada antes desta parte não os tem, code C27)
      description: z.string().trim().min(1).max(500).optional(),
      columns: z.array(z.object({
        name: CopyColumnName, type: CopyColumnType,
        description: z.string().trim().min(1).max(200).optional(),
      })).min(1).max(100),
      // definition.ts, dentro de assertCopy, depois do parse de cada modelo
      if (model.definition.description === undefined) throw new Error(`Copy template without description: ${model.id}`)
      for (const column of model.definition.columns)
        if (column.description === undefined) throw new Error(`Copy template column without description: ${model.id}.${column.name}`)
      // sankhya/copies.ts: model(id, label, { description, sql, columns: [nome, tipo, descrição][], key, window })
      // DESCRIBED: Readonly<Record<string, string>> com as 29 linhas da tabela "Coluna | Descrição" do design.md
      // TABLES: a descrição de cada uma das cinco, da tabela "Cópia | Descrição da tabela" do design.md
      // store.ts, shownOf
      description: definition.description ?? null,
      columns: definition.columns.map(({ name, type, description }) => ({ name, type, description: description ?? null })),
      // propose.ts, logo depois do parse (:225), antes de `existing`
      const undescribed = definition.columns.flatMap((column, at) =>
        column.description ? [] : [`definition.columns.${at}.description: COPY_COLUMN_UNDESCRIBED: every column has a description.`])
      if (undescribed.length > 0) return { kind: 'MALFORMED', issues: undescribed }
      ```
      Os textos são os do `design.md`, letra por letra. `CGC_CPF` leva o texto da decisão `L1` das Notas.
    - **Testes:**
      - `packages/connectors/src/kernel/copy.test.ts`: o `MODEL` de `:132-136` ganha a descrição da tabela e de cada coluna, senão o `assert.doesNotThrow(withCopy({ read: copyRead, models: [MODEL] }))` de `:152` falha. Casos novos no mesmo teste, no molde dos `assert.throws(withCopy(...))` de `:153-173`: o modelo sem descrição de tabela recusa com `/Copy template without description/`, e o modelo com uma coluna sem descrição recusa com `/Copy template column without description/`.
      - `packages/connectors/src/sankhya/sankhya.test.ts`, caso novo "as cinco cópias trazem a descrição do desenho": confere `vendas` e `DTALTER` contra o texto do `design.md`.
      - `propose.test.ts` e `propose-v2.test.ts`: caso novo "propor: a coluna sem descrição" (um item por coluna, nada gravado); as definições de proposta dos casos existentes ganham a descrição de cada coluna.
      - `routes.test.ts`, caso "a lista e as rodadas" (`:126`): a cópia `sankhya_vendas` da versão 1 lista `shown.description` e a descrição de `NUNOTA`.
    - **Mutações à mão:** tirar a checagem de coluna de `assertCopy` faz o teste do kit falhar; trocar `column.description ?` por `true ?` em `propose.ts` faz "propor: a coluna sem descrição" falhar; voltar `description: null` em `shownOf` faz `routes.test.ts` falhar.
    - **Pronto quando:** `npm test -w @conexus/connectors` passa e a lista de uma cópia nova do Sankhya mostra a descrição da tabela e das colunas.
    - _Requisitos: 2.1, 2.2, 2.3, 2.5_
  - [ ] 1.3 A rodada que preenche a descrição que falta (um commit)
    - **Arquivos:** `apps/server/src/hub/copies/describe.ts` (novo), `apps/server/src/hub/copies/run.ts`, `apps/server/src/hub/copies/describe.test.ts` (novo).
    - **Referência a seguir:** a ordem de `runCopy` em `run.ts:149-177`; `ensureCopyTable`, que já manda os `COMMENT ON` (`apps/server/src/platform/copy-sql.ts:63-88`, `:140-163`); o modelo vem de `deps.connectors().catalog()` (`apps/server/src/hub/connectors/copy-port.ts:315-319`); a escrita guardada pela posse da rodada, `held(claimed)` em `run.ts:70-72`.
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // describe.ts
      /** The template's descriptions the stored definition lacks, copied in; none replaced (`C2`, passo 3). Undefined: nothing to fill. */
      export function filledFrom(stored: CopyDefinitionV1, model: CopyDefinitionV1): CopyDefinitionV1 | undefined
      //  description = stored.description ?? model.description
      //  columns = stored.columns.map(c => c.description !== undefined ? c
      //            : { ...c, ...(described(model, c.name) && { description: described(model, c.name) }) })
      //  undefined quando nada mudou (idempotente: aplicar duas vezes dá o mesmo)
      // run.ts, em runCopy, depois de `if (sync === undefined) return end(DATABASE_DOWN)` e antes de copyTableOf
      const described = await describedCopy(run0, held)   // devolve o StoredCopy de antes ou o preenchido, ou um CopyRunEnd
      //  1. só versão 1 com copy.model !== null; senão segue
      //  2. model = deps.connectors().catalog().find(e => e.connector === copy.connectorId && e.model.id === copy.model)
      //     ausente -> deps.log.error({ companyId, copyId, model: copy.model }, 'COPY_MODEL_GONE') e segue sem preencher
      //  3. filled = filledFrom(copy.definition, model.definition); undefined -> segue
      //  4. table = await deps.companyPostgres.ensureCopyTable(sync, copyTableOf({ ...copy, definition: filled }, sources))
      //     table.kind !== 'DONE' -> log COPY_DATABASE_FAILED com o código (molde enable.ts:156-159) e end(DATABASE_DOWN)
      //  5. database.command(companyScope): update(copy).set({ definition: filled }).where(held(claimed)); sem linha -> lost()
      ```
      Os `COMMENT ON` vão antes da linha: se o banco da empresa falha, a definição fica sem descrição e a rodada seguinte tenta de novo.
    - **Testes:** `describe.test.ts`, pela porta do teste de cópias (`copiesOn` de `apps/server/src/hub/copies/test-copies.ts:137`):
      - "a rodada preenche a descrição de uma cópia ligada antes": ligar `vendas`, tirar as descrições da linha com `plantCopy(on, copyId, "definition = definition - 'description'")` e o mesmo para as colunas, apagar os comentários que a ligação já pôs (`COMMENT ON TABLE sync.sankhya_vendas IS NULL` e o mesmo para uma coluna, como `asSync`, `test-copies.ts:249`), rodar, e ler a definição de volta e o `obj_description` e o `col_description` da tabela.
      - "preencher não troca uma descrição que existe": plantar uma descrição de coluna diferente da do modelo; depois de duas rodadas ela continua.
      - "o modelo que saiu do kit": plantar `model = 'nao_existe'`; a rodada termina `COMPLETE` e o log tem `COPY_MODEL_GONE` uma vez (`hubLog`, `test-copies.ts:208`).
      - "o banco da empresa cai ao preencher": `t.mock.method(on.hub.postgres.companyPostgres, 'ensureCopyTable', ...)` com `NO_ANSWER` (molde `grants.test.ts:81-83`); a rodada termina `ERROR` `COPY_DATABASE_UNAVAILABLE` e a definição continua sem descrição.
      - Teste puro de `filledFrom` no mesmo arquivo: aplicar duas vezes dá `undefined` na segunda.
    - **Mutações à mão:** trocar `c.description !== undefined ? c` por `{ ...c, description: ... }` sempre faz "preencher não troca" falhar; inverter os passos 4 e 5 faz "o banco da empresa cai ao preencher" falhar; tirar o log faz "o modelo que saiu do kit" falhar.
    - **Pronto quando:** `describe.test.ts` passa e uma cópia ligada antes desta parte mostra a descrição na lista depois da próxima rodada.
    - _Requisitos: 2.4, 2.6, 2.7_
  - [ ] 1.4 Ponto de conferência do grupo 1
    - Rode `npm test -w @conexus/connectors`, os arquivos `naming.test.ts`, `describe.test.ts`, `enable.test.ts`, `propose.test.ts`, `propose-v2.test.ts`, `routes.test.ts` e os arquivos de teste das duas listas da unidade 1.1, e depois `npm run check` e `npm run quality`.
    - Passos 6 e 7 da skill `conexus-build`: ligue uma cópia no Hub local com o dublê do Sankhya e veja o nome e a descrição na lista; pstack `deslop` e `no-comments`; as mutações de 1.1, 1.2 e 1.3, sem pular nenhuma.
    - Linhas da tabela de referência no PR: "Nome da tabela" (nativo, `naming.ts`) e "Descrição de tabela e coluna" (nativo, `COMMENT ON`), com o arquivo e a linha de cada uma.
    - A CI roda `npm run check` (`quality --fast`), os testes do kit e os shards do servidor.

- [ ] 2. Grupo 2: o login de leitura, a amostra e a coluna inativa (um PR; depende dos grupos 0, 1 e 3 no `main`, e começa depois de 1.4 porque 1.1 e 2.1 mudam as mesmas linhas de `enable.ts`)
  - [ ] 2.1 O login `conexus_read` (um commit)
    - **Arquivos:** `apps/server/src/platform/copy-sql.ts`, `apps/server/src/platform/company-postgres.ts`, `apps/server/src/hub/copies/enable.ts`, `apps/server/src/platform/copy-reader.test.ts` (novo), `apps/server/src/hub/copies/enable.test.ts`, `apps/server/src/platform/test-company-postgres.ts`.
    - **Referência a seguir:** `readSettings`, `readGrants` e `ensureReadLogin` em `apps/server/src/platform/app-read.ts:41-100` (as definições do login, as permissões e a repetição em `42710`); `readApp` em `app-read.ts:114-156` (o `switch` da resposta); `ensureSync` e `syncAddress` em `copy-sql.ts:107-133`; a ligação ao `context` em `company-postgres.ts:162-215` e `:352-371`.
    - **O que sai:** nada.
    - **O que entra:** o pseudocódigo de `C3` do `design.md`, com estes nomes reais:
      ```ts
      // copy-sql.ts
      import { APP_CALL_LIMITS } from '@conexus/app-contract'
      export const READ_LOGIN = 'conexus_read'
      export async function ensureReader(context: Context, owner: DatabaseUrl): Promise<SqlAnswer>
      //  const signal = budget()   (copy-sql.ts:95-98, como ensureSync em :108)
      //  const [read, sync] = [READ_LOGIN, SYNC_LOGIN].map(quoted)   // o nome sempre por quoted(): check-migrations
      //                                                               // (scripts/check-migrations.ts:21) recusa SET logo depois de aspas
      //  once(): created = await missingLogins(context, owner, [READ_LOGIN], signal); Array.isArray senão devolve
      //          context.transport(owner, [...created,
      //            `ALTER ROLE ${read} SET search_path = ${SYNC_SCHEMA}`        // molde readSettings, app-read.ts:41-52
      //            `ALTER ROLE ${read} SET default_transaction_read_only = on`
      //            `ALTER ROLE ${read} SET statement_timeout = ${APP_CALL_LIMITS.statementTimeoutMs}`
      //            `ALTER ROLE ${read} SET transaction_timeout = ${APP_CALL_LIMITS.transactionTimeoutMs}`
      //            `SET LOCAL ROLE ${sync}`
      //            `GRANT USAGE ON SCHEMA ${SYNC_SCHEMA} TO ${read}`
      //            `GRANT SELECT ON ALL TABLES IN SCHEMA ${SYNC_SCHEMA} TO ${read}`
      //            `ALTER DEFAULT PRIVILEGES IN SCHEMA ${SYNC_SCHEMA} GRANT SELECT ON TABLES TO ${read}`], signal)
      //  first.kind === 'REFUSED' && first.code === DUPLICATE_OBJECT ? once() : first
      export async function readerAddress(context: Context, host: string): Promise<DatabaseUrl>   // syncAddress (copy-sql.ts:128-133) com o login pedido
      // SyncRead: o nome CopyRead já existe em apps/server/src/hub/connectors/copy-port.ts:46
      export type SyncRead = { kind: 'ROWS'; results: readonly ReadResult[] } | { kind: 'REFUSED'; sqlstate: string }
        | { kind: 'NO_LOGIN' } | { kind: 'TOO_LARGE' } | { kind: 'TIMEOUT' } | { kind: 'UNAVAILABLE'; cause?: string }
      export async function readCopies(context: Context, reader: DatabaseUrl, statements: readonly SqlStatement[], signal: AbortSignal): Promise<SyncRead>
      //  context.transport(reader, statements, signal, { readOnly: true }) e o switch de readApp (app-read.ts:120-155):
      //  READ -> tamanho acima de REPLY_CAP_BYTES -> TOO_LARGE; senão ROWS
      //  TOO_LARGE -> TOO_LARGE; NO_ANSWER -> signal.aborted ? TIMEOUT : UNAVAILABLE com cause
      //  REFUSED 28000|28P01 -> NO_LOGIN; 57014|25P04 -> TIMEOUT; outro -> REFUSED com o sqlstate
      // company-postgres.ts: CompanyPostgres ganha ensureReader, readerAddress e readCopies; createCompanyPostgres os liga ao context
      // enable.ts, logo depois de `const answered = await deps.companyPostgres.ensureSync(owner)` (:142)
      const reader = answered.kind === 'DONE' ? await deps.companyPostgres.ensureReader(owner) : answered
      //  e `table` passa a depender de reader.kind === 'DONE' no lugar de answered (o mesmo log e a mesma falha de :156-159)
      ```
      `readCopies` repete a forma de `readApp` e não a importa (`design.md`, `C3`). `REPLY_CAP_BYTES` vem de `./app-sql.ts`, como em `app-read.ts:5`.
    - **Testes:**
      - `apps/server/src/platform/test-company-postgres.ts:133`: a regex da limpeza passa a `'^(app_.*_(run|migrate|read)|conexus_sync|conexus_read)$'`. Sem isso o papel fica no servidor de teste entre testes, e "o papel existe depois de ligar" passa mesmo sem a chamada em `enable.ts`.
      - `copy-reader.test.ts`, no molde de `apps/server/src/platform/copy-sql.test.ts:1-44` (`createCompanyDatabase`, `syncLoginOf`, `testCompanyPostgres`):
        - "o login de leitura lê sync e só sync": uma tabela feita pelo sync antes e outra depois do login são lidas por `readCopies`; `select from information_schema.tables` passa e `select from app_<p>.x` é recusado com `42501` (molde de recusas `apps/server/src/hub/copies/grants.test.ts:63-92`).
        - "o login de leitura não escreve": um `pg.Client` cru, conectado com o endereço de `readerAddress`, fora de `readCopies` e do seu transporte `readOnly`, manda `DELETE FROM sync.<t>` e recebe `25006` (transação só de leitura); o mesmo cliente, numa transação aberta com `BEGIN TRANSACTION READ WRITE`, recebe `42501` (sem permissão de escrita). O teste não usa `SET` em texto, que `scripts/check-migrations.ts:21` recusa também nos testes. As duas recusas provam as duas travas.
        - "criar duas vezes não muda nada"; "a senha errada é NO_LOGIN".
      - `enable.test.ts`, caso "ligar: a linha, o esquema e a tabela" (`:49`): o papel `conexus_read` existe depois de ligar.
      - `enable.test.ts`, caso novo "ligar: o banco recusa o login de leitura": `t.mock.method(on.hub.postgres.companyPostgres, 'ensureReader', async () => ({ kind: 'REFUSED' as const, code: '42501' }))` (molde `grants.test.ts:81-83`); ligar responde `COPY_DATABASE_UNAVAILABLE` e o log tem `COPY_DATABASE_FAILED` com `code: '42501'`.
    - **Mutações à mão:** tirar `default_transaction_read_only = on` faz a recusa `25006` de "não escreve" falhar; trocar o `GRANT SELECT ON ALL TABLES` por `GRANT ALL ON ALL TABLES` faz a recusa `42501` do mesmo caso falhar; tirar `ALTER DEFAULT PRIVILEGES` faz falhar a tabela feita depois; tirar a chamada em `enable.ts` faz os dois casos de `enable.test.ts` falharem.
    - **Pronto quando:** `copy-reader.test.ts` e `enable.test.ts` passam.
    - _Requisitos: 3.1, 3.2, 3.3, 3.5, 3.6_
  - [ ] 2.2 A rota `sampleCopy` e a ação `readCopyRows` (um commit)
    - **Arquivos:** `packages/hub-api/src/copies.ts`, `packages/hub-api/src/roles.ts`, `apps/server/src/hub/identity/admission.ts`, `apps/server/src/hub/identity/companies.ts`, `apps/server/src/hub/identity/test-roles.ts`, `apps/server/src/hub/identity/developer.test.ts`, `apps/web/src/platform/test-may.ts`, `apps/server/src/hub/copies/read-table.ts` (novo), `apps/server/src/hub/copies/sample.ts` (novo), `apps/server/src/hub/copies/service.ts`, `apps/server/src/hub/copies/routes.ts`, `apps/server/src/hub/copies/sample.test.ts` (novo).
    - **Referência a seguir:** `listCopyRuns` em `packages/hub-api/src/copies.ts:286-299` (a forma de `defineOperation`, `OfCopy`, `ONE_FAILURES`); `CompanyMay` em `packages/hub-api/src/roles.ts:47-54`; `ACTIONS` em `admission.ts:66-135`, com `manageConnections` em `:103`; `may` em `companies.ts:98-104`; a leitura com refazer o login de `apps/server/src/hub/apps/app-database.ts:182-211` (`askApp`); `companyOwner` em `store.ts:155-180`; `serve` em `routes.ts:73-80`.
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // packages/hub-api/src/copies.ts
      export const COPY_SAMPLE_ROWS = 5
      export const CopySample = z.object({ columns: z.array(z.string()), rows: z.array(z.array(z.unknown())), complete: z.boolean() })
      export const sampleCopy = defineOperation({
        id: 'sampleCopy', summary: 'Shows the first rows of a copy’s table, five at most, to whoever reads its rows.',
        access: 'session', method: 'GET', path: `${BASE}/{copyId}/sample`, bodyLimit: 1024,
        input: { params: OfCopy },
        success: { status: 200, body: z.object({ sample: CopySample }) },
        failures: [...ONE_FAILURES, 'COPY_DATABASE_UNAVAILABLE'],
      })
      // roles.ts, CompanyMay: readCopyRows: z.boolean()   (decisão `L6`)
      // admission.ts, ACTIONS: readCopyRows: { by: 'MEMBER', statement: MANAGE_CONNECTIONS, locks: false }  (a parte 4 troca pela regra do papel)
      // companies.ts, may: readCopyRows: allows(admitted.role, 'readCopyRows')
      // read-table.ts
      export type TableRead = { kind: 'ROWS'; columns: string[]; rows: unknown[][]; complete: boolean }
        | { kind: 'NO_TABLE' } | { kind: 'UNAVAILABLE'; reason: string }
      /** The first `limit` rows of a copy's table as the read login, its columns the definition's alone (data D31); admits nobody. */
      export async function readCopyTable(deps: CopiesDeps, input: { companyId: CompanyId; stored: StoredCopy; limit: number; signal: AbortSignal }): Promise<TableRead>
      //  ready = database.read(companyScope(companyId), tx => deps.projects.readyDatabaseOf(tx, companyId)); host nulo -> UNAVAILABLE 'NO_COMPANY_DATABASE'
      //  reader = await deps.companyPostgres.readerAddress(ready.host)
      //  names = stored.definition.columns.map(c => c.name)
      //  statement = { text: `SELECT ${names.map(quoted)} FROM "sync".${quoted(stored.name)} LIMIT ${limit + 1}` }   // quoted de platform: exporte-o por company-postgres.ts
      //  answer = await deps.companyPostgres.readCopies(reader, [statement], signal)
      //  NO_LOGIN -> owner = await companyOwner(deps, { companyId, personId: stored.createdBy }); undefined -> UNAVAILABLE 'NO_OWNER'
      //             made = await deps.companyPostgres.ensureReader(owner); made.kind !== 'DONE' -> log COPY_DATABASE_FAILED com o código, UNAVAILABLE
      //             deps.log.info({ companyId }, 'COPY_READER_MADE'); answer = readCopies de novo; NO_LOGIN outra vez -> UNAVAILABLE 'NO_LOGIN'
      //  ROWS -> rows = results[0].rows; { columns: names, rows: rows.slice(0, limit), complete: rows.length <= limit }
      //  REFUSED 42P01 -> NO_TABLE; REFUSED outro -> UNAVAILABLE `REFUSED_${sqlstate}`; TOO_LARGE, TIMEOUT, UNAVAILABLE -> UNAVAILABLE com o kind
      // sample.ts
      export async function sampleOf(deps: CopiesDeps, input: InCompany & { copyId: CopyId; signal: AbortSignal }): Promise<CopySample>
      //  stored = database.read(personScope(input), tx => { admitMember({ tx, ...input, action: 'readCopyRows' }); storedCopy(tx, input) })
      //  undefined -> throw new Failure('COPY_NOT_FOUND')
      //  read = await readCopyTable(deps, { companyId, stored, limit: COPY_SAMPLE_ROWS, signal })
      //  ROWS -> read sem o kind; NO_TABLE -> { columns: names, rows: [], complete: true }
      //  UNAVAILABLE -> deps.log.error({ companyId, copyId, reason }, 'COPY_SAMPLE_FAILED'); throw new Failure('COPY_DATABASE_UNAVAILABLE')
      // service.ts: sample: (input: Of & { signal: AbortSignal }) => sampleOf(full, input)
      // routes.ts: serve(app, sampleCopy, async (input) => answer({ sample: await copies.sample({ ...inCompany(input), copyId: input.params.copyId, signal: <o sinal da requisição, como as outras rotas que leem o banco da empresa> }) }))
      ```
      O sinal da requisição: use o mesmo que `apps/server/src/hub/apps/routes.ts:90-100` passa a `listCopyRows`; se aquela rota não passa sinal, use `AbortSignal.timeout(APP_CALL_LIMITS.transactionTimeoutMs)` como `askApp` recebe o seu.
    - **Testes:** `sample.test.ts`, pela porta HTTP do Hub de teste (`call` de `routes.test.ts`, molde "cópias: quem vê e quem recebe não encontrado", `routes.test.ts:63-115`, e `people(on)`):
      - "a amostra: dono e administrador veem 5 linhas e a marca de que há mais" (`sankhya_vendas` depois de `firstEnded`, `test-routes.ts:40`; `complete: false`; as colunas são as da definição e nenhuma é `_pass`).
      - "a amostra: desenvolvedor, membro e quem é de fora recebem não encontrado".
      - "a amostra antes da primeira rodada": a tabela apagada como `asSync` (`DROP TABLE`) dá `rows: []` e `complete: true`.
      - "a amostra refaz o login de leitura": um dublê de `readCopies` que responde `NO_LOGIN` só na primeira chamada e chama o real nas outras, no molde de `apps/server/src/hub/apps/app-data.test.ts:74-83` (`const read = postgres.readCopies.bind(postgres)` e `t.mock.method(postgres, 'readCopies', (...args) => ...)`, com um `let first = true`); a resposta vem com as linhas, o log tem `COPY_READER_MADE` uma vez, e `ensureReader` foi chamado uma vez (`t.mock.method(postgres, 'ensureReader')` sem troca conta as chamadas).
      - "a amostra com o banco calado": `t.mock.method(on.hub.postgres.companyPostgres, 'readCopies', async () => ({ kind: 'UNAVAILABLE' }))`; 503 `COPY_DATABASE_UNAVAILABLE` e o log `COPY_SAMPLE_FAILED`.
      - "a amostra de uma cópia que não existe": `COPY_NOT_FOUND`.
      - `developer.test.ts:100-118` e `test-roles.ts:120-127`: o `may` ganha `readCopyRows` (verdadeiro só para dono e administrador).
    - **Mutações à mão:** trocar `LIMIT ${limit + 1}` por `LIMIT ${limit}` faz a marca de "há mais" falhar; trocar `MANAGE_CONNECTIONS` por `MANAGE_COPIES` em `readCopyRows` faz o caso do desenvolvedor falhar; tirar o ramo `NO_LOGIN` faz "refaz o login" falhar; trocar `stored.definition.columns` por `*` faz o caso de `_pass` falhar.
    - **Pronto quando:** `sample.test.ts` e `developer.test.ts` passam, e `GET .../copies/<id>/sample` como dono responde 5 linhas.
    - _Requisitos: 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [ ] 2.3 A coluna inativa (um commit)
    - **Arquivos:** `packages/connectors/src/kernel/list.ts`, `packages/connectors/src/kernel/list.test.ts`, `apps/server/src/hub/connectors/copy-port.ts`, `apps/server/src/hub/copies/source-pass.ts`, `apps/server/src/hub/copies/run.ts`, `apps/server/src/hub/copies/column-state.ts` (novo), `apps/server/src/hub/copies/store.ts`, `apps/server/src/hub/copies/list.ts`, `apps/server/src/hub/copies/project-view.ts`, `apps/server/src/hub/copies/column-state.test.ts` (novo).
    - **Referência a seguir:** onde `present` nasce e onde a rodada o junta (o `design.md`, `C5`, corrigido nesta spec):
      1. `cellsOf` em `list.ts:105-117` percorre cada linha e cada coluna com `valueAt(row, path)` (`packages/connectors/src/kernel/operation.ts:105-113`, que dá `undefined` quando o caminho não existe). É ali que nasce `present`.
      2. `listPageOf` em `list.ts:164-185` devolve a página `PAGE` (`:38-45`); ela passa a levar `present`.
      3. `pageV2` em `copy-port.ts:255-296` transforma a página em `CopyRead` (`:46-53`), em `:282-286`; ele passa `present` adiante. `pageV1` (`:198-210`) dá `present: null`.
      4. `pageStep` em `source-pass.ts:138-159` recebe a página e é onde a rodada junta `present` de todas as páginas e fontes; `sourcePass` (`:189-206`) sabe se a fonte fez uma passada inteira: `source.position === null` e, ou `since === null` (de `datesOf`, `:38-46`), ou a definição sem `changedSince`. `passed` grava `watermark` no fim de toda passada (`apps/server/src/hub/copies/sources.ts:136-142`), então `since` deixa de ser nulo da segunda rodada em diante mesmo na cópia que relê tudo; quem o ignora é `listInputOf` (`packages/connectors/src/kernel/list.ts:33`) quando `changedSince` é nulo.
      5. `ended` em `run.ts:89-132` grava, no mesmo `UPDATE` de `copy`, o estado novo quando o resultado é `COMPLETE`.
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // list.ts
      type Rowed = Readonly<{ kind: 'ROWS'; rows: (string | null)[][]; present: ReadonlySet<string> }> | Extract<ListPage, { kind: 'MISFIT' }>
      //  cellsOf: present.add(name) quando valueAt(row, path) !== undefined, em qualquer linha
      //  ListPage PAGE ganha `present: readonly string[]` (os nomes de coluna, na ordem da definição)
      // copy-port.ts: CopyRead PAGE ganha `present: readonly string[] | null`; pageV2 passa page.present; pageV1 passa null
      // source-pass.ts: Run ganha `seen: { present: Set<string>; whole: boolean; rows: number }`
      //  sourcePass: const whole = source.position === null && (since === null || definition.changedSince === null)
      //              if (!whole) run.seen.whole = false
      //  pageStep: if (read.present === null) run.seen.whole = false; else read.present.forEach(n => run.seen.present.add(n)); run.seen.rows += rows.length
      // column-state.ts
      export const ColumnState = z.record(z.string(), z.object({ seenAt: z.iso.datetime(), inactiveSince: z.iso.datetime().nullable() }))
      export type ColumnState = z.infer<typeof ColumnState>
      /** The state after a COMPLETE run (`C5`): a column that came is active; one seen before and absent from a whole read with rows is inactive since the run began. */
      export function nextColumnState(a: { previous: ColumnState; columns: readonly string[]; seen: Run['seen']; began: Date }): ColumnState
      //  para cada coluna da definição:
      //    seen.present.has(c) -> { seenAt: began, inactiveSince: null }
      //    seen.whole && seen.rows > 0 && previous[c] !== undefined -> { ...previous[c], inactiveSince: previous[c].inactiveSince ?? began }
      //    senão -> previous[c] (ausente continua ausente)
      // run.ts: runCopy guarda `began = new Date()` e cria `seen = { present: new Set(), whole: true, rows: 0 }` no Run
      //  ended(): outcome.kind === 'COMPLETE' && claimed.copy.definition.version === 2
      //    ? .set({ ..., columnState: nextColumnState({ previous: claimed.copy.columnState, columns, seen, began }) }) : o set de hoje
      // store.ts: parsedCopy lê columnState: ColumnState.parse(row.columnState) (code C27)
      //  shownOf(connector, definition, state: ColumnState = {}) -> cada coluna: inactiveSince: state[name]?.inactiveSince ?? null
      // list.ts:158 shownOf(row.connectorId, row.definition, row.columnState); project-view.ts:118 o mesmo; store.ts:307 (proposta) sem estado
      ```
      O contrato já tem `inactiveSince` (grupo 3). A versão 1 nunca muda o estado (`design.md`, `C5`).
    - **Testes:**
      - `packages/connectors/src/kernel/list.test.ts`, caso novo "a página diz quais colunas vieram": uma linha sem o caminho `status` e outra com `status: null`; `present` tem `status` (o caminho existe na segunda) e não tem a coluna cujo caminho nenhuma linha traz. Molde: os casos de `listPageOf` do mesmo arquivo.
      - `column-state.test.ts`, teste puro de `nextColumnState`: "inativa só depois de vista", "volta a ativa", "a passada do alterado não marca", "zero linhas não marca".
      - `column-state.test.ts`, pela porta de `storesOn` (`apps/server/src/hub/copies/test-sources.ts:251`), molde `run-v2.test.ts:20-37`: plantar `ordersCopy(false)` (`test-sources.ts:35`), rodar `COMPLETE`; mudar o caminho de `status` na linha com `plantCopy` (`test-copies.ts:239`) para um caminho que o dublê não manda (`jsonb_set(definition, '{columns,1,path}', '"sumiu"')`), rodar de novo, e `GET .../copies` mostra `status` com `inactiveSince`; voltar o caminho, rodar, e `inactiveSince` volta a `null`; a tabela do banco da empresa continua com a coluna (`tableOf`, `test-sources.ts:307`).
      - O mesmo caso com `ordersCopy(true)` (passada do alterado na segunda rodada) não marca nada.
      - "a cópia que relê tudo marca da segunda rodada em diante": com `ordersCopy(false)`, a terceira rodada (com `watermark` gravado pelas duas primeiras) ainda marca a coluna que sumiu. É o caso que prova a condição de `changedSince`.
    - **Mutações à mão:** tirar `previous[c] !== undefined` faz "inativa só depois de vista" falhar; trocar a condição por `since === null` sozinho faz "a cópia que relê tudo marca da segunda rodada em diante" falhar; tirar `definition.changedSince === null` e deixar só `source.position === null` faz "a passada do alterado não marca" falhar; trocar `!== undefined` por `!= null` em `cellsOf` faz o teste do kit falhar.
    - **Pronto quando:** os testes passam e a lista mostra `inactiveSince` na coluna que parou de vir.
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [ ] 2.4 Ponto de conferência do grupo 2
    - Rode `copy-reader.test.ts`, `enable.test.ts`, `sample.test.ts`, `developer.test.ts`, `column-state.test.ts`, `run-v2.test.ts`, `npm test -w @conexus/connectors`, `npm test -w @conexus/hub-api`, `npm run check` e `npm run quality`.
    - Passos 6 e 7 da skill `conexus-build`: chame `GET .../sample` no Hub local com o dublê; pstack `deslop` e `no-comments`; as mutações de 2.1, 2.2 e 2.3, sem pular nenhuma.
    - Linhas da tabela de referência no PR: "Login de leitura" (nativo, papéis e `GRANT`), "Amostra" (nativo, `SELECT ... LIMIT`), "Coluna inativa" (remendo; a prova é `column-state.test.ts`, ao lado da entrada em `docs/reference/boundaries.md`, passo 6 da skill).
    - A CI roda `npm run check`, os shards do servidor, os testes do kit e do contrato, e o `openapi` (a operação nova).

- [ ] 3. Grupo 3: o contrato (um PR do contrato e da conformidade, `docs/steps/trilhas/dados.md:72-78`, com a exceção da decisão `D19` do índice)
  - [ ] 3.1 O rótulo, a descrição obrigatória, a coluna inativa e `TABLE_PAGE_ROWS` (um commit)
    - **Arquivos:** `packages/hub-api/src/copy-shown.ts`, `packages/hub-api/src/company-data.ts`, `packages/hub-api/src/company-data-conformance.ts`, `packages/hub-api/src/company-data.test.ts`; para o typecheck e os testes continuarem compilando (decisão `L7`): `apps/server/src/hub/copies/store.ts` (`shownOf` dá `inactiveSince: null`), `apps/server/src/hub/copies/routes.test.ts` (`:158` e `:268`, as colunas comparadas com `deepEqual`), `apps/server/src/builder/app-data/context.test.ts` (`:33`, colunas tipadas por `CopyShown['columns']` via `project-view.ts:30`), `apps/web/src/hub/copies/test-sources.ts`, `apps/web/sweep-copies-states.ts`, `apps/web/sweep-copy-proposal-states.ts` e os testes de `apps/web` que montam colunas (`copy-detail.test.tsx`, `builder/conversation/copy-proposal-card.test.tsx`, `construtor-rows.test.tsx`).
    - **Referência a seguir:** `CopyShown` em `copy-shown.ts:24-35`; `CatalogTable` em `company-data.ts:42-48`; a lei `describesSystemsAndTables` em `company-data-conformance.ts:113-125` e a lista `LAWS` em `:260-302`; a fixture `CATALOG` em `company-data.test.ts:10-98`.
    - **O que sai:** `description: CopyShown.shape.description` de `CatalogTable` (`company-data.ts:45`); a tabela `estoque` com `description: null` da fixture (`company-data.test.ts`).
    - **O que entra:**
      ```ts
      // copy-shown.ts, cada coluna
      z.object({ name: z.string(), type: z.string(), description: z.string().nullable(),
        /** Since when the source stopped sending the column; null while it comes. */
        inactiveSince: z.iso.datetime().nullable() })
      // company-data.ts
      /** The rows one read of a table carries at most: what the consumer gets in place of the live read. */
      export const TABLE_PAGE_ROWS = 200
      export const CatalogTable = z.object({ name: z.string(), label: z.string(), description: z.string().min(1),
        columns: CopyShown.shape.columns, kept: TableKept })
      // company-data-conformance.ts: nenhum assert novo e nada exportado. Toda lei lê o catálogo por catalogOf (:44-48),
      //  que faz Described.parse; com .min(1), um mundo com uma tabela sem descrição falha em toda lei.
      //  O texto da lei describesSystemsAndTables (o par em LAWS, :260-302) passa a dizer
      //  "descreve os sistemas e as tabelas, cada tabela com a descrição, o significado das colunas e a última rodada"
      // company-data.test.ts: cada tabela ganha label; estoque ganha uma descrição; cada coluna ganha inactiveSince: null
      //  caso novo, o caso recusado:
      test('o contrato recusa a tabela do catálogo sem descrição', () => {
        const [first, ...rest] = CATALOG.tables
        assert.ok(first)
        assert.equal(Catalog.safeParse({ ...CATALOG, tables: [{ ...first, description: '' }, ...rest] }).success, false)
        assert.equal(Described.safeParse({ ...CATALOG, tables: [{ ...first, description: '' }, ...rest] }).success, false)
      })
      ```
    - **Testes:** `npm test -w @conexus/hub-api` (a conformidade sobre o mundo falso e o caso recusado); `npm run typecheck`; `npm run test:unit -w @conexus/web` nos arquivos de fixture tocados.
    - **Mutações à mão:** tirar o `.min(1)` de `CatalogTable` faz "o contrato recusa a tabela do catálogo sem descrição" falhar. A lei não tem trava própria para mutar: a recusa é o esquema que `catalogOf` da conformidade aplica (`company-data-conformance.ts:45`).
    - **Pronto quando:** `npm test -w @conexus/hub-api` e `npm run typecheck` passam.
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [ ] 3.2 Ponto de conferência do grupo 3
    - Rode `npm test -w @conexus/hub-api`, `npm run typecheck`, os testes de tela dos arquivos de fixture tocados, `npm run check` e `npm run quality`.
    - Passos 6 e 7 da skill `conexus-build`: pstack `deslop` e `no-comments`; a mutação de 3.1.
    - O PR diz qual verbo muda (Descrever), o que a pessoa vê (a descrição e a coluna inativa) e traz o exemplo `sankhya_vendas` (`dados.md:74-75`).
    - A CI roda `npm run check` (com `openapi`, que emite a mudança de `CopyShown`) e os testes do contrato.

- [ ] 4. Grupo 4: o catálogo no servidor (um PR; depende dos grupos 2 e 3 no `main`)
  - [ ] 4.1 As portas de cópias e de conectores que o catálogo lê (um commit)
    - **Arquivos:** `apps/server/src/hub/copies/catalog-view.ts` (novo), `apps/server/src/hub/copies/list.ts`, `apps/server/src/hub/copies/service.ts`, `apps/server/src/hub/connectors/catalog-systems.ts` (novo), `apps/server/src/hub/connectors/catalog-subjects.ts`, `apps/server/src/hub/connectors/public.ts`, `apps/server/src/hub/copies/catalog-view.test.ts` (novo).
    - **Referência a seguir:** `projectView` em `apps/server/src/hub/copies/project-view.ts:92-128` (uma leitura que não admite ninguém, sobre `projectCopyRows` de `list.ts:221-235`); `runOf` e `copySources` em `list.ts:37-58` e `:107-116`; `operationsOf` e `EFFECT_OF` em `catalog-subjects.ts:4-9`; a leitura das conexões `ACTIVE` com `usable` (`apps/server/src/hub/connectors/rows.ts:72`) e `connectionNamesOf` (`copy-sources.ts:99-111`); o objeto que `createConnectors` devolve em `public.ts:144-167`.
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // list.ts: exporte runOf e copySources
      // catalog-view.ts
      /** The copies a place reads, as the catalog states them; admits nobody: the caller did, in its transaction (code C8). */
      export async function catalogTables(deps: CopiesDeps, tx: ReadTx, input: { companyId: CompanyId; only: 'ALL' | { projectId: ProjectId } }): Promise<CatalogTable[]>
      //  rows = only === 'ALL' ? select from copy where company : projectCopyRows(tx, ...).filter(granted)
      //  lastRun: as linhas de copyRun de cada lastRunId, por runOf (a última que terminou, contrato company-data.ts:37-38)
      //  sources: copySources(tx, companyId, ids); uma cópia sem fonte viva fica fora (ela está terminando, leave.ts endedSourceless)
      //  cada uma: shown = shownOf(copy.connectorId, copy.definition, copy.columnState)
      //    { name, label, description: shown.description ?? copy.label, columns: shown.columns,
      //      kept: { kind: 'COPY', connections: sources.map(s => s.connection.id), source: shown.source, lastRun } }
      /** One page of a copy's table by its name; admits nobody: the catalog decided the place reads it. */
      export async function tableRowsByName(deps: CopiesDeps, input: { companyId: CompanyId; name: string; limit: number; signal: AbortSignal }): Promise<TableRead | { kind: 'NO_COPY' }>
      //  stored = database.read(companyScope) select copy where companyId and name; ausente -> NO_COPY; senão readCopyTable (unidade 2.2)
      // service.ts: data: Object.freeze({ catalogTables: (tx, input) => catalogTables(full, tx, input), tableRows: (input) => tableRowsByName(full, input) })
      // catalog-subjects.ts: export function systemOf(connector: Connector, row: { id: ConnectionId; name: string }): CatalogSystem
      //  reads = operationsOf(connector).filter(op => op.class === 'read').map(op => ({ operation: op.id, label: op.label, summary: op.summary }))
      //  actions = (connector.writes ?? []).map(op => ({ ..., effect: EFFECT_OF[op.class] }))
      // catalog-systems.ts
      export async function catalogSystemsOf(deps: Pick<Deps, 'catalog' | 'log'>, tx: ReadTx, scope: SessionScope): Promise<CatalogSystem[]>
      //  as conexões que o lugar oferece: offeredIn(tx, idsOf(scope)), importado de ./builder-port.ts (definido em builder-port.ts:139; a chamada de molde é assistant-port.ts:140-143) (empresa: as usáveis; Projeto: as usáveis liberadas a ele; decisão `L5`), por nome; uma de conector que o kit não tem: deps.log.error({ companyId, connector }, 'DATA_CONNECTOR_UNKNOWN') e fica fora
      // public.ts, no objeto de createConnectors: catalogSystems: (tx, scope) => catalogSystemsOf(routeDeps, tx, scope)
      ```
    - **Testes:** `catalog-view.test.ts`, pela porta de `copiesOn` (`hub.copies` e `hub.connectors` do Hub de teste, `apps/server/src/hub/identity/test-hub.ts:104-131`):
      - "as tabelas da empresa com descrição, rótulo e última rodada terminada": ligar `vendas` e `clientes`, rodar uma; `lastRun` é a terminada e `null` na outra.
      - "as tabelas de um Projeto são as liberadas": liberar só `sankhya_clientes` (`on.copies.grant`, molde `grants.test.ts:55-57`).
      - "a descrição ausente vira o rótulo": tirar a descrição com `plantCopy` sem rodar.
      - "os sistemas da empresa": a Matriz com as leituras do Sankhya e nenhuma ação de leitura entre as ações.
      - "uma página de uma tabela pelo nome": `tableRows({ name: 'sankhya_vendas', limit: 200 })` e `NO_COPY` para um nome que não existe.
    - **Mutações à mão:** tirar o filtro `granted` faz "as tabelas de um Projeto" falhar; trocar `?? copy.label` por `?? ''` faz "a descrição ausente" falhar; usar a rodada aberta no lugar de `lastRunId` faz o primeiro caso falhar.
    - **Pronto quando:** `catalog-view.test.ts` passa.
    - _Requisitos: 6.1, 6.2, 6.3, 6.5_
  - [ ] 4.2 A pasta `hub/data` com `catalogOf`, `rowsOf` e `createCompanyData` (um commit)
    - **Arquivos:** `apps/server/src/hub/data/public.ts` (novo), `apps/server/src/hub/data/catalog.ts` (novo), `apps/server/src/hub/data/rows.ts` (novo), `apps/server/src/hub/data/data.test.ts` (novo), `apps/server/src/main.ts`, `apps/server/src/hub/identity/test-hub.ts`, `.dependency-cruiser.cjs`, `docs/steps/trilhas/dados.md`.
    - **Referência a seguir:** `companyData` em `packages/hub-api/src/company-data.ts:214-250`; o `catch` que só mapeia `DATABASE_UNAVAILABLE` em `project-view.ts:108-112`; a criação dos assuntos em `apps/server/src/main.ts:193-208` (`createConnectors` em `:193-197`, `createCopies` em `:198-204`, o objeto devolvido em `:205-208`); a constante `DATA` em `.dependency-cruiser.cjs:20`; a lista do que a trilha possui em `docs/steps/trilhas/dados.md:31-35`.
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // public.ts
      export type DataDeps = {
        database: Database; identity: IdentityPorts; log: FailureLog
        connectors: () => Pick<Connectors, 'catalogSystems'>
        copies: () => CopyService['data']
      }
      /** The access contract bound to who asks and where (`SessionScope` of hub/connectors/public.ts). */
      export function createCompanyData(deps: DataDeps): (scope: SessionScope) => CompanyData {
        return (scope) => companyData({ sources: sourcesFor(deps, scope), now: () => new Date() })
      }
      //  sourcesFor: { catalog: ({ signal }) => catalogOf(deps, scope), rows: ({ table, signal }) => rowsOf(deps, scope, { table, signal }),
      //               live: async () => ({ kind: 'NOT_GRANTED' }), funnel: async () => ({ kind: 'NOT_GRANTED' }) }   // parte 3 (design.md, `C7`)
      // catalog.ts
      export async function catalogOf(deps: DataDeps, scope: SessionScope): Promise<Described>
      //  try database.read(personScope, async tx => {
      //    proof = await deps.identity.admitMember({ tx, companyId, personId, action: 'readCompany' })
      //    systems = await deps.connectors().catalogSystems(tx, scope)
      //    tables = scope.place.kind === 'PROJECT' ? catalogTables(tx, { companyId, only: { projectId } })
      //           : deps.identity.allows(proof.role, 'readCopyRows') ? catalogTables(tx, { companyId, only: 'ALL' }) : []
      //    return { kind: 'CATALOG', systems, tables } })
      //  catch: Failure DATABASE_UNAVAILABLE -> logFailure(deps.log, error, { companyId }, 'DATA_CATALOG_FAILED'); { kind: 'CATALOG_UNAVAILABLE' }; outro -> throw
      // rows.ts
      export async function rowsOf(deps: DataDeps, scope: SessionScope, a: { table: CatalogTable; signal?: AbortSignal }): Promise<Page>
      //  read = await deps.copies().tableRows({ companyId, name: a.table.name, limit: TABLE_PAGE_ROWS, signal: a.signal ?? AbortSignal.timeout(APP_CALL_LIMITS.transactionTimeoutMs) })
      //  ROWS -> { kind: 'ROWS', rows: read.rows.map(r => Object.fromEntries(read.columns.map((c, i) => [c, r[i]]))), complete: read.complete }
      //  NO_TABLE | NO_COPY | UNAVAILABLE -> deps.log.error({ companyId, table: a.table.name, reason }, 'DATA_ROWS_FAILED'); { kind: 'TABLE_UNAVAILABLE' }
      // main.ts, depois de createCopies (:204)
      const data = createCompanyData({ database, identity, log, connectors: () => connectors, copies: () => copies.data })
      //  e `data` entra no objeto devolvido em :205-208
      // test-hub.ts: data: subjects.data no objeto devolvido
      // .dependency-cruiser.cjs:20: hub/(connectors|copies|ontology|data)/
      // dados.md:32: `apps/server/src/hub/data/` entra na lista
      ```
      Nenhum consumidor chama `createCompanyData` nesta parte. A trilha Agentes e Apps o liga depois, em PR próprio (`dados.md:78`).
    - **Testes:** `data.test.ts`, pela porta `on.hub.data` com `copiesOn`:
      - "descrever na empresa: o dono vê as cópias, o desenvolvedor e o membro não": `describe()` com `place: { kind: 'COMPANY' }`.
      - "descrever num Projeto: só as liberadas" e o exemplo do `design.md` (Projeto do CRM com `sankhya_clientes` liberada).
      - "toda tabela do catálogo traz descrição": `Catalog.parse` da resposta e `description.length > 0`.
      - "ler uma tabela devolve 200 linhas e a marca de que há mais": plantar mais de 200 linhas como `asSync`; `read({ kind: 'TABLE', table: 'sankhya_vendas' })` dá 200 e `complete: false`.
      - "o Hub calado dá CATALOG_UNAVAILABLE": `t.mock.method` em `on.hub.test.database`, `read`, lançando `new Failure('DATABASE_UNAVAILABLE')`; o log tem `DATA_CATALOG_FAILED`.
      - "o banco da empresa calado dá TABLE_UNAVAILABLE e não lê ao vivo": `readCopies` com `UNAVAILABLE`; o log tem `DATA_ROWS_FAILED`.
      - "a tabela antes da primeira rodada dá TABLE_UNAVAILABLE": `DROP TABLE` como `asSync`; o log tem `DATA_ROWS_FAILED` com o motivo `NO_TABLE`.
      - "ao vivo e ação respondem NOT_GRANTED".
      - A conformidade inteira (`runDataConformance`) não roda contra esta implementação: as leis de leitura ao vivo pedem `live`, que é da parte 3 (`design.md`, "As leis de conformidade desta parte", lei 4).
    - **Mutações à mão:** trocar o filtro de lugar por `'ALL'` faz "num Projeto: só as liberadas" falhar; trocar `TABLE_PAGE_ROWS` por `TABLE_PAGE_ROWS + 1` no `limit` faz "200 linhas" falhar; tirar o `catch` faz "o Hub calado" falhar.
    - **Pronto quando:** `data.test.ts` passa e `npm run deps` passa com a pasta nova.
    - _Requisitos: 6.2, 6.3, 6.4, 6.6, 6.7, 6.8, 6.9_
  - [ ] 4.3 Ponto de conferência do grupo 4
    - Rode `catalog-view.test.ts`, `data.test.ts`, `npm run deps`, `npm run knip`, `npm run check` e `npm run quality`.
    - Passos 6 e 7 da skill `conexus-build`: pstack `deslop` e `no-comments`; as mutações de 4.1 e 4.2.
    - Linha da tabela de referência no PR: "Catálogo" (embrulhado: junta o que o Hub já guarda), com `catalog-view.ts` e `hub/data/catalog.ts`.
    - A CI roda `npm run check` (com `deps` e `knip`) e os shards do servidor.

- [ ] 5. Grupo 5: a página Dados (um PR; depende do grupo 2 no `main`)
  - [ ] 5.1 A lista por camada e por sistema, o trilho e o redirecionamento (telas `p1-01`, `p1-07` a `p1-10`) (um commit)
    - **Arquivos:** `apps/web/src/routes/_app/companies/$companyId/data.index.tsx` (novo), `apps/web/src/routes/_app/companies/$companyId/copies.index.tsx`, `apps/web/src/routes/_app/companies/$companyId/route.tsx`, `apps/web/src/hub/copies/search.ts` (novo), `apps/web/src/hub/copies/data-page.tsx` (novo), `apps/web/src/hub/copies/copy-list.tsx`, `apps/web/src/hub/copies/public.ts`, `apps/web/src/hub/copies/text.ts`, `apps/web/src/hub/projects/project-copies.tsx`, `apps/web/src/hub/copies/test-hub.tsx`, `apps/web/src/hub/copies/copy-list.test.tsx`, `apps/web/src/hub/copies/data-page.test.tsx` (novo), `apps/web/src/routeTree.gen.ts` (gerado pelo plugin do TanStack Router ao rodar a tela; o commit o leva), `apps/web/frame.layout.test.ts`, `apps/web/focus.layout.test.ts`, `apps/web/sweep-copies-states.ts`, `docs/reference/screens.md`, `docs/guides/web.md`.
    - **Referência a seguir:** a página de hoje, `CopyList` (`copy-list.tsx:400-420`) e `Copies` (`:361-398`); as abas no endereço de `apps/web/src/hub/projects/area.tsx:48-64` com o enum de `hub/projects/search.ts:4`; a busca `Search` e `matches` de `apps/web/src/builder/assistant/choice-list.tsx:21-26`; o redirecionamento de `routes/_app/companies/$companyId/projects/$projectId.index.tsx:16`; o item do trilho em `route.tsx:87-95`; `Empty` e `ReadFailure` de `apps/web/src/ui/states.tsx` e `Skeleton` de `apps/web/src/ui/skeleton.tsx`; as conexões de `connectionsQuery` e `connectorName` (`hub/copies/source.ts:3`); o protótipo `p1-01` do escopo.
    - **O que sai:** o export `CopyList` e o título `COPIES_TITLE`; a rota `copies.index.tsx` deixa de montar a página e só redireciona; o item **Cópias** do trilho; o texto "na página Cópias" de `MANAGERS_ENABLE` (`text.ts:45`).
    - **O que entra:**
      ```ts
      // search.ts
      export const DataLayer = z.enum(['raw', 'business', 'apps'])
      export const DataSearch = z.object({ layer: DataLayer.optional().catch(undefined), q: z.string().optional().catch(undefined) })
      // data.index.tsx: createFileRoute('/_app/companies/$companyId/data/')({ staticData: { place: 'Dados' },
      //   beforeLoad: manageCopiesOrNotFound, validateSearch: DataSearch, loader: loadCopies, pendingComponent: Loading,
      //   errorComponent: DataReadFailure, component: () => <DataPage companyId layer={layer ?? 'raw'} q /> })
      // copies.index.tsx: beforeLoad: ({ params }) => { throw redirect({ to: '/companies/$companyId/data', params }) }
      // route.tsx: <SidebarRailButton to="/companies/$companyId/data" params icon={DatabaseIcon} label="Dados" /> sob may.manageCopies
      // data-page.tsx: DataPage = PageTitle "Dados" + NewCopy + o texto de abertura + Tabs (Bruto <n> | Negócio 0 | Apps) no endereço
      //   raw -> <RawLayer> (copy-list.tsx); business -> <Empty> com os dois textos; apps -> unidade 5.3 (até lá a aba não aparece)
      // copy-list.tsx: RawLayer agrupa `copies` por sources[0].connection.connector, e cada grupo:
      //   cabeçalho `${connectorName(connectors, id)} · ${nomes das ligações} · ${n} tabelas`
      //   linha: CopyLink com o nome em mono, a descrição (shown.description ?? label), StateBadge, dayAndHour, linhas, intervalo, Projetos, CopyMenu
      //   as propostas abertas ficam no topo, como hoje (ProposalTableRow, copy-proposal.tsx:229)
      //   uma conexão ACTIVE de connectionsQuery sem cópia: o grupo com "Nenhuma tabela copiada"
      //   a busca filtra por nome, descrição e nome de coluna. matches (choice-list.tsx:21-23) só baixa a caixa,
      //   então search.ts ganha folded(text) = text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR')
      //   e a busca compara folded(campo).includes(folded(q.trim()))
      ```
      Os textos (em `text.ts`). Os que não estão no protótipo vêm marcados, e são os da nota `L4`:
      - `DATA_TITLE = 'Dados'`, `BACK_TO_DATA = 'Dados'`.
      - `DATA_INTRO = 'O que os agentes e os apps da empresa podem ler: cada tabela, de qual sistema veio, o que guarda e de quando é.'`
      - `RAW_INTRO = 'Cópia fiel de cada sistema. Atualiza sozinha no intervalo de cada tabela.'`
      - `SEARCH_TABLES = 'Buscar tabela ou coluna'`.
      - `NO_SYSTEM = 'Nenhum sistema ligado ainda'`, `NO_SYSTEM_HINT = 'Ligue um sistema da empresa, como o Sankhya, e as tabelas copiadas dele aparecem aqui.'`, `LINK_SYSTEM = 'Ligar um sistema'` (link para `/companies/$companyId/integrations`).
      - `NO_TABLE_COPIED = 'Nenhuma tabela copiada'` (texto proposto, `L4`).
      - `NO_CONCEPT = 'Nenhum conceito aprovado ainda'`, `CONCEPT_HINT = 'Um conceito é o significado de uma palavra do negócio, aprovado por uma pessoa da empresa, como "Venda". Quando o primeiro for aprovado, ele aparece aqui.'`
      - `CATALOG_FAILED = 'Não deu para ler o catálogo agora. Nada foi apagado. Tente de novo em instantes.'` no `ReadFailure` da lista e no `errorComponent` da rota (o botão **Tentar de novo** é o de `ui/states.tsx`).
      - `MANAGERS_ENABLE` passa a dizer "na página Dados".
      - As colunas da tabela: Tabela, Atualizada, Linhas, Intervalo, Projetos (decisão `L2` para **Quem lê**).
      - `project-copies.tsx:72` passa a apontar para `/companies/$companyId/data`.
      - `docs/reference/screens.md:23`: a linha vira "Dados, Bruto ..." com o endereço `/companies/<c>/data`; `docs/guides/web.md:133` (`W30`) troca **Cópias** por **Dados**.
    - **Testes:** `data-page.test.tsx`, montado por `openCopies` (`hub/copies/test-hub.tsx:291`, com `LIST` passando a `/companies/<c>/data`), molde `copy-list.test.tsx:16-113`:
      - "Dados: o trilho mostra o item ao dono e ao desenvolvedor" e "o membro não tem o item e o endereço dá não encontrado".
      - "Dados: a camada Bruto agrupa por sistema" (duas cópias da Matriz e o cabeçalho "Sankhya · Matriz · 2 tabelas").
      - "Dados: a linha mostra a descrição, ou o rótulo".
      - "Dados: a busca acha pela coluna" (`NUNOTA` acha `sankhya_vendas`) e "a busca não liga para acento" (`devolucoes` acha a cópia de descrição "Devoluções").
      - "Dados: nenhum sistema ligado" e "um sistema sem cópia".
      - "Dados: a falha de leitura e Tentar de novo" (molde `copy-list.test.tsx:109`).
      - "Dados: a camada Negócio vazia" e "a camada fica no endereço" (`?layer=business` abre Negócio).
      - "Cópias leva a Dados": abrir `/companies/<c>/copies` mostra o título **Dados**.
      - `copy-list.test.tsx`: as expectativas de título e de trilho passam a **Dados**. `frame.layout.test.ts:104`, `focus.layout.test.ts:67` e `sweep-copies-states.ts:15` trocam **Cópias** e `/copies` por **Dados** e `/data`.
    - **Mutações à mão:** tirar o agrupamento faz "agrupa por sistema" falhar; tirar o nome de coluna da busca faz "a busca acha pela coluna" falhar; trocar `folded` por `toLocaleLowerCase` faz "a busca não liga para acento" falhar; tirar o `throw redirect` faz "Cópias leva a Dados" falhar.
    - **Pronto quando:** `npm run test:unit -w @conexus/web -- src/hub/copies` passa e o Hub local mostra **Dados** no trilho com a camada Bruto agrupada.
    - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12, 8.13, 8.14_
  - [ ] 5.2 A página da tabela com Colunas, Amostra e Rodadas e o aviso de coluna inativa (telas `p1-02` a `p1-05`) (um commit)
    - **Arquivos:** `apps/web/src/routes/_app/companies/$companyId/data.$copyId.tsx` (novo), `apps/web/src/routes/_app/companies/$companyId/copies.$copyId.tsx`, `apps/web/src/hub/copies/search.ts`, `apps/web/src/hub/copies/copy-detail.tsx`, `apps/web/src/hub/copies/copy-sample.tsx` (novo), `apps/web/src/hub/copies/queries.ts`, `apps/web/src/hub/copies/public.ts`, `apps/web/src/hub/copies/text.ts`, `apps/web/src/hub/copies/test-hub.tsx`, `apps/web/src/hub/copies/copy-detail.test.tsx`, `apps/web/src/hub/copies/run-follow.test.tsx`, `apps/web/src/hub/copies/copy-sample.test.tsx` (novo), `apps/web/src/routeTree.gen.ts` (gerado).
    - **Referência a seguir:** `CopyDetail` em `copy-detail.tsx:121-199`, `ColumnList` em `:32-44` e `Runs` em `:72-112`; `copyRunsQuery` em `queries.ts:70`; os handlers com estado de `copiesHub` em `test-hub.tsx:197-263`; `Alert` de `apps/web/src/ui/alert.tsx:16`; `Badge` de `ui/badge.tsx`; `dayAndMonth` de `platform/dates.ts`; `Skeleton` de `apps/web/src/ui/skeleton.tsx`; os protótipos `p1-02` a `p1-05` do escopo.
    - **O que sai:** a seção "O que é copiado" de `copy-detail.tsx:168-185` (ela vira a aba Colunas e o painel ao lado); a condição `origin.source.kind === 'OPERATION'` que esconde as colunas da versão 1 (`:184`); o conteúdo de `copies.$copyId.tsx`, que só redireciona para `/data/$copyId` com a mesma busca.
    - **O que entra:**
      ```ts
      // search.ts
      export const TableTab = z.enum(['columns', 'sample', 'runs'])
      export const TableSearch = z.object({ tab: TableTab.optional().catch(undefined), page: z.string().optional().catch(undefined) })
      // queries.ts
      export function copySampleQuery(companyId: CompanyId, copyId: CopyId) { return hubQuery(sampleCopy, { params: { companyId, copyId } }) }
      // copy-detail.tsx: título = copy.name (mono), StateBadge, "<sistema> · a cada <intervalo>", RunNowButton e CopyMenu como hoje
      //   Tabs no endereço: Colunas | Amostra (só se may.readCopyRows) | Rodadas
      //   aviso no topo quando alguma coluna tem inactiveSince: <Alert> com INACTIVE_NOTICE e o link "Ver a rodada" para tab=runs
      //   Colunas: Table Coluna | Tipo | O que guarda; a marca "Chave" (copy.shown.key) e "Inativa desde <dd/mm>"
      //   painel: Sistema, Ligação, Chave, Modo (modeText), Intervalo, Última rodada, Linhas, Camada "Bruto"
      //   Rodadas: <Runs> de hoje, com o Pager
      // copy-sample.tsx: useQuery(copySampleQuery); pendente -> Skeleton; erro -> ReadFailure(sentenceOf(error), refetch)
      //   rows vazio -> "A cópia ainda não tem linhas."; senão SAMPLE_INTRO, a Table e, se !complete, SAMPLE_MORE
      ```
      Os textos (em `text.ts`):
      - `TYPE_LABEL = { bigint: 'Número', numeric: 'Valor', text: 'Texto', date: 'Data', timestamp: 'Data e hora' }`; `boolean: 'Sim ou não'` e `json: 'Estrutura'` (`L4`).
      - `KEY_MARK = 'Chave'`, `inactiveMark(since) = \`Inativa desde ${dayAndMonth(since)}\``.
      - `inactiveNotice(system, names, since) = \`O ${system} parou de enviar a coluna ${names} desde ${dayAndMonth(since)}. Ela fica aqui, inativa, e nada foi apagado.\`` (com duas ou mais: "as colunas A e B ... Elas ficam aqui, inativas"), `SEE_RUN = 'Ver a rodada'` (texto proposto, `L4`).
      - `SAMPLE_INTRO = 'Cinco linhas da cópia.'`, `SAMPLE_MORE = 'A cópia tem mais linhas que estas cinco.'`, `SAMPLE_EMPTY = 'A cópia ainda não tem linhas.'` (decisão `L4`).
      - As abas: `Colunas`, `Amostra`, `Rodadas`. Os nomes do painel: `Sistema`, `Ligação`, `Chave`, `Modo`, `Intervalo`, `Última rodada`, `Linhas`, `Camada`.
    - **Testes:** `copy-sample.test.tsx` e `copy-detail.test.tsx`, montados por `openCopies` com `detailOf` (`test-hub.tsx:286`) e um handler novo de `GET .../sample` em `copiesHub` (o corpo validado por `sampleCopy.success.body.parse`):
      - "a tabela abre em Colunas com tipo, chave e descrição", inclusive numa cópia da versão 1.
      - "a aba Amostra mostra cinco linhas e a marca de que há mais" (dono) e "o desenvolvedor não vê a aba Amostra" (`role = 'developer'`, `mayOf` de `platform/test-may.ts`).
      - "a amostra vazia" e "a amostra que falha tem Tentar de novo" (`refusal('COPY_DATABASE_UNAVAILABLE')`, `platform/test-hub.tsx:248`).
      - "a coluna inativa: o aviso no topo e a marca na coluna" (uma coluna com `inactiveSince`).
      - "a aba fica no endereço" (`?tab=runs` abre Rodadas) e "o endereço antigo leva à tabela".
      - `copy-detail.test.tsx` e `run-follow.test.tsx`: as rodadas passam a ser a aba Rodadas; os casos de hoje (`copy-detail.test.tsx:11`, `:51`, `:58`, `:64`) seguem com `?tab=runs`.
    - **Mutações à mão:** tirar `may.readCopyRows` da condição da aba faz "o desenvolvedor não vê" falhar; tirar `!complete` faz "a marca de que há mais" falhar; tirar o filtro de `inactiveSince` do aviso faz o caso da coluna inativa falhar.
    - **Pronto quando:** `npm run test:unit -w @conexus/web -- src/hub/copies` passa e o Hub local mostra as três abas de `sankhya_vendas`.
    - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_
  - [ ] 5.3 A camada Apps (tela `p1-06`) (um commit)
    - **Arquivos:** `apps/web/src/hub/copies/apps-layer.tsx` (novo), `apps/web/src/hub/copies/data-page.tsx`, `apps/web/src/hub/copies/text.ts`, `apps/web/src/hub/copies/apps-layer.test.tsx` (novo).
    - **Referência a seguir:** `DataPage` e `listOf` do Projeto em `apps/web/src/hub/apps/data.tsx:102-159` (o que é tabela do app e o "indisponível" de `countText`, `:19-31`); `appTablesQuery` de `hub/apps/public.ts:8`; `projectsQuery` de `hub/projects/public.ts:11` (`publishedVersion` e `appVersion` em `packages/hub-api/src/projects.ts:19-27`); as fixtures de `apps/web/src/hub/apps/test-data.tsx` (`server`, `PROJECT`, `TABLES`); o protótipo `p1-06` do escopo; `Skeleton` de `apps/web/src/ui/skeleton.tsx`.
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // apps-layer.tsx
      export function AppsLayer({ companyId }: { companyId: CompanyId })
      //  projects = projectsPagedQuery(companyId) de hub/projects/queries.ts:25-36, com o botão Mais (decisão `L8`); os que têm appVersion !== null
      //  useQueries(projects.map(p => appTablesQuery(companyId, p.id))); NO_APP fica fora; schema 'COPY' fica fora (já está em Bruto)
      //  por Projeto: `${p.name} · ${n} tabelas` e o link "Abrir o Projeto" para /companies/$companyId/projects/$projectId/data
      //  cada tabela: nome em mono, versionText(p), countText(rows) (o "indisponível" do Projeto)
      //  pendente -> Skeleton; erro de um Projeto -> ReadFailure só no grupo dele; nenhum -> Empty APPS_EMPTY
      // data-page.tsx: a aba Apps aparece e mostra <AppsLayer>
      ```
      Os textos: `APPS_INTRO = 'As tabelas que cada app guarda. Elas são do Projeto e ficam aqui só para leitura.'`, `OPEN_PROJECT = 'Abrir o Projeto'`, `versionText = publishedVersion !== null ? \`Publicado · v${publishedVersion}\` : \`Em construção · v${appVersion}\``, `APPS_EMPTY = 'Nenhum app guarda tabelas ainda.'` (decisão `L4`). As colunas: Tabela, Versão, Linhas.
    - **Testes:** `apps-layer.test.tsx`, montado por `openCopies` com `?layer=apps` e os handlers de `listProjects` e `listAppTables` (molde `hub/apps/data.test.tsx:34-62`):
      - "Apps: as tabelas por Projeto, com a versão e as linhas" (CRM publicado v3, Acompanhamento em construção v1).
      - "Apps: um Projeto sem app não aparece", "nenhum app", "a contagem indisponível" e "Abrir o Projeto leva à página Dados do Projeto".
    - **Mutações à mão:** trocar a condição de `versionText` faz o primeiro caso falhar; tirar o filtro `NO_APP` faz "sem app não aparece" falhar.
    - **Pronto quando:** `npm run test:unit -w @conexus/web -- src/hub/copies/apps-layer.test.tsx` passa.
    - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [ ] 5.4 Ponto de conferência do grupo 5
    - Rode `npm run test:unit -w @conexus/web`, `npm run test:browser -w @conexus/web` e `npm run test:sweep -w @conexus/web` (os estados de `sweep-copies-states.ts`), `npm run check` e `npm run quality`.
    - Passos 6 e 7 da skill `conexus-build`: olhe cada tela num navegador real a 1366 e 390 px, nos dois temas (testing T23, `references/screen.md` da skill); pstack `deslop` e `no-comments`; as mutações de 5.1, 5.2 e 5.3.
    - Linha da tabela de referência no PR: "Página Dados" (nativo, as peças de `apps/web/src/ui/`: `tabs.tsx`, `table.tsx`, `states.tsx`, `alert.tsx`, `badge.tsx`).
    - A CI roda `npm run check`, os testes de tela, os de navegador e o `sweep`.

- [ ] 6. A QA das telas da parte 1 (sem PR; skill `conexus-qa`, testing T25)
  - [ ] 6.1 Um agente que não construiu percorre as telas `p1-01` a `p1-10` no commit candidato do grupo 5
    - O Hub local com os dublês do Sankhya e do Mercado Livre, a empresa Lume do exemplo, a 1366 e 390 px e nos dois temas. As perguntas com resposta conhecida do `design.md` são o roteiro. Cada captura ao lado do protótipo do quadro.
    - A tela `p1-11` (o membro) não entra: é da parte 4.
    - **Pronto quando:** o relatório da QA está no PR do grupo 5, com o que viu, leu e não provou.
    - _Requisitos: 8.1 a 8.14, 9.1 a 9.8, 10.1 a 10.5_

## Notas

**Por que o grupo 0 existe.** As unidades 1.3 e 2.3 escrevem `definition` e `column_state` em `copies.copy`, e hoje o login do Hub só atualiza as colunas de `apps/server/database-grants.sql:373-381`. Mudar a lista de permissões é um PR próprio com a palavra do fundador (data D11), no molde dos PRs `07548622` e `34cd7136`. Por isso o pedido de cinco grupos virou sete: o grupo 0 e a QA.

**Por que o grupo 4 não segue a divisão pedida.** O pedido punha `catalogOf` e `createCompanyData` na unidade (a) e `rowsOf` na (b). `createCompanyData` precisa de `rows` para montar as fontes, e um `rows` provisório na unidade (a) seria uma forma temporária, que a skill `conexus-build` (passo 3) proíbe. A unidade 4.1 faz as portas que o catálogo lê, e a 4.2 faz a pasta inteira.

**Lacunas que pedem decisão.** Cada uma para a unidade que a toca.

- **`L1`, decidida.** `CGC_CPF` recebe a descrição "CPF ou CNPJ do parceiro. Retido em toda leitura." nesta parte (`design.md`, "As descrições das cinco cópias do Sankhya"). A coluna sai da cópia na parte 4 (decisão E5a).
- **`L2`, decidida.** O protótipo `p1-01` tem a coluna **Quem lê**, e `p1-02` tem as abas **Quem lê** e **Leituras**. As três dependem da parte 4, que as constrói. Esta parte mantém a coluna **Projetos** de hoje e não cria as abas.
- **`L3`, decidida.** O protótipo traz o botão **Ligar um sistema** no topo. A janela de ligar é da parte 2, que troca o botão. Esta parte mantém **Ligar uma cópia** (`NewCopy`) no topo e usa **Ligar um sistema** só no estado vazio, como link para Integrações.
- **`L4`, textos propostos.** Nenhum protótipo traz "A cópia tem mais linhas que estas cinco.", "A cópia ainda não tem linhas.", "Nenhum app guarda tabelas ainda.", "Nenhuma tabela copiada", "Ver a rodada" nem o rótulo dos tipos `boolean` ("Sim ou não") e `json` ("Estrutura"). O construtor usa estes, e o PR os lista para a aprovação do fundador no fim da etapa, como `text.ts:11` já diz.
- **`L5`, decidida.** No lugar `PROJECT`, o catálogo lista só as conexões `ACTIVE` liberadas ao Projeto, como o Assistente de um Projeto já escolhe (`C21` de `hub/connectors/scope.ts:5`). No lugar `COMPANY`, lista todas as `ACTIVE` da empresa. `catalogSystems` recebe o `SessionScope` e lê `offeredIn(tx, idsOf(scope))`, importado de `./builder-port.ts` (definido em `apps/server/src/hub/connectors/builder-port.ts:139`; `assistant-port.ts:140-143` mostra a chamada), e o teste da 4.2 cobre os dois lugares.
- **`L6`, decidida.** A aba **Amostra** aparece só para dono e administrador. A unidade 2.2 acrescenta `readCopyRows` a `CompanyMay` (`packages/hub-api/src/roles.ts:47`), no molde dos outros campos. É o contrato das telas, e não `company-data.ts`, então não pede a issue `contrato`.
- **`L7`, decidida (`D19` do índice).** A unidade 3.1 muda `CopyShown`, que o servidor produz e as telas leem. O PR do contrato leva, além do contrato e da conformidade, só as linhas `inactiveSince: null` que fazem o repositório compilar: `shownOf` em `store.ts`, `routes.test.ts:158` e `:268`, `builder/app-data/context.test.ts:33` e as fixtures de `apps/web`. É uma exceção registrada à regra de `dados.md:76-77`. O grupo do contrato tem uma unidade de commit e o ponto de conferência, outra exceção registrada à regra de duas ou três unidades: o contrato é uma mudança só. O corpo do PR lista essas linhas. A regra de `docs/steps/trilhas/dados.md:76` existe para o PR do contrato não carregar comportamento, e estas linhas não carregam.
- **`L8`, decidida.** A camada Apps lê os Projetos pela consulta paginada que a página Projetos já usa (`projectsPagedQuery`, `apps/web/src/hub/projects/queries.ts:25-36`), com o botão **Mais** dela no fim da lista. Nenhuma página é lida sem o toque.

**Correções feitas no `design.md`.** Listadas no relatório final da redação desta parte.

## Grafo de dependência das tarefas

```json
{
  "waves": [
    { "id": 0, "tasks": ["0.1", "3.1"] },
    { "id": 1, "tasks": ["0.2", "3.2"] },
    { "id": 2, "tasks": ["0.3"] },
    { "id": 3, "tasks": ["1.1"] },
    { "id": 4, "tasks": ["1.2"] },
    { "id": 5, "tasks": ["1.3"] },
    { "id": 6, "tasks": ["1.4"] },
    { "id": 7, "tasks": ["2.1"] },
    { "id": 8, "tasks": ["2.2"] },
    { "id": 9, "tasks": ["2.3"] },
    { "id": 10, "tasks": ["2.4"] },
    { "id": 11, "tasks": ["4.1", "5.1"] },
    { "id": 12, "tasks": ["4.2", "5.2"] },
    { "id": 13, "tasks": ["4.3", "5.3"] },
    { "id": 14, "tasks": ["5.4"] },
    { "id": 15, "tasks": ["6.1"] }
  ]
}
```
