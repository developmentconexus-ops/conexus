import { readdirSync, readFileSync } from 'node:fs'
import type { Connector, ConnectorSkill } from './definition.ts'

/** The skill as its folder holds it: `SKILL.md`, and each part of `references/` by file name. */
export function readSkill(folder: URL): ConnectorSkill {
  const references = new URL('references/', folder)
  return {
    content: readFileSync(new URL('SKILL.md', folder), 'utf8'),
    references: Object.fromEntries(
      readdirSync(references)
        .sort()
        .map((name) => [name, readFileSync(new URL(name, references), 'utf8')]),
    ),
  }
}

const WRITES = 'Esta ligação lê e escreve; cada escrita pede a aprovação de uma pessoa.'
const READS_ONLY = 'Esta ligação só lê.'

/** A table the connection copies, as the company named it in the lake; `since` is the start date, only on a table it limits. */
export type SkillTable = Readonly<{
  name: string
  label: string
  description: string
  source: string
  since: string | null
}>

const ONE_CONNECTION = 'Cada tabela traz só as linhas desta ligação.'

function tablesOf(tables: readonly SkillTable[]): readonly string[] {
  if (tables.length === 0) return []
  const lines = tables.map(({ name, label, description, source, since }) => {
    const from = since === null ? '' : ` Desde ${since}.`
    return `- \`${name}\`: ${label}. ${description} Origem: \`${source}\`.${from}`
  })
  return ['', 'As tabelas no lago:', '', ONE_CONNECTION, '', ...lines]
}

function generatedOf(connector: Connector, tables: readonly SkillTable[]): string {
  const writes = (connector.writes ?? []).length > 0 ? WRITES : READS_ONLY
  const subjects = Object.entries(connector.subjects).map(
    ([subject, label]) => `- ${label} (\`${subject}\`)`,
  )
  return [
    '## A ligação',
    '',
    writes,
    '',
    'Os assuntos:',
    '',
    ...subjects,
    ...tablesOf(tables),
  ].join('\n')
}

const FRONTMATTER = /^---\n[\s\S]*?\n---\n/

/** The skill the agents read: the written part's frontmatter, the part generated from the definition and the connection's tables, then the written body. */
export function connectorSkill(
  connector: Connector,
  tables: readonly SkillTable[],
): ConnectorSkill {
  const { content, references } = connector.skill.written
  const frontmatter = FRONTMATTER.exec(content)?.[0]
  if (frontmatter === undefined) throw new Error(`The skill of ${connector.id} has no frontmatter`)
  const body = content.slice(frontmatter.length).trimStart()
  return { content: `${frontmatter}\n${generatedOf(connector, tables)}\n\n${body}`, references }
}
