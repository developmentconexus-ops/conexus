# 0051. The Builder writes in an E2B machine; the Git of each app is ours, copied to R2

## Context

The Builder writes and runs commands on a Mastra `Workspace` over E2B; the libraries leave open its
hosts, filesystem and where a version is kept.

## Decision

- Amended 2026-10-24 (founder: "é uma por conversa", "3aproco"): one machine per conversation,
  found by its name `conexus-<installation>-<conversation>`, no id stored, no idle sweep. Releasing
  a conversation kills its machines first.
- The network is a list of domains (`denyOut: [ALL_TRAFFIC]`, `allowOut`), starting with
  `registry.npmjs.org`; a host is added only when `npm install` fails without it.
- Amended 2026-11-23 (A1; founder: "Aprovo emenda"): during the Hub's conference the machine also
  reaches the app's exact host until it ends, never `*.` of the apps' domain. E2B opens `8.8.8.8` for any listed
  domain and checks the name asked (SNI), not the address, so any server accepting an allowed name is
  reachable.
- The Git is ours: a bare repository on the server, `main` moved by `update-ref` against the base
  read, one `git bundle` per changed turn checked by `transfer.fsckObjects` into a candidate ref
  first. Each version's bundle goes to a private R2 bucket, never mounted (founder: "1 A").
- Z2 (amended 2026-10-24, founder: "B", "2, A"): the files are Factory's `SandboxFilesystem`, from
  `@mastra/code-sdk` 1.15.0 uninstalled, held to the app folder.
- `beforeToolCall` waits for the machine's start: `running` precedes `onStart` (live, two
  first-step tools saw the seed without it: `seed-nohook`).
- The E2B key is the founder's free-account key, in a file (S31); a kill reaches only machines
  marked with this installation's `HUB_INSTALLATION_ID`.

## Criterion

**Question.** Does a `Workspace` on E2B behind the list do what the card needs?

**Fixed.** `@mastra/core` 1.78.0, `@mastra/e2b` 0.14.1, `e2b` 2.56.0, E2B's default template.

1. `net`, `resume`, `seed`, `tool-choice` live: all `ok: true`.
2. `npm ls @mastra/core`: one copy.
3. A bundle deleted from R2: back in under 15 minutes, same `main`.
4. E2B's free-plan terms admit the use.

## State

Proposed 2026-10-21. Founder: "Aprovo", "13 sim". Results: all four pass; the restore took one second for three versions.
