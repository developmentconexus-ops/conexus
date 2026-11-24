import type { RenderOptions } from '@testing-library/react'
import { render as renderPlain } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { RoomContext } from './room.ts'
import { BUILDER_ROOM } from './test-rooms.ts'

function InBuilderRoom({ children }: { children: ReactNode }) {
  return <RoomContext.Provider value={BUILDER_ROOM}>{children}</RoomContext.Provider>
}

export function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return renderPlain(ui, { ...options, wrapper: InBuilderRoom })
}

export { agentRoom } from './test-rooms.ts'
export { RoomContext }
