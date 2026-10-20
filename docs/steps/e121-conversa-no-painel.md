# Etapa 12.1: A conversa no painel

## A página do fundador

**No fim desta etapa** você conversa com o Builder num painel à direita do Projeto, como no Conexus
OS: vê ele pensar e cada coisa que faz numa frase, escolhe modelo e raciocínio, e a aba que cai
continua do ponto certo.

**O roteiro de uso.** Empresa A, com as contas da 12.

1. Como **Ana**, abra "Encomendas": à esquerda a aba **Prévia**, "Ainda não há uma prévia
   disponível. Descreva o aplicativo para começar."; à direita a conversa, com **Nova conversa** no
   topo; a barra da empresa vira ícones. Na aba **Projeto**, Sobre e Versões.
2. No botão do modelo do compositor, **Claude Sonnet 4.5** e **Raciocínio: Alto**. Pergunte "Compare
   dois apps de encomenda de padaria da internet": o logo se mexe, "Builder trabalhando · há 12 s";
   "Pensando…" vira "Pensou por 9 s" (recarregado, só "Pensou"); três ou mais ferramentas viram
   "Leu 3 páginas, pesquisou 1 vez", que abre.
3. Feche a aba no meio da resposta e abra de novo: ela segue de onde estava, sem repetir texto.
4. Pela caixa do topo, abra outra conversa e volte: o rascunho que você deixou continua lá.
5. No celular (390 px), troque **App | Conversa**; mude para o tema escuro.
6. Pause a Time 1 e pergunte: o aviso de contas indisponíveis **fica** no turno, também ao recarregar.

**O que você faz, e quando.** Os dois turnos reais pela assinatura Claude, "Desligado" e "Alto"
(critério 9), já autorizados: "Eu autorizo os dois turnos reais pela assinatura Claude". No começo:
aprova esta página. No fim: faz o roteiro, diz o que viu e aprova os textos das telas.

**As suas respostas de 2026-10-19.** R1 b: o servidor da 12 fica; o stream ganha pensamento,
ferramentas, estado do turno e sequência. R2 b: o turno durável é da 13. R3 a: as peças de chat do
shadcn; o `playground-ui` só como modelo. P1 a P6: A. Estudo da estrutura das telas: "Aprovado tudo".

**Fica de fora.** Prévia (14); "Código", "Alterações", aprovações, turno durável (13);
microfone (P4); anexar e comandos `/`. A moldura, o Início, as Configurações e a primeira entrada
são da etapa 12.2, "A casa": a 12.1 não mexe na barra da empresa além de encolhê-la no Projeto. O teto de passos por turno (A6) e o caminho do rastro (Z1) seguem abertos
com você, para o cartão da 13. Issues `next-card` 25, 39 e 45: outras pastas.

**O Projeto, como o estudo aprovado diz.** A área grande tem as abas Prévia, Código, Alterações e
**Projeto**, cada uma só quando a sua etapa existe: na 12.1, Prévia e Projeto. A aba Projeto tem as
seções **Sobre** (nome, data, endereço, Excluir) e **Versões** (a página de hoje `…/settings`, que sai).
A linha do topo nasce com três lugares à direita, Versão, **Abrir app** e Publicar; na 12.1 só
**Abrir app** aparece, nada "em breve".

**A decisão sua pedida nesta etapa.** Nenhuma.

## As unidades

Cada unidade de tela nomeia a captura do Conexus OS (estudo da 12.1, fora do repositório) que iguala.

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | O contrato do stream e o projetor | `hub-api`, `builder/conversation/` (servidor), `platform/` (servidor), `live.ts` e `use-live.ts` da tela | segurança | mastra, fastify-best-practices | — |
| U2 | O raciocínio que chega ao modelo | `hub-api`, `builder/model-accounts/` e `sessions.ts` (servidor) | segurança | mastra | U1 |
| U3 | As peças de chat e a marca trabalhando | `apps/web/src/ui/`, `brand/`, `package.json` | design | shadcn | — |
| U4 | O Projeto em duas regiões | `routes/…/projects/`, `builder/conversation/` (tela), `hub/projects/` | web | shadcn | U3 |
| U5 | A conversa: turnos, pensamento, ferramentas | `builder/conversation/` (tela) | design | shadcn | U1, U4 |
| U6 | O compositor, o modelo e o raciocínio | `builder/conversation/`, `builder/model-accounts/` (tela) | design | shadcn | U2, U5 |
| U7 | Percurso, capturas, prova ao vivo, registro | `tests/e2e/`, `apps/web/*.test.ts`, `docs/decisions/` | testes | — | U6 |

U1 e U3 em paralelo, depois U2 e U4 (não dividem pasta). Sem checagem nova.

**Orçamento de código alterado** (sem testes nem gerados; as peças copiadas contam): U1 750; U2 400;
U3 850 (cerca de 650 copiados); U4 550 (as seções, o topo, a barra encolhida); U5 600; U6 400; U7 80.
Total **3.630**, teto 4.000 (L2).

## O contrato do stream

Dono: `hub-api/src/conversations.ts` (C28, C45). Os estados seguem o `displayState` do controller
(`ActiveToolState.status`, 1.78.0), para a 13 não inventar outro vocabulário.

| Parte de `MessagePart` | Campos | O que a pessoa vê | O que nunca sai do servidor |
| --- | --- | --- | --- |
| `text` | `text` | o Markdown aos poucos | — |
| `reasoning` | `id`, `state: running \| completed`, `seconds: int \| null` | "Pensando…" com brilho; "Pensou por 9 s", que não abre (P2 A) | o texto do pensamento (`reasoning-delta`), V39 |
| `tool` | `id` (o `toolCallId`), `kind: read_page \| search_web \| recall \| other`, `state: running \| completed \| error`, `subject: {url, title} \| {query} \| null` | a frase do `kind`: "Lendo uma página" › "Leu uma página" | `args`, `result`, a mensagem de erro da ferramenta (C51, S9) |
| `notice` | `text` | o aviso da fila, um `Marker` | — |
| `failure` | `code: TurnFailureCode` | a frase do código (C48), um `Marker` de erro que **fica** | o texto do fornecedor (C51) |

`page` vira `tool` `read_page`. `subject` é um campo analisado (C27): `url` por `z.url()`, `title`
e `query` cortados em 200 caracteres; `kind` vem do nome da ferramenta por uma tabela, nunca por
expressão sobre o nome (C26); ferramenta desconhecida é `other`, "Usou uma ferramenta". `Message`
ganha `model: ModelId | null`, de `message.content.metadata.modelId` do Mastra.

`ConversationEvent`: `turn {message, startedAt}` (o retrato), `text {delta}`, `part {part}` (uma parte
com `id` substitui a de mesmo `id`; as outras entram no fim), `notice`, `title`, `turnEnd {reason}`.
O evento `failure` sai: a falha vira parte, antes do `turnEnd`.

**Sequência e reconexão.** Cada evento sai com `id: <turno>.<n>` (SSE). O id é opaco e não é
autoridade. A tela guarda o último e o manda em `Last-Event-ID` ao reabrir. Mesmo turno em curso e
`n` conhecido: só os eventos depois dele. Outro turno, id desconhecido ou estragado, ou acima do
limite de eventos guardados do turno (uma constante nomeada pelo construtor): o retrato `turn`, como
hoje. Turno acabado: nada, e a tela relê. O registro vive na memória do turno; o turno durável é da 13.

**O que a 13 acrescenta, sem renomear.** `kind` ganha as ferramentas de arquivo e comando; partes
`approval {id, toolId, state: pending | approved | declined}` (de `tool_approval_required` e
`pendingApprovals`), `shell {toolId, lines}` (de `shell_output`, com o filtro de segredos da 13) e
`file {path, operation}` (de `modifiedFiles`); `tool.state` ganha `denied` (`tool_end.denied`).

## Os critérios de aceite

Servidor: `npm run test -w @conexus/server`. Tela: `npm run test -w @conexus/web`.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Turno com `web_search` e três `web_fetch` (dublê): `reasoning` running › completed com `seconds`; um `tool` por chamada, running › completed | `conversation-stream.test.ts`, pela rota de eventos | must |
| 2 | U1 | `args`, `result`, pensamento e erro da ferramenta plantados: fora do stream, do `readConversation` e do log (C51, S41) | idem | must |
| 3 | U1 | `isError`: `state: error`, sem o texto; ferramenta desconhecida: `other` | idem | must |
| 4 | U1 | Reconectar com `Last-Event-ID` do turno em curso: só o que faltou, sem repetir `text`; id de outro turno, estragado ou de outra conversa: o retrato, nunca evento alheio (S10); turno acabado: nada | idem | must |
| 5 | U1 | Recarregar: `reasoning` e `tool` relidos na ordem, `model` do turno; sem `seconds` depois de relido | `conversation.test.ts`, `readConversation` | must |
| 6 | U1 | Falha do turno (contas acabadas; 400): parte `failure` antes do `turnEnd`, e relida depois de recarregar | idem | must |
| 7 | U2 | `listModelProviders`: cada modelo com os níveis que aceita; sem dado do Mastra: só "Desligado" | `providers.test.ts` | must |
| 8 | U2 | "Alto": o dublê da Anthropic recebe `thinking` com o orçamento; "Desligado": recebe `disabled`; nível que o modelo não aceita: 422 `EFFORT_UNSUPPORTED`; troca durante um turno vale para o próximo (V54) | `conversations.test.ts`, `test-anthropic.ts` | must |
| 9 | U2 | **Ao vivo**, assinatura Claude: "Alto" traz `reasoning` no stream; "Desligado" não traz | firstmate, autorizado (T14) | must |
| 10 | U2 | Nível relido após reiniciar o Hub | `conversations.test.ts` | must |
| 11 | U3 | As peças sob a CSP: nenhum erro nem violação no console, arrastar o divisor incluído | `layout.test.ts` (T23) | must |
| 12 | U3 | A marca trabalhando se mexe; com `prefers-reduced-motion`, parada (V26) | `layout.test.ts` | must |
| 13 | U4 | Projeto: abas Prévia e Projeto (Sobre, Versões; `/settings` dá "não encontrado"), **Abrir app** no topo só com endereço, conversa à direita, divisor de 320 px a 60 % lembrado; aba e seção no endereço (W18); a barra da empresa encolhe para ícones no Projeto e volta ao sair | `workbench.test.tsx`, `layout.test.ts` | must |
| 14 | U4 | 390 px: "App \| Conversa", as duas montadas; trocar não perde rascunho nem rolagem | idem | must |
| 15 | U4 | A caixa do topo lista as conversas da pessoa e cria **Nova conversa** com a chave de tentativa (W24); trocar de conversa e voltar guarda o rascunho (na aba); conversa de outra pessoa ou Projeto: "não encontrado" (S10) | `panel.test.tsx` | must |
| 16 | U5 | Uma ou duas ferramentas são linhas; três ou mais seguidas dobram numa linha "Leu 3 páginas, pesquisou 1 vez" que abre; texto ou pensamento quebra a sequência | `fold.test.ts` (função pura), `transcript.test.tsx` | must |
| 17 | U5 | Grupo rodando: "Lendo uma página · 2/4", aberto; "Pensando…" só até o primeiro conteúdo | `transcript.test.tsx` | must |
| 18 | U5 | Turno do Builder: marca, "Conexus", modelo; da pessoa: bolha à direita, hora | idem | must |
| 19 | U5 | "Builder trabalhando · há 1 min 05 s" desde o `startedAt` do servidor, também após reconectar | idem | must |
| 20 | U5 | Rolagem segue o fim; quem sobe não é puxado (V54); "Ir ao fim" | idem | must |
| 21 | U6 | Enter envia, Shift+Enter quebra; Enviar vira Parar; envio recusado devolve o texto (W24); anel ipê só enquanto trabalha (V5) | `composer.test.tsx` | must |
| 22 | U6 | Um botão com o modelo abre busca, grupos por fornecedor e "Raciocínio" com os níveis do modelo; modelo sem nível: sem a seção; o mesmo seletor serve o modelo padrão da 11 | `composer.test.tsx`, `model-accounts.test.tsx` | must |
| 23 | U6 | Teclado inteiro: Tab, setas, Esc devolve o foco ao botão (V30); nomes em português (V31) | `keyboard.test.ts` | must |
| 24 | U7 | O roteiro, Hub real, fornecedor dublê | `tests/e2e/conversation.test.ts` | must |
| 25 | U7 | Critério 23 da 12: 390 px, 200 %, dois temas, sem rolagem lateral nem CSP | `layout.test.ts`, `sweep.test.ts` | must |
| 26 | U7 | Capturas nova e antiga lado a lado, 1280 e 390 px, claro e escuro, por estado | o pull request, olhadas (T23) | must |
| 27 | U7 | Publicado: o roteiro | firstmate, fundador (L17) | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Prévia | a do vazio | "Ainda não há uma prévia disponível. Descreva o aplicativo para começar." | — | — | — | — | — |
| Projeto, Sobre | — | a de hoje | a partilhada | a de `ui/` | a do Projeto | Excluir, com quem pode (V29) | — |
| Projeto, Versões | — | a de hoje | a partilhada | a de `ui/` | a do Projeto | a lista, com quem muda (V29) | a de hoje |
| Caixa de conversas | — | "Nenhuma conversa", **Nova conversa** | a partilhada | a de `ui/` | — | — | — |
| Conversa | foco no compositor | "Descreva o aplicativo que você quer criar."; sem conta: o aviso da 11 | "Pensando…", **Parar** | `failure` que fica | a do Projeto | — | avisos da fila |
| Seletor | — | modelos com conta | idem | "Não confirmamos a troca…" | — | — | `EFFORT_UNSUPPORTED` |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `reasoning.{state, seconds}` | o projetor (relógio do servidor) | linha do pensamento |
| `tool.{kind, state, subject}` | o projetor | linha e grupo |
| `failure.code` | `endTurn`; o fio, relido | `Marker` de erro |
| `Message.model` | o Mastra (`metadata.modelId`) | cabeçalho do turno |
| `turn.startedAt` | o projetor | linha "trabalhando" |
| id de evento | `sendEvents` | `use-live.ts`, no `Last-Event-ID` |
| `Conversation.effort`, `setConversationModel.effort` | a pessoa, pela sessão | seletor; `accountPick` |
| `Provider.models[].efforts` | `providers.ts`, de `getModelReasoningOptions` | seletor |

## A tabela de falhas

| Gravação ou comando | Duas vezes | Recusada no meio | Dependência fora | Imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `setConversationModel` com o nível | estado final | um `switch` leva os dois | 503 | `CONVERSATION_MODEL_SET` | 8, 10 |
| Falha do turno no fio (`conexus.turnFailures`) | idempotente pelo id | o turno acaba; relido sem ela | log escalar; a tela, ao vivo | `CONVERSATION_TURN_ENDED` com o código | 6 |
| Opções do fornecedor por passo (`accountPick`) | uma por tentativa | — | a fila da 12 | — | 8 |
| Reabrir o stream com `Last-Event-ID` | sem escrita | — | — | — | 4 |

## O que nasce novo e o que é trazido

| Parte | Nativo, trazido ou nosso | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Rolagem, linha, bolha, avisos | nativo: `message-scroller`, `message`, `bubble`, `marker` (shadcn, base) | `ui/` | `cn` pelo `ui/cn.ts`; ícones `lucide-react` | — |
| Pensamento e ferramentas | nativo: `trace` (shadcn #12307) e `shimmer` | `ui/trace.tsx`, `brand/tokens.css` | o bloco `shimmer` copiado (MIT), sem o pacote | — |
| Compositor, divisor, abas, menus | nativo: `input-group`, `resizable` (`react-resizable-panels` 4, `autoSaveId`), `tabs`, `combobox`, `dropdown-menu`, `collapsible`, `tooltip` | `ui/` | — | — |
| Níveis por modelo | nativo: `getModelReasoningOptions` (`@mastra/core/llm`, dado estático) | `model-accounts/providers.ts` | — | — |
| Nível ao fornecedor | trazido do Mastra Code (`code-sdk` 1.14.0 `thinking.ts`, Apache-2.0) | `model-accounts/thinking.ts` | só Anthropic, Google e OpenAI | orçamentos de 4.096 a 24.576 tokens, do Mastra Code |
| Dobra a partir de 3 | trazido como regra: `TOOL_GROUP_MIN = 3` (`playground-ui` `group-consecutive.ts`, Apache-2.0) e o antigo | `conversation/fold.ts` | função pura nossa | 3; o que espera resposta quebra a sequência |
| Frases por ferramenta, rótulos do nível | trazido o texto: `tool-sentences.ts`, `reasoning-labels.ts` | `conversation/tool-text.ts` | por `kind`, não por expressão | as frases e os rótulos aprovados |
| Marca trabalhando | trazido o movimento (`packages/brand/src/tokens.css:120-131`) | `brand/mark.tsx` | `motion-safe` | o Encaixe (design, Motion) |
| Painel à direita, troca no celular, anel | trazido o desenho: `construir.tsx:399-417`, `construir.css:86,150-166`, `composer.css:19-68` | `conversation/workbench.tsx`, `composer.tsx` | tokens, sem px soltos nem `style` (V3, V17, V22) | 380 px, 320 px a 60 %; "App \| Conversa" |
| Linha "trabalhando" | trazido o texto e o desenho: `working-state.tsx` | `conversation/working-line.tsx` | o tempo vem do servidor | — |
| Projetor e sequência | nosso | `conversation/live.ts`, `parts.ts` | — | o `displayState` leva `args` crus e não guarda falha |

**A medida do transplante.** Do antigo, só desenho, textos e duas regras: o código (4.738 linhas sobre
`playground-ui` 55) mudaria mais de um terço, é novo (`conexus-study`, passo 5).

**A dívida.** O tempo do pensamento some ao recarregar. A razão da 0050 (dono na URL) é fraca: C51 e
C37, no fechamento.

## U1 O contrato do stream e o projetor

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/conversations.ts`, `operation.ts` | partes, eventos, ids; `resumable` | servidor, web, OpenAPI |
| `server/src/platform/event-stream.ts`, `http.ts` | a linha `id:`; o `Last-Event-ID` ao handler | toda operação de eventos (só a conversa hoje) |
| `server/src/builder/conversation/live.ts`, `parts.ts`, `history.ts`, `sessions.ts`, `routes.ts` | o projetor, o registro do turno, a releitura | `main.ts`, testes da conversa |
| `web/src/builder/conversation/live.ts`, `use-live.ts`, `test-hub.tsx`; `web/src/platform/hub.ts` (`hubEvents` lê `id:` e manda o cabeçalho) | o redutor por `id`; o `Last-Event-ID` | a tela (U5), `hub.test.ts` |
| `server/src/platform/test-anthropic.ts`, `conversation/test-conversation.ts` | o dublê emite pensamento e grava o corpo | testes |

### Os contratos que a unidade cria

As partes e eventos acima. `Operation.success` de eventos ganha `resumable?: true`, que declara o cabeçalho `Last-Event-ID` como
`ATTEMPT_KEY_HEADER` declara o seu (C28): o iterável dá `{id: string; event}`, `sendEvents` escreve
`id:`, e o handler recebe `lastEventId: string | null`.
`TURN_FAILURES_KEY = 'conexus.turnFailures'`: `{after: MessageId; code: TurnFailureCode}[]` no fio, como
`QUESTION_KEY`.

### A ordem do trabalho

1. Provar com o dublê, pela rota, que o `recall` devolve `reasoning`, `tool-invocation` e
   `metadata.modelId` (lido, não rodado); se não, o critério 5 volta ao cartão (L7). Funções: `@mastra/core@1.78.0` `AgentControllerEvent`
   (`message_update` `reasoning-delta` e `part`, `tool_start`, `tool_end`; `types.d.ts:623-952`).
2. Contrato. Regras: C27, C28, C45, C51, V39, S9.
3. Projetor e registro do turno: o relógio do pensamento vai do primeiro `reasoning` à primeira parte
   seguinte. Regras: C26, C57, S10, S41.
4. Tela: o redutor substitui por `id`; guarda o último id. Regras: W9, C26.

### Como se prova

Critérios 1 a 6, pela rota de eventos e por `readConversation`, com o dublê (T5, T6).

## U2 O raciocínio que chega ao modelo

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `hub-api/src/conversations.ts`, `model-accounts.ts`, `conversation-failures.ts` | `Effort`; `effort` em `Conversation` e em `setConversationModel`; `Provider.models: {id, efforts}[]`; `EFFORT_UNSUPPORTED` | servidor, web (telas da 11 também) |
| `server/src/builder/model-accounts/thinking.ts` (novo), `providers.ts`, `processors.ts`, `turn.ts`, `routes.ts`, `public.ts`, `claude/subscription-model.ts` | níveis por modelo; opções do fornecedor | `accountPick`, `listModelProviders`, rotas da conversa |
| `web/src/builder/model-accounts/` (quem lê `Provider.models`), `routes/…/setup.tsx`, `model-account.tsx`, `apps/web/sweep-replies.ts` | o modelo vira `{id, efforts}` | telas da 11 |
| `server/src/builder/conversation/sessions.ts` | `session.model.switch(model, {thinkingLevel})` | `routes.ts` |

### Os contratos que a unidade cria

`Effort = 'off' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'` (o `AgentControllerThinkingLevel`).
`setConversationModel` `PUT I/model` `{model, effort}`: 200 `{model, effort}`; 422 `MODEL_UNKNOWN`,
`MODEL_NO_ACCOUNT`, `EFFORT_UNSUPPORTED` (`USER`, "Este modelo não aceita esse nível de raciocínio.").
`effortsOf(model: ModelId): Effort[]`; `providerOptionsOf(model: ModelId, effort: Effort):
ProviderOptions | undefined`. `Turn` leva o nível lido no envio (V54).

### A ordem do trabalho

1. Níveis: `getModelReasoningOptions` (`@mastra/core/llm`; `[]` ou `undefined`: só `off`) e a regra do
   Mastra Code (`requestableReasoningOptions`, níveis de mesmo orçamento juntos). Regra: C75.
2. Tradução no `accountPick` (`processors.ts`): `processInputStep` devolve `providerOptions`, mesclado
   com `args.providerOptions` (a soma do Mastra é rasa, `composeStepInput`). Anthropic, assinatura
   incluída: `thinking {type: 'enabled', budgetTokens}`, ou `effort` nos modelos que o Mastra lista com
   `effort`, como o Mastra Code; Google: `thinkingConfig`; OpenAI:
   `reasoningEffort`. Regras: C26, S41.
3. Sessão: o nível por `session.model.switch`, guardado pelo Mastra com o modelo; lido de
   `session.state.get().thinkingLevel` por `Effort` (C27).

### Como se prova

7, 8, 10 com o dublê; 9 ao vivo, autorizado na página.

## U3 As peças de chat e a marca trabalhando

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `web/src/ui/` `message-scroller`, `message`, `bubble`, `marker`, `trace`, `input-group`, `resizable`, `tabs`, `combobox`, `collapsible`, `tooltip`, `popover` | cria | U4 a U6 |
| `web/src/brand/tokens.css`, `mark.tsx` | `shimmer`; o Encaixe trabalhando, com tamanho | `ui/frame.tsx`, U5 |
| `apps/web/package.json`, `package-lock.json` | `@shadcn/react` 0.3.1, `react-resizable-panels` 4.14.6 (L16) | build |

### A ordem do trabalho

1. Copiar uma vez, estilo `base`, por `npx shadcn add`; sem `code-block` nem `shiki`. Regras: W21, W22, V22, V23, 0033.
2. `shimmer` e a marca: V3, V5, V26.
3. Olhar sob a CSP (`apps/edge/src/headers.ts`, só lida): o `react-resizable-panels` usa
   `adoptedStyleSheets` (não provado); recusado, a peça volta ao cartão (L7), a CSP não muda. Regras:
   W22, T23.

### Como se prova

11, 12. Captura: `old-10-logo-sequencia.png`.

## U4 O Projeto em duas regiões

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `routes/…/projects/$projectId.tsx`, `.index.tsx`, `.conversations.$conversationId.tsx` (de `conversations_`) | muda, cria; `.conversations.tsx` e `.settings.tsx` saem | `routeTree.gen.ts` |
| `web/src/ui/frame.tsx` | só encolher para ícones no Projeto (o resto é da 12.2) | `_app/route.tsx` |
| `web/src/builder/conversation/workbench.tsx`, `stage.tsx`, `panel.tsx`, `conversation-switch.tsx`, `public.ts` | cria | as rotas |
| `web/src/hub/projects/tabs.tsx`, `project.tsx`, `settings.tsx` | `tabs.tsx` sai; os outros viram as seções Sobre e Versões; **Abrir app** sobe ao topo | as rotas |
| `tests/e2e/conversation-journey.ts`, `hub-window.ts`, `live-hub.ts`; `apps/web/sweep-*.ts` | o caminho novo; os estados | `npm run e2e`, `sweep.test.ts` |

### A ordem do trabalho

A rota compõe a área e o painel pelos dois `public.ts` (W4, W6); `validateSearch` com `lens:
'preview' | 'project'` e `section: 'about' | 'versions'` (W18); `loader` (W17); `getRouteApi` (W8). Captura: `old-01`,
`old-11-vazio-claro.png`, `old-14-estreito-claro.png`.

### Como se prova

13 a 15.

## U5 A conversa

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `web/src/builder/conversation/transcript.tsx`, `person-turn.tsx`, `builder-turn.tsx`, `thinking-line.tsx`, `tool-row.tsx`, `tool-group.tsx`, `working-line.tsx`, `fold.ts`, `tool-text.ts`, `text.ts`; `conversation.tsx`, `conversations.tsx` saem | cria, muda, apaga | `panel.tsx` |

### Os contratos que a unidade cria

`fold(parts: readonly MessagePart[]): Row[]`, `Row = {kind: 'part'; part} | {kind: 'group'; tools:
ToolPart[]}`; `sentenceOf(tool: ToolPart): string`; `summaryOf(tools: ToolPart[]): string`.

### A ordem do trabalho

Regras: C26, C77, V35, V39, V54. Captura: `old-03`, `old-08`, `old-09`, `old-12` (`…-claro.png`).

### Como se prova

16 a 20; casos do antigo com msw (`builder.browser.test.mjs:1491, 1519, 1537`).

## U6 O compositor, o modelo e o raciocínio

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `web/src/builder/conversation/composer.tsx`, `model-choice.tsx`, `queries.ts` | muda | `panel.tsx` |
| `web/src/builder/model-accounts/choice.tsx`, `model-picker.tsx`, `default-model.tsx`, `public.ts` | um seletor para os dois (C26) | telas da 11 |

### A ordem do trabalho

Regras: W23, W24, V5, V29 a V31, V54. Captura: `old-04-compositor.png`, `old-05-seletor-de-modelo.png`,
`old-10b-anel-do-compositor-1.png`; sem microfone, anexar nem `/` (P4 A).

### Como se prova

21 a 23.

## U7 Percurso, capturas, prova ao vivo, registro

A 0033 ganha o resultado: as peças de chat do shadcn. 24 a 26: `npm run e2e`, `npm run
test -w @conexus/web`; 9 e 27: após o Release (T14, L17).
