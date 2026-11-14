# Agents, the Assistant and automations

Besides the Builder, three things talk to a model on a company's behalf: the Project agents a
company configures, the Assistant every person can ask, and the automations that send the
Assistant a prompt on a clock. Project agents and the Assistant are Mastra agents on the Hub's one
Mastra instance, each kind in its own agent controller; an automation is a Mastra workflow that
opens an Assistant conversation ([the harness](harness.md)). Server code is under
`apps/server/src/builder/`, written `builder/` below; request and answer shapes are in
`packages/hub-api/src/`.

## Project agents

A Project agent belongs to one Project. People edit a draft and publish frozen versions. The
configuration (`AgentConfig` in `packages/hub-api/src/agents.ts`) names the agent's
instructions, its model (or `null`, meaning the model of whoever is talking to it), whether its
memory is observational, the Project connections it may use, web access, reads of the app's
database, the tools it holds and whether each conversation gets its own machine.

The tables live in the Builder's space of the Hub database (`builder/agents/tables.ts`).
`agent` holds the draft, its revision, the active version and `active_by`, the person who made
that version active and answers for it. `agent_version` rows are written once and never change.
`agent_tool` and `agent_version_tool` pin tool versions from the company's tool library
(`builder/tools/`). A tool is a `PRESET` (one connector operation with fixed or bound values) or
`CODE` (a saved Worker run at the edge).

Publishing freezes the draft into the next version and makes it active
(`builder/agents/publish.ts`). Before it does, it checks, against roles read at that moment, that
the publisher's role holds every read the version gives, that every write fixes the fields its
operation declares `fixed`, and that a write left to run alone is published by a role holding
`publishUnattendedWrite`. Restoring an older version passes the same checks.

Every published agent is registered as its own Mastra `Agent`, keyed `agent-<id>`
(`builder/agents/registry.ts`). The registry is filled at start, before the scheduler, and swaps
an agent when a version is activated. A draft's agent is built fresh for each test turn and never
registered.

### A conversation with an agent

The agents' controller has one delegating agent that, on each request, forwards to the agent the
conversation names (`builder/agents/controller.ts`). The tools are built once per run
(`builder/agents/agent.ts`):

- each preset read is a tool named `tool_<slug>`; the model fills only the open fields, and the
  version's bound values win;
- `app_data_read` runs one `SELECT` on the Project's app database through its read login, when
  the version allows it and the Project has an app (`builder/app-data/tools.ts`);
- code tools call their saved Worker, uploading it again when the Worker is missing;
- `web_fetch`, and `web_search` where the provider offers it;
- with a machine, `show_file` and a program tool that runs code over the agent's reads.

Instructions are Conexus's fixed prompt, a block naming the company, the person, the date and
the connections, and the version's own text with one sentence saying whether it may write. Memory
is Mastra's observational memory scoped to the thread, so an agent remembers within one
conversation and never across conversations or people.

### Writes ask first, unless a person answers for them

A write tool asks for approval unless three things hold at that moment
(`builder/agents/tools.ts`). The tool must be set to run alone (`AUTO`). The person who answers
for the version must still be in the company and hold both `publishUnattendedWrite` and the
write itself. And the conversation must have no earlier send of the same operation still open.
Otherwise Mastra suspends the run and the screen shows a card.

A turn of a published agent carries its version and its answering person as a Mastra scope,
written once when the turn starts (`builder/agents/activation.ts`). A run resumed from a card
therefore keeps the version it started with, even if someone published a new one meanwhile.

The Hub's guard answers the card (`builder/conversation/guard.ts`). Only a card parked in the
live session can be answered, and an approver must hold the write in their own role. The write
then goes through the Hub's write path (`apps/server/src/hub/connectors/write.ts`). It checks
admission again, writes a mark derived from the thread and the tool call into the input, records
the send as `SENDING` in its own short transaction and sends once, with no retry. A repeated call
answers from that record, so one tool call never writes twice. An end the provider did not
confirm comes back to the model as `WRITE_UNCERTAIN`, with the advice to look for the mark
instead of writing again.

## The Assistant

The Assistant is one Mastra agent with its own controller (`builder/assistant/assistant.ts`).
A conversation's place is the whole company or one Project. Its model is the one the person
picked. Its tools are a closed set: the machine's files and commands, connector reads,
web fetch and search, skills (a `conexus` skill plus one per chosen connection), `ask_user`,
tasks, and its own `overview`, `show_file`, `propose_app`, `propose_app_change` and
`propose_automation`.

The Assistant never writes to a company system: it has no write tool, and its controller runs
with `yolo: true`, so no tool call waits for approval. It does not build apps either.
`propose_app` and `propose_app_change` return a card that hands the request to the Builder.

Its machine is an E2B sandbox per conversation with Python and Node and the usual analysis
libraries. Outbound traffic is denied except `registry.npmjs.org`, `pypi.org` and
`files.pythonhosted.org` (`builder/machine/kit.ts`). A connector read is saved whole under
`reads/` on the machine, and the model gets the first rows and the path. The machine pauses at
the end of each turn.

## Automations

An automation is a row in Mastra's schedules table, with its details in `inputData`. The Hub has
no table of its own for it (`builder/automations/automations.ts`). The input names the owner, the
place, a prompt and the chosen connections (`AutomationInput` in `builder/automations/run.ts`).
The cadence is `DAILY`, `WEEKDAYS`, `WEEKLY` or `MONTHLY`, always on São Paulo's clock, and a
company keeps at most 30 active automations, because each may send one e-mail a day
(`builder/automations/cadence.ts`).

Mastra's scheduler polls the table every 10 seconds, its default. The Hub starts Mastra's workers
after every agent is registered, and Mastra starts the scheduler only when a schedule row exists
(`builder/mastra/hub-mastra.ts`). On shutdown the scheduler stops first, so nothing fires after
the signal.

A fire runs the workflow `conexus-automation-run` in three steps:

1. `check` confirms the owner may still create automations. If not, it pauses the automation and
   ends `SKIPPED`.
2. `converse` opens a new Assistant conversation for the owner in the automation's place, sends
   the prompt marked `source: 'automation'` and waits up to 15 minutes for the turn. In this turn
   the Assistant cannot hand off to the Builder, and a question to the person ends the run.
3. `notify` writes a notification for the owner and, for a scheduled run or a pause, sends an
   e-mail. A run started by hand only notifies (`apps/server/src/hub/notifications/notifications.ts`).

The run's history is Mastra's workflow runs and trigger rows (`builder/automations/runs.ts`).
Its result is the Assistant conversation itself, which the owner opens from the notification and
which stays when the automation is deleted. Automations run only the Assistant today.
`AutomationInput` carries a `version` field so that a later target, such as a Project agent, can
join it.
