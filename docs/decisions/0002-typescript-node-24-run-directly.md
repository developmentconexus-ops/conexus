# 0002. TypeScript on Node 24, run directly; React and Vite for the screens

## Context

Every chosen piece speaks TypeScript, and the founder reads one language.

## Decision

The server and the Workers are TypeScript. Node 24 runs the `.ts` files directly, with no build step for the server; the web side is React built by Vite. Type checking is a separate required CI job. Basis: TypeScript, React and Vite: implemented so, accepted because one language serves every piece. Running `.ts` directly: the founder's answer, after explanation.

## Criterion

None written before. Brought from earlier work.

## Result

Not run on the real code. Step 1 shows the server running `.ts` and Vite importing a package that points at `.ts`; step 2 shows Wrangler doing the same.

## Consequences

Syntax Node cannot strip (enums, parameter properties) is not used. Imports end in `.ts`.

## Reopens when

Node's type stripping fails on the real code, or a library requires a build.

## State

Brought. Founder, 2026-10-13: "6. A".
