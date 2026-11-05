# Review the health of the CI at a step's closing

Rule: [delivery](../guides/delivery.md) L19. The reviewer is an agent that did not build the step. The job is to find why the CI got slower and to propose root-cause fixes; the founder decides between the root now and a bridge with a date to leave.

## Measure

1. List the last 10 completed `main` runs of `ci.yml` with `gh run list --workflow ci.yml --branch main --status completed`. Skip the cancelled ones: the concurrency rule cancels a run that a newer push overtakes.
2. For each run, read the "Jobs contra o orçamento" table of its summary: the minutes each job used against its `timeout-minutes`. Take the largest `server` shard (the job, not only the test step) and the sum of the `npm test` step of the six shards.
3. Take the median of each over the 10 runs. Put them beside the medians of the last review; the first review compares with the numbers the approvals ledger line of "Saúde do CI" records.
4. A median above 70% of a job's limit already shows as `::warning::` in every run (the job `ci`), and above 85% in the three latest runs opens the issue "CI acima do orçamento" (`.github/workflows/ci-budget.yml`).

## Find the why

1. Open the "Test files" table of the slowest shard in the latest run and in a run of the last review. A file that is new, or that grew by more than a few seconds, is the first suspect. `scripts/server-test-seconds.json` holds the seconds that balance the shards: record it again with `node scripts/server-shards.ts --record <log>...` on the logs of one run of all six shards when it drifted.
2. For each jump, name the cause by reading the file: a real-clock wait, a pool or lease time at its production value, a database created and migrated per test, a process per case. [Testing](../guides/testing.md) T20 says what a test may wait on.
3. Prove the cause with a counterfactual measured on the same files, A and B alternated at least three times, against the local database of [local-database](local-database.md). A cause with no measured counterfactual is a guess, and is not proposed.

## Report

One report to the founder, outside the repository: the medians against the last review, each jump with its cause and its measured gain, and the fixes in two lists, root now and bridge with a date. Close the issue "CI acima do orçamento" when the median of the largest shard is back under 85%.
