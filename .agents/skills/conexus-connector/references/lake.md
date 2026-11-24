# The lake path

**Planejado.** Nothing of the kit copies to the lake today: `apps/extraction/` does not exist, and
the kit has no table declaration. Part 0 of the card removed the old copy engine; part 1 builds the
path below. This page follows the card [A primeira cópia chega ao
lago](../../../../docs/steps/a-primeira-copia-chega-ao-lago.md), units U3 to U5, and changes when
they land. Until then, cite the card for every contract here, never this page.

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

## What a connector author does before part 1 lands

- Declare `list` on every read that pages, with `changed` when the provider filters by a change
  instant: the `OPERATION` source reads it.
- Keep `numbers: 'EXACT'` when the provider sends amounts with decimals.
- Measure the credential class, or leave it `EXCLUSIVE`. An exclusive connector, every OAuth login
  so far, is read live only, and copies nothing, until stage 5 of the roadmap designs how the task
  asks the Hub.
- Declare no table and add no copy code: U3 owns the shape.

## Known holes in the plan

The kit audit of 2026-11-24 found three the card does not settle yet:

- The task does not retry a passing 5xx. The singer-sdk retries 429 and 5xx (from the studies, not
  reread at the source); with `STATE` per page the next run resumes, so the cost is one lost run. The audit asks
  for a line in U4 on who retries and how many times.
- The `OPERATION` source declares its columns by hand, and HubSpot, a spreadsheet, a SharePoint list
  and TOTVS need them discovered (K4 in [gaps](gaps.md)).
- No exclusive credential copies before stage 5.
