# The Sync: the company's copies

This page describes today's copy engine. Copies are moving, table by table, to each company's lake
on AWS ([0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md)) as Singer taps
([0071](../decisions/0071-connectors-kit-live-copies-singer.md)), and this engine leaves when the
seventh lake stage closes ([Data track](../steps/trilhas/dados.md)).

A copy is a table of a company system's rows, kept in the company's own database and refreshed on a
schedule, so a Projeto reads it without calling the system. This page explains how the pieces work
today. The kit's capability is in `packages/connectors/src/kernel/copy.ts`; the Hub's side is
`apps/server/src/hub/copies/`; the clock is `apps/server/src/builder/copy-clock/`; the SQL is
`apps/server/src/platform/copy-sql.ts`. How a template or a proposal came to be measured is decision
[0063](../decisions/0063-copy-models-proof.md).

## Where the rows and the state live

The rows are in the company's Neon database, in the schema `sync`, owned by the login `conexus_sync`
(`SYNC_LOGIN`, `platform/copy-sql.ts`). The Hub makes the login and the schema when a company
turns its first copy on. The state is in the Hub's database, in the schema `copies`
(`hub/copies/tables.ts`): the copy with its definition, lease, position and watermark, each source
of the copy, its runs, its proposals and its releases to Projetos. A row of `sync` is never in the
Hub's database, and the Hub's tables never hold a company row.

`builder/git/copy` has nothing to do with this: it is the Git bundle copied to R2
([0051](../decisions/0051-builder-machine-git-and-copy-in-r2.md)).

## What a copy reads

A copy's definition is a value of the kit's `CopyDefinition` (`kernel/copy.ts`): the source (a
read of the connector, or in version 1 a SQL query), the typed columns, the key, an optional
`changedSince` column and an optional `window` of days. `copyModeOf` (`hub/copies/mode.ts`) turns it
into one of three modes. With no `changedSince`, every pass reads the whole source and deletes what
did not come back. With it, a pass rereads the changed rows, within the window's days when there is
one. The definition is parsed again at each run.

## How a copy comes to exist

**Ligar** (`enable.ts`) is the one act that makes a copy, from one of two sources: a template (a
"model") of the connection's connector, or a proposal. It writes the copy's row first, then, with no
transaction open ([data D22](../guides/data.md)), makes the `sync` login and schema if the company has
none (`ensureSync`) and the copy's table. A proposal's release to its Projeto comes next, and the
clock last, which also asks for the first run. The same attempt key takes up the step a cut left.

A proposal is the Builder's `copy_propose` tool (`hub/copies/propose.ts`). The tool checks the
definition against the read, with a proof that counts and never returns a row, and writes one
proposal row. It never turns a copy on ([0053](../decisions/0053-builder-tools-run-without-asking.md)):
a person who may accepts it in a card, and that call is Ligar with the proposal.

## How a copy runs

The clock is Mastra's own `mastra.schedules`: one row per copy, whose target is the workflow
`conexus-copy-run` and whose cron comes from the interval, from every 15 minutes to every 24 hours
(`builder/copy-clock/clock.ts`). The workflow's one step calls the Hub's `runCopy`
(`builder/copy-clock/workflow.ts`). Renaming the workflow deletes every copy's schedule, and a copy
that is gone takes its schedule with it.

`runCopy` (`hub/copies/run.ts`) takes the copy's lease in one transaction: the `UPDATE` itself decides
that none is held or that it ran out ([data D25](../guides/data.md)). It then reads each source in
pages of 500 rows, up to 200 pages or 10 minutes, renewing the lease at each page. `writePage` writes
rows by key, with the pass number in `_pass`. When the last page of a source is in, `closePass`
deletes the rows the pass did not write, if the mode asks for it, and counts the table. A run that
lost its lease writes nothing more and ends `INTERRUPTED`. A Hub that restarts with a run open does
not drive it again (`autoRestartActiveRuns: false`); the next run ends it.

## Who reads a copy

A Projeto reads a copy only after a release: `grantCopy` (`hub/copies/grants.ts`) gives the
Projeto's run and read logins `SELECT` on the copy's table. The Builder and the Projeto's agents read
it with `app_data_read` as `sync.<name>` (`builder/app-data/tools.ts`). The Assistant does not read
a copy. Apagar a copy drops its table, and Desligar takes a connection's rows out of the table.
