# 0063. Copy models proved on the founder's Sankhya, counting only

## Context

Capacity 2's P1 (`docs/steps/capacidade-2-o-sync-da-empresa.md`) measures, before U1, the dialect,
`DTALTER`, the date literal, cell shapes and page size. The founder authorized the read-only call
("leitura no Sankhya só contando"; 2026-11-10 "1. Vale"): one session through the kit's read door.

## Decision

`changedSince` is `DTALTER` for all five templates; `itens_venda` takes the header's `C.DTALTER`,
because the item's own may be null. Window `DTNEG`, 30 days, for `vendas` and `itens_venda`. Pages
of 500 rows. The paged read writes a date as `TO_DATE('YYYY-MM-DD', 'YYYY-MM-DD')` (Oracle). The
DbExplorer answers a DATE as text `DDMMYYYY HH24:MI:SS` (invented: `02012026 03:04:05`), a number as
a JSON number (invented: `1234.5`), a NULL as `null`; the read writes `YYYY-MM-DD` for a date column,
`YYYY-MM-DDTHH:MM:SS` for a timestamp and a dotted number.

## Criterion

Card criterion 1, amended by the founder's standing rule: no company figure in the public
repository. Stop rules: a template table without `DTALTER` (stop for `vendas`, `itens_venda`); a
500-row page over 1 MiB (drop to 250).

## Result

- Dialect: Oracle (`SELECT COUNT(*) AS N FROM DUAL` answered).
- `DTALTER` exists on TGFCAB, TGFITE, TGFPAR, TGFVEN and TGFPRO; only TGFITE holds nulls. No
  template row has a null `DTALTER`.
- `DTALTER >= TO_DATE('2026-10-01', 'YYYY-MM-DD')` passed the read filter and the DbExplorer.
- Column types: the keys (NUNOTA, SEQUENCIA, CODPARC, CODVEND, CODPROD) are NUMBER with scale 0;
  `DTALTER` and `DTNEG` are DATE; VLRNOTA, QTDNEG, VLRUNIT, VLRTOT are FLOAT; the rest VARCHAR2 or
  NUMBER with scale 0.
- Every template's first page of 500 rows is under the 1 MiB stop rule and far under the executor's
  2 MiB ceiling ([0056]). No stop rule fired.
- The invented cells are the read's recording (T29).
- The measured numbers are kept outside the public repository.

## Consequences

U1 writes these columns and types. A large table's first pass spans several capped runs.

## Reopens when

A company's Sankhya runs on SQL Server, or a template table lacks `DTALTER`.

## State

Accepted 2026-11-10 ("1. Vale").

[0056]: 0056-connectors-kit-and-one-executor.md
