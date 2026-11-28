# A subida do Mastra para a 1.86

Cartão curto, a primeira unidade do plano do Hub hospedar o `ConexusHarness` (ordem do roteiro: Construtor
validado no Studio, **esta subida**, Construtor plugado). Lido no `main` em `f10e8a075` (2026-11-28).
Versões: as instaladas são `@mastra/core` 1.83.0, `@mastra/server` 1.83.0, `@mastra/fastify` 1.5.27,
`@mastra/memory` 1.41.1, `@mastra/pg` 1.36.0, `@mastra/e2b` 0.17.0, `@mastra/observability` 1.24.0,
`@mastra/evals` 1.10.11 e `@mastra/client-js` 1.60.0; as de destino estão na tabela de referência.
O estudo é a conferência do `dist` dos dois conjuntos mais cinco perguntas à IA da documentação do Mastra
(regra do fundador, abaixo), e fica fora do repositório (delivery L21). Abreviações: `H/` =
`apps/server/src/harness/`, `NOVO/` = `node_modules/@mastra/` na 1.86.0 (a pasta de rascunho do estudo, que
o builder refaz com `npm install`), `ANTIGO/` = o mesmo na 1.83.0.

## A página do fundador

**No fim desta etapa** o Hub no ar roda sobre o motor Mastra 1.86, com tudo o que você usa igual: as
conversas, as cópias do lago e a lista de modelos. A única diferença que você vê é a lista de modelos: perde os
que o Mastra agora chama de aposentados e ganha os modelos e provedores novos do registro. Ninguém está num
modelo aposentado (você, 2026-11-29), então nada responde por um deles.

**O roteiro de uso.** Na nuvem, sem terminal.

1. Abra o Estado do Hub: a versão é a que saiu depois do merge, e a lista de verificações está toda verde.
2. Abra Configurações, Contas de modelo: a lista segue funcionando. Modelos como `claude-sonnet-4-5` e
   `gpt-4o` já não aparecem para escolher, porque o Mastra 1.86 os marcou como aposentados; os modelos
   iniciais (`claude-sonnet-5-5`, `gpt-5.6-luna`) continuam, e aparecem modelos e provedores novos.
3. Abra uma cópia do lago que estava agendada antes da subida: o horário está lá e a próxima rodada roda
   no horário, sem você mexer em nada.
4. Abra uma conversa nova do Assistente e peça uma leitura de dados: ela responde como antes.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. No fim: faz o roteiro, diz o que
viu.

**A visão.** "Conexus junta os sistemas e o saber de uma empresa num contexto só" (`VISION.md`): esta etapa
não muda o que ele faz, só troca o motor por baixo, no passo que a ordem do roteiro pede antes de plugar o
`conexus-harness`, que pede o core 1.86 ou mais novo. Nenhuma linha da visão é cruzada.

**Fica de fora.** O Better Auth e o provedor de login do Mastra (U2 do plano), a classe que hospeda o
Mastra (U3), o Construtor novo e apagar o antigo, e qualquer escolha entre Fastify e Hono ou sobre o
`resourceId`, que têm estudos abertos. Também fica de fora tirar a peça `NEVER_ASKS`, que o 1.86 absorveu
em parte, mas cuja troca pede categorias de permissão que o Hub não tem e um ensaio em Postgres (a dívida
abaixo). A cópia do lago, o `createLakeClock`, é agendamento de ETL e sai do agendador do Mastra na trilha
Connect (fundador, 2026-11-29: o agendamento fica à parte do Mastra, o cron do Mastra é para a parte
agêntica); a U1 só prova que a cópia agendada de hoje segue disparando depois da subida, por isso a prova do
diário fica.

**Esta etapa não é só trocar versões.** O plano dizia "só versões". A conferência mostrou quatro coisas que o
1.86 força, e elas entram aqui para a subida não deixar o Hub num estado pior:

- **Recuperação de runs.** O Hub chama `startWorkers()`. A partir do 1.86 isso liga um laço que reinicia os
  fluxos que ficaram "rodando" depois de uma queda. Uma automação que chama modelo pago e ficou assim numa
  queda de semanas atrás seria rodada de novo no primeiro boot. O Hub hoje nunca reinicia nada; a etapa
  mantém isso com a configuração nativa do Mastra, que desliga o laço.
- **Lista de modelos.** O registro do 1.86 marca 83 modelos a mais como aposentados (entre eles
  `claude-sonnet-4-5`, `claude-opus-4-5`, `gpt-5`, `gpt-4o`, `gemini-2.5-flash`) e acrescenta cerca de
  1.600 nomes e provedores novos que só pedem a chave. A regra do Hub que esconde os aposentados do seletor
  já existe e não muda. Não há conversa, agente salvo nem automação num modelo aposentado (fundador,
  2026-11-29), então nenhuma lista de compatibilidade entra: os aposentados somem da lista e fim. Conferido
  no `main`: nenhum padrão guardado nem semente do repositório aponta para um id aposentado; só dois
  comentários o citam (`served.ts:17`, `packages/hub-api/src/conversations.ts:17`), que passam a um id vivo.
- **Um laço que o Mastra absorveu.** O laço `__setLogger` por domínio do store (`H/mastra/mastra.ts:62-65`)
  tinha "revise na subida" escrito; o 1.86 faz isso sozinho. Ele sai.
- **Testes e gravação.** Cerca de vinte testes usam como exemplo modelos que o 1.86 aposenta; sete nomes
  novos de modelo de outras famílias precisam ser lidos; e a gravação `reads.jsonl` carrega a versão do
  Mastra no cabeçalho e precisa ser refeita.

**O que a IA do Mastra disse** (sua regra, recebida no pedido desta etapa: levar objetivo, contexto e plano à IA do Mastra; o firstmate a grava na página da trilha, delivery L6),
em cinco perguntas, uma por vez; cada resposta foi conferida nos pacotes:

- Ordem e pares de versão: sobem juntos `core`, `server`, `fastify`, `memory` e `pg` (o `pg` 1.38.0 pede
  core 1.86.0 ou mais novo; os outros, 1.85.1). O `client-js` que casa com o core 1.86.0 é o 1.62.0, não o 1.60.0 que o
  web tem. Conferido nos `package.json` dos pacotes.
- O diário de execução e a agenda: a tabela de agendas e a de snapshots são idênticas nas duas versões, e
  `init()` só adiciona uma coluna a uma tabela que o armazenamento v2 (que o Hub não usa) usa. A IA não
  soube dizer se a nova versão dispara uma agenda criada pela velha: é a prova do cartão.
- As opções do `new Mastra` do Hub seguem válidas; só o laço do logger deixa de ser preciso.
- A recuperação de runs: o nativo é `recovery: { workflows: 'off' }` (o Hub inteiro) ou
  `autoRestartActiveRuns: false` por fluxo; um passo interrompido roda de novo.
- Modelos aposentados: o roteador ainda aceita um id aposentado; a lista é só dica para seletores.

**As decisões suas nesta etapa.** Nenhuma. A decisão que havia (conversa num modelo aposentado) saiu: você
disse que não existe.

As decisões técnicas reversíveis do firstmate (delivery L6) estão na tabela mais abaixo, cada uma com a
evidência e como desfazer.

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 | U1 | Os nove pacotes na 1.86, o que ela força no código (a recuperação, o laço, os ids aposentados dos exemplos, o modelo barato da memória do Google), os testes e a gravação ajustados, a prova do diário | `package.json` da raiz, `apps/server/`, `apps/web/`, `packages/app/`, `packages/hub-api/` (um comentário) | [testing](../guides/testing.md) | nada |
| G1 | U2 | O registro: a tabela da stack, as entradas de `boundaries`, a explicação do harness | `docs/reference/`, `docs/explanation/` | [delivery](../guides/delivery.md) | U1 |

**Orçamento de código alterado.** U1: cerca de 40 linhas de código de produção (apagar o laço, uma opção, um id da memória,
os nomes de modelo, os pins), mais testes e arquivos gerados que não contam. U2:
nenhuma linha de código. Total da etapa: cerca de 40 linhas.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Uma cópia só do core: `npm ls @mastra/core --all` mostra 1.86.0 em todo lugar. Recusa: duas versões do core no mesmo `npm ls` | comando `npm ls @mastra/core --all`, saída colada no PR | must |
| 2 | U1 | Os nove pacotes ficam nas versões da tabela de referência, e nenhum pacote entra além do que a 1.86 pede: `@mastra/mcp`, `@mastra/mcp-apps-components` e `@json-render/chat` (pares opcionais) não aparecem no `npm ls`. Recusa: um deles instalado | `npm ls --all` filtrado pelos três nomes, vazio | must |
| 3 | U1 | O `packages/app` continua gerando suas declarações com o core novo | `packages/app/src/check/memory.test.ts` (e `npm run check` do pacote) | must |
| 4 | U1 | O typecheck da raiz, do servidor e do web passa sem erro com a 1.86 | `npm run typecheck` com `NODE_OPTIONS=--max-old-space-size=8192` | must |
| 5 | U1 | O diário de workflow: o Hub da branch (1.86), no mesmo banco que o `main` (1.83) usou, lê a agenda e os snapshots que a 1.83 deixou, dispara a cópia agendada no horário dela e roda a retenção uma vez, de verdade, com o resultado `Pruned`. Recusa: a agenda não dispara, o snapshot antigo não lista, ou a retenção falha (a prova que não roda a retenção não vale) | prova da seção "Como se prova", registrada no PR | must |
| 6 | U1 | Nenhum run deixado "rodando" por um Hub antigo é reiniciado pelo novo, e o banco fica quieto sem uso (data D27). Recusa: o run plantado volta a executar um passo, o provedor dublê recebe chamada, ou o pool do Mastra lê a agenda depois da partida | `agents/assistant/automations/scheduler.test.ts` (a agenda só tem a limpeza e o pool chega a zero, `:50`; o processo que morreu aparece `FAILED`/`INTERRUPTED`, `:138`), com a opção `recovery` tirada de mutação, mais a prova da seção "Como se prova" | must |
| 7 | U1 | O log de um domínio do store chega ao `HubLogger` sem o laço. Recusa: `rg "__setLogger" apps/server/src` vazio, e a falha plantada num domínio aparece no registro central | `H/mastra/mastra.test.ts` (caso novo, com o store do Hub) | must |
| 8 | U1 | Um modelo que o registro 1.86 aposentou (`anthropic/claude-sonnet-4-5`) não é oferecido, uma escolha salva com ele é pulada para o próximo passo da cadeia, e a troca da conversa ou a escolha de padrão para ele dá `MODEL_UNKNOWN`. Recusa: o seletor o lista, ou a conversa nasce nele | `harness/model-accounts/providers.test.ts`; dois casos novos pela porta pública (T5): uma escolha salva com `anthropic/claude-sonnet-4-5`, plantada por SQL (o `PUT` a recusa), e a conversa nova nasce no próximo degrau da cadeia (`model-defaults.test.ts`); a troca da conversa para esse id dá 422 `MODEL_UNKNOWN` pela rota de troca (`model-fallback.test.ts`); `model-start.test.ts:30` (o padrão e a conversa nova recusados) | must |
| 17 | U1 | A memória observacional de quem usa chave do Google segue num modelo barato vivo: com a chave do Google o Observer e o Reflector usam `google/gemini-3.5-flash-lite`, não o modelo da conversa (que o 1.86 faria cair ao aposentar `gemini-2.5-flash`, o padrão do `@mastra/memory`). Recusa: o Automático devolve `null` para o Google por chave | `harness/model-accounts/auto-memory-model.test.ts` (o caso `api_key` e `undefined` muda de `gemini-2.5-flash` para `gemini-3.5-flash-lite`) | must |
| 9 | U1 | Os sete nomes novos do registro estão lidos: cada um é de modelo de conversa (e fica na lista) ou entra em `NOT_CHAT`. Recusa: um nome novo sem leitura faz `providers.test.ts` falhar | `H/model-accounts/providers.test.ts` (`HINTS_NOT_CHAT`, `CHAT_FAMILIES`) | must |
| 10 | U1 | Nenhum teste usa como exemplo "um modelo que conversa" um id que o 1.86 aposenta, exceto o caso deliberado do critério 8. Recusa: um teste verde só por ter o id aposentado como fixture | os testes tocados do servidor verdes; `rg` dos ids aposentados nos testes só acha os do critério 8 | must |
| 11 | U1 | A gravação `reads.jsonl` carrega a versão 1.86.0 no cabeçalho e os leitores dela passam. Recusa: cabeçalho antigo | `apps/server/src/platform/recordings.test.ts` (caso `reads`) | must |
| 12 | U1 | O stream da conversa segue como hoje: o leitor lento não estoura a memória e o fim do stream é o do Hub. Recusa: o teste do turno de 96 passos sem `slim` deixa de falhar, o que tiraria a razão da peça | `harness/routes/conversation-stream-paced.test.ts`, `conversation-stream.test.ts` | must |
| 13 | U1 | A lista fixa de rotas do Mastra no Hub segue igual: a rota nova do 1.86, `GET /memory/working-memory`, não é montada, e as rotas de sinal de agente (`/agents/:id/signals`) também não. Recusa: um pedido a elas responde algo que não é 404 | `H/routes/guard.test.ts` (caso novo: rota fora da lista), `conversation-routes.test.ts` | must |
| 14 | U1 | A aprovação das ferramentas segue como hoje: no agente salvo a escrita espera e o resto não; o Construtor roda em `yolo`. Recusa: uma leitura suspende | `agents/saved-agent/approval.test.ts:61`, `agents/app-builder/closure.test.ts:181` | must |
| 15 | U1 | O web compila contra o `client-js` 1.62.0 e a sala segue falando com o servidor 1.86. Recusa: erro de tipo no web | `npm run typecheck` do web e os testes tocados de `apps/web/src/harness/room`; `retries: 0` fica em `session.ts:50` (o 1.62.0 já não repete escrita por padrão, `client-js/dist/index.js:1232-1236,1259`) | must |
| 16 | U2 | A tabela da stack e as entradas de `boundaries` citam a 1.86 com `arquivo:linha` lidos no instalado; nenhuma linha de `docs/reference` cita 1.83 além da prateleira antiga e do histórico. Recusa: uma linha de Mastra com 1.83 | `rg "1\.83" docs/reference` (só as menções históricas, listadas no PR) e `npm run docs` (a linha da stack existe) | must |

## A matriz de estados

Nenhuma tela muda: a lista de modelos é a tela de hoje com outras linhas.

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A lista de modelos e as conversas | como hoje | como hoje | como hoje | como hoje | como hoje | como hoje | como hoje; o modelo aposentado não se oferece (critério 8) |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| nenhum campo novo | | |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio | Uma dependência fora | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `storage.init()` do `@mastra/pg` 1.38.0 acrescenta a coluna `first_seq` (`NOVO/pg/dist/index.js:27102-27106`, `ifNotExists`) | dois Hubs no mesmo boot: o `ifNotExists` torna a segunda chamada inócua | banco recusa o `ALTER`: o boot para com o erro do banco, como hoje com qualquer migração do Mastra | banco fora: `MASTRA_STORAGE_READY` não sai e o Hub não sobe, como hoje | `MASTRA_STORAGE_READY` | 5 |
| O laço de recuperação de runs do `startWorkers()` (`NOVO/core/dist/mastra-CqBmnzjM.js:3121-3175,3430-3465`) | só um Hub lidera (lease no banco); com o laço desligado, nenhum | n/a (nada reinicia) | banco fora: o laço desligado não toca o banco | `MASTRA_WORKERS_STARTED` | 6 |
| A reconciliação do relógio do lago grava de novo a linha da agenda de cada cópia na partida (`harness/copy-clock/clock.ts:120-134`) | dois Hubs na partida: a mesma linha, a última vence, como hoje | a gravação recusada deixa a linha antiga, que o próximo tique relê | banco fora: o Hub não sobe | `MASTRA_WORKERS_STARTED` | 5 |
| O `MastraStorageExporter` termina o span com retentativa (`NOVO/observability/dist/index.js:68271-68460,69041-69120`) | n/a (um exportador por processo) | span preso é solto na retentativa; sem erro para quem chama | banco fora: o span fica no buffer e se perde no desligamento, como hoje | nada novo | 5 |

## A tabela de referência

A referência é o instalado: `@mastra/*` 1.86.0, lido em `NOVO/` (a mesma pasta de rascunho do estudo);
a prateleira `mastra-1.86` ainda não existe e está em "Parar se". Todo `arquivo:linha` abaixo foi
**lido**. A coluna "Hoje no main" é o arquivo do `main` em `f10e8a075`.

| Peça | Unidade | O que o fundador já decidiu | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Os pins dos nove pacotes | U1 | A ordem do roteiro: subir o core antes de plugar o Construtor (2026-11-28, `docs/roadmap.md`) | `package.json:61-63`, `apps/server/package.json:32-38,55`, `apps/web/package.json:40`, `packages/app/package.json:31` | `@mastra/pg@1.38.0` `package.json` (core `>=1.86.0`), `fastify@1.5.30`, `memory@1.41.3`, `server@1.86.0` (core `>=1.85.1`); `client-js@1.62.0` depende de core `1.86.0` | O `npm` instala os pares, e os pares opcionais (`@mastra/mcp`, `@mastra/mcp-apps-components`, `@json-render/chat`) ficam fora (`peerDependenciesMeta`) | nativo | | firstmate, decisão 4: voltar `client-js` a 1.60.0 | nenhum |
| O diário de execução e a agenda entre as versões | U1 | "A subida não pode perder a cópia agendada" (plano do Hub, prova do diário) | o relógio do lago `harness/copy-clock/`, a retenção `harness/mastra/retention.ts` | `@mastra/core@1.86.0` `constants-BmdTvEYN.js:3863,4132` (as tabelas de snapshot e de agendas) e `@mastra/pg@1.38.0` `index.js:27102-27106` | As duas tabelas têm a mesma forma que na 1.83.0 (`constants-B_0KNiQG.js:3834,4103`, `diff` vazio); `init()` só acrescenta a coluna `first_seq` com `ifNotExists`, na tabela que o armazenamento v2 usa | nativo | | não precisa | nenhum |
| A recuperação de runs parados | U1 | nada registrado | `harness/mastra/mastra.ts:41` (o `new Mastra`), `harness/mastra/hub-mastra.ts:124` (`startWorkers`) | `@mastra/core@1.86.0` `mastra/index.d.ts:417-445,466-480`, `mastra-CqBmnzjM.js:3121-3175,3430-3465` | `startWorkers()` liga um laço que reinicia runs `RUNNING` do motor `default` cujo lease venceu; `recovery: { workflows: 'off' }` o desliga; no 1.83.0 nada recuperava (`@mastra/server@1.83.0` `workflows-B-QJ0Tnv.js:890`, chamada só do servidor do Mastra) | nativo | | firstmate, decisão 1: apagar a opção | nenhum |
| O laço `__setLogger` por domínio | U1 | nada registrado | `harness/mastra/mastra.ts:62-65` | `@mastra/core@1.86.0` `filesystem-versioned-BL1ojJLo.js:295-309`, `mastra-CqBmnzjM.js:1421,5114,5166` | O construtor do `Mastra` chama `setLogger`, que repassa o logger a `parentDefault`, `parentEditor` e a cada domínio de `stores`; 20 de 20 domínios, executado com `InMemoryStore` | nativo | | firstmate, decisão 2: devolver o laço | nenhum |
| O que o seletor oferece | U1 | Decisão 0027: o registro lido em memória, offline; fundador 2026-11-29: nenhuma conversa, agente salvo ou automação está num modelo aposentado, sem lista de compatibilidade | `harness/model-accounts/providers.ts:30-35,86-102` | `@mastra/core@1.86.0` `netlify-DUPSTzi6.js:43070`, `provider-registry-BeB8RQO8.js` (dados) | `deprecatedModels` é só montado pelo gateway, nenhum roteador o lê; a IA do Mastra: "só uma dica para seletores" | embrulhado (a regra do Hub sobre o registro, sem mudança de código: `chatModelsOf` já esconde os aposentados) | | firstmate, decisão 3: voltar os ids | nenhum |
| `NOT_CHAT`, a leitura do nome do modelo | U1 | nada registrado | `harness/model-accounts/providers.ts:18-30` | `@mastra/core@1.86.0` `llm/model/capability-file.d.ts:1-8` | As capacidades são anexo, temperatura, saída estruturada e raciocínio; nada diz o que o modelo gera | remendo | `boundaries.md`, "the store's domains log, and a model's output is read from its name", relida em `@mastra/core` 1.86.0: sem mudança | não precisa | nenhum |
| O stream `slim` e `paced` | U1, U2 | Decisão 0050 | `harness/routes/stream.ts` | `@mastra/server@1.86.0` `agent-controller-CzKnfKkw.js:765-914` | O handler ganhou fila e fecha o stream com 5.000 quadros ou 60 s parado, mas `paced` lê sem parar e o teto em bytes do Hub segue o único em vigor | remendo | `boundaries.md`, "the stream sends the screen what it reads", relida em `@mastra/server` 1.86.0; U2 corrige a frase do adaptador | não precisa | nenhum |
| A lista fixa de rotas do Mastra | U1 | Decisão 0050 | `harness/routes/guard.ts:35-45` | `@mastra/server@1.86.0` `server-adapter-h8YRQXAC.js` | 440 rotas contra 439, a nova `GET /memory/working-memory` fora da lista; as nove da lista têm os mesmos esquemas (`toJSONSchema` igual) | remendo | `boundaries.md`, "session routes behind the Hub's guard", relida em `@mastra/server` 1.86.0 e `@mastra/fastify` 1.5.30 (`dist` idêntico): sem mudança | não precisa | nenhum |
| `NEVER_ASKS`, a leitura que não pergunta | fica de fora: a troca pede categorias e regras de sessão que o Hub não tem, e o ensaio de 200 leituras em Postgres | nada registrado | `harness/spec/mount.ts:86-109`, `harness/machine/workspace.ts:32` | `@mastra/core@1.86.0` `agent-controller-D5EKeS1H.js:9112-9122` | O controlador passa `requireToolApproval` como função por chamada: com política `allow` a chamada nem suspende | remendo | `boundaries.md`, "a read never asks", relida em `@mastra/core` 1.86.0: a peça segue valendo, o nativo a cobre em parte (dívida 1) | firstmate: fica como está | nenhum |
| A gravação `reads.jsonl` | U1 | nada registrado | `apps/server/src/platform/recordings/mastra/reads.jsonl`, `scripts/record.ts:98-102,282-290` | `@mastra/core@1.86.0` `package.json` (a versão que o script grava) | O script grava `versionOf('@mastra/core')` e só `recordings.test.ts:171` a confere | nativo | | não precisa | nenhum |
| O `client-js` do web | U1 | Decisão 0050 | `apps/web/src/harness/room/session.ts:46-52` (`retries: 0`) | `@mastra/client-js@1.62.0` `index.js:1217-1261` | Sem repetição de escrita por padrão; `retries: 0` explícito vence | nativo | | firstmate, decisão 4 | nenhum |
| `@mastra/e2b`, `observability`, `evals`, `memory` | U1, U2 | nada registrado | as linhas de `docs/reference/stack.md:23,37,38,40` (memory, e2b, evals, observability) | `@mastra/e2b@0.18.1` (a opção `user` e `owner` de montagem, aditivas), `@mastra/observability@1.24.3` `index.js:68271-68460,69041-69120` (retentativa de fim de span) e a tabela de preços embutida (`tags` nos logs), `@mastra/evals@1.10.12`, `@mastra/memory@1.41.3` | Sem mudança de API; as armadilhas das linhas seguem verdadeiras | nativo | | não precisa | nenhum |
| A tabela da stack e as entradas de `boundaries` | U2 | Delivery L20 e a própria stack: "a subida atualiza a prateleira e este arquivo" | `docs/reference/stack.md:22-43`, `docs/reference/boundaries.md:998-1210,1494-1650` | as colunas "Reference" citam a prateleira `mastra-1.83` | Cada entrada relida contra `NOVO/`; o relatório do estudo dá o veredito por entrada | nativo | | não precisa | nenhum |

**A medida do transplante.** Nenhuma parte velha é trazida; o código só é apagado ou recebe uma opção.

**A dívida.** (1) `NEVER_ASKS` e `THE_WRITE_ASKS` podem virar permissão nativa por categoria quando o Hub
tiver `toolCategoryResolver` e regras de sessão, com o ensaio de 200 leituras em Postgres; vai para a seção
11 da arquitetura. (2) O comentário de `H/routes/stream.ts:55-62` dizia que o adaptador não esperava o
`drain`: já era falso no 1.83; U2 corrige a frase. (3) O `GET /memory/working-memory` novo do Mastra não é
usado; entra se o Construtor novo precisar.

## As decisões do firstmate

| # | Decisão reversível (delivery L6) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | `recovery: { workflows: 'off' }` no `new Mastra` do Hub | O 1.86 liga o laço de recuperação no `startWorkers()` que o Hub chama (`hub-mastra.ts:124`); no 1.83 nada reiniciava (`restartAllActiveWorkflowRuns` só era chamada pelo servidor do Mastra, `ANTIGO/server/dist/workflows-B-QJ0Tnv.js:890`). Reiniciaria runs velhos de automação com chamada de modelo pago. IA do Mastra: o passo interrompido roda de novo; o nativo para escolher é a opção global ou `autoRestartActiveRuns` por fluxo. Escolhida a global: o Hub não recupera nenhum fluxo hoje, e o `copy-clock` já tem a sua opção própria. Também D27 (nada lê o banco sem uso): o laço leria a agenda a cada 60 s enquanto houver fluxo reiniciável com lease, e `scheduler.test.ts:50` prova que hoje não lê | Remover a opção só vale junto de `autoRestartActiveRuns: false` em todo fluxo reiniciável (retenção, automações); só em alguns, o laço segue ligado e quebra D27 |
| 2 | Apagar o laço `__setLogger` do `mastra.ts` | O 1.86 repassa o logger aos domínios (IA: mudança do 1.85.0; `NOVO/core/dist/filesystem-versioned-BL1ojJLo.js:295-309`); prova executada com `InMemoryStore`: 20 de 20 domínios com o logger do Mastra | Devolver as quatro linhas do laço |
| 3 | Trocar os ids aposentados nos exemplos dos testes por ids vivos, e manter um caso deliberado com `claude-sonnet-4-5` | O roteador ainda aceita o id (IA, `deprecatedModels` só é dica); o Hub é que esconde. O seletor segue a regra do Hub sobre o registro, nativo | Voltar os ids; os testes voltam a falhar com `MODEL_UNKNOWN` |
| 4 | `@mastra/client-js` sobe para 1.62.0, não "a atual" | O plano mandava "a da linha 1.86"; o `package.json` do 1.62.0 depende de core `1.86.0` e do 1.60.0 não há par declarado. Mudança de comportamento: sem repetição de escrita por padrão, e o web já usa `retries: 0` | Voltar a 1.60.0 |
| 5 | O Automático da memória para o Google por chave usa `google/gemini-3.5-flash-lite`: `AUTO_MODELS` ganha `google` e `CLIPROXY_AUTO_MODELS` some, por ficar igual (`H/model-accounts/auto-memory-model.ts:8-28`) | O padrão do `@mastra/memory` para o Google é `google/gemini-2.5-flash` (`@mastra/memory@1.41.1 dist/src-MUc-jGgr.js:23677`), que o 1.86 aposenta; `isChoosable` o recusa e o Observer e o Reflector cairiam ao modelo da conversa, mais caro. O id barato vivo é o que o CLIProxy já usa (`:17-20`). O builder confere antes o padrão do `@mastra/memory` 1.41.3: se já não for `gemini-2.5-flash`, a decisão cai | Devolver `CLIPROXY_AUTO_MODELS`; o Google por chave volta a cair ao modelo da conversa |

## U1 Os pacotes sobem e o que a 1.86 força

**Base e modelo.** Base: o commit do `main` em que o cartão for aprovado. Modelo: Sonnet. Os pontos de
decisão já estão tomados aqui; o único sutil, a recuperação de runs, tem a prova do banco que ele roda.
Opus só se a prova do critério 5 ou 6 falhar de um jeito que o cartão não previu (então para e pergunta).

### As linhas da tabela

As linhas de U1 da tabela de referência (os pins, o diário, a recuperação, o laço do logger, a lista de modelos, `NOT_CHAT`, a lista fixa de rotas, a gravação, o `client-js` e os quatro pacotes sem mudança). O que ler na base:
`H/mastra/mastra.ts:33-67` (o `new Mastra` e o laço), `H/mastra/hub-mastra.ts:118-128` (`start`),
`H/mastra/mastra.test.ts`, `H/model-accounts/providers.ts:18-35,86-102` e `providers.test.ts:97-139`,
`H/routes/guard.ts:35-45`, `apps/server/src/platform/recordings.test.ts:171`, `scripts/record.ts:98-102`.
A referência: as colunas "Referência" da tabela, e a opção em `NOVO/core/dist/mastra/index.d.ts:417-445`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `package.json`, `apps/server/package.json`, `apps/web/package.json`, `packages/app/package.json`, `package-lock.json` | Muda os pins | todo o repositório |
| `apps/server/src/harness/mastra/` (`mastra.ts`, `mastra.test.ts`) | Apaga o laço, acrescenta `recovery` e um caso de teste (o logger) | `hub-mastra.ts` |
| `apps/server/src/harness/model-accounts/` (`providers.ts`, os testes, o comentário de `served.ts:17`) | Lê os sete nomes, troca ids de exemplo | `queue.ts`, `defaults.ts`, `served.ts` |
| `apps/server/src/harness/routes/guard.test.ts` | Um caso: rota fora da lista dá 404 | nada |
| `apps/server/src/harness/model-accounts/auto-memory-model.ts` e o teste | O Google por chave passa a um id vivo (decisão 5, critério 17) | `harness/memory/`, o turno |
| `packages/hub-api/src/conversations.ts` | Só o comentário da linha 17 | o web e o servidor, sem efeito |
| `apps/server/src/agents/**` e `apps/server/src/harness/**` testes que usam ids aposentados | Troca de fixture, sem lógica (`apps/web/sweep-defaults-states.ts:12`, com `openai/gpt-5`, tem lista própria de provedores e fica fora do critério 10) | os próprios testes |
| `apps/server/src/platform/recordings/mastra/reads.jsonl` | Regrava | `recordings.test.ts`, `test-recordings.ts` |
| Comentários que citam o Mastra 1.83 ou um arquivo antigo (a lista no passo 5) | Atualiza o texto | nada |

### Os contratos que a unidade cria

Uma forma nova (a opção `recovery`); a decisão 5 só troca um valor, sem contrato novo.

- `new Mastra({ ..., recovery: { workflows: 'off' } })` em `H/mastra/mastra.ts`, com o motivo no comentário
  (a opção e a razão: `NOVO/core/dist/mastra/index.d.ts:417-445`).

### As skills e a leitura

`docs/reference/stack.md`, linhas de `@mastra/core`, `@mastra/pg`, `@mastra/observability` e
`@mastra/client-js`: skill `mastra`; ler primeiro `node_modules/@mastra/<pacote>/dist/docs/` e o `dist`.
Para TypeScript, `pstack:typescript-best-practices`. Lê o guia de [testing](../guides/testing.md).

### A ordem do trabalho

1. **Os pins e o lockfile.** Critérios: 1, 2, 3, 4.
   - **Arquivos:** muda os quatro `package.json` e `package-lock.json`.
   - **Referência a seguir:** a linha dos pins; `client-js` 1.62.0 (decisão 4).
   - **O que sai:** nada.
   - **O que entra:** os nove pacotes nas versões da tabela; `@mastra/core` na raiz e em `packages/app`
     também.
   - **Testes:** comandos `npm ls @mastra/core --all` e o filtro dos três pares opcionais;
     `packages/app/src/check/memory.test.ts`.
   - **Mutações à mão:** deixar um pin em 1.83.0 em `apps/server`: o `npm ls` mostra duas cópias.
   - **Pronto quando:** `npm ls` mostra uma cópia e o typecheck passa.
2. **A recuperação desligada e o laço fora.** Critérios: 6, 7.
   - **Arquivos:** muda `H/mastra/mastra.ts`, `H/mastra/mastra.test.ts`.
   - **Referência a seguir:** as linhas da recuperação e do laço; code C50 (a falha de domínio chega ao registro central).
   - **O que sai:** o laço `for ... __setLogger` (`mastra.ts:62-65`) e o comentário dele.
   - **O que entra:** `recovery: { workflows: 'off' }` no `new Mastra`, com o comentário do porquê (D27 e a automação com
     chamada de modelo); um caso de `mastra.test.ts` em que, com o store de `createMastraStorage` sobre o
     banco de teste, uma falha plantada num domínio chega ao `HubLogger`. A prova da recuperação é o que já
     existe, `agents/assistant/automations/scheduler.test.ts:50,138`, pela porta pública do Hub; ler
     `recoveryConfig` não prova nada (T6, T7). Regras: C50, T5.
   - **Mutações à mão:** tirar a opção `recovery`: `scheduler.test.ts:50` e `:138` ficam vermelhos (se não
     ficarem, o builder para: o critério 6 ficaria sem teste que falha); trazer o laço de volta: `rg
     __setLogger` acusa.
   - **Pronto quando:** o caso novo de `mastra.test.ts` e os dois de `scheduler.test.ts` passam.
3. **A lista de modelos e os testes que ela quebra.** Critérios: 8, 9, 10, 17.
   - **Arquivos:** muda `providers.ts`, `providers.test.ts`, `auto-memory-model.ts` e o teste, `model-start.test.ts`, `model-defaults.test.ts`, `queue.test.ts` e os testes
     que o `rg` dos ids aposentados achar.
   - **Referência a seguir:** as linhas da lista de modelos e de `NOT_CHAT`.
   - **O que sai:** `CLIPROXY_AUTO_MODELS`.
   - **O que entra:** os sete nomes (`edenai/cohere/command-a-translate-08-2025`, `stepfun-step-plan/stepaudio-2.5-chat`,
     `stepfun/stepaudio-2.5-chat`, `stepfun-ai/stepaudio-2.5-chat`, `stepping-stone/allenai/olmOCR-2-7B`,
     `nano-gpt/hyperresearch/ousia-1`, `humain/humain-m3-research-preview`) cada um lido: de áudio, OCR,
     pesquisa ou tradução entra em `NOT_CHAT`; de conversa, em `CHAT_FAMILIES`. Nos testes, os ids
     aposentados saem por ids vivos (`anthropic/claude-sonnet-5-5`, `anthropic/claude-opus-5-5`,
     `openai/gpt-5.6-luna`, `google/gemini-3.5-flash-lite`, os quatro listados e vivos nos dois registros);
     fica um caso deliberado com `anthropic/claude-sonnet-4-5`, o do critério 8 (retirado, não se oferece). Nenhum
     padrão guardado nem semente de produção usa id aposentado (conferido no `main`); o que sobra é o padrão da
     biblioteca para a memória do Google, na decisão 5 (`auto-memory-model.ts`, que muda com o teste). O comentário de `served.ts:17` e o de
     `packages/hub-api/src/conversations.ts:17`, que chamam `claude-sonnet-4-5` de modelo que o registro "ainda
     oferece", passam a um id vivo.
   - **Testes:** `providers.test.ts` (a lista, `HINTS_NOT_CHAT`); `model-start.test.ts:30` (o aposentado não vira
     padrão nem começa conversa); casos novos pela porta pública (T5): em `model-defaults.test.ts`, a escolha
     salva com `anthropic/claude-sonnet-4-5` plantada por SQL e a conversa nova no próximo degrau; em
     `model-fallback.test.ts`, a troca da conversa para esse id dá 422 `MODEL_UNKNOWN`; em
     `auto-memory-model.test.ts`, o Google por chave dá `gemini-3.5-flash-lite` (critério 17).
   - **Mutações à mão:** tirar `NOT_CHAT` de um nome novo: `HINTS_NOT_CHAT` fica vermelho; fazer
     `chatModelsOf` ignorar `deprecatedModels`: o caso do critério 8 fica vermelho; tirar `google` de
     `AUTO_MODELS`: o caso do critério 17 fica vermelho.
   - **Pronto quando:** os testes de `model-accounts/` tocados passam.
4. **A gravação e as rotas.** Critérios: 11, 12, 13, 14, 15.
   - **Arquivos:** regrava `reads.jsonl`; muda `guard.test.ts`.
   - **Referência a seguir:** as linhas da lista fixa, da gravação e do `client-js`.
   - **O que sai:** nada.
   - **O que entra:** `npm run record -- reads` e o diff de `reads.jsonl` lido (cabeçalho, `recordedAt` e,
     se mudar, os campos novos `usage_update.total` ou `abortReason`); um caso de `guard.test.ts` que prova
     `GET /memory/working-memory` e `POST /agents/x/signals` sem rota no escopo do Hub.
   - **Testes:** `recordings.test.ts`, os de `harness/room` que leem a gravação, `guard.test.ts`,
     `conversation-stream-paced.test.ts`, `agents/saved-agent/approval.test.ts`, `closure.test.ts`.
   - **Mutações à mão:** voltar o cabeçalho a 1.83.0: `recordings.test.ts:171` fica vermelho; pôr a rota
     nova na `FIXED_LIST`: o caso novo fica vermelho.
   - **Pronto quando:** os testes tocados passam com a 1.86.
5. **Os comentários e a prova do diário.** Critérios: 5, 6.
   - **Arquivos:** os comentários da linha "Comentários que citam" do raio, sem tocar a lógica.
   - **Referência a seguir:** o instalado. O `arquivo:linha` novo de cada comentário, já lido no estudo (todos em `NOVO/core/dist/` salvo onde diz): `harness/turn/end.ts:306` vira `agent-controller-D5EKeS1H.js:5103-5131`; `harness/spec/resume.ts:12-16` vira `run-registry-Bx06ZIN_.js:101447-101454,101688,101732` e `tool-Z3bykc1m.js:1066-1070`; `harness/network/network-tool.ts:209` vira `tool-Z3bykc1m.js:1066-1070`; `harness/spec/test-request.ts:15` vira `run-registry-Bx06ZIN_.js:65033,65093,65386-65404,80217`; `harness/machine/test-machine-files.ts:17` vira `workspace-DY2Nxiyi.js:9150-9168`; `harness/tools/connectors/typed-reads.ts:83` vira `run-registry-Bx06ZIN_.js:99571-99590` (o defeito segue na 1.86.0); `harness/model-accounts/providers.ts:14` vira `llm/model/capability-file.d.ts:1-8`; `harness/mastra/hub-mastra.ts:53,119` (citam um arquivo antigo do Mastra) passam a citar `mastra-CqBmnzjM.js`, onde o builder acha o trecho do agendador; `harness/spec/mount.ts:92` (`NM/tool-3X7mHzgh.js:858`) passa ao `tool-Z3bykc1m.js` equivalente; `harness/routes/changes.ts:24` (`@mastra/server@1.83.0 agent-controller.js:224-233`) passa a `server/dist/agent-controller-CzKnfKkw.js`; `harness/mastra/mastra.ts:53,55` (`@mastra/observability` 1.24.0, `dist/index.js:455-460`) passa a `@mastra/observability` 1.24.3 `dist/index.js:454-465`; `harness/memory/storage.ts:14-17` (`@mastra/pg 1.35.0`) passa a `@mastra/pg` 1.38.0 `dist/index.js:29911` e `:23906`; o título de `agents/app-builder/turn.test.ts:122` passa a dizer 1.86.0 (o evento segue em `agent-controller-D5EKeS1H.js:1169-1180,715-725`).
   - **O que entra:** cada comentário passa a citar o instalado; roda-se a prova da seção abaixo.
   - **Pronto quando:** a prova passa e o resultado está colado no PR.

### Como se prova

- **Critério 5 (o diário, M17 do plano).** Postgres local com o papel `postgres` e `conexus_owner` (como na CI), o lago de teste do relógio (o dublê de `harness/copy-clock/clock.test.ts`). 1) Hub no `main` (1.83): liga uma cópia no menor intervalo que o produto agenda, 15 minutos (`clock.ts:44-61`), deixa uma rodada rodar (fica um snapshot `success`) e planta por SQL uma rodada antiga, além do prazo da retenção; pare o processo. 2) Hub da branch (1.86), mesmo banco: a agenda e o snapshot antigo se leem (lista igual à de antes), e no próximo quarto de hora a cópia dispara e deixa um snapshot novo `success`. A partida regrava a linha da agenda (`clock.ts:120-134`), então o que se prova é o disparo e a leitura dos snapshots da 1.83, não a linha. 3) A retenção só roda às 03:30 (`retention.ts:82`): rode-a uma vez de propósito, com um script fora do repositório que abre o `createMastra` do Hub sobre esse banco e inicia o fluxo `RETENTION_WORKFLOW`; o resultado é `Pruned` com a rodada antiga apagada e nenhum `error`. A prova que não roda a retenção não vale. O que falha hoje: nada, o `main` ainda não tem a 1.86; a prova é o contraste dos dois binários no mesmo banco.
- **Critério 6 (recuperação).** Os dois testes de `scheduler.test.ts` (`:50`, `:138`), com a opção tirada: ficam vermelhos. Mais, à mão, no mesmo banco com o Hub parado: plante uma linha `running` num snapshot de automação de teste, sem lease, com `updatedAt` de uma hora atrás; suba o Hub da branch e espere dois minutos (2 s de graça mais um ciclo de 60 s): a linha continua como está e o dublê de provedor não recebeu chamada. Sem a opção, o run é reiniciado e o dublê recebe a chamada.
- **Critério 7.** `mastra.test.ts` planta uma falha de domínio (um `console.warn` do domínio de
  armazenamento, ou o erro de um método de domínio) e confere que entra no `HubLogger`.
- **Critérios 3, 4, 8 a 15.** Os testes nomeados, rodados só os tocados (a suíte inteira é da CI, L15).

### Parar se

- A prova do critério 5 falha (a agenda não dispara, o snapshot antigo não lista, ou a retenção erra): o
  builder para e pergunta; não muda nada do diário por conta própria. Se o relógio do lago não tem como
  disparar uma cópia com o dublê local, ele mostra o que achou e pergunta, em vez de trocar a prova.
- `scheduler.test.ts:50` ou `:138` continua verde com a opção `recovery` tirada: o critério 6 ficaria sem
  prova, e o builder pergunta antes de confiar só na prova à mão.
- `reads.jsonl` regravado traz eventos que `test-recorded.ts` da web ou `test-events.ts` recusam: o builder
  mostra o diff e pergunta, porque pode ser mudança de contrato de evento.
- Um teste de `model-accounts` precisa de dois ids diferentes do mesmo provedor e só há um vivo na lista:
  o builder para, não inventa id.
- O `npm install` traz um dos três pares opcionais, ou um pacote que a tabela não lista: para e pergunta.
- A prateleira `mastra-1.86` ainda não existe e uma referência precisa dela: pede ao firstmate (a clone é
  chamada de rede, que o builder não faz).

## U2 O registro

**Base e modelo.** Depois de U1. Sonnet (só documento).

### As linhas da tabela

As linhas de U2 da tabela de referência (o stream, os quatro pacotes sem mudança e a tabela da stack com as entradas de `boundaries`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/reference/stack.md` | Linhas de `@mastra/*`, a coluna "Reference" e "Trap" para a 1.86 | `check-docs` |
| `docs/reference/boundaries.md` | Entradas "Mastra 1.83.0: ..." relidas: título e versões para 1.86.0; a do stream corrige a frase do adaptador e cita os limites do Mastra; a da leitura que não pergunta acrescenta que o 1.86 absorveu a suspensão por função; a do logger perde a metade que saiu | `check-boundaries` |
| `docs/explanation/harness.md` | "`@mastra/core` 1.83.0 today" passa a 1.86.0 | quem lê o desenho |
| `docs/conhecimento/agentes-e-harness.md:40`, `docs/explanation/mapa.md:170` | Dizem "Mastra 1.83" como o que foi lido ou como a referência de uma tela: ficam, por serem história, salvo se o builder reler a tela no 1.86 | quem lê o desenho |
| `docs/reference/boundaries.md:1547` | A entrada `@mastra/memory 1.41.1 and CLIProxyAPI`: só título e versão (1.41.3), relida contra o instalado | `check-boundaries` |

### Os contratos que a unidade cria

Nenhum.

### As skills e a leitura

[delivery](../guides/delivery.md) (L20: skills e guias só mudam no fechamento; este cartão não toca nenhum).
Linhas de `docs/reference/stack.md` do próprio `Mastra`: skill `mastra`.

### A ordem do trabalho

1. **A prateleira e a tabela da stack.** Critério: 16.
   - **Arquivos:** muda `docs/reference/stack.md` e `docs/explanation/harness.md`.
   - **Referência a seguir:** `docs/reference/stack.md:17-18` (a subida refresca a prateleira e este
     arquivo juntos); a prateleira `mastra-1.86` (feita pelo firstmate, fora do repositório) para os
     `arquivo:linha` de Mastra Code e Factory.
   - **O que entra:** as colunas "Reference" trocam "Mastra 1.83 (`mastra-1.83`)" por "Mastra 1.86
     (`mastra-1.86`)" com cada `arquivo:linha` relido; onde a linha andou, o número novo.
   - **Pronto quando:** `npm run docs` passa.
2. **As entradas de `boundaries`.** Critério: 16.
   - **Arquivos:** muda `docs/reference/boundaries.md`.
   - **Referência a seguir:** as colunas "Referência" e "Como a referência faz" da tabela, e `NOVO/`: o builder relê cada entrada contra o instalado.
   - **O que entra:** o que a coluna "Raio" diz; as entradas da fila de contas, do lock do Projeto, do turno
     recusado, do fim do turno e da chamada não parseável só mudam o título e as versões (`igual`).
   - **Pronto quando:** `npm run docs` e `check-boundaries` passam.

### Como se prova

Critério 16: `npm run docs` verde; um `rg "1\.83" docs/reference` só acha as menções históricas
(a prateleira antiga, decisões antigas). O que falha hoje: nada, as linhas dizem 1.83.

### Parar se

A prateleira `mastra-1.86` não existe: o builder pede ao firstmate e não cita o que não leu.

## G1 O ponto de conferência

Depois das duas unidades, antes do pull request: os passos 6 e 7 de
[`conexus-build`](../../.agents/skills/conexus-build/SKILL.md) rodam o `/deslop`, o `/no-comments` e o
`npm run quality` em modo rápido, as mutações à mão de U1, `npm run check` (com `NODE_OPTIONS`
em 8 GiB) e os testes tocados. Antes de empurrar, `npm run check:local`. Servidor: a prova do diário dos
critérios 5 e 6, colada no PR. Migração: nenhuma (`init()` do Mastra adiciona uma coluna por conta
própria; `npm run migrations -- --base origin/main` não acusa nada do Hub). Tela: nenhuma. A CI roda a
suíte inteira.
