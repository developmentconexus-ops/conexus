# The study report

Every step's study fills this template. The report stays outside the repository ([delivery
L22](../../../../docs/guides/delivery.md)); the card copies from it, and an expensive choice leaves a
decision record. A careful report is 3,000 to 8,000 words; past 8,000, split the step.

## Evidence, cheapest first

1. What the repository already decided: the architecture, the decision records, the guides.
2. The library's own code and embedded docs, at the installed version. For Mastra, the `mastra`
   skill, then the package's `dist/docs` and source; then how Mastra's own products (Factory,
   Mastra Code) do it.
3. Reference products' code, read at a pinned commit, the same questions asked of each.
4. Vendor pages, with the date read.
5. A small proof on the real service, only for an expensive choice ([proof](proof.md)).

Quote what you find: `file:line`, the version or commit, a short verbatim snippet.

## The template

```markdown
# Study: step <n>, <name>

**Base**: `main` at <commit>. **Old code read**: <repository at its frozen commit, paths>.
**Earlier studies used**: <which, and what this study corrects in them>.

## 1. Short answer

<Three to six plain sentences: what the step needs, what the references do, what to build, what is
brought, what stays open.>

## 2. The questions

1. <one sentence each, from the roadmap or the card draft>

## 3. The premise

- **As it arrived**: <...>
- **Why, until the root cause**: 1. <...> 2. <...>
- **The premise held / fell**: <and the real question>

## 4. What the repository already decided

| Source | What it fixes for this step |
| --- | --- |
| <decision record, guide rule id, architecture section> | <...> |

## 5. References

| Reference | Version or commit | What was read |
| --- | --- | --- |

**Maintainers' skills**: for each library the step touches, the skill this machine has, or "none".

The same questions, answered for each reference with `file:line`:

| Question | Reference A | Reference B | Conexus old code |
| --- | --- | --- | --- |

Where they agree: <...>. Where they differ, and why: <...>.

## 6. The native way

<How the library or platform does it at the installed version, with file and line. What it leaves
undone, with the line where it does less.>

| Library and constructor | Option a guarantee rests on | Default at the installed version | Set to, or kept, and why |
| --- | --- | --- | --- |

**Errors the library handles itself**: <where it catches, prints or answers an error on its own,
with the line, and the option that sends the error to the central handler (code C50)>.

## 7. Options

| Option | What a person sees | Cost to build | Cost to undo | Evidence |
| --- | --- | --- | --- | --- |
| A | | | | |
| B | | | | |

**Recommendation**: <A>, because <reason in words>. **Basis**: purpose | the founder's answer |
"implemented so" | "only tested so" | "decided before", and if one of the last three, why it is
accepted or dropped.

## 8. How to implement, by unit

### U<k> <name>

- **Does**: <one sentence>.
- **Library functions**: <package@version: function, with the docs or source line>.
- **Skills**: <the maintainers' skills the unit loads, or "none">.
- **The fact it rests on**: <one fact, and the run on the product itself that proved it, or "not
  proved">.
- **Writes**: <each write or command the unit adds, its own or a library's, for the card's failure
  table>.
- **Guide rules**: <ids, for example C27, D21, S7>.
- **Order**: <what first, what depends on what>.
- **Proof**: <the command or action that shows it works, and the refusal it must show>.

## 9. Parts: new or brought

| Part | New or brought | File of the new tree | Refactored as it enters | Old decisions it carries, with basis in words |
| --- | --- | --- | --- | --- |

For each brought part: lines today, the lines its refactor will change, the fixes done in it
(medium and large), the small ones left as debt, and whether it would be written this way from
nothing.

For each part written new that replaces an old mechanism:

- **Old mechanism**: <file at the frozen commit>.
- **What it covered**: <...>.
- **What the new part drops, and why**: <each item, with its reason, or "nothing">.

## 10. Blast radius

| File | Created, changed or deleted | Who imports or calls it |
| --- | --- | --- |

Command that lists the importers: `<one command>`.

## 11. Proved and not proved

| Claim | How it was checked (ran / read) | Result |
| --- | --- | --- |

**Proof of an expensive choice**: <decision record and its Criterion, or "none">.

## 12. Risks

| Risk | What a person would see | Where it is handled |
| --- | --- | --- |

## 13. Decisions for the founder

1. <question, by what a person sees, with an example>. Options: <A, B>. Recommendation: <A>,
   because <reason>. **Answer** (<date>): <his words>.

## 14. Not confirmed

<What was not read, not run, or read only by summary.>
```

## What makes a section good

- A claim cites its source or sits in section 14.
- A count comes from a command a reader can rerun, printed in the report.
- Section 8 names functions and rules, never function bodies: the card and the build own the code.
- Section 9 has a row for every part the step touches, even when the answer is "new".
- Every part in section 9 written new that replaces an old mechanism has its three fields filled.
