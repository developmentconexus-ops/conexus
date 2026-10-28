import type { ReactNode, Ref } from 'react'

/**
 * A part of a settings page in two columns from `md`: what it is and whom it affects on the left,
 * its controls on the right; one column on a phone. Parts follow each other under a hairline
 * (design V19).
 */
export function SettingsSection(props: {
  id: string
  title: string
  description?: ReactNode
  /** Given, the section takes focus when a change leaves the control that had it gone. */
  ref?: Ref<HTMLElement>
  children: ReactNode
}) {
  return (
    <section
      ref={props.ref}
      tabIndex={props.ref === undefined ? undefined : -1}
      aria-labelledby={`${props.id}-title`}
      className="grid gap-lg focus:outline-none border-line border-t pt-xl md:grid-cols-[16rem_minmax(0,1fr)] md:gap-2xl lg:grid-cols-[20rem_minmax(0,1fr)]"
    >
      <div className="flex flex-col gap-xs">
        <h2 id={`${props.id}-title`} className="font-display text-title">
          {props.title}
        </h2>
        {props.description && (
          <p className="text-label text-text-2 leading-normal">{props.description}</p>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-lg">{props.children}</div>
    </section>
  )
}
