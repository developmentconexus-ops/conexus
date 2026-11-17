# Um escopo e a fábrica de ferramentas

Trilho: assistente

Cartão curto da trilha Agentes e Apps, antes de `A1`, pela decisão do fundador de 2026-11-17: "R2 a"
(o primeiro bloco da harness, H0, H1, H3 e H6 do redesenho, é etapa própria). Ele inclui F0 a F4 das
ferramentas únicas e o teto do U3 de permissões, e conserta a issue
https://github.com/developmentconexus-ops/conexus/issues/1147. Lido em `main` `f4ccc150`, com
`@mastra/core` 1.83.0. Referências: Mastra `d60ba71` (`mastra-1.83`, a tag `@mastra/core@1.83.0`, com o
Mastra Code e a Factory em `mastracode/`).

## A página do fundador

**No fim desta etapa** você usa o Assistente, o Builder, o Construtor, os agentes da empresa e as
automações como hoje. Na tela, uma coisa só muda, e ela segue uma regra que você já decidiu: a lista de
conexões de uma conversa do Assistente, ou de uma automação, deixa de oferecer e de nomear uma conexão de
que o papel da pessoa não usa nada. Por dentro, o Conexus passa a ter **um jeito só** de saber de quem e
de onde é cada conversa, e **uma fábrica só** de ferramentas, de onde os quatro agentes tiram as suas.

**O que muda por dentro, em palavras simples.**

- **Um escopo só.** Hoje há seis jeitos de dizer "de quem e de onde é esta conversa", e cada agente
  monta à mão as suas ferramentas. Por isso o Assistente e o Builder listam as conexões cada um do seu
  jeito, a pergunta que você fez em 2026-11-16. Depois desta etapa há um escopo só, lido uma vez por
  resposta, do registro guardado da conversa, como a Factory do Mastra faz.
- **Uma fábrica de ferramentas.** Cada agente recebe as mesmas ferramentas de hoje, agora escritas numa
  tabela, e toda lista que uma ferramenta mostra sai da porta única de permissões. Nenhum agente ganha
  nem perde ferramenta.
- **O Assistente deixa de citar leituras que não pode usar.** Hoje ele lista, para o modelo, leituras ao
  vivo de conexões que a conversa não escolheu, e depois a leitura recusa. Passa a listar só as das
  conexões escolhidas.
- **O agente da empresa não lê mais do que quem conversa com ele.** Hoje a versão publicada de um agente
  substitui a pessoa: o agente lê tudo o que declara, mesmo que quem conversa com ele não tenha o papel
  para isso. Passa a ler o que declara **e** o que o papel de quem conversa alcança. Um agente do
  Administrador, aberto por um Desenvolvedor sem aquela leitura no papel, responde que não alcança. É a
  regra "fora do papel ninguém vê, nem o Desenvolvedor", a sua escolha 1 de 2026-11-16, e a tabela de
  consumidores do desenho da porta única que você aprovou ("1. A forma: a", confirmado com "Sim"). A
  aprovação das escritas não muda: quem toca Aprovar continua precisando da escrita no próprio papel
  (a sua `D3-a`). O app publicado também não muda: ele lê como o Projeto, pela sua decisão 3 (d).
- **Primeiro se apaga.** Antes de construir, sai o que está repetido: o texto fixo do Conexus lido três
  vezes, duas fábricas iguais da ferramenta que lê os dados do app, a frase do limite de 50 chamadas
  escrita à mão em quatro lugares e uma citação velha.

**O roteiro de uso.**

1. Entre como um membro cujo papel não usa nada de uma conexão e abra uma conversa nova do Assistente.
   Essa conexão não aparece na lista. As que o papel usa aparecem como hoje.
2. Escolha uma das conexões e pergunte "Quais leituras ao vivo você tem?". O Assistente fala só das
   leituras dessa conexão.
3. Converse com o Builder num Projeto e peça uma mudança; depois peça uma ferramenta ao Construtor. Os dois
   respondem como hoje.
4. Como Desenvolvedor sem a leitura no papel, converse com um agente que um Administrador publicou e que
   usa essa leitura: o agente diz que não a alcança. Como Dono, o mesmo agente lê como hoje.
5. Rode uma automação sua: ela termina como hoje.

**O que você faz, e quando.** Antes: nada. No começo: esta página está aprovada pela sua palavra
condicional de 2026-11-17, porque segue o redesenho sem decisão nova sua. No fim: faz o roteiro e diz o
que viu.

**Fica de fora.**

- O contrato inteiro com Dados (ligar a leitura ao vivo e a escrita, a H2): a H2a entra no Registro e
  conformidade, pela sua palavra "R3 a"; a H2b vem depois dela.
- O sinal de estado no lugar dos blocos de texto das instruções (a H4) e a ficha de cada agente, com o
  modo de plano e a tabela de aprovação (a H5, que é o `A3`, pela sua "R4 a"). Os blocos `## Data` e
  `## Connections` do Builder ficam onde estão.
- A memória do Projeto no Knowledge: é o item 5 do Brain, na trilha Dados. O Knowledge segue só no
  Assistente.
- O alvo de eval, o MCP de fora e o nome "Estúdio" (H7 a H9): depois, cada um no seu cartão.

**As decisões suas nesta etapa.** Nenhuma nova. A etapa aplica o que você já decidiu: "R2 a", a escolha 1
de 2026-11-16, o desenho da porta única ("1. A forma: a", "Sim"), a `D3-a` da 24.5 e a decisão 3 (d).
As escolhas técnicas são do firstmate, com a evidência e o jeito de desfazer, na tabela "As decisões do
firstmate".

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 | U1 Subtrair | `conexus.md` lido uma vez; uma fábrica do `app_data_read`; a frase do teto de chamadas feita da constante; a citação de `conexus_overview` corrigida | `builder/controller-kit/`, `builder/assistant/`, `builder/construtor/`, `builder/agents/`, `builder/app-data/`, `builder/connectors/`, `hub/connectors/public.ts` | [testing](../guides/testing.md) | nada |
| G1 | U2 Um escopo | `RunScope`, o resolvedor e `principalOf`; a escolha e o consumidor `construtor` na porta; a lista e a criação da conversa nova pela porta (issue 1147); sai `SessionScope` | `builder/controller-kit/`, `builder/assistant/`, `builder/automations/`, `builder/construtor/`, `builder/agents/`, `builder/conversation/`, `builder/tools/`, `hub/access/`, `hub/connectors/`, `hub/data/` | [security](../guides/security.md) | U1 |
| G2 | U3 A fábrica | `builder/company-tools/`: `companyTools`, `TOOLS_OF` e o escopo por closure; toda lista das ferramentas, as skills e a linha de conexões pela vista | `builder/company-tools/`, `builder/assistant/`, `builder/conversation/`, `builder/construtor/`, `builder/agents/`, `builder/data-tools/`, `builder/connectors/`, `.dependency-cruiser.cjs` | [testing](../guides/testing.md) | U2 |
| G2 | U4 O teto | o agente salvo lê o papel de quem o roda ∩ o que a versão declara, na lista, na leitura, no caderno e na escrita | `hub/identity/`, `hub/access/`, `hub/connectors/`, `builder/agents/` | [security](../guides/security.md) | U2, U3 |

Os grupos não correm em paralelo: G2 lê os contratos de G1. Dentro de cada grupo a ordem é a da tabela, um
commit por unidade (delivery L9). `hub/connectors/` e `hub/data/` são da trilha Dados; esta etapa não muda
os verbos do contrato de dados, e nenhuma unidade da trilha Dados está em construção sobre esses arquivos
(delivery L1; decisão F2).

**Orçamento de código alterado.** U1: cerca de 50. U2: cerca de 710. U3: cerca de 560. U4: cerca de 90.
Total da etapa: cerca de 1.410 linhas, das quais cerca de 520 a menos (inferido pela leitura, não medido).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | A mensagem fixa do Construtor e a de um agente são exatamente os bytes de `conexus.md` sem os brancos das pontas; a do Assistente é esses bytes, uma linha em branco e `assistant.md`. Recusa: uma mensagem com um byte a mais ou a menos | `agents/conversation.test.ts`, "o texto do Conexus: o agente e o Construtor mandam os bytes de conexus.md, sem um a mais"; `assistant/instructions.test.ts`, "a mensagem fixa: a mesma em toda conversa…" | must |
| 2 | U1 | As mensagens de sistema de cada conversa (Assistente no Início e num Projeto, Builder, Construtor, agente) são as mesmas antes e depois da unidade. Recusa: qualquer byte diferente | a gravação de antes e depois do passo 5, com o `diff` no pull request | must |
| 3 | U1 | Só `controller-kit/` lê `conexus.md` no código do servidor. Recusa: um segundo leitor fora dos testes | `grep -rn "conexus.md" apps/server/src --include=*.ts`, no pull request | should |
| 4 | U1 | O `app_data_read` do Builder e o do agente têm a mesma descrição e o mesmo esquema, de uma fábrica. Recusa: uma descrição ou um esquema diferente | `app-data/context.test.ts`, "o Builder e o agente recebem o mesmo app_data_read: a mesma descrição e o mesmo esquema" | must |
| 5 | U1 | O `app_data_read` lê, corta, recusa (`NOT_FOUND`, `APP_DATA_NO_APP`, SQLSTATE) e estoura o tempo como hoje, no Builder e no agente | `agents/app-data.test.ts` e `app-data/access.test.ts`, todos os casos, sem mudar | must |
| 6 | U1 | Toda descrição de leitura de conector (o `connector_read` do Builder, do Construtor e do agente; as leituras tipadas do Assistente) diz "At most 50 connector calls per answer.". Recusa: "per run" ou outro número | `conversation/conversation-connectors.test.ts`, "o Builder diz o teto como os outros: At most 50 connector calls per answer" | must |
| 7 | U1 | Fora a descrição de `connector_read` do Builder, nenhuma descrição nem esquema de ferramenta muda em conversa alguma. Recusa: outra descrição diferente | a gravação do passo 5 | must |
| 8 | U1 | O número da frase é o da porta: a 51ª chamada de conector de uma execução volta `CALLS_SPENT` | `conversation/conversation-connectors.test.ts`, "a 51ª chamada de conector numa execução é recusada" | must |
| 9 | U1 | O comentário de `conexus_overview` cita uma linha que existe na `mastra-1.83`. Recusa: um caminho que não existe | revisão: `mastra-1.83` `mastracode/factory/src/tools/read-tools.ts:245` | should |
| 10 | U2 | `GET /assistant/connections`, na empresa e num Projeto, lista só a conexão em que o papel alcança uma operação; o papel "Vazio" recebe `[]`, o dono as duas | `assistant/reach-choice.test.ts`, "a lista da conversa nova não oferece a conexão que o papel não alcança" | must |
| 11 | U2 | Criar com essa conexão: 201, ela não fica escolhida nem aparece em `connections`, e a linha guardada não a tem | idem, "criar com a conexão que o papel não alcança: ela não fica" | must |
| 12 | U2 | `PUT …/connections` com ela: a resposta e a linha não a têm | idem, "trocar para a conexão que o papel não alcança: ela não fica" | must |
| 13 | U2 | Ler a conversa lista só as conexões alcançadas, com `chosen` da linha | idem, "a conversa lida não nomeia a conexão fora do papel" | must |
| 14 | U2 | Criar uma automação com ela: não fica, e o resumo não a nomeia | `automations/reach-choice.test.ts`, "a automação não guarda a conexão que o papel não alcança" | must |
| 15 | U2 | Lei (b) na empresa: toda leitura em `systems[].reads` da `data_describe` é uma leitura tipada oferecida que responde OK; a Filial alcançada e não escolhida não aparece | `assistant/describe-reads.test.ts`, "lei (b) na empresa: o que a descrição lista, a leitura tipada aceita" | must |
| 16 | U2 | O mesmo numa conversa do Assistente num Projeto com as duas liberadas | idem, "lei (b) no Projeto" | must |
| 17 | U2 | Conformidade: os quatro consumidores passam as leis (a), (b) e (e); o Assistente com `CHOSEN` | `hub/access/conformance.test.ts`, os casos por consumidor | must |
| 18 | U2 | `view.list('system')` com `CHOSEN` = escolhidas ∩ alcançadas; com `ANY`, todas as alcançadas; as tabelas iguais nos dois | idem, "lei (b): a escolha estreita os sistemas, não as tabelas" | must |
| 19 | U2 | Uma thread do Assistente com a marca de outra empresa: o turno acaba `CONVERSATION_NOT_FOUND`, sem chamada ao modelo | `assistant/run-scope.test.ts`, "a thread com a marca de outra empresa é recusada antes do modelo" | must |
| 20 | U2 | A marca de Projeto estragada não muda o lugar do turno do Assistente (o da linha vale) | idem, "o lugar do turno vem da linha" | should |
| 21 | U2 | Construtor: a marca de um Projeto que não é da empresa do recurso é recusada `CONVERSATION_NOT_FOUND` | `construtor/run-scope.test.ts`, "a marca de um Projeto de outra empresa é recusada" | must |
| 22 | U2 | A rodada de automação segue sem `propose_app` (`attended: false`) | `assistant/propose.test.ts:113` | must |
| 23 | U2 | Saem `SessionScope`, `ScopeOf`, `projectIn`, `sessionScopes`, `runsOf`, `contextOf`; `npm run deps` passa e nada entra em `.dependency-cruiser-migration.cjs` | `npm run typecheck`, `npm run deps`, o grep do passo 4 | must |
| 24 | U2 | As chaves de marca ficam byte a byte: listar, buscar e apagar conversas de antes funciona | `assistant/list-search.test.ts`, `assistant/release.test.ts`, `construtor/` e `agents/release.test.ts` sem mudar | must |
| 25 | U2 | O agente lê como hoje; o caderno de uma conexão fora da versão é `NOT_GRANTED` | `agents/agent-read.test.ts`, "o caderno de uma conexão que a versão não selecionou é recusado" (novo) | must |
| 26 | U2 | As suítes de `hub/connectors`, `hub/data`, `assistant`, `construtor`, `agents`, `automations`, `conversation` passam sem mudar asserção | as suítes | must |
| 27 | U2 | As instruções de cada agente ficam iguais byte a byte | `assistant/instructions.test.ts`, `conversation/` | should |
| 28 | U2 | O Construtor lê toda conexão que o Projeto recebeu, como hoje (`ANY`) | `construtor/code-tool.test.ts` sem mudar | should |
| 29 | U2 | O banco fora ao listar ou criar: `DATABASE_UNAVAILABLE`, nada guardado | `assistant/database-down.test.ts`, caso novo "a porta fora na criação" | should |
| 30 | U3 | Cada assento recebe no pedido ao modelo os mesmos nomes de ferramenta do `main` `f4ccc150`. Recusa: um nome a mais ou a menos fica vermelho | `company-tools/tool-sets.test.ts`, "cada agente recebe os mesmos nomes de ferramenta de hoje" | must |
| 31 | U3 | Para cada assento e cada ferramenta de `TOOLS_OF`, a resposta não nomeia nada fora da vista. Recusa plantada: `clientes` e `sankhya_clientes` | `company-tools/conformance.test.ts`, "lei (a) por ferramenta: nada de fora da vista aparece pelo nome…" | must |
| 32 | U3 | Toda conexão, leitura e tabela que uma ferramenta lista está na vista do assento | idem, "lei (a) por ferramenta: tudo o que a ferramenta lista está na vista…" | must |
| 33 | U3 | O `search_tools` do Assistente só acha leituras de sistemas da vista. Recusa: a leitura de uma conexão não escolhida não é achada nem carregada | idem, "a busca de leituras só acha as da vista…"; `assistant/typed-reads.test.ts`, "a leitura fora do papel não existe" | must |
| 34 | U3 | Uma conexão recebida sem nenhuma operação no alcance não traz skill nem aparece em `connector_notes` e `connector_read`. Recusa: o nome dela no pedido ao modelo | `company-tools/conformance.test.ts`, "a conexão recebida sem operação no alcance não traz skill nem nome", por assento | must |
| 35 | U3 | A linha "Connections in this conversation" do Assistente, do Construtor e do agente lista só os sistemas da vista | idem, "a linha de conexões das instruções é a da vista" | must |
| 36 | U3 | Uma ferramenta da fábrica responde pelo escopo da closure. Recusa: um `requestContext` com a marca de outra empresa não muda a resposta | idem, "a ferramenta responde pela closure…" | must |
| 37 | U3 | O `conexus_overview` lista as conexões alcançadas no lugar, com `chosen` pela escolha da conversa, e nunca uma não alcançada | idem, "o resumo lista a conexão alcançada e não escolhida…"; `assistant/overview-reach.test.ts` sem mudar | must |
| 38 | U3 | O `copy_runs` responde `NOT_FOUND` para a tabela que a vista não lista, como para a que não existe, também num Projeto | `assistant/copy-runs.test.ts` sem mudar; `conformance.test.ts`, "copy_runs num Projeto só acha a cópia liberada" | must |
| 39 | U3 | O `copy_propose` e o `connector_note_save` do Builder só aceitam conexões da vista. Recusa: o nome de uma conexão fora volta como o de uma que não existe, e nada é gravado | `conformance.test.ts`, "a proposta e a anotação recusam a conexão de fora da vista" | must |
| 40 | U3 | As suítes públicas de hoje passam sem mudar | `assistant.test.ts`, `construtor.test.ts`, `agent.test.ts`, `copy-runs.test.ts`, `overview-reach.test.ts`, `note-save.test.ts`, `conversation/permissions.test.ts` | must |
| 41 | U3 | Nenhum de `offersRead`, `connectionsOffered`, `reachedBy`, `grantedFor`, `admittedFor`, `dataOfScope` e o `builderDataOf` de `builder.ts` resta no `src` | o grep na revisão; `npm run typecheck` | must |
| 42 | U3 | `company-tools` está em `AGENTS_AND_APPS` e a lista de migração não cresce | `npm run deps` | must |
| 43 | U3 | O `## Connections` do Builder é o de hoje, byte a byte, quando toda conexão recebida tem operação no alcance | o teste do critério 13a do passo 20 sem mudar | should |
| 44 | U3 | O `connector_read` do ajudante de pesquisa só nomeia conexões escolhidas da vista | `assistant/research.test.ts` sem mudar; `conformance.test.ts`, assento `research` | should |
| 45 | U3 | A rodada de automação não leva `connector_note_save`, nem para quem administra conexões | `assistant/note-save.test.ts`, "a rodada de automação…" sem mudar | must |
| 46 | U3 | A vista é lida uma vez por execução, e duas no Assistente com conexões escolhidas (`view` e `reach`) | `conformance.test.ts`, "a vista é lida uma vez por execução" | should |
| 47 | U3 | A thread com a marca de outra empresa não monta nenhuma ferramenta da empresa | idem, "a thread com a marca de outra empresa…" | must |
| 50 | U4 | Tirada `pedidos` do papel de quem roda um agente que a declara, a vista seguinte do agente não lista `pedidos` e `may` responde `OUT_OF_REACH` | `hub/access/conformance.test.ts`, "lei (e): mudar o papel muda a vista seguinte, em agent (ROLE)" | must |
| 51 | U4 | Uma versão que declara `empresas`, rodada por um Atendente que só tem `pedidos`: a leitura dá `NOT_IN_ROLE` com o papel e o dublê não recebe o pedido | `hub/connectors/role-doors.test.ts`, "a versão publicada não alarga o papel..." | must |
| 52 | U4 | A versão ainda estreita: com o papel tendo `consultar` e a versão sem declará-la, a consulta livre dá `NOT_IN_ROLE`, e `pedidos`, declarada, lê | `hub/connectors/role-doors.test.ts`, "o funil: uma versão publicada lê só o que declara..." | must |
| 53 | U4 | O catálogo do agente traz o que a versão declara dentro do papel de quem a roda; para quem não tem nenhuma leitura, vem vazio | `hub/data/catalog-role.test.ts`, "a versão do agente lista o que declara dentro do papel de quem a roda" | must |
| 54 | U4 | Pela rota da conversa, o agente salvo rodado por um Desenvolvedor sem a leitura recebe a recusa e o dublê não recebe nada; rodado pelo Dono, lê | `builder/agents/agent-read.test.ts`, "o teto: o agente salvo rodado por um Desenvolvedor sem a leitura..." | must |
| 55 | U4 | A escrita em Faz sozinho de uma versão do Administrador, rodada por um Desenvolvedor sem a escrita no papel, dá `NOT_IN_ROLE`, sem cartão e sem pedido ao Sankhya | `builder/agents/autonomy.test.ts`, "o teto na escrita..." | must |
| 56 | U4 | O agente salvo pede aprovação só na escrita, como hoje; nenhuma leitura suspende, e `D2-a` e `D3-a` valem como antes | `builder/agents/approval.test.ts` (5), (6), (8), (20); `autonomy.test.ts` `D2-a` e `D3-a`; `answer.test.ts`, todos sem mudança | must |
| 57 | U4 | A conversa de teste do rascunho segue o mesmo teto: quem roda sem a leitura recebe a recusa | `builder/agents/agent-read.test.ts`, "o teto do rascunho..." | must |
| 58 | U4 | O caderno da ligação, num agente, segue o papel de quem o roda: sem `consultar` no papel, `NOT_IN_ROLE`; com ele, lê | `hub/connectors/role-doors.test.ts`, "o caderno do agente segue o papel de quem o roda" | should |
| 59 | U4 | O papel tirado no meio da conversa do agente faz a chamada seguinte recusar, sem pedido ao dublê | `hub/connectors/role-doors.test.ts`, "o papel muda no meio da conversa do agente..." | must |
| 60 | U4 | O app publicado lê como o Projeto: quem o abre sem a operação no papel recebe `OK` | `hub/connectors/app-calls.test.ts`, "o app publicado lê como o Projeto..." | must |
| 61 | U4 | A corrida da cópia lê pela operação que declara, como hoje | `hub/connectors/copy-port.test.ts`, sem mudança | should |
| 62 | U4 | Tirar o dono da empresa apaga as automações dele e os runs delas | `builder/automations/release.test.ts`, "tirar uma pessoa apaga as automações dela..." (sem mudança) | must |
| 63 | U4 | O dono rebaixado: o disparo não abre conversa, `SKIPPED` com `OWNER_CANNOT_ASK`, e a automação fica `PAUSED` | `builder/automations/run.test.ts`, "o dono virou membro..." (sem mudança) | must |
| 64 | U4 | O papel do dono estreitado depois da criação: a execução seguinte não recebe a operação e o dublê não recebe o pedido | `builder/automations/role-run.test.ts`, "o papel do dono estreitado depois da criação..." | should |

## A matriz de estados

Nenhuma tela nova e nenhum texto novo. Uma tela muda de conteúdo: a lista de conexões da conversa nova do
Assistente e da automação, e o resumo da conversa e da automação, que passam a mostrar só as conexões de que
o papel usa alguma coisa (critérios 10 a 14). Os estados dessas telas são os de hoje: com o papel que não
usa nenhuma conexão, a lista fica no estado vazio que já existe.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `RunScope.kind`, `owner`, `conversation` | `runResolver` | `principalOf`; as marcas da máquina (`machineMarks`); a fábrica (U3) |
| `RunScope.place` | o `stored` de cada dono | `principalOf`, `speakersOf`, as marcas da máquina |
| `RunScope.choice` | o `stored` (linha do Assistente; `selected` do agente; `ANY` nos outros) | `principalOf` → `Principal.choice` |
| `RunScope.ceiling` | o `stored` do agente | `principalOf` → `declared`; U4 |
| `RunScope.attended` | o `stored` do Assistente (marca de automação) | a lista de ferramentas (`propose_app`); U3 |
| `Principal.choice` | `principalFor` | `createAccess.viewFor`, `assistant-port.ts` `readable`, `write.ts:81` |
| `CompanyToolScope.run` | `resolveRun` (U2) | `companyTools`, `companyConnections`, o resumo (`chosen`) |
| `CompanyToolScope.view` | `companyToolScope` | toda ferramenta, `inView`, o filtro do `search_tools` |
| `CompanyToolScope.reach` | `companyToolScope` | só o `conexus_overview` |
| `CompanyToolScope.grants` | cada montagem (`maysOf` no Assistente, `data.access` no Builder, `frozen.appData` no agente) | a poda de `companyTools` |
| `TOOLS_OF` | `company-tools/names.ts` | `companyTools`; `tool-sets.test.ts` |
| `Speaker` `AGENT` (`personId`, `role`, `declared`) | `withinVersion`, chamado por `access/public.ts`, `assistant-port.ts` `mayAsk` e `write.ts` `admitted` | `may-use.ts` `mayUseEach`, `speaking.ts` `mayUseNotebook`, `roleOfSpeaker` (`read.ts:147`, `write.ts:107`) |
| `WriteRequest.speaker` `AGENT` (`personId`, `declared`) | `builder/agents/tools.ts` `requestOf` | `write.ts` `admitted`; `write-record.ts` `aboutOf` (pela `agentId`) |
| `Declared` | `builder/agents/frozen.ts` `declaredOf` (`:262-271`) | `may-use.ts`; `access/model.ts`; `Principal.declared` |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Criar a conversa do Assistente (`openConversation`: a porta lê, `chosen.keep` grava, depois a thread) | a mesma chave dá o mesmo id; outro lugar, `IDEMPOTENCY_CONFLICT` (já, `routes.test.ts:32`); o papel que muda entre a leitura da porta e a gravação vale na próxima leitura (cada chamada confere, S10) | cortada depois da linha: a repetição acha a linha e termina, com a primeira escolha (`create.test.ts:22`) | o banco fora na porta: 503 `DATABASE_UNAVAILABLE`, nada guardado | `ASSISTANT_CONVERSATION_CREATED` uma vez | 11, 29 |

As outras gravações não mudam: `connector_note_save` e `copy_propose` gravam como hoje e só aceitam as
conexões da vista (critério 39); a escrita recusada pelo teto do agente não grava linha, porque a admissão
vem antes do registro (critério 55).

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O texto fixo do Conexus | U1 | lido três vezes: `assistant/instructions.ts:19-24`, `construtor/construtor.ts:59-62`, `agents/agent.ts:50-53` | `mastra-1.83` `mastracode/sdk/src/agents/prompts/index.ts:89-91,164` | um construtor do prompt, um dono do texto base | nativo: uma constante em `controller-kit/instructions.ts` ao lado de `fixedSystem` | — | — | — |
| A ferramenta `app_data_read` | U1 | duas fábricas, `app-data/tools.ts:65-86` e `:108-117`, com a mesma `READ_DESCRIPTION` (`:25-26`) | `mastra-1.83` `mastracode/factory/src/tools/index.ts:45-56` | cada ferramenta definida uma vez; o conjunto as reúne | nativo: uma função `createTool`, cada conjunto liga a sua porta | — | — | — |
| O teto de chamadas no texto das ferramentas | U1 | o número em `hub/connectors/builder-port.ts:33`; a frase à mão em `construtor/construtor.ts:215`, `agents/agent.ts:256`, `assistant/connector-access.ts:13`, `connectors/connector-tools.ts:86` ("per run") | `mastra-1.83` `mastracode/factory/src/tools/read-tools.ts:39,218`; `audit-events-tool.ts:15,59` | a descrição escreve o teto a partir da constante que a contagem usa | nativo: `answerWords` lê `CONNECTOR_CALLS_PER_TURN` | — | — | — |
| A citação de `conexus_overview` | U1 | `assistant/overview.ts:21`, caminho que não existe na 1.82 nem na 1.83 | `mastra-1.83` `mastracode/factory/src/tools/read-tools.ts:222,245` | `factory_list_work_items` em `createFactoryReadTools` | nativo: só o comentário | — | — | — |
| O escopo de uma execução | U2 | quatro resolvedores (`assistant/context.ts:48-58`, `construtor/construtor.ts:108-122`, `agents/controller.ts:78-87`, `conversation/turn-of.ts:21-31`) e `SessionScope` (`hub/connectors/scope.ts:9-19`) | `mastra-1.83` `mastracode/factory/src/tools/scope.ts:52-58,85-88,107,118`; `factory.ts:1980-1993` | da linha guardada e de quem chama, nunca da marca; outra organização, nada; uma vez, por closure | nativo | — | — | `builder/controller-kit/run.ts` |
| A marca da thread | U2 | três esquemas (`SESSION_MARK`, `CONSTRUTOR_MARK`, `AGENT_MARK`) | `mastra-1.83` `packages/core/src/agent-controller/agent-controller.ts:539,562`; `scope.ts:52-56` | `tags` em `createSession`; a marca não decide sozinha | nativo | — | — | idem |
| A escolha na porta | U2 | `hub/access/model.ts:21-31` sem escolha; `hub/data/public.ts:47-48` | code C81; `hub/access/view.ts:27` | a lista e a execução saem da mesma vista | nativo | — | — | — |
| A lista da conversa nova e a criação | U2 | `assistant/routes.ts:204`, `open.ts:85-93,137`, `automations.ts:90,161` por `visibleTo` | `hub/access/view.ts:27`; issue 1147 | o sistema sem operação alcançada sai | nativo | — | — | — |
| A fábrica de ferramentas da empresa | U3 | quatro `tools:` à mão: `assistant.ts:247-264`, `builder.ts:172-191`, `construtor.ts:197-222`, `agent.ts:249-290` | `mastra-1.83` `mastracode/factory/src/tools/index.ts:33-56`; `factory.ts:1898-1912,1980-1994`; `mcp/routes.ts:178-190` | um conjunto para um escopo resolvido, com o subconjunto por tipo dentro da fábrica e nome repetido recusado | nativo | — | — | `company-tools/factory.ts`, `names.ts` |
| O escopo por closure | U3 | `data-tools/tools.ts:175-179`, `copy-runs.ts:96`, `overview.ts:39` leem o `requestContext` | `tools/index.ts:34-36`; `read-tools.ts:222-223`; `@mastra/core` 1.83 `reference-agents-agent.md:558,564` | a ferramenta recebe o escopo e as portas na construção; só a função `tools` lê o pedido | nativo | — | — | `company-tools/scope.ts` |
| As leituras tipadas sob demanda | U3 | `typed-search.ts:34-40`; `offersRead`, `typed-reads.ts:59-67` | `reference-processors-tool-search-processor.md:48,100-127` (`filter`); `:131,157` (`includeResolvedTools` esconde tudo) | catálogo fixo na construção, filtro por pedido | nativo: o `filter` lê `scope.view` | — | — | `company-tools/search.ts` |
| As listas, as skills e a linha de conexões | U3 | `overview.ts:98-130`; `copy-runs.ts:103`; `builder.ts:44-87,165-170`; `construtor.ts:143,163-166,192`; `agent.ts:199,331-335`; `assistant.ts:265-270` | `hub/access/view.ts:19-38`; code C81; `read-tools.ts:223` | cada lista lê só o escopo resolvido | nativo | — | — | `company-tools/listed.ts` |
| `kitReads` e `legacyTools` | fica de fora | `agent.ts:173-184`; `agents.ts:181,227,276`; `tools/check.ts:50` | — | — | nativo, sem mudança: fica de fora, porque a edição e as versões anteriores à E4 ainda os usam; o teto da U4 vale nelas na chamada | — | — | — |
| O alcance do agente salvo (lista e execução) | U4 | `may-use.ts:93`; `access/public.ts:46-51`; `assistant-port.ts:129`; `speaking.ts:97`; `agents/tools.ts:177-185`; `write.ts:101` | `mastra-1.83` `mastracode/factory/src/tools/scope.ts:96-104`; `better-auth@1.7.8` `dist/plugins/organization/has-permission.mjs:7` | a sessão de uma pessoa age como quem entrou, resolvida a cada vez; o papel decide pelo `hasPermission` | embrulhado: o `hasPermission` decide o papel, e o nosso código só acrescenta a interseção com a declaração da versão | critérios 50 a 59 | 1(a), 2026-11-16; opção 1 "fora do papel ninguém vê", 2026-11-16; `C1`, 2026-11-06 (segue valendo na publicação) | — |
| A automação roda como o dono, pelo papel de agora | U4 | `automations/run.ts:79-90,205-215`; `assistant-port.ts:121-129` | `mastra-1.83` `mastracode/factory/src/tools/scope.ts:96,99-100` | o trabalho sem pessoa age como o dono da linha | nativo, já no `main` | critérios 62 a 64 | e242 (automações) | — |
| O app publicado lê como o Projeto | fica de fora (decisão 3(d)) | `app-calls.ts:102-107` | `mastra-1.83` `mastracode/factory/src/tools/scope.ts:96-100` (o trabalho sem pessoa age como a linha guardada) | o app tem o seu principal; quem o usa é a lista do app | nativo, já no `main` | critério 60 | 3(d), 2026-11-16 | — |

**A medida do transplante.** Nada vem do repositório antigo.

**A dívida.**

- `keptRun` (leitor guardado do agente, com seis chamadores de rota) e `InProject` (o id de rota do S8)
  ficam; só sai o uso deles como escopo do turno.
- As chaves das marcas de thread ficam as de hoje, sob um dono só (`RUN_MARKS`), para não migrar threads
  guardadas.
- `kitReads` e `legacyTools` seguem para as versões de agente salvas antes da E4; o teto da U4 vale nelas
  na chamada.
- As leituras tipadas do Assistente resolvem o escopo pelo pedido, não por closure, porque o catálogo do
  `ToolSearchProcessor` é fixo na construção; o filtro lê a mesma vista.
- Num Projeto, a tabela sai da liberação ao Projeto, não do papel de quem conversa, para o Builder, o
  Construtor e o agente. A leitura com o login do papel é da etapa do Registro e conformidade (U4 de
  permissões, `view.read`).

## As decisões do firstmate

| # | Decisão reversível ([delivery L6](../guides/delivery.md)) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| F1 | A automação não ganha variante de teto: roda como o Assistente do dono, com `choice: CHOSEN` das conexões dela e `attended: false` | o que ela declara são as conexões dela, que já chegam como escolha (C26); o dono que sai ou é rebaixado já para a automação (`automations/release.test.ts:84`, `run.test.ts:196`) | uma variante `AUTOMATION` em `Ceiling` |
| F2 | A U2 muda `hub/connectors/` e `hub/data/` (trilha Dados) na própria unidade, sem um pull request de Dados antes | os verbos do contrato de dados (`company-data.ts`) não mudam, e o pedido por issue `contrato` vale para eles; nenhuma unidade de Dados está em construção (L1); a H1, aprovada pela "R2 a", tira `SessionScope` de `hub/connectors` | separar os passos 1 e 2 da U2 num pull request da trilha Dados |
| F3 | Criar ou trocar a escolha com uma conexão fora do alcance descarta a conexão, sem código de recusa novo | é o que a criação já faz com a conexão que o lugar não oferece (`packages/hub-api/src/assistant.ts:275`, `routes.test.ts:32,127`) | um código de recusa próprio |
| F4 | A descrição do `connector_read` do Builder diz "per answer", como as outras | o Builder conta por `RunId`, que nasce a cada execução (`runs/runs.ts:120`), e os outros por `TurnKey` (`controller-kit/turns.ts:103-105`): as duas contam uma resposta; ninguém vê a descrição | voltar a palavra |
| F5 | O `copy_runs` num Projeto acha só as cópias liberadas ao Projeto | segue a vista, como a `data_describe` do mesmo lugar (code C81) e a conversa num Projeto, "a pessoa ∩ o Projeto" (C(b), dita pelo fundador) | voltar a lista da empresa no `copy_runs` |
| F6 | `Choice` e `Place` moram em `hub/access/model.ts`; o tipo de conversa é o `ControllerKind` de hoje; o agente salvo também leva `choice` (as ligações que a versão selecionou) | `hub/` não importa `builder/` (`hub-does-not-import-builder`); `controller-kit/kinds.ts:19-26` já é o dono (C26); com `ANY` a versão leria o caderno de toda conexão do Projeto (`agents/agent.ts:185-192`) | mover os tipos |
| F7 | A ferramenta de uma versão que o papel de quem roda não alcança continua na lista do modelo e recusa na chamada com `NOT_IN_ROLE` | a lista de ferramentas não muda nesta etapa; esconder a escrita tiraria o cartão de aprovação que a `D3-a` confere (`autonomy.test.ts:283`); o catálogo (`data_describe`) já não a lista (critério 53) | filtrar as ferramentas da versão pela vista na fábrica |
| F8 | O `Speaker` ganha a variante `AGENT` (pessoa, papel e declaração); `VERSION` fica para o app publicado e a corrida da cópia | `app-calls.ts:104-107` e `copy-port.ts:125-130` falam como a versão e não mudam (3(d)) | juntar as variantes |
| F9 | As ferramentas do Knowledge ficam fora de `CompanyToolName` | são do Mastra, entram pelo `knowledge` do agente e não por `tools:` (`assistant/company-memory.ts:11-15,345-353`) | trazê-las para a fábrica quando a memória do Projeto entrar |
| F10 | `conexus.md` fica em `conversation/prompt/`; o dono da leitura é `controller-kit/instructions.ts` | dois testes leem o arquivo pelo caminho (`assistant/instructions.test.ts:23`, `agents/conversation.test.ts:31`) | mover o arquivo |

## U1 Subtrair

**Base e modelo.** `main` `f4ccc150`, `@mastra/core` 1.83.0. Sonnet: quatro deduplicações dentro de
`apps/server/src/builder/`, sem desenho entre módulos, sem concorrência e sem algoritmo. Nenhuma
ferramenta entra ou sai de agente algum e nenhum texto de tela muda.

### As linhas da tabela

1. **O texto fixo do Conexus.** Na base, `builder/conversation/prompt/conexus.md` é lido três vezes:
   `assistant/instructions.ts:19-24` (lê, faz `trim` de cada parte e junta com `assistant.md` por
   uma linha em branco), `construtor/construtor.ts:59-62` e `agents/agent.ts:50-53` (lê e faz
   `trim`). Os três já importam `fixedSystem` de `controller-kit/instructions.ts:7` por
   `controller-kit/public.ts:4`. O Builder (`conversation/`) não lê este arquivo; o prompt dele é
   `conversation/prompt/builder.md`. Referência: o Mastra Code monta o prompt por um dono só e
   junta as seções num lugar (`mastra-1.83` `mastracode/sdk/src/agents/prompts/index.ts:89-91`,
   `buildFullPrompt`; `:164`, `buildBasePrompt` chamado uma vez).
2. **A ferramenta `app_data_read`.** Na base há duas fábricas em `app-data/tools.ts`: `appDataTools`
   (`:65-86`, a dos agentes, id `AGENT_TOOL.appDataRead`) e `builderAppDataTools` (`:108-117`, a do
   Builder, id `APP_DATA_TOOL.read`). As duas usam `READ_DESCRIPTION` (`:25-26`), `AppDataInput`
   (`:12`), `answered` (`:42-53`) e `withDeadline` (`:56-59`); só muda a porta que lê (`AppDataPort.read`,
   `app-data/port.ts:16-21`, ou `BuilderData.read`, `hub/apps/builder-data.ts:20`). O id é o mesmo
   (`packages/hub-api/src/agents.ts:165`, `AGENT_TOOL = { appDataRead: APP_DATA_TOOL.read }`).
   Referência: a Factory define cada ferramenta uma vez e cada conjunto a reúne
   (`mastra-1.83` `mastracode/factory/src/tools/index.ts:45-56`, `createFactoryTools`).
3. **O teto de chamadas no texto das ferramentas.** O número tem dono no Hub:
   `hub/connectors/builder-port.ts:33` (`CONNECTOR_CALLS_PER_TURN = 50`), usado por
   `createSpending` (`:122-133`) e hoje exportado só para testes (`hub/connectors/test-app-calls.ts:24`).
   A frase repete o número à mão em quatro lugares: `construtor/construtor.ts:215` e
   `agents/agent.ts:256` (`'50 connector calls per answer'`), `assistant/connector-access.ts:13`
   (`ASSISTANT_LIMIT`, o mesmo texto, lido também por `assistant/typed-search.ts:35`) e
   `connectors/connector-tools.ts:86` (`'50 connector calls per run'`, a do Builder). O texto entra
   na descrição de `connector_read` (`connector-tools.ts:248`) e de cada leitura tipada
   (`connectors/typed-reads.ts:105`), pela `answerWords` (`connector-tools.ts:197-199`). Referência:
   a Factory escreve o teto na descrição a partir da constante, que outra ferramenta importa
   (`mastra-1.83` `mastracode/factory/src/tools/read-tools.ts:39`, `MAX_LIST = 50`; `:218`,
   `` `Default ${DEFAULT_LIST}, max ${MAX_LIST}.` ``; `audit-events-tool.ts:15,59`).
4. **A citação de `conexus_overview`.** `assistant/overview.ts:21` cita "Factory `factory_overview`,
   `supervisor/read-tools.ts:187`". Nem a `mastra-1.83` nem a `mastra-1.82` têm a pasta
   `supervisor/` ou uma ferramenta `factory_overview`. A irmã real na 1.83 é
   `factory_list_work_items` (`mastra-1.83` `mastracode/factory/src/tools/read-tools.ts:245-286`),
   dentro de `createFactoryReadTools` (`:222`): a lista da Factory com contagens, cortada em
   `MAX_LIST` (`:39`), como o "at most 50" da descrição de `conexus_overview` (`overview.ts:36`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/controller-kit/` (`instructions.ts`, `public.ts`) | cria a constante do texto do Conexus, ao lado de `fixedSystem` | `assistant/instructions.ts`, `construtor/construtor.ts`, `agents/agent.ts` |
| `builder/assistant/` (`instructions.ts`, `connector-access.ts`, `typed-search.ts`, `overview.ts`) | apaga a leitura de `conexus.md`, `ASSISTANT_LIMIT` e o argumento do teto; corrige um comentário | `assistant/assistant.ts` |
| `builder/construtor/construtor.ts` | apaga a leitura de `conexus.md` e o `limit` da `wording` | `construtor/public.ts` |
| `builder/agents/agent.ts` | apaga a leitura de `conexus.md` e o `limit` da `wording` | `agents/controller.ts` |
| `builder/app-data/tools.ts` | as duas fábricas passam a montar `app_data_read` por uma função privada; os nomes exportados ficam | `conversation/builder.ts:186`, `agents/agent.ts:270`, os testes de `app-data/` |
| `builder/connectors/` (`connector-tools.ts`, `typed-reads.ts`, `test-access.ts`) | `wording` perde `limit`; `answerWords` e `typedReads` perdem o parâmetro do teto | `assistant/`, `construtor/`, `agents/`, `conversation/builder.ts` |
| `hub/connectors/public.ts` (Plataforma) | exporta `CONNECTOR_CALLS_PER_TURN` (C4) | `builder/connectors/connector-tools.ts` |
| `builder/connectors/typed-reads-openai.test.ts` | perde o segundo argumento de `typedReads` (`:75`); nenhuma asserção muda | o próprio teste |

`builder/conversation/prompt/conexus.md` fica onde está: dois testes o leem por esse caminho
(`assistant/instructions.test.ts:23`, `agents/conversation.test.ts:31`).

### Os contratos que a unidade cria

Nenhuma rota, coluna, código de falha ou tipo do `@conexus/hub-api`. As peças internas:

```ts
// apps/server/src/builder/controller-kit/instructions.ts, exportada por controller-kit/public.ts
export const CONEXUS_PROMPT: string          // conexus.md lido uma vez, com trim

// apps/server/src/builder/app-data/tools.ts, privada
type AppReadOf = (
  statement: SqlStatement,
  signal: AbortSignal,
) => Promise<AppRead | { kind: 'REFUSED'; code: 'NOT_FOUND' }>
function appDataReadTool(read: AppReadOf): ReturnType<typeof createTool>
// appDataTools(deps) e builderAppDataTools(deps) mantêm as assinaturas de hoje

// apps/server/src/builder/connectors/connector-tools.ts
export type ConnectorAccess = { /* ... */ wording: { whose: string } }   // sai `limit`
export function answerWords(): string
// apps/server/src/builder/connectors/typed-reads.ts
export function typedReads(accessOf: AccessOf): ToolSearchProcessorOptions['tools']

// apps/server/src/hub/connectors/public.ts
export { CONNECTOR_CALLS_PER_TURN, TURNS_KEPT } from './builder-port.ts'
```

Apaga: `ASSISTANT_LIMIT` (`assistant/connector-access.ts:13`), os três `FIXED` lidos de
`conexus.md`, o campo `wording.limit` e o parâmetro `limit` de `typedTool`/`typedReads`.

- **Cada estado.** Nenhum novo. `AppDataCheckOutput` (`app-data/tools.ts:91-99`) segue a união por
  `kind` (C21).
- **Cada id.** Nenhum novo; `CompanyId`, `PersonId`, `ProjectId` seguem marcados (C23).
- **O dono de cada fato.** O texto do Conexus: `controller-kit/instructions.ts` (C4: o que as
  conversas dividem mora em `controller-kit/`, regra `conversations-do-not-import-the-assistant`
  do `.dependency-cruiser.cjs`). O número 50: `hub/connectors/builder-port.ts:33`. A frase do teto:
  `answerWords` em `connectors/connector-tools.ts`. A ferramenta `app_data_read`: `appDataReadTool`
  (C26, e nenhum clone do jscpd nas linhas mudadas).
- **O esquema Zod.** Nenhuma entrada externa nova; `AppDataInput` segue o de hoje (C27).
- **O arquivo modelo.** `app-data/tools.ts` depois da unidade: cumpre C21 (a união por `kind`), C23
  (ids marcados) e C26 (uma descrição, uma ferramenta). É modelo.

### As skills e a leitura

`docs/reference/stack.md`, linhas de `apps/server/src/builder` (`@mastra/core`, `@mastra/memory`,
`@mastra/pg`, `ai`): a skill `mastra`. Ler primeiro `createTool` no `dist/docs` do `@mastra/core`
1.83.0 instalado. Guia além do de código: `docs/guides/testing.md` (T5, T26, T27).

### A ordem do trabalho

1. **Um dono do texto do Conexus.** Critérios: 1, 2, 3.
   - **Arquivos:** muda `controller-kit/instructions.ts`, `controller-kit/public.ts`,
     `assistant/instructions.ts`, `construtor/construtor.ts`, `agents/agent.ts`.
   - **Referência a seguir:** `mastra-1.83` `mastracode/sdk/src/agents/prompts/index.ts:89-91,164`.
   - **O que sai:** `FIXED` de `construtor.ts:59-62` e `agent.ts:50-53` e a primeira entrada do
     array de `assistant/instructions.ts:20`, com os `readFileSync` que sobrarem sem uso.
   - **O que entra:** `CONEXUS_PROMPT` lido por `new URL('../conversation/prompt/conexus.md',
     import.meta.url)` com `.trim()`; o Construtor e o agente passam `fixedSystem(CONEXUS_PROMPT)`; o
     Assistente monta `[CONEXUS_PROMPT, assistant.md com trim].join('\n\n')`, os mesmos bytes de
     hoje. Regras: C4, C26.
   - **Testes:** `agents/conversation.test.ts`, caso novo "o texto do Conexus: o agente e o
     Construtor mandam os bytes de conexus.md, sem um a mais"; os de hoje sem mudar.
   - **Mutações à mão:** tirar o `.trim()` da constante (fica vermelho
     `assistant/instructions.test.ts`, "a mensagem fixa…", e o caso novo); juntar o Assistente com
     `'\n'` (fica vermelho "a mensagem fixa…").
   - **Pronto quando:** `grep -rn "conexus.md" apps/server/src --include=*.ts` mostra só
     `controller-kit/instructions.ts`, o comentário de `assistant/instructions.ts:17` e os dois
     testes.
2. **Uma fábrica de `app_data_read`.** Critérios: 4, 5.
   - **Arquivos:** muda `app-data/tools.ts`.
   - **Referência a seguir:** `mastra-1.83` `mastracode/factory/src/tools/index.ts:45-56`;
     `@mastra/core` 1.83.0 `createTool`.
   - **O que sai:** os dois `createTool` de leitura (`:72-84` e `:111-117`).
   - **O que entra:** `appDataReadTool(read)` com o id `APP_DATA_TOOL.read`, `READ_DESCRIPTION`,
     `AppDataInput` e `answered(await read({ text: sql }, withDeadline(abortSignal)))`.
     `appDataTools` passa `(statement, signal) => deps.appData.read({ scope: deps.scope, projectId:
     deps.projectId, statement, signal })`; `builderAppDataTools` passa
     `(statement, signal) => data.read(ids, statement, signal)`. Regras: C26.
   - **Testes:** `app-data/context.test.ts`, caso novo "o Builder e o agente recebem o mesmo
     app_data_read: a mesma descrição e o mesmo esquema", no molde de `:257-275` (portas que nunca
     são chamadas); `agents/app-data.test.ts` e `app-data/access.test.ts` sem mudar.
   - **Mutações à mão:** `answered` trocado por devolver a leitura crua (fica vermelho
     `app-data/access.test.ts`, "o Builder lê com o corte das leituras de conector", e
     `agents/app-data.test.ts`, "lê: a ferramenta devolve as linhas…"); a porta do agente sem
     `withDeadline` (deve ficar vermelho `agents/app-data.test.ts`, "o tempo…"; se o tempo do banco
     a esconder, T27: um caso que a mate, ou a linha que a declara equivalente).
   - **Pronto quando:** `npm run quality -- --fast` não acha clone em `app-data/tools.ts`.
3. **Um dono da frase do teto.** Critérios: 6, 7, 8.
   - **Arquivos:** muda `hub/connectors/public.ts`, `connectors/connector-tools.ts`,
     `connectors/typed-reads.ts`, `connectors/test-access.ts`, `connectors/typed-reads-openai.test.ts`
     (só o argumento), `assistant/connector-access.ts`, `assistant/typed-search.ts`,
     `construtor/construtor.ts`, `agents/agent.ts`.
   - **Referência a seguir:** `mastra-1.83` `mastracode/factory/src/tools/read-tools.ts:39,218`;
     `audit-events-tool.ts:15,59`.
   - **O que sai:** `ASSISTANT_LIMIT` e seu import em `typed-search.ts:7`; o `limit` das quatro
     `wording` e de `test-access.ts:46`; o parâmetro `limit` de `answerWords`, `typedTool` e
     `typedReads`.
   - **O que entra:** `answerWords()` escreve
     `` `At most ${CONNECTOR_CALLS_PER_TURN} connector calls per answer.` `` no lugar de
     `` `At most ${limit}.` ``. Regras: C4, C26.
   - **Testes:** `conversation/conversation-connectors.test.ts`, caso novo "o Builder diz o teto como
     os outros: At most 50 connector calls per answer", lendo `descriptions.connector_read` de
     `on.calls`; "a 51ª chamada de conector numa execução é recusada" sem mudar.
   - **Mutações à mão:** `per answer` volta a `per run` (fica vermelho o caso novo);
     `CONNECTOR_CALLS_PER_TURN` vira 51 (ficam vermelhos o caso novo e "a 51ª chamada…").
   - **Pronto quando:** `grep -rn "connector calls per" apps/server/src --include=*.ts` mostra uma
     linha, a de `answerWords`.
4. **A citação.** Critério: 9.
   - **Arquivos:** muda o comentário de `assistant/overview.ts:20-24`.
   - **O que entra:** "Factory `factory_list_work_items`, `mastracode/factory/src/tools/read-tools.ts:245`
     (`createFactoryReadTools`, Mastra 1.83)". Nenhuma linha de código.
   - **Pronto quando:** o revisor abre a linha na `mastra-1.83` e acha a ferramenta.
5. **A gravação de antes e depois.** Critérios: 2, 7.
   - **O que entra:** um teste temporário, fora do commit, que roda um "Oi" de cada conversa pela
     porta pública (o Assistente no Início e num Projeto, `assisting`; o Builder, `conversing`; o
     Construtor, `building`; um agente publicado, `agentsOn`) e grava de cada primeira chamada ao
     modelo o `Sent` de `platform/test-anthropic-body.ts` (`systems`, `tools`, `descriptions`,
     `schemas`) num JSON, com ids e a data trocados por marcas fixas. Rodado em `f4ccc150` e no
     commit da unidade; o `diff` dos dois vai no pull request (T26: a forma vem da chamada real ao
     modelo de teste, nada escrito à mão).
   - **Pronto quando:** o `diff` mostra uma linha só, a descrição de `connector_read` do Builder,
     `per run` para `per answer`.

### Como se prova

- **1, 3.** `agents/conversation.test.ts` (caso novo) e `assistant/instructions.test.ts`, "a mensagem
  fixa…", comparam o texto que o modelo de teste recebeu com os bytes do arquivo. Hoje o caso novo
  passa: a unidade não muda comportamento, e as mutações provam que ele vê um byte a mais.
- **2, 7.** A gravação do passo 5, com o `diff` no pull request.
- **4.** O caso novo de `app-data/context.test.ts`; a mutação de trocar a descrição de uma das
  fábricas o deixa vermelho.
- **5.** `agents/app-data.test.ts` e `app-data/access.test.ts` sem mudar uma linha.
- **6, 8.** O caso novo de `conversation-connectors.test.ts` e "a 51ª chamada…"; hoje o caso novo
  falha, porque o Builder diz `per run`.
- **9.** Leitura da linha citada.

Os testes de hoje do Assistente (`assistant/`), do Construtor (`construtor/`) e dos agentes
(`agents/`) passam sem mudar; muda só a chamada em `connectors/typed-reads-openai.test.ts:75` e o
ajudante `connectors/test-access.ts:46`.

### Parar se

- O `diff` do passo 5 mostrar qualquer outra diferença além da descrição de `connector_read` do
  Builder: a unidade mudou texto de modelo; volte e ache o byte.
- `dependency-cruiser` recusar o import de `CONNECTOR_CALLS_PER_TURN` por `hub/connectors/public.ts`
  em `builder/connectors/`: pare e reporte, não copie o número.
- A U2 já tiver mudado `hub/connectors/public.ts` no mesmo grupo: junte as duas mudanças no mesmo
  arquivo, sem reescrever a da U2.

## U2 Um escopo

**Base e modelo.** `main` `f4ccc150`, `@mastra/core` 1.83.0. Opus: o desenho cruza `hub/access`,
`hub/connectors`, `hub/data` e as quatro conversas de `builder/`, e muda o tipo que 29 arquivos
importam.

### As linhas da tabela

- **O escopo de uma execução.** Ler na base: `assistant/context.ts:40-58` (`ScopeOf`,
  `sessionScopes`), `construtor/construtor.ts:108-122` (`scopes`), `agents/controller.ts:59-87`
  (`keptRun`, `runsOf`), `conversation/turn-of.ts:21-31,75-87` (`conversationOf`, `projectIn`),
  `hub/connectors/scope.ts:5-30`. Seguir `mastra-1.83` `mastracode/factory/src/tools/scope.ts:52-58`
  (o escopo vem da linha guardada, nunca da marca sozinha), `:85-88` (a linha de outra organização
  não age), `:107` (o projeto lido com a organização de quem chama), `:118` (`interactive`, que aqui
  é `attended`); `mastracode/factory/src/factory.ts:1980-1993` (resolvido uma vez, entregue por
  closure a `createFactoryTools`).
- **A marca da thread.** Ler `assistant/context.ts:14-20` (`SESSION_MARK`), `construtor/open.ts:13-26`
  (`CONSTRUTOR_MARK`), `agents/controller.ts:50-56` (`AGENT_MARK`), `assistant/open.ts:68-112`.
  Seguir `mastra-1.83` `packages/core/src/agent-controller/agent-controller.ts:539,562` (`createSession`
  com `tags: Record<string, string>`) e `:732` (o `controller` na `requestContext`), com o tipo em
  `types.ts:1142`.
- **A escolha na porta.** Ler `hub/access/model.ts:16-31`, `principal.ts:40-61`, `public.ts:35-58`,
  `view.ts:19-28`, `hub/data/public.ts:41-63` (`contextOf` manda o Assistente num Projeto como
  `builder`, `:47-48`). Regra: code C81.
- **A lista da conversa nova e a validação (issue 1147).** Ler `assistant/routes.ts:91-107,200-212,271-283`,
  `assistant/open.ts:84-93,137`, `automations/automations.ts:90,161`. A causa:
  `hub/connectors/speaking.ts:69-80` (`visibleTo`) filtra as leituras e mantém a conexão sem
  nenhuma; a porta já a tira (`hub/access/view.ts:27`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `hub/access/` (`model.ts`, `principal.ts`, `public.ts`, `view.ts`) | muda: `Choice`, `chosenIn`, o consumidor `construtor`, `assistant` com `place`, `Principal.choice`, o corte por escolha na vista; exporta `Place`, `Declared`, `Choice` | `hub/data/`, `hub/connectors/`, `builder/controller-kit/run.ts`, `builder/assistant/routes.ts`, `automations/automations.ts`, `main.ts` |
| `hub/access/conformance.test.ts` (trilha Dados, o teste do contrato) | muda: cenários por `Principal`; `assistant` com `CHOSEN`; cenário `construtor` | — |
| `hub/connectors/` (trilha Dados): `scope.ts`, `assistant-port.ts`, `write.ts`, `write-record.ts`, `approval.ts`, `tool-door.ts`, `public.ts` | `scope.ts` perde `SessionScope` e `Place`; `idsOf` passa a receber `Principal`; as portas recebem `Principal`; `readable` (`:169`) e `write.ts:81` leem `chosenIn` | as conversas de `builder/`, `conversations-of.ts` |
| `hub/data/` (trilha Dados): `public.ts`, `query.ts`, `rows.ts` | apaga `contextOf`; `createCompanyData` recebe `Principal` | `main.ts:213`, `conversations-of.ts:164` |
| `builder/controller-kit/` | cria `run.ts`; `public.ts` exporta | as quatro conversas |
| `builder/assistant/` | apaga `ScopeOf`, `sessionScopes`, `scopeOn`, `SESSION_MARK`, `offeredOnly`; muda `assistant.ts`, `routes.ts`, `open.ts`, `overview.ts`, `research.ts`, `typed-search.ts`, `propose.ts`, `connector-access.ts`, `turn.ts`, `company-memory.ts`, `propose-company-memory.ts`, `copy-runs.ts`, `search.ts`, `release.ts`, `test-assistant.ts` | `automations/`, `conversations-of.ts` |
| `builder/automations/automations.ts` | a lista e a criação pela porta com `ANY` | rotas de automação |
| `builder/construtor/` (`construtor.ts`, `open.ts`, `routes.ts`) | apaga `scopes` e o `door` de `:200-204`; marcas por `RUN_MARKS` | — |
| `builder/agents/` (`agent.ts`, `controller.ts`, `tools.ts`, `code-tools.ts`, `open.ts`, `conversation-routes.ts`) | apaga `runsOf`; o plano lê `RunScope`; `keptRun` vira o leitor guardado do agente | `construtor/draft-trial.ts` |
| `builder/conversation/` (`turn-of.ts`, `builder.ts`) | apaga `projectIn`; `builderDataOf` recebe `principalOf` | — |
| `builder/tools/check.ts` | `sessionScopeOf` devolve `Principal` (`builder`); `InProject` fica | `tools/`, `agents/agents.ts`, `agents/conversation-routes.ts` |
| `conversations-of.ts`, `main.ts` | `companyData` e `access` com `Principal` | — |

Os 29 arquivos (não teste) que importam `SessionScope` hoje, e no que cada um muda: `hub/connectors/scope.ts`
(apaga); `public.ts:61` (sai o reexport); `assistant-port.ts`, `approval.ts:107`, `tool-door.ts:13`,
`write-record.ts:33,251`, `test-write.ts:25,81` (`Principal`); `hub/data/public.ts`, `query.ts:44-118`,
`rows.ts:13` (`Principal`); `builder/assistant/context.ts` (apaga o tipo do escopo; fica `machineMarks`
sobre `RunScope`); `assistant.ts:119-147,352-355` (`RunScope`, `Place`); `open.ts:12,25,87` (`Place` da
porta, `offeredOnly` sai); `routes.ts:27,91` (`Principal` pela porta); `overview.ts:26-118`,
`research.ts:47`, `typed-search.ts:20` (`runOf` no lugar de `scopeOf`); `propose.ts:102`,
`connector-access.ts:15` (`RunScope`); `test-assistant.ts:65,201` (`Principal`);
`automations/automations.ts:12,26` (`Place` da porta); `construtor/construtor.ts:16,87,200`
(`RunScope`, `principalOf`); `conversation/builder.ts:9,75,138` (`Principal`);
`agents/agent.ts:17,115-133,189`, `controller.ts:9,201`, `tools.ts:12,89`, `code-tools.ts:6,78`
(`RunScope`, `Principal`); `tools/check.ts:11-50` (`Principal`); `conversations-of.ts:22,164`
(`Principal`).

### Os contratos que a unidade cria

Em `hub/access/model.ts` (dono de `Place`, `Choice` e `Declared`; `hub/` não importa `builder/`):

```ts
export type Place = Readonly<{ kind: 'COMPANY' } | { kind: 'PROJECT'; projectId: ProjectId }>
export type Choice = Readonly<{ kind: 'ANY' } | { kind: 'CHOSEN'; connections: readonly ConnectionId[] }>
export type ConsumerContext = Readonly<
  | { consumer: 'assistant'; companyId: CompanyId; personId: PersonId; place: Place; choice: Choice }
  | { consumer: 'builder'; companyId: CompanyId; personId: PersonId; projectId: ProjectId }
  | { consumer: 'construtor'; companyId: CompanyId; personId: PersonId; projectId: ProjectId }
  | { consumer: 'agent'; companyId: CompanyId; personId: PersonId; place: Place; declared: Declared; choice: Choice }
>
/** O dono de "esta conexão está na escolha": a vista e as portas de hub/connectors o leem. */
export function chosenIn(choice: Choice, connection: ConnectionId): boolean
```

Em `principal.ts`: `Principal` ganha `readonly choice: Choice` (`builder` e `construtor`: `ANY`).
Em `public.ts`: `viewFor` corta `systems` por `chosenIn` antes de `mayUseEach`, na ordem do lugar; as
tabelas não dependem da escolha.

Em `builder/controller-kit/run.ts`:

```ts
export type Ceiling = Readonly<{ kind: 'PERSON' } | { kind: 'VERSION'; declared: Declared }>
export type RunThread = Readonly<{ kind: 'THREAD'; id: ConversationId } | { kind: 'TRIAL' }>
export type RunScope = Readonly<{
  kind: ControllerKind          // de kinds.ts:19-26, não uma segunda lista
  owner: Owner
  place: Place
  conversation: RunThread       // TRIAL só no teste do rascunho do Construtor (draft-trial.ts:47)
  choice: Choice
  ceiling: Ceiling
  attended: boolean
}>
/** O que o dono de cada conversa guarda dela, lido pela própria conversa. */
export type Stored = Readonly<{ place: Place; choice: Choice; ceiling: Ceiling; attended: boolean }>
export type StoredOf = (
  found: Readonly<{ owner: Owner; conversationId: ConversationId; mark: RunMark }>,
  requestContext: RequestContext,
) => Promise<Stored | undefined>
export const RUN_MARKS: Readonly<Record<ControllerKind, MarkKeys>>
export type RunMark = Readonly<{ companyId: CompanyId; personId: PersonId; projectId?: ProjectId;
  automation?: { automationId: AutomationId; name: string }; agent?: { agentId: AgentId; draft: boolean } }>
export function runMark(kind: ControllerKind): z.ZodType<RunMark>
export function marksOf(kind: ControllerKind, mark: RunMark): Record<string, string>
export function runResolver(
  kind: ControllerKind,
  deps: Readonly<{ memory: Pick<Memory, 'getThreadById'>; stored: StoredOf }>,
): (requestContext: RequestContext) => Promise<RunScope | undefined>   // oncePerRun
export function principalOf(run: RunScope): Principal
```

As formas:

- **Estados.** `Choice`, `Ceiling` e `RunThread` são uniões por `kind`; todo `switch` acaba em
  `satisfies never` (C21). Nenhum `chosen: []` significa "tudo": `ANY` é a variante.
- **Ids.** `CompanyId`, `PersonId`, `ProjectId`, `ConnectionId`, `ConversationId`, `AgentId`, `AutomationId`
  de `@conexus/hub-api`, criados por parse: o dono pelo recurso (`ownerOfResource`, `kinds.ts:61-67`), a
  conversa por `conversationRun` (`controller-in.ts:37-40`), o resto por `runMark` (C23).
- **Donos.** `Place`, `Choice`, `Declared`, `chosenIn`: `hub/access`. `RunScope`, `RUN_MARKS`, as chaves de
  marca (as de hoje, byte a byte: são dados guardados e as varreduras de remoção as procuram):
  `controller-kit/run.ts`. "O que a conversa escolheu": a linha do Hub de cada dono (Assistente
  `chosen.ts`, agente `keptRun` com a versão), nunca a marca (C26).
- **Entrada externa.** `runMark(kind)`: `z.object` sobre as chaves do tipo, `CompanyId`/`PersonId` obrigatórios,
  `ProjectId` opcional, um `.refine` de nada: a comparação com o recurso é do `runResolver`. A marca de
  Projeto do Assistente e do agente não é lida para o lugar: o lugar é da linha (teste F15,
  `create.test.ts:107`). Só o Construtor, que não tem linha, lê a marca de Projeto, e a confere contra o
  Projeto vivo da empresa do recurso (`liveProjectOf`), como `scope.ts:107` da Factory (C27).
- **Arquivo modelo.** `hub/access/view.ts`: cumpre C21 (`Verdict` por `kind`), C23 (`LeafKey` com marca, só
  por parse em `reach.ts`) e C26 (o corte de sistema sem operação tem um dono, `:27`). É o modelo.

### As skills e a leitura

`docs/reference/stack.md:20` (`@mastra/core`, `apps/server/src/builder`): a skill `mastra`; ler primeiro
`node_modules/@mastra/core/dist/docs` sobre `AgentController` e `requestContext`. `:34` (`zod`): C27.
`:35` (`fastify`): a skill `fastify-best-practices` só se uma rota mudar de forma (não muda). Guia além do
de código: testing (T5, T26, T27).

### A ordem do trabalho

1. **A porta aprende a escolha.** Critérios: 17, 18.
   - **Arquivos:** muda `hub/access/model.ts`, `principal.ts`, `public.ts`, `conformance.test.ts`.
   - **Referência a seguir:** `hub/access/view.ts:19-28`; C81.
   - **O que sai:** nada ainda.
   - **O que entra:** `Choice`, `chosenIn`, `construtor`, `assistant` com `place`; `principalFor` põe
     `ANY` em `builder` e `construtor`. Regras: C21, C26, C81.
   - **Testes:** `hub/access/conformance.test.ts`, o cenário `construtor` (`tablesBy: 'RELEASE'`,
     `revokedBy: 'ROLE'`) e o caso novo "lei (b): a escolha estreita os sistemas, não as tabelas".
   - **Mutações à mão:** tirar o corte por `chosenIn` em `public.ts`: o caso novo fica vermelho.
   - **Pronto quando:** as leis (a), (b) e (e) passam nos quatro consumidores.
2. **`hub/connectors` e `hub/data` recebem `Principal`.** Critérios: 23, 25, 26.
   - **Arquivos:** muda os sete de `hub/connectors` e os três de `hub/data` do raio; apaga `SessionScope`
     e `Place` de `scope.ts`, `contextOf` de `hub/data/public.ts`.
   - **Referência a seguir:** `assistant-port.ts:121-137` (`mayAsk`: `declared` no lugar de `agentVersion`,
     a mesma troca de falante; o teto é da U4), `:163-178`.
   - **O que sai:** `SessionScope` com os 29 chamadores acima; `contextOf` com `conformance.test.ts:143`.
   - **O que entra:** `idsOf(principal)`; `readable` e `write.ts:81` por `chosenIn(principal.choice, id)`;
     `chosenAmong` idem. Mapa sem mudança de comportamento: `chosen: X` vira `CHOSEN X` em todo
     chamador, exceto o Construtor (passo 4) e a lista da conversa nova (passo 5).
   - **Testes:** as suítes de `hub/connectors/` e `hub/data/`, com o `SessionScope` literal trocado por
     `principalFor`.
   - **Mutações à mão:** `chosenIn` sempre `true` em `readable`: `assistant-port.test.ts` (a leitura não
     escolhida) fica vermelho.
   - **Pronto quando:** `npm run typecheck` e `npm run deps` passam.
3. **`run.ts`: um escopo, uma marca.** Critérios: 19, 20, 21, 24.
   - **Arquivos:** cria `controller-kit/run.ts`; muda `public.ts`.
   - **Referência a seguir:** `mastra-1.83` `mastracode/factory/src/tools/scope.ts:58-121`.
   - **O que entra:** `runResolver` lê `conversationRun`, `ownerOfResource` (o tipo tem de ser o do
     `kind`), a thread, `runMark(kind)`; recusa (devolve `undefined`) a marca cuja empresa ou pessoa difere
     do recurso; chama `stored`. Regras: C21, C23, C27.
   - **Testes:** `builder/assistant/run-scope.test.ts`, "a thread com a marca de outra empresa é recusada
     antes do modelo"; `construtor/run-scope.test.ts`, "a marca de um Projeto de outra empresa é recusada".
   - **Mutações à mão:** trocar `!==` por `===` na comparação de empresa: o primeiro fica vermelho.
   - **Pronto quando:** os dois casos dão `CONVERSATION_NOT_FOUND` e nenhuma chamada ao dublê do modelo.
4. **As quatro conversas leem `RunScope`.** Critérios: 20, 22, 23, 25, 26, 27.
   - **Arquivos:** os de `builder/` do raio.
   - **O que sai:** `sessionScopes`, `scopeOn`, `ScopeOf` (`context.ts:29-58`); `scopes` e o `door`
     (`construtor.ts:108-122,200-204`); `runsOf` (`controller.ts:78-87`); `projectIn` (`turn-of.ts:75-87`);
     `automationRunFor` (`open.ts:165-175`) vira `run.attended`; `SESSION_MARK`, `CONSTRUTOR_MARK`,
     `AGENT_MARK` viram `RUN_MARKS`.
   - **O que entra:** Assistente: `stored` lê `chosen.of` (`CHOSEN`), `attended` pela marca de automação.
     Builder: `index.projectOf`, `ANY`. Construtor: o Projeto da marca conferido, `ANY` (hoje o `door` passa
     todas as oferecidas: o mesmo). Agente: `keptRun` mais a versão de `registry.resolve(run,
     activationIn(rc))`, `CHOSEN` = `selected` (`agent.ts:185-188`), `VERSION` = `declaredOf(tools)`; o plano
     (`agent.ts:154-201`) lê o `RunScope` e não monta mais escopo.
   - **Testes:** todas as suítes de `assistant/`, `construtor/`, `agents/`, `automations/`, `conversation/`
     sem mudar asserção; `propose.test.ts:113` (`attended: false`).
   - **Mutações à mão:** `attended` sempre `true`: `propose.test.ts:113` fica vermelho. A escolha do agente
     como `ANY`: o caso novo de `agent-read.test.ts` fica vermelho.
   - **Pronto quando:** `grep -rn 'SessionScope\|ScopeOf\|projectIn\|sessionScopes' apps/server/src` vazio.
5. **A lista da conversa nova pela porta (issue 1147).** Critérios: 10 a 16.
   - **Arquivos:** `assistant/routes.ts`, `assistant/open.ts`, `automations/automations.ts`,
     `conversations-of.ts` (a dependência `access`).
   - **O que sai:** `offeredOnly` (`open.ts:84-93`) e as chamadas de `routes.ts:92,204,275`,
     `open.ts:137`, `automations.ts:90,161`.
   - **O que entra:** `offeredBy(access, owner, place)` = `viewOf(principalFor({ consumer: 'assistant', …,
     choice: { kind: 'ANY' } })).list('system')`; a criação e a troca guardam a interseção com ele, como o
     contrato já diz ("keeps only those its place offers", `packages/hub-api/src/assistant.ts:275`); a
     conversa lida marca `chosen` pela linha.
   - **Testes:** `builder/assistant/reach-choice.test.ts` (critérios 10 a 13),
     `builder/automations/reach-choice.test.ts` (14), `builder/assistant/describe-reads.test.ts` (15, 16).
   - **Mutações à mão:** voltar `routes.ts:204` a `connectors.connections`: o caso do critério 10 fica
     vermelho.
   - **Pronto quando:** o papel "Vazio" recebe `[]` e o dono vê as duas.

### Como se prova

Os testes entram pela porta pública (T5): rotas do Hub de teste e turnos com o modelo de roteiro.
Gravações tocadas (T26): a linha `builder.assistant_conversation` e a agenda da automação, lidas de
volta. Hoje falham: 10 e 11 (o papel sem alcance vê e guarda a conexão, `speaking.ts:76-79`); 15 e 16 (a
`data_describe` lista a Filial não escolhida, a leitura tipada a recusa `NOT_CHOSEN`); 17 (não há
`construtor`; `satisfies Record<Consumer, Scenario>` em `conformance.test.ts:86` não compila depois do
passo 1 sem o cenário); 19 e 21 (nenhum resolvedor compara a marca com o recurso). Os outros são de
regressão e passam hoje.

### Parar se

- Uma recusa nova for pedida: o contrato já diz "guarda só as que o lugar oferece" e nenhum código
  (`ProblemReason.NOT_OFFERED`, `agent-failures.ts:120`, é de ferramenta) cabe; não criar.
- Uma rota registrada do Mastra deixar um cliente gravar `metadata` de thread (`conversation/guard.ts`):
  a marca de automação deixaria de ser do Hub.
- O plano do agente precisar ler a versão duas vezes para montar o `RunScope`: parar e mostrar.
- Uma asserção de teste de hoje precisar mudar fora dos critérios 10 a 16.
- O corte por escolha mudar o texto das instruções de algum agente (U3 é dona das listas).

## U3 A fábrica

**Base e modelo.** `main` `f4ccc150` com a U2 já no grupo (G2 depende de G1), `@mastra/core` 1.83.0. Opus:
desenho que cruza cinco pastas (`assistant`, `conversation`, `construtor`, `agents`, `connectors`) e
troca a fonte de toda lista de ferramenta de uma vez.

A U3 junta as quatro montagens de `tools:` numa fábrica, `companyTools(scope, deps)`. O escopo vai
por closure, e toda lista que uma ferramenta, uma skill ou a linha de conexões das instruções mostra
sai da vista da porta (code C81). Cada agente recebe os mesmos nomes de ferramenta de hoje. Muda
só o que a lei (a) já proíbe: uma conexão que a vista não lista deixa de aparecer pelo nome.

### As linhas da tabela

- **A fábrica.** Na base: as quatro montagens, `assistant/assistant.ts:247-264`,
  `conversation/builder.ts:172-191`, `construtor/construtor.ts:197-222` e `agents/agent.ts:249-290`.
  A referência: `mastra-1.83` `mastracode/factory/src/tools/index.ts:33-56` (`createFactoryTools`, o
  subconjunto por tipo de sessão dentro da fábrica, `:47`), `factory.ts:1898-1912` (`extraTools` e
  `mergeTools`, que recusa nome repetido) e `:1980-1994` (`resolveFactoryToolScope`, depois
  `createFactoryTools`), e `mcp/routes.ts:178-190` (o mesmo conjunto num segundo transporte).
- **O escopo por closure.** Na base, `data-tools/tools.ts:175-179` lê o `requestContext`, e
  `copy-runs.ts:96` e `overview.ts:39` também. A referência: `tools/index.ts:34-36`, e
  `read-tools.ts:222-223`, que lê só `scope.orgId` e `scope.factoryProjectId`. No `@mastra/core`
  1.83, `dist/docs/references/reference-agents-agent.md:564` diz que `tools` é uma função do
  `requestContext`, e `instructions` também (`:558`).
- **As leituras tipadas sob demanda.** Na base: `assistant/typed-search.ts:34-40`, com
  `offersRead` em `connectors/typed-reads.ts:59-67`. A referência:
  `reference-processors-tool-search-processor.md:48,100-127` (o `filter` por pedido) e `:131,157`
  (`includeResolvedTools` esconde todas as ferramentas atrás da busca, por isso fica de fora).
- **As listas leem a vista.** Na base: `overview.ts:98-130` (`reachedBy`, `connectionsOffered`),
  `copy-runs.ts:103`, `builder.ts:44-87`, `construtor.ts:143,163-166`, `agent.ts:199,252` e as
  skills (`assistant.ts:265-270`, `builder.ts:165-170`). A porta: `hub/access/view.ts:19-38`.
- **Fica de fora: `kitReads` e `legacyTools`.** Ver "Para o firstmate", erro 2.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/company-tools/` | cria: `scope.ts`, `names.ts`, `listed.ts`, `factory.ts`, `search.ts`, `public.ts`; recebe `overview.ts` e `copy-runs.ts` de `assistant/` | `assistant/assistant.ts`, `assistant/research.ts`, `assistant/instructions.ts`, `conversation/builder.ts`, `conversation/instructions.ts`, `construtor/construtor.ts`, `agents/agent.ts` |
| `builder/assistant/` | apaga `offeredFor`, `dataOfScope`, `typed-search.ts` e o par de `overview.ts` e `copy-runs.ts`; `researchReads` e `assistantConnectorTools` passam a montar pela fábrica | `assistant.ts`; os testes por `test-assistant.ts:14,210-212` |
| `builder/conversation/` | apaga `grantedFor`, `admittedFor`, `builderDataOf` e `builderConnectorTools` de `builder.ts`; `builderInstructions` recebe a lista da fábrica | `conversations-of.ts` (a ponte `builderDataOf` de `conversations-of.ts:98` é outra função e fica) |
| `builder/construtor/` | apaga `offeredOf` e a `door` à mão (`construtor.ts:163-166,199-216`); `projectReader` (`:143`) lê a lista da fábrica | `construtor/tools.ts:47` (`project_read`) |
| `builder/agents/` | `runToolsOf` e `instructions` leem a lista da fábrica (`agent.ts:252,331`); `neverAsking`, `presetTools` e `codeTools` ficam | `agents/controller.ts` |
| `builder/connectors/` | apaga `offersRead`; exporta `readTarget(name)` (o conector e a operação de uma leitura tipada) | `company-tools/search.ts` |
| `builder/data-tools/` | `dataTools({ data })` recebe a `CompanyData` já presa ao escopo, sem `DataOf` | `company-tools/factory.ts` |
| `.dependency-cruiser.cjs` | `company-tools` entra em `AGENTS_AND_APPS` (`:21`); a lista de migração não muda | `npm run deps` |

### Os contratos que a unidade cria

Em `apps/server/src/builder/company-tools/`, só tipos e assinaturas:

```ts
// names.ts: o dono dos nomes é o hub-api (DATA_TOOL, BUILDER_TOOL, APP_DATA_TOOL, ASSISTANT_TOOL), code C26
type CompanyToolName =
  | typeof DATA_TOOL[keyof typeof DATA_TOOL]                    // data_describe, data_query
  | 'connector_read' | 'connector_notes' | 'connector_note_save' | 'copy_propose'
  | typeof APP_DATA_TOOL[keyof typeof APP_DATA_TOOL]            // app_data_read, app_data_check
  | typeof ASSISTANT_TOOL['overview' | 'copyRuns']              // conexus_overview, copy_runs
  | 'typed_reads'   // a família TYPED_READ_NAMES, montada pelo search_tools, nunca em `tools:`
type CompanyToolSeat = ConversationKind | 'research'    // o ajudante do Assistente é um assento, não uma conversa
const TOOLS_OF: Readonly<Record<CompanyToolSeat, readonly CompanyToolName[]>>
//   assistant:     data_describe, data_query, typed_reads, connector_notes, connector_note_save, copy_runs, conexus_overview
//   research:      connector_read
//   app-builder:   connector_read, connector_notes, connector_note_save, copy_propose, app_data_read, app_data_check, data_describe, data_query
//   agent-builder: connector_read, connector_notes
//   agent:         connector_notes, app_data_read, data_describe, data_query

// scope.ts
type AppDataGrant = { kind: 'NONE' } | { kind: 'READ' } | { kind: 'READ_AND_CHECK' }    // C21
type CompanyToolScope = Readonly<{
  run: RunScope              // da U2; `attended`, `choice` e `place` saem daqui
  view: AccessView           // access.viewOf(principalOf(run)): a escolha da conversa
  reach: AccessView          // a mesma pessoa com choice ANY; é `view` quando run.choice é ANY
  grants: Readonly<{ noteSave: boolean; appData: AppDataGrant }>   // o consumidor resolve; a fábrica só poda
}>
function companyToolScope(run: RunScope, deps: { access: Access }, grants: CompanyToolScope['grants']): Promise<CompanyToolScope>

// listed.ts: o dono da regra "a conexão está na vista" (C26)
type Listed<C extends { connectionId: ConnectionId; reads: readonly { operation: string }[] }> = readonly C[]
function inView<C extends { connectionId: ConnectionId; reads: readonly { operation: string }[] }>(
  view: AccessView, details: readonly C[]): Listed<C>   // só os ids de view.list('system'), só as leituras que ela lista

// factory.ts
type CompanyToolDeps = Readonly<{
  log: FailureLog
  data: (run: RunScope) => CompanyData
  connections: (run: RunScope) => Promise<readonly ConnectionDetail[]>   // detalhes por id: skill, copies, perProject, notes
  connector: Readonly<{ read: ReadCall; notes: NotesCall; saveNote?: NoteSave; propose?: ProposeCall }>
  copies?: () => Pick<AssistantCopies, 'list' | 'runs'>
  projects?: (run: RunScope) => Promise<Omit<Overview, 'connections'>>
  appData?: AppDataDoor
  turn: (requestContext: RequestContext) => TurnKey     // a chave do turno, não quem é
}>
function companyTools(scope: CompanyToolScope, seat: CompanyToolSeat, deps: CompanyToolDeps): ToolsInput
function companyConnections(scope: CompanyToolScope, deps: CompanyToolDeps): Promise<Listed<ConnectionDetail>>
// search.ts: o catálogo do ToolSearchProcessor é fixo na construção; o filtro lê a vista
function companyReadSearch(scopeOf: (rc: RequestContext) => Promise<CompanyToolScope | undefined>, deps: CompanyToolDeps): ToolSearchProcessor
```

`ConnectionDetail`, `ReadCall`, `NotesCall`, `NoteSave` e `ProposeCall` são tipos estruturais de
`builder/connectors/public.ts` e do `@conexus/hub-api`, nunca de `hub/connectors` (a regra
`agents-and-apps-reach-data-only-through-the-contract`, `.dependency-cruiser.cjs:68-78`). As portas
de `hub/` chegam pelas `deps` de cada montagem.

- **Estados.** `AppDataGrant`, por `kind`. `Choice` e `Ceiling` são da U2.
- **Ids.** `ConnectionId`, parseado na fonte da vista (`CatalogSystem.connection`). A U3 não parseia
  id novo.
- **Donos.** Os nomes são do hub-api. `TOOLS_OF` é a única tabela de subconjuntos. `inView` é a única
  regra de "a conexão está na vista". O escopo é de `companyToolScope`, uma vez por execução
  (`oncePerRun`), e a U2 é dona do `RunScope`.
- **Zod.** Nenhuma entrada externa nova. Os `inputSchema` das ferramentas não mudam.
- **O arquivo modelo.** `builder/connectors/connector-tools.ts` (`connectorTools`, `:335-353`): cumpre
  C21 (`include` separado por `noteSave` literal), C23 (`ConnectionId`) e C26 (os nomes vêm de
  `BUILDER_TOOL`). É modelo.

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/server/src/builder`: a skill `mastra` e o
`dist/docs` do `@mastra/core` instalado (`reference-agents-agent.md`,
`reference-processors-tool-search-processor.md`). Ler primeiro `hub/access/view.ts` e o
`hub/access/conformance.test.ts` (os cenários da U2). Guia além do de código: testing (T5, T26, T27).

### A ordem do trabalho

1. **Gravar os nomes de hoje.** Critério: 30.
   - **Arquivos:** cria `company-tools/tool-sets.test.ts`.
   - **Referência a seguir:** `construtor/construtor.test.ts:55-66`, que compara `asked.tools`
     ordenado.
   - **O que sai:** nada.
   - **O que entra:** um caso por assento (Assistente na Início e num Projeto, a rodada de
     automação, o Builder conversante, o Construtor, um agente salvo com e sem `appData`), cada um
     com a lista literal que o `main` da base dá. A lista sai de uma rodada no `main`, antes de
     qualquer mudança, e fica escrita no teste.
   - **Testes:** o arquivo.
   - **Mutações à mão:** nenhuma ainda.
   - **Pronto quando:** fica verde no `main` da base.
2. **Subtrair.** Critério: 41.
   - **Arquivos:** apaga, em `assistant.ts`, `offeredFor` (`:176-181`) e `dataOfScope` (`:184-189`).
     Em `overview.ts` apaga `reachedBy` e `connectionsOffered` (`:98-130`) e a citação velha (`:21`).
     Apaga `offersRead` (`typed-reads.ts:59-67`) e, em `builder.ts`, `grantedFor`, `admittedFor`,
     `builderDataOf` e `builderConnectorTools` (`:44-87,109-118`).
   - **Referência a seguir:** o princípio de apagar antes de pôr.
   - **O que sai:** cada chamador da lista do raio.
   - **O que entra:** nada. O passo 3 entra no mesmo commit.
3. **O escopo e a vista.** Critérios: 36, 46, 47.
   - **Arquivos:** cria `scope.ts`, `listed.ts`, `names.ts`.
   - **Referência a seguir:** `mastra-1.83` `factory.ts:1980-1994`; o `oncePerRun` do kit
     (`controller-kit/once.ts:7`).
   - **O que entra:** `companyToolScope(run, deps, grants)` lê `viewOf(principalOf(run))` e, só
     quando `run.choice.kind === 'CHOSEN'`, a `reach` com `choice: ANY`. Regras: C26, C81.
   - **Testes:** `company-tools/conformance.test.ts`, "a vista é lida uma vez por execução" (uma
     porta de contagem conta as chamadas de `viewOf`) e "a thread com a marca de outra empresa não
     monta nenhuma ferramenta da empresa".
   - **Mutações à mão:** tirar o `oncePerRun` deixa vermelho "a vista é lida uma vez".
   - **Pronto quando:** `npm run typecheck` passa no arquivo.
4. **A fábrica.** Critérios: 31, 32, 36, 39.
   - **Arquivos:** cria `factory.ts` e `public.ts`. Muda `data-tools/tools.ts`, onde `dataTools({ data })`
     recebe a `CompanyData` presa e a `zoneOf(requestContext)` fica, porque diz o fuso e não quem é.
   - **Referência a seguir:** `mastra-1.83` `tools/index.ts:45-56`; `mcp/routes.ts:183-190`.
   - **O que entra:** para cada nome de `TOOLS_OF[seat]`, a fábrica chama a peça que já existe:
     `connectorTools` com `inView(scope.view, details)`, `dataTools`, `appDataTools`. Poda pelos
     `grants`, e `connector_note_save` também por `run.attended`. `copy_propose` só sai sobre as
     conexões de `inView` com `copies`. Repetir um nome lança erro, como `mergeTools`.
   - **Testes:** `conformance.test.ts`, por assento e por ferramenta, no mundo `rolesWorld(t, 'PLANTED')`
     de `hub/copies/test-readers.ts`: "lei (a) por ferramenta: nada de fora da vista aparece pelo nome,
     em <assento>, <ferramenta>" e "lei (a) por ferramenta: tudo o que a ferramenta lista está na
     vista, em <assento>, <ferramenta>". Mais "a ferramenta responde pela closure, com um
     requestContext de outra empresa".
   - **Mutações à mão:** passar `details` sem `inView` deixa vermelho "nada de fora"; tirar a poda
     de `attended` deixa vermelho `note-save.test.ts:53`.
   - **Pronto quando:** os casos rodam verdes contra a fábrica, antes de ligar os agentes.
5. **As ferramentas só do Assistente.** Critérios: 33, 37, 38, 44.
   - **Arquivos:** move `overview.ts` e `copy-runs.ts` para `company-tools/` (deixá-los em
     `assistant/` faz um ciclo, que a regra `no-circular` recusa). Cria `search.ts`. Muda
     `research.ts:44-63`.
   - **Referência a seguir:** `reference-processors-tool-search-processor.md:100-127`.
   - **O que entra:** `conexus_overview` lista os sistemas de `scope.reach` mais as fontes das
     tabelas dela (o `reachedIn` de hoje, `overview.ts:90-95`), cada um com `chosen` pela
     `run.choice`. `copy_runs` só acha a tabela que `scope.view.list('table')` lista, e depois
     `copies().list` dá o id. O `filter` do `search_tools` passa uma leitura se algum sistema de
     `scope.view` for do conector dela (`readTarget`) e listar a operação. O ajudante monta
     `companyTools(scope, 'research', deps)`.
   - **Testes:** `conformance.test.ts`, "a busca de leituras só acha as da vista: a conexão não
     escolhida fica de fora" e "o resumo lista a conexão alcançada e não escolhida com chosen false,
     e nunca a não alcançada". Passam sem mudar: `overview-reach.test.ts`, `copy-runs.test.ts` e
     `typed-reads.test.ts:87`.
   - **Mutações à mão:** trocar `reach` por `view` no resumo deixa vermelho o caso de `chosen false`;
     o filtro sempre `true` deixa vermelho "a busca só acha as da vista".
   - **Pronto quando:** as três suítes de hoje passam.
6. **Ligar os quatro agentes.** Critérios: 30, 34, 35, 40, 43, 45.
   - **Arquivos:** muda `assistant.ts` (`tools:`, `skills:`, `inputProcessors`), `assistant/instructions.ts:45-71`,
     `builder.ts:155-191`, `conversation/instructions.ts:35,46-65`, `construtor.ts:184-222` e
     `agent.ts:154-201,249-276,328-335`.
   - **O que entra:** cada montagem resolve `companyToolScope` uma vez por execução e espalha
     `companyTools(...)` no lugar das peças à mão, na mesma ordem de chaves (o critério 13a do passo
     20 compara bytes). As skills, a linha "Connections in this conversation" e o `## Connections`
     do Builder (`connectionsContext`, que fica no lugar, H4) leem `companyConnections`. O agente
     salvo passa a mesma lista a `presetTools` como `offered`.
   - **Testes:** `tool-sets.test.ts` do passo 1, sem mudar. Passam sem mudar: `assistant.test.ts`,
     `construtor.test.ts`, `agent.test.ts`, `copy-runs.test.ts`, `overview-reach.test.ts`,
     `note-save.test.ts`, `conversation/permissions.test.ts`. Novo: "a conexão recebida sem operação no
     alcance não traz skill nem nome", um caso por assento.
   - **Mutações à mão:** pôr `copy_propose` em `TOOLS_OF.assistant` deixa `tool-sets.test.ts`
     vermelho.
   - **Pronto quando:** `npm run deps`, `npm run typecheck`, `npm run lint` e os testes tocados
     passam.

### Como se prova

Nenhum critério grava nada novo (T26 não se aplica a gravação nova). O 31 e o 32 rodam sobre o
`rolesWorld` com recusa plantada: o papel não alcança `clientes`, e `sankhya_clientes` não está
liberada. Hoje falham assim:

- O `connector_notes` e o `connector_read` do Builder nomeiam uma conexão recebida em que o papel não
  alcança nenhuma operação, porque `visibleTo` a mantém (`hub/connectors/speaking.ts:69-81`, issue 1145).
- A linha de conexões do Construtor faz o mesmo (`construtor.ts:192`).
- O `copy_runs` de um Assistente num Projeto acha uma cópia não liberada ao Projeto
  (`copy-runs.ts:103` lê a lista da empresa).
- Sem a U3, o `conexus_overview` perderia as conexões não escolhidas, porque `reachedBy` lê a
  `describe` que a U2 restringe às escolhidas.

O 30 é verde hoje e tem de continuar verde.

### Parar se

- Um tipo de `CompanyToolDeps` só puder ser escrito importando de `hub/connectors`, `hub/copies` ou
  `hub/data`: nada entra na lista de migração (`.dependency-cruiser-migration.cjs:1`). Pare e relate.
- O `tool-sets.test.ts` mudar em qualquer nome ou na ordem das chaves: a U3 não muda o conjunto.
- A U2 não entregar o `principalOf` com `choice` ou a vista com `choice: ANY`: a `reach` depende disso.
- Cumprir a lei (a) pedir que o Construtor (`tool_search`, `ready`) ou as rotas de edição de agente
  deixem de listar leituras marcadas `allowed: false`: isso é a lista de edição, fora da U3.
- Cumprir a lei (a) pedir que `legacyTools` deixe de ler `kitReads`: isso é a U4.

## U4 O teto

**Base e modelo.** `main` `f4ccc150`, depois de U2 (o `RunScope` com `ceiling`, `principalOf`) e U3 (a
fábrica), no mesmo grupo G2. Sonnet: a forma está decidida aqui, a mudança é pequena (cerca de 90
linhas) e cada lugar tem o seu teste; nenhum algoritmo sutil nem concorrência nova. A revisão é Opus,
como sempre, porque a unidade mexe numa fronteira de segurança.

A regra: o alcance de um agente salvo (publicado ou rascunho) é o papel de quem o roda, lido na hora,
∩ o que a versão declara. A versão deixa de substituir a pessoa. O app publicado e a corrida da cópia
continuam falando pela versão que declaram (decisão 3(d) do fundador; a cópia não é conversa).

### As linhas da tabela

- **O alcance do agente salvo.** Na base: `hub/identity/may-use.ts:22-27` (`Speaker` com `VERSION`),
  `:93` (`VERSION` responde só pela declaração, sem papel), `:54-56` (`roleOfSpeaker` dá `null`);
  os lugares onde a versão substitui a pessoa:
  - a lista: `hub/access/public.ts:46-51` (o falante vira `VERSION` quando o `Principal` tem `declared`);
  - a leitura e o caderno: `hub/connectors/assistant-port.ts:121-137` (`mayAsk`, `:129`
    `scope.agentVersion ?? personOf(...)`), e `hub/connectors/speaking.ts:91-108`
    (`mayUseNotebook`, `:97` a versão passa sem conferência);
  - a escrita: `builder/agents/tools.ts:177-185` (`requestOf`: a versão publicada fala como
    `VERSION`), `hub/connectors/write-record.ts:24-25,45` e `hub/connectors/write.ts:101` (o funil
    usa o falante da versão em vez da pessoa lida em `:84`).
  - onde nasce: `builder/agents/agent.ts:189-196` (o `planner` põe `agentVersion` no escopo do
    publicado e do rascunho); depois de U2, `ceiling: { kind: 'VERSION' }` do `RunScope` e
    `Principal.declared` (`hub/access/principal.ts:23-24`).
  Referência: `mastra-1.83` `mastracode/factory/src/tools/scope.ts:96-104` ("A user session acts as
  the signed-in caller, who must be able to see it"): a sessão de uma pessoa age como quem entrou, a
  cada resolução (`resolveFactoryToolScope`, `:58`), nunca como uma identidade guardada da sessão. A
  decisão pelo papel é do Better Auth, `better-auth@1.7.8` `dist/plugins/organization/has-permission.mjs:7`,
  já chamada em `may-use.ts:74`.
- **A automação.** Na base: `builder/automations/run.ts:79-90` (`mayAsk` admite o dono antes de cada
  execução), `:205-215` (quem não pode mais pede pausa e `SKIPPED`), `:113-116` (a execução é uma
  conversa do Assistente do dono, com as conexões escolhidas), e `hub/connectors/assistant-port.ts:121-129`
  (o papel do dono é lido em cada chamada). Referência: `mastra-1.83`
  `mastracode/factory/src/tools/scope.ts:96,99-100` ("A worker acts as its session row"): o
  trabalho sem pessoa age como o dono da linha. **Já é assim no `main`**: a unidade só acrescenta
  testes de regressão.
- **O app publicado.** `hub/connectors/app-calls.ts:102-107` fala como `VERSION` pelo manifesto. **Fica
  de fora** pela decisão 3(d) (o app é um compartilhamento e lê como o Projeto); a unidade só prova que
  não mudou. O mesmo vale para a corrida da cópia, `hub/connectors/copy-port.ts:118-137`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `hub/identity/may-use.ts`, `hub/identity/public.ts` | muda: o `Speaker` ganha `AGENT`; `Declared` nomeado aqui; `withinVersion`; `mayUseEach` vira `switch` exaustivo; `roleOfSpeaker` dá o papel do `AGENT` | `hub/access/public.ts`, `hub/connectors/*` (`speaking.ts`, `write.ts`, `read.ts`, `copy-sources.ts`, `copy-proof.ts`) |
| `hub/access/public.ts`, `hub/access/model.ts` | muda: a vista do agente fala como `AGENT`; `Declared` passa a ser importado da dona | `hub/data/catalog.ts`, `hub/data/public.ts`, a fábrica de U3 (`builder/company-tools/`) |
| `hub/connectors/assistant-port.ts`, `speaking.ts`, `write.ts`, `write-record.ts` | muda: o agente fala como `AGENT` na leitura, no caderno e na escrita | `builder/agents/agent.ts`, `builder/agents/tools.ts`, `builder/agents/code-tools.ts`, `builder/assistant/` |
| `builder/agents/tools.ts` | muda: a escrita publicada pede `AGENT` com a pessoa da execução | `builder/agents/agent.ts` |
| `hub/connectors/app-calls.ts`, `hub/connectors/copy-port.ts` | não muda (só o comentário do `VERSION` em `may-use.ts` diz que ele é do app e da cópia) | `apps/edge` pela rota do app; as cópias |
| testes: `hub/access/conformance.test.ts`, `hub/connectors/role-doors.test.ts`, `hub/data/catalog-role.test.ts`, `builder/agents/agent-read.test.ts`, `builder/agents/autonomy.test.ts`, `hub/connectors/app-calls.test.ts`, `builder/automations/role-run.test.ts` | mudam ou ganham casos | — |

### Os contratos que a unidade cria

Em `apps/server/src/hub/identity/may-use.ts` (a dona do falante, C26):

```ts
/** What a version declares: each entry a connection of the Projeto and one of its operations. */
export type Declared = readonly Readonly<{ connectionId: ConnectionId; operation: OperationId }>[]

export type Speaker =
  | Readonly<{ kind: 'PERSON'; personId: PersonId; role: Role }>
  /** A person through an agent's version, draft or published: their role now ∩ what it declares. */
  | Readonly<{ kind: 'AGENT'; personId: PersonId; role: Role; declared: Declared }>
  /** A published app's manifest (decision 3(d)) or a copy's run: what it declares, no role. */
  | Readonly<{ kind: 'VERSION'; declared: Declared }>

export type AgentSpeaker = Extract<Speaker, { kind: 'AGENT' }>
export function withinVersion(person: PersonSpeaker, declared: Declared): AgentSpeaker
export function roleOfSpeaker(speaker: Speaker): string | null   // PERSON e AGENT: o papel; VERSION: null
```

`mayUseEach` responde por `switch (speaker.kind)` com `satisfies never` (C21): `PERSON`, o
`hasPermission` de hoje; `AGENT`, `declares(speaker, target) && hasPermission(role)` (o
`hasPermission` só para os alvos declarados, sem mudar a leitura única dos papéis por chamada);
`VERSION`, a declaração, como hoje.

Em `apps/server/src/hub/connectors/write-record.ts`, o pedido de escrita de uma versão publicada:

```ts
type Agent = Readonly<{ kind: 'AGENT'; personId: PersonId; declared: Declared }>  // o funil lê o papel
// WriteRequest: (Readonly<{ speaker: Person }> | Readonly<{ speaker: Agent; agentId: AgentId; number: number }>)
```

Em `apps/server/src/hub/access/model.ts`: `Declared` deixa de ser `Extract<Speaker, ...>['declared']`
(`:18`) e é importado de `hub/identity/public.ts`. O `Principal`, o `ConsumerContext` e o `Ceiling` de
U2 não mudam: `Principal.declared` continua sendo o teto, e `principalOf` o preenche com o `declared` do
`ceiling: VERSION`.

- **Estados:** o `Speaker`, uma união em `kind`, com um `switch` exaustivo em `mayUseEach` e
  em `mayUseNotebook`.
- **Ids:** nenhum id novo; `PersonId`, `ConnectionId`, `OperationId` já têm marca e são conferidos onde
  nascem (C23).
- **Donos:** o falante e a regra "papel ∩ declaração", `may-use.ts` (C26). `public.ts`,
  `assistant-port.ts` e `write.ts` só montam o `AGENT` com `withinVersion`. Nenhum deles decide.
- **Zod:** nenhuma entrada externa nova.
- **Arquivo modelo:** `hub/identity/may-use.ts` depois da unidade. Cumpre C21 (`switch` com
  `satisfies never`), C23 (ids com marca) e C26 (`Declared` com uma dona só). No `main` ele não é
  modelo, porque `:93` decide por `if` e `Declared` mora em dois lugares.

Nenhuma rota, tabela, coluna, código de falha ou texto de tela novo. A recusa é o `NOT_IN_ROLE` de
hoje (`hub/connectors/read.ts:35`), agora com o papel da pessoa no campo `role`.

### As skills e a leitura

`docs/reference/stack.md`, linha `fastify` (`apps/server/src`) e linha `@mastra/core`
(`apps/server/src/builder`): as skills `mastra` e `fastify-best-practices`, mais
`organization-best-practices` para o `hasPermission`. Ler primeiro `may-use.ts` inteiro,
`hub/access/public.ts` e `mastra-1.83` `mastracode/factory/src/tools/scope.ts:58-121`. Guia além do de
código: [testing](../guides/testing.md) (T5, T27).

### A ordem do trabalho

1. **O falante `AGENT` na dona.** Critérios: 52, 61.
   - **Arquivos:** muda `hub/identity/may-use.ts`, `hub/identity/public.ts`, `hub/access/model.ts`.
   - **Referência a seguir:** `better-auth@1.7.8` `has-permission.mjs:7`, chamado como em `may-use.ts:74-79`.
   - **O que sai:** o `if (speaker.kind === 'VERSION')` de `:93`; o `Extract` de `access/model.ts:18`.
   - **O que entra:** `Declared`, a variante `AGENT`, `withinVersion` e o `switch` exaustivo.
     `roleOfSpeaker` dá o papel do `AGENT`. Regras: C21, C26.
   - **Testes:** `role-doors.test.ts`, "o funil: uma versão publicada lê só o que declara..." (`:117`),
     com `role: 'atendente'` no lugar de `null`.
   - **Mutações à mão:** em `AGENT`, trocar `declares && permitted` por `permitted`: o critério 52 fica
     vermelho. Trocar por `declares`: o 51 fica vermelho.
   - **Pronto quando:** `npm run typecheck` aponta cada lugar que ainda monta `VERSION` para um agente.
2. **A lista.** Critérios: 50, 53.
   - **Arquivos:** muda `hub/access/public.ts:46-51`.
   - **O que sai:** o literal `{ kind: 'VERSION', declared }` de `:49`.
   - **O que entra:** `withinVersion(personOf(personId, read.role), principal.declared)`. O papel é o
     que `admitMember` já leu em `:38-41`, na mesma transação.
   - **Testes:** `conformance.test.ts`, o cenário `agent` passa a revogar pelos dois caminhos. A
     opção `revokedBy` vira `readonly ('ROLE' | 'DECLARATION')[]`, e o laço roda a lei (e) uma vez por
     caminho: "lei (e): mudar o papel muda a vista seguinte, em agent (ROLE)". `catalog-role.test.ts:273`,
     reescrito: "a versão do agente lista o que declara dentro do papel de quem a roda" (Bruno lista
     `pedidos`; Dora, da Recepção, lista `[]`).
   - **Mutações à mão:** voltar `:49` a `VERSION`: os dois testes ficam vermelhos.
   - **Pronto quando:** a lei (e) com `ROLE` passa para o agente.
3. **A leitura, o caderno e a execução.** Critérios: 51, 54, 57, 58, 59.
   - **Arquivos:** muda `hub/connectors/assistant-port.ts:121-137`, `hub/connectors/speaking.ts:91-108`.
   - **O que sai:** `scope.agentVersion ?? personOf(...)` em `:129` (no estado de U2, o mesmo sobre
     `Principal.declared`); o `return undefined` de `speaking.ts:97` só para `VERSION`.
   - **O que entra:** em `mayAsk`, `withinVersion(personOf(personId, admitted.role), declared)` quando o
     principal tem teto. Em `mayUseNotebook`, um `switch`: `VERSION` passa (o app e a cópia, como hoje);
     `PERSON` e `AGENT` conferem `consultar` no papel. O caderno não é uma operação declarada, então a
     versão não o estreita; o papel sim.
   - **Testes:** `role-doors.test.ts:193`, reescrito: "a versão publicada não alarga o papel: a que
     declara empresas, para um Atendente que só tem pedidos, recebe NOT_IN_ROLE com o papel, sem pedido ao
     dublê". Casos novos em `role-doors.test.ts`: "o papel muda no meio da conversa do agente: a próxima
     chamada recusa" e "o caderno do agente segue o papel de quem o roda". Casos novos em
     `builder/agents/agent-read.test.ts`, pela rota da conversa (T5): "o teto: o agente salvo rodado por
     um Desenvolvedor sem a leitura no papel recebe a recusa e o dublê não recebe o pedido; rodado pelo
     Dono, lê" e "o teto do rascunho: a conversa de teste segue o mesmo papel".
   - **Mutações à mão:** em `mayAsk`, devolver o `personOf` sem teto: o caso "a que não declarou a
     consulta livre" (52) fica vermelho. No caderno, deixar o `AGENT` passar: o caso do caderno fica
     vermelho.
   - **Pronto quando:** os casos acima passam, e `agent-read.test.ts` "selecionar a ligação não dá
     leitura ao vivo..." (`:33`), rodado pela Ana, passa sem mudar.
4. **A escrita.** Critérios: 55, 56.
   - **Arquivos:** muda `builder/agents/tools.ts:177-185`, `hub/connectors/write-record.ts:24-25,45,97-101`
     e `hub/connectors/write.ts:101`.
   - **O que sai:** o falante `VERSION` da escrita publicada.
   - **O que entra:** `requestOf` monta `{ kind: 'AGENT', personId, declared }` com a pessoa da
     execução. O funil faz um `switch`: com `PERSON`, a pessoa lida em `:84`; com `AGENT`,
     `withinVersion(found.person, a.speaker.declared)`. O autor da linha (`authorOf` de
     `write-record.ts:97-101`) continua sendo a versão, por `agentId` e `number`. O rascunho segue
     falando como `PERSON`: as ferramentas dele são só as declaradas, então o alcance é o mesmo.
   - **Testes:** caso novo em `autonomy.test.ts`: "o teto na escrita: a escrita em Faz sozinho de uma
     versão do Administrador, rodada por um Desenvolvedor sem a escrita no papel, dá NOT_IN_ROLE e nada
     chega ao Sankhya, sem cartão". As suítes de aprovação passam sem mudar: `approval.test.ts`,
     `approval-refused.test.ts`, `approval-returned.test.ts`, `autonomy.test.ts` (`D2-a` e `D3-a`) e
     `answer.test.ts`.
   - **Mutações à mão:** em `write.ts`, usar `a.speaker` para `AGENT` sem o papel: o caso novo fica
     vermelho.
   - **Pronto quando:** o caso novo passa, e o `mustAsk` (`hub/connectors/approval.ts:63-75`) e o
     `requireApproval` não mudam (0053).
5. **O que não muda, provado.** Critérios: 60, 61, 62, 63, 64.
   - **Testes:** caso novo em `hub/connectors/app-calls.test.ts`: "o app publicado lê como o Projeto:
     quem o abre sem a operação no papel recebe OK (decisão 3(d))". Caso novo em
     `builder/automations/role-run.test.ts`: "o papel do dono estreitado depois da criação: a execução
     seguinte não recebe a operação e o dublê não recebe o pedido". E sem mudar:
     `hub/connectors/copy-port.test.ts`, `builder/automations/release.test.ts:84` e
     `builder/automations/run.test.ts:196`.
   - **Pronto quando:** todos passam. Os três sem mudança passam já no `main`.

### Como se prova

Os testes entram pela porta pública: as rotas do Hub (`call`, `talkedTo`) e as portas `hub.connectors`
e `hub.access`, como as suítes de hoje. Nenhum feito de biblioteca é fabricado (T26), porque a unidade
não lê eventos do Mastra. As gravações tocadas são as de hoje: o papel em `auth.member` e
`organizationRole`, pela rota `PUT /roles/<papel>`, e nenhuma linha em `connector_write` na escrita
recusada, porque a admissão vem antes do registro (`write.ts:159,174`).

O que falha hoje:
- 50: a lei (e) com `ROLE` para o agente, porque `public.ts:49` ignora o papel.
- 51: `role-doors.test.ts:193` hoje espera `OK`.
- 53: `catalog-role.test.ts:273` hoje lista `pedidos` para Dora.
- 54 e 57: a conversa lê, porque `assistant-port.ts:129` usa a versão.
- 55: a escrita em Faz sozinho chega ao dublê, porque `write.ts:101` usa a versão.
- 59: a segunda chamada lê.
- 56 e 60 a 64 passam hoje e são regressão. A automação já recusa: tirar o dono apaga as automações
  dele, e o dono rebaixado tem a execução pausada.

### Parar se

- Um teste de agente rodado por quem não é a Ana mudar de resultado fora da lista "Os testes que
  mudam" abaixo. Pare e reporte: é uma consequência que o cartão não previu.
- O `hasPermission` pedir uma segunda leitura dos papéis por alvo do `AGENT`. Pare: a leitura única por
  chamada (`may-use.ts:103-105`) é critério de desempenho de hoje.
- Esconder uma ferramenta da versão (`tool_<slug>`) parecer necessário para um critério. Não esconda.
  É a pergunta ao fundador abaixo; a unidade recusa na chamada.
- U2 entregar o `Principal` sem `declared`, ou o `ceiling` sem chegar a `principalOf`. Pare: o teto
  não tem por onde entrar.

### Os testes que mudam, e por quê

| Teste | Hoje | Depois | Por que é a regra decidida |
| --- | --- | --- | --- |
| `hub/connectors/role-doors.test.ts:193` "a versão publicada roda para quem conversa sem a operação..." | o Atendente lê `empresas` pela versão | `NOT_IN_ROLE` com o papel, sem pedido ao dublê | "fora do papel ninguém vê, nem o Desenvolvedor" (opção 1, 2026-11-16), e a tabela de consumidores do desenho 1(a) aprovado em 2026-11-16: agente salvo = a pessoa que o roda, limitada pelo que a versão declara |
| `hub/connectors/role-doors.test.ts:117` "o funil: uma versão publicada lê só o que declara..." | `role: null` | `role` = o papel do Atendente | o falante passa a ter papel; a recusa e o que ela diz não mudam |
| `hub/data/catalog-role.test.ts:273` "a versão do agente lista o que declara, como hoje" | Dora, sem nenhuma leitura no papel, vê `pedidos` | Dora vê `[]`; Bruno segue vendo `pedidos` | a mesma regra, na lista (C81) |
| `hub/access/conformance.test.ts:72-85` (cenário `agent`) | revoga só pela declaração | revoga pela declaração e pelo papel | a lei (e) vale para todo consumidor; antes o agente era a exceção |

Nenhum teste de `builder/agents/*.test.ts` muda de expectativa. Quem roda o agente neles é a Ana, Dona,
que alcança tudo (`test-approval.ts:60-64`), ou é quem aprova, que o `D3-a` já confere pelo papel
(`autonomy.test.ts:283`).

## G1 O ponto de conferência

Depois da U2, antes do pull request: os passos 6 e 7 de [`conexus-build`](../../.agents/skills/conexus-build/SKILL.md)
rodam o servidor de teste nas suítes de `builder/assistant/`, `builder/automations/`, `builder/construtor/`,
`builder/agents/`, `builder/conversation/`, `hub/access/`, `hub/connectors/` e `hub/data/`; `npm run deps`
com a lista de migração sem crescer; e as rotas `GET /assistant/connections`, criar e trocar a escolha, com
o papel "Vazio" e o Dono. A gravação de antes e depois da U1 (critério 2) vai no pull request.

## G2 O ponto de conferência

Depois da U4, antes do pull request: as mesmas suítes, mais `builder/company-tools/`, `builder/data-tools/`,
`builder/app-data/` e `hub/identity/`; `npm run deps` com `company-tools` em `AGENTS_AND_APPS`; e, pela rota
da conversa, um agente salvo rodado por um Desenvolvedor sem a leitura e pelo Dono (critério 54).
