# Estoque

The lists start at `page` 0 and say with `temMais` whether another follows.

- Balances (`/v1/estoque/produtos`): by product, company and place, up to 50 rows a page. Only a product that has moved is listed: one missing from the answer may never have moved. Reservation and shelf life are not here (see `tabelas`).
- One product's stock (`/v1/estoque/produtos/{codigoProduto}`): by company, place and control. Read it before an order: an item's `codigoLocalEstoque` and `controle` come from one of its lines. No line means no stock was read for the product.
- Places (`/v1/estoque/locais`): code, description, parent, analytic, active. They name the `codigoLocal` of a balance.

The stock of many products is read from `TGFEST` in one call: up to 50 `codigos`, narrowed by `codigoEmpresa` and `codigoLocal`. Each line is a balance by product, company, place and control, with `estoque`, `reservado` and `disponivel` (the difference); `tipo` and `codigoParceiro` say whether the balance is the company's own or a third party's, so read them before summing. It answers up to 200 lines in order of product, company, place, control, kind and third party, and `temMais` is true when there are more: ask for fewer products. Whether it holds the same lines as one product's route is confirmed in this company's data, not assumed.
