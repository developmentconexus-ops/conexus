# Etapa 12.1: A conversa no painel

## A página do fundador

**No fim desta etapa** você abre um Projeto e conversa com o Builder num painel à direita, como no
Conexus OS: vê ele pensar, vê cada coisa que ele faz numa frase, escolhe o modelo e o raciocínio no
compositor, e a conversa continua do ponto certo quando a aba cai.

**O roteiro de uso.** Empresa A, a assinatura Claude e a conta Google da 12.

1. Como **Ana**, abra "Encomendas": à esquerda a área grande, aba **Prévia**, com "Ainda não há uma
   prévia disponível. Descreva o aplicativo para começar."; à direita a conversa, com a caixa
   **Nova conversa** no topo.
2. No botão do modelo do compositor, **Claude Sonnet 4.5** e **Raciocínio: Alto**. Pergunte "Compare
   dois apps de encomenda de padaria da internet": o logo se mexe, "Builder trabalhando · há 12 s";
   "Pensando…" brilha e vira "Pensou por 9 s"; as páginas lidas aparecem em frases; três ou mais
   viram uma linha "Leu 3 páginas, pesquisou 1 vez", que abre. Ao recarregar, fica só "Pensou": o
   Mastra não guarda o tempo.
3. Feche a aba no meio da resposta e abra de novo: ela segue de onde estava, sem repetir texto.
4. Pela caixa do topo, abra outra conversa e volte: o rascunho que você deixou continua lá.
5. No celular (390 px), troque **App | Conversa**; mude para o tema escuro.
6. Pause a Time 1 e pergunte de novo: o aviso "As contas Anthropic… estão indisponíveis" **fica** no
   turno depois que ele acaba, e depois de recarregar.

**O que você faz, e quando.** Antes de U2: autoriza dois turnos reais pela assinatura Claude, um em
"Desligado" e um em "Alto", para provar que o raciocínio chega ao modelo (critério 9). No começo:
aprova esta página. No fim: faz o roteiro, diz o que viu e aprova os textos das telas.

**As suas respostas de 2026-10-19.** R1 b: o servidor da 12 fica; o stream ganha pensamento,
ferramentas, estado do turno e sequência. R2 b: o turno durável é da 13. R3 a: as peças de chat do
shadcn; o `playground-ui` só como modelo. P1 a P6: A.

**Fica de fora.** A Prévia de verdade e "Alterações" (14); "Código" (13); microfone (P4); anexar e
comandos `/` (sem etapa); cartões de pergunta e aprovação (13, quando houver ferramenta que espera);
o turno durável (R2 b). O teto de passos por turno (A6) e o caminho do rastro (Z1) seguem abertos
com você, para o cartão da 13. Issues `next-card` 25, 39 e 45: outras pastas.

**A decisão sua pedida nesta etapa: onde fica o que hoje é a aba "Projeto"** (nome, data, endereço,
"Abrir app", "Configurações", "Excluir"). **A.** Uma aba **Sobre** na área grande, ao lado da Prévia,
como no Conexus OS (`old-02-aba-sobre-claro.png`). **B.** Uma página à parte, aberta pelo nome do
Projeto. Exemplo de A: Ana clica em **Sobre** e vê "Criado em 12/10/2026" e **Abrir app** sem perder a
conversa. **Recomendação: A**: tudo do Projeto fica num lugar, e a conversa não some.

## As unidades

A barra visual: as capturas do Conexus OS (`e0353c36`) do estudo da 12.1, fora do repositório (L21);
cada unidade de tela nomeia a sua.

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | O contrato do stream e o projetor | `hub-api`, `builder/conversation/` (servidor), `platform/` (servidor), `live.ts` e `use-live.ts` da tela | segurança | mastra, fastify-best-practices | — |
| U2 | O raciocínio que chega ao modelo | `hub-api`, `builder/model-accounts/` e `sessions.ts` (servidor) | segurança | mastra | U1 |
| U3 | As peças de chat e a marca trabalhando | `apps/web/src/ui/`, `brand/`, `package.json` | design | shadcn | — |
| U4 | O Projeto em duas regiões | `routes/…/projects/`, `builder/conversation/` (tela), `hub/projects/` | web | shadcn | U3 |
| U5 | A conversa: turnos, pensamento, ferramentas | `builder/conversation/` (tela) | design | shadcn | U1, U4 |
| U6 | O compositor, o modelo e o raciocínio | `builder/conversation/`, `builder/model-accounts/` (tela) | design | shadcn | U2, U5 |
| U7 | Percurso, capturas, prova ao vivo, registro | `tests/e2e/`, `apps/web/*.test.ts`, `docs/decisions/` | testes | — | U6 |

U1 e U3 em paralelo, depois U2 e U4 (não dividem pasta). Nenhuma checagem nova. Uma revisão, um
merge (L9, L13).

**Orçamento de código alterado** (sem testes nem gerados; as peças copiadas contam): U1 750; U2 400;
U3 850 (cerca de 650 copiados); U4 450; U5 600; U6 400; U7 80. Total **3.530**, teto 4.000 (L2). Base: a tela da conversa (909 linhas) sai quase inteira; `live.ts`, `parts.ts`, `history.ts` (299)
mudam.

## O contrato do stream

Dono: `hub-api/src/conversations.ts` (C28, C45). Os estados seguem o `displayState` do controller
(`ActiveToolState.status`, 1.78.0), para a 13 não inventar outro vocabulário.

| Parte de `MessagePart` | Campos | O que a pessoa vê | O que nunca sai do servidor |
| --- | --- | --- | --- |
| `text` | `text` | o Markdown aos poucos | — |
| `reasoning` | `id`, `state: running \| completed`, `seconds: int \| null` | "Pensando…" com brilho; depois "Pensou por 9 s", que não abre (P2 A); sem `seconds`, "Pensou" | o texto do pensamento (`reasoning-delta`), V39 |
| `tool` | `id` (o `toolCallId`), `kind: read_page \| search_web \| recall \| other`, `state: running \| completed \| error`, `subject: {url, title} \| {query} \| null` | uma frase por `kind`: "Lendo uma página" › "Leu uma página"; `error`: "Não conseguiu ler a página" | `args`, `result`, a mensagem de erro da ferramenta (C51, S9) |
| `notice` | `text` | o aviso da fila, um `Marker` | — |
| `failure` | `code: TurnFailureCode` | a frase do código (C48), um `Marker` de erro que **fica** | o texto do fornecedor (C51) |

`page` sai: vira `tool` `read_page`. `subject` é um campo analisado (C27): `url` por `z.url()`, `title`
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
hoje. Turno acabado: nada, e a tela relê a conversa. O registro vive na memória do turno e some no
`turnEnd`; sobreviver a uma reinicialização é da 13 (R2 b).

**O que a 13 acrescenta, sem renomear.** `kind` ganha as ferramentas de arquivo e comando; partes
`approval {id, toolId, state: pending | approved | declined}` (de `tool_approval_required` e
`pendingApprovals`), `shell {toolId, lines}` (de `shell_output`, com o filtro de segredos da 13) e
`file {path, operation}` (de `modifiedFiles`); `tool.state` ganha `denied` (`tool_end.denied`).

## Os critérios de aceite

Servidor: `npm run test -w @conexus/server`. Tela: `npm run test -w @conexus/web`.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Turno com `web_search` e três `web_fetch` (dublê): `reasoning` running › completed com `seconds`, um `tool` por chamada, running › completed | `conversation-stream.test.ts`, pela rota de eventos | must |
| 2 | U1 | `args`, `result`, pensamento e erro da ferramenta plantados: fora do stream, do `readConversation` e do log (C51, S41) | idem | must |
| 3 | U1 | Ferramenta com `isError`: `state: error`, sem o texto; ferramenta desconhecida: `other` | idem | must |
| 4 | U1 | Reconectar com `Last-Event-ID` do turno em curso: só o que faltou, sem repetir `text`; id de outro turno, estragado ou de outra conversa: o retrato, nunca evento alheio (S10) | idem | must |
| 5 | U1 | Recarregar: `reasoning` e `tool` relidos na ordem, `model` do turno; sem `seconds` depois de relido | `conversation.test.ts`, `readConversation` | must |
| 6 | U1 | Falha do turno (contas acabadas; 400): parte `failure` antes do `turnEnd`, e relida depois de recarregar | idem | must |
| 7 | U2 | `listModelProviders`: cada modelo com os níveis que aceita; sem dado do Mastra: só "Desligado" | `providers.test.ts` | must |
| 8 | U2 | "Alto": o dublê da Anthropic recebe `thinking` com o orçamento; "Desligado": não recebe; nível que o modelo não aceita: 422 `EFFORT_UNSUPPORTED`; troca durante um turno vale para o próximo (V54) | `conversations.test.ts`, `test-anthropic.ts` | must |
| 9 | U2 | **Ao vivo**, assinatura Claude: "Alto" traz `reasoning` no stream; "Desligado" não traz | firstmate, autorizado (T14) | must |
| 10 | U2 | Nível relido após reiniciar o Hub | `conversations.test.ts` | must |
| 11 | U3 | As peças sob a CSP: nenhum erro nem violação no console, arrastar o divisor incluído | `layout.test.ts` (T23) | must |
| 12 | U3 | A marca trabalhando se mexe; com `prefers-reduced-motion`, parada e inteira (V26) | `layout.test.ts` | must |
| 13 | U4 | Projeto: área grande à esquerda (abas Prévia, Sobre), conversa à direita, divisor de 320 px a 60 %, largura lembrada no navegador; aba no endereço (W18) | `workbench.test.tsx`, `layout.test.ts` | must |
| 14 | U4 | 390 px: "App \| Conversa", as duas montadas; trocar não perde rascunho nem rolagem | idem | must |
| 15 | U4 | A caixa do topo lista as conversas da pessoa e cria **Nova conversa** com a chave de tentativa (W24); conversa de outra pessoa ou Projeto: a página "não encontrado" do Projeto (S10) | `panel.test.tsx` | must |
| 16 | U5 | Uma ou duas ferramentas são linhas; três ou mais seguidas dobram numa linha "Leu 3 páginas, pesquisou 1 vez" que abre; texto ou pensamento quebra a sequência | `fold.test.ts` (função pura), `transcript.test.tsx` | must |
| 17 | U5 | Grupo rodando: "Lendo uma página · 2/4", aberto; "Pensando…" só até o primeiro conteúdo | `transcript.test.tsx` | must |
| 18 | U5 | Turno do Builder: marca, "Conexus", o modelo do turno; da pessoa: bolha à direita com a hora | idem | must |
| 19 | U5 | "Builder trabalhando · há 1 min 05 s" desde o `startedAt` do servidor, também após reconectar | idem | must |
| 20 | U5 | Rolagem: segue o fim enquanto chega texto; quem sobe não é puxado (V54); "Ir ao fim" | idem | must |
| 21 | U6 | Enter envia, Shift+Enter quebra; Enviar vira Parar; envio recusado devolve o texto (W24); anel ipê só enquanto trabalha (V5) | `composer.test.tsx` | must |
| 22 | U6 | Um botão com o modelo abre busca, grupos por fornecedor e "Raciocínio" com os níveis do modelo; modelo sem nível: sem a seção; o mesmo seletor serve o modelo padrão da 11 | `composer.test.tsx`, `default-model` | must |
| 23 | U6 | Teclado inteiro: Tab, setas, Esc devolve o foco ao botão (V30); nomes em português (V31) | `keyboard.test.ts` | must |
| 24 | U7 | O roteiro, Hub real, fornecedor dublê | `tests/e2e/conversation.test.ts` | must |
| 25 | U7 | Critério 23 da 12: 390 px, 200 %, dois temas, sem rolagem lateral nem erro de CSP | `layout.test.ts`, `sweep.test.ts` | must |
| 26 | U7 | Capturas da tela nova ao lado da antiga, a 1280 e 390 px, claro e escuro, em cada estado da matriz | o pull request, olhadas (T23) | must |
| 27 | U7 | Publicado: o roteiro | firstmate, fundador (L17) | must |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- |
| Área grande, Prévia | "Ainda não há uma prévia disponível. Descreva o aplicativo para começar." | — | — | — | — |
| Área grande, Sobre | a de hoje | a partilhada | a de `ui/` | a do Projeto | — |
| Caixa de conversas | "Nenhuma conversa", **Nova conversa** | a partilhada | a de `ui/` | — | — |
| Conversa | "Descreva o aplicativo que você quer criar."; sem conta: o aviso da 11 | "Pensando…", marca trabalhando, **Parar** | `failure` que fica | a do Projeto | avisos da fila que ficam |
| Seletor | modelos com conta | idem | "Não confirmamos a troca…" | — | `EFFORT_UNSUPPORTED`: a frase |

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
| `setConversationModel` com o nível | estado final | o nível não muda o turno em curso | 503 | `CONVERSATION_MODEL_SET` | 8, 10 |
| Falha do turno no fio (`conexus.turnFailures`, ao lado de `QUESTION_KEY`) | idempotente pelo id da mensagem | o turno acaba igual; relido sem ela | log escalar; a tela mostra ao vivo | `CONVERSATION_TURN_ENDED` com o código | 6 |
| Opções do fornecedor por passo (`accountPick`) | uma por tentativa | — | a fila da 12 | — | 8 |
| Reabrir o stream com `Last-Event-ID` | sem escrita | — | — | — | 4 |

## O que nasce novo e o que é trazido

| Parte | Nativo, trazido ou nosso | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Rolagem, linha, bolha, avisos | nativo: `message-scroller`, `message`, `bubble`, `marker` do shadcn (base, 2026-06-26) | `ui/` | `cn` do npm trocado pelo `ui/cn.ts`; ícones pelo `lucide-react` | — |
| Pensamento e ferramentas | nativo: `trace` (`TraceLine`, `TraceCollapsible`, shadcn #12307, 2026-10-14) e `shimmer` | `ui/trace.tsx`, `brand/tokens.css` | o bloco `shimmer` de `shadcn/tailwind.css` copiado (MIT), sem o pacote | — |
| Compositor, divisor, abas, menus | nativo: `input-group`, `resizable` (`react-resizable-panels` 4, `autoSaveId`), `tabs`, `combobox`, `dropdown-menu`, `collapsible`, `tooltip` | `ui/` | — | — |
| Níveis por modelo | nativo: `getModelReasoningOptions` (`@mastra/core/llm`, dado estático) | `model-accounts/providers.ts` | — | — |
| Nível ao fornecedor | trazido do Mastra Code (`code-sdk` 1.14.0, `thinking.ts`, `providers/{anthropic,google}-thinking.ts`, Apache-2.0) | `model-accounts/thinking.ts` | só Anthropic, Google e OpenAI; o resto sai | orçamentos 4.096 a 24.576 tokens: o Mastra Code (o Mastra só guarda o nível) |
| Dobra a partir de 3 | trazido como regra: `TOOL_GROUP_MIN = 3` (`playground-ui` `group-consecutive.ts`, Apache-2.0) e o antigo | `conversation/fold.ts` | função pura nossa | 3; o que espera resposta quebra a sequência |
| Frases por ferramenta, rótulos do nível | trazido o texto: `tool-sentences.ts`, `reasoning-labels.ts` | `conversation/tool-text.ts` | por `kind`, sem expressão sobre o nome (o antigo casava "ask" em "task") | as frases e os rótulos aprovados |
| Marca trabalhando | trazido o movimento: `packages/brand/src/tokens.css:120-131` | `brand/mark.tsx` | classes `motion-safe`, como a chegada | o Encaixe (design, Motion) |
| Painel à direita, troca no celular, anel | trazido o desenho: `construir.tsx:399-417`, `construir.css:86,150-166`, `composer.css:19-68` | `conversation/workbench.tsx`, `composer.tsx` | tokens, sem px soltos nem `style` (V3, V17, V22) | 380 px, 320 px a 60 %; "App \| Conversa" |
| Linha "trabalhando" | trazido o texto e o desenho: `working-state.tsx` | `conversation/working-line.tsx` | o tempo vem do servidor | — |
| Projetor e sequência | nosso | `conversation/live.ts`, `parts.ts` | — | o `displayState` leva `args` e `result` crus, é zerado por turno e não guarda avisos nem falha; o Mastra não repete eventos ao vivo |

**A medida do transplante.** Nada é copiado do antigo: só desenho, textos e duas regras. O código
antigo (4.738 linhas sobre `playground-ui` 55) mudaria mais de um terço: é novo (`conexus-study`,
passo 5). Copiados de fontes nativas: as peças do shadcn (MIT) e os arquivos do Mastra Code (Apache-2.0),
com o aviso.

**A dívida.** "Pensou por N s" não sobrevive a recarregar: o Mastra não guarda o tempo (fica "Pensou"). A razão escrita da 0050 é a mais fraca (dono na
URL); as fortes, C51 e C37: para o fechamento.

## U1 O contrato do stream e o projetor

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/conversations.ts`, `operation.ts` | partes, eventos, ids; `resumable` | servidor, web, OpenAPI |
| `server/src/platform/event-stream.ts`, `http.ts` | a linha `id:`; o `Last-Event-ID` ao handler | toda operação de eventos (só a conversa hoje) |
| `server/src/builder/conversation/live.ts`, `parts.ts`, `history.ts`, `sessions.ts`, `routes.ts` | o projetor, o registro do turno, a releitura | `main.ts`, testes da conversa |
| `web/src/builder/conversation/live.ts`, `use-live.ts` | o redutor por `id`; o `Last-Event-ID` | a tela (U5) |

### Os contratos que a unidade cria

As partes e eventos acima. `Operation.success` de eventos ganha `resumable?: true`: o iterável dá
`{id: string; event}`, `sendEvents` escreve `id:`, e o handler recebe `lastEventId: string | null`.
`TURN_FAILURES_KEY = 'conexus.turnFailures'`: `{after: string; code: TurnFailureCode}[]` no fio, como
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
| `server/src/builder/model-accounts/thinking.ts` (novo), `providers.ts`, `processors.ts`, `turn.ts` | níveis por modelo; opções do fornecedor | `accountPick`, `listModelProviders` |
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
   incluída: `thinking {type: 'enabled', budgetTokens}`; Google: `thinkingConfig`; OpenAI:
   `reasoningEffort`. Regras: C26, S41.
3. Sessão: o nível por `session.model.switch`; lido de `session.state.get().thinkingLevel`, analisado
   por `Effort` (sem getter público; C27).

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

1. Copiar uma vez, estilo `base`, pelo `npx shadcn add` (chamada externa do construtor, autorizada pelo
   cartão); `code-block` e `shiki` ficam de fora. Regras: W21, W22, V22, V23, 0033.
2. `shimmer` e a marca. Regras: V3, V5, V26.
3. Olhar sob a CSP: o `react-resizable-panels` usa `adoptedStyleSheets` e `style` pelo CSSOM (não
   provado). Regras: W22, T23.

### Como se prova

11, 12. Captura: `old-10-logo-sequencia.png`.

## U4 O Projeto em duas regiões

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `routes/…/projects/$projectId.tsx`, `.index.tsx`, `.conversations.$conversationId.tsx` (de `conversations_`), `$projectId_.settings.tsx` | muda, cria; `$projectId.conversations.tsx` sai | `routeTree.gen.ts` |
| `web/src/builder/conversation/workbench.tsx`, `stage.tsx`, `panel.tsx`, `conversation-switch.tsx`, `public.ts` | cria | as rotas |
| `web/src/hub/projects/tabs.tsx`, `project.tsx` | `tabs.tsx` sai; `project.tsx` vira a aba Sobre | as rotas |
| `tests/e2e/conversation-journey.ts`, `hub-window.ts` | o caminho novo | `npm run e2e` |

### A ordem do trabalho

A rota compõe a área e o painel pelos dois `public.ts` (W4, W6); `validateSearch` com `lens:
'preview' | 'about'` (W18); leitura no `loader` (W17); `getRouteApi` (W8). A resposta B da página muda só esta unidade. Captura: `old-01`,
`old-11-vazio-claro.png`, `old-14-estreito-claro.png`, `old-14b-estreito-pagina-inteira.png`.

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

Regras: C26, C77, V35, V39, V54. Captura: `old-03-ferramentas-abertas-claro.png`,
`old-08-ferramentas-rodando-claro.png`, `old-09-pensando.png`, `old-12-erro-execucao.png`; o
"Pensou" de `old-03b` **não** abre (P2 A).

### Como se prova

16 a 20; os casos do antigo reescritos com msw (`builder.browser.test.mjs:1491, 1519, 1537`).

## U6 O compositor, o modelo e o raciocínio

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `web/src/builder/conversation/composer.tsx`, `model-choice.tsx`, `queries.ts` | muda | `panel.tsx` |
| `web/src/builder/model-accounts/choice.tsx`, `default-model.tsx`, `public.ts` | um seletor para os dois (C26) | telas da 11 |

### A ordem do trabalho

Regras: W23, W24, V5, V29 a V31, V54. Captura: `old-04-compositor.png`, `old-05-seletor-de-modelo.png`,
`old-10b-anel-do-compositor-1.png`; sem microfone, anexar nem `/` (P4 A).

### Como se prova

21 a 23.

## U7 Percurso, capturas, prova ao vivo, registro

A 0033 ganha o resultado (as peças de chat do shadcn em Base UI). 24 a 26: `npm run e2e`, `npm run
test -w @conexus/web`; 9 e 27: após o Release (T14, L17).
