# A máquina do Assistente que não pausa a cada mensagem

Trilho: assistente

Cartão curto, fora da ordem do roteiro. O pedido do fundador, em 2026-11-13: "Toda hora que eu mando
mensagem [...] ele fala ligando á maquina toda mensagem" e, depois de ver a causa, "Confirmado. É o
arquivo, eu já vi." A direção dele depois do estudo: usar o nativo "igual o Master Factory faz", sem
lógica paralela. Lido em `main` `7003326e`, com `@mastra/core` 1.82.0, `@mastra/memory` 1.41.0 e
`@mastra/e2b` 0.16.1. Referências: Mastra `6e8dfcb8` (`mastra-1.82`, com o Mastra Code e a Factory em
`mastracode/`).

## A página do fundador

**No fim desta etapa** você manda uma mensagem ao Assistente e, se mandar outra em até 5 minutos, a
máquina da conversa continua ligada: some o "Ligando a máquina…" de 2 a 3 segundos e a cobrança do
E2B por religar a cada mensagem. Passados 5 minutos sem uso, o próprio E2B pausa a máquina, e a
mensagem seguinte a religa uma vez. Apagar a conversa continua apagando a máquina dela.

**O que muda para você.** Hoje o Hub pausa a máquina no fim de cada resposta. Passa a deixar isso ao
E2B, como a Factory do Mastra faz com uma máquina E2B por sessão: 5 minutos de tempo parado, o padrão
dela. Um arquivo colocado numa mensagem antiga deixa de ligar a máquina por si: com a máquina ligada o
Mastra o confere em cada mensagem sem custo de partida, e com a máquina fora o turno segue com a nota
`[File not uploaded]` do Mastra em vez de falhar.

**O roteiro de uso.**

1. Abra uma conversa nova com o Assistente e mande um PDF com "Quais as regras?". Aparece "Ligando a
   máquina…" uma vez e a resposta lê o arquivo.
2. Em até 5 minutos, mande "Oi" e depois "Obrigado". As duas respostas saem sem "Ligando a máquina…".
3. Espere mais de 5 minutos e mande "Liste os arquivos da conversa". A máquina volta, uma vez, e o PDF
   está lá.
4. Apague a conversa. A máquina dela é apagada, não fica pausada para sempre.

**O que você faz, e quando.** No começo: aprova esta página. No fim: faz o roteiro.

**Fica de fora.**

- Os outros agentes (Builder, Construtor, agentes da empresa): continuam pausando a máquina no fim do
  turno e com a hora de E2B de hoje.
- O código que guardava o caminho do arquivo e semeava o cache do Mastra (a forma B1 do estudo): o
  fundador não quer lógica paralela. A issue ao Mastra com o pedido de uma opção pública, já aberta com
  a palavra dele, segue valendo: https://github.com/mastra-ai/mastra/issues/30366.
- Provar o relógio do E2B: nenhuma chamada ao E2B está autorizada. Os testes provam o que o Hub pede
  (`timeout` e `lifecycle`) e que ele não pausa; os 5 minutos contam de como o E2B os conta.

**As decisões suas nesta etapa.** Nenhuma nova: a direção está nas palavras dele, registradas em
`docs/approvals.md`. O critério 21 da etapa 24.1 (a máquina pausa no fim do turno) é substituído por
elas, para o Assistente.

## A unidade

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 A máquina do Assistente fica ligada até o E2B pausá-la | o fim do turno não pausa; o E2B pausa após 5 minutos; o arquivo do histórico com a máquina fora vira a nota nativa | `apps/server/src/builder/assistant/`, `apps/server/src/builder/machine/` | [testing](../guides/testing.md) | nada |

**Orçamento de código alterado.** U1: cerca de 20 linhas, sem testes. Total: o mesmo.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | PDF no turno 1, "Oi" no 2, "Obrigado" no 3: a máquina parte uma vez, nenhum turno a pausa e o arquivo foi gravado uma vez. Recusa: um turno que acaba pausando a máquina | `assistant/files-machine.test.ts`, "o turno seguinte reusa a máquina que o anterior deixou ligada" | must |
| 2 | U1 | O fim do turno não para a máquina e o turno seguinte a reusa, sem outra partida; o Hub pede ao provedor 5 minutos | `assistant/machine.test.ts`, "o fim do turno não para a máquina…" | must |
| 3 | U1 | O kit do E2B recebe `timeout` de 5 minutos e `lifecycle: { onTimeout: 'pause' }` quando quem monta pede, e sem pedido segue com a hora de hoje do Builder | `machine/machine-e2b.test.ts`, "o kit do E2B pausa pelo tempo parado que quem monta pede…" | must |
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
| O tempo que a máquina fica ligada sem uso | U1 | `machine/e2b.ts` (`timeout` de 1 hora para todos); `assistant/turn.ts` `ended` chama `machines.stop` | **mesma situação** (máquina E2B remota por sessão), a Factory: `mastra-1.82` `workspaces/e2b/src/factory-sandbox.ts:30` (`idleTimeoutMinutes: 5`), `:154,159-162` (vira o `timeout` do `E2BSandbox`); `@mastra/core` 1.82.0 `dist/docs/references/reference-workspace-factory-sandbox.md:75` ("a 5 minute idle timeout on Platform and E2B"); `@mastra/e2b` `src/sandbox/index.ts:286,412-424` (`lifecycle` `onTimeout: 'pause'`, `timeoutMs`). **Situação diferente: local, sem pausa nem custo**, o Mastra Code: `mastracode/sdk/src/agents/workspace.ts:257` usa `LocalSandbox`; só mostra que o espaço de trabalho vive com a sessão | a Factory não pausa a cada turno: deixa a máquina ao `timeout` de 5 minutos do E2B, que pausa e depois religa | nativo: o Assistente pede `timeout` 5 minutos pela opção pública `timeout` do `E2BSandbox`; o fim do turno não chama `stop()` | — | "Eu quero utilizar esse nativo igual o Master Factory faz" | — |
| A máquina pausada volta quando uma ferramenta a pede | U1 | `machine/conversation.ts` `ensure` (a sessão fica guardada enquanto o Hub vive) | **mesma situação**, `@mastra/e2b` 0.16.1 `dist/index.js:2175-2212` (`isSandboxDeadError`, `retryOnDead`, `ensureRunning`); `@mastra/core` 1.82.0 `dist/docs/references/reference-workspace-sandbox.md:52` (`onStart` roda também na revivência) | a ferramenta que acha a máquina pausada a religa pelo mesmo nome e roda de novo | nativo | — | idem | — |
| O arquivo de um turno anterior com a máquina fora | U1 | `assistant/files.ts` `processLLMRequest` (partida antecipada, `:124-132`, apagada) | `@mastra/core` 1.82.0 `dist/docs/references/reference-processors-file-upload-processor.md:173,181`; `mastra-1.82` `packages/core/src/processors/processors/file-upload.ts:144-160,346-354` | a falha da máquina com um arquivo do histórico vira a nota `[File not uploaded]` e o turno segue | nativo: apagar a partida antecipada | teste invertido (critério 4) | idem; "1. Aprovo" (C) | — |
| A conversa apagada apaga a máquina | U1 | `assistant/routes.ts:241` e `assistant/release.ts:28` chamam `machines.kill` (`machine/e2b.ts` `killWhere`, por marca e id) | **mesma situação**, a Factory: `mastracode/factory/src/sandbox/session-retirement.ts:70-76` ("Providers such as E2B keep paused VMs forever, so the row's deletion must never orphan one") | a sessão apagada destrói a máquina; o parar fica para o relógio do provedor | nativo, já no main | `delete.test.ts` | idem | — |

**A medida do transplante.** Nada vem do repositório antigo.

**A dívida.** O E2B conta os 5 minutos do jeito dele, e nenhuma chamada a ele está autorizada: o
relógio não foi provado, só o que o Hub pede. A sessão de cada conversa fica guardada no Hub enquanto
ele vive (como a memória de sessões da Factory) e some quando a conversa é apagada ou o Hub acaba.

## U1 A máquina do Assistente fica ligada até o E2B pausá-la

**Base e modelo.** `main` `7003326e`. Sonnet.

### As linhas da tabela

As quatro da tabela acima. O builder abre `factory-sandbox.ts:150-165` e `sandbox/index.ts:280-290`
no `mastra-1.82`, e `dist/index.js` do `@mastra/e2b` 0.16.1 instalado.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `assistant/files.ts` | apaga a partida antecipada de `processLLMRequest` | `assistant/assistant.ts` |
| `assistant/turn.ts` | apaga o `ended` e o campo `machines` de `assistantTurns` | `assistant/assistant.ts` |
| `assistant/assistant.ts` | muda: `idleMs` de 5 minutos às máquinas do Assistente | — |
| `machine/conversation.ts`, `machine/kit.ts`, `machine/e2b.ts` | `idleMs` opcional em `Deps` e em `KitOptions`; o E2B usa `idleMs ?? 1 hora` | os donos que montam máquinas (só o Assistente passa) |
| `machine/test-machine.ts`, `machine/test-machine-slow.ts` | o `Control` guarda o `idleMs` pedido; a leitura lenta sai para o arquivo novo (limite de linhas do Biome) | os testes |

### Os contratos que a unidade cria

```ts
// machine/kit.ts, em KitOptions e em conversation.ts, em Deps
idleMs?: number
```

### As skills e a leitura

`docs/reference/stack.md`, linhas de `apps/server/src/builder/`: a skill `mastra`. Ler primeiro o
`dist/docs` do `@mastra/core` instalado sobre sandbox e a Factory.

### A ordem do trabalho

1. `files.ts`: apagar a partida antecipada.
2. `turn.ts` e `assistant.ts`: o fim do turno não chama `stop`; o Assistente pede 5 minutos.
3. `conversation.ts`, `kit.ts`, `e2b.ts`: o `idleMs` até o `timeout` do `E2BSandbox`.
4. Testes: os critérios 1 a 5.

### Como se prova

Os testes acima, rodados com o servidor de teste. Hoje o critério 2 vê uma parada por turno.

### Parar se

O E2B ou o Mastra pedirem outra opção que não seja `timeout` e `lifecycle` do `E2BSandbox`.
