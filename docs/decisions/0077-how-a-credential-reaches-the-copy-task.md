# 0077. How a credential reaches the copy task

## Context

The copy task [0076] uses the company's system for hours; the Hub keeps the sealed credential.
Earlier designs let only the Hub renew any credential; the reference copy platforms ask what a
renewal kills.

## Decision

- The Hub writes the run's credential to an encrypted parameter, one per run, read only by the
  company's write role and deleted at every close. The seal stays the one source.
- Who renews depends on what a renewal kills, a class the kit declares per connector:
  - shareable, it kills nothing: the task gets the credential and renews by itself;
  - exclusive, it kills the previous token or refresh: only the Hub renews, and the task asks it.
- A credential is exclusive until a measurement proves it shareable.

## Criterion

From the root-cause study of 2026-11-20: a shareable credential renews inside the task with no Hub;
no secret appears in the task's description or log.

## Result

Case, the Sankhya, shareable:

- its token ends at 300 s even in use, and two sessions of one user coexist (founder's Sankhya);
- the kit's adapter renewed 4 times inside one copy of the Sankhya double;
- the encrypted parameter does not show in the task's description; an environment variable does.

**Not proved.** The exclusive class, with the second connector class: whether a Mercado Livre
renewal kills the previous token, and how the task asks the Hub. Meltano also hands each field to
the tap as an environment variable; whether that fits security S31 is the method change's.

## Consequences

Each connector's class is data in the kit, checked by a measurement, never assumed in code.

## Reopens when

A credential measured shareable kills a session after all, or the parameter store's write quota
blocks a start.

## State

Accepted for the shareable class, measured on the Sankhya; proposed for the exclusive class.
Founder, 2026-11-20: "se realmente for o padrão das referências, vamos fazer sim". The exclusive
class's channel is his decision, at the second class's study.

[0076]: 0076-a-copy-runs-as-a-fargate-task-ending-by-a-queue.md
