# 0072. The lab AWS account is provisional

## Context

The lake's proofs ran in a free-plan AWS account under the new account experience, which denies
or limits pieces the official account will have. The founder asked what it lacks and that each
stand-in be recorded as provisional, in the shape of [0009].

## Decision

The lab account carries the lake until the stage "A conta oficial da AWS". It holds only generated
data and, with the founder's word, his own company's. Each stand-in, with the official form:

- Hub sign-in: a long key that only assumes the Hub's role, bound to the server's address [0075].
  Official: IAM Roles Anywhere, a certificate.
- Region: us-east-2, fixed by the plan. Official: the region the founder chooses then.
- Cost per company: the account denies cost allocation tags and Data Exports. Official: the
  company tag activated, read through CUR 2.0.
- Spend: credit guards, a monthly budget and anomaly detection; when the credits end the account
  closes with its data, and the plan ends 2027-05-19. Official: budgets with actions.
- Quotas: Athena 150 active queries (20 in São Paulo), 4 Fargate vCPU applied, 100 table buckets.
  Official: the increases requested when it opens.
- One account, no organization of our own, no GuardDuty, Security Hub or Identity Center. Official:
  advanced features, our organization, separate production and test, a security baseline.

## Criterion

Each line names its official form, and the stage closes only when every line has it.

## Result

Read from the account and AWS documentation on 2026-11-19, and the limits the proofs met: the 100
buckets, the vCPU quota and, in one probe, the 1,000 IAM roles.

## Consequences

Account and region are planned as company data, so the move changes configuration. A load test here
has 7.5 times the query headroom São Paulo starts with.

## Reopens when

The official account opens, the credits run low, or the plan nears 2027-05-19.

## State

Accepted 2026-11-20. Founder: F-A approved, this record and the roadmap stage (firstmate's note);
"6 okay" (generated data and his company's only).

[0009]: 0009-neon-free-plan-database-asleep.md
[0075]: 0075-how-the-hub-reaches-aws.md
