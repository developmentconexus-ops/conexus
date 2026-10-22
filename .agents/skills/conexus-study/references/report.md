# The study report

Kept outside the repository ([delivery L21](../../../../docs/guides/delivery.md)); the card copies from
it, and a one-way door leaves a decision record. Short enough to be read: the founder's page one
page, the rest evidence. Quote what you find: `file:line`, the version or commit, a short verbatim
snippet.

## The template

```markdown
# Study: step <n>, <name>

**Base**: `main` at <commit>. **Earlier studies used**: <which, and what this corrects>.

## 1. A página do fundador (Portuguese)

What a person will do and see at the end, with an example; what the references do, in plain words;
what we build; what is our own invention; decisions only where references diverge or none exists,
lettered, with a recommendation, each option with its how in one plain line (what native piece does
it and which vendor product does it the same way), never theory alone.

## 2. The question and its premise

Each question in one sentence; the premise as it arrived; whether it held, and the root cause if not.

## 3. Who already does this

| Analog | Why it is close | Where found | Read how (code / docs / run) | At |
| --- | --- | --- | --- | --- |

Searched and set aside: <names, with why>.

## 4. Source register

Per [sources](sources.md), library options included:

| Library and constructor | Option a guarantee rests on | Default at the installed version | Set to, or kept, and why | Documentation warning, or none |
| --- | --- | --- | --- | --- |

**Errors the library handles itself**: <where it catches, prints or answers an error on its own,
with the line, and the option that sends it to the central handler (code C50)>.

## 5. The same questions

| Question | Analog A | Analog B | Analog C | Native feature | Old product | Verdict |
| --- | --- | --- | --- | --- | --- | --- |

The verdict is consolidated, one product's choice, or nobody does it.

## 6. What the repository decided, against the table

| Decision or rule | Its premise, tested at the installed version | Agrees with the table? | If not: the founder's earlier word, quoted |
| --- | --- | --- | --- |

## 7. Recommendation

What to build, written from zero, each piece tagged consolidated / one product's / **invenção**,
with its basis, and what of `main` it deletes. For every option, its **how**:

| Option | Native primitives (`package@installed`: API, `file:line`) | How the vendor's products do it (`file:line`) | What we write ourselves, and why |
| --- | --- | --- | --- |

Rejected options with their reason. Every number with its source. A one-way door: the decision
record and its Result ([proof](proof.md)).

## 8. Parts, proved and not

| Part (a visual piece has its own row) | New or brought | Design brought: yes or no | File of the new tree | Refactored as it enters | Old decisions it carries, with basis in words |
| --- | --- | --- | --- | --- | --- |

For each brought part: lines today, the lines its refactor will change, the fixes done in it, the
small ones left as debt, and whether it would be written this way from nothing. For each part
written new that replaces an old mechanism: the old mechanism (file at the frozen commit), what it
covered, and what the new part drops, and why.

Then every claim the card will rest on, with its label ([sources](sources.md)), and every relay not
reopened.

## 9. Not read, not run

What the coverage list leaves open, and why.

## 10. What a person saw

Only for a step with a screen: old and new side by side, per state, with the captures folder
([screens](screens.md)).
```

## The coverage list

The study closes when each box holds, not when sections are full.

- [ ] Three to six analogs named, with where they were searched; each read at a recorded pin.
- [ ] The old product run for what it did; one reference run where behaviour changes.
- [ ] Every library claim from the installed version, the maintainers' skill loaded.
- [ ] Every number and limit sourced, or dropped.
- [ ] Every option, the founder's page included, carries its how at the installed version.
- [ ] Every **invenção** proved or put to the founder.
- [ ] Every reader line reopened, or marked relay in section 8.
- [ ] Notes, clones, captures and run outputs beside the report.

What each unit writes, in what order, its blast radius and its failure table are the card's work
([`conexus-scope`](../../conexus-scope/SKILL.md)); the study gives it the facts.
