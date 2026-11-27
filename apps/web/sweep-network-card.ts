import { ASSISTANT_CONTROLLER } from '@conexus/hub-api'
import { z } from 'zod'
import { recordedRun } from './src/harness/room/test-recorded.ts'
import { ASSISTANT_PATH, cardReplies } from './sweep-assistant-states.ts'
import type { State } from './sweep-kit.ts'
import { sessionReplies } from './sweep-session.ts'

const Events = z.array(z.unknown())

/** Mastra's recorded run up to the parked network request, asking for these domains instead. */
export function parkedNetworkReplies(domains: readonly string[]) {
  const { events } = recordedRun('network')
  const parked = events.findIndex((event) => event.type === 'agent_end')
  const asked = JSON.stringify(events.slice(0, parked + 1))
  const named = domains.map((domain) => JSON.stringify(domain)).join()
  const conversation = ASSISTANT_PATH.split('/').at(-1) ?? ''
  return {
    ...cardReplies(null, []),
    ...sessionReplies(conversation, {
      controller: ASSISTANT_CONTROLLER,
      events: Events.parse(JSON.parse(asked.replaceAll('"loja.example.com"', named))),
    }),
  }
}

export const NETWORK_CARD_STATES: State[] = [
  {
    name: 'Assistente, o pedido de acesso à internet aberto',
    path: ASSISTANT_PATH,
    replies: parkedNetworkReplies(['catalogo-de-produtos-da-distribuidora.loja.exemplo.com.br']),
    settle: (page) => page.getByRole('button', { name: 'Liberar para a empresa' }).waitFor(),
  },
]
