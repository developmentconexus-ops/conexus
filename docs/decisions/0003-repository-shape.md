# 0003. One tree, seven packages, walls checked by a machine

## Context

The old code had folder rules written in prose and broken in practice. The founder asked for the folder structure, the imports and the need for packages to be studied against references.

## Decision

One repository with seven `package.json`: `apps/server`, `apps/web`, `apps/edge`, `packages/hub-api`, `packages/app-contract`, `packages/app` and `packages/connectors` (the last two came with the generated apps and the connector kit). The Hub, the Builder and `platform` are folders. dependency-cruiser enforces the import law in CI, including the walls between subjects inside the Hub and the Builder. Basis: Purpose: a package only where something forces it (two consumers, or a versioned contract); the three app packages have a weak reason, stated: each runs in one place with its own dependencies.

## Criterion

None written before. Brought from earlier work.

## Result

Seven rules refused eight wrong imports among toy files in a local trial. Not run on real code; step 1 runs them.

## Consequences

No published package, no package per subject, no import alias.

## Reopens when

The checker cannot express a rule the guides need, or a subject needs to be deployed alone.

## State

Brought. Founder, 2026-10-13: "5. B", "6. A", "7. A". Amended by
[0073](0073-platform-by-cdk-one-stack-per-company.md) and
[0074](0074-python-for-extraction-in-apps-extraction.md): `infra/aws/` and the Python project
`apps/extraction/` join the tree.
