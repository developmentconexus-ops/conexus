---
name: conexus-mercado-livre
description: Reads a store's Mercado Livre through the Mercado Livre connector. The connection belongs to one seller account, so the skill teaches how its routes page, what each window and cap is, what a refusal means, and what an answer with decimals looks like. Use before reading Mercado Livre or writing code that does.
---

# Mercado Livre

The connection is one seller's account, authorized by the store itself. Every read is made as that seller: the seller id is the connection's account and is never asked for. A refusal is the answer, never a thing to get around.

## Reading

- Every read answers `{ linhas, temMais }`: the rows as Mercado Livre sent them (a field the kit does not know passes, and one object comes as a list of one), and whether another page follows (`temMais` is `null` when the route does not say). Parse in your code each field it uses, and never take a type from a name.
- A number comes as Mercado Livre wrote it when a double could not hold it: a price, a fee or any amount with decimals comes as text (`"199.9"`), and so does a whole number past 2^53. A whole number a double holds stays a number. Convert an amount before you sum or compare it.
- One page per call. A list ends when `offset + limit` reaches `total` (`paging`, or the same counts at the top of the answer), and `temMais` says so. Read the next page only when the question needs it.
- A scan (the listings and the questions) has no total: its answer gives the next page's cursor in `seguinte`, and the page with no rows is the end.
- Orders, listings, questions, claims and billing periods can become a copy the Conexus keeps in the company's database: for data an app reads again and again, propose the copy instead of paging live.
- Each list has its own page size cap and its own window; the part for the subject gives them.
- A refusal comes with what Mercado Livre answered. A permission the app lacks (`PA_UNAUTHORIZED_RESULT_FROM_POLICIES`) refuses only that group of reads; the others still work.
- An answer Mercado Livre could not fill whole (a partial `206`, on an order) is read, and carries `parcial: true`: some fields are missing, and Mercado Livre says the rest usually suffices. Say so when a missing field matters to the question.
- Reading messages never marks them as read.

## Where an id comes from

Most reads open one record by an id another read gave: an order from the order list, its shipment and pack from the order, a pack's messages from the pack, a claim and its return from the claim list, a billing period from the period list, and a listing's detail, description and quality from the listing search. Read the list first and take the id from a row; never guess one.
