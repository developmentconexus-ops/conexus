# Etapa 3: Entrar

## A página do fundador

**No fim desta etapa** você cria a sua senha por um link de uso único, entra no Hub com e-mail e
senha, vê o Hub recusar tentativas demais, e sai.

**O roteiro de uso.**

1. No GitHub, em Actions, rode "Criar a primeira pessoa" com o seu nome e e-mail. A execução
   mostra um link para o Hub que vale 15 minutos e uma vez só.
2. Abra o link: a página "Criar sua senha". Escolha uma senha de pelo menos 8 caracteres. Aparece
   a página "Entrar no Conexus".
3. Entre com o e-mail e a senha. Aparece a moldura do Hub, com "Você entrou como {seu nome}." e a
   versão do Hub. Abra o link do passo 1 de novo: "Este link já foi usado ou venceu."
4. Saia pelo menu da conta, "Sair do Conexus". Volta a página "Entrar", com "Você saiu do
   Conexus." O botão "voltar" do navegador não abre a moldura.
5. Digite uma senha errada 11 vezes seguidas. A 11ª mostra "Muitas tentativas de entrada deste
   endereço. Espere um minuto e tente de novo.", mesmo com a senha certa. Depois de um minuto,
   entre.
6. Rode "Criar a primeira pessoa" de novo: termina vermelha, com "Já existe uma pessoa nesta
   instalação."

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página e responde as perguntas
abaixo. Depois do merge, o Firstmate grava o segredo das sessões no servidor, como gravou as chaves
do banco, e confere a entrada pelo Tunnel. No fim: faz o roteiro e diz o que viu.

**Fica de fora.** Empresas, convites e o e-mail que os envia: etapa 4. "Esqueci a senha", trocar a
senha e desativar uma pessoa: etapa 6. Sair em todos os aparelhos: com a desativação, etapa 6.
Entrar num app: etapa 18. A limpeza diária das sessões vencidas: com o primeiro trabalho agendado;
até lá uma sessão vencida é apagada quando alguém a apresenta, e não vale nada sem o segredo.

**A decisão sua pedida nesta etapa: o administrador da instalação (decisão 5).** Hoje ele mexe
nas conexões de qualquer empresa: você abriria a conexão com o sistema da empresa A e a mudaria.

- **A.** Vira papel só da equipe da plataforma: cria empresas e cuida da instalação; quem cria e
  muda as conexões de uma empresa é o dono ou um administrador dela.
- **B.** Fica como hoje.

Recomendação: **A**. Nesta etapa nada muda na tela: você é criado sem esse papel, e ele entra na
etapa 4 com o seu primeiro uso. **Resposta**: pendente.

**Outras perguntas desta etapa**, levadas pelo Firstmate, cada uma com a recomendação valendo até a
sua resposta: o limite de tentativas (recomendado: por endereço, 10 por minuto, como no passo 5);
como você cria a primeira senha (recomendado: o link do passo 1); quanto tempo a entrada vale
(recomendado: sai depois de 30 minutos sem usar e de 8 horas no total); e as perguntas 1 a 4 do
estudo da interface (endereços em português, "Sair" levando direto a "Entrar", a moldura completa ao
entrar, nenhum "Esqueci a senha" antes da etapa 6). Os textos acima seguem as recomendações.

**A lista de logins do banco**, que a regra dos dados manda passar pela sua palavra: o login do Hub
passa a ler e gravar as tabelas de entrada (pessoas, senhas guardadas como hash, sessões, links de
uso único e contagem de tentativas). Ele pode apagar sessões, links e contagens, e não pode apagar
pessoas nem senhas. Ao aprovar esta página, você aprova essa lista para a etapa inteira.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 Tabelas | O esquema `auth` com as cinco tabelas da biblioteca | `apps/server/src/hub/identity/` (`tables.ts`), `apps/server/migrations/` | dados | `better-auth-best-practices`, `neon:neon-postgres` | — |
| U2 Concessões | O login do Hub nas tabelas de U1, num pull request só dele (D11) | `apps/server/` (`database-grants.sql`), `apps/server/migrations/`, `apps/server/src/platform/` (`catalog.test.ts`) | dados | `neon:neon-postgres` | U1 |
| U3 Acesso | Os tipos de acesso `entry` e `session`, as recusas 400, 413, 415 e de origem, a configuração nova, o banco cedido à biblioteca, o contrato | `apps/server/src/platform/`, `packages/hub-api/` | segurança | `fastify-best-practices` | U1 |
| U4 Identidade | A instância da biblioteca, entrar, ler a sessão, sair, o prazo total, os registros da biblioteca | `apps/server/src/hub/identity/`, `apps/server/src/main.ts`, `packages/hub-api/`, `apps/server/` (raiz) | segurança | `better-auth-best-practices`, `better-auth-security-best-practices`, `email-and-password-best-practices`, `fastify-best-practices` | U2, U3 |
| U5 Primeira pessoa | O comando `first-person`, a operação da senha pelo link, a ação "Criar a primeira pessoa", o segredo no servidor, os procedimentos | `apps/server/src/hub/identity/`, `apps/server/src/main.ts`, `packages/hub-api/`, `infra/`, `.github/workflows/`, `scripts/`, `docs/how-to/` | segurança | `better-auth-best-practices`, `email-and-password-best-practices` | U4 |
| U6 Telas | Rotas por arquivo, "Entrar", "Criar sua senha", a moldura com "Sair", as páginas de espera, falha e endereço desconhecido | `apps/web/`, raiz (`.dependency-cruiser.cjs`, `biome.json`, `knip.json`) | web | `shadcn` | U4, U5 |
| U7 Ao vivo | LT16 pelo Tunnel, o endereço do cliente (S29), o roteiro | nenhuma; o servidor | segurança | nenhuma | U1 a U6 no ar |

U2 e U3 correm em paralelo depois da U1. U4, U5 e U6 seguem nessa ordem: U4 e U5 dividem
`hub/identity/`, e U6 chama as operações de U4 e U5.

## Os critérios de aceite

Os testes de servidor rodam contra a biblioteca de verdade num banco descartável (T16, T19); nenhum
usa um dublê dela.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | O esquema `auth` tem só `user`, `session`, `account`, `verification`, `rate_limit`; nenhuma tabela de empresa, membro, convite ou equipe (LT6) | `hub/identity/identity.test.ts`, "catálogo" | must |
| 2 | U2 | O catálogo depois de `migrate` é igual a `database-grants.sql`; o login do Hub recebe 42501 em `DELETE` de `auth.user` e `auth.account` e em DDL | `platform/catalog.test.ts`, um caso plantado por recusa | must |
| 3 | U3 | Uma rota sem tipo de acesso, ou com tipo desconhecido, impede a subida | `platform/access.test.ts` | must |
| 4 | U3 | Uma escrita `entry` ou `session` sem `Origin`, com `Origin` de outro site ou com `Sec-Fetch-Site: cross-site` recebe 403 `REQUEST_ORIGIN_REFUSED` antes da senha ser lida | `access.test.ts`, por `POST /api/sessions` | must |
| 5 | U3 | `POST /api/sessions` com corpo de formulário, multipart ou `text/plain` recebe 415; JSON inválido, 400 `REQUEST_MALFORMED`; corpo acima do limite, 413 (dívida da seção 11) | `access.test.ts`, um caso por recusa | must |
| 6 | U3 | Uma escrita `entry` sem `cf-connecting-ip` recebe 400 `REQUEST_MALFORMED` | `access.test.ts` | must |
| 7 | U3 | Sem `HUB_PUBLIC_ORIGIN` ou sem o arquivo do segredo, ou com arquivo que outros leem, a subida sai com 1 e `CONFIG_INVALID` com o nome da variável | `boot.test.ts` | must |
| 8 | U4 | Com e-mail e senha certos, `POST /api/sessions` responde 200 com a pessoa (id, nome, e-mail) e um único `Set-Cookie`: `__Host-conexus_session`, `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, sem `Domain` (LT3, LT7 do Hub) | `identity.test.ts`, "entrar", cabeçalho literal | must |
| 9 | U4 | E-mail desconhecido e senha errada recebem o mesmo 401 `SIGN_IN_REFUSED`, com o mesmo corpo | `identity.test.ts` | must |
| 10 | U4 | 10 tentativas de um endereço num minuto; a 11ª recebe 429 `SIGN_IN_ATTEMPTS_EXCEEDED` mesmo com a senha certa; outro endereço entra; a contagem está em `auth.rate_limit` (S30) | `identity.test.ts`, "limite" | must |
| 11 | U4 | `GET /api/sessions/current` com o cookie responde 200 com a pessoa; sem cookie, com o token cru da tabela, ou com assinatura forjada, 401 `SESSION_REQUIRED` (LT15, S16) | `identity.test.ts` | must |
| 12 | U4 | A linha da sessão apagada direto no banco: o pedido seguinte com o mesmo cookie recebe 401 (LT14, S19) | `identity.test.ts` | must |
| 13 | U4 | Uma sessão sem uso há mais que o prazo ocioso recebe 401; uma usada depois de `updateAge` volta com o cookie renovado | `identity.test.ts`, linhas movidas no tempo pelo dono | must |
| 14 | U4 | Uma sessão em uso, criada há mais que o prazo total, recebe 401 e a linha some; sem a verificação do prazo total, o teste falha (T12) | `identity.test.ts`, "prazo total" | must |
| 15 | U4 | Os dois prazos são decididos pelo relógio do banco (S18): com `expires_at` no futuro pelo relógio do processo e no passado pelo do banco, 401 | `identity.test.ts`, "relógio do banco" | must |
| 16 | U4 | `DELETE /api/sessions/current` responde 204, apaga a linha e expira o cookie; o pedido seguinte com o cookie antigo recebe 401 (LT10 do Hub) | `identity.test.ts`, "sair" | must |
| 17 | U4 | Com o `DELETE` da sessão recusado pelo banco, sair responde 503 `DATABASE_UNAVAILABLE`, não expira o cookie e a sessão continua; sem a ordem "apagar a linha, depois expirar", o teste falha (S20) | `identity.test.ts`, concessão retirada no teste | must |
| 18 | U4 | Nenhum caminho da biblioteca fora dos declarados responde: os caminhos de `/api/auth/*` recebem 404, e `signUpEmail` no servidor é recusado (LT17, LT12 do Hub) | `identity.test.ts`, a lista de caminhos da 1.7.8 | must |
| 19 | U4 | Senha errada e e-mail desconhecido não escrevem nada na saída do processo além de uma linha com código e id de rastreio; nenhuma linha traz e-mail (R1, S41, S45) | `identity.test.ts`, saída capturada | must |
| 20 | U4 | Entrar, recusa, limite e sair deixam cada um uma linha com seu código (S45) | `identity.test.ts` | must |
| 21 | U4 | Depois do último pedido, o pool chega a zero conexões (D27) | `identity.test.ts` com `whenIdle()` | must |
| 22 | U5 | `first-person` numa instalação sem pessoa cria a pessoa sem senha e escreve um link de 15 minutos; rodado de novo, sai com 1 e `FIRST_PERSON_EXISTS`, sem link | `hub/identity/first-person.test.ts` | must |
| 23 | U5 | `PUT /api/passwords` com o token do link e uma senha de 8 a 128 caracteres responde 204 e a pessoa entra; o mesmo token de novo, ou vencido, 422 `PASSWORD_LINK_INVALID`; senha curta, 422 `PASSWORD_TOO_SHORT`, e o link continua valendo | `first-person.test.ts` | must |
| 24 | U5 | A tabela `auth.verification` não guarda o token do link, só o seu resumo | `first-person.test.ts` | must |
| 25 | U5 | `deploy.sh` recusa subir sem o arquivo `hub_session_secret`; o contêiner `hub` o monta; um segredo trocado encerra todas as sessões | `scripts/deploy.test.ts`; Firstmate, ao vivo | must |
| 26 | U6 | Sem sessão, `/` leva a "Entrar" sem desenhar a moldura; com sessão, a moldura com o nome; depois de entrar, a pessoa chega à página pedida (sem voltar a "Entrar") | `apps/web/src/routes/_app/route.test.tsx` com MSW | must |
| 27 | U6 | "Entrar": erro de campo em português; recusa 401 no formulário, sem dizer qual campo; 429 com o seu texto; botão desabilitado enquanto envia | `hub/identity/sign-in-form.test.tsx` | must |
| 28 | U6 | "Sair do Conexus" volta a "Entrar" com "Você saiu do Conexus."; um 401 em qualquer leitura leva a "Entrar" com "Sua sessão terminou." | `hub/identity/account-menu.test.tsx`, `platform/cache.test.tsx` | must |
| 29 | U6 | Um endereço desconhecido mostra "Não encontramos o que você procurou."; nenhuma violação de CSP nas páginas da etapa | `routes/__root.test.tsx`; Firstmate no Chromium | must |
| 30 | U7 | Pelo Tunnel: os cookies chegam como no critério 8; `cf-connecting-ip` é o endereço de quem pede; um 429 num endereço não afeta outro (LT16, S29) | Firstmate, ao vivo, antes do roteiro | must |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Sessão do Hub (`hub-session.ts`, `session-core.ts`, `iam.host_session` do tipo `HUB`) | Nova, nativa | `hub/identity/auth.ts` | — | 30 min ociosa e 8 h no total: "implementado assim" (`lifetimes.ts:7`, `:12`); defendida pelo propósito (computador de escritório esquecido aberto) e posta ao fundador. A renovação no máximo uma vez por intervalo: `updateAge` nativo |
| Cookie (`http/cookies.ts:5-17`) | Nova, nativa por configuração | `hub/identity/auth.ts` | — | `__Host-` e atributos: propósito (S17; apps em hosts vizinhos) |
| Prazo total e relógio do banco | Nova | `hub/identity/session.ts` | — | — |
| Sair | Nova, duas chamadas nativas | `hub/identity/routes.ts` | — | A linha apagada antes do cookie: propósito (S20) |
| Tipos de acesso (`http/access.ts:26-44`) | Nova, em arquivo novo existente | `platform/access.ts` | — | Origem exata nas escritas: propósito (S24) |
| Limite de tentativas | Nova, nativa | `hub/identity/auth.ts` | — | O Hub antigo não tinha |
| Primeira pessoa (`admission.ts:406`, `sign-in.ts:82-91`) | Nova | `hub/identity/first-person.ts`, `main.ts` | — | "A primeira pessoa por um link de uso único" (0016): decidido antes, mantido pelo propósito (sem cadastro aberto) |
| Tela de entrar (tema do Keycloak) e moldura (`app/shell.tsx`) | Nova | `routes/_public/`, `hub/identity/`, `ui/frame.tsx` | — | Coluna centrada sob a marca: aparência aprovada pelo fundador (estudo da interface, 9b) |
| Chave de tentativa (`app/attempt-key.ts`, 18 linhas) | Fica para a etapa 4 | — | — | Entrar não cria um recurso da pessoa |

O que cada parte nova deixa do mecanismo antigo, e por quê:

- **Sessão**: o resumo do token (a garantia 1 vem do segredo que a assinatura do cookie exige,
  prova P3 do estudo); a reconferência com o Keycloak; a recusa da pessoa desativada (etapa 6); o
  faxineiro de cinco minutos (o banco precisa dormir).
- **Cookie e acesso**: o lado dos apps e da Prévia (etapas 8 e 18) e o retorno do OIDC.
- **Primeira pessoa**: o sujeito do Keycloak e o administrador da instalação, que espera a decisão
  5 e o seu primeiro leitor (D18).

**A medida do transplante.** Nenhuma parte é trazida.

**A dívida.** Linhas vencidas de `auth.session` e `auth.verification` só saem quando apresentadas,
até o primeiro trabalho agendado. `createUser` é uma chamada interna da biblioteca (sem chamada
pública com cadastro fechado); a versão fica fixa e o teste 22 a cobre.

## U1 Tabelas

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/tables.ts` | Cria | `drizzle.config.ts` (`./src/**/tables.ts`); `auth.ts` |
| `apps/server/migrations/<data>_identity_tables/` | Cria (gerada) | `migrate` |

### Os contratos que a unidade cria

Esquema `auth`, colunas pelo modelo da biblioteca na 1.7.8 (`@better-auth/core` `db/get-tables`):
`user` (`id` text pk, `name`, `email` único, `email_verified` boolean, `image`, `created_at`,
`updated_at`); `session` (`id` pk, `token` único, `expires_at`, `created_at`, `updated_at`,
`ip_address`, `user_agent`, `user_id` fk `user` em cascata); `account` (`id` pk, `account_id`,
`provider_id`, `user_id` fk, os três tokens de provedor e seus prazos, `scope`, `password`,
`created_at`, `updated_at`); `verification` (`id` pk, `identifier`, `value`, `expires_at`,
`created_at`, `updated_at`); `rate_limit` (`id` pk, `key` único, `count` bigint, `last_request`
bigint). Datas `timestamptz`, `NOT NULL` onde a biblioteca exige.

### A ordem do trabalho

1. As tabelas em Drizzle, chaves de objeto com os nomes de campo da biblioteca. Regras: D4, D5,
   D15. Funções: `drizzle-orm@1.0.0-rc.4`: `pgSchema`.
2. A migração gerada, lida antes de aplicar. Regras: D6, D8.

### Como se prova

Critério 1: `npm test -w @conexus/server`, o catálogo lido pelo dono.

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

1. A migração de concessões com o comentário do porquê. Regras: D5, D10, D11, D12.
2. O arquivo aprovado e os casos plantados. Num pull request só dele, com a palavra do fundador
   desta página.

### Como se prova

Critério 2.

## U3 Acesso

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/access.ts`, `access.test.ts` | Muda | `platform/http.ts` |
| `apps/server/src/platform/http.ts` | Muda | `main.ts`, `main.test.ts`, `boot.test.ts` |
| `apps/server/src/platform/config.ts` | Muda | `main.ts`, testes, `test-database.ts` |
| `apps/server/src/platform/database.ts`, `database.test.ts` | Muda | `main.ts`, `migrate.ts`, `hub/status/*` |
| `apps/server/src/boot.test.ts` | Muda | CI |
| `packages/hub-api/src/{operation,failures}.ts` | Muda | servidor, web |

### Os contratos que a unidade cria

- `AccessKind`: `'page' | 'public' | 'entry' | 'session'`. `entry`: escrita sem sessão; `session`:
  qualquer método, com a sessão lida pela porta abaixo; nas escritas, origem e mídia como `entry`.
- `Operation`: `method` inclui `PUT` e `DELETE`; `success.status`: `200 | 204`; `body` opcional
  (`input.body`, um esquema Zod); `headers` de saída de quem responde.
- Porta em `platform/access.ts`: `type SessionReader = (request: { headers: Headers }) =>
  Promise<{ kind: 'SIGNED_IN'; person: Person; setCookie: readonly string[] } | { kind:
  'SIGNED_OUT' }>`, entregue por `main.ts` (C7).
- `Config`: `publicOrigin: PublicOrigin` (de `HUB_PUBLIC_ORIGIN`) e `sessionSecret: SessionSecret`
  (de `HUB_SESSION_SECRET_FILE`, uma classe com `#value`, C17).
- `Database`: `libraryOrm()`, o Drizzle sobre o mesmo pool, só para o adaptador da biblioteca (D19).
- Falhas novas: `REQUEST_ORIGIN_REFUSED` 403, `REQUEST_MEDIA_TYPE_REFUSED` 415, `REQUEST_TOO_LARGE`
  413.

### A ordem do trabalho

1. Os tipos `entry` e `session` em `onRequest`: `Origin` igual a `publicOrigin`, `Sec-Fetch-Site`
   `same-origin` ou ausente, `content-type` `application/json`, `cf-connecting-ip` presente em
   `entry`. Regras: C33, C34, S24, S25. Funções: `fastify@5.12.5`: `addHook('onRequest')`.
2. `serve` com corpo, 204 e cabeçalhos; 400, 413 e 415 pelo código do Fastify, não pela mensagem.
   Regras: C27, C31, C43, C50, C52, S27.
3. As duas variáveis no leitor único. Regras: C67, S31, S33.

### Como se prova

Critérios 3 a 7, com `app.inject` e o status e o corpo literais.

## U4 Identidade

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/{public,auth,routes,session}.ts`, `identity.test.ts` | Cria | `main.ts` |
| `apps/server/src/main.ts`, `main.test.ts` | Muda | a imagem, Compose |
| `packages/hub-api/src/identity.ts`, `index.ts`, `failures.ts` | Cria / muda | servidor, web |
| `apps/server/package.json`, `package-lock.json` | Muda | npm, CI |

### Os contratos que a unidade cria

- `createSession`: `POST /api/sessions`, `entry`, corpo `{ email: Email, password: string }`
  (1 a 128), limite 4 KiB; 200 `{ person: Person }`; falhas `SIGN_IN_REFUSED` 401,
  `SIGN_IN_ATTEMPTS_EXCEEDED` 429, `DATABASE_UNAVAILABLE` 503.
- `getSession`: `GET /api/sessions/current`, `session`; 200 `{ person: Person }`; falha
  `SESSION_REQUIRED` 401.
- `deleteSession`: `DELETE /api/sessions/current`, `session`; 204; falhas `SESSION_REQUIRED` 401,
  `DATABASE_UNAVAILABLE` 503.
- `Person`: `{ id: PersonId; name: string; email: Email }`, `PersonId` e `Email` com marca.
- Falhas novas: `SIGN_IN_REFUSED` 401 "E-mail ou senha não conferem."; `SIGN_IN_ATTEMPTS_EXCEEDED`
  429 "Muitas tentativas de entrada deste endereço." e "Espere um minuto e tente de novo.";
  `SESSION_REQUIRED` 401 "Sua sessão terminou." e "Entre de novo para continuar.".
- `createIdentity(deps: { orm; config; log; clock }): Readonly<{ readSession: SessionReader;
  handler; firstPerson }>` em `public.ts`.

### A ordem do trabalho

1. `auth.ts`: `betterAuth` com `basePath: '/api/auth'`, `baseURL` de `publicOrigin`, `secret`,
   `emailAndPassword` (`enabled`, `disableSignUp: true`), `session` (`expiresIn` 1800,
   `updateAge` 60, `cookieCache.enabled: false`), `verification.storeIdentifier: 'hashed'`,
   `rateLimit` (`enabled: true`, `storage: 'database'`, `customRules['/sign-in/email']` 10 em 60 s),
   `advanced` (`useSecureCookies: false`; `cookies.session_token`, `session_data`, `dont_remember`
   com nome `__Host-conexus_*` e `secure: true`; `ipAddress.ipAddressHeaders:
   ['cf-connecting-ip']`), `telemetry.enabled: false`, `logger.log` que escreve só um código (sem
   `logger.level`). Regras: C75, S17, S23, S28, S30, S41. Funções: `better-auth@1.7.8`,
   `@better-auth/drizzle-adapter@1.7.8`: `drizzleAdapter(orm, { provider: 'pg', schema })`.
2. `routes.ts`: cada operação passa o pedido a `auth.handler` no caminho da biblioteca
   (`/sign-in/email`), lê o status e o `Set-Cookie` com `getSetCookie()`, e responde pelo contrato
   (C31); 401 e 429 da biblioteca viram as falhas acima pelo status (C52). Regras: C14, C28, C29.
3. `session.ts`: `readSession` chama `auth.api.getSession` com `disableCookieCache` e
   `returnHeaders`, e numa leitura confere pelo `now()` do banco `expires_at` e `created_at` mais 8 h;
   fora do prazo, `auth.api.revokeSession` e `SIGNED_OUT`. Regras: S18, S19, D21, D23.
4. Sair: `auth.api.revokeSession`, que falha alto, e só depois a saída nativa, que expira os
   cookies. Regras: S20, C53.
5. `main.ts` monta o módulo e passa `readSession` ao acesso. Regras: C4, C9.

### Como se prova

Critérios 8 a 21: `npm test -w @conexus/server`. Os critérios 14 e 17 também por remoção (T12).

## U5 Primeira pessoa

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/first-person.ts`, `first-person.test.ts` | Cria | `main.ts` |
| `apps/server/src/hub/identity/routes.ts` | Muda | `main.ts` |
| `apps/server/src/main.ts` | Muda | Compose |
| `packages/hub-api/src/identity.ts`, `failures.ts` | Muda | servidor, web |
| `infra/compose.yaml`, `infra/deploy.sh`, `scripts/deploy.test.ts` | Muda | publicar, voltar atrás, reiniciar |
| `.github/workflows/first-person.yml` | Cria | o fundador |
| `docs/how-to/hub-server.md`, `docs/how-to/hub-database-restore.md` | Muda | Firstmate, fundador |

### Os contratos que a unidade cria

- `setPassword`: `PUT /api/passwords`, `entry`, corpo `{ token: string; password: string }` (8 a
  128); 204; falhas `PASSWORD_LINK_INVALID` 422 "Este link já foi usado ou venceu.",
  `PASSWORD_TOO_SHORT` 422.
- Subcomando `node apps/server/src/main.ts first-person --name <nome> --email <e-mail>`: sai com 0
  e o link, ou com 1 e `FIRST_PERSON_EXISTS`.
- Segredo `hub_session_secret` em `/etc/conexus/secrets`, variável `HUB_SESSION_SECRET_FILE`.

### A ordem do trabalho

1. `first-person.ts`: com o banco sem pessoa, `internalAdapter.createUser` sem senha, depois
   `auth.api.requestPasswordReset` com `sendResetPassword` que devolve o link a este processo, 15
   minutos. Regras: C64, S12, S35, S41.
2. `setPassword` por `auth.handler` em `/reset-password`. Regras: C28, C52.
3. A ação "Criar a primeira pessoa" pelo runner do servidor, como "Reiniciar o Hub". Regras: S31,
   S35.
4. Compose monta o segredo; `deploy.sh` recusa sem ele; o procedimento de restauração troca o
   segredo, o que encerra toda sessão (S46).

### Como se prova

Critérios 22 a 25.

## U6 Telas

O estudo da interface (2026-10-14), seção 17, dá as telas, os estados e os textos; esta unidade
segue as suas unidades U1 a U5, com uma correção: as três operações vivem em `packages/hub-api`, a
tela as chama por `platform/hub.ts`, e `platform/auth.ts` e `useSession` não existem (C26, C28).

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/vite.config.ts`, `package.json` | Muda | Vite, npm |
| `apps/web/src/main.tsx`, `routeTree.gen.ts` | Muda / cria (gerado) | `index.html` |
| `apps/web/src/routes/{__root.tsx,_public/route.tsx,_public/entrar.tsx,_public/nova-senha.tsx,_app/route.tsx,_app/index.tsx}` | Cria | `routeTree.gen.ts` |
| `apps/web/src/ui/{cn.ts,button,input,label,field,form,dropdown-menu,avatar,sheet,states,frame}.tsx` | Cria | rotas, `hub/identity` |
| `apps/web/src/platform/{jitless,hub,cache,theme}.ts` | Cria / muda | `main.tsx`, `queries.ts` |
| `apps/web/src/hub/identity/{queries.ts,sign-in-form.tsx,set-password-form.tsx,account-menu.tsx,public.ts}` e testes | Cria | rotas |
| `apps/web/src/hub/status/*` | Muda | `_app/index.tsx` |
| `.dependency-cruiser.cjs`, `biome.json`, `knip.json`, `package-lock.json` | Muda | `deps`, `lint`, `knip`, npm |

### A ordem do trabalho

1. As mudanças de guia G1, G3 a G6, G8 a G10 e G17 do estudo da interface estão **pendentes** na
   fila de método. G1 é necessária: o verificador de W1 recusa `routeTree.gen.ts` hoje. Sem ela no
   `main`, a unidade para (L7).
2. Rotas, guarda e páginas do roteador; peças de `ui/`; regras do cache; formulários. Regras: W1 a
   W27, V38 a V43. Funções: as do estudo da interface, U1 a U4.

### Como se prova

Critérios 26 a 29: `npm test -w @conexus/web`, e o Chromium sem violação de CSP.

## U7 Ao vivo

Depois da publicação: o critério 30 pelo Tunnel, a troca do segredo (critério 25), e o resultado de
LT16 escrito no registro 0013. O teste do banco dormindo não roda de novo: esta etapa não acrescenta
nada que rode sozinho (prova P13 do estudo).
