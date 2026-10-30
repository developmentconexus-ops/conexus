# Vendas

- `pedidos`: the seller's orders, up to 50 per page. Orders are kept for 12 months; filter by `status` and by `dateFrom`/`dateTo` (ISO 8601 with offset) and sort with `date_asc` or `date_desc`. A partial answer (`206`) is unreadable.
- `pedido`: one order by id, with its items, its `pack_id` and its shipping id.
- `pacote`: one pack (several orders of one buyer shipped together). Only orders with a `pack_id` have one.

The buyer is not in the answer.
