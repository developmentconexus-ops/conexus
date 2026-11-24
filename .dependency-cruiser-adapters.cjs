// Code C56: the SDK of each provider is imported only by its adapter. .dependency-cruiser.cjs spreads
// these rules into its own; scripts/rules.test.ts plants one bad file per rule.
const SERVER = '^apps/server/src'

module.exports = [
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
    name: 'aws-sdk-only-in-the-aws-adapter',
    comment:
      'C56, card o-lago-da-empresa-nasce-e-some: only platform/aws.ts imports the SDK of the lakes and its HTTP handler.',
    severity: 'error',
    from: { pathNot: `${SERVER}/platform/aws\\.ts$` },
    to: {
      path: '(^|node_modules/)(@aws-sdk/(client-cloudformation|client-s3tables|client-ecs|client-sqs|client-ssm|client-athena|credential-providers)|@smithy/node-http-handler)(/|$)',
    },
  },
]
