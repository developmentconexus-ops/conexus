# Etapa 10: Recusar um app

## A página do fundador

**No fim desta etapa** você envia uma versão com defeito e vê o Hub recusá-la, com o motivo, sem
tirar do ar a versão que funciona; e um app que trava é cortado em segundos, sem afetar o resto.

**O roteiro de uso.** No Hub publicado, com a Empresa A e o Projeto Pedidos da 9 na Versão 2, e as
pastas `recados-defeito`, `recados-nao-inicia` e `recados-laco` da página da v0.10.0.

1. Em Pedidos, **Configurações**, **Enviar versão**, escolha `recados-defeito`: a janela diz "O Hub
   recusou esta versão." e a lista, por exemplo "Em `criarRecado`: grava com `db.query`. Grave com
   `db.batch`." A lista de versões não muda; a Versão 2 segue no ar.
2. Envie `recados-nao-inicia`: "Versão 3 · Falhou · O app não inicia". **Abrir app**: o Recados da
   Versão 2, com os recados lá.
3. Envie `recados-laco`: "Versão 4 · no ar"; a Versão 3 sai da lista. Abra o app e clique em
   **Travar**: em cerca de 2 segundos, "O app não conseguiu responder agora." O Hub segue normal.
4. Na Versão 2, **Voltar para esta**: o app funciona, os recados lá.

**O que você faz, e quando.** Antes de U1: autoriza aqui as chamadas da prova, e cria o token da
prova (papel Admin dos Workers) e uma chave de prova do Neon na organização das empresas, apagados
no fim. No fim: o roteiro e os textos. Gasto novo: nenhum.

**As chamadas da prova U1**, todas `cx-prova-`, apagadas no fim. Na Cloudflare: um namespace; um
despachante em `workers.dev` com a chave por `wrangler secret put`; pela API, quatro Workers de app:
um que faz 40 consultas e dois lotes numa chamada (onde a Cloudflare corta, se `subRequests` conta o
`db`, e onde a contagem da chamada vive), um em laço de CPU, um que espera 15 s, e um que falha ao
iniciar (a recusa 10021). No Neon: um projeto pelo SDK em `aws-sa-east-1`, um esquema e dois logins
por SQL; pelo HTTP, uma gravação em `db.query` e dois comandos num texto (as duas recusadas),
`pg_sleep(6)` e um lote de 7 s (cortados em 5 s e 6 s); suspender o computador do projeto pela API
três vezes e medir a primeira consulta.

**Decisões já dadas** (2026-10-18). P1 A: `db.query` só lê, gravar é `db.batch`, um por chamada; a
9 fez a leitura, a 10 conta os lotes. P2 A: a versão que o Hub recusa não é guardada nem
gasta número; a que a Cloudflare recusa a 9 guarda como "Falhou · O app não inicia". P3 A: CPU
50 ms; consultas por chamada pelo limite nativo, se a prova mostrar que ele conta o `db`, senão um
contador, com o número medido; 10 s por chamada; `statement_timeout` 5 s e `transaction_timeout`
6 s no login de execução do app. P4 A, P6 A: na 9. P5 A: o despachante não lê o texto das
instruções; a conferência do envio acusa esses textos quando escritos no código. Motivos A: a
recusa leva a lista na própria resposta.

**O que muda.** A arquitetura §8 perde a leitura do texto no despachante e ganha os números da
prova; sai da §11 o risco "o verificador perde duas gravações": o banco recusa.

**Fica de fora.** A regra S5 (estado no módulo): o pacote montado não a mostra; vai para a 13, no
código que o Builder escreve. Ler as migrações como SQL e recusar a que a versão antiga não aguenta
(a 15). Os limites sob carga (a 22). As issues `next-card` 25, 39 e 45: nada nas pastas da 10.

**A decisão sua pedida nesta etapa.** Nenhuma pendente.

## O que a etapa 9 deixou

Conferido em `main` (`20dc31e`), com 0045 e 0046:

H1 `db.query` vai por `transaction([q], {readOnly: true})` e `db.batch` por uma `transaction`
(`apps/edge/src/db.ts`); cada pedido ao Neon tem prazo próprio de 10 s, não a chamada. H2 o `Db`
do despachante é um `WorkerEntrypoint` refeito a cada chamada a ele (0045): a contagem por chamada
do app não cabe nele, e nenhum lote é contado ainda. H3 o envio sobe o Worker primeiro, e 10021 já
vira "falhou" com `APP_VERSION_NOT_STARTING`, 422, antes do banco da empresa (0046, `send.ts`); a
prova pela API de WfP ficou "Not covered". H4 `APP_CPU_MS` 50 em `send.ts`, `statement_timeout`
`'5s'` em `company-postgres.ts`, `QUERY_DEADLINE_MS` em `db.ts`: três números fora de
`app-contract/src/limits.ts`, onde `APP_LIMITS` é só o teto do envio. H5 `sendVersion` lê o
manifesto (`receiveVersion`) e depois abre a transação 1 com `storeAppVersion`. H6 `Failure` leva
só `details` de registro; `problemOf` (`platform/http.ts`) monta o `Problem` só com o código. H7
`app:pack` e `publish.yml` montam e põem no Release só `recados-1` e `recados-2`. H8 a janela de
envio e a lista de versões (`apps/web/src/hub/apps/`) leem os textos pelo código.

A etapa 9.1, em escrita, muda a passagem para o app e os nomes dos projetos Neon; esta etapa não
toca nenhum dos dois.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | Registro e prova | `docs/` | testes | cloudflare:wrangler, neon:neon-postgres | — |
| U2 | Limites da chamada | `apps/edge/`, `app-contract/src/limits.ts` | segurança | cloudflare:workers-best-practices | U1 |
| U3 | Conferência do envio | `app-contract` | dados | — | — |
| U4 | O envio recusa | servidor, `hub-api` | dados | fastify-best-practices, neon:neon-postgres | U2, U3 |
| U5 | Telas | web | web | shadcn | contrato de U4 |
| U6 | Apps de defeito, Release, percurso | `tests/apps/`, `scripts/`, `.github/`, `tests/e2e/` | testes | cloudflare:wrangler | U2, U4, U5 |

U2 e U3 juntas: U2 muda só `limits.ts` em `app-contract`, U3 cria `verify.ts`. Uma revisão, um
merge (L9, L13); a prova não cria release (L17).

**Orçamento de código alterado** (sem testes nem gerados): U2 130; U3 150; U4 90; U5 60; U6 80;
espalhados 40. Total **550**, teto 4.000 (L2).

## Os critérios de aceite

| # | Unidade | Critério observável, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Registro "proposed" antes da prova; Result com versões, o número de consultas, onde a contagem vive, os tempos do banco acordando; nada `cx-prova-` vivo | os registros | must |
| 2 | U2 | Numa chamada do app, o segundo `db.batch`: `DB_SECOND_BATCH`, sem rede, o primeiro gravado; na chamada seguinte, um lote passa | `dispatcher.test.ts`, app dublê | must |
| 3 | U2 | Numa chamada, a consulta N (`queriesPerCall`) passa e a N+1 é recusada: pelo limite nativo, a página `EDGE_APP_FAILED`; pelo contador, `DB_QUERY_LIMIT` ao app, sem rede | idem | must |
| 4 | U2 | App que espera: aos 10 s, a página `EDGE_APP_FAILED`, registro `EDGE_APP_DEADLINE`; `db` chamado depois do prazo: `DB_DEADLINE`, sem rede; o `ctx.props` do app não traz prazo nem contagem | idem | must |
| 5 | U2 | Os números vêm só de `APP_CALL_LIMITS`: o upload leva `cpuMs`, o login `statementTimeoutMs`, o `db` o prazo | `removals` | must |
| 6 | U3 | Acusa, com código, operação e linha: texto literal que grava em `query`; dois `batch` numa função; `statement_timeout`, `set_config`, `ALTER ROLE`, `DO $$` no texto. O Recados passa. Gravação montada em execução passa (o banco recusa) | `verify.test.ts` | must |
| 7 | U3 | `worker.js` sem sintaxe válida: um motivo, sem exceção; o maior `worker.js` do teto do envio: conferido dentro de `SEND_CLAIM_MS`, o tempo só registrado | idem | must |
| 8 | U4 | `createAppVersion` com `recados-defeito`: 422 `APP_VERSION_REFUSED` e `reasons`; nenhuma linha, nenhum `blob`, nenhuma chamada fora; o próximo envio certo leva o número seguinte ao último guardado | `versions.test.ts` | must |
| 9 | U4 | Outra falha qualquer: o `Problem` sem `reasons` | `http.test.ts` | must |
| 10 | U4 | Login de execução com `statement_timeout` 5 s e `transaction_timeout` 6 s, também o da 9 depois do reparo; `pg_sleep(6)` por ele: 57014 | `app-database.test.ts`, `repair.test.ts` | must |
| 11 | U5 | Cada célula da matriz; T23 | navegador | must |
| 12 | U6 | Cada linha nova de `removals.json`: `caught` | `removals` | must |
| 13 | U6 | O roteiro, Hub real, dublês | `tests/e2e/refusals.test.ts` | must |
| 14 | U6 | Publicado: passos 1 a 4; durante o laço, outro Projeto abre o seu app | firstmate (T13, T14) | must |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido, recusado ou concorrência |
| --- | --- | --- | --- | --- | --- |
| Enviar versão | a da 9 | "Conferindo e enviando a versão…" | as da 9 | `NotFound` | 422 `APP_VERSION_REFUSED`: frase, ação e um item por motivo; as da 9 |
| Versões | a da 9 | a da 9 | a da 9 | a da 9 | a da 9, com "Falhou · O app não inicia" |
| App | o exemplo | — | laço, prazo, consultas, segundo lote: a página `EDGE_APP_FAILED` da 8, ou o código ao app | a da 8 | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `VerifyReason {code, operation, line}` | `verifyAppVersion` | envio, janela de envio |
| `Problem.reasons`, só no 422 `APP_VERSION_REFUSED` | `problemOf` | janela de envio |
| `APP_CALL_LIMITS` `cpuMs`, `queriesPerCall`, `callDeadlineMs`, `statementTimeoutMs`, `transactionTimeoutMs` | `app-contract`, números do registro | envio, `CompanyPostgres`, despachante |
| A contagem e o prazo de uma chamada | despachante, onde o registro disser | o `db` da chamada |

Falha nova (C48), USER, settles: `APP_VERSION_REFUSED` 422, "O Hub recusou esta versão." /
"Corrija o que está listado e envie de novo." Motivos, com `{operação}` quando achada:
`WRITE_IN_QUERY` "Em `{operação}`: grava com `db.query`. Grave com `db.batch`."; `TWO_BATCHES` "Em
`{operação}`: dois lotes separados. Junte num `db.batch`."; `DATABASE_SETTING` "Em `{operação}`:
muda uma configuração do banco."; `UNREADABLE` "O `worker.js` não é JavaScript válido." Códigos do
`db` e do despachante: `DB_SECOND_BATCH`, `DB_QUERY_LIMIT`, `DB_DEADLINE`, `EDGE_APP_DEADLINE`.

`Problem.reasons` é um membro de extensão do RFC 9457, só `code`, `operation` e `line` do app de
quem envia: exceção escrita à C51, limitada a esses três campos, levada ao fechamento (L20).
Fundador, 2026-10-18: "A".

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Dependência fora | O que imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Conferência do envio | pura; a mesma resposta | nada gravado | nenhuma | `APP_VERSION_REFUSED` | 6–8 |
| `ALTER ROLE … SET transaction_timeout`, no comando de login da 9 | repetível | o reparo refaz | Neon: 502 da 9 | `APP_DATABASE_READY` | 10 |
| Contagem e prazo da chamada | por chamada | o lote já enviado termina ou cai inteiro pelo banco (6 s); quem chama vê a página | Neon: o código | `DB_SECOND_BATCH`, `DB_QUERY_LIMIT`, `DB_DEADLINE` | 2–4 |
| Prazo no despachante | por chamada | a página aos 10 s | nenhuma | `EDGE_APP_DEADLINE` | 4 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Limites da chamada | nova | `apps/edge/src/db.ts`, `dispatch.ts`, `dispatcher.ts` | — | PostgREST, transação por pedido; Budibase, prazo por chamada |
| Conferência do envio | nova | `app-contract/src/verify.ts` | — | nenhuma |
| Recusa no envio | nova | `hub/apps/send.ts` | — | — |
| Limites do login | nova | `platform/company-postgres.ts` | — | nomes de `data-plane.ts:89-90` (`e0353c36`) como especificação |
| Telas | nova | `web/src/hub/apps/send-version.tsx` | — | — |
| Leitura do texto no despachante | sai (P5 A) | — | — | arquitetura §8 |

**A medida do transplante.** Nada é trazido. O verificador antigo (`builder/check/`, 1.402 linhas
em `e0353c36`) conferia tipos, montagem, imports e partida, que são do Builder (13 e 14); não tinha
2A, laço nem consultas.

**A dívida.** S5 sem conferência até a 13; D29 sem leitura das migrações até a 15. No fechamento
(L20): D28 sem `[verifier]` como garantia, S5 e D29 com a etapa que as confere, a exceção à C51.

## U1 Registro e prova

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/decisions/0047-…`, `index.md` | cria o registro dos limites da chamada | U2, U4 |
| `architecture.md` §8, §11 | a tabela do caminho dos dados; o risco do verificador sai | `check-docs` |

### Os contratos que a unidade cria

O registro 0047: os números de `APP_CALL_LIMITS` e onde vivem a contagem e o prazo de uma
chamada. Criterion: (1) `INSERT` em `transaction([q], {readOnly: true})` pelo HTTP do Neon: 25006
(0045 deixou para a 10); (2) `SET TRANSACTION READ WRITE; INSERT` num texto: recusado; (3) se as
chamadas ao `db` contam em `limits.subRequests` do `DISPATCHER.get` e no teto de 32 invocações, e em
quantas o app é cortado; (4) onde uma contagem sobrevive entre duas chamadas ao `db` da mesma
chamada do app: primeiro um `RpcTarget` feito pelo despachante para essa chamada e passado em
`props` no lugar do stub da 9; (5) o que o despachante recebe quando a CPU estoura; (6)
`statement_timeout` e `transaction_timeout` do login valem pelo HTTP, com os códigos; (7) o upload
de um Worker que falha ao iniciar, num nome novo pela API de WfP: 10021 (0046 deixou "Not
covered"); (8) a primeira consulta depois de suspender o computador, três vezes, em ms. Se (2)
passar ou (4) não achar lugar, P1 volta ao fundador; se (5) não cortar o laço, se (6) não valer pelo
HTTP, ou se (8) chegar ao prazo de 10 s, P3 volta.

### A ordem do trabalho

PR só de documentos (L13). O Result fixa `wrangler` e `@neondatabase/serverless` como em 0043.
Regras: L13, L21, T13, T14.

### Como se prova

1: os registros.

## U2 Os limites da chamada

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/edge/src/` | `db.ts`, `dispatch.ts`, `dispatcher.ts`, `pages.ts` | o runner |
| `packages/app-contract/src/limits.ts` | `APP_CALL_LIMITS` | edge, servidor |
| `apps/server/src/hub/apps/send.ts`, `platform/company-postgres.ts` | `APP_CPU_MS` e `'5s'` saem, lidos de `APP_CALL_LIMITS` | `main.ts` |
| `scripts/removals.json` | `edge-second-batch`, `edge-query-limit`, `edge-call-deadline` | `npm run removals` |

### Os contratos que a unidade cria

`APP_CALL_LIMITS = {cpuMs: 50, queriesPerCall, callDeadlineMs: 10_000, statementTimeoutMs: 5_000,
transactionTimeoutMs: 6_000}`, `queriesPerCall` do registro. O `db` de `AppProps` continua do tipo
`Db`; o que o despachante passa é o lugar que o registro escolher (U1 (4)). Pelo limite nativo:
`DISPATCHER.get(nome, {props}, {outbound, limits: {subRequests: queriesPerCall}})`; senão a mesma
contagem dos lotes conta as consultas.

### A ordem do trabalho

1. O despachante marca o prazo da chamada e corre a resposta do app contra ele; vencido, a página
   `EDGE_APP_FAILED` e o registro `EDGE_APP_DEADLINE`. Regras: C50, C57, C73.
2. O `db` da chamada conta lotes e consultas e recusa sem rede depois do prazo; o sinal dado ao
   driver termina no prazo da chamada, no lugar do `QUERY_DEADLINE_MS` por pedido. Regras: C26,
   C27, C57, S4. Funções: `@neondatabase/serverless` de 0043, `transaction(queries, {readOnly})`,
   `neon(url, {fetchOptions})`; `AbortSignal.timeout`; `RpcTarget` de `cloudflare:workers`, se U1
   (4).
3. Os três números de H4 passam a ler `APP_CALL_LIMITS` (C26, C75).

### Como se prova

2–5: `npm run test -w @conexus/edge`, relógio controlado, app dublê; `npm run removals`.

## U3 A conferência do envio

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/app-contract/src/` | cria `verify.ts` | servidor; o Builder na 13 |
| `app-contract/package.json`, lock, `.dependency-cruiser.cjs` | `acorn`, `acorn-walk` de produção, só em `verify.ts`; entrada `./verify` | CI (L16) |

### Os contratos que a unidade cria

`verifyAppVersion({manifest, workerJs}): VerifyReason[]`, pura, na entrada
`@conexus/app-contract/verify`, para o app empacotado não levar o analisador.
`VerifyReason = {code: 'WRITE_IN_QUERY' | 'TWO_BATCHES' | 'DATABASE_SETTING' | 'UNREADABLE',
operation: string | null, line: number}`; `operation` é a chave da operação do manifesto que contém
a chamada, ou `null`.

### A ordem do trabalho

Lê só o `worker.js`; acusa só o texto escrito, e a gravação montada fica para o banco (0045).
Primeiro confere que o `worker.js` do `app:pack` mantém `.query(` e `.batch(`. Regras: C21, C26,
C48, D28, S15. Funções: acorn 8.18.0 `parse` (`ecmaVersion: 'latest'`, `sourceType: 'module'`,
`locations: true`); acorn-walk 8.3.5 `ancestor`.

### Como se prova

6, 7: `npm run test -w @conexus/app-contract`, com os apps de defeito.

## U4 O envio recusa

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/` | `app-failures.ts`: a falha e os textos dos motivos; `failures.ts`: `Problem.reasons` | servidor, web |
| `hub/apps/send.ts` | conferência entre `receiveVersion` e a transação 1 | rotas |
| `platform/failure.ts`, `http.ts` | `Failure` leva `reasons`; `problemOf` as copia só para `APP_VERSION_REFUSED` | todo o servidor |
| `platform/company-postgres.ts` | `transaction_timeout` no comando de login | `main.ts`, reparo |
| `scripts/removals.json` | `send-verify-before-store`, `run-login-timeouts` | `npm run removals` |

### Os contratos que a unidade cria

`createAppVersion` ganha 422 `APP_VERSION_REFUSED` com `reasons: VerifyReason[]`. `sendVersion`
lança `Failure('APP_VERSION_REFUSED', {reasons})`, a mesma recusa que a porta do Builder recebe na
14.

### A ordem do trabalho

1. Depois de `receiveVersion`, antes da transação 1: `verifyAppVersion`; com motivos, a recusa,
   sem gravar (P2 A). Regras: C27, C48, C49, C51 com a exceção, D22.
2. O comando de login da 9 põe os dois prazos de `APP_CALL_LIMITS`; o reparo o repete. Regras: D20,
   D25. Funções: `ALTER ROLE … SET`.

### Como se prova

8–10: `npm run test -w @conexus/server`, o PostgreSQL de teste, Cloudflare dublê (T5, T10, T14).

## U5 As telas

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/apps/` | `send-version.tsx` | rotas |
| `platform/test-hub.tsx` | respostas novas | testes |

### A ordem do trabalho

Os motivos em lista, o texto pelo código; "Conferindo e enviando a versão…". Regras: W1, W8–W13,
V29, V35.

### Como se prova

11: `npm run test -w @conexus/web`; navegador em 1366, 390 e 320 px, dois temas, teclado (T23).

## U6 Apps de defeito, Release e percurso

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `tests/apps/` | `recados-defeito`, `recados-nao-inicia`, `recados-laco` | `app:pack`, testes |
| `package.json` (`app:pack`, `e2e`), `publish.yml` | montar e pôr no Release os três zips | Release |
| `tests/e2e/` | `refusals.test.ts` | `npm run e2e` |

### Como se prova

12, 13: `npm run removals`, `npm run e2e`; 14 após o Release, pelo firstmate. Regras: T12–T14.
