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
- **O agente da empresa não usa mais do que o papel de quem conversa com ele.** Hoje a versão publicada
  substitui a pessoa: o agente lê, consulta o caderno e escreve tudo o que a versão declara, mesmo que quem
  conversa com ele não tenha o papel para isso. Passa a usar o que a versão declara **e** o que o papel de
  quem conversa alcança. Um agente do Administrador, aberto por um Desenvolvedor sem aquela leitura no
  papel, responde que não a alcança, e uma escrita que ele fazia sozinho para esse Desenvolvedor passa a
  ser recusada. É a sua resposta P1 (a) de 2026-11-14 ("O agente salvo, numa conversa, lê com o papel de
  quem pergunta"), a tabela de consumidores do desenho da porta única que você aprovou ("1. A forma: a",
  confirmado com "Sim") e a H6 do redesenho, que a "R2 a" pôs nesta etapa. A aprovação das escritas não
  muda: quem toca Aprovar continua precisando da escrita no próprio papel (a sua `D3-a`). O app publicado
  também não muda: ele lê como o Projeto, pela sua decisão 3 (d). Nesta etapa a regra vale para as
  leituras ao vivo, o caderno e as escritas. As tabelas copiadas que o agente lê num Projeto continuam
  pela liberação do Projeto até a parte 7 da trilha Dados, como a página da P1 já diz.
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
- As issues `next-card` que esperam: https://github.com/developmentconexus-ops/conexus/issues/1136
  (achar a cópia pelo nome pede uma leitura nova no serviço de cópias, e a issue pede medir antes);
  https://github.com/developmentconexus-ops/conexus/issues/1140 (o `copy_runs` muda de pasta, mas as
  horas no fuso da empresa mudam a resposta que você lê);
  https://github.com/developmentconexus-ops/conexus/issues/1016 (muda a forma das linhas na web);
  https://github.com/developmentconexus-ops/conexus/issues/1017 e
  https://github.com/developmentconexus-ops/conexus/issues/1115 (as instruções dos agentes não mudam um
  byte nesta etapa); https://github.com/developmentconexus-ops/conexus/issues/814 (pede a sua palavra);
  https://github.com/developmentconexus-ops/conexus/issues/994 (nenhum gatilho dela chegou). As outras
  158 abertas não tocam o código que a etapa reescreve.

**As decisões suas nesta etapa.** Nenhuma nova. A etapa aplica o que você já decidiu: "R2 a", a P1 (a)
de 2026-11-14, a escolha 1 de 2026-11-16 (fora do papel ninguém vê), o desenho da porta única ("1. A
forma: a", "Sim"), a `D3-a` da 24.5 e a decisão 3 (d). As escolhas técnicas são do firstmate, com a evidência e o jeito de desfazer, na tabela "As decisões do
firstmate".

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 | U1 Subtrair | `conexus.md` lido uma vez; uma fábrica do `app_data_read`; a frase do teto de chamadas feita da constante; a citação de `conexus_overview` corrigida | `builder/controller-kit/`, `builder/assistant/`, `builder/construtor/`, `builder/agents/`, `builder/app-data/`, `builder/connectors/`, `builder/conversation/` (o teste do 6), `hub/connectors/public.ts` | [testing](../guides/testing.md) | nada |
| G1 | U2 Um escopo | `RunScope`, o resolvedor e `principalOf`; a escolha e o consumidor `construtor` na porta; a lista e a criação da conversa nova pela porta (issue 1147); sai `SessionScope` | `builder/controller-kit/`, `builder/assistant/`, `builder/automations/`, `builder/construtor/`, `builder/agents/`, `builder/conversation/`, `builder/tools/`, `hub/access/`, `hub/identity/`, `hub/connectors/`, `hub/data/`, o teste de `hub/copies/` | [security](../guides/security.md) | U1 |
| G2 | U3 A fábrica | `builder/company-tools/`: `companyTools`, `TOOLS_OF` e o escopo por closure; toda lista das ferramentas, as skills e a linha de conexões pela vista | `builder/company-tools/`, `builder/assistant/`, `builder/conversation/`, `builder/construtor/`, `builder/agents/`, `builder/data-tools/`, `builder/connectors/`, `.dependency-cruiser.cjs` | [testing](../guides/testing.md) | U2 |
| G2 | U4 O teto | o agente salvo lê o papel de quem o roda ∩ o que a versão declara, na lista, na leitura, no caderno e na escrita | `hub/identity/`, `hub/access/`, `hub/connectors/`, `builder/agents/`; os testes de `hub/data/` e `builder/automations/` | [security](../guides/security.md) | U2, U3 |

G2 lê os contratos de G1: os grupos não correm em paralelo. Em cada grupo, a ordem da tabela, um commit
por unidade (delivery L9). `hub/connectors/` e `hub/data/` são da trilha Dados (decisão F2).

**Orçamento de código alterado.** U1: cerca de 50. U2: 710. U3: 560. U4: 90.
Total: cerca de 1.410 linhas, 520 a menos, sem contar os testes (inferido pela leitura, não medido).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Construtor e agente mandam os bytes de `conexus.md` sem os brancos das pontas; o Assistente, esses bytes, uma linha em branco e `assistant.md`. Recusa: um byte a mais ou a menos | `agents/conversation.test.ts`, "o texto do Conexus…"; `assistant/instructions.test.ts`, "a mensagem fixa…" | must |
| 2 | U1 | As mensagens de sistema de toda conversa (Assistente no Início e num Projeto, Builder, Construtor, agente) não mudam um byte | a gravação do passo 5, com o `diff` no pull request | must |
| 3 | U1 | Só `controller-kit/` lê `conexus.md` fora dos testes | `grep -rn "conexus.md" apps/server/src --include=*.ts` | should |
| 4 | U1 | O `app_data_read` do Builder e o do agente: mesma descrição e mesmo esquema | `app-data/context.test.ts`, "o mesmo app_data_read" | must |
| 5 | U1 | O `app_data_read` lê, corta, recusa (`NOT_FOUND`, `APP_DATA_NO_APP`, SQLSTATE) e estoura o tempo como hoje | `agents/app-data.test.ts`, `app-data/access.test.ts`, sem mudar | must |
| 6 | U1 | Toda descrição de leitura de conector (`connector_read` do Builder, do Construtor e do agente; leituras tipadas) diz "At most 50 connector calls per answer.". Recusa: "per run" ou outro número | `conversation/conversation-connectors.test.ts`, "o Builder diz o teto como os outros" | must |
| 7 | U1 | Fora o `connector_read` do Builder, nenhuma descrição nem esquema muda | a gravação do passo 5 | must |
| 8 | U1 | A 51ª chamada de conector de uma execução volta `CALLS_SPENT` | `conversation/conversation-connectors.test.ts:184`; `hub/connectors/assistant-port.test.ts:170`, sem mudar | must |
| 9 | U1 | O comentário de `conexus_overview` cita uma linha que existe | revisão: `mastra-1.83` `mastracode/factory/src/tools/read-tools.ts:245` | should |
| 10 | U2 | `GET /assistant/connections`, na empresa e num Projeto, lista só a conexão com operação no alcance; "Vazio" recebe `[]`, o dono as duas | `assistant/reach-choice.test.ts`, "a lista não oferece a conexão fora do alcance" | must |
| 11 | U2 | Criar com ela: 201, sem ela na escolha, em `connections` e na linha | idem, "criar: ela não fica" | must |
| 12 | U2 | `PUT …/connections` com ela: nem a resposta nem a linha a têm | idem, "trocar: ela não fica" | must |
| 13 | U2 | A conversa lida lista só as alcançadas, com `chosen` da linha | idem, "a conversa lida não a nomeia" | must |
| 14 | U2 | A automação criada com ela não a guarda nem a nomeia no resumo | `automations/reach-choice.test.ts`, "a automação não a guarda" | must |
| 15 | U2 | Lei (b) na empresa: toda leitura em `systems[].reads` da `data_describe` é uma leitura tipada oferecida que responde OK; a Filial não escolhida não aparece | `assistant/describe-reads.test.ts`, "lei (b) na empresa" | must |
| 16 | U2 | O mesmo num Projeto com as duas liberadas | idem, "lei (b) no Projeto" | must |
| 17 | U2 | Os quatro consumidores passam as leis (a), (b) e (e); o Assistente com `CHOSEN` | `hub/access/conformance.test.ts`, por consumidor | must |
| 18 | U2 | `view.list('system')`: `CHOSEN` = escolhidas ∩ alcançadas, `ANY` = alcançadas; tabelas iguais | idem, "a escolha estreita os sistemas, não as tabelas" | must |
| 19 | U2 | A thread do Assistente com a marca de outra empresa: `CONVERSATION_NOT_FOUND`, sem chamada ao modelo | `assistant/run-scope.test.ts`, "marca de outra empresa" | must |
| 20 | U2 | A marca de Projeto estragada não muda o lugar do turno (vale o da linha) | idem, "o lugar vem da linha" | should |
| 21 | U2 | Construtor: a marca de um Projeto de outra empresa dá `CONVERSATION_NOT_FOUND` | `construtor/run-scope.test.ts`, "Projeto de outra empresa" | must |
| 22 | U2 | A rodada de automação segue sem `propose_app` (`attended: false`) | `assistant/propose.test.ts:113` | must |
| 23 | U2 | Saem `SessionScope`, `ScopeOf`, `projectIn`, `sessionScopes`, `runsOf`, `contextOf`; nada entra em `.dependency-cruiser-migration.cjs` | `npm run typecheck`, `npm run deps`, o grep do passo 4 | must |
| 24 | U2 | As chaves de marca ficam byte a byte: listar, buscar e apagar conversas de antes funciona | `assistant/list-search.test.ts`, `assistant/release.test.ts`, `construtor/`, `agents/release.test.ts`, sem mudar | must |
| 25 | U2 | O agente lê como hoje; o caderno de uma conexão fora da versão é `NOT_GRANTED` | `agents/agent-read.test.ts`, "o caderno fora da versão" (novo) | must |
| 26 | U2 | As suítes de `hub/connectors`, `hub/data`, `assistant`, `construtor`, `agents`, `automations`, `conversation` passam sem mudar asserção | as suítes | must |
| 27 | U2 | As instruções de cada agente não mudam um byte | `assistant/instructions.test.ts`, `conversation/` | should |
| 28 | U2 | O Construtor lê toda conexão recebida pelo Projeto (`ANY`) | `construtor/code-tool.test.ts`, sem mudar | should |
| 29 | U2 | Banco fora na porta ao listar, criar, trocar a escolha ou criar a automação: `DATABASE_UNAVAILABLE`, nada guardado | `assistant/database-down.test.ts`, "a porta fora na criação" e "na troca" (novos); `automations/reach-choice.test.ts`, "a porta fora" | should |
| 30 | U3 | Cada assento recebe os nomes de ferramenta do `main` `f4ccc150`. Recusa: um nome a mais ou a menos | `company-tools/tool-sets.test.ts`, "os nomes de hoje" | must |
| 31 | U3 | Nenhuma ferramenta de `TOOLS_OF`, em assento algum, nomeia algo fora da vista. Recusa plantada: `clientes`, `sankhya_clientes` | `company-tools/conformance.test.ts`, "lei (a): nada de fora…" | must |
| 32 | U3 | Tudo o que uma ferramenta lista está na vista do assento | idem, "lei (a): tudo está na vista…" | must |
| 33 | U3 | O `search_tools` não acha nem carrega a leitura de uma conexão fora da vista | idem, "a busca só acha as da vista"; `assistant/typed-reads.test.ts`, "a leitura fora do papel não existe" | must |
| 34 | U3 | A conexão recebida sem operação no alcance não traz skill nem nome em `connector_notes` e `connector_read` | `company-tools/conformance.test.ts`, "sem operação no alcance", por assento | must |
| 35 | U3 | A linha "Connections in this conversation" do Assistente, do Construtor e do agente é a da vista | idem, "a linha de conexões" | must |
| 36 | U3 | A ferramenta responde pela closure: um `requestContext` com a marca de outra empresa não muda a resposta | idem, "pela closure" | must |
| 37 | U3 | O `conexus_overview` lista as alcançadas, com `chosen` pela escolha, nunca uma não alcançada | idem, "o resumo…"; `assistant/overview-reach.test.ts`, sem mudar | must |
| 38 | U3 | O `copy_runs` dá `NOT_FOUND` à tabela fora da vista, também num Projeto | `assistant/copy-runs.test.ts`, sem mudar; `conformance.test.ts`, "copy_runs num Projeto" | must |
| 39 | U3 | `copy_propose` e `connector_note_save` do Builder recusam a conexão fora da vista como a inexistente, sem gravar | `conformance.test.ts`, "a proposta e a anotação recusam" | must |
| 40 | U3 | As suítes públicas de hoje passam sem mudar | `assistant.test.ts`, `construtor.test.ts`, `agent.test.ts`, `copy-runs.test.ts`, `overview-reach.test.ts`, `note-save.test.ts`, `conversation/permissions.test.ts` | must |
| 41 | U3 | Nenhum de `offersRead`, `connectionsOffered`, `reachedBy`, `grantedFor`, `admittedFor`, `dataOfScope` e o `builderDataOf` de `builder.ts` resta | grep na revisão; `npm run typecheck` | must |
| 42 | U3 | `company-tools` em `AGENTS_AND_APPS`; a lista de migração não cresce | `npm run deps` | must |
| 43 | U3 | O `## Connections` do Builder não muda um byte quando toda conexão recebida tem operação no alcance | o teste do critério 13a do passo 20, sem mudar | should |
| 44 | U3 | O `connector_read` do ajudante de pesquisa só nomeia escolhidas da vista | `assistant/research.test.ts`, sem mudar; `conformance.test.ts`, assento `research` | should |
| 45 | U3 | A rodada de automação não leva `connector_note_save`, nem para quem administra conexões | `assistant/note-save.test.ts`, "a rodada de automação…", sem mudar | must |
| 46 | U3 | A vista é lida uma vez por execução; duas no Assistente com escolha (`view`, `reach`) | `conformance.test.ts`, "uma vez por execução" | should |
| 47 | U3 | A thread com a marca de outra empresa não monta ferramenta da empresa; a recusa é do 19 | idem, "marca de outra empresa", só a fábrica | must |
| 50 | U4 | Tirada `pedidos` do papel de quem roda o agente que a declara, a vista seguinte não a lista e `may` dá `OUT_OF_REACH` | `hub/access/conformance.test.ts`, "lei (e) em agent (ROLE)" | must |
| 51 | U4 | A versão que declara `empresas`, rodada por um Atendente só com `pedidos`: `NOT_IN_ROLE` com o papel, nada ao dublê | `hub/connectors/role-doors.test.ts`, "a versão não alarga o papel" | must |
| 52 | U4 | A versão ainda estreita: `consultar` no papel e não declarada dá `NOT_IN_ROLE`; `pedidos`, declarada, lê | idem, "o funil: a versão lê só o que declara" | must |
| 53 | U4 | O catálogo do agente é o declarado ∩ o papel de quem roda; vazio sem leitura | `hub/data/catalog-role.test.ts`, "declara dentro do papel" | must |
| 54 | U4 | Pela rota da conversa, o agente salvo rodado por um Desenvolvedor sem a leitura é recusado, nada ao dublê; pelo Dono, lê | `builder/agents/agent-read.test.ts`, "o teto" | must |
| 55 | U4 | A escrita em Faz sozinho de uma versão do Administrador, rodada por um Desenvolvedor sem a escrita, dá `NOT_IN_ROLE`, sem cartão nem pedido ao Sankhya | `builder/agents/autonomy.test.ts`, "o teto na escrita" | must |
| 56 | U4 | Aprovação só na escrita, como hoje; nenhuma leitura suspende; `D2-a` e `D3-a` valem | `builder/agents/approval.test.ts` (5), (6), (8), (20); `autonomy.test.ts` `D2-a`, `D3-a`; `answer.test.ts`, sem mudar | must |
| 57 | U4 | A conversa de teste do rascunho segue o mesmo teto | `builder/agents/agent-read.test.ts`, "o teto do rascunho" | must |
| 58 | U4 | O caderno no agente segue o papel: sem `consultar`, `NOT_IN_ROLE`; com ele, lê | `hub/connectors/role-doors.test.ts`, "o caderno do agente" | should |
| 59 | U4 | O papel tirado no meio da conversa recusa a chamada seguinte, nada ao dublê | idem, "o papel muda no meio" | must |
| 60 | U4 | O app publicado lê como o Projeto: sem a operação no papel, `OK` | `hub/connectors/app-calls.test.ts`, "o app lê como o Projeto" | must |
| 61 | U4 | A corrida da cópia lê pela operação declarada, como hoje | `hub/connectors/copy-port.test.ts`, sem mudar | should |
| 62 | U4 | Tirar o dono da empresa apaga as automações dele e os runs | `builder/automations/release.test.ts`, "tirar uma pessoa…", sem mudar | must |
| 63 | U4 | Dono rebaixado: o disparo não abre conversa, `SKIPPED` com `OWNER_CANNOT_ASK`, automação `PAUSED` | `builder/automations/run.test.ts`, "o dono virou membro…", sem mudar | must |
| 64 | U4 | Papel do dono estreitado depois da criação: a execução seguinte não recebe a operação, nada ao dublê | `builder/automations/role-run.test.ts`, "papel do dono estreitado" | should |

Não há 48 nem 49; a U4 guarda os seus números.

## A matriz de estados

Nenhuma tela nem texto novo. As listas de conexões da conversa nova e da automação, e os resumos,
mostram só as conexões de que o papel usa algo (critérios 10 a 14), com os estados de hoje, o vazio
incluído.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `RunScope.kind`, `owner`, `conversation` | `runResolver` | `kind` e `owner`: `principalOf`; `conversation`: `machineMarks` e `keptRun`; os três: a fábrica (U3) |
| `RunScope.place` | o `stored` de cada dono | `principalOf`, `speakersOf`, as marcas da máquina |
| `RunScope.choice` | o `stored` (linha do Assistente; `selected` do agente; `ANY` nos outros) | `principalOf` → `Principal.choice` |
| `RunScope.ceiling` | o `stored` do agente | `principalOf` → `declared`; U4 |
| `RunScope.attended` | o `stored` do Assistente (marca de automação) | a lista de ferramentas (`propose_app`); U3 |
| `Principal.choice` | `principalFor` | `createAccess.viewFor`, `assistant-port.ts` `readable`, `write.ts:81` |
| `CompanyToolScope.run` | `runResolver` (U2) | `companyTools`, `companyConnections`, o resumo (`chosen`) |
| `CompanyToolScope.view` | `companyToolScope` | toda ferramenta, `inView`, o filtro do `search_tools` |
| `CompanyToolScope.reach` | `companyToolScope` | só o `conexus_overview` |
| `CompanyToolScope.grants` | cada montagem (`maysOf` no Assistente, `data.access` no Builder, `frozen.appData` no agente) | a poda de `companyTools` |
| `TOOLS_OF` | `company-tools/names.ts` | `companyTools`; `tool-sets.test.ts` |
| `Speaker` `AGENT` (`personId`, `role`, `declared`) | `withinVersion`, chamado por `access/public.ts`, `assistant-port.ts` `mayAsk` e `write.ts` `admitted` | `may-use.ts` `mayUseEach`, `speaking.ts` `mayUseNotebook`, `roleOfSpeaker` (`read.ts:147`, `write.ts:107`) |
| `WriteRequest.speaker` `AGENT` (`personId`, `declared`) | `builder/agents/tools.ts` `requestOf` | `write.ts` `admitted`; `write-record.ts` `aboutOf` (pela `agentId`) |
| `Declared` (dona: `hub/identity/may-use.ts`, desde a U2) | `builder/agents/frozen.ts` `declaredOf` (`:262-271`) | `may-use.ts`; `access/model.ts`; `Principal.declared` |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Criar a conversa do Assistente (`openConversation`: a porta lê, `chosen.keep` grava, depois a thread) | a mesma chave dá o mesmo id; outro lugar, `IDEMPOTENCY_CONFLICT` (já, `routes.test.ts:32`); o papel que muda entre a leitura da porta e a gravação vale na próxima leitura (cada chamada confere, S10) | cortada depois da linha: a repetição acha a linha e termina, com a primeira escolha (`create.test.ts:22`) | o banco fora na porta: 503 `DATABASE_UNAVAILABLE`, nada guardado | `ASSISTANT_CONVERSATION_CREATED` uma vez | 11, 29 |
| Trocar a escolha (`routes.ts:271-283`: a porta lê, `chosen.change` grava) | vale a última (`chosen.ts:64-69` substitui); o papel, como acima | a repetição grava a mesma lista | como acima | `ASSISTANT_CONNECTIONS_CHANGED` por troca | 12, 29 |
| Criar a automação (`automations.ts:156-187`: a porta lê, `schedules.create` grava) | a mesma chave, a mesma automação (`:156`; a corrida, `:183`); o papel, como acima | a repetição a acha (`:156`) | como acima | `AUTOMATION_CREATED` uma vez | 14, 29 |

As outras gravações não mudam: `connector_note_save` e `copy_propose` só aceitam conexões da vista
(critério 39); a escrita recusada pelo teto não grava linha (critério 55).

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
| A fábrica de ferramentas da empresa | U3 | quatro `tools:` à mão: `assistant.ts:247-264`, `builder.ts:172-191`, `construtor.ts:197-222`, `agent.ts:249-290` | `mastra-1.83` `mastracode/factory/src/tools/index.ts:33-56`; `factory.ts:1898-1912,1980-1994`; `mcp/routes.ts:178-190` | um conjunto por escopo resolvido, o subconjunto por tipo dentro da fábrica, nome repetido recusado | nativo | — | — | `company-tools/factory.ts`, `names.ts` |
| O escopo por closure | U3 | `data-tools/tools.ts:175-179`, `copy-runs.ts:96`, `overview.ts:39` leem o `requestContext` | `tools/index.ts:34-36`; `read-tools.ts:222-223`; `@mastra/core` 1.83 `reference-agents-agent.md:558,564` | a ferramenta recebe o escopo e as portas na construção; só a função `tools` lê o pedido | nativo | — | — | `company-tools/scope.ts` |
| As leituras tipadas sob demanda | U3 | `typed-search.ts:34-40`; `offersRead`, `typed-reads.ts:59-67` | `reference-processors-tool-search-processor.md:48,100-127` (`filter`); `:131,157` (`includeResolvedTools` esconde tudo) | catálogo fixo na construção, filtro por pedido | nativo: o `filter` lê `scope.view` | — | — | `company-tools/search.ts` |
| As listas, as skills e a linha de conexões | U3 | `overview.ts:98-130`; `copy-runs.ts:103`; `builder.ts:44-87,165-170`; `construtor.ts:143,163-166,192`; `agent.ts:199,331-335`; `assistant.ts:265-270` | `hub/access/view.ts:19-38`; code C81; `read-tools.ts:223` | cada lista lê só o escopo resolvido | nativo | — | — | `company-tools/listed.ts` |
| `kitReads` e `legacyTools` | fica de fora | `agent.ts:173-184`; `agents.ts:181,227,276`; `tools/check.ts:50` | — | — | nativo, sem mudança: a edição e as versões anteriores à E4 ainda os usam; o teto da U4 vale nelas na chamada | — | — | — |
| O alcance do agente salvo (lista e execução) | U4 | `may-use.ts:93`; `access/public.ts:46-51`; `assistant-port.ts:129`; `speaking.ts:97`; `agents/tools.ts:177-185`; `write.ts:101` | `mastra-1.83` `mastracode/factory/src/tools/scope.ts:96-104`; `better-auth@1.7.8` `dist/plugins/organization/has-permission.mjs:7` | a sessão de uma pessoa age como quem entrou, resolvida a cada vez; o papel, pelo `hasPermission` | embrulhado: o `hasPermission` decide o papel; o nosso código só acrescenta a interseção com a declaração | critérios 50 a 59 | P1 (a), 2026-11-14; 1(a), 2026-11-16; opção 1 "fora do papel ninguém vê", 2026-11-16; `C1`, 2026-11-06 (segue valendo na publicação) | — |
| A automação roda como o dono, pelo papel de agora | U4 | `automations/run.ts:79-90,205-215`; `assistant-port.ts:121-129` | `mastra-1.83` `mastracode/factory/src/tools/scope.ts:96,99-100` | o trabalho sem pessoa age como o dono da linha | nativo, já no `main` | critérios 62 a 64 | e242 (automações) | — |
| O app publicado lê como o Projeto | fica de fora (decisão 3(d)) | `app-calls.ts:102-107` | `mastra-1.83` `mastracode/factory/src/tools/scope.ts:96-100` (o trabalho sem pessoa age como a linha guardada) | o app tem o seu principal; quem o usa é a lista do app | nativo, já no `main` | critério 60 | 3(d), 2026-11-16 | — |

**A medida do transplante.** Nada vem do repositório antigo.

**A dívida.**

- `keptRun` (seis chamadores de rota) e `InProject` (id de rota do S8) ficam, fora do escopo do turno.
- As chaves das marcas ficam as de hoje, sob `RUN_MARKS`, para não migrar threads guardadas.
- `kitReads` e `legacyTools`, como diz a linha deles.
- As leituras tipadas resolvem o escopo pelo pedido, não por closure: o catálogo do
  `ToolSearchProcessor` é fixo na construção; o filtro lê a mesma vista.
- Num Projeto, a tabela do Builder, do Construtor e do agente sai da liberação ao Projeto, não do papel de
  quem conversa; a leitura com o login do papel é do Registro e conformidade (U4 de permissões,
  `view.read`).

## As decisões do firstmate

| # | Decisão reversível ([delivery L6](../guides/delivery.md)) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| F1 | A automação não ganha variante de teto: roda como o Assistente do dono, com `choice: CHOSEN` das conexões dela e `attended: false` | as conexões dela já chegam como escolha (C26); o dono que sai ou é rebaixado já a para (`automations/release.test.ts:84`, `run.test.ts:196`) | uma variante `AUTOMATION` em `Ceiling` |
| F2 | A U2 muda `hub/connectors/` e `hub/data/` (trilha Dados) na própria unidade, sem um pull request de Dados antes | os verbos de `company-data.ts` não mudam (o pedido por issue `contrato` vale para eles), nada de Dados está em construção (L1), e a H1 tira `SessionScope` de `hub/connectors` | separar os passos 1 e 2 da U2 num pull request da trilha Dados |
| F3 | Criar ou trocar a escolha com uma conexão fora do alcance descarta a conexão, sem código de recusa novo | a criação já faz isso com a conexão que o lugar não oferece (`packages/hub-api/src/assistant.ts:275`, `routes.test.ts:32,127`) | um código de recusa próprio |
| F4 | A descrição do `connector_read` do Builder diz "per answer", como as outras | `RunId` (`runs/runs.ts:120`) e `TurnKey` (`controller-kit/turns.ts:103-105`) contam uma resposta; ninguém vê a descrição | voltar a palavra |
| F5 | O `copy_runs` num Projeto acha só as cópias liberadas ao Projeto | segue a vista (code C81), "a pessoa ∩ o Projeto" (C(b), do fundador) | voltar a lista da empresa no `copy_runs` |
| F6 | `Choice` e `Place` moram em `hub/access/model.ts`, `Declared` em `hub/identity/may-use.ts`; o tipo de conversa é o `ControllerKind` de hoje; o agente salvo também leva `choice` (as ligações que a versão selecionou) | `hub-does-not-import-builder`; `controller-kit/kinds.ts:19-26` já é o dono (C26); com `ANY` a versão leria todo caderno do Projeto (`agents/agent.ts:185-192`) | mover os tipos |
| F7 | A ferramenta da versão que o papel de quem roda não alcança fica na lista do modelo e recusa na chamada (`NOT_IN_ROLE`) | esconder a escrita tiraria o cartão que a `D3-a` confere (`autonomy.test.ts:283`); o catálogo já não a lista (critério 53); difere da tabela de consumidores do estudo: mostra e recusa | filtrar as ferramentas da versão pela vista na fábrica |
| F8 | O `Speaker` ganha a variante `AGENT` (pessoa, papel e declaração); `VERSION` fica para o app publicado e a corrida da cópia | `app-calls.ts:104-107` e `copy-port.ts:125-130` não mudam (3(d)) | juntar as variantes |
| F9 | As ferramentas do Knowledge ficam fora de `CompanyToolName` | entram pelo `knowledge` do Mastra, não por `tools:` (`assistant/company-memory.ts:11-15,345-353`) | trazê-las para a fábrica quando a memória do Projeto entrar |
| F10 | `conexus.md` fica em `conversation/prompt/`; o dono da leitura é `controller-kit/instructions.ts` | dois testes o leem pelo caminho (`assistant/instructions.test.ts:23`, `agents/conversation.test.ts:31`) | mover o arquivo |
| F11 | A recusa dos critérios 19 e 21 é a da rota: o `guard` lê a marca pela `markIn` de `controller-kit/run.ts` e a marca de outra empresa ou pessoa dá 404 `CONVERSATION_NOT_FOUND`; a admissão do Construtor recusa o Projeto da marca que não é vivo na empresa do dono | sem isso o `guard` só lia o recurso, o turno começava e as instruções lançavam antes do `processInput`: nenhuma chamada ao modelo, mas a pessoa lia `MODEL_CALL_FAILED`, porque `CONVERSATION_NOT_FOUND` não é `TurnFailureCode` (`packages/hub-api/src/conversations.ts:47-62`); os outros 404 do `guard` já são a recusa da conversa alheia (`conversation/guard.test.ts:85`) | tirar `markIn` do `guard` e `construtorAdmission`, e levar a recusa ao fluxo com um `TurnFailureCode` novo |

## U1 Subtrair

**Base e modelo.** `main` `f4ccc150`, `@mastra/core` 1.83.0. Sonnet: quatro deduplicações em `builder/`,
sem desenho entre módulos; nenhuma ferramenta nem tela muda.

### As linhas da tabela

Além das linhas U1:

1. **O texto fixo.** Os três leitores já importam `fixedSystem` (`controller-kit/instructions.ts:7`,
   por `public.ts:4`). O Builder lê `conversation/prompt/builder.md`, não `conexus.md`. Na referência,
   `buildFullPrompt` e `buildBasePrompt`.
2. **`app_data_read`.** `appDataTools` (`AGENT_TOOL.appDataRead`) e `builderAppDataTools`
   (`APP_DATA_TOOL.read`, o mesmo id por `packages/hub-api/src/agents.ts:165`) dividem `AppDataInput`
   (`:12`), `answered` (`:42-53`) e `withDeadline` (`:56-59`); muda só a porta (`AppDataPort.read`,
   `app-data/port.ts:16-21`, ou `BuilderData.read`, `hub/apps/builder-data.ts:20`).
3. **O teto.** O 50 conta em `createSpending` (`:122-133`) e só sai para testes
   (`hub/connectors/test-app-calls.ts:24`); `assistant/typed-search.ts:35` lê `ASSISTANT_LIMIT`.
   `answerWords` (`connector-tools.ts:197-199`) põe a frase em `connector_read` (`:248`) e nas leituras
   tipadas (`connectors/typed-reads.ts:105`).
4. **A citação.** Hoje cita `supervisor/read-tools.ts:187` e `factory_overview`; a irmã
   (`read-tools.ts:245-286`) corta em `MAX_LIST` como o "at most 50" de `overview.ts:36`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/controller-kit/` (`instructions.ts`, `public.ts`) | cria a constante do texto, ao lado de `fixedSystem` | `assistant/instructions.ts`, `construtor/construtor.ts`, `agents/agent.ts` |
| `builder/assistant/` (`instructions.ts`, `connector-access.ts`, `typed-search.ts`, `overview.ts`) | apaga a leitura de `conexus.md`, `ASSISTANT_LIMIT` e o argumento do teto; corrige um comentário | `assistant/assistant.ts` |
| `builder/construtor/construtor.ts` | apaga a leitura de `conexus.md` e o `limit` da `wording` | `construtor/public.ts` |
| `builder/agents/agent.ts` | idem | `agents/controller.ts` |
| `builder/app-data/tools.ts` | as duas fábricas montam `app_data_read` por uma função privada; os nomes exportados ficam | `conversation/builder.ts:186`, `agents/agent.ts:270`, os testes de `app-data/` |
| `builder/connectors/` (`connector-tools.ts`, `typed-reads.ts`, `test-access.ts`) | `wording` perde `limit`; `answerWords` e `typedReads` perdem o parâmetro do teto | `assistant/`, `construtor/`, `agents/`, `conversation/builder.ts` |
| `hub/connectors/public.ts` (Plataforma) | exporta `CONNECTOR_CALLS_PER_TURN` (C4) | `builder/connectors/connector-tools.ts` |
| `builder/conversation/conversation-connectors.test.ts` | o caso novo do 6 | — |

`builder/conversation/prompt/conexus.md` fica onde está (decisão F10).

### Os contratos que a unidade cria

Nenhuma rota, coluna, código de falha ou tipo do `@conexus/hub-api`:

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

Apaga o que os passos 1 e 3 dizem. Nenhum estado ou id novo (`AppDataCheckOutput`,
`app-data/tools.ts:91-99`, C21; C23). Donos (C4, C26): o texto, `controller-kit/instructions.ts`
(`conversations-do-not-import-the-assistant`); o 50, `hub/connectors/builder-port.ts:33`; a frase,
`answerWords`; a ferramenta, `appDataReadTool`. Zod: `AppDataInput` (C27). Modelo: `app-data/tools.ts`.

### As skills e a leitura

`docs/reference/stack.md`, linhas de `apps/server/src/builder`: a skill `mastra`; ler primeiro `createTool`
no `dist/docs`. Guia: testing (T5, T26, T27).

### A ordem do trabalho

**Arquivos** e **Referência a seguir** de cada passo: os do raio e a linha da tabela da peça.

1. **Um dono do texto do Conexus.** Critérios: 1, 2, 3.
   - **O que sai:** `FIXED` de `construtor.ts:59-62` e `agent.ts:50-53`, a primeira entrada do array de
     `assistant/instructions.ts:20` e os `readFileSync` sem uso.
   - **O que entra:** `CONEXUS_PROMPT` por `new URL('../conversation/prompt/conexus.md', import.meta.url)`
     com `.trim()`; Construtor e agente, `fixedSystem(CONEXUS_PROMPT)`; o Assistente,
     `[CONEXUS_PROMPT, assistant.md com trim].join('\n\n')`. Regras: C4, C26.
   - **Testes e mutações à mão:** o caso novo do 1; sem `.trim()`, vermelhos ele e "a mensagem fixa…";
     com `'\n'` no Assistente, este.
   - **Pronto quando:** o grep do 3 mostra só `controller-kit/instructions.ts`, o comentário de
     `assistant/instructions.ts:17` e os dois testes.
2. **Uma fábrica de `app_data_read`.** Critérios: 4, 5.
   - **O que sai:** os dois `createTool` de leitura (`:72-84`, `:111-117`).
   - **O que entra:** `appDataReadTool(read)` com `APP_DATA_TOOL.read`, `READ_DESCRIPTION`, `AppDataInput`
     e `answered(await read({ text: sql }, withDeadline(abortSignal)))`. `appDataTools` passa
     `(statement, signal) => deps.appData.read({ scope: deps.scope, projectId: deps.projectId, statement, signal })`;
     `builderAppDataTools`, `(statement, signal) => data.read(ids, statement, signal)`. C26.
   - **Testes e mutações à mão:** o caso novo do 4, no molde de `app-data/context.test.ts:257-275`; a
     leitura crua no lugar de `answered` deixa vermelhos "o Builder lê com o corte das leituras de
     conector" e "lê: a ferramenta devolve as linhas…"; sem `withDeadline`, "o tempo…" (ou T27).
   - **Pronto quando:** `npm run quality -- --fast` não acha clone ali.
3. **Um dono da frase do teto.** Critérios: 6, 7, 8.
   - **O que sai:** `ASSISTANT_LIMIT` e seu import em `typed-search.ts:7`; o `limit` das quatro `wording`
     (`'50 connector calls per answer'`, e `'50 connector calls per run'` no Builder) e de
     `test-access.ts:46`; o parâmetro `limit` de `answerWords`, `typedTool` e `typedReads`.
   - **O que entra:** `answerWords()` escreve `` `At most ${CONNECTOR_CALLS_PER_TURN} connector calls per answer.` ``
     no lugar de `` `At most ${limit}.` ``. Regras: C4, C26.
   - **Testes e mutações à mão:** o caso novo do 6 lê `descriptions.connector_read` de `on.calls`;
     `per run` o deixa vermelho, e o teto em 51, ele e o do 8.
   - **Pronto quando:** `grep -rn "connector calls per" apps/server/src --include=*.ts` mostra só `answerWords`.
4. **A citação.** Critério: 9. O comentário de `assistant/overview.ts:20-24` passa a dizer "Factory
   `factory_list_work_items`, `mastracode/factory/src/tools/read-tools.ts:245` (`createFactoryReadTools`,
   Mastra 1.83)".
5. **A gravação de antes e depois.** Critérios: 2, 7. Um teste temporário, fora do commit, roda um "Oi"
   pela porta pública em cada conversa (Assistente no Início e num Projeto, `assisting`; Builder,
   `conversing`; Construtor, `building`; agente publicado, `agentsOn`) e grava da primeira chamada ao
   modelo o `Sent` de `platform/test-anthropic-body.ts` (`systems`, `tools`, `descriptions`, `schemas`),
   com ids e data trocados por marcas fixas. Roda em `f4ccc150` e no commit da unidade; o `diff` vai no
   pull request (T26). Pronto quando o `diff` tem uma linha só, `per run` para `per answer`.

### Como se prova

O caso novo do 1 passa hoje (as mutações provam que vê um byte a mais); o do 6 falha (`per run`).
Mudam só o argumento de `typedReads` em `connectors/typed-reads-openai.test.ts:75` e
`connectors/test-access.ts:46`, sem asserção.

### Parar se

- O `diff` do passo 5 mostrar outra diferença: ache-a.
- `dependency-cruiser` recusar o import de `CONNECTOR_CALLS_PER_TURN` em `builder/connectors/`: reporte;
  não copie o número.
- A U2 já tiver mudado `hub/connectors/public.ts`: junte, sem reescrever a da U2.

## U2 Um escopo

**Base e modelo.** `main` `f4ccc150`, `@mastra/core` 1.83.0. Opus: cruza `hub/access`, `hub/connectors`,
`hub/data` e as quatro conversas, e muda o tipo que 29 arquivos importam.

### As linhas da tabela

Além das linhas U2:

- **O escopo.** Também `context.ts:40-47`, `controller.ts:59-77` (`keptRun`), `turn-of.ts:75-87`
  (`projectIn`). Na Factory, `scope.ts:107` lê o projeto com a organização de quem chama; `:118` é o
  `interactive` (aqui `attended`).
- **A marca.** `assistant/context.ts:14-20`, `construtor/open.ts:13-26`, `agents/controller.ts:50-56`,
  `assistant/open.ts:68-112`. Na referência, `tags: Record<string, string>`; `:732` põe o `controller` na `requestContext` (tipo em
  `types.ts:1142`).
- **A escolha.** Também `principal.ts:40-61`, `public.ts:35-58`; `contextOf` (`hub/data/public.ts:41-63`)
  manda o Assistente num Projeto como `builder`.
- **A lista (issue 1147).** Também `routes.ts:91-107,271-283`. A causa: `visibleTo`
  (`hub/connectors/speaking.ts:69-80`) filtra as leituras e mantém a conexão sem nenhuma.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `hub/access/` (`model.ts`, `principal.ts`, `public.ts`, `view.ts`) | o passo 1; exporta `Place` (já em `model.ts:16`) e `Choice`; importa `Declared` | `hub/data/`, `hub/connectors/`, `builder/controller-kit/run.ts`, `builder/assistant/routes.ts`, `automations/automations.ts`, `main.ts` |
| `hub/identity/may-use.ts`, `public.ts` | recebe `Declared`; sai o `Extract` de `access/model.ts:18` | `hub/access/model.ts`, `hub/connectors/` |
| `hub/access/conformance.test.ts` (Dados) | cenários por `Principal`; `assistant` com `CHOSEN`; `construtor` | — |
| `hub/connectors/` (trilha Dados): `scope.ts`, `assistant-port.ts`, `write.ts`, `write-record.ts`, `approval.ts`, `tool-door.ts`, `public.ts` | o passo 2; `readable` está em `:169` | as conversas de `builder/`, `conversations-of.ts` |
| `hub/data/` (trilha Dados): `public.ts`, `query.ts`, `rows.ts` | apaga `contextOf`; `createCompanyData` recebe `Principal` | `main.ts:213`, `conversations-of.ts:164` |
| `hub/copies/readers-routes.test.ts:145-148` | o literal `{ place, chosen: [] }` vira `principalFor(...)` | — |
| `builder/controller-kit/` | cria `run.ts` (lê `conversationRun` de `controller-context/public.ts`, como `turns.ts:8`) e `test-run.ts`; `public.ts` exporta | as quatro conversas |
| `builder/assistant/` | apaga o do passo 4 e o `offeredOnly` de `public.ts:4`; muda `assistant.ts`, `routes.ts`, `open.ts`, `overview.ts`, `research.ts`, `typed-search.ts`, `propose.ts`, `connector-access.ts`, `turn.ts`, `company-memory.ts`, `propose-company-memory.ts`, `copy-runs.ts`, `search.ts`, `release.ts`, `test-assistant.ts` | `automations/`, `conversations-of.ts` |
| `builder/automations/automations.ts` | lista e criação pela porta, `ANY` | rotas de automação |
| `builder/construtor/` (`construtor.ts`, `open.ts`, `routes.ts`) | apaga o do passo 4; `RUN_MARKS` | — |
| `builder/agents/` (`agent.ts`, `controller.ts`, `tools.ts`, `code-tools.ts`, `open.ts`, `conversation-routes.ts`) | apaga `runsOf`; `keptRun` vira o leitor guardado do agente | `construtor/draft-trial.ts` |
| `builder/conversation/` (`turn-of.ts`, `builder.ts`) | apaga `projectIn`; `builderDataOf` recebe `principalOf` | — |
| `builder/tools/check.ts` | `sessionScopeOf` devolve `Principal` (`builder`); `InProject` fica | `tools/`, `agents/agents.ts`, `agents/conversation-routes.ts` |
| `conversations-of.ts`, `main.ts` | `companyData` e `access` com `Principal` | — |

Os 29 arquivos (não teste) de `SessionScope`. Apaga: `hub/connectors/scope.ts`; o reexport de
`public.ts:61`; o tipo do escopo em `assistant/context.ts` (fica `machineMarks` sobre `RunScope`). Passam a `Principal`: `assistant-port.ts`,
`approval.ts:107`, `tool-door.ts:13`, `write-record.ts:33,251`, `test-write.ts:25,81`; `hub/data/public.ts`,
`query.ts:44-118`, `rows.ts:13`; `routes.ts:27,91` (pela porta); `test-assistant.ts:65,201`;
`conversation/builder.ts:9,75,138`; `tools/check.ts:11-50`; `conversations-of.ts:22,164`. Passam a
`RunScope`: `assistant.ts:119-147,352-355` (com `Place`); `propose.ts:102`, `connector-access.ts:15`;
`construtor/construtor.ts:16,87,200` (com `principalOf`); `agents/agent.ts:17,115-133,189`,
`controller.ts:9,201`, `tools.ts:12,89`, `code-tools.ts:6,78` (com `Principal`). O `runResolver` no lugar
de `scopeOf`: `overview.ts:26-118`, `research.ts:47`, `typed-search.ts:20`. `Place` da porta:
`open.ts:12,25,87` (sai `offeredOnly`), `automations/automations.ts:12,26`.

### Os contratos que a unidade cria

Em `hub/access/model.ts` (decisão F6):

```ts
export type Place = Readonly<{ kind: 'COMPANY' } | { kind: 'PROJECT'; projectId: ProjectId }>   // já existe (:16); sai a cópia de hub/connectors/scope.ts:6
export type Choice = Readonly<{ kind: 'ANY' } | { kind: 'CHOSEN'; connections: readonly ConnectionId[] }>
export type ConsumerContext = Readonly<
  | { consumer: 'assistant'; companyId: CompanyId; personId: PersonId; place: Place; choice: Choice }
  | { consumer: 'builder'; companyId: CompanyId; personId: PersonId; projectId: ProjectId }
  | { consumer: 'construtor'; companyId: CompanyId; personId: PersonId; projectId: ProjectId }
  | { consumer: 'agent'; companyId: CompanyId; personId: PersonId; place: Place; declared: Declared; choice: Choice }
>
export function chosenIn(choice: Choice, connection: ConnectionId): boolean
```

Em `principal.ts`, `Principal` ganha `readonly choice: Choice` (`builder` e `construtor`: `ANY`). Em
`public.ts`, `viewFor` corta `systems` por `chosenIn` antes de `mayUseEach`, na ordem do lugar; as
tabelas não dependem da escolha.

Em `builder/controller-kit/run.ts`:

```ts
export type Ceiling = Readonly<{ kind: 'PERSON' } | { kind: 'DECLARED'; declared: Declared }>
export type RunThread = Readonly<{ kind: 'THREAD'; id: ConversationId } | { kind: 'TRIAL' }>
export type RunScope = Readonly<{
  kind: ControllerKind          // kinds.ts:19-26
  owner: Owner
  place: Place
  conversation: RunThread       // TRIAL: teste do rascunho (draft-trial.ts:47)
  choice: Choice
  ceiling: Ceiling
  attended: boolean
}>
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

- **Estados e ids.** Uniões por `kind` (C21); `ANY` é a variante, nenhum `chosen: []` quer dizer "tudo".
  Ids do `@conexus/hub-api`, por parse (C23): o dono pelo recurso (`ownerOfResource`,
  `kinds.ts:61-67`), a conversa por `conversationRun` (`controller-in.ts:37-40`), o resto por `runMark`.
- **Donos.** `Place`, `Choice`, `chosenIn`: `hub/access`; `Declared`: `hub/identity/may-use.ts`, para
  onde a U2 o move. `RunScope`, `RUN_MARKS` e as chaves de marca (as de hoje, byte a byte, que as
  varreduras de remoção procuram): `controller-kit/run.ts`. A escolha é da linha do Hub (Assistente
  `chosen.ts`, agente `keptRun` com a versão), nunca da marca (C26).
- **Entrada externa.** `runMark(kind)`: `z.object` sobre as chaves do tipo, `CompanyId`/`PersonId`
  obrigatórios, `ProjectId` opcional, sem `.refine`: a comparação com o recurso é do `runResolver`. O
  lugar do Assistente e do agente vem da linha (teste F15, `create.test.ts:107`); só o Construtor, sem
  linha, lê a marca de Projeto, conferida contra o Projeto vivo da empresa (`liveProjectOf`), como
  `scope.ts:107` da Factory (C27).
- **Arquivo modelo.** `hub/access/view.ts`: `Verdict` por `kind`, `LeafKey` com marca (parse em
  `reach.ts`), o corte de sistema sem operação num dono (`:27`).
- **Ao apagar.** Nenhuma rota, tabela, coluna ou código de falha novo.

### As skills e a leitura

`docs/reference/stack.md:20` (`@mastra/core`): a skill `mastra`; ler primeiro o `dist/docs` sobre
`AgentController` e `requestContext`. `:34` (`zod`): C27. Nenhuma rota muda de forma. Guia: testing
(T5, T26, T27).

### A ordem do trabalho

1. **A porta aprende a escolha.** Critérios: 17, 18.
   - **Arquivos:** `hub/access/` do raio. **Referência a seguir:** `hub/access/view.ts:19-28`; C81.
   - **O que sai:** nada.
   - **O que entra:** `Choice`, `chosenIn`, `construtor`, `assistant` com `place`; `principalFor` põe
     `ANY` em `builder` e `construtor`. Regras: C21, C26, C81.
   - **Testes:** o cenário `construtor` (`tablesBy: 'RELEASE'`, `revokedBy: 'ROLE'`).
   - **Mutações à mão:** sem o corte por `chosenIn`, vermelho o 18.
2. **`hub/connectors` e `hub/data` recebem `Principal`.** Critérios: 23, 25, 26.
   - **Arquivos:** os do raio. **Referência a seguir:** `assistant-port.ts:121-137` (`mayAsk`:
     `declared` no lugar de `agentVersion`, o mesmo falante; o teto é da U4), `:163-178`.
   - **O que sai:** `SessionScope` e `Place` de `scope.ts`, com os 29 chamadores; `Declared` vai para `may-use.ts`; `contextOf`, com
     `conformance.test.ts:143`.
   - **O que entra:** `idsOf(principal)`; `readable`, `write.ts:81` e `chosenAmong` por
     `chosenIn(principal.choice, id)`. Sem mudar comportamento: `chosen: X` vira `CHOSEN X` em todo
     chamador, salvo o Construtor (passo 4) e a lista da conversa nova (passo 5).
   - **Testes:** as suítes de `hub/connectors/` e `hub/data/`, com `principalFor` no lugar do literal.
   - **Mutações à mão:** `chosenIn` sempre `true` em `readable`: vermelho `assistant-port.test.ts`.
   - **Pronto quando:** `npm run typecheck` e `npm run deps` passam.
3. **`run.ts`: um escopo, uma marca.** Critérios: 19, 20, 21, 24.
   - **Arquivos:** cria `controller-kit/run.ts`; muda `public.ts`. **Referência a seguir:**
     `mastra-1.83` `mastracode/factory/src/tools/scope.ts:58-121`.
   - **O que sai:** nada (passo 4).
   - **O que entra:** `runResolver` lê `conversationRun`, `ownerOfResource` (do tipo do `kind`), a thread
     e `runMark(kind)`; devolve `undefined` se a empresa ou a pessoa da marca difere do recurso; chama
     `stored`. Regras: C21, C23, C27.
   - **Testes:** a marca estranha entra por `plantMark(hub, conversationId, marks)`, novo em
     `controller-kit/test-run.ts`: `updateThread` sobre `createMastraStorage(hub.test.mastraPool)`, como
     `mastra/tracing.test.ts:296-325`; a recusa, o `CONVERSATION_NOT_FOUND` de `conversation/guard.ts:175-181`.
   - **Mutações à mão:** `!==` por `===` na comparação de empresa: vermelho o 19.
4. **As quatro conversas leem `RunScope`.** Critérios: 20, 22, 23, 25, 26, 27, 28.
   - **Arquivos:** `builder/` do raio. **Referência a seguir:** a linha do escopo.
   - **O que sai:** `sessionScopes`, `scopeOn`, `ScopeOf` (`context.ts:29-58`); `scopes` e o `door`
     (`construtor.ts:108-122,200-204`); `runsOf` (`controller.ts:78-87`); `projectIn` (`turn-of.ts:75-87`);
     `automationRunFor` (`open.ts:165-175`), agora `run.attended`; as três marcas, agora `RUN_MARKS`.
   - **O que entra:** o `stored` de cada dono. Assistente: `chosen.of` (`CHOSEN`), `attended` pela marca
     de automação. Builder: `index.projectOf`, `ANY`. Construtor: o Projeto da marca conferido, `ANY` (o
     `door` de hoje passa todas as oferecidas). Agente: `keptRun` mais a versão de
     `registry.resolve(run, activationIn(rc))`, `CHOSEN` = `selected` (`agent.ts:185-188`), `DECLARED` =
     `declaredOf(tools)`; o plano (`agent.ts:154-201`) lê o `RunScope`, sem montar escopo.
   - **Mutações à mão:** `attended` sempre `true`: vermelho `propose.test.ts:113`; a escolha do agente
     `ANY`, o caso novo de `agent-read.test.ts`.
   - **Pronto quando:** `grep -rn 'SessionScope\|ScopeOf\|projectIn\|sessionScopes' apps/server/src` vazio.
5. **A lista da conversa nova pela porta (issue 1147).** Critérios: 10 a 16, 29.
   - **Arquivos:** `assistant/routes.ts`, `assistant/open.ts`, `automations/automations.ts`,
     `conversations-of.ts` (a dependência `access`). **Referência a seguir:** `hub/access/view.ts:27`.
   - **O que sai:** `offeredOnly` (`open.ts:84-93`) e as chamadas de `routes.ts:92,204,275`,
     `open.ts:137`, `automations.ts:90,161`.
   - **O que entra:** `offeredBy(access, owner, place)` = `viewOf(principalFor({ consumer: 'assistant', …,
     choice: { kind: 'ANY' } })).list('system')`; criar e trocar guardam a interseção com ele (F3); a
     conversa lida marca `chosen` pela linha.
   - **Mutações à mão:** `routes.ts:204` de volta a `connectors.connections` (vermelho o 10).

### Como se prova

Pela porta pública (T5). Gravações (T26): a linha `builder.assistant_conversation` e a agenda, lidas de
volta. Hoje falham:
10 a 14 (o papel sem alcance vê e guarda a conexão, `speaking.ts:76-79`); 15 e 16 (a `data_describe`
lista a Filial não escolhida e a leitura tipada a recusa `NOT_CHOSEN`); 17 (sem cenário `construtor`,
`satisfies Record<Consumer, Scenario>` em `conformance.test.ts:86` não compila depois do passo 1); 19 e
21 (nenhum resolvedor compara a marca com o recurso). Não compilam hoje: 18 e 23. Os outros passam hoje.

### Parar se

- Uma recusa nova for pedida: não criar (F3; `ProblemReason.NOT_OFFERED`, `agent-failures.ts:120`, é de
  ferramenta).
- Uma rota do Mastra deixar o cliente gravar `metadata` de thread (`guard.ts`).
- O plano do agente precisar ler a versão duas vezes: mostre.
- Mudar uma asserção de hoje fora dos critérios 10 a 16.
- O corte por escolha mudar as instruções de algum agente (as listas são da U3).

## U3 A fábrica

**Base e modelo.** `main` `f4ccc150` com a U2, `@mastra/core` 1.83.0. Opus: cruza cinco pastas e troca
a fonte de toda lista de ferramenta. Os nomes ficam; some só a conexão fora da vista (C81).

### As linhas da tabela

Além das linhas U3:

- **A fábrica.** `:47`, o subconjunto por tipo de sessão; `factory.ts:1898-1912`, `extraTools` e
  `mergeTools`; `:1980-1994`, `resolveFactoryToolScope` e `createFactoryTools`.
- **O escopo por closure.** `read-tools.ts:222-223` lê só `scope.orgId` e `scope.factoryProjectId`; em
  `reference-agents-agent.md`, `tools` (`:564`) e `instructions` (`:558`) recebem o `requestContext`.
- **As leituras tipadas.** `offersRead`: `connectors/typed-reads.ts:59-67`. `includeResolvedTools`
  (`:131,157`) fica de fora: esconde toda ferramenta atrás da busca.
- **As listas.** Também `agent.ts:252`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/company-tools/` | cria `scope`, `names`, `listed`, `factory`, `search` e `public.ts`; recebe `overview.ts`, `copy-runs.ts` e `ports.ts` | `assistant/assistant.ts`, `assistant/research.ts`, `assistant/instructions.ts`, `conversation/builder.ts`, `conversation/instructions.ts`, `construtor/construtor.ts`, `agents/agent.ts` |
| `builder/assistant/` | apaga o do passo 2 e `typed-search.ts`; saem `overview.ts`, `copy-runs.ts` e `ports.ts` (seus tipos viram `CompanyCopies` e `CompanyProjects`, de `company-tools/public.ts`); `researchReads` e `assistantConnectorTools` montam pela fábrica | `assistant.ts`; os testes por `test-assistant.ts:14,210-212` |
| `builder/conversation/` | apaga o do passo 2 em `builder.ts`; `builderInstructions` recebe a lista da fábrica | `conversations-of.ts` (o `builderDataOf` dele, `:98`, é outro e fica) |
| `builder/construtor/` | apaga `offeredOf` e a `door` à mão (`construtor.ts:163-166,199-216`); `projectReader` (`:143`) lê a lista da fábrica | `construtor/tools.ts:47` (`project_read`) |
| `builder/agents/` | `runToolsOf` e `instructions` leem a lista da fábrica (`agent.ts:252,331`); ficam `neverAsking`, `presetTools`, `codeTools` | `agents/controller.ts` |
| `builder/connectors/` | exporta `readTarget(name)`: o conector e a operação da leitura tipada | `company-tools/search.ts` |
| `builder/data-tools/` | `dataTools({ data })` recebe a `CompanyData` presa, sem `DataOf` | `company-tools/factory.ts` |
| `.dependency-cruiser.cjs`, `.dependency-cruiser-migration.cjs` | `company-tools` entra em `AGENTS_AND_APPS` (`:21`); saem da lista `assistant/overview` e `assistant/typed-search` (movido e apagado); nada entra | `npm run deps` |

### Os contratos que a unidade cria

Em `apps/server/src/builder/company-tools/`, só tipos e assinaturas:

```ts
// names.ts: os nomes vêm do hub-api (C26)
type CompanyToolName =
  | typeof DATA_TOOL[keyof typeof DATA_TOOL]                    // data_describe, data_query
  | 'connector_read' | 'connector_notes' | 'connector_note_save' | 'copy_propose'
  | typeof APP_DATA_TOOL[keyof typeof APP_DATA_TOOL]            // app_data_read, app_data_check
  | typeof ASSISTANT_TOOL['overview' | 'copyRuns']              // conexus_overview, copy_runs
  | 'typed_reads'   // TYPED_READ_NAMES, só pelo search_tools
type CompanyToolSeat = ControllerKind | 'research'    // controller-kit/kinds.ts:19-26; research, o ajudante
const TOOLS_OF: Readonly<Record<CompanyToolSeat, readonly CompanyToolName[]>>
//   assistant:     data_describe, data_query, typed_reads, connector_notes, connector_note_save, copy_runs, conexus_overview
//   research:      connector_read
//   builder:       connector_read, connector_notes, connector_note_save, copy_propose, app_data_read, app_data_check, data_describe, data_query
//   construtor:    connector_read, connector_notes
//   agents:        connector_notes, app_data_read, data_describe, data_query

// scope.ts
type AppDataGrant = { kind: 'NONE' } | { kind: 'READ' } | { kind: 'READ_AND_CHECK' }    // C21
type CompanyToolScope = Readonly<{
  run: RunScope              // da U2
  view: AccessView           // access.viewOf(principalOf(run))
  reach: AccessView          // choice ANY; é `view` quando run.choice é ANY
  grants: Readonly<{ noteSave: boolean; appData: AppDataGrant }>   // o consumidor resolve
}>
function companyToolScope(run: RunScope, deps: { access: Access }, grants: CompanyToolScope['grants']): Promise<CompanyToolScope>

// listed.ts: a regra "a conexão está na vista" (C26)
type Listed<C extends { connectionId: ConnectionId; reads: readonly { operation: string }[] }> = readonly C[]
function inView<C extends { connectionId: ConnectionId; reads: readonly { operation: string }[] }>(
  view: AccessView, details: readonly C[]): Listed<C>   // ids e leituras de view.list('system')

// factory.ts
type CompanyToolDeps = Readonly<{
  log: FailureLog
  data: (run: RunScope) => CompanyData
  connections: (run: RunScope) => Promise<readonly ConnectionDetail[]>   // skill, copies, perProject, notes
  connector: Readonly<{ read: ReadCall; notes: NotesCall; saveNote?: NoteSave; propose?: ProposeCall }>
  copies?: () => Pick<CompanyCopies, 'list' | 'runs'>   // ports.ts
  projects?: (run: RunScope) => Promise<Omit<Overview, 'connections'>>
  appData?: AppDataDoor
  turn: (requestContext: RequestContext) => TurnKey     // não quem é
}>
function companyTools(scope: CompanyToolScope, seat: CompanyToolSeat, deps: CompanyToolDeps): ToolsInput
function companyConnections(scope: CompanyToolScope, deps: CompanyToolDeps): Promise<Listed<ConnectionDetail>>
// search.ts: catálogo fixo; o filtro lê a vista
function companyReadSearch(scopeOf: (rc: RequestContext) => Promise<CompanyToolScope | undefined>, deps: CompanyToolDeps): ToolSearchProcessor

// public.ts: companyToolScope, companyTools, companyConnections, companyReadSearch, TOOLS_OF e os tipos
// CompanyToolScope, CompanyToolSeat, CompanyToolDeps, CompanyCopies, CompanyProjects; inView fica dentro
```

Sem import de `assistant/` em `company-tools`, não há ciclo (C4, `no-circular`); o `overview.ts` movido
lê `RunScope`, não `hub/connectors`. Nenhuma rota, tabela, coluna ou código de falha novo.

`ConnectionDetail`, `ReadCall`, `NotesCall`, `NoteSave` e `ProposeCall` vêm de `builder/connectors/public.ts`
e do `@conexus/hub-api`, nunca de `hub/connectors` (`.dependency-cruiser.cjs:68-78`); as portas de
`hub/` chegam pelas `deps`.

Estados: `AppDataGrant` por `kind` (C21). Ids: `ConnectionId`, parseado na fonte da vista
(`CatalogSystem.connection`); nenhum novo. Donos (C26): os nomes, do hub-api; `TOOLS_OF`, a única tabela
de subconjuntos; `inView`, a única regra da vista; o escopo, `companyToolScope`, uma vez por execução
(`oncePerRun`). Zod: os `inputSchema` não mudam. Arquivo modelo: `connectorTools`
(`builder/connectors/connector-tools.ts:335-353`), com `include` separado por `noteSave` literal,
`ConnectionId` e os nomes de `BUILDER_TOOL`.

### As skills e a leitura

A skill `mastra` e, no `dist/docs`, `reference-agents-agent.md` e
`reference-processors-tool-search-processor.md`. Ler primeiro `hub/access/view.ts` e os cenários da U2
em `hub/access/conformance.test.ts`. Guia: testing (T5, T26, T27).

### A ordem do trabalho

Os casos novos, salvo o passo 1, vão em `company-tools/conformance.test.ts`, no mundo
`rolesWorld(t, 'PLANTED')` de `hub/copies/test-readers.ts`. Os dois entram pela porta (T5,
`.dependency-cruiser.cjs:136-143`): cada assento é uma conversa (`assisting`, `conversing`, `building`,
`agentsOn`), lida pelo `Sent` de `platform/test-anthropic-body.ts`.

1. **Gravar os nomes de hoje.** Critério: 30.
   - **Arquivos:** cria `company-tools/tool-sets.test.ts`. **Referência a seguir:**
     `construtor/construtor.test.ts:55-66` (`asked.tools` ordenado). **O que sai:** nada.
   - **O que entra:** um caso por assento (Assistente no Início e num Projeto, rodada de automação,
     Builder, Construtor, agente salvo com e sem `appData`), com a lista literal do `main`.
   - **Pronto quando:** o arquivo fica verde no `main`.
2. **Subtrair.** Critério: 41. No mesmo commit do passo 3.
   - **Arquivos:** `assistant.ts` (`offeredFor`, `:176-181`; `dataOfScope`, `:184-189`); `overview.ts`
     (`reachedBy`, `connectionsOffered`, `:98-130`); `typed-reads.ts:59-67`
     (`offersRead`); `builder.ts` (`grantedFor`, `admittedFor`, `builderDataOf`, `builderConnectorTools`,
     `:44-87,109-118`). **Referência a seguir:** apagar antes de pôr.
   - **O que sai:** esses e seus chamadores. **O que entra:** nada.
3. **O escopo e a vista.** Critérios: 36, 46, 47.
   - **Arquivos:** cria `scope.ts`, `listed.ts`, `names.ts`. **Referência a seguir:** `factory.ts:1980-1994`;
     `oncePerRun` (`controller-kit/once.ts:7`).
   - **O que entra:** os contratos desses arquivos; a `reach` só quando `run.choice.kind === 'CHOSEN'`.
     Regras: C26, C81.
   - **Testes:** o 46 conta as chamadas com um `Access` que conta, posto no lugar do que
     `main.ts:212-218` passa às conversas (`createAccess` devolve um objeto congelado, `hub/access/public.ts:59`,
     e não aceita `t.mock.method`); `companyToolScope` o chama na hora.
     **Mutações à mão:** sem `oncePerRun`, vermelho o 46. **Pronto quando:** `npm run typecheck` passa.
4. **A fábrica.** Critérios: 31, 32, 36, 39.
   - **Arquivos:** cria `factory.ts` e `public.ts`; em `data-tools/tools.ts`, `dataTools({ data })` recebe
     a `CompanyData` presa; `zoneOf(requestContext)` fica (é o fuso). **Referência a
     seguir:** `tools/index.ts:45-56`; `mcp/routes.ts:183-190`.
   - **O que entra:** por nome de `TOOLS_OF[seat]`, a peça de hoje (`connectorTools` com
     `inView(scope.view, details)`, `dataTools`, `appDataTools`), podada pelos `grants` e, no
     `connector_note_save`, por `run.attended`; `copy_propose` só sobre as conexões de `inView` com
     `copies`; nome repetido lança erro, como `mergeTools`.
   - **Testes:** o 31 e o 32 por assento e ferramenta.
   - **Mutações à mão:** `details` sem `inView` (vermelho o 31); sem a poda de `attended`
     (`note-save.test.ts:53`). **Pronto quando:** verdes contra a fábrica, antes de ligar os agentes.
5. **As ferramentas só do Assistente.** Critérios: 33, 37, 38, 44.
   - **Arquivos:** move `overview.ts`, `copy-runs.ts` e `ports.ts` para `company-tools/` (em `assistant/`
     fariam um ciclo); cria `search.ts`; muda `research.ts:44-63`. **Referência a
     seguir:** `reference-processors-tool-search-processor.md:100-127`.
   - **O que entra:** `conexus_overview` lista os sistemas de `scope.reach` e as fontes das tabelas
     dela (`reachedIn`, `overview.ts:90-95`), com `chosen` pela `run.choice`; `copy_runs` só
     acha a tabela de `scope.view.list('table')`, e `copies().list` dá o id; o `filter` do
     `search_tools` passa a leitura cujo conector (`readTarget`) tem um sistema em `scope.view` que lista
     a operação; o ajudante monta `companyTools(scope, 'research', deps)`.
   - **Testes:** os do 37, 38 e 33, sem mudar. **Mutações à mão:** `reach` por `view` no resumo (vermelho o 37); o
     filtro sempre `true` (o 33).
6. **Ligar os quatro agentes.** Critérios: 30, 34, 35, 40, 42, 43, 45.
   - **Arquivos:** `assistant.ts` (`tools:`, `skills:`, `inputProcessors`), `assistant/instructions.ts:45-71`,
     `builder.ts:155-191`, `conversation/instructions.ts:35,46-65`, `construtor.ts:184-222`,
     `agent.ts:154-201,249-276,328-335`. **Referência a seguir:** a linha da fábrica. **O que sai:** os
     `tools:` à mão.
   - **O que entra:** cada montagem resolve `companyToolScope` uma vez e espalha `companyTools(...)` na
     mesma ordem de chaves; as skills, a linha "Connections in this conversation" e o `## Connections`
     do Builder (`connectionsContext`, que fica, H4) leem `companyConnections`; o agente salvo passa essa
     lista a `presetTools` como `offered`.
   - **Testes:** `tool-sets.test.ts`, sem mudar; o 34, por assento. **Mutações à mão:**
     `copy_propose` em `TOOLS_OF.assistant` (vermelho `tool-sets.test.ts`). **Pronto quando:**
     `npm run deps`, `typecheck`, `lint` e os testes tocados passam.

### Como se prova

Nada se grava (T26). Hoje falham 31, 32, 34, 35 e 38 (o papel não alcança `clientes`;
`sankhya_clientes`, não liberada): `connector_notes`, o `connector_read` do Builder e a linha de
conexões do Construtor (`construtor.ts:192`) nomeiam a conexão recebida sem operação no alcance, que
`visibleTo` mantém (`speaking.ts:69-81`, issue 1145); o `copy_runs` num Projeto acha a cópia não liberada
(`copy-runs.ts:103` lê a lista da empresa). Sem a U3, o `conexus_overview` perderia as não escolhidas
(`reachedBy` lê a `describe` que a U2 restringe).

### Parar se

- Um tipo de `CompanyToolDeps` pedir import de `hub/connectors`, `hub/copies` ou `hub/data`: relate;
  nada entra na lista de migração.
- `tool-sets.test.ts` mudar um nome ou a ordem das chaves, ou a U2 não entregar `principalOf` com
  `choice` e a vista `ANY`.
- A lei (a) pedir que o Construtor (`tool_search`, `ready`) ou a edição de agente deixem de listar
  leituras `allowed: false`: é a lista de edição, fora daqui.
- A lei (a) pedir que `legacyTools` deixe de ler `kitReads`: é a U4.

## U4 O teto

**Base e modelo.** `main` `f4ccc150`, depois de U2 e U3 (G2). Sonnet: forma decidida, mudança
pequena, um teste por lugar. Revisão Opus: fronteira de segurança. O agente salvo alcança o papel
de quem o roda, lido na hora, ∩ o que a versão declara; app e cópia seguem pela versão (3(d)).

### As linhas da tabela

Além das linhas U4: os lugares do alcance são os passos 2 a 4. `may-use.ts:22-27` é o `Speaker`
com `VERSION`, `:54-56` o `roleOfSpeaker` que dá `null`. O escopo nasce em `agents/agent.ts:189-196` (o
`planner` põe `agentVersion`, no publicado e no rascunho) e, depois de U2, em `ceiling: DECLARED` e
`Principal.declared` (`principal.ts:23-24`). A automação já cumpre a regra: é uma conversa do Assistente
do dono, com as conexões escolhidas (`automations/run.ts:113-116`); a unidade só acrescenta testes. A
corrida da cópia (`copy-port.ts:118-137`) fala como `VERSION`, como o app, e não muda.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `hub/identity/may-use.ts`, `hub/identity/public.ts` | o passo 1 | `hub/access/public.ts`, `hub/connectors/*` (`speaking.ts`, `write.ts`, `read.ts`, `copy-sources.ts`, `copy-proof.ts`) |
| `hub/access/public.ts` | a vista do agente fala como `AGENT` | `hub/data/catalog.ts`, `hub/data/public.ts`, `builder/company-tools/` |
| `hub/connectors/assistant-port.ts`, `speaking.ts`, `write.ts`, `write-record.ts` | o agente fala como `AGENT` na leitura, no caderno e na escrita | `builder/agents/agent.ts`, `builder/agents/tools.ts`, `builder/agents/code-tools.ts`, `builder/assistant/` |
| `builder/agents/tools.ts` | a escrita publicada pede `AGENT` com a pessoa da execução | `builder/agents/agent.ts` |
| `hub/connectors/app-calls.ts`, `copy-port.ts` | não mudam; o comentário do `VERSION` em `may-use.ts` diz que é do app e da cópia | `apps/edge` pela rota do app; as cópias |
| os testes dos critérios 50 a 64 | mudam ou ganham casos | — |

### Os contratos que a unidade cria

Em `apps/server/src/hub/identity/may-use.ts` (a dona do falante, C26):

```ts
export type Declared = readonly Readonly<{ connectionId: ConnectionId; operation: OperationId }>[]

export type Speaker =
  | Readonly<{ kind: 'PERSON'; personId: PersonId; role: Role }>
  /** role now ∩ declared, draft or published */
  | Readonly<{ kind: 'AGENT'; personId: PersonId; role: Role; declared: Declared }>
  /** published app (3(d)) or a copy's run: declared, no role */
  | Readonly<{ kind: 'VERSION'; declared: Declared }>

export type AgentSpeaker = Extract<Speaker, { kind: 'AGENT' }>
export function withinVersion(person: PersonSpeaker, declared: Declared): AgentSpeaker
export function roleOfSpeaker(speaker: Speaker): string | null   // PERSON e AGENT: o papel; VERSION: null
```

`mayUseEach` responde por `switch (speaker.kind)` (C21): `PERSON`, o `hasPermission` de hoje; `AGENT`,
`declares(speaker, target) && hasPermission(role)` (o `hasPermission` só para os alvos declarados, com a
leitura única dos papéis por chamada); `VERSION`, a declaração, como hoje.

Em `apps/server/src/hub/connectors/write-record.ts`, o pedido de escrita de uma versão publicada:

```ts
type Agent = Readonly<{ kind: 'AGENT'; personId: PersonId; declared: Declared }>  // o funil lê o papel
// WriteRequest: (Readonly<{ speaker: Person }> | Readonly<{ speaker: Agent; agentId: AgentId; number: number }>)
```

`Declared` mora em `may-use.ts` desde a U2. `Principal`, `ConsumerContext` e `Ceiling` não mudam:
`principalOf` preenche `Principal.declared` com o do `ceiling: DECLARED`.

Estados: `Speaker` por `kind`, `switch` exaustivo em `mayUseEach` e `mayUseNotebook` (C21). Ids: nenhum
novo (C23). Donos: o falante e "papel ∩ declaração", `may-use.ts`; `public.ts`, `assistant-port.ts` e
`write.ts` só montam o `AGENT` com `withinVersion` (C26). Zod: nada novo. Arquivo modelo: `may-use.ts`
depois da unidade; no `main` não, porque `:93` decide por `if` e `Declared` mora em dois lugares.

Nenhuma rota, tabela, coluna, código de falha ou texto de tela novo. A recusa é o `NOT_IN_ROLE` de hoje
(`hub/connectors/read.ts:35`), agora com o papel da pessoa no campo `role`.

### As skills e a leitura

As skills `mastra`, `fastify-best-practices` e `organization-best-practices` (`hasPermission`). Ler
primeiro `may-use.ts` inteiro, `hub/access/public.ts` e `mastra-1.83` `mastracode/factory/src/tools/scope.ts:58-121`. Guia: [testing](../guides/testing.md) (T5, T27).

### A ordem do trabalho

1. **O falante `AGENT` na dona.** Critérios: 52, 61.
   - **Arquivos:** `hub/identity/may-use.ts`, `hub/identity/public.ts`.
   - **Referência a seguir:** `has-permission.mjs:7`, chamado como em `may-use.ts:74-79`.
   - **O que sai:** o `if (speaker.kind === 'VERSION')` de `:93`.
   - **O que entra:** os contratos acima. Regras: C21, C26.
   - **Testes:** o do 52 (tabela abaixo), com `role: 'atendente'`.
   - **Mutações à mão:** em `AGENT`, `declares && permitted` por `permitted`: vermelho o 52; por
     `declares`, o 51.
   - **Pronto quando:** `npm run typecheck` aponta cada lugar que monta `VERSION` para um agente.
2. **A lista.** Critérios: 50, 53.
   - **Arquivos:** `hub/access/public.ts:46-51`.
   - **O que sai:** o literal `{ kind: 'VERSION', declared }` de `:49`.
   - **O que entra:** `withinVersion(personOf(personId, read.role), principal.declared)`, com o papel que
     `admitMember` já leu em `:38-41`, na mesma transação.
   - **Testes:** no cenário `agent`, `revokedBy` vira `readonly ('ROLE' | 'DECLARATION')[]` e a lei (e)
     roda uma vez por caminho (50); o 53, `[]` para a Dora (tabela abaixo).
   - **Mutações à mão:** `:49` de volta a `VERSION`: os dois vermelhos.
3. **A leitura, o caderno e a execução.** Critérios: 51, 54, 57, 58, 59.
   - **Arquivos:** `hub/connectors/assistant-port.ts:121-137` (`mayAsk`), `hub/connectors/speaking.ts:91-108`
     (`mayUseNotebook`).
   - **O que sai:** `scope.agentVersion ?? personOf(...)` em `:129` (no estado de U2, o mesmo sobre
     `Principal.declared`); o `return undefined` de `speaking.ts:97` só para `VERSION`.
   - **O que entra:** em `mayAsk`, `withinVersion(personOf(personId, admitted.role), declared)` quando o
     principal tem teto. Em `mayUseNotebook`, um `switch`: `VERSION` passa (app e cópia); `PERSON` e
     `AGENT` conferem `consultar` no papel (o caderno não é operação declarada).
   - **Testes:** o 51 (tabela abaixo); 58 e 59, novos em `role-doors.test.ts`; 54 e 57, novos em
     `agent-read.test.ts`, pela rota da conversa (T5).
   - **Mutações à mão:** `mayAsk` devolvendo o `personOf` sem teto: vermelho o 52; o caderno deixando
     o `AGENT` passar, o 58.
   - **Pronto quando:** esses passam, e `agent-read.test.ts:33`, rodado pela Ana, passa sem mudar.
4. **A escrita.** Critérios: 55, 56.
   - **Arquivos:** `builder/agents/tools.ts:177-185`, `hub/connectors/write-record.ts:24-25,45,97-101`,
     `hub/connectors/write.ts:101`.
   - **O que sai:** o `VERSION` da escrita publicada.
   - **O que entra:** `requestOf` monta `{ kind: 'AGENT', personId, declared }` com a pessoa da execução.
     O funil faz um `switch`: `PERSON`, a pessoa lida em `:84`; `AGENT`,
     `withinVersion(found.person, a.speaker.declared)`. O autor da linha (`authorOf`,
     `write-record.ts:97-101`) segue a versão (`agentId`, `number`). O rascunho segue `PERSON`: só tem as
     ferramentas declaradas, com o mesmo alcance.
   - **Testes:** sem mudar, `approval-refused.test.ts` e `approval-returned.test.ts`.
   - **Mutações à mão:** em `write.ts`, `a.speaker` para `AGENT` sem o papel: vermelho o 55.
   - **Pronto quando:** o 55 passa, sem mudar `mustAsk` (`hub/connectors/approval.ts:63-75`) e
     `requireApproval` (0053).
5. **O que não muda, provado.** Critérios: 60 a 64. Novos: o 60 em `app-calls.test.ts` e o 64 em
   `role-run.test.ts`. Sem mudar, e já verdes no `main`: `copy-port.test.ts`,
   `builder/automations/release.test.ts:84`, `builder/automations/run.test.ts:196`.

### Como se prova

Pela porta pública: rotas do Hub (`call`, `talkedTo`), `hub.connectors`, `hub.access`; nenhum evento do
Mastra (T26). Gravações: o papel (`auth.member`, `organizationRole`) por `PUT /roles/<papel>`, e
nenhuma linha em `connector_write` na escrita recusada (`write.ts:159,174`). Hoje falham: 50 (`public.ts:49` ignora o papel); 51 e 53
(tabela abaixo); 54 e 57 (`assistant-port.ts:129` usa a versão); 55 (`write.ts:101` usa a versão, e a escrita chega ao dublê);
58 (`speaking.ts:97` deixa a versão passar sem `consultar`); 59 (a segunda chamada lê). Os outros passam hoje.

### Parar se

- Um teste de agente rodado por quem não é a Ana mudar fora da tabela abaixo: reporte.
- O `hasPermission` pedir uma segunda leitura dos papéis por alvo do `AGENT`: pare (a leitura única por
  chamada, `may-use.ts:103-105`, é critério de desempenho).
- Esconder uma ferramenta da versão (`tool_<slug>`) parecer necessário: não esconda (F7).
- U2 entregar o `Principal` sem `declared` ou o `ceiling` fora de `principalOf`.
- Se aparecer um caminho que roda o agente salvo sem pessoa (agenda), pare: a P1 (a) diz que ele lê pela
  liberação do Projeto.

### Os testes que mudam, e por quê

O porquê: a palavra do fundador na linha do alcance; o depois: o critério.

| Teste | Hoje | Critério |
| --- | --- | --- |
| `hub/connectors/role-doors.test.ts:193` "a versão publicada roda…" | o Atendente lê `empresas` pela versão | 51 |
| `hub/connectors/role-doors.test.ts:117` "o funil…" | `role: null`; a recusa não muda | 52 |
| `hub/data/catalog-role.test.ts:273` "a versão do agente lista…" | Dora, sem leitura no papel, vê `pedidos`; Bruno segue vendo (C81) | 53 |
| `hub/access/conformance.test.ts:72-85` (cenário `agent`) | revoga só pela declaração; a lei (e) vale para todo consumidor | 50 |

Nenhum teste de `builder/agents/*.test.ts` muda de expectativa: quem roda o agente é a Ana, Dona, que
alcança tudo (`test-approval.ts:60-64`), ou quem aprova, que o `D3-a` já confere pelo papel
(`autonomy.test.ts:283`).

## G1 O ponto de conferência

Depois da U2, antes do pull request, os passos 6 e 7 de [`conexus-build`](../../.agents/skills/conexus-build/SKILL.md)
nas suítes de `builder/` (`assistant`, `automations`, `construtor`, `agents`, `conversation`) e de
`hub/` (`access`, `connectors`, `data`); `npm run deps`; e `GET /assistant/connections`, criar e trocar
a escolha, com "Vazio" e o Dono. A gravação da U1
(critério 2) vai no pull request.

## G2 O ponto de conferência

Depois da U4, antes do pull request: as mesmas suítes, mais `builder/company-tools/`, `builder/data-tools/`,
`builder/app-data/` e `hub/identity/`; `npm run deps`; e o critério 54 pela rota da conversa.
