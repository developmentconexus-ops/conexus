# Saúde do CI: folga de volta e um aviso antes do corte

Cartão curto fora da ordem do roteiro. Vem da investigação do CI de 2026-11-04 e das duas palavras
do fundador no mesmo dia: "D A" (o fluxo recorrente de saúde do CI, a opção A) e "E OKAY" (os
consertos de raiz 1 a 5, na ordem recomendada). Antes delas, o pedido: "melhorar não é só dividir.
Dividir pode ser só consertar o sintoma e não a root cause". Pela regra L5 o cartão entra em
`docs/steps/` quando os cartões da trilha que estão antes dele saírem nos seus fechamentos. Até lá
ele vive no seu pull request, e a verificação `second-card` de `check-docs` fica vermelha nele de
propósito. O relatório da investigação fica fora do repositório (L21). Este cartão traz os números
e as referências que mudam o trabalho. Todas as linhas citadas foram conferidas no `main` em
`a31b7faa`. As medidas são do `main` em `ae7eea7a` (run 41881463841, de 2026-11-04) e das 346
execuções do CI em `main` de 14/10 a 04/11.

## A página do fundador

**No fim desta etapa** o CI volta a ter folga. O maior shard do servidor volta para perto da metade
do seu limite de 10 min, com os mesmos 6 shards. E o próprio CI avisa quando um job chega a 70% do
seu limite, antes de cortar.

**Onde estamos hoje.** Em 04/11, a mediana do maior shard em `main` é 577 s (9,6 min), com a faixa
do dia entre 564 e 598 s. O limite é 600 s. No PR 688, o shard 2 passou de 10 min três vezes
seguidas no mesmo commit e terminou em 7,9 min na quarta tentativa. A soma do passo de teste dos
shards foi de 302 s em 16/10 para 2810 s em 04/11. O crescimento vem de 121 arquivos de teste novos
(1103 s), não de um runner mais lento (o ruído é de ±6% no total). A causa raiz é o custo fixo que
cada teste paga, mais esperas de relógio de verdade:

- cada teste cria um banco e aplica as 75 migrações do zero, cerca de 1030 bancos por run, a 0,55
  a 0,66 s cada;
- alguns testes esperam o relógio da produção (a virada do minuto, o arrendamento de 15 s do
  Mastra, prazos de 5 a 15 s), cerca de 390 s por run;
- 45 testes sobem um Hub inteiro só para ver uma configuração recusada, 150 s por run;
- o Postgres do CI grava em disco com durabilidade que dados de teste não precisam, até 70 s por
  run.

**O roteiro de uso.** Esta etapa não tem tela do Hub. O roteiro é na página do CI no GitHub.

1. Abra o último run do CI em `main` e role até o resumo. A tabela "Jobs contra o orçamento"
   mostra cada job com o quanto usou do seu limite. Os shards do servidor ficam abaixo de 70%, sem
   aviso, e o maior fica perto de 5 a 6 min. A queda se vê pondo esse run ao lado do run de
   `main` de antes da etapa (run 41881463841), em que o maior shard levou 567 s, 95% do limite.
2. No mesmo resumo, a tabela dos arquivos de teste mostra `src/boot.test.ts` perto de 60 s (hoje
   207 s) e `src/builder/automations/run.test.ts` perto de 30 s (hoje 131 s).
3. Abra o issue "CI acima do orçamento". O workflow agendado o abriu quando `main` ficou três runs
   seguidos em 85% ou mais, e troca a tabela dele uma vez por dia enquanto ele está aberto. A
   tabela mostra os últimos runs de `main` abaixo de 85%. A revisão de saúde do CI do fechamento
   o fecha, porque a mediana voltou abaixo de 85%.

Enquanto a etapa anda, o aviso e o issue fazem o que a opção A diz: um aviso no CI a partir de 70%
do limite, um issue automático quando passa de 85% três vezes seguidas, e a revisão de saúde do CI
em cada fechamento de etapa. Um issue aberto não chama uma revisão na hora. Firstmate avisa você
quando ele abre, e a revisão do próximo fechamento cuida dele.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. No fim: faz o roteiro e
diz o que viu.

**Fica de fora, e por quê.**

- **O que só trata o sintoma.** Mais shards (de 6 para 8 ou 10): cada shard novo paga de novo 40 a
  60 s de contêiner e instalação. O de 24/10 durou 9 dias, e com o ritmo de 01/11 a 04/11 (+760 s
  em 3 dias) 8 shards cortariam de novo em cerca de uma semana. Timeout maior (de 10 para 15 min):
  esconde o corte, deixa o PR esperando o mesmo tempo e apaga o sinal que o comentário de
  `ci.yml:107` pede ("a test that hangs answers in 10 min, not 15"). Rodar de novo até passar: o PR
  688 fez isso 4 vezes, gastou runner e escondeu que o shard estava a 96% do limite. Nenhuma unidade
  muda a lista de shards, o `timeout-minutes` ou acrescenta retentativa.
- **O conserto 6** (concorrência dentro do shard, arquivos num processo só, carregar o servidor sob
  demanda). Ele muda o modelo de isolamento e depende dos consertos 1 a 3. Fica até ser medido de
  novo, depois desta etapa.
- **O verificador de `sleep` nos testes e o teste-referência "Hub vazio".** Não fazem parte da
  opção A. Cada um seria uma verificação nova com o seu cartão (L20), e cada um tem o seu issue:
  https://github.com/developmentconexus-ops/conexus/issues/694 (o verificador, `method`) e
  https://github.com/developmentconexus-ops/conexus/issues/695 (o "Hub vazio", `next-card`). A
  regra "um teste não espera o relógio de verdade" entra como texto do método no fechamento
  (abaixo).

**O método, no fechamento.** A revisão de saúde do CI a cada fechamento de etapa e a regra de que
um teste não espera o relógio de verdade são texto do método. Pela L20, entram no pull request de
fechamento deste cartão, não numa unidade.

**As decisões suas nesta etapa.** Nenhuma. As três que havia, você já deu: o fluxo A ("D A"), os
consertos 1 a 5 na ordem 5, 2, 1, 4, 3 ("E OKAY"), e o conserto 3, que muda código de produção,
dentro deles.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | O aviso de orçamento em cada run: um passo no job `ci` que compara cada job com o seu `timeout-minutes` e avisa a partir de 70% | `.github/workflows/ci.yml` | delivery | — |
| U2 | O issue agendado: um workflow diário que abre ou atualiza "CI acima do orçamento" quando um job de `main` fica em 85% ou mais três runs seguidos | `.github/workflows/`, `scripts/` | delivery | — |
| U3 | Conserto 5: o Postgres dos testes sem durabilidade, no CI e no contêiner do desenvolvedor | `.github/actions/test-database/`, `docs/how-to/` | testing | U1 |
| U4 | Conserto 2: as esperas de relógio tiradas pelos ajustes que o código já tem | `apps/server/src/builder/automations/`, `apps/server/src/builder/assistant/`, `apps/server/src/builder/conversation/`, `apps/server/src/hub/identity/`, `apps/server/src/platform/`, `apps/server/package.json` | testing | U3 |
| U5 | Conserto 1: migrar uma vez e clonar o banco de cada teste (`CREATE DATABASE … TEMPLATE`) | `apps/server/src/platform/` | testing | U4 |
| U6 | Conserto 4: a recusa da configuração testada dentro do processo, com dois testes de processo | `apps/server/src/` | testing | U5 |
| U7 | Conserto 3: os ajustes de tempo que faltam no código de produção | `apps/server/src/platform/`, `apps/server/src/hub/apps/`, `apps/server/src/builder/model-accounts/`, `apps/server/src/builder/conversation/` | testing | U6 |

U1 e U2 nunca falham o build, então não são verificações que recusam no sentido da L20: são
produtos do fluxo A. Mesmo assim são as primeiras unidades, cada uma no seu próprio pull request,
antes de U3. O que elas usam é nativo (`timeout-minutes`, os comandos `::warning::` e
`$GITHUB_STEP_SUMMARY`, o gatilho `schedule:`), e há um script só onde nada nativo serve: a regra
dos três runs seguidos. U1 e U2 não dividem arquivo e correm em paralelo. Os consertos U3 a U7
entram um por vez, na ordem recomendada, para que a medida do CI de cada um seja só dele. Uma
unidade pode ser construída antes, mas entra depois da medida da anterior. Uma unidade que toque um
arquivo da etapa em construção espera por ela (L1), e por isso a folga pode demorar.

O maior shard está a 96% do limite, e os pull requests das próprias unidades podem ser cortados.
Um corte por timeout no pull request de uma unidade se roda de novo uma vez, e o pull request o
registra. Qualquer ponte (mais shards ou um timeout maior) fica fora das unidades: se alguém a
pedir, ela é decisão do fundador, com data para sair.

**Orçamento de código alterado.** U1: 25 linhas. U2: 110 (o workflow e o script, sem o teste). U3:
10. U4: 5 (o resto é teste). U5: 60. U6: 0 (só teste). U7: 40. Total da etapa: 250.

**Como cada unidade prova o ganho.** Toda unidade de conserto registra no seu pull request:

1. **A medida local, antes e depois, nos mesmos arquivos.** Os arquivos que a unidade muda, rodados
   em `apps/server` com `node --test --test-concurrency=1 --test-force-exit --test-reporter=spec
   <arquivos>`, um processo de teste por vez. São três rodadas alternadas, A (o `main`) e B (o
   ramo), A, B, A, B, contra o Postgres local de `docs/how-to/local-database.md`. Vale a mediana da
   soma dos testes de cada lado. A máquina não roda outra suíte ao mesmo tempo.
2. **A medida do CI.** O maior shard do servidor e a soma do passo `npm test` dos 6 shards, na
   mediana dos 5 runs de `main` antes do merge e dos 5 depois. Os números vêm da tabela de U1 e da
   tabela "Test files" que `scripts/test-reporter.ts:43-54` imprime. Um ganho abaixo do ruído (±6%
   na soma, até ±25% entre máquinas para o mesmo commit) não é afirmado pela medida do CI: vale a
   local, e o pull request diz isso.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Um job que usou 70% ou mais do seu `timeout-minutes` gera um aviso `::warning::` no run, "server (2) usou 8,1 de 10 min (81%)". A tabela "Jobs contra o orçamento" do resumo traz todos os jobs, com o quanto cada um usou. Abaixo de 70%, nenhum aviso. O job `ci` não entra na conta | o run do próprio pull request de U1: com os números de hoje, os shards do servidor acima de 70% avisam e os jobs abaixo não | must |
| 2 | U1 | O passo nunca falha o run: um erro dele (a API fora, o arquivo ilegível) deixa o job `ci` verde e o resultado dos jobs igual | `continue-on-error: true`, como o passo vizinho (`ci.yml:375-377`); `actionlint` e `zizmor` no job `check` passam | must |
| 3 | U2 | Com um job em 85% ou mais do orçamento nos três últimos runs completos de `main`, o workflow abre o issue "CI acima do orçamento" com a tabela dos 10 últimos runs. Se ele já está aberto, atualiza a tabela a cada disparo, acima ou abaixo de 85%, e não abre outro. Sem issue aberto e com dois de três, ou com um run no meio abaixo de 85%, não faz nada | `scripts/ci-budget.test.ts`, com respostas da API gravadas e reduzidas aos campos usados | must |
| 4 | U2 | Um run cancelado pela concorrência (`ci.yml:13-15`) não quebra nem soma à sequência. Um job cortado no limite conta como 100% | `scripts/ci-budget.test.ts`, os dois casos | must |
| 5 | U2 | O workflow só roda por `schedule` e `workflow_dispatch`, com `permissions: {}` no topo e só `actions: read`, `contents: read` e `issues: write` no job | `actionlint` e `zizmor` no job `check`; leitura do arquivo | must |
| 6 | U3 | No job `server`, o log mostra `fsync`, `synchronous_commit` e `full_page_writes` em `off` antes de `npm test`, e os 6 shards passam | o log do job `server` no run do pull request de U3 | must |
| 7 | U3 | A soma do `total=` das linhas `checkpoint complete` do Postgres do serviço cai dos 70 s por run de 04/11 | o log do Postgres do serviço, num run de `main` depois do merge | should |
| 8 | U4 | Cada teste mudado prova o mesmo comportamento: nenhuma asserção sai nem fica mais fraca, e o diff muda só o modo de esperar. As linhas de `scripts/removals.json` dos arquivos mudados continuam provando a sua proteção | o job `removals` do CI no pull request de U4 (`run.test.ts`, `memberships-race.test.ts`) | must |
| 9 | U4 | `run.test.ts` não espera mais a virada do minuto nem o arrendamento de 15 s, e cai de 131 s para perto de 30 s no CI | a tabela "Test files" de U1, antes e depois | should |
| 10 | U5 | Cada teste ganha o seu banco, clonado de um modelo migrado uma vez por versão da pasta `migrations/`. O banco clonado tem o mesmo catálogo de um banco migrado, inclusive os direitos de banco que o clone não copia | `platform/catalog.test.ts:95`, "o instantâneo depois de migrate é o de database-grants.sql", passa sobre o clone e falha se o clone ficar sem o `GRANT CONNECT` (a falha é mostrada uma vez no pull request) | must |
| 11 | U5 | Uma migração mudada, acrescentada ou apagada leva a outro modelo: o nome do modelo carrega o hash da pasta | `platform/test-database.test.ts`, caso novo | must |
| 12 | U5 | O banco com `locale: 'C'` e o `migrate.test.ts` continuam migrando do zero | `platform/migrate.test.ts` e o caso de `locale` passam sem mudança | must |
| 13 | U6 | Cada uma das 45 recusas de hoje (`boot.test.ts:60-95`) é provada dentro do processo por `readConfig`, com o código `CONFIG_INVALID` e a variável nomeada | `platform/config.test.ts`, um caso por recusa, pelo `refusal` de `config.test.ts:12` | must |
| 14 | U6 | O caminho do processo continua provado: uma variável faltando e um valor fora do formato saem com código 1 e a linha `CONFIG_INVALID` | `boot.test.ts`, os dois casos que ficam | must |
| 15 | U7 | Sem a opção nova, cada valor é o de hoje: `POOL_LIMITS` e `READ_DEADLINE_MS` (`platform/database.ts:15-26`), `PRUNE_BUDGET_MS` (`hub/apps/prune.ts:104`) e o atraso da retentativa do Mastra. `main.ts` não passa a opção | leitura do diff na revisão; os testes de hoje que usam o valor de produção passam | must |
| 16 | U7 | Cada teste que esperava um desses prazos o recebe curto, e continua falhando quando o prazo não é cumprido | os arquivos da seção de U7, cada um com o prazo curto | must |
| 17 | todas | Com os 6 shards e o limite de 10 min, a mediana do maior shard nos 5 runs de `main` depois de U7 fica em 360 s ou menos | a tabela de U1 | should |

## A matriz de estados

Nenhuma tela do Hub. Os dois textos que uma pessoa lê são o aviso de U1 e o issue de U2.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| O orçamento de um job, o seu `timeout-minutes` em `ci.yml` | quem muda o job | U1, U2 |
| O aviso e a tabela "Jobs contra o orçamento" no resumo do run | U1 | quem abre o run; a revisão de saúde do CI |
| O issue "CI acima do orçamento" | U2 | o fundador; a revisão de saúde do CI |
| O nome do banco-modelo (`conexus_template_<hash>`) | U5, `createTestDatabase` | `createTestDatabase` |
| `MASTRA_AGENT_THREAD_LEASE_TTL_MS` no script de teste | U4, `apps/server/package.json` | o `@mastra/core` instalado; `run.test.ts` |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| U2 abre ou atualiza o issue (`gh issue create` ou `gh issue edit`) | dois disparos juntos (a agenda e um manual): `concurrency:` do workflow sem cancelar, então o segundo acha o issue que o primeiro abriu | o issue aberto e a edição falhando: o job falha, e o disparo seguinte acha o issue pelo título e o atualiza | a API do GitHub fora: o job falha e nada se grava; o disparo do dia seguinte refaz a conta | a tabela da conta no resumo do job | 3, 5 |
| U3, o `ALTER SYSTEM` e o `pg_reload_conf()` no Postgres do serviço | não acontece: um passo por job, num contêiner do job | um `ALTER SYSTEM` falhando: o passo falha e o job fica vermelho, sem teste rodando em configuração pela metade | o contêiner fora: o passo anterior da action já falha ("no container publishes port") | os três `SHOW` | 6 |
| U5 tira o `migrate` de cada teste, e com ele o reparo das senhas dos dois logins (`setPassword`, `migrate.ts:130-140`, chamado em `:243-245`), que hoje cada teste refaz sem ninguém ver | não se aplica: os papéis são do servidor inteiro, e o reparo agora roda uma vez por modelo | um teste que muda um papel ou uma senha e não a devolve (T20, sem `finally`) quebra os arquivos seguintes do shard com 28P01; na máquina local, um modelo do mesmo hash montado com outra `CONEXUS_TEST_RUNTIME_PASSWORD` faz o mesmo | o Postgres fora: como hoje | a recusa de login do Postgres, 28P01 | 10 |
| U5 monta o banco-modelo do Hub (`CREATE DATABASE`, `migrate`, `ALTER DATABASE … RENAME TO`, `ALTER DATABASE … IS_TEMPLATE`) | dois processos de teste juntos: o `withRoleLock` (`test-database.ts:157-167`) serializa, e o segundo acha o modelo pronto pelo nome | o processo morre no meio do `migrate`: o modelo é montado com um nome provisório e só recebe o nome final depois de migrado, então um modelo pela metade nunca é clonado; o próximo apaga o provisório e recomeça | o Postgres fora: `createTestDatabase` falha e o teste falha, como hoje (T4) | nada novo | 10, 11 |
| U5 clona o banco do Hub de um teste (`CREATE DATABASE x TEMPLATE m`), cria o do Mastra e reaplica os direitos de banco | dois clones juntos do mesmo modelo: o Postgres aceita, desde que ninguém esteja ligado ao modelo; o modelo é fechado logo depois de montado | o clone feito e o `GRANT` falhando: o teste falha, e o `t.after` apaga o banco como hoje | o Postgres fora: o teste falha, como hoje | nada novo | 10 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O orçamento de cada job | U1, U2 | `timeout-minutes` de cada job em `ci.yml` (o do `server` em `:108`, com o motivo em `:107`) | GitHub Actions, `jobs.<id>.timeout-minutes` | o limite corta o job; não há aviso antes do corte | nativo: o orçamento é o próprio `timeout-minutes`, sem lista à parte | — | "D A", 2026-11-04 | — |
| O aviso a 70% em cada run | U1 | o passo "The jobs and the slowest steps of this run" (`ci.yml:375-390`) já lê os jobs do run pela API e escreve no resumo | os comandos `::warning::` e `$GITHUB_STEP_SUMMARY` do Actions; langfuse `8ee97c44` `web/vitest.config.mts:205` (`slowTestThreshold`) e o `scripts/vitest/ci-reporter.ts` dele | as referências relatam os testes lentos e deixam o corte para o timeout; nenhuma das 10 tem passo que avise por orçamento | embrulhado: nosso é só a conta duração ÷ `timeout-minutes`, no mesmo `jq` do passo vizinho | nenhuma referência avisa antes do corte | "D A" | — |
| O issue com três runs seguidos a 85% | U2 | não existe | twenty `b76d0217` `.github/workflows/ci-server-integration-test-timings.yaml:3-6` (um workflow agendado que lê os tempos do CI); langfuse `8ee97c44` `.github/workflows/preview-stale-cleanup.yml:14-20,31,44-51` (só `schedule` e `workflow_dispatch`, `permissions: {}` no topo e escrita só no job) | um workflow agendado, com o mínimo de permissão, lê o estado do repositório e escreve nele | embrulhado: nosso é a regra dos três runs seguidos, em `scripts/ci-budget.ts` | nada nativo conta runs seguidos | "D A" | `.github/workflows/ci-budget.yml`, `scripts/ci-budget.ts`, `scripts/ci-budget.test.ts` |
| O Postgres do CI sem durabilidade | U3 | `.github/actions/test-database/action.yml` cria o login dono; o `services:` (`ci.yml:113-124`) não passa argumentos ao `postgres` | n8n `2e855356` `packages/quality/environments/containers/services/postgres.ts:44-54` (`fsync=off`, `synchronous_commit=off`, `full_page_writes=off`, com tmpfs) | os três parâmetros na linha de comando do `postgres` | nativo: `ALTER SYSTEM` mais `pg_reload_conf()`, porque os três recarregam sem reiniciar (`fsync` e `full_page_writes` são `sighup`, `synchronous_commit` é `user`) | — | "E OKAY", 2026-11-04 | — |
| O contêiner do desenvolvedor sem durabilidade | U3 | `docs/how-to/local-database.md:8` (`docker run … postgres:18`) | a mesma linha do n8n | os três `-c` depois da imagem | nativo | — | "E OKAY" | — |
| A virada do minuto em `run.test.ts` e `notify.test.ts` | U4 | `aMinuteAhead` (`builder/automations/test-automations.ts:157-161`), chamado em `run.test.ts:53,195` e `notify.test.ts:46` | o próprio `scheduler.test.ts:166-171`; mastra-1.79 `4c22623e` `packages/core/src/workflows/scheduler/scheduler.test.ts:100-101` (relógio falso); n8n `2e855356` `packages/cli/test/integration/executions-pruning.service.test.ts:458` (`toFake: ['Date']`, só a data, o banco real) | o teste põe o próximo disparo no passado pelo store de agendas, em vez de esperar o relógio | nativo: `updateSchedule` do store de agendas do Mastra | — | "E OKAY" | — |
| O arrendamento do Mastra em `run.test.ts` | U4 | `LEASE_MS = 16_000` (`run.test.ts:37`), `sleep(LEASE_MS)` em `:233` | `@mastra/core` 1.79.0 `dist/storage-3afzHmR7.js:230-232` (`MASTRA_AGENT_THREAD_LEASE_TTL_MS`, 15 s por padrão); mastra-1.79 `packages/core/src/agent/run-ownership.ts:9-25` (a renovação a cada TTL/3); igual na 1.82.0 (`run-ownership.ts:7-9`) | a variável é lida quando o módulo carrega | nativo: a variável no script de teste | — | "E OKAY" | — |
| O banco do Mastra fora em `database-down.test.ts` | U4 | as 8 rotas chamadas em sequência (`builder/assistant/database-down.test.ts:70-79`), cada uma esperando `connectionTimeoutMillis: 5_000` (`platform/database.ts:20`) | — | — | nativo: as 8 chamadas em paralelo (`Promise.all`); o pool de `mastraPoolAt` (`platform/test-mastra-database.ts:48-53`) não aceita outro prazo | — | "E OKAY" | — |
| Os limites de `migrate` em `migrate.test.ts` | U4 | `migrate({ limits })` (`platform/migrate.ts:217-222`, padrão em `:44-48`), usado em `migrate.test.ts:305-306,323-325` com `pg_sleep(10)` e `pg_sleep(6.3)` | — | — | nativo: limites e esperas menores, na mesma proporção | — | "E OKAY" | — |
| As esperas fixas de `scheduler.test.ts`, `conversation-pool.test.ts` e `memberships-race.test.ts` | U4 | `scheduler.test.ts:57,61,74,177`; `conversation-pool.test.ts:7,28` (`QUIET_MS = 15_000`); `memberships-race.test.ts:28` (`pg_sleep(0.1)` por linha, 80 rodadas) | o próprio `automationClock` (`test-automations.ts:56`); T20 (esperar um evento observável) | — | nativo onde há ajuste; o que não tem ajuste vai para U7 | — | "E OKAY" | — |
| O banco de cada teste | U5 | `createTestDatabase` (`platform/test-database.ts:180-225`) cria o banco e migra a cada chamada (`:207`) | n8n `2e855356` `packages/@n8n/backend-test-utils/src/test-db.ts:75` (`CREATE DATABASE ${testDbName} TEMPLATE ${templateDb}`) e `:105-135` (o modelo montado uma vez e marcado como modelo); `packages/quality/environments/containers/test-db-global-setup.ts:61-68` (montado uma vez antes dos testes); calcom `54343aa6` `.github/actions/cache-db/action.yml:30-45` (um dump do banco semeado, restaurado por job) | migra um modelo uma vez e clona por teste | embrulhado: `CREATE DATABASE … TEMPLATE` do Postgres; nosso é o nome com o hash e a montagem sob o lock que já existe | — | "E OKAY" | — |
| Os direitos de banco que o clone não copia | U5 | a migração `20261019151514_mastra_login/migration.sql:21-22` (o `REVOKE CONNECT` e o `GRANT CONNECT` do banco do Hub); `prepareMastraDatabase` (`platform/migrate.ts:147-166`, os dois do banco do Mastra em `:161-162`) | PostgreSQL 18, `CREATE DATABASE`, Notes: "Database-level configuration parameters (set via ALTER DATABASE) and database-level permissions (set via GRANT) are not copied from the template" | o clone traz tudo de dentro do banco, nada do nível do banco | embrulhado: reaplicados a cada clone; `catalog.test.ts:95` prova que nada ficou de fora | — | "E OKAY" | — |
| A recusa da configuração | U6 | `boot.test.ts:60-67` e `:89-95` geram 45 testes, cada um um processo `main.ts` por `startHub` (`platform/test-hub-process.ts:25-40`) | o próprio `platform/config.test.ts:12-23` (`refusal`, que chama `readConfig` dentro do processo); twenty `b76d0217` `packages/twenty-server/test/integration/utils/create-app.ts:31-39` e activepieces `f34c43cd` `packages/server/api/test/helpers/test-setup.ts:41-48` (o app no mesmo processo do teste) | a função da fronteira testada dentro do processo; o processo inteiro só para a ligação de saída | nativo: um caso por recusa em `config.test.ts` | — | "E OKAY" | — |
| O pool, o prazo de leitura e o orçamento da poda | U7 | `POOL_LIMITS` (`platform/database.ts:15-23`) e `READ_DEADLINE_MS` (`:26`), usados por `openDatabase` (`:236-237`) e `openMastraPool` (`:323-324`); `PRUNE_BUDGET_MS` (`hub/apps/prune.ts:104,121`) | o próprio `deadlines?: ConnectorDeadlines` (`main.ts:142`, `hub/connectors/public.ts:47,78`): uma opção com o valor de produção por padrão; o mesmo padrão de relógio injetado das linhas acima | o valor entra por dependência e cai no de produção quando ninguém o passa | embrulhado: um parâmetro opcional por constante | — | "E OKAY" | — |
| O atraso da retentativa do Mastra | U7 | `stabilityProcessors` e `accountRetry` (`builder/model-accounts/processors.ts:369-401`) sobre `defaultStabilityErrorProcessors`, que não recebe `delayMs` | `@mastra/core` 1.79.0 `dist/processors/stream-error-retry-processor.d.ts:19-41` (`delayMs`, `maxRetryAfterMs` de `StreamErrorRetryProcessorOptions`) e `dist/processors/stability-defaults.d.ts:81-98` (400 repetido depois de 2 s) | a retentativa aceita o seu atraso na construção | embrulhado: um `new StreamErrorRetryProcessor({ …, delayMs })` no lugar do que os padrões montam, com as opções dos padrões (valores no JS, não no `.d.ts`), e `accountRetry` em volta como hoje; só se a medida do passo 1 de U7 pedir, senão a peça fica de fora | o passo 1 de U7 e o "Parar se" dele | "E OKAY" | — |
| O conserto 6 | fica de fora | `apps/server/package.json:13` (`--test-concurrency=1`); `ci.yml:135-136` | langfuse `8ee97c44` `web/vitest.config.mts:18-28,238-248` (`isolate: false` só para os arquivos sem estado global, medidos 371 s de import contra 264 s de teste); n8n `2e855356` `packages/cli/vitest.config.base.ts:60-65` (um processo por arquivo, de propósito) | — | nativo (`node --test --test-concurrency=N`; `--test-isolation=none` do Node 24), e fica de fora até ser medido de novo depois de U7 | — | "E OKAY" ("fica de fora") | — |

**Duas formas comparadas para montar o modelo de U5.** A: na primeira chamada de
`createTestDatabase`, sob o `withRoleLock` que já existe, pelo nome com o hash. B: uma vez antes dos
testes, pelo `--test-global-setup` do Node 24, como o `globalSetup` do n8n. Fica a A. Um arquivo de
teste rodado sozinho (`node --test <arquivo>`, como a medida local de cada unidade) também acha ou
monta o modelo. O lock já serializa os processos. E nada muda no script de `npm test`. Na B, um
arquivo rodado fora do script ficaria sem modelo.

**Duas formas comparadas para U1.** A: o mesmo `jq` do passo vizinho, com o orçamento lido de
`ci.yml` por `yq`. B: um script em `scripts/`, testado por `test:scripts`. Fica a A. A conta é uma
divisão por job, e a B pediria a instalação no job `ci`, de 28 a 46 s a mais no fim de todo run. A
regra que tem estado, os três runs seguidos, fica no script de U2, que roda fora do caminho do PR.

**A medida do transplante.** Nada trazido do repositório antigo.

**A dívida.** Nenhuma.

## U1 O aviso de orçamento em cada run

**Base e modelo.** O `main` em `a31b7faa`. Sonnet: um passo de workflow com a forma do vizinho.

### As linhas da tabela

"O orçamento de cada job" e "O aviso a 70% em cada run".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `.github/workflows/ci.yml` | Muda o job `ci`: um checkout esparso e um passo novo | o CI |

### Os contratos que a unidade cria

O texto do aviso, "<job> usou <m> de <t> min (<p>%)", com uma casa decimal e vírgula (L23), e a
tabela "### Jobs contra o orçamento" (Job, Usou (min), Limite (min), %). Não há tipo nem rota.

### As skills e a leitura

O passo vizinho (`ci.yml:371-390`) e o comentário dos verificadores de workflow (`ci.yml:80-84`).

### A ordem do trabalho

1. No job `ci` (`ci.yml:350-357`), um `actions/checkout` no mesmo pin dos outros jobs, com
   `persist-credentials: false` e `sparse-checkout: .github/workflows/ci.yml`.
2. Depois do passo "The jobs and the slowest steps of this run", um passo "The jobs against their
   budget", com `if: always()` e `continue-on-error: true`. Ele lê de `ci.yml`, por `yq`, o par
   `(.name // chave) → timeout-minutes` de cada job, e os jobs da tentativa com a mesma chamada
   `gh api` do vizinho. Um job da API acha o seu orçamento pelo nome, sem o sufixo de matriz
   " (N)": "server (2)" → `server`, e `sankhya-docs` pelo seu `name`, "a documentação do Sankhya"
   (`ci.yml:175-176`). O passo ignora o job `ci`. Para cada job, ele divide a duração em minutos pelo
   orçamento e escreve a linha do job na tabela. A partir de 0,70, escreve também
   `::warning title=Orçamento do CI::<texto>`.

### Como se prova

O run do próprio pull request (critério 1): com os números de hoje, os shards do servidor acima de
70% aparecem como aviso, e o pull request cita o run. `actionlint` e `zizmor` no job `check`
(critério 2).

### Parar se

- A imagem `ubuntu-24.04` não tem `yq`: pare. Uma action nova para instalá-lo é uma dependência (L16)
  e volta ao cartão.
- O `zizmor` acusa o checkout no job `ci`: corrija no workflow. Um falso positivo leva o comentário
  do próprio `zizmor` (`ci.yml:80-84`).

## U2 O issue agendado

**Base e modelo.** O `main` em `a31b7faa`. Sonnet.

### As linhas da tabela

"O orçamento de cada job" e "O issue com três runs seguidos a 85%".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `.github/workflows/` | Cria `ci-budget.yml` | o agendador do GitHub |
| `scripts/` | Cria `ci-budget.ts` e `ci-budget.test.ts` | `ci-budget.yml`; `test:scripts` |

### Os contratos que a unidade cria

Em `scripts/ci-budget.ts`, sem corpo:

```ts
type JobRun = { job: string; minutes: number; conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'timed_out' }
type CiRun = { id: number; sha: string; conclusion: 'success' | 'failure' | 'cancelled'; jobs: JobRun[] }
type Budgets = Record<string, number> // (.name // chave) do job em ci.yml → timeout-minutes, como em U1
type OverBudget = { job: string; percents: readonly [number, number, number]; runs: readonly [number, number, number] }
export function overBudget(runs: CiRun[], budgets: Budgets): OverBudget[]
export function issueBody(over: OverBudget[], runs: CiRun[], budgets: Budgets): string
```

- As respostas da API e os orçamentos entram por esquemas Zod (C27), na linha de comando do script.
- Um run `cancelled` em que nenhum job chegou ao seu orçamento é um run cancelado pela concorrência
  (`ci.yml:13-15`): fica fora da sequência, sem quebrá-la e sem contar. Um job que chegou ao
  orçamento conta como 100%.
- O título "CI acima do orçamento" e os limiares 0,70 e 0,85 têm um dono cada: o 0,70 é de U1, em
  `ci.yml`; o 0,85, o três e o título são de `ci-budget.ts` (C26).

### As skills e a leitura

`zod` (`docs/reference/stack.md`, linha de `scripts`). As duas referências da linha da tabela.

### A ordem do trabalho

1. `scripts/ci-budget.ts` e o seu teste, com respostas da API gravadas e reduzidas aos campos
   usados (id, sha, conclusão, nome do job, início e fim), sem nome de pessoa nem mensagem de
   commit (S40). O teste cobre os critérios 3 e 4.
2. `.github/workflows/ci-budget.yml`. O gatilho é `schedule: cron: '0 11 * * *'` (08:00 em Brasília)
   mais `workflow_dispatch`. No topo, `permissions: {}` e `concurrency: { group: ci-budget,
   cancel-in-progress: false }`. O job tem `timeout-minutes: 5` e `permissions` com `actions:
   read`, `contents: read` e `issues: write`. Os passos: o checkout (`persist-credentials: false`),
   `./.github/actions/install`, e os 10 últimos runs completos de `ci.yml` em `main` (`gh api
   repos/{repo}/actions/workflows/ci.yml/runs?branch=main&event=push&status=completed&per_page=10`),
   com os jobs da última tentativa de cada um. Os orçamentos vêm por `yq`, como em U1. Depois,
   `node scripts/ci-budget.ts`. O passo procura o issue aberto com esse título exato. Se ele
   existe, `gh issue edit` troca o corpo pela tabela de hoje. Se não existe e a regra dos três runs
   disparou, `gh issue create` o abre. Fora isso, não faz nada. A tabela vai também para o resumo
   do job.

### Como se prova

O critério 3 e o 4 pelo teste. O critério 5 pelo `actionlint` e pelo `zizmor`. Um
`workflow_dispatch` em `main`, depois do merge, abre o issue com os números de hoje, e o pull request
o cita.

### Parar se

- O `zizmor` pede uma permissão a mais que as três: pare e diga qual.
- O issue precisa de um rótulo para ser achado: ele é achado pelo título. Um rótulo novo volta ao
  cartão.

## U3 Conserto 5: o Postgres dos testes sem durabilidade

**Base e modelo.** O `main` depois de U1. Sonnet.

### As linhas da tabela

"O Postgres do CI sem durabilidade" e "O contêiner do desenvolvedor sem durabilidade".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `.github/actions/test-database/` | Muda `action.yml`: um passo novo depois do login dono | os jobs `server`, `e2e`, `removals` e `image` |
| `docs/how-to/` | Muda `local-database.md:8` | quem roda os testes na sua máquina |

### Os contratos que a unidade cria

Nenhum.

### As skills e a leitura

`docs/how-to/local-database.md`; PostgreSQL 18, "ALTER SYSTEM" e as páginas de `fsync`,
`synchronous_commit` e `full_page_writes` (o contexto de recarga de cada um).

### A ordem do trabalho

1. Em `action.yml`, depois de "The owner of the test databases is not a superuser", um passo que
   roda `docker exec "$CONEXUS_TEST_DATABASE_CONTAINER" psql --username postgres` com um
   `--command` por instrução: `alter system set fsync = off`, `alter system set synchronous_commit =
   off`, `alter system set full_page_writes = off` e `select pg_reload_conf()`. Depois, os três
   `show`. O `ALTER SYSTEM` não roda dentro de uma transação, então cada instrução vai no seu
   `--command`.
2. Em `local-database.md:8`, `-c fsync=off -c synchronous_commit=off -c full_page_writes=off` depois
   de `postgres:18`, com uma frase: são dados de teste descartáveis.

### Como se prova

Os critérios 6 e 7. O ganho no CI é de 10 a 15 s por shard, abaixo do ruído do maior shard. A prova
do CI é a soma dos checkpoints (critério 7), não o tempo do shard. Na máquina local o ganho é
grande, e o pull request registra o teste típico com Hub antes e depois, como na medida da
investigação (de 2,5–2,9 s para 0,8–1,3 s no WSL).

### Parar se

- Um shard passa a falhar com os três `off`: pare. Algum teste depende da durabilidade, e isso é um
  defeito a investigar (T4).

## U4 Conserto 2: as esperas tiradas pelos ajustes que já existem

**Base e modelo.** O `main` depois de U3. Sonnet: a forma de cada troca está escrita aqui.

### As linhas da tabela

"A virada do minuto…", "O arrendamento do Mastra…", "O banco do Mastra fora…", "Os limites de
`migrate`…" e "As esperas fixas…".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/automations/` | Muda `run.test.ts`, `notify.test.ts`, `scheduler.test.ts`, `test-automations.ts` | os testes de automações |
| `apps/server/src/builder/assistant/` | Muda `database-down.test.ts` | — |
| `apps/server/src/builder/conversation/` | Muda `conversation-pool.test.ts` | — |
| `apps/server/src/hub/identity/` | Muda `memberships-race.test.ts` | — |
| `apps/server/src/platform/` | Muda `migrate.test.ts` | — |
| `apps/server/package.json` | Muda o script `test` (`:13`) | o CI; quem roda `npm test` |

### Os contratos que a unidade cria

Nenhum. A variável `MASTRA_AGENT_THREAD_LEASE_TTL_MS` tem um dono, o script `test`, e `run.test.ts`
lê dela o seu `LEASE_MS` (com 15 s de padrão quando ela falta, para um arquivo rodado fora do
script).

### As skills e a leitura

`mastra` (`node_modules/@mastra/core/dist/docs` na versão instalada). As linhas da tabela.

### A ordem do trabalho

Antes de cada troca, a medida A do arquivo. Cada troca é uma por arquivo e muda só o modo de
esperar (critério 8). Regras: T20, T4.

1. A virada do minuto. Em `run.test.ts:53,195` e `notify.test.ts:46`, o teste cria a automação com
   uma cadência qualquer e põe o próximo disparo no passado pelo store de agendas, como
   `scheduler.test.ts:166-171` faz. O disparo continua `SCHEDULED`. `aMinuteAhead` sai de
   `test-automations.ts` se ninguém mais o chama.
2. O arrendamento. O script `test` de `apps/server/package.json:13` ganha
   `MASTRA_AGENT_THREAD_LEASE_TTL_MS=3000` (a renovação fica a cada 1 s, TTL/3). `run.test.ts:37`
   lê o mesmo valor, mais uma margem de 1 s.
3. `scheduler.test.ts:57,61,74,177`: cada espera fixa coberta pelo `automationClock`
   (`test-automations.ts:56`) passa por ele. A que não tem ajuste fica, com um comentário do porquê,
   e vai para a lista de U7.
4. `database-down.test.ts:70-79`: as 8 rotas em paralelo, cada resposta conferida como hoje.
5. `migrate.test.ts:305-306` e `:323-325`: os limites e o `pg_sleep` menores, na mesma proporção,
   sem mudar o que cada caso prova. O caso de `:81-87` (os 17 s contra o prazo de 15 s das consultas
   do Hub) espera o prazo de produção e vai para U7.
6. `conversation-pool.test.ts:28`: em vez de dormir 15 s, espera `open()` chegar a 0, com um prazo
   (T20). O resto da espera é o ocioso de 10 s do pool, que vai para U7.
7. `memberships-race.test.ts:28`: o `pg_sleep` do gatilho plantado menor, desde que a corrida
   continue acontecendo. As duas linhas desse arquivo em `scripts/removals.json` provam isso no CI.

### Como se prova

O critério 8, pelo job `removals` do CI. O critério 9, pela tabela "Test files". A medida A/B por
arquivo vai no pull request.

### Parar se

- Um teste passa a falhar de vez em quando com o prazo menor: pare. A espera escondia outra espera,
  e isso é defeito (T4). Não volte com um `sleep`.
- Pôr o disparo no passado muda o tipo do disparo ou o número de runs que o teste confere: pare e
  diga qual teste.

## U5 Conserto 1: migrar uma vez e clonar por teste

**Base e modelo.** O `main` depois de U4. Opus: o modelo é montado sob um lock entre processos, e um
modelo pela metade não pode ser clonado (concorrência).

### As linhas da tabela

"O banco de cada teste" e "Os direitos de banco que o clone não copia".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/` | Muda `test-database.ts` (`createTestDatabase`) e `test-database.test.ts` | todos os testes que pedem um banco |

### Os contratos que a unidade cria

Nenhum tipo exportado novo: `createTestDatabase(t, locale?)` mantém a assinatura de
`test-database.ts:180`. Dentro do arquivo:

- O nome do modelo, `conexus_template_<hash>`, com os 12 primeiros caracteres do sha256 dos nomes e
  do conteúdo de `migrations/` (`MIGRATIONS_FOLDER`, `platform/database.ts:14`), em ordem. Um
  dono: uma função do arquivo, que o teste novo chama.
- O modelo é só o banco do Hub. O banco do Mastra de cada teste continua um `create database`
  vazio mais os dois direitos de `migrate.ts:161-162`, porque o `migrate` só o cria e dá os
  direitos, e as tabelas dele nascem quando o login do Mastra começa (`migrate.ts:143-145`): clonar
  um `_mastra` vazio não ganha nada (apagar antes de acrescentar).
- O modelo é montado com um nome provisório, migrado, fechado e marcado com `ALTER DATABASE … RENAME
  TO` mais `ALTER DATABASE … IS_TEMPLATE true`. O `<provisório>_mastra` que esse `migrate` cria é
  apagado ali mesmo. O dono dos bancos (`conexus_owner`, que não é superusuário) é dono do modelo e
  pode cloná-lo.

### As skills e a leitura

`pg` (`docs/reference/stack.md`). PostgreSQL 18, "CREATE DATABASE" (Notes: o modelo sem outra
ligação; o que não se copia) e "Template Databases". As referências da linha da tabela.

### A ordem do trabalho

1. Apagar antes de acrescentar: o `migrate` de toda chamada (`test-database.ts:207`) sai do caminho
   comum. O caminho `locale: 'C'` (`:191-192`) continua `template template0` e migra, como hoje.
2. Sob o `withRoleLock` (`:157-167`), o modelo do hash atual: se `pg_database` não o tem, apaga um
   provisório que tenha sobrado (e o `_mastra` dele) e monta o modelo como diz o contrato. Os
   outros processos esperam o lock e o acham pronto.
3. O banco do teste: `create database <nome> template <modelo>` para o Hub e `create database
   <nome>_mastra` para o Mastra. Depois, os direitos de banco que o clone não traz, como as
   migrações e `migrate` os dão: `20261019151514_mastra_login/migration.sql:21-22` no banco do Hub
   e `migrate.ts:161-162` no do Mastra. O resto de `createTestDatabase` fica igual.
4. `test-database.test.ts`: o nome do modelo muda quando uma migração muda (critério 11).
5. Os modelos de hashes antigos ficam no servidor de teste. No CI o contêiner some no fim do job.
   Na máquina local, `local-database.md` ganha uma linha que diz como apagá-los, e uma frase:
   ao trocar `CONEXUS_TEST_RUNTIME_PASSWORD`, apague os modelos, porque a senha do login só é
   reparada quando um modelo é montado, e sem isso todo teste receberia 28P01.

### Como se prova

O critério 10 pelo `catalog.test.ts:95`, sobre o clone, mais uma vez sem o `GRANT` do passo 3, para
mostrar que ele falha (no pull request, não no código). O 11 pelo teste novo. O 12 pelo
`migrate.test.ts` e pelo caso de `locale`. A medida A/B: os 4 arquivos "só Hub" da investigação
(`hub/identity/identity.test.ts`, `hub/projects/projects.test.ts`,
`hub/connectors/executor.test.ts`, `hub/connectors/connections.test.ts`), em que a soma caiu de
143,4 s para 115,8 s (−19%) no laboratório. No CI, a estimativa é de 500 a 570 s a menos na soma,
cerca de 90 s por shard.

### Parar se

- `catalog.test.ts` acha no clone uma diferença que o passo 3 não cobre: pare e diga qual. Não
  acrescente ao clone um direito que nenhuma migração dá.
- `CREATE DATABASE … TEMPLATE` recusa porque alguém está ligado ao modelo: ache a ligação aberta. Não
  ponha espera nem nova tentativa.
- Um teste deixa um papel ou uma senha mudados, e os arquivos seguintes do shard caem com 28P01:
  ache o teste e faça-o devolver o que mudou (T20). Não volte com `migrate` por teste.
- O `identity.test.ts:166` ("registros: entrar, recusa, limite e sair…") falha de vez em quando. A
  investigação o viu falhar com e sem o modelo, sob carga. Isso é defeito à parte (T4): abra o issue
  e não o pule.

## U6 Conserto 4: a recusa da configuração dentro do processo

**Base e modelo.** O `main` depois de U5. Sonnet.

### As linhas da tabela

"A recusa da configuração".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/` | Muda `boot.test.ts` | — |
| `apps/server/src/platform/` | Muda `config.test.ts` | — |

### Os contratos que a unidade cria

Nenhum.

### As skills e a leitura

`platform/config.ts:236-276` (`readConfig` e as falhas `CONFIG_INVALID`); `config.test.ts:12-23`.

### A ordem do trabalho

1. Os 45 casos de `boot.test.ts:60-67` (`WITH_FILE`, `:32`) e `:69-95` (`OUT_OF_FORMAT`) passam para
   `config.test.ts`, cada um pelo `refusal(env, variável)`. Um caso que `config.test.ts` já tem não
   se repete.
2. Em `boot.test.ts` ficam dois casos de processo: uma variável faltando e um valor fora do formato,
   cada um saindo com 1 e a linha `CONFIG_INVALID` (critério 14). Os outros 14 testes do arquivo
   ficam como estão.

### Como se prova

Os critérios 13 e 14. A linha de `scripts/removals.json` de `config.test.ts` continua provando a sua
proteção no job `removals`. No CI, `boot.test.ts` cai de cerca de 207 s para cerca de 60 s.

### Parar se

- Uma recusa só acontece no processo, e `readConfig` a aceita: pare. Ela fica em `boot.test.ts`, e o
  pull request diz qual é e por quê.

## U7 Conserto 3: os ajustes de tempo que faltam

**Base e modelo.** O `main` depois de U6. Sonnet: um parâmetro opcional por constante, no padrão de
`deadlines` que já existe. Esta unidade muda código de produção. Por isso é uma unidade com o seu
motivo, e não uma correção de uma linha (AGENTS.md): cada parâmetro novo é uma porta que a
produção não usa e que precisa provar que fica com o valor de hoje (critério 15).

### As linhas da tabela

"O pool, o prazo de leitura e o orçamento da poda" e "O atraso da retentativa do Mastra".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/` | Muda `database.ts` (`openDatabase`, `openMastraPool`), `test-database.ts`, `test-mastra-database.ts`, `database.test.ts`, `migrate.test.ts` | todo o servidor; os testes |
| `apps/server/src/hub/apps/` | Muda `prune.ts`, `public.ts`, `prune.test.ts`, `repair.test.ts` | o Hub |
| `apps/server/src/builder/model-accounts/` | Muda `processors.ts` e `queue.test.ts`, se o passo 1 mandar | os controladores |
| `apps/server/src/builder/conversation/` | Muda `conversation-pool.test.ts` | — |

### Os contratos que a unidade cria

Sem corpo, nos arquivos donos:

```ts
// platform/database.ts
type PoolTimings = { readonly idleTimeoutMillis: number; readonly readDeadlineMs: number }
export function openDatabase(deps: { url: DatabaseUrl; log: FailureLog; timings?: PoolTimings }): Database
export function openMastraPool(deps: { url: DatabaseUrl; log: FailureLog; timings?: Pick<PoolTimings, 'idleTimeoutMillis'> }): MastraPool
// hub/apps/prune.ts: o orçamento entra pela dependência que já chega à poda, com PRUNE_BUDGET_MS por padrão
```

O padrão de cada um é a constante de hoje, que continua dona do valor (C26). `main.ts` não passa
nenhum.

### As skills e a leitura

`pg` e `mastra` (`docs/reference/stack.md`). `main.ts:142` e `hub/connectors/public.ts:47,78`, o
modelo de uma opção com padrão de produção.

### A ordem do trabalho

1. Medir antes. A espera da retentativa do Mastra em `builder/model-accounts/queue.test.ts` é um
   palpite da investigação (~20 s). Meça o arquivo com e sem a espera. Se não passar de 5 s, essa
   parte fica de fora, e o pull request diz o número. Se passar, `defaultStabilityErrorProcessors`
   não recebe `delayMs` (`stability-defaults.d.ts:81-98`), então `stabilityProcessors`
   (`processors.ts:392-401`) troca o `StreamErrorRetryProcessor` que os padrões montam por um
   `new StreamErrorRetryProcessor({ …, delayMs })` construído com as mesmas opções dos padrões, e
   o embrulha em `accountRetry` como hoje. As opções aceitas estão em
   `stream-error-retry-processor.d.ts:19-41`, mas os valores dos padrões não estão no `.d.ts`: moram
   no JS de `defaultStabilityErrorProcessors` (`dist/agent-tuAMgHe3.js:2065-2093` na 1.79.0:
   `maxRetries` 2, `delayMs` 3e3 e três matchers). O matcher `isECONNRESETError` não é público na
   1.79.0 nem na 1.82 (`packages/core/src/processors/index.ts:1037-1041` da estante `mastra-1.82`),
   então a peça só entra se a medida do passo 1 passar de 5 s e se o Mastra instalado no dia expuser
   esse matcher; senão o pull request diz o número e para, como o "Parar se" manda. O `delayMs`
   curto chega só pelo caminho de teste. O cartão do Mastra 1.82
   (https://github.com/developmentconexus-ops/conexus/pull/689) pode mudar isso antes de U7: leia a
   versão instalada no dia.
2. `database.ts`: as opções do contrato. `createTestDatabase` e `mastraPoolAt` passam valores curtos
   onde um teste espera o ocioso ou o prazo de leitura.
3. Os testes que esperavam esses prazos passam a recebê-los curtos e continuam falhando quando o
   prazo não é cumprido (critério 16): `database.test.ts` (o `READ_DEADLINE_MS` duas vezes e os dois
   `whenIdle`, `:38`, `:185`); `migrate.test.ts:81-87` (o `pg_sleep(17)`, agora contra o prazo
   curto); `conversation-pool.test.ts`; `hub/apps/repair.test.ts:137`; `hub/apps/prune.test.ts:121-126`.
   Mais o que U4 deixou para esta lista.
4. T27: as linhas novas de produção passam pela mutação com os testes que as possuem.

### Como se prova

O critério 15 na revisão do diff. O 16 pelos testes da lista. No CI, a estimativa é de 100 a 150 s a
menos na soma. O critério 17 fecha a etapa.

### Parar se

- Um valor curto faz um teste comum (que não esperava o prazo) falhar: o teste dependia do prazo de
  produção. Diga qual e pare.
- As opções com que os padrões montam a retentativa não podem ser reproduzidas pela API pública do
  Mastra (o `.d.ts` não traz os valores e o matcher de `ECONNRESET` não é público): pare. Copiar
  valores internos da biblioteca é remendo e volta ao cartão.
- Uma constante só pode ser trocada por uma variável de ambiente: pare. Variável nova de produção
  volta ao cartão.

## O fechamento

O pull request de fechamento deste cartão leva o texto do método (L20). Ele é escrito ali, não numa
unidade:

1. **A regra do teste e do relógio**, em `docs/guides/testing.md`, ao lado de T20: um teste não
   espera o relógio ou o prazo de produção quando o código deixa injetar o relógio ou o prazo. Uma
   espera fixa de um segundo ou mais diz por quê.
2. **A revisão de saúde do CI a cada fechamento de etapa**, em `docs/guides/delivery.md` L19, com as
   palavras que a nomeiam (o guia tem 42 palavras livres sob o seu teto), e o procedimento num
   `docs/how-to/ci-health.md`. Os números de sempre: a soma do passo de teste e o maior shard em
   `main`, na mediana dos 10 últimos runs, contra a última revisão. Os arquivos novos e os que
   cresceram, pela tabela "Test files". O aviso de U1 e o issue de U2, que a revisão fecha quando
   a mediana volta abaixo de 85%. Quem faz é um agente que não construiu a etapa. Ele acha o porquê
   de cada salto e propõe consertos de raiz com um contrafactual medido, e o fundador decide entre a
   raiz agora e uma ponte com data para sair.

Parar se: `check-method-freeze` recusa o fechamento porque outra trilha tem um cartão em construção
naquele dia. O texto espera a palavra do fundador para a sua própria mudança de método (L20).
