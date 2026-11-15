# Plano de implementação: parte 2, o conector, com a entrada conversada

## Visão geral

O plano tem nove grupos, cada um um PR com uma rodada de CI. Os grupos 1 a 6 são o bloco A e podem começar agora, salvo as esperas marcadas no título. Os grupos 7 a 9 são o bloco B, os primeiros sistemas comuns pelo login do kit (decisão do fundador, P3 do índice, registro 0069): os grupos 7 e 8 podem começar agora e fecham com o dublê na forma da referência, e só o grupo 9, a gravação dos corpos reais, espera dois atos do fundador, o app de login em cada sistema e uma conta de teste de cada um. O marco `D1` fecha depois do grupo 9. O bloco C não vira grupo: as Notas dizem o que espera o quê.

Base: `main` em `0d4c5730`. Todo caminho é relativo à raiz do repositório. A fonte das decisões é o `design.md` desta pasta, citado como `C1` a `C10`. A Nango e os modelos de integração são citados pelo commit: `nango@e6c6131` e `integration-templates@9afa0aab`.

## Como ler este plano

- Um grupo é um PR. Uma unidade é um commit. A última unidade de cada grupo é o ponto de conferência.
- Cada unidade segue a skill `.agents/skills/conexus-build/SKILL.md`: apagar antes de acrescentar (passo 3), testar pela porta pública (passo 5, testing T5), rodar e mutar à mão (passo 6, testing T27), um commit com `npm run check` verde (passo 7, delivery L9).
- Os testes do servidor rodam um arquivo por vez com `node scripts/test-run.ts --test-concurrency=1 --test-timeout=120000 <arquivo>` da raiz, depois de `npm ci` e `npm run build -w @conexus/server`. Os do kit, com `npm test -w @conexus/connectors`. Os do contrato, com `npm test -w @conexus/hub-api`. Os de tela, com `npm run test:unit -w @conexus/web`, e os de navegador com `npm run test:browser -w @conexus/web`.
- Nenhum teste da CI lê o Sankhya real, o HubSpot ou o Google. Os dublês respondem com corpos gravados (testing T29).
- As rodadas com serviço real são só três, fora da CI e autorizadas uma a uma: a gravação do HubSpot (9.1), a gravação do Gmail (9.2) e o uso de fechamento do `D1` (9.3).
- Os requisitos 9.1 a 9.8 não têm tarefa aqui. São do cartão da Entrada conversada, no PR 982 (Notas).
- Nenhum erro engolido: cada falha nomeada no pseudocódigo tem a resposta e a linha de log da tabela "Tratamento de erros" do desenho. Nenhum `catch` genérico.

## Tarefas

- [ ] 1. Grupo 1: o kit, a descrição, o "só ao vivo" e o que o sistema oferece (bloco A; a unidade 1.3 espera a descrição dos modelos da parte 1 e a saída de `CGC_CPF` da parte 4) (um PR)
  - [ ] 1.1 A descrição do sistema, `descriptorOf` (um commit)
    - **Arquivos:** `packages/connectors/src/kernel/descriptor.ts` (novo), `packages/connectors/src/kernel/descriptor.test.ts` (novo), `packages/connectors/src/kernel/auth.ts`, `packages/connectors/src/index.ts`.
    - **Referência a seguir:** `packages/connectors/src/kernel/definition.ts:42-71` (os campos do `Connector` que a descrição copia); `apps/server/src/hub/connectors/catalog-subjects.ts:12-28` (como os assuntos e a marca `door` saem do conector: a descrição carrega o mesmo); `packages/connectors/src/kernel/auth.ts:7-17` (o tipo `Fields`, hoje não exportado).
    - **O que sai:** nada. Esta unidade só acrescenta.
    - **O que entra:**
      ```ts
      // auth.ts: exportar o tipo que já existe
      export type Fields = Readonly<Record<string, Readonly<{ label: string; maxLength: number; help: ...; visible: boolean }>>>
      // descriptor.ts
      export type AccessForm =
        | Readonly<{ kind: 'FIELDS'; fields: Fields }>
        | Readonly<{ kind: 'SIGN_IN' }>
      export type DescribedOperation = Readonly<{
        id: string; label: string; summary: string; class: OperationClass; subject: string; door: boolean
      }>
      export type SystemDescriptor = Readonly<{
        id: ConnectorId; name: string; version: string; category: string; summary: string; logo: string
        perProject: 'one' | 'many'; subjects: Readonly<Record<string, string>>
        operations: readonly DescribedOperation[]   // a porta primeiro, depois operations (inProbeOrder, definition.ts:158-162); sem writes
        access: AccessForm
        liveOnly: boolean
      }>
      export function descriptorOf(connector: Connector): SystemDescriptor {
        const door = new Set(Object.values(connector.readDoor ?? {}).map((o) => o.id))
        const access: AccessForm = connector.auth.kind === 'client_credentials'
          ? { kind: 'FIELDS', fields: connector.auth.fields }
          : { kind: 'SIGN_IN' }
        return Object.freeze({ ...campos copiados..., operations: inProbeOrder(connector).map(...door.has(o.id)),
                               access, liveOnly: connector.liveOnly === true })
      }
      // index.ts: export { descriptorOf, type SystemDescriptor, type AccessForm } from './kernel/descriptor.ts'
      ```
      `connector.liveOnly` só existe depois da 1.2. Nesta unidade a linha é `liveOnly: false`, e a 1.2 a troca.
    - **Testes:** `descriptor.test.ts`, no molde de `packages/connectors/src/kernel/kernel.test.ts:69-77`. Casos: "a descrição do Sankhya traz os três campos colados e nenhum login" (`descriptorOf(sankhya)`: `access.kind === 'FIELDS'`, chaves `clientId`, `clientSecret`, `xToken`, e nenhuma chave `auth`, `origin`, `copy`, `check`); "a do Mercado Livre entra por autorização" (`access` igual a `{ kind: 'SIGN_IN' }`); "a porta vem marcada e as escritas ficam fora" (as leituras de `sankhyaDoor` com `door: true`, nenhum id de `sankhyaWrites`).
    - **Mutações à mão:** trocar `'client_credentials'` por `'oauth2_code'` no ternário de `access` (o caso do Sankhya falha); tirar o `door.has` (o caso da porta falha).
    - **Pronto quando:** `npm test -w @conexus/connectors` passa, e `descriptorOf(sankhya)` não tem nenhum campo que só o executor usa.
    - _Requisitos: 1.1_
  - [ ] 1.2 A declaração `liveOnly` e a recusa em `defineConnector` (um commit)
    - **Arquivos:** `packages/connectors/src/kernel/definition.ts`, `packages/connectors/src/kernel/descriptor.ts`, `packages/connectors/src/kernel/copy.test.ts`.
    - **Referência a seguir:** `packages/connectors/src/kernel/definition.ts:82-109` (onde as outras recusas ficam, cada uma um `throw new Error` com o id); `packages/connectors/src/kernel/copy.test.ts:146` (o teste "o kit recusa uma cópia mal declarada").
    - **O que sai:** a linha `liveOnly: false` da 1.1.
    - **O que entra:**
      ```ts
      // definition.ts, no tipo Connector, depois de `copy?`
      /** O sistema nunca é copiado: os agentes o consultam na hora. Um conector assim não declara `copy`. */
      liveOnly?: true
      // defineConnector, logo depois de PerProject.parse
      if (connector.liveOnly === true && connector.copy !== undefined)
        throw new Error(`Live-only connector declares copy: ${connector.id}`)
      // descriptor.ts
      liveOnly: connector.liveOnly === true
      ```
      Atualizar o comentário de `defineConnector` (`definition.ts:81`) com a recusa nova.
    - **Testes:** `copy.test.ts`, caso novo "o kit recusa um conector só ao vivo que declara cópia" (`assert.throws(() => defineConnector({ ...sankhya, liveOnly: true }), /Live-only/)`); em `descriptor.test.ts`, "um conector só ao vivo se declara na descrição" (`descriptorOf(defineConnector({ ...mercadoLivre, liveOnly: true })).liveOnly === true`).
    - **Mutações à mão:** trocar `&&` por `||` na recusa (o Sankhya, que declara `copy`, deixa de carregar); apagar a recusa (o caso novo falha).
    - **Pronto quando:** `npm test -w @conexus/connectors` passa e `npm run typecheck` passa.
    - _Requisitos: 2.2_
  - [ ] 1.3 O que o sistema oferece, `objectsOf` e `objectOf`, e as verificações 10 a 13 (um commit)
    - **Arquivos:** `packages/connectors/src/kernel/objects.ts` (novo), `packages/connectors/src/kernel/objects.test.ts` (novo), `packages/connectors/src/kernel/conformance-copy.ts` (novo), `packages/connectors/src/kernel/conformance.ts`, `packages/connectors/src/index.ts`.
    - **Referência a seguir:** `packages/connectors/src/kernel/copy.ts:56-83` e `:176-206` (o modelo `V1`, `CopyModel`, `PageInput`, `ConnectorCopy`); `packages/connectors/src/kernel/copy.ts:96-104` (`CANONICAL_CELL`, o texto de cada tipo); `packages/connectors/src/kernel/conformance-session.ts:92` (`signIn(connector, fake)`, o login das duas formas); `packages/connectors/src/sankhya/copy-read.test.ts:26-40` (uma página pela leitura da cópia contra o dublê); `packages/connectors/src/kernel/conformance.ts:213-256` (onde cada `it` entra); `packages/connectors/src/kernel/conformance-list.ts` (uma verificação em arquivo próprio).
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // objects.ts
      export type OfferedColumn = Readonly<{ name: string; type: CopyColumnType; description: string }>
      export type OfferedObject = Readonly<{
        id: CopyName; label: string; description: string
        key: readonly string[]; changedSince: string | null; columns: readonly OfferedColumn[]
      }>
      /** O que o sistema oferece para copiar: vazio num conector sem `copy`, o que inclui todo só ao vivo (1.2 recusa os dois juntos). */
      export function objectsOf(connector: Connector): readonly OfferedObject[] {
        if (connector.copy === undefined) return []
        return connector.copy.models.map(({ id, label, definition }) => ({
          id, label, description: definition.description ?? '',   // a descrição é da parte 1 (`C2` dela)
          key: definition.key, changedSince: definition.changedSince?.column ?? null,
          columns: definition.columns.map(({ name, type, description }) => ({ name, type, description: description ?? '' })),
        }))
      }
      export function objectOf(connector: Connector, id: string): OfferedObject | undefined
      // conformance-copy.ts
      export function assertOffered(connector: Connector): void            // 10, 11, 12
      export async function assertFirstPages(connector: Connector, fake: Fake): Promise<void>   // 13
      //  signIn(connector, fake) -> session; para cada modelo:
      //  requestOf(connector.copy.read, { definition, after: null, since: null, windowFrom: <hoje - window.days>, limit: 5 }, { ref: null }, SENT_AT)
      //  fake.handle(toRequest(connector, request, session.accessToken)) -> answerOf -> connector.copy.read.answer
      //  OK, rows.length > 0, e cada célula não nula casa CANONICAL_CELL[column.type]
      // conformance.ts: dois `it` novos ao fim de runConformance
      it('offers each table of its copies described, keyed and with the column that tells what changed', () => assertOffered(connector))
      it('answers the first page of each table it offers with a row in the types of its columns', () => assertFirstPages(connector, fake))
      ```
      A verificação 10 diz: com `copy` e sem `liveOnly`, `objectsOf` tem ao menos uma tabela; com `liveOnly`, nenhuma. A 11: `description.length > 0` na tabela e em cada coluna. A 12: `key.length > 0`, e `changedSince` nulo ou o nome de uma coluna. A 13 roda só onde `connector.copy` existe.
    - **Testes:** `objects.test.ts`: "o Sankhya oferece as cinco tabelas com a chave e DTALTER" (ids `clientes`, `vendedores`, `produtos`, `vendas`, `itens_venda`; `vendas.key` igual a `['NUNOTA']`; `changedSince === 'DTALTER'`); "o Mercado Livre não oferece nada"; "objectOf de um id que não existe é undefined"; "um conector com `copy` e nenhum modelo falha a verificação 10" (o Sankhya com `copy.models` vazio, montado sem `defineConnector`); "um dublê que responde a primeira página vazia falha a verificação 13" (`assertFirstPages` contra o dublê do Sankhya com as linhas de `vendas` tiradas). A conformidade nova roda em `packages/connectors/src/sankhya/sankhya.test.ts:13` e `packages/connectors/src/mercado-livre/mercado-livre.test.ts:18` sem mudança nesses arquivos.
    - **Mutações à mão:** trocar `rows.length > 0` por `>= 0` (o caso do dublê vazio falha); na verificação 10, trocar `objects.length > 0` por `>= 0` (o caso do conector sem modelo falha); tirar a conferência de `changedSince` entre as colunas.
    - **Pronto quando:** `npm test -w @conexus/connectors` passa com as treze verificações no Sankhya e no Mercado Livre. Espera: a descrição de `CopyDefinitionV1` e dos modelos do Sankhya (parte 1, `C2`) e a saída de `CGC_CPF` de `clientes` (parte 4, decisão E5a), sem as quais a verificação 11 falha no Sankhya.
    - _Requisitos: 3.3, 3.4_
  - [ ] 1.4 Ponto de conferência do grupo 1
    - Rodar `npm test -w @conexus/connectors`, `npm run typecheck`, `npm run check` e, em segundo plano, `npm run quality`.
    - Passo 6 da skill `conexus-build`: pstack `deslop`, pstack `no-comments`, as mutações à mão de 1.1 a 1.3, uma a uma, cada uma desfeita depois. Nenhuma pulada.
    - Passo 7: um commit por unidade, mantidos no merge.
    - Linhas da tabela de referência para o PR: "A descrição do sistema", nativo (uma função pura), `packages/connectors/src/kernel/descriptor.ts`; "Só ao vivo", nativo (um campo do conector), `definition.ts`; "As quatro operações", embrulhado, `objects.ts` e `conformance-copy.ts`.
    - A CI roda `npm run check` com `quality --fast` e os testes de todos os pacotes.

- [ ] 2. Grupo 2: o contrato de acesso diz "só ao vivo" (bloco A, PR que muda só o contrato e a conformidade, issue `contrato`) (um PR)
  - [ ] 2.1 `CatalogSystem.liveOnly` e o mundo falso (um commit)
    - **Arquivos:** `packages/hub-api/src/company-data.ts`, `packages/hub-api/src/company-data.test.ts`.
    - **Referência a seguir:** `packages/hub-api/src/company-data.ts:21-29` (`CatalogSystem`); `packages/hub-api/src/company-data.test.ts:12-46` (os três sistemas do mundo falso: dois `erp-falso` e um `correio-falso`); `docs/steps/trilhas/dados.md:60-66` (o PR de contrato muda só o contrato e o teste de conformidade).
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      export const CatalogSystem = z.object({
        connection: ConnectionId, connector: ConnectorId, name: z.string(),
        /** O sistema nunca é copiado: nenhuma tabela o tem como origem; os agentes o leem ao vivo. */
        liveOnly: z.boolean(),
        reads: ..., actions: ...,
      })
      // company-data.test.ts: liveOnly: false nos dois erp-falso, liveOnly: true no correio-falso
      ```
    - **Testes:** as catorze leis de hoje (`company-data-conformance.ts:260-303`) passam com o campo novo pelo `npm test -w @conexus/hub-api`.
    - **Mutações à mão:** trocar `z.boolean()` por `z.boolean().optional()` (a 2.2 tem de pegar: um sistema sem o campo passa a lei sem saber se é ao vivo).
    - **Pronto quando:** `npm test -w @conexus/hub-api` passa e `npm run typecheck` passa.
    - _Requisitos: 2.5_
  - [ ] 2.2 A lei nova: um sistema só ao vivo não é origem de tabela (um commit)
    - **Arquivos:** `packages/hub-api/src/company-data-conformance.ts`, `packages/hub-api/src/company-data.test.ts`.
    - **Referência a seguir:** `packages/hub-api/src/company-data-conformance.ts:113-125` (`describesSystemsAndTables`, uma lei que lê o catálogo); `:260-303` (a lista `LAWS`).
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      async function keepsLiveOnlyOutOfTables(world: DataWorld, data: CompanyData): Promise<void> {
        const catalog = await catalogOf(world)
        const live = catalog.systems.filter((system) => system.liveOnly)
        assert.ok(live.length > 0, 'a live-only system in the world')
        for (const system of live)
          for (const table of catalog.tables)
            assert.ok(!table.kept.connections.includes(system.connection), `${table.name} kept from ${system.name}`)
        assert.deepEqual(await data.describe(), catalog)
      }
      // LAWS: ['descreve o sistema só ao vivo com liveOnly e nenhuma tabela o tem como origem', keepsLiveOnlyOutOfTables]
      ```
    - **Testes:** a lei roda no mundo falso de `company-data.test.ts:146`. Um caso negativo no mesmo arquivo monta o mundo com uma tabela cuja `kept.connections` é a do `correio-falso` e confere que `keepsLiveOnlyOutOfTables` lança.
    - **Mutações à mão:** tirar o `!` da conferência (a lei falha no mundo bom); tirar `assert.ok(live.length > 0)` (o caso negativo continua pegando, e a revisão confere que o mundo tem o sistema).
    - **Pronto quando:** `npm test -w @conexus/hub-api` passa com quinze leis.
    - _Requisitos: 2.6_
  - [ ] 2.3 Ponto de conferência do grupo 2
    - Rodar `npm test -w @conexus/hub-api`, `npm run typecheck`, `npm run check`, `npm run quality` em segundo plano.
    - Passo 6 da skill `conexus-build`: `deslop`, `no-comments`, as mutações de 2.1 e 2.2. Passo 7: um commit por unidade.
    - Linha da tabela de referência: "Só ao vivo", nativo, `packages/hub-api/src/company-data.ts`.
    - O PR leva o rótulo `contrato` e nenhum consumidor. O `catalogOf` da parte 1 preenche o campo no grupo 3.
    - A CI roda `npm run check` e os testes de `packages/hub-api`.

- [ ] 3. Grupo 3: o Hub lê a descrição, as rotas do que o sistema oferece e a recusa da cópia ao vivo (bloco A, espera os grupos 1 e 2 e o `CopySample` da parte 1) (um PR)
  - [ ] 3.1 `ConnectorEntry` com `access` e `liveOnly`, e quem lê só a descrição (um commit)
    - **Arquivos:** `packages/hub-api/src/connectors.ts`, `packages/hub-api/src/project-connections.ts`, `apps/server/src/hub/connectors/connections.ts`, `apps/server/src/hub/connectors/catalog-subjects.ts`, `apps/server/src/hub/connectors/grants.ts`, `apps/web/src/hub/connectors/text.ts`, `apps/web/src/hub/connectors/link-dialog.tsx`, `apps/web/src/hub/connectors/integrations.tsx`, `apps/web/src/hub/connectors/connection-page.tsx`, `apps/web/src/hub/projects/project-integrations.tsx`, `apps/web/src/builder/agents/connections-section.tsx`, `apps/web/src/builder/assistant/day.tsx`, `apps/web/src/builder/conversation/connector-words.ts`, `apps/web/src/hub/connectors/fixtures.ts`, `apps/web/src/hub/connectors/test-hub.tsx`, `apps/web/src/platform/test-kit.ts`, `apps/web/src/builder/assistant/test-hub.tsx`, e o `catalogOf` da parte 1, se já estiver no `main`.
    - **Referência a seguir:** `apps/server/src/hub/connectors/connections.ts:40-55` (`entryOf` de hoje); `apps/server/src/hub/connectors/catalog-subjects.ts:12-28` (`subjectsOf`); `apps/server/src/hub/connectors/grants.ts:86-89` (o conector no contrato do Projeto); `packages/hub-api/src/connectors.ts:51-73` (`ConnectorEntry`); `packages/hub-api/src/project-connections.ts:39-45` (o `pick` com `auth`); `apps/web/src/hub/connectors/text.ts:35-45`, `:65-70` (`stateBadge` e `reauthText`, que leem `auth`); `apps/server/src/hub/connectors/public.ts:100` (`catalog = deps.tuning?.catalog ?? CONNECTORS`).
    - **O que sai:** os campos `auth` e `fields` de `ConnectorEntry`; `auth: true` do `pick` de `ProjectConnections`; o tipo `Auth = ConnectorEntry['auth']` de `text.ts:23`; o `entryOf` que lê `connector.auth`; o `subjectsOf(connector: Connector)`; o `CONNECTORS.map(entryOf)` de `list` (`connections.ts:67`). Toda chamada passa à forma nova no mesmo commit (data D30, sem dado de empresa nessas respostas).
    - **O que entra:**
      ```ts
      // hub-api/src/connectors.ts
      export const PastedField = z.object({ name: z.string(), label: z.string(), maxLength: z.number().int(),
        help: z.object({ text: z.string(), url: z.url() }), visible: z.boolean() })
      export const ConnectorAccess = z.discriminatedUnion('kind', [
        z.object({ kind: z.literal('FIELDS'), fields: z.array(PastedField) }),
        z.object({ kind: z.literal('SIGN_IN') }),
      ])
      export const ConnectorEntry = z.object({ id, name, version, category, summary, logo, subjects,
        access: ConnectorAccess, liveOnly: z.boolean() })
      // project-connections.ts:39-45: pick({ id, name, logo, category, access: true })
      // server connections.ts
      function entryOf(system: SystemDescriptor): ConnectorEntry {
        return { ...campos, subjects: subjectsOf(system), liveOnly: system.liveOnly,
          access: system.access.kind === 'FIELDS'
            ? { kind: 'FIELDS', fields: Object.entries(system.access.fields).map(([name, field]) => ({ name, ...field })) }
            : { kind: 'SIGN_IN' } }
      }
      // list(): connectors: deps.catalog.map(descriptorOf).map(entryOf)
      // catalog-subjects.ts
      export function subjectsOf(system: SystemDescriptor): ConnectorEntry['subjects']   // lê system.operations e o door delas
      // grants.ts:89: connector: { id, name, logo, category, access: entryOf... } pelo descritor
      // web text.ts
      type Access = ConnectorEntry['access']['kind']   // 'FIELDS' | 'SIGN_IN'
      export function stateBadge(connection, access: Access)   // 'SIGN_IN' -> 'Pede para conectar de novo'
      export function reauthText(name: string, access: Access, mayManage: boolean)
      // link-dialog.tsx: entry.auth === 'oauth2_code' vira entry.access.kind === 'SIGN_IN';
      //                  entry.fields vira (entry.access.kind === 'FIELDS' ? entry.access.fields : [])
      ```
      `list` passa a ler `deps.catalog`, o mesmo catálogo que o resto do Hub já lê. Num teste que injeta conectores por `tuning.catalog`, a lista de Integrações passa a trazer o conector injetado: o caso que compara a lista inteira confere isso. Quem chama `subjectsOf` com um `Connector` (os testes, `role-kit.ts`, o `catalogOf` da parte 1) passa `descriptorOf(connector)`. Achar cada um com `grep -rn "subjectsOf(" apps/server/src`.
    - **Testes:** `apps/server/src/hub/connectors/catalog-subjects.test.ts:6` ganha `descriptorOf`; `apps/server/src/hub/connectors/connections.test.ts:19` confere no `listConnections` que o Sankhya vem com `access.kind === 'FIELDS'` e três campos, o Mercado Livre com `{ kind: 'SIGN_IN' }`, ambos com `liveOnly: false`, e nenhuma chave `auth` nem `fields`. Os testes de tela de hoje passam sem mudar o que conferem: `apps/web/src/hub/connectors/integrations.test.tsx`, `integrations-states.test.tsx:121` ("Chaves recusadas"), `integrations-oauth.test.tsx:35`, `apps/web/src/hub/connectors/text.test.tsx`, `apps/web/src/hub/projects/project-integrations.test.tsx`. As fixtures (`fixtures.ts`, `test-hub.tsx`, `test-kit.ts`) montam a entrada pelo esquema do contrato, como `apps/web/src/hub/copies/test-hub.tsx:57` faz.
    - **Mutações à mão:** trocar `'FIELDS'` por `'SIGN_IN'` em `entryOf` (o caso do Sankhya falha); em `stateBadge`, trocar o ramo (o teste "Chaves recusadas" falha).
    - **Pronto quando:** os testes de `apps/server/src/hub/connectors/connections.test.ts` e `catalog-subjects.test.ts`, `npm run test:unit -w @conexus/web` e `npm run typecheck` passam, e Integrações mostra os mesmos campos e selos de hoje.
    - _Requisitos: 1.2, 1.3, 1.4_
  - [ ] 3.2 As rotas `listConnectionObjects` e `previewConnectionObject` (um commit)
    - **Arquivos:** `packages/hub-api/src/connectors.ts`, `packages/hub-api/src/connector-failures.ts`, `packages/hub-api/src/index.ts`, `apps/server/src/hub/connectors/offered.ts` (novo), `apps/server/src/hub/connectors/offered.test.ts` (novo), `apps/server/src/hub/connectors/routes.ts`, `apps/server/src/hub/connectors/rows.ts`, `apps/server/src/hub/copies/service.ts`, `apps/server/src/hub/copies/leave.ts`, `scripts/rerun-never.json`.
    - **Referência a seguir:** `apps/server/src/hub/connectors/copy-proof.ts:35-80` (`provedPage`: uma página por `copyPage`, com `after: null` e a janela); `apps/server/src/hub/connectors/copy-port.ts:141-152` (`copyPage`, que recebe `{ companyId, connectionId, enabledBy, input, signal }`, conta a chamada e retém o documento como leitura `copy`, `read.ts:125-136`); `apps/server/src/hub/connectors/copy-port.ts:35-44`, `:156-170` (`CopyRefusal`, `PagedRead` e `sourceFailureOf`, o mapa de cada recusa); `apps/server/src/hub/connectors/read.ts:36`, `:42-46` (`NotInRole` e `ReadAnswer`); `packages/hub-api/src/copy-failures.ts:69-105` (as falhas `COPY_SOURCE_*`); `apps/server/src/hub/connectors/connection-copies.ts:6-13` (uma leitura admitida por `manageConnections` e depois o porto das cópias); `apps/server/src/hub/connectors/rows.ts:23-37` (o porto `ConnectionCopies`); `apps/server/src/hub/copies/leave.ts:29-35` (`readersOf`, que acha as cópias de uma ligação e tem `copy.model`); `apps/server/src/hub/connectors/routes.ts:38-45` (`serve` de uma leitura); `packages/hub-api/src/copy-failures.ts:37-44` (a linha de `COPY_CONNECTION_NOT_READY`, cuja frase a falha nova repete).
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // hub-api/src/connectors.ts
      export const OfferedObject = z.object({ id: z.string(), label: z.string(), description: z.string(),
        key: z.array(z.string()), changedSince: z.string().nullable(),
        columns: z.array(z.object({ name: z.string(), type: z.string(), description: z.string() })) })
      const OfObject = OfConnection.extend({ object: z.string().max(40) })
      export const listConnectionObjects = defineOperation({ id: 'listConnectionObjects',
        summary: 'Lists the tables a connection offers to copy, each with the copy the company already has of it.',
        access: 'session', method: 'GET', path: '/api/companies/{companyId}/connections/{connectionId}/objects',
        bodyLimit: 1024, input: { params: OfConnection },
        success: { status: 200, body: z.object({ objects: z.array(OfferedObject.extend({ copy: CopyId.nullable() })) }) },
        failures: [...READ_FAILURES, 'CONNECTION_NOT_FOUND', 'CONNECTION_NOT_READY'] })
      export const previewConnectionObject = defineOperation({ id: 'previewConnectionObject',
        summary: 'Reads five rows of a table the connection offers, from the system now.',
        access: 'session', method: 'GET', path: '/api/companies/{companyId}/connections/{connectionId}/objects/{object}/preview',
        bodyLimit: 1024, input: { params: OfObject },
        success: { status: 200, body: z.object({ sample: CopySample }) },     // CopySample da parte 1, copies.ts
        failures: [...READ_FAILURES, 'CONNECTION_NOT_FOUND', 'CONNECTION_NOT_READY', 'CONNECTOR_REFUSED',
          'COPY_SOURCE_NEEDS_REAUTH', 'COPY_SOURCE_UNREACHABLE', 'COPY_SOURCE_UNREADABLE', 'COPY_MODEL_UNKNOWN'] })
      // connector-failures.ts
      CONNECTION_NOT_READY: { category: 'USER', settles: true, status: 409, phrase: 'A conexão precisa ser testada de novo.', action: 'Abra a conexão em Integrações.', actionKind: 'NONE' }
      CONNECTOR_REFUSED:    { category: 'THIRD_PARTY', settles: true, status: 502, phrase: 'O sistema recusou a leitura.', action: '', actionKind: 'NONE' }  // details: { native }
      // rows.ts, ConnectionCopies
      /** As cópias da empresa que leem a ligação, pelo modelo de que vieram. */
      copiedModels(input: CopiesOf): Promise<ReadonlyMap<string, CopyId>>
      // hub/copies/leave.ts + service.ts:77: copiedModels = readersOf(tx, input) filtrado por stored.model !== null
      // offered.ts
      export async function offeredOf(deps: Deps, input: OfConnection) {
        const open = await opened(deps, input)                       // testing.ts:29, admite manageConnections
        await readyOrRefused(deps, input)                            // state !== 'ACTIVE' -> new Failure('CONNECTION_NOT_READY')
        const copied = await deps.copies().copiedModels({ ...input, personId: input.person.id })
        return { objects: objectsOf(open.connector).map((o) => ({ ...o, copy: copied.get(o.id) ?? null })) }
      }
      export async function previewOf(deps: Deps, input: OfConnection & { object: string; signal: AbortSignal }): Promise<CopySample> {
        // admitido e ACTIVE como offeredOf; objectOf(connector, input.object) undefined -> Failure('COPY_MODEL_UNKNOWN')
        const model = open.connector.copy?.models.find((m) => m.id === input.object)
        const page = await copyPage(deps, { ...input, enabledBy: input.person.id, signal: input.signal,
          input: { definition: model.definition, after: null, since: null, windowFrom: <como windowFromOf, copy-proof.ts:23-27>, limit: COPY_SAMPLE_ROWS + 1 } })
        switch (page.kind) {
          case 'PAGE': return { columns: model.definition.columns.map((c) => c.name),
                                rows: page.page.rows.slice(0, COPY_SAMPLE_ROWS), complete: page.page.rows.length <= COPY_SAMPLE_ROWS && !page.page.more }
          case 'REFUSED': throw refusalOf(page.refusal)
          case 'IN_LINE': throw new Failure('COPY_SOURCE_UNREACHABLE')       // a fila da ligação passou do prazo
          case 'NO_CONNECTION': throw new Failure('CONNECTION_NOT_READY')
          default: return page satisfies never
        }
      }
      /** Cada recusa da leitura com a sua falha, no molde de sourceFailureOf (copy-port.ts:156-170). */
      function refusalOf(refusal: CopyRefusal): Failure {
        switch (refusal.kind) {
          case 'REFUSED': return new Failure('CONNECTOR_REFUSED', { details: { native: refusal.native } })
          case 'NOT_IN_ROLE': return new Failure('CONNECTOR_REFUSED', { details: { role: refusal.role, operation: refusal.operation } })
          case 'AUTH_REFUSED': return new Failure('COPY_SOURCE_NEEDS_REAUTH')
          case 'UNREADABLE': return new Failure('COPY_SOURCE_UNREADABLE', { details: { native: refusal.native } })
          case 'UNREACHABLE': case 'DEADLINE': case 'BUSY': return new Failure('COPY_SOURCE_UNREACHABLE')
          default: return refusal satisfies never
        }
      }
      // routes.ts: serve(app, listConnectionObjects, ...offeredOf); serve(app, previewConnectionObject, ...previewOf)
      ```
      A linha `CONNECTOR_CALLED` já sai de `readThrough` (`read.ts:231-247`); a amostra não escreve log próprio. A janela mostra `CONNECTOR_REFUSED` como "O <Sistema> recusou a leitura.", seguida da resposta do sistema por extenso (Notas).
    - **Testes:** `offered.test.ts`, pela porta pública com o dublê do Sankhya, no molde de `apps/server/src/hub/connectors/connections.test.ts:19-70` (`connectionsOn`, `linkSankhya`, `testOf` de `test-connections.ts`). Casos: "a dona lista as cinco tabelas do Sankhya ligado e testado" (ids, descrição não vazia, `copy: null`); "a tabela já copiada traz o id da cópia" (liga `vendas` por `enableCopy` antes, molde `apps/server/src/hub/copies/enable.test.ts`); "uma ligação ainda não testada responde 409 CONNECTION_NOT_READY"; "o membro recebe 404 NOT_FOUND"; "a amostra de vendas tem 5 linhas e complete falso"; "a amostra de clientes não tem coluna de documento"; "o Sankhya que recusa a leitura dá CONNECTOR_REFUSED com o status e o corpo" (dublê com recusa, molde `apps/server/src/hub/connectors/executor.test.ts:223`); "o Sankhya calado dá COPY_SOURCE_UNREACHABLE"; "uma tabela que o conector não oferece dá COPY_MODEL_UNKNOWN"; "o Mercado Livre ligado não oferece tabela". O arquivo entra em `scripts/rerun-never.json` (testing T4: recusa).
    - **Mutações à mão:** trocar `COPY_SAMPLE_ROWS` por `COPY_SAMPLE_ROWS + 1` no `slice` (o caso das 5 linhas falha); tirar `readyOrRefused` (o caso 409 falha); trocar `manageConnections` por `readConnections` na admissão (o caso do membro falha); levar `UNREACHABLE` a `CONNECTOR_REFUSED` (o caso do Sankhya calado falha).
    - **Pronto quando:** `node scripts/test-run.ts --test-concurrency=1 apps/server/src/hub/connectors/offered.test.ts` passa, e `GET /api/companies/{companyId}/connections/{connectionId}/objects` responde as cinco tabelas do dublê.
    - _Requisitos: 2.1, 3.1, 3.2, 3.5, 3.6, 3.7, 3.8_
  - [ ] 3.3 A recusa `COPY_LIVE_ONLY` em `propose` (um commit)
    - **Arquivos:** `apps/server/src/hub/connectors/builder-port.ts`, `apps/server/src/hub/connectors/copy-port.ts`, `apps/server/src/hub/copies/propose.ts`, `apps/server/src/hub/copies/propose.test.ts`, `apps/server/src/hub/copies/test-copies.ts`.
    - **Referência a seguir:** `apps/server/src/hub/connectors/builder-port.ts:72-82` (a união `ProposeAnswer`); `apps/server/src/hub/connectors/copy-port.ts:310`, `:329-334` (`createCopyPort` e `proposable`, que `propose.ts:70` chama por `deps.connectors()`); `apps/server/src/hub/copies/store.ts:95` (`connectors: () => Connectors['copies']`); `apps/server/src/hub/copies/propose.ts:81-111` (`sourcesOf`, onde o conector das ligações é sabido); `apps/server/src/hub/copies/propose.test.ts:70` ("propor: as recusas"); `apps/server/src/hub/connectors/test-catalog.ts:5-9` (`catalogWith`, o catálogo de teste com um conector trocado).
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // builder-port.ts, na união ProposeAnswer
      /** O sistema nunca é copiado: os agentes o leem ao vivo. */
      | Readonly<{ kind: 'COPY_LIVE_ONLY'; connector: string }>
      // copy-port.ts, em createCopyPort, ao lado de proposable
      /** Se o conector se declara só ao vivo; false para um conector que o kit não tem. */
      isLiveOnly(connector: string): boolean { return connectorIn(deps, connector)?.liveOnly === true }
      // propose.ts, sourcesOf, logo depois de achar `connector` de `first`
      if (deps.connectors().isLiveOnly(connector)) return { kind: 'COPY_LIVE_ONLY', connector }
      // Sourced passa a incluir 'COPY_LIVE_ONLY'
      ```
      Nada é gravado: a recusa vem antes de `proofs` e do `insert`.
    - **Testes:** `propose.test.ts`, caso novo "propor: um sistema só ao vivo é recusado e nada é gravado", com o catálogo `catalogWith((c) => ({ ...c, liveOnly: true }))` sobre o Mercado Livre, uma ligação dele e `proposalRows(on)` vazio depois. O arquivo já está em `scripts/rerun-never.json` ou entra nele.
    - **Mutações à mão:** apagar a linha do `if` (o caso novo falha); mover o `if` para depois de `proofs` (o caso confere que nenhuma chamada saiu).
    - **Pronto quando:** `node scripts/test-run.ts --test-concurrency=1 apps/server/src/hub/copies/propose.test.ts` passa.
    - _Requisitos: 2.3_
  - [ ] 3.4 Ponto de conferência do grupo 3
    - Rodar os arquivos de teste tocados (`connections.test.ts`, `catalog-subjects.test.ts`, `offered.test.ts`, `propose.test.ts`), `npm run test:unit -w @conexus/web`, `npm run typecheck`, `npm run check` (que roda `npm run openapi` e `npm run migrations`), `npm run quality` em segundo plano.
    - Passo 6 da skill: `deslop`, `no-comments`, as mutações de 3.1 a 3.3. Subir o Hub local e pedir as duas rotas com `curl` contra o dublê. Passo 7: um commit por unidade.
    - Linhas da tabela de referência: "A descrição do sistema" (os leitores), "As quatro operações" (as rotas), "Só ao vivo" (a recusa em `propose`).
    - A CI roda `npm run check`, os testes do servidor em shards e os de `apps/web`.

- [ ] 4. Grupo 4: a janela Ligar em quatro passos (bloco A, espera o grupo 3) (um PR)
  - [ ] 4.1 Integrações com busca e "só ao vivo", e os passos Acesso e Testando (um commit)
    - **Telas:** `p2-04`, `p2-05`, `p2-06`, `p2-10`, `p2-11`.
    - **Arquivos:** `apps/web/src/hub/connectors/integrations.tsx`, `apps/web/src/hub/connectors/link-dialog.tsx`, `apps/web/src/hub/connectors/link-steps.tsx` (novo), `apps/web/src/hub/connectors/text.ts`, `apps/web/src/hub/connectors/queries.ts`, `apps/web/src/hub/connectors/test-hub.tsx`, `apps/web/src/hub/connectors/integrations.test.tsx`, `apps/web/src/hub/connectors/link-steps.test.tsx` (novo).
    - **Referência a seguir:** `apps/web/src/hub/connectors/integrations.tsx:94-176` (a página); `apps/web/src/hub/connectors/link-dialog.tsx:162-258` (`LinkForm`: `save` e `submit`); `apps/web/src/hub/connectors/connection-page.tsx:171-205` (`Test`: "Testando a ligação…" e as recusas por `refusalText`, `:84`); `apps/web/src/hub/connectors/said.tsx` (o que o sistema respondeu); `apps/web/src/builder/assistant/choice-list.tsx:20-40` (`Search` e `matches`).
    - **O que sai:** no Ligar por chaves, a navegação para a página da ligação com `search: { testar: true }` (`link-dialog.tsx:217-221`). A chegada com `testar` continua para a volta da autorização (`sign-in-return.tsx:149`) e o Conectar de novo. O texto `continueText` "Continuar no <nome>" (`text.ts:174-176`) e quem o usa.
    - **O que entra:**
      ```ts
      // text.ts
      export function signInText(name: string) { return `Entrar com ${name}` }
      export function readingText(name: string) { return `Lendo o que o ${name} oferece` }
      export function keysRefusedText(name: string) { return `O ${name} recusou as chaves` }
      export function silentText(name: string) { return `O ${name} não respondeu. Tente de novo em alguns minutos.` }
      export const LIVE_ONLY_BADGE = 'só ao vivo'
      // queries.ts
      export function connectionObjectsQuery(companyId, connectionId) { return hubQuery(listConnectionObjects, { params: { companyId, connectionId } }) }
      export function objectPreviewQuery(companyId, connectionId, object) { return hubQuery(previewConnectionObject, { params: { companyId, connectionId, object } }) }
      // link-steps.tsx
      export type Step =
        | { kind: 'ACCESS' }
        | { kind: 'TESTING'; connection: Connection }
        | { kind: 'REFUSED'; connection: Connection; result: Extract<TestResult, { result: 'AUTH_REFUSED' }> }
        | { kind: 'SILENT'; connection: Connection }
        | { kind: 'READING'; connection: Connection }
        | { kind: 'CHOOSE'; connection: Connection; objects: Offered[] }          // 4.2
        | { kind: 'REVIEW'; connection: Connection; chosen: Offered[]; interval: CopyInterval }   // 4.3
        | { kind: 'LINKED'; connection: Connection; copies: CopyId[]; failed: Failed[] }          // 4.3
        | { kind: 'LIVE'; connection: Connection }                                               // 4.3
      // LinkForm.submit, chaves: save() -> setStep(TESTING) -> sendTest.mutateAsync(...)
      //   WORKING -> setStep(READING) e lê connectionObjectsQuery; AUTH_REFUSED -> REFUSED; UNREACHABLE -> SILENT;
      //   cada outro resultado mostra refusalText dele (connection-page.tsx:84), como a página faz hoje
      // A página Integrações: <Search label="Buscar sistema" ...> filtra "Para ligar" por matches(entry.name);
      //   Badge "só ao vivo" no ConnectorHead quando entry.liveOnly
      // O passo Acesso por SIGN_IN: <Button>{signInText(entry.name)}</Button> e a lista dos rótulos de entry.subjects
      ```
      O passo é estado da janela (`C4`). As peças são as de `apps/web/src/ui/`: `dialog.tsx`, `form.tsx`, `badge.tsx`, `alert.tsx`, `skeleton.tsx`, `input-group.tsx`. O botão Enviar link aparece no passo Acesso por chave e no Chave recusada, sem ação até o grupo 6.
    - **Testes:** `link-steps.test.tsx`, com msw pelo `hubServer()` de `apps/web/src/platform/test-hub.tsx:192` e o `connectionsHub` de `apps/web/src/hub/connectors/test-hub.tsx:163`, no molde de `apps/web/src/hub/connectors/integrations.test.tsx:43`. Casos: "o Sankhya: os três campos, Onde achar e Enviar link"; "o Mercado Livre: Entrar com Mercado Livre e o que o Conexus vai ler"; "salvar mostra Testando a ligação… e depois Lendo o que o Sankhya oferece"; "a chave recusada mostra O Sankhya recusou as chaves e o que ele respondeu"; "o sistema calado mostra O Sankhya não respondeu"; "a busca filtra Para ligar"; "o Gmail de teste tem o selo só ao vivo" (entrada fabricada pelo esquema com `liveOnly: true`). `integrations.test.tsx:210` (o membro lê; vazio e erro) continua. `integrations-oauth.test.tsx:35` passa a esperar "Entrar com Mercado Livre".
    - **Mutações à mão:** trocar `WORKING` por `AUTH_REFUSED` no ramo do teste (dois casos falham); tirar o filtro da busca.
    - **Pronto quando:** `npm run test:unit -w @conexus/web` passa e, no Hub local com o dublê, Ligar o Sankhya mostra Testando e Lendo dentro da janela.
    - _Requisitos: 2.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.15, 4.16_
  - [ ] 4.2 O passo O que copiar, com a amostra (um commit)
    - **Telas:** `p2-12`.
    - **Arquivos:** `apps/web/src/hub/connectors/link-objects.tsx` (novo), `apps/web/src/hub/connectors/link-steps.tsx`, `apps/web/src/hub/connectors/text.ts`, `apps/web/src/hub/connectors/test-hub.tsx`, `apps/web/src/hub/connectors/link-objects.test.tsx` (novo).
    - **Referência a seguir:** `apps/web/src/hub/copies/copy-list.tsx:297-328` (uma `Table` crua) e `:367-391` (lista no celular, tabela no desktop, `useIsMobile`); `apps/web/src/ui/table.tsx:7-73`; `apps/web/src/ui/states.tsx:75` (`ReadFailure` com Tentar de novo); a amostra da parte 1 (`p1-03`), se já estiver no `main`, para a mesma grade.
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      export function ObjectsStep(props: { companyId; connection: Connection; system: ConnectorEntry; onNext(chosen: Offered[]): void })
      // useQuery(connectionObjectsQuery(...)); cada linha: Checkbox, label, description, key.join(', '),
      //   modo: changedSince === null ? 'lê tudo a cada vez' : 'lê o que mudou'   (o texto de modo é o de hub/copies/text.ts, pelo public.ts)
      //   copy !== null -> Badge 'já copiada' e a caixa desmarcada e desligada
      //   botão 'Ver a amostra' abre <Sample> com useQuery(objectPreviewQuery(...)): Skeleton, a grade, ReadFailure
      // Continuar desligado sem tabela marcada, com o porquê (design V29)
      ```
    - **Testes:** `link-objects.test.tsx`: "as cinco tabelas do Sankhya com descrição, chave e modo"; "a tabela já copiada vem marcada já copiada"; "Ver a amostra mostra 5 linhas"; "a amostra recusada mostra O Sankhya recusou a leitura. e Tentar de novo" (`refusal('CONNECTOR_REFUSED')` de `apps/web/src/platform/test-hub.tsx:248`); "Continuar pede ao menos uma tabela". Os dados são fabricados pelo esquema de `listConnectionObjects.success.body`, como `apps/web/src/hub/copies/test-hub.tsx:57`.
    - **Mutações à mão:** tirar a desativação da tabela já copiada; trocar o texto de modo dos dois ramos.
    - **Pronto quando:** `npm run test:unit -w @conexus/web` passa, e no Hub local o passo mostra as cinco tabelas e a amostra de `vendas`.
    - _Requisitos: 4.7, 4.8_
  - [ ] 4.3 A Revisão, o Ligado, o caso só ao vivo e o caso sem tabela (um commit)
    - **Telas:** `p2-13`, `p2-14`, `p2-15`, e a frase de `p1-01` na Página_Dados, se a parte 1 estiver no `main`.
    - **Arquivos:** `apps/web/src/hub/connectors/link-review.tsx` (novo), `apps/web/src/hub/connectors/link-steps.tsx`, `apps/web/src/hub/connectors/text.ts`, `apps/web/src/hub/copies/public.ts`, `apps/web/src/hub/connectors/link-review.test.tsx` (novo), a página Dados da parte 1 (se existir).
    - **Referência a seguir:** `apps/web/src/hub/copies/copy-proposal.tsx:90-130` (o intervalo em `useState<CopyInterval>(COPY_INTERVAL_DEFAULT)`, `useAttemptKey` e `sendCopyEnable`); `packages/hub-api/src/copies.ts:20-22` (`CopyInterval`, o padrão `'30m'`); `packages/hub-api/src/copies.ts:102-115` (`EnableCopyFromModel`); `apps/server/src/hub/copies/enable.ts:132-172` (uma cópia por chamada, a primeira rodada sozinha, `:166-170`); `apps/web/src/platform/attempt-key.ts:14`, `:34` (`useAttemptKey`, e `derivedAttemptKey(seed: string): Promise<string>`).
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // hub/copies/public.ts exporta sendCopyEnable e copiesQuery (web W4)
      export function ReviewStep(props: { companyId; connection; chosen: Offered[]; onLinked(...): void; onBack(): void })
      // duas linhas: Tabelas (os rótulos) e Intervalo (Select com CopyInterval, padrão COPY_INTERVAL_DEFAULT)
      // 'Ligar e copiar agora': para cada tabela, em sequência,
      //   const key = await derivedAttemptKey(`${attempt}:${o.id}`)
      //   sendCopyEnable.mutateAsync({ params: { companyId }, body: { from: 'MODEL', connectionId, model: o.id, interval }, attemptKey: key })
      //   HubFailure -> failed.push({ object: o.label, text: sentenceOf(error) }) e continue; nenhum catch sem nome
      // LinkedStep: copiesQuery com refetchInterval até a primeira rodada de cada uma (web W12),
      //   a frase 'Pergunte ao Assistente sobre as vendas.', 'Perguntar ao Assistente' (Início) e 'Ver em Dados'
      // LiveStep: quando entry.liveOnly e o teste passa, pula CHOOSE e REVIEW:
      //   'nunca é copiado' e os rótulos de entry.subjects como o que os agentes consultam na hora; 'Ver em Integrações'
      // Sem tabela: quando o teste passa e objects vem vazio num sistema que não é só ao vivo, vai direto a LINKED sem cópia
      // Fechar no meio: a janela fecha, a ligação fica, nenhuma cópia (`C4`)
      ```
    - **Testes:** `link-review.test.tsx`: "a revisão traz duas linhas, as tabelas e 30 minutos"; "Ligar e copiar agora manda um enableCopy por tabela, cada um com a sua chave" (`hub.writes()` confere os corpos e o cabeçalho `ATTEMPT_KEY_HEADER`, molde `apps/web/src/hub/copies/copy-list.test.tsx:114-139`); "uma tabela que falha é nomeada e as outras seguem" (a segunda responde `refusal('COPY_DATABASE_UNAVAILABLE')`); "o Ligado mostra a primeira rodada e Pergunte ao Assistente sobre as vendas."; "o Gmail de teste pula para nunca é copiado"; "o Mercado Livre vai direto ao Ligado sem cópia"; "fechar antes de ligar as cópias não manda enableCopy".
    - **Mutações à mão:** usar a mesma semente nas duas tabelas (o caso das chaves falha); trocar `continue` por `return` depois da falha (o caso da que segue falha); tirar o ramo `liveOnly`; tirar o ramo sem tabela (o caso do Mercado Livre falha).
    - **Pronto quando:** `npm run test:unit -w @conexus/web` passa, e no Hub local Lea liga o Sankhya, marca as cinco, toca Ligar e copiar agora e vê cinco cópias com a primeira rodada.
    - _Requisitos: 2.4, 2.8, 4.9, 4.10, 4.11, 4.12, 4.13, 4.14_
  - [ ] 4.4 Ponto de conferência do grupo 4, e a QA
    - Rodar `npm run test:unit -w @conexus/web`, `npm run test:browser -w @conexus/web` (com `link-dialog.layout.test.ts`, que ganha os passos novos a 1366 e 390 px), `npm run test:sweep -w @conexus/web` (com `apps/web/sweep-integrations-states.ts` ganhando Testando, Chave recusada, O que copiar, Revisão, Ligado e Só ao vivo), `npm run typecheck`, `npm run check`, `npm run quality` em segundo plano.
    - Passo 6 da skill: `deslop`, `no-comments`, as mutações de 4.1 a 4.3; cada passo olhado em navegador real a 1366 e 390 px, nos dois temas (testing T23), pela referência `.agents/skills/conexus-build/references/screen.md`. Passo 7: um commit por unidade.
    - Linha da tabela de referência: "A janela em quatro passos", nativo (as peças de `apps/web/src/ui/`).
    - Depois do grupo, a QA pela skill `conexus-qa`, por um agente que não construiu (testing T25), no roteiro da seção 4.1 do escopo e na matriz 4.4.
    - A CI roda `npm run check`, os testes de `apps/web` e o `sweep`.
    - _Requisitos: 4.17_

- [ ] 5. Grupo 5: o link, a porta nova e a permissão (bloco A; palavra do fundador dada em 2026-11-14 (P2 do índice); o PR a cita, e cita também o papel dono e a função, que o PR mostra por inteiro, data D11) (um PR)
  - [ ] 5.1 O registro de decisão "proposto" da porta nova (um commit)
    - **Arquivos:** `docs/decisions/0070-connection-link-for-another-person.md` (novo; o número é o próximo livre em `docs/decisions/`).
    - **Referência a seguir:** `docs/decisions/0068-mastra-tracing-in-its-own-database.md:1-25` (a forma: Context, Decision, Result); `docs/decisions/0057-connections-by-oauth.md:12-21` (a linha de um uso, gasta com `DELETE … RETURNING`); `apps/server/src/hub/projects/hosts.ts:17-31` e `apps/server/migrations/20261018101320_app_grants/migration.sql:12-39` (`projects.project_of_host`, a busca entre empresas por um valor, dona de `hub_hosts` e dada a `hub_runtime`); `apps/server/src/hub/connectors/rows.ts:124-138` (`scopeOf` e `admitted`); `apps/server/src/hub/identity/routes.ts:51-63` e `apps/server/src/hub/identity/company-routes.ts:144-155` (`countAttempt` numa rota `entry`); security S41, `S48`; skill `conexus-study`, a porta de mão única com o critério.
    - **O que sai:** nada.
    - **O que entra:** o registro com o status "proposto", em inglês (delivery L23 vale para o que a pessoa usa), com: a porta (`readConnectionLink` `public`, `answerConnectionLink` `entry`), o segredo de 32 bytes só no endereço e o resumo SHA-256 no banco, os 30 minutos, o gasto por `DELETE … RETURNING`, só ligação nova, e o critério. O registro traz as escolhas do desenho (`C5`): (a) a rota sem sessão acha a linha por `connectors.link_of(secret_hash text) RETURNS TABLE (id uuid, company_id text, created_by text)`, `SECURITY DEFINER`, só para linha viva, no molde de `projects.project_of_host`, chamada por `database.installationRead`; (b) o papel novo `hub_links`, `NOLOGIN` e `NOBYPASSRLS`, dono da função, que lê cinco colunas de `connection_link` por uma política de leitura própria, `connection_link_links_select`; (c) depois da linha, o escopo `COMPANY` de quem pediu, `scopeOf({ person: { id: row.createdBy }, companyId: row.companyId })`, que readmite quem pediu e grava `tested_by`; (d) a chave de tentativa da ligação é o id do link; (e) as duas rotas contam tentativas com `countAttempt` por `CONNECTION_LINK_PATH`; (f) o link vale só para sistema de acesso `FIELDS`, porque `completeSignIn` admite por sessão (`apps/server/src/hub/connectors/sign-ins.ts:224-273`).
    - **Testes:** `npm run docs` confere o índice dos registros.
    - **Mutações à mão:** nenhuma; não há código.
    - **Pronto quando:** o registro está no PR, com a palavra do fundador de 2026-11-14 citada.
    - _Requisitos: 5.4, 5.5_
  - [ ] 5.2 O papel `hub_links`, a tabela `connectors.connection_link`, a função `link_of` e a permissão do banco (um commit)
    - **Arquivos:** `apps/server/migrations/<data>_connection_link_role/migration.sql` (novo, à mão, antes da gerada), `apps/server/src/hub/connectors/tables.ts`, `apps/server/migrations/<data>_connection_link/` (novo, gerado por `npm run generate -w @conexus/server`), `apps/server/migrations/<data>_connection_link_grants/migration.sql` (novo, à mão), `apps/server/database-grants.sql`, `apps/server/src/hub/connectors/tables.test.ts`.
    - **Referência a seguir:** `apps/server/migrations/20261029000100_e19_connection_seals_role/migration.sql` (o papel criado antes da migração gerada, cuja política o nomeia); `apps/server/src/hub/connectors/tables.ts:111-115` (`pgPolicy('connection_seals_select', …)`); `apps/server/src/hub/projects/tables.ts:26`, `:62` (`hosts_select` para `hub_hosts`); `apps/server/src/hub/connectors/tables.ts:125-170` (`connectionSignIn`: a chave estrangeira do membro, os `check` e a política da empresa); `apps/server/migrations/20261018101320_app_grants/migration.sql:12-39` e `apps/server/migrations/20261029024300_e19_connection_grants/migration.sql` (a função criada, o `REVOKE`, o `GRANT EXECUTE` e a troca de dono); `apps/server/database-grants.sql:33-41`, `:140-142`, `:172-180`, `:360`, `:513-516`, `:544-545` (as linhas de dono, de esquema, de função, de tabela, do papel e da administração do papel); data D5, `D6`, `D10`, `D11`, `D12`.
    - **O que sai:** nada.
    - **O que entra:**
      ```sql
      -- <data>_connection_link_role/migration.sql
      -- Custom SQL: Drizzle cannot generate a role (data D5). Founder 2026-11-14 (P2, data D11): the role
      -- that owns connectors.link_of, the one reader of a link by its secret's hash before any company is
      -- known. It cannot log in and owns nothing else. It comes before the generated migration, whose row
      -- policy names it.
      DO $$
      BEGIN
        BEGIN
          CREATE ROLE hub_links NOLOGIN NOSUPERUSER NOINHERIT NOCREATEDB NOCREATEROLE NOBYPASSRLS;
        EXCEPTION WHEN duplicate_object OR unique_violation THEN
          NULL;
        END;
        ALTER ROLE hub_links NOLOGIN NOINHERIT NOCREATEDB NOCREATEROLE;
      END
      $$;
      ```
      ```ts
      // tables.ts
      /** A link for another person to fill a new connection's credential: 30 minutes and one use. */
      export const connectionLink = connectors.table('connection_link', {
        id: uuid('id').primaryKey(), companyId: text('company_id').notNull(), connectorId: text('connector_id').notNull(),
        name: text('name').notNull(),
        secretHash: text('secret_hash').notNull(), asked: text('asked').array().notNull(),
        sealed: bytea('sealed'), keyId: text('key_id'),
        createdBy: text('created_by').notNull(), expiresAt: instant('expires_at').notNull(),
      }, (table) => [
        uniqueIndex('connection_link_secret_key').on(table.secretHash),
        foreignKey({ name: 'connection_link_member_fkey', columns: [table.companyId, table.createdBy], foreignColumns: [member.organizationId, member.userId] }).onDelete('cascade'),
        check('connection_link_sealed', sql`(${table.sealed} IS NULL) = (${table.keyId} IS NULL)`),
        check('connection_link_asked', sql`cardinality(${table.asked}) BETWEEN 1 AND 8`),
        check('connection_link_connector_id', sql`${table.connectorId} ~ '^[a-z][a-z0-9-]{1,31}$'`),
        policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
        pgPolicy('connection_link_links_select', { for: 'select', to: 'hub_links', using: sql`true` }),
      ])
      ```
      ```sql
      -- <data>_connection_link_grants/migration.sql
      -- Custom SQL: Drizzle cannot generate a function or a grant (data D5). Founder 2026-11-14 (P2, data
      -- `D11`): a company's routes create, read and spend its links; the page without a session finds a live
      -- link by its secret's hash through one function, which answers three ids and nothing else.
      GRANT SELECT, INSERT, DELETE ON TABLE connectors.connection_link TO hub_company;
      --> statement-breakpoint
      GRANT USAGE ON SCHEMA connectors TO hub_links;
      --> statement-breakpoint
      GRANT SELECT (id, company_id, created_by, secret_hash, expires_at) ON TABLE connectors.connection_link TO hub_links;
      --> statement-breakpoint
      CREATE FUNCTION connectors.link_of(secret_hash text) RETURNS TABLE (id uuid, company_id text, created_by text)
        LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
        AS $$ SELECT l.id, l.company_id, l.created_by FROM connectors.connection_link l
          WHERE l.secret_hash = link_of.secret_hash AND l.expires_at > statement_timestamp() $$;
      --> statement-breakpoint
      REVOKE ALL ON FUNCTION connectors.link_of(text) FROM PUBLIC;
      --> statement-breakpoint
      GRANT EXECUTE ON FUNCTION connectors.link_of(text) TO hub_runtime;
      --> statement-breakpoint
      -- The function changes hands to the role that cannot log in, as connectors.sealed_of did.
      GRANT CREATE ON SCHEMA connectors TO hub_links;
      --> statement-breakpoint
      GRANT hub_links TO current_user WITH INHERIT FALSE, SET TRUE;
      --> statement-breakpoint
      ALTER FUNCTION connectors.link_of(text) OWNER TO hub_links;
      --> statement-breakpoint
      REVOKE hub_links FROM current_user;
      --> statement-breakpoint
      REVOKE CREATE ON SCHEMA connectors FROM hub_links;
      ```
      `hub_runtime` já tem `USAGE` no esquema `connectors` (`database-grants.sql:142`). `database-grants.sql` recebe, cada uma no lugar da ordem de hoje e com o comentário "Founder 2026-11-14 (P2, `D11`): a link for another person, the role that finds it by its secret and the function it owns.":
      ```sql
      ALTER FUNCTION connectors.link_of(secret_hash text) OWNER TO hub_links;
      ALTER TABLE connectors.connection_link OWNER TO test_owner;
      GRANT USAGE ON SCHEMA connectors TO hub_links;
      REVOKE ALL ON FUNCTION connectors.link_of(secret_hash text) FROM PUBLIC;
      GRANT ALL ON FUNCTION connectors.link_of(secret_hash text) TO hub_runtime;
      GRANT SELECT,INSERT,DELETE ON TABLE connectors.connection_link TO hub_company;
      GRANT SELECT(id) ON TABLE connectors.connection_link TO hub_links;
      GRANT SELECT(company_id) ON TABLE connectors.connection_link TO hub_links;
      GRANT SELECT(created_by) ON TABLE connectors.connection_link TO hub_links;
      GRANT SELECT(secret_hash) ON TABLE connectors.connection_link TO hub_links;
      GRANT SELECT(expires_at) ON TABLE connectors.connection_link TO hub_links;
      CREATE ROLE hub_links;
      ALTER ROLE hub_links WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
      GRANT hub_links TO test_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY test_superuser;
      ```
      A forma de cada linha é a que `pg_dump` dá, como as de `hub_hosts` e `hub_connection_seals`; o `catalog.test.ts` diz a forma final se uma diferir.
    - **Testes:** `apps/server/src/platform/catalog.test.ts` passa com a lista nova; `tables.test.ts` ganha "o link tem um a oito campos pedidos e o selo inteiro ou nenhum", no molde de `apps/server/src/hub/connectors/sign-in-table.test.ts`, e "link_of acha só a linha viva, de qualquer empresa, e só os três ids" (como `hub_runtime`, sem escopo, uma linha viva e uma vencida de duas empresas).
    - **Mutações à mão:** tirar `l.expires_at > statement_timestamp()` de `link_of` (o caso da linha vencida falha); tirar a política `connection_link_links_select` (`link_of` lê zero linhas e o caso falha).
    - **Pronto quando:** `npm run migrations -- --base origin/main` passa, as três migrações rodam num banco descartável na ordem, e `catalog.test.ts` passa.
    - _Requisitos: 5.4, 5.5_
  - [ ] 5.3 Ponto de conferência do grupo 5
    - Rodar `apps/server/src/platform/catalog.test.ts`, `apps/server/src/hub/connectors/tables.test.ts`, `npm run migrations -- --base origin/main`, `npm run check`, `npm run quality` em segundo plano. A regra do `check` que recusa `SET` solto vale também para os auxiliares de teste.
    - Passo 6 da skill: `deslop`, `no-comments`, as mutações de 5.2. Passo 7: um commit por unidade.
    - Linha da tabela de referência: "O link", embrulhado (o molde do login em curso e o de `project_of_host`).
    - O corpo do PR cita a palavra do fundador de 2026-11-14 (P2) e mostra por inteiro o papel `hub_links`, a política `connection_link_links_select` e a função `link_of` (data D11). O PR leva a lista de permissões e o que ela exige: o papel, a tabela e a função. O propósito novo do selo vai no grupo 6.
    - A CI roda `npm run check` com a conferência de migrações e o `catalog.test.ts`.

- [ ] 6. Grupo 6: as rotas do link, a página pública e o botão Enviar link (bloco A, espera os grupos 4 e 5) (um PR)
  - [ ] 6.1 As três rotas do link (um commit)
    - **Arquivos:** `packages/hub-api/src/connection-links.ts` (novo), `packages/hub-api/src/connectors.ts`, `packages/hub-api/src/connector-failures.ts`, `packages/hub-api/src/index.ts`, `apps/server/src/platform/seal.ts`, `apps/server/src/hub/identity/auth.ts`, `apps/server/src/hub/identity/public.ts`, `apps/server/src/hub/connectors/links.ts` (novo), `apps/server/src/hub/connectors/connections.ts`, `apps/server/src/hub/connectors/routes.ts`, `apps/server/src/platform/http.ts`, `apps/server/src/hub/connectors/links.test.ts` (novo), `scripts/rerun-never.json`.
    - **Referência a seguir:** `apps/server/src/hub/connectors/sign-ins.ts:145-193` (`take`: `DELETE … RETURNING` com `live` pelo relógio do banco); `apps/server/src/hub/connectors/connections.ts:102-154` (`link`: o selo e o `insert`, `:128-146`); `apps/server/src/hub/connectors/testing.ts:103-116` (`test`, que readmite por `opened` e grava `testedBy`); `apps/server/src/hub/projects/hosts.ts:23-31` (`installationRead` e a função lida por `tx.execute(sql\`select … from …\`)`); `apps/server/src/hub/connectors/rows.ts:124-126` (`scopeOf`); `packages/hub-api/src/connectors.ts:150-154` (`PastedCredential` e `InCompany`, hoje não exportados); `apps/server/src/hub/connectors/connections.ts:106-126` (`transactionLock` pela chave e a conferência de repetição); `packages/hub-api/src/companies.ts:219-229` (`getInvitation`, `access: 'public'`) e `:298-314` (`declineInvitation`, `access: 'entry'`); `apps/server/src/hub/identity/auth.ts:38-55`, `:313-319` (os caminhos de contagem, os endpoints e `customRules`); `apps/server/src/hub/identity/routes.ts:51-63` (`countAttempt`); `apps/server/src/hub/identity/public.ts:98-130` (`ports`); `apps/server/src/platform/http.ts:247-252` (a entrada do handler por tipo de acesso); `apps/server/src/platform/seal.ts:49-56` (os propósitos do selo); `apps/server/src/hub/connectors/connections-oauth-logs.test.ts:41` (nenhuma resposta ou log leva uma chave).
    - **O que sai:** de `link` (`connections.ts:102-154`), a parte que sela e insere vira `insertedConnection(tx, { companyId, connector, name, credential, linkedBy, attemptKey })`, chamada por `link` e pela resposta do link. Nada fica duplicado.
    - **O que entra:**
      ```ts
      // hub-api/src/connectors.ts: export const PastedCredential, export const InCompany (PastedField já é exportado pela 3.1)
      // connector-failures.ts
      LINK_NOT_FOR_SIGN_IN: { category: 'USER', settles: true, status: 409, phrase: 'Este sistema entra por autorização: quem tem a conta liga direto.', action: '', actionKind: 'NONE' }
      // seal.ts: purpose ganha 'connection-link', e rowId o ConnectionLinkId
      // hub-api/src/connection-links.ts
      export const CONNECTION_LINK_MINUTES = 30
      export const createConnectionLink = defineOperation({ id: 'createConnectionLink', access: 'session', method: 'POST',
        path: '/api/companies/{companyId}/connection-links', bodyLimit: 16 * 1024,
        input: { params: InCompany, body: z.strictObject({ connector: z.string().max(64), name: z.string().max(240),
          asked: z.array(z.string().max(64)).min(1).max(8), filled: PastedCredential }) },
        success: { status: 201, body: z.object({ url: z.url(), expiresAt: z.iso.datetime() }) },
        failures: [...READ_FAILURES, 'CONNECTOR_UNKNOWN', 'CONNECTION_NAME_INVALID', 'CONNECTION_NAME_TAKEN', 'CONNECTION_CREDENTIAL_INVALID', 'LINK_NOT_FOR_SIGN_IN'] })
      //   sem chave de tentativa: uma repetição cria outro link, e cada um vale por si
      export const readConnectionLink = defineOperation({ id: 'readConnectionLink', access: 'public', method: 'GET',
        path: '/api/connection-links/{secret}', input: { params: z.object({ secret: z.string().length(43) }) },
        success: { status: 200, body: z.object({ company: z.string(), askedBy: z.string(), system: z.object({ name: z.string(), logo: z.string() }), fields: z.array(PastedField) }) },
        failures: ['NOT_FOUND', 'SIGN_IN_ATTEMPTS_EXCEEDED', 'DATABASE_UNAVAILABLE'] })
      export const answerConnectionLink = defineOperation({ id: 'answerConnectionLink', access: 'entry', method: 'POST',
        path: '/api/connection-links/{secret}', input: { params: ..., body: z.object({ fields: PastedCredential }) },
        success: { status: 200, body: z.object({ result: TestResult }) },
        failures: ['NOT_FOUND', 'SIGN_IN_ATTEMPTS_EXCEEDED', 'CONNECTION_CREDENTIAL_INVALID', 'CONNECTION_NAME_TAKEN', 'DATABASE_UNAVAILABLE'] })
      // identity/auth.ts
      export const CONNECTION_LINK_PATH = '/connection-link-attempt'
      //   um endpoint de contagem a mais, como invitationDeclinationAttempt, e customRules[CONNECTION_LINK_PATH] = SIGN_IN_ATTEMPTS
      // identity/public.ts, em ports
      countConnectionLinkAttempt: (input: { headers: Headers; log: FailureLog }) =>
        countAttempt({ auth, config: deps.config }, { ...input, path: CONNECTION_LINK_PATH, exceeded: 'SIGN_IN_ATTEMPTS_EXCEEDED' })
      // links.ts
      export async function createLink(deps, input) {
        // admitted(... 'manageConnections'); connector.auth.kind !== 'client_credentials' -> Failure('LINK_NOT_FOR_SIGN_IN')
        // asked ⊆ campos do conector e filled = os outros, pelo auth.credential do conector; nome livre como em link
        const secret = randomBytes(32).toString('base64url')
        // insert connection_link { secretHash: sha256(secret), name, asked, sealed: seal(..., 'connection-link', filled), expiresAt: now + 30 min }
        return { url: `${deps.publicOrigin}/connection-links/${secret}`, expiresAt }
      }
      /** A linha viva pelo resumo, entre empresas, por connectors.link_of; nenhuma -> Failure('NOT_FOUND') e log CONNECTION_LINK_REFUSED { reason }. */
      async function liveLink(deps, secret) {
        const found = await deps.database.installationRead((tx) =>
          tx.execute(sql`select id, company_id, created_by from connectors.link_of(${sha256(secret)})`))
        // LinkRow.parse; nenhuma linha -> log CONNECTION_LINK_REFUSED e Failure('NOT_FOUND')
        return { linkId, viewer: { person: { id: row.created_by }, companyId: row.company_id } }
      }
      export async function readLink(deps, secret)   // liveLink, depois a linha inteira em scopeOf(viewer): quem pediu, o sistema, os campos de asked
      export async function answerLink(deps, secret, fields) {
        // 1. liveLink; no escopo scopeOf(viewer): admitted(viewer, 'manageConnections') (quem pediu perdeu a permissão -> NOT_FOUND);
        //    abre o selo; junta filled + fields; pastedOf (connections.ts:89-95)
        // 2. no mesmo comando: transactionLock(tx, `conexus.connection-link:${linkId}`), e uma ligação da empresa com
        //    attemptKey = linkId já existe -> log CONNECTION_LINK_REFUSED { reason: 'busy' } e Failure('NOT_FOUND');
        //    senão insertedConnection(... name: row.name, linkedBy: row.createdBy, attemptKey: linkId ...)
        //    depois test(deps, { ...viewer, connectionId }) uma vez; se test lançar: a ligação nova sai (a limpeza de unlink),
        //    log CONNECTION_LINK_UNDONE { connectionId, code }, e a falha sobe
        // 3. WORKING: DELETE … RETURNING do link na mesma ordem de take; o link gasto
        //    outro resultado: a ligação nova sai (a mesma limpeza de unlink) e o link fica até o prazo
        // log CONNECTION_LINK_TESTED { result }, nunca o segredo nem um campo (`S41`)
      }
      // routes.ts: as duas rotas sem sessão chamam deps.identity.countConnectionLinkAttempt({ headers, log }) antes
      ```
      A chave de tentativa é o id do link, um UUID, a forma que `AttemptKey` pede (`packages/hub-api/src/operation.ts:6`): o link é gasto uma vez, o `transactionLock` deixa um envio de cada vez, e uma ligação que falhou ou lançou no teste sai antes de o link valer de novo. O resultado `AUTH_REFUSED` e os outros voltam inteiros em `result`, como `testConnection` (code C79).
    - **Testes:** `links.test.ts`, pela porta pública com o dublê do Sankhya, no molde de `apps/server/src/hub/connectors/sign-ins.test.ts:66` ("completar: cria a ligação uma vez; a autorização gasta, alheia ou vencida"). Casos: "a dona cria o link com o xToken pedido e o resto preenchido; o endereço vem uma vez"; "a página lê só o campo pedido, sem valor"; "o contador envia, a ligação nasce em nome da dona, testada por ela, e o teste passa"; "o segundo uso dá 404"; "o link vencido dá 404" (relógio do banco adiantado pela linha, como os testes de `sign-ins.test.ts`); "um segredo errado dá 404"; "a chave recusada devolve o que o Sankhya disse e o link segue valendo"; "o membro não cria link: 404"; "o Mercado Livre não aceita link: 409 LINK_NOT_FOR_SIGN_IN"; "a dona que virou membro: o envio dá 404 e nada é criado"; "tentativas demais do mesmo endereço dão 429"; "dois envios ao mesmo tempo dão uma ligação, e o segundo responde 404"; "o teste que lança tira a ligação nova, e o envio seguinte liga" (o banco da empresa calado no primeiro teste); "a dona cria duas vezes: dois links, e cada um liga uma vez"; "nenhuma linha do banco nem do log tem o segredo ou um campo" (molde `connections-oauth-logs.test.ts:41`). O arquivo entra em `scripts/rerun-never.json` (testing T4).
    - **Mutações à mão:** trocar `DELETE … RETURNING` por `SELECT` (o segundo uso falha); tirar `DELETE` do `GRANT` de `connection_link` a `hub_company` (5.2) (o segundo uso falha); tirar o `transactionLock` (o caso dos dois envios falha); tirar a limpeza quando o teste lança (o envio seguinte dá CONNECTION_NAME_TAKEN); usar a pessoa errada em `linkedBy`; tirar a recusa de `SIGN_IN` (o caso do Mercado Livre falha); tirar a chamada de `countConnectionLinkAttempt` (o caso 429 falha); logar `secret`.
    - **Pronto quando:** `node scripts/test-run.ts --test-concurrency=1 apps/server/src/hub/connectors/links.test.ts` passa.
    - _Requisitos: 5.1, 5.3, 5.4, 5.5, 5.7, 5.8, 5.10, 5.11, 5.12_
  - [ ] 6.2 A página pública do link e o botão Enviar link (um commit)
    - **Telas:** `p2-07`, `p2-08`, `p2-09`.
    - **Arquivos:** `apps/web/src/routes/_public/connection-links/$secret.tsx` (novo), `apps/web/src/hub/connectors/link-page.tsx` (novo), `apps/web/src/hub/connectors/send-link.tsx` (novo), `apps/web/src/hub/connectors/link-steps.tsx`, `apps/web/src/hub/connectors/queries.ts`, `apps/web/src/hub/connectors/public.ts`, `apps/web/src/hub/connectors/text.ts`, `apps/web/src/hub/connectors/link-page.test.tsx` (novo), `apps/web/src/hub/connectors/send-link.test.tsx` (novo), `docs/reference/screens.md`.
    - **Referência a seguir:** `apps/web/src/routes/_public/invitations/$invitationId.tsx:10-19` (a rota pública com `readOrNotFound` e `notFoundComponent`); `apps/web/src/hub/connectors/link-dialog.tsx:37-60`, `:99-125` (`schemaOf` e `Fields`, o formulário montado dos campos); `apps/web/src/hub/copies/copy-proposal.tsx:90-130` (uma escrita com chave de tentativa); web W29 (a linha da tela em `docs/reference/screens.md`).
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // send-link.tsx (p2-07): só para entry.access.kind === 'FIELDS'; a lista dos campos de entry.access.fields com Checkbox;
      //   os não marcados aparecem como campo para quem pede preencher; 'Gerar o link' -> sendLinkCreate (sem chave de tentativa)
      //   -> o endereço com um botão de copiar e 'Vale 30 minutos e uma vez.'
      // $secret.tsx: loader readOrNotFound(fetchQuery(connectionLinkQuery(secret))); notFoundComponent: LinkExpired
      // link-page.tsx (p2-08): '<askedBy> pediu para ligar o <system.name> da <company>', só os campos de `fields`, 'Enviar'
      //   -> sendLinkAnswer; WORKING: 'Pronto. A ligação com o <Sistema> foi feita. Pode fechar esta página.';
      //   AUTH_REFUSED: keysRefusedText e <Said native>
      // LinkExpired (p2-09): 'Este link venceu. Peça outro a quem enviou.'
      ```
    - **Testes:** `send-link.test.tsx`: "Enviar link lista os três campos e gera o endereço com o prazo"; "o pedido leva só os campos marcados em asked"; "o Mercado Livre não mostra Enviar link". `link-page.test.tsx`: "a página mostra quem pediu, o sistema e só o campo pedido"; "Enviar com a chave recusada mostra o que o Sankhya disse e deixa tentar de novo"; "Enviar com a chave aceita mostra Pronto"; "o link vencido mostra a frase de vencido" (`refusal('NOT_FOUND')`).
    - **Mutações à mão:** mostrar todos os campos do sistema na página e não só `fields` (o caso do campo pedido falha); tirar o `notFoundComponent`; mostrar Enviar link num sistema `SIGN_IN`.
    - **Pronto quando:** `npm run test:unit -w @conexus/web` passa e, no Hub local, o endereço gerado abre numa janela anônima e liga o Sankhya.
    - _Requisitos: 5.2, 5.6, 5.8, 5.9_
  - [ ] 6.3 Ponto de conferência do grupo 6, e a QA
    - Rodar `links.test.ts`, `npm run test:unit -w @conexus/web`, `npm run test:browser -w @conexus/web`, `npm run test:sweep -w @conexus/web` (com a página do link e o vencido nos estados), `npm run typecheck`, `npm run check`, `npm run quality` em segundo plano.
    - Passo 6 da skill: `deslop`, `no-comments`, as mutações de 6.1 e 6.2; as telas `p2-07` a `p2-09` olhadas a 1366 e 390 px, nos dois temas. Passo 7: um commit por unidade.
    - Linha da tabela de referência: "O link", embrulhado; a página é [ideia nossa].
    - O PR lista os três textos propostos (Notas) para a palavra do fundador.
    - Depois do grupo, a QA pela skill `conexus-qa`, por quem não construiu, com o exemplo "Lea manda o link ao contador".
    - A CI roda `npm run check`, os testes do servidor e os de `apps/web`.

- [ ] 7. Grupo 7: o HubSpot pelo login do kit (bloco B, pode começar agora; fecha com o dublê na forma da referência) (um PR)
  - [ ] 7.1 O conector `hubspot`, o dublê e a conformidade (um commit)
    - **Arquivos:** `packages/connectors/src/hubspot/` (novo: `definition.ts`, `operations/` com `contatos.ts`, `empresas.ts`, `negocios.ts`, `nota.ts` e `index.ts`, `fake.ts`, `fake-data.ts`, `skill/SKILL.md` e uma parte por assunto, `logo.svg`, `hubspot.test.ts`), `packages/connectors/src/index.ts`, `packages/connectors/src/sankhya/sankhya.test.ts`, `packages/connectors/src/kernel/kernel.test.ts`, `apps/server/src/hub/connectors/role-kit.test.ts`.
    - **Referência a seguir:** `packages/connectors/src/mercado-livre/definition.ts:17-67` (um conector com `oauth2Code`, conta reportada e leituras de lista); `packages/connectors/src/kernel/oauth.ts:12-53` (`OAuth2CodeAuth` e `oauth2Code`); `packages/connectors/src/mercado-livre/fake.ts:273` e `recordings.ts` (o dublê lendo as gravações); `packages/connectors/src/kernel/conformance-session.ts:24`, `:55` (`OAuthFake` e o login pelo dublê); `packages/connectors/src/sankhya/operations/vendas.ts:181` (`lancarPedido`, a escrita de hoje pelo `writes`, com `uncertain`, `mark` e `idOf` da decisão 0062); `nango@e6c6131 packages/providers/providers.yaml:13028-13029` (as páginas de autorização e de token), `:13038-13045` (a origem e a paginação por `after`); `integration-templates@9afa0aab integrations/hubspot/actions/list-contacts.ts:8-16`, `:29-38`, `:57`, `list-companies.ts:33-42`, `list-deals.ts:30-39`, `create-note.ts:32-77`, `fetch-account-information.ts:6-15`, `:24-29`, `whoami.ts:20`.
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      export const hubspot = defineConnector({ id: 'hubspot', name: 'HubSpot', version: '1.0.0',
        origin: 'https://api.hubapi.com',
        auth: oauth2Code({ app: { from: 'installation' },
          authorize: { url: 'https://app.hubspot.com/oauth/authorize', pkce: '`S256`',
            params: { scope: 'oauth crm.objects.contacts.read crm.objects.companies.read crm.objects.deals.read crm.objects.contacts.write settings.account.read' } },
          token: { path: '/oauth/2026-09/token' },
          answer: z.object({ access_token, refresh_token: optional, expires_in }).transform(...),   // como o Mercado Livre
          refusals: { grant: ['invalid_grant'], app: ['invalid_client'] } }),
        account: { kind: 'reported', exclusive: true, who: { path: '/account-info/v3/details',
          answer: z.object({ portalId: z.number().int() }).transform(({ portalId }) => ({ ref: AccountRef.parse(String(portalId)), label: `Portal ${portalId}` })) } },
        category: 'CRM', summary: 'O CRM onde a empresa guarda contatos, empresas e negócios.', logo: LOGO,
        perProject: 'many', callLimit: { countedBy: 'ACCOUNT' },
        subjects: { contatos: 'Contatos', empresas: 'Empresas', negocios: 'Negócios' },
        operations: [contatos, empresas, negocios], writes: [notaNoContato], check: contatos, skill: readSkill(SKILL) })
      // cada leitura: GET /crm/v3/objects/<objeto>, list CURSOR ('after', 'paging.next.after', 'results'), limit 100
      // contatos: personal no e-mail e no telefone
      // notaNoContato: post('/crm/v3/objects/notes') com properties { hs_note_body, hs_timestamp } e a associação ao contato,
      //   associationCategory 'HUBSPOT_DEFINED', associationTypeId 202; idempotent false; uncertain/mark/idOf (decisão 0062)
      ```
      O caminho de token, a forma da resposta do token, as recusas e o limite por conta ficam marcados "a confirmar na gravação" num comentário que a 9.1 tira. Até a gravação, o dublê responde no envelope mais próximo medido (testing T29): as formas das funções da estante.
    - **Testes:** os três que conferem o catálogo exato ganham o HubSpot depois do Mercado Livre: `sankhya.test.ts:45-49`, a lista de ids passa a `['sankhya', 'mercado-livre', 'hubspot']`; `kernel.test.ts:129-133`, o `PerProject` declarado ganha `hubspot: 'many'`; `role-kit.test.ts:5-13`, a lista de recursos ganha `['hubspot', 'connector_hubspot']`. `hubspot.test.ts`: `runConformance(hubspot, hubspotFake())`, as verificações que o `main` tiver (treze, depois do grupo 1); "a lista de contatos anda cada página uma vez pelo `after`"; "a conta é o portal".
    - **Mutações à mão:** tirar o `personal` do e-mail (a verificação 6 falha pelo `findUndeclared`); trocar `after` por `cursor` na paginação (o caso das páginas falha).
    - **Pronto quando:** `npm test -w @conexus/connectors` passa com o HubSpot no catálogo, e o Sankhya e o Mercado Livre seguem verdes.
    - _Requisitos: 6.1, 7.6, 8.1, 8.4_
  - [ ] 7.2 O HubSpot no Hub: o login pelo dublê, a leitura e a escrita com cartão pela porta (um commit)
    - **Arquivos:** `apps/server/src/hub/connectors/test-connections.ts`, `apps/server/src/hub/identity/test-kit.ts`, `apps/server/src/hub/connectors/hubspot-door.test.ts` (novo), `docs/how-to/add-a-connector.md`, `scripts/rerun-never.json`.
    - **Referência a seguir:** `apps/server/src/hub/connectors/test-connections.ts:57-115` (`appsOf` e `mercadoLivreOn`: o dublê servido, `connectorOrigins` e `connectorApps`); `apps/server/src/hub/connectors/sign-ins.test.ts:22`, `:56`, `:66` (começar, sem as chaves do app, completar); `apps/server/src/hub/connectors/apps.ts:14-21` (`CONNECTOR_NOT_CONFIGURED`); `apps/server/src/hub/connectors/connections-refresh.test.ts:32` (a renovação); `apps/server/src/hub/connectors/executor.test.ts:223` (a recusa inteira); `apps/server/src/hub/identity/test-kit.ts:40-67` (`TEST_KIT`, o kit do Hub de teste escrito à mão, testing T6), `apps/server/src/hub/identity/roles.ts:86-101` e `may-use.ts:106` (o dono recebe as operações do kit de teste e `mayUse` pergunta `connector_<id>`); `apps/server/src/hub/connectors/write.test.ts:8` (o pedido de escrita com o cartão); `apps/server/src/hub/connectors/personal-read.test.ts` (a retirada do dado pessoal); `apps/server/src/hub/connectors/limits.test.ts` (o limite por turno); `docs/how-to/add-a-connector.md:37` (a chave `<id>` no arquivo de `HUB_CONNECTOR_APPS_FILE`).
    - **O que sai:** o `'mercado-livre'` fixo de `appsOf`: a função passa a receber o id do conector.
    - **O que entra:**
      ```ts
      // test-connections.ts
      export function appsOf(id: ConnectorId, app: AppKeys): Config['connectorApps']   // as chamadas de hoje passam 'mercado-livre'
      export async function hubspotOn(t: TestContext, a = {})   // o molde de mercadoLivreOn com hubspotFake e appsOf('hubspot', fake.app)
      // identity/test-kit.ts, em TEST_KIT
      { id: 'hubspot', resource: 'connector_hubspot', operations: [
        { id: 'contatos', class: 'read' }, { id: 'empresas', class: 'read' }, { id: 'negocios', class: 'read' }, { id: 'notaNoContato', class: 'write' } ] }
      ```
      Nenhuma mudança no código do Hub: a configuração da instalação é a entrada `hubspot` no arquivo de `HUB_CONNECTOR_APPS_FILE`, que o `how-to` passa a dar como exemplo, com o endereço de retorno `{publicOrigin}/integrations/return` que o app do HubSpot registra.
    - **Testes:** `hubspot-door.test.ts`, pela porta pública: "a dona começa o login e recebe a página do dublê com os escopos do HubSpot"; "sem a entrada hubspot no arquivo de apps, CONNECTOR_NOT_CONFIGURED"; "completar cria a ligação selada com a conta do portal"; "o Builder lê os contatos com a mesma forma de uma leitura do Mercado Livre"; "o e-mail e o telefone saem como dado pessoal"; "o HubSpot que recusa a leitura chega com o status e o corpo"; "o 401 marca precisa religar"; "a renovação recusada marca precisa religar"; "a nota num contato mostra o cartão e sai uma vez"; "o limite por turno conta a chamada do HubSpot"; "Desligar apaga a linha sem chamada de revogação". O arquivo entra em `scripts/rerun-never.json`.
    - **Mutações à mão:** tirar `writes` do conector (o caso do cartão falha); trocar o id em `appsOf` (o caso do login falha); tirar `notaNoContato` de `TEST_KIT` (o caso do cartão recebe `NOT_IN_ROLE`).
    - **Pronto quando:** `node scripts/test-run.ts --test-concurrency=1 apps/server/src/hub/connectors/hubspot-door.test.ts` passa, e os testes de `sign-ins.test.ts` seguem verdes.
    - _Requisitos: 6.2, 6.3, 6.4, 6.6, 6.7, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  - [ ] 7.3 Ponto de conferência do grupo 7
    - Rodar `hubspot-door.test.ts`, `sign-ins.test.ts`, `npm test -w @conexus/connectors` (Sankhya e Mercado Livre inclusos), os testes do servidor que importam `mercadoLivreOn` e `appsOf`, `npm run test:scripts`, `npm run typecheck`, `npm run check`, `npm run quality` em segundo plano.
    - Passo 6 da skill: `deslop`, `no-comments`, as mutações de 7.1 e 7.2. Passo 7: um commit por unidade.
    - O PR diz que o dublê está na forma da referência, "a confirmar na gravação", e que a prova que grava é a 9.1.
    - Linhas da tabela de referência: "O login do HubSpot e do Gmail", nativo (o login do kit); "As operações do HubSpot e do Gmail", nativo (o formato do kit).
    - A CI roda `npm run check` e todos os testes, com dublês. Nenhuma rodada real roda na CI.

- [ ] 8. Grupo 8: o Gmail, só ao vivo, pelo login do kit (bloco B, espera os grupos 1 e 3; fecha com o dublê na forma da referência) (um PR)
  - [ ] 8.1 A origem de login no kit (um commit)
    - **Arquivos:** `docs/decisions/0071-a-login-origin-beside-the-connector-origin.md` (novo; o número é o próximo livre), `packages/connectors/src/kernel/oauth.ts`, `packages/connectors/src/kernel/oauth.test.ts`, `packages/connectors/src/kernel/conformance-session.ts`, `apps/server/src/hub/connectors/executor.ts`, `apps/server/src/hub/connectors/connections-refresh.test.ts`.
    - **Referência a seguir:** `packages/connectors/src/kernel/oauth.ts:12-30` (`OAuth2CodeAuth.token`), `:32-53` (as recusas de `oauth2Code`), `:59-75` (`authorizeUrl` põe a página no endereço do dublê); `packages/connectors/src/kernel/request.ts:21-36` (`toRequest`, conferido contra a origem que recebe); `apps/server/src/hub/connectors/executor.ts:257-259` (`originFor`), `:325-336` (`grant`, a troca e a renovação mandadas a `originOf(connector)`); `packages/connectors/src/kernel/conformance-session.ts:75-86` (a troca no dublê); `nango@e6c6131 packages/providers/providers.yaml:11420`, `:11539` (o token do Google e a origem do Gmail em origens diferentes).
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // oauth.ts
      token: Readonly<{ path: `/${string}`; /** A origem da troca e da renovação, quando não é a do conector (o Google). */ origin?: `https://${string}` }>
      // oauth2Code: token.origin que não é uma origem https sem caminho (URL.canParse, new URL(o).origin === o, https:,
      //   como Origin em definition.ts:73-79) -> throw new Error('The token origin must be an https origin')
      /** Para onde vão a troca e a renovação: o dublê configurado, a origem de login, ou a do conector. */
      export function loginOriginOf(connector: Connector & Readonly<{ auth: OAuth2CodeAuth }>, double?: string): string {
        return double ?? connector.auth.token.origin ?? connector.origin
      }
      // executor.ts, grant: toRequest(connector, request, null, loginOriginOf(connector, deps.origins.get(connector.id)))
      // conformance-session.ts: a troca no dublê continua no endereço do dublê
      ```
      O registro de decisão "proposto" diz: o pedido continua montado só em `toRequest`, conferido contra a origem que recebe (security S36); a origem de login só leva a troca e a renovação; o bearer da ligação nunca vai a ela.
    - **Testes:** `oauth.test.ts`: "uma origem de token que não é https, ou que traz caminho, é recusada"; com um conector de teste que declara `token.origin`: "com o dublê, a troca vai ao dublê" e "sem o dublê, vai à origem de login"; com um que não declara: "vai à origem do conector"; `connections-refresh.test.ts`: "com o dublê configurado, a renovação do Mercado Livre segue no dublê".
    - **Mutações à mão:** inverter a ordem de `double` e `token.origin` em `loginOriginOf` (o caso "com o dublê" do conector com `token.origin` falha); tirar `token.origin` da cadeia (o caso "sem o dublê" falha); tirar a recusa de origem com caminho.
    - **Pronto quando:** `npm test -w @conexus/connectors` passa, e `connections-refresh.test.ts` e `sign-ins.test.ts` seguem verdes.
    - _Requisitos: 6.5_
  - [ ] 8.2 O conector `google-mail`, só ao vivo, e o Gmail no Hub (um commit)
    - **Arquivos:** `packages/connectors/src/google-mail/` (novo: `definition.ts`, `operations/` com `buscar.ts`, `ler.ts` e `index.ts`, `fake.ts`, `skill/SKILL.md`, `logo.svg`, `google-mail.test.ts`), `packages/connectors/src/index.ts`, `packages/connectors/src/sankhya/sankhya.test.ts`, `packages/connectors/src/kernel/kernel.test.ts`, `apps/server/src/hub/connectors/role-kit.test.ts`, `apps/server/src/hub/connectors/sign-ins.ts`, `apps/server/src/hub/identity/test-kit.ts`, `apps/server/src/hub/connectors/test-connections.ts`, `apps/server/src/hub/connectors/google-mail-door.test.ts` (novo), `apps/server/src/hub/copies/propose.test.ts`.
    - **Referência a seguir:** o mesmo da 7.1; `nango@e6c6131 packages/providers/providers.yaml:11419-11424` (a página de autorização, o token e `access_type`/`prompt`), `:11532-11539` (o Gmail e a origem); `integration-templates@9afa0aab integrations/google-mail/actions/list-messages.ts:5-31`, `:39-50`, `get-message.ts:6-13`, `:67`, `:83`; `packages/connectors/src/kernel/definition.ts:17-19` (a conta `none`); `apps/server/src/hub/connectors/sign-ins.ts:251`, `:296` (`completeSignIn` pede `who` sempre, e `written` grava a conta); `apps/server/src/hub/connectors/executor.ts:343-344` (`who` lança sem conta `reported`); `packages/connectors/src/kernel/conformance-session.ts:106` (o kit já pula a conta `none`); `apps/server/src/hub/connectors/tables.ts:100-104` (`connection_account` aceita os dois nulos); `apps/server/src/hub/identity/test-kit.ts:40-67`.
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      export const googleMail = defineConnector({ id: 'google-mail', name: 'Gmail', version: '1.0.0', liveOnly: true,
        origin: 'https://gmail.googleapis.com',
        auth: oauth2Code({ app: { from: 'installation' },
          authorize: { url: 'https://accounts.google.com/o/oauth2/v2/auth', pkce: '`S256`',
            params: { scope: 'https://www.googleapis.com/auth/gmail.readonly', access_type: 'offline', prompt: 'consent' } },
          token: { origin: 'https://oauth2.googleapis.com', path: '/token' },
          answer: ..., refusals: { grant: ['invalid_grant'], app: ['invalid_client'] } }),
        account: { kind: 'none' },
        category: 'E-mail', summary: 'O correio da empresa: os agentes buscam e leem mensagens, e nada é copiado.', logo: LOGO,
        perProject: 'many', callLimit: { countedBy: 'ACCOUNT' },
        subjects: { mensagens: 'Mensagens' }, operations: [buscarMensagens, lerMensagem], check: buscarMensagens, skill: readSkill(SKILL) })
      // buscarMensagens: GET /gmail/v1/users/me/messages { q, maxResults, pageToken } -> { messages: [{ id, threadId }], nextPageToken, resultSizeEstimate }
      // lerMensagem: GET /gmail/v1/users/me/messages/{id} { format } ; personal nos endereços, no assunto e no corpo (a confirmar na gravação)
      // sem copy e sem writes
      // test-connections.ts: googleMailOn, o molde de hubspotOn
      // identity/test-kit.ts: { id: 'google-mail', resource: 'connector_google-mail', operations: [{ id: 'buscarMensagens', class: 'read' }, { id: 'lerMensagem', class: 'read' }] }
      // sign-ins.ts, completeSignIn, depois da troca:
      //   const who = connector.account.kind === 'none' ? { kind: 'OK', account: null } : await deps.executor.who(...)
      //   written grava accountRef: null, accountLabel: null quando account é null; os ramos UNREACHABLE e UNREADABLE de who seguem
      ```
    - **Testes:** os três do catálogo exato ganham o Gmail depois do HubSpot: `sankhya.test.ts:45-49` com `'google-mail'` ao fim da lista; `kernel.test.ts:129-133` com `'google-mail': 'many'`; `role-kit.test.ts:5-13` com `['google-mail', 'connector_google-mail']`. `google-mail.test.ts`: `runConformance(googleMail, googleMailFake())`; "o Gmail não oferece tabela". `google-mail-door.test.ts`, pela porta pública: "o login vai à página do Google no dublê e a troca ao dublê, não a gmail.googleapis.com"; "completar o Gmail cria a ligação sem conta" (`accountRef` e `accountLabel` nulos); "sem a entrada google-mail no arquivo de apps, CONNECTOR_NOT_CONFIGURED"; "a renovação do Gmail vai ao dublê e grava o token novo"; "Desligar o Gmail apaga a linha sem chamada de revogação"; "o Builder busca e lê uma mensagem"; "o endereço do remetente sai como dado pessoal"; "listConnectionObjects do Gmail é vazio". Em `google-mail.test.ts`, também "sem o dublê, a troca do Gmail vai a https://oauth2.googleapis.com" (`loginOriginOf(googleMail)`). `propose.test.ts`: "propor uma cópia do Gmail dá COPY_LIVE_ONLY" com o conector de verdade no lugar do de teste de 3.3.
    - **Mutações à mão:** tirar `liveOnly: true` (a verificação 10 e o caso de `propose.test.ts` falham); tirar `token.origin` do Gmail (o caso de `google-mail.test.ts` sem o dublê falha); chamar `who` mesmo com a conta `none` (o caso "completar o Gmail cria a ligação sem conta" responde 500).
    - **Pronto quando:** `npm test -w @conexus/connectors` passa, os dois testes do servidor passam e a Página_Integrações mostra o Gmail com a marca só ao vivo.
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 8.2, 8.4_
  - [ ] 8.3 Ponto de conferência do grupo 8
    - Rodar `google-mail-door.test.ts`, `propose.test.ts`, `connections-refresh.test.ts`, `sign-ins.test.ts`, `npm test -w @conexus/connectors`, `npm run test:scripts`, `npm run docs`, `npm run typecheck`, `npm run check`, `npm run quality` em segundo plano.
    - Passo 6 da skill: `deslop`, `no-comments`, as mutações de 8.1 e 8.2. Passo 7: um commit por unidade.
    - O PR diz que o dublê está na forma da referência, "a confirmar na gravação", e que a prova que grava é a 9.2.
    - Linhas da tabela de referência: "A origem de login", embrulhado (um campo a mais no login do kit); "Só ao vivo" com o Gmail.
    - A CI roda `npm run check` e todos os testes, com dublês.

- [ ] 9. Grupo 9: a gravação dos corpos reais (bloco B, espera os grupos 7 e 8 e os dois atos do fundador: o app de login no HubSpot e no Google, e uma conta de teste de cada um) (um PR)
  - [ ] 9.1 A gravação dos corpos do HubSpot (um commit)
    - **Arquivos:** `scripts/record-connector.ts`, `scripts/record-connector-calls.ts`, `scripts/record-connector.test.ts`, `packages/connectors/src/hubspot/recordings/` (novo), `packages/connectors/src/hubspot/recordings.ts` (novo), `packages/connectors/src/hubspot/definition.ts`, `packages/connectors/src/hubspot/fake.ts`.
    - **Referência a seguir:** `scripts/record-connector.ts:1-16`, `:26-34` (o pedido como o Hub o monta, o token só do ambiente, a pasta fora do repositório, `--swap`); `packages/connectors/src/mercado-livre/recordings/` e `recordings.ts` (a forma de uma gravação e a leitura dela pelo dublê); `packages/connectors/src/kernel/oauth.ts:59-102` (`authorizeUrl` e `codeRequest`).
    - **O que sai:** o `z.literal('mercado-livre')` de `Args.connector`; o envelope mais próximo no dublê do HubSpot, onde a gravação o troca; os comentários "a confirmar na gravação" que a gravação respondeu.
    - **O que entra:** `Args.connector` passa a `z.enum(['mercado-livre', 'hubspot'])`, com os casos do HubSpot: as três listas, a conta, uma recusa 401 e uma 403. Um modo `--sign-in` faz o login do próprio kit: lê as chaves do app de teste de um arquivo fora do repositório, abre `authorizeUrl` num endereço `http://127.0.0.1:<porta>` que o app de teste registra, recebe o código, faz a troca por `codeRequest`, guarda o token só na memória do processo, manda os casos e sai. Na volta, o script confere que o `state` é o que ele mandou e recusa outro, como a volta do Hub faz. O token nunca chega a um arquivo nem à saída (security S40). A rodada 1 das três, autorizada pelo fundador, com a conta de teste dele, só de leitura: a escrita de nota não é mandada, e o dublê dela segue no envelope mais próximo medido; a escrita real só é provada pelo uso de fechamento do `D1` (9.3), que não grava corpo.
    - **Testes:** `scripts/record-connector.test.ts` ganha os casos do HubSpot no `--plan`, "o modo de login não escreve o token em lugar nenhum" e "uma volta com outro state é recusada e nada é trocado"; `npm run test:scripts` passa; `hubspot.test.ts` passa com as gravações.
    - **Mutações à mão:** tirar a conferência do `state` (o caso do state alheio falha); escrever o token na saída (o caso do token falha).
    - **Pronto quando:** as gravações estão na pasta com valores inventados, o dublê as lê, e nenhuma credencial chegou a um arquivo (`S40`).
    - _Requisitos: 8.3_
  - [ ] 9.2 A gravação dos corpos do Gmail (um commit)
    - **Arquivos:** `scripts/record-connector.ts`, `scripts/record-connector-calls.ts`, `scripts/record-connector.test.ts`, `packages/connectors/src/google-mail/recordings/` (novo), `packages/connectors/src/google-mail/recordings.ts` (novo), `packages/connectors/src/google-mail/definition.ts`, `packages/connectors/src/google-mail/fake.ts`.
    - **Referência a seguir:** a 9.1.
    - **O que sai:** o envelope mais próximo no dublê do Gmail; os comentários "a confirmar na gravação" que a gravação respondeu.
    - **O que entra:** `Args.connector` ganha `'google-mail'`, com os casos: a busca, a leitura de uma mensagem em `full`, uma recusa 401. O mesmo modo `--sign-in` da 9.1, com a conferência do `state`, que manda a troca à origem de login do Google por `loginOriginOf`. A rodada 2 das três, autorizada pelo fundador, com a conta de teste dele, só de leitura. A gravação diz os caminhos de dado pessoal da mensagem.
    - **Testes:** `scripts/record-connector.test.ts` ganha os casos do Gmail no `--plan`; `npm run test:scripts` passa; `google-mail.test.ts` passa com as gravações.
    - **Mutações à mão:** nenhuma.
    - **Pronto quando:** as gravações estão na pasta com valores inventados, o dublê as lê, e nenhuma credencial chegou a um arquivo (`S40`).
    - _Requisitos: 8.3_
  - [ ] 9.3 Ponto de conferência do grupo 9, e o fechamento do `D1`
    - Rodar `npm test -w @conexus/connectors`, `npm run test:scripts`, `hubspot-door.test.ts`, `google-mail-door.test.ts`, `npm run typecheck`, `npm run check`.
    - Passo 6 da skill: `deslop`, `no-comments`, as mutações de 9.1. Passo 7: um commit por unidade.
    - O PR troca os corpos do dublê pelos gravados e tira os comentários "a confirmar na gravação" que a gravação respondeu; o que ela não respondeu fica nomeado no PR.
    - A CI roda `npm run check` e todos os testes, com dublês. Nenhuma rodada real roda na CI.
    - Depois do merge, a rodada 3 das três, autorizada pelo fundador: o uso de fechamento do `D1` na instalação da nuvem, com o app de login do HubSpot no arquivo de segredo da instalação, numa empresa de teste (delivery L17). A ligação nasce pelo login do kit, o Builder lê, uma escrita mostra o cartão, e Sankhya e Mercado Livre seguem funcionando.
    - _Requisitos: 8.5_

## Notas

- **A decisão da fonte única.** O fundador decidiu em 2026-11-14 (P3 do índice, no lugar da H5) uma fonte só de conector, o kit. Nenhuma unidade chama a Nango, e a conta da Nango deixou de ser pré-requisito. A Nango segue citada só como referência de padrão (o prazo do link, os campos de credencial, as páginas de autorização e de token, `API_KEY`).
- **O texto do roteiro e da trilha.** O PR que leva esta spec ao repositório já troca a Nango e a H5 por esta decisão, no `D1` do roteiro e da página da trilha Dados.
- **O que espera um ato do fundador.** Criar o app de login no HubSpot e no Google, com o endereço de retorno `{publicOrigin}/integrations/return` e, para a gravação, um endereço `http://127.0.0.1:<porta>` no app de teste; entregar as chaves como arquivo de segredo da instalação, nunca num repositório; emprestar uma conta de teste de cada um, só de leitura. Até lá, os dublês usam o envelope mais próximo medido, e o grupo 9 é a prova que grava.
- **O que a referência não deu, e fica para a gravação.** Se o HubSpot aceita PKCE `S256`, que o kit exige; o caminho de token do HubSpot (`/oauth/2026-09/token` no `providers.yaml`); a forma da resposta do token e as recusas dos dois; onde cada um conta o limite de chamadas; a forma da mensagem inteira do Gmail e os caminhos de dado pessoal dela.
- **A conta do Gmail é `none`.** O Gmail só diz o endereço de e-mail como conta, um dado pessoal que viraria o rótulo da ligação. O nome que a empresa dá separa as ligações.
- **Nenhum dos dois declara revogação.** `oauth2Code` exige `{account}` no caminho de revogação, e a do HubSpot e a do Google não o levam. Desligar apaga a linha e as chaves; o fundador revoga no sistema, se quiser.
- **A origem de login (8.1)** é a única mudança do kit no bloco B. Ela pede um registro de decisão "proposto", e o grupo 8 só começa com ele no PR.
- **O que espera o quê no bloco C.**
  - `ApiKeyAuth` (`C9`) entra com o primeiro sistema que o usa, o Omie, no `D3` (data `docs/steps/trilhas/dados.md:74-75`). Um modo de login sem conector não tem dublê gravado nem conformidade que o prove.
  - A entrada conversada entra pela reescrita do cartão do PR 982, com a skill `conexus-scope`, no próprio PR. O cartão reescrito carrega os requisitos 9.1 a 9.8. As mudanças que ele recebe, pela tabela de `C10` do desenho:
    - U1, Ligue seus sistemas: nada muda, e a janela é a de quatro passos do grupo 4.
    - U2, a skill `conexus-intake`: as etapas passam a ser cinco, Empresa, Desafios, Objetivos, Sistemas e Salvar, escritas com `task_write` e fechadas com `task_check`; a skill manda marcar a suposição com "(suposição, confirmar)".
    - U3, a conversa da entrada: a tela ganha a barra de etapas no topo, que é a lista de tarefas do Mastra, e o painel das cinco páginas à direita (`p2-01`).
    - U4, Em aberto: nada muda.
    - U5, as instruções pelo cartão: o texto único `propose_company_instructions` dá lugar a cinco páginas da Memória da empresa (Empresa, Clientes, Desafios e objetivos, Sistemas, Glossário), cada uma proposta por `propose_company_memory` e salva pelo toque, com Salvar todos (`p2-03`).
    - U6 e U7: nada muda.
    - Unidade nova, os sistemas na conversa: a ferramenta `entry_systems` (`apps/server/src/builder/assistant/entry-systems.ts`) e o cartão com Cópia ou Ao vivo e Ligar (`p2-02`), que depende do `liveOnly` do grupo 3.
- **A Revisão tem duas linhas, decidido.** Tabelas e intervalo (`C4`). A linha de quem lê precisaria de uma rota que dissesse os papéis antes de a cópia existir, e a parte 4 só dá a função `rolesReadingSource`. A cópia nasce marcada pela regra N3b-1 de qualquer jeito, e a aba **Quem lê** da parte 4 mostra e muda as marcas.
- **O login por autorização pelo link, decidido.** Fica fora desta spec. `completeSignIn` admite por sessão, e quem recebe o link não tem sessão. O link vale para sistema de acesso `FIELDS`, e a janela não mostra **Enviar link** nos outros.
- **Religar por link** fica fora desta spec. O link só cria uma ligação nova; Conectar de novo segue pela janela de quem tem a sessão.
- **Os textos propostos.** `CONNECTOR_REFUSED` na janela: "O <Sistema> recusou a leitura.", com a resposta do sistema. A página do link depois do envio: "Pronto. A ligação com o <Sistema> foi feita. Pode fechar esta página." A página do link vencido: "Este link venceu. Peça outro a quem enviou.", porque a rota responde 404 sem o nome de quem pediu (security S10). O PR do grupo 6 lista os três para a palavra do fundador.
- **Um sistema que não é só ao vivo e não oferece tabela, decidido** (o Mercado Livre de hoje): depois do teste a janela vai direto ao **Ligado**, sem os passos 3 e 4, e o **Ligado** não lista cópia (requisito 4.10).
- **As dependências de outras partes.** A 1.3 espera a descrição de `CopyDefinitionV1` (parte 1, `C2`) e a saída de `CGC_CPF` do modelo `clientes` (parte 4). A 3.2 espera `CopySample` e `COPY_SAMPLE_ROWS` (parte 1, `C4`). A 3.1 move o `catalogOf` da parte 1, se ele já estiver no `main`.

## Grafo de dependência das tarefas

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "5.1", "7.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "5.2", "7.2"] },
    { "id": 2, "tasks": ["1.3", "2.3", "5.3", "7.3"] },
    { "id": 3, "tasks": ["1.4"] },
    { "id": 4, "tasks": ["3.1"] },
    { "id": 5, "tasks": ["3.2", "3.3"] },
    { "id": 6, "tasks": ["3.4"] },
    { "id": 7, "tasks": ["4.1", "8.1"] },
    { "id": 8, "tasks": ["4.2", "8.2"] },
    { "id": 9, "tasks": ["4.3", "8.3"] },
    { "id": 10, "tasks": ["4.4", "9.1"] },
    { "id": 11, "tasks": ["6.1", "9.2"] },
    { "id": 12, "tasks": ["6.2", "9.3"] },
    { "id": 13, "tasks": ["6.3"] }
  ]
}
```
