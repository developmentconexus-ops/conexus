import { listRead } from './shared.ts'

export const empresas = listRead({
  id: 'empresas',
  object: 'companies',
  subject: 'empresas',
  summary:
    'Lista as empresas do HubSpot (nome, domínio, setor, cidade, estado, país, telefone, site e datas), uma página de até 100 por chamada; `after` traz a página seguinte, devolvida em `seguinte`.',
  label: 'Empresas',
  properties: [
    'name',
    'domain',
    'industry',
    'city',
    'state',
    'country',
    'phone',
    'website',
    'createdate',
    'hs_lastmodifieddate',
  ],
})
