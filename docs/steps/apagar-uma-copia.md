# Apagar uma cópia

Cartão curto. Parte do pedido do fundador de 2026-11-13 ("Não precisa apressar só coloque na fila, e
avaliar a blast radius disso para garantir implementação coerente"), quando ele quis apagar a cópia
`sankhya_clientes` (issue 1000; a trava da porta SQL fica de fora, por decisão dele). Lido em `main`
`759c728e`, com `@mastra/core` 1.82.0, `drizzle-orm` do `package-lock.json` e PostgreSQL 18. Referências:
Airbyte `8aed3123` (só a documentação está na estante), Mastra `6e8dfcb8` (`mastra-1.82`) e o estudo
salvo do Mitra em `conexus-os` `e0353c36`. As provas rodaram no banco de teste local, pelo caminho dos
testes do servidor (o relatório do estudo guarda o script e a saída).

## A página do fundador

**No fim desta etapa** você abre **Cópias**, clica nos três pontos de uma cópia e escolhe **Apagar**.
Uma janela diz o que some e o que deixa de funcionar. Você confirma, a cópia sai da lista, a tabela
dela sai do banco da empresa e nenhum app a lê mais. As outras cópias e a conexão continuam como
estavam.

**Exemplo (inventado).** A Empresa A tem a conexão Matriz com duas cópias: `clientes` (45.000 linhas,
liberada ao Projeto Pedidos) e `vendas`. Ana apaga `clientes`:

> **Apagar a cópia Clientes?**
> As 45.000 linhas saem do banco da empresa e não voltam.
> - O app do Projeto Pedidos deixa de ler esta cópia. Onde ele a usava, vai mostrar erro.
> - Se você ligar esta cópia de novo, ela copia tudo do zero.
>
> [Apagar] [Cancelar]

Depois disso: `vendas` continua rodando no mesmo intervalo, a conexão Matriz continua ligada, o
Projeto Pedidos não tem mais `clientes`, e o Builder deixa de ver essa cópia. Se uma rodada estava em
andamento, ela para sozinha e não grava mais nada.

**O roteiro de uso.**

1. Em **Cópias**, nos três pontos de uma cópia liberada a um Projeto, clique em **Apagar**. A janela
   mostra as linhas que saem, os Projetos cujo app deixa de ler a cópia, e o aviso de que religar
   copia tudo do zero.
2. Clique em **Apagar**. A cópia sai da lista. As outras cópias da mesma conexão continuam lá, com a
   mesma hora da próxima rodada.
3. Abra o app publicado daquele Projeto. Ele já não lê a cópia: onde a usava, aparece o erro do
   próprio app.
4. Abra a conexão. Ela continua ligada. O **Desligar** dela lista só as cópias que sobraram.

**O que você faz, e quando.** No começo: aprova esta página e responde à decisão A. No fim: faz o
roteiro e aprova os textos da janela.

**O que as referências fazem.** No Airbyte, apagar uma conexão *mantém* os dados no destino ("the data
remains in your destination"), e tirar uma tabela da sincronização também a mantém. Só o **Clear**
esvazia a tabela, com o aviso de que "não há como recuperar". O Mastra Connect não guarda dados de
ninguém: tirar uma conexão só desfaz o login dela. No estudo salvo do Mitra, a plataforma "bloqueia
`DROP` por padrão e exige confirmação explícita". Aqui a cópia é apagada *com* a tabela, porque é
para isso que você a apaga (os documentos da `sankhya_clientes`) e porque o Desligar já faz assim. Do
Airbyte vem o aviso de que religar copia tudo do zero; do Mitra, a confirmação explícita antes do
`DROP`.

**Fica de fora.**

- **A trava da porta SQL do Sankhya** (issue 1000): decisão sua de 2026-11-13. Depois de apagada, o
  Builder pode propor a mesma cópia de novo (a prova mostrou isso). Ela só volta se alguém clicar em
  **Ligar** de novo.
- **Esvaziar sem apagar** (o Clear do Airbyte): ninguém pediu.
- **Avisar o Builder ou mudar o código do app publicado**: o app fica com o erro dele até alguém pedir
  a mudança ao Builder, como já acontece hoje depois de um Desligar.
- **Apagar várias cópias de uma vez.**

**As decisões suas nesta etapa.**

**A. Se o banco da empresa não responder no meio do Apagar.**

- **A1 (recomendada).** O Apagar primeiro tira a leitura dos apps (o mesmo comando do **Tirar** de um
  Projeto). Se o banco não responde, nada muda e a tela diz: "O banco da empresa não respondeu. Nada
  foi apagado; tente de novo." Se a leitura saiu e só a tabela não saiu, a cópia sai da lista, a
  tabela fica anotada para a próxima vez, e nenhum app a lê mais. Veredito: embrulhado (o `REVOKE` do
  Tirar, mais a nota de tabela que o Desligar já usa). Como: o `revokeCopy` de `grants.ts` antes da
  transação, como o Desligar tira as linhas da conta antes de tudo.
- **A2.** Igual ao Desligar de hoje: a cópia sai, a tabela fica anotada, e o app **continua lendo**
  as linhas até o próximo Desligar, Apagar ou Ligar. A prova mostrou um app lendo as 183 linhas de
  `vendas` depois de a cópia ter sumido da lista. Veredito: nativo. Como: o mesmo dono do fim de
  cópia, sem passo novo.

Recomendo A1. Você apaga para que ninguém mais leia os dados, e a A2 deixa um app lendo exatamente
quando o banco falha.

**Emenda do fundador, 2026-11-13: "Desligar entra junto no apagar".** O **Desligar** da conexão recebe a
A1 nesta mesma etapa: antes da transação, tira a leitura dos apps de cada cópia que acaba com ele (a
cópia da qual a conexão é a última fonte), pelo mesmo comando do **Tirar** e no mesmo dono do fim de
cópia (`leave.ts`), sem segundo caminho. Se o banco da empresa não responde, o Desligar recusa com a
mesma frase (503) e nada muda, como já recusa ao tirar as linhas da conta. Isto substitui o "Desligar
fica como está" do pedido anterior.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 O Apagar no Hub | `deleteCopy` no dono do fim de cópia (`leave.ts`), a rota `DELETE …/copies/{copyId}`, a agenda tirada pelo mesmo dono (Desligar incluído) e, pela emenda, a leitura dos apps tirada antes do fim também no Desligar | `apps/server/src/hub/copies/`, `packages/hub-api/src/copies.ts` | [data](../guides/data.md) | nada |
| U2 O Apagar na tela | o item **Apagar** do menu, a janela de confirmação, a volta à lista | `apps/web/src/hub/copies/` | [web](../guides/web.md) | U1 |

Correm em sequência: U2 usa o contrato da U1.

**Orçamento de código alterado.** U1: cerca de 110 linhas (mais cerca de 30 da emenda). U2: cerca de 130. Total: cerca de 240, muito
abaixo do limite de delivery L2.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Apagar uma de duas cópias da conexão: a tabela dela responde `42P01` ao login do app, a outra tabela responde as mesmas linhas, a posição e a marca d'água da outra não mudam, e a conexão responde 200 | `copies/delete.test.ts`, "só ela" | must |
| 2 | U1 | Depois do Apagar não sobra nenhuma linha da cópia em `copy`, `copy_source`, `copy_run`, `project_copy` nem `copy_table_left`; a proposta aceita dela fica `ACCEPTED` com `copy_id` nulo; `projectView` não a lista | `copies/delete.test.ts`, "o que sai" | must |
| 3 | U1 | Apagar de novo responde 200 com `tablesLeft: []`; uma cópia de outra empresa responde o mesmo, sem mudar nada (S10) | `copies/delete.test.ts`, "de novo" | must |
| 4 | U1 | Quem não tem `manageCopies` recebe a recusa de admissão do Pausar, e nada muda | `copies/delete.test.ts`, "sem permissão" | must |
| 5 | U1 | Uma rodada parada numa página enquanto a cópia é apagada termina `INTERRUPTED`, não recria a tabela e não deixa nenhuma `copy_run` | `copies/delete.test.ts`, "rodada em andamento" | must |
| 6 | U1 | A agenda da cópia apagada sai (`clock.remove`), pausada ou não; o Desligar que acaba uma cópia pausada também tira a agenda dela | `copies/delete.test.ts`, "agenda"; `connectors/unlink-copies.test.ts`, "pausada também" | must |
| 7 | U1 | (A1) O banco da empresa calado no `REVOKE`: 503 `COPY_DATABASE_UNAVAILABLE`, a cópia continua, o app continua lendo; apagar de novo com o banco de volta dá certo | `copies/delete.test.ts`, "banco calado antes" | must |
| 8 | U1 | O banco da empresa calado só no `DROP`: 200 com `tablesLeft: [nome]`, o login do app recebe `42501`, e o próximo Apagar, Desligar ou Ligar derruba a tabela | `copies/delete.test.ts`, "banco calado depois" | must |
| 9 | U1 | Religar com o mesmo nome depois do Apagar começa vazio e sem leitura do app (`42501`) | `copies/delete.test.ts`, "religar" | should |
| 10 | U2 | O menu de cada cópia tem **Apagar**; a janela mostra as linhas, cada Projeto liberado e o aviso de copiar do zero; **Apagar** espera a resposta; o sucesso tira a cópia da lista e, no detalhe, volta para a lista | `copies/copy-delete.test.tsx` | must |
| 11 | U2 | Um 503 mostra a frase do Hub e deixa a janela aberta; um `tablesLeft` mostra o texto da tabela anotada antes de fechar | `copies/copy-delete.test.tsx`, "falhas" | must |
| 12 | U1 | (Emenda) O Desligar com o banco da empresa calado no `REVOKE`: 503 `COPY_DATABASE_UNAVAILABLE`, a conexão e a cópia continuam; com o banco de volta o Desligar dá certo e nenhum app lê a tabela (`42P01`); com o banco calado só no `DROP`, a tabela fica anotada e o app recebe `42501` | `connectors/unlink-copies.test.ts`, "calado na leitura dos apps" e "depois do Hub" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Janela Desligar (`unlink-dialog.tsx`, sem mudança de tela) | como hoje | como hoje | como hoje | o 503 já mostra a frase do Hub, agora também quando a leitura dos apps não saiu | como hoje | como hoje | como hoje |
| Janela Apagar | a janela com as linhas, os Projetos e o aviso | cópia sem Projeto: só as linhas e o aviso; `rows` nulo: "As linhas desta cópia saem…" | "Apagando…", os botões desligados | a frase do Hub (503), a janela aberta | a resposta é 200 também: a cópia sai da lista | a recusa de admissão do Hub, na janela | `tablesLeft`: o texto da tabela anotada, depois **Fechar** |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `deleteCopy` `success.body.tablesLeft` | `dropEndedCopies` (`leave.ts`) | a janela (U2) |
| `CopySummary.rows`, `projects`, `label` (já existem) | `list.ts` | a janela (U2) |

O desenho de caixas e as capturas: a janela segue a do Desligar (`unlink-dialog.tsx`), com o mesmo
`AlertDialog` e o botão `danger-confirm`. A captura a 1366 e 390 px entra no QA (testing T25).

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| A1: `REVOKE` da leitura de cada Projeto (`companyPostgres.revokeCopy`) | repete sem dano (`NOTHING_TO_REVOKE`, `copy-sql.ts:353`) | o app pode ter perdido a leitura de um Projeto e a cópia continua: o novo Apagar repete | 503 `COPY_DATABASE_UNAVAILABLE`, nada muda no Hub | `COPY_GRANT_FAILED` (o de hoje) | 7 |
| (Emenda) o mesmo `REVOKE`, no Desligar (`leaveCopies`) | repete sem dano | o app pode ter perdido a leitura e a conexão continua: o novo Desligar repete | 503 `COPY_DATABASE_UNAVAILABLE`, nada muda no Hub | `COPY_GRANT_FAILED` | 12 |
| `DELETE FROM copy … RETURNING` com a nota em `copy_table_left`, numa transação | a segunda espera a trava da linha e não acha nada: `[]` | a transação inteira volta | o banco do Hub fora: 503 do Hub, nada muda | nada novo | 1, 2, 3, 5 |
| `DROP TABLE IF EXISTS` (`dropEndedCopies`) | a trava da linha de `copy_table_left` serializa (`leave.ts:165-182`); o Ligar do mesmo nome espera (`enable.ts:143-144`) | a linha volta a `copy_table_left` | `tablesLeft: [nome]` | `COPY_TABLES_LEFT` (o de hoje) | 8, 9 |
| `clock.remove` (`schedules.delete` do Mastra) | sem efeito na segunda (`schedules.ts:645-650` volta se não há linha) | fica a rede de hoje: a agenda ativa que dispara acha `GONE` e se apaga (`workflow.ts:59-61`) | o Mastra fora: a cópia já saiu, a agenda órfã fica para o próximo disparo | `COPY_DELETED` com `companyId`, `copyId`, `ended` (S41) | 6 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O item Apagar no menu da cópia | U2 | `copy-list.tsx:137-190` `CopyMenu` (Rodar agora, Pausar ou Retomar, Intervalo) | Airbyte `8aed3123` `docs/platform/cloud/managing-airbyte-cloud/configuring-connections.md:41` | "Delete this connection" nas configurações da conexão; um fluxo por stream (`operator-guides/clear.md:31`, três pontos no stream) | nativo (o `DropdownMenuItem` do menu de hoje) | — | não precisa | `copy-list.tsx` (muda) |
| A janela de confirmação, com o que deixa de funcionar | U2 | `unlink-dialog.tsx` (`AlertDialog`, a lista "O que some"), `text.ts:245-260` | Airbyte `configuring-connections.md:33` ("irreversible… requires a full re-sync"); `clear.md:17`; Mitra `full-study.md:1289` (`DROP` só com confirmação explícita) | aviso de irreversível e de copiar do zero; confirmação antes do `DROP` | nativo (a janela do Desligar) | — | os textos no fim | `copies/copy-delete.tsx` |
| A rota | U1 | nenhuma; o modelo é `unlinkConnection` (`hub-api/src/connectors.ts:261-278`) | Mastra `6e8dfcb8` `packages/connect/src/client.ts:761-768` (`DELETE /v2/connections/{id}`) | `DELETE` do recurso; repetir é inofensivo | nativo (`defineOperation`) | — | não precisa | `packages/hub-api/src/copies.ts` (muda) |
| O fim da cópia no Hub | U1 | `leave.ts:130-157` `endedSourceless` (DELETE com `notExists`, a nota em `copy_table_left`) | o próprio Desligar | DELETE da cópia; a cascata das FKs leva fontes, rodadas e liberações (`tables.ts:112,147,251`); proposta `set null` (`tables.ts:206`) | nativo (as FKs do PostgreSQL; o mesmo dono) | prova 1 e 4 | não precisa | `leave.ts` (muda) |
| A tabela no banco da empresa | U1 | `leave.ts:190-213` `dropEndedCopies`, `copy-sql.ts:323-329` | Airbyte mantém a tabela (`configuring-connections.md:33`, `schema-change-management.md:28`); Mitra trava o `DROP` | aqui o `DROP` é o objetivo, como o Desligar | nativo (o dono de hoje) | prova 1 e 3 | o pedido dele de 2026-11-13 | — |
| A leitura dos apps antes do fim (A1) | U1 | `grants.ts:103-125` `revokeCopy` (o Tirar) | nenhuma faz | — | embrulhado: o `REVOKE` do Tirar antes da transação | prova 3 (sem ele, o app lê 183 linhas) | decisão A | `leave.ts` (muda) |
| A agenda | U1 | `workflow.ts:59-61` (só `GONE` ao disparar), `clock.ts:93-95` `remove`, `clock.ts:113-121` | Mastra `packages/core/src/schedules/schedules.ts:645-650`; só as agendas `active` disparam (`storage/domains/schedules/base.ts:275`) | `schedules.delete` explícito | nativo (`schedules.delete` pelo `clock.remove`) | lido; uma agenda pausada nunca chega a `GONE` | não precisa | `leave.ts` (muda) |
| A rodada em andamento | U1 | `run.ts:89-131` `ended`, `source-pass.ts:23-27` `lost`, `sources.ts:84-97` `whileHeld` | Airbyte `review-connection-status.md:59-61` (o job na fila é cancelado ao apagar) | a rodada perde a concessão e para; trava `copy` e depois `copy_source`, a ordem da cascata (data D22) | nativo (a concessão de hoje) | prova 2 | não precisa | — |
| O app publicado | fica de fora | `apps/edge/src/db.ts:24-28` (`failureOf`), `packages/app/src/server.ts:23-24`, `dispatch.ts:175-178` | Airbyte: o dado fica, nada quebra | o app recebe `42P01`, vira `DatabaseRefused`; sem tratamento, a página 502 do edge | nativo (como depois do Desligar) | prova 1 (`42P01`) | o aviso da janela | — |
| O Builder e as propostas | fica de fora | `project-view.ts`, `tables.ts:206` | — | a cópia some da visão do Projeto; o Builder pode propor o mesmo nome de novo | nativo | prova 4 | fica de fora (issue 1000) | — |
| O registro | U1 | `schedule.ts` (`COPY_PAUSED`, `COPY_RESUMED`) | — | uma linha de log por ato, com campos escalares (S41) | nativo | — | não precisa | `leave.ts` (muda) |

**A medida do transplante.** Nada vem do repositório antigo.

**A dívida.**

- Uma rodada que perde a concessão por um Apagar ou um Desligar loga `COPY_CLAIM_LOST` como erro
  (`source-pass.ts:23-27`), embora o ato seja esperado. Fica como está; vai para a seção 11 da
  arquitetura.

## U1 O Apagar no Hub

**Base e modelo.** `main` `759c728e`. Opus: a unidade muda o dono que o Desligar usa, dentro de uma
transação com travas e uma cascata (concorrência).

### As linhas da tabela

A rota, o fim da cópia no Hub, a tabela no banco da empresa, a leitura dos apps antes do fim (A1), a
agenda, a rodada em andamento e o registro. Ler antes: `leave.ts` inteiro, `connections.ts:296-332`
(`unlink`), `grants.ts:103-125`, `enable.ts:132-172`, `sources.ts:79-97`,
`builder/copy-clock/workflow.ts:40-80` e `clock.ts:84-121`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/copies/grants.ts` | muda (emenda): `revokedInDatabase`, o `REVOKE` do Tirar sem a admissão nem a linha, que Tirar, Apagar e Desligar usam | `leave.ts` |
| `apps/server/src/hub/copies/leave.ts` | muda: um `endCopies(tx, companyId, where)` interno serve `endedSourceless` e `deleteCopy`; a agenda sai no mesmo dono | `service.ts`, `connectors/connections.ts:314-324` (pela porta `ofConnections`) |
| `apps/server/src/hub/copies/service.ts`, `routes.ts` | muda: `delete` | `main.ts:196`, os testes |
| `packages/hub-api/src/copies.ts` | cria `deleteCopy` | `apps/web/src/hub/copies/queries.ts` (U2) |
| `apps/server/src/hub/connectors/connections.ts` | não muda: o `ended` da porta passa a tirar as agendas | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/copies.ts
export const deleteCopy = defineOperation({
  id: 'deleteCopy',
  access: 'session',
  method: 'DELETE',
  path: `${BASE}/{copyId}`,
  bodyLimit: 1024,
  input: { params: OfCopy },
  // tablesLeft: a tabela que o banco da empresa ainda não derrubou; a cópia saiu do mesmo jeito.
  success: { status: 200, body: z.object({ tablesLeft: z.array(z.string()) }) },
  failures: [...READ_FAILURES, 'COPY_DATABASE_UNAVAILABLE'],
})

// apps/server/src/hub/copies/leave.ts
export function deleteCopy(deps: CopiesDeps, input: InCompany & { copyId: CopyId }): Promise<{ tablesLeft: string[] }>
```

- **O dono de cada fato.** O fim de uma cópia (a linha, a nota em `copy_table_left`, a agenda) tem um
  dono só: `leave.ts`. `endedSourceless` e `deleteCopy` diferem só no `where` do `DELETE`.
- **Sem `DELETE` novo em `database-grants.sql`.** O `hub_company` tem `DELETE` em `copy` e não em
  `copy_source` (`database-grants.sql:353,382`); a cascata das FKs tira as fontes, como no Desligar.
  A primeira prova que apagava `copy_source` direto levou `42501`.
- **Modelo.** `endedSourceless` cumpre C21, C23 e C26; serve de modelo.

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/server` (Fastify, Drizzle, Mastra) e
`packages/hub-api`; a regra D22 do guia de dados.

### A ordem do trabalho

1. `leave.ts`: tirar o corpo de `endedSourceless` para `endCopies(tx, companyId, where)`, que faz
   `DELETE … RETURNING` e a nota; `endedSourceless` passa `and(inArray, notExists)`. O Desligar fica
   igual (os testes de `unlink-copies.test.ts` passam sem mudar).
2. `deleteCopy`: admitir `manageCopies` e ler o nome e as liberações (`project_copy`); (A1) para cada
   Projeto, o `revokeCopy` do banco da empresa, fora de transação, e 503 se ele não responder; numa
   transação, `endCopies` com `eq(copy.id, copyId)`; depois `dropEndedCopies`; depois `clock().remove`
   de cada cópia acabada; log `COPY_DELETED`. Regras: data D22, security S10, S41.
2a. (Emenda) `takeReadAway(deps, input, copies)` em `leave.ts`, que `deleteCopy` e `leaveCopies` usam: o
   `REVOKE` de cada liberação das cópias dadas, por `revokedInDatabase`; `leaveCopies` o chama para as
   cópias de que a conexão é a última fonte, antes de tirar as linhas da conta.
3. A agenda no mesmo dono: a porta `ofConnections.dropEnded` (ou um passo depois dela) tira a agenda
   das cópias que o Desligar acabou, para a cópia pausada não ficar com agenda órfã.
4. `service.ts`, `routes.ts`, `hub-api`: a rota.

### Como se prova

Os critérios 1 a 9 em `copies/delete.test.ts`, pela rota `DELETE` (testing T5), sobre `copiesOn`, com
`holdPage` para a rodada em andamento, `t.mock.method` em `revokeCopy` e `dropCopyTable` para o banco
calado, e o login do app como em `unlink-copies.test.ts:18-33`. O critério 6 do Desligar entra em
`unlink-copies.test.ts` (o caso "pausada também" passa a conferir `calls` do relógio). A prova do
estudo (`delete-copy-proof.test.ts`, no relatório) mostra os mesmos fatos hoje.

### Parar se

- O `REVOKE` com o login do app ainda inexistente (Projeto sem app) recusa algo fora de
  `NOTHING_TO_REVOKE`: parar e trazer o código.
- Tirar a agenda no Desligar muda algum teste do relógio além do critério 6.

## U2 O Apagar na tela

**Base e modelo.** Depois da U1. Sonnet.

### As linhas da tabela

O item Apagar e a janela de confirmação. Ler antes: `copy-list.tsx:116-190`, `copy-detail.tsx:140-160`,
`connectors/unlink-dialog.tsx` inteiro, `connectors/text.ts:245-260`, `copies/queries.ts`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/copies/copy-list.tsx` | muda: o item **Apagar** e a janela | `copy-detail.tsx` |
| `apps/web/src/hub/copies/copy-delete.tsx` | cria: a janela | `copy-list.tsx` |
| `apps/web/src/hub/copies/text.ts`, `queries.ts` | muda: os textos, `sendDeleteCopy` | a janela |

### A ordem do trabalho

1. `queries.ts`: `sendDeleteCopy` do `deleteCopy`; no sucesso, invalidar a lista, o detalhe e as
   cópias de cada Projeto.
2. `copy-delete.tsx`: o `AlertDialog` do Desligar, título "Apagar a cópia {label}?", as linhas
   (`rows`), um item por Projeto de `projects`, o aviso de copiar do zero; `danger-confirm`.
3. `copy-list.tsx`: o item no menu, depois de um separador; no detalhe, o sucesso volta à lista.
4. Os textos em `text.ts`, a frase da tabela anotada dizendo "a cópia foi apagada", não "a conexão foi
   removida".

### Como se prova

`copies/copy-delete.test.tsx` com o Hub de teste da web (`test-hub.tsx`): os critérios 10 e 11; o
navegador a 1366 e 390 px, nos dois temas (testing T23).

### Parar se

- A janela precisa de um dado que `CopySummary` não tem.
