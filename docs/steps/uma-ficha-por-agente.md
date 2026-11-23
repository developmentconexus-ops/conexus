# Uma ficha por agente

Trilho: harness

Trilha Agentes e Apps, a etapa 1 do harness: "Uma ficha por agente". As palavras do fundador ao
estudo, em 2026-11-22: "A: Sua recomendacao", "B: Okay" e "C: Okay". Em 2026-11-23 ele pôs o
harness em paralelo com a Prévia e o Lago 1: "Não tem problema ter as coisas andando em paralelo.
Eu quero isso. [...] eu quero as três." A marca `Trilho: harness` é a que a verificação
`second-card` lê para este trilho próprio (`scripts/cli.ts`, `trackOf`; delivery L5), e o cartão
entra em `docs/steps/` ao lado do da Prévia, sem esperar o fechamento dela. Lido em `main` `b5d93116`.
O estudo fica fora do repositório (delivery L21): ele leu em `2fc19ec5`, e entre os dois só mudou
`docs/how-to/aws-conta-de-laboratorio.md`; cada linha de `main` citada aqui foi relida em
`b5d93116`. As referências: `@mastra/core` 1.83.0 instalado (`node_modules/@mastra/core/dist/`, `NM/`
abaixo) e o código do Mastra na tag `@mastra/core@1.83.0`, commit `d60ba71b`: o núcleo
(`packages/core/src/`, `C/`), o Mastra Code (`mastracode/sdk/src/`, `S/`) e a Factory
(`mastracode/factory/src/`, `F/`). `B/` é `apps/server/src/builder/`.

## A página do fundador

**No fim desta etapa** os quatro agentes, o Builder, o Assistente, o Construtor e o agente que alguém
publicou, nascem cada um de uma **ficha** e de **uma montagem só**. A ficha diz o que é de cada
agente: que texto ele lê e em que ordem, que ferramentas recebe, que memória tem, de quem é o modelo,
como toma a vez na fila de contas, quem espera aprovação, como termina um turno. A montagem é uma
função só, a mesma para os quatro, e faz o resto do mesmo jeito. Para quem usa, nada muda: as mesmas
telas, as mesmas respostas, o mesmo custo. Para o modelo também: o pedido que cada agente manda ao
modelo fica igual, byte a byte, antes e depois de cada passo. Um teste grava esse pedido antes de
qualquer mudança e confere depois de cada uma.

**O roteiro de uso.** Na instalação da nuvem, depois da publicação do último pull request.

1. Num Projeto de teste, peça ao Builder uma mudança pequena no app. Ele constrói, confere e a
   Prévia mostra a versão nova, como hoje.
2. Em Início, pergunte ao Assistente algo sobre os dados de uma ligação. Ele lê e responde, como
   hoje.
3. Em Agentes, abra o Construtor, peça um agente pequeno e use **Testar**. O agente de teste
   responde, como hoje.
4. Publique esse agente e converse com ele. Ele responde; se ele tem uma escrita em "Pergunta
   antes", o cartão de aprovação aparece, como hoje.
5. Na quinta seguinte, o build semanal reconstrói os dois apps de teste com o Builder desta etapa.
   Você julga como toda quinta.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. No meio: nada. Cada pull
request muda um agente só e é publicado sozinho; o do Builder entra antes do build de uma quinta,
para essa quinta pegar qualquer diferença. No fim: faz o roteiro e diz o que viu. Nenhum texto de
tela muda, então não há texto para aprovar.

**O que muda por dentro, em palavras simples.**

| O quê | Hoje | No fim |
| --- | --- | --- |
| Criar um agente novo (o agente dentro do app, o segundo olhar do `A4`) | copiar um dos que existem: a pasta do Construtor tem 1.228 linhas | preencher uma ficha nova |
| A ordem das instruções | quatro ordens escritas em quatro arquivos | quatro ordens escritas como dado, uma em cada ficha, lado a lado. Juntá-las numa só muda o que o modelo lê, então fica para o `A3` (a sua decisão C) |
| Quem espera aprovação | o agente publicado copia cada ferramenta à mão para ela não perguntar | um campo da ficha diz o regime; a montagem aplica |
| A vez na fila de contas | três versões do mesmo processador | um processador; a trava do Projeto do Builder vira um passo com nome |
| O juiz de fim de turno | escrito à mão dentro do Builder | um campo da ficha. No `A1` a conferência nova entra nele; no `A3` ele chega aos outros três |
| Soltar as conversas de quem sai | três cópias do mesmo código | uma função |
| Trocar o modelo de uma conversa | três rotas com a mesma espinha | um molde |

**Fica de fora.**

- **A etapa 2, "Uma sala e os nomes certos".** As pastas com nomes que dizem o que são, a sala de
  conversa sem os ganchos de cada agente, e os nomes que você vê ("Construtor de apps" e
  "Construtor de agentes"), com protótipo antes. Entra depois do `A1` e antes do `A3` (a sua
  decisão A). Nenhum id guardado muda em nenhuma das duas: o id de cada agente e as marcas das
  conversas estão gravados nas conversas de hoje.
- **O que muda o comportamento dos agentes** fica no `A3`, cada um medido (a sua decisão C): o modo
  de plano que trava a escrita, o juiz nos quatro agentes, uma ordem só de instruções, a lista de
  tarefas no Construtor. Com a ficha pronta, o `A3` vira preencher fichas e medir.
- **O estado que muda a cada turno** (as ligações, as cópias, a data) passando para fora do texto
  das instruções. Mexe no texto que a etapa 3 do lago vai trocar; espera essa etapa.
- **Os agentes lerem o dado só pelo contrato de acesso.** É o caminho que a trilha Dados está
  mudando; entra com ela.
- **As pendências guardadas para o próximo cartão.** As que tocam os agentes esperam, cada uma com o
  seu motivo: o bloco por modelo da OpenAI nos outros agentes (issue 1017) e as falhas de leitura
  como erro da ferramenta (1016) mudam o que o modelo lê, então vão com o `A3`; o Testar do
  Construtor na assinatura do ChatGPT (1018) pede uma gravação da assinatura que esta etapa não
  toca, porque o Testar manda o mesmo pedido de antes; quem anota no caderno pelo Builder (814)
  espera a etapa de papéis ou a sua palavra; o nome do dublê de máquina dos testes (808) vai com os
  nomes da etapa 2, ou antes, se uma unidade mexer no arquivo dele; as gravações do Mastra que
  ficaram em versões antigas (1175) não são lidas por nenhuma unidade; o "hoje" do turno no fuso da
  pessoa (1115) muda o texto das instruções, então vai com o `A3`. Esta etapa leva uma: o item 5
  da issue 753, o Assistente que lê as ligações antes de recusar uma execução sem conversa, porque a
  U5 reescreve exatamente esse código; a recusa passa a vir antes da leitura. Nenhuma outra
  pendência toca os arquivos desta etapa.
- **O cartão do `A1`** passa a vir depois desta etapa (a sua decisão A). Ele relê as linhas que esta
  etapa troca; a lista está no fim deste cartão.

**As decisões suas nesta etapa.** Nenhuma nova. As três do estudo foram respondidas em 2026-11-22, e
as suas palavras vão para o arquivo de aprovação deste cartão quando você aprovar a página.

- **A. A ordem das duas etapas.** (a) esta etapa logo depois da Prévia, antes do `A1`, e a etapa 2
  depois do `A1` e antes do `A3`; (b) as duas antes do `A1`; (c) só esta agora e a etapa 2 depois
  do `A4`. **A sua resposta: a** ("Sua recomendacao"). Em 2026-11-23 esta etapa passou a correr em
  paralelo com a Prévia, no trilho próprio do harness; o resto da ordem fica: `A1`, etapa 2, `A2`,
  `A3`.
- **B. Os nomes que a pessoa vê.** (a) na etapa 2, com protótipo antes, "Construtor de apps" e
  "Construtor de agentes", e no código `app-builder` e `agent-builder`; (b) como estava, depois do
  `A4`. **A sua resposta: a** ("Okay"). Esta etapa não muda nenhum nome.
- **C. O que muda o comportamento.** (a) fica no `A3`, medido, e esta etapa só junta a estrutura;
  (b) entra já nesta etapa. **A sua resposta: a** ("Okay"). Por isso a prova desta etapa pode ser
  byte a byte: se ela também mudasse o texto, uma piora do Builder na quinta não diria se veio da
  estrutura ou do texto.

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 | U1 | A rede: o retrato do pedido ao modelo de cada agente, por cenário, gravado em `main` antes de qualquer mudança e conferido por `node:test` | `B/conversation/`, `B/assistant/`, `B/construtor/`, `B/agents/`, `B/controller-kit/` (só testes e retratos), `apps/server/src/platform/test-anthropic-body.ts` | testing | a aprovação |
| G1 | U2 | Subtrair: um processador de turno, uma função de soltar conversas, `skillOf` e o modo `conversa` no kit | `B/controller-kit/`, `B/conversation/`, `B/assistant/`, `B/construtor/`, `B/agents/`, `B/connectors/` (um comentário) | testing | U1 |
| G2 | U3 | A ficha e a montagem, com o Construtor passando por elas | `B/controller-kit/`, `B/construtor/` | testing | U2 |
| G3 | U4 | O agente salvo na ficha: o agente da conversa e o agente de cada versão; o regime "a escrita pergunta" | `B/agents/`, `B/controller-kit/` | testing | G2 no ar |
| G4 | U5 | O Assistente na ficha; a automação segue sendo ele sem ninguém olhando | `B/assistant/`, `B/controller-kit/` | testing | G3 no ar |
| G5 | U6 | O Builder na ficha, com a trava do Projeto como o passo `take` dele | `B/conversation/`, `B/controller-kit/` | testing | G4 no ar |
| G6 | U7 | O molde da troca de modelo das conversas | `B/controller-kit/`, `B/conversation/`, `B/assistant/`, `B/construtor/` | security | G5 no ar |
| G7 | U8 | O fechamento: as explicações, as entradas de `boundaries.md`, a página da trilha, o roteiro, as issues, o cartão apagado e a linha de uso | `docs/` | delivery | o uso |

Um pull request por grupo, um commit por unidade (delivery L9). G1 junta a rede e a subtração: a U2
mexe nos quatro agentes ao mesmo tempo, e o commit da U1 antes dela é o que prova que a U2 não mudou
nenhum pedido. De G2 a G5, cada pull request muda um agente só: se algo sair errado no ar, reverte-se
aquele pull request e só aquele agente volta. Por isso cada grupo espera o anterior publicado e
conferido pelo firstmate no ar. Nenhuma unidade corre em paralelo: todas mudam `B/controller-kit/`.
G5 entra no `main` e no ar antes do build de uma quinta (o retrato pega o que um teste vê; a quinta
pega o resto). G7 é o último pull request, depois do uso (delivery L17, L19).

Nenhuma unidade muda `apps/server/src/main.ts`, `apps/server/src/conversations-of.ts`,
`packages/hub-api/`, `apps/web/`, `apps/server/migrations/` nem a lista de migração do contrato
(`.dependency-cruiser-migration.cjs`): as assinaturas `createBuilder`, `createAssistant`,
`createConstrutor` e `createAgentConversations` e as partes que elas devolvem ficam como são. É o que
o estudo pede para a fiação, que a trilha Dados também muda (seção 6.2 dele).

**Orçamento de código alterado.** U1: só testes, retratos e um dublê. U2: cerca de 250 linhas. U3:
450 (a ficha e a montagem 300, o Construtor 150). U4: 400. U5: 350. U6: 250. U7: 150. U8: só
documento. Total da etapa: cerca de 1.850 linhas, dentro das 4.000 de delivery L2; o estudo estimou
até 2.600 por leitura, sem protótipo. Quase tudo é apagar e juntar.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Para cada cenário da tabela da U1, o corpo de cada chamada que o agente faz ao modelo no turno é igual ao seu retrato em `B/<agente>/requests/<cenário>.snapshot`, gravado no commit da U1 a partir do `main` sem mudança. Rodado duas vezes seguidas sem `--test-update-snapshots`, passa as duas. Um retrato que falta faz o teste falhar, nunca passar | `B/conversation/request.test.ts`, `B/assistant/request.test.ts`, `B/construtor/request.test.ts`, `B/agents/request.test.ts`, um caso por cenário | must |
| 2 | U1 | O retrato pega a mudança de um byte: um espaço a mais no meio de `B/conversation/prompt/conexus.md` (o texto é aparado nas pontas), duas ferramentas trocadas de lugar num `tools` e a marca de cache tirada de `fixedSystem` deixam vermelhos os retratos de quem os lê, e só os deles | à mão, no pull request de G1, com a saída de cada mutação | must |
| 3 | U1 | O retrato guarda o corpo inteiro, sem filtro: as mensagens de sistema e as suas marcas de cache, as ferramentas na ordem com descrição e esquema, as mensagens da conversa, o modelo, o raciocínio e o resto que o corpo leva. Só se trocam, por marcas numeradas, os uuids, a data de hoje com o dia da semana e os ids das chamadas de ferramenta que o dublê dá | `B/controller-kit/test-request.ts`, `requestOf`, e o caso "um valor que muda fica vermelho" em `B/controller-kit/request.test.ts` | must |
| 4 | U2–U7 | Em cada commit de U2 a U7, nenhum retrato muda: `git diff <commit da U1> <commit> -- 'apps/server/src/builder/**/requests/*.snapshot'` sai vazio, e nenhum teste que já existia em `main` muda, fora os nomeados na unidade | os testes do critério 1 no CI de cada pull request; o diff, lido na revisão de cada unidade | must |
| 5 | U2 | Um processador de turno só: as duas conversas ao mesmo tempo num Projeto seguem com a segunda terminando `RUN_BUSY` com o nome de quem trabalha, sem chamar o modelo; o Testar do Construtor segue tomando a vez da pessoa; o resultado de uma conversa apagada no meio segue sem ser salvo. `B/conversation/turn-of.ts` e `B/agents/agent.ts` não declaram mais `processInput` | `B/conversation/conversation-turns.test.ts`, o caso das duas conversas; `B/construtor/construtor.test.ts`, os casos do Testar; os testes de hoje de `sessionTurns`, sem mudar | must |
| 6 | U2 | Soltar as conversas: tirar uma pessoa, apagar um Projeto ou remover a empresa apaga as conversas do Assistente, do Construtor e dos agentes como hoje, na mesma ordem (as automações antes das conversas do Assistente; os agentes antes das conversas), e cada tipo escreve a sua linha de hoje (`ASSISTANT_CONVERSATIONS_RELEASED`, `CONSTRUTOR_CONVERSATIONS_RELEASED`, `AGENT_CONVERSATIONS_RELEASED`) com a contagem; apagar um agente segue varrendo as conversas dele com `AGENT_CONVERSATIONS_SWEPT` | `B/construtor/routes.test.ts`, "a remoção"; `B/agents/release.test.ts`, os casos do Projeto, da empresa e "as conversas"; `B/automations/release.test.ts`; todos sem mudar; e as linhas de log com a contagem em `B/controller-kit/lines.test.ts`, novo na U1 | must |
| 7 | U2 | Um dono de cada fato: `skillOf` mora em `B/controller-kit/skills.ts` e `B/assistant/` não importa mais nada de `B/conversation/public.ts` para skills; `'conversa'` aparece uma vez fora dos testes, em `CONVERSATION_MODE` do kit | `npm run deps`; `grep -rn "'conversa'" apps/server/src/builder --include=*.ts`, fora dos testes, dá uma linha | should |
| 8 | U3 | O Construtor nasce da ficha: `B/construtor/construtor.ts` não chama `new Agent(`, `controllerOf(`, `agentDefaults(` nem `sessionTurns(`; os retratos dele (critério 1) e os testes dele de hoje passam sem mudar | os testes de `B/construtor/`; o `grep`, lido na revisão | must |
| 9 | U3 | A montagem só põe a chave que a ficha preenche: uma ficha sem `skills`, `signals`, `scopes`, `knowledge` ou `workspace` (o Construtor não tem `workspace`) dá um `Agent` e um controlador sem essa chave, como o `controllerOf` já faz com `workspace` (o agente de código leva sempre `workspace: undefined`, critério 13) | `B/controller-kit/spec.test.ts`, um caso por campo opcional | must |
| 10 | U4 | O agente salvo nasce da ficha, nos dois caminhos: a conversa (o agente que delega à versão) e o agente de cada versão, que o Testar roda sozinho. `neverAsking` sai de `B/agents/agent.ts`. Com a ficha "a escrita pergunta", toda ferramenta sem regra própria em função roda sem perguntar, e a escrita em "Pergunta antes" para no cartão sem enviar | `B/agents/approval.test.ts`, "a escrita espera, o resto não", sem mudar; `B/controller-kit/spec.test.ts`, o caso do regime, com ferramentas feitas por `createTool` (uma sem regra ganha a que nunca pergunta numa cópia; uma com regra em função fica com a sua; o objeto de origem não muda) | must |
| 11 | U5 | O Assistente nasce da ficha: os retratos dele (Início, Projeto, automação, o ajudante `pesquisar` e o modelo Luna) e os testes dele de hoje passam sem mudar; `assistantInstructions` sai de `B/assistant/instructions.ts` | os testes de `B/assistant/` e de `B/automations/` | must |
| 12 | U6 | O Builder nasce da ficha, com `createCodingAgent`: os retratos dele (o primeiro turno, e o turno em que o juiz reprova uma vez e o modelo recebe o motivo) e `B/conversation/prompt.test.ts` passam sem mudar | os testes de `B/conversation/` | must |
| 13 | U6 | O Builder não ganha máquina própria: a montagem passa `workspace: undefined` explícito a `createCodingAgent`, e o agente que ela devolve não tem workspace (`agent.getWorkspace()` sem nenhum). Uma ficha sem a chave daria a máquina local no servidor do Hub (`NM/coding-agent/index.js:221`) | `B/controller-kit/spec.test.ts`, o caso do agente de código | must |
| 14 | U6 | Um lugar chama o construtor do agente e um lugar monta o controlador: `grep -rn "new Agent(\|createCodingAgent(\|controllerOf(" apps/server/src --include=*.ts`, fora dos testes, só acha `B/controller-kit/` | o `grep`, lido na revisão do pull request de G5 | must |
| 15 | U6 | O build semanal da quinta seguinte ao merge de G5 roda com o Builder desta etapa | o registro do build daquela quinta, com o commit | should |
| 16 | U7 | A troca de modelo do Builder, do Assistente e do Construtor passa pelo molde: o mesmo `200 { model, effort }`, a mesma recusa da conversa de outra pessoa (`CONVERSATION_NOT_FOUND`), do esforço que o modelo não tem (`EFFORT_UNSUPPORTED`) e do modelo sem conta (como hoje), e a mesma linha de log de cada um (`CONVERSATION_MODEL_SET`, `ASSISTANT_MODEL_SET`, `CONSTRUTOR_MODEL_SET`, com os mesmos campos) | `B/conversation/conversations.test.ts`, `B/assistant/routes.test.ts` e `B/construtor/routes.test.ts`, os casos de `…/model`, sem mudar; as três linhas de log com os campos em `B/controller-kit/lines.test.ts`, novo na U1 | must |
| 17 | todas | Nada que a pessoa usa muda de contrato: `git diff <base> <fim> -- packages/hub-api apps/web apps/server/migrations apps/server/database-grants.sql .dependency-cruiser-migration.cjs` sai vazio no fim de cada grupo; um arquivo novo do kit não importa nada do dado (`npm run deps` verde) | `npm run check` em cada pull request; o diff, lido na revisão | must |
| 18 | U8 | A explicação do harness diz a ficha e a montagem, com as quatro ordens de instruções numa tabela; `boundaries.md` ganha as entradas das linhas 8 e 9 da tabela de referência e a da linha 10 nomeia o novo lugar da regra; a página da trilha e o roteiro dizem a ordem nova | `npm run docs`; a leitura do diff | must |

## A matriz de estados

Nenhuma tela muda nesta etapa, nem um texto que a pessoa lê. Os estados de cada tela de conversa são
os de hoje, e o retrato prova que o modelo recebe o mesmo.

| Campo de contrato (a ficha, `B/controller-kit/spec.ts`) | Quem escreve | Quem lê |
| --- | --- | --- |
| `kind`, `name`, `id`, `description` | a ficha de cada agente (o id do controlador vem de `CONTROLLER_KINDS`, nunca da ficha) | `agentOfSpec`, `mountAgent` |
| `base` (`AGENT`, `CODING_AGENT`) | a ficha | `agentOfSpec`: o único lugar que chama o construtor |
| `prompt` (`MESSAGES` com as suas partes, `ONE_STRING`, `DELEGATED`) | a ficha | `agentOfSpec`, que o transforma nas `instructions` do agente |
| `model` (`SESSION`, `OF_RUN`) | a ficha | `agentOfSpec` |
| `tools`, `skills`, `signals`, `scopes`, `knowledge`, `memory`, `judge`, `processors` | a ficha | `agentOfSpec` |
| `approval` (`NOTHING_ASKS`, `THE_WRITE_ASKS`) | a ficha | `agentOfSpec` (a regra das ferramentas) e `mountAgent` (o `yolo` da sessão) |
| `turn` (`SESSION`, `RUN`) | a ficha | `agentOfSpec` (o processador) e `mountAgent` (`watch`) |
| `mode`, `own`, `subagents`, `workspace`, `threads` | a ficha de uma conversa | `mountAgent` |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Soltar as conversas de um tipo (`releaseByMarks`: o `deleteSession` e o `deleteThread` do Mastra), que muda de lugar | a segunda acha menos threads, ou nenhuma, e não apaga nada a mais (`B/controller-kit/release.ts:9-13`, como hoje) | uma falha depois de apagar uma sessão deixa a thread, que a próxima remoção acha de novo (como hoje) | o banco do Mastra fora: a remoção falha com o erro, e a remoção do Hub o registra como hoje | o código do tipo, com a contagem | 6 |
| A trava do Projeto (`Runs.take`), agora o `take` da ficha do Builder | uma toma; a outra termina `RUN_BUSY:<pessoa>` antes de chamar o modelo (code C65, como hoje) | o run interrompido depois de tomar solta a trava pelo `onEnd` do run (como hoje) | o banco do Hub fora: o turno falha antes de qualquer chamada ao modelo (como hoje) | o evento `data-conexus-failure` com `RUN_BUSY` e a pessoa | 5 |
| Trocar o modelo (`changeModel`: o `createSession` e o `session.model.switch` do Mastra, `B/controller-kit/open.ts:95-117`), agora pelo molde | as duas trocam; a última vale (como hoje) | a admissão recusa antes de qualquer gravação; um `switch` que falha deixa o modelo de antes (como hoje) | o banco do Mastra fora: a rota responde a falha de hoje, e nada muda na conversa | a linha de log de cada agente, com os campos de hoje | 16 |
| Regravar um retrato (`node --test --test-update-snapshots`) | — (um arquivo por cenário) | — | — | o diff do retrato no pull request | 1, 4 |

Nenhuma tabela, coluna ou migração nova. Nenhuma rota nova.

## A tabela de referência

As citações de `main` em `b5d93116`; as de `NM/` no `@mastra/core` 1.83.0 instalado; as de `C/`,
`S/` e `F/` no commit `d60ba71b`. As 25 linhas são as do estudo, com a unidade de cada uma. As linhas
8, 9 e 10 são remendo já decidido: a 10 já tem entrada em `boundaries.md`; a 8 e a 9 ganham a sua no
fechamento (U8, delivery L19).

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1. A definição de um agente (a ficha e uma montagem) | U3 (o tipo e a montagem), U4, U5, U6 (cada agente) | quatro montagens: `B/conversation/builder.ts:134-219`, `B/assistant/assistant.ts:177-351`, `B/construtor/construtor.ts:186-337`, `B/agents/controller.ts:199-280` com `B/agents/agent.ts:321-366` | Factory `F/factory.ts:1680-1689`; Mastra Code `S/index.ts:1368`. Unidade: um produto de agente sobre uma base comum (sim). Pessoa: quem conversa, numa organização (sim). Mesma situação | a Factory não escreve um agente: chama `prepareAgentControllerMount({ controllerId, modes: false, subagents: [], plansDir, … })` e passa o que é dela por opção; o agente base nasce uma vez, com instruções, modelo e ferramentas como função do pedido | embrulhado: o nosso acrescenta a ficha de cada agente e a função que a monta sobre `AgentConfig` e `controllerOf` | não precisa | firstmate; desfaz-se revertendo o pull request de cada agente | `B/controller-kit/spec.ts`, `B/controller-kit/mount.ts` |
| 2. O construtor do agente | U3 (`new Agent`), U6 (`createCodingAgent`) | `createCodingAgent` em `builder.ts:166`; `new Agent` em `assistant.ts:219`, `construtor.ts:232`, `agents/controller.ts:143`, `agents/agent.ts:341` | `NM/coding-agent/index.js:219-241`; `NM/docs/references/reference-coding-agent-create-coding-agent.md:9-13`; `S/index.ts:1368-1376`. Mesma situação só para o Builder | `createCodingAgent` é `new Agent` com padrões: a máquina local quando a chave `workspace` falta, o sinal das tarefas quando há memória, os processadores de erro e de saída | nativo | — | firstmate: um só lugar chama o construtor; o Builder segue em `createCodingAgent`, com `workspace: undefined` explícito como o Mastra Code | em `B/controller-kit/mount.ts` |
| 3. Os modos e a lista fechada | U2 (a constante), U3 a U6 (o campo `mode`) | quatro constantes `'conversa'` (`builder.ts:40`, `assistant.ts:82`, `construtor.ts:59`, `agents/controller.ts:42`); três listas (`B/conversation/permissions.ts:64-67`, `assistant.ts:96-112`, `construtor.ts:69-77`) | `NM/agent-controller/types.d.ts:67-85` (o campo nas linhas 41-96); Mastra Code `S/agents/tool-availability.ts:140-176`. Mesma situação | uma lista escrita à mão por modo; o controlador esconde e recusa o que está fora | nativo | — | não precisa | — |
| 4. O texto de cada modo | fica de fora: é do `A3` | não existe | `C/agent-controller/agent-controller.ts:1868-1881`, `:2267-2278`; `S/agents/prompts/index.ts:165-167`, `:237` | `mode.instructions` achata as instruções do agente numa string; o Mastra Code escreve o texto do modo no próprio construtor de prompt | embrulhado, quando vier | o teste da seção 2.2 do estudo, não rodado | firstmate, no `A3` | — |
| 5. A ordem das instruções | U3 a U6 guardam a ordem de cada um como dado (`Prompt`); juntar é do `A3` | quatro ordens: `B/conversation/instructions.ts:29-70` (uma string, `:68`), `B/assistant/instructions.ts:69-74`, `construtor.ts:238-242`, `agents/agent.ts:349-357` | Mastra Code `S/agents/prompts/index.ts:232-238`. Mesma situação | uma lista de seções em ordem fixa: base, instruções do anfitrião, arquivos do projeto, bloco do modelo, bloco do modo | embrulhado: o nosso acrescenta o bloco de quem fala e a marca de cache | — | firstmate; unificar muda o que o modelo recebe, por isso vai ao `A3` (decisão C) | — |
| 6. O estado que muda (ligações, cópias, data) | fica de fora: espera a etapa 3 do lago | no texto (`B/conversation/instructions.ts:56-67`); `blockOf` nos outros (`B/controller-kit/speakers.ts:82-103`) | Factory `F/session/environment-state-processor.ts:129-160`, `F/factory.ts:1877-1883`; `NM/docs/references/docs-signals-state-signals.md:9-17` | um processador com `computeStateSignal` devolve o estado com um `cacheKey` | nativo | — | espera a etapa 3 do lago (estudo, seção 6.2) | — |
| 7. A lista de tarefas no contexto | U5 (o campo `signals` do Assistente); U6 (o Builder a ganha de `createCodingAgent`); no Construtor, o `A3` | `assistant.ts:256`; o Construtor oferece as ferramentas de tarefa (`construtor.ts:76`) sem o provedor | Mastra Code `S/index.ts:1494-1501`; `NM/docs/references/docs-signals-signal-providers.md:221-229` | o provedor junta as ferramentas de tarefa e o processador que mantém a lista no contexto | nativo | — | firstmate: nesta etapa cada agente o tem como hoje; no Construtor muda o pedido e vai com a medição dele no `A3` | — |
| 8. O turno na fila de contas de modelo | U2 (`turnProcessor`), U3 a U6 (o campo `turn`) | três versões: `B/controller-kit/turns.ts:23-94`, `B/conversation/turn-of.ts:37-73`, `agents/agent.ts:324-339` | Mastra Code `S/index.ts:1413-1416` (`resolveTenantSessionModel`): uma credencial por organização, sem fila. Situação diferente: não há várias contas por pessoa nem fila; procurado em `S/` e `F/` | não faz | remendo já decidido | `@mastra/core` 1.83.0 não tem fila de contas nem várias contas por pessoa (procurado em `S/` e `F/`); decisões 0049 e 0050 | não precisa; a etapa só junta as três versões | — |
| 9. A trava do Projeto | U2 (o `take` com nome), U6 (o campo `turn` do Builder) | dentro do processador do Builder (`B/conversation/turn-of.ts:46-47`) | `NM/agent-controller/types.d.ts:316-325` (`threadLock`): trava por conversa. Situação diferente: a nossa é por Projeto, porque um run move a referência do Git do app | — | remendo já decidido | `@mastra/core` 1.83.0 só trava por conversa (`threadLock`); decisão 0027 ("The run engine … is Conexus code") | não precisa | — |
| 10. A aprovação de uma chamada | U4 (o campo `approval`) | `yolo: true` em três (`permissions.ts:66`, `assistant.ts:309`, `construtor.ts:302`); nos agentes `yolo: false` (`agents/controller.ts:237`), a cópia `neverAsking` (`agents/agent.ts:242-251`) e a escrita com `mustAsk` (`B/agents/tools.ts:199-212`) | núcleo `C/agent-controller/session.ts:4808-4829`; Factory `F/tools/permissions.ts:53-66`. Mesma situação | a Factory põe a política `allow` por ferramenta quando a sessão nasce; a ordem do núcleo é proibição, `yolo`, política por ferramenta, concessão, categoria, perguntar | remendo já decidido: a regra na própria ferramenta | `@mastra/core` 1.83.0 com `@mastra/pg` 1.36.0, `docs/reference/boundaries.md:1008-1024`: com `allow`, 12 de 200 leituras se perderam no Postgres; com a regra na ferramenta, 0 de 200 | não precisa; volta quando o Mastra corrigir a corrida (#27831). A etapa só troca onde a cópia mora: na montagem, pelo regime da ficha (a decisão 3 do firstmate) | — |
| 11. O juiz de fim de turno | U6 (o campo `judge`); nos outros três, o `A3` | `builder.ts:195-201`, `B/conversation/processors.ts:116-132` (`conexusCheck`) | `NM/docs/references/reference-agents-generate.md:49-59` (`isTaskComplete`); Mastra Code usa o `goal` (`S/index.ts:1507-1523`). Mesma situação | `isTaskComplete` roda os avaliadores no fim; nota 0 devolve o motivo ao modelo e o chama de novo | nativo (a régua é nossa) | `boundaries.md:929-942`: o `goal` julga com modelo e não lê a lista de tarefas | já decidido para o Builder | — |
| 12. O modo de plano | fica de fora: é o `A3` | só a frase de `B/conversation/prompt/builder.md:15` | Mastra Code `S/agents/modes/plan.ts:8-50`, `S/agents/tool-availability.ts:69-95`, `:131-133`, `:140-164`; núcleo `C/agent-controller/session.ts:6235-6289` | a lista do modo, um gancho que recusa escrever fora da pasta de planos, e a troca de modo na aprovação | nativo, mais o nosso `submit_plan` | — | fundador, 2026-11-14, pergunta 2: "A" | — |
| 13. A memória | U3 a U6 (os campos `memory` e `threads`) | `conversationMemory` (`B/controller-kit/memory.ts:49-102`) com quatro configurações (`builder.ts:125`, `:156`; `B/assistant/memory.ts`; `construtor.ts:274-277`; `agents/controller.ts:201-205`) | Mastra Code `S/agents/memory.ts:309-369`. Mesma situação | uma `Memory` com memória observacional e título gerado | nativo | — | firstmate: a ficha recebe a memória que cada agente já faz; os três nomes do estudo ficam de fora (a decisão 4 do firstmate) | — |
| 14. As skills | U2 (`skillOf` no kit), U5 e U6 (o campo `skills`) | `skillOf` em `B/conversation/instructions.ts:75-89`, reexportado em `B/conversation/public.ts:28` e importado pelo Assistente (`assistant.ts:50`) | `NM/docs/references/reference-agents-createSkill.md`. Mesma situação | `createSkill` e o campo `skills` do agente, que aceita função do pedido | nativo | — | firstmate: `skillOf` vai para o kit | `B/controller-kit/skills.ts` |
| 15. A máquina da conversa | U4, U5, U6 (o campo `workspace` do controlador); o Construtor (U3) não tem | três montagens (`assistant.ts:275-285`, `construtor.ts:279-288`, `agents/controller.ts:217-223`); o Builder pelo run (`builder.ts:208-211`) | `NM/agent-controller/types.d.ts:240-244` (`workspace` como função do pedido) | o controlador recebe a máquina por pedido | embrulhado: o nosso acrescenta as máquinas da E2B com as marcas da empresa (security S36) | — | firstmate: a ficha recebe a máquina; cada agente segue criando a sua com `createConversationMachines` (a decisão 5 do firstmate) | — |
| 16. O escopo e as ferramentas por escopo | fica de fora: não muda | `B/controller-kit/run.ts:175-195`, `B/company-tools/factory.ts` | Factory `F/tools/scope.ts:58-70`, `F/tools/index.ts:33-56`. Mesma situação | o escopo sai do registro guardado da sessão, uma vez; as ferramentas o recebem por fechamento | embrulhado (feito em 17/11) | — | já fechado | — |
| 17. As rotas de conversa do Hub (abrir, listar, trocar o modelo) | U7 (trocar o modelo); abrir e listar ficam como estão (a decisão 6 do firstmate) | quatro arquivos: `B/conversation/routes.ts`, `B/assistant/routes.ts`, `B/construtor/routes.ts`, `B/agents/conversation-routes.ts` | Factory: a tela chama as rotas nativas do controlador atrás de um middleware (relay do estudo). Situação diferente: a Factory não tem a nossa admissão por papel nem as tabelas de conversa do Hub | — | embrulhado já decidido (decisão 0050) | — | não precisa | `B/controller-kit/routes.ts` |
| 18. A sala de conversa na tela | fica de fora: etapa 2 | `apps/web/src/builder/conversation/chat.tsx`, `room.ts:41-78` | tela da Factory `mastracode/factory-ui/src/ui/pages/ThreadPage.tsx:105` | os tipos de sessão caem na mesma página | embrulhado: a sala é peça nossa (decisão 0033), na forma da Factory | — | firstmate, na etapa 2 | — |
| 19. O cartão de cada ferramenta | fica de fora: etapa 2 | `apps/web/src/builder/conversation/tool-registry.ts:119-127`, `tool-row.tsx:281-298`, `rows.ts:128-152` | tela da Factory `ToolFactory.tsx:86-156`, `tool/ToolCard.tsx:22` | os cartões especiais num lugar só; a linha comum por um registro | embrulhado: o registro é peça nossa (decisão 0033), na forma da Factory | — | firstmate, na etapa 2 | — |
| 20. O stream e o redutor da tela | fica de fora: não muda | `apps/web/src/builder/conversation/session-state.ts` | tela da Factory `transcript.ts:153` (`docs/reference/stack.md:20`) | — | embrulhado, já decidido | — | não precisa | — |
| 21. O agente salvo (a versão congelada) | U4 | `agents/controller.ts:137-162` (o agente que delega), `agents/agent.ts:321-366` | `@mastra/editor`, agentes guardados (relay do estudo de 16/11) | — | embrulhado, já decidido (etapa 24.3): o agente da conversa delega ao da versão | — | não precisa | — |
| 22. O ajudante (subagente) | U5 (o campo `subagents`) | só o Assistente (`assistant.ts:305`, `B/assistant/research.ts`) | `NM/agent-controller/types.d.ts:120-167` | uma lista de definições no controlador | nativo | — | não precisa | — |
| 23. A execução sem ninguém olhando (automação) | fica de fora: não muda; a U5 a mantém | `attended` no `RunScope` (`run.ts:29-30`) | Factory `F/tools/index.ts:38-44` | cada ferramenta se limita quando ninguém logado começou o turno | embrulhado (feito em 17/11) | — | já fechado | — |
| 24. Os nomes das pastas | fica de fora: etapa 2 | pastas com nome de agente, uma em português (`B/construtor/`) | Mastra Code e Factory: nenhuma pasta tem nome de agente (relay). Situação diferente: cada produto deles tem um agente só | — | nativo: só nomes, sem mecanismo | code C69 | firstmate para as pastas; fundador para a tela (decisão B) | — |
| 25. O nome da área na tela | fica de fora: etapa 2 | "Construir", "Agentes", "Automações" soltos | Dify, "Studio" (relay da auditoria de 14/11) | — | nativo: só texto de tela, sem mecanismo | — | fundador, 2026-11-14, pergunta 4: o "Estúdio"; quando, a decisão B | — |

**As opções em que uma garantia se apoia** (do estudo, relidas na 1.83.0). `createCodingAgent`
`workspace`: a chave ausente constrói a máquina local, no servidor; a montagem passa sempre
`workspace: undefined` (critério 13). Modo `availableTools`: ausente, todas as ferramentas ficam
visíveis; toda ficha de conversa que hoje tem lista a mantém, e a do agente salvo segue sem lista.
Sessão `yolo`: ausente, toda chamada pede aprovação (`requireToolApproval: !isYolo`,
`C/agent-controller/agent-controller.ts:2364`); o regime da ficha o escreve sempre. Ferramenta `requireApproval` como
função: quando devolve `false`, a chamada não suspende nem com `yolo: false` (relay do estudo,
`C/loop/workflows/agentic-execution/tool-approval-verdict.ts:60-97`); é o que sustenta a linha 10.
Modo `instructions`: não usado (linha 4).

**A medida do transplante.** Não se aplica: nada vem do repositório antigo.

**A dívida.**

- O Builder segue sem o `deletedRun` e sem a `TurnKey` que os outros três têm (`B/controller-kit/turns.ts:54-60`, `:101-116`): dar a ele muda o que acontece com uma conversa apagada no meio do turno. Fica para o `A3` ou para um conserto com cartão.
- As instruções do Builder seguem numa string só, sem o texto comum `conexus.md` e sem a marca de cache: é a ordem única do `A3`.
- O Construtor segue sem o sinal das tarefas (linha 7): `A3`.
- A entrada de `boundaries.md` da linha 10 nomeia `agents/agent.ts` (`neverAsking`); depois da U4 o lugar é o kit. O fechamento corrige.
- `docs/explanation/harness.md` diz `@mastra/core` 1.82.0 na introdução; o instalado é 1.83.0. O fechamento corrige.

## As decisões do firstmate

| # | Decisão reversível ([delivery L6](../guides/delivery.md)) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | Quatro controladores e quatro agentes, uma ficha e uma montagem (não um controlador com quatro modos) | no Mastra os modos dividem o mesmo agente e a troca acontece dentro de uma conversa (`NM/agent-controller/types.d.ts:55-56`, `mode.agent` "@deprecated"); os nossos quatro têm dono, admissão e lista de conversas diferentes (`B/controller-kit/kinds.ts:19-24`); cada produto do Mastra tem um controlador | reverter o pull request do agente |
| 2 | O retrato é o corpo inteiro da chamada, guardado pelo `t.assert.fileSnapshot` nativo do `node:test`, e não um teste que confere partes | o `prompt.test.ts` de hoje confere frases e a ordem de três ferramentas, e deixaria passar uma descrição mudada; o `fileSnapshot` já vem no Node instalado (`.nvmrc` 24.21.0) e falha quando o retrato falta | um teste por parte, como o de hoje |
| 3 | A cópia que faz uma ferramenta nunca perguntar sai de `agents/agent.ts` e vai para a montagem, pelo regime `THE_WRITE_ASKS`: toda ferramenta cuja `requireApproval` não é função ganha `NEVER_ASKS` numa cópia; a que tem regra em função fica com a sua (`createTool` põe `false` em toda ferramenta sem regra, `NM/tool-3X7mHzgh.js:858`, e só uma função vence a sessão) | o estudo propunha pôr a regra na fábrica, mas a fábrica só faz as ferramentas da empresa; as de web (`toolsOf`, objetos que o Builder divide), `show_file` (em `B/machine/`, da Plataforma), as ferramentas em código e o programa nascem em outros cinco lugares. As únicas regras próprias de hoje são `NEVER_ASKS` das leituras, `mustAsk` das escritas e `() => false` de `B/machine/conversation.ts:292`, todas mantidas: o que roda sem perguntar é o mesmo | pôr a regra em cada um dos que fazem ferramenta |
| 4 | A ficha recebe a memória que cada agente já faz, e não um de três nomes | as quatro configurações diferem em mais que a lembrança: a memória de trabalho do Assistente (`B/assistant/memory.ts`), a memória simples do rascunho (`agents/controller.ts:205`); o Knowledge do Assistente é outro campo do agente (`knowledge`); três nomes não cobrem quatro, e a função comum já existe (`conversationMemory`) | uma união de nomes na ficha |
| 5 | A máquina da conversa segue criada por cada agente, e a ficha de conversa recebe o `workspace` do controlador só onde ele existe hoje: o Assistente e o agente salvo pelas máquinas, o Builder pelo run; o Construtor não tem (`construtor.ts:298-303`) | as ferramentas de cada agente usam a máquina (`show_file`, as propostas do Assistente, a ferramenta em código do Construtor) e precisam dela antes da ficha; as três chamadas já são uma função só (`createConversationMachines`, em `B/machine/`, da Plataforma) e diferem só por dados; dar `workspace` ao Construtor poria as ferramentas da máquina no pedido dele | um campo `machine` na ficha, com a máquina passada às ferramentas |
| 6 | O molde da U7 é a troca de modelo; abrir e listar ficam em cada agente | as três rotas de modelo têm a mesma espinha (admitir e achar a conversa, `changeModel`, a linha de log); abrir e listar já usam as peças do kit (`openSession`, `listOwned`, `ownThread`, `attemptIdOf`), e o que sobra em cada um é fato dele: o índice do Hub no Builder, a escolha de ligações e a paginação no Assistente, as marcas no Construtor, a versão no agente salvo | um molde também para abrir e listar |
| 7 | Cada variante de uma união da ficha entra com a primeira ficha que a usa: a U3 traz o que o Construtor precisa, e cada unidade seguinte estica a ficha | um contrato entra com o seu primeiro implementador (conexus-scope, passo 4); se a ficha não aguentar um agente, descobre-se naquela unidade, que só reverte a si | escrever a ficha inteira na U3 |
| 8 | Os retratos moram ao lado do agente, em `B/<agente>/requests/`, com a extensão `.snapshot` | quem muda o prompt de um agente vê o retrato dele na mesma pasta; `.snapshot` fica fora do Biome, que reformataria um `.json` | uma pasta só no kit |
| 9 | De G2 a G5, cada grupo é publicado e conferido no ar pelo firstmate, com a conversa daquele agente, antes do build do grupo seguinte | um pull request por agente só se desfaz sozinho se a diferença aparecer antes do próximo; o retrato pega o que um teste vê, e o uso no ar pega o resto (estudo, seção 4.2) | publicar uma vez só, no fim |

## O que o cartão do `A1` relê

O cartão do `A1` (https://github.com/developmentconexus-ops/conexus/pull/1203, em `4664fb61`) foi lido
em `main` `044e16c3` e passa a vir depois desta etapa (decisão A). O cartão dele entra em `docs/steps/` e o build dele parte
do `main` depois do fechamento desta etapa (G7; delivery L1, L5). O que ele relê:

- **O juiz.** A linha "Quem decide 'terminei'" dele cita `B/conversation/processors.ts:83-132` e a
  U3 dele `processors.ts:15-20`, `:42-49` e `:83-113`: esse arquivo não muda nesta etapa. O que muda
  é onde o juiz é ligado: o `isTaskComplete` de `builder.ts:195-201` passa a ser o campo `judge` da
  ficha do Builder (U6), onde a conferência nova dele entra.
- **As skills do Builder.** A decisão 2 dele diz, como desfazer, pôr a skill do CLI nas skills do
  Builder (`B/conversation/builder.ts:176`); depois da U6 elas são o campo `skills` da ficha.
- **O retrato do Builder.** O passo 2 da U3 dele muda `CHECK_DESCRIPTION` e `feedback`, que vão no
  pedido ao modelo. Os retratos do Builder (U1) ficam vermelhos de propósito: a U3 dele os regrava
  com `--test-update-snapshots` no mesmo commit, e o diff mostra só a descrição de `conexus_check` e
  o texto do juiz. O cartão dele ganha esse passo e um critério que o diga.
- **`test-conversation.ts`.** O dublê de `confer` dele entra em
  `B/conversation/test-conversation.ts`; nenhuma unidade desta etapa muda esse arquivo.
- **As linhas de `main` que ele cita** em `B/conversation/` e `B/runs/` são relidas no `main` depois
  de G7: `builder.ts` e `turn-of.ts` mudam nesta etapa; `B/runs/` não.

## O que o fechamento corrige

O fechamento (U8) leva, além do seu trabalho, o que o estudo apontou fora deste cartão (seção 5.4 e
6.1 dele), porque a página da trilha e o roteiro só mudam num fechamento:

- `docs/steps/trilhas/agentes-e-apps.md:46-50`: "A trilha está sem cartão" e "A etapa seguinte é A
  Prévia, com o cartão em rascunho" estão atrasados; passam a dizer a ordem da decisão A.
- A mesma página, nos passos 3 e 8 da auditoria: os dois passam a ser a etapa 2.
- A mesma página, "O que a trilha possui": `B/company-tools/`, `B/data-tools/`, `B/connectors/`,
  `B/app-data/` e `B/tools/` são da trilha, como a regra `AGENTS_AND_APPS` já diz
  (`.dependency-cruiser.cjs:21`).
- `docs/roadmap.md:72-74`: "segue A Prévia" passa a dizer a ordem nova.

## U1 A rede

**Base e modelo.** `main` `b5d93116`. Sonnet: só testes, sobre os ajudantes de teste que já existem.

### As linhas da tabela

Nenhuma linha constrói peça; a U1 é a prova que as linhas 1, 5, 8, 10, 11 e 13 pedem. Ler
`apps/server/src/platform/test-anthropic-body.ts:9-41` (`Sent`) e `:182` (`sentOf`), e os ajudantes de
cada agente: `B/conversation/test-conversation.ts:55` (`conversing`) e `:263` (`asked`);
`B/assistant/test-assistant.ts:105` (`assisting`), `:175` (`created`), `:182` (`talking`);
`B/construtor/test-construtor.ts:23` (`building`), `:30` (`opened`); `B/agents/test-agents.ts:55`
(`agentsOn`), `:195` (`publishedAgent`), `:204` (`talkedTo`). O caso do Luna segue
`B/assistant/model-block.test.ts:17-35` (`subscribed`, a assinatura do ChatGPT) e o dublê
`apps/server/src/platform/test-openai-codex.ts:99` (`plantCodex`, com o corpo em `codex.calls[].body`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/test-anthropic-body.ts` | Muda: `Sent` ganha `body`, o JSON do pedido sem nada estreitado | todo teste que lê `Sent`; nenhum muda |
| `B/controller-kit/test-request.ts` | Cria: `requestOf`, `sameRequests` | os quatro `request.test.ts` |
| `B/controller-kit/request.test.ts` | Cria: os casos de `requestOf` | — |
| `B/controller-kit/lines.test.ts` | Cria: as linhas de log que as unidades movem (critérios 6 e 16), gravadas em `main` antes da mudança | — |
| `B/assistant/test-assistant.ts`, `B/assistant/model-block.test.ts` | Muda: `subscribed` sai do teste para o ajudante, para o retrato do Luna usá-lo | `model-block.test.ts`, `B/assistant/request.test.ts` |
| `B/conversation/`, `B/assistant/`, `B/construtor/`, `B/agents/` | Cria: `request.test.ts` e `requests/*.snapshot` | — |

### Os contratos que a unidade cria

Em `apps/server/src/platform/test-anthropic-body.ts`, `Sent` ganha um campo:

```ts
/** The request body as the Messages API received it, parsed as JSON and nothing narrowed. */
body: unknown
```

Em `B/controller-kit/test-request.ts`:

```ts
/**
 * A model call as its snapshot keeps it: the whole body, with each uuid, the turn's date and weekday
 * and each tool call id the double gave as numbered marks, and each text with a line break as its lines.
 */
export function requestOf(body: unknown): unknown

/** Every call of the turn, in order, against the scenario's snapshot (`t.assert.fileSnapshot`). */
export function sameRequests(t: TestContext, bodies: readonly unknown[], snapshotPath: string): void
```

- **Cada estado.** Nenhum novo.
- **Cada id.** Nenhum novo: os ids do pedido viram marcas `<id-1>`, `<id-2>` na ordem em que
  aparecem, então dois ids diferentes seguem diferentes no retrato.
- **O dono de cada fato.** O que o retrato troca: `requestOf`, um lugar só. O texto de cada prompt
  segue com o seu dono; o retrato só o copia.
- **O esquema Zod de cada entrada externa.** Nenhum: o corpo é do dublê.
- **O arquivo modelo.** `B/assistant/instructions.test.ts`: entra pela porta do Hub de teste e lê
  `Sent`.

Os cenários, um caso cada, com as chamadas do turno ao modelo da conversa (as do título e do
observador ficam de fora, como os testes de hoje as separam):

| Agente | Cenário | Por que este |
| --- | --- | --- |
| Builder | o primeiro turno num Projeto: uma escrita e a resposta depois dela | as instruções, as skills, as ferramentas na ordem da etapa 20 |
| Builder | um turno em que a conferência reprova uma vez e o modelo recebe o motivo do juiz | o `judge` da U6 |
| Assistente | uma conversa em Início com uma ligação: `search_tools`, a leitura e a resposta | a ordem das mensagens, o bloco da conversa, as leituras que a busca carrega |
| Assistente | uma conversa num Projeto | o lugar no bloco |
| Assistente | a rodada de uma automação (`attended: false`) | a frase da automação, o perfil só de leitura |
| Assistente | o ajudante `pesquisar` | `tools.perRun` e `subagents` |
| Assistente | o modelo Luna pela assinatura do ChatGPT, com `subscribed` e `plantCodex` | o bloco por modelo; este retrato guarda o corpo que o dublê do Codex recebe |
| Construtor | um turno que faz o rascunho e chama o Testar | o Construtor e o agente da versão rodando sozinho |
| Agente salvo | a conversa com a versão publicada, só de leitura | o agente que delega e a frase `READ_ONLY` |
| Agente salvo | a conversa com o rascunho que tem uma escrita em "Pergunta antes" | a frase `WRITES` e o regime de aprovação |
| Agente salvo | a conversa com a versão que tem o Computador | as instruções do programa |

### As skills e a leitura

A linha de `@mastra/core` em `docs/reference/stack.md:20` (a skill `mastra`). O `node:test`:
`t.assert.fileSnapshot` e `--test-update-snapshots` da documentação do Node 24. Ler primeiro
[testing](../guides/testing.md) T4, T5, T24 e T28.

### A ordem do trabalho

1. **O corpo no dublê.** Critério: 3.
   - **Arquivos:** muda `apps/server/src/platform/test-anthropic-body.ts`.
   - **O que entra:** `sentOf` põe em `body` o `JSON.parse` do corpo que já lê. Regras: T24.
   - **Testes:** os de hoje que leem `Sent`, sem mudar.
   - **Pronto quando:** `npm test -w @conexus/server` passa como antes.
2. **O retrato.** Critério: 3.
   - **Arquivos:** cria `B/controller-kit/test-request.ts`, `B/controller-kit/request.test.ts`.
   - **Referência a seguir:** `node:test` `t.assert.fileSnapshot(value, path)`.
   - **O que entra:** `requestOf` troca só o que a tabela de critérios diz; um valor que muda de uma
     corrida para outra e não está nessa lista fica no retrato, e o teste fica vermelho.
   - **Testes:** `request.test.ts`: dois corpos com o mesmo id dão a mesma marca, dois ids dão
     marcas diferentes, a data de hoje vira a marca e outra data não, um texto com quebra vira as
     suas linhas.
   - **Mutações à mão:** tirar a troca dos uuids faz o caso "um id, uma marca" ficar vermelho.
3. **Os cenários.** Critérios: 1, 2.
   - **Arquivos:** cria os quatro `request.test.ts` e os `requests/*.snapshot`.
   - **O que entra:** cada caso roda o seu cenário pelo Hub de teste, como os testes de hoje, e chama
     `sameRequests` com os corpos das chamadas da conversa. Os retratos nascem com
     `--test-update-snapshots` no `main` sem nenhuma outra mudança. Regras: T5, T28.
   - **Mutações à mão:** as três do critério 2, cada uma desfeita depois; a saída vai no pull
     request.
   - **Pronto quando:** os quatro arquivos passam duas vezes seguidas sem `--test-update-snapshots`.
4. **As linhas de log.** Critérios: 6, 16.
   - **Arquivos:** cria `B/controller-kit/lines.test.ts`.
   - **O que entra:** pelo Hub de teste, com o log capturado como `B/agents/release.test.ts` o
     captura: tirar uma pessoa com uma conversa de cada tipo dá `ASSISTANT_CONVERSATIONS_RELEASED`,
     `CONSTRUTOR_CONVERSATIONS_RELEASED` e `AGENT_CONVERSATIONS_RELEASED`, cada uma com `count: 1`;
     apagar um agente dá `AGENT_CONVERSATIONS_SWEPT` com a contagem; trocar o modelo de uma conversa
     do Builder, do Assistente e do Construtor dá `CONVERSATION_MODEL_SET`, `ASSISTANT_MODEL_SET` e
     `CONSTRUTOR_MODEL_SET` com os campos de hoje. Regra: T5.
   - **Pronto quando:** passa no `main` sem mudança.

### Como se prova

Critério 1: os quatro arquivos, duas corridas, e uma terceira com um retrato apagado, que falha.
Critério 2: as mutações à mão. Critério 3: `request.test.ts`. Nada falha hoje, porque nada grava o
pedido inteiro.

### Parar se

- Um valor do corpo muda entre duas corridas e não é um uuid, a data ou um id de chamada do dublê:
  pare e relate qual é e de onde vem. Trocar mais coisas no retrato o deixa cego.
- Um cenário não roda pelo Hub de teste sem importar o interior do servidor (T5): pare e relate.

## U2 Subtrair

**Base e modelo.** O commit da U1. Opus: três processadores de turno viram um, e cada recusa tem de
seguir com o motivo de hoje.

### As linhas da tabela

- **8. O turno.** Ler `B/controller-kit/turns.ts` inteiro (134 linhas), `B/conversation/turn-of.ts`
  inteiro (118), `B/agents/agent.ts:84-106` (`agentRunContext`, `agentTurnOf`) e `:321-340` (o `turn` do agente da
  versão), e `B/construtor/draft-trial.ts:36-61`, que roda esse agente sozinho.
- **9. A trava do Projeto.** `B/conversation/turn-of.ts:37-49` (`takeTurn`) e `:113-118` (`busyIn`,
  que lê o id `conexus-turn`).
- **14. As skills.** `B/conversation/instructions.ts:75-95`, `B/conversation/public.ts:28`,
  `B/assistant/assistant.ts:50`, `:115-119`, `:249-254`.
- **3. O modo.** As quatro constantes da linha 3.
- **Soltar as conversas.** `B/controller-kit/release.ts` inteiro, `B/assistant/release.ts` inteiro,
  `B/construtor/construtor.ts:320-332`, `B/agents/controller.ts:241-245` e `:263-270`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `B/controller-kit/turns.ts` | Muda: `Taken`, `turnProcessor`; `sessionTurns` sobre ele | Assistente, Construtor, agentes |
| `B/controller-kit/release.ts`, `run.ts` | Muda: `releaseByMarks`; `MarkedKind` exportado | Assistente, Construtor, agentes |
| `B/controller-kit/skills.ts` | Cria: `skillOf` (vindo de `B/conversation/instructions.ts`) | Builder, Assistente |
| `B/controller-kit/factories.ts`, `public.ts` | Muda: `CONVERSATION_MODE`; as exportações novas | os quatro |
| `B/conversation/turn-of.ts` | Muda: `turnOf` vira `turnProcessor` com o `take` da trava (`projectTurn`) | `builder.ts` |
| `B/conversation/instructions.ts`, `public.ts`, `builder.ts` | Muda: `skillOf` do kit; a constante do modo | `B/conversation/` |
| `B/assistant/assistant.ts`, `release.ts`, `turn.ts` | Muda: `skillOf` e o modo do kit; `releaseConversations` sobre `releaseByMarks`; o comentário das 50 chamadas | `B/assistant/` |
| `B/construtor/construtor.ts` | Muda: o `release` e o modo | — |
| `B/agents/controller.ts`, `agent.ts`, `tools.ts` | Muda: o `release`, o modo; o `turn` da versão sobre `turnProcessor`; o comentário das 50 chamadas | `B/construtor/draft-trial.ts` (sem mudar) |
| `B/connectors/connector-tools.ts` | Muda: o comentário das 50 chamadas (`:24`) | — |

### Os contratos que a unidade cria

Em `B/controller-kit/turns.ts`:

```ts
/** What a run's take answers (C21 on `kind`): its turn; no conversation of this controller; or a refusal with its reason. */
export type Taken =
  | Readonly<{ kind: 'TAKEN'; turn: Turn }>
  | Readonly<{ kind: 'NONE' }>
  | Readonly<{ kind: 'REFUSED'; reason: string }>

/**
 * The one input processor that takes a run's turn (C26): at the input and, with `resumes`, at the
 * first step of a run Mastra resumes with no turn on its context. `NONE` aborts with `none`;
 * `REFUSED` with its reason.
 */
export function turnProcessor(options: {
  id: string
  none: string
  /** Whether a resumed run takes its turn at its first step: the session's and the Builder's do; a version's agent alone does not, as today. */
  resumes: boolean
  take: (requestContext: RequestContext) => Promise<Taken>
}): InputProcessor
```

`sessionTurns` mantém a assinatura de hoje (`turns.ts:23-27`) e passa a montar o seu `processor` com
`turnProcessor`. Em `B/conversation/turn-of.ts`, `turnOf` passa a ser `turnProcessor({ id:
'conexus-turn', none: 'CONVERSATION_NOT_FOUND', resumes: true, take: projectTurn(deps) })`, e `projectTurn` é o
passo da trava: `TAKEN`, `NONE`, ou `REFUSED` com `RUN_BUSY:<pessoa>`. O agente da versão usa
`turnProcessor({ id: 'conexus-agent-turn', none: 'NO_TURN', resumes: false, take })`: hoje ele só
tem `processInput` (`agent.ts:324-339`), e ganhar a tomada no primeiro passo mudaria um run retomado
fora de uma conversa.

Em `B/controller-kit/release.ts`:

```ts
/**
 * Deletes a marked kind's conversations that a removal names (the company, and maybe one person or
 * Projeto), by the kind's marks: each session, then `each` (its machine), then the thread; logs `code`
 * with the count.
 */
export async function releaseByMarks(
  deps: { controller: AgentController; memory: MastraMemory; log: FailureLog },
  input: {
    kind: MarkedKind
    scope: ReleaseScope
    code: 'ASSISTANT_CONVERSATIONS_RELEASED' | 'CONSTRUTOR_CONVERSATIONS_RELEASED' | 'AGENT_CONVERSATIONS_RELEASED'
    each?: (id: ConversationId) => Promise<void>
  },
): Promise<number>
```

A varredura de um agente apagado (`AGENT_CONVERSATIONS_SWEPT`, `agents/controller.ts:283-310`) segue
com `threadsByMarks` e `releaseThreads`: as marcas dela são outras (a empresa e o agente).

Em `B/controller-kit/factories.ts`: `export const CONVERSATION_MODE = 'conversa'`, e o `mode.id` de
`controllerOf` passa a ter esse tipo. Em `B/controller-kit/skills.ts`: `skillOf(files: SkillFiles)`,
o mesmo corpo de `B/conversation/instructions.ts:75-89`.

- **Cada estado.** `Taken`, discriminado em `kind`.
- **Cada id.** `ConversationId` (marca) em `each`.
- **O dono de cada fato.** A tomada da vez: `turnProcessor`. As marcas de cada tipo: `RUN_MARKS`
  (`run.ts:50-70`), que `releaseByMarks` lê. O modo: `CONVERSATION_MODE`. O número de chamadas por
  turno: `CONNECTOR_CALLS_PER_TURN`, que os três comentários passam a nomear; o de
  `apps/server/src/hub/connectors/copy-proof.ts:32` é da trilha Dados e fica.
- **O esquema Zod de cada entrada externa.** Nenhuma nova.
- **O arquivo modelo.** `B/controller-kit/run.ts`: cumpre C21 (`RunThread`, `Ceiling`), C23 (as
  marcas `CompanyId`, `PersonId`, `ProjectId`) e C26 (`RUN_MARKS`, um dono das marcas).

### As skills e a leitura

A skill `mastra` (`docs/reference/stack.md:20-21`): `InputProcessor` (`processInput`,
`processInputStep`, `abort`). Ler primeiro [testing](../guides/testing.md) T5 e T20.

### A ordem do trabalho

1. **Apagar primeiro.** Critério: 7.
   - **Arquivos:** cria `B/controller-kit/skills.ts`; muda `B/conversation/instructions.ts`,
     `B/conversation/public.ts`, `B/assistant/assistant.ts`; muda as quatro constantes do modo.
   - **O que sai:** `skillOf` de `B/conversation/instructions.ts` e a reexportação de
     `B/conversation/public.ts:28`; as quatro constantes.
   - **Pronto quando:** `npm run deps` e os retratos verdes.
2. **Um processador de turno.** Critérios: 5, 4, 17.
   - **Arquivos:** muda `B/controller-kit/turns.ts`, `B/conversation/turn-of.ts`, `B/agents/agent.ts`.
   - **O que sai:** o `processInput` e o `processInputStep` de `turn-of.ts:57-73` e de
     `agent.ts:324-339`.
   - **O que entra:** `turnProcessor`, com a leitura da vez em `processInputStep` igual à de hoje
     (`turnIn(requestContext) === undefined`). Regras: C21, C26.
   - **Testes:** os nomeados no critério 5, sem mudar.
   - **Mutações à mão:** `projectTurn` devolvendo `NONE` no lugar de `REFUSED` deixa vermelho o caso
     `RUN_BUSY` de `conversation-turns.test.ts`.
   - **Pronto quando:** os testes de `B/conversation/`, `B/construtor/` e `B/agents/` e os retratos
     verdes.
3. **Soltar as conversas.** Critério: 6.
   - **Arquivos:** muda `B/controller-kit/release.ts`, `run.ts`, `B/assistant/release.ts`,
     `B/construtor/construtor.ts`, `B/agents/controller.ts`.
   - **O que sai:** os três corpos de hoje.
   - **Testes:** os nomeados no critério 6, sem mudar.
   - **Mutações à mão:** o Construtor chamando `releaseByMarks` com `kind: 'assistant'` acha as
     marcas erradas e não apaga nada: fica vermelho o caso "a remoção" de
     `B/construtor/routes.test.ts`.
4. **Os comentários das 50 chamadas.** Sem critério: só texto de comentário (code C70).

### Como se prova

Critérios 5 e 6: os testes de hoje, que tocam a fila de contas e o `deleteSession` e o `deleteThread`
do Mastra pelo Hub de teste; os retratos (critério 4). Hoje nada falha: a unidade só junta.

### Parar se

- Um teste de hoje só passa mudando: pare. A unidade não muda comportamento.
- Juntar o processador do Builder pede que o turno dele termine no `agent_end`, e não no `onEnd` do
  run: pare. A conta da fila seria solta antes da versão salva.

## G1 O ponto de conferência

Antes do pull request de G1: `npm run check`; os testes de `B/` duas vezes; o diff dos retratos
entre o commit da U1 e o da U2, vazio (critério 4); as três mutações do critério 2, com a saída no
pull request. Depois da publicação, o firstmate faz no ar os passos 1 a 4 do roteiro, porque a U2
mexe nos quatro agentes, antes do build de G2.

## U3 A ficha, com o Construtor

**Base e modelo.** O commit da U2. Opus: o contrato é o que os quatro agentes vão preencher.

### As linhas da tabela

- **1, 2. A ficha e o construtor.** Ler `B/construtor/construtor.ts` inteiro (337 linhas),
  `B/controller-kit/factories.ts` inteiro (141) e `B/controller-kit/instructions.ts:8-16`
  (`fixedSystem`). Seguir a Factory `F/factory.ts:1680-1689` (o produto passa o que é dele por opção)
  e o Mastra Code `S/index.ts:1368-1376` (um agente base, campos como função do pedido).
- **3. O modo.** `construtor.ts:69-77`.
- **5. A ordem.** `construtor.ts:235-243`.
- **13, 15. A memória e a máquina.** `construtor.ts:274-288`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `B/controller-kit/spec.ts` | Cria: os tipos da ficha | as fichas dos quatro |
| `B/controller-kit/mount.ts` | Cria: `agentOfSpec`, `mountAgent` | as fichas dos quatro |
| `B/controller-kit/spec.test.ts` | Cria | — |
| `B/controller-kit/public.ts` | Muda: as exportações | — |
| `B/construtor/construtor.ts` | Muda: a montagem à mão vira a ficha | `B/construtor/public.ts`, `conversations-of.ts` (sem mudar) |

### Os contratos que a unidade cria

Em `B/controller-kit/spec.ts`, a ficha inteira, como fica no fim da etapa. Cada variante entra com a
primeira ficha que a usa (a decisão 7 do firstmate), na unidade que a nota diz:

```ts
/** One system message of an agent's instructions, in the order its ficha lists (C21 on `kind`). */
export type PromptPart =
  | Readonly<{ kind: 'FIXED'; text: string }>          // U3: `fixedSystem(text)`, the 1 h cache mark
  | Readonly<{ kind: 'TEXT'; text: string }>           // U3: a fixed message without the mark
  | Readonly<{ kind: 'OF_RUN'; of: (requestContext: RequestContext) => Promise<string | undefined> }> // U3: none when undefined
  | Readonly<{ kind: 'DATA_ORDER' }>                   // U4: `dataOrder()`, the data track's text
  | Readonly<{ kind: 'BY_MODEL'; blocks: Readonly<Record<string, string>> }> // U5: the session model's block, or none

/** An agent's instructions (row 5): system messages in order; the run's version's (U4); one string (U6, the Builder's today). */
export type Prompt =
  | Readonly<{ kind: 'MESSAGES'; parts: readonly PromptPart[] }>
  | Readonly<{ kind: 'DELEGATED'; of: (requestContext: RequestContext) => Promise<AgentInstructions> }>
  | Readonly<{ kind: 'ONE_STRING'; of: (requestContext: RequestContext) => Promise<string> }>

/** Whose model a turn runs: the session's (U3), or the run's, as a saved version holds it (U4). */
export type ModelSource =
  | Readonly<{ kind: 'SESSION' }>
  | Readonly<{ kind: 'OF_RUN'; of: (requestContext: RequestContext) => Promise<ModelId> }>

/** Who waits for approval (row 10): nothing, `yolo` (U3); or a write by its own rule, every other tool never asking (U4). */
export type Approval = Readonly<{ kind: 'NOTHING_ASKS' }> | Readonly<{ kind: 'THE_WRITE_ASKS' }>

/** How a run takes its turn (row 8): by its session, held until `agent_end` (U3); or by the run alone (U4, U6). */
export type TurnSource =
  | Readonly<{ kind: 'SESSION'; id: string; take: (requestContext: RequestContext) => Promise<Turn | undefined> }>
  | Readonly<{ kind: 'RUN'; id: string; none: string; resumes: boolean; take: (requestContext: RequestContext) => Promise<Taken> }>

/** What an agent is made of: Mastra's `Agent` fields, filled by its ficha. */
export type AgentSpec = Readonly<{
  id: string
  name: string
  description?: string                                 // U4
  base: 'AGENT' | 'CODING_AGENT'                       // CODING_AGENT: U6
  prompt: Prompt
  model: ModelSource
  tools: (requestContext: RequestContext) => Promise<ToolsInput>
  approval: Approval
  memory: AgentConfig['memory']
  turn: TurnSource
  skills?: AgentConfig['skills']                       // U5
  signals?: AgentConfig['signals']                     // U5
  scopes?: AgentConfig['scopes']                       // U4
  knowledge?: AgentConfig['knowledge']                 // U5 (`NM/agent/types.d.ts:831`)
  judge?: StreamIsTaskCompleteConfig                   // U6: `defaultOptions.isTaskComplete` (`NM/agent/agent.types.d.ts:667`)
  /** Input processors after the turn and before the account's pick, and after the pick (U5). */
  processors?: Readonly<{ beforePick: readonly InputProcessor[]; afterPick: readonly InputProcessor[] }>
}>

/** A conversation's agent and its controller: the id is `CONTROLLER_KINDS[kind].id`, never the ficha's. */
export type ConversationSpec = Omit<AgentSpec, 'id' | 'memory'> & Readonly<{
  kind: ControllerKind
  /** The controller's memory, where its threads live. */
  threads: MastraMemory
  /** The agent's memory; absent, the threads' (U4: the version's, by the run). */
  memory?: AgentConfig['memory']
  mode: Readonly<{ id: typeof CONVERSATION_MODE; availableTools?: readonly string[] }>
  /** The controller's own tools under native ids (`ask_user`, `submit_plan`), and each run's (U5); the saved agent has none. */
  own?: NonNullable<Parameters<typeof controllerOf>[0]['tools']>
  subagents?: Parameters<typeof controllerOf>[0]['subagents'] // U5
  workspace?: AgentControllerConfig['workspace']
}>
```

Em `B/controller-kit/mount.ts`:

```ts
/**
 * The one place that calls Mastra's agent constructor (row 2): `new Agent`, or `createCodingAgent`
 * with `workspace: undefined`, with the turn's processor made from `spec.turn`. `watch` comes with a
 * `SESSION` turn (`sessionTurns`): `mountAgent` calls it with the controller; a `RUN` turn has none.
 */
export function agentOfSpec(
  spec: AgentSpec,
  deps: { queue: QueueDeps },
): Readonly<{ agent: Agent; watch?: (controller: AgentController) => void }>

/** A conversation's agent and controller on the kit: `agentOfSpec`, `controllerOf` with the approval's `yolo`, and the session's turns watched. */
/** The session's starting state of a regime: `NOTHING_ASKS` is `{ yolo: true }`, `THE_WRITE_ASKS` `{ yolo: false }`; one owner of the `yolo` (C26). */
export function initialStateOf(approval: Approval): Readonly<{ yolo: boolean }>

export function mountAgent(
  spec: ConversationSpec,
  deps: { queue: QueueDeps; storage: MastraCompositeStore },
): Readonly<{ agent: Agent; controller: AgentController }>
```

`agentOfSpec` faz das partes as `instructions` do agente: resolve primeiro as partes `OF_RUN`, juntas,
como o `Promise.all` de hoje, e só depois `BY_MODEL`, então uma recusa do bloco vem antes de ler o
modelo da sessão, como hoje (`B/assistant/instructions.ts:58-68`); monta a lista na ordem da ficha, cada `FIXED` por `fixedSystem` e cada `OF_RUN`
que devolve `undefined` fora; põe `agentDefaults(queue, turns)` com o processador do `turn`; e só põe
a chave que a ficha preenche (critério 9). Nenhum arquivo novo do kit importa do dado (critério 17).

- **Cada estado.** `PromptPart`, `Prompt`, `ModelSource`, `Approval`, `TurnSource`: uniões
  discriminadas em `kind`; o `switch` de cada uma termina em `satisfies never` (C21).
- **Cada id.** `ModelId` (marca) em `OF_RUN`; o id do controlador vem de `CONTROLLER_KINDS`.
- **O dono de cada fato.** O que é de um agente: a ficha dele, no arquivo dele. O que é igual nos
  quatro: `mount.ts`. A marca de cache: `fixedSystem`.
- **O esquema Zod de cada entrada externa.** Nenhuma: a ficha é código nosso.
- **O arquivo modelo.** `B/controller-kit/run.ts` (ver a U2).

### As skills e a leitura

A skill `mastra`: `Agent` (`instructions`, `model`, `tools` como função do pedido), `AgentController`
(`modes`, `tools`, `workspace`, `initialState`). Ler primeiro `NM/agent-controller/types.d.ts:36-331`
e [testing](../guides/testing.md) T5.

### A ordem do trabalho

1. **A ficha e a montagem, sem ninguém usando.** Critério: 9.
   - **Arquivos:** cria `spec.ts`, `mount.ts`, `spec.test.ts`; muda `public.ts`.
   - **Referência a seguir:** `S/index.ts:1368-1376`; `F/factory.ts:1680-1689`.
   - **O que entra:** só as variantes da U3. Regras: C21, C24, C26, C74.
   - **Testes:** `spec.test.ts`, um caso por campo opcional ausente.
   - **Mutações à mão:** pôr `skills: spec.skills` sem a condição deixa vermelho o caso de `skills`.
2. **O Construtor na ficha.** Critérios: 8, 4, 17.
   - **Arquivos:** muda `B/construtor/construtor.ts`.
   - **O que sai:** `construtorAgent` (`:186-263`) e as linhas de `createConstrutor` que montam o
     agente, as vezes e o controlador (`:289-304`).
   - **O que entra:** a ficha: `prompt` com `FIXED(CONEXUS_PROMPT)`, `OF_RUN(bloco)`, `TEXT(MANUAL)`;
     `model` `SESSION`; as `tools` na ordem de hoje (`:254-258`); `approval` `NOTHING_ASKS`; `turn`
     `SESSION` com `takeOfScope`; `mode` com `AVAILABLE_TOOLS`; `own` com `ask_user`; sem `workspace`: o controlador do Construtor não recebe máquina, e as
     máquinas servem só às ferramentas dele (`:201`, `:270-271`). A parte (`part`), o `release` da
     U2 e as rotas ficam.
   - **Testes:** os de `B/construtor/` e os retratos, sem mudar.
   - **Pronto quando:** o `grep` do critério 8 vazio.

### Como se prova

Critério 8: os retratos do Construtor, que passam pela montagem nova até o corpo que o dublê lê.
Critério 9: `spec.test.ts`. Hoje nada falha: a ficha não existe.

### Parar se

- O retrato do Construtor muda e a causa é a ordem de uma chave do `Agent` ou do controlador: pare
  e relate a chave. A montagem copia a ordem de hoje; ela não escolhe outra.
- A ficha precisa de um campo que nenhuma das quatro fichas lê: não o crie (code C74).

## G2 O ponto de conferência

Antes do pull request de G2: `npm run check`, os testes de `B/construtor/` e de `B/controller-kit/`
e os retratos. Depois da publicação, o firstmate faz no ar o passo 3 do roteiro (o Construtor e o
Testar) antes do build de G3.

## U4 O agente salvo

**Base e modelo.** `main` depois do merge e da publicação de G2. Opus: o agente da conversa delega ao
agente de cada versão, e a aprovação é a parte mais delicada da etapa.

### As linhas da tabela

- **21. O agente salvo.** Ler `B/agents/controller.ts` inteiro (312 linhas) e `B/agents/agent.ts`
  inteiro (366), e `B/agents/resolver.ts:21-60` (`agentRuns`, `scopesOf`).
- **10. A aprovação.** `agent.ts:236-251` (`neverAsking`), `:268-311` (`runToolsOf`);
  `B/agents/tools.ts:78-80` (`NEVER_ASKS`), `:120`, `:199-212`; `B/machine/conversation.ts:292`;
  `docs/reference/boundaries.md:1008-1024`.
- **5. A ordem.** `agent.ts:345-358`.
- **8. O turno.** `agents/controller.ts:94-111` (`agentTurns`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `B/agents/controller.ts` | Muda: `delegatingAgent` e o `controllerOf` viram a ficha da conversa | `B/agents/public.ts` (sem mudar) |
| `B/agents/agent.ts` | Muda: `agentOf` monta pela ficha da versão; sai `neverAsking` | `controller.ts`, `B/construtor/draft-trial.ts` (sem mudar) |
| `B/agents/tools.ts` | Muda: `NEVER_ASKS` vai para o kit | `agent.ts` |
| `B/controller-kit/spec.ts`, `mount.ts`, `spec.test.ts` | Muda: as variantes da U4; a regra do regime | — |

### Os contratos que a unidade cria

As variantes da U4 em `spec.ts` (`DATA_ORDER`, `DELEGATED`, `OF_RUN` do modelo, `THE_WRITE_ASKS`,
`RUN` da vez, `description`, `scopes`). Em `mount.ts`, a regra do regime:

```ts
/** A tool's own rule beats the session's (row 10): the rule of every tool that `THE_WRITE_ASKS` leaves alone. */
export function NEVER_ASKS(): false

/**
 * The tools of a ficha whose write asks: each tool whose `requireApproval` is not a function (`createTool`
 * sets `false` when none is given, `NM/tool-3X7mHzgh.js:858`) as a copy with `NEVER_ASKS`; a tool whose
 * rule is a function as it is (only a function beats the session, `C/loop/workflows/agentic-execution/
 * tool-approval-verdict.ts:85-93`); the given objects unchanged.
 */
function askingOnlyByOwnRule(tools: ToolsInput): ToolsInput
```

As duas fichas do agente salvo: a da conversa (`kind: 'agents'`, `prompt` `DELEGATED`, `model`
`OF_RUN` pelo plano, `tools` da versão, `approval` `THE_WRITE_ASKS`, `scopes`, `memory` da versão,
`threads` a memória observacional, `turn` `SESSION` com o `take` de `agentTurns`, `mode` sem lista, o
`workspace` das máquinas); e a de cada versão, por `agentOfSpec` (`id` `agentKey`, `name`,
`description`, `prompt` com `FIXED(CONEXUS_PROMPT)`, `DATA_ORDER`, `OF_RUN(bloco)`, `OF_RUN(versão e
WRITES ou READ_ONLY)`, `OF_RUN(o programa, ou nada)`, `model` `OF_RUN`, `approval` `THE_WRITE_ASKS`,
`turn` `RUN` com `id: 'conexus-agent-turn'`, `none: 'NO_TURN'` e `resumes: false`).

- **Cada estado.** As variantes novas, em `kind`.
- **Cada id.** `AgentId` (marca) em `agentKey`, como hoje.
- **O dono de cada fato.** A regra de quem nunca pergunta: `mount.ts`, uma vez; a da escrita segue em
  `B/agents/tools.ts` (`mustAsk`).
- **O esquema Zod de cada entrada externa.** Nenhuma nova.
- **O arquivo modelo.** `B/controller-kit/run.ts`.

### As skills e a leitura

A skill `mastra`: `createTool({ requireApproval })` e o `yolo` da sessão. Ler primeiro
[security](../guides/security.md) S36 e [testing](../guides/testing.md) T5.

### A ordem do trabalho

1. **A regra do regime, sem ninguém usando.** Critério: 10.
   - **Arquivos:** muda `spec.ts`, `mount.ts`, `spec.test.ts`.
   - **O que entra:** `askingOnlyByOwnRule` com o `Object.assign(Object.create(...))` de
     `agent.ts:242-251`, só para quem não tem regra em função. Regras: C26, C73.
   - **Testes:** `spec.test.ts`, o caso do regime do critério 10.
   - **Mutações à mão:** copiar também a ferramenta que tem regra deixa vermelho o caso "a que tem
     regra fica com a sua".
2. **O agente da versão na ficha.** Critério: 10.
   - **Arquivos:** muda `agent.ts`, `tools.ts`.
   - **O que sai:** `neverAsking` e as duas chamadas dele (`:290`, `:301`); o `new Agent` de `:341`.
   - **O que entra:** `runToolsOf` devolve as ferramentas sem a cópia, na mesma ordem; a ficha da
     versão.
   - **Testes:** `approval.test.ts` e os retratos do agente salvo e do Testar, sem mudar.
3. **A conversa na ficha.** Critérios: 10, 4, 17.
   - **Arquivos:** muda `controller.ts`.
   - **O que sai:** `delegatingAgent` (`:137-162`) e o `controllerOf` de `:227-238`.
   - **Pronto quando:** os testes de `B/agents/` e de `B/construtor/` e os retratos verdes.

### Como se prova

Critério 10: `approval.test.ts`, que toca o `yolo: false` e o cartão da escrita pelo Hub de teste; o
caso do regime em `spec.test.ts`; os retratos. Hoje nada falha.

### Parar se

- Uma ferramenta de hoje dentro de `neverAsking` tem regra própria em função que pergunta: pare. A regra nova
  a deixaria perguntar.
- O retrato do Testar muda: pare. O Testar manda o mesmo pedido (a issue 1018 espera por isso).

## G3 O ponto de conferência

Antes do pull request de G3: `npm run check`, os testes de `B/agents/` e de `B/construtor/` e os
retratos. Depois da publicação, o firstmate faz no ar o passo 4 do roteiro (a conversa com o agente
publicado e o cartão da escrita) antes do build de G4.

## U5 O Assistente

**Base e modelo.** `main` depois do merge e da publicação de G3. Opus: o Assistente é o que mais
estica a ficha (os processadores em volta da vez, o ajudante, as skills, o sinal das tarefas).

### As linhas da tabela

- **1, 5. A ficha e a ordem.** Ler `B/assistant/assistant.ts` inteiro (351 linhas) e
  `B/assistant/instructions.ts` inteiro (76).
- **7. As tarefas.** `assistant.ts:256`.
- **14. As skills.** `assistant.ts:249-254`.
- **22. O ajudante.** `assistant.ts:296-305`; `B/assistant/research.ts`.
- **23. A automação.** `B/assistant/context.ts:25-47` (`attended`), `assistant.ts:196-198`, `:214`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `B/assistant/assistant.ts` | Muda: `assistantAgent` e o `controllerOf` viram a ficha | `conversations-of.ts` (sem mudar) |
| `B/assistant/instructions.ts` | Muda: sai `assistantInstructions`; ficam `FIXED`, `MODEL_BLOCKS` e `ASSISTANT_OBSERVER` | `assistant.ts` |
| `B/assistant/turn.ts` | Muda: `assistantTurns` vira o `take` da ficha | `assistant.ts` |
| `B/controller-kit/spec.ts`, `mount.ts`, `spec.test.ts` | Muda: as variantes da U5 | — |

### Os contratos que a unidade cria

As variantes da U5 em `spec.ts`: `BY_MODEL`, `skills`, `signals`, `knowledge`, `processors`,
`own.perRun` e `subagents`. A ficha do Assistente: `prompt` com `FIXED(FIXED)`, `DATA_ORDER`, `BY_MODEL(MODEL_BLOCKS)`
e `OF_RUN(o bloco da conversa)`, este com a recusa `PROMPT_WITHOUT_CONVERSATION` de hoje, agora
antes de ler as ligações escolhidas e o que a pessoa pode (o item 5 da issue 753); `tools` na
ordem de `assistant.ts:233-247`; `skills`; `signals` com `TaskSignalProvider`; `knowledge` e `scopes`, os dois que `companyScopes` devolve (`B/assistant/company-memory.ts:345-353`); `processors` com `companyReadSearch`, `researchOnly` e `profileReadOnlyInRuns` antes da
escolha da conta e `machineUploads` depois (`:209-217`); `turn` `SESSION` com `takeOfScope`; `own` com
`ask_user` e o `perRun` do ajudante; `subagents`; o `workspace` das máquinas; `approval` `NOTHING_ASKS`.

- **Cada estado.** As variantes novas, em `kind`.
- **Cada id.** Nenhum novo.
- **O dono de cada fato.** O bloco por modelo: `MODEL_BLOCKS` (`B/assistant/instructions.ts:39-42`).
  A ordem dos processadores: a ficha do Assistente.
- **O esquema Zod de cada entrada externa.** Nenhuma nova.
- **O arquivo modelo.** `B/controller-kit/run.ts`.

### As skills e a leitura

A skill `mastra`: `signals`, `skills`, `subagents`. Ler primeiro [testing](../guides/testing.md) T5 e
T24.

### A ordem do trabalho

1. **As variantes da U5, sem ninguém usando.** Critério: 9.
   - **Arquivos:** muda `spec.ts`, `mount.ts`, `spec.test.ts`.
2. **O Assistente na ficha.** Critérios: 11, 4, 17.
   - **Arquivos:** muda `assistant.ts`, `instructions.ts`, `turn.ts`.
   - **O que sai:** `assistantAgent` (`:177-260`), o `controllerOf` de `:293-310` e
     `assistantInstructions` (`instructions.ts:49-76`).
   - **Testes:** os de `B/assistant/` e de `B/automations/` e os retratos, sem mudar.
   - **Mutações à mão:** pôr `machineUploads` antes da escolha da conta deixa vermelho o teste de
     hoje dos arquivos da pessoa (`B/assistant/files.test.ts`).
   - **Pronto quando:** o `grep` de `new Agent(` e `controllerOf(` em `assistant.ts` vazio.

### Como se prova

Critério 11: os retratos do Assistente (os cinco cenários) e os testes de hoje, que tocam a busca, o
ajudante, a automação e o bloco do Luna pelo Hub de teste. Hoje nada falha.

### Parar se

- O retrato do Luna muda: pare. O bloco por modelo é o mesmo texto no mesmo lugar.
- A rodada de uma automação muda de caminho (`B/automations/run.ts`): pare. Ela não é desta etapa.

## G4 O ponto de conferência

Antes do pull request de G4: `npm run check`, os testes de `B/assistant/` e de `B/automations/` e os
retratos. Depois da publicação, o firstmate faz no ar o passo 2 do roteiro antes do build de G5.

## U6 O Builder

**Base e modelo.** `main` depois do merge e da publicação de G4. Opus: é o agente mais usado, e a
trava do Projeto e o juiz entram na ficha.

### As linhas da tabela

- **1, 2. A ficha e o construtor de código.** Ler `B/conversation/builder.ts` inteiro (221 linhas),
  `B/conversation/permissions.ts:56-67`, `NM/coding-agent/index.js:219-241`, `S/index.ts:1368-1376`.
- **9. A trava.** `B/conversation/turn-of.ts` depois da U2 (`projectTurn`).
- **11. O juiz.** `builder.ts:195-201`; `B/conversation/processors.ts:116-132`.
- **5. A ordem.** `B/conversation/instructions.ts:29-70`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `B/conversation/builder.ts` | Muda: o `createCodingAgent` e o `controllerOf` viram a ficha | `B/conversation/public.ts` (sem mudar) |
| `B/conversation/permissions.ts` | Muda: sai `TOOL_CLOSURE.initialState`, que o regime escreve | `builder.ts`; `B/conversation/permissions.test.ts:162`, que passa a ler `initialStateOf({ kind: 'NOTHING_ASKS' })` do kit (o único teste de hoje que esta unidade muda) |
| `B/controller-kit/spec.ts`, `mount.ts`, `spec.test.ts` | Muda: `ONE_STRING`, `CODING_AGENT`, `judge` | — |

### Os contratos que a unidade cria

As variantes da U6 em `spec.ts`. A ficha do Builder: `base` `CODING_AGENT`; `prompt` `ONE_STRING` com
`builderInstructions` de hoje; `skills` de hoje (`:176-181`); `model` `SESSION`; `tools` na ordem da
etapa 20 (`:183-192`: `web_fetch`, `conexus_check`, as de web do modelo, as da empresa); `approval`
`NOTHING_ASKS`; `judge` com `conexusCheck` e `strategy: 'all'`; `memory`; `turn` `RUN` com `id:
'conexus-turn'`, `none: 'CONVERSATION_NOT_FOUND'`, `resumes: true` e `projectTurn`; `mode` com
`TOOL_CLOSURE.availableTools`; `own` com `ask_user` e `submit_plan`; o `workspace` do run (`:208-211`).

- **Cada estado.** As variantes novas, em `kind`.
- **Cada id.** Nenhum novo.
- **O dono de cada fato.** A lista fechada do Builder: `TOOL_CLOSURE.availableTools`
  (`permissions.ts:64-67`). O `yolo`: o regime da ficha.
- **O esquema Zod de cada entrada externa.** Nenhuma nova.
- **O arquivo modelo.** `B/controller-kit/run.ts`.

### As skills e a leitura

A skill `mastra`: `createCodingAgent`, `isTaskComplete`. Ler primeiro
`NM/docs/references/reference-coding-agent-create-coding-agent.md` e [testing](../guides/testing.md)
T5 e T14.

### A ordem do trabalho

1. **As variantes da U6, sem ninguém usando.** Critério: 13.
   - **Arquivos:** muda `spec.ts`, `mount.ts`, `spec.test.ts`.
   - **Referência a seguir:** `S/index.ts:1373-1376` (`workspace: undefined` explícito).
   - **Mutações à mão:** tirar a chave `workspace` deixa vermelho o caso do agente de código.
2. **O Builder na ficha.** Critérios: 12, 14, 4, 17.
   - **Arquivos:** muda `builder.ts`, `permissions.ts`.
   - **O que sai:** o `createCodingAgent` de `:166-203`, o `controllerOf` de `:204-217` e
     `TOOL_CLOSURE.initialState`.
   - **Testes:** os de `B/conversation/` e os retratos, sem mudar, fora `permissions.test.ts:162`,
     que troca `TOOL_CLOSURE.initialState` por `initialStateOf`.
   - **Pronto quando:** o `grep` do critério 14 só acha `B/controller-kit/`.
3. **O merge antes da quinta.** Critério: 15. O firstmate mescla e publica G5 antes do build de uma
   quinta, e registra o commit que o build usou.

### Como se prova

Critério 12: os dois retratos do Builder, o do juiz incluído, e `prompt.test.ts`. Critério 13:
`spec.test.ts`. Critério 14: o `grep`. Critério 15: o build da quinta. Hoje nada falha.

### Parar se

- O retrato do Builder muda por uma chave que `createCodingAgent` lê de outro jeito quando a recebe
  `undefined` (`signals`, `outputProcessors`, `errorProcessors`): pare e relate a chave
  (`NM/coding-agent/index.js:220-238`).

## G5 O ponto de conferência

Antes do pull request de G5: `npm run check`, os testes de `B/conversation/` e os retratos duas
vezes. Depois da publicação, o firstmate faz no ar o passo 1 do roteiro antes do build da quinta.

## U7 O molde da troca de modelo

**Base e modelo.** `main` depois do merge e da publicação de G5. Sonnet: três rotas iguais viram um
molde, e cada uma guarda a sua admissão.

### As linhas da tabela

- **17. As rotas.** Ler `B/conversation/routes.ts:113-126`, `B/assistant/routes.ts:295-316`,
  `B/construtor/routes.ts:85-103` e `B/controller-kit/open.ts:88-117` (`changeModel`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `B/controller-kit/routes.ts` | Cria: `serveModelChange` | os três arquivos de rotas |
| `B/conversation/routes.ts`, `B/assistant/routes.ts`, `B/construtor/routes.ts` | Muda: a rota `…/model` pelo molde | — |

### Os contratos que a unidade cria

Em `B/controller-kit/routes.ts`:

```ts
/**
 * The route that puts a conversation on a model and effort (`…/model`), the same for the Builder, the
 * Assistant and the Construtor: the agent's own admission finds the conversation and the marks a
 * recovered session carries, else refuses (S10); then `changeModel`; then the agent's log line.
 */
export function serveModelChange<Op extends ModelChange>(
  app: FastifyInstance,
  operation: Op,
  deps: {
    kind: ControllerKind
    controller: AgentController
    queue: QueueDeps
    owned: (input: Served<Op>) => Promise<{ owner: Owner; id: ConversationId; tags?: Record<string, string> }>
    logged: (input: Served<Op>, about: { companyId: CompanyId; conversationId: ConversationId }) => void
  },
): void
```

`ModelChange` é a união dos três tipos de operação de `packages/hub-api` que existem hoje
(`setConversationModel`, `setAssistantModel`, `setConstrutorModel`), e `Served<Op>` é a entrada que
`serve` (`apps/server/src/platform/http.ts`) dá a cada uma. Nenhuma operação muda.

- **Cada estado.** Nenhum novo.
- **Cada id.** `ConversationId` (marca), achado pela admissão.
- **O dono de cada fato.** A admissão de cada conversa: o arquivo de rotas do agente. A troca:
  `changeModel`. O código de log: o agente.
- **O esquema Zod de cada entrada externa.** Os de `packages/hub-api`, que `serve` já confere.
- **O arquivo modelo.** `B/construtor/routes.ts` (C23 nos ids, C26 na admissão de um lugar só).

### As skills e a leitura

A skill `fastify-best-practices` e a de `zod`, pelas linhas de `docs/reference/stack.md`. Ler primeiro
[security](../guides/security.md) S10.

### A ordem do trabalho

1. **O molde e as três rotas.** Critérios: 16, 4, 17.
   - **Arquivos:** cria `routes.ts`; muda os três arquivos de rotas e `public.ts` do kit.
   - **O que sai:** o corpo das três rotas `…/model`.
   - **O que entra:** cada rota passa a sua admissão de hoje em `owned` e a sua linha de log de hoje
     em `logged`, com os mesmos campos e o mesmo logger (o Builder escreve pelo `input.log`, os outros
     pelo `deps.log`). Regras: S10, C54.
   - **Testes:** os nomeados no critério 16, sem mudar.
   - **Mutações à mão:** chamar `changeModel` antes de `owned` deixa vermelho o caso da conversa de
     outra pessoa.

### Como se prova

Critério 16: os testes de rotas de hoje, pela porta do Hub, com as recusas. Hoje nada falha.

### Parar se

- O tipo de `serve` não deixa um molde genérico sem `as` (code C24): pare e relate; a saída é uma
  função por rota que chama uma parte comum.

## G6 O ponto de conferência

Antes do pull request de G6: `npm run check` e os testes de rotas dos três agentes. Depois da
publicação, o firstmate troca no ar o modelo de uma conversa do Builder, do Assistente e do
Construtor.

## U8 O fechamento

**Base e modelo.** `main` depois do uso. Sonnet: só documento.

### As linhas da tabela

As 8, 9 e 10 (as entradas de `boundaries.md`) e a 5 (a tabela das quatro ordens). Ler
`docs/explanation/harness.md` inteiro, `docs/reference/boundaries.md:929-942` e `:1008-1024`,
`docs/steps/trilhas/agentes-e-apps.md` inteiro e `docs/roadmap.md:61-81`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/explanation/harness.md`, `docs/reference/boundaries.md`, `docs/steps/trilhas/agentes-e-apps.md`, `docs/roadmap.md` | Muda | — |
| `docs/steps/uma-ficha-por-agente.md` | Apaga | — |
| `docs/approvals/uma-ficha-por-agente.md` | Muda: a linha de uso | — |

### Os contratos que a unidade cria

Nenhum.

### As skills e a leitura

[delivery](../guides/delivery.md) L17, L19, L20 e L21.

### A ordem do trabalho

1. **As explicações e as entradas.** Critério: 18.
   - **O que entra:** em `harness.md`, a ficha e a montagem e a tabela das quatro ordens, e a versão
     1.83.0; em `boundaries.md`, a entrada do turno na fila de contas (linha 8) e a da trava do
     Projeto (linha 9), cada uma com a versão do pacote, e o lugar novo da regra na entrada da linha
     10; na página da trilha e no roteiro, o que a seção "O que o fechamento corrige" diz.
2. **As issues.** Tirar desta etapa o que ela levou das issues `next-card`; as que esperam ficam.
3. **A linha de uso** no arquivo de aprovação, e o cartão apagado.

### Como se prova

Critério 18: `npm run docs` e a leitura do diff.

### Parar se

- Uma regra de guia ou de skill precisa mudar: ela espera a fila do método (delivery L20).

## G7 O ponto de conferência

Antes do pull request de G7: `npm run docs` e a leitura do diff contra a seção "O que o fechamento
corrige".
