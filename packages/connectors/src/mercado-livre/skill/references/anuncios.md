# Anúncios

- `anuncios`: the ids of the seller's listings, filtered by `status` or `sku`. Up to 100 per page (`offset`, `limit`). `offset` reads at most 1000 listings (Mercado Livre's offset cap); past 1000 the search is a scan: the first page sends `scan: true` (never with `offset`), the answer's `seguinte` is the `scrollId` of the next page, which is valid for 5 minutes, and the page with no rows is the end.
- `anunciosDetalhe`: up to 20 listings per call by id (title, price, stock, sold, status, category, listing type). Each item has its own `code`: a 404 there is that id's, not the call's.
- `descricao`: the plain-text description of one listing.
- `estoque`: the stock of one user product by warehouse. Limit of 100 calls per minute.
- `qualidade`: the quality score (0 to 100) of one listing.

Read `anuncios` first; the other four take an id it gives.
