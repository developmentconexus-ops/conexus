import type { DataReadEntry } from '@conexus/hub-api'
import { saveBlob } from '../../platform/download.ts'
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

function twoDigits(value: number): string {
  return String(value).padStart(2, '0')
}

/** An instant as RFC 3339 in the viewer's zone, with its offset: the zone the screen shows (founder, "2. A"). */
function localStamp(at: string): string {
  const date = new Date(at)
  const east = -date.getTimezoneOffset()
  const offset = `${east < 0 ? '-' : '+'}${twoDigits(Math.trunc(Math.abs(east) / 60))}:${twoDigits(Math.abs(east) % 60)}`
  const day = `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`
  const clock = [date.getHours(), date.getMinutes(), date.getSeconds()].map(twoDigits).join(':')
  return `${day}T${clock}${offset}`
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
 * The reads as a CSV file's text: one line each, in the table's columns, the hour in the viewer's
 * zone and the query whole. The byte-order mark makes a spreadsheet read the accents.
 */
export function readsCsv(reads: readonly DataReadEntry[], names: ReadNames): string {
  const lines = reads.map((read) => [
    localStamp(read.at),
    read.person.name,
    agentOf(read),
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

/** Saves the text as a CSV file. */
export function saveCsv(text: string, name: string): void {
  saveBlob(new Blob([text], { type: 'text/csv;charset=utf-8' }), name)
}
