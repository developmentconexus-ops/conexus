import { listNotifications, markNotificationsRead, NotificationId } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { answer, serve } from '../../platform/http.ts'
import { pageKey } from '../../platform/pages.ts'
import type { Notifications } from './notifications.ts'

/** The bell's two routes: the person's own notifications, and marking them read. */
export function registerNotificationRoutes(
  app: FastifyInstance,
  notifications: Notifications,
): void {
  serve(app, listNotifications, async (input) => {
    const { person } = input
    const { companyId } = input.params
    const after = pageKey(input.query.page, NotificationId)
    return answer(await notifications.list({ person, companyId, after }))
  })
  serve(app, markNotificationsRead, async (input) => {
    const { person } = input
    const { companyId } = input.params
    const ids = 'all' in input.body ? 'ALL' : input.body.ids
    await notifications.markRead({ person, companyId, ids })
    return answer(undefined)
  })
}
