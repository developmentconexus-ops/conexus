# Etapa 24.5: Os agentes escrevem, com aprovação

O roteiro chama esta etapa de "24.5 Os agentes escrevem, com aprovação. Um agente ou app pede
"Aprovar?" antes de escrever (resposta B, 2026-10-18; leva a 20.1)". Ela vem depois de Papéis da
empresa, que o fundador pôs antes desta ("5. Sim", 2026-11-03), e se apoia nela inteira: o papel
diz **quem** usa uma operação, a liberação ao Projeto diz **onde**, e a versão do agente diz **se
ele pergunta** (Papéis, `D1` e `E4`). Pela regra L5, este cartão espera em rascunho a vaga da
fronteira, e a verificação `second-card` fica vermelha nele de propósito. Cada linha citada foi
relida no `main` em `1f5be4fb`, com `@mastra/core` 1.82.0, `@mastra/server` 1.82.0 e `@mastra/pg`
1.35.0. As unidades de Papéis ainda não estão no `main`: o construtor de cada unidade reabre as
linhas no `main` do dia, depois delas.

## A página do fundador

**No fim desta etapa** um agente seu lança um pedido de venda no Sankhya. Quando a ferramenta está
em **Pergunta antes**, você vê na conversa o pedido inteiro e só depois do seu **Aprovar** ele é
lançado. Quando está em **Faz sozinho**, ele lança e diz o número.

**O roteiro de uso.** Você é a Ana (dona). A ligação do Sankhya está liberada ao Projeto "Vendas",
e o agente "Pedidos" existe nele.

1. Na página do "Pedidos", selecione a ligação do Sankhya. Embaixo aparecem as ferramentas dela,
   nenhuma marcada, e no fim do grupo a escrita **Lançar pedido**, marcada "escreve". Marque-a. Na
   linha dela aparece a chave **Pergunta antes** (já escolhida) ou **Faz sozinho**. Publique.
2. Na conversa do "Pedidos", peça "lança um pedido para o cliente 1, duas unidades do produto 8 a
   R$ 10, no modelo de nota 12". Aparece o cartão **O Pedidos quer lançar um pedido no Sankhya**, com
   o cliente, os itens, o total e a observação. Toque **Aprovar**. O cartão passa a "Aprovado por
   você", e o agente diz o número do pedido, "a confirmar".
3. Peça outro pedido. Em vez de tocar no cartão, escreva "espera, são três unidades". O cartão passa
   a "Recusado porque você mandou outra mensagem", e o agente faz um cartão novo com três.
4. Toque **Recusar** nesse cartão. Nada é lançado, e o agente diz que não lançou.
5. Peça mais um, feche a página e abra a conversa de novo: o cartão continua esperando, e
   **Aprovar** funciona.
6. Volte à página do "Pedidos", mude **Lançar pedido** para **Faz sozinho** e publique. Peça um
   pedido: ele é lançado sem cartão, e a conversa mostra a linha da ferramenta com o número. No
   Sankhya, os pedidos estão lá "a confirmar"; cancele ou apague os de teste pela tela dele.

**O que você faz, e quando.** Antes: nada. No começo: responde às decisões abaixo e aprova esta
página. No fim: faz o roteiro no Sankhya de verdade da sua empresa, diz o que viu e aprova os textos
das telas.

**As suas respostas ao rascunho de 2026-11-06, e o que mudou por elas.** Cada uma como você
escreveu.

- **A.** "quero entender melhor se não tem mastra nativo por causa de nossa decisão ou se tem outro
  caminho entendeu?" Era sintoma, e agora é o nativo. A perda de leituras vinha de um defeito do
  Mastra que aparece só quando ele **se aprova sozinho** na hora (o relatório da causa, issue
  #27831 do Mastra, fechada lá sem conserto). O caminho nativo tem dois pedaços: cada ferramenta diz
  por si se pergunta (`requireApproval` como função, que o Mastra trata como a palavra final dela) e
  o `yolo` fica desligado no controlador dos agentes. Assim uma leitura nem para, e uma escrita que
  pergunta espera você. Medido aqui no Postgres: 0 de 200 perdidas. A `suspend()` do rascunho saiu.
- **B.** "se eu colocar um agente para ele ... conversar com uma pessoa no WhatsApp, ou eu quiser
  dar autonomia para ele, eu duvido que LangChain, Google, N8N e outros, eles não têm isso de ...
  dar autonomia, dependendo da coisa." Têm, e por ferramenta. É a sua `D1` de Papéis: cada
  ferramenta do agente tem a chave **Pergunta antes** ou **Faz sozinho**. Ler faz sozinho sempre.
  Escrever começa em "Pergunta antes", e só quem tem **Publicar agente que escreve sozinho** no
  papel (o Dono e o Administrador, e os papéis a que você der) deixa uma escrita em "Faz sozinho".
  O "sempre permitir" do rascunho saiu.
- **C.** "a gente tem que estar coeso a nossa plataforma inteira ... Também não pode querer criar
  uma coisa que não faz sentido em enrijecer." A escrita entra como mais uma linha de ferramenta, no
  mesmo lugar das leituras (a `E4`), com o mesmo teto (o papel de quem publica, a `C1`) e o mesmo
  funil que confere o papel em toda leitura. A liberação de escrita por Projeto do rascunho saiu da
  recomendação: seria um quarto lugar (decisão `A`).
- **D.** "responder uma pergunta do Mercado Livre pelo agente depende muito de vir uma pergunta ...
  Poderia ser lançar um pedido no Sunker, que aí eu consigo deletar depois." A primeira escrita é
  lançar um pedido no Sankhya. Pela API, o pedido nasce "a confirmar"; desfazer pela API é
  **cancelar**, com um motivo, e um pedido faturado não cancela. Apagar de vez fica na tela do
  Sankhya (decisão `B`).

**O que o estudo mostrou** (2026-11-05 a 07, desta máquina, com modelo de mentira e Postgres 18
local; **medido** saiu de uma execução aqui).

- **O caminho nativo pergunta e espera** (medido no Postgres). Com o `yolo` desligado, a escrita que
  pergunta para antes de rodar; **Aprovar** roda uma vez; **Recusar** não roda; duas respostas ao
  mesmo tempo rodam uma vez; uma mensagem sua recusa o pedido aberto, e um **Aprovar** atrasado
  depois dela não roda nada; depois de reiniciar o Hub, o pedido guardado ainda se responde e roda
  uma vez; 20 conversas aprovadas ao mesmo tempo rodaram cada escrita uma vez.
- **Aprovar sozinho é o que perde chamadas** (medido, Papéis e a causa). A aprovação automática pela
  regra da sessão perdeu 12 de 200; com a regra em cada ferramenta, 0 de 200. Uma resposta sua 1,5 s
  depois do cartão, o tempo de alguém ler, perdeu 0 de 200; o cartão acende os botões só depois de
  o pedido estar guardado.
- **Uma porta a fechar**: a ferramenta "programa" da 24.4 chama as ferramentas do agente direto, sem
  passar pela pergunta (`@mastra/core` 1.82.0, `tools-BVDic2bB.js:480-482`). Uma escrita nunca entra
  no programa; só fica direta.
- **O Sankhya não tem chave contra repetição** (documentado, sem chamar o Sankhya). Se a resposta
  se perde depois do envio, o pedido talvez exista. O Conexus guarda cada envio antes de mandar e
  nunca manda de novo a mesma chamada: diz que não sabe se lançou e põe na observação do pedido
  uma marca "Conexus" para você achá-lo.
- **O que as empresas fazem** (relido em 2026-11-06 para Papéis, 17 fornecedores). Autonomia por
  ferramenta (OpenAI, LangChain, Google ADK, n8n, Copilot Studio, Agentforce, ServiceNow, Claude
  Code). O cartão mostra a ação e o que vai ser escrito. Quem aprova é quem está na conversa; a
  autoridade é a do agente, dada por quem o montou (Copilot Studio com a credencial do criador,
  Agentforce com o usuário do agente). É a sua `C1`: quem conversa com o "Pedidos" aprova, e hoje
  conversam com agentes o Dono, o Administrador e o Desenvolvedor; o Membro não chega à conversa
  de um agente.

**Fica de fora.**

- **O app que escreve** (a antiga 20.1). Usa o mesmo funil de escrita, numa etapa curta depois.
- **Escrever sem ninguém da empresa olhando** (uma automação, um cliente no WhatsApp ou Telegram).
  Pela `D1` de Papéis, ali uma escrita que pergunta não é oferecida; a 24.6 e a 24.7 decidem quem
  responde. Hoje nenhum agente roda sem uma pessoa da empresa na conversa.
- **O Assistente escrevendo num sistema.** Ele continua só lendo; o `yolo` dele não muda.
- **Uma regra por valor** ("até R$ 1.000 faz sozinho", a `D3` de Papéis). O Mastra deixa, fica para
  depois.
- **Editar os campos no cartão antes de aprovar.** Você recusa escrevendo o que muda, como no passo 3.
- **Um prazo para o cartão.** Nenhuma referência lida tem; ele espera até você responder, mandar
  outra mensagem ou parar a conversa.
- **Os avisos guardados para um cartão** (`next-card`): nenhum toca a escrita de um agente.

**As decisões suas nesta etapa.** A recomendação de cada uma vem primeiro.

- **A. Liberar a ligação ao Projeto deixa os agentes dele escreverem, ou a escrita pede uma
  liberação à parte?**
  - `A1` (recomendo): não pede à parte. O papel já diz quem usa cada escrita, e uma escrita nova do
    kit chega só ao Dono e ao Administrador até você marcá-la em outro papel (`B1` de Papéis): é o
    "Escrita nova pede nova liberação" do roteiro. Caso real: o Claude Enterprise dá a cada papel os
    conectores e as ações, sem segundo lugar. Exemplo: a ligação do Sankhya já liberada ao "Vendas"
    serve ao "Pedidos" para lançar, se quem publica tem **Lançar pedido** no papel. Objetivo: três
    donos, nenhum repetido. Nativo: nada novo além da linha de ferramenta; muda só o texto da
    confirmação de "Liberar", que hoje diz que é só para ler.
  - `A2`: uma caixa **Liberar para escrever** por Projeto, além do papel. Caso real: o Activepieces
    escolhe as ações por projeto. Exemplo: o "Vendas" lê o Sankhya, mas só lança pedido depois de
    você marcar a escrita ali. Como: uma coluna nova na liberação, uma caixa e a permissão de banco
    (D11), cerca de 400 linhas nossas; é a recomendação antiga, que você achou rígida.
- **B. Desfazer o pedido pelo agente entra agora?**
  - `B1` (recomendo): não. A etapa traz só **Lançar pedido**; o agente diz o número, e você cancela
    ou apaga pela tela do Sankhya. Caso real: o Glean e o Copilot Studio começam pela ação que cria e
    deixam cada outra como ferramenta própria. Objetivo: provar o caminho inteiro com uma escrita só.
    Nativo: nada a mais.
  - `B2`: também **Cancelar pedido**, outra escrita com a mesma chave, que pede um motivo
    (`POST /v1/vendas/pedidos/{codigoPedido}/cancela`). Não apaga, e um pedido faturado não cancela.
    Se a API cancela um pedido ainda "a confirmar" não está documentado; a construção prova no
    dublê e você no Sankhya de verdade. Cerca de 250 linhas a mais.

## O que este cartão tira do rascunho de 2026-11-06

A `suspend()` na ferramenta que escreve, a conferência nossa de "a pessoa mandou outra mensagem" e
o motivo escrito ao recusar (a rota nativa não leva motivo; você escreve uma mensagem); a resposta
de uma pergunta do Mercado Livre, a sua operação e o dublê; a coluna `writes` em
`project_connection`, a caixa **Liberar para escrever** e a sua permissão D11 (se `A1`); a marca
**Pede aprovação** na biblioteca e as três formas de "sempre permitir"; o critério da carga com a
`suspend()` e o reinício não provado (o reinício está medido no caminho nativo); o 401 repetido numa
escrita.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 A escrita no Sankhya | A operação `lancar_pedido` (classe `write`) e o dublê dos pedidos; o funil de escrita `writeThrough`, gêmeo do `readThrough`, com o mesmo `mayUse`; o registro de cada envio por `toolCallId` antes de mandar; o executor que nunca repete uma escrita depois de enviada | `packages/connectors/src/{kernel,sankhya}/`, `apps/server/src/hub/connectors/`, `apps/server/migrations/`, `apps/server/database-grants.sql` | [data](../guides/data.md) | esta página aprovada; Papéis U2 no `main` |
| U2 O agente pergunta ou faz sozinho | O `yolo` desligado no controlador dos agentes; `requireApproval` em função em toda ferramenta do agente; a ferramenta da escrita com a chave da versão; a ação **Publicar agente que escreve sozinho** e a conferência ao publicar; a escrita fora do programa; a rota `tool-approval` na lista fixa; os registros; as gravações do Mastra | `apps/server/src/builder/{agents,conversation,machine,controller-kit}/`, `apps/server/src/hub/identity/`, `apps/server/src/platform/recordings/mastra/`, `packages/hub-api/src/{agents,tools,roles}.ts` | [security](../guides/security.md) | U1; Papéis U2 e U3 no `main` |
| U3 As telas | A chave **Pergunta antes / Faz sozinho** na linha da escrita da página do agente; o cartão **Aprovar?** na conversa do agente e os seus estados; a ação nova na tela de Papéis; o texto da confirmação de "Liberar" | `apps/web/src/builder/{agents,conversation}/`, `apps/web/src/hub/{identity,connectors}/`, `docs/reference/screens.md` | [web](../guides/web.md) | U2 |

Correm em fila: a U2 chama o funil da U1, e a U3 lê o contrato e o evento da U2.

**O método das unidades.** Cada unidade segue o `pstack:poteto-mode` como as skills do repositório
já o chamam ([`conexus-scope`](../../.agents/skills/conexus-scope/SKILL.md), passo 4;
[`conexus-build`](../../.agents/skills/conexus-build/SKILL.md)). O cartão não repete o método.

**Orçamento de código alterado.** U1: ~750 (a operação e o dublê dos pedidos, o funil, o registro e
a sua migração, o executor sem repetição). U2: ~500 (o controlador, as regras de cada tipo de
ferramenta, a ferramenta da escrita, a coluna da chave, a ação e a conferência de publicar, o
programa sem escrita, a rota, os registros, as gravações). U3: ~600 (a chave na linha, o cartão e
os seus estados, a ação na tela de Papéis, o texto). Total da etapa: ~1.850, dentro da regra L2
(estimado pela leitura, sem protótipo). Com `A2`, ~2.250; com `B2`, ~250 a mais.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `writeThrough` com uma versão (`speaker: VERSION`) que declara `lancar_pedido` manda ao dublê do Sankhya um `POST /v1/vendas/pedidos` com os campos e devolve `{ kind: 'OK', value: { codigoPedido } }`; o dublê guarda o pedido "a confirmar" com a marca `Conexus <id>` na observação; imprime `CONNECTOR_WRITE_SENT` com ligação, operação, versão e `codigoPedido`, sem os campos (S40) | `hub/connectors/write.test.ts` (novo), "o pedido sai" | must |
| 2 | U1 | Recusa antes de enviar: sem a operação no papel (o `mayUse` de Papéis) dá `NOT_IN_ROLE`; a ligação não liberada ao Projeto, ou de outro Projeto ou empresa, dá `NOT_GRANTED` (T10); uma operação `read` pedida ao funil de escrita dá `REQUEST_MALFORMED`; o dublê não recebe nada e nada se grava no registro | `hub/connectors/write.test.ts`, "a escrita recusada" | must |
| 3 | U1 | Uma escrita nunca se repete: um corte depois do envio, um 502, 503, 504 ou o `GTW3503` dão `WRITE_UNCERTAIN` com a marca, e o dublê conta um só pedido; uma segunda chamada com o mesmo `toolCallId` não envia e devolve o que o registro diz (o `codigoPedido` guardado, ou `WRITE_UNCERTAIN`); uma falha antes do envio (a ligação recusa a conexão) dá a falha do fornecedor, sem repetir | `packages/connectors/src/sankhya/operations.test.ts`, "lançar pedido"; `hub/connectors/write.test.ts`, "a resposta perdida" e "o mesmo toolCallId" | must |
| 4 | U1 | Um 200 sem `retorno.codigoPedido`, ou com `[CORE_E…]` na mensagem, e um 400 `INVALID_REQUEST` dão `REFUSED` com o texto do Sankhya ao modelo; nada fica "enviado com sucesso" no registro | `packages/connectors/src/sankhya/operations.test.ts`, "o pedido recusado" | must |
| 5 | U2 | Numa conversa do agente com `yolo: false`, a escrita em **Pergunta antes** não envia: o stream traz `tool_approval_required` com `toolName` e `args`, o estado da sessão traz o pedido em `pendingApprovals`, e o dublê não recebe nada; uma leitura, a ferramenta em código, o `web_fetch`, o `show_file`, o programa e as ferramentas do Computador do mesmo agente rodam sem `tool_approval_required` | `builder/agents/approval.test.ts` (novo), "a escrita espera, o resto não" | must |
| 6 | U2 | `POST …/sessions/{id}/tool-approval` com `approved: true` roda a escrita uma vez e o turno termina; com `approved: false`, nada roda e o modelo recebe a recusa; uma segunda resposta ao mesmo pedido responde `ok: false`; uma mensagem nova da pessoa recusa o pedido aberto, e aprovar depois dela responde `ok: false` sem rodar; Parar recusa | `builder/agents/approval.test.ts`, "aprovar, recusar, mensagem, Parar" | must |
| 7 | U2 | Recusa na rota: outra pessoa, ou a mesma em outra conversa, recebe `CONVERSATION_NOT_FOUND` (o `guard.ts`); um corpo com `alwaysAllowCategory` recebe `REQUEST_MALFORMED` e nada roda | `builder/conversation/guard.test.ts`, "a resposta de aprovação" | must |
| 8 | U2 | Depois de um reinício (um Hub novo ao lado do mesmo banco, por `hubBeside`), o pedido aberto volta no estado da sessão e **Aprovar** roda a escrita uma vez | `builder/agents/approval.test.ts`, "depois do reinício" | must |
| 9 | U2 | Em **Faz sozinho**, a escrita roda sem `tool_approval_required`; publicar uma versão com uma escrita em **Faz sozinho** por quem não tem a ação `agent: publishUnattendedWrite` dá `NOT_IN_ROLE` e não publica; em **Pergunta antes**, publica | `builder/agents/publish.test.ts`, "a escrita que faz sozinha" | must |
| 10 | U2 | O programa da 24.4 não tem a escrita: a lista de ferramentas do `execute_typescript` de um agente com **Lançar pedido** não traz `tool_<slug>` da escrita, e um programa que a chama recebe "not available in Code Mode", sem pedido ao dublê | `builder/agents/code-mode.test.ts`, "a escrita fica fora do programa" | must |
| 11 | U2 | A carga: 20 conversas ao mesmo tempo no `PostgresStore`, 10 rodadas, cada uma com uma leitura, uma escrita em **Faz sozinho** e uma em **Pergunta antes** respondida 1,5 s depois do `tool_approval_required`: as 600 chamadas terminam, cada escrita uma vez, nenhuma `AGENT_RESUME_ALREADY_CLAIMED` | `builder/agents/approval-load.test.ts` (novo) | must |
| 12 | U2 | O Builder, o Construtor e o Assistente não recebem ferramenta de escrita e continuam em `yolo` | `builder/conversation/permissions.test.ts` (os casos de hoje passam sem mudar); `builder/assistant/assistant.test.ts`, "sem escrita" | must |
| 13 | U3 | Na página do agente, a escrita aparece no grupo da ligação, desmarcada, marcada "escreve"; "Marcar todas as leituras" não a marca; marcada, a linha mostra **Pergunta antes** escolhida e **Faz sozinho**; para quem não tem a ação, **Faz sozinho** aparece desligada com "Seu papel não publica escrita que faz sozinha" | `apps/web/src/builder/agents/chooser.test.tsx`, "a escrita na linha" | must |
| 14 | U3 | O cartão mostra o agente, o logotipo e o nome da ligação, a ação ("Lançar pedido") e cada campo, **Aprovar** e **Recusar**, e sob a caixa "Escrever outra mensagem recusa este pedido."; os botões acendem só quando o estado da sessão traz o `toolCallId` | `apps/web/src/builder/conversation/approval-card.test.tsx` (novo) | must |
| 15 | U3 | Depois de **Aprovar**: "Aprovado por você" e o resultado na linha; **Recusar**: "Recusado"; mensagem: "Recusado porque você mandou outra mensagem"; Parar: "Recusado porque você parou a conversa"; `WRITE_UNCERTAIN`: "Não deu para saber se o pedido foi lançado. Procure no Sankhya a observação Conexus …" | `approval-card.test.tsx`, os cinco estados | must |
| 16 | U3 | Recarregar ou abrir em outra aba traz o cartão esperando; responder numa aba fecha o cartão na outra quando o estado da sessão chega | `apps/web/src/builder/conversation/card-reread.test.tsx`, o caso da aprovação | must |
| 17 | U3 | Na tela de Papéis, a ação **Publicar agente que escreve sozinho** aparece marcada e fixa no Dono e no Administrador, e desmarcada nos outros; marcar num papel próprio grava, e o critério 9 passa para quem tem esse papel | `apps/web/src/hub/identity/roles.test.tsx`, "a ação da escrita sozinha"; `hub/identity/roles.test.ts`, a mesma | must |
| 18 | U2 | Avaliação com o modelo de verdade (opt-in): o pedido termina no cartão; recusado, o agente diz que não lançou e não chama a escrita de novo no mesmo turno | `builder/agents/agents.eval.test.ts`, "a escrita" | should |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A escrita na linha da página do agente (U3) | desmarcada, "escreve" | o conector sem escrita: nenhuma linha "escreve" | como a lista de Papéis | o erro ao salvar fica na tela, como hoje | a ligação deixou de ser oferecida: como hoje (`NOT_OFFERED`) | fora do papel de quem edita: sem poder marcar (Papéis, critério 24); sem a ação: **Faz sozinho** desligada com o motivo | `NOT_IN_ROLE` ao publicar, com a ferramenta |
| O cartão **Aprovar?** (U3) | o pedido inteiro e os dois botões | — | "Aprovando…" ou "Recusando…", botões desligados | "Não conseguiu lançar", a falha dita; `WRITE_UNCERTAIN` com a marca | já respondido em outra aba: o estado que a sessão diz | o Membro não chega à conversa de agente (`manageAgents`) | "Recusado", "Recusado porque você mandou outra mensagem", "Recusado porque você parou a conversa" |
| A ação na tela de Papéis (U3) | marcada e fixa no Dono e no Administrador | — | como a tela | como a tela | como a tela | como a tela | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `ToolEffect` `'WRITE'` | a ferramenta do kit, pela classe da operação (U2) | a página do agente (U3), a montagem da ferramenta (U2) |
| `AgentToolChoice.approval` (`'ASK' \| 'AUTO'`, só numa escrita) | a página do agente (U3) | a gravação da versão e a conferência de publicar (U2), a regra `requireApproval` (U2) |
| `agent: publishUnattendedWrite` | os papéis (U2, `roles.ts`) | a conferência de publicar (U2), a tela de Papéis e a página do agente (U3) |
| `Written` (a resposta do funil de escrita) | `writeThrough` (U1) | a ferramenta da escrita (U2), que a diz ao modelo; o cartão (U3), pelo resultado |
| `pendingApprovals` do estado da sessão | o Mastra | o cartão depois de recarregar (U3) |
| O corpo da rota `{ toolCallId, approved }` | o cartão (U3) | o handler nativo do Mastra (U2) |

**O desenho do cartão**, a 1280 e a 390 px, sobre as peças de `ui/` e o cartão do plano de hoje
(`plan-card.tsx`):

```text
1280                                                    390
┌─────────────────────────────────────────────┐         ┌──────────────────────────┐
│ [logo] O Pedidos quer lançar um pedido no   │         │ [logo] O Pedidos quer    │
│        Sankhya · Sankhya matriz             │         │ lançar um pedido no      │
│ Cliente      1                              │         │ Sankhya · Sankhya matriz │
│ Itens        2 × produto 8 a R$ 10,00       │         │ Cliente 1                │
│ Total        R$ 20,00                       │         │ Itens                    │
│ Observação   Conexus 7f3a                   │         │ 2 × produto 8 a R$ 10,00 │
│                    [Recusar]  [Aprovar]     │         │ Total R$ 20,00           │
└─────────────────────────────────────────────┘         │ [Recusar]     [Aprovar]  │
 Escrever outra mensagem recusa este pedido.            └──────────────────────────┘
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| O registro do envio (`INSERT` em `connector_write` antes de chamar o Sankhya, numa transação curta e confirmada) | o mesmo `toolCallId`: a chave primária deixa um só; o segundo lê a linha e não envia | o processo morre depois do `INSERT` e antes da resposta: a linha fica `SENDING`, e uma retomada do Mastra que rode a chamada de novo (`agent-BP9OWM6D.js:84330-84336`) recebe `WRITE_UNCERTAIN` sem enviar | o banco fora: nada é enviado, a falha sobe | `CONNECTOR_WRITE_SENT`, `_UNCERTAIN` ou `_REFUSED` com ligação, operação, versão e `toolCallId`, sem os campos | 1, 3 |
| O pedido no Sankhya (`POST /v1/vendas/pedidos`, pelo executor) | duas chamadas diferentes são dois pedidos, cada uma com o seu cartão ou a sua linha | corte, 502, 503, 504 ou `GTW3503` depois de enviar: `WRITE_UNCERTAIN`, sem repetir; um 200 com `[CORE_E…]` ou sem `codigoPedido`: `REFUSED` | o Sankhya fora: a falha do fornecedor ao modelo; o token vencido recusado pelo gateway antes de processar (`TOKEN_EXPIRED`) renova a chave para a próxima chamada, sem repetir esta | o mesmo acima | 3, 4 |
| A aprovação guardada (o Mastra suspende a execução e guarda a espera) | duas escritas no mesmo turno são dois cartões, cada um pelo seu `toolCallId` | ninguém responde: espera sem prazo; Parar ou uma mensagem nova recusam, e uma resposta depois não roda nada | o banco do Mastra fora: a rodada falha como hoje, nada enviado | nada novo | 5, 6, 8 |
| A resposta ao cartão (`tool-approval`, nativa, pela lista fixa) | duas abas ou dois cliques: uma vale, a outra `ok: false` | chega no mesmo instante do cartão: pode perder a corrida do Mastra (#27831), nada roda e a conversa fica parada até a próxima mensagem; os botões acendem só com o pedido guardado no estado da sessão | o banco fora: a falha da rota; o pedido continua guardado | `CONNECTOR_WRITE_APPROVED` ou `_DECLINED` com a pessoa, a ligação, a operação e o `toolCallId` | 6, 7, 11, 14 |
| Publicar a versão com a chave da escrita | a regra de versão de hoje | sem a ação, uma escrita em **Faz sozinho**: `NOT_IN_ROLE`, nada publicado | o banco fora: a falha sobe | a linha de hoje da publicação | 9 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A operação que lança o pedido | U1 | `packages/connectors/src/kernel/operation.ts:3-4` (`write` existe), `:141-143` (`class`, `idempotent`); toda operação do Sankhya lê (`sankhya/operations/vendas.ts:16-28`) | Sankhya `addPedido`, `POST /v1/vendas/pedidos`, escopo `write:vendas/pedidos`, Sankhya Om 4.34; resposta `retorno.codigoPedido`; recusa 400 `INVALID_REQUEST` ou 200 com `[CORE_E…]` (developer.sankhya.com.br, lido em 2026-11-06) | a operação declara a classe e o esquema; o executor manda pela origem fixa | nativo (o kit, decisão 0056) | o passo 1 da U1 confere o mínimo real dos campos | "Poderia ser lançar um pedido no Sunker" | — |
| O dublê dos pedidos | U1 | `sankhya/fake.ts:20-47` (as chaves), `:112-135` (todo serviço desconhecido responde `status "0"`); não guarda pedido | o próprio repositório (T26) | um estado por pedido e as chaves "perdida depois de gravar" e "perdida antes de gravar" | nativo | — | não precisa | `packages/connectors/src/sankhya/fake-orders.ts` |
| O funil de escrita | U1 | `hub/connectors/read.ts` (`readThrough`, os seus quatro chamadores) e o `mayUse` de Papéis (U2 dela) | o próprio funil de leitura | o pedido leva o `speaker`, e o papel se confere antes do executor | nativo: um gêmeo, `writeThrough`, com o **mesmo** `mayUse`; gêmeo porque a escrita não repete e grava o envio antes | — | "coeso a nossa plataforma inteira" | `apps/server/src/hub/connectors/write.ts` |
| Nunca duas vezes | U1 | `executor.ts:268` (`repeat: operation.idempotent`); `read.ts` repete o 401 | Mastra: uma retomada de processo morto roda de novo a ferramenta em voo (`agent-BP9OWM6D.js:84330-84336`); o Sankhya não tem chave de idempotência (boas práticas, 2026-11-06) | quem chama guarda o envio | embrulhado: o registro por `toolCallId` é nosso, porque nem o Mastra nem o Sankhya garantem uma vez | os critérios 3 e 11 | não precisa | migração `connector_write` |
| Quem usa a escrita | U1 | o papel de Papéis (`createAccessControl` com as operações do kit como ações) | `better-auth@1.7.8` `has-permission.mjs:7-32` | a ação `lancar_pedido` no recurso `connector_sankhya` | nativo | — | `B1` de Papéis | — |
| A escrita como linha de ferramenta | U2, U3 | a página do agente de Papéis (`E4`): as ferramentas da ligação selecionada, nada marcado | Mastra Connect `tools()` com `allowTools` (`reference/connect/tools.mdx:123-139`, `6e8dfcb8`) | a ferramenta existe para o modelo só se marcada | nativo | — | `E4` | — |
| A chave **Pergunta antes / Faz sozinho** | U2 | `builder.agent_version_tool` (`builder/agents/tables.ts:137-162`), sem coluna de aprovação | `@mastra/core@1.82.0` `createTool({ requireApproval: fn })`, a palavra final da ferramenta (`agent-BP9OWM6D.js:15114-15143`; `docs-agents-human-in-the-loop.md:109,157`); OpenAI `needsApproval`, Copilot Studio "Ask the end user before running" (Papéis, `market/autonomy.md`) | por ferramenta, lida a cada chamada | nativo: a coluna `approval` na linha da versão, lida pela função | Papéis P2 e P3: 0 de 200 | `D1` de Papéis | — |
| O `yolo` desligado nos agentes | U2 | `builder/agents/controller.ts:269` (`initialState: { yolo: true }`, decisão 0053) | `agent-controller-BDds1y5w.js:8638-8643` (`requireToolApproval: !isYolo`), `:5174-5187` (`resolveToolApproval`: sem regra, "ask") | sem `yolo`, toda ferramenta sem regra própria pede; a regra própria decide | nativo | Papéis P2 e P3; o critério 5 | `D1` de Papéis | — |
| A regra em toda ferramenta do agente | U2 | `builder/agents/agent.ts:160-205` (conector, app, biblioteca, código, web, `show_file`, programa); o Computador (`builder/machine/machines.ts:249`) | `createTool({ requireApproval })`; a área de trabalho aceita `tools.requireApproval` em função (`reference-workspace-workspace-class.md:64,116`) | `() => false` em toda leitura | nativo | o critério 5 (o `web_search` do provedor é a dúvida: Parar se) | não precisa | — |
| Aprovar sozinho pela regra da sessão | fica de fora: não se usa | nenhum | `agent-controller-BDds1y5w.js:899-905` (a regra `allow` aprova na hora) | suspende e se aprova; perde a corrida | nativo, e rejeitado | Papéis P1 (12 de 200) e P5 (20 de 200); a causa, `agent.ts:8522` do Mastra | não precisa | — |
| A escrita fora do programa | U2 | `builder/agents/agent.ts:179-192` (o programa recebe `ofTheAgent`) | `tools-BVDic2bB.js:480-482` (o programa chama `tool.execute` direto, sem a pergunta) | o programa não passa pela aprovação | nativo: a escrita fica só direta, como o Computador e o `web_fetch` | o critério 10 | não precisa | — |
| Quem publica uma escrita que faz sozinha | U2 | `hub/identity/admission.ts:20-21,96-97` (`agent: manage`, `publish`) | `better-auth@1.7.8` `createAccessControl` | uma ação a mais no recurso `agent` | nativo | — | `D1` de Papéis | — |
| A rota da resposta | U2 | `builder/conversation/guard.ts:24-31` (a lista fixa, sem `tool-approval`), `:120-147` | `@mastra/server@1.82.0` `dist/server/handlers/agent-controller.js:194-207,709-760` (aprova o portão vivo ou, depois de reiniciar, a espera guardada por `respondToPersistedToolApproval`) | o corpo leva `toolCallId` e `approved` | nativo; o guarda recusa `alwaysAllowCategory`, porque a autonomia mora só na versão | as medidas H5 e H7, no Postgres | não precisa | — |
| Mensagem nova recusa, Parar recusa | U2 | — | `agent-controller-BDds1y5w.js:5447-5456` (`interrupted_by_user_message`), `:5227-5229` | a mensagem e o Parar soltam o portão como recusa | nativo | as medidas H6, no Postgres, e H11, na memória | não precisa | — |
| O reinício | U2 | — | `agent-controller-BDds1y5w.js:5233-5272` (`hasPersistedToolApproval`, `respondToPersistedToolApproval`) | a espera guardada se responde por `toolCallId` | nativo | a medida H5, no Postgres | não precisa | — |
| Quem aprova | U2 | `builder/agents/conversation-routes.ts:33-40` (a conversa de agente pede `manageAgents`) | Mastra canais `toolApprovers: 'requester'` (`reference-agents-channels.md:115`); Copilot Studio e Agentforce, a autoridade do agente | quem conversa responde | nativo | — | `C1` de Papéis | — |
| Quem aprovou, no registro | U2 | `hub/connectors/routes.ts` (as linhas de log da liberação) | Claude Code, o evento `tool_decision` (relato) | uma linha por decisão | embrulhado (a linha é nossa) | — | não precisa | — |
| O cartão | U3 | `apps/web/src/builder/conversation/plan-card.tsx`, `question-card.tsx` | bolt.diy `app/components/chat/ToolApprovalTray.tsx:43-110` (`353b44c`); Glean (o sistema, o registro e os campos) | o que vai ser escrito e dois botões | nativo (as peças da casa) | — | não precisa | `apps/web/src/builder/conversation/approval-card.tsx` |
| O cartão depois de recarregar | U3 | `apps/web/src/builder/conversation/session-state.ts` (o cartão do plano volta por `pendingSuspensions`) | `@mastra/server` `agent-controller.js:542-543` (`pendingApprovals` no estado da sessão) | o estado traz os pedidos abertos | nativo | o critério 16 | não precisa | — |
| A liberação ao Projeto | U3 (o texto) | `apps/server/src/hub/connectors/tables.ts:170` ("to read, the whole connection"); `apps/web/src/hub/connectors/text.ts:182,216` | Claude Enterprise (papel com conectores e ações); Activepieces (ações por projeto) | um lugar para quem, outro para onde | nativo com `A1`; com `A2`, embrulhado (coluna e caixa nossas) | — | decisão `A` | — |
| Cancelar pelo agente | fica de fora com `B1` | — | Sankhya `POST /v1/vendas/pedidos/{codigoPedido}/cancela` com `{ motivo }`; "Pedidos faturados não serão cancelados" | cancela, não apaga | nativo (o kit), se `B2` | — | decisão `B` | — |
| O Builder, o Construtor e o Assistente | fica de fora: sem mudança | `construtor.ts:275`, `conversation/permissions.ts:60`, `assistant.ts:305` | Mastra Code começa em `yolo` (`mastracode/sdk/src/index.ts:1129`, `6e8dfcb8`) | ferramentas sem pergunta | nativo | — | 0053 | — |

**As medidas** (2026-11-05 e 06, `@mastra/core` 1.82.0, `@mastra/pg` 1.35.0, Postgres 18 local,
modelo de mentira; os roteiros e as saídas ficam fora do repositório, com o firstmate). Com o `yolo`
desligado e uma escrita com `requireApproval`: H1, aprovar roda uma vez; H2, recusar não roda; H4,
aprovar uma chamada não aprova a seguinte; H5, depois de um controlador novo no mesmo banco, a
espera guardada se responde por `toolCallId` e roda uma vez; H6, uma mensagem da pessoa recusa o
pedido aberto, e a resposta atrasada recebe `stale_tool_call`; H7, duas respostas ao mesmo tempo
rodam uma vez; H10, 20 conversas aprovadas ao mesmo tempo terminam, cada escrita uma vez; a carga
de 200 com a aprovação 1,5 s depois do pedido, 0 perdidas, e com a aprovação no mesmo instante, 7
de 100 presas sem rodar, nenhuma duas vezes; H11, na
memória, a chamada recusada pela mensagem não fica guardada para um **Aprovar** depois do
reinício. As medidas de Papéis: P1, a regra `allow` da sessão, 12 de 200 perdidas; P2 e P3, a regra
em cada ferramenta, 0 de 200; P5, `yolo` ligado com uma regra que devolve `true`, 20 de 200. A
causa (o relatório da corrida, 2026-11-06): a segunda gravação da mesma suspensão no Mastra
(`packages/core/src/agent/agent.ts:8522`, `workflows/default.ts:1153-1178`, 1.82.0), só quando a
aprovação vem na hora.

**A medida do transplante.** Nada vem do repositório antigo: ele não tinha escrita de agente. O
cartão segue o desenho do cartão do plano do `main`.

**A dívida.** A corrida da resposta no mesmo instante do cartão é do Mastra (#27831, fechada lá sem
conserto); o relato pronto fica fora do repositório, esperando a autorização do firstmate para
mandar. A decisão 0053 continua para o Builder, o Construtor e o Assistente; no fechamento ela ganha
uma nota de escopo: o controlador dos agentes sai dela.

## U1 A escrita no Sankhya

**Base e modelo.** O `main` do dia, com Papéis. Sonnet: segue o funil de leitura e o kit, sem
desenho novo entre módulos.

### As linhas da tabela

A operação que lança o pedido, o dublê dos pedidos, o funil de escrita, nunca duas vezes, quem usa
a escrita. Leia na base `packages/connectors/src/kernel/{operation,definition}.ts`,
`sankhya/{definition,fake,fake-data,spec-source}.ts`, `sankhya/operations/vendas.ts`,
`apps/server/src/hub/connectors/{read,executor}.ts` e o `may-use.ts` de Papéis.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Muda `definition.ts`: as escritas do conector, uma lista lida pelo funil de escrita (a porta de leitura continua recusando `write`, `:117`) | o kit, a conformidade, o Hub |
| `packages/connectors/src/sankhya/` | Muda `operations/vendas.ts` (`lancarPedido`), `operations/index.ts`, `spec-source.ts` (a página `addpedido`); cria `fake-orders.ts`; muda `fake.ts` | o kit |
| `apps/server/src/hub/connectors/` | Cria `write.ts`; muda `executor.ts` (a escrita sem repetição), `tables.ts` (`connectorWrite`), `public.ts` (C4) | a ferramenta da escrita (U2) |
| `apps/server/migrations/`, `apps/server/database-grants.sql` | Cria a tabela `connectors.connector_write` e as suas permissões, num pull request próprio (D11; a aprovação desta página é a palavra do fundador) | o Drizzle, `catalog.test.ts` |

### Os contratos que a unidade cria

```ts
// packages/connectors/src/sankhya/operations/vendas.ts
export const lancarPedido // defineOperation({ id: 'lancar_pedido', class: 'write', idempotent: false, subject: 'vendas', label: 'Lançar pedido', … })
LancarPedidoInput = z.object({
  notaModelo: z.number().int().positive(),
  codigoCliente: z.number().int().positive(),
  codigoVendedor: z.number().int().positive().optional(),
  observacao: z.string().max(200).optional(), // o funil acrescenta a marca "Conexus <id>"
  itens: z.array(z.object({ codigoProduto: z.number().int().positive(), quantidade: z.number().positive(), valorUnitario: z.number().nonnegative().optional() })).min(1),
})
// answer: OK only with retorno.codigoPedido; [CORE_E…] or 400 INVALID_REQUEST → REFUSED with the text

// apps/server/src/hub/connectors/write.ts
export type WriteRequest = Readonly<{ speaker: Speaker; scope: SessionScope; connectionId: ConnectionId; operation: OperationId; input: unknown; toolCallId: ToolCallId; turn: TurnKey; signal?: AbortSignal }>
export type Written =
  | Readonly<{ kind: 'OK'; value: unknown }>
  | Readonly<{ kind: 'NOT_IN_ROLE' }>
  | Readonly<{ kind: 'NOT_GRANTED' }>
  | Readonly<{ kind: 'WRITE_UNCERTAIN'; mark: string }>
  | Exclude<Answered<unknown>, { kind: 'OK' }>
export function writeThrough(deps: WriteDeps, request: WriteRequest): Promise<Written>

// apps/server/src/hub/connectors/tables.ts
connectors.connector_write (
  company_id text not null, tool_call_id text not null, connection_id uuid not null,
  operation_id text not null, version_id uuid not null,
  state text not null check (state in ('SENDING', 'DONE', 'REFUSED', 'UNCERTAIN')),
  answer jsonb null, created_at timestamptz not null,
  primary key (company_id, tool_call_id)
) // política de linha da empresa (0039); hub_company: SELECT, INSERT, UPDATE (state, answer)
```

- O estado do envio é a união `state`, e o `Written` é separado por `kind` (C21).
- Os ids são `ConnectionId`, `OperationId`, `ToolCallId` (novo, com marca, conferido no funil) e
  `TurnKey` (C23).
- O dono das escritas de um conector é a lista do kit, pela classe; o funil não tem outra (C26).
- A entrada é o esquema Zod da operação (C27).
- O arquivo tomado como modelo é `read.ts` (`readThrough`) com o `speaker` de Papéis; ele cumpre
  C21 e C26 depois de Papéis. A diferença é uma só: a linha do registro, confirmada antes do
  executor, fora da transação curta da admissão (D22: nenhum lock atravessa a chamada ao Sankhya).

### As skills e a leitura

As linhas de `docs/reference/stack.md` das pastas da unidade: `node`, o Drizzle da casa
(`data.md`). A skill `mastra` não: esta unidade não toca o Mastra.

### A ordem do trabalho

1. A API: acrescente `addpedido` e `postcancelapedido` às páginas de `spec-source.ts` e leia-as
   pelo kit, como as leituras foram lidas. A página lista campos de NF-e como obrigatórios, o que o
   texto contradiz: escreva no relatório da construção o mínimo que o esquema do kit aceita, e o
   dublê segue o texto. Nada é chamado no Sankhya.
2. O kit: `lancarPedido` com o esquema acima; as escritas do conector numa lista que a conformidade
   confere (só `class: 'write'`). Regras: C21, C27.
3. O dublê: `fake-orders.ts` guarda pedidos por `codigoPedido` com o estado e a observação; as
   chaves `lostAfterStore` e `lostBeforeStore`; o 400 `INVALID_REQUEST` com um produto que não
   existe; o 200 com `[CORE_E…]`.
4. A migração e as permissões de `connector_write`, no seu pull request (D11).
5. `write.ts`: numa transação curta, a admissão (`speaker`, `mayUse`, a ligação oferecida ao
   Projeto, a escrita na lista do conector) e o `INSERT` do registro com `SENDING`; confirmada, a
   chamada ao executor com a marca na observação; depois, o `UPDATE` para `DONE`, `REFUSED` ou
   `UNCERTAIN` com a resposta. Um `INSERT` que bate na chave lê a linha e devolve o que ela diz, sem
   enviar (`SENDING` vira `WRITE_UNCERTAIN`).
6. `executor.ts`: uma escrita não repete. Corte, 5xx e `GTW3503` depois do envio viram
   `WRITE_UNCERTAIN`; o `TOKEN_EXPIRED` do gateway marca a chave para renovar e devolve a falha.

### Como se prova

Os critérios 1 a 4, pelo funil e pelo dublê, contando os pedidos que ele recebe. Hoje falham todos.

### Parar se

- A página do `addPedido` lida pelo kit disser que um campo do esquema acima não existe, ou que o
  pedido não nasce "a confirmar": escreva o que leu e pare antes do dublê.
- O `mayUse` de Papéis não estiver no `main`: pare; não se cria uma regra provisória.
- O funil de leitura de Papéis tiver ficado diferente do que este cartão supõe (`speaker` em
  `ReadRequest`): siga o que estiver no `main` e diga a diferença.

## U2 O agente pergunta ou faz sozinho

**Base e modelo.** O `main` com a U1. Opus: cruza o controlador, todas as ferramentas do agente, a
conferência de publicar e a rota, e a carga é concorrência.

### As linhas da tabela

A escrita como linha de ferramenta, a chave, o `yolo` desligado, a regra em toda ferramenta, a
escrita fora do programa, quem publica uma escrita que faz sozinha, a rota da resposta, mensagem
nova e Parar, o reinício, quem aprova, quem aprovou no registro.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/agents/` | Muda `controller.ts` (`yolo: false`), `agent.ts` (a escrita fora do programa; a regra em cada ferramenta), `tools.ts` (a ferramenta da escrita sobre `writeThrough`), `code-tools.ts`, `publish.ts` (a ação), `tables.ts` (a coluna `approval`), `frozen.ts`; cria `approval.test.ts`, `approval-load.test.ts` | o controlador "agentes" |
| `apps/server/src/builder/conversation/` | Muda `guard.ts` (a rota `tool-approval` na lista fixa; recusa `alwaysAllowCategory`), `builder.ts` (`web_fetch` e `web_search` com a regra) | o servidor do Mastra no Hub |
| `apps/server/src/builder/machine/` | Muda a área de trabalho dos agentes: `tools.requireApproval: () => false` | as conversas com Computador |
| `apps/server/src/hub/identity/` | Muda `roles.ts` e `admission.ts` (a ação `agent: publishUnattendedWrite`) | a publicação, a tela de Papéis |
| `apps/server/migrations/` | A coluna `approval` em `builder.agent_version_tool` (a permissão de tabela de hoje cobre; D11 não muda) | o Drizzle |
| `packages/hub-api/src/{tools,agents,roles}.ts` | `ToolEffect` com `'WRITE'`; `approval` na escolha da ferramenta; a ação | a web, o servidor |
| `apps/server/src/platform/recordings/mastra/` | As gravações do `tool_approval_required` e do `pendingApprovals` (T26) | os testes da U2 e da U3 |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/tools.ts
export const ToolEffect = z.enum(['READ', 'WRITE']) // from the operation's class (C26)
// packages/hub-api/src/agents.ts
export const ToolApproval = z.enum(['ASK', 'AUTO']) // only on a WRITE tool; absent on a read
// the agent's tool choice gains `approval?: ToolApproval`; a WRITE without it is saved as 'ASK'

// apps/server/src/builder/agents/tables.ts
agent_version_tool.approval text null check (approval in ('ASK', 'AUTO'))

// apps/server/src/hub/identity/roles.ts
agent: ['manage', 'publish', 'publishUnattendedWrite'] // owner and admin; a company role when marked

// apps/server/src/builder/agents/tools.ts: the tool of a WRITE operation
createTool({ id: `tool_${slug}`, requireApproval: () => tool.approval === 'ASK', execute: (input, { agent }) => writeThrough(…, { toolCallId: agent.toolCallId, speaker: { kind: 'VERSION', versionId } }) })
// every other tool of the agent: requireApproval: () => false
```

- A chave é a união `ToolApproval`, só na escrita (C21).
- O `toolCallId` vem do contexto da ferramenta e vira `ToolCallId` com marca no funil (C23).
- A classe da operação tem um dono, o kit, e o `ToolEffect` deriva dela; a autonomia tem um dono, a
  versão; nada no estado de sessão do Mastra (C26).
- O corpo da rota passa pelo esquema nativo e pelo guarda (C27).
- O arquivo tomado como modelo é `tools.ts` (`presetTools`): cumpre C21 e C26; recebe `operation`
  sem marca, e a ferramenta nova a recebe com marca (C23).

### As skills e a leitura

`mastra` (no `node_modules/@mastra/core/dist/docs` 1.82.0: `docs-agents-human-in-the-loop.md`
100-160, `docs-harness-agent-controller.md` 266-470, `reference-workspace-workspace-class.md` 60-135),
`node`, `typescript-magician`, as linhas de `docs/reference/stack.md` das pastas.

### A ordem do trabalho

1. A prova, antes do código de produto, pelo controlador "agentes" de verdade e o `PostgresStore`
   do banco de teste: com `yolo: false`, cada tipo de ferramenta do agente com a sua regra roda sem
   `tool_approval_required` (critério 5); a mensagem nova recusa e o **Aprovar** atrasado não roda
   (critério 6, que a medida H11 só provou na memória); a retomada leva o `conexus-agent-run` no contexto (ela
   não passa pelo `processInput` de novo).
2. `ToolEffect`, a coluna `approval` e a escolha da ferramenta; a gravação da versão grava `ASK`
   numa escrita sem a chave.
3. A ação `publishUnattendedWrite` em `roles.ts` e `admission.ts`; a conferência em `publish.ts`.
4. `tools.ts`: a ferramenta da escrita; `agent.ts`: a regra `() => false` em toda outra ferramenta,
   a escrita fora de `ofTheAgent` do programa; a área de trabalho com `tools.requireApproval`.
   `controller.ts`: `yolo: false`, e o comentário da 0053 sai.
5. `guard.ts`: `POST ${SESSION}/tool-approval` na lista fixa (S39), recusando `alwaysAllowCategory`.
   Imprima `CONNECTOR_WRITE_APPROVED` ou `_DECLINED`.
6. As gravações do Mastra (T26) e os testes sobre elas.

### Como se prova

Os critérios 5 a 12 e 18. O 11 roda no `PostgresStore` do banco de teste, como a medida de Papéis;
o 8 sobe um Hub novo ao lado do mesmo banco. Os testes de `permissions.test.ts` passam sem mudar.

### Parar se

- Um tipo de ferramenta do agente não aceitar a regra (o `web_search` do provedor é a dúvida) e
  suspender com `yolo: false`: diga qual e pare; não se põe regra na sessão (é ela que perde
  chamadas).
- A mensagem nova não recusar no Postgres, ou um **Aprovar** atrasado rodar a escrita: pare com os
  números.
- O critério 11 perder uma chamada, ou uma escrita rodar duas vezes: volte ao firstmate com os
  números; não se tenta uma espera para passar.

## U3 As telas

**Base e modelo.** O `main` com a U2. Sonnet.

### As linhas da tabela

A escrita como linha de ferramenta, a chave, o cartão, o cartão depois de recarregar, a liberação
ao Projeto (o texto). Leia `apps/web/src/builder/agents/chooser.tsx` e `connections-section.tsx` como
Papéis os deixou, `apps/web/src/builder/conversation/{plan-card,rows,session-state,text}.ts(x)`,
`apps/web/src/hub/identity/roles.tsx`, `apps/web/src/hub/connectors/text.ts:182,216`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/agents/` | Muda `chooser.tsx` (a linha "escreve" com a chave; "Marcar todas as leituras" a ignora) | a página do agente |
| `apps/web/src/builder/conversation/` | Cria `approval-card.tsx`; muda `rows.ts` (o `tool_approval_required` vira o cartão), `session-state.ts` (`pendingApprovals`), `text.ts` | a sala do agente |
| `apps/web/src/hub/identity/` | Muda `roles.tsx` (a ação, fixa no Dono e no Administrador) | Configurações › Papéis |
| `apps/web/src/hub/connectors/` | Muda `text.ts` (a confirmação de "Liberar", com `A1`) | Integrações do Projeto |
| `docs/reference/screens.md` | As caixas do cartão e da linha da escrita | a QA |

### A ordem do trabalho

1. As caixas a 1280 e a 390 px em `screens.md`.
2. `approval-card.tsx` sobre o desenho de `plan-card.tsx`, com as peças de `ui/`: o logotipo e o
   nome da ligação, a ação e os campos dos `args`, **Aprovar** e **Recusar**, e a frase sob a caixa.
   As respostas vão pela rota `tool-approval`. Os botões acendem só quando o `pendingApprovals` lido
   traz o `toolCallId`.
3. `rows.ts` e `session-state.ts`: o cartão volta pelo `pendingApprovals`; os estados do critério 15
   vêm do resultado da ferramenta e da recusa (`interrupted_by_user_message`, o Parar).
4. A linha da escrita na página do agente e a ação na tela de Papéis.
5. Os textos: "O {agente} quer {ação} no {sistema}", "Aprovar", "Recusar", "Aprovado por você",
   "Recusado", "Recusado porque você mandou outra mensagem", "Recusado porque você parou a conversa",
   "Não conseguiu lançar", "Não deu para saber se o pedido foi lançado. Procure no Sankhya a
   observação Conexus …", "Escrever outra mensagem recusa este pedido.", "escreve", "Pergunta antes",
   "Faz sozinho", "Seu papel não publica escrita que faz sozinha", "Publicar agente que escreve
   sozinho", e a confirmação de "Liberar". Vão ao fundador no fim.

### Como se prova

Os critérios 13 a 17, e a QA curta da página do agente e da sala nos dois temas, a 1366 e 390 px.
O 18 roda com o modelo de verdade, pelo firstmate.

### Parar se

- A sala trava a caixa de mensagem durante a aprovação: diga onde; não se cria um estado novo.
- A tela de Papéis não tiver lugar para uma ação que não é de conector: diga onde; o fundador
  aprova o lugar.
