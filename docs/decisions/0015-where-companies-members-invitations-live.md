# 0015. Where companies, members and invitations live

## Context

Who belongs to which company is the center of authority. The earlier decision, Conexus's own tables, rested on "decided before". On 2026-10-13 the founder asked why Conexus should keep what a library already manages, and the decision was reopened.

## Decision

Open. The requirements stay: [security S6, S7, S12 and S13](../guides/security.md), [0012] and [0016].

## Criterion

The step 4 study starts from Better Auth's native organization and admin plugins at the installed version: companies, members, invitations, roles, deactivating a person and ending sessions. The 17 login tests, LT1 to LT17, run against them and decide. Conexus code enters only where a test shows a guarantee missing.

## Result

Local run, 2026-10-15, by the step 4 study, against a gate written before it: better-auth 1.7.8 with
the organization and admin plugins and its Drizzle adapter on PostgreSQL 18, one machine, no browser.
The plugins hold companies, members, invitations, roles and the installation administrator's role.
LT11 passed: the Hub creates the invited person without a password and the library's link sets one;
acceptance requires the invited e-mail's session. LT12 passed: sign-up closed, no plugin path routed.
Missing natively, so Conexus code: a unique key on a member and on a pending invitation (two pending
rows from one race); one Hub transaction that the library joins through `runWithTransaction`, because
the plugin's accept and member deletion open their own and escaped `runWithAdapter`; and a lock on the
company's owners before a role change or a removal: alone, the plugin left no owner in 20 of 20 races,
and with the lock one owner in 20 of 20. Not run: a browser, Neon, real e-mail.

## Consequences

Changing later moves people and identifiers.

Step 4.2: a memberless company awaits its first owner.

## Reopens when

After the step 4 study closes it: a login test fails because of the chosen tables.

## State

Reopened, 2026-10-13. Founder: "5 A". Before, brought from the plan of 2026-10-09. The step 4 card
proposes the plugins' tables with the three pieces above, pending the founder's approval.
