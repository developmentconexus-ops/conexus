# 0047. One app call's limits, counted and timed by the dispatcher

## Context

Step 9 left an app call's numbers in three files, none proved [0045].

## Decision

`APP_CALL_LIMITS` in `app-contract` owns a call's numbers: CPU 50 ms, 50 `db` calls, a 10 s
deadline, and on the run login `statement_timeout` 5 s and `transaction_timeout` 6 s. Native
`limits.subRequests` bounds the `db` calls; the dispatcher races the app's answer against the
deadline. No batch is counted: each is one transaction, as in PostgREST, Supabase, D1 and Neon;
amends [0045]. Basis: founder's P1 A, P3 A, then C after this proof, 2026-10-18.

## Criterion

**Question.** Do the database and the platform refuse what the numbers say, and where does a call's
count live?

**Fixed.** `wrangler` 4.151.1, `@neondatabase/serverless` 1.2.0, `@neon/sdk` 7.3.0, Neon free,
`aws-sa-east-1`, PostgreSQL 18; `cx-prova-` names.

1. `INSERT` in `transaction([q], {readOnly: true})` over HTTP: 25006.
2. `SET TRANSACTION READ WRITE; INSERT` in one text: refused.
3. Calls to `db` against `limits.subRequests` and the 32 invocations: where the app is cut.
4. An `RpcTarget` made per call, in `props`: a second batch sees the first's count.
5. CPU past 50 ms: what the dispatcher catches.
6. The run login's two timeouts over HTTP: `pg_sleep(6)` and a 7 s batch cut, with codes.
7. A Worker that throws at start, new name, namespace API: 10021.
8. First query after suspending the compute, three times: under 10 s.

If 1 or 2 fails, or 4 finds no place, P1 returns to the founder; if 5 does not cut, 6 does not hold
over HTTP, or 8 reaches 10 s, P3 returns. **Not covered.** Load, the published Hub.

## Result

2026-10-18, 23:01–23:07Z. 1: 25006. 2: 42601. 3: the stub's calls count; at 10, call 11 throws
"Too many subrequests"; unlimited, 40 pass; an `RpcTarget`'s calls do not count. 4: `DataCloneError`;
the count survives in an `RpcTarget` from `open()` or as an RPC argument. 5: "Worker exceeded CPU
time limit.", 2.2 s. 6: 57014, 5.0 s; 25P04, 6.1 s. 7: 10021. 8: 654, 609, 612 ms. All deleted.

## State

Accepted 2026-10-18. Founder: C.
