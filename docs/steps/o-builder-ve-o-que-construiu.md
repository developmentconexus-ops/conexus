# O Builder vê o que construiu

Trilho: assistente

Trilha Agentes e Apps, marco `A1` do [roteiro](../roadmap.md): "Menos apps 'prontos' que não
funcionam. Um teste planta um defeito visível e o Builder o corrige sem ninguém avisar. A
conferência falha quando uma tela não está ligada. O estudo curto que compara máquina e Worker de
verdade está feito antes". A marca `Trilho: assistente` é a que a verificação `second-card` lê para
esta trilha (`scripts/cli.ts:13-21`), como na fundação do front-end. Este cartão espera a fundação
fechar (delivery L5); as palavras do fundador que ele já leva estão no
[arquivo de aprovação](../approvals/o-builder-ve-o-que-construiu.md).

Lido em `main` `044e16c3` (depois dos pull requests 1195, 1199 e 1202), com `@mastra/core` 1.83.0,
`@mastra/e2b` 0.17.0, `e2b` 2.63.0 e o CLI `agent-browser` 0.43.0 lido pelo `npm pack`. Os cinco
estudos e provas do A1 ficam fora do repositório (delivery L21): o estudo curto máquina contra
Worker, o estudo do navegador, o de segurança, as quatro provas na E2B e a implementação provada na
E2B. A tabela de referência vem do último, linha por linha; as linhas que ele riscou (o
`AgentBrowser` no Hub, o proxy WebSocket, `maskRequestHost`) não entram. Cada linha de `main`
citada aqui foi relida em `044e16c3`.

## A página do fundador

**No fim desta etapa** o Builder confere o app que acabou de construir antes de dizer que terminou.
Ele sobe a versão de verdade na Cloudflare, sobre um banco de teste vazio, abre a tela num navegador
dentro da máquina da conversa e olha o que apareceu: a imagem da tela, os erros da página e os
pedidos que falharam. Se a tela chama uma operação que não existe, ou a página dá erro, a
conferência reprova, e o Builder recebe o que viu e corrige sozinho, na mesma conversa. Só a versão
que passou vai para a Prévia, como hoje.

**O roteiro de uso.**

1. No Hub da nuvem, num Projeto de teste, peça ao Builder: "Faça um app de encomendas com uma
   lista e um botão Nova". Enquanto ele trabalha, a conversa mostra o trabalho como hoje.
2. Abra a Prévia quando o Builder disser que terminou. A lista aparece, vazia, sem "Erro ao
   carregar", e **Nova** abre o formulário.
3. Peça: "Mude a lista para mostrar também o telefone do cliente". Se a primeira tentativa dele
   chamar uma operação que não existe, você vê na conversa mais uma volta de trabalho, sem ninguém
   ter avisado. A Prévia só muda quando a tela estiver ligada.
4. Abra **Dados** do Projeto. As encomendas que você criou na Prévia estão lá. O que o Builder
   gravou ao conferir não está: a conferência grava no banco de teste.
5. Abra a página do pull request do último grupo e veja o teste que planta um defeito visível e o
   Builder de verdade o corrigindo, com a imagem da tela antes e depois.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página e responde às duas
decisões abaixo. No fim: faz o roteiro, diz o que viu. Nenhum texto de tela muda.

**Fica de fora.**

- O Builder clicar e digitar na tela por conta própria. Nesta etapa quem abre o navegador é a
  conferência, por código, para que ela nunca dependa de o modelo lembrar de olhar. O Builder
  recebe o que ela viu. Navegar sozinho vem quando um marco pedir, com a mesma peça.
- Abrir cada tela do app. A conferência abre a tela de entrada. As outras telas ficam para o
  marco que trouxer o plano conferido (`A3`).
- A rede da máquina continua saindo para o DNS do Google (`8.8.8.8`), como hoje por causa do npm.
  A E2B abre esse endereço sempre que a lista tem um domínio. Fechar exige pôr o endereço do npm
  num arquivo da máquina, e o npm muda de endereço. Isso existe hoje sem o A1 e vai para uma issue.
- Os itens abertos com o rótulo `next-card`. Nenhum tem o gatilho num arquivo que esta etapa
  muda. O 1164 (o turno recusado quando outra conversa salvou) é da sincronização da máquina, que
  esta etapa não toca.

**As decisões suas nesta etapa.**

- **A. Como o navegador da conferência entra no app.** O app exige login. O navegador da máquina
  não tem a sua sessão do Hub, e não deve ter: o código do app roda na mesma máquina.

  - (a) O Hub cria uma sessão só da conferência: um app, o ambiente de conferência (o banco de
    teste), em seu nome, que acaba no fim da conferência e vence em 10 minutos de qualquer jeito.
    Exemplo: o Builder confere às 14h02; às 14h03 a sessão já não existe, e às 14h12 ela não
    abriria nada mesmo que sobrasse.
  - (b) A sessão da conferência fica pendurada na sua sessão do Hub, como a Prévia. Ela morre se você
    sai do Hub com a conversa ainda trabalhando, e o Hub teria de guardar qual sessão do Hub começou
    cada turno.

  **Recomendo (a).** Veredito: embrulhado. A sessão de app já é nossa (`apps.app_session`); a de
  conferência é uma tabela irmã, sem a sessão do Hub e com prazo. É o que fecha mais, porque só
  alcança o banco de teste.
- **B. Em quem a conferência confia.** O navegador roda na máquina, ao lado do código do app. Um
  código feito para isso poderia mexer no navegador e fazer a conferência passar.

  - (a) Aceitar. O pior caso é uma versão quebrada chegar à Prévia, que é o que acontece hoje
    sempre. Nenhum dado fica em risco: o banco é o de teste e a sessão vence em minutos.
  - (b) O despachante da Cloudflare também conta, do lado dele, os pedidos da sessão de conferência
    que falharam, e o juiz cruza as duas listas. São umas 200 linhas a mais no despachante e no Hub.

  **Recomendo (a).** Veredito: nativo. A forma nativa é a do estudo de segurança: a máquina é o
  lugar feito para código não confiável. O relatório de segurança pôs (b) como condição. Esta
  página pergunta se você a mantém.

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 | U1 | O navegador na máquina: o CLI `agent-browser` no template, o invólucro que aponta o Chromium da conferência, e `Machines.confer`, que abre a rede para um host, abre a tela, captura e devolve o que a página disse, e fecha a rede; a emenda da decisão 0051 | `infra/e2b/`, `apps/server/src/builder/machine/`, `package.json`, `package-lock.json`, `docs/decisions/0051-builder-machine-git-and-copy-in-r2.md`, `docs/reference/stack.md` | security | — |
| G2 | U2 | O ambiente de conferência no Hub: a versão num Worker de conferência por Projeto, o esquema de teste vazio a cada conferência, a sessão de conferência, a chamada do app nesse ambiente, e a remoção junto com o Projeto | `packages/hub-api/src/`, `apps/server/src/hub/apps/`, `apps/server/src/hub/projects/`, `apps/server/src/platform/company-postgres.ts`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `apps/server/src/main.ts` | data | U1 |
| G2 | U3 | O juiz: `Runs.check` faz a conferência da máquina e, se ela passou, a conferência no navegador; a falha volta ao modelo com o que a tela mostrou; o teste do defeito plantado com o modelo de verdade | `apps/server/src/builder/runs/`, `apps/server/src/builder/conversation/`, `tests/apps/` | testing | U2 |
| G3 | U4 | O fechamento: a linha de uso, a issue do DNS, o cartão apagado | `docs/steps/`, `docs/approvals/`, `docs/architecture.md` | delivery | o uso |

G1 vem sozinho e primeiro: o template novo precisa estar publicado na E2B (a tag que
`HUB_MACHINE_TEMPLATE` lê) antes que G2 rode a conferência na nuvem. G2 junta U2 e U3 porque o
contrato da conferência (`BuilderConfer`) entra com o seu primeiro chamador (o modelo do cartão). G3
é o pull request de fechamento, só de documentos, depois do uso (delivery L17, L19). Nenhuma unidade
corre em paralelo: U2 e U3 dividem `main.ts` e o contrato, e U3 chama `Machines.confer` de U1.

**Orçamento de código alterado.** U1: 300 (o template 20, `confer` e o seu relatório 220, a
emenda e a linha de `stack.md` à parte). U2: 650 (o contrato 60, a migração e as permissões 80, o
esquema de teste 120, a conferência no Hub 250, a chamada e a remoção 140). U3: 250. U4: só
documento. Total da etapa: cerca de 1.200 linhas, dentro das 4.000 de delivery L2. Os testes não
contam.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Numa máquina do template novo, `agent-browser --version` imprime a versão do `package.json` da raiz, e `agent-browser open about:blank` abre o Chromium da conferência (o `chrome-headless-shell` de `/opt/conexus/browsers`) sem baixar outro | o ponto de conferência de G1, numa máquina E2B do template novo; a saída no pull request | must |
| 2 | U1 | `confer` abre a rede da máquina para o host pedido e para o npm, e só para eles, durante a conferência: de dentro, `curl https://<host>` responde e `curl https://example.org` falha. No fim, sucesso ou falha, a rede volta a só o npm: `curl https://<host>` falha | `apps/server/src/builder/machine/machine-confer.test.ts`, a ordem das chamadas ao `Kit` do dublê (abrir, comandos, fechar no `finally`, também com um comando que lança); o ponto de conferência de G1 com os dois `curl` numa máquina E2B | must |
| 3 | U1 | Uma tela que desenha e chama `POST /api/listarEncomendas` com 404 dá `DIRTY` com um `REQUEST_FAILED` (`POST`, `/api/listarEncomendas`, 404) e um `CONSOLE_ERROR`; uma tela que só desenha dá `CLEAN`. Nos dois a captura fica em `node_modules/.conexus/tela.png` da pasta do app | `machine-confer.test.ts`, o CLI de verdade (`agent-browser` do `node_modules`) contra uma página servida no teste, com o Chromium do Playwright, por um `TimedExec` local, como `check.test.ts` roda a conferência | must |
| 4 | U1 | Um erro de JavaScript na página dá `PAGE_ERROR` com a mensagem; um pedido a outro host (bloqueado pela rede) não conta como falha da tela | `machine-confer.test.ts`, os mesmos dois casos | must |
| 5 | U1 | Um comando do navegador que não roda (saída diferente de zero, saída que não é o JSON do CLI, ou o prazo) é `CONFER_PLATFORM_FAILED`, nunca `CLEAN` nem `DIRTY`, e a rede fecha | `machine-confer.test.ts`, o dublê com saída 1 e com texto solto | must |
| 6 | U1 | No fim da conferência o navegador está fechado: `agent-browser close` roda no `finally`, e a conferência seguinte abre um Chromium novo, sem a sessão da anterior | `machine-confer.test.ts`, a lista de comandos; `agent-browser cookies` vazio depois de `close`, no CLI de verdade | must |
| 7 | U1 | O token da sessão de conferência não aparece em nenhum comando nem no log: entra num arquivo que o Hub escreve pelo `Transport`, lido por `cookies set --curl` e apagado no `finally` | `machine-confer.test.ts`, que procura o token nos argumentos de cada `executeCommand` do dublê e nas linhas do log | must |
| 8 | U1 | A decisão 0051 diz a regra nova: durante a conferência a máquina alcança também o host exato do app do seu Projeto, nunca `*.` do domínio dos apps, e só até o fim dela; e diz que a E2B abre `8.8.8.8` sempre que a lista tem um domínio | `npm run docs`; leitura do diff | must |
| 9 | U2 | `openConference` sobe a versão como o Worker `c-<projectId>` do namespace, com as marcas da empresa e do Projeto e o limite de CPU de `uploadVersion`; uma versão que não inicia (10021) volta `NOT_STARTING` e não toca o banco | `apps/server/src/hub/apps/conference.test.ts`, o dublê da Cloudflare de `send-guards.test.ts`; um caso com `NOT_STARTING` que confere que o Neon não foi chamado | must |
| 10 | U2 | Cada conferência começa com o esquema `app_<projectId>_check` vazio: o que a conferência anterior gravou some, e as migrações da versão rodam pela mesma regra de `migrateApp`. Uma migração recusada volta `MIGRATION_REFUSED` com a causa, e o esquema do app (o da Prévia) não muda | `conference.test.ts` no Postgres real (`test-database.ts`): uma conferência grava uma linha pelo login de conferência, a seguinte não a vê; uma migração com `DROP TABLE` volta recusada e `app_<projectId>` fica igual | must |
| 11 | U2 | Uma chamada ao app com a sessão de conferência chega ao Worker `c-<projectId>` com o login `app_<projectId>_check_run`; a mesma pessoa na Prévia continua no Worker da versão da Prévia e no login do app | `apps/server/src/hub/apps/app-handoff.test.ts`, pela porta `checkCall` (`createAppDoor`), um caso de cada ambiente | must |
| 12 | U2 | A sessão de conferência recusa: depois de `endConference`, depois de 10 minutos, em outro host, e para uma pessoa tirada da empresa. Cada recusa é `APP_SESSION_INVALID`, como uma sessão de app vencida | `app-handoff.test.ts`, um caso por recusa, o relógio pelo `statement_timestamp()` do Postgres | must |
| 13 | U2 | Apagar o Projeto remove o Worker `c-<projectId>` e o esquema e os logins de conferência, também quando o Projeto nunca mandou versão à Prévia | `apps/server/src/hub/projects/projects-delete.test.ts`, caso novo com um Projeto que só conferiu, pela rota de apagar o Projeto | must |
| 14 | U2 | A migração nova passa em `npm run migrations` e no retrato do catálogo; `apps.check_session` só é lida e escrita pelo login da instalação, como `apps.app_session` | `npm run migrations -- --base origin/main`; `apps/server/src/platform/catalog.test.ts` (o retrato do catálogo contra `database-grants.sql`) | must |
| 15 | U3 | Um turno cuja tela chama uma operação que não existe recebe, no fim, nota 0 com o relatório da conferência no navegador: os pedidos que falharam, os erros e o caminho da captura. O modelo lê a captura com `mastra_workspace_read_file` e recebe a imagem | `apps/server/src/builder/conversation/conversation-check.test.ts`, caso novo, com a máquina e o Hub em dublê e o modelo de teste; a imagem pelo `read_file` com o `SandboxFilesystem` sobre o dublê | must |
| 16 | U3 | Uma conferência da máquina que falha não chega ao navegador: nenhum `confer` roda. Uma conferência no navegador que não pôde rodar (`CONFER_PLATFORM_FAILED`, ou o Hub fora) encerra o turno como `unchecked`, sem gastar volta, como a máquina que não conferiu | `conversation-check.test.ts`, dois casos | must |
| 17 | U3 | `conexus_check` e o fim do turno dão o mesmo relatório, pelo mesmo `Runs.check` | `conversation-check.test.ts`, o caso que já compara os dois, estendido | must |
| 18 | U3 | O teste do defeito plantado: a partir do app de teste `tests/apps/encomendas-defeito` (a tela chama `listarEncomendas`, que não existe), o Builder de verdade, com o pedido "Confira e entregue o app", termina com a conferência `passed` sem que a conversa diga qual é o defeito, em até `CHECK_LIMITS.checks` voltas, com a versão salva | `apps/server/src/builder/conversation/builder.eval.test.ts`, caso novo; roda no ponto de conferência de G2, na nuvem, com a conta de modelo de teste | must |
| 19 | U3 | Os dois apps de teste da trilha (o CRM e o acompanhamento de vendedor) construídos uma vez com Claude dentro do Builder, com a conferência ligada; o número de voltas e o que cada conferência reprovou vão para o relatório | o ponto de conferência de G2 (a medida da página da trilha) | should |
| 20 | U3 | O tempo de uma conferência no navegador, do servidor de produção, e o tempo de cada parte (subir, banco, abrir, ler), medidos em cinco turnos, vão para o relatório | o ponto de conferência de G2 | should |

## A matriz de estados

A etapa não muda nem cria tela. O que a pessoa vê na conversa é a volta a mais de trabalho, que já
existe (a linha do turno com `rounds`), e o fim do turno com os estados de `VersionCheck` de hoje
(`packages/hub-api/src/conexus-parts.ts:25-30`).

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A conversa do Builder | sem mudança | sem mudança | sem mudança: a conferência é parte do trabalho do turno | sem mudança: `failed` e `unchecked` como hoje | sem mudança | sem mudança | sem mudança |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Conference` (`OPENED`, `NOT_STARTING`, `MIGRATION_REFUSED`) | `openConference` (U2) | `Runs.check` (U3) |
| `Conference.url`, `Conference.session` | `openConference` | `Machines.confer` (U1): o host vai para a rede, a sessão para o arquivo de cookie |
| `BrowserReport` (`CLEAN`, `DIRTY`) e `BrowserProblem` | `Machines.confer` (U1) | `Runs.check`, e o modelo pelo texto do juiz (U3) |
| `apps.check_session.expires_at` | `openConference` | `admitCall` (U2) |
| `AppCall.version.worker` com `c-<projectId>` | `callTo` no ambiente `check` (U2) | o despachante, sem mudança (`apps/edge/src/dispatch.ts:146-160`) |
| `AppCall.database.login` com `app_<projectId>_check_run` | `callTo` no ambiente `check` | o `Db` do despachante, que deriva a senha pelo nome (`packages/hub-api/src/app-login.ts:30-40`) |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `cloudflare.upload` do Worker `c-<projectId>` | não acontece: o turno que confere segura o Projeto (`Runs.#writing`, `runs/runs.ts:296-297`), um por Projeto | 10021: `NOT_STARTING`, o banco não é tocado, o modelo lê "o app não inicia" | `CONFER_PLATFORM_FAILED`: o turno termina `unchecked`, sem gastar volta | `APP_CONFERENCE_UPLOADED` com ids; a falha com o código da Cloudflare, sem corpo | 9, 16 |
| O esquema de teste refeito (`DROP SCHEMA ... CASCADE`, `ensureApp` de conferência, `migrate`) | o mesmo: o Projeto está seguro pelo turno | cada ato é uma transação (`company-postgres.ts:250-260`); um corte deixa o esquema meio feito, e a próxima conferência começa pelo `DROP` | Neon fora: `CONFER_PLATFORM_FAILED` | `APP_CONFERENCE_DATABASE_READY`, ou `APP_MIGRATION_REFUSED` com a regra, sem valor (C52) | 10, 16 |
| `insert` e `delete` em `apps.check_session` | duas conferências do mesmo Projeto não correm juntas (acima); duas sessões de Projetos diferentes não se tocam | um `delete` que falha deixa a linha, e o `expires_at` a recusa em 10 minutos | o banco do Hub fora: `CONFER_PLATFORM_FAILED` antes do navegador | nada além do registro da rota de hoje | 12 |
| `updateNetwork` de abrir e de fechar (`e2b`) | uma conferência por máquina: o juiz roda uma vez por volta | abrir que falha: `CONFER_PLATFORM_FAILED`, nada aberto; fechar que falha: `MACHINE_NETWORK_CLOSE_FAILED` no log, e a próxima partida da máquina fecha de novo (`machines.ts:194-197`) | E2B fora: o mesmo | `MACHINE_NETWORK_CLOSE_FAILED` com a conversa | 2 |
| Os comandos `agent-browser` (`cookies set`, `open`, `wait`, `screenshot`, `console`, `errors`, `network requests`, `close`) | o mesmo | um comando que não roda é `CONFER_PLATFORM_FAILED`; `close` e a remoção do arquivo de cookie rodam no `finally` | a máquina morta: `CONFER_PLATFORM_FAILED` | os tipos e as contagens de problemas, nunca as mensagens (a mensagem pode trazer o que o app escreveu) | 3 a 7 |
| `mastra_workspace_read_file` da captura, pelo modelo | não se aplica: leitura | não se aplica | a máquina morta: o erro da ferramenta, como hoje | o que a ferramenta já registra | 15 |

## A tabela de referência

| Peça | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Unidade | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Navegador do Builder dentro da máquina | nenhum: o passo `navegador` serve só os arquivos (`packages/app/src/check/browser.ts:32-45`) | `agent-browser` 0.43.0, `skill-data/vercel-sandbox/SKILL.md`; `@agent-browser/sandbox` 0.43.0 `dist/vercel.js:43-58`; E2B `use-cases/remote-browser.md:220` | o CLI instalado na imagem da máquina, uma ação por comando, a captura num arquivo | nativo | — | U1 | nenhum: muda `infra/e2b/template.ts` (`TOOLS`, o invólucro, um `runCmd`) |
| O Chromium do navegador | o `chrome-headless-shell` da conferência (`infra/e2b/template.ts:90`) | `agent-browser` 0.43.0 `commands.md:559` (`--executable-path`); a variável `AGENT_BROWSER_EXECUTABLE_PATH` | o CLI dirige um Chromium que ele acha ou que se aponta | embrulhado: o invólucro `/usr/local/bin/agent-browser`, porque `setEnvs` só vale no build (`e2b` 2.63.0 `index.d.ts:12660-12661`) | a implementação provada na E2B, teste 1 (`Chrome not found` sem ele) | U1 | o invólucro, escrito pelo template |
| Quem dirige o navegador | nenhum | `@mastra/core` 1.83.0 `workspace-BAqspXXH.js:6225-6233` (o Mastra reconhece `agent-browser`), `:6855-6882` (sem `browser` no workspace o comando roda como veio); `docs-browser.md:12-17` | comandos na sandbox | nativo: o juiz roda os comandos pelo `executeCommand` da sandbox que o Hub já usa (`machine/machines.ts:51-59`) | — | U1 | nenhum: `machine/confer.ts` |
| A captura como imagem | nenhuma | `reference-workspace-workspace-class.md:490` (`mediaTypes` padrão com `image/png`); implementação provada, teste 2 | `read_file` devolve a imagem como parte de mídia | nativo; a captura fica em `node_modules/.conexus/`, dentro da pasta do app e fora do Git (`packages/app/src/check/report.ts:26`) | — | U1, U3 | — |
| Console, erros, pedidos | o `CONSOLE_ERROR` só informa (`browser.ts:141-143`, `run.ts:37-41`) | `agent-browser` 0.43.0 `commands.md:590-593` (`console`, `errors`), `:260` (`network requests`), `:547` (`--json`); vibesdk `9da158d` `worker/agents/think/browser-logs-tool.ts:16-24` | a lista de console, erros da página e pedidos falhos volta ao agente | nativo | — | U1 | — |
| O que o modelo sabe do CLI | — | `agent-browser` 0.43.0 `skills/agent-browser/SKILL.md` | a skill do CLI | nativo; fica de fora: nesta etapa só o juiz dirige o navegador (a decisão 2 do firstmate) | — | — | — |
| Rede: só o endereço de conferência | `ALLOWED_HOSTS` (`machine/kit.ts:27`), aplicado em `machine/e2b.ts:26-28`, `:43`, `:59` | `e2b` 2.63.0 `index.d.ts:9753-9775` (`allowOut`, `denyOut`), `:9916-9930` (`updateNetwork` troca tudo); as provas na E2B, prova 2 | lista exata trocada com a máquina ligada | nativo | — | U1 | — |
| Rede: URLs da máquina privadas | `allowPublicTraffic: false` (`machine/e2b.ts:43`, pull request 1199) | `network/restrict-public-access.md:15-19` | 403 sem o token | nativo; já no `main` | — | fica de fora: feito | — |
| Rede: DNS | `8.8.8.8` aberto pela E2B quando há domínio na lista | `e2b` 2.63.0 `index.d.ts:9837-9866`; implementação provada, teste 3 | `dnsServers: []` fecha, mas o nome precisa estar em `/etc/hosts` | nativo; fica como hoje (a decisão 3 do firstmate) | — | U1 (só o texto da 0051) | — |
| Segunda cerca no navegador | nenhuma | `agent-browser` 0.43.0 `commands.md:533` (`--allowed-domains`) | o navegador recusa outro domínio | nativo; fica de fora: a rede da máquina já cerca, e o juiz só abre um endereço | — | — | — |
| Onde a versão de conferência roda | Workers for Platforms, um Worker por versão (`hub/apps/send.ts:89-101`) | o mesmo Workers for Platforms; vibesdk `9da158d` `space/src/space/durable-object.ts:741-756` (Worker Loader) | o motor de produção carrega a versão | nativo: o mesmo `cloudflare.upload`, com um Worker por Projeto (a decisão 1 do firstmate) | — | U2 | `apps/server/src/hub/apps/conference.ts` |
| Dados da conferência | um esquema para Prévia e publicado (`packages/hub-api/src/app-login.ts:8-15`) | vibesdk `durable-object.ts:658`, `:694` contra `worker/services/deployer/think-user-deploy.ts:102-108` | o estado da prévia separado do publicado | embrulhado: um esquema irmão pelo mesmo `ensureApp` e `migrate` (`platform/company-postgres.ts:223-305`) | o fundador, "2. a" | U2 | — |
| Ambiente da sessão | `APP_ENVIRONMENTS = ['preview', 'published']` (`hub/apps/tables.ts:34`) | vibesdk `durable-object.ts:834-846` (a rota própria da prévia) | um ambiente a mais | nativo: um terceiro valor, `check`, só na chamada (`CallEnvironment`) | — | U2 | — |
| A sessão do navegador | a sessão de app pela passagem (`hub/apps/handoff.ts:49-124`), pendurada na sessão do Hub | — (as referências põem o navegador fora do código julgado) | — | embrulhado: `apps.check_session`, a decisão A do fundador | — | U2 | — |
| Quem decide "terminei" | `conexusCheck` `isTaskComplete` (`conversation/processors.ts:83-132`) | Mastra 1.83.0 `isTaskComplete`; bolt.diy `353b44c` `app/lib/common/agentLoop.ts:198-210`; vibesdk `worker/agents/core/behaviors/think.ts:322-327` | por código, no fim do turno; o vibesdk só pelo prompt | nativo; o juiz passa a esperar a conferência no navegador | — | U3 | — |
| O juiz da tela não ligada | `informed` não reprova (`packages/app/src/check/run.ts:37-41`) | vibesdk `browser-logs-tool.ts:16-24`, `think.ts:322-327` ("until the deploy succeeds and the console is clean") | repetir até o console limpo | nativo: o relatório do CLI decide; o cruzamento com o despachante é a decisão B do fundador | — | U3 | — |

As peças que a implementação provada riscou não entram: o `AgentBrowser` de `@mastra/agent-browser`
0.6.0 no Hub com o proxy WebSocket (o motor 0.19.0 ignora `cdpHeaders`), `maskRequestHost` e o
token de tráfego no CDP. Nada entra de fora na máquina.

**A medida do transplante.** Nada vem do repositório antigo nem de outra referência: o template
ganha um pacote e um invólucro, provados na E2B como `scripts/template-teste.ts` do estudo de
implementação, e o resto é código novo sobre peças do `main`.

**A dívida.**

- O canal de DNS para `8.8.8.8` da rede da máquina, que existe desde que o npm entrou na lista
  (a decisão 3 do firstmate). Vai para uma issue no fechamento.
- `setEnvs` do template não chega aos comandos da máquina (`infra/e2b/template.ts:97-100`; `e2b`
  `index.d.ts:12660-12661`; implementação provada, teste 1). A conferência não sofre, porque o
  `/opt/conexus/check` exporta as duas variáveis (`template.ts:52-55`) e o invólucro novo aponta o
  Chromium. O `npm` que o modelo roda não usa o cache de `/opt/conexus/npm-cache`. Vai para uma
  issue no fechamento, com o comentário de `template.ts:51`, que diz o contrário.
- O MMDS do Firecracker em `169.254.169.254` responde dentro da máquina com identificadores da E2B
  (as provas na E2B, prova 2, seção 4.3). Nada do Conexus está ali.

## As decisões do firstmate

| # | Decisão reversível ([delivery L6](../guides/delivery.md)) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | Um Worker de conferência por Projeto, `c-<projectId>`, trocado a cada conferência, e não um por versão nem o Worker Loader | um por versão criaria até `CHECK_LIMITS.checks` Workers por turno no namespace da Prévia; o Worker Loader no despachante pede três provas na conta da Cloudflare que o estudo curto listou e não fez (o tempo de carga, o Browser Run, `worker_loaders` ao lado de `dispatch_namespaces`); o Projeto já é seguro por um turno de cada vez (`runs/runs.ts:296-297`), então um Worker por Projeto nunca é trocado no meio de outra conferência | um Worker por versão, `v-<id>` da versão salva, com a poda de hoje |
| 2 | O juiz, e não o modelo, dirige o navegador nesta etapa | o estudo do navegador mediu que o modelo só vê o pedido falho se pensar em perguntar (seção 3); o vibesdk confere por prompt, e o Conexus já decide o fim do turno por código (`processors.ts:115-132`); dirigir por código tira do caminho a prova que faltou, "um modelo de verdade usando o CLI" | a skill do CLI nas skills do Builder (`conversation/builder.ts:176`), com a rede aberta durante o turno |
| 3 | O DNS fica como hoje, com `8.8.8.8`, e a 0051 passa a dizer isso | `dnsServers: []` fecha o canal, mas pede o endereço de cada host em `/etc/hosts` (implementação provada, teste 3), e o do npm muda; o canal existe hoje pelo npm, com ou sem a conferência | `dnsServers: []` na conferência, com o Hub escrevendo `/etc/hosts` só durante ela |
| 4 | O navegador fecha no fim de cada conferência (`agent-browser close`) | o daemon vive uma hora parado por padrão (`commands.md:575`) e a máquina pausa em 5 minutos (`machine/e2b.ts:16`); fechar tira a dúvida do daemon numa conversa longa e não deixa a sessão de conferência no perfil | manter o navegador aberto entre voltas e medir |
| 5 | A conferência abre só a entrada do app (`/`) e espera `networkidle` | o critério do roteiro é a tela não ligada; a entrada é a tela que toda versão tem; o CLI avisa que `networkidle` pode não chegar numa página com SSE (`commands.md:171-177`), e o app de hoje não tem SSE | esperar um seletor que o app declare, quando o contrato tiver telas |
| 6 | A versão do CLI mora no `package.json` da raiz, como `devDependency` exata, lida pelo template como o `wrangler` (`template.ts:31-49`) | um dono só da versão (C26); o teste do critério 3 roda o mesmo CLI no CI | uma constante no template |
| 7 | Um pedido falho é um pedido ao host do app com status 400 ou mais, ou sem resposta; pedidos a outros hosts não contam | só o host do app está na rede; um pedido a outro host falha sempre, e contar isso reprovaria todo app que chama uma fonte | contar também os outros hosts |

## U1 O navegador na máquina

**Base e modelo.** `main` no commit em que G1 começa (o cartão leu `044e16c3`). Sonnet: um pacote no
template e uma função que roda comandos e lê JSON.

### As linhas da tabela

- **Navegador do Builder dentro da máquina.** Na base: `infra/e2b/template.ts:42-49` (`TOOLS`),
  `:52-55` (`CHECK`), `:83-96` (o `runCmd` de root). Na referência: a forma provada pela
  implementação na E2B, `scripts/template-teste.ts`, que este cartão copia como está na seção
  "A ordem do trabalho".
- **O Chromium do navegador.** `template.ts:90` instala o `chrome-headless-shell` em
  `${BROWSERS}`; o invólucro o aponta com `AGENT_BROWSER_EXECUTABLE_PATH`.
- **Quem dirige o navegador.** `machine/machines.ts:51-59` (`run`, com prazo e saída limitada),
  `:285-291` (`check`, o modelo de função que roda na sessão da conversa).
- **Console, erros, pedidos.** `commands.md:590-593`, `:260`, `:547`; o formato JSON de cada um é
  o que o CLI imprime com `--json` (ler a saída de verdade no passo 2, e registrar o esquema Zod).
- **Rede.** `machine/e2b.ts:26-28` (`egress`), `:59` (`closeNetwork`); `machines.ts:194-197` (a
  partida de uma máquina achada fecha a rede).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `infra/e2b/template.ts` | Muda: `agent-browser` em `TOOLS`, o invólucro, o `printf` dele | o build do template (firstmate) |
| `package.json`, `package-lock.json` | Muda: `devDependencies` ganha `agent-browser` exato | o template (`versionOf`), `machine-confer.test.ts` |
| `apps/server/src/builder/machine/kit.ts` | Muda: o `Kit` ganha `openNetwork(hosts)` | `machines.ts` |
| `apps/server/src/builder/machine/e2b.ts` | Muda: `openNetwork` pelo `updateNetwork` com `egress` | `createE2bKit` |
| `apps/server/src/builder/machine/confer.ts` | Cria: os comandos, o esquema do JSON do CLI, `BrowserReport` | `machines.ts` |
| `apps/server/src/builder/machine/machines.ts`, `port.ts`, `public.ts` | Muda: `Machines.confer` | `builder/runs/` (U3) |
| `apps/server/src/builder/machine/test-machine.ts` | Muda: o dublê do `Kit` ganha `openNetwork` | os testes da máquina |
| `docs/decisions/0051-builder-machine-git-and-copy-in-r2.md` | Muda: a emenda da rede | — |
| `docs/reference/stack.md` | Muda: a linha de `agent-browser` | `npm run docs` |

### Os contratos que a unidade cria

Em `apps/server/src/builder/machine/confer.ts`, exportados por `machine/public.ts`:

```ts
export type BrowserProblem =
  | { kind: 'PAGE_ERROR'; message: string }
  | { kind: 'CONSOLE_ERROR'; message: string }
  | { kind: 'REQUEST_FAILED'; method: string; path: string; status: number | null }

export type BrowserReport =
  | { kind: 'CLEAN'; shot: string }
  | { kind: 'DIRTY'; problems: BrowserProblem[]; shot: string }

export type ConferPlatformFailed = 'CONFER_PLATFORM_FAILED'

/** O endereço do app no ambiente de conferência e a sessão que o abre. */
export type ConferAt = Readonly<{ url: URL; session: AppSessionToken }>
```

Em `port.ts`, no `Machines`:

```ts
confer(input: { conversationId: ConversationId; at: ConferAt }): Promise<Result<BrowserReport, ConferPlatformFailed>>
```

E no `Kit` (`kit.ts`): `openNetwork(hosts: readonly string[]): Promise<void>`, ao lado de
`closeNetwork`.

A forma de cada coisa:

- **Cada estado** como união: `BrowserReport` por `kind`; `BrowserProblem` por `kind` (C21, C22).
- **Cada id**: `AppSessionToken` é a marca do contrato (`packages/hub-api`), conferida por quem a
  cria (U2); `shot` é o caminho relativo à pasta do app, `node_modules/.conexus/tela.png`.
- **O dono de cada fato compartilhado**: o caminho da captura é uma constante de `confer.ts`, ao
  lado de `WORK_FOLDER` (`packages/app/src/check/report.ts:26`), importado de lá (C26). Os hosts
  da conferência são `[...ALLOWED_HOSTS, url.hostname]`, montados só em `confer`.
- **O esquema Zod de cada entrada externa**: a saída `--json` de `console`, `errors` e
  `network requests` (C27), com o que o passo 2 ler da saída de verdade.
- **O arquivo modelo**: `machine/check.ts` (um programa na máquina, a saída lida por esquema, o
  `Result` com a falha de plataforma). Cumpre C21 e C26; não cria id (C23 não se aplica).

### As skills e a leitura

As linhas de `docs/reference/stack.md` de `e2b` e `@mastra/core`, a skill `mastra` (a referência do
`Workspace` e do `executeCommand`), `pstack:typescript-best-practices`, e o
`skill-data/core/SKILL.md` do `agent-browser` no `node_modules` depois da instalação, com
`references/commands.md`. O guia além do de código: security (S36, S40).

### A ordem do trabalho

1. **O template.** Critério: 1.
   - **Arquivos:** muda `infra/e2b/template.ts`, `package.json`, `package-lock.json`.
   - **Referência a seguir:** `scripts/template-teste.ts` da implementação provada, construído
     como `conexus-teste-navegador:v1` em 111 s.
   - **O que entra:** `'agent-browser': versionOf('package.json', 'agent-browser')` em `TOOLS`; o
     invólucro, escrito em `/usr/local/bin/agent-browser` depois do `CHECK`:

     ```ts
     const BROWSER = `#!/bin/sh
     export AGENT_BROWSER_EXECUTABLE_PATH="$(ls -d ${BROWSERS}/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell | head -n 1)"
     exec ${OPT}/node_modules/.bin/agent-browser "$@"
     `
     ```

     O `npm` 11 avisa que o `postinstall` do pacote não rodou; o lançador acha o binário do pacote
     opcional mesmo assim (implementação provada, `template-v1.log:24-29`). Regras: C26, L16.
   - **Pronto quando:** o build do template passa no ponto de conferência.
2. **O relatório do CLI.** Critérios: 3, 4.
   - **Arquivos:** cria `machine/confer.ts`.
   - **Referência a seguir:** `commands.md:590-593`, `:260`, `:547`. Rode o CLI do `node_modules`
     contra uma página local e grave a saída `--json` de cada comando antes de escrever o esquema.
   - **O que entra:** `reportOf(outputs, host): BrowserReport`, função pura: um `REQUEST_FAILED`
     só para o host do app (a decisão 7 do firstmate).
   - **Testes:** `machine-confer.test.ts`, os casos dos critérios 3 e 4.
   - **Mutações à mão:** trocar `>= 400` por `> 400` → o 404 vira `CLEAN`, o caso do critério 3
     fica vermelho; tirar o filtro de host → o caso do pedido a outro host do critério 4 fica
     vermelho.
3. **A rede e o `confer`.** Critérios: 2, 5, 6, 7.
   - **Arquivos:** muda `kit.ts`, `e2b.ts`, `machines.ts`, `port.ts`, `public.ts`,
     `test-machine.ts`.
   - **O que entra:** `openNetwork` é `sandbox.e2b.updateNetwork(egress(hosts))`: o
     `updateNetwork` troca a regra inteira (`index.d.ts:9916-9930`), então abrir e fechar mandam a
     lista toda. O `confer` escreve o cookie pelo `Transport` (`kit.ts`, `Transport.write`) num
     arquivo fora da pasta do app, roda `cookies set --curl <arquivo> --domain <host>`, `open`,
     `wait --load networkidle`, `screenshot <shot>`, `console --json`, `errors --json`,
     `network requests --json`, e no `finally` `close`, apaga o arquivo e `closeNetwork`. Cada
     comando pelo `run` com prazo (C57). Regras: C57, S40.
   - **Testes:** `machine-confer.test.ts`, os casos dos critérios 2, 5, 6 e 7 sobre o dublê.
   - **Mutações à mão:** tirar o `closeNetwork` do `finally` → o caso do comando que lança fica
     vermelho; passar o token como argumento → o caso do critério 7 fica vermelho.
   - **Pronto quando:** os casos passam; o ponto de conferência roda um `confer` de verdade.
4. **A emenda da 0051 e a linha de `stack.md`.** Critério: 8. O texto da regra de rede da 0051
   ganha a frase da conferência e a do DNS, com a palavra do fundador ("Aprovo emenda") e a data.
   A linha de `agent-browser` em `stack.md`: Used in `infra/e2b`, Read first `skill-data/core/SKILL.md`,
   Trap: `setEnvs` não chega aos comandos, por isso o invólucro.

### Como se prova

Critérios 3 a 7: `machine-confer.test.ts`, o CLI de verdade nos critérios 3, 4 e 6, o dublê da
máquina no 2, 5 e 7. Hoje não há navegador nenhum na máquina do Builder: os casos não têm o que
chamar. Critérios 1 e 2: o ponto de conferência, numa máquina E2B do template novo. Critério 8:
`npm run docs`.

### Parar se

- O CLI no CI não acha o Chromium do Playwright: aponte `AGENT_BROWSER_EXECUTABLE_PATH` no teste,
  como o invólucro faz, e anote.
- `cookies set --curl` recusa o cookie `__Host-` (o nome que o despachante lê,
  `apps/edge/src/headers.ts:7`) ou não o manda ao host: pare, com a saída, porque a sessão é a
  decisão A.
- A saída `--json` de algum comando não traz o status do pedido: pare, com a saída.

## G1 O ponto de conferência

`npm run check`; os testes de `builder/machine/`; o build do template novo na E2B com a tag de G1
(firstmate, com a chave da conta de hoje); numa máquina desse template, os comandos dos critérios 1
e 2 com `example.com` como host liberado, e um `confer` contra `example.com`. As saídas no pull
request. Nenhuma tela muda.

## U2 O ambiente de conferência no Hub

**Base e modelo.** A cabeça de G1 já em `main`. Opus: uma tabela nova, um ambiente novo na porta do
app e um esquema irmão no banco de cada empresa, que se cruzam com a remoção do Projeto.

### As linhas da tabela

- **Onde a versão de conferência roda.** Na base: `hub/apps/send.ts:89-101` (`uploadVersion`),
  `:129-155` (`prepare`: o Worker primeiro, depois o banco, decisão 0046).
- **Dados da conferência.** `platform/company-postgres.ts:223-247` (`schemaStatements`),
  `:250-260` (`ensureApp`), `:269-305` (`migrate`), `:308-330` (`dropApp`);
  `hub/apps/app-database.ts:43-81` (`openAppDatabase`), `:114-150` (`migrateApp`);
  `packages/hub-api/src/app-login.ts:8-15`.
- **Ambiente da sessão e a sessão do navegador.** `hub/apps/tables.ts:33-79`;
  `hub/apps/handoff.ts:140-189` (`admitCall`), `:248-288` (`callTo`);
  `hub/projects/hosts.ts:124-155` (`admitToApp`, que recebe o ambiente como literal).
- **A remoção.** `hub/apps/removal.ts:61-110`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/apps.ts` | Muda: `AppWorker` aceita `c-<id>`; `appCheckWorkerOf` | o despachante (sem mudança de código), `conference.ts`, `removal.ts` |
| `packages/hub-api/src/app-login.ts` | Muda: `appCheckLogin` | `company-postgres.ts`, `handoff.ts` |
| `apps/server/src/hub/apps/tables.ts`, `apps/server/migrations/`, `apps/server/database-grants.sql` | Muda e cria: `CallEnvironment`; `apps.check_session` | `handoff.ts`, `conference.ts` |
| `apps/server/src/platform/company-postgres.ts` | Muda: `resetCheck` e `dropApp` com o esquema de conferência | `conference.ts`, `removal.ts` |
| `apps/server/src/hub/apps/conference.ts` | Cria: `openConference`, `endConference` | `apps/server/src/main.ts` (a porta do Builder) |
| `apps/server/src/hub/apps/handoff.ts` | Muda: `admitCall` lê também `check_session`; `callTo` no ambiente `check` | o despachante, por `checkAppCall` |
| `apps/server/src/hub/projects/hosts.ts` | Muda: o literal do ambiente ganha `check`, admitido como `preview` | `handoff.ts` |
| `apps/server/src/hub/apps/removal.ts` | Muda: o Worker de conferência sai com os outros | a remoção do Projeto |
| `apps/server/src/hub/apps/public.ts`, `apps/server/src/main.ts` | Muda: a porta `confer` ao lado de `sendFromBuilder` (`main.ts:160`) | `builder/runs/` (U3) |

### Os contratos que a unidade cria

Em `packages/hub-api/src/apps.ts`:

```ts
export const AppWorker = z.string().regex(/^[vc]-[A-Za-z0-9]{32}$/)
/** O Worker de conferência do Projeto, trocado a cada conferência (decisão 1 do firstmate). */
export function appCheckWorkerOf(projectId: ProjectId): AppWorker
```

Em `packages/hub-api/src/app-login.ts`: `appCheckLogin(projectId)`, a mesma forma de `appLogin`,
com `schema: app_<id>_check`, `runLogin: app_<id>_check_run`, `migrateLogin: app_<id>_check_migrate`
e sem login de leitura (nenhum agente lê o banco de teste). O nome mais longo tem 50 caracteres,
abaixo dos 63 do Postgres.

A tabela `apps.check_session`, na migração nova:

| Coluna | Tipo | Restrição | Ao apagar |
| --- | --- | --- | --- |
| `token_hash` | `text` | chave primária | — |
| `host_label` | `text` | `not null` | — |
| `person_id` | `text` | `not null` | — |
| `company_id` | `text` | `not null` | — |
| `project_id` | `text` | `not null`, chave estrangeira para `projects.project(id)` | `cascade` |
| `expires_at` | `timestamptz` | `not null` | — |

Lida e escrita só pelo login da instalação, como `apps.app_session` (`database-grants.sql`).
`APP_ENVIRONMENTS` e as restrições `handoff_environment` e `app_session_environment` ficam como
estão: nenhuma passagem nem sessão de app é de conferência. O ambiente de uma chamada é
`CallEnvironment = AppEnvironment | 'check'`, em `tables.ts`, lido por `admitCall` e `callTo`.

Em `apps/server/src/hub/apps/conference.ts`:

```ts
export type Conference =
  | { kind: 'OPENED'; url: URL; session: AppSessionToken }
  | { kind: 'NOT_STARTING' }
  | { kind: 'MIGRATION_REFUSED'; failure: AppVersionFailure; cause?: MigrationCause }

export function openConference(
  deps: SendDeps,
  input: { companyId: CompanyId; projectId: ProjectId; personId: PersonId; folder: VersionFolder },
): Promise<Result<Conference, 'CONFER_PLATFORM_FAILED'>>

export function endConference(deps: { database: Database }, input: { session: AppSessionToken }): Promise<void>
```

A forma de cada coisa:

- **Cada estado** como união: `Conference` por `kind` (C21, C22).
- **Cada id**: `AppSessionToken` criado por `secret()` de `handoff.ts:35-37` e só o hash no banco
  (`hashOf`, S22); `AppWorker` conferido por `appCheckWorkerOf`, a única fábrica do nome (C23).
- **O dono de cada fato compartilhado**: o prazo de 10 minutos é uma constante de `conference.ts`
  (C26); o nome do Worker e os logins de conferência só em `packages/hub-api`.
- **O esquema Zod de cada entrada externa**: nenhuma nova; o `VersionFolder` já chega pelo
  `receiveVersion` (`send.ts:230`).
- **O arquivo modelo**: `hub/apps/send.ts` (`prepare` em ordem, cada ato fora de transação, D22).
  Cumpre C21, C23 e C26.

### As skills e a leitura

As linhas de `docs/reference/stack.md` de `drizzle-orm`, `@neondatabase/serverless` e `zod`, e a
skill `neon:neon-postgres` para o esquema e os papéis, com `pstack:typescript-best-practices`. O
guia além do de código: data (D17, D22).

### A ordem do trabalho

1. **O contrato e a tabela.** Critério: 14.
   - **Arquivos:** muda `packages/hub-api/src/apps.ts`, `app-login.ts`; muda `tables.ts`
     (`checkSession`, `CallEnvironment`); cria a migração por `drizzle-kit generate`; muda `database-grants.sql` e o retrato do catálogo no
     mesmo commit.
   - **Pronto quando:** `npm run migrations -- --base origin/main` passa.
2. **O esquema de teste.** Critério: 10.
   - **Arquivos:** muda `platform/company-postgres.ts`.
   - **O que entra:** `resetCheck(owner, projectId)`: numa transação, o `DROP SCHEMA ... CASCADE`
     como o login de migração de conferência e depois as instruções de `schemaStatements` com os
     nomes de `appCheckLogin`, sem as de leitura; `migrate` recebe o par de logins em vez de os
     derivar só de `appLogin`. `dropApp` derruba também o esquema e os dois logins de conferência.
     Regras: D22, C52, C26.
   - **Testes:** `conference.test.ts` no Postgres real, os dois casos do critério 10.
   - **Mutações à mão:** tirar o `DROP` → a linha da conferência anterior aparece; trocar
     `appCheckLogin` por `appLogin` → o esquema da Prévia muda, o caso fica vermelho.
3. **A conferência no Hub.** Critério: 9.
   - **Arquivos:** cria `hub/apps/conference.ts`; muda `public.ts`, `main.ts`.
   - **O que entra:** `openConference` admite como `sendVersion` (`admitTo` com
     `sendBuilderVersion`, `send.ts:54-63`), cria a linha de `apps.app` se não houver (como
     `projectDatabase`, `app-database.ts:87-109`), sobe o Worker com `uploadVersion` trocando o nome
     por `appCheckWorkerOf`, abre o banco da empresa (`openAppDatabase`), chama `resetCheck` e o
     `migrate` de conferência, grava a `check_session` e devolve o endereço `appHostOf` do Projeto.
   - **Testes:** `conference.test.ts`, critério 9.
4. **A chamada no ambiente de conferência.** Critérios: 11, 12.
   - **Arquivos:** muda `handoff.ts`, `hosts.ts`.
   - **O que entra:** `admitCall` procura o token em `app_session` e, sem achar, em `check_session`
     com `expires_at > statement_timestamp()`; acha `environment: 'check'`; a admissão da pessoa é a
     mesma (`admitToApp` com `check` admitido como `preview`). `callTo` no `check` devolve
     `appCheckWorkerOf` e `appCheckLogin(...).runLogin`. Regras: S8, S13, S22.
   - **Mutações à mão:** tirar a condição de `expires_at` → o caso de 10 minutos do critério 12
     fica vermelho.
5. **A remoção.** Critério: 13.
   - **Arquivos:** muda `removal.ts`.
   - **O que entra:** `removeProjectApp` remove `appCheckWorkerOf(projectId)` com os Workers das
     versões, e `dropApp` leva o esquema de conferência.

### Como se prova

Critérios 9 a 14 pelos testes nomeados, no Postgres real e pela porta `createAppDoor`. Hoje não há
ambiente de conferência: `checkCall` com um token de `check_session` dá `APP_SESSION_INVALID`, e o
caso do critério 11 fica vermelho.

### Parar se

- O despachante recusa o nome `c-<id>` em outro lugar além de `AppWorker`: pare, porque o
  despachante não muda nesta etapa.
- O `GRANT` do login de migração de conferência ao dono falha no Neon por limite de papéis: pare,
  com o código.

## U3 O juiz

**Base e modelo.** A cabeça de U2. Sonnet: o juiz já existe; muda a ordem dele e o texto que o
modelo lê.

### As linhas da tabela

- **Quem decide "terminei" e o juiz da tela não ligada.** `conversation/processors.ts:15-20` (a
  descrição de `conexus_check`), `:42-49` (`feedback`), `:83-113` (`judge`);
  `builder/runs/runs.ts:204-209` (`check`), `runs/context.ts:21-40` (`BuilderSend`, o modelo da
  porta nova); `main.ts:160`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/runs/context.ts`, `runs.ts`, `test-runs.ts` | Muda: `RunsDeps.confer`; `check` com as duas conferências | `processors.ts` |
| `apps/server/src/builder/conversation/processors.ts` | Muda: o texto de `feedback` e de `CHECK_DESCRIPTION` | o Builder |
| `apps/server/src/builder/conversation/test-conversation.ts` | Muda: o dublê de `confer` | os testes da conversa |
| `tests/apps/encomendas-defeito/` | Cria: o app de teste do defeito plantado | `builder.eval.test.ts` |

### Os contratos que a unidade cria

Em `runs/context.ts`:

```ts
type BuilderConfer = {
  open(input: { companyId: CompanyId; projectId: ProjectId; personId: PersonId; folder: VersionFolder }): Promise<Result<Conference, 'CONFER_PLATFORM_FAILED'>>
  end(input: { session: AppSessionToken }): Promise<void>
}
```

`Runs.check` passa a devolver `Result<CheckReport & { browser?: BrowserReport | Conference }, CheckPlatformFailed>`:
o relatório da máquina de hoje, com a conferência no navegador quando ela rodou. `ok` do relatório
fica `false` quando a conferência não é `OPENED` com `CLEAN`. Nenhuma forma nova chega à tela:
`VersionCheck` fica como está.

- **O dono de cada fato**: o texto do juiz é de `processors.ts`; o caminho da captura, de U1.
- **O arquivo modelo**: `processors.ts` (C21 nas uniões que ele lê).

### As skills e a leitura

As linhas de `stack.md` de `@mastra/core`, a skill `mastra` (`isTaskComplete` e os scorers), e
`pstack:typescript-best-practices`. O guia além do de código: testing (T5, T26).

### A ordem do trabalho

1. **As duas conferências num caminho.** Critérios: 15, 16, 17.
   - **Arquivos:** muda `runs/context.ts`, `runs.ts`, `test-runs.ts`, `main.ts`.
   - **O que entra:** `check` roda a da máquina; se passou, `machines.pack`, `confer.open`, e com
     `OPENED` o `machines.confer` com o endereço e a sessão, e `confer.end` no `finally`.
   - **Mutações à mão:** rodar o `confer` antes da conferência da máquina → o caso "nenhum `confer`
     roda" do critério 16 fica vermelho.
2. **O texto que o modelo lê.** Critério: 15.
   - **Arquivos:** muda `processors.ts`.
   - **O que entra:** o `feedback` nomeia o relatório do navegador e diz para ler a captura com
     `mastra_workspace_read_file`; `CHECK_DESCRIPTION` troca "opens the app in a browser" pelo que a
     conferência faz agora, e tira "It does not prove ... that a screen shows the right values" na
     parte que ela passa a provar.
3. **O defeito plantado.** Critério: 18.
   - **Arquivos:** cria `tests/apps/encomendas-defeito/` (como `tests/apps/recados-defeito/`), com
     a tela chamando `listarEncomendas` que o servidor não declara; muda `builder.eval.test.ts`.
   - **Pronto quando:** o caso roda no ponto de conferência, na nuvem.

### Como se prova

Critérios 15 a 17 por `conversation-check.test.ts`, com a máquina, o Hub e o modelo em dublê. Hoje o
juiz encerra com `FINISHED` sobre a mesma tela: o caso do critério 15 fica vermelho. Critérios 18 a
20 no ponto de conferência.

### Parar se

- O `read_file` do Builder não devolve a imagem da captura em `node_modules/.conexus/`: pare, com a
  saída, porque o lugar da captura é a única prova que a implementação não fez.
- O modelo de verdade não corrige o defeito em `CHECK_LIMITS.checks` voltas em duas corridas: pare
  e relate o que cada conferência disse; não mude o texto do juiz para passar o teste.

## G2 O ponto de conferência

`npm run check`; os testes de `hub/apps/`, de `builder/runs/` e de `builder/conversation/`; a migração
com `npm run migrations`; no Hub da nuvem com o template de G1, o roteiro de uso inteiro, o teste
do defeito plantado (critério 18), os dois apps de teste (critério 19) e os tempos (critério 20),
com as capturas antes e depois no pull request.

## U4 O fechamento

**Base e modelo.** A cabeça de G2 em `main`, depois do uso. Sonnet: só documentos.

Muda `docs/architecture.md` (a máquina passa a abrir o app de conferência, seção 11 com a dívida),
abre as duas issues da dívida (o DNS e o `setEnvs`), grava a linha de uso no arquivo de aprovação e
apaga este cartão (delivery L19). Nenhuma linha da tabela é remendo: `boundaries.md` não muda.
