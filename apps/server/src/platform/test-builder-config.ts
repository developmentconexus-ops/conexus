import { randomBytes } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Config } from './config.ts'
import { GitCopyBucket, GitCopyKey } from './config-git.ts'
import { E2bApiKey, InstallationId, MachineTemplate } from './config-machine.ts'
import type { DatabaseUrl } from './database.ts'

/**
 * The folder a test database's Hub keeps its Git and machine in. It is named by the database, which
 * a test makes and drops, so the one that drops the database removes the folder (T20).
 */
export function testGitRoot(databaseUrl: DatabaseUrl): string {
  return join(tmpdir(), `conexus-git-${new URL(databaseUrl.reveal()).pathname.slice(1)}`)
}

/** The Git and build-machine part of a test Hub's configuration (decision 0051). */
export function testBuilderConfig(
  databaseUrl: DatabaseUrl,
): Pick<
  Config,
  'gitRoot' | 'gitCopyBucket' | 'gitCopyKey' | 'e2bApiKey' | 'machineTemplate' | 'installationId'
> {
  return {
    gitRoot: testGitRoot(databaseUrl),
    gitCopyBucket: GitCopyBucket.parse('conexus-test-git'),
    gitCopyKey: GitCopyKey.parse('TESTKEYID testsecret'),
    e2bApiKey: E2bApiKey.parse(randomBytes(16).toString('hex')),
    machineTemplate: MachineTemplate.parse('conexus-builder:test'),
    installationId: InstallationId.parse('testinstallation0'),
  }
}
