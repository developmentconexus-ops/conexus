import { readFileSync } from 'node:fs'
import { z } from 'zod'
import { clientCredentials } from '../kernel/auth.ts'
import { defineConnector } from '../kernel/definition.ts'
import { readSkill } from '../kernel/skill.ts'
import { sankhyaDoor } from './door.ts'
import { sankhyaOperations, sankhyaSubjects } from './operations/index.ts'

const SKILL = new URL('./skill/', import.meta.url)

// The official logo, from Sankhya's brand page ("Nossas Marcas", sankhya.com.br).
const LOGO = readFileSync(new URL('./logo.svg', import.meta.url), 'utf8')

const KEYS_GUIDE =
  'https://developer.sankhya.com.br/reference/guia-de-conversao-do-componente-de-integracao-appkey-oauth2'
const INTEGRATION_KEYS = {
  text: 'Gerado na Área do Desenvolvedor do Sankhya, no Componente de Integração (Gerar novas chaves).',
  url: KEYS_GUIDE,
} as const

export const sankhya = defineConnector({
  id: 'sankhya',
  name: 'Sankhya',
  version: '1.0.0',
  origin: 'https://api.sankhya.com.br',
  auth: clientCredentials({
    fields: {
      clientId: { label: 'Client ID', maxLength: 200, help: INTEGRATION_KEYS, visible: true },
      clientSecret: {
        label: 'Client Secret',
        maxLength: 200,
        help: INTEGRATION_KEYS,
        visible: false,
      },
      xToken: {
        label: 'X-Token',
        maxLength: 4096,
        help: {
          text: 'Gerado no Sankhya Om, na tela Configurações Gateway, para o usuário de integração.',
          url: 'https://developer.sankhya.com.br/reference/gerando-tokens-de-integração-no-sankhyaom',
        },
        visible: false,
      },
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
  account: { kind: 'none' }, // the documented login answer carries no account
  category: 'ERP',
  summary: 'O sistema de gestão da empresa: pedidos, estoque, financeiro e cadastros.',
  logo: LOGO,
  oneRequestAtATime: true, // a second call on the same token cancels the first (envelope "4")
  subjects: { porta: 'Porta de leitura', ...sankhyaSubjects },
  operations: sankhyaOperations,
  readDoor: sankhyaDoor,
  skill: readSkill(SKILL),
})
