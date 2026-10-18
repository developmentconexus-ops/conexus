# 0043. App logins derived from one key

## Context

Step 9 sends app versions [0018] that write to the company's project [0021] through the
dispatcher [0020]. Under [0022] each login is a dispatcher secret.

## Decision

A login's password is `HMAC-SHA-256(key, login)` in base64url; the key is the dispatcher's secret
`APP_LOGIN_KEY` and a server file. The Hub makes logins and schemas by SQL as the project's owner;
D10 and D11 bind the Hub's database [0038]. The app gets `db`, a stub of the dispatcher's `Db`.
Each version is a Worker `v-<id>` uploaded by the API. Basis: founder's answer 4A.

## Criterion

**Question.** Do derived logins, the stub and the upload serve step 9, apart by company and app?

**Fixed.** `wrangler` 4.151.1, `@neondatabase/serverless` 1.2.0, `@neon/sdk` 7.3.0, `drizzle-orm`
1.0.0-rc.4, Neon free, `aws-sa-east-1`, PostgreSQL 18; `cx-prova-` names.

1. Login by SQL, HTTP: not in `neon_superuser`.
2. `CREATE ROLE` cut, repeated: found; derived password enters.
3. App 1 on app 2's schema; A on B: refused.
4. `--dry-run --outdir` files by API, twice: 200; times give `CLOUDFLARE_DEADLINE_MS`.
5. Admin token: creates, deletes.
6. `ctx.exports.Db` as `props.db`: queries.
7. Password: in no answer, log, `props`.
8. Size, file count: give the send's ceiling.
9. `secret put` from stdin: same derived password.
10. Drizzle `bytea`: bytes equal.
11. Migration, one bad statement, ledger, `transaction()`: nothing applied.
12. Static file; missing Worker: no binding; stable error.

If 3 or 11 fails, step 9 returns to the founder. **Not covered.** Load, key rotation.

## Result

2026-10-18, 17:44–17:49Z. 1: in none. 2, 6, 9: entered. 3: 42501 on schema, write, `SET ROLE`;
B refused the password. 4: 6.1 s, then 2.9 s. 5: yes; a deleted Worker's GET answers `script:
null`. 7: in none. 8: 1,000 files, 10 MB: 14.9 s, then 3.4 s. 10: equal. 11: 42P01, no table, no
row. 12: served before the Worker; missing: "Worker not found.", no code. Deleted: both `cx-prova-`
projects, namespace, dispatcher, three apps.

## Consequences

`CLOUDFLARE_DEADLINE_MS` 60,000. With app logins, the SDK needs the owner's role name. A missing
Worker is `EDGE_APP_FAILED`.

## State

Accepted 2026-10-18. Founder: 4A.
