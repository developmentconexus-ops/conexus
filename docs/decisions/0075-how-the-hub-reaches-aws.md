# 0075. How the Hub reaches AWS

## Context

The Hub runs on the server in São Paulo, outside AWS [0007], and acts on each company's lake: it
creates stacks [0073], starts copies [0076] and runs the agent's queries [0079]. A credential the
Hub holds must reach only the company of the request.

## Decision

- The Hub takes its credential from the AWS SDK's default chain, never from code.
- In the lab account, a long key that can only assume the Hub's role. The address condition
  (`aws:SourceIp`, the server's) sits in that role's trust statement, not only in the user's
  policy.
- Every session lasts 15 minutes and carries the company as a session tag; a company's roles trust
  only sessions tagged with that company.
- In the official account the key becomes a certificate, through IAM Roles Anywhere [0072].

## Criterion

From the proof plans of 2026-11-19 and 20: the Hub reaches only the tagged company's roles, and
the key is refused away from the server.

## Result

- From the server, 24 of 24 calls accepted. From another address, 3 of 3 refused after the fix; with
  the condition only in the user's policy, 3 of 3 had been accepted.
- At 31 minutes both sessions, the Hub's and the reader's, were refused, Athena included.
- Another company's tag refused; the base key cannot assume a company's reader directly.
- 33 of 33 tests of the company tag.

**Not proved.** That a 15-minute session stops working away from the server: inferred it does not,
until it expires. The certificate, only in the official account.

## Consequences

Whoever holds the base key chooses the company: the tag protects against a Hub defect, not against
a stolen key.

## Reopens when

The official account opens, or the Hub moves off the server.

## State

Accepted 2026-11-20. Founder: F-B "A" (the SDK's default chain; in the lab, a key bound to the
server's address with 15-minute sessions; in the official account, Roles Anywhere).

[0007]: 0007-one-server-compose-tunnel.md
[0072]: 0072-the-lab-aws-account-is-provisional.md
[0073]: 0073-platform-by-cdk-one-stack-per-company.md
[0076]: 0076-a-copy-runs-as-a-fargate-task-ending-by-a-queue.md
[0079]: 0079-the-agent-reads-the-lake-neon-serves-apps.md
