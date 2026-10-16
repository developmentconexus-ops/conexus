export function option(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index === -1 ? undefined : process.argv[index + 1]
}

export const STEP_CARD = /^e\d+(?:\.\d+)?-.*\.md$/
