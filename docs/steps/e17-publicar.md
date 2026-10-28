# Etapa 17: Publicar

## A página do fundador

**No fim desta etapa** a Ana publica o app que está na Prévia e o abre no endereço dele. Daí em
diante o Builder continua mudando a Prévia, e quem abre o app vê só a versão publicada, até alguém
publicar de novo.

**O roteiro de uso.** Padaria Sol, com a Ana (dona) e o Bruno (membro), no computador e no celular,
num Projeto novo, criado depois que a 17 entra no ar: os Projetos que já têm versão entram nela já
publicados.

1. A Ana cria o Projeto "Encomendas" e pede o app ao Builder. A Prévia mostra a versão 1. O endereço
   `encomendas--padaria-sol.<domínio>` mostra "Este app ainda não foi publicado", e o botão **Abrir
   app** não aparece.
2. A Ana toca **Publicar**, no alto do Projeto. A pergunta: "Publicar a versão 1? Quem abrir o app
   passa a ver esta versão." Ela confirma. No lugar do botão aparece "Versão 1 publicada", e o
   **Abrir app** aparece.
3. A Ana toca **Abrir app**: o app abre numa aba nova, na versão 1.
4. O Bruno, na tela dele, pede ao Builder: "Ponha o campo observação." A Prévia dele mostra a versão
   2. Na aba do app da Ana, nada muda: a 1 continua lá.
5. Na aba **Versões** do Bruno, a 2 tem a marca **Na Prévia** e a 1 a marca **Publicada**. Ele toca
   **Publicar esta** na 2, e o app passa para a 2.
6. A 2 tem um problema. A Ana, na tela dela, recarrega o Projeto e toca **Publicar esta** na 1. O app
   volta para a 1. A Prévia e o Builder seguem na 2, e os dados ficam como estão.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. No fim: faz
o roteiro no computador e no celular, diz o que viu e aprova os textos novos (o botão, a pergunta,
as duas marcas e a página do app não publicado).

**Fica de fora.**
- Dados separados para a Prévia e o app publicado: a sua `A1`, 2026-10-27. A Prévia e o app gravam no
  mesmo banco, com a garantia da 15. Volta à mesa quando a primeira empresa tiver dados reais e o
  teste na Prévia atrapalhar.
- A etiqueta (tag) no Git ao publicar: a sua `B1`, 2026-10-27. A marca **Publicada** é a etiqueta.
- "Restaurar na Prévia" (o código antigo de volta ao Builder): a sua `D1`. Quem quiser o código antigo
  pede ao Builder.
- Publicar não roda migração, e o ensaio da migração num ramo do Neon sai: com `A1` a migração já
  rodou no envio, numa transação de tudo ou nada. Isto troca a sua resposta 3 de 2026-10-22, que
  adiou esse ensaio da 15 para a 17.
- Despublicar, link público, domínio próprio e quem entra no app: ninguém pediu ainda; quem entra no
  app é a etapa 18.
- Das pendências marcadas para o próximo cartão: o Voltar seguido de um turno do Builder (#355) some
  com a `D1`. A Prévia de um membro que não recarrega quando outro manda versão (#356), o teste
  automático da moldura (#358) e a limpeza de uma versão migrada (#359) esperam: a 17 não muda nada
  disso, e a moldura se prova no navegador pelo teste das telas. As outras não tocam estas pastas.

**As decisões suas nesta etapa.**

Dadas em 2026-10-27, "`A1` `B1` `C2` `D1`": os mesmos dados (`A1`); sem etiqueta (`B1`, que troca o "Sim" de
2026-10-25); todo membro que conversa com o Builder publica, "pelo menos p agora que nosso
authorizatin e capabilities RBAC é simples" (`C2`); o "Voltar para esta" vira "Publicar esta" (`D1`).

Dada em 2026-10-28, "3.E1 sim E2. Okay" (lida como `E1`): com a `C2`, o membro que conversa com o
Builder também vê a aba Versões e publica qualquer versão guardada, igual ao dono. Exemplo: o Bruno
publica a 8 e ela tem um problema; ele mesmo toca **Publicar esta** na 7, sem esperar a Ana. Nativo:
quem vê e quem publica passam a ser os mesmos que mandam versão para a Prévia (todo membro), uma
linha na tabela de quem faz o quê. Quando os papéis crescerem, a regra volta para o dono e o
administrador.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | O ponteiro publicado e o ato de publicar; a sessão do app que sabe se veio da moldura ou da aba; o app não publicado; a limpeza e a reparação guardam a publicada; quem publica e quem lista (`C2`, `E1`) | `apps/server/src/hub/apps/`, `apps/server/src/hub/identity/`, `apps/server/src/hub/projects/`, `apps/server/src/main.ts`, `apps/server/migrations/`, `packages/hub-api/src/`, `apps/edge/src/`; os duplos e as varreduras da web que leem `mayManageVersions` (o raio da U1) | dados | a 15 inteira no `main` |
| U2 | O botão **Publicar** e "Versão N publicada" no alto; as marcas e o **Publicar esta** em Versões; **Abrir app** só com versão publicada | `apps/web/src/hub/projects/`, `apps/web/src/hub/apps/`, `apps/web/src/platform/test-hub-versions.tsx` | web | U1 |

**A entrega.** Cada unidade é o seu próprio pull request sobre o `main` com a anterior já dentro
([entrega L9](../guides/delivery.md)), juntada pelo firstmate ([L13](../guides/delivery.md)). A U2
muda a forma que a U1 cria e não corre ao lado dela.

**Orçamento de código alterado.** U1 ~150 (a migração ~15; −20 do ramo da trava em `live.ts` e da
permissão de versões); U2 ~90. Total da etapa: ~240 linhas sem testes, teto 4.000
([L2](../guides/delivery.md)). Nenhum pacote novo. Estimativas pelo tamanho dos arquivos que mudam;
hipótese.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `PUT /api/companies/{c}/projects/{p}/published-version` com `{ number: 7 }`, de qualquer membro da empresa (`C2`, `E1`): 200 com a versão `published: true`; a lista mostra a 7 `published` e a da Prévia `live`; `live_version_id` não muda. A mesma chamada de novo dá 200 e nada muda | `apps/server/src/hub/apps/publish.test.ts`, "publicar: 200, só o ponteiro publicado muda, e de novo é o mesmo" | must |
| 2 | U1 | Recusas da mesma rota: um número que não existe, de outro Projeto, `failed`, `sending` ou `pruning` dá 404 `APP_VERSION_NOT_FOUND`; uma pessoa de fora da empresa e um Projeto que não existe dão 404 `NOT_FOUND` (S10); um envio em curso no Projeto não recusa (o código `APP_VERSION_SENDING` sai desta rota) | `publish.test.ts`, "publicar: as recusas, e o envio em curso não atrapalha" | must |
| 3 | U1 | Pela porta do dispatcher (`checkAppCall`): a sessão nascida de `/apps/open` recebe o Worker da versão publicada; a nascida de `createAppFrameHandoff` recebe o da Prévia; depois de um envio novo, a primeira continua na publicada e a segunda passa à nova | `apps/server/src/hub/apps/app-handoff.test.ts`, "a aba recebe a publicada e a moldura a da Prévia" | must |
| 4 | U1 | Sem versão publicada, a sessão da aba recebe 404 `APP_NOT_PUBLISHED`, e o dispatcher mostra a página "Este app ainda não foi publicado." com 404; a da moldura sem versão nenhuma segue no app de exemplo, como hoje | `app-handoff.test.ts`, "antes do primeiro Publicar"; `apps/edge/src/dispatcher-versions.test.ts`, "o app não publicado tem a sua página" | must |
| 5 | U1 | A limpeza depois de um envio nunca marca a versão publicada, mesmo mais velha que as três guardadas; a reparação na partida sobe de novo o Worker da publicada que sumiu, sem migrar por ela (a migração segue só pela da Prévia) | `apps/server/src/hub/apps/prune.test.ts`, "a publicada fica"; `repair.test.ts`, "a reparação sobe a publicada também" | must |
| 6 | U1 | A migração: um Projeto com versão no ar antes da 17 sai com ela publicada (o endereço salvo não cai); um sem versão sai sem publicada; as sessões de app de antes da 17 não abrem nada, e a chamada seguinte recebe `APP_SESSION_INVALID` e passa pelo Hub | `repair.test.ts`, como o caso da 14.1 (`:136`), que roda o `UPDATE` do `migration.sql` sobre um ponteiro zerado: "a 17 entra com a versão no ar publicada" | should |
| 7 | U1 | `getProject` traz `appVersion` (o número da Prévia) e `publishedVersion` (o publicado, ou `null`); `mayManageVersions` sai do contrato; o membro lista as versões (200) | `apps/server/src/hub/apps/versions.test.ts`, "o membro lista"; `apps/server/src/hub/projects/project-app-version.test.ts`, "o Projeto diz a Prévia e a publicada" | must |
| 8 | U2 | No alto do Projeto: sem versão na Prévia, nem Publicar nem Abrir app; com a Prévia diferente da publicada, **Publicar**; o toque abre "Publicar a versão 7?" com "Quem abrir o app passa a ver esta versão." e a confirmação "Publicar a versão 7"; com as duas iguais, o texto "Versão 7 publicada" no lugar do botão; **Abrir app** só com `publishedVersion` | `apps/web/src/hub/projects/project.test.tsx`, "o alto do Projeto: Publicar, publicada e Abrir app" | must |
| 9 | U2 | Em Versões, para qualquer membro: a marca **Na Prévia** e a **Publicada** (as duas numa versão só, quando é a mesma); **Publicar esta** em toda versão `ready` que não seja a publicada, com o mesmo diálogo; o "Voltar para esta" e o texto "Só o dono ou quem administra" não existem mais; um 404 `APP_VERSION_NOT_FOUND` fecha o diálogo e relê a lista | `apps/web/src/hub/apps/versions.test.tsx`, "as marcas e o Publicar esta" | must |
| 10 | U2 | Num navegador de verdade (Chrome e WebKit, 1366 e 390 px, os dois temas), a Prévia na moldura e o app numa aba aberta pelo **Abrir app** mostram versões diferentes ao mesmo tempo, depois de um envio novo | o teste das telas (`conexus-qa`), roteiro passos 3 e 4 | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| O alto do Projeto (U2) | sem versão na Prévia: nem Publicar nem Abrir app, como hoje | — | o Publicar no diálogo: "Publicando…", botões parados | o diálogo mostra a frase do código (`sentenceOf`) e fica aberto | 404 `APP_VERSION_NOT_FOUND`: o diálogo fecha e o Projeto se relê; `NOT_FOUND`: a rota se relê, como hoje (`put-back.tsx:35`) | — (`C2`: todo membro publica) | Prévia igual à publicada: "Versão N publicada", sem botão |
| Versões (U2) | a lista vazia, como hoje | `Empty`, como hoje | `Loading`, como hoje | `ReadFailure`, como hoje | como o alto | — (`E1`: todo membro vê) | a versão que sumiu da lista ao publicar: a frase e a lista relida |
| A página do app não publicado (U1, no dispatcher) | "Este app ainda não foi publicado." | — | — | — | — | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `apps.app.published_version_id` | `publishVersion` (`live.ts`); a migração, uma vez | `callTo` (`handoff.ts`), `markPrune`, a reparação, `listVersions`, o número em `getProject` |
| `handoff.environment`, `app_session.environment` | `createHandoff` (`/apps/open`: `published`; moldura: `preview`); `redeemHandoff` copia | `callTo` |
| `AppVersion.live` (agora: o da Prévia), `AppVersion.published` | `versionView` | web, Versões: as marcas e o Publicar esta |
| `Project.publishedVersion` | `viewOf` (`projects.ts`), pela leitura única `versionNumbersOf` | web, o alto: Publicar, "publicada" e Abrir app |
| `Project.appVersion` (agora: o da Prévia) | `viewOf`, pela mesma leitura, que substitui `liveNumberOf` | web: a Prévia (`preview.tsx:104`) e o alto |

**Desenho de caixas.** Muda a linha do alto (`area.tsx:80-125`) e a linha de cada versão
(`versions.tsx:27-44`). O Publicar é o `Button` primário com `phoneIcon` (só o ícone no celular),
como o Abrir app; o Abrir app passa a secundário, porque o Publicar é o ato do alto.

```text
1280 px, Prévia 8, publicada 7
  Encomendas        [Prévia] [Código] [Projeto]            [Publicar] [Abrir app ↗]
1280 px, Prévia 7, publicada 7
  Encomendas        [Prévia] [Código] [Projeto]   Versão 7 publicada  [Abrir app ↗]

390 px
  [Prévia] [Código] [Projeto]   [↻] [⇪] [↗]

Versões
  Versão 8 · Na Prévia                     [Publicar esta]
    27/10 21:40 · Bruno
  Versão 7 · Publicada
    27/10 20:10 · Ana
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Publicar (`publishVersion`, uma transação) | a linha do app travada (`lockApp`, C65): uma espera a outra e a última vale; com um envio terminando, a limpeza dele já vê a publicada | nada a desfazer: uma instrução só muda o ponteiro; uma resposta cortada, 502 ou 503 deixa o ponteiro como o banco o deixou, e tocar de novo dá o mesmo fim (o mesmo número) | o banco fora: `DATABASE_UNAVAILABLE`, o diálogo mostra a frase e fica aberto | `APP_VERSION_PUBLISHED` com `by`, `companyId`, `projectId`, `number` | 1, 2, 8 |
| O fim do envio (`finish`, `send.ts`), que agora guarda a publicada na limpeza | como hoje (a trava do envio, 14.1) | como hoje: uma transação | como hoje | como hoje | 5 |
| O passe e a sessão do app (`createHandoff`, `redeemHandoff`), que agora gravam `environment` | como hoje: o `DELETE` do passe decide (S22) | como hoje | como hoje | como hoje | 3, 4 |
| A migração da 17 (o `migrate` do Hub), que apaga as sessões e os passes de antes | o Hub sobe um por vez | uma transação: nada muda | o Hub não sobe, como hoje | como hoje; a primeira chamada de cada sessão apagada passa pelo Hub de novo | 6 |
| A reparação na partida, que agora sobe também o Worker da publicada | o Hub repara um por vez | uma falha no meio deixa um Worker de pé e o outro não; a partida seguinte refaz o que falta (`exists` antes de subir) | Cloudflare fora: `APP_VERSION_FAILED` com `NO_ANSWER`, como hoje (`repair.ts:150-152`) | como hoje | 5 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O ponteiro publicado | U1 | `apps.app.live_version_id` (`hub/apps/tables.ts:94,106-110`), um ponteiro para a Prévia e o app | vibesdk `9da158d` `worker/database/services/AppService.ts:282` (`updateDeploymentId`); Appwrite `c6435e86` `rule.deploymentId` lido a cada pedido (relay, estudo 04) | um ponteiro gravado por app; o roteador o lê a cada pedido | nativo: uma coluna e uma FK do PostgreSQL, como `app_live_version_fkey` | — | não precisa | — |
| Publicar (o ato) | U1 | `hub/apps/live.ts:15-44` `setLiveVersion` | vibesdk `think.ts:1010-1027` (`deploy: publish to platform`); Dyad `902829f` `src/ipc/handlers/vercel_handlers.ts:578-593` | um ato explícito manda o código daquele momento | nativo: `live.ts` já é o ato e passa a mudar o segundo ponteiro; o Worker `v-<id>` de cada versão já existe (0043), nada sobe de novo | — | `C2` | — |
| A versão guardada é a release | fica como está | `apps.app_version` (`tables.ts:128-161`), arquivos por conteúdo | Appwrite, Kamal (relay); vibesdk sem histórico (`deploy-engine.ts:130`) | uma unidade que não muda | nativo: feito na etapa 9; o fechamento escreve o Resultado da 0026 (um ato só) | — | 0026 | — |
| A etiqueta no Git | fica de fora (`B1`) | nenhuma em `builder/git/` | vibesdk, Dyad, bolt.diy `353b44c`, chef `d8a6cb6`, open-lovable `806b807`, Mastra Factory 1.78: nenhuma | "não encontrado" em cada uma | nativo: a marca Publicada já registra; uma etiqueta seria remendo, um segundo registro do ponteiro, perdido pela cópia no R2, que leva só o `main` (0051) | — | `B1` | — |
| Qual versão uma chamada recebe | U1 | `hub/apps/handoff.ts:173-199` `callTo` lê `liveVersionId` | vibesdk `worker/index.ts:195-206` (por host, depois `DISPATCHER.get`) | por pedido | embrulhado: a sessão guarda de onde veio (moldura ou `/apps/open`), e `callTo` escolhe o ponteiro por ela | a moldura e a aba têm cookies separados: o cookie é `SameSite=None; Partitioned` (`apps/edge/src/headers.ts:39`), e o Hub e os apps estão em sites diferentes (0023), então a chave da partição difere (CHIPS); hipótese até a sonda do começo da U1 e o critério 10 | não precisa | — |
| O endereço da Prévia | U1 (a emenda da 0024) | o mesmo endereço; a 14.1 tirou o `--previa` | 0024 "um endereço por app e ambiente"; vibesdk serve a prévia e o publicado em origens diferentes (`durable-object.ts:545`) | origens separadas | nativo: a partição do cookie cumpre a premissa da 0024 (cookies separados); o fechamento emenda a 0024 para "um endereço por app", e com ela `docs/architecture.md:142` ("one host per app and environment") e `:188` ("until Publicar it frames the Projeto's one app") | como acima | não precisa | — |
| Os dados da Prévia e do publicado | fica como está (`A1`) | um esquema e dois logins por app (`hub-api/src/app-login.ts:8`) | vibesdk e Dyad separam; Lovable usa um banco só desde 2026-10-05 (documentado, relay) | duas de três separam | nativo: nada novo | provado no estudo: a versão 1 publicada lê e grava depois de cinco envios, com o SQL da 15 recusando os dois que a quebrariam | `A1` | — |
| Migração ao publicar | fica de fora (`A1`) | o envio migra (`send.ts:124-130`) | Dyad só avisa (relay); vibesdk só a tag da classe (`think-user-deploy.ts:124`) | nenhuma migra ao publicar | nativo com `A1` | — | `A1` | — |
| Voltar o app publicado | U1, U2 | "Voltar para esta" (`web/src/hub/apps/put-back.tsx`, `live.ts`) | Appwrite, Kamal: ativar uma release velha (relay); vibesdk: o rollback só toca a prévia (`think.ts:786-800`) | voltar é publicar uma versão mais velha | nativo: a mesma rota com o número mais velho; o botão vira "Publicar esta" | — | `D1` | `apps/web/src/hub/apps/publish.tsx` (de `put-back.tsx`) |
| Restaurar o código no Builder | fica de fora (`D1`) | `main` só anda (`builder/git/repository.ts:116-130`) | vibesdk `space/src/space/durable-object.ts:461-521`; Dyad `version_handlers.ts:760-771` | um commit novo com a árvore antiga | nativo, se um dia construído: `git commit-tree` com a árvore antiga e `update-ref` | — | `D1` | — |
| A limpeza guarda a publicada | U1 | `prune.ts:19-41` guarda a da Prévia e mais 3 | Appwrite, Coolify, Kamal guardam a ativa (relay) | nunca apagar a release ativa | nativo: mais um id em `notInArray` | — | não precisa | — |
| A reparação sobe a publicada | U1 | `repair.ts:92-104` `liveVersions` só a da Prévia | — (a reparação é nossa, 0043) | — | nativo: o mesmo `restoreWorker` para a publicada, só o Worker; `openAppDatabase` e `migrateApp` seguem só pela da Prévia (`repair.ts:143-158`) | — | não precisa | — |
| Antes do primeiro Publicar | U1 | o app de exemplo (`dispatch.ts:30`, `handoff.ts:185`) | vibesdk: 404 "This application is not currently available." (`worker/index.ts:197-199`) | uma página do roteador | embrulhado: um código da tabela de falhas e uma linha em `PAGES` (`edge/src/pages.ts:10-23`), como `APP_NOT_FOUND` | — | o texto, no fim | — |
| Quem publica e quem vê Versões | U1 | `admission.ts:47-49` `readAppVersions`, `manageAppVersions` com `MANAGE_VERSIONS`; `roles.ts:14,19` `appVersion` | — (o controle de acesso é nosso, S6) | — | nativo: uma linha de `ACTIONS` como `sendBuilderVersion` | — | `C2`; E | — |
| O botão e as marcas | U2 | `web/src/hub/projects/area.tsx:76,106-124` Abrir app; `versions.tsx:19-25` "· no ar"; `web.md` W31 já põe Publicar no alto | vibesdk "View Live" (`src/routes/chat/chat.tsx:409`); Lovable a marca "Published" (documentado, relay) | um botão no alto e uma marca | nativo: o nosso `AlertDialog`, como `put-back.tsx` | — | os textos, no fim | — |
| A parte do Mastra | nenhuma | — | `@mastra/deployer-cloudflare` 1.78 sobe um servidor Mastra; a Factory não tem estágio de publicar (`factory/src/rules/types.ts:90,178`) | nenhuma faz | nativo: nada do Mastra se usa nesta etapa | — | — | — |

As referências estão na estante de estudo nos commits citados; as marcadas relay vêm do estudo 04 e
dos leitores do estudo da 17.

**A medida do transplante.** Nenhum código trazido.

**A dívida.**
- Um navegador que ignore `Partitioned` junta a moldura e a aba num cookie só: o último passe vale,
  e quem tem moldura (quem conversa com o Builder) vê a Prévia na aba. Gatilho: o primeiro relato.
- O que a Ana grava testando na Prévia aparece no app publicado (o custo da `A1`). Gatilho: a primeira
  empresa com dados reais.
- A regra de quem publica é a de todo membro (`C2`). Gatilho: o controle de acesso por papel crescer.
- A versão publicada pode ter vários envios de idade, e a garantia da 15 a protege. A limpeza de
  verdade da 15.1 ("Apagar de verdade") tem de guardar toda coluna que a publicada lê, não só a da
  versão anterior da Prévia. Gatilho: o cartão da 15.1.

## U1 O ponteiro publicado

**Base e modelo.** `main` com a 15 inteira, no commit em que o cartão for aprovado; a 15 muda
`send.ts`, `repair.ts` e `app-versions.ts`, e as linhas citadas aqui andam um pouco. Sonnet: uma
coluna, um ponteiro a mais e uma regra de acesso, sobre caminhos que já existem.

### As linhas da tabela

- **O ponteiro publicado**: `app` (`tables.ts:89-126`) ganha `publishedVersionId` e a FK
  `app_published_version_fkey`, como `app_live_version_fkey` (`:106-110`). `liveVersionId` segue
  sendo o ponteiro da Prévia, com o nome de hoje; o comentário de `app` (`:85-88`) diz os dois.
- **Publicar**: `live.ts:15-44`. Sai o ramo da trava do envio (`:24-29`): publicar não toca o
  ponteiro da Prévia e não disputa com o envio. A leitura passa de `id` a `number`
  (`app_version_project_id_number_key`, `tables.ts:149`), com `state = 'ready'` e o Projeto.
- **Qual versão uma chamada recebe**: `handoff` e `appSession` (`tables.ts:32-73`) ganham
  `environment`; `createHandoff` (`handoff.ts:47-77`) o recebe; `redeemHandoff` (`:84-109`) o copia;
  `callTo` (`:173-199`) escolhe o ponteiro por ele. As duas portas: `registerHandoffRoute`
  (`routes.ts:37-58`, `published`) e `createAppFrameHandoff` (`routes.ts:62-66`, `preview`).
- **Antes do primeiro Publicar**: `published` sem ponteiro lança `APP_NOT_PUBLISHED`; `PAGES`
  (`edge/src/pages.ts:10-23`) e `CHECK_REFUSALS` (`dispatch.ts:179`) ganham a linha.
- **A limpeza** (`prune.ts:19-41`) guarda os dois ponteiros. **A reparação** (`repair.ts:92-104`,
  `:143-158`) sobe o Worker da publicada que sumiu; o banco e a migração seguem só pela da Prévia.
- **Quem publica e quem vê Versões** (`E1`): `admission.ts:47-49`; `roles.ts:14,19`;
  `projects.ts:54-60`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/apps/tables.ts` | Muda: `published_version_id` e a FK; `environment` em `handoff` e `app_session` | todo `hub/apps/` |
| `apps/server/migrations/<data>_e17_published_version/` | Cria: `migration.sql` (gerado, mais o `UPDATE` que copia o ponteiro) e `snapshot.json` | `npm run migrations` |
| `apps/server/src/hub/apps/live.ts` | Muda: `setLiveVersion` vira `publishVersion`; apaga o ramo da trava | `app-versions.ts` |
| `apps/server/src/hub/apps/app-versions.ts`, `routes.ts` | Muda: `publish` no lugar de `setLive`; a rota nova | `main.ts` |
| `apps/server/src/hub/apps/handoff.ts` | Muda: `environment` no passe, na sessão e em `callTo` | `routes.ts` |
| `apps/server/src/hub/apps/versions.ts` | Muda: `lockApp` lê `publishedVersionId`; `versionView` dá `published`; `liveNumberOf` vira `versionNumbersOf`, os dois números numa leitura | `send.ts`, `live.ts`, `main.ts` |
| `apps/server/src/hub/apps/send.ts` | Muda: `finish` passa a publicada a `markPrune`; `admitManager` vira `admitPublisher` | `live.ts` |
| `apps/server/src/hub/apps/prune.ts` | Muda: `markPrune` guarda uma lista | `send.ts` |
| `apps/server/src/hub/apps/repair.ts` | Muda: o Worker da publicada, sem migrar por ela | a partida |
| `apps/server/src/hub/identity/admission.ts`, `roles.ts` | Muda (`E1`): `publishAppVersion` e `readAppVersions` de todo membro; apaga `manageAppVersions`, `MANAGE_VERSIONS` e o `appVersion` das funções | `send.ts`, `projects.ts` |
| `apps/server/src/hub/projects/projects.ts`, `ports.ts` (`AppVersionOf` vira `AppVersionsOf`), `apps/server/src/hub/apps/public.ts`, `apps/server/src/main.ts` (`:154`) | Muda: `publishedVersion` no Projeto; apaga `mayManageVersions` (`E1`) | `getProject`, `listProjects` |
| `packages/hub-api/src/apps.ts`, `projects.ts`, `app-failures.ts`, `index.ts` | Muda: `publishAppVersion` no lugar de `setLiveVersion`; `AppVersion`; `Project`; `APP_NOT_PUBLISHED` | servidor, web, edge |
| `apps/edge/src/pages.ts`, `dispatch.ts` | Muda: a página do app não publicado | o dispatcher |
| `apps/web/src/hub/apps/queries.ts`, `put-back.tsx`, `apps/web/src/platform/test-hub-versions.tsx`, `apps/web/src/hub/projects/area.tsx` | Muda só o nome da operação, para o tipo passar; a tela é da U2 | — |
| `apps/web/src/platform/test-hub.tsx`, `apps/web/src/builder/conversation/test-start.tsx`, `apps/web/sweep-replies.ts`, `apps/web/sweep-project-states.ts`, `apps/web/home.layout.test.ts`, `apps/web/src/builder/conversation/workbench.test.tsx`, `apps/web/src/hub/projects/project.tsx`, `project.test.tsx` | Muda (`E1`): sai `mayManageVersions` e o texto "Só o dono ou quem administra"; o duplo do Projeto ganha `publishedVersion` | — |
| testes do servidor: `apps/server/src/builder/runs/preview-send.test.ts` (`:183-212` chama `PUT …/live-version` e espera a Prévia na 1; com a `D1` passa a publicar a 1 e ver a Prévia seguir na 3), `publish.test.ts` (de `live-version.test.ts`), `app-handoff.test.ts`, `frame-handoff.test.ts`, `prune.test.ts`, `repair.test.ts`, `versions.test.ts`, `tables.test.ts` (a coluna e a FK nova), `apps/server/src/hub/projects/projects.test.ts`, `projects-delete.test.ts`, `project-app-version.test.ts`; `apps/edge/src/dispatcher-versions.test.ts` | Cria ou muda | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/apps.ts: apaga setLiveVersion
export const publishAppVersion = defineOperation({
  id: 'publishAppVersion',
  summary: 'Publishes a kept version of a Projeto’s app: who opens the app sees it; the Prévia stays.',
  access: 'session',
  method: 'PUT',
  path: '/api/companies/{companyId}/projects/{projectId}/published-version',
  bodyLimit: 1024,
  input: { params: OfProject, body: z.object({ number: z.int().positive() }) },
  success: { status: 200, body: z.object({ version: AppVersion }) },
  failures: ['NOT_FOUND', 'APP_VERSION_NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})
// AppVersion: `live` fica, com o nome de hoje, e o comentário diz "the version the Prévia and the
// Builder are on"; entra
  published: z.boolean(),  // the version who opens the app gets
// checkAppCall.failures ganha 'APP_NOT_PUBLISHED'

// packages/hub-api/src/projects.ts, Project: `mayManageVersions` sai (E1);
  /** The number of the version in the Prévia; null before its first. */
  appVersion: z.int().positive().nullable(),
  /** The number of the published version; null before the first Publicar. */
  publishedVersion: z.int().positive().nullable(),

// packages/hub-api/src/app-failures.ts
APP_NOT_PUBLISHED: {
  category: 'USER', settles: true, status: 404,
  phrase: 'Este app ainda não foi publicado.',
  action: '', actionKind: 'NONE',
},

// apps/server/src/hub/apps/tables.ts
/** Where a pass was asked: the Hub's Prévia frame, or a tab through `/apps/open` (0024 amended). */
export const APP_ENVIRONMENTS = ['preview', 'published'] as const
// handoff e appSession:
  environment: text('environment', { enum: APP_ENVIRONMENTS }).notNull(),
// com check('<tabela>_environment', sql`environment IN ('preview', 'published')`)

// apps/server/src/hub/apps/live.ts
export function publishVersion(
  deps: SendDeps,
  input: { person: Person; companyId: CompanyId; projectId: ProjectId; number: number },
): Promise<AppVersion>

// apps/server/src/hub/apps/handoff.ts
createHandoff(deps, input: { person; sessionToken; host; binding; environment: AppEnvironment })

// apps/server/src/hub/apps/prune.ts
export async function markPrune(tx: CommandTx, input: Ids & { keep: readonly string[] })

// apps/server/src/hub/apps/versions.ts
/** The numbers of the Prévia's and the published version, in one read; null before each first. */
export async function versionNumbersOf(
  tx: ReadTx,
  projectId: ProjectId,
): Promise<{ appVersion: number | null; publishedVersion: number | null }>
// apps/server/src/hub/projects/ports.ts: AppVersionOf sai
export type AppVersionsOf = typeof versionNumbersOf

// apps/server/src/hub/identity/admission.ts (E1)
  readAppVersions: { by: 'MEMBER', statement: undefined, locks: false },
  publishAppVersion: { by: 'MEMBER', statement: undefined, locks: true },
```

- **O estado**: o ambiente é a união literal `AppEnvironment` (C21), dona em `tables.ts`; os dois
  ponteiros são colunas que podem ser nulas, cada uma com a sua FK.
- **Ids**: `callTo` faz `AppVersionId.parse` do ponteiro escolhido, como hoje (`:192`, C23). A rota
  recebe um número, não um id.
- **Donos**: quem publica, `ACTIONS` (S6, C26); a frase, `app-failures.ts`.
- **Entrada externa**: o corpo da rota, pelo esquema da operação (C27).
- **A migração**: antes de tudo, `DELETE FROM apps.app_session` e `DELETE FROM apps.handoff`, porque
  uma sessão de antes da 17 não diz se veio da moldura ou da aba; depois o gerado pelo `drizzle-kit`,
  com `environment` `NOT NULL` sem padrão (nenhum `insert` o esquece); o `UPDATE apps.app SET
  published_version_id = live_version_id` vem depois da FK. A próxima chamada de uma sessão apagada
  recebe `APP_SESSION_INVALID`, e o dispatcher já limpa o cookie e passa pelo Hub de novo
  (`dispatch.ts:204-206`): a moldura ganha uma sessão `preview` e a aba uma `published`. As colunas
  só se acrescentam (D6); as linhas apagadas são passes de 60 s e sessões que se refazem sozinhas.
- Modelo: `live.ts` (uma transação, a admissão relida, S8) e `prune.ts`; cumprem C21 e C26, não
  C23: os ids das linhas são texto, a dívida anotada em `versions.ts:111`, e `keep` a herda com a
  mesma linha de `biome-ignore`, sem dívida nova.

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/server` (Fastify, Drizzle, Better Auth: a skill
`organization-best-practices` para as funções) e para `apps/edge` (`cloudflare:workers-best-practices`).
Guia de dados D6, D22; segurança S6, S8, S10, S22; código C21, C26, C65; a decisão 0024 (emendada
pelo fechamento).

### A ordem do trabalho

0. A sonda, antes de tudo (fora do repositório, o resultado no pull request): com o
   `playwright-core` instalado, em Chromium e WebKit, uma página num site faz moldura de outro site
   que grava um cookie `Secure; SameSite=None; Partitioned`; a mesma página aberta numa aba do segundo
   site não o vê. Se vê, parar (abaixo).
1. Subtrair: o ramo da trava em `live.ts:24-29`; com `E1`, `manageAppVersions`, `MANAGE_VERSIONS`,
   `appVersion` em `roles.ts:14,19` e `mayManageVersions` (`projects.ts:54-60`, `Project`).
2. `publish.test.ts` (de `live-version.test.ts`): critérios 1 e 2, falhando hoje (a rota não existe).
3. `tables.ts`, a migração; `publishVersion`, a operação, a rota (`registerVersionRoutes`). Regras:
   D22 (uma transação), S8 (admissão relida), C65 (`lockApp`).
4. `handoff.ts` e as duas portas; `callTo` por `environment`; `APP_NOT_PUBLISHED`, a linha de
   `PAGES` e de `CHECK_REFUSALS`. Critérios 3 e 4.
5. `markPrune({ keep: [versão nova, publicada] })` em `finish`; a reparação sobe o Worker da
   publicada; critério 5. O `UPDATE` da migração no `repair.test.ts`, critério 6.
6. `versionView`, `versionNumbersOf` (apaga `liveNumberOf`), a porta e o Projeto; critério 7. Na web, os nomes e o
   `mayManageVersions` que sai, para o tipo e os testes passarem.

### Como se prova

`npm test -w @conexus/server -- src/hub/apps/publish.test.ts src/hub/apps/app-handoff.test.ts
src/hub/apps/frame-handoff.test.ts src/hub/apps/prune.test.ts src/hub/apps/repair.test.ts
src/hub/apps/versions.test.ts src/hub/apps/tables.test.ts src/hub/projects/
src/builder/runs/preview-send.test.ts`; `npm test -w
@conexus/web -- src/builder/conversation/workbench.test.tsx src/hub/projects/`; `npm test -w @conexus/edge -- src/dispatcher-versions.test.ts`;
`npm run migrations`. Cada teste entra pela porta do Hub (T5): a rota, `checkAppCall`, a partida.

### Parar se

- A 15 ainda não está inteira no `main`: parar; a `A1` depende da garantia dela.
- A sonda do passo 0 mostra o cookie da moldura na aba num dos dois navegadores: parar e relatar;
  o desenho da sessão por ambiente cai, e o cartão volta ao estudo.
- Um arquivo fora do raio lê `mayManageVersions`, `manageAppVersions`, `setLiveVersion` ou o caminho
  `live-version`: relatar a linha.
- A migração gerada mexe em outra coisa além das três tabelas: parar e relatar.

## U2 Publicar na tela

**Base e modelo.** `main` com a U1. Sonnet: duas telas que já existem.

### As linhas da tabela

- **O botão e as marcas**: `area.tsx:76,106-124` (o alto); `versions.tsx:19-44` (a marca e o botão
  da linha); `put-back.tsx` vira `publish.tsx`, o mesmo `AlertDialog`.
- **Voltar o app publicado**: o Publicar esta é o mesmo componente, com o número da linha.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/apps/publish.tsx` | Cria, de `put-back.tsx`, que se apaga | `versions.tsx`, `area.tsx` (por `public.ts`) |
| `apps/web/src/hub/apps/versions.tsx`, `queries.ts`, `public.ts` | Muda: as marcas; `Publish` na linha | `area.tsx` |
| `apps/web/src/hub/projects/area.tsx` | Muda: o Publicar, "Versão N publicada", Abrir app por `publishedVersion`; apaga o texto "Só o dono" (`E1`) | a rota do Projeto |
| `apps/web/src/platform/test-hub-versions.tsx` | Muda: o duplo da rota nova | os testes |
| `apps/web/src/hub/apps/versions.test.tsx`, `apps/web/src/hub/projects/project.test.tsx` | Muda: critérios 8 e 9 | — |

### Os contratos que a unidade cria

```ts
// apps/web/src/hub/apps/publish.tsx
/**
 * Publicar: after a confirmation, who opens the app sees this version; the Prévia stays. A refusal
 * the list explains closes the dialog and reads the Projeto again.
 */
export function Publish(props: {
  companyId: CompanyId
  projectId: ProjectId
  number: number
  label: 'Publicar' | 'Publicar esta'
  onStale: (message?: string) => void
})
```

- Os textos: o título "Publicar a versão N?", a descrição "Quem abrir o app passa a ver esta
  versão.", a confirmação "Publicar a versão N", "Publicando…", as marcas "Na Prévia" e
  "Publicada", "Versão N publicada" no alto. O fundador os aprova no fim (L23).
- O sucesso invalida o Projeto e a lista (`hubMutation`), e o alto se redesenha pelo
  `publishedVersion`.
- Modelo: `put-back.tsx` (cumpre C21 e C26; não tem id próprio).

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/web` (`shadcn` para o `AlertDialog` e o `Button`).
Guia web W31; a regra de telas do card ([screens](../../.agents/skills/conexus-scope/references/screens.md)).

### A ordem do trabalho

1. `project.test.tsx` e `versions.test.tsx`: critérios 8 e 9, falhando hoje.
2. `publish.tsx`, apagando `put-back.tsx`; as marcas; o alto.
3. O roteiro no navegador com o Hub local (`conexus-qa` faz o critério 10).

### Como se prova

`npm test -w @conexus/web -- src/hub/apps/versions.test.tsx src/hub/projects/project.test.tsx`. O
critério 10 é do teste das telas, num navegador de verdade.

### Parar se

- O alto não cabe a 390 px com o Publicar: parar e mandar a captura; não esconder o Abrir app.
- A Prévia precisa saber a publicada para outra coisa além do alto: relatar.
