import type { CompanyId } from '@conexus/hub-api'
import { listNotifications, markNotificationsRead } from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { hubMutation, hubQuery, hubQueryPrefix } from '../../platform/hub.ts'

/** The first page of the person's notifications, newest first, with how many are unread. */
export function notificationsQuery(companyId: CompanyId) {
  return hubQuery(listNotifications, { params: { companyId }, query: {} })
}

export const sendNotificationsRead = hubMutation(markNotificationsRead)

/** Reads the person's notifications again now: for a screen that learns a run ended before the bell's next poll. */
export function refreshNotifications(queryClient: QueryClient, companyId: CompanyId) {
  return queryClient.invalidateQueries({
    queryKey: hubQueryPrefix(listNotifications, { companyId }),
  })
}
