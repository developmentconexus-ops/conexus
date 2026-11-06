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
  da forma comparada para o "sim". Ela escolheu `suspend()` com retomada automática para o caderno.
  Esta etapa usa `requireApproval`, porque a escrita num sistema da empresa precisa de um botão que
  o código confere (seção da tabela de referência).
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

- **A espera é do Mastra** (medido). A ferramenta marcada para antes de rodar, e o controlador dos
  agentes mostra o pedido. Aprovar roda uma vez; recusar com motivo não roda, e o agente lê o
  motivo; uma mensagem sua no meio recusa; duas respostas ao mesmo tempo: só uma vale; depois de um
  reinício, a resposta acha o pedido guardado no banco.
- **Com o `yolo` de hoje, ela roda sem perguntar** (medido de novo em 1.82, como na análise do
  Construtor). Por isso o `yolo` dos agentes sai.
- **A trava da decisão 0053 continua no Mastra 1.82** (medido). Com aprovações chegando logo depois
  do pedido, no Postgres, algumas falham com "outra retomada já pegou esta execução": a escrita não
  acontece e a conversa fica parada. A causa é a ordem do Mastra: ele mostra o pedido antes de
  guardar a espera no banco. Com a aprovação no mesmo instante do pedido, 7 de 100 ficaram presas.
  Com 1,5 s, o tempo de alguém ler o cartão, 0 de 200. Esperar o Mastra dizer que guardou reduziu,
  mas não zerou (3 de 180). O erro é para o lado seguro: nenhuma escrita roda duas vezes nem sem
  aprovação. Os números estão depois da tabela de referência.
- **O que as empresas fazem** (documentado, 17 fornecedores lidos em 2026-11-05). Escrever pede
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

- **A. Um agente da empresa pergunta antes de escrever num sistema?**
  - `A1` (recomendo): sim. O controlador dos agentes sai do `yolo`. Uma regra deixa ler sem
    perguntar e pede para escrever, e a rota de aprovação entra na lista fixa com o cartão. Nativo:
    `requireApproval` na ferramenta, `permissionRules` por categoria e a rota `tool-approval` do
    Mastra. Por quê: é o padrão do mercado para escrita, e a partir da 24.6 o agente roda sem você
    olhando. Exemplo: o Glean pausa toda escrita e mostra o sistema, o registro e os campos. O
    risco que fica: um clique muito rápido, antes de o cartão terminar de aparecer, pode deixar a
    conversa parada sem escrever. O botão só acende quando o estado da sessão mostra o pedido, e o defeito vai
    para o Mastra com o roteiro medido.
  - `A2`: manter o `yolo`, como você escolheu para o Builder (decisão 0053, mantida em 2026-10-21
    mesmo para escritas). A escrita sai na hora, sem cartão. Nativo: o `yolo` de hoje.
- **B. Você pode dispensar as próximas perguntas ("sempre permitir")?**
  - `B1` (recomendo): não, cada escrita pergunta. É o que fazem LangChain, Google ADK, n8n,
    Agentforce, Retool e Power Automate. Nativo: nada a fazer.
  - `B2`: "Permitir nesta conversa". Nativo: o `always_allow_category` do controlador, a tecla "a"
    do Mastra Code. Medido: ele vive só na memória e some num reinício, e a pergunta voltaria sem
    aviso.
  - `B3`: "Sempre permitir" guardado por ferramenta, decidido pelo dono, como o Claude Enterprise
    (por papel e conector) e o Dyad (por ferramenta). É nosso, com tabela e tela, e caberia em
    Papéis da empresa.
- **C. Liberar a ligação ao Projeto libera também a escrita?**
  - `C1` (recomendo): não. "Liberar para ler" continua só leitura. Cada escrita se libera à parte,
    por dono ou administrador, e uma escrita nova do conector pede liberação nova. É o "Escrita nova
    pede nova liberação" do roteiro. Referências: o Activepieces escolhe as ações por projeto; no
    Claude Enterprise, a política da empresa é o teto. É nosso: uma coluna na liberação e uma caixa
    na tela.
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
| U2 O agente pergunta | A ferramenta da biblioteca com uma operação de escrita (marcada **Pede aprovação**), que nasce com `requireApproval`; o controlador "agentes" sem `yolo`, com as regras por categoria; a rota `tool-approval` na lista fixa, atrás da espera pela suspensão guardada; os registros da decisão | `apps/server/src/builder/{agents,tools,conversation}/`, `packages/hub-api/src/tools.ts`, `apps/web/src/builder/tools/` | [security](../guides/security.md) | U1 |
| U3 O cartão | O cartão **Aprovar?** na conversa do agente, os seus estados, a volta depois de recarregar e o texto do agente sobre recusa | `apps/web/src/builder/conversation/`, `docs/reference/screens.md` | [web](../guides/web.md) | U2 |

Correm em fila: a U2 lê a porta da U1, e a U3 lê o evento da U2.

**O método das unidades.** Cada unidade segue o `pstack:poteto-mode` como as skills do repositório
já o chamam ([`conexus-scope`](../../.agents/skills/conexus-scope/SKILL.md), passo 4;
[`conexus-build`](../../.agents/skills/conexus-build/SKILL.md)). O cartão não repete o método.

**Orçamento de código alterado.** U1: ~1.200 (a operação e o dublê, o executor, a porta, a coluna,
as duas rotas, a caixa e o seu diálogo). U2: ~800 (a ferramenta, o controlador e as regras, a rota
guardada, os registros, a marca na lista de ferramentas). U3: ~600 (o cartão, os estados, a
releitura). Total da etapa: ~2.600, dentro da regra L2.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Dono ou administrador libera **Responder perguntas** de uma ligação do Mercado Livre já liberada para ler; `GET …/projects/{p}/connections` traz `writes: ['responder_pergunta']`; uma segunda liberação igual não grava nada e responde a mesma | `hub/connectors/grants.test.ts`, "liberar uma escrita" | must |
| 2 | U1 | Recusa: o membro e o desenvolvedor recebem `NOT_FOUND` ao liberar ou tirar uma escrita (S10); uma operação que não é `write` do conector, ou uma ligação ainda não liberada para ler, recebe `REQUEST_MALFORMED` ou `CONNECTION_NOT_FOUND`; nada muda | `hub/connectors/grants.test.ts`, "a escrita recusada" | must |
| 3 | U1 | A porta `write` manda a resposta ao dublê do Mercado Livre uma vez, com o `question_id` e o texto, e devolve `{ kind: 'OK' }`; imprime `CONNECTOR_WRITE_SENT` com a ligação, a operação e a pessoa, sem o texto (S40) | `hub/connectors/agent-write.test.ts`, "a escrita sai" | must |
| 4 | U1 | Recusa na hora de executar: escrita não liberada, liberação tirada depois do pedido, ou papel que não usa a operação dão `NOT_GRANTED`, e o dublê não recebe nada | `hub/connectors/agent-write.test.ts`, "a escrita sem liberação" | must |
| 5 | U1 | Uma resposta cortada, um 502 ou um 503 depois de enviada a escrita não se repete: o modelo recebe `WRITE_UNCERTAIN`, o dublê conta um só pedido; um 429 com espera e um 401 antes de o fornecedor agir repetem uma vez, como na leitura | `packages/connectors/src/mercado-livre/operations.test.ts` e `hub/connectors/agent-write.test.ts`, "a resposta perdida" | must |
| 6 | U2 | Numa conversa de agente com a ferramenta de escrita, a chamada não roda: o stream traz `tool_approval_required` com `toolName` e `args`, e o dublê não recebe nada; uma ferramenta de leitura do mesmo agente roda sem perguntar | `builder/agents/approval.test.ts`, "a escrita espera, a leitura não" | must |
| 7 | U2 | `POST …/sessions/{id}/tool-approval` com `approved: true` roda a escrita uma vez e o turno termina; com `approved: false` e sem motivo, nada roda, e o pedido seguinte ao modelo traz o motivo padrão do Mastra (T26) | `builder/agents/approval.test.ts`, "aprovar e recusar" | must |
| 8 | U2 | A trava da 0053: sete cópias do teste do critério 7 ao mesmo tempo, 56 execuções no `PostgresStore`. Com a aprovação 1,5 s depois de o estado da sessão mostrar o pedido, terminam todas, cada escrita uma vez. Com a aprovação logo que o evento chega, nenhuma escrita roda duas vezes nem sem aprovação, e o teste imprime quantas ficaram presas | `builder/agents/approval-load.test.ts` | must |
| 9 | U2 | Recusa: outra pessoa, ou a mesma em outra conversa, recebe `CONVERSATION_NOT_FOUND` na rota (o `guard.ts`); uma segunda resposta ao mesmo pedido não roda nada; uma resposta depois de uma mensagem nova da pessoa não roda nada (`stale_tool_call`) | `builder/agents/approval.test.ts`, "a resposta recusada" | must |
| 10 | U2 | Depois de um reinício do controlador (um novo sobre o mesmo banco), a rota acha o pedido guardado pelo `toolCallId` e a aprovação roda a escrita uma vez | `builder/agents/approval.test.ts`, "depois do reinício" | must |
| 11 | U2 | Recusa: o Builder, o Assistente e o Construtor continuam em `yolo`, e nenhum recebe ferramenta de escrita; uma rodada de automação não recebe ferramenta de escrita | `builder/conversation/permissions.test.ts` (os casos de hoje passam sem mudar) e `builder/agents/approval.test.ts`, "sem pessoa" | must |
| 12 | U2 | Na lista de ferramentas, a ferramenta com uma operação de escrita diz **Pede aprovação**; a gravação dela numa ligação sem a escrita liberada é recusada com `TOOL_REFUSED` e `reason: 'NOT_RELEASED'` | `builder/tools/routes.test.ts`; `apps/web/src/builder/tools/` o teste da lista | must |
| 13 | U3 | O cartão mostra o agente, o sistema com o logotipo e o nome da ligação, a ação ("Responder perguntas") e cada campo que vai ser escrito, e **Aprovar** e **Recusar**; a caixa de mensagem continua aberta, com a frase "Escrever outra mensagem recusa este pedido." | `web/src/builder/conversation/approval-card.test.tsx` | must |
| 14 | U3 | Depois de **Aprovar**: "Aprovado por você", e o resultado da ferramenta na linha. Depois de **Recusar**: "Recusado". Depois de uma mensagem: "Recusado porque você mandou outra mensagem". Uma falha: "Não conseguiu escrever", com a falha dita | `approval-card.test.tsx`, os quatro estados | must |
| 15 | U3 | Recarregar a página ou abrir a conversa em outra aba traz o cartão esperando; responder numa aba fecha o cartão na outra quando o estado da sessão chega | `web/src/builder/conversation/card-reread.test.tsx`, o caso da aprovação | must |
| 16 | U3 | Avaliação com o modelo de verdade (opt-in): pedido de resposta termina com o cartão; recusado com motivo, o agente diz que não respondeu e não chama de novo a ferramenta no mesmo turno | `builder/agents/agents.eval.test.ts`, "a escrita" | should |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| O cartão **Aprovar?** (U3) | o cartão com o que vai ser escrito e os dois botões | o pedido chegou pelo stream e o estado da sessão ainda não o mostra: os botões desligados | "Aprovando…" ou "Recusando…" nos botões, que ficam desligados | "Não conseguiu escrever", e o agente diz a falha (`NOT_GRANTED`, `WRITE_UNCERTAIN`, as do fornecedor) | o pedido já foi respondido em outra aba: o cartão passa ao estado que o Mastra diz | o membro não chega à conversa de agente (`manageAgents`) | "Recusado", "Recusado porque você mandou outra mensagem", "Recusado porque você parou a conversa" |
| A caixa **Liberar para escrever** em Integrações do Projeto (U1) | a lista das escritas do conector, todas desmarcadas | o conector sem escrita: o botão não aparece | "Liberando…" | a falha da rota, dita na caixa | a ligação saiu: a lista se relê | membro e desenvolvedor não veem o botão (W34, como "Liberar para ler") | — |
| A marca **Pede aprovação** na lista de ferramentas (U2) | ao lado do nome | — | — | — | — | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `ProjectConnection.writes` | as rotas de liberar e tirar uma escrita (U1) | a caixa de Integrações (U1), a porta `write` (U1), a gravação da ferramenta (U2) |
| `requireApproval` da ferramenta do agente | `presetTools` (U2), pela classe da operação | o laço do Mastra |
| O `tool_approval_required` (`toolCallId`, `toolName`, `args`) | o Mastra | o cartão (U3) |
| `pendingApprovals` do estado da sessão | o Mastra | o cartão depois de recarregar (U3) |
| O corpo da rota `{ toolCallId, approved, reason? }` | o cartão (U3) | a rota guardada (U2), o handler do Mastra |

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
| A suspensão da chamada (o Mastra guarda a execução) | duas chamadas no mesmo turno são dois cartões, cada um pelo seu `toolCallId` | a pessoa nunca responde: espera sem prazo; Parar a recusa (`settleSuspendedToolCallsAsDenied`) | o banco do Mastra fora: a rodada falha como hoje, nada enviado | nada novo | 6, 14 |
| A resposta à aprovação (a rota guardada e o `respondToToolApproval` ou o `respondToPersistedToolApproval` do Mastra) | duas abas: uma vale, a outra recebe `not_pending` e o cartão se relê | chega antes de a suspensão estar guardada: a rota espera o `hasPersistedToolApproval` até 5 s; passado o prazo, responde `APPROVAL_NOT_READY` e nada roda; mesmo depois da espera, uma resposta imediata ainda pode perder a corrida do Mastra (`AGENT_RESUME_ALREADY_CLAIMED`): nada roda e a conversa fica parada até a próxima mensagem; chega depois de uma mensagem nova: `stale_tool_call`, nada roda | o banco fora: a falha da rota; o pedido continua guardado | `CONNECTOR_WRITE_APPROVED` ou `_DECLINED` com a pessoa, a ligação, a operação e o `toolCallId` | 7, 8, 9, 10 |
| A escrita no Mercado Livre (a porta `write`, pelo executor) | a retomada é reivindicada uma vez (o Mastra); uma retomada de um processo morto pode rodar a chamada de novo (`agent-BP9OWM6D.js:84330-84336`): ver Parar se, U1 | o corte, o 502 ou o 503 depois de enviar: `WRITE_UNCERTAIN`, sem repetir; o 401 repete uma vez com chave nova; o 429 espera uma vez | o Mercado Livre fora: a falha do fornecedor volta ao modelo; o Hub fora: a rodada falha | `CONNECTOR_WRITE_SENT` ou a falha, sem o texto | 3, 4, 5 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A operação que escreve | U1 | `packages/connectors/src/kernel/operation.ts:4` (`OPERATION_CLASSES` com `write`), toda operação `class: 'read'`; `kernel/definition.ts:72` (a porta de leitura só aceita `read`) | o próprio kit (decisão 0056, M1) | a operação declara a classe; o executor manda pela origem fixa | nativo | — | M1, já dada | `packages/connectors/src/mercado-livre/operations/respostas.ts` |
| Responder uma pergunta do Mercado Livre | U1 | `mercado-livre/operations/perguntas.ts:5-48` (só lê) | a API do Mercado Livre, `POST /answers` com `question_id` e `text` | **não verificado**: a página responde 403 a um cliente comum (`mercado-livre/docs-source.ts:7`) | nativo | o passo 1 da U1 | `D1` | — |
| A escrita mandada uma vez | U1 | `hub/connectors/executor.ts` (a leitura repete no 401 e espera no 429) | n8n e Activepieces mandam a ação uma vez; o Mastra só reivindica a retomada (`agent-BP9OWM6D.js:84313-84340`) | uma escrita perdida não se repete às cegas | embrulhado (a resposta `WRITE_UNCERTAIN` é nossa) | o critério 5 | não precisa | — |
| A liberação da escrita | U1 | `hub/connectors/tables.ts:170-180` (`project_connection`, "to read, the whole connection; no ceiling"); `grants.ts:28-41` (`readOf`: a escrita é "none"); `web/src/hub/projects/grant-dialog.tsx` ("Liberar para ler") | Activepieces `selectedActions` por projeto; Claude Enterprise, a política da empresa como teto (docs, 2026-11-05); Glean, o administrador torna a ferramenta elegível (docs, 2026-11-05) | o administrador escolhe as ações do espaço, e o usuário não alarga | embrulhado (uma coluna e uma caixa nossas) | — | `C1` | `apps/web/src/hub/projects/write-dialog.tsx` |
| Quem usa a escrita | U1 | `hub/identity/roles.ts`, `admission.ts` (`allows`) | Papéis da empresa (better-auth `dynamicAccessControl`) | a declaração do papel decide | nativo | — | "5. Sim", 2026-11-03 | — |
| A porta `write` dos agentes | U1 | `hub/connectors/assistant-port.ts:167-199` (`read`, `operationOf`, só leitura) | a porta de leitura, no próprio repositório | escolhida, admitida e oferecida numa transação; a liberação e o papel relidos na hora de executar | nativo | — | não precisa | `apps/server/src/hub/connectors/agent-write.ts` |
| A ferramenta que escreve | U2 | `builder/agents/tools.ts:33-55` (`presetTools`, só `connectors.read`) | `@mastra/core@1.82.0` `createTool({ requireApproval })` (`dist/docs/references/docs-agents-human-in-the-loop.md:305-358`) | a chamada para antes de `execute`, e o stream manda `tool-call-approval` com `toolName` e `args` | nativo | proof P1 | `A1` | — |
| Ler sem perguntar, escrever perguntando | U2 | `builder/agents/controller.ts:226-231` (`initialState: { yolo: true }`) | `@mastra/core@1.82.0` `toolCategoryResolver` e `permissionRules` (`docs-harness-agent-controller.md:270-310`; `dist/agent-controller-BDds1y5w.js:5166-5191`) | nega por ferramenta, depois `yolo`, depois a regra da ferramenta, o *grant*, a regra da categoria, senão `ask` | nativo | proof P8 | `A1` | — |
| O `yolo` aprova sozinho | U2 | o mesmo | `agent-controller-BDds1y5w.js:5179` | com `yolo`, toda aprovação vira `allow` | nativo | proof P3 | 0053, `A1` | — |
| A rota da resposta | U2 | `builder/conversation/guard.ts:24-31` (a lista fixa sem `tool-approval`), `:120-147` (a conversa é da pessoa) | `@mastra/server` `dist/server/handlers/agent-controller.js:711-758` | responde ao portão vivo; sem portão, acha a execução guardada e retoma (`respondToPersistedToolApproval`) | nativo | proof P5, P7 | não precisa | — |
| A trava da 0053 | U2 | — | `agent-BP9OWM6D.js:19450-19500` (o pedido sai antes de a suspensão ser guardada) e `:84343-84434` (a reivindicação espera `suspended`) | quem responde antes recebe `AGENT_RESUME_ALREADY_CLAIMED`, e a execução para sem fim | remendo até o Mastra consertar: a rota espera `hasPersistedToolApproval` (`agent-controller-BDds1y5w.js:5234-5243`) e o botão espera o estado da sessão; reduz, não zera | proof P9, P10, cargas 1 a 4 (abaixo), `@mastra/core` 1.82.0 | `A`, com o risco dito | `apps/server/src/builder/agents/approval-route.ts` |
| Recusar com motivo | U2 | — | `docs-agents-human-in-the-loop.md:95-107` | o motivo volta ao modelo no lugar do resultado | nativo | proof P2 | não precisa | — |
| Mensagem nova recusa | U2 | — | `agent-controller-BDds1y5w.js:5447-5456` (`interrupted_by_user_message`) | a mensagem recusa o portão aberto | nativo | proof P6 | não precisa | — |
| Parar recusa | U2 | — | `agent-controller-BDds1y5w.js:5070-5089` | abortar nega as chamadas suspensas | nativo | lido | não precisa | — |
| "Sempre permitir" | fica de fora (`B1`) | — | `always_allow_category` (`agent-controller-BDds1y5w.js:5196-5222`); Mastra Code `mastracode/tui/src/tui/components/tool-approval-dialog.ts:88` (`mastra-1.82@6e8dfcb8`); Dyad `src/ipc/utils/mcp_consent.ts:10-27,87-88` (`dyad@902829f`) | o Mastra lembra só na memória; o Dyad guarda por ferramenta | nativo (`B2`) ou nosso (`B3`) | proof P4, P9 | `B` | — |
| Quem aprovou, no registro | U2 | `hub/connectors/routes.ts:106-115` (as linhas de log da liberação) | Claude Code, o evento `tool_decision`; o Mastra não guarda quem aprovou | uma linha por decisão | embrulhado (a linha de log é nossa) | — | não precisa | — |
| Sem pessoa, sem escrita | U2 | `builder/automations/run.ts:38` (a automação roda só o Assistente) | Retool (docs, 2026-11-05: "only tools that do not require consent are accessible"); Glean (só sessões interativas) | a ferramenta que pede aprovação não é oferecida | nativo (a função de ferramentas do agente) | — | 24.6 decide o resto | — |
| O cartão | U3 | `web/src/builder/conversation/plan-card.tsx:75-108`, `question-card.tsx` | Conexus OS `e0353c36` `apps/web/src/features/builder/construir/plan-pt.tsx:50-63` e `apps/hub/src/platform/failure-text.generated.ts:48`; bolt.diy `app/components/chat/ToolApprovalTray.tsx:43-110` (`353b44c`: aprovar ou recusar por chamada, com o caminho, a consulta ou o comando); Glean (o sistema, o registro e uma prévia) | mostra o que vai ser escrito e dois botões | nativo (as nossas peças); desenho trazido: o do cartão do plano | — | não precisa | `apps/web/src/builder/conversation/approval-card.tsx` |
| O cartão depois de recarregar | U3 | `web/src/builder/conversation/session-state.ts` | `@mastra/server` `agent-controller.js:543` (`pendingApprovals` no estado da sessão) | o estado da sessão traz os portões abertos | nativo | o critério 15 | não precisa | — |

**A medida da trava**, Postgres 18 local, `@mastra/pg` 1.35.0, modelo de mentira, 20 sessões por
rodada, todas aprovadas ao mesmo tempo:

- A suíte inteira, aprovação logo que o evento chega: 5 rodadas, 7 execuções presas de 105 (6 na
  carga, 1 numa sessão só).
- Carga 1, aprovação logo que o evento chega: 5 rodadas, 7 presas de 100.
- Carga 2, aprovação só depois de `hasPersistedToolApproval`: 5 rodadas logo depois da carga 1, 0 de 100;
  sozinha, 3 presas de 180 (a décima rodada parou em "too many clients", defeito do teste, que
  abria um banco por rodada).
- Carga 3, aprovação na hora e, no `AGENT_RESUME_ALREADY_CLAIMED`, nova resposta pela execução guardada:
  10 rodadas, as 200 escritas rodaram (8 pela segunda resposta), mas as 8 sessões que perderam a
  corrida ficaram sem `agent_end`. Repetir não conserta.
- Carga 4, aprovação 1,5 s depois do pedido: 10 rodadas, 0 de 200.
- Em nenhum caso uma escrita rodou duas vezes ou sem aprovação.

**A medida do transplante.** Nada trazido do repositório antigo: o cartão segue o desenho do cartão
do plano que o `main` já tem.

**A dívida.** Nenhuma nova. A decisão 0053 ganha, no fechamento, uma nota de escopo: ela vale para o
Builder, o Assistente e o Construtor; o controlador dos agentes sai dela por esta etapa.

## U1 A escrita e a liberação

**Base e modelo.** O `main` do dia, com a 24.4 e Papéis da empresa. Sonnet: segue a porta de leitura
e a liberação de hoje, sem desenho novo entre módulos.

### As linhas da tabela

A operação que escreve, responder uma pergunta, a escrita mandada uma vez, a liberação da escrita,
quem usa a escrita, a porta `write` dos agentes.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Muda `definition.ts` (as escritas do conector, `writes`, separadas da porta de leitura) | o kit, a conformidade, o Hub |
| `packages/connectors/src/mercado-livre/` | Cria `operations/respostas.ts`; muda `operations/index.ts`, o dublê (`fake-routes*.ts`) | o kit |
| `packages/hub-api/src/project-connections.ts` | Muda `ProjectConnection` (`writes`), as rotas de liberar e tirar uma escrita | o Hub, a web |
| `apps/server/src/hub/connectors/` | Muda `tables.ts` (a coluna), `grants.ts` (liberar e tirar uma escrita, `writeOf`), `executor.ts` (a escrita uma vez), `routes.ts`; cria `agent-write.ts` | a porta dos agentes (U2) |
| `apps/server/migrations/` | Cria a migração da coluna `writes` (D11: a permissão de `UPDATE` da coluna para o papel da empresa, num commit próprio, com a palavra do fundador na aprovação desta página) | o Drizzle |
| `apps/web/src/hub/{projects,connectors}/` | Cria `write-dialog.tsx`; muda `project-integrations.tsx`, `text.ts` | Integrações do Projeto |

### Os contratos que a unidade cria

```ts
// packages/connectors/src/kernel/definition.ts
writes?: readonly Operation<unknown, unknown, 'write'>[] // what the connector may send; none by default

// packages/hub-api/src/project-connections.ts
export const OperationId = /* the kit's OperationId, re-exported */
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
write(scope: SessionScope, call: { connectionId: ConnectionId; operation: OperationId; input: unknown; turn: TurnKey; signal?: AbortSignal }): Promise<WriteAnswer>
```

O estado é a união acima, separada por `kind` (C21). Os ids são os de hoje (`ConnectionId`,
`OperationId`, `TurnKey`), conferidos na porta (C23). A lista das escritas liberadas tem um dono, a
coluna, lida só por `grants.ts` (C26). A entrada da operação é o esquema Zod dela, pelo kit (C27).
O arquivo tomado como modelo é `assistant-port.ts` (`read`), que cumpre C21, C23 e C26.

### As skills e a leitura

As linhas de `docs/reference/stack.md` das pastas da unidade. Primeiro: o `node`, o Drizzle da casa
(`data.md`) e a skill `mastra` não, porque esta unidade não toca o Mastra.

### A ordem do trabalho

1. A API: leia a página `gerenciamento-perguntas-respostas` pelo `docs-source.ts` do kit, como a
   leitura das perguntas foi lida. Confirme o método, o caminho, os campos, o limite do texto, se uma
   resposta se apaga ou edita, e o que o Mercado Livre responde a uma pergunta já respondida. Escreva
   o que leu no relatório da construção.
2. O kit: `writes` em `defineConnector`, com a conformidade conferindo que cada uma é `write`; a
   operação `responder_pergunta` com o esquema Zod e o seu dublê. Regras: C21, C27.
3. O executor: uma escrita sai uma vez; um corte, um 502 ou um 503 depois de enviada viram
   `WRITE_UNCERTAIN`. O 401 e o 429 seguem a leitura.
4. A coluna `writes text[] not null default '{}'` em `project_connection`, a migração e a permissão
   (D11). `grants.ts`: liberar e tirar uma escrita, com `admitted(…, 'manageConnections')` e o lock
   da linha (D22).
5. `agent-write.ts`: a porta confere numa transação a ligação escolhida e oferecida, a escrita
   liberada e o papel (Papéis da empresa, ou `manageAgents` provisório), e só então chama o executor.
   Uma chamada do turno, como a leitura.
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

## U2 O agente pergunta

**Base e modelo.** O `main` com a U1. Opus: cruza o controlador dos agentes, a suspensão guardada do
Mastra e a rota da lista fixa, e a corrida da trava é concorrência.

### As linhas da tabela

A ferramenta que escreve, ler sem perguntar e escrever perguntando, o `yolo` aprova sozinho, a rota
da resposta, a trava da 0053, recusar com motivo, mensagem nova recusa, Parar recusa, quem aprovou no
registro, sem pessoa sem escrita.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/agents/` | Muda `tools.ts` (`presetTools` com a escrita), `controller.ts` (`yolo: false`, `permissionRules`, `toolCategoryResolver`); cria `approval-route.ts`, `approval.test.ts`, `approval-load.test.ts` | o controlador "agentes" |
| `apps/server/src/builder/tools/` | Muda `check.ts` (uma operação de escrita só com a escrita liberada), `choice.ts` | a biblioteca, o Construtor |
| `apps/server/src/builder/conversation/` | Muda `guard.ts` (`POST ${SESSION}/tool-approval` na lista fixa, ligado à rota guardada) | todos os controladores |
| `packages/hub-api/src/tools.ts` | Muda a ferramenta (`asks: boolean`, lido da classe da operação) | a web |
| `apps/web/src/builder/tools/` | Muda a lista (a marca **Pede aprovação**) | a área Agentes |

### Os contratos que a unidade cria

```ts
// apps/server/src/builder/agents/controller.ts
const CATEGORY = { read: 'connector_read', write: 'connector_write' } as const
initialState: {
  yolo: false,
  permissionRules: { categories: { connector_read: 'allow', connector_write: 'ask' }, tools: {} },
}
toolCategoryResolver: (toolName) => (writesOf(toolName) ? CATEGORY.write : CATEGORY.read) // every tool has one

// apps/server/src/builder/agents/approval-route.ts
// Before Mastra's handler of POST /agent-controller/agentes/sessions/:sessionId/tool-approval:
// waits until session.hasPersistedToolApproval(toolCallId) or 5 s; then lets the handler run.
// Failure: APPROVAL_NOT_READY (409), nothing runs.
```

O estado da chamada é o do Mastra (`tool_approval_required`, a resposta aceita ou `not_pending` ou
`stale_tool_call`). O Hub só acrescenta `APPROVAL_NOT_READY` ao conjunto fechado `FailureCode` (C21).
O `toolCallId` é do Mastra e chega pelo corpo, conferido pelo esquema do handler.

### As skills e a leitura

`mastra` (no `node_modules/@mastra/core/dist/docs` 1.82.0: `docs-agents-human-in-the-loop.md`,
`docs-harness-agent-controller.md` 266-470, `reference-agent-controller-session.md`, "Permissions" e
"Approval"), `node`, `typescript-magician`, as linhas de `docs/reference/stack.md` das pastas.

### A ordem do trabalho

1. A prova, antes de qualquer código de produto, pelo controlador "agentes" de verdade (o agente que
   delega por execução, `controller.ts:150-168`) e o `PostgresStore` do banco de teste: uma ferramenta
   `requireApproval` com `yolo: false`; confira que a retomada leva o `conexus-agent-run` no contexto
   (a retomada não passa pelo `processInput` de novo), e meça o critério 8
   com e sem a espera da rota.
2. `tools.ts`: a ferramenta de uma operação `write` nasce com `requireApproval: true` e chama a porta
   `write` da U1; o `asks` da ferramenta sai da classe da operação, num dono só (C26).
3. `controller.ts`: `yolo: false`, as regras e o `toolCategoryResolver`; apague a frase da 0053 sobre
   "nothing waits to be approved". A função de ferramentas não dá ferramenta de escrita numa rodada
   sem pessoa.
4. `approval-route.ts` e `guard.ts`: a rota entra na lista fixa só para o controlador "agentes"; a
   espera é um `preHandler` depois do `guard`. Imprima `CONNECTOR_WRITE_APPROVED` ou `_DECLINED`.
5. `check.ts`: gravar uma ferramenta com uma operação de escrita sem a escrita liberada é
   `TOOL_REFUSED` com `reason: 'NOT_RELEASED'`.

### Como se prova

Os critérios 6 a 12. O 8 roda sete cópias ao mesmo tempo, como o critério 1 da decisão 0053. O 10
cria um segundo controlador sobre o mesmo banco, como a prova P5. Os testes de `permissions.test.ts`
passam sem mudar (critério 11). Hoje falham 6 a 10 e 12.

### Parar se

- A retomada perde o `conexus-agent-run`, ou o agente que delega não acha a execução guardada: diga
  onde e pare; não se guarda a execução em outro lugar.
- O critério 8 falha na parte de 1,5 s, ou uma escrita roda duas vezes: volte ao firstmate com os
  números; não se tenta outra espera nem se aumenta o prazo para passar.
- O Mastra publica o conserto da ordem (o pedido só sai depois de a suspensão ser guardada): suba a
  versão e apague a espera da rota, em vez de mantê-la.

## U3 O cartão

**Base e modelo.** O `main` com a U2. Sonnet.

### As linhas da tabela

O cartão, o cartão depois de recarregar.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/conversation/` | Cria `approval-card.tsx` e o seu teste; muda `rows.ts` (o `tool_approval_required` vira o cartão), `text.ts`, `session-state.ts` (`pendingApprovals`) | a sala do agente |
| `docs/reference/screens.md` | Muda: a linha do cartão | o QA |

### A ordem do trabalho

1. `approval-card.tsx` sobre o desenho de `plan-card.tsx`, com as peças de `ui/`: o logotipo e o nome
   da ligação, a ação e os campos de `args`, **Aprovar** e **Recusar**, e a frase sob a caixa.
2. `rows.ts`: a parte em aprovação vira o cartão; o `tool-call-resumed` e o resultado passam aos
   estados do critério 14.
3. `session-state.ts`: o cartão volta pelo `pendingApprovals`; depois de um reinício, pela parte
   guardada da conversa. Os botões só acendem quando o `pendingApprovals` lido traz o `toolCallId`
   (a trava da 0053, U2).
4. Os textos: "O {agente} quer {ação} no {sistema}", "Aprovar", "Recusar", "Aprovado por você",
   "Recusado", "Recusado porque você mandou outra mensagem", "Recusado porque você parou a conversa",
   "Não conseguiu escrever", "Escrever outra mensagem recusa este pedido.", "Pede aprovação", "Liberar
   para escrever", "Lê tudo. Escreve: …". Vão ao fundador no fim.

### Como se prova

Os critérios 13 a 15, e a QA curta da sala nos dois temas, a 1366 e 390 px. O 16 roda com o modelo de
verdade, pelo firstmate.

### Parar se

A sala trava a caixa de mensagem durante a aprovação: diga onde; não se cria um estado novo.
