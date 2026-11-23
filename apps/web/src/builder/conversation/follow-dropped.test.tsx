import { waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { conversationOf, FIRST, screens } from './test-hub.tsx'

const { openConversation } = screens(hubServer())

test('a reconexão que recebe um 4xx qualquer assina o stream de novo, depois da pausa', async () => {
  let opened = 0
  const { line, lines } = await openConversation(conversationOf({ id: FIRST }), undefined, {
    stream: () => {
      opened += 1
      return opened === 2 ? refusal('REQUEST_ORIGIN_REFUSED') : undefined
    },
  })
  line().close()
  await waitFor(() => expect(opened).toBeGreaterThanOrEqual(3), { timeout: 8000 })
  await waitFor(() => expect(lines).toHaveLength(2))
})
