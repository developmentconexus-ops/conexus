# Estoque

- `estoque`: the stock balance by product, company and location (up to 50 rows per page). First page: 1; the list does not say when it ends. The API returns only products that have had stock movement: a product missing from the answer may simply never have moved. Reservation and shelf life are not here: see `tabelas`.
- `locaisEstoque`: the stock locations (code, description, parent, analytic, active). First page: 0; the list does not say when it ends. Use it to name the `codigoLocal` of a balance.
