# Produtos

Both lists start at page 0 and say with `temMais` if there is another.

- `produtos`: the product catalog (code, name, reference, group, brand, active, NCM). The change date comes under the key `"dataAlteracao:"`, colon included, as the API spells it.
- `gruposProduto`: the product groups (code, name, parent group, analytic, active). Use it to name the `codigoGrupoProduto` a product carries.

Prices are in `precos`, stock in `estoque`.
