# Cadastros

Register data that other reads point to. Read `empresas` first: the sales, finance and logistics reads need a company code.

- `empresas`: the companies (code, trade name, legal name). First page: 0. Takes no filter.
- `clientes`: the customers (document, name, city, and the company's own `AD_` fields in `camposAdicionais`). First page: 1. `dataHoraAlteracao` (`dd/mm/aaaa hh:mm`) keeps what changed after it. The read sorts by code, so the pages are stable. Suppliers are not here: see `tabelas`.
- `vendedores`: the salespeople (name, manager, commissions, active). First page: 0; the list does not say when it ends. `modifiedSince` (`dd/mm/aaaa hh:mm`).
- `tiposOperacao`: the operation types (TOP): code, name, movement type, active. First page: 1; the list does not say when it ends. `tipoMovimento` filters by movement. Which TOPs are a sale, a return or a purchase is this company's choice: read the movement type and ask, never assume from the name.
- `naturezas`: the financial natures (code, name, parent, analytic). First page: 1; the list does not say when it ends.
- `centrosResultado`: the result centers (code, name, parent, analytic, active). First page: 1; the list does not say when it ends.
