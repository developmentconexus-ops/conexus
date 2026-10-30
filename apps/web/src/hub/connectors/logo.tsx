import type { ConnectorEntry } from '@conexus/hub-api'
import { cn } from '../../ui/cn.ts'

/**
 * The provider's own logo, the kit's SVG shown as an image (the Hub's CSP allows `data:` images),
 * at its own aspect ratio. It sits on the `logo-plate` token, light in both themes (design V3): a
 * wordmark is drawn for a light ground and its dark letters vanish on the dark theme's surface.
 */
export function ConnectorLogo(props: { entry: ConnectorEntry; large?: boolean }) {
  return (
    <span className="flex shrink-0 items-center rounded-control border border-line bg-logo-plate px-sm py-xs">
      <img
        alt=""
        src={`data:image/svg+xml;utf8,${encodeURIComponent(props.entry.logo)}`}
        className={cn(
          'w-auto object-contain',
          props.large ? 'h-6 max-w-32 sm:h-8 sm:max-w-40' : 'h-4 max-w-20 sm:h-6 sm:max-w-28',
        )}
      />
    </span>
  )
}
