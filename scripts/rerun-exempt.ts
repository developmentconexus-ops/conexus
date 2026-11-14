// Defect: a flake on a leak, refusal or isolation assertion is reported as green after a second run,
// and nobody investigates it as the defect it may be (testing T4).
// rerun-never.json is the one list of what never gets the second run: whole files of isolation and
// refusal, secrets and access, and the tests each removal row of scripts/removals.json names, as the protection the
// test proves (T10, T12, T13). A failed test is on it when its file is listed whole, or when its
// own name or the name of a suite around it matches a listed test of its file, read as a
// `--test-name-pattern` is. rerun-exempt.test.ts crosses the list with removals.json and with the
// repository's files and test names, so a protection, a file or a test about another company or
// another Project added without its entry fails there.
// CONEXUS_RERUN_NEVER names another list, for the tests of scripts/test-run.ts.
// Revalidate by 2027-05-14, or when scripts/removals.json changes shape.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'

const List = z.object({
  files: z.array(z.string()),
  tests: z.array(z.object({ file: z.string(), name: z.string() })),
})
export const NEVER_RERUN = List.parse(
  JSON.parse(
    readFileSync(
      process.env.CONEXUS_RERUN_NEVER ?? join(import.meta.dirname, 'rerun-never.json'),
      'utf8',
    ),
  ),
)

/** `file` is relative to the repository root; `names` run from the outermost suite to the failed test. */
export function neverRerun(failure: { file: string; names: string[] }): boolean {
  if (NEVER_RERUN.files.includes(failure.file)) return true
  return NEVER_RERUN.tests
    .filter((entry) => entry.file === failure.file)
    .some((entry) => failure.names.some((name) => new RegExp(entry.name).test(name)))
}
