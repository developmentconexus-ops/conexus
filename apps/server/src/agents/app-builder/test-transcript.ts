import { messagesOf } from '../../harness/routes/test-conversation.ts'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'

/**
 * A conversation's messages read again, as role and parts, without what Mastra keeps beside each
 * part for itself (`createdAt`, `providerMetadata`) and its `step-start` markers.
 */
export async function rolesAndParts(hub: Hub, person: Person, url: string) {
  const messages = await messagesOf(hub, person, url)
  return messages.map((message) => [
    message.role,
    message.parts.flatMap((part) => {
      if (part.type === 'step-start') return []
      const { createdAt: _at, providerMetadata: _kept, ...drawn } = Object(part)
      return [drawn]
    }),
  ])
}
