import { readFileSync } from 'node:fs'
import { z } from 'zod'
import { clientCredentials } from '../kernel/auth.ts'
import { defineConnector } from '../kernel/definition.ts'
import { sankhyaDoor } from './door.ts'
import { sankhyaOperations } from './operations.ts'

export const sankhya = defineConnector({
  id: 'sankhya',
  name: 'Sankhya',
  version: '1.0.0',
  origin: 'https://api.sankhya.com.br',
  auth: clientCredentials({
    fields: {
      clientId: { label: 'Client ID', maxLength: 200 },
      clientSecret: { label: 'Client Secret', maxLength: 200 },
      xToken: { label: 'X-Token', maxLength: 4096 },
    },
    token: {
      path: '/authenticate',
      form: {
        client_id: { field: 'clientId' },
        client_secret: { field: 'clientSecret' },
        grant_type: { value: 'client_credentials' },
      },
      headers: { 'X-Token': { field: 'xToken' } },
    },
    answer: z
      .object({
        access_token: z.string().min(1).max(8192),
        expires_in: z.number().int().positive(),
      })
      .transform(({ access_token, expires_in }) => ({
        accessToken: access_token,
        expiresInSeconds: expires_in,
      })),
  }),
  oneRequestAtATime: true, // a second call on the same token cancels the first (envelope "4")
  operations: sankhyaOperations,
  readDoor: sankhyaDoor,
  skill: readFileSync(new URL('./skill/SKILL.md', import.meta.url), 'utf8'),
})
