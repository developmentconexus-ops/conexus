---
name: conexus-mercado-livre
description: Reads a store's Mercado Livre through the Mercado Livre connector. The connection belongs to one seller account, so the skill teaches the ready operations by subject, their paging and windows, what a refusal means, and that nothing here writes. Use before reading Mercado Livre or writing code that does.
---

# Mercado Livre

The connection is one seller's account, authorized by the store itself. Every read is made as that seller: the seller id is the connection's account and is never asked for.

The connection is read only. There is no operation that writes, and a refusal is the answer, never a thing to get around. If the person asks to change a listing, answer a question, reply to a buyer or act on a claim, say that this connection only reads.

## Rules for every read

- One page per call. The lists say their total and their offset (`paging`), and a list ends when `offset + limit` reaches `total`. Read the next page only when the person's question needs it.
- Each list has its own page size cap and its own window; the part for the subject gives them.
- A refusal comes with what Mercado Livre answered. A permission the app lacks (`PA_UNAUTHORIZED_RESULT_FROM_POLICIES`) refuses only that group of reads; the others still work.
- An answer cut by Mercado Livre (a partial `206`) is unreadable, never a shorter list. Say so; do not use it.
- Never ask for, show or guess a buyer's name, e-mail, phone, address, CPF or CNPJ. The operations do not carry them.
- Reading messages never marks them as read.

## The ready operations, by subject

Each subject has a part you read on demand (`skill_read`, `references/<subject>.md`) with its operations, the limits and what the documentation warns.

- `conta` (Conta): `conta`. The seller account behind the connection.
- `anuncios` (Anúncios): `anuncios`, `anunciosDetalhe`, `descricao`, `estoque`, `qualidade`. Listings, their detail, description, stock and quality.
- `vendas` (Vendas): `pedidos`, `pedido`, `pacote`. Orders and packs.
- `envios` (Envios): `envio`, `prazoDoEnvio`, `estoqueFull`. Shipments, their dispatch deadline and the Full stock.
- `perguntas` (Perguntas): `perguntas`, `tempoDeResposta`. Questions on the listings and the seller's answer time.
- `mensagens` (Mensagens): `mensagensNaoLidas`, `mensagensDoPacote`. After-sale messages.
- `reclamacoes` (Reclamações): `reclamacoes`, `reclamacao`, `devolucao`. Claims and returns.
- `promocoes` (Promoções): `promocoes`. Campaigns the seller can join.
- `metricas` (Métricas): `visitas`. Visits to the listings.
- `faturamento` (Faturamento): `periodosDeFaturamento`, `cobrancasDoPeriodo`, `notaFiscalDoPedido`. What Mercado Livre bills the seller, and the invoice of an order.
- `mercado` (Mercado): `tendencias`, `maisVendidos`, `tarifaDeVenda`. Searches in demand, best sellers and the sale fee.

Some operations read an id another gave: `pedido` takes one from `pedidos`, `envio` from `pedido`, `pacote` from `pedido`, `mensagensDoPacote` from `pacote`, `reclamacao` and `devolucao` from `reclamacoes`, `cobrancasDoPeriodo` from `periodosDeFaturamento`, and `anunciosDetalhe`, `descricao`, `qualidade` from `anuncios`.
