// The contract between the platform and a Projeto's app, version 1 (decision 0019).

export { ConnectorAnswer, type Connectors } from './connectors.ts'
export type { Db, DbResult, Row, Statement } from './db.ts'
export { APP_FAILURE_CODES, type AppFailureCode } from './failures.ts'
export { APP_CALL_LIMITS, APP_COMPATIBILITY_DATE, APP_LIMITS } from './limits.ts'
export { ASSETS_FOLDER, FilePath, Manifest, RoleName, versionFiles } from './manifest.ts'
export { appContentSecurityPolicy, mediaTypeOf } from './page.ts'
export { type AppProps, type Caller, CallerAccess } from './props.ts'
export {
  type Context,
  type Handler,
  type OperationRoles,
  type Operations,
  type Roles,
  serveApp,
} from './runtime.ts'
