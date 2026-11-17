# The lens: what changes together, and the special cases

A special case is code that exists for one situation instead of following from how the system works:
each is a requirement the design never accounted for. Several of them usually point at one missing
piece of the design, so the recommendation names that piece once and lists the cases above it, not
one fix per case.

## Run

`npm run cochange -- --folders <the folders the step touches>` lists the folders, and the files of
different folders, that change together in git history, tests left out. Defaults: 5 commits together
and 50% of the commits of the one that changes less (`--min-commits`, `--min-percent`); a commit of
more than 25 files does not count for file pairs (`--max-files`). A pair above the threshold is a
link the code does not show: read both files and say whether they should live together, or whether
one depends on the other's internals.

## The five special cases

Search the same folders for each. Record file and line, and whether the system still needs it.

1. An `if` that tests one value, where the value should make the general code handle it.
2. A parameter only one caller passes or understands.
3. A `catch` that does not rethrow. Fine when it turns an expected error into a named result; the
   reason is in the code or it is a finding.
4. A retry, a timer or a wait that hopes another part is ready.
5. A disabled test: `.skip`, `.todo`, `skip: true`.

A case the system still needs stays, with the reason written. A case the recommendation makes
unnecessary goes on the list of what `main` deletes (step 6).
