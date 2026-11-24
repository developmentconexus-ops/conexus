import { ConnectorLogo } from '../../hub/connectors/public.ts'

/** The connector's logo plate, or its empty place before the catalog is read. */
export function Logo({ logo }: { logo: string | undefined }) {
  return logo === undefined ? (
    <span className="size-5 shrink-0" />
  ) : (
    <ConnectorLogo small entry={{ logo }} />
  )
}
