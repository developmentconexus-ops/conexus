# Studying a screen

Read only when the step creates or changes a screen. Everything below stays outside the repository,
beside the report ([delivery L21](../../../../docs/guides/delivery.md)); the card carries the images
it needs.

## The old product

1. Extract the old product at its frozen commit into a new empty directory, as [bring](../../conexus-build/references/bring.md)
   says for files; install and run it there with its own browser-test doubles, never inside the
   old clone.
2. For each screen the step touches that the old product had, capture every state a person
   reaches, each at 1440 and 390 px, in both themes. Keep the shots in a captures folder beside the
   report.
3. In the report's section 9, give each visual piece its own row with **design brought: yes or no**,
   apart from whether its code is brought. A piece whose code is new keeps its design unless the
   founder says otherwise.
4. Fill the report's section "What a person saw": old and new side by side, per state.
5. A screen whose old design the step does not bring goes to the founder with the shot.
6. A piece of today's `main` that the step keeps is compared with the reference's piece too, with
   `file:line`; "it already exists" is not a reason.

## Other apps

- Study other apps only in a step that creates or changes a screen. Always with screenshots at 1280
  and 390 px, with today's screen beside, because text alone did not change a decision and a shot did.
- The shelf is fixed: the old product run locally, Lovable, Base44 and Replit by their
  documentation, Mastra Factory and Studio, Mastra Code (`mastracode/factory-ui`),
  `playground-ui` and vibesdk's `src` by their code, and Linear. A new entry joins only when
  none covers the subject.
- The order: screenshots, then Impeccable `critique`, then two or three box layouts of different
  organisation (vary the organisation, never the visual), then the card. Visual and animation have a
  phase of their own, later.

## Impeccable

[Impeccable](../../../../docs/reference/impeccable.md) owns which of its commands, hooks and
configuration Conexus allows; read it before using it.

- Run `critique` on today's screen and on the references' shots.
- Take the questions of the `shape` interview, phase 1 (what the screen is for, who arrives, what
  they do first, which states matter), to the founder through firstmate in Portuguese
  ([delivery L23](../../../../docs/guides/delivery.md)); never run its own interview.
- A finding of it never blocks alone; [delivery L12](../../../../docs/guides/delivery.md) judges it.
- A card with a screen carries the box layouts, and its state matrix gains the columns "primeira
  vez" and "sem permissão" ([card](../../conexus-scope/references/card.md)).
