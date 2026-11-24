---
name: conexus-sankhya
description: Reads and writes a company's Sankhya through the Sankhya connector. Every company configures its own Sankhya, so the skill teaches how its routes page, how to read the company's own tables, how to find what each code and field means in this company's data before relying on it, and how an order is placed. Use before reading Sankhya, writing to it, or writing code that does.
---

# Sankhya

Every company has the same tables and columns, and gives them its own meaning: which operation types (TOP) are a sale, which date counts, which status means done, which custom field carries the real rule. Find each meaning in this company's data, ask the person only what the data cannot settle, and never take a code or a meaning from another company, a public example or a field's name alone.

## Reading

- One page per call. A list answers `{ linhas, temMais }`: `temMais` is `true` when another page follows, `false` on the last, and `null` when the route does not say (then a short or empty page is the end). A page with no rows is `linhas: []`, never a refusal. Read the next page only when the question needs it.
- Pages start at 0 and are called `page`, except on the finance titles (start at 1) and on the prices (called `pagina`, start at 1). Each subject's part (`references/<subject>.md`, read with `skill_read`) gives each route's page and filters.
- A row comes as Sankhya sent it. A number may come as text (`"201"`), one field may be a number in one row and text in the next, a key may be spelled oddly (`"dataAlteracao:"`), and a list of one comes as a list. Parse in your code each field it uses, and never infer a type from a name.
- To find a record, search; to walk a whole list, list. A search takes any mix of its filters (part of a name, a code list or range, active, and its subject's own), matches a name with no regard to case or accent, answers one page of rows in code order with `temMais` (`limite` sets its size, up to 100), and gives the next rows to the same call with `depoisDe` set to the last code read. A field it does not know is refused by name.
- A refused read has no rows. The refusal is the answer: never read it as an empty list, and never look for a way around a refusal of access.

## The company's own tables

When no published route has what the person asks (`references/tabelas.md` lists what the API lacks), read the tables:

- One SQL read through the DB Explorer: a single `SELECT` or `WITH`. It refuses any other statement, any comment (`--`, `/*`, `*/`, even quoted; a read never needs one), a statement word outside quotes (`INSERT`, `UPDATE`, `DELETE`, `MERGE`, `EXEC`, `INTO` and the like, so an alias with such a name needs another), a number glued to a word, and Oracle's `q'` quoting. The filter is a first layer and best effort; Sankhya's DbExplorer and the company's read only integration user stand behind it. The answer is `linhas`, each row keyed by column, and `completo`, false when Sankhya cut the list.
- One entity by its instance name (`loadRecords`). Put every value in `criterio.parametros` with `?` in the expression: `I` integer, `S` text, `D` date `dd/mm/yyyy`, `H` date and time `dd/mm/yyyy hh:mm:ss`, `F` decimal with a dot; a date always goes as a parameter. The expression takes the same refusals as the SQL read, and no `;` at all. Every value comes back as text, and `temMais` says another page follows.

The SQL read answers decimals as JSON numbers and dates as text. Convert both in the SQL (on Oracle, `TO_CHAR(VALUE, 'FM999999999990.00')` and `TO_CHAR(DATE, 'YYYY-MM-DD')`), and sum in SQL rather than in code.

## The dictionary

The meaning of a table lives in the dictionary, read by SQL:

- `TDDTAB`: the tables (`NOMETAB`).
- `TDDCAM`: the fields (`NOMETAB`, `NOMECAMPO`, `DESCRCAMPO`); `ADICIONAL` marks what the company created.
- `TDDOPC`: what each value of a coded field means, by `NUCAMPO`. A company can add options.
- `TDDINS`: the instance names an entity read takes.

Search the person's word in `DESCRCAMPO`, confirm each column exists before using it, and read the options of every coded field. A custom field starts with `AD_`. Never change the dictionary.

## Investigate in stages

1. Name the concept in the person's words and list the tables that may hold it.
2. Find the engine: `SELECT 1 FROM DUAL` answers on Oracle and fails on SQL Server. Write portable SQL (`COALESCE`, `CASE`, `CAST`).
3. Read the dictionary for each field you plan to use, and the meaning of each code.
4. Measure what is really used: group recent documents by the fields that classify them, with counts and totals, and count how many rows fill each field you need.
5. Join and count safely. A versioned table (`TGFTOP`, `TGFTPV`) joins on the code and on the version the document stored (`DHTIPOPER`, `DHTIPVENDA`). Count the rows per key before any other join. An order and the invoice made from it are separate documents: count one or the other. A document number repeats across operation types, companies and series.
6. Settle or ask. Ask only what the data cannot settle, one decision per question, in the person's business words, never a table, a field or a code. A meaning the person does not give stays open.

Record what you proved with the query that proved it, never the rows.

## Placing an order

An order is the one thing written to Sankhya, and a person approves each one before it is sent. It is always placed "a confirmar": someone in the company confirms it in Sankhya.

- Read the stock of each product first: an item's place (`codigoLocalEstoque`) and control come from one of its lines. A place given for the whole order goes to every item.
- The order's model note (`notaModelo`) is set by whoever configures the tool, never by you.
- The note (`observacao`) takes up to 150 characters minus 17: Conexus adds its mark at the end, so the person finds the order.
- The answer is the order's code (`codigoPedido`). When Sankhya's gateway times out after taking it, the order may exist with no code in the answer.

## Never

- Ask for a credential, a token or a value to keep.
- Take a code from memory: an operation type number means what this company's data says.
- Write through the SQL read, or look for another way to write than placing an order.
