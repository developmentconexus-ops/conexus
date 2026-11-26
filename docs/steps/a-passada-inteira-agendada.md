# A passada inteira agendada

Trilha Dados, a etapa depois de A primeira cópia chega ao lago, da issue https://github.com/developmentconexus-ops/conexus/issues/1460. A pergunta: "A NF-e lê só as notas novas em cada rodada, e uma passada inteira, quando eu a ligo, tira do lago o que sumiu do Sankhya?" Cartão completo: a etapa traz um mecanismo novo (delivery L27). Base: `main` em `3f9d3739b`. Estudo: `conexus-lago-passada-agendada-estudo`, de 2026-11-26.

## A página do fundador

**No fim desta etapa** você abre a ligação do Sankhya, aba **Tabelas**, e vê, ao lado de **Quando copiar**, o campo **Passada inteira**. A rodada comum da NF-e lê só as notas novas, pelo número, e termina em minutos. A ligação nasce com a passada **Desligada**; quando você a liga, toda semana no domingo de madrugada ou toda madrugada, a passada inteira relê todas as tabelas marcadas e troca o que o lago tem delas: a nota cancelada no Sankhya sai do lago, e a carta de correção e o protocolo que chegaram depois aparecem. O botão **Ler tudo de novo** faz a mesma passada na hora, ligada ou não.

**Com a passada desligada.** A rodada comum continua lendo só as NF-e novas. A nota cancelada no Sankhya, a carta de correção e o protocolo que chegam depois de a nota ser lida ficam no lago como foram lidos, até você ligar a passada ou clicar **Ler tudo de novo**. O mesmo vale para o cadastro apagado no Sankhya.

**O roteiro de uso.**

1. Em **Integrações**, na ligação do Sankhya, aba **Tabelas**: a NF-e diz "Só as novas, por NUNOTA", e o campo **Passada inteira** mostra **Desligada**.
2. Clique **Rodar agora**. A rodada termina em poucos minutos, e em **Dados** a NF-e mostra a rodada como só o que mudou.
3. Cancele uma NF-e de teste no Sankhya (ou use uma cancelada depois da última passada) e clique **Ler tudo de novo**. O diálogo lista todas as tabelas marcadas. Confirme.
4. Quando a rodada terminar, em **Dados**, a NF-e cancelada não está mais na tabela, e a rodada aparece como inteira.
5. Mude **Passada inteira** para **Toda semana, domingo de madrugada** e salve; a seção diz quando é a próxima. Volte para **Desligada**.
6. Mude **Desde** para uma data mais nova e salve: a seção diz o que a próxima passada faz com as linhas de antes dela (decisão B).

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página (A e B já respondidas). No fim: faz o roteiro, diz o que viu e aprova os textos das telas.

**A visão.** Os dados da empresa num lugar só, iguais à origem: a passada leva ao lago o que mudou ou sumiu no Sankhya, sem leitura inteira a cada rodada.

**O que muda do que você aprovou na etapa 2.**

- A NF-e deixa de ser lida inteira em cada rodada (T.34 e A0-c reabertas pela sua decisão 1 a de 26/11). A nota mudada depois, a carta e o cancelamento chegam na passada inteira.
- Volta a passada inteira agendada (T.17 reaberta pela sua decisão 2 a de 26/11), agora como opção de cada ligação, que nunca se perde: se cair em cima de uma rodada aberta, a próxima rodada da ligação a faz.
- **Ler de novo desde a data** vira **Ler tudo de novo** e relê todas as tabelas marcadas, os cadastros incluídos, como o "Full sync (manual or scheduled)" da Nekt. Antes relia só as que a data limita.
- O cadastro apagado no Sankhya (um parceiro, um produto) também sai do lago na passada. Hoje nenhuma rodada o tira.
- A primeira rodada depois da entrada no ar lê a NF-e inteira uma vez, cerca de uma hora.

**Fica de fora.** A captura pelo log do banco (decisão 1 d de 26/11). O que sumiu das tabelas sem passada (a etapa 7 segue com a primeira carga longa e as listas do Mercado Livre). A hora e o dia livres da passada (A d). O tamanho maior da máquina na passada: ela roda na de 1 vCPU, como a NF-e inteira roda hoje.

**As decisões suas nesta etapa.** Respondidas no chat em 2026-11-26: "A desligada / B A".

- **A (c). Frequência e padrão da passada inteira.** Três escolhas, *Toda semana, domingo de madrugada*, *Toda madrugada* e *Desligada*, com o padrão *Desligada*: a ligação nova nasce com a passada desligada, e as cópias que já existem também ficam desligadas. A NF-e só pelas novas vale com a passada ligada ou desligada.
- **B (a). A passada aplica sozinha uma data inicial mais nova.** A passada lê desde a data gravada, como a passada da Nekt no ERP ("read on the first sync and on every Full sync"). Ao salvar uma data mais nova com a passada ligada, a seção diz "Na próxima passada inteira, <quando>, as linhas de antes dela saem do lago nas tabelas de movimento; nas de janela, os meses anteriores ficam." Cadastros e a NF-e não seguem a data.

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 | U1 O cursor número | `CHANGED` com cursor `TIME` ou `NUMBER` e `lag`; o tap ordena pelo tipo; a `TGFNFE` por `NUNOTA`; o fio e o texto do modo | `packages/connectors/src/kernel`, `packages/connectors/src/sankhya`, `apps/extraction/tap/src`, `packages/hub-api/src`, `apps/server/src/hub/connectors`, `apps/web/src/hub/connectors` (só `lake-words.ts`) | testing | P1 |
| G1 | U2 A passada inteira agendada | `full_pass` na cópia e `full_due_at` em cada tabela; a segunda linha do relógio; a pendência; `whole` em todas as tabelas | `apps/server/src/hub/copies`, `apps/server/src/harness/copy-clock`, `apps/server/migrations`, `packages/hub-api/src` | data | U1 |
| G1 | U3 A tela | **Passada inteira** em **Quando copiar** e em **Tabelas no lago**; os avisos da data; **Ler tudo de novo** | `apps/web/src/hub/connectors` | web, design | U2 |

**Orçamento de código alterado.** U1: 250. U2: 450. U3: 300. Total: 1.000 linhas, um pull request (delivery L9).

**A prova antes da U1 (P1).** O firstmate mede no Sankhya, só leitura e só contagem, pelas NF-e autorizadas nos últimos 60 dias: quantas foram autorizadas depois de uma de `NUNOTA` maior, e a maior distância em `NUNOTA` entre elas. O `lag` da `TGFNFE` é o dobro dessa distância, arredondado para cima a 100. A hora de autorização é a única hora da linha (o estudo anterior, 7.8); a hora em que a linha nasce não é medida. Sem a P1, a U1 não começa.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Uma tabela `CHANGED` de cursor `NUMBER` com ponto salvo `999999` e linhas até `1000000` salva `1000000`; a rodada seguinte lê só `>= 1000000 - lag`. Hoje a ordem por texto salva `999999` | `apps/extraction/tap/src/tap-pass.test.ts`, "o ponto de número ordena como número" | must |
| 2 | U1 | A rodada depois da primeira pede à fonte só `NUNOTA >= ponto - lag`; com `lag` 0 pede `>= ponto` | `tap-pass.test.ts`, "o cursor número relê o atraso" | must |
| 3 | U1 | A data inicial nunca entra no filtro de uma tabela de cursor `NUMBER`, e `limited` vem falso no `GET .../lake-tables` | `tap-pass.test.ts`, "a data não limita o número"; `apps/server/src/hub/copies/lake-routes.test.ts`, "o número não é limitado" | must |
| 4 | U1 | A primeira rodada depois da troca da `TGFNFE` de `FULL` para `CHANGED` lê a tabela inteira, emite `ACTIVATE_VERSION` e salva o maior `NUNOTA`; a seguinte lê só pelo ponto | `tap-pass.test.ts`, "de inteira para só as novas" | must |
| 5 | U1 | A linha da NF-e na seção diz "Só as novas, por NUNOTA"; a de data diz "Só o que mudou, por DTALTER" | `apps/web/src/hub/connectors/lake-rows.test.tsx`, "o modo pelo cursor" | must |
| 6 | U2 | `PUT .../lake-copy` com `fullPass` grava e devolve o valor, sem abrir rodada; um valor fora de `WEEKLY`, `DAILY`, `OFF` é 400 e não grava | `apps/server/src/hub/copies/lake-copy.test.ts`, "a passada inteira grava" | must |
| 7 | U2 | Com intervalo que não é manual e `fullPass` não `OFF`, a ligação tem a linha `schedule_<ligação>-full`, com `pass: 'FULL'` na entrada, às 03:<minuto da partida> de São Paulo, no domingo (`WEEKLY`) ou todo dia (`DAILY`); depois de `OFF`, **Só manual**, desmarcar a última tabela ou o `NO_COPY` do disparo, nenhuma das duas linhas dispara; o início do Hub cria a que falta e apaga a que sobra, por ligação e passada; apagar a empresa leva as duas | `apps/server/src/harness/copy-clock/clock.test.ts`, "a linha da passada" | must |
| 8 | U2 | O disparo da passada marca `full_due_at` em cada tabela marcada antes de pedir a rodada; com uma rodada aberta, responde `ALREADY_RUNNING` e a marca fica; a próxima rodada da ligação, do relógio ou do **Rodar agora**, lê inteira cada tabela marcada; o fechamento limpa a marca da tabela cuja passada inteira chegou à atual (o `whole` do resultado dela) e deixa a da tabela que falhou, que segue inteira sozinha na rodada seguinte, enquanto as outras voltam ao só o que mudou | `apps/server/src/hub/copies/lake-run.test.ts`, "a passada pendente não se perde" | must |
| 9 | U2 | `POST .../lake-copy/run` com `whole: true` pede `whole` para toda tabela marcada, cadastros e cursor número incluídos | `apps/server/src/hub/copies/lake-copy-run.test.ts`, "inteira em todas" | must |
| 10 | U2 | Depois de uma passada inteira, a nota que sumiu da fonte não está na atual; depois de uma rodada só das novas, ela continua | `apps/extraction/tests/test_update.py`, "a cancelada sai na passada" | must |
| 11 | U2 | Pela decisão B a, a passada inteira de uma tabela de data apaga da atual as linhas anteriores à data gravada; numa de janela, os meses anteriores ficam | `apps/extraction/tests/test_update.py`, "a passada aplica a data" | must |
| 12 | U3 | **Passada inteira** aparece em **Quando copiar** e em **Tabelas no lago**, com as três escolhas e **Desligada** já escolhida numa ligação nova e nas cópias que já existem (decisão A c); com **Só manual**, desligado e com a frase "Com Só manual, nada roda sozinho."; quem não gerencia cópias vê o texto sem o campo | `apps/web/src/hub/connectors/lake-full-pass.test.tsx` | must |
| 13 | U3 | Salvar uma data mais nova com a passada ligada mostra o aviso da decisão B a; com a passada desligada, "As linhas de antes dela continuam no lago até você ler tudo de novo." | `apps/web/src/hub/connectors/lake-since.test.tsx`, "a data e a passada" | must |
| 14 | U3 | **Ler tudo de novo** abre o diálogo "Ler tudo de novo?", que lista todas as tabelas marcadas com "O lago troca o que tem destas tabelas pelo que o <sistema> tem agora."; **Ler de novo** chama a rota do 9; **Cancelar** não chama nada; com `already`, nada muda | `apps/web/src/hub/connectors/lake-tables.test.tsx`, "ler tudo de novo" | must |
| 15 | U2 | Com a passada **Desligada**, a ligação não tem a linha `-full`, nenhuma tabela fica pendente, a rodada comum pede a NF-e só pelas novas, e a nota que sumiu da fonte continua na atual; **Ler tudo de novo** a tira | `apps/server/src/hub/copies/lake-run.test.ts`, "desligada, só as novas"; `apps/extraction/tests/test_update.py`, "a cancelada sai na passada" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Quando copiar**, o campo **Passada inteira** | **Desligada** já escolhida, com a frase "Relê todas as tabelas e tira do lago o que sumiu do <sistema>." | — | O campo segue a janela | O erro do **Ligar e copiar agora** de hoje | — | A janela não abre para quem não gerencia | — |
| **Tabelas no lago**, o campo e o botão | O valor gravado; abaixo, "Próxima passada inteira: <dia, hora>." ou "Passada inteira desligada." | Ligação sem cópia: o campo não aparece | Como a seção hoje | O 400 do valor inválido não chega pela tela; o resto como hoje | — | O texto sem o campo; **Ler tudo de novo** à vista e desligado (W34) | `COPY_RUN_OPEN` como hoje |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `SetLakeCopy.fullPass` | U3, `PUT .../lake-copy` | U2, `lake-copy.ts`, `lake_copy.full_pass` |
| `LakeTablesOfConnection.fullPass` | U2, `lake-view.ts` | U3, o campo |
| `LakeTablesOfConnection.fullNext` | U2, `clock.next` da linha `-full` | U3, "Próxima passada inteira" |
| `LakeMode` `CHANGED.cursor` | U1, `copy-source.ts` `modeOf` | U1, `lake-words.ts` `modeText` |
| `lake_table.full_due_at` | U2, o disparo da passada; a limpeza no fechamento | U2, `readCopy` e `specOf` |
| `RunLakeCopy.whole` | U3, **Ler tudo de novo** | U2, `lake-spec.ts` |

Peças de `ui/`: o seletor de **Quando copiar** (`IntervalField`, o mesmo componente com outras escolhas), o diálogo de hoje do **Ler de novo** com a variante `danger-confirm` (V55). Nenhuma peça nova. O desenho de caixas: o campo entra na grade de dois de `Controls` (`lake-copied-controls.tsx:47-58`), na linha de baixo, ao lado do **Desde** a 1280 px e abaixo dele a 390 px.

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Uma dependência fora | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `PUT .../lake-copy` com `fullPass` | A segunda gravação vence, como o intervalo hoje; o relógio segue a última (`clock.set` é idempotente) | A gravação e o relógio são dois passos: o relógio que falha deixa a cópia gravada, e o início do Hub reconcilia (`reconcile`) | Banco fora: a frase de hoje; Mastra fora: `databaseFailure` | `COPY_SET` de hoje, com `fullPass` | 6, 7 |
| O disparo da linha `-full` | Duas instâncias do Hub: o Mastra reclama o disparo por CAS (`scheduler.ts:470`); a pendência é um `update` idempotente | Pendência gravada e rodada recusada: a próxima rodada a cumpre | Banco fora: o disparo falha, o Mastra tenta no próximo; a pendência não foi gravada e a passada espera a semana | `LAKE_FULL_PASS_DUE`, com `companyId`, `connectionId` | 7, 8 |
| A limpeza de `lake_table.full_due_at` no fechamento | Duas rodadas não fecham juntas (índice da rodada aberta) | Na mesma transação do fechamento (D22) | Banco fora: o fechamento todo falha e a varredura fecha depois | `COPY_RUN_CLOSED` de hoje | 8 |
| `POST .../lake-copy/run` com `whole` | O índice da rodada aberta deixa uma só, `already` | A rodada segue a de hoje | A de hoje | `COPY_RUN_QUEUED` com `whole` | 9, 14 |

## A tabela de referência

| Peça | Unidade | O que o fundador já decidiu | Hoje no main | Referência | Como a referência faz | Veredito | Prova | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R1. Quem decide o método | U1 | "Entendi a gente no conector já traz isso, faz sentido" (2026-11-26) | `kernel/tables.ts:55-62` | `singer-sdk@0.54.9 streams/core.py:707-716`, `:1397-1412` (mesma situação) | O autor declara a chave; com chave, `INCREMENTAL` (lido) | nativo | — | Fundador | — |
| R2. A NF-e pelas novas | U1 | decisão 1 a de 26/11; decisão 3 a (2026-11-26) | `sankhya/copy-tables-fiscal.ts:96-104` | Nekt SAP Business One, pagamentos e lançamentos sem data, `NKD:152917` (mesma situação, documentado) | Novos pelo número interno; edições na passada inteira; os cancelados ela relê, o que a decisão 3 a de 26/11 troca pela passada | nativo | — | Fundador | — |
| R3. O ponto ordena pelo tipo | U1 | nada registrado | `tap/src/pass.ts:171-177`, `:231` | `singer-sdk@0.54.9 helpers/_state.py:198-244` (mesma situação) | `new_rk_value >= old_rk_value` no tipo do valor (lido) | nativo | — | não precisa | — |
| R4. O atraso do número | U1 | nada registrado | nenhum | `dlt@8fa90a9 dlt/extract/incremental/lag.py:103-107` (mesma situação) | Parte de `último - lag` (lido) | embrulhado: `lag` declarado no cursor | P1 | firstmate F6 | — |
| R5. A data não limita o número | U1 | T.43 (cadastro e inteira ignoram a data; sem segunda coluna); hoje a NF-e inteira já a ignora | `kernel/tables.ts:64-76` | `singer-sdk@0.54.9 streams/core.py:441-462` (mesma situação) | A data só compara com chave de data (lido) | nativo | — | não precisa | — |
| R6. A passada agendada | U2 | decisão 2 a (2026-11-26) | `copy-clock/clock.ts:104-175`, `workflow.ts:25-56` | Nekt Additional Full Sync `NKD:22591-22612`, `NKP sources__postgres.md:71`, `platform-api__sources__create.md:566-570` (mesma situação, documentado); Fivetran, releitura automática de noite e no fim de semana (situação diferente: a pessoa não agenda) | Segundo gatilho com cron próprio; a passada relê "every table from the Start Date" (`NKD:50367`) | embrulhado: segunda linha de `mastra.schedules` | — | Fundador | — |
| R7. A passada que cai numa rodada aberta | U2 | nada registrado | `lake-run.ts:276-280` | Mastra 1.83 `storage/domains/schedules/base.ts:80` (`ifActive` só para agente); Airbyte `operator-guides/refreshes.md:15` (situação diferente: manual) | Nenhuma lida diz | embrulhado: `full_due_at` | Critério 8 | firstmate F2 | — |
| R8. O que a passada lê | U2 | issue 1460 | `hub/copies/lake-spec.ts:118` | Nekt `NKD:50367` (mesma situação); Fivetran re-sync, "currently selected tables" (documentado, 2026-11-26) | Todas as marcadas | nativo | — | firstmate F1 | — |
| R9. A cancelada sai | U2 | decisão 3 a (2026-11-26) | `pass.ts:309-310`, `update.py:169-171`, `:186-192` | `singer-sdk@0.54.9 sql/sink.py:389-445` com `hard_delete` (mesma situação) | A versão da passada substitui as anteriores (lido) | nativo | — | Fundador | — |
| R10. A data na passada | U2, U3 | "2. Ver referencia e ter certeza" (2026-11-24) | `pass.ts:189-196` | Nekt ERP `NKD:33667` (mesma situação); `meltano@4.4.1 core/plugin/singer/tap.py:276-281` | Lê desde a data configurada e troca a tabela; aqui, por modo (`update.py:187-192`) | nativo | — | Fundador, B a: "B A" | — |
| R11. O botão manual | U2, U3 | critério 114 da etapa 2 | `lake-routes.ts:60-87` | Nekt `NKD:33683`; Fivetran "Resync all historical data"; Airbyte `refreshes.md:24-25` | O botão faz a mesma passada | nativo | — | firstmate F5 | — |
| R12. A tela | U3 | decisão 2 a de 26/11 | `lake-copied-controls.tsx:22-61`, `link-steps.tsx:135-190`, `lake-words.ts:27-36` | Nekt "Configure data source" (`NKP sources__postgres.md:71`, documentado) | Campo opcional ao lado do gatilho | embrulhado: `IntervalField` | — | Fundador, textos no fim | `apps/web/src/hub/connectors/full-pass-field.tsx` |
| R13. Frequência e padrão | U2, U3 | intervalo "24 h, como a Nekt" | nenhum | Nekt `NKD:33712`, `:44351`, `:49800` | Madrugada; noite ou fim de semana | embrulhado | — | Fundador, A c: "A desligada" | — |

`NKD`: o texto da documentação da Nekt de 2026-11-19; `NKP`: as páginas de 2026-11-14 (estudo `conexus-nekt-structure-study`).

**A medida do transplante.** Nada trazido. O motor antigo (`e5bc29d08^`) é só forma: a segunda linha com sufixo `-whole` e o domingo de madrugada.

**A dívida.** Nenhuma.

## As decisões do firstmate

| # | Decisão reversível | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| F1 | A passada lê todas as tabelas marcadas, cadastros incluídos | A Nekt força `FULL_TABLE` em todo stream (`NKD:33312`); a Fivetran relê "the currently selected tables" | Filtrar em `lake-spec.ts` |
| F2 | A passada perdida vira pendência por tabela (`lake_table.full_due_at`) que a próxima rodada cumpre, e a tabela que falha não arrasta as outras | O Mastra não adia disparo de workflow (`base.ts:80`); o motor antigo perdia a passada (`workflow.ts:71-72`) | Tirar a coluna; a passada volta a se perder |
| F3 | A hora é 03:<minuto da partida> de São Paulo, no domingo | A Nekt: noite ou fim de semana, quando o ERP está livre (`NKD:33712`); o minuto da partida espalha as ligações (T.38) | Trocar a constante em `clock.ts` |
| F4 | Com **Só manual**, nenhuma passada roda sozinha | O texto aprovado de **Só manual** | Criar a linha também sob manual |
| F5 | **Ler de novo desde a data** vira **Ler tudo de novo**, a mesma passada | Nekt, "a Full sync (manual or scheduled)" (`NKD:33683`) | Devolver o filtro `limited` ao botão |
| F6 | O `lag` da `TGFNFE` sai da P1 | dlt `lag.py:103-107` | Mudar o número na declaração |
| F7 | Trocar para `OFF` ou **Só manual** limpa `full_due_at` das tabelas da ligação | Desligada quer dizer que nada relê sozinho | Deixar a pendência |

## U1 O cursor número

**Base e modelo.** `3f9d3739b`, depois da P1. Sonnet: muda um tipo do kit e os seus três leitores, sem concorrência.

### As linhas da tabela

R1, R2, R3, R4, R5. Ler na base `packages/connectors/src/kernel/tables.ts:55-76` (`TableMode`, `startDateLimits`), `packages/connectors/src/sankhya/copy-tables-fiscal.ts:1-3` (`changed`) e `:96-104` (`TGFNFE`), `apps/extraction/tap/src/pass.ts:171-233` (`latest`, `planOf`, `doneOf`), `packages/hub-api/src/lake-copies.ts:96-100` (`LakeMode`), `apps/server/src/hub/connectors/copy-source.ts:100-113` (`modeOf`), `apps/web/src/hub/connectors/lake-words.ts:24-36` (`modeText`). Seguir `singer-sdk@0.54.9 helpers/_state.py:198-244` (a comparação no tipo), `streams/core.py:441-462` (a data só para chave de data), `dlt@8fa90a9 dlt/extract/incremental/lag.py:103-107` (o atraso).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Muda `TableMode` | `sankhya/`, `hubspot/`, `mercado-livre/` (se declaram tabelas), `apps/extraction/tap`, `apps/server/src/hub/connectors` |
| `packages/connectors/src/sankhya/` | Muda `changed` e a `TGFNFE` | o kit |
| `apps/extraction/tap/src/` | Muda `latest`, `planOf`, `doneOf` | o tap |
| `packages/hub-api/src/lake-copies.ts` | Muda `LakeMode` | `apps/server`, `apps/web` |
| `apps/server/src/hub/connectors/copy-source.ts` | Muda `modeOf` | `hub/copies` |
| `apps/web/src/hub/connectors/lake-words.ts` | Muda `modeText` | a seção, Dados |

### Os contratos que a unidade cria

```ts
// packages/connectors/src/kernel/tables.ts
export type ChangedCursor =
  | Readonly<{ kind: 'TIME'; registry: boolean }>  // a date or instant; registry: master data the date never limits
  | Readonly<{ kind: 'NUMBER'; lag: number }>       // grows on insert; the date never limits it; each round reads from point - lag
export type TableMode =
  | Readonly<{ kind: 'CHANGED'; column: string; cursor: ChangedCursor }>
  | Readonly<{ kind: 'WINDOW'; column: string; step: 'MONTH'; reread: number }>
  | Readonly<{ kind: 'FULL' }>

// packages/hub-api/src/lake-copies.ts
z.object({ kind: z.literal('CHANGED'), column: z.string(), cursor: z.enum(['TIME', 'NUMBER']), registry: z.boolean() })
```

- **Cada estado**: o cursor é uma união por `kind` (C21); `registry` só existe no `TIME`.
- **O dono de cada fato**: `startDateLimits` segue o único dono do que a data limita (T.43); a ordem do ponto tem um dono no tap, uma função que recebe o tipo da coluna do cursor (`run.columns`).
- **O esquema Zod**: o fio muda só o `LakeMode`.
- **O arquivo modelo**: `kernel/tables.ts`, cumpre C21 e C26.

### As skills e a leitura

`pstack:typescript-best-practices`; `conexus-connector` (kit, lake). Python: nenhuma linha muda.

### A ordem do trabalho

1. **O tipo.** Critérios: 3. **Arquivos:** muda `kernel/tables.ts`. **O que sai:** `registry` no nível do modo, com o helper `changed` de `copy-tables-fiscal.ts:1-3`. **O que entra:** `ChangedCursor`; `startDateLimits` dá falso para `NUMBER`. **Testes:** `packages/connectors/src/kernel/tables.test.ts`, "o número não é limitado". **Mutações à mão:** `return !mode.registry` sem olhar o cursor; o teste do 3 fica vermelho.
2. **A NF-e.** Critérios: 4. **Arquivos:** muda `copy-tables-fiscal.ts:96-104` para `{ kind: 'CHANGED', column: 'NUNOTA', cursor: { kind: 'NUMBER', lag: <P1> } }`. **Testes:** a conformidade do kit.
3. **O tap.** Critérios: 1, 2, 4. **Arquivos:** muda `pass.ts`. **O que entra:** `latest` recebe o tipo da coluna do cursor e compara números como números (texto de inteiro ou decimal, nunca `Number` para mais de 15 dígitos); `planOf` usa `since = ponto - lag` para `NUMBER` e nunca a data. **Mutações à mão:** voltar o `sort()` de texto; o 1 fica vermelho. Tirar o `- lag`; o 2 fica vermelho.
4. **O fio e o texto.** Critérios: 5. **Arquivos:** `lake-copies.ts`, `copy-source.ts`, `lake-words.ts`. `modeText` diz "Só as novas, por <coluna>" para `NUMBER`.

### Como se prova

Os testes do tap pela porta do tap com o dublê (T26), lendo as mensagens Singer que ele escreve: hoje o 1 falha (a ordem por texto).

### Parar se

A P1 não veio. Um conector além do Sankhya declarar `CHANGED` e quebrar com o tipo novo: ajustar só a forma, sem mudar o modo dele.

## U2 A passada inteira agendada

**Base e modelo.** Depois da U1. Opus: concorrência entre dois relógios, a rodada aberta e o fechamento.

### As linhas da tabela

R6 a R11. Ler na base `apps/server/src/harness/copy-clock/clock.ts:18-175` e `workflow.ts:11-56`, `apps/server/src/hub/copies/lake-run.ts:229-296`, `lake-spec.ts:14-124`, `lake-close.ts` (o fechamento `COMPLETE`), `lake-copy.ts:250-291` (o `PUT`), `tables.ts:40-69` (`lakeCopy`), `packages/hub-api/src/lake-copies.ts:18-22`, `:102-163`. O motor antigo, só como forma: `git show e5bc29d08^:apps/server/src/builder/copy-clock/clock.ts:24-25`, `:81-101`, e `workflow.ts:97-99` (o sufixo com hífen). Mastra 1.83: `packages/core/src/workflows/scheduler/scheduler.ts:470` (o disparo por CAS).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/copies/` | Muda `tables.ts`, `lake-copy.ts`, `lake-run.ts`, `lake-spec.ts`, `lake-close.ts`, `lake-view.ts` | as rotas, o relógio |
| `apps/server/src/harness/copy-clock/` | Muda `clock.ts`, `workflow.ts` | `hub/copies` pelo `public.ts` |
| `apps/server/migrations/`, `apps/server/database-grants.sql` | Cria a migração das duas colunas (D6); o retrato do catálogo e as concessões, se mudarem | `migrate` |
| `packages/hub-api/src/lake-copies.ts` | Cria `LakeFullPass`; muda `SetLakeCopy`, `LakeTablesOfConnection`, `RunLakeCopy` (só o texto) | `apps/web` |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/lake-copies.ts
export const LAKE_FULL_PASSES = ['WEEKLY', 'DAILY', 'OFF'] as const
export const LakeFullPass = z.enum(LAKE_FULL_PASSES)
export const LAKE_FULL_PASS_DEFAULT = 'OFF' satisfies LakeFullPass // founder, 2026-11-26: "A desligada"
SetLakeCopy: + fullPass: LakeFullPass
LakeTablesOfConnection: + fullPass: LakeFullPass.nullable()   // null: no copy, like interval
                        + fullNext: z.iso.datetime().nullable() // null: no full clock
RunLakeCopy.whole        // true: every marked table whole (was: only where startDateLimits)
```

| Tabela | Coluna | Tipo | Restrição | Ao apagar |
| --- | --- | --- | --- | --- |
| `copies.lake_copy` | `full_pass` | `text` | `not null default 'OFF'` (as cópias que existem ficam desligadas), `check in ('WEEKLY','DAILY','OFF')` | segue a linha |
| `copies.lake_table` | `full_due_at` | `timestamptz` | nula: nenhuma passada pendente | segue a linha |

`ClockInput` passa a `version: 2` com `pass: 'ROUND' | 'FULL'`; a linha de `version: 1` lê como `ROUND`. `fullClockIdOf(connection)` é `schedule_<ligação>-full`.

- **Cada estado**: `pass` é a união que separa as duas linhas (C21).
- **O dono de cada fato**: o cron das duas linhas só em `clock.ts` (C26); a pendência só em `lake_table.full_due_at`.
- **O arquivo modelo**: `copy-clock/clock.ts`.

### As skills e a leitura

`mastra` (schedules, em `node_modules/@mastra/core/dist/docs` e na estante 1.83), `fastify-best-practices`, `drizzle` (no pacote), `pstack:typescript-best-practices`.

### A ordem do trabalho

1. **A migração e a tabela.** Critérios: 6. **Arquivos:** `tables.ts`, a migração gerada pelo Drizzle (D5, D6). Rodar a conferência de migrações local.
2. **O `PUT` e o `GET`.** Critérios: 6. **Arquivos:** `lake-copy.ts`, `lake-view.ts`, `lake-copies.ts`. **Mutações à mão:** não gravar `fullPass`; o 6 fica vermelho.
3. **O relógio.** Critérios: 7. **Arquivos:** `clock.ts` (`fullCronOf`, as duas linhas em `set`, `remove` e `set(MANUAL)` das duas, `reconcile` por ligação e passada, `release` das duas, `next` da `-full`), `workflow.ts` (o disparo `FULL` grava `full_due_at` nas tabelas marcadas e chama `iniciarRodada(..., 'CLOCK', false)`; o `NO_COPY` apaga as duas linhas). **Mutações à mão:** `reconcile` sem a linha `-full`; o 7 fica vermelho. `remove` só da linha comum; o 7 fica vermelho.
4. **A rodada.** Critérios: 8, 9, 15. **Arquivos:** `lake-spec.ts` (`readCopy` lê `full_due_at` por tabela, lido depois de a rodada ser aberta, `lake-run.ts:276`; `whole: firstLoad || started.whole || fullDue`), `lake-close.ts` (no fechamento, na mesma transação, limpa `full_due_at` de cada tabela cujo resultado diz `whole`), `lake-copy.ts` (F7). **Mutações à mão:** limpar a pendência de todas as tabelas no fechamento; o 8 fica vermelho. Voltar o filtro `limited`; o 9 fica vermelho.
5. **A atual.** Critérios: 10, 11. Nenhuma linha de Python muda; os testes provam a cancelada e a data pela passada, com o dublê de Athena.

### Como se prova

O 7 e o 8 pela porta do Hub com o Mastra de teste e o relógio de teste, lendo `mastra.schedules` e as linhas de `lake_run`; o 10 e o 11 pelo `Updater` com o dublê de Athena (T26). Hoje o 8 falha (a passada que cai numa rodada aberta se perde) e o 9 falha (só as limitadas).

### Parar se

O Mastra 1.83 recusar o id com `-full` ou o trocar: usar o id que ele devolve e registrar. A migração mudar o retrato do catálogo: a unidade leva o retrato e `database-grants.sql`.

## U3 A tela

**Base e modelo.** Depois da U2. Sonnet.

### As linhas da tabela

R10, R11, R12, R13. Ler `apps/web/src/hub/connectors/lake-copied-controls.tsx:22-121`, `link-steps.tsx:134-190`, `interval-field.tsx`, `lake-read-again.tsx`, `lake-text.ts`, `lake-words.ts`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/connectors/` | Cria `full-pass-field.tsx`; muda `lake-copied-controls.tsx`, `link-steps.tsx`, `lake-read-again.tsx`, `lake-text.ts`, `lake-words.ts`, `lake-copied.tsx` | a página da ligação, a janela Ligar |

### Os contratos que a unidade cria

Nenhum; lê os da U2. Os textos: "Passada inteira"; "Toda semana, domingo de madrugada", "Toda madrugada", "Desligada"; "Relê todas as tabelas e tira do lago o que sumiu do <sistema>."; "Próxima passada inteira: <dia, hora>."; "Passada inteira desligada."; "Com Só manual, nada roda sozinho."; "Ler tudo de novo"; o diálogo do 14; os avisos do 13.

### As skills e a leitura

`shadcn`, `impeccable` (pela `docs/reference/impeccable.md`), `pstack:typescript-best-practices`; TanStack Query pela `llms.txt`.

### A ordem do trabalho

1. **O campo.** Critérios: 12. `full-pass-field.tsx` sobre o mesmo seletor de `IntervalField`.
2. **Os avisos e o botão.** Critérios: 13, 14. **Mutações à mão:** o diálogo listar só as limitadas; o 14 fica vermelho.

### Como se prova

Os testes de tela com o MSW pela rota do contrato (T5, T14); as capturas a 1366 e 390 px nos dois temas, na QA.

### Parar se

O campo não couber na grade a 390 px sem empurrar **Salvar**: levar a captura ao firstmate.

## G1 O ponto de conferência

Depois da U3: os passos 6 e 7 de `conexus-build` no servidor (as rotas `lake-copy` e `lake-copy/run`, a migração), no tap e na tela; `npm run check:local`; as duas linhas do relógio vistas no Mastra local depois de salvar `WEEKLY` e `OFF`.
