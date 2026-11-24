import { ModelId } from '@conexus/hub-api'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { BuilderTurn } from './builder-turn.tsx'
import type { Room } from './room.ts'
import { RoomContext } from './room.ts'
import { ASSISTANT_ROOM, agentRoom, BUILDER_ROOM, savedRoom } from './test-rooms.ts'

const MODEL = ModelId.parse('anthropic/claude-sonnet-4')

function head(room: Room): HTMLElement {
  render(
    <RoomContext.Provider value={room}>
      <BuilderTurn items={[]} model={MODEL} streaming={false} onAsk={() => undefined} />
    </RoomContext.Provider>,
  )
  const header = screen.getByText('Claude Sonnet 4').parentElement
  if (header === null) throw new Error('the model badge has no header')
  return header
}

test.each([
  ['Construir', BUILDER_ROOM],
  ['Conversas', ASSISTANT_ROOM],
  ['Agentes', agentRoom()],
])('a resposta de %s vem assinada "Conexus", com a marca', (_place, room) => {
  const header = head(room)
  expect(header.textContent).toContain('Conexus')
  expect(header.querySelector('svg.text-mark')).toBeTruthy()
  expect(header.querySelector('svg.lucide-bot')).toBeNull()
})

test('a resposta de um agente salvo vem com o nome dele e o ícone de agente, sem a marca', () => {
  const header = head(savedRoom('Conferente de metas'))
  expect(header.textContent).toContain('Conferente de metas')
  expect(header.textContent).not.toContain('Conexus')
  expect(header.querySelector('svg.lucide-bot')).toBeTruthy()
  expect(header.querySelector('svg.text-mark')).toBeNull()
})
