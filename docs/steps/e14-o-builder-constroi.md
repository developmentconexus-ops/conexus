# Etapa 14: O Builder constrói

## A página do fundador

**No fim desta etapa** você pede um app ao Builder, responde às perguntas dele, aprova o plano e vê
a versão guardada com "montou", nos arquivos da aba **Código**. O app começa certo: TypeScript,
React, shadcn, TanStack e Zod, como no Conexus OS, num SDK em que o Builder escreve só a lógica do
app. A Prévia, onde você usa o app, é a etapa 14.1.

**O roteiro de uso.** Padaria Sol, com Ana (dona).

1. Como **Ana**, "Encomendas" › **Conversa**: "Crie um app de encomendas com cliente, telefone,
   produto e data de entrega." O Builder diz o que vai ler e mostra um cartão com até 4 perguntas,
   a recomendada primeiro: "Quem cadastra as encomendas?", "Uma encomenda tem situação?".
2. Ana responde e envia. O Builder mostra a parte do plano "Para a pessoa" e o cartão do plano,
   com **Aprovar e construir** e **Pedir ajustes**. Ana pede um ajuste; o plano volta mudado.
3. Ana aprova. A lista de tarefas aparece ("Encomendas", "Tela de encomendas", "Conferir o app") e
   cada uma é marcada quando a conferência passa.
4. No fim do turno: "**Versão 1 guardada**, montou". Em **Código**: `shared/operations.ts`,
   `server/handlers.ts`, `server/migrations/001_encomenda.sql`, `src/routes/encomendas.tsx`. Os
   arquivos da casca estão lá e o Builder não os mudou.
5. "Agora guarde também o endereço." Pedido pequeno com algo em aberto: o Builder pergunta antes
   ("O endereço é obrigatório?"), sem novo plano inteiro, e guarda a versão 2, que monta.

**O que você faz, e quando.** No começo: aprova esta página. No fim: faz o roteiro na nuvem, diz o
que viu e aprova os textos dos cartões. Firstmate faz as corridas reais e testa as telas.

**Respondidas em 2026-10-21.** 1: dividir em 14 e 14.1. 2: o Zod é a fonte das operações e o
manifesto sai dele; tudo o que o SDK, a casca ou a montagem podem fazer é automático ("sem dar
oportunidades" ao modelo). 3: `conexus_check` é ferramenta do Builder, o mesmo código da
conferência do fim do turno. 4: abrir o app no navegador durante a conferência só informa. 5: um
modo só, o plano como skill, como no desenho final do OS; o prompt do Builder é o do OS, adaptado
só onde a arquitetura mudou (a tabela da U7). Valem da 14 antiga: P3 A (até 3 novas tentativas;
depois guarda o código, "não montou") e "Autorizo provas reais".

**Os limites.** Até 4 perguntas por cartão; uma pergunta espera 30 min, depois a volta termina
(o valor do OS). Até 4 conferências por turno. Até 20 problemas por passo. 60 s por passo.

**Fica de fora.** A Prévia, o envio e as Alterações (14.1); Conexões e Integrações (19 e 20);
ver a tela mudar enquanto o Builder escreve; eventos, agendas e sincronização (o desenho deixa a
chave no SDK). Das issues `next-card`: 233 e 238 entram na U4 no que o template muda; as outras são
de telas e lojas das etapas 12 e 13, fora destas pastas, e esperam o conserto delas.

**A decisão sua pedida nesta etapa.** As capturas do OS dos cartões de pergunta e de plano ainda
não foram tiradas. **A**: a U6 começa por elas (o OS roda local, sem conta), e você aprova os
textos no fim. **B**: tirar antes de aprovar esta página. Recomendo A.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | Registro 0055 e as regras trocadas | `docs/` | testes | 13 fechada |
| U2 | O SDK `@conexus/app` | `packages/app/src/` | dados | U1 |
| U3 | A casca e o starter | `packages/app/starter/`, `builder/git/` | web | U2 |
| U4 | A montagem, `conexus_check` e a conferência do fim do turno | `packages/app/src/check/`, `infra/e2b/`, `scripts/app-pack.ts`, `builder/machine/`, `builder/conversation/` | segurança | U2, U3 |
| U5 | Perguntas, plano e tarefas no servidor | `builder/conversation/`, `builder/runs/`, `hub-api/` | dados | U1 |
| U6 | Os cartões na Conversa | `apps/web/src/builder/conversation/` | web | U5 |
| U7 | O prompt e as skills | `builder/conversation/prompt/`, `packages/app/skills/` | testes | U2, U3, U4, U5 |
| U8 | Percurso e prova | `tests/e2e/`, `docs/how-to/` | testes | todas |

`builder/` é `apps/server/src/builder/`; `hub-api/` é `packages/hub-api/src/`. Em toda unidade,
`typescript-magician` e `node`; skills das linhas de `docs/reference/stack.md` das pastas. U2 e U5
correm em paralelo (não dividem pasta); U6 depois de U5; U7 depois de U4 e U5; U8 por último; QA
(T25) antes das revisões (L9). **Pacotes novos** (U2, U3): `@conexus/app` (do repositório);
`@tanstack/react-table`, `recharts`, `date-fns`, `react-day-picker`, `@hookform/resolvers` só no
`package.json` do starter, na versão do OS (`compiler-template/package.json:10-35`); raiz:
`package.json`, `package-lock.json`, `biome.json`, `ci.yml`.

**Orçamento de código alterado.** U2 450; U3 300 escritas (os componentes shadcn são gerados);
U4 500; U5 450; U6 450; U7 650, quase todo texto; U8 80. Total da etapa: **2.880**, teto 4.000 (L2).

## Os critérios de aceite

Pelas rotas e `main.ts`, com `Machines` dublê (`LocalSandbox` com o template montado local) e
modelo gravado (`record-provider`). **Ao vivo**: firstmate, anotado no 0055; nenhum teste da suíte
chama serviço de fora (T14). Must, salvo "should".

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | 0055 "proposed" antes do código: Zod fonte do manifesto, casca, lista de imports, `serveApp` interno, perguntas que esperam; o provado pelo estudo citado, não refeito | o registro | must |
| 2 | U2 | `manifestOf(operations, migrations, assets)` passa no `Manifest` do contrato 1; `z.union` de objetos, `z.transform`, `z.custom`: `MANIFEST_SHAPE_UNSUPPORTED` com o caminho da operação | `manifest-of.test.ts` | must |
| 3 | U2 | `defineHandlers`: entrada fora do Zod 400 `INPUT_INVALID`; saída fora 500 `OUTPUT_INVALID`; handler que lança `HANDLER_FAILED` sem a mensagem; handler faltando: erro ao iniciar | `runtime.test.ts` | must |
| 4 | U2 | `write` grava tudo ou nada (`db.batch`); erro do banco: `DatabaseRefused` só com o SQLSTATE; `query` com linha fora do Zod: `OUTPUT_INVALID` | `server.test.ts` | must |
| 5 | U2 | `createApi`: saída validada; falha vira `CallFailed` com `failureText` em português para cada código do contrato 1 | `client.test.ts` | must |
| 6 | U3 | O starter passa nos cinco passos da conferência, e o navegador abre sem erro no console nem violação de CSP (`headers.ts:11`) | `starter.test.ts` | must |
| 7 | U3 | Projeto sem `main`: o primeiro turno parte do starter como commit de base, sem número de versão; um segundo turno não o regrava | `runs.test.ts` | must |
| 8 | U4 | O handler que devolve `{ codigo }`: `tipos` falha com `server/handlers.ts:13` e TS2322; `import axios`: `tipos` falha com TS2307; um passo que falha pula os seguintes | `check.test.ts` | must |
| 9 | U4 | O modelo muda `src/main.tsx`, `vite.config.ts` ou `/opt/conexus`: o passo `casca` falha antes de `tipos`; o arquivo da casca é restaurado no próximo turno | idem | must |
| 10 | U4 | `conexus_check` e o processador do fim do turno dão o mesmo relatório para a mesma árvore; Chromium ausente ou prazo de 60 s: `CHECK_PLATFORM_FAILED`, que não é culpa do app nem conta como tentativa | `check-tool.test.ts` | must |
| 11 | U4 | Fim do turno: falha volta ao Builder; 4 conferências falham: guarda o código, cartão "não montou" com `APP_CHECK_FAILED`; turno sem arquivo mudado: nenhuma conferência | `conversation-check.test.ts` | must |
| 12 | U4 | A subida no navegador falha (erro de console, CSP, `#root` vazio): o relatório a mostra, a versão monta (só informa) | `check.test.ts` | must |
| 13 | U4 | Pasta acima de `APP_LIMITS`, link ou não regular: `TOO_LARGE`, `NOT_REGULAR`, sem ler o resto (C59, S2) | idem | must |
| 14 | U5 | `ask_user` com 5 perguntas ou `multiSelect` sem opções: recusado ao modelo, nada espera; com 1 a 4: a volta espera, a parte `question` chega à Conversa | `conversation-questions.test.ts` | must |
| 15 | U5 | `answerQuestion` (`MEMBER`, só quem abriu a volta): a volta continua com as respostas; resposta repetida ou de chamada já fechada: `QUESTION_CLOSED`; outra empresa: 404 (S10) | idem | must |
| 16 | U5 | `submit_plan` fora de `.conexus/plan.md`: recusado ao modelo; no caminho: a parte `plan` com título e texto; **Pedir ajustes** devolve o motivo; **Aprovar e construir** continua | idem | must |
| 17 | U5 | Pergunta sem resposta em 30 min: a volta termina `stopped` com `QUESTION_EXPIRED`; **Parar** com pergunta aberta: a chamada fecha negada; Hub reiniciado com pergunta aberta: a retomada da 13 fecha a chamada, nenhuma fica no banco do Mastra | `conversation-questions.test.ts`, `runs.test.ts` | must |
| 18 | U5 | Mensagem do compositor com pergunta aberta: fecha a pergunta e segue na mesma volta (como o OS); sem pergunta aberta: `RUN_BUSY` como hoje | idem | must |
| 19 | U5 | `task_*`: a parte `tasks` chega à Conversa a cada mudança e sobrevive a recarregar | `conversation-parts.test.ts` | must |
| 20 | U6 | Cartão de perguntas: opções com a recomendada primeiro, texto livre, **Enviar** uma vez; cartão do plano: o texto em Markdown, os dois botões; lista de tarefas; estados da matriz; teclado e nomes (V30, V31) | `cards.test.tsx` | must |
| 21 | U6 | 1280, 390 px, 200 %, dois temas, CSP limpo | navegador (T23) | must |
| 22 | U7 | A tabela da U7 confere com `builder.md` do OS linha a linha; o prompt montado tem cada linha "igual" e "adaptada", e nenhuma "tirada" | `prompt.test.ts` | must |
| 23 | U7 | Os exemplos `.ts` e `.tsx` de cada skill tipam contra a casca e o SDK; um exemplo quebrado falha; `validateSkillContent` passa | `skills.test.ts` | must |
| 24 | U7 | Linha "Este app é novo" só enquanto `main` é o starter; `AGENTS.md` e `.conexus/memory/MEMORY.md` lidos do `main`, ausentes: a frase de vazio | `prompt.test.ts` | must |
| 25 | U8 | Roteiro com modelo gravado: do pedido ao plano aprovado, à conferência limpa e a "Versão 1 guardada, montou" | `tests/e2e/builder-builds.test.ts` | must |
| 26 | U8 | **Ao vivo**: 3 corridas do pedido da Ana com Gemini 3.8 Flash High e 1 com Claude: o cartão de perguntas e o plano aparecem, a versão monta no primeiro turno, nenhum comando procura no disco fora de `/home/user/app`; o `abort` com `retry` reabre o laço com o Claude real (o antigo 6 da 14) | 0055 | must |
| 27 | U8 | **Ao vivo**: o template pronto no E2B, com tamanho e tempo de início anotados; a montagem pelo `wrangler` dá o mesmo que o laboratório | 0055 | must |
| 28 | U8 | O relatório de QA no commit candidato (T25) | `conexus-qa` | must |
| 29 | U8 | **Ao vivo**, publicado: o roteiro pelo fundador (L17) | firstmate, fundador | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Cartão de perguntas | o cartão aberto | — | "Enviando…", botão parado | "Não foi possível enviar. Tente de novo." | — | quem não abriu a volta vê o cartão só leitura | "Esta pergunta expirou." |
| Cartão do plano | o plano e os dois botões | — | "Enviando…" | idem | — | só leitura | "Este plano foi substituído." |
| Lista de tarefas | — | — | — | — | — | — | — |
| Cartão da versão | — | — | — | "Versão N guardada, não montou" com o código | — | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| parte `question {toolCallId, questions, state}` | U5 | U6 |
| parte `plan {toolCallId, title, plan, state}` | U5 | U6 |
| parte `tasks {items}` | U5 | U6 |
| parte `version` ganha `check: 'passed' \| 'failed'` | U4 | U6, 14.1 |
| `builder.run.state` ganha `waiting` | U5 | U5 (retomada), `answerQuestion` |
| `builder.run.check_failure` | U4 | U4, 14.1 |
| `CheckReport` | U4 | o modelo, o processador, a parte `version` |

**Os desenhos** (capturas do OS a tirar na U6, decisão A; `ask-user-pt.tsx`, `plan-pt.tsx`,
`task-list-pt.tsx` do OS, e `@mastra/playground-ui/components/ai/ask-user` do fork):

```text
1280 │ Conversa                                    390 ┌ Conversa ─────────────┐
     │ … "Vou ler o pedido e preparar perguntas."      │ Quem cadastra?        │
     │ ┌ Quem cadastra as encomendas? ─────────┐       │ (•) Todos (recomend.) │
     │ │ (•) Todos do Projeto (recomendado)    │       │ ( ) Só eu             │
     │ │ ( ) Só eu      [ outra resposta… ]    │       │ [Enviar]              │
     │ └───────────────────────── [Enviar] ────┘       ├ Plano ────────────────┤
     │ ┌ Plano: App de encomendas ─────────────┐       │ texto…                │
     │ │ Para a pessoa… (Markdown)             │       │ [Aprovar e construir] │
     │ │ [Aprovar e construir] [Pedir ajustes] │       │ [Pedir ajustes]       │
     │ └───────────────────────────────────────┘       └───────────────────────┘
```

## A tabela de falhas

| Gravação ou comando | Duas vezes | Recusada no meio | Dependência fora | Imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `/opt/conexus/check` (ferramenta e fim do turno) | uma por chamada; só leitura da árvore | prazo e sinal (C57) | a máquina: `CHECK_PLATFORM_FAILED` | `APP_CHECKED` | 8 a 13 |
| Restaurar a casca na máquina | idempotente | no próximo turno | a da 13 | — | 9 |
| Starter como base do `main` | só sem `main` | a gravação da 13 | R2 da 13 | `PROJECT_STARTED` | 7 |
| `builder.run` `waiting` | posse da 13 | retomada fecha a chamada | o banco: a volta termina | `RUN_WAITING` | 15, 17 |
| `answerQuestion` | `QUESTION_CLOSED` | a chamada segue aberta | Mastra: `INTERNAL_UNEXPECTED` | `QUESTION_ANSWERED` | 15, 18 |
| `respondToToolSuspension` do Mastra | o Mastra recusa a segunda (`AGENT_RESUME_ALREADY_CLAIMED`): `QUESTION_CLOSED` | idem | — | — | 15 |
| `settleSuspendedToolCallsAsDenied` | idempotente | na próxima retomada | — | `QUESTION_CLOSED` | 17 |
| Template do E2B | uma por firstmate | — | E2B pago | o nome | 27 |

## O que nasce novo e o que é trazido

| Mecanismo | Nativo, nosso ou trazido | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base | Como Mastra, vibesdk e Conexus OS fazem, `file:line` |
| --- | --- | --- | --- | --- | --- |
| Operações em Zod e manifesto gerado | nosso, novo | `packages/app/src/{operations,manifest-of}.ts` | — | inverte o OS (manifesto JSON escrito, `generate-client.mjs`) | OS `17-app-stack-decision.md:154-156`; vibesdk nenhuma faz |
| Handlers, `query`, `write` | nosso, novo | `packages/app/src/server.ts` | `serveApp` fica, interno (`runtime.ts:36`) | 0019 | OS `conexus-server/SKILL.md`; Mitra, SDK de build |
| Cliente e `failureText` | trazido como ideia | `packages/app/src/client.ts` | da fonte Zod | os textos de falha do OS | OS `failures.gen.ts` |
| Casca e componentes | trazido como ideia | `packages/app/starter/` | Vite 8, versões do Hub | `jitless`, `CSPProvider`, `assetsInlineLimit: 0` | OS `starter-template/`; vibesdk `FileManager.ts:102-119` |
| Lista de imports | trazido como ideia | `packages/app/src/check/imports.ts` | — | o `node_modules` só com o permitido | OS `vite.config.mjs:12-31`, `allowlist.mjs:25-40` |
| Conferência | trazido como ideia | `packages/app/src/check/` | passos do SDK | um passo que falha pula os seguintes; 60 s | OS `check/report.ts:3-15`; vibesdk `run_analysis` |
| Conferência no fim do turno | nativo | `builder/conversation/processors.ts` | — | 3 retentativas (OS `builder.md:54`) | `processOutputStep`, `abort(…, {retry: true})` (`processors/index.d.ts:543,739`) |
| Perguntas e plano | nativo, embrulhado | `builder/conversation/plan-tools.ts` | um modo só | 4 perguntas, só `.conexus/plan.md` | `askUserTool`, `submitPlanTool` (`tools/builtin/*.d.ts`); OS `harness/tools.ts:64-150` |
| Volta que espera | trazido como ideia | `builder/runs/` | estado `waiting` da 13 | 30 min; mensagem fecha a pergunta | OS `run/run.ts:240-256`, `run/question.ts` |
| Prompt | trazido, adaptado | `builder/conversation/prompt/builder.md`, `prompt.ts` | a tabela da U7 | `instructions` como função | OS `harness/prompt.ts:46-89` |
| Skills | trazidas como ideia | `packages/app/skills/` | reescritas para o SDK | seis estágios, três classes de decisão | OS `builder-skills/` |

**A medida do transplante.** Nenhum código entra copiado: todas as partes são escritas de novo a
partir da ideia; o prompt e as skills são o texto do OS refeito pela tabela da U7 e pelo SDK.

**A dívida.** Nenhuma nova.

## U1 Registro 0055 e as regras trocadas

**Raio.** `docs/decisions/0055-apps-written-against-an-sdk.md`: cria. `docs/{architecture,index}.md`,
`docs/decisions/0053-*.md`: muda. Chama: `check-docs`.

**Contratos.** 0055: o app é escrito contra `@conexus/app`; o modelo escreve só `shared/`,
`server/`, `src/routes/`, `src/router.tsx`, `src/lib/format.ts`; o resto é da casca, restaurado.
**Regras trocadas, não acrescidas**: o cartão 9 "`serveApp` chamado pelo app" vira "gerado pela
montagem"; a skill do contrato (`packages/app-contract/src/skill.ts`) sai, substituída pelas da U7;
0053 "the controller's own such tools stay disabled" vira "`ask_user`, `submit_plan` e `task_*`
ligados, embrulhados; `subagent` desligado"; `live.ts:289` "`suspended` cannot happen" cai.

## U2 O SDK `@conexus/app`

**Raio.** `packages/app/`: cria; chama: o starter, a conferência, as skills. `packages/app-contract/`:
usa `Manifest`, `Shape`, `serveApp`, sem mudar.

**Contratos.** `defineOperations<T extends Record<OperationName, {input: ZodObject, output: ZodType}>>(t): T`.
`defineHandlers(operations, handlers): Handlers`, cada um `(input: z.infer<I>, ctx: Context) =>
Promise<z.infer<O>>`; `Context = {db: Db, caller: Caller}` (0019; `connectors` entra com a 20).
`query<R>(db, row: ZodType<R>, text, values?): Promise<R[]>`; `write(db, Statement[]): Promise<Row[][]>`;
`class DatabaseRefused {code: Sqlstate}`. `manifestOf(input): Result<Manifest, ManifestRefused>`,
`ManifestRefused = {code: 'MANIFEST_SHAPE_UNSUPPORTED', operation, path}`. `createApi(operations):
Api`; `class CallFailed {code: AppFailureCode}`; `failureText: Record<AppFailureCode, string>`, o
dono das frases (C26). `OperationName` marcado pelo regex do `Manifest` (C23). Entradas externas:
o corpo do `POST`, pelo Zod da operação (C27). Modelo: `packages/app-contract/src/runtime.ts`
(cumpre C21, C23, C26).

**Ordem.** Regras: C21, C23, C26, C27, D28. Funções: `zod@4.6.5`: `z.toJSONSchema` (opção `io:
'input'` para a entrada), conferido contra `Shape`. **Prova.** 2 a 5.

## U3 A casca e o starter

**Raio.** `packages/app/starter/`: cria; chama: o template (U4), `builder/git/` (base do `main`).

**Contratos.** A árvore de §3.2 do estudo (casca: `src/main.tsx`, `src/conexus/api.ts`,
`src/components/ui/*`, `src/styles.css`, `index.html`, `vite.config.ts`, `tsconfig.*.json`;
modelo: o resto). `SHELL_FILES`, o dono da lista (C26). `startProject({projectId}): Result<Sha,
GitFailure>`: só sem `main`. Componentes: `npx shadcn add` com o estilo `base-nova`, gerados, fora
do orçamento. **Ordem.** Regras: W21, W22, V19. **Prova.** 6, 7.

## U4 A montagem, `conexus_check` e o fim do turno

**Raio.** `packages/app/src/check/`: cria. `infra/e2b/template.ts`, `scripts/app-pack.ts`: muda
(`app-pack` passa a chamar a montagem do SDK). `builder/machine/`: muda; chama: o processador, a
ferramenta. `builder/conversation/{processors,builder}.ts`: cria, muda.

**Contratos.** `/opt/conexus/check` (só leitura, do pacote): passos `casca`, `manifesto`, `tipos`
(dois projetos, DOM e servidor), `telas` (`vite build` com o plugin da lista), `worker` (`serveApp`
gerado, `wrangler deploy --dry-run --outdir`, `Manifest.parse`), `navegador` (informa).
`CheckReport = {ok, steps: [{name, state: 'passed' | 'failed' | 'skipped' | 'informed', problems:
[{file, line, column, code, message}] }]}`, até 20 por passo, esquema Zod lido no servidor (C27).
`Machines.check({projectId}): Result<CheckReport, 'CHECK_PLATFORM_FAILED'>`. Ferramenta
`conexus_check`, sem entrada, `outputSchema: CheckReport`, com a descrição do OS (`tools.ts:26-41`).
`checkGate: Processor` em `processOutputStep`: só sem `toolCalls` e com arquivos mudados; falha →
`abort(<relatório curto>, {retry: true})`; no `retryCount` 3 deixa terminar.
`APP_CHECK_FAILED`, `CHECK_PLATFORM_FAILED`, `APP_CHECKED` (C48). Template: `/opt/conexus` com
`node_modules` fixo, `@conexus/app`, `@conexus/app-contract`, `wrangler`, Chromium headless.
Modelo: `model-accounts/processors.ts` da 12.

**Ordem.** Regras: C50, C56, C57, C59, C75, S2, S14. Ler inteira
`dist/docs/references/docs-agents-processors.md`. **Prova.** 8 a 13.

## U5 Perguntas, plano e tarefas no servidor

**Raio.** `builder/conversation/{builder,plan-tools,live,parts,routes,instructions}.ts`,
`builder/runs/`, `hub-api/{conversations,failures,index}.ts`: cria, muda; chama: `main.ts`, web,
OpenAPI.

**Contratos.** `disableBuiltinTools: ['ask_user', 'submit_plan', 'subagent']`, com `ask_user` e
`submit_plan` registrados sob o id nativo, embrulhados como no OS (até 4 perguntas; só
`.conexus/plan.md`, lido da máquina para a suspensão); `task_*` nativos. `builder.run.state` ganha
`waiting` (check da 13 mudado). `answerQuestion` `POST …/conversations/{conversationId}/questions/{toolCallId}`,
`MEMBER` e dono da volta: `{kind: 'answers', answers: (string | string[])[]} | {kind: 'plan',
action: 'approved' | 'rejected', feedback?}` → 202; 409 `QUESTION_CLOSED`. `ToolCallId` marcado
(C23). `QUESTION_WAIT_MS = 30 min`, o dono (C26). Retomada pela suspensão nativa
(`respondToToolSuspension`, `session.d.ts:1814-1834`); fechar sem resposta por
`settleSuspendedToolCallsAsDenied`. Modelo: `runs/settle.ts` da 13 (cumpre C21).

**Ordem.** Regras: C21, C23, C48, C62, C65, S8, S10, S41. **Prova.** 14 a 19.

## U6 Os cartões na Conversa

**Raio.** `apps/web/src/builder/conversation/{question-card,plan-card,task-list}.tsx`: cria;
`transcript.tsx`, `builder-turn.tsx`: muda.

**Contratos.** Cada cartão lê a sua parte e chama `answerQuestion`; textos em português (L23).
Regras: V19, V29 a V31, V54, W22, W31. **Prova.** 20, 21.

## U7 O prompt e as skills

**Raio.** `builder/conversation/prompt/{builder.md,prompt.ts}`: cria; `instructions.ts`: muda (passa
a montar o prompt). `packages/app/skills/{conexus-plan-new,conexus-plan-change,conexus-build,conexus-app,conexus-data}/`:
cria; chama: `createSkill` no Builder.

**Contratos.** `instructions` como função do `requestContext` (só ela é resolvida de novo numa
chamada retomada, OS `prompt.ts:61-66`). Uma passada sobre o modelo, com os campos `{project name}`,
`{date}`, `{cutoff}`, a linha nova, `{AGENTS.md content}`, `{index}`. As skills do OS como texto
refeito: tiram `conexus/`, a lista `node:`, o runner, o CTE e `conexus_run_operation` (não existe:
"um passo que salva não roda" fica; "uma leitura roda" vira "lê o handler contra a tabela").

**A tabela do prompt** (`builder.md` do OS, `e0353c36`, linha a linha; a razão é da arquitetura):

| Linhas do OS | Veredito | Razão |
| --- | --- | --- |
| 1, 2 | igual | — |
| 3 | adaptada | "They see it in the Prévia" vira "in the saved version's files" até a 14.1, que devolve a frase |
| 5 a 10 | igual | — |
| 11 | igual | — |
| 13 | adaptada | `conexus-server` vira `conexus-data`; "touch `conexus/`" vira "touch `shared/` or `server/`" (0055) |
| 15 | adaptada | sem Conexões até a 19: mantém "never invent data"; "a Conexão can be added in Integrações" vira "connections to company systems come later, through connectors" |
| 17 | igual, mais | as frases de segurança da 13 (`instructions.ts:16-20`): sem `git push`, sem segredo em arquivo |
| 19 | igual | a 13 guarda cada versão (0051) |
| 22 | adaptada | as palavras da tela: sem Prévia nem Integrações até elas existirem |
| 23 a 27 | igual | `ask_user` e `task_*` ligados na U5 |
| 29 a 47 | igual | memória observacional ligada (`builder.ts:97`); `.conexus/memory/` lida do `main` |
| 50, 51 | igual | — |
| 52 | adaptada | os fatos do template da U4, não Debian 12 |
| 53 | adaptada | a Conversa e Código; a 14.1 soma Prévia e Alterações |
| 54 | adaptada | "saves the version" sem "updates the Prévia" (14.1); "a message starts the next run" vira "a message closes an open question and continues this run; otherwise wait" (U5, critério 18) |
| 57 a 59 | igual | — |
| 61 | adaptada | "the Conexão" sai até a 19 |
| 63 | igual | — |
| 64 a 66 | tirada | não há Conexões; volta com a 19 |
| 68 a 75 | igual | `AGENTS.md` e a memória lidos do `main` |
| `prompt.ts:82-84` | tirada | `@mastra/code-sdk` não está no Hub |
| `prompt.ts:85-88` | tirada | o turno da 13 parte do `main` sem merge na máquina (0051) |

**Ordem.** Regras: T5, S2, S40, L23. **Prova.** 22 a 24.

## U8 Percurso e prova

**Raio.** `tests/e2e/builder-builds.test.ts`, `package.json`, `docs/how-to/builder-builds.md`,
`docs/index.md`: cria. **Prova.** 25 e 28 no commit candidato; 26 e 27 antes do merge; 29 após o
Release (L17).
