# O plano que trava e fecha

Trilho: harness

Trilha Agentes e Apps, marco `A3` ([roteiro](../roadmap.md), "O plano que trava e fecha"): o Construtor de apps
não escreve no app enquanto um plano espera a sua aprovação, e não diz "pronto" com um pedido do plano em aberto.
Entram também a pesquisa antes do plano e o plano em fases do app grande (o roteiro põe "pesquisa e plano em
`A3`"), e o Construtor passa a ser o Mastra Code, com as trocas do Conexus nomeadas uma a uma (U8). O Code Mode e o
juiz de fim de turno nos quatro agentes saíram na rodada 2 do quadro. A ordem é a do roteiro: depois do `A2`. A etapa
2 do harness ("Uma sala e os nomes certos") fechou, e as pastas dela já estão no `main`.
Aprovado pelo fundador em 2026-11-25 e emendado com as dez rodadas do quadro de revisão, aprovadas em 2026-11-26;
espera num pull request em rascunho (delivery L5) a vez dele no roteiro: depois do `A2`.

Lido em `main` `30425e2b` (2026-11-26). Versões: `@mastra/core` 1.83.0, `@mastra/server` 1.83.0, `@mastra/pg`
1.36.0. A prateleira do Mastra é a 1.83 (commit `d60ba71b`), com o Mastra Code (`@mastra/code-sdk` 1.19.0) e a
Factory em `mastracode/`. O Mastra Code mais novo, o 0.50.3 (`@mastra/code-sdk` 1.21.0, que sai com o `@mastra/core`
1.86.0, commit `05cad114`), foi lido e rodado no laboratório; o Conexus não instala o `@mastra/code-sdk`, e o que
vem dele entra copiado, com a licença Apache 2.0. Abreviações: `B/` = `apps/server/src/builder/` (o caminho antes da
etapa 2, só em citações antigas); `H/` = `apps/server/src/harness/` e `A/` = `apps/server/src/agents/`; `W/` =
`apps/web/src/harness/room/`; `C/` = `packages/core/src`, `MC/` = `mastracode/sdk/src` e `F/` =
`mastracode/factory/src` na prateleira; `MCD/` = o `dist` do `@mastra/code-sdk` 1.21.0 (Mastra Code 0.50.3); `CD/` =
`node_modules/@mastra/core/dist` na versão instalada. Na tabela do raio de cada unidade os caminhos vão por extenso.

Os estudos, fora do repositório (delivery L21): `conexus-a3-plano-goal-codemode` (o plano, o goal, as guardas e a
pergunta do fundador sobre o modo plano), `conexus-harness-criacao-estudo` (a pesquisa e o plano de um app complexo)
e o relatório da revisão `conexus-a3-decisoes-referencias` (as dez rodadas do quadro; a seção R9 traz o texto de
sistema do Mastra Code 0.50.3 lado a lado com o do Construtor, e a R10 as notas a ele). Antes deles:
`conexus-um-agente-com-modos-estudo` (seções 3.4, 3.5 e anexo H1), `conexus-fim-do-turno-nativo-estudo` e o estudo
do agente geral (cartões 1 a, 2 a e 3 a).

## A página do fundador

**No fim desta etapa** você pede um app novo no Construir, e o Conexus pesquisa nos sistemas, nos dados e na web,
pergunta, escreve o plano com os seus pedidos numerados e espera. A caixa mostra se ele está planejando ou
construindo, e você troca com um toque. Enquanto o plano espera, ele não mexe no app: o próprio Conexus recusa, e o
Código não muda. Você aprova, ele constrói fase a fase seguindo o plano como objetivo, e no fim cada pedido aparece
conferido ou aberto no plano. Um plano que pausou diz por quê e volta com "Continuar o plano". Por dentro, o
Construtor passa a ser o Mastra Code: o mesmo texto de sistema, as mesmas ferramentas e os mesmos ajudantes, com as
trocas do Conexus nomeadas.

**O roteiro de uso.**

1. No Hub da nuvem, num Projeto sem app, abra **Construir**. A caixa mostra "Construindo". Peça "um app de chamados
   internos". O Conexus pesquisa, faz as perguntas, pode pedir um app que você admira como referência, e mostra o
   plano no cartão de sempre, com os pedidos numerados (`P1`, `P2`…) e as fases. A caixa passa a "Planejando".
2. Antes de aprovar, escreva "pode começar já a tela de chamados". Ele responde que espera a sua aprovação, e o
   **Código** não muda.
3. Toque **Aprovar e construir**. A caixa volta a "Construindo" e diz que ele segue o plano; o painel "Tarefas"
   mostra uma tarefa por fase, com os pedidos que ela fecha.
4. No fim, o cartão do plano mostra cada pedido conferido. Se um ficou aberto, aparece aberto, e a última mensagem
   diz qual e por quê. Se o plano pausou, a caixa diz "o plano pausou", com o motivo, e **Continuar o plano** o
   retoma.
5. Toque **Planejar** e peça "troque o título da tela": ele propõe um plano pequeno, e o cartão abre.
6. Volte a **Construindo** e peça outra mudança pequena ("troque a cor do botão"): ele faz direto, sem plano.

**O que você faz, e quando.** Antes: nada. No começo: nada, esta página e as decisões já estão aprovadas ("E eu
aprovo tudo do prompt considere aprovado", 2026-11-26). Depois: vê o protótipo da tela (o fim do plano com cada
pedido conferido, "esperando a sua aprovação", o seletor de modo, o estado do plano na caixa com "Continuar o
plano", o plano substituído, a opção recomendada no cartão de pergunta e os ajudantes na conversa), a 1366 e 390 px
e nos dois temas, e o aprova. Se quiser as medições com modelo real (seção "O custo do Lab"), dá a palavra. No fim:
faz o roteiro, diz o que viu e aprova os textos novos.

**A visão.** A etapa serve a linha da visão em que o Conexus entrega o que a pessoa pediu e mostra o que fez: o
pedido vira plano aprovado e o plano vira conferência. Não abre dado da empresa e não muda permissão de tabela. A
segurança muda em dois pontos. O Hub passa a abrir três rotas nativas do Mastra, atrás do guarda de hoje (S10, S39):
a troca de modo e a leitura e a retomada do objetivo; até aqui ele abria só as da conversa. E o Construtor ganha um
ajudante que escreve, o executor do Mastra Code, que só escreve na máquina do app e só em construir.

**O que as referências fazem, em palavras simples.** O Mastra Code, que o time do Mastra usa, abre em construir.
A pessoa liga o plano, ou o próprio modelo propõe um. Com o plano na mesa, o código tira as ferramentas que escrevem
e recusa escrever fora da pasta de planos. A aprovação troca para construir e põe o plano como objetivo, que um juiz
confere no fim de cada volta. O Claude Code faz igual no essencial e deixa o modelo entrar no plano sozinho. O
Construtor do Conexus já era, em boa parte, o Mastra Code (a máquina por conversa, a memória, as contas, o cache); o
que não seguia era o texto de sistema, escrito do zero. Agora ele segue o texto do Mastra Code, pela própria
biblioteca, e só muda o que é do Conexus, uma troca por motivo.

**Fica de fora.**

- **O Code Mode da plataforma** (as decisões 3 e 4 da aprovação de 2026-11-25 e a U5): "Vamos deixar como suposta feature,
  implementamos isso depois para validarmos com nosso lab e evals" (rodada 2). Vai a uma issue `next-card`, com o
  padrão nativo rastreado (`createCodeMode`, uma lista por peça, o transporte E2B) e a sua resposta B da decisão 4.
  O agente salvo segue com o Code Mode que já tem (`A/saved-agent/code-mode.ts`, só leituras). Com ele saem a busca
  de funções do Mastra Connect, as ferramentas que a Factory tira das sessões e o programa no próprio processo
  (O7, O8 e O9).
- **O juiz de fim de turno nos quatro agentes** (a U4) e as tarefas escritas pelo servidor (F1 e F3): nenhuma
  referência tem juiz por código de tarefa aberta, e o Mastra Code confia no texto e no goal (rodada 2, seção 7). A
  linha do `A3` no roteiro ainda diz "O juiz de fim de turno roda nos quatro agentes"; o firstmate a muda com a sua
  palavra, fora deste cartão.
- **As ferramentas do Mastra Code que não entram** (FER A, rodada 8): as conexões entre agentes (F1, só funcionam
  entre processos do mesmo computador), o `request_access` (F2, a pasta do app é a única da pessoa), os fluxos (F3,
  rodam no servidor e cruzam a fronteira entre o app e o Hub; cartão próprio de automação), as agendas (F5, o
  Construtor rodaria sozinho na conta da empresa), as do GitHub (F6, "git sim, github não, por agora") e as de MCP
  (F7, pedem uma tela de configuração; cartão próprio se você quiser). O navegador (F8) entra pelo cartão já
  aprovado da etapa 3 do harness, "a rede e o navegador sob pedido".
- **O modo rápido do Mastra Code** ("Explore"), os ganchos de `hooks.json` e os plugins: quem usa não pergunta sobre
  o código, quem usa não programa, e a Factory também não os tem (rodada 5, R5a).
- **O texto base nos outros três agentes**: o Assistente e o Construtor de agentes passam a ele no `A6` (cartão 3 a
  do estudo do agente geral). O Assistente fica com o ajudante "pesquisar" de hoje até lá.
- **Um idioma fixo por empresa**: o Construtor responde no idioma de quem escreve; uma configuração de idioma da
  empresa, como a `language` do Claude Code, entra quando uma empresa pedir (rodada 10).
- **A atualização do Mastra para 1.86** (rodada 6): a U8 não depende dela; vai num pull request próprio, por uma issue.
- **A rede sob pedido na máquina** (O1): a sua resposta (B, a lista da empresa em Configurações) mexe em segurança e
  emenda a decisão 0051; vai ao cartão da etapa 3 do harness.
- **Os detectores prontos do Mastra** (O2): cada um chama um modelo a cada mensagem, na conta da empresa, e a recusa
  dele fecha a resposta sem nada na tela.
- **A issue 1017** (o bloco por modelo da OpenAI): continua fora; o espaço nativo do bloco do modelo fica vazio para o
  Claude.
- **A issue 1018** (o Testar do Construtor no ChatGPT, O4): pede prova paga.
- **A issue 1327** (o Construtor escreve em inglês entre as ferramentas, O5): com a rodada 10 o idioma segue o de quem
  escreve; a prova pede modelo real e vai à primeira rodada de Lab depois desta etapa.
- **O supervisor** (O6): é do `A6`.
- **A skill que vira goal** (`metadata.goal: true` do Mastra Code): uma ideia para um cartão futuro (rodada 7).
- **As issues `next-card` que esta etapa não toca.** Entram: a 1286 (item 2, na U1), a 1175 (as gravações `plan` e
  `tasks`, na U3), a 1016 (a U6), a 1334 (o comentário do molde, na U8) e o item 4 da 1420 (o nome do Construtor no
  pedido, na U8). Esperam: a 1164 (a máquina de outra conversa que não anda com o `main`), porque nenhuma unidade
  mexe na gravação da versão; a 1333 e a 1335 (o DNS e a regra de rede da máquina), porque a rede vai ao cartão da
  etapa 3 do harness; a 1334, na parte de levar o cache aos comandos do modelo, porque pede medir uma instalação; os
  itens 1, 2, 3 e 5 da 1420 (o menu das listas e o nome do botão), porque a etapa não toca as listas nem o botão; e o
  item 4 da 1420 nos outros dois agentes, que mudam de texto no `A6`.

**As decisões suas nesta etapa.** Respondidas no quadro desta etapa em 2026-11-25 e, na revisão, em dez rodadas até
2026-11-26; a última palavra: "E eu aprovo tudo do prompt considere aprovado". Cada opção respondida é a A, salvo onde
está escrito. As palavras vão ao [arquivo de aprovação](../approvals/o-plano-que-trava-e-fecha.md).

- **1. Quando o Construir planeja, e o que trava (refeita na rodada 2, opção A).** Toda conversa começa em
  construir, inclusive a de um app novo. O plano começa quando você toca "Planejar" ou quando o Conexus o propõe num
  pedido grande; quando planejar fica no texto, como no Mastra Code. Com um plano na mesa, a escrita trava por código
  até "Aprovar e construir". A caixa mostra o modo. A mudança pequena segue direto. Nativo: os modos do controlador
  com `transitionsTo`, a rota de troca de modo do Mastra e a guarda do Mastra Code. Veredito: igual ao Claude Code e
  ao Mastra Code; propor um plano trava, como o `EnterPlanMode` do Claude Code.
- **2. Os nomes dos modos (U1, rodada 3).** "Mas não é melhor modo construir do que conversa": `plano` e `construir`.
  Uma conversa guardada com `conversa` abre em `construir`, sem migração (`C/agent-controller/session.ts:1407-1410`).
  Veredito: igual ao Mastra e ao Codex.
- **3. As guardas (U2, rodada 2).** Ficam as três do Mastra Code: a lista de ferramentas do modo plano, a guarda que só
  deixa escrever `.md` na pasta de planos e a recusa que diz onde escrever. Saem as duas sem referência (o plano
  aprovado imutável e o reenvio recusado); no lugar, uma cópia do plano aprovado no estado do fio, que o goal e o
  cartão leem. Entra a recusa do Dyad: "Aprovar e construir" recusa um plano que mudou desde que o cartão abriu. E a
  regra do Lovable: um plano novo fecha o anterior como "substituído".
- **4. Quem confere o plano no fim (com a correção da rodada 1, os números da rodada 2 e o M1 da rodada 7).** O
  plano aprovado vira o objetivo do fio. O juiz é o modelo da conversa, na conta da empresa, com as ferramentas de
  leitura do Mastra Code, até 50 rodadas e até 1000 passos do juiz por fim candidato. No Construtor, a conferência do
  app aprovada no `A1` roda antes. Veredito: nativo, igual ao Mastra Code. A Factory diverge: lá a aprovação não abre o
  goal (`F/factory.ts:1781-1782`).
- **5. O juiz das tarefas abertas (U4, F1 e F3, rodada 2): saem.** O modelo escreve a lista; a skill do plano pede uma
  tarefa por fase, com os pedidos que ela fecha, como as tarefas do Kiro citam os requisitos. As frases de
  `task_check` ficam no texto, como no Mastra Code.
- **6. A pesquisa antes do plano e o plano do app grande (D5 e D6, rodada 1, como estão).** A skill do plano ganha a
  etapa Pesquisar; um plano por rodada, a Ordem em fases, uma aprovação, constrói até cada pedido conferido. Com a
  rodada 8, a pesquisa é feita pelo próprio Construtor, com as leituras do Conexus, a web e os ajudantes.
- **7. As ferramentas (FER A, rodada 8; AVISO A, rodada 10).** Toda ferramenta do Mastra Code entra no Construtor,
  menos F1, F2, F3, F5, F6 e F7 ("Fica de fora"). A caixa de avisos (`notification_inbox`) entra igual: "Porque
  sair?". Entram a `web_fetch`, o `lsp_inspect` e a edição pela árvore do código.
- **8. Os ajudantes e o modelo deles (SUBM A, rodada 8).** Os três do Mastra Code: o explorador e o planejador, que só
  leem, e o executor, que escreve. O explorador roda no modelo leve do fornecedor da conversa, pela mesma escolha que a
  memória já faz; o planejador e o executor, no modelo da conversa. Substitui o "pesquisar" nos quatro agentes da
  rodada 2 (D7).
- **9. O modo plano (FER A, rodada 8, no lugar do M3 da rodada 7).** A lista do modo plano do Mastra Code, mais o
  `lsp_inspect`, as leituras do Conexus, a web e o explorador e o planejador; o executor é recusado no plano. Veredito:
  desvio do Mastra Code na direção do Claude Code, pela sua palavra ("pra mim não faz sentido não deixar subagents e
  não deixar web_fetch").
- **10. O plano na caixa (M2, rodada 7).** A caixa mostra "seguindo o plano", "conferindo o plano" e "o plano pausou"
  com o motivo; "Continuar o plano" retoma pela peça nativa, sem zerar as rodadas; Parar enquanto o juiz decide pausa
  o plano; enquanto o juiz decide, a caixa espera.
- **11. O Construtor igual ao Mastra Code (O3, refeito nas rodadas 5, 8 e 9; O3 A na rodada 9).** "Prefiro seguir
  mastra code ele funciona time do mastra todo usa, quero seguir ELE IGUAL." O texto base é o `buildBasePrompt` da
  biblioteca, com as trocas nomeadas; o bloco do Construtor vai no espaço do anfitrião; o texto base mora na harness,
  e o Construtor é o primeiro a usá-lo. A regra de anunciar cada grupo de ferramentas sai, e vale a do Mastra Code.
- **12. A primeira linha, o idioma, o `tail` e o `lsp_inspect` (ID A, TAIL A e as notas da rodada 10).** A primeira
  linha: "You are Conexus, an agent working with the user toward their goals, using your own judgment along the way."
  Nenhuma linha fixa idioma. A linha do `tail` volta, sem "the full output streams to the user". O bloco do
  `lsp_inspect` é o nativo, inteiro.
- **13. O AGENTS.md e o MEMORY.md (rodada 5; MEMORY.md A).** O AGENTS.md fica igual ao Mastra Code: no texto de
  sistema, sob "# Agent Instructions", relido a cada pedido do `main`. O MEMORY.md fica como hoje: o índice no texto, ao
  lado do AGENTS.md, e o detalhe lido pela ferramenta.
- **14. O Mastra Code 1.21.0 em três peças (rodada 6).** O plano recusado com comentário volta ao modelo na mesma
  volta; os detalhes do `submit_plan`; a marca de recomendação numa opção da pergunta.
- **15. O que ficou como estava (rodada 2).** U6, U7, as decisões S2 e "o painel de tarefas some sem tarefa", X1 a X5,
  "Fica de fora" O1, O2 e O4 a O9, e o O10, a primeira rodada do Lab, que está em "O custo do Lab".

**O que mudou desde a aprovação de 2026-11-25.**

- A conversa não começa mais travada: construir é o padrão, o modo aparece na caixa e você troca com um toque.
- Os modos se chamam `plano` e `construir`.
- O plano aprovado não fica imutável no disco: fica uma cópia no estado do fio. Entram a recusa do Dyad e o
  "substituído".
- O goal usa os números do Mastra Code (50 rodadas, até 1000 passos), e o juiz é o modelo da conversa.
- Saem o Code Mode (U5, decisões 3 e 4), o juiz nos quatro agentes (U4) e as tarefas escritas pelo servidor.
- O passo 6 do roteiro (a conta nas Conversas) sai; entram "Planejar" e a mudança pequena em construir.
- Entra a U8: o Construtor igual ao Mastra Code, com as ferramentas dele, os três ajudantes, o texto dele e as trocas
  do Conexus.
- A caixa ganha o estado do plano e "Continuar o plano".
- O Hub abre três rotas nativas do Mastra, atrás do guarda.

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| P1 | U1 | Os dois modos do Construtor de apps, `construir` (o padrão) e `plano`, com `transitionsTo: 'construir'`; toda conversa começa em `construir`; uma guardada com `conversa` abre em `construir`; um `submit_plan` em `construir` passa a sessão a `plano` antes de suspender; a rota nativa de troca de modo, atrás do guarda; os outros três seguem com `conversa` | `H/spec/`, `H/routes/`, `A/app-builder/` | testing | o fechamento do `A2` |
| P1 | U2 | As guardas: em `plano`, o gancho da máquina recusa escrever fora de `.conexus/plans/*.md`, com a recusa que diz onde escrever; a cópia do plano aprovado no estado do fio; a recusa do Dyad, no guarda do Hub, antes de o Mastra ver a aprovação; a aprovação de um plano substituído recusada | `H/machine/`, `H/routes/`, `A/app-builder/`, `packages/hub-api/src/`, `W/` | testing | U1 |
| P1 | U3 | A pesquisa e o plano numerado: a skill do plano ganha a etapa Pesquisar, os pedidos `P1…Pn`, as fases, as Referências e uma tarefa por fase com os pedidos dela; o `submit_plan` recusa um plano sem pedidos; a aprovação põe a cópia do plano como objetivo do fio, com o juiz do goal | `A/app-builder/`, `H/spec/`, `packages/app/skills/`, `packages/hub-api/src/` | testing | U2 |
| P1 | U6 | As recusas como erro da ferramenta (FERR-2 e AGT-7 da auditoria, issue 1016): a recusa do fornecedor chega ao modelo pelo caminho nativo do erro (C79), com uma dona | `H/tools/`, `A/*/`, `W/` | testing | U3 |
| P1 | U8 | O Construtor igual ao Mastra Code: nasce de `createCodingAgent`; o texto de sistema é o `buildBasePrompt` com as trocas nomeadas, o guia das ferramentas e os textos dos modos copiados com a licença; o bloco do lugar no espaço do anfitrião; o AGENTS.md e o índice do MEMORY.md como hoje; as ferramentas de cada modo com os nomes curtos; os três ajudantes; as três peças da 1.21.0 | `H/prompt/`, `H/spec/`, `H/machine/`, `H/model-accounts/`, `A/app-builder/`, `packages/hub-api/src/`, `W/`, `infra/e2b/` | testing | U1, U2, U3, U6 |
| P1 | U7 | O plano na tela: cada pedido conferido ou aberto no fim; "esperando a sua aprovação"; o seletor de modo; o plano substituído; o estado do plano na caixa e "Continuar o plano"; a opção recomendada; as rotas nativas do objetivo atrás do guarda | `W/`, `apps/web/src/agents/app-builder/`, `packages/hub-api/src/`, `H/routes/` | design | U3, U8, o protótipo |

Um grupo só, um pull request, com um commit por unidade, nesta ordem: U1, U2, U3, U6, U8, U7. Delivery L9 manda "the
fewest pull requests L2 allows" e diz que "a group splits only past L2, never to run in parallel what one builder
builds"; a etapa tem cerca de 2.900 linhas, dentro das 4.000 de L2, e a espera pelo protótipo ou a ordem entre as
unidades não é motivo de L9 para dividir. O pull request abre com a U1, e a revisão segue commit a commit; a U7 entra
depois de o protótipo ser aprovado. As unidades U4 e U5 saíram na rodada 2; os números ficam, para o quadro e o cartão
falarem das mesmas unidades.

**Orçamento de código alterado.** Estimativa, sem testes nem retratos. U1: 200 (a rota de modo, 20). U2: 260 (menos
40: sai a leitura por `getMessages`; menos as duas guardas sem referência; mais 80: a versão do plano no guarda e no
cartão). U3: 300, mais a skill do plano (250); sai
o ajudante de pesquisa (150) e a escrita das tarefas pelo servidor. U6: 250 (menos 80: as cópias de AGT-7). U8: 900 a
1.300 (rodada 8): os três textos copiados (cerca de 500), as trocas, os nomes curtos na constante, na tela e nos
testes, o processador do plano recusado, as três definições de ajudante e o modelo deles (150), os rótulos na tela
(100), o servidor de linguagem no modelo da máquina e o seu teste (100 a 200), o texto base na harness com a chave (50 a
120). U7: 450 a 550 (o seletor, o substituído, a marca da pergunta e o plano na caixa, 150 a 250). Total: cerca de
2.900 linhas (2.600 a 3.100), dentro das 4.000 de delivery L2. Saíram a U4 (200) e a U5 (150).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Toda conversa nova do Construir começa em `construir`, também a de um Projeto sem versão salva | `A/app-builder/conversation-plan.test.ts`, "a conversa começa em construir" | must |
| 2 | U1 | Uma conversa guardada com `currentModeId: 'conversa'` abre em `construir`, sem migração | idem, "a conversa guardada abre em construir" | must |
| 3 | U1 | `POST …/agent-controller/:controllerId/sessions/:sessionId/mode` com `plano` troca o modo, e o `GET` da sessão o devolve. **Recusa:** um `modeId` que não é do Construtor é recusado com `REQUEST_MALFORMED`; a mesma rota no controlador de outro agente é recusada com `REQUEST_MALFORMED`; quem não conversa no Projeto recebe a recusa do guarda (S10). Rota: a mesma | `H/routes/guard.test.ts`, "a troca de modo", "a troca de modo de outro modo", "a troca de modo de outro controlador"; `conversation-plan.test.ts`, "a pessoa troca o modo" | must |
| 4 | U1 | Um `submit_plan` chamado em `construir` passa a sessão a `plano` antes de suspender | `conversation-plan.test.ts`, "propor um plano trava" | must |
| 5 | U1 | "Aprovar e construir" passa a sessão a `construir` pela rota nativa `tool-suspension`, e a escrita volta; "Pedir ajustes" deixa em `plano` | idem, "aprovar destrava, pedir ajustes não" | must |
| 6 | U1 | O Assistente, o Construtor de agentes e o agente salvo seguem com um modo só, `conversa`, e o pedido deles ao modelo não muda | os três `request.test.ts`, iguais | must |
| 7 | U2 | **Recusa.** Em `plano`, o modelo (dublê) chama `write_file` ou `string_replace_lsp` fora de `.conexus/plans/*.md`: o resultado é a recusa que diz onde escrever, e a pasta do app na máquina não muda; `delete_file`, `mkdir`, `ast_smart_edit` e `execute_command` não são oferecidos. Na U2 os nomes ainda são os de hoje (`WORKSPACE_TOOL.writeFile` e `editFile`; `delete`, `mkdir` e `executeCommand` fora da lista); a U8 troca os nomes no teste. Rota: `POST …/sessions/:sessionId/messages` | `conversation-plan.test.ts`, "o modelo tenta escrever antes da aprovação" | must |
| 8 | U2 | Editar o arquivo de um plano aprovado não muda o plano aprovado: o cartão e o objetivo mostram a cópia guardada no estado do fio | idem, "a cópia do plano aprovado" | must |
| 9 | U2 | A cópia sobrevive à memória observacional que dobrou a conversa (TURN-2) | idem, com o dublê de observação | must |
| 10 | U2 | **Recusa.** "Aprovar e construir" leva a versão do plano que o cartão mostrou (`planVersion`); quando o arquivo do plano na máquina mudou desde então, o guarda do Hub recusa a rota com `{ ok: false, reason: 'plan_changed', current }`, o Mastra não retoma a ferramenta, o `GET` da sessão devolve `plano`, e o cartão mostra a versão atual para aprovar. Rota: `POST …/sessions/:sessionId/tool-suspension` | `conversation-plan.test.ts`, "o plano mudou antes da aprovação"; `H/routes/guard.test.ts`, "a aprovação de um plano que mudou"; `W/plan-card.test.tsx` (novo), "o plano mudou" | must |
| 11 | U2 | **Recusa.** Com dois planos propostos, a resposta ao mais antigo é recusada; só o mais novo se aprova. Rota: `POST …/tool-suspension` | idem, "o plano substituído" | must |
| 12 | U3 | **Recusa.** Um plano sem a lista de pedidos `P1…Pn` volta ao modelo com o motivo e não abre o cartão | idem, "o plano sem pedidos numerados" | must |
| 13 | U3 | A skill do plano tem a etapa Pesquisar, os pedidos `P1…Pn`, as fases e as Referências, e pede uma tarefa por fase que cite os pedidos que ela fecha | `packages/app/src/skills.test.ts`, o caso novo | must |
| 14 | U3 | Aprovado o plano, o objetivo do fio é a cópia do plano, com `maxRuns` 50, o juiz no modelo da conversa e `maxSteps` 1000; o juiz roda só depois da conferência do app (`A1`) | `A/app-builder/conversation-goal.test.ts` (novo), com o dublê de modelo | must |
| 15 | U3 | **Recusa.** O juiz do goal só lê: as ferramentas dele são `view`, `search_content`, `find_files` e `file_stat` (mais `lsp_inspect` depois da U8), e nenhuma escreve | idem, "o juiz só lê" | must |
| 16 | U3 | **Recusa.** Com uma tarefa aberta, o fim do turno pontua 0 e o motivo volta ao modelo, até `CHECK_LIMITS.checks`; na última, a versão é salva como não terminada (o de hoje, do `A1`, nas fases) | `A/app-builder/conversation-judge.test.ts` | must |
| 17 | U6 | **Recusa.** A recusa de um fornecedor chega ao modelo como erro da ferramenta nos quatro agentes, com o corpo cortado: o pedido seguinte ao dublê leva o resultado da ferramenta marcado como erro; a linha da tela diz a recusa como hoje | `H/tools/connectors/connector-tools.test.ts`, o caso de `:258` regravado, "a recusa do fornecedor chega como erro da ferramenta"; `A/app-builder/conversation-connectors.test.ts`, "a recusa chega ao modelo como erro" (caso novo); os quatro `request.test.ts`; `W/data-specs.test.tsx`, a linha da recusa | must |
| 18 | U8 | O texto de sistema do Construtor é a saída de `buildBasePrompt` (`productName: 'Conexus'`, `planApprovalStartsGoal: true`, `hasSubagents: true`) com as trocas da seção U8, mais o guia das ferramentas e os textos dos modos copiados; um teste falha quando uma troca não acha o seu trecho, e cada seção que sai ou muda está listada no teste, com o motivo | `A/app-builder/request.test.ts`, o texto de sistema no pedido ao dublê, seção a seção com `BASE_PROMPT_SWAPS` | must |
| 19 | U8 | A primeira linha é "You are Conexus, an agent working with the user toward their goals, using your own judgment along the way."; nenhuma frase fixa idioma; a linha do `tail` está, sem "the full output streams to the user"; os blocos do `lsp_inspect` e da `notification_inbox` são os nativos, palavra por palavra | `A/app-builder/request.test.ts`, o retrato | must |
| 20 | U8 | O bloco do lugar vem no espaço do anfitrião, logo depois do texto base; o AGENTS.md do app vem sob "# Agent Instructions", lido do `main` a cada pedido e cortado em 8 KB; o índice do MEMORY.md vem sob "# Project memory", cortado em 200 linhas ou 16 KB | `A/app-builder/prompt.test.ts` | must |
| 21 | U8 | O pedido ao modelo leva as ferramentas de cada modo da tabela da U8 (35 em `construir`, 22 em `plano`), com os nomes curtos do Mastra Code; F1, F2, F3, F5, F6 e F7 não estão, e o guia omite o bloco delas; a tela mostra cada ferramenta como hoje | `A/app-builder/request.test.ts`, um retrato por modo; `W/tool-registry.test.ts` | must |
| 22 | U8 | **Recusa.** O explorador e o planejador não escrevem: uma escrita deles é recusada. O executor escreve só em `construir`: em `plano`, chamá-lo é recusado. Em `plano`, o Construtor busca na web e chama o explorador. A tela mostra cada ajudante como "Pesquisando", "Planejando" ou "Executando", com o pedido. Visto de fora: pela rota de mensagens, o dublê pede o `subagent`, e o pedido do ajudante chega ao dublê com as ferramentas dele; o resultado da escrita recusada volta no pedido seguinte | `A/app-builder/subagents.test.ts` (novo), pela rota de mensagens; `W/tool-registry.test.ts` | must |
| 23 | U8 | O explorador roda no modelo leve do fornecedor da conversa, pela escolha da memória; o planejador e o executor rodam no modelo da conversa. Visto de fora: o dublê guarda cada pedido, e o campo `model` do pedido de cada ajudante diz onde ele rodou | idem, "o modelo de cada ajudante" | must |
| 24 | U8 | Um plano recusado sem comentário para o laço na mesma volta; com comentário, o Construtor refaz o plano e o manda de novo, como no Mastra Code 1.21.0 | `conversation-plan.test.ts`, "pedir ajustes com motivo" | must |
| 25 | U8 | **Recusa.** O `submit_plan` tem a descrição do núcleo, recusa um plano vazio e devolve a recusa marcada como erro | idem, "o plano vazio" | must |
| 26 | U8, U7 | Uma pergunta pode marcar no máximo uma opção com `recommended: true`, e o cartão de pergunta a destaca; uma segunda marca é recusada na borda: pela rota de mensagens, o dublê chama `ask_user` com duas marcas e recebe a recusa no pedido seguinte, e nenhum cartão abre | `A/app-builder/conversation-questions.test.ts`, "duas opções recomendadas" (caso novo); `W/question-card.test.tsx` (novo) | must |
| 27 | U8 | A chave das instruções de código nasce na ficha, ligada no Construtor; o teste monta o texto nas duas posições | `A/app-builder/request.test.ts`, "a chave das instruções de código", o texto no pedido ao dublê com a chave ligada e desligada | must |
| 28 | U8 | A `ast_smart_edit` edita um arquivo da máquina pela árvore do código, rodando no servidor: pela rota de mensagens, o dublê a chama, e o arquivo na máquina de teste muda | `A/app-builder/conversation-machine.test.ts`, "a edição pela árvore do código" (caso novo) | must |
| 29 | U8 | A `notification_inbox` responde vazia, e a tabela de avisos (`mastra_notifications`) existe no banco do Conexus como as outras do Mastra, sem chave estrangeira para tabela nenhuma: o `generateTableSQL` do `@mastra/pg` 1.36.0 não escreve `REFERENCES` (`@mastra/pg/dist/index.js:2800-2888`), e o teste confere no catálogo que a tabela não tem `FOREIGN KEY` | `A/app-builder/conversation-tools.test.ts`, o caso novo, pela rota de mensagens e pelo catálogo do banco de teste | must |
| 30 | U8 | Os retratos `request.test.ts` do Construtor mudam só no texto, nos nomes e nas ferramentas, com a diferença listada no pull request; os dos outros três agentes mudam só no texto da recusa da U6 | os quatro `request.test.ts` | must |
| 31 | U8 | Com modelo real, um pedido em inglês recebe resposta em inglês, e um em português, em português | o Lab, medição 3 | should |
| 32 | U8 | Com modelo real, numa máquina E2B, a `string_replace_lsp` devolve um erro de TypeScript depois de uma edição errada, e o `lsp_inspect` responde | o Lab, medição 4 | should |
| 33 | U7 | Na tela, cada pedido do plano aprovado aparece conferido ou aberto no fim, pela lista de tarefas do modelo (um pedido que nenhuma tarefa concluída cita aparece aberto); enquanto o plano espera, a caixa diz que o Conexus espera a sua aprovação | `W/plan-card.test.tsx` (novo); captura a 1366 e 390 px, os dois temas | must |
| 34 | U7 | O seletor da caixa mostra "Construindo" ou "Planejando" e troca o modo pela rota do critério 3 | `W/composer.test.tsx` | must |
| 35 | U7 | Um plano novo fecha o anterior como "substituído", sem os botões | `W/plan-card.test.tsx` (novo), "o plano substituído" | must |
| 36 | U7 | A caixa mostra "seguindo o plano", "conferindo o plano" e "o plano pausou" com o motivo; "Continuar o plano" retoma o objetivo, e as rodadas usadas não voltam a zero; Parar enquanto o juiz decide pausa o objetivo; enquanto o juiz decide, a caixa espera | `W/composer.test.tsx`; `H/routes/guard.test.ts`, "a retomada do objetivo" | must |
| 37 | U7 | **Recusa.** `PUT …/sessions/:sessionId/goal` com `judgeModelId` ou `maxRuns` é recusado pelo guarda; `POST` e `DELETE` do mesmo caminho dão 404; quem não conversa no Projeto recebe a recusa do guarda | `H/routes/guard.test.ts` | must |
| 38 | U1 | **Recusa.** Uma mensagem numa conversa que o índice do Hub não acha recebe `CONVERSATION_NOT_FOUND`, e nenhum turno roda (issue 1286, item 2). Rota: `POST …/sessions/:sessionId/messages` | `A/app-builder/conversation-turns.test.ts`, "a conversa que o índice não acha" (caso novo) | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Cartão do plano | o plano com os pedidos e as fases, "Aprovar e construir" e "Pedir ajustes" | não existe sem plano | o envio da resposta, como hoje | a resposta não chegou: o aviso de hoje | o plano saiu do disco: o texto guardado na suspensão, e só "Pedir ajustes" (a aprovação volta `plan_changed` sem versão atual) | quem não conversa no Projeto não vê a conversa (o guarda, S10) | ajustes pedidos: o cartão fechado com o motivo; substituído: fechado, sem botões; aprovação recusada porque o plano mudou: a versão atual para aprovar; aprovado: cada pedido conferido ou aberto no fim |
| Caixa da conversa | "Peça ao Conexus…", com o seletor em "Construindo" | — | — | a troca de modo falhou: o seletor volta ao modo de antes, com o aviso de hoje | — | — | esperando a aprovação: o texto novo, e a caixa aceita mensagem (o Mastra a guarda até a resposta) |
| O plano na caixa | — | sem objetivo: nada | "conferindo o plano": a caixa espera | o juiz falhou: "o plano pausou", com o motivo | — | — | "seguindo o plano"; "o plano pausou" com o motivo e "Continuar o plano"; feito: some |
| Painel de tarefas | as tarefas que o modelo escreveu, cada uma com os pedidos que cita | some sem tarefa | — | — | — | — | — |
| Cartão de pergunta | as opções, a recomendada destacada | — | como hoje | como hoje | — | — | como hoje |
| Linha do ajudante | "Pesquisando", "Planejando" ou "Executando", com o pedido | — | a linha em andamento, como a do "pesquisar" de hoje | a falha do ajudante, como hoje | — | — | o executor recusado no plano: a recusa |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| o modo da sessão (`currentModeId`) | U1, no começo, no `submit_plan` e na rota; o Mastra, na aprovação | a guarda (U2), o `availableTools` do Mastra, o seletor (U7) |
| a cópia do plano aprovado (`threadState` `conexus-approved-plan`) | U2, na aprovação | o objetivo (U3), o `activePlan` do texto de construir (U8), o cartão (U7) |
| o texto do plano no suspend do `submit_plan` | U2 | o cartão (U7) |
| a versão do plano (`planVersion`, o SHA-256 do arquivo, no suspend do `submit_plan` e no `resumeData` da aprovação) | U2, no suspend; o cartão, ao aprovar | o guarda do Hub (U2), que a compara com o arquivo na máquina |
| a versão atual, na recusa do guarda (`{ ok: false, reason: 'plan_changed', current: { title, plan, planVersion } \| null }`) | o guarda (U2) | o cartão (U2), que a mostra para aprovar |
| o pedido do plano (`P1…Pn`, no suspend do `submit_plan`) | U3 | o cartão (U7) |
| as fases do plano (`phases`, `{ title, requests }[]`, no suspend do `submit_plan`) | U3 | o cartão (U7), que mostra as fases |
| o plano substituído (o `state: 'superseded'` do `PlanCardItem`, `W/rows.ts`): um `submit_plan` que não é o último da conversa | a sala (U7), pela transcrição | o cartão (U7); a mesma regra no servidor, pelas suspensões pendentes (U2, firstmate 3) |
| o estado do plano na caixa (`PlanGoal`, `packages/hub-api/src/goal.ts`) | a sala (U7), pelo `GET …/goal` e pelo pedaço `goal` do fluxo | a caixa (U7) |
| a retomada e a pausa (`GoalStatusPut`, o corpo do `PUT …/goal`) | a caixa (U7) | o guarda (U7), que recusa o resto |
| a tarefa (`threadState` `task`), com os pedidos que cita | o modelo, por `task_write` e `task_update` | o juiz por código (`A1`), o painel e o cartão (U7) |
| o objetivo do fio (`threadState` do goal) | U3, na aprovação; a pessoa, por "Continuar o plano" (U7) | o passo `goal` do Mastra, a caixa (U7) |
| a marca `recommended` de uma opção | o modelo, pela `ask_user` (U8) | o cartão de pergunta (U7) |

Muda uma tela, a da conversa: o cartão do plano, a caixa com o seletor e o plano, o cartão de pergunta e a linha do
ajudante. Protótipo antes, a 1366 e 390 px e os dois temas (sua decisão B, 2026-11-22), sobre `W/plan-card.tsx`,
`W/composer.tsx`, `W/task-panel.tsx`, `W/question-card.tsx` e `W/research-specs.ts`, com as peças de `ui/` que eles já
usam.

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| A resposta ao `submit_plan` (rota nativa `tool-suspension`) | duas abas aprovam: o Mastra reivindica a suspensão uma vez, e a segunda recebe `not_pending` (`node_modules/@mastra/server/dist/server/handlers/agent-controller.js:792-796`); a trava é de um processo só (`CD/agent-controller-BhkzVgCi.js:6166`) | o plano mudou: o guarda do Hub recusa a rota com `plan_changed` antes de o Mastra ver a aprovação, e o modo fica `plano` | o banco fora: a resposta falha e o cartão fica aberto; a máquina fora: o guarda não lê o arquivo e recusa com `plan_changed` e `current: null` | o código de falha da rota | 5, 10, 11 |
| A conferência da versão no guarda | duas abas aprovam a mesma versão: as duas passam o guarda, e o Mastra aceita só uma (a linha de cima) | o arquivo muda entre o guarda e a retomada: a execução está suspensa, e nada no Conexus escreve na máquina enquanto o plano espera | a máquina fora: a recusa com `current: null`, e o cartão fica aberto | a linha da recusa, com o código `plan_changed`, sem o texto do plano (S41) | 10 |
| A troca de modo (rota nativa, `submit_plan` em `construir` e aprovação) | a aprovação e uma mensagem nova: o Mastra troca pelo modo em que o plano foi enviado (`CD/agent-controller-BhkzVgCi.js:6423`); duas trocas pela rota: vale a última | o fio não está ativo: `setThreadSetting` (`CD/agent-controller-BhkzVgCi.js:6427-6431`) | o banco fora: a rota falha e o seletor volta; no `submit_plan`, a troca falha e a ferramenta devolve o erro sem suspender | o código de falha da rota | 3, 4, 5, 34 |
| A cópia do plano aprovado e o objetivo | a mesma aprovação duas vezes: escrever de novo dá o mesmo estado | gravados antes de retomar a ferramenta: uma falha no meio não retoma, e a resposta seguinte grava de novo (X3, como a Factory) | o banco fora: a aprovação falha inteira, e o cartão fica aberto | a linha do turno com o código | 8, 9, 14 |
| O juiz do goal | — | a conta da fila acaba no meio: o goal pausa sem gastar rodada (`C/loop/shared/steps/goal-core.ts:553-565`) | o modelo fora: o goal pausa com o motivo; a conferência do app já decidiu | a linha do turno com a rodada | 14, 36 |
| A retomada do objetivo (`PUT …/goal`) | dois toques: o segundo acha o objetivo já ativo | um campo além de `status`: a recusa do guarda | o banco fora: o objetivo segue pausado, e o botão volta | o código de falha da rota | 36, 37 |
| A escrita recusada pela guarda, e o executor recusado no plano | — | — | — | nada: a recusa é o resultado da ferramenta (X5) | 7, 22 |
| A escrita do executor na máquina | duas escritas no mesmo arquivo: a máquina avisa o conflito, como nas outras escritas (`H/machine/machine-sync.test.ts:73`) | recusado em `plano`: a guarda da U2, antes de escrever | a máquina fora: o erro da ferramenta, e o ajudante devolve a falha ao Construtor | o erro da ferramenta | 22 |
| As tarefas do modelo (`threadState` `task`, por `task_write` e `task_update`) | duas chamadas na mesma volta: o Mastra as põe numa fila por fio, e a `task_update` vê o que a `task_write` gravou (`C/tools/builtin/task-tools.ts:302-309`, `:323-324`) | a volta para no meio: a lista fica como a última chamada gravou | o banco fora: o erro da ferramenta volta ao modelo | o erro da ferramenta | 16, 33 |
| A tabela de avisos (`mastra_notifications`) | — | — | o banco fora: a `notification_inbox` devolve o erro da ferramenta | o erro da ferramenta | 29 |
| A pausa pelo `PUT …/goal` enquanto o juiz decide | Parar e a decisão do juiz ao mesmo tempo: a ordem das duas gravações do objetivo não está lida no Mastra; sem objetivo, o `PUT` não muda nada ("No-op when no goal is set", `node_modules/@mastra/server/dist/server/handlers/agent-controller.js:1613`) | a decisão do juiz grava depois da pausa: o teste da U7 mostra o que fica, e o "Parar se" da U7 diz o que fazer | o banco fora: a pausa falha, e o botão volta | o código de falha da rota | 36 |
| A edição pela árvore do código (`ast_smart_edit`) | duas edições no mesmo arquivo: a máquina avisa o conflito, como nas outras escritas (`H/machine/machine-sync.test.ts:73`) | o padrão não acha o trecho: o erro da ferramenta | a máquina fora: o erro da ferramenta, como nas outras | o erro da ferramenta | 28 |

## A tabela de referência

| Peça | Unidade | O que o fundador já decidiu | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O modo ao abrir e quem começa o plano | U1, U7 | decisão 1, A (rodada 2): "construir é o padrão; você liga Planejar ou o Conexus propõe no pedido grande" | um modo só, `conversa` (`H/spec/factories.ts:38`) | Mastra Code 1.19.0 e 0.50.3 (outra); Claude Code (outra); Lovable, Bolt, Base44, Dyad (mesma) | abre em construir (`MC/agents/modes/plan.ts:44-46`); o modelo propõe pelo `submit_plan` em construir (`MC/agents/prompts/tool-guidance.ts:234-246`); o Claude Code entra no plano pelo `EnterPlanMode`, **lido**. No Mastra, a ferramenta acha a sessão viva pelo `controller` do contexto (`C/agent-controller/types.ts:1142-1205`; `C/tools/types.ts:642-643`) e troca por `session.mode.switch` (`CD/agent-controller-BhkzVgCi.js:3743`); a aprovação transita a partir do modo gravado na execução suspensa, `mastra__agentControllerRunModeId` (`CD/agent-controller-BhkzVgCi.js:6191-6198`, `:6423`), que não sai pelo `@mastra/core/agent-controller` (`CD/agent-controller/session.d.ts:27`, `CD/agent-controller/index.d.ts:9`), **lido** | nativo ao abrir; embrulhado ao propor: a troca nativa e a marca do modo da execução, a chave escrita no Conexus com a citação | critérios 1, 4, 5 | decisão 1 | `A/app-builder/modes.ts` |
| Os nomes dos modos | U1 | rodada 3: "plano e construir" | `currentModeId: 'conversa'` guardado | `@mastra/core@1.83.0`; Codex | o modo guardado que não existe é ignorado (`C/agent-controller/session.ts:1407-1410`); o Codex renomeou sem migrar (`codex-rs/protocol/src/config_types.rs:674-684`), **lido** | nativo | — | decisão 2 | `A/app-builder/modes.ts` |
| A rota de troca de modo | U1 | decisão 1, A: "o modo aparece na caixa, e você troca pela rota nativa, atrás do guarda" | fora da lista do guarda (`H/routes/guard.ts:35-45`) | `@mastra/server@1.83.0` | `POST …/sessions/:sessionId/mode` chama `session.mode.switch` (`node_modules/@mastra/server/dist/server/handlers/agent-controller.js:847-867`), **lido** | nativo | critério 3 | decisão 1 | — |
| A volta a construir na aprovação | U1 | idem | `A/app-builder/plan-tools.ts:96` só retoma | `@mastra/core@1.83.0` | `handlePlanApprovalResume` troca para o `transitionsTo` do modo em que o plano foi enviado antes de retomar (`C/agent-controller/session.ts:6235-6289`; na versão instalada, `CD/agent-controller-BhkzVgCi.js:6405-6445`, a troca em `:6427` e a retomada em `:6439`), **lido** | nativo | — | não precisa | — |
| A trava da escrita no modo plano | U1, U2 | U2 (rodada 2): "a trava do modo plano é a do Mastra Code" | nenhuma | Mastra Code (outra) | a lista do modo plano sem comando (`MC/agents/tool-availability.ts:140-164`); o gancho da área de trabalho que só deixa `.md` na pasta de planos (`:62-95`, registrado em `:131-133`), **lido** | nativo | critério 7 | decisão 3 | `A/app-builder/plan-guard.ts` |
| A recusa diz o que fazer | U2 | idem | as recusas do `submit_plan` (`plan-tools.ts:85`) | Mastra Code (outra) | "Plan mode can only write plan files inside …" (`MC/agents/tool-availability.ts:83`, `:93`), **lido** | nativo | — | não precisa | — |
| A cópia do plano aprovado | U2 | U2 (rodada 2): "sai o plano aprovado imutável, entra a cópia guardada" | `approvedPlans` por `getMessages` (`plan-tools.ts:26-44`, `:87-89`) | Mastra Code (outra); Factory | o plano aprovado no estado da sessão (`MC/schema.ts:275-283`) e no topo do texto de construir (`MC/agents/prompts/build.ts:13-23`); o estado durável do fio é o `threadState` (`C/tools/builtin/task-tools.ts`), **lido** | embrulhado: a cópia no `threadState` | critérios 8, 9 | decisão 3 | `A/app-builder/plan-guard.ts` |
| A aprovação presa à versão do plano | U2 | rodada 1, U2: "com a recusa do Dyad" | nenhuma | Dyad `902829f` (mesma) | "The plan changed. Review and accept the current version." (`exit_plan.ts:71-110`), **lido**; a rota nativa recebe `resumeData` sem esquema (`node_modules/@mastra/server/dist/server/handlers/agent-controller.js:217-222`) e o guarda do Hub lê o corpo antes do handler (`H/routes/guard.ts:350-356`) | embrulhado: a comparação da versão no guarda do Hub, antes de o Mastra ver a aprovação, porque a troca de modo do Mastra vem antes da retomada da ferramenta | critério 10 | decisão 3; firstmate 6 | `A/app-builder/plan-version.ts` |
| Um plano novo fecha o anterior | U2, U7 | rodada 2: "com a regra do Lovable" | dois cartões podem ficar abertos | Lovable (mesma); Factory | a mensagem vira a próxima versão do plano (plan-mode, 2026-11-25), **documentado** | embrulhado: a recusa do plano antigo e o rótulo | critérios 11, 35 | decisão 3 | — |
| A pesquisa antes do plano | U3, U8 | D5 (rodada 1, como está); FER A e o modo plano da rodada 8 | o ajudante `pesquisar` só no Assistente (`A/assistant/research.ts:9-30`) | Lovable, Replit, Base44, v0 (mesma); Claude Code, o subagente Plan (outra) | ajudante só de leitura que pesquisa antes do plano, **documentado** (estudo irmão, seção 5) | nativo: a etapa na skill; os ajudantes do Mastra Code | critérios 13, 22 | decisões 6, 9 | `packages/app/skills/conexus-plan-new/SKILL.md` |
| Os pedidos numerados e as fases | U3, U7 | roteiro: "Cada pedido numerado do plano aparece conferido no fim"; D6 (rodada 1) | texto livre (`packages/app/skills/conexus-plan-new/references/plan-template.md`) | Factory (outra); vibesdk (mesma), pelo irmão; Kiro (outra), não oficial | o objetivo da Factory é um texto fixo que fala do plano (`F/boards/work.ts:17-25`), **lido**; as tarefas do Kiro citam os requisitos (`_Requisitos: N.M_`) | embrulhado: a lista conferida na borda do `submit_plan` (C27) | critério 12 | decisão 6 | `A/app-builder/plan-tools.ts` |
| Cada fase vira tarefa, pelo modelo | U3 | U4, F1 e F3 saem (rodada 2) | as tarefas não se ligam a nada | Mastra Code; Kiro | "for non-trivial tasks ... create and update your task list" (`MC/agents/prompts/build.ts:41-43`), **lido** | nativo: o texto pede, o modelo escreve | critério 13 | decisão 5 | — |
| O goal ao aprovar | U3 | decisão 4 (rodadas 1 e 2); cartão 4 de 2026-11-24, "o goal ao aprovar" | nenhum | Mastra Code (outra); `@mastra/core@1.83.0` | `setGoal` na aprovação, com o modelo da conversa (`mastracode/tui/src/tui/handlers/prompts.ts:451-502`); `setObjective` e o `goal` do agente (`CD/docs/references/docs-harness-goals.md:27-50`), **lido**. A Factory diverge: `planApprovalStartsGoal: false`, "goals are only started by the local TUI" (`F/factory.ts:1781-1782`), **lido** | nativo, igual ao Mastra Code; a Factory diverge | — | decisão 4 | — |
| O juiz do goal: modelo, números e ferramentas | U3, U8 | decisão 4: 50 rodadas, até 1000 passos; M1 (rodada 7): o modelo da conversa | nenhum | Mastra Code (outra) | `maxRuns` 50 e `maxSteps` 1000 (`MC/index.ts:1514-1515`); as cinco leituras (`MC/agents/tool-availability.ts:178-184`); o plano aprovado julgado pelo modelo da conversa (`mastracode/tui/src/tui/mastra-tui.ts:1490`, `useSessionModelAsJudge: true`; sem ele, o juiz da configuração, `MC/agents/model.ts:627-634`; `C/agent/goal/objective.ts:98`), **lido** | nativo | — | decisão 4 | — |
| O juiz por código das tarefas e da conferência | fica como está: aprovado no `A1` | `A1` | `conexusCheck` (`A/app-builder/processors.ts:93-163`) | `@mastra/core@1.83.0` | `isTaskComplete` (`C/loop/loop-builder.ts:425-427`), **lido** | nativo | critério 16 (regressão) | não precisa | — |
| O juiz nos quatro agentes | fica de fora: nenhuma referência o tem | rodada 2: "U4 sai" | só o Construtor | Mastra Code, Claude Code, Codex, Kiro: nenhum | `isTaskComplete` sem uso em `mastracode/`, **lido** | nativo, e fica de fora: nenhuma referência o tem | — | decisão 5 | — |
| As frases de `task_check` | ficam, pelo guia do Mastra Code (U8) | rodada 2: "as frases de `task_check` ficam" | `builder.md:29`; `A/assistant/prompt/assistant.md` | Mastra Code (outra) | "BEFORE finishing" (`MC/agents/prompts/tool-guidance.ts:199-207`), **lido** | nativo | — | decisão 5 | — |
| As recusas como erro da ferramenta | U6 | C79; rodada 2, "U6 como está" | sucesso com texto (`H/tools/connectors/connector-tools.ts:170-186`, `H/tools/app-data/tools.ts:37-51`); as cópias de AGT-7 (`A/agent-builder/tools.ts:35`, `:76`; `A/agent-builder/code-tool.ts:114`) | `@mastra/core@1.83.0` | só o lançamento marca erro (`tool-result-commit-core.ts:173`, pela auditoria); a forma de `A/saved-agent/tools.ts:33-54` e `H/tools/data/tools.ts:14-31` | nativo | critério 17 | não precisa | `H/tools/refusal.ts` |
| O agente do Construtor | U8 | O3 A (rodada 8): "o Construtor nasce de `createCodingAgent`" | `new Agent` pelo `mountAgent` (`A/app-builder/builder.ts:138-183`, `H/spec/mount.ts:143-192`) | `@mastra/core@1.83.0`; Mastra Code (outra) | `createCodingAgent`, com `workspace: undefined` quando o controlador empresta a máquina (`CD/docs/references/reference-coding-agent-create-coding-agent.md`); o Mastra Code (`MC/index.ts:1368-1376`), **lido** | nativo | — | decisão 11 | — |
| O texto base e as trocas | U8 | O3 A (rodadas 5, 8 e 9) | o `builder.md`, escrito do zero (`A/app-builder/prompt/builder.md:1-76`) | `@mastra/core@1.83.0`; Mastra Code 0.50.3, texto capturado (R9) | `buildBasePrompt` com `productName`, `planApprovalStartsGoal` e `hasSubagents` (`CD/coding-agent/prompt.d.ts`; `CD/coding-agent/index.js:8-12`); a ordem base, anfitrião, AGENTS.md, modelo, modo (`MCD/agents/prompts/index.js:45-140`), **lido** | nativo, com as trocas nomeadas (desvio com motivo, uma por linha) | critérios 18, 19 | decisões 11, 12 | `H/prompt/base.ts`, `H/prompt/mastra-code/` |
| A primeira linha | U8 | ID A (rodada 10) | `builder.md:1` | Claude Code (outra), não oficial e observado | "You are an agent working with the user toward their goals, using your own judgment along the way." (`claude-code-opus-5.5.md:13-15`) | embrulhado: a linha fixa do núcleo, trocada (`CD/coding-agent/index.js:12`) | critério 19 | decisão 12 | `H/prompt/base.ts` |
| O idioma | U8 | rodada 10: "isso vai vir do idioma que a pessoa enviar" | "Reply in Brazilian Portuguese…" (`builder.md:24`), `:12`, `:19` | Mastra Code, Claude Code, Codex | nenhuma regra de idioma, **lido**; o teste no Mastra Code 0.50.3 respondeu em português sem regra | nativo | critério 31 (Lab) | decisão 12 | — |
| O espaço do anfitrião | U8 | O3 A: "o bloco do Construtor entra no espaço do anfitrião" | a parte da plataforma, misturada no `builder.md` | Mastra Code; Factory (outra) | `hostInstructions`, logo depois do texto base (`MCD/agents/prompts/index.js:114-124`); a Factory usa o espaço (`F/factory.ts:1783`), **lido** | nativo | critério 20 | decisão 11 | `A/app-builder/prompt/builder.md` (o bloco do lugar) |
| O AGENTS.md | U8 | rodada 5: "AGENTS.md igual ao Mastra Code" | no texto, relido do `main` (`A/app-builder/prompt/prompt.ts:126-150`) | Mastra Code (outra) | "# Agent Instructions", relido a cada pedido; o ramo confiável por `git show` (`MC/agents/prompts/index.ts:178-228`), **lido** | nativo | critério 20 | decisão 13 | — |
| O MEMORY.md | U8 | MEMORY.md A (rodada 5; 2026-11-26) | o índice no texto (`builder.md:74-76`, `prompt.ts:68-69`) | Claude Code (outra); o Mastra Code não tem | o índice entra, o detalhe se lê por ferramenta (memory, 2026-11-25), **documentado** | nativo: como hoje | critério 20 | decisão 13 | — |
| O cache do texto | U8 | O3 (rodada 2: "tem que ter prompt caching"), refeito pelo O3 A: seguir o Mastra Code | a marca de uma hora (`H/prompt/instructions.ts:5-14`, `H/model-accounts/claude/models.ts:21-56`) | Mastra Code (outra) | a data, o modo e o AGENTS.md no texto; o custo aceito; as tarefas fora do texto (`MC/agents/prompts/index.ts:172-176`), **lido** | nativo | a medição 2 do Lab | decisão 11 | — |
| Os nomes curtos das ferramentas da máquina | U8 | O3 A (rodada 5, item 5) | `mastra_workspace_*` (`packages/hub-api/src/tools.ts:26-37`) | Mastra Code (outra) | o nome é opção nativa da máquina (`MC/tool-names.ts:53-67`); o guia ensina pelos nomes curtos (`MC/agents/prompts/tool-guidance.ts:38-76`), **lido** | nativo | critério 21 | decisão 11; firstmate 1 | — |
| As ferramentas de cada modo | U8 | FER A (rodada 8), AVISO A (rodada 10) | uma lista só (`builder.ts:154-171`) | Mastra Code 0.50.3, medido (R8) | a lista do plano tem 16 nomes (`MCD/agents/tool-availability.js:99-116`), dois deles dos fluxos (`list-workflows` e `get-workflow`, F3), que não entram no Conexus; o pedido medido levou 31 em construir e 15 no plano (R8), **rodado** | nativo em construir; no plano, desvio pela sua palavra | critério 21 | decisões 7, 9 | — |
| As ferramentas tiradas | U8 | FER A | — | Mastra Code (outra) | o guia recebe a lista das tiradas e omite o bloco (`MC/agents/prompts/tool-guidance.ts:16-23`; `MC/agents/instructions.ts:26-27`), **lido** | nativo | critério 21 | decisão 7 | — |
| Os ajudantes | U8 | FER A e SUBM A (rodada 8) | o `pesquisar` do Assistente (`A/assistant/assistant.ts:272`) | Mastra Code (outra); Claude Code (outra) | explore, plan e execute (`MC/agents/subagents/explore.ts:4-10`, `plan.ts`, `execute.ts:4-24`); "Subagent outputs are treated as untrusted" (code.mastra.ai, Modes, 2026-11-26); a ferramenta e o `forked` do controlador (`C/agent-controller/tools.ts:131-164`), **lido** | nativo | critério 22 | decisão 8 | `A/app-builder/subagents.ts` |
| O modelo dos ajudantes | U8 | SUBM A | o modelo da conversa (`H/model-accounts/side-calls.ts:88`) | Mastra Code (outra) | o explorador no modelo do modo rápido, o planejador e o executor nos de plano e construir (`MCD/onboarding/pack-activation.js:61-67`), **lido**; o custo, **rodado** (R8) | embrulhado: o modelo leve pela escolha da memória (`H/model-accounts/auto-memory-model.ts:25-29`) | critério 23 | decisão 8 | — |
| A edição pela árvore do código | U8 | FER A | desligada (`H/machine/workspace.ts:38`) | `@mastra/core@1.83.0` | só entra com o ast-grep; roda no servidor e lê e escreve pela pasta da máquina (`C/workspace/tools/tools.ts:626-632`; `C/workspace/tools/ast-edit.ts:461`, `:542`), **lido** | nativo | critério 28 | decisão 7 | — |
| O `lsp_inspect` | U8 | FER A; rodada 10: o bloco nativo | não tem | `@mastra/core@1.83.0` | o servidor de linguagem pelo gerente de processos da máquina (`C/workspace/lsp/manager.ts:301`, `C/workspace/lsp/client.ts:149-161`); o bloco (`MCD/agents/prompts/tool-guidance.js:48-56`), **lido** | nativo | critério 32 (Lab) | decisões 7, 12 | — |
| A caixa de avisos | U8 | AVISO A (rodada 10): "Porque sair?" | não tem | `@mastra/core@1.83.0`, `@mastra/pg@1.36.0`; Mastra Code 0.50.3 | a ferramenta e a tabela (`NotificationsPG`, `@mastra/pg/dist/index.js:14605`); ligada no Mastra Code mesmo sem quem mande aviso; o bloco (`MCD/agents/prompts/tool-guidance.js:57-62`), **lido** | nativo | critério 29 | decisão 7 | — |
| O plano recusado | U8 | rodada 6: "ter igual à 1.21.0" | o laço segue | Mastra Code 1.21.0 (outra) | o laço para só com a recusa sem comentário (`mastracode/sdk/src/processors/plan-rejection-abort.ts:3-9`, `:36-58` em `05cad114`; `MCD/processors/plan-rejection-abort.js:23`), **lido** | nativo, copiado com a licença | critério 24 | decisão 14 | `A/app-builder/plan-rejection.ts` |
| Os detalhes do `submit_plan` | U8 | rodada 6 | `plan-tools.ts:60-98` | Mastra Code 1.21.0 (outra) | a descrição do núcleo, a recusa do plano vazio, o erro marcado (`mastracode/sdk/src/tools/submit-plan.ts:56-160` em `05cad114`), **lido** | nativo | critério 25 | decisão 14 | — |
| A opção recomendada | U8, U7 | rodada 6 | `H/spec/ask-user.ts:35-65`; `packages/hub-api/src/questions.ts:10` | `@mastra/core` 1.86.0 (outra) | `recommended: true`, no máximo uma (`packages/core/src/tools/builtin/ask-user.ts:14-15`, `:48-53` em `05cad114`), **lido** | nativo, copiado | critério 26 | decisão 14 | — |
| O plano na caixa e "Continuar o plano" | U7 | M2 (rodada 7) | nada na tela | Mastra Code (outra); `@mastra/server@1.83.0` | a barra do goal e `/goal resume`; enquanto o juiz decide a caixa espera (`mastracode/tui/src/tui/goal-input-lock.ts:4-8`); `GET` e `PUT …/goal` chamam `getObjective` e `updateObjectiveOptions` (`node_modules/@mastra/server/dist/server/handlers/agent-controller.js:1550-1630`), **lido** | nativo | critérios 36, 37 | decisão 10; firstmate 2 | — |
| O modo rápido, os ganchos, os plugins | fica de fora: quem usa não programa; a Factory também não tem | rodada 5 (R5a) | — | Mastra Code (outra); Factory | `modes: false`, `disableMcp` (`F/factory.ts:1685`, `:1716-1719`), **lido** | nativo, e fica de fora | — | "Fica de fora" | — |
| As ferramentas F1, F2, F3, F5, F6, F7 | fica de fora: o motivo de cada uma em "Fica de fora" | FER A (rodada 8) | — | Mastra Code 0.50.3 | experimentais e desligadas (`MC/index.ts:735`, `:1202-1215`); o fluxo roda no servidor (`MC/tools/workflows/run-workflow.ts:23-28`), **lido** | nativo, e fica de fora | — | decisão 7 | — |
| O navegador (F8) | fica de fora: entra pelo cartão da etapa 3 do harness | FER A | — | Mastra Code | `stagehand_*` numa máquina com Chromium | nativo, e fica de fora | — | decisão 7 | — |
| O Code Mode da plataforma | fica de fora: "suposta feature", com lab e evals | rodada 2 (decisões 3 e 4 de 2026-11-25, U5) | só o agente salvo (`A/saved-agent/code-mode.ts`) | `@mastra/core@1.83.0` | `createCodeMode` (`CD/docs/references/docs-agents-code-mode.md:105-183`), **lido** | nativo, e fica de fora | — | "Fica de fora" | — |
| A busca do Connect, as exclusões da Factory, o programa no processo | fica de fora: iam com o Code Mode (O7, O8, O9) | rodada 2, como estão | — | `@mastra/connect` 1.4.0; Factory | `packages/connect/src/code-mode.ts:46-55`; `session-tools.ts:7-9`, `:35-37` na 1.83, **lido** | nativo, e fica de fora | — | "Fica de fora" | — |
| Os detectores prontos | fica de fora: chamada de modelo na conta da empresa e `abort` sem tela | cartão 4: "as guardas uma a uma" | nenhum | `@mastra/core@1.83.0` | cada um é um `new Agent` (`C/processors/processors/`), **lido** | nativo, e fica de fora | — | "Fica de fora" | — |
| A atualização para 1.86 | fica de fora: a U8 não depende dela | rodada 6 | 1.83.0 | Mastra 1.86.0 | o texto base difere só na linha do GitHub (`packages/core/src/coding-agent/prompt.ts:100` em `05cad114`), que sai, **lido** | nativo, e fica de fora | — | "Fica de fora" | — |

**A medida do transplante.** Nada vem do repositório antigo. Do Mastra Code entram copiados, com o cabeçalho da
licença Apache 2.0, como o `SandboxFilesystem`: o guia das ferramentas, os textos dos modos construir e plano, as três
definições de ajudante e o processador do plano recusado, na versão 1.21.0 (Mastra Code 0.50.3). O texto base não se
copia: vem da biblioteca instalada.

**A dívida.** Nenhuma nova.

## As decisões do firstmate

| # | Decisão reversível (delivery L6) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | Os nomes curtos das ferramentas da máquina valem só no Construtor nesta etapa; os outros três agentes passam a eles com o texto base, no `A6` | a U8 é do Construtor (R5e: "Os outros três agentes ficam como estão"); o Início e o Agentes passam no `A6` (cartão 3 a); o nome é opção da máquina de cada agente (`MC/tool-names.ts:53-67`) | dar os nomes curtos às quatro máquinas |
| 2 | O guarda abre `GET` e `PUT …/goal`, e o `PUT` só aceita `{ status }`, com `'active'` ("Continuar o plano") ou `'paused'` (Parar enquanto o juiz decide); `POST` e `DELETE` do objetivo ficam fora | o M2 só retoma e pausa; a rota nativa também troca o juiz e as rodadas (`agent-controller.js:1604-1630`), que a decisão 4 fixou | abrir os outros campos, ou fechar a rota e retomar por uma ação do servidor |
| 3 | Um plano substituído se recusa no servidor: a resposta a um `submit_plan` que não é o último da conversa é recusada | a regra do Lovable fecha o anterior; sem a recusa, dois cartões aprováveis convivem | tirar a recusa e deixar só o rótulo na tela |
| 4 | Uma tarefa cita os pedidos pelo id (`P3`) no próprio texto, e o cartão os lê por uma expressão de `packages/hub-api` | sem a F1, o modelo escreve a lista; o Kiro cita os requisitos no texto da tarefa; `Task` só tem `content` (`packages/hub-api/src/questions.ts:21-26`) | um campo próprio na tarefa |
| 5 | As unidades U4 e U5 que saíram deixam o número vago | o quadro e o relatório da revisão falam da U7 e da U8 por esses números | renumerar |
| 6 | A recusa do Dyad mora no guarda do Hub, antes de o Mastra ver a aprovação: "Aprovar e construir" leva a `planVersion` que o cartão mostrou, o guarda a compara com o arquivo do plano na máquina e só deixa a rota seguir quando são iguais; diferente, ou sem arquivo, a rota volta `{ ok: false, reason: 'plan_changed', current }` e o Mastra não retoma | a troca de modo do Mastra vem antes da retomada da ferramenta (`CD/agent-controller-BhkzVgCi.js:6427`, `:6439`): uma recusa dentro do `submit_plan` acharia a sessão já em `construir`; o guarda já lê o corpo de `tool-approval` antes do handler (`H/routes/guard.ts:221-256`, `:350-356`) | comparar dentro do `submit_plan` e voltar a sessão a `plano` depois da recusa |
| 7 | O código copiado do Mastra Code fica igual e pergunta pelos modos `'plan'` e `'build'`; uma tabela só, `MODE_KIND` (`plano` → `'plan'`, `construir` → `'build'`), traduz na chamada, na guarda da U2 e no guia da U8 | o copiado compara com os literais (`MC/agents/tool-availability.ts:73`; `MCD/agents/prompts/tool-guidance.js:64`, `:133`, `:139`, `:146`; `MCD/agents/instructions.js:26`); os nomes dos modos são do fundador (decisão 2) | trocar os literais na cópia |
| 8 | Um `submit_plan` em `construir` troca a sessão por `session.mode.switch` e marca o modo da execução com a chave do Mastra `mastra__agentControllerRunModeId`, escrita no Conexus com a citação | sem a marca, a aprovação transita a partir de `construir`, que não tem `transitionsTo`, e a sessão ficaria em `plano` (`CD/agent-controller-BhkzVgCi.js:6191-6198`, `:6423-6427`); a chave não sai pelo pacote (`CD/agent-controller/index.d.ts:9`) | propor só em `plano`, como o Mastra Code |
| 9 | Da issue 1334, a U8 só acerta o comentário do molde; o `setEnvs` fica | o `setEnvs` vale enquanto o molde é construído, e o cache que ele enche serve ao programa de conferência; levar as variáveis aos comandos do modelo pede medir uma instalação | levar as duas variáveis ao perfil do shell da máquina, com a medição |

## U1 Os dois modos do Construtor de apps

**Base e modelo.** O `main` do fechamento do `A2`. Opus: o modo cruza a ficha (`H/spec/`), o controlador, o guarda das
rotas e o `submit_plan`, e a troca no meio da execução é sutil.

### As linhas da tabela

- **O modo ao abrir**, **os nomes dos modos**, **a rota de troca de modo**, **a volta a construir**, **a trava da
  escrita** (a lista do modo). Na base: `H/spec/factories.ts:38` (`CONVERSATION_MODE`) e `:102-149` (`controllerOf`,
  um modo só), `H/spec/spec.ts:114`, `A/app-builder/builder.ts:171`, `A/app-builder/plan-tools.ts:76-98`,
  `H/routes/guard.ts:35-45`. Na referência: `C/agent-controller/types.ts:51-137`; `C/agent-controller/session.ts:1407-1410`
  (o modo guardado), `:2743-2753` (a troca), `:6235-6289` (a aprovação: a troca em `:6271`, antes da retomada em `:6283`); `C/agent-controller/agent-controller.ts:2160-2215`
  (o `availableTools` por chamada); `node_modules/@mastra/server/dist/server/handlers/agent-controller.js:847-867`;
  `MC/agents/modes/plan.ts:8-50`; `MC/agents/tool-availability.ts:140-164`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/harness/spec/` | Muda: `controllerOf` e a ficha aceitam uma lista de modos | os quatro agentes |
| `apps/server/src/harness/routes/guard.ts` | Muda: `POST …/mode` na lista fixa, com o `modeId` conferido | o Hub |
| `apps/server/src/agents/app-builder/` | Cria `modes.ts`; muda `builder.ts`, `plan-tools.ts` | a ficha do Construtor de apps |

### Os contratos que a unidade cria

```ts
// H/spec/spec.ts
type ConversationMode = Readonly<{
  id: string
  availableTools?: readonly string[]
  transitionsTo?: string
}>
// ConversationSpec.modes: readonly [ConversationMode, ...ConversationMode[]] (o primeiro é o padrão)

// A/app-builder/modes.ts
export const APP_BUILDER_MODE = { build: 'construir', plan: 'plano' } as const
export type AppBuilderModeId = (typeof APP_BUILDER_MODE)[keyof typeof APP_BUILDER_MODE]
/** O tipo de cada modo como o código copiado do Mastra Code o pergunta (firstmate 7). */
export const MODE_KIND = { construir: 'build', plano: 'plan' } as const satisfies Record<AppBuilderModeId, string>

// H/routes/guard.ts
const ModeSwitch = z.strictObject({ modeId: z.enum(Object.values(APP_BUILDER_MODE)) })
```

A rota: `POST /agent-controller/:controllerId/sessions/:sessionId/mode`, acesso de quem conversa no Projeto (S10),
entrada `{ modeId }`, conferida no guarda por `ModeSwitch` antes do handler (C27); saída `{ ok: true }`; falhas:
`REQUEST_MALFORMED` para outro `modeId`, para um campo a mais e para o controlador de outro agente; a recusa do guarda
(S10) para quem não conversa no Projeto. O `modeId` não é id de entidade: é um valor da união fechada
`AppBuilderModeId`, criado só pelo `ModeSwitch` (C23). O dono do id de cada modo é `APP_BUILDER_MODE`, e o dono da
tradução para o código copiado é `MODE_KIND` (C26). Os outros três agentes passam um modo só, `CONVERSATION_MODE`, e o
pedido deles ao modelo não muda. A lista do modo `plano` nesta unidade é a do Mastra Code com os nomes de hoje (as
tarefas, `ask_user`, `submit_plan`, a leitura dos arquivos, `write_file` e `edit_file` pela guarda da U2), mais as
leituras do Conexus (`connector_read`, `connector_notes`, `app_data_read`, `data_describe`, `data_query`) e a web; a
U8 a completa.

O arquivo modelo: `H/routes/guard.ts`. Cumpre C23 (`ConversationId` e `ToolCallId` só por parse, `Params` e
`ToolAnswer`) e C26 (a `FIXED_LIST` é a única lista de rotas); não tem ciclo de vida, e a C21 não se aplica.

### As skills e a leitura

`mastra` (do `node_modules`: `docs-harness-agent-controller.md`, `reference-agent-controller-session.md`,
`reference-tools-submit-plan-tool.md`); `fastify-best-practices` para o guarda; `pstack:typescript-best-practices`.

### A ordem do trabalho

1. **A lista de modos na ficha.** Critérios: 6.
   - **Arquivos:** muda `H/spec/spec.ts`, `H/spec/factories.ts`.
   - **Referência a seguir:** `C/agent-controller/types.ts:51-137`.
   - **O que sai:** o modo único fixo (`mode: { id: typeof CONVERSATION_MODE, ... }`) de `controllerOf`.
   - **Testes:** os três `request.test.ts` dos outros agentes iguais.
2. **Os dois modos do Construtor.** Critérios: 1, 2, 5.
   - **Arquivos:** cria `A/app-builder/modes.ts`; muda `A/app-builder/builder.ts`, `A/app-builder/closure.test.ts`.
   - **O que entra:** `construir` primeiro (o padrão), com as ferramentas de hoje; `plano` com a lista acima e
     `transitionsTo: 'construir'`. Nenhuma troca no começo da sessão: o padrão já é `construir`, e o modo guardado
     `conversa` cai nele (`session.ts:1407-1410`). O caso de `closure.test.ts:200` (issue 1286, item 1) confere o
     conjunto fechado de cada um dos dois modos.
   - **Testes:** `conversation-plan.test.ts`, "a conversa começa em construir", "a conversa guardada abre em
     construir", "aprovar destrava, pedir ajustes não"; `closure.test.ts`, um caso por modo.
   - **Mutações à mão:** tirar o `availableTools` de `plano` deixa vermelho o caso de `closure.test.ts` desse modo.
3. **Propor um plano trava.** Critérios: 4, 5. No `submit_plan`, antes do `suspend`, se o modo da sessão for
   `construir`, a sessão troca para `plano` e a execução passa a dizer `plano` (firstmate 8).
   - **Arquivos:** muda `A/app-builder/plan-tools.ts`; usa `A/app-builder/modes.ts`.
   - **Referência a seguir:** a sessão viva pelo `controller` do contexto da ferramenta (`controllerId`, `sessionId`,
     `session.modeId`; `C/agent-controller/types.ts:1142-1205`) e pelo `mastra` do contexto (`C/tools/types.ts:642-643`),
     como o guarda a acha (`H/routes/guard.ts:232-233`); `session.mode.switch({ modeId })`
     (`CD/agent-controller-BhkzVgCi.js:3743`, que grava `currentModeId`); a marca
     `requestContext.setRaw('mastra__agentControllerRunModeId', 'plano')`, a chave que a aprovação lê
     (`CD/agent-controller-BhkzVgCi.js:6191-6198`, `:6423`).
   - **O que entra:** uma constante com a chave, com a citação de `CD/agent-controller/session.d.ts:27`.
   - **Testes:** `conversation-plan.test.ts`, "propor um plano trava": o dublê chama `submit_plan` em `construir`, o
     `GET` da sessão devolve `plano`, e, aprovado o plano, devolve `construir`.
   - **Mutações à mão:** tirar a troca deixa vermelho "propor um plano trava"; tirar a marca deixa vermelha a volta a
     `construir` no mesmo caso (o 5).
   - **Pronto quando:** o Hub local com o dublê mostra a sessão em `plano` com o cartão aberto, e em `construir` depois
     de aprovar.
4. **A rota de modo no guarda.** Critério: 3. `POST ${SESSION}/mode` entra na lista fixa; o guarda confere que o
   controlador é o do Construtor e o corpo pelo `ModeSwitch`.
   - **Arquivos:** muda `H/routes/guard.ts`, `H/routes/guard.test.ts`.
   - **Referência a seguir:** `node_modules/@mastra/server/dist/server/handlers/agent-controller.js:847-867`; o ramo de
     `tool-approval` do guarda (`H/routes/guard.ts:350-356`).
   - **Testes:** `H/routes/guard.test.ts`, "a troca de modo", "a troca de modo de outro modo", "a troca de modo de
     outro controlador", e a recusa de quem não conversa.
   - **Mutações à mão:** tirar a conferência do `modeId` deixa vermelho "a troca de modo de outro modo"; tirar a
     conferência do controlador deixa vermelho "a troca de modo de outro controlador".
   - **Pronto quando:** a rota responde `{ ok: true }` ao Construtor e `REQUEST_MALFORMED` aos outros casos.
5. **A conversa fora do índice (issue 1286, item 2).** Critério: 38.
   - **Arquivos:** muda `A/app-builder/conversation-turns.test.ts`.
   - **Referência a seguir:** o `none` de `A/app-builder/turn-of.ts:91`.
   - **Testes:** "a conversa que o índice não acha": pela rota de mensagens, uma conversa que saiu do índice do Hub
     recebe `CONVERSATION_NOT_FOUND`, e nenhum turno roda.
   - **Mutações à mão:** trocar o `none` de `turn-of.ts:91` deixa o caso vermelho (o M12 da issue).

### Como se prova

- **1, 2.** O dublê de modelo pela rota de mensagens; a sessão guardada no banco de teste (T26) com
  `currentModeId: 'conversa'`; o `GET` da sessão devolve `construir`. Hoje passa por acaso: só há um modo.
- **3.** O Fastify de teste com o guarda; o `modeId` de outro modo e o controlador do Assistente voltam
  `REQUEST_MALFORMED`. Hoje a rota dá 404.
- **4, 5.** O dublê chama `submit_plan` em `construir`; o `GET` da sessão devolve `plano`, e `construir` depois da
  `tool-suspension` aprovada. Hoje a sessão fica no único modo.
- **6.** Os três `request.test.ts` iguais, byte a byte.
- **38.** A conversa apagada do índice no banco de teste; a rota de mensagens devolve o código. Hoje nenhum teste fica
  vermelho com a troca do `none` (issue 1286).

### Parar se

- A troca de modo no meio da execução não vale para a chamada seguinte (o `availableTools` lido no começo da
  execução): parar e provar com um teste; a alternativa é recusar só pela guarda (U2), sem o `availableTools`.
- O controlador recusar um `transitionsTo` para um modo de outro id que o padrão.
- A marca do modo da execução, posta dentro da ferramenta, não chegar ao instantâneo da execução suspensa: o Mastra
  avisa que a serialização por passo perde mudanças do `RequestContext` (`C/tools/builtin/task-tools.ts:302-309`).
  Se a aprovação não voltar a `construir` no teste do passo 3, parar e levar ao revisor; não trocar o modo pelo guarda.
- O guarda recusar a conversa fora do índice antes do `turnOf` (o `admit`, `H/routes/guard.ts:295`): o `none` não se
  alcança pela porta; parar o passo 5 e escrever na issue 1286 a prova, sem teste por dentro.
- O Hub rodar mais de um processo: a reivindicação nativa da suspensão é um conjunto em memória
  (`CD/agent-controller-BhkzVgCi.js:6166`) e protege um processo só (X1); reler a decisão 0053 e parar se ela não
  cobrir a aprovação.

## U2 As guardas da escrita

**Base e modelo.** O commit da U1. Sonnet.

### As linhas da tabela

- **A trava da escrita** (a guarda), **a recusa diz o que fazer**, **a cópia do plano aprovado**, **a aprovação
  presa à versão do plano**, **um plano novo fecha o anterior**. Na base: o gancho `beforeToolCall` da máquina
  (`H/machine/workspace.ts:33-37`), `PLAN_DIR` (`H/machine/public.ts`), `A/app-builder/plan-tools.ts:10-44`, `:60-98`.
  Na referência: `MC/agents/tool-availability.ts:62-95` (o modo em `:73`) e `:131-133`; `C/workspace/tools/types.ts:75-88`;
  `MC/schema.ts:275-283`; Dyad `exit_plan.ts:71-110`; a rota `tool-suspension` e o seu corpo
  (`node_modules/@mastra/server/dist/server/handlers/agent-controller.js:217-222`, `:775-811`); as suspensões
  pendentes da sessão (`C/agent-controller/types.ts:717-729`); o ramo de `tool-approval` do guarda
  (`H/routes/guard.ts:221-256`, `:350-356`); o cartão que já manda o plano mostrado na resposta (`W/plan-card.tsx:33-42`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/agents/app-builder/plan-guard.ts` | Cria | o gancho da máquina do Construtor de apps |
| `apps/server/src/agents/app-builder/plan-version.ts` | Cria: a versão do plano e a aprovação conferida | o `submit_plan`, o guarda |
| `apps/server/src/harness/machine/` | Muda: o gancho aceita uma guarda do agente | o Construtor de apps |
| `apps/server/src/agents/app-builder/plan-tools.ts` | Muda: a versão no suspend, a recusa do substituído; apaga `approvedPlans` por `getMessages` e a recusa do reenvio | o `submit_plan` |
| `apps/server/src/agents/app-builder/builder.ts` | Muda: passa `approvePlan` ao guarda | a montagem |
| `apps/server/src/harness/routes/guard.ts` | Muda: o ramo de `tool-suspension` e o `approvePlan` em `GuardedMastra.part` | o Hub |
| `packages/hub-api/src/questions.ts` | Muda: `PlanVersion` e `PlanChanged` | o servidor, a tela |
| `apps/web/src/harness/room/plan-card.tsx`, `apps/web/src/harness/room/rows.ts` | Muda: o cartão manda a `planVersion` e mostra a versão atual | a sala da conversa |

### Os contratos que a unidade cria

```ts
// A/app-builder/plan-guard.ts
type PlanGuardVerdict =
  | Readonly<{ kind: 'PROCEED' }>
  | Readonly<{ kind: 'REFUSE'; output: string }>
export const APPROVED_PLAN_STATE = 'conexus-approved-plan'
// threadState type; o valor: Readonly<{ path: string; title: string; plan: string; approvedAt: string }>

// packages/hub-api/src/questions.ts
export const PlanVersion = z.string().regex(/^[0-9a-f]{64}$/).brand('PlanVersion')   // SHA-256 do arquivo
export const PlanChanged = z.strictObject({
  ok: z.literal(false),
  reason: z.literal('plan_changed'),
  current: z.strictObject({ title: z.string(), plan: z.string(), planVersion: PlanVersion }).nullable(),
})

// A/app-builder/plan-version.ts
export function planVersionOf(raw: string): PlanVersion
type PlanApproval =
  | Readonly<{ kind: 'PROCEED' }>
  | Readonly<{ kind: 'CHANGED'; current: z.infer<typeof PlanChanged>['current'] }>
// GuardedMastra.part(kind).approvePlan?: (input: {
//   companyId: CompanyId; conversationId: ConversationId; toolCallId: ToolCallId
//   path: string; planVersion: PlanVersion
// }) => Promise<PlanApproval>
```

A forma do valor guardado é a do `activePlan` do `buildBasePrompt` (`CD/coding-agent/prompt.d.ts:20-24`, só `title`,
`plan` e `approvedAt`) mais o `path`, que é a mais: o cartão e o objetivo o leem, e a U8 passa ao `activePlan` só os
três campos dele. A recusa da guarda é o `{ proceed: false, output }` nativo do gancho (X5); o texto diz onde
escrever. O suspend do `submit_plan` passa a levar `{ path, title, plan, planVersion }`. "Aprovar e construir" manda
`resumeData: { action: 'approved', title, plan, path, planVersion }`; a rota nativa aceita o `resumeData` sem esquema
(`agent-controller.js:220`), e o guarda o lê por `z.looseObject` só no ramo de `submit_plan`. O guarda acha a
suspensão pelo `toolCallId` em `session.displayState.get().pendingSuspensions`, como já acha as aprovações
(`H/routes/guard.ts:237`), e chama `approvePlan` só quando ela é de `submit_plan` e a resposta é `approved`; com
`CHANGED`, responde `PlanChanged` e não chama o handler, como faz com `not_pending` (`H/routes/guard.ts:352-355`).
Com `PROCEED`, o `approvePlan` grava a cópia no `threadState` antes de o guarda deixar a rota seguir. O dono da versão
é `planVersionOf` (C26); a `PlanVersion` só nasce dele ou do parse do corpo (C23). A descrição do `submit_plan` perde
"an approved plan is never rewritten" (`plan-tools.ts:63`). A guarda pergunta o modo pela `MODE_KIND` da U1
(firstmate 7).

O arquivo modelo: `H/machine/workspace.ts`, o único lugar que faz uma máquina (C26); não tem id nem ciclo de vida
(C21 e C23 não se aplicam). Para o ramo do guarda, o modelo é o da U1.

### As skills e a leitura

`mastra`; `fastify-best-practices` para o guarda; `pstack:typescript-best-practices`.

### A ordem do trabalho

1. **Apagar a leitura por `getMessages`** e a recusa do reenvio (`plan-tools.ts:26-44`, `:87-89`). Critérios: 8, 9.
   - **Arquivos:** muda `A/app-builder/plan-tools.ts`, `A/app-builder/conversation-plan.test.ts`.
   - **Referência a seguir:** `MC/schema.ts:275-283`; o `threadState` de `C/tools/builtin/task-tools.ts:299-324`.
   - **Testes:** "a cópia do plano aprovado", e o mesmo depois do dublê de observação.
2. **A guarda.** Critério: 7. Em `plano`, só `.md` direto em `.conexus/plans/`; em `construir`, nada.
   - **Arquivos:** cria `A/app-builder/plan-guard.ts`; muda `H/machine/workspace.ts`.
   - **Referência a seguir:** `MC/agents/tool-availability.ts:62-95`, o modo pela `MODE_KIND`; o gancho nativo
     (`C/workspace/tools/types.ts:75-88`).
   - **Testes:** `conversation-plan.test.ts`, "o modelo tenta escrever antes da aprovação"; "aprovar destrava, pedir
     ajustes não" segue verde.
   - **Mutações à mão:** trocar o teste do modo por `true` (recusar em todo modo) deixa vermelho o critério 5 ("a
     escrita volta" depois da aprovação); tirar a checagem da pasta deixa vermelho o 7.
3. **A recusa do Dyad, no guarda.** Critério: 10, e a cópia dos critérios 8 e 9.
   - **Arquivos:** cria `A/app-builder/plan-version.ts`; muda `A/app-builder/plan-tools.ts` (a versão no suspend),
     `A/app-builder/builder.ts`, `H/routes/guard.ts`, `H/routes/guard.test.ts`, `packages/hub-api/src/questions.ts`,
     `W/plan-card.tsx`, `W/rows.ts`, `W/plan-card.test.tsx`.
   - **Referência a seguir:** a ordem nativa da aprovação, a troca antes da retomada (`CD/agent-controller-BhkzVgCi.js:6427`,
     `:6439`), por isso a conferência fica antes do handler; o ramo de `tool-approval` (`H/routes/guard.ts:350-356`);
     Dyad `exit_plan.ts:71-110`.
   - **O que entra:** o ramo de `tool-suspension` no `preHandler`; o `approvePlan` lê o arquivo do `path` da suspensão
     na máquina, compara `planVersionOf(raw)` com a `planVersion` do corpo, grava a cópia e responde `PROCEED`; sem
     arquivo, ou diferente, `CHANGED` com a versão atual (`null` sem arquivo). O cartão mostra `current` e manda a
     nova `planVersion` na próxima aprovação; com `current: null`, só "Pedir ajustes" fica.
   - **Testes:** `conversation-plan.test.ts`, "o plano mudou antes da aprovação" (o `GET` da sessão devolve `plano`, e
     a ferramenta segue suspensa); `H/routes/guard.test.ts`, "a aprovação de um plano que mudou"; `W/plan-card.test.tsx`,
     "o plano mudou".
   - **Mutações à mão:** tirar a comparação (deixar sempre `PROCEED`) deixa vermelho "o plano mudou antes da
     aprovação"; mandar a aprovação ao handler depois de `CHANGED` deixa vermelho o mesmo caso, pelo modo
     `construir`.
   - **Pronto quando:** no Hub local com o dublê, editar o arquivo do plano com o cartão aberto e aprovar mostra a
     versão nova no cartão, e a caixa segue em "Planejando".
4. **O plano substituído.** Critério: 11. A resposta a um `submit_plan` que não é o último suspenso da conversa é
   recusada (firstmate 3).
   - **Arquivos:** muda `A/app-builder/plan-version.ts`, `A/app-builder/conversation-plan.test.ts`.
   - **Testes:** "o plano substituído".
   - **Mutações à mão:** aceitar a resposta ao mais antigo deixa vermelho "o plano substituído".

### Como se prova

- **7.** O dublê tenta escrever em `src/` em `plano` pela rota de mensagens, e a pasta do app na máquina de teste não
  muda. Hoje a escrita passa.
- **8, 9.** O dublê edita o arquivo do plano aprovado, e a cópia no `threadState` do banco de teste (T26) não muda,
  também depois do dublê de observação. Hoje o reenvio do aprovado é recusado por `getMessages`.
- **10.** O dublê reescreve o plano com o cartão aberto; a `tool-suspension` com a versão antiga volta `plan_changed`,
  o `GET` da sessão devolve `plano` e a suspensão segue pendente. Hoje a aprovação não confere a versão, e a sessão
  passa a `construir`.
- **11.** Dois planos suspensos; a resposta ao primeiro volta recusada. Hoje os dois se aprovam.

### Parar se

- O contexto do gancho da máquina não trouxer o modo da sessão (o Mastra Code o lê de `getHarnessContext`): parar e
  provar com um teste; a alternativa é a guarda num `hooks.beforeToolCall` do Agent, que não vale dentro dos ajudantes.
- A suspensão não estar em `pendingSuspensions` quando o guarda a procura, como depois de um reinício, em que o
  handler nativo a restaura só dentro dele (`restoreStoredToolSuspension`, `agent-controller.js:791`): parar e provar
  com um teste; não aprovar sem conferir.
- O guarda não alcançar o arquivo do plano na máquina pelo `approvePlan` sem acordar a máquina: parar e levar ao
  revisor; não comparar com o texto guardado na suspensão.
- O `submit_plan` não ler a aprovação pelo dono único da resposta da pessoa (`personsAnswer`, pull request 1448): no
  `@mastra/core` 1.83.0, um `resumeData` que o próprio modelo escreve nos argumentos retoma a chamada sem passar pela
  rota nem pelo guarda (issue 1447), e o modelo aprovaria o próprio plano. Parar até o 1448 estar no `main`, e
  construir a U2 sobre ele.

## U3 A pesquisa e o plano numerado

**Base e modelo.** O commit da U2. Sonnet.

### As linhas da tabela

- **A pesquisa antes do plano** (a etapa na skill), **os pedidos numerados e as fases**, **cada fase vira tarefa,
  pelo modelo**, **o goal ao aprovar**, **o juiz do goal**. Na base: `packages/app/skills/conexus-plan-new/SKILL.md`,
  `references/plan-template.md`, `packages/app/skills/conexus-plan-change/SKILL.md` e o seu `plan-template.md`;
  `A/app-builder/plan-tools.ts`; `A/app-builder/builder.ts:165-168` (o juiz por código). Na referência:
  `F/boards/work.ts:17-25`; `MC/index.ts:1507-1525`; `MC/agents/tool-availability.ts:178-184`;
  `CD/docs/references/docs-harness-goals.md:27-50`, `:64`, `:80-83`, `:102`; `C/agent/goal/scorer.ts:185-209`;
  `C/agent/goal/objective.ts:98`; `mastracode/tui/src/tui/handlers/prompts.ts:451-502`; o juiz no modelo da conversa,
  `mastracode/tui/src/tui/mastra-tui.ts:1490` (`useSessionModelAsJudge: true`) e `MC/agents/model.ts:627-634`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/app/skills/conexus-plan-new/`, `packages/app/skills/conexus-plan-change/` | Muda: a etapa Pesquisar, os pedidos `Pk`, as fases, as Referências, uma tarefa por fase | o Construtor de apps |
| `apps/server/src/agents/app-builder/plan-tools.ts` | Muda: confere a lista numerada; o suspend leva `requests` e `phases` | o `submit_plan` |
| `apps/server/src/agents/app-builder/plan-version.ts` | Muda: na aprovação conferida, o objetivo | o guarda (U2) |
| `apps/server/src/platform/recordings/mastra/plan.jsonl`, `apps/server/src/platform/recordings/mastra/tasks.jsonl`, `apps/server/src/platform/recordings.test.ts` | Muda: as gravações `plan` e `tasks` regravadas na 1.83.0 (issue 1175) | os testes da sala que as leem (`W/plan-recorded.test.tsx`, `W/fold.test.ts`) |
| `apps/server/src/agents/app-builder/builder.ts` | Muda: o `goal` da ficha | a montagem |
| `apps/server/src/harness/spec/` | Muda: o campo `goal` da ficha | a montagem |
| `packages/hub-api/src/questions.ts` | Muda: o id do pedido e a sua expressão | o cartão (U7) |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/questions.ts
export const PlanRequestId = z.string().regex(/^P\d+$/).brand('PlanRequestId')
export const PLAN_REQUEST_IN_TEXT = /\bP\d+\b/g   // como uma tarefa cita um pedido (firstmate 4)

// A/app-builder/plan-tools.ts
const PlanRequest = z.object({ id: PlanRequestId, text: z.string().min(1) })
const PlanPhase = z.object({ title: z.string().min(1), requests: z.array(PlanRequestId).min(1) })
// o suspend do submit_plan leva { path, title, plan, requests, phases }

// H/spec/spec.ts: ConversationSpec.goal?: AgentGoalConfig
// no Construtor: { judge: o modelo da conversa, maxRuns: 50, maxSteps: 1000, tools: as leituras do juiz }
```

O dono do id do pedido é `PlanRequestId` (C23, conferido na borda do `submit_plan`, C27). O objetivo é a cópia da U2.

O arquivo modelo: `packages/hub-api/src/questions.ts`. Cumpre C23 (`ToolCallId` com marca, só por parse) e C26
(`QUESTION_LIMITS` e `Task` têm um dono); o `status` da tarefa é do Mastra, e a C21 vale lá.

### As skills e a leitura

`mastra` (`docs-harness-goals.md`); `pstack:typescript-best-practices`.

### A ordem do trabalho

1. **O modelo do plano.** Critério: 13. A skill ganha a etapa Pesquisar (estudo irmão, seção 11, item 2: uma referência
   que a pessoa admira, o que um bom app deste tipo tem, sugestões com a origem, nada da empresa na busca), os pedidos
   `P1…Pn`, as fases, as Referências, e o pedido de uma tarefa por fase que cite os pedidos dela. Fica "Change nothing
   in the app before they approve", como o Mastra Code mantém a frase junto do código.
   - **Arquivos:** muda as duas skills do plano e os seus `plan-template.md`; `packages/app/src/skills.test.ts`.
   - **Referência a seguir:** `F/boards/work.ts:17-25`; `MC/agents/prompts/build.ts:41-43`.
   - **Testes:** `packages/app/src/skills.test.ts`, o caso novo.
2. **A conferência na borda.** Critério: 12.
   - **Arquivos:** muda `A/app-builder/plan-tools.ts`, `A/app-builder/conversation-plan.test.ts`.
   - **Referência a seguir:** o `submit_plan` do núcleo (`C/tools/builtin/submit-plan.ts:20-45`).
   - **Testes:** "o plano sem pedidos numerados".
   - **Mutações à mão:** aceitar a lista vazia deixa vermelho "o plano sem pedidos numerados".
3. **O objetivo na aprovação.** Critérios: 14, 15, 16. No `approvePlan` da U2, depois da cópia e antes de o guarda
   deixar a rota seguir, o servidor chama `setObjective` com a cópia; o `goal` da ficha dá o juiz no modelo da
   conversa, `maxRuns` 50, `maxSteps` 1000 e as quatro leituras de hoje. O juiz por código do `A1` segue antes.
   - **Arquivos:** muda `A/app-builder/plan-version.ts`, `A/app-builder/builder.ts`, `H/spec/spec.ts`; testes
     `A/app-builder/conversation-goal.test.ts` (novo) e `A/app-builder/conversation-judge.test.ts`.
   - **Referência a seguir:** `CD/docs/references/docs-harness-goals.md:27-50`; `MC/index.ts:1514-1515`;
     `MC/agents/tool-availability.ts:178-184`.
   - **Testes:** `conversation-goal.test.ts`, com o dublê de modelo; `conversation-judge.test.ts`, a regressão do 16.
   - **Mutações à mão:** `maxRuns` 20 deixa vermelho o 14; pôr `write_file` nas ferramentas do juiz deixa vermelho o
     15; rodar o juiz do goal antes do `conexusCheck` deixa vermelho o 16.
4. **As gravações `plan` e `tasks` na versão instalada (issue 1175).** Critérios: 33 (a leitura da tela).
   - **Arquivos:** regrava `apps/server/src/platform/recordings/mastra/plan.jsonl` e `tasks.jsonl` com
     `npm run record`; muda `apps/server/src/platform/recordings.test.ts`, que passa a exigir a 1.83.0 das duas.
   - **Testes:** `recordings.test.ts`; `W/plan-recorded.test.tsx` e `W/fold.test.ts` seguem verdes com a forma nova.
   - **Pronto quando:** o cabeçalho das duas gravações diz `"version":"1.83.0"`.

### Como se prova

- **12.** O dublê manda um plano sem `P1…Pn` pela rota de mensagens; o pedido seguinte leva o motivo, e nenhum cartão
  abre. Hoje o plano passa.
- **13.** O teste lê a skill publicada. Hoje ela não tem a etapa Pesquisar.
- **14, 15.** O dublê aprova um plano de três fases; o `GET …/goal` devolve a cópia com `maxRuns` 50, e o pedido do
  juiz ao dublê leva só as leituras. Hoje não há objetivo.
- **16.** O fim com uma tarefa aberta pontua 0 antes de o juiz do goal rodar, no banco de teste (T26).

### Parar se

- O juiz no modelo da conversa não passar pela fila de contas do Conexus (a conta da empresa): parar; o juiz nunca
  roda fora da conta da conversa.
- A lista do modo plano do Mastra Code não traz as ferramentas de skill; se o ajuste de um plano em `plano` precisar
  da skill carregada de novo, parar e levar ao fundador.

## U6 As recusas como erro da ferramenta

**Base e modelo.** O commit da U3. Sonnet.

### As linhas da tabela

- **As recusas como erro da ferramenta**. Na base: `H/tools/connectors/connector-tools.ts:170-186` (`failedRead` e
  `unansweredRead`, devolvidos como resultado), `H/tools/app-data/tools.ts:37-51` (`answered`, idem), as cópias do
  Construtor de agentes (AGT-7: `A/agent-builder/tools.ts:35`, `:76`; `A/agent-builder/code-tool.ts:114`), e as que já
  cumprem a C79 (`A/saved-agent/tools.ts:27-54`, `ConnectorRefused` e `refuse`; `H/tools/data/tools.ts:10-31`,
  `DataRefused` e `refused`). Na tela: `thrownOf` e `readRefusal` (`W/connector-specs.ts:107-134`), lidos por
  `W/assistant-specs.ts:81`, `W/construtor-specs.ts:220`, `W/data-specs.ts:42` e `W/tool-bodies.tsx:222`, `:232`. A
  issue 1016 pede um dono só, lançado, e a frase de orientação na descrição da ferramenta ou na skill, não em cada
  resultado.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/harness/tools/` | Cria `refusal.ts`, a dona; muda as ferramentas de conector e de dados do app; apaga `DataRefused` | os quatro agentes |
| `apps/server/src/agents/agent-builder/`, `apps/server/src/agents/saved-agent/`, `apps/server/src/agents/assistant/`, `apps/server/src/agents/app-builder/` | Muda: apagam as cópias (`ConnectorRefused`, `refuse`, os `Refused` como resultado) e usam a dona | — |
| `apps/web/src/harness/room/` | Muda: `readRefusal` passa a ler a falha lançada por `thrownOf` | a sala da conversa |

### Os contratos que a unidade cria

```ts
// H/tools/refusal.ts
export class ToolRefused extends Error { override readonly name = 'ToolRefused' }
export type Refusal = Readonly<{
  kind: string
  native?: Readonly<{ status: number; code: string | null; message: string | null; body: unknown }>
  reason?: string
}>
/** Lança o JSON `{ kind, status, code, message, body, reason? }`, cortado no teto da C79. */
export function refuse(answer: Refusal): never
```

O que se apaga: `ConnectorRefused` e `refuse` de `A/saved-agent/tools.ts`, `DataRefused` e `refused` de
`H/tools/data/tools.ts`, o `Refused` devolvido como resultado em `A/agent-builder/tools.ts` e `code-tool.ts`. A frase
de `failedRead` ("This does not show a refusal of access…") vai para a descrição do `connector_read`
(`connector-tools.ts:217-290`) e sai de cada resultado. A forma do texto lançado é a que a tela já lê (`Thrown`,
`W/connector-specs.ts:107-112`), sem campo novo. O dono da recusa que o modelo lê é `refuse` (C26); nenhuma rota,
tabela ou id novo. O código de falha do Mastra é o nativo, `TOOL_EXECUTION_FAILED` (C79).

O arquivo modelo: `A/saved-agent/tools.ts`. Cumpre C21 e C22 (`WriteAuthor`, uma união por `kind`), C23 (`AgentId` e
`PersonId` com marca) e C26 (`refuse`, um dono).

### As skills e a leitura

`conexus-connector` (as ferramentas de conector); `mastra` (o caminho nativo do erro da ferramenta);
`pstack:typescript-best-practices`.

### A ordem do trabalho

1. **Uma dona**, na forma do agente salvo. Critério: 17.
   - **Arquivos:** cria `H/tools/refusal.ts`; muda `A/saved-agent/tools.ts`, `H/tools/data/tools.ts`.
   - **Referência a seguir:** `A/saved-agent/tools.ts:27-54`; `@mastra/core@1.83.0`, a falha lançada que vira
     `TOOL_EXECUTION_FAILED` (`tool-result-commit-core.ts:173`, pela auditoria).
   - **O que sai:** as duas classes e as duas funções, com os seus chamadores passando à dona.
   - **Testes:** `H/tools/data/tools-refusals.test.ts` e `A/saved-agent/approval-refused.test.ts` seguem verdes.
   - **Mutações à mão:** devolver a recusa como resultado na dona deixa vermelhos os dois.
2. **Os quatro por ela.** Critérios: 17, 30.
   - **Arquivos:** muda `H/tools/connectors/connector-tools.ts`, `H/tools/app-data/tools.ts`,
     `A/agent-builder/tools.ts`, `A/agent-builder/code-tool.ts`, `W/connector-specs.ts`; os testes do critério 17.
   - **Referência a seguir:** issue 1016; a dona do passo 1.
   - **O que sai:** `failedRead` como resultado; o `REFUSED` e o `FAILED` devolvidos por `answered`; os `Refused` do
     Construtor de agentes.
   - **Testes:** `connector-tools.test.ts`, o caso de `:258` regravado; `conversation-connectors.test.ts`, "a recusa
     chega ao modelo como erro"; os quatro `request.test.ts`, com a diferença só no texto da recusa;
     `W/data-specs.test.tsx` e `W/construtor-rows.test.tsx`, a linha da recusa.
   - **Mutações à mão:** voltar a devolver `failedRead` como resultado deixa vermelho "a recusa chega ao modelo como
     erro"; tirar a leitura por `thrownOf` de `readRefusal` deixa vermelha a linha da recusa na tela.
   - **Pronto quando:** no Hub local com o dublê do Sankhya, uma leitura recusada aparece na conversa com a frase de
     hoje, e o pedido seguinte ao dublê de modelo leva o erro da ferramenta.

### Como se prova

- **17.** O dublê do fornecedor recusa uma leitura; pela rota de mensagens, o pedido seguinte ao dublê de modelo leva o
  resultado da ferramenta como erro, com o corpo cortado; a tela mostra a recusa. Hoje o resultado chega como sucesso
  com `READ_FAILED`.
- **30.** Os quatro `request.test.ts`: os dos três outros agentes mudam só no texto da recusa.

### Parar se

- Um retrato mudar além do texto da recusa.
- Uma recusa do Construtor de agentes ser do serviço do Conexus, e não do fornecedor, e a C79 não a cobrir: parar e
  levar ao revisor, com o código de falha; não lançar o que a C79 não pede.

## U8 O Construtor igual ao Mastra Code

**Base e modelo.** O commit da U6. Opus: o desenho cruza a harness (o texto base, a ficha, a
máquina, as contas) e o Construtor, e a escolha do modelo de cada ajudante passa pela fila de contas.

### As linhas da tabela

- **O agente do Construtor**, **o texto base e as trocas**, **a primeira linha**, **o idioma**, **o espaço do
  anfitrião**, **o AGENTS.md**, **o MEMORY.md**, **o cache do texto**, **os nomes curtos**, **as ferramentas de cada
  modo**, **as ferramentas tiradas**, **os ajudantes**, **o modelo dos ajudantes**, **a edição pela árvore do código**,
  **o `lsp_inspect`**, **a caixa de avisos**, **o plano recusado**, **os detalhes do `submit_plan`**, **a opção
  recomendada** (o campo). Na base: `A/app-builder/builder.ts:132-183`, `A/app-builder/prompt/builder.md:1-76`,
  `A/app-builder/prompt/prompt.ts:67-150`, `A/app-builder/instructions.ts`, `H/spec/mount.ts:143-192`,
  `H/spec/factories.ts:102-149`, `H/spec/ask-user.ts:35-65`, `H/machine/workspace.ts:25-45`,
  `H/model-accounts/side-calls.ts:88`, `H/model-accounts/auto-memory-model.ts:25-29`, `A/assistant/research.ts:40-63`
  (o `forked` fechado, que o Construtor não copia), `packages/hub-api/src/tools.ts:11-71`,
  `packages/hub-api/src/questions.ts:10`, `W/tool-registry.ts`, `W/research-specs.ts`, `W/machine-specs.ts`,
  `infra/e2b/template.ts`. Na referência: `CD/coding-agent/prompt.d.ts`, `CD/coding-agent/index.js:8-12`, `:38`;
  `CD/docs/references/reference-coding-agent-build-base-prompt.md`, `reference-coding-agent-create-coding-agent.md`;
  `MC/agents/prompts/index.ts:172-238`, `MC/agents/prompts/tool-guidance.ts:16-267`, `MC/agents/prompts/build.ts:12-82`,
  `MC/agents/prompts/plan.ts:15-147`, `MC/agents/instructions.ts:10-129`, `MC/agents/subagents/`,
  `MC/agents/tool-availability.ts:140-184`, `MC/tool-names.ts:53-67`; no Mastra Code 0.50.3, `MCD/agents/prompts/index.js:45-140`,
  `MCD/agents/prompts/tool-guidance.js:40-100`, `MCD/agents/modes/build.js:6`, `MCD/processors/plan-rejection-abort.js`,
  `MCD/onboarding/pack-activation.js:61-67`; `C/workspace/lsp/manager.ts:301`, `C/workspace/tools/tools.ts:626-632`.
  O texto lado a lado é o da seção R9 do relatório da revisão, com as notas da R10.

### O desenho

O texto de sistema do Construtor, na ordem do Mastra Code (`MCD/agents/prompts/index.js:45-140`): a linha da
assinatura (só no login da assinatura Claude, como hoje, `H/model-accounts/claude/models.ts:87`); o texto base; o guia
das ferramentas; o bloco do lugar (o espaço do anfitrião); o AGENTS.md; o índice do MEMORY.md; o bloco do modelo; o
texto do modo e o texto do próprio modo, que o controlador junta (`agent-controller-D5EKeS1H.js:8792` na 1.86); e os
blocos que o Mastra acrescenta (a lista de tarefas, a máquina, as skills, como usar as skills, o `recall`, com a marca
de cache de uma hora no último). Das 42 seções do modo construir, 16 ficam iguais, palavra por palavra; 5 mudam só um
valor por opção nativa; as outras levam uma troca nomeada; saem 2.

As trocas, uma por motivo. Cada uma acha o seu trecho pelo título da seção, e um teste falha quando não acha.

| Seção | A troca | O motivo |
| --- | --- | --- |
| A identidade (`CD/coding-agent/index.js:12`) | "You are Conexus, an agent working with the user toward their goals, using your own judgment along the way." | ID A; a frase é fixa no núcleo; só o nome é opção (`:8`) |
| # Environment | os valores da máquina do app; o modo `construir` ou `plano` | igual na forma |
| ## Goal Mode Awareness | `planApprovalStartsGoal: true` dá a linha nativa; sai "Users can start goal mode directly with /goal <objective>." | o Conexus não tem `/goal`; o goal entra ao aprovar (decisão 4) |
| # Git Safety, ## Hard Rules | mais "Never run git push or change git settings: the server saves the version when the turn ends." | `builder.md:19`; o servidor grava a versão (`H/machine/scripts.ts:172`) |
| ## Secrets | mais as regras de hoje de `builder.md:19`, sem "in Portuguese" | as senhas vêm pelos conectores; nenhuma linha fixa idioma (R10) |
| ## Commits | o agente não faz commit | o servidor grava a versão; o núcleo não tem opção que tire a seção |
| ## Pull Requests | sai | "git sim, github não, por agora" |
| # Important Reminders | caminho e nome de arquivo só quando um desenvolvedor pedir | quem lê não programa (`builder.md:13`) |
| # File Access & Sandbox | sem `request_access`; a pasta do app é a única da pessoa | F2 |
| ## Core Principles | depois de "Autonomy First": regra de negócio e dado da empresa são da pessoa, nunca um palpite; sai a regra de hoje de anunciar cada grupo de ferramentas (`builder.md:26`) | `builder.md:63`; O3 A da rodada 9 |
| # Tone and Style | a primeira linha: "Your output is shown in the Conexus chat, as Markdown, to people who do not program." | não há terminal; sem idioma fixo (R10) |
| O guia, `execute_command` | sai "docker"; a descrição é "a 5-10 word summary in words a colleague who does not program understands", com os exemplos em inglês ("Reading the sales screen", "Fixing the first of 3 errors"); a linha do `tail` (`MCD/agents/prompts/tool-guidance.js:44`) volta, e "the full output streams to the user" vira "the output is not shown to the person" | a máquina não tem docker; TAIL A: o chat não mostra a saída do comando (`W/tool-registry.test.ts:10-26`) |
| O guia, `lsp_inspect` e `notification_inbox` | os blocos nativos, inteiros (`tool-guidance.js:48-56`, `:57-62`) | FER A, AVISO A |
| O guia, a web | `web_fetch` no lugar de `web_extract` (`tool-guidance.js:81-90`) | a leitura de páginas do fornecedor, sem chave paga de fora |
| O guia, `submit_plan` e a pasta do plano | `plansDir: '.conexus/plans'` | opção nativa (`MCD/agents/prompts/index.js:63-66`) |
| O guia, as ferramentas do Conexus | oito blocos novos, no formato do Mastra Code, com o texto das descrições de hoje (`A/app-builder/processors.ts:20-24`, `H/tools/app-data/tools.ts:25-29`, `H/tools/connectors/connector-tools.ts:217-290`, `H/tools/data/tools.ts:54-58`) | as ferramentas próprias |
| O guia, as tiradas | F1, F2, F3, F5, F6 e F7 pela lista nativa (`disabledTools`) | o guia omite o bloco sozinho (M4) |
| O espaço do anfitrião | o bloco do lugar, "# Conexus: the Builder", com How this place works, The app, Company data, Saved data, This app's memory, This machine e as ligações (o texto da R9) | é o espaço nativo; saem do `builder.md` as linhas que o texto base já diz (`:11`, `:13`, `:25`, `:26`, `:27`, `:29`, `:32`, `:61`, `:65`, git e senhas de `:19`) e a frase errada de `:56` (R5f) |
| # Agent Instructions | `<!-- Project instructions from AGENTS.md -->` e o AGENTS.md do app, do `main` | igual na forma; não há arquivo global da pessoa |
| # Project memory | o índice do MEMORY.md, como hoje (`builder.md:74-76`) | MEMORY.md A |
| O bloco do modelo | vazio para o Claude | a issue 1017 enche o da OpenAI |
| # Build Mode, ## Working Style | mais "- For a new app, or any request that leaves open what the app must do: write the plan and submit it with submit_plan before you build." | D1, M4 |
| ## Verification is Required | mais a linha do `conexus_check` | a conferência do Conexus é o teste que vale |
| ## Git in Build Mode | sai | o agente não faz commit nem cria ramo |
| O texto do próprio modo, construir e plano | igual, menos os fluxos | F3 |
| O plano, o guia das ferramentas | mais a web, o explorador e o planejador | FER A no modo plano |
| O plano, mudar de modo | "/mode build" vira o seletor da caixa | U1 e U7 |
| Os modos no código copiado | o guia e as instruções copiados perguntam por `'plan'` e `'build'` (`MCD/agents/prompts/tool-guidance.js:64`, `:133`, `:139`, `:146`; `MCD/agents/instructions.js:26`); a chamada passa `MODE_KIND[modeId]`, e a cópia fica igual | firstmate 7; os nomes dos modos são da decisão 2 |
| O plano, o que a pessoa faz com o plano | os botões "Aprovar e construir" e "Pedir ajustes"; o goal ao aprovar; a recusa com motivo refaz o plano | o que o código 1.21.0 faz (`MCD/processors/plan-rejection-abort.js:23`) |

As ferramentas de cada modo, com os nomes curtos do Mastra Code:

| Modo | As ferramentas | Quantas |
| --- | --- | --- |
| `construir` | `task_write`, `task_update`, `task_complete`, `task_check`, `notification_inbox`, `web_search`, `web_fetch`, `recall`, `ask_user`, `subagent` (explorador, planejador, executor), `submit_plan`, `view`, `write_file`, `string_replace_lsp`, `find_files`, `delete_file`, `file_stat`, `mkdir`, `search_content`, `ast_smart_edit`, `lsp_inspect`, `execute_command`, `get_process_output`, `kill_process`, `skill`, `skill_search`, `skill_read`, `conexus_check`, `connector_read`, `connector_notes`, `connector_note_save`, `app_data_read`, `app_data_check`, `data_describe`, `data_query` | 35 |
| `plano` | `task_write`, `task_update`, `task_complete`, `task_check`, `notification_inbox`, `ask_user`, `submit_plan`, `view`, `write_file`, `string_replace_lsp`, `find_files`, `file_stat`, `search_content`, `lsp_inspect`, `connector_read`, `connector_notes`, `app_data_read`, `data_describe`, `data_query`, `web_search`, `web_fetch`, `subagent` (explorador e planejador) | 22 |
| o juiz do goal | `view`, `search_content`, `find_files`, `file_stat`, `lsp_inspect` | 5 |

Os ajudantes: o explorador e o planejador ganham as leituras do Conexus e a web; o executor é o do Mastra Code, com as
ferramentas da máquina. O agente principal confere o que volta, como a seção "Subagent Rules" manda.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/harness/prompt/` | Cria `base.ts` (o `buildBasePrompt` com as trocas e a chave) e `mastra-code/` (o guia e os textos dos modos copiados, com a licença); muda `instructions.ts` | o Construtor; os outros três no `A6` |
| `apps/server/src/harness/spec/` | Muda: a ficha leva o texto de cada modo, a chave das instruções de código e a montagem por `createCodingAgent`; `ask-user.ts` ganha `recommended` | os quatro agentes |
| `apps/server/src/harness/machine/` | Muda: os nomes curtos por agente, a `ast_smart_edit` ligada, o servidor de linguagem | as máquinas das conversas |
| `apps/server/src/harness/model-accounts/` | Muda: o modelo de cada ajudante | o `subagent` |
| `apps/server/src/agents/app-builder/` | Cria `subagents.ts`, `plan-rejection.ts`; muda `builder.ts`, `plan-tools.ts`, `instructions.ts`, `prompt/` | a ficha do Construtor |
| `packages/hub-api/src/tools.ts`, `packages/hub-api/src/questions.ts` | Muda: os nomes curtos do Construtor; o campo `recommended` | o servidor, a tela |
| `apps/web/src/harness/room/` | Muda: o registro das ferramentas pelos nomes curtos; os rótulos dos três ajudantes | a sala da conversa |
| `infra/e2b/template.ts` | Muda: o servidor de linguagem do TypeScript no modelo da máquina; o comentário do `setEnvs` diz o que vale (issue 1334, firstmate 9) | a máquina E2B |
| `package.json`, `package-lock.json`, `apps/server/package.json` | Muda: o pacote `@ast-grep/napi` | o servidor |

### Os contratos que a unidade cria

```ts
// H/prompt/base.ts
export function conexusBasePrompt(input: {
  context: Omit<PromptContext, 'productName' | 'planApprovalStartsGoal' | 'toolGuidance'>
  toolGuidance: string
  codeInstructions: boolean        // a chave da ficha (cartão 1 a); ligada no Construtor
}): string                         // lança se uma troca não acha o seu trecho
export const BASE_PROMPT_SWAPS: readonly Readonly<{ section: string; reason: string }>[]

// H/spec/spec.ts
// ConversationMode ganha prompt?: string (o texto do modo, copiado do Mastra Code)
// ConversationSpec ganha codeInstructions: boolean e hostInstructions: OF_RUN

// A/app-builder/subagents.ts
export const BUILDER_SUBAGENT = { explore: 'explore', plan: 'plan', execute: 'execute' } as const

// packages/hub-api/src/questions.ts
// Option ganha recommended?: boolean; Question confere no máximo uma (superRefine)

// packages/hub-api/src/tools.ts
// BUILDER_MACHINE_TOOL = { view, write_file, string_replace_lsp, find_files, delete_file, file_stat,
//   mkdir, search_content, ast_smart_edit, lsp_inspect, execute_command, get_process_output, kill_process }
```

O dono dos nomes curtos é `BUILDER_MACHINE_TOOL` (C26); `WORKSPACE_TOOL` fica para os outros três (firstmate 1). O dono
da lista de trocas é `BASE_PROMPT_SWAPS`, que o teste lê. O dono dos ids dos ajudantes é `BUILDER_SUBAGENT`. O texto de
construir recebe o `activePlan` da cópia da U2 só com `title`, `plan` e `approvedAt`; o `path` fica no `threadState`. O
guia e as instruções copiados recebem o modo por `MODE_KIND` da U1. Nenhuma tabela do Conexus nova; a de avisos é do
Mastra, sem chave estrangeira (critério 29).

O arquivo modelo: `packages/hub-api/src/tools.ts`. Cumpre C26 (`WORKSPACE_TOOL`, um dono, provado igual ao do Mastra
em `closure.test.ts:281`); não tem id nem ciclo de vida (C21 e C23 não se aplicam).

### As skills e a leitura

`mastra` (do `node_modules`: `reference-coding-agent-build-base-prompt.md`, `reference-coding-agent-create-coding-agent.md`,
`docs-subagents.md`, `docs-harness-goals.md`); `typescript-magician` para as trocas; `shadcn` só para os rótulos;
`pstack:typescript-best-practices`. Ler primeiro a seção R9 do relatório da revisão, o texto lado a lado.

### A ordem do trabalho

1. **O texto base na harness, com as trocas.** Critérios: 18, 19, 27.
   - **Arquivos:** cria `H/prompt/base.ts`, `H/prompt/mastra-code/` (o guia, os textos de construir e plano, com o
     cabeçalho da licença Apache 2.0, da versão 1.21.0).
   - **Referência a seguir:** `CD/coding-agent/prompt.d.ts` (`PromptContext`); `MC/agents/prompts/index.ts:232-238`.
   - **Testes:** `A/app-builder/request.test.ts`: o texto de sistema no pedido ao dublê, seção a seção com
     `BASE_PROMPT_SWAPS`; "a chave das instruções de código", com a chave ligada e desligada.
   - **Mutações à mão:** mudar o título de uma seção na cópia deixa vermelho o teste da troca; desligar a chave no
     Construtor deixa vermelho o 27; passar `'plano'` sem `MODE_KIND` ao guia deixa vermelho o retrato de `plano`, que
     perde o guia do modo plano e ganha as seções de construir.
2. **O Construtor nasce de `createCodingAgent`, com o bloco do lugar no espaço do anfitrião.** Critérios: 18, 20, 30.
   - **O que sai:** o `builder.md` de hoje; fica no arquivo só o bloco do lugar. Sai com ele o nome velho "Conexus
     Builder" de `builder.md:1` (issue 1420, item 4, no Construtor de apps).
   - **O que entra:** `createCodingAgent` com `workspace: undefined` (o controlador empresta a máquina), as contas e os
     processadores de hoje, o `goal` da U3. O AGENTS.md e o índice do MEMORY.md seguem lidos de `prompt.ts:126-150`.
   - **Testes:** `prompt.test.ts`, `request.test.ts` regravado, com a diferença listada no pull request.
3. **As ferramentas de cada modo, com os nomes curtos.** Critérios: 21, 28, 29.
   - **O que entra:** os nomes curtos na máquina do Construtor; a `ast_smart_edit` com o `@ast-grep/napi`; a
     `notification_inbox`; o `lsp_inspect` com o servidor de linguagem no modelo da máquina; as tiradas pela lista
     nativa; o juiz do goal ganha o `lsp_inspect`. A tela lê os nomes curtos.
   - **Testes:** `request.test.ts`, um retrato por modo; em `plano`, o texto tem o guia do modo plano e não tem as
     seções de construir; `conversation-machine.test.ts`, "a edição pela árvore do código"; `conversation-tools.test.ts`,
     a caixa de avisos e o catálogo; `W/tool-registry.test.ts`.
   - **Mutações à mão:** tirar `F3` da lista das tiradas deixa vermelho o retrato.
   - **O que entra também:** o comentário de `infra/e2b/template.ts` sobre o `setEnvs` passa a dizer que as variáveis
     valem na construção do molde e no que o programa de conferência exporta (issue 1334, firstmate 9).
4. **Os ajudantes.** Critérios: 22, 23. As três definições copiadas; o explorador no modelo de
   `autoMemoryModel(main, kind)`, ou no da conversa quando ele dá `null`; o planejador e o executor no da conversa; a
   guarda da U2 recusa o executor em `plano`; os rótulos na tela.
   - **Testes:** `A/app-builder/subagents.test.ts` (novo), pela rota de mensagens: o dublê guarda cada pedido, e o
     `model` e as ferramentas do pedido de cada ajudante dizem onde ele rodou e o que pôde.
   - **Mutações à mão:** pôr o executor no modelo leve deixa vermelho "o modelo de cada ajudante".
5. **As três peças da 1.21.0.** Critérios: 24, 25, 26. O processador do plano recusado; o `submit_plan` com a
   descrição do núcleo, a recusa do plano vazio e o erro marcado; o `recommended` na `ask_user` e na `Option`.

### Como se prova

O texto de sistema lido no pedido ao dublê e comparado seção a seção com a lista de trocas; o pedido ao modelo nos
retratos de cada modo; os ajudantes pelo dublê de modelo, com a máquina de teste; a `ast_smart_edit` num arquivo da
máquina de teste; a `notification_inbox` no banco de teste (T26). O que falha hoje: o texto é o `builder.md`, os nomes
são longos, não há ajudante nem caixa de avisos. Os critérios 31 e 32 não se provam no pull request: são as medições 3
e 4 do Lab, com modelo real, e esperam a sua palavra ("O custo do Lab").

### Parar se

- O `createCodingAgent` não aceitar a montagem da ficha (a máquina do controlador, os processadores das contas, a memória):
  parar e provar com um teste; a alternativa é o `new Agent` de hoje com os mesmos padrões, um por um.
- A lista das seções que a chave das instruções de código corta não estiver no cartão 1 a do estudo do agente geral:
  parar e perguntar.
- A busca do fornecedor não chegar a um ajudante: o explorador fica com a `web_fetch` e as leituras.
- A escolha da memória não der um modelo leve para a OpenAI (hoje só a Anthropic tem o seu, `auto-memory-model.ts:11`):
  o explorador segue no modelo da conversa nesse fornecedor, e o pull request diz por quê.
- O servidor de linguagem não ficar ligado pela máquina: o `lsp_inspect` sai, e uma issue diz por quê.
- A tabela de avisos pedir uma migração ou mudar o retrato do catálogo (`database-grants.sql`): parar; uma tabela nova
  pede o seu cartão.
- A guarda da U2 não alcançar as escritas de dentro de um ajudante: parar.

## U7 O plano na tela

**Base e modelo.** O commit da U8 e o protótipo aprovado. Sonnet.

### As linhas da tabela

- **Os pedidos numerados e as fases** (na tela), **um plano novo fecha o anterior** (o rótulo), **o modo ao abrir**
  (o seletor), **o plano na caixa e "Continuar o plano"**, **a opção recomendada** (o destaque). Na base:
  `W/plan-card.tsx`, `W/plan-parse.ts`, `W/composer.tsx`, `W/task-panel.tsx`, `W/question-card.tsx`, `W/rows.ts`,
  `W/session-state.ts`, `H/routes/guard.ts:35-45`. Na referência: `node_modules/@mastra/server/dist/server/handlers/agent-controller.js:1550-1630`;
  `mastracode/tui/src/tui/goal-input-lock.ts:4-8`, `mastracode/tui/src/tui/setup.ts:247-275`; a barra do goal da Factory (`mastracode/factory-ui/src/ui/domains/chat/components/GoalPanel.tsx:29-67`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/harness/room/` | Muda: o cartão do plano, a caixa com o seletor e o plano, o cartão de pergunta | a sala da conversa |
| `apps/web/src/agents/app-builder/` | Muda: o Construir passa o modo e o objetivo à sala | — |
| `apps/server/src/harness/routes/guard.ts` | Muda: `GET` e `PUT …/goal`, o `PUT` só com `status` (`active` ou `paused`) | o Hub |
| `packages/hub-api/src/` | Muda: a forma do objetivo que a tela lê | a tela |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/goal.ts
/** O corpo do `PUT …/goal`: só retomar ou pausar (firstmate 2). */
export const GoalStatusPut = z.strictObject({ status: z.enum(['active', 'paused']) })
/** O estado do plano que a caixa mostra; sem objetivo, ou feito, nada. */
export type PlanGoal =
  | Readonly<{ kind: 'FOLLOWING'; runsUsed: number; maxRuns: number }>   // "seguindo o plano"
  | Readonly<{ kind: 'CHECKING' }>                                       // "conferindo o plano"
  | Readonly<{ kind: 'PAUSED'; reason: string | null }>                  // "o plano pausou", com o motivo
export function planGoalOf(goal: GoalRecord | undefined, judging: boolean): PlanGoal | undefined

// apps/web/src/harness/room/rows.ts
// PlanCardItem.state ganha 'superseded': um submit_plan que não é o último da conversa
```

`GoalRecord` é o esquema da resposta nativa (`goalRecordSchema`, `node_modules/@mastra/server/dist/server/handlers/agent-controller.js:1531-1545`),
lido na borda da tela (C27); `planGoalOf` é o dono da tradução (C26), e o `switch` dele acaba em `satisfies never`
(C21). O `judging` vem do pedaço `goal` do fluxo.

As rotas: `GET /agent-controller/:controllerId/sessions/:sessionId/goal` (o objetivo do fio, ou nenhum) e `PUT` no
mesmo caminho, entrada `GoalStatusPut`, conferida no guarda; acesso de quem conversa no Projeto (S10); falhas:
`REQUEST_MALFORMED` para outro campo (`judgeModelId`, `maxRuns`) ou outro `status`, 404 para `POST` e `DELETE`.

O arquivo modelo: `W/plan-card.tsx`. Cumpre C21 (`PlanState` por `kind`), C23 (`ToolCallId` só por parse) e C26
(`PLAN_TEXT`, um dono dos textos do cartão).

### As skills e a leitura

`impeccable` e `shadcn` para a tela, sobre o protótipo aprovado; `fastify-best-practices` para o guarda;
`pstack:typescript-best-practices`.

### A ordem do trabalho

1. **O protótipo**, aprovado antes. Critérios: 33 a 36, 26.
   - **Arquivos:** nenhum no repositório; as capturas vão ao pull request.
   - **Pronto quando:** o fundador aprova as telas a 1366 e 390 px, nos dois temas.
2. **O cartão do plano.** Critérios: 33, 35. Um pedido está conferido quando uma tarefa concluída o cita
   (`PLAN_REQUEST_IN_TEXT`); um cartão de um `submit_plan` que não é o último da conversa fica `superseded`.
   - **Arquivos:** muda `W/plan-card.tsx`, `W/plan-parse.ts`, `W/rows.ts`; cria `W/plan-card.test.tsx`.
   - **Referência a seguir:** a tarefa do Kiro que cita o requisito (firstmate 4); o rótulo do Lovable.
   - **Testes:** `W/plan-card.test.tsx`, "cada pedido conferido ou aberto", "o plano substituído".
   - **Mutações à mão:** contar como conferido um pedido de tarefa não concluída deixa vermelho o 33; tirar o
     `superseded` deixa os botões no plano antigo, e o 35 fica vermelho.
3. **A caixa.** Critérios: 34, 36. O seletor pela rota da U1; o estado do objetivo pelo pedaço `goal` do fluxo e pelo
   `GET`; "Continuar o plano" pelo `PUT`; Parar enquanto o juiz decide manda `status: 'paused'` pelo mesmo `PUT`.
   - **Arquivos:** muda `W/composer.tsx`, `W/session-state.ts`, `apps/web/src/agents/app-builder/`; cria
     `packages/hub-api/src/goal.ts`.
   - **Referência a seguir:** `mastracode/tui/src/tui/goal-input-lock.ts:4-8`;
     `mastracode/factory-ui/src/ui/domains/chat/components/GoalPanel.tsx:29-67`.
   - **Testes:** `W/composer.test.tsx`, o seletor, os três estados e "Continuar o plano".
   - **Mutações à mão:** tirar o `CHECKING` de `planGoalOf` deixa a caixa livre enquanto o juiz decide, e o 36 fica
     vermelho; mandar `status: 'active'` no Parar deixa vermelho o mesmo critério.
4. **As rotas do objetivo no guarda.** Critério: 37, e a retomada do 36.
   - **Arquivos:** muda `H/routes/guard.ts`, `H/routes/guard.test.ts`.
   - **Referência a seguir:** `agent-controller.js:1550-1630`; o ramo de `tool-approval` do guarda
     (`H/routes/guard.ts:350-356`).
   - **Testes:** `H/routes/guard.test.ts`, "a retomada do objetivo" e as recusas do 37.
   - **Mutações à mão:** tirar o `strictObject` deixa passar `maxRuns`, e o 37 fica vermelho.
5. **A opção recomendada.** Critério: 26.
   - **Arquivos:** muda `W/question-card.tsx`; cria `W/question-card.test.tsx`.
   - **Testes:** `W/question-card.test.tsx`, a opção destacada.
   - **Mutações à mão:** destacar a primeira opção em vez da marcada deixa o caso vermelho.

### Como se prova

- **26.** O cartão de pergunta com uma opção marcada, no teste de tela; a recusa da segunda marca é da U8.
- **33, 35.** O cartão do plano lido da transcrição gravada (`plan.jsonl`, na 1.83.0 pela U3), com tarefas concluídas
  e abertas, e com dois `submit_plan`; capturas a 1366 e 390 px, nos dois temas. Hoje o cartão não mostra os pedidos.
- **34.** O seletor troca pela rota da U1; o `GET` da sessão devolve o modo. Hoje não há seletor.
- **36, 37.** O Fastify de teste com o guarda, e o objetivo no banco de teste (T26): o `PUT` com `status` retoma sem
  zerar `runsUsed`; com `maxRuns` volta `REQUEST_MALFORMED`; `POST` e `DELETE` dão 404. Hoje as rotas dão 404.

### Parar se

- O protótipo pedir uma peça de `ui/` nova: ela entra com a sua linha de referência (design V62).
- A peça nativa já resolver a corrida entre o juiz e uma mensagem nova: o cartão prova com um teste, e a caixa fica
  livre enquanto o juiz decide.
- A pausa pelo `PUT` e a decisão do juiz se cruzarem e o objetivo ficar `active` depois do Parar: parar e levar ao
  revisor com o teste; não escrever uma trava do Conexus sobre a do Mastra.
- O fluxo não trouxer um pedaço que diga que o juiz está decidindo: parar; a caixa não infere o estado pelo tempo
  (C26).

## G1 O ponto de conferência

Um grupo só, um ponto de conferência, depois da U7 e antes de pedir a revisão da etapa: os passos 6 e 7 do
`conexus-build` no servidor e na tela; o roteiro 1 a 6 no Hub local com o dublê de modelo, com a troca de modo pela
rota, a recusa da guarda e a recusa do Dyad; os quatro agentes no Hub local com o dublê; o Construtor nos dois modos,
com os ajudantes e o retrato do pedido de cada modo; o QA da etapa (testing T25) a 1366 e 390 px, nos dois temas. Uma
construção curta com modelo real só com a sua palavra (o Lab). Depois da U3 e da U8, o builder roda o roteiro 1 a 4 no
Hub local antes do commit seguinte, sem ponto de conferência próprio.

## O custo do Lab

Os critérios 1 a 30 e 33 a 38 se provam com dublê de modelo, sem custo. As medições pedem modelo real e esperam a sua
palavra. Rodam nas assinaturas de modelo que você já deu.

1. **O juiz do goal:** quantas chamadas ele acrescenta por construção, até 1000 passos por fim candidato (três pedidos
   da régua, três tentativas, Claude e GPT: 18 construções).
2. **O Construtor antes e depois da U8**, no mesmo roteiro: acerto, custo por turno e acerto do cache (proposta: os
   mesmos três pedidos, três tentativas, Claude e GPT, antes e depois: 36 construções).
3. **O idioma** (critério 31): um pedido em inglês e um em português, Claude e GPT.
4. **O servidor de linguagem na máquina E2B** (critério 32): a `string_replace_lsp` com um erro de TypeScript e uma
   chamada ao `lsp_inspect`.
5. **Os ajudantes:** o custo do explorador no modelo leve numa leitura grande, como a rodada 6 do teste no Mastra
   Code.
