# Tabelas: what the REST API does not have

The published routes cover what the API publishes. For the rest, read these tables by SQL or as an entity. Confirm each table and its columns in this company's dictionary (`TDDTAB`, `TDDCAM`) before using them, and read the options of every coded field (`TDDOPC`).

- Purchases: `TGFCAB` (header) and `TGFITE` (items), told from sales by the operation type. Join the operation type (`TGFTOP`) on `CODTIPOPER` and on `DHTIPOPER = DHALTER`, the version the document stored.
- Suppliers: `TGFPAR` with `FORNECEDOR = 'S'`. The REST API lists customers only; the partner search with `papel: fornecedor` finds suppliers.
- Costs: `TGFCUS` and `TGFCUSITE`.
- Detailed finance: `TGFFIN`.
- Bank movement: `TGFMBC`.
- Order, invoice and return links: `TGFVAR`.
- Sale price rules: `TGFTAB` and `TGFEXC`.
- Stock with reservation and shelf life: `TGFEST`.
