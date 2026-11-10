# Estoque

The lists start at page 0 and say with `temMais` if there is another.

- `estoque`: the stock balance by product, company and location (up to 50 rows per page). The API returns only products that have had stock movement: a product missing from the answer may simply never have moved. Reservation and shelf life are not here: see `tabelas`.
- `estoqueDoProduto`: the stock of one product by company, location and control (`codigoProduto` in the path). Read it before an order: an item's `codigoLocalEstoque` and `controle` come from one of its lines. No line means no stock was read for the product.
- `locaisEstoque`: the stock locations (code, description, parent, analytic, active). Use it to name the `codigoLocal` of a balance.
- `estoqueDosProdutos`: the stock of up to 50 products in one call (`codigos`, required), narrowed by `codigoEmpresa` and `codigoLocal`. Each line is a balance by product, company, place and control, with `estoque`, `reservado` and `disponivel` (the difference). `tipo` and `codigoParceiro` say whether the balance is the company's own or a third party's: read them before summing. It answers up to 200 lines in order of product, company and place, and `temMais` is true when there are more: ask for fewer products. Whether it holds the same lines as `estoqueDoProduto` is confirmed in this company's data, not assumed.
