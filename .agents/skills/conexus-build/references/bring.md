# Bringing code from the old repository

Read only when the unit brings code.

## Where the old code is

The old repository at its frozen commit, read only. Extract the files you need into a new empty
directory with `git archive <commit> <paths> | tar -x`; never check out, never write inside the old
clone, never run its scripts or installs.

## Before you copy

- The card's table of parts names the file where the part lands, what is refactored and each old
  decision it carries. Bring nothing the table does not list.
- Read the part's entry sheet, handed by firstmate as `conexus-study` says, for the behaviours it
  must prove again; they are in the card as criteria.
- The part enters with its medium and large fixes done. Small ones are listed as debt in
  architecture section 11, one line each, with the step that removes them.

## While you bring

- Old names change to the new tree's words; old paths, old process names and the old repository's
  name do not appear.
- An old test is kept only if it passes through the public door without changing its meaning;
  otherwise it is rewritten against the criteria.
- Every line kept passes the study rule ([`conexus-study`](../../conexus-study/SKILL.md) step 5).
  A line that exists only because the old code had it leaves.

## The measure

Count for each part the measure of the study rule ([`conexus-study`](../../conexus-study/SKILL.md)
step 5), and stop as the skill's step 4 says.
