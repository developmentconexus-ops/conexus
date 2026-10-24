# Etapa 14.2: Correção de tudo

## A página do fundador

**No fim desta etapa** você vê o Builder trabalhar como na Factory do Mastra (ferramentas que abrem,
raciocínio, tarefas fixas, memória), e um turno com tarefa aberta não vira "montou".

**O roteiro.** Padaria Sol, Ana (dona), Gemini 3.8 Flash, **Raciocínio** alto.

1. "Crie um app de encomendas com cliente, data de entrega e valor." "Pensou por 6 s" abre no texto
   do modelo; "Usou a skill **conexus-build**", nas instruções; "Leu `src/router.tsx`", no arquivo;
   uma falha, no motivo.
2. Acima da caixa, "Tarefas · 2 de 5", fixas enquanto o Builder trabalha; abaixo, os anéis da memória. No fim, "Versão 1 guardada, montou", com todas as tarefas feitas.
3. *Em espera (U6, U7):* data, dinheiro e histórico.
4. "Mostre as entregas num calendário"; **Parar** com o plano aberto: nenhuma versão nova. De novo,
   aprovado: em **Código**, numa árvore, o plano novo ao lado do primeiro, intacto.
5. Ana recarrega: tudo abre igual.
6. Em **Configurações › Memória observacional** você escolhe o modelo do Observador; quem não tem conta
   nele segue o da conversa, sem aviso.

**O que você faz.** Aprova esta página; firstmate faz a prova ao vivo da U5 (raciocínio
do Gemini pela sua conta Google); no fim, você faz o roteiro e aprova os textos.

**As suas palavras que a etapa cumpre** (2026-10-22): "14.2 e pra vir correcao de tudo"; "A" (o fio do
Mastra, a tela como a Factory) e "o simbolo de memoria observacional"; "2 a"; "tudo recomendado,
Plano A, sem Pasta"; "Aprovado tudo" (Coding e Memória). Mudam duas regras: V39 passa a mostrar o
raciocínio recolhido; a 0050 deixa argumentos e resultados irem à tela, cortados. Sem máscara: você
a tirou em 2026-10-22 (`9fd478b`). Na bancada: "aprovado esse estudo, tá bom? Pode seguir", "a
harness inicial, ela tem que ser totalmente funcional".

**A emenda de 2026-10-24.** Entram as suas decisões depois da aprovação: sem LSP; sem trava de leitura;
nenhum processador nosso novo; a recusa do Mastra nas duas trilhas; a escolha do modelo do Observador e
do Reflector, no formato da Factory, com critério e teste (U11), e sem conta para a pessoa ele segue a
conversa; `run_event` sai nesta etapa, em migração própria depois que nenhum código o lê (D30), e o piso da volta entra na arquitetura; a permissão da tabela nova,
em migração própria; o plano é a pasta, sem regra de falha.

**Em espera.** U6 e U7 esperam a bancada e voltam numa emenda com a sua palavra; os critérios 21 a 26
ficam como proposta.

**Fica de fora.** "Pasta" e "SDK". Issues `next-card`: entram 236, 268, 271, 272; as outras esperam a
fila de defeitos (L4).

**Decisão pedida.** Nenhuma além desta página.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | V39, 0050 e 0055 emendadas | `docs/` | design | — |
| U2 | Um registro da conversa (a 14.0) e o fio do Mastra, com tarefas e memória | `builder/conversation/{wire,live,history,turn-log,sessions,parts,cards,check-row,shell,kept,catch-up}.ts`, `builder/runs/`, `hub-api/` | segurança | U1 |
| U3 | A transcrição, o painel de tarefas e os anéis | `apps/web/src/builder/conversation/` | web | U2, U4 |
| U4 | O motor: Coding, Recusa, Fim, Memória, Trava, Registro | `builder/conversation/{builder,processors,turn-line}.ts`, `builder/machine/machines.ts` | testes | U1 |
| U5 | Níveis e o raciocínio do Gemini | `builder/model-accounts/`, `apps/web/src/builder/model-accounts/`, `platform/recordings/` | testes | U1 |
| U6 (em espera) | O que o app aprende: Contrato, Datas, Dinheiro, Histórico, Hora, Regras, Falha | `packages/app/{starter,skills,src/skills.test.ts}` | dados | a bancada |
| U7 (em espera) | Arquivos de migração e Fuso | `packages/app-contract/`, `packages/app/src/check/`, `platform/company-postgres.ts` | dados | a bancada |
| U8 | Plano A e "2 a" | `builder/conversation/plan-tools.ts`, `packages/app/skills/conexus-plan-*`, `builder/machine/scripts.ts` | dados | U1 |
| U9 | Árvore na aba Código | `apps/web/src/builder/source/` | web | — |
| U10 | Dublês e percurso | `tests/e2e/`, `platform/test-*` | testes | as em curso |
| U11 | A escolha do Observador e do Reflector | `builder/model-accounts/`, `builder/conversation/`, `hub-api/`, `apps/web/src/builder/observational-memory/`, `migrations/` | dados | U4 |

`builder/`, `platform/`: `apps/server/src/`; `hub-api/`: `packages/hub-api/src/`. A 14.0 é a primeira parte da U2
("C"; "1. Sim … 2.B"). Em paralelo: U2, U4, U5, U8, U9 (arquivos
distintos). U3 depois de U2 e U4; U11 depois de U4; U10 por último; QA antes das
revisões (L9).

**Orçamento de código alterado** (apagado conta; sem testes nem texto de skill). U2 1.600; U3 950;
U4 150; U5 150; U8 80; U9 150; U10 60; U11 150. Total **3.290**, teto 4.000 (L2); U6 350 e U7 450 voltam com a
emenda.

## Os critérios de aceite

Pelas rotas e a tela; `Machines` dublê, modelo gravado (T24). Todos must.

| # | U | Critério, observável de fora, com a recusa | Teste |
| --- | --- | --- | --- |
| 1 | U1 | V39, 0050 e 0055 com a regra trocada e a frase do fundador | `check-docs` |
| 2 | U2 | `readConversation` devolve as partes como o Mastra as guarda (`text`, `reasoning` com texto, `tool-invocation` com nome, `args`, `result`, `state`, `data-*`); o tipo do Mastra cabe no esquema | `conversation-wire.test.ts`, tipo |
| 3 | U2 | O stream manda só `message_*`, `shell_output`, `command_exit`, `tool_suspended`, `task_updated`, `om_status`, `om_*_start/_end/_failed`, `agent_end` na forma do Mastra, e os nossos `turn` e `data-conexus-*` | idem |
| 4 | U2 | Ao vivo e relido, a mesma parte, para cada ferramenta do conjunto fechado e uma desconhecida; a saída de comando cortada igual nos dois | idem |
| 5 | U2 | Texto acima de `WIRE_LIMITS` sai cortado com `…` e o caminho em `cuts`; o resto segue; nenhum corte fora de `wire.ts` | idem |
| 6 | U2 | `Conversation.tasks` é a lista do armazenamento do Mastra; `Conversation.memory`, o `omProgress` da sessão ou `null` | idem |
| 7 | U2 | Saem `ToolDetail`, `KINDS`, `subjectOf`, `detailOf`, `toolOf`, `cardOf`, `fileOf`, `partOf`, `eventOf`, `withHeard`, `exitHeard`, `toldTool` e os testes que os afirmam | remoção (CI) |
| 8 | U3 | Toda linha com argumentos ou resultado abre: leitura no começo, `list_files` e `grep` no resultado, `skill` no nome e nas instruções, desconhecida no nome legível, argumentos e resultado; falha, vermelha, no erro | `tool-row.test.tsx` |
| 9 | U3 | Raciocínio: "Pensando…", depois "Pensou por N s", fechado, abre no texto; grupo de 3 ou mais, sem `skill`, `ask_user`, `submit_plan`; `task_*` sem linha | `transcript.test.tsx` |
| 10 | U3 | Painel "Tarefas · N de M" acima da caixa enquanto o turno roda; some com tudo feito ou com o turno no fim; nenhum "em andamento" girando depois (#271); relido, do `Conversation.tasks` | `task-panel.test.tsx` |
| 11 | U3 | Anéis da memória de `om_status`, o quadro ao abrir, "Guardando a memória…" ou "Reorganizando a memória…" enquanto segura o turno, a marca de falha sem o texto do fornecedor (C48, C51) | `memory-status.test.tsx` |
| 12 | U3 | Cartões de pergunta, plano e tarefas lidos da `tool-invocation` pelo nome; resposta livre em várias linhas (#272); o cartão da versão: montou, não montou, pela metade | `cards.test.tsx` |
| 13 | U3, U9 | 1280 e 390 px, 200 %, dois temas, teclado (V30, V31), CSP limpo; a árvore com papéis ARIA, o `Sheet` a 390 px, o vazio | T23, `source.test.tsx` |
| 14 | U4 | O Builder sai de `createCodingAgent` com `workspace: undefined`: não tem workspace próprio, a máquina E2B segue emprestada por volta; a lista volta ao modelo depois que a chamada sai da janela | `conversation-tasks.test.ts` (novo) |
| 15 | U4 | Fim: turno que acaba com tarefa aberta volta ao modelo com "N tarefas abertas: …", no limite de `CHECK_LIMITS`; no limite, "Versão N guardada, pela metade"; parado, nada disso | `conversation-check.test.ts` |
| 16 | U4 | Sem `requireReadBeforeWrite`: duas escritas seguidas no mesmo arquivo passam; uma escrita fora da pasta do app, recusada pelo Mastra, sai como erro | `conversation-machine.test.ts` |
| 17 | U4 | A linha `CONVERSATION_TURN_ENDED` leva `finishReason`, a ferramenta que falhou, o código, o maior `inputTokens` de um passo, `cachedInputTokens` e as rodadas da conferência; nenhum texto livre (S41) | `turn-line.test.ts` |
| 18 | U4 | **Fora**, por palavra do fundador (2026-10-23 13:02): sem LSP; a prova ao vivo falhou e a issue [#282](https://github.com/developmentconexus-ops/conexus/issues/282) a guarda | — |
| 19 | U5 | Gemini é um modelo só, com **Raciocínio**; a escolha chega ao CLIProxy pelo pedido provado no 20, também para o padrão; Claude segue `summarized` | `thinking.test.ts`, `served-recordings.test.ts` |
| 20 | U5 | **Ao vivo**, firstmate: uma chamada pela conta Google do fundador devolve `reasoning_content` e diz se o nível vai no nome ou em `reasoning_effort`; a gravação entra em `platform/recordings/`; falha: 19 e a parte Gemini do 28 param, a etapa volta a ele | registro da U5 |
| 27 | U8 | Cada plano em `.conexus/plans/<nome>.md`; `submit_plan` fora dessa pasta, recusado; o plano aprovado não é sobrescrito (#268); turno que só mudou planos, parado ou não: sem versão, sem conferência; nenhuma outra regra de escrita | `conversation-plan.test.ts` |
| 30 | U2 | A pergunta é gravada antes do turno e lida uma vez; versão, falha, máquina e reinício voltam como `data-conexus-*`, sem ir ao modelo; a leitura só lê mensagens | `conversation-recorded.test.ts` |
| 31 | U2 | O stream abre com o turno vivo até ali; depois de um reinício, o aviso e a versão | `conversation-stream.test.ts` |
| 32 | U2 | Saem `catch-up.ts`, `kept.ts` e as listas; `run_event` sai em migração própria, depois que nenhum código o lê (D30: sem dados de empresa; fundador: "Porque manter tabela antiga se estamso apenas em estado de desenvolvimento, não quero amnter legacy"); nenhuma imagem anterior roda depois dela, e `architecture.md` "Roll back" ganha esse piso | remoção (CI), `check-migrations` |
| 28 | U10 | Percurso no Chromium nas sequências da exportação do Mastra, só das unidades em curso: cada linha abre; recarregar dá o mesmo | `tests/e2e/builder-native.test.ts` |
| 29 | U10 | QA (T25) com o conjunto fechado e o Gemini; o roteiro pelo fundador (L17) | `conexus-qa`, fundador |
| 33 | U4 | `CyberRefusalHandler` primeiro em `errorProcessors` e em `outputProcessors`; a recusa não gira a conta do turno | `conversation-refusal.test.ts` (novo) |
| 34 | U11 | A rota guarda o Observador e o Reflector da empresa, `null` segue a conversa; `MODEL_UNKNOWN`, `MODEL_NO_ACCOUNT`; quem não gerencia as contas, recusado; a tela mostra e muda | `observational-memory-settings.test.ts`, `settings.test.tsx` |
| 35 | U11 | Observador no Groq: a chamada dele chega ao dublê do Groq, não ao da conversa; o modelo do turno não muda | `conversation-tasks.test.ts` (lê o dublê do Groq) |
| 36 | U11 | Pessoa sem conta no modelo escolhido, ou a leitura falha: o Observador segue a conversa, sem aviso, passando de `blockAfter`; a escolha é lida uma vez por turno | idem |
| 37 | U11 | Conta do Observador falha e o modelo do turno bate no limite: o turno troca de conta como sem o Observador, sem aviso nascido da chamada lateral | idem |
| 38 | U11 | As permissões `SELECT, INSERT, UPDATE (observer, reflector)` vão numa migração só delas, com a palavra do fundador (D11) | `catalog.test.ts` |

**Em espera** (a bancada): os critérios 21 a 26 (U6, U7) estão no cartão de `917b5e4` e voltam com a emenda.

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Linha de ferramenta | fechada, frase e assunto | sem argumentos nem resultado: nada a abrir | rodando, a saída cresce | vermelha, abre no erro | — | — (só o dono) | fora do conjunto: "Não pôde …", abre no motivo |
| Raciocínio | "Pensou por N s" | sem texto: "Pensou" | "Pensando…" | — | — | — | parado: o texto até ali |
| Painel de tarefas | some sem tarefas | idem | "Tarefas · N de M" | — | — | — | turno no fim: some |
| Anéis da memória | `0/30k` | `memory: null`: esperam o primeiro `om_status` | giram | marca de falha | — | — | — |
| Árvore do Código | pastas do app abertas, `components/ui` fechada | "Este app ainda está vazio" | o da 13 | o da 13 | — | — | — |
| Cartão da versão | "montou" | — | — | "não montou" | — | — | "pela metade" |
| Memória observacional | "Segue o modelo da conversa" | idem | o da 13 | o da 13 | — | só quem gerencia as contas muda | modelo desconhecido ou sem conta: a recusa |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Message.parts: MastraPart[]`, `cuts` | U2 | U3 |
| `Message.suspended` (o plano aberto) | U2 | U3 (cartão do plano) |
| `ConversationEvent` (a lista do 3) | U2 | U3 |
| `Conversation.tasks`, `Conversation.memory` | U2 | U3 |
| `VersionCheck` ganha `{state: 'unfinished', open}` | U4 | U3, 14.1 |
| `WIRE_LIMITS` (`hub-api/src/wire-limits.ts`) | U2 | `wire.ts` |
| campos da linha de fim de turno | U4 | quem lê o registro |
| `PLAN_DIR` | U8 | `plan-tools.ts`, `scripts.ts`, skills |
| `ObservationalMemoryModels` | U11 | a tela, `sessions.ts` (a abertura do turno) |

**Os desenhos** (Factory `ToolCard.tsx`, `SessionChatSurface.tsx`; OS `construir.tsx`):

```text
1280 Conversa                                   390 Conversa
🧠 Pensou por 6 s ›                              🧠 Pensou por 6 s ›
📘 Usou a skill conexus-build ›                  📘 Usou a skill conexus-build ›
▸ 3 ferramentas: listou, procurou, leu ›         ▸ 3 ferramentas ›
⚠ Não conseguiu escrever ../x.ts ›               ⚠ Não conseguiu escrever ›
┌ Tarefas · 2 de 5 ───────────────────┐         ┌ Tarefas · 2 de 5 ─┐
│ ✓ Tabela  ▸ Tela de encomendas  ○ … │         │ ▸ Tela de encom… │
└─────────────────────────────────────┘         └──────────────────┘
[mensagem…]                                      [mensagem…]
◔ 14,9/30k ◔ 2,1/40k 🧠 Guardando a memória…    ◔ 14,9/30k ◔ 2,1/40k
Código: árvore | arquivo                         Código: arquivo; [Arquivos] abre o Sheet
```

## A tabela de falhas

| Gravação ou comando | Duas vezes | Recusada no meio | Dependência fora | Imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Fim: volta ao modelo | uma por fim de passo | a retentativa da 14 | o banco do Mastra: a volta termina | `APP_CHECK_FAILED` ou `RUN_UNFINISHED` | 15 |
| Coleta da versão sem `.conexus/plans/` na comparação | a da 13 | a da 13 | a máquina | `VERSION_SAVED` ou nada | 27 |
| `submit_plan` em `.conexus/plans/` | a da 14 | a chamada fica aberta | a máquina | — | 27 |
| `setObservationalMemoryModel` | o último vale | uma transação | `DATABASE_UNAVAILABLE` | — | 34 |
| Pedido de raciocínio (U5), ao vivo | um por firstmate | — | CLIProxy fora: a prova falha e o critério cai como dito | o registro | 20 |
| Memória: observador e `threadTitle` | nativo | a volta segue | o modelo do observador: `om_*_failed`, a marca; sem conta ou sem leitura, segue a conversa | — | 11, 14, 36, 37 |
| O que o modelo escreve: planos | a 13 | a 13 | a máquina | — | 27 |
| Leitura e stream (corte, 502, 503: repetem pelo `Last-Event-ID` da 12) | só leitura | — | o banco | — | 2 a 6 |

## O que nasce novo e o que é trazido

| Mecanismo | Nativo, nosso ou trazido | Arquivo | Refatorado | Decisões que carrega | Como Mastra, vibesdk e Conexus OS fazem, `file:line` |
| --- | --- | --- | --- | --- | --- |
| Fio do Mastra | nativo | `mastra-parts.ts`, `live.ts` | novo | 0050, "Why not Mastra's routes" | `AgentControllerWireEvent` (`agent-controller/wire.d.ts:30-36`); Factory `services/transcript.ts:202-300`; OS `transcript.ts:1-9`; vibesdk: nenhuma faz |
| Cortes | nosso; o nativo, `getDisplayTransform` (`stream-content.d.ts:9`), transforma por ferramenta e não limita tamanho | `wire.ts`, `wire-limits.ts` | de `DETAIL_LIMITS` | limites da 14 (`tool-detail.ts:6-12`) | Factory corta na tela, 800 (`ToolCard.tsx:41,54,64`); OS `OUTPUT_LIMIT` 800 |
| Redutor, linha por nome | nativo na forma | `transcript.ts`, `tool-presentation.ts` | uma porta viva e relida | conjunto fechado (`permissions.ts`) | Factory `transcript.ts:423-437,696-726`, `ToolFactory.tsx:78-117`; playground `tool-presentation.ts:70-119`; OS `tool-sentences.ts:21-71` |
| Raciocínio recolhido | nativo | `thinking-line.tsx` | o tempo é nosso (12.1) | V39 emendada | Factory `MessageBubble.tsx:180-185`; OS `builder-conversation.tsx:159-172` |
| Painel de tarefas | nativo | `task-panel.tsx` | some no fim do turno, do OS | — | Factory `SessionChatSurface.tsx:67-72`, `TaskPanel.tsx:7-9`; OS `construir.tsx:128,362-368` |
| Anéis da memória | nativo | `memory-status.tsx` | marca de falha, do OS | `observationalMemory` | Factory `runtime.ts:194-207`, `OperationalMemoryStatus.tsx:11-90`; OS `memory-status.tsx:35-77` |
| `createCodingAgent`, `CyberRefusalHandler` | nativo | `builder.ts` | `workspace: undefined`; a recusa também em `errorProcessors` | fila e conferência (0049, 0050, 0055) | `coding-agent/index.ts:90-136` (a recusa na trilha de erro, `:113-129`); Mastra Code `sdk/src/index.ts:1216-1223,1338,1357-1360`; OS `controller.ts:3,223,238` |
| Fim | nosso; o nativo `goal` julga por modelo, não a lista (`agent/goal/scorer.ts:14-28`) | `processors.ts` | o portão da 14 | `abort(…, {retry})` | vibesdk `completion-signals.ts:14-28`; OS `controller.ts:159-178` |
| Memória (3 opções) | nativo | `builder.ts` | — | — | Mastra Code `agents/memory.ts:355-417`; OS `memory.ts:50` |
| Modelo do Observador e do Reflector | nativo na forma (lido uma vez por turno); a rota e a tela, nossas | `model-accounts/`, `sessions.ts` | de uma leitura por chamada | `null` segue a conversa | Factory `memory-settings-hydration.ts:49-53`; Mastra Code `agents/memory.ts:95-135`, `observer-runner.ts:190-196`; OS: nenhuma |
| Trava fora | nativo | `machines.ts` | sai `requireReadBeforeWrite` (fundador, 2026-10-23) | prompt `builder.md:19` | Mastra Code e OS sem ela |
| Registro | nativo (o controle já tem `finishReason`) | `turn-line.ts` | escalares | S41 | `finish` do controle (`agent-controller-DRiP9C5v.js:1053`) |
| Níveis | nativo | `providers.ts`, `thinking.ts`, `model-picker.tsx` | variantes do CLIProxy viram níveis | 0049 | `AgentControllerThinkingLevel` e `model_changed {thinkingLevel}` (`types.d.ts:613,626-632`); OS `model-picker.tsx:132` |
| Raciocínio do Gemini | nativo | `thinking.ts` | pelo modelo compatível com OpenAI | 0050 (CLIProxy) | `llm-DtX483Xc.js:8463-8474`; `dist-Btgwa9QY.js:3322-3326,3484` |
| Plano A | nativo na forma | `plan-tools.ts` | `.conexus/plans/` | um plano por mudança | Mastra Code `utils/plans.ts:17,33-35,94` |
| Árvore | nativo | `source/` | — | — | shadcn `sidebar-11`; OS `lens-code.tsx:2,14-38` |

Citações em `.ts` do Mastra: a fonte em `6a465f9d`. Cada "nosso" entra em `boundaries.md`. Nada
copiado. Dívida: nenhuma.

## U1 Regras

**Raio.** `docs/guides/design.md`, `docs/decisions/{0050,0055}-*.md`: muda, regras trocadas. V39:
"not exposed reasoning" vira "reasoning shown collapsed, in the model's words; each tool row opens
on what it received and returned". 0050: "which our parts keep server-side" vira "the Hub sends
Mastra's own messages and events, cut". 0055: `server/migrations/`, `.conexus/plans/`. **Prova.** 1.

## U2 O fio do Mastra

**Raio.** `kept.ts`, `catch-up.ts`: apaga; `run_event` (`builder/runs/`): o código sai e, em migração própria depois dele, a tabela (D30; piso da volta em `architecture.md`, "Roll back"); `sessions.ts`: muda. `hub-api/{conversations,questions,index}.ts`: muda; `mastra-parts.ts`, `wire-limits.ts`: cria;
`tool-detail.ts`: apaga. `builder/conversation/wire.ts`: cria; `parts.ts`, `check-row.ts`: apaga; `cards.ts`,
`shell.ts`: perdem a tradução; `live.ts`, `history.ts`, `turn-log.ts`: muda. Chama: web, OpenAPI,
`sessions.ts`, `routes.ts`.

**Contratos.**
- **Um registro (14.0)**: a pergunta vai por `memory.saveMessages` antes do sinal; versão, falha, máquina e reinício, uma mensagem `data-conexus-*` após o fim; o stream abre com a foto do turno vivo.
- `MastraPart`: união por `type` com os nomes do Mastra (C21): `text`, `reasoning {reasoning, details}`,
  `tool-invocation {toolInvocation: {state, toolCallId, toolName, args, result?}}`, `data-${string}`;
  `args`, `result`, `data` são `unknown`; cada variante ganha só `cuts?: string[]`. O servidor prova em
  tipo que `MastraMessagePart` cabe em `z.input<typeof MastraPart>` (C27).
- `Message = {id, role, parts, suspended, model, createdAt}`; `suspended` vem de
  `metadata.suspendedTools` (hoje `withPlan`, `parts.ts:301-307`).
- `Conversation` ganha `tasks: TaskItemSnapshot[]` (o armazenamento que `task_check` lê,
  `task-tools.ts:612-626`) e `memory: OMProgressState | null` (`session.d.ts:1303`), cada um com esquema
  Zod (C27). Os nomes `data-conexus-*` são da 14.0.
- `ConversationEvent`: `turn`, `turnEnd` e os eventos do critério 3, tipados por
  `AgentControllerWireEvent`; sem os textos livres `observations` e `error` dos `om_*`. As nossas partes
  vão como `data-conexus-*`.
- `cutPart`, `cutEvent` em `wire.ts`, único corte. `WIRE_LIMITS = {text: 2000, outputLines: 20,
  outputBytes: 4096}` (a base da 14, `tool-detail.ts:6-12`).
- Ids: o redutor da U3 lê `ToolCallId` e `MessageId` na entrada (C23).
- Modelo: `turn-log.ts` (C21, C26); `parts.ts` não (o `KINDS` fecha o que o Mastra deixa aberto).

**Leitura.** skill `mastra`; `agent-controller/{types,wire,session}.d.ts`. **Ordem.** Apagar `parts.ts`, `ToolDetail` e os testes de "não abre" (`conversation-parts.test.ts:65,92`,
`tool-row.test.tsx:94`); depois o contrato, `wire.ts`, `live.ts`, `history.ts`, OpenAPI.
Regras: C21, C23, C26, C27, C75, D25, T5, T24. **Prova.** 2 a 7, 30 a 32.

## U3 A transcrição, o painel e os anéis

**Raio.** `apps/web/src/builder/conversation/`: `transcript.ts`, `tool-presentation.ts`,
`task-panel.tsx`, `memory-status.tsx`: cria; `tool-row.tsx`, `tool-group.tsx`, `transcript.tsx`, `machine-line.tsx`, `builder-turn.tsx`, `fold.ts`,
`thinking-line.tsx`, `use-live.ts`, `live.ts`, `question-card.tsx`, `plan-card.tsx`, `composer.tsx`:
muda; `tool-text.ts`, `task-list.tsx`: apaga. Chama: `panel.tsx`, `workbench.tsx`.

**Contratos.** `reduce(transcript, event)` e `fromMessages(messages)`, um redutor, como a Factory;
item por `kind` (C21): `text`, `reasoning`, `tool`, `card`, `conexus`. `presentTool(toolName)`: dono
das frases (C26), uma por ferramenta do conjunto fechado e a volta (nome legível, argumentos,
resultado). `TaskPanel` lê `task_updated` e `Conversation.tasks`. `MemoryStatus`: fase `idle |
buffering | observing | reflecting` pela regra da Factory (`runtime.ts:194-207`), anéis de `om_status`,
marca de falha do OS. Frases em português (L23).

**Leitura.** `stack.md` (`react-markdown`, `remend`), `components.md`. Regras: C21, C23, C26, V19, V29 a V31, V39, V54, W22, W31. **Prova.** 8 a 13.

## U4 O motor

**Raio.** `builder/conversation/{builder,processors,turn-line}.ts`, `builder/machine/machines.ts`: muda.

**Contratos.**
- **Coding**: `createCodingAgent({…os campos de hoje…, workspace: undefined, outputProcessors: [new
  CyberRefusalHandler(), checkGate], errorProcessors: [new CyberRefusalHandler(), …a fila]})`: passar
  `errorProcessors` troca a lista do Mastra, onde a recusa vinha primeiro (`coding-agent/index.ts:113-129`); sem `signals` à mão (com `memory` no agente, o
  `TaskSignalProvider` já vem, `coding-agent/index.ts:101-102`).
- **Memória**: `activateAfterIdle: {default: 'auto', anthropic: '1h'}`, `previousObserverTokens: 1000`,
  `threadTitle: true` com instrução em português, como Mastra Code e OS; o modelo do Observador e do Reflector vem da U11.
- **Fim**: `checkGate` lê as tarefas abertas do mesmo armazenamento; abertas: `abort("N tarefas
  abertas: …", {retry: true})`, contado em `CHECK_LIMITS.checks`; no limite, a versão leva `check:
  {state: 'unfinished', open}`. Pega o passo final vazio do Gemini.
- **Trava**: sai `requireReadBeforeWrite` (`machines.ts:200-201`).
- **Registro**: os campos do 17, escalares; `finishReason` do `finish` do controle.
- Modelo: `processors.ts` da 14 (C21, C26).

**Leitura.** skill `mastra`, referências `create-coding-agent`, `task-signal-provider`. Regras: C50, C57, C75, S41, T14. **Prova.** 14 a 17, 33.

## U5 Níveis e o raciocínio do Gemini

**Raio.** `builder/model-accounts/{providers,thinking,served}.ts`,
`apps/web/src/builder/model-accounts/model-picker.tsx`, `platform/{recordings/,test-cliproxy.ts}`: muda.

**O fato.** O Gemini passa pelo CLIProxy no modelo compatível com OpenAI do Mastra
(`llm-DtX483Xc.js:8463-8474`): manda `reasoning_effort` (`dist-Btgwa9QY.js:3326`), lê
`reasoning_content` (`:3484`). O nome do CLIProxy carrega o nível (`gemini-3.8-flash-high`), fora do
registro: `providerOptionsOf` não manda nada (`thinking.ts:150-152`) e o seletor esconde o
**Raciocínio** (`thinking.ts:125-130`, `model-picker.tsx:62-64`). **Ordem.** O 20 primeiro; depois as
variantes viram um modelo com os níveis que o CLIProxy serve. Regras: T14, T24, S40. **Prova.** 19, 20.

## U6 e U7 (em espera)

O raio, os contratos e as partes trazidas estão no cartão de `917b5e4` e voltam com a emenda da bancada.

## U8 Plano A e "2 a"

**Raio.** `builder/conversation/plan-tools.ts`, `packages/app/skills/conexus-plan-{new,change}/`,
`builder/machine/scripts.ts`: muda.

**Contratos.** `PLAN_DIR = '.conexus/plans'` (C26) no lugar de `PLAN_PATH`; `submit_plan` aceita um
`.md` direto nessa pasta, como Mastra Code (`utils/plans.ts:57`); reescrever o arquivo de um plano
aprovado é recusado ao modelo. Só essas regras: o plano é uma pasta, escrita e lida; a escrita que falha não leva regra (fundador). `treeOf` (`scripts.ts:43-53`) segue escrevendo a árvore inteira; só o
teste de "sem mudança" (`:52`) e a contagem (`:73`) deixam `PLAN_DIR` de fora (pathspec). **Prova.** 27.

## U9 Árvore

**Raio.** `apps/web/src/builder/source/{source,file-tree}.tsx`: muda, cria. **Contrato.** Árvore sobre o
`Collapsible` (shadcn `sidebar-11`); pastas do app primeiro, `components/ui` fechada; os estados de
#236. Regras: V30, V31, W22. **Prova.** 13.

## U10 Dublês e percurso

**Raio.** `tests/e2e/builder-native.test.ts`: cria; `platform/test-{anthropic,cliproxy}.ts`: muda.
As sequências vêm da exportação do Mastra que firstmate guardou (execuções 1, 2, 3, a do fundador),
com conteúdo inventado (S40, T24): a lista que sai da janela, o passo final vazio, `skill`,
`list_files`, `grep`, a escrita recusada. **Prova.** 28, 29.

## U11 A escolha do Observador e do Reflector

**Raio.** `builder/model-accounts/`: ganha `observational-memory-settings.ts` (hoje em `conversation/`),
muda `processors.ts`, `turn.ts`; `conversation/{sessions,builder,tables}.ts`, `hub-api/observational-memory.ts`,
`apps/web/src/builder/observational-memory/`: muda; o `GRANT` sai da migração da tabela para
`…_observational_memory_models_grants` (D5, D11), com a palavra do fundador em `approvals.md`.

**Contratos.** `observational_memory_models(companyId, observer, reflector)`, `null` segue a conversa;
`GET` e `PUT …/observational-memory-models` (`session`). **Forma da Factory:**
`sessions.ts` lê as duas escolhas na transação que abre o turno e as guarda no `Turn`, como a Factory
as põe no contexto do pedido (`memory-settings-hydration.ts:49-53`) e o Mastra Code resolve o modelo do
papel (`agents/memory.ts:95-135`). `accountModel` pede à fila esse modelo; sem conta para a pessoa, ou sem
a leitura, devolve o da conversa, sem aviso; nenhuma leitura de banco por chamada. Saem os `WeakMap`
laterais, o `allowFallback` e o `Turn` lateral: a falha da chamada é do `failurePolicy: 'continue'`.
Regras: C26, C75, D5, D11. **Prova.** 34 a 38.

## Por que a 14 deixou passar

Para o fechamento (L19): a revisão leu um cartão que permitia "não abre"; a QA usou dublês parciais,
só Anthropic (T24); o ao vivo da 13 viu "Usou uma ferramenta" sem virar critério.
