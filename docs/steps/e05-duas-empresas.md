# Etapa 5: Duas empresas

## A página do fundador

**No fim desta etapa** uma empresa não lê nem grava as linhas de outra, mesmo quando a consulta
de uma pessoa, um agente ou o Builder esquece o filtro: o banco recusa. E só a
Conexus apaga uma empresa, na Central de Operação.

**O roteiro de uso.** No Hub publicado, sem terminal, com duas caixas que não são a sua:

1. Na Central, cadastre **Empresa A** com a segunda caixa e **Empresa B** com a terceira. Aceite cada
   convite numa janela anônima própria.
2. Na janela do dono de A, **Suas empresas** mostra só A. Cole ali o endereço de B, copiado da outra
   janela: **Página não encontrada**.
3. Na Central, abra B e clique **Apagar cliente**. O botão de confirmar só libera com o nome de
   exibição de B digitado.
4. Confirme: B sai da lista, A continua, e o CNPJ de B fica livre para um novo cadastro.
5. Na janela do dono de B, recarregue: **Página não encontrada**, e Suas empresas vazia. A pessoa
   ainda entra com a senha dela. O link do convite de B, aberto de novo, não abre.

**O que você faz, e quando.** Antes: as duas caixas. No começo: nada, a “2A” vale enquanto o
cartão seguir as respostas abaixo. Antes de U2 e de U7: dá a palavra sobre a lista exata de papel,
tabela e verbo de cada PR de grant, como no PR 48 (D11); a construção segue local enquanto isso. Na
U7: confirma que a volta a antes da v0.5.0 deixa de funcionar (H). No fim: faz o roteiro, diz o que
viu e aprova os textos das telas.

**Decisões já dadas** (estudo da etapa 5 e da Central, 2026-10-16):

- **A.** Contexto de empresa obrigatório no tipo, mais a política por linha do PostgreSQL. Exemplo:
  uma consulta de membros sem `WHERE` de empresa, no contexto de A, devolve só A.
- **B.** As nove provas; a 7 diz “só a Conexus apaga”.
- **Q6.** Só a Conexus apaga, na Central, com o nome digitado e a revisão. Saem a empresa, os
  membros, os convites e o cadastro; as pessoas ficam. Apagar de novo dá o mesmo 404 de quem não
  existe. Consequência, não palavra sua: sem o cadastro, o CNPJ fica livre (roteiro, passo 4).
- **H.** Duas fases: a v0.5.0 traz contexto e políticas, e o login ainda alcança as tabelas; a
  v0.5.1 retira esse alcance.
- **I.** Better Auth, Drizzle e pg ficam. **J.** Recarregar durante o cadastro mostra o estado atual
  e pergunta. **L.** Prova local, depois no Neon real.
- **O grant.** Só o papel da Central apaga: empresa, membros, convites e cadastro (Q6; 4.2).

**Fica de fora.** Apagar pela empresa (dono ou administrador). Lixeira, recibo da exclusão, aviso a
outras abas (veem a ausência na leitura seguinte). SQL hostil com a própria senha do login do Hub,
que pode trocar de papel; o login segue lendo pessoas para entrar. Apps e bancos das empresas (etapa 7, decisão 0021).
Das issues `next-card`: o 1 da 45, 8–22 e 25 da 39, 3 e 6 da 25 esperam, a etapa não precisa
deles; o 9 da 39 só nos testes tocados.

**A decisão sua pedida nesta etapa.** Nenhuma nova; se surgir uma, a construção para.

## As unidades

Base: `main` `10c4e0f` mais 4.2; revisão pelo [checklist](../reference/checklist.md).

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | Registro da prova (PR próprio) e a prova local e no Neon | decisões | dados | neon-postgres, neon-postgres-branches | 4.2 fechada |
| U2 | Papéis de escopo e grants da fase 1 (PR próprio, D11) | migrações, grants | dados | neon-postgres | U1 local verde |
| U3 | Contexto obrigatório, políticas, todos os chamadores | plataforma, identidade, operações, migrações | dados | neon-postgres, organization-best-practices | U2 |
| U4 | Apagar cliente no servidor | contrato, identidade, operações | segurança | organization-best-practices, better-auth-security-best-practices | U3 |
| U5 | Confirmação na Central | web de operações, `ui/` | web | shadcn | U4 |
| U6 | Percurso de duas empresas e remoções | e2e, `scripts/` | testes | nenhuma | U5 |
| U7 | Fase 2 (PR próprio, D11): o login perde o alcance | migrações, grants | dados | neon-postgres | v0.5.0 conferida |

**Orçamento de código alterado** (sem testes nem gerados): U1 **0** (a prova fica fora do
repositório); U2 **250**; U3 **1.500**; U4 **600**; U5 **550**; U6 **150**; U7 **100**. Total:
**3.150**, teto 4.000 (L2). Se passar, divide-se sem cortar: **5a** (U1–U3, U7) e **5b** (U4–U6).

**Encaixes de 4.2, a conferir quando 4.2 entrar em `main`** (a construção para se um não valer):

**F1** `ACTIONS` com `by`, `admitOperator`, `mayOperate`. **F2** `read`, `command`, `libraryCommand`;
`libraryOrm` no pool. **F3** `organizationAdapter(auth)`. **F4** `operations.client` com `revision`,
sem chave estrangeira nem `DELETE`. **F5** A correção trava o cliente (`FOR UPDATE`), depois a
empresa (`lockCompany`); convites e aceite, só a empresa. **F6** `client.tsx`, `queries.ts`,
`NotFound`. **F7** `CLIENT_STALE` 412. **F8** `allowUserToCreateOrganization: false`.

## Os critérios de aceite

As provas B1–B9 são as nove de B.

| # | Unidade | Critério observável, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U2, U3 | B1: as quatro tabelas de empresa e `auth.user` têm RLS, sem `FORCE`; os papéis de escopo não entram, não são donos de nada, não têm `BYPASSRLS`; `hub_runtime` só é membro deles; sem contexto, também no segundo uso da conexão, um papel de escopo lê zero e não grava | `catalog.test.ts`; `isolation.test.ts` “sem contexto” | must |
| 2 | U3 | B2: cada pessoa lê e grava a sua empresa; quem está nas duas vê só A no contexto A; Suas empresas traz os vínculos | `isolation.test.ts` “positivo”; `companies.test.ts` | must |
| 3 | U3 | B3: no contexto A, `select` sem filtro nas tabelas de empresa e pessoas (junções e âncora da página incluídas) não traz linha de B; traz as de A | `isolation.test.ts` “filtro esquecido” | must |
| 4 | U3 | B4: no contexto A, INSERT com empresa B é recusado (42501); UPDATE que troca a empresa é recusado; UPDATE e DELETE sem filtro não mudam B; as linhas de B são conferidas depois | `isolation.test.ts` “escrita” | must |
| 5 | U3 | B5: na mesma conexão, A, depois B, depois sem contexto, com commit, rollback e a transação aninhada da biblioteca: nenhum contexto sobra; uma falha ao fixar o contexto dá 503 e nada roda | `isolation.test.ts` “conexão reciclada” | must |
| 6 | U3 | B6: as suítes de 4.1 e 4.2 passam sem mudar suas asserções; um id, token ou página de outro escopo não amplia o alcance; o limite de convites por pessoa segue contando todas as empresas; cadastro e convite de dono em `OPERATOR` criam a empresa sem membro operador | suítes existentes; `invitations.test.ts` “ritmo entre empresas” | must |
| 7 | U3 | Abrir transação sem escopo não compila; o escopo vem da sessão ou da prova, nunca do corpo | `database.check.ts` | must |
| 8 | U4 | B7: só o operador apaga: quem não é operador, dono incluído, recebe 404 em `DELETE /api/clients/{id}`; a rota nativa de apagar empresa é recusada a toda sessão | `clients.test.ts` “apagar: fora”; `companies.test.ts` | must |
| 9 | U4 | Nome e revisão certos: 204; saem empresa, membros, convites e cadastro; pessoas, contas, senhas, sessões e a empresa B ficam | `clients.test.ts` “apagar” | must |
| 10 | U4 | Revisão velha: 412 `CLIENT_STALE`; nome diferente: 422 `CLIENT_NAME_MISMATCH`; repetido: 404 de quem não existe; recusa plantada após cada escrita: nada sai | `clients.test.ts` “apagar: recusas” | must |
| 11 | U4 | Apagar contra aceite, reenvio, correção e outro apagar: um vence pelo lock; nunca membro órfão; o link do convite da apagada dá 404 | `clients.test.ts` “apagar: concorrência” | must |
| 12 | U4 | `CLIENT_DELETED` leva só trace e ids | `clients.test.ts` “log” | must |
| 13 | U5 | Cada célula da matriz renderiza; corte, 502 ou 503 mantém o diálogo; o foco começa no campo; Enter não confirma sem o nome; T23 | `delete-client-dialog.test.tsx`, navegador | must |
| 14 | U5 | J: recarregar durante o cadastro perde a chave e mostra a lista atual, sem refazer sozinho | `register-client-form.test.tsx` “recarregar” | must |
| 15 | U6 | B8: tirar a política, o `SET LOCAL ROLE`, a exigência de administrador do operador (quebra “operador sem papel”) ou a revisão faz o teste do critério falhar; tirar o escopo da assinatura faz `database.check.ts` falhar | `npm run removals` | must |
| 16 | U6 | O roteiro | `tests/e2e/two-companies.test.ts` | must |
| 17 | U1, U7 | B9: a prova passa no PostgreSQL local e no Neon; a v0.5.0 volta à v0.4.2; a suíte passa também com a fase 2 desde U3; depois da v0.5.1 o login não alcança as tabelas de empresa; o banco ainda dorme | registro 0039 (Result); `catalog.test.ts`; suíte com a fase 2 | must |
| 18 | U3 | Em `OPERATOR`, quem não é administrador, ou sem pessoa, lê zero linhas de empresa e não grava; o administrador lê todas | `isolation.test.ts` “operador sem papel” | must |

## A matriz de estados

Dono: Hub. Apagar não deixa estado: a empresa existe ou dá 404 (C26, Q6).

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido, recusado ou concorrência |
| --- | --- | --- | --- | --- | --- |
| Central: cliente (aguardando ou ativo) | 4.2, com **Apagar cliente** | 4.2 | 4.2 | 404 | apagado noutra aba: a leitura seguinte dá 404 |
| Apagar cliente (diálogo) | “Apagar {nome}?”, “Saem a empresa, os membros, os convites e o cadastro. As pessoas continuam com as contas delas.”, campo “Digite o nome do cliente”, Cancelar, **Apagar cliente** desabilitado | “Apagando…”, bloqueado; fechar não desfaz | corte, 502, 503: “Não confirmamos a exclusão. Veja a lista antes de tentar de novo.” | 404: fecha e vai à lista com “Este cliente não existe mais.” | 412: “Este cliente mudou.”, recarrega; 422 no campo: “O nome não confere.” |
| Central: lista, depois de apagar | 4.2 | 4.2 | 4.2 | — | `Notice` “Cliente apagado.” |
| Empresa e Pessoas (membro) | 4.1 | 4.1 | 4.1 | apagada: `NotFound`, sem nome nem papel antigos | sem aviso instantâneo; a próxima leitura dá 404 |
| Suas empresas | 4.2 | 4.1 | 4.1 | — | a apagada some na leitura seguinte |
| Link do convite | 4.1 | 4.1 | 4.1 | empresa apagada: 404 de 4.1 | e-mail já entregue chega e não abre |
| Cadastrar cliente | 4.2 | 4.2 | 4.2 | — | recarregar: chave perdida, lista atual (J) |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Client.{name,revision}` (4.2; `name` é o de exibição, não a razão social) | operação de cliente | diálogo, comando de apagar |
| corpo `{name, revision}` de `deleteClient` | diálogo | comando, relido sob o lock |
| 204 sem corpo | rota, depois do commit | mutação: remove o cache, navega |
| `Scope` | a transação, da sessão ou da prova | `platform/database.ts`, as políticas pelo contexto |
| `conexus.company_id`, `conexus.person_id`, `conexus.invitation_id` | `platform/database.ts`, por `set_config(…, true)` | as políticas |

Falha nova: `CLIENT_NAME_MISMATCH` 422, USER, settles, ação NONE (C48).

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Dependência fora | O que imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `SET LOCAL ROLE`, `set_config` | uma conexão por transação | rollback, nada roda | 503 | código central | 5 |
| Apagar: DELETE `operations.client`; `deleteOrganization` do adapter (membros, convites, empresa) | lock: o segundo dá 404 | rollback de todas | banco: 503, diálogo mantido | `CLIENT_DELETED`, ids | 9–12 |
| Escritas de 4.1 e 4.2 sob escopo | como em 4.1 e 4.2 | como em 4.1 e 4.2; 42501 é defeito, nunca sucesso | como em 4.1 e 4.2 | códigos de 4.1 e 4.2 | 2, 4, 6 |
| Migração U2: papéis e grants | uma vez, no `migrate` (D9) | uma transação: o Hub não sobe | `migrate` falha | código do `migrate` | 1 |
| Migrações U3 (políticas, transição) e U7 (retira a transição) | idem | idem | idem | idem | 1–4, 17 |
| `disableOrganizationDeletion: true` | nenhuma escrita | nenhuma | nenhuma | `NOT_FOUND` no log | 8 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Escopo, papéis, políticas | nova | `platform/database.ts`, migrações, `tables.ts` | — | A, B; 0012 |
| Apagar cliente e diálogo | nova | `identity/`, `operations/`, `ui/alert-dialog.tsx` | — | Q6 |

**A medida do transplante.** Zero linhas antigas; Basejump e Supabase são só referência.

**A dívida.** Nenhuma. Fechamento (L19): arquitetura e 0012 dizem que a política existe; v0.5.1 é
fase de H (L17).

## U1 A prova

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/decisions/` | cria a 0039, “proposed”, em PR próprio; o Result depois | revisores |

### Os contratos que a unidade cria

Criterion: “contexto obrigatório e política nativa contêm uma consulta ou escrita sem filtro de
empresa, mantendo 4.1 e 4.2?”; B1–B9; fixos PostgreSQL 18 (patch), Drizzle 1.0.0-rc.4, pg 8.23.1,
Better Auth 1.7.8, o commit de 4.2; fora: dono do banco, credencial roubada, carga. Diz por que
sem `FORCE`: o dono só roda o `migrate` (D9).

### A ordem do trabalho

1. O registro entra em `main` antes do código de prova.
2. A prova, fora do repositório: os candidatos de U2 e U3, duas empresas sintéticas, pessoas de
   A, de B, das duas e de nenhuma. Responde o que o estudo deixou à prova: os predicados, as
   projeções de `auth.user`, o adapter no escopo, apagar sob política (o `SELECT` que o `DELETE`
   pede), o lock de linha sob RLS (`UPDATE` e política de quem trava), o ritmo global de convites,
   o `libraryOrm` fora de transação, a exigência de administrador do operador.
3. Local em Docker, depois no Neon (L): a prova cria um banco vazio num branch do Hub, migra do
   zero, nunca lê tabela de empresa e apaga o branch no fim. B5 roda no endereço que o Hub usa,
   registrado. O Result diz quais asserções rodaram no Neon (a igualdade do catálogo é só do CI).
4. Alcance além da matriz de U3, ou um `SECURITY DEFINER`, volta ao cartão.

### Como se prova

Result por item e setup; o só lido fica “lido”. Regras: D10, D11, T14, S15.

## U2 Papéis e grants da fase 1

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/migrations/` | cria a migração dos papéis e grants | `migrate`, `catalog.test.ts` |
| `apps/server/database-grants.sql` | muda, dono do snapshot | `catalog.test.ts` |

### Os contratos que a unidade cria

Papéis `hub_company`, `hub_person`, `hub_invitation`, `hub_operator`: `NOLOGIN NOINHERIT
NOBYPASSRLS`, cada um `GRANT … TO hub_runtime WITH INHERIT FALSE, SET TRUE`. Verbos, os
que o censo de U1 achou: nas quatro tabelas de empresa, `SELECT, INSERT, UPDATE` a quem o fluxo
grava; `DELETE` em `auth.company`, `auth.member`, `auth.invitation` e `operations.client` só a
`hub_operator`; nas tabelas globais, só os verbos que a biblioteca usa naquele fluxo. `hub_runtime`
não muda.

### A ordem do trabalho

PR próprio com a lista exata, que espera a palavra do fundador sobre ela, como o PR 48 (D11); cada
grant comentado. Regras: D5, D10–D12.

### Como se prova

`catalog.test.ts`; `npm run migrations -- --base origin/main`.

## U3 Contexto obrigatório e políticas

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/` | muda `database.ts`; cria `database.check.ts`, `isolation.test.ts` | identidade, operações, status, `main.ts` |
| `apps/server/src/hub/identity/` | muda `tables.ts`, `auth.ts`, `admission.ts` e cada leitura e comando que abre transação | rotas, operações |
| `apps/server/src/hub/operations/` | muda `tables.ts`, `clients.ts` | rotas |
| `apps/server/src/hub/status/` | `store.ts` na transação de instalação | `main.ts` |
| `apps/server/migrations/` | cria a migração das políticas e do RLS | `migrate` |
| `scripts/removals.json` | `rls-company-policy`, `scope-role-set`, `operator-policy-admin-only` | `npm run removals` |
| `docs/reference/boundaries.md` | o escopo na biblioteca (C75) | revisores |

### Os contratos que a unidade cria

- `type Scope = {kind:'COMPANY', companyId, personId} | {kind:'PERSON', personId} | {kind:'INVITATION',
  invitationId, personId: PersonId | null} | {kind:'OPERATOR', personId, companyId: CompanyId |
  null}`.
- `Database`: `read(scope, work)`, `command(scope, work)`, `libraryCommand(relations, scope, work)`,
  `installation(work)` só para `hub.starts` e o boot; `asPerson(tx, work)` passa de `COMPANY` a
  `PERSON` da mesma pessoa e volta, só para `checkPace`; nenhuma outra troca. A abertura fixa `SET
  LOCAL ROLE` pelo `kind` (constante, D20) e os `conexus.*` por `set_config(…, true)` com valores
  ligados; as políticas os leem por `nullif(current_setting(…, true), '')`.
- Toda política de `hub_operator` exige também que `conexus.person_id` seja uma pessoa com o papel
  `admin`: em `auth.user`, pelo papel da própria linha, sem subconsulta na mesma tabela; nas outras,
  por `exists` em `auth.user`.
- As linhas que cada papel alcança (política de `SELECT` e, para escrita, `WITH CHECK` igual):

| Tabela | `hub_company` | `hub_person` | `hub_invitation` | `hub_operator` |
| --- | --- | --- | --- | --- |
| `auth.company` | `id` = empresa | as dos vínculos da pessoa | a do convite | todas |
| `auth.member` | da empresa | da pessoa | só INSERT: a pessoa, na empresa do convite | donos; com `companyId`, todos dela, para apagar |
| `auth.invitation` | da empresa | para o e-mail da pessoa, ou enviados por ela (ritmo) | `id` = convite | de dono; DELETE da empresa |
| `operations.client` | nenhuma | nenhuma | nenhuma | todas; DELETE da empresa |
| `auth.user` | membros e convidantes da empresa, e a pessoa | a pessoa | convidante, convidado, a pessoa | a pessoa, os operadores, os donos |

`hub_runtime` ganha a política aberta de `auth.user` que o login usa e, até U7, uma de transição
nas quatro tabelas de empresa, para a v0.4.2 rodar no banco migrado (D6).

### A ordem do trabalho

1. `Scope` e a transação; `read`/`command` sem escopo deixam de existir. Regras: C16, C21, C22, C63,
   D19, D20, D22, D25. Funções: drizzle-orm 1.0.0-rc.4 `transaction`; PostgreSQL 18 `set_config`
   com `is_local = true`, `SET LOCAL ROLE`.
2. Escopo por chamador: rotas de empresa, `COMPANY` pela URL, a admissão decide dentro (S7, S10);
   Suas empresas e convites recebidos, `PERSON`; o link de convite, `INVITATION`; a Central,
   `OPERATOR`; `checkPace` por `asPerson`. O e-mail pós-commit abre outra transação no mesmo
   escopo, sem lock (D22).
3. O adapter roda no escopo pelo `runWithTransaction` de `libraryCommandOn` (`@better-auth/core`
   1.7.8); sem `AsyncLocalStorage` de empresa. O `libraryOrm` não toca tabela de empresa (B1).
4. `pgPolicy` com `for`, `to`, `using` e `withCheck` explícitos, `table.withRLS` (drizzle-orm
   1.0.0-rc.4); SQL próprio só no que não gera (D5). Sem `FORCE`: o dono só roda o `migrate` (D9).
5. Regras: S6–S10, S15, D6, D12, T10, T12.

### Como se prova

1–7, 18: `npm run test -w @conexus/server`, `npm run typecheck`, `npm run removals`; cada negativo com
o positivo de A (T10). O CI roda a suíte também num segundo banco com a migração de U7 aplicada.

## U4 Apagar cliente no servidor

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/` | muda `operations.ts` (`deleteClient`), `failures.ts` | servidor, web, OpenAPI |
| `apps/server/src/hub/identity/` | muda `admission.ts` (`deleteClient`), `clients.ts` (`deleteCompany`), `auth.ts` (`disableOrganizationDeletion: true`), `public.ts` | operações |
| `apps/server/src/hub/operations/` | muda `clients.ts`, `routes.ts` | `main.ts` |
| `scripts/removals.json` | `client-delete-revision`, `client-delete-operator-only` | `npm run removals` |
| `docs/reference/boundaries.md` | apagar pelo adapter, sem a rota nativa | revisores |

### Os contratos que a unidade cria

- `deleteClient`: DELETE `/api/clients/{companyId}`, `session`, corpo `{name: string, revision:
  integer}`, limite 1024; 204; 400, 401, 404, 412 `CLIENT_STALE`, 422 `CLIENT_NAME_MISMATCH`, 503.
- Ação `deleteClient` na tabela `ACTIONS`, `by: 'OPERATOR'`, `locks: true`.
- Porta `deleteCompany(tx, {admitted: OperatorProof, companyId}): Promise<void>`, sob o lock que o
  chamador tem.

### A ordem do trabalho

1. Numa `libraryCommand` com `OPERATOR {companyId}`: `admitOperator`; trava o cliente e depois a
   empresa, a ordem da correção (F5; ausente: 404); revisão (412) e `name` literal (422); DELETE do cliente;
   `organizationAdapter(auth).deleteOrganization(companyId)` (better-auth 1.7.8
   `organization/adapter.mjs:370`: membros, convites, empresa, na transação corrente); commit; log;
   204. Não `auth.api.deleteOrganization`, que pede vínculo (`crud-org.mjs:264`). Zero linhas
   apagadas na empresa é defeito (C50), nunca 204. A empresa ativa das sessões não é lida pelo Hub
   e fica (D18).
   Regras: C27, C28, C38, C48, C50, C52, C65, D22, S8, S10, S11, S41.

### Como se prova

8–12: `npm run test -w @conexus/server` com status e corpo literais (T6), `npm run openapi`,
`npm run removals`.

## U5 Confirmação na Central

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/operations/` | cria `delete-client-dialog.tsx` e teste; muda `client.tsx`, `queries.ts`, `register-client-form.test.tsx` | rota do cliente |
| `apps/web/src/ui/` | cria `alert-dialog.tsx` | o diálogo |
| `apps/web/src/platform/` | `test-hub.tsx`, o fake do contrato | testes |
| `docs/reference/components.md` | a peça nova (V23) | revisores |

### A ordem do trabalho

Regras: W9–W13, W15, W17, W21–W24, W28, V23, V55. `hubMutation` sem retry; no 204 e no 404,
`removeQueries` do cliente, `invalidateQueries` da lista, navega à lista. Base UI 1.9.0
`AlertDialog`, pelo registro shadcn.

### Como se prova

13, 14: `npm run test -w @conexus/web`; navegador real (T23), com trace do apagar.

## U6 Percurso e remoções

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `tests/e2e/` | cria `two-companies.test.ts`; muda `live-hub.ts` se precisar | `npm run e2e` |
| `scripts/removals.json` | confere as entradas de U3 e U4 | `npm run removals` |

### Os contratos que a unidade cria

Nenhum. Regras: T5, T6, T12, T14, T23. Prova 15 e 16: `npm run e2e`, `npm run removals`.

## U7 Fase 2

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/migrations/` | cria a migração que retira a transição | `migrate` |
| `apps/server/database-grants.sql` | `hub_runtime` sem grant nas quatro tabelas | `catalog.test.ts` |
| `docs/decisions/` | o Result da 0039 | revisores |

### Os contratos que a unidade cria

`DROP POLICY` das políticas de transição; `REVOKE` de `hub_runtime` em `auth.company`,
`auth.member`, `auth.invitation` e `operations.client`. A contração de D6.

### A ordem do trabalho

Depois da v0.5.0 conferida: PR próprio (D11) com a sua confirmação de H; v0.5.1; o roteiro.

### Como se prova

17: `catalog.test.ts`, a suíte inteira com a fase 2, `npm run migrations -- --base origin/main`, e
o Neon pela prova de U1.
