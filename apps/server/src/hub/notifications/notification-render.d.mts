import type { NotificationRow } from '@conexus/hub-api'

export type AutomationMailProps = {
  name: string
  /** How the automation's run ended: the kind of the notification it comes with. */
  kind: NotificationRow['kind']
  link: string
  to: string
}

export function renderAutomation(
  props: AutomationMailProps,
): Promise<{ html: string; text: string }>
