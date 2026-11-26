import { CONNECTORS, SANKHYA_DISCOVERY, sankhyaFake } from '@conexus/connectors'

export { SANKHYA_DISCOVERY, sankhyaFake }

/** The subjects the kit groups Sankhya's tables under. */
export const SANKHYA_GROUPS: ReadonlySet<string> = new Set(
  Object.keys(CONNECTORS.find((connector) => connector.id === 'sankhya')?.subjects ?? {}),
)
