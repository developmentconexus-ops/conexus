# 0073. The platform by CDK, one CloudFormation stack per company

## Context

Each company needs its own lake, made and removed by the Hub with no console. The founder asked for
examples and proof before choosing how the infrastructure is written [0070].

## Decision

- The shared platform is a CDK app in TypeScript, in `infra/aws/`, published by the Release through
  GitHub's OIDC, with no stored key.
- Each company is one CloudFormation stack, from a template the CDK writes, that the Hub creates and
  deletes through the SDK. It holds the table bucket, the company's IAM roles (reader, copy writer,
  publisher), its Athena workgroup and the two `DESCRIBE` grants. Grants per reader stay outside,
  reconciled by the Hub [0078].
- Four adjustments the proofs asked for: `OnFailure: DELETE` on create; a generation suffix on the
  bucket name, which stays taken ten minutes; a CloudFormation service role in `RoleARN`, so the
  Hub never holds `iam:CreateRole`; a permission boundary on the company's roles.
- After any failed stack, the Hub checks for and deletes what is left.

## Criterion

From the system test plan of 2026-11-19: creating and deleting a company is all or nothing, by one call each, and its time does not grow
with the number of companies.

## Result

- 36 s to create and 26 s to delete, the same from 1 to 100 companies.
- Two companies in 27.7 s; a failure on the last resource left nothing behind.
- With 8 creations in parallel, one orphan bucket was seen once.

**Not proved.** The service role in `RoleARN` and a real Release job with OIDC: read, not run.

## Consequences

Amends [0003]: `infra/aws/` joins the tree. A change to every company is one `UpdateStack` each.

## Reopens when

Drift the stack cannot see (it checks the roles, not Athena) needs an inventory of our own, or the
100-bucket wall moves the lake off `S3 Tables`.

## State

Accepted 2026-11-20. Founder: C "okay" (CDK for the platform, a stack per company, the four
adjustments).

[0003]: 0003-repository-shape.md
[0070]: 0070-copied-company-data-lives-in-a-lake-on-aws.md
[0078]: 0078-how-the-lake-knows-who-reads.md
