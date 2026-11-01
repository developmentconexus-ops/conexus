# Etapa 24.2: Automações, o Assistente na agenda

Este cartão espera a 24.1. Ele parte do cartão dela (pull request
https://github.com/developmentconexus-ops/conexus/pull/497, que entra primeiro) e usa o que as
unidades U1 a U4 dela constroem: a porta da empresa aos conectores, o Assistente, a máquina da
conversa e as telas. Pela regra L5, entra em `docs/steps/` quando a 24.1 fechar.

## A página do fundador

**No fim desta etapa** a Ana, numa conversa do Assistente, pede "todo dia às 7h me manda o resumo
de vendas de ontem, por vendedor". O Assistente mostra um cartão com a automação; ela toca
**Criar automação**. Às 7h de cada dia, sem ninguém pedir, o Assistente abre **uma conversa nova
marcada "Automação"**, lê os sistemas, faz as contas e responde. A Ana recebe o aviso no sino das
**notificações** e um **e-mail** com o caminho para a conversa, que ela abre e continua
perguntando. Na página **Automações** ela vê as suas, pausa, roda agora, apaga, e vê o histórico de
cada uma.

Isto é a primeira fatia da **Automação**, a peça que você aprovou em 2026-11-01: um **gatilho**
(aqui, o horário e o "rodar agora"), **o que roda** (aqui, o Assistente) e **o lugar** (o Início ou
um Projeto). As etapas seguintes só acrescentam gatilhos e o que roda, sem refazer esta (o mapa
abaixo).

**O roteiro de uso.** Padaria Sol: Ana (dona), Bia (financeiro, administradora) e Bruno (membro). O
Sankhya está ligado em "Matriz" e "Filial"; o Projeto "Vendas" recebeu só a "Matriz". No computador
e no celular.

1. A Ana abre uma conversa no Início e escreve "todo dia às 7h me manda o resumo de vendas de ontem,
   por vendedor, da Matriz e da Filial". O Assistente responde com o cartão: o nome ("Resumo de
   vendas"), **Todo dia às 07:00**, o lugar (Início), as ligações (Matriz e Filial) e o pedido que
   vai rodar, escrito para ser entendido sozinho. Ela toca **Criar automação**; o cartão vira
   "Automação criada", com o caminho para ela.
2. Ela abre **Automações** na barra lateral: a "Resumo de vendas" está **Ativa**, com "Próxima: amanhã
   às 07:00". Ela toca **Rodar agora**. Em instantes o histórico mostra a execução "Manual",
   "Rodando", e depois "Pronta", com **Abrir a conversa**.
3. Ela abre a conversa: o título traz a etiqueta **Automação · Resumo de vendas**, a pergunta da
   automação, as leituras ("Lendo Sankhya · Matriz"), a resposta com o gráfico ao lado. Ela pergunta
   "e a Filial, por produto?" e o Assistente continua ali, como em qualquer conversa.
4. No dia seguinte, às 7h, a conversa nova aparece nas recentes do Início com a etiqueta
   **Automação**; o sino mostra **1**; o e-mail "Resumo de vendas está pronto" chegou, com o botão
   **Abrir no Conexus**. Pelo celular, ela abre o e-mail, entra e lê.
5. A Ana pausa a automação: ela fica **Pausada**, sem "Próxima". Retoma: volta a **Ativa**. No
   Projeto Vendas, em **Automações**, ela pede numa conversa do Projeto "toda segunda às 8h, as
   vendas da semana passada": o cartão mostra o Projeto e só a Matriz.
6. A Bia, numa conversa dela, cria a sua; a da Ana não aparece para a Bia. O Bruno (membro) não vê
   **Automações**, e o endereço de uma automação da Ana dá "não encontrado".
7. A Ana apaga a "Resumo de vendas": ela some da lista, e as conversas que ela já abriu ficam.

**O que você faz, e quando.**
- **No começo:** aprova esta página.
- **Antes da primeira automação ligar no Conexus de verdade (`D1`):** passa o projeto do Neon do
  Hub ao plano **Launch**, no console do Neon, por uma conta só, cerca de **US$ 19,35 por mês**
  (0,25 CU o mês inteiro, a US$ 0,106 a hora, lido em https://neon.com/pricing em 2026-10-31). O
  firstmate diz o momento: depois que a U1 entrar e antes de você criar a primeira automação. Até a
  primeira automação existir, a agenda não consulta o banco: o Mastra só a liga quando há uma.
- **No fim:** faz o roteiro no computador e no celular, diz o que viu e aprova os textos das telas
  e do e-mail.

**Fica de fora.**
- **Agentes do Projeto** (24.3), **escrita com aprovação** (24.4) e **workflows** (24.5): a 24.2 roda
  só o Assistente, que só lê, como na 24.1.
- **Gatilho por evento** ("lançou um orçamento"): vem com os workflows (24.5), pela pergunta (a)
  abaixo.
- **Editar uma automação.** Para mudar, apaga e pede de novo na conversa. Um caminho só de criar,
  pelo cartão; a edição entra quando você pedir.
- **Uma vez só** ("amanhã às 9h me lembra") e **de hora em hora**: pela sua decisão F abaixo.
- **Membros com automações**: como as conversas da 24.1, só o dono e os administradores.
- **Outras notificações** (o convite aceito, o app publicado): o sino nasce com as da automação, e
  cada evento novo entra na etapa que o cria. A 20.4, que você pediu em 2026-10-29 como "um portal
  de notificação", começa aqui.
- **Das pendências marcadas para o próximo cartão:** nenhuma toca a agenda, o sino ou o e-mail. A
  #339 (o fim do Hub no meio de um turno pode perder o texto) vale também para uma execução cortada
  por uma atualização; ela espera a 16, e aqui a execução cortada aparece como "Interrompida". As da
  barra lateral (#194, #195, #197) esperam a etapa delas; a U3 só acrescenta uma entrada.

### As decisões suas nesta etapa

**E. Como a automação nasce da conversa.**
- **E1 (recomendo).** O Assistente mostra o cartão e você toca **Criar automação**. É o mesmo jeito
  do **Criar app** da 24.1: o Assistente só lê e propõe, e quem grava é você, num toque. Nativo: uma
  ferramenta que só devolve a proposta, desenhada pela tela, como `propose_app`.
- **E2.** O Assistente cria sozinho e diz "criei"; você desfaz na lista. É o que o ChatGPT faz com
  as tarefas. Remendo aqui, porque seria a primeira ferramenta do Assistente que grava, antes da
  aprovação da 24.4.

**F. Quando uma automação pode rodar.**
- **F1 (recomendo).** Todo dia, dias úteis, dias da semana escolhidos ou um dia do mês, sempre num
  horário (por exemplo "segunda e quinta às 8h"), no fuso de São Paulo. Cada automação manda no
  máximo um e-mail por dia. A conta de e-mail do Conexus manda 200 por dia (decisão 0017) para
  todas as empresas e os convites. Nativo: o cron do Mastra, montado por uma função nossa.
- **F2.** Também de hora em hora. Uma automação mandaria até 24 e-mails por dia, e dez delas
  esgotariam a conta de e-mail do Conexus; precisaria de um plano de e-mail pago antes.

**G. O que vai no e-mail.**
- **G1 (recomendo).** O nome da automação, se ficou pronta ou falhou, e o botão **Abrir no
  Conexus**; nenhum número da empresa. A resposta fica no Conexus, atrás do login, e não fica
  copiada em caixas de e-mail. Nativo: o mesmo remetente e a mesma moldura do convite.
- **G2.** O começo da resposta no e-mail, como o ChatGPT faz. Os números da empresa passariam a
  morar nas caixas de e-mail de quem recebe.

"Rodar agora" avisa só no sino, sem e-mail: você está na tela.

**Enquanto você não responde.** Você pré-aprovou este cartão em 2026-11-01, para ser construído e
testado antes da sua leitura; a construção segue as recomendações `E1`, `F1` e `G1`, e uma resposta
diferente sua muda a unidade que a toca. O Agent Builder pago do Mastra serve só de leitura de
lógica, nunca de importação.

### O mapa da visão: o seu orçamento de ponta a ponta

A sua visão de 2026-11-01: "um builder em que é visual ... o construtor ... é proativo ... cron,
com schedule, com workflows, com agentes". Tudo nela vira peças do Mastra que já existem na versão
instalada (1.79.0), sem o editor pago. Cada etapa constrói uma fatia; nenhuma refaz a anterior.

O exemplo: **a análise de orçamento**.

| Peça do seu exemplo | Como fica no Conexus | A peça do Mastra (`@mastra/core` 1.79.0) | Etapa |
| --- | --- | --- | --- |
| "primeiro eu analiso tudo que ativaria ela" | o Construtor lê o Projeto, as ligações e o caderno delas, pesquisa na web e propõe os gatilhos: orçamento novo, cancelado, perdido | um agente com as ferramentas de leitura da 24.1 (`connector_read`, `connector_notes`, `web_search`) e uma ferramenta que propõe, como `propose_automation` | 24.3 (agentes), 24.5 (workflows) |
| o gatilho: um horário | "todo dia às 7h" | `mastra.schedules.create` com `workflowId` (`dist/schedules/schedules.d.ts:178-194`) | **24.2** |
| o gatilho: "rodar agora" | o botão | `mastra.schedules.run` (`schedules.d.ts:189-193`) | **24.2** |
| o gatilho: um orçamento novo, cancelado ou perdido no Sankhya | uma automação que olha o Sankhya a cada poucos minutos e compara com o que viu da última vez, porque o Sankhya não avisa (pergunta (a)) | a mesma agenda, com um workflow que lê o que mudou e dá `run.start` num workflow por orçamento (`dist/workflows/workflow.d.ts:769`) | 24.5 |
| o gatilho: um aviso de um fornecedor que avisa | o Mercado Livre e os outros que mandam aviso chamam uma rota nossa | a rota dá `run.start`; o Mastra não tem gatilho de evento genérico | 20.2, depois da 24.5 |
| "um workflow que processaria os dados, importaria" | passos de código que são ferramentas nossas | `createStepFromTool` (`dist/workflows/step-factories.d.ts:28`) | 24.5 |
| "depois entraria um agente" que tria e confere o cliente | um passo que é um agente do Projeto | `createStepFromAgent` (`step-factories.d.ts:14`) | 24.3 (o agente), 24.5 (o passo) |
| os agentes do Projeto | linhas nossas (instruções, modelo, ligações, lugar) que viram `new Agent` ao carregar; nunca os agentes guardados do editor | `mastra.addAgent` e `removeAgent` (`dist/mastra/index.d.ts:974,1078`); `agents` por pedido (`dist/agent/types.d.ts:737`) | 24.3 |
| ferramentas sobre os dados dos apps do Conexus | ler e, com aprovação, gravar no banco do app do Projeto | ferramentas nossas; `requireApproval` na que grava (`dist/tools/types.d.ts:655`), que pergunta mesmo com o `yolo` da 0053 (`dist/agent-tuAMgHe3.js:30912-30931`) | 24.3 (ler), 24.4 (gravar) |
| ferramentas sobre os conectores | a porta da 24.1, só leitura; a escrita onde o sistema aceita | `connector_read` (24.1); `requireApproval` | 24.1, 24.4 |
| ferramentas de pesquisa na web | as da 24.1 | `web_search`, `web_fetch` | 24.1 |
| "o agente vai usar um workflow dentro dele" | um workflow como ferramenta do agente | o campo `workflows` do `Agent` (`dist/agent/types.d.ts:669`) | 24.5 |
| "eles paralelizam, eles voltam" | ramos em paralelo, condições, repetições, esperas | o grafo dos workflows guardados como dados: `parallel`, `conditional`, `loop`, `foreach`, `sleep` (`dist/workflows/dynamic/validate/types.d.ts:90-113`) | 24.5 |
| o Construtor monta conversando, e o "visual, igual o Mastra Studio" | o workflow é uma linha de dados; a tela o desenha como trem de balões, e o Construtor o conserta pelas sugestões do validador | `mastra.addDynamicWorkflow` (`dist/mastra/index.d.ts:2038`), `rehydrateWorkflow` (`dist/workflows/dynamic/rehydrate.d.ts:50`), a tabela `mastra_workflow_definitions`; código aberto, fora do `ee` | 24.5 |
| ferramentas "em código, igual o Agent Builder faz" | código que o Construtor escreve, rodando isolado, nunca dentro do Hub (pergunta (b)) | uma ferramenta nossa que chama o código isolado | 24.3 ou 24.4, pela sua resposta |
| a aprovação antes de escrever | "Aprovar?" na conversa ou no sino, mesmo de madrugada; a execução espera no banco | `listSuspendedRuns`, `approveToolCall`, `declineToolCall` (`dist/agent/agent.d.ts:1410,1635,1679`) | 24.4 |
| o resultado de cada execução | uma conversa nova marcada "Automação", o sino e o e-mail | a conversa do Assistente da 24.1 | **24.2** |

O Agent Builder, o Workflow Builder e o editor do Mastra ficam de fora: são código `ee`, de licença
paga em produção, e o Conexus os recusa desde o pull request
https://github.com/developmentconexus-ops/conexus/pull/518.

### Duas perguntas para os cartões seguintes (não precisa responder agora)

**(a) O gatilho do orçamento no Sankhya (cartão da 24.5).** O Sankhya **não avisa** quem integra:
o portal do desenvolvedor (https://developer.sankhya.com.br/reference) não tem webhook nem evento
para fora, e o conector do Conexus só lê pela porta `mge/service.sbr` (o conector, `definition.ts`
e `door.ts`). Os "eventos programáveis" são código Java instalado dentro do Sankhya da empresa,
que um usuário só de leitura não instala. Então o Conexus **pergunta de tempos em tempos** e compara.
As opções:
- **a1 (vou recomendar).** A cada 5 minutos, ler os orçamentos alterados desde a última leitura, pelo
  `loadRecords` com `modifiedSince` que a página do Sankhya documenta
  (https://developer.sankhya.com.br/reference/get_logalteracoestabelas), guardar o último momento
  lido e o estado de cada orçamento, e comparar: novo, cancelado, perdido. Não pede nada ao
  administrador do Sankhya. Atraso de até 5 minutos, e cerca de 290 leituras por dia.
- **a2.** O "Log de Alterações para API" do Sankhya: o administrador o liga, o Sankhya cria gatilhos
  no banco dele (a página pede para ligar fora do expediente) e guarda de 3 a 7 dias de mudanças. É
  o único jeito de ver um orçamento **apagado**.
- Qual tipo de operação é "orçamento" na sua empresa e qual campo diz "perdido" é escolha da sua
  empresa (o conector lê a TOP como "escolha desta empresa"); o estudo da 24.5 confere no Sankhya
  antes.

**(b) Onde roda o código que o Construtor escrever (cartão da 24.3 ou da 24.4).** Código de uma
empresa **nunca** roda dentro do Hub: o Hub guarda as chaves e os dados de todas. As opções:
- **b1 (vou recomendar como base).** O Construtor não escreve código para rodar no Hub: monta agentes
  e workflows como **dados** que apontam para as ferramentas que nós registramos (ler o Sankhya, o
  banco do app, a web, a máquina). É o que o Mastra guarda como dados sem a parte paga.
- **b2 (vou recomendar para a conta pesada).** O código roda na **máquina E2B** da conversa, como o
  Assistente da 24.1 já faz: Python e Node, planilhas e gráficos, segundos para acordar, fora do
  Brasil (o aviso da 0032).
- **b3 (vou recomendar para ferramentas rápidas).** O código vira um **Worker** no mesmo lugar onde
  rodam os apps (Workers for Platforms, decisão 0018), sem chave nenhuma, chamado por uma ferramenta
  nossa. Rápido e barato, mas só JavaScript, com limite de tempo por chamada.

**O tamanho.** Cerca de **2.350 linhas** de código, abaixo do teto de 4.000 da regra L2.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | A automação e a sua execução: a agenda do Mastra ligada no Hub (`startWorkers`), o workflow `conexus-automation-run` que abre uma conversa do Assistente marcada "Automação", manda o pedido e espera o fim; as rotas (criar, listar, pausar, retomar, rodar agora, apagar, histórico); a remoção com a empresa, a pessoa e o Projeto; o fim do Hub | `apps/server/src/builder/automations/`, `apps/server/src/builder/assistant/`, `apps/server/src/builder/mastra.ts`, `apps/server/src/main.ts`, `packages/hub-api/src/` | [testing](../guides/testing.md) | as U2 a U4 da 24.1 no `main` |
| U2 | As notificações e o e-mail: a tabela `notifications.notification`, a migração e as permissões, as rotas do sino, o e-mail da execução pelo remetente dos convites, e a porta `Notify` que o workflow da U1 chama | `apps/server/src/hub/notifications/`, `apps/server/src/hub/identity/` (`mail-frame.tsx`), `apps/server/migrations/`, `apps/server/database-grants.sql`, `apps/server/package.json`, `apps/server/src/main.ts`, `apps/server/src/builder/automations/`, `packages/hub-api/src/` | [data](../guides/data.md) | U1 |
| U3 | As telas e a proposta: `propose_automation` no Assistente e o cartão **Criar automação**; a página Automações no Início e no Projeto, com o histórico; o sino; a etiqueta **Automação** nas recentes e na conversa | `apps/web/src/builder/automations/`, `apps/web/src/builder/assistant/`, `apps/web/src/hub/notifications/`, `apps/web/src/hub/projects/` (`project-rail.tsx`), `apps/web/src/routes/_app/companies/$companyId/`, `apps/server/src/builder/assistant/` (`propose-automation.ts`), `packages/hub-api/src/`, `docs/reference/screens.md` | [web](../guides/web.md) | U2 |

Andam em fila: a U2 lê o contrato da U1 (o resultado da execução), e a U3 lê os dois.

**Quando começa** (delivery L1). A U1 muda `builder/assistant/` e `builder/mastra.ts`, que a 24.1
cria; ela começa quando as U2 a U4 da 24.1 estiverem no `main`, e depois que esta página for
aprovada.

**Antes da U1**, nenhuma regra nova: a do `ee` (https://github.com/developmentconexus-ops/conexus/pull/518)
e a `mastra-only-in-builder` (W7) já valem, e a agenda mora em `builder/`.

**Orçamento de código alterado.** U1: ~850. U2: ~550. U3: ~950. Total: ~2.350. Testes, gerados e o
OpenAPI ficam fora. Hipótese pelos vizinhos: as rotas do Assistente da 24.1 (U2, ~1.450 com o
agente), a tabela e as rotas de uma ligação de Projeto da 20, o convite da 4 (o e-mail) e as telas
da 24.1 (U4, ~1.010).

## Os critérios de aceite

O aceite da etapa: a automação criada pela conversa roda no horário e em "Rodar agora", cada
execução abre uma conversa nova marcada "Automação" que a pessoa continua, e o aviso chega no sino e
por e-mail (critérios 1, 6, 8, 12, 19, 21).

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `POST /api/companies/{c}/automations` com nome, pedido, cadência, ligações e, se quiser, Projeto, pela dona ou administradora, responde 201 com a automação `ACTIVE`, a cadência e `nextRunAt` no próximo horário de São Paulo; a lista seguinte a mostra igual | `apps/server/src/builder/automations/routes.test.ts`, "criar" | must |
| 1a | U1 | A mesma chave de tentativa com o mesmo corpo devolve a mesma automação, também com os dois pedidos ao mesmo tempo; com outro corpo, `IDEMPOTENCY_CONFLICT`; duas chaves, duas automações; a mesma chave usada pela Bia cria a dela | `routes.test.ts`, "a tentativa" | must |
| 2 | U1 | Recusas da criação: o membro, `NOT_FOUND` (S10); um Projeto de outra empresa ou apagado, `NOT_FOUND`; uma cadência fora da união, `REQUEST_MALFORMED`; o pedido vazio ou com mais de 4.000 caracteres, `REQUEST_MALFORMED`; a 31ª automação ativa da empresa, `AUTOMATION_LIMIT` | `routes.test.ts`, "as recusas" | must |
| 3 | U1 | A cadência vira o cron certo: `DAILY 07:00` é `0 7 * * *`; `WEEKDAYS 08:30` é `30 8 * * 1-5`; `WEEKLY [MON, THU] 08:00` é `0 8 * * 1,4`; `MONTHLY 5 09:00` é `0 9 5 * *`; e o `nextRunAt` de `DAILY 07:00` criado às 07:00:30 de São Paulo é o dia seguinte | `apps/server/src/builder/automations/cadence.test.ts` | must |
| 4 | U1 | A lista devolve só as automações da pessoa, do lugar pedido (sem `projectId`, as do Início; com ele, as do Projeto); a da Ana não aparece para a Bia; o membro recebe `NOT_FOUND` | `routes.test.ts`, "a lista" | must |
| 5 | U1 | Pausar põe `PAUSED` e `nextRunAt: null`, e o horário seguinte não roda; retomar volta a `ACTIVE` com o próximo horário; pausar uma pausada e retomar uma ativa respondem o estado, sem erro; a automação de outra pessoa, `AUTOMATION_NOT_FOUND` | `routes.test.ts`, "pausar e retomar" | must |
| 6 | U1 | Com o tique curto do teste e um horário um minuto à frente, a agenda dispara no horário: o workflow cria **uma** conversa do Assistente do dono, com a marca `conexusAutomation`, o lugar e as ligações da automação, manda o pedido como a primeira mensagem, espera o fim do turno, e o histórico mostra a execução `SCHEDULED` com `DONE` e o id da conversa | `apps/server/src/builder/automations/run.test.ts`, "o horário" (o Mastra e o Postgres de teste; o modelo e o Sankhya dublês) | must |
| 6a | U1 | A conversa aberta pela execução é uma conversa do Assistente como as da 24.1: aparece no `GET …/assistant/conversations` do dono com `automation: { automationId, name }`, abre pela rota da conversa, e uma segunda pergunta nela é respondida | `run.test.ts`, "a conversa continua" | must |
| 6b | U1 | A execução lê só as ligações escolhidas que o lugar ainda oferece: uma ligação que o Projeto perdeu depois da criação dá `NOT_GRANTED` na leitura, como na 24.1, e a execução termina `DONE` | `run.test.ts`, "as ligações de hoje" | must |
| 7 | U1 | `POST …/automations/{id}/run` responde 202 com o id da execução; o histórico mostra `MANUAL`; um segundo pedido enquanto a primeira está `RUNNING` dá `AUTOMATION_RUNNING`; numa automação pausada, roda do mesmo jeito | `routes.test.ts`, "rodar agora" | must |
| 8 | U1 | `GET …/automations/{id}/runs` devolve as execuções da mais nova para a mais velha, cada uma com `firedAt`, `trigger` (`SCHEDULED` ou `MANUAL`) e o estado (`RUNNING`, `DONE` com a conversa, `FAILED` com o código e a conversa se houver, `SKIPPED` com o motivo), 20 por página com `next` opaco | `routes.test.ts`, "o histórico" | must |
| 9 | U1 | Um turno que falha (a conta do modelo esgotada, o modelo fora) termina a execução `FAILED` com o código do turno (os da 11 e da 12) e a conversa, que mostra a frase da falha; uma falha antes do turno (o modelo padrão sem conta, `MODEL_NO_ACCOUNT`; o banco fora) termina `FAILED` com o código e `conversationId: null`; nos dois casos a U2 avisa | `run.test.ts`, "a falha do turno" | must |
| 10 | U1 | Se o dono não pode mais perguntar (virou membro), o disparo não abre conversa: a execução é `SKIPPED` com `OWNER_CANNOT_ASK`, a automação fica `PAUSED`, e a U2 avisa | `run.test.ts`, "o dono virou membro" | must |
| 11 | U1 | Apagar responde 204: a linha some do Mastra, a lista não a mostra, as conversas já abertas ficam; apagar de novo dá `AUTOMATION_NOT_FOUND` | `routes.test.ts`, "apagar" | must |
| 11a | U1 | A remoção da empresa, da pessoa e do Projeto apaga as automações deles antes das conversas (a ordem da 24.1); depois dela, nenhuma linha da agenda aponta para eles | `apps/server/src/builder/automations/release.test.ts` | must |
| 11b | U1 | Sem automação nenhuma, a agenda não tica: o pool do Postgres que o Hub recebe não vê consulta a `mastra_schedules` em 30 s depois da partida; a primeira automação criada com o Hub no ar liga a agenda e dispara no horário; com uma já guardada, a partida a acha e liga | `apps/server/src/builder/automations/scheduler.test.ts` | must |
| 11c | U1 | O fim do Hub (U0 da 24.1) para a agenda primeiro: nenhum disparo começa depois do aviso de parar; uma execução em andamento tem o turno esperado como os outros; a que o corte interrompe, ou a que ficou `running` porque o processo morreu, aparece `FAILED` com `INTERRUPTED` no histórico, e "Rodar agora" volta a funcionar nela | `scheduler.test.ts`, "o fim do Hub" | must |
| 11d | U1 | Um horário perdido com o Hub parado roda **uma** vez quando o Hub volta, e o próximo volta ao horário normal | `scheduler.test.ts`, "o horário perdido" | should |
| 11e | U1 | Uma execução repetida (o mesmo `runId`, pela recuperação do Mastra ou pelo passo de novo) não manda o pedido duas vezes: a conversa dela tem uma pergunta só | `run.test.ts`, "uma pergunta só" | must |
| 12 | U2 | Ao fim de cada execução, o dono recebe uma notificação: `AUTOMATION_DONE` com a conversa, `AUTOMATION_FAILED` com a conversa se houver, `AUTOMATION_PAUSED` no caso do critério 10; uma por execução, mesmo se o passo repetir | `apps/server/src/hub/notifications/notifications.test.ts` | must |
| 13 | U2 | `GET /api/companies/{c}/notifications` devolve só as da pessoa, da mais nova para a mais velha, 30 por página, com `unread`; `POST …/notifications/read` com ids marca essas, com `all: true` marca todas; a de outra pessoa ou empresa não aparece nem é marcada (a política `OWN`) | `notifications.test.ts`, "o sino" | must |
| 14 | U2 | Um disparo do horário manda um e-mail ao endereço do dono: o assunto "<nome> está pronto", "<nome> falhou" ou "<nome> foi pausada", o nome, o botão **Abrir no Conexus** com o endereço da conversa pelo lugar dela (Início ou Projeto, como o critério 24 da 24.1) ou o da automação, e nenhum número da empresa (`G1`); "Rodar agora" não manda e-mail | `apps/server/src/hub/notifications/mail.test.ts` | must |
| 15 | U2 | O e-mail recusado (`MAIL_UNAVAILABLE`) não desfaz a notificação nem a execução; o processo imprime `AUTOMATION_MAIL_FAILED` sem o endereço | `mail.test.ts`, "o e-mail fora" | must |
| 16 | U2 | As notificações saem com a pessoa e a empresa (as chaves estrangeiras), e o catálogo das permissões fecha (`database-grants.sql`) | `apps/server/src/platform/catalog.test.ts`; `notifications.test.ts`, "a remoção" | must |
| 17 | U3 | Numa conversa do Início, o modelo recebe `propose_automation`, além das ferramentas do critério 12 da 24.1; a saída é a proposta, e nada é gravado sem o toque | `apps/server/src/builder/assistant/assistant.test.ts`, "as ferramentas" | must |
| 18 | U3 | O cartão da proposta mostra o nome, a cadência em português ("Todo dia às 07:00", "Segunda e quinta às 08:00"), o lugar, as ligações e o pedido; **Criar automação** chama a criação com uma chave de tentativa e vira "Automação criada" com o caminho; uma recusa mostra a frase do código; tocar duas vezes cria uma | `apps/web/src/builder/automations/proposal.test.tsx` | must |
| 19 | U3 | A página Automações (Início e Projeto) lista as da pessoa com o estado e a próxima; **Pausar**, **Retomar**, **Rodar agora** e **Apagar** (com confirmação) mudam a linha; o histórico mostra cada execução com **Abrir a conversa** | `apps/web/src/builder/automations/automations.test.tsx` | must |
| 20 | U3 | O membro não vê a entrada Automações; o endereço de uma automação de outra pessoa dá a página de não encontrado | `automations.test.tsx`, "o membro" | must |
| 21 | U3 | O sino mostra o número de não lidas; abrir o painel lista as notificações, tocar numa abre a conversa e a marca lida; **Marcar todas como lidas** zera o número | `apps/web/src/hub/notifications/bell.test.tsx` | must |
| 22 | U3 | Uma conversa aberta por uma automação mostra **Automação · <nome>** nas recentes e no topo da conversa | `apps/web/src/builder/assistant/home.test.tsx`, "a etiqueta" | must |
| 23 | U3 | As telas novas a 1366 e a 390 px, nos dois temas, sem rolagem lateral (W34 e o QA) | o QA da etapa (testing T25) | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Automações (Início e Projeto) | "Peça numa conversa, por exemplo: todo dia às 7h me manda o resumo de vendas." com **Nova conversa** | o mesmo | a lista em esqueleto | `DATABASE_UNAVAILABLE`: a frase com Tentar de novo | o Projeto apagado: a página de não encontrado da casa | o membro não vê a entrada; o endereço dá "não encontrado" (S10) | — |
| Uma linha da lista | — | — | o botão tocado ocupado | `AUTOMATION_RUNNING`: "Esta automação já está rodando."; a falha da rota: a frase do código | `AUTOMATION_NOT_FOUND`: a linha some e a lista recarrega | — | `PAUSED`: "Pausada", sem "Próxima" |
| O histórico de uma automação | "Ainda não rodou. Próxima: <data>." | o mesmo | as execuções em esqueleto; uma `RUNNING` com "Rodando" | a frase do código com Tentar de novo | `AUTOMATION_NOT_FOUND`: a página de não encontrado | o membro: não encontrado | `FAILED`: "Falhou: <frase do código>", com **Abrir a conversa** se houver; `SKIPPED`: "Não rodou: você não pode mais perguntar ao Assistente." |
| O cartão da proposta | o cartão com **Criar automação** | — | **Criar automação** ocupado | a frase do código (`AUTOMATION_LIMIT`: "A empresa chegou a 30 automações ativas. Pause ou apague uma.") | o Projeto apagado: `NOT_FOUND` com a frase da 24.1 | — | criada: "Automação criada", com **Ver automação** |
| O sino | o sino sem número | "Nenhuma notificação." | o painel em esqueleto | a frase do código com Tentar de novo | a conversa apagada: "Esta conversa não existe mais." | o membro vê o sino vazio (não recebe automação) | — |
| A conversa de uma automação | a pergunta da automação e a resposta | — | como a da 24.1 | como a da 24.1 | como a da 24.1 | como a da 24.1 | como a da 24.1 |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `AutomationInput` (o `inputData` da linha da agenda) | U1 (a criação) | U1 (o workflow, a lista, o histórico) |
| `Cadence` (no `metadata.cadence` da linha) | U1 (a criação) | U1 (`cronOf`, a lista); U3 (`cadenceText`) |
| `AutomationSummary`, `AutomationRun` | U1 (as rotas) | U3 (as telas) |
| `RunOutcome` (a saída do workflow) | U1 (o último passo) | U1 (o histórico); U2 (`Notify`) |
| A marca `conexusAutomation` do fio | U1 (a criação da conversa pela execução) | U1 (o `automation` do resumo da conversa); U3 (a etiqueta) |
| `NotificationRow` | U2 (`Notify`) | U2 (as rotas); U3 (o sino) |
| `ProposedAutomation` (a saída de `propose_automation`) | U3 (servidor) | U3 (o cartão) |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Criar a automação (`schedules.get` pelo id derivado da empresa, da pessoa e da chave; se não há, `schedules.create`, que recusa um id existente com `SCHEDULES_ID_EXISTS`, `NM:schedules-BfNkiF4x.js:470-478`) | a mesma chave: o `get` acha a linha, ou o `create` perde a corrida com `SCHEDULES_ID_EXISTS` e a rota lê de novo; o `bodyHash` do `metadata` decide entre a mesma automação e `IDEMPOTENCY_CONFLICT`; duas chaves: duas linhas; o limite de 30 é conferido antes, e dois pedidos ao mesmo tempo podem passar dele por um, o que se aceita | a conferência (papel, Projeto, cadência, limite) antes de criar: nada gravado; um corte depois do `create`: a repetição com a mesma chave acha a linha | banco do Mastra fora: `DATABASE_UNAVAILABLE`, nada criado | `AUTOMATION_CREATED` (empresa, automação, cadência) | 1, 1a, 2 |
| Pausar, retomar (`schedules.pause`, `resume`) | os dois últimos valem; cada resposta diz o estado | uma linha só, sem passo no meio | `DATABASE_UNAVAILABLE`; a tela volta ao estado de antes | `AUTOMATION_PAUSED`, `AUTOMATION_RESUMED` | 5 |
| Apagar (`schedules.delete`) | o segundo dá `AUTOMATION_NOT_FOUND` | uma execução em andamento termina e avisa; a linha já não volta | `DATABASE_UNAVAILABLE`; a linha fica | `AUTOMATION_DELETED` | 11 |
| Rodar agora (`schedules.run`, publica `workflow.start` com `sched_<id>_<agora>`, `NM:schedules-BfNkiF4x.js:638-704`, relay) | a rota recusa com `AUTOMATION_RUNNING` se a última execução está `RUNNING` (uma `running` de antes da partida deste processo conta como `INTERRUPTED`); dois toques no mesmo instante podem passar, e a tela desliga o botão no primeiro | a publicação é uma gravação só | `DATABASE_UNAVAILABLE` | `AUTOMATION_RUN_REQUESTED` | 7 |
| O disparo do horário (o Mastra reivindica a janela por comparação e troca de `nextFireAt`, `NM:storage/domains/schedules/base.d.ts:208,237`, publica `workflow.start` com `sched_<id>_<nextFireAt>`, e o trabalhador de orquestração faz `createRun` e `start`, pulando um run que já existe, `NM:resolve-agent-CMSnjTVM.js:2993-3016`) | uma janela, uma reivindicação: duas instâncias não disparam duas vezes; o mesmo run não começa duas vezes | a janela reivindicada e o Hub parado antes de publicar: o Mastra grava `failed` no gatilho e a janela se perde; a próxima roda | banco fora: o tique falha e tenta no próximo (10 s) | do Mastra; a U1 imprime `AUTOMATION_FIRED` no primeiro passo | 6, 11c, 11d |
| Abrir a conversa da execução (`controller.createSession` get-or-create pelo id derivado do id da execução, com as marcas; `session.model.switch`; `setSetting` das ligações) | o passo repetido acha a mesma conversa pelo id | o corte depois do `createSession`: a repetição acha a sessão e grava o que falta, como a criação da 24.1 | banco do Mastra fora, o modelo padrão sem conta: o passo devolve `FAILED` com o código e `conversationId: null`, nunca lança, e o aviso sai | `AUTOMATION_CONVERSATION_OPENED` | 6, 6a, 9 |
| O turno da execução (`session.sendMessage({ content })`, que espera o fim e não lança numa falha do modelo, que sai como evento, `NM:agent-controller/session.d.ts:1761-1779`, `NM:agent-controller-DO6rGsQm.js:5581-5612`, relay; depois `controller.deleteSession`, que solta só o estado vivo, `NM:agent-controller/agent-controller.d.ts:155-162`) | uma execução por conversa; o passo repetido acha a pergunta já no fio e não manda de novo | o fim do Hub corta o turno (C62): `FAILED` com `INTERRUPTED`; a parte respondida fica na conversa | modelo fora, conta esgotada: o evento de fim do turno (`turn.ts` da 24.1) dá `FAILED` com o código da 11 ou da 12 | da 24.1 | 9, 11c, 11e |
| Notificar (`insert … on conflict (company_id, run_id) do nothing`) | o passo repetido não duplica | a notificação gravada antes do e-mail; um corte entre os dois deixa a notificação sem e-mail | banco do Hub fora: o passo falha e a execução fica sem aviso, impresso | `NOTIFICATION_CREATED` | 12 |
| O e-mail (`SendMail` da 0017, só quando a notificação é nova e o gatilho é o horário, ou é a pausa) | só a primeira gravação manda | — | Cloudflare fora ou a cota de 200 esgotada: `MAIL_UNAVAILABLE`, a notificação fica | `AUTOMATION_MAIL_FAILED` sem o endereço | 14, 15 |
| Marcar lida (`update … set read_at`) | idempotente | uma gravação | `DATABASE_UNAVAILABLE`; o número volta | nada | 13, 21 |
| A remoção (empresa, pessoa, Projeto: `schedules.list({ workflowId })` filtrado pelo `inputData`, `delete` de cada uma, antes das conversas) | apagar de novo uma apagada não falha | uma por vez; uma falha no meio deixa linhas que a próxima remoção acha; um disparo que chegar a uma linha órfã acha o dono sem papel e fica `SKIPPED` | banco do Mastra fora: a remoção para e tenta de novo como a da 24.1 | `AUTOMATIONS_RELEASED` (quantas) | 11a |
| Ligar e parar a agenda (`mastra.startWorkers()` na partida; `mastra.getWorker('scheduler')` parado no aviso de parar, `NM:mastra/index.d.ts:511`; `stopWorkers` no fim, `:2447`) | uma partida por processo | — | banco fora na partida: a partida falha como hoje | do Mastra | 11b, 11c |

## A tabela de referência

Referências: Mastra como instalado (`@mastra/core` 1.79.0, `@mastra/pg` 1.32.0; `NM:` é
`node_modules/@mastra/core/dist`); a Mastra Factory e o resto do fonte na estante `mastra-1.78`
`6a465f9d` (`M:`). O Conexus é lido no ramo do cartão da 24.1 (`cc7c83de`), e as peças da 24.1 pelo
cartão dela, porque ainda não foram construídas. "Lido" é linha reaberta pelo autor deste cartão;
"relay" é de um estudo ou de um ajudante, e a unidade a reabre antes de usar.

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A linha da automação | U1 | nada; o `new Mastra` sem agenda (`builder/conversation/builder.ts:197-201`, lido) | `NM:schedules/schedules.d.ts:178-194` (`create`, `get`, `list`, `update`, `delete`, `pause`, `resume`, `run`), lido; a Factory guarda a sua agenda "in core Schedules (one row per project) rather than a factory column: the scheduler owns firing, claims and the run trigger log" (`M:mastracode/factory/src/environment/build-schedule.ts:1-6`), lido | uma linha da agenda do Mastra por automação; o app só cria, pausa, retoma e lê | nativo: `mastra.schedules`, sem tabela no Hub; o que a automação é vai no `inputData` e no `metadata` da linha | critérios 1, 4, 5, 11 | `A1` | `builder/automations/automations.ts` |
| O que a agenda dispara | U1 | — | o alvo agente chama `agent.generate` ou `sendSignal` direto, sem sessão do controlador (`NM:worker-5hzgCU_T.js:160-448`, relay do ajudante); `agentControllers` não registra o agente em `mastra.agents` (`NM:mastra-Da0Czfte.js:1273-1295`, relay); o alvo ausente é apagado depois de 3 faltas (`NM:scheduler-3IjINScC.js:9,146-186`, relay); o alvo workflow: a agenda publica `workflow.start` (`NM:scheduler-3IjINScC.js:280,343-369`, lido em 263-300) e o trabalhador de orquestração faz `createRun` e `start`, pulando um run que já existe (`NM:resolve-agent-CMSnjTVM.js:2993-3016`, lido); a Factory dispara um workflow (`M:mastracode/factory/src/environment/build-workflow.ts:10,68-79`, lido pelos nomes) | a agenda aponta para um workflow registrado no código | nativo: um workflow `conexus-automation-run`, registrado no `new Mastra({ workflows })`, que abre a conversa pelo controlador do Assistente; nunca o alvo agente, que pularia o controlador da 24.1 (o modo, a conta, o turno) | critérios 6, 6a | `A1`, `C1` | `builder/automations/run.ts` |
| A cadência e o fuso | U1 | — | `validateCron` (`@mastra/core/workflows`), usado pela Factory (`M:mastracode/factory/src/environment/build-schedule.ts:9,55`, lido); o cron pelo `croner` e o erro `SCHEDULES_INVALID_TIMING` (`NM:cron-WgPqG6lD.js:1,9-23`, relay); ChatGPT Tasks e Claude Code oferecem diário, dias úteis, semanal e mensal (relay do estudo da ordem) | um cron com fuso; o produto oferece cadências prontas | embrulhado: a união `Cadence` da tela vira cron por `cronOf`, um dono só; o fuso é sempre `America/Sao_Paulo` | critério 3 | `F` (pendente) | `builder/automations/cadence.ts` |
| A conversa de cada execução | U1 | a criação da conversa do Assistente (cartão da 24.1, U2: `createSession({ id, resourceId, threadId: id, tags })`, `session.model.switch`, `setSetting`) | `createSession` com `tags` (`NM:agent-controller/agent-controller.d.ts:119-142`, lido pela assinatura); `session.sendMessage` "Send a message to this session's current agent and await the run" (`NM:agent-controller/session.d.ts:1761-1779`, lido); o despachante de regras da Factory entrega um sinal a uma sessão com `requireDelivery` (`M:mastracode/factory/src/rules/dispatcher.ts:1024-1028`, lido pela linha) | um gatilho abre uma sessão e manda a mensagem por ela | nativo: o passo do workflow chama a mesma função de criação da 24.1, com a marca `conexusAutomation`, e `sendMessage` | critérios 6, 6a, 6b | `C1` | `builder/assistant/open.ts` (a criação da 24.1 sai da rota para uma função) |
| Rodar agora | U1 | — | `schedules.run(id)` publica o mesmo início com `triggerKind: 'manual'` (`NM:schedules-BfNkiF4x.js:638-704`, relay) | o mesmo caminho do horário | nativo | critério 7 | `C1` | — |
| O histórico | U1 | — | `listTriggers(scheduleId, { limit, fromActualFireAt, toActualFireAt })` no domínio de armazenamento, não em `mastra.schedules` (`NM:storage/domains/schedules/base.d.ts:194-200,243`, relay), a linha `{ scheduleId, runId, scheduledFireAt, actualFireAt, outcome, triggerKind }` (`:160-183`, relay); o gatilho de workflow fica `published` e não muda no fim (relay do ajudante); `workflow.getWorkflowRunById` com `fields` para o resultado (`NM:workflows/workflow.d.ts:498-501`, lido) | os gatilhos dizem quando e como; o run diz como terminou | embrulhado: `runsOf` junta o gatilho e o estado do run, e lê a conversa da saída do run | critério 8 | `C1` | `builder/automations/runs.ts` |
| A janela perdida | U1 | — | `computeNextFire(schedule, after)` calcula a próxima a partir de agora (`NM:cron-WgPqG6lD.js:46-56`, lido) | um horário perdido roda uma vez, e o resto volta ao normal | nativo | critério 11d | não precisa | — |
| Ligar a agenda no Hub | U1 | o Hub usa o Mastra sem servidor, e nada chama `startWorkers` (grep em `apps/server/src`, lido) | "The scheduler is auto-enabled when ... schedule rows exist in storage ... Apps that never schedule anything never poll storage" (`NM:mastra/index.d.ts:311-321`, lido); `startWorkers()` procura as linhas guardadas e liga a agenda só se houver (`NM:mastra-Da0Czfte.js:5037-5049`, lido); o tique a cada `1e4` ms (`NM:scheduler-3IjINScC.js:7`, relay; `tickIntervalMs`, `NM:workflows/scheduler/types.d.ts:71`, relay) | o app chama `startWorkers` na partida; a agenda acorda o banco a cada tique só quando há linhas | nativo: `mastra.startWorkers()` em `main.ts`, o tique padrão de 10 s (`D1` paga o banco acordado); `startWorkers` também liga o trabalhador de orquestração, que o workflow precisa; a agenda é parada pelo `getWorker('scheduler')` no aviso de parar | critérios 11b, 11c | `D1` | — |
| Os ganchos `prepare`, `onFinish`, `onError` | fica de fora | — | valem só para a agenda de agente (`NM:schedules/types.d.ts:157-218,235-259`, relay) | — | nativo: fica de fora, porque o alvo é um workflow; o fim da execução é o último passo dele | não precisa | não precisa | — |
| A notificação para a pessoa | U2 | nenhuma notificação no Hub (grep, relay do ajudante) | as notificações do Mastra são a caixa de entrada de um agente, entregue ao fio como sinal e lida pela ferramenta `notification-inbox` (`NM:notifications/workflow.d.ts:6-10`, `NM:notifications/tool.d.ts`, relay); a tabela do Hub com a política `OWN` (`builder/conversation/tables.ts:13-15`, lido) | — | embrulhado: uma tabela do Hub pelo Drizzle, com a política `OWN`, porque a do Mastra é para agentes e não para pessoas | critérios 12, 13 | a 20.4 (2026-10-29) | `hub/notifications/tables.ts` |
| O e-mail | U2 | `createMail` (`platform/mail.ts:34`), `MailMessage` (`:8`), ligado só à identidade (`main.ts:114`); `MailFrame` (`hub/identity/mail-frame.tsx:27`), lidos | o convite: `invitation-email.tsx` renderizado pelo `@react-email/render` 2.1.0 num pacote do `esbuild` (`apps/server/package.json:9`), lido | uma moldura, um modelo por e-mail | nativo: o mesmo `SendMail`, passado também às notificações; um segundo ponto de entrada do `esbuild` | critérios 14, 15 | `C1`, `G` (pendente) | `hub/notifications/automation-email.tsx` |
| Criar pela conversa | U3 | `propose_app` e **Criar app** (cartão da 24.1, U4: `ProposedApp`, critério 28) | o mesmo da 24.1 | a ferramenta só propõe; a pessoa grava num toque | nativo: `propose_automation` devolve a proposta; o cartão chama a criação | critérios 17, 18 | `E` (pendente) | `builder/assistant/propose-automation.ts`, `apps/web/src/builder/automations/proposal.tsx` |
| A página Automações | U3 | a barra lateral (`routes/_app/companies/$companyId/route.tsx:57-86`), o trilho do Projeto (`hub/projects/project-rail.tsx:111-172`), lidos | Claude Code: as tarefas agendadas, cada uma com as execuções (https://code.claude.com/docs/en/routines, relay do estudo da ordem); Gumloop: o histórico das execuções (relay) | uma lista com o estado, a próxima, as ações e o histórico | nativo: as peças de `apps/web/src/ui/` | critérios 19, 20, 23 | `A1` | `apps/web/src/builder/automations/` |
| O sino | U3 | — | Claude, ChatGPT e Gumloop avisam no produto e por e-mail (relay do estudo da ordem) | um contador e um painel | nativo: `Popover` de `apps/web/src/ui/` | critério 21 | `C1` | `apps/web/src/hub/notifications/bell.tsx` |
| A etiqueta Automação | U3 | as recentes com a etiqueta do Projeto (cartão da 24.1, U4) | o resumo da conversa ganha `automation` | — | nativo: um `Badge` como o do Projeto | critério 22 | `C1` | — |

**A medida do transplante.** Nada vem do repositório antigo: ele não tinha agenda pelo Mastra (o
pg-boss sai, pelo roadmap).

**A dívida.**
- O limite de 30 automações ativas por empresa vem da cota de 200 e-mails por dia (0017) para as
  quatro empresas e os convites; muda quando o plano de e-mail mudar.
- A janela reivindicada e perdida num corte do Hub não roda de novo (tabela de falhas); a #339 e a
  16 cuidam do corte.

## U1 A automação e a sua execução

**Base e modelo.** `main` depois das U2 a U4 da 24.1. Opus: a agenda, o workflow e o controlador do
Assistente se cruzam, e o fim do Hub é concorrência.

### As linhas da tabela

- **A agenda.** `NM:schedules/schedules.d.ts:12-60` (as visões), `:64-115` (as entradas de criação),
  `:151-176` (`ListSchedulesFilter`: `workflowId`, `resourceId`, `status`), `:178-194` (a classe);
  `NM:schedules-BfNkiF4x.js:470-478` (`SCHEDULES_ID_EXISTS`); `NM:storage/domains/schedules/base.d.ts:89`
  (status `active`, `paused`, `completed`), `:107-123` (`Schedule`: `nextFireAt`, `lastFireAt`,
  `lastRunId`, `metadata`), `:160-183,194-200,243` (`listTriggers`).
  A Factory como modelo de uso: `M:mastracode/factory/src/environment/build-schedule.ts` inteiro (o id
  normalizado `schedule_<slug>`, `validateCron`, `resourceId`).
- **O workflow.** `createWorkflow`, `createStep` (`@mastra/core/workflows`); a Factory:
  `M:mastracode/factory/src/environment/build-workflow.ts:10,68-90`. O disparo:
  `NM:scheduler-3IjINScC.js:263-300` (a reivindicação e o `runId`), `:343-369` (a publicação);
  `NM:resolve-agent-CMSnjTVM.js:2993-3016` (o trabalhador de orquestração: `createRun`, `start`, e o
  run já existente pulado).
- **A conversa.** O cartão da 24.1, U2: a criação, `SESSION_MARK`, `CHOSEN_SETTING`,
  `assistantOwner`, `sessionScope`, o turno e `turn.end()`; `NM:agent-controller/session.d.ts:1761-1779`.
- **O histórico.** `NM:workflows/workflow.d.ts:478,498-501`.
- **A partida e o fim.** `NM:mastra/index.d.ts:311-321,409-434` (`recovery`), `:511` (`getWorker`),
  `:2410` (`startWorkers`), `:2447` (`stopWorkers`); `NM:mastra-Da0Czfte.js:1080-1090,5037-5049`; o
  fim do Hub da 24.1 (U0 e U2: `assistant.close()`, o do Builder, `mastra.shutdown()`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/automations/` | Cria `automations.ts` (o serviço sobre `mastra.schedules`), `cadence.ts` (`cronOf`), `run.ts` (o workflow), `runs.ts` (o histórico), `routes.ts`, `release.ts`, `public.ts` | `mastra.ts`, `main.ts`, as rotas |
| `apps/server/src/builder/assistant/` | Cria `open.ts`: a criação da conversa sai da rota da 24.1 para `openConversation`, usada pela rota e pelo workflow; muda `context.ts` (`SESSION_MARK.automation`) e o resumo da conversa (`automation`) | a rota de conversas, o workflow |
| `apps/server/src/builder/mastra.ts` | Muda: `workflows: { [AUTOMATION_WORKFLOW]: automationRun }` no único `new Mastra`; recebe `schedulerTickMs?` (o padrão do Mastra em produção; curto só nos testes) e o passa como `scheduler: { tickIntervalMs }` | `main.ts`, os testes |
| `apps/server/src/main.ts` | Muda: monta as automações, chama `mastra.startWorkers()` depois de montar tudo; no aviso de parar, para o trabalhador `scheduler` antes da espera da U0; no fim, `assistant.close()`, o do Builder, `mastra.shutdown()` | — |
| `packages/hub-api/src/automations.ts` | Cria: rotas, `Cadence`, `AutomationSummary`, `AutomationRun`; muda `index.ts`, `failures.ts` (`AUTOMATION_LIMIT`, `AUTOMATION_NOT_FOUND`, `AUTOMATION_RUNNING`, `INTERRUPTED`, `SCHEDULE_PUBLISH_FAILED`, com as frases), `assistant.ts` (`automation` no resumo), o OpenAPI gerado | a U2, a U3 |
| `apps/server/src/hub/identity/admission.ts` | Não muda: as rotas usam `askAssistant` | — |
| o registro de remoções (T12) | Muda: as rotas novas | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/automations.ts
const BASE = '/api/companies/{companyId}/automations'
// GET    BASE ?projectId=                 -> { automations: AutomationSummary[] }   acesso askAssistant; falhas: NOT_FOUND, DATABASE_UNAVAILABLE
// POST   BASE { name, prompt, cadence, projectId?, connections }, attemptKey: true -> 201 { automation: AutomationSummary }
//        falhas: as de leitura, NOT_FOUND (o Projeto), REQUEST_MALFORMED, IDEMPOTENCY_CONFLICT, AUTOMATION_LIMIT
// POST   BASE/{automationId}/pause         -> 200 { automation }; falhas: AUTOMATION_NOT_FOUND e as de leitura
// POST   BASE/{automationId}/resume        -> 200 { automation }
// POST   BASE/{automationId}/run           -> 202 { runId: AutomationRunId }   (sched_<id>_<scheduledFireAt> da resposta de schedules.run); falhas: AUTOMATION_RUNNING, AUTOMATION_NOT_FOUND
// DELETE BASE/{automationId}               -> 204; falhas: AUTOMATION_NOT_FOUND
// GET    BASE/{automationId}/runs ?next=   -> { runs: AutomationRun[], next: string | null }   (20 por página, `next` opaco, code C44)
export const AutomationId = z.string().regex(/^schedule_conexus-automation-[0-9a-f-]{36}$/).brand('AutomationId')
export const HourMinute = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
export const Weekday = z.enum(['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'])
export const Cadence = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('DAILY'), time: HourMinute }),
  z.object({ kind: z.literal('WEEKDAYS'), time: HourMinute }),
  z.object({ kind: z.literal('WEEKLY'), days: z.array(Weekday).min(1).max(7), time: HourMinute }),
  z.object({ kind: z.literal('MONTHLY'), day: z.int().min(1).max(28), time: HourMinute }),
])
export const AutomationTarget = z.discriminatedUnion('kind', [z.object({ kind: z.literal('ASSISTANT') })]) // 24.3: AGENT; 24.5: WORKFLOW
export const AutomationSummary = z.object({
  id: AutomationId, name: z.string(), prompt: z.string(), cadence: Cadence, target: AutomationTarget,
  projectId: ProjectId.nullable(), connections: z.array(SessionConnection),   // SessionConnection da 24.1
  state: z.enum(['ACTIVE', 'PAUSED']), nextRunAt: z.iso.datetime().nullable(), createdAt: z.iso.datetime(),
})
export const RunState = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('RUNNING'), conversationId: ConversationId.nullable() }),
  z.object({ kind: z.literal('DONE'), conversationId: ConversationId }),
  z.object({ kind: z.literal('FAILED'), code: FailureCodeSchema, conversationId: ConversationId.nullable() }),   // FailureCode de failures.ts, com INTERRUPTED e SCHEDULE_PUBLISH_FAILED novos
  z.object({ kind: z.literal('SKIPPED'), reason: z.literal('OWNER_CANNOT_ASK') }),
])
export const AutomationRunId = z.string().regex(/^sched_schedule_conexus-automation-/).brand('AutomationRunId')
export const AutomationRun = z.object({
  runId: AutomationRunId, firedAt: z.iso.datetime(), trigger: z.enum(['SCHEDULED', 'MANUAL']), state: RunState,
})
// assistant.ts (24.1): AssistantConversationSummary ganha
//   automation: z.object({ automationId: AutomationId, name: z.string() }).nullable()

// apps/server/src/builder/automations/run.ts
export const AUTOMATION_WORKFLOW = 'conexus-automation-run'
/** The schedule row's inputData, parsed with Zod at the workflow's start (C27): what the automation is. */
export const AutomationInput = z.object({
  version: z.literal(1),
  automationId: AutomationId, companyId: CompanyId, personId: PersonId,
  place: PlaceSchema,                       // a união Place da 24.1 (U1), em Zod
  name: z.string().min(1).max(80), prompt: z.string().min(1).max(4000),
  connections: z.array(ConnectionId).max(50), target: AutomationTarget,
})
/** The workflow's output, one per run (C21). */
export type RunOutcome =
  | { kind: 'DONE'; conversationId: ConversationId }
  | { kind: 'FAILED'; code: FailureCode; conversationId: ConversationId | null }
  | { kind: 'SKIPPED'; reason: 'OWNER_CANNOT_ASK' }
export function automationRun(deps: { assistant: Assistant; notify: Notify }): Workflow   // Notify: U2; até lá, um que só imprime

// apps/server/src/builder/automations/cadence.ts
/** The one owner of cadence -> cron (C26). */
export function cronOf(cadence: Cadence): string
export const AUTOMATION_TIMEZONE = 'America/Sao_Paulo'
export const ACTIVE_AUTOMATIONS_PER_COMPANY = 30

// apps/server/src/builder/automations/automations.ts
export type Automations = {
  list(scope: { companyId; personId; place: Place }): Promise<readonly AutomationSummary[]>
  create(scope, input: CreateAutomation, attemptKey: string): Promise<AutomationSummary>
  pause(scope, id: AutomationId): Promise<AutomationSummary>
  resume(scope, id: AutomationId): Promise<AutomationSummary>
  runNow(scope, id: AutomationId): Promise<{ runId: string }>
  remove(scope, id: AutomationId): Promise<void>
  runs(scope, id: AutomationId, next: string | null): Promise<{ runs: readonly AutomationRun[]; next: string | null }>
  /** Deletes the automations of a company, a person of it or a Projeto of it (the Hub's ReleaseScope). */
  release(scope: ReleaseScope): Promise<void>
}
export function createAutomations(deps: { mastra: Mastra; assistant: Assistant; connectors: AssistantConnectors; projects: Projects; log: Logger }): Automations

// apps/server/src/builder/assistant/open.ts (sai da rota da 24.1)
export function openConversation(input: {
  owner: { companyId: CompanyId; personId: PersonId }; place: Place; connections: readonly ConnectionId[]
  id: ConversationId; automation?: { automationId: AutomationId; name: string }
}): Promise<{ conversationId: ConversationId; session: AgentControllerSession }>
```

- **O id da automação.** `schedule_conexus-automation-<uuid>`, onde o uuid deriva de
  `(companyId, personId, attemptKey)` pela derivação que a 24.1 usa para o id da conversa; o Mastra
  normaliza o id criado para `schedule_<slug>`, e o slug mantém os hífens
  (`build-schedule.ts:14-22`), e a rota lê sempre o normalizado. A criação faz `get`, depois `create`;
  `SCHEDULES_ID_EXISTS` (`NM:schedules-BfNkiF4x.js:470-478`) é a corrida perdida, e a rota lê de novo.
  O `metadata` guarda `bodyHash` (o do corpo, como `builder/conversation/store.ts:68-90`); a rota o
  compara e responde `IDEMPOTENCY_CONFLICT` quando difere. Conferido pela
  marca (C23) na entrada de cada rota, e o dono por `inputData.companyId` e `personId` contra a
  sessão: outro dono é `AUTOMATION_NOT_FOUND` (S10).
- **A linha.** `schedules.create({ id, workflowId: AUTOMATION_WORKFLOW, cron: cronOf(cadence),
  timezone: AUTOMATION_TIMEZONE, inputData, resourceId: assistantOwner(owner), metadata: { companyId,
  projectId, cadence, bodyHash } })`. A lista é `schedules.list({ workflowId, resourceId })` filtrada pelo lugar
  do `inputData`. A remoção da empresa é `list({ workflowId })` filtrada por `inputData.companyId`:
  poucas linhas por Hub, na escala do cartão.
- **O id da conversa da execução.** Deriva do `runId` (`sched_<id>_<nextFireAt>` ou do manual),
  pela mesma derivação: o passo repetido acha a mesma conversa (critério 6).
- **O workflow, três passos.** (1) `check`: `AutomationInput.parse`; o dono pode perguntar
  (`askAssistant`)? Se não, `schedules.pause` e `SKIPPED`. Um Projeto apagado não chega aqui: a
  remoção do Projeto apaga a linha antes (critério 11a). (2) `converse`: nunca lança; todo erro vira
  `FAILED` com o código e `conversationId: null` se a conversa não abriu. `openConversation` com as
  ligações do `inputData` (a porta corta pelo lugar de hoje) e o modelo padrão do dono (12.3); se o
  fio já tem a pergunta (o passo repetido, a recuperação do Mastra), não manda de novo e devolve
  `FAILED` com `INTERRUPTED`; senão assina os eventos da sessão **antes** de
  `session.sendMessage({ content: prompt })`, porque uma falha do modelo sai como evento e
  `sendMessage` volta sem lançar; o fim do turno de `turn.ts` (24.1) decide `DONE` ou `FAILED` com o
  código; por fim `controller.deleteSession`, que solta só o estado vivo. (3) `notify`:
  `notify.automationRan({ outcome, trigger, place, … })`, sempre.
- **O dono do fato "esta conversa é de uma automação"** é a marca `conexusAutomation` no fio (C26),
  escrita só por `openConversation`; o resumo da conversa a lê.
- **O fim do Hub.** No aviso de parar, o trabalhador `scheduler` para (`getWorker('scheduler')`),
  antes da espera da U0; o turno de uma execução é um turno do Assistente e entra no `settle` da
  24.1; o corte dá `INTERRUPTED`. O processo morto deixa o run `running`: `runsOf` lê como
  `INTERRUPTED` todo run `running` começado antes da partida deste processo (o Hub é uma instância
  só, no `compose`).
- **O histórico.** `runs.ts` chega a `listTriggers` pelo domínio (`mastra.getStorage()` e o
  domínio `schedules`), 20 por vez; o `next` opaco leva o `actualFireAt` do último e o `runId` para
  o empate. Um gatilho `failed` sem run (a publicação falhou) é `FAILED` com
  `SCHEDULE_PUBLISH_FAILED`; o estado e o resultado vêm de `getWorkflowRunById(runId, { fields })`.
- Modelo: `build-schedule.ts` e `build-workflow.ts` da Factory para a agenda; as rotas do Assistente
  da 24.1, que cumprem C21, C23 e C26, para as rotas.

### As skills e a leitura

`mastra` (a agenda e os workflows na versão instalada), `fastify-best-practices`, `pstack:tdd`; as
linhas de `docs/reference/stack.md` para `apps/server/src/builder/`. [testing](../guides/testing.md)
T5, T12, T26.

### A ordem do trabalho

1. **A prova primeiro.** O teste `run.test.ts`, "o horário", com o Mastra e o Postgres de teste:
   um `new Mastra` com o controlador do Assistente e o workflow, `startWorkers()`, uma linha com cron
   de um minuto e o relógio do teste; ele falha hoje. Se o workflow não alcança o controlador fora de
   um pedido HTTP, para (Parar se).
2. `cadence.ts` e o seu teste (critério 3).
3. `open.ts`: a criação da 24.1 sai da rota para `openConversation`, sem mudar o que a rota faz (os
   testes da 24.1 passam iguais); a marca `conexusAutomation`.
4. `run.ts`: os três passos; `Notify` que só imprime até a U2.
5. `automations.ts`, `runs.ts`, `routes.ts`, os contratos do `hub-api`, o OpenAPI.
6. `release.ts`, chamado antes das conversas na remoção da empresa, da pessoa e do Projeto.
7. `mastra.ts` e `main.ts`: o workflow registrado, `startWorkers()`, a ordem do fim. Regras: C21,
   C23, C26, C27, C44, C62, S10, T12.

### Como se prova

Cada critério da U1 pelo teste da sua linha, pela porta pública: as rotas pelo servidor de teste,
a execução pela agenda de verdade num Postgres de teste com o tique curto (`schedulerTickMs` de
`mastra.ts`, só no teste) e um horário um minuto à frente (a agenda usa `Date.now()` e um
`setInterval` de verdade; nenhum relógio falso), o modelo dublê da 12 e o dublê do Sankhya da 24.1.
O teste que falha hoje: `run.test.ts`, "o horário". Comando: os testes tocados, `npm run typecheck`,
`npm run lint`, e `npm run check-migrations` não se aplica (nenhuma migração).

### Parar se

- O workflow não alcança o controlador do Assistente fora de um pedido HTTP (o `sessionScope`, a
  conta ou o turno dependem do pedido): para e relata, com o teste.
- `startWorkers()` muda o que o Builder faz (o trabalhador de orquestração ou a recuperação de
  runs, `recovery.workflows` `auto` por padrão, `NM:mastra-Da0Czfte.js:1084`, mexem nos turnos dele):
  para e relata. As alavancas do Mastra são a opção `workers` e `MASTRA_WORKERS`
  (`NM:mastra-Da0Czfte.js:1094-1119`, relay); `startWorkers('scheduler')` não serve, porque com nome
  ele não injeta a agenda (`:5039-5058`, relay).
- As notificações adiadas do próprio Mastra criam a linha `__mastra_notification_dispatch`
  (`NM:mastra-Da0Czfte.js:4375-4405`, relay) e ligariam a agenda sem automação: o critério 11b a
  pega; se aparecer, relata.
- O trabalhador `scheduler` não para sozinho pelo `getWorker`: relata; o critério 11c vale pela
  ordem do `stopWorkers`.

## U2 As notificações e o e-mail

**Base e modelo.** `main` depois da U1. Sonnet: uma tabela, duas rotas e um e-mail, sobre modelos
prontos.

### As linhas da tabela

- **A tabela.** O modelo: `apps/server/src/builder/conversation/tables.ts` inteiro (o esquema, a
  política `OWN`, as chaves estrangeiras com `cascade`); a migração da 20:
  `apps/server/migrations/20261030172006_e20_project_connection/migration.sql` e as permissões em
  `20261030172021_e20_project_connection_grants`; `apps/server/database-grants.sql`.
- **O e-mail.** `apps/server/src/platform/mail.ts:8-34`; `apps/server/src/hub/identity/messages.ts:47-80`
  (`invitationMail`, `recoveryMail`); `mail-frame.tsx:4,27`; `invitation-render.d.mts:16,27`;
  `apps/server/package.json:9` (o `esbuild`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/notifications/` | Cria `tables.ts`, `notifications.ts` (`Notify` e a leitura), `routes.ts`, `automation-email.tsx`, `notification-render.mjs` (gerado), `notification-render.d.mts`, `public.ts` | `main.ts`, o workflow |
| `apps/server/src/hub/identity/` | Muda `mail-frame.tsx` só se a moldura precisar exportar mais; nada mais | as notificações |
| `apps/server/migrations/` | Cria a migração da tabela e a das permissões | o migrador |
| `apps/server/database-grants.sql` | Muda: `hub_company` lê, grava e atualiza `notifications.notification` | o catálogo |
| `apps/server/package.json` | Muda `build`: o segundo ponto de entrada do `esbuild` | o CI, o `prestart` |
| `apps/server/src/main.ts` | Muda: um `SendMail` só, passado à identidade e às notificações; `Notify` passado às automações | — |
| `apps/server/src/builder/automations/` | Muda `run.ts`: o `Notify` de verdade | — |
| `packages/hub-api/src/notifications.ts` | Cria: rotas, tipos e `conversationPath(companyId, projectId, conversationId)`, o dono do endereço de uma conversa no Hub; muda `index.ts`, o OpenAPI | a U3, o e-mail |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/notifications/tables.ts — schema notifications, política OWN como builder.conversation
// notification(
//   id uuid primary key,
//   company_id text not null, person_id text not null,          -- FK member (company_id, person_id) on delete cascade; FK company cascade
//   kind text not null check (kind in ('AUTOMATION_DONE','AUTOMATION_FAILED','AUTOMATION_PAUSED')),
//   automation_id text not null, automation_name text not null, project_id text null,   -- o lugar, para o endereço
//   conversation_id uuid null, failure_code text null,
//   run_id text not null, created_at timestamptz not null, read_at timestamptz null,
//   unique (company_id, run_id)
// )

// apps/server/src/hub/notifications/notifications.ts
export type Notify = {
  /** One notification per run; mails the owner only for a new one fired by the schedule. */
  automationRan(event: {
    companyId: CompanyId; personId: PersonId; automationId: AutomationId; name: string
    projectId: ProjectId | null; runId: AutomationRunId; trigger: 'SCHEDULED' | 'MANUAL'; outcome: RunOutcome
  }): Promise<void>
}
export function createNotifications(deps: { db: Database; sendMail: SendMail; hubUrl: URL; log: Logger }): { notify: Notify; routes: FastifyPluginAsync }

// packages/hub-api/src/notifications.ts
// GET  /api/companies/{companyId}/notifications ?next=   -> { notifications: NotificationRow[], unread: number, next: string | null }  (30 por página)
//      acesso useConversations (todo membro lê as suas; só dono e administradores recebem nesta etapa)
// POST /api/companies/{companyId}/notifications/read { ids: NotificationId[] (até 100) } | { all: true } -> 204
export const NotificationId = z.uuid().brand('NotificationId')
export const NotificationRow = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('AUTOMATION_DONE'), id: NotificationId, createdAt: z.iso.datetime(), read: z.boolean(),
             automation: z.object({ id: AutomationId, name: z.string() }), projectId: ProjectId.nullable(), conversationId: ConversationId }),
  z.object({ kind: z.literal('AUTOMATION_FAILED'), id: NotificationId, createdAt: z.iso.datetime(), read: z.boolean(),
             automation: z.object({ id: AutomationId, name: z.string() }), projectId: ProjectId.nullable(), code: FailureCodeSchema, conversationId: ConversationId.nullable() }),
  z.object({ kind: z.literal('AUTOMATION_PAUSED'), id: NotificationId, createdAt: z.iso.datetime(), read: z.boolean(),
             automation: z.object({ id: AutomationId, name: z.string() }), projectId: ProjectId.nullable() }),
])
```

- **O dono do e-mail da pessoa** é a identidade (o endereço do membro); `Notify` o lê por uma função
  pública da identidade, sem ler a tabela dela.
- **O e-mail (`G1`).** `automationMail({ to, name, outcome, link })`: o assunto "<nome> está
  pronto", "<nome> falhou" ou "<nome> foi pausada"; o corpo com o nome e o botão **Abrir no
  Conexus**. O endereço segue o lugar, como os da 24.1 (critério 24 dela): a conversa em
  `<hub>/companies/<c>/conversations/<conversa>` ou `<hub>/companies/<c>/projects/<p>/assistant/<conversa>`;
  sem conversa, a página da automação no mesmo andar. Um dono só desse endereço: `conversationPath`,
  em `packages/hub-api`, que a U3 também usa. Nenhum texto da resposta, nenhum número. Pela
  `MailFrame`.
- **Quando manda.** A notificação nova de um disparo do horário (`DONE`, `FAILED`) e toda pausa
  (`PAUSED`); "Rodar agora" nunca.
- **A ordem.** `insert … on conflict do nothing returning id`; só com a linha nova, e pela regra
  acima, o e-mail; a falha do e-mail imprime `AUTOMATION_MAIL_FAILED` e não lança.
- Modelo: `builder/conversation/tables.ts` (cumpre C23 e C26) e `messages.ts` para o e-mail.

### As skills e a leitura

`drizzle` pelas linhas de `docs/reference/stack.md` para `apps/server/src/hub/`; [data](../guides/data.md)
(a política, as permissões, a migração), [security](../guides/security.md) S10 e S40.

### A ordem do trabalho

1. A tabela, a migração e as permissões; o catálogo (critério 16).
2. `Notify` e o teste do critério 12 pelo workflow da U1.
3. O e-mail e o segundo ponto de entrada do `esbuild`; o teste do critério 14 com o `SendMail`
   dublê; o 15.
4. As rotas e o `hub-api`; o critério 13. Regras: D1, D17, D27 do guia de dados, C21, C23, C27, C44,
   S10.

### Como se prova

Os critérios 12 a 16 pelos testes das suas linhas, com o Postgres de teste e um `SendMail` dublê que
guarda as mensagens; o 12 pelo workflow de verdade da U1. `npm run check-migrations` antes do pull
request. O teste que falha hoje: `notifications.test.ts`.

### Parar se

- A identidade não tem uma função pública para o endereço do membro: relata, e a U2 cria a menor que
  a identidade aceitar.
- O segundo ponto de entrada do `esbuild` quebra o `invitation-render.mjs`: relata.

## U3 As telas e a proposta

**Base e modelo.** `main` depois da U2. Sonnet: telas sobre contratos prontos.

### As linhas da tabela

- **A proposta.** O cartão da 24.1, U4: `propose.ts`, `ProposedApp`, `propose.tsx`, o critério 28;
  `tool-registry.ts`.
- **As páginas.** `apps/web/src/routes/_app/companies/$companyId/route.tsx:57-86` (a barra lateral);
  `apps/web/src/hub/projects/project-rail.tsx:111-172`; as telas do Assistente da 24.1
  (`apps/web/src/builder/assistant/`).
- **As peças.** `apps/web/src/ui/` (`badge.tsx`, `popover.tsx`, `button.tsx`, o diálogo de
  confirmação).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/assistant/` | Cria `propose-automation.ts`; muda `assistant.ts` (a ferramenta nas listas), `prompt/assistant.md` (uma frase) e a skill `conexus` (a automação existe) | o modelo |
| `packages/hub-api/src/assistant.ts` | Muda: `ProposedAutomation`, o nome em `ASSISTANT_TOOL` | a tela |
| `apps/web/src/builder/automations/` | Cria `automations.tsx` (a lista e as ações), `runs.tsx` (o histórico), `proposal.tsx` (o cartão), `cadence-text.ts` (`cadenceText`), `queries.ts`, `public.ts` | as rotas, a conversa |
| `apps/web/src/builder/assistant/` | Muda: a etiqueta **Automação** nas recentes e no topo da conversa; o cartão da proposta no registro das ferramentas | — |
| `apps/web/src/hub/notifications/` | Cria `bell.tsx`, `queries.ts`, `public.ts` | a moldura |
| `apps/web/src/hub/projects/project-rail.tsx` | Muda: a entrada Automações, para o dono e os administradores | a moldura do Projeto |
| `apps/web/src/routes/_app/companies/$companyId/` | Muda `route.tsx` (a entrada Automações e o sino); cria `automations.index.tsx`, `automations.$automationId.tsx`, `projects/$projectId_.automations.index.tsx`, `projects/$projectId_.automations.$automationId.tsx`; muda `routeTree.gen.ts` (gerado) | o roteador |
| `docs/reference/screens.md` | Muda: as linhas das telas novas (W29) | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/assistant.ts
export const ProposedAutomation = z.object({
  name: z.string().min(1).max(80),
  prompt: z.string().min(1).max(4000),     // escrito para ser entendido sem a conversa
  cadence: Cadence,
  connections: z.array(ConnectionId).max(50),
})
// ASSISTANT_TOOL ganha proposeAutomation: 'propose_automation'

// apps/web/src/builder/automations/cadence-text.ts — o dono do texto da cadência (C26)
export function cadenceText(cadence: Cadence): string   // "Todo dia às 07:00", "Dias úteis às 08:30", "Segunda e quinta às 08:00", "Todo dia 5 às 09:00"

// apps/web/src/builder/automations/public.ts
export function Automations(props: { companyId: CompanyId; projectId?: ProjectId }): JSX.Element
export function AutomationRuns(props: { companyId: CompanyId; automationId: AutomationId; projectId?: ProjectId }): JSX.Element
export function ProposalCard(props: { companyId: CompanyId; conversation: AssistantConversation; proposed: ProposedAutomation }): JSX.Element

// apps/web/src/hub/notifications/public.ts
export function NotificationBell(props: { companyId: CompanyId }): JSX.Element
```

- **A ferramenta.** `propose_automation(ProposedAutomation)` devolve a proposta como veio, depois de
  conferir as ligações contra as escolhidas da conversa (as que não estão saem); o lugar é o da
  conversa. A frase em `assistant.md`: quando a pessoa pede algo que se repete num horário, propor a
  automação com o pedido escrito para ser entendido sozinho. A skill `conexus` diz o que a automação
  faz e o que ainda não faz (evento, agente, workflow).
- **O cartão.** O lugar vem da conversa; **Criar automação** chama a criação com uma chave de
  tentativa guardada na parte da mensagem, então recarregar e tocar de novo dá a mesma automação.
- **Endereços (W1, W29).** `/companies/<c>/automations` e `/companies/<c>/automations/<id>` (andar
  Empresa); `/companies/<c>/projects/<p>/automations` e `…/automations/<id>` (andar Projeto). Uma
  automação de Projeto aberta pelo endereço da empresa, ou o contrário, é "não encontrado".
- **Os endereços das conversas** no sino, no histórico e no cartão vêm de `conversationPath` (U2).
- **O sino.** No alto da barra lateral, com o número de não lidas (`unread`), lido de novo ao abrir
  o painel e a cada 60 s com a janela visível (W10); o painel marca lida a que a pessoa toca.

### As skills e a leitura

`router-core`, `router-plugin`, `shadcn`, `impeccable` só para conferir; [web](../guides/web.md) W1,
W8, W10, W12, W18, W29 a W31, W34.

### A ordem do trabalho

1. `propose-automation.ts` e o critério 17 (o teste da lista de ferramentas da 24.1 muda).
2. `cadence-text.ts`, `queries.ts`, `proposal.tsx` e o critério 18.
3. As páginas Automações e o histórico; as entradas na barra e no trilho; os critérios 19 e 20.
4. O sino e o critério 21; a etiqueta e o critério 22.
5. `screens.md`; o QA a 1366 e a 390 px nos dois temas (critério 23). Regras: W8, W10, W12, W18,
   W29 a W31, W34.

### Como se prova

Os critérios 17 a 22 pelos testes das suas linhas (o 17 pelo pedido ao modelo dublê, os outros pela
tela com o MSW nas rotas da U1 e da U2); o 23 pelo QA da etapa. O teste que falha hoje:
`proposal.test.tsx`.

### Parar se

- A parte da mensagem da 24.1 não guarda um estado da tela (a chave de tentativa): relata, e a
  chave vem do id da chamada da ferramenta.
- O texto de uma tela pede uma palavra que esta página não tem: relata para a aprovação dos textos.
