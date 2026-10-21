# Etapa 14: App do Builder

## A página do fundador

**No fim desta etapa** você pede um app ao Builder e, no fim do turno, usa esse app de verdade na
aba **Prévia**, com o banco da empresa num lugar só da prévia; a aba **Alterações** mostra o que
cada versão mudou, linha a linha.

**O roteiro de uso.** Padaria Sol, com Ana (dona) e Diego (membro); Empresa B.

1. Como **Ana**, "Encomendas" › **Conversa**: "Crie um app de encomendas com cliente, telefone,
   produto e data de entrega." O turno da 13; antes de acabar, o Builder confere se o app monta.
   "**Versão 1 guardada**: 7 arquivos", "Preparando a prévia…" e, em até 20 s, o app na **Prévia**.
   Ana cadastra "Maria, (11) 99999-0000, bolo de cenoura, sexta".
2. Na barra: **Computador | Celular**, **Recarregar**, o endereço, "Versão 1", **Abrir em nova
   aba**. Em **Celular**, o app numa moldura de 390 px.
3. "Agora guarde também o endereço." Durante o turno a Prévia segue na versão 1; depois recarrega
   sozinha na 2, com a Maria lá. **Alterações** mostra "+2", as linhas novas em verde, **Unificado |
   Lado a lado**.
4. Como **Diego**, a Prévia abre e grava. Na **Empresa B**, o endereço da prévia da Padaria dá "não
   encontrado". **Abrir app** segue no app que estava no ar: a prévia não o toca.
5. No celular: o mesmo Projeto, com **App | Conversa** embaixo.

**O que você faz, e quando.** Antes da U1: autoriza as chamadas reais da prova (Cloudflare e E2B,
nomes `cx-prova-e14-`) e abre no seu iPhone um link de prova que firstmate manda, dizendo o que viu
(1 minuto). No começo: aprova esta página e responde P3 e P4. No fim: usa a etapa. Por você,
firstmate faz o roteiro, testa as telas caçando defeitos e confere os textos.

**As suas respostas.** P1 A: a versão de verdade, montada na máquina no fim do turno e enviada
pelo caminho da etapa 9 a um endereço de prévia; o D (6 s em vez de 14) fica para depois. P2 A: um
esquema "prévia" no banco da empresa, sem cópia do app no ar.

**Os limites.** A Prévia aparece em até 20 s depois de "Versão guardada" (medido: 14 s). O Builder
tenta consertar uma montagem que falha até 3 vezes. Guardamos a versão no ar, a da prévia e mais 3.
Alterações mostra até 2.000 arquivos e 1 MiB de diferença por arquivo.

**Fica de fora.** O D; a tela mudando enquanto o Builder escreve, que mostra outro programa, sem
o banco; erros de clique voltando ao Builder (P3 C); publicar (17); mudar tabelas com dados (15);
**Versões** sem as versões do Builder até a 17. Das issues `next-card`, nenhuma toca estas pastas;
a #153 espera as decisões dela.

**As decisões suas pedidas nesta etapa.** Uma palavra cada.

- **P3. Montagem que falha.** A: o Builder confere antes de terminar e tenta de novo até 3 vezes;
  se ainda falhar, a versão fica guardada, a Prévia segue na última boa e aparece **Pedir ao Builder
  para corrigir**. B: só o aviso e o botão. *Padaria Sol:* em A, Ana quase nunca vê "A versão 3 não
  montou". **Recomendo A.**
- **P4. A barra e as abas.** A: o desenho do Conexus OS (a barra do passo 2, a Prévia montada sob as
  outras abas, Alterações com "+N" e "Arquivo novo / Removido / Renomeado", o cartão "Versão 2 ·
  Ver aplicativo · 2 arquivos · Alterações"). B: barra mínima, só Recarregar e Abrir, diferença só
  unificada. **Recomendo A**: é a tela que você pediu de volta.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills, do mapa | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | Registro 0054, prova ao vivo | `docs/` | testes | mastra, cloudflare:wrangler, cloudflare:workers-best-practices | 13 e 12.3 fechadas |
| U2 | O ambiente prévia | `hub/apps/`, `hub/projects/`, `hub-api/`, `platform/company-postgres.ts`, migrações | dados | drizzle, neon:neon-postgres | U1 |
| U3 | Montar na máquina e voltar ao Builder | `infra/e2b/`, `scripts/app-pack.ts`, `builder/machine/`, `builder/conversation/` | segurança | mastra | U1 |
| U4 | O envio da prévia no fim do turno | `hub/apps/`, `builder/runs/`, `builder/conversation/parts.ts`, `hub-api/` | dados | mastra, fastify-best-practices | U2, U3 |
| U5 | A prévia dentro do Hub | `apps/edge/src/`, `platform/http.ts`, `hub/apps/handoff.ts` | segurança | cloudflare:workers-best-practices, cloudflare:wrangler | U2 |
| U6 | A tela Prévia | `apps/web/src/builder/preview/`, `hub/projects/area.tsx`, `builder/conversation/` (web) | web | router-core, shadcn, playwright-cli | U4, U5 |
| U7 | Alterações | `builder/git/`, `hub-api/src/source.ts`, `apps/web/src/builder/source/` | web | fastify-best-practices, router-core, shadcn | U1 |
| U8 | A skill completa do contrato do app | `packages/app-contract/`, `builder/conversation/builder.eval.test.ts` | dados | mastra | U3 |
| U9 | Percurso e prova publicada | `tests/e2e/`, `docs/how-to/` | testes | playwright-cli | todas |

Em toda unidade, `typescript-magician` e `node`; uma linha do mapa vale sob a sua pasta. Nenhum
pacote novo (o `e2b` e o `@mastra/e2b` vêm da 13).

**Frentes** ("Tudo A", 12.3): frente 1, servidor da prévia, U2, U4, U5 (`hub/apps/`, `apps/edge/`);
frente 2, máquina e Builder, U3 e U8 (`infra/e2b/`, `builder/machine/`, `packages/app-contract/`);
frente 3, Alterações, U7 (`builder/git/`, `apps/web/src/builder/source/`). Dividem só
`packages/hub-api/src/{failures,index}.ts` (1 e 3) e `builder/conversation/` (U3 em
`processors.ts`, U4 em `parts.ts`); a que chegar em segundo faz o merge. U6 depois de U4 e U5; U9
por último; U2 em PR próprio (D11). O QA (T25) antes das revisões (L9).

**Orçamento de código alterado** (sem testes nem gerados): U2 310 (endereço 40, colunas e
migração 40, logins por ambiente 45, porta e sessão 70, poda 25, remoção e reparo 60, lista 30);
U3 340 (`pack.ts` 130, template 20, processador 90, montar e ler após guardar 100); U4 400 (envio
por ambiente 130, porta 40, `previewing` e retomada 120, parte e rota 110); U5 110; U6 560; U7 730
(rotas 220, contrato 60, tela 450); U8 330 (texto 250, portão 80); U9 60. Total **2.840**, teto
4.000 (L2).

## O que é nativo e o que é nosso

`@mastra/core` 1.78.0 (`dist/`); `@mastra/e2b` 0.14.1 e `e2b` 2.56.0 entram com a 13; fork
`ce7e9c30c1`; Conexus OS `e0353c36`; vibesdk `9da158d8`. Sem Context7 nesta sessão: as APIs foram
lidas no `dist/` instalado; a U3 relê `@mastra/e2b` na versão da 13.

| Mecanismo | Nativo | Nosso, e por quê |
| --- | --- | --- |
| Conferir e voltar ao Builder | `Processor.processOutputStep` com `abort(motivo, {retry: true})`, `retryCount` (`processors/index.d.ts:543,739`); `maxProcessorRetries` (`agent/agent.types.d.ts:603-606`); a repetição põe o motivo no fim da conversa (`docs/references/docs-agents-processors.md:910-945`) | o comando e a frase curta do erro |
| Rodar na máquina | `sandbox.executeCommand`, a leitura do `WorkspaceFilesystem` (13 U4) | o `pack` fixo, fora da árvore do app |
| Montar | `wrangler deploy --dry-run --minify --outdir` (`scripts/app-pack.ts:31-52`) | um dono, `infra/e2b/pack.ts` (C26) |
| Subir e servir | `cloudflare.upload`, `DISPATCHER.get` (`send.ts:57-71`, `dispatch.ts:117-150`) | o ambiente; as "version preview URLs" da Cloudflare não existem para Workers do WfP (estudo §6) |
| Cookie no iframe | CHIPS, `Partitioned` (provado no Chromium 131) | só no host da prévia |
| Diferenças | Mastra Factory: `git diff --name-status -z --find-renames`, `--numstat`, saída limitada (fork `mastracode/factory/src/routes/fs.ts:143-152,695-735`) | entre dois commits do `main` no servidor (0029), sem máquina |
| Barra e abas | Conexus OS `lens-preview.tsx:68-117`, `lens-diff.tsx:12-33,167-181`, `construir.tsx:37-45,281,287-290,399-417` | só o desenho |
| D, depois | vibesdk: Worker Loader por versão (`space/src/space/durable-object.ts:745-760`) | não construído (P1) |

## O fluxo do fim do turno

| Fase | Mecanismo | O que Ana vê | Falha, e o que ela vê |
| --- | --- | --- | --- |
| Conferir | processador no último passo de um turno que mudou arquivos: `pack` na máquina | — | saída ≠ 0: o erro volta ao Builder, até 3 vezes (18) |
| Guardar | 13: `collect`, `update-ref`; o estado vai a `previewing`, e a `saved` só depois de Apontar | "Versão 2 guardada: 2 arquivos mudados" | a da 13 |
| Montar | **nosso**: `pack` de novo na árvore guardada, a pasta lida de volta | "Preparando a prévia…" | `PREVIEW_PACK_FAILED`: "A versão 2 não montou. A prévia continua na versão 1." (19) |
| Enviar | `sendVersion` com `environment: 'preview'`, chave `<runId>.<tentativa>` | — | `APP_VERSION_NOT_STARTING` ou banco: o mesmo texto, com o código (20) |
| Apontar | `preview_version_id` só se a versão do Git é mais nova | a Prévia recarrega na 2 | um envio velho não troca o novo (21) |
| Reinício | `resumeRuns` (13 U7) toma a `previewing` vencida e repete Montar | "O servidor reiniciou; continuando…" | máquina sumida: a da 13, semente do `main` (22) |

## Os critérios de aceite

Pelas rotas e `main.ts`, `Machines` dublê (`LocalSandbox`), Cloudflare dublê, modelo roteirizado.
**Ao vivo**: o que os estudos marcam não verificado. Must, salvo "should".

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova |
| --- | --- | --- | --- |
| 1 | U1 | 0054 "proposed" antes do código, com os critérios 2 a 7 | o registro |
| 2 | U1 | **Ao vivo**: Worker `cx-prova-e14-` no despachante em `…--previa`, num iframe do Hub: o cookie particionado e o salto 303 pelo Hub com `frame-ancestors 'none'` mantido valem, e o app grava, em Chrome, Firefox e Safari do iPhone; fora do iframe, sem passagem: a página de sessão | 0054 |
| 3 | U1 | **Ao vivo**: o host `<nome>--<apelido>--previa` responde em HTTPS com o certificado de hoje do domínio dos apps (0041, critério 5) | 0054 |
| 4 | U1 | **Ao vivo**: 50 scripts de versão no namespace, podados: a contagem volta, o GET de cada um dá 404 depois da propagação, anotada | 0054 |
| 5 | U1 | **Ao vivo**: `pack` na máquina da 13 (Node 24, rede da lista) monta; tempo do fim do turno à Prévia anotado, até 20 s (should) | 0054 |
| 6 | U1 | **Ao vivo**: o `abort` com `retry` do processador reabre o laço dentro do `AgentController` (13) com o Claude real | 0054 |
| 7 | U1 | **Ao vivo**: primeira consulta da Prévia com o Neon da empresa dormindo, anotada | 0054 |
| 8 | U2 | `previewHostOf` dá `<rótulo>--previa`; rótulo novo cabe em 55; `HostLabel` recusa 3 partes, `PreviewHostLabel` aceita só o sufixo | `address.test.ts` |
| 9 | U2 | Esquema e logins `app_<id>_previa*`; o login de rodar da prévia lê o esquema do ar: 42501 | `company-postgres.test.ts` |
| 10 | U2 | Apagar o Projeto: os dois esquemas, os quatro logins, os scripts das duas; falha isolada (12) | `removal.test.ts` |
| 11 | U2 | A poda mantém o ar, a prévia e 3; `listAppVersions` só `origin = 'sent'` | `prune.test.ts`, `versions.test.ts` |
| 12 | U4 | Duas chamadas com a mesma chave: uma versão (`REPLAY`); `preview_version_id` só sobe; o do ar não muda | `preview-send.test.ts` |
| 13 | U4 | Envio de prévia concorre com envio manual: os dois terminam, cada um no seu ponteiro | idem |
| 14 | U4 | `readPreview` (`MEMBER`): `none`, `pending`, `ready`, `failed` com a última boa; Projeto alheio 404 (S10) | `preview.test.ts` |
| 15 | U5 | Host da prévia: cookies `SameSite=None; Secure; Partitioned`; CSP `frame-ancestors <origem do Hub>`; host do ar sem mudança | `dispatcher-preview.test.ts` |
| 16 | U5 | Sessão do ar não abre a prévia, e o contrário; membro de outra empresa: não encontrado; passagem usada de novo: `APP_HANDOFF_INVALID` | idem, `handoff-route.test.ts` |
| 17 | U5 | O Hub ganha `frame-src https://*.<domínio dos apps>`; o resto do CSP fica | `http.test.ts` |
| 18 | U3 | O modelo escreve um app que não monta: o erro volta, ele conserta, a versão monta; 3 falhas: o turno guarda e termina sem `abort` | `pack.test.ts` |
| 19 | U3 | `pack` acima de 2.000 arquivos, 64 MiB ou fora do `Manifest`: `PREVIEW_PACK_FAILED`, sem ler o resto (C59) | idem |
| 20 | U4 | Cloudflare recusa (10021): `failed` com `APP_VERSION_NOT_STARTING`, a última boa fica | `preview-send.test.ts` |
| 21 | U4 | Versão 3 termina antes da 2 (dois processos): o ponteiro fica na 3 | idem |
| 22 | U4 | Hub morre em `previewing`: o segundo processo monta e envia, uma versão | `runs-preview.test.ts` |
| 23 | U6 | Estados da matriz; a Prévia segue na última boa durante o turno; recarrega na parte `preview` | `preview.test.tsx` |
| 24 | U6 | Barra: nomes e teclado (V30, V31); Celular, 390 px; **Abrir em nova aba** com a sessão; **Pedir ao Builder para corrigir** põe no campo o código e a versão | idem |
| 25 | U6 | 1280, 390 px, 200 %, dois temas, CSP limpo, a Prévia sem recarregar ao trocar de aba | navegador (T23) |
| 26 | U7 | `readChanges`: novo, removido, renomeado, binário, `+N`; acima de 2.000 ou de 1 MiB: recusa sem ler (C44, C59); commit fora do `main`: `SOURCE_FILE_NOT_FOUND`; alheio: 404 | `changes.test.ts` |
| 27 | U7 | Unificado e Lado a lado; "N linhas sem alteração" recolhidas | `changes.test.tsx` |
| 28 | U8 | `validateSkillContent` passa; cobre upsert, pai com filhos, `timestamptz`, erro do banco, limites, CSP do app, o `pack` | `instructions.test.ts` |
| 29 | U8 | Portão T14 no CI: com ferramentas falsas, o app gerado monta e o `Manifest` passa | `builder.eval.test.ts` |
| 30 | U9 | O roteiro com dublês | `tests/e2e/builder-preview.test.ts` |
| 31 | U9 | O relatório de QA no commit candidato (T25) | `conexus-qa` |
| 32 | U9 | **Ao vivo**, publicado: o roteiro; Prévia aberta com a máquina apagada | firstmate, fundador (L17) |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Prévia | "Ainda não há uma prévia. Descreva o aplicativo para começar." | idem | "Preparando a prévia…" sobre a última boa | "A versão N não montou. A prévia continua na versão M." e **Pedir ao Builder para corrigir** | a do Projeto | a do Projeto (membro vê) | sessão vencida: o salto pelo Hub, sem aviso |
| Alterações | "Nenhuma versão guardada ainda." | "Esta versão não mudou arquivos." | a partilhada | a de `ui/` | "Esta versão não está mais guardada." | a do Projeto | "Esta diferença é grande demais para mostrar aqui." |
| Cartão da versão | — | — | — | o da 13 | — | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `apps.app.preview_version_id`, `preview_sending_version_id`, `preview_claimed_until`, `preview_database_ready` | U4 | U4, U5 (`checkCall`), U2 (poda, remoção) |
| `apps.app_version.origin`, `source_sha`, `source_number` | U4 | U2 (lista), U4 (`readPreview`) |
| `builder.run.state` `previewing`, `preview_attempt`, `preview_failure` | U4 | U4 (retomada), `readPreview` |
| parte `preview {state, sourceNumber, code?}` | U4 | U6 |
| `readPreview`, `readChanges`, `readFileDiff` | U4, U7 | U6, U7 |

**Os desenhos** (capturas do Conexus OS fora do repositório, L21: `os-34`, `os-35`, `os-37`,
`os-63`, `os-64`):

```text
1280 ┌ Padaria Sol / Encomendas ▾ ─ Prévia · Código · Alterações +2 · Projeto ─ Versão ▾  Abrir app ┐
     │ [Computador|Celular] ⟳  encomendas--padaria-sol--previa…  Versão 2   ↗ │ Conversa           │
     │ ┌──────────────────────────────────────────────────────────────────┐ │ … Versão 2 guardada │
     │ │                  o app, iframe "Prévia do aplicativo"            │ │ [Ver aplicativo]   │
     │ └──────────────────────────────────────────────────────────────────┘ │ [Alterações]       │
     └──────────────────────────────────────────────────────────────────────┴─ compositor ───────┘
390  [Encomendas ▾]; abas roláveis; barra: [Computador|Celular] ⟳ Versão 2 ↗ (sem endereço);
     o app em altura cheia; embaixo [App | Conversa]
```

## A tabela de falhas

| Gravação ou comando | Duas vezes | Recusada no meio | Dependência fora | Imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `pack` no processador | um por passo | o Builder lê o erro | máquina: a da 13 | — | 18 |
| `pack` e leitura após guardar | um por tentativa | `PREVIEW_PACK_FAILED` | idem | `PREVIEW_PACKED` | 19, 22 |
| `app_version` de prévia | chave única, `REPLAY` | reivindicação, C65 | 503 | `APP_VERSION_RECEIVED` | 12, 13 |
| Upload do script | mesmo nome por versão | `abandon` apaga | Cloudflare: `failed` | `APP_VERSION_UPLOADED` | 20 |
| Esquema e logins da prévia | `IF NOT EXISTS` | uma transação | Neon: `failed` | `APP_DATABASE_READY` | 9 |
| Migrações na prévia | razão 0046 | tudo ou nada | idem | `APP_MIGRATED` | 9, 20 |
| `preview_version_id` | `UPDATE … WHERE source_number <` | relido | — | `PREVIEW_VERSION_READY` | 21 |
| `builder.run` `previewing` | posse da 13 | retomada | — | `RUN_SETTLED` | 22 |
| Passagem e sessão no host da prévia | `DELETE … RETURNING` (S22) | — | Hub: a página | — | 16 |
| Poda dos scripts | idempotente | o próximo | pendente | `APP_VERSION_PRUNED` | 4, 11 |
| `git diff` | só leitura | prazo e sinal (C57) | — | — | 26 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base | Nativo / referência |
| --- | --- | --- | --- | --- | --- |
| Hospedagem da prévia | nova | `apps/edge/src/` | — | host por ambiente (0024), não por revisão | WfP, `dispatch.ts` |
| Sessão da prévia | nova | `edge/`, `hub/apps/handoff.ts` | — | passagem curta, cookie, rechecada a cada pedido (OS `preview-session.ts:50-69`) | S22 |
| Conferir e voltar | nova | `builder/conversation/processors.ts` | — | até 3 tentativas (OS `builder.md:54`) | `processOutputStep` |
| Montagem | nova, de `scripts/app-pack.ts` do `main` | `infra/e2b/pack.ts` | um dono para os dois | — | `wrangler` |
| Barra, estados, cartão | nova em código, desenho trazido | `apps/web/src/builder/preview/` | textos ajustados | `lens-preview.tsx:62,68-117`, captura `os-34` | Mastra não tem tela de prévia |
| Alterações | nova em código, desenho trazido | `apps/web/src/builder/source/` | — | `lens-diff.tsx:12-33` | Factory `WorkspaceDiffLines.tsx` |
| Diferenças no servidor | nova | `builder/git/` | — | — | Factory `fs.ts` |
| Skill do contrato | nova, conteúdo de `builder-skills/conexus-server` (OS) | `packages/app-contract/` | reescrita para o contrato 1 | censo §5, §8, §10 | `createSkill` |

**A medida do transplante.** Nenhuma parte entra como código trazido.

**A dívida.** As colunas `preview_*` viram uma linha por ambiente quando a 17 tirar o envio manual
(D6). A 17 junta as numerações do Git e da `app_version`.

## U1 Registro e prova

**Raio.** `docs/decisions/0054-preview-environment.md`, `docs/{index,architecture,roadmap}.md`,
`docs/decisions/0020-*.md`: cria, muda; chama: `check-docs`.

**Contratos.** 0054: critérios 2 a 7, provados antes do merge; o D como aceleração futura. Arquitetura
§3, "store an app version" ganha o ambiente; a sessão de Prévia (`:188-190`) é a do host da prévia.
0020: "o verificador checa antes da Prévia" passa a "a Cloudflare recusa o que não inicia (0046)".
Roteiro: a decisão da 14, P1 a P4. Regras: L21, T14, S40.

## U2 O ambiente prévia

**Raio.** `packages/hub-api/src/{address,app-login}.ts`: muda; chama: Hub, web, despachante.
`apps/server/src/hub/apps/{tables,prune,removal,repair,versions,app-database}.ts`,
`apps/server/src/hub/projects/projects.ts`, `apps/server/src/platform/company-postgres.ts`,
`apps/server/migrations/`, `apps/server/database-grants.sql`, `apps/server/src/platform/catalog.test.ts`:
muda; chama: `send.ts`, `main.ts`.

**Contratos.** `AppEnvironment = 'live' | 'preview'` em `address.ts`, o dono (C26). `PreviewHostLabel`
marcado, `<HostLabel>--previa`; `hostLabelOf` reserva 8 para o sufixo; a migração acrescenta
`project_host_label_form` até 55 (`NOT VALID`, conferido na cópia da nuvem antes; acima, para e
pergunta). `appHostLabelOf(hostname): {label: HostLabel, environment} | undefined`, o único que
lê um host. `appLogin(projectId, environment)`: prévia `app_<id>_previa`, `_previa_run`,
`_previa_migrate`. `apps.app` ganha `preview_version_id`, `preview_sending_version_id`,
`preview_claimed_until`, `preview_database_ready` (FK composta e check como os do ar);
`app_version` ganha `origin text check in ('sent','builder')` padrão `'sent'`, `source_sha`,
`source_number integer > 0`, os dois nulos só em `sent`. `ENVIRONMENT_COLUMNS:
Record<AppEnvironment, …>`, o dono do nome das colunas. Modelo: `send.ts` (C21 sim, C23 a meio,
ver `prune.ts:17`, C26 sim). Regras: D6, D11, D12, D15, 0039.

**Prova.** 8 a 11 e o catálogo.

## U3 Montar na máquina e voltar ao Builder

**Raio.** `infra/e2b/{pack.ts,template.ts}`, `scripts/app-pack.ts`: cria, muda; chama: firstmate
(template), `npm run app-pack`. `apps/server/src/builder/machine/`: muda; chama: U4, processador.
`apps/server/src/builder/conversation/{processors,builder}.ts`: cria, muda; chama: `main.ts`.

**Contratos.** `packVersion({source, out}): Packed | PackRefused`, de `pack.ts`, gravado no
template em `/opt/conexus/pack.mjs`, fora da árvore do app; `npm ci` só sem `node_modules`.
`PackRefused = {code: 'BUNDLE_FAILED' | 'MANIFEST_INVALID' | 'TOO_MANY_FILES' | 'TOO_LARGE', tail:
string}` (`tail`: 20 linhas, 4 KiB, pelo filtro de segredos da 13). `Machines.pack({projectId}):
Result<VersionFolder, PackRefused>`, `VersionFolder = {manifest: unknown, files: VersionFileInput[]}`,
dado de fora, passa por `receiveVersion`. `buildCheck: Processor`, `processOutputStep`: só sem
`toolCalls` e com arquivos mudados; falha → `abort(<código e tail>, {retry: true})`; no
`retryCount` 3, deixa terminar. `Agent({maxProcessorRetries: 3})`.

**Ordem.** Regras: C50, C56, C57, C59, C75, S14. Ler inteira `docs-agents-processors.md` antes.
**Prova.** 18, 19.

## U4 O envio da prévia

**Raio.** `apps/server/src/hub/apps/{send,public,versions,preview}.ts`, `apps/server/src/builder/runs/`,
`apps/server/src/builder/conversation/parts.ts`, `packages/hub-api/src/{apps,conversations,failures,index}.ts`:
cria, muda; chama: `main.ts`, web, OpenAPI.

**Contratos.** `sendVersion(deps, {…, environment, origin})`: o ar exige `manageAppVersions`; a
prévia, a admissão do `admitRun` lida de novo (S8). `sendPreviewVersion({companyId, projectId,
personId, runId, attempt, sourceSha, sourceNumber, folder}): Result<AppVersion, VersionFailure>` em
`public.ts`, a porta de "store an app version". Ponteiro: `UPDATE … WHERE` o `source_number` atual é
menor ou nulo. `builder.run.state` ganha `previewing`; `preview_attempt integer`, `preview_failure
text`. `readPreview` `GET …/projects/{projectId}/preview`, `MEMBER`: `{state: 'none'} | {state:
'pending', sourceNumber, last?} | {state: 'ready', host, sourceNumber, savedAt} | {state: 'failed',
sourceNumber, code, last?}`, `last` = o `ready`. `PREVIEW_PACK_FAILED`, `PREVIEW_VERSION_READY`
(C48).

**Ordem.** Regras: C21, C48, C62, C65, D22, D27, S8, S10. **Prova.** 12 a 14, 20 a 22.

## U5 A prévia dentro do Hub

**Raio.** `apps/edge/src/{dispatch,headers}.ts`: muda; chama: publicar a borda. `apps/server/src/hub/apps/handoff.ts`,
`apps/server/src/platform/http.ts`: muda; chama: rotas da borda, toda resposta.

**Contratos.** O despachante lê o host por `appHostLabelOf`; na prévia, `setCookie(name, value,
environment)` dá `SameSite=None; Secure; Partitioned; HttpOnly`, e `withSecurityHeaders` troca só
`frame-ancestors` pela origem do Hub. O salto é o de hoje (`toHub`, `APP_OPEN_PATH`, `redeem`):
`handoff` e `app_session` guardam o rótulo inteiro, então cada sessão vale num host. `callTo` lê o
ponteiro e o login do ambiente; prévia sem versão: `APP_NOT_FOUND`. Helmet: `frameSrc`.

**Ordem.** Regras: S10, S17 (não muda: é o cookie do Hub), S22, S24, W15. **Prova.** 15 a 17.

## U6 A tela Prévia

**Raio.** `apps/web/src/builder/preview/`: cria; `apps/web/src/hub/projects/area.tsx`,
`apps/web/src/builder/conversation/{builder-turn,stage}.tsx`: muda; chama: `routeTree.gen.ts`.

**Contratos.** `PreviewFrame` lê `readPreview`; `iframe` `title="Prévia do aplicativo"`, `sandbox="allow-scripts
allow-same-origin allow-forms"`, montado sob as abas. `device: 'desktop' | 'phone'`. O cartão da
versão ganha **Ver aplicativo** e **Alterações**. Regras: V19, V54, W22, W31, V29 a V31.

**Prova.** 23 a 25.

## U7 Alterações

**Raio.** `apps/server/src/builder/git/{routes,changes}.ts`, `packages/hub-api/src/source.ts`: cria,
muda; chama: web, OpenAPI. `apps/web/src/builder/source/`: muda; chama: `routeTree.gen.ts`.

**Contratos.** Sob `/api/companies/{companyId}/projects/{projectId}/source`, `MEMBER`: `readChanges`
`GET /changes?to` → `{from, to, files: [{path, previousPath?, status: 'added' | 'removed' |
'renamed' | 'changed', binary, added, removed}]}` até 2.000; `from` é o pai de `to`.
`readFileDiff` `GET /diff?to&path` → `{hunks}`, até 1 MiB pelo `--numstat` antes; 422
`SOURCE_DIFF_TOO_LARGE`. `Sha` marcado (13 U2). Regras: C27, C44, C57, C59, S10.

**Prova.** 26, 27.

## U8 A skill completa

**Raio.** `packages/app-contract/src/skill/`: cria; chama: Builder (13 U6). `builder.eval.test.ts`: muda; chama: CI.

**Contratos.** O texto ensina: upsert numa instrução, `INSERT … ON CONFLICT … DO UPDATE … RETURNING`
em `db.batch`; pai com filhos por ids do handler num `db.batch`; `timestamptz` como texto ISO,
provado por um teste do `db`; o ramo `{error: {code}}` sem repetir; limites de `limits.ts`; CSP do
app (`headers.ts:11`), nada de CDN; o servidor monta no fim e devolve o erro; o Builder não vê a
tela. Regras: D28, T14. **Prova.** 28, 29.

## U9 Percurso e prova publicada

**Raio.** `tests/e2e/builder-preview.test.ts`, `package.json`: cria; chama: `npm run e2e`.

**Prova.** 30 e 31 no commit candidato; 32 após o Release (L17).
