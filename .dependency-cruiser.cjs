// The import law of code C3 to C8, data D19, testing T5 and web W1, W4 to W7, W13. Every rule below names
// the guide rule it enforces; scripts/rules.test.ts plants one bad file per rule.
// A subject is one folder of hub/ or builder/ (server and web). Revalidate by 2027-04-13.
const SERVER = '^apps/server/src'
const WEB = '^apps/web/src'
const PUBLIC_DOOR = '(^|/)public\\.tsx?$'
const TEST_DATABASE = `${SERVER}/(platform/(test-database|test-neon|test-mail|test-hub-process|test-cloudflare|test-company-postgres|test-app-ports|test-cliproxy-binary|test-seal|test-mastra-database|test-anthropic|test-recordings)|hub/identity/test-hub|hub/apps/test-versions|hub/apps/test-handoff|builder/conversation/test-conversation|builder/conversation/test-defaults|builder/conversation/test-research|builder/machine/test-machine|builder/runs/test-runs)\\.ts$`
const DRIVER_MODULES = `${SERVER}/platform/(database|migrate|test-database|test-mastra-database)\\.ts$`

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
      comment: 'C6: a file in hub/ or builder/ belongs to a subject folder.',
      severity: 'error',
      from: { path: `${SERVER}/(hub|builder)/[^/]+\\.tsx?$` },
      to: {},
    },
    {
      name: 'subject-only-through-public',
      comment:
        'C4, W4: another subject is reached only through its public.ts. A server test is held by T5 below, which also lets it use the test Hub.',
      severity: 'error',
      from: {
        path: `^apps/(server|web)/src/(hub|builder)/([^/]+)/`,
        pathNot: [`${SERVER}/.*\\.test\\.tsx?$`, TEST_DATABASE],
      },
      to: {
        path: `^apps/$1/src/(hub|builder)/[^/]+/`,
        pathNot: [`^apps/$1/src/$2/$3/`, PUBLIC_DOOR],
      },
    },
    {
      name: 'hub-does-not-import-builder',
      comment: 'C4, W4: the Hub never imports the Builder; main.ts hands it over.',
      severity: 'error',
      from: { path: '^apps/(server|web)/src/hub/' },
      to: { path: '^apps/$1/src/builder/' },
    },
    {
      name: 'platform-does-not-import-subject',
      comment: 'C7: platform/ holds no subject and imports none.',
      severity: 'error',
      from: { path: `${SERVER}/platform/` },
      // The test ports hand every test Hub the Builder's doubles (T14), as they hand it Neon's.
      to: { path: `${SERVER}/(hub|builder)/`, pathNot: `${SERVER}/builder/runs/test-runs\\.ts$` },
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
      to: { path: `${SERVER}/`, pathNot: [`${SERVER}/main\\.ts$`, PUBLIC_DOOR, TEST_DATABASE] },
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
          TEST_DATABASE,
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
    {
      name: 'neon-sdk-only-in-the-neon-adapter',
      comment: 'C56: only neon.ts imports the Neon SDK.',
      severity: 'error',
      from: { pathNot: `${SERVER}/platform/neon\\.ts$` },
      to: { path: '(^|node_modules/)@neon/sdk(/|$)' },
    },
    {
      name: 'neon-http-driver-only-in-its-adapters',
      comment:
        "C56, decision 0043: only the Hub's company-postgres.ts and the dispatcher's db.ts import Neon's HTTP driver.",
      severity: 'error',
      from: {
        pathNot: `(${SERVER}/platform/company-postgres\\.ts|^apps/edge/src/db\\.ts)$`,
      },
      to: { path: '(^|node_modules/)@neondatabase/serverless(/|$)' },
    },
    {
      name: 'e2b-only-in-the-machine',
      comment:
        'C56, decision 0051: only builder/machine/ and the template in infra/e2b/ import the E2B SDK and its Mastra sandbox.',
      severity: 'error',
      from: { pathNot: [`${SERVER}/builder/machine/`, '^infra/e2b/'] },
      to: { path: '(^|node_modules/)(e2b|@mastra/e2b)(/|$)' },
    },
    {
      name: 's3-only-in-the-git-copy',
      comment: 'C56, decision 0051: only builder/git/copy/ imports the S3 client of the R2 bucket.',
      severity: 'error',
      from: { pathNot: `${SERVER}/builder/git/copy/` },
      to: { path: '(^|node_modules/)@aws-sdk/client-s3(/|$)' },
    },
    {
      name: 'mastra-only-in-builder',
      comment:
        'W7, decision 0033: @mastra/* is imported only inside builder/, on the server and the web.',
      severity: 'error',
      from: { pathNot: '^apps/(server|web)/src/builder/' },
      to: { path: '(^|node_modules/)@mastra/' },
    },
    {
      name: 'web-tree-shape',
      comment:
        'W1: apps/web/src holds main.tsx, the generated routeTree.gen.ts and the folders routes, hub, builder, ui, platform, brand.',
      severity: 'error',
      from: {
        path: `${WEB}/(?!(main\\.tsx|routeTree\\.gen\\.ts|routes/|hub/|builder/|ui/|platform/|brand/))`,
      },
      to: {},
    },
    {
      name: 'web-support-does-not-import-subject',
      comment: 'W5, W13: ui/, platform/ and brand/ import no subject and no route.',
      severity: 'error',
      from: { path: `${WEB}/(ui|platform|brand)/` },
      to: { path: `${WEB}/(hub|builder|routes)/` },
    },
    {
      name: 'routes-reach-subject-through-public',
      comment: 'W6: routes/ reaches a subject only through its public.ts.',
      severity: 'error',
      from: { path: `${WEB}/routes/` },
      to: { path: `${WEB}/(hub|builder)/`, pathNot: PUBLIC_DOOR },
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
    exclude: { path: '(^|/)(node_modules|dist|coverage)/' },
  },
}
