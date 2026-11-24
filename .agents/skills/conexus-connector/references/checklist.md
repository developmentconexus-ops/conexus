# The review checklist

Apply each line to connector work beside [`conexus-review`](../../conexus-review/SKILL.md). A line
that fails is a finding with its file and line; the review skill labels it.

## One source

- No provider name, route, field, error code or limit outside `packages/connectors` (S36). Search
  the diff's Hub, web and prompt files for the connector id and its codes.
- No Python, card or prompt redeclares a system the kit declares
  ([0074](../../../../docs/decisions/0074-python-for-extraction-in-apps-extraction.md)).
- No Nango or other connector platform package or call
  ([0069](../../../../docs/decisions/0069-connectors-one-source-the-kit.md)).

## The contract

- No operation id renamed and no change to `{ linhas, temMais }`: the five places in
  [live](live.md) still read the same ids, and today's tests pass without changing what they expect.
- New ids are Portuguese and named as the system's users say them.

## The definition and the login

- `credentialClass` is `EXCLUSIVE` unless a measurement in the PR or a decision proves `SHAREABLE`.
- An OAuth login has PKCE `S256`, the `grant` and `app` refusal lists, and `revoke` when the
  provider documents one; each fact cites the provider's page.
- `numbers` is `EXACT` when answers carry fractions or large integers; the PR and the release note
  say that such values reach apps as text.
- `callLimit` says where the provider counts, by app or by account, with the page that says so.
- The logo is the provider's square symbol and passes `logoProblems`.

## Each operation

- `request` builds only a path and query on the fixed origin, through the kit's helpers.
- `answer` turns every non-2xx into a kit failure with the provider's code and message, and never
  carries a 2xx body on a failure.
- The `output` reads only fields a recording holds. Find the recording for each shape the tests
  feed; a typed shape is a finding (T29).
- A list read declares `list`, and the conformance walks every page of the double once.
- `summary` and `label` are Portuguese and say what the read returns, its page cap and window.

## Each write

- Declared in `writes`, with `uncertain`, `mark`, `idOf` and `fixed`
  ([0062](../../../../docs/decisions/0062-a-write-declares-its-provider-facts.md)), never
  idempotent, never retried.
- The Hub learns nothing of the provider from it: no Hub branch on its id or code.
- The approval card shows what the write does in the system, in the person's words.

## The skill

- The written part names no tool (`<connector>_<operation>`) and does not list operations by bare
  id. The load-time check only catches the prefixed name, so read the text: the Mercado Livre
  review found a list by bare id that passed every test.
- It promises no tool, screen or copy that does not exist today. The Mercado Livre review found a
  line telling the agent to propose a copy after that tool had left.
- It keeps the comments and facts that hold a reason the code cannot show (a founder's word, a
  provider page, a security rule).

## The double and the tests

- Every body the double sends is a recording with invented values; no real name, document number,
  token or company data (S40).
- `runConformance` runs for the connector, and every recorded refusal is read.
- Each new kit line has a hand mutation that turns a test red (T27). The conformance cases that
  cannot fail count as no proof.
- The app SDK's declaration test and the model request snapshots ran when types or the skill's
  frontmatter changed ([live](live.md)).

## The references

- Each kit piece the PR adds or changes names its reference at a commit and line, and says "same
  situation" or names the difference ([kit](kit.md)). A piece no reference has is a remendo with its
  `docs/reference/boundaries.md` entry, and a departure goes to the founder (delivery L28).
- A new kit piece is named for no provider and serves the next connector too ([gaps](gaps.md)).
- No line exists only because the old code had it: no guard against a shape nothing uses, no
  leftover queue, no kept compatibility beyond the five-place contract.
