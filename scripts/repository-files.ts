import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { runCommand } from './command.ts'

/** The files a pull request of this tree would hold: git's list, so a build output or a scratch folder is not one; a tree with no git, by `walkTree`. */
export function repositoryFiles(root: string, walkTree: () => string[]): string[] {
  if (!existsSync(join(root, '.git'))) return walkTree()
  return runCommand('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    cwd: root,
  })
    .split('\0')
    .filter(Boolean)
    .map((file) => join(root, file))
    .filter((path) => existsSync(path))
}
