# Atualização do Mastra: de 1.79.0 para 1.82.0

Cartão curto de uma atualização de versão, fora da ordem do roteiro. O pedido do fundador, em
2026-11-04 (em `docs/approvals.md`): o conserto de Parar logo depois de o cartão aparecer vem com a
versão do Mastra que o corrigiu, sem conserto nosso. O conserto à mão saiu em
https://github.com/developmentconexus-ops/conexus/pull/686. Pela regra L5 o cartão entra em
`docs/steps/` quando o cartão da 24.3.1 sair no fechamento dela. Até lá ele vive no seu pull
request, e a verificação `second-card` de `check-docs` fica vermelha nele de propósito. Não houve
estudo à parte: as referências são os changelogs do Mastra, o `dist` das versões novas instalado numa
cópia de rascunho e o Mastra Code na tag `@mastra/core@1.82.0`. Tudo foi medido sobre o `main` em
`81004d8b`.

## A página do fundador

**No fim desta etapa** você aperta **Parar** no mesmo instante em que o cartão de uma pergunta
aparece, no Builder ou no Construtor, e o cartão fecha. Recarregada a página, ele continua fechado.
Isso vem do próprio Mastra na versão nova. Não tem conserto nosso.

**O roteiro de uso.**

1. No Hub no ar, abra um Projeto e peça ao Builder algo que o faça perguntar, por exemplo "faz um
   app de recados, mas me pergunta antes quem usa".
2. Assim que o cartão da pergunta aparecer, aperte **Parar**. O cartão fecha, sem os botões de
   resposta, e o Builder para.
3. Recarregue a página: o cartão continua fechado e a conversa aceita uma mensagem nova.
4. Faça o mesmo no Construtor, com um pedido que o faça perguntar: o cartão fecha do mesmo jeito.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. No fim: faz o roteiro e
diz o que viu.

**Fica de fora.** As novidades do Mastra que o Conexus não usa (o Knowledge, os agentes duráveis, o
Studio). As outras trocas de comportamento que a versão traz (lista abaixo, na tabela de
referência) entram como o Mastra as entrega, porque as referências fazem igual.

**As decisões suas nesta etapa.** Nenhuma. Duas coisas que pareciam decisão e não são:

- **Os dados.** O `@mastra/pg` novo apaga e recria as tabelas do Knowledge ao iniciar. O Conexus
  nunca criou essas tabelas: um banco iniciado pela versão de hoje não tem nenhuma, e a versão nova
  também não cria. Nada se perde. As outras tabelas do Mastra só ganham colunas. Medido: um banco
  atualizado da 1.32.0 para a 1.35.0 fica igual a um banco criado direto na 1.35.0.
- **A proteção de arquivo da área de trabalho.** Na 1.81.0, o Mastra deixou de recusar, por padrão,
  a escrita num arquivo que mudou depois de lido. O Mastra Code, a referência, usa esse padrão
  novo. O Builder escreve sozinho na sua máquina, então você não vê diferença.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | As versões novas, a regra nossa que o Mastra agora tem nativa, o teste de Parar de volta sem espera, as seções de `boundaries.md` e a linha de `stack.md` relidas na 1.82.0 | `package.json`, `package-lock.json`, `apps/server/package.json`, `apps/web/package.json`, `packages/app/package.json`, `apps/server/src/builder/model-accounts/`, `apps/server/src/builder/conversation/`, `apps/server/src/builder/mastra/`, `docs/reference/` | testing | — |

Uma unidade só: a troca de versão e as seções de `boundaries.md` têm de entrar juntas, porque o
`npm run boundaries` do CI recusa uma versão escrita que o lockfile não instala.

**Orçamento de código alterado.** U1: cerca de 40 linhas apagadas e 10 mudadas, sem testes, sem o
lockfile e sem os documentos. Total da etapa: 50.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Parar no instante em que o cartão chega, com a gravação da chamada aberta atrasada 300 ms no banco, fecha a chamada negada (`output-denied`), e a conversa relida a traz fechada. Nada no código do Hub espera o Mastra guardar o cartão | `builder/conversation/conversation-waiting.test.ts`, "Parar no instante em que o cartão chega, antes de o Mastra guardar a chamada: ela fecha negada" (o caso de `162d7792`, com `slowedSaveOfOpenCalls(t, 300)`) | must |
| 2 | U1 | Recusa de hoje, que some: o mesmo teste na 1.79.0 falha. Os testes de Parar não esperam mais a corrida parada (`untilParked`) antes de apertar Parar | o mesmo arquivo: os três `await untilParked(hub)` antes de `stopped` saem | must |
| 3 | U1 | Parar com uma pergunta aberta não deixa a corrida no banco do Mastra; o caso deixa de ser `todo` | `conversation-waiting.test.ts`, "Parar com uma pergunta aberta: nada fica no banco do Mastra", sem `todo: MASTRA_RACE` | must |
| 4 | U1 | Uma chamada de ferramenta que o Mastra guardou sem argumentos não quebra a conversa, agora pela regra do próprio Mastra: `toolCallInputRequired` não existe mais | `builder/conversation/conversation-tool-input.test.ts`, "uma chamada de ferramenta que o Mastra guardou sem argumentos não quebra a conversa" | must |
| 5 | U1 | O que fica feito à mão continua provado na 1.82.0: o fim do turno pelo `isTaskComplete`, as rotas atrás do guarda, o fechamento dos streams, `slim` e `paced`, o passo sem o corpo do pedido, a pasta da versão sem seguir link, a escolha de ligações na tabela do Hub, a busca na lista | os testes de prova de cada seção (a tabela de referência), sem mudar | must |
| 6 | U1 | Um só `e2b` instalado: o pin do Conexus satisfaz o `^2.62.0` do `@mastra/e2b` 0.16.1, e o lockfile não tem `node_modules/@mastra/e2b/node_modules/e2b` | `npm ls e2b` mostra uma versão só | must |
| 7 | U1 | Nenhuma versão velha escrita: `npm run boundaries` passa, `npm run typecheck`, `npm run lint` e `npm run knip` passam | CI, o job `check` | must |
| 8 | U1 | Desligar no meio de um turno guarda o texto antes de fechar o stream; o caso deixa de ser `todo` se passar três vezes seguidas | `builder/conversation/conversation-stream.test.ts`, "desligar para o turno em curso como Parar…" | should |
| 9 | U1 | Com uma automação para as 07:00, o banco do Mastra dorme: o pool chega a zero e a agenda não é lida; uma automação nova para o minuto seguinte acorda o agendador e dispara; um Hub novo acha a guardada e liga a agenda. Recusa de hoje: na 1.79.0 o pool nunca chega a zero | `builder/automations/scheduler.test.ts`, "a primeira automação liga a agenda, que dorme até o próximo disparo…" | must |

## A matriz de estados

Nenhuma tela nova nem mudada. O cartão fechado por Parar é o estado `denied` de hoje
(`apps/web/src/builder/conversation/tool-spec.ts:45`).

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| — | — | — |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| O `init()` do `@mastra/pg` 1.35.0 ao subir o Hub (acrescenta colunas; o Knowledge só se usado) | dois Hubs subindo juntos: as colunas entram por `ADD COLUMN IF NOT EXISTS` (o `dist/index.js` da 1.35.0); o Knowledge tem a sua trava (`dist/index.js:10068`), e o Conexus não o usa | o processo cai no meio: o próximo `init()` termina o que faltou, e o banco fica igual ao criado na 1.35.0 (medido) | o banco do Mastra fora: o Hub não sobe, como hoje | o que o Mastra imprime hoje | 5 |
| A gravação da chamada aberta pelo Mastra, antes do evento do cartão (`@mastra/core` 1.81.0, PR #28839) | — | Parar antes da gravação: o Mastra só publica o cartão depois de gravar, então Parar sempre acha a chamada guardada | a gravação falha: o Mastra segura o evento e a corrida fica suspensa (changelog do PR #28839) | nada novo | 1, 3 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| As versões alvo | U1 | `@mastra/core` 1.79.0, `server` 1.79.0, `fastify` 1.5.23, `memory` 1.39.0, `pg` 1.32.0, `e2b` 0.15.0, `evals` 1.10.8, `client-js` 1.56.0 (`apps/server/package.json:25-30,45`, `package.json:44-45`, `packages/app/package.json:30`, `apps/web/package.json:36`) | npm, as versões estáveis mais novas, saídas juntas em 2026-11-03 e 04 | `core` 1.82.0, `server` 1.82.0, `fastify` 1.5.26, `memory` 1.41.0, `pg` 1.35.0, `e2b` 0.16.1, `evals` 1.10.11, `client-js` 1.59.0; cada um pede `@mastra/core >=1.80.0` (o `client-js` traz o `core` 1.82.0 exato) | nativo | — | não precisa | — |
| Parar logo depois do cartão | U1 | sem conserto desde #686; `approvals.md:594` | `@mastra/core` 1.81.0, PR #28839 (commit `8b781d03`) | o evento da suspensão sai só depois de a chamada estar gravada | nativo | — | 2026-11-04 | — (o caso volta a `conversation-waiting.test.ts`) |
| A chamada sem argumentos | U1 | `model-accounts/tool-call-input.ts` (todo), `model-accounts/processors.ts:29,399-401` | `@mastra/core` 1.80.0, PR #28332; `dist/stream-GSsXnWy3.js:1195-1207` (`tool-call-empty-input`, em `DEFAULT_COMPAT_RULES`) | manda `{}` no lugar de uma entrada que falta ou é `null`, só no pedido; a mensagem guardada fica igual. É a nossa regra, linha por linha | nativo; a nossa sai | — | não precisa | — |
| O `e2b` do Conexus | U1 | `e2b` 2.56.0 em `apps/server/package.json:37` (`machine/e2b.ts:3`) e `package.json:51` (`infra/e2b/template.ts:11`) | `@mastra/e2b` 0.16.1 pede `e2b ^2.62.0` | com o pin de hoje, o npm instala uma segunda cópia (2.63.0) dentro do `@mastra/e2b` | nativo | — | não precisa | — |
| As tabelas do Knowledge | U1 | o Conexus não usa Knowledge; `conversation/storage.ts:10` (`PostgresStore`, `schemaName: 'mastra'`) | `@mastra/pg` 1.35.0 `dist/index.js:10059-10071` (`legacyKnowledgeTablesToDrop`; o changelog só diz "Changes to an experimental, upcoming memory feature") | apaga as tabelas do Knowledge antigo, se existirem, e cria as novas só quando o Knowledge é usado | nativo | medido: o `init()` da 1.32.0 e da 1.35.0 não cria nenhuma `mastra_knowledge_*`; o banco atualizado é igual ao novo | não precisa | — |
| As colunas novas do Mastra | U1 | o login `mastra_runtime` é dono das tabelas que o Mastra cria (decisão 0010) | `@mastra/pg` 1.33.0 a 1.35.0 | o `init()` acrescenta 13 colunas (spans, versões de agente, tarefas de fundo), contadas no catálogo de um banco criado na 1.32.0 contra um criado na 1.35.0 | nativo; nenhuma migração do Hub, nada em `database-grants.sql` | — | não precisa | — |
| A proteção de arquivo da área de trabalho | U1 | `machine/machines.ts:259-266`, `assistant/machine.ts:271-280` (não dão `requireReadBeforeWrite`) | `@mastra/core` 1.81.0, PR #28935; o Mastra Code na tag 1.82.0 (`mastracode/sdk/src/agents/tool-availability.ts:92-128`) também não dá | a escrita num arquivo mudado depois de lido passa; `edit_file` ainda falha se o texto sumiu | nativo | — | não precisa | — |
| O avaliador do Builder (`boundaries.md` "The Builder's clocks and its eval gate") | U1 | `conversation/builder.eval.test.ts` | `@mastra/core` 1.82.0 `dist/evals/run/index.d.ts` | `runEvals` continua sem `toolMocks` | remendo, fica; muda só a versão escrita | o teste da seção passa na 1.82.0 | não precisa | — |
| O fim do turno (`boundaries.md` "the Builder's end of the turn") | U1 | `conversation/processors.ts` `conexusCheck` | changelogs 1.80 a 1.82: nada no `isTaskComplete` do motor comum | igual | remendo, fica; muda a versão | `conversation-check.test.ts` passa na 1.82.0 | não precisa | — |
| A chamada que o modelo mandou quebrada (`boundaries.md` "a tool call the model streamed unparseable") | U1 | `tool-call-input.ts` e `judge` em `conversation/processors.ts` | `tool-call-empty-input` (linha acima) | a regra é do Mastra; o `judge` continua nosso | remendo, encolhe: sai a peça da regra, fica a do `judge` | "não volta ao modelo" passa na 1.82.0 | não precisa | — |
| As rotas atrás do guarda (`boundaries.md` "session routes behind the Hub's guard") | U1 | `conversation/guard.ts` `FIXED_LIST` | `@mastra/server` 1.82.0 `dist/server/handlers/agent-controller.js`: a sessão `:947`, o stream `:570-650`, a mensagem `:656`, Parar `:690`, a resposta do cartão `:764`, o histórico `:1280` | as seis rotas existem; o stream ainda termina só quando o pedido sai (`abortSignal`, `:642`); o `.d.ts` do `@mastra/fastify` é igual | remendo, fica; muda a versão | `conversation-routes.test.ts`, `conversation-stream.test.ts` passam na 1.82.0 | não precisa | — |
| O stream e a tela (`boundaries.md` "the stream sends the screen what it reads") | U1 | `conversation/stream.ts` `slim`, `paced` | `@mastra/server` 1.80.0, PR #28527 (`displayState: false`) | a opção nova corta todo o estado da tela, e a tela lê uma parte dele (`isRunning`, `pendingSuspensions`, `omProgress`) | remendo, fica; o "Revisit" cita a opção | `conversation-stream-paced.test.ts` passa na 1.82.0 | não precisa | — |
| O passo sem o corpo do pedido (`boundaries.md` "a step's answer without the body") | U1 | `model-accounts/claude/models.ts` `bodylessMiddleware` | `@mastra/core` 1.82.0 `dist/stream-GSsXnWy3.js:5037` (`#bufferedSteps`), `:4730-4760` (só junta pedidos iguais ao serializar) | o Mastra ainda guarda o pedido de cada passo | remendo, fica; muda a versão | `prompt-cache.test.ts` passa na 1.82.0 | não precisa | — |
| A pasta da versão sem seguir link (`boundaries.md` "e2b 2.56.0") | U1 | `machine/pack.ts` `packIn` | `e2b` 2.63.0 `dist/index.d.ts:5794-5807` | `FilesystemReadOpts` ainda sem `nofollow` | remendo, fica; o título passa à versão nova do `e2b` e a linha do Mastra à 1.82.0 | `pack.test.ts` passa na 1.82.0 | não precisa | — |
| A escolha de ligações na tabela do Hub (`boundaries.md` "a conversation's changing state lives in a Hub table") | U1 | `assistant/chosen.ts`, `context.ts` | `@mastra/pg` 1.35.0 `dist/index.js:12260-12290` (`updateThread`) | ainda lê, junta e grava o objeto inteiro, sem trava | remendo, fica; mudam a versão e as linhas | `instructions.test.ts` passa na 1.82.0 | não precisa | — |
| A busca na lista (`boundaries.md` "the list of conversations narrowed by title and place") | U1 | `assistant/search.ts` `listedPage` | `@mastra/core` 1.82.0 `dist/storage/types.d.ts:183-209` | `listThreads` ainda filtra só por `resourceId` e metadados iguais | remendo, fica; muda a versão | `list-search.test.ts` passa na 1.82.0 | não precisa | — |
| Os dois comentários com versão no código | U1 | `builder/mastra/mastra.ts:29` (o logger dos domínios do store), `model-accounts/providers.ts:14` (o que um modelo produz) | `@mastra/core` 1.82.0 | a reler no passo 4 da U1 | remendo, a reler: fica com a versão nova, ou sai se o Mastra já faz (C75) | a releitura em `@mastra/core` 1.82.0, passo 4 | não precisa | — |
| A linha do Mastra em `stack.md` e a prateleira | U1 | `docs/reference/stack.md:15,20` ("we pin 1.79.0") | a regra da própria linha 15 | o pull request que troca o pin troca a prateleira e esta linha | nativo | — | não precisa | — |
| O agendador dorme até o próximo disparo (emenda de 2026-11-04) | U1 | a D27 (`docs/guides/data.md:84-88`, "it reads its table on every tick (10 s)"), `docs/architecture.md:20-21`, `automations/scheduler.test.ts` (o pool nunca chega a zero), `mastra/hub-mastra.ts:93` | `@mastra/core` 1.82.0 `dist/scheduler-Me4rCjO2.js:160-180` (`#nextDelay`), `wake()` em `:117-126`, chamado em `dist/mastra-D4MXu5BN.js:1535,4398` | lê a tabela na partida, quando uma agenda é criada, retomada ou adiantada, e a cada disparo; entre um e outro dorme até o mais cedo, sem timer quando não há nenhum | nativo | — | 2026-11-04: "A" | — (o segundo caso de `scheduler.test.ts` muda) |

As linhas `remendo` já estão em `docs/reference/boundaries.md`, cada uma com a palavra da etapa em
que entrou. Nenhuma é nova nesta etapa, e uma encolhe.

**Duas formas comparadas para o alvo.** A: 1.81.0, a primeira com o conserto, saída em 2026-10-30.
B: 1.82.0, a mais nova, saída em 2026-11-04 junto com todo o resto do Mastra. Fica a B: todos os
pacotes do Mastra saem juntos, cada um pede `@mastra/core >=1.80.0`, e o `client-js` 1.59.0 traz o
`core` 1.82.0 exato. Na A, a tela teria um `core` diferente do servidor.

**A medida do transplante.** Nada trazido do repositório antigo.

**A dívida.** Nenhuma.

## U1 A versão 1.82.0

**Base e modelo.** O `main` em `81004d8b`. Sonnet: troca de versão com os passos e as provas
escritos aqui, sem desenho novo.

### As linhas da tabela

Todas as linhas da tabela de referência.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `package.json`, `package-lock.json`, `apps/server/package.json`, `apps/web/package.json`, `packages/app/package.json` | Muda os pins do Mastra e do `e2b` | todo o repositório |
| `apps/server/src/builder/model-accounts/` | Apaga `tool-call-input.ts`; muda `processors.ts` (`stabilityProcessors` deixa o `ProviderHistoryCompat` como o Mastra o dá); `processors.test.ts` fica sem mudança, porque confere só a instância | `controller-kit/factories.ts` e os controladores |
| `apps/server/src/builder/conversation/` | Muda `conversation-waiting.test.ts`, `conversation-stream.test.ts` | — |
| `apps/server/src/builder/mastra/` | Muda ou apaga o comentário de `mastra.ts:29`; muda o de `hub-mastra.ts:93` | `builder/mastra/` |
| `apps/server/src/builder/automations/` | Muda o segundo caso de `scheduler.test.ts` | — |
| `docs/guides/data.md` (D27), `docs/architecture.md` | Reescreve a exceção do agendador | quem lê a regra do banco que dorme |
| `docs/reference/boundaries.md`, `docs/reference/stack.md` | Muda as seções da tabela | quem lê o limite |
| A prateleira de referência `mastra-1.82` | Cria, fora do repositório: é a cópia local do Mastra na tag que `stack.md:12` manda ler; o firstmate a monta | quem estuda o Mastra |

### Os contratos que a unidade cria

Nenhum. Some `toolCallInputRequired` (`model-accounts/tool-call-input.ts`), que só
`processors.ts` importa.

### As skills e a leitura

`mastra` (no `node_modules/@mastra/core/dist/docs` 1.82.0), `node`, e as linhas de
`docs/reference/stack.md` das pastas acima. Os changelogs: `packages/core/CHANGELOG.md`,
`stores/pg/CHANGELOG.md`, `workspaces/e2b/CHANGELOG.md` do `mastra-ai/mastra`, da 1.82.0 até a 1.79.0.

### A ordem do trabalho

1. Os pins: os oito pacotes do Mastra nas versões da primeira linha da tabela, e o `e2b` em
   `apps/server/package.json:37` e `package.json:51` na versão que o `npm install` resolve para o
   `^2.62.0` do `@mastra/e2b` (2.63.0 em 2026-11-04), para ficar uma cópia só. `npm install`; `npm ls e2b`
   mostra uma versão só (critério 6). `npm run typecheck`.
2. Apagar antes de acrescentar: `model-accounts/tool-call-input.ts` sai; em `processors.ts` saem o
   import da linha 29 e o ramo `ProviderHistoryCompat` das linhas 399-401, e o comentário de
   `stabilityProcessors` deixa de falar da regra nossa. Critério 4. Regra: C75.
3. Os testes de Parar: em `conversation-waiting.test.ts` voltam `slowedSaveOfOpenCalls` e o caso de
   300 ms, como em `git show 162d7792:apps/server/src/builder/conversation/conversation-waiting.test.ts`,
   e o comentário dele passa a dizer o que o atraso alarga, sem a versão 1.79.0. O caso de 5 s
   ("além do prazo") não volta: ele provava a nossa espera, que não existe mais. Saem os três
   `await untilParked(hub)` antes de `stopped` e o `todo: MASTRA_RACE` com a sua constante. Os
   `untilParked` antes de uma resposta (`test-questions.ts:168` `answerTo`,
   `conversation-routes.test.ts:105`) ficam: eles esperam outra janela, a da resposta antes do
   instantâneo, que o caso "a resposta no instante do fim do turno" mostra que o Mastra ainda tem.
   Critérios 1, 2 e 3. No `conversation-stream.test.ts`, o `todo` do caso "desligar…" sai se ele
   passar três vezes seguidas (critério 8).
4. Os dois comentários com versão: releia em `@mastra/core` 1.82.0 se o `Mastra` passa o seu logger
   aos domínios do store (`mastra.ts:29`) e se o registro de provedores diz o que um modelo produz
   (`providers.ts:14`). Se passa a fazer, a linha nossa sai (C75); se não, o comentário fica com a
   versão nova.
5. `boundaries.md`: cada seção da tabela como a coluna Veredito diz, com as linhas de biblioteca da
   coluna Referência; na seção da chamada quebrada, sai o primeiro ponto da peça feita à mão e a
   prova "guardou sem argumentos" passa a dizer que a regra é do Mastra. `stack.md:20` diz
   "we pin 1.82.0"; a prateleira de referência passa a uma `mastra-1.82` no mesmo pull request
   (`stack.md:15`). `npm run boundaries`, `npm run docs`, `npm run lint`, `npm run knip`
   (critério 7).

### Como se prova

Os critérios 1 a 8, cada um pelo seu teste, contra o banco de teste (T26). Medido em 2026-11-04,
numa cópia do `main` em `81004d8b` com as versões novas: o critério 1 falha na 1.79.0 e passa na
1.82.0, três vezes seguidas, junto com o do critério 3; o critério 4 falha na 1.79.0 sem a nossa
regra e passa na 1.82.0 sem ela; os testes das seções que ficam (critério 5: 43 casos em nove
arquivos) passam na 1.82.0; o caso do critério 8 passou uma vez. O typecheck de todos os pacotes
não dá erro de tipo na 1.82.0.

### Parar se

- O typecheck do servidor estoura a memória no CI. Medido nesta máquina: na 1.79.0 ele usa 2,1 GB
  e termina dentro do limite padrão do Node (2,2 GB aqui); na 1.82.0, com o limite padrão, ele para em "JavaScript heap out of memory", e só
  termina com `--max-old-space-size=4096`, usando 2,6 GB. O número de tipos é o mesmo (784 mil), então
  a causa não está explicada. O executor do CI tem mais memória, e o limite do Node cresce com
  ela; não está provado que lá cabe. Se não couber, pare e leve ao firstmate. Não se põe
  `NODE_OPTIONS` num script sem cartão.
- O critério 1 falha na 1.82.0 no CI: pare. Não volte com nenhuma espera; o conserto é do Mastra.
- Um teste de seção que fica passa a falhar: a linha de biblioteca mudou. Diga qual e pare.
