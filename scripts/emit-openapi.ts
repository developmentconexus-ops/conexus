// Defect: the OpenAPI document is written by hand or drifts from the Zod operations, or an
// operation's schema cannot be converted and nobody notices (code C28, C29).
// The document is emitted from every operation `@conexus/hub-api` exports through
// `defineOperation`, never committed; an export that did not pass through it is not emitted:
// `npm run openapi [-- out.json]` prints it or writes it. An operation's schema that `z.toJSONSchema`
// cannot express (a `z.date()`, for one) stops the command with the operation's id and exit code 1;
// a transform under `io: 'input'` converts without error and is not refused.
// A success body is `application/json`; a failure is a Problem under `application/problem+json`,
// the type the Hub sends (apps/server/src/platform/http.ts). An operation's failures are its own
// and the platform's (`failuresOf`). A real Hub's success (`getHealth`) and its 401, 403, 413, 415
// and 400 refusals are checked against the document through `app.inject`, no socket, by
// apps/server/src/openapi-contract.test.ts.
// Each operation's access is its `security`: `session` requires the cookie session, every other
// access (`public`, `entry`, `page`) carries `security: []`. The body limit
// (`bodyLimit`) is not emitted: OpenAPI 3.1 has no field for it and an `x-` extension would be
// invented. Revalidation date: the Zod row of docs/reference/boundaries.md.
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import type { Operation } from '@conexus/hub-api'
import * as api from '@conexus/hub-api'
import {
  ATTEMPT_KEY_HEADER,
  AttemptKey,
  FAILURES,
  failuresOf,
  isDeclaredOperation,
  LAST_EVENT_ID_HEADER,
  PROBLEM_MEDIA_TYPE,
  Problem,
  SESSION_COOKIE,
} from '@conexus/hub-api'
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

// An event stream is `text/event-stream`, each `data:` line one event of its schema.
function contentOf(success: Operation['success']): Json {
  if ('body' in success) {
    return { content: { 'application/json': { schema: schema(success.body, 'output') } } }
  }
  if ('events' in success) {
    return { content: { 'text/event-stream': { schema: schema(success.events, 'output') } } }
  }
  return {}
}

function responses(operation: Operation): Json {
  const { success } = operation
  const out: Json = {
    [success.status]: { description: operation.summary, ...contentOf(success) },
  }
  const byStatus = Object.groupBy(failuresOf(operation), (code) => FAILURES[code].status)
  for (const [status, codes] of Object.entries(byStatus)) {
    out[status] = {
      description: (codes ?? []).join(', '),
      content: {
        [PROBLEM_MEDIA_TYPE]: { schema: { $ref: '#/components/schemas/Problem' } },
      },
    }
  }
  return out
}

export function operations(exported: object = api): Operation[] {
  return Object.values(exported).flatMap((value) => (isDeclaredOperation(value) ? [value] : []))
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
      ...('events' in operation.success && operation.success.resumable
        ? [
            {
              name: LAST_EVENT_ID_HEADER,
              in: 'header',
              required: false,
              schema: { type: 'string' },
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
