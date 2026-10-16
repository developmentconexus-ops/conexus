import type { ReactNode } from 'react'

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="text-text">
      {children}
    </p>
  )
}
