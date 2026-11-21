# Documento de desenho: parte 2, o conector, com a entrada conversada

**Emenda de 2026-11-21: a marca "só ao vivo" sai.** Vale a nota no topo de [requirements.md](requirements.md); o que este arquivo diz da marca `liveOnly` e da lei que a confere não vale.

Base: `main` do Conexus em `0d4c5730`. Todo caminho é relativo à raiz do repositório. Depende da parte 1: a regra de nome, a descrição nos modelos de cópia e o catálogo. **[CARTÃO x]** é o cartão em rascunho da Entrada conversada, no PR https://github.com/developmentconexus-ops/conexus/pull/982, commit `b79bfbe1`, linha x. A Nango, referência de padrão, é citada pelo commit: `nango@e6c6131` e `integration-templates@9afa0aab`.

## Visão geral

No fim desta parte a empresa liga o Sankhya, o HubSpot e o Gmail pelo mesmo caminho, em quatro passos, e os três aparecem iguais no catálogo. Quem não tem a senha manda um link para quem tem. Uma empresa nova entra por uma conversa que aprende a empresa e leva a ligar o primeiro sistema. São os marcos `D1` e parte de `D3` [visto, `docs/roadmap.md:45`, `:47`].

Há uma fonte só de conector, o kit do Conexus (decisão do fundador de 2026-11-14, P3 do índice, no lugar da H5; registro [0069](../../../../decisions/0069-connectors-one-source-the-kit.md)). Todo conector fica no formato do kit, as cópias rodam no nosso motor, e o login por autorização, a guarda e a renovação do token são do kit, com o app de login da instalação em cada sistema. A Nango fica só como referência de padrão: o prazo do link, os campos de credencial, as páginas de autorização e de token de cada sistema.

A parte se divide em três blocos:

| Bloco | O que entra | Pode começar |
| --- | --- | --- |
| **A. O kit e a janela Ligar** | A descrição do sistema, a declaração "só ao vivo", as quatro operações, os quatro passos da janela, o link para outra pessoa | Agora |
| **B. Os primeiros sistemas comuns, pelo login do kit** | O HubSpot e o Gmail, só ao vivo, cada um com o login por autorização do kit e o app de login da instalação | Agora. A gravação dos corpos reais espera dois atos seus: criar o app de login no HubSpot e no Google, e emprestar uma conta de teste de cada um |
| **C. O que espera outra coisa** | O login por chave fixa (espera o primeiro sistema que o usa, no `D3`). A entrada conversada (espera a aprovação do cartão do PR 982) | Quando a espera acabar |

O que fica de fora: os gatilhos (`D5`), a medição por empresa (`D6`), a nova tentativa em falha passageira e a contagem de novo e mudado, que nenhum marco desta parte pede, e religar uma ligação por link (`C5`).

## Arquitetura

```
 Integrações ─► janela Ligar: Sistema ► Acesso ► O que copiar ► Revisão ► Ligado
                    │            │  └─ Enviar link ─► página pública do link (30 min, um uso)
                    │            │
                    │   chaves coladas            Entrar com <sistema> (login por autorização do kit)
                    ▼            ▼                              ▼
          hub/connectors: connection, sempre selada com a chave da instalação
                                   │
                                   ▼
                     o executor único: a operação do kit vira um pedido
                                   │
                     direto ao sistema, com o token que o kit buscou e renova
```

Sankhya, Mercado Livre, HubSpot e Gmail são definições do kit. A porta, o funil de escrita com o cartão, os papéis e a conformidade valem iguais para todos, sem mudança [visto, `apps/server/src/hub/connectors/executor.ts:262-295`, `packages/connectors/src/kernel/conformance.ts:213-256`].

### O que cada referência faz no mesmo ponto

| Ponto | Referência | O que a spec faz |
| --- | --- | --- |
| O formulário sai de dados | Um formulário que sai de um modelo de campos. Os campos `credentials` do `providers.yaml` da Nango [visto, `nango@e6c6131 packages/types/lib/providers/provider.ts:23-44`] | Igual, e já é assim: os campos saem da definição do kit [visto, `packages/connectors/src/kernel/auth.ts:7-17`] |
| Testar uma vez e descobrir o que o sistema oferece | Testar a ligação e descobrir os conjuntos de dados. As quatro operações de um conector de dados: validar, listar, descrever e ver uma amostra | Igual: as quatro operações, com o mesmo nome em todo conector |
| Escolher os conjuntos e revisar antes da primeira rodada | Escolher os conjuntos e configurar a fonte. O cartão de revisão | Igual, em quatro passos e não sete (`T3`). Sem a escolha de camada (`T2`) |
| O link para quem tem a senha | Um link compartilhado, campo a campo. O `connect_link` da Nango, que vale 30 minutos | Igual: campo a campo, 30 minutos. A página é nossa |
| Uma fonte só de conector | As plataformas de dados maduras rodam os conectores delas, com o login delas | Igual (decisão 0069) |
| A separação entre copiar e consultar ao vivo | Uma fonte copiada e uma ferramenta ao vivo são duas portas diferentes | Igual: "só ao vivo" é declaração do sistema |
| A entrada que aprende a empresa | Uma entrada que conversa e grava o que aprende da empresa | Igual na forma, com o toque para gravar (B1) |

## Componentes e interfaces

## Bloco A: o kit e a janela Ligar

### `C1`. A descrição do sistema, separada do que só o kit executa

Hoje o tipo `Connector` mistura o que descreve o sistema (nome, categoria, resumo, logo, assuntos, operações) com o que só o executor usa (login, endereço, leitura de cópia) [visto, `packages/connectors/src/kernel/definition.ts:42-71`]. A tela e o catálogo leem o conector inteiro [visto, `apps/server/src/hub/connectors/connections.ts:40-55`].

Entra a descrição como um tipo próprio, tirada do conector por uma função pura. É o `SystemDescriptor` que o estudo propôs.

```ts
// packages/connectors/src/kernel/descriptor.ts (novo)
export type AccessForm =
  | Readonly<{ kind: 'FIELDS'; fields: Fields }>     // chaves coladas (auth.ts:7-17)
  | Readonly<{ kind: 'SIGN_IN' }>                    // autorização na página do sistema

export type SystemDescriptor = Readonly<{
  id: ConnectorId; name: string; version: string
  category: string; summary: string; logo: string
  perProject: 'one' | 'many'
  subjects: Readonly<Record<string, string>>
  operations: readonly Readonly<{ id: string; label: string; summary: string; class: OperationClass; subject: string; door: boolean }>[]
  access: AccessForm
  /** O sistema nunca é copiado: os agentes o consultam na hora (C2). */
  liveOnly: boolean
}>

export function descriptorOf(connector: Connector): SystemDescriptor
```

Quem passa a ler só a descrição: `entryOf` [visto, `connections.ts:40-55`], `subjectsOf` [visto, `apps/server/src/hub/connectors/catalog-subjects.ts:12-28`] e o `catalogOf` da parte 1. O executor continua lendo o `Connector`.

`ConnectorEntry` do contrato das telas ganha `access` e `liveOnly`, e perde `auth` e `fields`, que `access` substitui [visto, `packages/hub-api/src/connectors.ts:51-72`]. Sem dado de empresa nas linhas de hoje para migrar, a troca acontece num passo só (data D30).

### `C2`. A declaração "só ao vivo"

Hoje "o agente consulta e nunca copia" é uma frase do roteiro [visto, `docs/roadmap.md:32-34`], e nada no kit a declara.

```ts
// packages/connectors/src/kernel/definition.ts, no tipo Connector
/** O sistema nunca é copiado. Um conector assim não declara `copy`. */
liveOnly?: true
```

- `defineConnector` recusa o conector com `liveOnly` e `copy` juntos [visto, `definition.ts:82-109`, onde as outras recusas ficam].
- `propose` recusa a proposta de cópia de um sistema só ao vivo com a falha nova `COPY_LIVE_ONLY`. A máquina recusa, e não uma frase de prompt.
- `CatalogSystem` do contrato de acesso ganha `liveOnly: z.boolean()`, pela issue `contrato`.
- A página Integrações e a página Dados mostram a marca **só ao vivo** e a frase "nunca é copiado".

Sankhya e Mercado Livre não a declaram. O primeiro sistema que a declara é o Gmail (`C8`).

### `C3`. As quatro operações, com o mesmo nome em todo conector

| Operação | O que responde | Hoje no `main` |
| --- | --- | --- |
| **Testar** | A ligação funciona, ou o que o sistema respondeu | Existe: `check` [visto, `definition.ts:67`, `apps/server/src/hub/connectors/check.ts:37-70`] |
| **Listar o que oferece** | As tabelas que o sistema oferece para copiar | Em parte: os modelos de cópia [visto, `packages/connectors/src/kernel/copy.ts:203-206`], sem rota própria |
| **Descrever uma tabela** | As colunas com descrição, a chave e a coluna que diz o que mudou | Em parte: a definição do modelo |
| **Ver a amostra** | 5 linhas, lidas do sistema agora | Em parte: a prova lê uma página e guarda só contagens [visto, `apps/server/src/hub/connectors/copy-proof.ts:35-80`] |

As três últimas viram funções puras do kit e duas rotas do Hub. Nada novo é declarado no conector: o que o sistema oferece é o que os modelos de cópia dele já dizem.

```ts
// packages/connectors/src/kernel/objects.ts (novo)
export type OfferedObject = Readonly<{
  id: CopyName; label: string; description: string
  key: readonly string[]
  /** A coluna que diz o que mudou; null quando cada passada lê tudo. */
  changedSince: string | null
  columns: readonly Readonly<{ name: string; type: string; description: string }>[]
}>
/** O que o sistema oferece para copiar: vazio num conector sem `copy`, o que inclui todo só ao vivo (C2). */
export function objectsOf(connector: Connector): readonly OfferedObject[]
export function objectOf(connector: Connector, id: string): OfferedObject | undefined
```

```ts
// packages/hub-api/src/connectors.ts
export const listConnectionObjects = defineOperation({
  id: 'listConnectionObjects', method: 'GET',
  path: '/api/companies/{companyId}/connections/{connectionId}/objects',
  success: { status: 200, body: z.object({ objects: z.array(OfferedObject.extend({ copy: CopyId.nullable() })) }) },
})
export const previewConnectionObject = defineOperation({
  id: 'previewConnectionObject', method: 'GET',
  path: '/api/companies/{companyId}/connections/{connectionId}/objects/{object}/preview',
  success: { status: 200, body: z.object({ sample: CopySample }) },   // CopySample é o da parte 1 (C4)
  failures: [..., 'CONNECTION_NOT_READY', 'CONNECTOR_REFUSED', 'COPY_SOURCE_NEEDS_REAUTH', 'COPY_SOURCE_UNREACHABLE', 'COPY_SOURCE_UNREADABLE'],
})
```

- `listConnectionObjects` admite quem administra conexões (`manageConnections`) [visto, `apps/server/src/hub/identity/admission.ts:102-103`]. `copy` diz a cópia que já existe daquela tabela, para a janela mostrar a marca **já copiada**.
- `previewConnectionObject` lê uma página de 5 linhas pelo caminho da cópia, `copyPage` [visto, `apps/server/src/hub/connectors/copy-port.ts:141-152`], que já conta a chamada no limite da conexão e já retém o documento como leitura `copy` [visto, `apps/server/src/hub/connectors/read.ts:125-136`].
- Cada recusa da leitura tem a sua resposta, no molde de `sourceFailureOf` [visto, `copy-port.ts:156-170`]: `REFUSED` e `NOT_IN_ROLE` respondem `CONNECTOR_REFUSED` com o status, o código e o corpo (code C79); `AUTH_REFUSED`, `COPY_SOURCE_NEEDS_REAUTH`; `UNREACHABLE`, `DEADLINE`, `BUSY` e a fila vencida (`IN_LINE`), `COPY_SOURCE_UNREACHABLE`; `UNREADABLE`, `COPY_SOURCE_UNREADABLE` [visto, `read.ts:42-46`, `copy-port.ts:35-44`, `packages/hub-api/src/copy-failures.ts:69-105`].

A conformidade do kit, que hoje tem 9 verificações e nenhuma da cópia [visto, `packages/connectors/src/kernel/conformance.ts:213-256`], ganha quatro:

10. Todo conector que não é só ao vivo e declara `copy` oferece ao menos uma tabela, e todo conector só ao vivo não oferece nenhuma.
11. Cada tabela oferecida tem descrição, e cada coluna tem descrição.
12. Cada tabela oferecida diz a chave, e a coluna que diz o que mudou existe entre as colunas.
13. O dublê responde a primeira página de cada tabela oferecida com ao menos uma linha, nos tipos das colunas.

A verificação 11 depende da descrição nos modelos, que a parte 1 traz (`C2` dela).

### `C4`. A janela Ligar em quatro passos (`T3`)

A janela de hoje cola as chaves, liga e testa [visto, `apps/web/src/hub/connectors/link-dialog.tsx:272`]. Ela ganha os passos de escolher o que copiar e de revisar. O primeiro passo, escolher o sistema, é a página Integrações [visto, `apps/web/src/hub/connectors/integrations.tsx:94`].

| Passo | Tela do escopo | O que mostra e faz | Rota |
| --- | --- | --- | --- |
| 1. Sistema | `p2-04` | Integrações: ligadas e para ligar, com busca e a marca **só ao vivo** | `listConnections`, que existe |
| 2. Acesso, por chave | `p2-05` | Os campos do sistema, o link para a página onde a chave é gerada, **Enviar link** | `linkConnection`, que existe |
| 2. Acesso, por autorização | `p2-06` | O botão **Entrar com HubSpot** e o que o Conexus vai poder ler | `startConnectionSignIn`, que existe |
| Testando | `p2-10` | "Testando a ligação" e depois "Lendo o que o Sankhya oferece" | `testConnection`, que existe, e `listConnectionObjects` |
| Chave recusada | `p2-11` | "O Sankhya recusou as chaves", com a resposta do sistema por extenso | a resposta de `testConnection` |
| 3. O que copiar | `p2-12` | As tabelas oferecidas, com descrição, chave e modo. Marcar. Ver a amostra | `listConnectionObjects`, `previewConnectionObject` |
| 4. Revisão | `p2-13` | Duas linhas editáveis: tabelas e intervalo. **Ligar e copiar agora** | `enableCopy`, que existe, uma vez por tabela |
| Ligado | `p2-14` | A primeira cópia rodando por tabela, e "Pergunte ao Assistente sobre as vendas." | `listCopies`, que existe |
| Só ao vivo | `p2-15` | "nunca é copiado", e o que os agentes consultam na hora. Pula os passos 3 e 4 | nenhuma |

- **O texto do botão.** Hoje o botão de autorização diz "Continuar no <nome>" [visto, `apps/web/src/hub/connectors/text.ts:174`]. Passa a "Entrar com <nome>".
- **O intervalo.** Os valores são os de `CopyInterval`, e o padrão é 30 minutos [visto, `packages/hub-api/src/copies.ts:20-22`].
- **A Revisão tem duas linhas.** A linha de quem lê precisaria de uma rota que dissesse os papéis antes de a cópia existir, e a parte 4 só dá uma função do servidor, `rolesReadingSource`. A cópia nasce marcada pela regra N3b-1 de qualquer jeito, e a aba **Quem lê** da parte 4 mostra e muda as marcas.
- **Ligar e copiar agora** chama `enableCopy` para cada tabela marcada, cada chamada com a sua chave de tentativa [visto, `apps/server/src/hub/copies/enable.ts:132-172`]. A primeira rodada sai sozinha, como hoje [`enable.ts:166-170`]. Se uma tabela falhar, a tela diz qual, e as outras seguem.
- **Um sistema que não é só ao vivo e não oferece tabela** (o Mercado Livre de hoje): depois do teste a janela vai direto ao **Ligado**, sem os passos 3 e 4, e o **Ligado** não lista cópia.
- **Os estados.** Vazio, carregando, erro e recusa são os do escopo 4.4. A frase do membro já existe: "Só o dono ou um administrador liga, testa e desliga." [visto, `text.ts:15`].
- A janela continua uma janela só, com o passo no estado dela. Fechar no meio deixa a ligação feita e nenhuma cópia: a pessoa retoma pela página Dados ou por Integrações.

### `C5`. O link para outra pessoa

Quem liga nem sempre tem a senha. O link deixa outra pessoa, sem conta no Conexus, preencher os campos que faltam numa ligação nova. Religar uma ligação que existe por link fica fora desta spec.

A página é uma porta nova vinda de fora. Ela segue o molde da resposta a um convite, que já é uma página pública guardada por um segredo de um uso [visto, `apps/server/src/hub/identity/invitation-response.ts`], e o do login em curso de uma conexão, gasto com `DELETE … RETURNING` [visto, `apps/server/src/hub/connectors/sign-ins.ts:145-193`; decisão 0057].

```ts
// apps/server/src/hub/connectors/tables.ts
/** Um link para outra pessoa preencher a credencial de uma ligação nova: vale 30 minutos e uma vez. */
export const connectionLink = connectors.table('connection_link', {
  id: uuid('id').primaryKey(),
  companyId: text('company_id').notNull(),
  connectorId: text('connector_id').notNull(),
  // O nome que a ligação nova vai ter.
  name: text('name').notNull(),
  // O resumo SHA-256 do segredo do endereço. O segredo só existe no endereço.
  secretHash: text('secret_hash').notNull(),
  // Os campos que a outra pessoa preenche. Os que quem pediu já preencheu ficam selados aqui.
  asked: text('asked').array().notNull(),
  sealed: bytea('sealed'), keyId: text('key_id'),
  createdBy: text('created_by').notNull(),
  expiresAt: instant('expires_at').notNull(),
}, ...)   // a política da empresa, e a de leitura do papel dono de link_of (como connection_seals_select, tables.ts:111-115)
```

```ts
// packages/hub-api/src/connection-links.ts (novo)
export const CONNECTION_LINK_MINUTES = 30   // o prazo do connect_link da Nango
/** Cria o link. Só dono ou administrador, e só para sistema de acesso FIELDS. Devolve o endereço uma vez. */
createConnectionLink: POST /api/companies/{companyId}/connection-links
  body { connector, name, asked: string[], filled: Record<string, string> }  -> { url, expiresAt } | 409 LINK_NOT_FOR_SIGN_IN
/** A página do link, sem sessão: quem pediu, para qual sistema, e só os campos pedidos. */
readConnectionLink:   GET  /api/connection-links/{secret}   -> { company, askedBy, system: { name, logo }, fields } | 404
/** O envio, sem sessão: junta com o que já estava selado, cria a ligação e testa uma vez. */
answerConnectionLink: POST /api/connection-links/{secret}   body { fields } -> { result: TestResult }
```

- O segredo tem 32 bytes aleatórios, vai só no endereço e nunca num log (security S41). O banco guarda o resumo.
- **Uma vez de cada vez.** O comando que insere a ligação toma um `transactionLock` pelo id do link, como `link` faz pela chave de tentativa [visto, `connections.ts:106-107`], e confere ali que nenhuma ligação da empresa tem essa chave. Um segundo envio, ao mesmo tempo ou enquanto o primeiro teste roda, responde "não encontrado", como um link gasto. Se o teste lançar, a ligação nova sai, com o log `CONNECTION_LINK_UNDONE`, e a falha sobe.
- **`createConnectionLink` não tem chave de tentativa.** O banco guarda só o resumo do segredo, e o endereço existe só na resposta. Uma repetição cria outro link, e cada um vale por si.
- O link é gasto com `DELETE … RETURNING` quando a ligação nasce. Um link vencido ou gasto responde "não encontrado", e a página diz "Este link venceu. Peça outro a quem enviou.", sem o nome que o protótipo `p2-09` traz, porque a resposta 404 não diz de quem era o link (security S10).
- Se o sistema recusar as chaves, o link continua valendo até o prazo, e a página mostra o que o sistema respondeu.
- O link vale só para sistema de acesso `FIELDS`. Num sistema de autorização a janela não mostra **Enviar link**, e `createConnectionLink` responde 409 `LINK_NOT_FOR_SIGN_IN`. Terminar um login por autorização sem a sessão de quem pediu é uma porta própria, e fica para uma spec futura [visto, `apps/server/src/hub/connectors/sign-ins.ts:224-273`, onde `completeSignIn` admite por sessão].
- **A rota sem sessão acha a linha** pela função `connectors.link_of(secret_hash text) RETURNS TABLE (id uuid, company_id text, created_by text)`, `SECURITY DEFINER`, só para linha viva (`expires_at > statement_timestamp()`). O molde é `projects.project_of_host`: uma busca entre empresas por um valor, dada a `hub_runtime`, chamada por `database.installationRead` e dona de um papel que não entra [visto, `apps/server/src/hub/projects/hosts.ts:23-31`, `apps/server/migrations/20261018101320_app_grants/migration.sql:12-39`, `apps/server/database-grants.sql:38-41`, `:179-180`]. O papel dono é novo, `hub_links`, `NOLOGIN` e `NOBYPASSRLS`, com uma política de leitura própria em `connection_link` [visto, o molde de `hub_connection_seals`, `apps/server/migrations/20261029000100_e19_connection_seals_role/migration.sql`, `apps/server/src/hub/connectors/tables.ts:111-115`]. `connectors.sealed_of` não serve de molde: ela filtra pela empresa da transação, que uma rota sem sessão não tem [visto, `apps/server/migrations/20261029024300_e19_connection_grants/migration.sql`].
- **Depois de achar a linha**, a rota segue no escopo `COMPANY` de quem pediu o link, `scopeOf({ person: { id: row.createdBy }, companyId: row.companyId })` [visto, `apps/server/src/hub/connectors/rows.ts:124-126`]. Assim o teste readmite quem pediu, como `test` faz hoje [visto, `apps/server/src/hub/connectors/testing.ts:29-34`, `:103-116`], e grava `tested_by`. Se quem pediu perdeu a permissão, o link não liga nada.
- **A chave de tentativa** da ligação criada pelo link é o id do link, que já é um UUID, a forma que `AttemptKey` pede [visto, `packages/hub-api/src/operation.ts:6`]. `connection.attempt_key` é obrigatória e única por empresa [visto, `tables.ts:60`, `:85`], e o link é gasto uma vez, então a chave não se repete. Hoje só a tela deriva uma chave (`derivedAttemptKey`, `apps/web/src/platform/attempt-key.ts:34`), e o servidor não a importa.
- **As duas rotas sem sessão contam tentativas** com `countAttempt` [visto, `apps/server/src/hub/identity/routes.ts:51-63`], por um caminho de contagem novo, `CONNECTION_LINK_PATH`, com a regra em `customRules` [visto, `apps/server/src/hub/identity/auth.ts:38-55`, `:313-319`], como `declineInvitation` faz [visto, `apps/server/src/hub/identity/company-routes.ts:144-155`]. As rotas de conexões não recebem `auth` [visto, `rows.ts:39-53`]: a identidade lhes dá a contagem por uma porta, `countConnectionLinkAttempt`.
- A ligação nasce pelo mesmo código de `link` [visto, `apps/server/src/hub/connectors/connections.ts:102-154`, a parte comum em `:128-146`], com `linked_by` de quem pediu o link.
- A porta nova pede um registro de decisão "proposto", com o critério dela, antes do grupo ser construído (skill `conexus-study`, porta de mão única). A tabela nova pede a permissão no banco do Hub (data D11): palavra do fundador dada em 2026-11-14 (P2 do índice); o PR a cita, e cita também o papel dono e a função, que o PR mostra por inteiro.

A forma da página é [ideia nossa]: nenhuma das duas referências foi vista por dentro.

## Bloco B: os primeiros sistemas comuns, pelo login do kit

O kit já liga um sistema por autorização: o Mercado Livre [visto, `packages/connectors/src/mercado-livre/definition.ts:17-67`]. O HubSpot e o Gmail entram pelo mesmo caminho, como definições do kit. O bloco B muda o Hub em dois pontos, ambos por causa do Gmail: a origem de login e o login sem conta (`C8`).

### `C6`. O app de login de cada sistema

O login por autorização do kit é o `OAuth2CodeAuth`: a página de autorização com PKCE `S256`, a troca do código e a renovação no corpo do formulário, com o app da instalação [visto, `packages/connectors/src/kernel/oauth.ts:6-30`, `:89-116`].

| O que | Onde mora hoje | O que cada conector novo traz |
| --- | --- | --- |
| As chaves do app (client id e client secret) | Um arquivo de segredo da instalação, `HUB_CONNECTOR_APPS_FILE`, JSON `{ "<conector>": { "clientId", "clientSecret" } }` [visto, `apps/server/src/platform/config-connectors.ts:15-37`, `apps/server/src/platform/config.ts:239`, `:335-343`] | Nada no código. O arquivo da instalação ganha as entradas `hubspot` e `google-mail` |
| O app de cada conector | `app: { from: 'installation' }` [visto, `oauth.ts:9`] | O mesmo |
| O endereço de retorno | `{publicOrigin}/integrations/return`, um só para todo sistema [visto, `apps/server/src/hub/connectors/sign-ins.ts:48-50`, `packages/hub-api/src/pages.ts:64`] | Nada. O app criado em cada sistema registra esse endereço |
| A renovação do token | O kit renova antes do fim e marca **precisa religar** quando o sistema recusa a renovação [visto, `apps/server/src/hub/connectors/tokens.ts:124-127`, `:160-185`] | Nada |
| Sem as chaves do app | `CONNECTOR_NOT_CONFIGURED` [visto, `apps/server/src/hub/connectors/apps.ts:14-21`] | Nada |
| Desligar | Revoga quando o conector declara `revoke`, senão só esquece as chaves [visto, `oauth.ts:21-23`] | Nenhum dos dois declara `revoke`: a revogação do HubSpot e a do Google não levam a conta no caminho, que `oauth2Code` exige [visto, `oauth.ts:35-36`] |
| Um dublê | A página de autorização posta no endereço do dublê, por `HUB_CONNECTOR_ORIGINS` [visto, `oauth.ts:59-75`, `apps/server/src/hub/connectors/executor.ts:257-259`] | O mesmo |

**O que espera um ato seu.** Criar o app de login no HubSpot e no Google, com o endereço de retorno acima, e entregar as chaves como arquivo de segredo da instalação, nunca num repositório (security S31, `S40`). Emprestar uma conta de teste de cada um para gravar as respostas reais, só de leitura (testing T29). A gravação lê direto do sistema com o token que o kit buscou (`C7`, `C8`). Até a gravação, o dublê usa o envelope mais próximo medido, a forma das funções da referência, marcada "a confirmar na gravação", e a tarefa nomeia a prova que grava. A gravação é um PR próprio, que troca os corpos do dublê pelos gravados; os PRs do HubSpot e do Gmail fecham sem ela.

### `C7`. O HubSpot, o primeiro sistema comum

```ts
// packages/connectors/src/hubspot/definition.ts (novo)
export const hubspot = defineConnector({
  id: 'hubspot', name: 'HubSpot', version: '1.0.0',
  origin: 'https://api.hubapi.com',                                   // nango@e6c6131 providers.yaml:13038
  auth: oauth2Code({
    app: { from: 'installation' },
    authorize: { url: 'https://app.hubspot.com/oauth/authorize', pkce: 'S256',   // providers.yaml:13028
      params: { scope: 'oauth crm.objects.contacts.read crm.objects.companies.read crm.objects.deals.read crm.objects.contacts.write settings.account.read' } },
    token: { path: '/oauth/2026-09/token' },                          // providers.yaml:13029, a confirmar na gravação
    answer: <access_token, refresh_token, expires_in>,               // RFC 6749 §5.1, a confirmar na gravação
    refusals: { grant: ['invalid_grant'], app: ['invalid_client'] }, // a confirmar na gravação
  }),
  account: { kind: 'reported', exclusive: true,
    who: { path: '/account-info/v3/details', answer: { portalId } -> { ref: portalId, label: `Portal ${portalId}` } } },
  category: 'CRM', summary: 'O CRM onde a empresa guarda contatos, empresas e negócios.', logo: LOGO,
  perProject: 'many', callLimit: { countedBy: 'ACCOUNT' },           // a confirmar na gravação
  subjects: { contatos: 'Contatos', empresas: 'Empresas', negocios: 'Negócios' },
  operations: [contatos, empresas, negocios], writes: [notaNoContato], check: contatos, skill,
})
```

| Peça | Caminho e forma | Prova na referência |
| --- | --- | --- |
| Os escopos | Um por leitura e escrita, e `oauth` | `integration-templates@9afa0aab integrations/hubspot/actions/list-contacts.ts:29`, `list-companies.ts:33`, `list-deals.ts:30`, `create-note.ts:32`, `fetch-account-information.ts:24`, `whoami.ts:20` |
| A conta | `GET /account-info/v3/details`, com `portalId` | `fetch-account-information.ts:6-15`, `:29` |
| As três leituras | `GET /crm/v3/objects/{contacts,companies,deals}`, `limit` e `after`, a resposta em `results` e o cursor em `paging.next.after` | `list-contacts.ts:34-38`, `:57`, `list-companies.ts:38-42`, `list-deals.ts:35-39`; `nango@e6c6131 providers.yaml:13041-13045` |
| A escrita | `POST /crm/v3/objects/notes`, com `hs_note_body`, `hs_timestamp` e a associação ao contato, tipo 202 | `create-note.ts:36-40`, `:51-77` |
| O e-mail e o telefone | Vão como o HubSpot os manda, sem declaração | `list-contacts.ts:8-16` |

A escrita segue o funil de hoje, com o cartão de aprovação, gravada antes de enviar e enviada uma vez [visto, `apps/server/src/hub/connectors/write.ts:158-187`; decisão 0062]. A recusa chega ao agente com o status e o corpo do sistema (code C79), e um 401 marca a ligação como **precisa religar** [visto, `read.ts:229`].

A gravação lê a conta de teste pelo `scripts/record-connector.ts`, que hoje manda o pedido "como o Hub o monta" com um token do ambiente [visto, `scripts/record-connector.ts:1-16`, `:26-34`]. Ele ganha os casos do HubSpot e um modo de login: o script roda o login do próprio kit (`authorizeUrl` e `codeRequest`, `oauth.ts:59-102`) num endereço local registrado no app de teste, confere o `state` na volta, guarda o token só na memória do processo, manda os casos e sai. O token nunca chega a um arquivo nem à saída (security S40).

### `C8`. O Gmail, o primeiro só ao vivo

```ts
// packages/connectors/src/google-mail/definition.ts (novo)
export const googleMail = defineConnector({
  id: 'google-mail', name: 'Gmail', version: '1.0.0', liveOnly: true,
  origin: 'https://gmail.googleapis.com',                             // nango@e6c6131 providers.yaml:11539
  auth: oauth2Code({
    app: { from: 'installation' },
    authorize: { url: 'https://accounts.google.com/o/oauth2/v2/auth', pkce: 'S256',   // providers.yaml:11419
      params: { scope: 'https://www.googleapis.com/auth/gmail.readonly', access_type: 'offline', prompt: 'consent' } },  // :11421-11424
    token: { origin: 'https://oauth2.googleapis.com', path: '/token' },   // providers.yaml:11420; a origem de login, abaixo
    answer: <access_token, refresh_token?, expires_in>, refusals: { grant: ['invalid_grant'], app: ['invalid_client'] },
  }),
  account: { kind: 'none' },
  category: 'E-mail', summary: 'O correio da empresa: os agentes buscam e leem mensagens, e nada é copiado.', logo: LOGO,
  perProject: 'many', callLimit: { countedBy: 'ACCOUNT' },
  subjects: { mensagens: 'Mensagens' }, operations: [buscarMensagens, lerMensagem], check: buscarMensagens, skill,
})
```

| Peça | Caminho e forma | Prova na referência |
| --- | --- | --- |
| O escopo | `gmail.readonly` | `integration-templates@9afa0aab integrations/google-mail/actions/list-messages.ts:39`, `get-message.ts:67` |
| Buscar mensagens | `GET /gmail/v1/users/me/messages`, `q`, `maxResults`, `pageToken`; a resposta `{ messages: [{ id, threadId }], nextPageToken, resultSizeEstimate }` | `list-messages.ts:22-31`, `:44-50` |
| Ler uma mensagem | `GET /gmail/v1/users/me/messages/{id}`, `format` | `get-message.ts:6-13`, `:83` |

- **A conta é `none`.** A única conta que o Gmail diz é o endereço de e-mail (`/gmail/v1/users/me/profile`, `integration-templates@9afa0aab integrations/google-mail/syncs/messages.ts:320`), um dado pessoal, que viraria o rótulo da ligação na tela. O nome que a empresa dá separa as ligações, como no Sankhya [visto, `definition.ts:17-19`].
- **O login sem conta.** Hoje `completeSignIn` sempre pede a conta depois da troca [visto, `apps/server/src/hub/connectors/sign-ins.ts:251`], `who` lança num conector cuja conta não é `reported` [visto, `executor.ts:343-344`], e a ligação grava `accountRef` e `accountLabel` da conta [visto, `sign-ins.ts:296`]. A conformidade do kit já aceita `none` [visto, `packages/connectors/src/kernel/conformance-session.ts:106`]. Com a conta `none`, o login pula `who` e grava `accountRef` e `accountLabel` nulos, que a regra `connection_account` aceita [visto, `apps/server/src/hub/connectors/tables.ts:100-104`].
- **A origem de login.** Hoje o kit manda a troca e a renovação do token à mesma origem do conector [visto, `executor.ts:325-336`, `packages/connectors/src/kernel/request.ts:26-36`]. O Google troca o token em `oauth2.googleapis.com` e serve o Gmail em `gmail.googleapis.com` [visto, `nango@e6c6131 providers.yaml:11420`, `:11539`]. `OAuth2CodeAuth.token` ganha `origin?`, uma segunda origem, só para a troca e a renovação; `oauth2Code` a recusa se não for uma origem https sem caminho, como `Origin` faz com a do conector [visto, `definition.ts:73-79`]. A troca e a renovação passam ambas por `executor.grant` com o bearer nulo [visto, `executor.ts:325-336`, `tokens.ts:164`]; `call`, `who` e `revoke` seguem na origem do conector, e o bearer da ligação nunca vai à origem de login. Num dublê, a troca vai ao endereço do dublê, como a página de autorização já vai [visto, `oauth.ts:59-66`]. O pedido continua montado num lugar só, `toRequest`, conferido contra a origem que recebe (security S36). A mudança pede um registro de decisão "proposto" antes do grupo.

### O marco `D1`

O marco fecha depois do grupo da gravação dos corpos reais, quando, numa empresa de teste, a ligação do HubSpot nasce pelo login do kit, o Builder lê, uma escrita mostra o cartão, e Sankhya e Mercado Livre seguem funcionando. O roteiro e a página da trilha dizem o mesmo desde o PR que trouxe esta spec.

## Bloco C: o que espera outra coisa

### `C9`. O login por chave fixa

O kit tem dois modos de login [visto, `packages/connectors/src/kernel/auth.ts:40`]. Falta o terceiro: campos colados e selados, postos no cabeçalho, na consulta ou no corpo de cada pedido, sem troca por token. É o `API_KEY` da Nango [visto, `nango@e6c6131 packages/providers/providers.yaml:2-30`].

```ts
// packages/connectors/src/kernel/auth.ts
export type ApiKeyAuth = Readonly<{
  kind: 'api_key'
  fields: Fields
  /** Onde cada campo vai em cada pedido. */
  place: Readonly<{ headers?: Record<string, string>; query?: Record<string, string>; body?: Record<string, string> }>
}>
```

Nenhum sistema de hoje o usa. O primeiro é o Omie, no `D3`. A unidade entra junto com esse sistema, e não antes: um modo de login sem conector não tem dublê gravado nem conformidade que o prove.

### `C10`. A entrada conversada (E2a)

A entrada conversada tem um cartão em rascunho, com sete unidades e decisões suas [CARTÃO 281-289]. A decisão E2a junta a ele esta forma: o passo **Ligue seus sistemas** continua e pode ser pulado, a conversa ganha as etapas no topo e os documentos à vista, e saem cinco documentos, cada um salvo por toque. `J1`, `H1` e `B1` ficam.

O cartão ainda não foi aprovado nem construído [CARTÃO 56-57]. Então esta parte não constrói a entrada: ela diz o que o cartão passa a dizer. A reescrita do cartão é da skill `conexus-scope`, no próprio PR 982.

| Unidade do cartão | O que o cartão diz hoje | O que muda com a E2a |
| --- | --- | --- |
| U1. Ligue seus sistemas | O passo 4 da entrada, com a janela Ligar, que pode ser pulado [CARTÃO 283] | Nada. A janela é a de quatro passos (`C4`) |
| U2. A skill da entrada | A skill `conexus-intake`, com etapas escritas e a lista de tarefas como roteiro [CARTÃO 284, 443, 447] | As etapas passam a ser cinco, com estes nomes: Empresa, Desafios, Objetivos, Sistemas, Salvar. A skill manda marcar o que é suposição com "(suposição, confirmar)" |
| U3. A conversa da entrada | Uma conversa marcada `entry`, uma por pessoa e empresa [CARTÃO 285] | A tela da conversa da entrada ganha a barra de etapas no topo e o painel de documentos à direita (`p2-01`) |
| U4. Em aberto | A tabela das perguntas em aberto e a região do Início [CARTÃO 286] | Nada |
| U5. As instruções pelo cartão | Um texto único, `propose_company_instructions`, salvo pelo toque [CARTÃO 287] | Cinco páginas da Memória da empresa, cada uma proposta pela ferramenta que já existe e salva pelo toque. **Salvar todos** grava as cinco (`p2-03`) |
| U6, U7 | Em aberto no Builder, e o registro da entrada [CARTÃO 288, 289] | Nada |
| Nova: os sistemas na conversa | não existe | Na etapa Sistemas, um cartão com os sistemas que a empresa citou, cada um marcado **Cópia** ou **Ao vivo**, com **Ligar**, que abre a janela de quatro passos sem sair da conversa (`p2-02`) |

**As etapas no topo.** O cartão já usa a lista de tarefas do Mastra como roteiro: a skill escreve as etapas com `task_write` e as fecha com `task_check` [CARTÃO 447]. A barra de etapas é essa lista, desenhada no topo da conversa da entrada. Nenhum estado novo: a etapa atual é a primeira tarefa aberta.

**Os cinco documentos.** São cinco páginas da Memória da empresa, que hoje já é o Knowledge do Mastra com o escopo da empresa [visto, `apps/server/src/builder/assistant/company-memory.ts:42-55`]. A ferramenta `propose_company_memory` já propõe uma página com nome e corpo e nunca grava: "nothing is saved until a person who may change the company's memory taps Salvar" [visto, `apps/server/src/builder/assistant/propose-company-memory.ts:12-13`, `:21-57`]. A skill da entrada propõe estas cinco, por estes nomes:

| Página | O que guarda | Na referência |
| --- | --- | --- |
| Empresa | O que a empresa faz e para quem | Company |
| Clientes | Quem compra e como | Customers |
| Desafios e objetivos | O que dói e aonde quer chegar | Challenges and goals |
| Sistemas | Os sistemas que a empresa usa, e quais estão ligados | Tools |
| Glossário | As palavras da casa | Glossary |

Um sexto documento, Concorrentes, fica de fora: a referência o preenche com pesquisa automática, e o estudo recusou confirmar os que ela propôs.

O painel à direita lista as cinco páginas, cada uma num de três estados: **esperando**, **proposta** (com o texto e **Salvar**) e **salva**. O estado sai das propostas da própria conversa e das páginas que a Memória já tem. Nada é gravado sem o toque (`B1`).

**Os sistemas na conversa.** Uma ferramenta nova do Assistente, só da conversa da entrada:

```ts
// apps/server/src/builder/assistant/entry-systems.ts (novo)
/** Os sistemas que a empresa citou, casados com os que o Conexus liga. Não liga nada: mostra o cartão. */
createTool({
  id: 'entry_systems',
  inputSchema: z.object({ named: z.array(z.string().max(80)).min(1).max(12) }),
  execute: ...   // para cada nome: o sistema do registro com esse nome, se houver, com liveOnly e se já está ligado
                 // -> { kind: 'SYSTEMS', found: [{ connector, name, liveOnly, linked }], unknown: string[] }
})
```

A tela desenha o resultado como um cartão com **Ligar** em cada sistema achado. Um sistema que o Conexus não liga aparece em "ainda não ligamos", e vira uma pergunta em aberto (U4).

**A ordem.** O cartão põe **Ligue seus sistemas** antes da conversa (`J1`), e a referência pergunta os sistemas no meio. Com a E2a valem os dois: quem ligou no passo 4 vê os sistemas já ligados na etapa Sistemas, e quem pulou liga dali.

**O que a E2a não dá.** A conversa fica mais longa do que a do cartão, que era curta de propósito (`H1`).

## Modelo de dados

| Onde | O que | Bloco |
| --- | --- | --- |
| Kit | `SystemDescriptor`, `Connector.liveOnly`, `OfferedObject` | A |
| Contrato das telas | `ConnectorEntry.access`, `ConnectorEntry.liveOnly`, `OfferedObject`, as rotas de objetos e de link | A |
| Contrato de acesso | `CatalogSystem.liveOnly` | A |
| Hub, `connectors.connection_link` | Um link para outra pessoa: o resumo do segredo, os campos pedidos, o que já veio selado, o prazo | A |
| Hub, o papel `hub_links` e a função `connectors.link_of` | A busca da rota sem sessão | A |
| Kit | `OAuth2CodeAuth.token.origin`, os conectores `hubspot` e `google-mail` | B |
| A instalação | As entradas `hubspot` e `google-mail` no arquivo de `HUB_CONNECTOR_APPS_FILE` | B |
| Kit | `ApiKeyAuth` | C |

As migrações só acrescentam (data D6). O bloco B não muda tabela nem permissão do banco. O selo do que vem preenchido no link usa um propósito novo, `connection-link`, ao lado dos quatro de hoje [visto, `apps/server/src/platform/seal.ts:49-56`].

## Propriedades de correção

1. **A descrição não muda o que a tela mostra.** Para todo conector do kit, a entrada montada de `descriptorOf` traz o mesmo nome, categoria, resumo, logo, assuntos e campos que a de hoje. *Valida: requisitos 1.1, 1.2.*
2. **Só ao vivo nunca é copiado.** Para todo sistema só ao vivo, nenhuma tabela é oferecida, toda proposta de cópia é recusada e a janela pula os passos de cópia. *Valida: requisitos 2.1 a 2.4.*
3. **O que é oferecido pode ser descrito e amostrado.** Para todo conector que oferece tabelas, cada tabela tem descrição, chave e colunas descritas, e o dublê responde a primeira página. *Valida: requisitos 3.1 a 3.4.*
4. **A amostra nunca passa de 5 linhas e vem como o sistema manda.** *Valida: requisito 3.5.*
5. **O link vale uma vez e por 30 minutos.** Para todo link, o segundo uso e o uso depois do prazo respondem "não encontrado", e o segredo não aparece em linha nem em log. *Valida: requisitos 5.1, 5.4, 5.5.*
6. **O link só pede o que foi pedido.** A página mostra só os campos em `asked`, e nunca um valor que quem pediu já preencheu. *Valida: requisito 5.2.*
7. **Um conector novo entra pela porta de hoje.** Para toda operação do HubSpot, a resposta que o agente lê tem a forma de uma leitura do kit, a recusa chega inteira e a escrita passa pelo cartão. *Valida: requisitos 7.1, 7.2, 7.4.*
8. **O token só vai à origem de login declarada.** Para todo conector, a troca e a renovação do token saem para a origem de login dele, ou para o dublê configurado, e para nenhuma outra. *Valida: requisito 6.5.*
9. **Nada é gravado sem o toque.** Para toda conversa da entrada, nenhuma página da Memória muda sem o toque em **Salvar**. *Valida: requisito 9.4.*

## Tratamento de erros

Nenhum erro é engolido. Cada falha tem um nome, um log e uma resposta.

| Onde | O que falha | Resposta | Log |
| --- | --- | --- | --- |
| A janela, ao testar | O sistema recusou as chaves | "O <Sistema> recusou as chaves", texto novo, com a resposta do sistema por extenso (code C79). Hoje a lista mostra só o selo "Chaves recusadas" [visto, `text.ts:42`] | o de `testConnection` |
| A janela, ao testar | O sistema não respondeu | "O <Sistema> não respondeu. Tente de novo em alguns minutos." | o de `testConnection` |
| `listConnectionObjects` | A ligação não está ativa | 409 `CONNECTION_NOT_READY` | nenhum |
| `previewConnectionObject` | O sistema recusou a leitura | `CONNECTOR_REFUSED`, com a recusa do sistema inteira; as outras recusas pelas falhas de `C3` | `CONNECTOR_CALLED`, como toda leitura [visto, `read.ts:231-247`] |
| A revisão | `enableCopy` falhou numa tabela | A tela nomeia a tabela e o motivo. As outras seguem | o de `enableCopy` |
| `createConnectionLink` | Sistema de acesso `SIGN_IN` | 409 `LINK_NOT_FOR_SIGN_IN` | nenhum |
| `readConnectionLink`, `answerConnectionLink` | Vencido, gasto ou segredo errado | "não encontrado", e a página do link vencido | `CONNECTION_LINK_REFUSED`, sem o segredo |
| `readConnectionLink`, `answerConnectionLink` | Tentativas demais do mesmo endereço | 429 `SIGN_IN_ATTEMPTS_EXCEEDED` | o de `countAttempt` |
| `answerConnectionLink` | Um segundo envio enquanto o primeiro corre | "não encontrado", como um link gasto | `CONNECTION_LINK_REFUSED` |
| `answerConnectionLink` | O teste lançou | A ligação nova sai e a falha sobe | `CONNECTION_LINK_UNDONE` |
| `answerConnectionLink` | O sistema recusou as chaves | A resposta do sistema, e o link continua valendo até o prazo | `CONNECTION_LINK_TESTED` |
| Ligar o HubSpot ou o Gmail | A instalação não tem o app | `CONNECTOR_NOT_CONFIGURED`, como hoje | o de hoje |
| A renovação do token | O sistema recusou a renovação | A ligação fica **precisa religar**, como hoje | o de `tokens.ts` |
| Uma leitura do HubSpot ou do Gmail | O sistema respondeu 401 | `AUTH_REFUSED`, e a ligação fica **precisa religar** | `CONNECTOR_CALLED` |
| `entry_systems` | Um nome que não casa com sistema nenhum | Volta em `unknown`. Não é erro | nenhum |

## Estratégia de teste

Os testes da CI usam dublês. Nenhum teste da CI chama o HubSpot, o Google nem o Sankhya real.

| O que | Como | Modelo a seguir |
| --- | --- | --- |
| `descriptorOf`, `objectsOf` | Testes do kit, e a conformidade com as quatro verificações novas rodando em todo conector | `packages/connectors/src/sankhya/sankhya.test.ts:13`, `packages/connectors/src/kernel/conformance.ts:213-256` |
| As rotas de objetos e de amostra | Pela porta pública, com o dublê do Sankhya | `apps/server/src/hub/connectors/test-connections.ts` |
| A janela | Teste de tela com msw, um caso por passo e por estado | `apps/web/src/hub/connectors/` e os testes dela |
| O link | Pela porta pública: um uso, o segundo recusado, o vencido recusado, o segredo fora do log. Os casos negativos entram em `scripts/rerun-never.json` (testing T4) | os testes de `sign-ins.ts` e de `invitation-response.ts` |
| HubSpot e Gmail no kit | A conformidade do kit, com o dublê de cada um | `packages/connectors/src/mercado-livre/mercado-livre.test.ts:18` |
| HubSpot e Gmail no Hub | O login pelo dublê, a leitura, a escrita com cartão e o 401, pela porta pública | `apps/server/src/hub/connectors/sign-ins.test.ts:22`, `executor.test.ts`, `write.test.ts` |
| A origem de login | A troca e a renovação vão à origem de login, ou ao dublê | `packages/connectors/src/kernel/oauth.test.ts`, `apps/server/src/hub/connectors/connections-refresh.test.ts` |
| A entrada | Os critérios do cartão, mais os novos da E2a | [CARTÃO 309-335] |
| As telas | QA em navegador real, a 1366 e 390 px, nos dois temas (testing T23, `T25`) | skill `conexus-qa` |

**As leis de conformidade desta parte.** As quatro verificações novas do kit (10 a 13, em `C3`), e uma do contrato de acesso: um sistema só ao vivo aparece no catálogo com `liveOnly: true` e nenhuma tabela o tem como origem.

**As perguntas com resposta conhecida.** Na Lume, com os dublês. Os exemplos ilustram e não viram regra.

| O que a pessoa faz | O que tem de acontecer |
| --- | --- |
| Lea liga o Sankhya com as três chaves | O teste passa, e o passo **O que copiar** lista cinco tabelas, cada uma com descrição e chave |
| Lea abre a amostra de `vendas` antes de copiar | 5 linhas do dublê |
| Lea marca as cinco, deixa 30 minutos e toca **Ligar e copiar agora** | Cinco cópias, com os nomes `sankhya_*`, e a primeira rodada de cada uma saindo sozinha |
| Lea manda o link do Sankhya ao contador, com as três chaves pedidas | O contador abre a página sem conta, preenche as chaves, e a ligação nasce em nome de Lea. O segundo uso do link dá "não encontrado" |
| Lea liga o Gmail | A janela pula os passos de cópia, e a página Dados diz "nunca é copiado" |
| O Builder propõe uma cópia do Gmail | A proposta é recusada com `COPY_LIVE_ONLY` |
| Lea liga o HubSpot pela página do HubSpot e o Builder lê os contatos | A leitura responde com a mesma forma de uma leitura do Mercado Livre |
| Uma escrita no HubSpot | O cartão de aprovação aparece, e a escrita sai uma vez |

**As rodadas com serviço real.** Três, todas fora da CI e autorizadas uma a uma. As duas gravações formam um grupo próprio, depois dos grupos do HubSpot e do Gmail, e o `D1` fecha depois dele:

1. A gravação dos corpos do HubSpot, com a conta de teste sua, só de leitura.
2. A gravação dos corpos do Gmail, com a conta de teste sua, só de leitura.
3. O uso de fechamento do `D1` (delivery L17), com o app de login da instalação, numa empresa de teste.

O Sankhya real não é lido nesta parte.

**Mutações à mão (testing T27).** As linhas-chave: a recusa de `liveOnly` com `copy`, o `LIMIT` da amostra, o `DELETE … RETURNING` do link, a comparação do prazo em `link_of` e a origem de login da troca do token.

## Tabela de referência

| Peça | Hoje no `main` | Referência | Veredito |
| --- | --- | --- | --- |
| A descrição do sistema | `definition.ts:42-71`, `connections.ts:40-55` | `SystemDescriptor`. A conexão como objeto do catálogo | nativo (uma função pura) |
| Só ao vivo | `roadmap.md:32-34` | Uma fonte copiada e uma ferramenta ao vivo são duas portas | nativo (um campo do conector) |
| As quatro operações | `check.ts:37-70`, `copy.ts:203-206`, `copy-proof.ts:35-80` | As quatro operações de um conector de dados. A lista vista, e não as quatro rodando | embrulhado: três são vistas do que o kit já declara |
| A janela em quatro passos | `link-dialog.tsx:272` | Os sete passos de uma referência e os cinco de outra, que a decisão `T3` reduz a quatro | nativo (as peças de `apps/web/src/ui/`) |
| O link | `sign-ins.ts:145-193`, `invitation-response.ts`, `hosts.ts:23-31` | Um link que o dono compartilha. `connect_link` da Nango | embrulhado: o molde do login em curso e o de `project_of_host`. A página é [ideia nossa] |
| O login do HubSpot e do Gmail | `oauth.ts`, `mercado-livre/definition.ts:17-67`, `config-connectors.ts` | As páginas de autorização e de token do `providers.yaml` [visto, `nango@e6c6131 packages/providers/providers.yaml:13028-13029`, `:11419-11424`] | nativo (o login do kit) |
| A origem de login | `executor.ts:325-336`, `request.ts:26-36` | O `token_url` do Google em outra origem [visto, `providers.yaml:11420`] | embrulhado: um campo a mais no login do kit |
| As operações do HubSpot e do Gmail | `mercado-livre/operations/` | `integration-templates@9afa0aab integrations/hubspot/actions/`, `integrations/google-mail/actions/` | nativo (o formato do kit) |
| O login por chave fixa | `auth.ts:40` | `API_KEY` da Nango [visto, `providers.yaml:2-30`] | nativo, quando houver sistema |
| As etapas da entrada | nenhuma | As etapas de uma entrada que conversa | nativo (`task_write` do Mastra) [CARTÃO 447] |
| Os cinco documentos | `propose-company-memory.ts:21-57` | Os documentos que uma entrada que conversa grava | nativo (a ferramenta que já existe) |
