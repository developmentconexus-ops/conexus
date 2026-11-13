# O arquivo de um turno anterior e a máquina que liga a cada mensagem

Trilho: assistente

Cartão curto, fora da ordem do roteiro. O pedido do fundador, em 2026-11-13: "Toda hora que eu mando
mensagem [...] ele fala ligando á maquina toda mensagem" e, depois de ver a causa, "Confirmado. É o
arquivo, eu já vi." Lido em `main` `7003326e`, com `@mastra/core` 1.82.0 e `@mastra/memory` 1.41.0.
Referências: Mastra `6e8dfcb8` (`mastra-1.82`, com o Mastra Code e a Factory em `mastracode/`) e `dyad@902829f`.

## A página do fundador

**No fim desta etapa** você manda um PDF ou uma planilha ao Assistente e, nas mensagens seguintes da
mesma conversa ("Oi", "obrigado"), a máquina não liga mais: some o "Ligando a máquina…" de 2 a 3
segundos e a cobrança do E2B por mensagem. A máquina só liga quando o arquivo é desta mensagem ou
quando o Assistente precisa dela para uma ferramenta. Ela continua pausando no fim de cada turno.

**O roteiro de uso.**

1. Abra uma conversa nova com o Assistente e mande um PDF com "Quais as regras?". Aparece "Ligando a
   máquina…" uma vez e a resposta lê o arquivo.
2. Mande "Oi" e depois "Obrigado". As duas respostas saem sem "Ligando a máquina…".
3. Peça "Liste os arquivos da conversa". A máquina liga nessa mensagem, porque uma ferramenta a pede,
   e o PDF está lá.

**O que você faz, e quando.** No começo: aprova esta página. No fim: faz o roteiro.

**Fica de fora.**

- Deixar a máquina ligada alguns minutos depois de cada turno (a opção A do estudo). Palavra do
  fundador: "2. Não". O critério 21 da etapa 24.1 (a máquina pausa no fim do turno) fica como está.
- Os outros agentes (Builder, Construtor, agentes da empresa): não colocam arquivos na máquina.
- A issue ao Mastra com o pedido de uma opção pública (chamada a serviço de fora: é do firstmate ou
  do fundador).

**As decisões suas nesta etapa.** Nenhuma nova. Ele já disse "1. Aprovo" à forma recomendada: o
arquivo colocado num turno anterior vira a nota sem ligar a máquina (B com B1), e com a máquina fora
e o arquivo só no histórico o turno segue com a nota do Mastra (C). O veredito é remendo em uma
linha (B1, abaixo), com a prova da tabela.

## A unidade

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 O arquivo colocado vira nota sem a máquina | o caminho gravado na parte do arquivo; o cache do Mastra semeado com ele; a máquina nova esquece | `apps/server/src/builder/assistant/`, `apps/server/src/builder/machine/` | [testing](../guides/testing.md) | nada |

**Orçamento de código alterado.** U1: cerca de 170 linhas, sem testes. Total: o mesmo.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | PDF no turno 1, "Oi" no 2, "Obrigado" no 3: a máquina parte `[1,0,0]` vezes, a chamada ao modelo de cada turno leva a nota do arquivo (mesmo caminho) e o arquivo foi gravado uma vez. Recusa: um arquivo deste turno ainda liga a máquina e, se ela não liga, o turno falha com `MACHINE_UNAVAILABLE` | `assistant/files-machine.test.ts`, "o arquivo de um turno anterior vira nota sem ligar a máquina" e "a máquina fora: o turno falha e o arquivo não vaza" | must |
| 2 | U1 | Com a máquina fora no turno 2 e o arquivo só no histórico, o turno termina `complete` e a chamada ao modelo leva a mesma nota. Uma ferramenta da máquina nesse turno falha como hoje | `assistant/files-machine.test.ts`, "a máquina fora com o arquivo só do histórico: o turno segue com a nota" | must |
| 3 | U1 | Uma máquina nova (reciclada) esquece onde o arquivo estava: a primeira ferramenta do turno liga a máquina nova, a chamada seguinte ao modelo regrava o arquivo em `uploads/` com a mesma nota, o caminho volta ao histórico e o turno seguinte não liga a máquina | `assistant/files-machine.test.ts`, "a máquina nova esquece onde o arquivo estava e o nativo o grava de novo" | must |
| 4 | U1 | A prova de B1: se uma versão nova do Mastra mudar a chave `uploads` ou a forma `{ paths, digests }`, o critério 1 falha em vez de a máquina voltar a ligar sem que ninguém veja | o mesmo teste do critério 1 | must |

## A matriz de estados

Nenhuma tela nova nem texto novo. O campo de contrato é um só:

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `providerMetadata.conexus.placed` da parte de arquivo guardada: `{ hash, size, relativePath, path }` | `assistant/files.ts` `recorded` (depois que o nativo coloca o arquivo) e o `forgetPlaced` (apaga, na máquina nova) | `assistant/files.ts` `seeded` (monta o cache do nativo); `sentFilesOf` e o resto da parte não o leem |

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Uma dependência fora | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `Memory.saveMessages` do `forgetPlaced` (máquina nova) e de `recorded` (histórico regravado) | um turno por conversa (a fila da conversa, C65): nunca duas | o turno parado deixa a parte como estava; o próximo turno regrava | o banco fora: a partida falha como `MACHINE_UNAVAILABLE` (`reason: START`) e o turno seguinte tenta de novo | a linha `MACHINE_UNAVAILABLE` já existente | 3 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O arquivo colocado num turno anterior, no pedido de um turno novo | U1 | `assistant/files.ts` `processLLMRequest` (partida antecipada, `:124-132`); `machine/conversation.ts` `ensure` | `@mastra/core` 1.82.0 `dist/docs/references/reference-processors-file-upload-processor.md:89,132-136`; `mastra-1.82` `packages/core/src/processors/processors/file-upload.ts:144-160,363-386`, `loop/loop.ts:114-116`; `dyad` `src/ipc/handlers/chat_stream_handlers.ts:1347-1395,1484-1499` | o nativo confere o histórico em todo turno e liga a máquina para isso; o cache `state.uploads` dura uma execução; o dyad grava uma vez e lembra o caminho | embrulhado: o nativo coloca e escreve a nota; o nosso guarda o caminho na parte e não chama a máquina para um arquivo já colocado | — | "Confirmado. É o arquivo, eu já vi."; "1. Aprovo" | — |
| A máquina fora com o arquivo só no histórico | U1 | `assistant/files.ts:124-132`; `files-machine.test.ts` (o caso invertido) | doc `:173,181`; `file-upload.ts:155-157,346-354` | a falha da máquina com um arquivo do histórico vira a nota `[File not uploaded]` e o turno segue | nativo: apagar a partida antecipada | teste invertido (critério 2) | "1. Aprovo" (C) | — |
| A semente do cache do nativo (B1) | U1 | nenhuma | `file-upload.ts:373-376,384` (`placeFiles` pula o que está em `cache.paths`; `cacheOf` cria `state.uploads`) | com `paths` e `digests` já preenchidos o nativo escreve a nota e não chama a máquina | remendo: usa a forma interna de `state.uploads`, que o contrato do `state` diz ser "por pedido" | critério 4 (o teste quebra se a forma mudar no `@mastra/core` 1.82.0 ou numa versão nova); a issue ao Mastra de uma opção pública fica com o firstmate | "1. Aprovo" | — |
| A máquina nova esquece o arquivo colocado | U1 | `machine/conversation.ts` `started` (`onStart`, `outcome`) | doc `:135`; `workspaces/e2b/src/sandbox/index.ts` (`outcome: 'created'` é uma máquina nova) | o nativo regrava na chamada seguinte, porque não guarda nada entre turnos | embrulhado: `started` avisa quem guarda o registro (`Deps.recycled`); o Assistente apaga o registro e marca o pedido para o cache recomeçar vazio | critério 3 | "1. Aprovo" | — |

**A medida do transplante.** Nada vem do repositório antigo.

**A dívida.** Um arquivo de antes desta etapa, sem registro, liga a máquina uma vez no turno em que
aparece e deixa o registro dali em diante. Uma ferramenta que abre o arquivo logo depois de uma
reciclagem pode não achá-lo antes da chamada seguinte ao modelo: o texto do Assistente já manda
listar `uploads/` antes de dizer que o arquivo sumiu.

## U1 O arquivo colocado vira nota sem a máquina

**Base e modelo.** `main` `7003326e`. Sonnet.

### As linhas da tabela

As quatro primeiras da tabela acima. O builder abre `file-upload.ts:144-160,346-386` e
`loop/loop.ts:114-116` no 1.82.0 instalado (`node_modules/@mastra/core/dist`, `agent-*.js`,
`processLLMRequest` do `FileUploadProcessor`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `assistant/files.ts` | apaga a partida antecipada; cria `seeded`, `recorded`, `forgetPlaced`, `RECYCLED`; `machineUploads` recebe `memory` | `assistant/assistant.ts` |
| `assistant/assistant.ts` | muda: passa `memory` ao processador e `recycled` às máquinas | — |
| `machine/conversation.ts` | muda: `Deps.recycled`, `Session.requestContext`, `started` chama `recycled` na máquina nova | `assistant.ts` (os outros donos não passam `recycled`) |
| `assistant/files-machine.test.ts` | inverte o caso da máquina fora; cria os casos 1 e 3 | — |

### Os contratos que a unidade cria

```ts
// machine/conversation.ts, em Deps
recycled?(requestContext: RequestContext): Promise<void>
// assistant/files.ts
export const RECYCLED: string
export function forgetPlaced(memory: Memory, requestContext: RequestContext): Promise<void>
export function machineUploads(deps: { log: FailureLog; memory: Memory }): InputProcessor<FileUploadTripwireMetadata>
```

O registro é validado por Zod (`Placed`, `PlacedPart`, `Cache`) onde entra, e nunca por asserção de tipo (C27).

### As skills e a leitura

`docs/reference/stack.md`, linhas de `apps/server/src/builder/`: a skill `mastra`. Ler primeiro o
`processLLMRequest` do `FileUploadProcessor` instalado.

### A ordem do trabalho

1. `files.ts`: apagar a partida antecipada de `processLLMRequest`.
2. `files.ts`: antes do nativo, semear `state.uploads` com os registros das partes do histórico
   (casados pelo hash do conteúdo); depois do nativo, gravar o registro nas partes sem ele.
   Com `RECYCLED` no pedido, o cache recomeça vazio e o registro das partes do histórico é regravado e salvo.
3. `conversation.ts` e `assistant.ts`: `started` chama `Deps.recycled` quando o `outcome` é `created`;
   o Assistente passa `forgetPlaced`.
4. Testes: os critérios 1 a 3.

### Como se prova

Os três testes de `files-machine.test.ts` acima, rodados com o servidor de teste. Hoje o 1 dá
`[1,1,1]` partidas e o 2 falha com `MACHINE_UNAVAILABLE`.

### Parar se

O nativo chamar a máquina com o cache semeado (a forma de `state.uploads` mudou na versão instalada).
