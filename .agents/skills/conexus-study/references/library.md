# Studying a library

Read when the step uses a library; the examples are Mastra's. The failure this prevents: the
warnings sat on each option's reference page or in the installed code, never in the overview.

1. Load the maintainers' skill first (`mastra` for Mastra): it finds the current reference. The
   index of Mastra's pages is `https://mastra.ai/llms.txt`; every page has a `.md` version.
2. For each piece of the library the step touches, read by default its reference page, with the
   section of each option used; the provider's integration page; and the installed code at the
   pinned version, checking the default of each option the card uses ([code
   C75](../../../../docs/guides/code.md)).
3. Write one line per option in the report's section 6: name, default at the installed version
   (`file:line`), the value to use, and "documentation warning: <...>" or "none". An option turned
   on without its line does not enter the card.
4. For each option turned on, search the installed code for what else it switches on: `observability`
   wraps the logger, `threadTitle` overwrites the title, `toolCallConcurrency` creates races. A
   `grep` of the option's name in the installed `dist` is enough.
5. When the platform has a feature like the step's (environments, deploy, machine, alerts), read its
   page and the public client code, and say what to take and what not, with the reason.
6. Version: the local fork may trail the installed version. A claim that something exists in our
   version comes from the installed `node_modules`; the fork serves only to read packages not
   installed. The report says which one it read.
7. Fill the report's section "Documentation read": pages read whole, pages read by headings only,
   pages not read. A "not found" counts only with this list.
