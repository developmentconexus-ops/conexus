# A harness única de verdade

Trilho: harness

Etapa de refatoração do harness, sem mudança de comportamento. O pedido do fundador, em 2026-11-27:
"A parte nossa de arquitetura também, de código, como a gente está estruturando, como a gente está
criando código, para não ter redundância, para seguir como times de engenharia fazem repositórios
referência também. ... A gente até juntou uma harness única, verificar se está correto também." O
estudo `conexus-arquitetura-harness` (2026-11-27) fica fora do repositório (delivery L21); a sua
tabela de referência está abaixo, com a unidade de cada linha, e o §7 dele é a proposta deste cartão.

Lido no `main` em `57400a0c2` (2026-11-27, v0.24.136). O estudo foi feito sobre `c87b82040`; entre os
dois nada mudou em `apps/` nem em `packages/` (`git diff --stat c87b82040 57400a0c2 -- apps packages`
vazio), e cada `arquivo:linha` abaixo foi relido em `57400a0c2`. Versões: `@mastra/core` 1.83.0,
`@mastra/server` 1.83.0, `@mastra/memory` 1.41.1, `@mastra/e2b` 0.17.0. Prateleira: `mastra-1.83` em
`d60ba71b` (Mastra Code e Factory em `mastracode/`); `onyx` e `librechat` nos commits do manifesto da
prateleira. Abreviações: `S/` = `apps/server/src/`, `H/` = `S/harness/`, `Ag/` = `S/agents/`, `API/` =
`packages/hub-api/src/`, `W/` = `apps/web/src/`, `NM/` = `node_modules/@mastra/core/dist/`, `M/` =
a prateleira `mastra-1.83`.

## A página do fundador

**No fim desta etapa** nada muda na tela. Você abre uma conversa com o Assistente, uma com o
Construtor de agentes, uma com um agente salvo e uma no Construtor de apps, e todas se comportam como
hoje: o pedido de cada uma ao modelo fica igual, byte a byte, nos doze pedidos gravados que a CI
compara. O que muda é para quem vem depois. A máquina passa a ser uma só para os quatro agentes, e
cada coisa tem um dono. O próximo cartão do Construtor de apps (máquina com tela, prazos separados,
LSP) e o do Assistente (leitura de PDF, comandos longos) entram então uma vez, e não duas.

**O roteiro de uso.** Na nuvem, numa empresa de teste, como dono.

1. Em **Conversas**, abra uma conversa nova e peça uma conta sobre uma planilha pública que você
   anexar. O Conexus liga a máquina, faz a conta e responde, como hoje.
2. Abra o **Construtor de agentes** de um agente do Projeto e toque em **Testar** com um rascunho
   que use o Computador. O teste responde, como hoje.
3. No **Construir**, peça uma mudança pequena num app de teste e abra a **Prévia**. A mudança
   aparece, como hoje.
4. Volte a **Conversas** e apague a conversa do passo 1. Ela some da lista.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página e responde às duas decisões
abaixo. No fim: faz o roteiro e diz o que viu. Não há texto novo de tela para aprovar.

**A visão.** "Uma lógica por capacidade do Conexus" ("Isso é do conexus", 2026-11-12). "Pra mim eles
teriam que ter a mesma harness" (2026-11-24). "sem gambiarra, código bem feito, fluxo coeso"
(2026-10-16). A etapa não cruza nenhuma linha da `VISION.md`: não muda o que uma pessoa vê.

**Fica de fora, e por quê.**

- **Juntar as três tabelas de conversa** (Assistente, Construtor de agentes, agente salvo). É
  migração, e os três donos são legítimos. O ganho, umas 40 linhas, não paga o risco.
- **Trocar a forma do prompt da ficha por uma função.** O `A3` reescreve essa parte com o texto base
  do Conexus; mexer nela antes seria trabalho jogado fora.
- **Trocar a regra de aprovação do agente salvo pela regra nativa do Mastra** (`PermissionRules`).
  Antes, uma prova tem de mostrar que a política nativa evita a pergunta por ferramenta. A U3 roda a
  prova e escreve o resultado; a troca, se a prova passar, é de outro cartão.
- **Os pacotes do próximo cartão do Construtor de apps** (máquina com tela, prazos separados, LSP,
  ferramentas `computer`) e as mudanças do Assistente. Esta etapa só os destrava.
- **As issues `next-card` abertas.** Nenhuma é desta etapa: ela não muda comportamento, e cada uma
  pede um.

**As decisões suas nesta etapa.** Duas, ambas à espera da sua palavra. O cartão está escrito com a
recomendação de cada uma; se você escolher outra, a unidade que ela toca muda antes do build.

**A. As três pastas do harness fora da árvore que você aprovou em 2026-11-23** ("Aprovado entao").
São `network/` (a lista de saída da máquina, que a etapa 3 criou), `copy-clock/` (o relógio da cópia
do lago, um workflow do Mastra) e `schema/` (o esquema `builder` do banco, que os três agentes de
conversa usam). Exemplo: quem procura "a rede da máquina" abre `harness/machine/` e não acha; ela
mora ao lado, em `harness/network/`.

| Opção | O que acontece |
| --- | --- |
| a) **Recomendada, à espera da sua palavra** | `copy-clock` vai para `harness/mastra/`, porque é um workflow do Mastra e só pode morar onde o Mastra mora; `harness/mastra/` já guarda o agendador e a retenção. `network` vai para `harness/machine/network/`, porque é a lista de saída da máquina, e a ferramenta que pede um domínio vai para `harness/tools/`, porque dois agentes a usam. `schema` entra na sua lista como peça compartilhada. A U10 faz as mudanças. |
| b) | As três pastas entram na lista como estão. A U10 só corrige a árvore na explicação do harness. |
| c) | `copy-clock` sai do harness para uma pasta da trilha Dados. Isso pede mudar a regra de camada que só deixa o Mastra no harness e nos agentes, numa mudança de método à parte (delivery L20). |

Veredito: nenhuma das três é remendo; é onde uma peça mora. Mastra, Onyx e LibreChat organizam por
assunto, em árvores planas, e não decidem esta pergunta (a linha 7 da tabela).

**B. Onde esta etapa entra na ordem do trilho.** A ordem que você fixou em 2026-11-25 é a etapa 3 (a
rede e o navegador), o `A2` e o `A3`; os cartões do `A2` e do `A3` estão aprovados e esperam. Uma
etapa de refatoração é uma etapa do trilho (delivery L1), então entrar na fila é decisão sua.
Exemplo: o `A3` muda a ficha e a montagem (`H/spec/spec.ts`, `factories.ts`, `mount.ts`) e o espaço da
máquina (`H/machine/workspace.ts`), as mesmas peças que os grupos G1 e G3 enxugam.

| Opção | O que acontece |
| --- | --- |
| a) **Recomendada, à espera da sua palavra** | Entra logo depois do fechamento da etapa 3, antes do `A2`. O `A2`, o `A3` e o próximo cartão do Construtor de apps são construídos sobre uma base com uma máquina e uma montagem mais curta, e o builder de cada um relê as linhas que o cartão dele cita, como todo build faz. Custa ao `A2` a espera desta etapa, cerca de 1 800 linhas sem mudança de tela. |
| b) | Entra depois do `A3`. O `A2` e o `A3` entram como estão; esta etapa relê as próprias linhas depois deles, e o próximo cartão do Construtor de apps espera por ela. |

Veredito: ordem, não remendo. Recomendo (a) porque as mudanças que o `A3` e o Construtor de apps
pedem caem nas mesmas peças, e fazê-las depois da unificação é fazê-las uma vez (§6 do estudo).

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 | U1 A ficha sem dependência da montagem | Saem a guarda morta `Object.hasOwn`, a memória repetida no agente e o `switched` do tipo do modelo; os tipos da ficha param de depender de `factories.ts` | `H/spec/`, `H/routes/changes.ts` | testing | a etapa 3 fechada; a decisão B |
| G1 | U2 A montagem num salto | Os oito tradutores de um chamador entram em `agentOfSpec` e `controllerOf`; sai a segunda cópia de aprovação do agente salvo e o memo à mão do resolver | `H/spec/`, `Ag/saved-agent/` (só `controller.ts`, `agent.ts`, `resolver.ts`) | testing | U1 |
| G1 | U3 Um dono para o fim do turno | O `watch` de `sessionTurns` vira um `TurnEnds` de `watchRuns`; a prova da aprovação nativa, escrita | `H/spec/`, `H/turn/`, `S/conversations-of.ts` (a ligação) | testing | U2 |
| G2 | U4 A liberação pelo tipo | `releaseByMarks` tira o código do tipo; os três `part.release` viram uma chamada | `H/spec/`, `Ag/assistant/`, `Ag/agent-builder/`, `Ag/saved-agent/` (só a montagem) | testing | G1 |
| G2 | U5 A cabeça da conversa | `threadHead(thread)` e um `ConversationHead` só no contrato, com o mesmo JSON | `H/spec/`, `API/` (`conversations.ts`, `assistant.ts`, `construtor.ts`, `agents.ts`), as rotas de lista dos quatro agentes | testing | U4 |
| G2 | U6 Criar a conversa e a rota sem transação | `createdThread` para os três fluxos de criação; as funções com transação saem dos arquivos de rota dos agentes (C14) | `H/spec/`, as rotas dos três agentes de conversa | testing | U5 |
| G3 | U7 A máquina da conversa montada num lugar | `conversationMachinesFor(spec)` monta `createConversationMachines` e `machinePart`, que hoje cada agente monta | `H/machine/`, `Ag/assistant/`, `Ag/agent-builder/`, `Ag/saved-agent/` (só a montagem) | testing | G2 |
| G3 | U8 Um núcleo de máquina | Um núcleo de sessão (`ensure`, `boot`, `open`, workspace, `kill`, `stopAll`) com as falhas das duas variantes numa união; a máquina do Projeto vira o núcleo mais a camada do Projeto | `H/machine/`, `Ag/app-builder/runs/ports.ts` | testing | U7 |
| G3 | U9 O `MachineSpec` dos quatro | O tipo vale para o Construtor de apps também, com os campos que o próximo cartão liga, desligados | `H/machine/`, `Ag/app-builder/runs/ports.ts` | testing | U8 |
| G4 | U10 As pastas soltas | Pela decisão A: `copy-clock`, `network` e a ferramenta da rede nos lugares da opção escolhida | `H/copy-clock/`, `H/network/`, `H/mastra/`, `H/machine/`, `H/tools/`, os importadores | delivery | G3; a decisão A |
| G4 | U11 As peças de um agente só | `search.ts` e `projectsOf` vão para `Ag/assistant/` | `H/tools/company/`, `H/tools/public.ts`, `Ag/assistant/` | testing | U10 |
| G4 | U12 A raiz só monta | Os adaptadores de `S/conversations-of.ts` vão para o `public.ts` de cada agente; a explicação do harness corrigida | `S/conversations-of.ts`, `Ag/*/public.ts`, `docs/explanation/harness.md` | delivery | U11 |
| G4 | U13 A moldura da sala e o seletor | `RoomFrame` e `ConversationPicker` em `W/harness/room/`, usados pelas três salas e pelos dois seletores | `W/harness/room/`, `W/agents/` (só as salas e os seletores) | web | G1 (nenhum arquivo em comum) |

**Os grupos.** Quatro pull requests, um commit por unidade (delivery L9). O G4 tem quatro unidades
porque três delas só movem arquivos por codemod. A U13 não divide arquivo com o servidor; ela fica no
G4 para não abrir um quinto pull request (L9 não separa um grupo só para andar em paralelo).

**Orçamento de código alterado.** U1: 60. U2: 200. U3: 120. U4: 60. U5: 80. U6: 160. U7: 90. U8:
450. U9: 60. U10: 80 (imports). U11: 40. U12: 150. U13: 250. Total da etapa: cerca de 1 800 linhas,
sem testes nem gerados, com mais linhas apagadas que acrescentadas.

## Os critérios de aceite

Toda unidade fecha também com os critérios 1 a 3.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | todas | Os doze pedidos gravados ao modelo (`Ag/*/requests/*.snapshot`) ficam iguais byte a byte; um pedido que muda faz o teste falhar sem `--test-update-snapshots` | `Ag/assistant/request.test.ts`, `Ag/assistant/browser.test.ts`, `Ag/app-builder/request.test.ts`, `Ag/agent-builder/request.test.ts`, `Ag/saved-agent/request.test.ts` (todos os casos), e `git diff --exit-code -- 'apps/server/src/agents/*/requests/*.snapshot'` | must |
| 2 | todas | O grafo de imports não ganha violação nem ciclo; a regra `mastra-only-in-harness-and-agents` e a `hub-does-not-import-harness-or-agents` seguem recusando o que recusam hoje | `npm run deps` | must |
| 3 | todas | O documento OpenAPI emitido não muda | `npm run openapi` e `git diff --exit-code` no documento | must |
| 4 | U1 | Numa conversa do Assistente, do Construtor de agentes e do agente salvo, o segundo turno manda ao modelo as mensagens do primeiro, com a memória posta só no controller | um caso novo, escrito antes da mudança e verde hoje, em `Ag/assistant/request.test.ts`, `Ag/agent-builder/request.test.ts` e `Ag/saved-agent/request.test.ts`: "o segundo turno leva o primeiro" (dois turnos na mesma conversa; o segundo pedido traz a mensagem do primeiro) | must |
| 5 | U1 | A troca de modelo no meio da conversa ainda escreve a mesma linha de log com o código `switched` | `H/model-accounts/model-fallback.test.ts`, os casos com `switched` | must |
| 6 | U2 | Um agente salvo com escrita ainda pergunta antes de cada escrita, e a ferramenta com regra própria ainda decide por ela; uma ferramenta de leitura não pergunta | `H/routes/guard.test.ts` (os casos de aprovação da 24.5) e `Ag/saved-agent/request.test.ts`, "rascunho-escrita" | must |
| 7 | U2 | O resolver da versão do agente salvo resolve uma vez por run, como hoje | um caso novo em `Ag/saved-agent/request.test.ts`, escrito antes da mudança: um turno com duas ferramentas lê a versão uma vez | must |
| 8 | U3 | O fim de cada turno solta a conta e escreve a linha uma vez, num fim normal, numa falha, no Parar e na conversa apagada no meio do turno | `H/turn/drain.test.ts` e `H/spec/concurrency.test.ts` | must |
| 9 | U3 | A prova da política nativa de aprovação (`allow` com `yolo: false`) roda e o seu resultado está escrito no relatório da unidade, sem mudar a regra | o script da prova, rodado pelo builder | should |
| 10 | U4 | Apagar a empresa, a pessoa ou o Projeto apaga as conversas de cada agente e escreve o mesmo código de log de hoje, por agente | `Ag/assistant/delete.test.ts`, `Ag/assistant/release.test.ts`, `Ag/saved-agent/release.test.ts`, `Ag/agent-builder/routes.test.ts` (o `CONSTRUTOR_CONVERSATIONS_RELEASED`) e `H/spec/lines.test.ts` | must |
| 11 | U5 | As listas de conversa dos quatro agentes respondem o mesmo JSON de hoje, com o título vazio como `null` | os testes de lista de cada agente; o teste de declaração de `packages/app` | must |
| 12 | U6 | Criar uma conversa nos três agentes responde como hoje, e quem não pode gerir o Projeto recebe a mesma recusa de hoje | `Ag/agent-builder/routes.test.ts`, `Ag/saved-agent/conversation.test.ts`, `Ag/assistant/create.test.ts`, `H/routes/conversation-routes.test.ts` | must |
| 13 | U6 | Nenhum arquivo de rota de agente abre transação nem faz `catch` | a busca do passo 2 da U6, que não acha nada | must |
| 14 | U7 | As três máquinas de conversa ligam, rodam e se apagam como hoje, com a rede da empresa | `Ag/assistant/machine.test.ts`, `Ag/saved-agent/machine.test.ts`, `Ag/agent-builder/draft-machine.test.ts`, `H/machine/machine-network.test.ts` | must |
| 15 | U8 | Uma partida que falha nas duas máquinas escreve `MACHINE_UNAVAILABLE` com o mesmo motivo; a máquina do Projeto que não se restaura devolve a falha de restauração; a conversa cuja máquina sumiu devolve `FILE_GONE`; a partida seguinte tenta de novo | `H/machine/machine.test.ts`, `machine-session.test.ts`, `machine-sync.test.ts`, `conversation-lane.test.ts`, `Ag/app-builder/closure.test.ts` | must |
| 16 | U8 | No E2B de verdade, a máquina do Projeto e a da conversa ligam e rodam um comando | `H/machine/machine-e2b.test.ts` (opt-in, com a chave da instalação) | should |
| 17 | U9 | A lista de ferramentas do espaço de cada agente é a de hoje | o teste novo da U9, uma linha por agente | must |
| 18 | U10 | O relógio da cópia agenda e roda como hoje; a ferramenta da rede pede e libera como hoje | `H/copy-clock/clock.test.ts` e os testes de `H/network/` (`network-store`, `network-routes`, `network-tool`, `network-tool-answer`), nos lugares novos | must |
| 19 | U12 | O Hub monta e desmonta na mesma ordem; a explicação do harness diz a árvore de hoje | `S/boot.test.ts`, `S/main.test.ts`, `npm run docs` | must |
| 20 | U13 | As três salas e os dois seletores mostram o mesmo que hoje, a 1366 e 390 px, nos dois temas | `W/agents/assistant/conversation.test.tsx`, `W/agents/saved-agent/agent-page.test.tsx`, `W/agents/agent-builder/construtor-chat.test.tsx`, `W/routes/__root.test.tsx`; as capturas do QA (testing T25) | must |

## A matriz de estados

Nenhuma tela nova, nenhum estado novo. As três salas de conversa e os dois seletores mudam de dono
(U13) e mantêm cada estado de hoje: primeira vez, vazio, carregando, erro, conversa não encontrada,
sem permissão. O QA confere cada um contra a captura de antes, a 1366 e 390 px, nos dois temas.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `ConversationHead.id`, `title`, `createdAt` (U5, já existem) | `threadHead` | as listas de conversa da web dos quatro agentes |
| `updatedAt` (U5, já existe nos três agentes de conversa) | `threadHead` | as listas do Assistente, do Construtor de agentes e do agente salvo |

## A tabela de falhas

Nenhuma gravação nova. As que as unidades movem (o `INSERT` da conversa na U6, o apagamento das
conversas na U4, a partida e o `kill` da máquina na U8) ficam com as respostas de hoje a duas vezes
ao mesmo tempo, à recusa no meio e à dependência fora, e com as mesmas linhas de log; os critérios
10, 12 e 15 provam que não mudaram.

## A tabela de referência

As linhas do estudo, com a unidade de cada uma. Rótulos: **lido** (o código aberto), **provado** (um
script rodou no pacote instalado).

| # | Peça | Unidade | O que o fundador já decidiu | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | A montagem | U1, U2 | a ficha e a montagem (etapa 1 do harness) | `H/spec/mount.ts:24-195`, `H/spec/factories.ts:56-155` | `M/mastracode/sdk/src/index.ts:1368` (`createCodingAgent`), `:1804` (`new AgentController`), **lido** | um objeto de config e um salto até o `new Agent` | embrulhado: a ficha fica, os tradutores de um chamador saem | — | — | — |
| 2 | A memória do agente | U1 | — | `H/spec/mount.ts:177` (`memory: memory ?? threads`) | `NM/agent-controller-BhkzVgCi.js:8237`, `:8628-8635`, `:8733` (`propagateRuntimeServicesToAgent`), **provado**; a memória só no controller em `M/mastracode/sdk/src/index.ts:1824`, **lido** | o controller põe a sua memória no agente a cada `getCurrentAgent` | nativo | `@mastra/core` 1.83.0: o script `memory.mjs` do estudo (`before false`, `after false false`, `propagated true true`) | — | — |
| 3 | O fim do turno | U3 | 0049 (a fila); a porta `TurnEnds` (emenda de 2026-11-24 da etapa 2) | `H/spec/turns.ts:116-130` e `H/turn/end.ts:312-360`, dois assinantes de `agent_end` e de `onSessionDeleted` | os eventos de `AgentController` (`subscribe`, `onSessionDeleted`), **lido** | um assinante por evento, com um papel por ouvinte | embrulhado: um dono, `watchRuns` | — | — | — |
| 4 | A aprovação | U3 (só a prova) | 0053 | `H/spec/mount.ts:85-124` (`NEVER_ASKS`, `askingOnlyByOwnRule`) | `resolveToolApproval` (`NM/agent-controller-BhkzVgCi.js:5352-5367`), `PermissionRules`, **lido** | a política por ferramenta no controller | embrulhado; a troca só com prova, em outro cartão | a U3 mede, com `@mastra/core` 1.83.0 | — | — |
| 5 | A máquina | U7, U8, U9 | "a mesma harness" (2026-11-24) | `H/machine/machines.ts:86-147`, `:222-275` e `H/machine/conversation.ts:158-206`, `:245-305` | Factory `M/mastracode/factory/src/workspace.ts:1829-1833`, **lido** | uma máquina por sessão, de uma forma só | embrulhado: um núcleo, e a camada do Projeto por cima | — | — | `H/machine/session-core.ts` |
| 6 | A conversa: liberar, cabeça, criar | U4, U5, U6 | a sala única (etapa 2 do harness) | `H/spec/release.ts:44-66`; as cinco cópias de `thread.title` com o vazio como `null` (U5); `H/spec/open.ts` | `M/mastracode/factory/src/factory.ts:1680-1830` (um dono da sessão), **lido** | um dono por conceito da conversa | nativo: a memória e o controller do Mastra por baixo; a repetição sai | — | — | `H/spec/head.ts` |
| 7 | A árvore | U10, U11, U12 | 2026-11-23 ("Aprovado entao"); a decisão 1 do firstmate na etapa 3 (`H/network/` à parte) | `H/network/`, `H/copy-clock/`, `H/schema/`; `S/conversations-of.ts` | `M/packages/core/src`, `M/mastracode/sdk/src`, Onyx `backend/onyx`, LibreChat `packages/api/src`, **lido** | árvores planas por assunto; a ferramenta é irmã do agente | nativo: a árvore é a regra do Conexus, mais estrita que as três, e o grafo medido a cumpre | — | A | — |
| 8 | A memoização por run | U2 | — | `H/spec/once.ts:7-19`; um segundo memo à mão em `Ag/saved-agent/resolver.ts:28-37` | o `Agent` do `@mastra/core` 1.83.0, **provado** | resolve ferramentas e modelo de novo a cada passo de ferramenta; não há memo | embrulhado: o `oncePerRun` de hoje guarda o que o Mastra resolve a cada passo; o segundo memo sai | `@mastra/core` 1.83.0: o script `once.mjs` do estudo (`{"instructions":1,"tools":2,"model":2,"steps":3}`) | — | — |
| 9 | A moldura da sala na web | U13 | a sala única (etapa 2) | `W/agents/assistant/conversation.tsx`, `W/agents/saved-agent/agent-chat.tsx`, `W/agents/agent-builder/construtor-chat.tsx`; os seletores em `W/agents/app-builder/conversation-switch.tsx` e `W/agents/saved-agent/test-panel.tsx` | `M/mastracode/factory-ui/src/ui/domains/chat/`, **lido** | uma moldura de conversa, e cada domínio põe o seu | embrulhado: uma moldura | — | — | `W/harness/room/frame.tsx`, `W/harness/room/picker.tsx` |

**A medida do transplante.** Nenhuma parte trazida do repositório antigo.

**A dívida.** O `oncePerRun` (`H/spec/once.ts`) não tem entrada em `docs/reference/boundaries.md`;
ela entra no fechamento (delivery L19), com a versão do Mastra da prova. O jscpd vê pouco (7 clones no gate do repositório, 0,10%); a repetição desta etapa é de
conceito, e o gate de C26 não a alcança. Fica para a seção 11 da arquitetura, como informação.

## As decisões do firstmate

| # | Decisão reversível (delivery L6) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | A máquina do Projeto fica no harness e se junta à da conversa, em vez de ir para `Ag/app-builder/` | só o Construtor de apps a usa (`createMachines`, `createE2bKit` e `createE2bApi` só em `Ag/app-builder/runs/ports.ts`), mas "a mesma harness" (2026-11-24) pede a mesma máquina, e mover agora para juntar depois seria duas migrações | mover a camada do Projeto para `Ag/app-builder/` |
| 2 | As três tabelas de conversa ficam separadas | o ganho é pequeno, e é migração | juntar numa tabela com o tipo |
| 3 | A forma do prompt da ficha espera o `A3` | o `A3` reescreve essa parte | colapsar antes |
| 4 | A troca para a aprovação nativa só entra com prova, e não nesta etapa | a política `allow` com `yolo: false` não foi medida | trocar depois da prova da U3 |
| 5 | A prova de cada unidade são os pedidos gravados, byte a byte, e não um teste novo por tradutor | a etapa não muda comportamento; os pedidos são o que o modelo recebe (critério 1) | — |

## U1 A ficha sem dependência da montagem

**Base e modelo.** `main` depois do fechamento da etapa 3. Sonnet: tirar código morto e mover tipos.

### As linhas da tabela

Linhas 1 e 2. Ler na base: `H/spec/mount.ts:171-195` (`mountAgent`, o
`memory ?? threads` da linha 177); `H/spec/factories.ts:102-145` (`controllerOf`, a guarda
`Object.hasOwn` da linha 125, que filtra chaves do próprio `BUILTIN`); `H/spec/spec.ts:11` e `:104`
(o import de `controllerOf` para tipar `mode`, `own`, `subagents` e `workspace`); `H/routes/changes.ts:54` (`switched`) e o tipo do modelo em
`H/spec/spec.ts:39-48`. Referência: `NM/agent-controller-BhkzVgCi.js:8237`, `:8628-8635` e `:8733`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/spec/` | Muda `spec.ts`, `mount.ts`, `factories.ts` | os quatro agentes, pela ficha |
| `H/routes/changes.ts` | Muda: o `switched` mora na rota | a rota de troca de modelo |

### Os contratos que a unidade cria

Nenhum novo. `ConversationSpec` declara os tipos de `mode`, `own`, `subagents` e `workspace` em
`spec.ts`, e `controllerOf` os importa de lá (o tipo antes da função, C26). `NEVER_ASKS` fica
exportado: `H/machine/workspace.ts:2` e `:32` o usam. O `ModelSource` `SESSION` perde `switched`
(`H/spec/spec.ts:44`); a frase de log de cada tipo de conversa vira uma tabela por `ControllerKind` em
`H/routes/changes.ts`, a única leitora (`:54`), com as frases de hoje. O `memory` de `AgentSpec` vai ao `new Agent` só quando a ficha o tem.

### As skills e a leitura

`mastra` (`node_modules/@mastra/core/dist/docs/`, a referência de `AgentController`);
`pstack:typescript-best-practices`.

### A ordem do trabalho

1. **Apagar a guarda morta.** Critérios: 1, 2.
   - **Arquivos:** `H/spec/factories.ts`.
   - **O que sai:** o `Object.hasOwn(BUILTIN, id)` de `factories.ts:125`, que filtra as chaves do
     próprio `BUILTIN`.
   - **Mutações à mão:** devolver um id fora de `BUILTIN` ao `off`; o typecheck recusa.
   - **Pronto quando:** `npm run knip` e os pedidos gravados passam.
2. **A memória só no controller.** Critérios: 1, 4.
   - **Testes:** o caso novo do critério 4, escrito e verde antes da mudança.
   - **Arquivos:** `H/spec/mount.ts`.
   - **Referência a seguir:** `NM/agent-controller-BhkzVgCi.js:8733` (`getCurrentAgent` propaga a
     memória do controller ao agente).
   - **O que entra:** `memory` só da ficha; sem ela, nenhum `memory` no `AgentConfig`.
   - **Mutações à mão:** tirar a memória do controller; o critério 4 fica vermelho.
3. **Os tipos da ficha sem a função.** Critérios: 1, 2.
   - **Arquivos:** `H/spec/spec.ts`, `H/spec/factories.ts`.
   - **O que sai:** o `import` de `controllerOf` em `spec.ts`.
4. **O `switched` na rota.** Critérios: 5.
   - **Arquivos:** `H/spec/spec.ts`, `H/routes/changes.ts`.

### Como se prova

O critério 1 compara cada pedido; o 4, o segundo turno de cada agente de conversa; o 5, a linha de
log da troca. Hoje todos passam: a unidade prova que continuam passando sem as peças que saem.

### Parar se

Um agente chamar `agent.generate` ou `agent.stream` fora do controller (uma automação, a versão do
agente salvo em `Ag/saved-agent/agent.ts:308`): sem o controller, a memória não é propagada. Nesse
caminho a memória fica na ficha, e o builder escreve no relatório onde.

## U2 A montagem num salto

**Base e modelo.** U1. Sonnet: colapsar funções de um chamador.

### As linhas da tabela

Linhas 1 e 8. Ler na base: `H/spec/mount.ts:24-124` (`messagesOf`, `instructionsOf`, `modelOf`,
`turnsOf`, `toolsOfSpec`); `H/spec/factories.ts:56-92` (`agentDefaults`) e `:148-155`
(`toolsOfRun`); `Ag/saved-agent/agent.ts:346` e `Ag/saved-agent/controller.ts:168-169` (a cópia de
aprovação feita duas vezes); `Ag/saved-agent/resolver.ts:28-37` (o memo à mão) e `H/spec/once.ts:7-19`.
Referência: `M/mastracode/sdk/src/index.ts:1368-1867`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/spec/` | Muda `mount.ts`, `factories.ts` | os quatro agentes |
| `Ag/saved-agent/` | Muda `controller.ts`, `agent.ts`, `resolver.ts` | a rota do agente salvo |

### Os contratos que a unidade cria

Nenhum. `agentOfSpec(spec, deps)` e `mountAgent(spec, deps)` mantêm a assinatura; `controllerOf`
também. Os `switch` sobre `Prompt`, `ModelSource`, `TurnSource` e `Approval` ficam, cada um com o
ramo `satisfies never` (C21), dentro da função que os usa.

### As skills e a leitura

`mastra`; `pstack:typescript-best-practices`.

### A ordem do trabalho

1. **Os tradutores entram no seu chamador.** Critérios: 1.
   - **Arquivos:** `H/spec/mount.ts`, `H/spec/factories.ts`.
   - **O que sai:** `messagesOf`, `instructionsOf`, `modelOf`, `turnsOf`, `toolsOfSpec`,
     `agentDefaults`, `toolsOfRun` como funções soltas; cada uma vira um bloco nomeado por uma
     constante dentro de `agentOfSpec` ou `controllerOf`, quando o corpo passa de três linhas.
   - **Pronto quando:** os pedidos gravados passam e `mount.ts` mais `factories.ts` têm menos linhas.
2. **Uma cópia de aprovação.** Critérios: 1, 6.
   - **Arquivos:** `Ag/saved-agent/controller.ts`, `Ag/saved-agent/agent.ts`.
   - **O que sai:** a segunda aplicação, em `controller.ts:168-169`.
   - **Mutações à mão:** tirar a primeira também; o critério 6 fica vermelho.
3. **O memo pelo dono.** Critérios: 1, 7.
   - **Testes:** o caso novo do critério 7, verde antes da troca.
   - **Arquivos:** `Ag/saved-agent/resolver.ts`.
   - **O que entra:** `oncePerRun` de `H/spec/public.ts` no lugar do memo à mão.

### Como se prova

Os critérios 1, 6 e 7. A prova `once.mjs` do estudo mostra por que o `oncePerRun` fica: o Mastra
resolve as ferramentas de novo a cada passo de ferramenta.

### Parar se

Um tradutor tiver um segundo chamador que o estudo não viu (um teste conta como chamador só se entra
pela porta). Ele fica, e o builder diz qual.

## U3 Um dono para o fim do turno

**Base e modelo.** U2. Opus: dois assinantes de eventos do controller, com a ordem entre eles.

### As linhas da tabela

Linhas 3 e 4. Ler na base: `H/spec/turns.ts:72-132` (`sessionTurns`, o `watch` das linhas 116-130,
que assina `agent_end` e `onSessionDeleted` para soltar a conta); `H/turn/end.ts:146-170` (`TurnEnds`,
`Watched`) e `:307-360` (`watchRuns`, o outro assinante dos mesmos eventos); `S/conversations-of.ts`
(onde os dois se ligam). O desenho de `TurnEnds` é da emenda de 2026-11-24 da etapa 2 ("a porta
TurnEnds em harness/turn/end.ts").

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/spec/` | Muda `turns.ts`, `mount.ts` | os três agentes de conversa |
| `H/turn/end.ts` | Muda: `watchRuns` recebe o soltar da conta como um `TurnEnds` | `S/conversations-of.ts` |

### Os contratos que a unidade cria

`sessionTurns` deixa de devolver `watch`; devolve `{ processor, deletedRun, ends }`, com `ends` do
tipo `TurnEnds` de `H/turn/end.ts`. `agentOfSpec` deixa de devolver `watch`. `watchRuns` é o único
assinante de `agent_end` e de `onSessionDeleted`.

### As skills e a leitura

`mastra` (os eventos de `AgentController` em `NM/docs`).

### A ordem do trabalho

1. **O soltar da conta como um `TurnEnds`.** Critérios: 1, 8.
   - **Arquivos:** `H/spec/turns.ts`, `H/spec/mount.ts`, `H/turn/end.ts`, `S/conversations-of.ts`.
   - **O que sai:** `watch` em `turns.ts` e em `agentOfSpec`.
   - **Mutações à mão:** não chamar o soltar no `onSessionDeleted`; `concurrency.test.ts` fica vermelho.
2. **A prova da aprovação nativa.** Critérios: 9.
   - **O que entra:** um script fora do repositório, no `@mastra/core` 1.83.0 instalado: um
     controller com `yolo: false` e `PermissionRules` `allow` para uma ferramenta; conta quantas vezes
     o gate pergunta. O resultado vai ao relatório da unidade, nada ao código.

### Como se prova

O critério 8 por `drain.test.ts` e `concurrency.test.ts`, que cobrem o fim normal, a falha, o Parar e
a conversa apagada no meio do turno.

### Parar se

A ordem entre o soltar da conta e a linha do turno mudar o que um teste observa: hoje são dois
assinantes, e a ordem de chamada pode ter efeito. O builder para e escreve a ordem que o teste pede.

## G1 O ponto de conferência

Servidor: `npm run check:local`, os testes de `H/spec/`, `H/turn/`, `H/routes/` e os cinco
`request.test.ts`; os passos 6 e 7 da `conexus-build`.

## U4 A liberação pelo tipo

**Base e modelo.** G1 no `main`. Sonnet.

### As linhas da tabela

Linha 6. Ler na base: `H/spec/release.ts:44-66` (`releaseByMarks`, o `code` passado à mão);
`Ag/assistant/assistant.ts:330-334`, `Ag/agent-builder/construtor.ts:286-296`,
`Ag/saved-agent/controller.ts:282-291` (os três `part.release`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/spec/release.ts` | Muda | os três agentes de conversa |
| `Ag/assistant/`, `Ag/agent-builder/`, `Ag/saved-agent/` | Muda só a montagem | a raiz |

### Os contratos que a unidade cria

`RELEASED_CODE: Record<MarkedKind, 'ASSISTANT_CONVERSATIONS_RELEASED' |
'CONSTRUTOR_CONVERSATIONS_RELEASED' | 'AGENT_CONVERSATIONS_RELEASED'>` em `H/spec/release.ts`, dono do
código de cada tipo (C26); `releaseByMarks` deixa de receber `code`. Os códigos de log ficam os de
hoje.

### A ordem do trabalho

1. **O código pelo tipo.** Critérios: 1, 10.
   - **O que sai:** o `code` de cada chamador; os três blocos `part.release` viram a mesma chamada.
   - **Mutações à mão:** trocar dois códigos na tabela; o critério 10 fica vermelho.

### Parar se

Um dos três blocos fizer algo além de liberar (o estudo leu só os nomes): o que sobra fica no agente.

## U5 A cabeça da conversa

**Base e modelo.** U4. Sonnet.

### As linhas da tabela

Linha 6. Ler na base: `Ag/agent-builder/routes.ts:37`, `Ag/assistant/routes.ts:102` e `:188`,
`Ag/saved-agent/conversation-routes.ts:60`, `Ag/app-builder/history.ts:12` e `:23` (as cópias de
`thread.title || null`); `API/conversations.ts:65-70`, `API/assistant.ts:35`, `API/construtor.ts:97-103`,
`API/agents.ts:168-176` (os tipos de cabeça).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/spec/` | Cria `threadHead` | as rotas de lista dos quatro agentes |
| `API/conversations.ts` | Exporta `ConversationHead`; os outros três o estendem | a web, `packages/app` |

### Os contratos que a unidade cria

```ts
// API/conversations.ts
export const ConversationHead: z.ZodObject<{ id: …; title: z.ZodNullable<z.ZodString>; createdAt: z.ZodISODateTime }>
// H/spec/head.ts
export function threadHead(thread: StorageThreadType): { id: string; title: string | null; createdAt: string; updatedAt: string }
```

O tipo base é o do Construtor de apps (`id`, `title`, `createdAt`). O Assistente e o Construtor de
agentes o estendem com `updatedAt`; o agente salvo (`API/agents.ts:168-176`) com `updatedAt`,
`agentId` e `draft`. O JSON de cada rota fica igual (critério 3).

### As skills e a leitura

`mastra`; `node_modules/zod` pela forma de `extend`.

### A ordem do trabalho

1. **Um tipo no contrato.** Critérios: 3, 11.
   - **Testes:** o teste de declaração de `packages/app` (uma mudança de tipo no `hub-api` pode passar
     no `npm run check` e quebrar a declaração do SDK).
2. **Uma função no harness.** Critérios: 1, 11.
   - **O que sai:** as cinco cópias.

## U6 Criar a conversa e a rota sem transação

**Base e modelo.** U5. Sonnet.

### As linhas da tabela

Linha 6. Ler na base: `H/spec/open.ts`; os três fluxos de criação em `Ag/assistant/routes.ts`,
`Ag/agent-builder/routes.ts:45-69`, `Ag/saved-agent/conversation-routes.ts:100-140`; as funções com
transação nos arquivos de rota: `Ag/agent-builder/routes.ts:28-30` (`admittedTo`),
`Ag/assistant/company-memory-routes.ts:28` e `:45`, `Ag/assistant/routes.ts:154`,
`Ag/saved-agent/conversation-routes.ts:40` e `:45`: `admittedTo` (`Ag/agent-builder/routes.ts:28`,
`Ag/saved-agent/conversation-routes.ts:40`), `mayManage` (`conversation-routes.ts:45`,
`Ag/assistant/company-memory-routes.ts:27`), `namesOf` (`company-memory-routes.ts:43`) e
`projectNames` (`Ag/assistant/routes.ts:152`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/spec/open.ts` | Cria `createdThread` | os três agentes de conversa |
| as rotas dos três agentes | Muda: a função sai para o módulo do agente | os testes de rota |

### Os contratos que a unidade cria

`createdThread(deps, input): Promise<ConversationHead & { updatedAt: string }>` em `H/spec/open.ts`,
com o `attemptId`, o `ownThread` e a linha `*_CONVERSATION_CREATED` de cada tipo. As funções movidas
mantêm a assinatura.

### A ordem do trabalho

1. **`createdThread`.** Critérios: 1, 12.
2. **As transações saem das rotas.** Critérios: 12, 13.
   - **O que entra:** a busca `grep -nE "transaction\(|catch" ` nos arquivos `*routes.ts` do servidor
     em `Ag/` não acha nada.

### Parar se

O Construtor de apps, com a criação por índice (`Ag/app-builder/routes.ts:70-100`), não couber em
`createdThread` sem um ramo próprio: ele fica como está.

## G2 O ponto de conferência

Servidor e `packages/hub-api`: `npm run check:local`, `npm run openapi` sem diferença, os testes da
U4 à U6 e o teste de declaração de `packages/app`; os passos 6 e 7 da `conexus-build`.

## U7 A máquina da conversa montada num lugar

**Base e modelo.** G2 no `main`. Sonnet.

### As linhas da tabela

Linha 5. Ler na base: `Ag/assistant/assistant.ts:293-304`, `Ag/agent-builder/construtor.ts:257-270`,
`Ag/saved-agent/controller.ts:243-253` (a montagem `createConversationMachines` + `machinePart`);
`H/machine/part.ts:22-32`; `H/machine/spec.ts:8-27` (`MachineSpec`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/machine/` | Cria `conversationMachinesFor` em `part.ts`; exporta por `public.ts` | os três agentes de conversa |
| `Ag/assistant/`, `Ag/agent-builder/`, `Ag/saved-agent/` | Muda só a montagem | a raiz |

### Os contratos que a unidade cria

`conversationMachinesFor(spec: MachineSpec, deps: …): { machines: ConversationMachines; part:
ReturnType<typeof machinePart> }`. O que difere entre os três (`otherTemplate`, `readMedia`, `marks`)
é o `MachineSpec` de cada agente, como hoje.

### A ordem do trabalho

1. **Uma montagem.** Critérios: 1, 14.

## U8 Um núcleo de máquina

**Base e modelo.** U7. Opus: duas classes de sessão com estado e promessas compartilhadas, e as falhas
de cada uma.

### As linhas da tabela

Linha 5. Ler na base: `H/machine/machines.ts:86-114` (`ensure`, com `refreshing`), `:129-147` (`boot`,
com `restoreFailure`), `:222-250` e `:253-275` (o workspace, `kill`, `stopAll`);
`H/machine/conversation.ts:158-165` (`ensure`), `:171-206` (`boot`, com `ReattachFailed` como
`FILE_GONE` nas linhas 190-191), `:245-278` e `:280-305`; `H/machine/e2b.ts:16-38`; o `neverAsks` do
workspace, `false` no Projeto (`machines.ts:273`) e `true` na conversa (`conversation.ts:296`). As duas
variantes zeram `session.ready` numa partida que falha (`machines.ts:94-96`, `conversation.ts:190`).
Referência: Factory `M/mastracode/factory/src/workspace.ts:1829-1833`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/machine/` | Cria o núcleo (`session-core.ts`); muda `machines.ts`, `conversation.ts`, `e2b.ts`, `port.ts`, `public.ts` | `Ag/app-builder/runs/ports.ts`, U7 |
| `Ag/app-builder/runs/ports.ts` | Muda só a montagem | a raiz |

### Os contratos que a unidade cria

```ts
// H/machine/session-core.ts
export type StartFailure =
  | { kind: 'UNAVAILABLE'; reason: 'START' | 'NETWORK' }
  | { kind: 'RESTORE'; failure: RestoreFailure }   // a máquina do Projeto
  | { kind: 'GONE' }                               // a conversa: ReattachFailed vira FILE_GONE
```

O núcleo é dono de `ensure`, `boot`, `open`, do workspace, de `kill` e de `stopAll`; a camada do
Projeto acrescenta Git, `check`, `pack`, `sync` e o `refreshing` das marcas de conflito. A falha que
cada variante devolve hoje é um caso da união (C21), e o `catch` do `boot` a mapeia uma vez (C53). As
linhas `MACHINE_UNAVAILABLE` e `MACHINE_STARTED` ficam com os mesmos campos (hoje a do Projeto não
leva `conversationId` no erro, `machines.ts:141`, e assim fica). O `neverAsks` de cada variante vira um
campo do `MachineSpec` na U9; até lá, um parâmetro do núcleo.

### As skills e a leitura

`mastra`; a linha `@mastra/e2b` de `docs/reference/stack.md` ("`running` precedes `onStart`: gate the
first tool on `start()`"); `node_modules/e2b/dist/index.d.ts`.

### A ordem do trabalho

1. **O núcleo, com a conversa em cima.** Critérios: 1, 14, 15.
2. **A máquina do Projeto em cima do núcleo.** Critérios: 1, 15, 16.
   - **Mutações à mão:** devolver `MACHINE_UNAVAILABLE` no lugar da falha de restauração; o teste de
     `machine-session.test.ts` fica vermelho. Não zerar `session.ready` na falha; a partida seguinte
     de `conversation-lane.test.ts` fica vermelha.
3. **`e2b.ts` em núcleo e Projeto.** Critérios: 15, 16.

### Parar se

As duas variantes diferirem num ponto que nenhum teste cobre (a ordem de `killStale` e `find`, o
`refreshing` do Projeto): o builder escreve o caso num teste antes de juntar, e para se o teste
mostrar que as duas não cabem num núcleo.

## U9 O `MachineSpec` dos quatro

**Base e modelo.** U8. Sonnet.

### As linhas da tabela

Linha 5. Ler na base: `H/machine/spec.ts:8-27`, `H/machine/workspace.ts:27-28` (o resolver),
`Ag/app-builder/runs/ports.ts`.

### Os contratos que a unidade cria

`MachineSpec` ganha `neverAsks: boolean` (o de hoje de cada agente), `lsp: boolean` e `computer:
boolean`, os dois últimos `false` nos quatro agentes; o Construtor de apps passa a ter o seu
`MachineSpec`. Nenhuma ferramenta nova se liga.

### A ordem do trabalho

1. **O tipo e o padrão.** Critérios: 1, 17.
   - **Testes:** um caso por agente que lista as ferramentas do workspace, igual à lista de hoje.

## G3 O ponto de conferência

Servidor: `npm run check:local`, os testes de `H/machine/` e das máquinas dos quatro agentes, o
`machine-e2b.test.ts` com a chave da instalação; os passos 6 e 7 da `conexus-build`.

## U10 As pastas soltas

**Base e modelo.** G3 no `main` e a decisão A. Sonnet, com o codemod do repositório
(`scripts/codemod-server.ts`), uma pasta por commit de passo.

### As linhas da tabela

Linha 7. Pela opção (a), à espera da palavra do fundador: `H/copy-clock/` vai para
`H/mastra/copy-clock.ts`; `H/network/` (menos a ferramenta) vai para `H/machine/network/`;
`H/network/network-tool.ts` vai para `H/tools/network-tool.ts`. Na (b), só a árvore da explicação muda
(U12). Na (c), a unidade espera a mudança de método.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/copy-clock/`, `H/network/` | Apaga, pelo codemod | `S/conversations-of.ts`, `S/main.ts`, `H/machine/` (a ferramenta também em `machine-tools.ts:4`), `Ag/app-builder/`, `Ag/agent-builder/` |
| `H/mastra/`, `H/machine/network/`, `H/tools/` | Cria | os mesmos |

### A ordem do trabalho

1. **Mover, pasta por pasta.** Critérios: 1, 2, 18.
   - **Pronto quando:** `git diff -M --stat` mostra só renomeações e imports.

## U11 As peças de um agente só

**Base e modelo.** U10. Sonnet, codemod.

### As linhas da tabela

Linha 7. `H/tools/company/search.ts` (`companyReadSearch`) e `projectsOf`, de
`H/tools/company/overview.ts`, têm só o Assistente como usuário (`Ag/assistant/assistant.ts:52`, `:55`).
Ficam no harness `overviewTool` (usado por `H/tools/company/factory.ts:18`) e `H/turn/turn-line.ts`
(usado por `H/turn/end.ts:22-23`): movê-los criaria um import de produção do harness para um agente.

### A ordem do trabalho

1. **Mover.** Critérios: 1, 2.

### Parar se

`projectsOf` dividir código com `overviewTool`: ele fica, e o relatório diz o quê.

## U12 A raiz só monta

**Base e modelo.** U11. Sonnet.

### As linhas da tabela

Linha 7. Ler na base: `S/conversations-of.ts` (`builderDoorOf`, `builderDataOf`, `builderDoorsOf`,
`handOffsOf`, `toolCallsOf`, `appDataOf`); `docs/explanation/harness.md:16-27` (a árvore, sem
`network/`) e `:42-44` ("All four are built by `mountAgent`", que vale para os controllers, mas não
para o agente da versão, feito por `agentOfSpec` em `Ag/saved-agent/agent.ts:308`).

### A ordem do trabalho

1. **Os adaptadores no agente.** Critérios: 1, 19.
2. **A explicação.** Critérios: 19. A árvore como ficou depois da U10 e a frase dos controllers.

## U13 A moldura da sala e o seletor

**Base e modelo.** G1 no `main` (nenhum arquivo em comum com o servidor). Sonnet.

### As linhas da tabela

Linha 9. Ler na base: a moldura (`RoomContext`, `Beside`, `fileSide`, `widen`) em
`W/agents/assistant/conversation.tsx`, `W/agents/saved-agent/agent-chat.tsx`,
`W/agents/agent-builder/construtor-chat.tsx`; os seletores em
`W/agents/app-builder/conversation-switch.tsx:189-215` e `W/agents/saved-agent/test-panel.tsx:55-76`;
`W/harness/room/room.ts`.

### Os contratos que a unidade cria

`RoomFrame` (o `widen` como propriedade, porque só o agente salvo o usa) em
`W/harness/room/frame.tsx`; `ConversationPicker` (a idade como propriedade, porque só o agente salvo a
mostra) em `W/harness/room/picker.tsx`. Peças de `ui/` de hoje, nenhuma nova (design V62).

### As skills e a leitura

As linhas de `apps/web/src` de `docs/reference/stack.md`: `@tanstack/react-router`
(`node_modules/@tanstack/router-core/skills/router-core/`), `shadcn`, `react`.

### A ordem do trabalho

1. **A moldura.** Critérios: 20.
2. **O seletor.** Critérios: 20.

### Como se prova

O critério 20 pelos testes nomeados e pelo QA (testing T25), que abre cada sala e cada seletor contra
a captura de antes.

## G4 O ponto de conferência

Servidor e web: `npm run check:local`, `npm run deps`, os testes das pastas movidas, os testes de web
da U13 e `W/routes/__root.test.tsx`; o QA das três salas; os passos 6 e 7 da `conexus-build`.
