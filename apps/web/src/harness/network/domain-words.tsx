import type { ReactNode } from 'react'

export function Fact({ children }: { children: ReactNode }) {
  return <span className="font-mono text-fact">{children}</span>
}

export function StarCoverage({ base }: { base: string }) {
  return (
    <>
      qualquer endereço que termina em <Fact>.{base}</Fact>, menos o próprio <Fact>{base}</Fact>
    </>
  )
}
