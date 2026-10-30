import { parseArgs } from 'node:util'
import { Email } from '@conexus/hub-api'
import { z } from 'zod'
import { Failure } from './platform/failure.ts'

const FirstPersonArguments = z.object({
  name: z.string().trim().min(1),
  email: Email,
  summary: z.string().min(1),
})

export function firstPersonArguments(args: string[]) {
  const { values } = parseArgs({
    args,
    options: { name: { type: 'string' }, email: { type: 'string' }, summary: { type: 'string' } },
  })
  const parsed = FirstPersonArguments.safeParse(values)
  if (!parsed.success) {
    const variables = parsed.error.issues.map((issue) => `--${String(issue.path[0])}`).join(',')
    throw new Failure('CONFIG_INVALID', { details: { variables } })
  }
  return parsed.data
}
