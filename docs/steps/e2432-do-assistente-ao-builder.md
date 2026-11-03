# Etapa 24.3.2: Do Assistente ao Builder

Cartão curto (resposta E1), logo depois da 24.3. Pela regra L5 ele entra em `docs/steps/` quando o
cartão da 24.3 sair no fechamento dela; até lá vive no seu pull request, e a verificação
`second-card` de `check-docs` fica vermelha nele de propósito. O estudo que o funda é "Do Assistente
ao Builder: o método certo para a passagem" (2026-11-03, no `main` em `e28ee71e`); o que ele cita
desce para cá, porque quem constrói não lê o estudo.

## A página do fundador

**No fim desta etapa** você pede um app ao Assistente no Início, do jeito que pediu o de compras, em
fases; no mesmo turno ele pesquisa o que precisa, escreve um briefing e mostra **Criar app**. No
toque você lê o briefing, dá o nome do Projeto e marca as ligações; o Builder abre já planejando a
partir do que o Assistente achou, e faz em cartões as perguntas que ficaram em aberto. Numa conversa
de um Projeto, pedir uma mudança do app mostra **Mandar ao Builder**, que abre uma conversa nova do
Builder desse Projeto com o mesmo briefing.

**O roteiro de uso.**

1. No Início, escolha o Sankhya na conversa e peça: "quero um app para decidir o que comprar por
   giro e volume; primeiro estude como se faz, depois veja o que o Sankhya permite medir, depois
   vamos planejar". No mesmo turno aparece o cartão do app, com o resumo e **Criar app**.
2. Toque **Criar app**: aparece o briefing para ler, o nome do Projeto e as ligações para marcar.
   Crie. Abre a conversa do Builder do Projeto novo, com o pedido marcado como vindo do Assistente.
3. Veja o Builder planejar a partir do briefing, sem pesquisar de novo o que o briefing já traz, e
   perguntar em cartões o que ficou em aberto.
4. Pergunte ao Assistente "quanto vendemos em setembro por vendedor?": ele responde com a tabela, e
   nenhum cartão de app aparece.
5. Abra uma conversa do Assistente dentro do Projeto e peça "quero que o app mostre também a
   cobertura em dias". Aparece **Mandar ao Builder**; o toque abre uma conversa nova do Builder do
   Projeto, com o resumo e o briefing.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. No meio: firstmate abre a
rodada com o modelo de verdade (a sua assinatura, três vezes cada caso). No fim: faz o roteiro, diz
o que viu e aprova os textos das telas.

**Fica de fora.** Um classificador antes de cada mensagem (só se o teste com o modelo de verdade
falhar depois de ajustar texto e descrições, e medido no mesmo conjunto); o supervisor e os
subagentes do Mastra (o Builder não é um subagente do turno: tem Projeto, máquina, Git e plano
aprovado por você); a troca de modo no mesmo controlador; lista de palavras e frases em maiúsculas no
texto; o `propose_automation` numa rodada de automação (a frase da 24.2 já o cobre e o teste dela o
prova; esta etapa não o muda).

**As decisões suas nesta etapa.** Todas já dadas: A1 (o texto do Assistente diz que app vai para o
Builder), B1 (a entrega por um sinal do Mastra marcado como vindo do Assistente, com o resumo e o
briefing, como a automação faz), C1 (as ligações marcadas no toque são liberadas ao Projeto), D2 (no
Projeto, **Mandar ao Builder** com o mesmo sinal e briefing), E1 (este cartão curto), F1 (o D2 abre
uma conversa nova do Builder) e G1 (passa só com todos os casos certos nas três rodadas). Nenhuma
nova.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | O Assistente passa ao Builder: o papel no texto, as descrições, o briefing lido na chamada, o `propose_app_change` no Projeto, nenhuma proposta de app numa rodada de automação, e a avaliação | `apps/server/src/builder/assistant/`, `packages/hub-api/src/assistant.ts`, `apps/web/src/builder/conversation/assistant-specs.ts` | testing | — |
| U2 | A entrega: a rota que cria o Projeto (ou usa o do lugar), libera as ligações marcadas, abre a conversa do Builder e manda o sinal `source="assistant"`; a frase do Builder | `apps/server/src/builder/assistant/`, `apps/server/src/builder/conversation/`, `packages/hub-api/src/assistant.ts` | api | U1 |
| U3 | As telas: o briefing no Criar app, as ligações para marcar, o toque pela rota da U2, e o cartão **Mandar ao Builder** | `apps/web/src/builder/assistant/`, `apps/web/src/builder/conversation/` | web | U2 |

Correm em fila: cada uma lê o contrato da anterior. A etapa chega à sua empresa numa versão só, quando
as três estiverem no `main`.

**Orçamento de código alterado.** U1: 300 linhas. U2: 350. U3: 400. Total da etapa: 1.050.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Numa conversa do Início, o `propose_app` que nomeia um briefing escrito em `/home/user/work` guarda o resumo e o briefing lido na hora (nome e conteúdo), relido inteiro depois do turno; o modelo recebe só `{ proposed: true, next }` | `assistant/propose.test.ts`, "o briefing lido na chamada" | must |
| 2 | U1 | Recusa: um briefing que não existe, fora da pasta, que não é Markdown ou texto, ou acima de 64 KB não propõe nada e o modelo recebe a razão (`NOT_FOUND`, `OUTSIDE`, `NOT_TEXT`, `TOO_LARGE`) | `assistant/propose.test.ts`, "as recusas do briefing" | must |
| 3 | U1 | Numa conversa de Projeto o modelo recebe `propose_app_change` e não `propose_app`; no Início, o contrário | `assistant/assistant.test.ts`, "as ferramentas" | must |
| 4 | U1 | Recusa: numa conversa aberta pela rodada de uma automação, o modelo não recebe `propose_app` nem `propose_app_change` | `assistant/propose.test.ts`, "a rodada de automação" | must |
| 5 | U1 | O texto do Assistente, a skill `conexus` e as duas descrições dizem quando usar e quando não, sem lista de palavras nem frase em maiúsculas | `assistant/instructions.test.ts`, "o papel de cada um" | should |
| 6 | U1 | Os 13 casos do conjunto, cada um em conversa nova, rodados três vezes com o modelo de verdade, todos certos nas três (G1); a metade guardada só roda depois do ajuste; o briefing do caso 1 não traz número que a leitura devolveu | `assistant/assistant.eval.test.ts`, "o modelo de verdade passa ao Builder" (opt-in, `CONEXUS_EVAL_REAL_MODEL`) | must |
| 7 | U2 | O toque cria o Projeto, libera só as ligações marcadas, abre uma conversa do Builder e o Builder recebe um sinal `user` com `source="assistant"`, o resumo e o briefing como arquivo | `assistant/handoff.test.ts`, "a entrega" | must |
| 8 | U2 | O toque repetido com a mesma chave devolve o mesmo Projeto e a mesma conversa, e o sinal sai uma vez | `assistant/handoff.test.ts`, "o toque repetido" | must |
| 9 | U2 | Recusa: quem não tem `manageConnections` cria o Projeto sem liberar nada (`CONNECTIONS_NOT_ALLOWED` na resposta, nenhuma liberação gravada); uma chamada que não é proposta desta conversa é `NOT_FOUND` | `assistant/handoff.test.ts`, "as recusas" | must |
| 10 | U2 | No Projeto (D2, F1), a mesma rota abre uma conversa nova do Builder desse Projeto e não cria Projeto | `assistant/handoff.test.ts`, "a mudança no Projeto" | must |
| 11 | U3 | O cartão do Criar app mostra o briefing; o toque manda pela rota e abre a conversa do Builder; o cartão do Projeto diz **Mandar ao Builder** | `web/src/builder/assistant/propose.test.tsx` | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| O Criar app (U3) | o briefing, o nome, as ligações da conversa marcadas | sem ligação: só o nome | o botão ocupado | a frase da falha e **Tentar de novo**, a chave mantida (W24) | a proposta sumiu: "Esta proposta não existe mais" | as ligações sem marca, "peça ao dono ou a um administrador" | — |
| O Mandar ao Builder (U3) | o resumo, o briefing e o botão | — | o botão ocupado | a frase da falha e **Tentar de novo** | o Projeto saiu: a frase do Projeto que não existe | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `ProposedApp.summary` | o `propose_app` e o `propose_app_change` (U1) | o cartão (U3), a rota (U2) |
| `ProposedApp.briefing` | a ferramenta, lida na chamada (U1) | o cartão (U3), a rota (U2), que o manda ao Builder |
| `ProposeRefused.reason` | a ferramenta (U1) | o modelo, que escreve o arquivo e chama de novo; a linha da ferramenta (U1) |
| o atributo `source="assistant"` | a rota (U2) | o modelo do Builder, pela frase nova (U2) |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| U1: a saída da ferramenta, que o Mastra guarda com a chamada | duas chamadas no mesmo turno guardam duas propostas; o texto diz para não propor de novo | a máquina cai entre o `stat` e a leitura: `MACHINE_UNAVAILABLE` ao modelo | a máquina fora: `MACHINE_UNAVAILABLE` | nada novo | 1, 2 |
| U2: criar o Projeto (`createProject`, chaveado pela tentativa) | a mesma chave acha o mesmo Projeto (C37) | o Projeto criado e a liberação recusada: o toque de novo acha o mesmo Projeto e libera o que falta | o banco fora: 503, nada criado | `PROJECT_CREATED` como hoje | 7, 8 |
| U2: liberar cada ligação (`grant`) | a segunda devolve a mesma liberação | uma ligação que não funciona: `CONNECTION_NOT_WORKING` dela, as outras liberadas | o banco fora: 503 | a linha da liberação como hoje | 7, 9 |
| U2: abrir a conversa do Builder (`openSession` com `attemptIdOf('builder', …)`) | a mesma chave é o mesmo id | aberta e o sinal não saiu: o toque de novo acha a conversa e manda o sinal se ela não tiver mensagem | o banco fora: 503 | `CONVERSATION_CREATED` como hoje | 8 |
| U2: o sinal (`sendSignal`, `requireDelivery`) | uma conversa que já tem mensagem não recebe outro | o Mastra recusa a entrega: 503 e a resposta diz para tentar de novo | o modelo fora: o turno do Builder diz a falha como hoje | `ASSISTANT_HANDED_OFF` com a empresa, a conversa e o Projeto | 7, 8 |

## A tabela de referência

| Peça | Arquivo do `main` | Como as referências fazem, nas versões instaladas | Veredito | Unidade, arquivo novo |
| --- | --- | --- | --- | --- |
| O papel de cada um no texto | `assistant/prompt/assistant.md:1` | Anthropic, boas práticas de prompt: contexto e porquê, "Use this tool when...", sem "If in doubt, use [tool]"; Mastra `docs-subagents.md:462-466`, as instruções do pai dizem quando usar cada recurso | nativo | U1 |
| A descrição de quando usar e quando não | `assistant/propose.ts:12-13` | Anthropic, definir ferramentas: "When it should be used (and when it shouldn't)", "at least 3–4 sentences" | nativo | U1 |
| O plano vira o que a ferramenta pede | — | Mastra Code `submit_plan({ path })`, prateleira `mastra-1.79` em `4c22623e`, `mastracode/sdk/src/agents/modes/plan.ts:31-35` | nativo | U1, `assistant/propose.ts` |
| O briefing lido na chamada, o modelo recebe só o recorte | `assistant/show-file.ts:52-99` | `createTool({ toModelOutput })` de `@mastra/core` 1.79.0 | nativo | U1 |
| Uma ferramenta por lugar | `assistant/assistant.ts:243-245` | Anthropic, engenharia de contexto: "a minimal viable set of tools" | nativo | U1 |
| Nenhuma proposta de app numa rodada de automação | `automations/run.ts:111-114`, `assistant/open.ts:77` (as marcas) | as ferramentas dinâmicas do `Agent` (`tools: ({ requestContext })`) | nativo | U1 |
| A prova | `assistant/assistant.eval.test.ts:90-105,165-235` | `@mastra/evals` 1.10.8, `checks.calledTool`, `checks.didNotCall`, `checks.noToolErrors` (`reference-evals-checks.md:115-130`); Anthropic, "held-out test sets" | nativo | U1 |
| A entrega por sinal | `automations/run.ts:128-141`; hoje a tela manda (`web/.../start.tsx:308-318`, `handoff.ts:84-92`) | `Session.sendSignal` com `attributes` e `author` (`agent-controller/session.d.ts:1699-1716`); `docs-harness-signals.md:11,19,82-88` | nativo | U2, `assistant/handoff.ts` |
| O briefing como arquivo no sinal | — | `createMessageInput` do `Session.sendMessage` (`dist/agent-controller-DO6rGsQm.js:5232-5258,5585-5596`), um texto por arquivo com `[File: nome]` | nativo | U2 |
| Liberar as ligações marcadas | `hub/connectors/grants.ts:168-183` | — (a peça do Hub) | nativo | U2 |
| Abrir a conversa do Builder | `builder/conversation/routes.ts:82-108` | `openSession` do kit dos controladores | nativo | U2 |
| A frase do Builder | `builder/conversation/prompt/builder.md:8,17` | Mastra `docs-harness-signals.md:82-88` (os atributos chegam como XML) | nativo | U2 |
| O cartão e o toque | `web/src/builder/conversation/tool-row.tsx:268-319`, `web/src/builder/assistant/propose.tsx` | Lovable, o cartão "Start building" só quando se pede a mudança | nativo | U3 |

**A medida do transplante.** Nada trazido do repositório antigo.

**A dívida.** Nenhuma.

## U1 O Assistente passa ao Builder

**Base e modelo.** O `main` em `35a7e598`. Opus: cruza o controlador do Assistente, o contrato do
`hub-api` e o método de ferramenta e texto do modelo.

### As linhas da tabela

O papel no texto, a descrição, o plano como caminho, o briefing lido na chamada, uma ferramenta por
lugar, nenhuma proposta numa rodada de automação, e a prova.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/assistant/` | Muda `assistant.ts`, `propose.ts`, `prompt/assistant.md`, `skills/conexus/SKILL.md`, `assistant.eval.test.ts`, `assistant.test.ts`, `instructions.test.ts`; cria `propose.test.ts` | o controlador do Assistente |
| `packages/hub-api/src/assistant.ts` | Muda `ASSISTANT_TOOL`, `ProposedApp`; cria `ProposeAppInput`, `Briefing`, `ProposeRefused` | o servidor, a tela (`tool-row.tsx`, `assistant-specs.ts`) |
| `apps/web/src/builder/conversation/assistant-specs.ts` | Muda: a linha do `propose_app_change` e a recusa das duas | a sala do Assistente |

### Os contratos que a unidade cria

Em `packages/hub-api/src/assistant.ts`:

```ts
export const ASSISTANT_TOOL = { /* ... */ proposeAppChange: 'propose_app_change' } as const
/** What the model gives `propose_app` and `propose_app_change`. */
export const ProposeAppInput: z.ZodObject<{ summary: z.ZodString; briefing: z.ZodString }>
/** The briefing as the tool read it when it ran. */
export const Briefing: z.ZodObject<{ name: z.ZodString; content: z.ZodString }> // content ≤ SHOWN_TEXT_MAX
/** A proposal: `briefing` is absent only in one stored before step 24.3.2. */
export const ProposedApp: z.ZodObject<{ summary: z.ZodString; briefing: z.ZodOptional<typeof Briefing> }>
export const ProposeRefused: z.ZodObject<{
  kind: z.ZodLiteral<'PROPOSE_REFUSED'>
  reason: z.ZodEnum<['OUTSIDE', 'NOT_FOUND', 'NOT_TEXT', 'TOO_LARGE', 'MACHINE_UNAVAILABLE']>
}>
```

- **O estado** da saída: `ProposedApp | ProposeRefused`, separados pela presença de `kind` (C21): a
  proposta guardada antes desta etapa não tem `kind`, e a saída guardada é contrato do Mastra, então
  não se reescreve.
- **O dono de cada fato**: as frases do papel, só em `prompt/assistant.md`, e o "quando usar", só na
  descrição de cada ferramenta (C26); a skill diz o que a pessoa vê, não repete a descrição.
- **O esquema Zod** da entrada é o `ProposeAppInput` (C27), com `.describe()` em cada campo.
- **O arquivo modelo**: `show-file.ts` (cumpre C21 pela união de saída e C26 pelo `TEXT_MEDIA`; não
  tem id para C23).

Em `apps/server/src/builder/assistant/propose.ts`:

```ts
export function proposeTools(machines: Pick<AssistantMachines, 'folder' | 'serving'>): {
  app: Tool    // propose_app, no Início
  change: Tool // propose_app_change, numa conversa de Projeto
}
```

### As skills e a leitura

`mastra` (os `dist/docs` de `@mastra/core` 1.79.0: `createTool`, `toModelOutput`; `@mastra/evals`
1.10.8: `checks`), `typescript-best-practices`.

### A ordem do trabalho

1. Apaga a frase do `propose_app` de `prompt/assistant.md` e põe o parágrafo do papel (o rascunho do
   estudo, parte 2, ajustado ao nome da pasta que a máquina dá). Regras: C26.
2. Reescreve a seção "Handing a need to the Builder" da skill `conexus`: o que a pessoa vê em cada
   lugar e o que vai no briefing (o formato dos dados e as consultas, nunca os valores).
3. `propose.ts`: as duas ferramentas de uma fábrica só, cada uma com a sua descrição (quando usar,
   quando não, o que acontece depois); o `execute` acha o arquivo com `locate` e lê com `readFile`
   como `show-file.ts`; o `toModelOutput` devolve só `{ proposed: true, next }` ou a recusa.
4. `assistant.ts`: `propose_app` no Início, `propose_app_change` no Projeto, nenhuma das duas quando
   as marcas da conversa nomeiam uma automação (`automationOf`, lidas uma vez por rodada pela
   memória, como `oncePerRun`).
5. `assistant-specs.ts`: a linha do `propose_app_change` e a `refusal` das duas, para a recusa não
   ler "Propôs um app".
6. Os testes com o dublê (critérios 1 a 5) e o conjunto de 13 casos com o modelo de verdade
   (critério 6): metade à vista para o ajuste, metade guardada, cada caso três vezes; o veredito pelas
   verificações do Mastra e pela contagem das partes `tool-invocation`.

### Como se prova

Os critérios 1 a 5 com o dublê do modelo (T24, T28) e a máquina local dos testes. O critério 6 só
com o modelo de verdade (T14): o dublê prova o encanamento, não a decisão. A rodada de verdade fica
para firstmate abrir.

### Parar se

- O modelo de verdade falhar um caso depois de ajustar só texto e descrições duas vezes: parar e
  relatar com as conversas; o classificador é decisão nova.
- A saída guardada de uma proposta antiga não ler mais na tela.

## U2 A entrega

**Base e modelo.** O `main` depois da U1. Opus: cruza o Assistente, o Builder, os Projetos e as
liberações numa rota só, e o sinal do Mastra.

### As linhas da tabela

A entrega por sinal, o briefing como arquivo, liberar as ligações, abrir a conversa do Builder, a
frase do Builder.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/assistant/` | Cria `handoff.ts`, `handoff.test.ts`; muda `routes.ts`, `assistant.ts` | a rota nova |
| `apps/server/src/builder/conversation/` | Muda `prompt/builder.md`; expõe o `created` da conversa em `public.ts` | a U2 |
| `packages/hub-api/src/assistant.ts` | Cria `handAssistantProposal` | a tela (U3) |

### Os contratos que a unidade cria

```ts
/** POST /api/companies/:companyId/assistant/conversations/:conversationId/handoffs, com a chave de tentativa (C37). */
export const handAssistantProposal = defineOperation({
  body: z.object({
    toolCallId: z.string().min(1).max(200),
    /** O nome do Projeto novo no Início; ausente numa conversa de Projeto, que usa o dela (F1). */
    projectName: ProjectName.optional(),
    connections: z.array(ConnectionId).max(CONNECTIONS_MAX),
  }),
  // 201: { projectId, conversationId, released: ConnectionId[], refused: { connectionId, code }[] }
  // falhas: NOT_FOUND (a chamada não é proposta desta conversa), CONVERSATION_NOT_FOUND, 503
})
```

O sinal, na forma de `automations/run.ts:128-141`:
`session.sendSignal({ type: 'user', tagName: 'user', contents, attributes: { source: 'assistant', assistantConversation }, author: { id: personId } }, { requireDelivery: true })`,
com `contents` como `createMessageInput` faz um arquivo de texto (o resumo, depois `[File: <nome>]`
e o briefing cercado). Antes de escolher entre texto único e lista de partes, grava-se a forma com
`npm run record` (T26).

### A ordem do trabalho

1. A rota lê a saída guardada da chamada pelo `toolCallId` na conversa do dono (S10): só uma
   `ProposedApp` do `propose_app` (Início) ou do `propose_app_change` (Projeto).
2. Cria o Projeto pela porta dos Projetos com a chave da tentativa, ou usa o do lugar.
3. Libera cada ligação marcada que a conversa escolheu, com `grant`, quando a pessoa tem
   `manageConnections`; sem ela, nada.
4. Abre a conversa do Builder com `attemptIdOf('builder', owner, attemptKey)` e manda o sinal quando
   ela ainda não tem mensagem.
5. A frase do Builder, depois de `builder.md:8`.

### Parar se

- A gravação mostrar que o Mastra não leva os atributos com uma lista de partes: o texto único.

## U3 As telas

**Base e modelo.** O `main` depois da U2. Sonnet: uma tela sobre um contrato pronto.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/assistant/` | Muda `propose.tsx`, `propose.test.tsx`, `queries.ts` | a conversa do Assistente |
| `apps/web/src/builder/conversation/` | Muda `tool-row.tsx` (o cartão com o briefing e os dois botões), `start.tsx` (apaga o envio do resumo pela tela no Criar app) | a sala do Assistente |

### A ordem do trabalho

1. Apaga o envio do resumo pela tela (`start.tsx:308-318` no Criar app; o `handoff.ts` fica para o
   pedido do Início, que é da pessoa).
2. O Criar app mostra o briefing, o nome e as ligações da conversa para marcar, e chama a rota da
   U2; abre a conversa que ela devolve.
3. O cartão do `propose_app_change` com **Mandar ao Builder**, pela mesma rota.
4. As capturas a 1366 e 390 px, nos dois temas.
