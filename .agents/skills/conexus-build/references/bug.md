# Fixing a defect

Read only when the unit is a defect. With pstack, run these steps with `tdd`; where the two differ,
these steps win.

1. Reproduce it first, with the smallest input that shows it, on the real artifact.
2. Find the cause: ask why until the answer is a line of code or a missing rule, not a symptom.
   Then take the native step ([code C75](../../../../docs/guides/code.md)): for each piece the fix
   adds or changes that a library emits or could do, write one reference row (the installed
   `package@version` with `file:line`, how the library does it, and the verdict). A remendo row
   needs its [boundaries](../../../../docs/reference/boundaries.md) entry and the founder's word in
   the same pull request.
3. Write the test that fails because of the defect, through the public door, and see it fail.
4. Fix the cause, not the symptom: no guard that silences a crash, no retry over a race.
5. See the test pass, then search for the same cause elsewhere and list each place.
6. Report: the symptom, the cause, why the fix removes it, what stops it returning, the reference
   rows, and the other places found.

A failed fix follows the review loop of [delivery](../../../../docs/guides/delivery.md).
