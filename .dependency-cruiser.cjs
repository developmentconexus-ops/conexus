// The import law of code C3 to C8, data D19, testing T5 and web W1, W4 to W7, W13. Every rule below names
// the guide rule it enforces; scripts/rules.test.ts plants one bad file per rule.
// A subject is one folder of hub/, harness/ or agents/ on the server, and one folder of hub/, harness/ or agents/ on the web. Revalidate by 2027-04-13.
const { readdirSync } = require('node:fs')
const { join } = require('node:path')
const SERVER = '^apps/server/src'
const WEB = '^apps/web/src'
// The helpers a web test shares are the files named test-*, in any folder of the web: they drive a subject's inside, and a test of another subject reads them (T5).
const WEB_TEST_HELPER = `${WEB}/.*/test-[^/]+\\.tsx?$`
// The door of a subject is the public.ts at its root, or a public-<name>.tsx there (Node strips no types from .tsx, so public.ts cannot re-export one); a file deeper in is the inside (C4).
const PUBLIC_DOOR = '(^|/)(hub|builder|harness|agents)/[^/]+/public(-[a-z]+\\.tsx|\\.ts)$'
// The door of a subject's tables: only a tables.ts (a foreign key) imports it (C8).
const TABLE_DOOR = '(^|/)(hub|builder|harness|agents)/[^/]+/public-tables\\.ts$'
// The helpers a test shares are the files named test-*.ts, in any folder of the server (T5).
const TEST_HELPER = `${SERVER}/.*/test-[^/]+\\.ts$`
const MASTRA_EE = 'node_modules/@mastra/(core/dist/(agent-builder|auth)/ee|editor)'
const DRIVER_MODULES = `${SERVER}/platform/(database|migrate|test-database|test-mastra-database)\\.ts$`
// The access contract (founder's decision 2A, 2026-11-14): the agents and the apps reach the data
// only through packages/hub-api/src/company-data.ts. Data is the data track's code; the agents and
// the apps are the conversations, their tool adapters and the app packages.
const DATA = `^(${SERVER}/hub/(connectors|copies|ontology|data)/|packages/connectors/)`
const AGENTS_AND_APPS = `^(${SERVER}/(agents/(assistant|agent-builder|saved-agent|app-builder/(?!runs/|git/))|harness/(spec|turn|memory|prompt|routes|tools)/)|packages/app(-contract)?/)`
// C56: each SDK of a provider only in its adapter.
const ADAPTERS = require('./.dependency-cruiser-adapters.cjs')
// The connectors the kit holds: each folder of packages/connectors/src but the kernel.
const CONNECTORS = readdirSync(join(__dirname, 'packages/connectors/src'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== 'kernel')
  .map((entry) => entry.name)
const CONTRACT_MIGRATION = require('./.dependency-cruiser-migration.cjs')
  .map((file) => `${SERVER}/${file}\\.ts$`)
  .concat('^packages/app/src/connectors\\.ts$')

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'C6: there must not be an import cycle.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-loose-file-in-hub-or-builder',
      comment: 'C6: a file in hub/, builder/, harness/ or agents/ belongs to a subject folder.',
      severity: 'error',
      from: { path: `${SERVER}/(hub|builder|harness|agents)/[^/]+\\.tsx?$` },
      to: {},
    },
    {
      name: 'subject-only-through-public',
      comment:
        'C4, W4: another subject is reached only through its public.ts. A server test is held by T5 below, which also lets it use the test Hub.',
      severity: 'error',
      from: {
        path: `^apps/(server|web)/src/(hub|builder|harness|agents)/([^/]+)/`,
        pathNot: [`${SERVER}/.*\\.test\\.tsx?$`, TEST_HELPER, WEB_TEST_HELPER],
      },
      to: {
        path: `^apps/$1/src/(hub|builder|harness|agents)/[^/]+/`,
        pathNot: [`^apps/$1/src/$2/$3/`, PUBLIC_DOOR, TABLE_DOOR, WEB_TEST_HELPER],
      },
    },
    {
      name: 'conversations-do-not-import-the-assistant',
      comment:
        'C4: what the conversations share lives in harness/spec/; the agents and the Construtor never import the Assistant. Their tests borrow its test doubles.',
      severity: 'error',
      from: {
        path: `${SERVER}/agents/(saved-agent|agent-builder)/`,
        pathNot: [`${SERVER}/.*\\.test\\.tsx?$`, TEST_HELPER],
      },
      to: { path: `${SERVER}/agents/assistant/` },
    },
    {
      name: 'agents-and-apps-reach-data-only-through-the-contract',
      comment:
        'Decision 2A: the agents and the apps import nothing of the data but the access contract in @conexus/hub-api; CONTRACT_MIGRATION lists the files still to move. Their tests drive the test Hub (T5).',
      severity: 'error',
      from: {
        path: AGENTS_AND_APPS,
        pathNot: [`${SERVER}/.*\\.test\\.tsx?$`, TEST_HELPER, ...CONTRACT_MIGRATION],
      },
      to: { path: DATA },
    },
    {
      name: 'access-reaches-no-owner',
      comment:
        'The access door reads the owners through the ports main.ts hands it (AccessSources), never by import.',
      severity: 'error',
      from: {
        path: `${SERVER}/hub/access/`,
        pathNot: [`${SERVER}/.*\\.test\\.tsx?$`, TEST_HELPER],
      },
      to: { path: `${SERVER}/hub/(connectors|copies|data)/` },
    },
    {
      name: 'describe-lists-only-through-access',
      comment:
        'hub/data/catalog.ts imports nothing of hub/connectors or hub/copies, the path issue 1138 took; that it reads only the access door is held by catalogOf taking only access and log.',
      severity: 'error',
      from: { path: `${SERVER}/hub/data/catalog\\.ts$` },
      to: { path: `${SERVER}/hub/(connectors|copies)/` },
    },
    {
      name: 'data-read-only-through-the-recorder',
      comment:
        'The one writer of data.data_read is hub/data/record.ts: no other file imports the table, so no read leaves a row any other way.',
      severity: 'error',
      from: { pathNot: [`${SERVER}/hub/data/record\\.ts$`, `${SERVER}/hub/data/tables\\.ts$`] },
      to: { path: `${SERVER}/hub/data/tables\\.ts$` },
    },
    {
      name: 'server-root-only-through-public',
      comment:
        'C4: main.ts, conversations-of.ts and first-person-arguments.ts, at the root of the server, reach a subject only through its public.ts.',
      severity: 'error',
      from: { path: `${SERVER}/[^/]+\\.tsx?$`, pathNot: `${SERVER}/.*\\.test\\.tsx?$` },
      to: { path: `${SERVER}/(hub|builder|harness|agents)/`, pathNot: PUBLIC_DOOR },
    },
    {
      name: 'table-door-only-for-foreign-keys-and-schema',
      comment:
        "C8: a module does not import another owner's table object; the tables leave by public-tables.ts, which only a tables.ts (a foreign key) imports; the schema gatherer reads every tables.ts by its glob.",
      severity: 'error',
      from: { pathNot: '(^|/)tables\\.ts$' },
      to: { path: TABLE_DOOR },
    },
    {
      name: 'hub-does-not-import-builder',
      comment:
        'C4, W4: the Hub never imports the Builder (the server) nor harness/ and agents/ (the web); main.ts hands it over.',
      severity: 'error',
      from: { path: '^apps/(server|web)/src/hub/' },
      to: { path: '^apps/$1/src/(builder|harness|agents)/' },
    },
    {
      name: 'platform-does-not-import-subject',
      comment: 'C7: platform/ holds no subject and imports none.',
      severity: 'error',
      from: { path: `${SERVER}/platform/` },
      // The test ports hand every test Hub the Builder's doubles (T14), as they hand it Neon's.
      to: {
        path: `${SERVER}/(hub|builder|harness|agents)/`,
        pathNot: `${SERVER}/agents/app-builder/runs/test-runs\\.ts$`,
      },
    },
    {
      name: 'program-imports-program-by-name',
      comment: 'C5: between programs, code imports by package name, never by path.',
      severity: 'error',
      from: { path: '^(apps|packages)/([^/]+)/' },
      to: { path: '^(apps|packages)/', pathNot: ['^$1/$2/'], dependencyTypes: ['local'] },
    },
    {
      name: 'test-enters-through-the-public-door',
      comment:
        'T5: a server test imports main.ts, a public.ts or the test database, never the inside.',
      severity: 'error',
      from: { path: `${SERVER}/(?!platform/).*\\.test\\.tsx?$` },
      to: { path: `${SERVER}/`, pathNot: [`${SERVER}/main\\.ts$`, PUBLIC_DOOR, TEST_HELPER] },
    },
    {
      name: 'platform-test-enters-through-its-own-file',
      comment:
        'T5: a platform test imports main.ts, a public.ts, the test database or the file beside it.',
      severity: 'error',
      from: { path: `${SERVER}/platform/([^/]+)\\.test\\.tsx?$` },
      to: {
        path: `${SERVER}/`,
        pathNot: [
          `${SERVER}/main\\.ts$`,
          PUBLIC_DOOR,
          TEST_HELPER,
          `${SERVER}/platform/$1\\.tsx?$`,
        ],
      },
    },
    {
      name: 'driver-only-in-the-database-modules',
      comment:
        'D19: only database.ts, migrate.ts and the test databases import the PostgreSQL driver.',
      severity: 'error',
      from: { pathNot: DRIVER_MODULES },
      to: { path: '(^|node_modules/)(pg|drizzle-orm/node-postgres)(/|$)' },
    },
    ...ADAPTERS,
    {
      name: 'mastra-only-in-harness',
      comment:
        'W7, decision 0033: @mastra/* is imported only inside harness/ and agents/ on the server and inside harness/ on the web.',
      severity: 'error',
      from: {
        path: '^apps/(server|web)/src/',
        pathNot: '^apps/(server/src/(harness|agents)|web/src/harness)/',
      },
      to: { path: '(^|node_modules/)@mastra/' },
    },
    {
      name: 'no-mastra-ee',
      comment:
        "Mastra's ee code runs in development without a key and fails its license only in production (M:LICENSE.md:3-9, M:ee/LICENSE:1-5): nothing imports it. L20.",
      severity: 'error',
      from: {},
      to: {
        path: `(^|/)${MASTRA_EE}(/|$)|^@mastra/(core/(agent-builder|auth)/ee|editor)(/|$)`,
      },
    },
    {
      name: 'connectors-kit-stands-alone',
      comment:
        'The connector kit knows no Hub, no other program and no driver, so it can leave (K1).',
      severity: 'error',
      from: { path: '^packages/connectors/' },
      to: {
        path: ['^(apps|packages)/', '(^|node_modules/)(pg|drizzle-orm|fastify|@mastra)(/|$)'],
        pathNot: '^packages/connectors/',
      },
    },
    {
      name: 'connectors-kit-only-in-the-executor',
      comment: 'Only the Hub subject that opens a credential uses the kit (security S36).',
      severity: 'error',
      // tests/ for the local Hub's double (tests/e2e/live-hub.ts) and the QA; packages/app/src/ by the next two rules.
      from: {
        pathNot: [
          '^packages/connectors/',
          '^apps/server/src/hub/connectors/',
          '^tests/',
          '^packages/app/src/',
          // The extraction's adapter reads the kit's index (the next two rules).
          '^apps/extraction/',
          // The recorder runs the Sankhya double's order book under Mastra, to record what the library emits (testing T26).
          '^scripts/record',
        ],
      },
      to: { path: '^packages/connectors/' },
    },
    {
      name: 'adapter-reads-only-the-kit-index',
      comment:
        "Decision 0071: the extraction's adapter imports the kit through its index alone (@conexus/connectors), so it holds no line of one connector.",
      severity: 'error',
      from: { path: '^apps/extraction/' },
      to: { path: '^packages/connectors/', pathNot: '^packages/connectors/src/index\\.ts$' },
    },
    {
      name: 'adapter-names-no-connector',
      comment:
        "Decision 0071: the extraction's adapter names no connector, whatever the path of its import; the connectors are the folders of the kit.",
      severity: 'error',
      from: { path: '^apps/extraction/' },
      to: { path: `(^|/)(${CONNECTORS.join('|')})(/|\\.|$)` },
    },
    {
      name: 'app-reads-kit-types-only',
      comment:
        "An app's SDK takes only the kit's types, so no line of the kit runs in an app (security S36).",
      severity: 'error',
      from: { path: '^packages/app/' },
      to: { path: '^packages/connectors/', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'app-reads-only-the-kit-calls',
      comment:
        "An app's SDK reads the kit through its calls entry alone (@conexus/connectors/calls).",
      severity: 'error',
      from: { path: '^packages/app/' },
      to: { path: '^packages/connectors/', pathNot: '^packages/connectors/src/calls\\.ts$' },
    },
    {
      name: 'web-tree-shape',
      comment:
        'W1: apps/web/src holds main.tsx, the generated routeTree.gen.ts and the folders routes, hub, harness, agents, ui, platform, brand.',
      severity: 'error',
      from: {
        path: `${WEB}/(?!(main\\.tsx|routeTree\\.gen\\.ts|routes/|hub/|harness/|agents/|ui/|platform/|brand/))`,
      },
      to: {},
    },
    {
      name: 'web-support-does-not-import-subject',
      comment: 'W5, W13: ui/, platform/ and brand/ import no subject and no route.',
      severity: 'error',
      from: { path: `${WEB}/(ui|platform|brand)/` },
      to: { path: `${WEB}/(hub|harness|agents|routes)/` },
    },
    {
      name: 'ui-ai-takes-ready-data',
      comment:
        "Criterion 21 of the front-end foundation card: a piece of ui/ai/ takes ready data, never the Hub's contract.",
      severity: 'error',
      from: { path: `${WEB}/ui/ai/` },
      to: { path: '(^|node_modules/|/)@conexus/hub-api(/|$)|^packages/hub-api/' },
    },
    {
      name: 'routes-reach-subject-through-public',
      comment: 'W6: routes/ reaches a subject only through its public.ts.',
      severity: 'error',
      from: { path: `${WEB}/routes/` },
      to: { path: `${WEB}/(hub|harness|agents)/`, pathNot: PUBLIC_DOOR },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types'],
    },
    // Packages stay out of the graph except Mastra's, each a leaf (doNotFollow), so mastra-only-in-harness and no-mastra-ee see an import that resolves.
    // .lab/ is a builder's scratch folder, listed in .gitignore: git does not hold it, so it stays out here too (check-suppressions reads git's list).
    exclude: { path: '^(?!.*node_modules/@mastra/).*(^|/)(node_modules|dist|coverage)/|^\\.lab/' },
  },
}
