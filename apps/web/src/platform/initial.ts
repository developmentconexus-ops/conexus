import type { SessionState } from '@conexus/hub-api'
import { getRouteApi } from '@tanstack/react-router'

type InitialAction = { to: '/login'; label: 'Entrar' } | { to: '/'; label: 'Voltar ao início' }

export function initialActionOf(session: SessionState): InitialAction {
  return session.state === 'SIGNED_OUT'
    ? { to: '/login', label: 'Entrar' }
    : { to: '/', label: 'Voltar ao início' }
}

export function useInitialAction() {
  return getRouteApi('__root__').useRouteContext().initial
}
