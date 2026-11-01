# 0059. The Assistant's machine reaches the package registries

## Context

The Builder's machine reaches only `registry.npmjs.org` (0051). The Assistant's conversation machine
runs Python and Node code that reads and charts a company's rows, and needs `pip` as well as `npm`.
Basis: the machine study of step 24.1, `N-2` and `M-2`.

## Decision

The Assistant's machine reaches the package registries (`registry.npmjs.org`, `pypi.org`,
`files.pythonhosted.org`), for pip and npm; the web is the Hub's tools (founder, 2026-10-31: `N-2`
and `M-2` of the machine study). The list is the Assistant's alone: the Builder's stays as 0051
holds it.

## Criterion

| # | Check | Passes when |
| --- | --- | --- |
| 1 | `machine-e2b.test.ts`, the list the caller passes | The Builder's kit allows `registry.npmjs.org` alone; the Assistant's allows the three hosts |
| 2 | `machine.test.ts`, the machine's network | Every machine the Assistant starts is given the three hosts and no other |
| 3 | `machine-e2b.test.ts`, opt-in on E2B | `pip` and `npm` install, and a host outside the list does not answer |

## Result

Rows 1 and 2 met. **Not proved.** Row 3 is written and was not run: it uses the founder's E2B account.

## Consequences

The data the Assistant reads still reaches only the machine, and the machine reaches only these hosts;
a package can still run code there, which holds no secret.

## Reopens when

A package the Assistant needs is not on these hosts, or a registry changes its hosts.

## State

Accepted 2026-10-31. Founder: `N-2` and `M-2` of the machine study.
