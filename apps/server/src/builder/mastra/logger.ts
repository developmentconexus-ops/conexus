import { MastraLogger } from '@mastra/core/logger'
import type { FailureLog, Scalar } from '../../platform/failure.ts'
import { causeChain } from '../../platform/failure.ts'

/**
 * The scalars of what Mastra logs with a message: the error's name, its provider status, its
 * system code and Mastra's own error id, along the cause chain (security S41).
 */
function fieldsOf(args: unknown[]): Record<string, Scalar> {
  const fields: Record<string, Scalar> = {}
  for (const arg of args) {
    const start: unknown = arg instanceof Error ? arg : Object(arg).error
    for (const found of causeChain(start)) {
      if (!(found instanceof Error)) break
      fields.name ??= found.name
      const status = Reflect.get(found, 'statusCode') ?? Reflect.get(found, 'status')
      if (typeof status === 'number') fields.status ??= status
      const code = Reflect.get(found, 'code')
      if (typeof code === 'string') fields.code ??= code
      const id = Reflect.get(found, 'id')
      if (typeof id === 'string') fields.mastra ??= id
    }
  }
  return fields
}

/**
 * Mastra's logger, made of the program's (code C50): its warnings and errors reach our log with
 * scalar fields only, never its message, which may carry a provider's answer or a person's text
 * (security S41). Its debug and info lines are dropped.
 */
export class BuilderLogger extends MastraLogger {
  readonly #log: FailureLog

  constructor(log: FailureLog) {
    super({ name: 'builder', level: 'warn' })
    this.#log = log
  }

  debug(): void {
    return
  }

  info(): void {
    return
  }

  warn(_message: string, ...args: unknown[]): void {
    this.#log.info({ source: 'mastra', ...fieldsOf(args) }, 'MASTRA_WARNING')
  }

  error(_message: string, ...args: unknown[]): void {
    this.#log.error({ source: 'mastra', ...fieldsOf(args) }, 'MASTRA_ERROR')
  }

  trackException(error: Error): void {
    this.#log.error({ source: 'mastra', ...fieldsOf([error]) }, 'MASTRA_ERROR')
  }
}
