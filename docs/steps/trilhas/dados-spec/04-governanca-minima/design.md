# Documento de desenho: parte 4, a governança mínima

> O cartão Registro e conformidade ([`docs/steps/registro-e-conformidade.md`](../../../registro-e-conformidade.md)) construiu os requisitos 6 e 7, o `C6` e o grupo 9 desta parte, e o que ele decidiu vale sobre este texto (o fechamento dele, 2026-11-21). Só Dono e Administrador veem o Registro de dados, e o requisito 7.2 volta a valer. A leitura deixa uma linha só, gravada depois de ler e antes de devolver. A consulta que nomeia uma tabela fora do catálogo de quem pergunta volta `NOT_IN_CATALOG` sem rodar, como a tabela que não existe ("1. B"). O registro do cartão está em [aprovações](../../../../approvals/registro-e-conformidade.md).

Base: `main` do Conexus em `0d4c5730`. Todo caminho é relativo à raiz do repositório. Depende das partes 1 e 3: o login de leitura, o catálogo e as duas ferramentas. Os rótulos de prova são os do escopo.

## Visão geral

No fim desta parte uma pessoa sem o papel pergunta sobre um dado copiado e recebe a recusa, o dono vê numa tela o que cada agente leu.

| O que entra | Decisão | Onde |
| --- | --- | --- |
| Quem lê cada tabela: por tabela e por papel da empresa | N3b | tabela nova `copies.copy_reader`, `apps/server/src/hub/copies/readers.ts` |
| A cópia nasce marcada para os papéis que já leem a origem | N3b-1 | `apps/server/src/hub/copies/enable.ts`, `accept.ts` |
| O banco garante: um login de leitura por papel | N3b, prova própria | `apps/server/src/platform/copy-sql.ts` |
| A tela Papéis ganha as tabelas, e a tabela ganha a aba **Quem lê** | escopo 6.1 | `apps/web/src/hub/identity/`, `apps/web/src/hub/copies/` |
| O membro vê a página Dados com as tabelas do papel dele | escopo `p1-11` | `apps/server/src/hub/copies/list.ts`, o trilho |
| O Registro de dados: dono e administrador, sem prazo, nunca as linhas | E4a, `T8` | tabela nova `data.data_read`, `apps/server/src/hub/data/`, página nova em Configurações |

O que fica de fora: quem vê qual linha (Capacidade 4), grupos, máscara de coluna, etiquetas e classificação automática, o escopo de tabelas por agente salvo (parte 7), o token para quem é de fora (parte 8), e o pedido de acesso.

## Arquitetura

```
 Configurações > Papéis ──► PUT .../roles/{role}/copies ──► copies.copy_reader (banco do Hub: a verdade)
 Ligar uma cópia (N3b-1) ─────────────────────────────────►        │
                                                                    │ reconcileReaders (repetível)
                                                                    ▼
                     banco da empresa:  conexus_role_<id>  ── GRANT SELECT ── sync.<tabela>
                                        conexus_read (dono e administrador) lê tudo

 data_describe / data_query ─► hub/data ─► escolhe o login pelo papel ─► o PostgreSQL recusa (42501)
                                  │
                                  └─► data.data_read: quem, qual agente, qual tabela, a consulta, o resultado, a contagem
```

A verdade de quem lê fica no banco do Hub. O banco da empresa é a parede: o login de um papel só segura `SELECT` nas tabelas daquele papel. A regra de negócio é TypeScript sobre linhas decididas, e a integridade é do banco (data D16).

### O que cada referência faz no mesmo ponto

| Ponto | Referência | O que a spec faz |
| --- | --- | --- |
| Vale a permissão de quem pergunta | Ferramentas de análise que leem com a permissão de quem pergunta. O `information_schema` já filtra pelo privilégio | Igual: o agente lê com o login do papel de quem pergunta |
| Permissão por tabela | Uma tela de permissão por tabela, com as tabelas marcáveis | Igual no eixo tabela. Diferente: só papel, nunca direto à pessoa, e sem os níveis Manager, Editor e Viewer (N3b) |
| A consulta que toca tabela sem acesso devolve erro | Uma ferramenta que executa SQL e devolve o erro do banco | Igual, e quem devolve o erro é o PostgreSQL |
| O registro guarda os argumentos e nunca a resposta | Um registro que guarda os argumentos e nunca a resposta, e um histórico de consultas | Igual |
| O registro por pessoa | Um registro por token | Diferente: por pessoa e por agente |

## Componentes e interfaces

### `C1`. Quem lê cada tabela

A permissão de hoje é por operação de conector, guardada no papel como texto JSON da biblioteca de acesso [visto, `apps/server/src/hub/identity/tables.ts:276-300`; o JSON é lido em `company-roles.ts:104` e `:123`, e `connectorsOf` em `role-statements.ts:27-36`]. Os recursos que um papel pode segurar são fixados ao montar o controle de acesso, a partir do kit [visto, `apps/server/src/hub/identity/roles.ts:70-85`]. Uma tabela copiada nasce e some enquanto a empresa usa o Conexus, então não cabe nessa lista fixa. Por isso quem lê cada tabela fica numa tabela própria, da trilha Dados.

```ts
// apps/server/src/hub/copies/tables.ts
/** Um papel da empresa que lê uma cópia (N3b). Dono e administrador leem todas e não têm linha aqui. */
export const copyReader = copies.table('copy_reader', {
  companyId: text('company_id').notNull(),
  copyId: uuid('copy_id').notNull(),
  // O id da linha do papel em auth.organization_role: o desenvolvedor, o membro ou um papel da empresa.
  roleId: text('role_id').notNull(),
  grantedBy: text('granted_by').notNull(),
  grantedAt: instant('granted_at').notNull(),
}, (table) => [
  primaryKey({ columns: [table.copyId, table.roleId] }),
  foreignKey({ columns: [table.companyId, table.copyId], foreignColumns: [copy.companyId, copy.id] }).onDelete('cascade'),
  foreignKey({ columns: [table.roleId], foreignColumns: [organizationRole.id] }).onDelete('cascade'),
  policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
])
```

Os dois papéis editáveis de fábrica, desenvolvedor e membro, já têm uma linha por empresa em `auth.organization_role` [visto, `apps/server/src/hub/identity/company-roles.ts:57-68`]. Dono e administrador não mudam [visto, `company-roles.ts:256-277`] e leem tudo.

```ts
// apps/server/src/hub/copies/readers.ts (novo)
/** Os papéis que leem cada cópia da empresa. */
export async function readersOf(tx, companyId): Promise<Map<CopyId, RoleId[]>>
/** As cópias que um papel lê. Dono e administrador: 'ALL'. */
export async function copiesReadBy(tx, { companyId, role }): Promise<'ALL' | CopyId[]>
/** Troca o conjunto de cópias de um papel. Só dono ou administrador (manageRoles). */
export async function setRoleCopies(deps, input: InCompany & { role: Role; copies: CopyId[] }): Promise<void>
/** N3b-1: os papéis que já leem a origem de uma cópia. */
export async function rolesReadingSource(deps, tx, { companyId, connectorId, definition }): Promise<RoleId[]>
```

**N3b-1, a cópia nasce marcada.** Hoje a conferência "quem lê a origem" só roda para a pessoa que liga a cópia [visto, `apps/server/src/hub/copies/accept.ts:112-138`]: na versão 1 ela pede todas as leituras da porta do conector [visto, `apps/server/src/hub/connectors/copy-sources.ts:48-63`], e na versão 2 a leitura de lista em cada conexão [`copy-sources.ts:70-96`]. `rolesReadingSource` aplica a mesma regra a cada papel editável ou próprio da empresa, lendo as operações que o papel guarda. A identidade entrega isso por uma porta nova, para a trilha Dados não ler a tabela de papéis por dentro:

```ts
// apps/server/src/hub/identity/role-rows.ts (novo): portas novas em IdentityPorts (identity/public.ts:94-129)
/** Os papéis editáveis e próprios da empresa que seguram todas as operações pedidas do conector; nenhum sem operação. */
rolesHolding(tx, { companyId, connectorId, operations: readonly string[] }): Promise<{ id: string; role: Role }[]>
//  lê auth.organization_role (identity/tables.ts:276-300), `permission` em JSON, o recurso `connector_${connectorId}`
/** As linhas de papel da empresa, com quantas pessoas cada uma tem. Dono e administrador não têm linha. */
companyRoleRows(tx, companyId): Promise<{ id: string; role: Role; label: string; members: number }[]>
```

`rolesHolding` lê só o JSON do papel. A regra de hoje para a pessoa passa por `mayUseEach`, conexão a conexão [visto, `copy-sources.ts:85-93`], que decide pelo mesmo recurso `connector_<id>` do papel [visto, `apps/server/src/hub/identity/may-use.ts:88-117`]. Para a propriedade 5 a diferença não pesa hoje. Se a permissão passar a ser por conexão, `rolesHolding` muda junto.

As operações de cada cópia saem de uma função nova da trilha de conectores, `sourceReadsOf(connectorId, definition)` em `copy-sources.ts`, exportada por `connectors/public.ts`: a porta inteira na versão 1, `definition.source.operation` na versão 2. A trilha Dados importa conectores só por essa porta.

`insertedCopy` [visto, `apps/server/src/hub/copies/accept.ts:62-93`, chamado em `accept.ts:204` e `enable.ts:70-75`] grava as linhas de `copy_reader` na mesma transação que cria a cópia, e `readers_set` verdadeiro.

**As cópias que já existem.** Nascem sem linha em `copy_reader`. Uma migração de dados não as marca: a regra N3b-1 depende das operações de cada papel, que o SQL de uma migração não lê. A reconciliação de uma empresa (`C2`) marca antes as cópias de `readers_set` falso pela regra N3b-1, uma vez, e registra `COPY_READERS_SEEDED`. Ela roda ao ligar, ao trocar as tabelas de um papel, e na primeira leitura do catálogo ou da página Dados que acha uma cópia de `readers_set` falso. Uma cópia cujo dono desmarcou todos os papéis fica com a marca `readersSet` na linha da cópia, para não ser semeada de novo:

```ts
// apps/server/src/hub/copies/tables.ts, tabela copy
// Verdadeiro depois que os leitores da cópia foram gravados uma vez, por N3b-1 ou por uma pessoa.
readersSet: boolean('readers_set').notNull().default(false),
```

### `C2`. O banco garante: um login de leitura por papel

O estudo anterior deixou para a spec a peça que garante a leitura por papel no banco, e sugeriu um papel do PostgreSQL assumido por transação, sem ter rodado. A prova desta spec mostra que esse desenho vaza: uma consulta só troca de papel de dentro dela e lê a tabela de outro papel. O desenho que segura é um login por papel, sem `SET ROLE` [a prova foi rodada no Postgres 18 e o teste do ataque direto a repete].

```ts
// apps/server/src/platform/copy-sql.ts
/** O login que lê as tabelas de um papel da empresa. O id do papel é o da linha em auth.organization_role. */
export function roleLogin(roleId: string): string   // `conexus_role_${roleId}`; falha se passar de 63 bytes
//  O id é um uuid de 36 caracteres nos dois papéis semeados (company-roles.ts:57-68) ou 32 letras e dígitos,
//  com maiúsculas, nos papéis próprios (generateId de @better-auth/core 1.7.8). O login tem no máximo 49 bytes
//  e vai sempre por quoted() (app-sql.ts:38-40), que guarda a caixa.

/** Onde o Hub alcança o login de um papel, pelo host gravado, sem chamar a Neon (como syncAddress, :128-133). */
export async function roleAddress(context: Context, host: string, roleId: string): Promise<DatabaseUrl>
//  usuário roleLogin(roleId); senha appLoginPassword({ key: context.key, login }) (app-sql.ts:75)

```

**Dois nomes, duas coisas.** `reconcileReaders` (plataforma) é uma aplicação no banco da empresa, numa transação de lá, com um bilhete. `reconciled` (Hub, `hub/copies/readers.ts`, `C1`) é a reconciliação inteira: pega o bilhete, lê o Hub, chama `reconcileReaders`, relê o Hub. Nenhuma transação do Hub fica aberta enquanto o banco da empresa é chamado (data D22, como `apps/server/src/hub/copies/grants.ts:69` e `enable.ts:126` dizem).

```ts
// apps/server/src/platform/copy-sql.ts
/** O livro das reconciliações, no esquema sync, do login conexus_sync; criado de forma repetível. */
function readersLedger(): SqlStatement[]
//  (como conexus_sync)
//  CREATE SEQUENCE IF NOT EXISTS sync.readers_ticket
//  CREATE TABLE IF NOT EXISTS sync._readers_applied
//    (single boolean PRIMARY KEY DEFAULT true CHECK (single), ticket bigint NOT NULL)
//  INSERT INTO sync._readers_applied (ticket) VALUES (0) ON CONFLICT DO NOTHING
//  REVOKE ALL ON TABLE sync._readers_applied FROM PUBLIC; REVOKE ALL ON SEQUENCE sync.readers_ticket FROM PUBLIC
//  DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'conexus_read')
//          THEN REVOKE ALL ON TABLE sync._readers_applied FROM conexus_read; END IF; END $$
//  (o conexus_read da parte 1 ganha SELECT nas tabelas novas de sync por ALTER DEFAULT PRIVILEGES)
// O livro é criado uma vez, em ensureSync: depois do CREATE SCHEMA, a trava consultiva, SET LOCAL ROLE conexus_sync
// e readersLedger(). Só takeReadersTicket o recria, e só ao receber 42P01 (não existe), numa empresa de antes.

/** Um bilhete, numa chamada curta: quem pega depois lê o Hub depois. */
export async function takeReadersTicket(context: Context, owner: DatabaseUrl): Promise<SqlAnswer>
//  [SELECT pg_advisory_xact_lock(hashtext('conexus.readers')), SET LOCAL ROLE conexus_sync,
//   SELECT nextval('sync.readers_ticket') AS ticket]
//  REFUSED 42P01 -> a mesma chamada com readersLedger() antes do nextval, uma vez
//  A trava consultiva é a primeira instrução de toda chamada que mexe em permissão de sync: o bilhete,
//  reconcileReaders, ensureSync, grantCopy, revokeCopy e ensureReader. Dois GRANT ou REVOKE ao mesmo tempo
//  no mesmo objeto falham com XX000 (tuple concurrently updated).

export type ReadersAnswer = SqlAnswer | { kind: 'SUPERSEDED' }
/**
 * Deixa o banco da empresa igual ao que o Hub disse ao bilhete dado, numa transação só; repetível.
 * Para cada papel: o login existe com as configurações de leitura, segura USAGE em sync, e SELECT
 * exatamente nas tabelas dadas. Um login de papel fora da lista perde tudo e é apagado.
 */
export async function reconcileReaders(context: Context, owner: DatabaseUrl,
  ticket: bigint, wanted: readonly { roleId: string; tables: readonly string[] }[]): Promise<ReadersAnswer>
//  0. existentes = SELECT rolname FROM pg_roles WHERE rolname LIKE 'conexus\_role\_%'
//                    AND has_schema_privilege(oid, 'sync', 'USAGE')   (chamada própria, antes)
//     (os logins são do servidor inteiro; sem o filtro, um servidor com várias empresas apagaria os das outras)
//  numa chamada só, que o transporte roda numa transação só (company-postgres.ts:104-140, sql.transaction):
//  1. SELECT pg_advisory_xact_lock(hashtext('conexus.readers'))     (o banco é da empresa: a chave é uma só)
//  2. SET LOCAL ROLE conexus_sync
//     DO $$ BEGIN IF (SELECT ticket FROM sync._readers_applied) >= <ticket> THEN
//       RAISE EXCEPTION USING ERRCODE = 'CXR01'; END IF; END $$     (o bilhete entra como número literal: um DO não tem parâmetro)
//  3. RESET ROLE; missingLogins(...) para os que faltam; as quatro configurações de leitura da parte 1 (C3)
//  4. SET LOCAL ROLE conexus_sync
//     para cada papel:  REVOKE ALL ON ALL TABLES IN SCHEMA sync FROM <login>
//                       GRANT USAGE ON SCHEMA sync TO <login>
//                       GRANT SELECT ON sync.<t1>, sync.<t2>, ... TO <login>      (omitido sem tabela)
//     para cada login de papel fora da lista:  REVOKE ALL ...; REVOKE USAGE ON SCHEMA sync ...
//     UPDATE sync._readers_applied SET ticket = <ticket>
//  5. RESET ROLE; DROP ROLE para cada login fora da lista
//     (DROP ROLE recusa um login que ainda segura permissão, 2BP01: copy-sql.ts:355-358)
//  REFUSED 'CXR01' -> { kind: 'SUPERSEDED' }: a transação inteira voltou, nada mudou
```

O transporte manda as instruções de uma chamada numa transação só: `sql.transaction(queries)` da Neon [visto, `apps/server/src/platform/company-postgres.ts:104-140`] e `BEGIN` e `COMMIT` no transporte dos testes [visto, `apps/server/src/platform/test-company-postgres.ts:26`, `:53`, `:71`]. Um bloco `DO` é uma instrução comum nos dois. A exceção do bloco aborta a transação inteira, e o código `CXR01` volta em `REFUSED.code` [visto, `answerOf`, `company-postgres.ts:43-59`, chamado em `:146`]. Um login criado ao mesmo tempo por outra chamada (`42710`), uma atualização concorrente de catálogo (`XX000`) e um objeto criado ao mesmo tempo (`23505`, `42P07`) ganham uma nova tentativa só, como `ensureSync` faz com `42710` [visto, `copy-sql.ts:123-124`]. `reconcileReaders` é o único lugar que escreve permissão de papel no banco da empresa. Os logins de leitura nunca recebem permissão no livro: o de papel perde tudo em sync antes dos `GRANT`, e o `conexus_read` perde a da tabela pelo `REVOKE` acima e pelo da parte 1 (unidade 4.1). O catálogo sai das cópias do Hub, então o livro nunca aparece nele nem na amostra.

**A reconciliação inteira, `reconciled`.**

1. O dono do banco da empresa, por `companyOwner` [visto, `apps/server/src/hub/copies/store.ts:155-180`], sem transação aberta.
2. A semeadura das cópias de `readers_set` falso, numa transação própria do Hub, com commit, antes de qualquer aplicação. A inclusão em `copy_reader` usa `onConflictDoNothing()`: duas primeiras leituras ao mesmo tempo semeiam uma vez, sem `23505`.
3. Um bilhete, por `takeReadersTicket`.
4. O que os papéis leem, lido do Hub numa transação curta, aberta depois que o bilhete chegou e já fechada.
5. `reconcileReaders` com o bilhete. `SUPERSEDED` é sucesso: um bilhete maior foi pego depois deste, leu o Hub depois e já aplicou.
6. O Hub relido. Se o que os papéis leem mudou desde o passo 4, os passos 3 a 6 rodam uma vez mais, com bilhete novo. Se mudou de novo, o ato que mudou faz a sua própria reconciliação.

Um membro dispara uma reconciliação por consulta recusada pelo conserto abaixo: uma chamada à Neon (`companyOwner`), de três a cinco ao banco da empresa (o bilhete, os logins existentes, a aplicação, e o bilhete e a aplicação de novo se o Hub mudou), cada uma com o prazo de 60 s de `budget()` [visto, `copy-sql.ts:95-98`], e três leituras curtas do Hub. Nenhuma trava do Hub é tomada.

**Uma ordem só: o Hub primeiro, sempre.** O login do Hub só lê, inclui e apaga em `copy_reader`, e apagar a marca é o que diz "saindo".

| Ato | Ordem | Se a `reconciled` falhar |
| --- | --- | --- |
| Dar uma tabela a um papel, ligar uma cópia | A transação do Hub grava e fecha. Depois `reconciled` | Responde 200. O banco lê menos que o Hub; o conserto em `42501` libera |
| Tirar uma tabela de um papel | A transação do Hub apaga a marca e fecha. Depois `reconciled`, com bilhete pego depois desse commit | `setRoleCopies` repõe as marcas que apagou e tira as que deu, numa transação do Hub, e responde 503 `COPY_DATABASE_UNAVAILABLE`: nada mudou. Se repor também falhar, log de erro `COPY_READERS_PENDING` com a empresa e o papel, e 503 |
| Apagar um papel | A cascata no Hub apaga as marcas. O login sai na `reconciled` seguinte | nenhum: o papel não tem pessoa |

**Quem conserta o que ficou pendente.** O fim de toda rodada de cópia chama `reconciled` da empresa: em `ended`, depois do log `COPY_RUN_ENDED` [visto, `apps/server/src/hub/copies/run.ts:122-130`] e antes do `return` da `:131`. A reconciliação seguinte tem prazo: o intervalo da cópia, 30 minutos por padrão [visto, `COPY_INTERVAL_DEFAULT`, `packages/hub-api/src/copies.ts:22`]. Uma falha ali só loga `COPY_READERS_FAILED` e não muda o resultado da rodada.

**Por que a ordem fecha.** O estado do banco é o da maior aplicação que passou. A `reconciled` de quem tira pega o bilhete depois do commit do Hub; todo bilhete maior foi pego depois, então leu o Hub já sem a tabela, e todo bilhete menor que aplique depois é abandonado. A ordem do verificador na rodada 3, item 1(c), em que uma reconciliação de bilhete maior leu o Hub antes do commit de quem tira, não existe mais: quem tira só pega o bilhete depois do commit.

**O que sobra, com exatidão.**

- Sem falha: em nenhuma intercalação o login volta a ler uma tabela que o Hub tirou. Enquanto um ato de tirar não respondeu, entre o commit do Hub e a sua aplicação, o login ainda lê a tabela como lia antes do ato.
- Com falha: se a `reconciled` depois de tirar falha e repor as marcas também falha, ou se o servidor cai entre o commit do Hub e a aplicação, o Hub diz menos do que o banco. O login lê a tabela até a reconciliação seguinte da empresa, que vem no máximo no intervalo da cópia, pelo fim de uma rodada. Nesse intervalo, `companyData().read` recusa a consulta com `NOT_IN_CATALOG`, porque confere as tabelas lidas contra o catálogo do Hub (parte 3, unidade 1.1). Quem lê o banco direto com a senha do login é só o Hub.

**O conserto.** Quando `readAs` recebe `42501` ou `NO_LOGIN` com login de papel, e o catálogo de quem pergunta lista ao menos uma tabela, ele chama `reconciled` uma vez e tenta de novo. O PostgreSQL não diz qual tabela recusou, então a consulta não confere a tabela. Se a recusa repetir, ela volta como `NOT_IN_ROLE`.

**A escolha do login.** Hoje ela está em linha no passo 2 de `queryOf` (parte 3, `C2`), e `readCopyTable` (parte 1) lê sempre como `conexus_read`. As duas passam a pedir a escolha a `hub/copies`, que já lê as cópias: `readerOf` devolve `ALL`, `ROLE` com o id do papel, ou `NONE`, e `readAs` monta o endereço (`readerAddress` ou `roleAddress`, `C2`) e faz o conserto abaixo.

| Lugar | Papel de quem pergunta | Login |
| --- | --- | --- |
| `COMPANY` | Dono ou administrador | `conexus_read` (parte 1) |
| `COMPANY` | Desenvolvedor, membro ou papel da empresa | `roleLogin(id do papel)` |
| `PROJECT` | Qualquer | O login de leitura do Projeto, como hoje: o Builder e o agente salvo leem pela liberação do Projeto (resposta do fundador à P1, no índice). A regra por papel de quem conversa com um agente salvo é entrada da parte 7 |

A pessoa tem um papel só na empresa [visto, `apps/server/src/hub/identity/tables.ts:226-272`, coluna `role`], então há um login só a escolher.

### `C3`. O catálogo por papel e a recusa

`catalogOf` (parte 1, `C7`) passa a filtrar por `copiesReadBy` no lugar `COMPANY`. O contrato ganha a lista do que existe e o papel não lê, no molde do `allowed: false` que as leituras oferecidas já têm [visto, `packages/hub-api/src/connectors.ts:42-48`]. A mudança passa pela issue `contrato`.

```ts
// packages/hub-api/src/company-data.ts
export const Catalog = z.object({
  kind: z.literal('CATALOG'),
  systems: z.array(CatalogSystem),
  tables: z.array(CatalogTable),
  /** As tabelas que existem e o papel de quem pergunta não lê: só o nome e o rótulo, nunca coluna ou descrição. */
  withheld: z.array(z.object({ name: z.string(), label: z.string() })),
})

// sourceOf, caso TABLE: um nome que está em `withheld` responde NOT_IN_ROLE, e não NOT_IN_CATALOG.
```

Sem `withheld`, o agente de Bruno diria "não achei" para o financeiro. O fluxo aprovado pede a recusa com o nome do dado. Com a lista, o agente chama `data_describe` com a tabela, recebe `NOT_IN_ROLE`, e a recusa entra no Registro de dados. Mostrar ao agente o nome de uma tabela que o papel não lê é [ideia nossa], e é o que a leitura ao vivo já faz com as operações [visto, `apps/server/src/hub/connectors/read.ts:178-195`].

A ordem do agente (parte 3, `C4`) ganha uma linha: "A table under `withheld` exists and this person's role does not read it. Call data_describe with it once, then tell the person their role does not read it."

Leis novas na conformidade:

1. Uma tabela em `withheld` nunca aparece em `tables`, e o seu `read` responde `NOT_IN_ROLE` sem chamar `rows`.
2. Uma consulta que o banco recusa com permissão responde `NOT_IN_ROLE` e não devolve linha.

Lei nova da implementação, num teste do servidor: **o catálogo de um papel lista exatamente as tabelas que o login do papel consegue ler**. O teste compara `catalog().tables` com `information_schema.tables` lido como o login.

**O texto da recusa (`T4`).** Na linha da ferramenta e no estado de recusa da página Dados: "Seu papel não lê esta tabela. Peça a quem administra a empresa." Quando a ferramenta sabe o rótulo, que é o caso de `data_describe` com a tabela: "Seu papel não lê Clientes. Peça a quem administra a empresa." A parte 3 já criou o texto sem o rótulo.

### `C4`. As telas de quem lê

| Tela do escopo | O que muda | Peça de hoje |
| --- | --- | --- |
| `p4-01` Papel, com os dados | Em cada sistema do papel aberto, um bloco **Dados copiados** com as tabelas marcáveis | `OpenRole` [visto, `apps/web/src/hub/identity/role-editor.tsx:117`], `ConnectorPicker` [`role-picker.tsx:105`] |
| `p4-02` Tabela, Quem lê | Aba nova na página da tabela: os papéis que leem e quantas pessoas cada um tem. Só mostra, com o caminho para Papéis | a página da tabela da parte 1 |
| `p4-03` Recusa na conversa | A linha da ferramenta com o texto da recusa | `data-specs.ts` da parte 3 |
| `p1-11` Dados, membro | O membro vê o item **Dados** e só as tabelas do papel dele, sem **Ligar** e sem o menu da linha | o trilho [visto, `apps/web/src/routes/_app/companies/$companyId/route.tsx:87`] |

Rotas novas, da trilha Dados, em `packages/hub-api/src/copies.ts`:

```ts
/** Os papéis que leem cada cópia. Quem vê: quem vê a lista de cópias. */
export const listCopyReaders = defineOperation({
  id: 'listCopyReaders', method: 'GET', path: '/api/companies/{companyId}/copy-readers',
  success: { status: 200, body: z.object({ readers: z.array(z.object({ copyId: CopyId,
    roles: z.array(z.object({ role: Role, label: z.string(), members: z.int().min(0) })) })) }) },
  // `members` é a contagem que p4-02 mostra; quem não administra cópias recebe só as cópias que o papel lê
})
/** Troca as cópias que um papel lê. Só dono ou administrador. */
export const setRoleCopies = defineOperation({
  id: 'setRoleCopies', method: 'PUT', path: '/api/companies/{companyId}/roles/{role}/copies',
  input: { params: OfRole, body: z.object({ copies: z.array(CopyId).max(200) }) },
  success: { status: 200, body: z.object({ copies: z.array(CopyId) }) },
  failures: ['NOT_FOUND', 'ROLE_FIXED', 'ROLE_NOT_FOUND', 'COPY_NOT_FOUND', 'COPY_DATABASE_UNAVAILABLE', ...],
})
```

A tela Papéis é da identidade e não importa a trilha Dados. Ela já recebe o kit dos conectores pela rota, e não por importação [visto, `apps/web/src/routes/_app/companies/$companyId_/settings/roles.tsx:59`]. As tabelas entram do mesmo jeito: a rota carrega as cópias e os leitores e os passa a `Roles` como uma propriedade. **Salvar** grava o papel com `updateRole` e as tabelas com `setRoleCopies`. Dono e administrador aparecem só para leitura, com a frase que já existe [visto, `role-editor.tsx:130-134`]. Sob o bloco, uma frase diz que desmarcar uma tabela não tira a leitura ao vivo do sistema, que segue as operações marcadas acima: no contrato, uma operação servida por uma tabela retida cai na leitura ao vivo [visto, `packages/hub-api/src/company-data.ts:205-206`].

**O membro na página Dados.** Hoje `listCopies` admite `readCopies`, que é dono, administrador e desenvolvedor [visto, `apps/server/src/hub/identity/admission.ts:118-121`], e o trilho mostra o item só com `may.manageCopies`. Muda assim:

- `listCopies`, `listCopyRuns` e `sampleCopy` admitem todo membro, com a ação nova `seeData`. Para quem não tem `manageCopies`, a lista traz só as cópias que `copiesReadBy` dá, sem as propostas.
- O desenvolvedor continua vendo todas as tabelas, as colunas e as rodadas, porque administra cópias. A amostra ele vê só das que o papel lê.
- `sampleCopy` passa a ler com o login do papel de quem pede, e a ação `readCopyRows` da parte 1 sai.
- `listCopyModels` continua `readCopies`. A página Dados só pede os modelos com `may.manageCopies`.
- A primeira abertura da página Dados numa empresa com cópia de `readers_set` falso semeia as marcas, como o catálogo (critério 1.4).
- O membro que abre o endereço de uma tabela que o papel não lê recebe "não encontrado", como toda página que a pessoa não pode ver (security S10). O texto "Seu papel não lê esta tabela" do escopo 3.3 fica para a conversa, onde o agente sabe que a tabela existe.

Esta última linha troca o estado de recusa que o escopo desenhou para a página por "não encontrado". O motivo é a regra `S10` do repositório, que o guia de segurança impõe a toda rota. A troca está na lista de conflitos do índice.

### `C6`. O Registro de dados

Hoje uma leitura ao vivo deixa só uma linha de log [visto, `apps/server/src/hub/connectors/read.ts:231-247`], e a leitura de uma cópia não deixa nada. O rastro do Mastra guarda a saída da ferramenta, que são as linhas, e a observabilidade expira em 14 dias [visto, `apps/server/src/builder/conversation/storage.ts:5`]. Por isso o registro é uma tabela nossa, no molde do registro de escrita [visto, `apps/server/src/hub/connectors/tables.ts:218-249`].

```ts
// apps/server/src/hub/data/tables.ts (novo): o esquema `data` no banco do Hub
export const data = pgSchema('data')

/** Uma leitura de dado da empresa por um agente ou um app: quem, o quê, a consulta e o resultado. Nunca as linhas. */
export const dataRead = data.table('data_read', {
  id: uuid('id').primaryKey(),
  companyId: text('company_id').notNull(),
  at: instant('at').notNull(),
  personId: text('person_id').notNull(),                 // sem chave estrangeira, como connector_write
  agent: text('agent', { enum: ['ASSISTANT', 'BUILDER', 'AGENT', 'APP'] }).notNull(),
  projectId: text('project_id'),
  agentId: text('agent_id'),
  threadId: text('thread_id'),                           // a conversa, para o caminho "Abrir a conversa"
  verb: text('verb', { enum: ['SAMPLE', 'QUERY', 'LIVE'] }).notNull(),
  tables: text('tables').array().notNull(),              // os nomes das tabelas lidas ou pedidas
  connectionId: uuid('connection_id'),                   // só em LIVE
  operation: text('operation'),                          // só em LIVE
  query: text('query'),                                  // só em QUERY: a consulta, até 4000 caracteres
  outcome: text('outcome').notNull(),                    // o `kind` da resposta: QUERY, TABLE, LIVE, NOT_IN_ROLE, ...
  rows: integer('rows'),                                 // quantas linhas voltaram; null numa recusa
  ms: integer('ms').notNull(),
}, (table) => [
  foreignKey({ name: 'data_read_company_id_fkey', columns: [table.companyId], foreignColumns: [company.id] }).onDelete('cascade'),
  index('data_read_company_at_idx').on(table.companyId, table.at),
  // check do agente, do verbo, dos campos de LIVE, da consulta até 4000 e das contagens, como connector_write
  policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
])
```

O login do Hub recebe só `SELECT` e `INSERT` nessa tabela, nunca `UPDATE` nem `DELETE`, numa migração de permissão à parte, como a do registro de escrita [visto, `apps/server/migrations/20261107125733_e245_connector_write_grants`]. A lista de permissões só muda num PR próprio, com a palavra do fundador (data D11). Ele a deu em 2026-11-14 (P2, no índice): cada permissão num PR só dela.

**Quem grava.** Um só lugar para as leituras do contrato, e um só para as leituras ao vivo:

```ts
// apps/server/src/hub/data/record.ts
export type ReadBy = Readonly<{ agent: 'ASSISTANT' | 'BUILDER' | 'AGENT' | 'APP'; agentId?: string; threadId?: string }>

/** Embrulha o contrato pronto: cada read() grava uma linha depois de responder. O nome não é recordedData,
 *  que a parte 3 já usa num ajudante de teste (data-tools/test-data.ts). */
export function withDataLog(data: CompanyData, deps, scope: SessionScope, by: ReadBy): CompanyData
//  Embrulha CompanyData e não DataSources: uma tabela retida responde NOT_IN_ROLE sem chamar rows (C3),
//  e a recusa precisa entrar no registro.
//  read TABLE     -> verb SAMPLE, tables [nome], outcome, rows
//  read QUERY     -> verb QUERY, tables = as da resposta (ou [] numa recusa), query = o texto, outcome, rows
//  read OPERATION servida por tabela -> SAMPLE; ao vivo, o registro é o de readThrough
//  describe, act  -> passam sem registro (o catálogo não lê dado; a escrita tem o registro dela)

// createCompanyData: uma assinatura só nas partes 3 e 4
export function createCompanyData(deps): (scope: SessionScope,
  context?: { by?: ReadBy; turn?: TurnBinding }) => CompanyData
//  sem turn, live e funnel respondem NOT_GRANTED (parte 3); sem by, a leitura é registrada com o agente
//  ASSISTANT, sem agentId e sem threadId (escolha desta spec: o registro nunca fica sem linha)

/** A porta que hub/connectors recebe para a leitura ao vivo. */
export function liveReadRecorder(deps): RecordRead
```

A leitura ao vivo grava no ponto onde hoje só há o log, `readThrough` [visto, `apps/server/src/hub/connectors/read.ts:231-247`], por uma função entregue na montagem do servidor (`recordRead: () => RecordRead`, que `main.ts` liga a `liveReadRecorder(deps)` de `hub/data/public.ts`, tarde, como `copies: () => ConnectionCopies` em `apps/server/src/hub/connectors/public.ts:96-97`, ligada em `apps/server/src/main.ts:193-205`), para `hub/connectors` não importar `hub/data`. As leituras `by: 'copy'`, que são do motor de cópia, não entram: elas já têm as rodadas. `ReadRequest` [visto, `read.ts:20-33`] não traz a conversa nem o agente salvo: a linha `LIVE` sai sem `threadId` e sem `agentId`, e o agente vem de `by` e de `speaker.kind` (`VERSION` é `AGENT`). Nas ferramentas de dados, a conversa vem de `context.agent?.threadId` do Mastra [visto, `node_modules/@mastra/core/dist/tools/types.d.ts:172-183`].

**Sem registro, sem linhas.** Se a gravação falhar, a leitura de tabela ou a consulta responde `TABLE_UNAVAILABLE`, a leitura ao vivo responde `UNREACHABLE`, e o servidor registra `DATA_READ_UNRECORDED`. É regra nova desta parte. O registro de escrita não é molde aqui: ele registra `CONNECTOR_WRITE_UNRECORDED` e devolve a resposta mesmo assim [visto, `apps/server/src/hub/connectors/write-record.ts:333-343`].

**O que o registro não vê.** A leitura que um app publicado faz das tabelas dele e das cópias liberadas, por `db.query` na borda, não passa pelo Hub e não aparece. As leituras ao vivo do app, que passam pelo Hub, aparecem como `APP`. O exemplo do escopo fala em "2 do app de vendedores": são essas.

**As rotas e a tela.**

```ts
// packages/hub-api/src/data-reads.ts (novo)
export const DataReadEntry = z.object({
  id, at, person: { id, name }, agent, project: { id, name }.nullable(), agentId: z.string().nullable(),
  // agentId e não o nome: não há porta que dê o nome de um agente salvo (lacuna no relatório da parte)
  threadId: z.string().nullable(), verb, tables: z.array(z.string()),
  system: z.string().nullable(), operation: z.string().nullable(),
  query: z.string().nullable(), outcome: z.string(), rows: z.int().nullable(), ms: z.int(),
})
export const listDataReads = defineOperation({
  id: 'listDataReads', method: 'GET', path: '/api/companies/{companyId}/data-reads',
  input: { params: InCompany, query: z.object({
    person: PersonId.optional(), agent: Agent.optional(), table: z.string().optional(),
    outcome: z.enum(['OK', 'REFUSED']).optional(), page: z.string().optional() }) },
  success: { status: 200, body: z.object({ reads: z.array(DataReadEntry), next: z.string().nullable() }) },
})
export const exportDataReads = defineOperation({
  id: 'exportDataReads', method: 'GET', path: '/api/companies/{companyId}/data-reads/export',
  // os mesmos filtros; JSON { reads (até 5000), complete }, da mais nova para a mais antiga.
  // O contrato só serve JSON (packages/hub-api/src/operation.ts:15-34): a tela monta o CSV com um Blob.
})
```

- Quem vê: dono e administrador, com a ação nova `readDataLog`, que usa o mesmo `statement` de `manageRoles` [visto, `apps/server/src/hub/identity/admission.ts:124`]. `CompanyMay` ganha `readDataLog` [visto, `packages/hub-api/src/roles.ts:47-54`] para o menu.
- A página de 50 linhas usa `pageKey` e `pageOf`, como as rodadas [visto, `apps/server/src/hub/copies/list.ts:187-218`].
- Sem prazo (E4a): nenhuma tarefa apaga linhas.
- A tela é um arquivo novo de rota em `apps/web/src/routes/_app/companies/$companyId_/settings/`, com `staticData.section` e `needs: 'readDataLog'`. O menu de Configurações a acha sozinho, sem editar a moldura [visto, `settings/route.tsx:30`, `apps/web/src/ui/settings-index.tsx:11`].

| Tela do escopo | O que mostra | Peças |
| --- | --- | --- |
| `p4-04` Registro de dados | Uma linha por chamada: quando, quem, qual agente, o que foi lido, o resultado e quantas linhas. Filtros por pessoa, agente, tabela e resultado. **Exportar** | `FramedTable` de `apps/web/src/ui/table.tsx`, `Pager` de `ui/pager.tsx:9` |
| `p4-05` Uma chamada | Quem, qual agente, a conversa, a tabela, a consulta, o resultado, as linhas e o tempo. **Abrir a conversa**, **Copiar a consulta**. Nenhuma linha de dado | a linha aberta no endereço, como o papel aberto [visto, `apps/web/src/hub/identity/roles.tsx:92`] |
| `p4-06` Registro vazio | "Nenhuma leitura ainda." e o que vai aparecer ali | `Empty` de `ui/states.tsx` |

## Modelo de dados

| Onde | O que | Quem escreve | Quem lê |
| --- | --- | --- | --- |
| Hub, `copies.copy_reader` | Um papel que lê uma cópia | `insertedCopy` (N3b-1), `setRoleCopies`, a semeadura | `catalogOf`, `listCopies`, `listCopyReaders`, `reconcileReaders` |
| Hub, `copies.copy.readers_set` | Os leitores já foram gravados uma vez | Os mesmos três | A semeadura |
| Hub, `data.data_read` | Uma leitura de dado | `withDataLog`, `readThrough` | `listDataReads`, `exportDataReads` |
| Empresa, logins `conexus_role_<id>` | Um login por papel editável ou próprio | `reconcileReaders` | `queryOf`, `rowsOf`, `sampleOf` |

As migrações só acrescentam (data D6). Cada tabela nova tem a política de linha por empresa, como as outras [visto, `apps/server/src/hub/copies/tables.ts:90`]. As permissões das duas tabelas novas entram em migrações de permissão próprias e em `database-grants.sql`, que o teste de catálogo confere (data D10, `D11`).

## Propriedades de correção

1. **Sem falha, o banco nunca volta a ler o que o Hub tirou.** Para toda sequência de atos de dar e tirar e toda intercalação com outras reconciliações da empresa, sem falha, quando um ato responde, as tabelas que o login de um papel lê estão contidas no que `copy_reader` diz, e nenhuma reconciliação posterior as alarga além disso; enquanto um ato de tirar não respondeu, o login lê o que lia antes dele. Com a `reconciled` falhando depois de tirar e a reposição das marcas também falhando, ou com o servidor caindo entre o commit do Hub e a aplicação, o login lê a tabela até a reconciliação seguinte, no máximo no intervalo da cópia, e `companyData().read` recusa a consulta com `NOT_IN_CATALOG` nesse intervalo. *Valida: requisitos 2.1 a 2.5, 2.11, 2.12.*
2. **`reconcileReaders` converge.** Para todo conjunto pedido, rodar uma ou duas vezes deixa o banco igual, e o login lê exatamente as tabelas pedidas. *Valida: requisito 2.2.*
3. **O catálogo e o login concordam.** Para todo papel, as tabelas do catálogo são exatamente as que o login do papel lê. *Valida: requisitos 3.1, 3.2.*
4. **Retida não vaza.** Para toda tabela em `withheld`, nenhuma coluna, descrição ou linha dela chega a quem pergunta. *Valida: requisitos 3.3, 3.4.*
5. **A cópia nasce com quem já lê a origem.** Para todo papel e toda cópia nova, o papel está em `copy_reader` se e só se segura as leituras da origem. *Valida: requisito 1.2.*
6. **Removida** (2026-11-15): a regra do documento do cliente saiu. O número fica para que as outras não mudem de lugar.
7. **Uma leitura, uma linha.** Para toda chamada de `rows`, `query` ou leitura ao vivo de agente ou app, o registro ganha exatamente uma linha, e a linha nunca tem um valor das linhas lidas. *Valida: requisitos 6.1 a 6.4.*
8. **Sem registro, sem linhas.** Se a gravação falhar, a leitura não devolve linha. *Valida: requisito 6.5.*
9. **A reconciliação mais velha não desfaz a mais nova.** Para todo par de reconciliações da mesma empresa, a de bilhete menor aplicada depois da de bilhete maior não muda permissão nenhuma; como quem tira pega o bilhete depois do commit do Hub, toda aplicação que passa depois dela leu o Hub já sem a tabela. *Valida: requisitos 2.3, 2.10.*

## Tratamento de erros

Nenhum erro é engolido. Cada falha tem um nome, um log e uma resposta.

| Onde | O que falha | Resposta | Log |
| --- | --- | --- | --- |
| `setRoleCopies`, ao tirar | O Hub apagou as marcas e a `reconciled` falhou | As marcas repostas numa transação do Hub; 503 `COPY_DATABASE_UNAVAILABLE`. Nada muda | `COPY_READERS_FAILED` com o SQLSTATE |
| `setRoleCopies`, ao repor | A reposição das marcas também falhou | 503 `COPY_DATABASE_UNAVAILABLE`. O Hub diz menos que o banco até a reconciliação seguinte, no máximo no intervalo da cópia | `COPY_READERS_PENDING` como erro, com a empresa e o papel |
| Fim da rodada de cópia | A `reconciled` da empresa falhou | O resultado da rodada não muda | `COPY_READERS_FAILED` |
| `setRoleCopies`, ao dar | O Hub gravou e o banco da empresa falhou | 200: o papel está salvo. A leitura é recusada até o conserto | `COPY_READERS_PENDING` |
| `readAs`, para `queryOf` e `rowsOf` | `42501` ou `NO_LOGIN` com login de papel, e o catálogo lista ao menos uma tabela | `reconcileReaders` e uma nova tentativa. Se repetir, `NOT_IN_ROLE` na consulta e `TABLE_UNAVAILABLE` na tabela | `COPY_READERS_REPAIRED`, ou `DATA_READ_REFUSED` com a pessoa e sem a consulta (security S41) |
| `readAs` | `42501` e o catálogo não lista tabela nenhuma | `NOT_IN_ROLE`, sem reconciliar | `DATA_READ_REFUSED` |
| `roleLogin` | O nome passa de 63 bytes | Falha `INTERNAL_UNEXPECTED` ao criar o papel: não há login truncado | `COPY_READER_NAME` |
| `withDataLog`, `readThrough` | A gravação do registro falhou | `TABLE_UNAVAILABLE` na tabela e na consulta, `UNREACHABLE` ao vivo. Nenhuma linha volta | `DATA_READ_UNRECORDED` |
| `listDataReads` | O Hub não respondeu | 503. A tela diz "Não deu para ler o registro agora." com **Tentar de novo** | o da rota |
| Quem não é dono nem administrador abre o Registro | Sem permissão | "não encontrado" (security S10), e o item não aparece no menu | nenhum |

## Estratégia de teste

Os testes da CI usam dublês e bancos descartáveis. As recusas desta parte são testes de isolamento: entram em `scripts/rerun-never.json` e nunca ganham segunda rodada (testing T4).

| O que | Como | Modelo a seguir |
| --- | --- | --- |
| `reconcileReaders` | Banco de empresa descartável. Dois papéis, três tabelas. Cada login lê as suas e é recusado nas outras com `42501`. Rodar duas vezes não muda nada. Tirar uma tabela recusa a leitura seguinte | `apps/server/src/hub/copies/grants.test.ts:63-92`, `apps/server/src/platform/company-postgres.test.ts:141-163` |
| O ataque direto (testing T13) | Como o login de um papel: `SET ROLE`, `set_config('role', ...)` com `query_to_xml`, uma escrita, uma tabela de outro papel. Todos recusados pelo banco | O teste do ataque direto da parte 4 |
| A ordem dos atos | O banco da empresa derrubado no meio de tirar e de dar. Depois de cada caso, o login nunca lê mais do que `copy_reader` | `apps/server/src/platform/test-neon.ts` |
| N3b-1 | Uma cópia ligada com dois papéis: um segura as leituras da origem e o outro não | `apps/server/src/hub/copies/test-copies.ts` |
| O catálogo e o login concordam | `catalog().tables` contra `information_schema.tables` como o login | o teste de `catalogOf` da parte 1 |
| O contrato | As duas leis novas, com o caso recusado | `packages/hub-api/src/company-data.test.ts` |
| O registro | Cada verbo grava uma linha. Uma busca pelo valor de uma célula lida não acha nada na tabela. A gravação derrubada não devolve linha | `apps/server/src/hub/copies/grants.test.ts:63-92` para derrubar uma porta |
| O bilhete | Dois bilhetes pegos, o maior aplicado primeiro: o menor volta `SUPERSEDED` e não muda nada. A ordem da rodada 3, item 1(c): uma reconciliação parada depois de ler o Hub com a tabela, uma troca que tira a tabela e responde 200, a parada solta volta `SUPERSEDED` e o login não lê a tabela. Duas reconciliações e um `grantCopy` ao mesmo tempo terminam sem erro. Duas semeaduras ao mesmo tempo marcam uma vez | `apps/server/src/hub/copies/grants.test.ts:81-83` para dublar uma porta |
| As rotas | Estado e corpo literais, e os casos negativos: outro papel, outra empresa, sessão vencida (testing T10) | os testes de `company-routes.ts` |
| As telas | Testes de tela com msw, e QA em navegador real a 1366 e 390 px nos dois temas (testing T23, `T25`) | `apps/web/src/hub/identity/roles.test.tsx`, `apps/web/src/routes/_app/companies/$companyId_/settings/settings.test.tsx:113` |

**As leis de conformidade desta parte**

1. O catálogo de um papel lista exatamente o que o login do papel lê.
2. Uma tabela retida responde `NOT_IN_ROLE`, e nada dela chega a quem pergunta.
3. O banco nunca lê mais do que o Hub diz, com o banco da empresa caindo em qualquer ponto.
5. Toda leitura de dado deixa uma linha, sem as linhas lidas.

**As perguntas com resposta conhecida.** Na Lume, com o dublê do Sankhya: o papel Vendas, de Bruno, lê `sankhya_vendas`, `sankhya_itens_venda`, `sankhya_vendedores` e `sankhya_produtos`. O papel Financeiro, de Carla, lê `sankhya_clientes`. Os exemplos ilustram e não viram regra.

| Pergunta | Quem | Resposta esperada | O que fica no registro |
| --- | --- | --- | --- |
| "Quanto vendi em outubro?" | Bruno | O número do dublê, com `sankhya_vendas` na origem | Uma linha `SAMPLE` e uma `QUERY`, `sankhya_vendas`, com a contagem |
| "Quantos clientes novos entraram no mês?" | Bruno | "Seu papel não lê Clientes. Peça a quem administra a empresa." | Uma linha `SAMPLE`, `sankhya_clientes`, `NOT_IN_ROLE`, sem contagem |
| Lea abre o Registro de dados e filtra por Bruno | Lea | As linhas de Bruno, a recusa entre elas | nada novo |
| Bruno abre o endereço do Registro de dados | Bruno | "não encontrado" | nada |

**A rodada com modelo real.** As perguntas acima rodam com `CONEXUS_EVAL_REAL_MODEL` contra o dublê do Sankhya. O Sankhya real é lido num lugar só, o uso de fechamento do fundador (delivery L17): ele dá a um papel de teste só a tabela de vendas, pergunta pelos clientes como uma pessoa desse papel e vê a recusa e a linha no Registro. É só leitura.

**Mutações à mão (testing T27).** As linhas-chave: o `REVOKE ALL` antes do `GRANT` em `reconcileReaders`, a ordem banco e Hub ao tirar, o filtro de `copiesReadBy` no catálogo, o `NOT_IN_ROLE` de uma tabela retida, e a resposta `TABLE_UNAVAILABLE` quando o registro falha.

## Tabela de referência

| Peça | Hoje no `main` | Referência | Veredito |
| --- | --- | --- | --- |
| Quem lê cada tabela | `copies/tables.ts:129-153` (só por Projeto) | Uma tela de permissão por tabela. Privilégios por tabela de um catálogo de dados | embrulhado: uma tabela nossa, porque o controle de acesso da biblioteca fixa os recursos ao iniciar |
| O banco garante | `copy-sql.ts:331-347`, `app-read.ts:41-67` | Papéis e `GRANT` do PostgreSQL. A prova foi rodada no Postgres 18 | nativo |
| A recusa | `read.ts:178-195` | Uma ferramenta que executa SQL devolve o erro do banco | nativo (o erro `42501` do PostgreSQL) |
| A lista do que o papel não lê | `connectors.ts:42-48` (`allowed`) | nenhuma | remendo pequeno, [ideia nossa] |
| O registro | `connectors/tables.ts:218-249`, `read.ts:231-247` | Um registro de auditoria por token e um histórico de consultas | embrulhado: uma tabela nossa. O rastro do Mastra guarda as linhas e expira |
| A tela do registro | nenhuma | Um registro de auditoria e um monitor de uso | nativo (as peças de `apps/web/src/ui/`) |
