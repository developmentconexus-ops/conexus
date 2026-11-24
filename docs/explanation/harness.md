# The harness

"Harness" here means the machinery around the model: what holds a conversation, runs a turn,
gives the model tools and a machine, keeps memory, and streams the result to the screen. Conexus
builds it on Mastra (decisions [0027](../decisions/0027-mastra-builder-engine.md) and
[0050](../decisions/0050-conversation-on-the-agent-controller.md)), at the versions in
`apps/server/package.json` (`@mastra/core` 1.83.0 today). This page explains which Mastra pieces
Conexus uses, how it configures them, what it wraps around them, and which installed pieces it
leaves alone. `builder/` below means `apps/server/src/builder/`. The import law keeps every
`@mastra/*` import inside `builder/` folders (`.dependency-cruiser.cjs`, rule
`mastra-only-in-builder`).

## One Mastra, four controllers

The server builds one `Mastra` instance (`builder/mastra/mastra.ts`) with a logger, a storage,
four agent controllers and three workflows. It passes no `agents`, `server`, MCP, vectors or
scorers keys; `observability` is set (see Tracing below). `createHubMastra` (`builder/mastra/hub-mastra.ts`) owns its life:
`prepare()` creates Mastra's tables, `start()` starts Mastra's workers after every part is ready,
`settle()` stops the scheduler and waits for live turns at shutdown, and `close()` drains and shuts
Mastra down.

Each kind of conversation runs on its own `AgentController`, Mastra's harness for a long-lived
session: `builder`, `assistant`, `agents` and `construtor` (the screen that edits a Project agent's
draft). All four are built by `mountAgent` in `builder/controller-kit/mount.ts` from the agent's
ficha (see below), which calls `controllerOf` in `builder/controller-kit/factories.ts`, each with one
mode, `conversa`. For the Builder, the Assistant and the Construtor the mode's `availableTools`
is a closed list; the `agents` controller has none, and the tool set each version's code builds is
the closed set. The controller's built-in tools stay off
unless the mode offers them; Conexus supplies its own `ask_user` and, for the Builder,
`submit_plan`, under the native ids (`builder/controller-kit/ask-user.ts` and `builder/conversation/plan-tools.ts`). The `subagent` tool is
on only for the Assistant, with one helper type that reads (`builder/assistant/research.ts`).

A session's id is the thread's id and Conexus's conversation id. The thread's resource encodes the
kind and the owner, `<prefix>company:<c>:person:<p>` (`builder/controller-kit/kinds.ts`), and the
guard reads it to learn whose a thread is.

`initialState.yolo` decides approvals, and the ficha's `approval` writes it. The Builder, the
Assistant and the Construtor have `NOTHING_ASKS`, so they run with `yolo: true` and no tool waits for
a person ([0053](../decisions/0053-builder-tools-run-without-asking.md)). The `agents` controller has
`THE_WRITE_ASKS`, so it runs with `yolo: false`: each write tool carries its own `requireApproval`,
and the mount copies every other tool whose rule is not a function with a rule that never asks
(`askingOnlyByOwnRule`, `builder/controller-kit/mount.ts`; [agents and
automations](agents-and-automations.md)). The Builder and the Assistant stay in `yolo`, which approves
every approval gate on its own, so the notebook's `connector_note_save` asks by `suspend()`, as `ask_user`
and `submit_plan` do, and the person's yes or no resumes it (`builder/connectors/connector-tools.ts`).

## A ficha and the mount

Each agent is written as a **ficha**, a plain value that says what is its own, and one **mount**
turns any ficha into an `Agent` and its controller, the same way for the four. The types are in
`builder/controller-kit/spec.ts` (`AgentSpec`, and `ConversationSpec` for an agent that has a
controller) and the functions in `builder/controller-kit/mount.ts`. `agentOfSpec` is the only place
that calls Mastra's `Agent` constructor; `mountAgent` adds the controller
(`controllerOf`), its mode, the controller's own tools, the helpers and the machine. A ficha holds:

| Field | What it says |
| --- | --- |
| `id`, `name`, `description` | the agent's key and names (`AgentSpec`); a conversation's ficha has no `id`, since its controller's comes from `CONTROLLER_KINDS` |
| `kind` | which controller a conversation's ficha is for (`ConversationSpec`) |
| `prompt` | the instructions: `MESSAGES` (system messages in order, each `FIXED` with the one-hour cache mark, `TEXT`, `BY_MODEL` or `OF_RUN`), or `DELEGATED` (the agent of a conversation takes the saved version's) |
| `model` | `SESSION` (the conversation's model) or `OF_RUN` (the model the run's plan names) |
| `tools`, `skills`, `signals`, `scopes`, `knowledge` | what the agent gets; a key the ficha does not fill is not set on the `Agent` |
| `approval` | `NOTHING_ASKS` or `THE_WRITE_ASKS` (above) |
| `turn` | `SESSION` or `RUN`: how a run takes its turn in the account queue (below) |
| `memory`, `threads` | the memory each agent already makes (`conversationMemory`), for the agent and for the controller's threads |
| `judge` | how a turn ends: Mastra's `isTaskComplete` scorers; only the Builder has one |
| `processors` | the input processors around the account's pick (`beforePick`, `afterPick`) |
| `mode`, `own`, `subagents`, `workspace` | the controller's mode and closed tool list, its own tools under native ids, the helpers, and the machine the controller lends |

The four agents write their instructions in four different orders. Each order is kept as data in
the agent's ficha, and none is changed by the mount: joining them into one order would change what
the model reads, so it waits for the work that measures the agents one at a time.

| Agent | Instructions, in order |
| --- | --- |
| Builder | one string: `builder.md` filled with the Project's name, the turn's date, the model's knowledge cutoff, the check limits, the granted connections and the data block, then the data track's order (`dataOrder()`); no `conexus.md`, no cache mark |
| Assistant | `conexus.md` and `assistant.md` as one `FIXED` message; the data track's order; the block of the turn's model, when it has one (`BY_MODEL`); the block of who is speaking, the connections and what the person may do (`OF_RUN`) |
| Construtor | `conexus.md` (`FIXED`); the block of who is speaking and the connections (`OF_RUN`); the construtor manual (`construtor.md`) |
| Project agent | `conexus.md` (`FIXED`); the data track's order; the block of who is speaking and the connections; the version's own instructions with the note that its writes ask or that it only reads; the code-mode program's instructions, when the version has one. The agent of a conversation holds none of this: it delegates to the version's agent (`DELEGATED`) |

A test records the whole request each agent sends the model, per scenario
(`builder/<agent>/requests/<scenario>.snapshot`), so a change to a ficha or to the mount that
alters one byte of it turns that agent's tests red.

## The agents

| Agent | Built with | Model | Memory | Machine |
| --- | --- | --- | --- | --- |
| Builder | `new Agent` with its task signal, by its ficha (`builder/conversation/builder.ts`) | the session's | observational, with recall | the turn's E2B machine, lent by the controller |
| Assistant | `new Agent`, by its ficha (`builder/assistant/assistant.ts`) | the session's | observational | an E2B machine per conversation |
| Construtor | `new Agent`, by its ficha (`builder/construtor/construtor.ts`) | the session's | observational | only for its code-writing tool |
| Project agent | `new Agent` per published version, key `agent-<id>`, by a ficha made from the version (`builder/agents/agent.ts`) | the version's, or the person's | observational or plain, per version | per conversation, when the version asks |

No agent names a model in code. The model is read from the run's `RequestContext`, as Mastra's
router string `provider/model` (`routedModel` in `builder/controller-kit/model.ts`). Every agent
shares `agentDefaults` (`builder/controller-kit/factories.ts`): the same processors,
`maxRetries: 0`, and a model timeout of 60 seconds to the first chunk and 10 minutes a step.

## Processors carry the model accounts

Model accounts live in processors, not in the agents
([0049](../decisions/0049-model-accounts-keys-sign-ins-queues.md)). The input processors are
the turn processor (`turnProcessor`, `builder/controller-kit/turns.ts`), the same for every agent, which
builds the person's `Turn` for the account queue and puts it on the request context, then `accountPick` (`builder/model-accounts/processors.ts`), which picks the account, the
model and the thinking effort for each step. What differs is the ficha's `turn`: a `SESSION` turn is
held until the session's `agent_end`; a `RUN` turn is taken by the run alone. The Builder's is the
Project's lock as a named step, its `take` (`builder/conversation/turn-of.ts`): the run takes the
Project, or ends `RUN_BUSY` with the name of whose run holds it, before any model call. Mastra's
`threadLock` locks by conversation only, so this is Conexus code (see
[boundaries](../reference/boundaries.md)). The error processors are Mastra's
`CyberRefusalHandler` and `defaultStabilityErrorProcessors`, with the retry wrapped so it never
repeats an account's own failure, then the account queue, which moves to the next account. The
output processors are `CyberRefusalHandler`, one that keeps workspace metadata parts out of
memory, and one that aborts a run whose conversation was deleted. Conexus uses no moderation,
PII or prompt-injection processor.

Mastra resolves instructions, tools, skills and workspace separately for each run, and a resumed
run gets a new request context. `oncePerRun` (`builder/controller-kit/once.ts`) memoizes per
context, so one run reads the Hub once.

## Storage and memory

One `PostgresStore` (`builder/conversation/storage.ts`) writes Mastra's tables in schema
`mastra` of a database of its own, under the login `mastra_runtime`, on a pool `main.ts` owns
([0010](../decisions/0010-mastra-tables-own-database.md)). Mastra creates the tables at start;
Conexus code never writes them directly. It reads the thread state (the task list) and the
schedules through `storage.getStore`. Which thread belongs to whom is indexed in the Hub's own
database, outside Mastra's schema (`builder/conversation/public.ts`).

Memory is one factory, `conversationMemory` (`builder/controller-kit/memory.ts`), which each ficha's
`memory` and `threads` take: Mastra's
observational memory scoped to the thread, observing at 30,000 message tokens and reflecting at
40,000 observation tokens, with async buffering off. The title writer uses the turn's account. The
observer and the reflector use the company's memory models, read when the turn opens and picked
beside the queue, never through it (`builder/model-accounts/processors.ts`). Only the Builder turns on recall
inside its thread. Only the Assistant uses working memory, per person
(`builder/assistant/memory.ts`), and reads the company's Knowledge, tools that only read
(`builder/assistant/company-memory.ts`). Nothing uses semantic recall, vectors or embedders.

## Workspace, machine and filesystem

A `Workspace` gives the model files and commands on an E2B machine. It is built in
`builder/machine/machines.ts` for the Builder and in `builder/machine/conversation.ts` for the
others. Its sandbox is `E2BSandbox`, built in one adapter, `builder/machine/e2b.ts`: one-hour
timeout, pause on timeout, reattach when found by id, and all outbound traffic denied except a
host list (`builder/machine/kit.ts`). The machine starts on the first tool call
(`beforeToolCall`). Its filesystem is `SandboxFilesystem`, code transplanted from Mastra Code's SDK
into `builder/machine/sandbox-filesystem/`, because that SDK is not installed. The AST edit tool is
off. A Project agent with a machine also gets Mastra's code mode (`createCodeMode`) over an E2B
transport (`builder/agents/code-mode.ts`).

The files a person sends the Assistant do not travel in the model's prompt. Mastra's
`FileUploadProcessor`, built for each model call with that step's machine
(`builder/assistant/files.ts`), writes each non-image file to `uploads/<conversation>/` on the
conversation's machine and leaves the model a note with the path. The stored message keeps the file.
The model converts and reads it by parts with the machine's tools (`poppler-utils` and `pandoc` are
in the template), and `read_file` hands it only images as media. Images stay with the model.
Builder and agent conversations keep sending the whole file in the message.

## Tools, skills and the scorer

Conexus writes its tools with `createTool`: `conexus_check`, `ask_user`, `submit_plan`, the
connector tools (`builder/connectors/connector-tools.ts`), the Assistant's own tools and the
Project agents' tools. From Mastra it takes `webFetchTool`, `webSearchTool` (only for Anthropic,
OpenAI and xAI models), the workspace tools and the controller's task tools.

Skills are inline: `createSkill` objects built from `packages/app/skills/` and from each
connector's skill, passed through the agent's `skills` option and read by the model through the
skill tools ([the app package](app-package.md)). Workspace skills are not used.

The Builder's end-of-turn judge is a code scorer made with `createScorer` and given as
`isTaskComplete` with `strategy: 'all'`, in the `judge` field of its ficha
(`builder/conversation/processors.ts`). It is the only scorer; `@mastra/evals` appears only in a test.

## Workflow and scheduler

Two workflows, built with `createWorkflow` and `createStep`. `conexus-automation-run` runs
automations and is a row of `mastra.schedules`. `conexus-retention-prune` drops old traces at 03:30 in São Paulo
(`builder/mastra/retention.ts`). The scheduler polls every 10 seconds and
starts only when a schedule row exists. Renaming the workflow would make Mastra delete every
automation (`builder/automations/run.ts`).

## Tracing

One `Observability` with the storage exporter writes every controller's and workflow's spans, logs
and metrics to Mastra's own database, without the streamed chunks
(`builder/mastra/mastra.ts`, decision [0068](../decisions/0068-mastra-tracing-in-its-own-database.md)).

## The routes the browser reaches

The browser talks to the controllers through `@mastra/client-js`
(`apps/web/src/builder/conversation/session.ts`). On the server, `@mastra/fastify`'s
`MastraServer` registers exactly seven of `@mastra/server`'s `SERVER_ROUTES` under
`/api/builder`: a session's state, its stream, a new message, abort, a card's answer, a write's
approval and the transcript (`builder/conversation/guard.ts`). The Hub refuses to start if one of
them is missing from the installed server; every other Mastra route is a 404.

Each route is marked `access: 'session'`, so the Hub's own access hook reads the session first and
Mastra's auth stays off. A guard then checks the thread belongs to the signed-in person and to the
controller in the path, admits the person again, refuses a `requestContext` or `include` sent by
the browser, and refuses a new message while the Hub is updating. `BuilderServer` overrides the
stream to slim the state events, pace writes to the socket and drop a client more than 8 MiB
behind (`builder/conversation/stream.ts`). Creating, listing and deleting conversations are the
Hub's own Fastify routes, not Mastra's. So is changing a conversation's model: each agent's route
admits the person and finds the conversation, and `answerModelChange`
(`builder/controller-kit/routes.ts`) does the rest the same way for the Builder, the Assistant and
the Construtor. Mastra could serve this one route natively; that waits for the harness's second
step, which also renames the folders and the room.

## Installed and not used

- Mastra's `server` option, its auth providers and Studio.
- Agent networks, subagents outside the Assistant's one helper, MCP clients and servers, channels, voice and structured output.
- Semantic recall and vector stores.
- Workspace search, LSP and workspace skills.
- Datasets, experiments and stored scorers; suspend and resume of workflows.
- `@mastra/schema-compat`, present only as a dependency of other Mastra packages.

`PostgresStore` still creates tables for its storage domains that Conexus never reads, such as
agents, datasets and observability.
