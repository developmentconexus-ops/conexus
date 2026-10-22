# Etapa 14: O Builder constrói

## A página do fundador

**No fim desta etapa** você pede um app ao Builder, responde às perguntas dele, aprova o plano e vê
a versão guardada com "montou", nos arquivos da aba **Código**. Rígido é só o contrato com a
plataforma; telas, estilo e componentes partem de um starter que o Builder edita, e servidor só
quando o app guarda dados. A Prévia, onde você usa o app, é a etapa 14.1.

**O roteiro de uso.** Padaria Sol, com Ana (dona).

1. Como **Ana**, "Encomendas" › **Conversa**: "Crie um app de encomendas com cliente, telefone,
   produto e data de entrega." Um cartão de até 4 perguntas, a recomendada primeiro: "Quem cadastra
   as encomendas?", "Uma encomenda tem situação?".
2. Ana responde. O Builder mostra a parte do plano "Para a pessoa" e o cartão do plano, com
   **Aprovar e construir** e **Pedir ajustes**. Ana pede um ajuste; o plano volta mudado.
3. Ana aprova. A lista de tarefas aparece e cada tarefa é marcada quando a conferência passa. Uma
   linha de ferramenta abre no comando e na saída.
4. No fim do turno: "**Versão 1 guardada**, montou". Em **Código**, as operações, a tabela e as
   telas, sobre o starter que o Builder mudou.
5. "Agora mostre as entregas num calendário." O Builder acrescenta a biblioteca `react-big-calendar`
   sem perguntar (fundador, 2026-10-22, «A»: sem portão de biblioteca); a versão 2 monta.
6. Num Projeto novo, "Uma página com a tabela de preços": o Builder pergunta os preços e guarda uma
   versão só de tela, sem servidor, que monta.

**O que você faz, e quando.** No começo: aprova esta página. No fim: faz o roteiro na nuvem e aprova
os textos dos cartões.

**Respondidas** em 2026-10-21 e na emenda: no registro de aprovações.

**Os limites.** 4 perguntas por cartão, que espera 30 min (do OS); 4 conferências por turno; 20
problemas e 60 s por passo.

**Fica de fora.** Prévia, envio e Alterações (14.1); Conexões (19 e 20); página pública;
starters por tipo de app (depois, com avaliações); eventos e agendas. Issues `next-card`: 232 a 238,
da 13, esperam o conserto dela; as da 12.x tocam telas fora destas pastas.

**Emenda de 2026-10-22**: a linha de ferramenta abre; "Pensou", só o tempo;
o portão de biblioteca sai (fundador, «A»: sem lista, sem cartão, sem concessão); o plano longo abre inteiro; sem teto de operações; o app confere com o
próprio Zod. O registro único da conversa é a etapa 14.0.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | Registro 0055 e as regras trocadas | `docs/` | testes | 13 fechada |
| U2 | O contrato afrouxado e o SDK `@conexus/app` | `packages/app-contract/`, `packages/app/src/`, `platform/cloudflare.ts` | dados | U1 |
| U3 | O starter editável | `packages/app/starter/`, `builder/git/` | web | U2 |
| U4 | A montagem, `conexus_check` e o fim do turno | `packages/app/src/check/`, `infra/e2b/`, `scripts/app-pack.ts`, `builder/machine/`, `builder/conversation/` | segurança | U2, U3 |
| U5 | Perguntas, plano e tarefas no servidor | `builder/conversation/`, `builder/runs/`, `hub-api/`, migrações | dados | U1 |
| U6 | Os cartões e a linha que abre | `apps/web/src/builder/conversation/`, `builder/conversation/`, `hub-api/` | web | U5 |
| U7 | O prompt e as skills | `builder/conversation/prompt/`, `packages/app/skills/` | testes | U2 a U5 |
| U8 | Percurso e prova | `tests/e2e/`, `docs/how-to/` | testes | todas |

`builder/`, `platform/`: `apps/server/src/`; `hub-api/`: `packages/hub-api/src/`. U2 e U5 em paralelo; QA (T25) antes das revisões (L9). **Pacotes novos**: `@conexus/app`; no
starter, os cinco do OS (auditoria de base, §5); raiz: `package.json`,
`package-lock.json`, `biome.json`, `ci.yml`.

**Orçamento de código alterado.** U2 470; U3 150 (shadcn é gerado);
U4 520; U5 500; U6 630; U7 650 (texto); U8 80. Total: **3.000**, teto 4.000 (L2).

## Os critérios de aceite

Pelas rotas e `main.ts`, `Machines` dublê (`LocalSandbox`, template local), modelo gravado
(`record-provider`); os do SDK pela API de `@conexus/app`. 6 e 8 a 14 dependem do 31, que a U4 roda
primeiro. **Ao vivo**: firstmate, anotado no 0055; a suíte não chama serviço de fora (T14). Todos must.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova |
| --- | --- | --- | --- |
| 1 | U1 | 0055 "proposed" antes do código, citando o já provado | o registro |
| 2 | U2 | `Manifest` é contrato, entrada, arquivos e migrações; zero ou mais operações, sem teto ("A"); os guardados seguem válidos, `operations` aceita e não lida | `manifest.test.ts` |
| 3 | U2 | Pelo `fetch` do Worker: e-mail inválido 400 `INPUT_INVALID`; a encomenda da Ana 200, com o padrão e a data codificada; saída com transform de mão única 500 `OUTPUT_INVALID`, nunca exceção; `manifesto`: `z.date()` sem codec, `bigint` ou `Map`: `OPERATION_NOT_JSON` com a operação e o caminho | `runtime.test.ts`, `check.test.ts` |
| 4 | U2 | `defineHandlers`: entrada fora 400 `INPUT_INVALID`; saída fora 500 `OUTPUT_INVALID`; o que lança, `HANDLER_FAILED` sem a mensagem; sem operações, `/api` 404 `OPERATION_NOT_FOUND` | `runtime.test.ts` |
| 5 | U2 | `write` grava tudo ou nada (`db.batch`); erro do banco: `DatabaseRefused`, só o SQLSTATE; `createApi`: falha vira `CallFailed`, `failureText` em português | `server.test.ts`, `client.test.ts` |
| 6 | U2 | Todo upload leva `not_found_handling: 'single-page-application'`; `/api` segue no Worker | `cloudflare.test.ts` |
| 7 | U3 | O starter passa em todos os passos, sem violação de CSP (`headers.ts:11`); Projeto sem `main`: o primeiro turno parte dele, sem número de versão, sem regravá-lo | `starter.test.ts`, `runs.test.ts` |
| 8 | U4 | Handler que devolve `{ codigo }`: `tipos` falha com `server/handlers.ts:13` e TS2322; passo que falha pula os seguintes | `check.test.ts` |
| 9 | U4 | `dependências`: instala por `npm ci --json --ignore-scripts`; o erro do npm sai pelo seu `error.code` (`INSTALL_FAILED` do app; registro fora do alcance é da máquina); sem portão de biblioteca (fundador, «A»); um import sem pacote falha em `tipos` | idem |
| 10 | U4 | Mudar `main.tsx`, `styles.css` ou os componentes: passa; sem `CSPProvider`, a tela injeta `<style>`: `navegador` falha | idem |
| 11 | U4 | `navegador`: violação de CSP ou `#root` vazio falham; erro de console só informa e a versão monta | idem |
| 12 | U4 | `conexus_check` e o processador, o mesmo relatório; sem Chromium ou 60 s: `CHECK_PLATFORM_FAILED`, sem contar tentativa | `conversation-check.test.ts` |
| 13 | U4 | Fim do turno: falha volta ao Builder; 4 falhas: guarda o código, "não montou", `APP_CHECK_FAILED`; sem arquivo mudado: sem conferência | idem |
| 14 | U4 | `Machines.pack`: a pasta da versão passa no `Manifest`; acima de `APP_LIMITS`, link ou não regular: `TOO_LARGE`, `NOT_REGULAR`, sem ler o resto (C59, S2) | `pack.test.ts` |
| 15 | U5 | `ask_user` com 5 perguntas ou `multiSelect` sem opções: recusado ao modelo; 1 a 4: a volta espera, chega a parte `question` | `conversation-questions.test.ts` |
| 16 | U5 | `answerQuestion` do dono da Conversa: a volta continua; repetida ou fechada: `QUESTION_CLOSED`; número errado de respostas: `QUESTION_ANSWERS_INVALID`; outra pessoa ou empresa: 404 (S10) | idem |
| 17 | U5 | `submit_plan` fora de `.conexus/plan.md`: recusado; no caminho: a parte `plan`; **Pedir ajustes** retoma com `{action: 'rejected', feedback}`, o modelo lê "User feedback: …"; **Aprovar e construir** continua; relida pela rota da Conversa depois de reiniciar o Hub, a parte `plan` volta com texto e estado | idem |
| 18 | U5 | 30 min sem resposta: `stopped`, `QUESTION_EXPIRED`, e relida, a parte `expired`; **Parar** ou Hub reiniciado com pergunta aberta: a chamada fecha negada, nada no banco do Mastra; mensagem com pergunta aberta: `session.steer`, a pergunta sai com `tool_suspension_cancelled`, a mensagem segue na volta; sem pergunta: `RUN_BUSY` | idem, `runs.test.ts` |
| 19 | U5 | **Removido** (fundador, 2026-10-22, «A»): não há cartão de biblioteca, concessão nem lista; o modelo usa as do starter e acrescenta o que o app pede | — |
| 20 | U5 | `task_*`: a parte `tasks` chega e sobrevive à recarga | `conversation-parts.test.ts` |
| 21 | U6 | Com os textos aprovados: cartões de pergunta (pelo `questionnaire`: até 4, escolha, texto livre, enviar) e plano, lista de tarefas; estados da matriz; teclado e nomes (V30, V31) | `cards.test.tsx` |
| 22 | U6 | 1280, 390 px, 200 %, dois temas, CSP limpo | T23 |
| 34 | U6 | Plano que não cabe: cortado com esmaecido e **Ler plano completo**; que cabe: sem o botão; o botão abre o `Dialog` com o plano inteiro (tela cheia a 390 px), **Aprovar e construir** e **Pedir ajustes** dentro | `cards.test.tsx`, T23 |
| 23 | U7 | O teste guarda a tabela de `builder-prompt.md`, veredito e texto por linha do OS; o prompt tem cada `igual` e `adaptada`, nenhuma `tirada`; o CI não lê o OS | `prompt.test.ts` |
| 24 | U7 | Os exemplos `.ts` e `.tsx` das skills tipam no starter e no SDK; um quebrado falha; `validateSkillContent` passa; `conexus-app` ensina página, painel e sistema | `skills.test.ts` |
| 25 | U7 | A linha 51 do OS só enquanto `main` é o starter; `AGENTS.md` e `.conexus/memory/MEMORY.md` lidos do `main`; ausentes, a frase de vazio; só a descrição de `conexus_check` diz quando conferir, nada diz que a máquina não monta | `prompt.test.ts` |
| 26 | U8 | Os seis passos do roteiro, modelo gravado | `tests/e2e/builder-builds.test.ts` |
| 27 | U8 | **Ao vivo**: o pedido da Ana, 3 vezes com Gemini 3.8 Flash High e 1 com Claude: perguntas e plano, monta no primeiro turno, nada fora de `/home/user/app`; `abort` com `retry` reabre o laço | 0055 |
| 28 | U8 | **Ao vivo**: na máquina, `npm ci --ignore-scripts` instala uma biblioteca fora do starter pelo `registry.npmjs.org` (0051) | 0055 |
| 29 | U8 | **Ao vivo**: no despachante, recarregar `/encomendas` de um app de rotas dá a tela; `/api/<op>` segue no Worker | 0055 |
| 30 | U8 | QA no commit candidato (T25); o roteiro publicado, pelo fundador (L17) | `conexus-qa`, fundador |
| 31 | U8 | **Ao vivo**: o template no E2B, tamanho e início anotados; a montagem pelo `wrangler` dá o do laboratório | 0055 |
| 32 | U4 | Modelo gravado: o primeiro comando roda em `/home/user/app`; nenhuma chamada nomeia caminho fora | `conversation-machine.test.ts` |
| 33 | U6 | A linha abre no comando e na cauda, no começo do arquivo, no trecho antigo e no novo, cortados em `DETAIL_LIMITS`; saída não zero: o código; segredo plantado: `***` no fio e na releitura, que dá o mesmo detalhe; "Pensou": o tempo, sem texto | `conversation-parts.test.ts`, `tool-row.test.tsx` |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Cartão de perguntas | o cartão aberto | — | "Enviando…", botão parado | "Não foi possível enviar. Tente de novo." | — | — (a Conversa é só do dono) | "Esta pergunta expirou." |
| Cartão do plano | o plano e os dois botões; **Pedir ajustes** abre o campo do motivo; plano longo: cortado, esmaecido, **Ler plano completo** | — | idem | idem | — | — | "Este plano foi substituído." |
| Lista de tarefas | some sem tarefas | idem | "em andamento", uma por vez | — | — | — | "concluída" |
| Cartão da versão | "Versão N guardada, montou" | — | — | "Versão N guardada, não montou" e o código | — | — | — |
| Linha de ferramenta | fechada, o assunto | sem detalhe, não abre | a saída cresce | código de saída não zero | — | — | "…" no corte |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| parte `question {toolCallId, questions, state: 'open' \| 'answered' \| 'expired' \| 'closed'}`; pergunta `{question, header?, options, multiSelect}` | U5 | U6 |
| parte `plan {toolCallId, title, plan, state: 'open' \| 'approved' \| 'rejected' \| 'expired' \| 'closed'}` | U5 | U6 |
| parte `tasks {items}` | U5 | U6 |
| parte `tool` ganha `detail: {kind: 'command', command, output, exitCode} \| {kind: 'file', path, content} \| {kind: 'edit', path, before, after}`; sai a parte `shell` | U6 | U6 |
| parte `version` ganha `check: {state: 'passed'} \| {state: 'failed', code: 'APP_CHECK_FAILED'}` | U4 | U6, 14.1 |
| `builder.run.state` ganha `waiting` | U5 | U5 (retomada), `answerQuestion` |
| `CheckReport` | U4 | o modelo, o processador, a parte `version` |

**Os desenhos** (capturas do OS na U6, A; `ask-user-pt.tsx`, `plan-pt.tsx`):

```text
1280 Conversa                                390 Conversa
┌Quem cadastra as encomendas?──────┐         ┌Quem cadastra?───────┐
│(•)Todos(recomendado) ( )Só eu    │         │(•)Todos(recomendado)│
│[outra resposta…]        [Enviar] │         │( )Só eu     [Enviar]│
├Plano: App de encomendas──────────┤         ├Plano────────────────┤
│Para a pessoa… (Markdown)         │         │texto…               │
│░░░ esmaecido ░░[Ler plano completo]        │[Ler plano completo] │
│[Aprovar e construir][Pedir ajustes]        │[Aprovar e construir]│
└──────────────────────────────────┘         └[Pedir ajustes]──────┘
Ler plano completo → Dialog (390: tela cheia)
```

## A tabela de falhas

| Gravação ou comando | Duas vezes | Recusada no meio | Dependência fora | Imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `/opt/conexus/check` (ferramenta e fim do turno) | uma por chamada; só leitura | prazo e sinal (C57) | a máquina: `CHECK_PLATFORM_FAILED` | `APP_CHECKED` | 8 a 13 |
| `npm ci --ignore-scripts` | a mesma árvore | prazo e sinal | npm fora: `CHECK_PLATFORM_FAILED` | — | 9, 28 |
| `Machines.pack` | uma por chamada | prazo e sinal | a máquina | `APP_PACKED` | 14 |
| Upload com `single-page-application` | o da etapa 9 | idem | Cloudflare: o da 9 | o da 9 | 6, 29 |
| Starter como base do `main` | só sem `main` | a gravação da 13 | R2 da 13 | `PROJECT_STARTED` | 7 |
| `builder.run` `waiting` | posse da 13 | retomada fecha a chamada | o banco: a volta termina | `RUN_WAITING` | 16, 18 |
| `answerQuestion` e `respondToToolSuspension` | `QUESTION_CLOSED` | a chamada segue aberta | Mastra: `INTERNAL_UNEXPECTED` | `QUESTION_ANSWERED` | 16, 18 |
| `steer`; `settleSuspendedToolCallsAsDenied` no Hub reiniciado | nativo; idempotente | na próxima retomada | — | `QUESTION_CLOSED` | 18 |
| Partes `question`, `plan`, `tasks`, `version` | a 13 | a mensagem guardada da 13 | o banco: a da 13 | — | 15, 17, 20 |
| Template do E2B | uma por firstmate | — | E2B pago | o nome | 31 |

## O que nasce novo e o que é trazido

| Mecanismo | Nativo, nosso ou trazido | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base | Como Mastra, vibesdk e Conexus OS fazem, `file:line` |
| --- | --- | --- | --- | --- | --- |
| Operações em Zod no Worker; manifesto, lista de embarque | nosso, novo | `packages/app/src/`, `app-contract/src/runtime.ts` | sem formas JSON | inverte o OS (`server-manifest.ts`) | OS `17-app-stack-decision.md:154-156`; vibesdk sem manifesto |
| Navegação de página única | nativo | `platform/cloudflare.ts:208` | — | — | Cloudflare `not_found_handling`; vibesdk `think-user-deploy.ts:56` |
| Starter editável | trazido como ideia | `packages/app/starter/` | sem casca guardada | `jitless`, `CSPProvider` | OS `starter-template/`; vibesdk `think.ts:160-161` |
| Conferência | trazido como ideia | `packages/app/src/check/` | passos do contrato | um passo que falha pula os seguintes | OS `check/report.ts:3-15`; vibesdk `run_analysis` |
| Conferência no fim do turno | nativo | `builder/conversation/processors.ts` | — | 3 retentativas (OS `builder.md:54`) | `abort(…, {retry: true})` (`processors/index.d.ts:543,739`) |
| Perguntas e plano | nativo, embrulhado | `builder/conversation/plan-tools.ts` | um modo só; sem lista nossa | 4 perguntas | `askUserTool`, `submitPlanTool`, `steer`; OS `harness/tools.ts:64-150` |
| Linha que abre | nosso; a forma da Factory (A) | `tool-row.tsx`, `parts.ts` | — | máscara (S2) | Factory `ToolCard.tsx:41,54,64`; vibesdk `exec-commands.ts:35-46`; OS cru |
| Cartão de perguntas | nativo | `question-card.tsx` | — | 4 perguntas | `@shadcn/react` `questionnaire`; OS `ask-user-pt.tsx`, à mão |
| Volta que espera | trazida | `builder/runs/` | `waiting` | 30 min | OS `run/run.ts:240-256` |
| Prompt e skills | trazidos, adaptados | `builder/conversation/prompt/`, `packages/app/skills/` | a tabela da U7; formas | seis estágios, três classes de decisão | OS `harness/prompt.ts:46-89`, `builder-skills/`; vibesdk `think/skills.ts:15-24` |

**A medida do transplante.** Nenhum código copiado; o prompt segue a U7.

**A dívida.** Nenhuma.

## U1 Registro 0055 e as regras trocadas

**Raio.** `docs/decisions/0055-apps-on-the-platform-contract.md`: cria. `docs/{architecture,index}.md`,
`docs/decisions/{0019,0053}-*.md`, `docs/reference/boundaries.md`: muda. Chama: `check-docs`.

**Contratos.** 0055: o app é escrito contra o contrato, sobre um starter editável; o contrato é dono
de `shared/operations.ts`, `server/handlers.ts`, do cliente gerado, de `worker.js`, da conferência e
da montagem; o resto é do modelo. **Regras trocadas, não acrescidas**: contrato 1 "1 a 32 operações"
vira "zero ou mais" (0019: os guardados seguem válidos); 0019 e 0055 com as frases do estudo do
contrato ("O que muda no card 14 e na 0055"); cartão 9 "`serveApp` chamado pelo app" vira
"gerado pela montagem"; saem a entrada de `boundaries.md` do manifesto como única conferência e a
skill do contrato (`skill.ts`), pelas da U7; 0053 "the controller's own such tools stay disabled"
vira "`ask_user`, `submit_plan` e `task_*` ligados, embrulhados"; `live.ts:289` "`suspended` cannot
happen" cai.

## U2 O contrato afrouxado e o SDK

**Raio.** `packages/app-contract/src/{manifest,runtime}.ts`, `platform/cloudflare.ts`, `tests/apps/recados*`:
muda; chama: envio, Hub, despachante. `packages/app/`: cria (sem `manifest-of.ts`); chama: o
starter, a conferência, as skills.

**Contratos.** `Manifest = {contract: 1, entry, migrations, assets, operations?}`, `operations`
aceita e não lida. `serveApp({operations, handlers})`: `input.safeParse`; saída por `safeEncode`, cujo
erro vira `OUTPUT_INVALID`; `Handlers` recebe `z.output<input>`. `not_found_handling:
'single-page-application'` no upload (`cloudflare.ts:208`). `defineOperations`, `defineHandlers`
(`Context = {db, caller}`, 0019), `query<R>(db, row: ZodType<R>, text, values?)`, `write(db,
Statement[])`, `DatabaseRefused {code: Sqlstate}`, `createApi`, `CallFailed {code}`, `failureText: Record<AppFailureCode, string>`,
dono das frases (C26). `OperationName` marcado (C23). Entrada: o corpo do `POST` (C27).
Modelo: `runtime.ts` (C21, C23, C26).

**Ordem.** Regras: C21, C23, C26, C27, D28. Funções: `zod@4.6.5` `safeParse`, `safeEncode`. Saem
`Shape`, `schemaOf` e `manifest-of.ts`, antes de pôr; o Recados e os apps de defeito do passo 10, em
Zod (estudo do contrato, §8, provado no `workerd`). **Prova.** 2 a 6.

## U3 O starter editável

**Raio.** `packages/app/starter/`: cria; chama: o template (U4), `builder/git/`.

**Contratos.** Do estudo das formas, §8.2: `src/router.tsx` com uma rota `/`, sem Sidebar;
`src/routes/home.tsx` "Este app ainda está vazio"; provedores e `CSPProvider` em `main.tsx`;
componentes shadcn `base-nova` (`npx shadcn add`, gerados); `lib/` com o codec de data (estudo do contrato, §8); sem `server/` nem `shared/`; tudo editável. `startProject({projectId}): Result<Sha, GitFailure>`, só sem `main`. Modelo: `builder/git/`
da 13 (C21, C23). Regras: W21, W22, V19. **Prova.** 7.

## U4 A montagem, `conexus_check` e o fim do turno

**Raio.** `packages/app/src/check/`: cria. `infra/e2b/template.ts`, `scripts/app-pack.ts`,
`builder/machine/`: muda. `builder/conversation/{processors,builder}.ts`: cria, muda.

**Contratos.** `/opt/conexus/check` (só leitura): `dependências` (9), `manifesto` (só "cabe em JSON",
por `z.toJSONSchema`, estudo do contrato §8; gera o manifesto e `src/conexus/api.gen.ts`), `tipos` (DOM e servidor), `telas` (`vite build`), `worker` (`workerSource` dá `operations` a `serveApp`, `wrangler deploy --dry-run --outdir`, `Manifest.parse`), `navegador` (11). A lista de pacotes vem do servidor (U5), nunca da árvore. `CheckReport = {ok, steps: [{name, state:
'passed' | 'failed' | 'skipped' | 'informed', problems: [{file, line, column, code, message}]}]}`,
esquema Zod (C27). `Machines.check({projectId}): Result<CheckReport, 'CHECK_PLATFORM_FAILED'>`;
`Machines.pack({projectId}): Result<VersionFolder, PackRefused>`, por `receiveVersion` (S2), para a 14.1. `CHECK_LIMITS = {problems: 20, stepMs: 60_000, checks: 4}` (C26). `conexus_check`: sem
entrada, a descrição do OS. `checkGate: Processor` em `processOutputStep`, sem
`toolCalls`, com arquivos mudados; falha: `abort(…, {retry: true})`; `retryCount` 3 termina. `APP_CHECK_FAILED`, `CHECK_PLATFORM_FAILED`, `OPERATION_NOT_JSON` (C48). Template:
Node 24, `/opt/conexus` (cache npm das pré-aprovadas, `@conexus/app`, `wrangler`, Chromium).
Rede: só `registry.npmjs.org` (0051).
**A pasta**: uma máquina e uma pasta por Projeto, `APP_FOLDER` (C26), dita por `E2BSandbox({workingDirectory,
instructions})` e `MachineFilesystem.getInstructions` no lugar de "Cloud sandbox."; `/opt/conexus`,
fora do workspace. **Escolha**: a fronteira é a máquina do Projeto; prender o shell, sem opção
nativa, recusado (auditoria de base, área F). Modelo:
`model-accounts/processors.ts` da 12 (C21, C26).

**Ordem.** 1. O 31. 2. Regras: C50, C56, C57, C59, C75, S2, S14. Ler inteira
`dist/docs/references/docs-agents-processors.md`. **Prova.** 8 a 14, 32.

## U5 Perguntas, plano, tarefas e bibliotecas

**Raio.** `builder/conversation/{builder,plan-tools,live,parts,routes,instructions}.ts`,
`builder/runs/`, `builder/packages/`, `apps/server/migrations/`, `apps/server/database-grants.sql`,
`hub-api/{conversations,failures,index}.ts`: cria, muda; chama: `main.ts`, web, OpenAPI, remoção.

**Contratos.** `disableBuiltinTools: ['ask_user', 'submit_plan', 'subagent']`; `ask_user` e
`submit_plan` sob o id nativo, embrulhados como no OS (`QUESTION_LIMITS = {questions: 4, waitMs: 30
min}`, C26; só `.conexus/plan.md`); `task_*` nativos. `builder.run.state` ganha `waiting`. `answerQuestion` `POST
…/conversations/{conversationId}/questions/{toolCallId}`, dono da Conversa (0050), outro 404: `{kind:
'answers', answers} | {kind: 'plan', action, feedback?}`, `feedback` exigido em `rejected` → 202; 409 `QUESTION_CLOSED`, 422 `QUESTION_ANSWERS_INVALID`; Zod (C27). `ToolCallId` marcado (C23). Nativos, sem
fecho nosso: `respondToToolSuspension`, `rejected` e `session.steer`; o Hub reiniciado fecha por
`settleSuspendedToolCallsAsDenied` (estudo de como o Builder constrói, §5). **Sem lista nossa**: plano
e "expirou" no `suspendPayload` e no resultado, lidos de `metadata.suspendedTools` ou dele (C26, C75;
estudo da conversa, U-d). Modelo: `runs/settle.ts` da 13 (C21).

**Ordem.** 1. Prova no `@mastra/core` instalado: suspender, responder, retomar, negar; senão, card. 2. Regras: C21, C23, C48, C62, C65, D11, S8, S10, S41. **Prova.** 15 a 20.

## U6 Os cartões e a linha que abre

**Raio.** `apps/web/src/builder/conversation/{question-card,plan-card,task-list}.tsx`: cria;
`transcript.tsx`, `builder-turn.tsx`, `tool-row.tsx`, `fold.ts`: muda; `shell-output.tsx`: apaga.
`builder/conversation/{parts,live,shell}.ts`, `hub-api/conversations.ts`: muda; chama: web, OpenAPI.

**Contratos.** Cada cartão lê a sua parte e chama `answerQuestion`; textos em português (L23). O de perguntas, o `questionnaire` do
`@shadcn/react` 0.3.1, com o encaixe provado antes; senão, card (auditoria nativa, achado 9). **O plano longo** (34): como o controle do Mastra (playground-ui
`plan.tsx:259`) e a tela do OS (`plan-pt.tsx:58-70`), no `Dialog` do shadcn. **A linha que abre** (estudo da conversa, U-a):
`tool.detail` dos args, do resultado e de `data-sandbox-exit` gravados, por `masked()` (S2, S41),
cortado em `DETAIL_LIMITS` (`hub-api`, C26), como a Factory: comando, `SUBJECT_MAX_LENGTH`; saída,
`SHELL_MAX_*`; arquivo, 2.000 caracteres; edição, 200 linhas por lado, diferença no navegador;
leitura, só o assunto. "Pensou", só o tempo (V39). Regras: C26, C28, V19, V29 a V31, V54, W22, W31. **Prova.** 21, 22, 33, 34.

## U7 O prompt e as skills

**Raio.** `builder/conversation/prompt/{builder.md,prompt.ts}`: cria; `instructions.ts`: muda.
`packages/app/skills/{conexus-plan-new,conexus-plan-change,conexus-build,conexus-app,conexus-data}/`:
cria; chama: `createSkill`.

**Contratos.** `instructions` como função (estudo de como o Builder constrói, §7). Quando conferir, só a
descrição de `conexus_check` diz; a linha 54, o que o Conexus faz no fim (auditoria nativa, achado 10). Skills do OS sem `conexus/`, lista fixa, runner, CTE e `conexus_run_operation`; `conexus-data`, o Zod do app e o que não viaja em JSON (estudo do contrato, §8); `conexus-app`, as três formas (página, só `home.tsx`; painel; sistema com Sidebar), as referências
do OS (`shell`, `list`, `record`, `dashboard`, `form`) e nenhum cartão de biblioteca.

**A tabela do prompt**: [reference/builder-prompt.md](../reference/builder-prompt.md), movida sem mudar.

**Ordem.** Regras: T5, S2, S40, L23. **Prova.** 23 a 25.

## U8 Percurso e prova

**Raio.** `tests/e2e/builder-builds.test.ts`, `package.json`, `docs/how-to/builder-builds.md`,
`docs/index.md`: cria. **Prova.** 26 e 30 (QA) no commit candidato; 27 a 29 e 31 antes do merge; 30
(fundador) após o Release (L17).
