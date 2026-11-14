# A máquina da conversa que não pausa a cada mensagem

Trilho: assistente

Cartão curto, fora da ordem do roteiro. O pedido do fundador, em 2026-11-13: "Toda hora que eu mando
mensagem [...] ele fala ligando á maquina toda mensagem" e, depois de ver a causa, "Confirmado. É o
arquivo, eu já vi." A direção dele depois do estudo: usar o nativo "igual o Master Factory faz", sem
lógica paralela, e para todo agente que usa a máquina da conversa, o Builder e o Construtor entre eles ("sIM MESMO PADRÃO NATIVO"). Lido em `main` `7003326e`, com `@mastra/core` 1.82.0, `@mastra/memory` 1.41.0 e
`@mastra/e2b` 0.16.1. Referências: Mastra `6e8dfcb8` (`mastra-1.82`, com o Mastra Code e a Factory em
`mastracode/`).

## A página do fundador

**No fim desta etapa** você manda uma mensagem a um agente com máquina (o Assistente, o Builder, o
Construtor ou um agente da empresa com o Computador ligado) e a máquina da conversa continua ligada
depois da resposta: some o "Ligando a máquina…" de 2 a 3 segundos e a cobrança do E2B por religar a
cada mensagem. O E2B conta 5 minutos desde que a máquina ligou (ou voltou), não desde a sua última
mensagem; passados eles, ele a pausa, e a próxima ferramenta que precisar dela a religa sozinha, uma
vez. É assim que a Factory do Mastra faz. Apagar a conversa continua apagando a máquina dela.

No Builder a mudança tem um efeito a mais, que você vai notar: o Hub passa a guardar a máquina da
conversa entre as mensagens, como a Factory guarda a de cada sessão. O que as outras conversas do
mesmo app salvaram entra na máquina quando ela liga e quando ela volta de uma pausa do E2B, não a cada
mensagem. Numa conversa que segue ligada, a mudança de outra conversa só aparece depois que a máquina
volta. O trabalho ainda não salvo continua na máquina, e os conflitos são avisados ao modelo na mesma
hora em que o main entra.

**O que muda para você.** Hoje o Hub pausa a máquina no fim de cada resposta, em cada um desses
agentes. Passa a deixar isso ao E2B, com uma só configuração para todos, como a Factory do Mastra faz
com uma máquina E2B por sessão: 5 minutos, o padrão dela. O Hub não renova esse prazo a cada mensagem,
porque a Factory também não. Um arquivo colocado numa mensagem antiga deixa de ligar a máquina por si:
com a máquina ligada o Mastra o confere em cada mensagem sem custo de partida, e com a máquina fora o
turno segue com a nota `[File not uploaded]` do Mastra em vez de falhar.

**O roteiro de uso.**

1. Abra uma conversa nova com o Assistente e mande um PDF com "Quais as regras?". Aparece "Ligando a
   máquina…" uma vez e a resposta lê o arquivo.
2. Logo em seguida, mande "Oi" e depois "Obrigado". As duas respostas saem sem "Ligando a máquina…".
3. Espere mais de 5 minutos desde que a máquina ligou e mande "Liste os arquivos da conversa". A
   máquina volta, uma vez, e o PDF está lá.
4. Apague a conversa. A máquina dela é apagada, não fica pausada para sempre.
5. No Construtor, peça uma ferramenta e, logo depois, outra mudança na mesma conversa. A segunda
   mensagem sai sem "Ligando a máquina…".
6. No Builder, num Projeto, peça uma mudança no app e, logo depois, outra na mesma conversa. A segunda
   mensagem sai sem "Ligando a máquina…" e a versão da primeira já foi salva.
7. Duas conversas do mesmo app: salve uma mudança numa e, na outra, peça algo. A mudança da primeira
   ainda não aparece na outra enquanto a máquina dela segue ligada. Espere o E2B pausar a máquina
   (mais de 5 minutos desde que ligou ou voltou) e peça de novo: a máquina volta, e a mudança aparece.
8. Conferência ao vivo de turnos longos: peça ao Builder e ao Construtor um trabalho que passe de 5
   minutos desde que a máquina ligou (gerar e conferir um app; uma ferramenta com vários testes). O
   turno termina inteiro: se o E2B pausar a máquina no meio, a próxima ferramenta a religa sozinha e o
   trabalho não salvo continua lá.

**O que você faz, e quando.** No começo: aprova esta página. No fim: faz o roteiro.

**Fica de fora.**

- O código que guardava o caminho do arquivo e semeava o cache do Mastra (a forma B1 do estudo): o
  fundador não quer lógica paralela. A issue ao Mastra com o pedido de uma opção pública, já aberta com
  a palavra dele, segue valendo: https://github.com/mastra-ai/mastra/issues/30366.
- Renovar o prazo do E2B a cada turno: a Factory não o faz, e o fundador pediu o nativo. A sessão de
  cada conversa guardada no Hub e o `stopAll` no fim do Hub, com muitas conversas, ficam na issue
  futura https://github.com/developmentconexus-ops/conexus/issues/1031.
- Provar o relógio do E2B: nenhuma chamada ao E2B está autorizada. Os testes provam o que o Hub pede
  (`timeout` e `lifecycle`) e que ele não pausa; os 5 minutos contam de como o E2B os conta (desde que a máquina liga ou volta).

**As decisões suas nesta etapa.** Nenhuma nova: a direção está nas palavras dele, registradas em
`docs/approvals.md`. O critério 21 da etapa 24.1 (a máquina pausa no fim do turno) é substituído por
elas, para todo agente com máquina.

## A unidade

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 A máquina de todo agente fica ligada até o E2B pausá-la | o fim do turno não pausa; o E2B pausa após 5 minutos, numa configuração só; o arquivo do histórico com a máquina fora vira a nota nativa | `apps/server/src/builder/assistant/`, `apps/server/src/builder/construtor/`, `apps/server/src/builder/agents/`, `apps/server/src/builder/machine/` | [testing](../guides/testing.md) | nada |

**Orçamento de código alterado.** U1: cerca de 80 linhas, sem testes. Total: o mesmo.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | PDF no turno 1, "Oi" no 2, "Obrigado" no 3: a máquina parte uma vez, nenhum turno a pausa e o arquivo foi gravado uma vez. Recusa: um turno que acaba pausando a máquina | `assistant/files-machine.test.ts`, "o turno seguinte reusa a máquina que o anterior deixou ligada" | must |
| 2 | U1 | O fim do turno do Assistente não para a máquina e o turno seguinte a reusa, sem outra partida. Recusa: um turno que acaba pausando | `assistant/machine.test.ts`, "o fim do turno não para a máquina…" | must |
| 3 | U1 | O kit do E2B, que todo agente usa, recebe `timeout` de 5 minutos e `lifecycle: { onTimeout: 'pause' }`, sem opção por agente | `machine/machine-e2b.test.ts`, "o E2B a mantém ligada 5 minutos desde que liga…" | must |
| 3a | U1 | O fim do turno do Construtor e o de um agente da empresa também não param a máquina | `construtor/code-tool.test.ts`, "o teste passa…"; `agents/machine.test.ts`, "o Computador: o agente roda um comando…" (a máquina segue ligada no fim do turno) | must |
| 3b | U1 | O fim do turno do Builder não para a máquina e o Hub guarda a sessão: o turno seguinte a usa sem outra partida e o main não entra a cada mensagem. Depois que o E2B pausa a máquina e a ferramenta seguinte a retoma, o main entra de novo pelo início nativo (`onStart`), com o trabalho não salvo mantido e a detecção de conflitos de sempre. Recusa: um turno que para a máquina, ou um main que entra a cada mensagem | `machine/machine.test.ts`, "o fim do turno do Builder não para a máquina…"; `machine/machine-sync.test.ts`; `runs/runs-cut.test.ts` | must |
| 4 | U1 | Num Hub novo, sem máquina e com o provedor fora, o arquivo só do histórico não derruba o turno: termina `complete` e a chamada ao modelo leva a nota `[File not uploaded]`. Um arquivo desta mensagem com a máquina fora segue falhando como `MACHINE_UNAVAILABLE` | `assistant/files-machine.test.ts`, "a máquina fora com o arquivo só do histórico…" e "a máquina fora: o turno falha e o arquivo não vaza" | must |
| 5 | U1 | Apagar a conversa apaga a máquina (já existe) e o fim do Hub ainda pausa as máquinas que segura | `assistant/delete.test.ts`; `assistant/machine.test.ts`, "o fim do Hub…" | must |

## A matriz de estados

Nenhuma tela nova nem texto novo. Há uma mudança que a pessoa vê: "Ligando a máquina…" deixa de
aparecer quando a máquina continua ligada. Quando o E2B a pausou e uma ferramenta a pede, o Mastra a
religa por dentro da chamada (`retryOnDead`), sem a fase do Hub; o roteiro, passo 3, mostra isso.

## A tabela de falhas

Nenhuma gravação nova nem comando novo: o cartão não cria contrato, tabela nem migração.

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O tempo que a máquina fica ligada antes do E2B a pausar | U1 | `machine/e2b.ts` (`timeout` de 1 hora para todos); `assistant/turn.ts`, `construtor/construtor.ts` e `agents/controller.ts`: `ended` chama `machines.stop`; `runs/runs.ts:251,331` chama `machines.release`, que chama `sandbox.stop()` em `machine/machines.ts:333` (o Builder) | **mesma situação** (máquina E2B remota por sessão), a Factory: `mastra-1.82` `workspaces/e2b/src/factory-sandbox.ts:30` (`idleTimeoutMinutes: 5`), `:154,159-162` (vira o `timeout` do `E2BSandbox`); `@mastra/core` 1.82.0 `dist/docs/references/reference-workspace-factory-sandbox.md:75` ("a 5 minute idle timeout on Platform and E2B"); `@mastra/e2b` `src/sandbox/index.ts:286,412-424` (`lifecycle` `onTimeout: 'pause'`, `timeoutMs`); a Factory guarda a máquina por sessão e não reconecta por turno, `mastracode/factory/src/sandbox/session-sandbox.ts:138`; o E2B conta o `timeout` desde a criação ou o último `connect`, `e2b` 2.63.0 `dist/index.d.ts:10240-10252,11720-11729`. **Situação diferente: local, sem pausa nem custo**, o Mastra Code: `mastracode/sdk/src/agents/workspace.ts:257` usa `LocalSandbox`; só mostra que o espaço de trabalho vive com a sessão | a Factory não pausa a cada turno: deixa a máquina ao `timeout` de 5 minutos do E2B, que pausa e depois religa | nativo: o kit do E2B (`machine/e2b.ts`, um lugar só) pede `timeout` 5 minutos pela opção pública do `E2BSandbox`; nenhum fim de turno chama `stop()`, nem o do Builder | — | "Eu quero utilizar esse nativo igual o Master Factory faz"; "sIM MESMO PADRÃO NATIVO" (todos os agentes) | — |
| A máquina pausada volta quando uma ferramenta a pede | U1 | `machine/conversation.ts` `ensure` (a sessão fica guardada enquanto o Hub vive) | **mesma situação**, `@mastra/e2b` 0.16.1 `dist/index.js:2175-2212` (`isSandboxDeadError`, `retryOnDead`, `ensureRunning`); `@mastra/core` 1.82.0 `dist/docs/references/reference-workspace-sandbox.md:52` (`onStart` roda também na revivência) | a ferramenta que acha a máquina pausada a religa pelo mesmo nome e roda de novo | nativo | — | idem | — |
| O arquivo de um turno anterior com a máquina fora | U1 | `assistant/files.ts` `processLLMRequest` (partida antecipada, `:124-132`, apagada) | `@mastra/core` 1.82.0 `dist/docs/references/reference-processors-file-upload-processor.md:173,181`; `mastra-1.82` `packages/core/src/processors/processors/file-upload.ts:144-160,346-354` | a falha da máquina com um arquivo do histórico vira a nota `[File not uploaded]` e o turno segue | nativo: apagar a partida antecipada | teste invertido (critério 4) | idem; "1. Aprovo" (C) | — |
| A conversa apagada apaga a máquina | U1 | `assistant/routes.ts:241` e `assistant/release.ts:28` chamam `machines.kill` (`machine/e2b.ts` `killWhere`, por marca e id) | **mesma situação**, a Factory: `mastracode/factory/src/sandbox/session-retirement.ts:70-76` ("Providers such as E2B keep paused VMs forever, so the row's deletion must never orphan one") | a sessão apagada destrói a máquina; o parar fica para o relógio do provedor | nativo, já no main | `delete.test.ts` | idem | — |
| A sessão da máquina do Builder entre turnos, e o main entrando no início | U1 | `machine/machines.ts` (`workspaceFor` cria uma sessão por turno e `release` a solta) | **mesma situação**, a Factory: `mastracode/factory/src/sandbox/session-sandbox.ts:138` (um `Map` por sessão); `mastracode/factory/src/workspace.ts:815-821` (o preparo roda no início do provedor em TODA partida, criar ou reconectar); `@mastra/e2b` 0.16.1 `dist/index.js:2175-2217` (`retryOnDead` reinicia e roda o `onStart` de novo) | o preparo (aqui, o main) entra pelo gancho de início do provedor, na partida e na volta da pausa | nativo: o gancho `onStart` que o Builder já usa; a sessão guardada é a do Factory | prova por teste: `machine/machine.test.ts` (a volta da pausa roda o main de novo) | "quero testar a A identifo a factory e a documenhtação do /mastra" | — |

**A medida do transplante.** Nada vem do repositório antigo.

**A dívida.** O E2B conta os 5 minutos desde que a máquina liga ou volta, e nenhuma chamada a ele está autorizada: o
relógio não foi provado, só o que o Hub pede. A sessão de cada conversa fica guardada no Hub enquanto
ele vive (como a memória de sessões da Factory) e some quando a conversa é apagada ou o Hub acaba.

## U1 A máquina de todo agente fica ligada até o E2B pausá-la

**Base e modelo.** `main` `7003326e`. Sonnet.

### As linhas da tabela

As quatro da tabela acima, com o Builder na primeira. O builder abre `factory-sandbox.ts:150-165` e `sandbox/index.ts:280-290`
no `mastra-1.82`, e `dist/index.js` do `@mastra/e2b` 0.16.1 instalado.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `assistant/files.ts` | apaga a partida antecipada de `processLLMRequest` | `assistant/assistant.ts` |
| `assistant/turn.ts`, `construtor/construtor.ts`, `agents/controller.ts` | apagam o `ended` que chamava `machines.stop` (e o campo `machines` de `assistantTurns`) | `assistant/assistant.ts` |
| `machine/machines.ts`, `machine/port.ts`, `runs/runs.ts`, `runs/removal.ts` | a sessão da máquina passa a viver com a conversa: `release` não para nem tira a sessão, `kill` a tira, e todo início (criar, achar ou retomar) roda o `onStart`, sem o caminho `keep` | `runs/runs.ts`, `runs/removal.ts` (a conversa apagada solta e depois mata a máquina) |
| `machine/conversation.ts` | `stop` passa a privado, atrás de `stopAll` (o fim do Hub), sem mudar o comportamento | `assistant/`, `construtor/` e `agents/`, por `stopAll` |
| `machine/e2b.ts` | muda: o `timeout` do `E2BSandbox` é de 5 minutos para todo agente, no lugar de 1 hora | os quatro donos que montam máquinas (Assistente, Builder, Construtor, agentes), sem opção própria |
| `machine/test-machine.ts`, `machine/test-machine-slow.ts` | a leitura lenta sai para o arquivo novo (limite de linhas do Biome) | os testes |

### Os contratos que a unidade cria

Nenhum: o tempo parado é uma constante do kit do E2B, sem opção por agente.

### As skills e a leitura

`docs/reference/stack.md`, linhas de `apps/server/src/builder/`: a skill `mastra`. Ler primeiro o
`dist/docs` do `@mastra/core` instalado sobre sandbox e a Factory.

### A ordem do trabalho

1. `files.ts`: apagar a partida antecipada.
2. `assistant/turn.ts`, `construtor/construtor.ts`, `agents/controller.ts`, `machine/machines.ts`: o fim do turno não chama `stop`.
3. `machine/e2b.ts`: o `timeout` do `E2BSandbox` passa a 5 minutos, para todos.
4. Testes: os critérios 1 a 5, com o 3a e o 3b.

### Como se prova

Os testes acima, rodados com o servidor de teste. Hoje o critério 2 vê uma parada por turno.

### Parar se

O E2B ou o Mastra pedirem outra opção que não seja `timeout` e `lifecycle` do `E2BSandbox`.
