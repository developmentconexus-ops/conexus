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

function generatedOf(connector: Connector): string {
  const writes = (connector.writes ?? []).length > 0 ? WRITES : READS_ONLY
  const subjects = Object.entries(connector.subjects).map(
    ([subject, label]) => `- ${label} (\`${subject}\`)`,
  )
  return ['## A ligação', '', writes, '', 'Os assuntos:', '', ...subjects].join('\n')
}

const FRONTMATTER = /^---\n[\s\S]*?\n---\n/

/** The skill the agents read: the written part's frontmatter, the part generated from the definition, then the written body. */
export function connectorSkill(connector: Connector): ConnectorSkill {
  const { content, references } = connector.skill.written
  const frontmatter = FRONTMATTER.exec(content)?.[0]
  if (frontmatter === undefined) throw new Error(`The skill of ${connector.id} has no frontmatter`)
  const body = content.slice(frontmatter.length).trimStart()
  return { content: `${frontmatter}\n${generatedOf(connector)}\n\n${body}`, references }
}
