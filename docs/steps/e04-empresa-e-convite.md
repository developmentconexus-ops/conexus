# Etapa 4: Empresa e convite

## A página do fundador

**No fim desta etapa** você cria uma empresa, convida uma pessoa por e-mail, e ela cria a senha,
aceita e entra na empresa.

**O roteiro de uso.**

1. Entre no Hub. Em "Início", "Nova empresa", com o nome "Empresa Teste": abre a página da empresa,
   com você como Dono.
2. Em "Convidar pessoa", o e-mail da sua segunda caixa, papel Administrador: ele aparece em
   "Convites pendentes".
3. Numa janela anônima, abra o e-mail "Convite para Empresa Teste" e o link. Clique "Ainda não tenho
   senha", escreva o nome, abra o segundo e-mail e crie a senha.
4. Entre com ela: "{seu nome} convidou você para Empresa Teste como Administrador." Clique "Aceitar
   convite": a empresa abre com as duas pessoas.
5. Abra o link do convite de novo: "Você já faz parte de Empresa Teste."

**O que você faz, e quando.** No começo: aprova esta página. Antes do merge: a decisão 7. No fim:
faz o roteiro e diz o que viu.

**Fica de fora.** Apagar empresa: etapa 5. Tirar pessoa, mudar papel, sair, a regra do último dono,
cancelar convite: etapa 6. Limite diferente por empresa (planos): hoje, todas 100.
Esperam: tirar o rótulo antigo das migrações (#25-3), seis versões depois, para voltar atrás; a
atividade do Neon sem explicação (#25-6), que não pede código; #32-3 e #32-8, que mudam guias, no
fechamento.

**As decisões suas pedidas nesta etapa.** Recomendo A em 1 a 7 e 9; a 8 pede sua aprovação.

1. **Aceite explícito.** Hoje o convidado vira membro sozinho ao entrar. **A.** Vê "A empresa B
   convidou você" e só entra ao clicar "Aceitar convite". **B.** Automático.
2. **Quem cria vira dono?** **A.** Você vira o primeiro dono, convida o real e sai na etapa 6.
   **B.** Cria sem fazer parte; o Conexus convida em nome da instalação.
3. **Quem convida.** **A.** Dono convida qualquer papel; administrador convida administrador ou
   membro; membro não convida. **B.** Só o dono.
4. **Prazo do convite.** **A.** 2 dias, e "Convidar de novo" depois. **B.** 7 dias.
5. **Quem não tem senha.** **A.** Dois e-mails: o convite e, após "Ainda não tenho senha" e o nome,
   o link de 15 minutos. **B.** Um só, com o link de 2 dias.
6. **Limites.** **A.** 10 convites por minuto por pessoa; 100 pendentes e 100 pessoas por empresa (o
   101º, ao aceitar, vê "A empresa já tem 100 pessoas."); um link a cada 20 segundos por pessoa
   convidada (endereço de internet: a Cloudflare). **B.** Outros números.
7. **O remetente (0017).** **A.** Cloudflare, o Resend de reserva. Você fornece: Workers Paid (US$ 5
   por mês, 3.000 e-mails; depois US$ 0,35 por mil); um endereço num subdomínio do Hub, com "Onboard
   Domain"; um token "Email Sending: Edit"; duas caixas suas. O e-mail sai do Brasil,
   e cada empresa é avisada (0032).
8. **Permissão do Hub no banco (D11).** O programa do Hub passa a ler, criar e mudar empresas,
   membros e convites, e nunca apagá-los. Ex.: um defeito que tente apagar uma empresa é recusado
   pelo próprio banco. Responda "aprovo", ou diga o que mudar.
9. **Apagar o que é de uma empresa.** A regra C10 pede já agora a função que apaga tudo de uma
   empresa, sem quem a chame. **A.** Entra na etapa 5, com "Apagar empresa"; o fechamento corrige a
   regra. Ex.: a Empresa Teste fica até lá. **B.** Entra agora, sem uso.

*Pendentes.*

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 Conferências | Três conferências e W25 | `scripts/`, `apps/server/src/`, raiz | testes | `node` | — |
| U2 Consertos | Itens de servidor de #25 e #32 | `apps/server/`, `packages/hub-api/` | testes | `fastify-best-practices` | U1 |
| U3 Tabelas e concessões | Tabelas, papel do primeiro, concessões (D11) | `apps/server/` | dados | `neon:neon-postgres` | U2 |
| U4 Correio | Porta e adaptador do e-mail | `apps/server/src/`, `infra/`, `scripts/`, `docs/how-to/` | segurança | `cloudflare:cloudflare-email-service` | U3 |
| U5 Empresas e convites | Nove operações, admissão, comando junto | `apps/server/src/`, `packages/hub-api/`, `docs/reference/` | segurança | `organization-best-practices`, `better-auth-security-best-practices` | U4 |
| U6 Telas | Telas, varredura, ponta a ponta | `apps/web/`, `packages/hub-api/`, `tests/e2e/` | web | `shadcn` | U5 |
| U7 Ao vivo | Teste de entrega do 0017 | `docs/decisions/` | segurança | nenhuma | U1 a U6 no ar |

Em série. Um merge só (L13).

## Os critérios de aceite

Servidor: biblioteca real em banco descartável (T16, T19), `app.inject`, status e corpo literais. "Remoção": linha `caught` em `scripts/removals.json` (T12).

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Linha fora do JSON com `level` e código, de teste ou de Hub iniciado: falha. O Biome recusa `max-w-sm` e `w-2xl` em `apps/web/src`, aceita `min-w-48` | `scripts/test-reporter.test.ts`, "linha crua"; `platform/test-database.test.ts`; `scripts/rules.test.ts`, "W25" | must |
| 2 | U1 | `npm run removals`: teste verde, `survived`; `find` ausente ou repetido, `stale`; teste pulado, `unreachable`; saída 1; pega, 0. `npm run radius -- U<k> <commit>`: arquivo fora da tabela, `out-of-radius`; commit desconhecido; saída 1; avisa `ambiguous-row` | `scripts/removals.test.ts`; `scripts/check-radius.test.ts` | must |
| 3 | U2 | `whenIdle` fora de `Database`; "banco dorme" chega a zero conexões; falha no `connect` ou evento `error`: 503; erro sem SQLSTATE: 500; código fora das falhas da operação falha na porta de teste; `setPassword` declara `DATABASE_UNAVAILABLE` | `platform/database.test.ts`, "perda"; `identity.test.ts`; `platform/http.test.ts`; `password-write.test.ts` | must |
| 4 | U2 | Sem `CONEXUS_TEST_DATABASE_CONTAINER`, o catálogo pula com `opt-in:`; reproduzida a causa, `drop database` sem 42501, espera ou repetição | `platform/catalog.test.ts` | must |
| 5 | U3 | Colunas e únicos do contrato; catálogo igual a `database-grants.sql`; 42501 em `DELETE` das três tabelas | `hub/identity/tables.test.ts`; `catalog.test.ts` | must |
| 6 | U3 | Depois de `migrate`, a pessoa mais antiga ganha `role = 'admin'` se ninguém tem | `tables.test.ts`, "administrador" | must |
| 7 | U4 | Sem uma variável `HUB_MAIL_*`, ou token legível por outros: sai 1, `CONFIG_INVALID`; `deploy.sh` recusa sem `hub_mail_token`. Lado do Hub (T14): em `delivered` ou `queued`, passa; em `permanent_bounces`, `MAIL_BOUNCED`; não-2xx, `success: false`, fora do esquema, acima de 16 KiB, prazo, cliente que sai: `MAIL_UNAVAILABLE`; sem repetir nem endereço no registro | `boot.test.ts`; `scripts/deploy.test.ts`; `platform/mail.test.ts`, servidor falso (T15) | must |
| 8 | U5 | `POST /api/companies` pelo administrador: 201, ele dono; mesma chave, a mesma, também duas juntas; outro nome, 409 `IDEMPOTENCY_CONFLICT`; outra pessoa, 404 sem linha (remoção) | `companies.test.ts`, "criar" | must |
| 9 | U5 | `/api/companies/{companyId}` e `/members`: membro, 200; `/invitations`: dono e administrador; 2ª página por `next`; outra empresa, id desconhecido ou malformado, o mesmo 404 (S10, remoção); `GET /api/companies`: só as de quem pede, 50 por página; `mayCreate` só do administrador | `companies.test.ts`, "fora"; `companies.test.ts`, "lista" | must |
| 10 | U5 | Convidar: 201, e-mail com `/invitations/{id}`; membro ou outra empresa, 404 sem linha; administrador pedindo dono, 403 `INVITATION_ROLE_REFUSED`; já membro, 409 `MEMBER_EXISTS`; endereço que volta, 422; correio fora, 502; o convite fica | `invitations.test.ts`, "convidar" | must |
| 11 | U5 | Outra chave: o anterior `canceled`, um `pending`, também dois juntos; o anterior vencido há 2 dias, ou vencendo durante o pedido: 201, novo e-mail; mesma chave: o mesmo, sem e-mail (remoção) | `invitations.test.ts`, "de novo" | must |
| 12 | U5 | 11º convite de uma pessoa em 60 s: 429 `INVITATIONS_EXCEEDED`; com 99 vivos, dois convidantes juntos: um 201, um 409 `INVITATIONS_FULL`; com 100 vivos atrás de 100 vencidos, 409 (remoção) | `invitations.test.ts`, "limite" | must |
| 13 | U5 | `PUT …/password-link`: sem pessoa, criada com o nome, e-mail com `/set-password?redirect=/invitations/{id}#token=`; com senha, 204 sem e-mail; convite não pendente, 404; dois juntos: uma pessoa, um 429 `PASSWORD_LINKS_EXCEEDED`; após 20 s, link novo, o anterior 422 (remoção) | `invitations.test.ts`, "link" | must |
| 14 | U5 | `GET /api/invitations/{invitationId}`: a convidada, 200; outra pessoa, 404; sem sessão, 401; `PUT …/acceptance`: 200, um membro; de novo, igual; outra pessoa, 404 sem escrita; vencido ou cancelado, 422 `INVITATION_CLOSED`; empresa com 100 pessoas, 409 `COMPANY_FULL`, convite `pending`; dois juntos, um membro, dois 200; com um re-convite, nas duas ordens: membro e 409 `MEMBER_EXISTS`, ou o convite `canceled` e 422, nunca 40P01 (remoção); escrita recusada no meio do aceite: nada fica, 500; com `runWithAdapter`, falha (remoção) | `invitations.test.ts`, "ler", "aceitar" | must |
| 15 | U5 | LT11, do convite a e-mail novo à empresa listada; LT12, caminhos de organização e administração 404, `signUpEmail` recusado. `first-person` cria a pessoa com `role = 'admin'`; os casos de hoje passam | `invitations.test.ts`, "do convite à empresa"; `session.test.ts`; `sign-up.test.ts`; `first-person.test.ts` | must |
| 16 | U5 | Critérios 8 a 15: linhas só com código, sem e-mail, nome ou token; cada 404 com seu motivo (S10, S41, S45) | `invitations.test.ts`, `companies.test.ts`, "registro" | must |
| 17 | U6 | Início: empresas com papel; vazio, "Você ainda não participa de nenhuma empresa."; "Nova empresa" só com `mayCreate`: erro no campo; dois cliques, um pedido; 201 abre a empresa | `routes/_app/route.test.tsx`; `create-company-form.test.tsx` | must |
| 18 | U6 | Pessoas: membros, pendentes, formulário conforme `mayInviteAs`; 409 no e-mail, 403 no papel | `people.test.tsx`, `invite-form.test.tsx` | must |
| 19 | U6 | `/invitations/{id}`: "Entrar" e "Ainda não tenho senha" com o nome; com sessão, o `beforeLoad` leva a `…/acceptance` (W15), "Aceitar convite" abre a empresa; vencido, aceito, desconhecido; "Criar sua senha": 204 leva a `/login?redirect=/invitations/{id}`; `redirect` fora da origem, ignorado (W16) | `invitation.test.tsx`; `platform/http.test.ts`; `set-password-form.test.tsx` | must |
| 20 | U6 | #32: gaveta muda o endereço, foco volta a "Abrir navegação"; aviso sem `text-text-2`; foco no título após entrar; contorno longe da borda do menu | `layout.test.ts`, `sign-in-form.test.tsx`, `route.test.tsx`, `sweep.test.ts` | must |
| 21 | U6 | Cada estado da matriz em 1366, 390 e 320 px, claro e escuro: sem rolagem lateral, contorno de 2 px em cada parada do Tab. O roteiro de uso no Chromium, contra um Hub de verdade | `apps/web/sweep.test.ts`; `tests/e2e/invitation.test.ts` | must |
| 22 | U7 | Os cinco itens do 0017 passam, escritos no registro | Firstmate, ao vivo, com você | must |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Empresa, dono, empresa ativa (`createOrganization`) | Mesma chave: trava da chave, a primeira | Tudo volta | 503 | `COMPANY_CREATED` | 8 |
| Convite; o anterior `canceled` | Empresa travada: um `pending`; o 101º vivo, 409 | Tudo volta | 503 | `INVITATION_CREATED` | 10 a 12 |
| Pessoa e link | Trava do e-mail: uma pessoa, um link, outro 429 | Tudo volta | 503 | `PASSWORD_LINK_GIVEN` | 13 |
| Convite aceito, membro, empresa ativa (`acceptInvitation`) | Empresa travada: um membro, ou o re-convite antes; com 100 pessoas, 409, nada | Nada fica; 500 | 503 | `INVITATION_ACCEPTED` | 14 |
| E-mail, após o `commit` | Um por pedido | — | 502 ou 422; a linha fica | `MAIL_SENT`, `MAIL_FAILED` | 7, 10 |
| As três migrações (U3) | Uma por vez (D9) | Volta a migração | `migrate` sai 1 | `MIGRATED` | 5, 6 |
| Primeira pessoa com `role` | Uma | Volta tudo | sai 1 | `FIRST_PERSON_LINK_GIVEN` | 15 |
| Cópia de `npm run removals` | Pastas próprias | Nada muda | `unreachable` | uma linha por remoção | 2 |
| `npm run radius` | Só lê | — | sem `git`, saída 1 | uma linha por arquivo | 2 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Empresa e convites (`workspace/`) | Nova, nativa | `auth.company`, `auth.invitation` | — | C64, D15 |
| Admissão (`admission.ts`) | Nova | `hub/identity/admission.ts` | — | S7, S10 |
| Entrada automática (`authentication.ts:147-157`) | Retirada | — | — | "Implementado assim": decisão 1 |
| Administrador da instalação | Nova, nativa | `user.role` | — | S11 |

**A medida do transplante.** Nenhuma parte é trazida.

**A dívida.**

- O aceite recusado no meio dá 500, não 503 (`crud-invites.mjs:332-339`).

## U1 Conferências

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `scripts/test-reporter.ts`, `scripts/test-reporter.test.ts` | Muda | os três comandos de teste |
| `scripts/{removals.ts,removals.json,removals.test.ts,check-radius.ts,check-radius.test.ts}` | Cria | `package.json` |
| `scripts/w25.grit`, `biome.json`, `scripts/rules.test.ts`, `package.json`, `.github/workflows/ci.yml` | Cria / muda | Biome, npm, CI |
| `apps/server/src/platform/test-database.ts`, `apps/server/src/platform/test-database.test.ts` | Muda / cria | os testes de servidor |
| `apps/server/src/{boot,main,hub/status/status,hub/identity/password-write,hub/identity/identity}.test.ts` | Muda | CI |

### Os contratos que a unidade cria

- `type Removal = { id; file; find; replace; test: { cwd; file; name? } }`, todos `string`.
- `npm run removals [-- --only <id>]`; `npm run radius -- U<k> [commit]`.
- `spawnHub(t, env): Promise<{ port; lines; stop(): Promise<void> }>` em `test-database.ts`.

### A ordem do trabalho

1. A recusa de linha crua no relator e em `spawnHub`. Regras: C50, C78, T4, T20.
2. `removals.ts` numa cópia do repositório. Regras: T5, T12, C60.
3. `check-radius.ts` (L7); o plugin GritQL (W25).

### Como se prova

`npm run test:scripts`, `npm test -w @conexus/server`; casos plantados (C78).

## U2 Consertos

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/{database,test-database,http}.ts` | Muda | `main.ts`, `migrate.ts`, `hub/*`, os testes |
| `apps/server/src/hub/identity/{auth,session,public}.ts`, `packages/hub-api/src/identity.ts`, `apps/server/package.json` | Muda | `main.ts`, web, npm |
| `apps/server/src/platform/*.test.ts`, `apps/server/src/hub/identity/*.test.ts` | Cria ou muda | os testes ao lado |

### Os contratos que a unidade cria

- `whenIdle(database)` em `test-database.ts`, fora de `Database`.
- `serve` põe `failures` na `config` da rota; o `onSend` da porta de teste recusa `code` fora dela,
  das de acesso, `NOT_FOUND` e `INTERNAL_UNEXPECTED`.
- `LIFETIMES = { idleSeconds, renewAfterSeconds, totalSeconds }` em `auth.ts`.
- `apps/server/package.json`: `"generate": "drizzle-kit generate"`.

### A ordem do trabalho

1. #32-15 reproduzido primeiro. Regras: C65, T20.
2. #25-1; #25-2 pelo lugar da perda. Regras: C26, C52.
3. #25-4, #25-5, #32-6, #32-9, #32-10. Regras: C28, C70, T4.
4. #32-11: `createAuth` fica em `public.ts`, porta da prova do cadastro fechado.

### Como se prova

`npm test -w @conexus/server`, banco como no CI.

## U3 Tabelas e concessões

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/tables.ts`, `apps/server/src/hub/identity/tables.test.ts` | Muda | `drizzle.config.ts`; `auth.ts` |
| `apps/server/migrations/<data>_{company_tables,installation_admin,company_grants}/` | Cria (a primeira por `npm run generate`) | `migrate` |
| `apps/server/database-grants.sql`, `apps/server/src/platform/catalog.test.ts` | Muda | CI |

### Os contratos que a unidade cria

- Colunas `text not null`, salvo `?` (pode ser nulo) e `ts` (`timestamptz not null`):
  `company(id pk, name, slug unique, logo?, metadata?, created_at ts, attempt_key unique)`;
  `member(id pk, company_id, user_id, role, created_at ts)`, único `(company_id, user_id)`;
  `invitation(id pk, company_id, email, role?, status, expires_at ts, created_at ts, inviter_id,
  attempt_key)`, únicos `(company_id, lower(email)) where status = 'pending'`, `(company_id,
  attempt_key)`; `user` + `role?`, `banned boolean default false`, `ban_reason?`, `ban_expires
  timestamptz?`; `session` + `active_organization_id?`, `impersonated_by?`. Chaves estrangeiras
  `RESTRICT`.
- `hub_runtime`: `SELECT, INSERT, UPDATE` nas três tabelas novas.

### A ordem do trabalho

1. Migração gerada, lida antes (D2, D4 a D8, D15, D17); a do papel (D14); as concessões, decisão 8
   (D10 a D12).

### Como se prova

`npm test -w @conexus/server`, com `CONEXUS_TEST_DATABASE_CONTAINER` para o catálogo.

## U4 Correio

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/{mail,mail.test,config}.ts`, `apps/server/src/boot.test.ts` | Cria / muda | `main.ts` |
| `infra/compose.yaml`, `infra/deploy.sh`, `scripts/deploy.test.ts`, `docs/how-to/hub-server.md` | Muda | publicar, voltar atrás, reiniciar |

### Os contratos que a unidade cria

- `type SendMail = (message: { to: Email; subject: string; text: string }, signal: AbortSignal) =>
  Promise<'DELIVERED' | 'QUEUED'>`; `createMail(deps: { config; log }): SendMail`.
- Resposta 2xx lida com Zod, até 16 KiB: `{ success: boolean; result: { delivered: string[];
  permanent_bounces: string[]; queued: string[] } }`.
- `Config`: `mailApiUrl` (`HUB_MAIL_API_URL`), `mailFrom: Email` (`HUB_MAIL_FROM`), `mailToken`
  (`HUB_MAIL_TOKEN_FILE`, classe com `#value`).
- `MAIL_UNAVAILABLE`: `THIRD_PARTY`, 502, "O e-mail não pôde ser enviado agora." / "Tente de novo
  daqui a pouco.". `MAIL_BOUNCED`: `USER`, 422, "Esse endereço não recebe
  e-mails." / "Confira o e-mail e convide de novo.".

### A ordem do trabalho

1. `fetch` com prazo de 10 s e o sinal do pedido (C27, C56 a C59, S31, S36, S41); o segredo no
   Compose, `deploy.sh` e procedimento (C67, S37).

### Como se prova

`npm test -w @conexus/server`; um caso falso por recusa.

## U5 Empresas e convites

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/{auth,first-person,public,admission,companies,invitations,company-routes,messages}.ts` | Muda / cria | `main.ts`, `public.ts` |
| `apps/server/src/hub/identity/admission.check.ts` | Cria (forjar `Admitted` não compila, T9) | `tsc` |
| `apps/server/src/platform/{http,access}.ts`, `apps/server/src/main.ts` | Muda | `main.ts`, rotas, a imagem |
| `packages/hub-api/src/{companies,operation,failures,index}.ts` | Cria / muda | servidor, web |
| `docs/reference/boundaries.md`, `scripts/removals.json` | Muda | C75; `npm run removals` |
| `apps/server/src/hub/identity/*.test.ts`, `apps/server/src/platform/*.test.ts` | Cria ou muda | os testes ao lado |

### Os contratos que a unidade cria

- `CompanyId`, `InvitationId`: 32 letras e dígitos, marcados. `Role = 'owner' | 'admin' |
  'member'`. `Company = { id; name }`; `Membership = { company; role }`; `Member = { personId;
  name; email; role }`; `PendingInvitation = { id; email; role; expiresAt }`; `ReceivedInvitation =
  { id; company; role; inviterName; state: 'PENDING' | 'EXPIRED' | 'ACCEPTED' | 'CANCELED' }`.
  `Next = { kind: 'END' } | { kind: 'MORE'; page: string }`.
- `Operation` ganha `input.params`, `success.status: 201`, `attemptKey: true` (`Idempotency-Key`,
  UUID); `serve` confere parâmetros antes do corpo (C42).
- `listCompanies`: `GET /api/companies?page`, `session`; 200 `{ companies: Membership[]; mayCreate;
  next: Next }`.
- `createCompany`: `POST /api/companies`, `session`, chave, `{ name }` 1 a 100; 201 `{ company }`;
  `NOT_FOUND`, `IDEMPOTENCY_CONFLICT` 409.
- `getCompany`: `GET /api/companies/{companyId}`; 200 `{ company; role; mayInviteAs: Role[] }`.
  `listMembers`: `GET …/members?page`, 200 `{ members: Member[]; next }`; `listInvitations`: `GET
  …/invitations?page`, 200 `{ invitations: PendingInvitation[]; next }`; 50 por página.
- `createInvitation`: `POST /api/companies/{companyId}/invitations`, chave, `{ email; role }`; 201
  `{ invitation: PendingInvitation }`; `INVITATION_ROLE_REFUSED` 403, `MEMBER_EXISTS`,
  `INVITATIONS_FULL`, `IDEMPOTENCY_CONFLICT` 409, `INVITATIONS_EXCEEDED` 429,
  `MAIL_BOUNCED` 422, `MAIL_UNAVAILABLE` 502.
- `getInvitation`: `GET /api/invitations/{invitationId}`, `session`; 200 `{ invitation: ReceivedInvitation }`.
- `putPasswordLink`: `PUT /api/invitations/{invitationId}/password-link`, `entry`, `{ name }` 1 a
  100; 204; `PASSWORD_LINKS_EXCEEDED` 429, `MAIL_BOUNCED` 422, `MAIL_UNAVAILABLE` 502.
- `acceptInvitation`: `PUT /api/invitations/{invitationId}/acceptance`, `session`; 200 `{ company }`;
  `INVITATION_CLOSED` 422, `COMPANY_FULL` 409.
- Todas: `NOT_FOUND`, `DATABASE_UNAVAILABLE`, e as de acesso.
- Falhas novas, `USER`, `NONE`: `IDEMPOTENCY_CONFLICT` "Este pedido já foi feito com outros dados." /
  "Recarregue a página."; `MEMBER_EXISTS` "Essa pessoa já está na empresa."; `INVITATION_ROLE_REFUSED` "Você não pode convidar com esse
  papel."; `INVITATIONS_EXCEEDED` "Muitos convites seguidos." e `PASSWORD_LINKS_EXCEEDED` "Muitos
  pedidos de link." / "Espere um pouco e tente de novo."; `INVITATION_CLOSED` "Este convite
  não vale mais." / "Peça um novo a quem convidou você."; `INVITATIONS_FULL` "A empresa já tem 100 convites
  pendentes." / "Espere aceitarem."; `COMPANY_FULL` "A empresa já tem 100 pessoas." / "Fale com quem
  convidou você.".
- `admit(input: { tx: CommandTx; personId: PersonId; companyId: CompanyId; action: CompanyAction }):
  Promise<Admitted>`, único construtor de `Admitted` (C16).
- `auth.ts`: `libraryCommand<T>(work: (tx: CommandTx) => Promise<T>): Promise<T>`
  (`database.command` + `runWithTransaction(adapterOn(auth, tx), …)`); `forgetLinks(tx, personId)`,
  vinda de `first-person.ts`.
- `createIdentity(deps: { database; config; log; sendMail: SendMail })`.

### A ordem do trabalho

1. `organization()` e `admin()` de `better-auth@1.7.8`: `modelName: 'company'`, `attemptKey`
   adicional, `allowUserToCreateOrganization` pelo `role`, `invitationLimit` infinito, `membershipLimit: 100`, sem
   `sendInvitationEmail` nem `cancelPendingInvitationsOnReInvite`. Regras: C75, S11, S12.
2. Toda gravação da biblioteca em `libraryCommand`, por `auth.api` com a sessão. Regras: C64, D22.
3. `admit` lê o membro e decide por `defaultRoles[role].authorize`. Regras: S6 a S10, D21.
4. Travas, uma só ordem (K17c; sem repetir 40P01): criar empresa, `pg_advisory_xact_lock` da
   chave; convidar e aceitar, primeiro `auth.company` `FOR NO KEY UPDATE`, que não bloqueia
   chaves estrangeiras (o aceite lê antes o `company_id`); convidar, depois
   `auth.user` de quem convida, igual. Regras: C65, D16, D23.
5. Criar empresa: admitir; `company` por `attempt_key`: mesmo nome, 201 com ela; outro, 409; nenhuma,
   `createOrganization`, `slug` = chave. Convidar: admitir; `(company_id, attempt_key)`: mesmo e-mail
   e papel, 201, sem e-mail; outro, 409; numa contagem, os `pending` de outro e-mail com `expires_at >
   statement_timestamp()`: 100, `INVITATIONS_FULL`; o `pending` guardado do e-mail (um, pelo índice,
   sem relógio), `auth.api.cancelInvitation` pelo id; convites de quem convida em 60 s; `createInvitation`; `commit`; o e-mail. Um dono por
   decisão (K21r, K23): vaga e contagem, o Hub; prazo no aceite, a biblioteca; listas só leem.
   Regras: C26, C37, C64, D24, D26, S28.
6. Link, num `libraryCommand`: `pg_advisory_xact_lock` do e-mail; convite pendente; a pessoa, se
   falta; link de menos de 20 s, 429; `forgetLinks`; `auth.api.requestPasswordReset`, `linkTokenOf`;
   `commit`, o e-mail. Regras: C64, C65, S12, S28.
7. Aceitar: o Hub lê só o estado (aceito por ela, a empresa); senão `acceptInvitation`. Regras: C64, S8.
8. Pelo código da biblioteca (C52): já membro, `MEMBER_EXISTS`; papel, `INVITATION_ROLE_REFUSED`;
   aceite sem convite, `INVITATION_CLOSED`; `ORGANIZATION_MEMBERSHIP_LIMIT_REACHED`, `COMPANY_FULL`
   (convidar não conta pessoas, como a biblioteca, K26); `ORGANIZATION_ALREADY_EXISTS`,
   `INTERNAL_UNEXPECTED`.
9. `boundaries.md` (C75), com o limite: o `findMany` da biblioteca lê até 100 linhas, sem ordem
   (`defaultFindManyLimit`, `factory.mjs:600-603`); as linhas de remoção.

### Como se prova

`npm test -w @conexus/server`; prazos envelhecidos por `UPDATE` do dono, sem espera (T20); `npm run
removals`.

## U6 Telas

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/pages.ts` | Muda (`/companies/new`, `/companies/$companyId`, `/invitations/$invitationId`, `/invitations/$invitationId/acceptance`) | `platform/http.ts`, `__root.test.tsx` |
| `apps/server/src/platform/http.ts` | Muda (`$x` vira `:x`) | `main.ts` |
| `apps/web/src/ui/{select,dropdown-menu}.tsx`, `docs/reference/components.md`, `apps/web/src/platform/{jitless,hub,attempt-key}.ts` | Cria / muda | `hub/identity`; `main.tsx`; `queries.ts` |
| `apps/web/src/routes/{_app/index,_app/companies/new,_app/companies/$companyId,_public/invitations/$invitationId,_app/invitations/$invitationId/acceptance,_public/set-password}.tsx`, `apps/web/src/routeTree.gen.ts` | Cria / muda | o roteador |
| `apps/web/src/hub/identity/{queries,public}.ts`, `apps/web/src/hub/identity/{sign-in-form,set-password-form,companies,create-company-form,people,invite-form,invitation}.tsx` | Muda / cria | rotas |
| `apps/web/{layout.test,sweep.test,layout-harness}.ts`, `apps/web/package.json` | Muda / cria | `npm test -w @conexus/web` |
| `tests/e2e/invitation.test.ts`, `package.json`, `.github/workflows/ci.yml` | Cria / muda | `npm run e2e`, CI |
| `apps/web/src/{hub/identity,routes,routes/_app,platform}/*.test.tsx` | Cria ou muda | os testes ao lado |

### Os contratos que a unidade cria

- `hubQuery(operation, { params })`, chave: operação e parâmetros (W11); `hubMutation` manda
  `Idempotency-Key` quando `attemptKey`; `attempt-key.ts`: uma chave por tentativa, nova após a resposta.
- Matriz de `sweep.test.ts` (respostas do contrato): sem sessão; sem empresas; com empresas;
  dono; membro; convite pendente, vencido, aceito, alheio; erro de campo; carregando; 502.
- `npm run e2e`: Hub em processo, banco do CI, correio falso, `cf-connecting-ip` posto.

### A ordem do trabalho

1. `hub.ts` com parâmetros, 201 e a chave. Regras: W9 a W11, W24.
2. Textos da página, dos critérios, e "Suas empresas", "Convites pendentes", "Convite
   enviado para {e-mail}.". Regras: W14 a W24, V24, V31, V38 a V43.
3. #32-1, 2, 4, 5, 7, varredura, ponta a ponta. Regras: V18, V28, T2.

### Como se prova

`npm test -w @conexus/web`; `npm run e2e`; capturas e Tab (T23).

## U7 Ao vivo

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/decisions/0017-invitation-email-cloudflare.md` | Muda (resultado) | — |

### A ordem do trabalho

1. O Firstmate grava o token da decisão 7 e roda os cinco itens.

### Como se prova

Critério 22.
