import { z } from 'zod'
import { Secret } from './secret.ts'

/** The installation's app's id at an OAuth provider: public, sent in the authorization address. */
const ConnectorClientId = z.string().min(1).brand('ConnectorClientId')
type ConnectorClientId = z.infer<typeof ConnectorClientId>

/** The installation's app at an OAuth provider (W1): the Client Secret prints as its name only. */
export type ConnectorApp = Readonly<{
  clientId: ConnectorClientId
  clientSecret: Secret<'ConnectorAppSecret'>
}>

/**
 * The installation's apps, by connector id, from one file (S31): JSON
 * `{ "<connector id>": { "clientId": "...", "clientSecret": "..." } }`, strict, at least one, no
 * empty value. Whether the kit has each connector, and an OAuth one, the connectors subject decides.
 */
export const ConnectorApps = {
  parse(text: string): ReadonlyMap<string, ConnectorApp> {
    const apps = z
      .record(
        z.string().regex(/^[a-z][a-z0-9-]{1,31}$/),
        z.strictObject({ clientId: ConnectorClientId, clientSecret: z.string().min(1) }),
      )
      .refine((all) => Object.keys(all).length > 0)
      .parse(JSON.parse(text))
    return new Map(
      Object.entries(apps).map(([id, app]) => [
        id,
        {
          clientId: app.clientId,
          clientSecret: new Secret('ConnectorAppSecret', app.clientSecret),
        },
      ]),
    )
  },
}
