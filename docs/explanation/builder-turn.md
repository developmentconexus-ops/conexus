# The Builder turn

A person writes to the Builder in a Project's conversation. A few minutes later the Prévia shows a
new version of the app, or the conversation says why not. This page follows one turn through the
code, from the message to the version. The Mastra pieces it uses are explained in
[the harness](harness.md), the check in [the app package](app-package.md), and what the Hub does
with the version in [the Hub side of an app](hub-apps.md). `builder/` below means
`apps/server/src/builder/`.

## The pieces a turn touches

- One Builder agent for every conversation, made with Mastra's `createCodingAgent`, on one
  `AgentController` (`builder/conversation/builder.ts`).
- A conversation is a Mastra thread in Mastra's database. The Hub's database keeps only an index
  row per conversation, naming its company, Project and person (`builder/conversation/store.ts`).
  The index decides who may open a thread; Mastra's routes name no Project.
- Each Project has a bare Git repository on the server's disk. Its `main` is the app's code, and
  each commit after the starter is a version (`builder/git/repository.ts`).
- Each conversation has an E2B machine where the model edits and runs code
  (`builder/machine/machines.ts`).
- `Runs` (`builder/runs/runs.ts`) remembers which run writes in which Project. It lives in memory
  only, so a restart holds no run.

## Opening a conversation

The Project page's box calls `createConversation` with an attempt key
(`builder/conversation/routes.ts`). The server admits the person (a member whose role allows
`useConversations`, on a live Project), derives the conversation id from the attempt key, writes
the index row and creates the controller session with the conversation's model and effort
(`builder/controller-kit/open.ts`). A repeated attempt finds the same conversation.

## Sending a message

The browser sends through `@mastra/client-js` to `POST /api/builder/agent-controller/builder/sessions/<id>/messages`,
one of the seven Mastra routes the Hub exposes. Its client never retries, because a retried write
would say a message twice (`apps/web/src/builder/conversation/session.ts`). Before Mastra sees the
request, the Hub's guard (`builder/conversation/guard.ts`):

1. refuses a `requestContext` or `include` sent by the browser;
2. reads the thread and checks it belongs to the signed-in person and to the `builder` controller;
3. admits the person again from the index row, now;
4. refuses a new message while the Hub is updating (`HUB_UPDATING`);
5. stamps the author on the request context.

Steps 2 and 3 refuse with the same `CONVERSATION_NOT_FOUND`, so a stranger learns nothing; step
1 answers `REQUEST_MALFORMED` and step 4 `HUB_UPDATING`.

## The run takes the Project

Mastra resolves the agent's workspace, instructions, tools and skills for the run, then calls the
input processors (`builder/controller-kit/factories.ts`):

1. `turnOf` (`builder/conversation/turn-of.ts`) finds the conversation's Project from the index
   and calls `Runs.take`. One run writes in a Project at a time, whoever started it. If another
   conversation holds the Project, the run aborts with `RUN_BUSY` and the holder's name, before
   any model call.
2. `accountPick` (`builder/model-accounts/processors.ts`) picks the model account for each step
   from the person's queue, with its thinking effort. At step 100 it forces a last answer with no
   tools.

The workspace is resolved before the run takes the Project, so a refused run holds a workspace
that never touched a machine. The machine starts on the first tool call.

## What the model knows

The instructions are rebuilt on every call, resumed runs included
(`builder/conversation/instructions.ts`). The template is `builder/conversation/prompt/builder.md`.
It is filled with the Project's name, the date in São Paulo, the app folder, the check's limit of
four rounds, the Project's granted connections (names and concepts, never values), and two files
read from `main` on the server: `AGENTS.md` and `.conexus/memory/MEMORY.md`. They come from `main`,
not from the machine, so a turn cannot write its own next prompt before a version is saved. The
machine's own description (Node, npm, Git, the closed network and any merge conflicts) comes from
the workspace at each step (`builder/machine/kit.ts`). How each line of the prompt relates to the
old one is in [the Builder's prompt](../reference/builder-prompt.md).

The skills from `packages/app/skills/` and the granted connectors' skills reach the model inline,
through the skill tools. The prompt tells the Builder which to load: a planning skill first, then
`conexus-build`, `conexus-app` and `conexus-data` before the code they cover. A new app or a
change worth deciding goes through a plan the person approves with `submit_plan`.

## The tools

The mode's tool list is closed (`builder/conversation/permissions.ts`):

| Kind | Tools |
| --- | --- |
| Read | the workspace's read, list, grep and stat; `web_search`, `web_fetch`, `recall`; `connector_read`, `connector_notes`, `connector_note_save`; the skill tools |
| Edit | the workspace's write, edit, mkdir and delete |
| Run | the workspace's command tools; `conexus_check` |
| Talk | `ask_user`, `submit_plan`, `task_write`, `task_update`, `task_complete`, `task_check` |

The session starts with `yolo: true`, so no tool waits for approval
([0053](../decisions/0053-builder-tools-run-without-asking.md)). `ask_user` and `submit_plan`
suspend the run on a card. The run ends there, and the answer resumes it. A message sent while a
card is open is accepted, and Mastra holds it until the card is answered, then carries it into
the run the answer opens (`builder/conversation/conversation-steer.test.ts`). `web_search` exists only for models whose
provider search Mastra supports.

## The machine and Git

The machine is found by a name and marks derived from the conversation, and starts paused or new
(`builder/machine/machines.ts`, `builder/machine/e2b.ts`). It allows outbound traffic only to
`registry.npmjs.org`. On the turn's first start, the server sends a Git bundle of `main`. A new
machine checks it out into `/home/user/app`. A machine that kept unsaved work from an earlier turn
merges that work onto `main`, and the model is told about any conflict
(`builder/machine/scripts.ts`). The server never talks Git over the network; bundles carry
everything. While the machine starts, copies or saves, the screen shows the phase as a transient
message part.

## The end-of-turn check

When the model stops, Mastra calls the `isTaskComplete` scorer `conexusCheck`
(`builder/conversation/processors.ts`). If tasks are still open, it sends the model back to them.
If the app folder changed, it runs the check on the machine. A failing report goes back to the
model, which continues; after four failed rounds the turn ends as `APP_CHECK_FAILED`. If the
machine could not check at all, the turn ends `unchecked` without spending a round. The model can
also call `conexus_check` itself during the turn, through the same `Runs.check`.

## Saving the version

Every end of a run, whether complete, suspended on a card, stopped with Parar or failed, reaches
`onBeforeAgentEnd` and then `Runs.finish` (`builder/conversation/end.ts`). Parar therefore keeps
what the model wrote. `saveRun` (`builder/runs/save.ts`):

1. does nothing if the machine was never touched;
2. asks the machine for one commit of the whole tree on the current `main`, without
   `node_modules`, and reads the bundle with a size cap. A tree that differs from `main` only in
   `.conexus/plans` counts as unchanged, so plans travel with the app but make no version alone;
3. fetches the bundle into a run ref with object checks, requires exactly one new commit whose
   parent is `main`, and inspects the tree (`builder/git/tree.ts`);
4. moves `main` by compare-and-swap. No other run can move it, since the run holds the Project;
5. tells the machine its new base, numbers the version and copies a bundle of `main` to R2
   ([0051](../decisions/0051-builder-machine-git-and-copy-in-r2.md)). A failed copy retries on a
   timer that exists only while a copy is pending.

A turn that changed the app is saved whatever the check said. The conversation gets one message of
Conexus's own parts, never sent to the model, with the saved version.

## From the version to the Prévia

Only a version whose check state is `passed` continues (`passed()` in `builder/runs/runs.ts`). The
message then says the Prévia is `sending`. The server reads the built version folder off the
machine (`builder/machine/pack.ts`), lets the machine go, and calls the Hub's
`sendFromBuilder`. The Hub stores the version, uploads its Worker, migrates the app database and
moves the Prévia pointer. The message is updated to `ready` or `failed`. The Project stays held
until the send is over, then the run lets it go and Mastra emits `agent_end`.

On the screen, a `ready` Prévia part refreshes the Project, and the Prévia frame loads the new
version (`apps/web/src/builder/conversation/use-session.ts`). The Código tab reads the files of
`main` from the server's Git, not from the machine (`builder/git/source.ts`). Publishing is a
separate act by a person.

## Streaming

The browser subscribes to the session's stream and reconnects with backoff. On every connect it
reads the transcript and the session state again, because the server does not replay what the
stream missed (`apps/web/src/builder/conversation/use-session.ts`). The server's
`BuilderServer` slims Mastra's state events to four fields, writes at the socket's pace and drops
a client more than 8 MiB behind (`builder/conversation/stream.ts`).

## Stopping, deleting and shutting down

- **Parar.** Parar calls Mastra's abort. The run's end still saves what was written.
- **Deleting a conversation, a Project or a company.** The Hub first stops the run from writing,
  so its end saves nothing and sends nothing. It then deletes the controller session, kills the
  machines and deletes the thread (`builder/conversation/public.ts`).
- **Shutdown.** The Hub stops the scheduler, refuses new messages and waits up to 180 seconds for
  the turns in flight, never aborting one (`apps/server/src/platform/lifecycle.ts`,
  `builder/mastra/hub-mastra.ts`). What remains after that is aborted, and each aborted run still
  saves what it wrote.
- **A crash.** A crash leaves no run held. The machine keeps its folder, and the next turn merges
  the unsaved work.
