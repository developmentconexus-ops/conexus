import { appendFileSync } from 'node:fs'

export type Flaky = { file: string; name: string }

export function reportFlaky(tests: Flaky[]): void {
  for (const test of tests) {
    console.log(
      `::warning title=Teste instável::${test.file} › ${test.name} passou só na segunda rodada`,
    )
  }
  const summary = process.env.GITHUB_STEP_SUMMARY
  if (summary !== undefined) {
    const rows = tests.map((test) => `| \`${test.file}\` | ${test.name.replaceAll('|', '\\|')} |`)
    appendFileSync(
      summary,
      [
        '### Testes instáveis: passaram só na segunda rodada',
        '',
        '| Arquivo | Teste |',
        '| --- | --- |',
        ...rows,
        '',
        '',
      ].join('\n'),
    )
  }
  const records = process.env.CONEXUS_FLAKY_FILE
  if (!records) return
  const job = process.env.GITHUB_JOB ?? ''
  for (const test of tests) appendFileSync(records, `${JSON.stringify({ ...test, job })}\n`)
}
