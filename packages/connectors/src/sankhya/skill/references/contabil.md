# Contábil

No published route reads the accounting. It is in tables, read by SQL (`references/tabelas.md`) or, when the company copies them, in the lake:

- Accounting entries (`TCBLAN`), by accounting month (`REFERENCIA`); a month is redone as a whole when the company closes it again.
- Balances (`TCBSAL`) per account, cost center, project and month, and per destination company (`TCBSALEMP`).
- Where each entry came from (`TCBINT`): the note or the title.
- The chart of accounts (`TCBPLA`).
