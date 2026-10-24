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

**O que você faz.** Aprova esta página; firstmate faz as provas ao vivo da U4 e da U5 (LSP, raciocínio
do Gemini pela sua conta Google); no fim, você faz o roteiro e aprova os textos.

**As suas palavras que a etapa cumpre** (2026-10-22): "14.2 e pra vir correcao de tudo"; "A" (o fio do
Mastra, a tela como a Factory) e "o simbolo de memoria observacional"; "2 a"; "tudo recomendado,
Plano A, sem Pasta"; "Aprovado tudo" (Coding e Memória). Mudam duas regras: V39 passa a mostrar o
raciocínio recolhido; a 0050 deixa argumentos e resultados irem à tela, cortados. Sem máscara: você
a tirou em 2026-10-22 (`9fd478b`). Na bancada: "aprovado esse estudo, tá bom? Pode seguir", "a
harness inicial, ela tem que ser totalmente funcional".

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
| U4 | O motor: Coding, Fim, Memória, Trava, Registro, LSP | `builder/conversation/{builder,processors,turn-line}.ts`, `builder/machine/machines.ts` | testes | U1 |
| U5 | Níveis e o raciocínio do Gemini | `builder/model-accounts/`, `apps/web/src/builder/model-accounts/`, `platform/recordings/` | testes | U1 |
| U6 (em espera) | O que o app aprende: Contrato, Datas, Dinheiro, Histórico, Hora, Regras, Falha | `packages/app/{starter,skills,src/skills.test.ts}` | dados | a bancada |
| U7 (em espera) | Arquivos de migração e Fuso | `packages/app-contract/`, `packages/app/src/check/`, `platform/company-postgres.ts` | dados | a bancada |
| U8 | Plano A e "2 a" | `builder/conversation/plan-tools.ts`, `packages/app/skills/conexus-plan-*`, `builder/machine/scripts.ts` | dados | U1 |
| U9 | Árvore na aba Código | `apps/web/src/builder/source/` | web | — |
| U10 | Dublês e percurso | `tests/e2e/`, `platform/test-*` | testes | as em curso |

`builder/`, `platform/`: `apps/server/src/`; `hub-api/`: `packages/hub-api/src/`. A 14.0 é a primeira parte da U2
("C"; "1. Sim … 2.B"). Em paralelo: U2, U4, U5, U8, U9 (arquivos
distintos). U3 depois de U2 e U4; U10 por último; QA antes das
revisões (L9). Pacote novo, só se a prova da U4 passar: `typescript-language-server` (L16).

**Orçamento de código alterado** (apagado conta; sem testes nem texto de skill). U2 1.600; U3 950;
U4 150; U5 150; U8 80; U9 150; U10 60. Total **3.140**, teto 4.000 (L2); U6 350 e U7 450 voltam com a
emenda.

## Os critérios de aceite

Pelas rotas e a tela; `Machines` dublê, modelo gravado (T24). Todos must.

| # | U | Critério, observável de fora, com a recusa | Teste |
| --- | --- | --- | --- |
| 1 | U1 | V39, 0050 e 0055 com a regra trocada e a frase do fundador | `check-docs` |
| 2 | U2 | `readConversation` devolve as partes como o Mastra as guarda (`text`, `reasoning` com texto, `tool-invocation` com nome, `args`, `result`, `state`, `data-*`); o tipo do Mastra cabe no esquema | `conversation-wire.test.ts`, tipo |
| 3 | U2 | O stream manda só `message_*`, `shell_output`, `command_exit`, `tool_suspended`, `task_updated`, `om_status`, `om_*_start/_end/_failed`, `agent_end` na forma do Mastra, `om_progress` (`displayState.omProgress`, após cada `om_*`), e os nossos `turn` e `data-conexus-*` | idem |
| 4 | U2 | Ao vivo e relido, a mesma parte, para cada ferramenta do conjunto fechado e uma desconhecida; a saída de comando cortada igual nos dois | idem |
| 5 | U2 | Texto acima de `WIRE_LIMITS` sai cortado com `…` e o caminho em `cuts`; o resto segue; nenhum corte fora de `wire.ts` | idem |
| 6 | U2 | `Conversation.tasks` é a lista do armazenamento do Mastra; `Conversation.memory`, o `omProgress` da sessão ou `null` | idem |
| 7 | U2 | Saem `ToolDetail`, `KINDS`, `subjectOf`, `detailOf`, `toolOf`, `cardOf`, `fileOf`, `partOf`, `eventOf`, `withHeard`, `exitHeard`, `toldTool` e os testes que os afirmam | remoção (CI) |
| 8 | U3 | Toda linha com argumentos ou resultado abre: leitura no começo, `list_files` e `grep` no resultado, `skill` no nome e nas instruções, desconhecida no nome legível, argumentos e resultado; falha, vermelha, no erro | `tool-row.test.tsx` |
| 9 | U3 | Raciocínio: "Pensando…", depois "Pensou por N s", fechado, abre no texto; grupo de 3 ou mais, sem `skill`, `ask_user`, `submit_plan`; `task_*` sem linha | `transcript.test.tsx` |
| 10 | U3 | Painel "Tarefas · N de M" acima da caixa enquanto o turno roda; some com tudo feito ou com o turno no fim; nenhum "em andamento" girando depois (#271); relido, do `Conversation.tasks` | `task-panel.test.tsx` |
| 11 | U3 | Anéis da memória do `om_progress` (fundador, 2026-10-23: "A"), o quadro ao abrir, "Guardando a memória…" ou "Reorganizando a memória…" enquanto segura o turno, a marca de falha sem o texto do fornecedor (C48, C51) | `memory-status.test.tsx` |
| 12 | U3 | Cartões de pergunta, plano e tarefas lidos da `tool-invocation` pelo nome; resposta livre em várias linhas (#272); o cartão da versão: montou, não montou, pela metade | `cards.test.tsx` |
| 13 | U3, U9 | 1280 e 390 px, 200 %, dois temas, teclado (V30, V31), CSP limpo; a árvore com papéis ARIA, o `Sheet` a 390 px, o vazio | T23, `source.test.tsx` |
| 14 | U4 | O Builder sai de `createCodingAgent` com `workspace: undefined`: não tem workspace próprio, a máquina E2B segue emprestada por volta; a lista volta ao modelo depois que a chamada sai da janela | `conversation-tasks.test.ts` (novo) |
| 15 | U4 | Fim: turno que acaba com tarefa aberta volta ao modelo com "N tarefas abertas: …", no limite de `CHECK_LIMITS`; no limite, "Versão N guardada, pela metade"; parado, nada disso | `conversation-check.test.ts` |
| 16 | U4 | Sem `requireReadBeforeWrite`: duas escritas seguidas no mesmo arquivo passam; uma escrita fora da pasta do app, recusada pelo Mastra, sai como erro | `conversation-machine.test.ts` |
| 17 | U4 | A linha `CONVERSATION_TURN_ENDED` leva `finishReason`, a ferramenta que falhou, o código, o maior `inputTokens` de um passo, `cachedInputTokens` e as rodadas da conferência; nenhum texto livre (S41) | `turn-line.test.ts` |
| 18 | U4 | **Ao vivo**, firstmate: o LSP no template E2B dá diagnóstico de tipos numa escrita; passa: `Workspace({lsp})` e o resultado da escrita leva o diagnóstico; falha: sai numa issue | registro da U4 |
| 19 | U5 | Gemini é um modelo só, com **Raciocínio**; a escolha chega ao CLIProxy pelo pedido provado no 20, também para o padrão; Claude segue `summarized` | `thinking.test.ts`, `served-recordings.test.ts` |
| 20 | U5 | **Ao vivo**, firstmate: uma chamada pela conta Google do fundador devolve `reasoning_content` e diz se o nível vai no nome ou em `reasoning_effort`; a gravação entra em `platform/recordings/`; falha: 19 e a parte Gemini do 28 param, a etapa volta a ele | registro da U5 |
| 27 | U8 | Cada plano em `.conexus/plans/<nome>.md`; `submit_plan` fora dessa pasta, recusado; o plano aprovado não é sobrescrito (#268); turno que só mudou planos, parado ou não: sem versão, sem conferência | `conversation-questions.test.ts`, `machine.test.ts` |
| 30 | U2 | A pergunta é gravada antes do turno e lida uma vez; versão, falha, máquina e reinício voltam como `data-conexus-*`, sem ir ao modelo; a leitura só lê mensagens | `conversation-recorded.test.ts` |
| 31 | U2 | O stream abre com o turno vivo até ali; depois de um reinício, o aviso e a versão | `conversation-stream.test.ts` |
| 32 | U2 | Saem `run_event`, `catch-up.ts`, `kept.ts` e as listas | remoção (CI) |
| 28 | U10 | Percurso no Chromium nas sequências da exportação do Mastra, só das unidades em curso: cada linha abre; recarregar dá o mesmo | `tests/e2e/builder-native.test.ts` |
| 29 | U10 | QA (T25) com o conjunto fechado e o Gemini; o roteiro pelo fundador (L17) | `conexus-qa`, fundador |

**Em espera** (a bancada):

| # | U | Critério, observável de fora, com a recusa | Teste |
| --- | --- | --- | --- |
| 21 | U6 | As telas importam tipos e esquemas de `@/conexus/api.gen`, que a conferência gera; um import de `shared/operations` falha `tipos` | `check.test.ts`, `skills.test.ts` |
| 22 | U6 | `formatDate('2026-10-22')` dá `22/10/2026`; `isoDate` decodifica para a meia-noite local | `starter.test.ts` |
| 23 | U6 | `money`: `"1.234,56"` lê `1234.56`, guarda texto decimal, o campo mostra `R$ 1.234,56`; `"abc"` recusado | idem |
| 24 | U6 | A referência grava encomenda e histórico num comando (CTE); a migração tem `CHECK` e índice; a transição é conferida no handler; `failure.ts` no starter aceita `unknown`; `conexus-build` manda ler a referência no passo que escreve; as referências tipam | `skills.test.ts` |
| 25 | U7 | Migrações em `server/migrations/NNNN_nome.sql`, lidas sem rodar `handlers.ts`; a conferência recusa editar, apagar ou reordenar uma já enviada (`MIGRATION_CHANGED`); o Hub confere o prefixo exato (posição, nome, sha) | `check.test.ts`, `company-postgres.test.ts` |
| 26 | U7 | `CURRENT_DATE` no app é o dia de São Paulo | `company-postgres.test.ts` |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Linha de ferramenta | fechada, frase e assunto | sem argumentos nem resultado: nada a abrir | rodando, a saída cresce | vermelha, abre no erro | — | — (só o dono) | fora do conjunto: "Não pôde …", abre no motivo |
| Raciocínio | "Pensou por N s" | sem texto: "Pensou" | "Pensando…" | — | — | — | parado: o texto até ali |
| Painel de tarefas | some sem tarefas | idem | "Tarefas · N de M" | — | — | — | turno no fim: some |
| Anéis da memória | `0/30k` | `memory: null`: esperam o primeiro `om_status` | giram | marca de falha | — | — | — |
| Árvore do Código | pastas do app abertas, `components/ui` fechada | "Este app ainda está vazio" | o da 13 | o da 13 | — | — | — |
| Cartão da versão | "montou" | — | — | "não montou" | — | — | "pela metade" |

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
| `Manifest.migrations` dos arquivos | U7 | o Hub, U6 |

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
| `ALTER ROLE … SET TimeZone` | idempotente | uma transação | o banco da empresa | — | 26 |
| Prefixo das migrações no envio | só leitura até aplicar | a aplicação da 9 | o banco da empresa | `MIGRATION_CHANGED` | 25 |
| Pedido de raciocínio (U5) e LSP (U4), ao vivo | um por firstmate | — | CLIProxy ou E2B fora: a prova falha e o critério cai como dito | o registro | 18, 20 |
| Memória: observador e `threadTitle` | nativo | a volta segue | o modelo do observador: `om_*_failed`, a marca | — | 11, 14 |
| O que o modelo escreve: migrações, planos; o `api.gen.ts` da conferência | a 13 | a 13 | a máquina | — | 21, 25, 27 |
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
| `createCodingAgent`, `CyberRefusalHandler` | nativo | `builder.ts` | `workspace: undefined` | fila e conferência (0049, 0050, 0055) | `coding-agent/index.ts:90-136`; Mastra Code `sdk/src/index.ts:1216-1223,1338`; OS `controller.ts:3,223,238` |
| Fim | nosso; o nativo `goal` julga por modelo, não a lista (`agent/goal/scorer.ts:14-28`) | `processors.ts` | o portão da 14 | `abort(…, {retry})` | vibesdk `completion-signals.ts:14-28`; OS `controller.ts:159-178` |
| Memória (3 opções) | nativo | `builder.ts` | — | — | Mastra Code `agents/memory.ts:355-417`; OS `memory.ts:50` |
| Trava fora | nativo | `machines.ts` | sai `requireReadBeforeWrite` | prompt `builder.md:19` | Mastra Code e OS sem ela |
| Registro | nativo (o controle já tem `finishReason`) | `turn-line.ts` | escalares | S41 | `finish` do controle (`agent-controller-DRiP9C5v.js:1053`) |
| LSP | nativo, prova antes | `machines.ts` | — | — | `workspace/tools/helpers.ts:100-135`, `lsp/servers.ts:241-245` |
| Níveis | nativo | `providers.ts`, `thinking.ts`, `model-picker.tsx` | variantes do CLIProxy viram níveis | 0049 | `AgentControllerThinkingLevel` e `model_changed {thinkingLevel}` (`types.d.ts:613,626-632`); OS `model-picker.tsx:132` |
| Raciocínio do Gemini | nativo | `thinking.ts` | pelo modelo compatível com OpenAI | 0050 (CLIProxy) | `llm-DtX483Xc.js:8463-8474`; `dist-Btgwa9QY.js:3322-3326,3484` |
| `api.gen` como superfície | trazido como ideia | `check/manifest.ts` | reexporta tipos e esquemas | 0055 | OS `conexus-app/SKILL.md:56-58`, `check/steps/generate.ts:46-75` |
| Data, dinheiro, falha no starter | nosso; `Intl` só formata, não lê pt-BR | `starter/src/lib/` | — | — | OS `format` certo; vibesdk: nenhuma |
| Histórico, `CHECK`, transição | trazido do OS | referências de `conexus-data` | CTE | D28 | OS `conexus-server/SKILL.md:56-58` |
| Hora da referência | nativo | `conexus-build` | — | — | `workspace/skills/tools.ts:5-11` ("chame de novo") |
| Migrações em arquivo | trazido do OS | `app-contract`, `check/` | `server/migrations/` | prefixo exato | OS `conexus/migrations/NNN_nome.sql` |
| Fuso | nativo: o `TimeZone` do PostgreSQL | `company-postgres.ts:145` | — | — | nenhuma faz |
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

**Raio.** `kept.ts`, `catch-up.ts`, `run_event` (`builder/runs/`, com migração): apaga; `sessions.ts`: muda. `hub-api/{conversations,questions,index}.ts`: muda; `mastra-parts.ts`, `wire-limits.ts`: cria;
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
  CyberRefusalHandler(), checkGate]})`; sem `signals` à mão (com `memory` no agente, o
  `TaskSignalProvider` já vem, `coding-agent/index.ts:101-102`).
- **Memória**: `activateAfterIdle: {default: 'auto', anthropic: '1h'}`, `previousObserverTokens: 1000`,
  `threadTitle: true` com instrução em português, como Mastra Code e OS.
- **Fim**: `checkGate` lê as tarefas abertas do mesmo armazenamento; abertas: `abort("N tarefas
  abertas: …", {retry: true})`, contado em `CHECK_LIMITS.checks`; no limite, a versão leva `check:
  {state: 'unfinished', open}`. Pega o passo final vazio do Gemini.
- **Trava**: sai `requireReadBeforeWrite` (`machines.ts:200-201`).
- **Registro**: os campos do 17, escalares; `finishReason` do `finish` do controle.
- **LSP**: o 18 primeiro; passa: `Workspace({lsp: {root: APP_FOLDER}})`, com os dois programas da
  conferência no `tsconfig`.
- Modelo: `processors.ts` da 14 (C21, C26).

**Leitura.** skill `mastra`, referências `create-coding-agent`, `task-signal-provider`. Regras: C50, C57, C75, S41, T14. **Prova.** 14 a 18.

## U5 Níveis e o raciocínio do Gemini

**Raio.** `builder/model-accounts/{providers,thinking,served}.ts`,
`apps/web/src/builder/model-accounts/model-picker.tsx`, `platform/{recordings/,test-cliproxy.ts}`: muda.

**O fato.** O Gemini passa pelo CLIProxy no modelo compatível com OpenAI do Mastra
(`llm-DtX483Xc.js:8463-8474`): manda `reasoning_effort` (`dist-Btgwa9QY.js:3326`), lê
`reasoning_content` (`:3484`). O nome do CLIProxy carrega o nível (`gemini-3.8-flash-high`), fora do
registro: `providerOptionsOf` não manda nada (`thinking.ts:150-152`) e o seletor esconde o
**Raciocínio** (`thinking.ts:125-130`, `model-picker.tsx:62-64`). **Ordem.** O 20 primeiro; depois as
variantes viram um modelo com os níveis que o CLIProxy serve. Regras: T14, T24, S40. **Prova.** 19, 20.

## U6 O que o app aprende (em espera)

**Raio.** `packages/app/starter/src/lib/{format,date-codec,money,failure}.ts`, um campo de dinheiro em
`starter/src/components/`, `packages/app/skills/{conexus-app,conexus-data,conexus-build}/`,
`packages/app/src/check/manifest.ts`, `packages/app/src/skills.test.ts`: muda ou cria.

Contratos: `917b5e4`, na emenda.
Regras: D28, W21, W22, L23. **Prova.** 21 a 24.

## U7 Arquivos de migração e Fuso (em espera)

**Raio.** `packages/app-contract/src/manifest.ts`, `packages/app/src/check/` (dona; o `api.gen` da U6),
`builder/runs/runs.ts` (`Runs.check` passa as migrações enviadas), `hub/apps/send.ts` (prefixo),
`platform/company-postgres.ts`: muda.

Contratos: `917b5e4`, na emenda.
Regras: D11, D28, C48, S2. **Prova.** 25, 26.

## U8 Plano A e "2 a"

**Raio.** `builder/conversation/plan-tools.ts`, `packages/app/skills/conexus-plan-{new,change}/`,
`builder/machine/scripts.ts`: muda.

**Contratos.** `PLAN_DIR = '.conexus/plans'` (C26) no lugar de `PLAN_PATH`; `submit_plan` aceita um
`.md` direto nessa pasta, como Mastra Code (`utils/plans.ts:57`); reescrever o arquivo de um plano
aprovado é recusado ao modelo. `treeOf` (`scripts.ts:43-53`) segue escrevendo a árvore inteira; só o
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

## Por que a 14 deixou passar

Para o fechamento (L19): a revisão leu um cartão que permitia "não abre"; a QA usou dublês parciais,
só Anthropic (T24); o ao vivo da 13 viu "Usou uma ferramenta" sem virar critério.
