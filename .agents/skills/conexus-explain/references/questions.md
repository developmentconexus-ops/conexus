# Repertoire of technical questions

Use only the angles the change touches. The questions are seeds: fit them to the flow, the names and the decisions you find. Do not prescribe a pattern, library or layer because it appears here.

The sections do not claim these capabilities exist in Conexus. The rules and decisions live in this repository's guides and decision records; this file makes no rule; for Mastra, follow the `mastra` skill. Explain the solution you found, its limits included, instead of silently redesigning it.

## 01. Architecture and modules

**When:** responsibilities, files or dependencies are created or reorganized.

**Terms:** cohesion, coupling, module boundaries, ownership of state, separation of effects.

**Questions:** "Which responsibility belongs to each module, and why?"; "Who keeps the state, and which parts only read or derive it?"

**Show:** the main interfaces, the direction of dependencies and one flow between modules. A folder tree or smaller files, alone, do not explain the split.

## 02. Types, functions and states

**When:** identifiers, variants, functions, unions or outside data are at the center of the change.

**Terms:** discriminated union, exhaustiveness, branded identifiers, derived types, validation at the boundary.

**Questions:** "Which states and results do the types represent, and which invalid combinations do they prevent?"; "Where is outside data validated, and how does it reach the functions?"

**Show:** representative types and signatures, where reused types come from, and one valid and one invalid case. `unknown` can be right before validation; `as` and branded identifiers neither validate data nor grant access.

## 03. API, backend and failures

**When:** routes, operations, responses or error handling change.

**Terms:** API contract, schema, use case, transport format, failure vocabulary.

**Questions:** "What belongs to the HTTP adapter and what belongs to the operation?"; "How do input, output and errors stay compatible between client and server?"

**Show:** the contract and the flow of one call, an error included; the source of the types, the validation and the mappings needed. Read the current source of the failure codes, without making a parallel catalogue.

## 04. Database and migrations

**When:** persistence, tables, queries or the evolution of data are affected.

**Terms:** keys, cardinality, integrity, constraints, transaction, isolation, migration.

**Questions:** "How do the relations represent the problem, and which rules does the database guarantee?"; "What happens if two operations contend for the row, or the change stops halfway?"

**Show:** representative schema or SQL, the transaction boundary and the effect on existing data. A PostgreSQL transaction does not make a remote effect atomic; rolling back code does not undo a migration.

## 05. Jobs, cleanup and lifecycle

**When:** timers, periodic work, sessions, build machines or the release of resources change.

**Terms:** runner, reaper, ownership of resources, overlap, idempotence, reconciliation, graceful shutdown.

**Questions:** "Who schedules, runs and decides what may be removed?"; "What stops an old cleanup from hitting a resource in use, and how does active work end at shutdown?"

**Show:** interfaces, how long resources live, and the sequence under a retry or an interruption. Tell stopping the timer from waiting for the active task. Explain claim, lease or fencing only when the solution or the risk makes them relevant.

## 06. Events and asynchronous communication

**When:** parts talk without an immediate answer, or work must outlive the process.

**Terms:** command, event, job, delivery semantics, ordering, deduplication, outbox.

**Questions:** "Does this ask for an action or record a fact, and who publishes and consumes it?"; "How does the consumer stay correct under a repeat, a delay or a failure between the write and the publish?"

**Show:** the payload, the delivery flow and the expected result after a failure. Do not confuse deduplicating the message with an idempotent effect, and do not promise a single execution without bounding the guarantee.

## 07. Mastra and the agent's run

**When:** agents, tools, memory, session, thread, run, streaming or storage are involved.

**Terms:** native capability, public API, extension point, ownership of state, RequestContext, tracing, evals.

**Questions:** "What does the installed version already offer, and why must Conexus add this mechanism?"; "Who keeps each state, for how long, and what really resumes after an interruption?"

**Show:** the API and types read, the version, and the split of responsibilities. Confirm the meaning of session, thread and run in that version. Tell persisted history from a resumable run, and an evaluation of the agent from a deterministic test of the platform.

## 08. Runtime, access and secrets

**When:** generated code, permissions, credentials or execution limits cross components.

**Terms:** trust boundary, authentication, authorization, scope, isolation, custody of secrets, admission.

**Questions:** "Where do identity and scope come from, and where is the action authorized?"; "Which resources can this code reach, and who stops it from reaching the others?"

**Show:** allowed and refused paths, where the rule is enforced, and the reach of credentials. Use names and flows, never secret values. A separate process, a validated type or a hidden button proves neither authorization nor isolation.

## 09. Screens and screen state

**When:** components, forms, cache, polling or streaming change.

**Terms:** composition, props, hooks, local and remote state, derived state, query keys, invalidation, accessibility.

**Questions:** "Who keeps each piece of information, and what does the screen only derive?"; "How does a change, a late answer or a reconnection affect what the person sees?"

**Show:** the flow of state, the components' interfaces and the states that matter: loading, empty, error or access refused. Bring in keyboard, focus and the design system when the interaction changes; do not turn every explanation into a visual review.

## 10. Tests, refactoring and review

**When:** the structure changes, or the reach of a guarantee must be understood.

**Terms:** preserved behaviour, impact of the change, regression, integration test, end-to-end test, fault injection.

**Questions:** "What changes inside, what stays the same for the person, and what stops existing?"; "Which behaviour do the tests protect, and which failure would make them report the problem?"

**Show:** an example before and after, the affected consumers, and each acceptance criterion with its test and observed result: proved, proved with a double, or not proved. Tell planned tests from present tests and observed results; say what is faked. This skill does not run changes to obtain an approval.

## 11. SDK, packages and extensibility

**When:** apps gain a reusable API, a library or a managed capability.

**Terms:** public API, generated contract, developer experience, dependencies, compatibility, admission.

**Questions:** "What does the app receive ready, and what stays the runtime's responsibility?"; "Why does this integration need an abstraction of its own, and how does an update affect its consumers?"

**Show:** the smallest use of the API, where the contracts come from and what the environment requires. Making a QR code and managing documents with access and persistence are different needs; do not turn every library into a platform service.

## 12. Observability, performance and publishing

**When:** diagnostics, performance, configuration, releases or recovery are affected.

**Terms:** logs, traces, metrics, audit, profiling, immutable release, compatibility, restore.

**Questions:** "How do you follow a run and find the cause of a failure?"; "How do publishing and recovery keep data, permissions and compatibility?"

**Show:** the diagnostic path and the artifact or configuration that matters, with no sensitive data. Tell an expectation from a measurement, a backup taken from a restore shown, and a live process from a ready service. Do not claim better performance from the shape of the code alone.
