# The study report

Kept outside the repository ([delivery L21](../../../../docs/guides/delivery.md)); the card copies
its reference table, and a one-way door leaves a decision record. Short enough to be read: the
founder's page one page, the rest evidence. Quote what you find: `file:line`, the version or
commit, a short verbatim snippet.

## The template

```markdown
# Study: step <n>, <name>

**Base**: `main` at <commit>. **Earlier studies used**: <which, and what this corrects>.

## 1. A página do fundador (Portuguese)

What a person will do and see at the end, with an example; what the references do, in plain words;
what we build. Decisions only where they are really his: a product choice, references diverging on
what a person sees, or a remendo row (code C75). Each one lettered, with a recommendation, its
verdict, and the native how in one plain line, never theory alone.

## 2. The question and its premise

Each question in one sentence; the premise as it arrived; whether it held, and the root cause if not.

## 3. The reference table

<the table below, one row per piece>

Searched: <where, with each analog's pin; set aside, with why>.

Options a guarantee rests on: <library and constructor, option, default at the installed version
with `file:line`, value to use and why, documentation warning>. Errors the library handles itself,
with the option that sends them to the central handler (code C50).

## 4. Recommendation

What to build, written from zero, and what of `main` it deletes. Where references diverge, every
option with its how: native primitives (`package@installed`: API, `file:line`), how the vendor's
products do it (`file:line`), and what we write ourselves and why. Rejected options with their
reason. Every number with its source. A one-way door: the decision record and its Result
([proof](proof.md)).

For each brought part: the old file at the frozen commit, lines today, the lines its refactor will
change, the old decisions it carries with their basis, the small fixes left as debt, and whether it
would be written this way from nothing. Then every claim the card rests on, with its label
([sources](sources.md)), and every relay not reopened.

## 5. Not read, not run

What the coverage list leaves open, and why.

## 6. What a person saw

Only for a step with a screen: old and new side by side, per state, with the captures folder
([screens](screens.md)).
```

## The reference table

The one artifact from study to review. The study fills every column but "Unidade" and "Arquivo
novo", which the card adds; the verdicts are [code C75](../../../../docs/guides/code.md)'s.

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| What a person sees, or the mechanism | U&lt;k&gt;, or "fica de fora" and why | `file:symbol`, or "nenhum" | `package@installed` or `repo@commit`, `file:line`; "nenhuma faz" when none does | One line | nativo, embrulhado (and what ours adds) or remendo | Script output, test or measurement, and the boundaries entry | His words and date, or "não precisa" | Path |

Never one row for "o resto". A product piece no library has (our Git, the accounts queue) is a
remendo row that cites its decision record.

## The coverage list

What the table's shape cannot show. The study closes when each box holds.

- [ ] The old product run for what it did; one reference run where behaviour changes.
- [ ] Every library claim from the installed version, the maintainers' skill loaded.
- [ ] Every number and limit sourced, or dropped.
- [ ] Every reader line reopened, or marked relay in section 4.
- [ ] Notes, clones, captures and run outputs beside the report.

What each unit writes, in what order, its blast radius and its failure table are the card's work
([`conexus-scope`](../../conexus-scope/SKILL.md)); the study gives it the facts.
