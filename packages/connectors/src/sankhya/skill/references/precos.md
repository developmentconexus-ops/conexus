# Preços

Both reads count their pages with `pagina` (not `page`), start at 1 and say with `temMais` if there is another. The page size is Sankhya's: one table sent 57 rows on a page, so never assume a fixed size.

- `precosDoProduto`: the prices one product has in each price table (`codigoProduto`). Each row carries the `codigoTabela` of its price.
- `precosDaTabela`: the prices of one price table (`codigoTabela`), for every product it prices.

These are the table prices. The sale price rules (`TGFTAB`, `TGFEXC`) are in `tabelas`.
