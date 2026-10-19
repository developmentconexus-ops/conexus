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
5. "O que falta no app?": ele só responde, sem ligar a máquina e sem versão nova.
6. Na **Empresa B**, a aba Arquivos da Padaria dá "não encontrado".

O firstmate, ao vivo: a máquina instala do npm e não alcança outro site; apaga o Git de um Projeto
de teste e o traz do R2 em menos de 15 minutos; apaga o Projeto e some tudo, também a máquina e a
cópia.

**O que você faz, e quando.** Antes de U1: na sua conta grátis do E2B, uma chave nova só desta
instalação (a do conexus-os não serve: a limpeza de lá apagou máquinas daqui); um bucket privado no
R2 e uma chave que só alcança ele; e autoriza as chamadas reais de U1 ao E2B e ao R2. No começo:
aprova esta página. No fim: faz o roteiro e aprova os textos.

**As suas respostas.** `F1` A: o motor é nosso e pequeno, com quatro padrões do Factory; a 0027
fica. `D2` A: rede fechada, só o npm e o que a instalação provar. `D3` A: um pacote do Git por versão
no R2. `D4` A: uma versão por turno que mudou arquivos. `D5` A: uma execução por Projeto. `D6` A:
uma conversa só; a máquina liga só numa ferramenta de arquivo ou comando. `D8`: a conta grátis.

**As duas leituras que você confirmou** (2026-10-19):

- **Git no servidor (0029) com a cópia no R2**; "Levar para o meu GitHub" vem depois da etapa 23,
  como pedido próprio: "1. Okay". O roteiro troca "Um Git privado" por "Um bucket privado no R2" e
  põe "Levar o app para o GitHub da pessoa" no que fica fora do lançamento.
- **`D7`, regras fixas e nativas do Mastra**: ler, editar e rodar comando, sim; o resto, não; nenhuma
  escolha na tela: "2. Okay, sem complicar, pelo menos a primeiro momento".

**Fica de fora.** Preview, painel ao vivo, diferença entre versões e as skills completas (14);
retomar um turno cortado (16); fila de mensagens (`D5` B); levar ao GitHub. Issues `next-card` 25,
39, 45: outras pastas.

**A decisão sua pedida nesta etapa.** Nenhuma.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| P0 | Regras `e2b-only-in-machine`, `s3-only-in-copy` | `.dependency-cruiser.cjs` | código | — | — |
| U1 | Registro 0051, template, prova ao vivo | `docs/`, `infra/e2b/` | testes | mastra | P0 |
| U2 | O Git do app | `builder/git/`, `infra/` | dados | node | P0 |
| U3 | A cópia no R2 | `builder/git/copy/` | segurança | — | U2 |
| U4 | Tabelas e grants | migrações, grants | dados | neon:neon-postgres | U1 |
| U5 | A máquina | `builder/machine/` | segurança | mastra | U4 |
| U6 | A execução | `builder/runs/`, `conversation/` | dados | mastra | U2, U5 |
| U7 | Permissões, instruções, skill | `conversation/` | segurança | mastra | U5 |
| U8 | O stream que escreve | `conversation/`, `hub-api`, web | código | mastra | U6 |
| U9 | Remoção (teste 11) | `builder/runs/`, `hub/` | dados | — | U3, U6 |
| U10 | Rotas e aba Arquivos | `builder/git/`, `hub-api`, web | web, design | fastify-best-practices, shadcn | U2 |
| U11 | Percurso, ensaio, how-to | `tests/e2e/`, `how-to/` | testes | — | U10 |

P0 antes (L20); U4 em PR próprio (D11); U2 e U5, depois U3, U7 e U10, em paralelo; uma revisão,
um merge (L9, L13).

**Orçamento de código alterado** (sem testes nem gerados, por leitura): P0 15; U2 480; U3 230; U4
120; U5 420; U6 620; U7 200; U8 330; U9 170; U10 760; U11 60. Total **3.405**, teto 4.000 (L2). O
risco está em U6 e U10; se o build medir mais de 4.000, U10 sai como etapa 13.1.

## O que é nativo e o que é nosso

Fixado: `@mastra/core` 1.78.0, `@mastra/e2b` 0.14.1, `@mastra/code-sdk` 1.14.0, `e2b` 2.56.0,
`@aws-sdk/client-s3` 3.1146.0; o `git` da imagem. Linhas do `dist/` publicado; nomes no Context7
(`/mastra-ai/mastra`, `/cloudflare/cloudflare-docs`).

| Mecanismo | Nativo | Nosso, e por quê |
| --- | --- | --- |
| Arquivo e comando | `Workspace({sandbox, filesystem, tools})`, `WORKSPACE_TOOLS` (`workspace-BojqafFG.js:7281`) | nada |
| Workspace no turno | `AgentController({workspace: fn})` (`agent-controller/types.d.ts:244`) | o mapa Projeto → `Workspace`; `createSession({workspace})` (`agent-controller.d.ts:117`) não chega ao turno (provado) |
| Arquivos na máquina | `SandboxFilesystem` (`code-sdk agents/sandbox-filesystem.js:39`): recusa sair da raiz e link | nada |
| Máquina | `E2BSandbox`: `sandboxId`, `reattach: 'required'` (`e2b index.js:1265`), `network` (`:743`, `:852`), pausa no prazo (`:744`), `template` | gravar o id; recriar do Git (0027) |
| Rede | `allowOut` por domínio, `denyOut` por faixa (`e2b index.d.ts:2671-2678`) | a lista (`D2`) |
| Prazo | `instance.setTimeout(ms)` (`e2b index.d.ts:10812`); o Mastra só o manda ao criar (`index.js:853`) | estender no turno |
| Permissão | `ToolCategory`, `PermissionRules` (`types.d.ts:364-376`); `setForCategory` (`session.d.ts:1101`); `resolveToolApproval` (`agent-controller-DRiP9C5v.js:4982`) | o `toolCategoryResolver` (`types.d.ts:311`): sem ele, tudo cai em "perguntar" (`:8096`, `:4995`) |
| Ferramentas do controller | `disableBuiltinTools` (`types.d.ts:305`) | as sete fora |
| Fim do turno | `onBeforeAgentEnd` (`session.d.ts:1433`), `agent_end` | guardar |
| Instruções e skill | `instructions` por função; `skills` com `InlineSkillSource` | o texto |
| Guardar | — | `git` na linha de comando (0029); isomorphic-git não compara a ref velha |
| Cópia | `S3Client` do R2, `region: 'auto'` | a chave do objeto, o pendente |
| Estado da máquina | `workspace_status_changed` declarado (`types.d.ts:781`), nunca emitido | o motor emite |
| Uma execução por Projeto | o Factory não tem | índice único parcial (0027) |

## O fluxo da máquina num turno

O texto é o que Ana vê; o relógio conta desde o começo da fase.

| Fase | Mecanismo, nativo ou **nosso** | O que Ana vê | Falha, e o que ela vê |
| --- | --- | --- | --- |
| Admitir | **nosso**: `builder.run` aberta, única por Projeto | "Pensando…" | outra aberta: 409 `RUN_BUSY`, o aviso de `D5`, texto no campo (14) |
| Só responder | nativo: a máquina é preguiçosa | a resposta; sem versão | — |
| Ligar | `E2BSandbox.start()` pelo `sandboxId` gravado, `reattach: 'required'`; sem id, do template; **nosso**: gravar o id antes da primeira ferramenta | "Ligando a máquina… (há 4 s)", ou "Acordando…" | sumida: **nosso**, apaga o id, cria, "A máquina anterior sumiu; refiz a partir do que está guardado." (16); E2B fora: `MACHINE_UNAVAILABLE`, "Não consegui ligar a máquina agora. Sua conversa está guardada; tente de novo em alguns minutos." (17) |
| Prazo | **nosso**: `setTimeout` uma vez, ao teto do turno | nada | — |
| Copiar | **nosso**: só se a máquina é nova ou o `HEAD` dela difere do `main`; pacote, `files.write`, `git clone` | "Copiando os arquivos do app…" | `MACHINE_UNAVAILABLE` |
| Trabalhar | ferramentas nativas, sem aprovação (`D7`) | "Escrevendo um arquivo…", depois o caminho; "Rodando `npm install`… (40 s)" e 20 linhas; 60 s calado: "Ainda trabalhando… há 1 min 20 s" | o Builder lê o erro e segue |
| Parar | `abort` da 12 | "Parado." | o escrito vira versão |
| Guardar | **nosso**: commit e pacote na máquina, `fsck`, candidata gravada, `update-ref` com a base | "Guardando a versão…", "Versão 2 guardada: 2 arquivos mudados" | `SAVE_REFUSED`: "Não consegui guardar esta versão. A anterior continua." (11) |
| Copiar fora | **nosso**: PUT no R2 | nada | pendente, repete (13) |
| Dormir | `Workspace.stop()` pausa | nada | — |
| Reinício | **nosso**: a partida pergunta "o `main` contém a candidata?" | a última versão | sem candidata: `interrupted` (19) |

## Os remendos antigos (`e0353c36`)

**Nativos agora, não voltam:** 2 `tripwire` (o controller trata); 3 máquina por conversa (opções do
`E2BSandbox`, agora por Projeto); 4 "encarnação" (`reattach: 'required'`, `onStart({outcome})`); 9
sessões acumulando (`deleteSession`, dono na 12); 10 pergunta perdia a máquina (partida preguiçosa);
13 SSE à mão (eventos do controller); 15 duas máquinas (`template`); 16 root (usuário `user` do
E2B). **Saem:** 8, o registro de rede, trocado por `allowOut`. **Ficam nossos, porque o Mastra e o
E2B não têm:** 1 `holdOpen` (um `setTimeout` por turno: o `@mastra/e2b` não estende); 5 ordem da
remoção (`kill` é nativo); 6 varredura, agora só com a marca desta instalação; 7 teto do pacote
(C59); 11 execução presa (o mínimo na 13: assentar; batimento na 16); 12 dreno (da 12, C62); 14 aba
oculta (da 12).

## Os critérios de aceite

Testes do servidor: `npm run test -w @conexus/server`, pelas rotas, com o E2B dublê (`LocalSandbox`
atrás do porto da máquina) e o modelo roteirizado. **Ao vivo** marca o que o estudo deixou não
provado. Nível must, salvo "(should)".

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | P0 | `e2b`, `@mastra/e2b` fora de `builder/machine/`, `@aws-sdk/client-s3` fora de `builder/git/copy/`: `npm run deps` recusa | arquivo plantado | must |
| 2 | U1 | 0051 "proposed" antes do código | o registro | must |
| 3 | U1 | **Ao vivo**: `npm view react version` responde; `curl https://example.com`, recusado | 0051 | must |
| 4 | U1 | **Ao vivo**: pausar e religar pelo `sandboxId`: mesma máquina, arquivos presentes | 0051 | must |
| 5 | U1 | **Ao vivo**: 200 KB e dois pequenos pelo `SandboxFilesystem`, mesmos bytes | 0051 | must |
| 6 | U1 | **Ao vivo**: apagar o Git de um Projeto de teste e voltar do R2 em menos de 15 min, mesmo `main` | 0051 | must |
| 7 | U1 | **Ao vivo**: a lista pela marca dá só máquinas desta instalação | 0051 | must |
| 8 | U1 | **Ao vivo**: os termos do Hobby admitem o uso; senão, volta ao fundador | 0051 | should |
| 9 | U2 | Avanço com base velha: recusado, `main` intacto | `git.test.ts` | must |
| 10 | U2 | Dois commits, pai errado, link, não regular, acima de 2.000 arquivos ou 64 MiB: `SAVE_REFUSED` | idem | must |
| 11 | U6 | Recusa ao guardar: o texto; a aba mostra a anterior | `runs.test.ts` | must |
| 12 | U2 | `git` sem resposta no prazo: morto, falha com nome (C57) | `git.test.ts` | must |
| 13 | U3 | Cada avanço, um objeto; R2 fora: pendente, repetido, sai após o 200; sem pendente, nenhum relógio (D27) | `copy.test.ts` | must |
| 14 | U6 | Segundo turno no Projeto, de qualquer conversa: 409 `RUN_BUSY`; outro Projeto passa | `runs.test.ts` | must |
| 15 | U5 | Chave do E2B só de arquivo; ausente, vazia ou aberta a outros: `CONFIG_INVALID` (teste 12, S31); `env` vazio na máquina (S14) | `config.test.ts`, `machine.test.ts` | must |
| 16 | U5 | Id gravado e máquina sumida: nenhuma criação calada; o aviso, uma nova, cópia do `main` | `machine.test.ts` | must |
| 17 | U5 | E2B sem resposta: prazo por chamada, `MACHINE_UNAVAILABLE`, o texto (achados 7, 8) | idem | must |
| 18 | U5 | A varredura só toca máquinas com a marca e sem execução aberta (achado 1) | idem | must |
| 19 | U6 | Reinício entre candidata e avanço: assenta, uma versão; sem candidata: `interrupted` | `runs.test.ts` | must |
| 20 | U6 | Turno sem arquivo mudado: nenhuma versão; só resposta: nenhuma máquina | idem | must |
| 21 | U7 | **Armadilha 1**: o `Workspace` pelo controller escreve no seu Projeto e não no vizinho; `createSession` não recebe `workspace` | `workspace.test.ts` | must |
| 22 | U7 | **Armadilha 2**: três escritas e um comando sem `tool_approval_required`; `other` e `mcp`: recusadas; nenhuma das sete do controller | `permissions.test.ts` | must |
| 23 | U7 | `../fora.ts`, link: recusado; escrever sem ler antes: recusado | `workspace.test.ts` | must |
| 24 | U8 | Os cinco eventos da 12 iguais; saída cortada a 20 linhas e 4 KiB; Diego sem os eventos de Ana | `conversations.test.ts` | must |
| 25 | U9 | Apagar Projeto, pessoa ou empresa: máquinas, repositório, prefixo no R2; uma falha não para as outras, fica pendente; o vizinho intocado (teste 11, achado 3) | `runs-removal.test.ts` | must |
| 26 | U10 | Membro lê árvore e arquivo do `main`; outra empresa, Projeto alheio, commit fora do `main`, caminho inexistente: o mesmo 404 (S10, T10) | `source.test.ts` | must |
| 27 | U10 | A aba: estados da matriz, teclado, foco, textos | `source.test.tsx` | must |
| 28 | U10 | 390 px, 200%, dois temas, sem erro de CSP | navegador (T23) | should |
| 29 | U2 | A imagem tem `git`; o volume é do usuário `node` | `hub.Dockerfile` no CI | must |
| 30 | U11 | O roteiro, Hub real, E2B e modelo dublês | `tests/e2e/builder-writes.test.ts` | must |
| 31 | U11 | **Ao vivo**: publicado, o roteiro, máquina real | firstmate, fundador (T14) | must |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- |
| Arquivos | "Nenhuma versão guardada ainda. Peça um app na Conversa." | a partilhada | a de `ui/` | a do Projeto | — |
| Arquivo | — | idem | idem | "Este arquivo não está nesta versão." | binário ou acima de 1 MiB: "Não dá para mostrar este arquivo aqui." |
| Turno que escreve | — | as fases | os textos do fluxo | — | o aviso de `D5` |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `builder.run` `state`, `base_sha`, `candidate_sha`, `copied_at` | U6, U3 | U6, U3, U9 |
| `builder.machine` `sandbox_id`, `used_at` | U5 | U5, U9 |
| eventos `machine`, `output`, `exit`, `saved` | U6, U8 | Conversa; `saved` também a aba |
| `version`, `commit`, `savedAt`, `files[]`, `text` | o Git (U2) | a aba |

## A tabela de falhas

| Gravação ou comando | Duas vezes | Recusada no meio | Dependência fora | Imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Abrir `builder.run` | índice único | uma instrução | 503 | `RUN_ADMITTED`, `RUN_BUSY` | 14 |
| Ligar a máquina | `reattach: 'required'`; sem id, procura pela marca | id gravado antes de ferramenta | `MACHINE_UNAVAILABLE` | `MACHINE_STARTED` | 16, 17 |
| `setTimeout`, copiar | idempotentes | refaz | idem | — | 16 |
| Commit e pacote na máquina | um por turno | `SAVE_REFUSED` | idem | — | 10, 11 |
| `fetch` com `fsck` | ref por execução | ref descartável | `SAVE_REFUSED` | `SAVE_REFUSED` | 10 |
| Gravar a candidata | estado final | relida na partida | turno falha, `main` intacto | — | 19 |
| `update-ref` do `main` | a base recusa a segunda | `rev-parse` decide | — | `VERSION_SAVED` | 9, 19 |
| PUT no R2 | mesma chave | o mesmo PUT | pendente | `GIT_COPY_PENDING`, `_DONE` | 13 |
| Pausar, varrer | idempotentes | o prazo pausa | anotado | `MACHINE_PAUSED`, `_SWEPT` | 17, 18 |
| Remoção | passos idempotentes | pendente da 12 | pendente | `PROJECT_SOURCE_RELEASED` | 25 |
| Assentar | uma passada | repetível | não inicia | `RUN_SETTLED` | 19 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Git (`conexus-git.ts`, `source.ts`, `git-failure.ts`: 613) | trazida | `builder/git/` | prazo e sinal em todo `git`, `-z`, não regulares, trava recuperada, três arquivos | pacote e avanço por comparação: seria escrito assim do zero (provado) |
| Cópia | nova | `builder/git/copy/` | — | nenhuma |
| Motor (`run/**`: 2.226) | nova | `builder/runs/` | — | candidata antes do `main` (D22) |
| Máquina (341) | nova | `builder/machine/` | — | ambiente vazio (S14) |
| `egress-log.ts` | sai | — | — | nunca funcionou |
| Prompt (167) | nova | `conversation/instructions.ts` | — | honestidade, português, sem dados inventados: produto |
| Skill da forma do app | nova | `conversation/skills/` | — | "um só `db.batch`" (0045, 0047; arquitetura §11) |

**A medida do transplante.** Git: 20 a 30% muda, por leitura; o build mede pelo `diff`, e acima de
um terço a parte vira nova. Os 22 casos de `builder-conexus-git.test.mjs` entram pela porta
pública. Motor e máquina mudam mais de um terço: novos.

**A dívida.** `gc` do repositório sem agenda: roda no salvar a cada 50 versões (§11).

## U1 Registro, template e prova

**Raio.** `decisions/0051-…`, `index.md`; `architecture.md` §3 ("Git copy host" passa a R2, sai do
Brasil [0032]), §7, §11; `roadmap.md` (o R2 e o GitHub da página); `infra/e2b/template.ts` (Node
24 e `git`, construído uma vez pelo firstmate).

**Contratos.** 0051, Criterion com os checks dos critérios 3–8, como a seção 11 do estudo.
`Template` do `e2b` 2.56.0, nome em `HUB_E2B_TEMPLATE`: o `E2BSandbox` nunca constrói um sozinho.
Regras: L21, T14, S40. Só documentos (L13).

## U2 O Git do app

**Raio.** `builder/git/` (cria; U3, U6, U9, U10); `platform/config.ts` (`HUB_GIT_ROOT`; `main.ts`);
`infra/hub.Dockerfile`, `compose.yaml`, `deploy.sh` (o `git`, o volume).

**Contratos.** `openRepository({root, companyId, projectId}): Repository`, em
`<raiz>/<companyId>/<projectId>.git`, com `ensure()`, `main()`, `bundleOfMain()`, `receive({runId,
bundle, base}): Result<Sha, SaveRefusal>`, `advance({candidate, base}): 'advanced' | 'stale'`,
`contains(sha)`, `tree(sha)`, `file({sha, path})`, `version(sha)`, `remove()`. `Sha` marcado (C23).
`SaveRefusal = 'two-commits' | 'wrong-parent' | 'not-regular' | 'too-many-files' | 'too-large' |
'corrupt'`.

**Ordem.** Regras: C23, C57, C62, S2, D22. Funções: `bundle create`; `fetch` com
`transfer.fsckObjects` para `refs/conexus/runs/<runId>`; `update-ref refs/heads/main <nova> <base>`;
`ls-tree -r -z`; `cat-file blob`; `merge-base --is-ancestor`; `rev-list --count` (a versão).

**Prova.** 9, 10, 12, 29.

## U3 A cópia no R2

**Raio.** `builder/git/copy/` (cria; U6, U9); `platform/config.ts` (`HUB_GIT_COPY_BUCKET`,
`HUB_GIT_COPY_KEY_FILE`; o endereço vem de `HUB_CLOUDFLARE_ACCOUNT_ID`); `package.json`,
`package-lock.json`, `compose.yaml`, `how-to/hub-server.md`.

**Contratos.** Porto `GitCopy = {put({companyId, projectId, version, sha, bundle});
removeProject({companyId, projectId})}`, um adaptador (C56). Chave
`git/<companyId>/<projectId>/<versão em 8 dígitos>-<sha>.bundle`: voltar é baixar a maior.

**Ordem.** Regras: S31, S36, C56, C57, D27. Funções: `S3Client({region: 'auto', endpoint,
credentials, maxAttempts})`, `PutObjectCommand`, `ListObjectsV2Command`, `DeleteObjectsCommand`,
com `abortSignal`.

**Prova.** 13.

## U4 Tabelas e grants

**Raio.** `builder/runs/tables.ts`, `builder/machine/tables.ts`, migrações, `database-grants.sql`,
`catalog.test.ts`.

**Contratos.** `builder.run`: `id` uuid, `company_id`, `project_id` para `hub.project`,
`conversation_id` para `builder.conversation`, `person_id`; `state` em `open | saving | saved |
unchanged | stopped | interrupted | failed` (C21); `base_sha`, `candidate_sha`, `version`,
`copied_at`, `started_at`, `ended_at`; único parcial `(project_id) WHERE state IN ('open',
'saving')`. `builder.machine`: `project_id` chave, `company_id`, `sandbox_id`, `used_at`. Política
de linha (0039). Regras: D6, D11, D12, D15, D18.

**Prova.** 14, catálogo.

## U5 A máquina

**Raio.** `builder/machine/` (cria; U6, U7, U9); `platform/config.ts` (`HUB_E2B_API_KEY_FILE`,
`HUB_E2B_TEMPLATE`); `compose.yaml`, `how-to/hub-server.md`, `package.json`, `package-lock.json`.

**Contratos.** `openMachine({companyId, projectId}): Promise<Machine>`, `Machine = {workspace;
sandboxId; outcome; extend(ms); pause()}`. `E2BSandbox({id: 'conexus-<projectId>', sandboxId?,
reattach: 'required', template, apiKey, network: {allowOut: ['registry.npmjs.org', …], denyOut:
['0.0.0.0/0']}, metadata: {conexus_origin, project_id}, timeout: 600_000})`, sem `env`; a marca é o
host de `HUB_PUBLIC_ORIGIN`. `Workspace({sandbox, filesystem: SandboxFilesystem em /home/user/app,
tools})`. `sweepMachines()`: `Sandbox.list({query: {metadata}})` (`e2b index.d.ts:9376`),
`Sandbox.kill(id)` (`:9601`) para órfãs e paradas há 7 dias; na partida, e diária só com máquina
gravada. Falhas `MACHINE_UNAVAILABLE`, `MACHINE_REPLACED` (C48).

**Ordem.** Regras: C56, C57, C75, S14, S31, S36, S41, D27. Funções: `requestTimeoutMs` por chamada;
nenhum `logger` ao SDK do E2B (C50).

**Prova.** 15–18.

## U6 A execução

**Raio.** `builder/runs/` (cria; `main.ts`, U8, U9); `conversation/sessions.ts`, `builder.ts` (da
12: admitir antes de `sendMessage`, o `workspace` por função, guardar no fim);
`hub-api/src/conversations.ts`, `failures.ts` (409 `RUN_BUSY` em `sendConversationMessage`);
`main.ts` (assentar na partida; guardar dentro do dreno, C62).

**Contratos.** `admitRun({companyId, projectId, conversationId, personId}): Result<RunId, 'busy'>`;
`workspaceFor(requestContext): Workspace | undefined`, para `AgentController({workspace})`;
`finishRun({runId, reason})` no `agent_end`; `settleRuns()`. Uma linha por turno; versão só com
árvore diferente da base (`D4`).

**Ordem.** Regras: C21, C37, C62, C63, C65, D22, D25. Funções: `onBeforeAgentEnd`, `agent_end`,
`abort`.

**Prova.** 11, 14, 19, 20.

## U7 Permissões, instruções, skill

**Raio.** `conversation/permissions.ts`, `instructions.ts`, `skills/` (cria; `builder.ts`,
`sessions.ts`).

**Contratos.** `categoryOf(toolName): ToolCategory`, o `toolCategoryResolver`: ler, listar, `grep`,
`file_stat`, `web_search`, `web_fetch` → `read`; escrever, editar, `mkdir`, `delete` → `edit`;
`execute_command`, `get_process_output`, `kill_process` → `execute`; o resto → `other`, nunca
`null`. A cada `createSession`, porque as regras vivem em memória: `read`, `edit`, `execute` =
`allow`; `mcp`, `other` = `deny`; nunca `yolo`. `disableBuiltinTools`: as sete. `tools` do
`Workspace`: sem `ast_edit`; `requireReadBeforeWrite` em escrever e editar. Instruções em português,
cerca de 30 linhas; skill da forma do app pelo `packages/app-contract`.

**Ordem.** Regras: C75, S2, S14.

**Prova.** 21–23.

## U8 O stream que escreve

**Raio.** `conversation/routes.ts`, `events.ts`; `hub-api/src/conversations.ts`;
`apps/web/src/builder/conversation/`.

**Contratos.** `ConversationEvent` guarda os cinco da 12 e ganha `{type: 'machine'; phase:
'starting' | 'waking' | 'copying' | 'replaced' | 'saving'}`, `{type: 'output'; callId; lines}`,
`{type: 'exit'; callId; code}`, `{type: 'saved'; version; changed}`. Fontes: `tool_input_start`,
`tool_start`, `shell_output`, `command_exit`. Nunca `display_state_changed`, que acumula a saída
sem teto, nem `modifiedFiles`, vazio para `mastra_workspace_write_file`: a lista vem do Git.

**Ordem.** Regras: C28, C59, S39, W9, V35, V39.

**Prova.** 24.

## U9 Remoção

**Raio.** `builder/runs/removal.ts`; `hub/projects/projects.ts`, `hub/identity/`,
`hub/operations/clients.ts` (a porta da 12).

**Contratos.** A porta `ReleaseConversations` da 12 libera também execuções, máquinas, cópia e
repositório, nessa ordem; falha: as pendentes da 12.

**Ordem.** Regras: D22, S10, T10.

**Prova.** 25.

## U10 Rotas e aba Arquivos

**Raio.** `builder/git/routes.ts`; `hub-api/src/source.ts`, `index.ts`; `apps/web/src/builder/source/`,
`routes/…/$projectId.files.tsx`, `$projectId.tsx`.

**Contratos.** Sob `/api/companies/{companyId}/projects/{projectId}`, acesso `MEMBER`:
`readProjectSource` `GET /source` → `{version, commit, savedAt, files: [{path, bytes}]}`, limitada
pelo teto de 2.000 do salvar (C44), `version: null` sem versão; `readProjectFile` `GET
/source/file?commit&path` → `{text}`, 404 `SOURCE_FILE_NOT_FOUND`, 422 `SOURCE_FILE_NOT_TEXT`.

**Ordem.** Regras: C28, C36, C44, S9, S10, W1, W8, W9, W17, V29–V31, V35.

**Prova.** 26–28.

## U11 Percurso, ensaio, how-to

`tests/e2e/builder-writes.test.ts`; `how-to/hub-git-restore.md`, em português (L23). 30: `npm run
e2e`; 31 e os ao vivo de U1: após o Release (T13, T14).
