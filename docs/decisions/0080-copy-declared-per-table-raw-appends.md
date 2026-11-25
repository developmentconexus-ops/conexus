# 0080. A copy is declared per table; the raw layer appends, the current one follows the mode

## Context

The Sankhya's proofs put each of its adjustments (page size, month window, dictionary, change
columns) in the adapter or a shared constant: the kit has no place to say how
a table is copied [0071]. Singer and the Airbyte manifest declare it per table.

## Decision

- Each connector declares per table: the key (any columns and type, apart from the page cursor),
  pagination and page size, the copy mode (incremental by a column or filter, a date window with
  step and re-read, or a full pass), and discovery, by a hook or a declared list.
- The raw layer only appends each run; it is the history. Athena updates the current one by two
  `MERGE`, update and insert; a full or window pass then deletes unrewritten rows in its scope;
  a keyless table is replaced whole.
- Case, the Sankhya: 5,000-row pages, the gateway's measured ceiling; a month window for the two
  large fiscal tables without a change column; incremental where one exists; a full pass for the
  rest.

## Criterion

From the system test plan of 2026-11-19: after every load and planted failure, the current layer
equals the source.

## Result

449 of 449 tables in 15 companies with zero difference after the current step, which held under 8
planted failures (generated data). On the founder's Sankhya the month window beat reading by key.

**Not proved.** The window, the full pass, deletes and the keyless table; 450-column tables in the
step. How "history off by default" (founder, 2026-11-18) becomes the raw layer's retention is the
first copy card's.

## Consequences

Amends [0063]: its 500-row page was our choice, not the system's.

## Reopens when

A source's change cannot be declared in these modes.

## State

Accepted for the incremental mode, a technical call (delivery L6) on measured proof; proposed for
the others. Founder, 2026-11-20: "de mês em mês" (the fiscal window), A0-c "okay". Amended by
[0082](0082-the-lake-holds-tables-and-files.md) and the first copy card.

[0063]: 0063-copy-models-proof.md
[0071]: 0071-connectors-kit-live-copies-singer.md
