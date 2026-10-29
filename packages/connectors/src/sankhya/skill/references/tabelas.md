# Tabelas: what the REST API does not have

The ready operations cover what the API publishes. For the rest, use the read door (`consultar`, `carregar`) on these tables. Every line ends the same way: confirm the table and its columns in this company's dictionary before using them (`TDDTAB`, `TDDCAM`), and read the options of every coded field (`TDDOPC`).

- Purchases: `TGFCAB` (header) and `TGFITE` (items), told from sales by the operation type. Join the operation type (`TGFTOP`) on `CODTIPOPER` and on `DHTIPOPER = DHALTER`, the version the document stored.
- Suppliers: `TGFPAR` with `FORNECEDOR = 'S'`. The REST API lists customers only.
- Costs: `TGFCUS` and `TGFCUSITE`.
- Detailed finance: `TGFFIN`.
- Bank movement: `TGFMBC`.
- Order, invoice and return links: `TGFVAR`.
- Sale price rules: `TGFTAB` and `TGFEXC`.
- Stock with reservation and shelf life: `TGFEST`.

Confirm in this company's dictionary before relying on any of these.
