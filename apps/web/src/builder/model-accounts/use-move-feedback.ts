import { useEffect, useRef, useState } from 'react'

export type Move = 'up' | 'down'

type Expected = { id: string; move: Move; before: string }

function buttonOf(box: HTMLElement | null, id: string, move: Move) {
  return box?.querySelector<HTMLElement>(`[data-move="${id}:${move}"]`)
}

/**
 * What a reorder leaves behind once the page reads the new order: the button the person used keeps
 * focus, or its twin when the row reached an end, and the new place is said aloud (design V30, V35).
 * `box` holds the queue's rows; `expect` is called before the write, `forget` if it fails. The
 * queue is the accounts of a provider, or the models of the automatic switch.
 */
export function useMoveFeedback<Box extends HTMLElement = HTMLTableSectionElement>(
  items: readonly { id: string; label: string }[],
  queueName: string,
) {
  const box = useRef<Box>(null)
  const expected = useRef<Expected | undefined>(undefined)
  const [said, setSaid] = useState('')
  const order = items.map((one) => one.id).join()

  useEffect(() => {
    const moved = expected.current
    if (moved === undefined || moved.before === order) return
    expected.current = undefined
    const twin = moved.move === 'up' ? 'down' : 'up'
    const used = buttonOf(box.current, moved.id, moved.move)
    const target = used?.matches(':disabled') ? buttonOf(box.current, moved.id, twin) : used
    target?.focus()
    const index = items.findIndex((one) => one.id === moved.id)
    const item = items[index]
    if (item) setSaid(`${item.label} agora é a ${index + 1}ª da fila ${queueName}.`)
  })

  return {
    box,
    said,
    expect: (id: string, move: Move) => {
      expected.current = { id, move, before: order }
    },
    forget: () => {
      expected.current = undefined
    },
  }
}
