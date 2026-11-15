import { listRead } from './shared.ts'

export const negocios = listRead({
  id: 'negocios',
  object: 'deals',
  subject: 'negocios',
  summary:
    'Lista os negócios do HubSpot (nome, etapa, funil, valor e datas), uma página de até 100 por chamada; `after` traz a página seguinte, devolvida em `seguinte`.',
  label: 'Negócios',
  properties: [
    'dealname',
    'dealstage',
    'pipeline',
    'amount',
    'closedate',
    'createdate',
    'hs_lastmodifieddate',
  ],
})
