# Financeiro

- Receivable titles (`/v1/financeiros/receitas`) of one company: partner, nature, due date, value, payment. The first page is 1, unlike most lists; `temMais` says whether another follows. Filters: `codigoParceiro`, `statusFinanceiro` (1 open, 2 settled, 3 all), `dataVencimentoInicio` and `dataVencimentoFinal`, `dataNegociacaoInicio` and `dataNegociacaoFinal` (all `dd/mm/aaaa`).
- Payable titles (`/v1/financeiros/despesas`): the same shape, filters and first page.
- Payment types (`/v1/financeiros/tipos-pagamento`): code, name, subtype. The first page is 0; `subTipoPagamento` filters by subtype.

Keep the date range narrow: a company's titles are many. The detailed finance (`TGFFIN`) and the bank movement are in `tabelas`.
