import type { DataReadEntry } from '@conexus/hub-api'
import type { ReadNames } from './text.ts'
import { agentOf, placeOf, resultWord, whatOf } from './text.ts'

/**
 * A cell a spreadsheet would run as a formula starts with one of these; an apostrophe in front
 * keeps it text (OWASP, CSV injection).
 */
const FORMULA = /^[=+\-@\t\r]/
const QUOTED = /[",\r\n]/

/** One cell of RFC 4180: disarmed, then quoted when it holds a comma, a quote or a line break. */
function cellOf(value: string): string {
  const text = FORMULA.test(value) ? `'${value}` : value
  return QUOTED.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const HEADER = [
  'Quando',
  'Quem',
  'Agente',
  'Onde',
  'O que foi lido',
  'Resultado',
  'Código',
  'Linhas',
  'Tempo (ms)',
  'Consulta',
]

/**
 * The reads as a CSV file's text: one line each, in the table's columns, the hour as the Hub
 * wrote it (UTC) and the query whole. The byte-order mark makes a spreadsheet read the accents.
 */
export function readsCsv(reads: readonly DataReadEntry[], names: ReadNames): string {
  const lines = reads.map((read) => [
    read.at,
    read.person.name,
    agentOf(read, names),
    placeOf(read.project),
    whatOf(read, names),
    resultWord(read.outcome),
    read.outcome,
    read.rows === null ? '' : String(read.rows),
    String(read.ms),
    read.query ?? '',
  ])
  const text = [HEADER, ...lines].map((line) => line.map(cellOf).join(',')).join('\r\n')
  return `﻿${text}\r\n`
}

/** How long the file's address lives: Firefox reads the blob after the click returns. */
const REVOKE_AFTER_MS = 40_000

/** Saves the text as a file through a blob that an `<a download>` saves. */
export function saveCsv(text: string, name: string): void {
  const href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = href
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(href), REVOKE_AFTER_MS)
}
