# Cadastros

The registers other reads point to. The companies come first: the sales, finance and logistics routes need a company code (`codigoEmpresa`). Every list here starts at `page` 0 and says with `temMais` whether another follows.

- Companies (`/v1/empresas`): code, trade name, legal name. No filter.
- Customers (`/v1/parceiros/clientes`): document, name, address, and the company's own `AD_` fields in `camposAdicionais`. `codigoCliente` comes as text, `tipo` as `F` or `J`, and `endereco.cidade` is an object with the city's name, IBGE code and state. `dataHoraAlteracao` (`dd/mm/aaaa hh:mm`) keeps what changed after it. The route sorts by code, so its pages are stable. It filters by nothing else: to find a partner by name, document or code, search the partners. Suppliers are not on this route (see `tabelas`).
- Salespeople (`/v1/vendedores`): name, manager, commissions, active. `tipo` may be a number in one row and text in another. `modifiedSince` (`dd/mm/aaaa hh:mm`).
- Operation types, TOP (`/v1/tipos-operacao`): code, name, movement type, active; `tipoMovimento` filters by movement. Which TOPs are a sale, a return or a purchase is this company's choice: read the movement type and ask, never assume from the name. On some companies Sankhya refuses the first page with a 400: the route fails a whole page when one TOP, even an inactive one, holds a `TIPMOV` outside Sankhya's own dictionary, and a `tipoMovimento` filter never returns such a TOP. Its pages have no stable order either, so rows skip and repeat. Then read the table `TGFTOP` by SQL (confirm its columns in the dictionary, and join on the version a document stored, `DHTIPOPER`), and never build an app on this route.
- Financial natures (`/v1/naturezas`): code, name, parent, analytic.
- Result centers (`/v1/centros-resultado`): code, name, parent, analytic, active.

The partner search finds customers and suppliers alike, by `nome` (2 to 60 characters, part of the name or the legal name), `documento` (the 11 digits of a CPF or the 14 of a CNPJ), `codigos` (up to 100), `deCodigo` and `ateCodigo`, `papel` (`cliente` or `fornecedor`) and `ativo`, all combined with AND, with `limite` (1 to 100; without it, one page) and `depoisDe` (the last `codigoParceiro` read). Its rows are `codigoParceiro`, `nome`, `razaoSocial`, `documento`, `tipoPessoa`, `ativo`, `cliente`, `fornecedor`; with no filter it walks every partner. Confirm in this company's data how a document is stored before relying on `documento`.

The salesperson search takes `nome` (the nickname), `codigos` and `ativo`, with the same `limite` and `depoisDe`; its rows are `codigoVendedor`, `apelido`, `ativo`.
