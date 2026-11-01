/** How an automation's run ended, for the person who owns it. */
export type AutomationMailKind = 'DONE' | 'FAILED' | 'PAUSED'

export type AutomationMailProps = {
  name: string
  kind: AutomationMailKind
  link: string
  to: string
}

export function renderAutomation(
  props: AutomationMailProps,
): Promise<{ html: string; text: string }>
