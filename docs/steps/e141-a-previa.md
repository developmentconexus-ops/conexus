# Etapa 14.1: A Prévia

## A página do fundador

**No fim desta etapa** você pede um app ao Builder e, quando a versão guardada monta, usa esse app
de verdade na aba **Prévia**, dentro do Hub; quando o Builder guarda a versão seguinte, a Prévia
recarrega sozinha nela.

**O roteiro de uso.** Padaria Sol, com Ana (dona) e Diego (membro).

1. Como **Ana**, "Encomendas" › **Conversa**: "Crie um app de encomendas com cliente, telefone,
   produto e data de entrega." No fim do turno aparece "**Versão 1 guardada**", logo "Subindo o
   app…" e, uns 9 segundos depois, "Prévia pronta". A aba **Prévia** mostra o app. Ana cadastra
   "Maria, bolo de cenoura, sexta".
2. Na barra da Prévia: **Computador** ou **Celular** (Celular põe o app numa moldura de celular) e
   **Recarregar**. **Abrir app** abre o mesmo app numa aba nova, e o Hub fica onde está.
3. "Agora guarde também o endereço." Enquanto o Builder trabalha, a Prévia segue na versão 1; no fim
   do turno recarrega sozinha na versão 2, com a Maria lá.
4. Como **Diego**, no mesmo Projeto: a Prévia abre o mesmo app. Diego pede uma mudança ao Builder; a
   versão dele também vai ao app.
5. No celular, em **App**, a mesma Prévia. No iPhone e no Safari do Mac aparece, acima do app,
   "O app pode não abrir aqui dentro neste navegador." com **Abrir app**, que abre o app numa aba
   nova. Se a prova da U1 mostrar que o Safari não abre o app dentro do Hub, o aviso fica no lugar
   do app: "Este navegador não abre o app aqui dentro."

**O que você faz, e quando.** Antes: nada. A U1 faz as provas reais na Cloudflare, no E2B e no
iPhone com a sua palavra ("Sim", 2026-10-25, sobre "Autorizo provas reais" de 2026-10-21). No
começo: aprova esta página. No fim: faz o roteiro, diz o que viu e aprova os textos das telas.

**Fica de fora.**
- A separação prévia e publicado: até Publicar (etapa 17) o Projeto tem um app só, e a Prévia é ele;
  a referência separa na hora de publicar (sua palavra "A1").
- A aba **Alterações** e o botão "Pedir ao Builder para corrigir" (sua palavra "B1"). O código
  segue na aba **Código**.
- O servidor de desenvolvimento na máquina (sua recusa, P1 A, 2026-10-21).
- Das issues `next-card`: nenhuma entra. A #237 era de Alterações e sai com ela. A #339 mexe no fim do
  turno, mas trata do texto salvo depois do `agent_end`, não do envio; espera a fila de defeitos (L4).
  As outras não tocam estas pastas.

**As decisões suas nesta etapa.** Já dadas, em 2026-10-25:
- **A1**, nativo: um app só até Publicar; a versão que o Builder monta vai a esse app pelo envio da
  etapa 9. "Ok, pode ser então A1 e B1".
- **B1**: Alterações e "Pedir ao Builder para corrigir" saem da 14.1. Mesma frase.
- **X1**: qualquer membro que conversa com o Builder põe a versão dele no app; a aba **Versões**
  segue só de dono e administrador. *Padaria Sol:* a versão do Diego vai ao app que a Ana abre. Isso
  emenda a P3 A da etapa 9 só para o envio do Builder. "X1".
- **Abrir app** abre uma aba nova, e o Hub fica onde está: "Ah, isso pode mudar sim. Abrir app,
  abrir uma aba nova. Não tirar onde a gente tá no hub, tá? Porque isso é até chato." (critério 28)
- Sobre o desenho: "eu não quero que seja igual a 14.2"; a resposta é esta etapa com cerca de 900
  linhas, não 2.340: o estudo dizia 780; a entrada do app dentro do iframe, que o estudo não contou,
  soma ~120.

Nada mais é seu: a versão "pela metade" não sobe ("A", 2026-10-24); no iPhone, o aviso e a aba nova
(sua palavra de 2026-10-21, e é o que a vibesdk faz); os ~9 s dentro do turno são o jeito da
referência. O único remendo (`packIn`, tirar a pasta montada da máquina) já foi aprovado na 14
("SIM", critério 14 do cartão da 14).

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | O fim do turno sobe a versão; a parte `data-conexus-preview`; a admissão X1; `appVersion` no Projeto; as provas reais | `builder/runs/`, `builder/machine/`, `builder/conversation/` (servidor), `hub/apps/`, `hub/identity/`, `hub/projects/`, `hub-api/src/`, `docs/reference/boundaries.md` | dados | — |
| U2 | A borda: cookies particionados, `frame-ancestors` do Hub, a página de entrada no iframe, `createAppFrameHandoff`, `frame-src` | `apps/edge/src/`, `packages/app-contract/src/`, `packages/app/src/check/`, `hub/apps/{handoff,routes}.ts`, `platform/http.ts`, `hub-api/src/apps.ts` | segurança | — |
| U3 | A tela Prévia: iframe, barra, recarga na versão nova, entrada, aviso do navegador | `apps/web/src/builder/preview/`, `apps/web/src/builder/conversation/`, `apps/web/src/hub/projects/`, `apps/web/src/routes/` | web | U1, U2 |
| U4 | As frases da Prévia voltam às instruções do Builder | `builder/conversation/` (instruções e `test-prompt.ts`), `docs/reference/builder-prompt.md` | testes | — |

`builder/`, `hub/`, `platform/`: `apps/server/src/`; `hub-api/`: `packages/hub-api/src/`. U1, U2 e
U4 correm em paralelo: não dividem arquivo, exceto `hub-api/src/index.ts` e `hub-api/src/apps.ts`
(U1 dá nome a `AppVersionFailure`; U2 põe `FrameEntry` e `createAppFrameHandoff`), de quem chegar
primeiro (o outro faz o merge). U3 depois de U1 e U2. QA antes da revisão (L9). Nenhum pacote novo; nenhuma
migração. Em toda unidade, `typescript-magician` e `node`.

**Orçamento de código alterado.** U1 240; U2 210; U3 390; U4 60. Total **900**, teto 4.000 (L2).
O estudo estimou 780; a diferença é a entrada no iframe (U2 e U3, ~100) e `appVersion` no Projeto
(~20), que a tabela do estudo dava como "segue" e este cartão escreve.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Um turno cuja versão sai guardada com `check.state` `passed` põe essa versão no ar: depois do turno, `GET` das versões do Projeto (como dono) lista a versão `ready` e `live`, com `sentBy` a pessoa do turno | `builder/runs/preview-send.test.ts` "a versão que montou vai ao ar" | must |
| 2 | U1 | A conversa mostra, nesta ordem, a parte `data-conexus-version`, a fase `sending` e a parte `data-conexus-preview` `{number, state: 'ready'}`; o `agent_end` vem depois da última | `builder/conversation/conversation-preview.test.ts` "ordem das partes" | must |
| 3 | U1 | A parte da versão chega ao fluxo antes do envio terminar: com o envio de teste parado, o fluxo já tem `data-conexus-version` e ainda não tem `agent_end` | `conversation-preview.test.ts` "a versão não espera o envio" | must |
| 4 | U1 | Recarregar a conversa depois do turno traz uma mensagem só com `data-conexus-version` e `data-conexus-preview` (um `saveMessages`) | `conversation-preview.test.ts` "a mensagem guardada" | must |
| 5 | U1 | Uma versão `unfinished`, `failed` ou `unchecked` não sobe: nenhuma versão nova do app e nenhuma parte `data-conexus-preview` | `preview-send.test.ts` "só `passed` sobe", um caso por estado | must |
| 6 | U1 | Um turno sem mudança (`unchanged`) e um turno que falhou ao guardar não sobem nada | `preview-send.test.ts` "nada guardado, nada sobe" | must |
| 7 | U1 | Um **membro** (papel `member`) que conversa no Projeto põe a sua versão no ar (X1); o mesmo membro recebe 404 em `POST` de versão pela aba Versões (`manageAppVersions`, inalterado) | `preview-send.test.ts` "o membro envia pelo Builder"; `send-guards.test.ts` caso existente do membro | must |
| 8 | U1 | Uma pessoa tirada da empresa durante o turno não põe a versão no ar: nenhuma versão `live` nova e nenhuma parte `data-conexus-preview` | `preview-send.test.ts` "admissão relida" | must |
| 9 | U1 | A Cloudflare recusa a versão que não inicia: `data-conexus-preview` `{state: 'failed', code: 'APP_VERSION_NOT_STARTING'}`, o app segue na versão anterior | `preview-send.test.ts` "não inicia" | must |
| 10 | U1 | Um envio da aba Versões em andamento: o do Builder termina `failed` com `APP_VERSION_SENDING` e o outro segue | `preview-send.test.ts` "um envio de cada vez" | must |
| 11 | U1 | A pasta da versão trocada por um link na máquina: `failed` com `APP_VERSION_FAILED`, linha `PREVIEW_PACK_REFUSED` com `reason: 'NOT_REGULAR'` | `pack.test.ts` caso existente; `preview-send.test.ts` "pasta recusada" | must |
| 12 | U1 | O Projeto apagado durante o turno: nenhuma versão no ar e nenhuma parte `data-conexus-preview` | `preview-send.test.ts` "Projeto apagado" | must |
| 13 | U1 | O Hub fechando durante o envio: o envio termina dentro de `SHUTDOWN_DEADLINE_MS` (15 s, `platform/lifecycle.ts:7`), ou `failExpiredSends` (inalterado) o falha no início seguinte e o app segue na versão anterior | `conversation-preview.test.ts` "o desligamento espera o envio" | must |
| 14 | U1 | `GET` do Projeto dá `appVersion: null` antes do primeiro app e o número da versão no ar depois, para dono e membro | `hub/projects/project-app-version.test.ts` | must |
| 15 | U1 | Prova real, com o Hub local do ramo e o E2B e a Cloudflare reais da instalação de teste: `packIn` num E2B de verdade, o envio a uma Cloudflare de verdade e o tempo do turno até "Prévia pronta", registrados como provado na entrada de `boundaries.md` | o relatório da U1, com as linhas medidas | must |
| 16 | U2 | Os cookies do despachante saem `Secure; HttpOnly; SameSite=None; Partitioned`, com o prefixo `__Host-` | `apps/edge/src/dispatcher.test.ts` "cookies particionados" | must |
| 17 | U2 | As respostas do app e as páginas do despachante levam `frame-ancestors <HUB_PUBLIC_ORIGIN>`; nenhuma leva `'none'` nem `*`; a conferência (0055) segue abrindo as telas sob a mesma política | `dispatcher.test.ts` "o Hub pode emoldurar"; `packages/app/src/check` teste existente da CSP (`browser.ts:129`) | must |
| 18 | U2 | As respostas do Hub levam `frame-src https://*.<domínio dos apps>` e seguem com `frame-ancestors 'none'` | `platform/http.test.ts` | must |
| 19 | U2 | Um pedido sem sessão com `Sec-Fetch-Dest: iframe` recebe a página de entrada (200), que manda `{type: 'conexus-entry', host, binding}` só para a origem do Hub; sem esse cabeçalho, o salto ao Hub de hoje (303) | `dispatcher.test.ts` "entrada no iframe" | must |
| 20 | U2 | `POST /api/apps/frame-handoff` com sessão e `{host, binding}` responde `{location}` no host do app; outra empresa, Projeto apagado ou host desconhecido: 404; sem sessão: 401; `Origin` de fora: `REQUEST_ORIGIN_REFUSED` | `hub/apps/frame-handoff.test.ts` | must |
| 21 | U2 | A passagem do iframe vale uma vez e só no navegador do vínculo: trocada com outro `binding` ou de novo, `APP_HANDOFF_INVALID` | `frame-handoff.test.ts` "uma vez, um navegador" | must |
| 22 | U2 | Um site de fora que emoldura o app não entra: o navegador recusa pela `frame-ancestors`, e a página de entrada não manda a mensagem a outra origem | `dispatcher.test.ts` "só o Hub"; prova no navegador da U2 | must |
| 23 | U3 | Antes do primeiro app, a Prévia mostra "Ainda não há uma prévia disponível. Descreva o aplicativo para começar." | `builder/preview/preview.test.tsx` "vazio" | must |
| 24 | U3 | Com app no ar, a Prévia mostra o app num iframe do endereço do Projeto, com **Computador** ou **Celular** e **Recarregar**; Celular põe o iframe em 390 px | `preview.test.tsx` "barra"; captura T23 | must |
| 25 | U3 | Uma parte `data-conexus-preview` `ready` recarrega o iframe na versão nova; uma `failed` não recarrega e a conversa diz o motivo pela frase do código | `preview.test.tsx` "recarga"; `conversation/preview-line.test.tsx` | must |
| 26 | U3 | **Recarregar** recarrega o iframe sem ler o Projeto de novo | `preview.test.tsx` "Recarregar" | should |
| 27 | U3 | A entrada no iframe: a mensagem `conexus-entry` do iframe (origem e janela conferidas) leva a `createAppFrameHandoff` e o iframe vai ao `location`; uma mensagem de outra origem ou de outra janela é ignorada | `preview.test.tsx` "entrada" | must |
| 28 | U3 | **Abrir app**, o da área e o do aviso, abre o app numa aba nova e o Hub fica onde estava: o link leva `target="_blank"` e `rel="noopener noreferrer"` | `hub/projects/project.test.tsx` "Abrir app abre aba nova"; `preview.test.tsx` "aviso" | must |
| 29 | U3 | Num navegador WebKit da Apple (iPhone, iPad, Safari do Mac), a Prévia mostra acima do iframe, que segue carregando, "O app pode não abrir aqui dentro neste navegador." com **Abrir app**, como a vibesdk; se a prova no iPhone da U1 mostrar que o Safari não carrega o app, o iframe não carrega e o aviso, "Este navegador não abre o app aqui dentro.", fica no lugar dele | `preview.test.tsx` "WebKit da Apple"; prova no iPhone da U1 | must |
| 30 | U3 | Abaixo de `md`, em **App**, a Prévia ocupa a área e a barra perde **Computador** ou **Celular** | captura T23 a 390 px | must |
| 31 | U3 | "Subindo o app…" e "Prévia pronta" na conversa; a fase `sending` fica na linha da máquina como as outras | `conversation/preview-line.test.tsx` | must |
| 32 | U4 | As instruções do Builder têm de volta as frases da Prévia das linhas 3, 6, 22, 53 e 54 do OS, a 53 sem a aba Diff (Alterações) nem Integrações; `builder-prompt.md` diz o novo veredito | `builder/conversation/prompt.test.ts` com `test-prompt.ts` | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Prévia | `Stage`: "Ainda não há uma prévia disponível. Descreva o aplicativo para começar." | igual a primeira vez (`appVersion: null`) | o iframe carrega com o fundo da área; a barra já aparece | a página de falha do despachante dentro do iframe (as frases dele, inalteradas), também quando o navegador recusa o cookie: sem o cookie do vínculo, `redeem` dá `APP_HANDOFF_INVALID` (`dispatch.ts:71-77`) | o Projeto apagado: a rota do Projeto dá o 404 de hoje | todo membro vê a Prévia (X1); fora da empresa, o 404 de hoje | WebKit da Apple: "O app pode não abrir aqui dentro neste navegador." com **Abrir app**, acima do iframe (no lugar dele, com "Este navegador não abre o app aqui dentro.", se a prova da U1 mostrar que o Safari não o carrega) |
| Linha da máquina na conversa | — | — | "Subindo o app…" (`sending`) | "Prévia não atualizada: " e a frase do código (`data-conexus-preview` `failed`) | — | — | — |
| Cartão da versão | — | — | — | — | — | — | — |

O cartão da versão não muda: "Versão N guardada…" (`machine-line.tsx:57`). Depois dele vem a linha
"Prévia pronta." ou a falha.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `data-conexus-preview.number` | `builder/conversation/end.ts` | web, a linha da Prévia na conversa |
| `data-conexus-preview.state` | `end.ts` | web: `use-session.ts` (recarga), a linha da conversa |
| `data-conexus-preview.code` | `end.ts`, de `Runs` | web, a frase do código (C48) |
| `MachinePhase` `sending` | `Runs.#settle` por `onPhase` | web, `machine-line.tsx` |
| `Project.appVersion` | `hub/projects/projects.ts` | web: a Prévia (vazio ou iframe, e a chave do iframe) |
| `createAppFrameHandoff` `{location}` | `hub/apps/handoff.ts` | web, a Prévia |
| A mensagem `conexus-entry` `{host, binding}` | a página de entrada do despachante | web, a Prévia |

**Desenho de caixas.** As capturas do estudo (fora do repositório): `main-previa-vazia-1440-*` e
`main-previa-vazia-390-*` (o main de hoje); do OS, `os-34-project-opens-direct-to-preview-1280`
(barra com Computador e Celular, Recarregar, o app embaixo). O desenho é o do OS (P4 A), sem
"Alterações" e sem "Versão 1 · em uso".

```text
1280 px
┌ Encomendas   [Prévia] Código  Projeto                     [Abrir app] ┬ Conversa ───────┐
├ [Computador|Celular]                               [Recarregar]       │ ...              │
│ ┌──────────────────────────── iframe do app ───────────────────────┐ │ Versão 2 guardada │
│ │                                                                   │ │ Prévia pronta.   │
│ └───────────────────────────────────────────────────────────────────┘ │ [compositor]     │
└──────────────────────────────────────────────────────────────────────┴──────────────────┘
Celular: o iframe com 390 px, centrado, a mesma barra.

390 px (App escolhido)
┌ [App|Conversa]  ≡ ┐
├ [Recarregar]      │
│ ┌ iframe ───────┐ │
│ │               │ │
│ └───────────────┘ │
└───────────────────┘
WebKit da Apple (iPhone, iPad, Safari do Mac), acima do iframe:
│ O app pode não abrir aqui dentro neste navegador. [Abrir app] [×] │
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `sendVersion` pelo Builder (`by: 'builder'`) | um envio da aba Versões em andamento: `APP_VERSION_SENDING`, o do Builder falha (C65); o mesmo turno de novo: o `attemptKey` é o `runId`, `REPLAY` | a morte entre a subida e o ponteiro deixa o ponteiro como estava; o envio vencido falha no início seguinte (`failExpiredSends`) | a Cloudflare sem resposta ou recusando: `APP_VERSION_FAILED`, o app segue na anterior; o banco fora: `failed` `APP_VERSION_FAILED` e `logFailure` | `APP_VERSION_RECEIVED`, `APP_VERSION_UPLOADED`, `APP_VERSION_LIVE` com `by` a pessoa; `PREVIEW_SEND_FAILED` com o código | 1, 8, 9, 10, 12, 13 |
| `Machines.pack` (`packIn`) | um por turno: o `Runs` segura o Projeto (D15) | a máquina morta no meio: `failed` `APP_VERSION_FAILED`, `PREVIEW_PACK_REFUSED` `reason: 'LOST'` | o E2B fora: o mesmo | `PREVIEW_PACK_REFUSED` com `reason` | 11, 15 |
| `saveMessages` da mensagem com as duas partes (`@mastra/pg` 1.32.0) | uma por turno | uma falha é logada e a mensagem segue contada no fluxo (como hoje em `end.ts:179-182`) | o banco fora: o mesmo | `INTERNAL_UNEXPECTED` | 4 |
| `createAppFrameHandoff` | duas passagens para o mesmo vínculo: cada uma vale uma vez (S22, `DELETE ... RETURNING`) | uma resposta cortada: a Prévia pede outra no próximo `conexus-entry` | o banco fora: `DATABASE_UNAVAILABLE`, a Prévia mostra a página de falha no iframe ao recarregar | a linha de pedido de hoje | 20, 21 |
| A troca da passagem no despachante (`redeem`, inalterada) | já coberta (S22) | já coberta | o Hub fora: `EDGE_HUB_UNAVAILABLE` dentro do iframe | a de hoje | 19, 21 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A versão montada pela conferência | U1 | `packages/app/src/check/build.ts:worker` (46-78) | `wrangler@4.151.1` `deploy --dry-run --outdir`; vibesdk `9da158d` `@cloudflare/worker-bundler` em `space/src/space/deploy-engine.ts` | lido: o bundler da plataforma monta Worker e telas; não há servidor de desenvolvimento | nativo | — | 0055, "SIM" no cartão da 14 | |
| Tirar a pasta montada da máquina no fim do turno | U1 | `apps/server/src/builder/machine/pack.ts:packIn` (97-124), `machines.ts:224-229` (sem chamador) | `e2b@2.56.0` `files.list` (`index.d.ts:5037-5065`, `symlinkTarget`) e `files.read(path)` (`index.d.ts:5135-5148`); `@mastra/core@1.79.0` `WorkspaceFilesystem.readFile` | lido: lê por caminho, sem opção de não seguir link; uma troca por link entre listar e ler passa | remendo | `pack.test.ts:55` "Machines.pack: um link ou um arquivo que não é regular é NOT_REGULAR"; estudo `proofs/pack-send.ts` (provado: `packIn` e `receiveVersion` aceita, 4 arquivos, 34 ms local); e2b 2.56.0 sem `nofollow` em `FilesystemReadOpts`; a U1 prova num E2B real e escreve a entrada em `boundaries.md` (S2, C59) | "SIM" ao cartão da 14, critério 14 em `05b006ba` ("link ou não regular: `NOT_REGULAR`"); volta só se o e2b mudar | |
| Onde o app roda | U1 | `apps/server/src/hub/apps/send.ts:sendVersion` (192-242), `uploadVersion` (57-71), só pela tela Versões | vibesdk `9da158d`: prévia por Worker Loader (`space/src/space/durable-object.ts:752`), publicação no WfP (`worker/agents/core/behaviors/think.ts:990-1030`, `deployThinkAppToPlatform`, `dispatchNamespace` 1005-1021); `@mastra/core@1.79.0` `SandboxNetworking.getPortUrl` (`workspace/sandbox/sandbox.d.ts:44-51`, `getPortUrl` 50); Factory `6a465f9d`: nenhuma | lido: vibesdk roda o artefato montado; Mastra, open-lovable e fragments expõem a porta de um servidor de desenvolvimento | embrulhado: o envio da etapa 9 com o Builder como quem envia (`by: 'builder'`) | — | P1 A, 2026-10-21; o servidor de desenvolvimento recusado | |
| Um app só até a 17 | U1 | `apps.app.live_version_id` (`hub/apps/tables.ts:94`) | vibesdk `9da158d` `think.ts:960-961` (a conta do usuário) e `990-1030` (WfP) | lido: a separação prévia e publicado nasce no ato de publicar; cada caminho chama `gitCommit` e `getDeploymentBundle`, e remonta | nativo | — | "Ok, pode ser então A1 e B1" (2026-10-25) | |
| Quem muda o app pelo Builder | U1 | `useConversations` sem exigência (`hub/identity/admission.ts:55-56`); `manageAppVersions` só dono e administrador (`roles.ts:18-39`; `send.ts:43-46`, chamado em 205 e 160-166) | nenhuma faz; vibesdk: o dono da sessão (`worker/utils/spacePreviewToken.ts`, claims `userId`) | lido: quem conversa com o agente é quem implanta | embrulhado: a ação nova `sendBuilderVersion` (todo membro, segura a linha, S8) no envio do Builder | — | "X1" (2026-10-25), emenda a P3 A da etapa 9 para o envio do Builder | |
| Quando sobe: no fim do turno, depois de soltar a máquina e antes de soltar o Projeto | U1 | `builder/conversation/end.ts:ended` (160-186), `runs.ts:#settle` (234-260) | `@mastra/core@1.79.0` `agent-controller-DO6rGsQm.js:4841-4857` (`finishAgentRun` 4841, os ganchos 4847-4851, `agent_end` 4857); vibesdk `think.ts:489-491` | provado (estudo): o gancho segura `agent_end`; uma mensagem contada dentro dele chega antes (99 ms contra 2101 ms) | nativo | — | não precisa | |
| Que versões sobem | U1 | `VersionCheck` (`hub-api/src/conexus-parts.ts:23-28`) | vibesdk `9da158d` `think.ts:752-773` (`DEPLOYMENT_FAILED` não troca a prévia) | lido: só o que montou vira prévia | nativo | — | "A", 2026-10-24 | |
| A conversa diz "Subindo o app…" e "Prévia pronta" | U1, U3 | `end.ts:tellPhase` (189-193), `MachinePhase` (`conexus-parts.ts:32`), `data-conexus-version` | `@mastra/core@1.79.0` partes `data-*` (`agent-controller-DO6rGsQm.js:361-362, 1126-1281`) e `Session.emit` (4908-4910); `@mastra/pg@1.32.0` `saveMessages` (`dist/index.js:13079-13086`); vibesdk `DEPLOYMENT_STARTED` e `COMPLETED` (`think.ts:771,866`) | provado (estudo): a mensagem contada no gancho chega ao fluxo; lido: upsert por `id` | nativo | — | não precisa | `apps/web/src/builder/conversation/preview-line.tsx` |
| O app no ar no Projeto | U1 | `Project.address` nasce com o Projeto (`hub/projects/projects.ts:87-92`), sem dizer se há app | vibesdk `preview-iframe.tsx` "Preview Not Available" | lido: o vazio fica no lugar do iframe até haver o que mostrar | nativo | — | não precisa | |
| A Prévia recarrega na versão nova | U3 | `apps/web/src/builder/conversation/use-session.ts:savesVersion` (50-61) | vibesdk `src/routes/chat/components/preview-iframe.tsx:228` (`forceReload`, usado em 303, 313 e 419); Dyad `902829f` `PreviewIframe.tsx:1676` (`key={iframeState.iframeEpoch}`) | lido: a parte de "pronta" troca a chave do iframe | embrulhado: a invalidação do TanStack Query que já existe, mais a `key` do iframe igual a `appVersion` | — | não precisa | |
| O app dentro do Hub | U2 | `platform/http.ts:40-54` (`frameAncestors 'none'`, `default-src 'self'`); `app-contract/src/page.ts:5` | vibesdk `preview-iframe.tsx:339` (`sandbox=...`); CSP `frame-src`, `frame-ancestors` | lido: iframe de outro domínio, com o domínio do painel como ancestral | nativo | — | não precisa | |
| O cookie do app dentro do iframe | U2 | `apps/edge/src/headers.ts:setCookie` (31-34, `SameSite=Lax`) | vibesdk `worker/utils/spacePreviewToken.ts:60-83` | lido: `SameSite=None; Secure; Partitioned` no domínio de prévia | embrulhado: os atributos da vibesdk no cookie do despachante; `__Host-` fica | — | não precisa | |
| A entrada no app dentro do iframe | U2, U3 | `dispatch.ts:toHub` (56-67) salta ao `/apps/open` do Hub, que não recebe o cookie do Hub dentro de um iframe de outro site e não se deixa emoldurar; `redeem` (69-91) | vibesdk: o agente monta o endereço com `?t=` (`worker/agents/core/behaviors/think.ts:392`), o painel o recebe como `previewURL`, e a prévia troca `?t=` por cookie (`worker/api/handlers/space-preview.ts:151-165`) e o tira do endereço (48) | lido: uma ficha vinda do painel abre o iframe; a nossa passa pelo vínculo de S22 (o painel recebe o hash do vínculo por `postMessage` e pede a passagem por sessão) | embrulhado: a página de entrada do despachante e `createAppFrameHandoff` sobre o `createHandoff` de hoje (`hub/apps/handoff.ts:47-78`) | — | não precisa | `apps/edge/src/entry.ts`, `apps/server/src/hub/apps/frame-handoff.test.ts` |
| No iPhone e no Safari: aviso e Abrir app | U3 | nenhum | vibesdk `src/lib/utils.ts:43` (`isAppleWebKitBrowser`: iPhone, iPad e Safari do Mac); `src/routes/chat/components/preview-compat-banner.tsx:29` (o aviso quando é WebKit e a prévia é de outro site), 51-52 e 60 (a aba nova) | lido: só um aviso que se fecha, acima do iframe, que segue carregando; o aviso abre a prévia numa aba nova | embrulhado: o aviso da vibesdk com o **Abrir app**; se a prova no iPhone da U1 mostrar que o Safari não carrega o app, o iframe não carrega e o aviso fica no lugar dele (o que a vibesdk não faz) | — | "nova aba" no iPhone, 2026-10-21 | |
| Abrir app numa aba nova | U3 | `hub/projects/area.tsx:83-90`: `<a href>` sem `target`, que leva a aba do Hub | vibesdk `preview-compat-banner.tsx:60` e `chat.tsx:413` (`window.open(..., '_blank', 'noopener,noreferrer')`); o nosso `builder/conversation/markdown.tsx:20` | lido: o app abre noutra aba e o painel fica | nativo | — | "Ah, isso pode mudar sim. Abrir app, abrir uma aba nova. Não tirar onde a gente tá no hub, tá? Porque isso é até chato." (2026-10-25) | |
| Barra: Computador ou Celular e Recarregar | U3 | nenhum | Dyad `PreviewIframe.tsx:345` (`mobile: 375`); bolt.diy `353b44c` `Preview.tsx:29`; chef `d8a6cb6` `Preview.tsx:339`; Conexus OS `e0353c36` `lens-preview.tsx` (relay) | lido: a largura do iframe muda | nativo | — | P4 A | `apps/web/src/builder/preview/preview.tsx` |
| No celular, App mostra a Prévia | U3 | `builder/conversation/workbench.tsx:24-66` (#337) | Dyad, bolt.diy, chef, vibesdk: nenhuma trata o celular | lido: só o toggle que já existe; a barra perde Computador ou Celular abaixo de `md` | nativo | — | não precisa | |
| Antes do primeiro app | U3 | `builder/conversation/stage.tsx` | bolt.diy `Preview.tsx:1193` ("No preview available"); chef `Preview.tsx:367` | lido: o vazio fica no lugar do iframe | nativo | — | não precisa | |
| A Cloudflare recusa o app que montou | U1 | `AppVersion.failure` (`hub-api/src/apps.ts:111-118`), etapa 10 | vibesdk `think.ts:761` (`DEPLOYMENT_FAILED`), `preview-iframe.tsx` "Preview Not Available" | lido: a prévia fica na anterior e o erro é dito | nativo | — | não precisa | |
| O Hub reinicia durante o envio | U1 | `end.ts:drain` (247-254); `hub/apps/repair.ts:failExpiredSends` (28) | `@mastra/core@1.79.0` `finishAgentRun` espera o gancho | lido: o desligamento espera o fim do turno; o envio vencido falha no início seguinte | nativo | — | não precisa | |
| Poda das versões | U1 | `hub/apps/prune.ts:prune` (110), chamada por `sendVersion` | vibesdk `deploy-engine.ts:131` (`INSERT OR REPLACE`, uma linha por ramo) | lido: uma por ramo | nativo | — | não precisa | |
| As instruções do Builder falam da Prévia | U4 | `docs/reference/builder-prompt.md:12,19,20` (linhas 3, 6, 22, 53, 54 do OS) | `@mastra/core@1.79.0` `Agent.instructions`; Conexus OS `e0353c36` | herdado: as frases voltam do OS | nativo | — | não precisa | |
| Alterações | fica de fora (B1) | nenhum | Mastra Factory `6a465f9d` `mastracode/factory/src/routes/fs.ts:157-188,770-790,912-960` | lido: `git diff --name-status -z`, `--numstat`, `--unified=3`, teto 512 KiB | nativo | — | "Ok, pode ser então A1 e B1" | |
| Pedir ao Builder para corrigir | fica de fora (B1) | nenhum | Dyad `PreviewIframe.tsx:1610-1622` ("Fix error") | lido: botão que manda o erro ao agente | nativo | — | "Ok, pode ser então A1 e B1" | |

**A medida do transplante.** Nenhum código do Conexus OS. Do `main`: `packIn` (124 linhas,
inalterado, ganha o chamador `Runs.#settle`) e `sendVersion` (51 linhas, ganha `by` e a ação do
Builder). Os dois seriam escritos assim do zero: `packIn` por S2 e C59 sem leitura nativa que não siga
link, `sendVersion` porque já guarda a ordem de 0046 e a reivindicação de C65. O cartão do PR #307 não
entra: dele saem a U2 inteira, quase toda a U3, a U7 e o envio depois do turno (lista no PR).

**A dívida.**
- Conflito de guia para o fechamento (code C75, delivery L7): security S24 diz "a única exceção" à
  mesma origem é a passagem do `/apps/open` e "`frame-ancestors 'none'`" nas respostas. As do Hub
  seguem `'none'`; as do app passam a `frame-ancestors` do Hub, e `createAppFrameHandoff` é uma
  segunda entrada (por sessão, mesma origem). O fechamento reescreve S24.
- `builder-prompt.md:19` diz que a linha 53 do OS "adds Prévia and Alterações", mas o OS diz a
  Prévia, as abas Código e Diff e Integrações: fica "Prévia" (U4); Alterações volta com a sua etapa.
- A entrada de `boundaries.md` do `packIn` (C75) é a que faltou na etapa 14, que aprovou o remendo
  (critério 14 do seu cartão em `05b006ba`, "SIM"). A U1 a escreve; o fechamento a conta como dívida
  da 14, não como remendo novo da 14.1.

## U1 O fim do turno sobe a versão

**Base e modelo.** `main` no commit em que o cartão for aprovado. Opus: concorrência no fim do turno
(o Projeto segurado, a máquina solta, o envio e o desligamento) entre `builder/` e `hub/`.

### As linhas da tabela

- **A versão montada pela conferência**: nada muda; `build.ts:72-77` deixa `node_modules/.conexus/version` só quando passa.
- **Tirar a pasta montada**: `Machines.pack` (`machines.ts:224-229`) chama `packIn`
  (`pack.ts:97-124`) com a máquina ainda segura; a prova real e a entrada nova de `boundaries.md`.
- **Onde o app roda** e **Um app só**: `sendVersion` (`send.ts:192-242`) ao `app` de hoje.
- **Quem muda o app**: `admission.ts:39-64` ganha `sendBuilderVersion`.
- **Quando sobe**: `runs.ts:#settle` (234-260) e `end.ts:ended` (160-186).
- **Que versões sobem**: só `check.state === 'passed'` (`conexus-parts.ts:23-28`).
- **A conversa diz**: `MachinePhase` ganha `sending`; a parte `data-conexus-preview`.
- **O app no ar no Projeto**: `Project.appVersion`.
- **A Cloudflare recusa**, **O Hub reinicia**, **Poda**: o envio de hoje, sem mudança.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/runs/{runs,context}.ts` | muda | `builder/conversation/end.ts`, `main.ts` |
| `apps/server/src/builder/conversation/end.ts` | muda | `builder.ts` |
| `apps/server/src/builder/machine/` | nada (só ganha chamador) | `runs.ts` |
| `apps/server/src/hub/apps/{send,app-versions,public}.ts` | muda | rota Versões, `main.ts` |
| `apps/server/src/hub/identity/admission.ts` | muda (uma ação) | `send.ts` |
| `apps/server/src/hub/projects/projects.ts` | muda (`appVersion`) | rotas do Projeto |
| `apps/server/src/main.ts` | muda (liga `send` em `createRuns`) | — |
| `packages/hub-api/src/{conexus-parts,projects,index}.ts` | muda | web |
| `packages/hub-api/src/apps.ts` | muda (`AppVersionFailure` ganha nome; também na U2) | web, despachante |
| `docs/reference/boundaries.md` | cria a entrada do `packIn` | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/conexus-parts.ts
CONEXUS_PARTS // += 'data-conexus-preview'
export const MachinePhase = z.enum(['starting', 'copying', 'saving', 'sending'])
/** Why the version did not reach the app: the send's failure, or another send holding the Projeto. */
export const PreviewFailure = z.enum([...AppVersionFailure.options, 'APP_VERSION_SENDING'])
export const PreviewData = z.discriminatedUnion('state', [
  z.object({ state: z.literal('ready'), number: z.int().positive() }),
  z.object({ state: z.literal('failed'), number: z.int().positive(), code: PreviewFailure }),
])
// ConexusPart += { type: 'data-conexus-preview', data: PreviewData }

// packages/hub-api/src/apps.ts: o enum de `AppVersion.failure` ganha nome, sem mudar valores
export const AppVersionFailure = z.enum([...])

// packages/hub-api/src/projects.ts: Project
appVersion: z.int().positive().nullable() // o número da versão no ar (AppVersion.number); null sem app

// apps/server/src/hub/identity/admission.ts: ACTIONS
// Every member's Builder turn sends its version to the Projeto's one app (step 14.1, X1).
sendBuilderVersion: { by: 'MEMBER', statement: undefined, locks: true },

// apps/server/src/hub/apps/send.ts: `person: Person` sai da entrada
export async function sendVersion(deps: SendDeps, input: Ids & {
  personId: PersonId
  by: 'versions' | 'builder' // 'versions': manageAppVersions; 'builder': sendBuilderVersion
  manifest: unknown; files: readonly VersionFileInput[]; attemptKey: string
}): Promise<Sent>

// apps/server/src/builder/runs/context.ts
export type BuilderSend = (input: {
  companyId: CompanyId; projectId: ProjectId; personId: PersonId; runId: RunId
  folder: VersionFolder
}) => Promise<PreviewData>
RunsDeps // += send: BuilderSend
export type Settled = Outcome & { rounds: number; preview?: PreviewData }

// apps/server/src/builder/runs/runs.ts
finish(input: { conversationId; reason; saved: (settled: Settled) => void }): Promise<Settled | 'gone'>
```

- **Cada estado**: `PreviewData` por `state` (C21); `Outcome` inalterado.
- **Cada id**: `RunId` vira `attemptKey` (o mesmo turno de novo é `REPLAY`); `PersonId` do `Driven`.
- **Donos**: `PreviewFailure` e `AppVersionFailure` em `hub-api` (C26); a frase de cada código em
  `failures.ts` (C48); quem pode enviar em `admission.ts` e `roles.ts`.
- **Zod**: `PreviewData` na parte (lida pelo web com `ConexusPart`).
- **Modelo**: `end.ts` para contar e guardar partes (cumpre C21, C23, C26); `send.ts` para o envio.

`BuilderSend` mora em `builder/runs/context.ts` e `main.ts` o liga ao `apps` por um fecho, porque
`apps` nasce depois de `runs` (`main.ts:142-160`). O fecho mapeia: `Sent` `ready` dá `{state:
'ready'}`; `Failure` com código em `PreviewFailure` dá `failed` com ele; `NOT_FOUND` (Projeto
apagado) não dá parte (`#settle` devolve sem `preview`); qualquer outra dá `failed`
`APP_VERSION_FAILED` e `logFailure`.

### As skills e a leitura

`mastra` (a linha `@mastra/core` de `stack.md`), `fastify-best-practices`, `drizzle` não (nenhuma
migração). Ler primeiro: `end.ts` inteiro, `runs.ts:200-262`, `send.ts:150-242`, `admission.ts:39-64`.

### A ordem do trabalho

1. `hub-api`: `AppVersionFailure`, `PreviewFailure`, `PreviewData`, a parte, `sending`, `appVersion`.
   Regras: C21, C26, C48.
2. `admission.ts` `sendBuilderVersion`; `send.ts` com `personId` e `by` nos dois `admitMember`
   (`send.ts:43-46` e `finish`, 160-166); a rota Versões passa `by: 'versions'`. Regras: S6, S8.
3. `runs.ts:#settle`: depois de `saveRun`, chama `saved(outcome)`; se `saved` com `passed` (uma
   corrida removida já sai `gone` de `saveRun`, `save.ts:63`), `machines.pack` (o `Result` refusado, ou um erro, dá `failed` `APP_VERSION_FAILED` e
   `PREVIEW_PACK_REFUSED`); então solta a máquina, conta `sending` por `onPhase`, chama `deps.send`, e
   só depois deixa o Projeto. O `finally` de hoje guarda a ordem: máquina solta antes do envio, Projeto
   depois. Regras: C62, C65, D15.

   ```ts
   const outcome = await saveRun(this.#context, mine)
   input.saved(...)
   const folder = passed(outcome) ? await this.#pack(mine) : undefined
   await this.#releaseMachine(mine)
   const preview = folder === undefined ? undefined : await this.#send(mine, outcome, folder)
   ```
4. `end.ts:ended`: o `saved` monta a mensagem (as partes da corrida e `data-conexus-version`) com um
   `id` fixo e a conta (`tell`); depois de `finish`, junta `data-conexus-preview`, guarda uma vez
   (`saveMessages`) e conta de novo com o mesmo `id`. Regras: C50.
5. `projects.ts`: `appVersion` lido pelo porto de `hub/apps` (o número de `live_version_id`), sem
   importar a tabela de outro módulo (depcruise). Regras: S10.
6. `main.ts`: `createRuns({..., send})`.
7. Prova real (T24 não se aplica: é a de verdade, autorizada): o Hub local do ramo, com o E2B e a
   Cloudflare reais da instalação de teste (o ramo não é publicado na nuvem); um Projeto de teste,
   um turno com versão `passed`, medido do `agent_start` a "Prévia pronta"; `packIn` num E2B; e, no
   iPhone, as páginas de prova do estudo 3 (fora do repositório), com o que o Safari fez com o
   cookie `Partitioned`. O relatório diz se o Safari carregou o app no iframe: isso escolhe a forma
   do critério 29 para a U3. Escrever a entrada de `boundaries.md` ("e2b 2.56.0: a pasta da versão lida
   sem seguir link") com a prova e a data; o relatório leva os números.

### Como se prova

Critérios 1 a 15. `preview-send.test.ts` e `conversation-preview.test.ts` entram pela porta pública
(as rotas de conversa do Mastra atrás do guarda, T5), com o modelo de teste, a máquina de teste e a
Cloudflare de teste de `send-guards.test.ts`; o fluxo do Mastra das gravações de `platform/recordings/mastra/`
(T26); uma gravação nova do gancho com a mensagem contada, por `npm run record`, se nenhuma servir.
Falha hoje: nenhuma versão vai ao ar depois do turno (critério 1).

### Parar se

- O tempo medido do fim do turno a "Prévia pronta" passar de ~13 s (o estudo mediu, por relay,
  pack até 2,84 s, envio até 9,04 s e primeira resposta até 0,75 s, ~12,6 s): voltar ao fundador com
  o número. Perto de 15 s o envio já não cabe em `SHUTDOWN_DEADLINE_MS` (critério 13).
- O fecho entre `runs` e `apps` pedir mudar a ordem de `main.ts` além do fecho.

## U2 A borda

**Base e modelo.** `main` no commit aprovado. Opus: cookie entre sites, `postMessage` e S22.

### As linhas da tabela

- **O app dentro do Hub**: `page.ts:5` `APP_CONTENT_SECURITY_POLICY` vira função da origem do Hub (usada em `headers.ts:12` e `check/browser.ts:129`), e a política própria das páginas (`pages.ts:58`) troca `'none'` pela origem do Hub;
  `http.ts:40-54` ganha `frameSrc`.
- **O cookie do app**: `headers.ts:31-34`, os atributos de vibesdk `spacePreviewToken.ts:60-83`.
- **A entrada**: `dispatch.ts:toHub` (56-67) com `Sec-Fetch-Dest: iframe`; `handoff.ts:createHandoff`
  (47-78) sob a operação nova; vibesdk `space-preview.ts:151-165` como o modelo da ficha no iframe.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/edge/src/{dispatch,headers,pages}.ts`, `entry.ts` | muda e cria | publicar a borda |
| `packages/app-contract/src/page.ts` | muda | despachante, conferência |
| `packages/app/src/check/` | muda (passa `'none'` à política) | conferência |
| `apps/server/src/hub/apps/{handoff,routes}.ts` | muda | web |
| `apps/server/src/platform/http.ts` | muda | toda resposta do Hub |
| `packages/hub-api/src/apps.ts` | muda | web, despachante |

### Os contratos que a unidade cria

```ts
// packages/app-contract/src/page.ts: a constante sai
export function appContentSecurityPolicy(frameAncestor: string): string
// apps/edge/src/headers.ts
export function setCookie(name: string, value: string): string // SameSite=None; Secure; Partitioned
// packages/hub-api/src/apps.ts
export const FRAME_ENTRY = 'conexus-entry'
export const FrameEntry = z.object({ type: z.literal(FRAME_ENTRY), host: HostLabel, binding: z.string() })
export const createAppFrameHandoff = defineOperation({
  id: 'createAppFrameHandoff', access: 'session', method: 'POST', path: '/api/apps/frame-handoff',
  // body AppOpenQuery {host, binding}; 200 {location}; NOT_FOUND; SESSION_REQUIRED; REQUEST_ORIGIN_REFUSED
})
```

A página de entrada: o despachante a serve com 200 quando não há sessão e `Sec-Fetch-Dest` é
`iframe`; o vínculo é o de `toHub` (o cookie de vínculo, agora particionado), e a página carrega
`${DISPATCHER_PATHS}entry.js` (`script-src 'self'`), que faz
`parent.postMessage({type, host, binding: hash}, HUB_PUBLIC_ORIGIN)`. `location` é o mesmo endereço
para onde o `/apps/open` salta hoje. Modelo: `handoff.ts` (cumpre C21, C23, C26).

### As skills e a leitura

`cloudflare:workers-best-practices`, `cloudflare:wrangler`, `fastify-best-practices`.

### A ordem do trabalho

1. `page.ts`, a conferência com `'none'`, o despachante com `env.HUB_PUBLIC_ORIGIN`. Regras: S17, S24 (o
   conflito vai para a dívida), 0055.
2. `headers.ts`, `entry.ts`, `dispatch.ts:toHub`. Regras: S22, S48.
3. `handoff.ts` e `routes.ts`: `createAppFrameHandoff` chama `createHandoff` com a sessão do pedido.
   Regras: S8, S10, W15.
4. `http.ts` `frameSrc`.

### Como se prova

Critérios 16 a 22: `dispatcher.test.ts` com o despachante de teste e o Hub por
`main.ts`, `frame-handoff.test.ts`, `http.test.ts`; no Chromium, uma página do Hub local que emoldura
um app local entra e uma página de outra origem não. Falha hoje: o cookie sem `Partitioned`.

### Parar se

O Chromium não guardar o cookie particionado dentro do iframe: a entrada é outra; voltar ao cartão.

## U3 A tela Prévia

**Base e modelo.** Depois de U1 e U2. Sonnet: tela sobre o modelo de `builder/source/`.

### As linhas da tabela

**A Prévia recarrega**, **Barra**, **No celular**, **Antes do primeiro app**, **No iPhone**, **A
entrada** (o lado do Hub), **A conversa diz** (as frases). Ler: `area.tsx:56-100`, `stage.tsx`,
`workbench.tsx:24-66`, `use-session.ts:40-62`, `machine-line.tsx:1-60`, a rota
`routes/_app/companies/$companyId/projects/$projectId.tsx:26`; vibesdk `preview-iframe.tsx:228,303,339`,
`utils.ts:43` e `preview-compat-banner.tsx:20-60`; Dyad `PreviewIframe.tsx:345,1669-1680`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/preview/{preview.tsx,public.ts}` | cria | a área do Projeto |
| `apps/web/src/hub/projects/area.tsx` | muda: a Prévia no lugar de `Stage`; **Abrir app** com `target="_blank" rel="noopener noreferrer"`, como `markdown.tsx:20` | a rota do Projeto |
| `apps/web/src/builder/conversation/stage.tsx` | move para `builder/preview/` | `preview.tsx` |
| `apps/web/src/builder/conversation/{use-session.ts,machine-line.tsx,builder-turn.tsx,preview-line.tsx}` | muda e cria | o painel |
| `apps/web/src/routes/_app/companies/$companyId/projects/$projectId.tsx` | muda | — |

### Os contratos que a unidade cria

```ts
// apps/web/src/builder/preview/preview.tsx
export function Preview(props: { project: Project }): ReactNode
// apps/web/src/builder/preview/public.ts
export { Preview }
type FrameView = 'computer' | 'phone'
type FrameState =
  | { kind: 'empty' }                // appVersion null: Stage
  | { kind: 'framed'; src: string }  // https://<address>/ e, depois da entrada, o location
// o aviso do WebKit da Apple vem de `isAppleWebKitBrowser()`, acima do iframe; se a prova da U1
// mostrar que o Safari não carrega o app, `{ kind: 'refused' }` no lugar do iframe (critério 29)

// apps/web/src/hub/projects/area.tsx: Abrir app
<a href={`https://${project.address}/`} target="_blank" rel="noopener noreferrer">Abrir app</a>
```

A `key` do iframe é `appVersion` mais o contador de **Recarregar**. `use-session.ts` invalida a leitura
do Projeto quando chega `data-conexus-preview` `ready`, como `savesVersion` faz com o código. A
mensagem de entrada só vale com `event.origin === https://<address>` e `event.source ===
iframe.contentWindow`, parseada por `FrameEntry`. WebKit da Apple: a função de vibesdk
`isAppleWebKitBrowser`, escrita aqui. Frases: "Subindo o app…", "Prévia pronta.", "Prévia não
atualizada: " e a frase do código, "O app pode não abrir aqui dentro neste navegador." (ou, se o Safari não carregar, "Este navegador não abre o app aqui dentro."), "Computador",
"Celular", "Recarregar".

### As skills e a leitura

`shadcn` (as peças de `ui/`), `impeccable` só para QA (T25), as linhas `@tanstack/react-query` e
`@tanstack/react-router` de `stack.md`.

### A ordem do trabalho

1. Mover `Stage`; `Preview` com os três estados. Regras: W10, W15, V39.
2. A barra com `ToggleGroup` (oculta abaixo de `md`) e **Recarregar**.
3. A entrada (`createAppFrameHandoff`), o aviso do WebKit da Apple e **Abrir app** numa aba nova.
4. `use-session.ts`, `machine-line.tsx` (`sending`), `preview-line.tsx` em `builder-turn.tsx`.

### Como se prova

Critérios 23 a 31: `preview.test.tsx`, `preview-line.test.tsx` e `project.test.tsx` com o Hub de teste do web; as
capturas T23 a 1366 e 390 px, nos dois temas, de vazio, app, Celular, o aviso do WebKit da Apple e a conversa com
"Subindo o app…" e "Prévia pronta.".

### Parar se

Uma frase ou um estado que a matriz não tem; o aviso pedir mais que **Abrir app**.

## U4 As instruções do Builder

**Base e modelo.** `main` no commit aprovado. Sonnet.

### As linhas da tabela

**As instruções do Builder falam da Prévia**: as linhas 3, 6, 22, 53 e 54 do `builder.md` do OS em
`e0353c36`, e `builder-prompt.md:12,19,20`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/conversation/` (instruções, `test-prompt.ts`) | muda | `builder.ts` |
| `docs/reference/builder-prompt.md` | muda | — |

### Os contratos que a unidade cria

Nenhum tipo. As linhas 3, 6 e 22 voltam ao texto do OS com a Prévia (a 6 segue com o que a 14.2
mudou); a 53 diz a Conversa, o Código e a Prévia, sem a aba Diff (Alterações) nem Integrações;
a 54 ganha "atualiza a Prévia".
`builder-prompt.md` muda os vereditos dessas linhas na mesma PR.

### As skills e a leitura

`mastra`.

### A ordem do trabalho

1. As frases e `test-prompt.ts`. 2. `builder-prompt.md`.

### Como se prova

Critério 32: o teste das instruções com `test-prompt.ts`. Falha hoje: as linhas sem a Prévia.

### Parar se

Uma frase do OS que fale de algo que não existe na 14.1 (Alterações, Versões do Builder,
Integrações): fica fora e o veredito diz por quê.
