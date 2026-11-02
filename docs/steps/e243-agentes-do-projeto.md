# Etapa 24.3: Agentes do Projeto, com o Construtor

Este cartão espera a 24.2. Pela regra L5, entra em `docs/steps/` quando o cartão da 24.2 sair no
fechamento dela; até lá vive no seu pull request. Ele usa o que a 24.1 e a 24.2 construíram: o
Assistente, a porta da empresa aos conectores, a máquina da conversa, as automações e o sino.

## A página do fundador

**No fim desta etapa** a Ana, no Projeto Vendas, conversa com o Construtor e pede um agente que
confere as vendas do dia contra as metas do app. O Construtor olha o Projeto (as ligações, as
tabelas do app), escreve o agente e mostra um cartão; ela toca **Criar agente**. O agente aparece em
**Agentes**, na barra do Projeto. Ela abre a página dele, vê o que ele lê e as instruções dele, e
conversa com ele. Ele lê o Sankhya, os dados do app do Projeto e, se ela quiser, a web; não grava
nada. Ela pede "todo dia às 7h me manda isso", e a automação da 24.2 passa a rodar **esse agente**.

**O roteiro de uso.** Padaria Sol: Ana (dona), Bia (financeiro, administradora) e Bruno (membro). O
Projeto "Vendas" recebeu a ligação "Matriz" do Sankhya e tem o app "Metas", com a meta de cada
vendedor. No computador e no celular.

1. A Ana abre o Projeto Vendas, em **Construir**, e escreve "quero um agente que confere as vendas de
   ontem contra as metas e me diz quem ficou abaixo". O Construtor lê o Projeto e responde com o
   cartão: o nome ("Conferente de metas"), o que ele faz, em duas linhas, e o que ele lê (**Sankhya ·
   Matriz**, **Dados do app Metas**; web: não). Ela toca **Criar agente**; o cartão vira "Agente
   criado", com **Abrir agente**.
2. Na barra do Projeto ela abre **Agentes**: o "Conferente de metas" está lá, com o que ele lê. Ela o
   abre. À esquerda, as conversas dela com ele (nenhuma ainda) e **Nova conversa**; ao lado, o
   painel **Como ele é**: o que lê, as instruções inteiras e quem o criou.
3. Ela pergunta "quem ficou abaixo da meta ontem?". O agente mostra as leituras ("Lendo Sankhya ·
   Matriz", "Lendo dados do app") e responde com a tabela. A conversa aparece em **Conversas** com
   a etiqueta **Agente · Conferente de metas**.
4. Ela escreve "apaga as metas de outubro". O agente diz que só lê; gravar vem na 24.4.
5. Ela escreve "todo dia às 7h me manda isso". O agente mostra o cartão da automação, que agora diz
   **Roda: Conferente de metas**. Ela toca **Criar automação**, e depois **Rodar agora** na página
   Automações: a execução abre uma conversa nova com o agente, marcada "Automação", e o sino avisa.
6. A Bia abre o Projeto: vê o agente e conversa com ele; as conversas da Ana não aparecem para ela. O
   Bruno (membro) não vê **Agentes**, e o endereço de um agente dá "não encontrado".
7. A Ana apaga o agente (qualquer dono ou administrador pode, como as automações, pela sua resposta
   "3" de 2026-11-01). A confirmação diz que as conversas com ele e as automações que o rodam vão
   junto. Ele some da lista e a automação some da página Automações.

**O que você faz, e quando.**
- **No começo:** responde a decisão **B** abaixo e aprova esta página. A aprovação é também a sua
  palavra para as permissões da tabela nova dos agentes (regra D11), como nas etapas 18, 20 e 24.2.
- **No fim:** faz o roteiro no computador e no celular, diz o que viu e aprova os textos das telas.

**Fica de fora.**
- **Agentes que gravam** (24.4): as ferramentas dos agentes só leem. Pedir para gravar recebe "só
  leio", como no passo 4.
- **Editar um agente.** Para mudar, apaga e pede de novo ao Construtor, como uma automação na 24.2. A
  edição pela conversa entra quando você pedir.
- **Escolher o modelo do agente.** O agente usa o modelo da conversa, como o Assistente: quem
  conversa paga com a conta dele, e um modelo preso no agente falharia para quem não tem conta
  daquele fornecedor.
- **Agentes no Início** (fora de um Projeto): a sua decisão J1 de 2026-10-30 põe os agentes no
  Projeto.
- **Membros com agentes**: como as conversas e as automações, só o dono e os administradores. A
  etapa de papéis e pedidos vem logo depois desta (a sua resposta "2" de 2026-11-01).
- **Workflows e o agente como passo deles** (24.5).
- **Das pendências marcadas para o próximo cartão:** entra a frase velha do texto do Construtor que
  diz que os conectores "vêm depois" (a #540), porque a U3 muda esse texto. As outras esperam a
  etapa delas: as da 14.3, 17, 18, 19 e 20 não tocam agentes; a "conversa enviada ao Construtor" e
  os "ajudantes em paralelo" da #541 esperam o primeiro pedido seu; a #339 (o fim do Hub no meio
  de um turno) espera a 16.

### O que muda do mapa da 24.2

O mapa dizia que cada agente vira um `new Agent` registrado por `mastra.addAgent`. O estudo desta
etapa abriu o Mastra 1.79.0 e achou um caminho mais simples e mais nativo **para o que esta etapa
usa**: a conversa. A conversa do Conexus roda no controlador de agentes do Mastra, e um controlador
tem **um** agente, fixo na partida; trocar o agente por conversa não existe nele. O que existe, e é
como o próprio Mastra Code faz, é um agente cujas instruções, ferramentas e modelo são lidos a cada
pedido. Então o agente do Projeto é **uma linha nossa** que o motor do Assistente lê a cada pedido:
as telas, a conversa, a máquina, a automação e a porta das rotas da 24.1 e da 24.2 servem sem
nada novo no meio. O `addAgent` por linha entra na 24.5, quando o primeiro workflow chamar um
agente pelo id. Nada do que você vê muda.

### As decisões suas nesta etapa

**B. Onde roda o código que o Construtor escrever.** Hoje nenhum agente desta etapa precisa de
código: ele lê pelas ferramentas que nós registramos. A pergunta é para o dia em que o Construtor
quiser escrever uma conta própria, por exemplo "a curva ABC dos clientes com a fórmula da empresa".
Código de uma empresa **nunca** roda dentro do Hub, que guarda as chaves e os dados de todas.

- **B1 (recomendo agora).** O Construtor não escreve código: monta o agente como **dados** (o que
  ele lê, as instruções) e, na 24.5, os workflows como dados, ligando ferramentas que nós
  escrevemos. Exemplo: "confere vendas contra metas" é um agente com duas leituras e instruções.
  Nativo: o agente lido a cada pedido (acima) e, na 24.5, o workflow guardado como dados do Mastra
  (`addDynamicWorkflow`, código aberto, fora do `ee`).
- **B2 (recomendo para a conta pesada, quando ela aparecer).** O código roda na **máquina E2B** da
  conversa, onde o Assistente já roda Python e Node para tabelas e gráficos. O Construtor guarda o
  script no agente, e o agente o roda na máquina dele. Exemplo: a curva ABC com pandas sobre a
  leitura do Sankhya. A máquina não guarda chave nenhuma e só alcança os repositórios de pacotes
  (decisão 0059); acorda em segundos e fica fora do Brasil (o aviso da 0032). Nativo: a ferramenta
  de comando da área de trabalho do Mastra, que o Assistente já usa.
- **B3.** O código vira um **Worker** no mesmo lugar dos apps (Workers for Platforms, decisão 0018),
  sem chave nenhuma, chamado por uma ferramenta nossa. Rápido e barato, mas só JavaScript, com 50 ms
  de processador por chamada, e o Hub ainda não tem porta para chamar um Worker fora de uma página.
  Exemplo: uma conferência de CPF. Nativo: o envio de versões dos apps; ou o carregador de Workers
  do Code Mode da Cloudflare, que roda o código sem guardar nada.

**O que esta etapa constrói em cada resposta.** Com **B1**, as unidades U1 a U4 abaixo, como
estão (cerca de 2.600 linhas). Com **B2**, as mesmas e mais a U5 (o script do agente na máquina,
cerca de 450 linhas a mais). Com **B3**, as mesmas e mais a U5' (o Worker do agente e a porta do Hub
até ele, cerca de 1.000 linhas a mais). As U1 a U4 servem às três respostas, então começam no dia
em que você aprovar, e a U5 começa quando você responder.

**Enquanto você não responde.** A construção segue a recomendação **B1**, que não constrói nada a
mais; uma resposta B2 ou B3 só acrescenta a U5.

**O tamanho.** Cerca de **2.600 linhas** de código com B1 (3.050 com B2, 3.600 com B3), abaixo do
teto de 4.000 da regra L2.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | Os agentes e a conversa com eles: a tabela `builder.project_agent`, a migração e as permissões; as rotas (criar, listar, ler, apagar); a conversa do Assistente que roda um agente (a linha lida a cada pedido); a remoção com o agente, o Projeto, a pessoa e a empresa | `apps/server/src/builder/agents/`, `apps/server/src/builder/assistant/`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `apps/server/src/conversations-of.ts`, `packages/hub-api/src/` | [data](../guides/data.md) | a 24.2 fechada |
| U2 | Os dados do app: a ferramenta `app_data_read`, que consulta o banco do app do Projeto por um login só de leitura | `apps/server/src/platform/` (`company-postgres.ts`), `apps/server/src/builder/agents/`, `apps/server/src/builder/assistant/` (`assistant.ts`), `apps/web/src/builder/conversation/`, `packages/hub-api/src/` (`app-login.ts`, `assistant.ts`) | [security](../guides/security.md) | U1 |
| U3 | O Construtor propõe e as telas: `propose_agent` no Construtor e o cartão **Criar agente**; a entrada **Agentes** na barra do Projeto, a lista e a página do agente; a conversa com o agente e a etiqueta | `apps/server/src/builder/conversation/` (`builder.ts`, `prompt/builder.md`, `propose-agent.ts`), `apps/web/src/builder/agents/`, `apps/web/src/builder/conversation/`, `apps/web/src/builder/assistant/`, `apps/web/src/hub/projects/` (`project-rail.tsx`), `apps/web/src/routes/_app/companies/$companyId/projects/`, `packages/hub-api/src/`, `docs/reference/screens.md` | [web](../guides/web.md) | U2 |
| U4 | A automação roda um agente: o alvo da automação ganha o agente; o cartão da automação na conversa do agente; a remoção do agente leva as automações dele | `apps/server/src/builder/automations/`, `apps/server/src/builder/assistant/` (`propose-automation.ts`), `apps/web/src/builder/automations/`, `packages/hub-api/src/` (`automations.ts`) | [testing](../guides/testing.md) | U1 |
| U5 (só com B2) | O script do agente na máquina | `apps/server/src/builder/agents/`, `apps/server/src/builder/assistant/` (`machine.ts`), `apps/server/src/builder/conversation/` (`propose-agent.ts`), `apps/web/src/builder/agents/`, `packages/hub-api/src/` | [security](../guides/security.md) | U3 |

A U2 e a U4 andam em paralelo depois da U1: não dividem arquivo (a U2 muda `assistant.ts` do
servidor e do `hub-api`; a U4, `propose-automation.ts` e `automations.ts`). A U3 espera a U2 porque as duas mudam o
registro das ferramentas da web (`apps/web/src/builder/conversation/`). A U5' de B3 está descrita na seção de B3, no fim.

**Quando começa** (delivery L1). A U1 muda `builder/assistant/`, que a 24.2 mudou; ela começa
quando a 24.2 fechar e esta página for aprovada, na ordem que o firstmate der entre esta etapa e a
13.3 (a Pauta), cujo cartão espera a sua resposta A1 ou A2.

**Antes da U1**, nenhuma regra muda. Valem a do `ee`
(https://github.com/developmentconexus-ops/conexus/pull/518: nada do Agent Builder, do editor nem dos
agentes guardados do Mastra) e a `mastra-only-in-builder` (W7): os agentes moram em `builder/`.

**Orçamento de código alterado.** U1: ~1.000. U2: ~400. U3: ~950. U4: ~250. Total: ~2.600. Com B2,
U5: ~450; com B3, U5': ~1.000. Testes, gerados e o OpenAPI ficam fora. Hipótese pelos vizinhos: a
U1 da 24.2 (~850, rotas sobre um serviço e o motor do Assistente), a U3 da 24.2 (~950, cartão e
duas páginas), a tabela da conversa da 24.1 (`chosen.ts`, 102 linhas) e o login do app da 9.

## Os critérios de aceite

O aceite da etapa: a Ana cria pelo Construtor um agente que lê, o vê no Projeto, conversa com ele
e o põe numa automação (critérios 1, 7, 9, 15, 17, 19, 20, 21).

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `POST /api/companies/{c}/projects/{p}/agents` com nome, instruções, ligações, `web` e `appData`, pela dona ou administradora, responde 201 com o agente; `GET …/agents` o lista a qualquer dono ou administrador da empresa; `GET …/agents/{id}` o devolve com as ligações e se o Projeto ainda as oferece | `apps/server/src/builder/agents/routes.test.ts`, "criar" | must |
| 1a | U1 | A mesma chave de tentativa com o mesmo corpo devolve o mesmo agente, também com os dois pedidos ao mesmo tempo; com outro corpo, `IDEMPOTENCY_CONFLICT`; duas chaves, dois agentes | `routes.test.ts`, "a tentativa" | must |
| 2 | U1 | Recusas: o membro, `NOT_FOUND` em todas as rotas (S10); um Projeto de outra empresa ou apagado, `NOT_FOUND`; o nome vazio ou com mais de 80 caracteres, as instruções vazias ou com mais de 4.000, `REQUEST_MALFORMED`; um agente de outro Projeto ou empresa, `AGENT_NOT_FOUND`; uma ligação que o Projeto não oferece não é gravada (a criação guarda só as que o Projeto oferece agora, como a conversa da 24.1) | `routes.test.ts`, "as recusas" | must |
| 3 | U1 | `POST …/assistant/conversations` com `agentId` abre uma conversa do Assistente que roda o agente: o lugar é o Projeto do agente (um `projectId` diferente dá `NOT_FOUND`), as ligações são as do agente que o Projeto ainda oferece, e o resumo da conversa traz `agent: { agentId, name }`; um `agentId` de outro Projeto ou apagado dá `AGENT_NOT_FOUND` | `apps/server/src/builder/assistant/assistant.test.ts`, "a conversa do agente" | must |
| 4 | U1 | Num turno da conversa do agente, o modelo recebe as instruções do Conexus, depois as do agente, e só as ferramentas de leitura: `connector_read` e `connector_notes` sobre as ligações do agente, `web_search` e `web_fetch` só com `web`, `show_file` e as da máquina; nunca `propose_app`, `conexus_overview` nem uma ferramenta que grava; uma ligação que o Projeto perdeu depois da criação sai das ferramentas no turno seguinte | `assistant.test.ts`, "as ferramentas do agente" (o modelo dublê da 12 lê a lista de ferramentas e o texto do sistema da chamada) | must |
| 5 | U1 | `PUT …/conversations/{id}/connections` numa conversa de agente responde 409 `AGENT_CONNECTIONS_FIXED`, e as ligações ficam as do agente | `assistant.test.ts`, "as ligações do agente" | must |
| 6 | U1 | `DELETE …/agents/{id}` responde 204: o agente some da lista; as conversas com ele somem para todas as pessoas (a linha do Hub e o fio do Mastra), também uma aberta no mesmo instante que a remoção (nenhum fio fica sem a linha do Hub); apagar de novo dá `AGENT_NOT_FOUND`; a remoção do Projeto, da pessoa e da empresa leva os agentes antes das conversas (a ordem da 24.1); um agente criado por uma pessoa que sai fica no Projeto | `apps/server/src/builder/agents/release.test.ts` | must |
| 7 | U1 | A lista das conversas do Projeto mostra a do agente com `agent`; `GET …/assistant/conversations?agentId=` devolve só as conversas da pessoa com aquele agente | `assistant.test.ts`, "a lista do agente" | must |
| 8 | U1 | Os agentes saem com o Projeto e a empresa (as chaves estrangeiras), a conversa de agente sai com o agente, a política da empresa recusa ler o agente de outra empresa, e o catálogo das permissões e das políticas fecha (`database-grants.sql`) | `apps/server/src/platform/catalog.test.ts`; `release.test.ts`, "as chaves" | must |
| 9 | U2 | Numa conversa de agente com `appData`, `app_data_read` com um `SELECT` devolve as linhas da tabela do app, cortadas como `connector_read`; o login que a roda é o `app_<projeto>_read` | `apps/server/src/builder/agents/app-data.test.ts`, "lê" (o Postgres de teste no lugar do Neon, pela porta `CompanyPostgres`) | must |
| 10 | U2 | `app_data_read` com `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `SET ROLE` ou dois comandos juntos é recusado pelo banco, nunca por um filtro de texto nosso: o resultado é `APP_DATA_REFUSED`, e a tabela não muda; depois de um `SET default_transaction_read_only = off`, de um `set_config(...)` ou de um `SET TRANSACTION READ WRITE` sozinhos (que o Postgres aceita), um `DELETE` na chamada seguinte continua recusado; uma tabela fora do esquema do app e a tabela do livro das migrações também | `app-data.test.ts`, "não grava" | must |
| 11 | U2 | O login de leitura nasce na primeira chamada de um Projeto que já existia antes da U2 e na criação do app de um novo; nos dois, o livro das migrações é recusado a ele; repetir não falha; a consulta passa do tempo do app (`APP_CALL_LIMITS`) e volta `APP_DATA_TIMEOUT` | `app-data.test.ts`, "o login" e "o tempo" | must |
| 12 | U2 | Sem app no Projeto (nenhuma versão), a ferramenta não é oferecida, e um agente com `appData` responde pelas outras; o banco da empresa fora dá `APP_DATA_UNAVAILABLE` sem derrubar o turno | `app-data.test.ts`, "sem app" | must |
| 13 | U3 | Numa conversa do Construtor num Projeto, o modelo recebe `propose_agent` depois das ferramentas que já tinha (o pedido do modelo igual byte a byte até elas, o critério 13a da 20, comparado pelo objeto `tools` de `builder.ts`; a lista fechada `CLOSED_TOOLS` ganha o nome no meio, e isso não muda o pedido); a saída é a proposta, com só as ligações que o Projeto oferece e `appData` falso sem app; nada é gravado sem o toque | `apps/server/src/builder/conversation/builder.test.ts`, "propor um agente" | must |
| 14 | U3 | O cartão mostra o nome, o que o agente faz, o que ele lê ("Sankhya · Matriz", "Dados do app Metas", "Web"); **Criar agente** chama a criação com uma chave de tentativa e vira "Agente criado" com **Abrir agente**; tocar duas vezes cria um; uma recusa mostra a frase do código | `apps/web/src/builder/agents/proposal.test.tsx` | must |
| 15 | U3 | A página Agentes do Projeto lista os agentes; a página de um agente mostra as conversas da pessoa com ele, **Nova conversa** e o painel **Como ele é** (o que lê, com a ligação perdida marcada "O Projeto não oferece mais", as instruções inteiras, quem criou e quando); **Apagar** pede confirmação com o aviso das conversas e das automações | `apps/web/src/builder/agents/agents.test.tsx` | must |
| 16 | U3 | O membro não vê **Agentes**; o endereço de um agente apagado ou de outro Projeto dá a página de não encontrado | `agents.test.tsx`, "o membro" | must |
| 17 | U3 | A conversa com o agente é a conversa do Assistente: o título com **Agente · <nome>**, sem o escolhedor de ligações; a mesma etiqueta nas recentes e em Conversas | `apps/web/src/builder/assistant/home.test.tsx`, "a etiqueta do agente" | must |
| 18 | U3 | As telas novas a 1366 e a 390 px, nos dois temas, sem rolagem lateral (W34 e o QA) | o QA da etapa (testing T25) | must |
| 19 | U4 | Numa conversa de agente, `propose_automation` sai com `agentId` do agente da conversa, posto pela ferramenta e nunca pelo modelo; o cartão mostra **Roda: <nome>**; a criação grava o alvo, e `AutomationSummary.agent` o devolve | `apps/server/src/builder/automations/routes.test.ts`, "o alvo agente" | must |
| 20 | U4 | `POST …/automations` com `agentId` de outro Projeto, de outro lugar que o da automação, ou apagado dá `AGENT_NOT_FOUND`; sem `agentId`, a automação roda o Assistente, como na 24.2 | `routes.test.ts`, "as recusas do alvo" | must |
| 21 | U4 | Com o tique curto do teste, a automação de um agente dispara: a execução abre **uma** conversa de agente do dono, marcada "Automação" e com `agent`, manda o pedido e termina `DONE`; uma linha da agenda gravada pela 24.2 (sem alvo) roda o Assistente como antes | `apps/server/src/builder/automations/run.test.ts`, "o agente" e "a linha antiga" | must |
| 22 | U4 | Apagar o agente apaga as automações que o rodam (e os runs delas) antes das conversas; um disparo que chegar a um agente apagado no meio termina `SKIPPED` com `AGENT_GONE` e pausa a automação, sem conversa | `apps/server/src/builder/agents/release.test.ts`, "as automações"; `run.test.ts`, "o agente apagado" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentes (no Projeto) | "Peça um agente ao Construtor, por exemplo: um agente que confere as vendas contra as metas." com **Ir para Construir** | o mesmo | a lista em esqueleto | `DATABASE_UNAVAILABLE`: a frase com Tentar de novo | o Projeto apagado: a página de não encontrado da casa | o membro não vê a entrada; o endereço dá "não encontrado" (S10) | — |
| A página de um agente | "Ainda não há conversas com este agente." com **Nova conversa** | o mesmo | a página em esqueleto | a frase do código com Tentar de novo | `AGENT_NOT_FOUND`: a página de não encontrado | o membro: não encontrado | uma ligação que o Projeto não oferece mais: "O Projeto não oferece mais" ao lado dela |
| O cartão **Criar agente** | o cartão | — | **Criar agente** ocupado | a frase do código | o Projeto apagado: `NOT_FOUND` com a frase da 24.1 | — | criado: "Agente criado", com **Abrir agente** |
| A conversa com o agente | a caixa com "Pergunte a <nome>…" | — | como a da 24.1 | como a da 24.1; `AGENT_NOT_FOUND` ao mandar: "Este agente foi apagado." | o agente apagado: a página de não encontrado | como a da 24.1 | como a da 24.1 |
| O cartão da automação na conversa do agente | o cartão da 24.2 com **Roda: <nome>** | — | como na 24.2 | como na 24.2; `AGENT_NOT_FOUND`: "Este agente foi apagado." | como na 24.2 | — | como na 24.2 |
| Uma linha de Automações | — | — | como na 24.2 | como na 24.2 | como na 24.2 | — | `SKIPPED` com `AGENT_GONE`: "Não rodou: o agente foi apagado." |

**O desenho das telas** (a caixa só fixa onde fica cada peça; o fundador aprova os textos no fim;
sem captura do Conexus OS, que não tinha agentes). A estrutura da página do agente segue a página
de agente do Mastra Studio, capturada pelo fundador em 2026-11-01 (as conversas à esquerda, a
conversa no meio, o painel da configuração à direita: ferramentas, memória, o texto do sistema);
só a estrutura e o fluxo, nunca o estilo (as palavras dele na biblioteca de referências).

```text
1280 px, Agentes (no Projeto)                              390 px, Agentes
 ┌──────────────┬───────────────────────────────────────┐  ┌──────────────────────────┐
 │ Vendas      ⌄│ Agentes                                │  │ ☰  Agentes           🔔1 │
 │ Construir    │  Conferente de metas                   │  │ Conferente de metas      │
 │ Conversas    │  Lê: Sankhya · Matriz, Dados do app    │  │ Lê: Sankhya · Matriz,    │
 │ Agentes      │  Criado por Ana · 02/11                │  │ Dados do app             │
 │ Automações   │  Resumo de estoque                     │  │ Resumo de estoque        │
 │ Sobre        │  Lê: Sankhya · Matriz, Web             │  │ Lê: Sankhya, Web         │
 └──────────────┴───────────────────────────────────────┘  └──────────────────────────┘
1280 px, a página de um agente                              390 px, a página de um agente
 ┌────────────┬──────────────────────────┬──────────────┐  ┌──────────────────────────┐
 │ ← Agentes  │ Conferente de metas      │ Como ele é   │  │ ← Conferente de metas [⋯]│
 │ [Nova      │                          │ Lê           │  │ [Conversas][Como ele é]  │
 │  conversa] │  (a conversa da 24.1)    │ Sankhya ·    │  │ [Nova conversa]          │
 │ Quem ficou │                          │  Matriz      │  │ Quem ficou abaixo… 02/11 │
 │  abaixo…   │                          │ Dados do app │  │                          │
 │            │                          │ Instruções   │  │                          │
 │            │ [Pergunte a Conferente…] │ Criado por   │  │                          │
 │            │                          │ [Apagar]     │  │                          │
 └────────────┴──────────────────────────┴──────────────┘  └──────────────────────────┘
1280 px, o cartão na conversa do Construtor
 ┌───────────────────────────────────────────────┐
 │ Conferente de metas                           │
 │ Confere as vendas de ontem contra as metas    │
 │ e diz quem ficou abaixo.                      │
 │ Lê: Sankhya · Matriz · Dados do app Metas     │
 │ [Criar agente]                                │
 └───────────────────────────────────────────────┘
```

A 390 px, a página do agente troca as três colunas por duas abas (**Conversas** e **Como ele é**), e
uma conversa aberta ocupa a tela, como as da 24.1; **Apagar** vai para o menu **⋯**.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| A linha `builder.project_agent` | U1 (a criação) | U1 (as rotas, o motor do Assistente, a remoção); U2 (`appData`); U4 (o alvo) |
| `AgentSummary` | U1 (as rotas) | U3 (as telas) |
| A coluna `builder.assistant_conversation.agent_id` | U1 (`openConversation`) | U1 (o escopo da conversa, o resumo); U4 (a abertura pela execução) |
| A marca `conexusAgent` do fio | U1 (`openConversation`) | U1 (o filtro `agentId` da lista); U3 (pela lista) |
| `AgentScope` (o agente no escopo da conversa) | U1 (`sessionScopes`) | U1 (instruções e ferramentas); U2 (`app_data_read`); U4 (`propose_automation`) |
| `ProposedAgent` (a saída de `propose_agent`) | U3 (servidor) | U3 (o cartão) |
| `AutomationTarget` (no `inputData`, versão 2) | U4 (a criação) | U4 (o workflow, a lista) |
| O login `app_<projeto>_read` | U2 (`ensureApp`, `ensureReadLogin`) | U2 (`app_data_read`) |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Criar o agente (`insert` com o id derivado da empresa, da pessoa e da chave de tentativa, `on conflict (id) do nothing`, e reler) | a mesma chave: uma linha; o `bodyHash` decide entre o mesmo agente e `IDEMPOTENCY_CONFLICT`; duas chaves, duas linhas | a conferência (papel, Projeto, ligações) antes: nada gravado; a gravação é uma só | banco do Hub fora: `DATABASE_UNAVAILABLE`, nada criado | `AGENT_CREATED` (empresa, Projeto, agente) | 1, 1a, 2 |
| Abrir a conversa do agente (`openConversation` com `agentId`: a linha do Hub com `agent_id`, depois `createSession` com a marca `conexusAgent`, como a 24.1) | a mesma chave acha a mesma conversa (a 24.1) | a linha do Hub antes do fio: um corte deixa a linha, e a repetição acha e cria o fio, como a 24.1 | banco fora: `DATABASE_UNAVAILABLE`; o agente apagado entre a leitura e a gravação: a chave estrangeira recusa, e a rota responde `AGENT_NOT_FOUND` | da 24.1 | 3 |
| O turno da conversa do agente (as instruções e as ferramentas lidas da linha a cada pedido) | o turno da 24.1 | o agente apagado no meio do turno: o turno em andamento termina com o que já tinha; o seguinte dá `AGENT_NOT_FOUND` | banco fora na leitura da linha: o turno falha como a leitura do escopo da 24.1 (`DATABASE_UNAVAILABLE`) | da 24.1 | 4, 5 |
| Apagar o agente (numa transação do Hub, `select … for update` da linha do agente, que `openConversation` também trava ao gravar a linha da conversa; depois as automações dele, U4, pelo `schedules.delete` da 24.2; os fios do Mastra das conversas dele, de todas as pessoas, pela marca; por último a linha, que leva as `assistant_conversation` por cascata) | o segundo dá `AGENT_NOT_FOUND`; dois ao mesmo tempo: a trava faz um esperar, e ele acha a linha apagada e responde `AGENT_NOT_FOUND`; uma conversa aberta no mesmo instante: ou a abertura passa antes e a varredura acha o fio dela, ou espera a trava e recebe `AGENT_NOT_FOUND`; nunca um fio sem a linha do Hub | uma por vez; uma falha no meio deixa fios que a próxima tentativa acha, porque a linha sai por último | banco do Mastra fora: para antes da linha, `DATABASE_UNAVAILABLE`, nada perdido | `AGENT_DELETED` (empresa, Projeto, agente, quantas conversas e automações) | 6, 22 |
| A remoção do Projeto, da pessoa e da empresa | apagar de novo não falha | os agentes antes das conversas (a ordem da 24.1); um corte deixa o que a próxima acha | como a da 24.1 | `AGENTS_RELEASED` (quantos) | 6, 8 |
| Criar o login de leitura (`CREATE ROLE … LOGIN PASSWORD` e as permissões, numa transação, como `ensureApp`) | dois turnos ao mesmo tempo: um cria, o outro recebe "already exists" e relê a lista dos logins (a mesma senha derivada, decisão 0043) | uma transação só: nada pela metade | Neon fora: `APP_DATA_UNAVAILABLE` ao modelo, o turno segue | `APP_READ_LOGIN_CREATED` (Projeto) | 11 |
| A consulta `app_data_read` (`neonTransport` como `app_<projeto>_read`, numa transação `readOnly`) | consultas independentes | o banco recusa a escrita: `APP_DATA_REFUSED`, nada muda | Neon fora: `APP_DATA_UNAVAILABLE`; o tempo do app: `APP_DATA_TIMEOUT` | `APP_DATA_READ` (Projeto, linhas, ms), nunca o SQL nem as linhas (C50) | 9, 10, 12 |
| Criar a automação com alvo agente (a da 24.2, com `agentId` no `inputData`) | a da 24.2 | a da 24.2; o agente conferido antes | a da 24.2 | `AUTOMATION_CREATED` com `agentId` | 19, 20 |
| O passo `check` com alvo agente (a linha lida; ausente: `schedules.pause` e `SKIPPED`) | pausar uma pausada devolve o estado | uma linha só | banco do Hub fora: o passo falha como o `check` da 24.2 | `AUTOMATION_PAUSED` com `AGENT_GONE` | 22 |

## A tabela de referência

Referências: Mastra como instalado (`@mastra/core` 1.79.0, `@mastra/pg` 1.32.0, `@mastra/e2b`
0.15.0; `NM:` é `node_modules/@mastra/core/dist`); o fonte do Mastra, com o Mastra Code e a Factory,
na estante `mastra-1.79` `4c22623e`, a tag `@mastra/core@1.79.0` (`M:`); o agents da Cloudflare
`786d30e3` (`CF:`), com `@cloudflare/codemode` 0.5.5; o vibesdk `9da158d` (`V:`). O Conexus é lido
no `main` `c3eb253e`. "Lido" é linha reaberta pelo autor deste cartão; "relay" é de um ajudante do
estudo, e a unidade a reabre antes de usar.

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A linha do agente | U1 | nada; nenhum agente registrado (`builder/conversation/mastra.ts:20-28`, relay) | os agentes guardados do Mastra são do editor (`M:packages/editor`, `NM:storage/domains/agents`, `editor?` em `NM:mastra/index.d.ts:286`), relay; recusados desde o pull request 518 | o editor guarda o agente como versão numa tabela dele | nativo: uma tabela nossa no Hub (`builder.project_agent`), como `builder.assistant_conversation` da 24.1; nunca o editor | — | A da 24.2 ("um agente do Projeto"); J1 | `builder/agents/agents.ts`, `builder/agents/tables.ts` |
| Como a linha vira agente | U1 | o Assistente: um `new Agent` com `instructions`, `model` e `tools` lidos a cada pedido (`builder/assistant/assistant.ts:274-298`, lido) | `DynamicArgument` (`NM:types/dynamic-argument.d.ts:3-6`); `instructions`, `model`, `tools`, `memory` dinâmicos (`NM:agent/types.d.ts:567,650,659,745`); o controlador tem um agente só, que cada modo bifurca (`NM:agent-controller/types.d.ts:213-216`), sem trocar agente por sessão; o Mastra Code: um agente com `instructions: async ({ requestContext })` e o modelo dinâmico (`M:mastracode/sdk/src/index.ts:1307-1336`); `addAgent` ignora a chave repetida em silêncio (`NM:mastra-Da0Czfte.js:1871-1873`) e `removeAgent` não para um run em andamento (`:2142-2158`), todos relay | um agente cujo comportamento sai do contexto do pedido | nativo: o agente do Assistente lê a linha pelo escopo da conversa; `addAgent` por linha fica para a 24.5, o primeiro consumidor (um passo `{ type: 'agent', agentId }` de workflow, `NM:workflows/types.d.ts:758-770`, relay) | — | — | `builder/assistant/context.ts` (muda) |
| A conversa com o agente | U1 | a conversa do Assistente (`open.ts:12-51`, lido; `routes.ts:175-200`, lido) | a sessão do controlador (`NM:agent-controller/agent-controller.d.ts:119`, relay) | a sessão leva o contexto do pedido | nativo: a conversa do Assistente com `agent_id` na linha do Hub e a marca `conexusAgent` no fio | — | — | `builder/assistant/open.ts` (muda) |
| As ferramentas do agente | U1 | `connectorTools`, `toolsOf`, `show_file` (`assistant.ts:283-298`, lido) | `tools` dinâmico (`NM:agent/types.d.ts:659`, relay); `requireApproval` ausente quer dizer sem aprovação (`NM:tools/types.d.ts:650-658`, relay) | ferramentas por pedido | nativo: o mesmo construtor de ferramentas, com o conjunto de leitura do agente | — | — | — |
| Os dados do app | U2 | o login do app e o de migração (`packages/hub-api/src/app-login.ts:8-15`, lido); as permissões do esquema (`apps/server/src/platform/company-postgres.ts:148-170`, lido); o envio pelo Neon (`company-postgres.ts:65-81`, relay) | Postgres: `default_transaction_read_only`, `GRANT SELECT`, `ALTER DEFAULT PRIVILEGES` (documentação do PostgreSQL 17, `ALTER ROLE`, `GRANT`); decisão 0043 (a senha derivada) | um login só de leitura, com as permissões no banco | nativo: um terceiro login `app_<projeto>_read`, só `USAGE` e `SELECT` (a barreira), cada consulta numa transação de leitura e `default_transaction_read_only = on` (profundidade, porque a sessão pode desligá-lo); a recusa vem do banco | — | — | `builder/agents/app-data.ts` |
| A proposta do Construtor | U3 | `propose_automation` (`builder/assistant/propose-automation.ts:12-29`, lido); as ferramentas do Construtor (`builder/conversation/builder.ts:221-232`, lido) | a ferramenta que só devolve a proposta (o `E1` da 24.2) | o modelo propõe, a tela desenha, a pessoa grava | nativo: `propose_agent`, como `propose_automation` | — | E1 da 24.2 | `builder/conversation/propose-agent.ts` |
| A página do agente | U3 | a conversa do Assistente no Projeto (`$projectId_.assistant.$conversationId.tsx`, relay) | a página de agente do Mastra Studio (captura do fundador, 2026-11-01): conversas, conversa e o painel da configuração | estrutura e fluxo | nativo: as telas da 24.1 e o painel **Como ele é**; nenhum estilo do Studio | — | "estrutura e fluxo, nunca o estilo" (2026-11-01) | `apps/web/src/builder/agents/agent-page.tsx` |
| O alvo da automação | U4 | `AutomationInput` versão 1 (`builder/automations/run.ts:37-50`, relay: o comentário diz que a versão deixa um alvo novo entrar); `conversed` abre a conversa do Assistente (`run.ts:113-117`, lido) | a agenda com alvo agente chama o agente direto, sem sessão do controlador (`NM:worker-5hzgCU_T.js:161-167`, relay), e apaga a linha cujo agente sumiu (`:137-148,182-188`, relay) | o alvo agente da agenda pula a conversa | nativo: o mesmo workflow da 24.2, que abre a conversa do agente; nunca o alvo agente da agenda, que pularia a conversa marcada (`C1`) e a apagaria sozinho | — | `A1`, `C1` da 24.2 | — |
| B1: agentes e workflows como dados | — | — | `addDynamicWorkflow` (`NM:mastra/index.d.ts:2038`), `rehydrateWorkflow` (`NM:workflows/dynamic/rehydrate.d.ts:50`), os passos (`NM:workflows/dynamic/validate/types.d.ts:89-113`), as recusas `missing-reference` (`:12`); fora do `ee` (só `./auth/ee` e `./agent-builder/ee` são `ee`, `package.json:104,114`); todos relay | o grafo como dados aponta ferramentas e agentes registrados pelo id | nativo; o agente desta etapa já é B1 | — | a resposta B | — |
| B2: o código na máquina | U5 | a máquina do Assistente (`builder/assistant/machine.ts:296-312`, relay) e a ferramenta de comando do Mastra (`NM:workspace/tools/execute-command.d.ts:3-59`, relay); o E2B sem chave e com a lista de endereços (`builder/machine/e2b.ts:17-27`, relay; decisão 0059) | — | o código roda na área de trabalho do agente | nativo | — | a resposta B | `builder/agents/scripts.ts` |
| B3: o código num Worker | U5' | o envio de versões dos apps (`platform/cloudflare.ts:200-241,284`, relay); o despacho (`apps/edge/src/dispatch.ts:151-152`, relay) | o vibesdk envia e despacha pelo mesmo caminho (`V:worker/index.ts:202-206`, `V:worker/services/deployer/api/cloudflare-api.ts:40,131-132`, relay) e usa o carregador de Workers só nas prévias (`V:wrangler.jsonc:153-155`, `V:space/src/space/durable-object.ts:752`, relay); o Code Mode roda o código num Worker carregado (`CF:packages/codemode/src/executor.ts:264,294,312-319`, relay), só JavaScript (`CF:packages/codemode/README.md:718-723`, relay) | o código sem chave, num isolado | nativo, com a porta do Hub ao despacho nova | — | a resposta B | — |

**A medida do transplante.** Nada vem do repositório antigo: ele não tinha agentes de Projeto.

**A dívida.**
- Os agentes não têm teto por Projeto: nenhuma referência ou medida dá um número. A lista lê todos os
  agentes do Projeto numa leitura só. Gatilho: um Projeto com mais de 50 agentes.
- As instruções do agente vão inteiras ao modelo a cada turno, até 4.000 caracteres (o teto do pedido
  da automação, `AUTOMATION_PROMPT_MAX`, que tem a mesma razão: o modelo lê o texto inteiro).
- O agente apagado no meio de um turno não para o turno em andamento (o `removeAgent` também não
  pararia, `NM:mastra-Da0Czfte.js:2142-2158`): a resposta já pedida termina.

**Issues futuras** (a abrir no fechamento).
- O `addAgent` por linha e o id de cada agente nos rastros: entram na 24.5 (o passo de workflow) e na
  21.1 (o rastro por agente).
- Editar um agente pela conversa com o Construtor.

## U1 Os agentes e a conversa com eles

**Base e modelo.** `main` depois do fechamento da 24.2. Opus: o escopo da conversa do Assistente, a
remoção e a ordem dela cruzam três módulos, e a tabela nova pede a palavra D11.

### As linhas da tabela

- **A linha.** O modelo é `builder.assistant_conversation`
  (`apps/server/src/builder/assistant/tables.ts:10-32`, lido): uma tabela de `builder`, só o Hub
  escreve, as chaves estrangeiras que levam a linha com a empresa e o Projeto. Ele cumpre C21 (o
  lugar é união no escopo, `context.ts:42-50`, lido), C23 (os ids com marca do `hub-api`) e C26 (um
  dono por fato).
- **O motor.** `assistantAgent` (`assistant.ts:245-313`; lido em `:270-300`): `instructions` por
  `assistantInstructions` (`instructions.ts`, relay), `tools` por pedido. `sessionScopes`
  (`context.ts:95-114`, relay) lê o escopo pelo `requestContext`; `scopeOn` (`context.ts:42-50`,
  lido) monta o lugar. `chosenConnections` lê a linha do Hub (`chosen.ts:28`, relay).
- **A conversa.** `openConversation` (`open.ts:12-51`, lido em `:1-51`); a marca do fio
  `SESSION_MARK` (`context.ts:42-48`, relay); o filtro por marca da lista (`routes.ts:183`, lido).
- **A remoção.** A ordem da 24.1 e da 24.2: `release.ts` das automações (`builder/automations/release.ts`,
  66 linhas, relay) é o modelo; os agentes saem depois das automações e antes das conversas.

### O raio da mudança

Nada sai do `main`.

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/agents/` | Cria `tables.ts` (`projectAgent`), `agents.ts` (o serviço: criar, listar, ler, apagar), `routes.ts`, `release.ts`, `public.ts` | `conversations-of.ts`, o Assistente, a U2, a U4 |
| `apps/server/migrations/` | Cria `<data>_e243_project_agent` (a tabela e a coluna `agent_id`) e `<data>_e243_project_agent_grants`, num commit próprio (D11) | `npm run check-migrations` |
| `apps/server/database-grants.sql` | Muda: `hub_company` com `SELECT, INSERT, DELETE` em `builder.project_agent`; `INSERT` de `agent_id` em `builder.assistant_conversation` vem com o `INSERT` que já existe | `catalog.test.ts` |
| `apps/server/src/builder/assistant/` | Muda `tables.ts` (`agent_id uuid null`, chave estrangeira para `builder.project_agent` com `on delete cascade`); `context.ts` (`SESSION_MARK.agent = 'conexusAgent'`; o escopo ganha `agent: AgentScope | null`); `chosen.ts` (lê `agent_id` com o lugar e a escolha); `open.ts` (`agentId`); `instructions.ts` (as instruções do agente depois das do Conexus); `assistant.ts` (o conjunto de ferramentas do agente); `routes.ts` (a criação com `agentId`, o filtro `agentId`, a recusa do `PUT` das ligações, `agent` no resumo) | as rotas, o workflow da 24.2 |
| `apps/server/src/builder/assistant/release.ts` | Muda: `releaseConversations` ganha o alvo por agente (a marca `conexusAgent`, de todas as pessoas) além de empresa, pessoa e Projeto | `builder/agents/release.ts` |
| `apps/server/src/conversations-of.ts` | Muda: monta os agentes e passa a sua leitura ao Assistente | `main.ts` |
| A remoção da empresa, da pessoa e do Projeto (os chamadores do `release` da 24.1 e da 24.2) | Muda: chama o `release` dos agentes depois das automações e antes das conversas | — |
| `packages/hub-api/src/agents.ts` | Cria: rotas, `AgentId`, `AgentSummary`, `CreateAgent`; muda `index.ts`, `failures.ts` (`AGENT_NOT_FOUND`, `AGENT_CONNECTIONS_FIXED`, com as frases), `assistant.ts` (`agentId` na criação e no filtro, `agent` no resumo), o OpenAPI gerado | a U2, a U3, a U4 |
| `scripts/removals.json` | Muda: as proteções novas (o membro recusado nas rotas dos agentes, S10; o agente de outro Projeto; a recusa do `PUT` das ligações), cada uma com o teste que a pega | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/agents.ts
const BASE = '/api/companies/{companyId}/projects/{projectId}/agents'
// GET    BASE                    -> { agents: AgentSummary[] }   acesso askAssistant; falhas: NOT_FOUND, SESSION_REQUIRED, DATABASE_UNAVAILABLE
// POST   BASE CreateAgent, attemptKey: true -> 201 { agent: AgentSummary }; falhas: as de leitura, REQUEST_MALFORMED, IDEMPOTENCY_CONFLICT
// GET    BASE/{agentId}          -> { agent: AgentSummary }; falhas: as de leitura, AGENT_NOT_FOUND
// DELETE BASE/{agentId}          -> 204; falhas: as de leitura, AGENT_NOT_FOUND
export const AGENT_NAME_MAX = 80                 // o mesmo da automação: a mesma linha nas listas
export const AGENT_INSTRUCTIONS_MAX = 4000       // a razão de AUTOMATION_PROMPT_MAX (a dívida)
export const AgentId = z.uuid().brand('AgentId') // conferido em agents.ts pela empresa e o Projeto (C23)
export const AgentName = z.string().trim().min(1).max(AGENT_NAME_MAX)
export const AgentInstructions = z.string().trim().min(1).max(AGENT_INSTRUCTIONS_MAX)
export const CreateAgent = z.object({
  name: AgentName, instructions: AgentInstructions,
  connections: z.array(ConnectionId).max(CONNECTIONS_MAX),   // CONNECTIONS_MAX sai de automations.ts para um dono só, exportado (C26)
  web: z.boolean(), appData: z.boolean(),
})
export const AgentConnection = z.object({ connectionId: ConnectionId, connector: z.string(), name: z.string(), offered: z.boolean() })
export const AgentSummary = z.object({
  id: AgentId, projectId: ProjectId, name: AgentName, instructions: AgentInstructions,
  connections: z.array(AgentConnection), web: z.boolean(), appData: z.boolean(),
  createdBy: z.object({ personId: PersonId, name: z.string() }).nullable(),   // null: a pessoa saiu da empresa
  createdAt: z.iso.datetime(),
})
// packages/hub-api/src/assistant.ts (muda)
const OpenedFor = z.object({ agentId: AgentId, name: z.string() }).nullable()   // o agente apagado leva a conversa: nunca um nome sem agente
// AssistantConversationSummary e AssistantConversation ganham `agent: OpenedFor`
// createAssistantConversation: body ganha `agentId: AgentId.optional()`; falha nova AGENT_NOT_FOUND
// listAssistantConversations: query ganha `agentId: AgentId.optional()`
// setAssistantConnections: falha nova AGENT_CONNECTIONS_FIXED (409)
```

```ts
// apps/server/src/builder/agents/tables.ts
// builder.project_agent: id uuid pk; company_id text not null -> companies (cascade);
// project_id text not null -> projects (cascade); created_by text null -> people (set null);
// name text not null; instructions text not null; connections uuid[] not null;
// web boolean not null; app_data boolean not null; body_hash text not null; created_at timestamptz not null default now()
// a política da empresa como a de assistant_conversation: policy(SCOPE_ROLES.COMPANY, 'all', OWN) por company_id
// (os nomes reais das tabelas das chaves: os de `company`, `project` e da pessoa em `hub/identity`)
// apps/server/src/builder/assistant/context.ts (muda)
/** O agente que a conversa roda: a linha lida a cada pedido, um dono só (C26). */
export type AgentScope = Readonly<{
  agentId: AgentId; name: string; instructions: string
  connections: readonly ConnectionId[]; web: boolean; appData: boolean
}>
// SessionScope (hub/connectors/public.ts) não muda; o escopo do Assistente vira:
export type AssistantScope = SessionScope & { agent: AgentScope | null }
// apps/server/src/builder/agents/public.ts
export type Agents = {
  routes: (app: FastifyInstance) => void
  scopeOf: (owner: Owner, agentId: AgentId) => Promise<AgentScope>       // AGENT_NOT_FOUND
  release: (scope: { companyId: CompanyId; projectId?: ProjectId; personId?: PersonId }) => Promise<number>
  onDelete: (hook: (agent: { companyId: CompanyId; agentId: AgentId }) => Promise<void>) => void   // a U4 registra as automações
}
```

O id do agente nasce de `uuidv5(companyId:personId:attemptKey)`, como o id derivado da automação da
24.2; o `body_hash` decide `IDEMPOTENCY_CONFLICT`. As ligações gravadas são as pedidas que o
Projeto oferece na criação (`connectors.connections(scope)`); a cada turno, as do agente que o
Projeto ainda oferece (C26: o Projeto é o dono da oferta, o agente da escolha). Numa conversa de
agente, `sessionScopes` troca o `chosen` do escopo pelas ligações do agente; a coluna
`connections` da linha da conversa é só a foto da abertura e ninguém a lê. As ferramentas, as
skills de cada ligação e o bloco das ligações nas instruções seguem o mesmo `chosen`.

As instruções do turno: o texto do Conexus (`conexus.md`) e o bloco da conversa que a 24.1 já
monta (a empresa, a pessoa, a data, o lugar e as ligações), depois `"Você é o agente <nome> deste
Projeto. Siga estas instruções:"` e as instruções do agente, depois uma frase fixa de que o agente só
lê e diz isso quando pedirem para gravar (o critério 4 e o passo 4 do roteiro). O texto do Assistente
(`assistant.md`) não entra numa conversa de agente.

O conjunto de ferramentas do agente: `toolsOf(model)` só com `web`; `show_file`; as da máquina
(`AVAILABLE_TOOLS` como a 24.1); `connectorTools(accessOf(...), { noteSave: false })` sobre as
ligações do agente; `propose_automation` (a U4 lhe dá o alvo); nunca `propose_app` nem
`conexus_overview`. A U2 acrescenta `app_data_read`.

### As skills e a leitura

`mastra` (o agente dinâmico e o controlador na versão instalada), `fastify-best-practices`,
`pstack:tdd`; as linhas de `docs/reference/stack.md` para `apps/server/src/builder/` e
`apps/server/migrations/`. [data](../guides/data.md) D11, D17; [testing](../guides/testing.md) T5,
T12.

### A ordem do trabalho

1. **A prova primeiro.** `assistant.test.ts`, "as ferramentas do agente": cria um agente pela rota,
   abre a conversa com `agentId`, manda uma pergunta ao modelo dublê e lê as ferramentas e o texto do
   sistema da chamada; falha hoje.
2. A migração da tabela e da coluna; num commit próprio, a das permissões e `database-grants.sql`
   (D11). `npm run check-migrations`.
3. `agents.ts`, `routes.ts`, os contratos do `hub-api`, o OpenAPI.
4. O escopo: `chosen.ts` lê `agent_id`; `sessionScopes` lê a linha do agente por `scopeOf`;
   `instructions.ts` e `assistant.ts` com o ramo do agente. Regras: C21, C23, C26, C27.
5. `open.ts` e `routes.ts` do Assistente: `agentId` na criação (o lugar e as ligações do agente), o
   filtro, a recusa do `PUT`, `agent` no resumo.
6. `release.ts` e `onDelete`; a ordem nas remoções da empresa, da pessoa e do Projeto. Regras: D17,
   S10, T12.

### Como se prova

Cada critério da U1 pelo teste da sua linha, pela porta pública: as rotas pelo servidor de teste,
o turno pelo modelo dublê da 12 e o dublê do Sankhya da 24.1, o Postgres de teste com os dois
bancos (o do Hub e o do Mastra). O teste que falha hoje: `assistant.test.ts`, "as ferramentas do
agente". Comando: os testes tocados, `npm run typecheck`, `npm run lint`, `npm run check-migrations`.

### Parar se

- O escopo da conversa não alcança a linha do agente dentro do `requestContext` sem uma leitura por
  chamada de ferramenta (o `scopeOf` da 24.1 já guarda o escopo por `RequestContext`): relata, com a
  contagem de leituras do teste.
- O ramo do agente muda o pedido do modelo de uma conversa do Assistente sem agente (o texto do
  sistema ou a ordem das ferramentas): para; as conversas da 24.1 ficam iguais byte a byte.
- A chave estrangeira com `on delete cascade` de `assistant_conversation.agent_id` pede uma permissão
  que a D11 do cartão não deu: para e relata.

## U2 Os dados do app

**Base e modelo.** `main` depois da U1. Sonnet: um login e uma ferramenta, sobre o login do app da
9, com a regra de segurança escrita aqui.

### As linhas da tabela

- `appLogin` (`packages/hub-api/src/app-login.ts:8-15`, lido) e `appLoginPassword` (`:24-36`,
  lido; decisão 0043).
- `schemaStatements` e `ensureApp` (`apps/server/src/platform/company-postgres.ts:148-187`, lido):
  os logins nascem se faltam, as permissões repetem sem erro, `APP_CALL_LIMITS` nos tempos do login
  que roda.
- `neonTransport` (`company-postgres.ts:65-81`, relay) e `asLogin` (`:~118`, relay); o banco do
  Projeto pela empresa (`projects.readyDatabaseOf`, `company-database.ts:103`, relay).
- O corte das linhas ao modelo: o mesmo de `connector_read` (20 linhas, 16 KB); a U2 importa o dono
  dele, nunca copia o número (C26).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/app-login.ts` | Muda: `readLogin: app_<projeto>_read` | `company-postgres.ts`, `apps/edge` (não usa) |
| `packages/hub-api/src/assistant.ts` | Muda: `ASSISTANT_TOOL.appDataRead = 'app_data_read'`, que entra no conjunto fechado do controlador do Assistente (`AVAILABLE_TOOLS`, `assistant.ts:79-87`); nunca em `CLOSED_TOOLS` de `tools.ts`, que é o do Construtor | o Assistente, a web (a linha da ferramenta) |
| `apps/server/src/platform/company-postgres.ts` | Muda: `ensureApp` cria os três logins; `schemaStatements` dá ao de leitura só `USAGE` no esquema e `SELECT` (nenhum `CREATE`, nenhuma sequência, nenhum `EXECUTE` além do `PUBLIC`): nas tabelas futuras pelo `ALTER DEFAULT PRIVILEGES` que já roda como o login de migração (depois do `SET LOCAL ROLE`), nas que existem tabela por tabela, menos o livro das migrações (ou `GRANT … ON ALL TABLES` seguido de `REVOKE` no livro); mais `default_transaction_read_only = on` e os tempos do app, como profundidade; cria `readApp(projectId, sql)`, que manda cada consulta como `sql.transaction([…], { readOnly: true })` (o `BEGIN READ ONLY` explícito do `@neondatabase/serverless`, `index.d.ts:491-496`, relay), e `ensureReadLogin(projectId)` na porta `CompanyPostgres` | `builder/agents/app-data.ts` |
| `apps/server/src/builder/agents/` | Cria `app-data.ts` (a ferramenta) | `assistant.ts` |
| `apps/server/src/builder/assistant/assistant.ts` | Muda: `app_data_read` no conjunto do agente com `appData`, só quando o Projeto tem app | — |
| `apps/web/src/builder/conversation/` | Muda: a linha da ferramenta ("Lendo dados do app") no registro das ferramentas | — |

### Os contratos que a unidade cria

```ts
// apps/server/src/platform/company-postgres.ts (porta CompanyPostgres)
readApp(input: { companyId: CompanyId; projectId: ProjectId; sql: string; signal: AbortSignal }): Promise<AppRead>
export type AppRead =
  | { kind: 'ROWS'; columns: readonly string[]; rows: readonly unknown[][] }
  | { kind: 'REFUSED'; code: 'APP_DATA_REFUSED' }       // a recusa do Postgres: 25006 (transação de leitura), 42501 (sem permissão), 42601 (vários comandos, se o protocolo estendido os recusa)
  | { kind: 'FAILED'; code: 'APP_DATA_UNAVAILABLE' | 'APP_DATA_TIMEOUT' | 'APP_DATA_NO_APP' }
// apps/server/src/builder/agents/app-data.ts
export const AppDataInput = z.object({ sql: z.string().trim().min(1).max(4000) })   // a mesma razão de AGENT_INSTRUCTIONS_MAX
```

A barreira é a permissão: o login só tem `SELECT`, então nenhum `SET` da sessão o faz gravar; a
transação de leitura e o padrão do login são profundidade. A ferramenta devolve ao modelo as colunas e as linhas cortadas, ou a frase do código em português
("Só leio os dados do app.", "O banco do app não respondeu.", "A consulta passou do tempo."). O SQL
e as linhas nunca vão ao registro do processo (C50).

### As skills e a leitura

`node`, `pstack:tdd`; a documentação do PostgreSQL 17 para `ALTER ROLE … SET`,
`ALTER DEFAULT PRIVILEGES` e `GRANT`; as linhas de `docs/reference/stack.md` para
`apps/server/src/platform/`. [security](../guides/security.md) para o login e a recusa no banco.

### A ordem do trabalho

1. **A prova primeiro.** `app-data.test.ts`, "não grava": um esquema de app com uma tabela no
   Postgres de teste, a consulta `DELETE` pela ferramenta, a tabela inteira depois; falha hoje (a
   ferramenta não existe).
2. `readLogin` em `app-login.ts`; os três logins em `ensureApp`; as permissões do login de leitura,
   sem o livro das migrações (o critério 11 o confere num Projeto novo e num de antes).
3. `ensureReadLogin` (o mesmo `ensureApp`, só a parte do login, para um Projeto de antes) e `readApp`.
4. `app-data.ts` e o seu lugar no conjunto do agente; a linha da ferramenta na web.

### Como se prova

O Postgres de teste no lugar do Neon pela porta `CompanyPostgres` (como os testes da 9 e da 15);
cada recusa do critério 10 é uma consulta e a releitura da tabela. O teste que falha hoje: "não
grava". Comando: os testes tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- Um comando de escrita passa pelo login de leitura em qualquer forma: para; a recusa é do banco ou
  não há ferramenta.
- O primeiro teste manda `SELECT 1; SELECT 2` por `readApp` e grava o código que volta: se o
  transporte do Neon por HTTP usa o protocolo simples e roda os dois, o critério 10 diz 42501 para a
  escrita (a permissão), não 42601; relata o código e ajusta a frase do critério, nunca um filtro.
- O transporte não aceita `readOnly` na transação: para e relata; a permissão continua a barreira.
- O login de leitura precisa de uma permissão que o dono do banco não pode dar sem a palavra D11 do
  fundador para o banco das empresas: para e relata.

## U3 O Construtor propõe e as telas

**Base e modelo.** `main` depois da U2. Sonnet: uma ferramenta que propõe e telas sobre contratos
prontos.

### As linhas da tabela

- `propose_automation` como modelo (`builder/assistant/propose-automation.ts:12-29`, lido): a
  ferramenta só devolve a proposta, e o fio a guarda com a chamada.
- As ferramentas do Construtor (`builder/conversation/builder.ts:221-232`, lido): `propose_agent`
  entra **depois** das que já existem, porque o critério 13a da 20 guarda o pedido do modelo igual
  byte a byte.
- O cartão da 24.2 (`apps/web/src/builder/automations/proposal.tsx`, 93 linhas, relay;
  `ASSISTANT_OVERRIDES` em `assistant-specs.ts`, lido em `:6-57`) e o registro das ferramentas do
  Construtor (`tool-registry.ts`, `tool-spec.ts`, relay).
- A barra do Projeto (`apps/web/src/hub/projects/project-rail.tsx:150-163`, lido): **Agentes** entra
  entre **Conversas** e **Automações**, escondida do membro como **Automações**.
- As páginas da conversa do Assistente no Projeto
  (`routes/_app/companies/$companyId/projects/$projectId_.assistant.*`, relay).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/conversation/` | Cria `propose-agent.ts`; muda `builder.ts` (a ferramenta no fim da lista, com o Projeto) e `prompt/builder.md` (quando propor um agente; a linha 15, que diz que os conectores "vêm depois", corrigida: a #540) | — |
| `packages/hub-api/src/` | Muda `tools.ts` (`BUILDER_TOOL.proposeAgent = 'propose_agent'`), `agents.ts` (`ProposedAgent`) | a web |
| `apps/web/src/builder/agents/` | Cria `proposal.tsx` (o cartão), `agents.tsx` (a lista), `agent-page.tsx` (a página e o painel), `queries.ts`, `text.ts` | as rotas |
| `apps/web/src/builder/conversation/` | Muda o registro das ferramentas do Construtor (o cartão de `propose_agent`) | — |
| `apps/web/src/builder/assistant/` | Muda: a etiqueta **Agente · <nome>**, o título da conversa e a caixa sem o escolhedor de ligações numa conversa de agente | — |
| `apps/web/src/hub/projects/project-rail.tsx` | Muda: a entrada **Agentes** | — |
| `apps/web/src/routes/_app/companies/$companyId/projects/` | Cria `$projectId_.agents.index.tsx` e `$projectId_.agents.$agentId.tsx` | — |
| `docs/reference/screens.md` | Muda: as duas telas novas | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/agents.ts (U3)
export const ProposedAgent = CreateAgent.extend({ summary: z.string().trim().min(1).max(280) })   // as duas linhas do cartão; não é gravado
// apps/server/src/builder/conversation/propose-agent.ts
export function proposeAgentTool(deps: {
  offeredOf: (requestContext: RequestContext) => Promise<readonly ConnectionId[]>   // as ligações do Projeto da conversa
  hasAppOf: (requestContext: RequestContext) => Promise<boolean>
}): Tool<ProposedAgent, ProposedAgent>   // filtra as ligações e põe appData falso sem app; não grava
```

### As skills e a leitura

`shadcn`, `impeccable` (as telas), `pstack:tdd`; as linhas de `docs/reference/stack.md` para
`apps/web/src/` e `apps/server/src/builder/`. [web](../guides/web.md) W7, W30, W34;
[design](../guides/design.md) e [Impeccable](../reference/impeccable.md) para as telas.

### A ordem do trabalho

1. **A prova primeiro.** `builder.test.ts`, "propor um agente": o modelo dublê pede `propose_agent`
   numa conversa do Construtor; a saída é a proposta filtrada; falha hoje.
2. `propose-agent.ts`, a sua entrada em `builder.ts`, a frase em `builder.md`.
3. O cartão e o seu teste; as rotas e as páginas; a entrada na barra; a etiqueta na conversa.
4. `docs/reference/screens.md`. Regras: W7, W30, W34, C21.

### Como se prova

O servidor pelo modelo dublê; as telas pelos testes de `apps/web` com o servidor dublê de cada tela,
e o QA da etapa para as larguras e os temas. O teste que falha hoje: "propor um agente". Comando:
os testes tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- A ferramenta nova muda o pedido do modelo antes das ferramentas que já existiam: para (o critério
  13a da 20).
- A conversa do agente não cabe na tela da conversa do Assistente sem um segundo componente de
  conversa: para e relata; a página do agente reusa a conversa, nunca a copia.

## U4 A automação roda um agente

**Base e modelo.** `main` depois da U1. Sonnet: um campo novo num contrato que já tem a sua versão.

### As linhas da tabela

- `AutomationInput` (`builder/automations/run.ts:37-50`, relay) com `version: z.literal(1)`; a
  criação (`automations.ts:137-145`, relay); `ownedOf` lê o `inputData` (`automations.ts:~52`,
  relay).
- `conversed` (`run.ts:96-142`, lido em `:90-130`): a conversa aberta por `deps.assistant.open`.
- `propose_automation` (`propose-automation.ts:12-29`, lido).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/automations/` | Muda `run.ts` (`AutomationInput` como união das versões 1 e 2; `target`; `check` lê o agente; `conversed` abre a conversa com `agentId`), `automations.ts` (a criação com `agentId`, a conferência), `release.ts` (as automações de um agente, pelo `onDelete` da U1) | — |
| `apps/server/src/builder/assistant/propose-automation.ts` | Muda: numa conversa de agente, a proposta sai com `agentId` do escopo | — |
| `packages/hub-api/src/automations.ts` | Muda: `CreateAutomation.agentId?`, `ProposedAutomation.agentId?` (posto pela ferramenta), `AutomationSummary.agent`, `RunOutcome` `SKIPPED` com `AGENT_GONE` | a web |
| `apps/web/src/builder/automations/` | Muda: **Roda: <nome>** no cartão e na linha da lista; "Não rodou: o agente foi apagado." | — |

### Os contratos que a unidade cria

```ts
// apps/server/src/builder/automations/run.ts
export const AutomationTarget = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('ASSISTANT') }),
  z.object({ kind: z.literal('AGENT'), agentId: AgentId }),
])
const V1 = AutomationInputV1                                    // o de hoje, sem mudar
const V2 = V1.extend({ version: z.literal(2), target: AutomationTarget })
export const AutomationInput = z.discriminatedUnion('version', [V1, V2])
export function targetOf(input: AutomationInput): AutomationTarget   // V1: ASSISTANT; um dono só (C26)
// packages/hub-api/src/automations.ts
// RunOutcome SKIPPED: reason: z.enum(['OWNER_CANNOT_ASK', 'AGENT_GONE'])
// AutomationSummary: agent: z.object({ agentId: AgentId, name: z.string() }).nullable()
```

Uma automação com alvo agente é do Projeto do agente: a versão 2 com `AGENT` e o lugar `COMPANY`, ou
outro Projeto, é recusada na criação (`AGENT_NOT_FOUND`) e, se aparecer no `inputData`, o `check` a
termina `SKIPPED` com `AGENT_GONE`, como o agente apagado. Ela grava as ligações do
agente; o pedido roda nele. O nome do agente no resumo é lido da linha (nenhum nome
guardado na automação).

### As skills e a leitura

`mastra` (a agenda e o workflow da 24.2), `pstack:tdd`. [testing](../guides/testing.md) T5, T12, T26.

### A ordem do trabalho

1. **A prova primeiro.** `run.test.ts`, "a linha antiga": uma linha da agenda gravada com o
   `inputData` da versão 1 roda o Assistente; e "o agente": falha hoje.
2. `AutomationInput` como união e `targetOf`; `check` e `conversed`.
3. A criação, a recusa, o resumo; `propose_automation`.
4. `release.ts` pelo `onDelete` da U1; as telas.

### Como se prova

A agenda de verdade num Postgres de teste com o tique curto (o modelo da 24.2), o modelo dublê. O
teste que falha hoje: `run.test.ts`, "o agente". Comando: os testes tocados, `npm run typecheck`,
`npm run lint`.

### Parar se

- Uma linha da agenda da 24.2 deixa de ser lida (a versão 1): para; mudar `AUTOMATION_WORKFLOW`
  apagaria todas as linhas (`run.ts:27`).
- O nome do agente precisa ser guardado na automação para a lista: relata; o cartão quer a linha
  como dona.

## U5 O script do agente na máquina (só com B2)

**Base e modelo.** `main` depois da U3. Sonnet.

- **A linha.** `builder.project_agent` ganha `scripts jsonb not null default '[]'`: até 5 scripts
  `{ name, language: 'python' | 'node', source }`, cada um até 20.000 caracteres (a medida de um
  script de análise do Assistente na 24.1 a fazer na U5; sem medida, o número volta ao cartão).
- **A máquina.** Na abertura do turno de um agente, `machine.ts` grava os scripts em `scripts/` da
  área de trabalho (o `SandboxFilesystem` da 24.1); o agente os roda com
  `mastra_workspace_execute_command` sobre os arquivos que as leituras gravaram. Nenhuma chave na
  máquina, a lista de endereços da 0059.
- **O Construtor.** `propose_agent` aceita `scripts`; o cartão mostra os nomes.
- **Critérios.** Um script do agente roda sobre a leitura do Sankhya e devolve a tabela; um script
  que tenta um endereço fora da 0059 é recusado pela rede da máquina; a máquina não tem variável de
  ambiente com chave.

## U5' O Worker do agente (só com B3)

**Base e modelo.** `main` depois da U3. Opus: uma porta nova do Hub ao despacho.

- O script do agente, só JavaScript, vira uma versão `t-<agente>-<n>` no namespace dos apps, sem
  ligação nenhuma e com `cpu_ms` de `APP_CALL_LIMITS`, pelo `upload` de `platform/cloudflare.ts`.
- A ferramenta `agent_script` chama o Worker pelo dispatcher com a entrada em JSON; o Worker não
  alcança o Hub nem o banco (as ligações vazias) e a saída de rede passa pelo `conexus-outbound`.
- A porta nova: o Hub chama o dispatcher por um endereço do edge com um segredo do Hub; hoje só o
  edge chama o Hub (`platform/edge-server.ts:7`). O cartão volta ao fundador se a porta pedir um
  produto pago.
