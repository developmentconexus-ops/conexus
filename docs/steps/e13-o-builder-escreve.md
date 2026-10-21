# Etapa 13: O Builder escreve

## A página do fundador

**No fim desta etapa** você pede um app ao Builder, vê cada arquivo e comando enquanto ele trabalha,
o turno sobrevive a um reinício do servidor, e no fim os arquivos ficam numa versão que a aba
**Código** mostra.

**O roteiro de uso.** Padaria Sol, com Ana e Diego; Empresa B.

1. Como **Ana**, "Encomendas" › **Conversa**: "Crie um app de encomendas com cliente, telefone,
   produto e data de entrega." Aparece "Ligando a máquina… (há 4 s)", depois "Escrevendo
   `src/encomendas.ts`", "Rodando `npm install`…" com as últimas linhas. Nada pede licença.
2. Fim do turno: "**Versão 1 guardada**: 7 arquivos." Em **Código**, a árvore, versão, hora, e
   `src/encomendas.ts` só para ler.
3. "Agora guarde também o endereço." No meio, firstmate reinicia o servidor: "O servidor reiniciou;
   continuando…", e depois "**Versão 2 guardada**: 2 arquivos mudados."
4. Enquanto o Builder escreve, **Diego** escreve no mesmo Projeto: "O Builder está mudando
   este app para Ana. Tente de novo quando ele terminar." O texto fica no campo.
5. "O que falta no app?": resposta, sem versão.
6. Na **Empresa B**, a aba Código da Padaria dá "não encontrado".

**O que você faz, e quando.** Antes de U1: uma chave do E2B (conta grátis) só desta instalação; um
bucket privado no R2 com chave própria; autoriza as chamadas reais da prova, do template e do percurso. No começo: aprova esta página. No fim: faz o roteiro e aprova os textos.

**As suas respostas.** `F1` A: motor nosso. `D2` A, "15 sim": rede por lista de domínios. `D3` A:
um pacote do Git por versão no R2. `D4` A: versão por turno que mudou arquivos (`C3`). `D5` A:
execução aberta recusa outra mensagem (`C5`). `D6` A: a máquina liga na primeira ferramenta de
arquivo ou comando (`C1`). `D8`: conta grátis. Máquina sumida: refeita (`C4`). Uma por Projeto (`C2`). "13 sim": Git no servidor, cópia no R2, GitHub
depois; "Um Git privado" vira "Um bucket privado no R2". "14 sim": ler, editar, rodar; o resto, não.
R2 b: o turno sobrevive a um reinício. 11 B: um caminho de rastreio. 12: "deixa 100".

**Os limites** (`C6`). Turno de 1 hora e **100 passos** (recomeçam após um reinício); no 100 ele
responde o que fez e falta, e você diz "continue". Versão de 2.000 arquivos e 64 MiB; máquina apagada após 7 dias
parada; arquivo de 1 MiB na aba; 20 linhas de comando.

**O rastreio** (11 B). Uma linha de log por turno: duração, passos, tokens, fim, ferramenta e código
do erro, sem texto. Os passos vão ao Grafana em "Ver o que acontece".

**Fica de fora.** Preview, diferenças linha a linha, skills completas (14); fila de mensagens;
GitHub; a aprovação na tela, pois nenhuma regra pergunta. Issues `next-card` 25, 39, 45: outras pastas.

**A decisão sua pedida nesta etapa.** Nenhuma. "A e sim para 13.1": a **13.1 "O primeiro
pedido"** vem logo depois, com Alterações, o passo 4 da primeira entrada e o compositor do Início
criando Projeto; a 13 fica em 4.040 a 4.240 linhas. Se a medida de Z2 na U1 passar disso, a
construção para e pergunta.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills, do mapa | Depende de |
| --- | --- | --- | --- | --- | --- |
| P0 | Regras de pacote e relógio | `.dependency-cruiser.cjs`, `biome.json` | — | — | — |
| U1 | Registro 0051, prova ao vivo | `docs/` | testes | mastra | P0 |
| U2 | O Git do app e a cópia no R2 | `builder/git/`, `infra/` | dados | — | U1 |
| U3 | Tabelas e grants | migrações | dados | drizzle, neon:neon-postgres | U1 |
| U4 | Máquina, semente, template | `builder/machine/`, `infra/e2b/` | segurança | mastra | U2, U3 |
| U5 | A execução e a remoção | `builder/runs/`, `hub/` | dados | mastra, better-auth-best-practices | U4 |
| U6 | Permissões, instruções, passos | `builder/conversation/`, `builder/model-accounts/` | segurança | mastra | U5 |
| U7 | O turno durável | `builder/runs/`, `builder/conversation/` | dados | mastra | U6 |
| U8 | O stream que escreve | `builder/conversation/`, web | código | mastra, router-core, shadcn | U7 |
| U9 | Aba Código, percurso | `builder/git/`, web | web | fastify-best-practices, router-core, shadcn, playwright-cli | U8 |
| U10 | Linha do turno, `by`, avaliação | `builder/conversation/`, `infra/` | segurança | mastra | U8 |

Skills e leitura: as linhas de `docs/reference/stack.md` pelas pastas, na sua ordem; em toda unidade
`typescript-magician` e `node`. Pacote novo (`e2b`, `@mastra/e2b`, `@aws-sdk/client-s3`,
`@mastra/evals`) entra com a sua linha.

**Antes da aprovação** (0050), o estudo responde: aprovação e `ask_user`, dois eventos nossos ou as
duas rotas do Mastra atrás da guarda de S39? Pode mudar U6 e U8; partes novas entram por
`applyEvent` (12.3).

Após a 12.3. P0 antes (L20); U1 antes do código; U3 em PR próprio (D11); o resto em série.

**Orçamento de código alterado:** P0 30; U2 680; U3 160; U4 470; U5 850;
U6 240; U7 400; U8 330; U9 780; U10 100. Total **4.040**; **4.240** com o filesystem nosso (Z2): 1 a
6% acima de L2, aceitos; acima, para e pergunta.

## O que é nativo e o que é nosso

Linhas do `dist/`: `@mastra/core` 1.78.0, `@mastra/e2b` 0.14.1, `@mastra/code-sdk` 1.14.0, `e2b`
2.56.0, `@aws-sdk/client-s3` 3.1146.0; `@mastra/evals` na U1. `fork`: `mastra-fork` `ce7e9c30c1`
(core 1.69.0); dele, a semente no gancho (`mastracode/factory/src/workspace.ts:429-436`).

| Mecanismo | Nativo | Nosso, e por quê |
| --- | --- | --- |
| Workspace no turno | `AgentController({workspace: fn})` (`agent-controller/types.d.ts:244`) | o mapa: `createSession({workspace})` (`agent-controller.d.ts:117`) não chega ao turno |
| Partida e semente | `onStart` (`workspace/sandbox/mastra-sandbox.d.ts:46-70`); `reattach: 'required'` (`e2b index.js:1265`); `beforeToolCall` (`workspace/tools/types.d.ts:55-72`) | o id; o portão, pois `running` vem antes do gancho (`workspace-BojqafFG.js:3991-3998`) |
| Escrita | `SandboxFilesystem`, um argumento de shell por arquivo (`fork` `sandbox-filesystem.ts:283-298`); `writeFiles()` (`sandbox.d.ts:52-96`) | o nosso, se ~200 linhas (Z2) |
| Rede | `allowOut`, `denyOut: [ALL_TRAFFIC]` (`e2b index.d.ts:2671-2678`); `updateNetwork` (`:10822`) | a lista (`D2`) |
| Permissão | `PermissionRules` (`types.d.ts:364-376`), `setForCategory` (`session.d.ts:1101`) | `toolCategoryResolver` (`types.d.ts:311`): sem ele, tudo pergunta (`:8096`) |
| Passos | `processInputStep` → `toolChoice` (`processors/index.d.ts:223-232`); 1.000 no controller (`agent-controller-DRiP9C5v.js:6720`) | número, frase |
| Skill | `createSkill`, `Agent.skills` (`agent/types.d.ts:790`) | o texto, do `packages/app-contract` |
| Turno durável | `DurableAgent`: entre processos só com motor externo, sem ganchos, fora do controller (`fork` `agent/durable/durable-agent.ts:171-173,238-240`) | **nosso**, como `run-lease.ts:34-65` (`e0353c36`) |
| Guardar, copiar | `S3Client` | `git` (0029): isomorphic-git não compara a ref velha |
| Log | `loggerOptions.export`, `true` (`mastra-OfhMOKxO.js:1166-1169`) | `false`; a linha do turno |
| Avaliação | `runEvals` (`evals/run/index.d.ts:18`), `checks` | o portão |

## Os relógios: um dono cada

Nada tocado sem trabalho (§10, D27); o agendador do Mastra lê o banco a cada 10 s
(`workflows/scheduler/types.d.ts:69-71`).

| Tempo | Dono | Mecanismo |
| --- | --- | --- |
| Prazo da máquina, 1 h | `builder/machine/` | nativo: `E2BSandbox({timeout})` de `deadline_at` (`index.js:853`, `:1301`, `:1320`); `onTimeout: 'pause'` (`:744`) |
| Prazo do turno, 1 h | `builder/runs/deadline.ts` | **nosso**: `AbortSignal.timeout` chama o `abort`; `sendMessage` sem sinal (`session.d.ts:1709`); o retomado não ganha hora |
| Posse do turno | `builder/runs/lease.ts` | **nosso**, com turno aberto: renova `lease_until` a cada 30 s, vence em 90 s; na parada, zera sem assentar (C62) |
| Vencida; dormir | `builder/runs/` | `admitRun` assenta a `saving` vencida; a `open`, `resumeRuns`; após `deadline_at`, guarda; `stop()` no fim |
| Máquina após 7 dias | `builder/runs/daily.ts` | **nosso**, sem relógio: na partida e no `admitRun` após 24 h, `sweep()` |
| Cópia pendente | `builder/runs/copy-retry.ts` | **nosso**, só com pendente; a curta, nativa (`maxAttempts`) |
| E2B, R2, `git` | cada adaptador | nativos: `requestTimeoutMs`, `abortSignal`, `execFile({timeout, signal})`; `start()`, prazo externo (C57) |

## O fluxo da máquina num turno

| Fase | Mecanismo, nativo ou **nosso** | O que Ana vê | Falha, e o que ela vê |
| --- | --- | --- | --- |
| Admitir | **nosso**: `builder.run` única por Projeto, prazo, posse; `Workspace` sem ligar | "Pensando…" | outra aberta: `RUN_BUSY`, o aviso (12); posse vencida: `resumeRuns` (22) |
| Primeira ferramenta | pelo id, `reattach: 'required'`, ou do template; **nosso**: gravar o id | "Ligando a máquina… (há 4 s)" | sumida: "A máquina anterior sumiu; refiz a partir do que está guardado." (15); E2B fora: "Não consegui ligar a máquina agora. Sua conversa está guardada; tente de novo em alguns minutos." (15) |
| Semente | `onStart`: `created`, semente; `connected`, `updateNetwork`, volta ao `main`; **nosso**: o portão | "Copiando os arquivos do app…" | idem (20) |
| Trabalhar | nativas, sem aprovação; passo 100: `toolChoice: 'none'` | "Escrevendo `src/encomendas.ts`", "Rodando `npm install`… (40 s)" e 20 linhas; 60 s calado: "Ainda trabalhando… há 1 min 20 s" | o Builder lê o erro e segue; no 100, o que fez e falta (21) |
| Hub reinicia | **nosso**: a posse vence; o processo novo a toma ao partir, religa, continua | "O servidor reiniciou; continuando…" | máquina sumida: (15), segue do `main` (22) |
| Fim | `agent_end`: fim, **Parar**, erro, prazo | — | máquina caída: "A máquina caiu no meio do turno; o que não foi guardado se perdeu." (14) |
| Guardar | **nosso**: `collect`, um commit sobre a base, `fsck`, candidata, `update-ref`; `stop()` | "Versão 2 guardada: 2 arquivos mudados" | "Não consegui guardar esta versão. A anterior continua." (9) |
| Reinício ao guardar | **nosso**: o `main` contém a candidata? | — | "O turno anterior foi cortado; os arquivos dele não foram guardados." (16) |

**A continuação.** Sem os passos na memória (`savePerStep: false`, `fork` `agent-controller.ts:2063`),
o servidor manda: "O servidor reiniciou no meio do turno. Veja `git status` e termine o pedido."

## Os critérios de aceite

Pelas rotas e `main.ts`, `Machines` dublê (`LocalSandbox`; sumida, pendurada, 502), modelo
roteirizado. **Ao vivo**: o não provado. Must, salvo "should".

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova |
| --- | --- | --- | --- |
| 1 | P0 | `e2b` fora de `builder/machine/`, `infra/e2b/`; `@aws-sdk/client-s3` fora de `builder/git/copy/`; `setTimeout` fora dos donos: recusados | `scripts/rules.test.ts` |
| 2 | U1 | 0051 "proposed" antes do código: a lista de `D2`; a interface `WorkspaceFilesystem` medida e a escolha (Z2) | o registro |
| 3 | U1 | **Ao vivo**: `npm view` sim, `curl https://example.com` não; religar guarda arquivos; 200 KB intactos; sumida recusa; a marca lista as daqui; `npm ls @mastra/core`: um; duas ferramentas no primeiro passo veem a semente; o Claude real obedece `toolChoice: 'none'` | 0051 |
| 4 | U1 | **Ao vivo**: pacote apagado volta do R2 em menos de 15 min, mesmo `main`; região anotada | 0051 |
| 5 | U1 | **Ao vivo**: os termos do Hobby admitem o uso, ou volta ao fundador (should) | 0051 |
| 6 | U2 | Base velha, `gc` falho: `main` intacto; dois commits, pai errado, não regular, corrompido, 2.000 arquivos ou 64 MiB: `SAVE_REFUSED`; `git` calado no prazo: morto (C57) | `git.test.ts` |
| 7 | U2 | Imagem com `git`; volume | `deploy.test.ts` |
| 8 | U4 | Chave do E2B de arquivo; ausente, vazia, aberta: `CONFIG_INVALID` (S31); `env` vazio (S14) | `config.test.ts`, `machine.test.ts` |
| 9 | U5 | Recusa ao guardar: o texto, a árvore anterior | `runs.test.ts` |
| 10 | U4 | A varredura só toca as marcadas, sem execução aberta; sem turno, nada | `machine.test.ts` |
| 11 | U5 | Cada versão, um objeto; R2 fora: repetido até o 200; sem pendente, sem relógio | `runs.test.ts` |
| 12 | U5 | Execução aberta: mensagem no Projeto, 409 `RUN_BUSY`; outro passa | idem |
| 13 | U5 | Além de 1 h: parado, guardado; máquina com o prazo | idem |
| 14 | U5 | **Parar** ou erro após escrever: versão; máquina caída: `failed` | idem |
| 15 | U4 | Id gravado, máquina sumida: o aviso, semente do `main`; E2B calado: prazo externo, `MACHINE_UNAVAILABLE` | `machine.test.ts` |
| 16 | U5 | Reinício entre candidata e avanço: uma versão; sem candidata: `interrupted`; nada mudado: sem versão; só resposta: sem máquina | `runs.test.ts` |
| 17 | U6 | **Armadilha 1**: pela rota, `mastra_workspace_write_file` escreve no seu Projeto, não no vizinho | `workspace.test.ts` |
| 18 | U6 | **Armadilha 2**: escritas e comando sem `tool_approval_required`; `other`, `mcp` recusadas; sem as sete do controller | `permissions.test.ts` |
| 19 | U6 | `../fora.ts`, link, escrever sem ler: recusados | `workspace.test.ts` |
| 20 | U4 | Duas ferramentas no primeiro passo: a segunda vê a semente (A1); `git commit` do Builder: uma versão, mesma árvore (A4) | `machine.test.ts` |
| 21 | U6 | Modelo que sempre pede ferramenta e lê `toolChoice`: texto no passo 100, sem `abort()`, "continue" dá mais 100; skill por `createSkill`, `validateSkillContent` passa, nenhuma na máquina (A19) | `steps.test.ts`, `instructions.test.ts` |
| 22 | U7 | Dois processos, um banco; o primeiro morre: o segundo, ao partir, toma a posse, religa, continua no mesmo `deadline_at`, guarda uma versão; o primeiro não grava; no segundo, retrato e `Last-Event-ID` (só o que faltou); id alheio: o retrato (S10) | `runs-lease.test.ts` |
| 23 | U8 | Partes da 12.1 sem renomear; `kind`, `subject` de arquivo e comando; `shell` a 20 linhas, 4 KiB; segredo no comando e na saída: mascarado no stream e no `run_event`; `denied` em `other`; Diego sem os de Ana | `conversations.test.ts`, `conversation.test.tsx` |
| 24 | U5 | Apagar Projeto, pessoa, empresa: execução parada antes; máquinas, cópia, repositório, linhas; falha isolada | `runs-removal.test.ts` |
| 25 | U9 | Projeto alheio: o 404 (S10, T10); fora do `main`, ausente: `SOURCE_FILE_NOT_FOUND`; acima de 1 MiB, binário: `SOURCE_FILE_NOT_TEXT`, sem ler; estados, teclado, foco | `source.test.ts`, `.tsx` |
| 26 | U9 | 390 px, 200%, dois temas, CSP limpo (should) | navegador (T23) |
| 27 | U9 | O roteiro, com dublês, e os relógios da tela | `tests/e2e/builder-writes.test.ts` |
| 28 | U9 | **Ao vivo**: o roteiro publicado, com o reinício; o ensaio do `hub-git-restore.md`; apagar o Projeto de teste limpa tudo | firstmate, fundador (T14) |
| 29 | U10 | A linha do turno: duração, passos, tokens, fim, ferramenta e código do erro, id do pedido; texto e CPF plantados **num comando**, fora; texto num aviso do Mastra, fora do log (A2, A3, S41, S42); `by` (quem fez) nos logs de conta, Projeto, app; log rodado | `turn-log.test.ts`, `deploy.test.ts` |
| 30 | U10 | Portão "escreveu os arquivos, sem erro de ferramenta" no CI, ferramentas falsas | `builder.eval.test.ts` |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- |
| Código | "Nenhuma versão guardada ainda. Peça um app na Conversa." | a partilhada | a de `ui/` | a do Projeto | — |
| Arquivo | — | idem | idem | "Este arquivo não está nesta versão." | "Não dá para mostrar este arquivo aqui." |
| Turno | da 12.1 | as fases | do fluxo | da 12.1 | o aviso de `D5` |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `builder.run` (`person_id`: o nome no aviso); `lease_until`, `owner` | U5; U7 | U5, U7 |
| `builder.run_event` | U7 | U7 (rotas); U8 projeta |
| `builder.machine` | U4 | U4, U5 |
| partes `tool`, `shell`, `file`, `machine`, `version` | U8 | a Conversa |
| `readProjectSource`, `readProjectFile` | o Git (U2) | a aba |

## A tabela de falhas

| Gravação ou comando | Duas vezes | Recusada no meio | Dependência fora | Imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Abrir `builder.run` | índice único | uma instrução | 503 | `RUN_ADMITTED`, `RUN_BUSY` | 12 |
| Estado da execução | estado final | relida na partida | `main` intacto | `RUN_SETTLED` | 13, 14, 16 |
| Tomar ou renovar a posse | `UPDATE` condicional: um ganha | renovar falha: o turno para sem gravar | idem | `RUN_RESUMED` | 22 |
| Evento do turno | chave `(run_id, n)` | posse perdida recusa | o turno para | `RUN_LEASE_LOST` | 22 |
| Partida, pausa, varrer | idempotentes | id no gancho; pausa | `MACHINE_UNAVAILABLE` | `MACHINE_STARTED`, `_SWEPT` | 10, 15 |
| `seed`, `collect` | um por turno | `SAVE_REFUSED` | idem | — | 6, 9, 14, 20 |
| `update-ref` do `main` | a base recusa a segunda | `rev-parse` decide | — | `VERSION_SAVED` | 6, 16 |
| `gc` | trava do `git` | o próximo | anotado | `GIT_GC_FAILED` | 6 |
| PUT no R2 | mesma chave | o mesmo PUT | pendente | `GIT_COPY_PENDING`, `_DONE` | 11 |
| Remoção | idempotente | pendente da 12 | pendente | `PROJECT_SOURCE_RELEASED` | 24 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Git (613 linhas) | trazida | `builder/git/` | prazo e sinal, `-z`, não regulares | pacote e avanço por comparação (provado) |
| Filesystem, se Z2 | trazida (`SandboxFilesystem`, Apache-2.0), contada na U1 | `builder/machine/filesystem.ts` | `writeFiles()` | nenhuma |
| O resto | novo | `builder/` | — | candidata antes do `main` (D22); `env` vazio (S14); posse (`run-lease.ts`) |

**A medida do transplante.** Git: muda 20 a 30%; acima de um terço, nova.

**A dívida.** `gc` a cada 50 versões; retenção no R2 e do `run_event`.

## P0 As regras de dependência e de relógio

**Raio.** `{.dependency-cruiser.cjs,biome.json,scripts/rules.test.ts}`: muda; chama: `npm run deps`, `npm run lint`.

**Contratos.** Biome `noRestrictedGlobals` para `setTimeout`, `setInterval` em
`apps/server/src/builder/`, liberado só em `runs/{deadline,lease,copy-retry}.ts`. **Prova.** 1, em
PR próprio (L20).

## U1 Registro e prova

**Raio.** `docs/decisions/0051-*.md`, `docs/{index,architecture,roadmap}.md`: cria, muda; chama: `check-docs`.

**Contratos.** 0051: critérios 2–5, provados antes do merge. Arquitetura §3: "Git copy host" passa a R2 [0032]; §7, §10, §11. Roteiro: "Um bucket privado
no R2"; a linha da 13.1, logo após a 13. Regras: L21, T14, S40.

## U2 O Git do app e a cópia

**Raio.** `apps/server/src/builder/git/`: cria, com `copy/`; chama: U5, U9. `{apps/server/src/platform/config.ts,package.json,package-lock.json,apps/server/package.json,infra/{hub.Dockerfile,compose.yaml,deploy.sh},scripts/deploy.test.ts,docs/how-to/hub-server.md}`: `HUB_GIT_ROOT`, `HUB_GIT_COPY_BUCKET`, `HUB_GIT_COPY_KEY_FILE`; `git`, volume, pacote; chama: publicar.

**Contratos.** `openRepository({root, companyId, projectId}): Repository`, em
`<raiz>/<companyId>/<projectId>.git`: `ensure()`, `main()`, `bundleOfMain()`, `receive({runId,
bundle, base}): Result<Sha, SaveRefusal>`, `advance({candidate, base}): 'advanced' | 'stale'`,
`contains`, `tree`, `file({sha, path, maxBytes})`, `version`, `remove`; `Sha` marcado (C23).
`SaveRefusal = 'two-commits' | 'wrong-parent' | 'not-regular' | 'too-many-files' | 'too-large' |
'corrupt'`. Porto `GitCopy = {put; latest; removeProject}` (C56); chave
`git/<companyId>/<projectId>/<versão em 8 dígitos>-<sha>.bundle`.

**Ordem.** Regras: C23, C56, C57, C59, C62, S2, S31, S36. Funções: `fetch`,
`transfer.fsckObjects`, para `refs/conexus/runs/<runId>`; `update-ref refs/heads/main <nova> <base>`;
`rev-list --count`; `S3Client({region: 'auto', maxAttempts})`; `ListObjectsV2Command` com
`ContinuationToken`; `DeleteObjectsCommand` por 1.000. **Prova.** 6, 7.

## U3 Tabelas e grants

**Raio.** `apps/server/src/builder/{runs,machine}/tables.ts`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `apps/server/src/platform/catalog.test.ts`: cria; chama: U4, U5, U7.

**Contratos.** `builder.run`: `id` uuid, `company_id`, `project_id` para `hub.project`,
`person_id`; `state`: `open`, `saving`, `saved`, `unchanged`, `stopped`, `interrupted`, `failed` (C21);
`base_sha`, `candidate_sha`, `deadline_at`, `lease_until`, `owner` uuid, `copied_at`;
único parcial `(project_id) WHERE state IN ('open', 'saving')`. `builder.run_event`: `run_id`, `n`,
`event` jsonb, chave `(run_id, n)`. `builder.machine`: `project_id` chave,
`company_id`, `sandbox_id`, `used_at`. Política de linha (0039). Regras: D6, D11, D12, D15, D18.
**Prova.** 12 e o catálogo.

## U4 A máquina, a semente e o template

**Raio.** `apps/server/src/builder/machine/`: cria; chama: U5, U6, U7. `infra/e2b/template.ts`: Node 24, `git`; chama: firstmate, uma vez. `{apps/server/src/platform/config.ts,package.json,package-lock.json,apps/server/package.json,infra/compose.yaml,docs/how-to/hub-server.md,scripts/removals.json}`: `HUB_E2B_API_KEY_FILE`, `HUB_E2B_TEMPLATE`; pacotes (T12); chama: publicar.

**Contratos.** Porto `Machines = {workspaceFor({companyId, projectId, deadline, onPhase}): Workspace;
collect({projectId, base}): Bytes | 'unchanged'; list(); kill(id)}` (C56); `collect`: `git add -A`,
um commit sobre a base, qualquer que seja o `HEAD` (A4), até 64 MiB (C59).
`E2BSandbox({id, sandboxId?, reattach: 'required', template, apiKey, timeout, lifecycle: {onTimeout:
'pause'}, network: {allowOut, denyOut: [ALL_TRAFFIC]}, metadata: {conexus_origin}, onStart})`, `id`
`conexus-<projectId>`, sem `env`; marca: o host de `HUB_PUBLIC_ORIGIN`.
`Workspace({sandbox, filesystem, tools: {hooks: {beforeToolCall}}})` em `/home/user/app`;
`beforeToolCall` espera a semente, solta a fase (A1, A20). `sweep()`: `Sandbox.list` pela marca
(`e2b index.d.ts:9376`), `Sandbox.kill` (`:9601`). `MACHINE_UNAVAILABLE`, `MACHINE_REPLACED`.

**Ordem.** Regras: C50, C56, C57, C75, S14, S31, S36, S41; nenhum `logger` ao E2B.
**Prova.** 8, 10, 15, 20.

## U5 A execução e a remoção

**Raio.** `{apps/server/src/builder/runs/,apps/server/src/main.ts}`: cria, dreno (C62); chama: U7. `apps/server/src/builder/conversation/{sessions,builder}.ts`, `packages/hub-api/src/{conversations,failures}.ts`: `RUN_BUSY`, `SAVE_REFUSED` (C48); chama: `main.ts`, web. `apps/server/src/builder/runs/{removal,public}.ts`, `apps/server/src/hub/{projects/projects.ts,identity/**,operations/clients.ts}`: a porta da 12; chama: `main.ts`.

**Contratos.** `admitRun({companyId, projectId, conversationId, personId}): Result<RunId, 'busy'>`
assenta a vencida, varre após 24 h; o `workspace` do controller devolve o da execução; `finishRun({runId,
reason})` no `agent_end` guarda se mudou; `settleRuns()` na partida, nunca na parada. `ReleaseConversations` da 12 assenta e libera.

**Ordem.** Regras: C21, C62, C63, C65, D22, D25, D27, S10, T10. Funções: `onBeforeAgentEnd`
(`session.d.ts:1433`), `agent_end`, `abort`. **Prova.** 9, 11–14, 16, 24.

## U6 Permissões, instruções, skill, passos

**Raio.** `apps/server/src/builder/conversation/{permissions,instructions,builder,sessions}.ts`, `apps/server/src/builder/model-accounts/processors.ts`: cria, muda; chama: `main.ts`.

**Contratos.** `categoryOf(toolName): ToolCategory`, o resolver: ler, listar, `grep`, `file_stat`,
`web_search`, `web_fetch` → `read`; escrever, editar, `mkdir`, `delete` → `edit`; comando, processos
→ `execute`; o resto → `other`. A cada `createSession`: `read`, `edit`, `execute`
= `allow`; `mcp`, `other` = `deny`; nunca `yolo`. `disableBuiltinTools` (`types.d.ts:305`): as sete.
Sem `ast_edit`; `requireReadBeforeWrite`. Instruções: o servidor guarda a versão. `Agent.skills: [createSkill(...)]`, do `packages/app-contract`. `processInputStep` do
`accountPick`: no `stepNumber` 99, `toolChoice: 'none'` e uma frase curta; `TURN_STEPS = 100`.

**Ordem.** Regras: C75, S2, S14. **Prova.** 17–19, 21.

## U7 O turno durável

**Raio.** `apps/server/src/builder/runs/{lease,journal,resume}.ts`, `apps/server/src/builder/conversation/{live,routes}.ts`, `apps/server/src/main.ts`: cria, muda; chama: U8, a partida.

**Contratos.** `admitRun` grava `owner` e `lease_until`. `appendEvent({runId, owner, event}):
Result<Seq, 'lease-lost'>`, numa transação que confere `owner`; `readEvents({runId, after})`. O `n`
do id SSE `<turno>.<n>` é o da tabela; o retrato `turn` é a dobra dos `run_event`; o registro em
memória e o seu limite saem. Texto em pedaços de até 200 caracteres, fechados no fim da parte e no
`turnEnd`. `resumeRuns()` na partida: toma as posses vencidas, religa, continua.

**Ordem.** Regras: C21, C62, D22, D27, S10. **Prova.** 22.

## U8 O stream que escreve

**Raio.** `apps/server/src/builder/conversation/{parts,live}.ts`, `packages/hub-api/src/conversations.ts`, `apps/web/src/builder/conversation/`: muda; chama: rotas.

**Contratos.** A 12.1, sem renomear. `tool.kind` ganha `write_file`, `edit_file`, `run_command`;
`tool.subject`, `{path} | {command}`, analisado (C27), 200 caracteres, pelo filtro; `tool.state`,
`denied` (`tool_end.denied`); `shell {toolId, lines, exitCode}` de `shell_output`, a
20 linhas e 4 KiB, pelo filtro de segredos; `file {path, operation}` do `afterToolCall`; `machine {phase: starting | waking | copying | replaced | resumed |
saving}`; `version {number, changed}`. `approval` não nasce: nenhuma regra é `ask` (`D7`). Sem
`display_state_changed`.

**Ordem.** Regras: C28, C59, S39, W9, V35, V39. **Prova.** 23.

## U9 Aba Código e percurso

**Raio.** `apps/server/src/builder/git/{routes,public}.ts`, `packages/hub-api/src/{source,failures,index}.ts`: cria, muda; chama: web, OpenAPI. `apps/web/src/builder/source/` e a rota da aba nas abas da 12.2; chama: `routeTree.gen.ts`. `{tests/e2e/builder-writes.test.ts,package.json,docs/how-to/hub-git-restore.md,docs/index.md}`: percurso, volta da cópia (L23); chama: `npm run e2e`.

**Contratos.** Sob `/api/companies/{companyId}/projects/{projectId}`, acesso `MEMBER`:
`readProjectSource` `GET /source` → `{version, commit, savedAt, files: [{path, bytes}]}`, até 2.000
(C44); `readProjectFile` `GET /source/file?commit&path` → `{text}`,
1 MiB por `cat-file -s` antes de ler; 404 `SOURCE_FILE_NOT_FOUND`, 422 `SOURCE_FILE_NOT_TEXT` (C48).

**Ordem.** Regras: C28, C36, C44, C59, S2, S10, W8, W9, W17, V29–V31. **Prova.** 25–27; 28 após o
Release (T14).

## U10 A linha do turno, `by`, avaliação

**Raio.** `apps/server/src/builder/conversation/{turn-log,logger,builder,sessions,builder.eval.test}.ts`: cria, muda; chama: `main.ts`, CI. `apps/server/src/builder/model-accounts/routes.ts`, `apps/server/src/hub/{projects/routes.ts,apps/**}`, `{infra/compose.yaml,package.json,package-lock.json,apps/server/package.json}`: `by`; rotação; `@mastra/evals`; chama: publicar.

**Contratos.** `new Mastra({loggerOptions: {export: false}})`, sem `@mastra/observability`.
`sendMessage({tracingOptions: {traceId}})`, o id do pedido sem traços
(`observability/types/tracing.d.ts:1905-1908`). `TurnLine = {runId, traceId, ms, steps, tokens,
end, failedTool?, errorCode?}`, campo a campo, nunca argumentos. O `traceId` vai na `TurnLine`;
`__attachObservability` só se a U1 provar que o core o chama sem `@mastra/observability`. `runEvals`: `calledTool`,
`noToolErrors`, `unmockedToolPolicy: 'deny'`. Compose: `logging: {driver: json-file, options:
{max-size, max-file}}`.

**Ordem.** Regras: S41, S42, C50, D27. **Prova.** 29, 30.
