# Fiscal

No published route reads the fiscal books. They are tables, read by SQL (`references/tabelas.md`) or, when the company copies them, in the lake:

- Taxes of each note item (`TGFDIN`): base, rate and value per tax.
- The fiscal book of entries and exits (`TGFLIV`), with ICMS and IPI per note.
- Stock counts (`TGFCTE`), by count date, and the counts by serial number (`TGFCTS`).
- The ICMS rate from each origin state to each destination state (`TGFICM`), the IPI rates (`TGFIPI`) and the CFOP codes (`TGFCFO`).
- The adjustments of each tax assessment (`TGFAJA`), by company, reference month and state.
- The SPED files Sankhya generated (`TGFEFD*`): one table per EFD Fiscal or EFD Contribuições register, by company and reference month (`DTREF`).

A register table holds what Sankhya generated for that month, not the source documents: read the notes for those.
