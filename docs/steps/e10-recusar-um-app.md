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
no fim, como na 9. No fim: o roteiro e os textos. Gasto novo: nenhum.

**As chamadas da prova U1**, todas `cx-prova-`, apagadas no fim. Na Cloudflare: um namespace; um
despachante em `workers.dev` com a chave por `wrangler secret put`; pela API, quatro Workers de app:
um que faz 40 consultas numa chamada (onde a Cloudflare corta, e se o limite nativo `subRequests`
conta o `db`), um em laço de CPU, um que espera 15 s, e um que falha ao iniciar (a recusa 10021).
No Neon: um projeto pelo SDK em `aws-sa-east-1`, um esquema e dois
logins por SQL; pelo HTTP, uma gravação em `db.query` e dois comandos num texto (as duas recusadas),
`pg_sleep(6)` e um lote de 7 s (cortados em 5 s e 6 s); suspender o computador do projeto pela API
três vezes e medir a primeira consulta. O que a 9 já tiver provado sobre `db.query` não se repete.

**Decisões já dadas** (2026-10-18). P1 A: `db.query` só lê, gravar é `db.batch`, um por chamada;
entra na construção da 9, e esta etapa constrói em cima. P2 A: a versão que o Hub recusa não é
guardada nem gasta número; a que a Cloudflare recusa é guardada como "Falhou · O app não inicia".
P3 A: CPU 50 ms; consultas por chamada pelo limite nativo, se a prova mostrar que ele conta o `db`,
senão um contador, com o número medido; 10 s por chamada; `statement_timeout` 5 s e
`transaction_timeout` 6 s no login de execução do app. P4 A e P6 A: na 9. P5 A: o despachante não
lê o texto das instruções; a conferência do envio acusa esses textos quando escritos no código.

**O que muda.** A arquitetura §8 perde a leitura do texto no despachante e ganha os números da
prova; sai da §11 o risco "o verificador perde duas gravações": o banco recusa.

**Fica de fora.** A regra S5 (estado no módulo): o pacote montado não a mostra; vai para a 13, no
código que o Builder escreve. Ler as migrações como SQL e recusar a que a versão antiga não aguenta
(a 15). Os limites sob carga (a 22). As issues `next-card` 25, 39 e 45: nada nas pastas da 10.

**A decisão sua pedida nesta etapa.** Nenhuma pendente.

## Encaixes da etapa 9

A 9 está em construção. O cartão supõe estes encaixes, conferidos quando ela entrar em `main`; se
um faltar, a construção para (L7):

G1 `Db` é um objeto por chamada (`ctx.exports.Db({props})`) e conta os lotes da chamada (P1);
G2 `db.query` vai por `transaction([q], {readOnly: true})` (P1); G3 o Recados grava com `db.batch`;
G4 `CloudflareApps.upload` devolve o código de erro da Cloudflare; G5 a ordem do envio: transação
1, Worker, banco e migrações numa transação (P4, P6), transação 2; G6 o login de execução nasce com
`statement_timeout` de uma constante, e o reparo o refaz; G7 `storeAppVersion` devolve uma união
que cabe uma recusa; G8 `app_version.failure` é texto, sem enum; G9 `APP_LIMITS` em
`app-contract/src/limits.ts`, e `limits.cpu_ms` 50 lido dele; G10 o registro que substitui o 0020
(P1) em `main`; G11 a janela de envio e a lista leem o texto pelo código (C48); G12 `app:pack` monta
qualquer pasta de `tests/apps/`, e `publish.yml` põe os zips no Release.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | Registro e prova | `docs/` | testes | cloudflare:wrangler, neon:neon-postgres | a 9 em `main` |
| U2 | Limites da chamada | `apps/edge/` | segurança | cloudflare:workers-best-practices | U1 |
| U3 | Conferência do envio | `app-contract` | dados | — | a 9 em `main` |
| U4 | O envio recusa | servidor, `hub-api` | dados | fastify-best-practices, neon:neon-postgres | U3 |
| U5 | Telas | web | web | shadcn | contrato de U4 |
| U6 | Apps de defeito, Release, percurso | `tests/apps/`, `.github/`, `tests/e2e/` | testes | cloudflare:wrangler | U2, U4, U5 |

U2 e U3 juntas, sem pasta em comum. Uma revisão, um merge (L9, L13); a prova não cria release
(L17).

**Orçamento de código alterado** (sem testes nem gerados): U2 100; U3 150; U4 150; U5 80; U6 80;
espalhados 40. Total **600**, teto 4.000 (L2).

## Os critérios de aceite

| # | Unidade | Critério observável, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Registro "proposed" antes da prova; Result com versões, o número de consultas e os tempos do banco acordando; nada `cx-prova-` vivo | os registros | must |
| 2 | U2 | Numa chamada, a consulta N passa e a N+1 é recusada: pelo limite nativo, a página `EDGE_APP_FAILED`; pelo contador, `DB_QUERY_LIMIT` ao app, sem rede | `db.test.ts`, `dispatcher.test.ts` | must |
| 3 | U2 | App que espera: aos 10 s, a página `EDGE_APP_FAILED`, registro `EDGE_APP_DEADLINE`; consulta depois do prazo: `DB_DEADLINE`, sem rede | idem | must |
| 4 | U2 | `props` do `Db` levam o prazo; o app não o recebe | `db.test.ts` | must |
| 5 | U3 | Acusa, com código, operação e linha: texto literal que grava em `query`; dois `batch` numa função; `statement_timeout`, `set_config`, `ALTER ROLE`, `DO $$` no texto. O Recados passa. Gravação montada em execução passa (o banco recusa) | `verify.test.ts` | must |
| 6 | U3 | `worker.js` sem sintaxe válida: um motivo, sem exceção; o maior `worker.js` do teto do envio: o tempo registrado, o envio dentro de `SEND_CLAIM_MS` | idem | must |
| 7 | U4 | `createAppVersion` com `recados-defeito`: 422 `APP_VERSION_REFUSED` e `reasons`; nenhuma linha, nenhum `blob`, nenhuma chamada fora; o próximo envio certo leva o número seguinte ao último guardado | `versions.test.ts` | must |
| 8 | U4 | Cloudflare dublê com 10021: 422 `APP_DOES_NOT_START`, versão "falhou" com esse código, nenhuma migração, ponteiro igual; outro erro: 502 `APP_VERSION_FAILED` | idem, dublês (T14) | must |
| 9 | U4 | Login de execução com `statement_timeout` 5 s e `transaction_timeout` 6 s, também o da 9 depois do reparo; `pg_sleep(6)` por ele: 57014 | `app-database.test.ts` | must |
| 10 | U4 | A porta `storeAppVersion` devolve a recusa com os motivos | `versions.test.ts` | must |
| 11 | U5 | Cada célula da matriz; T23 | navegador | must |
| 12 | U6 | Cada linha nova de `removals.json`: `caught` | `removals` | must |
| 13 | U6 | O roteiro, Hub real, dublês | `tests/e2e/refusals.test.ts` | must |
| 14 | U6 | Publicado: passos 1 a 4; o laço não atrasa outro app aberto ao mesmo tempo | firstmate (T13, T14) | must |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido, recusado ou concorrência |
| --- | --- | --- | --- | --- | --- |
| Enviar versão | a da 9 | "Conferindo e enviando a versão…" | as da 9 | `NotFound` | 422 `APP_VERSION_REFUSED`: frase, ação e um item por motivo; 422 `APP_DOES_NOT_START`: frase e ação; 409 da 9 |
| Versões | a da 9 | `Skeleton` | a da 9 | `NotFound` | "Falhou · O app não inicia" |
| App | o exemplo | — | laço, prazo, consultas: a página `EDGE_APP_FAILED` da 8 | a da 8 | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `VerifyReason {code, operation, line}` | `verifyAppVersion` | envio, porta, janela de envio |
| `Problem.reasons` no 422 `APP_VERSION_REFUSED` | envio | janela de envio |
| `app_version.failure` `APP_DOES_NOT_START` | envio | lista de versões |
| `APP_LIMITS` `cpuMs`, `queriesPerCall`, `callDeadlineMs`, `statementTimeoutMs`, `transactionTimeoutMs` | `app-contract`, números do registro | envio, `CompanyPostgres`, despachante |
| `DbProps.deadline` | despachante | `Db` |
| `UploadResult` `{kind: 'UPLOADED'}` ou `{kind: 'REFUSED', code}` | `CloudflareApps.upload` | envio |

Falhas novas (C48), USER, settles: `APP_VERSION_REFUSED` 422, "O Hub recusou esta versão." /
"Corrija o que está listado e envie de novo."; `APP_DOES_NOT_START` 422, "O app não inicia." /
"Corrija o código e envie de novo." Motivos, com `{operação}` quando achada: `WRITE_IN_QUERY` "Em
`{operação}`: grava com `db.query`. Grave com `db.batch`."; `TWO_BATCHES` "Em `{operação}`: dois
lotes separados. Junte num `db.batch`."; `DATABASE_SETTING` "O app muda uma configuração do
banco."; `UNREADABLE` "O `worker.js` não é JavaScript válido." Registros do despachante:
`DB_QUERY_LIMIT`, `DB_DEADLINE`, `EDGE_APP_DEADLINE`.

`Problem.reasons` é um membro de extensão do RFC 9457, só códigos, nomes e linhas do próprio app:
exceção declarada à C51, levada ao fechamento (L20).

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Dependência fora | O que imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Conferência do envio | pura; a mesma resposta | nada gravado | nenhuma | `APP_VERSION_REFUSED` | 5–7, 10 |
| Worker recusado (10021): a linha "falhou" da 9 com o código | a trava da 9 | antes do banco da empresa (G5) | Cloudflare fora: 502 da 9 | `APP_DOES_NOT_START` | 8 |
| `ALTER ROLE … SET transaction_timeout`, no comando de login da 9 | repetível | o reparo refaz | Neon: 502 da 9 | `APP_DATABASE_READY` | 9 |
| Contador e prazo da chamada no `Db` | por chamada | um lote já enviado termina ou cai inteiro pelo banco (6 s); quem chama vê a página | Neon: o código | `DB_QUERY_LIMIT`, `DB_DEADLINE` | 2, 3 |
| Prazo no despachante | por chamada | a página aos 10 s | nenhuma | `EDGE_APP_DEADLINE` | 3 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Limites da chamada | nova | `apps/edge/src/db.ts`, `dispatcher.ts` | — | PostgREST, transação por pedido; Budibase, prazo por chamada |
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
| `docs/decisions/`, `index.md` | cria o registro dos limites, próximo número livre | U2, U4 |
| `architecture.md` §8, §11 | a tabela do caminho dos dados; o risco do verificador sai | `check-docs` |

### Os contratos que a unidade cria

O registro: os números de `APP_LIMITS` e onde cada limite vive. Criterion: (1) `INSERT` em
`transaction([q], {readOnly: true})` pelo HTTP: 25006, se a 9 não registrou; (2) `SET TRANSACTION
READ WRITE; INSERT` num texto: recusado; (3) se as chamadas a `ctx.exports.Db` contam em
`limits.subRequests` do `DISPATCHER.get` e no teto de 32 invocações, e em quantas o app é cortado;
(4) o que o despachante recebe quando a CPU estoura; (5) `statement_timeout` e
`transaction_timeout` do login valem pelo HTTP, com os códigos; (6) o upload de um Worker que falha
ao iniciar, num nome novo pela API de WfP: o código; (7) a primeira consulta depois de suspender o
computador, três vezes, em ms. Se (2) passar, P1 volta ao fundador; se (7) chegar ao prazo de
10 s, P3 volta.

### A ordem do trabalho

PR só de documentos (L13). O Result fixa `wrangler` e `@neondatabase/serverless` como na 9. Regras:
L13, L21, T13, T14.

### Como se prova

1: os registros.

## U2 Os limites da chamada

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/edge/src/` | `db.ts`, `dispatcher.ts`, `pages.ts` | o runner |
| `scripts/removals.json` | `edge-query-limit`, `edge-call-deadline` | `npm run removals` |

### Os contratos que a unidade cria

`DbProps` ganha `deadline` (instante em ms). Pelo limite nativo: `DISPATCHER.get(nome, {props},
{outbound, limits: {subRequests: APP_LIMITS.queriesPerCall}})`; pelo contador: o `Db` da chamada
(G1) lança `DB_QUERY_LIMIT`. Só um dos dois, pelo registro.

### A ordem do trabalho

1. O despachante marca o prazo com `APP_LIMITS.callDeadlineMs` e corre a resposta do app contra
   ele; vencido, a página `EDGE_APP_FAILED` e o registro `EDGE_APP_DEADLINE`. Regras: C50, C57,
   C73.
2. O `Db` recusa sem rede depois do prazo e dá ao driver um sinal que termina nele. Regras: C27,
   C57, S4. Funções: `@neondatabase/serverless` do registro, `transaction(queries, {readOnly,
   fetchOptions})`; `AbortSignal.timeout`.
3. O limite de consultas pelo caminho do registro (C75).

### Como se prova

2–4: `npm run test -w @conexus/edge`, relógio controlado.

## U3 A conferência do envio

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/app-contract/src/` | cria `verify.ts`; `limits.ts` ganha os números | `hub-api`, servidor, edge; o Builder na 13 |
| `app-contract/package.json`, lock, `.dependency-cruiser.cjs` | `acorn`, `acorn-walk` de produção, só em `verify.ts`; entrada `./verify` | CI (L16) |

### Os contratos que a unidade cria

`verifyAppVersion({manifest, workerJs}): VerifyReason[]`, pura, na entrada
`@conexus/app-contract/verify`, para o app empacotado não levar o analisador.
`VerifyReason = {code: 'WRITE_IN_QUERY' | 'TWO_BATCHES' | 'DATABASE_SETTING' | 'UNREADABLE',
operation: string | null, line: number}`; `operation` é a chave da operação do manifesto que contém
a chamada, ou `null`.

### A ordem do trabalho

Lê só o `worker.js`; acusa só o texto escrito, e a gravação montada fica para o banco (P1). Primeiro
confere que o `worker.js` do `app:pack` mantém `.query(` e `.batch(`. Regras: C21, C26, C48, D28,
S15. Funções: acorn 8.18.0 `parse` (`ecmaVersion: 'latest'`, `sourceType: 'module'`,
`locations: true`); acorn-walk 8.3.5 `ancestor`.

### Como se prova

5, 6: `npm run test -w @conexus/app-contract`, com os apps de defeito.

## U4 O envio recusa

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/` | `app-failures.ts`: as falhas e os textos dos motivos; `failures.ts`: `Problem.reasons` | servidor, web |
| `hub/apps/send.ts`, `versions.ts` | conferência antes da transação 1; 10021 | rotas, a porta |
| `platform/cloudflare.ts`, `company-postgres.ts` | `UploadResult`; `transaction_timeout` | `main.ts` |
| `scripts/removals.json` | `send-verify-before-store`, `run-login-timeouts` | `npm run removals` |

### Os contratos que a unidade cria

`createAppVersion` ganha 422 `APP_VERSION_REFUSED` com `reasons` e 422 `APP_DOES_NOT_START`.
`storeAppVersion` ganha `{kind: 'REFUSED', reasons}`. `CloudflareApps.upload` devolve
`UploadResult`; só 10021 vira recusa (o 10027 não cabe no teto de 10 MB).

### A ordem do trabalho

1. Depois do Zod e dos tamanhos, antes da transação 1: `verifyAppVersion`; com motivos, a recusa,
   sem gravar. Regras: C27, C48, C49, C51 com a exceção, D22.
2. Upload recusado: a linha "falhou" da 9 com `APP_DOES_NOT_START`, sem tocar o banco da empresa
   (G5). Regras: C48, C52, C56.
3. O comando de login da 9 põe os dois prazos de `APP_LIMITS`. Regras: D20, D25. Funções:
   `ALTER ROLE … SET`.

### Como se prova

7–10: `npm run test -w @conexus/server`, o PostgreSQL de teste, Cloudflare dublê (T5, T10, T14).

## U5 As telas

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/apps/` | `send-version.tsx`, `versions.tsx` | rotas |
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
| `publish.yml` | os três zips no Release | Release |
| `tests/e2e/`, `package.json` | `refusals.test.ts` | `npm run e2e` |

### Como se prova

12, 13: `npm run removals`, `npm run e2e`; 14 após o Release, pelo firstmate. Regras: T12–T14.
