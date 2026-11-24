# Fiscal

No published route reads the fiscal books. They are tables, read by SQL (`references/tabelas.md`) or, when the company copies them, in the lake:

- Taxes of each note item (`TGFDIN`): base, rate and value per tax.
- The fiscal book of entries and exits (`TGFLIV`), with ICMS and IPI per note.
- Stock counts (`TGFCTE`), by count date.
- The SPED files Sankhya generated (`TGFEFD*`): one table per EFD Fiscal or EFD Contribuições register, by company and reference month (`DTREF`).

A register table holds what Sankhya generated for that month, not the source documents: read the notes for those.
