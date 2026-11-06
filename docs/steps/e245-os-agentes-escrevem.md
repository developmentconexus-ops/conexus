# Etapa 24.5: Os agentes escrevem, com aprovação

O roteiro chama esta etapa de "24.5 Os agentes escrevem, com aprovação. Um agente ou app pede
"Aprovar?" antes de escrever (resposta B, 2026-10-18; leva a 20.1)". Ela vem depois da 24.4
(Ferramentas em código) e da etapa Papéis da empresa, que o fundador pôs antes desta ("5. Sim",
2026-11-03). Pela regra L5, este cartão espera em rascunho a vaga da fronteira. A verificação
`second-card` fica vermelha nele de propósito. Cada linha citada foi relida no `main` em `2552eff0`,
com `@mastra/core` 1.82.0, `@mastra/pg` 1.35.0 e `@mastra/server` do mesmo lote. O construtor de
cada unidade reabre as linhas no `main` do dia, e a 24.4 e Papéis da empresa já terão mudado
`builder/agents/` e `hub/identity/`.

**Do que a 24.5 depende.**
- Da 24.4 (cartão no pull request https://github.com/developmentconexus-ops/conexus/pull/771): só
  do lugar de `builder/agents/` depois da U1 dela (o dono das máquinas sai para `builder/machine/`)
  e da regra de que uma ferramenta em código só lê ("a leitura não escreve", tabela de falhas
  dela). Uma ferramenta em código que escreve fica de fora.
- Da 24.3.5 (cartão no pull request https://github.com/developmentconexus-ops/conexus/pull/643): só
  da forma comparada para o "sim". Ela escolheu `suspend()` para o caderno, e esta etapa recomenda o
  mesmo para a escrita, com o `yolo` mantido (decisão `A`). O `requireApproval` com o `yolo` desligado
  foi medido e perde leituras sob carga.
- De Papéis da empresa (sem cartão hoje): o ponto que diz se um papel usa uma operação de uma
  ligação. Se ele ainda não estiver no `main`, a U1 usa `manageAgents` como regra provisória e diz
  isso no relatório da construção.

## A página do fundador

**No fim desta etapa** um agente seu pede **Aprovar?** antes de escrever no Mercado Livre. Você vê
na conversa o que ele vai escrever, onde e em que conta. Só depois do seu toque a resposta sai. Se
você recusar, ou escrever outra coisa, nada é enviado.

**O roteiro de uso.** Projeto "Loja", com a ligação do Mercado Livre liberada para ler, e o agente
"Atendimento" publicado. Você é a Ana (dona).

1. Em **Integrações** do Projeto, na linha do Mercado Livre, toque **Liberar para escrever** e marque
   **Responder perguntas**. A linha passa a dizer "Lê tudo. Escreve: responder perguntas."
2. Em **Agentes › Ferramentas**, crie a ferramenta "Responder pergunta" com a operação **Responder
   perguntas** do Mercado Livre. Ela aparece marcada **Pede aprovação**. Ponha a ferramenta no
   "Atendimento" e publique a versão nova.
3. Na conversa do "Atendimento", peça "responde a pergunta mais antiga sem resposta, dizendo que o
   prazo é de 3 dias". Aparece o cartão **O Atendimento quer responder no Mercado Livre**, com a
   pergunta, o texto e a conta. Toque **Aprovar**. O cartão passa a "Aprovado por você", e a resposta
   aparece no Mercado Livre.
4. Peça outra resposta. No cartão, toque **Recusar**. Nada é enviado, e o agente diz que não
   respondeu.
5. Peça mais uma. Em vez de tocar no cartão, escreva "espera, o prazo é 5 dias". O cartão passa a
   "Recusado porque você mandou outra mensagem", e o agente faz um pedido novo com 5 dias.
6. Peça mais uma, feche a página e abra a conversa de novo: o cartão continua esperando, e
   **Aprovar** funciona.

**O que você faz, e quando.** Antes: nada. No começo: responde às decisões abaixo e aprova esta
página. No fim: faz o roteiro numa pergunta de verdade da sua loja, diz o que viu e aprova os textos
das telas.

**O que o estudo mostrou** (2026-11-05 e 06, desta máquina, com modelo de mentira e Postgres 18
local). **Medido** saiu de uma execução aqui.

- **A espera é do Mastra** (medido). A ferramenta que escreve se suspende antes de enviar
  (`suspend()`, o mesmo do cartão do plano do Builder), e a conversa mostra o pedido. Aprovar roda
  uma vez. Recusar com motivo não roda, e o modelo recebe o motivo. Parar não roda nada.
- **O caminho do mercado, o `requireApproval` com o `yolo` desligado, quebra leituras** (medido).
  Desligado o `yolo`, toda chamada passa pela aprovação, e o Mastra aprova sozinho as leituras. Com
  20 conversas ao mesmo tempo no Postgres, 12 de 200 leituras não rodaram, sem ninguém tocar em nada.
  Com a `suspend()`, o `yolo` fica, e as leituras não mudam.
- **A trava da decisão 0053 continua no Mastra 1.82** (medido), nos dois caminhos. Ele mostra o
  pedido antes de guardar a espera no banco, e uma resposta que chega cedo demais perde a corrida: a
  escrita não sai e a conversa fica parada. Respondendo no mesmo instante, 21 de 200 ficaram presas.
  Respondendo 1,5 s depois, o tempo de alguém ler o cartão, 0 de 200. Nas medidas, nenhuma escrita
  rodou duas vezes nem sem aprovação.
- **Duas coisas o Mastra não faz na `suspend()`, e ficam conosco** (medido). Uma mensagem sua não
  recusa o cartão aberto: aprovar o cartão velho ainda escreveria. A ferramenta confere isso ao
  voltar (a conferência é desenho, ainda não medida). E a resposta depois de um reinício não foi
  provada aqui: na memória, ela foi aceita e não rodou. A construção prova as duas primeiro e para se
  falharem.
- **O que as empresas fazem** (17 fornecedores, em 2026-11-05: Glean, Retool e Claude Enterprise lidos
  na fonte; os outros 14 por relato de páginas e buscas, sem reabrir). Escrever pede
  aprovação, ler não: OpenAI, Microsoft Copilot, Glean, Claude Enterprise. O cartão mostra a ação e
  o que vai ser escrito. Quem recusa manda um motivo, e o agente segue. Onde ninguém está olhando,
  elas se dividem: Retool e Glean tiram a ferramenta, Power Automate e n8n esperam uma pessoa.

**Fica de fora.**

- **O app que escreve** (a antiga 20.1, "Responde pelo app uma pergunta do Mercado Livre"). Ele usa a
  mesma liberação desta etapa e vira uma etapa curta logo depois, se você escolher a `D1`.
- **Escrever sem ninguém olhando** (uma automação, um agente agendado). É a 24.6. Até lá, uma
  execução sem pessoa não recebe ferramenta que escreve.
- **O Telegram** (24.7). O canal sem botões trata a aprovação de outro jeito no Mastra, e o estudo da
  24.7 decide.
- **Editar o texto no cartão antes de aprovar** (LangChain e Glean fazem). Hoje você recusa e pede de
  novo.
- **Um prazo para o cartão.** Nenhum SDK lido tem. O cartão espera até você responder, parar a
  conversa ou mandar outra mensagem.
- **Os outros avisos guardados para um cartão** (117 abertos hoje). Nenhum toca a escrita de um
  agente. A #752 (pedido de publicação sem prazo) é de outra peça, o pedido entre pessoas, e espera o
  seu gatilho.

**As decisões suas nesta etapa.** A recomendação de cada uma vem primeiro.

- **A. Um agente da empresa pergunta antes de escrever num sistema, e por qual caminho do Mastra?**
  - `A1` (recomendo): sim, pela `suspend()` da ferramenta que escreve, com o `yolo` dos agentes
    mantido. O cartão responde pela rota `tool-suspension`, que a lista fixa já tem. Nativo:
    `suspend()` e `resumeSchema`, como o cartão do plano. Nosso: a ferramenta recusa ao voltar se você
    mandou mensagem depois do pedido. Por quê: as leituras não mudam, e é o padrão da casa (24.3.5).
    Exemplo: o Glean pausa toda escrita e mostra o sistema, o registro e os campos. O risco que fica:
    uma resposta no mesmo instante do cartão pode deixar a conversa parada, sem escrever.
  - `A2`: o `requireApproval` com o `yolo` desligado, o caminho do mercado e do Mastra Code. Hoje
    perde 6% das leituras sob carga; serviria quando o Mastra consertar.
  - `A3`: manter o `yolo` sem pergunta, como você escolheu para o Builder (decisão 0053, mantida em
    2026-10-21 mesmo para escritas). A escrita sai na hora, sem cartão.
  - Em qualquer uma, o defeito vai ao Mastra com o roteiro medido. Mandar é uma chamada de fora, e
    espera a autorização do firstmate.
  - Quem aprova é quem está na conversa do agente, e só se o seu papel usa aquela escrita (Papéis da
    empresa). Hoje um desenvolvedor entra na conversa (`manageAgents`); se o papel dele usar a
    escrita, ele aprova.
- **B. Você pode dispensar as próximas perguntas ("sempre permitir")?**
  - `B1` (recomendo): não, cada escrita pergunta. É o que fazem LangChain, Google ADK, n8n,
    Agentforce, Retool e Power Automate. Nativo: nada a fazer.
  - `B2`: "Permitir nesta conversa", como a tecla "a" do Mastra Code. No caminho `A1` é nosso: a
    ferramenta não pergunta de novo se a conversa já aprovou a mesma escrita. O nativo
    (`always_allow_category`) só existe no caminho `A2`, e vive só na memória.
  - `B3`: "Sempre permitir" guardado por ferramenta, decidido pelo dono, como o Claude Enterprise
    (por papel e conector) e o Dyad (por ferramenta). É nosso, com tabela e tela, e caberia em
    Papéis da empresa.
- **C. Liberar a ligação ao Projeto libera também a escrita?**
  - `C1` (recomendo): não. "Liberar para ler" continua só leitura. Cada escrita se libera à parte,
    por dono ou administrador, e uma escrita nova do conector pede liberação nova. É o "Escrita nova
    pede nova liberação" do roteiro. Referências: o Activepieces escolhe as ações por projeto; no
    Claude Enterprise, a política da empresa é o teto. É nosso: uma coluna na liberação e uma caixa
    na tela. A coluna nova pede a permissão de `UPDATE` ao papel do banco da empresa (D11), num pull
    request próprio, e a sua aprovação desta página vale como a palavra que a D11 pede.
  - `C2`: liberar a ligação libera tudo, e o cartão é a única trava.
- **D. Qual é a primeira escrita, e o app entra junto?**
  - `D1` (recomendo): responder uma pergunta do Mercado Livre, pelo agente; o app que escreve vem na
    etapa curta seguinte. O kit já lê as perguntas, e uma resposta é curta de conferir no cartão.
  - `D2`: criar um orçamento no Sankhya pelo agente, que prepara a 24.6. A API de gravação do Sankhya
    não foi lida, e os testes daqui não escrevem no Sankhya.
  - `D3`: agente e app juntos. Cerca de 4.600 linhas, acima das 4.000 da regra L2: a etapa teria de
    se dividir.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 A escrita e a liberação | A operação `responder_pergunta` do Mercado Livre (classe `write`) com o dublê; o executor que manda uma escrita uma vez só; a porta `write` dos agentes, que confere a liberação e o papel na hora de executar; a coluna das escritas liberadas em `project_connection`, as rotas de liberar e tirar uma escrita, e a caixa em Integrações do Projeto | `packages/connectors/src/{kernel,mercado-livre}/`, `packages/hub-api/src/project-connections.ts`, `apps/server/src/hub/connectors/`, `apps/server/migrations/`, `apps/web/src/hub/{projects,connectors}/` | [data](../guides/data.md) | esta página aprovada; Papéis da empresa no `main`, ou a regra provisória |
| U2 O agente pergunta | A ferramenta da biblioteca com uma operação de escrita (marcada **Pede aprovação**), que se suspende antes de enviar e confere a resposta ao voltar; a oferta das escritas às ferramentas; os registros da decisão; as gravações do Mastra | `apps/server/src/builder/{agents,tools}/`, `apps/server/src/hub/connectors/`, `packages/hub-api/src/tools.ts`, `apps/web/src/builder/tools/`, `apps/server/src/platform/recordings/mastra/` | [security](../guides/security.md) | U1 |
| U3 O cartão | O cartão **Aprovar?** na conversa do agente, os seus estados, a volta depois de recarregar e o texto do agente sobre recusa | `apps/web/src/builder/conversation/`, `docs/reference/screens.md` | [web](../guides/web.md) | U2 |

Correm em fila: a U2 lê a porta da U1, e a U3 lê o evento da U2.

**O método das unidades.** Cada unidade segue o `pstack:poteto-mode` como as skills do repositório
já o chamam ([`conexus-scope`](../../.agents/skills/conexus-scope/SKILL.md), passo 4;
[`conexus-build`](../../.agents/skills/conexus-build/SKILL.md)). O cartão não repete o método.

**Orçamento de código alterado.** U1: ~1.200 (a operação e o dublê, o executor, a porta, a coluna,
as duas rotas, a caixa e o seu diálogo). U2: ~800 (a ferramenta e a sua volta, a oferta das escritas, a
escolha da operação, os registros, as gravações, a marca na lista de ferramentas). U3: ~600 (o cartão, os estados, a
releitura). Total da etapa: ~2.600, dentro da regra L2.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Dono ou administrador libera **Responder perguntas** de uma ligação do Mercado Livre já liberada para ler; `GET …/projects/{p}/connections` traz `writes: ['responder_pergunta']`; uma segunda liberação igual não grava nada e responde a mesma | `hub/connectors/grants.test.ts`, "liberar uma escrita" | must |
| 2 | U1 | Recusa: o membro e o desenvolvedor recebem `NOT_FOUND` ao liberar ou tirar uma escrita (S10); uma operação que não é `write` do conector recebe `REQUEST_MALFORMED`; uma ligação ainda não liberada para ler, ou de outro Projeto ou empresa, recebe `CONNECTION_NOT_FOUND` (T10); nada muda | `hub/connectors/grants.test.ts`, "a escrita recusada" | must |
| 3 | U1 | A porta `write` manda a resposta ao dublê do Mercado Livre uma vez, com o `question_id` e o texto, e devolve `{ kind: 'OK', value }`; imprime `CONNECTOR_WRITE_SENT` com a ligação, a operação e a pessoa, sem o texto (S40) | `hub/connectors/agent-write.test.ts`, "a escrita sai" | must |
| 4 | U1 | Recusa na hora de executar: escrita não liberada, liberada só em outro Projeto (T10), liberação tirada depois do pedido, ou papel que não usa a operação dão `NOT_GRANTED`, e o dublê não recebe nada | `hub/connectors/agent-write.test.ts`, "a escrita sem liberação" | must |
| 5 | U1 | Uma escrita não se repete sozinha: uma resposta cortada, um 502, um 503 ou um 429 depois de o pedido sair dão `WRITE_UNCERTAIN` ao modelo, e o dublê conta um só pedido; só o 401, quando o fornecedor recusou sem agir, repete uma vez com chave nova, como na leitura; uma segunda chamada com o mesmo `toolCallId` dá `WRITE_UNCERTAIN` sem enviar | `packages/connectors/src/mercado-livre/operations.test.ts` e `hub/connectors/agent-write.test.ts`, "a resposta perdida" | must |
| 6 | U2 | Numa conversa de agente com a ferramenta de escrita, a chamada não envia: o stream traz `tool_suspended` com `toolName`, `args` e o `suspendPayload` da escrita, e o dublê não recebe nada; uma ferramenta de leitura do mesmo agente roda sem perguntar, e o controlador continua em `yolo` | `builder/agents/approval.test.ts`, "a escrita espera, a leitura não" | must |
| 7 | U2 | `POST …/sessions/{id}/tool-suspension` com `resumeData: { approved: true }` roda a escrita uma vez e o turno termina; com `approved: false` e um motivo, nada roda, e o pedido seguinte ao modelo traz o motivo | `builder/agents/approval.test.ts`, "aprovar e recusar" | must |
| 8 | U2 | A trava da 0053: sete cópias do teste, cada uma com oito execuções, 56 ao mesmo tempo no `PostgresStore`. Com a resposta 1,5 s depois do `tool_suspended`, terminam todas, cada escrita uma vez. Com a resposta no mesmo instante, nenhuma escrita roda duas vezes nem sem aprovação, e o teste imprime quantas ficaram presas | `builder/agents/approval-load.test.ts` | must |
| 9 | U2 | Recusa: outra pessoa, ou a mesma em outra conversa, recebe `CONVERSATION_NOT_FOUND` na rota (o `guard.ts`); uma segunda resposta ao mesmo pedido não roda nada; aprovar um cartão depois de uma mensagem nova da pessoa não envia, e o modelo recebe "Recusado porque a pessoa mandou outra mensagem" | `builder/agents/approval.test.ts`, "a resposta recusada" | must |
| 10 | U2 | Depois de um reinício (um Hub novo ao lado do mesmo banco, por `hubBeside`, como `conversations.test.ts:256-258`), o cartão continua no estado da sessão e a aprovação roda a escrita uma vez. Depende da prova do passo 1 da U2, ainda não feita: se ela falhar, a U2 para | `builder/agents/approval.test.ts`, "depois do reinício" | must, se a prova passar |
| 11 | U2 | Recusa: o Builder, o Assistente e o Construtor não recebem ferramenta de escrita; uma rodada de automação não recebe ferramenta de escrita | `builder/conversation/permissions.test.ts` (os casos de hoje passam sem mudar) e `builder/agents/approval.test.ts`, "sem pessoa" | must |
| 12 | U2 | Na lista de ferramentas, a ferramenta com uma operação de escrita (`effect: 'WRITE'`) diz **Pede aprovação**; a gravação dela numa ligação sem a escrita liberada é recusada com `TOOL_REFUSED` e `reason: 'NOT_RELEASED'` | `builder/tools/routes.test.ts`; `apps/web/src/builder/tools/` o teste da lista | must |
| 13 | U3 | O cartão mostra o agente, o sistema com o logotipo e o nome da ligação, a ação ("Responder perguntas") e cada campo que vai ser escrito, e **Aprovar** e **Recusar**; a caixa de mensagem continua aberta, com a frase "Escrever outra mensagem recusa este pedido." | `web/src/builder/conversation/approval-card.test.tsx` | must |
| 14 | U3 | Depois de **Aprovar**: "Aprovado por você", e o resultado da ferramenta na linha. Depois de **Recusar**: "Recusado". Depois de uma mensagem: "Recusado porque você mandou outra mensagem". Depois de Parar: "Recusado porque você parou a conversa". Uma falha: "Não conseguiu escrever", com a falha dita e **Tentar de novo** | `approval-card.test.tsx`, os cinco estados | must |
| 15 | U3 | Recarregar a página ou abrir a conversa em outra aba traz o cartão esperando; responder numa aba fecha o cartão na outra quando o estado da sessão chega | `web/src/builder/conversation/card-reread.test.tsx`, o caso da aprovação | must |
| 16 | U3 | Avaliação com o modelo de verdade (opt-in): pedido de resposta termina com o cartão; recusado com motivo, o agente diz que não respondeu e não chama de novo a ferramenta no mesmo turno | `builder/agents/agents.eval.test.ts`, "a escrita" | should |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| O cartão **Aprovar?** (U3) | o cartão com o que vai ser escrito e os dois botões | — | "Aprovando…" ou "Recusando…" nos botões, que ficam desligados | "Não conseguiu escrever", a falha dita e **Tentar de novo**, que pede ao agente outra vez (W34) | o pedido já foi respondido em outra aba: o cartão passa ao estado que a sessão diz | o membro não chega à conversa de agente (`manageAgents`) | "Recusado", "Recusado porque você mandou outra mensagem", "Recusado porque você parou a conversa" |
| A caixa **Liberar para escrever** em Integrações do Projeto (U1) | a lista das escritas do conector, todas desmarcadas | o conector sem escrita: o botão não aparece | "Liberando…" | a falha da rota, dita na caixa | a ligação saiu: a lista se relê | membro e desenvolvedor não veem o botão (W34, como "Liberar para ler") | — |
| A marca **Pede aprovação** na lista de ferramentas (U2) | ao lado do nome | — | — | — | — | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `ProjectConnection.writes` | as rotas de liberar e tirar uma escrita (U1) | a caixa de Integrações (U1), a porta `write` (U1), a gravação da ferramenta (U2) |
| `ToolEffect` (`'READ' \| 'WRITE'`) da ferramenta | a biblioteca (U2), pela classe da operação | a lista de ferramentas (U2), `presetTools` (U2) |
| O `suspendPayload` da escrita (`kind: 'WRITE'`, a ligação, a operação, os campos) | a ferramenta (U2) | o cartão (U3) |
| `pendingSuspensions` do estado da sessão | o Mastra | o cartão depois de recarregar (U3), como o cartão do plano |
| O corpo da rota `{ toolCallId, runId?, resumeData: { approved, reason? } }` | o cartão (U3) | o handler do Mastra, a ferramenta ao voltar (U2) |
| `WriteAnswer` | a porta `write` (U1) | a ferramenta (U2), que a diz ao modelo |

**O desenho do cartão**, a 1280 e a 390 px, sobre as peças de `ui/` e o cartão do plano de hoje
(`plan-card.tsx`):

```text
1280                                                    390
┌─────────────────────────────────────────────┐         ┌──────────────────────────┐
│ [logo] O Atendimento quer responder no      │         │ [logo] O Atendimento quer│
│        Mercado Livre · Loja Sol             │         │ responder no Mercado     │
│ Pergunta  "Qual o prazo de entrega?"        │         │ Livre · Loja Sol         │
│ Resposta  "O prazo é de 3 dias úteis."      │         │ Pergunta                 │
│                                             │         │ "Qual o prazo…?"         │
│                    [Recusar]  [Aprovar]     │         │ Resposta                 │
└─────────────────────────────────────────────┘         │ "O prazo é de 3 dias…"   │
 Escrever outra mensagem recusa este pedido.            │ [Recusar]     [Aprovar]  │
                                                        └──────────────────────────┘
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Liberar ou tirar uma escrita (um `UPDATE` da liberação) | o mesmo resultado; duas operações diferentes ficam as duas (o lock da linha) | a liberação de ler saiu entre a leitura e a escrita: `CONNECTION_NOT_FOUND`, nada gravado | o banco fora: a falha sobe e a caixa a diz | `PROJECT_CONNECTION_WRITE_RELEASED` ou `_REVOKED` com quem e a operação | 1, 2 |
| A suspensão da chamada (o Mastra guarda a execução) | duas chamadas no mesmo turno são dois cartões, cada um pelo seu `toolCallId` | a pessoa nunca responde: espera sem prazo; Parar encerra, e uma resposta depois não roda nada | o banco do Mastra fora: a rodada falha como hoje, nada enviado | nada novo | 6, 14 |
| A resposta ao cartão (`respondToToolSuspension` do Mastra, pela rota da lista fixa) | duas abas: uma vale, a outra não roda nada e o cartão se relê | chega no mesmo instante do pedido: pode perder a corrida do Mastra (`AGENT_RESUME_ALREADY_CLAIMED`), nada roda e a conversa fica parada até a próxima mensagem; chega depois de uma mensagem nova: a ferramenta recusa ao voltar, nada roda | o banco fora: a falha da rota; o pedido continua guardado | `CONNECTOR_WRITE_APPROVED` ou `_DECLINED` com a pessoa, a ligação, a operação e o `toolCallId` | 7, 8, 9, 10 |
| Gravar a versão de uma ferramenta com uma operação de escrita | duas gravações: a regra de versão de hoje | a escrita não liberada na ligação: `TOOL_REFUSED` com `reason: 'NOT_RELEASED'`, nada gravado | o banco fora: a falha sobe | a linha de hoje da gravação | 12 |
| A escrita no Mercado Livre (a porta `write`, pelo executor) | a retomada é reivindicada uma vez (o Mastra); uma retomada de um processo morto pode rodar a chamada de novo (`agent-BP9OWM6D.js:84330-84336`): a porta guarda o `toolCallId` enviado e responde `WRITE_UNCERTAIN` sem enviar outra vez | o corte, o 502, o 503 ou o 429 depois de enviar: `WRITE_UNCERTAIN`, sem repetir; o 401 repete uma vez com chave nova | o Mercado Livre fora: a falha do fornecedor volta ao modelo; o Hub fora: a rodada falha. A liberação de ler, ou a ligação, sai: as escritas saem com ela (a mesma linha) | `CONNECTOR_WRITE_SENT` ou a falha, sem o texto | 3, 4, 5 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A operação que escreve | U1 | `packages/connectors/src/kernel/operation.ts:4` (`OPERATION_CLASSES` com `write`), toda operação `class: 'read'`; `kernel/definition.ts:72` (a porta de leitura só aceita `read`) | o próprio kit (decisão 0056, M1) | a operação declara a classe; o executor manda pela origem fixa | nativo | — | M1, já dada | `packages/connectors/src/mercado-livre/operations/respostas.ts` |
| Responder uma pergunta do Mercado Livre | U1 | `mercado-livre/operations/perguntas.ts:5-48` (só lê) | a API do Mercado Livre, `POST /answers` com `question_id` e `text` | **não verificado**: a página responde 403 a um cliente comum (`mercado-livre/docs-source.ts:7`) | nativo | o passo 1 da U1 | `D1` | — |
| A escrita mandada uma vez | U1 | `hub/connectors/read.ts` (`once`: o 401 repete com chave nova), `executor.ts:79-80,268` (o 429 só repete o que é `idempotent`) | n8n e Activepieces mandam a ação uma vez; o Mastra só reivindica a retomada (`agent-BP9OWM6D.js:84313-84340`) | uma escrita perdida não se repete às cegas | embrulhado (a resposta `WRITE_UNCERTAIN` é nossa) | o critério 5 | não precisa | — |
| A liberação da escrita | U1 | `hub/connectors/tables.ts:170-180` (`project_connection`, "to read, the whole connection; no ceiling"); `grants.ts:28-41` (`readOf`: a escrita é "none"); `web/src/hub/projects/grant-dialog.tsx` ("Liberar para ler") | Activepieces `selectedActions` por projeto; Claude Enterprise, a política da empresa como teto (docs, 2026-11-05); Glean, o administrador torna a ferramenta elegível (docs, 2026-11-05) | o administrador escolhe as ações do espaço, e o usuário não alarga | embrulhado (uma coluna e uma caixa nossas) | — | `C1` | `apps/web/src/hub/projects/write-dialog.tsx` |
| Quem usa a escrita | U1 | `hub/identity/roles.ts`, `admission.ts` (`allows`) | Papéis da empresa (better-auth `dynamicAccessControl`) | a declaração do papel decide | nativo | — | "5. Sim", 2026-11-03 | — |
| A porta `write` dos agentes | U1 | `hub/connectors/assistant-port.ts:167-199` (`read`, `operationOf`, só leitura) | a porta de leitura, no próprio repositório | escolhida, admitida e oferecida numa transação; a liberação e o papel relidos na hora de executar | nativo | — | não precisa | `apps/server/src/hub/connectors/agent-write.ts` |
| A ferramenta que escreve | U2 | `builder/agents/tools.ts:33-55` (`presetTools`, só `connectors.read`); `builder/conversation/plan-tools.ts:142-159` (o cartão do plano se suspende) | `@mastra/core@1.82.0` `suspend()` e `resumeSchema` (`dist/docs/references/docs-agents-human-in-the-loop.md:233-262,360-432`) | a ferramenta para no meio do `execute`, o stream manda `tool-call-suspended` com o `suspendPayload`, e a volta traz o `resumeData` | nativo | proof carga 7 (abaixo) | `A1` | — |
| Ler sem perguntar | U2 | `builder/agents/controller.ts:226-231` (`initialState: { yolo: true }`) | `@mastra/core@1.82.0` `requireApproval` e `permissionRules` (`docs-harness-agent-controller.md:270-310`; `dist/agent-controller-BDds1y5w.js:904-910,5166-5191,8638-8643`) | sem `yolo`, toda chamada pede aprovação, e a regra `allow` aprova sozinha na hora | nativo, com o `yolo` mantido; o caminho `A2` medido perde leituras | proof carga 5 (abaixo) | `A` | — |
| O `yolo` aprova sozinho | U2 | o mesmo | `agent-controller-BDds1y5w.js:5179` | com `yolo`, toda aprovação vira `allow`; a `suspend()` espera assim mesmo | nativo | proof P3, carga 7 | 0053 | — |
| A rota da resposta | U2 | `builder/conversation/guard.ts:24-31` (a lista fixa já tem `tool-suspension`), `:120-147` (a conversa é da pessoa) | `@mastra/server` `dist/server/handlers/agent-controller.js:208-213,764-800` (documentada para as ferramentas próprias do Mastra; medida aqui numa nossa) | o corpo leva `toolCallId`, `runId` e `resumeData`, e retoma a ferramenta | nativo | proof cargas 6 e 7 | não precisa | — |
| A trava da 0053 | U2 | — | `agent-BP9OWM6D.js:19450-19500` (o pedido sai antes de a suspensão ser guardada) e `:84343-84434` (a reivindicação espera `suspended`) | quem responde antes recebe `AGENT_RESUME_ALREADY_CLAIMED`, e a execução para sem fim | nativo, com o defeito do Mastra medido e dito na decisão `A`; sem remendo nosso | proof cargas 1 a 7 (abaixo), `@mastra/core` 1.82.0 | `A` | — |
| Recusar com motivo | U2 | — | `docs-agents-human-in-the-loop.md:360-432` (a aprovação pela `suspend()`) | a ferramenta recebe o `resumeData` e devolve o motivo como resultado | nativo | proof, a recusa com motivo (abaixo) | não precisa | — |
| Mensagem nova recusa | U2 | `plan-tools.ts:149` (o plano lê a conversa por `getMessages`, na primeira execução) | `agent-controller-BDds1y5w.js:5447-5456` (`interrupted_by_user_message` solta só os portões de aprovação, não as suspensões) | a mensagem nova não toca a suspensão: aprovar o cartão velho ainda escreve | embrulhado: a ferramenta, ao voltar, lê a conversa e recusa se a pessoa escreveu depois do pedido | proof do problema, a mensagem nova (abaixo); a conferência, no passo 1 da U2 | `A1` | — |
| Parar recusa | U2 | — | `agent-controller-BDds1y5w.js:5042-5058,5090-5101` | abortar limpa as suspensões, emite `tool_suspension_cancelled` e as nega; uma resposta depois não roda nada | nativo | proof, o Parar (abaixo) | não precisa | — |
| "Sempre permitir" | fica de fora (`B1`) | — | `always_allow_category` (`agent-controller-BDds1y5w.js:5196-5222`, só no caminho `A2`, e aberto no corpo da rota `tool-approval`, `@mastra/server` `agent-controller.js:194-203`); Mastra Code `mastracode/tui/src/tui/components/tool-approval-dialog.ts:88` (`mastra-1.82@6e8dfcb8`); Dyad `src/ipc/utils/mcp_consent.ts:10-27,87-88` (`dyad@902829f`) | o Mastra lembra só na memória; o Dyad guarda por ferramenta | embrulhado (`B2`, `B3`: nossos) | proof P4, P9 | `B` | — |
| Quem aprovou, no registro | U2 | `hub/connectors/routes.ts:106-115` (as linhas de log da liberação) | Claude Code, o evento `tool_decision` (relato, não reaberto) | uma linha por decisão | embrulhado (a linha de log é nossa) | — | não precisa | — |
| Sem pessoa, sem escrita | U2 | `builder/automations/run.ts:59,112` (a automação roda só o Assistente) | Retool (docs, 2026-11-05: "only tools that do not require consent are accessible"); Glean (só sessões interativas) | a ferramenta que pede aprovação não é oferecida | nativo (a função de ferramentas do agente) | — | 24.6 decide o resto | — |
| O cartão | U3 | `web/src/builder/conversation/plan-card.tsx:75-108`, `question-card.tsx` | Conexus OS `e0353c36` `apps/web/src/features/builder/construir/plan-pt.tsx:50-63` e `apps/hub/src/platform/failure-text.generated.ts:48`; bolt.diy `app/components/chat/ToolApprovalTray.tsx:43-110` (`353b44c`: aprovar ou recusar por chamada, com o caminho, a consulta ou o comando); Glean (o sistema, o registro e uma prévia) | mostra o que vai ser escrito e dois botões | nativo (as nossas peças, sobre o desenho do cartão do plano do `main`) | — | não precisa | `apps/web/src/builder/conversation/approval-card.tsx` |
| O cartão depois de recarregar | U3 | `web/src/builder/conversation/session-state.ts:149-160` (o cartão do plano volta por `pendingSuspensions`) | `@mastra/server` `agent-controller.js:543` (o estado da sessão) | o estado da sessão traz as suspensões abertas | nativo | o critério 15 | não precisa | — |

**As medidas**, Postgres 18 local, `@mastra/pg` 1.35.0, `@mastra/core` 1.82.0, modelo de mentira, 20
conversas por rodada, todas respondidas ao mesmo tempo. Cargas 1 a 4: o `requireApproval` com o `yolo`
desligado; 5: leituras; 6 e 7: a `suspend()` com o `yolo` mantido.

- A suíte inteira, aprovação logo que o evento chega: 5 rodadas, 7 execuções presas de 105.
- Carga 1, aprovação logo que o evento chega: 5 rodadas, 7 presas de 100.
- Carga 2, aprovação só depois de `hasPersistedToolApproval`: 3 presas de 180. A espera reduz, não
  zera.
- Carga 3, aprovação na hora e nova resposta pela execução guardada: as 200 escritas rodaram, mas 8
  conversas ficaram sem fim. Repetir não conserta.
- Carga 4, aprovação 1,5 s depois do pedido: 0 de 200.
- Carga 5, leituras com a regra `allow` e o `yolo` desligado, sem ninguém responder: 12 de 200 não
  rodaram (`AGENT_RESUME_ALREADY_CLAIMED`).
- Carga 6, a `suspend()` respondida no mesmo instante: 22 de 200 perderam a corrida, e 21 conversas
  ficaram sem fim.
- Carga 7, a `suspend()` respondida 1,5 s depois: 0 de 200.
- A mensagem nova, na memória: aprovar o cartão velho depois dela rodou a escrita.
- O Parar, na memória: a resposta depois dele não rodou nada.
- A recusa com motivo, na memória: o modelo recebeu "Declined by the person: o total está errado".
- O reinício com a `suspend()`, na memória, um segundo controlador no mesmo processo: a resposta foi
  aceita e não rodou, e o turno não terminou. Não provado; a U2 prova primeiro.
- Nas cargas, nenhuma escrita rodou duas vezes nem sem aprovação.

**A medida do transplante.** Nada trazido do repositório antigo: o cartão segue o desenho do cartão
do plano que o `main` já tem.

**A dívida.** Nenhuma nova. A decisão 0053 continua valendo para todos os controladores. Se o fundador
escolher `A2`, ela ganha no fechamento uma nota de escopo para o controlador dos agentes.

## U1 A escrita e a liberação

**Base e modelo.** O `main` do dia, com a 24.4 e Papéis da empresa. Sonnet: segue a porta de leitura
e a liberação de hoje, sem desenho novo entre módulos.

### As linhas da tabela

A operação que escreve, responder uma pergunta, a escrita mandada uma vez, a liberação da escrita,
quem usa a escrita, a porta `write` dos agentes.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Muda `definition.ts` (uma porta de escrita ao lado da de leitura, que só aceita `class: 'write'`) | o kit, a conformidade, o Hub |
| `packages/connectors/src/mercado-livre/` | Cria `operations/respostas.ts`; muda `operations/index.ts`, o dublê (`fake-routes*.ts`) | o kit |
| `packages/hub-api/src/project-connections.ts` | Muda `ProjectConnection` (`writes`), as rotas de liberar e tirar uma escrita | o Hub, a web |
| `apps/server/src/hub/connectors/` | Muda `tables.ts` (a coluna), `grants.ts` (liberar e tirar uma escrita, `writeOf`), `executor.ts` e `read.ts` (a escrita uma vez), `routes.ts`; cria `agent-write.ts` | a porta dos agentes (U2) |
| `apps/server/migrations/` | Cria a migração da coluna `writes` (D11: a permissão de `UPDATE` da coluna para o papel da empresa, num pull request próprio, com a palavra do fundador na aprovação desta página) | o Drizzle |
| `apps/web/src/hub/{projects,connectors}/` | Cria `write-dialog.tsx`; muda `project-integrations.tsx`, `text.ts` | Integrações do Projeto |

### Os contratos que a unidade cria

```ts
// packages/connectors/src/kernel/definition.ts
// The connector's writes are its operations with class 'write'; one list, read by both doors (C26).

// packages/hub-api/src/project-connections.ts
import { OperationId } from './tools.ts' // already branded there
ProjectConnection = { …today, writes: OperationId[] } // [] while only reading
// PUT    /api/companies/{c}/projects/{p}/connections/{id}/writes/{operation} → 200 { writes }
// DELETE /api/companies/{c}/projects/{p}/connections/{id}/writes/{operation} → 204
// Failures: NOT_FOUND (S10), CONNECTION_NOT_FOUND, REQUEST_MALFORMED

// apps/server/src/hub/connectors/agent-write.ts
export type WriteAnswer =
  | Readonly<{ kind: 'OK'; value: unknown }>
  | Readonly<{ kind: 'NOT_GRANTED' }>
  | Readonly<{ kind: 'WRITE_UNCERTAIN' }>
  | Exclude<Answered<unknown>, { kind: 'OK' }>
write(scope: SessionScope, call: { connectionId: ConnectionId; operation: OperationId; input: unknown; turn: TurnKey; toolCallId: string; signal?: AbortSignal }): Promise<WriteAnswer>
```

O estado é a união acima, separada por `kind` (C21). Os ids são os de hoje (`ConnectionId`,
`OperationId`, `TurnKey`), conferidos na porta (C23). A lista das escritas liberadas tem um dono, a
coluna, lida só por `grants.ts` (C26). A entrada da operação é o esquema Zod dela, pelo kit (C27).
O arquivo tomado como modelo é `assistant-port.ts` (`read`) para a transação, que cumpre C21 e C26;
ele recebe `operation: string`, e a porta nova recebe o `OperationId` com marca (C23).

### As skills e a leitura

As linhas de `docs/reference/stack.md` das pastas da unidade. Primeiro: o `node`, o Drizzle da casa
(`data.md`) e a skill `mastra` não, porque esta unidade não toca o Mastra.

### A ordem do trabalho

1. A API: leia a página `gerenciamento-perguntas-respostas` pelo `docs-source.ts` do kit, como a
   leitura das perguntas foi lida. Confirme o método, o caminho, os campos, o limite do texto, se uma
   resposta se apaga ou edita, e o que o Mercado Livre responde a uma pergunta já respondida. Escreva
   o que leu no relatório da construção.
2. O kit: a porta de escrita, com a conformidade conferindo que só aceita `write`; a operação
   `responder_pergunta` com o esquema Zod e o seu dublê. Regras: C21, C27.
3. O executor e `read.ts`: uma escrita não se repete (`idempotent: false`); qualquer falha depois de o
   pedido sair vira `WRITE_UNCERTAIN`; só o 401 repete uma vez. Uma falha antes de o pedido sair (o
   endereço não resolve, a conexão recusada) é a falha do fornecedor, sem repetir. Diga se a porta
   nova reusa o `readThrough` (os limites, o turno, `CONNECTOR_CALLED`, `needsReauth`) ou o divide.
4. A coluna `writes text[] not null default '{}'` em `project_connection`, a migração e a permissão
   (D11). `grants.ts`: liberar e tirar uma escrita, com `admitted(…, 'manageConnections')` e o lock
   da linha (D22).
5. `agent-write.ts`: a porta confere numa transação a ligação escolhida e oferecida, a escrita
   liberada e o papel (Papéis da empresa, ou `manageAgents` provisório), e só então chama o executor.
   Uma chamada do turno, como a leitura. Guarde o `toolCallId` enviado: um segundo com o mesmo id é
   `WRITE_UNCERTAIN` sem enviar.
6. A web: `write-dialog.tsx` com uma caixa por escrita do conector, ao lado de "Liberar para ler";
   a linha diz "Lê tudo. Escreve: …".

### Como se prova

Os critérios 1 a 5, cada um pelo seu teste, contra o banco de teste e o dublê do Mercado Livre. Hoje
falham todos.

### Parar se

- A página do Mercado Livre diz que uma pergunta respondida aceita outra resposta, ou que a resposta
  não se apaga: escreva no relatório e pare. A frase do cartão e o critério 5 mudam, e o fundador
  sabe antes.
- Papéis da empresa não está no `main` e a sua decisão de papel por operação mudou de forma: use
  `manageAgents` e diga isso; não invente uma regra por papel.
- O método, o caminho ou os campos de `POST /answers` não são os que este cartão supõe: escreva o
  que leu e pare antes do dublê.

## U2 O agente pergunta

**Base e modelo.** O `main` com a U1. Opus: cruza a ferramenta do agente, as portas dos conectores e
a biblioteca, e a prova da trava é concorrência.

### As linhas da tabela

A ferramenta que escreve, ler sem perguntar, o `yolo` aprova sozinho, a rota da resposta, a trava da
0053, recusar com motivo, mensagem nova recusa, Parar recusa, quem aprovou no registro, sem pessoa
sem escrita.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/agents/` | Muda `tools.ts` (`presetTools` com a ferramenta que se suspende); cria `approval.test.ts`, `approval-load.test.ts` | o controlador "agentes" |
| `apps/server/src/hub/connectors/` | Muda `assistant-port.ts:32` e `builder-port.ts:28` (o `Offered` passa a ter as escritas liberadas), `public.ts` (C4) | a biblioteca, os agentes |
| `apps/server/src/builder/tools/` | Muda `choice.ts:46-48` (o `NOT_A_READ` aceita uma escrita liberada), `check.ts` (`NOT_RELEASED`) | a biblioteca, o Construtor |
| `packages/hub-api/src/tools.ts` | Muda `ToolEffect` (`:96`) para `['READ', 'WRITE']`, que a linha já anuncia para a 24.5 | a web, o servidor |
| `apps/web/src/builder/tools/` | Muda a lista (a marca **Pede aprovação**), o formulário e `tool-page.tsx` (as escritas na escolha) | a área Agentes |
| `apps/server/src/platform/recordings/mastra/` | Cria as gravações do `tool_suspended` e do `pendingSuspensions` da escrita (`npm run record`, T26) | os testes da U2 e da U3 |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/tools.ts
export const ToolEffect = z.enum(['READ', 'WRITE']) // from the operation's class, one owner (C26)

// apps/server/src/builder/agents/tools.ts: the tool of a WRITE operation
suspendSchema: z.object({ kind: z.literal('WRITE'), connectionId: ConnectionId, operation: OperationId, input: z.unknown() })
resumeSchema: z.object({ approved: z.boolean(), reason: z.string().max(500).optional() })
// first run: suspend(payload), nothing sent
// on resume, in order: a person message after the call → 'Recusado porque a pessoa mandou outra mensagem.';
// approved false → 'Recusado: {reason}'; approved → the U1 port write(…, toolCallId), its WriteAnswer said to the model
```

O estado da chamada é o do Mastra (`tool_suspended`, `tool-call-resumed`, o resultado); a volta é uma
união fechada pelo `resumeSchema` (C21). Os ids são `ConnectionId` e `OperationId` com marca (C23). A
classe da operação tem um dono, o kit, e o `ToolEffect` deriva dela (C26). O `resumeData` chega de
fora e passa pelo `resumeSchema` (C27).

### As skills e a leitura

`mastra` (no `node_modules/@mastra/core/dist/docs` 1.82.0: `docs-agents-human-in-the-loop.md` 233-262 e
360-432, `docs-harness-agent-controller.md` 266-470), `node`, `typescript-magician`, as linhas de
`docs/reference/stack.md` das pastas.

### A ordem do trabalho

1. A prova, antes de qualquer código de produto, pelo controlador "agentes" de verdade (o agente que
   delega por execução, `controller.ts:150-168`) e o `PostgresStore` do banco de teste: uma ferramenta
   com `suspend()` e o `yolo` mantido; a conferência da mensagem nova (o `getMessages` na volta traz a
   mensagem escrita depois do pedido); o `toolName` e os `args` no `tool_suspended`; o reinício por um Hub novo ao lado do mesmo banco responde ao
   cartão e roda a escrita uma vez; a retomada leva o `conexus-agent-run` no contexto (ela não passa
   pelo `processInput` de novo); e o critério 8 nos dois ritmos.
2. `ToolEffect` e a biblioteca: a classe da operação dá o efeito; `choice.ts` e `check.ts` aceitam uma
   escrita liberada; a web mostra **Pede aprovação** e a escolha das escritas.
3. As portas: o `Offered` traz as escritas liberadas, pelo `public.ts`.
4. `tools.ts`: a ferramenta de uma escrita se suspende e, ao voltar, segue o contrato acima. A função
   de ferramentas não dá ferramenta de escrita numa rodada sem pessoa. Imprima
   `CONNECTOR_WRITE_APPROVED` ou `_DECLINED`.
5. As gravações do Mastra (T26), e os testes da U2 sobre elas.

### Como se prova

Os critérios 6 a 12. O 8 roda sete cópias ao mesmo tempo, como o critério 1 da decisão 0053. O 10 sobe
um Hub novo ao lado do mesmo banco. Os testes de `permissions.test.ts` passam sem mudar (critério 11).
Hoje falham 6 a 10 e 12.

### Parar se

- O reinício não responde ao cartão guardado, ou roda a escrita duas vezes (na memória ele não
  terminou): diga onde e pare; não se guarda a suspensão em outro lugar.
- A retomada perde o `conexus-agent-run`: diga onde e pare.
- O critério 8 falha no ritmo de 1,5 s, ou uma escrita roda duas vezes: volte ao firstmate com os
  números; não se tenta uma espera nem se aumenta o prazo para passar.
- O fundador escolhe `A2`: este cartão volta ao estudo antes da U2, porque a carga 5 quebra.

## U3 O cartão

**Base e modelo.** O `main` com a U2. Sonnet.

### As linhas da tabela

O cartão, o cartão depois de recarregar.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/conversation/` | Cria `approval-card.tsx` e o seu teste; muda `rows.ts` (o `tool_suspended` com `kind: 'WRITE'` vira o cartão; o do plano continua o do plano), `text.ts`, `session-state.ts` (`pendingSuspensions`) | a sala do agente |
| `docs/reference/screens.md` | Muda: a linha do cartão | o QA |

### A ordem do trabalho

1. `approval-card.tsx` sobre o desenho de `plan-card.tsx`, com as peças de `ui/`: o logotipo e o nome
   da ligação, a ação e os campos do `suspendPayload`, **Aprovar** e **Recusar** (com um motivo
   opcional), e a frase sob a caixa. As respostas vão pela rota `tool-suspension`, como o plano.
2. `rows.ts`: a parte em aprovação vira o cartão; o `tool-call-resumed` e o resultado passam aos
   estados do critério 14.
3. `session-state.ts`: o cartão volta pelo `pendingSuspensions`, como o do plano (`:149-160`). Os
   botões só acendem quando o estado da sessão lido traz o `toolCallId`; isso não protege de um
   clique no mesmo instante (a carga 6), só dá à pessoa o tempo de ler. O estado "parou a conversa"
   vem do `tool_suspension_cancelled` ou da conversa guardada, não do `pendingSuspensions`, que fica
   vazio. **Tentar de novo**, na falha, manda ao agente "Tente de novo" como mensagem.
4. Os textos: "O {agente} quer {ação} no {sistema}", "Aprovar", "Recusar", "Aprovado por você",
   "Recusado", "Recusado porque você mandou outra mensagem", "Recusado porque você parou a conversa",
   "Não conseguiu escrever", "Escrever outra mensagem recusa este pedido.", "Pede aprovação", "Liberar
   para escrever", "Lê tudo. Escreve: …". Vão ao fundador no fim.

### Como se prova

Os critérios 13 a 15, e a QA curta da sala nos dois temas, a 1366 e 390 px. O 16 roda com o modelo de
verdade, pelo firstmate.

### Parar se

A sala trava a caixa de mensagem durante a aprovação: diga onde; não se cria um estado novo.
