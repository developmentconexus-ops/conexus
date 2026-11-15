import { listRead } from './shared.ts'

export const contatos = listRead({
  id: 'contatos',
  object: 'contacts',
  subject: 'contatos',
  summary:
    'Lista os contatos do HubSpot (nome, e-mail, telefone e datas), uma página de até 100 por chamada; `after` traz a página seguinte, devolvida em `seguinte`.',
  label: 'Contatos',
  properties: ['email', 'firstname', 'lastname', 'phone', 'createdate', 'lastmodifieddate'],
})
