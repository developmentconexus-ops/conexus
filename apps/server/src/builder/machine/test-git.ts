import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

/**
 * Git hands its automatic maintenance to a daemon that outlives the command and writes into the
 * repository (`objects/maintenance.lock`) after the command returned, so a folder removed right
 * after the last command can still gain a file. The test world's git runs it in the foreground,
 * which the command waits for.
 */
const SETTINGS = ['maintenance.autoDetach', 'gc.autoDetach'] as const

/** For a `git` the test runs directly. */
export const FOREGROUND = SETTINGS.flatMap((key) => ['-c', `${key}=false`])

/** For the commands of a machine, which inherit nothing from this process. */
export const GIT_FOREGROUND_ENV = {
  GIT_CONFIG_COUNT: String(SETTINGS.length),
  ...Object.fromEntries(
    SETTINGS.flatMap((key, index) => [
      [`GIT_CONFIG_KEY_${index}`, key],
      [`GIT_CONFIG_VALUE_${index}`, 'false'],
    ]),
  ),
}

/** For the server's git, which runs with a fixed environment: the repository holds the setting. */
export function foregroundMaintenanceIn(bareRepository: string) {
  for (const key of SETTINGS) {
    execFileSync('git', ['config', '--file', join(bareRepository, 'config'), key, 'false'])
  }
}
