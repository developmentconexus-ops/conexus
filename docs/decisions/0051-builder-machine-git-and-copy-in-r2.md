# 0051. The Builder writes in an E2B machine; the Git of each app is ours, copied to R2

## Context

The Builder writes and runs commands on a Mastra `Workspace` over E2B. The libraries leave open its
hosts, its filesystem and where a version is kept.

## Decision

- One machine per Projeto, woken by id with `reattach: 'required'`; a lost one is rebuilt.
- The network is a list of domains (`denyOut: [ALL_TRAFFIC]`, `allowOut`), starting with
  `registry.npmjs.org`; the proof adds a host only when `npm install` fails without it, and writes
  it here.
- The Git is ours: a bare repository on the server, `main` moved by `update-ref` against the base
  read, one `git bundle` per changed turn checked by `transfer.fsckObjects` into a candidate ref
  first. Each version's bundle goes to a private R2 bucket.
- Z2, on core 1.78.0: `WorkspaceFilesystem` requires 11 file operations and the identity; lifecycle,
  `walk` and `grep` are optional. The fork's `SandboxFilesystem` has 815 lines. Proposed: ours, about
  200 lines, writing through `writeFiles()`; past 300 lines, or if a 200 KB file fails, the fork's
  class is brought.
- `running` precedes `onStart` (`workspace-BojqafFG.js:3991-3998`): `beforeToolCall` starts the
  sandbox, then waits for the seed.
- The E2B key is the founder's free-account key, in a file (S31); the sweep kills only machines
  marked with this installation's origin.

## Criterion

**Question.** Does a `Workspace` on E2B behind the list do what the card needs?

**Fixed.** `@mastra/core` 1.78.0, `@mastra/e2b` 0.14.1, `e2b` 2.56.0, E2B's default template.

| # | Check | Passes when |
| --- | --- | --- |
| 1 | Live script: `net`, `resume`, `seed`, `tool-choice` | All `ok: true` |
| 2 | `npm ls @mastra/core` | One copy |
| 3 | A bundle deleted from R2 | Restored in under 15 minutes, same `main` |
| 4 | E2B's free-plan terms | The use is admitted |

## State

Proposed 2026-10-21. Founder: "Aprovo", "13 sim". Check 4 read: terms ban nothing here; paused machines kept
without limit; credits end, workspace blocks. Check 1: `seed`, `tool-choice` ok; `net`, `resume`, 3 open.
