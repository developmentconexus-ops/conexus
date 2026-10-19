// The contract between the platform and a Projeto's app, version 1 (decision 0019).

export type { Db, DbResult, Row, Statement } from './db.ts'
export { APP_CALL_LIMITS, APP_COMPATIBILITY_DATE, APP_LIMITS } from './limits.ts'
export { ASSETS_FOLDER, FilePath, Manifest, Shape, versionFiles } from './manifest.ts'
export type { AppProps, Caller } from './props.ts'
export { type Handler, serveApp } from './runtime.ts'
