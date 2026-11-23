# 0070. Copied company data lives in a lake on AWS

## Context

[0008] put a copy's rows in the company's Neon project. The founder asked for the data layer to be
validated as a system first: isolation, provisioning, quotas, failure, cost. The proofs ran on
2026-11-19 and 20 in a lab account [0072], on generated data.

## Decision

- A company's copied rows live in Iceberg tables in Amazon `S3 Tables`, read through Athena, with
  permission by Lake Formation.
- One table bucket per company, in one account. Fallback: an account per company, only if a shared
  quota fells a neighbour.
- Iceberg because Athena writes only Iceberg; no proof compared it with Delta.
- The planned comparison with PostgreSQL alone at scale and with BigQuery did not run. The choice
  rests on what AWS measured, not on a comparison.

## Criterion

From the system test plan of 2026-11-19: the service, not our code, refuses a cross-company read;
loads checked against their source show zero difference; the account's first wall is named.

## Result

- 290 of 290 attempts to read a neighbour (table, query, history, catalog, bucket, state) refused
  by AWS.
- 449 of 449 tables in 15 companies with zero difference.
- The first wall: 100 table buckets per account and region, raised only by support.
- At 55.3 million rows the structure held; two pieces did not, and the load changed shape [0080].

**Not proved.** The company's real source in volume; cost per company [0072].

## Consequences

The company's Neon project keeps the apps' data [0079]. Tables move to the lake stage by stage;
until then today's Sync copies them.

## Reopens when

Near 90 companies in one account; data in the client's own cloud; treatment that needs Spark.

## State

Accepted 2026-11-19: the founder chose AWS for the data side (firstmate's note, no quote kept).
The bucket per company: founder, 2026-11-20, "8 sim". Amends [0008]. Amended by [0082](0082-the-lake-holds-tables-and-files.md).

[0008]: 0008-neon-as-provider.md
[0072]: 0072-the-lab-aws-account-is-provisional.md
[0079]: 0079-the-agent-reads-the-lake-neon-serves-apps.md
[0080]: 0080-copy-declared-per-table-raw-appends.md
