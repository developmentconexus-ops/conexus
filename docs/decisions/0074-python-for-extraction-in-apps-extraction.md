# 0074. Python for the extraction, in `apps/extraction`

## Context

Singer and Meltano are Python, and so are their SDK and PyIceberg [0071]. The rest of the tree is
TypeScript [0002]. The founder asked for the industry's way of deploying, coding and placing that
code in our repository.

## Decision

- The extraction is one Python project in `apps/extraction/`, managed by `uv`, on Python 3.13: the
  Meltano project, the tap the kit's adapter produces and our target.
- It ships as the copy task's container image [0076].
- Its rules, tests and dependency checks enter with the method change before the first lake card:
  Python CI, `docs/reference/stack.md` rows, the documents check reading Python dependencies.

## Criterion

None written before; the proof image of the whole path stands as the check.

## Result

The proof image (Python 3.13, Meltano 4.4.1, singer-sdk 0.54.9, PyIceberg 0.12.0) ran the path into
`S3 Tables` in Fargate, 30 of 30 tables equal to the source; a local prototype ran the Sankhya tap
with 27 tests.

**Not proved.** A Python job in CI; the image built by the Release.

## Consequences

Amends [0002] and [0003]: one subject is Python. The TypeScript kit stays the connector's one
definition; Python never redeclares a system.

## Reopens when

CI cannot check the Python project as it checks TypeScript, or the copy contract leaves Singer
[0071].

## State

Accepted 2026-11-19. Founder: F8 "sim" (Python in the same repository, studying the industry's
way); B "okay" (`apps/extraction` with `uv`).

[0002]: 0002-typescript-node-24-run-directly.md
[0003]: 0003-repository-shape.md
[0071]: 0071-connectors-kit-live-copies-singer.md
[0076]: 0076-a-copy-runs-as-a-fargate-task-ending-by-a-queue.md
