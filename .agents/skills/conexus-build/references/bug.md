# Fixing a defect

Read only when the unit is a defect. With pstack, run these steps with `tdd`; where the two differ,
these steps win.

1. Reproduce it first, with the smallest input that shows it, on the real artifact.
2. Find the cause: ask why until the answer is a line of code or a missing rule, not a symptom.
   Then take the native step ([code C75](../../../../docs/guides/code.md)): for each piece the fix
   adds or changes that a library emits or could do, write one reference row (the installed
   `package@version` with `file:line`, how the library does it, and the verdict). A remendo row
   needs its [boundaries](../../../../docs/reference/boundaries.md) entry and its decision
   ([delivery L6](../../../../docs/guides/delivery.md)) in the same pull request.
3. Write the test that fails because of the defect, through the public door, and see it fail.
4. Fix the cause, not the symptom: no guard that silences a crash, no retry over a race.
5. See the test pass, then search for the same cause elsewhere and list each place. A state fix
   reruns A→B→A; a layout fix reruns the card's failure states.
6. Report: the symptom, the cause, why the fix removes it, what stops it returning, the reference
   rows, and the other places found.

A failed fix follows the review loop of [delivery](../../../../docs/guides/delivery.md).

## A test that fails now and then

1. Show the race first, deterministically: delay or reorder the step the test races against (an
   injected clock, a held promise, a slowed write) until the test fails every time. A fix with no
   such failure is a guess.
2. Fix the cause: the test waits for the observable event ([testing T20](../../../../docs/guides/testing.md)),
   never a longer wait and never a retry. The second round hides a flake from the CI colour, not
   from its issue.
3. Size the repeats by the rate: 95% confidence takes about 3/p runs (p is failures per run). One
   failure in 300 runs takes about 900, so 25 green runs prove nothing; the deterministic failure
   of step 1 is the proof, and a repeat run only checks the neighbours.
4. Close the `flaky` issue with the run that proved it, and take the file off the list in
   `biome.json` when the wait was its last.

