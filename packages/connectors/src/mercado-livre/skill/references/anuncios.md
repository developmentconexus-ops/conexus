# Anúncios

- `anuncios`: the ids of the seller's listings, filtered by `status` or `sku`. Up to 100 per page (`offset`, `limit`). Beyond the first 1000, `offset` stops working: ask `searchType: "scan"` and pass the `scrollId` each answer returns until it comes back empty.
- `anunciosDetalhe`: up to 20 listings per call by id (title, price, stock, sold, status, category, listing type). Each item has its own `code`: a 404 there is that id's, not the call's.
- `descricao`: the plain-text description of one listing.
- `estoque`: the stock of one user product by warehouse. Limit of 100 calls per minute.
- `qualidade`: the quality score (0 to 100) of one listing.

Read `anuncios` first; the other four take an id it gives.
