import { readFileSync } from 'node:fs'
import { z } from 'zod'
import { defineConnector } from '../kernel/definition.ts'
import { oauth2Code, rfc6749Answer } from '../kernel/oauth.ts'
import { AccountRef } from '../kernel/operation.ts'
import { readSkill } from '../kernel/skill.ts'
import { conta } from './operations/conta.ts'
import { mercadoLivreOperations, mercadoLivreSubjects } from './operations/index.ts'

const Seller = z
  .object({
    id: z.union([z.string().min(1), z.number().int()]).transform(String),
    nickname: z.string().min(1),
  })
  .transform(({ id, nickname }) => ({
    ref: AccountRef.parse(id),
    label: nickname,
  }))

export const mercadoLivre = defineConnector({
  id: 'mercado-livre',
  name: 'Mercado Livre',
  version: '1.0.0',
  origin: 'https://api.mercadolibre.com',
  // The access key lasts 6 h; the refresh key 6 months, single use, only the last one counts; the
  // redirect address is fixed and https; the body goes in the form (autenticacao-e-autorizacao,
  // desenvolvimento-seguro). The scopes (read, offline access) are marked on the app, not here.
  auth: oauth2Code({
    credentialClass: 'EXCLUSIVE',
    app: { from: 'installation' },
    authorize: {
      url: 'https://auth.mercadolivre.com.br/authorization',
      pkce: 'S256',
      params: {},
    },
    token: { path: '/oauth/token' },
    revoke: { method: 'DELETE', path: '/users/{account}/applications/{app}' },
    answer: rfc6749Answer,
    refusals: {
      grant: ['invalid_grant', 'unauthorized_client'],
      app: ['invalid_client', 'unauthorized_application', 'invalid_scope'],
    },
  }),
  account: {
    kind: 'reported',
    exclusive: true,
    who: { path: '/users/me', answer: Seller },
  },
  category: 'Marketplace',
  summary: 'O marketplace onde a loja vende: anúncios, pedidos, envios, perguntas e reclamações.',
  logo: readFileSync(new URL('./logo.svg', import.meta.url), 'utf8'),
  numbers: 'EXACT',
  perProject: 'many',
  callLimit: { countedBy: 'APP' }, // "per Client ID (application)": one Conexus app serves every company
  subjects: mercadoLivreSubjects,
  operations: mercadoLivreOperations,
  check: conta,
  skill: { written: readSkill(new URL('./skill/', import.meta.url)) },
})
