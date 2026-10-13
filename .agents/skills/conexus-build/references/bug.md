# Fixing a defect

Read only when the unit is a defect.

1. Reproduce it first, with the smallest input that shows it, on the real artifact.
2. Find the cause: ask why until the answer is a line of code or a missing rule, not a symptom.
3. Write the test that fails because of the defect, through the public door, and see it fail.
4. Fix the cause, not the symptom: no guard that silences a crash, no retry over a race.
5. See the test pass, then search for the same cause elsewhere and list each place.
6. Report: the symptom, the cause, why the fix removes it, what stops it returning, and the other
   places found.

A failed fix follows the review loop of [delivery](../../../../docs/guides/delivery.md).
