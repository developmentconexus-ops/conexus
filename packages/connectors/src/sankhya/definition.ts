import { readFileSync } from 'node:fs'
import { z } from 'zod'
import { clientCredentials } from '../kernel/auth.ts'
import { defineConnector } from '../kernel/definition.ts'
import { readSkill } from '../kernel/skill.ts'
import { sankhyaDoor } from './door.ts'
import { empresas } from './operations/cadastros.ts'
import { sankhyaOperations, sankhyaSubjects, sankhyaWrites } from './operations/index.ts'
import { refusals } from './refusals.ts'

const GATEWAY_SERVICE = '/gateway/v1/mge/service.sbr'

const DEVELOPER_AREA = {
  text: 'Gerado na Área do Desenvolvedor do Sankhya, no Componente de Integração (Gerar novas chaves).',
  url: 'https://developer.sankhya.com.br/reference/guia-de-conversao-do-componente-de-integracao-appkey-oauth2',
} as const

export const sankhya = defineConnector({
  id: 'sankhya',
  name: 'Sankhya',
  version: '1.0.0',
  origin: 'https://api.sankhya.com.br',
  auth: clientCredentials({
    credentialClass: 'SHAREABLE',
    fields: {
      clientId: { label: 'Client ID', maxLength: 200, help: DEVELOPER_AREA, visible: true },
      clientSecret: {
        label: 'Client Secret',
        maxLength: 200,
        help: DEVELOPER_AREA,
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
    // Ends the MGE session the login opened: idempotent, and refused (403) once the token expired.
    logout: {
      path: GATEWAY_SERVICE,
      query: { serviceName: 'MobileLoginSP.logout', outputType: 'json' },
      body: { serviceName: 'MobileLoginSP.logout', requestBody: {} },
      // A refused logout still answers 200, with the envelope "4" or a rule's status, never "1".
      ended: z.object({ status: z.literal('1') }),
    },
    answer: z
      .object({
        access_token: z.string().min(1).max(8192),
        expires_in: z.number().int().positive(),
      })
      .transform((token) => ({
        accessToken: token.access_token,
        expiresInSeconds: token.expires_in,
      })),
  }),
  account: { kind: 'none' }, // the documented login answer names no account
  category: 'ERP',
  summary: 'O sistema de gestão da empresa: pedidos, estoque, financeiro e cadastros.',
  // The official logo, from Sankhya's brand page ("Nossas Marcas", sankhya.com.br).
  logo: readFileSync(new URL('./logo.svg', import.meta.url), 'utf8'),
  numbers: 'EXACT', // the DbExplorer answers decimals as JSON numbers past a double's digits
  perProject: 'one', // a Projeto reads one Sankhya (founder, 2026-10-29)
  subjects: { porta: 'Porta de leitura', ...sankhyaSubjects },
  operations: sankhyaOperations,
  writes: sankhyaWrites,
  refusals,
  check: empresas,
  readDoor: sankhyaDoor,
  callLimit: { countedBy: 'ACCOUNT' },
  skill: { written: readSkill(new URL('./skill/', import.meta.url)) },
})
