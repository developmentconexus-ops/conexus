# Etapa 24.5.1: Uma lógica

Rascunho. O fundador ainda não aprovou esta página nem a linha da etapa no roteiro (decisão 1). A
etapa vem do pedido dele de 2026-11-08 e da auditoria de coesão de 2026-11-07, refeita por um estudo
que tratou cada item da auditoria como hipótese. Cada linha citada foi lida no `main` em `704aa282`,
com `@mastra/core` 1.82.0, `@mastra/server` 1.82.0, `@mastra/memory` 1.41.0, `@mastra/pg` 1.35.0,
`better-auth` 1.7.8, `drizzle-orm` 1.0.0-rc.4 e `@tanstack/react-query` 5.104.0. O construtor de
cada unidade reabre as linhas no `main` do dia.

As regras de escrita que valem aqui são as da 24.5 como estão no `main`: a `D1-a` (só quem tem
**Publicar agente que escreve sozinho** deixa uma escrita em **Faz sozinho**), a `D2-a` (volta a
perguntar quando quem responde pela versão perde a ação, a escrita ou sai), a `D3-a` (quem aprova
precisa da escrita no próprio papel) e a opção A de 2026-11-07 (restaurar conta como publicar). A
opção (b) de 2026-11-08 (quem restaura responde pela versão ativa, `agent.active_by`) está na
https://github.com/developmentconexus-ops/conexus/pull/846, ainda não no `main`. A U2 começa depois
dela.

## A página do fundador

**No fim desta etapa** nada muda no que você vê, com uma exceção: a data de "Conversa de …". Muda
por dentro. Cada coisa que as quatro conversas (Builder, Assistente, agentes e Construtor) dividem
passa a ter uma casa só. A regra "pergunta antes ou faz sozinho" passa a ter um dono só. A 24.6
começa sem copiar nada disso.

**O que você me pediu, e o que o estudo achou.** Você disse: "ver se não tem coisa nativa, se isso
não é patch ou gambiarra". Conferi cada item da auditoria no código e no Mastra instalado.

- **"Pergunta antes ou faz sozinho."**
  - **A mecânica é do Mastra e continua dele.** Cada ferramenta carrega a sua regra
    (`requireApproval` como função), e o Mastra trata essa regra como a palavra final. Também são
    do Mastra o cartão **Aprovar?**, a espera, o **Aprovar** e o **Recusar**, e o recusar quando
    você manda outra mensagem.
  - **As suas regras são nossas, e precisam ser.** Papel, quem publicou, "Faz sozinho" e quem pode
    aprovar não têm como ficar no Mastra. Procurei, e a única regra de quem aprova que ele tem é a
    dos Canais: "só quem pediu".
  - **A prova que decide.** Num workflow do Mastra (a 24.6), o passo feito de uma ferramenta **não**
    consulta a regra dela e roda direto. Eu medi. A mesma regra vai então ter dois chamadores com
    duas mecânicas: a regra da ferramenta, na conversa, e o "parar e esperar" do passo, no workflow.
  - **Por isso ela ganha um lugar só**, no Hub, ao lado do funil de escrita. Esse lugar só responde
    "pergunta" ou "faz", "pode aprovar" ou "não pode". Se guardasse o cartão ou a espera, seria
    gambiarra, e não guarda.
- **O kit de conversa.**
  - **Ele já existe e é usado** pelas quatro conversas: abrir, dono, tentativa, turnos e apagar.
  - **Ele não é a casa de tudo que é comum.** Uma parte mora dentro do Builder e do Assistente, e
    os agentes e o Construtor pegam de lá.
  - **O que se repete fora dele** é uma cola de três linhas em volta de algo que o Mastra já faz:
    "esta conversa é sua?", listar as conversas, o texto fixo do prompt e a frase do título.
    Cinco cópias viram uma.
- **O que saiu da lista da auditoria.**
  - "Criar conversa" na tela: o nativo já é usado nos sete lugares.
  - A casca da conversa na tela: a 24.6 não cria conversa nova; fica para depois.
  - Unificar as ids derivadas: as das conversas estão gravadas, e trocar o jeito de calcular abriria
    conversas novas onde hoje se reabre a mesma.
  - O "nunca pergunta" das leituras: é um remendo com prova (o defeito #27831 do Mastra perdia 12
    de 200 leituras; com a regra em cada ferramenta, 0 de 200) e fica.

**O roteiro de uso.** Você é a Ana (dona), no Conexus da nuvem.

1. Abra o Assistente e uma conversa sem título que você começou ontem. Em **Conversas**, ela
   aparece como "Conversa de <o dia e a hora em que você a começou>". Mande uma mensagem e volte à
   lista: a data não muda.
2. Faça o mesmo numa conversa com o agente "Pedidos" e numa conversa com o Construtor: a mesma
   regra.
3. Refaça o roteiro da 24.5 com o "Pedidos":
   - em **Pergunta antes**, o cartão aparece, e **Aprovar** lança;
   - **Recusar** não lança;
   - outra mensagem recusa o cartão aberto;
   - em **Faz sozinho**, lança sem cartão.

   Tudo igual a antes.

**O que você faz, e quando.** Antes: nada. No começo: responde às decisões abaixo e aprova esta
página. No fim: faz o roteiro e diz o que viu.

**Fica de fora.**

- **A casca da conversa na tela e "criar conversa" num lugar só.** A 24.6 não cria tela de
  conversa nova.
- **Mudar o jeito de calcular as ids derivadas.** Elas estão gravadas, e mudar abriria conversas
  novas.
- **Migrar as dez criações antigas para o mesmo jeito de conferir a repetição.** As antigas
  funcionam. Só as novas, a começar pela 24.6, usam o jeito comum.
- **Os dois gerentes de máquina, as duas portas de leitura de conector, o lease copiado e a cola
  de admissão.** A 24.6 não os copia. Ficam para uma arrumação depois da 24.6.1.
- **As regras de fronteira** (C8, a raiz do servidor, as portas aninhadas, a lista de ajudantes de
  teste). São método, e uma regra nova entra num PR só dela, antes desta etapa (L20). É a decisão
  2.
- **Apagar e renomear conversas fora do Assistente.** É produto (decisão 6).
- **Os avisos guardados para um cartão** (`next-card`): nenhum toca nestes arquivos.

**As decisões suas nesta etapa.** Nenhuma é de produto, salvo a 4. Todas vêm da auditoria e foram
refeitas pelo estudo.

- **1. Onde entra a arrumação.**
  - `1A`: nesta etapa própria, antes da 24.6.
  - `1B`: como a primeira unidade da 24.6.
  - `1C`: depois da 24.6.

  **Recomendo `1A`.** A 24.6 já passa da L2 (~4.750 linhas no cartão dela), e a U2 daqui tira
  ~150 de lá. O estudo encolheu esta etapa de ~1.050 linhas para ~580. Com a sua palavra, a linha
  "24.5.1 Uma lógica" entra no roteiro.
- **2. As regras de método** (C8 com máquina, a raiz do servidor sob a regra das portas, as portas
  aninhadas, a convenção `test-*.ts` no lugar da lista de 50 nomes, e o revisor perguntando "isso
  já existe noutro sujeito?").

  **Recomendo aceitar as cinco, num PR de método só delas, antes desta etapa construir.** Nativo:
  regras de caminho do dependency-cruiser. A C8 não dá para conferir pelo nome importado, porque o
  dependency-cruiser não vê o nome. As tabelas ganham então uma segunda porta, que só um arquivo de
  tabelas pode importar. A violação que o estudo achou (as notificações leem a tabela dos pedidos)
  vira um conserto de uma linha.
- **3. O vocabulário do Builder no contrato.**
  - `3A`: o contrato é o vocabulário comum, e isso se escreve em C4.
  - `3B`: o Hub não cita tipo do Builder.

  **Recomendo `3A`.** A U2 põe a regra de escrita no Hub, usando `AgentId`, e isso só é coerente
  com `3A`.
- **4. A data de "Conversa de …" quando a conversa não tem título.** Hoje o Builder mostra o dia
  da criação, e o Assistente, os agentes e o Construtor mostram a última mensagem. A mesma
  conversa sem título muda de nome a cada mensagem.
  - `4A`: a criação, um rótulo que não muda.
  - `4B`: a última mudança.

  **Recomendo `4A`.** Exemplo: uma conversa começada em 7/11 às 10h12 se chama "Conversa de 7/11,
  10h12" para sempre, até ganhar um título.
- **5. O dublê de modelo nos testes.** **Recomendo `5A`**, como na auditoria: a regra de teste T24
  passa a aceitar o gerador de stream como dublê, e as gravações provam o gerador. É de método, e
  esta etapa não muda isso.
- **6. Apagar e renomear conversas fora do Assistente.** **Recomendo `6A`**: numa etapa de produto
  futura, pelo kit.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 O kit como casa comum | A base que as quatro conversas dividem movida para `controller-kit/`; `ownThread`, `listOwned`, `fixedSystem`, as frases do título e `controllerContextOf` no kit; as cópias apagadas | `apps/server/src/builder/controller-kit/`, `builder/conversation/`, `builder/assistant/`, `builder/agents/`, `builder/construtor/`, `builder/machine/`, `builder/model-accounts/`, `builder/runs/`, `builder/mastra/`, `apps/server/src/conversations-of.ts`, `.dependency-cruiser.cjs` (só se um import novo cruzar uma regra) | [testing](../guides/testing.md) | esta página aprovada |
| U2 A regra de escrita com um dono | `hub/connectors/approval.ts` (`mustAsk`, `mayApprove`) com os autores de hoje; `speakerOf` em identity no lugar das seis montagens; `tools.ts`, `write-of.ts` e `publish.ts` chamam o dono | `apps/server/src/hub/connectors/`, `apps/server/src/hub/identity/`, `apps/server/src/builder/agents/` | [security](../guides/security.md) | o PR 846 no `main` |
| U3 Um hash de tentativa | `platform/attempt.ts` com `bodyHashOf`; os quatro chamadores importam de lá | `apps/server/src/platform/`, `builder/conversation/`, `builder/agents/`, `builder/tools/`, `builder/automations/` | [data](../guides/data.md) | esta página aprovada |
| U4 Frases e título | `unconfirmedText` ao lado de `writeFailureText`; um `titleOf`; o título do resumo de conversa de agente e do Construtor passa a `null` | `apps/web/src/platform/`, `apps/web/src/builder/`, `apps/web/src/hub/`, `packages/hub-api/src/agents.ts`, `apps/server/src/builder/agents/conversation-routes.ts`, `apps/server/src/builder/construtor/routes.ts` | [web](../guides/web.md) | a decisão 4 |
| U5 Dois ajudantes de teste | `scriptedModel` e `forwarding` no lugar das cópias | `apps/server/src/builder/conversation/test-*.ts`, `builder/construtor/test-construtor.ts`, `apps/server/src/hub/connectors/test-*.ts`, `hub/connectors/limits.test.ts` | [testing](../guides/testing.md) | esta página aprovada |

A U1, a U3, a U4 e a U5 correm em paralelo: não dividem arquivo de código. As exceções são
`builder/agents/agents.ts` e `builder/tools/*`, que a U3 toca e a U1 não toca, e os
`conversation-routes.ts`, que a U1 e a U4 tocam. Por isso a U4 começa com a U1 no `main`. A U2 vem
depois do PR 846. Ela toca `builder/agents/`, que a U1 também toca, então começa com a U1 no
`main`.

**O que cada unidade apaga.**

- **U1:** cinco colas de dono, duas de listar, três `CACHED`, duas frases de título repetidas e
  doze esquemas locais do contexto do controlador.
- **U2:** a montagem `roleOf → { kind: 'PERSON' }` em seis lugares, e `holdsWrite`,
  `publisherLeavesAlone` e `mayLeaveAlone` de `builder/agents/publish.ts`, que se movem.
- **U3:** `bodyHashOf` de `builder/conversation/store.ts` e da porta da conversa.
- **U4:** os três `titleOf` e as constantes `UNCONFIRMED*` repetidas.
- **U5:** `stepping`, `scripted`, `writing` e os cinco proxies.

**Orçamento de código alterado.** U1: ~250 (~120 a menos). U2: ~170. U3: ~40. U4: ~120. U5: ~100,
só de teste. Total da etapa: ~580 de código, mais ~100 de teste. Cabe na L2.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Os testes das quatro conversas passam sem mudar a asserção: abrir, listar, ler, mandar, apagar, admitir. Pedir pela rota nativa do Mastra a conversa de outra pessoa, de outro tipo ou que não existe responde `CONVERSATION_NOT_FOUND` (404), como hoje | `builder/conversation/guard.test.ts`, `builder/assistant/routes.test.ts`, `builder/agents/conversation-routes.test.ts`, `builder/construtor/routes.test.ts` (os de hoje) | must |
| 2 | U1 | `npm run deps` sai 0, e nenhum arquivo de `builder/agents/`, `builder/construtor/` ou `builder/automations/` importa `builder/assistant/public.ts` por causa de `blockOf`, `Speakers` ou `speakersOf`, nem `builder/conversation/public.ts` por causa de `conversationMemory`, `sessionModel`, `toolsOf`, `createAskUserTool` ou `turnOfOwner` | `npm run deps`; `rg` no relatório do build | must |
| 3 | U1 | Listar as conversas do agente e as do Construtor devolve a mesma ordem (a última mudança primeiro) e o mesmo filtro por marca de hoje, por uma função só do kit | `builder/agents/conversation-routes.test.ts`, "a lista"; `builder/construtor/routes.test.ts`, "a lista" | must |
| 4 | U1 | O pedido ao modelo do Assistente, do agente e do Construtor leva o texto fixo com `cacheControl` `ephemeral` de `1h` na mesma posição de hoje | `builder/controller-kit/instructions.test.ts` (novo: as três instruções, pelo pedido que o dublê da Anthropic recebe); `builder/assistant/instructions.test.ts` e `builder/model-accounts/claude/prompt-cache.test.ts` (os de hoje) | must |
| 5 | U1 | Um `requestContext` sem a chave `controller`, ou com uma forma que o esquema do kit recusa, dá a mesma resposta de hoje em cada leitor: a recusa do processador, `undefined` ou a falha que cada um dá hoje | os testes de hoje de `processors`, `turns`, `runs/keys` e `model-accounts/turn` | must |
| 6 | U2 | Os testes da `D2-a` e da `D3-a` da 24.5 e os do cartão da conversa passam sem mudar: `builder/agents/autonomy.test.ts` e o "quem restaura responde" do PR 846. `holdsWrite`, `publisherLeavesAlone` e `mayLeaveAlone` só existem em `hub/connectors/approval.ts` | `builder/agents/autonomy.test.ts`; `rg` no relatório | must |
| 7 | U2 | `mustAsk` com `choice: 'ASK'` dá `{ kind: 'ASK', reason: 'CHOSEN' }`. Com `choice: 'AUTO'` e um autor publicado cujo responsável perdeu `publishUnattendedWrite` ou a escrita no papel, ou saiu, dá `{ kind: 'ASK', reason: 'PUBLISHER_LOST_RIGHT' }`. Com o autor `DRAFT` e `AUTO`, nunca `PUBLISHER_LOST_RIGHT`. Com uma escrita aberta da mesma ligação e operação na mesma conversa, dá `{ kind: 'ASK', reason: 'OPEN_WRITE' }`. Senão, `{ kind: 'DO' }` | `hub/connectors/approval.test.ts` (novo), pelo Hub de teste | must |
| 8 | U2 | Aprovar pela rota nativa `POST …/sessions/:id/tool-approval` sem a escrita no papel responde `NOT_IN_ROLE` com a operação e nada roda; recusar não confere papel. Igual a hoje | `builder/agents/autonomy.test.ts`, os casos da `D3-a` | must |
| 9 | U2 | Ler e escrever com um conector como pessoa dá a mesma resposta de hoje, `NOT_IN_ROLE` incluído, depois de as seis montagens passarem a `speakerOf` | `hub/connectors/role-doors.test.ts`, `assistant-port.test.ts`, `write.test.ts`, `publish.test.ts` (os de hoje) | must |
| 10 | U3 | Repetir a criação de uma conversa, de um agente, de uma ferramenta e de uma Automação com a mesma chave e o mesmo corpo devolve o mesmo objeto. Com outro corpo, `IDEMPOTENCY_CONFLICT`. Igual a hoje | os testes de hoje das quatro criações | must |
| 11 | U4 | Uma conversa sem título se chama "Conversa de <data>" com a **mesma** regra nas listas do Builder, do Assistente, dos agentes e do Construtor, com a data da decisão 4; mandar uma mensagem não muda o rótulo (com `4A`) | `apps/web/src/builder/conversation/text.test.ts` (novo); as listas de cada conversa | must |
| 12 | U4 | O resumo de conversa de agente e o do Construtor devolvem `title: null` quando o Mastra não deu título; o contrato diz `z.string().nullable()` | `builder/agents/conversation-routes.test.ts`, `builder/construtor/routes.test.ts` | must |
| 13 | U4 | Cada texto "Não confirmamos …" que a pessoa lê é o mesmo de hoje, letra por letra, e sai de uma função só | os testes de tela de hoje que leem essas frases | must |
| 14 | U5 | Os testes que usavam `stepping`, `scripted`, `writing` e os cinco proxies passam sem mudar a asserção | os testes de hoje | must |

## A matriz de estados

A etapa não cria tela. A única tela que muda é o rótulo das listas de conversa.

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| As listas de conversa (Builder, Assistente, agente, Construtor) | igual | igual | igual | igual | igual | igual | igual; só o rótulo de uma conversa sem título segue a decisão 4 |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `AgentConversationSummary.title` (`packages/hub-api/src/agents.ts:171`), passa a `string \| null` | `builder/agents/conversation-routes.ts:52`, `builder/construtor/routes.ts:39` (hoje `thread.title ?? ''`; passa a `thread.title ?? null`) | `apps/web/src/builder/conversation/text.ts` (`titleOf`, o único) |

## A tabela de falhas

Nenhuma gravação nova. A U3 move uma função de hash sem mudar o que ela calcula, e a U2 move as
regras sem mudar o que elas leem. Cada falha continua a de hoje, e os critérios 6 a 10 conferem
isso.

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A ferramenta decide se pergunta | U2 (só o chamador muda) | `builder/agents/tools.ts:137-147` | `@mastra/core@1.82.0` `packages/core/src/loop/workflows/agentic-execution/tool-approval-verdict.ts:60-94` (`6e8dfcb8`) | a função da ferramenta é final; se lança erro, pergunta | nativo | — | não precisa | — |
| As leituras e o Computador nunca perguntam | fica de fora | `tools.ts:24`, `agent.ts:221-230`, `controller.ts:270`, `machine/conversation.ts:289` | `packages/core/src/agent-controller/session.ts:4768-4789`, `:6459-6504` (`6e8dfcb8`) | o "nunca pergunta" nativo é `allow`, que suspende e aprova na hora (defeito #27831) | remendo | `@mastra/core` 1.82.0 e `@mastra/pg` 1.35.0, Postgres: 12 de 200 leituras perdidas com `allow` e 0 de 200 com a regra (estudo da 24.5); causa em `agent/agent.ts:8522` | resposta A da 24.5; a entrada de `boundaries.md` é do fechamento da 24.5 | — |
| A regra de negócio "pergunta ou faz" | U2 | `tools.ts:117-147`, `publish.ts:166-188,215-254` | nenhuma referência instalada tem papel nem autor de versão | — | embrulhado: alimenta a função nativa da ferramenta | P1 do estudo: num workflow, `createStep(tool)` não chama `requireApproval` (`status: success`, `requireApprovalCalled: 0`); a 24.6 tem então um segundo chamador | `D1-a`, `D2-a`, `D3-a`; opção A de restaurar; "b" de 2026-11-08 | `hub/connectors/approval.ts` |
| Quem pode aprovar | U2 | `guard.ts:204-256`, `write-of.ts:47-65`, `publish.ts:216-225` | Mastra: só `toolApprovers` nos Canais (`packages/core/src/channels/agent-channels.ts:684-960`) | só "quem pediu" ou "qualquer um" | embrulhado: a resposta é do Mastra (`respondToToolApproval`) | `autonomy.test.ts` | `D3-a` | `hub/connectors/approval.ts` |
| "Pode usar a operação X" | U2 | `hub/identity/may-use.ts:48-115` e as seis montagens (`publish.ts:89-103,222-224`, `publish-check.ts:42-50`, `write.ts:81-98`, `speaking.ts:12-21`, `assistant-port.ts:109-118`) | better-auth 1.7.8 `hasPermission` | o papel guardado da empresa | nativo, com `speakerOf` como dono da montagem | — | não precisa | `hub/identity/may-use.ts` (muda) |
| A base comum das conversas | U1 | `conversation/public.ts:22-33`, `assistant/public.ts` | — | — | embrulhado: a base sobre `Memory` e `AgentController` do Mastra, na casa errada | — | não precisa | `builder/controller-kit/` |
| "Esta conversa é sua?" | U1 | `guard.ts:174-184`, `assistant/routes.ts:72-77`, `construtor/open.ts:150-161`, `agents/conversation-routes.ts:102-104,139-147`, `conversation/history.ts:6-24` | `@mastra/memory@1.41.0` `getThreadById({ threadId, resourceId })` | filtra pelo recurso e devolve `null` | nativo, com a cola num lugar | — | não precisa | `builder/controller-kit/thread.ts` |
| Listar conversas | U1 | `agents/conversation-routes.ts:122-129`, `construtor/routes.ts:72-79` | `Memory.listThreads({ filter: { resourceId, metadata }, perPage, orderBy })` | filtro por `metadata` (JSONB) | nativo | — | não precisa | `builder/controller-kit/thread.ts` |
| Listar conversas do Assistente e do Builder | fica de fora | `assistant/routes.ts:139-185`; o índice do Hub (decisão 0050) | o Mastra não busca por título | — | embrulhado com razão própria | — | não precisa | — |
| O texto fixo e o cache | U1 | `assistant/instructions.ts:21`, `agents/agent.ts:54`, `construtor/construtor.ts:72` | AI SDK `providerOptions.anthropic.cacheControl` | — | nativo | — | não precisa | `builder/controller-kit/instructions.ts` |
| A frase do título | U1 | `assistant/memory.ts:5-8`, `agents/controller.ts:46-49`, `construtor/construtor.ts:62-64`, `conversation/builder.ts:32-35` | `Memory` `generateTitle: { model, instructions }` | — | nativo | — | não precisa | `builder/controller-kit/instructions.ts` |
| Ler o contexto do controlador | U1 | as 12 leituras de `requestContext.get('controller')` | `@mastra/core@1.82.0` `AgentControllerRequestContext` (`dist/agent-controller/types.d.ts:999`); o Mastra lê com *cast* (`packages/core/src/agent-controller/agent-controller.ts:2268`); `MASTRA_RESOURCE_ID_KEY` e `MASTRA_THREAD_ID_KEY` gravados ao lado (`:2651-2655`) | — | nativo, com um leitor só (C27) | — | não precisa | `builder/controller-kit/context.ts` |
| Turno e fim do turno | fica de fora | `assistant/turn.ts:28`, `construtor/construtor.ts:260`, `controller-kit/turns.ts:74` | `AgentController` (`@mastra/core@1.82.0`) | — | embrulhado, com cópias | a 24.6 não abre turno novo | não precisa | — |
| Apagar no Builder | fica de fora | `conversation/public.ts:43-58` | `Memory.deleteThread` (`@mastra/memory@1.41.0`) | — | embrulhado: o Builder tem passos a mais | a ordem pede prova nos testes de remoção | não precisa | — |
| O hash da tentativa | U3 | `builder/conversation/store.ts:30` (`bodyHashOf`), usado por agents, tools e automations pela porta da conversa | drizzle-orm `onConflictDoNothing`; calcom `54343aa` `packages/prisma/extensions/booking-idempotency-key.ts`; trigger.dev `41ad199` `internal-packages/database/prisma/schema.prisma:1397` | o índice único dá o "uma vez"; comparar o corpo é de quem escreve | embrulhado | — | não precisa | `platform/attempt.ts` |
| As ids derivadas | fica de fora | `controller-kit/open.ts:17-24`, `builder/tools/derived.ts:7-12`, `apps/web/src/platform/attempt-key.ts:34-42` | RFC 9562 v8 | — | embrulhado sobre `node:crypto`; as ids estão gravadas | trocar o layout de `attemptIdOf` abre conversa nova numa repetição (`automations/run.ts:112`) | não precisa | — |
| "Não confirmamos …" | U4 | ~25 constantes em `apps/web/src` (lista na U4) | `packages/hub-api/src/failures.ts:306` (`phraseOf`) é dono das falhas que assentam; estas aparecem quando nada assentou | — | embrulhado: ao lado de `writeFailureText`, que lê o `phraseOf` do contrato | — | não precisa | `apps/web/src/platform/hub.ts` (muda) |
| "Conversa de …" | U4 | `apps/web/src/builder/{conversation/text.ts:86, assistant/text.ts:69, agents/text.ts:128}` | `@mastra/memory@1.41.0` `generateTitle` dá o título | o rótulo da falta de título é nosso | embrulhado, com um defeito: três regras | — | decisão 4 | `apps/web/src/builder/conversation/text.ts` (muda) |
| "Criar conversa" na tela | fica de fora | sete fluxos com `useMutation` e `useAttemptKey` | TanStack Query 5.104 `useMutation` | — | nativo já em uso | — | não precisa | — |
| A casca da conversa na tela | fica de fora | `assistant/conversation.tsx`, `agents/agent-chat.tsx`, `agents/construtor-chat.tsx` | o `Chat` do Conexus (`builder/conversation/`) | — | embrulhado, com cópias | a 24.6 não cria tela de conversa | não precisa | — |
| O modelo de roteiro dos testes | U5 | `conversation/test-questions.ts:49`, `construtor/test-construtor.ts:15`, `conversation/test-preview.ts:20` | `ai@6.0.309` `MockLanguageModelV3` fica acima do provedor; o dublê do Conexus fica no fio (T24) | — | embrulhado sobre o `plantAnthropic` | — | não precisa | `builder/conversation/test-conversation.ts` (muda) |
| O proxy do dublê de conector | U5 | `hub/connectors/test-connections.ts:181`, `test-write.ts:52`, `test-rows.ts:34`, `test-sales.ts:27`, `limits.test.ts:102` | `fetch` do Node | — | embrulhado | — | não precisa | `hub/connectors/test-connections.ts` (muda) |
| As regras de fronteira | fica de fora (PR de método, decisão 2) | `.dependency-cruiser.cjs:1,9,10`; a violação `hub/notifications/request-notices.ts:38` | dependency-cruiser 18.4 não vê o nome importado (`types/cruise-result.d.mts:200-290`) | regras de caminho | nativo (configuração do dependency-cruiser) | — | decisão 2 | — |

**A medida do transplante.** Nada vem do produto antigo.

**A dívida.**

- O comentário de `hub/connectors/write-record.ts:197` diz "U2's gate sets `approvedBy`", mas quem
  o põe é `builder/agents/tools.ts:158`. A U2 corrige o comentário, porque toca o arquivo.
- O comentário de `construtor/construtor.ts:66` ("same bytes as the Assistant's first part") é
  falso (auditoria, item 6). A U1 o apaga com o `CACHED`.

## U1 O kit como casa comum

**Base e modelo.** O `main` do dia. Sonnet: são movimentos e colas sobre APIs nativas já usadas;
nenhuma concorrência nova.

### As linhas da tabela

"A base comum das conversas", "Esta conversa é sua?", "Listar conversas", "O texto fixo e o
cache", "A frase do título", "Ler o contexto do controlador".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/controller-kit/` | Cria `thread.ts`, `instructions.ts`, `context.ts`; muda `public.ts` e recebe os arquivos movidos | as quatro conversas, `builder/mastra/`, `builder/machine/`, `builder/model-accounts/`, `builder/runs/` |
| `builder/conversation/public.ts`, `builder/assistant/public.ts` | Muda: deixam de exportar o que se moveu | quem importava passa a importar do kit |
| `builder/{assistant,agents,construtor,conversation}/` | Muda: chamam o kit | — |
| `builder/{machine,model-accounts,runs}/` | Muda: as leituras do contexto do controlador | — |

### Os contratos que a unidade cria

Em `builder/controller-kit/thread.ts`:

```ts
/** A conversa do tipo e do dono, se é dele; senão CONVERSATION_NOT_FOUND (S10). */
export async function ownThread(
  memory: MastraMemory,
  kind: ControllerKind,
  owner: Owner,
  threadId: ConversationId,
): Promise<StorageThreadType>
/** As conversas do dono com as marcas dadas, a última mudança primeiro (perPage false). */
export async function listOwned(
  memory: MastraMemory,
  kind: ControllerKind,
  owner: Owner,
  marks: Readonly<Record<string, string>>,
): Promise<StorageThreadType[]>
```

Em `builder/controller-kit/instructions.ts`:

```ts
/** O texto fixo de um tipo como a primeira mensagem de sistema, com o cache de 1 h da Anthropic. */
export function fixedSystem(text: string): CoreSystemMessage
/** As frases de título, uma por assunto: a pergunta (Assistente, agentes), o app (Builder), o agente (Construtor). */
export const TITLE: Readonly<Record<'ask' | 'app' | 'agent', { title: string; observer: string }>>
```

Em `builder/controller-kit/context.ts`:

```ts
/** O que o controlador do Mastra põe no requestContext, lido uma vez pelo esquema do kit (C27). */
export function controllerContextOf(
  requestContext: RequestContext | undefined,
): Readonly<{ resourceId: string; sessionId: string; threadId: string | null; state: unknown }> | undefined
```

- **Dono de cada fato** (C26): o texto do título e o cache, só em `instructions.ts`; a cola de dono
  e de lista, só em `thread.ts`; a forma do contexto do controlador, só em `context.ts`.
- **O esquema Zod** de `controllerContextOf` lê só os campos que algum leitor usa hoje. Cada leitor
  que precisa de um campo a mais o acrescenta ali, e não num esquema seu.
- **O arquivo tomado como modelo:** `builder/controller-kit/release.ts` (uma função, as
  dependências por parâmetro). Cumpre C21, C23 e C26.

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/server/src/builder/`: a skill `mastra`. Leia
primeiro `node_modules/@mastra/core/dist/docs` sobre Memory (`getThreadById`, `listThreads`,
`generateTitle`) e o tipo `AgentControllerRequestContext` em
`node_modules/@mastra/core/dist/agent-controller/types.d.ts:999`.

### A ordem do trabalho

1. **Mover sem mudar o corpo.** `conversationMemory`, `sessionModel`, `routedModel`, `toolsOf`,
   `createAskUserTool`/`ASK_USER_TOOL`, `skillOf`, `turnOfOwner` (de `builder/conversation/`) e
   `blockOf`, `Speakers`, `speakersOf` (de `builder/assistant/`) passam a `builder/controller-kit/`,
   cada um no seu arquivo de hoje. Cada importador passa a importar de `controller-kit/public.ts`.
   Regras: C3, C26. Um commit só para o movimento, e `npm run deps` sai 0 antes do passo 2.
2. **`ownThread`.** O corpo:

   ```ts
   const thread = await memory.getThreadById({ threadId, resourceId: resourceOf(kind, owner) })
   if (thread === null) throw new Failure('CONVERSATION_NOT_FOUND')
   return thread
   ```

   Ele substitui `assistant/routes.ts:72-77` (`ownThread`), `construtor/open.ts:150-161`
   (`threadOf`), `agents/conversation-routes.ts:102-104,139-147` e `conversation/history.ts:6-24`.
   O `guard.ts:174-184` fica: ele lê o dono **a partir** do thread, sem saber o tipo antes.
3. **`listOwned`** com o corpo de `agents/conversation-routes.ts:122-129`, e a chave da marca como
   parâmetro. O Construtor (`construtor/routes.ts:72-79`) passa a chamá-lo. `summaryOf` continua em
   cada rota, porque o resumo é de cada tipo.
4. **`fixedSystem` e `TITLE`.** Os três `CACHED` e as três montagens `{ role: 'system', content:
   FIXED, providerOptions: CACHED }` (`assistant/instructions.ts:88`, `agents/agent.ts:336`,
   `construtor/construtor.ts:202`) passam a `fixedSystem(FIXED)`. O texto continua lido por cada
   tipo. As frases de `assistant/memory.ts:5-8` e `agents/controller.ts:46-49` passam a `TITLE.ask`;
   as de `conversation/builder.ts:32-35` a `TITLE.app`; as de `construtor/construtor.ts:62-64` a
   `TITLE.agent`. Apague o comentário falso de `construtor.ts:66`.
5. **`controllerContextOf`.** As 12 leituras listadas na tabela de referência passam a chamá-lo:
   `conversation/processors.ts:64`, `construtor/construtor.ts:121`, `conversation/turn-of.ts:26`,
   `machine/conversation.ts:271,339`, `model-accounts/turn.ts:66,74`, `controller-kit/turns.ts:40`,
   `agents/controller.ts:88`, `runs/keys.ts:12`, `model-accounts/processors.ts:61` e
   `assistant/context.ts:52`. Os esquemas locais saem. Um leitor que lê só `state` passa a ler
   `controllerContextOf(...)?.state` e o analisa como hoje, porque o estado é de cada tipo.

### Como se prova

- Critérios 1 a 5: `npm run deps`, `npm run typecheck`, os testes de cada pasta tocada
  (`npx vitest run apps/server/src/builder/{controller-kit,conversation,assistant,agents,construtor}`),
  o lint.
- Nenhuma asserção de teste muda. Se uma precisar mudar, pare.

### Parar se

- Uma das 12 leituras precisa de um campo que o esquema comum recusaria noutra. Pare e mostre os
  dois campos.
- Um movimento do passo 1 cria um ciclo que `npm run deps` recusa. Pare e mostre o ciclo.
- `listOwned` precisa de outra ordem ou de outro filtro para um dos dois tipos.

## U2 A regra de escrita com um dono

**Base e modelo.** O `main` com o PR 846 e a U1. Opus: a unidade cruza módulos (`builder/agents` e
`hub/connectors`) e mexe numa regra de segurança, a de quem escreve sozinho.

### As linhas da tabela

"A ferramenta decide se pergunta" (só o chamador muda), "A regra de negócio 'pergunta ou faz'",
"Quem pode aprovar", "Pode usar a operação X".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `hub/connectors/approval.ts` | Cria | `builder/agents/` (e a U2 da 24.6) |
| `hub/connectors/public.ts` | Muda: exporta `mustAsk`, `mayApprove`, `Ask`, `WriteAuthorOf` | `builder/agents/` |
| `hub/identity/may-use.ts`, `hub/identity/public.ts` | Muda: `speakerOf` | `hub/connectors/`, `builder/agents/` |
| `hub/connectors/{write,publish-check,speaking,assistant-port}.ts` | Muda: chamam `speakerOf` | — |
| `hub/connectors/write-record.ts` | Muda: só o comentário de `:197` | — |
| `builder/agents/{tools,publish,write-of,agent,choose}.ts` | Muda: chamam `approval.ts`; saem `holdsWrite`, `publisherLeavesAlone`, `mayLeaveAlone` e `aloneByPublisher` | o controlador do agente |

### Os contratos que a unidade cria

Em `hub/connectors/approval.ts`. É o contrato do cartão da 24.6 (U2), sem o autor `WORKFLOW` e sem
o `where: RUN`, que a 24.6 acrescenta:

```ts
export type ApprovalDeps = Readonly<{
  database: Database
  identity: Pick<IdentityPorts, 'roleOf' | 'mayUse' | 'mayPublishUnattended'>
  openWrites: (key: OpenWritesKey) => Promise<readonly OpenWrite[]>
}>
/** Quem escreve: o rascunho (a pessoa que conversa) ou uma versão publicada, com quem responde por ela hoje. */
export type WriteAuthorOf =
  | Readonly<{ kind: 'DRAFT' }>
  | Readonly<{ kind: 'PUBLISHED'; answeredBy: PersonId | null }>
export type Ask =
  | Readonly<{ kind: 'DO' }>
  | Readonly<{ kind: 'ASK'; reason: 'CHOSEN' | 'PUBLISHER_LOST_RIGHT' | 'OPEN_WRITE' }>
/** Na ordem: CHOSEN; PUBLISHER_LOST_RIGHT (D2-a); um DRAFT nunca perde; OPEN_WRITE; senão DO. */
export async function mustAsk(deps: ApprovalDeps, a: Readonly<{
  companyId: CompanyId
  choice: 'ASK' | 'AUTO'
  author: WriteAuthorOf
  scope: SessionScope
  threadId: ConversationId
  target: Target
}>): Promise<Ask>
/** D3-a: quem aprova tem a escrita no próprio papel, lido agora. */
export async function mayApprove(
  deps: Pick<ApprovalDeps, 'database' | 'identity'>,
  a: Readonly<{ companyId: CompanyId; personId: PersonId; target: Target }>,
): Promise<boolean>
/** D1-a: quem publica ou restaura pode deixar a escrita em Faz sozinho; senão NOT_IN_ROLE com o rótulo. */
export async function mayLeaveAlone(
  identity: Pick<IdentityPorts, 'roleOf' | 'mayPublishUnattended'>,
  tx: ReadTx,
  a: Readonly<{ companyId: CompanyId; personId: PersonId; write: Target & { slug: string } }>,
): Promise<void>
```

Em `hub/identity/may-use.ts`:

```ts
/** A pessoa como o papel que tem agora na empresa, lido na transação de quem chama; nenhum para quem não é membro. */
export async function speakerOf(
  tx: ReadTx,
  companyId: CompanyId,
  personId: PersonId,
): Promise<Extract<Speaker, { kind: 'PERSON' }> | undefined>
```

- `answeredBy` é o `agent.active_by` do PR 846 para a versão ativa, e `agent_version.published_by`
  para outra versão. Quem lê é `builder/agents/publish.ts` (`publisherOf`, que fica lá). O
  `approval.ts` não lê tabela do Builder (C8).
- A recusa **não** se unifica. `mayLeaveAlone` lança `Failure('NOT_IN_ROLE')` com o rótulo, para a
  tela. `mustAsk` e `mayApprove` devolvem valores. O funil de escrita continua respondendo ao modelo
  só o tipo, com a razão no log (S10).
- **O arquivo tomado como modelo:** `hub/identity/may-use.ts` (funções sobre portas, sem tabela
  alheia). Cumpre C21, C23 e C26.

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `hub/identity/` (better-auth) e `builder/` (mastra).
Leia `node_modules/@mastra/core/dist/docs` sobre "Conditional approval with a function" e, no
cartão da 24.6 (PR 842), a seção da U2, de onde este contrato vem.

### A ordem do trabalho

1. **`speakerOf`** em `may-use.ts`: `roleOf` e, se há papel, `{ kind: 'PERSON', personId, role }`.
   Troque as seis montagens: `publish.ts:89-103`, `publish.ts:222-224`, `publish-check.ts:42-50`,
   `write.ts:81-98`, `speaking.ts:12-21` (`personSpeaker` passa a chamar `speakerOf` dentro da sua
   leitura) e `assistant-port.ts:109-118` (este admite por `admitMember` e usa o papel que a
   admissão deu; só a montagem do objeto passa a ser de `speakerOf`, sem segunda leitura, então
   pode ficar uma função `personOf(personId, role)` exportada ao lado). Regras: C26, S10.
2. **Mover** `roleNow`, `holdsWrite` (vira `mayApprove`), `publisherLeavesAlone` e `mayLeaveAlone`
   de `builder/agents/publish.ts` para `hub/connectors/approval.ts`, sem mudar o corpo. A leitura
   de quem responde pela versão fica em `publish.ts` como `publisherOf(deps, companyId, version):
   Promise<PersonId | null>`, e chega a `mustAsk` como `answeredBy`.
3. **`mustAsk`.** O corpo é o da função `requireApproval` de hoje (`tools.ts:137-147`) mais
   `aloneByPublisher` (`tools.ts:117-121`):

   ```ts
   if (a.choice === 'ASK') return { kind: 'ASK', reason: 'CHOSEN' }
   if (a.author.kind === 'PUBLISHED' && !(await publisherLeavesAlone(deps, a.companyId, a.author.answeredBy, a.target)))
     return { kind: 'ASK', reason: 'PUBLISHER_LOST_RIGHT' }
   const open = await deps.openWrites({ scope: a.scope, threadId: a.threadId, connectionId: a.target.connectionId, operation: a.target.operationId })
   return open.length > 0 ? { kind: 'ASK', reason: 'OPEN_WRITE' } : { kind: 'DO' }
   ```

4. **`writeTool.requireApproval`** (`tools.ts:137-147`) guarda as duas recusas de hoje: a ligação
   que o lugar não oferece mais (`targetOf` dá `undefined`) e o `threadId` que não vem no
   `requestContext` perguntam. Depois chama `(await mustAsk(...)).kind === 'ASK'`. A mecânica
   continua a do Mastra: a função é a regra da ferramenta. `aloneByPublisher` sai.
5. `write-of.ts:62` chama `mayApprove`; `choose.ts:56` e `refuseUnheld` chamam `mayLeaveAlone` de
   `approval.ts`. Corrija o comentário de `write-record.ts:197`.

### Como se prova

- Critérios 6 a 9: `builder/agents/autonomy.test.ts` e os testes de `hub/connectors` sem mudar a
  asserção; `hub/connectors/approval.test.ts` novo, pelo Hub de teste (T5), um caso por razão de
  `Ask`.
- Uma mutação na frente do construtor: troque a ordem de `CHOSEN` e `PUBLISHER_LOST_RIGHT`, e
  depois tire o ramo do `DRAFT`. Em cada mutação um teste cai.

### Parar se

- O PR 846 não está no `main`.
- Um teste da 24.5 precisa mudar a asserção.
- `assistant-port.ts` faria uma segunda leitura do papel com `speakerOf`. Use `personOf`; se nem
  isso couber, pare.

## U3 Um hash de tentativa

**Base e modelo.** O `main` do dia. Sonnet.

### As linhas da tabela

"O hash da tentativa".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `platform/attempt.ts` | Cria | `builder/conversation/store.ts`, `builder/agents/agents.ts`, `builder/tools/{tools,versions,access}.ts`, `builder/automations/automations.ts` (e a 24.6) |
| `builder/conversation/store.ts`, `builder/conversation/public.ts` | Muda: `bodyHashOf` sai | — |

### Os contratos que a unidade cria

```ts
// apps/server/src/platform/attempt.ts
/** O hash pelo qual uma Idempotency-Key repetida é comparada (C37): nunca o corpo. sha256, base64url. */
export function bodyHashOf(body: unknown): string
```

O corpo é o de `builder/conversation/store.ts:30-32`, sem mudança: os hashes gravados continuam
valendo. O `hashOf` hex de `hub/connectors/write-record.ts:72` **fica**: ele está gravado em
`connector_write.input_hash`, e trocar a codificação faria a repetição de uma linha antiga
responder conflito. `attemptIdOf` e `derivedUuid` também ficam. A U3 acrescenta, acima de cada um,
uma linha dizendo por que são dois (as ids de `attemptIdOf` estão gravadas).

### A ordem do trabalho

1. Crie `platform/attempt.ts` com o corpo de hoje. Regras: C37, C7 (o `platform/` não tem sujeito).
2. Troque os importadores (grep `bodyHashOf`) e tire `bodyHashOf` da porta da conversa.

### Como se prova

Critério 10: os testes de hoje das quatro criações; `npm run deps`.

### Parar se

Um importador precisa de outro algoritmo de hash.

## U4 Frases e título

**Base e modelo.** O `main` com a U1, e a decisão 4 respondida. Sonnet.

### As linhas da tabela

"Não confirmamos …", "Conversa de …".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/platform/hub.ts` | Muda: `unconfirmedText` ao lado de `writeFailureText` | as telas abaixo |
| `apps/web/src/builder/{conversation,assistant,agents,automations,model-accounts}/`, `apps/web/src/hub/{identity,projects,connectors,requests,operations}/` | Muda: as constantes passam a `unconfirmedText` | — |
| `apps/web/src/builder/conversation/text.ts` | Muda: o `titleOf` único | `builder/assistant/`, `builder/agents/` |
| `packages/hub-api/src/agents.ts:171` | Muda: `title: z.string().nullable()` | `builder/agents/conversation-routes.ts:52`, `builder/construtor/routes.ts:39`, a web |

### Os contratos que a unidade cria

```ts
// apps/web/src/platform/hub.ts
/** "Não confirmamos <o quê>. <depois>": o texto de uma escrita cujo fim não se sabe (C37, C48). */
export function unconfirmedText(what: string | undefined, next: UnconfirmedNext): string
export type UnconfirmedNext =
  | 'Tente de novo.' | 'Envie de novo.' | 'Toque de novo.' | 'Veja a lista.'
  | 'Veja a lista de papéis.' | 'Confira o painel e tente de novo.'
  | 'Confira a lista e tente de novo.' | 'Veja a lista antes de tentar de novo.'

// apps/web/src/builder/conversation/text.ts
/** O rótulo de uma conversa: o título, ou "Conversa de <data>" pela regra da decisão 4. */
export function titleOf(conversation: Readonly<{ title: string | null; createdAt: string }>): string
```

(Com `4B`, o campo é `updatedAt`.) As constantes de hoje e os seus textos, que não mudam letra por
letra:

- `builder/conversation/text.ts:20,51`;
- `builder/assistant/text.ts:64,93,118`;
- `builder/agents/text.ts:34,35,38`;
- `builder/automations/text.ts:8,9`;
- `builder/model-accounts/text.ts:26` e `key-form.tsx:16`;
- `hub/identity/role-editor.tsx:25` e `member-actions.tsx:16`;
- `hub/projects/delete-project-dialog.tsx:14` e `name-step.tsx:20`;
- `hub/connectors/link-dialog.tsx:32` e `unlink-dialog.tsx:11`;
- `hub/requests/text.ts:6`;
- `hub/operations/register-client-form.tsx:19` e `delete-client-dialog.tsx:14`.

"Não confirmamos a criação da conversa. Tente de novo." fica uma constante só, em
`builder/conversation/text.ts`, e os agentes e o Assistente a importam.

### A ordem do trabalho

1. `unconfirmedText` e o tipo `UnconfirmedNext`. Cada constante passa a ser
   `unconfirmedText('a criação da conversa', 'Tente de novo.')`, e
   `builder/assistant/text.ts:93` passa a `unconfirmedText(undefined, 'Veja a lista.')`. Regras:
   C48, C26.
2. O contrato `AgentConversationSummary.title` passa a `nullable`. Os dois servidores passam a
   `thread.title ?? null`, e o resumo dos agentes passa a levar `createdAt`
   (`packages/hub-api/src/agents.ts:166-173`), porque o `titleOf` único lê o campo da decisão 4.
3. Um `titleOf` em `builder/conversation/text.ts`. Os de `builder/assistant/text.ts:69` e
   `builder/agents/text.ts:128` saem.

### Como se prova

Critérios 11 a 13: `text.test.ts` com uma conversa sem título antes e depois de uma mensagem; os
testes de tela de hoje que leem as frases; os testes de rota dos agentes e do Construtor com
`title: null`.

### Parar se

- Um texto mudaria uma letra.
- A decisão 4 não foi respondida.

## U5 Dois ajudantes de teste

**Base e modelo.** O `main` do dia. Sonnet.

### As linhas da tabela

"O modelo de roteiro dos testes", "O proxy do dublê de conector".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/conversation/test-conversation.ts` | Muda: `scriptedModel` ao lado de `title()` | `test-questions.ts`, `test-preview.ts`, `construtor/test-construtor.ts` e os testes deles |
| `hub/connectors/test-connections.ts` | Muda: `forwarding` | `test-write.ts`, `test-rows.ts`, `test-sales.ts`, `limits.test.ts` |
| `.dependency-cruiser.cjs:10` | Muda só se um ajudante mudar de nome | — |

### Os contratos que a unidade cria

```ts
/** O modelo de roteiro: o pedido sem stream responde o título; cada stream consome o próximo passo, blocos ou uma função da chamada. */
export function scriptedModel(a: { title: string; steps: readonly (Blocks | ((call: AnthropicCall) => Blocks))[] }): Script
/** Um proxy na frente do dublê de conector: intercepta o que `intercept` devolve, e encaminha o resto sem o cabeçalho host e com redirect manual. */
export function forwarding(origin: string, intercept: (request: Request) => Response | undefined | Promise<Response | undefined>): (request: Request) => Promise<Response>
```

### A ordem do trabalho

1. `scriptedModel` com o laço de `stepping` (`test-questions.ts:49`). `stepping`, `scripted` e
   `writing` passam a chamá-lo e depois saem. `versionWriting`, `researching`, `citing` e
   `answering` ficam: respondem pelo texto, não pelo passo.
2. `forwarding` com o bloco de `test-connections.ts:181`. Os outros quatro passam a chamá-lo; o
   `limits.test.ts:102` ganha o `redirect: 'manual'` que lhe falta.

### Como se prova

Critério 14: os testes de cada arquivo tocado, sem mudar a asserção.

### Parar se

Um teste passa a depender da ordem dos passos de outro jeito.
