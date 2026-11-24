# O Builder vê o que construiu

Trilho: assistente

Trilha Agentes e Apps, marco `A1` do [roteiro](../roadmap.md): "Menos apps 'prontos' que não
funcionam. Um teste planta um defeito visível e o Builder o corrige sem ninguém avisar. A
conferência falha quando uma tela não está ligada. O estudo curto que compara máquina e Worker de
verdade está feito antes". A marca `Trilho: assistente` é a que a verificação `second-card` lê para
esta trilha (`scripts/cli.ts:17-23`, `trackOf`), como no cartão da Prévia; a etapa Uma ficha por
agente, da mesma trilha, correu no trilho próprio do harness (`Trilho: harness`), e o cartão dela
saiu no fechamento ([o arquivo de aprovação dela](../approvals/uma-ficha-por-agente.md)). Por palavra do fundador em 2026-11-22 ("A: Sua recomendacao"), este
marco vem depois da ficha, e a etapa 2 do harness, "Uma sala e os nomes certos", vem depois dele e
antes do `A3`. As duas condições de entrada estão cumpridas: a ficha fechou em 2026-11-23 (o G7
dela, pull request 1288, "Validado"), e a Prévia saiu de `docs/steps/` (delivery L5). Ao lado deste
cartão ficam `a-primeira-copia-chega-ao-lago.md`, da trilha Dados, e `publicar-pelo-merge-da-nota.md`
(`Trilho: desenho`); a verificação `second-card` conta um cartão por trilho e passa com os três
(`npm run second-card` em `14a99007`). As palavras do fundador que ele já leva estão no
[arquivo de aprovação](../approvals/o-builder-ve-o-que-construiu.md).

Relido em `main` `14a99007` (a v0.24.118 e o que veio depois), com a ficha inteira, as correções
da auditoria do harness (pull requests 1299 e 1300) e o G0a e o G0b do Lago 2 (pull requests 1301,
1305 e 1306). Cada `arquivo:linha` do repositório citado aqui foi comparado, por um script, entre
`b2406e07` e `14a99007`, e cada um que mudou foi relido à mão; `B/` abaixo é
`apps/server/src/builder/`, como na ficha. O que a ficha, a auditoria e o Lago 2 mudaram neste
cartão está na seção "O que mudou no `main` desde a primeira leitura", depois das decisões do
firstmate. As versões que o cartão lê não mudaram: `@mastra/core` 1.83.0, `@mastra/e2b` 0.17.0 e
`e2b` 2.63.0; a prateleira do Mastra que cita é a 1.83, que casa com o instalado.

Lido antes em `main` `044e16c3` (depois dos pull requests 1195, 1199 e 1202), com `@mastra/core` 1.83.0,
`@mastra/e2b` 0.17.0, `e2b` 2.63.0 e o CLI `agent-browser` 0.43.0 lido pelo `npm pack`. Os cinco
estudos e provas do A1 ficam fora do repositório (delivery L21): o estudo curto máquina contra
Worker, o estudo do navegador, o de segurança, as quatro provas na E2B e a implementação provada na
E2B; e, depois da leitura por outro modelo, a prova local do cookie (o `agent-browser` 0.43.0
contra um servidor HTTPS local, oito variantes). A tabela de referência vem da implementação
provada, linha por linha; as linhas que ele riscou (o
`AgentBrowser` no Hub, o proxy WebSocket, `maskRequestHost`) não entram. Cada linha de `main`
citada aqui foi relida em `044e16c3`.

## A página do fundador

**No fim desta etapa** o Builder confere o app que acabou de construir antes de dizer que terminou.
Ele sobe a versão de verdade na Cloudflare, sobre um banco de teste vazio, abre a tela num navegador
dentro da máquina da conversa e olha o que apareceu: a imagem da tela, os erros da página e os
pedidos que falharam. Se a tela mostra erro porque a operação por trás dela falha, ou a página
quebra, a conferência reprova, e o Builder recebe o que viu e corrige sozinho, na mesma conversa.
Só a versão que passou vai para a Prévia, como hoje.

**O roteiro de uso.**

1. No Hub da nuvem, num Projeto de teste, peça ao Builder: "Faça um app de encomendas com uma
   lista e um botão Nova". Enquanto ele trabalha, a conversa mostra o trabalho como hoje.
2. Abra a Prévia quando o Builder disser que terminou. A lista aparece, vazia, sem "Erro ao
   carregar", e **Nova** abre o formulário.
3. Crie duas encomendas na Prévia. Peça: "Mude a lista para mostrar também o telefone do
   cliente". Quando ele disser que terminou, a Prévia mostra a coluna Telefone, com as duas
   encomendas, sem "Erro ao carregar".
4. Abra **Dados** do Projeto. As duas encomendas que você criou estão lá, e nada mais: o que o
   Builder gravou ao conferir ficou no banco de teste.

**O que você faz, e quando.** Antes: nada. Uma ficha por agente fechou em 23/11, na ordem que
você deu em 2026-11-22, e a conferência nova entra no juiz que a ficha deixou. No começo: aprova
esta página e responde à decisão abaixo. No fim: faz o roteiro, diz o que viu. Nenhum texto de
tela é novo, salvo a frase da linha de `conexus_check` no meio do turno, que a emenda de 2026-11-24 (abaixo, na decisão 15) fixou. O teste em que um
defeito é plantado e o Builder de verdade o corrige sem aviso roda antes, pelo firstmate, e o
relatório dele traz a imagem da tela antes e depois.

**A visão.** A etapa serve a linha "Um app entregue funciona, porque o Builder confere o que
construiu; app bonito e quebrado não é entrega" e a linha "o modelo nunca declara o trabalho
pronto": quem decide que terminou é a conferência, por código. Ela encosta em duas recusas, e não as
cruza. "O código gerado não guarda segredo e não alcança a rede": durante a conferência a máquina
alcança só o endereço daquele app, e só até o fim dela, pela emenda da decisão 0051 que você
aprovou ("Aprovo emenda"); a entrada do navegador fica num arquivo da máquina, apagado no fim, e só
abre aquele app, no banco de teste, sem conectores, por 10 minutos (a decisão abaixo pergunta em
quem a conferência confia). "Abre um app ao público": a versão conferida roda num Worker só de
conferência, que só a sessão de conferência abre.

**Fica de fora.**

- O Builder clicar e digitar na tela por conta própria. Nesta etapa quem abre o navegador é a
  conferência, por código, para que ela nunca dependa de o modelo lembrar de olhar. O Builder
  recebe o que ela viu. Navegar sozinho vem quando um marco pedir, com a mesma peça.
- Abrir cada tela do app. A conferência abre a tela de entrada. As outras telas ficam para o
  marco que trouxer o plano conferido (`A3`).
- Fechar a consulta de nomes que a máquina faz ao serviço público do Google. Ela existe hoje,
  sem o A1, por causa do npm, e vai para uma issue.
- A conferência no navegador num Projeto de antes dos endereços de app, que não tem Prévia para
  abrir: nele o Builder segue com a conferência de hoje. Todo Projeto novo tem endereço.
- A etapa 2 do harness, "Uma sala e os nomes certos" (os nomes "Construtor de apps" e "Construtor
  de agentes"). Ela vem depois deste marco e antes do `A3`, na mesma ordem de 2026-11-22.
- Dos itens abertos com o rótulo `next-card`, quatro têm o gatilho num arquivo ou numa pasta que
  esta etapa muda. Dois entram: o 788 (tirar `SUBSCRIPTION_KINDS` do índice de `packages/hub-api`,
  que a U2 muda para exportar o Worker e os logins de conferência) e o item 4 do 753 (quebrar um
  comentário longo em `hub/apps/live.ts`, a pasta da U2). Os outros itens do 753 ficam: são
  testes e comentários em pastas que esta etapa não toca. Esperam também: o 808 (o dublê das
  máquinas ainda chamado pelo nome do Assistente), porque o renome passa por testes dos quatro
  agentes e é o assunto da etapa 2 do harness, que vem logo depois; e o 813 (uma regra que recusa
  app com estado guardado entre chamadas), porque esta etapa só acrescenta apps de teste à
  conferência da máquina e não muda o que ela recusa. O 235 também dispara pelo `test-runs.ts` da
  U3 e espera pelo mesmo motivo do 808: a exceção do `.dependency-cruiser.cjs` que ele aponta é
  sobre onde moram os dublês, que a etapa 2 move. O 961 (o app declara as cópias que lê) tem como
  gatilho refazer o molde da máquina, que a U1 refaz; ele espera, porque trata das cópias que
  saíram do Hub com o Lago 2, e o molde novo só ganha o navegador. O 1164 (o turno recusado quando outra
  conversa salvou) é da sincronização da máquina, que esta etapa não toca.

**Já decidido pelo firstmate; você muda ao aprovar, se quiser.**

- **Os conectores ficam sem conexão na conferência.** Durante a conferência, o app vê cada
  conector (Google, Sankhya e os outros) como sem conexão liberada, a mesma resposta que ele já
  recebe quando uma conexão não foi liberada ao Projeto, e nenhuma chamada sai para uma conexão
  real. A decisão é do firstmate, tomada na mesma linha da sua palavra sobre o banco de teste
  vazio, e você muda ao aprovar. O custo: a parte de um app que lê um conector é conferida só no
  estado "sem conexão", nunca com dado real. A alternativa seria a conferência ler pelas suas
  conexões reais, como a Prévia lê.
- **O Registro de dados não mostra as consultas da conferência.** Elas leem só o banco de teste, que
  não tem dado da empresa; o Registro segue mostrando as consultas da Prévia e do app publicado. A
  alternativa seria gravá-las com uma marca de conferência.
- **O arquivo novo da máquina fica na pasta de hoje.** A página da trilha diz que, desde este
  marco, cada arquivo novo nasce na pasta com o nome novo da etapa 2. O arquivo da conferência no
  navegador fica ao lado do resto da máquina, na pasta de hoje, porque a etapa 2 muda a pasta
  inteira de nome logo depois, de uma vez. A alternativa seria criar já a pasta nova só para ele.
- **Quando a conferência não consegue rodar, a linha da conversa diz isso.** Hoje, se a máquina
  não consegue conferir no meio do trabalho, a linha da conversa mostra "Conferiu o app", como se
  tivesse conferido. Com esta etapa ela passa a mostrar "Não conseguiu conferir o app" e, aberta,
  "Não consegui conferir o app agora. Isso não diz nada sobre o app." (emenda de 2026-11-24: a primeira versão dizia a frase de `CHECK_PLATFORM_FAILED`, "O código ficou guardado sem conferência", que serve ao fim do turno e é falsa numa linha no meio dele). A auditoria do harness de 23/11 pediu essa
  correção junto com esta etapa, que já mexe na conferência. A alternativa seria deixar como hoje.

**As decisões suas nesta etapa.**

- **Em quem a conferência confia.** O navegador da conferência roda na máquina da conversa, junto
  com o código que o Builder escreve, e as telas do app rodam nesse navegador. Um código feito para
  enganar poderia mexer no navegador e fazer a conferência passar.

  - (a) Aceitar. O pior caso é uma versão quebrada chegar à Prévia, que é o que acontece hoje
    sempre. A conferência nunca toca: os dados da Prévia e do app publicado (ela grava num banco
    de teste), as conexões da empresa (os conectores ficam sem conexão), nem outro app ou o resto do Hub (a
    entrada da conferência abre só aquele app, só no banco de teste, e vence em 10 minutos).
  - (b) A porta dos apps na Cloudflare também conta, do lado dela, os pedidos da conferência que
    falharam, e o juiz cruza as duas listas. São umas 200 linhas a mais.

  **Recomendo (a).** Veredito: nativo. A máquina é o lugar feito para código não confiável, e o que
  um engano alcança é a Prévia de hoje. O estudo de segurança pôs (b) como condição; esta página
  pergunta se você a mantém.

  **Respondida em 2026-11-23: "1. A".** A conferência aceita; a opção (b) não entra.

- **A permissão nova no banco do Hub.** A entrada do navegador da conferência fica numa tabela nova
  do Hub. O login com que o Hub roda passa a poder ler, criar e apagar linhas dela, e nada mais,
  as mesmas três permissões que ele já tem na tabela das entradas da Prévia. A regra D11 pede a sua
  palavra para cada mudança de permissão, num pull request só dela.

  - (a) Aprovar essas três permissões, nessa tabela só.
  - (b) Não aprovar: a conferência no navegador não tem como entrar no app, e a etapa para.

  **Recomendo (a).** Veredito: nativo. É a forma da tabela das entradas da Prévia, que você já
  aprovou.

  **Respondida em 2026-11-23: "2. A".** As três permissões, só na tabela nova (a palavra D11, no
  [arquivo de aprovação](../approvals/o-builder-ve-o-que-construiu.md)).

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 | U1 | O navegador na máquina: o CLI `agent-browser` no template, o invólucro que aponta o Chromium da conferência, e `Machines.confer`, que abre a rede para um host, abre a tela, captura e devolve o que a página disse, e fecha a rede; a emenda da decisão 0051 | `infra/e2b/`, `apps/server/src/builder/machine/`, `package.json`, `package-lock.json`, `docs/decisions/0051-builder-machine-git-and-copy-in-r2.md`, `docs/reference/stack.md`, `.github/workflows/ci.yml` | security | nada: a ficha fechou (o G7 dela, pull request 1288) |
| G2 | U2 | O ambiente de conferência no Hub: a versão num Worker de conferência por Projeto, o esquema de teste vazio a cada conferência, a sessão de conferência, a chamada do app nesse ambiente, e a remoção junto com o Projeto | `packages/hub-api/src/`, `apps/server/src/hub/apps/`, `apps/server/src/hub/projects/`, `apps/server/src/hub/connectors/`, `apps/server/src/platform/company-postgres.ts`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `apps/server/src/main.ts`, `apps/edge/src/` (só teste) | data | U1 |
| G2 | U3 | O juiz: `Runs.check` faz a conferência da máquina e, se ela passou, a conferência no navegador; a falha volta ao modelo com o que a tela mostrou, pelo campo `judge` da ficha do Builder; os retratos do Builder regravados; o teste do defeito plantado com o modelo de verdade | `apps/server/src/builder/runs/`, `apps/server/src/builder/conversation/` (com os `requests/*.snapshot` do Builder), `packages/app/src/check/` (só teste) | testing | U2 |
| G3 | U4 | O fechamento: a linha de uso, as issues da dívida, o cartão apagado | `docs/steps/`, `docs/approvals/`, `docs/architecture.md` | delivery | o uso |

A ficha já fechou: a U3 escreve no juiz que a U6 dela pôs na ficha do Builder, e regrava os
retratos que a U1 dela gravou. G1 vem sozinho e primeiro: o template novo precisa estar publicado na E2B (a tag que
`HUB_MACHINE_TEMPLATE` lê) antes que G2 rode a conferência na nuvem. Em G2 o despachante não muda
de código, mas muda de pacote: `AppWorker` e as falhas das chamadas de app moram em
`packages/hub-api`, que o despachante embute e com que ele lê a resposta do Hub
(`apps/edge/src/hub.ts:48`, `:157-162`). O despachante novo vai ao ar antes do Hub novo: o velho
leria um `c-<projectId>` como resposta inválida (`EDGE_HUB_UNAVAILABLE`). G2 junta U2 e U3 porque o
contrato da conferência (`BuilderConfer`) entra com o seu primeiro chamador (o modelo do cartão). O passo 1 da U2 (a tabela, a
migração, as permissões e o retrato do catálogo) vai num pull request só dele, antes do resto de
G2, por D11 (a decisão 17 do firstmate). G3
é o pull request de fechamento, só de documentos, depois do uso (delivery L17, L19). Nenhuma unidade
corre em paralelo: U2 e U3 dividem `main.ts` e o contrato, e U3 chama `Machines.confer` de U1.

**Orçamento de código alterado.** U1: 320 (o template 20, `confer` e o seu relatório 220, a
emenda e a linha de `stack.md` à parte). U2: 760 (o contrato 70, a migração e as permissões 80, o
esquema de teste 130, a conferência no Hub 260, a chamada, os conectores e a remoção 160). U3: 280.
U4: só documento. Total da etapa: cerca de 1.300 linhas, dentro das 4.000 de delivery L2. Os testes não
contam.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Numa máquina do template novo, `agent-browser --version` imprime a versão do `package.json` da raiz, e `agent-browser open about:blank` abre o Chromium da conferência (o `chrome-headless-shell` de `/opt/conexus/browsers`) sem baixar outro | o ponto de conferência de G1, numa máquina E2B do template novo; a saída no pull request | must |
| 2 | U1 | `confer` abre a rede da máquina para a lista da própria máquina (`allowOut` de quando ela foi criada, hoje só o npm) mais o host pedido, e só isso, durante a conferência: de dentro, `curl https://<host>` responde e `curl https://example.org` falha. No fim, sucesso ou falha, a rede volta à lista da máquina: `curl https://<host>` falha | `apps/server/src/builder/machine/machine-confer.test.ts`, a ordem das chamadas ao `Kit` do dublê (abrir, comandos, fechar no `finally`, também com um comando que lança); o ponto de conferência de G1 com os dois `curl` numa máquina E2B | must |
| 3 | U1 | Uma tela que desenha e chama `POST /api/listarEncomendas` com 500 dá `DIRTY` com um `REQUEST_FAILED` (`POST`, `/api/listarEncomendas`, 500); o erro que o Chromium escreve no console por isso vai em `console`, que informa e não reprova (decisão 0055, a decisão 11 do firstmate); uma tela que só desenha dá `CLEAN`. Nos dois a captura fica em `node_modules/.conexus/tela.png` da pasta do app | `machine-confer.test.ts`, o CLI de verdade (`agent-browser` do `node_modules`) contra uma página HTTPS servida no teste, com o Chromium do Playwright, pela porta `machines.confer` sobre a máquina local de `world()` (`test-machine.ts`), como `machine-check.test.ts:12-30` prova `machines.check` | must |
| 4 | U1 | Um erro de JavaScript na página dá `PAGE_ERROR` com a mensagem; um pedido a outro host (bloqueado pela rede) não é `REQUEST_FAILED` e dá `CLEAN`, com o erro do console dele em `console` | `machine-confer.test.ts`, os mesmos dois casos | must |
| 5 | U1 | Um comando do navegador que não roda (saída diferente de zero, saída que não é o JSON do CLI, ou o prazo) é `CONFER_PLATFORM_FAILED`, nunca `CLEAN` nem `DIRTY`, e a rede fecha | `machine-confer.test.ts`, o dublê com saída 1 e com texto solto | must |
| 6 | U1 | No fim da conferência o navegador está fechado: `agent-browser close` roda no `finally`, e a conferência seguinte abre um Chromium novo, sem a sessão da anterior | `machine-confer.test.ts`, a lista de comandos; `agent-browser cookies` vazio depois de `close`, no CLI de verdade | must |
| 7 | U1 | O token da sessão de conferência chega ao app como o cookie `__Host-conexus-app` (o nome do despachante, `apps/edge/src/headers.ts:6-8`), só do host, `Secure`, `Path=/`, e não aparece em nenhum comando nem no log: entra num arquivo que o Hub escreve pelo `Transport`, lido por `cookies set --curl <arquivo> --url https://<host>/` e apagado no `finally`. As mensagens dos problemas (`BrowserProblem.message`, `console`) também não vão ao log | `machine-confer.test.ts`: o servidor HTTPS do teste diz se recebeu o cookie; o teste procura o token nos argumentos de cada comando e nas linhas do log, e uma mensagem marcada da página nas linhas do log | must |
| 8 | U1 | A decisão 0051 diz a regra nova: durante a conferência a máquina alcança também o host exato do app do seu Projeto, nunca `*.` do domínio dos apps, e só até o fim dela; diz que a E2B abre `8.8.8.8` sempre que a lista tem um domínio; e diz o limite da regra da E2B, que olha o nome pedido (o SNI no 443) e não o endereço, então um código na máquina alcança outro servidor que aceite o nome liberado | `npm run docs`; leitura do diff | must |
| 9 | U2 | `openConference` cria a linha de `apps.app` do Projeto quando não há e sobe a versão como o Worker `c-<projectId>` do namespace, com as marcas da empresa e do Projeto e o limite de CPU de `uploadVersion`; uma versão que não inicia (10021) volta `NOT_STARTING` e não toca o banco | `apps/server/src/hub/apps/conference.test.ts`, o dublê da Cloudflare de `send-guards.test.ts`; um caso com `NOT_STARTING` que confere que o Neon não foi chamado | must |
| 10 | U2 | Cada conferência começa com o esquema `app_<projectId>_check` vazio: o que a conferência anterior gravou some, e as migrações da versão rodam pela mesma regra de `migrateApp`. Uma migração recusada volta `MIGRATION_REFUSED` com a causa, e o esquema do app (o da Prévia) não muda | `conference.test.ts` no Postgres real (`test-database.ts`): uma conferência grava uma linha pelo login de conferência, a seguinte não a vê; uma migração com `DROP TABLE` volta recusada e `app_<projectId>` fica igual | must |
| 11 | U2 | Uma chamada ao app com a sessão de conferência chega ao Worker `c-<projectId>` com o login `app_<projectId>_check_run`; a mesma pessoa na Prévia continua no Worker da versão da Prévia e no login do app | `apps/server/src/hub/apps/app-handoff.test.ts`, pela porta `checkCall` (`createAppDoor`), um caso de cada ambiente | must |
| 12 | U2 | A sessão de conferência recusa: depois de `endConference`, depois de 10 minutos, em outro host, e para uma pessoa tirada do Projeto (`endAppSessions` apaga também as dela, S13). Cada recusa é `APP_SESSION_INVALID`, como uma sessão de app vencida | `app-handoff.test.ts`, um caso por recusa, o relógio pelo `statement_timestamp()` do Postgres | must |
| 13 | U2 | Apagar o Projeto remove o Worker `c-<projectId>` e o esquema e os logins de conferência, também quando o Projeto só conferiu (a linha de `apps.app` criada pela conferência, sem versão na Prévia). Apagar a empresa remove o Worker `c-<projectId>` de cada Projeto dela com linha em `apps.app`, além dos Workers das versões (`removeCompanyWorkers`, `hub/apps/removal.ts:118-140`, que hoje só lê `appVersion`) | `apps/server/src/hub/projects/projects-delete.test.ts`, dois casos novos pela rota de apagar o Projeto: um Projeto que só conferiu e um com Prévia que também conferiu; e o teste da remoção da empresa pela Central, um caso de uma empresa cujo Projeto só conferiu, com o dublê da Cloudflare dizendo que o `c-<projectId>` saiu | must |
| 14 | U2 | A migração nova passa em `npm run migrations` e no retrato do catálogo; `apps.check_session` só é lida e escrita pelo login da instalação, como `apps.app_session` | `npm run migrations -- --base origin/main`; `apps/server/src/platform/catalog.test.ts` (o retrato do catálogo contra `database-grants.sql`) | must |
| 15 | U3 | Um turno cuja tela recebe 500 da operação que a desenha recebe, no fim, nota 0 com o relatório da conferência no navegador: os pedidos que falharam, os erros e o caminho da captura. O modelo lê a captura com `mastra_workspace_read_file` e recebe a imagem | `apps/server/src/builder/conversation/conversation-check.test.ts`, caso novo, com a máquina e o Hub em dublê e o modelo de teste; a imagem pelo `read_file` com o `SandboxFilesystem` sobre o dublê | must |
| 16 | U3 | Uma conferência da máquina que falha não chega ao navegador: nenhum `confer` roda. Uma conferência no navegador que não pôde rodar (`CONFER_PLATFORM_FAILED`, ou o Hub fora) encerra o turno como `unchecked`, sem gastar volta, como a máquina que não conferiu | `conversation-check.test.ts`, dois casos | must |
| 17 | U3 | `conexus_check` e o fim do turno dão o mesmo relatório, pelo mesmo `Runs.check` | `conversation-check.test.ts`, o caso que já compara os dois, estendido | must |
| 18 | U3 | O teste do defeito plantado: a partir de `ENCOMENDAS_DEFEITO` (critério 23), o Builder de verdade, com o pedido "Confira e entregue o app", termina com a conferência `passed` sem que a conversa diga qual é o defeito, em até `CHECK_LIMITS.checks` voltas, com a versão salva. Passa quando acerta em pelo menos uma de duas corridas; o relatório traz as duas, com o que cada conferência disse | `apps/server/src/builder/conversation/builder.eval.test.ts`, caso novo; roda no ponto de conferência de G2, na nuvem, com a conta de modelo de teste | must |
| 19 | U3 | Os dois apps de teste da trilha (o CRM e o acompanhamento de vendedor) construídos uma vez com Claude dentro do Builder, com a conferência ligada; o número de voltas e o que cada conferência reprovou vão para o relatório | o ponto de conferência de G2 (a medida da página da trilha) | should |
| 20 | U3 | O tempo de uma conferência no navegador, do servidor de produção, e o tempo de cada parte (subir, banco, abrir, ler), medidos em cinco turnos, vão para o relatório | o ponto de conferência de G2 | should |
| 21 | U2 | Na conferência, `callAppConnector` responde `DONE` com `{ kind: 'NOT_GRANTED' }` e `listAppConnections` responde `DONE` com `names: []`, antes de ler a concessão ou a conexão: o dublê do conector não é chamado, e o despachante entrega ao app essas respostas como estão (`apps/edge/src/connectors.ts:35`, `:43`). A mesma pessoa na Prévia continua lendo. Um app cuja tela de entrada lê um conector e mostra "Sem conexão" no `NOT_GRANTED` passa a conferência (`CLEAN`), com a captura mostrando esse estado | `apps/server/src/hub/connectors/app-calls.test.ts`, um caso de cada rota e o da Prévia; `machine-confer.test.ts` com a página do teste respondendo `NOT_GRANTED` na operação da entrada; no ponto de conferência de G2, um app de teste que lê um conector na entrada, `CONECTOR_NA_ENTRADA` na forma de `Files`, conferido de verdade | must |
| 22 | U2 | O despachante lê a resposta do Hub com `version.worker: c-<projectId>` e encaminha a chamada ao Worker `c-<projectId>` do namespace; um nome fora de `^[vc]-` continua recusado como `EDGE_HUB_UNAVAILABLE` | `apps/edge/src/dispatcher-versions.test.ts`, caso novo com `test-edge.ts` | must |
| 23 | U3 | O app do defeito plantado, `ENCOMENDAS_DEFEITO`, os arquivos que mudam no app inicial na forma de `Files` (`packages/app/src/check/test-app.ts:25`), passa na conferência da máquina de hoje (todos os passos `passed` ou `informed`) e reprova na conferência no navegador: a operação `listarEncomendas` está declarada e tipada, mas o manipulador lê a tabela `encomenda`, que nenhuma migração cria; a lista recebe 500 e mostra "Erro ao carregar" | `packages/app/src/check/check.test.ts`, caso novo que roda a conferência da máquina sobre o app; a reprova no navegador no ponto de conferência de G2 | must |
| 24 | U3 | Os retratos do Builder (`B/conversation/requests/*.snapshot`, gravados pela U1 da ficha) são regravados com `--test-update-snapshots` no commit da U3, e só eles: o diff deles mostra só a descrição de `conexus_check`, o texto do juiz e o resultado de `conexus_check` com o `BuilderCheck`, e nenhum retrato dos outros três agentes muda. Depois do commit, `B/conversation/request.test.ts` passa duas vezes seguidas sem `--test-update-snapshots` | `B/conversation/request.test.ts` (da U1 da ficha, sem mudar); `git diff <base da U3> <commit da U3> -- 'apps/server/src/builder/**/requests/*.snapshot'`, lido na revisão | must |
| 25 | U2, U3 | Um Projeto sem endereço (`projects.project.host_label` nulo, de antes dos endereços) faz `openConference` devolver `NO_ADDRESS` sem subir Worker, sem tocar o banco e sem gravar `check_session`; o turno fica com o veredito da máquina, como hoje: passou a máquina, `passed`, e nenhum `confer` roda | `conference.test.ts`, o caso de um Projeto sem rótulo, com o dublê da Cloudflare e o Neon sem chamada; `conversation-check.test.ts`, o caso `NO_ADDRESS` | must |
| 26 | U2 | Uma consulta do app na conferência não escreve linha no Registro de dados: o aviso do despachante (`recordAppRead`) com a sessão de conferência é aceito e `recordRead` não é chamado; a mesma consulta com a sessão da Prévia escreve a linha de hoje | `apps/server/src/hub/apps/read-notice.test.ts`, um caso de cada sessão, pela rota do despachante; a sessão de conferência vem de `openConference` pela porta do Builder, como em `conference.test.ts`, nunca de uma linha escrita à mão | must |
| 27 | U3 | `conexus_check` que não pôde conferir (a máquina ou o navegador, `CHECK_PLATFORM_FAILED` ou `CONFER_PLATFORM_FAILED`) lança `CHECK_PLATFORM_FAILED`: a parte guardada tem `state: 'output-error'` e `errorText` com o código, e ao vivo o fim da ferramenta leva `isError: true`; a linha da conversa mostra "Não conseguiu conferir o app" e, aberta, "Não consegui conferir o app agora. Isso não diz nada sobre o app." (emenda de 2026-11-24; a frase de `CHECK_PLATFORM_FAILED` fica no cartão da versão, no fim do turno). Uma conferência que rodou, passando ou reprovando, devolve o `BuilderCheck` como resultado, sem erro | `conversation-check.test.ts`, caso novo com a máquina do dublê falhando, que lê o fim ao vivo e a parte guardada como `conversation-tools.test.ts:185-191`; a linha vem desses campos pelo `toolStatus` e pelo `reasonOf` da tela, que lê a frase do `thrownText` da linha de `conexus_check` (`tool-row-states.test.tsx`) | must |
| 28 | U1 | Uma conferência cuja página final não está no host do app (o despachante manda ao Hub quando a sessão é recusada, `toHub` em `apps/edge/src/dispatch.ts:85-111`, chamado em `:265` e `:269`, ou o `open` não navega) nunca dá `CLEAN` nem `DIRTY`: é `CONFER_PLATFORM_FAILED`. O host final vem de `agent-browser get url` (`commands.md:112` do 0.43.0), lido depois do `wait` | `machine-confer.test.ts`, com o servidor HTTPS do teste respondendo 302 para outro host | must |
| 29 | U2 | Uma conferência que acha o Projeto apagado no meio (a exclusão correu depois do upload) devolve `CONFER_PLATFORM_FAILED`, não grava `check_session` e não refaz o esquema de conferência | `conference.test.ts`, o Projeto marcado para exclusão entre o upload e `resetCheck` pelo dublê da Cloudflare, como os testes de envio param `prepare` | must |

Os critérios 21 a 23 entraram depois da leitura por outro modelo, o 24 com a releitura da ficha, o 25 e o 26 com a leitura do diff dela, o 27 com a releitura sobre `14a99007` (a decisão 15 do firstmate), e o 28 e o 29 com a leitura dela por outro modelo, no fim da tabela, para que os números dos outros não mudassem.

## A matriz de estados

A etapa não muda nem cria tela. O que a pessoa vê na conversa é a volta a mais de trabalho, que já
existe (a linha do turno com `rounds`), e o fim do turno com os estados de `VersionCheck` de hoje
(`packages/hub-api/src/conexus-parts.ts:25-30`). A linha de `conexus_check` que não pôde conferir
passa a mostrar "Não conseguiu conferir o app" na linha
(`apps/web/src/builder/conversation/tool-registry.ts:66`) e, no corpo aberto, "Não consegui conferir o app agora. Isso não diz nada sobre o app.", a
frase própria da linha do meio do turno, pela decisão 15 e a emenda de 2026-11-24; a frase de
`CHECK_PLATFORM_FAILED` fica no cartão da versão, no fim do turno.

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A conversa do Builder | sem mudança | sem mudança | sem mudança: a conferência é parte do trabalho do turno | `failed` e `unchecked` como hoje; a linha de `conexus_check` numa falha de plataforma mostra "Não conseguiu conferir o app" (decisão 15) | sem mudança | sem mudança | sem mudança |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Conference` (`OPENED`, `NOT_STARTING`, `MIGRATION_REFUSED`, `NO_ADDRESS`) | `openConference` (U2) | `Runs.check` (U3) |
| `Conference.url`, `Conference.session` | `openConference` | `Machines.confer` (U1): o host vai para a rede, a sessão para o arquivo de cookie |
| `BrowserReport` (`CLEAN`, `DIRTY`), `BrowserProblem` e `console` | `Machines.confer` (U1) | `Runs.check`, e o modelo pelo texto do juiz (U3); nunca o log |
| `BuilderCheck` (`MACHINE_FAILED`, `CONFERENCE_REFUSED`, `NO_ADDRESS`, `SEEN`) | `Runs.check` (U3) | o juiz (`conexusCheck`, no campo `judge` da ficha do Builder) e `conexus_check` (`processors.ts`), que lança nas duas falhas de plataforma (a decisão 15 do firstmate) |
| `apps.check_session.expires_at` | `openConference` | `admitCall` (U2) |
| `AppCall.version.worker` com `c-<projectId>` | `callTo` no ambiente `check` (U2) | o despachante, sem mudança de código e publicado de novo com o `packages/hub-api` novo (`apps/edge/src/hub.ts:157-162`, `dispatch.ts:184-225`) |
| `AppCall.database.login` com `app_<projectId>_check_run` | `callTo` no ambiente `check` | o `Db` do despachante, que deriva a senha pelo nome (`packages/hub-api/src/app-login.ts:30-40`) |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `cloudflare.upload` do Worker `c-<projectId>` | não acontece: o turno que confere segura o Projeto (`Runs.take`, `runs/runs.ts:102-129`, solto em `:297-298`), um por Projeto; quem chama `Runs.take` é o `take` do campo `turn` da ficha do Builder (`conversation/turn-of.ts:45`) | 10021: `NOT_STARTING`, o banco não é tocado, o modelo lê "o app não inicia" | `CONFER_PLATFORM_FAILED`: o turno termina `unchecked`, sem gastar volta | `APP_CONFERENCE_UPLOADED` com ids; a falha com o código da Cloudflare, sem corpo | 9, 16 |
| O esquema de teste refeito (`DROP SCHEMA ... CASCADE`, `ensureApp` de conferência, `migrate`) | o mesmo: o Projeto está seguro pelo turno | cada ato é uma transação (`company-postgres.ts:210-220`); um corte deixa o esquema meio feito, e a próxima conferência começa pelo `DROP` | Neon fora: `CONFER_PLATFORM_FAILED` | `APP_CONFERENCE_DATABASE_READY`, ou `APP_MIGRATION_REFUSED` com a regra, sem valor (C52) | 10, 16 |
| A conferência e a exclusão do Projeto ao mesmo tempo (`openConference` contra `claimForDeletion`, `hub/apps/removal.ts:30-40`, que só olha `sendingVersionId`) | `Runs.take` não segura a exclusão; `openConference` relê `projectLive` (`hub/apps/send.ts:106-110`) antes de cada ato, como `prepare` faz com `stopped()` (`send.ts:134-141`): antes do upload, antes de `resetCheck` e antes de gravar `check_session`. Achado apagado, devolve `CONFER_PLATFORM_FAILED` e não grava; o que já subiu, a remoção do Projeto leva (critério 13) | a exclusão que corre depois do upload remove o Worker `c-` e o esquema de conferência; a conferência que relê vê o Projeto apagado e para | o banco do Hub fora: `CONFER_PLATFORM_FAILED` | `APP_CONFERENCE_STOPPED` com ids | 13, 29 |
| O aviso de leitura do despachante com a sessão de conferência (`recordAppRead`, `recordNotice`) | não se aplica: não grava | não se aplica: responde antes de `recordRead` | não se aplica: nada é gravado | o registro da rota de hoje | 26 |
| As leituras por conector com a sessão de conferência (`callAppConnector`, `listAppConnections`) | não se aplica: só leitura, sem gravar | não se aplica: a resposta vem antes de ler a concessão | não se aplica: nada sai do Hub | o registro da rota de hoje, com `NOT_GRANTED` | 21 |
| `insert` e `delete` em `apps.check_session` | duas conferências do mesmo Projeto não correm juntas (acima); duas sessões de Projetos diferentes não se tocam | um `delete` que falha deixa a linha, e o `expires_at` a recusa em 10 minutos; `endAppSessions` apaga as da pessoa tirada | o banco do Hub fora: `CONFER_PLATFORM_FAILED` antes do navegador | nada além do registro da rota de hoje | 12 |
| `updateNetwork` de abrir e de fechar (`e2b`) | uma conferência por máquina: o juiz roda uma vez por volta | abrir que falha: `CONFER_PLATFORM_FAILED`, nada aberto; fechar que falha: `MACHINE_NETWORK_CLOSE_FAILED` no log, e a próxima partida da máquina fecha de novo (`machines.ts:194-197`) | E2B fora: o mesmo | `MACHINE_NETWORK_CLOSE_FAILED` com a conversa | 2 |
| Os comandos `agent-browser` (`cookies set`, `open`, `wait`, `screenshot`, `console`, `errors`, `network requests`, `close`) | o mesmo | um comando que não roda é `CONFER_PLATFORM_FAILED`; `close` e a remoção do arquivo de cookie rodam no `finally` | a máquina morta: `CONFER_PLATFORM_FAILED` | os tipos e as contagens de problemas, nunca as mensagens nem o `console` (podem trazer o que o app escreveu) | 3 a 7 |
| `machines.pack` antes da conferência no navegador | não acontece: um turno por Projeto | `TOO_LARGE`, `NOT_REGULAR`, `VERSION_INVALID`: `CONFER_PLATFORM_FAILED`, o turno `unchecked` | a máquina morta: o mesmo | `PREVIEW_PACK_REFUSED`, como hoje | 16 |
| `mastra_workspace_read_file` da captura, pelo modelo | não se aplica: leitura | não se aplica | a máquina morta: o erro da ferramenta, como hoje | o que a ferramenta já registra | 15 |

## A tabela de referência

| Peça | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Unidade | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Navegador do Builder dentro da máquina | nenhum: o passo `navegador` serve só os arquivos (`packages/app/src/check/browser.ts:32-45`) | `agent-browser` 0.43.0, `skill-data/vercel-sandbox/SKILL.md`; `@agent-browser/sandbox` 0.43.0 `dist/vercel.js:43-58`; E2B `use-cases/remote-browser.md:220` | o CLI instalado na imagem da máquina, uma ação por comando, a captura num arquivo | nativo | — | U1 | nenhum: muda `infra/e2b/template.ts` (`TOOLS`, o invólucro, um `runCmd`) |
| O Chromium do navegador | o `chrome-headless-shell` da conferência (`infra/e2b/template.ts:90`) | `agent-browser` 0.43.0 `commands.md:559` (`--executable-path`); a variável `AGENT_BROWSER_EXECUTABLE_PATH` | o CLI dirige um Chromium que ele acha ou que se aponta | embrulhado: o invólucro `/usr/local/bin/agent-browser`, porque `setEnvs` só vale no build (`e2b` 2.63.0 `index.d.ts:12660-12661`) | a implementação provada na E2B, teste 1 (`Chrome not found` sem ele) | U1 | o invólucro, escrito pelo template |
| Quem dirige o navegador | nenhum | `@mastra/core` 1.83.0 `workspace-BAqspXXH.js:6225-6233` (o Mastra reconhece `agent-browser`), `:6855-6882` (sem `browser` no workspace o comando roda como veio); `docs-browser.md:12-17` | comandos na sandbox | nativo: o juiz roda os comandos pelo `executeCommand` da sandbox que o Hub já usa (`machine/machines.ts:51-59`), e não pela ferramenta `mastra_workspace_execute_command` que as linhas do Mastra descrevem e a implementação provou (teste 2); abaixo das duas está o mesmo `executeCommand` da E2B | — | U1 | `machine/confer.ts` |
| A captura como imagem | nenhuma | `reference-workspace-workspace-class.md:490` (`mediaTypes` padrão com `image/png`); implementação provada, teste 2 | `read_file` devolve a imagem como parte de mídia | nativo; a captura fica em `node_modules/.conexus/`, dentro da pasta do app e fora do Git (`packages/app/src/check/report.ts:26`) | — | U1, U3 | — |
| Console, erros, pedidos | o `CONSOLE_ERROR` só informa (`browser.ts:141-143`, `run.ts:37-41`) | `agent-browser` 0.43.0 `commands.md:590-593` (`console`, `errors`), `:260` (`network requests`), `:547` (`--json`); vibesdk `9da158d` `worker/agents/think/browser-logs-tool.ts:16-24` | a lista de console, erros da página e pedidos falhos volta ao agente | nativo | — | U1 | — |
| O que o modelo sabe do CLI | o campo `skills` da ficha do Builder (`conversation/builder.ts:141-146`) | `agent-browser` 0.43.0 `skills/agent-browser/SKILL.md` | a skill do CLI | nativo; fica de fora: nesta etapa só o juiz dirige o navegador (a decisão 2 do firstmate) | — | — | — |
| Rede: só o endereço de conferência | `ALLOWED_HOSTS` (`machine/kit.ts:27`), aplicado em `machine/e2b.ts:26-28`, `:43`, `:59` | `e2b` 2.63.0 `index.d.ts:9753-9775` (`allowOut`, `denyOut`), `:9916-9930` (`updateNetwork` troca tudo); as provas na E2B, prova 2 | lista exata trocada com a máquina ligada | nativo | — | U1 | — |
| Rede: URLs da máquina privadas | `allowPublicTraffic: false` (`machine/e2b.ts:43`, pull request 1199) | `network/restrict-public-access.md:15-19` | 403 sem o token | nativo; já no `main` | — | fica de fora: feito | — |
| Rede: DNS | `8.8.8.8` aberto pela E2B quando há domínio na lista | `e2b` 2.63.0 `index.d.ts:9837-9866`; implementação provada, teste 3 | `dnsServers: []` fecha, mas o nome precisa estar em `/etc/hosts` | nativo; fica como hoje (a decisão 3 do firstmate) | — | U1 (só o texto da 0051) | — |
| Segunda cerca no navegador | nenhuma | `agent-browser` 0.43.0 `--help` (`--allowed-domains`), `skill-data/core/SKILL.md:260` | o navegador recusa outro domínio | nativo; fica de fora: a rede da máquina já cerca, e o juiz só abre um endereço | — | — | — |
| Onde a versão de conferência roda | Workers for Platforms, um Worker por versão (`hub/apps/send.ts:89-101`) | o mesmo Workers for Platforms; vibesdk `9da158d` `space/src/space/durable-object.ts:741-756` (Worker Loader) | o motor de produção carrega a versão | nativo: o mesmo `cloudflare.upload`, com um Worker por Projeto (a decisão 1 do firstmate) | — | U2 | `apps/server/src/hub/apps/conference.ts` |
| Dados da conferência | um esquema para Prévia e publicado (`packages/hub-api/src/app-login.ts:8-15`) | vibesdk `durable-object.ts:658`, `:694` contra `worker/services/deployer/think-user-deploy.ts:102-108` | o estado da prévia separado do publicado | embrulhado: um esquema irmão pelo mesmo `ensureApp` e `migrate` (`platform/company-postgres.ts:183-265`) | o fundador, "2. a" | U2 | — |
| Ambiente da sessão | o host diz o ambiente, `preview` ou `published` (`AppEnvironment`, `packages/hub-api/src/address.ts:54-55`; `appOfHost`, `:75-79`); as sessões não guardam ambiente: a coluna `environment` saiu com a U4 da Prévia (`apps/server/migrations/20261123013112_previa_environment_drop/migration.sql`) | vibesdk `durable-object.ts:834-846` (a rota própria da prévia) | um ambiente a mais | nativo: um terceiro valor, `check`, só na chamada (`CallEnvironment`) | — | U2 | — |
| A sessão do navegador | a sessão de app pela passagem (`hub/apps/handoff.ts:50-119`), pendurada na sessão do Hub | — (as referências põem o navegador fora do código julgado) | — | embrulhado: `apps.check_session` (a decisão 8 do firstmate), entregue pelo `cookies set --curl <arquivo> --url` do CLI (a decisão 9) | a prova local do cookie, variantes A a H | U1, U2 | — |
| Os conectores na conferência | `connectorCall` admite a sessão e lê a versão da Prévia (`hub/apps/handoff.ts:209-235`) | — | — | embrulhado: no ambiente `check`, as respostas que o app já trata, `NOT_GRANTED` e nenhuma conexão (a decisão 10 do firstmate) | — | U2 | — |
| Quem decide "terminei" | `conexusCheck` (`conversation/processors.ts:86-146`), no campo `judge` da ficha do Builder, `{ scorers: [conexusCheck(...)], strategy: 'all' }` (`conversation/builder.ts:159-162`); uma exceção dentro dele vira `unchecked` com a linha `CHECK_JUDGE_FAILED` no log (`processors.ts:128-142`, pull request 1300) | Mastra 1.83.0 `isTaskComplete`; bolt.diy `353b44c` `app/lib/common/agentLoop.ts:198-210`; vibesdk `worker/agents/core/behaviors/think.ts:322-327` | por código, no fim do turno; o vibesdk só pelo prompt | nativo; o juiz passa a esperar a conferência no navegador. O campo `judge` não muda: muda o que `conexusCheck` lê de `Runs.check` | — | U3 | — |
| O juiz da tela não ligada | `informed` não reprova (`packages/app/src/check/run.ts:37-41`) | vibesdk `browser-logs-tool.ts:16-24`, `think.ts:322-327` ("until the deploy succeeds and the console is clean") | repetir até o console limpo | nativo: o relatório do CLI decide; o cruzamento com o despachante fica de fora pela palavra do fundador ("1. A", 2026-11-23) | — | U3 | — |

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
  (as provas na E2B, prova 2, seção 4.3; o `accessTokenHash` que ele mostra não foi verificado).
  Nada do Conexus está ali.
- A regra de rede da E2B olha o nome no 443 (SNI) e o `Host` no 80, não o endereço: um código na
  máquina com o IP de outro servidor que aceite o nome liberado chega lá (as provas na E2B, prova
  2, seção 4.4). Vale hoje para o npm; a 0051 passa a dizer (critério 8).
- O cookie de conferência não é `HttpOnly` (a decisão 9 do firstmate): o JavaScript do app o lê.

## As decisões do firstmate

| # | Decisão reversível ([delivery L6](../guides/delivery.md)) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | Um Worker de conferência por Projeto, `c-<projectId>`, trocado a cada conferência, e não um por versão nem o Worker Loader | um por versão criaria até `CHECK_LIMITS.checks` Workers por turno no namespace da Prévia; o Worker Loader no despachante pede três provas na conta da Cloudflare que o estudo curto listou e não fez (o tempo de carga, o Browser Run, `worker_loaders` ao lado de `dispatch_namespaces`); o Projeto já é seguro por um turno de cada vez (`Runs.take`, `runs/runs.ts:102-129`, solto em `:297-298`; chamado pelo campo `turn` da ficha do Builder, `conversation/turn-of.ts:45`), então um Worker por Projeto nunca é trocado no meio de outra conferência | um Worker por versão, `v-<id>` da versão salva, com a poda de hoje |
| 2 | O juiz, e não o modelo, dirige o navegador nesta etapa | o estudo do navegador mediu que o modelo só vê o pedido falho se pensar em perguntar (seção 3); o vibesdk confere por prompt, e o Conexus já decide o fim do turno por código (`conversation/processors.ts:118-146`); dirigir por código tira do caminho a prova que faltou, "um modelo de verdade usando o CLI" | a skill do CLI no campo `skills` da ficha do Builder (`conversation/builder.ts:141`), com a rede aberta durante o turno |
| 3 | O DNS fica como hoje, com `8.8.8.8`, e a 0051 passa a dizer isso | `dnsServers: []` fecha o canal, mas pede o endereço de cada host em `/etc/hosts` (implementação provada, teste 3), e o do npm muda; o canal existe hoje pelo npm, com ou sem a conferência | `dnsServers: []` na conferência, com o Hub escrevendo `/etc/hosts` só durante ela |
| 4 | O navegador fecha no fim de cada conferência (`agent-browser close`) | o daemon vive uma hora parado por padrão (`commands.md:575`) e a máquina pausa em 5 minutos (`machine/e2b.ts:16`); fechar tira a dúvida do daemon numa conversa longa e não deixa a sessão de conferência no perfil | manter o navegador aberto entre voltas e medir |
| 5 | A conferência abre só a entrada do app (`/`) e espera `networkidle` | o critério do roteiro é a tela não ligada; a entrada é a tela que toda versão tem; o CLI avisa que `networkidle` pode não chegar numa página com SSE (`commands.md:171-177`), e o app de hoje não tem SSE | esperar um seletor que o app declare, quando o contrato tiver telas |
| 6 | A versão do CLI mora no `package.json` da raiz, como `devDependency` exata, lida pelo template como o `wrangler` (`template.ts:31-49`) | um dono só da versão (C26); o teste do critério 3 roda o mesmo CLI no CI | uma constante no template |
| 7 | Um pedido falho é um pedido ao host do app com status 400 ou mais, ou sem resposta; pedidos a outros hosts não contam | só o host do app está na rede; um pedido a outro host falha sempre, e contar isso reprovaria todo app que chama uma fonte | contar também os outros hosts |
| 8 | A entrada do navegador é uma sessão só da conferência, `apps.check_session`: um app, o ambiente `check`, em nome da pessoa do turno, apagada no fim e vencida em 10 minutos | o navegador da máquina não deve ter a sessão do Hub da pessoa; pendurar a conferência na sessão do Hub (como a Prévia) mataria a conferência quando a pessoa sai do Hub com o turno trabalhando, e o Hub teria de guardar qual sessão começou cada turno; as duas formas dão a mesma tela ao fundador | a sessão de app de hoje, com `hub_session_id` da sessão que começou o turno |
| 9 | O cookie entra por `cookies set --curl <arquivo> --url https://<host>/`, sem `HttpOnly` | a prova local do cookie (fora do repositório, delivery L21), com o `chrome-headless-shell` 1243 do template e um servidor HTTPS: `--domain <host>`, a forma da primeira versão deste cartão, é recusada pelo Chrome (`Invalid cookie fields`: o prefixo `__Host-` proíbe `Domain`); `--curl` com `--url` grava o cookie só do host, `Secure`, `Path=/`, e o servidor o recebe no primeiro `open`; os campos `httpOnly` do arquivo são ignorados; `close` deixa a sessão seguinte sem cookie. O `HttpOnly` só vem com o token na linha de comando (`cookies set <nome> <valor> --url --secure --http-only`), contra o critério 7. Sem `HttpOnly`, o JavaScript do app lê o token, que só abre aquele app, no banco de teste, sem conectores, por 10 minutos, e o código do app já roda nessa máquina | o token na linha de comando com `--http-only`, com o comando fora do log |
| 10 | Na conferência os conectores respondem como sem conexão liberada (`NOT_GRANTED`, nenhuma conexão), por um ramo explícito em `connectorCall` (C21) | tomada na mesma linha da palavra do fundador sobre o banco de teste vazio: a conferência não toca o real. Uma falha nova não serviria: o despachante entrega ao app qualquer recusa do Hub como `UNREACHABLE` (`apps/edge/src/connectors.ts:33-38`), que o app trata como erro, e a conferência reprovaria um app sem defeito; `NOT_GRANTED` e a lista vazia são respostas que o app já trata (`packages/app-contract/src/connectors.ts:13-26`). Custo: o que lê conector é conferido só sem conexão. Sem o ramo, a sessão de conferência passaria por `connectorCall` (`hub/apps/handoff.ts:213-239`), que leria a concessão da versão da Prévia e chamaria a conexão real da pessoa | o ambiente `check` lido como a Prévia em `connectorCall` |
| 11 | Um erro de console informa e não reprova; reprovam o erro da página e o pedido falho | a decisão 0055 (`packages/app/src/check/browser.ts:141-143`): o console de hoje só informa; o Chromium escreve no console cada pedido bloqueado de outro host (implementação provada, teste 2, `net::ERR_CONNECTION_CLOSED`), e contar isso reprovaria todo app que chama uma fonte | o erro de console reprovar, com a lista do que se ignora |
| 12 | A conferência abre o host do app publicado (`HostLabel`, `appHostOf` com o rótulo do Projeto), nunca o da Prévia; `check_session.host_label` guarda esse rótulo, e o ambiente `check` vem da tabela, não do host | depois da Prévia em endereço próprio, o host diz o ambiente (`appOfHost`, `packages/hub-api/src/address.ts:75-79`) e o despachante o lê para a política e o cookie (`apps/edge/src/dispatch.ts:255-258`); o host da Prévia é feito para o quadro do Hub (`SameSite=None; Partitioned`, `apps/edge/src/headers.ts:44-56`) e, sem sessão válida, mostra `EDGE_PREVIEW_OUTSIDE_HUB` fora do quadro (`dispatch.ts:86-90`); o navegador da conferência abre a página no topo, como uma aba do app publicado. O rótulo é o mesmo nos dois hosts, então `projectOfHost` acha o Projeto também quando ele nunca foi publicado (`hub/apps/handoff.ts:163-164`) | o host da Prévia, com o navegador mandando `Sec-Fetch-Dest: iframe` |
| 13 | Um Projeto sem endereço não tem conferência no navegador: `openConference` devolve `NO_ADDRESS`, e o juiz fica com o veredito da máquina, como hoje | `projects.project.host_label` aceita nulo (`hub/projects/tables.ts:39`), e as telas já tratam o nulo (`addressesOf`, `hub/projects/hosts.ts:45-51`, e `:68`); todo Projeto novo nasce com rótulo (`PROJECT_NAME_NO_ADDRESS`, `hub/projects/projects.ts:96-101`), então o nulo é só de antes dos endereços, e esse Projeto também não tem Prévia para abrir. `unchecked` diria que a máquina não conferiu (`VersionCheck`, `packages/hub-api/src/conexus-parts.ts:25-30`), e reprovar daria ao modelo um defeito que ele não corrige | o turno `unchecked` com `CHECK_PLATFORM_FAILED` |
| 14 | O Registro de dados não guarda as consultas da conferência: `recordNotice` responde sem chamar `recordRead` quando `admitCall` dá o ambiente `check` | depois de `044e16c3` o despachante avisa o Hub de cada `db.query` do app (`apps/edge/src/db.ts:58-77`), e `recordNotice` grava a leitura em nome da pessoa (`hub/apps/read-notice.ts:14-27`); a conferência lê só o esquema de teste, vazio no começo e sem dado da empresa (a palavra "2. a"), e cada conferência faria linhas que a pessoa não pediu no Registro dela | gravar com uma marca de conferência |
| 15 | `conexus_check` que não pôde conferir lança o código `CHECK_PLATFORM_FAILED`, pelo caminho nativo de falha de ferramenta, em vez de devolver `{ error, message, isError: true }` como resultado; as duas falhas de plataforma (a da máquina e a do navegador) dão esse código, como já dão no fim do turno | a auditoria do harness de 2026-11-23 (achado FERR-2, a parte de `conexus_check`, posta no `A1` porque ele já mexe nessa ferramenta): o laço do Mastra só marca erro quando o `execute` lança (`@mastra/core` 1.83.0, prateleira `d60ba71b`, `packages/core/src/loop/shared/steps/tool-result-commit-core.ts:142-146`, a parte guardada como `output-error` com `errorText`; ao vivo, o pedaço leva `isError: true`, que o controlador lê em `packages/core/src/agent-controller/tool-result.ts:8-21`), como o Conexus já prova em `B/conversation/conversation-tools.test.ts:185-191`; o `isError` de `PLATFORM_FAILED` (`conversation/processors.ts:25-30`) não chega a lugar nenhum, e a tela mostra "Conferiu o app" (`apps/web/src/builder/conversation/tool-registry.ts:62-69`, `toolStatus` em `:129-147`); a parte guardada como `output-error` chega à tela como erro por `rows.ts:187`. O código sozinho como texto do erro é o que a tela traduz (`reasonOf`, `apps/web/src/builder/conversation/tool-bodies.tsx`); a frase de `packages/hub-api/src/conversation-failures.ts:150-155` ("O código ficou guardado sem conferência") é a do fim do turno e é falsa numa linha no meio dele, então a linha de `conexus_check` diz a sua, "Não consegui conferir o app agora. Isso não diz nada sobre o app." (`thrownText`, emenda de 2026-11-24, conferência do G2, achado 3); o modelo lê o código, e `CHECK_DESCRIPTION` passa a dizer o que ele quer dizer. A linha do turno no log ganha `failedTool: 'conexus_check'` (`conversation/end.ts:135`, `turn-line.ts:46`, `:76`), como qualquer ferramenta que falha | o resultado de hoje, com `isError` decorativo |
| 16 | `confer.ts` nasce em `B/machine/`, ao lado de `machines.ts` e `check.ts`, e não numa pasta `harness/machine/` criada antes da etapa 2; `hub/apps/conference.ts` nasce em `hub/apps/`, fora da árvore do Builder | a página da trilha manda que, desde o `A1`, todo arquivo novo nasça na pasta alvo da auditoria (`docs/steps/trilhas/agentes-e-apps.md:110`); a pasta alvo de `B/machine/` é `harness/machine/`, e a auditoria põe a mudança da pasta inteira num pull request de codemod da etapa 2, com as unidades U-c e U-f partindo "do que o `A1` deixar em `B/machine/`" (relatório da auditoria, seção 6). Criar `harness/machine/` só para `confer.ts` partiria a máquina em duas pastas até o codemod, e o codemod a move inteira de uma vez. `hub/` não muda de árvore na etapa 2 | `confer.ts` em `harness/machine/` já na U1, com `machines.ts` importando de lá |
| 17 | O passo 1 da U2 (a tabela `apps.check_session`, a migração, as três permissões de `hub_runtime` e o retrato do catálogo) vai num pull request só dele, antes do resto de G2 | D11 pede que a lista de papéis e permissões mude só num pull request próprio, com a palavra do fundador (`docs/guides/data.md:38-39`); a tabela sem código que a use não muda nada que alguém veja | a migração no mesmo pull request de G2 |
| 18 | Um `pack` recusado ou perdido antes da conferência no navegador é `CONFER_PLATFORM_FAILED`, e o turno fica `unchecked` | a versão que não empacota também não chega à Prévia (`runs.ts:303-318`, `PREVIEW_PACK_REFUSED`); dar `passed` diria que a tela foi vista, e reprovar daria ao modelo um defeito do tamanho da pasta que a conferência não mostra | manter o veredito da máquina (`passed`) |

## O que mudou no `main` desde a primeira leitura

A primeira versão deste cartão foi escrita contra o cartão da ficha, sem nenhum grupo dela no
`main`. Em `14a99007` a ficha está inteira, com as correções da auditoria do harness e o G0a e o G0b
do Lago 2. Cada item diz o que mudou e onde o cartão mudou por isso.

- **O juiz, na ficha.** O que o cartão previa entrou: o juiz é o campo `judge` da ficha do Builder,
  `{ scorers: [conexusCheck({ runs, storage, log })], strategy: 'all' }`
  (`conversation/builder.ts:159-162`), e a conferência nova entra nele sem mudar o campo, pelo
  `Runs.check` que `conexusCheck` já chama. As skills são o campo `skills` (`builder.ts:141-146`) e
  a trava do Projeto é o `take` do campo `turn` (`builder.ts:163`, `conversation/turn-of.ts:45`),
  que chama `Runs.take` (`runs/runs.ts:102-129`) como antes. Mudou: a linha "Quem decide
  'terminei'", a linha "O que o modelo sabe do CLI", a decisão 2, a matriz de estados e a U3, que
  deixam de dizer "depois da U6 da ficha".
- **Os retratos do Builder.** Existem: `B/conversation/request.test.ts` e os dois retratos de
  `B/conversation/requests/` (`primeiro-turno.snapshot`, `juiz-reprova.snapshot`). Os outros três
  agentes têm os seus em `B/assistant/requests/`, `B/agents/requests/` e `B/construtor/requests/`;
  o critério 24 os nomeia.
- **O juiz que lança registra a causa** (auditoria, TURN-1, issue 1294, pull request 1300).
  `conexusCheck` recebe `log` e, quando `judge` lança, grava `CHECK_JUDGE_FAILED` com a conversa e
  o `runId` antes de dar o turno por `unchecked` (`processors.ts:128-142`). A U3 não muda esse
  `catch`: as falhas da conferência no navegador chegam como `Result` e dão `unchecked` pelo
  caminho de hoje (`processors.ts:105-108`); só um defeito que lance cai no `catch`, e ali já fica
  registrado. Mudou: as linhas que a U3 cita de `processors.ts`, que desceram três.
- **`conexus_check` e o `isError` decorativo** (auditoria, FERR-2, "a parte de `conexus_check` no
  `A1`"). Entra na U3 como a decisão 15 do firstmate e o critério 27.
- **A máquina da conversa** (auditoria, MACH-2, issue 1291, pull request 1300). A partida no modo
  `resume` lista antes do `start` (`B/machine/conversation.ts:172-183`). É a máquina do Assistente
  e dos agentes; a do Builder parte por `machines.ts`, que a U1 muda, e lá nada mudou. As unidades
  U-c e U-f da etapa 2 (o caminho morto do `SandboxFilesystem`, a máquina como campo da ficha) vêm
  depois deste marco e se apoiam no que a U1 deixar em `B/machine/`: a U1 não as antecipa.
- **O que lê o modelo cabe na C79** (issue 1292, pull request 1300, `platform/model-text.ts`). O
  texto do juiz leva o relatório do navegador com `CHECK_LIMITS.problems` itens no máximo, cada
  mensagem cortada como `Problem.message`; não passa pelo `toldText`, que é das respostas de
  fornecedor. Não muda nada aqui.
- **A Prévia, depois da primeira leitura** (U4 dela, `b970d889`). A coluna `environment` saiu de
  `apps.handoff` e de `apps.app_session`, com as restrições `handoff_environment` e
  `app_session_environment`. O ambiente de uma sessão vem só do host. Mudou: a linha "Ambiente da
  sessão" e o contrato da U2, que dizia que as colunas ficavam.
- **O Lago 2, G0a e G0b** (pull requests 1301, 1305 e 1306). As cópias saíram do Hub:
  `projectDatabase` (o modelo do passo 3 da U2 para criar a linha de `apps.app`), a revogação das
  cópias na remoção do Projeto (`copies().revokeAllOf`) e a devolução das permissões em
  `openAppDatabase` não existem mais, e `company-postgres.ts` perdeu as funções da cópia (as linhas
  citadas desceram 40). Mudou: o passo 3 da U2, que cria a linha como `lockApp`
  (`hub/apps/versions.ts:95-110`), e as linhas de `company-postgres.ts`, `app-database.ts`,
  `removal.ts`, `handoff.ts`, `routes.ts`, `public.ts` e `main.ts` da U2.
- **O que não mudou.** `infra/e2b/`, `packages/app/src/check/`, `B/machine/machines.ts`, `kit.ts`,
  `e2b.ts`, `check.ts`, `B/runs/context.ts`, `B/conversation/test-conversation.ts`, a decisão 0051
  e o despachante (`apps/edge/src/`) estão iguais entre `b2406e07` e `14a99007`.

## U1 O navegador na máquina

**Base e modelo.** `main` no commit em que G1 começa (o cartão leu `044e16c3` e releu `14a99007`;
`B/machine/machines.ts`, `kit.ts`, `e2b.ts`, `check.ts`, `test-machine.ts`, `infra/e2b/` e
`packages/app/src/check/` estão iguais nos dois). Sonnet: um pacote no template e uma função que roda comandos e
lê JSON.

### As linhas da tabela

- **Navegador do Builder dentro da máquina.** Na base: `infra/e2b/template.ts:42-49` (`TOOLS`),
  `:52-55` (`CHECK`), `:83-96` (o `runCmd` de root). Na referência: a forma provada pela
  implementação na E2B, `scripts/template-teste.ts`, que este cartão copia como está na seção
  "A ordem do trabalho".
- **O Chromium do navegador.** `template.ts:90` instala o `chrome-headless-shell` em
  `${BROWSERS}`; o invólucro o aponta com `AGENT_BROWSER_EXECUTABLE_PATH`.
- **Quem dirige o navegador.** `machine/machines.ts:51-59` (`run`, com prazo e saída limitada),
  `:285-291` (`check`, o modelo de função que roda na sessão da conversa);
  `machine/check.ts:30-58` (`checkIn`, que recebe o `exec` e por isso roda no teste sem E2B).
- **A sessão do navegador.** A prova local do cookie: só `cookies set --curl <arquivo> --url
  https://<host>/` grava o `__Host-conexus-app` (a decisão 9 do firstmate).
- **Console, erros, pedidos.** `commands.md:590-593`, `:260`, `:547`; o formato JSON de cada um é
  o que o CLI imprime com `--json` (ler a saída de verdade no passo 2, e registrar o esquema Zod).
- **Rede.** `machine/e2b.ts:26-28` (`egress`), `:59` (`closeNetwork`); `machines.ts:194-197` (a
  partida de uma máquina achada fecha a rede).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `infra/e2b/template.ts` | Muda: `agent-browser` em `TOOLS`, o invólucro, o `printf` dele | o build do template (firstmate) |
| `package.json`, `package-lock.json` | Muda: `devDependencies` ganha `agent-browser` exato | o template (`versionOf`), `machine-confer.test.ts` |
| `apps/server/src/builder/machine/kit.ts` | Muda: o `Kit` ganha `openNetwork(extra)` | `machines.ts` |
| `apps/server/src/builder/machine/e2b.ts` | Muda: `openNetwork` pelo `updateNetwork` com `egress([...options.allowOut, ...extra])` | `createE2bKit` |
| `apps/server/src/builder/machine/confer.ts` | Cria: `conferIn` (interno à pasta), os comandos, o esquema do JSON do CLI, `BrowserReport` | `machines.ts`; os testes entram por `machines.confer` (T5) |
| `apps/server/src/builder/machine/machines.ts`, `port.ts`, `public.ts` | Muda: `Machines.confer` | `builder/runs/` (U3) |
| `apps/server/src/builder/machine/test-machine.ts` | Muda: o dublê do `Kit` ganha `openNetwork` | os testes da máquina |
| `docs/decisions/0051-builder-machine-git-and-copy-in-r2.md` | Muda: a emenda da rede | — |
| `docs/reference/stack.md` | Muda: a linha de `agent-browser` | `npm run docs` |
| `.github/workflows/ci.yml` | Muda: o job `server` instala o `chrome-headless-shell` como os jobs `web`, `web-sweep` e `packages` já fazem (`npm exec -w @conexus/web -- playwright-core install chromium-headless-shell`, `ci.yml:314`); hoje o job `server` (`:255-292`) não tem navegador | o CI, os critérios 3, 4, 6 e 28 |

### Os contratos que a unidade cria

Em `apps/server/src/builder/machine/confer.ts`, exportados por `machine/public.ts`:

```ts
/** O que reprova a tela. O erro de console só informa (decisão 0055), e vai em `console`. */
export type BrowserProblem =
  | { kind: 'PAGE_ERROR'; message: string }
  | { kind: 'REQUEST_FAILED'; method: string; path: string; status: number | null }

export type BrowserReport =
  | { kind: 'CLEAN'; shot: string; console: string[] }
  | { kind: 'DIRTY'; problems: BrowserProblem[]; shot: string; console: string[] }

export type ConferPlatformFailed = 'CONFER_PLATFORM_FAILED'

/** O endereço do app no ambiente de conferência e a sessão que o abre. */
export type ConferAt = Readonly<{ url: URL; session: AppSessionToken }>

/** A conferência sobre o que a máquina dá, como `checkIn`: o teste passa um `exec` local. */
export function conferIn(
  input: Readonly<{
    exec: TimedExec
    files: Readonly<{ write(path: string, text: string): Promise<void> }>
    network: Readonly<{ open(extra: readonly string[]): Promise<void>; close(): Promise<void> }>
    workdir: string
    at: ConferAt
    log: FailureLog
  }>,
): Promise<Result<BrowserReport, ConferPlatformFailed>>
```

`Machines.confer` só liga `conferIn` ao `Kit` da conversa: `run` como `exec`, `Transport.write`
como `files.write` (o `Transport` não muda: só tem `write` e `read`, `kit.ts:42-46`), `openNetwork` e `closeNetwork` como `network`. `problems` e `console` guardam no máximo
`CHECK_LIMITS.problems` itens, cada mensagem cortada como `Problem.message`
(`packages/app/src/check/report.ts:9-12`).

Em `port.ts`, no `Machines`:

```ts
confer(input: { conversationId: ConversationId; at: ConferAt }): Promise<Result<BrowserReport, ConferPlatformFailed>>
```

E no `Kit` (`kit.ts`): `openNetwork(extra: readonly string[]): Promise<void>`, ao lado de
`closeNetwork`: a lista da máquina (`options.allowOut`) mais `extra`, para que abrir e fechar
partam da mesma lista.

A forma de cada coisa:

- **Cada estado** como união: `BrowserReport` por `kind`; `BrowserProblem` por `kind` (C21, C22).
- **Cada id**: `AppSessionToken` é a marca do contrato (`packages/hub-api`), conferida por quem a
  cria (U2); `shot` é o caminho relativo à pasta do app, `node_modules/.conexus/tela.png`.
- **O dono de cada fato compartilhado**: o caminho da captura é uma constante de `confer.ts`, ao
  lado de `WORK_FOLDER` (`packages/app/src/check/report.ts:26`), importado de lá (C26). O host a
  mais é `url.hostname`, passado só por `conferIn`; a lista da máquina é do `Kit`.
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
     só para o host do app (a decisão 7 do firstmate); o console em `console`, sem reprovar (a
     decisão 11).
   - **Testes:** `machine-confer.test.ts`, os casos dos critérios 3 e 4.
   - **Mutações à mão:** trocar `>= 400` por `> 400` → o 404 vira `CLEAN`, o caso do critério 3
     fica vermelho; tirar o filtro de host → o caso do pedido a outro host do critério 4 fica
     vermelho; contar o console como problema → o mesmo caso fica vermelho.
3. **A rede e o `confer`.** Critérios: 2, 5, 6, 7, 28.
   - **Arquivos:** muda `kit.ts`, `e2b.ts`, `confer.ts`, `machines.ts`, `port.ts`, `public.ts`,
     `test-machine.ts`.
   - **O que entra:** `openNetwork(extra)` é
     `sandbox.e2b.updateNetwork(egress([...options.allowOut, ...extra]))`: o `updateNetwork` troca
     a regra inteira (`index.d.ts:9916-9930`), então abrir e fechar mandam a lista toda. O
     `conferIn` escreve o cookie (`[{"name":"__Host-conexus-app","value":<token>}]`) por `files`
     num arquivo fora da pasta do app, roda `open` sem endereço (o navegador limpo),
     `cookies set --curl <arquivo> --url https://<host>/` (nunca `--domain`: a decisão 9), `open`,
     `wait --load networkidle`, `get url` (o host final diferente do pedido é
     `CONFER_PLATFORM_FAILED`, critério 28), `screenshot <shot>`, `console --json`, `errors --json`,
     `network requests --json`, e no `finally` `close`, `rm -f <arquivo>` pelo `exec` e `closeNetwork`. Cada
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

Critérios 3 a 7 e 28: `machine-confer.test.ts`, sempre pela porta `machines.confer` sobre
`world()`, o CLI de verdade nos critérios 3, 4, 6 e 28, o dublê do `Kit` no 2, 5 e 7. Hoje não há navegador nenhum na máquina do Builder: os casos não têm o que
chamar. Critérios 1 e 2: o ponto de conferência, numa máquina E2B do template novo. Critério 8:
`npm run docs`.

### Parar se

- O CLI no CI não acha o Chromium do Playwright: o teste aponta `AGENT_BROWSER_EXECUTABLE_PATH`
  para o `executablePath()` do `chromium-headless-shell` do `playwright-core`, como o invólucro faz
  na máquina; se ainda assim não achar, pare, com a saída do job `server`.
- `cookies set --curl <arquivo> --url` deixa de gravar o cookie `__Host-` no CLI fixado (a prova
  local do cookie passou com 0.43.0): pare, com a saída, porque a entrada é a decisão 9.
- O caso do critério 3 passa no CI com o Chromium do Playwright do repositório e falha na máquina,
  que tem o `chrome-headless-shell` 1243 do template: pare, com as duas saídas.
- A saída `--json` de algum comando não traz o status do pedido: pare, com a saída.

## G1 O ponto de conferência

`npm run check`; os testes de `builder/machine/`; o build do template novo na E2B com a tag de G1
(firstmate, com a chave da conta de hoje); numa máquina desse template, os comandos dos critérios 1
e 2 com `example.com` como host liberado, e um `confer` contra `example.com`, com o cookie de teste
lido de volta por `agent-browser cookies`. As saídas no pull
request. Nenhuma tela muda.

## U2 O ambiente de conferência no Hub

**Base e modelo.** A cabeça de G1 já em `main`. Opus: uma tabela nova, um ambiente novo na porta do
app e um esquema irmão no banco de cada empresa, que se cruzam com a remoção do Projeto.

### As linhas da tabela

**Relidas na base da U2.** Entre `044e16c3` e `b2406e07` a Prévia em endereço próprio mudou
`hub/apps/handoff.ts`, `hub/apps/tables.ts`, `hub/apps/public.ts`, `hub/projects/hosts.ts`,
`hub/connectors/app-calls.ts`, `platform/company-postgres.ts`, `main.ts`, `database-grants.sql`,
`packages/hub-api/src/apps.ts` e o despachante (`apps/edge/src/dispatch.ts`, `hub.ts`, `headers.ts`,
`connectors.ts`, `db.ts`, `test-edge.ts`, `dispatcher-versions.test.ts`), e criou
`hub/apps/read-notice.ts`. Entre `b2406e07` e `14a99007` a U4 da Prévia tirou a coluna
`environment` das sessões, e o G0a e o G0b do Lago 2 tiraram as cópias de `app-database.ts`,
`removal.ts`, `routes.ts`, `public.ts`, `company-postgres.ts` e `main.ts` (a seção "O que mudou no
`main` desde a primeira leitura"); `send.ts`, `cloudflare.ts`, `app-login.ts`, `address.ts`,
`hosts.ts`, `app-calls.ts`, `read-notice.ts` e o despachante não mudaram. As linhas abaixo estão em
`14a99007`. Quatro mudanças tocam a forma da U2:

- o host diz o ambiente, e `admitCall` o tira do host (`appOfHost`, `hub/apps/handoff.ts:163`); as
  sessões não guardam ambiente; por isso o ramo `check` do passo 4 dá o ambiente pela tabela
  `check_session`, antes de `appOfHost`;
- o despachante escolhe a política e o cookie pelo ambiente do host, e o host da Prévia é feito para
  o quadro do Hub; por isso a conferência abre o host do app publicado (a decisão 12 do firstmate);
- o despachante avisa o Hub de cada `db.query` do app (`apps/edge/src/db.ts:58-77`), e o aviso passa
  por `admitCall` (`hub/apps/read-notice.ts:14-27`); por isso o aviso na conferência não grava (a
  decisão 14);
- `projectDatabase` saiu com as cópias; a linha de `apps.app` nasce como no primeiro envio
  (`lockApp`, `hub/apps/versions.ts:95-110`), e a remoção do Projeto não revoga mais cópia antes de
  `dropApp` (`hub/apps/removal.ts:56-63`).

O builder relê cada linha desta seção na base da U2.

- **Onde a versão de conferência roda.** Na base: `hub/apps/send.ts:89-101` (`uploadVersion`),
  `:129-155` (`prepare`: o Worker primeiro, depois o banco, decisão 0046).
- **Dados da conferência.** `platform/company-postgres.ts:183-207` (`schemaStatements`),
  `:210-220` (`ensureApp`), `:229-265` (`migrate`), `:267-294` (`dropApp`);
  `hub/apps/app-database.ts:37-69` (`openAppDatabase`), `:74-110` (`migrateApp`);
  `hub/apps/versions.ts:95-110` (`lockApp`, que cria a linha de `apps.app` no primeiro envio);
  `packages/hub-api/src/app-login.ts:8-15`.
- **Ambiente da sessão e a sessão do navegador.** `hub/apps/tables.ts:33-71`;
  `hub/apps/handoff.ts:134-187` (`admitCall`), `:242-279` (`callTo`), `:285-294`
  (`endAppSessions`); `hub/projects/hosts.ts:137-163` (`admitToApp`, que recebe `AppEnvironment` e
  não muda: o ramo `check` lhe passa `preview`).
- **Os conectores na conferência.** `hub/apps/handoff.ts:209-235` (`connectorCall`, a porta das
  duas rotas, `main.ts:200`, `hub/apps/public.ts:100`); `hub/connectors/app-calls.ts:74-133`
  (`createAppCalls`, que já devolve `NOT_GRANTED` e `[]` para o que a versão não declarou);
  `apps/edge/src/connectors.ts:26-47` (o despachante entrega o `DONE` como veio e o resto como
  `UNREACHABLE`).
- **O despachante.** `apps/edge/src/hub.ts:48`, `:157-162` (a resposta lida pelo esquema de
  `checkAppCall`); `apps/edge/src/dispatcher-versions.test.ts` e `test-edge.ts` (o modelo do teste).
- **A remoção.** `hub/apps/removal.ts:56-112`; `platform/cloudflare.ts:324-330` (`removeWorkers`,
  genérico no id).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/apps.ts` | Muda: `AppWorker` aceita `c-<id>`; `appCheckWorkerOf` | o despachante (sem mudança de código, publicado de novo), `conference.ts`, `removal.ts` |
| `apps/edge/src/dispatcher-versions.test.ts` | Muda: o caso do critério 22 | — |
| `packages/hub-api/src/app-login.ts` | Muda: `appCheckLogin` | `company-postgres.ts`, `handoff.ts` |
| `packages/hub-api/src/index.ts` | Muda: exporta `appCheckWorkerOf`, `appCheckLogin` e `AppLogins`; tira `SUBSCRIPTION_KINDS` da lista (issue 788: só `model-accounts.ts` o lê) | o servidor e o despachante |
| `apps/server/src/hub/apps/live.ts` | Muda: só os dois comentários de mais de 100 colunas (`:19`, `:41`), quebrados em linhas (issue 753, item 4) | — |
| `apps/server/src/hub/apps/tables.ts`, `apps/server/migrations/`, `apps/server/database-grants.sql` | Muda e cria: `CallEnvironment`; `apps.check_session` | `handoff.ts`, `conference.ts` |
| `apps/server/src/platform/company-postgres.ts` | Muda: `resetCheck`, `migrate` com o conjunto de logins, `dropApp` com o esquema de conferência | `conference.ts`, `app-database.ts`, `removal.ts` |
| `apps/server/src/hub/apps/send.ts`, `app-database.ts` | Muda: `uploadVersion` recebe o nome do Worker; `migrateApp` passa `appLogin` a `migrate` | `prepare`, `conference.ts` |
| `apps/server/src/hub/apps/conference.ts` | Cria: `openConference`, `endConference` | `apps/server/src/main.ts` (a porta do Builder) |
| `apps/server/src/hub/apps/repair.ts`, `repair.test.ts` | Muda: as chamadas de `uploadVersion` (`repair.ts:126`) e `migrateApp` (`:198`) com a assinatura nova | o reparo dos apps no começo |
| `apps/server/src/platform/test-app-ports.ts`, `test-company-postgres.ts`, `company-postgres.test.ts` | Muda: `migrate` com o par de logins (`test-app-ports.ts:52`) | os testes dos apps |
| `apps/server/src/hub/projects/` (a porta `ProjectPorts`) | Muda: um acesso que dá o `host_label` do Projeto vivo, ao lado de `liveProjectOf` (`hub/projects/hosts.ts:169-181`, que dá só o nome) | `conference.ts` |
| `apps/server/src/hub/apps/handoff.ts` | Muda: `admitCall` lê também `check_session`; `callTo` no ambiente `check`; `connectorCall` devolve `CHECK` no ambiente de conferência; `endAppSessions` apaga também `check_session` | o despachante, por `checkAppCall`, `callAppConnector` e `listAppConnections` |
| `apps/server/src/hub/apps/read-notice.ts`, `read-notice.test.ts` | Muda: o aviso de leitura no ambiente `check` não grava; os casos do critério 26 | a rota do aviso do despachante (`hub/apps/routes.ts:109`) |
| `apps/server/src/hub/connectors/app-calls.ts`, `app-calls.test.ts` | Muda: `call` e `names` respondem `NOT_GRANTED` e `[]` quando a porta diz `CHECK`; os casos do critério 21 | as duas rotas de conector do app |
| `apps/server/src/hub/apps/removal.ts` | Muda: o Worker de conferência sai com os outros, na remoção do Projeto e na da empresa (`removeCompanyWorkers`) | a remoção do Projeto, a remoção da empresa pela Central |
| `apps/server/src/hub/apps/public.ts`, `apps/server/src/main.ts` | Muda: a porta `confer` ao lado de `sendFromBuilder` (`apps/server/src/main.ts:161`) | `builder/runs/` (U3) |

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
Nenhuma passagem nem sessão de app é de conferência, e nenhuma delas guarda ambiente desde a U4 da
Prévia. O ambiente de uma chamada é
`CallEnvironment = AppEnvironment | 'check'`, em `tables.ts`, lido por `admitCall`, `callTo` e
`connectorCall`, cada um com o ramo `check` explícito e `satisfies never` no fim (C21).

As assinaturas que mudam:

```ts
// hub/apps/send.ts: o nome do Worker vem de quem chama; `prepare` passa appWorkerOf(versionId)
export function uploadVersion(
  cloudflare: CloudflareApps,
  input: Ids & { worker: AppWorker; manifest: Manifest; files: readonly WorkerFile[] },
)

// platform/company-postgres.ts, no `CompanyPostgres`
/** O esquema de conferência vazio: derruba e refaz, numa transação, com os logins que faltam. */
resetCheck(owner: DatabaseUrl, projectId: ProjectId): Promise<SqlAnswer>
/** `logins` é `appLogin(projectId)` para a Prévia e `appCheckLogin(projectId)` para a conferência. */
migrate(owner: DatabaseUrl, logins: AppLogins, migrations: readonly AppMigration[]): Promise<MigrateAnswer>
```

`AppLogins` é o tipo de `appLogin` sem o login de leitura (`Omit<ReturnType<typeof appLogin>,
'readLogin'>`), em `packages/hub-api/src/app-login.ts`. `schemaStatements` passa a receber
`AppLogins`, e `resetCheck` usa `missingLogins` como `ensureApp` (`company-postgres.ts:210-220`).
`connectorCall` passa a devolver uma união: `{ kind: 'CALL'; ids; caller; versionId; manifest }`,
a forma de hoje, ou `{ kind: 'CHECK' }` no ambiente de conferência, sem ler a versão. Nenhuma
falha nova entra.

Em `apps/server/src/hub/apps/conference.ts`:

```ts
export type Conference =
  | { kind: 'OPENED'; url: URL; session: AppSessionToken }
  | { kind: 'NOT_STARTING' }
  | { kind: 'MIGRATION_REFUSED'; failure: AppVersionFailure; cause?: MigrationCause }
  | { kind: 'NO_ADDRESS' }

export function openConference(
  deps: SendDeps & { appsDomain: AppsDomain },
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
guia além do de código: data (D11, D17, D22).

### A ordem do trabalho

1. **O contrato e a tabela.** Critério: 14.
   - **Arquivos:** muda `packages/hub-api/src/apps.ts`, `app-login.ts`, `index.ts` (com a saída de
     `SUBSCRIPTION_KINDS` da lista, issue 788, provada por `npm run typecheck` e `npm run knip`); muda `tables.ts`
     (`checkSession`, `CallEnvironment`); cria a migração por `drizzle-kit generate`; muda `database-grants.sql` e o retrato do catálogo no
     mesmo commit.
   - **Pronto quando:** `npm run migrations -- --base origin/main` passa.
2. **O esquema de teste.** Critério: 10.
   - **Arquivos:** muda `platform/company-postgres.ts`.
   - **O que entra:** `resetCheck(owner, projectId)`: numa transação, o `DROP SCHEMA ... CASCADE`
     como o login de migração de conferência, depois de criar os logins que faltam e o `GRANT`
     ao dono (senão o `SET LOCAL ROLE` falha na primeira conferência), e depois as instruções de `schemaStatements` com os
     nomes de `appCheckLogin`, sem as de leitura; `migrate` recebe o par de logins em vez de os
     derivar só de `appLogin`. `dropApp` derruba também o esquema e os dois logins de conferência.
     Regras: D22, C52, C26.
   - **Testes:** `conference.test.ts` no Postgres real, os dois casos do critério 10.
   - **Mutações à mão:** tirar o `DROP` → a linha da conferência anterior aparece; trocar
     `appCheckLogin` por `appLogin` → o esquema da Prévia muda, o caso fica vermelho.
3. **A conferência no Hub.** Critérios: 9, 25, 29.
   - **Arquivos:** cria `hub/apps/conference.ts`; muda `public.ts`, `main.ts`.
   - **O que entra:** `openConference` admite como `sendVersion` (`admitTo` com
     `sendBuilderVersion`, `send.ts:54-63`); um Projeto sem rótulo devolve `NO_ADDRESS` antes de
     qualquer gravação (a decisão 13 do firstmate); senão cria a linha de `apps.app` se não houver chamando `lockApp`
     (`hub/apps/versions.ts:95-110`) numa transação curta (`database.command`), e o `databaseReady`
     que ele devolve vai a `openAppDatabase` (C26), sobe o Worker com `uploadVersion` trocando o nome
     por `appCheckWorkerOf`, abre o banco da empresa (`openAppDatabase`), chama `resetCheck` e o
     `migrate` de conferência, grava a `check_session` e devolve o endereço `appHostOf` com o
     rótulo do Projeto, o host do app publicado (a decisão 12 do firstmate).
   - **Arquivos, além:** muda `send.ts` (`uploadVersion` com `worker`), `app-database.ts`
     (`migrateApp` com `appLogin`), e os dois comentários longos de `live.ts` (issue 753, item 4;
     nenhum código muda ali).
   - **Testes:** `conference.test.ts`, critério 9.
4. **A chamada no ambiente de conferência.** Critérios: 11, 12, 21, 22, 26.
   - **Arquivos:** muda `handoff.ts`, `read-notice.ts`, `read-notice.test.ts`,
     `hub/connectors/app-calls.ts`,
     `app-calls.test.ts`, `dispatcher-versions.test.ts`.
   - **O que entra:** `admitCall` procura o token em `app_session` e, sem achar, em `check_session`
     com `expires_at > statement_timestamp()`; acha `environment: 'check'` pela tabela, num ramo
     antes de `appOfHost` (`hub/apps/handoff.ts:163`), que pelo host daria `published`; a
     admissão da pessoa é a
     mesma (`admitToApp` com `check` admitido como `preview`). `callTo` no `check` devolve
     `appCheckWorkerOf` e `appCheckLogin(...).runLogin`. `connectorCall` devolve `{ kind: 'CHECK' }`
     logo depois de `admitCall`, antes da leitura da versão, e `createAppCalls` responde
     `NOT_GRANTED` em `call` e `[]` em `names` para ele.
     `endAppSessions` apaga as linhas de `check_session` da pessoa e do Projeto na mesma
     transação. `recordNotice` (`read-notice.ts`) responde sem chamar `recordRead` quando
     `admitCall` dá `check` (a decisão 14 do firstmate), num `switch` do ambiente com
     `satisfies never` (C21). Regras: S8, S13, S22.
   - **Mutações à mão:** tirar a condição de `expires_at` → o caso de 10 minutos do critério 12
     fica vermelho; tirar o ramo `check` de `connectorCall` → o caso do critério 21 fica vermelho
     (o dublê do conector é chamado).
5. **A remoção.** Critério: 13.
   - **Arquivos:** muda `removal.ts`.
   - **O que entra:** `removeCompanyWorkers` lê também os `projectId` de `apps.app` da empresa e
     chama `removeWorkers(deps.cloudflare, projectIds, appCheckWorkerOf)` ao lado dos Workers das
     versões; `removeProjectApp` chama `removeWorkers(deps.cloudflare, [projectId],
     appCheckWorkerOf)` ao lado da chamada dos Workers das versões (`hub/apps/removal.ts:88`), e `dropApp`
     leva o esquema e os dois logins de conferência. A linha de `apps.app` existe sempre que houve
     conferência (o passo 3 a cria), então o caminho sem linha (`hub/apps/removal.ts:69-86`) continua sem
     nada de conferência a remover.

### Como se prova

Critérios 9 a 14, 25, 26 e 29 pelos testes nomeados, no Postgres real e pela porta `createAppDoor`. Hoje não há
ambiente de conferência: `checkCall` com um token de `check_session` dá `APP_SESSION_INVALID`, e o
caso do critério 11 fica vermelho.

### Parar se

- O despachante recusa o nome `c-<id>` em outro lugar além do esquema de `AppWorker` (o caso do
  critério 22 fica vermelho com o esquema novo): pare, porque o código do despachante não muda
  nesta etapa.
- O `GRANT` do login de migração de conferência ao dono falha no Neon por limite de papéis: pare,
  com o código.

## U3 O juiz

**Base e modelo.** A cabeça de U2. O juiz é o campo `judge` da ficha do Builder (U6 da ficha, G5)
e os retratos do Builder existem (U1 da ficha, G1), ambos no `main` desde `14a99007`. Sonnet: o juiz
já existe; muda a ordem dele, o texto que o modelo lê e a falha de plataforma de `conexus_check`.

### As linhas da tabela

- **Quem decide "terminei" e o juiz da tela não ligada.** `conversation/processors.ts:18-23` (a
  descrição de `conexus_check`), `:25-43` (`PLATFORM_FAILED` e `checkTool`), `:45-52` (`feedback`),
  `:86-116` (`judge`), `:118-146` (`conexusCheck`, com o registro `CHECK_JUDGE_FAILED` de `:128-142`);
  `builder/runs/runs.ts:205-210` (`check`), `runs/context.ts:21-40` (`BuilderSend`, o modelo da
  porta nova); `apps/server/src/main.ts:161` (`send`, o modelo da porta nova).
- **Onde o juiz é ligado.** O campo `judge` da ficha do Builder,
  `{ scorers: [conexusCheck({ runs, storage, log })], strategy: 'all' }`
  (`conversation/builder.ts:159-162`), e `conexus_check` em `tools` (`:153`). A U3 não muda o campo
  nem a ficha: a conferência nova entra pelo `Runs.check` que `conexusCheck` chama. Releia o campo na
  base.
- **A falha de plataforma de `conexus_check`.** `conversation/processors.ts:25-30`
  (`PLATFORM_FAILED`, com o `isError` que ninguém lê), `:32-43` (`checkTool`); o modelo do
  lançamento, `B/data-tools/tools.ts:9-16`, `:25-28` (`DataRefused`, uma classe de erro própria);
  o que a tela lê, `apps/web/src/builder/conversation/tool-bodies.tsx:188-194` (`reasonOf`); o que
  fica guardado, `B/conversation/conversation-tools.test.ts:185-191`; no Mastra 1.83.0,
  `tool-result-commit-core.ts:142-146` e `agent-controller/tool-result.ts:8-21` (a decisão 15).
- **Os retratos do Builder.** `B/conversation/request.test.ts` e `B/conversation/requests/*.snapshot`,
  da U1 da ficha: o primeiro turno num Projeto, e o turno em que a conferência reprova uma vez e o
  modelo recebe o motivo do juiz. O retrato guarda o corpo inteiro do pedido, com a descrição de
  cada ferramenta e o texto do juiz.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/runs/context.ts`, `runs.ts`, `test-runs.ts` | Muda: `RunsDeps.confer`; `check` com as duas conferências | `processors.ts` |
| `apps/server/src/builder/conversation/processors.ts` | Muda: o texto de `feedback` e de `CHECK_DESCRIPTION` (que passa a dizer o que `CHECK_PLATFORM_FAILED` quer dizer); `checkTool` lança o código na falha de plataforma, e `PLATFORM_FAILED` sai | o Builder |
| `apps/server/src/builder/conversation/requests/*.snapshot` | Muda: os dois retratos do Builder, regravados no commit da U3 (critério 24) | `B/conversation/request.test.ts`, sem mudar |
| `apps/server/src/builder/conversation/test-conversation.ts` | Muda: o dublê de `confer`, que por padrão abre e dá `CLEAN` (nenhuma unidade da ficha muda este arquivo) | os testes da conversa, os retratos |
| `packages/app/src/check/test-app.ts`, `check.test.ts` | Muda: `ENCOMENDAS_DEFEITO`, `CONECTOR_NA_ENTRADA` e o caso do critério 23 | `builder.eval.test.ts`, o ponto de conferência de G2 |
| `apps/server/src/builder/conversation/builder.eval.test.ts` | Muda: o caso do critério 18 | o ponto de conferência de G2 |

### Os contratos que a unidade cria

Em `runs/context.ts`:

```ts
type BuilderConfer = {
  open(input: { companyId: CompanyId; projectId: ProjectId; personId: PersonId; folder: VersionFolder }): Promise<Result<Conference, 'CONFER_PLATFORM_FAILED'>>
  end(input: { session: AppSessionToken }): Promise<void>
}
```

`Runs.check` passa a devolver uma união própria, e o `CheckReport` da máquina fica como é (o seu
`ok` é o dos passos, `packages/app/src/check/report.ts:47-50`):

```ts
export type BuilderCheck =
  | { kind: 'MACHINE_FAILED'; machine: CheckReport }
  | { kind: 'CONFERENCE_REFUSED'; machine: CheckReport; conference: Exclude<Conference, { kind: 'OPENED' | 'NO_ADDRESS' }> }
  | { kind: 'NO_ADDRESS'; machine: CheckReport }
  | { kind: 'SEEN'; machine: CheckReport; browser: BrowserReport }

check(...): Promise<Result<BuilderCheck, CheckPlatformFailed | ConferPlatformFailed>>
```

Passou só `SEEN` com `browser.kind === 'CLEAN'`, ou `NO_ADDRESS` (a decisão 13 do firstmate: a máquina já passou), numa função de `processors.ts` com
`satisfies never` no fim (C21). As duas falhas de plataforma dão `unchecked`, como hoje. Nenhuma
forma nova chega à tela: `VersionCheck` fica como está.

- **Cada estado** como união: `BuilderCheck` por `kind`, lido num `switch` com `satisfies never`
  (C21, C22); as duas falhas de plataforma ficam no erro do `Result`, nunca num `kind`.
- **Cada id**: nenhum novo; `BuilderConfer` recebe `CompanyId`, `ProjectId`, `PersonId` e
  `AppSessionToken`, marcas que já existem (C23 não se aplica).
- **O dono de cada fato**: o texto do juiz e o código lançado por `conexus_check` são de
  `processors.ts`; o caminho da captura, de U1; o prazo da sessão, de U2 (C26).
- **O arquivo modelo**: `processors.ts`. Cumpre C21 e C26; C23 não se aplica.

### As skills e a leitura

As linhas de `stack.md` de `@mastra/core`, a skill `mastra` (`isTaskComplete` e os scorers), e
`pstack:typescript-best-practices`. O guia além do de código: testing (T5, T26).

### A ordem do trabalho

1. **As duas conferências num caminho.** Critérios: 15, 16, 17, 25, 27.
   - **Arquivos:** muda `runs/context.ts`, `runs.ts`, `test-runs.ts`, `main.ts`; em
     `processors.ts`, a função que lê `BuilderCheck`; em `test-conversation.ts`, o dublê de `confer`.
   - **O que entra:** `check` roda a da máquina; reprovada, `MACHINE_FAILED`; se passou,
     `machines.pack`, `confer.open`, e com `OPENED` o `machines.confer` com o endereço e a sessão,
     e `confer.end` no `finally`; `NOT_STARTING` e `MIGRATION_REFUSED` são `CONFERENCE_REFUSED`;
     `NO_ADDRESS` é `NO_ADDRESS`, sem `confer` nem `confer.end` (o `pack` já rodou e se perde; é só
     o Projeto de antes dos endereços). Um `pack` recusado (`TOO_LARGE`, `NOT_REGULAR`,
     `VERSION_INVALID`) ou que lança porque a máquina morreu é `CONFER_PLATFORM_FAILED`: a
     conferência no navegador não rodou, e o turno fica `unchecked` sem gastar volta, com a mesma
     linha `PREVIEW_PACK_REFUSED` de hoje (`runs.ts:303-318`; a decisão 18 do firstmate).
   - **O que entra, além:** `checkTool` lança, numa classe de erro própria como `DataRefused`, só o
     código `CHECK_PLATFORM_FAILED` quando `check` volta `CHECK_PLATFORM_FAILED` ou
     `CONFER_PLATFORM_FAILED`; o sentido do código vai para `CHECK_DESCRIPTION`, no passo 2; uma
     conferência que rodou devolve o `BuilderCheck` como resultado (a decisão 15 do firstmate). O `catch` de `conexusCheck` (`processors.ts:128-142`)
     não muda.
   - **Mutações à mão:** rodar o `confer` antes da conferência da máquina → o caso "nenhum `confer`
     roda" do critério 16 fica vermelho; voltar `checkTool` a devolver `PLATFORM_FAILED` → o caso do
     critério 27 fica vermelho.
2. **O texto que o modelo lê.** Critérios: 15, 24.
   - **Arquivos:** muda `processors.ts`.
   - **O que entra:** o `feedback` nomeia o relatório do navegador e diz para ler a captura com
     `mastra_workspace_read_file`; `CHECK_DESCRIPTION` troca "opens the app in a browser" pelo que a
     conferência faz agora, e tira "It does not prove ... that a screen shows the right values" na
     parte que ela passa a provar.
   - **Os retratos, no mesmo commit.** Critério: 24. Os dois retratos do Builder ficam vermelhos de
     propósito. Regrave só eles, com `--test-update-snapshots` acrescentado ao script `test` de
     `apps/server/package.json` (o mesmo `scripts/test-run.ts` e o mesmo
     `MASTRA_AGENT_THREAD_LEASE_TTL_MS`) e só `B/conversation/request.test.ts`, e leia o diff: no do
     primeiro turno muda só a descrição de `conexus_check` (o dublê de `confer` dá `CLEAN`, então o
     juiz não fala); no do juiz, também o texto do `feedback`, que passa a levar o `BuilderCheck`
     em vez do `CheckReport` sozinho (o mesmo vale para o resultado de `conexus_check`, se o
     cenário o chamar). Rode o arquivo duas vezes sem a opção.
3. **O defeito plantado e o conector na entrada.** Critérios: 23, 18, 21.
   - **Arquivos:** muda `packages/app/src/check/test-app.ts` (`ENCOMENDAS_DEFEITO`: a lista chama
     `listarEncomendas`, declarada e tipada, cujo manipulador lê `encomenda` sem migração que a
     crie), `check.test.ts` (critério 23) e `builder.eval.test.ts` (critério 18, a pasta da
     conversa semeada com `ENCOMENDAS_DEFEITO`). No mesmo `test-app.ts`, ao lado,
     `CONECTOR_NA_ENTRADA`: a operação da lista, declarada no manifesto com um conector e uma
     leitura dele, chama `connectors.call` e devolve o estado `SEM_CONEXAO` quando a resposta é
     `NOT_GRANTED`; a tela de entrada mostra "Sem conexão" nesse estado, sem erro.
   - **Prove primeiro:** o caso do critério 23 passa na conferência da máquina de hoje. Um defeito
     que o passo `tipos` pega (uma chamada a uma operação que não existe, porque `createApi` só
     aceita nomes declarados, `packages/app/src/client.ts:84-88`) nunca chega ao navegador.
   - **Pronto quando:** o caso do defeito roda no ponto de conferência, na nuvem, e lá a conferência
     de `CONECTOR_NA_ENTRADA` dá `CLEAN` com a captura em "Sem conexão" (critério 21).

### Como se prova

Critérios 15 a 17, 25 e 27 por `conversation-check.test.ts`, com a máquina, o Hub e o modelo em dublê. Hoje o
juiz encerra com `FINISHED` sobre a mesma tela: o caso do critério 15 fica vermelho. Critério 23
por `check.test.ts`, que prova que o defeito passa pela máquina de hoje. Critério 24 pelos retratos
do Builder, regravados no commit, e pelo diff deles na revisão. Critérios 18 a 20 no ponto de
conferência.

### Parar se

- O `read_file` do Builder não devolve a imagem da captura em `node_modules/.conexus/`: pare, com a
  saída, porque o lugar da captura é a única prova que a implementação não fez.
- O modelo de verdade não corrige o defeito em `CHECK_LIMITS.checks` voltas em nenhuma de duas
  corridas: pare e relate o que cada conferência disse; não mude o texto do juiz para passar o
  teste.
- O caso do critério 23 reprova na conferência da máquina de hoje: o defeito não é o que o
  navegador pega; troque o defeito, nunca a conferência da máquina.
- Um retrato do Builder muda em outra parte além da descrição de `conexus_check`, do texto do juiz e
  do resultado de `conexus_check`,
  ou um retrato de outro agente muda: pare, com o diff. A conferência nova não deve mudar outra
  coisa no pedido ao modelo.
- O campo `judge` da ficha do Builder, na base, não é `conexusCheck` com `strategy: 'all'`: pare,
  porque a U3 escreve no juiz que a U6 da ficha deixou.
- A parte de um `conexus_check` que lança não fica guardada como `output-error` com o código em
  `errorText`, ou a tela não mostra, ao abri-la, a frase da linha de `conexus_check` (`thrownText`): pare, com o que
  ficou guardado, porque a decisão 15 parte do laço do Mastra 1.83.0 e do `reasonOf` da tela.

## G2 O ponto de conferência

`npm run check`; os testes de `hub/apps/`, `hub/connectors/`, `apps/edge/`, `builder/runs/` e
`builder/conversation/`; a migração com `npm run migrations`. A ordem no ar: o despachante novo
primeiro (o mesmo código, com o `packages/hub-api` novo), depois o Hub. No Hub da nuvem com o
template de G1, uma conferência que chega ao Worker `c-<projectId>` pelo despachante de verdade, o roteiro de uso inteiro, o teste
do defeito plantado (critério 18), a conferência de `CONECTOR_NA_ENTRADA` com a captura em "Sem
conexão" (critério 21), os dois apps de teste (critério 19) e os tempos (critério 20), e a medida
de que o namespace serve o código novo logo depois de reenviar o Worker `c-<projectId>` com o mesmo
nome (reenvia, chama, confere a resposta nova, cinco vezes; não provado até aqui),
com as capturas antes e depois no pull request.

## U4 O fechamento

**Base e modelo.** A cabeça de G2 em `main`, depois do uso. Sonnet: só documentos.

Muda `docs/architecture.md` (a máquina passa a abrir o app de conferência, seção 11 com a dívida),
abre as issues da dívida (o DNS, o `setEnvs`, o SNI), grava a linha de uso no arquivo de aprovação e
apaga este cartão (delivery L19). Nenhuma linha da tabela é remendo: `boundaries.md` não muda.
