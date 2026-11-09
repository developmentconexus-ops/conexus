# The harness

"Harness" here means the machinery around the model: what holds a conversation, runs a turn,
gives the model tools and a machine, keeps memory, and streams the result to the screen. Conexus
builds it on Mastra (decisions [0027](../decisions/0027-mastra-builder-engine.md) and
[0050](../decisions/0050-conversation-on-the-agent-controller.md)), at the versions in
`apps/server/package.json` (`@mastra/core` 1.82.0 today). This page explains which Mastra pieces
Conexus uses, how it configures them, what it wraps around them, and which installed pieces it
leaves alone. `builder/` below means `apps/server/src/builder/`. The import law keeps every
`@mastra/*` import inside `builder/` folders (`.dependency-cruiser.cjs`, rule
`mastra-only-in-builder`).

## One Mastra, four controllers

The server builds one `Mastra` instance (`builder/mastra/mastra.ts`) with a logger, a storage,
four agent controllers and one workflow. It passes no `agents`, `server`, `observability`, MCP,
vectors or scorers keys. `createHubMastra` (`builder/mastra/hub-mastra.ts`) owns its life:
`prepare()` creates Mastra's tables, `start()` starts Mastra's workers after every part is ready,
`settle()` stops the scheduler and waits for live turns at shutdown, and `close()` drains and shuts
Mastra down.

Each kind of conversation runs on its own `AgentController`, Mastra's harness for a long-lived
session: `builder`, `assistant`, `agents` and `construtor` (the screen that edits a Project agent's
draft). All four are built by `controllerOf` in `builder/controller-kit/factories.ts`, each with one
mode, `conversa`. For the Builder, the Assistant and the Construtor the mode's `availableTools`
is a closed list; the `agents` controller has none, and the tool set each version's code builds is
the closed set. The controller's built-in tools stay off
unless the mode offers them; Conexus supplies its own `ask_user` and, for the Builder,
`submit_plan`, under the native ids (`builder/conversation/plan-tools.ts`). The `subagent` tool is
never on.

A session's id is the thread's id and Conexus's conversation id. The thread's resource encodes the
kind and the owner, `<prefix>company:<c>:person:<p>` (`builder/controller-kit/kinds.ts`), and the
guard reads it to learn whose a thread is.

`initialState.yolo` decides approvals. The Builder, the Assistant and the Construtor run with
`yolo: true`, so no tool waits for a person ([0053](../decisions/0053-builder-tools-run-without-asking.md)).
The `agents` controller runs with `yolo: false`: each write tool carries its own
`requireApproval`, and every other tool is copied with a rule that never asks
([agents and automations](agents-and-automations.md)).

## The agents

| Agent | Built with | Model | Memory | Machine |
| --- | --- | --- | --- | --- |
| Builder | `createCodingAgent` (`builder/conversation/builder.ts`) | the session's | observational, with recall | the turn's E2B machine, lent by the controller |
| Assistant | `new Agent` (`builder/assistant/assistant.ts`) | the session's | observational | an E2B machine per conversation |
| Construtor | `new Agent` (`builder/construtor/construtor.ts`) | the session's | observational | only for its code-writing tool |
| Project agent | `new Agent` per published version, key `agent-<id>` (`builder/agents/agent.ts`) | the version's, or the person's | observational or plain, per version | per conversation, when the version asks |

No agent names a model in code. The model is read from the run's `RequestContext`, as Mastra's
router string `provider/model` (`routedModel` in `builder/conversation/builder.ts`). Every agent
shares `agentDefaults` (`builder/controller-kit/factories.ts`): the same processors,
`maxRetries: 0`, and a model timeout of 60 seconds to the first chunk and 10 minutes a step.

## Processors carry the model accounts

Model accounts live in processors, not in the agents
([0049](../decisions/0049-model-accounts-keys-sign-ins-queues.md)). The input processors are
the turn processor, which builds the person's `Turn` for the account queue (and, for the Builder,
takes the Project) and puts it on the request context, then `accountPick` (`builder/model-accounts/processors.ts`), which picks the account, the
model and the thinking effort for each step. The error processors are Mastra's
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

Memory is one factory, `conversationMemory` (`builder/conversation/builder.ts`): Mastra's
observational memory scoped to the thread, observing at 30,000 message tokens and reflecting at
40,000 observation tokens, with async buffering off. The title writer uses the turn's account. The
observer and the reflector use the company's memory models, read when the turn opens and picked
beside the queue, never through it (`builder/model-accounts/processors.ts`). Only the Builder turns on recall
inside its thread. Nothing uses working memory, semantic recall, vectors or embedders.

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

## Tools, skills and the scorer

Conexus writes its tools with `createTool`: `conexus_check`, `ask_user`, `submit_plan`, the
connector tools (`builder/connectors/connector-tools.ts`), the Assistant's own tools and the
Project agents' tools. From Mastra it takes `webFetchTool`, `webSearchTool` (only for Anthropic,
OpenAI and xAI models), the workspace tools and the controller's task tools.

Skills are inline: `createSkill` objects built from `packages/app/skills/` and from each
connector's skill, passed through the agent's `skills` option and read by the model through the
skill tools ([the app package](app-package.md)). Workspace skills are not used.

The Builder's end-of-turn judge is a code scorer made with `createScorer` and given as
`isTaskComplete` with `strategy: 'all'` (`builder/conversation/processors.ts`). It is the only
scorer; `@mastra/evals` appears only in a test.

## Workflow and scheduler

One workflow, `conexus-automation-run`, built with `createWorkflow` and `createStep`, runs
automations. Automations are rows of `mastra.schedules`. The scheduler polls every 10 seconds and
starts only when a schedule row exists. Renaming the workflow would make Mastra delete every
automation (`builder/automations/run.ts`).

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
Hub's own Fastify routes, not Mastra's.

## Installed and not used

- Tracing and observability: no exporter is installed, and nothing sets `observability`.
  Decision [0052](../decisions/0052-one-tracing-path-builder-to-grafana.md) proposes it.
- Mastra's `server` option, its auth providers and Studio.
- Agent networks, subagents, MCP clients and servers, channels, voice and structured output.
- Working memory, semantic recall and vector stores.
- Workspace search, LSP and workspace skills.
- Datasets, experiments and stored scorers; workflows beyond the one automation workflow, with
  no suspend and resume of workflows.
- `@mastra/schema-compat`, present only as a dependency of other Mastra packages.

`PostgresStore` still creates tables for its storage domains that Conexus never reads, such as
agents, datasets and observability.
