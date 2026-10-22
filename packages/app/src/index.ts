// The SDK a Projeto's app is written with (decision 0055): operations in Zod, from which the
// handlers, the generated client and the manifest derive.

export { CallFailed, createApi, failureText } from './client.ts'
export { type ManifestRefused, manifestOf } from './manifest-of.ts'
export { defineOperations, type OperationSpec, type Operations } from './operations.ts'
export type { Result } from './result.ts'
export { DatabaseRefused, defineHandlers, query, Sqlstate, write } from './server.ts'
