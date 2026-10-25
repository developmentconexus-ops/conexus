# 0051. The Builder writes in an E2B machine; the Git of each app is ours, copied to R2

## Context

The Builder writes and runs commands on a Mastra `Workspace` over E2B. The libraries leave open its
hosts, its filesystem and where a version is kept.

## Decision

- Amended 2026-10-24 (founder: "é uma por conversa", "3aproco"): one machine per conversation,
  found by its name `conexus-<installation>-<conversation>`, no id stored, no idle sweep. Releasing
  a conversation kills its machines first.
- The network is a list of domains (`denyOut: [ALL_TRAFFIC]`, `allowOut`), starting with
  `registry.npmjs.org`; a host is added only when `npm install` fails without it, written here.
- The Git is ours: a bare repository on the server, `main` moved by `update-ref` against the base
  read, one `git bundle` per changed turn checked by `transfer.fsckObjects` into a candidate ref
  first. Each version's bundle goes to a private R2 bucket, never mounted (founder: "1 A").
- Z2, amended again 2026-10-24 (founder: "B", "2, A"): the files are Factory's `SandboxFilesystem`,
  brought from `@mastra/code-sdk` 1.15.0 uninstalled, held to the app folder.
- `beforeToolCall` waits for the machine's start, as `running` precedes `onStart` (live, two
  first-step tools saw the seed without it: `seed-nohook`, 2026-10-21).
- The E2B key is the founder's free-account key, in a file (S31); a kill reaches only machines
  marked with this installation's `HUB_INSTALLATION_ID`.

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

Proposed 2026-10-21. Founder: "Aprovo", "13 sim". Results: 1 ok; 2 one copy (1.78.0); 3 ok on the real
bucket (region automatic), three versions, one second; 4 terms ban nothing here.
