import type { Person } from '@conexus/hub-api'

export function Greeting({ person }: { person: Person }) {
  return <p className="text-title">Você entrou como {person.name}.</p>
}
