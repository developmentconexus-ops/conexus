# 0048. A company's Neon project named by its nickname and id

## Context

A company's Neon project is named `cx-<companyId>` (0040), which nobody recognizes in the console.
The name is also the Hub's only key on Neon's side: `create` takes no idempotency key, so a cut
reply is recovered by `find`.

## Decision

2A: the name is `<nickname>-<companyId>`; `find` lists with `search` set to the id and keeps the
names ending exactly in `-<companyId>`, so `cx-<companyId>` still matches; the Hub's start renames
once a project it recorded under another name. Amends 0040's criterion 2 ("One exact name").
Basis: purpose.

## Criterion

**Question.** Does Neon keep the name, find it by the id, and rename without changing the project?

**Fixed.** `@neon/sdk` 7.3.0, the companies' organization, projects named `cx-prova-`.

| # | Check | Passes when |
| --- | --- | --- |
| 1 | Create `cx-prova-<21 characters>-<32-character id>`, 63 characters | The name comes back exact |
| 2 | `list` with `search` set to the id, and to a middle piece of the name | It finds the project |
| 3 | `update` renames | Id, host and owner connection string unchanged; an open connection answers |
| 4 | Delete every `cx-prova-` project | None left |

If 2 fails, `find` lists the organization without `search` (0040 T3A).

**Not covered.** A hundred projects.

## Result

Run 2026-10-18: Node 24.20.0, PostgreSQL 18.6. 1: exact; create 4.9 s. 2: the id found the
project and a second, `cx-prova-outro-<id>y`, which only the exact ending left out; a middle piece
found the project alone. 3: all unchanged; the open connection read its row; `find` found the new
name. 4: none left. Created and deleted: `rough-band-56045468`, `sweet-moon-83294486`.

## Consequences

The key is the end of the name: a changed nickname, or the old `cx-` name, leaves it as it was.

## Reopens when

Neon offers a project label `list` can filter on, or a nickname may pass 30 characters.

## State

Accepted 2026-10-18, after its proof. Founder: "2. A".
