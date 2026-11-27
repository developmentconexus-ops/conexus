# A rodada que se vê

Trilha Dados, a etapa entre a `T1` e a `T2`, pedida pelo fundador em 2026-11-27 ("eu não consigo
saber o que está acontecendo agora enquanto está sendo copiado fazendo os syncs entende? Como a Nekt
faz?"). A pergunta: "Enquanto o Sankhya copia, eu vejo em Dados qual tabela está indo, quantas linhas
já foram, quais já terminaram e quais esperam, e depois abro cada rodada com as tabelas dela?"

O estudo fica fora do repositório (delivery L21): `conexus-rodada-que-se-ve`, de 2026-11-27.
`EST:§N` é a seção `N` do relatório `data/conexus-rodada-que-se-ve/report.md` do firstmate. As
capturas da Nekt são as de `conexus-nekt-rea`, de 2026-11-14 (`runs-2.png`, rodando; `runs-3.png`,
terminada).

Cada linha do `main` citada foi lida em `dfb1833e9`, o merge do pull request 1499. As versões são as
instaladas: `@mastra/core` 1.83.0, `singer-sdk` 0.54.9, `meltano` 4.4.1 (`apps/extraction/pyproject.toml:11-14`).
Nenhum pacote novo.

As cinco decisões do fundador já têm a palavra dele, de 2026-11-27: "A recomendado, B Sim, C Sim, D
Sim, E Deixar como issue". O cartão está escrito com elas.

**Antes da construção.** A `T1` fecha antes (delivery L5): este cartão espera no seu rascunho. Os
ajustes de tela da `T1` (https://github.com/developmentconexus-ops/conexus/issues/1491) mudam
`lake-tabs.tsx` e `lake-runs.tsx`; o G1 espera o merge deles, porque a U3 e a U4 mudam os mesmos arquivos (delivery L1).

## A página do fundador

**No fim desta etapa**, enquanto uma cópia roda, você vê em Dados o estado de cada tabela: Na fila,
Copiando com as linhas que já foram, Copiada, Atualizando o lago ou Com erro. A rodada mostra há quanto
tempo roda. Na página da ligação, a aba **Rodadas** lista as rodadas, e cada uma abre com as suas
tabelas, as linhas, o início, o fim e o erro de cada uma. É o que a Nekt mostra na rodada dela
(Status, Duração e "Data streams", uma linha por tabela).

**O roteiro de uso.**

1. Na ligação do Sankhya, você clica **Rodar agora** e abre Dados. A rodada mostra "Rodando · há 1 min".
   As tabelas da ligação mostram "Na fila".
2. Uns segundos depois, a primeira tabela mostra "Copiando · 30.000 linhas", e o número sobe a cada
   poucos segundos. As outras seguem "Na fila".
3. A primeira vira "Copiada · 1.204.511 linhas", e a seguinte passa a "Copiando". No fim da cópia, cada
   tabela passa por "Atualizando o lago" e, quando a rodada fecha, todas ficam "Em dia".
4. Na página da ligação, você abre a aba **Rodadas**. A rodada de agora está no topo. Você a abre e vê
   cada tabela com Estado, Início, Fim, Duração e Linhas.
5. Você abre uma rodada antiga que terminou com erro. A tabela que falhou mostra "Com erro" e a frase
   do erro; as que terminaram antes mostram as linhas delas, e as que a cópia não alcançou mostram "Não
   chegou".

**O que você faz, e quando.** Antes: nada; as cinco decisões já têm a sua palavra. No começo: aprova
esta página. No fim, com o G1 publicado: faz o roteiro na nuvem com o Sankhya, diz o que viu e aprova os
textos das telas.

**A visão.**

- "O estado de um trabalho é o do servidor: o modelo nunca declara o trabalho pronto, e nenhuma tela
  diz 'pronto' antes de o servidor confirmar" (`VISION.md:22`, O dado é verdadeiro e diz de onde
  veio): cada estado vem do placar que a cópia mandou, e "Em dia" só aparece com a rodada fechada.
- "O que não se sabe aparece como indisponível, nunca como zero" (`VISION.md:21`): antes do primeiro
  placar a tabela diz "Na fila", e não "0 linhas".

Nada cruza a visão.

**Fica de fora.**

- **Os logs da rodada na tela** (decisão D, "Sim", depois): os logs moram no CloudWatch, ler de lá é
  chamada paga, e os nossos logs só levam campos de diagnóstico (security S41).
- **Uma tabela com erro deixar as outras terminarem** (decisão E): na issue
  https://github.com/developmentconexus-ops/conexus/issues/1501. Hoje a primeira falha para a rodada.
- **A máquina ao vivo** (memória e CPU durante a rodada): a máquina já aparece no fim da rodada (G4 do
  Lago 2); o placar responde ao "o que está acontecendo".
- **O gatilho da rodada** (relógio ou Rodar agora, como a coluna Trigger da Nekt): o `lake_run` não o
  guarda, e nada no roteiro pede.
- **Cópia em paralelo**: decidido antes, "sem cópia paralela por agora"; há sempre uma tabela
  Copiando.
- **As issues `next-card` das pastas da etapa**: nenhuma tem gatilho nas peças novas.

**As decisões suas nesta etapa.** Todas respondidas em 2026-11-27.

- **A. Como o placar chega ao Hub.** "A recomendado": a cópia manda o placar pela fila SQS que já
  existe, a cada 10 s e a cada tabela que termina. O Hub grava sem fechar a rodada; o resultado e o
  fim do ECS seguem fechando. Veredito: embrulhado (a fila é nativa; a mensagem de placar é nossa). O
  Airbyte faz o mesmo salto, a cada 10 s, por uma rota do servidor.
- **B. Os estados por tabela.** "Sim": Na fila, Copiando, Copiada, Atualizando o lago, Com erro.
- **C. A aba Rodadas na ligação.** "Sim", mantendo a da tabela.
- **D. Os logs na tela.** "Sim", ficam para depois.
- **E. Uma tabela com erro para a rodada inteira.** "Deixar como issue": a #1501.

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 | U1 | O Hub recebe o placar: a mensagem `PROGRESS`, as colunas novas, o ramo da fila que grava sem fechar, e o fechamento que guarda o início e o fim de cada tabela | `apps/server/src/hub/copies`, `apps/server/migrations`, `apps/extraction/contract` | data | — |
| G1 | U2 | A tarefa manda o placar: o alvo marca o início e o fim de cada tabela, e um batedor de 10 s manda `PROGRESS` com a fase | `apps/extraction/src/conexus_extraction`, `apps/extraction/tests` | testing | U1 |
| G1 | U3 | O placar na tela: a visão da rodada aberta com as tabelas, o estado de cada tabela em Dados e na aba Tabelas da ligação, e a duração contando | `packages/hub-api/src`, `apps/server/src/hub/copies`, `apps/web/src/hub/copies`, `apps/web/src/hub/connectors` | web | U1 |
| G1 | U4 | A aba Rodadas da ligação: a rota das rodadas de uma cópia, com as tabelas de cada uma, e a aba | `packages/hub-api/src`, `apps/server/src/hub/copies`, `apps/web/src/hub/connectors` | web | U3 |

Um pull request só (delivery L9): as quatro unidades somam ~1.450 linhas, dentro do L2, e um
commit por unidade, nesta ordem.

**Orçamento de código alterado.** U1: ~350 linhas. U2: ~200. U3: ~450. U4: ~450. Total: ~1.450,
abaixo das 4.000 (delivery L2).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Um `PROGRESS` de uma rodada aberta grava o placar dela; a rodada continua aberta e a mensagem sai da fila | `lake-queue.test.ts`, "o placar grava e não fecha" | must |
| 2 | U1 | Um `PROGRESS` com `seq` menor ou igual ao gravado não muda nada (a fila não garante ordem) | `lake-queue.test.ts`, "o placar velho não volta" | must |
| 3 | U1 | Um `PROGRESS` de outra tentativa (`attempt` diferente do da rodada) ou de uma rodada fechada ou desconhecida sai da fila sem gravar | `lake-queue.test.ts`, "o placar de outra tentativa ou de rodada fechada é descartado" (a rodada nasce com `attempt` 1, `lake-run.ts:316`: o teste manda um `attempt` 2 feito à mão) | must |
| 4 | U1 | O banco fora ao gravar o placar: o Hub registra `COPY_PROGRESS_NOT_WRITTEN` e tira a mensagem da fila; a rodada não fecha e o próximo placar grava | `lake-queue.test.ts`, "o banco fora não prende o placar", com o `flakyDatabase` do teste "o banco fora" de hoje (`lake-queue.test.ts:221-231`), a rodada já em `open` (`running(on)` e `start`), para a recusa cair no `UPDATE` do placar | must |
| 5 | U1 | Ao fechar a rodada (resultado, fim do ECS, varredura, parada), o placar sai da rodada, e cada `lake_table_run` guarda o início e o fim que o resultado trouxe; um resultado sem eles (imagem antiga) fecha igual, com os dois nulos | `lake-queue.test.ts`, "o fechamento guarda início e fim e limpa o placar"; `lake-queue.test.ts`, "o resultado antigo fecha" | must |
| 6 | U1 | O banco recusa placar numa rodada fechada e `progress` sem `progress_seq` (as restrições `lake_run_progress`) | `lake-queue.test.ts`, "o banco recusa placar em rodada fechada", por SQL direto do auxiliar `test-lake-queue.ts`, sem passar pelo `handle` (o `WHERE` do `handle` pararia antes) | must |
| 7 | U2 | Durante a cópia, a tarefa manda `PROGRESS` a cada 10 s e logo que uma tabela termina, com `seq` crescente, todas as tabelas pedidas, as linhas lidas e gravadas, o início e o fim de cada uma | `tests/test_progress.py`, "o batedor manda o placar", com cada mensagem validada contra `copy-task.schema.json` | must |
| 8 | U2 | Na fusão do Athena, a fase é `UPDATING` com a tabela da vez, mandada ao começar cada tabela | `tests/test_entry.py`, "a fusão diz a tabela da vez" | must |
| 9 | U2 | A fila recusar um `PROGRESS` não muda a rodada: a tarefa registra `PROGRESS_NOT_SENT` e segue; o resultado sai como hoje | `tests/test_progress.py`, "a fila recusa e a rodada segue" | must |
| 10 | U2 | O batedor para antes do `RESULT`: nenhum `PROGRESS` sai depois dele | `tests/test_entry.py`, "nada depois do resultado" | must |
| 11 | U2 | Nenhum `PROGRESS` leva conteúdo de linha: só nomes de tabela, números, horas e a fase (security S41) | `tests/test_progress.py`, "o placar não leva linha" | must |
| 12 | U3 | Em Dados, com a rodada aberta, cada tabela mostra o seu estado: "Na fila" sem placar, "Copiando · N linhas", "Copiada · N linhas", "Atualizando o lago", "Com erro"; com a rodada fechada, o rótulo de hoje ("Em dia", "Com erro", "Interrompida.") | `lake-list.test.tsx`, "cada tabela diz o seu estado na rodada aberta" | must |
| 13 | U3 | A aba Tabelas da ligação mostra o mesmo estado por tabela | `lake-tables.test.tsx`, "o estado por tabela na ligação" | must |
| 14 | U3 | A rodada aberta mostra a duração contando desde o início, e a aba Rodadas da tabela mostra as linhas da tabela da vez em vez de "—" | `lake-runs.test.tsx`, "a rodada aberta conta o tempo e as linhas", com relógio falso (`vi.useFakeTimers({ shouldAdvanceTime: true })`, como `apps/web/src/hub/operations/lake.test.tsx:28`) | must |
| 15 | U3 | O estado de cada tabela vem de um só lugar no servidor (`tableProgressOf`), e a rota de Dados e a da ligação dão o mesmo estado para a mesma tabela | `lake-list.test.ts`, "Dados e a ligação dão o mesmo estado" | must |
| 16 | U4 | A aba Rodadas da ligação lista as rodadas da cópia, a mais nova primeiro, com Início, Duração, Linhas e Resultado; a aberta relê a cada 5 s | `lake-copy-runs.test.tsx`, "a aba lista as rodadas" | must |
| 17 | U4 | Uma rodada aberta na aba mostra cada tabela com Estado, Início, Fim, Duração e Linhas; uma rodada fechada mostra, por tabela, "Copiada", "Com erro" com a frase (a que falhou), "Parou no meio" (começou e não terminou), "Não chegou" (a cópia parou antes dela) ou "—" (rodada de antes desta etapa, sem as horas); uma rodada fechada sem resultado (varredura ou fim do ECS) diz "A rodada fechou sem o placar das tabelas." | `lake-copy-runs.test.tsx`, "a rodada abre com as tabelas", com uma rodada com erro, uma interrompida no meio de uma tabela, uma antiga e uma fechada pela varredura | must |
| 18 | U4 | A rota das rodadas recusa quem não lê a ligação com 404 `NOT_FOUND` (como `getLakeTablesOfConnection`) e uma ligação sem cópia com 404 | `lake-routes.test.ts`, "as rodadas recusam quem não lê" | must |
| 19 | U4 | Uma ligação sem rodada mostra "Esta cópia ainda não rodou." | `lake-copy-runs.test.tsx`, "sem rodada" | should |
| 20 | U2 | O alvo grava o relatório num arquivo temporário e o troca com `os.replace`, então o batedor nunca lê um relatório pela metade; um relatório ilegível mesmo assim registra `PROGRESS_REPORT_UNREADABLE` e a batida seguinte tenta de novo | `tests/test_progress.py`, "o relatório ilegível não para o batedor"; `tests/test_target.py`, "o relatório troca inteiro" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dados, lista do Copiado (U3) | Rodada aberta sem placar: as tabelas "Na fila" | Como hoje: "Dados sem tabelas" | Esqueleto de hoje | `ReadFailure` de hoje | — | Só as ligações que a pessoa lê, como hoje | Placar velho: o estado fica no último gravado até o próximo |
| Ligação, aba Tabelas (U3) | Como Dados | Como hoje | Como hoje | Como hoje | Como hoje | Como hoje | Como Dados |
| Tabela, aba Rodadas (U3) | A aberta: duração contando e as linhas da tabela | "Esta tabela ainda não rodou." | Como hoje | Como hoje | Como hoje | Como hoje | — |
| Ligação, aba Rodadas (U4) | A aberta no topo, aberta | "Esta cópia ainda não rodou." | `Skeleton` de linhas | `ReadFailure` | 404: a aba não aparece, como a Tabelas (`connection-page.tsx:262-263`) | A aba não aparece | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `CopyTaskProgress` (fila) | U2, `progress.py` | U1, `lake-queue.ts` |
| `CopyTaskResult.tables[].startedAt`, `endedAt` | U2, `entry.py` `_result` | U1, `closeLakeRun` |
| `lake_run.progress`, `progress_seq` | U1, o ramo `PROGRESS`; U1, o fechamento limpa | U3, `runViewOf` |
| `lake_table_run.started_at`, `ended_at` | U1, `closeLakeRun` | U4, `runsOfCopy` |
| `LakeRun` RUNNING `tables`, `reportedAt` | U3, `runViewOf` | U3, Dados e a aba Tabelas; U4, a aba Rodadas |
| `LakeCopyRun.tables[].outcome` | U4, `tableOutcomeOf` | U4, a aba Rodadas |
| `LakeCopyRun.tables` | U4, `runsOfCopy` | U4, a aba Rodadas |

**O desenho de caixas** (1280 px; a 390 px as colunas Início e Fim da tabela aberta somem, e a Duração
fica):

```
Ligação Sankhya   [Visão geral] [Tabelas] [Rodadas]
┌ Rodadas ─────────────────────────────────────────────────────────────┐
│ Início          Duração       Linhas       Resultado                 │
│ ▾ hoje 14:02    há 6 min      1.388.511    ◌ Rodando                 │
│   Tabela          Estado                   Início  Fim    Duração  Linhas    │
│   Notas (TGFCAB)  ✓ Copiada                14:03   14:05  2 min    1.204.511 │
│   Itens (TGFITE)  ◌ Copiando               14:05   —      1 min    184.000   │
│   Parceiros       · Na fila                —       —      —        —         │
│ ▸ ontem 14:00   9 min         2.911.004    ✓ Completa                │
│ ▸ 25/11 14:00   3 min         120.000      ✕ Com erro                │
└──────────────────────────────────────────────────────────────────────┘
```

As peças de `ui/`: `tabs`, `table` (`FramedTable`), `collapsible`, `skeleton`, `states` (`Empty`,
`ReadFailure`), o `RunBadge` de `lake-state.tsx`. Nenhuma peça nova de `ui/`. A captura que o desenho
segue: `runs-3.png` da Nekt (EST:§6).

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| A tarefa manda `PROGRESS` (`sqs:SendMessage`) | Duas batidas não se sobrepõem: um batedor só, numa thread; a fila pode entregar duas vezes ou fora de ordem, e o `seq` resolve | A fila recusa: a batida seguinte manda o placar inteiro de novo | SQS fora: `PROGRESS_NOT_SENT`, e a rodada segue | `PROGRESS_NOT_SENT` com `runId` e o tipo do erro | 7, 9 |
| O Hub grava o placar (`UPDATE lake_run … WHERE ended_at IS NULL AND attempt = $a AND progress_seq < $seq`) | Dois placares da mesma rodada: o `UPDATE` condicional deixa o de `seq` maior | Rodada fechada entre a leitura e o `UPDATE`: o `WHERE` não acha linha, e a mensagem sai | Banco fora: `COPY_PROGRESS_NOT_WRITTEN`, a mensagem sai da fila (o próximo placar a substitui) | `COPY_PROGRESS_NOT_WRITTEN` com `runId` | 1, 2, 3, 4 |
| O fechamento grava início e fim por tabela e limpa o placar (`closeLakeRun`, a transação de hoje) | Como hoje: uma rodada fecha uma vez (`lake-close.ts`) | Como hoje: a transação desfaz tudo | Como hoje | Como hoje | 5, 6 |
| O alvo grava o relatório (`_write_report`, outro processo que o batedor) | Uma gravação por vez no alvo (`threading.Lock`, `target.py:172-177`); o batedor só lê | O arquivo temporário e o `os.replace` deixam o relatório de antes ou o de agora, nunca metade | Disco cheio: o alvo falha como hoje e a rodada fecha com erro | `PROGRESS_REPORT_UNREADABLE` no batedor | 20 |
| A migração das colunas novas | — | A migração é uma transação | — | — | 6 |

## A tabela de referência

| Peça | Unidade | O que o fundador já decidiu | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O placar sai da máquina da cópia durante a rodada | U2 | A, 2026-11-27: "A recomendado" | `apps/extraction/src/conexus_extraction/target.py:226-243` conta e grava o relatório local; nada sai antes de `entry.py:360-367` | `airbyte-platform@63d665f`, o trabalhador da sincronização num processo separado do servidor, **mesma situação** | `SyncPersistence.kt:90-101` agenda o `flush` a cada `persistenceFlushPeriodSec`, padrão 10 s (`airbyte-commons-micronaut/.../AirbyteConfig.kt:172`); `:233` chama `attemptApi.saveStats`, "For worker to set sync stats of a running attempt" (`config.yaml:6036-6042`); **lido** | embrulhado: `PROGRESS` pela fila que já existe; o batedor segue o `Meter` (`machine.py:89-130`) | Os testes 7 a 11 e 20, com o contrato `copy-task.schema.json` | A | `apps/extraction/src/conexus_extraction/progress.py` |
| O Hub recebe o placar sem fechar a rodada | U1 | A; 0076, "The task sends its own result to an SQS queue"; data D27 (a fila só é lida com rodada aberta) | `lake-queue.ts:297-305` lê em laço; `handle` (`:189-230`) fecha com `closeLakeRun` (`:219`); o fim do ECS com saída 0 só espera o resultado (`:196-201`) | a mesma, **mesma situação** | `AttemptHandler.kt:260` `saveStats` grava a estatística de uma tentativa aberta e não a fecha; **lido** | embrulhado: um ramo `PROGRESS` no `handle` | Os testes 1 a 6 | A | — |
| A contagem por tabela | U2 | nada registrado | `target.py:126-138`: `read` por registro, `written` por lote | `singer-sdk==0.54.9` `metrics.py:26,371-396` (`record_count` a cada 60 s, por stream), **situação diferente: vai ao log**; Airbyte CDK `StateManager.kt:368`, `recordCount` no STATE | o SDK loga `METRIC:` por stream; o Airbyte anexa a contagem ao checkpoint; **lido** | nativo: o contador do alvo já existe; a U2 só acrescenta o início e o fim | — | não precisa | — |
| O estado por tabela durante a rodada | U3 | B, 2026-11-27: "Sim" | só a rodada: `lake-run-view.ts:39-42`; os rótulos `apps/web/src/hub/connectors/lake-text.ts:127-130` | Airbyte docs, por stream "Queued, Syncing, Synced, Error", entre outros, **mesma situação**, documentado; CDK `StreamStatusManager.kt:81-116` STARTED, COMPLETE, INCOMPLETE, **lido**; Nekt `runs-3.png` "Loaded" por stream, **situação diferente: só na rodada terminada** | o conector emite início e fim por stream; a plataforma deriva o estado | embrulhado: `tableProgressOf` deriva os cinco estados do placar | Os testes 12, 13 e 15 | B | — |
| A tela relê enquanto roda | U3 | nada registrado | `apps/web/src/hub/copies/lake-queries.ts:6-25`, 5 s com `refetchInterval` | `airbyte-platform@63d665f` `airbyte-webapp/src/core/api/hooks/connections.tsx:199-208`, `refetchInterval: 10000`, **mesma situação**, **lido** | o TanStack Query relê o progresso | nativo (já é assim) | — | não precisa | — |
| A duração contando | U3 | nada registrado | `lake-runs.tsx:79-89` mostra "—" na aberta; `started_at` existe | Nekt `runs-2.png`, "Duration 1min 32s" com Status Running, **visto** | a duração conta do início | nativo (só a tela) | — | não precisa | — |
| O registro de cada rodada da ligação | U4 | C, 2026-11-27: "Sim", mantendo a da tabela | `lake-list.ts:100-145` e `lake_table_run` (`tables.ts:177-186`), só na tabela; 100 rodadas por ligação (`lake-close.ts:29`) | Nekt `runs-3.png`, a lista de rodadas da fonte e "Data streams" com Stream, Status, Started at, Ended at, Duration, Records, **visto**; a API `/v1/runs/{id}/streams/` (`conexus-nekt-rea`, §3.9); Airbyte Timeline, documentado | a rodada guarda, por tabela, início, fim, linhas e erro | embrulhado: `lake_table_run` ganha início e fim | Os testes 16 a 19 | C | `apps/web/src/hub/connectors/lake-copy-runs.tsx` |
| O erro por tabela | fica de fora (E, #1501) | E, 2026-11-27: "Deixar como issue" | `lake-tabs.tsx:41-54`, "Parou em <tabela>"; a rodada para na primeira falha (cópia: `entry.py:321-330`; fusão: `entry.py:268-281`) | Airbyte CDK `RootReader.kt:104-134`: `supervisorScope`, as outras terminam e a exceção sobe no fim, **lido**; Nekt `partial_success`, documentado, estado da rodada | uma falha marca a tabela; a rodada fecha incompleta | nativo: fica como está nesta etapa | — | E | — |
| A retomada depois de parar no meio | fica de fora (não muda) | 0076 | `entry.py:123-126` o estado do Meltano no bucket; `target.py:183-188` drena a cada STATE | Meltano docs, estado parcial e "pick up where it left off", documentado | o checkpoint confirmado é o ponto de retomada | nativo (já é assim) | — | não precisa | — |
| Os logs da rodada na tela | fica de fora (D) | D, 2026-11-27: "Sim", depois; security S41 | CloudWatch, o grupo da cópia (`infra/aws/lib/copy.ts:55,81-85`); o Hub não lê | Nekt, o bloco Logs, **visto**; Airbyte, "full logs as a part of each sync", documentado | a plataforma guarda e mostra o log da rodada | nativo: o CloudWatch fica como está | — | D | — |
| O Mastra para acompanhar a rodada | fica de fora | 0076, "(a) Hub, só o 'quando'" | `apps/server/src/harness/copy-clock/workflow.ts:20-56`, um passo só | `@mastra/core@1.83.0` `Run.observeStream()` (`dist/docs/references/reference-streaming-workflows-observeStream.md`), **situação diferente: observa um workflow que roda no servidor; a cópia roda no Fargate** | — | nativo: o relógio fica como está | — | não precisa | — |

**A medida do transplante.** Nada vem do repositório antigo.

**A dívida.** Nenhuma.

## As decisões do firstmate

| # | Decisão reversível (delivery L6) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| F1 | O placar mora em `lake_run.progress` (jsonb, o último placar inteiro) e só enquanto a rodada está aberta; o que fica depois é o que o resultado traz | O placar é substituído a cada 10 s e o resultado já é a verdade do fim (`lake-close.ts`); guardar cada batida seria uma série que nenhuma tela lê | Uma tabela de amostras, se uma tela pedir o gráfico de linhas no tempo da Nekt |
| F2 | O início e o fim de cada tabela vêm do alvo, no relógio da tarefa, e não da hora em que o Hub recebe | O alvo vê a primeira linha e o STATE do fim (`target.py:126`, `:183-194`); a hora de chegada erra até 10 s | Trocar a fonte por `reportedAt` |
| F3 | Sem placar novo antes do primeiro `PROGRESS`, as tabelas mostram "Na fila" | A tarefa leva cerca de 1 min para subir no Fargate (EST:§1); não há o que mostrar além de "Rodando" | — |
| F4 | O banco fora ao gravar o placar descarta a mensagem em vez de deixá-la voltar | A próxima batida traz o placar inteiro; três voltas levariam o placar à fila de mortos (`copy.ts:154`, `maxReceiveCount: 3`) | Não tirar da fila |

## U1 O Hub recebe o placar

**Base e modelo.** `dfb1833e9`. Sonnet: segue a forma do `CopyTaskResult` e do ramo do fim do ECS.

### As linhas da tabela

- O Hub recebe o placar sem fechar a rodada: ler `apps/server/src/hub/copies/lake-queue.ts:25-38`
  (`CopyQueueMessage`), `:189-230` (`handle`) e `:269-305` (o laço); seguir `AttemptHandler.kt:260`
  (`saveStats` grava e não fecha).
- O registro de cada rodada (a parte da gravação): ler `lake-close.ts:154-197`, `:226-283` (o
  fechamento por tabela).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/copies/lake-task.ts` | Muda: `CopyTaskProgress`; `CopyTaskResult.tables[]` ganha `startedAt` e `endedAt` | `lake-queue.ts`, `lake-task.test.ts`, o esquema JSON |
| `apps/server/src/hub/copies/tables.ts` | Muda: colunas e restrições | `lake-close.ts`, `lake-list.ts`, `lake-run.ts` |
| `apps/server/src/hub/copies/lake-queue.ts` | Muda: o ramo `PROGRESS` | `lake-wiring.ts` |
| `apps/server/src/hub/copies/lake-close.ts` | Muda: grava início e fim, limpa o placar | `lake-queue.ts`, `lake-sweep.ts`, `lake-stop.ts`, `lake-run.ts` |
| `apps/server/migrations/` | Cria: a migração | — |
| `apps/extraction/contract/copy-task.schema.json` | Muda: gerado por `lake-task.ts` | `apps/extraction/src/conexus_extraction/contract.py` |

### Os contratos que a unidade cria

Em `apps/server/src/hub/copies/lake-task.ts`:

```ts
/** The task's scoreboard while it runs; never a row's content. The Hub keeps the highest `seq`. */
export const CopyTaskProgress = z.object({
  type: z.literal('PROGRESS'),
  version: z.literal(1),
  runId: LakeRunId,
  attempt: z.int().min(1),
  seq: z.int().min(1),
  at: z.iso.datetime(),
  phase: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('COPYING') }),
    z.object({ kind: z.literal('UPDATING'), table: LakeTableName }),
  ]),
  tables: z.array(
    z.object({
      name: LakeTableName,
      read: z.int().min(0),
      written: z.int().min(0),
      startedAt: z.iso.datetime().nullable(),
      endedAt: z.iso.datetime().nullable(),
      failed: z.boolean(),
    }),
  ),
})
export type CopyTaskProgress = z.infer<typeof CopyTaskProgress>
```

`CopyTaskResult.tables[]` ganha `startedAt` e `endedAt`, os dois `z.iso.datetime().nullable().optional()`
(uma tarefa de imagem antiga não os manda). `copyTaskSchema()` passa a dar `progress` também.

Em `tables.ts`, `copies.lake_run`:

| Coluna | Tipo | Restrição |
| --- | --- | --- |
| `progress` | `jsonb`, nula | `lake_run_progress`: `(progress IS NULL) = (progress_seq IS NULL) AND (progress IS NULL OR ended_at IS NULL)` |
| `progress_seq` | `integer`, nula | a mesma |

Em `copies.lake_table_run`:

| Coluna | Tipo | Restrição |
| --- | --- | --- |
| `started_at` | `timestamptz`, nula (rodadas antigas e imagens antigas) | `lake_table_run_times`: `ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at` |
| `ended_at` | `timestamptz`, nula | a mesma |

Nenhuma chave estrangeira nova; as de `lake_table_run` seguem `cascade` (`tables.ts`). Nenhuma permissão nova: as tabelas já são de `hub_company`
(`database-grants.sql:421-424`), então a data D11 não se aplica; o `catalog.test.ts` confirma.

`CopyQueueMessage` (`lake-queue.ts:25`) ganha `CopyTaskProgress`. O código de log novo:
`COPY_PROGRESS_NOT_WRITTEN`. Os estados continuam a união de hoje (C21): o placar não é estado, é um
campo da rodada aberta.

O arquivo modelo: `lake-task.ts`, que cumpre C21 (`outcome` por `kind`), C23 (`LakeRunId` com marca)
e C26 (o contrato da fila mora só ali).

### As skills e a leitura

As linhas de `docs/reference/stack.md` de `apps/server/src`: `fastify-best-practices`, `drizzle-orm`
(`orm.drizzle.team/llms.txt`), `aws-sdk-js-v3-usage` para `@aws-sdk/client-sqs`. Mais
`pstack:typescript-best-practices`.

### A ordem do trabalho

1. **O contrato.** Critérios: 7, 11.
   - **Arquivos:** muda `lake-task.ts`; gera `copy-task.schema.json` (`node lake-task.ts`).
   - **Referência a seguir:** a forma do `CopyTaskResult` (`lake-task.ts:38-63`).
   - **O que entra:** `CopyTaskProgress` e os dois campos do resultado. Regras: C21, C23, C27.
   - **Testes:** `lake-task.test.ts`, o esquema gerado bate com o arquivo.
   - **Pronto quando:** `git diff` do esquema mostra só `progress` e os dois campos.
2. **As colunas.** Critérios: 6.
   - **Arquivos:** muda `tables.ts`; cria a migração com `drizzle-kit generate`.
   - **Referência a seguir:** a migração `20261125030713_lake_run_machine` (colunas e restrição em
     `lake_run`).
   - **Testes:** `lake-queue.test.ts`, "o banco recusa placar em rodada fechada".
   - **Mutações à mão:** tirar `ended_at IS NULL` da restrição; o teste fica vermelho.
3. **O ramo `PROGRESS`.** Critérios: 1, 2, 3, 4.
   - **Arquivos:** muda `lake-queue.ts`.
   - **O que entra:** em `handle`, antes de `exitedWell`: um `PROGRESS` de rodada em `open` grava
     com um `UPDATE` só, condicionado a `ended_at IS NULL`, `attempt` igual e `progress_seq` menor,
     no escopo da empresa da rodada, e só numa rodada de cópia (`ofKind`; uma rodada `TREATMENT` não
     tem placar); qualquer outro caso tira da fila e registra `info`
     `COPY_QUEUE_RUN_UNKNOWN`, como hoje. Uma falha do banco registra `COPY_PROGRESS_NOT_WRITTEN` e
     tira da fila (F4). Regras: C50, data D27.
   - **Testes:** os quatro casos de `lake-queue.test.ts` dos critérios, pela dupla
     `test-lake-queue.ts`.
   - **Mutações à mão:** trocar `<` por `<=` no `seq`; tirar o `attempt` do `WHERE`; cada uma deixa um
     teste vermelho.
4. **O fechamento.** Critérios: 5.
   - **Arquivos:** muda `lake-close.ts`.
   - **O que entra:** o `UPDATE` que fecha `lake_run` põe `progress` e `progress_seq` em `NULL`; o
     `INSERT` de `lake_table_run` leva `started_at` e `ended_at` do resultado, ou `NULL`.
   - **Testes:** `lake-queue.test.ts`, os dois casos do critério 5, e os de hoje sem mudança.
   - **Mutações à mão:** não limpar `progress` no fechamento; a restrição recusa e o teste fica
     vermelho.

### Como se prova

Os testes de `lake-queue.test.ts` contra o banco local com as tabelas de `main` (a forma de
`lake-queue-machine.test.ts`). O critério 6 mostra a recusa do banco. Hoje um `PROGRESS` é
`COPY_QUEUE_UNREADABLE` (`lake-queue.ts:192-195`).

### Parar se

- A dupla `test-lake-queue.ts` não deixa entregar duas mensagens fora de ordem: parar e dizer como.
- O escopo da empresa não está em `open` para uma rodada aberta antes do Hub reiniciar: parar; não
  ler a rodada fora do escopo.

## U2 A tarefa manda o placar

**Base e modelo.** O commit da U1. Sonnet: um batedor no molde do `Meter`.

### As linhas da tabela

- O placar sai da máquina: ler `target.py:172-243` (o relatório, `count`, `_write_report`),
  `entry.py:104-160` (`Round`), `:245-282` (a fusão), `:410-437` (`_round`), `machine.py:89-215`
  (`Meter`); seguir `SyncPersistence.kt:90-101` (a batida de 10 s) e `:167-233` (o `flush`).
- A contagem: `target.py:126-138`; o SDK em `singer_sdk/metrics.py:26` não é usado (vai ao log).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/extraction/src/conexus_extraction/target.py` | Muda: o relatório guarda `startedAt` e `endedAt` por tabela | `entry.py` lê o relatório |
| `apps/extraction/src/conexus_extraction/progress.py` | Cria: o batedor | `entry.py` |
| `apps/extraction/src/conexus_extraction/entry.py` | Muda: liga e para o batedor; a fase da fusão; `_result` leva início e fim | `main` |
| `apps/extraction/src/conexus_extraction/contract.py` | Muda: o tipo do placar, do esquema da U1 | `entry.py`, `progress.py` |
| `apps/extraction/tests/` | Cria `test_progress.py`; muda `test_entry.py`, `test_target.py` | — |

### Os contratos que a unidade cria

`progress.py`:

```python
class Beat:
    @classmethod
    def start(cls, spec: Spec, report: Path, send: Callable[[Progress], None], log: Log,
              period: float = PERIOD) -> Beat: ...
    def updating(self, table: str) -> None: ...  # sends at once, phase UPDATING
    def ended(self) -> None: ...                  # sends at once, a table ended
    def stop(self) -> None: ...                   # joins; nothing is sent after it
```

`PERIOD = 10.0`, como o `Meter`. O relatório do alvo ganha, por tabela, `startedAt` (na primeira linha
lida, que grava o relatório; hoje `count` só grava com `written`, `target.py:234-235`) e `endedAt`
(quando ela entra em `ended`), em ISO 8601 UTC. `_write_report` passa a gravar num arquivo temporário
e trocar com `os.replace`. `Progress` vem do esquema da U1
(`contract.py`, como `Result`).

### As skills e a leitura

`docs/reference/stack.md`, as linhas de `apps/extraction`: o Singer SDK e o Meltano nas versões do
`pyproject.toml`; `aws-sdk-python-usage` para o `boto3`.

### A ordem do trabalho

1. **O relatório com início e fim.** Critérios: 7, 20.
   - **Arquivos:** muda `target.py`.
   - **O que entra:** a primeira linha de uma tabela marca `startedAt` e grava o relatório; o STATE do
     fim marca `endedAt`; `_write_report` grava no temporário e troca.
   - **Testes:** `test_target.py`, a primeira linha marca o início, o STATE do fim marca o fim, e "o
     relatório troca inteiro".
   - **Mutações à mão:** gravar direto no arquivo final; o teste da troca fica vermelho.
2. **O batedor.** Critérios: 7, 9, 11, 20.
   - **Arquivos:** cria `progress.py`.
   - **Referência a seguir:** `machine.py:89-130` (a thread e o `Event`); `SyncPersistence.kt:90-101`.
   - **O que entra:** a cada `PERIOD`, ou quando `updating`/`ended` chamam, lê o relatório, monta o
     placar com todas as tabelas de `spec["tables"]` (zero onde não há conta), `seq` crescente, e
     manda; uma falha do envio registra `PROGRESS_NOT_SENT` e segue.
   - **Testes:** `test_progress.py`, os casos dos critérios 7, 9, 11 e 20.
   - **Mutações à mão:** não incrementar o `seq`; engolir a falha sem log; cada uma deixa um teste
     vermelho.
3. **A tarefa liga o batedor.** Critérios: 8, 10.
   - **Arquivos:** muda `entry.py`.
   - **O que entra:** `_round` liga o batedor antes de `copied` e o para no `finally`, antes de
     `_send`; `_update_unless_interrupted` chama `updating(name)` antes de cada tabela; `_result` leva
     `startedAt` e `endedAt` do relatório.
   - **Testes:** `test_entry.py`, "a fusão diz a tabela da vez" e "nada depois do resultado".
4. **O contrato.** Critérios: 7. Cada mensagem que o batedor monta é validada contra
   `copy-task.schema.json` no teste. O `PROGRESS` é contrato nosso, não forma de biblioteca: não pede
   gravação (testing T26).

### Como se prova

Os testes do `pytest` de `apps/extraction`. Hoje a fila só vê `RESULT`.

### Parar se

- O "Copiada" de cada tabela depende do STATE do fim dela, e o tap o manda antes de começar a
  seguinte (`apps/extraction/tap/src/pass.ts:320-321`, o laço em série de `tap.ts:155`, lido na
  conferência do cartão). Se um teste mostrar outra ordem, parar.

## U3 O placar na tela

**Base e modelo.** O commit da U2. Sonnet.

### As linhas da tabela

- O estado por tabela: ler `lake-run-view.ts:30-77` (`runViewOf`), `lake-list.ts:51-88`
  (`summaryOf`), `lake-view.ts` (a rota da ligação); seguir `StreamStatusManager.kt:81-116`.
- A tela relê: `apps/web/src/hub/copies/lake-queries.ts:6-25`; seguir `connections.tsx:199-208`.
- A duração: `lake-runs.tsx:76-89`; a Nekt `runs-2.png`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/lake-copies.ts` | Muda: `LakeRun` RUNNING ganha `tables` e `reportedAt`; cria `LakeTableProgress` | `apps/server`, `apps/web` |
| `apps/server/src/hub/copies/lake-run-view.ts` | Muda: `runViewOf` e `tableProgressOf` | `lake-list.ts`, `lake-view.ts` |
| `apps/web/src/hub/copies/lake-state.tsx`, `lake-list.tsx`, `lake-runs.tsx`, `text.ts` | Muda | `data-page.tsx`, `lake-detail.tsx` |
| `apps/web/src/hub/connectors/lake-copied-row.tsx`, `lake-text.ts` | Muda | `lake-copied.tsx` |

### Os contratos que a unidade cria

Em `packages/hub-api/src/lake-copies.ts`:

```ts
export const LakeTableProgress = z.discriminatedUnion('state', [
  z.object({ state: z.literal('QUEUED') }),
  z.object({ state: z.literal('COPYING'), read: z.int().min(0), startedAt: z.iso.datetime() }),
  z.object({ state: z.literal('COPIED'), read: z.int().min(0), startedAt: z.iso.datetime(), endedAt: z.iso.datetime() }),
  z.object({ state: z.literal('UPDATING'), read: z.int().min(0) }),
  z.object({ state: z.literal('FAILED'), read: z.int().min(0) }),
])
```

O `LakeRun` RUNNING ganha `tables: Array<{ name: LakeTableName; progress: LakeTableProgress }>` e
`reportedAt: z.iso.datetime().nullable()` (o `at` do último placar). `tableProgressOf(progress, name)`
em `lake-run-view.ts` é o dono da regra (C26): `failed` dá `FAILED`; a fase `UPDATING` com a tabela dá
`UPDATING`; `endedAt` dá `COPIED`; `startedAt` dá `COPYING`; o resto, `QUEUED`. As frases moram em
`text.ts` e `lake-text.ts`: "Na fila", "Copiando · {n} linhas", "Copiada · {n} linhas", "Atualizando o
lago", "Com erro", "há {duração}".

As tabelas de uma rodada aberta vêm de `progress.tables` quando há placar; sem placar, das tabelas
marcadas da ligação (`lake_table`, as que a rodada pediu, `lake-spec.ts`), todas `QUEUED`. Uma tabela
marcada ou desmarcada durante a rodada faz essa lista diferir da rodada até o primeiro placar; fica
aceito, porque o primeiro placar chega em segundos e traz a lista da rodada. O
`runViewOf` recebe essa lista; quem a lê é `lake-list.ts` e `lake-view.ts`. O `progress` guardado é lido
por um esquema Zod em `lake-run-view.ts` (C27), o `CopyTaskProgress` sem o envelope; um placar
ilegível vira `reportedAt: null` e as tabelas `QUEUED`, com o log `COPY_PROGRESS_UNREADABLE`.

### As skills e a leitura

`docs/reference/stack.md`, as linhas de `apps/web/src` (TanStack Query, TanStack Router, shadcn) e de
`packages/hub-api`. Mais `pstack:typescript-best-practices`.

### A ordem do trabalho

1. **A visão.** Critérios: 15. Muda `lake-copies.ts` e `lake-run-view.ts`; `lake-list.test.ts`,
   "Dados e a ligação dão o mesmo estado". Mutação: trocar a ordem `failed` e `endedAt`.
2. **Dados e a aba Tabelas.** Critérios: 12, 13. Muda `lake-state.tsx`, `lake-list.tsx`,
   `lake-copied-row.tsx` e as frases.
3. **A duração e as linhas da aberta.** Critérios: 14. Muda `lake-runs.tsx`: a aberta mostra a
   duração desde `startedAt` e as linhas da tabela.

### Como se prova

Os testes de tela com respostas montadas pelos tipos de `hub-api` (o molde de
`apps/web/src/hub/connectors/lake-fixtures.ts`). Hoje toda tabela mostra "Rodando…".

### Parar se

- A duração conta pelo `useSecondsSince` que já existe (`apps/web/src/harness/room/elapsed.ts:13-16`),
  que redesenha a cada segundo; se ele não servir fora da sala, parar e dizer por quê.

## U4 A aba Rodadas da ligação

**Base e modelo.** O commit da U3. Sonnet.

### As linhas da tabela

- O registro de cada rodada: ler `lake-list.ts:100-145` (`runsOf`, as rodadas de uma tabela),
  `apps/web/src/hub/copies/lake-runs.tsx` (a lista de hoje), `connection-page.tsx:262-280` (as abas);
  seguir a Nekt `runs-3.png` (Data streams).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/lake-copies.ts` | Cria: `listLakeCopyRuns`, `LakeCopyRun` | `apps/server`, `apps/web` |
| `apps/server/src/hub/copies/lake-list.ts` | Muda: `runsOfCopy` e a rota | `lake-routes.ts` |
| `apps/web/src/hub/connectors/connection-page.tsx` | Muda: a aba | a rota `integrations.$connectionId.tsx` |
| `apps/web/src/hub/connectors/lake-copy-runs.tsx` | Cria: a aba | `connection-page.tsx` |
| `apps/web/src/hub/connectors/lake-queries.ts` | Muda: a consulta, 5 s com a aberta | `lake-copy-runs.tsx` |

### Os contratos que a unidade cria

```ts
export const LakeCopyRun = z.object({
  run: LakeRun,
  tables: z.array(z.object({
    id: LakeTableId,
    name: LakeTableName,
    label: z.string(),
    read: z.int().min(0),
    startedAt: z.iso.datetime().nullable(),
    endedAt: z.iso.datetime().nullable(),
    outcome: z.enum(['COPIED', 'FAILED', 'STOPPED', 'NOT_REACHED', 'UNKNOWN']),
  })),
})
export const listLakeCopyRuns = defineOperation({
  id: 'listLakeCopyRuns',
  method: 'GET',
  path: '/api/companies/{companyId}/connections/{connectionId}/lake-copy/runs',
  // 200: LakeCopyRun[], a mais nova primeiro, as 100 que o fechamento guarda (lake-close.ts:29)
  // 404 NOT_FOUND: a pessoa não lê a ligação, ou ela não tem cópia
})
```

Uma rodada aberta leva as tabelas pelo `run.tables` da U3 e `tables` vazio; uma fechada leva as linhas
de `lake_table_run`. O `outcome` de cada tabela de uma rodada fechada tem um dono só,
`tableOutcomeOf(run, row)` em `lake-run-view.ts`, ao lado de `tableProgressOf` (C26): na ordem, o nome igual a
`run.failedTable` dá `FAILED`; `ended_at` preenchido, ou a rodada `COMPLETE`, dá `COPIED`; `started_at`
preenchido dá `STOPPED` ("Parou no meio"); `read` zero dá `NOT_REACHED` ("Não chegou"); o resto é uma
linha de antes da migração, sem as horas, e dá `UNKNOWN` ("—"). Uma linha nova com `read` maior que
zero sempre tem `started_at`, porque a primeira linha lida o grava. Uma rodada fechada sem resultado
(varredura, fim do ECS) não tem linhas em `lake_table_run` (`lake-close.ts:164-180`): `tables` vem
vazio e a aba diz "A rodada fechou sem o placar das tabelas." O acesso é o de
`getLakeTablesOfConnection` (`admit`, `lake-list.ts`).

### As skills e a leitura

As mesmas da U3, mais `fastify-best-practices` para a rota.

### A ordem do trabalho

1. **A rota.** Critérios: 17, 18. Cria o contrato, `runsOfCopy` e `tableOutcomeOf`; `lake-routes.test.ts`,
   "as rodadas recusam quem não lê". Mutações: tirar o `admit`; trocar a ordem de `started_at` e
   `read` em `tableOutcomeOf`.
2. **A aba.** Critérios: 16, 17, 19. Cria `lake-copy-runs.tsx` com `FramedTable` e `Collapsible`, a
   aberta aberta e relida a cada 5 s; muda `connection-page.tsx`.

### Como se prova

`lake-copy-runs.test.tsx` com respostas montadas pelos tipos de `hub-api`, uma rodada com erro e uma
interrompida. Hoje a aba não existe.

### Parar se

- A aba pede uma rota nova de página (uma rota nova entra na lista `PAGES` de `hub-api`): ela é
  uma aba da página da ligação, não uma rota; se o desenho pedir rota, parar.

## G1 O ponto de conferência

Depois da U4: os passos 6 e 7 de `conexus-build` nas telas (Dados, a ligação, a tabela), a 1280 e a
390 px, nos dois temas, com uma rodada do dublê rodando; depois o QA (testing T25) e a revisão da etapa
(delivery L9).
