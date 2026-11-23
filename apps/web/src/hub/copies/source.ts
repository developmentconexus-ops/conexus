import type { CopySummary } from '@conexus/hub-api'

export function originOf(copy: Pick<CopySummary, 'sources'>) {
  return {
    connector: copy.sources[0]?.connection.connector ?? '',
    accounts: copy.sources.map((each) => each.connection.name),
  }
}
