import { writeFileSync } from 'node:fs'
import { downloadSpec } from '../src/sankhya/spec-source.ts'

// Run by hand: `node packages/connectors/scripts/sankhya-spec.ts <output.json>`. It writes the cut of
// Sankhya's public documentation that the conformance check reads. The cut is Sankhya's ("Licença
// Sankhya"), so write it outside the repository and never commit it.
const output = process.argv[2]
if (!output) throw new Error('usage: node sankhya-spec.ts <output.json>')
writeFileSync(output, `${JSON.stringify(await downloadSpec())}\n`)
