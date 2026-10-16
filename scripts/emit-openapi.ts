// Defect: the OpenAPI document is written by hand or drifts from the Zod operations, or an
// operation's schema cannot be converted and nobody notices (code C28, C29).
// The document is emitted from every operation `@conexus/hub-api` exports, never committed:
// `npm run openapi [-- out.json]` prints it or writes it, and fails when a schema has no JSON form.
// Revalidate by 2027-04-13, or when Zod changes `z.toJSONSchema` or the Operation type gains a field.
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import type { Operation } from '@conexus/hub-api'
import * as api from '@conexus/hub-api'
import { FAILURES, Problem } from '@conexus/hub-api'
import { z } from 'zod'

type Json = Record<string, unknown>

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

export function emitOpenApi(): Json {
  const paths: Record<string, Json> = {}
  for (const operation of operations()) {
    const { params, query, body } = operation.input ?? {}
    paths[operation.path] = {
      ...paths[operation.path],
      [operation.method.toLowerCase()]: {
        operationId: operation.id,
        summary: operation.summary,
        parameters: [
          ...parameters('path', params),
          ...parameters('query', query),
          ...(operation.attemptKey
            ? [
                {
                  name: 'Idempotency-Key',
                  in: 'header',
                  required: true,
                  schema: { type: 'string', format: 'uuid' },
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
      },
    }
  }
  return {
    openapi: '3.1.0',
    info: { title: 'Conexus Hub', version: '0.0.0' },
    paths,
    components: { schemas: { Problem: schema(Problem, 'output') } },
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const text = `${JSON.stringify(emitOpenApi(), null, 2)}\n`
  const out = process.argv[2]
  if (out) writeFileSync(out, text)
  else process.stdout.write(text)
}
