# O plano que trava e fecha

Trilho: harness

Trilha Agentes e Apps, marco `A3` ([roteiro](../roadmap.md), "O plano que trava e fecha"): o Construtor de apps
não escreve no app antes de você aprovar o plano, não diz "pronto" com um pedido do plano em aberto, e o juiz de
fim de turno roda nos quatro agentes. Entram também a pesquisa antes do plano e o plano em fases do app grande
(o roteiro põe "pesquisa e plano em `A3`") e o Code Mode do Conexus da plataforma. A ordem é a do roteiro: depois
da etapa 2 do harness ("Uma sala e os nomes certos") e do `A2`. O cartão é escrito enquanto a etapa 2 termina e
constrói sobre as pastas que ela deixa (`apps/server/src/harness/` e `apps/server/src/agents/<agente>/`).
Aprovado pelo fundador em 2026-11-25, espera num pull request em rascunho (delivery L5) a vez dele no roteiro:
a etapa 2, depois o `A2`, depois o `A3`.

Lido em `main` `a1d85d32` (2026-11-24). Versões: `@mastra/core` 1.83.0, `@mastra/server` 1.83.0. A prateleira do
Mastra é a 1.83 (commit `d60ba71b`), com o Mastra Code (`@mastra/code-sdk` 1.19.0) e a Factory em `mastracode/`.
Abreviações: `B/` = `apps/server/src/builder/` (o caminho de hoje); `H/` = `apps/server/src/harness/` e `A/` =
`apps/server/src/agents/` (os caminhos depois da etapa 2); `W/` = `apps/web/src/harness/room/`; `C/` =
`packages/core/src`, `MC/` = `mastracode/sdk/src` e `F/` = `mastracode/factory/src` na prateleira.

Os estudos, fora do repositório (delivery L21): `conexus-a3-plano-goal-codemode` (o plano, o goal, as guardas, o
Code Mode e a pergunta do fundador sobre o modo plano) e `conexus-harness-criacao-estudo` (a pesquisa e o plano de
um app complexo). Antes deles: `conexus-um-agente-com-modos-estudo` (seções 3.4, 3.5 e anexo H1) e
`conexus-fim-do-turno-nativo-estudo`.

## A página do fundador

**No fim desta etapa** você pede um app novo no Construir, e o Conexus pergunta, pesquisa, escreve o plano com
os seus pedidos numerados e espera. Se ele tentar mexer no app antes de você aprovar, o próprio Conexus recusa,
e o Código não muda. Você aprova, ele constrói fase a fase, e no fim cada pedido aparece conferido no plano; com
um pedido em aberto, ele não diz "pronto". Nas Conversas, ele responde uma conta que cruza várias tabelas do lago
num programa só. No Construtor de agentes, nas Conversas e num agente salvo, o turno também não acaba com tarefa
aberta.

**O roteiro de uso.**

1. No Hub da nuvem, num Projeto sem app, abra **Construir** e peça "um app de chamados internos". O Conexus faz
   as perguntas, pode pedir um app que você admira como referência, e mostra o plano no cartão de sempre, com os
   pedidos numerados (`P1`, `P2`…) e as fases.
2. Antes de aprovar, escreva "pode começar já a tela de chamados". Ele responde que espera a sua aprovação, e o
   **Código** não muda.
3. Toque **Aprovar e construir**. A construção começa, e o painel "Tarefas" mostra cada fase com os pedidos que
   ela fecha.
4. No fim, o cartão do plano mostra cada pedido conferido. Se um ficou aberto, aparece aberto, e a última
   mensagem diz qual e por quê.
5. Peça uma mudança pequena ("troque o título da tela"): ele faz direto, sem plano.
6. Abra **Conversas** e pergunte algo que cruza duas tabelas copiadas ("quantos chamados por cliente, este mês").
   A resposta vem de uma leitura só, e diz de quando é o dado.

**O que você faz, e quando.** Antes: nada. No começo: nada, esta página e as decisões já estão aprovadas. Depois:
vê o protótipo do fim do plano (cada pedido conferido) e o estado "esperando a sua aprovação", a 1366 e 390 px,
e o aprova. Se quiser as duas medições com modelo real (seção "O custo do Lab"), dá a palavra. No fim: faz o
roteiro, diz o que viu e aprova os textos novos.

**A visão.** A etapa serve a linha da visão em que o Conexus entrega o que a pessoa pediu e mostra o que fez: o
pedido vira plano aprovado e o plano vira conferência. Não abre dado, não muda permissão de tabela e não cria
rota: a aprovação já passa pela rota nativa `tool-suspension`, atrás do guarda de hoje. A segurança muda num
ponto só: o Code Mode entra nas três conversas da plataforma (Construir, Agentes e Conversas), e no programa entram
só leituras (decisão 4); toda escrita fica direta, com a aprovação de hoje.

**O que as referências fazem, em palavras simples.** O time do Mastra quase não usa o modo plano: o CTO disse em
2026-09-29 "I don't even use plan mode anymore in Mastra Code. I just plan with build mode", e a Factory deles
roda sem modos, com o plano escrito pelo agente normal e uma porta em código que só deixa o trabalho seguir
depois do plano aprovado. Nos construtores para quem não programa (Lovable, Base44, Bolt, Replit, Dyad), o
construir é o padrão, nenhum obriga plano em todo pedido, e todos têm um Aprovar no plano antes da mudança
grande. O Replit tirou o botão de plano: "You can simply ask Replit to plan". Por isso o plano aqui continua
o arquivo que o Conexus escreve, como hoje, e a trava é código que entra quando há plano, nunca um botão que você
precisa lembrar de ligar.

**Fica de fora.**

- **A rede sob pedido na máquina**: a sua resposta (B, a lista da empresa em Configurações) mexe em segurança e
  emenda a decisão 0051; vai a um cartão próprio, por uma issue `next-card`.
- **Os detectores prontos do Mastra** (injeção de instruções, dados pessoais, moderação, idioma): cada um chama um
  modelo a cada mensagem, na conta da empresa, e a recusa dele fecha a resposta sem nada na tela. As guardas desta
  etapa são as que recusam por código, uma a uma, cada uma com a recusa provada (a sua resposta do cartão 4,
  2026-11-24).
- **O cache do texto de sistema** (PROMPT-1 da auditoria) e **a ordem de instruções igual para os quatro** (issue
  1017): mudam o que o modelo lê em todos e se medem agente por agente (`docs/explanation/harness.md:70-72`).
- **A issue 1018** (o Testar do Construtor no ChatGPT): pede prova paga.
- **A issue 1327** (o Construtor de apps escreve em inglês entre as ferramentas): nenhuma referência lida fixa o
  idioma por mecanismo, e a prova pede modelo real. Fica para a primeira rodada de Lab depois desta etapa.
- **O supervisor** (o Conexus que propõe, passa ao Construir e acompanha): é do `A6` (cartão 4, 2026-11-24).

**As decisões suas nesta etapa.** Respondidas em 2026-11-25, no quadro desta etapa: "1 A", "2 A" e "3 B",
com a observação na 3: "Mastra code usa code mode e quero seguir o padrão da harness deles também, ver todas
features e como fazem e factory também que a utiliza e acrescenta". E a 4, que a observação abriu, no chat: "B".
As palavras estão no [arquivo de aprovação](../approvals/o-plano-que-trava-e-fecha.md).

- **1. Quando o Construir planeja, e o que trava: (a).** O plano continua o arquivo que o Conexus escreve; a
  trava é código e entra quando há plano: a conversa de um app novo começa travada, e um plano proposto trava a
  escrita até "Aprovar e construir"; a mudança pequena segue direto. Factory, Replit, Lovable; nativo: o modo do
  controlador do Mastra com `transitionsTo`, que a aprovação já troca sozinha, e a guarda de escrita do Mastra
  Code; você nunca vê o modo. Veredito: embrulhado.
- **2. Quem confere o plano no fim: (a).** O juiz por código que já existe prende o fim pelos pedidos abertos e
  pela conferência do app; o goal nativo guarda o plano aprovado como objetivo, e um juiz de modelo, só de
  leitura, confere os pedidos, até 20 rodadas, como a Factory. Custa uma chamada de modelo por fim candidato, na
  conta da empresa. Veredito: nativo.
- **3. Onde entra o Code Mode da plataforma: (b), também no Construir.** As três conversas da plataforma e o
  agente salvo usam a mesma peça. Cada conversa roda o programa na sua própria máquina, porque as três têm uma ("o
  assistente, ele tem sandbox, ué ... Pra mim eles teriam que ter a mesma harness", 2026-11-25). O resto dessa fala (o
  Assistente como um computador para Python, PDF, Word, Excel, HTML, arquivos e imagens; o Construtor de agentes
  rodando código e simulações) não entra nesta etapa: vai como pergunta ao estudo do `A6` e da harness comum.

  **O padrão do Mastra, rastreado.** O padrão nativo é o `createCodeMode` do `@mastra/core`, na página "Code mode"
  (`node_modules/@mastra/core/dist/docs/references/docs-agents-code-mode.md`, a mesma de mastra.ai em 2026-11-25) e na
  referência (`reference-tools-create-code-mode.md`): (1) cada `createCodeMode` guarda a sua própria lista, e o
  programa só chama as funções `external_*` das ferramentas dela; várias ferramentas de código numa conversa, com
  ids diferentes, dão escopos separados, "for least-privilege scoping and to keep each tool's prompt surface small"
  (`docs-agents-code-mode.md:105-133`; `reference-tools-create-code-mode.md:59`); (2) o programa roda numa fronteira
  escolhida: numa máquina remota, com o `E2BCodeModeTransport` do `@mastra/e2b` (`:139-153`), ou isolado no próprio
  processo, sem máquina, com `IsolatedVmCodeModeTransport` ou `QuickJsCodeModeTransport` (`:155-183`); (3) as
  ferramentas rodam no servidor, com validação, contexto do pedido e rastreio (`:30`), e devolvem
  `{success, result, logs, error}` (`reference-tools-create-code-mode.md:77-93`); (4) o despacho do programa não
  passa pela aprovação (`C/tools/code-mode/code-mode.ts:104-119`), e por isso a ferramenta com aprovação fica direta
  (`docs-agents-code-mode.md:137`). O Mastra Code e a Factory não usam o Code Mode no código (nenhum `createCodeMode`
  em `mastracode/`, na prateleira 1.83 e no `main` do Mastra em `187a7a86`); a Factory chama as ferramentas do
  Mastra Connect uma a uma e tira das sessões as que apagam ou arquivam e as de GitHub e GitLab
  (`mastracode/factory/src/integrations/platform/connect/session-tools.ts:6-12`, `:21-25`, `:59-73`).

- **4. O que entra no programa: (b), só leituras.** Uma ferramenta de código por conversa, `execute_typescript`,
  com a lista das leituras dela; toda escrita fica direta, uma linha por escrita, como o agente salvo já faz
  (`B/agents/agent.ts:251-252`). A guarda do plano vale dentro do programa também, porque mora no próprio
  `execute` da ferramenta (`packages/core/src/workspace/tools/tools.ts:376-400`). Veredito: nativo.

**Já respondidas, no quadro do estudo irmão (2026-11-25).** Elas entram como estão:

- **A pesquisa antes do plano:** "A: etapa Pesquisar no playbook do plano e o ajudante pesquisar no Construir,
  oferecido". A skill do plano ganha a etapa Pesquisar (uma referência que você admira, o que um bom app deste tipo
  tem, sugestões com a origem, nada da empresa na busca), e o Construir ganha um ajudante só de leitura, que lê os
  sistemas e a web e que ele decide quando chamar (U3).
- **O plano do app grande:** "A: um plano por rodada, Ordem em fases, uma aprovação, constrói até cada pedido
  conferido" (U3).
- **A rede sob pedido:** "B: lista da empresa mantida por dono ou administrador em Configurações". Fica fora desta
  etapa, num cartão próprio que emenda a decisão 0051.

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| P1 | U1 | Os dois modos do Construtor de apps: `plano` (leitura, fala e a escrita só pela guarda) com `transitionsTo: 'conversa'`; a conversa de um Projeto sem versão salva começa em `plano`; um `submit_plan` em `conversa` passa a sessão a `plano` antes de suspender | `H/spec/`, `A/app-builder/` | testing | o fechamento da etapa 2 |
| P1 | U2 | As guardas da escrita: o gancho da máquina recusa, em `plano`, escrever fora de `.conexus/plans/*.md`, e, em qualquer modo, reescrever um plano aprovado; o plano aprovado vai ao estado do fio (TURN-2); cada recusa diz o que fazer em vez dela; saem as frases do prompt e das skills que o código passa a garantir | `H/machine/`, `A/app-builder/`, `packages/app/skills/` | testing | U1 |
| P1 | U3 | A pesquisa e o plano numerado: a skill do plano ganha a etapa Pesquisar e o modelo do plano os pedidos `P1…Pn`, as fases e as Referências; o ajudante `pesquisar` sobe ao comum e o Construir ganha o seu, só de leitura, com os sistemas e a `web_fetch` do Hub; o `submit_plan` recusa um plano sem pedidos numerados; a aprovação escreve uma tarefa por fase, com os pedidos dela, e liga o goal com o plano | `A/app-builder/`, `H/spec/`, `H/tools/research.ts`, `A/assistant/`, `packages/app/skills/` | testing | U2 |
| P2 | U4 | O juiz das tarefas abertas nos quatro: a parte comum do `conexusCheck` sobe a `H/turn/`; o Assistente, o Construtor de agentes e o agente salvo a registram (o agente salvo ganha o `TaskSignalProvider`); a conferência do app fica do Construtor de apps; saem as frases de "rode `task_check` antes de terminar" | `H/turn/`, `A/*/` | testing | o fechamento da etapa 2 |
| P2 | U5 | O Code Mode da plataforma pelo `createCodeMode` do core: uma ferramenta `execute_typescript` só de leituras por conversa, com a lista das leituras de cada uma, rodando na máquina da própria conversa (`E2BCodeModeTransport`) no Construir, nas Conversas e no Construtor de agentes; o agente salvo passa à mesma peça | `H/tools/code-mode.ts`, `A/*/` | testing | U4, P1 |
| P2 | U6 | As recusas como erro da ferramenta (FERR-2 e AGT-7 da auditoria, issue 1016): a recusa do fornecedor chega ao modelo pelo caminho nativo do erro (C79), com uma dona | `H/tools/`, `A/*/` | testing | U4 |
| P3 | U7 | O fim do plano na tela: o cartão do plano mostra cada pedido conferido ou aberto; a caixa diz que o Conexus espera a aprovação; o painel de tarefas mostra a fase e os pedidos | `apps/web/src/harness/room/`, `apps/web/src/agents/app-builder/`, `packages/hub-api/src/` | design | U3, o protótipo |

P1 trava e fecha o plano; P2 leva o juiz, o Code Mode e as recusas aos quatro. Os dois dividem só a ficha do Assistente
(o ajudante sai dela na U3, o Code Mode entra na U5), então P2 parte do P1 integrado; P3 espera o protótipo e o P1. Uma unidade nunca cruza dois pull requests (delivery L9).

**Orçamento de código alterado.** Hipótese, sem testes nem retratos. U1: 180. U2: 200 (menos 40: sai a leitura por
`getMessages`). U3: 400, mais as skills (o plano 250, o ajudante 150). U4: 200 (menos 60 nos agentes). U5: 150 (a
peça comum 60, as três fichas 90; menos 40 no agente salvo).
U6: 250 (menos 80: as três cópias de AGT-7). U7: 200. Total: 1.580 linhas, dentro das 4.000 de delivery L2.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Numa conversa nova de um Projeto sem versão salva, a sessão está em `plano`; numa de um Projeto com versão, em `conversa`; as conversas guardadas com `conversa` seguem nela | `A/app-builder/conversation-plan.test.ts`, "a conversa começa no modo do Projeto" | must |
| 2 | U1 | Um `submit_plan` chamado em `conversa` passa a sessão a `plano` antes de suspender | idem, "propor um plano trava" | must |
| 3 | U1 | "Aprovar e construir" passa a sessão a `conversa` pela rota nativa `tool-suspension`, e a escrita volta; "Pedir ajustes" deixa em `plano` | idem, "aprovar destrava, pedir ajustes não" | must |
| 4 | U2 | **Recusa.** Em `plano`, o modelo (dublê) chama `write_file`, `edit_file`, `delete` ou `mkdir` fora de `.conexus/plans/*.md`: o resultado é a recusa com o que fazer em vez dela, e a pasta do app na máquina não muda; `execute_command` não é oferecido. Rota: `POST …/sessions/:sessionId/messages` | idem, "o modelo tenta escrever antes da aprovação" | must |
| 5 | U2 | **Recusa.** Em qualquer modo, `write_file` ou `edit_file` sobre um plano aprovado é recusado, com "peça ajustes num plano novo" | idem, "o plano aprovado não muda no disco" | must |
| 6 | U2 | **Recusa.** O `submit_plan` de um plano aprovado é recusado mesmo depois que a memória observacional dobrou a conversa (TURN-2) | idem, com o dublê de observação | must |
| 7 | U3 | **Recusa.** Um plano sem a lista de pedidos `P1…Pn` volta ao modelo com o motivo e não abre o cartão | idem, "o plano sem pedidos numerados" | must |
| 8 | U3 | Aprovado o plano, a lista de tarefas da conversa tem uma tarefa por fase, com os pedidos dela, e o objetivo do fio é o plano | idem, "a aprovação semeia as fases" | must |
| 9 | U3, U4 | **Recusa.** Com uma tarefa aberta, o fim do turno pontua 0 e o motivo volta ao modelo, até `CHECK_LIMITS.checks`; na última, a versão é salva como não terminada | `A/app-builder/conversation-judge.test.ts` (o de hoje, nas fases) | must |
| 10 | U3 | Com a decisão 2 (a): o juiz de modelo do goal roda só depois do juiz por código, com ferramentas só de leitura, e para em 20 rodadas | `A/app-builder/conversation-goal.test.ts`, com o dublê de modelo | must |
| 11 | U4 | **Recusa.** O mesmo fim com tarefa aberta no Assistente, no Construtor de agentes e no agente salvo | `A/assistant/assistant-turn.test.ts`, `A/agent-builder/construtor.test.ts`, `A/saved-agent/agent.test.ts`, o caso novo | must |
| 12 | U4 | As frases "rode `task_check` antes de terminar" saem dos quatro prompts; os retratos `request.test.ts` mudam só nelas e no provedor de tarefas do agente salvo | os quatro `request.test.ts`, regravados, com a diferença listada no pull request | must |
| 13 | U3 | **Recusa.** O ajudante de pesquisa do Construir lê sistemas e a web e não escreve: uma escrita dele é recusada | `A/app-builder/research.test.ts` | must |
| 14 | U5 | No Construir e nas Conversas, um `execute_typescript` lê duas tabelas do lago numa chamada; no Construtor de agentes, lê duas conexões; o resultado volta como `{success, result, logs}` | `H/tools/code-mode.test.ts` e o caso de cada agente | must |
| 14a | U5 | **Recusa.** Nenhuma escrita está no programa: chamar de dentro dele `connector_note_save`, `agent_draft`, a escrita num sistema da empresa, `ask_user` ou `submit_plan` dá "função desconhecida"; as ferramentas da máquina, a web e as tarefas não estão | `H/tools/code-mode.test.ts` | must |
| 14b | U5 | O programa roda na máquina da conversa: um programa nas Conversas ou no Construtor de agentes com a máquina desligada liga a máquina (a fase "ligando" aparece na tela, como numa ferramenta da máquina) e só então roda | `H/tools/code-mode.test.ts` | must |
| 15 | U6 | **Recusa.** A recusa de um fornecedor chega ao modelo como erro da ferramenta nos quatro agentes, com o corpo cortado | os testes de conector de cada agente, o caso de recusa | must |
| 16 | U7 | Na tela, cada pedido do plano aprovado aparece conferido ou aberto no fim; enquanto o plano espera, a caixa diz que o Conexus espera a sua aprovação | `W/plan-card.test.tsx`; captura a 1366 e 390 px, os dois temas | must |
| 17 | todas | O pedido ao modelo muda só onde as frases saem e as ferramentas entram | os quatro retratos `request.test.ts` | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Cartão do plano | o plano com os pedidos e as fases, "Aprovar e construir" e "Pedir ajustes" | não existe sem plano | o envio da resposta, como hoje | a resposta não chegou: o aviso de hoje | o plano saiu do disco: o texto guardado na suspensão | quem não conversa no Projeto não vê a conversa (o guarda, S10) | pedidos ajustados: o cartão fechado com o motivo; aprovado: cada pedido conferido ou aberto no fim |
| Caixa da conversa | "Peça ao Conexus…" | — | — | — | — | — | esperando a aprovação: o texto novo, a caixa aceita mensagem (o Mastra a guarda até a resposta) |
| Painel de tarefas | a fase e os pedidos dela | some sem tarefa | — | — | — | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| o modo da sessão (`currentModeId`) | o Mastra, na aprovação; U1, no começo da conversa e no `submit_plan` | a guarda (U2), o `availableTools` do Mastra |
| o registro dos planos aprovados (`threadState`) | U2, na aprovação | a guarda (U2), o `submit_plan` |
| a tarefa de fase (`threadState` `task`) | U3, na aprovação; o modelo, por `task_update` | o juiz (U3, U4), o painel (U7) |
| o objetivo do fio (`threadState` `goal`) | U3, na aprovação | o passo `goal` do Mastra |
| o pedido do plano (`P1…Pn`, no suspend do `submit_plan`) | U3 | o cartão (U7) |

Uma tela muda: o cartão do plano e a caixa. Protótipo antes, a 1366 e 390 px e os dois temas (sua decisão B,
2026-11-22), sobre `W/plan-card.tsx` e `W/task-panel.tsx`, com as peças de `ui/` que eles já usam.

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Uma dependência fora | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| A resposta ao `submit_plan` (rota nativa `tool-suspension`) | duas abas aprovam: o Mastra retoma uma vez (a corrida da 0053); a segunda recebe a recusa nativa de suspensão já retomada | — | o banco fora: a resposta falha e o cartão fica aberto | o código de falha da rota | 3 |
| A troca de modo | a aprovação e uma mensagem nova: o Mastra troca pelo modo em que o plano foi enviado (`session.ts:6254-6256`) | o fio não está ativo: `setThreadSetting` (`:6270-6274`) | o banco fora: a aprovação não retoma | — | 1, 2, 3 |
| O registro do plano aprovado, as tarefas de fase e o objetivo | a mesma aprovação duas vezes: o registro é por caminho, e escrever de novo dá o mesmo estado | gravados antes de retomar a ferramenta: uma falha no meio não retoma, e a resposta seguinte grava de novo | o banco fora: a aprovação falha inteira, o cartão fica aberto | a linha do turno com o código | 6, 8 |
| O juiz de modelo do goal | — | a conta da fila acaba no meio: o goal pausa sem gastar rodada (`goal-core.ts`) | o modelo fora: o goal pausa; o juiz por código já decidiu | a linha do turno com a rodada | 10 |
| A escrita recusada pela guarda | — | — | — | nada: a recusa é o resultado da ferramenta | 4, 5 |

## A tabela de referência

| Peça | Unidade | O que o fundador já decidiu | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A trava da escrita antes da aprovação | U1, U2 | roteiro `A3`; 2026-11-14, quadro de arquitetura, "dois modos nativos, `plano` e `conversa`, com `transitionsTo`" (reabre a 0055); 2026-11-24, "plano e construção como modos dentro do Construir no A3" | nenhuma; `B/conversation/prompt/builder.md:15` | Mastra Code 1.19.0 (outra situação); Factory (outra, a mais próxima no formato) | modo `plan` com `availableTools` sem comando (`MC/agents/tool-availability.ts:142-162`); `beforeToolCall` da área de trabalho que só deixa `.md` na pasta de planos (`:62-95`, registrado em `:124-126`), **lido**; a Factory prende a passagem do cartão (`F/rules/transition-service.ts:536-560`), **lido** | embrulhado: o modo e o gancho nativos; nosso, o momento em que a conversa entra no modo | os critérios 1 a 4 | decisão 1 | `A/app-builder/modes.ts`, `A/app-builder/plan-guard.ts` |
| A volta a construir na aprovação | U1 | idem | `B/conversation/plan-tools.ts:96` só retoma | `@mastra/core@1.83.0` | `handlePlanApprovalResume` troca para o `transitionsTo` do modo em que o plano foi enviado antes de retomar (`C/agent-controller/session.ts:6235-6285`; `agent-controller.ts:2431-2441`), **lido** | nativo | — | não precisa | — |
| O plano aprovado não muda | U2 | 0055: "unchanged once approved. Founder: 'Plano A'" | `approvedPlans` por `getMessages` (`plan-tools.ts:26-44`); o disco aceita (`conversation-plan.test.ts:64-85`) | Mastra Code (outra) | o plano aprovado no estado da sessão (`MC/schema.ts:275-283`), **lido**; o estado durável do fio é o `threadState`, como as tarefas (`C/tools/builtin/task-tools.ts`), **lido** | embrulhado: o registro no `threadState`; a recusa no mesmo gancho | critérios 5 e 6 | não precisa | `A/app-builder/plan-guard.ts` |
| A recusa diz o que fazer | U2 | nada registrado | as recusas do `submit_plan` (`plan-tools.ts:85`, `:88`) | Mastra Code (outra) | "Plan mode can only write plan files inside …" (`tool-availability.ts:82-93`), **lido**; firstmate, a guarda que nomeia a forma certa (estudo irmão, seção 3) | nativo | — | não precisa | — |
| A pesquisa antes do plano | U3 | 2026-11-25, estudo irmão: "A: etapa Pesquisar no playbook do plano e o ajudante pesquisar no Construir, oferecido" | o ajudante `pesquisar` só no Assistente (`B/assistant/research.ts:16-30`) | Lovable, Replit, Base44, v0 (mesma) | ajudante só de leitura que "browse the web when needed"; a busca do agente e a referência da pessoa, **documentado** (estudo irmão, seção 5) | embrulhado: o tipo de subagente nativo, as ferramentas nossas | critério 13 | a resposta 1 do irmão | `H/tools/research.ts`, `packages/app/skills/conexus-plan-new/SKILL.md` |
| Os pedidos numerados e as fases | U3 | roteiro: "Cada pedido numerado do plano aparece conferido no fim"; 2026-11-25, estudo irmão: "A: um plano por rodada, Ordem em fases, uma aprovação, constrói até cada pedido conferido" | texto livre (`packages/app/skills/conexus-plan-new/plan-template.md:11,32`) | Factory (outra): "every step of that plan" (`F/boards/work.ts:17-25`), **lido**; vibesdk (mesma): fases (`state.ts:30`), **lido** pelo irmão; bolt.diy (mesma), o juiz por critério, pelo irmão | o objetivo é o plano, o juiz lê os passos | embrulhado: a lista conferida na borda do `submit_plan` (C27) | critério 7 | a resposta 2 do irmão | `A/app-builder/plan-tools.ts` |
| Cada fase vira tarefa | U3 | idem | as tarefas não se ligam a nada | Mastra Code (outra) | o build pede a lista a partir do plano (`MC/agents/prompts/build.ts:38-42`), por prompt, **lido** | embrulhado: na aprovação, o servidor escreve a lista no `threadState` nativo | critério 8 | firstmate, decisão 1 abaixo | `A/app-builder/plan-tools.ts` |
| O goal ao aprovar | U3 | 2026-11-24, cartão 4: "A3 com o plano nativo, o goal ao aprovar" | nenhum | Mastra Code, Factory (outra) | `setGoal` no `onApprove` da TUI (`mastracode/tui/src/tui/handlers/prompts.ts` ~`:455-500`); Building com `maxRuns: 20` (`F/boards/work.ts:55`); juiz só de leitura (`MC/index.ts:1507-1525`); o passo `goal` depois do `isTaskComplete` (`C/loop/loop-builder.ts:425-427`), **lido** | nativo | — | decisão 2 | `H/spec/` (o campo `goal` da ficha) |
| O juiz por código | U3, U4 | 14.2 U3 e `A1`, aprovados | `conexusCheck` (`B/conversation/processors.ts:102-162`) só no Construtor de apps | `@mastra/core@1.83.0` | `isTaskComplete`: o escore 0 devolve o motivo e chama de novo (`loop-builder.ts:426`), **lido** | nativo | — | não precisa | `H/turn/open-tasks.ts`, `A/app-builder/check.ts` |
| O juiz nos quatro | U4 | roteiro `A3`: "O juiz de fim de turno roda nos quatro agentes" | só o Construtor de apps | nenhuma faz (procurado: Mastra Code, que não usa `isTaskComplete`; Factory; Codex) | — | embrulhado: a parte das tarefas abertas no comum | critério 11 | não precisa | `H/turn/open-tasks.ts` |
| As frases que saem dos prompts | U2, U3, U4 | roteiro `A3`: "as frases saem dos prompts" | `builder.md:15`, `:29`; `construtor.md:12`; `assistant.md:43`; `conexus-plan-new/SKILL.md:69,75,77`; `conexus-plan-change/SKILL.md:80,86,88` | Mastra Code (outra) | o prompt do build não repete a trava que o código faz (`MC/agents/prompts/build.ts`), **lido** | nativo: a frase sai, o código garante | critérios 12, 17 | não precisa | — |
| As recusas como erro da ferramenta | U6 | guia de código C79 | sucesso com texto (`B/connectors/connector-tools.ts:219-222`, `B/app-data/tools.ts:56-68`); três cópias no Construtor (AGT-7) | `@mastra/core@1.83.0` | só o lançamento marca erro (`tool-result-commit-core.ts:173`, pela auditoria), **lido** pela auditoria | nativo | critério 15 | não precisa | `H/tools/refusal.ts` |
| O Code Mode da plataforma | U5 | 2026-11-24: "Sim colocar Code Mode COnexus da plataforma"; 2026-11-25: "3 B", "quero seguir o padrão da harness deles" e, na decisão 4, "B" | só o agente salvo com Computador, só leituras (`B/agents/code-mode.ts:14-19`, `B/agents/agent.ts:243-285`) | `@mastra/core@1.83.0`, página "Code mode" e referência `createCodeMode` (mesma: ferramentas no servidor, programa do modelo); Mastra Code e Factory, procurados, **nenhum usa** (prateleira 1.83 e `mastra@187a7a86`) | uma lista por `createCodeMode`, várias com ids diferentes para escopos separados (`docs-agents-code-mode.md:105-133`); o despacho sem aprovação (`C/tools/code-mode/code-mode.ts:104-119`); a ferramenta com aprovação direta (`docs-agents-code-mode.md:137`); **lido** | nativo | critérios 14, 14a | decisões 3 e 4 | `H/tools/code-mode.ts` |
| A fronteira do programa | U5 | 2026-11-25, o fundador: "o assistente, ele tem sandbox, ué ... Pra mim eles teriam que ter a mesma harness"; firstmate: "As três conversas usam o mesmo createCodeMode com o E2BCodeModeTransport na máquina de cada uma" | o E2B do agente salvo (`B/machine/e2b.ts:64-67`); as três conversas já têm máquina por conversa (`B/assistant/assistant.ts:275-285`, `B/construtor/construtor.ts:299-307`, o Construir) | `@mastra/e2b` instalado (mesma) | E2B escreve o programa na máquina remota (`docs-agents-code-mode.md:139-153`), **lido**; QuickJS e IsolatedVm (`:155-183`) ficam de fora: as três conversas têm máquina | nativo | critério 14b | decisões 3 e 4 | `H/tools/code-mode.ts` |
| A busca de funções e a montagem por pedido do Mastra Connect | fica de fora: as listas de cada conversa são curtas e fixas por pedido, e o fundador apontou o padrão do core | — | — | `@mastra/connect` 1.4.0 (outra: o catálogo de provedores do Mastra Platform) | `search_functions` acima de 40 mil caracteres, montagem única por pedido (`packages/connect/src/code-mode.ts:46-55`, `:94-117`), **lido** | nativo, e fica de fora | — | não precisa | — |
| As ferramentas que a Factory tira das sessões | fica de fora: no Conexus a escrita num sistema da empresa já pede cartão (e245), e o Construir não tem ferramentas de Git | nada registrado | — | Factory `mastra@187a7a86` (outra) | `connectToolExclusion` tira `delete`/`archive` e GitHub/GitLab (`session-tools.ts:21-25`, `:59-73`), **lido** | nativo, e fica de fora | — | não precisa | — |
| Os detectores prontos | fica de fora: chamada de modelo na conta da empresa e `abort` sem tela | cartão 4: "as guardas uma a uma" | nenhum | `@mastra/core@1.83.0` | cada um é um `new Agent` (`C/processors/processors/`), **lido** | nativo, e fica de fora | — | página do fundador, "Fica de fora" | — |

**A medida do transplante.** Nada vem do repositório antigo.

**A dívida.** Nenhuma nova.

## As decisões do firstmate

| # | Decisão reversível (delivery L6) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | A aprovação escreve as tarefas de fase no `threadState` pelo servidor, e não pelo prompt | o roteiro pede "cada pedido conferido" por código; o Mastra Code pede a lista por prompt (`MC/agents/prompts/build.ts:38-42`), e o juiz por código só prende o que está na lista | tirar a escrita na aprovação e devolver a frase ao prompt |
| 2 | `conversa` segue o id do modo de construir | as sessões guardadas carregam `currentModeId: 'conversa'` (`B/controller-kit/factories.ts:37-38`); um id novo seria migrar dado | renomear o id com uma migração das sessões |
| 3 | O agente salvo ganha o `TaskSignalProvider` para o juiz das tarefas ter o que ler | o juiz nos quatro está no roteiro; o agente salvo não tem as ferramentas de tarefa hoje | tirar o provedor e o juiz do agente salvo |

## U1 Os dois modos do Construtor de apps

**Base e modelo.** O commit do fechamento da etapa 2. Opus: o modo cruza a ficha (`H/spec/`), o controlador e o
`submit_plan`, e a troca no meio da run é sutil.

### As linhas da tabela

- **A trava da escrita** e **a volta a construir**. Na base: `H/spec/factories.ts` (hoje
  `B/controller-kit/factories.ts:37-38`, `:101-144`), a ficha com `availableTools` (a U10 da etapa 2),
  `A/app-builder/builder.ts` (hoje `B/conversation/builder.ts:136-181`), `A/app-builder/plan-tools.ts` (hoje
  `B/conversation/plan-tools.ts:76-98`). Na referência: `C/agent-controller/types.ts:51-137`;
  `session.ts:2743-2753` (a troca), `:6235-6285` (a aprovação); `agent-controller.ts:2160-2215` (o
  `availableTools` por chamada), `:2431-2441`; `MC/agents/modes/plan.ts:8-50`; `MC/agents/tool-availability.ts:142-162`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/spec/` | Muda: `controllerOf` e a ficha aceitam uma lista de modos | os quatro agentes |
| `A/app-builder/` | Cria `modes.ts`; muda `builder.ts`, `plan-tools.ts` | a ficha do Construtor de apps |

### Os contratos que a unidade cria

```ts
// H/spec/spec.ts
type ConversationMode = Readonly<{
  id: string
  availableTools: readonly ClosedTool[]
  transitionsTo?: string
}>
// ConversationSpec.modes: readonly [ConversationMode, ...ConversationMode[]] (o primeiro é o padrão)

// A/app-builder/modes.ts
export const APP_BUILDER_MODE = { build: 'conversa', plan: 'plano' } as const
```

O dono do id de cada modo é `APP_BUILDER_MODE` (C26). Os outros três agentes passam um modo só, `conversa`, e o
pedido deles ao modelo não muda.

### As skills e a leitura

`mastra` (do `node_modules`: `docs-harness-agent-controller.md`, `reference-agent-controller-session.md`,
`reference-tools-submit-plan-tool.md`); `pstack:typescript-best-practices`.

### A ordem do trabalho

1. **A lista de modos na ficha.** Critérios: 1, 17.
   - **Arquivos:** muda `H/spec/spec.ts`, `factories.ts`.
   - **Referência a seguir:** `C/agent-controller/types.ts:51-137`.
   - **O que sai:** o modo único fixo (`mode: { id: CONVERSATION_MODE, ... }`).
   - **Testes:** os quatro `request.test.ts` iguais.
2. **O modo `plano` do Construtor de apps.** Critérios: 1, 3.
   - **O que entra:** `plano` com a leitura e a fala da lista fechada, `write_file` e `edit_file` (para o
     plano, pela guarda da U2), sem os comandos, `transitionsTo: 'conversa'`.
   - **Testes:** `conversation-plan.test.ts`, "aprovar destrava, pedir ajustes não".
3. **O modo do começo.** Critério: 1. Na criação da sessão de um Projeto sem versão salva, o servidor troca para
   `plano` (`session.mode.switch`); uma sessão guardada segue no modo dela (`agent-controller.ts:2669-2671`).
4. **Propor um plano trava.** Critério: 2. No `submit_plan`, antes do `suspend`, se o modo for `conversa`, a
   sessão troca para `plano`.
   - **Mutações à mão:** tirar a troca deixa vermelho "propor um plano trava".

### Como se prova

Os testes com o dublê de modelo da conversa (`test-conversation.ts`), pela rota de mensagens e pela
`tool-suspension`. O que falha hoje: não há modo `plano`.

### Parar se

- A troca de modo no meio da run não vale para a chamada seguinte (o `availableTools` lido no começo da run):
  parar e provar com um teste antes de seguir; a alternativa é recusar pela guarda só (U2), sem o `availableTools`.
- O controlador recusar um `transitionsTo` para um modo de outro id que o padrão.

## U2 As guardas da escrita

**Base e modelo.** O commit da U1. Sonnet.

### As linhas da tabela

- **A trava da escrita**, **o plano aprovado não muda**, **a recusa diz o que fazer**, **as frases que saem**.
  Na base: o gancho `beforeToolCall` da máquina (`H/machine/conversation.ts`, hoje
  `B/machine/conversation.ts:296-300`, e `machines.ts:278-282`), `PLAN_DIR` (hoje `B/machine/scripts.ts:15`),
  `plan-tools.ts:10-44`, `builder.md:15`, as skills de plano. Na referência:
  `MC/agents/tool-availability.ts:62-95` e `:124-126`; `C/workspace/tools/types.ts:75-88`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `A/app-builder/plan-guard.ts` | Cria | o gancho da máquina do Construtor de apps |
| `H/machine/` | Muda: o gancho aceita uma guarda do agente | o Construtor de apps |
| `A/app-builder/plan-tools.ts` | Muda: lê o registro do `threadState`; apaga `approvedPlans` por `getMessages` | o `submit_plan` |
| `A/app-builder/prompt/builder.md`, `packages/app/skills/conexus-plan-*` | Muda: saem as frases da trava | o pedido ao modelo |

### Os contratos que a unidade cria

```ts
// A/app-builder/plan-guard.ts
type PlanGuardVerdict =
  | Readonly<{ kind: 'PROCEED' }>
  | Readonly<{ kind: 'REFUSE'; output: string }>
export const APPROVED_PLANS_STATE = 'conexus-approved-plans'  // threadState type; o valor: readonly string[]
```

A recusa é o `{ proceed: false, output }` nativo do gancho; o texto diz o que fazer em vez dela.

### As skills e a leitura

`mastra`; `pstack:typescript-best-practices`.

### A ordem do trabalho

1. **Apagar a leitura por `getMessages`** e gravar o plano aprovado no `threadState` na aprovação. Critério: 6.
2. **A guarda.** Critérios: 4, 5. Em `plano`, só `.md` direto em `.conexus/plans/`; em qualquer modo, nada sobre um
   plano aprovado.
   - **Mutações à mão:** trocar o teste do modo por `true` deixa vermelho o critério 1; tirar a checagem do
     aprovado deixa vermelho o 5.
3. **As frases.** Critério: 12, 17. Saem `builder.md:15` ("build only after the person approves the plan"), e
   `conexus-plan-new/SKILL.md:75`, `conexus-plan-change/SKILL.md:86`; fica a de quando planejar.

### Como se prova

O dublê tenta escrever em `src/` antes da aprovação e a pasta do app na máquina de teste não muda; o mesmo
sobre o plano aprovado. O que falha hoje: `conversation-plan.test.ts:64-85` reescreve o aprovado.

### Parar se

- O contexto do gancho da máquina não trouxer o `controller` da sessão (o Mastra Code o lê de
  `getHarnessContext`): parar e provar com um teste; a alternativa é a guarda num `hooks.beforeToolCall` do Agent.

## U3 A pesquisa e o plano numerado

**Base e modelo.** O commit da U2. Sonnet.

### As linhas da tabela

- **A pesquisa antes do plano**, **os pedidos numerados e as fases**, **cada fase vira tarefa**, **o goal ao
  aprovar**. Na base: `B/assistant/research.ts:16-30` (o ajudante de hoje), `packages/app/skills/conexus-plan-new/SKILL.md`, `plan-template.md`,
  `conexus-plan-change/SKILL.md`; `A/app-builder/plan-tools.ts`; `A/app-builder/builder.ts`. Na referência:
  `F/boards/work.ts:17-25`, `:55`; `MC/index.ts:1507-1525`; `docs-harness-goals.md` (instalado);
  `C/agent/goal/scorer.ts:185-209`; `C/tools/builtin/task-tools.ts` (o `threadState` `task`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/app/skills/conexus-plan-*` | Muda: a etapa Pesquisar, os pedidos `Pk`, as fases, as Referências | o Construtor de apps |
| `A/app-builder/plan-tools.ts` | Muda: confere a lista numerada; na aprovação, as tarefas e o objetivo | o `submit_plan` |
| `H/spec/` | Muda: o campo `goal` da ficha | a montagem |

### Os contratos que a unidade cria

```ts
// A/app-builder/plan-tools.ts
const PlanRequest = z.object({ id: z.string().regex(/^P\d+$/), text: z.string().min(1) })
const PlanPhase = z.object({ title: z.string().min(1), requests: z.array(PlanRequest.shape.id).min(1) })
// o suspend do submit_plan leva { path, title, plan, requests, phases }
```

### As skills e a leitura

`mastra`; `pstack:typescript-best-practices`.

### A ordem do trabalho

1. **O modelo do plano.** Critério: 7. A skill ganha a etapa Pesquisar (estudo irmão, seção 11, item 2), os
   pedidos `P1…Pn` e as fases.
1a. **O ajudante de pesquisa no Construir.** Critério: 13. O tipo `pesquisar` sobe de `A/assistant/research.ts` (hoje
   `B/assistant/research.ts:16-30`) ao comum; o do Construir lê os sistemas e a `web_fetch` do Hub, e o
   `researchOnly` fecha o `forked` nos dois. Antes, provar se a `web_search` do fornecedor chega a um subagente.
2. **A conferência na borda.** Critério: 7.
3. **As fases como tarefas e o objetivo.** Critérios: 8, 9, 10. Na aprovação, antes de retomar.
   - **Mutações à mão:** não escrever uma fase deixa vermelho o 8.
4. **O goal na ficha**, com o juiz da decisão 2. Critério: 10. Sai `builder.md:29`.

### Como se prova

O dublê aprova um plano de três fases e as três tarefas aparecem; o fim com uma aberta pontua 0.

### Parar se

- A decisão 2 do fundador for (b) ou (c): o passo 4 muda.

## U4 O juiz das tarefas abertas nos quatro

**Base e modelo.** O commit do fechamento da etapa 2. Sonnet.

### As linhas da tabela

- **O juiz por código**, **o juiz nos quatro**, **as frases que saem**. Na base: `A/app-builder/processors.ts`
  (hoje `B/conversation/processors.ts:70-132`), `H/turn/`, as fichas dos quatro; `assistant.md:43`,
  `construtor.md:12`. Na referência: `C/loop/loop-builder.ts:425-427`; `C/tools/builtin/task-tools.ts:626-660`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/turn/open-tasks.ts` | Cria: o escore das tarefas abertas | os quatro |
| `A/app-builder/processors.ts` | Muda: usa o comum e acrescenta a conferência | o Construtor de apps |
| `A/assistant/`, `A/agent-builder/`, `A/saved-agent/` | Muda: registram o juiz; o agente salvo ganha o `TaskSignalProvider` | — |

### As skills e a leitura

`mastra`.

### A ordem do trabalho

1. **O escore comum.** Critério: 9.
2. **Nos três.** Critérios: 11, 12.
   - **Mutações à mão:** tirar o juiz do Assistente deixa vermelho o 11.

### Como se prova

O caso novo em cada agente, pelo dublê, com uma tarefa aberta.

### Parar se

- A U11 da etapa 2 deixar o turno do Construtor de apps em outra forma: reler e seguir a forma dela.

## U5 O Code Mode da plataforma

**Base e modelo.** O commit da U4, sobre o P1 integrado. Sonnet.

### As linhas da tabela

- **O Code Mode da plataforma**, **a fronteira do programa**. Na base: `A/saved-agent/code-mode.ts` e `agent.ts` (hoje
  `B/agents/code-mode.ts:14-19`, `B/agents/agent.ts:243-285`), o transporte E2B (hoje `B/machine/e2b.ts:64-67`), as
  listas da empresa de cada conversa (hoje `B/company-tools/names.ts:18-39`), a linha da tela (`W/machine-specs.ts:8`,
  `:47-58`, que já desenha `execute_typescript`). Na referência: `docs-agents-code-mode.md` inteira,
  `reference-tools-create-code-mode.md`, `C/tools/code-mode/code-mode.ts:84-119`.

### O desenho

Uma ferramenta de código por conversa, com o id nativo `execute_typescript` (`MACHINE_TOOL.codeMode`), feita uma vez
por execução com o `oncePerRun` que as fichas já usam, para as instruções e a ferramenta saírem da mesma lista:

| Conversa | A lista do programa (decisão 4: só leituras) | Fica direta | A fronteira |
| --- | --- | --- | --- |
| Construir | `connector_read`, `connector_notes`, `app_data_read`, `app_data_check`, `data_describe`, `data_query` | `connector_note_save`, as da máquina, a web, as tarefas, `ask_user`, `submit_plan` | `E2BCodeModeTransport`, na máquina da conversa |
| Conversas (Assistente) | `conexus_overview`, as leituras tipadas do pedido, `connector_notes`, `data_describe`, `data_query` | `connector_note_save`, a escrita num sistema da empresa, as da máquina, `show_file`, a web, o ajudante | `E2BCodeModeTransport`, na máquina da conversa (`B/assistant/assistant.ts:275-285`) |
| Construtor de agentes | `connector_read`, `connector_notes` | `project_read` e as de rascunho (`agent_*`, `tool_*`), `ask_user`, a web | `E2BCodeModeTransport`, na máquina da conversa (`B/construtor/construtor.ts:299-307`) |
| Agente salvo | como hoje: as leituras da empresa, as do código e as prontas (`B/agents/agent.ts:268-272`) | as escritas, a web, `show_file` | como hoje: E2B, só com Computador |

As três conversas da plataforma têm a mesma peça e a mesma fronteira, como o fundador pediu ("a mesma harness"). A
máquina só liga quando uma ferramenta precisa (`B/machine/machines.ts:81`, `:131-136`); o programa é uma dessas
ferramentas, e a tela já mostra a fase da máquina (`B/construtor/construtor.ts:322-323`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/tools/code-mode.ts` | Cria: a ferramenta de código de uma conversa, pela sua lista e o seu transporte | as quatro fichas |
| `A/saved-agent/code-mode.ts` | Apaga: o agente salvo passa à peça comum | — |
| `A/app-builder/`, `A/assistant/`, `A/agent-builder/`, `A/saved-agent/` | Muda: a lista do programa e o transporte | — |

### Os contratos que a unidade cria

```ts
// H/tools/code-mode.ts
export function conversationCodeMode(input: {
  reads: ToolsInput                 // só leituras (decisão 4): uma escrita aqui é erro de teste
  transport: CodeModeTransport      // o E2BCodeModeTransport da máquina da conversa
}): ReturnType<typeof createCodeMode> | undefined   // undefined quando a lista é vazia: nenhum programa
```

Cada ficha diz a sua lista no mesmo lugar em que diz `TOOLS_OF` (C26). Uma ferramenta com aprovação, `suspendSchema` ou
`resumeSchema` recusada pela peça é a defesa da regra da página (`docs-agents-code-mode.md:137`), além da lista.

### As skills e a leitura

`mastra` (`docs-agents-code-mode.md`, `reference-tools-create-code-mode.md`); `pstack:typescript-best-practices`.

### A ordem do trabalho

1. **A peça comum, com o agente salvo.** Critérios: 14a, 17. O agente salvo passa a ela sem mudar o pedido ao modelo
   (o retrato dele igual).
   - **O que sai:** `B/agents/code-mode.ts` e a escolha das leituras em `agent.ts:248-285`.
   - **Mutações à mão:** pôr `connector_note_save` na lista deixa vermelho o 14a.
2. **Nas três conversas.** Critérios: 14, 14b. Os retratos `request.test.ts` mudam só na ferramenta e nas instruções
   do programa.

### Como se prova

O dublê de modelo escreve um programa que chama duas leituras e o resultado volta numa linha; o mesmo programa
chamando uma escrita recebe "função desconhecida"; com a máquina desligada, o registro de partidas do dublê da
máquina mostra uma partida antes do programa.

### Parar se

- As leituras tipadas do Assistente chegam pelo `ToolSearchProcessor` (`search_tools`) durante o turno: se a lista do
  programa, feita no começo da execução, não as alcançar, parar e provar com um teste qual das duas fica.
- O transporte rodar antes da partida da máquina terminar: o programa espera o `start()` como as ferramentas da máquina
  (`B/machine/conversation.ts:296-300`); se não esperar, parar.

## U6 As recusas como erro da ferramenta

**Base e modelo.** O commit da U4. Sonnet.

### As linhas da tabela

- **As recusas como erro da ferramenta**. Na base: `H/tools/` (hoje `B/connectors/connector-tools.ts:219-222`,
  `B/app-data/tools.ts:56-68`), as três cópias do Construtor (AGT-7), `A/saved-agent/tools.ts` (o `refuse` que já
  cumpre a C79).

### A ordem do trabalho

1. **Uma dona**, a forma do agente salvo. Critério: 15.
2. **Os quatro por ela.** Critério: 15, 17.

### Parar se

- Um retrato mudar além do texto da recusa.

## U7 O fim do plano na tela

**Base e modelo.** O commit da U3 e o protótipo aprovado. Sonnet.

### As linhas da tabela

- **Os pedidos numerados e as fases**, na tela. Na base: `W/plan-card.tsx:12-53`, `W/rows.ts:154-181`,
  `W/task-panel.tsx:24-41`, `packages/hub-api/src/questions.ts:21-27`.

### A ordem do trabalho

1. **O protótipo**, aprovado antes. Critério: 16.
2. **O cartão e a caixa.** Critério: 16.

### Parar se

- O protótipo pedir uma peça de `ui/` nova: ela entra com a sua linha de referência (design V62).

## G1 O ponto de conferência

Depois da U3: os passos 6 e 7 do `conexus-build` no servidor; o roteiro 1 a 5 no Hub local com o dublê de modelo.

## G2 O ponto de conferência

Depois da U6: os quatro agentes no Hub local com o dublê; o roteiro 6.

## G3 O ponto de conferência

Depois da U7: o QA da etapa (testing T25) a 1366 e 390 px, os dois temas.

## O custo do Lab

Os critérios 1 a 17 se provam com dublê de modelo, sem custo. Duas medições pedem modelo real e esperam a sua
palavra: (1) com a decisão 2 (a), quantas chamadas o juiz de modelo acrescenta por construção (três pedidos da
régua, três tentativas, Claude e GPT: 18 construções); (2) o Code Mode nas Conversas e no Construir (cinco perguntas de conta
sobre o lago em cada, três tentativas, com e sem: 60 turnos). Rodam nas assinaturas de modelo que você já deu.
