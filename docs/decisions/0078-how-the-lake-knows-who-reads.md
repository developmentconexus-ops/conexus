# 0078. How the lake knows who reads

## Context

A person reads through a Conexus role and, in a Project, only what it received. The agent writes
free SQL, so the lake itself must refuse what the reader may not read.

## Decision

A rule in layers: the Hub decides, AWS enforces at each query.

- The Hub decides who reads and alone reads Athena; the copy task only writes through it [0076].
  No person gets AWS credentials.
- One reader IAM role per company, entered with two session tags: the company and who reads. Today
  who reads is a person's role, by its id, which the owner cannot change.
- Lake Formation grants by tag, per table; grants derive from the Hub's marks and are reconciled.
- A Project cuts further by a session policy.
- The platform's pieces are IAM roles of the company's stack [0073]; the company's are tags.
- No session outlives the decision: a removed mark holds from the next query.
- Fallback: one IAM role per reader, changing no mark or data.

## Criterion

From the proof plan of 2026-11-20: a new role reads with no new IAM role, and each reader is
refused the rest.

## Result

- 16 of 16 cases; a new role read 1.9 s after one grant. `DESCRIBE` goes on the company's database
  and catalog, once.
- A Project's session policy, with an IAM role per role: 20 of 20.

**Not proved.** Tags, Project and address lock in one session; column and row filters by tag; many
grants per account. A tag grant spans the account, so who may tag is the guard; Athena results
within a company are kept apart by the Hub.

## Consequences

A new role creates only grants on AWS.

## Reopens when

A proof above fails; the fallback covers what failed.

## State

Accepted 2026-11-21. Founder, 2026-11-20: F-C "okay" (fallback: an IAM role per role);
2026-11-21: "p1 a"; on API keys, "p2 foi apenas um exemplo que vi da Nekt de permissao, por agora
nem vamos utilizar isso". Amended by [0082](0082-the-lake-holds-tables-and-files.md).

[0073]: 0073-platform-by-cdk-one-stack-per-company.md
