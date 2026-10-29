---
name: conexus-sankhya
description: Reads a company's Sankhya through the Sankhya connector. Every company configures its own Sankhya, so the skill teaches the ready operations, the two read doors, and how to find what each code and field means in this company's data before relying on it. Use before reading Sankhya or writing code that does.
---

# Sankhya

The tables and columns are the same in every company. What they mean is not: which operation types (TOP) are a sale, which date counts, which status means done, which custom fields carry the real rule. Find each of these in this company's data, ask the person what the data cannot settle, and never take a code or a meaning from other companies, public examples or a field's name alone.

The connection is read only. Never write, never ask for values to store, and never look for a way around a refusal: a refusal is the answer.

## Rules for every read

- Read only. There is no operation that writes, and a refusal is the answer, never a thing to get around.
- One page per call. A page that is not the last says so (`possuiMaisPaginas`, `temMaisRegistros`, `pagination.hasMore`), and some lists never say: an empty or short page is their end. Read the next page only when the person's question needs it.
- Each operation counts its pages in its own way: the first page is 0 on some and 1 on others, and the parameter is `page` on all but the prices, which take `pagina`. The part for the subject gives the first page of each; use it.
- Use the ready operations before the read doors. They are typed, the same for every company, and cost one call.
- Confirm what a code or a field means in this company's dictionary before relying on it (see The dictionary).
- Leave the HR and payroll tables alone: never read them through the read doors (tables that start with `TFP`, and employees' personal data); no ready operation covers them.

## The ready operations, by subject

Each subject has a part you read on demand (`skill_read`, `references/<subject>.md`) with its operations, the first page, the main filters and what the documentation warns.

- `cadastros` (Cadastros): `empresas`, `clientes`, `vendedores`, `tiposOperacao`, `naturezas`, `centrosResultado`. Companies, customers, salespeople, operation types (TOP), financial natures and result centers. Read `empresas` first: other operations need a company code.
- `produtos` (Produtos): `produtos`, `gruposProduto`. The catalog and its groups.
- `vendas` (Vendas): `pedidos`, `impostosDoPedido`, `notasFiscais`, `notaFiscal`, `devolucoes`, `notasCanceladas`. Sales orders, invoices, returns and cancelled invoices.
- `estoque` (Estoque): `estoque`, `locaisEstoque`. Stock balances and stock locations.
- `financeiro` (Financeiro): `contasAReceber`, `contasAPagar`, `tiposPagamento`. Receivables, payables and payment types.
- `precos` (Preços): `precosDoProduto`, `precosDaTabela`. Sale prices by product and by price table.
- `logistica` (Logística): `transportadoras`, `ordensCarga`. Carriers and load orders.
- `tabelas`: what the REST API does not have (purchases, suppliers, costs, detailed finance, bank movement, order-to-invoice links, sale price rules, stock with reservation and shelf life) and the tables to read it from through the door.

## The read doors (Porta de leitura, subject `porta`)

Use these when the company's own data is what the person asks about and no ready operation covers it (`tabelas` says where to look).

- `consultar`: one SQL read (`SELECT` or `WITH`, one statement) through the DB Explorer. Use it to investigate the dictionary and to join tables. It refuses any other statement, any comment (`--`, `/*` or `*/`, quoted or not; a read never needs one), a statement word outside quotes (`INSERT`, `UPDATE`, `DELETE`, `MERGE`, `EXEC`, `INTO` and the like, so an alias with one of those names needs another name), and Oracle's `q'` quoting. It is for reading only, and a write is refused: first by this filter, which is best effort and not a guarantee, then by Sankhya's DbExplorer, with the company's read only integration user behind both. Never try a write. The answer is `linhas` (each row keyed by column) and `completo`; `completo: false` means Sankhya cut the list.
- `carregar`: `loadRecords`, one entity by its instance name. Put every value in `criterio.parametros` with `?` in the expression (`I` integer, `S` text, `D` date `dd/mm/yyyy`, `H` date and time `dd/mm/yyyy hh:mm:ss`, `F` decimal with a dot; always pass a date as a parameter, never inside the expression). The expression takes the same refusals as `consultar` (no `;`, no comment, no statement word outside quotes). Every value comes back as text. `temMais` says there is another page.

Decimals arrive as JSON numbers in `consultar`, which can lose precision, and dates as text. Convert both in the SQL (on Oracle, `TO_CHAR(VALUE, 'FM999999999990.00')` and `TO_CHAR(DATE, 'YYYY-MM-DD')`), and sum in SQL rather than in code.

## The dictionary

The meaning lives in the dictionary, which `consultar` reads:

- `TDDTAB`: tables (`NOMETAB`).
- `TDDCAM`: fields (`NOMETAB`, `NOMECAMPO`, `DESCRCAMPO`); `ADICIONAL` marks what the company created.
- `TDDOPC`: what each value of a coded field means, by `NUCAMPO`. A company can add options.
- `TDDINS`: the instance names `carregar` takes as `entidade`.

Search the person's word in `DESCRCAMPO`, confirm each column exists before using it, and read the options of every coded field. Custom fields start with `AD_`. Never change the dictionary.

## Investigate in stages

1. Name the concept in the person's words and list the tables that may hold it.
2. Find the engine: `SELECT 1 FROM DUAL` answers on Oracle and fails on SQL Server. Write portable SQL (`COALESCE`, `CASE`, `CAST`).
3. Read the dictionary for each field you plan to use, and the meaning of each code.
4. Measure what is really used: group recent documents by the fields that classify them, with counts and totals, and count how many rows have each field you need filled.
5. Join and count safely. Versioned tables (`TGFTOP`, `TGFTPV`) are joined on the code and the version the document stored (`DHTIPOPER`, `DHTIPVENDA`). Count the rows per key before any other join. Orders and the notes made from them are separate documents; count one or the other. A document number repeats across operation types, companies and series.
6. Settle or ask. Ask only what the data cannot settle, one decision per question, in the person's business words, never a table, a field or a code. A meaning the person does not give stays open.

Record what you proved with the query that proved it, never the rows.

## Never

- Write, update, delete or call a service that does. There is no such operation.
- Ask for a credential, a token or a value to keep.
- Take a code from memory: an operation type number means what this company's data says.
- Read a refusal as an empty list. A refused read has no rows to report.
