---
name: conexus-hubspot
description: Reads a company's HubSpot CRM through the HubSpot connector and writes a note on a contact. The connection belongs to one HubSpot portal, so the skill teaches the ready operations by subject, how a list pages, what a refusal means and that the note waits for the person's approval. Use before reading HubSpot or writing code that does.
---

# HubSpot

The connection is one HubSpot portal, authorized by the company itself. Every call is made as the user who logged in, with the scopes the company granted.

Three operations read and one writes. A refusal is the answer, never a thing to get around. If the person asks for anything else (create or change a contact, a company or a deal), say that this connection only reads those and adds notes.

## Rules for every read

- Every read answers `{ linhas, temMais }`: the records as HubSpot sent them (`id`, `properties`, `createdAt`, `updatedAt`, `archived`), and whether another page follows. When one does, `seguinte` is the cursor: send it back as `after` to read the next page. A list ends on a page with no `seguinte`.
- One page per call, up to 100 records (`limit`). Read the next page only when the person's question needs it.
- `contatos`, `empresas` and `negocios` declare how their list pages, so each can become a copy the Conexus keeps in the company's database: for data an app reads again and again, propose the copy instead of paging live.
- A refusal comes with what HubSpot answered: its `message` and its `category` (`MISSING_SCOPES` when the login lacks a scope). A scope the company did not grant refuses only that subject; the others still work.
- A contact's e-mail and phone come only to whoever may see that kind of data: the Hub leaves out of the answer what the reader may not see. Never ask for or guess what is not in the answer.

## The note

`notaNoContato` creates a note on a contact: `contactId` (the `id` of a record of `contatos`) and `body`. It is a write: the person approves it on a card before it is sent, and it is sent once. The Conexus adds its mark at the end of the text so the person finds the note. The answer is the note's `id`.

## The ready operations, by subject

Each subject has a part you read on demand (`skill_read`, `references/<subject>.md`) with its operations and their fields.

- `contatos` (Contatos): `contatos`, and the write `notaNoContato`. People the company deals with, and a note on one of them.
- `empresas` (Empresas): `empresas`. The companies in the CRM.
- `negocios` (Negócios): `negocios`. The deals and their stage.
