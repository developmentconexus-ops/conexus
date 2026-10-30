// What a Projeto's app receives from the platform (decision 0019, security S4). Everything here is
// visible to the app's code, so it carries only what the app may know.
import { z } from 'zod'
import type { Connectors } from './connectors.ts'
import type { Db } from './db.ts'
import { RoleName } from './manifest.ts'

/** Who calls the app: the person, the Projeto and how they hold the app, never an e-mail or a company. */
export type Caller = Readonly<{
  personId: string
  personName: string
  projectId: string
  projectName: string
  access: CallerAccess
}>

/** How the caller holds the app: a member builds it and holds every role (E1); a person given the app holds one, or none. */
export const CallerAccess = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('BUILDER') }),
  z.strictObject({ kind: z.literal('USER'), role: RoleName.nullable() }),
])
export type CallerAccess = Readonly<z.infer<typeof CallerAccess>>

/** The dispatcher's `props` to the app's Worker, which reads them as `ctx.props`. */
export type AppProps = Readonly<{ caller: Caller; db: Db; connectors: Connectors }>
