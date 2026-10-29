# Produtos

- `produtos`: the product catalog (code, name, reference, group, brand, active, NCM). First page: 0. The list does not say when it ends: a short or empty page is the end. `dataAltercao` is spelled that way by the API.
- `gruposProduto`: the product groups (code, name, parent group, analytic, active). First page: 0; the list does not say when it ends. Use it to name the `codigoGrupoProduto` a product carries.

Prices are in `precos`, stock in `estoque`.
