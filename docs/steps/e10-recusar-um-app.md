# Etapa 10: Recusar um app

## A página do fundador

**No fim desta etapa** você vê uma versão que nem inicia ser recusada sem tirar do ar a que
funciona, o banco recusar uma gravação errada sem gravar nada, e um app que trava ser cortado em
segundos, sem afetar o resto.

**O roteiro de uso.** No Hub publicado, na Empresa A, com as pastas `recados-1`, `recados-2`,
`recados-nao-inicia`, `recados-defeito` e `recados-laco` da página da v0.10.0.

1. Crie o Projeto Pedidos; em **Configurações**, envie `recados-1` e depois `recados-2`: "Versão 2 ·
   no ar". Abra o app e escreva um recado.
2. Envie `recados-nao-inicia`: "Versão 3 · Falhou · O app não inicia". **Abrir app**: o Recados da
   Versão 2, com o recado lá.
3. Envie `recados-defeito`: "Versão 4 · no ar"; a Versão 3 sai da lista. Abra o app e escreva um
   recado: "Não deu para guardar o recado. Tente de novo." Recarregue: só o recado de antes.
4. Envie `recados-laco`: "Versão 5 · no ar". Abra o app e clique em **Travar**: em cerca de 2
   segundos, "O app não conseguiu responder agora." O Hub segue normal.
5. Na Versão 2, **Voltar para esta**: o app funciona, o recado lá.

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
9 fez a leitura, a 10 conta os lotes. P2 A: a versão que a Cloudflare recusa a 9 guarda como
"Falhou · O app não inicia". P3 A: CPU 50 ms; consultas por chamada pelo limite nativo, se a prova
mostrar que ele conta o `db`, senão um contador, com o número medido; 10 s por chamada;
`statement_timeout` 5 s e `transaction_timeout` 6 s no login de execução do app. P4 A, P6 A: na 9.
P5 A: o despachante não lê o texto das instruções. "Tirar verificador": nenhuma conferência lê o
código no envio; o banco e o despachante recusam na primeira chamada, como fazem as referências.

**O que muda.** A arquitetura §8 perde a leitura do texto no despachante e ganha os números da
prova; a §11 perde o risco do verificador.

**Fica de fora.** A regra S5 (estado no módulo): vai para a 13, no código que o Builder escreve.
Ler as migrações como SQL e recusar a que a versão antiga não aguenta (a 15). Os limites sob carga
(a 22). As issues `next-card` 25, 39 e 45: nada nas pastas da 10.

**A decisão sua pedida nesta etapa.** Nenhuma pendente.

## O que a etapa 9 deixou

Conferido em `main` (`20dc31e`), com 0045 e 0046:

H1 `db.query` vai por `transaction([q], {readOnly: true})` e `db.batch` por uma `transaction`
(`apps/edge/src/db.ts`); cada pedido ao Neon tem prazo próprio de 10 s, não a chamada; uma recusa
dá ao app só o código. H2 o `Db` do despachante é um `WorkerEntrypoint` refeito a cada chamada a
ele (0045): a contagem por chamada do app não cabe nele, e nenhum lote é contado ainda. H3 o envio
sobe o Worker primeiro, e 10021 já vira "falhou" com `APP_VERSION_NOT_STARTING`, 422, antes do
banco da empresa (0046, `send.ts`); a prova pela API de WfP ficou "Not covered". H4 `APP_CPU_MS` 50
em `send.ts`, `statement_timeout` `'5s'` em `company-postgres.ts`, `QUERY_DEADLINE_MS` em `db.ts`:
três números fora de `app-contract/src/limits.ts`, onde `APP_LIMITS` é só o teto do envio. H5 o
executor responde 500 `HANDLER_FAILED` quando o handler lança, e o Recados mostra "Não deu para
guardar o recado. Tente de novo." H6 `app:pack` e `publish.yml` montam e põem no Release só
`recados-1` e `recados-2`. H7 a lista de versões lê o texto da falha pelo código.

A etapa 9.1, em escrita, muda a passagem para o app e os nomes dos projetos Neon; esta etapa não
toca nenhum dos dois.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | Registro e prova | `docs/` | testes | cloudflare:wrangler, neon:neon-postgres | — |
| U2 | Limites da chamada e do login | `apps/edge/`, `app-contract/src/limits.ts`, servidor | segurança | cloudflare:workers-best-practices, neon:neon-postgres | U1 |
| U3 | Apps de defeito, Release, percurso | `tests/apps/`, `scripts/`, `.github/`, `tests/e2e/` | testes | cloudflare:wrangler | U2 |

Uma revisão, um merge (L9, L13); a prova não cria release (L17).

**Orçamento de código alterado** (sem testes nem gerados): U2 170; U3 80; espalhados 30. Total
**280**, teto 4.000 (L2).

## Os critérios de aceite

| # | Unidade | Critério observável, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Registro "proposed" antes da prova; Result com versões, o número de consultas, onde a contagem vive, os tempos do banco acordando; nada `cx-prova-` vivo | os registros | must |
| 2 | U2 | Numa chamada do app, o segundo `db.batch`: `DB_SECOND_BATCH`, sem rede, o primeiro gravado; na chamada seguinte, um lote passa | `dispatcher.test.ts`, app dublê | must |
| 3 | U2 | Numa chamada, a consulta N (`queriesPerCall`) passa e a N+1 é recusada: pelo limite nativo, a página `EDGE_APP_FAILED`; pelo contador, `DB_QUERY_LIMIT` ao app, sem rede | idem | must |
| 4 | U2 | App que espera: aos 10 s, a página `EDGE_APP_FAILED`, registro `EDGE_APP_DEADLINE`; `db` chamado depois do prazo: `DB_DEADLINE`, sem rede; o `ctx.props` do app não traz prazo nem contagem | idem | must |
| 5 | U2 | Os números vêm só de `APP_CALL_LIMITS`: o upload leva `cpuMs`, o login os prazos, o `db` o prazo da chamada | `removals` | must |
| 6 | U2 | Login de execução com `statement_timeout` 5 s e `transaction_timeout` 6 s, também o da 9 depois do reparo; `pg_sleep(6)` por ele: 57014; o login de migração sem esses prazos | `company-postgres.test.ts`, `repair.test.ts` | must |
| 7 | U3 | `recados-defeito` grava com `db.query`: o envio aceita; `escreverRecado` responde 500 `HANDLER_FAILED`, nada gravado; `recados-laco` e `recados-nao-inicia` montam | `scripts/app-pack.test.ts`, app dublê | must |
| 8 | U3 | Cada linha nova de `removals.json`: `caught` | `removals` | must |
| 9 | U3 | O roteiro, Hub real, dublês | `tests/e2e/refusals.test.ts` | must |
| 10 | U3 | Publicado: passos 1 a 5; o recado recusado não está no banco da empresa; durante o laço, outro Projeto abre o seu app | firstmate (T13, T14) | must |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido, recusado ou concorrência |
| --- | --- | --- | --- | --- | --- |
| Enviar versão | a da 9 | a da 9 | as da 9, com 422 `APP_VERSION_NOT_STARTING` | a da 9 | as da 9 |
| Versões | a da 9 | a da 9 | a da 9 | a da 9 | a da 9, com "Falhou · O app não inicia" |
| App | o exemplo | — | laço, prazo, consultas: a página `EDGE_APP_FAILED` da 8; gravação em `query`, segundo lote: o código ao app, e o app diz o seu texto | a da 8 | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `APP_CALL_LIMITS` `cpuMs`, `queriesPerCall`, `callDeadlineMs`, `statementTimeoutMs`, `transactionTimeoutMs` | `app-contract`, números do registro | envio, `CompanyPostgres`, despachante |
| A contagem e o prazo de uma chamada | despachante, onde o registro disser | o `db` da chamada |

Nenhuma falha nova em `FAILURES`. Códigos que o `db` dá ao app e o despachante registra:
`DB_SECOND_BATCH`, `DB_QUERY_LIMIT`, `DB_DEADLINE`, `EDGE_APP_DEADLINE`; a gravação em `query` chega
ao app como o 25006 do PostgreSQL (H1).

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Dependência fora | O que imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `ALTER ROLE … SET transaction_timeout`, no comando de login da 9 | repetível | o reparo refaz | Neon: 502 da 9 | `APP_DATABASE_READY` | 6 |
| Contagem e prazo da chamada | por chamada | o lote já enviado termina ou cai inteiro pelo banco (6 s); quem chama vê a página | Neon: o código | `DB_SECOND_BATCH`, `DB_QUERY_LIMIT`, `DB_DEADLINE` | 2–4 |
| Prazo no despachante | por chamada | a página aos 10 s | nenhuma | `EDGE_APP_DEADLINE` | 4 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Limites da chamada | nova | `apps/edge/src/db.ts`, `dispatch.ts`, `dispatcher.ts` | — | PostgREST, transação por pedido; Budibase, prazo por chamada |
| Limites do login | nova | `platform/company-postgres.ts` | — | nomes de `data-plane.ts:89-90` (`e0353c36`) como especificação |
| Leitura do texto no despachante | sai (P5 A) | — | — | arquitetura §8 |
| Verificador do envio | sai ("tirar verificador") | — | — | nenhuma referência lê código; todas usam o banco |

**A medida do transplante.** Nada é trazido. O verificador antigo (`builder/check/`, 1.402 linhas
em `e0353c36`) conferia tipos, montagem, imports e partida, que são do Builder (13 e 14).

**A dívida.** Uma conferência de código, se vier, mora no código que o próprio Builder escreve (13 e
14), com os tipos do TypeScript e o lint, não no envio: ali S5 é conferida (13) e as migrações lidas
(D29, 15). No fechamento (L20): D28 com o PostgreSQL e o despachante como garantia, no lugar do
`[verifier]`; S5 e D29 com a etapa que as confere.

## U1 Registro e prova

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/decisions/0047-…`, `index.md` | cria o registro dos limites da chamada | U2 |
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
covered"); (8) a primeira consulta depois de suspender o computador, três vezes, em ms. Se (1) ou
(2) falhar, ou (4) não achar lugar, P1 volta ao fundador; se (5) não cortar o laço, se (6) não valer
pelo HTTP, ou se (8) chegar ao prazo de 10 s, P3 volta.

### A ordem do trabalho

PR só de documentos (L13). O Result fixa `wrangler` e `@neondatabase/serverless` como em 0043.
Regras: L13, L21, T13, T14.

### Como se prova

1: os registros.

## U2 Os limites da chamada e do login

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/edge/src/` | `db.ts`, `dispatch.ts`, `dispatcher.ts`, `pages.ts` | o runner |
| `packages/app-contract/src/limits.ts` | `APP_CALL_LIMITS` | edge, servidor |
| `apps/server/src/hub/apps/send.ts` | `APP_CPU_MS` sai, lido de `APP_CALL_LIMITS` | rotas |
| `apps/server/src/platform/company-postgres.ts` | `'5s'` sai; os dois prazos só no login de execução | `main.ts`, reparo |
| `scripts/removals.json` | `edge-second-batch`, `edge-query-limit`, `edge-call-deadline`, `call-limits-one-owner`, `run-login-timeouts` | `npm run removals` |

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
3. Os três números de H4 passam a ler `APP_CALL_LIMITS` (C26, C75). O comando de login da 9 põe
   os dois prazos só no login de execução: no de migração, o `transaction_timeout` cortaria a
   transação única de 0046; o reparo o repete. Regras: D20, D25. Funções: `ALTER ROLE … SET`.

### Como se prova

2–6: `npm run test -w @conexus/edge`, relógio controlado, app dublê; `npm run test -w
@conexus/server`, o PostgreSQL de teste; `npm run removals`.

## U3 Apps de defeito, Release e percurso

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `tests/apps/` | `recados-nao-inicia` (lança no topo), `recados-defeito` (`escreverRecado` com `db.query`), `recados-laco` (laço em **Travar**) | `app:pack`, testes |
| `package.json` (`app:pack`, `e2e`), `publish.yml` | montar e pôr no Release os três zips | Release |
| `tests/e2e/` | `refusals.test.ts` | `npm run e2e` |

### Como se prova

7–9: `node --test scripts/app-pack.test.ts`, `npm run removals`, `npm run e2e`; 10 após o
Release, pelo firstmate. Regras: T12–T14.
