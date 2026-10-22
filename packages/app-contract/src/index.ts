// The contract between the platform and a Projeto's app, version 1 (decision 0019).

export type { Db, DbResult, Row, Statement } from './db.ts'
export { APP_FAILURE_CODES, type AppFailureCode } from './failures.ts'
export { APP_CALL_LIMITS, APP_COMPATIBILITY_DATE, APP_LIMITS } from './limits.ts'
export {
  ASSETS_FOLDER,
  FilePath,
  Manifest,
  OperationName,
  Shape,
  versionFiles,
} from './manifest.ts'
export { APP_CONTENT_SECURITY_POLICY, mediaTypeOf } from './page.ts'
export type { AppProps, Caller } from './props.ts'
export { type Context, type Handler, serveApp } from './runtime.ts'
export { APP_SKILL } from './skill.ts'
