# A harness única de verdade

Trilho: harness

Etapa de refatoração do harness, sem mudança de comportamento. O pedido do fundador, em 2026-11-27:
"A parte nossa de arquitetura também, de código, como a gente está estruturando, como a gente está
criando código, para não ter redundância, para seguir como times de engenharia fazem repositórios
referência também. ... A gente até juntou uma harness única, verificar se está correto também." O
estudo `conexus-arquitetura-harness` (2026-11-27) fica fora do repositório (delivery L21); a sua
tabela de referência está abaixo, com a unidade de cada linha, e o §7 dele é a proposta deste cartão.
As falas do fundador que a página cita vêm do registro de decisões do firstmate, com a data de cada
uma; as que ainda não estão no repositório vão para a página do trilho quando ele aprovar (delivery L6).

Lido no `main` em `57400a0c2` (2026-11-27, v0.24.136). O estudo foi feito sobre `c87b82040`; entre os
dois nada mudou em `apps/` nem em `packages/` (`git diff --stat c87b82040 57400a0c2 -- apps packages`
vazio), e cada `arquivo:linha` abaixo foi relido em `57400a0c2`. A conferência das citações e a
leitura do cartão corrigiram o estudo, e o cartão segue o código:

- são doze pedidos gravados, não dezenove;
- `NEVER_ASKS` tem usuário fora da montagem;
- as três `admitted` têm corpos diferentes;
- `overview.ts` e `turn-line.ts` têm usuários no harness;
- `Phase` já tem dono;
- a segunda "cópia de aprovação" do agente salvo é o regime da própria ficha;
- o `WeakMap` do resolver guarda a `Resolution`, não é um memo;
- o fim do turno não cabe em `TurnEnds` sem um contrato novo;
- a máquina do Projeto não tem `stopAll` nem pausa;
- o documento OpenAPI não é gravado no repositório.

Versões: `@mastra/core` 1.83.0, `@mastra/server` 1.83.0, `@mastra/memory` 1.41.1, `@mastra/e2b`
0.17.0. Prateleira: `mastra-1.83` em `d60ba71b` (Mastra Code e Factory em `mastracode/`); `onyx` e
`librechat` nos commits do manifesto da prateleira. Abreviações: `S/` = `apps/server/src/`, `H/` =
`S/harness/`, `Ag/` = `S/agents/`, `API/` = `packages/hub-api/src/`, `W/` = `apps/web/src/`, `NM/` =
`node_modules/@mastra/core/dist/`, `M/` = a prateleira `mastra-1.83`.

## A página do fundador

**No fim desta etapa** nada muda na tela. Você abre uma conversa com o Assistente, uma com o
Construtor de agentes, uma com um agente publicado e uma no Construtor de apps, e todas se comportam
como hoje. O pedido de cada uma ao modelo fica igual nos doze pedidos gravados que a CI compara
(iguais byte a byte depois de trocar ids e datas por marcas fixas). O que muda é para quem vem
depois. A partida da máquina passa a ter um dono só para os quatro agentes, e cada coisa tem um
lugar. O próximo cartão do Construtor de apps (máquina com tela, prazos separados, LSP) e o do
Assistente (leitura de PDF, comandos longos) mexem então na partida uma vez, e não duas.

**O roteiro de uso.** Na nuvem, numa empresa de teste, como dono.

1. Em **Conversas**, abra uma conversa nova e peça uma conta sobre uma planilha pública que você
   anexar. O Conexus liga a máquina, faz a conta e responde, como hoje.
2. Abra o **Construtor de agentes** de um agente do Projeto e toque em **Testar** com um rascunho
   que use o Computador. O teste responde, como hoje.
3. Abra esse agente publicado e converse com ele. Ele responde e pede a sua aprovação antes de uma
   escrita, como hoje.
4. No **Construir**, peça uma mudança pequena num app de teste e abra a **Prévia**. A mudança
   aparece, como hoje.
5. Volte a **Conversas** e apague a conversa do passo 1. Ela some da lista.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página e responde às duas decisões
abaixo. No fim: faz o roteiro e diz o que viu. Não há texto novo de tela para aprovar.

**A visão.** "Cada capacidade do Conexus tem uma lógica só, que serve toda conversa e toda tela, e
nunca uma cópia por Solution." Nas suas palavras: "Isso é do conexus" (2026-11-12). "Pra mim eles
teriam que ter a mesma harness" (2026-11-24). "sem gambiarra, código bem feito, fluxo coeso"
(2026-10-16). A etapa não cruza nenhuma linha da `VISION.md`: não muda o que uma pessoa vê.

**Fica de fora, e por quê.**

- **Juntar as três tabelas de conversa** (Assistente, Construtor de agentes, agente salvo). É
  migração, e os três donos são legítimos. O ganho, umas 40 linhas, não paga o risco.
- **Trocar a forma do prompt da ficha por uma função.** O `A3` reescreve essa parte com o texto base
  do Conexus; mexer nela antes seria trabalho jogado fora.
- **Um dono só para o fim do turno.** Hoje dois ouvintes escutam o mesmo fim: um solta a conta do
  modelo, o outro escreve a linha do turno. Juntá-los pede um contrato novo, porque o soltar guarda um
  estado por conversa que a porta de hoje não tem. Fica para um cartão com esse desenho.
- **Trocar a regra de aprovação do agente salvo pela regra nativa do Mastra** (`PermissionRules`).
  Antes, uma prova tem de mostrar que a regra nativa evita a pergunta por ferramenta. A prova e a
  troca são de outro cartão.
- **Uma pausa e um "parar tudo" para a máquina do Projeto.** Só a máquina da conversa os tem; dar à
  do Projeto seria mudar comportamento.
- **Os pacotes do próximo cartão do Construtor de apps** (máquina com tela, prazos separados, LSP,
  ferramentas `computer`) e as mudanças do Assistente. Esta etapa só os destrava; um campo que ninguém
  lê ainda não entra.
- **As issues `next-card` abertas.** Nenhuma é desta etapa: ela não muda comportamento, e cada uma
  pede um.

**As decisões suas nesta etapa.** Duas, ambas à espera da sua palavra. O cartão está escrito com a
recomendação de cada uma; se você escolher outra, a unidade que ela toca muda antes do build.

**A. As três pastas do harness fora da árvore que você aprovou em 2026-11-23** ("Aprovado entao").
São `network/` (a lista de saída da máquina, que a etapa 3 criou), `copy-clock/` (o relógio da cópia
do lago, um workflow do Mastra) e `schema/` (o esquema `builder` do banco, que os três agentes de
conversa usam). Exemplo: quem procura "a rede da máquina" abre `harness/machine/` e acha só quem a aplica
(`network.ts`); as listas, as rotas e as tabelas moram ao lado, em `harness/network/`.

| Opção | O que acontece |
| --- | --- |
| a) **Recomendada, à espera da sua palavra** | `copy-clock` vai para `harness/mastra/`, porque é um workflow do Mastra e só pode morar onde o Mastra mora; `harness/mastra/` já guarda o agendador e a retenção. `network` vai para `harness/machine/network/`, junto com o `harness/machine/network.ts` que a aplica, porque é a lista de saída da máquina, e a ferramenta que pede um domínio vai para `harness/tools/`, porque três lugares a usam. `schema` entra na sua lista como peça compartilhada. A U8 faz as mudanças. |
| b) | As três pastas entram na lista como estão. A U8 sai, e a U10 só corrige a árvore na explicação do harness. |
| c) | `copy-clock` sai do harness para uma pasta da trilha Dados. Isso pede mudar a regra de camada que só deixa o Mastra no harness e nos agentes, numa mudança de método à parte (delivery L20). |

Veredito: nenhuma das três é remendo; é onde uma peça mora. Mastra, Onyx e LibreChat organizam por
assunto, em árvores planas, e não decidem esta pergunta (a linha 6 da tabela).

**B. Onde esta etapa entra na ordem do trilho.** A ordem que você fixou em 2026-11-25 é a etapa 3 (a
rede e o navegador), o `A2` e o `A3`; os cartões do `A2` e do `A3` estão aprovados e esperam. Uma
etapa de refatoração é uma etapa do trilho (delivery L1), então entrar na fila é decisão sua.
Exemplo: o `A3` muda a ficha e a montagem (`H/spec/spec.ts`, `factories.ts`, `mount.ts`) e o espaço da
máquina (`H/machine/workspace.ts`), as mesmas peças que esta etapa enxuga na montagem e na máquina.

| Opção | O que acontece |
| --- | --- |
| a) **Recomendada, à espera da sua palavra** | Entra logo depois do fechamento da etapa 3, antes do `A2`. O `A2`, o `A3` e o próximo cartão do Construtor de apps são construídos sobre a base mais curta, e o builder de cada um relê as linhas que o cartão dele cita, como todo build faz. Custa ao `A2` a espera desta etapa, cerca de 1 300 linhas sem mudança de tela. |
| b) | Entra depois do `A3`. O `A2` e o `A3` entram como estão; esta etapa relê as próprias linhas depois deles, e o próximo cartão do Construtor de apps espera por ela. |

Veredito: ordem, não remendo. Recomendo (a) porque as mudanças que o `A3` e o Construtor de apps
pedem caem nas mesmas peças, e fazê-las depois da unificação é fazê-las uma vez (§6 do estudo).

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 | U1 A ficha sem dependência da montagem | Saem a guarda morta `Object.hasOwn` e a memória repetida no agente; os tipos da ficha param de depender de `factories.ts` | `H/spec/` | testing | a etapa 3 fechada; a decisão B |
| G1 | U2 A montagem num salto | Os sete tradutores de um chamador entram em `agentOfSpec` e `controllerOf` | `H/spec/` | testing | U1 |
| G2 | U3 A liberação pelo tipo | `releaseByMarks` tira o código do tipo; os três `part.release` viram uma chamada | `H/spec/`, `Ag/assistant/`, `Ag/agent-builder/`, `Ag/saved-agent/` (só a montagem) | testing | G1 |
| G2 | U4 A cabeça da conversa | `threadHead(thread)` e o `ConversationSummary` como base no contrato, com o mesmo JSON | `H/spec/`, `API/` (`conversations.ts`, `assistant.ts`, `construtor.ts`, `agents.ts`), as rotas de lista dos quatro agentes | testing | U3 |
| G2 | U5 Criar a conversa e a rota sem transação | `createdThread` para os três fluxos de criação; as funções que abrem transação saem dos arquivos de rota dos agentes (C14) | `H/spec/`, as rotas dos três agentes de conversa | testing | U4 |
| G3 | U6 A máquina da conversa montada num lugar | `conversationMachinesFor(spec, deps)` monta `createConversationMachines` e `machinePart`, que hoje cada agente monta | `H/machine/`, `Ag/assistant/`, `Ag/agent-builder/`, `Ag/saved-agent/` (só a montagem) | testing | G2 |
| G3 | U7 Uma partida de máquina | A partida (`startMachine`) e o mapa da falha (`startRefused`) com um dono, usados pelas duas máquinas | `H/machine/` | testing | U6 |
| G4 | U8 As pastas soltas | Pela decisão A: `copy-clock`, `network` e a ferramenta da rede nos lugares da opção escolhida | `H/copy-clock/`, `H/network/`, `H/mastra/`, `H/machine/`, `H/tools/`, os importadores, `scripts/record-tools.ts`, `scripts/rerun-never.json` | delivery | G3; a decisão A |
| G4 | U9 As peças de um agente só | `search.ts` e `projectsOf` vão para `Ag/assistant/` | `H/tools/company/`, `H/tools/public.ts`, `Ag/assistant/` | testing | U8 |
| G4 | U10 A raiz só monta | Os adaptadores de `S/conversations-of.ts` vão para o `public.ts` de cada agente; a explicação do harness corrigida | `S/conversations-of.ts`, `Ag/*/public.ts`, `docs/explanation/harness.md` | delivery | U9 |
| G4 | U11 A moldura da sala e o seletor | `RoomFrame` e `ConversationPicker` em `W/harness/room/`, usados pelas três salas e pelos dois seletores | `W/harness/room/`, `W/agents/` (só as salas e os seletores) | web | G1 (nenhum arquivo em comum) |

**Os grupos.** Quatro pull requests, um commit por unidade; o porquê de não ser um só está na decisão
6 do firstmate. A U11 não divide arquivo com o servidor; ela fica no G4 para
não abrir um quinto pull request.

**Orçamento de código alterado.** U1: 60. U2: 150. U3: 60. U4: 80. U5: 160. U6: 90. U7: 150. U8: 80
(imports). U9: 40. U10: 150. U11: 250. Total da etapa: cerca de 1 270 linhas, sem testes nem gerados,
com mais linhas apagadas que acrescentadas.

## Os critérios de aceite

Toda unidade fecha também com os critérios 1 a 3.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | todas | Os doze pedidos gravados ao modelo (`Ag/*/requests/*.snapshot`) ficam iguais depois da normalização de `requestOf` (`H/spec/test-request.ts:49-82`), comparados por `sameRequests` (`:85-91`); um pedido que muda faz o teste falhar sem `--test-update-snapshots` | todos os casos de `Ag/assistant/request.test.ts`, `Ag/assistant/browser.test.ts`, `Ag/app-builder/request.test.ts`, `Ag/agent-builder/request.test.ts` e `Ag/saved-agent/request.test.ts`; e `git diff --exit-code -- 'apps/server/src/agents/*/requests/*.snapshot'` | must |
| 2 | todas | O grafo de imports não ganha violação nem ciclo; a regra `mastra-only-in-harness-and-agents` e a `hub-does-not-import-harness-or-agents` seguem recusando o que recusam hoje | `npm run deps` | must |
| 3 | todas | O documento OpenAPI emitido não muda, nem na ordem dos campos | `npm run openapi` na base e na unidade, cada saída num arquivo fora do repositório, e `diff` entre os dois sem diferença | must |
| 4 | U1 | Numa conversa do Assistente, do Construtor de agentes, do agente salvo e do Construtor de apps, o segundo turno manda ao modelo a mensagem do primeiro, com a memória posta só no controller | um caso novo, escrito antes da mudança e verde hoje, em `Ag/assistant/request.test.ts`, `Ag/agent-builder/request.test.ts`, `Ag/saved-agent/request.test.ts` e `Ag/app-builder/request.test.ts`: "o segundo turno leva o primeiro" | must |
| 5 | U2 | A troca de modelo escreve a mesma linha `*_MODEL_SET` de hoje, uma por troca, em cada agente que troca de modelo | `H/spec/lines.test.ts`, os casos de `_MODEL_SET` (linhas 59-82); `Ag/assistant/routes.test.ts`, "o modelo: a dona troca o modelo" (linha 223) | must |
| 6 | U3 | Apagar a empresa, a pessoa ou o Projeto apaga as conversas de cada agente e escreve o mesmo código `*_CONVERSATIONS_RELEASED` de hoje, por agente | o código: `H/spec/lines.test.ts`, "soltar as conversas: tirar uma pessoa com uma conversa de cada tipo dá a linha de cada tipo" (linha 22); o apagamento: `Ag/assistant/delete.test.ts`, `Ag/assistant/release.test.ts`, `Ag/saved-agent/release.test.ts`, `Ag/saved-agent/conversation.test.ts` ("a remoção", linhas 253 e 268) | must |
| 7 | U4 | As listas de conversa dos quatro agentes respondem o mesmo JSON de hoje, com o título vazio como `null` | `Ag/assistant/routes.test.ts`, "a lista" (linha 159); um caso novo, escrito antes da mudança, de lista no Construtor de agentes, no agente salvo e no histórico do Construtor de apps, que compara o JSON inteiro; o teste de declaração de `packages/app` | must |
| 8 | U5 | Criar uma conversa nos três agentes responde como hoje, e quem não pode gerir o Projeto recebe a mesma recusa de hoje | `Ag/agent-builder/routes.test.ts`, `Ag/saved-agent/conversation.test.ts` ("abrir", linha 41), `Ag/assistant/create.test.ts` | must |
| 9 | U5 | Nenhum arquivo de rota de agente abre transação | `grep -n -e 'database.read(' -e 'database.command(' apps/server/src/agents/*/*routes.ts` não acha nada; hoje acha cinco linhas (`agent-builder/routes.ts:29`, `saved-agent/conversation-routes.ts:46`, `assistant/routes.ts:154`, `assistant/company-memory-routes.ts:28` e `:45`) | must |
| 10 | U6 | As três máquinas de conversa ligam, rodam e se apagam como hoje, com a rede da empresa | `Ag/assistant/machine.test.ts`, `Ag/saved-agent/machine.test.ts`, `Ag/agent-builder/draft-machine.test.ts`, `H/machine/machine-network.test.ts` | must |
| 11 | U7 | A partida que falha escreve `MACHINE_UNAVAILABLE` com o motivo e os campos de hoje de cada máquina; a máquina do Projeto cujo Git pede restauração devolve `GIT_RESTORE_NEEDED`; a conversa cuja máquina sumiu devolve `FILE_GONE`; depois de uma partida que falha, a seguinte tenta de novo | `H/machine/machine.test.ts`, "o Git a restaurar passa pelo início da máquina" (linha 266); `H/machine/machine-session.test.ts`, `machine-sync.test.ts`, `Ag/app-builder/closure.test.ts`; `H/machine/conversation-lane.test.ts`, os casos de `FILE_GONE` (linhas 111 e 119); um caso novo em `conversation-lane.test.ts`, escrito antes da mudança: "a partida que falha e a seguinte que liga" | must |
| 12 | U7 | A partida que passa do prazo responde `MACHINE_UNAVAILABLE`, e a máquina da conversa que liga depois é pausada, porque a pausa espera a partida em curso | `H/machine/conversation-lane.test.ts`, "a partida que passa do prazo" (linha 151) | must |
| 13 | U7 | No E2B de verdade, a máquina da conversa liga e roda um comando | `H/machine/machine-e2b.test.ts`, os casos opt-in (com a chave da instalação); a máquina do Projeto se prova no passo 4 do roteiro | should |
| 14 | U8 | O relógio da cópia agenda e roda como hoje; a ferramenta da rede pede e libera como hoje | `H/copy-clock/clock.test.ts` e os testes de `H/network/` (`network-store`, `network-routes`, `network-tool`, `network-tool-answer`), nos lugares novos; `npm run rerun-list` | must |
| 15 | U10 | O Hub monta e desmonta na mesma ordem; a explicação do harness diz a árvore de hoje | `S/boot.test.ts`, `S/main.test.ts`, `npm run docs` | must |
| 16 | U11 | As três salas e os dois seletores mostram o mesmo que hoje, a 1366 e 390 px, nos dois temas | `W/agents/assistant/conversation.test.tsx`, `W/agents/saved-agent/agent-page.test.tsx`, `W/agents/agent-builder/construtor-chat.test.tsx`, `W/routes/__root.test.tsx`; as capturas do QA (testing T25) | must |

## A matriz de estados

Nenhuma tela nova, nenhum estado novo. As três salas de conversa e os dois seletores mudam de dono
(U11) e mantêm cada estado de hoje: primeira vez, vazio, carregando, erro, conversa não encontrada,
sem permissão. O QA confere cada um contra a captura de antes, a 1366 e 390 px, nos dois temas.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `ConversationSummary.id`, `title`, `createdAt` (U4, já existem) | `threadHead` | as listas de conversa da web dos quatro agentes |
| `updatedAt` (U4, já existe no Assistente, no Construtor de agentes e no agente salvo) | `threadHead` | as listas desses três |
| `agentId`, `draft` (U4, já existem no agente salvo) | a rota do agente salvo | a lista de conversas do agente salvo |

## A tabela de falhas

Nenhuma gravação ou comando novo, e nenhuma tabela, coluna ou migração nova. Cada linha é uma gravação que uma unidade move de lugar; a resposta
de cada uma fica a de hoje.

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| O apagamento das conversas de um tipo (`releaseByMarks`, U3): cada sessão, o `each` da empresa, a conversa | como hoje: a segunda acha menos conversas | como hoje: o que apagou fica apagado, e a remoção seguinte acha o resto | banco fora: falha como hoje | o mesmo `*_CONVERSATIONS_RELEASED`, com o mesmo `count` | 6 |
| A criação da conversa (`createdThread`, U5): a conversa do Mastra e a linha do agente | como hoje: a mesma tentativa devolve a mesma conversa | como hoje | banco fora: `503` como hoje | o mesmo `*_CONVERSATION_CREATED` | 8 |
| A partida da máquina (`startMachine`, U7): `killStale` ou `find`, depois `sandbox.start` | como hoje: a promessa da sessão serve a quem chega | como hoje: a promessa zerada, e a próxima ferramenta tenta de novo | E2B fora: `MACHINE_UNAVAILABLE` com `START` ou `NETWORK` | o mesmo `MACHINE_UNAVAILABLE` e `MACHINE_STARTED`, com os campos de hoje de cada máquina | 11, 12, 13 |

## A tabela de referência

As linhas do estudo, com a unidade de cada uma. Rótulos: **lido** (o código aberto), **provado** (um
script rodou no pacote instalado).

| # | Peça | Unidade | O que o fundador já decidiu | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | A montagem | U1, U2 | a ficha e a montagem (etapa 1 do harness) | `H/spec/mount.ts:24-195`, `H/spec/factories.ts:56-155` | `M/mastracode/sdk/src/index.ts:1368` (`createCodingAgent`), `:1804` (`new AgentController`), **lido** | um objeto de config e um salto até o `new Agent` | embrulhado: a ficha fica, os tradutores de um chamador saem | — | — | — |
| 2 | A memória do agente | U1 | — | `H/spec/mount.ts:177` (`memory: memory ?? threads`) | `NM/agent-controller-BhkzVgCi.js:8237`, `:8628-8635`, `:8733` (`propagateRuntimeServicesToAgent`), **provado**; a memória só no controller em `M/mastracode/sdk/src/index.ts:1820`, **lido** | o controller põe a sua memória no agente a cada `getCurrentAgent` | nativo | `@mastra/core` 1.83.0: o script `memory.mjs` do estudo (`before false`, `after false false`, `propagated true true`); o critério 4 o prova pela porta | — | — |
| 3 | A conversa: liberar, cabeça, criar | U3, U4, U5 | a sala única (etapa 2 do harness) | `H/spec/release.ts:44-66`; as cinco cópias de `thread.title` com o vazio como `null` (U4); `H/spec/open.ts` | `M/mastracode/factory/src/factory.ts:1680-1830` (um dono da sessão), **lido** | um dono por conceito da conversa | nativo: a memória e o controller do Mastra por baixo; a repetição sai | — | — | `H/spec/head.ts` |
| 4 | A máquina | U6, U7 | "a mesma harness" (2026-11-24) | `H/machine/machines.ts:129-147`, `:222-251` e `H/machine/conversation.ts:171-206`, `:245-278` | Factory `M/mastracode/factory/src/workspace.ts:1829-1833`, **lido** | uma máquina por sessão, de uma forma só | embrulhado: uma partida, e o que é de uma máquina só fica nela | — | — | `H/machine/start.ts` |
| 5 | A moldura da sala na web | U11 | a sala única (etapa 2) | `W/agents/assistant/conversation.tsx`, `W/agents/saved-agent/agent-chat.tsx`, `W/agents/agent-builder/construtor-chat.tsx`; os seletores em `W/agents/app-builder/conversation-switch.tsx` e `W/agents/saved-agent/test-panel.tsx` | `M/mastracode/factory-ui/src/ui/domains/chat/`, **lido** | uma moldura de conversa, e cada domínio põe o seu | embrulhado: uma moldura | — | — | `W/harness/room/frame.tsx`, `W/harness/room/picker.tsx` |
| 6 | A árvore | U8, U9, U10 | 2026-11-23 ("Aprovado entao"); a decisão 1 do firstmate na etapa 3 (`H/network/` à parte) | `H/network/`, `H/copy-clock/`, `H/schema/`; `S/conversations-of.ts` | `M/packages/core/src`, `M/mastracode/sdk/src`, Onyx `backend/onyx`, LibreChat `packages/api/src`, **lido** | árvores planas por assunto; a ferramenta é irmã do agente | nativo: a árvore é a regra do Conexus, mais estrita que as três, e o grafo medido a cumpre | — | A | — |
| 7 | O fim do turno | fica de fora: um dono só pede um contrato novo (a página) | 0049 (a fila); a porta `TurnEnds` (emenda de 2026-11-24 da etapa 2) | `H/spec/turns.ts:116-130` e `H/turn/end.ts:312-360`, dois ouvintes de `agent_end` e de `onSessionDeleted`; `TurnEnds` (`H/turn/end.ts:146-156`) não tem o soltar da conta | os eventos de `AgentController` (`subscribe`, `onSessionDeleted`), **lido** | um ouvinte por papel | embrulhado: os dois papéis são legítimos | — | — | — |
| 8 | A aprovação | fica de fora: a troca só com prova (a página) | 0053 | `H/spec/mount.ts:85-124` (`NEVER_ASKS`, `askingOnlyByOwnRule`) | `resolveToolApproval` (`NM/agent-controller-BhkzVgCi.js:5352-5367`), `PermissionRules`, **lido** | a política por ferramenta no controller | embrulhado | a política `allow` com `yolo: false` em `@mastra/core` 1.83.0, a medir em outro cartão | — | — |
| 9 | A memoização por run | fica de fora: nada muda | — | `H/spec/once.ts:7-19`, usada por `runResolver` (`H/spec/run.ts:160`); o `WeakMap` de `Ag/saved-agent/resolver.ts:28-37` guarda a `Resolution` do run, não é memo | o `Agent` do `@mastra/core` 1.83.0, **provado** | resolve ferramentas e modelo de novo a cada passo de ferramenta; não há memo | embrulhado: o `oncePerRun` guarda o que o Mastra resolve a cada passo | `@mastra/core` 1.83.0: o script `once.mjs` do estudo (`{"instructions":1,"tools":2,"model":2,"steps":3}`) | — | — |

**A medida do transplante.** Nenhuma parte trazida do repositório antigo.

**A dívida.** O `oncePerRun` (`H/spec/once.ts`) não tem entrada em `docs/reference/boundaries.md`;
ela entra no fechamento (delivery L19), com a versão do Mastra da prova. O jscpd vê pouco (7 clones no
gate do repositório, 0,10%, medido pelo estudo); a repetição desta etapa é de conceito, e o gate de
C26 não a alcança. Fica para a seção 11 da arquitetura, como informação.

## As decisões do firstmate

| # | Decisão reversível (delivery L6) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | A máquina do Projeto fica no harness e passa a partir pela mesma partida da conversa, em vez de ir para `Ag/app-builder/` | só o Construtor de apps a usa (`createMachines` só em `Ag/app-builder/runs/ports.ts`; `createE2bKit` e `createE2bApi` ali e em `H/machine/e2b.ts:76-77`), mas "a mesma harness" (2026-11-24) pede a mesma máquina, e mover agora para juntar depois seria duas migrações | mover a camada do Projeto para `Ag/app-builder/` |
| 2 | O núcleo comum da máquina é a partida e o mapa da sua falha, e não uma classe base | as duas máquinas só repetem isso (a abertura do kit é um repasse a `deps.kit` e fica em cada uma); a pausa, o "parar tudo", a fila e a leitura de arquivo são só da conversa, e o Git, a conferência e o `refreshing` só do Projeto (`H/machine/port.ts:17-75`, `conversation.ts:46-83`) | uma classe base, se um terceiro uso pedir |
| 3 | As três tabelas de conversa ficam separadas | o ganho é pequeno, e é migração | juntar numa tabela com o tipo |
| 4 | A forma do prompt da ficha espera o `A3` | o `A3` reescreve essa parte | colapsar antes |
| 5 | A prova de cada unidade são os pedidos gravados, e não um teste novo por tradutor | a etapa não muda comportamento; os pedidos são o que o modelo recebe (critério 1); onde o pedido não alcança (a memória, as listas, a partida que falha), um caso novo, escrito e verde antes da mudança | — |
| 6 | Quatro pull requests, e não um | cada grupo fecha uma área que o seu revisor lê inteira (a montagem, a conversa, a máquina, os lugares), a U7 pede um revisor atento à concorrência, e o G4 espera a decisão A; L9 é um "should", e 1 270 linhas caberiam num só | juntar os grupos num pull request |

## U1 A ficha sem dependência da montagem

**Base e modelo.** `main` depois do fechamento da etapa 3. Sonnet: tirar código morto e mover tipos.

### As linhas da tabela

Linhas 1 e 2. Ler na base: `H/spec/mount.ts:171-195` (`mountAgent`, o `memory ?? threads` da linha
177); `H/spec/factories.ts:102-145` (`controllerOf`, a guarda `Object.hasOwn` da linha 125, que filtra
as chaves do próprio `BUILTIN`); `H/spec/spec.ts:11` e `:104` (o import de `controllerOf` para tipar
`mode`, `own`, `subagents` e `workspace`); Referência: `NM/agent-controller-BhkzVgCi.js:8237`, `:8628-8635` e `:8733`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/spec/` | Muda `spec.ts`, `mount.ts`, `factories.ts` | os quatro agentes, pela ficha |

### Os contratos que a unidade cria

`ConversationSpec` declara os tipos de `mode`, `own`, `subagents` e `workspace` em `spec.ts`, e
`controllerOf` os importa de lá (o tipo antes da função, C26). `NEVER_ASKS` fica exportado:
`H/machine/workspace.ts:2` e `:32` o usam. O `memory` de
`AgentSpec` vai ao `new Agent` só quando a ficha o tem.

### As skills e a leitura

`mastra` (`node_modules/@mastra/core/dist/docs/`, a referência de `AgentController`);
`pstack:typescript-best-practices`.

### A ordem do trabalho

1. **Apagar a guarda morta.** Critérios: 1, 2.
   - **Arquivos:** `H/spec/factories.ts`.
   - **O que sai:** o `Object.hasOwn(BUILTIN, id)` de `factories.ts:125`.
   - **Mutações à mão:** nenhuma: a guarda não decide nada, porque o filtro corre sobre as chaves do
     próprio `BUILTIN`.
2. **A memória só no controller.** Critérios: 1, 4.
   - **Arquivos:** `H/spec/mount.ts`.
   - **Referência a seguir:** `NM/agent-controller-BhkzVgCi.js:8733` (`getCurrentAgent` propaga a
     memória do controller ao agente).
   - **O que entra:** `memory` só da ficha; sem ela, nenhum `memory` no `AgentConfig`.
   - **Testes:** o caso novo do critério 4, escrito e verde antes da mudança.
   - **Mutações à mão:** tirar a memória do controller em `mountAgent`; o critério 4 fica vermelho.
3. **Os tipos da ficha sem a função.** Critérios: 1, 2.
   - **O que sai:** o `import` de `controllerOf` em `spec.ts`.

### Como se prova

O critério 1 compara cada pedido; o 4, o segundo turno de cada agente. Hoje todos passam: a unidade prova que continuam passando sem as peças que saem.

### Parar se

Um caminho chamar o agente de uma ficha sem memória própria fora do controller (`agent.generate` ou
`agent.stream` direto): sem o controller, a memória não é propagada. Nesse caminho a memória fica na
ficha, e o builder escreve no relatório onde. O agente da versão do agente salvo
(`Ag/saved-agent/agent.ts:347`) já tem memória na ficha e não muda; o Construtor de apps não tem
(`Ag/app-builder/builder.ts:183` passa só `threads`), e o critério 4 o cobre.

## U2 A montagem num salto

**Base e modelo.** U1. Sonnet: colapsar funções de um chamador.

### As linhas da tabela

Linha 1. Ler na base: `H/spec/mount.ts:24-124` (`messagesOf`, `instructionsOf`, `modelOf`, `turnsOf`,
`toolsOfSpec`); `H/spec/spec.ts:39-48` (o `ModelSource`, cujo `switched` a rota de troca lê pela parte do
agente, `H/routes/changes.ts:54`, e que fica); `H/spec/factories.ts:56-92` (`agentDefaults`) e `:148-155` (`toolsOfRun`).
Referência: `M/mastracode/sdk/src/index.ts:1368-1867`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/spec/` | Muda `mount.ts`, `factories.ts` | os quatro agentes |

### Os contratos que a unidade cria

Nenhum. `agentOfSpec(spec, deps)`, `mountAgent(spec, deps)` e `controllerOf(input)` mantêm a
assinatura. Os `switch` sobre `Prompt`, `ModelSource`, `TurnSource` e `Approval` ficam, cada um com o
ramo `satisfies never` (C21), dentro da função que os usa.

### As skills e a leitura

`mastra`; `pstack:typescript-best-practices`.

### A ordem do trabalho

1. **Os tradutores entram no seu chamador.** Critérios: 1, 5.
   - **Arquivos:** `H/spec/mount.ts`, `H/spec/factories.ts`.
   - **O que sai:** `messagesOf`, `instructionsOf`, `modelOf`, `turnsOf`, `toolsOfSpec`,
     `agentDefaults` e `toolsOfRun` como funções soltas; cada uma vira um bloco nomeado por uma
     constante dentro de `agentOfSpec` ou `controllerOf`, quando o corpo passa de três linhas.
   - **Mutações à mão:** no `modelOf` dobrado, devolver o modelo da sessão para um `OF_RUN`; o critério
     1 fica vermelho no agente salvo.
   - **Pronto quando:** os pedidos gravados passam e `mount.ts` mais `factories.ts` têm menos linhas.

### Parar se

Um tradutor tiver um segundo chamador que o estudo não viu (um teste conta só se entra pela porta).
Ele fica, e o builder diz qual.

## G1 O ponto de conferência

Servidor: `npm run check:local`, os testes de `H/spec/` e `H/routes/` e os cinco testes de pedido; os
passos 6 e 7 da `conexus-build`.

## U3 A liberação pelo tipo

**Base e modelo.** G1 no `main`. Sonnet.

### As linhas da tabela

Linha 3. Ler na base: `H/spec/release.ts:44-66` (`releaseByMarks`, o `code` passado à mão);
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
código de cada tipo (C26); `releaseByMarks` deixa de receber `code`. Os códigos ficam os de hoje.

### A ordem do trabalho

1. **O código pelo tipo.** Critérios: 1, 6.
   - **O que sai:** o `code` de cada chamador; os três blocos `part.release` viram a mesma chamada.
   - **Mutações à mão:** trocar dois códigos na tabela; o critério 6 fica vermelho.

### Parar se

Um dos três blocos fizer algo além de liberar: o que sobra fica no agente.

## U4 A cabeça da conversa

**Base e modelo.** U3. Sonnet.

### As linhas da tabela

Linha 3. Ler na base: `Ag/agent-builder/routes.ts:37`, `Ag/assistant/routes.ts:102` e `:188`,
`Ag/saved-agent/conversation-routes.ts:60`, `Ag/app-builder/history.ts:12` e `:23` (as cópias de
`thread.title` com o vazio como `null`); `API/conversations.ts:65-70`, `API/assistant.ts:35`,
`API/construtor.ts:97-103`, `API/agents.ts:168-176` (os tipos de cabeça).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/spec/head.ts` | Cria `threadHead` | as rotas de lista dos quatro agentes |
| `API/conversations.ts` | O `ConversationSummary` vira a base; os outros três a usam | a web, `packages/app` |

### Os contratos que a unidade cria

```ts
// API/conversations.ts: a base é o ConversationSummary de hoje (linhas 65-70), a do Construtor de apps, sem updatedAt
export const ConversationSummary = z.object({ id: ConversationId, title: z.string().nullable(), createdAt: z.iso.datetime() })
// API/assistant.ts e API/construtor.ts: z.object({ ...ConversationSummary.shape, updatedAt }), que é a ordem de hoje
// API/agents.ts: a ordem de hoje é id, agentId, draft, title, ... (linhas 168-175): os campos da base vêm um a um,
// ConversationSummary.shape.id, .title, .createdAt, nas posições de hoje, para que o documento não mude nem na ordem (critério 3)
// H/spec/head.ts
export function threadHead(thread: StorageThreadType): { id: ConversationId; title: string | null; createdAt: string; updatedAt: string }
```

O nome `ConversationSummary` fica; o builder copia de cada esquema de hoje o tipo e a ordem de
cada campo. `ConversationId` é a marca de hoje, conferida onde a conversa é lida (C23). O JSON de cada rota fica
igual (critério 3). O builder confere no `main` os esquemas de hoje e copia deles o tipo de cada campo.

### As skills e a leitura

`mastra`; a forma de `.shape` em `node_modules/zod`.

### A ordem do trabalho

1. **Os casos de lista, antes.** Critérios: 7. Escritos e verdes na base.
2. **Um tipo no contrato.** Critérios: 3, 7.
   - **Testes:** o teste de declaração de `packages/app` (uma mudança de tipo no `hub-api` pode passar
     no `npm run check` e quebrar a declaração do SDK).
3. **Uma função no harness.** Critérios: 1, 7.
   - **O que sai:** as cinco cópias.

## U5 Criar a conversa e a rota sem transação

**Base e modelo.** U4. Sonnet.

### As linhas da tabela

Linha 3. Ler na base: `H/spec/open.ts`; os três fluxos de criação em `Ag/assistant/routes.ts`,
`Ag/agent-builder/routes.ts:45-69` e `Ag/saved-agent/conversation-routes.ts:100-140`; as funções que
abrem transação nos arquivos de rota: `admittedTo` (`Ag/agent-builder/routes.ts:28`,
`Ag/saved-agent/conversation-routes.ts:40`), `mayManage` (`conversation-routes.ts:45`,
`Ag/assistant/company-memory-routes.ts:27`), `namesOf` (`company-memory-routes.ts:43`) e
`projectNames` (`Ag/assistant/routes.ts:152`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/spec/open.ts` | Cria `createdThread` | os três agentes de conversa |
| as rotas dos três agentes | Muda: as funções saem para o módulo do agente | os testes de rota |

### Os contratos que a unidade cria

`createdThread(deps: { memory: MastraMemory; log: FailureLog }, input: { kind: MarkedKind; owner:
Owner; attemptId: AttemptId; marks: Record<string, string>; logged: Record<string, string | boolean> }):
Promise<StorageThreadType>`, onde `logged` leva os campos de log de hoje que existem antes da criação (`traceId`, `draft`,
`agentId`); o que só se sabe depois (o `made`, que decide se a linha sai, e o `inProject` do Assistente,
lido de `scopeOfThread`) fica no chamador, que escreve a linha como hoje quando for o caso, em
`H/spec/open.ts`, com o `ownThread` e a linha `*_CONVERSATION_CREATED` de cada tipo, numa tabela por
`MarkedKind` como a da U3. O builder confere no `main` os nomes de `Owner` e do id da tentativa, e usa
os de hoje. As funções movidas mantêm a assinatura.

### A ordem do trabalho

1. **`createdThread`.** Critérios: 1, 8.
2. **As transações saem das rotas.** Critérios: 8, 9.
   - **Mutações à mão:** deixar uma `database.read(` num arquivo de rota; a busca do critério 9 a acha.

### Parar se

O Construtor de apps, com a criação por índice (`Ag/app-builder/routes.ts:70-100`), não couber em
`createdThread` sem um ramo próprio: ele fica como está.

## G2 O ponto de conferência

Servidor e `packages/hub-api`: `npm run check:local`, o critério 3, os testes da U3 à U5 e o teste de
declaração de `packages/app`; os passos 6 e 7 da `conexus-build`.

## U6 A máquina da conversa montada num lugar

**Base e modelo.** G2 no `main`. Sonnet.

### As linhas da tabela

Linha 4. Ler na base: `Ag/assistant/assistant.ts:293-304`, `Ag/agent-builder/construtor.ts:257-270`,
`Ag/saved-agent/controller.ts:243-253` (a montagem `createConversationMachines` + `machinePart`);
`H/machine/part.ts:22-32`; `H/machine/spec.ts:8-27` (`MachineSpec`); `H/machine/conversation.ts:408-414`
(`createConversationMachines` e o tipo `Deps`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/machine/part.ts`, `public.ts` | Cria `conversationMachinesFor` | os três agentes de conversa |
| `Ag/assistant/`, `Ag/agent-builder/`, `Ag/saved-agent/` | Muda só a montagem | a raiz |

### Os contratos que a unidade cria

`conversationMachinesFor(spec: MachineSpec, deps: Parameters<typeof createConversationMachines>[1] &
{ lists: Pick<NetworkStore, 'onRemoved' | 'forget'> }, tuning?: MachineTuning): { machines:
ConversationMachines; part: ReturnType<typeof machinePart> }`, com o `tuning` que os testes passam hoje. O que difere entre os três (`otherTemplate`, `readMedia`, `marks`)
é o `MachineSpec` de cada agente, como hoje.

### A ordem do trabalho

1. **Uma montagem.** Critérios: 1, 10.
   - **Mutações à mão:** nenhuma que um teste de hoje pegue: os testes de máquina montam o seu próprio
     `MachineSpec`, e a montagem só repassa o de cada agente. A prova é o critério 1 (o pedido de cada
     agente leva a máquina dele) e o 10.

## U7 Uma partida de máquina

**Base e modelo.** U6. Opus: duas máquinas com promessas por sessão e falhas diferentes, uma partida
para as duas sem mudar o que cada uma devolve.

### As linhas da tabela

Linha 4. Ler na base: `H/machine/machines.ts:86-114` (`ensure`, a promessa zerada na falha nas
linhas 94-96) e `:129-147` (`boot`: `killStale`, `restoreFailure`, o `MACHINE_UNAVAILABLE` sem
`conversationId` na linha 141);
`H/machine/conversation.ts:158-165` (`ensure`), `:171-206` (`boot`: `found`, `killStale` ou `find`, o
`session.starting` das linhas 185-188, que a pausa espera, `ReattachFailed` como `FILE_GONE` nas linhas
190-191, a promessa zerada na 190); `H/machine/session.ts:28-50` (`restoreFailure`, `within`). Referência: Factory `M/mastracode/factory/src/workspace.ts:1829-1833`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/machine/start.ts` | Cria `startMachine`, `startRefused` | `machines.ts`, `conversation.ts` |
| `H/machine/machines.ts`, `conversation.ts` | Muda: o `boot` de cada uma chama a partida | `Ag/app-builder/runs/ports.ts`, U6 |

### Os contratos que a unidade cria

```ts
// H/machine/start.ts
/** Why a start failed, by which machine asked: the one owner of the cause's map (C21, C53). */
export type StartRefused =
  | { kind: 'RESTORE'; failure: Failure }            // GIT_RESTORE_NEEDED, só a máquina do Projeto
  | { kind: 'GONE'; cause: unknown }                 // ReattachFailed, só a da conversa: FILE_GONE
  | { kind: 'UNAVAILABLE'; reason: 'START' | 'NETWORK'; cause: unknown }
export function startRefused(cause: unknown, machine: 'PROJECT' | 'CONVERSATION'): StartRefused
/** Awaits the caller's `starting` within `startMs`, maps a failure once, logs MACHINE_STARTED or MACHINE_UNAVAILABLE with each machine's fields of today, and throws the `Failure` of its refusal; each caller still clears its own `session.ready` on a failure, as today. */
export function startMachine(input: {
  machine: 'PROJECT' | 'CONVERSATION'
  conversationId: ConversationId
  kit: Kit
  /** The list then `sandbox.start`, made by the caller, which keeps it (the conversation stores it as `session.starting`, which the pause awaits). */
  starting: Promise<unknown>
  startMs: number
  log: FailureLog
}): Promise<Kit>
```

O `neverAsks` do workspace fica em cada máquina: é `false` no Projeto e `true` nas três conversas, e
não varia por agente. Cada máquina continua lançando
o `Failure` de hoje; a união só tira o mapa de dois lugares. A promessa da sessão, a fila, o
`refreshing`, a pausa e o `stopAll` ficam onde estão (decisão 2 do firstmate).

### As skills e a leitura

`mastra`; a linha `@mastra/e2b` de `docs/reference/stack.md` ("`running` precedes `onStart`: gate the
first tool on `start()`"); `node_modules/e2b/dist/index.d.ts`.

### A ordem do trabalho

1. **O caso novo, antes.** Critérios: 11. Escrito e verde na base.
2. **A partida.** Critérios: 1, 11, 12, 13.
   - **Mutações à mão:** devolver `UNAVAILABLE` no lugar de `RESTORE`; o caso da linha 266 de
     `machine.test.ts` fica vermelho. Não zerar a promessa na falha da conversa; o caso novo de
     `conversation-lane.test.ts` fica vermelho. Não guardar `session.starting`; o caso da linha 151 fica
     vermelho.

### Parar se

As duas partidas diferirem num ponto que nenhum teste cobre (a ordem de `killStale` e `find`, as fases): o builder escreve o caso num teste antes de juntar, e para
se o teste mostrar que as duas não cabem numa partida.

## G3 O ponto de conferência

Servidor: `npm run check:local`, os testes de `H/machine/` e das máquinas dos quatro agentes, o
`machine-e2b.test.ts` com a chave da instalação; os passos 6 e 7 da `conexus-build`.

## U8 As pastas soltas

**Base e modelo.** G3 no `main` e a decisão A. Sonnet, com o codemod do repositório
(`scripts/codemod-server.ts`), uma pasta por passo.

### As linhas da tabela

Linha 6. Pela opção (a), à espera da palavra do fundador: `H/copy-clock/` vai para
`H/mastra/copy-clock/`, com os seus arquivos; `H/network/` (menos a ferramenta) e `H/machine/network.ts`
vão para `H/machine/network/`;
`H/network/network-tool.ts` vai para `H/tools/network-tool.ts`. Na (b), a unidade sai e a U10 corrige a
árvore. Na (c), a unidade espera a mudança de método.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/copy-clock/`, `H/network/`, `H/machine/network.ts` | Apaga, pelo codemod | `S/conversations-of.ts`, `S/main.ts`, `H/machine/` (a ferramenta em `machine-tools.ts:4`), `Ag/app-builder/builder.ts:9`, `Ag/agent-builder/construtor.ts:23` |
| `H/mastra/`, `H/machine/network/`, `H/tools/` | Cria | os mesmos |
| `scripts/record-tools.ts` | Muda o import (linha 10) | a gravação das ferramentas |
| `scripts/rerun-never.json` | Muda os caminhos das seis entradas de `H/network/` | `npm run rerun-list` |

### A ordem do trabalho

1. **Mover, pasta por pasta.** Critérios: 1, 2, 14.
   - **Pronto quando:** `git diff -M --stat` mostra só renomeações, imports e caminhos.

## U9 As peças de um agente só

**Base e modelo.** U8. Sonnet, codemod.

### As linhas da tabela

Linha 6. `H/tools/company/search.ts` (`companyReadSearch`) e `projectsOf`, de
`H/tools/company/overview.ts`, têm só o Assistente como usuário (`Ag/assistant/assistant.ts:52`, `:55`).
Ficam no harness `overviewTool` (usado por `H/tools/company/factory.ts:18`) e `H/turn/turn-line.ts`
(usado por `H/turn/end.ts:22-23`): movê-los criaria um import de produção do harness para um agente.
`search.ts` usa `connectorAccess` e `readTarget`, que `H/tools/public.ts` não exporta hoje: a porta
passa a exportá-los, e o raio inclui `H/tools/public.ts`.

### A ordem do trabalho

1. **Mover.** Critérios: 1, 2.

### Parar se

`projectsOf` dividir código com `overviewTool`: ele fica, e o relatório diz o quê.

## U10 A raiz só monta

**Base e modelo.** U9. Sonnet.

### As linhas da tabela

Linha 6. Ler na base: `S/conversations-of.ts` (`builderDoorOf`, `builderDataOf`, `builderDoorsOf`,
`handOffsOf`, `toolCallsOf`, `appDataOf`); `docs/explanation/harness.md:18-26` (a árvore, sem
`network/` na linha 21) e `:43` ("All four are built by `mountAgent`", que vale para os controllers,
mas não para o agente da versão, feito por `agentOfSpec` em `Ag/saved-agent/agent.ts:308`).

### A ordem do trabalho

1. **Os adaptadores no agente.** Critérios: 1, 15.
2. **A explicação.** Critérios: 15. A árvore como ficou depois da U8 e a frase dos controllers; os
   outros documentos que citam `harness/network/` ou `harness/copy-clock/` (a busca no `docs/` os
   lista) ganham o caminho novo.

## U11 A moldura da sala e o seletor

**Base e modelo.** G1 no `main` (nenhum arquivo em comum com o servidor). Sonnet.

### As linhas da tabela

Linha 5. Ler na base: a moldura (`RoomContext`, `Beside`, `fileSide`, `widen`) em
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

1. **A moldura.** Critérios: 16.
2. **O seletor.** Critérios: 16.

### Como se prova

O critério 16 pelos testes nomeados e pelo QA (testing T25), que abre cada sala e cada seletor contra
a captura de antes.

## G4 O ponto de conferência

Servidor e web: `npm run check:local`, `npm run deps`, `npm run rerun-list`, os testes das pastas
movidas, os testes de web da U11 e `W/routes/__root.test.tsx`; o QA das três salas; os passos 6 e 7
da `conexus-build`.
