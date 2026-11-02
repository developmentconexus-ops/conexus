import type { FastifyInstance } from 'fastify'
import type { Notifications } from './notifications.ts'
import { createNotifications } from './notifications.ts'
import { registerNotificationRoutes } from './routes.ts'

export type { Notify } from './notifications.ts'

/** The Hub's notifications: `notify` for the subjects that tell a person, and the bell's routes. */
export function notificationsOf(deps: Parameters<typeof createNotifications>[0]) {
  const notifications: Notifications = createNotifications(deps)
  return Object.freeze({
    notify: notifications.notify,
    routes: (app: FastifyInstance) => registerNotificationRoutes(app, notifications),
  })
}

export type NotificationsPart = ReturnType<typeof notificationsOf>
