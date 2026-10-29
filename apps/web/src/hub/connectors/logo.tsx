import type { ConnectorEntry } from '@conexus/hub-api'
import { cn } from '../../ui/cn.ts'

/** The provider's own logo, the kit's SVG shown as an image (the Hub's CSP allows `data:` images). */
export function ConnectorLogo(props: { entry: ConnectorEntry; large?: boolean }) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-control border border-line bg-surface-3',
        props.large ? 'size-14' : 'size-10',
      )}
    >
      <img
        alt=""
        src={`data:image/svg+xml;utf8,${encodeURIComponent(props.entry.logo)}`}
        className={cn('object-contain', props.large ? 'size-9' : 'size-6')}
      />
    </span>
  )
}
