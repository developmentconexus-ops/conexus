# Títulos das conversas

Trilho: desenho

Cartão curto, fora da ordem do roteiro. O pedido do fundador, em 2026-11-13: "Títulos A+C aprovado",
sobre a investigação de uma conversa que ficava como "Conversa de 12/11/2026, 21:47" em vez de ganhar
um nome. Lido em `main` `98db31a7`, com `@mastra/core` 1.82.0 e `@mastra/memory` 1.41.0. Referências:
Mastra `6e8dfcb8` (`mastra-1.82`, com o Mastra Code e o Factory em `mastracode/`). A correção entra só
no código compartilhado e vale igual para o Assistente, o Builder, o Construtor e os agentes da
empresa: não há regra por agente.

## A página do fundador

**No fim desta etapa** você abre uma conversa nova com qualquer agente, manda a primeira mensagem e,
sem trocar de janela nem mandar outra mensagem, o nome da conversa passa de "Conversa de <data>" para
um título curto, no cabeçalho e na lista. O mesmo vale quando o observador troca o título depois que a
conversa cresce. E, no Luna, o título deixa de sair como uma frase inteira da resposta.

**Exemplo (inventado).** Ana abre uma conversa com o Assistente e escreve "Quero automatizar o
pagamento das contas". A resposta termina e o cabeçalho diz "Conversa de 13/11/2026, 09:12". Um
instante depois o Mastra termina de criar o título e avisa a tela. Hoje a tela ignora o aviso: o
cabeçalho só muda se Ana trocar de janela ou mandar outra mensagem. Depois desta etapa, o cabeçalho e
a lista passam sozinhos para "Automatizar pagamento de contas".

**Os dois defeitos.**

1. O Mastra cria o título em segundo plano, depois da resposta, e avisa a tela com
   `thread_title_updated` (o observador, com `om_thread_title_updated`). O Hub entrega o aviso e a tela
   o descarta. Correção A: a tela escuta os dois avisos e lê de novo a conversa e as listas.
2. No Luna, o título saía como uma frase da resposta. A frase própria do Conexus para o título troca as
   instruções padrão do Mastra e perde os três avisos que elas trazem: o texto é uma transcrição com
   linhas "User:" e "Assistant:", nunca responda nem continue essa transcrição, e tudo o que você
   devolver vira o título. Correção C: manter as frases em português e somar esses avisos, também na
   frase do observador.

**O roteiro de uso.**

1. Com qualquer modelo, abra uma conversa nova e mande uma mensagem. Espere a resposta terminar, sem
   mexer na janela: o cabeçalho e a lista passam de "Conversa de…" para o título.
2. No Luna (ChatGPT), repita: o título é curto como um título, não uma frase da resposta.
3. Faça o mesmo no Builder, no Construtor e na conversa de um agente.

**O que você faz, e quando.** No começo: aprova esta página. No fim: faz o roteiro.

**Fica de fora.**

- Cortar o título por tamanho no Hub (esconde o sintoma).
- Segurar o fim do turno até o título ficar pronto (`generateTitle.emitEvent`, opção B, recusada).
- Qualquer regra por agente, a troca da frase pela padrão do Mastra em inglês (opção D), o modelo do
  título, o dublê do Sankhya e o transporte do Codex.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 A tela escuta o título | o cabeçalho e as listas leem de novo ao ouvir `thread_title_updated` e `om_thread_title_updated` | `apps/web/src/builder/conversation/`, `assistant/` | [web](../guides/web.md) | nada |
| U2 Os avisos do Mastra nas frases | os três avisos, em português, nas seis frases de título e de observador, num lugar só | `apps/server/src/builder/controller-kit/` | [testing](../guides/testing.md) | nada |

Correm em paralelo: não dividem arquivo. **Orçamento de código alterado:** U1 cerca de 30 linhas, U2
cerca de 40; o resto são testes e as gravações novas.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | A conversa abre sem título, o turno roda, chegam `agent_end` e depois `thread_title_updated` com o Hub já com título: o cabeçalho e a lista passam de "Conversa de…" para o título, sem foco nem nova mensagem. Sem o aviso, o cabeçalho continua com a data | `assistant/title-heard.test.tsx` | must |
| 2 | U1 | O mesmo com `om_thread_title_updated` | `assistant/title-heard.test.tsx` | must |
| 3 | U2 | O pedido do título ao modelo leva os avisos (transcrição "User:"/"Assistant:", nunca responda nem continue, tudo vira o título) antes da frase do assunto, e o título gravado é o que o modelo devolveu | `model-accounts/openai/codex.test.ts`, "o título da conversa pela assinatura" | must |
| 4 | U2 | O pedido do observador leva o aviso dele antes da frase do assunto, sem tirar a frase do Assistente | `assistant/assistant.test.ts`, "o Observador com foco de negócio" | must |

## A matriz de estados

Nenhuma tela nova nem texto novo: o cabeçalho e a lista mostram o que já mostram (`titleOf`, "Conversa
de <data>" sem título). Muda só quando eles leem o título.

| Tela | Sem título ainda | Título chegou | Erro de leitura |
| --- | --- | --- | --- |
| Cabeçalho e lista (as quatro conversas) | "Conversa de <data>" | o título, ao ouvir o aviso | como hoje (a leitura que falha já tem o seu estado) |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A tela escuta o título | U1 | `use-session.ts` `heard` descarta os dois eventos (`session-state.ts`, `default`) | Mastra Code `mastracode/tui/src/tui/event-dispatch.ts:554-564`; Factory `mastracode/factory/src/session/thread-title-mirror.ts:59-64`; tipos em `@mastra/core` `agent-controller/types.ts:1035-1036`; reconhecidos por `@mastra/client-js` `dist/index.js:6970,6996` | troca o título ao ouvir os dois eventos | nativo (o evento do Mastra, como o Mastra Code) | — | "Títulos A+C aprovado" | — |
| Quem lê o título | U1 | `titleOf` (`conversation/text.ts`); leituras `conversationQuery`, `assistantConversationQuery`, `agentConversationsQuery`, `construtorConversationsQuery`, listas `allConversationsQueryKey`, `listAssistantConversations` | TanStack Query: invalidar a leitura (`invalidateQueries`) | a leitura do servidor é o único dono do título; o texto do evento não é escrito no cache | nativo (as fábricas de key que as telas já usam) | — | "Títulos A+C aprovado" | `assistant/title-heard.test.tsx` |
| Os avisos nas frases | U2 | `controller-kit/instructions.ts` `TITLE` (a frase troca `DEFAULT_TITLE_INSTRUCTIONS`) | Mastra `packages/core/src/agent/agent.ts:12119-12126`; `@mastra/memory` `observational-memory/observation-strategies/thread-title.ts` | as instruções padrão dizem que o texto é uma transcrição "User:"/"Assistant:", que não se responde nem se continua, e que tudo o que volta é o título | embrulhado: a frase nossa, em português, com os avisos do Mastra num lugar só (`INPUT_NOTICE`, C26) | — | "Títulos A+C aprovado" | — |
| As gravações dos avisos | U1 | nenhuma | `scripts/record.ts` (T26) | a cena roda o Mastra real com o dublê do provedor e grava os eventos | nativo (`npm run record -- title` e `title-observer`) | — | — | `recordings/mastra/title.jsonl`, `title-observer.jsonl`, `scripts/record-title.ts` |

**A medida do transplante.** Nada vem do repositório antigo.

## U1 A tela escuta o título

**Base e modelo.** `main` `98db31a7`. Sonnet.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/conversation/use-session.ts` | muda: `heard` chama `onTitled` nos dois eventos | `chat.tsx` |
| `apps/web/src/builder/conversation/chat.tsx` | muda: `listKeys` (opcional) e o `titled` que lê de novo `conversationKey` e `listKeys` | os quatro donos da conversa |
| `assistant/conversation.tsx`, `conversation/panel.tsx` | mudam: passam a lista que mostra o título | — |
| `agents/agent-chat.tsx`, `agents/construtor-chat.tsx` | não mudam: a `conversationKey` deles já é a lista | — |
| `conversation/test-events.ts`, `test-recorded.ts` | mudam: `titleUpdated` e `observerTitleUpdated`, lidos das gravações | os testes |
| `scripts/record.ts`, `scripts/record-title.ts`, `apps/server/src/platform/recordings/mastra/` | mudam e criam: as cenas `title` e `title-observer` | `npm run record` |

### Parar se

- A leitura que o aviso invalida muda algum teste de tela além do critério 1 e 2.

## U2 Os avisos do Mastra nas frases

**Base e modelo.** `main` `98db31a7`. Sonnet.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/controller-kit/instructions.ts` | muda: `INPUT_NOTICE` (título e observador) e `noticed`, que somam o aviso às seis frases de `TITLE` | `assistant/memory.ts`, `conversation/builder.ts`, `construtor/construtor.ts`, `agents/controller.ts`, `assistant/instructions.ts` (a frase do observador do Assistente) |
| `model-accounts/openai/codex.test.ts`, `platform/test-openai-codex.ts` | mudam: a gravação do Codex leva um título, não uma frase; `titledStream` | — |
| `assistant/assistant.test.ts` | muda: o observador leva o aviso | — |

### Parar se

- O aviso do observador mudar o formato que o observador devolve (`<thread-title>`): o teste do
  Observador do Assistente avisa.
