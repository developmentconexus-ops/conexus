import { readdirSync, readFileSync } from 'node:fs'
import { z } from 'zod'
import { clientCredentials } from '../kernel/auth.ts'
import { defineConnector } from '../kernel/definition.ts'
import { sankhyaDoor } from './door.ts'
import { sankhyaOperations, sankhyaSubjects } from './operations/index.ts'

const SKILL = new URL('./skill/', import.meta.url)

/** The skill as its folder holds it: `SKILL.md`, and each part of `references/` by file name. */
function readSkill() {
  const references = new URL('references/', SKILL)
  return {
    content: readFileSync(new URL('SKILL.md', SKILL), 'utf8'),
    references: Object.fromEntries(
      readdirSync(references)
        .sort()
        .map((name) => [name, readFileSync(new URL(name, references), 'utf8')]),
    ),
  }
}

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
  subjects: { porta: 'Porta de leitura', ...sankhyaSubjects },
  operations: sankhyaOperations,
  readDoor: sankhyaDoor,
  skill: readSkill(),
})
