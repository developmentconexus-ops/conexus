# Financeiro

- `contasAReceber`: the receivable titles of one company (partner, nature, due date, value, payment). First page: 1; `pagination.hasMore` says if there is another. Filters: `codigoParceiro`, `statusFinanceiro` (1 open, 2 settled, 3 all), `dataVencimentoInicio` and `dataVencimentoFinal`, `dataNegociacaoInicio` and `dataNegociacaoFinal` (all `dd/mm/aaaa`).
- `contasAPagar`: the payable titles, same shape and filters.
- `tiposPagamento`: the payment types (code, name, subtype). First page: 1; the list does not say when it ends. `subTipoPagamento` filters by subtype.

Keep the date range narrow: a company's titles are many. The detailed finance (`TGFFIN`) and the bank movement are in `tabelas`.
