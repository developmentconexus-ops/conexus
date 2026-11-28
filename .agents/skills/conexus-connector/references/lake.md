# The lake path

The copy to the lake is built: the kit declares the tables and `apps/extraction/` runs the copy.
This page was written as the plan of the step [A primeira cópia chega ao
lago](../../../../docs/approvals/a-primeira-copia-chega-ao-lago.md) and still reads as one; where it
and the code differ, the code wins. The step's card is in `main`'s history at commit `50aae548`.

## The decisions it rests on

- A copy is a Singer tap under Meltano, made from the kit by one adapter that names no connector
  ([0071](../../../../docs/decisions/0071-connectors-kit-live-copies-singer.md)).
- The extraction is one Python project in `apps/extraction/`; Python never redeclares a system
  ([0074](../../../../docs/decisions/0074-python-for-extraction-in-apps-extraction.md)).
- A shareable credential renews inside the task; an exclusive one renews only in the Hub, and the
  task asks it ([0077](../../../../docs/decisions/0077-how-a-credential-reaches-the-copy-task.md)).
- Each connector declares per table the key, the page, the mode and the discovery; the raw layer
  only appends ([0080](../../../../docs/decisions/0080-copy-declared-per-table-raw-appends.md)).

## U3, the kit declares the tables

A new file in the kit, `tables.ts`, gives `Connector` an optional `tables`:

- **A declaration per table**: the lake name after the connector prefix (Portuguese, snake_case,
  `notas` becomes `sankhya_notas`), a label, a description, a group (a subject), the key, `history`,
  and three unions:
  - `source`: `TABLE` (a source table read by the connector's query door, Sankhya's `TGFCAB`) or
    `OPERATION` (a paged read, HubSpot's `negocios`, read through the operation's `list`);
  - `mode`: `CHANGED` by a column that only grows, `WINDOW` by month with a re-read, or `FULL`;
  - `columns`: `DISCOVERED` from the source's dictionary, less an exclude list, or `DECLARED` with a
    path into the row.
- **One discovery**, `discoverTables`, read by both the connection window and `tap --discover`.
- **One page reader**, `readTablePage`, for both sources and every filter (`ALL`, `SINCE`, `MONTH`),
  with a page in rows and bytes (default 500 rows and 1 MiB; the Sankhya declares 5,000 rows).
- **One name rule**, `lakeNameOf` and `suggestedLakeName`: the prefix plus the name, at most 60.
- **Source failures** as kit codes (`COPY_SOURCE_NEEDS_REAUTH`, `COPY_SOURCE_REFUSED`,
  `COPY_SOURCE_UNREACHABLE`, `COPY_SOURCE_UNREADABLE`), never a body.
- The Sankhya gets its 42 tables in its folder's `copy-tables.ts`; the generated skill gains the table
  list; the conformance gains the table declaration; the old copy leftovers leave.

## U4, the adapter

A TypeScript program in `apps/extraction/tap/` that speaks Singer: `--about`, `--discover`, a
catalog, `RECORD`, `STATE` per page and `ACTIVATE_VERSION`. It imports only the kit's index:
`openSession`, `parseJson`, `discoverTables` and `readTablePage`. It names no connector and reads no
environment variable for the secret. The stream name is the lake name, and `table_name` is the
source (`TGFCAB`, or the operation id). The filter comes from the mode and the saved state. When the
source stops a table, it writes `TapFailure` (the kit's code and the table) and exits with code 1.

## U5, the task

The Meltano project, our Python target that only appends to Iceberg, and the image. The number
arrives as exact text and becomes `decimal(38, 9)`; a value that does not fit fails the run. The Hub
hands the task a `CopyTaskSpec` (the connector, the account, the opened credential, the tables) and
reads a `CopyTaskResult`.

## The treated table (step `T1`)

A table may declare `treated` (`kernel/tables-treated.ts`): the table's description and its columns,
each a source `column`, a new name `as` and a `cast`. The kit writes the one `SELECT`, from
`"current"."<lake name>"`, with no filter and no join. A treated column carries no description of its
own: it shows the copied column's. The treatment run builds the table in the `tratado` area after a
copy; a table with no `treated` shows nothing in Tratado. The step's card is in `main`'s history at
commit `9e1f7ca2`.

## What a connector author does for the lake

- Declare `list` on every read that pages, with `changed` when the provider filters by a change
  instant: the `OPERATION` source reads it.
- Keep `numbers: 'EXACT'` when the provider sends amounts with decimals.
- Measure the credential class, or leave it `EXCLUSIVE`. An exclusive connector, every OAuth login
  so far, is read live only, and copies nothing, until stage 5 of the roadmap designs how the task
  asks the Hub.
- Declare tables in the connector's `tables`, as the Sankhya's `copy-tables.ts` does. The adapter in
  `apps/extraction/` names no connector.

## Known holes

- The `OPERATION` source declares its columns by hand, and HubSpot, a spreadsheet, a SharePoint list
  and TOTVS need them discovered (K4 in [gaps](gaps.md)).
- No exclusive credential copies before stage 5.
