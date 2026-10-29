# Vendas

Sales orders and invoices. Each read needs a company code (`codigoEmpresa`, from `empresas`) and keeps to one page.

- `pedidos`: the sales orders with customer, salesperson, total and items. First page: 1; `metadados.possuiMaisPaginas` says if there is another. Filters: `dataNegociacaoInicio` and `dataNegociacaoFinal` (`dd/mm/aaaa`), `codigoCliente`, `codigoNota`, `confirmada`, `pendente`. Filter by date to keep the answer small.
- `impostosDoPedido`: the taxes on the items of one order (CFOP, NCM, CST, ICMS, IPI and the rest), by `codigoEmpresa` and `codigoNota`. The API stores no tax read of its own: these are the taxes the order's items carry.
- `notasFiscais`: the sales invoices, without items (number, customer, operation type, total, NF-e status). First page: 1; `metadados` says if there is another. Same date filters as `pedidos` (`dd/mm/aaaa`), plus `statusNFe`.
- `notaFiscal`: one invoice whole, by `codigoNota`: items, taxes and installments.
- `devolucoes`: the return invoices, without items. First page: 1; `metadados`. The dates go as `dd-mm-aaaa` here.
- `notasCanceladas`: the cancelled invoices (number, customer, reason, date). First page: 1. `codigoEmpresa` is required. The cancellation dates go as `dd-mm-aaaa`.

An order and the invoice made from it are separate documents: count one or the other. Purchases are not here: see `tabelas`.
