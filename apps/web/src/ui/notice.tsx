import { Toast } from '@base-ui/react/toast'
import { CircleCheckIcon, XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { touchArea } from './button.tsx'

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="text-text">
      {children}
    </p>
  )
}

/** What a notice says once something is done: one line, and at most a second under it. */
export type NoticeText = { title: string; description?: string }

// Base UI's toast, for what went well only: an error stays beside what failed (design V26). The
// stack is in the page's flow: a notice enters by a short rise and leaves by opacity, and its
// height never animates. It is inverted against the theme, so the disc resolves its colours in the
// other scheme (the state's colour there, and `on-notice`, which there is this notice's ground),
// and the close button's focus ring takes the notice's ink.
function Notices() {
  const { toasts } = Toast.useToastManager()
  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      data-slot="notice"
      className="rounded-object bg-notice p-md text-on-notice shadow-float transition duration-move ease-enter data-ending-style:opacity-0 data-ending-style:duration-window data-ending-style:ease-exit data-limited:hidden data-starting-style:translate-y-2 data-starting-style:opacity-0"
    >
      <Toast.Content className="flex items-start gap-sm">
        <CircleCheckIcon
          aria-hidden="true"
          className="size-5 shrink-0 fill-success text-on-notice scheme-dark dark:scheme-light"
        />
        <div role="status" className="flex min-w-0 flex-1 flex-col">
          <Toast.Title className="text-label font-semibold" />
          <Toast.Description className="text-label text-on-notice/75" />
        </div>
        <Toast.Close
          aria-label="Fechar aviso"
          className={`${touchArea} -m-0.5 flex size-6 shrink-0 items-center justify-center rounded-control text-on-notice/75 outline-on-notice hover:text-on-notice`}
        >
          <XIcon aria-hidden="true" className="size-3.5" />
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ))
}

/** Holds the notices of the whole page; mounted once, round the router. */
export function NoticeProvider({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider timeout={5000} limit={3}>
      {children}
      <Toast.Portal>
        <Toast.Viewport
          aria-label="Avisos"
          data-slot="notice-viewport"
          className="fixed inset-x-lg bottom-lg z-50 flex flex-col-reverse gap-sm sm:left-auto sm:w-80"
        >
          <Notices />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  )
}

/** Says that something is done, after the Hub confirmed it. */
export function useNotice(): (notice: NoticeText) => void {
  return Toast.useToastManager().add
}
