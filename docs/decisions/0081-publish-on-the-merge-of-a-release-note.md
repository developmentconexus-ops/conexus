# 0081. Publish on the merge of a release note

## Context

Under [0035] a person created each Release on GitHub's page after the merge: a second door whose
name nothing checked before it ran.

## Decision

- Publishing is the merge of a pull request that changes only `releases/note.md`: its first line
  is `# v<n>.<n>.<n>`, a version with no tag yet, and the text under it is the note.
  `scripts/release-note.ts` owns the note's format; CI runs it on the pull request, Publish's `version`
  job on the push.
- Publish runs on a push to `main` that changes the note, never on a Release. Its `release` job,
  with no checkout, creates the tag and the Release on the merge commit with the run's own token;
  what that token creates starts no workflow, so the rest follows by `needs` in the same run.
- The runner's hook accepts a push to `main` and a manual run of `main` whose commit is on `main`,
  and refuses a Release, a tag and every other event.
- The `image` job no longer checks that its commit is on `main`: only a push to `main` starts
  Publish, and the hook checks the commit. This amends that sentence of [0044].

Basis: `actions/runner` `release.yml`, `release-please` and `changesets/action`, which publish in
the run of the push to `main`, and the founder.

## Criterion

The run's own token creates a `v*` tag under the tag ruleset, and a note's merge puts its version
live with no Release made by hand.

## Result

Two runs got 422 while the ruleset restricted creation; once the founder unticked it, run
45018371410 created `refs/tags/vprova-regra` with 201. The first note's run is the use script's.

## Consequences

The tag ruleset restricts only update and deletion. Two note pull requests change the same line, so
they never merge together.

## Reopens when

A note's merge fails to publish, or tag creation must be restricted again.

## State

Proposed 2026-11-22 with the step "Publicar pelo merge da nota". Founder, 2026-11-22:
`A1 B1 C1 D1`, and `E1` for the new L17.

[0035]: 0035-publish-through-a-runner-on-the-server.md
[0044]: 0044-release-image-built-on-a-github-hosted-machine.md
