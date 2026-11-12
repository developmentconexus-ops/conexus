# Perguntas

- `perguntas`: questions on the seller's listings with the answer when there is one, up to 50 per page, filtered by `status`. Unanswered questions stay visible for 7 months. The asker is not in the answer. `offset` reads at most 1000 questions (Mercado Livre's offset cap); past 1000 the search is a scan: the first page sends `scan: true` (never with `offset`), the answer's `seguinte` is the `scrollId` of the next page, which is valid for 5 minutes, and the page with no rows is the end.
- `tempoDeResposta`: the seller's average answer time, in minutes.
