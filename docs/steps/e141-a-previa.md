# Etapa 14.1: A Prévia

## A página do fundador

**No fim desta etapa** você pede um app ao Builder e, quando a versão guardada monta, usa esse app
de verdade na aba **Prévia**, dentro do Hub, com os dados da prévia separados dos do app no ar; a
aba **Alterações** mostra, linha a linha, o que cada versão mudou.

**O roteiro de uso.** Padaria Sol, com Ana (dona) e Diego (membro); Empresa B.

1. Como **Ana**, "Encomendas" › **Conversa**: "Crie um app de encomendas com cliente, telefone,
   produto e data de entrega." No fim do turno, "**Versão 1 guardada**, montou"; na **Prévia**,
   "Preparando a prévia…" e, uns 10 a 12 s depois, o app. Ana cadastra "Maria, bolo de cenoura,
   sexta".
2. Na barra: **Computador | Celular**, **Recarregar**, o endereço, "Versão 1", **Abrir em nova
   aba**. **Celular**: moldura de 390 px.
3. "Agora guarde também o endereço." Durante o turno a Prévia segue na versão 1; no fim recarrega
   sozinha na 2, com a Maria lá. **Alterações** mostra "+2", as linhas novas em verde,
   **Unificado | Lado a lado**.
4. Como **Diego**, a Prévia abre e grava. Na **Empresa B**, o endereço da prévia dá "não
   encontrado". **Abrir app** segue no app do ar.
5. No celular: o mesmo Projeto, com **App | Conversa** embaixo.

**O que você faz, e quando.** Antes da U1: abre no iPhone as duas páginas `cx-prova` e diz o que viu
("Sim as duas", ainda não feito). No começo: aprova esta página. No fim: faz o roteiro, diz o que
viu e aprova os textos das telas.

**O que muda desde o cartão do PR 213 (técnico, não é decisão sua).** A conferência da 14 já monta
o app na máquina durante o turno: a Prévia só pega essa pasta (2 s, ainda no turno) e sobe depois
do turno, para "Versão guardada" não esperar 8 s a mais (o fim do turno da 14.2 espera tudo o que
roda nele; provado). Cai a remontagem no servidor. A issue #237 entra em Alterações.

**As suas palavras que a etapa cumpre.** P1 A: a versão de verdade, montada na máquina e enviada
pelo caminho da etapa 9 a um endereço de prévia (o D, mais rápido, fica para depois). P2 A: um
esquema "prévia" no banco da empresa; os dados da prévia sobrevivem a uma versão nova. P3 A: se não
montar, a Prévia segue na última boa e aparece **Pedir ao Builder para corrigir**. P4 A: o desenho
do Conexus OS. iPhone no iOS 18: a Prévia em nova aba. Provas reais da U1 autorizadas ("Autorizo
provas reais", 2026-10-21).

**A versão "pela metade", decidida por você: "A" (2026-10-24).** Uma versão "pela metade" (turno com tarefa aberta, 14.2)
não vai à Prévia: ela fica na última que montou e diz "A versão 3 ficou pela metade. A prévia
continua na versão 2." *Padaria Sol:* a Ana nunca testa um app pela metade sem saber.

**Os limites.** A Prévia em até 20 s depois de "Versão guardada" (esperado 10 a 12 s), medida na
publicação. Guardamos a do ar, a da prévia e mais 3. Alterações: até 2.000 arquivos e 1 MiB por
arquivo, como Código.

**Fica de fora.** Publicar a prévia (17); o D; a tela mudando enquanto o Builder escreve; mudar
tabelas com dados (15); **Versões** do Builder (17). Das issues `next-card`, entra a #237; as outras
esperam a fila de defeitos (L4), nenhuma toca estas pastas.

**A decisão sua pedida nesta etapa.** Nenhuma além desta página.

## As unidades

Constrói depois que a 14.2 entra em `main`. Lê dela, em `1a98660` (PR #303): o fim do turno no
controlador do Mastra (`beforeAgentEnd` → `closeTurn`, `turn-end.ts:21-64`, que espera
`Writing.finish` = `Runs.finish`, `runs.ts:267-306`), as partes `data-conexus-*` e `VersionCheck`
(`mastra-parts.ts:8-28,75-82`), `saveExtras` (`record.ts:81-112`), `tellVersion`
(`turn-parts.ts:86-88`), o cartão `VersionLine` (`machine-line.tsx:55-80`) e `use-live.ts:55-66`.

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | Registro 0056, entradas de fronteira, provas ao vivo | `docs/` | testes | iPhone |
| U2 | O ambiente prévia: endereço, logins, colunas, esquema, poda, remoção | `hub-api/src/{address,app-login}.ts`, `hub/apps/`, `hub/projects/`, `platform/company-postgres.ts`, migrações | dados | U1 |
| U3 | O envio da prévia no Hub e `readPreview` | `hub/apps/{preview,send,versions,repair,routes,public}.ts`, `hub-api/src/{preview,failures,index}.ts` | dados | U2 |
| U4 | O fim do turno empacota, guarda e solta o envio; a parte `data-conexus-preview` | `builder/runs/`, `builder/conversation/{turn-parts,record}.ts`, `hub-api/src/mastra-parts.ts`, `scripts/record.ts`, `platform/recordings/mastra/` | testes | U3 |
| U5 | A prévia dentro do Hub: cookie, entrada, `createPreviewHandoff` | `apps/edge/src/`, `hub/apps/{handoff,routes}.ts`, `platform/http.ts`, `hub-api/src/apps.ts` | segurança | U2 |
| U6 | A tela Prévia e o cartão da versão | `apps/web/src/builder/preview/`, `hub/projects/area.tsx`, `builder/conversation/` (web) | web | U3, U4, U5 |
| U7 | Alterações e a #237 | `builder/git/`, `hub-api/src/source.ts`, `apps/web/src/builder/source/` | web | — |
| U8 | Percurso, como fazer, QA | `tests/e2e/`, `docs/how-to/` | testes | todas |

`builder/`, `hub/`, `platform/`: `apps/server/src/`; `hub-api/`: `packages/hub-api/src/`. Em
paralelo: U5 e U7 com U3 (não dividem pasta; `hub-api/src/{failures,index}.ts` é de quem chegar
primeiro, o outro faz o merge). U2 em PR próprio (D11). QA antes das revisões (L9). Nenhum pacote
novo. Em toda unidade, `typescript-magician` e `node`.

**Orçamento de código alterado.** U2 300; U3 330; U4 160; U5 230; U6 560; U7 700; U8 60. Total
**2.340**, teto 4.000 (L2).

## Os critérios de aceite

Pelas rotas e `main.ts`, com `Machines` dublê (`LocalSandbox`), Cloudflare dublê e modelo gravado
(T24, T26). **Ao vivo**: só na U1 e na 31, autorizados; nenhum teste da suíte chama serviço de fora
(T14). Must, salvo "should".

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | 0056 "proposed" antes do código, com os critérios 2 a 5; o já provado, citado | o registro | must |
| 2 | U1 | **Ao vivo**: Worker `cx-prova-e141-` em `…--previa`, num iframe do Hub: a entrada da U5 vale e o app grava, em Chrome, Firefox e Safari 26.2 ou mais (Mac e iPhone), versões anotadas; Safari mais antigo: nova aba; fora do iframe, sem passagem: a página de sessão | 0056 | must |
| 3 | U1 | **Ao vivo**: `<rótulo>--previa` responde em HTTPS com o certificado de hoje (0041) | 0056 | must |
| 4 | U1 | **Ao vivo**: 50 scripts podados; cada GET dá 404 após a propagação, tempo anotado | 0056 | must |
| 5 | U1 | **Ao vivo**: primeira consulta da prévia com o Neon dormindo, anotada | 0056 | should |
| 6 | U2 | `previewHostOf` dá `<rótulo>--previa`; rótulo de 56 a 63: `undefined`; `appHostLabelOf` lê `live` e `preview`, recusa 4 partes e sufixo alheio | `address.test.ts` | must |
| 7 | U2 | Esquema e logins `app_<id>_previa*`; o login de rodar da prévia lê o esquema do ar: 42501, e o do ar o da prévia: 42501 | `company-postgres.test.ts` | must |
| 8 | U2 | Apagar o Projeto remove os dois esquemas, os logins e os scripts; falha isolada vira pendência | `removal.test.ts` | must |
| 9 | U2 | A poda mantém o ar, a prévia, a pendente e as 3 `ready` mais novas; `listAppVersions` só `live` | `prune.test.ts`, `versions.test.ts` | must |
| 10 | U3 | `storePreview` duas vezes com a mesma chave: uma versão (`REPLAY`); outra pasta, mesma chave: `IDEMPOTENCY_CONFLICT` | `preview.test.ts` | must |
| 11 | U3 | Prévia e envio manual ao mesmo tempo: cada um no seu ponteiro; o do ar não muda | idem | must |
| 12 | U3 | A 3 guardada enquanto a 2 sobe: a 2 perde a reivindicação e seu Worker sai; o ponteiro fica na 3, nunca desce | idem | must |
| 13 | U3 | Cloudflare recusa (10021): `failed`, `APP_VERSION_NOT_STARTING`, `last` na boa | idem | must |
| 14 | U3 | Hub morre durante o envio: no início seguinte, `repairApps` retoma pelos arquivos guardados, uma versão, sem a máquina | `repair.test.ts` | must |
| 15 | U3 | `readPreview` (membro, `readProjectSource`): `none`, `no-address`, `pending`, `ready`, `failed`, `kept` e `last`; outra empresa: 404 (S10) | `preview-route.test.ts` | must |
| 16 | U3 | Os dados sobrevivem: o registro da N é lido na N+1; uma migração nova na prévia, tudo ou nada (0046); migração aplicada mudada: `APP_MIGRATION_CHANGED`; o esquema do ar não muda | `preview.test.ts` | must |
| 17 | U4 | Versão `passed`: o fim do turno empacota e guarda antes de `agent_end`; o envio corre depois, e `agent_end` não espera o envio (dublê de Cloudflare que leva 5 s) | `runs-preview.test.ts` | must |
| 18 | U4 | `failed`, `unchecked`, `unfinished`: nada é empacotado; a parte diz `kept` com o código, e `readPreview.kept` também | idem | must |
| 19 | U4 | Pasta acima de `APP_LIMITS`, com link ou não regular: `PREVIEW_PACK_FAILED`, sem ler o resto (C59, S2); a máquina lança: o mesmo código, logado uma vez, o turno termina | idem | must |
| 20 | U4 | Relida a conversa, o cartão traz `data-conexus-preview` como o Mastra a guarda | `conversation-preview.test.ts` (gravação `preview-extras`) | must |
| 21 | U4 | O prompt volta às frases da Prévia nas linhas 3, 6, 22, 53 e 54 da tabela de `builder-prompt.md` | `prompt.test.ts` | must |
| 22 | U5 | Host da prévia: cookies `SameSite=None; Secure; Partitioned`; `frame-ancestors` a origem do Hub; num iframe sem sessão: a entrada, nunca o salto; segunda entrada seguida: a página de falha com `{type: 'entry-failed'}`; host do ar igual a hoje | `dispatcher-preview.test.ts` | must |
| 23 | U5 | `createPreviewHandoff`: membro recebe a passagem; outra empresa: 404; `Origin` alheio: `REQUEST_ORIGIN_REFUSED`; passagem repetida ou de outro navegador: `APP_HANDOFF_INVALID`; sessão de um ambiente não abre o outro; prévia sem versão: `APP_NOT_FOUND` | `preview-handoff.test.ts` | must |
| 24 | U5 | Hub: `frame-src https://*.<domínio dos apps>`, o resto da CSP igual | `http.test.ts` | must |
| 25 | U6 | Estados da matriz; no turno, a Prévia segue na última boa; recarrega quando `readPreview` passa a `ready` de um número maior; "pela metade" e "não montou" com a versão de `last` | `preview.test.tsx` | must |
| 26 | U6 | Barra: nomes e teclado (V30, V31); Celular, 390 px; **Abrir em nova aba**; entrada recusada duas vezes: o aviso e **Abrir em nova aba**; **Pedir ao Builder para corrigir** põe o código e a versão no campo | idem | must |
| 27 | U6 | 1280, 390 px, 200 %, dois temas, CSP limpo; trocar de aba não recarrega o iframe | navegador (T23) | must |
| 28 | U7 | `readChanges`: novo, removido, renomeado, binário, `+N −M`; arquivo acima de `SOURCE_FILE_MAX_BYTES` num lado: `SOURCE_DIFF_TOO_LARGE` sem ler (C44, C59); commit fora de `main`: `SOURCE_VERSION_NOT_FOUND`; outra empresa: 404 | `changes.test.ts` | must |
| 29 | U7 | #237: `readProjectSource` dá `version` de `versionAt(commit)`, a admissão sai do arquivo da rota | `source.test.ts` | must |
| 30 | U7 | Unificado, Lado a lado; linhas sem alteração recolhidas; 390 px em lista e toque | `changes.test.tsx` | must |
| 31 | U8 | O roteiro com dublês; o relatório de QA no commit candidato (T25); **ao vivo**, publicado: o roteiro e o tempo até a Prévia, 20 s (should) | `tests/e2e/builder-preview.test.ts`, `conexus-qa`, firstmate (L17) | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Prévia | "Ainda não há uma prévia. Descreva o aplicativo para começar." (o texto de `Stage`) | idem | "Preparando a prévia…", sobre a última boa | `failed`: "A prévia da versão N não subiu." + `last`: "A prévia continua na versão M."; `kept`: "A versão N não montou." ou "A versão N ficou pela metade." + o mesmo; **Pedir ao Builder para corrigir** | a do Projeto | a do Projeto | sessão vencida: a entrada da U5, sem aviso; recusada duas vezes: "Este navegador não abre a prévia aqui dentro." e **Abrir em nova aba**; `no-address`: "O nome deste Projeto é longo demais para ter prévia." |
| Alterações | "Nenhuma versão guardada ainda." | "Esta versão não mudou arquivos." | a partilhada | a de `ui/` | "Esta versão não está mais guardada." | a do Projeto | "Esta diferença é grande demais para mostrar aqui." |
| Cartão da versão | — | — | — | o da 14.2 | — | — | — |
| App \| Conversa (390) | Conversa | — | ponto "trabalhando" | — | — | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `apps.app.preview_version_id`, `preview_sending_version_id`, `preview_claimed_until`, `preview_database_ready` | U3 | U3 (`readPreview`, repair), U5 (`callTo`), U2 (poda, remoção) |
| `apps.app.preview_kept_number`, `preview_kept_code` | U3 (`keepPreview`, chamado pela U4) | U3 (`readPreview`) |
| `apps.app_version.environment`, `source_number` | U3 | U2 (lista, poda), U3 (ponteiro, `readPreview`) |
| parte `data-conexus-preview` `{sourceNumber, state, code?}` | U4 | U6 (o cartão; e invalida `readPreview`) |
| `readPreview`, `createPreviewHandoff`, `readChanges`, `readFileDiff` | U3, U5, U7 | U6, U7 |

**Os desenhos** (capturas do Conexus OS `os-34`, `os-35`, `os-37`, `os-63`, `os-64`, fora do
repositório, L21):

```text
1280 ┌ Padaria Sol / Encomendas ▾ ─ Prévia · Código · Alterações +2 · Projeto ───────  Abrir app ┐
     │ [Computador|Celular] ⟳  encomendas--padaria-sol--previa…  Versão 2   ↗ │ Conversa           │
     │ ┌──────────────────────────────────────────────────────────────────┐ │ … Versão 2 guardada │
     │ │                  o app, iframe "Prévia do aplicativo"            │ │ [Ver aplicativo]   │
     │ └──────────────────────────────────────────────────────────────────┘ │ [Alterações]       │
     └──────────────────────────────────────────────────────────────────────┴─ compositor ───────┘
390  ┌ [Encomendas ▾] ──────────────┐
     │ Prévia · Código · Alterações │   Alterações: lista de arquivos (+N, Novo/Removido/
     │ [Comp.|Celular] ⟳ Versão 2 ↗ │   Renomeado) e a diferença; a 390, lista e toque
     │ o app                        │
     │ [ App | Conversa ]           │
     └──────────────────────────────┘
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `Machines.pack` no fim do turno | um por `finish` (o segundo dá `gone`) | recusa de `packIn`: `kept` `PREVIEW_PACK_FAILED` | E2B lança: o mesmo, logado | `PREVIEW_PACKED`, `PREVIEW_PACK_FAILED` | 17, 19 |
| `storePreview` (versão, blobs, reivindicação) | chave `<runId>`: `REPLAY` | uma transação | banco: `kept` `APP_VERSION_FAILED`, o turno termina | `APP_VERSION_RECEIVED` | 10, 12 |
| `keepPreview` | o número maior vence | uma instrução | banco: logado, a Prévia fica sem o aviso | — | 18 |
| Upload do script da prévia | nome por versão | `abandon` apaga | Cloudflare: `failed` | `APP_VERSION_UPLOADED` | 13 |
| Esquema e logins da prévia | `IF NOT EXISTS`, nunca recriado | uma transação | Neon: `failed` | `APP_DATABASE_READY` | 7, 16 |
| Migrações na prévia | razão 0046; linhas ficam | tudo ou nada | idem | `APP_MIGRATED` | 16 |
| Ponteiro da prévia | reivindicação (C65) e `source_number` maior | relido sob `FOR UPDATE` | — | `PREVIEW_VERSION_READY` | 11, 12 |
| Retomada no início | uma cópia toma a reivindicação vencida | a próxima retomada | idem | `PREVIEW_RESUMED` | 14 |
| `memory.saveMessages` do turno com a parte | upsert por `id` (gravação) | o da 14.2 | logado (`saveExtras`) | — | 20 |
| Remover esquema, logins e scripts da prévia | idempotente | pendência da 12 | pendência | `PROJECT_APP_DELETED` | 8 |
| Passagem e sessão no host da prévia | `DELETE … RETURNING` (S22) | — | Hub: a página | — | 23 |
| Poda dos scripts | idempotente | a próxima | pendência | `APP_VERSION_PRUNED` | 4, 9 |
| `git diff` | só leitura | prazo e sinal (C57) | — | — | 28 |

## O mapa do estudo

| Achado ou decisão do estudo (relatório:linha) | Unidade dona, ou "fica de fora" e por quê |
| --- | --- |
| Q1, P1 A, P2 A (80) | U2, U3 |
| Q2, a remontagem não existe mais; `pack` lê a pasta da conferência (81) | U4; a remontagem fica de fora |
| Q3, `onBeforeAgentEnd` espera sem limite; envio fora do gancho (82, 119) | U4, critério 17 |
| Q4, parte `data-conexus-*` regravada no mesmo id (83) | U4 grava a parte no fim do turno; a regravação depois do envio fica de fora: a Prévia e o cartão leem `readPreview` (estudo 7.3) |
| Q5, `unfinished`, `unchecked` (84); a versão "pela metade", "A" do fundador | U4, critério 18; U6, o aviso |
| Q6, iframe e cookie particionado; Safari só lido (85) | U1 (critério 2), U5 |
| Q7, 10,1 a 12,6 s, hipótese (86, 191) | U1 anota; U8 mede (31) |
| Erro do ouvinte impresso cru pelo Mastra (125-130) | U4: o empacotamento dentro do `catch` de `closeTurn` |
| `saveMessages` não muda `createdAt` (120) | U4, critério 20 |
| `DISPATCH_OPTIONS` iguais nos dois ambientes (121) | U5 |
| Upload de assets sequencial, wrangler faz 3 (122) | fica de fora: velocidade opcional, sem medida ao vivo |
| Host de um rótulo, certificado de um nível, 0024 (123) | U2, U1 (critério 3) |
| 0021 ambiente, 0046 ordem, 0055 a conferência monta (147-152) | U2, U3, U4 |
| Nomes velhos `resumeRuns`, `admitRun`; Factory 1.69 (156-157) | saem; U7 cita a Factory 1.78 |
| #237 (159, 236) | U7, critério 29 |
| 0020 "antes da Prévia" (160) | U1 reescreve para 0046 |
| D, Worker Loader (203) | fica de fora: a aceleração futura do fundador |
| Envio retomado pela máquina em `settleRuns` (173-175) | trocado: a U3 guarda a pasta no banco ainda no turno, e `repairApps` retoma pelos arquivos guardados, sem a máquina (14) |
| `Stage` apagado (186) | U6 |
| iPhone não rodado; Cloudflare ao vivo; Neon frio (256-263) | fundador antes da U1; U1 (2 a 5) |
| Telas: sem 1440, sem escuro, sem `critique` (260-262) | U6 e QA (T25) |
| Skills do mantenedor não carregadas no estudo (304-306) | cada unidade carrega as da sua linha |

## O que nasce novo e o que é trazido

| Mecanismo | Nativo, nosso ou trazido | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base | Como Mastra, vibesdk e Conexus OS fazem, `file:line` |
| --- | --- | --- | --- | --- | --- |
| Empacotar no fim do turno | trazido (`main`, 14 U4, sem chamador) | `builder/machine/pack.ts`, `machines.ts:242-247` | não | S2, C59; base: segurança | vibesdk empacota na ferramenta de deploy (`worker/agents/think/deploy-tool.ts:23-50`) |
| Envio da prévia | trazido (`hub/apps/send.ts`) + ambiente | `hub/apps/send.ts`, `preview.ts` | sim: ambiente, ponteiro por `source_number` | 0046, C65; base: medida (0046) | vibesdk sobe por REST ao WfP (estudo 2 §4.1); Mastra não tem |
| Ponteiro, esquema e logins da prévia | nosso: WfP não tem ambiente; entrada nova em `boundaries.md` (U1) | `hub/apps/tables.ts`, migrações, `platform/company-postgres.ts` | — | 0021 | vibesdk: SQLite por ramo (`think-user-deploy.ts:50-62`) |
| Entrada e cookie no host da prévia | nosso: cookie não tem API no runtime; entrada nova em `boundaries.md` (U1) | `apps/edge/src/{dispatch,headers,pages}.ts` | — | S22, 0041 | vibesdk `worker/utils/spacePreviewToken.ts:58-87` |
| Parte `data-conexus-preview` | nativo: parte `data-*` do Mastra | `hub-api/src/mastra-parts.ts`, `conversation/turn-parts.ts` | — | 14.2 | Mastra `@mastra/pg@1.31.2` `dist/index.js:13063-13070` (upsert) |
| Recarregar ao ficar pronta | nativo: TanStack Query `refetchInterval` | `apps/web/src/builder/preview/` | — | — | vibesdk `src/routes/chat/utils/handle-websocket-message.ts:1023-1039`; Dyad `PreviewIframe.tsx:1676-1684` |
| Barra, estados, cartão | desenho trazido (P4 A) | `apps/web/src/builder/preview/` | textos | `os-34`, `os-35`, `os-63`, `os-64` | Conexus OS `lens-preview.tsx:68-117` |
| Alterações | nativo: `git diff` | `builder/git/changes.ts`, `apps/web/src/builder/source/` | — | 0029 | Mastra Factory 1.78 `mastracode/factory/src/routes/fs.ts:168,690-743,779-783,900-920`; OS `lens-diff.tsx:12-33` |

**A medida do transplante.** Nenhum código do produto antigo entra. De `main` entram `packIn` (122
linhas, sem mudança) e `sendVersion` (242 linhas, recebe o ambiente).

**A dívida.** As colunas `preview_*` viram uma linha por ambiente na 17 (D6). Upload de assets em 3
de cada vez, como o wrangler.

## U1 Registro e prova

**Base e modelo.** `main` depois da 14.2. Sonnet: documentos e provas roteirizadas.

### Ler primeiro

| Arquivo e símbolo | Linhas na base | Por quê |
| --- | --- | --- |
| `docs/decisions/0020-*.md`, `0021`, `0024`, `0041`, `0046`, `0055` | todas | o que 0056 cita e reescreve |
| `docs/architecture.md` "store an app version", sessão do app | a seção | ganham o ambiente |
| `docs/reference/boundaries.md` | o formato de uma entrada | duas entradas novas |

### A referência

| Pacote@versão ou repositório@commit, arquivo | Linhas | O que copiar e o que adaptar |
| --- | --- | --- |
| vibesdk@`9da158d` `worker/utils/spacePreviewToken.ts` | 58-87 | os atributos do cookie, para a entrada de fronteira |
| `apps/edge/worker-configuration.d.ts` (`wrangler types`) | 15939 | `DispatchNamespace.get`, sem ambiente: a razão do ponteiro nosso |

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/decisions/0056-preview-environment.md` | cria | `check-docs` |
| `docs/{index,architecture,roadmap}.md`, `docs/decisions/0020-*.md`, `docs/reference/boundaries.md` | muda | `check-docs` |

### Os contratos que a unidade cria

0056: o ambiente `preview` (host `<rótulo>--previa`, esquema e logins próprios, ponteiro só sobe),
a pasta empacotada no turno e enviada depois (estudo, Q3, provado), a retomada pelos arquivos
guardados; os critérios 2 a 5 com resultado e lugar. Duas entradas em `boundaries.md`: "O ambiente
da prévia é nosso" (prova: `DispatchNamespace.get(name, args, options)` não tem ambiente) e "A
entrada do iframe põe o cookie particionado" (prova: o estudo 3, Chromium 153 e Firefox 155).

### As skills e a leitura

`cloudflare:wrangler`, `cloudflare:workers-best-practices` (provas), `mastra` (o fim do turno).

### A ordem do trabalho

1. 0056 "proposed", com os critérios 2 a 5. Regras: L21, T14, S40.
2. As provas ao vivo com o Worker `cx-prova-e141-`, apagado no fim; resultados no registro.
3. 0020: "o verificador checa antes da Prévia" vira "a Cloudflare recusa o que não inicia (0046)".

### Como se prova

`npm run docs`; os critérios 2 a 5 no registro, com data e versões dos navegadores.

### Parar se

O iPhone do fundador ou o Safari 26.2 não entra pelo cookie particionado: a Prévia em nova aba vale
para todo Safari; volta ao fundador antes da U5.

## U2 O ambiente prévia

**Base e modelo.** `main` depois da U1. Sonnet: colunas, esquema e logins sobre o modelo de `send.ts`.

### Ler primeiro

| Arquivo e símbolo | Linhas na base | Por quê |
| --- | --- | --- |
| `packages/hub-api/src/address.ts` `HostLabel`, `hostLabelOf`, `appHostOf` | 39-47, 74-88 | o sufixo e o espaço reservado |
| `packages/hub-api/src/app-login.ts` `appLogin` | 8-14 | ganha o ambiente |
| `apps/server/src/hub/apps/tables.ts` `app`, `appVersion` | 89-161 | as colunas novas, o modelo das FKs e checks |
| `apps/server/src/hub/apps/app-database.ts` `openAppDatabase`, `migrateApp` | 25-81 | recebem o login do ambiente |
| `apps/server/src/hub/apps/{prune,removal}.ts` | todas | mantêm e apagam a prévia |
| `apps/server/src/hub/apps/versions.ts` `listVersions` | 276-292 | só `live` |

### A referência

| Pacote@versão ou repositório@commit, arquivo | Linhas | O que copiar e o que adaptar |
| --- | --- | --- |
| `apps/server/src/hub/apps/tables.ts` (`main`) | 100-120 | as FKs compostas e `app_sending_has_claim`, repetidas para a prévia |
| `drizzle-orm@1.0.0-rc.4` `check`, `foreignKey` | — | como no modelo |

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/{address,app-login}.ts` | muda | Hub, web, despachante |
| `apps/server/src/hub/apps/{tables,prune,removal,versions,app-database}.ts`, `hub/projects/{projects,hosts}.ts` | muda | `send.ts`, `main.ts` |
| `apps/server/src/platform/company-postgres.ts`, `apps/server/migrations/`, `platform/catalog.test.ts` | cria, muda | o Hub no início |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/address.ts, o dono do ambiente e do sufixo (C26)
export const APP_ENVIRONMENTS = ['live', 'preview'] as const
export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number]
export const PreviewHostLabel: z.ZodType<string & z.$brand<'PreviewHostLabel'>> // `<HostLabel>--previa`, até 63
export function previewHostOf(label: HostLabel): PreviewHostLabel | undefined // undefined acima de 55
/** O único leitor de um rótulo de host (C26): o despachante e o Hub. */
export function appHostLabelOf(label: string):
  | { environment: 'live'; label: HostLabel }
  | { environment: 'preview'; label: PreviewHostLabel; live: HostLabel }
  | undefined
// packages/hub-api/src/app-login.ts
export function appLogin(projectId: ProjectId, environment: AppEnvironment): AppLogin
// preview: app_<id>_previa, app_<id>_previa_run, app_<id>_previa_migrate (51 caracteres, < 63)
```

`hostLabelOf` reserva 8 para o sufixo (nomes novos até 55). A migração soma em `apps.app`:
`preview_version_id`, `preview_sending_version_id`, `preview_claimed_until`, `preview_database_ready
boolean not null default false`, `preview_kept_number integer check > 0`, `preview_kept_code text`
(`check` pela lista da U3, nulo junto com o número); FKs compostas e `app_preview_sending_has_claim`
como as do ar. Em `apps.app_version`: `environment text not null default 'live' check in
('live','preview')`, `source_number integer`, `check ((environment = 'preview') = (source_number is
not null))`. `ENVIRONMENT_COLUMNS: Record<AppEnvironment, {version, sending, claimedUntil,
databaseReady}>` em `tables.ts`, o dono do nome das colunas. Colunas em tabelas que já têm grants:
`database-grants.sql` não muda, só o retrato do catálogo (D11). Modelo: `tables.ts`; cumpre C21 (estados em `check`), C23 (ids
marcados no limite), C26 (um dono).

### As skills e a leitura

`docs/reference/stack.md`: drizzle, `neon:neon-postgres`.

### A ordem do trabalho

1. Apagar: nada. `address.ts`: `PreviewHostLabel`, `previewHostOf`, `appHostLabelOf`, o espaço em
   `hostLabelOf`. Regras: C23, C26.
2. Migração e `tables.ts`, `ENVIRONMENT_COLUMNS`; retrato do catálogo. Regras: D6, D11, D12, 0039.
3. `appLogin(projectId, environment)`; `company-postgres.ts` cria o esquema e os logins da prévia
   com os grants do ar, cada login só no seu esquema. Regras: D15, 0021.
4. `prune.ts` mantém `previewVersionId`, `previewSendingVersionId` e as 3 `ready` do ar mais
   novas; `removal.ts` apaga os dois ambientes; `listVersions` filtra `environment = 'live'`.

### Como se prova

Critérios 6 a 9: `node --test` nos quatro arquivos e `catalog.test.ts`, com o Postgres local
(superusuário e `conexus_owner`). Falha hoje: `address.test.ts` (o caso `previewHostOf`) e
`company-postgres.test.ts` (o login `_previa_run`).

### Parar se

Um rótulo existente tem mais de 55 caracteres na produção: o Projeto fica `no-address`; não renomear.

## U3 O envio da prévia no Hub

**Base e modelo.** Depois da U2. **Opus**: duas reivindicações por Projeto, a retomada no início e
o ponteiro que só sobe são concorrência.

### Ler primeiro

| Arquivo e símbolo | Linhas na base | Por quê |
| --- | --- | --- |
| `apps/server/src/hub/apps/send.ts` `prepare`, `abandon`, `finish`, `sendVersion` | 97-123, 138-183, 192-242 | o caminho que a prévia percorre |
| `apps/server/src/hub/apps/versions.ts` `lockApp`, `failVersion`, `storeAppVersion`, `holdsClaim` | 131-161, 192-264, 267-274 | a reivindicação |
| `apps/server/src/hub/apps/repair.ts` `failExpiredSends` e o reenvio do ar | 28-45, o resto | a retomada |
| `apps/server/src/builder/git/source.ts` `admit` | 21-35 | a admissão de membro (`readProjectSource`) |

### A referência

| Pacote@versão ou repositório@commit, arquivo | Linhas | O que copiar e o que adaptar |
| --- | --- | --- |
| `apps/server/src/hub/apps/send.ts` (`main`) | 97-242 | a ordem de 0046, `standing`, `abandon`; a prévia troca a admissão por `useConversations` e as colunas por `ENVIRONMENT_COLUMNS.preview` |
| `apps/server/src/hub/apps/repair.ts` (`main`) | 28-45 | a vencida falha no ar; na prévia, retoma |

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/apps/{preview,send,versions,repair,routes,public}.ts` | cria, muda | `main.ts`, a U4 pela porta |
| `packages/hub-api/src/{preview,failures,index}.ts` | cria, muda | web, OpenAPI |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/preview.ts
export const PreviewCode = z.enum(['APP_CHECK_FAILED', 'CHECK_PLATFORM_FAILED', 'VERSION_UNFINISHED',
  'PREVIEW_PACK_FAILED', 'APP_VERSION_FAILED', 'APP_VERSION_NOT_STARTING'])
const Last = z.object({ host: z.string(), sourceNumber: z.int().positive() })
/** O que a Prévia mostra (C21): `state` separa as variantes. */
export const Preview = z.discriminatedUnion('state', [
  z.object({ state: z.literal('none') }),
  z.object({ state: z.literal('no-address') }),
  z.object({ state: z.literal('pending'), sourceNumber: z.int().positive(), last: Last.optional() }),
  z.object({ state: z.literal('ready'), host: z.string(), sourceNumber: z.int().positive(), savedAt: z.iso.datetime() }),
  z.object({ state: z.literal('failed'), sourceNumber: z.int().positive(), code: PreviewCode, last: Last.optional() }),
  z.object({ state: z.literal('kept'), sourceNumber: z.int().positive(), code: PreviewCode, last: Last.optional() }),
])
export const readPreview = defineOperation({ id: 'readPreview', access: 'session', method: 'GET',
  path: '/api/companies/{companyId}/projects/{projectId}/preview', /* 200 Preview; 404 */ })
// apps/server/src/hub/apps/public.ts, a porta que a U4 recebe em RunsDeps (C4)
export type PreviewPort = {
  /** No turno: guarda a pasta e toma a reivindicação da prévia; a mais velha em curso perde. */
  store(input: Ids & { personId: PersonId; runId: RunId; sourceNumber: number; folder: VersionFolder }):
    Promise<{ kind: 'STORED' | 'REPLAY'; versionId: AppVersionId } | { kind: 'FAILED' }>
  /** Depois do turno: Worker, esquema, migrações e o ponteiro; nunca lança (C50). */
  send(input: Ids & { versionId: AppVersionId }): Promise<void>
  /** Uma versão que não vai à Prévia, e por quê; o número maior vence. */
  keep(input: Ids & { sourceNumber: number; code: PreviewCode }): Promise<void>
}
```

`ready` só quando o ponteiro é a versão de prévia mais nova; `pending` quando há reivindicação viva;
`kept` quando `preview_kept_number` é maior que o da mais nova. `last` é o ponteiro. Chave de
`store`: `runId` (C37). Admissão: `useConversations`, relida em `finish` (S8). Códigos novos em
`failures.ts`: `PREVIEW_VERSION_READY`, `PREVIEW_RESUMED` (impressos, C48). Modelo: `send.ts`;
cumpre C21, C26; C23 parcial (o `biome-ignore` de `failVersion`, que a U3 não amplia).

### As skills e a leitura

drizzle, `fastify-best-practices`, `neon:neon-postgres`.

### A ordem do trabalho

1. `send.ts`: `prepare`, `abandon` e `finish` recebem `environment`; `finish` da prévia, sob
   `lockApp` com `FOR UPDATE`, sobe o ponteiro só se `held.previewSendingVersionId` é a versão e o
   `source_number` dela é maior que o do ponteiro. Regras: C65, D22, 0046.
2. `preview.ts`: `store` (o `storeAppVersion` com `environment: 'preview'`; reivindicação viva de
   número menor: `failVersion` nela e toma; de número maior: `FAILED`), `send`, `keep`, `readPreview`.
3. `repair.ts`: reivindicação de prévia vencida com versão `sending` retoma uma vez (lê
   `versionFile` e `blob`, como o reenvio do ar), imprime `PREVIEW_RESUMED`; a do ar segue falhando.
4. `routes.ts` registra `readPreview`; `public.ts` exporta a porta.

### Como se prova

Critérios 10 a 16 por `main.ts` e as rotas, Cloudflare dublê com atraso e 10021, o Postgres local.
Falha hoje: `preview-route.test.ts` (404 da rota que não existe).

### Parar se

Guardar a pasta (blobs de até `APP_LIMITS.bytes`) leva mais de 1 s no teste com a pasta do
`recados`: medir e voltar ao cartão antes de pôr no turno.

## U4 O fim do turno empacota e solta o envio

**Base e modelo.** Depois da U3 e da 14.2. **Opus**: o fim do turno do Mastra espera o gancho; o
que entra nele e o que sai é concorrência.

### Ler primeiro

| Arquivo e símbolo | Linhas na base | Por quê |
| --- | --- | --- |
| `apps/server/src/builder/runs/runs.ts` `Runs.finish` (14.2) | `1a98660` 267-306 | o único lugar que ainda tem a máquina |
| `apps/server/src/builder/runs/save.ts` `saveRun` | 37-95 | dá `saved` com `check` |
| `apps/server/src/builder/runs/context.ts` `RunsDeps`, `Settled` | `1a98660` 16-76 | a porta e o resultado |
| `apps/server/src/builder/conversation/turn-end.ts` `closeTurn` | `1a98660` 40-64 | o `catch` que cobre o empacotamento |
| `apps/server/src/builder/conversation/turn-parts.ts` `tellVersion`; `record.ts` `lasts` | `1a98660` 86-88; 81-92 | a parte nova fica no tópico |
| `packages/hub-api/src/mastra-parts.ts` `CONEXUS_PARTS`, `ConexusPart` | `1a98660` 8-15, 75-82 | a variante nova |
| `scripts/record.ts` | 1-132 | o cenário novo |

### A referência

| Pacote@versão ou repositório@commit, arquivo | Linhas | O que copiar e o que adaptar |
| --- | --- | --- |
| `@mastra/core@1.78.0` `dist/agent-controller-DRiP9C5v.js` | 4699-4717 | o ouvinte é esperado sem prazo e o erro dele vira `console.error`: nada lento nem que lance dentro |
| `@mastra/core@1.78.0` `dist/agent-controller/session.d.ts` | 50-53, 1433-1436 | `onBeforeAgentEnd` |
| `@mastra/pg@1.31.2` `dist/index.js` | 13055-13070 | upsert por `id`, `createdAt` fica |
| o estudo, `recordings/record-preview.ts` (fora do repositório) | 1-130 | o cenário a juntar em `scripts/record.ts` |

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/runs/{runs,context}.ts` | muda | `main.ts`, `turn-run.ts` |
| `apps/server/src/builder/conversation/{turn-parts,record,turn-end}.ts`, `prompt/builder.md` | muda | `live.ts` |
| `packages/hub-api/src/mastra-parts.ts` | muda | web |
| `scripts/record.ts`, `apps/server/src/platform/recordings/mastra/preview-extras.jsonl` | cria, muda | os testes (T26) |
| `apps/server/src/main.ts` | muda | passa `PreviewPort` a `createRuns` |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/mastra-parts.ts: 'data-conexus-preview' entra em CONEXUS_PARTS e ConexusPart
export const PreviewStart = z.discriminatedUnion('state', [
  z.object({ state: z.literal('sending'), sourceNumber: z.int().positive() }),
  z.object({ state: z.literal('kept'), sourceNumber: z.int().positive(), code: PreviewCode }),
])
// apps/server/src/builder/runs/context.ts
export type RunsDeps = { /* … */ preview: PreviewPort }
type SavedVersion = { /* … */ preview: PreviewStart }
```

`record.ts` `lasts` mantém `data-conexus-preview`. A parte não é regravada depois do envio: a tela lê
`readPreview`. Do `check` para o código (o dono é `previewStartOf`, em `runs.ts`): `failed` →
`APP_CHECK_FAILED`, `unchecked` → `CHECK_PLATFORM_FAILED`, `unfinished` → `VERSION_UNFINISHED`.

### As skills e a leitura

`mastra` (fim do turno, memória), `node`.

### A ordem do trabalho

1. `runs.ts` `finish`, logo depois de `saveRun` e antes do `finally` que solta a máquina:

   ```ts
   const outcome = await saveRun(this.#context, saved, mine.check)
   if (outcome === 'gone' || outcome.kind !== 'saved') return outcome === 'gone' ? outcome : { ...outcome, rounds: mine.rounds }
   const preview = await this.#previewOf(mine, saved, outcome.version) // pack + store, ou keep
   return { ...outcome, version: { ...outcome.version, preview }, rounds: mine.rounds }
   ```

   `#previewOf`: `check.state !== 'passed'` → `keep` e `kept`; senão `machines.pack`, recusa ou
   lançamento → `keep` `PREVIEW_PACK_FAILED`; `store`; `STORED` → `void this.#deps.preview.send(…)`
   depois do `finally` (o turno não espera), `sending`. Regras: C50, C59, S2.
2. `turn-end.ts` não muda: `tellVersion` leva o `preview` dentro da versão; `turn-parts.ts`
   `tellPreview` diz a parte junto. `record.ts` `lasts`.
3. `scripts/record.ts`: cenário `preview-extras` (o `record-preview.ts` do estudo), gravado com
   `npm run record -- preview-extras`, conteúdo inventado (S40).
4. `prompt/builder.md`: as frases da Prévia das linhas 3, 6, 22, 53 e 54 de `builder-prompt.md`.

### Como se prova

Critérios 17 a 21. `runs-preview.test.ts` por `main.ts`, `Machines` dublê com a pasta de
`app:pack`, Cloudflare dublê de 5 s: `agent_end` antes do upload. `conversation-preview.test.ts`
carrega `nativeRecording('preview-extras')` (T26). Falha hoje: `runs-preview.test.ts` (`readPreview`
fica `none` depois de um turno `passed`).

### Parar se

A 14.2 entrou com outra forma de `finish` ou de `closeTurn`: reler, mudar só o lugar do
empacotamento, e relatar. O `pack` leva mais de 3 s no dublê: relatar antes de seguir.

## U5 A prévia dentro do Hub

**Base e modelo.** Depois da U2. Opus: cookie entre sites, `postMessage` e sessão por ambiente são
segurança sutil.

### Ler primeiro

| Arquivo e símbolo | Linhas na base | Por quê |
| --- | --- | --- |
| `apps/edge/src/dispatch.ts` `toHub`, `redeem`, `dispatch` | 56-91, 159-183 | onde o iframe entra |
| `apps/edge/src/headers.ts` `withSecurityHeaders`, `setCookie` | 10-18, 31-34 | o cookie e a CSP por ambiente |
| `apps/edge/src/pages.ts` `failurePage` | 42-61 | o modelo da página de entrada |
| `apps/server/src/hub/apps/handoff.ts` `createHandoff`, `checkCall`, `callTo` | 47-78, 119-200 | o host do ambiente |
| `apps/server/src/platform/http.ts` `HELMET_OPTIONS` | 38-57 | `frameSrc` |

### A referência

| Pacote@versão ou repositório@commit, arquivo | Linhas | O que copiar e o que adaptar |
| --- | --- | --- |
| vibesdk@`9da158d` `worker/utils/spacePreviewToken.ts` | 58-87 | `SameSite=None; Secure; Partitioned`; nosso leva `__Host-` e `HttpOnly` |
| estudo 3 (fora do repositório), as páginas `cx-prova` | — | a entrada por `postMessage` provada |

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/edge/src/{dispatch,headers,pages}.ts` | muda | publicar a borda |
| `apps/server/src/hub/apps/{handoff,routes}.ts`, `platform/http.ts` | muda | web, toda resposta |
| `packages/hub-api/src/{apps,failures,index}.ts` | muda | web, despachante |

### Os contratos que a unidade cria

```ts
// apps/edge/src/headers.ts
export function setCookie(name: string, value: string, environment: AppEnvironment): string
export function withSecurityHeaders(headers: Headers, csp?: string, frameAncestors?: string): Headers
// packages/hub-api/src/apps.ts
export const PREVIEW_ENTRY_PATH = '/__conexus/previa'
export const PreviewEntryMessage = z.discriminatedUnion('type', [
  z.object({ type: z.literal('entry'), binding: DoorSecret }),
  z.object({ type: z.literal('entry-failed') }),
])
export const createPreviewHandoff = defineOperation({ id: 'createPreviewHandoff', access: 'session',
  method: 'POST', path: '/api/companies/{companyId}/projects/{projectId}/preview/handoff',
  /* body {binding}; 200 {location}; 404; REQUEST_ORIGIN_REFUSED */ })
```

O despachante lê o host por `appHostLabelOf`; `appHostOf` (o nome do host, `address.ts:85`) aceita os dois rótulos. Prévia: cookies particionados, `frame-ancestors` a origem
do Hub. `Sec-Fetch-Dest: iframe` sem sessão ou `APP_SESSION_INVALID`: a página de entrada, com o hash
do vínculo num `data-` e um script de hash fixo que o manda ao Hub por `postMessage` com
`targetOrigin` a origem do Hub; uma segunda entrada seguida (marca no `redeem`): `entry-failed`. A
tela confere `event.origin` e `event.source`. `createPreviewHandoff`: o `createHandoff` de hoje, o
host tirado do `projectId` por `previewHostOf` (S9). `callTo` lê `ENVIRONMENT_COLUMNS[environment]` e
`appLogin(projectId, environment)`; prévia sem ponteiro: `APP_NOT_FOUND`. Em nova aba, o salto de
hoje. Modelo: `handoff.ts`; cumpre C21, C23, C26.

### As skills e a leitura

`cloudflare:workers-best-practices`, `cloudflare:wrangler`, `fastify-best-practices`.

### A ordem do trabalho

1. `headers.ts`, `pages.ts` (página de entrada e de falha), `dispatch.ts`. Regras: S17 (o cookie do
   Hub não muda), S22, S24, S48.
2. `handoff.ts`, `routes.ts`, `createPreviewHandoff`; `http.ts` `frameSrc`. Regras: S8, S10, W15.

### Como se prova

Critérios 22 a 24: `dispatcher-preview.test.ts` com o despachante de teste e o Hub por `main.ts`;
`preview-handoff.test.ts`; `http.test.ts`. Falha hoje: o cookie da prévia sem `Partitioned`.

### Parar se

O teste do iPhone dá outra resposta que a do estudo 3: a regra da nova aba muda; voltar ao fundador.

## U6 A tela Prévia

**Base e modelo.** Depois de U3, U4 e U5. Sonnet: tela sobre o modelo de `builder/source/`.

### Ler primeiro

| Arquivo e símbolo | Linhas na base | Por quê |
| --- | --- | --- |
| `apps/web/src/hub/projects/area.tsx` `ProjectArea` | 56-100 | as abas e a Prévia |
| `apps/web/src/builder/conversation/stage.tsx` `Stage` | todas | apagado |
| `apps/web/src/builder/conversation/machine-line.tsx` `VersionLine` | `1a98660` 55-80 | o cartão |
| `apps/web/src/builder/conversation/use-live.ts` `handle` | `1a98660` 55-66 | invalida `readPreview` |
| `apps/web/src/builder/source/{queries,source}.tsx` | todas | o modelo |

### A referência

| Pacote@versão ou repositório@commit, arquivo | Linhas | O que copiar e o que adaptar |
| --- | --- | --- |
| Conexus OS@`e0353c36` `lens-preview.tsx` | 68-117 | só o desenho da barra |
| Dyad@`902829f` `src/components/preview_panel/PreviewIframe.tsx` | 1676-1684 | recarregar trocando a `key` do iframe |
| vibesdk@`9da158d` `src/routes/chat/utils/handle-websocket-message.ts` | 1023-1039 | recarrega quando o envio termina |

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/preview/` | cria | a rota do Projeto |
| `apps/web/src/hub/projects/{area,search}.tsx`, `routes/…/$projectId.tsx` | muda | `routeTree.gen.ts` |
| `apps/web/src/builder/conversation/{stage,machine-line,use-live,public}` | apaga, muda | — |

### Os contratos que a unidade cria

`PreviewFrame` lê `readPreview` (`refetchInterval` 1.000 ms enquanto `pending`), `key` do iframe
`<host>#<sourceNumber>`, `title="Prévia do aplicativo"`, `sandbox="allow-scripts allow-same-origin
allow-forms"`, montado sob as abas; `device: 'desktop' | 'phone'`. `use-live.ts`: parte
`data-conexus-preview` invalida `previewQuery`. O cartão ganha **Ver aplicativo** (`sending`, abre a
Prévia) e **Alterações**; `kept` diz "A prévia continua na versão M." com `last` de `readPreview`.
Os textos da matriz, um dono: `preview/text.ts`.

### As skills e a leitura

`router-core`, `shadcn`, `playwright-cli`; `docs/reference/impeccable.md`.

### A ordem do trabalho

1. Apagar `Stage` e sua exportação; o texto vai para `preview/text.ts`.
2. `preview/`: consulta, barra, estados, entrada da U5; `area.tsx`. Regras: V19, V29 a V31, V54,
   W22, W31.
3. O cartão e `use-live.ts`.

### Como se prova

Critérios 25 a 27: `preview.test.tsx` com MSW; a parte vem de `nativeRecording('preview-extras')`
(T26). Navegador (T23). Falha hoje: `preview.test.tsx` (não há `PreviewFrame`).

### Parar se

Um estado da matriz não tem texto aprovado: usar o da matriz e listar para o fundador (o fim).

## U7 Alterações

**Base e modelo.** `main`. Sonnet: diff do git e uma tela; C59 é a única guarda sutil.

### Ler primeiro

| Arquivo e símbolo | Linhas na base | Por quê |
| --- | --- | --- |
| `apps/server/src/builder/git/source.ts` `admit`, `registerSourceRoutes` | 21-71 | as rotas irmãs e a #237 |
| `apps/server/src/builder/git/{repository,exec}.ts` | `versionAt`, a execução | o git com prazo (C57) |
| `packages/hub-api/src/source.ts` | 7-51 | os limites, um dono |

### A referência

| Pacote@versão ou repositório@commit, arquivo | Linhas | O que copiar e o que adaptar |
| --- | --- | --- |
| Mastra Factory@`6a465f9d` `mastracode/factory/src/routes/fs.ts` | 168, 690-743, 779-783, 900-920 | `--name-status -z --find-renames`, `--numstat -z` (binário `-`), `--unified=3` por arquivo |
| bolt.diy@`353b44c` `app/components/workbench/DiffView.tsx` | 2, 500 | só o desenho das linhas |

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/git/{source,changes}.ts` | cria, muda | `main.ts`, web, OpenAPI |
| `packages/hub-api/src/{source,failures,index}.ts` | muda | web |
| `apps/web/src/builder/source/` | muda | `routeTree.gen.ts` |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/source.ts, sob /api/companies/{companyId}/projects/{projectId}/source, readProjectSource
export const FileChange = z.object({ path: z.string(), previousPath: z.string().optional(),
  status: z.enum(['added', 'removed', 'renamed', 'changed']), binary: z.boolean(),
  added: z.int().nonnegative(), removed: z.int().nonnegative() })
export const readChanges   // GET /changes?to=<Commit> → {from: Commit | null, to: Commit, files: FileChange[] ≤ SOURCE_MAX_FILES}
export const readFileDiff  // GET /diff?to=<Commit>&path → {hunks: {header: string, lines: {kind: '+' | '-' | ' ', text: string}[]}[]}
// 404 SOURCE_VERSION_NOT_FOUND; 422 SOURCE_DIFF_TOO_LARGE (C48)
```

`from` é o pai de `to`. Cada lado medido com `git cat-file -s` antes de ler. `Commit` marcado (13).

### As skills e a leitura

`fastify-best-practices`, `router-core`, `shadcn`.

### A ordem do trabalho

1. #237: a admissão sai de `source.ts` para a porta de identidade; `version` de `versionAt(commit)`.
   Regras: C13, C14, C26.
2. `changes.ts` e as duas rotas. Regras: C27, C44, C57, C59, S10.
3. A aba **Alterações** com "+N", em `source/`. Regras: V30, V31.

### Como se prova

Critérios 28 a 30, git de verdade num repositório de teste. Falha hoje: `changes.test.ts` (404 da
rota) e `source.test.ts` (o caso da #237, um save entre as duas leituras).

### Parar se

`git diff` de um arquivo dentro do limite passa de 1 MiB de saída: cortar e marcar, e relatar.

## U8 Percurso e prova publicada

**Base e modelo.** Todas. Sonnet.

### Ler primeiro

| Arquivo e símbolo | Linhas na base | Por quê |
| --- | --- | --- |
| `tests/e2e/builder-builds.test.ts` | todas | o modelo do percurso |

### A referência

| Pacote@versão ou repositório@commit, arquivo | Linhas | O que copiar e o que adaptar |
| --- | --- | --- |
| `tests/e2e/builder-builds.test.ts` (`main`) | todas | dublês e o roteiro |

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `tests/e2e/builder-preview.test.ts`, `package.json` (`e2e`) | cria, muda | `npm run e2e` |
| `docs/how-to/app-preview.md`, `docs/index.md` | cria, muda | `check-docs` |

### Os contratos que a unidade cria

Nenhum.

### As skills e a leitura

`playwright-cli`.

### A ordem do trabalho

1. O roteiro com dublês, os cinco passos. 2. O como fazer. Regras: T25, L17.

### Como se prova

Critério 31: `npm run e2e` só nesse arquivo; o relatório de QA; ao vivo após o Release (L17).

### Parar se

O tempo ao vivo passa de 20 s: anotar e levar ao fundador, sem mudar o desenho.
