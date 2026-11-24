# Preços

Both routes count their pages with `pagina` (not `page`), start at 1 and say with `temMais` whether another follows. The page size is Sankhya's: one table sent 57 rows on a page, so never assume a fixed size.

- One product's prices (`/v1/precos/produto/{codigoProduto}`), in each price table. Each row carries the `codigoTabela` of its price.
- One price table (`/v1/precos/tabela/{codigoTabela}`), for every product it prices.

These are the table prices. The sale price rules (`TGFTAB`, `TGFEXC`) are in `tabelas`.
