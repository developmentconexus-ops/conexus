# 0079. The agent reads the lake; the company's Neon serves the apps

## Context

Two readers need the lake's rows [0070]: the agents, through the access contract, and the published
apps, which read the company's Neon project by SQL [0045]. The founder asked whether the
operational side should move too.

## Decision

- The agents read copied tables in the lake through Athena, under [0078]. The contract stays; the query's dialect comes from the catalog, not the tools' text.
- The company's Neon project keeps serving the apps. It receives from the lake only the tables an
  app declares, published by swapping a whole table in one transaction.
- The Hub stays on the server in São Paulo and its database on Neon ([0007], [0008]).

## Criterion

From the proof plans of 2026-11-19 and 20: the contract works on Athena; questions from São Paulo fit
the agent's 5 s; an app never sees half a table.

## Result

- The contract's shape served Athena; a refused table read as not found; nine queries in
  PostgreSQL's dialect failed.
- From the server, 8 of 10 test questions took a median 2.1 to 3.8 s, the plan read in parallel;
  São Paulo adds 0.3 to 0.56 s.
- Two, seeking an order number in free text, never finish in 5 s anywhere; their fix, a treated
  table, waits for treatment.
- 0 of 50 reads during a publication saw a half table.

**Not proved.** A product model writing Athena's dialect; publishing only the change.

## Consequences

The same table weighs 6.6 to 12 times more in the company's Neon than in the lake, so only what an
app declares goes there.

## Reopens when

Publication grows past about 10 GB per company a month at 15 companies, companies near the 100 that Neon's
Launch plan holds, or a client wants one cloud only.

## State

Accepted 2026-11-20. Founder, 2026-11-19: F3 "okay" (the agent reads the lake); 2026-11-20: "3
sim" (Neon per company and the Hub on the server stay).

[0007]: 0007-one-server-compose-tunnel.md
[0008]: 0008-neon-as-provider.md
[0045]: 0045-app-reads-by-query-writes-by-one-batch.md
[0070]: 0070-copied-company-data-lives-in-a-lake-on-aws.md
[0078]: 0078-how-the-lake-knows-who-reads.md
