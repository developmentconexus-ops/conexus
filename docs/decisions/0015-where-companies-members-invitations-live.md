# 0015. Where companies, members and invitations live

## Context

Who belongs to which company is the center of authority. The earlier decision, Conexus's own tables, rested on "decided before". On 2026-10-13 the founder asked why Conexus should keep what a library already manages, and the decision was reopened.

## Decision

Open. The requirements stay: [security S6, S7, S12 and S13](../guides/security.md), [0012] and [0016].

## Criterion

The step 4 study starts from Better Auth's native organization and admin plugins at the installed version: companies, members, invitations, roles, deactivating a person and ending sessions. The 17 login tests, LT1 to LT17, run against them and decide. Conexus code enters only where a test shows a guarantee missing.

## Result

Not run.

## Consequences

Changing later moves people and identifiers.

## Reopens when

After the step 4 study closes it: a login test fails because of the chosen tables.

## State

Reopened, 2026-10-13. Founder: "5 A". Before, brought from the plan of 2026-10-09.
