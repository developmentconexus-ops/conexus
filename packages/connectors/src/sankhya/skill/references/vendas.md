# Vendas

Sales orders and invoices. Each list needs a company code (`codigoEmpresa`, from `empresas`), keeps to one page, starts at page 0, and gives no rows (`linhas: []`) when the company has none.

- `pedidos`: the sales orders with customer, salesperson, total and items. `temMais` says if there is another page. Filters: `dataNegociacaoInicio` and `dataNegociacaoFinal` (`dd/mm/aaaa`), `codigoCliente`, `confirmada`, `pendente`. Filter by date to keep the answer small.
- `notasFiscais`: the sales invoices, without items (number, customer, operation type, total, NF-e status). Their numbers come as text (`codigoNota`, `valorNota`). Same date filters as `pedidos` (`dd/mm/aaaa`), plus `codigoNota` and `statusNFe`. The route does not say if there is another page.
- `notaFiscal`: one invoice whole, by `codigoNota`, as the one row of `linhas`: items (the product as `codProduto`), taxes, installments and the NF-e XML.
- `devolucoes`: the return invoices, without items, in the same shape as `notasFiscais`. The dates go as `dd-mm-aaaa` here.
- `notasCanceladas`: the cancelled invoices (number, customer, reason, date). `codigoEmpresa` is required. The cancellation dates go as `dd-mm-aaaa`.

The taxes of an order have no ready read: the order route ignores a filter by `codigoNota`, so read them through `consultar` (`TGFITE` and the tax tables, confirmed in the dictionary). An order and the invoice made from it are separate documents: count one or the other. Purchases are not here: see `tabelas`.
