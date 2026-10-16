// Defect: the OpenAPI document is written by hand or drifts from the Zod operations, or an
// operation's schema cannot be converted and nobody notices (code C28, C29).
// The document is emitted from every operation `@conexus/hub-api` exports, never committed:
// `npm run openapi [-- out.json]` prints it or writes it. An operation's schema that `z.toJSONSchema`
// cannot express (a `z.date()`, for one) stops the command with the operation's id and exit code 1;
// a transform under `io: 'input'` converts without error and is not refused.
// Each operation's access is its `security`: `session` requires the cookie session, `public` and
// `entry` carry `security: []`. `page` is no `/api/` operation and has none. The body limit
// (`bodyLimit`) is not emitted: OpenAPI 3.1 has no field for it and an `x-` extension would be
// invented. Revalidation date: the Zod row of docs/reference/boundaries.md.
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import type { Operation } from '@conexus/hub-api'
import * as api from '@conexus/hub-api'
import { ATTEMPT_KEY_HEADER, AttemptKey, FAILURES, Problem, SESSION_COOKIE } from '@conexus/hub-api'
import { z } from 'zod'

type Json = Record<string, unknown>

/** The scheme of the Hub's session cookie (security S17). */
const SESSION_SCHEME = 'cookieSession'

type JsonSchema = z.core.JSONSchema.BaseSchema

function schema(type: z.ZodType, io: 'input' | 'output'): JsonSchema {
  const { $schema: _, ...rest } = z.toJSONSchema(type, { io })
  return rest
}

function parameters(where: 'path' | 'query', type: z.ZodType | undefined) {
  if (!type) return []
  const { properties = {}, required = [] } = schema(type, 'input')
  return Object.entries(properties).map(([name, property]) => ({
    name,
    in: where,
    required: where === 'path' || required.includes(name),
    schema: property,
  }))
}

function responses(operation: Operation): Json {
  const { success } = operation
  const out: Json = {
    [success.status]:
      'body' in success
        ? {
            description: operation.summary,
            content: { 'application/json': { schema: schema(success.body, 'output') } },
          }
        : { description: operation.summary },
  }
  const byStatus = Object.groupBy(operation.failures, (code) => FAILURES[code].status)
  for (const [status, codes] of Object.entries(byStatus)) {
    out[status] = {
      description: (codes ?? []).join(', '),
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/Problem' } },
      },
    }
  }
  return out
}

function isOperation(value: unknown): value is Operation {
  return typeof value === 'object' && value !== null && 'id' in value && 'method' in value
}

export function operations(): Operation[] {
  return Object.values(api).flatMap((value) => (isOperation(value) ? [value] : []))
}

function operationItem(operation: Operation): Json {
  const { params, query, body } = operation.input ?? {}
  return {
    operationId: operation.id,
    summary: operation.summary,
    security: operation.access === 'session' ? [{ [SESSION_SCHEME]: [] }] : [],
    parameters: [
      ...parameters('path', params),
      ...parameters('query', query),
      ...(operation.attemptKey
        ? [
            {
              name: ATTEMPT_KEY_HEADER,
              in: 'header',
              required: true,
              schema: schema(AttemptKey, 'input'),
            },
          ]
        : []),
    ],
    ...(body && {
      requestBody: {
        required: true,
        content: { 'application/json': { schema: schema(body, 'input') } },
      },
    }),
    responses: responses(operation),
  }
}

export function emitOpenApi(list: readonly Operation[] = operations()): Json {
  const paths: Record<string, Json> = {}
  for (const operation of list) {
    try {
      paths[operation.path] = {
        ...paths[operation.path],
        [operation.method.toLowerCase()]: operationItem(operation),
      }
    } catch (error) {
      throw new Error(`${operation.id} has a schema with no JSON form`, { cause: error })
    }
  }
  return {
    openapi: '3.1.0',
    info: { title: 'Conexus Hub', version: '0.0.0' },
    paths,
    components: {
      schemas: { Problem: schema(Problem, 'output') },
      securitySchemes: { [SESSION_SCHEME]: { type: 'apiKey', in: 'cookie', name: SESSION_COOKIE } },
    },
  }
}

/** The `npm run openapi` command; a throw from the emitter is its exit code 1. */
export function emitCommand(args: string[], list: readonly Operation[] = operations()): void {
  const text = `${JSON.stringify(emitOpenApi(list), null, 2)}\n`
  const out = args[0]
  if (out) writeFileSync(out, text)
  else process.stdout.write(text)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  emitCommand(process.argv.slice(2))
}
