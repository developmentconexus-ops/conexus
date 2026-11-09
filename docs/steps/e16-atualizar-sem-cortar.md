# Etapa 16: Atualizar sem cortar

O roteiro chama esta etapa de "16 Atualizar sem cortar. Conversa enquanto o Conexus é atualizado.",
com "Consertos de execução da auditoria. Testes 9 e 10". Ela vem depois da 21.1 e antes da 22
(2026-10-22: "Deixarei ela mais pro final mesmo." e, à posição antes da 22, "Sim"). Cada linha citada
foi lida no `main` em `44fb4040`, com `@mastra/core` 1.82.0, `@mastra/pg` 1.35.0 e `@mastra/server`
1.82.0 instalados. A 24.5 não fechou no `main` nesse commit, e a 24.6, a 24.7 e a 21.1 eram cartões
em rascunho (https://github.com/developmentconexus-ops/conexus/pull/842,
https://github.com/developmentconexus-ops/conexus/pull/890 e
https://github.com/developmentconexus-ops/conexus/pull/892): o que vem delas está marcado "cartão
da 24.6" e semelhantes, e o construtor de cada unidade reabre essas linhas no `main` do dia.

## A página do fundador

**O que a etapa quer dizer hoje.** "Os testes 9 e 10" são dois testes de aceite do Builder escritos
antes do repositório novo. O 9: "um turno cortado depois de o agente escrever um arquivo termina num
estado final, e o Projeto aceita mensagem nova". Ele já passa. O 10: "uma atualização espera o turno
em curso acabar, com a tela aberta e com a tela fechada". Desde a 24.1, o Conexus espera até 3
minutos; esta etapa o completa. "Os consertos de execução da auditoria" eram dez consertos do motor
de execução do produto antigo, que a 14.2 trocou pelo do Mastra. Sobra um que vale hoje: o Projeto
ocupado por uma conversa vive na memória de um Conexus só. Ele entra aqui.

**O que você vê hoje numa atualização.** Por até 3 minutos, quem manda mensagem lê "O Conexus está
sendo atualizado. Tente em um minuto.". Depois, o Conexus fica fora do ar de 6 a 17 segundos (medido
em dez publicações, antes da espera da 24.1): a conversa aberta perde o fio, um app publicado não
abre, uma mensagem do Telegram fica sem resposta. Um cartão aberto some e você pede de novo. Uma
resposta de mais de 3 minutos é cortada.

**No fim desta etapa** você conversa com o Builder e com um agente enquanto uma versão nova do
Conexus entra, sem aviso e sem pausa: a resposta em andamento continua na tela até o fim, a mensagem
seguinte já vai para o Conexus novo, o app publicado e o Telegram não param.

**O roteiro de uso.**

1. Num Projeto, peça ao Builder uma mudança grande no app (uma que leve mais de um minuto). Enquanto
   ele escreve, o firstmate publica uma versão nova do Conexus.
2. A resposta continua até o fim, sem a frase de atualização. Mande outra mensagem logo depois: ela
   é respondida normalmente.
3. Com a versão entrando, abra um app publicado: ele abre. Mande uma mensagem ao agente no
   Telegram: ele responde.
4. Peça a um agente uma escrita no Sankhya e deixe o "Aprovar?" aberto. Publique outra versão. Com
   a `A1`, o cartão continua na tela; clique **Aprovar**: o pedido é lançado uma vez.
5. Com um fluxo da 24.6 rodando um balão longo, publique outra versão. Com a `B1`, a execução
   termina sozinha; com a `B2`, ela aparece "Interrompida" e **Tentar de novo** a termina.
6. Feche a aba do Builder no meio de uma resposta e publique uma versão. Abra a conversa depois: a
   resposta está inteira.

**O que você faz, e quando.** Antes: nada; o endereço do Tunnel não muda. No começo: aprova esta
página. No fim: faz o roteiro, diz o que viu e aprova os textos.

**Fica de fora.**

- **Uma resposta de mais de 3 minutos** continua sendo cortada com "A atualização do Conexus cortou
  esta resposta.". Continuar a resposta no Conexus novo pede o "agente durável" do Mastra, que é Beta,
  refaz chamadas ao modelo e às ferramentas, e não serve à conversa do Builder hoje. Esperar mais que
  3 minutos esbarra no limite de 10 minutos de cada publicação.
- **Uma versão que troca a versão do Mastra** ainda sai do ar por alguns segundos, como hoje: o
  Conexus só põe dois Conexus lado a lado quando os dois usam o mesmo Mastra. O mesmo vale para
  **Voltar atrás** a uma versão de antes desta etapa.
- **Dois servidores.** Os dois Conexus rodam no mesmo servidor de São Paulo; se ele cair, tudo cai,
  como hoje.
- Os itens marcados `next-card` que são das etapas antes desta (24.5.1, 24.6, 24.7, 21.1) ficam nos
  cartões delas. Esta etapa leva o #339 e o #275, que são do fim do Conexus e da publicação.

**As decisões suas nesta etapa.**

**A. O cartão aberto volta depois de uma atualização?**

- **`A1` (recomendada). Volta.** O "Aprovar?" de uma escrita, o plano e a pergunta do Builder
  continuam na tela depois da troca, e a sua resposta roda uma vez. Exemplo: o agente pergunta
  "Aprovar o pedido de 3 caixas para o cliente 1234?", a versão entra, você clica **Aprovar** e o
  pedido é lançado uma vez; um segundo clique não lança de novo. Objetivo: uma atualização nunca custa
  um pedido seu. Quem faz assim: o próprio Mastra no Telegram (provado na 24.7: o cartão vale depois de
  um reinício), o n8n e o Dify, que guardam a espera numa linha. O como, nativo: o Mastra já guarda a
  espera; o Conexus a lê e responde a ela pela função do Mastra feita para isso
  (`respondToPersistedToolApproval`). Medido com dois processos: a escrita rodou uma vez e a segunda
  resposta foi recusada. Muda o que você aprovou na 14.2 e na 24.5 ("você pede de novo").
- **`A2`. Some, como hoje.** Nada muda na tela. Custo: com várias publicações por dia, todo cartão
  aberto numa delas se perde, e a pessoa pede de novo.

**B. Um fluxo cortado no meio por uma atualização continua sozinho?** (vale quando a 24.6 estiver no
`main`)

- **`B1` (recomendada). Continua sozinho**, do balão em que estava, no Conexus novo, assim que o
  velho larga a execução (até 15 segundos depois de ele sair). Uma escrita que já tinha sido enviada
  não é enviada de novo: o registro de envios da 24.5 a recusa e diz que não sabe se lançou. Exemplo:
  o fluxo do orçamento lia o Sankhya às 3h quando uma versão entrou; às 3h01 ele terminou, sem
  ninguém. Objetivo: um fluxo agendado nunca fica parado esperando alguém ver. Quem faz assim: o
  Kestra (por padrão, refaz a tarefa depois do prazo do trabalhador que saiu), o Activepieces (até 3
  vezes) e o n8n numa opção ("suspender ao desligar" e continuar em outro). O como, nativo: o
  `restart()` do Mastra, o mesmo do botão **Tentar de novo** da 24.6, que o Mastra recusa enquanto o
  Conexus velho ainda é o dono da execução.
- **`B2`. Fica "Interrompida"** e espera o seu **Tentar de novo**, como o cartão da 24.6 escreve. É o
  padrão do n8n, que prefere falhar a repetir. Custo: um fluxo de madrugada espera até alguém abrir.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 Dois Conexus na troca | O Hub novo sobe ao lado do velho, cada um com o seu conector do Tunnel e o seu apelido `hub`, num espaço de PIDs comum e num volume do socket; o deploy troca a cor, para o par velho, e volta sem queda quando o novo não fica saudável; sobreposição só com o mesmo Mastra nas duas imagens; o #275 | `infra/`, `scripts/deploy*.ts`, `.github/workflows/{publish,restart,rollback}.yml` (só se o passo mudar), `apps/server/src/platform/migrate.ts`, `docs/how-to/hub-server.md`, `docs/decisions/` | [delivery](../guides/delivery.md) | nada |
| U2 A conversa entre os dois | O `Mastra` com `UnixSocketPubSub` quando `HUB_SIGNALS_SOCKET` existe; o Projeto ocupado na posse comum do PubSub; o fim do Hub fecha o PubSub; o #339 | `apps/server/src/platform/config*.ts`, `apps/server/src/builder/mastra/`, `apps/server/src/builder/runs/`, `apps/server/src/builder/conversation/` (`end.ts`, `test-conversation.ts`), `apps/server/src/main.ts`, `docs/reference/boundaries.md` | [testing](../guides/testing.md) | U1 (o volume e a variável) |
| U3 O cartão volta (`A1`) | As esperas guardadas da conversa voltam como cartões; a resposta a uma espera guardada passa pelo guarda com as conferências de hoje | `apps/server/src/builder/conversation/` (`guard.ts`, `routes.ts`, `stream.ts`), `apps/server/src/builder/agents/`, `packages/hub-api/src/`, `apps/web/src/builder/conversation/` | [security](../guides/security.md) | U2 |
| U4 O fluxo continua (`B1`) | O Hub novo refaz por `restart()` a execução de fluxo e de automação que o velho largou, quando a posse do Mastra vence; o velho espera as execuções em voo como espera os turnos | `apps/server/src/builder/workflows/` (da 24.6), `apps/server/src/builder/automations/`, `apps/server/src/builder/mastra/hub-mastra.ts` | [testing](../guides/testing.md) | U2 e a 24.6 no `main` |

A U1 e a U2 andam em fila (a U2 lê a variável e o volume da U1), mas a U2 pode começar em paralelo
nos testes, que não usam o Compose. A U3 e a U4 não dividem pasta e correm em paralelo depois da U2.
Com `A2`, a U3 sai; com `B2`, a U4 sai e a 24.6 fica como está.

**Orçamento de código alterado.** U1: ~320 linhas (o Compose ~90, o `deploy.sh` ~170, o `migrate.ts`
~20, o how-to e a decisão fora da conta). U2: ~230. U3: ~330. U4: ~170. Total da etapa: ~1.050,
abaixo das 4.000 da L2.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Com o par `blue` no ar e uma imagem nova de mesmo rótulo `conexus.mastra-core`, o deploy sobe `hub-green` e `cloudflared-green` com a imagem nova, espera `hub-green` saudável, e só então para `cloudflared-blue` e `hub-blue`, nessa ordem; o par `blue` nunca é parado antes de o `green` ficar saudável | `scripts/deploy.test.ts`, "a troca sobe a outra cor e só então para a velha" | must |
| 2 | U1 | A imagem nova que não fica saudável em 90 s: o deploy para o par novo, o par velho segue no ar sem ter sido parado, e o deploy termina vermelho com "not healthy" (hoje: uma segunda queda pela volta) | `deploy.test.ts`, "a imagem nova doente não derruba a velha" | must |
| 3 | U1 | Uma imagem sem o rótulo `conexus.mastra-core`, ou com outro valor que a imagem no ar, troca como hoje: para o par velho e então sobe o novo; o deploy diz "Mastra changes: no overlap" | `deploy.test.ts`, "outro Mastra para e sobe" | must |
| 4 | U1 | `--restart` e Voltar atrás usam o mesmo caminho dos critérios 1 a 3 (a mesma imagem tem o mesmo rótulo, então `--restart` sobrepõe) | `deploy.test.ts`, "--restart troca a cor" e "voltar atrás para antes da 16 para e sobe" | must |
| 5 | U1 | O primeiro deploy da 16 num servidor com o serviço `hub` antigo: sobe `green`, e então para o `hub` e o `cloudflared` antigos; o segundo deploy acha a cor viva | `deploy.test.ts`, "o primeiro deploy da 16 aposenta o par antigo" | must |
| 6 | U1 | O Compose: `pid-anchor` sem porta nem rede além da padrão; os dois Hubs e os dois conectores com `pid: service:pid-anchor`; cada Hub com o apelido `hub` só na rede da sua cor; o volume `hub_signals` montado nos dois Hubs em `/run/conexus-signals`; `HUB_SIGNALS_SOCKET` aponta para ele; o `stop_grace_period` de cada Hub cobre `SHUTDOWN_GRACE_MS` e o de cada conector, `--grace-period` mais 5 s | `scripts/deploy-compose.test.ts`, "duas cores, um espaço de PIDs, um socket" | must |
| 7 | U1 | `migrate` que falha ao conectar com `57P01`, `57P03`, `08006` ou erro de conexão sai com 75 e o deploy repete (o #275); outro código sai com 1 | `apps/server/src/platform/migrate.test.ts`, "a conexão que cai é repetida" | must |
| 8 | U2 | Dois Hubs (`hubBeside`) com o mesmo `HUB_SIGNALS_SOCKET`: com uma resposta do Builder em andamento no primeiro, uma mensagem mandada ao segundo na mesma conversa responde 200, não abre outra rodada (o dublê do modelo recebe a segunda pergunta só depois de a primeira terminar) e roda logo depois | `builder/conversation/two-hubs.test.ts` (novo), "a mensagem no Hub novo espera a resposta do velho" | must |
| 9 | U2 | O fluxo da conversa aberto no segundo Hub recebe as partes da resposta que roda no primeiro, e o fim dela; sem o socket comum, não recebe (o teste do contrário documenta o porquê) | `two-hubs.test.ts`, "a tela aberta no Hub novo segue a resposta do velho" | must |
| 10 | U2 | Teste 10: o primeiro Hub recebe o aviso de parar (`close(30_000)`) com uma resposta em andamento e nenhuma tela aberta; a resposta termina, é guardada, e o segundo Hub a lê inteira em `GET …/threads/:threadId/messages` | `two-hubs.test.ts`, "a tela fechada acha a resposta inteira" | must |
| 11 | U2 | O Projeto ocupado entre os dois: com um turno do Builder do Projeto P no primeiro Hub, outra conversa do Projeto P mandada ao segundo responde o `RUN_BUSY` de hoje, com o nome de quem o ocupa; quando o primeiro solta, o segundo admite; sem o socket, o comportamento de um Hub só não muda (`runs.test.ts` passa intacto) | `builder/runs/runs-lease.test.ts` (novo), "o Projeto ocupado vale entre dois Hubs" | must |
| 12 | U2 | O primeiro Hub que sai solta as posses: o segundo admite o Projeto e a conversa sem esperar 15 s (o `close()` do PubSub roda no `release`) | `runs-lease.test.ts`, "o Hub que sai solta o Projeto" | must |
| 13 | U2 | A agenda nos dois Hubs: com uma automação devida enquanto os dois rodam, sai um disparo só (uma execução `sched_…_<ms>`) | `builder/automations/scheduler.test.ts`, "dois Hubs, um disparo" | must |
| 14 | U2 | O #339: parar o Hub no meio de um turno guarda o texto que a resposta cortada já tinha (`conversation-stream.test.ts:133` deixa de ser `todo`) | `conversation-stream.test.ts`, "desligar para o turno em curso como Parar…" | must |
| 15 | U2 | Sem `HUB_SIGNALS_SOCKET`, o Hub sobe com o PubSub padrão do Mastra e nenhum arquivo é criado; com um caminho cuja pasta não existe, o Hub recusa subir com `CONFIG_INVALID` e o nome da variável | `platform/config.test.ts`, "o socket comum" | must |
| 16 | U3 | Depois de o Hub da conversa trocar (um Hub novo ao lado, o velho fechado), o estado da sessão no novo traz o "Aprovar?" que estava aberto, com a mesma ferramenta e os mesmos campos; **Aprovar** roda a escrita uma vez (o dublê conta um pedido) e o cartão termina "Aprovado por você"; um segundo **Aprovar** responde `{ ok: false, reason: 'not_pending' }` e o dublê continua com um | `builder/agents/approval.test.ts`, "depois do reinício" (substitui o critério 8 da 24.5) | must |
| 17 | U3 | O mesmo cartão guardado: quem não tem a escrita no papel recebe `NOT_IN_ROLE` e nada roda (`D3-a`); `alwaysAllowCategory` no corpo dá `REQUEST_MALFORMED`; uma mensagem nova da pessoa recusa a espera guardada (como num portão vivo) e o turno novo roda | `approval.test.ts`, "o cartão guardado e o guarda" | must |
| 18 | U3 | O plano e a pergunta do Builder: depois da troca, o estado traz o cartão; a resposta retoma a mesma rodada no Hub novo (a versão guardada é a mesma, o turno termina `complete`) | `conversation-update.test.ts`, critério 47 reescrito: "atualizar com uma pergunta aberta: o cartão volta e a resposta retoma" | must |
| 19 | U3 | Na tela, depois de a conexão cair e voltar com a troca, o cartão aparece como antes, com os botões acesos; a resposta a ele mostra o fim como hoje | `apps/web/src/builder/conversation/approval-card.test.tsx` e `use-session.test.ts`, "o cartão volta depois da troca" | must |
| 20 | U4 | Uma execução de fluxo com um balão em voo no Hub que sai: o velho espera o balão até o limite de 180 s; se o balão termina, a execução segue no velho até a próxima espera ou o fim | `builder/workflows/runs.test.ts`, "o Hub que sai espera o balão" | must |
| 21 | U4 | A execução que sobra `running` com a posse do Mastra vencida: o Hub novo chama `restart()` uma vez, a execução termina do balão em que estava sem rodar os anteriores (o dublê conta uma leitura), `workflow_run.attempt` sobe 1, e a linha aparece `DONE`; enquanto a posse não vence, nada roda (`WORKFLOW_RESTART_RUN_OWNED` é esperado e tentado de novo) | `runs.test.ts`, "a execução cortada continua sozinha" | must |
| 22 | U4 | Uma escrita em voo no corte: o `restart()` não envia de novo; a execução termina com `WRITE_UNCERTAIN` (o registro da 24.5), e a Atividade da 21.1 mostra a falha | `runs.test.ts`, "a escrita em voo não repete" | must |
| 23 | U4 | Uma automação (24.2) cortada termina pelo mesmo caminho, e o `INTERRUPTED` de `automations/runs.ts:82-99` só aparece quando o `restart()` falha | `builder/automations/runs.test.ts`, "a automação cortada continua" | should |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conversa durante a troca (U2) | como hoje | como hoje | a reconexão de hoje (`use-session.ts:65,133`) | `HUB_UPDATED` só para a resposta que passa de 180 s | como hoje | como hoje | `HUB_UPDATING` só num Hub sozinho (desenvolvimento, `--restart` com outro Mastra) |
| Cartão "Aprovar?" depois da troca (U3) | aberto, como antes | — | o cartão do estado da sessão | a falha de hoje à tela | `not_pending`: o cartão fecha com "Este pedido já foi respondido." (texto de hoje) | `NOT_IN_ROLE`: como hoje | uma mensagem nova recusou a espera: o cartão fecha como hoje |
| Plano e pergunta depois da troca (U3) | aberto, como antes | — | idem | idem | idem | — | idem |
| Execução de fluxo cortada (U4) | — | — | "Rodando" | `FAILED` com o código do balão | — | — | `INTERRUPTED` só se o `restart()` falhar |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `HUB_SIGNALS_SOCKET` | `infra/compose.yaml` (U1) | `platform/config.ts` (U2) |
| rótulo `conexus.mastra-core` | `infra/hub.Dockerfile`, pelo `package.json` do servidor (U1) | `infra/deploy.sh` (U1) |
| a posse `project:<projectId>` | `Runs.take` (U2) | `Runs.take` do outro Hub (U2) |
| `RestoredWait` no estado da sessão | o guarda, de `listSuspendedRuns` (U3) | `apps/web/src/builder/conversation/` (U3) |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `deploy.sh`: subir a outra cor | o grupo `hub-server` do Publish enfileira (`publish.yml:10-12`) | o Hub novo não fica saudável: para o par novo, o velho segue | o Docker sem resposta: `bounded` corta e termina vermelho, o velho segue | `deploy: starting the green pair…`, `not healthy: …` | 1, 2 |
| `deploy.sh`: parar o par velho | — | o `docker compose stop` passa do prazo: o Docker mata o Hub velho com SIGKILL depois do `stop_grace_period`; o novo já serve | idem | `deploy: stopping the blue pair (up to 215 s)` | 1, 6 |
| `migrate` (o #275) | a trava de migrações de hoje | a conexão cai: 75 e o deploy repete até 3 vezes | Neon reiniciando: 75 | `MIGRATE_RETRY` com o código | 7 |
| A posse do Projeto (`acquireLease`) | um vence, o outro recebe o dono: `RUN_BUSY` | o Hub dono morre: a posse vence em 15 s (o PID não existe mais: na hora) | o socket some: o Mastra elege outro corretor; a posse é um arquivo, não muda | `RUN_BUSY` como hoje | 11, 12 |
| A posse da conversa (Mastra) | a segunda mensagem vai ao dono e espera | o dono para: libera no `close()`; morre: 15 s | idem | nada novo | 8, 12 |
| Disparo da agenda | o CAS do Mastra deixa um (`scheduler-Me4rCjO2.js:357-370`) | — | o banco fora: o disparo não é reclamado, o próximo tique tenta | o log do Mastra | 13 |
| Responder uma espera guardada (`respondToPersistedToolApproval`) | o Mastra retoma uma vez; a segunda acha nada e o guarda responde `not_pending` | a resposta se perde depois de retomar: a escrita segue o registro da 24.5 (`WRITE_UNCERTAIN`, nunca duas) | o banco do Mastra fora: a falha à tela, nada enviado | `CONNECTOR_WRITE_APPROVED` como hoje | 16, 17 |
| Responder uma suspensão guardada (`respondToToolSuspension` com endereço) | a segunda não acha a suspensão: `not_pending` | idem | idem | como hoje | 18 |
| `restart()` de uma execução largada (U4) | o Mastra recusa a segunda (`WORKFLOW_RESTART_RUN_OWNED`); o `UPDATE … attempt` deixa um | o Hub novo cai no meio: a próxima subida tenta de novo | o banco fora: a execução fica `running` e o próximo início tenta | `WORKFLOW_RESUMED_AFTER_UPDATE` com execução e tentativa | 21, 22 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O Hub novo sobe ao lado do velho | U1 | um serviço `hub` recriado: o velho sai antes de o novo nascer (`infra/compose.yaml:11-81`; `infra/deploy.sh`, `up --detach --wait --wait-timeout 90`) | `@mastra/core@1.82.0` `dist/docs/references/reference-configuration.md:995-997` (`drainTimeout`, "rolling deploys"); kestra@aa4bc75 `core/src/main/java/io/kestra/core/server/ServerConfig.java:20`; activepieces@f34c43cd `packages/server/worker/src/lib/main.ts:33-42` | o novo recebe, o velho drena com prazo abaixo do da plataforma | embrulhado: as cores no Compose e a troca no `deploy.sh` | critérios 1 a 5 | não precisa | — |
| Uma entrada para os dois | U1 | o Tunnel aponta `http://hub:8080` (`docs/how-to/hub-server.md:29-30`); um `cloudflared` com `depends_on` | Cloudflare, réplicas do Tunnel (developers.cloudflare.com, "Tunnel availability", lida 2026-11-09: "To update the configuration of a tunnel without downtime"); `cloudflared` `--grace-period`, padrão 30 s, "stop accepting new requests, wait for in-progress requests" (run-parameters, lida 2026-11-09) | um conector por Hub no mesmo Tunnel; parar um drena os pedidos dele | nativo | o roteiro, passo 3 (não chamamos a Cloudflare no estudo) | não precisa | — |
| O espaço de PIDs comum | U1 | cada contêiner o seu | `@mastra/core@1.82.0` `dist/events/index.js` `acquireLease` (:535-550) e `#isLeaseRecordLive` (`process.kill(pid, 0)` e o nonce) | uma posse vale só se o PID do dono existe no mesmo espaço | embrulhado: `pid: service:pid-anchor` (Compose v5.5.0) | prova do estudo: contêineres separados rodaram duas respostas juntas (−3,8 s); no espaço do `pid-anchor`, coordenaram (+61 ms), e o novo seguiu depois de o velho sair; entrada nova em [boundaries](../reference/boundaries.md) | não precisa | — |
| A sobreposição só com o mesmo Mastra | U1 | `storage.init()` no início de cada Hub (`builder/mastra/hub-mastra.ts:88-97`), hoje depois de o velho sair | nenhuma faz | — | embrulhado: rótulo da imagem e a troca de hoje quando ele difere | critério 3 | não precisa | — |
| A conversa entre dois processos | U2 | nenhum `pubsub` (`builder/mastra/mastra.ts:20-28`): `EventEmitterPubSub` | `@mastra/core@1.82.0` `dist/docs/references/docs-signals-running-across-processes.md:7-17,25-44`, `reference-pubsub-unix-socket-pubsub.md:7,15-24,54-60`; Mastra Code `mastracode/sdk/src/index.ts:704-708` e `utils/signals-pubsub.ts:150-200` (mastra@6e8dfcb8); Factory `mastracode/factory/src/factory.ts:218-224` | a posse da conversa é um arrendamento; a mensagem vai ao dono; o fluxo passa pelo canal | nativo | prova do estudo: com o canal, a segunda resposta começou 68 a 81 ms depois da primeira (3 de 3) e o novo viu 10 partes do velho; sem ele, duas respostas juntas | não precisa | — |
| A tela aberta no Hub novo | U2 | reconecta e relê o estado (`apps/web/src/builder/conversation/use-session.ts:65,133`) | o tópico da conversa no canal comum (acima); `docs-harness-agent-controller.md:515` ("doesn't replay events missed") | quem assina no novo recebe os eventos seguintes | nativo | critério 9 | não precisa | — |
| O Projeto ocupado | U2 | `Runs.#writing` em memória (`builder/runs/runs.ts:57,100-127`) | `reference-pubsub-lease-provider.md:7-13,51-60`; o `main` do Git já anda por compare-and-swap (`builder/runs/save.ts:57`) | uma posse com prazo num lugar comum | embrulhado: `acquireLease('project:<id>')` do PubSub do Mastra, renovada a cada 5 s | critérios 11, 12 | não precisa | `builder/runs/project-lease.ts` |
| A agenda nos dois | U2 | o velho para a agenda no `settle` (`hub-mastra.ts:109-112`) | `dist/scheduler-Me4rCjO2.js:17-20,357-370` (CAS de `nextFireAt`); `docs-deployment-workers.md:51` | um disparo, um dono | nativo | critério 13 | não precisa | — |
| O velho termina o que tem | U2 | `settle` até 180 s e `drain` com `HUB_UPDATED` (`builder/conversation/end.ts:270-293,362-375`; `platform/lifecycle.ts:13,54-62`) | Cloudflare Durable Objects, 300 s (cartão da 24.1, `E1`) | drenar com prazo | nativo, fica | `drain.test.ts` | `E1` (24.1) | — |
| O texto da resposta cortada | U2 | perdido em 8 de 8 rodadas locais (#339; `conversation-stream.test.ts:133`, `todo`) | `docs-harness-durable-agents.md:297` (o checkpoint na fronteira do passo depois de `shutdown()`) | guardar antes de soltar | embrulhado: esperar o `persistMessages` da memória antes do `mastra.shutdown()` | critério 14 | não precisa | — |
| O cartão aberto depois da troca | U3 | `toolAnswer` responde `not_pending` sem portão vivo (`builder/conversation/guard.ts:197-218`); critério 47 (`conversation-update.test.ts:57-71`) | `dist/agent-controller-BDds1y5w.js:2347-2352`, `:5225-5272` (`hasPersistedToolApproval`, `respondToPersistedToolApproval`), `:6043-6050` e `:5959-5990` (`respondToToolSuspension` com endereço); Mastra Channels `packages/core/src/channels/agent-channels.ts:734,762` (mastra@6e8dfcb8); Dify `api/core/app/layers/pause_state_persist_layer.py:50-56` (dify@208a2489) | a espera é guardada; quem responde a acha | embrulhado: a leitura das esperas e a resposta guardada atrás do guarda | prova do estudo: a aprovação rodou uma vez no outro processo, a segunda foi recusada; plano e pergunta, critério 18 | `A` | `builder/conversation/waits.ts` |
| O fluxo cortado | U4 | cartão da 24.6: `INTERRUPTED` e **Tentar de novo** por `restart()` (critério 18 dele); `builder/automations/runs.ts:82-99` | `dist/mastra-D4MXu5BN.js:2885-2935` (`restartAllActiveWorkflowRuns`, `WORKFLOW_RESTART_RUN_OWNED`); `docs-workflows-overview.md:501-503`; kestra@aa4bc75 `WorkerTaskRestartStrategy.java:6-21`; activepieces@f34c43cd `packages/server/api/src/app/workers/job-queue/job-broker.ts:43-45`; n8n@2e855356 `packages/cli/src/scaling/scaling.service.ts:117` e `packages/@n8n/config/src/configs/scaling-mode.config.ts:185-194` | refazer depois do prazo, ou falhar | nativo: o `restart()`; as referências divergem, e a decisão `B` escolhe | critérios 20 a 23 | `B` | `builder/workflows/after-update.ts` |
| Uma resposta de mais de 180 s | fica de fora: as sessões do controlador não são duráveis (`docs-harness-agent-controller.md:96`), o agente durável é Beta e refaz chamadas (`docs-harness-durable-agents.md:9,287`), e o deploy tem 10 min (`.github/workflows/publish.yml:156`) | cortada (`HUB_UPDATED`) | `docs-harness-durable-agents.md:279-297` | retoma do último passo | nativo: o corte de hoje (`HUB_UPDATED`) fica | — | não precisa | — |
| O Telegram na troca | U1 | cartão da 24.7: registro e canal em memória, "Gatilho: a etapa 16" | réplicas do Tunnel; o canal acha a espera guardada (`agent-channels.ts:731-810`, cartão da 24.7) | o webhook cai num Hub vivo, que carregou o registro ao subir | nativo | o roteiro, passo 3 | não precisa | — |
| O app publicado na troca | U1 | a checagem de sessão chega ao Hub pelo Tunnel (0041, porta 8081) | réplicas do Tunnel | idem | nativo | o roteiro, passo 3 | não precisa | — |
| As migrações | fica de fora | só acrescentam (data D6), antes do Hub (D9), com o velho no ar | pgroll e strong_migrations (expandir e só depois contrair) | o velho roda sobre o esquema novo | nativo, como hoje | — | não precisa | — |
| O rastro (21.1) | fica de fora | cartão da 21.1, critério 16 (flush no desligamento) | — | o velho manda o que tem ao sair | nativo | — | não precisa | — |

**A medida do transplante.** Nada vem do produto antigo: ele também parava e subia. Dos dez consertos
de execução da auditoria (`conexus-hub-carry-audit`, seção 3.13), um entra (o Projeto ocupado, U2), um
vira a decisão `A` (a resposta da pessoa durável), e os outros oito eram de arquivos que não existem no
`main` (`builder/run/`, `service.ts`, `preview-state.ts`, `runtime.ts`).

**A dívida.**

- As filas por fornecedor das contas de modelo (0058) e os limites dos conectores
  (`hub/connectors/limits.ts`) são por processo: durante a sobreposição (até 3 min), o teto vale para
  cada Hub. Gatilho: um 429 do fornecedor na troca.
- O registro dos agentes publicados (`builder/agents/registry.ts`) e o do Telegram são por processo:
  publicar um agente no Hub novo durante a sobreposição não chega ao velho, que já não recebe pedidos.
  Gatilho: dois servidores.
- O Mastra Code marca o `UnixSocketPubSub` como opção experimental (`mastracode/sdk/src/index.ts:697-705`).
  Gatilho: uma versão do Mastra que mude o socket ou a posse; o critério 8 a pega.

## U1 Dois Conexus na troca

**Base e modelo.** `main` do dia, a partir de `44fb4040`. Opus: a ordem da troca e o primeiro deploy
sobre o serviço antigo são concorrência entre processos.

### As linhas da tabela

- **O Hub novo sobe ao lado do velho.** Ler `infra/deploy.sh` inteiro (a fase `phase`, `bounded`,
  `running_id`, `migrate_if_labeled`, `reseal_if_labeled`, o caminho `--restart` e a volta). A ordem da
  troca segue a do Mastra (`reference-configuration.md:995-997`): o novo recebe primeiro, o velho
  drena depois, e o prazo do velho (`SHUTDOWN_GRACE_MS`, `platform/lifecycle.ts:46`) fica abaixo do
  `stop_grace_period`.
- **Uma entrada para os dois.** Um `cloudflared` por cor, com o mesmo `tunnel_token`. Cada cor numa
  rede própria do Compose (`conexus-blue`, `conexus-green`), onde o Hub tem `aliases: [hub]`: o
  `http://hub:8080` e o `:8081` do Tunnel resolvem para o Hub da mesma cor. O `cloudflared` da cor
  roda com `--grace-period 210s` e `stop_grace_period: 215s`.
- **O espaço de PIDs comum.** `pid-anchor`: imagem pequena fixada por digest (por exemplo `busybox`),
  `init: true`, `command: ["sleep", "infinity"]`, `restart: unless-stopped`, sem volume nem segredo.
  Os quatro serviços das cores com `pid: "service:pid-anchor"`. O deploy nunca para o `pid-anchor`.
- **A sobreposição só com o mesmo Mastra.** `infra/hub.Dockerfile:32` ganha
  `LABEL conexus.mastra-core=<versão>`, escrita no build a partir de `apps/server/package.json`
  (`@mastra/core`). O `deploy.sh` lê o rótulo das duas imagens com `image_label`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `infra/compose.yaml` | Muda: apaga `hub` e `cloudflared`; cria `pid-anchor`, `hub-blue`, `hub-green`, `cloudflared-blue`, `cloudflared-green`, as redes e o volume `hub_signals` (o `migrate` fica) | `infra/deploy.sh`, `scripts/deploy-compose.test.ts` |
| `infra/deploy.sh` | Muda: a cor viva, a troca, a volta sem queda, o primeiro deploy | `publish.yml`, `restart.yml`, `rollback.yml` (sem mudar o passo) |
| `infra/hub.Dockerfile` | Muda: o rótulo | `publish.yml` (job `image`) |
| `scripts/deploy-harness.ts`, `deploy.test.ts`, `deploy-compose.test.ts`, `deploy-phases.test.ts` | Muda | CI |
| `apps/server/src/platform/migrate.ts` | Muda (#275) | `main.ts` |
| `docs/how-to/hub-server.md`, `docs/architecture.md` seção 7, `docs/decisions/0063-two-hubs-during-an-update.md` | Cria e muda | — |

### Os contratos que a unidade cria

- Serviços: `hub-<cor>` e `cloudflared-<cor>`, `cor ∈ { blue, green }`; o resto do `hub` de hoje
  (segredos, `env_file`, `environment`, `tmpfs`, `healthcheck`, o volume `hub_git`) igual nos dois.
  Novo no Hub: `HUB_SIGNALS_SOCKET: /run/conexus-signals/mastra.sock` e o volume
  `hub_signals:/run/conexus-signals`.
- `deploy.sh`: as mesmas entradas (`<imagem por digest> [<template>]` e `--restart [<template>]`) e
  as mesmas saídas (0 vivo, 1 vermelho). Mensagens novas, em inglês como as de hoje:
  `deploy: starting the <cor> pair from <imagem> with <template> (up to 90 s to be healthy)`,
  `deploy: stopping the <cor> pair (up to 215 s)`, `Mastra changes: no overlap`.
- `migrate`: código de saída 75 (`MIGRATE_RETRY_EXIT`) também numa falha ao conectar com `57P01`,
  `57P03`, `08006` ou `ECONNRESET`/`ECONNREFUSED`.
- Decisão 0063, "Two Hubs during an update", emenda a 0007 (um servidor, Compose, Tunnel): o
  contexto (a janela medida), a decisão, o Criterion (critérios 1 a 6 e o roteiro, passo 3) e o
  "Reabre quando" (dois servidores; o Mastra muda o `UnixSocketPubSub`).

### As skills e a leitura

`docs/reference/stack.md` não tem linha do Docker Compose nem do `cloudflared`: a unidade as cria
(Read first: `docs.docker.com/reference/compose-file/services/` para `pid` e `networks.aliases`; a
página de parâmetros do `cloudflared`). Depois, `infra/deploy.sh` e `scripts/deploy-harness.ts`.

### A ordem do trabalho

1. `scripts/deploy-harness.ts`: o Docker de mentira passa a conhecer serviços por nome e cor, e grava
   a ordem de `up` e `stop`. Os testes de hoje continuam passando com os nomes novos antes de qualquer
   comportamento novo.
2. `infra/compose.yaml`: as cores, como no contrato. Regras: C62 (o prazo), S42 (o log).
3. `infra/deploy.sh`: `live_color` (`ps --quiet hub-blue`, `hub-green`, e o `hub` antigo para o
   primeiro deploy); a troca: `up --detach --wait --wait-timeout 90 --no-deps hub-<nova>
   cloudflared-<nova>`; depois `stop --timeout 215 cloudflared-<velha> hub-<velha>`; a volta: `stop`
   do par novo. Antes da troca, se o rótulo difere, o caminho de hoje (parar o par velho, então subir).
   O primeiro deploy: o "par velho" é `hub` e `cloudflared`, parados por `docker compose stop` e
   apagados por `up --remove-orphans` no deploy seguinte. Regras: as fases dizem o que começam
   (`deploy-phases.test.ts`).
4. `infra/hub.Dockerfile`: o rótulo, com a versão lida no build (`ARG` preenchido pelo job `image`
   de `publish.yml`, ou lida do `package.json` dentro do build).
5. `apps/server/src/platform/migrate.ts`: o #275.
6. A decisão 0063, o how-to e a seção 7 da arquitetura ("Publish" e "Roll back").

### Como se prova

Os critérios 1 a 7 pelos testes de `scripts/`, que rodam o `deploy.sh` de verdade sobre o Docker de
mentira (`deploy-harness.ts`). O roteiro, passos 1 a 3, na primeira publicação da U1: o firstmate lê
no log do job a ordem das fases e confere, num navegador, que a conversa não mostrou a frase de
atualização. Comando local: `npm test -w scripts` só dos arquivos tocados.

### Parar se

- O `docker compose` do servidor não aceita `pid: service:`: parar e relatar a versão.
- Algum segredo de Docker não monta em dois serviços ao mesmo tempo: parar.
- O Tunnel precisa de mudança no painel da Cloudflare para dois conectores: parar; é fornecimento do
  fundador.

## U2 A conversa entre os dois

**Base e modelo.** `main` com a U1. Opus: posse entre processos e a ordem do fim do Hub.

### As linhas da tabela

- **A conversa entre dois processos.** `createMastra` (`builder/mastra/mastra.ts:13-33`) ganha
  `pubsub?: PubSub`; `new Mastra({ …, pubsub })`. Os agentes dos controladores herdam o PubSub do
  `Mastra` (`Agent.getPubSub`, `dist/agent-BP9OWM6D.js:79731-79733`). O PubSub é
  `new UnixSocketPubSub(config.signalsSocket)` (`@mastra/core/events`) quando a variável existe.
- **O Projeto ocupado.** `Runs.take` (`builder/runs/runs.ts:100-127`) pede antes
  `pubsub.acquireLease('project:<projectId>', <runId>, 15_000)` (o `EventEmitterPubSub` padrão também
  é `LeaseProvider` num processo, `docs-signals-running-across-processes.md:27`); renova a cada 5 s
  enquanto o `Driven` vive; `releaseLease` quando o `#writing` solta. Recusado: o `RUN_BUSY` de hoje,
  com o dono lido da posse (`runId` → `personId` pelo mapa local ou, de outro Hub, pela posse que
  guarda `<personId>:<runId>` como dono).
- **O fim do Hub.** Em `hub-mastra.ts` `close()` (`:119-126`), depois de `mastra.shutdown()`, o
  `close()` do PubSub (que solta as posses, `reference-pubsub-unix-socket-pubsub.md:48`).
- **O #339.** Antes de `mastra.shutdown()`, esperar o `persistMessages` da memória das rodadas
  paradas (`part.memory.settled()` hoje não cobre o salvamento que roda depois de `agent_end`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/config.ts` (e `config-*.ts` do lugar certo) | Muda: `signalsSocket?: string` de `HUB_SIGNALS_SOCKET` | `main.ts`, `builder/mastra/` |
| `apps/server/src/builder/mastra/mastra.ts`, `hub-mastra.ts` | Muda | `builder/conversation/conversations-of.ts`, `main.ts` |
| `apps/server/src/builder/runs/runs.ts`, `project-lease.ts` (novo) | Muda e cria | `builder/conversation/` |
| `apps/server/src/builder/conversation/test-conversation.ts` | Muda: `hubBeside` aceita o socket | testes |
| `docs/reference/boundaries.md` | Muda: "Mastra 1.82.0: UnixSocketPubSub leases check the owner's pid" | — |

### Os contratos que a unidade cria

```ts
// apps/server/src/builder/runs/project-lease.ts
export type ProjectLease = {
  take(input: { projectId: ProjectId; runId: RunId; personId: PersonId }): Promise<
    { ok: true; release: () => Promise<void> } | { ok: false; holder: PersonId | undefined }
  >
}
export function projectLeaseOf(pubsub: PubSub & LeaseProvider, log: FailureLog): ProjectLease
```

O dono gravado na posse é `` `${personId}:${runId}` ``, lido por um esquema Zod na leitura (C27). Nenhuma
tabela nova. O modelo é `Runs.take` de hoje (cumpre C21 com `Driven`; C23 com `ProjectId` e `RunId`).

### As skills e a leitura

`mastra` (linha `@mastra/core` de `stack.md`): `dist/docs/references/docs-signals-running-across-processes.md`,
`reference-pubsub-unix-socket-pubsub.md`, `reference-pubsub-lease-provider.md`. Depois
`builder/runs/runs.ts` e `builder/conversation/drain.test.ts`.

### A ordem do trabalho

1. O teste de dois Hubs primeiro (`two-hubs.test.ts`, critério 8), com `hubBeside` e um socket numa
   pasta temporária do teste: falha hoje (duas rodadas).
2. `config.ts` e `createMastra`. Regras: C50, C62.
3. `project-lease.ts` e `Runs.take`; `runs.test.ts` passa intacto.
4. O fim do Hub: `close()` do PubSub; o #339.
5. A entrada de `boundaries.md`.

### Como se prova

Critérios 8 a 15 pelos testes nomeados, todos pela porta pública (os dois Hubs pelas rotas, T5).
Num processo de teste, os dois Hubs têm o mesmo PID: a posse funciona porque o dono (`owner`) é
diferente; o caso de PIDs diferentes já foi provado no estudo e fica com a U1.

### Parar se

- Com o PubSub no `Mastra`, o controlador do Builder não coordena (critério 8 falha): o PubSub vai no
  `AgentController` (`pubsub`, `reference-agent-controller-agent-controller-class.md:159`); se nem
  assim, parar e relatar.
- O `UnixSocketPubSub` deixa um arquivo que impede o Hub de subir depois de um `kill -9`: parar.

## U3 O cartão volta (`A1`)

**Base e modelo.** `main` com a U2 e a 24.5 fechada. Sonnet: segue o caminho da 24.5.

### As linhas da tabela

- **O cartão aberto depois da troca.** Ler `guard.ts:197-260` (`toolAnswer`), o critério 8 da 24.5 e
  o critério 47. O Mastra: `session.hasPersistedToolApproval(toolCallId)` e
  `session.respondToPersistedToolApproval({ toolCallId, approved, requestContext })`
  (`agent-controller-BDds1y5w.js:5225-5272`); `session.respondToToolSuspension({ address, resumeData,
  requestContext })` (`:6043-6050`, o endereço reconstrói a suspensão em `:5959-5990`); a lista,
  `agent.listSuspendedRuns({ threadId, resourceId })` (`reference-agents-listSuspendedRuns.md`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/conversation/guard.ts`, `waits.ts` (novo) | Muda e cria | `routes.ts` |
| `apps/server/src/builder/agents/approval.test.ts`, `conversation-update.test.ts` | Muda | — |
| `packages/hub-api/src/conversations.ts` | Muda: `RestoredWait` | `apps/web` |
| `apps/web/src/builder/conversation/` (`use-session.ts`, `approval-card.tsx`, o cartão de pergunta e o de plano) | Muda | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/conversations.ts
export const RestoredWait = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('APPROVAL'), runId: RunIdSchema, toolCallId: ToolCallId, toolName: z.string(), args: z.unknown() }),
  z.object({ kind: z.literal('QUESTION'), runId: RunIdSchema, toolCallId: ToolCallId, args: z.unknown() }),
  z.object({ kind: z.literal('PLAN'), runId: RunIdSchema, toolCallId: ToolCallId, args: z.unknown() }),
])
```

O guarda acrescenta `restoredWaits: RestoredWait[]` ao estado da sessão (`GET ${SESSION}`) só quando o
portão vivo não tem a espera; a tela os desenha com os cartões de hoje. A resposta a uma espera
guardada passa pelas mesmas conferências de `toolAnswer` (`refuseApprover`, `writeOf`, o registro
`CONNECTOR_WRITE_APPROVED`), troca `session.approval.isArmed` por "armada ou guardada" e chama a função
guardada do Mastra. A tela manda o `runId` da espera guardada no corpo de `tool-suspension`, e o
guarda monta o endereço com o `threadId` e o `resourceId` da sessão, nunca do corpo (S39).

### As skills e a leitura

`mastra`; `shadcn` para os cartões que já existem. Ler primeiro o caminho de hoje da 24.5.

### A ordem do trabalho

1. Os critérios 16 e 18 reescritos, falhando.
2. `waits.ts`: lista as esperas por `listSuspendedRuns`, só as da conversa da sessão.
3. O guarda: o estado e a resposta guardada. Regras: S39, C37.
4. A tela: os cartões do estado.

### Como se prova

Critérios 16 a 19. O 16 usa o dublê do Sankhya da 24.5 e conta pedidos.

### Parar se

- A resposta guardada roda a escrita sem passar pelo `requireApproval` da versão: parar.
- O plano aprovado depois da troca não muda o modo (`transitionsTo`): parar e relatar.

## U4 O fluxo continua (`B1`)

**Base e modelo.** `main` com a U2 e a 24.6 fechada. Sonnet.

### As linhas da tabela

- **O fluxo cortado.** O `restart()` da 24.6 (critério 18 dela) e a sua chave `workflow_run.attempt`.
  O Mastra: `run.restart()` recusa com `WORKFLOW_RESTART_RUN_OWNED` e `details.leaseExpiresAt`
  (`dist/mastra-D4MXu5BN.js:2905-2925`). Não usar `mastra.restartAllActiveWorkflowRuns()`, que também
  reinicia as execuções que esperam uma resposta (`:2886-2896`, "RUNNING/WAITING"): os workflows da
  24.6 declaram `autoRestartActiveRuns: false` (`reference-workflows-workflow.md:128`), e o Hub refaz
  só as `running` da sua tabela.
- **O velho espera os balões.** `hub-mastra.ts` `settle` passa a esperar também as execuções em voo
  deste processo, com o mesmo `bound`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/workflows/after-update.ts` (novo), `runs.ts` | Cria e muda | `hub-mastra.ts` (`afterWorkers`) |
| `apps/server/src/builder/automations/runs.ts` | Muda | — |
| `apps/server/src/builder/mastra/hub-mastra.ts` | Muda (`settle`) | `main.ts` |

### Os contratos que a unidade cria

Nenhuma rota. Um código de log, `WORKFLOW_RESUMED_AFTER_UPDATE`, com execução e tentativa. A passagem
roda depois de o Hub ouvir, como as de `main.ts:233-247`.

### A ordem do trabalho

1. Os critérios 21 e 22 falhando.
2. `after-update.ts`: as `running` da tabela; para cada uma, o `UPDATE … attempt` da 24.6 e o
   `restart()`; num `WORKFLOW_RESTART_RUN_OWNED`, tentar de novo em `leaseExpiresAt`.
3. O `settle`.

### Como se prova

Critérios 20 a 23, com dois Hubs (`hubBeside`) e o relógio do teste.

### Parar se

- A 24.6 mudou a forma de `workflow_run` ou do **Tentar de novo**: reabrir esta seção antes.
