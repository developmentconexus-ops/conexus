# The Sync: the company's copies

This page describes what is left of the copy engine. Copies are moving, table by table, to each
company's lake on AWS ([0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md)) as
Singer taps ([0071](../decisions/0071-connectors-kit-live-copies-singer.md)). Nothing creates, runs,
pauses or deletes a copy in the company's database any more: the engine left in the first group of
the lake's part 0, and what still reads a copy leaves with the lake's second group
([Data track](../steps/trilhas/dados.md)).

A copy is a table of a company system's rows, kept in the company's own database, so a Projeto reads
it without calling the system. This page explains the pieces that remain. The kit keeps
`CopyDefinition` (`packages/connectors/src/kernel/copy.ts`) as the shape of the stored row; the Hub's
side is `apps/server/src/hub/copies/`; the SQL is `apps/server/src/platform/copy-sql.ts`.

## Where the rows and the state live

The rows are in the company's Neon database, in the schema `sync`, owned by the login `conexus_sync`
(`SYNC_LOGIN`, `platform/copy-sql.ts`). The state is in the Hub's database, in the schema `copies`
(`hub/copies/tables.ts`): the copy with its definition, each source of the copy, its runs, its
proposals and its releases to Projetos. A row of `sync` is never in the Hub's database, and the Hub's
tables never hold a company row.

`builder/git/copy` has nothing to do with this: it is the Git bundle copied to R2
([0051](../decisions/0051-builder-machine-git-and-copy-in-r2.md)).

## What a copy reads

A copy's definition is a value of the kit's `CopyDefinition`: the source (a read of the connector, or
in version 1 a SQL query), the typed columns, the key, an optional `changedSince` column and an
optional `window` of days. `copyModeOf` (`hub/copies/mode.ts`) turns it into one of three modes,
shown on the Dados page and told to the Builder.

## Who reads a copy

A Projeto reads a copy only after a release: `grantCopy` (`hub/copies/grants.ts`) gives the
Projeto's run and read logins `SELECT` on the copy's table. The Builder and the Projeto's agents read
it with `app_data_read` as `sync.<name>` (`builder/app-data/tools.ts`). The Assistant does not read
a copy. A copy's runs are shown as the rows the last engine left; no run is made now.
