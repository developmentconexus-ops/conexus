import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

/**
 * Git hands its automatic maintenance to a daemon that outlives the command and writes into the
 * repository (`objects/maintenance.lock`) after the command returned, so a folder removed right
 * after the last command can still gain a file. The test world's git runs it in the foreground,
 * which the command waits for. `maintenance.autoDetach` falls back to this key.
 */
const KEY = 'gc.autoDetach'

/** For a `git` the test runs directly. It does not reach the remote side of a push. */
export const FOREGROUND = ['-c', `${KEY}=false`]

/** For the commands of a machine, which inherit only `PATH` from this process. */
// `spawn` types `env` as `NodeJS.ProcessEnv`, which the edge's generated declarations give required
// keys in the programs that include them; copying onto a bare object keeps the literal untyped there.
export const GIT_FOREGROUND_ENV: NodeJS.ProcessEnv = Object.assign(Object.create(null), {
  GIT_CONFIG_COUNT: '1',
  GIT_CONFIG_KEY_0: KEY,
  GIT_CONFIG_VALUE_0: 'false',
})

/** For the server's git, which runs with a fixed environment: the repository holds the setting. */
export function foregroundMaintenanceIn(bareRepository: string) {
  execFileSync('git', ['config', '--file', join(bareRepository, 'config'), KEY, 'false'])
}
