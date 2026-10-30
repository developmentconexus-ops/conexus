import { readFileSync } from 'node:fs'
import { z } from 'zod'
import { defineConnector } from '../kernel/definition.ts'
import { oauth2Code } from '../kernel/oauth.ts'
import { AccountRef } from '../kernel/operation.ts'
import { readSkill } from '../kernel/skill.ts'
import { mercadoLivreOperations, mercadoLivreSubjects } from './operations/index.ts'

const SKILL = new URL('./skill/', import.meta.url)

// The provider's official symbol, without the written name (founder, 2026-10-29).
const LOGO = readFileSync(new URL('./logo.svg', import.meta.url), 'utf8')

const Id = z.union([z.string().min(1), z.number().int()]).transform(String)

export const mercadoLivre = defineConnector({
  id: 'mercado-livre',
  name: 'Mercado Livre',
  version: '1.0.0',
  origin: 'https://api.mercadolibre.com',
  // The key lasts 6 h; the refresh key 6 months, single use, only the last one counts; the
  // redirect address is fixed and https; the body goes in the form (autenticacao-e-autorizacao,
  // desenvolvimento-seguro). The scopes (read, offline access) are marked on the app, not here.
  auth: oauth2Code({
    app: { from: 'installation' },
    authorize: { url: 'https://auth.mercadolivre.com.br/authorization', pkce: 'S256', params: {} },
    token: { path: '/oauth/token' },
    // Revoga a permissão do aplicativo para o usuário, with the seller's own bearer
    // (developers.mercadolivre.com.br/pt_br/gerenciamento-de-vendas/usuarios-e-aplicativos).
    revoke: { method: 'DELETE', path: '/users/{account}/applications/{app}' },
    answer: z
      .object({
        access_token: z.string().min(1).max(8192),
        refresh_token: z.string().min(1).max(8192).optional(),
        expires_in: z.number().int().positive(),
      })
      .transform(({ access_token, refresh_token, expires_in }) => ({
        accessToken: access_token,
        ...(refresh_token === undefined ? {} : { refreshToken: refresh_token }),
        expiresInSeconds: expires_in,
      })),
    refusals: {
      grant: ['invalid_grant', 'unauthorized_client'],
      app: ['invalid_client', 'unauthorized_application', 'invalid_scope'],
    },
  }),
  account: {
    kind: 'reported',
    exclusive: true,
    who: {
      path: '/users/me',
      answer: z
        .object({ id: Id, nickname: z.string().min(1) })
        .transform(({ id, nickname }) => ({ ref: AccountRef.parse(id), label: nickname })),
    },
  },
  category: 'Marketplace',
  summary: 'O marketplace onde a loja vende: anúncios, pedidos, envios, perguntas e reclamações.',
  logo: LOGO,
  perProject: 'many', // a Projeto may read several stores
  subjects: mercadoLivreSubjects,
  operations: mercadoLivreOperations,
  skill: readSkill(SKILL),
})
