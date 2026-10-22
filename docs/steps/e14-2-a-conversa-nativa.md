# Etapa 14.2: Correção de tudo

## A página do fundador

**No fim desta etapa** você vê o Builder trabalhar como na Factory do Mastra (ferramentas que abrem,
raciocínio, tarefas fixas, memória), e o app sai com data, dinheiro e histórico certos; um turno com
tarefa aberta não vira "montou".

**O roteiro.** Padaria Sol, Ana (dona), Gemini 3.8 Flash, **Raciocínio** alto.

1. "Crie um app de encomendas com cliente, data de entrega e valor." "Pensou por 6 s" abre no texto
   do modelo; "Usou a skill **conexus-build**" abre nas instruções; "Leu `src/router.tsx`" abre no
   começo do arquivo; uma falha abre no motivo.
2. Acima da caixa de mensagem, "Tarefas · 2 de 5", fixas enquanto o Builder trabalha; abaixo dela,
   os anéis da memória. No fim, "Versão 1 guardada, montou", com todas as tarefas feitas.
3. Ana grava uma encomenda para 22/10/2026 de R$ 1.234,56: a lista mostra **22/10/2026** e
   **R$ 1.234,56**; o histórico tem a linha "criada"; "Atrasada" usa o dia de São Paulo.
4. "Mostre as entregas num calendário"; **Parar** com o plano aberto: nenhuma versão nova. De novo,
   aprovado: em **Código**, numa árvore, o plano novo ao lado do primeiro, intacto.
5. Ana recarrega: tudo abre igual.

**O que você faz, e quando.** No começo: aprova esta página. Nas U4 e U5, firstmate faz duas provas ao
vivo (o raciocínio do Gemini pela sua conta Google, o LSP na máquina). No fim: faz o roteiro e aprova
os textos.

**As suas palavras que a etapa cumpre** (2026-10-22): "14.2 e pra vir correcao de tudo"; "A" (o fio do
Mastra, a tela como a Factory) e "o simbolo de memoria observacional"; "2 a"; "tudo recomendado,
Plano A, sem Pasta"; "Aprovado tudo" (Coding e Memória). Mudam duas regras: V39 passa a mostrar o
raciocínio recolhido; a 0050 deixa argumentos e resultados irem à tela, cortados. Sem máscara: você
a tirou em 2026-10-22 (`9fd478b`).

**Fica de fora.** "Pasta" e "SDK" (não aprovados). Issues `next-card`: entram 236, 268, 271, 272; as
outras esperam a fila de defeitos (L4): migração (274, 275), testes
instáveis (265, 266, 269), máquina, Git e registros da 13 (233 a 238, 253, 254), 267 e 270 (rotas
e tabelas da 14, fora destas pastas).

**A decisão sua pedida.** Nenhuma além desta página.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | V39, 0050 e 0055 emendadas | `docs/` | design | — |
| U2 | O fio do Mastra, com tarefas e memória | `builder/conversation/{wire,live,history,turn-log,parts,cards,check-row,shell}.ts`, `hub-api/` | segurança | U1 |
| U3 | A transcrição, o painel de tarefas e os anéis | `apps/web/src/builder/conversation/` | web | U2 |
| U4 | O motor: Coding, Fim, Memória, Trava, Registro, LSP | `builder/conversation/{builder,processors,turn-line}.ts`, `builder/machine/machines.ts` | testes | U1 |
| U5 | Níveis e o raciocínio do Gemini | `builder/model-accounts/`, `apps/web/src/builder/model-accounts/`, `platform/recordings/` | testes | U1 |
| U6 | O que o app aprende: Contrato, Datas, Dinheiro, Histórico, Hora, Regras, Falha | `packages/app/{starter,skills,src/check/manifest.ts,src/skills.test.ts}` | dados | U1 |
| U7 | Arquivos de migração e Fuso | `packages/app-contract/`, `packages/app/src/check/`, `platform/company-postgres.ts` | dados | U1 |
| U8 | Plano A e "2 a" | `builder/conversation/plan-tools.ts`, `packages/app/skills/conexus-plan-*`, `builder/machine/scripts.ts` | dados | U1 |
| U9 | Árvore na aba Código | `apps/web/src/builder/source/` | web | — |
| U10 | Dublês e percurso | `tests/e2e/`, `platform/test-*` | testes | todas |

`builder/`, `platform/`: `apps/server/src/`; `hub-api/`: `packages/hub-api/src/`. Começa com a 14.0 em
`main` (L1: a U2 usa as partes `data-conexus-*` dela). Em paralelo: U2, U4 a U9 (arquivos
distintos; a U6 segue o contrato da U7 deste cartão). U3 depois da U2; U10 por último; QA antes das
revisões (L9). Pacote novo, só se a prova da U4 passar: `typescript-language-server` (L16).

**Orçamento de código alterado** (apagado conta; sem testes nem texto de skill). U2 750; U3 950;
U4 150; U5 150; U6 350; U7 450; U8 80; U9 150; U10 60. Total **3.090**, teto 4.000 (L2).

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
| 12 | U3 | Cartões de pergunta, plano e tarefas lidos da `tool-invocation` pelo nome; resposta livre em várias linhas (#272) | `cards.test.tsx` |
| 13 | U3, U9 | 1280 e 390 px, 200 %, dois temas, teclado (V30, V31), CSP limpo | T23 |
| 14 | U4 | O Builder sai de `createCodingAgent` com `workspace: undefined`: não tem workspace próprio, a máquina E2B segue emprestada por volta; a lista volta ao modelo depois que a chamada sai da janela | `conversation-tasks.test.ts` (novo) |
| 15 | U4 | Fim: turno que acaba com tarefa aberta volta ao modelo com "N tarefas abertas: …", no limite de `CHECK_LIMITS`; no limite, "Versão N guardada, pela metade"; parado, nada disso | `conversation-check.test.ts` |
| 16 | U4 | Sem `requireReadBeforeWrite`: duas escritas seguidas no mesmo arquivo passam; uma escrita fora da pasta do app, recusada pelo Mastra, sai como erro | `conversation-machine.test.ts` |
| 17 | U4 | A linha `CONVERSATION_TURN_ENDED` leva `finishReason`, a ferramenta que falhou, o código, o maior `inputTokens` de um passo, `cachedInputTokens` e as rodadas da conferência; nenhum texto livre (S41) | `turn-line.test.ts` |
| 18 | U4 | **Ao vivo**, firstmate: o LSP no template E2B dá diagnóstico de tipos numa escrita; passa: `Workspace({lsp})` e o resultado da escrita leva o diagnóstico; falha: sai numa issue | registro da U4 |
| 19 | U5 | Gemini é um modelo só, com **Raciocínio**; a escolha chega ao CLIProxy pelo pedido provado no 20, também para o padrão; Claude segue `summarized` | `thinking.test.ts`, `served-recordings.test.ts` |
| 20 | U5 | **Ao vivo**, firstmate: uma chamada pela conta Google do fundador devolve `reasoning_content` e diz se o nível vai no nome ou em `reasoning_effort`; a gravação entra em `platform/recordings/`; falha: 19 e a parte Gemini do 28 param, a etapa volta a ele | registro da U5 |
| 21 | U6 | As telas importam tipos e esquemas de `@/conexus/api.gen`, que a conferência gera; um import de `shared/operations` falha `tipos` | `check.test.ts`, `skills.test.ts` |
| 22 | U6 | `formatDate('2026-10-22')` dá `22/10/2026`; `isoDate` decodifica para a meia-noite local | `starter.test.ts` |
| 23 | U6 | `money`: `"1.234,56"` lê `1234.56`, guarda texto decimal, o campo mostra `R$ 1.234,56`; `"abc"` recusado | idem |
| 24 | U6 | A referência grava encomenda e histórico num comando (CTE); a migração tem `CHECK` e índice; a transição é conferida no handler; `failure.ts` no starter aceita `unknown`; as referências tipam no starter | `skills.test.ts` |
| 25 | U7 | Migrações em `server/migrations/NNNN_nome.sql`, lidas sem rodar `handlers.ts`; a conferência recusa editar, apagar ou reordenar uma já enviada (`MIGRATION_CHANGED`); o Hub confere o prefixo exato (posição, nome, sha) | `check.test.ts`, `company-postgres.test.ts` |
| 26 | U7 | `CURRENT_DATE` no app é o dia de São Paulo | `company-postgres.test.ts` |
| 27 | U8 | Cada plano em `.conexus/plans/<nome>.md`; `submit_plan` fora dessa pasta, recusado; o plano aprovado não é sobrescrito (#268); turno que só mudou planos, parado ou não: sem versão, sem conferência | `conversation-questions.test.ts`, `machine.test.ts` |
| 28 | U10 | Percurso no Chromium nas sequências da exportação do Mastra (U10): cada linha abre; recarregar dá o mesmo | `tests/e2e/builder-native.test.ts` |
| 29 | U10 | QA (T25) com o conjunto fechado e o Gemini; o roteiro pelo fundador (L17) | `conexus-qa`, fundador |

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
Código: árvore à esquerda, arquivo à direita     Código: arquivo; [Arquivos] abre a árvore no Sheet
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
| Leitura e stream (corte, 502, 503: repetem pelo `Last-Event-ID` da 12) | só leitura | — | o banco | — | 2 a 6 |

## O que nasce novo e o que é trazido

| Mecanismo | Nativo, nosso ou trazido | Arquivo | Refatorado | Decisões que carrega | Como Mastra, vibesdk e Conexus OS fazem, `file:line` |
| --- | --- | --- | --- | --- | --- |
| Fio do Mastra | nativo | `mastra-parts.ts`, `live.ts` | novo; `live.ts` perde a tradução | 0050, "Why not Mastra's routes" | `AgentControllerWireEvent` (`agent-controller/wire.d.ts:30-36`); Factory `services/transcript.ts:202-300`; OS `transcript.ts:1-9`; vibesdk: nenhuma faz |
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

Cada "nosso" entra em `boundaries.md`. Nada copiado. Dívida: nenhuma.

## U1 Regras

**Raio.** `docs/guides/design.md`, `docs/decisions/{0050,0055}-*.md`: muda. **Trocadas, não acrescidas.**
V39: "not exposed reasoning" vira "the model's reasoning is shown collapsed, in its own words; each
tool row opens on what it received and returned". 0050: "sends the browser tool arguments, results and
reasoning, which our parts keep server-side" vira "the Hub sends Mastra's own messages and events,
cut". 0055: migrações em `server/migrations/`, cada plano em `.conexus/plans/`. Fundador, 2026-10-22,
"A", "Plano A". **Prova.** 1.

## U2 O fio do Mastra

**Raio.** `hub-api/{conversations,questions,index}.ts`: muda; `mastra-parts.ts`, `wire-limits.ts`: cria;
`tool-detail.ts`: apaga. `builder/conversation/wire.ts`: cria; `parts.ts`, `check-row.ts`, `cards.ts`,
`shell.ts`: apaga ou encolhe; `live.ts`, `history.ts`, `turn-log.ts`: muda. Chama: web, OpenAPI,
`sessions.ts`, `routes.ts`.

**Contratos.**
- `MastraPart`: união por `type` com os nomes do Mastra (C21): `text`, `reasoning {reasoning, details}`,
  `tool-invocation {toolInvocation: {state, toolCallId, toolName, args, result?}}`, `data-${string}`;
  `args`, `result`, `data` são `unknown`; cada variante ganha só `cuts?: string[]`. O servidor prova em
  tipo que `MastraMessagePart` cabe em `z.input<typeof MastraPart>` (C27).
- `Message = {id, role, parts, suspended, model, createdAt}`; `suspended` vem de
  `metadata.suspendedTools` (hoje `withPlan`, `parts.ts:301-307`).
- `Conversation` ganha `tasks` (o armazenamento que `task_check` lê, `task-tools.ts:612-626`) e
  `memory: OMProgressState | null` (`session.displayState.get()`, `session.d.ts:1303`).
- `ConversationEvent`: `turn`, `turnEnd` e os eventos do critério 3, tipados por
  `AgentControllerWireEvent`; sem os textos livres `observations` e `error` dos `om_*`. As nossas partes
  vão como `data-conexus-*`.
- `cutPart`, `cutEvent` em `wire.ts`, único corte. `WIRE_LIMITS = {text: 2000, outputLines: 20,
  outputBytes: 4096}` (a base da 14, `tool-detail.ts:6-12`).
- Ids: o redutor da U3 lê `ToolCallId` e `MessageId` na entrada (C23).
- Modelo: `turn-log.ts` (C21, C26); `parts.ts` não (o `KINDS` fecha o que o Mastra deixa aberto).

**Leitura.** skill `mastra`; `agent-controller/{types,wire,session}.d.ts`. **Ordem.** Apagar `parts.ts`, `ToolDetail` e os testes de "não abre" (`conversation-parts.test.ts:65,92`,
`tool-row.test.tsx:94`); depois o contrato, `wire.ts`, `live.ts`, `history.ts`, OpenAPI.
Regras: C21, C23, C26, C27, C75, T5, T24. **Prova.** 2 a 7.

## U3 A transcrição, o painel e os anéis

**Raio.** `apps/web/src/builder/conversation/`: `transcript.ts`, `tool-presentation.ts`,
`task-panel.tsx`, `memory-status.tsx`: cria; `tool-row.tsx`, `builder-turn.tsx`, `fold.ts`,
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
**Raciocínio** (`thinking.ts:125-130`, `model-picker.tsx:62-64`). **Não provado**: qual pedido devolve os pensamentos, e se o nível vai no
nome ou em `reasoning_effort`.

**Ordem.** O 20 primeiro; depois as variantes viram um modelo com os níveis que o CLIProxy serve, e o
nível escolhido vira o pedido provado. Regras: T14, T24, S40. **Prova.** 19, 20.

## U6 O que o app aprende

**Raio.** `packages/app/starter/src/lib/{format,date-codec,money,failure}.ts`, um campo de dinheiro em
`starter/src/components/`, `packages/app/skills/{conexus-app,conexus-data,conexus-build}/`,
`packages/app/src/check/manifest.ts`, `packages/app/src/skills.test.ts`: muda ou cria.

**Contratos.** `api.gen.ts` reexporta `type *` e os esquemas de `shared/operations`; as skills e
referências importam só dele. `formatDate` lê data sem hora como calendário. `money`: codec Zod
de texto decimal, `parseMoney` pt-BR, `MoneyInput`. `failureOf(error: unknown)` no starter; a
referência sai. Referências: criação com histórico em CTE (o teste deixa de proibi-lo,
`skills.test.ts:114-119`), `CHECK` de situação, índice do histórico, transição no handler (OS
`conexus-server/SKILL.md:56-58`, adaptada). `conexus-build`: ler a referência do padrão no passo que
escreve. O parágrafo de migrações segue o contrato da U7. **Nada novo no prompt** (auditoria, RC4).
Regras: D28, W21, W22, L23. **Prova.** 21 a 24.

## U7 Arquivos de migração e Fuso

**Raio.** `packages/app-contract/src/manifest.ts`, `packages/app/src/check/`,
`apps/server/src/platform/company-postgres.ts`: muda.

**Contratos.** `Manifest.migrations` vem de `server/migrations/NNNN_nome.sql`, lidos como arquivos; a
conferência recebe do servidor as migrações já enviadas e recusa mudança com `MIGRATION_CHANGED` (C48);
o Hub, no envio, aplica só um prefixo exato. `ALTER ROLE <app> SET TimeZone = 'America/Sao_Paulo'`
ao lado de `statement_timeout` (`:145`). Apps guardados com migrações em `handlers.ts` seguem válidos (0019). Regras: D11, D28, C48, S2. **Prova.** 25, 26.

## U8 Plano A e "2 a"

**Raio.** `builder/conversation/plan-tools.ts`, `packages/app/skills/conexus-plan-{new,change}/`,
`builder/machine/scripts.ts`: muda.

**Contratos.** `PLAN_DIR = '.conexus/plans'` (C26) no lugar de `PLAN_PATH`; `submit_plan` aceita um
`.md` direto nessa pasta, como Mastra Code (`utils/plans.ts:57`); reescrever o arquivo de um plano
aprovado é recusado ao modelo. `treeOf` (`scripts.ts:43-53`) segue escrevendo a árvore inteira; só o
teste de "sem mudança" (`:52`) e a contagem (`:73`) deixam `PLAN_DIR` de fora (pathspec). **Prova.** 27.

## U9 Árvore

**Raio.** `apps/web/src/builder/source/{source,file-tree}.tsx`: muda, cria. **Contrato.** Árvore sobre o
`Collapsible` (shadcn `sidebar-11`), com papéis ARIA de árvore; pastas do app primeiro, `components/ui`
fechada; a 390 px, o arquivo na tela e **Arquivos** abre a árvore no `Sheet`. Os estados de #236.
Regras: V30, V31, W22. **Prova.** 13 e o passo 4 do roteiro.

## U10 Dublês e percurso

**Raio.** `tests/e2e/builder-native.test.ts`: cria; `platform/test-{anthropic,cliproxy}.ts`: muda.
As sequências vêm da exportação do Mastra que firstmate guardou (execuções 1, 2, 3, a do fundador),
com conteúdo inventado (S40, T24): a lista que sai da janela, o passo final vazio, `skill`,
`list_files`, `grep`, a escrita recusada. **Prova.** 28, 29.

## Por que a 14 deixou passar

Para o fechamento (L19).

1. `conexus-review` conferiu o código contra um cartão que permitia "não abre" e a lista em linha:
   conferir cada estado da matriz contra Factory e OS.
2. `conexus-qa` andou em dublês só das ferramentas nomeadas, só Anthropic: o conjunto fechado e o
   modelo de produção (T24 já mudou).
3. O ao vivo da 13 viu "Usou uma ferramenta", sem critério: achado ao vivo vira `next-card`.
4. A 12 trocou `createCodingAgent` por `new Agent` sem motivo (`ab3dc05`): C75 já cobre.
