// Builds the E2B template the Builder's machines start from (decisions 0051, 0055): Node 24 and git,
// the app folder, and in /opt/conexus the check program with its tools (TypeScript, esbuild,
// wrangler, Chromium's headless shell), the SDK it copies into each app, and an npm cache of the
// starter's packages. Firstmate runs it once, with the account's key in E2B_API_KEY (the SDK reads
// it), and writes the name it prints into HUB_E2B_TEMPLATE.
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { defaultBuildLogger, Template } from 'e2b'
import { z } from 'zod'

const NAME = 'conexus-builder'
const ROOT = resolve(import.meta.dirname, '../..')
const OPT = '/opt/conexus'
/** The npm cache: the user's to write, so a granted package joins the starter's ones (0055). */
const CACHE = `${OPT}/npm-cache`
const BROWSERS = `${OPT}/browsers`

const Versions = z.object({
  dependencies: z.record(z.string(), z.string()).optional(),
  devDependencies: z.record(z.string(), z.string()).optional(),
})

function versionOf(packageJson: string, name: string): string {
  const { dependencies, devDependencies } = Versions.parse(
    JSON.parse(readFileSync(join(ROOT, packageJson), 'utf8')),
  )
  const version = dependencies?.[name] ?? devDependencies?.[name]
  if (version === undefined) throw new Error(`${packageJson} names no ${name}`)
  return version
}

// The tools at the versions the repository tests the check with: wrangler is the edge's.
const TOOLS = JSON.stringify({
  private: true,
  workspaces: ['packages/*'],
  dependencies: { wrangler: versionOf('apps/edge/package.json', 'wrangler') },
})

// The program the server runs; the variables reach the browser and npm also when the check runs.
const CHECK = `#!/bin/sh
export PLAYWRIGHT_BROWSERS_PATH=${BROWSERS} npm_config_cache=${CACHE}
exec node ${OPT}/packages/app/src/check/main.ts --tools ${OPT}/node_modules --platform ${OPT}/packages "$@"
`

const template = Template({ fileContextPath: ROOT, fileIgnorePatterns: ['**/node_modules'] })
  .fromNodeImage('24')
  .aptInstall(['git'])
  .copy('packages/app', `${OPT}/packages/app`, { user: 'root' })
  .copy('packages/app-contract', `${OPT}/packages/app-contract`, { user: 'root' })
  .runCmd(
    [
      `printf '%s' '${TOOLS}' > ${OPT}/package.json`,
      `cd ${OPT} && npm install --omit=dev --no-audit --no-fund`,
      `cd ${OPT} && PLAYWRIGHT_BROWSERS_PATH=${BROWSERS} npx playwright-core install --with-deps chromium-headless-shell`,
      `printf '%s' '${CHECK}' > ${OPT}/check && chmod 755 ${OPT}/check`,
      `chmod -R a+rX,go-w ${OPT}`,
      `mkdir -p ${CACHE} /home/user/app && chown user:user ${CACHE} /home/user/app`,
    ],
    { user: 'root' },
  )
  .setEnvs({ npm_config_cache: CACHE, PLAYWRIGHT_BROWSERS_PATH: BROWSERS })
  // The cache is filled from the starter's own lockfile, the way the check installs (0055).
  .runCmd(
    [
      `cp -r ${OPT}/packages/app/starter /tmp/conexus-seed`,
      'cd /tmp/conexus-seed && npm ci --ignore-scripts --no-audit --no-fund',
      'rm -rf /tmp/conexus-seed',
    ],
    { user: 'user' },
  )
  .setWorkdir('/home/user/app')

const built = await Template.build(template, NAME, { onBuildLogs: defaultBuildLogger() })
console.log(built.name)
