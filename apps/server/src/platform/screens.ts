import { PAGES } from '@conexus/hub-api'
import type { FastifyInstance, FastifyReply } from 'fastify'
import { z } from 'zod'

const ONE_YEAR_MS = 31_536_000_000
const WildcardParams = z.object({ '*': z.string() })

/** The screens' page with the status; its router shows the person what the status means. */
export function sendPage(reply: FastifyReply, status: number) {
  return reply.code(status).sendFile('index.html', { maxAge: 0 })
}

/** The addresses the screens' router answers, and the files the page loads (web W1). */
export function installPages(app: FastifyInstance): void {
  const config = { access: 'page' } as const
  for (const page of PAGES) {
    app.route({
      method: ['GET', 'HEAD'],
      url: page.replaceAll(/\$(\w+)/g, ':$1'),
      config,
      handler: (_request, reply) => sendPage(reply, 200),
    })
  }
  app.route({
    method: ['GET', 'HEAD'],
    url: '/favicon.svg',
    config,
    handler: (_request, reply) => reply.sendFile('favicon.svg'),
  })
  app.route({
    method: ['GET', 'HEAD'],
    url: '/assets/*',
    config,
    handler: (request, reply) => {
      const { '*': file } = WildcardParams.parse(request.params)
      return reply.sendFile(`assets/${file}`, { maxAge: ONE_YEAR_MS, immutable: true })
    },
  })
}
