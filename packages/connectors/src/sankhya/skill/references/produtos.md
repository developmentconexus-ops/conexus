# Produtos

Both lists start at page 0 and say with `temMais` if there is another.

- `produtos`: the product catalog (code, name, reference, group, brand, active, NCM). The change date comes under the key `"dataAlteracao:"`, colon included, as the API spells it.
- `gruposProduto`: the product groups (code, name, parent group, analytic, active). Use it to name the `codigoGrupoProduto` a product carries.

- `buscarProdutos`: finds products in one call. Filters, all optional and combined with AND: `nome` and `referencia` (2 to 60 characters, part of the text, case and accent ignored), `codigos` (up to 100), `deCodigo` and `ateCodigo`, `grupos` (up to 50 group codes), `ativo`, and the paging: `limite` (1 to 100, 20 when absent) and `depoisDe` (the last `codigoProduto` read). Rows come in code order as `codigoProduto`, `nome`, `referencia`, `codigoGrupo`, `grupo`, `unidade`, `marca`, `ativo`. To see ten products, pass their codes or their range in one call.

Prices are in `precos`, stock in `estoque`.
