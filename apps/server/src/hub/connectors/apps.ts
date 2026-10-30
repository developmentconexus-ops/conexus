import type { AppKeys, Connector, ConnectorId, OAuth2CodeAuth } from '@conexus/connectors'
import type { ConnectorApp } from '../../platform/config.ts'
import { Failure } from '../../platform/failure.ts'

/** A connector the company links by a trip to the provider. */
export type OAuthConnector = Connector & Readonly<{ auth: OAuth2CodeAuth }>

export type ConnectorApps = ReadonlyMap<ConnectorId, ConnectorApp>

export function isOAuth(connector: Connector): connector is OAuthConnector {
  return connector.auth.kind === 'oauth2_code'
}

/** The one place that answers whose app a connection authorizes (W1): the installation's, or CONNECTOR_NOT_CONFIGURED. */
export function appKeysOf(apps: ConnectorApps, connector: OAuthConnector): AppKeys {
  const source = connector.auth.app.from
  switch (source) {
    case 'installation': {
      const app = apps.get(connector.id)
      if (app === undefined)
        throw new Failure('CONNECTOR_NOT_CONFIGURED', { details: { connector: connector.id } })
      return { clientId: app.clientId, clientSecret: app.clientSecret.reveal() }
    }
    default:
      return source satisfies never
  }
}
