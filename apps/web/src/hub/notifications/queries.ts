import type { CompanyId } from '@conexus/hub-api'
import { listNotifications, markNotificationsRead } from '@conexus/hub-api'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

/** The first page of the person's notifications, newest first, with how many are unread. */
export function notificationsQuery(companyId: CompanyId) {
  return hubQuery(listNotifications, { params: { companyId }, query: {} })
}

export const sendNotificationsRead = hubMutation(markNotificationsRead)
