# Etapa 14.2: A conversa nativa

## A página do fundador

**No fim desta etapa** você conversa com o Builder e vê o que ele faz como a Factory do Mastra
mostra: cada ferramenta abre no que ela recebeu e no que devolveu, a skill aparece com o nome, o
raciocínio do modelo aparece recolhido nas palavras dele, uma falha abre no motivo, e o símbolo da
memória observacional diz quando o Builder está guardando a conversa na memória.

**O roteiro de uso.** Padaria Sol, com Ana (dona), no Gemini 3.8 Flash High da conta Google.

1. Como **Ana**, "Encomendas" › **Conversa**: "Crie um app de encomendas com cliente, telefone e
   data de entrega." Antes das ferramentas, "Pensando…"; depois, "Pensou por 6 s", que abre no texto
   do raciocínio.
2. A linha "Usou a skill **conexus-build**" abre nas instruções da skill. "Listou arquivos em `src`"
   abre na lista; "Procurou `createApi`" abre nos achados; "Leu `src/router.tsx`" abre no começo do
   arquivo.
3. Uma linha vermelha "Não conseguiu escrever `src/routes/home.tsx`" abre primeiro no motivo, como o
   Mastra o escreve: "File … has not been read. You must read a file before writing to it." A linha
   seguinte lê o arquivo e a próxima o escreve.
4. Sob o compositor, dois anéis da memória: "Mensagens 14,9/30k" e "Observações 2,1/40k", que
   abrem num quadro com o que cada um quer dizer. Com a conversa longa, o anel enche, gira e aparece
   "Guardando a memória…"; depois volta ao repouso, com as mensagens guardadas.
5. Ana pede um ajuste no plano e aperta **Parar** antes de aprovar. Nenhuma "Versão 2" aparece: o
   plano sozinho não é mudança do app.
6. Ana recarrega a página: tudo que abriu ao vivo abre igual.

**O que você faz, e quando.** No começo: aprova esta página. Na U3: firstmate chama o Gemini uma vez
pela sua conta Google para provar que o raciocínio chega (a única chamada de fora). No fim: faz o
roteiro na nuvem, diz o que viu e aprova os textos das linhas e do símbolo.

**As suas palavras que esta etapa cumpre.** "Isso e solucao nativa nao patch"; "A" (o Hub manda os
eventos e as mensagens do próprio Mastra, e a tela os mostra como a Factory); "o simbolo de memoria
observacional que tinha conexus os e factory"; à chamada 2 da checagem ao vivo, "2 a" (Parar com o
plano aberto não guarda versão só com `.conexus/plan.md`). Com a "A" mudam duas regras: a V39 passa
de "raciocínio não exposto" a "raciocínio mostrado recolhido, nas palavras do modelo"; a 0050 deixa
os argumentos e resultados das ferramentas irem à tela, cortados.

**Sem máscara, como você decidiu.** Em 2026-10-22 você tirou a máscara de segredos ("as credenciais
dos conectores nunca chegam ao Builder pela arquitetura", commit `9fd478b`). A tela recebe os
argumentos e resultados como o Mastra guarda, só cortados. Exemplo: `echo token=abc` aparece assim.

**Fica de fora.** A qualidade do que o Builder constrói (prompt, skills, starter, conferência,
tokens, registros), que outro estudo examina agora; o turno que termina com tarefas do plano abertas
(a sua chamada 1, ainda aberta); subagentes (desligados, `subagent` em `disableBuiltinTools`).

**A ordem.** A 14.2 vem depois da 14.0, que guarda as nossas partes nas mensagens do Mastra como
`data-conexus-*` e tira o diário `run_event`: as duas mudam `live.ts`, `history.ts` e `turn-log.ts`,
e uma etapa irmã só começa com a anterior em `main` (L1). Firstmate confirma a posição com você.

**A decisão sua pedida nesta etapa.** Nenhuma além da aprovação desta página.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | V39 e 0050 emendadas | `docs/` | design | 14.0 fechada |
| U2 | O fio do Mastra: mensagens e eventos, cortados num dono | `builder/conversation/`, `hub-api/` | segurança | U1 |
| U3 | O raciocínio do Gemini pedido e provado | `builder/model-accounts/`, `platform/` | testes | U1 |
| U4 | A transcrição como a da Factory e o símbolo da memória | `apps/web/src/builder/conversation/` | web | U2 |
| U5 | O plano não é mudança do app ("2 a") | `builder/machine/` | dados | U1 |
| U6 | Dublês e percurso | `tests/e2e/`, `platform/test-*` | testes | U2 a U5 |

`builder/`, `platform/`: `apps/server/src/`; `hub-api/`: `packages/hub-api/src/`. U3 e U5 correm em
paralelo com U2 (não dividem pasta); U4 depois de U2. QA (T25) antes das revisões (L9). **Pacotes
novos**: nenhum.

**Orçamento de código alterado** (apagado conta). U2 750 (apaga ~550 de `parts.ts`, `live.ts`,
`history.ts`, `check-row.ts`, `cards.ts` e do contrato); U3 80; U4 800 (apaga ~300 de `tool-text.ts`,
`tool-row.tsx`, `thinking-line.tsx`, `fold.ts`); U5 30; U6 60. Total: **1.720**, teto 4.000 (L2).

## Os critérios de aceite

Pelas rotas, `main.ts` e a tela; `Machines` dublê, modelo gravado (T24). **Ao vivo**: só o 14, por
firstmate. Todos must.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova |
| --- | --- | --- | --- |
| 1 | U1 | V39 e 0050 com a regra trocada e a frase do fundador; nenhuma outra regra diz "reasoning not exposed" ou "keep server-side" | `check-docs`, o registro |
| 2 | U2 | `readConversation` devolve as partes como o Mastra as guarda: `text`, `reasoning` com o texto, `tool-invocation` com `toolName`, `args`, `result` e `state`, `data-*`; o tipo de Mastra cabe no esquema do contrato, e um campo novo do Mastra passa sem mudança nossa | `conversation-wire.test.ts`, checagem de tipo |
| 3 | U2 | O stream manda `message_start`, `message_update` (`text-delta`, `reasoning-delta`, `part`), `message_end`, `shell_output`, `command_exit`, `om_*` e `agent_end` na forma do Mastra; os nossos, `turn` e as partes `data-conexus-*`; nenhum outro evento do controle sai | idem |
| 4 | U2 | Ao vivo e relido, a mesma parte: para `skill`, `list_files`, `grep`, `read_file`, `write_file`, `edit_file`, `execute_command` (a saída cortada pelos mesmos `WIRE_LIMITS` nos `shell_output` e no `result` relido), `conexus_check` e uma ferramenta que o contrato não conhece | idem |
| 5 | U2 | Os cortes de `WIRE_LIMITS`, um dono (C26), sobre a forma do Mastra: texto de argumento ou resultado acima do limite sai cortado com `…` e o seu caminho em `cuts`; o resto do objeto segue; nenhum corte fora de `wire.ts` | idem |
| 6 | U2 | Ferramenta fora do conjunto fechado (`TOOL_CLOSURE`): a parte sai com o erro do controle, `state: 'output-error'`; a escrita recusada por `requireReadBeforeWrite` sai com o texto de `FileReadRequiredError` no resultado | idem |
| 7 | U2 | Saem `MessagePart` `tool`/`reasoning`/`file`, `ToolDetail`, `ToolSubject`, `KINDS`, `subjectOf`, `detailOf`, `toolOf`, `cardOf`, `fileOf`, `partOf`, `eventOf`, `withHeard`, `exitHeard`, `toldTool` e os testes que os afirmam; `grep` não acha nenhum | linha de remoção (CI) |
| 8 | U3 | Gemini pelo CLIProxy: o corpo do pedido leva o pedido de raciocínio provado na U3, também para um nome do CLIProxy fora do registro (`gemini-3.8-flash-high`); Claude segue `display: 'summarized'`. Depende do 20 | `thinking.test.ts`, `served-recordings.test.ts` |
| 9 | U3 | A gravação do CLIProxy com `reasoning_content` vira `reasoning` com o texto no fio e na releitura. Depende do 20 | `conversation-wire.test.ts` |
| 10 | U4 | Toda linha com argumentos ou resultado abre; a leitura abre no começo do conteúdo; `list_files` e `grep`, no resultado; `skill`, "Usou a skill *nome*" e as instruções em Markdown; desconhecida: o nome legível, argumentos e resultado; comando, cauda e código; edição, diferença | `tool-row.test.tsx` |
| 11 | U4 | Ferramenta que falhou: vermelha, abre primeiro no erro, depois nos argumentos | idem |
| 12 | U4 | Raciocínio: "Pensando…" enquanto chega, depois "Pensou por N s" (ou "Pensou", sem tempo), fechado, abre no texto em Markdown | `transcript.test.tsx` |
| 13 | U4 | Três ou mais ferramentas seguidas viram um grupo (`TOOL_GROUP_MIN`); texto ou raciocínio quebra o grupo; `skill`, `ask_user` e `submit_plan` nunca agrupam; `task_*` não têm linha | idem |
| 14 | U4 | Memória: dois anéis, mensagens e observações, `tokens/limite` de `om_status`, e, ao abrir, o quadro; ao reler, o estado da sessão; observando ou refletindo, o anel gira com "Guardando a memória…" ou "Reorganizando a memória…"; falha: a marca "A memória não foi atualizada" até a mesma operação passar, sem o texto do fornecedor (C48, C51) | `memory-status.test.tsx` |
| 15 | U4 | Perguntas, plano e tarefas seguem os cartões da 14, agora lidos da `tool-invocation` pelo nome da ferramenta (o plano aberto, de `Message.suspended`); estados e textos da 14 | `cards.test.tsx` |
| 16 | U4 | 1280, 390 px, 200 %, dois temas, teclado (V30, V31), CSP limpo | T23 |
| 17 | U5 | Turno que só escreveu `.conexus/plan.md`, parado ou terminado: sem versão, sem conferência; com outro arquivo mudado: a versão guarda os dois | `machine.test.ts`, `runs.test.ts` |
| 18 | U6 | O percurso no Chromium com o Anthropic dublê chamando `skill`, `list_files`, `grep` e uma escrita recusada, e o CLIProxy dublê com a gravação que pensa: cada linha abre, a recusada no motivo; recarregar dá as mesmas linhas e os anéis da memória. A parte do Gemini depende do 20 | `tests/e2e/conversation-native.test.ts` |
| 19 | U6 | QA no commit candidato (T25), com o conjunto fechado inteiro e o Gemini; o roteiro, pelo fundador (L17) | `conexus-qa`, fundador |
| 20 | U3 | **Ao vivo**, firstmate: uma chamada ao Gemini 3.8 Flash High pela conta Google do fundador devolve `reasoning_content`; a gravação entra em `platform/recordings/` | o registro da U3 |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Linha de ferramenta | fechada, a frase e o assunto | sem argumentos nem resultado: não abre | rodando; a saída cresce | vermelha, abre no erro | — | — (a Conversa é só do dono) | recusada pelo conjunto fechado: "Não pôde …", abre no motivo |
| Linha do raciocínio | fechada, "Pensou por N s" | sem texto: "Pensou", não abre | "Pensando…" | — | — | — | turno parado: o texto até ali |
| Símbolo da memória | os anéis em repouso, `0/30k` | `memory: null` (a sessão não está nesta cópia do Hub): os anéis esperam o primeiro `om_status` | o anel gira; "Guardando a memória…" ou "Reorganizando a memória…" | a marca "A memória não foi atualizada" | — | — | — |
| Cartões (pergunta, plano, tarefas) | os da 14 | idem | idem | idem | — | — | idem |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Message.parts: MastraPart[]` (`text`, `reasoning`, `tool-invocation`, `data-*`) | U2, do Mastra | U4 |
| `Message.suspended`: de `metadata.suspendedTools`, só `suspendPayload` (o plano aberto) | U2 | U4 (cartão do plano) |
| `ConversationEvent`: `turn`, `message_*`, `shell_output`, `command_exit`, `om_*`, `agent_end` | U2 | U4 |
| `Conversation.memory`: o `omProgress` da sessão (`OMProgressState` do Mastra), ou `null` | U2 | U4 (os anéis ao abrir) |
| `cuts` na parte e no `shell_output`: os caminhos cortados | U2 (`wire.ts`) | U4 ("…") |
| `WIRE_LIMITS`, em `hub-api/src/wire-limits.ts` | U2 | U2 (`wire.ts`) |
| pedido de raciocínio do Google pelo CLIProxy | U3 | o CLIProxy |

**Os desenhos** (Factory `ToolCard.tsx`, `MessageBubble.tsx`; o OS no seu fluxo de ferramenta):

```text
1280 Conversa                                      390 Conversa
🧠 Pensou por 6 s ›                                 🧠 Pensou por 6 s ›
  │ Preciso ver o roteador antes de…  (aberto)      📘 Usou a skill conexus-build ›
📘 Usou a skill conexus-build ›                     ▸ 3 ferramentas ›
▸ 3 ferramentas: listou, procurou, leu ›            ⚠ Não conseguiu escrever home.tsx ›
⚠ Não conseguiu escrever src/routes/home.tsx ›        │ File … has not been read…
  │ File "src/routes/home.tsx" has not been read…   ✎ Escreveu home.tsx ›
  │ path: src/routes/home.tsx  content: …          ─────────────────────
✎ Escreveu src/routes/home.tsx ›                    [mensagem…]
◔ 14,9/30k ◔ 2,1/40k  🧠 Guardando a memória…        ◔ 14,9/30k ◔ 2,1/40k
```

## A tabela de falhas

| Gravação ou comando | Duas vezes | Recusada no meio | Dependência fora | Imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Coleta da versão sem `.conexus/plan.md` na comparação | a da 13 | a da 13 | a máquina: a da 13 | `VERSION_SAVED` ou nada | 17 |
| Pedido de raciocínio do Gemini | um por passo | o passo da 12 | CLIProxy fora: `MODEL_CALL_FAILED` da 12 | — | 8, 20 |
| Leitura e stream da Conversa | só leitura | — | o banco: a da 14.0 | — | 2 a 6 |
| A prova ao vivo da U3 (20) | uma por firstmate | — | nenhum campo devolve `reasoning_content`: 8, 9 e a parte do Gemini do 18 param, a etapa volta ao fundador; o resto segue | o pedido provado, no registro da U3 | 8, 9, 18, 20 |

## O que nasce novo e o que é trazido

| Mecanismo | Nativo, nosso ou trazido | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base | Como Mastra, vibesdk e Conexus OS fazem, `file:line` |
| --- | --- | --- | --- | --- | --- |
| Fio: eventos e mensagens do Mastra | nativo | `hub-api/src/mastra-parts.ts`, `builder/conversation/live.ts` | novo; `live.ts` perde a tradução | dono e rotas da 0050, "Why not Mastra's routes" | Factory `mastracode/factory-ui/src/ui/domains/chat/services/transcript.ts:202-300`; OS `apps/web/src/features/builder/transcript.ts:1-9,119-188`; vibesdk: nenhuma faz |
| Cortes num dono | nosso, novo | `builder/conversation/wire.ts`, `hub-api/src/wire-limits.ts` | de `DETAIL_LIMITS` por parte a um corte por texto | limites da 14 (`tool-detail.ts:6-12`) | Factory corta na tela, 800 (`components/tool/ToolCard.tsx:41,54,64`); OS `OUTPUT_LIMIT = 800` (`components/builder-conversation.tsx:121`) |
| Redutor da transcrição | nativo na forma, nosso no código | `apps/web/.../transcript.ts` | uma porta para vivo e relido | uma mensagem por passo guardada, uma por volta ao vivo | Factory `mastracode/factory-ui/src/ui/domains/chat/services/transcript.ts:423-437,696-726`; Mastra Code `mastracode/tui/src/tui/event-dispatch.ts:100-130` |
| Linha de ferramenta por nome, com volta | nativo na forma | `tool-presentation.ts`, `tool-row.tsx` | frases em português | conjunto fechado (`permissions.ts`) | `packages/playground-ui/src/.../tool-presentation.ts:70-119`; Factory `components/tool/ToolCard.tsx:27-30,70-74`, `components/ToolFactory.tsx:78-117`; OS `construir/tool-sentences.ts:21-71,123`; vibesdk `exec-commands.ts:35-46` |
| Falha abre no erro | nativo | `tool-row.tsx` | — | — | Factory `ToolCard.tsx:40-42`; OS `builder-conversation.tsx:143-144` |
| Skill com instruções | nativo | `tool-presentation.ts` | — | — | Factory `ToolFactory.tsx:99-103`, playground `domains/chat/messages/skill-message.tsx:11-21` (24rem, Markdown) |
| Raciocínio recolhido | nativo | `thinking-line.tsx` | o tempo, nosso (12.1) | V39 emendada | Factory `components/MessageBubble.tsx:180-185` (`defaultOpen={false}`, sem tempo); OS `builder-conversation.tsx:159-172` ("Pensou"); Mastra Code esconde (`tui/state.ts:466`) |
| Grupo de 3 ou mais | nativo | `fold.ts` | — | `TOOL_GROUP_MIN` | playground `group-consecutive.ts:17`; Factory `components/transcript-parts.ts:93` (`ask_user`, `submit_plan`, `skill` não agrupam) |
| Símbolo da memória | nativo | `memory-status.tsx` | estado de falha, do OS | `observationalMemory` (`builder.ts:99`) | Factory `services/runtime.ts:194-207`, `services/om.ts:23-35`, `components/StatusLine/OperationalMemoryStatus.tsx:11-90`, `RuntimeActivity.tsx:10-26`; OS `runtime.ts:30-52`, `composer/memory-status.tsx:35-77` |
| Pedido de raciocínio do Gemini | nativo | `model-accounts/thinking.ts` | pelo CLIProxy | 0050 (Gemini pelo CLIProxy) | Mastra Code `mastracode/sdk/src/providers/google-thinking.ts:67-88` (sem `includeThoughts`); OS: nenhuma faz |
| Plano fora da mudança | nosso | `builder/machine/scripts.ts` | — | "2 a" | nenhuma faz |

**A medida do transplante.** Nenhum código copiado: a Factory e o OS são lidos, não trazidos.

**A dívida.** Nenhuma.

## U1 V39 e 0050 emendadas

**Raio.** `docs/guides/design.md` (V39), `docs/decisions/0050-conversation-on-the-agent-controller.md`:
muda. `docs/reference/boundaries.md`: a entrada da conversa, se ela citar `parts.ts`. Chama:
`check-docs`.

**Contratos.** **Regras trocadas, não acrescidas.** V39: "technical tool activity becomes an
understandable sentence, not exposed reasoning" vira "an understandable sentence per tool, opening
on what it received and returned; the model's reasoning is shown collapsed, in its own words"
(fundador, 2026-10-22, "A"). 0050, "Why not Mastra's routes": "sends the browser tool arguments,
results and reasoning, which our parts keep server-side" vira "the Hub keeps its routes and owner
check and sends Mastra's own messages and events, cut by `WIRE_LIMITS` (founder, 2026-10-22, 'A')";
a 0050 fica em 350 palavras (L24). **Prova.** 1.

## U2 O fio do Mastra

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/conversations.ts`, `questions.ts`, `index.ts` | muda | web, OpenAPI, servidor |
| `packages/hub-api/src/tool-detail.ts` → `wire-limits.ts` | apaga; cria `WIRE_LIMITS` e `SUBJECT_MAX_LENGTH` | `wire.ts` |
| `packages/hub-api/src/mastra-parts.ts` | cria | `conversations.ts`, web |
| `builder/conversation/wire.ts` | cria: o dono dos cortes | `live.ts`, `history.ts` |
| `builder/conversation/{parts,check-row,cards,shell}.ts` | apaga ou encolhe ao que não é tradução | `live.ts`, `history.ts`, `routes.ts` |
| `builder/conversation/{live,history,turn-log}.ts` | muda | `sessions.ts`, `routes.ts` |
| o documento OpenAPI | gerado | `check-openapi` |

### Os contratos que a unidade cria

- `MastraPart`, em `mastra-parts.ts`: união por `type` com os nomes do Mastra (C21):
  `{type: 'text', text}`, `{type: 'reasoning', reasoning, details: {type: 'text', text}[]}`,
  `{type: 'tool-invocation', toolInvocation: {state, toolCallId, toolName, args, result?}}`, e
  `{type: \`data-${string}\`, data}`. `args`, `result` e `data` são `unknown` (o contrato não fecha
  ferramentas); o estado é o enum do Mastra (`partial-call` … `output-denied`). O servidor prova em
  tipo que `MastraMessagePart` de `@mastra/core/agent-controller` cabe em `z.input<typeof MastraPart>`
  (C27: o esquema é a entrada de fora; Mastra é a fonte). Cada variante ganha só `cuts?: string[]`, os
  caminhos que `wire.ts` cortou (`toolInvocation.result`, `reasoning`); opcional, a prova de tipo segue.
- Os ids: `toolCallId` e `id` chegam como texto do Mastra; o redutor da U4 os lê por `ToolCallId` e
  `MessageId` (C23), na entrada; um que falha a marca é descartado.
- `Conversation` ganha `memory: OMProgressState | null`: o `omProgress` de
  `session.displayState.get()` (`session.d.ts:1303`; `types.d.ts:585`, forma em `:461-485`) quando a
  sessão está nesta cópia do Hub, senão `null`, como o OS o lê ao abrir (`mastra-session.ts:119-121`).
- `Message = {id, role, parts: MastraPart[], suspended, model, createdAt}`; `suspended:
  Record<ToolCallId, unknown>`, o `suspendPayload` de `metadata.suspendedTools` (hoje `withPlan`,
  `parts.ts:301-307`); nada mais da `metadata`.
- `ConversationEvent`: `turn {message, startedAt}` e `turnEnd` ficam (nossos: reconectar, D da
  13); entram, como o Mastra os emite (`agent-controller/types.d.ts:660-680`, `:792-900`),
  tipados por `AgentControllerWireEvent`, o tipo do Mastra para um evento depois do JSON
  (`agent-controller/wire.d.ts:30-36`, exportado em `index.d.ts:16`):
  `message_start {message}`, `message_update {id, event}`, `message_end {id}`, `shell_output`,
  `command_exit`, `om_status` e os `om_*_start`, `_end` e `_failed` (sem os textos `observations` e
  `error`, que ficam no servidor: a tela não os mostra em nenhuma referência), `agent_end`; saem `text`, `part` e `notice` nossos. As nossas
  partes (`machine`, `version`, `restarted`, `failure`, `notice`) vão como `message_update` de parte
  `data-conexus-<nome>`, os nomes que a 14.0 guarda.
- `cutPart(part: MastraPart): MastraPart` e `cutEvent(event)`, em `wire.ts`, o único lugar que corta:
  cada texto em `args`, `result`, `reasoning` e `shell_output` acima de `WIRE_LIMITS`
  (`wire-limits.ts`, C26) sai cortado e o seu caminho vai para `cuts`. `WIRE_LIMITS = {text: 2000, outputLines: 20, outputBytes:
  4096}`: os de `DETAIL_LIMITS` da 14, cuja base está em `tool-detail.ts:6-12`, e 2.000 caracteres para
  todo texto, como o arquivo escrito da 14 (a Factory corta a leitura em 800, ver a tabela).
- Sem máscara (fundador, 2026-10-22, `9fd478b`).
- Modelo: `turn-log.ts` (C21, C26); `parts.ts` não é modelo (tradução fechada, C26 quebrada pelo
  `KINDS`).

### As skills e a leitura

`docs/reference/stack.md`, linha `@mastra/core`: skill `mastra`; ler
`node_modules/@mastra/core/dist/agent-controller/types.d.ts:600-900` e
`dist/docs/references/` da conversa. A linha cita o fork 1.69; vale o 1.78 instalado.

### A ordem do trabalho

1. Apagar antes de pôr: `parts.ts`, `ToolDetail`, os testes que afirmam "não abre" e "sem o texto do
   erro" (`conversation-parts.test.ts:65,92`, `tool-row.test.tsx:94`). Regras: C26, C27, T5.
2. `mastra-parts.ts` e a prova de tipo; `wire.ts`; `live.ts` repassa os eventos por `cutEvent`;
   `history.ts` lê `MastraDBMessage` por `cutPart`. Funções: `@mastra/core@1.78.0`
   `AgentControllerEvent`, `MastraDBMessage`, `WORKSPACE_TOOLS`.
3. OpenAPI gerado. **Prova.** 2 a 7.

## U3 O raciocínio do Gemini

**Raio.** `builder/model-accounts/thinking.ts`, `platform/recordings/`, `platform/test-cliproxy.ts`:
muda.

**O fato.** O Gemini da conta Google passa pelo CLIProxy com o modelo compatível com OpenAI do Mastra
(`llm-DtX483Xc.js:8463-8474`, `createOpenAICompatible({name: providerId})`), não pelo
`@ai-sdk/google`: `google.thinkingConfig.includeThoughts`, a chave do estudo, não é o caminho. Esse
modelo espalha `providerOptions.google` no corpo e manda `reasoning_effort`
(`dist-Btgwa9QY.js:3322-3326`), e lê `delta.reasoning_content` como raciocínio (`:3484`). A gravação
do CLIProxy já traz o campo, vazio (`recordings/google-abort.sse`). Hoje `providerOptionsOf` não manda
nada para `gemini-3.8-flash-high` (`thinking.ts:150-152`) e, para o resto, um `thinkingConfig` (`:167-175`) que o
corpo leva cru. **Não provado**: qual campo faz o CLIProxy v8.0.33 devolver os pensamentos.

**Ordem.** 1. O 20 primeiro, por firstmate: `reasoning_effort` e, se vier vazio, `thinkingConfig:
{includeThoughts: true}` no corpo; o que devolver `reasoning_content` é o pedido; nenhum devolve: a
etapa volta ao fundador. 2. `providerOptionsOf` para os nomes do CLIProxy. Regras: T14, T24, S40.
**Prova.** 8, 9, 20.

## U4 A transcrição como a da Factory

### O raio da mudança

`apps/web/src/builder/conversation/`: `transcript.ts` (o redutor), `tool-presentation.ts`,
`memory-status.tsx`: cria. `tool-row.tsx`, `builder-turn.tsx`, `fold.ts`, `thinking-line.tsx`,
`use-live.ts`, `live.ts`, `question-card.tsx`, `plan-card.tsx`, `task-list.tsx`, `composer.tsx`:
muda. `tool-text.ts`: apaga (as frases vão para `tool-presentation.ts`). Chama: `panel.tsx`,
`workbench.tsx`.

### Os contratos que a unidade cria

- `reduce(transcript: Transcript, event: ConversationEvent): Transcript` e `fromMessages(messages:
  Message[]): Transcript`, um redutor só, as duas portas, como a Factory (ver a tabela). As chamadas
  por `toolCallId` (C23, `ToolCallId`).
- `Transcript` item, união por `kind` (C21): `text`, `reasoning {text, state, seconds}`, `tool
  {toolCallId, toolName, args, result, state, shellOutput}`, `card` (pergunta, plano, tarefas, por
  nome), `conexus` (as partes `data-conexus-*`).
- `presentTool(toolName): {icon, sentence: Record<state, string>, subject(args), body(args, result)}`,
  dono das frases (C26), uma linha por ferramenta do conjunto fechado (`permissions.ts:5-37`) e a
  volta: o nome legível ("Usou *list files*"), argumentos e resultado em JSON, como a Factory.
- `MemoryStatus`: os dois anéis e o quadro, como a Factory (`OperationalMemoryStatus.tsx:11-90`); a
  fase `idle | buffering | observing | reflecting` (C21), pela regra de `runtime.ts:194-207` da
  Factory; a marca de falha por operação, como o OS (`runtime.ts:30-52`), que a Factory não tem.
  Ao lado do compositor (`composer.tsx`).
- Frases em português (L23), aprovadas pelo fundador no fim.

### As skills e a leitura

`stack.md`, `react-markdown`, `remark-gfm`, `remend` (o texto da skill e do raciocínio é Markdown);
`components.md` para `Collapsible`; guia web.

### A ordem do trabalho

1. Apagar `tool-text.ts`, a regra de `thinking-line.tsx:8` e os testes "não abre". 2. O redutor e a
   apresentação; os cartões leem a `tool-invocation`. 3. O símbolo. Regras: C21, C23, C26, V19, V29
   a V31, V39 (emendada), V54, W22, W31. **Prova.** 10 a 16.

## U5 O plano não é mudança do app

**Raio.** `builder/machine/scripts.ts`: muda; chama: `builder/runs/save.ts`,
`builder/conversation/processors.ts` (sem arquivo mudado, sem conferência, critério 13 da 14).

**Contrato.** `treeOf` (`scripts.ts:43-53`, de `changedScript` e da coleta) segue escrevendo a árvore
inteira, com o plano; só o teste de "sem mudança" (`:52`) passa da igualdade de árvores para
`git diff-tree --quiet` da base contra a árvore fora de `PLAN_PATH` (`plan-tools.ts:12`, pathspec de
exclusão). Assim a versão que guarda outra mudança leva o plano junto, e a contagem `changed` (`:73`)
usa a mesma exclusão. Fundador, 2026-10-22, "2 a". **Prova.** 17.

## U6 Dublês e percurso

**Raio.** `tests/e2e/conversation-native.test.ts`: cria; `platform/test-anthropic.ts`,
`platform/test-cliproxy.ts`: muda. O dublê Anthropic toca `skill`, `mastra_workspace_list_files`,
`mastra_workspace_grep` e uma escrita sem leitura (a recusa é a do Mastra, não um falso); o CLIProxy
toca a gravação da U3. **Prova.** 18, 19.

## Por que a 14 deixou passar

Para o fechamento (L19), sem editar agora as skills (L20):

1. `conexus-review`: o cartão da 14 tinha a lacuna ("sem detalhe, não abre", critério 33), e a revisão
   conferiu o código contra o cartão. Lição: conferir cada estado da matriz contra o produto de
   referência (Factory, OS) e cada ferramenta do conjunto fechado contra uma linha que abre.
2. `conexus-qa`: o roteiro rodou nos dublês, que só tocavam as ferramentas com tipo e só como
   Anthropic. Lição: a QA toca o conjunto fechado inteiro e o modelo inicial de produção (Gemini pelo
   CLIProxy).
3. O relatório ao vivo da 13 já dizia "Usou uma ferramenta" e não virou critério. Lição: um achado do
   ao vivo vira issue `next-card`.
