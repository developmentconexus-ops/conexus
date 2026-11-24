# Produtos

Both lists start at `page` 0 and say with `temMais` whether another follows.

- The catalog (`/v1/produtos`): code, name, reference, group, brand, active, NCM. The change date comes under the key `"dataAlteracao:"`, colon included, as the API spells it. It filters by nothing but the page.
- The product groups (`/v1/grupos-produto`): code, name, parent group, analytic, active. They name the `codigoGrupoProduto` a product carries.

The product search finds products by `nome` and `referencia` (2 to 60 characters, part of the text), `codigos` (up to 100), `deCodigo` and `ateCodigo`, `grupos` (up to 50 group codes) and `ativo`, all combined with AND, with `limite` (1 to 100; without it, one page) and `depoisDe` (the last `codigoProduto` read). Its rows are `codigoProduto`, `nome`, `referencia`, `codigoGrupo`, `grupo`, `unidade`, `marca`, `ativo`. To see ten products, pass their codes or their range in one call.

Prices are in `precos`, stock in `estoque`.
