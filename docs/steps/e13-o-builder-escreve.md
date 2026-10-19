# Etapa 13: O Builder escreve

## A página do fundador

**No fim desta etapa** você pede um app ao Builder, vê cada arquivo e comando enquanto ele trabalha,
e no fim do turno os arquivos ficam guardados numa versão que a aba **Arquivos** mostra.

**O roteiro de uso.** Padaria Sol: Ana e Diego membros; Empresa B à parte.

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
instalação (a limpeza do conexus-os apagou máquinas com a chave dividida); um bucket privado no
R2 com uma chave só dele; e autoriza as chamadas reais de U1 ao E2B e ao R2. No começo: aprova esta
página. No fim: faz o roteiro e aprova os textos.

**As suas respostas.** `F1` A: o motor é nosso, com quatro padrões do Factory; a 0027 fica. `D2` A: rede fechada, só o npm e o que a instalação provar. `D3` A: um pacote do Git por versão
no R2. `D4` A: uma versão por turno que mudou arquivos. `D5` A: uma execução por Projeto. `D6` A:
uma conversa só; a máquina liga só numa ferramenta de arquivo ou comando. `D8`: a conta grátis.

**As duas leituras que você confirmou** (2026-10-19):

- **Git no servidor (0029) com a cópia no R2**; "Levar para o meu GitHub" vem depois da etapa 23,
  como pedido próprio: "1. Okay". O roteiro troca "Um Git privado" por "Um bucket privado no R2" e
  põe "Levar o app para o GitHub da pessoa" fora do lançamento.
- **`D7`, regras fixas e nativas do Mastra**: ler, editar e rodar comando, sim; o resto, não; nenhuma
  escolha na tela: "2. Okay, sem complicar, pelo menos a primeiro momento".

**Os limites que o cartão fixa.** Um turno dura até 1 hora, o teto do plano grátis. Uma versão tem
até 2.000 arquivos e 64 MiB, e a máquina parada há 7 dias é apagada, como no código antigo. A aba
mostra arquivos até 1 MiB; a conversa, as 20 últimas linhas de um comando. Mudar um é pedido seu.

**Fica de fora.** Preview, painel ao vivo, diferença entre versões, as skills completas (14);
retomar um turno cortado por atualização (16); fila de mensagens (`D5` B); levar ao GitHub. Issues
`next-card` 25, 39, 45: outras pastas.

**A decisão sua pedida nesta etapa.** Nenhuma.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| P0 | Regras de dependência | `.dependency-cruiser.cjs` | — | — | — |
| U1 | Registro 0051, prova ao vivo | `docs/` | testes | mastra | P0 |
| U2 | O Git do app | `builder/git/`, `infra/` | dados | node | U1 |
| U3 | O adaptador do R2 | `builder/git/copy/` | segurança | — | U2 |
| U4 | Tabelas e grants | migrações | dados | neon:neon-postgres | U1 |
| U5 | Máquina e template | `builder/machine/`, `infra/e2b/` | segurança | mastra | U3, U4 |
| U6 | A execução | `builder/runs/` | dados | mastra | U5 |
| U7 | Permissões, instruções | `builder/conversation/` | segurança | mastra | U6 |
| U8 | O stream | `builder/conversation/`, web | código | mastra | U7 |
| U9 | Remoção | `builder/runs/`, `hub/` | dados | — | U6 |
| U10 | Aba Arquivos, percurso | `builder/git/`, web | web | fastify-best-practices, shadcn | U2 |

P0 antes (L20); U1, documentos, antes do código; U4 em PR próprio (D11). U2, U3, U5 mudam
`platform/config.ts`: em série. Em paralelo: U10 com U4–U9; U9 com U7–U8.

**Orçamento de código alterado** (sem testes nem gerados): P0 15; U2 480; U3 200; U4
120; U5 470; U6 680; U7 200; U8 330; U9 170; U10 780. Total **3.445**, teto 4.000 (L2); acima, U10
vira etapa 13.1.

## O que é nativo e o que é nosso

Fixado: `@mastra/core` 1.78.0, `@mastra/e2b` 0.14.1, `@mastra/code-sdk` 1.14.0, `e2b` 2.56.0,
`@aws-sdk/client-s3` 3.1146.0. Linhas do `dist/` publicado.

| Mecanismo | Nativo | Nosso, e por quê |
| --- | --- | --- |
| Arquivo e comando | `Workspace`, `WORKSPACE_TOOLS` (`workspace-BojqafFG.js:7281`) | nada |
| Workspace no turno | `AgentController({workspace: fn})` (`agent-controller/types.d.ts:244`) | o mapa por Projeto; `createSession({workspace})` (`agent-controller.d.ts:117`) não chega ao turno (provado) |
| Máquina | `E2BSandbox`: `reattach: 'required'` (`e2b index.js:1265`), `network` (`:852`), pausa (`:744`), `template` | gravar o id; recriar do Git |
| Rede | `allowOut`, `denyOut` (`e2b index.d.ts:2671-2678`) | a lista (`D2`) |
| Prazo | `setTimeout` (`e2b index.d.ts:10812`); o Mastra só o manda ao criar (`index.js:853`) | estender no turno |
| Permissão | `PermissionRules` (`types.d.ts:364-376`), `setForCategory` (`session.d.ts:1101`), `resolveToolApproval` (`agent-controller-DRiP9C5v.js:4982`) | o `toolCategoryResolver` (`types.d.ts:311`): sem ele, tudo pergunta (`:8096`) |
| Guardar | — | `git` (0029); isomorphic-git não compara a ref velha |
| Cópia | `S3Client` do R2 | a chave, o pendente |
| Estado da máquina | `workspace_status_changed` (`types.d.ts:781`), nunca emitido | o motor |

## O fluxo da máquina num turno

O relógio é da tela, desde o evento da fase.

| Fase | Mecanismo, nativo ou **nosso** | O que Ana vê | Falha, e o que ela vê |
| --- | --- | --- | --- |
| Admitir | **nosso**: `builder.run` aberta, única por Projeto, prazo de 1 h | "Pensando…" | outra aberta: 409 `RUN_BUSY`, o aviso (14); vencida: assentada antes (15) |
| Ligar | `E2BSandbox.start()` pelo id gravado, `reattach: 'required'`; sem id, do template; **nosso**: gravar o id | "Ligando a máquina… (há 4 s)", ou "Acordando…" | sumida: **nosso**, cria outra, "A máquina anterior sumiu; refiz a partir do que está guardado." (17); E2B fora: "Não consegui ligar a máquina agora. Sua conversa está guardada; tente de novo em alguns minutos." (18) |
| Prazo | **nosso**: `setTimeout` | nada | passou: `abort`, e guarda (15) |
| Copiar | **nosso**: `seed` se a máquina é nova ou difere do `main` | "Copiando os arquivos do app…" | idem |
| Trabalhar | ferramentas nativas, sem aprovação (`D7`) | "Escrevendo…" e o caminho; "Rodando `npm install`… (40 s)" e 20 linhas; 60 s calado: "Ainda trabalhando… há 1 min 20 s" | o Builder lê o erro e segue |
| Fim | `agent_end`: **Parar**, erro, prazo | — | máquina caída: "A máquina caiu no meio do turno; o que não foi guardado se perdeu." (16) |
| Guardar | **nosso**: `collect`, `fsck`, candidata gravada, `update-ref` com a base | "Guardando…", "Versão 2 guardada: 2 arquivos mudados" | "Não consegui guardar esta versão. A anterior continua." (11) |
| Copiar fora | **nosso**: PUT no R2 | nada | pendente, repete (13) |
| Dormir | `Workspace.stop()` | nada | — |
| Reinício | **nosso**: "o `main` contém a candidata?" | a última versão | sem candidata: "O turno anterior foi cortado; os arquivos dele não foram guardados." (19) |

## Os remendos antigos (`e0353c36`)

**Nativos agora, não voltam:** 2 `tripwire` (o controller); 3 máquina por conversa (o `E2BSandbox`, agora
por Projeto); 4 "encarnação" (`reattach: 'required'`, `onStart({outcome})`); 9
sessões acumulando (`deleteSession`, dono na 12); 10 pergunta perdia a máquina (partida preguiçosa);
13 SSE à mão (eventos do controller); 15 duas máquinas (`template`); 16 root (usuário `user` do
E2B). **Sai:** 8, o registro de rede, que nunca funcionou (`allowOut`). **Ficam nossos, porque o Mastra e o E2B não
têm:** 1 `holdOpen` (um `setTimeout` por turno); 5 ordem da remoção (`kill` é nativo); 6 varredura,
só com a marca desta instalação; 7 teto do pacote (C59); 11 execução presa (prazo e assentar;
batimento na 16); 12 e 14, da 12.

## Os critérios de aceite

`npm run test -w @conexus/server`, pelas rotas e `main.ts`, com o porto `Machines` dublê
(`LocalSandbox`; sumida, pendurada, 502) e modelo roteirizado. **Ao vivo**: o não provado no estudo.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | P0 | `e2b`, `@mastra/e2b` fora de `builder/machine/` e `infra/e2b/`; `@aws-sdk/client-s3` fora de `builder/git/copy/`: `npm run deps` recusa | `scripts/rules.test.ts` | must |
| 2 | U1 | 0051 "proposed" antes do código | o registro | must |
| 3 | U1 | **Ao vivo**: `npm view` responde, `curl https://example.com` não; religar guarda os arquivos; 200 KB, mesmos bytes; sumida, `reattach: 'required'` recusa; a marca lista só as daqui | 0051 | must |
| 4 | U1 | **Ao vivo**: Git apagado volta do R2 em menos de 15 min, mesmo `main` (0029); região anotada | 0051 | must |
| 5 | U1 | **Ao vivo**: os termos do Hobby admitem o uso; senão, volta ao fundador | 0051 | should |
| 6 | U2 | Avanço com base velha: recusado, `main` intacto | `git.test.ts`, por `public.ts` | must |
| 7 | U2 | Dois commits, pai errado, link ou não regular, corrompido, mais de 2.000 arquivos, pacote acima de 64 MiB: `SAVE_REFUSED` | idem | must |
| 8 | U2 | `git` sem resposta no prazo: morto, falha com nome (C57) | idem | must |
| 9 | U2 | A imagem tem `git`; o volume é do usuário `node` | `deploy.test.ts` | must |
| 10 | U5 | Chave do E2B só de arquivo; ausente, vazia ou aberta a outros: `CONFIG_INVALID` (S31; teste 12 do Builder); `env` vazio na máquina (S14) | `config.test.ts`, `machine.test.ts` | must |
| 11 | U6 | Recusa ao guardar: o texto; a árvore lida é a anterior | `runs.test.ts` | must |
| 12 | U5 | A varredura só toca máquinas com a marca e sem execução aberta (achado 1) | `machine.test.ts` | must |
| 13 | U6 | Cada versão, um objeto no R2; R2 fora: pendente, repetido, sai após o 200; sem pendente, nenhum relógio (D27) | `runs.test.ts` | must |
| 14 | U6 | Segundo turno no Projeto, de qualquer conversa: 409 `RUN_BUSY`; outro Projeto passa | idem | must |
| 15 | U6 | Turno além de 1 h: parado e guardado; execução vencida não bloqueia | idem | must |
| 16 | U6 | **Parar** ou erro do modelo após escrever: versão; máquina caída: `failed`, o texto | idem | must |
| 17 | U5 | Id gravado e máquina sumida: nenhuma criação calada; o aviso, cópia do `main` | `machine.test.ts` | must |
| 18 | U5 | E2B sem resposta: prazo por chamada, `MACHINE_UNAVAILABLE` (achados 7, 8) | idem | must |
| 19 | U6 | Reinício entre candidata e avanço: uma versão; sem candidata: `interrupted`, o aviso, a sobra fora | `runs.test.ts` | must |
| 20 | U6 | Sem arquivo mudado: nenhuma versão; só resposta: nenhuma máquina | idem | must |
| 21 | U7 | **Armadilha 1**: um turno pela rota recebe `mastra_workspace_write_file` e escreve no seu Projeto, não no vizinho | `workspace.test.ts` | must |
| 22 | U7 | **Armadilha 2**: três escritas e um comando, nenhum `tool_approval_required`; `other`, `mcp` recusadas; nenhuma das sete do controller | `permissions.test.ts` | must |
| 23 | U7 | `../fora.ts`, link: recusado; escrever sem ler: recusado | `workspace.test.ts` | must |
| 24 | U8 | Os cinco eventos da 12 iguais; saída a 20 linhas e 4 KiB; Diego sem os de Ana; a tela mostra fases, relógio, versão | `conversations.test.ts`, `conversation.test.tsx` | must |
| 25 | U9 | Apagar Projeto, pessoa ou empresa: máquinas, cópia, repositório, linhas; falha numa, as outras seguem; vizinho intocado (teste 11 do Builder, achado 3) | `runs-removal.test.ts` | must |
| 26 | U10 | Outra empresa, Projeto alheio: o 404 do Projeto (S10, T10); commit fora do `main`, caminho ausente: `SOURCE_FILE_NOT_FOUND`; acima de 1 MiB ou binário: `SOURCE_FILE_NOT_TEXT`, sem ler | `source.test.ts` | must |
| 27 | U10 | A aba: estados, teclado, foco | `source.test.tsx` | must |
| 28 | U10 | 390 px, 200%, dois temas, sem erro de CSP | navegador (T23) | should |
| 29 | U10 | O roteiro, com dublês | `tests/e2e/builder-writes.test.ts` | must |
| 30 | U10 | **Ao vivo**: publicado, o roteiro, máquina real | firstmate, fundador (T14) | must |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- |
| Arquivos | "Nenhuma versão guardada ainda. Peça um app na Conversa." | a partilhada | a de `ui/` | a do Projeto | — |
| Arquivo | — | idem | idem | "Este arquivo não está nesta versão." | "Não dá para mostrar este arquivo aqui." |
| Turno que escreve | da 12 | as fases | os textos do fluxo | da 12 | o aviso de `D5` |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `builder.run`: todos | U6 | U6 (admitir, assentar, repetir, o nome no aviso), U9 |
| `builder.machine`: todos | U5 | U5, U9 |
| eventos `machine`, `output`, `exit`, `saved` | U8 | a Conversa; `saved`, a aba |
| `version`, `commit`, `savedAt`, `files[]`, `text` | o Git (U2) | a aba |

## A tabela de falhas

| Gravação ou comando | Duas vezes | Recusada no meio | Dependência fora | Imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Abrir `builder.run` | índice único | uma instrução | 503 | `RUN_ADMITTED`, `RUN_BUSY` | 14 |
| Estado da execução | estado final | relida na partida | `main` intacto | `RUN_SETTLED` | 15, 16, 19 |
| `builder.machine`, ligar, estender, pausar | chave por Projeto; idempotentes | id gravado antes da ferramenta; o prazo pausa | `MACHINE_UNAVAILABLE` | `MACHINE_STARTED`, `_PAUSED` | 17, 18 |
| `seed`, `collect` | um por turno | `SAVE_REFUSED` | idem | — | 7, 16 |
| `ensure`, `fetch` com `fsck` | ref por execução | ref descartável | `SAVE_REFUSED` | `SAVE_REFUSED` | 7 |
| `update-ref` do `main` | a base recusa a segunda | `rev-parse` decide | — | `VERSION_SAVED` | 6, 19 |
| `gc` | trava do `git` | o próximo | anotado | `GIT_GC_FAILED` | 8 |
| PUT no R2 | mesma chave | o mesmo PUT | pendente | `GIT_COPY_PENDING`, `_DONE` | 13 |
| Varrer | idempotente | a próxima | anotado | `MACHINE_SWEPT` | 12 |
| Remoção | idempotente | pendente da 12 | pendente | `PROJECT_SOURCE_RELEASED` | 25 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Git (`conexus-git.ts` e dois: 613) | trazida | `builder/git/` | prazo e sinal em todo `git`, `-z`, não regulares, trava recuperada | pacote e avanço por comparação: seria escrito assim (provado) |
| Motor (`run/**`: 2.226) | nova | `builder/runs/` | — | candidata antes do `main` (D22) |
| Máquina (341) | nova | `builder/machine/` | — | ambiente vazio (S14) |
| Prompt (167) | nova | `instructions.ts` | — | honestidade, português, sem inventar: produto |
| Skill da forma do app; cópia | novas | `skills/`; `builder/git/copy/` | — | "um só `db.batch`" (0045, 0047) |

**A medida do transplante.** Git: 20 a 30% muda, por leitura; o build mede, e acima de um terço vira
nova. Os 22 casos antigos entram pela porta pública.

**A dívida.** `gc` sem agenda: no salvar, a cada 50 versões.

## P0 As regras de dependência

### O raio da mudança

| Arquivo ou pasta | Cria, muda ou apaga | Quem chama |
| --- | --- | --- |
| `.dependency-cruiser.cjs`, `scripts/rules.test.ts` | muda | `npm run deps` |

**Prova.** 1, em PR próprio (L20).

## U1 Registro e prova

### O raio da mudança

| Arquivo ou pasta | Cria, muda ou apaga | Quem chama |
| --- | --- | --- |
| `docs/decisions/0051-*.md`, `docs/{index,architecture,roadmap}.md` | cria, muda | `check-docs` |

**Contratos.** 0051, Criterion com os critérios 3–5; a prova roda fora do repositório, com o
template de U5. Arquitetura §3: "Git copy host" passa a R2, fora do Brasil [0032]; §7, §11.
Roteiro: as mudanças da página. Regras: L21, T14, S40.

## U2 O Git do app

### O raio da mudança

| Arquivo ou pasta | Cria, muda ou apaga | Quem chama |
| --- | --- | --- |
| `apps/server/src/builder/git/` | cria | U6, U9, U10 |
| `apps/server/src/platform/config.ts`, `infra/{hub.Dockerfile,compose.yaml,deploy.sh}`, `scripts/deploy.test.ts` | `HUB_GIT_ROOT`, `git`, volume | publicar |

**Contratos.** `openRepository({root, companyId, projectId}): Repository`, em
`<raiz>/<companyId>/<projectId>.git`: `ensure()`, `main()`, `bundleOfMain()`, `receive({runId,
bundle, base}): Result<Sha, SaveRefusal>`, `advance({candidate, base}): 'advanced' | 'stale'`,
`contains(sha)`, `tree(sha)`, `file({sha, path, maxBytes})`, `version(sha)`, `remove()`. `Sha`
marcado (C23). `SaveRefusal = 'two-commits' | 'wrong-parent' | 'not-regular' | 'too-many-files' |
'too-large' | 'corrupt'`.

**Ordem.** Regras: C23, C57, C59, C62, S2. Funções: `bundle`; `fetch` com `transfer.fsckObjects`
para `refs/conexus/runs/<runId>`; `update-ref refs/heads/main <nova> <base>`; `ls-tree -z`; `cat-file`;
`rev-list --count`.

**Prova.** 6–9.

## U3 O adaptador do R2

### O raio da mudança

| Arquivo ou pasta | Cria, muda ou apaga | Quem chama |
| --- | --- | --- |
| `apps/server/src/builder/git/copy/` | cria | U6, U9 |
| `apps/server/src/platform/config.ts`, `package.json`, `package-lock.json`, `apps/server/package.json`, `infra/compose.yaml`, `docs/how-to/hub-server.md` | `HUB_GIT_COPY_BUCKET`, `HUB_GIT_COPY_KEY_FILE`; o pacote | publicar |

**Contratos.** Porto `GitCopy = {put({companyId, projectId, version, sha, bundle}); latest({companyId,
projectId}); removeProject({companyId, projectId})}`, um adaptador (C56); o pendente é de U6. Chave
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
`person_id`; `state` em `open | saving | saved | unchanged | stopped | interrupted | failed` (C21);
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

**Contratos.** Porto `Machines = {open({companyId, projectId}): Promise<Machine>; list(); kill(id)}`
(C56). `Machine = {workspace; sandboxId; outcome; extendTo(deadline); seed(bundle); collect({base}):
Bytes | 'unchanged'; pause()}`; `collect` faz o commit e lê o pacote até 64 MiB (C59).
`E2BSandbox({id: 'conexus-<projectId>', sandboxId?, reattach: 'required', template, apiKey,
network: {allowOut: ['registry.npmjs.org', …], denyOut: ['0.0.0.0/0']}, metadata: {conexus_origin, project_id}})`, sem `env`; a marca é o host de `HUB_PUBLIC_ORIGIN`.
`Workspace({sandbox, filesystem: SandboxFilesystem, tools})` em `/home/user/app`; o filesystem
(`code-sdk agents/sandbox-filesystem.js:39`) recusa sair da raiz. `sweepMachines()`:
`Sandbox.list` pela marca (`e2b index.d.ts:9376`), `Sandbox.kill` (`:9601`): órfãs e paradas há 7
dias; na partida, e diária só com máquina gravada (D27). Falhas `MACHINE_UNAVAILABLE`, `MACHINE_REPLACED` (C48).

**Ordem.** Regras: C50, C56, C57, C59, C75, S14, S31, S36, S41. Funções: `requestTimeoutMs` por
chamada; nenhum `logger` ao SDK do E2B.

**Prova.** 10, 12, 17, 18.

## U6 A execução

### O raio da mudança

| Arquivo ou pasta | Cria, muda ou apaga | Quem chama |
| --- | --- | --- |
| `apps/server/src/builder/runs/` | cria | `main.ts`, U8, U9 |
| `apps/server/src/builder/conversation/{sessions,builder}.ts`, `packages/hub-api/src/{conversations,failures}.ts` | admitir, `workspace`, guardar; `RUN_BUSY`, `SAVE_REFUSED` (C48) | `main.ts`, web |
| `apps/server/src/main.ts` | assentar; guardar no dreno (C62) | — |

**Contratos.** `admitRun({companyId, projectId, conversationId, personId}): Result<RunId, 'busy'>`,
que antes assenta a vencida; `workspaceFor(requestContext): Workspace | undefined`, para
`AgentController({workspace})`; `finishRun({runId, reason})` no `agent_end`, que guarda se a árvore
mudou (`D4`); `settleRuns()`; a repetição da cópia, com relógio só havendo pendente.

**Ordem.** Regras: C21, C62, C63, C65, D22, D25, D27. Funções: `onBeforeAgentEnd` (`session.d.ts:1433`),
`agent_end`, `abort`.

**Prova.** 11, 13–16, 19, 20.

## U7 Permissões, instruções, skill

### O raio da mudança

| Arquivo ou pasta | Cria, muda ou apaga | Quem chama |
| --- | --- | --- |
| `apps/server/src/builder/conversation/{permissions,instructions,builder,sessions}.ts`, `apps/server/src/builder/conversation/skills/` | cria, muda | `main.ts` |

**Contratos.** `categoryOf(toolName): ToolCategory`, o `toolCategoryResolver`: ler, listar, `grep`,
`file_stat` e as `web_search`, `web_fetch` da 12 (no Hub, fora da máquina) → `read`; escrever,
editar, `mkdir`, `delete` → `edit`; `execute_command`, `get_process_output`, `kill_process` →
`execute`; o resto → `other`, nunca `null`. A cada `createSession`, pois as regras vivem em
memória: `read`, `edit`, `execute` = `allow`; `mcp`, `other` = `deny`; nunca `yolo`.
`disableBuiltinTools` (`types.d.ts:305`): as sete. `Workspace`: sem `ast_edit`; `requireReadBeforeWrite` em escrever e
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
`{type: 'exit'; callId; code}`, `{type: 'saved'; version; changed}`. Fontes: `tool_input_start`,
`tool_start`, `shell_output`, `command_exit`, o motor. Nunca `display_state_changed`, que acumula a
saída sem teto, nem `modifiedFiles`, vazio para `mastra_workspace_write_file`.

**Ordem.** Regras: C28, C59, S39, W9, V35, V39.

**Prova.** 24.

## U9 Remoção

### O raio da mudança

| Arquivo ou pasta | Cria, muda ou apaga | Quem chama |
| --- | --- | --- |
| `apps/server/src/builder/runs/{removal,public}.ts`, `apps/server/src/hub/{projects/projects.ts,identity/**,operations/clients.ts}` | cria; a porta da 12 | `main.ts` |

**Contratos.** `ReleaseConversations` da 12 libera também máquinas, cópia, repositório e
execuções, nessa ordem; falha: as pendentes da 12.

**Ordem.** Regras: D22, S10, T10.

**Prova.** 25.

## U10 Aba Arquivos e percurso

### O raio da mudança

| Arquivo ou pasta | Cria, muda ou apaga | Quem chama |
| --- | --- | --- |
| `apps/server/src/builder/git/{routes,public}.ts`, `packages/hub-api/src/{source,failures,index}.ts` | cria, muda | web, OpenAPI |
| `apps/web/src/builder/source/`, `apps/web/src/routes/_app/companies/$companyId/projects/$projectId.{files,}.tsx` | a aba | `routeTree.gen.ts` |
| `tests/e2e/builder-writes.test.ts`, `package.json`, `docs/how-to/hub-git-restore.md`, `docs/index.md` | percurso; volta da cópia, em português (L23) | `npm run e2e` |

**Contratos.** Sob `/api/companies/{companyId}/projects/{projectId}`, acesso `MEMBER`:
`readProjectSource` `GET /source` → `{version, commit, savedAt, files: [{path, bytes}]}`, limitada
pelo teto de 2.000 (C44), `version: null` sem versão; `readProjectFile` `GET
/source/file?commit&path` → `{text}`, 1 MiB por `cat-file -s` antes de ler; 404
`SOURCE_FILE_NOT_FOUND`, 422 `SOURCE_FILE_NOT_TEXT` (C48).

**Ordem.** Regras: C28, C36, C44, C59, S2, S9, S10, W1, W8, W9, W17, V29–V31, V35.

**Prova.** 26–28; 29, `npm run e2e`; 30 após o Release (T14).
