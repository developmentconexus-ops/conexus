# Etapa 24.3.1: Ferramentas, ideias e a página Agentes

Este cartão sai do cartão da 24.3, fechado em https://github.com/developmentconexus-ops/conexus/pull/627: a U7, a U8 e a U9 dele, com os critérios, as decisões do fundador (a 4A e a `V1`) e as linhas da tabela de referência que são delas. A 24.3 e a 24.3.1 antigas (U3 e U6) estão no ar. Pela regra L5 ele entra em `docs/steps/` quando o cartão da 24.3.3 sair no fechamento dela, na ordem que o fundador fixou (24.3.2, 24.3.3, depois esta). Cada linha citada abaixo foi escrita sobre o código de antes da 24.3 no ar: o construtor a reabre na `main` antes de usar.

## A página do fundador

**No fim desta etapa** você abre, num Projeto, a aba **Ferramentas** da área Agentes e vê as ferramentas que o Projeto pode usar, com as versões de cada uma; vê, quando o Construtor acha uma falta de verdade, o bloco **Ideias do Construtor**; e abre, no Início, a página **Agentes**, com todos os agentes da empresa.

**O roteiro de uso.** Padaria Sol: Ana (dona), Bia (administradora) e Bruno (membro). O Projeto "Vendas" tem o agente "Conferente de metas", publicado na versão 1, com uma ferramenta feita pelo Construtor. No computador e no celular.

1. A Ana abre o Projeto Vendas, entra em **Agentes** e toca a aba **Ferramentas**. A lista mostra cada ferramenta com o que ela lê, a versão e os agentes que a usam. Ela toca **Nova versão** numa delas, muda um valor fixo e grava: a versão passa a 2.
2. Ela abre o agente. No painel, a ferramenta mostra "Versão 2 disponível"; ela toca **Usar a versão 2**, o rascunho muda e ela publica a versão 2 do agente. Tenta apagar uma ferramenta que o agente usa: a tela diz "Usada por Conferente de metas." e não apaga.
3. O Projeto perde a ligação "Matriz" (a Ana a retira). Na área **Agentes** aparece o bloco **Ideias do Construtor**, com uma linha: o agente e a falta ("usa uma ligação que o Projeto não oferece mais"). Ela toca **Pedir ao Construtor** e abre uma conversa nova com ele. Sem falta, o bloco não aparece.
4. No Início, a Ana abre a página **Agentes**: todos os agentes da empresa, com o Projeto, o estado e a última vez que rodou; filtra por Projeto; o nome abre o agente no Projeto dele; **Novo agente** pergunta o Projeto. A Bia vê a página; o Bruno (membro) não vê **Agentes** e o endereço dá "não encontrado".

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. No fim: faz o roteiro, diz o que viu e aprova os textos das telas. As suas respostas já decidiram a forma: **4A** (2026-11-02: as ideias só de faltas de verdade), **`V1`** (2026-11-02: a página Agentes no Início, só para ver, filtro por Projeto, versão, estado e última execução, um toque abre o agente no Projeto dele, **Novo agente** pergunta o Projeto, escondida do membro) e **3A** (quem muda uma ferramenta da biblioteca: dono e administrador).

**Fica de fora.** Papéis e pedidos (o membro continua sem ver agentes); a falta "grava sem aprovação", que entra com a 24.5; comparar versões lado a lado; "Ver código" e o desenho do que o agente usa (24.4); ideias genéricas, geradas por modelo; agentes fora de um Projeto: a página do Início só os mostra.

**As decisões suas nesta etapa.** Nenhuma nova: a 4A, a `V1` e a 3A já foram respondidas e estão em `docs/approvals.md`.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U7 (24.3.1) | A aba **Ferramentas** da área: a lista das ferramentas que o Projeto pode usar, as versões de cada uma, a versão nova pelo formulário, apagar com `TOOL_IN_USE`, e no painel do agente o aviso "Versão nova" com **Usar a versão n** | `apps/web/src/builder/tools/`, `apps/web/src/builder/agents/` (`config-panel.tsx`), `apps/web/src/routes/_app/companies/$companyId/projects/`, `docs/reference/screens.md` | [web](../guides/web.md) | U5 |
| U8 (24.3.1) | As **Ideias do Construtor** na área (a 4A): a leitura das faltas que os dados mostram (um agente publicado preso a uma versão velha de uma ferramenta, um agente publicado que usa uma ligação que o Projeto não oferece mais), o bloco que some sem falta e **Pedir ao Construtor** | `apps/server/src/builder/agents/` (`ideas.ts`, `routes.ts`), `packages/hub-api/src/` (`agents.ts`), `apps/web/src/builder/agents/` (`area.tsx`, `ideas.tsx`) | [web](../guides/web.md) | U4, U7 |
| U9 (24.3.1) | A página **Agentes** do Início (a `V1`): a mesma lista da área com todos os agentes da empresa, o filtro por Projeto, a versão, o estado e a última vez que rodou; um toque abre o agente no Projeto dele; **Novo agente** pergunta o Projeto; a entrada no Início, escondida do membro | `apps/server/src/builder/agents/` (`agents.ts`, `agent.ts`), `apps/server/migrations/`, `packages/hub-api/src/` (`agents.ts`), `apps/web/src/builder/agents/` (`agent-list.tsx`, `new-agent.tsx`), `apps/web/src/routes/_app/companies/$companyId/` (`route.tsx`, `agents.index.tsx`) | [web](../guides/web.md) | U5, U6 |

A U7 só toca a web; a U8 anda depois dela (o bloco fica na mesma área); a U9 anda depois da U6, que já está no ar (a última execução conta as automações). `packages/hub-api/src/failures.ts` e `packages/hub-api/src/agents.ts` são pontos de fusão com as outras etapas em andamento.

**Quando começa** (delivery L1). Depois que o cartão da 24.3.3 sair no fechamento dela e esta página for aprovada.

**Orçamento de código alterado.** U7: ~350 (uma lista, as versões e o aviso, sobre o formulário da U5). U8: ~300 (uma consulta sobre as tabelas da U1, uma rota e o bloco). U9: ~350 (uma coluna, a gravação dela a cada turno, o filtro na rota da lista; a rota do Início, a entrada, o filtro e **Novo agente** sobre a lista da U5, como a página das Automações). Total da etapa: ~1.000, dentro da regra L2. Testes, gerados e o OpenAPI ficam fora.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 32 | U7 | A aba **Ferramentas** da área lista as ferramentas que o Projeto pode usar, com o que cada uma lê, a versão e os agentes que a usam; **Nova versão** abre o formulário com a versão de agora e grava a `n+1`; **Apagar** de uma usada mostra "Usada por <agentes>." e não apaga; no painel do agente, uma ferramenta com versão nova mostra "Versão n disponível" e **Usar a versão n**, que grava o rascunho | `apps/web/src/builder/tools/tools-tab.test.tsx`; `apps/web/src/builder/agents/agent-page.test.tsx`, "versão nova" | must |
| 33 | U8 | `GET /api/companies/{c}/projects/{p}/agent-ideas` devolve, de cada agente publicado do Projeto, `TOOL_VERSION_BEHIND` para cada ferramenta da versão ativa cuja versão presa é mais velha que a mais nova, e `CONNECTION_LOST` para cada ligação da versão ativa (em `connections` ou numa ferramenta presa) que o Projeto não oferece mais; sem falta, `{ ideas: [] }`; um rascunho nunca publicado não gera ideia (a página dele já marca); o membro, `NOT_FOUND`; a leitura não chama modelo nem grava nada | `apps/server/src/builder/agents/ideas.test.ts` | must |
| 34 | U8 | A área mostra o bloco **Ideias do Construtor** só com uma ideia ou mais, uma linha por ideia com o agente e a falta; sem ideia, ou com a leitura falhando, o bloco não aparece e o resto da área funciona; **Pedir ao Construtor** abre uma conversa nova do Construtor com o pedido escrito na caixa, sem mandar: quem manda é a pessoa | `apps/web/src/builder/agents/area.test.tsx`, "as ideias" | must |
| 35 | U9 | `GET /api/companies/{c}/agents` sem `projectId` lista os agentes de todos os Projetos vivos da empresa, com `projectId`, só os daquele Projeto; cada `AgentSummary` traz `lastRunAt`, o início do último turno de uma conversa com a versão publicada (de qualquer pessoa, também a aberta por uma automação), `null` sem nenhum; um turno da conversa de teste não muda `lastRunAt`; o membro, `NOT_FOUND`; um `projectId` de outra empresa, `NOT_FOUND` | `apps/server/src/builder/agents/routes.test.ts`, "a lista da empresa"; `conversation.test.ts`, "a última execução" | must |
| 36 | U9 | A página **Agentes** do Início lista os agentes com o Projeto, o estado e a última execução, e filtra por Projeto; o nome abre a página do agente no Projeto dele; a página não tem nenhum botão de mudar; **Novo agente** pede o Projeto e abre a área **Agentes** dele com a conversa do Construtor; o membro não vê a entrada, e o endereço dá "não encontrado" | `apps/web/src/builder/agents/agent-list.test.tsx` | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A página **Agentes** do Início (U9) | "Nenhum agente ainda. Os agentes nascem num Projeto." com **Novo agente** | o filtro sem agentes: "Nenhum agente neste Projeto." | a lista em esqueleto | `DATABASE_UNAVAILABLE`: a frase com Tentar de novo | — | o membro não vê a entrada; o endereço dá "não encontrado" (S10) | um Projeto apagado some do filtro |
| As **Ideias do Construtor** na área (U8) | o bloco não aparece | o bloco não aparece | o bloco não aparece até a leitura voltar | o bloco não aparece | — | o membro não vê a área | — |
| A aba **Ferramentas** (U7) | "Nenhuma ferramenta ainda. O Construtor faz as primeiras quando monta um agente." | o mesmo | a lista em esqueleto | a frase do código com Tentar de novo | `TOOL_NOT_FOUND`: a lista recarrega | o membro: não encontrado | `TOOL_IN_USE`: "Usada por <agentes>." |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| As linhas `builder.tool` e `builder.tool_version` (a ferramenta da biblioteca da empresa e as suas versões imutáveis) | U1; U4 (`tool_save`, pelo serviço) | U1 (conferir a escolha, `TOOL_IN_USE`), U2 (`agentOf`), U4 (`tool_search`), U5, U7 |
| As linhas `builder.agent_tool` (as versões escolhidas pelo rascunho) e `builder.agent_version_tool` (as presas a cada versão publicada) | U1 (o rascunho; publicar copia uma para a outra); U4 (`agent_set`, pelo serviço) | U1 (`TOOL_IN_USE`), U2 (`agentOf`), U5, U7 |
| `ToolTarget`, `ToolVersionConfig`, `ToolSummary`, `ToolDetail`, `ReadyTool` | U1 | U2 (`agentOf`), U4, U5, U7 |
| `AgentIdea` (as faltas, `GET …/agent-ideas`) | U8 | U8 (o bloco) |
| `AgentSummary.lastRunAt` e a coluna `builder.agent.last_run_at` | U9 (o turno com a versão publicada) | U9 (a lista) |

Os desenhos de caixas da aba Ferramentas, das Ideias e da página Agentes seguem o protótipo do Construtor e as telas da 24.3 no ar; o construtor da U7 e o da U9 os desenham antes de construir, a 1280 e a 390 px, e os põem na seção da unidade.

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Gravar `last_run_at = now()` no começo de um turno com a versão publicada (U9) | dois turnos ao mesmo tempo: o último vence, sem conflito | a gravação que falha não derruba o turno: o turno segue e a próxima grava | banco fora: o turno já falha como na 24.1 (`DATABASE_UNAVAILABLE`) | nada novo (a linha do turno) | 35 |
| Apagar uma ferramenta pela aba (U7; o comando é o da 24.3 já no ar) | o mesmo da 24.3: a última recusa com `TOOL_IN_USE` ou `TOOL_NOT_FOUND` | a da 24.3 | a da 24.3 | `TOOL_DELETED` | 32 |
| Ler as ideias (U8): só leitura | — | — | `DATABASE_UNAVAILABLE`: o bloco não aparece | nada | 33, 34 |

## A tabela de referência

Referências, como a 24.3 as leu: Mastra `@mastra/core` 1.79.0, a estante `mastra-1.79` `4c22623e`; o construtor reabre cada linha na `main` e no Mastra instalado.

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  A ferramenta preset (o recorte), com versões | U7 (o servidor é da U1, no ar) | as leituras do kit com `class` (`packages/connectors/src/kernel/operation.ts:140-154`, lido); `connector_read` pela porta (`builder/connectors/connector-tools.ts:175-215`, lido); reabrir na `main`: o código mudou desde o cartão antigo | `createTool` (`M:packages/core/src/tools/tool.ts:750`, relay); o editor resolve as ferramentas por id (`M:packages/editor/src/namespaces/agent.ts:1329-1352`, relay) | a ferramenta existe uma vez, e o agente a pega pelo id | nativo: `createTool` cujo `execute` chama `access.read` com os valores fixos por cima. A ferramenta é uma linha com versões imutáveis (o estudo §3.2), e o agente escolhe as suas e prende a versão de cada uma em cada versão dele. A ferramenta é da empresa, numa biblioteca só (`T1`); o estudo a punha no Projeto. As leituras do kit são as ferramentas prontas. A 24.4 soma as ferramentas em código como o valor `CODE` da coluna `kind` de `builder.tool` (hoje só `PRESET`), sem migrar as linhas | — | "ferramentas específicas por agente" (2026-11-02), lido sob o `T1` do mesmo dia: o agente escolhe as suas na biblioteca da empresa | `apps/web/src/builder/tools/tools-tab.tsx` |
| As Ideias do Construtor | U8 | `agent_read` diz de cada ferramenta do rascunho se há versão nova (U4); a página marca a ligação que o Projeto não oferece mais (U5) | nenhuma referência tem o bloco; a tela 1 do protótipo do Construtor (2026-11-02) dá o lugar, e o próprio protótipo avisa que ideias genéricas viram ruído | uma leitura das faltas, nunca uma sugestão gerada | nativo: uma consulta às tabelas da U1 (`builder.agent_version_tool` contra `builder.tool.current_version`, as ligações da versão ativa contra `connectors.connections(scope)`); nenhuma chamada de modelo ao abrir a área, e o Construtor entra só quando a pessoa pede | — | "4A" (2026-11-02) | `builder/agents/ideas.ts`, `apps/web/src/builder/agents/ideas.tsx` |
| A página Agentes do Início | U9 | as Automações: uma rota com `projectId` opcional (`packages/hub-api/src/automations.ts:137,149-155`; `apps/server/src/builder/automations/routes.ts:23`, lidos), um componente `Automations({ companyId, projectId? })` (`apps/web/src/builder/automations/automations.tsx:245-259`, lido) com o lugar de cada linha (`PlaceName`, `place.tsx:10`, lido), duas rotas finas (`routes/_app/companies/$companyId/automations.index.tsx` e `projects/$projectId_.automations.index.tsx`, lidas) e a entrada do Início escondida do membro (`routes/_app/companies/$companyId/route.tsx:64-70`, lido) | a lista do Studio, todos os agentes, um clique abre a página do agente (`REF:mastra-studio`, a lista de agentes) | uma lista, o lugar em cada linha, a edição na página do agente | nativo: a mesma rota e o mesmo componente com o filtro, como as Automações; nenhuma segunda lógica, nenhuma edição no Início | — | "`V1`" (2026-11-02) | `apps/web/src/builder/agents/agent-list.tsx`, `new-agent.tsx`, `routes/_app/companies/$companyId/agents.index.tsx` |

**A medida do transplante.** Nada vem do repositório antigo. A U7 usa as rotas e o formulário que a 24.3 construiu; a U8 e a U9 são uma consulta e uma lista sobre as tabelas da U1.

**A dívida.**
- As Ideias do Construtor não têm teto nem ordem por importância: a leitura devolve todas, pelo nome do agente. Gatilho: um Projeto com mais de 10 ideias ao mesmo tempo.

## U7 A aba Ferramentas

**Base e modelo.** `main` depois da 24.3 (a U5 está no ar). Sonnet: uma aba sobre as rotas da U1 e o
formulário da U5.

### As linhas da tabela

- A ferramenta preset com versões (a linha da tabela de referência): a web só lê e grava pelas rotas
  `TOOLS` da U1; nenhum contrato novo.
- A área da U5 (`apps/web/src/builder/agents/area.tsx`): a aba entra ao lado de **Construtor** e
  **Agentes**, a 390 px também.
- O formulário da U5 (`apps/web/src/builder/agents/tool-form.tsx`): na versão nova, a ligação e a
  operação aparecem só para ler (são da ferramenta), e a descrição, os valores fixos e os campos
  abertos vêm da versão mais nova.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/tools/` | Cria `tools-tab.tsx` (a lista: o `slug`, a descrição, o que lê, o efeito, a versão, os agentes que usam), `tool-page.tsx` (as versões e **Nova versão**), `queries.ts` (`toolQuery`; `toolsQuery` vem da U5) | as rotas |
| `apps/web/src/builder/agents/` | Muda `config-panel.tsx`: uma ferramenta escolhida com `latest.number > version.number` mostra "Versão n disponível" e **Usar a versão n**, que grava pelo `PATCH …/draft` com `tools` trocando o id da versão, na fila de gravação da U5; muda `area.tsx`: a aba | — |
| `apps/web/src/routes/_app/companies/$companyId/projects/` | Cria `$projectId_.agents.tools.tsx`, `$projectId_.agents.tools.$toolId.tsx` | — |
| `docs/reference/screens.md` | Muda: a aba e a página da ferramenta | — |

### Os contratos que a unidade cria

Nenhum do servidor. **Nova versão** manda `ToolVersionConfig` a `POST TOOLS/{toolId}/versions` com uma
chave de tentativa por envio do formulário. **Apagar** manda `DELETE TOOLS/{toolId}`; no 409
`TOOL_IN_USE`, o corpo `{ agents: { id, name }[] }` vira "Usada por <nomes>." com um link para cada
agente, e nada sai da lista. `TOOL_NOT_FOUND` recarrega a lista.

### As skills e a leitura

`shadcn`, `impeccable`, `pstack:tdd`; as linhas de `docs/reference/stack.md` para `apps/web/src/`.
[web](../guides/web.md) W7, W30, W34; [design](../guides/design.md).

### A ordem do trabalho

1. **A prova primeiro.** `tools-tab.test.tsx`: **Apagar** uma ferramenta usada recebe `TOOL_IN_USE`
   do servidor dublê e mostra os nomes; falha hoje.
2. A aba e a lista; a página da ferramenta e **Nova versão**.
3. "Versão n disponível" e **Usar a versão n** no painel (`agent-page.test.tsx`, "versão nova").
4. `docs/reference/screens.md`. Regras: W7, W30, W34, C21.

### Como se prova

O critério 32 pelos testes de `apps/web` com o servidor dublê; larguras e temas pelo QA da etapa.
Comando: os testes tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- A lista precisa de um campo que `ToolSummary` não traz: relata; nunca ler outra rota para montá-la.
- Mudar a ligação ou a operação de uma ferramenta parece necessário: para; é uma ferramenta nova.

## U8 As Ideias do Construtor

**Base e modelo.** `main` depois da U7. Sonnet: uma leitura sobre as tabelas da U1, uma
rota e um bloco na área.

### As linhas da tabela

- A palavra do fundador, a 4A (2026-11-02): uma ideia só aparece quando vem de uma falta de verdade
  que o Construtor vê; sem falta, o bloco não aparece. As faltas desta etapa são as duas que os dados
  já mostram. A falta "grava sem aprovação" é da 24.5.
- As versões presas: `builder.agent_version_tool` da versão ativa contra `builder.tool.current_version`
  (as tabelas da U1); a mesma comparação que `agent_read` faz no rascunho (U4).
- As ligações que o Projeto oferece: `connectors.connections(scope)`, a mesma conferência do serviço
  da U1 e da marca da página da U5.
- A conversa do Construtor: `POST …/construtor/conversations` (U4); a caixa da conversa da 24.1 recebe
  o texto inicial sem mandar.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/agents/` | Cria `ideas.ts` (`ideasOf(scope)`: uma consulta, nenhuma gravação); muda `routes.ts`: `GET …/agent-ideas`, acesso `manageAgents` | a web |
| `packages/hub-api/src/agents.ts` | Muda: `AgentIdea` e a rota; o OpenAPI gerado | a web |
| `apps/web/src/builder/agents/` | Cria `ideas.tsx` (o bloco e **Pedir ao Construtor**); muda `area.tsx` (o bloco acima da lista) e `queries.ts` (`ideasQuery`) | — |
| `docs/reference/screens.md` | Muda: o bloco na área | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/agents.ts
// GET /api/companies/{companyId}/projects/{projectId}/agent-ideas -> { ideas: AgentIdea[] }   acesso manageAgents
const AgentRef = z.object({ id: AgentId, name: z.string() })
export const AgentIdea = z.discriminatedUnion('kind', [                                   // C21
  z.object({ kind: z.literal('TOOL_VERSION_BEHIND'), agent: AgentRef,
    tool: z.object({ id: ToolId, slug: ToolSlug }), pinned: z.int().positive(), latest: z.int().positive() }),
  z.object({ kind: z.literal('CONNECTION_LOST'), agent: AgentRef,
    connectionId: ConnectionId, name: z.string().nullable() }),                            // null: a ligação foi apagada
])
// apps/server/src/builder/agents/ideas.ts
export function ideasOf(scope: OfProject): Promise<readonly AgentIdea[]>   // só versões ativas; pelo nome do agente
```

O texto que **Pedir ao Construtor** escreve na caixa sai da web, por tipo: "Troque <slug> do <agente>
para a versão <n> e teste." e "O <agente> usa a ligação <nome>, que o Projeto não oferece mais. O que
fazemos?". O Construtor faz a troca no rascunho e testa (`C1`); publicar continua o toque da pessoa.

### As skills e a leitura

`shadcn`, `impeccable`, `pstack:tdd`. [web](../guides/web.md) W7, W30, W34; [testing](../guides/testing.md) T5.

### A ordem do trabalho

1. **A prova primeiro.** `ideas.test.ts`: publica um agente com a versão 1 de uma ferramenta, grava a
   versão 2 da ferramenta e lê `TOOL_VERSION_BEHIND`; tira a ligação do Projeto e lê `CONNECTION_LOST`;
   falha hoje.
2. `ideasOf` e a rota; o contrato e o OpenAPI.
3. O bloco, **Pedir ao Construtor** e `area.test.tsx`, "as ideias".
4. `docs/reference/screens.md`. Regras: W7, W30, W34, C21.

### Como se prova

O critério 33 pelo servidor de teste e o Postgres de teste; o 34 pelos testes de `apps/web` com o
servidor dublê; larguras e temas pelo QA da etapa. Comando: os testes tocados, `npm run typecheck`,
`npm run lint`.

### Parar se

- Uma ideia parece precisar de uma chamada de modelo para existir: para; a 4A pede uma falta que os
  dados mostram, nunca uma sugestão gerada.
- A caixa da conversa da 24.1 não aceita um texto inicial sem mandar: relata o que ela oferece;
  nunca uma segunda caixa.
- Aparece uma terceira falta que os dados mostram: relata; ela entra com a palavra do fundador, não
  pela unidade.

## U9 A página Agentes do Início

**Base e modelo.** `main` depois da 24.3 (a U6 está no ar). Sonnet: uma coluna, um filtro numa rota que já
existe e uma página que repete a das Automações.

### As linhas da tabela

- A palavra do fundador, a `V1` (2026-11-02): no Início, uma página **Agentes** com todos os agentes da
  empresa, o filtro por Projeto e, de cada um, a versão, o estado e a última execução; só para ver;
  um toque abre a página do agente no Projeto dele; **Novo agente** pergunta o Projeto; nenhum
  agente fora de um Projeto; o membro não vê (3.A).
- A forma a repetir, a das Automações da 24.2: a rota `listAutomations` com `projectId` opcional
  (`packages/hub-api/src/automations.ts:137,149-155`, lido), o componente único
  `Automations({ companyId, projectId? })` (`apps/web/src/builder/automations/automations.tsx:245-259`,
  lido), o lugar de cada linha por `PlaceName` (`apps/web/src/builder/automations/place.tsx:10`,
  lido), as duas rotas finas que só passam ou não o `projectId`
  (`apps/web/src/routes/_app/companies/$companyId/automations.index.tsx` e
  `.../projects/$projectId_.automations.index.tsx`, lidas) e a entrada do Início com
  `role !== 'member'` (`apps/web/src/routes/_app/companies/$companyId/route.tsx:64-70`, lido). Uma
  diferença: a lista das Automações sem `projectId` mostra as do Início; a dos agentes sem `projectId`
  mostra as de todos os Projetos, porque nenhum agente mora no Início.
- A última execução: o processador do turno do controlador "agentes" (U2, `builder/agents/agent.ts`)
  grava `last_run_at = now()` na linha do agente no começo de um turno com a versão publicada; a
  conversa aberta por uma automação (U6) passa pelo mesmo turno. A conversa de teste não grava.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/migrations/` | Cria `<data>_e2431_agent_last_run` (a coluna `last_run_at timestamptz null`; as permissões não mudam: `hub_company` já tem `UPDATE` em `builder.agent`) | `npm run check-migrations` |
| `apps/server/src/builder/agents/` | Muda `agents.ts` (a lista com `projectId` opcional, só Projetos vivos; `lastRunAt` no resumo) e `agent.ts` (a gravação no começo do turno publicado) | a web |
| `packages/hub-api/src/agents.ts` | Muda: `projectId` opcional na lista; `AgentSummary.lastRunAt: z.iso.datetime().nullable()`; o OpenAPI gerado | a web |
| `apps/web/src/builder/agents/` | Cria `agent-list.tsx` (a lista que sai de `area.tsx`, com o Projeto em cada linha quando não há filtro) e `new-agent.tsx` (a escolha do Projeto); muda `area.tsx` (usa `agent-list.tsx`) e `queries.ts` (`agentsQuery(companyId, projectId?)`) | as duas rotas |
| `apps/web/src/routes/_app/companies/$companyId/` | Cria `agents.index.tsx` (passa nenhum `projectId`; o filtro é um parâmetro de busca do endereço); muda `route.tsx` (a entrada **Agentes** ao lado de **Automações**, com `role !== 'member'`) | — |
| `docs/reference/screens.md` | Muda: a página do Início | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/agents.ts
// GET /api/companies/{companyId}/agents?projectId=   projectId passa a opcional: sem ele, os agentes de todos os Projetos vivos
export const AgentSummary = /* o da U1 */ .extend({ lastRunAt: z.iso.datetime().nullable() })   // null: nunca rodou publicado
// apps/web/src/builder/agents/queries.ts
export function agentsQuery(companyId: CompanyId, projectId: ProjectId | undefined)   // como automationsQuery
// apps/web/src/builder/agents/agent-list.tsx
export function AgentList(props: { companyId: CompanyId; projectId?: ProjectId })     // um componente, as duas páginas
```

A página do Início não muda nada: a linha leva à página do agente no Projeto dele, e **Novo agente**
leva à área **Agentes** do Projeto escolhido, onde o Construtor começa a conversa.

### As skills e a leitura

`shadcn`, `impeccable`, `pstack:tdd`; as linhas de `docs/reference/stack.md` para `apps/web/src/`.
[web](../guides/web.md) W7, W29, W30, W34; [data](../guides/data.md) D11; [testing](../guides/testing.md) T5.

### A ordem do trabalho

1. **A prova primeiro.** `routes.test.ts`, "a lista da empresa": dois Projetos com um agente cada; a
   lista sem `projectId` traz os dois, com `projectId`, um; falha hoje.
2. A migração; `lastRunAt` e a gravação no turno (`conversation.test.ts`, "a última execução").
3. `agent-list.tsx` tirado de `area.tsx`, sem mudar a área; a rota do Início, o filtro, **Novo
   agente** e a entrada.
4. `docs/reference/screens.md`. Regras: W7, W29, W34, C21, C26.

### Como se prova

O critério 35 pelo servidor de teste e o Postgres de teste; o 36 pelos testes de `apps/web` com o
servidor dublê; larguras e temas pelo QA da etapa. Comando: os testes tocados, `npm run typecheck`,
`npm run lint`, `npm run check-migrations`.

### Parar se

- A página do Início parece precisar de uma segunda leitura ou de um segundo componente de lista:
  para; a `V1` pede a forma das Automações, uma de cada.
- Gravar `last_run_at` a cada turno aparece no atraso do laço do `HUB_MEMORY`: relata o número; não
  inventar um intervalo.

