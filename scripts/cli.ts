/** The value after `--name` on the command line, or undefined. */
export function option(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index === -1 ? undefined : process.argv[index + 1]
}

/** The file name of a step card in docs/steps/. */
export const STEP_CARD = /^e\d+-.*\.md$/
