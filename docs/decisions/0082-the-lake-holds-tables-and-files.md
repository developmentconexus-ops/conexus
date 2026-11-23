# 0082. The lake holds tables and files

## Context

The founder, 2026-11-23: "lakehouse nao e so dados"; attachments and Drive items belong in the
lake [0070], linked to their rows, as at Nekt and Databricks. Parsing and RAG come later.

## Decision

- A company's files live in one general-purpose `S3` bucket in its stack, each with its row in a
  lake table, as Nekt's and Databricks' volumes; `S3 Tables` holds only Iceberg.
- The bucket sits in the account's regional namespace, with the generation suffix, unversioned;
  an object's key is its connection, table and `sha256`.
- A table may declare `parent`, its source row, and `file`, the kit read returning a row's bytes.
- The record carries a reserved `_arquivo` field naming the file on the task's disk; our target
  writes the object before the row, per record, as Airbyte's `file_reference`.
- Long text stays text and binary stays binary, by type; a binary column above a ceiling becomes a
  file column.
- A file opens through its table: Lake Formation decides the table; the Hub reads the object with a
  reader session allowing only it and returns the bytes. No URL or credential leaves the Hub.
- `S3` powers on that bucket only: the writer puts and lists, the reader gets, the Hub lists,
  deletes and empties it before deleting the stack, CloudFormation creates and deletes it.

## Criterion

In the lake's step 3a: a file lands before its row, a reader opens only its table's files, and
deleting a company leaves no object.

## Result

None yet.

**Not proved.** The path; the one-object session; deleting a full bucket; the namespace in
`sa-east-1`; a 5 GB file.

## Consequences

Amends [0070], [0071], [0073], [0078] and [0080]. Built in step 3a, after step 3; step 2 closes no
door (its card, T.41).

## Reopens when

A proof fails, or a file must reach a reader directly.

## State

Accepted 2026-11-23. Founder: "F1. A F2. A" (step 3a; `S3` powers on each company's files bucket
only).

[0070]: 0070-copied-company-data-lives-in-a-lake-on-aws.md
[0071]: 0071-connectors-kit-live-copies-singer.md
[0073]: 0073-platform-by-cdk-one-stack-per-company.md
[0078]: 0078-how-the-lake-knows-who-reads.md
[0080]: 0080-copy-declared-per-table-raw-appends.md
