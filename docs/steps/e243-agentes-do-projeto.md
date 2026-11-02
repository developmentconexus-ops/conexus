# Etapa 24.3: O Construtor e o agente de verdade

Este cartão espera a 24.2. Pela regra L5, entra em `docs/steps/` quando o cartão da 24.2 sair no
fechamento dela; até lá vive no seu pull request. Ele usa o que a 24.1 e a 24.2 construíram: os
controladores do Mastra com a porta das seis rotas, a porta da empresa aos conectores, as contas de
modelo, as automações e o sino. É a primeira etapa da área nova do Projeto que o estudo do
Construtor desenhou (agentes, ferramentas, workflows, automações e canais, um ciclo só: rascunho,
teste, publicar uma versão, rodar, acompanhar).

## A página do fundador

**No fim desta etapa** você abre, num Projeto, a área **Agentes**, conversa com o **Construtor**, e
ele te traz ideias de agentes a partir do que o Projeto tem. Você escolhe uma, ele monta o rascunho
do agente sozinho e o testa; a página do agente se monta ao lado, com a estrutura da página de
agente do Mastra Studio que você mandou: instruções, modelo, memória, ligações, ferramentas e o que
ele lê. Você muda o que quiser ali mesmo, conversa com o rascunho, toca **Publicar** e o agente passa
a atender como versão 1. Mudou, publica a 2; não gostou, volta para a 1. E uma automação da 24.2
pode rodar esse agente.

**O roteiro de uso.** Padaria Sol: Ana (dona), Bia (administradora) e Bruno (membro). O Projeto
"Vendas" recebeu a ligação "Matriz" do Sankhya e tem o app "Metas", com a meta de cada vendedor. No
computador e no celular.

1. A Ana abre o Projeto Vendas, entra em **Agentes** e escreve ao Construtor "quero um agente de
   vendas". O Construtor lê o Projeto (a ligação Matriz e o que ela lê, as tabelas do app Metas) e
   responde com duas ou três ideias, cada uma com o que o agente faria, por exemplo "um conferente
   que compara as vendas de ontem com as metas e diz quem ficou abaixo". Ela escolhe a primeira.
2. O Construtor cria o rascunho e, sem perguntar, faz as ferramentas dele (por exemplo "vendas de
   ontem por vendedor", um recorte de uma leitura do Sankhya), escreve as instruções e testa o
   rascunho com uma pergunta. Na conversa aparece o cartão do agente, **Rascunho**, com **Abrir** e
   **Publicar**.
3. Ela toca **Abrir**. A página do agente tem, à esquerda, as conversas dela com ele; no meio, a
   conversa; à direita, o painel da configuração: instruções, modelo, memória, ligações (só as que o
   Projeto recebeu), ferramentas (cada uma com o que lê e os valores fixos), "Lê a web" e "Lê os
   dados do app". Ela muda o modelo e uma frase das instruções no painel, e conversa com o
   **rascunho**: "quem ficou abaixo da meta ontem?". O agente mostra as leituras e responde.
4. Ela toca **Publicar**. O cartão e a página mostram **Versão 1 · publicada**. Uma conversa nova
   agora fala com a versão 1. Ela pede ao Construtor "deixa ele mais curto nas respostas"; o
   Construtor muda o rascunho, e a página mostra "Rascunho com mudanças"; ela publica a versão 2,
   não gosta, e em **Versões** toca **Voltar para a versão 1**.
5. Na conversa com o agente ela escreve "todo dia às 7h me manda isso". O cartão da automação diz
   **Roda: Conferente de metas**. Ela toca **Criar automação** e, na página Automações, **Rodar
   agora**: a execução abre uma conversa nova com o agente, marcada "Automação", e o sino avisa.
6. A Bia abre o Projeto: vê o agente, conversa com ele e com o Construtor; as conversas da Ana não
   aparecem para ela. O Bruno (membro) não vê **Agentes**, e o endereço de um agente dá "não
   encontrado". A Ana apaga o agente: a confirmação diz que as conversas de todas as pessoas com ele
   e as automações que o rodam vão junto.

**O que você faz, e quando.**
- **No começo:** aprova esta página. As suas respostas já decidiram a forma: **`A1`** (o agente
  guardado como dados com versões, e cada versão publicada é um `new Agent` do Mastra registrado com
  o próprio nome, como o editor do Mastra faz), **`C1`** (o Construtor cria, muda e testa rascunhos
  sozinho; publicar é sempre um toque seu), **`E1`** (a ordem do roteiro abaixo), "3.A" (agentes
  escondidos do membro) e a **B** de 2026-11-02 ("Okay aprovado vamos seguir assim então"). A
  aprovação é também a sua palavra para as permissões das tabelas novas e da função que lê, ao ligar
  o Hub, as empresas com agentes publicados (regra D11), como nas etapas 9, 18, 19 e 24.2.
- **No fim:** faz o roteiro no computador e no celular, diz o que viu e aprova os textos das telas,
  inclusive o nome da entrada **Agentes** (a outra opção é **Construtor**; **Construir** continua
  sendo o Builder dos apps).

**Fica de fora, e onde entra.**
- **Ferramentas em código** (24.4). Nesta etapa as ferramentas do agente são **recortes**: uma
  leitura que o conector já tem, com valores fixos e uma descrição mais estreita. Onde roda o código
  que o Construtor escrever **não está decidido aqui**: o cartão da 24.4 decide por um protótipo de
  um dia que compara um Worker do Workers for Platforms com um comando na máquina E2B da área de
  trabalho, como o Mastra Factory faz (a sua resposta B). A máquina na conversa do agente entra com
  essa etapa.
- **Pedir para publicar** (a etapa de papéis e pedidos, logo depois desta, pela sua resposta "2"
  de 2026-11-01). Aqui só dono e administrador usam agentes. Lá o membro ganha a área, e o
  **Publicar** dele vira um pedido que qualquer dono ou administrador aprova (a sua resposta "3"):
  publicar e voltar já nascem com a sua própria ação de admissão, `publishAgent`, que aquela etapa
  troca por "pode publicar ou pode pedir".
- **Agentes que gravam** (24.5): toda ferramenta desta etapa só lê. Pedir para gravar recebe "só
  leio".
- **Workflows, o desenho em balões e as automações na mesma área** (24.6). As automações continuam
  na página delas; só ganham o alvo agente.
- **Canais**, Telegram primeiro pelos Channels do Mastra (24.7, a sua resposta `D1`).
- **Agentes no Início**: a sua `J1` põe os agentes no Projeto.
- **Comparar versões lado a lado**: a lista de versões mostra quem publicou, quando e a mensagem;
  comparar entra quando você pedir.
- **Das pendências marcadas para o próximo cartão:** entra a frase velha do texto do Builder que diz
  que os conectores "vêm depois" (a #540), porque a U4 escreve o texto do Construtor ao lado. As
  outras esperam a etapa delas: as da 14.3, 17, 18, 19 e 20 não tocam agentes; a #541 espera o seu
  pedido; a #339 (o fim do Hub no meio de um turno) espera a 16.

**As decisões suas nesta etapa.** Nenhuma nova. As do cartão anterior foram respondidas (`A1`, B, `C1`,
`E1`, 3.A). O que os estudos deixaram como engenharia (a forma de conversar com o agente registrado,
abaixo, e onde rodará o código, na 24.4) não é decisão sua.

### Como funciona por dentro

- **O agente é dados com versões.** A linha do agente guarda o **rascunho**, que você e o Construtor
  editam; cada **Publicar** congela o rascunho numa versão nova, que nunca muda. A forma dos campos
  segue a tabela de versões do próprio Mastra, campo por campo.
- **Cada agente publicado é um `new Agent` registrado no Mastra do Hub**, com o id dele, pela
  `mastra.addAgent`, como o editor do Mastra faz com os agentes da tela. Publicar ou voltar troca o
  registrado (`removeAgent` e `addAgent`). Ao ligar, o Hub registra **todos** os agentes publicados
  antes de acordar a agenda do Mastra, porque a agenda apaga, depois de três tiques, o que aponta
  para um agente que não acha (medido no estudo de carga).
- **Conversar com o agente** passa pela mesma porta das seis rotas da 24.1: um controlador "agentes",
  cujo único agente pega, a cada pedido, as instruções, o modelo, as ferramentas e a memória do
  agente registrado que a conversa nomeia (ou do rascunho, na conversa de teste). Nenhuma rota nova
  do Mastra se abre.
- **O cérebro roda no Hub; nenhum código da empresa roda nele.** As ferramentas são as leituras que
  já existem, chamadas pela porta dos conectores, que confere a ligação a cada chamada. O estudo de
  carga mediu 1.000 agentes registrados em cerca de 50 MiB; o registro do Hub passa a dizer, a cada
  minuto, o atraso do laço e o processador, os sinais de quando mudar.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | O agente como dados: as tabelas `builder.agent`, `builder.agent_version` e `builder.agent_tool` (os recortes), as migrações, as permissões e a função das empresas com agentes; as rotas do rascunho, dos recortes, de publicar, das versões, de voltar e de apagar; a remoção com o Projeto, a pessoa e a empresa | `apps/server/src/builder/agents/`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `apps/server/src/hub/identity/` (`admission.ts`), `apps/server/src/builder/conversation/` (`public.ts`), `packages/hub-api/src/`, `scripts/removals.json` | [data](../guides/data.md) | a 24.2 fechada |
| U2 | O agente vivo: o registro (`addAgent` por agente publicado, ao ligar antes da agenda, ao publicar, ao voltar e ao apagar); o `new Agent` de uma versão, com os recortes; o controlador "agentes", a tabela `builder.agent_conversation` e a conversa com o publicado e com o rascunho; a porta das rotas com os dois controladores novos; o atraso do laço e o processador no `HUB_MEMORY` | `apps/server/src/builder/agents/`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `apps/server/src/builder/conversation/` (`public.ts`, `mastra.ts`, `guard.ts`), `apps/server/src/platform/` (`memory.ts`), `apps/server/src/conversations-of.ts`, `packages/hub-api/src/` | [testing](../guides/testing.md) | U1 |
| U3 | Os dados do app: `app_data_read` por um login só de leitura do banco do app | `apps/server/src/platform/` (`company-postgres.ts`), `apps/server/src/hub/apps/`, `apps/server/src/hub/connectors/` (`public.ts`), `apps/server/src/builder/agents/`, `packages/hub-api/src/` (`app-login.ts`, `agents.ts`) | [security](../guides/security.md) | U2 |
| U4 | O Construtor: o terceiro controlador, as instruções dele e as ferramentas que leem o Projeto, criam, mudam e testam o rascunho; as conversas dele no Projeto | `apps/server/src/builder/construtor/`, `apps/server/src/builder/conversation/` (`public.ts`, `mastra.ts`, `guard.ts`, `prompt/builder.md`), `apps/server/src/conversations-of.ts`, `packages/hub-api/src/` (`construtor.ts`) | [code](../guides/code.md) C75 | U2 |
| U5 | As telas: a entrada **Agentes** do Projeto, a conversa com o Construtor e o cartão do rascunho, a lista dos agentes, a página do agente com o painel editável, a conversa de teste, as versões, publicar, voltar e apagar | `apps/web/src/builder/agents/`, `apps/web/src/builder/conversation/`, `apps/web/src/hub/projects/` (`project-rail.tsx`), `apps/web/src/routes/_app/companies/$companyId/projects/`, `docs/reference/screens.md` | [web](../guides/web.md) | U2, U4 |
| U6 | A automação roda um agente: o alvo da automação ganha o agente publicado; o cartão da automação na conversa do agente; apagar o agente leva as automações dele | `apps/server/src/builder/automations/`, `apps/server/src/builder/agents/` (`agent.ts`), `packages/hub-api/src/` (`automations.ts`), `apps/web/src/builder/automations/` | [testing](../guides/testing.md) | U2 |

A U3, a U4 e a U6 andam em paralelo depois da U2. A U3 e a U6 mudam o mesmo arquivo do agente
(`builder/agents/agent.ts`, uma ferramenta cada), num ponto só: a segunda a entrar refaz a fusão. A U4
cria `builder/construtor/` e muda `conversation/` (`mastra.ts`, `guard.ts`), que a U2 deixou. As três
mudam `packages/hub-api/src/` em arquivos diferentes; `failures.ts`, que todas tocam, é o outro ponto
de fusão. A U5 espera a U4, porque o cartão do rascunho é o resultado das ferramentas do Construtor.

**Quando começa** (delivery L1). A U1 começa quando a 24.2 fechar e esta página for aprovada, na
ordem que o firstmate der entre esta etapa e a 13.3 (a Pauta).

**Antes da U1**, nenhuma regra muda. Valem a do `ee`
(https://github.com/developmentconexus-ops/conexus/pull/518: nada do Agent Builder, do editor nem
dos agentes guardados do Mastra) e a `mastra-only-in-builder` (W7): os agentes moram em `builder/`.

**Orçamento de código alterado.** U1: ~1.000. U2: ~800. U3: ~400. U4: ~650. U5: ~950. U6: ~200.
Total: **~4.000**, no teto da regra L2. Testes, gerados e o OpenAPI ficam fora. Hipótese pelos
vizinhos: a U1 da 24.2 (~850, rotas sobre um serviço), a U3 da 24.2 (~950, cartão e duas páginas),
a tabela da conversa da 24.1 (`chosen.ts`, 102 linhas), o login do app da 9 e o controlador do
Assistente (`assistant.ts`, 371 linhas). **A divisão, se passar:** se a U1 e a U2 medirem juntas mais
de 2.000 linhas, a conversa de teste com o rascunho e a lista de versões da U5 saem para uma etapa
24.3.1 logo depois desta, e a página volta ao fundador antes da U5; a visão não é cortada.

## Os critérios de aceite

O aceite da etapa: a Ana pede um agente ao Construtor, recebe ideias, vê o rascunho feito e testado
por ele, muda o modelo e as instruções na página, conversa com o rascunho, publica a versão 1,
publica a 2, volta para a 1, conversa com o publicado e o põe numa automação (critérios 1, 5, 6, 12,
13, 22, 24, 26, 27, 30).

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `POST /api/companies/{c}/projects/{p}/agents` com nome, pela dona ou administradora, responde 201 com o agente em rascunho (`state: DRAFT`, `draft` com os padrões: instruções vazias, `model: null`, memória observacional ligada, nenhuma ligação, nenhum recorte, `web` e `appData` falsos, `revision: 1`); a mesma chave de tentativa com o mesmo corpo devolve o mesmo agente, também ao mesmo tempo; com outro corpo, `IDEMPOTENCY_CONFLICT` | `apps/server/src/builder/agents/routes.test.ts`, "criar" | must |
| 2 | U1 | `PATCH …/agents/{id}/draft` com `revision` igual à da linha grava os campos mandados e devolve o rascunho com `revision + 1`; com `revision` velha, 409 `AGENT_DRAFT_STALE` e nada muda; uma ligação que o Projeto não oferece, um modelo que o seletor não lista, instruções acima de 8.000 caracteres: `REQUEST_MALFORMED` com o campo | `routes.test.ts`, "o rascunho" | must |
| 3 | U1 | `POST …/agents/{id}/tools` cria um recorte do agente: uma ligação do rascunho, uma operação de leitura dessa ligação (`class: 'read'`), os valores fixos válidos pelo esquema da operação, os campos que o modelo preenche e a descrição; uma operação de escrita ou destrutiva, uma ligação fora do rascunho, um valor fixo que o esquema recusa ou um `slug` repetido dão `AGENT_TOOL_REFUSED` com o motivo; `PATCH` e `DELETE` mudam o recorte e sobem o `revision` do rascunho | `routes.test.ts`, "os recortes" | must |
| 4 | U1 | Recusas de todas as rotas: o membro, `NOT_FOUND` (S10, a resposta "3.A"); um Projeto de outra empresa ou apagado, `NOT_FOUND`; um agente de outro Projeto, `AGENT_NOT_FOUND`; nome vazio ou acima de 80, `REQUEST_MALFORMED` | `routes.test.ts`, "as recusas" | must |
| 5 | U1 | `POST …/agents/{id}/publish` com `revision` e `message` grava a versão `n+1` com uma cópia do rascunho e dos recortes e a torna ativa; publicar de novo o mesmo `revision` devolve a mesma versão; um rascunho sem instruções ou com uma ligação que o Projeto perdeu dá `AGENT_DRAFT_INVALID` com o campo; a versão gravada não muda quando o rascunho muda depois | `routes.test.ts`, "publicar" | must |
| 6 | U1 | `GET …/agents/{id}/versions` lista as versões (número, quem publicou, quando, mensagem, qual está ativa); `POST …/agents/{id}/versions/{n}/activate` torna a `n` ativa; uma versão que não existe dá `AGENT_VERSION_NOT_FOUND`; o rascunho não muda ao voltar | `routes.test.ts`, "as versões" | must |
| 7 | U1 | `DELETE …/agents/{id}` responde 204: o agente, as versões e os recortes somem; as conversas com ele somem para todas as pessoas (a linha do Hub e o fio do Mastra), também uma aberta no mesmo instante, nas três ordens (a linha gravada antes da primeira varredura, entre ela e o `delete`, e depois): nenhum fio fica sem a linha; apagar de novo dá `AGENT_NOT_FOUND`; a remoção do Projeto e da empresa leva os agentes antes das conversas; a da pessoa deixa os agentes com `createdBy: null` e as versões com `publishedBy: null` | `apps/server/src/builder/agents/release.test.ts` (as conversas entram com a U2: o teste das três ordens nasce na U2) | must |
| 8 | U1 | As tabelas saem com o Projeto e a empresa, a política da empresa recusa ler o agente de outra empresa, `builder.companies_with_agents()` só é executável por `hub_runtime` e devolve só os ids das empresas com um agente publicado, e o catálogo das permissões fecha (`database-grants.sql`) | `apps/server/src/platform/catalog.test.ts`; `release.test.ts`, "as chaves" | must |
| 9 | U2 | Depois de publicar, `mastra.getAgentById(agentKey(id))` devolve um `Agent` com as instruções, o modelo e as ferramentas da versão ativa; voltar troca o registrado; apagar o tira; um `Agent` de código (`builder`, `assistant`) nunca é trocado | `apps/server/src/builder/agents/registry.test.ts`, "publicar registra" | must |
| 10 | U2 | Ao ligar o Hub, todo agente publicado de toda empresa está registrado antes de `startWorkers`: uma linha da agenda com `agentId` de um agente publicado continua na agenda depois de quatro tiques curtos; sem a carga, ela some (a prova de que a ordem importa) | `registry.test.ts`, "ao ligar" (o Hub de teste com o tique curto) | must |
| 11 | U2 | O registro falhar depois de gravar a versão não perde a versão: o próximo turno que pede o agente o registra pela linha (`AGENT_REGISTERED` com `lazy: true`) | `registry.test.ts`, "o registro atrasado" | must |
| 12 | U2 | `POST …/agents/{id}/conversations` abre uma conversa do controlador "agentes" com o agente publicado; `{ draft: true }` abre a conversa de teste com o rascunho; a conversa nasce com o modelo da versão (ou o da pessoa, com `model: null`), e um modelo sem conta da pessoa dá `MODEL_NO_ACCOUNT`; um agente sem versão publicada e sem `draft` dá `AGENT_NOT_PUBLISHED` | `apps/server/src/builder/agents/conversation.test.ts`, "abrir" | must |
| 13 | U2 | Num turno da conversa com o publicado, o modelo recebe as instruções do Conexus, depois as da versão ativa, e só as ferramentas da versão: cada recorte (`tool_<slug>`), `connector_read` e `connector_notes` sobre as ligações da versão que o Projeto ainda oferece, `web_search` e `web_fetch` só com `web`; nunca `propose_app`, `conexus_overview`, uma ferramenta da máquina ou uma que grava; na conversa de teste, as do rascunho, relidas a cada turno, então uma mudança no painel vale no turno seguinte | `conversation.test.ts`, "as ferramentas" (o modelo dublê da 12 lê a lista e o texto do sistema da chamada) | must |
| 14 | U2 | Um recorte chama a operação pela porta da empresa com os valores fixos por cima do que o modelo mandou (o modelo não troca um valor fixo), contado nas 50 chamadas do turno; uma ligação que o Projeto perdeu responde `NOT_GRANTED` | `conversation.test.ts`, "o recorte" (o dublê do Sankhya da 24.1 grava a entrada que recebeu) | must |
| 15 | U2 | Com a memória observacional desligada na versão, o turno não chama o observador e lembra as últimas 10 mensagens (o padrão do Mastra); ligada, como a 24.1 | `conversation.test.ts`, "a memória" | must |
| 16 | U2 | As seis rotas da porta servem os controladores `agents` e `construtor` com o dono conferido a cada pedido, e continuam seis (`FIXED_LIST`); uma conversa de agente de outra pessoa dá `CONVERSATION_NOT_FOUND` | `apps/server/src/builder/conversation/guard.test.ts`, "os controladores novos" | must |
| 17 | U2 | A linha `HUB_MEMORY` traz `loopDelayP99Ms` e `cpuPercent` do minuto | `apps/server/src/platform/memory.test.ts` | must |
| 18 | U3 | Numa conversa de agente com `appData`, `app_data_read` com um `SELECT` devolve as linhas da tabela do app, cortadas como `connector_read`; o login que a roda é o `app_<projeto>_read`, e a consulta não chama a API do Neon; uma resposta acima de 1 MB volta `APP_DATA_TOO_LARGE` ("A consulta trouxe dados demais. Peça menos linhas.") | `apps/server/src/builder/agents/app-data.test.ts`, "lê" | must |
| 19 | U3 | `app_data_read` com `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `SET ROLE` ou dois comandos juntos é recusado pelo banco, nunca por um filtro de texto nosso: `APP_DATA_REFUSED`, e a tabela não muda; depois de um `SET default_transaction_read_only = off`, de um `set_config(...)` ou de um `SET TRANSACTION READ WRITE` sozinhos, um `DELETE` na chamada seguinte continua recusado; uma tabela fora do esquema do app e o livro das migrações também | `app-data.test.ts`, "não grava" | must |
| 20 | U3 | O login de leitura nasce na primeira chamada de um Projeto de antes da U3 e na criação do app de um novo; repetir não falha; a consulta passa do tempo do app (`APP_CALL_LIMITS`) e volta `APP_DATA_TIMEOUT`; sem app no Projeto, a ferramenta não é oferecida; o banco da empresa fora dá `APP_DATA_UNAVAILABLE` sem derrubar o turno | `app-data.test.ts`, "o login", "o tempo", "sem app" | must |
| 21 | U4 | `POST /api/companies/{c}/projects/{p}/construtor/conversations` abre uma conversa do Construtor da pessoa naquele Projeto; `GET` lista as dela, só daquele Projeto; o membro, `NOT_FOUND` | `apps/server/src/builder/construtor/routes.test.ts` | must |
| 22 | U4 | Num turno do Construtor, o modelo recebe as instruções do Construtor (ler o Projeto, propor ideias antes de construir, criar e testar o rascunho sozinho, nunca publicar) e só as ferramentas `project_read`, `connector_read`, `connector_notes` (sobre as ligações que o Projeto recebeu), `agent_draft`, `agent_set`, `agent_tool_save`, `agent_tool_delete`, `agent_test`, `web_search` e `web_fetch`; nenhuma ferramenta publica nem grava num sistema | `apps/server/src/builder/construtor/construtor.test.ts`, "as ferramentas" | must |
| 23 | U4 | `project_read` devolve o nome do Projeto, as ligações recebidas com as leituras de cada uma, se há app e as tabelas dele (nome e colunas, nunca uma linha), e os agentes do Projeto com o estado | `construtor.test.ts`, "ler o Projeto" | must |
| 24 | U4 | `agent_draft`, `agent_set`, `agent_tool_save` e `agent_tool_delete` gravam pelo mesmo serviço da U1 (as mesmas recusas, como resultado ao modelo, nunca uma exceção) e devolvem o rascunho gravado com `revision`; um passo repetido de `agent_draft` acha o mesmo agente | `construtor.test.ts`, "o rascunho pelo Construtor" | must |
| 25 | U4 | `agent_test` roda uma pergunta contra o rascunho, sem conversa guardada, pela conta de modelo da pessoa, e devolve a resposta e as ferramentas chamadas; um rascunho inválido devolve `AGENT_DRAFT_INVALID` ao modelo | `construtor.test.ts`, "testar" | must |
| 26 | U5 | A entrada **Agentes** do Projeto abre a área: a conversa com o Construtor (e as anteriores) e a lista dos agentes com o estado (**Rascunho**, **Versão n · publicada**, **Rascunho com mudanças**); o cartão do rascunho na conversa mostra nome, o que faz, o que lê e o estado, com **Abrir** e **Publicar** | `apps/web/src/builder/agents/area.test.tsx` | must |
| 27 | U5 | A página do agente mostra as conversas da pessoa com ele, a conversa e o painel com as seções (Instruções, Modelo, Memória, Ligações, Ferramentas, Lê); cada seção grava pelo `PATCH` com o `revision` e, no `AGENT_DRAFT_STALE`, mostra "Outra pessoa ou o Construtor mudou este rascunho. Recarregue."; **Testar rascunho** abre a conversa de teste; **Publicar** pede a mensagem e mostra a versão; **Versões** lista e volta | `apps/web/src/builder/agents/agent-page.test.tsx` | must |
| 28 | U5 | O membro não vê **Agentes**; o endereço de um agente apagado ou de outro Projeto dá a página de não encontrado; **Apagar** pede confirmação com o aviso das conversas e das automações | `agent-page.test.tsx`, "o membro" e "apagar" | must |
| 29 | U5 | As telas novas a 1366 e a 390 px, nos dois temas, sem rolagem lateral (W34 e o QA) | o QA da etapa (testing T25) | must |
| 30 | U6 | Numa conversa com o agente publicado, `propose_automation` sai com `agentId` posto pela ferramenta, nunca pelo modelo; o cartão mostra **Roda: <nome>**; a criação grava o alvo, e `AutomationSummary.agent` o devolve; com o tique curto, a execução abre **uma** conversa do agente do dono, marcada "Automação", com a versão ativa naquele instante, e termina `DONE`; uma linha da 24.2 (a versão 1 do `inputData`) roda o Assistente como antes | `apps/server/src/builder/automations/run.test.ts`, "o agente" e "a linha antiga"; `routes.test.ts`, "o alvo agente" | must |
| 31 | U6 | `POST …/automations` com `agentId` de outro Projeto, de um agente sem versão publicada ou apagado dá `AGENT_NOT_FOUND`; um disparo que chegar a um agente apagado no meio termina `SKIPPED` com `AGENT_GONE`, sem conversa; apagar o agente apaga as automações dele antes das conversas | `run.test.ts`, "o agente apagado"; `apps/server/src/builder/agents/release.test.ts`, "as automações" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A área **Agentes** | a conversa com o Construtor aberta, com "Conte o que você quer que um agente faça. Eu olho o Projeto e trago ideias."; a lista: "Nenhum agente ainda." | o mesmo | a lista e as conversas em esqueleto | `DATABASE_UNAVAILABLE`: a frase com Tentar de novo | o Projeto apagado: a página de não encontrado | o membro não vê a entrada; o endereço dá "não encontrado" (S10) | — |
| O cartão do rascunho (na conversa do Construtor) | o cartão com **Rascunho**, **Abrir** e **Publicar** | — | **Publicar** ocupado | a frase do código; `AGENT_DRAFT_INVALID`: "Falta <campo> para publicar." | o agente apagado: "Este agente foi apagado." sem botões | — | `AGENT_DRAFT_STALE` (o cartão manda o `revision` que mostrou): "O rascunho mudou. Abra o agente para ver." |
| A página do agente | "Ainda não há conversas com este agente." com **Nova conversa** (publicado) e **Testar rascunho** | o mesmo | a página em esqueleto | a frase do código com Tentar de novo | `AGENT_NOT_FOUND`: a página de não encontrado | o membro: não encontrado | `AGENT_DRAFT_STALE`: a frase de recarregar; uma ligação que o Projeto não oferece mais: "O Projeto não oferece mais" ao lado dela, e **Publicar** recusado com o campo |
| Uma seção do painel | os valores do rascunho, cada um editável | ferramentas: "Nenhuma ferramenta. Peça ao Construtor ou crie aqui." | a seção ocupada ao gravar | `AGENT_TOOL_REFUSED`: o motivo ao lado do campo | — | — | `MODEL_NO_ACCOUNT` ao abrir a conversa: a frase da 24.1 com o caminho das contas |
| **Versões** | "Ainda não publicado." | o mesmo | a lista em esqueleto | a frase do código | `AGENT_VERSION_NOT_FOUND`: a lista recarrega | — | — |
| A conversa com o agente (publicada ou de teste) | a caixa com "Pergunte a <nome>…"; a de teste com a faixa "Conversa de teste com o rascunho" | — | como a da 24.1 | como a da 24.1; depois do agente apagado o fio some, e mandar dá `CONVERSATION_NOT_FOUND` da porta | o agente apagado: a página de não encontrado | como a da 24.1 | sem versão publicada, **Nova conversa** não aparece (`AGENT_NOT_PUBLISHED` só por chamada direta) |
| O cartão da automação na conversa do agente | o cartão da 24.2 com **Roda: <nome>** | — | como na 24.2 | `AGENT_NOT_FOUND`: "Este agente foi apagado." | como na 24.2 | — | como na 24.2 |
| Uma linha de Automações | — | — | como na 24.2 | como na 24.2 | como na 24.2 | — | `SKIPPED` com `AGENT_GONE`: "Não rodou: o agente foi apagado." |

**O desenho das telas** (a caixa só fixa onde fica cada peça; o fundador aprova os textos no fim;
sem captura do Conexus OS, que não tinha agentes). A página do agente segue a estrutura da página de
agente do Mastra Studio capturada pelo fundador em 2026-11-01 (`agent-page-config-panel.jpg`): as
conversas à esquerda, a conversa no meio, o painel **Config** à direita, com Ferramentas, Memória e o
texto do sistema; aqui o painel é editável. Só a estrutura e o fluxo, nunca o estilo.

```text
1280 px, a área Agentes                                     390 px, a área Agentes
 ┌──────────────┬──────────────────────────┬─────────────┐  ┌──────────────────────────┐
 │ Vendas      ⌄│ Construtor               │ Agentes     │  │ ☰  Agentes           🔔1 │
 │ Construir    │ [Nova conversa]          │ Conferente  │  │ [Construtor][Agentes]    │
 │ Conversas    │ ideias… cartão:          │  Versão 1 · │  │ ideias… cartão:          │
 │ Agentes      │ ┌──────────────────────┐ │  publicada  │  │ ┌──────────────────────┐ │
 │ Automações   │ │Conferente · Rascunho │ │ Resumo de   │  │ │Conferente · Rascunho │ │
 │ Sobre        │ │Lê: Sankhya · Matriz  │ │  estoque    │  │ │[Abrir] [Publicar]    │ │
 │              │ │[Abrir] [Publicar]    │ │  Rascunho   │  │ └──────────────────────┘ │
 │              │ └──────────────────────┘ │             │  │ [Peça ao Construtor…]    │
 │              │ [Peça ao Construtor…]    │             │  │                          │
 └──────────────┴──────────────────────────┴─────────────┘  └──────────────────────────┘
1280 px, a página de um agente                              390 px, a página de um agente
 ┌────────────┬──────────────────────────┬──────────────┐  ┌──────────────────────────┐
 │ ← Agentes  │ Conferente · Versão 1    │ Configuração │  │ ← Conferente        [⋯]  │
 │ [Nova      │                          │ Instruções ✎ │  │ [Conversas][Configuração]│
 │  conversa] │  (a conversa da 24.1)    │ Modelo     ✎ │  │ [Nova conversa]          │
 │ [Testar    │                          │ Memória    ✎ │  │ [Testar rascunho]        │
 │  rascunho] │                          │ Ligações   ✎ │  │ Quem ficou abaixo… 02/11 │
 │ Quem ficou │                          │ Ferramentas✎ │  │                          │
 │  abaixo…   │ [Pergunte a Conferente…] │ Lê         ✎ │  │                          │
 │            │                          │ [Publicar]   │  │                          │
 │            │                          │ Versões      │  │                          │
 └────────────┴──────────────────────────┴──────────────┘  └──────────────────────────┘
```

A 390 px a área troca as colunas por duas abas (**Construtor** e **Agentes**), e a página do agente
por duas (**Conversas** e **Configuração**); uma conversa aberta ocupa a tela, como as da 24.1;
**Apagar** e **Versões** vão para o menu **⋯**.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| A linha `builder.agent` (o rascunho, `revision`, `active_version`) | U1 (as rotas); U4 (as ferramentas do Construtor, pelo serviço da U1) | U1, U2 (o registro, a conversa de teste), U4 (`project_read`), U5, U6 |
| A linha `builder.agent_version` (`config` congelada) | U1 (publicar) | U2 (`agentOf`), U1 (versões), U6 |
| A linha `builder.agent_tool` (o recorte do rascunho) | U1; U4 (pelo serviço) | U1 (a cópia ao publicar), U2 (a conversa de teste), U5 |
| `AgentConfig` (o rascunho e cada versão) | U1 | U2, U3 (`appData`), U5 |
| `AgentSummary`, `AgentDetail`, `AgentVersionSummary` | U1 | U5; U4 (`ConstrutorResult`) |
| `agentKey(id)` (a chave e o id no Mastra) | U2 | U2 (o registro, o resolvedor) |
| A linha `builder.agent_conversation` (a conversa, de quem é, `draft`) | U2 (abrir) | U2 (o escopo, a lista, a remoção), U6 (a abertura pela execução) |
| As marcas `conexusAgent` e `conexusAgentDraft` do fio | U2 | U2 (a varredura da remoção pela marca, de todas as pessoas) |
| `AgentRun` no `requestContext` | U2 (o escopo da conversa de agente) | U2 (o agente do controlador), U3 (`app_data_read`), U6 (`propose_automation`) |
| `ConstrutorResult` | U4 | U5 (o cartão) |
| `AutomationTarget` (no `inputData`, versão 2) | U6 | U6 |
| O login `app_<projeto>_read` | U3 | U3 |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Criar o agente (`insert` com o id derivado da empresa, da pessoa e da chave de tentativa, `on conflict (id) do nothing`, e reler) | a mesma chave: uma linha; o `body_hash` decide entre o mesmo agente e `IDEMPOTENCY_CONFLICT` | a conferência (papel, Projeto) antes: nada gravado | banco do Hub fora: `DATABASE_UNAVAILABLE` | `AGENT_CREATED` | 1, 4, 24 |
| Mudar o rascunho ou um recorte (`update … set …, revision = revision + 1 where id = $1 and revision = $2`, com a conferência das ligações, da operação e do modelo na mesma transação) | dois com o mesmo `revision`: um grava, o outro acha zero linhas e responde `AGENT_DRAFT_STALE` | uma transação só | `DATABASE_UNAVAILABLE`, nada muda | `AGENT_DRAFT_SAVED` (agente, `revision`, por quem: pessoa ou Construtor) | 2, 3, 24 |
| Publicar (numa transação: reler o rascunho com `revision`, conferir, `insert` da versão `n+1` com `on conflict (agent_id, source_revision) do nothing` e reler, `update agent set active_version`) e depois registrar (U2) | duas do mesmo `revision`: uma versão; de `revision` diferentes: duas, a última ativa | o registro falhar depois do `commit`: a versão fica; o resolvedor registra no próximo turno | banco fora: nada publicado; o registro não é chamado | `AGENT_PUBLISHED` (agente, versão); `AGENT_REGISTER_FAILED` com o código | 5, 9, 11 |
| Voltar a uma versão (`update agent set active_version` e registrar) | duas: a última vence, e o registro relê a linha antes de trocar | como publicar | como publicar | `AGENT_ACTIVATED` | 6, 9 |
| `mastra.addAgent` e `removeAgent` (o registro, só em memória) | `replace` em fila por agente, num processo só (C63) | `removeAgent` antes de `addAgent`, porque `addAgent` ignora a chave repetida em silêncio (`NM:mastra-Da0Czfte.js:1873`); um run em andamento segue com o `Agent` antigo (`removeAgent` não o para, `:2142-2158`) | — | `AGENT_REGISTERED` (agente, versão, `lazy`) | 9, 11 |
| A carga ao ligar (`builder.companies_with_agents()`, depois as versões ativas por empresa, e `addAgent` de cada) antes de `startWorkers` | uma vez por processo | um agente que falha ao montar fica no log e não para os outros; o Hub liga | banco fora ao ligar: o Hub não liga, como `prepare` (`main.ts:214`) | `AGENTS_HYDRATED` (quantos, ms); `AGENT_REGISTER_FAILED` | 10 |
| Abrir a conversa com o agente (a linha `builder.agent_conversation`, depois `createSession` com as marcas e `model.switch`, como a 24.1) | a mesma chave acha a mesma conversa | a linha antes do fio: um corte deixa a linha, e a repetição cria o fio | o agente apagado entre a leitura e a gravação: a chave estrangeira recusa (`23503` → `AGENT_NOT_FOUND`); sem conta: `MODEL_NO_ACCOUNT` antes de gravar | da 24.1 | 12 |
| O turno com o agente (a configuração do registrado ou do rascunho, a cada pedido) | o turno da 24.1 | o agente apagado no meio: a varredura chama `deleteSession`, que aborta o run | banco fora ao ler o rascunho: o turno falha `DATABASE_UNAVAILABLE` | da 24.1 | 13, 14, 15 |
| Apagar o agente, sem trava atravessando chamada de fora (D22): (1) as automações dele (U6) e os fios das conversas dele, de todas as pessoas, pela marca `{ companyId, conexusAgent }`; (2) numa transação curta, o `delete` da linha, que leva versões, recortes e `agent_conversation` por cascata; (3) `removeAgent`; (4) a varredura de (1) de novo | a abertura, depois do `createSession`, relê a sua linha; ausente, apaga o próprio fio e responde `AGENT_NOT_FOUND`; a segunda remoção acha a linha apagada, varre e responde `AGENT_NOT_FOUND` | um corte entre os passos: a linha sai só em (2), e a próxima remoção varre de novo | banco do Mastra fora em (1): para antes da linha, nada perdido | `AGENT_DELETED` (quantas conversas e automações) | 7, 31 |
| A remoção da pessoa (`created_by = null` nos agentes, `published_by = null` nas versões; as conversas dela pela marca da pessoa, como a 24.1) | idempotente | uma transação | como a da 24.1 | nada | 7 |
| A remoção do Projeto e da empresa (as automações, os agentes, depois as conversas; `removeAgent` de cada) | não falha de novo | a ordem da 24.1 | como a da 24.1 | `AGENTS_RELEASED` (quantos) | 7, 8 |
| `agent_test` (um `Agent` montado do rascunho, sem registro, `generate` sem memória) | dois testes, dois `generate` | o modelo falha: a falha como resultado ao Construtor | a conta de modelo fora: `MODEL_*` da 24.1 | `AGENT_TESTED` (agente, ms, ferramentas chamadas) | 25 |
| O login de leitura e `app_data_read` | dois turnos criam, o segundo acha "already exists" e relê | uma transação | Neon fora: `APP_DATA_UNAVAILABLE`; o tempo: `APP_DATA_TIMEOUT` | `APP_READ_LOGIN_CREATED`, `APP_DATA_READ` (nunca o SQL nem as linhas, C50) | 18, 19, 20 |
| Criar a automação com alvo agente e o passo `check` | a da 24.2 | o agente conferido antes | a da 24.2 | `AUTOMATION_CREATED` com `agentId`; `AUTOMATION_PAUSED` com `AGENT_GONE` | 30, 31 |

## A tabela de referência

Referências: Mastra como instalado (`@mastra/core` 1.79.0, `@mastra/memory` 1.39.0, `@mastra/pg`
1.32.0; `NM:` é `node_modules/@mastra/core/dist`); o fonte do Mastra, com o Mastra Code e a Factory,
na estante `mastra-1.79` `4c22623e`, a tag `@mastra/core@1.79.0` (`M:`). O Conexus é lido no `main`
`a2b7f58d`. "Lido" é linha reaberta pelo autor deste cartão; "relay" é de um ajudante dos estudos, e
a unidade a reabre antes de usar. Os estudos: o do Construtor (2026-11-02, a arquitetura, §1.2 a
§3.7), o de onde rodam os agentes (§3, `A1` reconferido) e o de carga (B4).

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O agente como dados com versões | U1 | nada | `AGENTS_SCHEMA` (id, status, `activeVersionId`) e `AGENT_VERSIONS_SCHEMA` (número, instruções, modelo, ferramentas, memória, `changeMessage`) (`M:packages/core/src/storage/constants.ts:224-266`, relay); as rotas de versões listar, criar, ativar (`M:packages/server/src/server/handlers/agent-versions.ts:63,119,259`, relay) | o rascunho e as versões imutáveis, uma ativa | embrulhado: tabelas nossas com a forma do Mastra campo por campo, sob a política da empresa (0039); o `@mastra/editor` fica de fora (o 518; as linhas dele não têm empresa) | o estudo do Construtor §3.1 | `A1` | `builder/agents/tables.ts`, `builder/agents/agents.ts` |
| O recorte (ferramenta preset) | U1, U2 | as leituras do kit com `class` (`packages/connectors/src/kernel/operation.ts:140-154`, lido); `connector_read` pela porta (`builder/connectors/connector-tools.ts:175-215`, lido) | `createTool` (`M:packages/core/src/tools/tool.ts:750`, relay); o editor resolve as ferramentas por id (`M:packages/editor/src/namespaces/agent.ts:1329-1352`, relay) | uma ferramenta registrada que chama o que já existe | nativo: `createTool` cujo `execute` chama `access.read` com os valores fixos por cima | — | "ferramentas específicas por agente" (2026-11-02) | `builder/agents/tools.ts` |
| O `new Agent` de uma versão e o registro | U2 | os agentes de código no construtor do `Mastra` (`builder/conversation/mastra.ts:13-33`, lido) | o editor: `new Agent({ id, … })` e `addAgent(agent, storedAgent.id, { source: 'stored' })` (`M:packages/editor/src/namespaces/agent.ts:1169,1197-1198`), `removeAgent` ao trocar (`:443-446`); `addAgent` (`NM:mastra/index.d.ts:974`), a chave repetida ignorada (`NM:mastra-Da0Czfte.js:1873`), `removeAgent` (`NM:mastra/index.d.ts:1078`; `NM:mastra-Da0Czfte.js:2142-2158`), `getAgentById` (`:1613`) | um `Agent` registrado por agente guardado, trocado ao mudar | nativo | — | `A1`; a B de 2026-11-02 | `builder/agents/registry.ts`, `builder/agents/agent.ts` |
| Registrar antes da agenda | U2 | `prepare`, `createHub` e `start` (`main.ts:214-216`, lido); `startWorkers` (`builder/conversation/public.ts:185-187`, lido) | `isTargetReady` resolve o agente pelo id e apaga depois de 3 faltas (`NM:worker-BgnTmeB6.js:347-356`, `NM:scheduler-3IjINScC.js:9,146-186`); `startWorkers` (`NM:mastra-Da0Czfte.js:5037`) | a agenda só fala com o que está registrado | nativo: a carga antes de `startWorkers` | — | — | — |
| Ler as empresas com agentes ao ligar | U1 | `apps.companies_with_apps()`, a função da 9 para o conserto ao ligar (`database-grants.sql:19-22`, lido) | — | uma função `SECURITY DEFINER` de um papel sem login, executada só por `hub_runtime` | nativo (o padrão da 9) | — | a aprovação desta página (D11) | a migração |
| Conversar com o agente registrado | U2 | o controlador do Assistente: um agente com instruções, modelo e ferramentas em função do `requestContext` (`builder/assistant/assistant.ts:245-313`, lido) | o controlador tem um agente de apoio (`NM:agent-controller/types.d.ts:216`); controladores só no construtor do `Mastra` (`M:packages/core/src/mastra/index.ts:2042-2049`, relay); os campos dinâmicos (`NM:agent/types.d.ts:567,650,659,745`); `getInstructions` (`NM:agent/agent.d.ts:720`), `getModel` (`:910`), `listTools` (`:840`), `getMemory` (`:589`); um modo sem `availableTools` não filtra (`NM:agent-controller-DO6rGsQm.js:8390-8391`) | um controlador "agentes" cujo agente delega, a cada pedido, ao registrado | nativo: a forma (i) do estudo §3.4; a (ii), `agent.stream` direto, abriria rotas fora das seis | — | — | `builder/agents/controller.ts` |
| A memória por agente | U2 | a memória da conversa com a observacional sempre ligada (`builder/conversation/builder.ts:131-172`, lido) | `memory` dinâmico no agente (`NM:agent/types.d.ts:745`); o controlador passa a dele só a um agente sem memória própria (`M:packages/core/src/agent-controller/agent-controller.ts:1622-1625`, relay); `observationalMemory` (`NM:memory/types.d.ts:956`); `lastMessages` 10 por padrão (`node_modules/@mastra/core/dist/agent-tuAMgHe3.js:21615`) e obsoleto (`NM:memory/types.d.ts:870-875`) | a memória escolhida pelo agente | nativo: duas `Memory` no mesmo armazenamento, com e sem a observacional, escolhidas pela versão; nenhum `lastMessages` na tela (obsoleto) | — | "memória editável" (2026-11-02) | — |
| O modelo por agente | U2 | `openConversation` com `model` e `conversationStart` (`builder/assistant/open.ts:111-150`; `builder/model-accounts/defaults.ts:86-111`, lidos) | `session.model.switch` (`open.ts:146`, lido) | o modelo da sessão | nativo: o modelo da versão vira o `model` da abertura; sem conta, `MODEL_NO_ACCOUNT` | — | "modelo por agente" (2026-11-02) | — |
| A porta das rotas | U2, U4 | `FIXED_LIST` e `Params.controllerId` (`builder/conversation/guard.ts:20-41`, lido) | `@mastra/fastify` `registerRoute` com `access: 'session'` (a 14.2) | as rotas dos controladores, parametrizadas pela chave | nativo: o `enum` ganha `agents` e `construtor`; as rotas continuam seis | — | "okay sibre auth" (2026-11-01) | — |
| O atraso do laço e o processador | U2 | `logMemory` (`platform/memory.ts:10-26`, lido) | `monitorEventLoopDelay` e `process.cpuUsage` do Node (o `bench/measure.ts` do estudo de carga) | medir no próprio processo | nativo | — | — | — |
| O Construtor | U4 | o Builder e o Assistente, dois controladores (`builder/conversation/public.ts:131-137`, lido) | o agente aberto que monta workflows e o seu manual (`M:packages/core/src/workflows/builder/agent.ts:13-24`, `authoring-playbook.ts:37-40`, relay); a ferramenta que grava e confere o que voltou (`M:mastracode/sdk/src/tools/workflows/create-workflow.ts:61-120`, relay) | um agente com ferramentas pequenas e validadas, nunca regenerar tudo | nativo: um terceiro controlador no construtor do `Mastra` | — | `C1` | `builder/construtor/construtor.ts`, `builder/construtor/prompt/construtor.md` |
| Testar o rascunho | U4 | — | `Agent.generate` (`NM:agent/agent.d.ts`; a U4 reabre a linha) | o agente montado e chamado uma vez | nativo | — | `C1` | `builder/construtor/test-draft.ts` |
| Os dados do app | U3 | o login do app e o de migração (`packages/hub-api/src/app-login.ts:8-15`, lido); as permissões do esquema (`apps/server/src/platform/company-postgres.ts:148-170`, lido) | Postgres 17: `default_transaction_read_only`, `GRANT SELECT`, `ALTER DEFAULT PRIVILEGES`; a senha derivada (0043) | um login só de leitura, a recusa no banco | nativo | — | — | `builder/agents/app-data.ts` |
| O alvo da automação | U6 | `AutomationInput` versão 1 (`builder/automations/run.ts:37-50`, lido; o comentário diz que a versão deixa um alvo novo entrar); `conversed` abre a conversa (`run.ts:96-142`, lido) | a agenda com alvo agente chama o agente direto (`dist/docs/references/reference-schedules-overview.md:43,57`) | o alvo agente da agenda pula a conversa | nativo: o mesmo workflow da 24.2, que abre a conversa do agente; nunca o alvo agente da agenda, que pularia a conversa marcada (`C1` da 24.2) | — | `A1`, `C1` da 24.2 | — |
| As telas | U5 | a conversa do Assistente no Projeto (`routes/_app/companies/$companyId/projects/$projectId_.assistant.*`); a barra (`hub/projects/project-rail.tsx:111-175`, lido) | a página de agente do Studio: conversas, conversa, painel Config (`agent-page-config-panel.jpg`; `M:packages/playground-ui/.../agent-overview-panel.tsx:134-240`, relay) | estrutura e fluxo | nativo: as peças da 24.1; nenhum estilo do Studio | — | "estrutura e fluxo, nunca o estilo" (2026-11-01) | `apps/web/src/builder/agents/` |

**A medida do transplante.** Nada vem do repositório antigo: ele não tinha agentes de Projeto. Do
cartão anterior deste pull request ficam a U2 dele (os dados do app, agora a U3), a remoção em
passos sem trava e o alvo da automação (agora a U6).

**A dívida.**
- Os agentes não têm teto por Projeto: nenhuma referência ou medida dá um número; a lista lê todos os
  agentes do Projeto. Gatilho: um Projeto com mais de 50 agentes.
- As instruções vão inteiras ao modelo a cada turno, até 8.000 caracteres: o dobro do pedido da
  automação (`AUTOMATION_PROMPT_MAX`), porque o texto do sistema do starter do Mastra que o fundador
  capturou passa de 4.000 (a U1 mede o arquivo `templates/template-starter-agent` na estante e
  grava o número no teste). Gatilho: uma recusa de tamanho no uso.
- Um recorte fixa valores de primeiro nível da entrada da operação. A consulta do Sankhya
  (`consultar`, `packages/connectors/src/sankhya/door.ts:123-131`, lido) só tem `sql`, então um
  recorte dela é uma consulta fixa: "pedidos do cliente X" com o cliente variável espera parâmetros
  no kit ou uma ferramenta em código (24.4). Nunca montar SQL por texto.
- Apagar o agente no meio de um turno aborta o turno. A confirmação avisa.
- O registro é por processo (C63). Gatilho: um segundo processo do Hub.

**Issues futuras** (a abrir no fechamento).
- O id de cada agente nos rastros fica para a 21.1.
- O login de leitura pode tomar travas consultivas da sessão; o HTTP do Neon fecha a sessão a cada
  pedido. Gatilho: o transporte manter conexões.
- Espalhar as automações das 7h por alguns minutos (o estudo de carga, B4: a agenda dispara até 600
  por minuto). Gatilho: mais de 100 disparos no mesmo minuto.

## U1 O agente como dados

**Base e modelo.** `main` depois do fechamento da 24.2. Opus: três tabelas novas com a palavra D11,
a concorrência do rascunho e a remoção.

### As linhas da tabela

- **O modelo de tabela.** `builder.assistant_conversation` (`apps/server/src/builder/assistant/tables.ts:14`,
  lido): tabela de `builder`, só o Hub escreve, chaves estrangeiras com a empresa e o Projeto. Cumpre
  C21, C23 e C26. A política é a da empresa, sem pessoa, como `OWN_COMPANY` de
  `hub/projects/tables.ts:23,56` (lido); nunca a regra por pessoa das conversas.
- **A forma do Mastra.** `AGENT_VERSIONS_SCHEMA` (`M:packages/core/src/storage/constants.ts:236-266`,
  relay): os campos que esta etapa usa (instruções, modelo, ferramentas, memória, `changeMessage`);
  os outros (scorers, processors, skills, workspace) não entram até um consumidor (D18).
- **A função ao ligar.** `apps.companies_with_apps()` (`database-grants.sql:19-22`, lido) e a sua
  migração da 9: o mesmo desenho, `builder.companies_with_agents()`, de um papel sem login que lê só
  `company_id` e `active_version` de `builder.agent`.
- **A remoção.** `builder/automations/release.ts` (66 linhas, relay) e `releaseOf`
  (`builder/conversation/public.ts:83-104`, lido): os agentes saem depois das automações e antes das
  conversas.
- **A admissão.** `hub/identity/admission.ts:71-74` (lido): `manageConnections` trava; `askAssistant`
  não.
- **A operação do kit.** `Operation` (`packages/connectors/src/kernel/operation.ts:140-154`, lido):
  `id`, `class` e `input` (Zod), que conferem o recorte.

### O raio da mudança

Nada sai do `main`.

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/agents/` | Cria `tables.ts`, `agents.ts` (o serviço: criar, ler, listar, mudar o rascunho, os recortes, publicar, versões, ativar, apagar), `routes.ts`, `release.ts`, `public.ts` | a U2, a U4, a U6 |
| `apps/server/migrations/` | Cria `<data>_e243_agents` (as três tabelas) e, num commit próprio, `<data>_e243_agents_grants` (as permissões e a função) (D11) | `npm run check-migrations` |
| `apps/server/database-grants.sql` | Muda: `hub_company` com `SELECT, INSERT, UPDATE, DELETE` em `builder.agent` e `builder.agent_tool`, `SELECT, INSERT, DELETE` e `UPDATE(published_by)` em `builder.agent_version`; a função e o seu papel sem login; `EXECUTE` só a `hub_runtime` | `catalog.test.ts` |
| `apps/server/src/hub/identity/admission.ts` | Muda: as ações `manageAgents` e `publishAgent`, as duas com `MANAGE_CONNECTIONS` e trava nas gravações, como `manageConnections` (a etapa de papéis troca a declaração de `publishAgent`) | `builder/agents/` |
| `apps/server/src/builder/conversation/public.ts` | Muda `releaseOf`: `agents.release` depois das automações e antes das conversas | as remoções |
| `packages/hub-api/src/agents.ts` | Cria os contratos abaixo; muda `index.ts`, `failures.ts` (os códigos e as frases), o OpenAPI gerado | a U2, a U4, a U5, a U6 |
| `scripts/removals.json` | Muda: as proteções novas (o membro recusado, o agente de outro Projeto, o `revision` velho, a operação de escrita num recorte), cada uma com o teste que a pega | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/agents.ts
const BASE = '/api/companies/{companyId}/projects/{projectId}/agents'
// GET    BASE                                      -> { agents: AgentSummary[] }        acesso manageAgents
// POST   BASE  CreateAgent, attemptKey: true       -> 201 { agent: AgentDetail }
// GET    BASE/{agentId}                            -> { agent: AgentDetail }
// PATCH  BASE/{agentId}/draft  DraftPatch          -> { agent: AgentDetail }            AGENT_DRAFT_STALE (409), REQUEST_MALFORMED
// POST   BASE/{agentId}/tools  ToolInput           -> 201 { agent: AgentDetail }        AGENT_TOOL_REFUSED, AGENT_DRAFT_STALE
// PATCH  BASE/{agentId}/tools/{toolId}  ToolPatch  -> { agent: AgentDetail }
// DELETE BASE/{agentId}/tools/{toolId}?revision=   -> { agent: AgentDetail }
// POST   BASE/{agentId}/publish  Publish           -> { agent: AgentDetail, version: AgentVersionSummary }   acesso publishAgent; AGENT_DRAFT_INVALID, AGENT_DRAFT_STALE
// GET    BASE/{agentId}/versions                   -> { versions: AgentVersionSummary[] }
// POST   BASE/{agentId}/versions/{number}/activate -> { agent: AgentDetail }           acesso publishAgent; AGENT_VERSION_NOT_FOUND
// DELETE BASE/{agentId}                            -> 204
// falhas de todas: NOT_FOUND, SESSION_REQUIRED, DATABASE_UNAVAILABLE, AGENT_NOT_FOUND
export const AGENT_NAME_MAX = 80                   // o da automação: a mesma linha nas listas
export const AGENT_INSTRUCTIONS_MAX = 8000         // a dívida
export const AGENT_TOOLS_MAX = 20                  // hipótese: a U1 conta as leituras do kit do Sankhya; acima de 20, o número volta ao cartão
export const AgentId = z.uuid().brand('AgentId')            // conferido em agents.ts pela empresa e o Projeto (C23)
export const AgentToolId = z.uuid().brand('AgentToolId')    // conferido pelo agente
export const ToolSlug = z.string().regex(/^[a-z][a-z0-9_]{0,39}$/)   // o nome que o modelo vê: `tool_<slug>`
export const AgentMemory = z.object({ observational: z.boolean() })
export const AgentConfig = z.object({
  name: z.string().trim().min(1).max(AGENT_NAME_MAX),
  description: z.string().trim().max(280),                     // as duas linhas do cartão e da lista
  instructions: z.string().max(AGENT_INSTRUCTIONS_MAX),        // vazio só no rascunho; publicar exige (AGENT_DRAFT_INVALID)
  model: ModelId.nullable(),                                   // null: o modelo de quem conversa
  memory: AgentMemory,
  connections: z.array(ConnectionId).max(CONNECTIONS_MAX),     // um subconjunto das ligações do Projeto; CONNECTIONS_MAX sai de automations.ts para um dono só (C26)
  web: z.boolean(), appData: z.boolean(),
})
export const AgentToolConfig = z.object({
  slug: ToolSlug, description: z.string().trim().min(1).max(500),
  connectionId: ConnectionId, operation: z.string(),           // uma leitura do kit (class 'read'), conferida no serviço
  bound: z.record(z.string(), z.unknown()),                    // os valores fixos, conferidos pelo esquema da operação
  open: z.array(z.string()).max(20),                           // os campos de primeiro nível que o modelo preenche
})
export const CreateAgent = z.object({ name: AgentConfig.shape.name, description: AgentConfig.shape.description.optional() })
export const DraftPatch = AgentConfig.partial().extend({ revision: z.int().positive() })
export const ToolInput = AgentToolConfig.extend({ revision: z.int().positive() })
export const ToolPatch = AgentToolConfig.partial().extend({ revision: z.int().positive() })
export const Publish = z.object({ revision: z.int().positive(), message: z.string().trim().max(280) })
export const AgentState = z.discriminatedUnion('kind', [                                  // C21
  z.object({ kind: z.literal('DRAFT') }),                                                  // nunca publicado
  z.object({ kind: z.literal('PUBLISHED'), version: z.int(), changed: z.boolean() }),     // changed: o rascunho difere da ativa
])
export const AgentSummary = z.object({ id: AgentId, projectId: ProjectId, name: z.string(), description: z.string(), state: AgentState, updatedAt: z.iso.datetime() })
export const AgentDetail = AgentSummary.extend({
  draft: AgentConfig, revision: z.int(), tools: z.array(AgentToolConfig.extend({ id: AgentToolId })),
  offered: z.array(z.object({ connectionId: ConnectionId, connector: z.string(), name: z.string(), reads: z.array(z.object({ operation: z.string(), summary: z.string() })) })),
  createdBy: z.object({ personId: PersonId, name: z.string() }).nullable(),
})
export const AgentVersionSummary = z.object({ number: z.int(), message: z.string(), active: z.boolean(), publishedAt: z.iso.datetime(), publishedBy: z.object({ personId: PersonId, name: z.string() }).nullable() })
```

```ts
// apps/server/src/builder/agents/tables.ts (a política da empresa em todas, como OWN_COMPANY)
// builder.agent: id uuid pk; company_id -> companies (cascade); project_id -> projects (cascade);
//   draft jsonb not null (AgentConfig); revision int not null default 1; active_version int null;
//   created_by text null, sem chave estrangeira (D17); body_hash text not null; created_at, updated_at
// builder.agent_tool: id uuid pk; agent_id -> builder.agent (cascade); company_id; config jsonb not null
//   (AgentToolConfig); unique (agent_id, (config->>'slug'))
// builder.agent_version: agent_id -> builder.agent (cascade); number int; company_id; config jsonb not null
//   (AgentConfig & { tools: AgentToolConfig[] }); source_revision int not null; message text not null;
//   published_by text null; published_at; primary key (agent_id, number); unique (agent_id, source_revision)
// apps/server/src/builder/agents/public.ts
export type FrozenVersion = AgentConfig & { tools: readonly AgentToolConfig[]; version: number | 'DRAFT' }
export type AgentEvent =
  | { kind: 'ACTIVATED'; companyId: CompanyId; agentId: AgentId; version: number }   // publicar e voltar
  | { kind: 'DELETED'; companyId: CompanyId; agentId: AgentId }
export type Agents = {
  routes: (app: FastifyInstance) => void
  service: AgentService                                   // o que a U4 chama, com as mesmas recusas
  activeOf: (scope: OfProject, agentId: AgentId) => Promise<FrozenVersion | null>   // a U2 e a U6
  draftOf: (scope: OfProject, agentId: AgentId) => Promise<FrozenVersion>          // a conversa de teste e agent_test
  publishedAll: () => Promise<readonly (FrozenVersion & OfProject & { agentId: AgentId })[]>   // a carga ao ligar
  release: (scope: { companyId: CompanyId; projectId?: ProjectId; personId?: PersonId }) => Promise<number>
  onChange: (hook: (event: AgentEvent) => Promise<void>) => void   // a U2 (o registro) e a U6 (as automações)
}
```

O serviço confere numa transação só, com a admissão (S8): as ligações do rascunho contra as que o
Projeto oferece agora (`connectors.connections(scope)`); a operação de um recorte contra as leituras
da ligação e a classe pela definição do kit; `bound` pelo esquema da operação (`input.partial()`); o
modelo por `isChoosable`. Uma ligação que o Projeto perdeu depois fica no rascunho e recusa só
publicar (`AGENT_DRAFT_INVALID`), para a página marcá-la. Publicar copia o rascunho e os recortes do
mesmo `revision` para `config`; `state.changed` compara o `revision` do rascunho com o
`source_revision` da ativa.

### As skills e a leitura

`mastra` (a forma das versões), `fastify-best-practices`, `pstack:tdd`; as linhas de
`docs/reference/stack.md` para `apps/server/src/builder/` e `apps/server/migrations/`.
[data](../guides/data.md) D11, D17, D18, D22; [testing](../guides/testing.md) T5, T12.

### A ordem do trabalho

1. **A prova primeiro.** `routes.test.ts`, "publicar": cria, muda o rascunho, publica, muda de novo,
   lê a versão 1 igual; falha hoje.
2. A migração das tabelas; num commit próprio, a das permissões, da função e `database-grants.sql`
   (D11). `npm run check-migrations`.
3. `agents.ts` e `routes.ts`, com o `revision`; os contratos do `hub-api` e o OpenAPI. Regras: C21,
   C23, C26, C27, S8, S10.
4. `release.ts`, `onChange` e a ordem em `releaseOf`. Regras: D17, D22, T12.

### Como se prova

Cada critério da U1 pelo teste da sua linha, pelo servidor de teste e o Postgres de teste com os
dois bancos. O teste que falha hoje: "publicar". Comando: os testes tocados, `npm run typecheck`,
`npm run lint`, `npm run check-migrations`.

### Parar se

- Conferir `bound` pelo esquema da operação pede o kit dentro de `builder/` de um jeito que a regra
  das pastas recusa: relata o caminho que a porta dos conectores oferece.
- A função ao ligar precisa ler mais que `company_id` e `active_version`: para; a palavra D11 é
  dessa forma.

## U2 O agente vivo

**Base e modelo.** `main` depois da U1. Opus: o registro, a ordem ao ligar e o controlador que
delega cruzam quatro módulos.

### As linhas da tabela

- **O editor do Mastra**, a forma a seguir: `M:packages/editor/src/namespaces/agent.ts:1169-1199`
  (`new Agent`, `addAgent` com `source: 'stored'`, só se não houver agente de código com o id) e
  `:438-446` (`removeAgent` ao trocar). Escrito por nós sobre o core aberto; o editor não é
  instalado.
- **O controlador do Assistente**, o modelo do controlador "agentes": `assistant.ts:245-371` (lido):
  `BUILTIN_TOOLS` desligadas, `yolo: true` (0053), a memória, `accountPick` e os processadores. O
  modo dos agentes **não** lista `availableTools`: a lista fechada é a da versão, que só o nosso
  código monta (`NM:agent-controller-DO6rGsQm.js:8390-8391`).
- **O escopo por pedido.** `sessionScopes` e `SESSION_MARK` (`builder/assistant/context.ts:13-19,60-85`,
  lido em parte): a conversa de agente tem o seu par, com `agentId` e `draft`.
- **A abertura.** `openConversation` (`open.ts:111-150`, lido): a abertura do agente repete a forma
  (a linha do Hub, `createSession` com as marcas, `model.switch` só num fio novo) com o modelo da
  versão.
- **A ordem ao ligar.** `main.ts:214-216` (lido) e `start` (`builder/conversation/public.ts:185-187`,
  lido): a carga entra em `start`, antes de `startWorkers`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/agents/` | Cria `agent.ts` (`agentOf`: o `Agent` de uma versão), `tools.ts` (os recortes), `registry.ts`, `controller.ts` (o controlador "agentes" e o seu agente que delega), `open.ts`, `conversation-routes.ts`; muda `tables.ts` (`builder.agent_conversation`) | `conversation/public.ts`, a U3, a U6 |
| `apps/server/migrations/`, `apps/server/database-grants.sql` | Cria a tabela `builder.agent_conversation` (id, empresa, pessoa, agente com `on delete cascade`, `draft`); as permissões num commit próprio (D11) | `catalog.test.ts` |
| `apps/server/src/builder/conversation/` | Muda `mastra.ts` (o controlador novo), `public.ts` (o `AgentsPart` ao lado do `AssistantPart`; `start` chama `agents.hydrate()` antes de `startWorkers`; a remoção), `guard.ts` (`Params.controllerId` com `agents`; o dono de cada controlador) | `main.ts` |
| `apps/server/src/conversations-of.ts` | Muda: monta os agentes | `main.ts` |
| `apps/server/src/platform/memory.ts` | Muda: `loopDelayP99Ms` e `cpuPercent` na linha | — |
| `packages/hub-api/src/agents.ts` | Muda: `AGENTS_CONTROLLER = 'agents'`, as rotas da conversa, `AgentConversationSummary` | a U5 |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/agents.ts (U2)
export const AGENTS_CONTROLLER = 'agents'
// POST BASE/{agentId}/conversations { draft?: boolean }, attemptKey: true -> 201 { conversation: AgentConversationSummary }
//      falhas: AGENT_NOT_FOUND, AGENT_NOT_PUBLISHED, MODEL_NO_ACCOUNT, MODEL_UNKNOWN
// GET  BASE/{agentId}/conversations -> { conversations: AgentConversationSummary[] }   só as da pessoa
export const AgentConversationSummary = z.object({ id: ConversationId, agentId: AgentId, draft: z.boolean(), title: z.string(), updatedAt: z.iso.datetime() })
// apps/server/src/builder/agents/agent.ts
/** A chave e o id no Mastra: nunca colide com `builder`, `assistant`, `agents` nem `construtor`. */
export function agentKey(id: AgentId): `agent-${string}`
export function agentOf(deps: AgentDeps, frozen: FrozenVersion & OfProject & { agentId: AgentId }): Agent
// apps/server/src/builder/agents/registry.ts
export type Registry = {
  hydrate(): Promise<{ count: number }>              // antes de startWorkers; nunca lança por um agente só
  replace(agentId: AgentId, companyId: CompanyId): Promise<void>   // relê a ativa; removeAgent e addAgent; em fila por agente
  remove(agentId: AgentId): void
  resolve(run: AgentRun): Promise<Agent>             // o registrado (registra se faltar: `lazy`), ou o do rascunho, montado por turno
}
/** O que a conversa roda, no requestContext (C21). */
export type AgentRun =
  | { kind: 'PUBLISHED'; scope: OfProject & { personId: PersonId }; agentId: AgentId }
  | { kind: 'DRAFT'; scope: OfProject & { personId: PersonId }; agentId: AgentId }
```

O agente do controlador: `instructions`, `model`, `tools` e `memory` são funções do
`requestContext` que chamam `registry.resolve(run)` (uma vez por pedido, guardado por
`RequestContext` como `offeredFor` em `assistant.ts:227-240`) e devolvem `getInstructions`,
`getModel`, `listTools` e `getMemory` do resolvido. As instruções de `agentOf` são a mensagem fixa do
Conexus (o mesmo `conexus.md` da 24.1), o bloco da conversa (empresa, pessoa, data, Projeto,
ligações) e as instruções da versão, com uma frase fixa: o agente só lê e diz isso quando pedirem
para gravar. As ferramentas de `agentOf`: os recortes (`tool_<slug>`), `connectorTools` sobre as
ligações da versão que o Projeto ainda oferece, com `noteSave: false` e sem `savedAt` (sem máquina),
e `toolsOf(model)` só com `web`. A memória: a `conversationMemory` da 24.1, com a observacional, ou
uma `new Memory({ storage })` sem ela, as duas criadas uma vez.

### As skills e a leitura

`mastra` (o registro, o controlador e a agenda na versão instalada), `pstack:tdd`, `node`
(`perf_hooks`). [testing](../guides/testing.md) T5, T12, T26; [code](../guides/code.md) C63.

### A ordem do trabalho

1. **A prova primeiro.** `registry.test.ts`, "ao ligar": publica um agente, cria uma linha da agenda
   com o `agentId` dele, reinicia o Hub de teste e conta a linha depois de quatro tiques; falha hoje.
2. `agent.ts`, `tools.ts`, `registry.ts`; o `onChange` da U1 chama `replace` e `remove`.
3. `controller.ts`, `open.ts`, as rotas; a migração da `agent_conversation`; a porta; o teste das
   três ordens de `release.test.ts` (critério 7). Regras: C21, C26, S10, S39.
4. A carga em `start`; `HUB_MEMORY`.

### Como se prova

O Hub de teste com o tique curto e o modelo dublê da 12; o dublê do Sankhya da 24.1. O teste que
falha hoje: "ao ligar". Comando: os testes tocados, `npm run typecheck`, `npm run lint`,
`npm run check-migrations`.

### Parar se

- O controlador não passa ao agente que delega a memória escolhida pela versão (o fio lido por uma
  `Memory` e gravado por outra): para e relata com o teste "a memória"; a saída é uma memória só por
  controlador e a escolha por chamada (`AgentMemoryOption.options`, `NM:agent/types.d.ts:969-974`).
- `getModel` do registrado não leva a conta da pessoa (o `accountPick` precisa da sessão do
  controlador): o modelo fica na sessão (`model.switch`), e o agente registrado guarda só o id;
  relata.
- A carga de 1.000 agentes passa de 1 s no Hub de teste (o estudo mediu 230 ms): relata o número.

## U3 Os dados do app

**Base e modelo.** `main` depois da U2. Sonnet: um login e uma ferramenta, sobre o login do app da
9, com a regra de segurança escrita aqui.

### As linhas da tabela

- `appLogin` e `appLoginPassword` (`packages/hub-api/src/app-login.ts:8-36`, lido; decisão 0043).
- `schemaStatements` e `ensureApp` (`apps/server/src/platform/company-postgres.ts:148-187`, lido).
- `neonTransport` e `asLogin` (`company-postgres.ts:65-118`, relay); o endereço do login sem a API do
  Neon, como o edge (`apps/edge/src/db.ts:35-60`), com o `host` de `readyDatabaseOf` e
  `COMPANY_DATABASE` (`hub/apps/handoff.ts:271-282`). `openAppDatabase`
  (`hub/apps/app-database.ts:24-55`) chama a API do Neon, então só cria o login que falta.
- O corte: `CUT_ROWS` e `CUT_BYTES` (`hub/connectors/cut.ts:4-6`), exportados por
  `hub/connectors/public.ts`, nunca copiados (C26).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/app-login.ts` | Muda: `readLogin: app_<projeto>_read` | `company-postgres.ts` |
| `apps/server/src/platform/company-postgres.ts` | Muda: `ensureApp` cria os três logins; o de leitura só com `USAGE` e `SELECT` (sem o livro das migrações), `default_transaction_read_only = on` e os tempos do app; a porta ganha `readApp` (cada consulta em `sql.transaction([…], { readOnly: true })`) e `ensureReadLogin`, recebendo o endereço, nunca a empresa (C7) | `hub/apps/` |
| `apps/server/src/hub/apps/` | Muda `app-database.ts` e `public.ts`: `readAppData` | `builder/agents/app-data.ts` |
| `apps/server/src/hub/connectors/public.ts` | Muda: exporta `CUT_ROWS` e `CUT_BYTES` | `builder/agents/app-data.ts` |
| `apps/server/src/builder/agents/` | Cria `app-data.ts`; muda `agent.ts` (a ferramenta com `appData` e app no Projeto) | — |
| `packages/hub-api/src/agents.ts` | Muda: `AGENT_TOOL.appDataRead = 'app_data_read'` | a web (a linha "Lendo dados do app") |

### Os contratos que a unidade cria

```ts
// apps/server/src/platform/company-postgres.ts (porta CompanyPostgres)
readApp(read: DatabaseUrl, sql: string, signal: AbortSignal): Promise<AppRead>
ensureReadLogin(owner: DatabaseUrl, projectId: ProjectId): Promise<SqlAnswer>
// apps/server/src/hub/apps/public.ts
readAppData(input: { scope: SessionScope; projectId: ProjectId; sql: string; signal: AbortSignal }): Promise<AppRead>
export type AppRead =
  | { kind: 'ROWS'; columns: readonly string[]; rows: readonly unknown[][] }
  | { kind: 'REFUSED'; code: 'APP_DATA_REFUSED' }     // 25006, 42501, 42601
  | { kind: 'FAILED'; code: 'APP_DATA_UNAVAILABLE' | 'APP_DATA_TIMEOUT' | 'APP_DATA_NO_APP' | 'APP_DATA_TOO_LARGE' }   // TOO_LARGE: acima de REPLY_CAP_BYTES, 1 MB (company-postgres.ts:49-58), C59
// apps/server/src/builder/agents/app-data.ts
export const AppDataInput = z.object({ sql: z.string().trim().min(1).max(4000) })
```

A barreira é a permissão: o login só tem `SELECT`; a transação de leitura e o padrão do login são
profundidade. O SQL e as linhas nunca vão ao registro do processo (C50).

### As skills e a leitura

`node`, `pstack:tdd`; o PostgreSQL 17 para `ALTER ROLE … SET`, `ALTER DEFAULT PRIVILEGES` e `GRANT`.
[security](../guides/security.md).

### A ordem do trabalho

1. **A prova primeiro.** `app-data.test.ts`, "não grava": um `DELETE` pela ferramenta e a tabela
   inteira depois; falha hoje.
2. `readLogin`; os três logins em `ensureApp`; as permissões do de leitura.
3. `ensureReadLogin`, `readApp`, `readAppData`.
4. `app-data.ts` em `agentOf`.

### Como se prova

O Postgres de teste no lugar do Neon pela porta `CompanyPostgres`; cada recusa do critério 19 é uma
consulta e a releitura da tabela. Comando: os testes tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- Um comando de escrita passa pelo login de leitura em qualquer forma: para.
- `SELECT 1; SELECT 2` por `readApp` volta um código diferente de 42601: relata o código e ajusta a
  frase do critério, nunca um filtro.
- O transporte não aceita `readOnly` na transação: relata; a permissão continua a barreira.
- O login de leitura pede uma permissão que o dono do banco não pode dar sem a palavra D11: para.

## U4 O Construtor

**Base e modelo.** `main` depois da U2. Sonnet: um controlador com a forma dos dois que existem e
ferramentas sobre o serviço da U1.

### As linhas da tabela

- **O controlador.** O do Assistente (`assistant.ts:333-344`, lido): um modo, a lista fechada de
  ferramentas, `BUILTIN_TOOLS` desligadas, `yolo: true` (`C1`: o rascunho sem perguntar; nenhuma
  ferramenta publica). Sem máquina nesta etapa.
- **O manual.** O do agente de workflows do Mastra (`M:packages/core/src/workflows/builder/agent.ts:13-24`,
  `authoring-playbook.ts:37-40`, relay): ler o que existe, propor, montar por operações pequenas,
  conferir o que voltou. Escrito por nós, em português, em `prompt/construtor.md`.
- **Conferir o que voltou.** `create-workflow` do Mastra Code
  (`M:mastracode/sdk/src/tools/workflows/create-workflow.ts:61-120`, relay).
- **As conversas.** As do Assistente, listadas pela marca (`builder/assistant/routes.ts:173-200`,
  lido em parte), com o dono `construtor:company:<c>:person:<p>` e a marca do Projeto; nenhuma
  tabela do Hub (o Construtor não escolhe ligações: vê as que o Projeto recebeu).
- **A #540.** A linha do texto do Builder que diz que os conectores "vêm depois"
  (`builder/conversation/prompt/builder.md`), corrigida.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/construtor/` | Cria `construtor.ts` (o agente e o controlador), `tools.ts`, `test-draft.ts`, `open.ts`, `routes.ts`, `prompt/construtor.md` | `conversation/public.ts` |
| `apps/server/src/builder/conversation/` | Muda `public.ts` e `mastra.ts` (o terceiro controlador), `guard.ts` (`construtor` no `enum` e o seu dono), `prompt/builder.md` (a #540) | — |
| `apps/server/src/conversations-of.ts` | Muda: monta o Construtor com o serviço dos agentes | — |
| `packages/hub-api/src/construtor.ts` | Cria: `CONSTRUTOR_CONTROLLER = 'construtor'`, `CONSTRUTOR_TOOL`, as rotas, `ConstrutorResult` | a U5 |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/construtor.ts
export const CONSTRUTOR_CONTROLLER = 'construtor'
export const CONSTRUTOR_TOOL = {
  projectRead: 'project_read', agentDraft: 'agent_draft', agentSet: 'agent_set',
  agentToolSave: 'agent_tool_save', agentToolDelete: 'agent_tool_delete', agentTest: 'agent_test',
} as const
// POST /api/companies/{c}/projects/{p}/construtor/conversations, attemptKey: true -> 201 { conversation }   acesso manageAgents
// GET  /api/companies/{c}/projects/{p}/construtor/conversations -> { conversations }
/** O que agent_draft, agent_set e as dos recortes devolvem: o rascunho gravado, ou a recusa (C21). */
export const ConstrutorResult = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('SAVED'), agent: AgentDetail }),
  z.object({ kind: z.literal('REFUSED'), code: FailureCode, field: z.string().optional() }),
])
// agent_draft:       { name, description }                 -> ConstrutorResult  (cria pelo serviço; a chave de tentativa sai do toolCallId)
// agent_set:         DraftPatch & { agentId }              -> ConstrutorResult
// agent_tool_save:   ToolInput & { agentId, toolId? }      -> ConstrutorResult
// agent_tool_delete: { agentId, toolId, revision }         -> ConstrutorResult
// agent_test:        { agentId, question: string(1..2000) } -> { kind: 'ANSWERED', text, tools: string[] } | { kind: 'REFUSED', code }
// project_read:      {}                                    -> { project, offered, app: { tables } | null, agents: AgentSummary[] }
```

Toda ferramenta recebe a pessoa e o Projeto do escopo da conversa, nunca do modelo (C23), e um
`agentId` de outro Projeto volta `AGENT_NOT_FOUND`.

### As skills e a leitura

`mastra` (o controlador, `Agent.generate`), `pstack:tdd`. [code](../guides/code.md) C75.

### A ordem do trabalho

1. **A prova primeiro.** `construtor.test.ts`, "o rascunho pelo Construtor": o modelo dublê chama
   `agent_draft` e `agent_set`; a rota da U1 lê o rascunho; falha hoje.
2. `construtor.ts` e o controlador; `guard.ts`.
3. `tools.ts` e `test-draft.ts` sobre `agents.service` e `agentOf` com `draftOf`.
4. `prompt/construtor.md` (ideias antes de construir; recortes estreitos; testar; nunca publicar,
   dizer à pessoa para tocar **Publicar**); a #540.

### Como se prova

O modelo dublê da 12 com as chamadas de ferramenta roteirizadas; o dublê do Sankhya da 24.1.
Comando: os testes tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- `agent_test` precisa de uma sessão do controlador para pegar a conta de modelo: relata; a saída é
  abrir uma conversa de teste da U2 e mandar a pergunta nela.
- O Construtor precisa de uma ferramenta que grava num sistema da empresa: para; é a 24.5.

## U5 As telas

**Base e modelo.** `main` depois da U4. Sonnet: telas sobre contratos prontos.

### As linhas da tabela

- A barra do Projeto (`apps/web/src/hub/projects/project-rail.tsx:111-175`, lido): **Agentes** entra
  depois de **Conversas**, escondida do membro como **Automações** (`role !== 'member'`).
- As conversas da 24.1 (`apps/web/src/builder/assistant/`, `apps/web/src/builder/conversation/`) e o
  registro das ferramentas (`tool-registry.ts`, `tool-spec.ts`, relay): o cartão do rascunho é o
  desenho do `ConstrutorResult` de `agent_draft` e `agent_set`.
- A página de agente do Studio, só a estrutura (a captura; `agent-overview-panel.tsx:134-240`, relay).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/agents/` | Cria `area.tsx`, `agent-page.tsx`, `config-panel.tsx` (as seções), `tool-form.tsx`, `versions.tsx`, `draft-card.tsx`, `queries.ts`, `text.ts` | as rotas |
| `apps/web/src/builder/conversation/` | Muda o registro das ferramentas: o cartão do rascunho e as linhas de `tool_<slug>` e `app_data_read` | — |
| `apps/web/src/hub/projects/project-rail.tsx` | Muda: a entrada | — |
| `apps/web/src/routes/_app/companies/$companyId/projects/` | Cria `$projectId_.agents.index.tsx`, `$projectId_.agents.construtor.$conversationId.tsx`, `$projectId_.agents.$agentId.tsx`, `$projectId_.agents.$agentId.$conversationId.tsx` | — |
| `docs/reference/screens.md` | Muda: as telas novas | — |

### Os contratos que a unidade cria

Nenhum contrato novo do servidor. Na web: `agentQuery`, `agentsQuery`, `versionsQuery` em
`queries.ts`; o `revision` lido vai em toda gravação, e `AGENT_DRAFT_STALE` invalida `agentQuery`.

### As skills e a leitura

`shadcn`, `impeccable`, `pstack:tdd`; as linhas de `docs/reference/stack.md` para `apps/web/src/`.
[web](../guides/web.md) W7, W30, W31, W34; [design](../guides/design.md) e
[Impeccable](../reference/impeccable.md).

### A ordem do trabalho

1. **A prova primeiro.** `agent-page.test.tsx`: muda o modelo no painel, recebe `AGENT_DRAFT_STALE`
   do servidor dublê e mostra a frase; falha hoje.
2. A área e a entrada; o cartão do rascunho.
3. A página, o painel, os recortes, as versões, publicar e voltar, apagar.
4. `docs/reference/screens.md`. Regras: W7, W30, W34, C21.

### Como se prova

Os testes de `apps/web` com o servidor dublê de cada tela; o QA da etapa para larguras e temas.
Comando: os testes tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- A conversa com o agente não cabe nas peças da conversa da 24.1 sem uma segunda conversa: para; a
  página reusa a conversa, nunca a copia.
- O painel precisa de um campo que a U1 não devolve: relata; nunca ler outra rota para montá-lo.

## U6 A automação roda um agente

**Base e modelo.** `main` depois da U2. Sonnet: um campo novo num contrato que já tem a sua versão.

### As linhas da tabela

- `AutomationInput` versão 1 (`builder/automations/run.ts:37-50`, lido) e `AUTOMATION_WORKFLOW`
  (`:21-27`: renomear apaga as linhas).
- `conversed` (`run.ts:96-142`, lido): a conversa aberta por `deps.assistant.open`; o alvo agente a
  abre pela abertura da U2, com a mesma chave `conversationIdOf`.
- `propose_automation` (`builder/assistant/propose-automation.ts:12-29`, lido): o controlador
  "agentes" também a oferece, com o `agentId` posto pela ferramenta.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/automations/` | Muda `run.ts` (a união das versões, `targetOf`, `check` e `conversed` com o alvo), `automations.ts` (a criação com `agentId`), `release.ts` (as automações de um agente, pelo `onChange` `DELETED`) | — |
| `apps/server/src/builder/agents/` | Muda `agent.ts`: `propose_automation` no conjunto, com o alvo | — |
| `packages/hub-api/src/automations.ts` | Muda: `CreateAutomation.agentId?`, `AutomationSummary.agent`, `RunOutcome` `SKIPPED` com `AGENT_GONE` | a web |
| `apps/web/src/builder/automations/` | Muda: **Roda: <nome>** no cartão e na linha; "Não rodou: o agente foi apagado." | — |

### Os contratos que a unidade cria

```ts
// apps/server/src/builder/automations/run.ts
export const AutomationTarget = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('ASSISTANT') }),
  z.object({ kind: z.literal('AGENT'), agentId: AgentId }),
])
const V2 = AutomationInputV1.extend({ version: z.literal(2), target: AutomationTarget })
export const AutomationInput = z.discriminatedUnion('version', [AutomationInputV1, V2])
export function targetOf(input: AutomationInput): AutomationTarget   // V1: ASSISTANT; um dono só (C26)
// packages/hub-api/src/automations.ts
// RunOutcome SKIPPED: reason: z.enum(['OWNER_CANNOT_ASK', 'AGENT_GONE'])
// AutomationSummary: agent: z.object({ agentId: AgentId, name: z.string() }).nullable()
```

Uma automação com alvo agente é do Projeto do agente e grava `connections: []` (as ligações vêm da
versão ativa); o nome no resumo é lido da linha do agente. A execução roda a versão ativa no
instante do disparo.

### As skills e a leitura

`mastra` (a agenda e o workflow da 24.2), `pstack:tdd`. [testing](../guides/testing.md) T5, T12, T26.

### A ordem do trabalho

1. **A prova primeiro.** `run.test.ts`, "a linha antiga" e "o agente"; o segundo falha hoje.
2. A união e `targetOf`; `check` e `conversed`.
3. A criação, a recusa, o resumo, `propose_automation`; `release.ts`; as telas.

### Como se prova

A agenda de verdade num Postgres de teste com o tique curto, o modelo dublê. Comando: os testes
tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- Uma linha da agenda da 24.2 deixa de ser lida (a versão 1): para; mudar `AUTOMATION_WORKFLOW`
  apagaria todas as linhas.
- O nome do agente precisa ser guardado na automação: relata; a linha do agente é a dona.
