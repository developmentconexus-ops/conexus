# The live path

A live call is a read or a write the Assistant, the Builder, a published app or a saved tool makes
while a person waits. Every one goes through the kit today. A bare file name here is in
`apps/server/src/hub/connectors/`, the only production folder that imports the kit. The card lists these Hub
pieces as already decided: they stay when a connector is rebuilt.

## One executor

`executor.ts`, `send.ts` and `wire.ts` are the only code that opens a sealed credential and calls a
provider ([0056](../../../../docs/decisions/0056-connectors-kit-and-one-executor.md)). For each call
the executor:

1. builds the request with the kit's `toRequest`, on the connector's fixed origin, or the loopback
   double in a test;
2. takes a token from the kit's session: `limits.ts` keeps one process session per pasted login, and
   `tokens.ts` makes OAuth a token source with a lease in the database, because a refresh may serve
   once ([0057](../../../../docs/decisions/0057-connections-by-oauth.md));
3. sends with a deadline, a 2 MiB cap and no redirect, one call per connection at a time; a 429 is
   waited once when its wait fits, and a 5xx is `UNREACHABLE` with no new attempt
   ([0058](../../../../docs/decisions/0058-provider-limits-and-queues.md));
4. reads the body with the kit's `parseJson` and the connector's `numbers`, then returns the
   `Answered` the operation's `answer` gives.

`read.ts` runs a read with `session.call`; `check.ts` is **Testar**, which sends only the
connector's `check`; `write.ts` runs a write with `session.once`, after the approval.

## Who calls it

| Caller | Door | What it reads of the kit |
| --- | --- | --- |
| The Assistant | `assistant-port.ts` | the reads as tools, the generated skill |
| The Builder | `builder-port.ts`; the typed tools in `harness/tools/connectors/typed-reads.ts` | the skill through `connectorSkill`, the `list` declarations, the reads as typed tools |
| A saved tool | `tool-door.ts` | the operation it was saved with |
| A published app | `app-calls.ts`, `apps.ts` | the reads its manifest declares; the types come from `packages/connectors/src/calls.ts` |
| Roles | `role-kit.ts`, `grants.ts` | one resource per connector and one action per operation |
| The model's share | `cut.ts` | what of an answer reaches the model |

An agent finds a connector's tools with Mastra's `search_tools` and `load_tool`. The Builder names
a typed read with `toolNameOf`, `<connector>_<operation>`. The skill never writes that name
([kit](kit.md)).

## The five-place contract

The operation ids (`pedidos`, `lancarPedido`) and the answer `{ linhas, temMais }` are read in five
places: the published app, the saved tool, the role (`connector_<id>: [operation]`), the Caderno and
the typed tool's name. A rebuilt folder keeps the ids, and today's tests pass through it without
changing what they expect (the card, "O que prende a troca"). The founder kept this contract on
2026-11-24. For a new connector, the ids it ships with are permanent: pick them in Portuguese, as
the system's users say them, before the first app can read them.

## A write

The Hub's write funnel reads only `writes`; `operations` and the read door refuse a write. A person
approves each write on the approval card: `approval.ts` decides whether and whom to ask, Mastra's
`requireApproval` asks (wired in `agents/saved-agent/tools.ts`), and `write-record.ts` records it. The Hub asks the operation what only the provider knows
([0062](../../../../docs/decisions/0062-a-write-declares-its-provider-facts.md)):

- `uncertain(native)`: the answer leaves the write's end unknown, so the Hub never resends it
  (Sankhya: `GTW3503`);
- `mark(input, mark)`: the input with the mark where the person finds the write (Sankhya:
  `observacao`);
- `idOf(value)`: the one value a log may print (Sankhya: `codigoPedido`);
- `fixed`: input fields only whoever configures the tool fills; they leave the model's schema
  (Sankhya: `notaModelo`).

A write is never idempotent and never repeats, not even on `TOKEN_EXPIRED`. Step 24.5 closed this
path; the approval-card reference is Mastra's `requireApproval`, and the Nekt lets the agent
confirm instead of a person (the card's reference table, row 48).

## What the Hub never holds

- A provider's name, route, field, code or limit (S36). A Hub branch on a connector id is a defect:
  move the fact to the definition as data.
- A provider's write fact (0062).
- A typed shape of an answer: the operation's `output` owns it.
- A second reader of the number: `wire.ts` reads through `parseJson` only.

## Testing the live path

Hub tests run the real executor against the connector's double served on loopback
(`HUB_CONNECTOR_ORIGINS`, loopback only). A change to a connector skill's frontmatter changes the
model request snapshots in `apps/server/src/agents/assistant/request.test.ts`; update them in the
same commit and say why. A change to a read's types can pass `npm run check` and still break the
app SDK's declaration build; run `packages/app/src/check/connectors.test.ts`.
