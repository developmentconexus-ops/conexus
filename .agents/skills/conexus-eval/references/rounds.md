# Rounds, step 4 to 11

The steps of [conexus-eval](../SKILL.md) from the dataset to the report, with what invalidates a round. The
numbers of steps 9 and 11 are in the Statistics section.

4. **Dataset.** A Mastra dataset with `inputSchema` and `groundTruthSchema`; every edit makes a new
   version, and every experiment pins `version`. Ground truth is data, computed by SQL from the
   test database, never typed by hand. Check it two independent ways where a second path exists
   (for example, the raw SQL and the Ontology's compiled plan); a disagreement is a ground-truth
   bug until proved otherwise. Cover every domain the decision touches, refusals included (a
   question the role must not answer, whose right answer is the refusal). Keep the questions in
   the words of a person of the company, not of the author of the arms. Freeze a held-out part
   that no one reads while tuning an arm. When a double of a reference platform serves the data (it runs no
   SQL of the platform), the ground truth comes from the data the double serves, and the double's own
   refusals count apart, not as the agent's miss.
5. **Scorers, code first.** The answer is scored against the ground truth by a `createScorer`
   function (numeric tolerance, list order, dates), as BIRD and Spider score by execution. Add
   Mastra's checks for the path: `checks.noToolErrors`, `maxToolCalls`, `didNotCall` for the
   refusal, and `createTrajectoryScorerCode` when the expected path is known. A model judge enters
   only for what code cannot decide (the explanation in words), binary pass or fail, from another
   provider than the arms, fixed for the whole comparison, and calibrated first (step 8).
6. **Small round.** 20 to 50 questions, one attempt, every arm, the cheapest model the decision
   allows. Each question in a new conversation **and** for a new person (or with memory off): the
   Assistant's memory recalls by person (`recall: 'resource'`). Run it as a caller-driven experiment
   on the Hub's own Mastra: `createExperiment` without a target, with `grouping` (`variantId` for
   the arm, `trialIndex` for the attempt); drive the turn through the routes; run our scorers and
   Mastra's checks on our side, since Mastra never scores a target-less experiment; then
   `submitExperimentResult` with the output, the scores, the turn's `traceId` and `attempt`, and
   check the scores arrived (their write is best-effort). Cost and tokens come from
   `getMetricBreakdown` by `model`, filtered by the turn's `threadId` or `traceIds` (not by
   `experimentId`, which the Hub's traces do not carry), priced by `estimatedCost`.
7. **Error analysis before any number.** Read every failed trace and a sample of the passing ones,
   in the Studio (Traces, Experiments) or from the spans. Write one open note per failure, then
   group the notes into a failure taxonomy (open, then axial coding). Sort each failure into: the
   agent, the ground truth, the scorer, the harness, the data. Fix the last four before blaming the
   first, and bump the dataset version. Read until new traces stop showing new kinds of failure.
8. **Judge calibration, when a judge exists.** Label 50 to 100 outputs by hand, pass or fail, by
   one named domain expert. Split them into examples for the judge's prompt, a development part and
   a held-out test part. Run the judge as `targetType: 'scorer'` over the labelled outputs and
   report its true-positive and true-negative rates on the held-out part, not its raw agreement. A
   judge below the bar the question names does not score the round.
9. **Size the large round.** From the small round's discordant pairs, compute how many questions
   detect the difference of step 1 with 80% power (the Statistics section below).
   Questions generated from templates are clustered: count templates, not questions, as the
   independent unit, or report clustered standard errors. Repeat each question 3 times when
   reliability matters (`attempt: 0, 1, 2`); more questions beat more repeats. Write the cost
   estimate from the small round's measured tokens, and ask the founder for the round.
10. **Large round.** The same harness, dataset version, scorers and judge as the small round, at
    the sized count, every arm in the same window, with the arms' order shuffled per question.
    Our loop stops early when a refusal leaks a row (`runEvals` gates need a target and give their
    verdict only at the end).
11. **Report.** Per arm and per domain: accuracy with its 95% interval, the paired difference to
    the baseline with its interval and the McNemar test on discordant pairs, pass^k when repeated,
    refusals, steps, tokens, `estimatedCost` per right answer, and time. Say what the result does
    not show. A difference whose interval crosses zero is "not distinguished", never "slightly
    better". Name the Conexus commit, the model, the dataset version and the experiment ids.

## What invalidates a round

- An arm ran on another commit, prompt, model, effort or dataset version than it says.
- The ground truth changed between arms, or was read while tuning an arm.
- The agent was not the real harness and the report does not say so in its first line.
- A provider error, timeout or rate limit counted as a wrong answer. Count it apart and rerun it.
- The judge changed between arms, or was never calibrated.
- Questions shared state: an earlier conversation, the person's memory or a file reached a later
  question.
- The double that answered was scripted by the author and the result is presented as the agent's
  (testing T14).

## Native first

Mastra 1.82.0 gives the dataset with versions, the experiment, caller-driven results with
`attempt` and `grouping`, scorers and checks, trajectory scorers, `compareExperiments`, traces,
metrics with `estimatedCost` filtered by thread or trace, feedback on traces and the Studio.
What is ours: the ground-truth SQL, the answer scorer, the statistics (Mastra's
`compareExperiments` gives averages and a delta, no interval), and the driver that runs the turn
through the Hub's routes. Nothing else is built beside Mastra.

## Statistics of a round

Sources: Miller, "Adding Error Bars to Evals", [arXiv 2411.00640](https://arxiv.org/abs/2411.00640) (clustered standard errors, paired
differences, resampling, power analysis); Yao et al., tau-bench, [arXiv 2406.12045](https://arxiv.org/abs/2406.12045) (pass^k).

### Accuracy of one arm

Report the Wilson 95% interval of k right out of n. Width shrinks with the square root of n:

| Observed | 95% interval | Half-width |
| --- | --- | --- |
| 12 of 24 | 0.31 to 0.69 | 0.19 |
| 80 of 104 | 0.68 to 0.84 | 0.08 |
| 400 of 520 | 0.73 to 0.80 | 0.04 |

Half-width 0.10 needs about 97 independent questions; 0.05 needs about 385 (worst case p = 0.5).

### Two arms on the same questions

Pair them. Count b (only the new arm right) and c (only the baseline right). The exact McNemar
test is a binomial test of b against b + c. The questions both get right, or both get wrong, say
nothing about the difference. With 24 questions, a net gain of 4 never reaches 5%: b = 4, c = 0
gives p = 0.125, and b = 6, c = 2 gives 0.289. The smallest significant result is 6 to 0 (p = 0.031);
5 to 0 gives 0.0625. Below about 50 questions, use this exact test, not the table below.

Smallest difference detected with 80% power at 5%, from the share of discordant questions:

| Questions | 10% discordant | 20% | 30% |
| --- | --- | --- | --- |
| 104 | 0.09 | 0.12 | 0.15 |
| 260 | 0.06 | 0.08 | 0.10 |
| 520 | 0.04 | 0.06 | 0.07 |

### Questions generated from templates

Questions filled from one template fail together. The effective sample is n / (1 + (m - 1) rho),
with m questions per template and rho their correlation. 520 questions from 26 templates (m = 20)
at rho = 0.3 are worth about 78 independent ones. Report clustered standard errors by template, or
count templates. More templates beat more fillings.

### Repeats

A repeat of the same question cuts the variance of the per-question score, with a ceiling of 2/3
in Miller's binary example (K = 2 cuts 1/3, K = 4 cuts 1/2). Repeats do not replace questions.
When reliability matters, report pass^k, the share of questions right in all k attempts; with
independent attempts at p = 0.8, pass^4 is 0.41.
