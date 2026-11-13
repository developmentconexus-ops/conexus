# Reading sources

The failures this prevents: Mastra 1.69 cited for a 1.78 pin; Conexus OS read at a checkout's HEAD
instead of its frozen commit; lines cited from clones that vanished with a worktree; our own code
taken as a reference; a warning that sat on an option's reference page, never in the overview.

## Where each source is read

- **An installed library**: its `node_modules` package at the lockfile version: `dist/docs` first,
  then the maintainers' skill and Context7 at that version, then the code; a source map holds the
  source when only `dist` ships. A claim that something exists or behaves so in our version comes
  only from here. For each option a step turns on, `grep` its name in the installed `dist` to see
  what else it switches on.
- **A library's own products** (Mastra Code, Factory, templates): the reference shelf's checkout at
  the tag of our pin. If the shelf trails the pin, say so in the register and read behaviour from
  `node_modules`.
- **Conexus OS**: only `git show e0353c36:<path>`, or an extraction of that commit; never a
  checkout's HEAD.
- **An open-source analog**: the shelf, at the commit its manifest records. Clone a missing one
  there, never inside a task worktree, and add its manifest line.
- **A closed product**: its official docs. Save each page read, with its date, beside the report.
  Docs say what a product claims, not what it does: label them **documentado**.
- **A non-official source** (a leaked system prompt, Kiro, Mitra, G4 OS): label it **não oficial**.
  It shows a shape to study, never a behavior to claim. The row cites the file and its date, and a
  remendo row never rests on it alone. No text from it enters the repository.
- When the platform has a feature like the step's (environments, deploy, machine, alerts), read its
  page and public client code, and say what to take and what not.

## What the reference table takes from here

Each row's "Referência" cell names the version or commit read, and says when it differs from
Conexus's pin. The report's search line says how each source was read (code, docs, run) and what
was read whole, by headings, or not at all; a "nenhuma faz" counts only beside it.

## The trace of a built row

A built row needs the closest reference's code read end to end, not its page or a summary: the entry
(route, tool, hook), the data shape at each hop, where state lives, the library pieces called, and
how errors travel, each with `file:line` at the pin, labelled **lido**. For Mastra that is Mastra
Code, Factory and the package's own source beside `dist/docs`; for the AI build flow, vibesdk. The
maintainers' skills for every library the row touches ([stack](../../../../docs/reference/stack.md))
are read first. A row whose cell is relay, documentado or "nenhuma faz" without the search list,
while the code exists, goes back to research.

## Labels

Every claim, and every cell of the reference table's "Como a referência faz", carries one:
**provado** (run here), **lido** (code at a pin, `file:line`), **documentado** (vendor docs, dated),
**herdado** (our own code or decision: it describes, never justifies), **hipótese**, **não
verificado**.

## Readers

A reader gets one source and the fixed questions. Its lines are reopened by the author before they
enter the report, or carried as **relay**. Its notes stay beside the report.
