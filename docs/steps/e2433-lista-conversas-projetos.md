# Etapa 24.3.3: A lista de conversas e os Projetos

## A página do fundador

**No fim desta etapa** você apaga e renomeia uma conversa pelo "⋮" da lista, acha uma conversa
pelo título, filtra a lista por lugar, vê as conversas agrupadas por Projeto, e a página Todos os
projetos mostra cada Projeto com o estado do app e tem o botão "Novo projeto".

**O roteiro de uso.**

1. No Início, passa o mouse numa conversa da lista à esquerda. Aparece um "⋮" na linha (no celular
   ele fica sempre à vista). Toca nele: **Renomear** e **Apagar**.
2. Toca em **Renomear**, troca o título e salva. A linha mostra o título novo e ele não volta ao
   que o Conexus tinha escolhido sozinho.
3. Toca em **Apagar**. Aparece "Apagar esta conversa?" com "Isto não se desfaz. As mensagens e os
   arquivos da máquina dela vão junto. O app e as versões do Projeto ficam.", e os botões
   **Cancelar** e **Apagar conversa**. Confirma: a linha some. Se era a conversa aberta, a tela vai
   para uma conversa nova.
4. Na lista, toca na lupa e digita parte de um título, sem se importar com acento ou maiúscula: só
   as conversas com aquele nome ficam. Sem nenhuma, a lista diz "Nenhuma conversa com esse nome.".
5. Toca no filtro e escolhe **Início**, um Projeto ou **Automações**: a lista mostra só as daquele
   lugar, com o lugar escolhido num rótulo com "×" para tirar. Busca, filtro e aba ficam no
   endereço: o link copiado abre a mesma lista.
6. Troca a aba **Recentes** (por dia, como hoje) para **Projetos**: cada Projeto é um título que
   abre e fecha, com as conversas mais novas dele e "Ver todas"; embaixo, "Sem Projeto".
7. Na barra da esquerda, abre **Todos os projetos**: o título, uma frase, **Novo projeto** no
   alto, e cada Projeto num cartão com nome, o estado do app ("Publicado · v2", "Em construção ·
   v3", "Ainda sem app") e a data em que foi criado. Sem nenhum Projeto, a página tem uma coluna no
   centro: "Nenhum projeto ainda", uma frase, **Novo projeto** e "ou peça um app no Início".

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. No fim: faz o roteiro,
diz o que viu e aprova os textos das telas.

**Fica de fora.** Buscar no texto das mensagens (pede um banco de vetores e embeddings que o
Conexus não tem). As conversas do Builder, do Construtor e dos agentes na lista da empresa e o
"⋮" delas: ficam onde estão hoje (o Projeto e a página do agente), e ganham o mesmo menu num
cartão próprio; esta etapa entrega o "⋮" na lista das conversas do Assistente, a que você vê. Favoritas e
Arquivadas. Busca na página de Projetos. A última atividade e o número de conversas no cartão do
Projeto. Dono e administrador apagando conversa de outra pessoa.

**As decisões suas nesta etapa.** Todas já respondidas (`docs/approvals.md`, "Etapa 24.3.3"). Uma
linha é do cartão, não sua: a lista de conversas lê 30 por página (é o que o servidor faz); o "50
por página" do critério 6 da 13.3 e o comentário da lista estavam desatualizados, e a U2 os
conserta para 30. Os "50 por página" da página de Projetos não mudam.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | `DELETE` e `PATCH` de uma conversa do Assistente; o "⋮" com Renomear e Apagar na lista | `packages/hub-api/src/assistant.ts`, `apps/server/src/builder/assistant/`, `apps/web/src/builder/assistant/` | `data.md` (D17), `web.md` | A 24.1 (em `main`) |
| U2 | `q` e `place` na lista; a lupa, o filtro, a aba Projetos; 30 por página | as mesmas | `web.md` | U1 |
| U3 | Todos os projetos: cartão com estado, "Novo projeto", o vazio | `apps/web/src/hub/projects/` | `web.md`, `design.md` | A 13.3 U9 sobre `project-cards.tsx` (L1) |

U3 só toca `hub/projects/` e corre em paralelo à U2. A U2 espera a U1 porque as duas mexem em
`sidebar-conversations.tsx` e em `assistant.ts`.

**Orçamento de código alterado.** U1: 450 linhas. U2: 650. U3: 200. Total da etapa: 1.300 (L2: ate
4.000).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `DELETE …/assistant/conversations/{id}` da própria conversa dá 204; ela some da lista e a leitura dela dá `CONVERSATION_NOT_FOUND`. A de outra pessoa e uma que não existe dão `CONVERSATION_NOT_FOUND` igual (S10) e nada se apaga | `assistant/delete.test.ts`: apaga a própria; a de outra pessoa | must |
| 2 | U1 | Apagar no meio de uma resposta para a resposta, mata as máquinas da conversa e apaga a linha `assistant_conversation` e o fio; o que a conversa mandou para um Projeto (app, versões) fica igual | `assistant/delete.test.ts`: apaga com turno aberto | must |
| 3 | U1 | Apagar duas vezes: a primeira dá 204, a segunda `CONVERSATION_NOT_FOUND`, que a tela trata como "já foi"; uma falha no meio deixa o que o próximo apagar acha | `assistant/delete.test.ts`: repete; falha da máquina | must |
| 4 | U1 | Uma conversa aberta por uma automação apaga só ela: a automação, a agenda e o histórico ficam, e o aviso que a apontava abre "não encontrada" | `assistant/delete.test.ts`: conversa de automação | must |
| 5 | U1 | `PATCH` com `{ title }` renomeia e o título fica fixo: a memória não o troca na volta seguinte. Título vazio ou de mais de 120 caracteres: `REQUEST_MALFORMED` | `assistant/rename.test.ts` | must |
| 6 | U1 | Sem sessão: `SESSION_REQUIRED`; quem saiu da empresa: `CONVERSATION_NOT_FOUND`; banco fora: `DATABASE_UNAVAILABLE` e nada se apaga | `assistant/delete.test.ts`, `database-down.test.ts` | must |
| 7 | U1 | Na tela, o "⋮" abre Renomear e Apagar; Apagar pede a confirmação com os dois botões, a conversa aberta apagada leva a uma nova, e "já foi" some da lista sem erro | `sidebar-conversations.test.tsx`: menu, apagar, renomear | must |
| 8 | U2 | `q` acha pelo título sem acento nem caixa (NFC); sem resultado a lista vazia diz "Nenhuma conversa com esse nome."; `q` de mais de 100 caracteres: `REQUEST_MALFORMED` | `assistant/list-search.test.ts` | must |
| 9 | U2 | `place=HOME` lista as sem Projeto, `place=AUTOMATIONS` as de automação, `projectId` as do Projeto; junto com `q` valem as duas, e o servidor pagina o resultado em 30 | `assistant/list-search.test.ts` | must |
| 10 | U2 | Busca, lugar e aba ficam no endereço: abrir o link mostra a mesma lista; "×" tira o filtro | `sidebar-conversations.test.tsx`: endereço | must |
| 11 | U2 | A aba Projetos mostra um grupo por Projeto vivo com até 5 conversas e "Ver todas", e "Sem Projeto" no fim | `sidebar-conversations.test.tsx`: aba Projetos | must |
| 12 | U3 | A página mostra, em cada cartão, nome, estado do app em palavras e a data de criação; "Novo projeto" no alto abre o diálogo de criar | `projects.test.tsx` | must |
| 13 | U3 | Sem Projeto, a página mostra a coluna do vazio com "Novo projeto" e o caminho para o Início; um membro sem permissão de criar não vê o botão | `projects.test.tsx` | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Lista de conversas (Recentes) | sem conversa a lista some, fica "Nova conversa" | "Nenhuma conversa com esse nome." quando há busca | três linhas de esqueleto | `ReadFailure` com "Tentar de novo" | — | o membro não vê a lista (W34) | sessão vencida: entrada |
| Aba Projetos | sem Projeto: só "Sem Projeto" | grupo sem conversa: "Nenhuma conversa neste Projeto ainda." | esqueleto por grupo | `ReadFailure` por grupo | — | como a lista | como a lista |
| Menu "⋮" e os dois diálogos | — | — | "Apagando…", "Salvando…" | a frase da falha no diálogo; apagar sem confirmar mostra "Não confirmamos. Veja a lista." | "já foi": o diálogo fecha, a linha sai | — | recusado: a frase |
| Todos os projetos | vazio: coluna central | "Nenhum projeto ainda" | esqueleto da página | `ReadFailure` | — | sem "Novo projeto" | como a lista |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `q`, `place` da lista | a tela, pelo endereço | o servidor, que filtra os fios |
| `title` do `PATCH` | a pessoa | o servidor (`titlePinned`), a lista, o título da conversa |
| `place` do resumo | nenhum campo novo: o resumo já traz `project` e `automation` | a aba e o filtro, no cliente |

Desenho de caixas (1280 e 390 px). A linha ganha à direita o "⋮" de 32 px no lugar da idade
quando o mouse está sobre ela; a 390 px o "⋮" fica sempre ao lado da idade. A lupa e o filtro vão
à direita do título "Conversas". As capturas do G4 OS que o desenho segue são as telas 13
(Sessões: ícones de filtro e busca, as abas, "HOJE") e 25 (Projetos: título, frase, "Novo
projeto", o vazio) do estudo de 2026-11-01; elas ficam fora do repositório.

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Uma dependência fora | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `DELETE` de uma conversa | a segunda dá `CONVERSATION_NOT_FOUND`, a tela trata como "já foi" | a máquina que não morre deixa o fio; o próximo apagar acha de novo | banco ou Mastra fora: `DATABASE_UNAVAILABLE`, nada some; resposta cortada: a tela confere a lista | `ASSISTANT_CONVERSATION_DELETED` com `conversationId`, nunca o título | 3, 6, 7 |
| `PATCH` do título | a última grava | recusa antes de gravar: nada muda | banco fora: `DATABASE_UNAVAILABLE` | `ASSISTANT_CONVERSATION_RENAMED` | 5, 6 |
| `listThreads` sem página (busca) | leitura, sem estado | — | banco fora: `DATABASE_UNAVAILABLE` | nenhuma linha nova | 8, 9 |
| `createProject` da página (já existe) | `attemptKey` da criação | como já é | banco da empresa ainda não pronto: o diálogo já diz "Preparando o banco da empresa…" | os da criação | 12 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Apagar uma conversa | U1 | `controller-kit/release.ts:releaseThreads`, `assistant/release.ts:releaseConversations` | `@mastra/core@1.79.0` `AgentController.deleteSession`; `@mastra/memory@1.39.0` `deleteThread` (`src-DxZ7N8nO.js:42812-42828`) | `deleteSession` aborta a resposta; `deleteThread` apaga mensagens, vetores e o fio | nativo | — | B a, C a, E a | `assistant/remove.ts` |
| Renomear | U1 | nenhuma | `@mastra/memory@1.39.0` `updateThread` com `titlePinned` (`src-DxZ7N8nO.js:42793-42811`) | mescla os metadados; a marca impede a memória de trocar o título | nativo | — | D a | `assistant/routes.ts` |
| O ⋮ da linha | U1 | `sidebar-conversations.tsx:ConversationRow` | Mastra Studio `thread-list.tsx:110,119` (`mastra-1.79` `4c22623e`) | a ação aparece no hover e no foco | nativo | — | A a | `assistant/conversation-menu.tsx` |
| Busca pelo título | U2 | `routes.ts:listAssistantConversations` | `@mastra/core@1.79.0` `storage/types.d.ts:183-209`; `@mastra/pg@1.32.0` `index.js:12335-12340`; Open WebUI `chats.py:1656` | o Mastra filtra só por dono e marcas; o título se filtra fora | embrulhado, o Hub filtra a lista que o Mastra devolve | `@mastra/pg@1.32.0`: sem busca de título; entrada em `boundaries.md` no fechamento | A a | `assistant/search.ts` |
| Filtro de lugar | U2 | só `projectId` | G4 OS, ícone de filtro | o Projeto passa pela marca; Início e Automações pelo mesmo filtro do Hub | embrulhado, junto com a busca | a mesma entrada | B a | `assistant/place-filter.tsx` |
| Aba Projetos | U2 | lista por dia | G4 OS, aba Projetos | uma consulta por Projeto, as que já existem | nativo | — | C a | `assistant/projects-tab.tsx` |
| Criar e o vazio de Todos os projetos | U3 | `project-cards.tsx:193` | G4 OS tela 25; `DESIGN.md:585` | botão no canto e no vazio; coluna central de até 448 px | nativo | — | F A | `projects/projects.tsx` |
| O cartão de Projeto | U3 | `project-cards.tsx` | `project-state.ts:projectStateText` | o mesmo texto do bloco do Início | nativo | — | E a | `projects/project-cards.tsx` |

**A medida do transplante.** Nenhum código vem do repositório antigo.

**A dívida.** O comentário "50 por página" de `sidebar-conversations.tsx` (U2 conserta). A conversa
de execução de automação não tem selo na lista lateral (o campo `automation` do resumo é ignorado
pela linha): issue futura. O "⋮" para o Builder, o Construtor e os agentes: cartão próprio.

## U1 O "⋮" com Renomear e Apagar

**Base e modelo.** `main` em `35a7e598`. Opus: a ordem de parar, matar e apagar cruza o controlador,
as máquinas, o Mastra e o banco.

### As linhas da tabela

- **Apagar.** Em `assistant/release.ts` já está o laço de uma lista de ids; extraia dele a conversa
  de um id: `deleteSession({ sessionId })` (aborta a resposta e nega cartões), `machines.kill(id)`,
  `DELETE` da linha `assistant_conversation` (única apagada aqui, por `database.command`), depois
  `memory.deleteThread(id)` (D17: só depois, para uma falha deixar o que o próximo apagar acha). A
  linha sai antes do fio e a leitura limpa um fio sem linha (`routes.ts:ownThread`); se a ordem for
  outra, uma linha sem fio fica para sempre.
- **Renomear.** `memory.updateThread({ id, title, metadata: { ...thread.metadata, titlePinned: true } })`.
  Confirme `titlePinned` no `dist` instalado (`src-DxZ7N8nO.js:42793-42811`) antes de usar.
- **O "⋮".** `ui/dropdown-menu.tsx`, `ui/alert-dialog.tsx` e `ui/dialog.tsx` como estão; o `AlertDialog` de
  `hub/projects/delete-project-dialog.tsx` é o modelo (a confirmação sem o nome digitado).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/assistant.ts` | cria `deleteAssistantConversation` e `renameAssistantConversation` | o servidor, a tela, `index.ts` |
| `apps/server/src/builder/assistant/` | cria `remove.ts`; muda `routes.ts`, `release.ts` | `assistant.ts` |
| `apps/web/src/builder/assistant/` | cria `conversation-menu.tsx`, muda `sidebar-conversations.tsx`, `queries.ts` | a moldura da empresa |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/assistant.ts
export const deleteAssistantConversation = defineOperation({
  id: 'deleteAssistantConversation', access: 'session', method: 'DELETE',
  path: `${BASE}/{conversationId}`, input: { params: OfConversation },
  success: { status: 204 }, failures: READ_FAILURES_WITH_NOT_FOUND })
export const renameAssistantConversation = defineOperation({
  id: 'renameAssistantConversation', access: 'session', method: 'PATCH',
  path: `${BASE}/{conversationId}`, bodyLimit: 1024,
  input: { params: OfConversation, body: z.object({ title: z.string().trim().min(1).max(120) }) },
  success: { status: 200, body: z.object({ conversation: AssistantConversationSummary }) },
  failures: READ_FAILURES_WITH_NOT_FOUND })
```

Falhas: `CONVERSATION_NOT_FOUND`, `SESSION_REQUIRED`, `DATABASE_UNAVAILABLE`, `HUB_UPDATING`,
`REQUEST_MALFORMED`. Cada estado é a falha pelo `code`; cada id é o `ConversationId` já marcado e
conferido por `ownThread` (C23); o dono do fato "como se apaga uma conversa" é `remove.ts` e o lote
de `release.ts` passa a chamá-lo (C26); o `title` tem o esquema Zod acima (C27). Modelo:
`assistant/routes.ts` (`setAssistantModel`), que cumpre C21, C23 e C26.

### As skills e a leitura

`docs/reference/stack.md`: as linhas de `packages/hub-api`, `apps/server` e `apps/web`; a skill `mastra`
(`@mastra/memory` `updateThread`, `deleteThread`) e a `shadcn` (`dropdown-menu`, `alert-dialog`).

### A ordem do trabalho

1. O contrato em `hub-api` e o teste que falha: apagar a própria conversa dá 204 (critérios 1 a 6).
2. `remove.ts` e o laço de `release.ts` por ele; a rota; o `PATCH`.
3. A tela: `conversation-menu.tsx`, a linha, a mutação, a conversa aberta apagada leva a uma nova
   (`router.navigate`), "já foi" invalida a lista (critério 7).

### Como se prova

Testes de servidor pela porta pública (T5) em `assistant/delete.test.ts` e `rename.test.ts`, com a
máquina e o modelo de teste que `test-assistant.ts` já dá; teste de tela em
`sidebar-conversations.test.tsx`. Hoje nenhum passa: as operações não existem.

### Parar se

A ordem de matar e apagar deixar uma linha sem fio que a leitura não limpa; o `titlePinned` não
existir no Mastra instalado.

## U2 Busca, filtro e abas

**Base e modelo.** O `main` com a U1. Sonnet.

Uma linha da tabela por vez, no mesmo molde da U1. O contrato: `listAssistantConversations` ganha
`q: z.string().trim().min(1).max(100).optional()` e `place: z.enum(['HOME', 'AUTOMATIONS']).optional()`
no `query`. O servidor, só com `q` ou `place`, lê `listThreads({ filter: { resourceId }, perPage:
false })`, filtra (título em NFC, sem acento e sem caixa; lugar pelas marcas `conexusProjectId` e
`conexusAutomation`) e pagina por fatias de 30, com o mesmo token. Sem `q` nem `place`, a leitura de
hoje não muda. A tela: `InputGroup` da casa no cabeçalho "Conversas" (o valor no endereço, W18), o
filtro, `Tabs` e `Collapsible`. A U2 mede uma lista de 500 fios antes de fechar (estimativa do
estudo de que são dezenas de KB, não medida). Para: se `listThreads` sem página custar mais que o
`staleTime` segura.

## U3 Todos os projetos

**Base e modelo.** O `main` depois da 13.3 U9. Sonnet.

`projects.tsx` ganha `NewProjectDialog` em um `PageTitle` com a frase "Cada Projeto guarda um app,
as conversas e as ligações dele." e o botão (só para quem pode criar); `project-cards.tsx` ganha o
`Stamp` com `projectStateText(projectStateOf(project))` e a data; o vazio vira a coluna de até 448 px.
Nenhum contrato novo: `ProjectSummary` já traz `appVersion`, `publishedVersion` e `createdAt`.
