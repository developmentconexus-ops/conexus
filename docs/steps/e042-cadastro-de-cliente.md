# Etapa 4.2: Cadastro de cliente

## A página do fundador

**No fim desta etapa** você cadastra uma empresa cliente na Central de Operação, com CNPJ, razão
social, nome e o e-mail do administrador dela. Ele recebe o convite de 4.1 e entra como primeiro
dono. A Conexus nunca vira membro da empresa, e o cliente deixa de criar empresas.

**O roteiro de uso.** No Hub publicado, sem terminal:

1. No menu da conta, abra **Central de Operação**. A lista diz **Nenhum cliente cadastrado.**: as
   empresas de teste saíram. Em **Suas empresas** não há mais **Nova empresa**.
2. Em **Cadastrar cliente**, um CNPJ com dígito errado e o seu próprio e-mail são recusados. Com
   os dados certos e o e-mail da segunda caixa, o cliente fica **Aguardando o administrador**.
3. Abra o cliente, corrija a razão social e reenvie o convite. O mesmo CNPJ de novo dá **Já existe
   um cliente com este CNPJ.**
4. Na segunda caixa chega **Conexus convidou você para ser o primeiro dono de X**. Crie a senha e
   clique **Aceitar convite**: a empresa abre para essa pessoa.
5. Na Central, o cliente está **Ativo**, com o nome e o e-mail do dono, sem ações de convite e sem
   **Corrigir dados**. Para você, a empresa não aparece em Suas empresas.

**O que você faz, e quando.** Antes: uma segunda caixa de e-mail, não a sua. No começo: aprova
esta página e o grant abaixo. Antes da publicação: confirma as empresas de teste que a migração
apaga. No fim: faz o roteiro, diz o que viu e aprova os textos das telas.

**Decisões já dadas, 2026-10-16.** “p1. a / P2. A / P3. A / P4. A / P5. A / P6. B / P7. A / t1.
a / t2. a / t3. a / t4. a”. A empresa nasce no cadastro, sem membro, e o administrador vira dono
ao aceitar. O CNPJ é único pelas 14 posições, com letras aceitas. Corrige-se enquanto o cliente
aguarda; trocar o e-mail é cancelar e convidar outro. A Central mostra só dados e donos.

**A exceção de P6 B.** Uma migração só acrescenta (D6). Desta vez, única, apaga as empresas
sem cadastro na Central, com membros e convites; pessoas, senhas e sessões ficam. No rollback,
elas não voltam, e empresas criadas na versão anterior ficam fora da Central: não crie empresas nela.

**Fica de fora.** Apagar cliente (etapa 5), telefone, endereço, plano, consulta à Receita, entrar
como o cliente. Das issues `next-card` entra o item 23 da 39; os itens de 4.1 (1–4, 24 da 39; 3, 8 da 32)
e 5–7 da 39 já entraram. Os demais esperam: o cadastro não precisa deles e nada novo roda sozinho.

**A decisão sua pedida nesta etapa.** O login do Hub poderá ler, gravar e alterar a tabela de
cadastro, mas **não apagar**; a exclusão é da etapa 5, com o grant dela. Resposta do fundador,
2026-10-16: “Aprovo” (opção A: ler, gravar e alterar por `hub_runtime`, sem apagar).

## As unidades

Base: `main` `e4a8c44`; estudo de 2026-10-16; revisão pelo
[checklist](../reference/checklist.md).

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | Uma tabela de ações, prova em união | identidade do servidor | segurança | organization-best-practices, better-auth-security-best-practices | 4.1 fechada |
| U2 | Tabela `operations.client` e grants, PR próprio (D11) | operações, migrações, grants | dados | neon-postgres | U1, palavra do fundador |
| U3 | Portas da identidade, módulo, contrato e rotas `operations`; convite de dono por 4.1 | contrato, identidade, operações | dados | organization-best-practices, fastify-best-practices | U2 |
| U4 | Telas da Central | web de operações, rotas, menu | web | shadcn | U3 |
| U5 | Retira a criação pelo cliente; migração de P6 B | contrato, identidade, web, migrações | dados | organization-best-practices | U3 |
| U6 | Convite de dono na leitura e no e-mail; percurso | identidade, e2e, referências | testes | nenhuma | U4, U5 |

Sem paralelismo: U1, U3, U5 e U6 dividem a identidade; U4 e U5, as telas.

**Orçamento de código alterado** (adições e remoções sem testes/gerados): U1 **400**; U2 **150**;
U3 **1.650**; U4 **1.050**; U5 **400**; U6 **300**. Total: **3.950**, teto 4.000 (L2).
Se passar de 4.000, divide-se: **4.2a** (U1–U3, U5, U6, lista e cadastro de U4); **4.2b**
(detalhe, correção e ações de convite de U4).

**Encaixes de 4.1 conferidos** no código de 4.1 em `main` (`6e6afff`):

- **E1.** `InvitationView` com seis `kind` e `inviterName`, por `getInvitation`.
- **E2.** Comandos de 4.1 chamam `admit` sob transação e `lockCompany`, sem receber a prova por parâmetro. Em 4.2 U1, `admit` admite o operador para `invite` (`owner`) se a empresa não tem membros (`AWAITING_OWNER`), e dá 404 em `readInvitations`. Cancelamento usa DELETE; renovação, PUT.
- **E3.** `renderInvitation` com `inviterName`; envio pós-commit via `mailInvitation`, `mailed_at` gravado na resposta ou bounce, replay do pendente sem marca.
- **E4.** `revision` e `superseded_at` em `auth.invitation`; `INVITATION_STALE`, `INVITATION_CLOSED`. Reemissão (`replaces`) exige convite expirado sob o lock.
- **E5.** `acceptInvitation` com revisão sob `lockCompany`.
- **E6.** `Notice`, `NotFound` com destino inicial, linha de convite de Pessoas.
- **E7.** O snapshot de `database-grants.sql` após 4.1.

## Os critérios de aceite

| # | Unidade | Critério observável, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| A1 | U1 | Forjar cada variante da prova não compila | `admission.check.ts` | must |
| A2 | U1 | O operador recebe 404 em `getCompany`, `listMembers` e `listInvitations`, o motivo só no log | `companies.test.ts` “fora: o operador” | must |
| A3 | U3 | Quem não é operador recebe 404 nas quatro rotas `/api/clients` | `clients.test.ts` “fora: o membro” | must |
| A4 | U3 | O cadastro cria a empresa sem membro e um convite `owner` pendente; o operador não tem linha em `member` | `clients.test.ts` “sem membro” | must |
| A5 | U3 | Mesma chave e corpo: a mesma empresa e um convite; outro corpo: 409 `IDEMPOTENCY_CONFLICT`; duas juntas: uma empresa | `clients.test.ts` “a chave” | must |
| A6 | U3 | `12ABC34501DE35` e um numérico válido entram, com máscara ou minúsculas; dígito errado, 13 posições, zeros: 400; CNPJ repetido: 409 `CLIENT_EXISTS`, nada criado; dois juntos: 201 e 409 | `clients.test.ts` “o CNPJ” | must |
| A7 | U3 | E-mail de operador: 422 `CLIENT_OWNER_IS_OPERATOR`; recusa plantada após cada escrita: zero linhas | `clients.test.ts` “recusas” | must |
| A8 | U3 | Corrigir aguardando: 200, revisão +1, nome novo no convite; revisão velha: 412 `CLIENT_STALE`; ativo: 409 `CLIENT_ACTIVE`; contra o aceite, um vence | `clients.test.ts` “corrigir” | must |
| A9 | U3 | A lista pagina 50 por token; o ativo traz só donos; empresa sem cliente não aparece e dá 404; id malformado: 404 sem consulta | `clients.test.ts` “ler” | must |
| A10 | U3 | O operador reenvia, cancela e reemite o convite de dono pelas rotas de 4.1; um segundo vivo: 409 `OWNER_INVITATION_OPEN`; empresa ativa: 404 | `owner-invitation.test.ts` | must |
| A11 | U3 | `CLIENT_REGISTERED` e `CLIENT_CORRECTED` levam trace e ids, nunca CNPJ, nome ou e-mail | `clients.test.ts` “log” | must |
| A12 | U4 | Cada célula da matriz renderiza; corte, 502 ou 503 mantém valores e chave; cada recusa cai no seu lugar | `clients.test.tsx`, `register-client-form.test.tsx`, `correct-client-form.test.tsx` | must |
| A13 | U4 | Só com `mayOperate` aparece o link; sem ele, `/operations/…` dá a página 404; T23 nas três larguras, temas e teclado | `account-menu.test.tsx`, `route.test.tsx`, navegador | must |
| A14 | U5 | POST `/api/companies` e `/companies/new` dão 404; `createOrganization` direto é recusado a toda sessão; a lista vazia diz **Você ainda não participa de nenhuma empresa.**, sem botão | `companies.test.ts`, `sign-up.test.ts`, `companies.test.tsx` | must |
| A15 | U5 | A migração apaga as empresas sem linha de cliente, com membros e convites, e limpa a empresa ativa; pessoas, contas, sessões e empresas com cliente ficam | `migrate.test.ts` “a exceção de P6” | must |
| A16 | U6 | Empresa aguardando: convite e e-mail dizem “Conexus”, Dono, “primeiro dono”; aceito, o dono vê a empresa e o operador não; uma pessoa em dois cadastros é dona dos dois | `invitation-journey.test.ts`, `tests/e2e/client.test.ts`, uso real | must |

## A matriz de estados

Dono: Hub. `AWAITING_OWNER` sem linha em `member`, `ACTIVE` com uma ou mais; derivado, sem coluna
(C26).

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido, recusado ou concorrência |
| --- | --- | --- | --- | --- | --- |
| Central: lista | “Nenhum cliente cadastrado.”, **Cadastrar cliente** | `Loading`; página na URL (W18) | `Error`, nunca lista vazia | não operador: 404 | nome, razão social, CNPJ, “Cadastrado em”; “Aguardando o administrador” com o e-mail, “Convite vencido”, “recusado”, “cancelado” ou “Ativo” |
| Cadastrar cliente | CNPJ, Razão social, Nome de exibição, E-mail do administrador; “Ele recebe um convite e entra como primeiro dono.” | “Cadastrando…”, bloqueado | no campo, inclusive `CLIENT_EXISTS` e `CLIENT_OWNER_IS_OPERATOR` | — | corte, 502, 503: “Não confirmamos o cadastro. Veja a lista antes de tentar de novo.” |
| Detalhe, aguardando | dados; convite (e-mail, estado, prazo); Reenviar, Convidar de novo, Cancelar, Convidar outro e-mail (sem vivo), Corrigir dados | `Loading` | `Error` | 404 | aceito noutra aba: a leitura seguinte diz Ativo |
| Detalhe, ativo | dados, “Ativo desde”, donos; sem ações | `Loading` | `Error` | 404 | sem membros comuns, convites, conversas, apps |
| Corrigir dados | valores atuais | “Salvando…” | como no cadastro | 404 | “Este cliente mudou.” (412); “Este cliente já está ativo.” (409) |
| Convidar outro e-mail | e-mail vazio | “Convidando…”, chave mantida | `OWNER_INVITATION_OPEN`, `MAIL_BOUNCED` | 404 se ativo | corte: regras de 4.1 |
| Cancelar convite de dono | confirmação com o e-mail (4.1) | “Cancelando…” | comum | atualiza | o link: “Este convite foi cancelado.” |
| Convite do administrador | 4.1, com “Conexus”, Dono, “primeiro dono” | 4.1 | 4.1 | 404 | 4.1 |
| Suas empresas | “Você ainda não participa de nenhuma empresa.”, sem botão | 4.1 | 4.1 | — | a empresa aparece só depois do aceite |
| Menu da conta | “Central de Operação” só com `mayOperate` | — | — | — | sem o papel, o link sai na leitura seguinte |
| `/companies/new` | removida: página 404 com destino inicial (E6) | — | — | sempre | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `ClientSummary.{companyId,cnpj,legalName,registeredAt}`; `name` pela porta da identidade | operação | lista, detalhe |
| `ClientSummary.state`: `AWAITING_OWNER {ownerInvitation}` ou `ACTIVE {activeSince}` | porta da identidade | lista |
| `ownerInvitation.{id,email,state,expiresAt,revision}`, o último convite de dono; `state` PENDING, EXPIRED, DECLINED, CANCELED | porta da identidade | lista, detalhe, ações |
| `Client`: o resumo, `revision` e, em `ACTIVE`, `owners: {name,email}[]`, um ou mais | as três operações de cliente | detalhe, correção |
| corpo `{cnpj,legalName,name}` com `ownerEmail` e `Idempotency-Key` (cadastro) ou `revision` do GET (correção) | formulário | comando |
| `listCompanies.mayOperate`, no lugar de `mayCreate` | tabela de ações | menu, guarda |
| `InvitationView.inviterName` | leitura de 4.1: “Conexus” se a empresa não tem membro | convite, e-mail |

Falhas novas, USER, settles, ação NONE (C48). No campo: `CLIENT_EXISTS` 409 (“Já existe um cliente
com este CNPJ.”); `CLIENT_OWNER_IS_OPERATOR` 422 (“Este e-mail é de um operador da Conexus.”). No
formulário: `CLIENT_STALE` 412 (“Este cliente mudou.”); `CLIENT_ACTIVE` 409 (“Este cliente já está ativo.”).
`OWNER_INVITATION_OPEN` 409 (“Já há um convite de dono em aberto.” / “Cancele-o antes de convidar outro e-mail.”).

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Dependência fora | O que imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Cadastro: INSERT `operations.client`; `createOrganization` e `createInvitation` do adapter | mesma chave: lock e replay; outra chave e mesmo CNPJ: `UNIQUE`, 409 | rollback das três | banco: 503, chave mantida | `CLIENT_REGISTERED`, ids | A4–A7, A11 |
| Envio do convite de dono, `mailed_at` | replay sem marca reenvia (E3) | render falhou: não envia | `MAIL_UNAVAILABLE`, sem marca | códigos de 4.1 | A10, A16 |
| Correção: UPDATE `operations.client`, `updateOrganization` | revisão: o segundo dá 412; contra o aceite, lock da empresa, e quem perde dá 409 | rollback das duas | banco: 503 | `CLIENT_CORRECTED`, ids | A8, A11 |
| Convite de dono pelas rotas de 4.1; aceite contra cancelamento | lock da empresa (E5); um vivo por empresa | rollback, com a compensação nativa | banco: 503 | códigos de 4.1 | A10, A16 |
| Migração de P6 B: DELETE `invitation`, `member`, `company`; UPDATE `session` | uma vez, no `migrate` (D9) | uma transação: nada sai, o Hub não sobe | `migrate` falha | código do `migrate` | A15 |
| `allowUserToCreateOrganization: false` | nenhuma escrita | nenhuma | nenhuma | `NOT_FOUND` no log | A14 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Admissão do operador | nova | `apps/server/src/hub/identity/admission.ts` | prova em união | S6, S11, propósito |
| Cadastro, correção e portas | nova | `apps/server/src/hub/operations/`, `identity/clients.ts` | criação pelo adapter | P2–P4; C4, C8 |
| Criação pelo cliente | removida | `companies.ts`, `company-routes.ts`, contrato, web | — | substituída pelo cadastro (P1) |
| Convite de dono | reuso de 4.1 | `invitations.ts`, `invitation-reads.ts`, e-mail | prova de operador | cartão de 4.1 |
| Central web | nova | `apps/web/src/hub/operations/`, `apps/web/src/routes/_app/operations/` | — | Q1 A |

**A medida do transplante.** Zero linhas antigas. `createCompanyCommand` é substituído pelo cadastro.

**A dívida.** Nenhuma nova. Fechamento (L19): S6 pede ser membro e operador age por fato da pessoa
(S11); exceção a D6 em “Roll back”; nota em 0015 (empresa sem membro aguardando). Risco: operador
promovido depois aceitar convite de dono.

## U1 Admissão do operador

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/` | muda `admission.ts`, `admission.check.ts`, `auth.ts`, `companies.ts` e testes | comandos e leituras da identidade |
| `docs/reference/` | boundaries: a admissão cobre o operador | revisores |
| `scripts/removals.json` | a remoção da checagem de papel | `npm run removals` |

### Os contratos que a unidade cria

- `type Admitted = MemberProof | OwnerInviterProof | OperatorProof`, nominais, feitas só em
  `admission.ts`: `MemberProof {kind:'MEMBER', companyId, personId, role}`; `OwnerInviterProof
  {kind:'OWNER_INVITER', companyId, personId}`, o operador numa empresa sem membro; `OperatorProof
  {kind:'OPERATOR', personId}`, o operador na instalação.
- `admit({tx, personId, companyId, action: CompanyAction}): Promise<MemberProof | OwnerInviterProof>`;
  `admitOperator({tx, personId, action: InstallationAction}): Promise<OperatorProof>`.
- Uma tabela `ACTIONS`: de membro `readCompany`, `readInvitations`, `invite`; de operador
  `operateClients`, `registerClient`, `correctClient` e `inviteOwner`, este só com a empresa sem
  membro, relida sob o lock da empresa (S8). Dela derivam `mayInviteAs` e `mayOperate`.

### A ordem do trabalho

1. A união e a tabela. Regras: S6, S7, S8, S10, S11, C16, C21, C22, C26. Funções: better-auth 1.7.8
   `defaultRoles[role].authorize` (`organization/access`), já usada; `user.role` lido na transação.
2. `admit` resolve o operador na empresa sem membro para a ação `invite`, limitando o papel a `owner`
   via `mayInviteAs` (E2).
3. Sai `mayCreateCompanies`; até U5, `mayCreate` e `allowUserToCreateOrganization` leem `mayOperate`.

### Como se prova

A1: `npm run typecheck`. A2: `npm run test -w @conexus/server` e a remoção (T12). Fecha o item 23
da issue 39.

## U2 Tabela do cliente e grants

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/operations/` | cria `tables.ts` | `drizzle.config.ts` |
| `apps/server/migrations/` | cria as migrações da tabela e dos grants | `migrate`, `catalog.test.ts` |
| `apps/server/database-grants.sql` | muda, dono do snapshot | `catalog.test.ts` |

### Os contratos que a unidade cria

Esquema `operations` (D4), tabela `client`: `company_id text PRIMARY KEY`, sem chave estrangeira
(D17); `cnpj text NOT NULL UNIQUE CHECK (cnpj ~ '^[0-9A-Z]{12}[0-9]{2}$')`;
`legal_name text NOT NULL`, de 1 a 150 por `CHECK`; `revision integer NOT NULL DEFAULT 0 CHECK
(revision >= 0)`; `attempt_key text NOT NULL UNIQUE`; `registered_at timestamptz NOT NULL`. Para
`hub_runtime`: `USAGE` no esquema, `SELECT, INSERT, UPDATE` na tabela, sem `DELETE`.

### A ordem do trabalho

PR próprio, com a palavra do fundador, antes do código (D11). Regras: D4–D6, D10–D12, D15, D18.
Drizzle 1.0.0-rc.4 gera a tabela; os grants, migração própria.

### Como se prova

`catalog.test.ts`; `npm run migrations -- --base origin/main`.

## U3 Cadastro no servidor

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/` | cria `operations.ts`; muda `failures.ts`, `index.ts` | servidor, web, OpenAPI |
| `packages/hub-api/package.json`, `package-lock.json` | `@brazilian-utils/brazilian-utils` 2.5.0 (L16) | workspaces |
| `apps/server/src/hub/identity/` | cria `clients.ts`; muda `public.ts`, `auth.ts`, `invitations.ts`, `invitation-reads.ts` | `operations`, `company-routes.ts` |
| `apps/server/src/hub/operations/` | cria `clients.ts`, `routes.ts`, `public.ts` e testes | `main.ts` (C4) |
| `apps/server/src/main.ts` | liga `operations` às portas da identidade | boot |
| `scripts/removals.json` | as cinco remoções novas | `npm run removals` |

### Os contratos que a unidade cria

Portas da identidade, na transação de quem chama:

- `libraryCommand` (`auth.ts`) e `admitOperator` (U1).
- `registerCompany(tx, {admitted: OperatorProof, name, ownerEmail: Email, attemptKey}):
  Promise<{company: Company, invitationId: InvitationId, created: boolean}>`.
- `renameCompany(tx, {admitted: OperatorProof, companyId, name}): Promise<{ok: true} | {ok: false,
  reason: 'ACTIVE'}>`, sob o lock da empresa.
- `readOperatedCompanies(tx, {admitted: OperatorProof, companyIds: CompanyId[]}):
  Promise<Map<CompanyId, {name, state}>>`.
- `isOperator(tx, email: Email): Promise<boolean>`; `mailInvitation` de 4.1 (E3).

`createOperations({database, identity})`: `register`, `correct`, `list`, `get`. `Cnpj` tira `.`,
`/`, `-` e espaço, põe em maiúsculas, refina com `isValidCnpj(v, {version: 2})` e marca (C23). Rotas
`session`:

- `listClients`: GET `/api/clients?page=`, 200 `{clients: ClientSummary[], next: Next}`; 400, 401,
  404, 503.
- `getClient`: GET `/api/clients/{companyId}`, 200 `{client: Client}`; 401, 404, 503.
- `registerClient`: POST `/api/clients`, `Idempotency-Key`, limite 4096, 201 `{client: Client}`;
  400, 401, 404, 409, 422, 503 e as falhas de correio de 4.1.
- `correctClient`: PUT `/api/clients/{companyId}`, limite 1024, 200 `{client: Client}`; 400, 401,
  404, 409, 412, 503.

O convite de dono usa as operações de 4.1, e `createInvitation` ganha `OWNER_INVITATION_OPEN`.

### A ordem do trabalho

1. Cadastro numa `libraryCommand`: lock da chave; replay (outro corpo → `IDEMPOTENCY_CONFLICT`);
   `admitOperator`; `isOperator` → `CLIENT_OWNER_IS_OPERATOR`; `registerCompany`; INSERT do cliente;
   commit; e-mail. O 23505 do CNPJ vira `CLIENT_EXISTS` pelo nome da restrição (C52). Regras:
   C27, C37, C65, D22, S12, S41. Funções, better-auth 1.7.8: `getOrgAdapter(await
   auth.$context, opções do plugin)` (`organization/index.mjs:1-4`); `.createOrganization`
   (`adapter.mjs:141`), só a empresa, `slug` e `attemptKey` iguais à chave; `.createInvitation`
   (`:728`), `pending`, `inviterId` do operador, papel `owner` fixo. Não `auth.api.createOrganization`,
   que sempre cria o membro (`crud-org.mjs:74-100`).
2. Primeira prova: o adapter grava na transação do Hub (`getCurrentAdapter`, `adapter.mjs:142`), só
   lido no estudo; se não, volta ao cartão.
3. Correção: lock da empresa; revisão; `renameCompany` (`ACTIVE` → `CLIENT_ACTIVE`), com
   `.updateOrganization` (`adapter.mjs:352`) se o nome mudou; `revision + 1`. Regras: C38, D22.
4. Rotas e leituras. Regras: C28–C31, C33, C35–C38, C40, C44, C45, C48, S9, S10. Página por `pageOf` sobre
   `(registered_at, company_id)` (C44). Com `OwnerInviterProof`, `createInvitation` exige zero
   convites `owner` vivos, sob o lock.

### Como se prova

A3–A11: `npm run test -w @conexus/server` com status e corpo literais (T6), `npm run openapi`.
Remoções novas (T12): `client-attempt-replay`, `client-one-transaction`, `operator-not-member`,
`client-owner-not-operator`, `owner-invitation-awaiting-only`.

## U4 Telas da Central

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/operations/` | cria `clients.tsx`, `client.tsx`, os dois formulários, `queries.ts`, `public.ts` e testes | rotas |
| `apps/web/src/routes/_app/operations/` | cria `route.tsx`, `clients/index.tsx`, `clients/new.tsx`, `clients/$companyId.tsx` | roteador |
| `apps/web/src/routes/_app/route.test.tsx` | o link e a guarda | testes |
| `apps/web/src/hub/identity/` | `account-menu.tsx`; a linha de convite, se servir (E6) | `_app/route.tsx` |
| `apps/web/src/platform/` | `test-hub.tsx`, o fake do contrato | testes |
| `apps/web/package.json`, `package-lock.json` | `formatCnpj` da mesma biblioteca | build |
| `apps/web/src/ui/`, `docs/reference/` | uma peça nova, se houver, com a entrada (W21, V23) | telas |

### Os contratos que a unidade cria

Endereços (W1): `/operations/clients?page=`, `/operations/clients/new`,
`/operations/clients/$companyId`, onde “Corrigir dados” abre o formulário.

### A ordem do trabalho

Regras: W1, W4, W8–W13, W15, W17, W18, W21–W24, W28, V23. `hubQuery`, `hubMutation`, `useAttemptKey`, `Form`, `Field`. A
guarda em `beforeLoad` só poupa uma ida; o servidor recusa (A3). `formatCnpj(v, {version: 2})`
mostra a máscara.

### Como se prova

A12, A13: `npm run test -w @conexus/web`; navegador real (T23), com trace no cadastro e na correção.

## U5 Retirar a criação pelo cliente

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/` | apaga `createCompany`; `mayCreate` vira `mayOperate` | servidor, web, OpenAPI |
| `apps/server/src/hub/identity/` | apaga `createCompanyCommand` e a rota | `company-routes.ts` |
| `apps/server/migrations/` | cria a migração de P6 B | `migrate` |
| `apps/server/src/platform/` | `migrate.test.ts`, o caso da exceção | testes |
| `apps/web/src/hub/identity/` | apaga `create-company-form.tsx` e o teste; muda `companies.tsx`, `queries.ts`, `public.ts` | rotas |
| `apps/web/src/routes/_app/` | apaga `companies/new.tsx`; muda `route.test.tsx` | roteador |
| `apps/web/src/platform/` | `cache.test.tsx`, `test-hub.tsx` | testes |
| `scripts/removals.json` | saem `company-create-administrator` e `company-attempt-replay` (T10, T12) | `npm run removals` |
| `docs/reference/` | boundaries: sai “who may create a company” | revisores |

### Os contratos que a unidade cria

Migração SQL (D5), cujo comentário declara a exceção única a D6 e cita P6 B. Para as empresas sem
linha em `operations.client`, na ordem: DELETE de `auth.invitation` e `auth.member`;
`active_organization_id = NULL` em `auth.session`; DELETE das empresas. Nada mais muda.

### A ordem do trabalho

Regras: C45, C74, D5–D7, D9, T10, T12. Sai tudo junto; `allowUserToCreateOrganization: false` (padrão
`true`, `crud-org.mjs:56`). A versão anterior roda no banco migrado: o
esquema só ganhou `operations`, que ela ignora.

**A lista, antes da publicação.** Só o fundador criou empresas, e é dono de todas: ele confirma em
Suas empresas, no Hub publicado, cada uma que sai, sem consulta ao banco. Uma que ele não reconheça
para a publicação.

### Como se prova

A14, A15: `npm run test -w @conexus/server`, `npm run test -w @conexus/web`, `npm run knip`. A15
migra até a anterior (`migrate({migrationsFolder})`), planta as linhas e aplica a de P6 B.

## U6 Convite de dono e percurso

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/` | `invitation-reads.ts`, `messages.ts`, `company-routes.ts`, modelo do e-mail | `getInvitation`, envio, reenvio |
| `tests/e2e/` | cria `client.test.ts` | `npm run e2e` |
| `docs/reference/` | boundaries: `getOrgAdapter`, com a linha da biblioteca (C75) | revisores |

### Os contratos que a unidade cria

`inviterName` é “Conexus” quando a empresa não tem membro, pois só a Central convida nela (U1); o
texto diz “primeiro dono”. Derivado, sem coluna (C26).

### A ordem do trabalho

Regras: T6, T14, T23, S12. Percurso: cadastro, e-mail no fake, senha, aceite, e um segundo
cadastro com o mesmo e-mail.

### Como se prova

A16: `npm run e2e`, `npm run verify` e o roteiro no Hub publicado.
