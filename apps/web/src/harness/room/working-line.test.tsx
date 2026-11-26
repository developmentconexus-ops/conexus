import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import type { Room } from './room.ts'
import { RoomContext } from './room.ts'
import { ASSISTANT_ROOM, agentRoom, BUILDER_ROOM, savedRoom } from './test-rooms.ts'
import { WaitingOnPhone, WorkingLine } from './working-line.tsx'

afterEach(() => {
  vi.restoreAllMocks()
})

function line(room: Room, drawn: ReactNode): HTMLElement {
  render(<RoomContext.Provider value={room}>{drawn}</RoomContext.Provider>)
  return screen.getByRole('status')
}

function atWork(waiting: boolean): ReactNode {
  return <WorkingLine startedAt={null} heard={undefined} waiting={waiting} />
}

const CONEXUS_ROOMS = [
  ['Construir', BUILDER_ROOM],
  ['Conversas', ASSISTANT_ROOM],
  ['Agentes', agentRoom()],
] as const

const STATES = [
  ['trabalhando', false],
  ['esperando a pessoa', true],
] as const

describe.each(STATES)('a linha %s', (_state, waiting) => {
  test.each(CONEXUS_ROOMS)('em %s leva a marca do Conexus', (_place, room) => {
    const drawn = line(room, atWork(waiting))
    expect(drawn.textContent).toContain('Conexus')
    expect(drawn.querySelector('[data-slot=conexus-mark]')).toBeTruthy()
    expect(drawn.querySelector('[data-slot=agent-icon]')).toBeNull()
  })

  test('de um agente salvo leva o ícone de agente e o nome dele, sem a marca', () => {
    const drawn = line(savedRoom('Conferente de metas'), atWork(waiting))
    expect(drawn.textContent).toContain('Conferente de metas')
    expect(drawn.querySelector('[data-slot=agent-icon]')).toBeTruthy()
    expect(drawn.querySelector('[data-slot=conexus-mark]')).toBeNull()
  })
})

function onPhone(): void {
  vi.spyOn(globalThis, 'matchMedia').mockImplementation((media: string) =>
    Object.assign(new EventTarget(), {
      matches: true,
      media,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
    }),
  )
}

test('no celular, a linha no alto do cartão de um agente salvo leva o ícone de agente, sem a marca', () => {
  onPhone()
  const drawn = line(savedRoom('Conferente de metas'), <WaitingOnPhone />)
  expect(drawn.textContent).toBe('Conferente de metas esperando sua resposta')
  expect(drawn.querySelector('[data-slot=agent-icon]')).toBeTruthy()
  expect(drawn.querySelector('[data-slot=conexus-mark]')).toBeNull()
})

test.each(CONEXUS_ROOMS)(
  'no celular, a linha no alto do cartão em %s leva a marca do Conexus',
  (_place, room) => {
    onPhone()
    const drawn = line(room, <WaitingOnPhone />)
    expect(drawn.querySelector('[data-slot=conexus-mark]')).toBeTruthy()
    expect(drawn.querySelector('[data-slot=agent-icon]')).toBeNull()
  },
)
