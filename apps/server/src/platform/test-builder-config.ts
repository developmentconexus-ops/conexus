import { randomBytes } from 'node:crypto'
import { tmpdir } from 'node:os'
import type { Config } from './config.ts'
import { GitCopyBucket, GitCopyKey } from './config-git.ts'
import { E2bApiKey, InstallationId, MachineTemplate } from './config-machine.ts'

/** The Git and build-machine part of a test Hub's configuration (decision 0051). */
export function testBuilderConfig(): Pick<
  Config,
  'gitRoot' | 'gitCopyBucket' | 'gitCopyKey' | 'e2bApiKey' | 'machineTemplate' | 'installationId'
> {
  return {
    gitRoot: tmpdir(),
    gitCopyBucket: GitCopyBucket.parse('conexus-test-git'),
    gitCopyKey: GitCopyKey.parse('TESTKEYID testsecret'),
    e2bApiKey: E2bApiKey.parse(randomBytes(16).toString('hex')),
    machineTemplate: MachineTemplate.parse('conexus-builder-test'),
    installationId: InstallationId.parse('testinstallation0'),
  }
}
