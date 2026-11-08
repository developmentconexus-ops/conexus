# Estoque

The lists start at page 0 and say with `temMais` if there is another.

- `estoque`: the stock balance by product, company and location (up to 50 rows per page). The API returns only products that have had stock movement: a product missing from the answer may simply never have moved. Reservation and shelf life are not here: see `tabelas`.
- `estoqueDoProduto`: the stock of one product by company, location and control (`codigoProduto` in the path). Read it before an order: an item's `codigoLocalEstoque` and `controle` come from one of its lines. No line means no stock was read for the product.
- `locaisEstoque`: the stock locations (code, description, parent, analytic, active). Use it to name the `codigoLocal` of a balance.
