import type { ConnectorEntry } from '@conexus/hub-api'
import { cn } from '../../ui/cn.ts'

/**
 * The provider's own logo, the kit's SVG shown as an image (the Hub's CSP allows `data:` images),
 * at its own aspect ratio. The plate stays light in both themes: a wordmark is drawn for a light
 * ground and its dark letters vanish on the dark theme's surface.
 */
export function ConnectorLogo(props: { entry: ConnectorEntry; large?: boolean }) {
  return (
    <span className="flex shrink-0 items-center rounded-control border border-line bg-white px-sm py-xs">
      <img
        alt=""
        src={`data:image/svg+xml;utf8,${encodeURIComponent(props.entry.logo)}`}
        className={cn('w-auto object-contain', props.large ? 'h-8 max-w-40' : 'h-6 max-w-28')}
      />
    </span>
  )
}
