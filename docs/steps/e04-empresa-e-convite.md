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
   senha", abra o segundo e-mail e crie a senha.
4. Entre com ela: "{seu nome} convidou você para Empresa Teste como Administrador." Clique "Aceitar
   convite": a empresa abre com as duas pessoas.
5. Abra o link do convite de novo: "Você já faz parte de Empresa Teste."

**O que você faz, e quando.** No começo: aprova esta página. Antes do merge: o que a decisão 7 pede.
No fim: faz o roteiro e diz o que viu.

**Fica de fora.** Apagar empresa: etapa 5. Tirar pessoa, mudar papel, sair, a regra do último dono
(provada aqui), cancelar convite: etapa 6. Quatro itens das issues #25 e #32 (U2).

**As decisões suas pedidas nesta etapa.** Recomendo A em todas.

1. **Aceite explícito.** Hoje quem é convidado vira membro sozinho ao entrar. **A.** Vê "A empresa B
   convidou você" e só entra ao clicar "Aceitar convite". **B.** Automático.
2. **Quem cria vira dono?** **A.** Você vira o primeiro dono, convida o de verdade e sai na etapa 6.
   **B.** Cria sem fazer parte; o Conexus convida em nome da instalação (código nosso).
3. **Quem convida.** **A.** Dono convida qualquer papel; administrador convida administrador ou
   membro; membro não convida. **B.** Só o dono.
4. **Prazo do convite.** **A.** 2 dias, e "Convidar de novo" depois. **B.** 7 dias.
5. **Quem não tem senha.** **A.** Dois e-mails: o convite e, após "Ainda
   não tenho senha", o link de 15 minutos. **B.** Um só, com o link de 2 dias (código nosso que imita
   a biblioteca).
6. **Limites.** **A.** 10 convites por minuto por pessoa; 100 pendentes por empresa; 3 pedidos de
   link por minuto por endereço. **B.** Outros números.
7. **O remetente (0017).** **A.** Cloudflare, o Resend de reserva. Você fornece: Workers Paid (US$ 5
   por mês, 3.000 e-mails; depois US$ 0,35 por mil); um endereço num subdomínio do Hub, com "Onboard
   Domain", que cria o DNS; um token "Email Sending: Edit"; duas caixas suas. O e-mail sai do Brasil,
   e cada empresa é avisada (0032).
8. **Logins do banco (D11).** O login do Hub passa a ler, criar e mudar empresas, membros e convites,
   sem apagar nenhum.

*Pendentes.*

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 Conferências | As três conferências e W25 | `scripts/`, `apps/server/src/`, raiz | testes | `node` | — |
| U2 Consertos | Os itens de servidor das issues #25 e #32 | `apps/server/`, `packages/hub-api/` | testes | `fastify-best-practices` | U1 |
| U3 Tabelas | Tabelas dos plugins, chaves únicas, papel do primeiro | `apps/server/src/hub/identity/`, `apps/server/migrations/` | dados | `neon:neon-postgres` | U2 |
| U4 Concessões | O login do Hub nas tabelas novas, em pull request só dele | `apps/server/` (raiz), `apps/server/migrations/`, `apps/server/src/platform/` | dados | `neon:neon-postgres` | U3 |
| U5 Correio | A porta e o adaptador do e-mail | `apps/server/src/`, `infra/`, `scripts/`, `docs/how-to/` | segurança | `cloudflare:cloudflare-email-service` | U4 |
| U6 Empresas e convites | As nove operações, a admissão, o comando junto | `apps/server/src/`, `packages/hub-api/`, `docs/reference/` | segurança | `organization-best-practices`, `better-auth-security-best-practices` | U5 |
| U7 Telas | As telas e a varredura | `apps/web/`, `packages/hub-api/` | web | `shadcn` | U6 |
| U8 Ao vivo | O teste de entrega do 0017 | `docs/decisions/` | segurança | nenhuma | U1 a U7 no ar |

Em ordem: cada uma divide pasta com a seguinte. Um merge só (L13).

## Os critérios de aceite

Servidor: biblioteca de verdade em banco descartável (T16, T19). "Remoção": linha `caught` em
`scripts/removals.json` (T12).

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Linha de teste ou de Hub iniciado fora do JSON com `level` e código: o teste falha | `scripts/test-reporter.test.ts`, "linha crua"; `platform/test-database.test.ts` | must |
| 2 | U1 | `npm run removals`: teste verde, `survived`; `find` ausente ou repetido, `stale`; teste pulado, `unreachable`; saída 1; pega, 0 | `scripts/removals.test.ts` | must |
| 3 | U1 | `npm run radius -- U<k> <commit>`: arquivo fora da tabela, `out-of-radius` e saída 1; avisa `ambiguous-row` | `scripts/check-radius.test.ts` | must |
| 4 | U1 | O Biome recusa `max-w-sm` e `w-2xl` em `apps/web/src` e aceita `min-w-48` | `scripts/rules.test.ts`, "W25" | must |
| 5 | U2 | `whenIdle` fora do tipo `Database`; "banco dorme" chega a zero conexões | `platform/database.test.ts`; `identity.test.ts` | must |
| 6 | U2 | Falha no `connect` ou evento `error` do cliente: 503; erro sem SQLSTATE numa consulta: 500, qualquer classe | `platform/database.test.ts`, "perda" | must |
| 7 | U2 | Sem `CONEXUS_TEST_DATABASE_CONTAINER`, o catálogo pula com `opt-in:` | `platform/catalog.test.ts` | must |
| 8 | U2 | Código fora das falhas da operação falha no gancho da porta de teste; `setPassword` declara `DATABASE_UNAVAILABLE` | `platform/http.test.ts`; `password-write.test.ts` | must |
| 9 | U2 | Reproduzida a causa, o `drop database` das suítes sem 42501, sem espera nem repetição | `catalog.test.ts` | must |
| 10 | U3 | `auth.company`, `auth.member`, `auth.invitation` com `company_id`; os quatro únicos do contrato; as colunas dos plugins | `hub/identity/tables.test.ts`, "catálogo" | must |
| 11 | U3 | Depois de `migrate`, a pessoa mais antiga ganha `role = 'admin'` se ninguém tem; sem pessoas, nada | `tables.test.ts`, "administrador" | must |
| 12 | U4 | Catálogo igual a `database-grants.sql`; 42501 em `DELETE` de `company`, `member`, `invitation` | `platform/catalog.test.ts` | must |
| 13 | U5 | Sem uma variável `HUB_MAIL_*`, ou token legível por outros: sai 1, `CONFIG_INVALID` com o nome; `deploy.sh` recusa sem `hub_mail_token` | `boot.test.ts`; `scripts/deploy.test.ts` | must |
| 14 | U5 | Lado do Hub (T14): 2xx passa; 4xx, 5xx ou prazo: `MAIL_UNAVAILABLE`, sem repetir, registro sem endereço | `platform/mail.test.ts`, servidor falso (T15) | must |
| 15 | U6 | `POST /api/companies` pelo administrador da instalação: 201, ele dono; mesma chave, a mesma empresa, ou 409 `IDEMPOTENCY_CONFLICT` com outro nome; outra pessoa, 404 sem linha (remoção) | `hub/identity/companies.test.ts` | must |
| 16 | U6 | `GET /api/companies`: só as de quem pede, com papel, 50 por página, consulta do Hub; `mayCreate` só do administrador | `companies.test.ts`, "lista" | must |
| 17 | U6 | `GET /api/companies/{id}` e `/members`: membro, 200; `/invitations`: dono e administrador, 200, membro 404; outra empresa, id desconhecido ou malformado (sem consulta), o mesmo 404 (S10, remoção) | `companies.test.ts`, "fora" | must |
| 18 | U6 | Convidar por dono ou administrador: 201, um pendente, um e-mail com `/invitations/{id}`; membro ou outra empresa, 404 sem linha; administrador pedindo dono, 403 `INVITATION_ROLE_REFUSED`; já membro, 409 `MEMBER_EXISTS` | `hub/identity/invitations.test.ts`, "convidar" | must |
| 19 | U6 | Outra chave: o anterior cancelado, novo e-mail; mesma chave: o mesmo, sem e-mail; dois ao mesmo tempo: um pendente, outro 409 `INVITATION_PENDING` (remoção) | `invitations.test.ts`, "de novo" | must |
| 20 | U6 | 11º convite de uma pessoa em 60 s, ou 101º pendente da empresa: 429 `INVITATIONS_EXCEEDED`, sem linha nem e-mail; dois juntos no 10º, um passa (remoção) | `invitations.test.ts`, "limite" | must |
| 21 | U6 | Correio fora: convite salvo, 502 `MAIL_UNAVAILABLE` | `invitations.test.ts`, "correio fora" | must |
| 22 | U6 | `GET /api/invitations/{invitationId}`: a convidada, 200 com empresa, papel, quem convidou, estado; outra pessoa, 404; sem sessão, 401 | `invitations.test.ts`, "ler" | must |
| 23 | U6 | `PUT /api/invitations/{invitationId}/password-link`: sem pessoa, criada sem senha, e-mail com `/set-password?redirect=/invitations/{id}#token=`; com senha, 204 sem e-mail; convite não pendente, 404 sem pessoa; 4º do endereço em 60 s, 429 `PASSWORD_LINKS_EXCEEDED`; as recusas de `entry` (`access.ts`) | `invitations.test.ts`, "link" | must |
| 24 | U6 | `PUT …/acceptance` pela convidada: 200, um membro com o papel; de novo, igual; outra pessoa, 404 sem escrita; vencido, 422 `INVITATION_EXPIRED`; dois juntos, um membro e 200 nos dois | `invitations.test.ts`, "aceitar" | must |
| 25 | U6 | Escrita recusada no meio do aceite: nenhum membro, convite pendente, 500; com `runWithAdapter` no lugar do comando junto, falha (remoção) | `invitations.test.ts`, "no meio" | must |
| 26 | U6 | LT11: convite a e-mail novo, link, `PUT /api/passwords`, entrar, aceitar, e a empresa em `GET /api/companies` | `invitations.test.ts`, "do convite à empresa" | must |
| 27 | U6 | LT12: todo caminho de organização e de administração da biblioteca, 404; `signUpEmail` recusado | `session.test.ts`, "caminhos da biblioteca"; `sign-up.test.ts` | must |
| 28 | U6 | Nos critérios 15 a 26, só linhas com código, sem e-mail, nome ou token; os códigos da tabela de falhas; cada 404 registra seu motivo (S10, S41, S45) | `invitations.test.ts`, `companies.test.ts`, "registro" | must |
| 29 | U6 | `first-person` cria a pessoa com `role = 'admin'` ; os casos de hoje passam | `first-person.test.ts` | must |
| 30 | U7 | Início: empresas com papel; vazio, "Você ainda não participa de nenhuma empresa."; "Nova empresa" só com `mayCreate` | `routes/_app/route.test.tsx` | must |
| 31 | U7 | "Nova empresa": erro no campo; dois cliques, um pedido com a mesma chave; 201 abre a empresa | `hub/identity/create-company-form.test.tsx` | must |
| 32 | U7 | Pessoas: membros com papel; pendentes e formulário conforme a Hub; papéis de `mayInviteAs`; 409 no e-mail, 403 no papel | `people.test.tsx`, `invite-form.test.tsx` | must |
| 33 | U7 | `/invitations/{id}`: "Entrar" e "Ainda não tenho senha"; com sessão, o `beforeLoad` leva a `…/acceptance` (W15): "Aceitar convite" abre a empresa; vencido, aceito, desconhecido com seus textos | `invitation.test.tsx`; `platform/http.test.ts` | must |
| 34 | U7 | "Criar sua senha" com `redirect`: 204 leva a `/login?redirect=/invitations/{id}`; fora da origem, ignorado (W16) | `set-password-form.test.tsx` | must |
| 35 | U7 | #32: foco volta a "Abrir navegação"; aviso sem `text-text-2`; foco no título depois de entrar; contorno longe da borda do menu | `layout.test.ts`, `sign-in-form.test.tsx`, `route.test.tsx`, `sweep.test.ts` | must |
| 36 | U7 | Cada endereço de `PAGES` em 1366, 390 e 320 px, claro e escuro: sem rolagem lateral, contorno de 2 px em cada parada do Tab | `apps/web/sweep.test.ts` | must |
| 37 | U8 | Os quatro itens do 0017 passam; o resultado vai ao registro | Firstmate, ao vivo, com você | must |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Empresa, dono, empresa ativa da sessão (`createOrganization`) | Mesma chave: lida antes, ou 23505; devolve a primeira | Tudo volta (comando junto) | 503 | `COMPANY_CREATED` | 15, 28 |
| Convite e cancelamento do anterior (`createInvitation`) | Um pendente, o outro 409 | Tudo volta | 503 | `INVITATION_CREATED` | 18, 19, 28 |
| Pessoa sem senha | Um e-mail, uma pessoa (único de `user.email`) | Volta com o comando | 503 | nada | 23 |
| Link de senha e tentativas (`/request-password-reset`, sozinho) | Vale o último (`forgetLinks`) | A pessoa fica sem link; pedir de novo serve | 503 | `PASSWORD_LINK_GIVEN` | 23 |
| Convite aceito, membro, empresa ativa (`acceptInvitation`) | Convite travado: um membro, 200 nos dois | Nada fica; 500 | 503 | `INVITATION_ACCEPTED` | 24, 25 |
| E-mail, depois do `commit` | Um por convite novo | — | 502, o convite fica | `MAIL_SENT`, `MAIL_FAILED` | 14, 21 |
| As três migrações (U3, U4) | Uma por vez (D9) | Volta a migração | `migrate` sai 1 | `MIGRATED` | 10 a 12 |
| Primeira pessoa com `role` | Como na etapa 3 | Volta tudo | sai 1 | como hoje | 29 |
| Cópia de `npm run removals` | Pastas diferentes | O repositório não muda | sem banco, `unreachable` | uma linha por remoção | 2 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Empresa e convites (`workspace/`) | Nova, nativa | `auth.company`, `auth.invitation`; `hub/identity/{companies,invitations}.ts` | — | Dono com a empresa e um pendente por e-mail: propósito (C64, D15) |
| Admissão (`admission.ts`) | Nova | `hub/identity/admission.ts`, papéis do plugin | — | Prova só da admissão (S7); motivo só no registro (S10) |
| Entrada automática (`authentication.ts:147-157`) | Retirada | — | — | "Implementado assim": decisão 1 |
| Administrador da instalação (`iam.installation_administrator`) | Nova, nativa | `user.role` | — | Fato de pessoa (S11); histórico sem leitor, retirado |

**A medida do transplante.** Nenhuma parte é trazida.

**A dívida.**

- O `slug` da biblioteca recebe a chave; a repetição é lida por `attempt_key` antes da biblioteca.
- O 25P02 do aceite recusado no meio vira 500 e não 503: o plugin troca a causa (`crud-invites.mjs:332-339`).
- Esperam: #25-3, #25-6, #32-3 e #32-8 (relatório, L20).

## U1 Conferências

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `scripts/test-reporter.ts`, `scripts/test-reporter.test.ts` | Muda | os três comandos de teste |
| `scripts/{removals.ts,removals.json,removals.test.ts,check-radius.ts,check-radius.test.ts}` | Cria | `package.json` |
| `scripts/w25.grit`, `biome.json`, `scripts/rules.test.ts` | Cria / muda | Biome |
| `apps/server/src/platform/test-database.ts`, `apps/server/src/platform/test-database.test.ts` | Muda / cria | os testes de servidor |
| `apps/server/src/**/*.test.ts` que iniciam o Hub | Muda | CI |
| `package.json`, `.github/workflows/ci.yml` | Muda | npm, CI |

### Os contratos que a unidade cria

- `type Removal = { id; file; find; replace; test: { cwd; file; name? } }`, todos `string`.
- `npm run removals [-- --only <id>]`; `npm run radius -- U<k> [commit]`.
- `spawnHub(t, env): Promise<{ port; lines; stop(): Promise<void> }>` em `test-database.ts`.

### A ordem do trabalho

1. A recusa de linha crua no relator e em `spawnHub`. Regras:
   C50, C78, T4, T20.
2. `removals.ts` numa cópia dos arquivos do Git; passo no CI. Regras: T5, T12, C60.
3. `check-radius.ts` (L7); o plugin GritQL (W25).

### Como se prova

Critérios 1 a 4, com casos plantados que precisam falhar (C78).

## U2 Consertos

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/{database,test-database,http}.ts` | Muda | `main.ts`, `migrate.ts`, `hub/*`, os testes |
| `apps/server/src/hub/identity/{auth,session,public}.ts` | Muda | `main.ts` |
| `packages/hub-api/src/identity.ts`, `apps/server/package.json` | Muda | servidor, web, npm |
| `apps/server/src/platform/*.test.ts`, `apps/server/src/hub/identity/*.test.ts` | Cria ou muda | os testes ao lado |

### Os contratos que a unidade cria

- `whenIdle(database)` em `test-database.ts`, fora de `Database`.
- `serve` põe `failures` na `config` da rota; o gancho `onSend` da porta de teste recusa um `code`
  fora dela e das falhas de acesso, `NOT_FOUND` e `INTERNAL_UNEXPECTED`.
- `LIFETIMES = { idleSeconds, renewAfterSeconds, totalSeconds }` em `auth.ts`.
- `apps/server/package.json`: `"generate": "drizzle-kit generate"`.

### A ordem do trabalho

1. #32-15 reproduzido primeiro (`conexus-build`, defeito). Regras: C65, T20.
2. #25-1; #25-2, a perda decidida por onde aconteceu. Regras: C26, C52.
3. #25-4, #25-5, #32-6, #32-9, #32-10. Regras: C28, C70, T4.
4. #32-11: `createAuth` fica em `public.ts`: só por ela se prova o cadastro fechado.

### Como se prova

Critérios 5 a 9.

## U3 Tabelas

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/tables.ts`, `apps/server/src/hub/identity/tables.test.ts` | Muda | `drizzle.config.ts`; `auth.ts` |
| `apps/server/migrations/<data>_company_tables/` | Cria (gerada por `npm run generate`) | `migrate` |
| `apps/server/migrations/<data>_installation_admin/migration.sql` | Cria (SQL à mão) | `migrate` |

### Os contratos que a unidade cria

- Os campos dos modelos dos plugins em 1.7.8, como na etapa 3; chaves estrangeiras `RESTRICT`.
- Únicos: `company(attempt_key)`, `member(company_id, user_id)`, `invitation(company_id,
  lower(email)) where status = 'pending'`, `invitation(company_id, attempt_key)`.

### A ordem do trabalho

1. Tabelas e migração gerada, lida antes (D2, D4 a D8, D15, D17); a do papel, com o porquê (D14).

### Como se prova

Critérios 10 e 11.

## U4 Concessões

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/migrations/<data>_company_grants/migration.sql` | Cria (SQL à mão) | `migrate` |
| `apps/server/database-grants.sql` | Muda | `platform/catalog.test.ts` |
| `apps/server/src/platform/catalog.test.ts` | Muda | CI |

### Os contratos que a unidade cria

`hub_runtime`: `SELECT, INSERT, UPDATE` em `auth.company`, `auth.member`, `auth.invitation`.

### A ordem do trabalho

1. Pull request próprio, decisão 8. Regras: D10, D11, D12.

### Como se prova

Critério 12.

## U5 Correio

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/mail.ts`, `apps/server/src/platform/mail.test.ts` | Cria | `main.ts` |
| `apps/server/src/platform/config.ts`, `apps/server/src/boot.test.ts` | Muda | `main.ts` |
| `infra/compose.yaml`, `infra/deploy.sh`, `scripts/deploy.test.ts` | Muda | publicar, voltar atrás, reiniciar |
| `docs/how-to/hub-server.md` | Muda | — |

### Os contratos que a unidade cria

- `type SendMail = (message: { to: Email; subject: string; text: string }) => Promise<void>`;
  `createMail(deps: { config; log }): SendMail`.
- `Config`: `mailApiUrl` (`HUB_MAIL_API_URL`), `mailFrom: Email` (`HUB_MAIL_FROM`), `mailToken`
  (`HUB_MAIL_TOKEN_FILE`, classe com `#value`).
- Falha `MAIL_UNAVAILABLE`: `THIRD_PARTY`, 502, "O e-mail não pôde ser enviado agora.", "O convite
  ficou salvo. Convide de novo daqui a pouco.", `NONE`.

### A ordem do trabalho

1. `fetch` com prazo de 10 s, sem repetir, sem ler um não-2xx (C56 a C59, S31, S36, S41); o
   segredo no Compose, em `deploy.sh` e no procedimento (C67, S37).

### Como se prova

Critérios 13 e 14.

## U6 Empresas e convites

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/{auth,first-person,public}.ts` | Muda | `main.ts` |
| `apps/server/src/hub/identity/{admission,companies,invitations,company-routes,messages}.ts` | Cria | `public.ts` |
| `apps/server/src/hub/identity/admission.check.ts` | Cria (forjar `Admitted` não compila, T9) | `tsc` |
| `apps/server/src/platform/{http,access}.ts`, `apps/server/src/main.ts` | Muda | `main.ts`, rotas, a imagem |
| `packages/hub-api/src/{companies,operation,failures,index}.ts` | Cria / muda | servidor, web |
| `docs/reference/boundaries.md` | Muda | C75 |
| `scripts/removals.json` | Muda | `npm run removals` |
| `apps/server/src/hub/identity/*.test.ts`, `apps/server/src/platform/*.test.ts` | Cria ou muda | os testes ao lado |

### Os contratos que a unidade cria

- `CompanyId`, `InvitationId` (32 letras e dígitos, marcados); `Role`; `Company`, `Membership`,
  `Member`, `PendingInvitation`, `ReceivedInvitation` (com `state`: pendente, vencido, aceito, cancelado).
- `Operation` ganha `input.params`, `success.status: 201` e `attemptKey: true` (`Idempotency-Key`,
  UUID); `serve` confere os parâmetros antes do corpo (C42).
- `listCompanies`: `GET /api/companies`, `session`, `?page`; 200 `{ companies: Membership[]; mayCreate:
  boolean; next: { kind: 'END' } | { kind: 'MORE'; page: string } }`.
- `createCompany`: `POST /api/companies`, `session`, chave, `{ name }` 1 a 100; 201 `{ company }`;
  `NOT_FOUND`, `IDEMPOTENCY_CONFLICT` 409.
- `getCompany`: `GET /api/companies/{companyId}`; 200 `{ company; role; mayInviteAs: Role[] }`.
  `listMembers`, `listInvitations`: `GET …/members`, `GET …/invitations`, `?page`; 200 com a lista e `next`.
- `createInvitation`: `POST /api/companies/{companyId}/invitations`, chave, `{ email; role }`; 201
  `{ invitation }`; `INVITATION_ROLE_REFUSED` 403, `MEMBER_EXISTS` 409, `INVITATION_PENDING` 409,
  `INVITATIONS_EXCEEDED` 429, `IDEMPOTENCY_CONFLICT` 409, `MAIL_UNAVAILABLE` 502.
- `getInvitation`: `GET /api/invitations/{invitationId}`, `session`; 200 `{ invitation:
  ReceivedInvitation }`.
- `putPasswordLink`: `PUT /api/invitations/{invitationId}/password-link`, `entry`; 204; `PASSWORD_LINKS_EXCEEDED`
  429, `MAIL_UNAVAILABLE` 502. `acceptInvitation`: `PUT /api/invitations/{invitationId}/acceptance`, `session`; 200
  `{ company }`; `INVITATION_EXPIRED` 422. `PUT` nos dois: repetir põe o mesmo estado.
- Todas: `NOT_FOUND`, `DATABASE_UNAVAILABLE`, e as de acesso.
- Falhas novas, `USER`, `NONE`: `IDEMPOTENCY_CONFLICT` "Este pedido já foi feito com outros dados." /
  "Recarregue a página."; `MEMBER_EXISTS` "Essa pessoa já está na empresa."; `INVITATION_PENDING` "Já
  há um convite pendente para esse e-mail."; `INVITATION_ROLE_REFUSED` "Você não pode convidar com esse
  papel."; `INVITATIONS_EXCEEDED` "Muitos convites seguidos." e `PASSWORD_LINKS_EXCEEDED` "Muitos
  pedidos de link." / "Espere um minuto e tente de novo."; `INVITATION_EXPIRED` "Este convite
  venceu." / "Peça um novo a quem convidou você.".
- `admit(input: { tx: CommandTx; personId: PersonId; companyId: CompanyId; action: CompanyAction }):
  Promise<Admitted>`; `Admitted` com membro `private`, feito só aqui (C16).
- `libraryCommand<T>(work: (tx: CommandTx) => Promise<T>): Promise<T>` em `auth.ts`:
  `database.command` com `runWithTransaction(adapterOn(auth, tx), …)`; também em `first-person.ts`.
- `createIdentity(deps: { database; config; log; sendMail: SendMail })`.

### A ordem do trabalho

1. `organization()` e `admin()` de `better-auth@1.7.8`: `modelName: 'company'`, `attemptKey`
   adicional, `allowUserToCreateOrganization` pelo `role`, `cancelPendingInvitationsOnReInvite`,
   sem `sendInvitationEmail`, `customRules` de `/request-password-reset`. Regras: C75, S11, S12.
2. Toda gravação da biblioteca em `libraryCommand`, por `auth.api` com a sessão; nunca
   `createOrganization` sem ela. Regras: C64, D22.
3. `admit` lê o membro e decide por `defaultRoles[role].authorize`. Regras: S6 a S10, D21.
4. Convidar: admitir, travar a linha de quem convida e contar os convites dele em 60 s; membro
   e papel lidos pelo Hub; `createInvitation`, `commit`, e então o e-mail; 23505 pelo nome do índice. Regras: C37, D16, D24,
   D26, S28.
5. Link: num comando, o convite pendente e a pessoa se faltar (`internalAdapter.createUser`); depois,
   sozinho, `/request-password-reset` por `auth.handler`, `linkTokenOf`, o e-mail. Regras: S12, S30.
6. Aceitar: travar o convite, estado e prazo, `acceptInvitation`; já aceito por ela, devolve a empresa. Regras: C64, S8.
7. `boundaries.md` (C75); as linhas de remoção.

### Como se prova

Critérios 15 a 29, com `app.inject` e status e corpo literais; prazo e janela envelhecidos por `UPDATE`
do dono do banco de teste, sem espera (T20).

## U7 Telas

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/pages.ts` | Muda (`/companies/new`, `/companies/$companyId`, `/invitations/$invitationId`, `…/acceptance`) | `platform/http.ts`, `__root.test.tsx` |
| `apps/server/src/platform/http.ts` | Muda (`$x` vira `:x`) | `main.ts` |
| `apps/web/src/platform/{hub,attempt-key}.ts` | Muda / cria | `queries.ts` |
| `apps/web/src/ui/select.tsx`, `docs/reference/components.md` | Cria / muda | `hub/identity` |
| `apps/web/src/ui/dropdown-menu.tsx`, `apps/web/src/platform/jitless.ts` | Muda | `account-menu.tsx`; `main.tsx` |
| `apps/web/src/routes/{_app/index,_app/companies/new,_app/companies/$companyId,_public/invitations/$invitationId,_app/invitations/$invitationId/acceptance,_public/set-password}.tsx`, `apps/web/src/routeTree.gen.ts` | Cria / muda | o roteador |
| `apps/web/src/hub/identity/{queries,public}.ts`, `apps/web/src/hub/identity/{sign-in-form,set-password-form,companies,create-company-form,people,invite-form,invitation}.tsx` | Muda / cria | rotas |
| `apps/web/{layout.test,sweep.test,layout-harness}.ts`, `apps/web/package.json` | Muda / cria | `npm test -w @conexus/web` |
| `apps/web/src/{hub/identity,routes,routes/_app,platform}/*.test.tsx` | Cria ou muda | os testes ao lado |

### Os contratos que a unidade cria

- `hubQuery(operation, { params })`, chave da operação e dos parâmetros (W11); `hubMutation` manda
  `Idempotency-Key` quando `attemptKey`; `attempt-key.ts`: uma chave por tentativa, renovada após a
  resposta.
- `set-password`: `validateSearch` com `redirect` lido como caminho da mesma origem.

### A ordem do trabalho

1. `hub.ts` com parâmetros, 201 e a chave. Regras: W9 a W11, W24.
2. As telas com os textos da página, dos critérios e estes: "Suas empresas", "Convites pendentes",
   "Convite enviado para {e-mail}.", "Este convite venceu. Peça um novo a quem convidou você.".
   Regras: W14 a W24, V24, V31, V38 a V43.
3. #32-1, 2, 4, 5, 7 e a varredura. Regras: V18, V28, T2.

### Como se prova

Critérios 30 a 36 (Vitest com MSW; Chromium); capturas e Tab (T23).

## U8 Ao vivo

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/decisions/0017-invitation-email-cloudflare.md` | Muda (resultado) | — |

### A ordem do trabalho

1. Com a decisão 7, o Firstmate grava o token e roda os quatro itens; o resultado vai ao 0017.

### Como se prova

Critério 37.
