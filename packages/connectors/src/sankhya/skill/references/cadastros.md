# Cadastros

Register data that other reads point to. Read `empresas` first: the sales, finance and logistics reads need a company code. Every list here starts at page 0 and says with `temMais` if there is another.

- `empresas`: the companies (code, trade name, legal name). Takes no filter.
- `clientes`: the customers (document, name, address, and the company's own `AD_` fields in `camposAdicionais`). `codigoCliente` comes as text, `tipo` as `F` or `J`, and `endereco.cidade` is an object with the city's name, IBGE code and state. `dataHoraAlteracao` (`dd/mm/aaaa hh:mm`) keeps what changed after it. The read sorts by code, so the pages are stable. Suppliers are not here: see `tabelas`.
- `vendedores`: the salespeople (name, manager, commissions, active). `tipo` may be a number in one row and text in another. `modifiedSince` (`dd/mm/aaaa hh:mm`).
- `tiposOperacao`: the operation types (TOP): code, name, movement type, active. `tipoMovimento` filters by movement. Which TOPs are a sale, a return or a purchase is this company's choice: read the movement type and ask, never assume from the name. On some companies Sankhya itself refuses the first page with a 400; then read the operation types through the read door, table `TGFTOP` (confirm its columns in the dictionary, and join on the version a document stored, `DHTIPOPER`).
- `naturezas`: the financial natures (code, name, parent, analytic).
- `centrosResultado`: the result centers (code, name, parent, analytic, active).
