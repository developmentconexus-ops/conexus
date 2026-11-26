# A Prévia anda com o código

Trilho: harness

Conserto da issue [1472](https://github.com/developmentconexus-ops/conexus/issues/1472), "Construtor:
versão salva sem conferência nunca chega à Prévia; `conexus_check` SEEN não a envia", na trilha
Agentes e Apps, pela marca `Trilho: harness` (a vaga dos cartões do Construtor de apps e do harness).
A decisão do fundador, em 2026-11-26, no chat, à pergunta sobre a forma do conserto: "1 + 2". (1)
Desacoplar a Prévia do portão: toda versão salva que monta vai para a Prévia, o modelo ganha uma
ferramenta que põe na Prévia a pasta atual, como o `deploy_preview` do vibesdk, e o `conexus_check`
devolve também o estado da Prévia; a Prévia é ambiente de construção, e publicar continua o passo à
parte. (2) A conferência vira só ferramenta: o `isTaskComplete` volta ao uso que o Mastra documenta
(tarefas abertas e, se cabível, um juiz barato), e o build com navegador sai do fim obrigatório de
todo turno. Essas palavras vão para `docs/approvals/a-previa-anda-com-o-codigo.md` quando ele aprovar
esta página.

**Onde este cartão fica.** Cartão próprio, num pull request de rascunho. A forma do conserto muda
contratos (uma ferramenta nova em `CONVERSATION_TOOL`, o retorno do `conexus_check`, quem escreve o
`check` da versão, a chave de tentativa do envio), então a isenção de cartão do `AGENTS.md` ("alters
no contract") não vale. Não é emenda do cartão aberto da trilha, "A rede e o navegador sob pedido":
nada do escopo dele trata da Prévia, e uma mudança de escopo volta ao seu próprio cartão (delivery
L7). A trilha já tem o seu cartão em construção (delivery L5: um por trilha; o `processo` fica verde
para um segundo cartão só em rascunho). Por delivery L4, é um conserto de defeito de produção na
frente da fila; por delivery L1, depois de aprovado, as suas unidades começam a partir deste pull
request, ao lado do uso, dos consertos e do fechamento da rede, desde que não toquem arquivo de um
conserto da rede. O G3 da rede (U4, U5) é só `apps/web/`, e o G2 dela já está no `main` (#1467,
v0.24.135); a U1 daqui toca `Ag/app-builder/builder.ts` e o prompt, que a U3 da rede mudou, então um
conserto aberto da rede nesses arquivos para a U1 ("Parar se"). O cartão entra em `docs/steps/` quando
a rede fechar.

Lido em `main` `c9869a2e` (2026-11-26, v0.24.135). Versões: `@mastra/core` 1.83.0. Referências:
vibesdk em `32c9e429` (a prateleira não tem o `9da158d8` que o `stack.md` cita: "couldn't find remote
ref"; ver a dívida), Mastra Code na prateleira `mastra-1.83` em `d60ba71b`, bolt.diy em `72db5ce8`.
O diagnóstico, com o estado do Hub de produção e as duas contas de teste, está no estudo da
firstmate de 2026-11-26 (fora do repositório, delivery L21). Abreviações: `Ag/` =
`apps/server/src/agents/`, `H/` = `apps/server/src/harness/`, `Hub/` = `apps/server/src/hub/`, `API/` =
`packages/hub-api/src/`, `B/` = `apps/server/src/agents/app-builder/`.

## A página do fundador

**Linhas sem referência, para você ver antes de tudo.** Uma peça sai do que as referências fazem e
por isso é decisão sua (delivery L28): o "juiz barato" da decisão A. Nem o Mastra Code nem o vibesdk
lembram o modelo de conferir no fim do turno; os dois só pedem isso no prompt.

**No fim desta etapa** a Prévia mostra o app que o Construtor acabou de guardar, sempre que ele
monta, sem depender de a conferência com navegador ter passado no fim do turno. O Construtor tem uma
ferramenta para pôr a pasta atual na Prévia no meio do trabalho, e a conferência dele diz se a
Prévia está atrás da última versão guardada. O fim de cada turno deixa de rodar o navegador. O
Projeto "Produtos Similares e Complementares", parado hoje com a Prévia vazia, volta a ter Prévia no
primeiro turno que usar a máquina.

**O roteiro de uso.** Na nuvem, numa empresa de teste, como desenvolvedor de um Projeto novo.

1. Peça ao Construtor um app pequeno ("uma lista de tarefas com título e feito"), aprove o plano e
   espere o fim do turno. A conversa diz "Versão 1 guardada, montou" e, logo depois, que a Prévia
   está pronta. A aba **Prévia** abre o app.
2. Peça uma mudança ("um campo de prazo em cada tarefa") e diga: "Ponha na Prévia antes de terminar e
   me diga quando eu puder ver." No meio do turno aparece a linha da ferramenta da Prévia, que diz
   a versão 2. A aba **Prévia**, recarregada, já mostra o campo antes de o turno acabar; a versão 2
   aparece em **Versões**.
3. Peça: "Confira o app e me diga se a Prévia está em dia." A conversa mostra a conferência, e o
   Construtor diz qual versão está na Prévia e qual é a última guardada.
4. Abra o Projeto "Produtos Similares e Complementares" e peça: "Leia o app e me diga o que tem na
   tela de entrada." No fim do turno a aba **Prévia** mostra o app da versão 1, que até hoje nunca
   tinha ido.
5. Em **Versões**, as versões do passo 2 aparecem com os seus números. Publicar continua igual, em
   **Publicar**.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página e responde as decisões A e
B. No fim: faz o roteiro na nuvem, diz o que viu e aprova as frases novas: a descrição da
ferramenta não aparece para você, mas a frase de `APP_CHECK_FAILED` aparece, e passa de "O app não
passou na conferência depois de 4 tentativas." para "O app não montou. A Prévia segue com a versão
anterior.".

**A visão.** "Apps entrega, no navegador, o que uma pessoa usa e quem constrói": a pessoa que constrói
vê na Prévia o que acabou de ser guardado. "Nada age sem dizer antes": a Prévia é ambiente de
construção e não muda o que quem usa o app vê; publicar continua o passo separado, com o seu botão.

**O que você já decidiu, e como entra.**

- **1, a Prévia desacoplada do portão.** Entra como três peças, com um dono só para o envio
  (`Runs.preview`): o fim de todo turno que guarda uma versão monta essa versão (os passos da máquina,
  sem navegador) e a manda à Prévia quando monta; a ferramenta nova `conexus_preview` guarda a pasta
  atual como versão e a manda; e o `conexus_check` devolve `preview`, com a versão na Prévia, a última
  guardada e se a pasta mudou desde ela. Continua de pé a sua decisão "A" de 2026-10-24, "só uma
  versão que montou vai ao app" (`B/runs/runs.ts:49`): o que vai à Prévia é o que montou.
- **2, a conferência só como ferramenta.** O juiz do fim do turno fica só com as tarefas abertas, o
  uso que o Mastra documenta para `isTaskComplete` (um avaliador que diz se a tarefa terminou). O
  navegador roda só quando o modelo chama `conexus_check`. Isso também atende o `A3`, cujo marco pede o
  juiz de fim de turno pelas tarefas nos quatro agentes.

**Fica de fora.**

- Uma linha na aba **Prévia** dizendo "a versão N está guardada e ainda não foi para a Prévia". Com o
  envio em todo fim de turno, a Prévia só fica atrás quando um envio falha, e a conversa já mostra
  essa falha com o motivo. Fica para uma issue se o uso mostrar que faz falta.
- Mandar de novo uma versão cujo envio já falhou. O banco recusa o mesmo número duas vezes
  (`Hub/apps/tables.ts:184`, `app_version_project_id_number_key`); liberar isso pede migração. A
  próxima mudança vai como versão nova. Issue futura, com o gatilho: uma versão que falhou por falha
  passageira da Cloudflare e ficou sem sucessora.
- O ruído do Web Analytics da Cloudflare no console da Prévia (`beacon.min.js` recusado pela CSP). Não
  tem relação com este defeito; vai como issue pequena.

**As decisões suas nesta etapa.**

- **A. O lembrete de conferir no fim do turno.** Hoje o fim do turno obriga a conferência inteira, com
  navegador. Sem isso, quem lembra o modelo de conferir é só o prompt, como no Mastra Code
  ("Verify — Test that it works. Don't assume — actually run it", `sdk/src/agents/prompts/build.ts:52`)
  e no vibesdk ("Always deploy after generating files before testing",
  `worker/agents/operations/prompts/agenticBuilderPrompts.ts:56`). O critério do `A1` que você aprovou,
  "o Builder corrige sem ninguém avisar", hoje se apoia no portão.
  - **(a) Nenhum lembrete.** O fim do turno olha só as tarefas abertas; conferir é do modelo, pelo
    prompt. Veredito: nativo, igual às duas referências.
  - **(b) Um lembrete por código, uma vez por turno.** Se o turno mudou o app depois do último
    `conexus_check`, o fim do turno devolve ao modelo, uma vez: "Você mudou o app depois da última
    conferência. Rode `conexus_check` antes de terminar, ou diga por que não." Na segunda vez o turno
    termina. Não chama modelo extra; o navegador só roda se o modelo chamar a ferramenta. Veredito:
    nativo no Mastra (o avaliador de código é o exemplo da documentação do `isTaskComplete`,
    `docs-subagents.md:397-425`), fora do que as duas referências de produto fazem.
  - **(c) Um juiz por modelo**, que lê a conversa e pergunta "você conferiu?". Custa uma chamada de
    modelo por fim de turno e pode errar. Veredito: nativo no Mastra (`createRubricScorer`,
    `docs-subagents.md:426-462`), fora das referências.
  - **Recomendação: (b).** Mantém o `A1` de pé por quase nada, e não volta a amarrar a Prévia à
    conferência.
- **B. O fim do turno ainda monta o app.** "Toda versão salva que monta vai para a Prévia" pede uma
  montagem: a Prévia recebe a pasta que os passos da máquina constroem (`H/machine/pack.ts:8`, "the
  version a passing check left").
  - **(a) Sim, sem navegador.** Todo fim de turno que guardou uma versão roda os passos da máquina
    (instalar, conferir as operações, conferir os tipos, construir) e, se montou, manda à Prévia. Se
    não montou, a versão fica guardada como "não montou", a Prévia segue com a anterior, e o turno
    termina sem voltar ao modelo. Custa cerca de 35 s por turno que mudou o app (decisão 0055, "check
    35.3 s cold"). Veredito: nativo no que importa, a prévia segue o código sem esperar conferência, como no
    vibesdk (`worker/agents/core/behaviors/phasic.ts:649`) e no bolt.diy, cuja prévia segue cada
    mudança de arquivo (`app/lib/stores/previews.ts:173`). A diferença: lá não há a montagem de
    cerca de 35 s antes do envio; aqui ela fica porque a Prévia só recebe a pasta montada.
  - **(b) Não.** O fim do turno só guarda; vai à Prévia só o que o modelo mandar com
    `conexus_preview`. Mais barato, mas a versão órfã volta toda vez que o modelo esquecer.
  - **Recomendação: (a).** É o que as duas referências com prévia fazem, e fecha a classe inteira de
    "versão guardada que nunca chega".

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 (um PR) | U1 O fim do turno sem portão | O juiz fica com as tarefas abertas (e o lembrete da decisão A); o fim do turno monta sem navegador e manda à Prévia toda versão que montou; quem escreve o `check` da versão passa a ser o fim do turno; a chave de tentativa por versão; o prompt e a descrição do `conexus_check` corrigidos | `B/` (`processors.ts`, `runs/`, `prompt/builder.md`, `builder.ts` só se a decisão A for (a)), `Hub/apps/app-versions.ts`, `API/conversation-failures.ts` (a frase), `docs/explanation/` e `docs/reference/boundaries.md` (o texto do fim do turno) | testing | o cartão aprovado |
| G1 | U2 A ferramenta da Prévia e o estado da Prévia | `conexus_preview`; o `preview` no retorno do `conexus_check`; o fim de um turno sem mudança que manda a versão de `main` atrás da Prévia; o teste de regressão da issue 1472 | `B/` (`processors.ts`, `runs/`, `builder.ts`, `prompt/builder.md`, `closure.test.ts`), `API/tools.ts`, `Hub/apps/` (a porta `previewOf`, ao lado de `versions.ts`), `apps/server/src/main.ts` (a ligação), `apps/web/src/agents/app-builder/` (só o retrato da linha da ferramenta, se o teste de linhas pedir) | testing | U1 |
| G2 | U3 O fechamento | O `boundaries.md`, a explicação do turno, a issue 1472 fechada, a página da trilha, o cartão apagado | `docs/` | delivery | o uso |

**Orçamento de código alterado**, medido em `c9869a2e`: o que sai é contado das linhas de hoje, o que
entra é estimado pela forma do que sai. U1: sai cerca de 45 (`passedBy` e `feedback`,
`B/processors.ts:46-69`; o ramo da conferência do `judge`, `:121-132`; `passed()` e `judged` com o
`check`, `B/runs/runs.ts:49-52` e `:236-240`), entra cerca de 110 (a montagem no `#settle`, o
lembrete, a chave). U2: entra cerca de 170 (a ferramenta, `Runs.preview`, o `preview` do
`conexus_check`, a porta, o envio de `main`). U3: só documentos. Total: cerca de 325 linhas, sem
testes; um pull request de código (delivery L2, L9).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Um turno que muda o app e monta guarda a versão `passed` e a manda à Prévia; nenhum navegador roda no fim do turno (nenhum `confer`) | `B/conversation-preview.test.ts`, "o fim do turno monta e manda sem navegador" | must |
| 2 | U1 | Um turno que muda o app e não monta guarda a versão `failed` (`APP_CHECK_FAILED`), não manda nada à Prévia e termina sem voltar ao modelo: o modelo de teste recebe exatamente uma chamada no turno | `B/conversation-check.test.ts`, "o fim que não monta guarda e não volta ao modelo" | must |
| 3 | U1 | A máquina que não consegue montar no fim do turno guarda a versão `unchecked` (`CHECK_PLATFORM_FAILED`) e não manda | `B/conversation-check.test.ts`, o caso da máquina que não confere, reescrito | must |
| 4 | U1 | Tarefas abertas no fim do turno voltam ao modelo até `CHECK_LIMITS.checks` vezes; na última, se a pasta montou, a versão fica `unfinished` e vai à Prévia; se não montou, fica `failed` (ou `unchecked`) e não vai: o resultado da montagem vence quando não é `passed` | `B/conversation-check.test.ts`, os casos 14.2 reescritos | must |
| 5 | U1 | Decisão A (b): um turno que mudou o app depois do último `conexus_check` (ou sem nenhum) volta ao modelo uma vez, com a frase do lembrete; o segundo fim termina; um turno que conferiu depois da última mudança não volta. Com A (a), o critério é "nenhum turno volta ao modelo pela conferência" | `B/conversation-judge.test.ts`, "o lembrete volta uma vez" | must |
| 6 | U1 | Duas versões mandadas no mesmo turno não colidem na chave de tentativa: a do meio do turno (`<runId>:N`) e a do fim (`<runId>:N+1`) chegam as duas, e a Prévia fica com N+1 | `B/conversation-preview.test.ts`, "duas versões de um turno" (pela ferramenta e pelo fim, por isso só fecha com a U2; na U1, o caso direto em `B/runs/preview-send.test.ts`) | must |
| 7 | U1 | O prompt não diz mais que uma conferência que passou atualiza a Prévia, e a descrição do `conexus_check` não diz que o navegador abre o app "as the Projeto publishes it" | `B/prompt.test.ts`, "o prompt não promete a Prévia": as duas frases ausentes, por texto, no prompt montado e na descrição | must |
| 8 | U2 | `conexus_preview` com a pasta mudada guarda a versão N+1, monta, manda, e devolve `{ kind: 'SENT', version, preview: { state: 'ready' } }`; o Projeto passa a ter `appVersion` N+1 pela rota do Projeto | `B/conversation-preview.test.ts`, "a ferramenta guarda e manda no meio do turno" | must |
| 9 | U2 | `conexus_preview` com a pasta igual a `main` e `main` já na Prévia não guarda nem manda: `{ kind: 'CURRENT', version }`; com `main` mandada antes e falha, `{ kind: 'SENT_BEFORE', version }`, sem nova linha no Hub | idem, "a ferramenta sem mudança" e "a versão que já falhou" | must |
| 10 | U2 | `conexus_preview` com a pasta que não monta devolve `{ kind: 'NOT_BUILT', machine }` com o relatório; a versão fica guardada `failed` e a Prévia não muda | idem, "a ferramenta que não monta" | must |
| 11 | U2 | `conexus_preview` quando a máquina não pôde montar lança `CHECK_PLATFORM_FAILED`, como o `conexus_check` | idem | must |
| 12 | U2 | O `conexus_check` devolve `preview: { appVersion, savedVersion, folderChanged }`, lido do Hub e do Git, em todo `kind` | `B/conversation-check.test.ts`, "a conferência diz o estado da Prévia" | must |
| 13 | U2 | Regressão da issue 1472: a versão 1 guardada `unchecked` (a máquina falhou no fim do turno) e nunca mandada; o turno seguinte não muda nada, chama `conexus_check` (SEEN) e termina; no fim dele o Projeto tem `appVersion` 1. Hoje falha: `appVersion` fica `null` | `B/conversation-preview.test.ts`, "a versão guardada e não mandada vai no turno seguinte (1472)" | must |
| 14 | U2 | O fim de um turno que não tocou a máquina não manda nada, mesmo com a Prévia atrás; o fim de um turno sem mudança cuja `main` já tem linha no Hub (um envio que falhou, ou uma versão mais nova depois de **Voltar**) não monta nem manda, e não mostra falha | idem, "o turno que só conversa não liga a máquina" e "o número que falhou não volta" | must |
| 16 | U1 | Uma pergunta (`suspended`), um **Parar** (`aborted`) ou um erro (`error`) guardam a pasta como hoje, sem `check`, sem montar e sem mandar; só o fim `complete` monta | `B/conversation-check.test.ts`, "a pergunta não monta" (o caso de `:101` mantido) e "o Parar não monta" | must |
| 17 | U2 | Um **Parar** durante `conexus_preview` espera a ferramenta terminar antes do fim do turno: nada de `SAVE_REFUSED` nem duas versões do mesmo trabalho | `B/conversation-preview.test.ts`, "Parar no meio da ferramenta", com o envio parado (`holdUpload`) | must |
| 18 | U2 | Se a máquina não ouve que `main` andou depois de `conexus_preview` (`saved` falha), o fim do turno não recusa a versão: a máquina traz `main` antes de comparar, e o fim dá `unchanged` | idem, "a base que não andou" | must |
| 15 | U2 | O Construtor oferece `conexus_preview`; a lista fechada e o teste das ferramentas a conhecem | `B/closure.test.ts`, "a lista fechada"; `B/tool-names.test.ts`, "os nomes são os do contrato"; `tool-sets.test.ts`, o caso do Construtor de apps | must |

## A matriz de estados

Nenhuma tela nova. A linha da ferramenta na conversa usa a linha genérica de ferramenta que já
existe.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `VersionData.check` (`API/conexus-parts.ts:41-47`) | U1: o `#settle` do fim do turno, pela montagem (antes: o juiz, por `judged`) | `apps/web/src/harness/room/machine-line.tsx:48-75`; a ferramenta, no seu retorno |
| `VersionCheck` `unfinished` | o juiz, quando as tarefas abertas chegam ao limite (`Runs.judged`, só esse estado) | idem |
| `PreviewData` (`API/conexus-parts.ts:97-106`) | o `#settle` e `conexus_preview`, pelo mesmo `#send` | a conversa; o `again` de `B/end.ts:14` |
| `conexus_check` → `preview` | U2: `Runs.previewState` | o modelo |
| `conexus_preview` → resultado | U2 | o modelo; a linha da ferramenta |
| `attemptKey` do envio | U1: `<runId>:<número>` em `Hub/apps/app-versions.ts:38` | `storeAppVersion`, a chave única `app_version_project_id_attempt_key_key` |

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Uma dependência fora | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| A montagem no fim do turno (`machines.check`) | Não acontece: um fim por run (`Runs.finish`, `saving`) e uma conferência por vez (`mine.checking`, `B/runs/runs.ts:221`); pergunta, Parar e erro não montam | Um passo que falha: `failed`, nada vai | E2B fora: `unchecked`, `CHECK_PLATFORM_FAILED`, nada vai | `RUN_SETTLING`, `VERSION_SAVED` | 2, 3, 16 |
| O envio à Prévia (`sendVersion`) | Dois envios do mesmo Projeto: o segundo recebe `APP_VERSION_SENDING` (`Hub/apps/versions.ts:166`) | Uma migração recusada: `failed` com a causa, a versão anterior fica | Cloudflare ou Neon fora: `APP_VERSION_FAILED`; a versão fica guardada | `PREVIEW_SEND_FAILED` | 6, 8, 13 |
| `conexus_preview`: guardar no meio do turno (`saveRun`) | Duas chamadas no mesmo passo passam por `mine.checking`, uma depois da outra; um Parar, um erro ou uma pergunta no meio da ferramenta: o `#settle` espera `mine.checking` antes de guardar | `main` mudou por outra conversa: `stale`, `SAVE_REFUSED`, a ferramenta diz e nada vai | Git do volume fora: a falha da ferramenta, sem versão; a máquina que não ouve o `saved`: a próxima operação a sincroniza (`H/machine/machines.ts:118`), `MACHINE_BASE_NOT_MOVED` no log | `SAVE_REFUSED`, `VERSION_SAVED`, `MACHINE_BASE_NOT_MOVED` | 8, 9, 17, 18 |
| O envio de `main` no fim de um turno sem mudança | Um por fim de turno | Envio recusado: como acima; um número que já tem linha (falha, ou uma versão depois de **Voltar**) nunca se manda, nem monta | Hub fora ao ler `appVersion`: não manda, e o log diz | `PREVIEW_STATE_FAILED` | 13, 14 |

## A tabela de referência

Rótulos: **mesma situação** (a referência faz a mesma coisa no mesmo ponto do fluxo), **outra
situação** (com a diferença), **lido** (o código aberto), **documentado** (a página instalada).

| # | Peça | Unidade | O que o fundador já decidiu | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Quando a prévia recebe o código | U1 | "toda versão salva que monta vai para a Prévia" (2026-11-26); "A" de 2026-10-24, só o que montou | Só o fim de um turno que mudou e cuja conferência com navegador passou (`B/runs/runs.ts:50-52`, `:306-318`) | vibesdk `32c9e429`, **outra situação** (sem número de versão nem montagem antes do envio), lido; bolt.diy `72db5ce8`, **outra situação** (servidor de desenvolvimento no navegador, sem versão), lido | vibesdk manda à sandbox logo depois de gravar os arquivos da fase, antes dos consertos (`worker/agents/core/behaviors/phasic.ts:649-656`); o único filtro é o tipo do projeto (`behaviors/base.ts:1182-1186`, `isPreviewable`). bolt.diy mostra a prévia no `server-ready` (`app/lib/stores/previews.ts:173-177`) | nativo | — | B (a) | — |
| 2 | A ferramenta que põe na prévia | U2 | "uma ferramenta que põe na Prévia a pasta atual, como o deploy_preview" | Não há | vibesdk, **mesma situação**, lido | `deploy_preview`: "Uploads and syncs the current application to the preview environment" (`worker/agents/tools/toolkit/deploy-preview.ts:10-12`), chama `deployPreview` (`behaviors/base.ts:1173-1180`), na lista do construtor agêntico (`operations/AgenticProjectBuilder.ts:256-259`); o arquivo já foi gravado em Git (`saveGeneratedFiles`, `behaviors/base.ts:1111-1120`) | nativo | — | firstmate 2 | — |
| 3 | Como o turno termina | U1 | "o isTaskComplete volta ao uso que o Mastra documenta" | Avaliador `conexus-check` que roda a conferência inteira e devolve o relatório, até 4 vezes (`B/processors.ts:103-133`, `B/builder.ts:178-181`) | `@mastra/core` 1.83.0, **documentado**; Mastra Code `d60ba71b`, lido; vibesdk, lido | `isTaskComplete` "validates whether the task is complete", avaliadores que dão 0 ou 1 (`reference-agents-generate.md:49-59`); o exemplo é uma checagem de texto (`docs-subagents.md:397-425`). Mastra Code não usa `isTaskComplete` (nenhum uso em `mastracode/sdk/src` fora dos testes). vibesdk termina pelo sinal do modelo `mark_generation_complete` (`tools/toolkit/completion-signals.ts:15-16`, `AgenticProjectBuilder.ts:296`) | nativo | — | — | — |
| 4 | Quem lembra de conferir | U1 | a decisão A | O portão do fim do turno | Mastra Code, **mesma situação**, lido; vibesdk, **mesma situação**, lido | Só o prompt: "Verify" e "Verification is Required" (`sdk/src/agents/prompts/build.ts:52-65`); "Always deploy after generating files before testing" (`agenticBuilderPrompts.ts:56`) | nativo | (b) e (c) usam a forma nativa do Mastra, mas saem do que as referências de produto fazem (L28, a decisão A); (b) se prova em `B/conversation-judge.test.ts`, critério 5 | A | — |
| 5 | O estado da prévia que o modelo vê | U2 | "o conexus_check devolve também o estado da Prévia" | O retorno não diz nada da Prévia (`B/processors.ts:18-25`), e o prompt diz que o modelo nunca a vê (`B/prompt/builder.md:6`) | vibesdk, **outra situação** (devolve um endereço, não um número de versão), lido | `deployPreview` devolve "Deployment successful: <url>" (`behaviors/base.ts:1176`); o modelo lê `get_runtime_errors` e `get_logs` (`AgenticProjectBuilder.ts:259-260`) | nativo | — | — | — |
| 6 | O que a conferência promete ao modelo | U1 | — | O prompt promete que a conferência que passa atualiza a Prévia (`B/prompt/builder.md:56`); a descrição diz "as the Projeto publishes it" (`B/processors.ts:20`) | — | Frases nossas, nos campos nativos (`description` do `createTool`, as instruções do agente), que hoje dizem o contrário do código | nativo | `B/prompt.test.ts`, critério 7 | — | — |
| 7 | A chave de tentativa do envio | U1 | — | `attemptKey: input.runId` (`Hub/apps/app-versions.ts:38`), única por Projeto (`Hub/apps/tables.ts:185`): um envio por run | vibesdk, **outra situação** (sem chave: reenvia quantas vezes o modelo pedir), lido | `deploy-preview.ts:19` chama `deployPreview` a cada pedido | nativo | — | firstmate 5 | — |

**A medida do transplante.** Nada vem do repositório antigo. O portão do fim do turno nasceu lá
(`e0353c36` `apps/hub/src/builder/harness/controller.ts:159-175`, "The run's finish gate as Mastra's
own completion check (`isTaskComplete`)") e é ele que sai.

**A dívida.**

- O `stack.md` cita o vibesdk em `9da158d8`, que a prateleira não tem; este cartão lê `32c9e429`. A
  linha do `stack.md` muda no fechamento (U3), ou a prateleira busca o commit citado.
- Mandar de novo um número cujo envio falhou (ver "Fica de fora").

## As decisões do firstmate

| # | Decisão reversível (delivery L6) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | "Monta" quer dizer os passos da máquina passaram (`machines.check`, `ok`), sem navegador | O pacote é a pasta que a conferência da máquina deixa (`H/machine/pack.ts:8`); um programa só de construção seria um segundo dono da montagem | Separar a construção da conferência de tipos num programa próprio |
| 2 | `conexus_preview` guarda a pasta como versão nova antes de mandar | "a pasta atual", nas palavras do fundador; a Prévia só conhece versões numeradas (`Hub/apps/versions.ts:155-161`); o vibesdk também grava em Git antes de mandar (`behaviors/base.ts:1111-1120`) | A ferramenta manda só a última versão guardada |
| 3 | O fim de um turno que tocou a máquina e não mudou nada manda a versão de `main` quando ela nunca foi mandada (nenhuma linha no Hub com o seu número) | É o que conserta o Projeto parado sem depender do modelo; usa o mesmo `Runs.preview` | Tirar o ramo do `#settle`; sobra a ferramenta |
| 4 | A versão guardada pela ferramenta não ganha linha "Versão N guardada" na conversa; a linha da ferramenta diz a versão e a Prévia | Uma parte nossa no meio do turno pede um segundo caminho de partes; a aba Versões já lista a versão | Fazer a ferramenta escrever a parte `data-conexus-version` |
| 5 | A chave de tentativa vira `<runId>:<número>` | Duas versões no mesmo run colidem na chave única de hoje (`Hub/apps/tables.ts:185`) | Voltar a `runId`, com um envio por run |
| 6 | Só o fim `complete` monta e manda; pergunta, Parar e erro guardam sem montar | É o que o fim faz hoje (`B/conversation-check.test.ts:101`, "nem a conferência roda"); montar 35 s numa pergunta atrasaria a resposta e mandaria código pela metade | Montar em todo fim |

## U1 O fim do turno sem portão

**Base e modelo.** O `main` com este cartão aprovado. Sonnet: muda um fluxo que já existe, num módulo.

### As linhas da tabela

- **Linha 1.** Ler `B/runs/runs.ts:290-324` (`#settle`) e `:49-52` (`passed`). Seguir vibesdk
  `behaviors/phasic.ts:649-656`: manda depois de gravar, sem esperar conferência.
- **Linha 3.** Ler `B/processors.ts:46-163` e `B/builder.ts:178-181`. Seguir
  `node_modules/@mastra/core/dist/docs/references/reference-agents-generate.md:49-59` e
  `docs-subagents.md:397-425`.
- **Linha 4.** Seguir Mastra Code `sdk/src/agents/prompts/build.ts:52-65` para o texto do prompt.
- **Linha 6.** `B/prompt/builder.md:56`, `B/processors.ts:18-25`.
- **Linha 7.** `Hub/apps/app-versions.ts:30-54`, `Hub/apps/versions.ts:155-195`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `B/processors.ts` | Apaga `passedBy`, `feedback` e o ramo da conferência do `judge`; muda `conexusCheck` (só tarefas abertas, e o lembrete com A (b)); muda `CHECK_DESCRIPTION` | `B/builder.ts` |
| `B/runs/runs.ts`, `B/runs/context.ts`, `B/runs/save.ts` | Apaga `passed()` e o `check` de `Driven` lido pelo `saveRun`; `rounds` fica só `open` (e `remind` com A (b)); o `#settle` monta e manda | `B/end.ts`, `B/processors.ts` |
| `B/prompt/builder.md` | Muda a linha 56 | `B/prompt/prompt.ts` |
| `Hub/apps/app-versions.ts` | Muda `attemptKey` | `apps/server/src/main.ts` |
| `API/conversation-failures.ts` | Muda a frase de `APP_CHECK_FAILED` | a web, `sentenceOfCode` |
| `docs/explanation/app-package.md:105-118`, `docs/explanation/builder-turn.md:110-117`, `docs/reference/boundaries.md:998-1012` | Muda o texto do fim do turno | — |

### Os contratos que a unidade cria

```ts
// B/runs/context.ts
export type RoundKind = 'open' | 'remind' // 'remind' só com a decisão A (b); 'check' sai
// Driven perde `check` (`B/runs/context.ts:133-134`) e ganha:
export type Driven = {
  rounds: Record<RoundKind, number>
  /** O estado que o juiz deu às tarefas, só `unfinished`; a montagem é do #settle. */
  unfinished: Extract<VersionCheck, { state: 'unfinished' }> | undefined
  /** Se a pasta mudou depois do último conexus_check do turno (decisão A (b)). */
  checkedSinceChange: boolean
}
// B/runs/runs.ts
class Runs {
  /** Monta a pasta da máquina, antes de guardar: o check da versão e, se montou, a pasta empacotada. */
  #built(mine: Driven): Promise<
    | { check: Extract<VersionCheck, { state: 'passed' }>; folder: VersionFolder }
    | { check: Exclude<VersionCheck, { state: 'passed' | 'unfinished' }>; machine?: CheckReport }
  >
  /** Manda uma pasta montada à Prévia com o número já guardado: o dono único do envio. */
  #send(mine: Driven, number: number, folder: VersionFolder): Promise<PreviewData | undefined>
}
// Quem chama: o #settle (fim `complete`) e conexus_preview chamam #built, depois saveRun com o
// check, depois #send; o ramo sem mudança chama #built e #send com o número de `main`, sem saveRun.
```

- **Cada estado.** `VersionCheck` não muda de forma (`API/conexus-parts.ts:25-30`); muda o escritor
  (a matriz). `passed` = montou; `failed`/`APP_CHECK_FAILED` = não montou; `unchecked` = a máquina não
  pôde montar; `unfinished` = tarefas abertas no limite.
- **O dono de cada fato.** A montagem tem um dono, `#built`, e o envio, `#send` (C26). `CHECK_LIMITS.checks` segue o dono
  do limite das tarefas abertas.
- **O arquivo modelo.** `B/runs/save.ts`: cumpre C21 (o `Outcome` é união por `kind`), C23 (ids com
  marca) e C26.

### As skills e a leitura

As linhas de `@mastra/core` e `@mastra/evals` do `stack.md`: a skill `mastra`; ler primeiro
`node_modules/@mastra/core/dist/docs/references/reference-agents-generate.md` e `docs-subagents.md`.
`pstack:typescript-best-practices`.

### A ordem do trabalho

1. **Tirar o portão.** Critérios: 1, 4.
   - **Arquivos:** `B/processors.ts`, `B/runs/context.ts`, `B/runs/runs.ts`.
   - **O que sai:** `passedBy`, `feedback`, `judge` `:121-132`, `Runs.judged` com estados que não
     sejam `unfinished`, `rounds.check`.
   - **Os testes do portão, um por um** (cada um passa a provar o fim novo ou a ferramenta, ou sai):
     `B/conversation-check.test.ts:20, 35, 48, 77, 87, 101, 174, 199, 214, 239`;
     `B/conversation-confer.test.ts:60, 99, 114, 133, 148, 162, 174` (os de navegador passam para o
     `conexus_check`, que segue conferindo com navegador); `B/conversation-judge.test.ts:13`;
     `B/runs/preview-send.test.ts:59` ("só passed sobe": `unfinished` que montou agora sobe) e `:233`
     (a chave era `runId`); `B/builder.eval.test.ts`, onde o defeito plantado contava com o portão:
     passa a contar com o lembrete (A (b)) ou com a chamada do modelo (A (a)).
   - **O que entra:** o `judge` só com tarefas abertas. Regras: C21, C26.
   - **Mutações à mão:** devolver o ramo da conferência; o critério 1 fica vermelho (um `confer` roda).
2. **O fim do turno monta e manda.** Critérios: 1, 2, 3, 4, 16.
   - **Arquivos:** `B/runs/runs.ts`, `B/runs/save.ts`.
   - **Referência a seguir:** vibesdk `behaviors/phasic.ts:649`.
   - **O que entra:** o `#settle` espera `mine.checking` antes de tudo (uma ferramenta ainda
     rodando termina antes). Só no fim `complete` (`reason` de `agent_end`, Mastra 1.83
     `dist/agent-controller/types.d.ts:659-660`), e se `machines.changed`, `#built`; o `saveRun`
     recebe o `check` como argumento (não lê mais `mine.check`); `unfinished` do juiz troca só um
     `passed`; se montou, `#send`, como hoje `:310-318`. Pergunta, Parar e erro guardam sem `check`
     e sem montar, como hoje (critério 16). Nenhuma volta ao modelo.
   - **Testes:** os critérios 1 a 4, pela rota da conversa (`test-conversation.ts`, T5).
   - **Mutações à mão:** mandar também `failed`; o critério 2 fica vermelho.
3. **O lembrete (só com A (b)).** Critério: 5.
   - **O que entra:** `conexus_check` marca `checkedSinceChange = true`; o `#settle` não muda; o
     `judge` dá 0 uma vez por turno quando `runs.changed` e `!checkedSinceChange`. Uma escrita do
     modelo depois da conferência zera a marca: a marca é a comparação da árvore com a da última
     conferência (`machines.changed` mede contra a base; guardar a árvore conferida é a forma mais
     simples, "Parar se").
4. **A chave por versão.** Critério: 6. `attemptKey: \`${input.runId}:${input.number}\``.
5. **As frases.** Critério: 7. O prompt, linha 56, passa a dizer que todo fim de turno que muda o app
   monta e manda à Prévia o que montou, que `conexus_check` é a conferência com navegador, e que
   publicar é da pessoa. A descrição tira "as the Projeto publishes it": o navegador abre a pasta da
   máquina num Worker de conferência, com banco de teste vazio. A frase de `APP_CHECK_FAILED`, da
   página do fundador.

### Como se prova

Cada critério pela rota da conversa, com o modelo de teste (`platform/test-anthropic.ts`) e a
máquina de teste. Hoje o critério 1 falha (o fim do turno roda `confer`), o 2 falha (volta ao modelo
até 4 vezes), o 6 falha (a segunda chave colide).

### Parar se

- Um conserto aberto da rede muda `B/builder.ts` ou `B/prompt/builder.md`: esperar o merge dele.
- O lembrete precisa de um fato da árvore que `Machines` não dá sem um script novo: reportar a forma
  mínima antes de escrever.

## U2 A ferramenta da Prévia e o estado da Prévia

**Base e modelo.** A U1. Sonnet.

### As linhas da tabela

- **Linha 2.** vibesdk `tools/toolkit/deploy-preview.ts:10-30`, `behaviors/base.ts:1173-1180`.
- **Linha 5.** vibesdk `behaviors/base.ts:1176`; `Hub/projects/ports.ts:24` (`AppVersionsOf`, a forma
  da porta nova, ligada como ela em `apps/server/src/main.ts:193`); `B/git/repository.ts:49` (`version()`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `API/tools.ts` | Cria `CONVERSATION_TOOL.preview = 'conexus_preview'` | `B/builder.ts`, `CLOSED_TOOLS`, a web |
| `B/processors.ts` | Cria `previewTool(runs)` | `B/builder.ts` |
| `B/runs/runs.ts`, `B/runs/context.ts` | Cria `Runs.preview`, `Runs.previewState`; `RunsDeps.previewOf` | `B/processors.ts`, `apps/server/src/main.ts` |
| `B/prompt/builder.md` | Uma linha da ferramenta | `B/prompt/prompt.ts` |
| `B/closure.test.ts`, `tool-sets.test.ts` | A ferramenta nova nas listas | — |

### Os contratos que a unidade cria

```ts
// API/tools.ts
CONVERSATION_TOOL.preview: 'conexus_preview'
// B/runs/context.ts
/** `lastSent`: o maior número que já tem linha no Hub, pronta ou falha; um número não se manda duas vezes (`Hub/apps/tables.ts:184`). */
export type PreviewState = {
  appVersion: number | null
  lastSent: number | null
  savedVersion: number
  folderChanged: boolean
}
export type PreviewResult =
  | { kind: 'SENT'; version: number; preview: PreviewData }
  | { kind: 'CURRENT'; version: number }
  /** `main` já foi mandada e falhou: só uma versão nova vai (ver "Fica de fora"). */
  | { kind: 'SENT_BEFORE'; version: number }
  | { kind: 'NOT_BUILT'; version: number; machine: CheckReport }
RunsDeps.previewOf: (ids: { companyId: CompanyId; projectId: ProjectId }) => Promise<Pick<PreviewState, 'appVersion' | 'lastSent'>>
// B/runs/runs.ts
Runs.preview(requestContext): Promise<Result<PreviewResult, CheckPlatformFailed | 'SAVE_REFUSED'>>
Runs.previewState(requestContext): Promise<PreviewState>
// o retorno do conexus_check: BuilderCheck & { preview: PreviewState }
```

- **O esquema de entrada.** `conexus_preview` não recebe nada (`z.object({})`), como o
  `conexus_check`.
- **Falhas.** `CHECK_PLATFORM_FAILED` lança, como no `conexus_check` (`B/processors.ts:40`);
  `SAVE_REFUSED` lança com o seu código.

### As skills e a leitura

As da U1.

### A ordem do trabalho

1. **O estado da Prévia.** Critério: 12. `previewState` lê `previewOf` (a porta nova, em `Hub/apps/`, ao lado de
   `appVersionsOf`), `repository.version()` e `machines.changed`; o `conexus_check` o soma ao resultado em todo `kind`.
2. **A ferramenta.** Critérios: 6, 8 a 11, 15, 17, 18. `Runs.preview`, dentro de `mine.checking`:
   se a pasta mudou, `#built`, `saveRun` com o `check` e, se montou, `#send`. Uma pasta que não
   monta fica guardada `failed` em `main` de propósito: o código da pessoa não se perde, e a Prévia
   segue na anterior; se não mudou e `appVersion` é a de `main`,
   `CURRENT`; se não mudou e `main` já tem linha (`savedVersion <= lastSent`), `SENT_BEFORE`; se não
   mudou e `main` nunca foi mandada, `#built` e `#send` com o número de `main`. A descrição diz o que a ferramenta faz e que ela não abre navegador.
3. **O fim do turno sem mudança.** Critérios: 13, 14. No `#settle`, quando `saveRun` dá `unchanged` e
   a máquina foi tocada (`machines.touched`), `previewState`; se `main` nunca foi mandada (`lastSent` nulo ou menor que
   `savedVersion`), `#built` e `#send` com `savedVersion`; um número que já falhou não se tenta de novo a cada turno, e a parte `data-conexus-preview` vai na mensagem do fim.
4. **O teste da issue.** Critério 13: o primeiro turno escreve um arquivo e a máquina falha na
   montagem (`control.afterCommand`, como `conversation-judge.test.ts:24-29`); o segundo só lê um
   arquivo e chama `conexus_check`; depois do fim, `GET` do Projeto dá `appVersion: 1`.

### Como se prova

Pela rota da conversa e pela rota do Projeto. Hoje o critério 13 falha com `appVersion: null`, que é
o estado do Projeto de produção da issue.

### Parar se

- A porta `previewOf` lê numa transação de leitura da empresa: `main.ts` a liga como
  `(ids) => database.read({ kind: 'COMPANY', companyId, personId: null }, (tx) => …)`, igual ao
  `#nameOf` de `B/runs/runs.ts:138-144`; nunca um `select` em `Ag/`. Se a leitura sob o RLS da empresa
  pedir a pessoa, parar e reportar.
- `machines.changed` dá `true` depois de um `saveRun` no meio do turno mesmo com a máquina
  sincronizada (`H/machine/machines.ts:118`, o `sync` de uma sessão `unsynced`): reportar com o log.

## G1 O ponto de conferência

Depois da U2: a conversa do Construtor com o modelo de teste e a máquina de teste, os testes de
`B/` que a U1 e a U2 mudaram, `tool-sets.test.ts`, `B/prompt.test.ts` com o retrato, e o roteiro de
uso, passos 1 a 3, num Hub local com os dublês.

## U3 O fechamento

Delivery L19: o `boundaries.md` ganha a entrada do fim do turno nova e perde a do portão; a
explicação do turno e a do pacote; a linha do vibesdk no `stack.md`; a página da trilha; a issue
1472 fechada; o cartão apagado com a linha de uso.
