# Etapa 13: O Builder escreve

## A página do fundador

**No fim desta etapa** você pede um app ao Builder, vê cada arquivo e comando enquanto ele trabalha,
e no fim do turno os arquivos ficam guardados numa versão que a aba **Arquivos** mostra.

**O roteiro de uso.** Padaria Sol, com Ana e Diego; Empresa B.

1. Como **Ana**, "Encomendas" › **Conversa**: "Crie um app de encomendas com cliente, telefone,
   produto e data de entrega." Aparece "Ligando a máquina… (há 4 s)", depois "Escrevendo
   `src/encomendas.ts`", "Rodando `npm install`…" com as últimas linhas. Nada pede licença.
2. Fim do turno: "**Versão 1 guardada**: 7 arquivos." Em **Arquivos**, a árvore, a versão, a hora,
   e `src/encomendas.ts` só para ler.
3. "Agora guarde também o endereço": "**Versão 2 guardada**: 2 arquivos mudados."
4. Enquanto o Builder escreve, **Diego** manda uma mensagem no mesmo Projeto: "O Builder está mudando
   este app para Ana. Tente de novo quando ele terminar." O texto fica no campo.
5. "O que falta no app?": ele responde, sem versão nova.
6. Na **Empresa B**, a aba Arquivos da Padaria dá "não encontrado".

**O que você faz, e quando.** Antes de U1: na sua conta grátis do E2B, uma chave nova só desta
instalação (a limpeza do conexus-os apagou máquinas da chave dividida); um bucket privado no R2
com uma chave só dele; e autoriza as chamadas reais ao E2B e ao R2 da prova, do template e do percurso. No começo: aprova esta página. No fim: faz o roteiro e aprova os textos.

**As suas respostas ao estudo.** `F1` A: o motor é nosso, com padrões do Factory; a 0027 fica. `D2`
A: rede fechada, só o npm e o que a instalação provar. `D3` A: um pacote do Git por versão no R2.
`D4` A: uma versão por turno que mudou arquivos; também o turno parado ou com erro (`C3` A). `D5` A:
com uma execução aberta, toda mensagem no Projeto é recusada (`C5` A). `D6` A: a máquina liga só na
primeira ferramenta de arquivo ou comando (`C1` A). `D8`: a conta grátis. Máquina sumida: refeita do
que está guardado, com aviso (`C4` A).

**Uma máquina por Projeto** (`C2` A): dorme entre turnos e é apagada após 7 dias parada. O `F1`
falava em máquina da execução, destruída ao fim; acordar leva 1 s e guarda o `node_modules`.

**As leituras que você confirmou.** Git no servidor com cópia no R2; "Levar para o meu GitHub" após
a etapa 23: "1. Okay". O roteiro troca "Um Git privado" por "Um bucket privado no R2". `D7`: ler,
editar, rodar comando, sim; o resto, não: "2. Okay, sem complicar, pelo menos a primeiro momento".

**Os limites** (`C6`: "Okay"). Turno de 1 hora, o teto do plano grátis; versão de 2.000 arquivos
e 64 MiB; máquina apagada após 7 dias parada; arquivo de 1 MiB na aba; 20 linhas de comando.

**Os relógios.** Cada tempo tem um só dono, nativo onde existe; uma regra recusa relógio solto.

**Fica de fora.** Preview, painel ao vivo, diferenças, skills completas (14); retomar turno cortado
(16); fila de mensagens; GitHub. Issues `next-card` 25, 39, 45: outras pastas.

**A decisão sua pedida nesta etapa.** Nenhuma.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| P0 | Regras de pacote e de relógio | `.dependency-cruiser.cjs`, `biome.json` | — | — | — |
| U1 | Registro 0051, prova ao vivo | `docs/` | testes | mastra | P0 |
| U2 | O Git do app | `builder/git/`, `infra/` | dados | node | U1 |
| U3 | O adaptador do R2 | `builder/git/copy/` | segurança | — | U2 |
| U4 | Tabelas e grants | migrações | dados | neon:neon-postgres | U1 |
| U5 | Máquina e template | `builder/machine/`, `infra/e2b/` | segurança | mastra | U3, U4 |
| U6 | A execução | `builder/runs/` | dados | mastra | U5 |
| U7 | Permissões, instruções | `builder/conversation/` | segurança | mastra | U6 |
| U8 | O stream | `builder/conversation/`, web | código | mastra | U7 |
| U9 | Remoção | `builder/runs/`, `hub/` | dados | — | U6 |
| U10 | Aba Arquivos, percurso | `builder/git/`, web | web | fastify-best-practices, shadcn | U8 |

P0 antes (L20); U1 antes do código; U4 em PR próprio (D11); U9 em paralelo com U7, U8, U10.

**Orçamento de código alterado** (sem testes nem gerados): P0 20; U2 480; U3 200; U4 120; U5 430;
U6 660; U7 200; U8 330; U9 190; U10 780. Total **3.410** de 4.000 (L2).

## O que é nativo e o que é nosso

Fixado, linhas do `dist/`: `@mastra/core` 1.78.0, `@mastra/e2b` 0.14.1, `@mastra/code-sdk` 1.14.0,
`e2b` 2.56.0, `@aws-sdk/client-s3` 3.1146.0.

| Mecanismo | Nativo | Nosso, e por quê |
| --- | --- | --- |
| Arquivo e comando | `Workspace`, `WORKSPACE_TOOLS` (`workspace-BojqafFG.js:7281`) | nada |
| Workspace no turno | `AgentController({workspace: fn})` (`agent-controller/types.d.ts:244`) | o mapa por execução; `createSession({workspace})` (`agent-controller.d.ts:117`) não chega ao turno (provado) |
| Partida e semente | partida preguiçosa; `onStart({sandbox, outcome})` em toda partida (`workspace/sandbox/mastra-sandbox.d.ts:46-70`); `reattach: 'required'` (`e2b index.js:1265`) | o que o gancho faz; gravar o id |
| Rede | `allowOut`, `denyOut: [ALL_TRAFFIC]` (`e2b index.d.ts:2671-2678`, `:9941`); `updateNetwork` (`:10822`) | a lista (`D2`) |
| Permissão | `PermissionRules` (`types.d.ts:364-376`), `setForCategory` (`session.d.ts:1101`), `resolveToolApproval` (`agent-controller-DRiP9C5v.js:4982`) | o `toolCategoryResolver` (`types.d.ts:311`): sem ele, tudo pergunta (`:8096`) |
| Guardar | — | `git` (0029); isomorphic-git não compara a ref velha |
| Cópia | `S3Client` do R2 | a chave, o pendente |
| Fase da máquina | `workspace_status_changed` (`types.d.ts:781`) nunca é emitido | o gancho emite |

## Os relógios: um dono cada

Vencimento verificado na leitura, nada tocado sem trabalho (arquitetura §10, D27). O agendador do
Mastra lê o banco a cada 10 s (`workflows/scheduler/types.d.ts:69-71`): acordaria o Neon. P0 recusa
`setTimeout` em `builder/` fora dos dois donos **nossos**.

| Tempo | Dono | Mecanismo |
| --- | --- | --- |
| Prazo da máquina, 1 h | `builder/machine/` | nativo: `E2BSandbox({timeout})` de `deadline_at`, mandado ao criar e ao religar (`index.js:853`, `:1301`, `:1320`); `onTimeout: 'pause'` (`:744`). Custo aceito: com o Hub caído, a máquina fica ligada até o fim da hora |
| Prazo do turno, 1 h | `builder/runs/deadline.ts` | **nosso**: um `AbortSignal.timeout` chama o `abort` nativo; `sendMessage` não recebe sinal (`session.d.ts:1709`) |
| Vencida; dormir | `builder/runs/` | `admitRun` assenta na leitura; `Workspace.stop()` no fim |
| Apagar após 7 dias | `builder/machine/sweep.ts` | **nosso**, sem relógio: o E2B guarda a pausada sem prazo; roda na partida e no `admitRun` após 24 h |
| Cópia pendente | `builder/runs/copy-retry.ts` | **nosso**, armado só com pendente; a curta é nativa (`maxAttempts`) |
| Chamada ao E2B, ao R2, ao `git` | cada adaptador | nativos: `requestTimeoutMs` e repetições do SDK; `abortSignal`; `execFile({timeout, signal})`. `start()` não recebe sinal: um prazo externo o abandona, e a próxima religa com `required` (C57) |
| Relógio na tela | `apps/web/src/builder/conversation/elapsed.ts` | da chegada do evento |

**As referências.** Factory (`mastra-fork` `ce7e9c30c1`): semente no gancho de partida
(`mastracode/factory/src/workspace.ts:429-436`); máquina parada, com o ciclo do provedor
(`sandbox/session-retirement.ts:39-43`). OpenHands, pausa opcional; dyad, sem máquina; fragments, o
prazo do E2B (estudo, seção 5). Nenhuma tem relógio próprio.

## O fluxo da máquina num turno

| Fase | Mecanismo, nativo ou **nosso** | O que Ana vê | Falha, e o que ela vê |
| --- | --- | --- | --- |
| Admitir | **nosso**: `builder.run` única por Projeto, `deadline_at` a 1 h; o `Workspace`, sem ligar | "Pensando…" | outra aberta: 409 `RUN_BUSY`, o aviso (14); vencida: assentada (15) |
| Primeira ferramenta | nativo: partida preguiçosa pelo id, `reattach: 'required'`; sem id, do template; **nosso**: gravar o id | "Ligando a máquina… (há 4 s)", do `tool_start` | sumida: cria, "A máquina anterior sumiu; refiz a partir do que está guardado." (17); E2B fora: "Não consegui ligar a máquina agora. Sua conversa está guardada; tente de novo em alguns minutos." (18) |
| Semente | nativo `onStart`: `created`, semente; `connected`, `updateNetwork`, volta ao `main` | "Copiando os arquivos do app…" | idem |
| Trabalhar | ferramentas nativas, sem aprovação (`D7`) | "Escrevendo `src/encomendas.ts`", "Rodando `npm install`… (40 s)" e 20 linhas; 60 s calado: "Ainda trabalhando… há 1 min 20 s" | o Builder lê o erro e segue |
| Fim | `agent_end`: fim, **Parar**, erro, prazo | — | máquina caída: "A máquina caiu no meio do turno; o que não foi guardado se perdeu." (16) |
| Guardar | **nosso**: `collect`, `fsck`, candidata, `update-ref` com a base; `stop()` | "Versão 2 guardada: 2 arquivos mudados" | "Não consegui guardar esta versão. A anterior continua." (11) |
| Reinício | **nosso**: "o `main` contém a candidata?" | a última versão | "O turno anterior foi cortado; os arquivos dele não foram guardados." (19) |

## Os remendos antigos (`e0353c36`)

**Nativos agora:** 1 `holdOpen` (o `timeout`); 2 `tripwire`; 3 máquina própria; 4 "encarnação"
(`reattach`, `onStart`); 9 sessões (`deleteSession`); 10 partida preguiçosa; 13 SSE; 15 template;
16 usuário `user`. **Sai:** 8, registro de
rede (`allowOut`). **Nossos, sem nativo:** 5 ordem da remoção; 6 varredura com a marca; 7 teto do
pacote (C59); 11 assentar; 12 e 14, da 12.

## Os critérios de aceite

`npm run test -w @conexus/server`, pelas rotas e `main.ts`, com o porto `Machines` dublê
(`LocalSandbox`; sumida, pendurada, 502), modelo roteirizado. **Ao vivo**: o não provado no estudo.
Nível must, salvo "(should)".

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova |
| --- | --- | --- | --- |
| 1 | P0 | `e2b` fora de `builder/machine/`, `infra/e2b/`; `@aws-sdk/client-s3` fora de `builder/git/copy/`; `setTimeout` fora dos donos: recusados | `scripts/rules.test.ts` |
| 2 | U1 | 0051 "proposed" antes do código, com a lista de `D2` | o registro |
| 3 | U1 | **Ao vivo**: `npm view` responde, `curl https://example.com` não; religar guarda os arquivos; 200 KB intactos; sumida, `required` recusa; a marca lista só as daqui | 0051 |
| 4 | U1 | **Ao vivo**: um pacote apagado volta do R2 em menos de 15 min, mesmo `main`; região anotada | 0051 |
| 5 | U1 | **Ao vivo**: os termos do Hobby admitem o uso; senão, volta ao fundador (should) | 0051 |
| 6 | U2 | Avanço com base velha: recusado, `main` intacto | `git.test.ts` |
| 7 | U2 | Dois commits, pai errado, não regular, corrompido, acima de 2.000 arquivos ou 64 MiB: `SAVE_REFUSED` | idem |
| 8 | U2 | `git` sem resposta no prazo: morto, falha com nome (C57) | idem |
| 9 | U2 | Imagem com `git`; volume do `node` | `deploy.test.ts` |
| 10 | U5 | Chave do E2B só de arquivo; ausente, vazia, aberta: `CONFIG_INVALID` (S31; teste 12 do Builder); `env` vazio (S14) | `config.test.ts`, `machine.test.ts` |
| 11 | U6 | Recusa ao guardar: o texto; a árvore segue a anterior | `runs.test.ts` |
| 12 | U5 | A varredura só toca as com a marca, sem execução aberta (achado 1); sem turno, nada | `machine.test.ts` |
| 13 | U6 | Cada versão, um objeto; R2 fora: pendente, repetido até o 200; sem pendente, sem relógio | `runs.test.ts` |
| 14 | U6 | Com execução aberta, toda mensagem no Projeto: 409 `RUN_BUSY`; outro Projeto passa | idem |
| 15 | U6 | Turno além de 1 h: parado, guardado; a máquina recebe o prazo; vencida não bloqueia | idem |
| 16 | U6 | **Parar** ou erro do modelo após escrever: versão; máquina caída: `failed`, o texto | idem |
| 17 | U5 | Id gravado e máquina sumida: nenhuma criação calada; o aviso, semente do `main` | `machine.test.ts` |
| 18 | U5 | E2B sem resposta: prazo externo, `MACHINE_UNAVAILABLE` (achados 7, 8) | idem |
| 19 | U6 | Reinício entre candidata e avanço: uma versão; sem candidata: `interrupted`, o aviso, a sobra fora | `runs.test.ts` |
| 20 | U6 | Nada mudado: sem versão; só resposta: sem partida | idem |
| 21 | U7 | **Armadilha 1**: um turno pela rota recebe `mastra_workspace_write_file` e escreve no seu Projeto, não no vizinho | `workspace.test.ts` |
| 22 | U7 | **Armadilha 2**: três escritas e um comando, nenhum `tool_approval_required`; `other`, `mcp` recusadas; nenhuma das sete do controller | `permissions.test.ts` |
| 23 | U7 | `../fora.ts`, link: recusado; escrever sem ler: recusado | `workspace.test.ts` |
| 24 | U8 | Os eventos da 12 iguais; "Escrevendo" com o caminho; saída a 20 linhas e 4 KiB; Diego sem os de Ana; fases, relógio, versão na tela | `conversations.test.ts`, `conversation.test.tsx` |
| 25 | U9 | Apagar Projeto, pessoa, empresa: a execução aberta parada antes; máquinas, cópia, repositório, linhas; falha numa, as outras seguem; vizinho intocado (teste 11 do Builder, achado 3) | `runs-removal.test.ts` |
| 26 | U10 | Outra empresa, Projeto alheio: o 404 do Projeto (S10, T10); fora do `main`, ausente: `SOURCE_FILE_NOT_FOUND`; acima de 1 MiB, binário: `SOURCE_FILE_NOT_TEXT`, sem ler | `source.test.ts` |
| 27 | U10 | Estados, teclado, foco | `source.test.tsx` |
| 28 | U10 | 390 px, 200%, dois temas, sem erro de CSP (should) | navegador (T23) |
| 29 | U10 | O roteiro, com dublês | `tests/e2e/builder-writes.test.ts` |
| 30 | U10 | **Ao vivo**: o roteiro publicado; o ensaio pelo `hub-git-restore.md`; apagar o Projeto de teste some máquina, repositório, prefixo | firstmate, fundador (T14) |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- |
| Arquivos | "Nenhuma versão guardada ainda. Peça um app na Conversa." | a partilhada | a de `ui/` | a do Projeto | — |
| Arquivo | — | idem | idem | "Este arquivo não está nesta versão." | "Não dá para mostrar este arquivo aqui." |
| Turno que escreve | da 12 | as fases | do fluxo | da 12 | o aviso de `D5` |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `builder.run` (`person_id`: o nome no aviso) | U6 | U6, U9 |
| `builder.machine` | U5 | U5, U9 |
| eventos `machine`, `output`, `exit`, `saved` | U8 | a Conversa; `saved`, a aba |
| `readProjectSource`, `readProjectFile` | o Git (U2) | a aba |

## A tabela de falhas

| Gravação ou comando | Duas vezes | Recusada no meio | Dependência fora | Imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Abrir `builder.run` | índice único | uma instrução | 503 | `RUN_ADMITTED`, `RUN_BUSY` | 14 |
| Estado da execução | estado final | relida na partida | `main` intacto | `RUN_SETTLED` | 15, 16, 19 |
| Partida, pausa, varrer | idempotentes | id no gancho; o prazo pausa | `MACHINE_UNAVAILABLE` | `MACHINE_STARTED`, `_SWEPT` | 12, 17, 18 |
| `seed`, `collect` | um por turno | `SAVE_REFUSED` | idem | — | 7, 16 |
| `ensure`, `fetch` | ref por execução | descartável | — | `SAVE_REFUSED` | 7 |
| `update-ref` do `main` | a base recusa a segunda | `rev-parse` decide | — | `VERSION_SAVED` | 6, 19 |
| `gc` | trava do `git` | o próximo | anotado | `GIT_GC_FAILED` | 8 |
| PUT no R2 | mesma chave | o mesmo PUT | pendente | `GIT_COPY_PENDING`, `_DONE` | 13 |
| Remoção | idempotente | pendente da 12 | pendente | `PROJECT_SOURCE_RELEASED` | 25 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Git (613 linhas) | trazida | `builder/git/` | prazo e sinal, `-z`, não regulares, trava | pacote e avanço por comparação (provado) |
| Motor, máquina | novas | `builder/{runs,machine}/` | — | candidata antes do `main` (D22); ambiente vazio (S14) |
| Prompt, skill, cópia | novas | `conversation/`, `git/copy/` | — | honestidade, português; "um só `db.batch`" (0045) |

**A medida do transplante.** Git: 20 a 30% muda, por leitura; acima de um terço, vira nova.

**A dívida.** `gc` a cada 50 versões, no salvar; retenção no R2.

## P0 As regras de dependência e de relógio

### O raio da mudança

| Arquivo ou pasta | Cria, muda ou apaga | Quem chama |
| --- | --- | --- |
| `.dependency-cruiser.cjs`, `biome.json`, `scripts/rules.test.ts` | muda | `npm run deps`, `npm run lint` |

**Contratos.** Biome `noRestrictedGlobals` para `setTimeout`, `setInterval` em
`apps/server/src/builder/`, liberado só em `runs/deadline.ts` e `runs/copy-retry.ts`. **Prova.** 1,
em PR próprio (L20).

## U1 Registro e prova

### O raio da mudança

| Arquivo ou pasta | Cria, muda ou apaga | Quem chama |
| --- | --- | --- |
| `docs/decisions/0051-*.md`, `docs/{index,architecture,roadmap}.md` | cria, muda | `check-docs` |

**Contratos.** 0051: critérios 3–5 e a lista de `D2`, provados fora do repositório com um template
descartável, antes do merge. Arquitetura §3: "Git copy host" passa a R2, fora do Brasil [0032]; §7,
§10, §11. Regras: L21, T14, S40.

## U2 O Git do app

### O raio da mudança

| Arquivo ou pasta | Cria, muda ou apaga | Quem chama |
| --- | --- | --- |
| `apps/server/src/builder/git/` | cria | U6, U9, U10 |
| `apps/server/src/platform/config.ts`, `infra/{hub.Dockerfile,compose.yaml,deploy.sh}`, `scripts/deploy.test.ts` | `HUB_GIT_ROOT`, `git`, volume | publicar |

**Contratos.** `openRepository({root, companyId, projectId}): Repository`, em
`<raiz>/<companyId>/<projectId>.git`: `ensure()`, `main()`, `bundleOfMain()`, `receive({runId,
bundle, base}): Result<Sha, SaveRefusal>`, `advance({candidate, base}): 'advanced' | 'stale'`,
`contains`, `tree`, `file({sha, path, maxBytes})`, `version`, `remove`. `Sha` marcado (C23). `SaveRefusal = 'two-commits' | 'wrong-parent' | 'not-regular' | 'too-many-files' |
'too-large' | 'corrupt'`.

**Ordem.** Regras: C23, C57, C59, C62, S2. Funções: `bundle`; `fetch` com `transfer.fsckObjects`
para `refs/conexus/runs/<runId>`; `update-ref refs/heads/main <nova> <base>`; `ls-tree -z`;
`cat-file`; `rev-list --count`.

**Prova.** 6–9.

## U3 O adaptador do R2

### O raio da mudança

| Arquivo ou pasta | Cria, muda ou apaga | Quem chama |
| --- | --- | --- |
| `apps/server/src/builder/git/copy/` | cria | U6, U9 |
| `apps/server/src/platform/config.ts`, `package.json`, `package-lock.json`, `apps/server/package.json`, `infra/compose.yaml`, `docs/how-to/hub-server.md` | `HUB_GIT_COPY_BUCKET`, `HUB_GIT_COPY_KEY_FILE`; o pacote | publicar |

**Contratos.** Porto `GitCopy = {put({projectId, version, sha, bundle}); latest(projectId);
removeProject(projectId)}`, cada um também com `companyId`, um adaptador (C56). Chave
`git/<companyId>/<projectId>/<versão em 8 dígitos>-<sha>.bundle`; endereço por
`HUB_CLOUDFLARE_ACCOUNT_ID`.

**Ordem.** Regras: S31, S36, C56, C57. Funções: `S3Client({region: 'auto', endpoint, credentials,
maxAttempts})`, `PutObjectCommand`; `ListObjectsV2Command` com `ContinuationToken`;
`DeleteObjectsCommand` em lotes de 1.000; `abortSignal` em todos.

**Prova.** 13.

## U4 Tabelas e grants

### O raio da mudança

| Arquivo ou pasta | Cria, muda ou apaga | Quem chama |
| --- | --- | --- |
| `apps/server/src/builder/{runs,machine}/tables.ts`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `apps/server/src/platform/catalog.test.ts` | cria | U5, U6, U9 |

**Contratos.** `builder.run`: `id` uuid, `company_id`, `project_id` para `hub.project`,
`person_id`; `state`: `open`, `saving`, `saved`, `unchanged`, `stopped`, `interrupted`, `failed` (C21);
`base_sha`, `candidate_sha`, `deadline_at`, `copied_at`; único parcial `(project_id) WHERE state IN
('open', 'saving')`. `builder.machine`: `project_id` chave, `company_id`, `sandbox_id`, `used_at`.
Política de linha (0039). Regras: D6, D11, D12, D15, D18.

**Prova.** 14 e o catálogo.

## U5 A máquina e o template

### O raio da mudança

| Arquivo ou pasta | Cria, muda ou apaga | Quem chama |
| --- | --- | --- |
| `apps/server/src/builder/machine/` | cria | U6, U7, U9 |
| `infra/e2b/template.ts` | Node 24, `git` | firstmate, uma vez |
| `apps/server/src/platform/config.ts`, `package.json`, `package-lock.json`, `apps/server/package.json`, `infra/compose.yaml`, `docs/how-to/hub-server.md`, `scripts/removals.json` | `HUB_E2B_API_KEY_FILE`, `HUB_E2B_TEMPLATE`; pacotes; remoção do crit. 10 (T12) | publicar |

**Contratos.** Porto `Machines = {workspaceFor({companyId, projectId, deadline, onPhase}): Workspace;
collect({projectId, base}): Bytes | 'unchanged'; list(); kill(id)}` (C56); `collect` faz o commit e
lê até 64 MiB (C59). `E2BSandbox({id: 'conexus-<projectId>', sandboxId?, reattach:
'required', template, apiKey, timeout: <até o prazo>, lifecycle: {onTimeout: 'pause'}, network:
{allowOut: <0051>, denyOut: [ALL_TRAFFIC]}, metadata: {conexus_origin}, onStart})`, sem `env`; a
marca é o host de `HUB_PUBLIC_ORIGIN`. `onStart`: grava o `sandboxId`; `created`, semente do `main`;
`connected`, `updateNetwork` com a lista e `HEAD` de volta ao `main`. `Workspace({sandbox,
filesystem: SandboxFilesystem, tools})` em `/home/user/app`. `sweep()`: `Sandbox.list` pela marca
(`e2b index.d.ts:9376`), `Sandbox.kill` (`:9601`). Falhas `MACHINE_UNAVAILABLE`, `MACHINE_REPLACED`.

**Ordem.** Regras: C50, C56, C57, C75, S14, S31, S36, S41. Nenhum `logger` ao SDK do E2B.

**Prova.** 10, 12, 17, 18.

## U6 A execução

### O raio da mudança

| Arquivo ou pasta | Cria, muda ou apaga | Quem chama |
| --- | --- | --- |
| `apps/server/src/builder/runs/`, `apps/server/src/main.ts` | cria; assentar, dreno (C62) | U8, U9 |
| `apps/server/src/builder/conversation/{sessions,builder}.ts`, `packages/hub-api/src/{conversations,failures}.ts` | admitir, guardar; `RUN_BUSY`, `SAVE_REFUSED` (C48) | `main.ts`, web |

**Contratos.** `admitRun({companyId, projectId, conversationId, personId}): Result<RunId, 'busy'>`,
que assenta a vencida e chama a varredura após 24 h; a função `workspace` do controller devolve o
da execução; `finishRun({runId, reason})` no `agent_end` guarda se a árvore mudou; `settleRuns()`;
`deadline.ts`, `copy-retry.ts`.

**Ordem.** Regras: C21, C62, C63, C65, D22, D25, D27. Funções: `onBeforeAgentEnd`
(`session.d.ts:1433`), `agent_end`, `abort`.

**Prova.** 11, 13–16, 19, 20.

## U7 Permissões, instruções, skill

### O raio da mudança

| Arquivo ou pasta | Cria, muda ou apaga | Quem chama |
| --- | --- | --- |
| `apps/server/src/builder/conversation/{permissions,instructions,builder,sessions}.ts`, `apps/server/src/builder/conversation/skills/` | cria, muda | `main.ts` |

**Contratos.** `categoryOf(toolName): ToolCategory`, o `toolCategoryResolver`: ler, listar, `grep`,
`file_stat`, e `web_search`, `web_fetch` da 12 (no Hub) → `read`; escrever, editar, `mkdir`,
`delete` → `edit`; comando e processos → `execute`; o resto → `other`, nunca `null`. A cada
`createSession`, idempotente: `read`, `edit`, `execute` = `allow`; `mcp`, `other` = `deny`; nunca
`yolo`. `disableBuiltinTools`
(`types.d.ts:305`): as sete. `Workspace`: sem `ast_edit`; `requireReadBeforeWrite` em escrever e
editar. Instruções em português, ~30 linhas; skill da forma do app pelo `packages/app-contract`.

**Ordem.** Regras: C75, S2, S14.

**Prova.** 21–23.

## U8 O stream que escreve

### O raio da mudança

| Arquivo ou pasta | Cria, muda ou apaga | Quem chama |
| --- | --- | --- |
| `apps/server/src/builder/conversation/{routes,events}.ts`, `packages/hub-api/src/conversations.ts`, `apps/web/src/builder/conversation/` | muda | rotas |

**Contratos.** `ConversationEvent` guarda os cinco da 12 e ganha `{type: 'machine'; phase:
'starting' | 'waking' | 'copying' | 'replaced' | 'saving'}`, `{type: 'output'; callId; lines}`,
`{type: 'exit'; callId; code}`, `{type: 'saved'; version; changed}`. `starting`: o `tool_start` da
primeira ferramenta do workspace; `copying`, `replaced`: o `onPhase` do gancho. O caminho de
"Escrevendo": o `part` da 12, de `tool_start.args`. Nunca `display_state_changed` (saída sem
teto) nem `modifiedFiles` (vazio para o workspace).

**Ordem.** Regras: C28, C59, S39, W9, V35, V39.

**Prova.** 24.

## U9 Remoção

### O raio da mudança

| Arquivo ou pasta | Cria, muda ou apaga | Quem chama |
| --- | --- | --- |
| `apps/server/src/builder/runs/{removal,public}.ts`, `apps/server/src/hub/{projects/projects.ts,identity/**,operations/clients.ts}` | cria; a porta da 12 | `main.ts` |

**Contratos.** `ReleaseConversations` da 12 assenta a execução aberta (`finishRun` recusa Projeto
removido), depois libera máquinas, cópia, repositório, execuções; falha: pendente.

**Ordem.** Regras: D22, S10, T10.

**Prova.** 25.

## U10 Aba Arquivos e percurso

### O raio da mudança

| Arquivo ou pasta | Cria, muda ou apaga | Quem chama |
| --- | --- | --- |
| `apps/server/src/builder/git/{routes,public}.ts`, `packages/hub-api/src/{source,failures,index}.ts` | cria, muda | web, OpenAPI |
| `apps/web/src/builder/source/`, `apps/web/src/routes/_app/companies/$companyId/projects/$projectId.{files,}.tsx` | a aba | `routeTree.gen.ts` |
| `tests/e2e/builder-writes.test.ts`, `package.json`, `docs/how-to/hub-git-restore.md`, `docs/index.md` | percurso; volta da cópia (L23) | `npm run e2e` |

**Contratos.** Sob `/api/companies/{companyId}/projects/{projectId}`, acesso `MEMBER`:
`readProjectSource` `GET /source` → `{version, commit, savedAt, files: [{path, bytes}]}`, limitada
pelo teto de 2.000 (C44), `version: null` sem versão; `readProjectFile` `GET
/source/file?commit&path` → `{text}`, 1 MiB por `cat-file -s` antes de ler; 404
`SOURCE_FILE_NOT_FOUND`, 422 `SOURCE_FILE_NOT_TEXT` (C48).

**Ordem.** Regras: C28, C36, C44, C59, S2, S10, W8, W9, W17, V29–V31.

**Prova.** 26–29; 30 após o Release (T14).
