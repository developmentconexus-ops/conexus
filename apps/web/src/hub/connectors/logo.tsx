import type { ConnectorEntry } from '@conexus/hub-api'
import { cn } from '../../ui/cn.ts'

/**
 * The provider's own logo, the kit's SVG shown as an image (the Hub's CSP allows `data:` images),
 * a square symbol without the written name (the name stays as text beside it). It sits in a square
 * tile on the `logo-plate` token, light in both themes (design V3), so it reads on the dark surface.
 */
export function ConnectorLogo(props: { entry: Pick<ConnectorEntry, 'logo'>; large?: boolean }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-control border border-line bg-logo-plate',
        props.large ? 'size-10 sm:size-12' : 'size-8 sm:size-10',
      )}
    >
      <img
        alt=""
        src={`data:image/svg+xml;utf8,${encodeURIComponent(props.entry.logo)}`}
        className={cn('object-contain', props.large ? 'size-6 sm:size-8' : 'size-5 sm:size-6')}
      />
    </span>
  )
}
