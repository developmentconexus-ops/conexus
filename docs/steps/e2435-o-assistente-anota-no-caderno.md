# Etapa 24.3.5: O Assistente anota no caderno

Cartão curto, logo depois da 24.3.2. Pela regra L5 ele entra em `docs/steps/` quando o cartão da
24.3.2 sair no fechamento dela; até lá vive no seu pull request, e a verificação `second-card` de
`check-docs` fica vermelha nele de propósito. Não houve estudo à parte: a referência é a própria
escrita do Builder no caderno (etapa 20) e a suspensão de ferramenta do Mastra 1.79.0, citadas na
tabela de referência.

## A página do fundador

**No fim desta etapa** você ensina ao Assistente o que um código do sistema quer dizer, e ele
anota no caderno da ligação, como o Builder anota: ele mostra o que vai anotar, espera o seu sim na
conversa e só então grava, depois de provar a consulta uma vez. Um membro que pede o mesmo recebe o
texto pronto para passar a um dono ou administrador.

**O roteiro de uso.**

1. No Início, escolha uma ligação na conversa e diga ao Assistente o que um código quer dizer, por
   exemplo "o tipo de operação 1100 é venda de balcão; anota isso no caderno".
2. Ele responde com o que vai anotar: o conceito, o que o código quer dizer e a consulta que prova,
   e pergunta se pode anotar. Nada foi gravado ainda.
3. Responda "sim". Aparece a linha "Anotou no caderno do sistema".
4. Abra a ligação em Integrações: no caderno está a anotação, "provado em … por você".
5. Repita com outro código e responda "não, deixa": nada é anotado, e o caderno continua igual.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. No fim: faz o roteiro, diz
o que viu e aprova os textos das telas.

**Fica de fora.** Um botão de Aprovar (você escolheu o sim na conversa, "2. A"); apagar ou corrigir
uma anotação pelo Assistente (o caderno da ligação já apaga, para dono e administrador); a escrita
do Builder, que fica como está. Um fato para você saber: no Builder, hoje, todo membro que conversa
grava no caderno, sem perguntar, desde a etapa 20; este cartão não muda isso, e se quiser igualar ao
Assistente é uma issue.

**As decisões suas nesta etapa.** Todas já dadas em 2026-11-03: "1. A" (dono e administrador gravam
pelo Assistente; o membro recebe o texto) e "2. A" (ele mostra o texto e só grava depois do sim na
conversa). Nenhuma nova. O membro só conversa com o Assistente depois da U1 da 24.3.4; por isso a
parte dele é a U3, que espera aquela.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | A escrita pelo Assistente: a ferramenta por pessoa, a suspensão até o sim, a porta que prova e grava com a conferência de `manageConnections`, a escrita do caderno com um dono só | `apps/server/src/builder/assistant/`, `apps/server/src/builder/connectors/`, `apps/server/src/hub/connectors/` | security | — |
| U2 | A tela: a linha da anotação esperando o sim e o texto do caderno vazio | `apps/web/src/builder/conversation/`, `apps/web/src/hub/connectors/` | web | U1 |
| U3 | O membro: sem a ferramenta, recebe o texto para passar adiante; um caso na avaliação | `apps/server/src/builder/assistant/` | testing | U1 e a U1 da 24.3.4 no `main` |

Correm em fila. A U1 e a U2 chegam à sua empresa numa versão; a U3, quando a 24.3.4 abrir a conversa
ao membro.

**Orçamento de código alterado.** U1: 220 linhas. U2: 60. U3: 30. Total da etapa: 310.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Para quem tem `manageConnections` (dono, administrador), numa conversa que escolheu uma ligação, o modelo recebe `connector_note_save`; a chamada não grava: suspende com o conceito, o mapeamento, a consulta e a ligação, e o caderno não muda | `builder/assistant/note-save.test.ts`, "suspende antes de gravar" | must |
| 2 | U1 | A mensagem seguinte da pessoa retoma a chamada (`autoResumeSuspendedTools`); com `confirmed: true` a consulta roda uma vez pela porta de leitura (`by: 'assistant'`), o caderno guarda o mapeamento, a consulta, a data, as linhas e quem escreveu, e o modelo recebe `{ kind: 'SAVED', provedRows }`; `GET /api/companies/{c}/connections/{id}` traz a anotação em `notes`, com o nome da pessoa | `note-save.test.ts`, "o sim grava" | must |
| 3 | U1 | Recusa: com `confirmed: false` nada roda e nada é gravado, e o modelo recebe `{ kind: 'NOT_CONFIRMED' }` | `note-save.test.ts`, "o não não grava" | must |
| 4 | U1 | Recusa do servidor: a porta grava só para quem tem `manageConnections`, lido na mesma transação da escrita; uma pessoa de papel `member` (linha de verdade no banco), uma ligação não escolhida ou que o lugar não oferece recebem `NOT_GRANTED`, o motivo só no registro, e o caderno não muda | `hub/connectors/assistant-port.test.ts`, "a anotação recusada" | must |
| 5 | U1 | A prova é a do Builder: uma consulta que a porta recusa (`QUERY_REFUSED` e as outras falhas da leitura) devolve a falha e não grava; a gravação conta uma das 50 chamadas do turno; acima de 32 KB, `NOTE_INVALID` | `assistant-port.test.ts`, "a prova da anotação" | must |
| 6 | U1 | Recusa: numa rodada aberta por uma automação o modelo não recebe `connector_note_save` (ninguém para dizer sim) | `note-save.test.ts`, "a rodada de automação" | must |
| 7 | U1 | A escrita do Builder continua igual: grava sem suspender, e o seu teste de hoje passa sem mudar | `builder/conversation/conversation-connectors.test.ts`, os casos de hoje | must |
| 8 | U2 | Na sala do Assistente, a anotação esperando o sim mostra o conceito e o mapeamento, sem botão, e a caixa de mensagem continua aberta; gravada, a linha diz "Anotou no caderno do sistema"; o caderno vazio diz "Nada anotado nesta ligação ainda." | `web/src/builder/conversation/assistant-specs.test.ts`, "a anotação"; `web/src/hub/connectors/` o teste da página da ligação | must |
| 9 | U3 | Para um membro, o modelo não recebe `connector_note_save`; uma chamada inventada é `ToolNotFoundError` do Mastra; o texto do Assistente diz que, sem a ferramenta, ele entrega o texto pronto para um dono ou administrador anotar | `note-save.test.ts`, "o membro" | must |
| 10 | U3 | Avaliação com o modelo de verdade (opt-in, `CONEXUS_EVAL_REAL_MODEL`): o dono pede para anotar, o turno termina suspenso com o texto dito; o membro pede, o turno termina com o texto e sem chamada da ferramenta | `assistant.eval.test.ts`, "o caderno" | should |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A linha da anotação na sala do Assistente (U2) | esperando o sim: conceito e mapeamento, "Esperando o seu sim" | — | "Anotando no caderno do sistema" | "Não conseguiu anotar no caderno", e o modelo diz a falha | — | o membro não tem a linha: o texto vem na resposta (U3) | `NOT_CONFIRMED`: a linha some, a resposta diz que não anotou |
| O caderno da ligação (U2) | as anotações, de quem for | "Nada anotado nesta ligação ainda." | o de hoje | o de hoje | o de hoje | o de hoje | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `NoteSaveProposal` (o `suspendPayload`) | a ferramenta (U1) | a linha da tela (U2), o modelo na retomada |
| `NoteSaveAnswer.confirmed` (o `resumeData`) | o Mastra, da mensagem da pessoa (U1) | a ferramenta (U1) |
| `Note.writtenBy` | a porta do Assistente (U1), como a do Builder | o caderno da ligação |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| A suspensão da chamada (`suspend()`, guardada pelo Mastra com a rodada) | duas chamadas no mesmo turno suspendem duas; cada sim ou não retoma a sua (`toolCallId`) | a pessoa nunca responde: a chamada fica suspensa e nada é gravado; Parar a conversa a cancela, como hoje | o banco do Mastra fora: a rodada falha como hoje, nada gravado | nada novo | 1, 3 |
| A consulta que prova (`readThrough`, `by: 'assistant'`) | duas retomadas rodam duas consultas, cada uma conta no turno | a consulta falha: a falha volta ao modelo e nada é gravado | o sistema da empresa fora: a falha da leitura de hoje (`CONNECTION_*`) | a linha da leitura de hoje | 2, 5 |
| Gravar o conceito (`save` em `notes.ts`, um `UPDATE` com o `||` do jsonb) | o mesmo conceito: fica o último; conceitos diferentes ficam os dois (o lock da linha) | o papel mudou ou a ligação saiu entre a prova e a escrita: `NOT_GRANTED`/`GONE`, nada gravado | o banco fora: a falha sobe e o turno a diz | `CONNECTION_NOTE_SAVED` com a ligação, as linhas e `by` | 2, 4 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A escrita no caderno, provada | U1 | `hub/connectors/builder-port.ts:169-243` (`noteSaved`, `saveNote`), `hub/connectors/notes.ts:61-81` (`save`) | a escrita do Builder, no próprio repositório (etapa 20) | a consulta roda uma vez pela porta de leitura e grava o mapeamento, a consulta, a data, as linhas e quem escreveu, nunca uma linha | nativo | — | "1. A" | — (a prova e a escrita passam a `notes.ts`, um dono só, C26) |
| A ferramenta do caderno | U1 | `builder/connectors/connector-tools.ts:238-280` (`noteSaveTool`, `connectorTools`) | `@mastra/core` 1.79.0, `createTool` | `inputSchema`, `suspendSchema`, `resumeSchema`, `execute` | nativo | — | não precisa | — |
| Esperar o sim na conversa | U1 | — | `@mastra/core` 1.79.0, `dist/docs/references/docs-agents-human-in-the-loop.md:233-262,417-521`; `dist/agent-tuAMgHe3.js:26742`; `dist/agent-controller-DO6rGsQm.js:983-1028` | `suspend()` pausa a chamada; com `autoResumeSuspendedTools` a mensagem seguinte da pessoa vira o `resumeData`; os canais do próprio Mastra a usam onde não há botão; o controlador guarda a suspensão | nativo | o passo 1 da U1 prova que o controlador 1.79 retoma pela mensagem | "2. A" | `builder/assistant/note-save.test.ts` |
| A ferramenta só para quem pode | U1 | `builder/assistant/assistant.ts:272-285` (`tools: async ({ requestContext })`), `:57-65` (`AVAILABLE_TOOLS`) | `@mastra/core` 1.79.0, as ferramentas dinâmicas do `Agent` | a lista fechada do modo é o teto e a função decide por pedido; uma ferramenta fora da função é `ToolNotFoundError` | nativo | — | "1. A" | — |
| Quem pode gravar | U1 | `hub/identity/roles.ts:34-42`, `hub/identity/admission.ts:110-114` (`allows`), `hub/connectors/notes.ts:84-91` (`erase` com `manageConnections`) | better-auth, `createAccessControl` | a declaração do papel decide, nunca o nome dele; a mesma ação da rota de apagar do caderno | nativo | — | "1. A" | — |
| A porta do Assistente | U1 | `hub/connectors/assistant-port.ts:62-63` ("read only"), `:120-132` (`readable`) | a porta do Builder, `builder-port.ts:234-243` | escolhida, admitida e oferecida numa transação; uma chamada do turno | nativo | — | não precisa | — |
| Nenhuma escrita numa rodada de automação | U1 | `builder/assistant/assistant.ts:191-216` (`automationRunFor`, `handOffOf`) | a 24.3.2, critério 4 | as marcas da conversa dizem que uma automação a abriu | nativo | — | não precisa | — |
| A linha na sala | U2 | `web/src/builder/conversation/connector-specs.ts:33-41`, `rows.ts:142-185`, `chat.tsx:214` | — | a suspensão já deixa a caixa aberta (`chat.tsx:257`) | nativo | — | não precisa | — |
| O membro sem a ferramenta | U3 | `askAssistant` em `hub/identity/admission.ts` (hoje pede `manageConnections`) | o cartão da 24.3.4, critério 4 | o membro conversa com o Assistente | nativo | — | "1. A" | — |

**Duas formas comparadas para o sim.** A: `suspend()` com retomada automática, que é a forma do
Mastra para "o usuário responde em linguagem natural" e garante na ferramenta que nada grava antes
de uma mensagem da pessoa. B: só o texto e a descrição pedem que ele pergunte antes; o modelo decide,
e nada no código impede gravar sem o sim. O `requireApproval` fica fora porque é botão
(`docs-agents-human-in-the-loop.md:440`: a retomada automática não aprova). Fica a A, se a prova do
passo 1 da U1 passar.

**A medida do transplante.** Nada trazido do repositório antigo.

**A dívida.** Nenhuma.

## U1 A escrita pelo Assistente

**Base e modelo.** O `main` em `a1d87bf9`. Opus: cruza o controlador do Assistente, a suspensão do
Mastra e a porta do Hub.

### As linhas da tabela

A escrita provada, a ferramenta do caderno, esperar o sim, a ferramenta só para quem pode, quem pode
gravar, a porta do Assistente, nenhuma escrita numa rodada de automação.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/connectors/` | Muda `notes.ts` (a prova e a escrita com `by`), `builder-port.ts` (chama a de `notes.ts`), `assistant-port.ts` (`saveNote`) | as duas portas; o Builder; o Assistente |
| `apps/server/src/builder/connectors/` | Muda `connector-tools.ts`: o `include` ganha a forma do Assistente | o Builder, o Assistente |
| `apps/server/src/builder/assistant/` | Muda `assistant.ts` (`AVAILABLE_TOOLS`, a função de ferramentas, `autoResumeSuspendedTools`); cria `note-save.test.ts` | o controlador do Assistente |

### Os contratos que a unidade cria

Em `apps/server/src/hub/connectors/assistant-port.ts`, em `AssistantConnectors`:

```ts
/** One concept in the caderno, proved once by the read door; only for `manageConnections`. */
saveNote(
  scope: SessionScope,
  call: { connectionId: ConnectionId; turn: TurnKey; concept: string; mapping: string; provingQuery: string },
): Promise<NoteSaved>
```

Em `apps/server/src/hub/connectors/notes.ts`, o dono da prova e da escrita (C26), que sai do
`builder-port.ts`:

```ts
export type NoteSaved =
  | Readonly<{ kind: 'SAVED'; provedRows: number }>
  | Exclude<ConnectorAnswer, { kind: 'OK' }>
  | Readonly<{ kind: 'NOTE_INVALID' }>
  | Readonly<{ kind: 'CALLS_SPENT' }>
export function provedAndSaved(deps: Deps, a: { by: 'builder' | 'assistant'; /* ids, viewer, opened, door, concept, mapping, provingQuery */ }): Promise<NoteSaved>
```

Em `apps/server/src/builder/connectors/connector-tools.ts`:

```ts
include:
  | { noteSave: false }
  | { noteSave: true; save: NoteSave }                 // the Builder: saves at once
  | { noteSave: 'confirm'; save: NoteSave }            // the Assistant: suspends until the person's yes
/** What the person reads before saying yes (the suspendPayload). */
const NoteSaveProposal = z.object({ connection: z.string(), concept: z.string(), mapping: z.string(), provingQuery: z.string() })
/** What the next message gives back (the resumeSchema). */
const NoteSaveAnswer = z.object({ confirmed: z.boolean() })
```

O estado da chamada é a união `SAVED | NOT_CONFIRMED | NOT_GRANTED | NOTE_INVALID | CALLS_SPENT |`
as falhas da leitura, separada por `kind` (C21). Os ids são os de hoje (`ConnectionId`, `TurnKey`).
O modelo de arquivo é o `noteSaveTool` de hoje, que cumpre C21, C23 e C26.

### As skills e a leitura

`mastra` (no `node_modules/@mastra/core/dist/docs` 1.79.0: `docs-agents-human-in-the-loop.md`,
`reference-tools-create-tool.md`), `node`, `typescript-magician`, as linhas de `docs/reference/stack.md`
das três pastas.

### A ordem do trabalho

1. A prova, antes de qualquer código de produto: um teste em `note-save.test.ts`, pelo controlador
   do Assistente com o modelo gravado do repositório, em que uma ferramenta chama `suspend()` e a
   mensagem seguinte da pessoa a retoma com `autoResumeSuspendedTools`. Passa: segue. Não passa
   (o controlador 1.79 recusa a mensagem, ou cancela a suspensão): pare (ver Parar se).
2. `notes.ts`: `provedAndSaved` com o corpo do `noteSaved` de hoje, o `by` vindo de quem chama, e a
   conferência `admitted(…, 'manageConnections')` dentro da transação de `save` quando o `by` é
   `assistant`. `builder-port.ts` chama ela e apaga o seu `noteSaved`. Regras: C26, S8, S10.
3. `assistant-port.ts`: `saveNote` passa pelo `readable` (escolhida, admitida, oferecida), gasta uma
   chamada do turno e chama `provedAndSaved` com `by: 'assistant'`; o comentário "read only" sai.
4. `connector-tools.ts`: com `noteSave: 'confirm'`, a ferramenta suspende com `NoteSaveProposal`
   quando não há `resumeData`, devolve `NOT_CONFIRMED` com `confirmed: false`, e grava com `true`;
   a descrição diz quando usar, que o sim é da pessoa e que o texto vai antes, em palavras.
5. `assistant.ts`: `BUILDER_TOOL.connectorNoteSave` entra em `AVAILABLE_TOOLS`; a função de
   ferramentas dá `noteSave: 'confirm'` só quando `identity.allows(role, 'manageConnections')`, com o
   papel lido como o `speakersOf` lê, e nunca numa rodada de automação; `autoResumeSuspendedTools:
   true` nas opções do agente.

### Como se prova

Os critérios 1 a 7, cada um pelo seu teste, contra o banco de teste e o modelo gravado (T26); o
critério 4 com uma linha `member` de verdade em `member`, não com uma resposta trocada em tempo de
execução (issue 641). Os testes do Builder (critério 7) passam sem mudar. Hoje falham 1, 2, 3 e 4.

### Parar se

- A prova do passo 1 falha: o cartão volta ao firstmate com o que o controlador fez; não se inventa
  outra forma de esperar o sim.
- A retomada roda sem a chave do turno (`turnKey`) no contexto: diga onde ela some; não se cria uma
  chave nova.

## U2 A tela

**Base e modelo.** O `main` com a U1. Sonnet.

### As linhas da tabela

A linha na sala.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/conversation/` | Muda `rows.ts` (a suspensão do `connector_note_save` vira a linha com o texto), `connector-specs.ts` | a sala do Assistente e a do Builder |
| `apps/web/src/hub/connectors/` | Muda `text.ts` (`EMPTY_NOTEBOOK`) | a página da ligação |

### A ordem do trabalho

1. A suspensão do `connector_note_save` mostra `NoteSaveProposal` (conceito e mapeamento) e
   "Esperando o seu sim", sem botão; a caixa segue aberta, como `chat.tsx:257` já manda.
2. `EMPTY_NOTEBOOK`: "Nada anotado nesta ligação ainda."

### Como se prova

O critério 8. QA curta da sala, nos dois temas, a 1366 e 390 px.

### Parar se

A sala trava a caixa durante a suspensão: diga onde; não se cria um estado novo.

## U3 O membro

**Base e modelo.** O `main` com a U1 e a U1 da 24.3.4. Sonnet.

### As linhas da tabela

O membro sem a ferramenta.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/assistant/` | Muda `prompt/assistant.md` (uma frase), `note-save.test.ts`, `assistant.eval.test.ts` | o Assistente |

### A ordem do trabalho

1. Uma frase no texto do Assistente: sem a ferramenta de anotar, ele escreve o conceito, o
   mapeamento e a consulta para a pessoa passar a um dono ou administrador.
2. O caso do membro em `note-save.test.ts`, com um membro de verdade que a 24.3.4 deixa conversar.
3. Os dois casos da avaliação; firstmate roda a avaliação com o modelo de verdade.

### Como se prova

Os critérios 9 e 10.

### Parar se

A 24.3.4 não abriu a conversa ao membro: a U3 espera.
