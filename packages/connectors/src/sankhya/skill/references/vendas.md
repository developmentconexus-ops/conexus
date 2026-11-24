# Vendas

Sales orders and invoices. Each list needs a company code (`codigoEmpresa`), keeps to one page, starts at `page` 0, and gives `linhas: []` when the company has none.

- Orders (`/v1/vendas/pedidos`): customer, salesperson, total and items; `temMais` says whether another page follows. Filters: `dataNegociacaoInicio` and `dataNegociacaoFinal` (`dd/mm/aaaa`), `codigoCliente`, `confirmada`, `pendente`. Filter by date to keep the answer small.
- Invoices (`/v1/vendas/nfe`): number, customer, operation type, total and NF-e status, without items. Their numbers come as text (`codigoNota`, `valorNota`). The same date filters (`dd/mm/aaaa`), plus `codigoNota` and `statusNFe`. The route does not say whether another page follows.
- One invoice whole (`/v1/vendas/nfe/{codigoNota}`), as the one row of `linhas`: items (the product as `codProduto`), taxes, installments and the NF-e XML.
- Returns (`/v1/vendas/nfe/devolucoes`): return invoices, without items, shaped as the invoices. Their dates go as `dd-mm-aaaa`.
- Cancelled invoices (`/v1/vendas/nfe/canceladas`): number, customer, reason, date. The cancellation dates go as `dd-mm-aaaa`.

An order's taxes have no route: the order route ignores a filter by `codigoNota`, so read them by SQL (`TGFITE` and the tax tables, confirmed in the dictionary). An order and the invoice made from it are separate documents: count one or the other. Purchases are not here (see `tabelas`).

An order is placed on `POST /v1/vendas/pedidos`, always "a confirmar", with the date and hour of the send on Brasília's clock.
