# Etapa 14: App do Builder

## A página do fundador

**No fim desta etapa** você pede um app ao Builder e, no fim do turno, usa esse app de verdade na
aba **Prévia**, com o banco da empresa num lugar só da prévia; a aba **Alterações** mostra o que
cada versão mudou, linha a linha.

**O roteiro de uso.** Padaria Sol, com Ana (dona) e Diego (membro); Empresa B.

1. Como **Ana**, "Encomendas" › **Conversa**: "Crie um app de encomendas com cliente, telefone,
   produto e data de entrega."    "**Versão 1 guardada**: 7 arquivos", "Preparando a prévia…" e, em uns 14 s, o app na **Prévia**.
   Ana cadastra "Maria, (11) 99999-0000, bolo de cenoura, sexta".
2. Na barra: **Computador | Celular**, **Recarregar**, o endereço, "Versão 1", **Abrir em nova
   aba**. **Celular**: moldura de 390 px.
3. "Agora guarde também o endereço." Durante o turno a Prévia segue na versão 1; depois recarrega
   sozinha na 2; a Maria segue lá (A1) ou a Prévia volta vazia (A2). **Alterações** mostra "+2", as
   linhas novas em verde, **Unificado | Lado a lado**.
4. Como **Diego**, a Prévia abre e grava. Na **Empresa B**, o endereço da prévia dá "não
   encontrado". **Abrir app** segue no app do ar.
5. No celular: o mesmo Projeto, com **App | Conversa** embaixo.

**O que você faz, e quando.** No começo: aprova esta página e responde A e B. Em B1, antes da U1, abre no iPhone um link e diz o que viu. No fim: usa a etapa. Firstmate faz o roteiro e testa as telas.

**Respondidas.** P1 A: a versão de verdade, montada na máquina e enviada pelo caminho da etapa 9 a
um endereço de prévia (o D, 6 s, fica para depois). P2 A: um esquema "prévia" no banco
da empresa. P3 A: o Builder confere e tenta de novo até 3 vezes (4 conferências); se falhar, a Prévia
segue na última boa e aparece **Pedir ao Builder para corrigir**.
P4 A: o desenho do Conexus OS (barra, abas, "+N", cartão da versão). P3 e P4: "3. A 03 e 04 A
okay da 14", 2026-10-21.

**Os limites.** A Prévia aparece uns 14 s depois de "Versão guardada" (laboratório, fora do Hub:
13,4 a 14,2 s); a meta é 20 s, medida na publicação (32). Guardamos a do ar, a da
prévia e mais 3. Alterações: até 1.000 arquivos e 1 MiB por arquivo.

**Fica de fora.** O D; a tela mudando enquanto o Builder escreve; erros de clique voltando ao
Builder; publicar (17); mudar tabelas com dados (15); **Versões** do Builder (17). Nenhuma
issue `next-card` toca estas pastas.

**Abertas, só estas duas.**

- **A. Dados da prévia numa versão nova.** A1: ficam; a Maria continua na versão 2. A2: a prévia
  volta vazia a cada versão. *Padaria Sol:* em A1, Ana testa sem recadastrar; em A2, recadastra a
  cada pedido, mas nunca vê dado velho num esquema novo. **Recomendo A1.**
- **B. Chamadas reais da prova (U1).** Já provado: montar na máquina, subir e apagar scripts, o tempo. Falta: o iframe em Chrome, Firefox e Safari do iPhone, o certificado do host
  `--previa`, 50 scripts podados, o Neon dormindo, o conserto com o Claude real. B1: autoriza tudo
  isso, na Cloudflare e E2B das etapas 8, 9 e 13 (`cx-prova-e14-`, apagados no fim), num Neon de
  prova e numa conta Claude (qual projeto e qual conta: escreva aqui). B2: só o iframe em Chrome e
  Firefox e o certificado; o resto vira medida na publicação. *Padaria Sol:* em B1, o Safari que
  recusaria a Prévia aparece antes; em B2, só na publicação. **Recomendo B1**: centavos.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills, do mapa | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | Registro 0054, prova | `docs/` | testes | mastra, cloudflare:wrangler, cloudflare:workers-best-practices | 13 e 12.3 fechadas |
| U2 | O ambiente prévia | `hub/apps/`, `hub/projects/`, `hub-api/`, `platform/company-postgres.ts`, migrações, `edge/src/hub.ts` | dados | drizzle, neon:neon-postgres | U1 |
| U3 | Montar e voltar ao Builder | `infra/e2b/`, `scripts/app-pack.ts`, `builder/machine/`, `builder/conversation/` | segurança | mastra | U1 |
| U4 | O envio da prévia no fim do turno | `hub/apps/`, `builder/runs/`, `builder/conversation/parts.ts`, `hub-api/` | dados | mastra, fastify-best-practices | U2, U3 |
| U5 | A prévia dentro do Hub | `apps/edge/src/`, `platform/http.ts`, `hub/apps/{handoff,routes}.ts`, `hub-api/src/apps.ts` | segurança | cloudflare:workers-best-practices, cloudflare:wrangler | U2 |
| U6 | A tela Prévia | `apps/web/src/builder/preview/`, `hub/projects/area.tsx`, `builder/conversation/` (web) | web | router-core, shadcn, playwright-cli | U4, U5 |
| U7 | Alterações | `builder/git/`, `hub-api/src/source.ts`, `apps/web/src/builder/source/` | web | fastify-best-practices, router-core, shadcn | U1 |
| U8 | A skill completa do contrato do app | `packages/app-contract/`, `builder/conversation/builder.eval.test.ts` | dados | mastra | U3 |
| U9 | Percurso e prova | `tests/e2e/`, `docs/how-to/` | testes | playwright-cli | todas |

Em toda unidade, `typescript-magician` e `node`. Nenhum pacote novo.

**Frentes** ("Tudo A", 12.3): frente 1, servidor da prévia, U2, U5 e, após a U3, U4
(`hub/apps/`, `apps/edge/`);
frente 2, máquina e Builder, U3 e U8 (`infra/e2b/`, `builder/machine/`, `packages/app-contract/`);
frente 3, Alterações, U7 (`builder/git/`, `apps/web/src/builder/source/`). Dividem só
`hub-api/src/{failures,index}.ts`, de quem criar o contrato primeiro; a segunda faz o merge. U6 depois de U4 e U5; U9 por último; U2 em PR próprio (D11). QA (T25) antes das revisões (L9).

**Código alterado** (sem testes nem gerados): U2 310; U3 340; U4 400; U5 200; U6 560; U7 730; U8 330;
U9 60. Total **2.930**, teto 4.000 (L2).

## O que é nativo e o que é nosso

`@mastra/core` 1.78.0 (`dist/`); `@mastra/e2b` 0.14.1 e `e2b` 2.56.0 (13); fork `ce7e9c30c1`; Conexus
OS `e0353c36`; vibesdk `9da158d8`, só comparação (prévia por Dynamic Workers, `docs/setup.md:7`). Sem
Context7: APIs lidas no `dist/` instalado; a U3 relê `@mastra/e2b` na versão da 13.

| Mecanismo | Nativo | Nosso, e por quê |
| --- | --- | --- |
| Conferir e voltar | `processOutputStep`, `abort(motivo, {retry: true})`, `retryCount` (`processors/index.d.ts:543,739`); `maxProcessorRetries` (`agent/agent.types.d.ts:603-606`) | o comando, o erro curto |
| Rodar e montar | `sandbox.executeCommand` (13 U4); `wrangler deploy --dry-run --minify --outdir` (`scripts/app-pack.ts:31-52`) | um dono, `infra/e2b/pack.ts` (C26) |
| Subir e servir | `cloudflare.upload`, `DISPATCHER.get` (`send.ts:57-71`, `dispatch.ts:117-150`) | o ambiente |
| Entrada no iframe | CHIPS, `Partitioned` (Chromium 131); `postMessage` com `targetOrigin` | o salto por `/apps/open` não serve: `access.ts:95-96` recusa `iframe` (S48) e o cookie `Lax` não vai a outro site |
| Diferenças | Factory `git diff --name-status -z --find-renames`, `--numstat` (fork `mastracode/factory/src/routes/fs.ts:143-152,695-735`) | no servidor (0029) |
| Barra e abas | Conexus OS `lens-preview.tsx:68-117`, `lens-diff.tsx:12-33,167-181` | só o desenho |

## O fluxo do fim do turno

O processador confere (`pack`) no último passo; falha volta ao Builder (18). A 13 guarda; `previewing`;
o servidor monta de novo na árvore guardada (19); `sendVersion` com `environment: 'preview'` e chave
`<runId>.<tentativa>` sobe o Worker e migra o esquema (20); o ponteiro só sobe (21); `saved` só
depois de apontar. Hub reiniciado: `resumeRuns` refaz a partir de montar (22).

## Os critérios de aceite

Pelas rotas e `main.ts`, com `Machines` dublê (`LocalSandbox`), Cloudflare dublê e modelo roteirizado.
**Ao vivo**: o não verificado dos estudos, anotado no registro; nenhum teste da suíte chama serviço
de fora (T14). Em B1 valem 2 a 7; em B2, 2 e 3, e 4, 6 e 7 passam ao 32 (L17). Must, salvo "should".

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova |
| --- | --- | --- | --- |
| 1 | U1 | 0054 "proposed" antes do código, com os critérios de B; o já provado, citado, não refeito | o registro |
| 2 | U1 | **Ao vivo**: Worker `cx-prova-e14-` no despachante em `…--previa`, num iframe do Hub: a entrada da U5 (mensagem, passagem, cookie particionado) vale e o app grava, em Chrome, Firefox e Safari do iPhone (B2: sem o Safari, que vai ao 32); fora do iframe, sem passagem: a página de sessão | 0054 |
| 3 | U1 | **Ao vivo**: o host `<nome>--<apelido>--previa` responde em HTTPS com o certificado de hoje do domínio dos apps (0041, critério 5) | 0054 |
| 4 | U1 | **Ao vivo**, B1: 50 scripts no namespace, podados: a contagem volta, cada GET dá 404 após a propagação, anotada | 0054 |
| 5 | U1 | Sem chamada nova, registra o estudo: `pack` na máquina monta (Node 22, 4 de 4; a 13 traz o 24); do fim do turno à Prévia, 13,4 a 14,2 s fora do Hub; a meta de 20 s no Hub (should) vai ao 32 | 0054 |
| 6 | U1 | **Ao vivo**, B1: o `abort` com `retry` reabre o laço no `AgentController` (13) com o Claude real; B2: no 32 | 0054 |
| 7 | U1 | **Ao vivo**, B1: primeira consulta com o Neon dormindo, anotada; B2: no 32 | 0054 |
| 8 | U2 | `previewHostOf` dá `<rótulo>--previa`; rótulo antigo de 56 a 63: `PREVIEW_NO_ADDRESS`; `HostLabel` recusa 3 partes, `PreviewHostLabel` só o sufixo | `address.test.ts` |
| 9 | U2 | Esquema e logins `app_<id>_previa*`; o login de rodar da prévia lê o esquema do ar: 42501 | `company-postgres.test.ts` |
| 10 | U2 | Apagar o Projeto: os dois esquemas, os logins, os scripts; falha isolada (12) | `removal.test.ts` |
| 11 | U2 | A poda mantém o ar, a prévia e as 3 `ready` mais novas (`KEPT_OLD_VERSIONS`); `listAppVersions` só `origin = 'sent'` | `prune.test.ts`, `versions.test.ts` |
| 12 | U4 | Mesma chave duas vezes: uma versão (`REPLAY`); o ponteiro só sobe; o do ar não muda | `preview-send.test.ts` |
| 13 | U4 | Prévia e envio manual juntos: cada um no seu ponteiro | idem |
| 14 | U4 | `readPreview` (`MEMBER`): `none`, `pending`, `ready`, `failed` e a última boa; alheio 404 (S10) | `preview.test.ts` |
| 15 | U5 | Host da prévia: cookies `Partitioned`; `frame-ancestors <origem do Hub>`; sem sessão, num iframe: a entrada (só o hash), falha na segunda seguida; em nova aba: o salto de hoje; host do ar igual | `dispatcher-preview.test.ts` |
| 16 | U5 | `createPreviewHandoff`: membro recebe a passagem; outra empresa: 404 (S10); `Origin` alheio: `REQUEST_ORIGIN_REFUSED`; passagem repetida ou de outro navegador: `APP_HANDOFF_INVALID`; sessão de um ambiente não abre o outro | idem, `handoff-route.test.ts` |
| 17 | U5 | Hub: `frame-src https://*.<domínio dos apps>`, o resto igual | `http.test.ts` |
| 18 | U3 | O modelo escreve um app que não monta: o erro volta, ele conserta, a versão monta; 4 conferências falham (a primeira e 3 retentativas): sem `abort`, o turno guarda o código e termina `saved` com `PREVIEW_PACK_FAILED`; `readPreview`: `failed`, com a última boa | `pack.test.ts`, `preview.test.ts` |
| 19 | U3 | Pasta acima de `APP_LIMITS`, com link, não regular ou fora do `Manifest`: `PREVIEW_PACK_FAILED`, sem ler o resto (C59, S2) | idem |
| 20 | U4 | Cloudflare recusa (10021): `failed`, `APP_VERSION_NOT_STARTING`, a última boa fica | `preview-send.test.ts` |
| 21 | U4 | A 3 termina antes da 2: o ponteiro fica na 3 | idem |
| 22 | U4 | Hub morre em `previewing`: o outro processo refaz, uma versão | `runs-preview.test.ts` |
| 23 | U6 | Estados da matriz; a Prévia segue na última boa no turno; recarrega na parte `preview` | `preview.test.tsx` |
| 24 | U6 | Barra: nomes e teclado (V30, V31); Celular, 390 px; **Abrir em nova aba** com a sessão; **Pedir ao Builder para corrigir** põe código e versão no campo | idem |
| 25 | U6 | 1280, 390 px, 200 %, dois temas, CSP limpo; trocar de aba não recarrega | navegador (T23) |
| 26 | U7 | `readChanges`: novo, removido, renomeado, binário, `+N`; acima de 1.000: `SOURCE_CHANGES_TOO_MANY`; de 1 MiB: `SOURCE_DIFF_TOO_LARGE`, sem ler (C44, C59); commit fora do `main`: `SOURCE_VERSION_NOT_FOUND`; alheio: 404 | `changes.test.ts` |
| 27 | U7 | Unificado, Lado a lado; linhas sem alteração recolhidas | `changes.test.tsx` |
| 28 | U8 | `validateSkillContent` passa; cobre upsert, pai com filhos, `timestamptz`, erro do banco, limites, CSP, `pack`, migração aplicada | `instructions.test.ts` |
| 29 | U8 | Portão de montagem no CI, ferramentas falsas: o app gerado monta e o `Manifest` passa; o T14 inteiro é o 32 | `builder.eval.test.ts` |
| 30 | U9 | Roteiro, dublês | `tests/e2e/builder-preview.test.ts` |
| 31 | U9 | O relatório de QA no commit candidato (T25) | `conexus-qa` |
| 32 | U9 | **Ao vivo**, publicado: o roteiro; Prévia aberta com a máquina apagada; tempo até a Prévia no Hub, 20 s (should); em B2, também 4, 6, 7 e o Safari | firstmate, fundador (L17) |
| 33 | U2 | **A1**: o registro da prévia continua depois da versão seguinte; migração aplicada não muda (`APP_MIGRATION_CHANGED`, 0046). **A2**: a versão seguinte recria o esquema da prévia vazio, numa transação, repetível; o do ar não muda | `company-postgres.test.ts`, `preview-send.test.ts` |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Prévia | "Ainda não há uma prévia. Descreva o aplicativo para começar." | idem | "Preparando a prévia…", sobre a última boa | "A versão N não montou." e, com `last`, "A prévia continua na versão M."; **Pedir ao Builder para corrigir** | a do Projeto | a do Projeto | sessão vencida: a entrada da U5, sem aviso |
| Alterações | "Nenhuma versão guardada ainda." | "Esta versão não mudou arquivos." | a partilhada | a de `ui/` | "Esta versão não está mais guardada." | a do Projeto | "Esta diferença é grande demais para mostrar aqui." |
| Cartão da versão | — | — | — | o da 13 | — | — | — |
| App \| Conversa (390) | Conversa | — | ponto "trabalhando" | — | — | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `apps.app.preview_*` (4 colunas) | U4 | U4, U5 (`checkCall`), U2 (poda, remoção) |
| `apps.app_version.origin`, `source_number` | U4 | U2 (lista, poda), U4 (ponteiro, `readPreview`) |
| `builder.run` `previewing`, `preview_attempt`, `preview_failure` | U4 | U4 (retomada), `readPreview` |
| parte `preview {state, sourceNumber, code?}` | U4 | U6 |
| `readPreview`, `createPreviewHandoff`, `readChanges`, `readFileDiff` | U4, U5, U7 | U6, U7 |

**Os desenhos** (capturas `os-34`, `os-35`, `os-37`, `os-63`, `os-64`, fora do repositório, L21):

```text
1280 ┌ Padaria Sol / Encomendas ▾ ─ Prévia · Código · Alterações +2 · Projeto ─ Versão ▾  Abrir app ┐
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

| Gravação ou comando | Duas vezes | Recusada no meio | Dependência fora | Imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `pack` no processador | um por passo | o Builder lê o erro | a da 13 | — | 18 |
| `npm ci`, `pack` e leitura após guardar | um por tentativa | `PREVIEW_PACK_FAILED` | idem | `PREVIEW_PACKED` | 19, 22 |
| `app_version` de prévia | chave única, `REPLAY` | reivindicação, C65 | 503 | `APP_VERSION_RECEIVED` | 12, 13 |
| Upload do script | mesmo nome por versão | `abandon` apaga | Cloudflare: `failed` | `APP_VERSION_UPLOADED` | 20 |
| Esquema e logins da prévia | `IF NOT EXISTS` | uma transação | Neon: `failed` | `APP_DATABASE_READY` | 9, 33 |
| Migrações na prévia | razão 0046 | tudo ou nada | idem | `APP_MIGRATED` | 9, 20 |
| `preview_version_id` | `UPDATE … WHERE source_number <` | relido | — | `PREVIEW_VERSION_READY` | 21 |
| `builder.run` `previewing`, `preview_attempt`, `preview_failure` | posse da 13 | retomada, tentativa + 1; falha: termina `saved` com `preview_failure` | — | `RUN_SETTLED` | 18, 19, 22 |
| Remover esquema, logins e scripts da prévia | idempotente | pendente da 12 | pendente | `PROJECT_APP_DELETED` | 10 |
| Passagem e sessão no host da prévia | `DELETE … RETURNING` (S22) | — | Hub: a página | — | 16 |
| Poda dos scripts | idempotente | o próximo | pendente | `APP_VERSION_PRUNED` | 4, 11 |
| `git diff` | só leitura | prazo e sinal (C57) | — | — | 26 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base | Nativo / referência |
| --- | --- | --- | --- | --- | --- |
| Hospedagem e sessão | nova | `apps/edge/src/`, `hub/apps/` | — | host por ambiente (0024); passagem curta (OS `preview-session.ts:50-69`) | WfP, S22 |
| Conferir e voltar | nova | `builder/conversation/processors.ts` | — | até 3 tentativas (OS `builder.md:54`) | `processOutputStep` |
| Montagem | nova, de `scripts/app-pack.ts` do `main` | `infra/e2b/pack.ts` | um dono para os dois | — | `wrangler` |
| Barra, estados, cartão | nova, desenho trazido | `apps/web/src/builder/preview/` | textos | `lens-preview.tsx:62,68-117`, `os-34` | Mastra não tem |
| Alterações | nova, desenho trazido | `apps/web/src/builder/source/`, `builder/git/` | — | `lens-diff.tsx:12-33` | Factory `WorkspaceDiffLines.tsx`, `fs.ts` |
| Skill | nova, de `builder-skills/conexus-server` (OS) | `packages/app-contract/` | contrato 1 | censo §5, §8, §10 | `createSkill` |

Nenhum código trazido.

**A dívida.** As colunas `preview_*` viram uma linha por ambiente na 17 (D6).

## U1 Registro e prova

**Raio.** `docs/decisions/0054-preview-environment.md`, `docs/{index,architecture,roadmap}.md`, `docs/decisions/0020-*.md`: cria, muda; chama: `check-docs`.

**Contratos.** 0054: critérios 2 a 7 (conforme B), provados antes do merge; o que o estudo provou, citado com o resultado e o lugar, sem refazer; o D, futuro. Arquitetura §3: "store an app
version" ganha o ambiente; a sessão de Prévia (`:188-190`), a do host da prévia. 0020: "o
verificador checa antes da Prévia" vira "a Cloudflare recusa o que não inicia (0046)". Roteiro: P1 a P4. Regras: L21, T14, S40.

## U2 O ambiente prévia

**Raio.** `packages/hub-api/src/{address,app-login}.ts`: muda; chama: Hub, web, despachante.
`apps/server/src/hub/apps/{tables,prune,removal,repair,versions,app-database}.ts`,
`apps/server/src/hub/projects/{projects,hosts,public}.ts`, `apps/edge/src/hub.ts`, `apps/server/src/platform/company-postgres.ts`,
`apps/server/migrations/`, `apps/server/database-grants.sql`, `apps/server/src/platform/catalog.test.ts`:
muda; chama: `send.ts`, `main.ts`.

**Contratos.** `AppEnvironment = 'live' | 'preview'` em `address.ts`, o dono (C26). `PreviewHostLabel`
marcado, `<HostLabel>--previa`; `hostLabelOf` reserva 8 para o sufixo; a migração acrescenta
`project_host_label_preview_room`, até 55, `NOT VALID` (D6, D7): rótulo de 56 a 63 fica sem prévia. `appHostLabelOf(hostname): {label: HostLabel, environment} | undefined`, o único que
lê um host. `appLogin(projectId, environment)`: prévia `app_<id>_previa`, `_previa_run`,
`_previa_migrate`. `apps.app` ganha `preview_version_id`, `preview_sending_version_id`,
`preview_claimed_until`, `preview_database_ready` (FK composta e check como os do ar);
`app_version` ganha `origin text check in ('sent','builder')` padrão `'sent'` e
`source_number integer > 0`, nulo só em `sent`. Colunas em tabelas com grants: `database-grants.sql` não muda, só o retrato do catálogo (D11). `ENVIRONMENT_COLUMNS:
Record<AppEnvironment, …>`, o dono do nome das colunas. Modelo: `send.ts`. Regras: D6, D11, D12, D15, 0039.

**Prova.** 8 a 11, 33 e o catálogo.

## U3 Montar na máquina e voltar ao Builder

**Raio.** `infra/e2b/{pack.ts,template.ts}`, `scripts/app-pack.ts`: cria, muda; chama: firstmate
(template), `npm run app-pack`. `apps/server/src/builder/machine/`: muda; chama: U4, processador.
`apps/server/src/builder/conversation/{processors,builder}.ts`: cria, muda; chama: `main.ts`.

**Contratos.** `packVersion({source, out}): Packed | PackRefused`, de `pack.ts`, gravado no
template em `/opt/conexus/pack.mjs`, fora da árvore do app; `npm ci` só sem `node_modules`.
`PackRefused = {code: 'BUNDLE_FAILED' | 'MANIFEST_INVALID' | 'TOO_MANY_FILES' | 'TOO_LARGE' | 'NOT_REGULAR', tail:
string}` (`tail`: 20 linhas, 4 KiB, com o filtro de segredos da 13). `Machines.pack({projectId}):
Result<VersionFolder, PackRefused>`; a saída passa por um esquema Zod `PackOutput` (C27)
e a pasta por `receiveVersion`; só arquivos regulares (S2). `buildCheck: Processor`, `processOutputStep`: só sem
`toolCalls` e com arquivos mudados; falha → `abort(<código e tail>, {retry: true})`; no
`retryCount` 3, deixa terminar: 4 conferências no máximo. `Agent({maxProcessorRetries: 3})`. Modelo: `model-accounts/processors.ts` da 12.

**Ordem.** Regras: C50, C56, C57, C59, C75, S14. Ler inteira `dist/docs/references/docs-agents-processors.md`; S2.
**Prova.** 18, 19.

## U4 O envio da prévia

**Raio.** `apps/server/src/hub/apps/{send,public,versions,preview,routes}.ts`, `apps/server/src/builder/runs/`,
`apps/server/src/builder/conversation/parts.ts`, `packages/hub-api/src/{apps,conversations,failures,index}.ts`:
cria, muda; chama: `main.ts`, web, OpenAPI. Modelo: `send.ts`.

**Contratos.** `sendVersion(deps, {…, environment, origin})`: o ar exige `manageAppVersions`; a
prévia, a admissão do `admitRun` relida (S8). `sendPreviewVersion({companyId, projectId,
personId, runId, attempt, sourceSha, sourceNumber, folder}): Result<AppVersion, VersionFailure>` em
`public.ts`. Ponteiro: `UPDATE … WHERE` o `source_number` atual é
menor ou nulo. `builder.run.state` ganha `previewing` e termina em `saved` (o código guardado), com `preview_failure`
quando a montagem ou o envio falha: uma versão que não montou nunca é a da prévia nem do ar;
`preview_attempt integer`, `preview_failure`
com check pela lista de `VersionFailure` mais `PREVIEW_PACK_FAILED` (C21). `readPreview` `GET …/projects/{projectId}/preview`, `MEMBER`: `{state: 'none'} | {state:
'pending', sourceNumber, last?} | {state: 'ready', host, sourceNumber, savedAt} | {state: 'failed',
sourceNumber, code, last?}`, `last` = o `ready`. `PREVIEW_PACK_FAILED`, `PREVIEW_VERSION_READY` (C48).

**Ordem.** Regras: C21, C48, C62, C65, D22, D27, S8, S10. **Prova.** 12 a 14, 20 a 22, 33.

## U5 A prévia dentro do Hub

**Raio.** `apps/edge/src/{dispatch,headers,pages}.ts`: muda; chama: publicar a borda.
`apps/server/src/hub/apps/{handoff,routes}.ts`, `apps/server/src/platform/http.ts`,
`packages/hub-api/src/{apps,failures,index}.ts`: cria, muda; chama: web, toda resposta.

**Contratos.** O despachante lê o host por `appHostLabelOf`. Na prévia: `setCookie(name, value,
environment)` dá `SameSite=None; Secure; Partitioned; HttpOnly`; `withSecurityHeaders` troca só
`frame-ancestors` pela origem do Hub. Num iframe (`Sec-Fetch-Dest: iframe`) sem sessão ou com
`APP_SESSION_INVALID`, nunca o salto: a página de entrada `/__conexus/preview` põe o cookie de
vínculo e leva o hash dele num `data-`; `/__conexus/preview.js` o manda por `postMessage`, alvo a
origem do Hub. Uma segunda entrada seguida (marca no `redeem`) dá a página de falha. A tela confere
`event.origin` e `event.source` e chama `createPreviewHandoff` `POST
…/projects/{projectId}/preview/handoff` `{binding}`, `session`, `MEMBER`: o `createHandoff` de hoje,
com o host tirado do `projectId` (S9) → `{location}`, posto no iframe; o `redeem` é o de hoje. Em nova aba, o salto de hoje. `OnHost`, `AppOpenQuery` levam `AppHostLabel = HostLabel | PreviewHostLabel`. `callTo` lê o
ponteiro e o login do ambiente; prévia sem versão: `APP_NOT_FOUND`. Helmet: `frameSrc`. Modelo: `handoff.ts`.

**Ordem.** Regras: S10, S17 (não muda: é o cookie do Hub), S22, S24, S48, W15. **Prova.** 15 a 17.

## U6 A tela Prévia

**Raio.** `apps/web/src/builder/preview/`: cria; `apps/web/src/hub/projects/area.tsx`,
`apps/web/src/builder/conversation/{builder-turn,stage}.tsx`: muda; chama: `routeTree.gen.ts`.

**Contratos.** `PreviewFrame` lê `readPreview` e faz a entrada da U5; `iframe` `title="Prévia do aplicativo"`, `sandbox="allow-scripts
allow-same-origin allow-forms"`, montado sob as abas. Modelo: `builder/source/` da 13. `device: 'desktop' | 'phone'`. O cartão da
versão ganha **Ver aplicativo** e **Alterações**. Regras: V19, V54, W22, W31, V29 a V31.

**Prova.** 23 a 25.

## U7 Alterações

**Raio.** `apps/server/src/builder/git/{routes,changes}.ts`, `packages/hub-api/src/{source,failures,index}.ts`: cria,
muda; chama: web, OpenAPI. `apps/web/src/builder/source/`: muda; chama: `routeTree.gen.ts`.

**Contratos.** Sob `/api/companies/{companyId}/projects/{projectId}/source`, `MEMBER`: `readChanges`
`GET /changes?to` → `{from, to, files: [{path, previousPath?, status: 'added' | 'removed' |
'renamed' | 'changed', binary, added, removed}]}` até 1.000; `from` é o pai de `to`.
`readFileDiff` `GET /diff?to&path` → `{hunks}`, até 1 MiB (`--numstat` antes), esquema Zod (C27); 404
`SOURCE_VERSION_NOT_FOUND`, 422 `SOURCE_CHANGES_TOO_MANY`, `SOURCE_DIFF_TOO_LARGE` (C48). `Sha` marcado (13 U2). Regras: C27, C44, C57, C59, S10.

**Prova.** 26, 27.

## U8 A skill completa

**Raio.** `packages/app-contract/src/skill/`: cria; chama: Builder (13 U6). `builder.eval.test.ts`: muda; chama: CI.

**Contratos.** O texto ensina o que o 28 lista: upsert numa instrução (`INSERT … ON CONFLICT … DO
UPDATE … RETURNING`) e pai com filhos por ids do handler, num `db.batch`; `timestamptz` como texto
ISO, provado por um teste do `db`; CSP do app (`headers.ts:11`). Regras: D28. **Prova.** 28, 29.

## U9 Percurso e prova publicada

**Raio.** `tests/e2e/builder-preview.test.ts`, `package.json`, `docs/how-to/app-preview.md`, `docs/index.md`: cria; chama: `npm run e2e`.

**Prova.** 30 e 31 no commit candidato; 32 após o Release (L17).
