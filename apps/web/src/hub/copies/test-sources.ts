import { ConnectorEntry } from '@conexus/hub-api'

const LOGO =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><rect width="28" height="28"/></svg>'
/** The catalog the connections list carries, which names each connector on the screens. */
export const CATALOG = [
  { id: 'sankhya', name: 'Sankhya', category: 'ERP', auth: 'client_credentials' },
  { id: 'mercado-livre', name: 'Mercado Livre', category: 'Marketplace', auth: 'oauth2_code' },
].map((one) =>
  ConnectorEntry.parse({
    ...one,
    version: '1.0.0',
    summary: 'Resumo.',
    logo: LOGO,
    subjects: [],
    fields: [],
  }),
)
