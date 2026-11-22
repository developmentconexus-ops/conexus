# A Prévia em endereço próprio

Trilho: assistente

Trilha Agentes e Apps, um conserto da Plataforma que a trilha achou no uso de um app publicado
(delivery L1, L4). As palavras do fundador ao estudo, em 2026-11-21: "2.a 3.b 4a 5a"; e em
2026-11-22: "2. A" (os cartões escritos à noite, ele aprova de manhã). A marca `Trilho: assistente`
é a que a verificação `second-card` lê (`scripts/cli.ts`, `trackOf`). Os pull requests de build
caem na marca `frontier` pelas pastas (`scripts/tracks.ts:9-14`), e o firstmate confere à mão a
aprovação deste cartão antes de cada build, como no cartão da Fundação. O cartão espera num pull
request em rascunho e entra em `docs/steps/` quando a Fundação do front-end sair (delivery L5).
Lido em `main` `4d143a99`. O estudo fica fora do repositório (delivery L21): ele leu em `ab4252e3`,
e cada linha de `main` citada aqui foi relida em `4d143a99` (entre os dois, nos arquivos desta
etapa, só um comentário de `apps/edge/src/dispatcher-tab.test.ts` mudou). As referências: a vibesdk
em `9da158d8` (`docs/reference/stack.md:12-13`), as páginas da Cloudflare em `cloudflare-docs`
`180f5595`, lidas em 2026-11-21.

## A página do fundador

**No fim desta etapa** a Prévia e o app publicado moram cada um no seu endereço. O app publicado
continua em `estoque--metal-nobre.conexusapp.tech`, o endereço que as pessoas salvam. A Prévia abre
dentro do Hub em `estoque--metal-nobre--previa.conexusapp.tech`. Cada endereço guarda uma entrada
só, de um tipo só. O iPhone deixa de depender dos três consertos do laço, e nenhuma página de fora,
nem o Hub, consegue mostrar o app publicado dentro de outra página.

**O roteiro de uso.**

1. No computador, abra um Projeto em que a Prévia está numa versão mais nova que a publicada (peça
   uma mudança ao Builder e não publique). A Prévia mostra a versão nova. A barra mostra
   `<nome>--<apelido>--previa.conexusapp.tech` e "versão N".
2. No iPhone, com o Hub logado, abra o endereço salvo do app publicado. Abre a versão publicada,
   direto, sem página de erro.
3. Ainda no iPhone, abra o Hub e o mesmo Projeto. A Prévia mostra a versão nova; o aviso "O app
   pode não abrir aqui dentro neste navegador." continua lá, e você pode fechá-lo. Volte à aba do
   app: ele continua na versão publicada. Recarregue as duas: cada uma fica na sua.
4. No celular, na Prévia, toque **Abrir app**. Abre o app publicado.
5. Abra numa aba nova o endereço que a barra da Prévia mostra. Aparece uma página curta: "A Prévia
   abre dentro do Conexus.", com o botão **Abrir o Conexus**, que leva ao Hub.

**O que você faz, e quando.** Antes: nada. Antes do merge do primeiro pull request, o firstmate faz
duas conferências só de leitura, sem mexer em nada: conta os Projetos com nome longo demais para a
marca `--previa` e abre um endereço `--previa` para ver que a Cloudflare já o atende com o
certificado de hoje. Se a contagem não der zero, o cartão volta a você com a lista. No começo:
aprova esta página. No fim: faz o roteiro no computador e no iPhone, diz o que viu e aprova os dois
textos novos, "A Prévia abre dentro do Conexus." e **Abrir o Conexus**.

**O que muda nos três consertos do laço e na regra do cookie.**

| O quê | O que fica | O que sai |
| --- | --- | --- |
| O conserto da forma do cookie pelo lugar (pull request 1211) | As duas formas do cookie, agora uma em cada endereço | A escolha da forma por um cabeçalho de cada pedido |
| O conserto que apaga as duas formas (pull request 1213) | No endereço publicado, a linha que limpa o cookie antigo de quem ainda o tem, com uma data para reler | No endereço da Prévia, tudo: o endereço é novo e não tem cookie antigo |
| A página "Este navegador não guardou a sua entrada." (pull request 1214) | Inteira, nos dois endereços | Nada |
| A regra S24 do guia de segurança | A regra passa a dizer: no endereço publicado o cookie comum e ninguém emoldura; no da Prévia o cookie particionado e só o Hub emoldura. O pull request de método desta noite já a escreve assim; o fechamento desta etapa só confere | "Todo cookie particionado" e "o Hub emoldura todo endereço de app" |

**Fica de fora.**

- **Abrir a Prévia numa aba nova.** A vibesdk oferece isso no aviso do Safari. Pediria uma entrada
  de aba no endereço da Prévia, que traria de volta duas formas de cookie num endereço. Espera o
  primeiro relato de alguém num navegador Apple (o gatilho da issue 440).
- **A conferência do Builder (o marco `A1`).** O cartão dele cria um terceiro ambiente no mesmo
  endereço do app. Ele relê as linhas que esta etapa troca; a lista está no fim deste cartão.
- **O Safari abaixo do 26.2 dentro da Prévia.** A Prévia não abre nele, como hoje, e o aviso da
  tela cobre.
- **As issues `next-card`.** Esta etapa leva a 358 (não havia teste de ponta a ponta da entrada da
  Prévia; esta etapa escreve um) e tira da 440 o primeiro item (o quadro e a aba juntando a entrada
  num navegador que ignora o cookie particionado), que deixa de existir: endereços diferentes nunca
  dividem cookie. Nenhuma outra issue aberta com o rótulo toca os arquivos desta etapa.

**As decisões suas nesta etapa.** Todas respondidas em 2026-11-21, ao estudo: "2.a 3.b 4a 5a". Na
numeração do estudo, 2 é a A, 3 é a B, 4 é a C e 5 é a D. As suas palavras vão para o arquivo de
aprovação deste cartão quando você aprovar a página.

- **A. Onde mora o endereço da Prévia.** (a) a marca `--previa` no mesmo domínio,
  `estoque--metal-nobre--previa.conexusapp.tech`; (b) um domínio só de prévias; (c) um nível abaixo,
  `estoque--metal-nobre.previa.conexusapp.tech`, com certificado pago. **A sua resposta: a.** Veredito
  embrulhado: a rota, o DNS e o certificado de hoje já atendem; o que é nosso é a marca no nome. É
  como a Cloudflare nomeia as prévias de Workers em `workers.dev`. O custo: o nome de um Projeto
  novo cabe em 8 letras a menos, e um nome muito longo é cortado um pouco antes.
- **B. O que a barra da Prévia mostra.** (a) o endereço publicado; (b) o endereço que a Prévia
  carrega. **A sua resposta: b.** Veredito nativo: troca de texto na barra que já existe. **Abrir
  app** continua levando ao publicado.
- **C. O endereço da Prévia aberto numa aba.** (a) uma página curta, sem redirecionar; (b) mandar
  para o app publicado. **A sua resposta: a.** Veredito embrulhado: a mesma página de falha que a
  borda já tem, com um texto novo. O texto proposto, que você aprova no fim: "A Prévia abre dentro
  do Conexus." e o botão **Abrir o Conexus**.
- **D. Onde esta etapa entra na trilha.** (a) antes do `A1`, logo depois da Fundação; (b) depois do
  `A1`; (c) na trilha Dados. **A sua resposta: a.** O cartão do `A1` relê o que esta etapa troca.

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G0 | — | As duas conferências só de leitura do firstmate: a contagem dos rótulos longos e o endereço `--previa` no ar | nenhuma | — | a aprovação |
| G1 | U1 | O endereço da Prévia e o Hub pelo host: a regra do endereço em `address.ts` (`PreviewHost`, `AppHost`, `AppEnvironment`, `appOfHost`, `previewHostOf`, a reserva de 8 caracteres), as portas que recusam o host do outro ambiente pelo esquema, a passagem e a sessão que tiram o ambiente do host, e `Project.previewAddress` | `packages/hub-api/src/`, `apps/server/src/hub/apps/`, `apps/server/src/hub/projects/`, `apps/server/src/hub/connectors/`, os dublês e testes da web que montam um `Project` ou uma `FrameEntry` | security | G0 |
| G1 | U2 | A borda pelo host: a forma do cookie, quem emoldura e a entrada saem do host; a página nova do endereço da Prévia numa aba | `apps/edge/src/` | security | U1 |
| G1 | U3 | A tela da Prévia carrega o endereço da Prévia e a barra o mostra; o teste de ponta a ponta da entrada da Prévia (issue 358) | `apps/web/src/builder/preview/`, `tests/e2e/`, `package.json` (a lista do `e2e`) | web | U2 |
| G2 | U4 | O fechamento: a migração que tira as duas colunas `environment`, a linha de volta da arquitetura, a emenda da 0024, a conferência de S24, as explicações, as issues, o cartão apagado e a linha de uso | `apps/server/src/hub/apps/`, `apps/server/migrations/`, `docs/` | delivery | o uso e a publicação de G1 |

G1 é um pull request só: a borda, o Hub e a tela só funcionam juntos (o Hub de hoje emoldura o host
publicado, que a borda nova recusa), e uma publicação os põe no ar de uma vez. As três unidades
correm uma depois da outra, cada uma um commit verde. G2 é o último pull request, depois do uso
(delivery L17, L19): a coluna só sai numa migração posterior à publicação que parou de lê-la (data
D6, D30). Nenhuma unidade divide pasta com os consertos da Fundação (delivery L1): a Fundação mexeu
em `apps/web/src/ui/`, `hub/projects/`, `builder/assistant/`, `builder/agents/` e
`builder/conversation/`; U1 muda nesses lugares só dublês de teste (`test-start.tsx`).

**Orçamento de código alterado.** U1: cerca de 110 linhas somadas e 40 apagadas. U2: 90 somadas e
60 apagadas. U3: 20 somadas e 10 apagadas. U4: 20 somadas e 30 apagadas, mais documento. Total da
etapa: cerca de 240 somadas, muito abaixo das 4.000 de delivery L2. O protótipo do estudo mudou a
borda em 24 linhas somadas e 12 apagadas (`laboratorio/prototipo.diff`, fora do repositório).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | G0 | Nenhum Projeto tem `host_label` com mais de 55 caracteres: `select count(*) from projects.project where length(host_label) > 55` dá 0 no banco do Hub da nuvem, rodada antes do merge de G1 e de novo no ponto de conferência de G1. E `https://<rótulo>--previa.conexusapp.tech/` responde a página 404 da borda (`APP_NOT_FOUND`) com certificado válido, antes de qualquer código | à mão, pelo firstmate, só leitura; a saída no pull request de G1 | must |
| 2 | U1 | `previewHostOf('estoque--metal-nobre')` é `estoque--metal-nobre--previa`; `appOfHost` devolve `{ label: 'estoque--metal-nobre', environment: 'preview' }` para ele e `environment: 'published'` para o rótulo publicado. `AppHost` recusa três partes sem `previa` no fim, quatro partes, `previa` sozinho, uma parte com `--` e mais de 63 caracteres; `HostLabel` recusa o host da Prévia e `PreviewHost` recusa o publicado | `packages/hub-api/src/address.test.ts`, um caso por forma | must |
| 3 | U1 | Todo rótulo que `hostLabelOf` devolve tem host de Prévia: um nome de 100 caracteres com um apelido de 30 dá um rótulo de no máximo 55, e `previewHostOf` dele existe. `previewHostOf` de um rótulo de 56 a 63 caracteres não existe | `address.test.ts`: o caso do nome longo de hoje (linha 23) passa a 55; um caso de cada comprimento de apelido, de 3 a 30, com o nome de 100 | must |
| 4 | U1 | `/apps/open` com um host de Prévia responde a página com 404 e não grava passe; com o host publicado, o 303 de hoje, para `https://<rótulo>.<domínio>/__conexus/passagem` | `apps/server/src/hub/apps/handoff-route.test.ts`, o caso "busca fora da forma" com o host de Prévia | must |
| 5 | U1 | `createAppFrameHandoff` com o host publicado responde 400 `REQUEST_MALFORMED` e não grava passe; com o host da Prévia, 200 com `location` em `https://<rótulo>--previa.<domínio>/__conexus/passagem`, e a linha de `apps.handoff` guarda `host_label` igual ao host da Prévia | `apps/server/src/hub/apps/frame-handoff.test.ts`, o primeiro e o segundo casos | must |
| 6 | U1 | Uma sessão nasce presa ao host em que foi trocada: a sessão do host da Prévia, enviada a `checkAppCall` com o host publicado, dá `APP_SESSION_INVALID`, e a do publicado no host da Prévia também | `apps/server/src/hub/apps/app-handoff.test.ts`, pela porta `edge` do Hub (`hub.edge.inject`), os dois sentidos | must |
| 7 | U1 | A versão vem do host: a mesma pessoa, ao mesmo tempo, recebe no host da Prévia o Worker da versão da Prévia e no publicado o da versão publicada; o host publicado sem versão publicada dá `APP_NOT_PUBLISHED`; o host da Prévia sem versão dá o app de exemplo. Uma pessoa que só recebeu o app (acesso `USER`) é recusada na Prévia: `createAppFrameHandoff` responde 404 e nenhum passe é gravado | `app-handoff.test.ts` e `frame-handoff.test.ts`, pela porta `edge` e pela rota da Prévia | must |
| 8 | U1 | Os conectores e o Registro seguem o host: `callAppConnector` com o host da Prévia lê o manifesto da versão da Prévia, e `recordAppRead` com o host da Prévia grava a leitura para a pessoa da sessão | `apps/server/src/hub/connectors/app-calls.test.ts` e `apps/server/src/hub/apps/read-notice.test.ts`, um caso com o host da Prévia em cada | should |
| 9 | U1 | `getProject` devolve `previewAddress: '<rótulo>--previa.<domínio>'` ao lado de `address`, e `null` quando `address` é `null` | `apps/server/src/hub/projects/projects.test.ts`, pela rota, os dois casos | must |
| 10 | U2 | No host publicado, toda resposta (o app, o 303, a página de entrada vencida, as páginas de falha, `entry.js`) leva `frame-ancestors 'none'`; os cookies são `SameSite=Lax`, sem `Partitioned`; gravar a sessão apaga antes a forma particionada antiga, e apagar a sessão leva as duas formas | `apps/edge/src/dispatcher-tab.test.ts`, os casos de hoje com o host publicado e um caso que lê o `Content-Security-Policy` de cada resposta | must |
| 11 | U2 | No host da Prévia, toda resposta leva `frame-ancestors` só com a origem do Hub; os cookies são `SameSite=None; Partitioned`, nunca `Lax`; apagar a sessão leva só a forma particionada | `apps/edge/src/dispatcher-frame.test.ts`, os casos de hoje com o host da Prévia | must |
| 12 | U2 | No host da Prévia sem sessão: com `Sec-Fetch-Dest: iframe`, a página de entrada, com `data-host` igual ao host da Prévia; com `document` ou sem o cabeçalho, a página 401 "A Prévia abre dentro do Conexus." com o link **Abrir o Conexus** para a origem do Hub, sem redirecionar, sem gravar cookie e sem perguntar ao Hub, e a linha de log `EDGE_PREVIEW_OUTSIDE_HUB` com o host | `dispatcher-frame.test.ts`, os três valores do cabeçalho | must |
| 13 | U2 | No host publicado sem sessão, o 303 para `/apps/open` com `host` igual ao rótulo publicado, qualquer que seja `Sec-Fetch-Dest`, `iframe` incluído: o host publicado nunca dá a página de entrada | `dispatcher-tab.test.ts`, os três valores do cabeçalho | must |
| 14 | U2 | Uma página de falha leva o ancestral do seu host: `'none'` no publicado e num host que não é de app, a origem do Hub no da Prévia, também a página 500 de um erro inesperado | `apps/edge/src/dispatcher-guards.test.ts`: 404 de host desconhecido, 403 de escrita de fora e 500 em cada host | must |
| 15 | U2 | O `db` e os `connectors` de uma versão levam o host que o navegador abriu: no host da Prévia, o dublê do Hub recebe o host da Prévia em `recordAppRead` e em `callAppConnector` | `apps/edge/src/dispatcher-connectors.test.ts` e `apps/edge/src/db.test.ts`, um caso no host da Prévia | should |
| 16 | U2 | A página "Este navegador não guardou a sua entrada." vale nos dois hosts, e a linha de log diz o host | `dispatcher-tab.test.ts`, o caso da segunda volta sem sessão, nos dois hosts | should |
| 17 | U3 | A Prévia carrega `https://<previewAddress>/`, ouve a entrada só dessa origem e da janela do quadro (uma mensagem da origem publicada é ignorada), e a barra mostra `previewAddress` e "versão N"; **Abrir app**, no celular e com versão publicada, leva a `https://<address>/` | `apps/web/src/builder/preview/preview.test.tsx`, os casos de hoje com os dois endereços | must |
| 18 | U3 | Num Chromium, com o Hub e o despachante de verdade: a Prévia mostra a versão 2 enquanto uma aba do app publicado mostra a 1, as duas recarregadas ficam na sua; o pote tem o cookie `Lax` sem partição no host publicado e o `Partitioned` no da Prévia; uma página do Hub que emoldura o host publicado é bloqueada por `frame-ancestors 'none'`; o host da Prévia numa aba mostra a página do critério 12 | `tests/e2e/preview-host.test.ts`, novo, na lista de `npm run e2e` | must |
| 19 | U3 | A Prévia e a página do endereço da Prévia numa aba passam pelo QA a 1366 e 390 px, nos dois temas (testing T25): a barra com o endereço da Prévia sem estourar a 390 px, a página nova sem rolagem lateral | o relatório de QA no pull request de G1 | must |
| 20 | U4 | As colunas e as restrições `environment` saem de `apps.app_session` e `apps.handoff`; a migração tem a linha `-- contract:`; a arquitetura nomeia a publicação antes da qual nenhuma imagem roda | `apps/server/src/hub/apps/tables.test.ts` (o catálogo sem as duas colunas), `npm run migrations`, `npm run docs` | must |
| 21 | U4 | A 0024 diz que cada app e cada ambiente têm o seu host, e que o ambiente é do host; S24 diz uma forma de cookie e um ancestral por host; as explicações do contrato do app e dos apps do Hub dizem o mesmo | `npm run docs`; a leitura do diff | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A Prévia no Hub | o palco de hoje (`Stage`), antes da primeira versão ou sem `previewAddress` | o mesmo palco | o quadro carregando o host da Prévia, a barra já com o endereço | `createAppFrameHandoff` recusado: o `Alert` com a frase do Hub, como hoje | a página 404 da borda dentro do quadro | a página da borda dentro do quadro, como hoje | sessão vencida: a página de entrada no quadro e uma passagem nova, sem nada à vista |
| O host da Prévia numa aba | a página "A Prévia abre dentro do Conexus." com **Abrir o Conexus** | a mesma | — | a página de falha da borda | a página 404 da borda | a mesma página nova (a aba nunca recebe passe) | a mesma página nova |
| O app publicado numa aba | igual a hoje | igual | igual | igual | igual | igual | igual, com a página "Este navegador não guardou a sua entrada." na segunda volta |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Project.previewAddress` | o Hub, `viewOf` (`apps/server/src/hub/projects/projects.ts:85-91`) | a Prévia (`preview.tsx`): o `src` do quadro, a origem ouvida, a barra |
| `FrameEntry.host`, o corpo de `createAppFrameHandoff` (`PreviewHost`) | a página de entrada da borda, pelo `data-host` | a Prévia, que o repassa ao Hub; o Hub, que cria o passe |
| `host` de `createAppSession`, `checkAppCall`, `recordAppRead`, `callAppConnector`, `listAppConnections` (`AppHost`) | a borda, do host do pedido | o Hub: `redeemHandoff`, `admitCall` |
| `AppOpenQuery.host` (`HostLabel`, só o publicado) | a borda, no 303 | o Hub, `/apps/open` |
| `apps.handoff.host_label`, `apps.app_session.host_label` | o Hub, com o host que o navegador vê | o Hub, `redeemHandoff` e `admitCall` |
| `environment` das duas tabelas, até G2 | o Hub, do host, só para uma volta de imagem | ninguém: sai em U4 |

O desenho de caixas não muda na Prévia: só o texto da barra. A página nova é a página de falha da
borda (`apps/edge/src/pages.ts:59-82`), a mesma caixa da página "Este navegador não guardou a sua
entrada.", cujas capturas o estudo dela guardou fora do repositório:

```text
1280 px                                   390 px
+----------------------------------+      +----------------------+
|                                  |      |                      |
|   +--------------------------+   |      | +------------------+ |
|   | A Prévia abre dentro do  |   |      | | A Prévia abre    | |
|   | Conexus.                 |   |      | | dentro do        | |
|   | [Abrir o Conexus]        |   |      | | Conexus.         | |
|   +--------------------------+   |      | | [Abrir o Conexus]| |
|                                  |      | +------------------+ |
+----------------------------------+      +----------------------+
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| O passe, `createHandoff`, agora com o host da Prévia | dois passes, cada um de uma vez (como hoje) | a sessão do Hub saiu entre a admissão e a gravação: `SESSION_REQUIRED`, nenhum passe (como hoje) | `DATABASE_UNAVAILABLE` | `APP_HANDOFF_CREATED` com os ids | 4, 5, 7 |
| A troca do passe pela sessão, `redeemHandoff` | uma das duas acha a linha (code C65, como hoje) | o `DELETE ... RETURNING` e a gravação da sessão numa transação: nada fica pela metade | `APP_HANDOFF_INVALID` ou `DATABASE_UNAVAILABLE`; a borda mostra a sua página | `APP_SESSION_CREATED` com os ids | 5, 6 |
| Os cookies da borda (`Set-Cookie`) | — (cada resposta grava os seus) | — | o Hub fora: a página 503 da borda, sem cookie de sessão | a linha da página | 10, 11, 12 |
| A migração de U4, que tira as colunas | `migrate` roda uma vez, antes do Hub (data D9) | a migração é uma transação: falha inteira e o Hub não sobe | o banco fora: `migrate` falha e o Hub não sobe | a saída de `migrate` | 20 |

## A tabela de referência

As citações de `main` em `4d143a99`; as da vibesdk em `9da158d8`; as da Cloudflare em
`cloudflare-docs` `180f5595`. Nenhuma linha é remendo, então nada entra em
[boundaries](../reference/boundaries.md).

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1. O endereço da Prévia | U1 | `packages/hub-api/src/address.ts:39-47` (`HostLabel`, duas partes), `:74-82` (`hostLabelOf`, o corte em `:78`), `:85-87` (`appHostOf`) | (i) Cloudflare `workers/previews/index.mdx:35-38`, mesma situação; (ii) vibesdk `worker/utils/urls.ts:93-97`, `worker/agents/core/behaviors/think.ts:365-377`, `wrangler.jsonc:212`, situação diferente (uma origem para todas as prévias, por caminho); (iii) Cloudflare `sandbox/previews/serve-previews-on-their-own-hostnames.mdx:133`, `:169`, mesma situação | (i) em `workers.dev`, `<preview-name>-<worker-name>.<subdomain>.workers.dev`, a marca no mesmo rótulo; acima de 63, `<truncated-branch-name>--<hash>-<worker-name>` (`changelog/workers/2025-08-08-…:17-18`); (ii) publicado e prévia em hosts diferentes sob um domínio; (iii) "Each preview hostname is a separate origin" | embrulhado: a marca `--previa` no rótulo e a reserva de 8 caracteres, sobre a rota e o DNS nativos | o protótipo e `run-2.txt`, cenários 1 a 3 (fora do repositório) | fundador, 2026-11-21: "2.a" | — |
| 2. A rota e o certificado | — | `apps/edge/wrangler.jsonc:9`: `*.conexusapp.tech/*` | Cloudflare `workers/configuration/routing/routes.mdx:183`; `ssl/edge-certificates/universal-ssl/limitations.mdx:26` | `*.` casa todos os sub-hosts; o certificado universal cobre "first-level subdomains" | nativo; fica de fora: não muda, e o critério 1 confere no ar | — | não precisa | — |
| 3. O ambiente pelo host, na borda | U2 | `apps/edge/src/headers.ts:32-37` (`placeOf` lê `Sec-Fetch-Dest`), `apps/edge/src/dispatch.ts:237` | vibesdk `worker/index.ts:272-279`, `:337-340`; `worker/api/handlers/space-preview.ts:137` | o host decide o caminho; `crossSite = isSeparatePreviewDomain(env)` é fato da instalação, não do pedido | nativo: o host decide | — | não precisa | — |
| 4. O cookie no host publicado | U2 | `headers.ts:47-51` (`setCookie`), `:60-65` (`appSessionCookies`) | vibesdk `worker/utils/ownerPreviewToken.ts:81-97` | `HttpOnly`, `Path=/`, `SameSite=Lax`, sem `Domain` | nativo: `Lax` sempre; a linha que apaga a forma particionada antiga fica como transição (a decisão 1 do firstmate) | — | não precisa | — |
| 5. O cookie no host da Prévia | U2 | os mesmos | vibesdk `worker/utils/spacePreviewToken.ts:63-87`, `space-preview.ts:137` | `crossSite` grava `SameSite=None; Secure; Partitioned` | nativo: `SameSite=None; Partitioned` sempre, sem transição | — | não precisa | — |
| 6. A entrada no quadro | U1, U2, U3 | `apps/edge/src/entry.ts:10-13`, `:25-49`; `apps/web/src/builder/preview/preview.tsx:84-107`; `apps/server/src/hub/apps/routes.ts:73-80` | vibesdk `space-preview.ts:151-168` | o painel põe a credencial no endereço do quadro; a prévia grava o cookie | embrulhado, como na 14.1: a página de entrada e `createAppFrameHandoff`, com o vínculo de S22. Muda o host; a constante `environment: 'preview'` sai, o host diz | o teste de ponta a ponta do critério 18 | não precisa | `tests/e2e/preview-host.test.ts` |
| 7. A entrada na aba | U1, U2 | `dispatch.ts:82-104` (`toHub`), `:114-135` (`redeem`); `routes.ts:47-70` | o fluxo de código de autorização (relay do estudo de desenho) | a cadeia de 303 | nativo, sem mudança; `/apps/open` aceita só host publicado, pelo esquema | — | não precisa | — |
| 8. O host da Prévia numa aba | U2 | nenhum | vibesdk `space-preview.ts:171-174`, `:68-78` | uma página 401 fixa, nunca redireciona | embrulhado: `failurePage` com o código `EDGE_PREVIEW_OUTSIDE_HUB` e um link ao Hub. `Sec-Fetch-Dest` só escolhe entre a página de entrada e esta, nunca a forma de um cookie; sem o cabeçalho, esta | `run-2.txt`, cenário 5 | fundador, 2026-11-21: "4a"; o texto, no fim | — |
| 9. Quem pode emoldurar | U2 | `headers.ts:10-12` (`appPolicyOf`, sempre o Hub); `apps/edge/src/pages.ts:79`; `dispatch.ts:67`, `:231`, `:233`, `:264`; `apps/server/src/platform/http.ts:46` | `packages/app-contract/src/page.ts:5-7`, a peça nativa já em uso; nenhuma referência lida recusa moldura no app publicado (vibesdk `worker/config/security.ts:212` vale só para a API do painel) | `appContentSecurityPolicy(frameAncestor)` já aceita `'none'`, que a conferência usa | embrulhado: `'none'` no host publicado, o Hub no da Prévia, nas respostas do app e nas páginas da borda. O `frame-src` do Hub fica `https://*.<domínio>`: a gramática da CSP só aceita `*.` no começo (`w3c/webappsec-csp` `e3461f7c` `index.bs:687`) | `run-2.txt`, cenário 4 | não precisa | — |
| 10. A passagem e a sessão sem `environment` | U1, U4 | `apps/server/src/hub/apps/tables.ts:33-35`, `:47`, `:51`, `:69`, `:72`; `handoff.ts:56`, `:61-66`, `:82`, `:122`, `:163`, `:177-178`; `routes.ts:64`, `:76` | vibesdk `ownerPreviewToken.ts:18-23`, `:40-54`; `spacePreviewToken.ts:7-17`, `:27-48` | a credencial nomeia o seu escopo e leva um `purpose` que separa a da prévia da do publicado | nativo: `host_label` já prende a sessão ao host (`handoff.ts:107`, `:151`), e com a marca ele faz o papel do `purpose`; o ambiente sai do rótulo por `appOfHost`. U1 para de ler a coluna; U4 a tira | `run-2.txt`, cenário 7 com o Hub de mentira; no Hub de verdade, o critério 6 | não precisa | as duas migrações de U4 numa pasta nova de `apps/server/migrations/` |
| 11. Qual versão a chamada recebe | U1 | `handoff.ts:215-241` (`connectorCall`), `:248-285` (`callTo`); `apps/server/src/hub/projects/hosts.ts:167-203`, `:219-246` | vibesdk `worker/index.ts:162-206` | pelo host, depois `dispatcher.get(appName)` | nativo: os dois ponteiros ficam; escolhe o ambiente do host da sessão | — | não precisa | — |
| 12. A tela da Prévia: o quadro e a barra | U1, U3 | `preview.tsx:86` (o `src`), `:91` (a origem ouvida), `:183-189` (a barra), `:191-202` (**Abrir app**); `packages/hub-api/src/projects.ts:38-43` (`Project.address`) | vibesdk `src/routes/chat/components/main-content-panel.tsx:185`, `:284-292` | a barra mostra o título do app e copia o endereço real da prévia | nativo: troca de texto e de `src`; o endereço vem do Hub (`previewAddress`), pela regra de `address.ts` | — | fundador, 2026-11-21: "3.b" | — |
| 13. O aviso do WebKit na Prévia | — | `preview.tsx:208-230`; `apps/web/src/builder/preview/webkit.ts` | vibesdk `src/routes/chat/components/preview-compat-banner.tsx:28-34`, `:56-65` | o aviso em navegador Apple, com "Open in new tab" | nativo; fica de fora: fica como está, e o botão de nova aba espera (fica de fora, na página) | — | não precisa | — |
| 14. A página "Este navegador não guardou a sua entrada." | U2 | `dispatch.ts:143-148` (`land`); `pages.ts:28-33` | vibesdk `space-preview.ts:171-174` | página no lugar de nova volta | embrulhado, como no pull request 1214: fica como está, nos dois hosts | a revisão do pull request 1214 | já decidida ("4. B", 2026-11-21) | — |
| 15. O vínculo `__Host-conexus-binding` | U2 | `dispatch.ts:83-90` | as das linhas 4 e 5 | a forma do cookie é a do host | nativo | `run-2.txt` | não precisa | — |
| 16. As regras escritas | U4 | `docs/guides/security.md:74-88` (S24); `docs/decisions/0024-app-address-one-host-per-app.md`; `docs/explanation/app-contract-and-dispatcher.md:79-81`, `:95-102`; `docs/explanation/hub-apps.md:63-64` | — | — | nativo: só documento, no fechamento (delivery L19, L20) | — | fundador, pela aprovação do cartão | — |

**A medida do transplante.** Não se aplica: nada vem do repositório antigo. A Prévia nasceu na 14.1,
da forma da vibesdk.

**A dívida.**

- A linha de transição do host publicado (apagar a sessão particionada antiga antes de gravar a
  `Lax`) fica com "Revalidate by 2027-02-22" no comentário; sai quando nenhuma sessão gravada antes
  do pull request 1211 puder estar viva.
- Abrir a Prévia numa aba nova: gatilho, o primeiro relato num navegador Apple (issue 440).
- O Safari abaixo do 26.2 e um navegador que ignore `Partitioned` e bloqueie cookies de terceiros:
  a Prévia não abre no quadro, como hoje; o aviso cobre.

## As decisões do firstmate

| # | Decisão reversível ([delivery L6](../guides/delivery.md)) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | Manter, no host publicado, a linha que apaga a forma particionada antiga, com data de revalidação | uma aba pode guardar a sessão particionada de antes do pull request 1211, cookie de sessão do navegador sem prazo conhecido; é código testado (`dispatcher-tab.test.ts:131`, `:140`). Trocar o nome do cookie faria todo mundo passar pelo Hub no deploy, e nenhuma referência lida faz isso por esse motivo | apagar a linha e o teste dela |
| 2 | A forma do contrato: `HostLabel` fica o rótulo do app (duas partes); entram `PreviewHost` (três partes, a última `previa`) e `AppHost = HostLabel \| PreviewHost`. Cada porta recusa o host do outro ambiente pelo esquema: `/apps/open` só `HostLabel`, `createAppFrameHandoff` só `PreviewHost`, as rotas da borda `AppHost` | a outra forma, a do protótipo (alargar `HostLabel` e um `isPreviewHost` booleano), deixa cada rota aceitar os dois e pede um `if` à mão em cada porta; com ela, `/apps/open` daria um passe publicado a um host da Prévia sem o `if`. Com a união, o tipo diz o ambiente (code C22, C27) | alargar `HostLabel` e checar à mão |
| 3 | O endereço da Prévia vem do Hub, `Project.previewAddress`, e não é montado na tela | a regra do endereço tem um dono, `address.ts` (0024, code C26), e o Hub já monta `address` por ela (`projects.ts:87-88`); a tela só tem o host, não o rótulo | a tela chamar `previewHostOf` sobre um rótulo que o Hub mande |
| 4 | Um rótulo de 56 a 63 caracteres não tem host de Prévia: `previewHostOf` devolve `undefined`, o Hub manda `previewAddress: null` e a Prévia mostra o palco, como para um Projeto sem endereço. O critério 1 confere que nenhum existe | a contagem do estudo ficou sem acesso ao banco; a saída da Cloudflare (cortar e pôr um código, guardado numa coluna) só se paga se houver algum. Com a reserva, nenhum rótulo novo passa de 55 | a coluna de rótulo de Prévia guardado, por emenda deste cartão |
| 5 | Nenhuma sessão ou passe é apagado em G1. Uma sessão de Prévia de hoje tem o rótulo publicado em `host_label`; depois de G1 ela vale no host publicado, para a mesma pessoa e o mesmo Projeto, com a admissão lida de novo | o membro é admitido nos dois ambientes (`hosts.ts:185`) e quem só recebeu o app nunca teve sessão de Prévia; o pior caso é um membro ver a versão publicada no host publicado, que é o certo. O estudo propunha apagar; não muda nada que a pessoa veja | uma migração que apaga as sessões `preview` |
| 6 | Em G1 o Hub continua gravando `environment`, tirado do host, e nunca o lê; U4 tira a coluna | data D6: uma imagem de antes de G1 lê a linha inteira (`handoff.ts:146-149`); voltar a ela com a coluna nula a leria como Prévia. Duas fontes por uma publicação, só de escrita | tirar a coluna já em G1, com a linha de volta da arquitetura nomeando a publicação de G1 |
| 7 | A publicação de G1 põe a borda e o Hub no ar sem ordem escolhida: a Prévia pode falhar por minutos entre as duas; o app publicado não falha em nenhuma ordem | o caminho do publicado não muda; só membros usam a Prévia | publicar a borda por último |
| 8 | A página nova responde 401 e o link leva à origem do Hub (`/`), não ao Projeto | a vibesdk responde 401 (`space-preview.ts:171-174`); a borda não sabe o id do Projeto, e montar o endereço do Projeto pediria ao Hub um dado que a recusa não deve pedir | outro destino para o link |

## O que o cartão do `A1` relê

O cartão do `A1` (pull request 1203, em `4664fb61`) se apoia em linhas que esta etapa troca. Quem
entrar depois relê; com a ordem "5a", é ele:

- **Linha 192** (a peça "Ambiente da sessão"): `APP_ENVIRONMENTS` sai de `tables.ts`; o tipo
  `AppEnvironment` passa a morar em `packages/hub-api/src/address.ts`, e o ambiente vem do host. O
  `CallEnvironment = AppEnvironment | 'check'` das linhas 490 a 492 importa de lá.
- **Linhas 490 a 492**: "`APP_ENVIRONMENTS` e as restrições `handoff_environment` e
  `app_session_environment` ficam como estão" deixa de valer: U4 as tira.
- **Linha 193** e o passo 4 da U2 dele (linha 582): `admitCall` passa a tirar o ambiente de
  `appOfHost(input.host)`. Uma sessão de conferência achada em `check_session` no host publicado
  teria dois ambientes; o `A1` escolhe entre ler o ambiente da tabela de conferência ou dar à
  conferência o host dela pela mesma regra (por exemplo `--conferencia`).
- **Linha 575** (`openConference` devolve `appHostOf` do Projeto) e o critério 7 dele (o cookie
  `__Host-conexus-app` no host do app): o host publicado passa a ter `frame-ancestors 'none'` e
  cookie `Lax`, o que o navegador da máquina, numa aba, aceita.

## U1 O endereço da Prévia e o Hub pelo host

**Base e modelo.** `main` `4d143a99`. Opus: o contrato atravessa a borda, o Hub e a tela, e mexe na
porta de entrada dos apps (security S22, S24).

### As linhas da tabela

- **1. O endereço da Prévia.** Ler `packages/hub-api/src/address.ts` inteiro (95 linhas) e
  `address.test.ts`. Seguir a Cloudflare `workers/previews/index.mdx:35-38` (a marca no mesmo
  rótulo) e `sandbox/previews/serve-previews-on-their-own-hostnames.mdx:133` (um host, uma origem).
- **6, 7. As entradas.** Ler `packages/hub-api/src/apps.ts:33-66` e `apps/server/src/hub/apps/routes.ts:47-81`.
- **10. A passagem e a sessão.** Ler `apps/server/src/hub/apps/handoff.ts` inteiro e
  `tables.ts:23-79`. Seguir vibesdk `worker/utils/spacePreviewToken.ts:27-48` (a credencial com o
  seu escopo, comparada com o do pedido).
- **11. A versão.** Ler `handoff.ts:195-285` e `apps/server/src/hub/projects/hosts.ts:156-246`.
- **12. O endereço na tela.** Ler `packages/hub-api/src/projects.ts:33-44` e
  `apps/server/src/hub/projects/projects.ts:85-91`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/address.ts` | Muda: `PreviewHost`, `AppHost`, `AppEnvironment`, `appOfHost`, `previewHostOf`, a reserva em `hostLabelOf`, `appHostOf` com `AppHost` | a borda, o Hub, a web (`name-step.tsx`, `welcome-company.tsx`, `company-general.tsx` usam `hostLabelOf` e `appHostOf` sem mudar) |
| `packages/hub-api/src/apps.ts`, `project-connections.ts`, `projects.ts` | Muda: `OnHost` e `OnConnector` com `AppHost`; `AppOpenQuery` com `HostLabel`; `FrameEntry` e o corpo de `createAppFrameHandoff` com `PreviewHost`; `Project.previewAddress` | a borda (`hub.ts`, `entry.ts`), o Hub, a web (`preview.tsx`) |
| `apps/server/src/hub/apps/` | Muda: `handoff.ts`, `routes.ts`, `tables.ts`, `read-notice.ts` e os testes | `hub/connectors/app-calls.ts`, `hub/projects/` |
| `apps/server/src/hub/projects/` | Muda: `hosts.ts` (o tipo do ambiente), `projects.ts` (`previewAddress`) | `hub/apps/` |
| `apps/server/src/hub/connectors/app-calls.ts` | Muda: o tipo do host | as rotas da borda |
| `apps/web/src/platform/test-hub.tsx`, `apps/web/src/builder/conversation/test-start.tsx`, os testes que montam um `Project` (`hub/projects/new-project.test.tsx`, `hub/requests/*.test.tsx`), `apps/web/src/builder/preview/preview.test.tsx:28` | Muda: só os dublês (o campo novo e o host da `FrameEntry`), consequência direta do contrato (delivery L7) | os testes da web |

### Os contratos que a unidade cria

Em `packages/hub-api/src/address.ts`:

```ts
/** The Prévia's mark, a third part after the app's label (decision 0024). */
const PREVIEW_MARK = 'previa'

/** Where an app runs: the Hub's Prévia or the published app. One owner (C26); was `APP_ENVIRONMENTS`. */
export const AppEnvironment = z.enum(['preview', 'published'])
export type AppEnvironment = z.infer<typeof AppEnvironment>

/** `HostLabel` stays the app's label, two parts, and is the published host. */
/** The Prévia's host: the app's label and `--previa`, at most 63 characters. */
export const PreviewHost: z.ZodType<string & z.$brand<'PreviewHost'>>  // a branded refine, as HostLabel
export type PreviewHost = z.infer<typeof PreviewHost>

/** Any host the browser opens an app at. */
export const AppHost = z.union([HostLabel, PreviewHost])
export type AppHost = z.infer<typeof AppHost>

export function appOfHost(host: AppHost): { label: HostLabel; environment: AppEnvironment }
/** `undefined` when the label leaves no room for the mark (56 to 63 characters). */
export function previewHostOf(label: HostLabel): PreviewHost | undefined
export function appHostOf(input: { label: AppHost; appsDomain: string }): string
```

`hostLabelOf` reserva `SEPARATOR.length + PREVIEW_MARK.length` (8) em `room` (`:78`). Nenhum apelido
novo vira reservado: um rótulo publicado tem sempre duas partes, e o host da Prévia três, então
`estoque--previa` (empresa de apelido `previa`) e `estoque--previa--previa` não se confundem.

Em `packages/hub-api/src/projects.ts`: `Project` ganha `previewAddress: z.string().min(1).nullable()`,
o host da Prévia com o domínio, `null` quando `address` é `null` ou quando `previewHostOf` não
existe.

As assinaturas do Hub que mudam (`apps/server/src/hub/apps/handoff.ts`):

```ts
createHandoff(deps, input: { person: Person; sessionToken: string; host: AppHost; binding: string })
redeemHandoff(deps, input: { host: AppHost; code: string; binding: string })
admitCall(deps, input: { host: AppHost; headers: Headers }): Promise<Admitted>
checkCall(deps, input: { host: AppHost; headers: Headers }): Promise<AppCall>
connectorCall(deps, input: { host: AppHost; headers: Headers }): Promise<ConnectorCall>
```

`createHandoff` perde o campo `environment`; `routes.ts:64` e `:76` perdem a constante.
`admitToApp` e `accessOf` (`hosts.ts`) tomam `environment: AppEnvironment`, importado de
`@conexus/hub-api`, e o comentário de C6 em `:225` sai. Nenhuma rota, código de falha ou coluna
nova; nenhuma migração em U1.

- **Cada estado.** `AppEnvironment` é a união de literais; `appOfHost` é o único lugar que a tira do
  host.
- **Cada id.** `HostLabel`, `PreviewHost` e `AppHost` são marcas criadas só pelo parse (C23),
  conferidas nas portas: o esquema de cada operação em `apps.ts` e `project-connections.ts`.
- **O dono de cada fato.** A marca, a reserva e o ambiente de um host: `address.ts`. O ambiente de
  uma sessão: o host dela, `app_session.host_label`.
- **O esquema Zod de cada entrada externa.** Os de `apps.ts` e `project-connections.ts`, nas rotas.
- **O arquivo modelo.** `address.ts`: cumpre C21 (sem ciclo de vida), C23 (as marcas só pelo parse)
  e C26 (a regra num lugar só).

### As skills e a leitura

`zod` (`zod.dev/llms.txt`: `union`, `brand`, `refine`); `fastify` (skill
`fastify-best-practices`); `drizzle-orm` (`orm.drizzle.team/llms.txt`). Ler primeiro
[security](../guides/security.md) S10, S22, S24, S48.

### A ordem do trabalho

1. **A regra do endereço.** Critérios: 2, 3.
   - **Arquivos:** muda `packages/hub-api/src/address.ts`, `address.test.ts`.
   - **Referência a seguir:** Cloudflare `workers/previews/index.mdx:37`.
   - **O que sai:** nada.
   - **O que entra:** `PREVIEW_MARK`, `AppEnvironment`, `PreviewHost`, `AppHost`, `appOfHost`,
     `previewHostOf`, a reserva em `hostLabelOf`, `appHostOf` com `AppHost`. Regras: C22, C23, C26.
   - **Testes:** `address.test.ts`, os casos dos critérios 2 e 3; o caso da linha 23 passa a 55.
   - **Mutações à mão:** tirar a reserva de `room` → o caso do nome de 100 com apelido de 30 fica
     vermelho; aceitar qualquer terceira parte em `PreviewHost` → o caso de três partes sem
     `previa` fica vermelho.
   - **Pronto quando:** `npm run test -w @conexus/hub-api` verde.
2. **As portas pelo esquema.** Critérios: 4, 5.
   - **Arquivos:** muda `packages/hub-api/src/apps.ts`, `project-connections.ts`;
     `apps/server/src/hub/apps/routes.ts`, `handoff-route.test.ts`, `frame-handoff.test.ts`;
     `apps/web/src/builder/preview/preview.test.tsx:28` (o host da `ENTRY` com a marca).
   - **O que sai:** `environment: 'published'` (`routes.ts:64`) e `environment: 'preview'` (`:76`).
   - **O que entra:** `OnHost = z.object({ host: AppHost })`; `AppOpenQuery =
     z.object({ host: HostLabel, binding: DoorSecret })`; `FrameEntry` e o corpo de
     `createAppFrameHandoff` com `host: PreviewHost`; `OnConnector` com `AppHost`. Regras: S24,
     S48, C27.
   - **Testes:** os casos dos critérios 4 e 5, pela rota (`hub.inject`, `frameHandoff` de
     `test-handoff.ts`).
   - **Mutações à mão:** `AppOpenQuery` com `AppHost` → o caso do host da Prévia em `/apps/open`
     fica vermelho (grava um passe).
   - **Pronto quando:** os testes de `hub/apps` verdes.
3. **O ambiente pelo host.** Critérios: 6, 7, 8.
   - **Arquivos:** muda `handoff.ts`, `tables.ts`, `read-notice.ts`, `hub/projects/hosts.ts`,
     `hub/connectors/app-calls.ts`; os testes `app-handoff.test.ts`, `frame-handoff.test.ts`,
     `app-calls.test.ts`, `read-notice.test.ts`.
   - **O que sai:** a leitura de `row.environment` em `admitCall` (`handoff.ts:163`, `:177`);
     `APP_ENVIRONMENTS` e `AppEnvironment` de `tables.ts:33-35` (a coluna passa a usar
     `AppEnvironment.options` de `@conexus/hub-api`); o literal de `hosts.ts:174`, `:225-226`.
   - **O que entra:** `createHandoff` e `admitCall` tiram `{ label, environment }` de
     `appOfHost(input.host)` e chamam `projectOfHost(label)`; `createHandoff` grava `host_label`
     igual a `input.host` e, até U4, `environment` igual ao do host; o `location` é
     `appHostOf({ label: input.host, … })`. `redeemHandoff` como hoje. Regras: S8, S10, S22, C65.
   - **Testes:** os casos dos critérios 6, 7, 8, pela porta `edge` (`hub.edge.inject`) e pela rota
     da Prévia.
   - **Mutações à mão:** `admitCall` sem `eq(appSession.hostLabel, input.host)` (`:151`) → o caso
     do critério 6 fica vermelho; `appOfHost` devolvendo sempre `published` → o caso da versão da
     Prévia do critério 7 fica vermelho.
   - **Pronto quando:** `npm run test -w @conexus/server` verde.
4. **O endereço da Prévia no `Project`.** Critério: 9.
   - **Arquivos:** muda `packages/hub-api/src/projects.ts`, `apps/server/src/hub/projects/projects.ts`
     e `projects.test.ts`; os dublês da web do raio.
   - **O que entra:** `viewOf` monta `previewAddress` com `previewHostOf` e `appHostOf`.
   - **Testes:** o caso do critério 9.
   - **Pronto quando:** `npm run check` e os testes das três áreas verdes.

### Como se prova

Os critérios 2 e 3 pelos testes puros de `address.ts`; 4 a 9 pela porta pública do Hub (testing
T5), no Postgres dos testes. Nenhuma gravação de biblioteca (T26): a etapa não lê fluxo de
biblioteca. Hoje o critério 4 passaria por acaso (`HostLabel` já recusa três partes), mas os
critérios 5, 6 e 7 falham: não há host da Prévia.

### Parar se

- O critério 1 não deu zero: pare antes do merge e volte ao cartão com a lista (a decisão 4 do
  firstmate).
- Um teste de `hub/apps` precisar ler `environment` para passar: a premissa da decisão 5 caiu; pare
  com o caso.

## U2 A borda pelo host

**Base e modelo.** O commit de U1. Opus: cookies, molduras e a porta dos apps (security S17, S24).

### As linhas da tabela

- **3. O ambiente pelo host.** Ler `apps/edge/src/headers.ts` inteiro e `dispatch.ts:49-104`,
  `:225-266`. Seguir vibesdk `worker/index.ts:272-279` (o host escolhe o caminho) e
  `space-preview.ts:137` (a forma do cookie fixa).
- **4, 5, 15. Os cookies.** Ler `headers.ts:39-65`, `dispatch.ts:82-90`. Seguir vibesdk
  `ownerPreviewToken.ts:81-97` (publicado) e `spacePreviewToken.ts:63-87` (prévia).
- **8, 14. As páginas.** Ler `apps/edge/src/pages.ts` inteiro e `entry.ts`. Seguir vibesdk
  `space-preview.ts:171-174`.
- **9. Quem emoldura.** Ler `packages/app-contract/src/page.ts:1-7`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/edge/src/headers.ts` | Muda: `placeOf` e `Place` saem; `setCookie`, `appSessionCookies`, `appPolicyOf` tomam o ambiente; entra `frameAncestorOf` | `dispatch.ts`, `pages.ts` |
| `apps/edge/src/dispatch.ts` | Muda: o host por `AppHost`, o ambiente por `appOfHost`, `toHub` por ambiente | `dispatcher.ts`, `tests/e2e/` |
| `apps/edge/src/pages.ts` | Muda: o código `EDGE_PREVIEW_OUTSIDE_HUB`; o link da página por destino; `failurePage` com o ancestral | `dispatch.ts` |
| `apps/edge/src/entry.ts`, `db.ts`, `connectors.ts`, `hub.ts` | Muda: o tipo do host (`PreviewHost`, `AppHost`) | `dispatch.ts`, `dispatcher.ts` |
| `apps/edge/src/*.test.ts`, `test-edge.ts` | Muda: os casos de hoje nos dois hosts | — |

### Os contratos que a unidade cria

```ts
// apps/edge/src/headers.ts
/** Who may frame a host: the Hub the Prévia, nobody the published app or a host that is no app's. */
export function frameAncestorOf(hubOrigin: string, environment: AppEnvironment | undefined): string
export function appPolicyOf(env: Env, environment: AppEnvironment): string
export function setCookie(name: string, value: string, environment: AppEnvironment): string
export function appSessionCookies(session: string, environment: AppEnvironment): string[]

// apps/edge/src/pages.ts
type Page = { status: number; phrase: string; action: string; link?: { text: string; to: 'APP' | 'HUB' } }
// EDGE_SESSION_NOT_KEPT: link { text: 'Tentar de novo', to: 'APP' } (hoje `retry`)
// EDGE_PREVIEW_OUTSIDE_HUB: { status: 401, phrase: 'A Prévia abre dentro do Conexus.', action: '', link: { text: 'Abrir o Conexus', to: 'HUB' } }
export async function failurePage(
  code: PageCode,
  page: { hubOrigin: string; environment: AppEnvironment | undefined },
  log?: PageLog,
): Promise<Response>
export type PageLog = { reason?: NoAnswerReason } | { host: AppHost; rounds?: number }
```

`Visit` troca `label` e `place` por `host: AppHost` e `environment: AppEnvironment`. `serveDispatch`
lê o host antes do `try`, para que a página 500 leve o ancestral dele. Um link `APP` é `/`; um
`HUB` é a origem do Hub. `appSessionCookies` no publicado: gravar é `[apagar a particionada, gravar
a Lax]`, apagar é as duas formas; na Prévia: gravar é só a particionada, apagar é só a particionada.

- **Cada estado.** `AppEnvironment`, de `@conexus/hub-api`; nenhuma união nova.
- **O dono de cada fato.** Quem emoldura um host: `frameAncestorOf`, lido por `appPolicyOf` e
  `failurePage`. A forma do cookie: `setCookie`. O texto da página: `PAGES`.
- **O arquivo modelo.** `headers.ts` cumpre C26; `dispatch.ts` não é modelo (o `Visit` carrega
  tudo).

### As skills e a leitura

`wrangler` (skills `cloudflare:wrangler`, `cloudflare:workers-best-practices`;
`developers.cloudflare.com/workers/llms.txt`). Ler primeiro [security](../guides/security.md) S17,
S22, S24, S41.

### A ordem do trabalho

1. **O ambiente pelo host.** Critérios: 10, 11, 13, 15.
   - **Arquivos:** muda `headers.ts`, `dispatch.ts`, `entry.ts`, `db.ts`, `connectors.ts`, `hub.ts`;
     os testes `dispatcher-tab.test.ts`, `dispatcher-frame.test.ts`, `dispatcher-connectors.test.ts`,
     `db.test.ts`.
   - **Referência a seguir:** vibesdk `worker/index.ts:272-279`; `space-preview.ts:137`.
   - **O que sai:** `Place` e `placeOf` (`headers.ts:32-37`), com o chamador `dispatch.ts:237`; o
     ramo `visit.place === 'FRAME'` de `toHub` (`dispatch.ts:92`) como escolha de cookie.
   - **O que entra:** `dispatch` lê `AppHost` do hostname e `appOfHost`; `toHub` no publicado é o 303
     de sempre; na Prévia, a página de entrada quando `Sec-Fetch-Dest` é `iframe`. Os cookies pelo
     ambiente. `Db` e `Connectors` recebem `host`. Comentário "Revalidate by 2027-02-22" na linha de
     transição. Regras: S17, S22, S24.
   - **Testes:** os casos dos critérios 10, 11, 13, 15.
   - **Mutações à mão:** `setCookie` com `Lax` na Prévia → o caso do critério 11 fica vermelho;
     `toHub` dando a página de entrada no publicado com `iframe` → o caso do critério 13 fica
     vermelho.
2. **Quem emoldura e as páginas.** Critérios: 10, 11, 12, 14, 16.
   - **Arquivos:** muda `headers.ts`, `pages.ts`, `dispatch.ts`; os testes
     `dispatcher-frame.test.ts`, `dispatcher-guards.test.ts`, `dispatcher-log.test.ts`,
     `dispatcher-tab.test.ts`.
   - **O que sai:** `retry` de `Page`; `failurePage(code, hubOrigin, log)` com os chamadores
     `dispatch.ts:67`, `:231`, `:233`, `:264`.
   - **O que entra:** `frameAncestorOf`, `failurePage` com `page`, o código
     `EDGE_PREVIEW_OUTSIDE_HUB` e o ramo de `toHub` na Prévia sem `iframe`. Regras: S24, S41.
   - **Testes:** os casos dos critérios 12, 14, 16; o critério 10 lê o CSP de cada resposta.
   - **Mutações à mão:** `frameAncestorOf` devolvendo sempre o Hub → o caso do host publicado do
     critério 10 fica vermelho; a página nova redirecionando → o caso do critério 12 fica vermelho.
   - **Pronto quando:** `npm run test -w @conexus/edge` verde.

### Como se prova

Pelos dublês de `apps/edge/src/test-edge.ts`, que chamam `serveDispatch` como a Cloudflare chama
(testing T5). O critério 18 (U3) prova os mesmos cookies e molduras num Chromium de verdade.

### Parar se

- O protótipo do estudo deu `frame-ancestors` do Hub numa página 403 do host publicado
  (`pages.ts:79`): se um caminho de falha não alcançar o ambiente, pare e diga qual, em vez de
  escolher um ancestral.

## U3 A tela da Prévia

**Base e modelo.** O commit de U2. Sonnet: troca de texto e um teste de ponta a ponta no molde de
`tests/e2e/app-open.test.ts`.

### As linhas da tabela

- **6. A entrada no quadro** e **12. A tela.** Ler `apps/web/src/builder/preview/preview.tsx`
  inteiro e `preview.test.tsx`; `tests/e2e/app-open.test.ts:1-60` (o Chromium com o Hub e o
  despachante de verdade atrás de um servidor TLS local) e `tests/e2e/versions.test.ts` (as
  versões pelo Builder). Seguir vibesdk `main-content-panel.tsx:284-292` (a barra com o endereço
  real).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/preview/` | Muda: `preview.tsx`, `preview.test.tsx` | `builder/conversation/` (o painel) |
| `tests/e2e/` | Cria: `preview-host.test.ts` | `npm run e2e` |
| `package.json` | Muda: a lista de `e2e` | CI |

### Os contratos que a unidade cria

Nenhum. `Frame` passa a tomar `previewAddress`; `Preview` lê `address`, `previewAddress`,
`appVersion` e `publishedVersion` do `Project`, e mostra o palco quando `appVersion`, `address` ou
`previewAddress` é `null`.

### As skills e a leitura

`@tanstack/react-query` (`tanstack.com/query/latest/llms.txt`); `vitest`; `playwright-core`
(skill `playwright-cli`). Ler primeiro [web](../guides/web.md) e [testing](../guides/testing.md)
T14, T25.

### A ordem do trabalho

1. **O quadro e a barra.** Critério: 17.
   - **Arquivos:** muda `preview.tsx`, `preview.test.tsx`.
   - **O que sai:** `https://${address}/` como `src` (`:86`) e como origem ouvida (`:91`);
     `address` na barra (`:185`).
   - **O que entra:** `previewAddress` nos três lugares; **Abrir app** com `address` (`:194`). Regra:
     S24.
   - **Testes:** os casos do critério 17; uma mensagem da origem publicada é ignorada.
   - **Mutações à mão:** ouvir a origem publicada → o caso da mensagem ignorada fica vermelho.
2. **A prova de ponta a ponta.** Critério: 18.
   - **Arquivos:** cria `tests/e2e/preview-host.test.ts`; muda `package.json`.
   - **Referência a seguir:** `tests/e2e/app-open.test.ts:29-42` (os dois sites no mesmo Chromium,
     pelos nomes resolvidos para o servidor TLS local); o roteiro `drive.mjs` do estudo (fora do
     repositório).
   - **O que entra:** um Projeto com a versão 1 publicada e a 2 na Prévia; a Prévia no Hub e o app
     numa aba ao mesmo tempo; os cookies lidos do contexto; uma página do Hub de teste que emoldura
     o host publicado; o host da Prévia aberto numa aba.
   - **Pronto quando:** `npm run e2e` verde com o teste novo; a issue 358 fecha no fechamento.

### Como se prova

O critério 17 pela tela montada com o dublê do Hub (`test-hub.tsx`); o 18 no Chromium, com o Hub e o
despachante de verdade (testing T14). Hoje o 18 falha: não há host da Prévia.

### Parar se

- O teste de ponta a ponta não consegue servir os dois hosts e o Hub num servidor TLS, como o
  `app-open.test.ts` faz: pare com a saída, em vez de trocar o Chromium por dublês.

## G1 O ponto de conferência

Depois de U3, antes do pull request: o critério 1 de novo; `npm run check` com
`CONEXUS_DRAFT` como o pull request pede; `npm run test` das quatro áreas; `npm run e2e` com o teste
novo; o Hub local com a Prévia aberta no Chromium e o host da Prévia numa aba, a 1366 e 390 px, nos
dois temas, para o QA (testing T25).

## U4 O fechamento

**Base e modelo.** O `main` depois do merge e da publicação de G1, e do uso. Sonnet.

### As linhas da tabela

- **10. Sem `environment`.** Ler `apps/server/src/hub/apps/tables.ts:33-79`, `handoff.ts` nas
  gravações de `environment`, `tables.test.ts:7-60` e a migração da 17
  (`apps/server/migrations/20261028172015_e17_published_version/migration.sql`).
- **16. As regras escritas.** Ler S24, a 0024, as duas explicações nas linhas da tabela e
  `docs/architecture.md:168-174` (a volta de imagem).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/apps/` | Muda: `tables.ts`, `handoff.ts`, `tables.test.ts` | — |
| `apps/server/migrations/` | Cria: a migração gerada por `drizzle-kit generate` | `migrate` |
| `docs/` | Muda: `architecture.md`, a 0024, `security.md` (só se o pull request de método não tiver entrado), as duas explicações, `docs/approvals/` (o firstmate), `docs/steps/` (apaga o cartão) | — |

### Os contratos que a unidade cria

Saem de `apps.app_session` e `apps.handoff` a coluna `environment` e as restrições
`app_session_environment` e `handoff_environment`. Nenhuma chave estrangeira muda. A migração leva
a linha `-- contract: no image since G1's release reads environment; the host says it` (data D6).
`docs/architecture.md`, "Roll back", ganha a publicação de U4 na lista das que nenhuma imagem
anterior atravessa.

### As skills e a leitura

`drizzle-orm` (`orm.drizzle.team/llms.txt`). Ler primeiro [data](../guides/data.md) D5, D6, D30 e
[delivery](../guides/delivery.md) L19, L20.

### A ordem do trabalho

1. **A coluna sai.** Critério: 20.
   - **Arquivos:** muda `tables.ts`, `handoff.ts`, `tables.test.ts`; cria a migração.
   - **O que sai:** a coluna e o `check` nas duas tabelas (`tables.ts:47`, `:51`, `:69`, `:72`); as
     gravações em `createHandoff` e `redeemHandoff` (`handoff.ts:82`, `:122`).
   - **Testes:** `tables.test.ts` sem as duas linhas; `npm run migrations -- --base origin/main`.
2. **As regras escritas.** Critério: 21.
   - **O que entra:** na 0024, a "Decision" do estudo: "Each app and environment has its own host,
     one level under the apps' domain. The published app is `<projeto>--<apelido>`; the Prévia is
     the same label and the mark `--previa`. The environment is a property of the host."; o
     "Result" com a etapa; o último parágrafo da emenda da 17 sai. S24: se o pull request de método
     já a escreveu, conferir; se não, escrever. As explicações, nas linhas da tabela. As issues: a
     358 fecha; o primeiro item da 440 sai. O cartão sai e a linha de uso entra (delivery L19).
   - **Pronto quando:** `npm run docs` verde.

### Como se prova

O catálogo pelo teste de `tables.test.ts` no Postgres dos testes; os documentos por `npm run docs`.

### Parar se

- O uso do fundador mostrou outra coisa que a página promete: o fechamento espera o conserto.

## G2 O ponto de conferência

Depois de U4: `npm run check`, `npm run test -w @conexus/server`, `npm run migrations`, e `migrate`
num banco de teste com uma sessão de antes, que continua valendo pelo host.
