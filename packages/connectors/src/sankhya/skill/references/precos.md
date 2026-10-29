# Preços

Both reads count their pages with `pagina` (not `page`), start at 1, return up to 50 rows and say with `temMaisRegistros` if there is another.

- `precosDoProduto`: the prices one product has in each price table (`codigoProduto`). The answer carries the `codigoTabela` of each price.
- `precosDaTabela`: the prices of one price table (`codigoTabela`), for every product it prices.

These are the table prices. The sale price rules (`TGFTAB`, `TGFEXC`) are in `tabelas`.
