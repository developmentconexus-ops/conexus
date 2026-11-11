# Perguntas

- `perguntas`: questions on the seller's listings with the answer when there is one, up to 50 per page, filtered by `status`. Unanswered questions stay visible for 7 months. The asker is not in the answer. By `offset` the search reads at most 1000 questions (Mercado Livre's offset cap); a scan reads them all: the first page sends `scan: true`, each answer gives the next page's cursor in `seguinte`, sent back as `scrollId` (it lives 5 minutes), and a page with no rows is the end.
- `tempoDeResposta`: the seller's average answer time, in minutes.
