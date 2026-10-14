# Etapa 3: Entrar

## A página do fundador

**No fim desta etapa** você cria a sua senha por um link de uso único, entra no Hub com e-mail e
senha, vê o Hub recusar tentativas demais, e sai.

**O roteiro de uso.**

1. No GitHub, em Actions, rode "Criar a primeira pessoa" com o seu nome e e-mail. O resumo da
   execução mostra um link que vale 15 minutos e uma vez só.
2. Abra o link: a página "Criar sua senha", em `hub.conexus.fun/set-password`. Escolha uma senha
   de 8 caracteres ou mais. Aparece "Entrar no Conexus", em `/sign-in`.
3. Entre com o e-mail e a senha: a moldura do Hub, com "Você entrou como {seu nome}." e a versão
   do Hub. Abra o link do passo 1 de novo: "Este link já foi usado ou venceu."
4. Saia pelo menu da conta, "Sair do Conexus": volta "Entrar", com "Você saiu do Conexus.".
5. Erre a senha 11 vezes seguidas. A 11ª mostra "Muitas tentativas de entrada deste endereço.
   Espere um minuto e tente de novo.", mesmo com a senha certa. Depois de um minuto, entre.
6. Rode "Criar a primeira pessoa" de novo: termina vermelha, com "Já existe uma pessoa com senha
   nesta instalação." Se o link do passo 1 vencer sem uso, rodar de novo dá um link novo.

**O que você faz, e quando.** No começo: aprova esta página. Depois do merge, o Firstmate grava o
segredo das sessões no servidor, como gravou as chaves do banco, e confere a entrada pelo Tunnel.
No fim: faz o roteiro e diz o que viu.

**Fica de fora.** Empresas e convites: etapa 4. "Esqueci a senha", trocar a senha, desativar uma
pessoa e sair em todos os aparelhos: etapa 6. Entrar num app: etapa 18. A limpeza das sessões
vencidas: com o primeiro trabalho agendado; até lá uma sessão vencida é apagada quando alguém a
apresenta, e não vale nada sem o segredo.

**A decisão sua pedida nesta etapa: o administrador da instalação (decisão 5).** Hoje ele mexe nas
conexões de qualquer empresa: você abriria a conexão com o sistema da empresa A e a mudaria.

- **A.** Vira papel só da equipe da plataforma: cria empresas e cuida da instalação; quem cria e
  muda as conexões de uma empresa é o dono ou um administrador dela.
- **B.** Fica como hoje.

Recomendação: **A**. Nesta etapa nada muda na tela: você é criado sem esse papel, que entra na
etapa 4 com o seu primeiro uso. **Resposta**: pendente.

O Firstmate leva à parte três perguntas; a página segue a recomendação de cada uma até a sua
resposta: o limite (10 por minuto por endereço), a primeira senha (o link do passo 1) e o tempo da
entrada (sai com 30 minutos sem usar e com 8 horas no total). **Já respondidas** (estudo da
interface, 2026-10-14): "1. geralmente é /login ou /sign-in prefiro em ingles / 2. A / 3. A / 4.
A". Fica `/sign-in`, a palavra que o Hub e a biblioteca já usam para esse ato; confirme ao aprovar.

**A lista de logins do banco**, que a regra dos dados manda passar pela sua palavra: o login do Hub
passa a ler e gravar as tabelas de entrada (pessoas, senhas guardadas como hash, sessões, links de
uso único, contagem de tentativas). Apaga sessões, links e contagens; não apaga pessoas nem senhas.
Ao aprovar esta página, você aprova essa lista para a etapa inteira.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 Tabelas | O esquema `auth` com as cinco tabelas da biblioteca | `apps/server/src/hub/identity/`, `apps/server/migrations/` | dados | `better-auth-best-practices`, `neon:neon-postgres` | — |
| U2 Concessões | O login do Hub nessas tabelas, num pull request só dele (D11) | `apps/server/` (raiz), `apps/server/migrations/`, `apps/server/src/platform/` | dados | `neon:neon-postgres` | U1 |
| U3 Acesso | Os tipos `entry` e `session`, as recusas 400, 413, 415 e de origem, a configuração nova, o banco cedido à biblioteca | `apps/server/src/`, `packages/hub-api/`, `infra/`, `scripts/` | segurança | `fastify-best-practices` | U2 |
| U4 Identidade | Entrar, ler a sessão, sair, o prazo total, os registros da biblioteca | `apps/server/src/`, `apps/server/` (raiz), `packages/hub-api/`, `docs/` | segurança | `better-auth-best-practices`, `better-auth-security-best-practices`, `email-and-password-best-practices`, `fastify-best-practices` | U3 |
| U5 Primeira pessoa | O comando `first-person`, a senha pelo link, a ação "Criar a primeira pessoa", os procedimentos | `apps/server/src/`, `packages/hub-api/`, `.github/workflows/`, `docs/how-to/` | segurança | `better-auth-best-practices`, `email-and-password-best-practices` | U4 |
| U6 Telas | Rotas por arquivo, "Entrar", "Criar sua senha", a moldura com "Sair", espera, falha e endereço desconhecido | `apps/web/`, raiz | web | `shadcn` | U5 |
| U7 Ao vivo | LT16 pelo Tunnel, o endereço do cliente (S29), a ação no servidor, o resultado no 0013 | `docs/decisions/`; o servidor | segurança | nenhuma | U1 a U6 no ar |

As unidades correm em ordem: cada uma divide pasta com a seguinte. O código da etapa entra no `main`
num merge só (L13), então nenhuma unidade sobe sozinha.

## Os critérios de aceite

Os testes de servidor usam a biblioteca de verdade num banco descartável (T16, T19). Os números são
os da configuração: 1800 s sem uso, renovação a cada 60 s, 8 h no total, 10 tentativas por 60 s.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | O esquema `auth` tem só `user`, `session`, `account`, `verification`, `rate_limit`; nenhuma tabela de empresa, membro, convite ou equipe (LT6) | `hub/identity/tables.test.ts`, "catálogo" | must |
| 2 | U2 | O catálogo depois de `migrate` é igual a `database-grants.sql`; o login do Hub recebe 42501 em `DELETE` de `auth.user` e `auth.account` e em DDL | `platform/catalog.test.ts`, um caso plantado por recusa | must |
| 3 | U3 | Uma rota sem tipo de acesso, ou com tipo desconhecido, impede a subida | `platform/access.test.ts`, "tipo" | must |
| 4 | U3 | Em `PUT /api/sessions/current`: sem `Origin`, com `Origin` de outro site ou `Sec-Fetch-Site: cross-site`, 403 `REQUEST_ORIGIN_REFUSED` antes da senha ser lida | `access.test.ts`, "origem" | must |
| 5 | U3 | Em `PUT /api/sessions/current`: formulário, multipart ou `text/plain`, 415; JSON inválido, 400 `REQUEST_MALFORMED`; corpo acima de 4 KiB, 413 (dívida da seção 11) | `access.test.ts`, um caso por recusa | must |
| 6 | U3 | Em `PUT /api/sessions/current` sem `cf-connecting-ip`: 400 `REQUEST_MALFORMED` | `access.test.ts`, "endereço" | must |
| 7 | U3 | Sem `HUB_PUBLIC_ORIGIN`, sem o arquivo do segredo, ou com arquivo que outros leem, a subida sai com 1 e `CONFIG_INVALID` com o nome da variável; `deploy.sh` recusa sem `hub_session_secret` | `boot.test.ts`, "configuração"; `scripts/deploy.test.ts` | must |
| 8 | U4 | `PUT /api/sessions/current` com e-mail e senha certos: 200 com a pessoa (id, nome, e-mail) e um só `Set-Cookie`: `__Host-conexus_session`, `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, sem `Domain` (LT3, LT7 do Hub) | `hub/identity/identity.test.ts`, "entrar", cabeçalho literal | must |
| 9 | U4 | Na mesma rota, e-mail desconhecido e senha errada: o mesmo 401 `SIGN_IN_REFUSED`, o mesmo corpo | `identity.test.ts`, "recusa" | must |
| 10 | U4 | Na mesma rota, 10 tentativas de um endereço em 60 s; a 11ª, 429 `SIGN_IN_ATTEMPTS_EXCEEDED` mesmo com a senha certa; outro endereço entra; passados 60 s o primeiro entra (S30) | `identity.test.ts`, "limite", tempo movido nas linhas de `auth.rate_limit` | must |
| 11 | U4 | `GET /api/sessions/current`: com o cookie, 200 com a pessoa; sem cookie, com o token cru da tabela ou com assinatura forjada, 401 `SESSION_REQUIRED` (LT15, S16) | `identity.test.ts`, "cópia do banco" | must |
| 12 | U4 | `GET /api/sessions/current` depois de a linha ser apagada no banco: 401 (LT14, S19) | `identity.test.ts`, "linha apagada" | must |
| 13 | U4 | `GET /api/sessions/current` com o último uso há mais de 1800 s: 401; usada depois de 60 s, volta com o cookie renovado | `identity.test.ts`, "prazo ocioso" | must |
| 14 | U4 | `GET /api/sessions/current` com a sessão em uso e criada há mais de 8 h: 401 e a linha some; sem a verificação, o teste falha (T12) | `identity.test.ts`, "prazo total" | must |
| 15 | U4 | `GET /api/sessions/current` com `expires_at` no futuro pelo relógio do processo e no passado pelo do banco: 401 (S18) | `identity.test.ts`, "relógio do banco" | must |
| 16 | U4 | `DELETE /api/sessions/current`: 204, a linha some, o cookie expira; o mesmo cookie em seguida, 401 (LT10 do Hub) | `identity.test.ts`, "sair" | must |
| 17 | U4 | `DELETE /api/sessions/current` com o `DELETE` recusado pelo banco: 503 `DATABASE_UNAVAILABLE`, cookie mantido, sessão viva; sem a ordem "linha, depois cookie", o teste falha (S20, T12) | `identity.test.ts`, "sair falha", concessão retirada no teste | must |
| 18 | U4 | Cada caminho de `/api/auth/*` da 1.7.8 responde 404; `signUpEmail` no servidor é recusado (LT17, LT12 do Hub) | `identity.test.ts`, "caminhos da biblioteca" | must |
| 19 | U4 | Nas rotas dos critérios 8 a 10, a saída do processo tem só linhas com código e id de rastreio, nenhuma com e-mail; entrar, recusa, limite e sair deixam cada um o seu código (R1, S41, S45) | `identity.test.ts`, "registros", saída capturada | must |
| 20 | U4 | Depois do último pedido a qualquer rota acima, o pool chega a zero conexões (D27) | `identity.test.ts`, "banco dorme", `whenIdle()` | must |
| 21 | U5 | `first-person` sem pessoa cria a pessoa sem senha e grava o link no arquivo de resumo dado; nenhuma linha de registro traz o token; com uma pessoa com senha, sai com 1, `FIRST_PERSON_EXISTS` e "Já existe uma pessoa com senha nesta instalação."; com a pessoa ainda sem senha, dá um link novo e o antigo deixa de valer (C64) | `hub/identity/first-person.test.ts` | must |
| 22 | U5 | `PUT /api/passwords` com o token do link e senha de 8 a 128: 204, e a pessoa entra pelo critério 8; o mesmo token de novo, vencido, ou o valor guardado em `auth.verification` usado como token: 422 `PASSWORD_LINK_INVALID`; senha curta: 422 `PASSWORD_TOO_SHORT`, e o link continua valendo | `first-person.test.ts`, "senha pelo link" | must |
| 23 | U6 | Sem sessão, `/` leva a `/sign-in` sem desenhar a moldura; com sessão, a moldura, o nome e a versão do Hub; depois de entrar, a página pedida | `apps/web/src/routes/_app/route.test.tsx` com MSW | must |
| 24 | U6 | "Entrar": erro de campo em português; 401 no formulário sem dizer qual campo; 429 com o seu texto; botão desabilitado enquanto envia | `apps/web/src/hub/identity/sign-in-form.test.tsx` | must |
| 25 | U6 | "Criar sua senha": senha curta no campo; 422 `PASSWORD_LINK_INVALID` mostra "Este link já foi usado ou venceu."; 204 leva a `/sign-in` | `apps/web/src/hub/identity/set-password-form.test.tsx` | must |
| 26 | U6 | "Sair do Conexus" leva a `/sign-in` com "Você saiu do Conexus."; um 401 em qualquer leitura, com "Sua sessão terminou." | `apps/web/src/hub/identity/account-menu.test.tsx`; `apps/web/src/platform/cache.test.tsx`, "401" | must |
| 27 | U6 | Um endereço desconhecido mostra "Não encontramos o que você procurou." | `apps/web/src/routes/__root.test.tsx` | must |
| 28 | U7 | No Chromium, `/sign-in`, `/set-password` e a moldura sem violação de CSP | Firstmate, ao vivo, o painel de problemas do Chromium | must |
| 29 | U7 | Pelo Tunnel: os cookies do critério 8; `cf-connecting-ip` é o endereço de quem pede; um 429 num endereço não afeta outro (LT16, S29) | Firstmate, ao vivo, antes do roteiro | must |
| 30 | U7 | A ação "Criar a primeira pessoa" mostra o link só no resumo da execução, não no log; um segredo trocado encerra as sessões | Firstmate, ao vivo | must |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Sessão do Hub (`hub-session.ts`, `session-core.ts`, `iam.host_session` do tipo `HUB`) | Nova, nativa | `hub/identity/auth.ts` | — | 30 min sem uso e 8 h no total: "implementado assim" (`lifetimes.ts:7`, `:12`), defendidos pelo propósito (computador de escritório esquecido aberto) e postos ao fundador |
| Cookie (`http/cookies.ts:5-17`) | Nova, por configuração | `hub/identity/auth.ts` | — | `__Host-`: propósito (S17, apps em hosts vizinhos) |
| Prazo total e relógio do banco | Nova | `hub/identity/session.ts` | — | — |
| Sair | Nova, duas chamadas nativas | `hub/identity/routes.ts` | — | A linha antes do cookie: propósito (S20) |
| Tipos de acesso (`http/access.ts:26-44`) | Nova | `platform/access.ts` | — | Origem exata nas escritas: propósito (S24) |
| Limite de tentativas | Nova, nativa | `hub/identity/auth.ts` | — | O Hub antigo não tinha |
| Primeira pessoa (`admission.ts:406`, `sign-in.ts:82-91`) | Nova | `hub/identity/first-person.ts` | — | Um link de uso único (0016): decidido antes, mantido pelo propósito, sem cadastro aberto |
| Telas (tema do Keycloak, `app/shell.tsx`) | Nova | `routes/`, `hub/identity/`, `ui/frame.tsx` | — | Coluna centrada sob a marca: aparência aprovada (estudo da interface, 9b) |

O que cada parte deixa do antigo: a sessão, o resumo do token (a garantia 1 vem do segredo que a
assinatura do cookie exige, prova P3 do estudo), a reconferência com o Keycloak, a recusa da pessoa
desativada (etapa 6) e o faxineiro de cinco minutos (o banco precisa dormir); cookie e acesso, o
lado dos apps e da Prévia (etapas 8 e 18) e o retorno do OIDC; a primeira pessoa, o sujeito do
Keycloak e o administrador da instalação, que espera a decisão 5 e o seu primeiro leitor (D18).

**A medida do transplante.** Nenhuma parte é trazida.

**A dívida.** Linhas vencidas de `auth.session` e `auth.verification` só saem quando apresentadas.
`createUser` e `findCredentialAccount` são chamadas internas da biblioteca, sem chamada pública com o
cadastro fechado; a versão fica fixa e os critérios 21 e 22 as cobrem.

## U1 Tabelas

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/tables.ts`, `tables.test.ts` | Cria | `drizzle.config.ts` (`./src/**/tables.ts`); `auth.ts` |
| `apps/server/migrations/<data>_identity_tables/` | Cria (gerada) | `migrate` |

### Os contratos que a unidade cria

Esquema `auth`: os campos dos modelos `user`, `session`, `account`, `verification` e `rateLimit` de
`@better-auth/core@1.7.8` (`db/get-tables`), em `snake_case`, datas `timestamptz`, `token` e `email`
e `key` únicos, `session.user_id` e `account.user_id` com chave para `user` em cascata. Chaves de
objeto do Drizzle com os nomes de campo da biblioteca; a tabela do limite se chama `rate_limit`.

### A ordem do trabalho

1. As tabelas e a migração gerada, lida antes de aplicar. Regras: D4, D5, D6, D8, D15. Funções:
   `drizzle-orm@1.0.0-rc.4`: `pgSchema`.

### Como se prova

Critério 1: `npm test -w @conexus/server`.

## U2 Concessões

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/migrations/<data>_identity_grants/migration.sql` | Cria (SQL à mão) | `migrate` |
| `apps/server/database-grants.sql` | Muda | `platform/catalog.test.ts` |
| `apps/server/src/platform/catalog.test.ts` | Muda | CI |

### Os contratos que a unidade cria

`hub_runtime`: `USAGE` em `auth`; `SELECT, INSERT, UPDATE` em `auth.user` e `auth.account`;
`SELECT, INSERT, UPDATE, DELETE` em `auth.session`, `auth.verification`, `auth.rate_limit`.

### A ordem do trabalho

1. A migração com o comentário do porquê, o arquivo aprovado e os casos plantados, num pull request
   só dele, com a palavra do fundador desta página. Regras: D5, D10, D11, D12.

### Como se prova

Critério 2.

## U3 Acesso

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/{access,http,config,database}.ts` e os testes ao lado | Muda | `main.ts`, `migrate.ts`, `hub/status/*` |
| `apps/server/src/platform/test-database.ts` | Muda | os testes de servidor |
| `apps/server/src/main.ts`, `main.test.ts`, `boot.test.ts` | Muda | a imagem, CI |
| `packages/hub-api/src/{operation,failures}.ts` | Muda | servidor, web |
| `infra/compose.yaml`, `infra/deploy.sh`, `scripts/deploy.test.ts` | Muda | publicar, voltar atrás, reiniciar |

### Os contratos que a unidade cria

- `AccessKind`: `'page' | 'public' | 'entry' | 'session'`. `entry`: escrita sem sessão; `session`:
  a sessão lida pela porta abaixo. Escritas dos dois: `Origin` igual a `publicOrigin`,
  `Sec-Fetch-Site` `same-origin` ou ausente, `content-type` `application/json`; `entry` exige
  `cf-connecting-ip`.
- `Operation`: `method` com `PUT` e `DELETE`; `success.status`: `200 | 204`; `input.body` opcional,
  um esquema Zod.
- `type SessionReader = (request: { headers: Headers }) => Promise<{ kind: 'SIGNED_IN'; person:
  Person; setCookie: readonly string[] } | { kind: 'SIGNED_OUT' }>`, entregue por `main.ts` (C7).
- `Config`: `publicOrigin: PublicOrigin` (`HUB_PUBLIC_ORIGIN`), `sessionSecret: SessionSecret`
  (`HUB_SESSION_SECRET_FILE`, classe com `#value`, C17).
- `Database`: `libraryOrm()`, o Drizzle sobre o mesmo pool, só para o adaptador da biblioteca (D19).
  As linhas que a biblioteca lê não passam por D21: a biblioteca as confere.
- Compose: o segredo `hub_session_secret` em `/etc/conexus/secrets` e as duas variáveis.
- Falhas: `REQUEST_ORIGIN_REFUSED` 403, `REQUEST_MEDIA_TYPE_REFUSED` 415, `REQUEST_TOO_LARGE` 413.

### A ordem do trabalho

1. Os tipos em `onRequest`. Regras: C33, C34, S24, S25. Funções: `fastify@5.12.5`:
   `addHook('onRequest')`.
2. `serve` com corpo, 204 e cabeçalhos; 400, 413 e 415 pelo código do erro do Fastify. Regras: C27,
   C31, C43, C50, C52, S27.
3. As variáveis no leitor único, Compose e `deploy.sh`. Regras: C67, S31, S37.

### Como se prova

Critérios 3 a 7, com `app.inject`, status e corpo literais.

## U4 Identidade

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/{public,auth,routes,session}.ts`, `identity.test.ts` | Cria | `main.ts` |
| `apps/server/src/main.ts`, `main.test.ts` | Muda | a imagem |
| `packages/hub-api/src/identity.ts`, `index.ts`, `failures.ts` | Cria / muda | servidor, web |
| `apps/server/package.json`, `package-lock.json` | Muda | npm, CI |
| `docs/reference/boundaries.md`, `docs/index.md` | Cria / muda | C75; `check-docs` |

### Os contratos que a unidade cria

- `createSession`: `PUT /api/sessions/current`, `entry`, corpo `{ email: Email; password: string }`
  (1 a 128), 4 KiB; 200 `{ person: Person }`; falhas `SIGN_IN_REFUSED` 401,
  `SIGN_IN_ATTEMPTS_EXCEEDED` 429, `DATABASE_UNAVAILABLE` 503. `PUT` porque põe a sessão atual
  deste navegador: repetido, deixa um só cookie válido, e a linha anterior vence sozinha; não cria
  recurso da pessoa, então C37 e o 201 de C43 não se aplicam.
- `getSession`: `GET /api/sessions/current`, `session`; 200 `{ person: Person }`; `SESSION_REQUIRED`
  401.
- `deleteSession`: `DELETE /api/sessions/current`, `session`; 204; `SESSION_REQUIRED` 401,
  `DATABASE_UNAVAILABLE` 503.
- `Person`: `{ id: PersonId; name: string; email: Email }`, com marca.
- Falhas: `SIGN_IN_REFUSED` 401 "E-mail ou senha não conferem."; `SIGN_IN_ATTEMPTS_EXCEEDED` 429
  "Muitas tentativas de entrada deste endereço." / "Espere um minuto e tente de novo.";
  `SESSION_REQUIRED` 401 "Sua sessão terminou." / "Entre de novo para continuar.".
- `createIdentity(deps: { orm; config; log }): Readonly<{ readSession: SessionReader; routes;
  firstPerson }>` em `public.ts`.

### A ordem do trabalho

1. `auth.ts`: `betterAuth` com `basePath: '/api/auth'`, `baseURL` de `publicOrigin`, `secret`,
   `emailAndPassword` (`enabled`, `disableSignUp: true`), `session` (`expiresIn` 1800, `updateAge`
   60, `cookieCache.enabled: false`), `verification.storeIdentifier: 'hashed'`, `rateLimit`
   (`enabled: true`, `storage: 'database'`, `customRules['/sign-in/email']` 10 em 60 s), `advanced`
   (`useSecureCookies: false`; `cookies.session_token`, `session_data` e `dont_remember` com nome
   `__Host-conexus_*` e `secure: true`; `ipAddress.ipAddressHeaders: ['cf-connecting-ip']`),
   `telemetry.enabled: false`, `logger.log` que escreve só um código, sem `logger.level`. Regras:
   C75, S17, S23, S28, S30, S41. Funções: `better-auth@1.7.8`; `@better-auth/drizzle-adapter@1.7.8`:
   `drizzleAdapter(orm, { provider: 'pg', schema })`.
2. `routes.ts`: entrar passa o pedido a `auth.handler` em `/sign-in/email`, onde o limite roda; lê
   status e `getSetCookie()`; responde pelo contrato (C31); 401 e 429 viram as falhas acima pelo
   status (C52). Regras: C14, C28, C29.
3. `session.ts`: `auth.api.getSession` com `disableCookieCache` e `returnHeaders`, e uma leitura que
   confere pelo `now()` do banco `expires_at` e `created_at` mais 8 h; fora, `auth.api.revokeSession`
   e `SIGNED_OUT`. Regras: S18, S19, D23.
4. Sair: `auth.api.revokeSession`, que falha alto, e só então a saída nativa, que expira os cookies.
   Regras: S20, C53.
5. `docs/reference/boundaries.md` com as duas peças feitas à mão e a linha da biblioteca
   (`api/routes/session.mjs:180`, `api/routes/sign-out.mjs:49-54`). Regra: C75.

### Como se prova

Critérios 8 a 20; os critérios 14 e 17 também por remoção (T12).

## U5 Primeira pessoa

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/first-person.ts`, `first-person.test.ts`, `routes.ts` | Cria / muda | `main.ts` |
| `apps/server/src/main.ts` | Muda | Compose |
| `packages/hub-api/src/identity.ts`, `failures.ts` | Muda | servidor, web |
| `.github/workflows/first-person.yml` | Cria | o fundador |
| `docs/how-to/hub-server.md`, `docs/how-to/hub-database-restore.md` | Muda | Firstmate, fundador |

### Os contratos que a unidade cria

- `setPassword`: `PUT /api/passwords`, `entry`, corpo `{ token: string; password: string }` (8 a
  128); 204; `PASSWORD_LINK_INVALID` 422 "Este link já foi usado ou venceu.", `PASSWORD_TOO_SHORT`
  422.
- `node apps/server/src/main.ts first-person --name <nome> --email <e-mail> --summary <arquivo>`:
  sai com 0 e o link no arquivo, ou com 1 e `FIRST_PERSON_EXISTS`.

### A ordem do trabalho

1. `first-person.ts`: sem pessoa com senha, `internalAdapter.createUser` (ou a pessoa sem senha que
   já existe) e `auth.api.requestPasswordReset`, com `sendResetPassword` que entrega o link a este
   processo; 15 minutos; o link vai ao arquivo, nunca a um registro. Regras: C64, S12, S35, S41.
2. `setPassword` por `auth.handler` em `/reset-password`. Regras: C28, C52.
3. A ação pelo runner do servidor, como "Reiniciar o Hub", com o resumo em `$GITHUB_STEP_SUMMARY`.
4. Os procedimentos: gravar o segredo; restaurar troca o segredo, o que encerra toda sessão (S46).

### Como se prova

Critérios 21 e 22.

## U6 Telas

O estudo da interface (2026-10-14), seção 17, dá as telas, estados e textos, com as respostas do
fundador. Correção a ele: as operações vivem em `packages/hub-api`, a tela as chama por
`platform/hub.ts`, e `platform/auth.ts` e `useSession` não existem (C26, C28). As mudanças de guia
do estudo (G1 a G17) estão **pendentes**: vão num pull request só de documentos que entra no `main`
antes deste cartão (escolha do fundador, 2026-10-14). U6 segue W1 como esse pull request a deixar;
se ele não entrar, U6 para (L7).

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/vite.config.ts`, `apps/web/package.json`, `package-lock.json` | Muda | Vite, npm |
| `apps/web/src/main.tsx`, `routeTree.gen.ts` | Muda / cria (gerado) | `index.html` |
| `apps/web/src/routes/{__root,_public/route,_public/sign-in,_public/set-password,_app/route,_app/index}.tsx`, `__root.test.tsx`, `_app/route.test.tsx` | Cria | `routeTree.gen.ts` |
| `apps/web/src/ui/{cn.ts,button,input,label,field,form,dropdown-menu,avatar,sheet,states,frame}.tsx` | Cria | rotas, `hub/identity` |
| `apps/web/src/platform/{jitless,hub,cache,theme}.ts`, `cache.test.tsx` | Cria / muda | `main.tsx`, `queries.ts` |
| `apps/web/src/hub/identity/{queries.ts,sign-in-form,set-password-form,account-menu}.tsx`, `public.ts` e testes | Cria | rotas |
| `apps/web/src/hub/status/*` | Muda | `_app/index.tsx` |
| `.dependency-cruiser.cjs`, `biome.json`, `knip.json` | Muda | `deps`, `lint`, `knip` |

### A ordem do trabalho

1. Rotas, guarda e páginas do roteador; peças de `ui/`; regras do cache; formulários. Regras: W1 a
   W27, V38 a V43. Funções: as do estudo da interface, U1 a U4.

### Como se prova

Critérios 23 a 27: `npm test -w @conexus/web`.

## U7 Ao vivo

Depois da publicação: critérios 28 a 30, e o resultado de LT16 no registro 0013. O teste do banco
dormindo não roda de novo: nada nesta etapa roda sozinho (prova P13 do estudo).
