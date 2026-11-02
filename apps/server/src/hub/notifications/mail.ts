import type { Email } from '@conexus/hub-api'
import type { MailMessage } from '../../platform/mail.ts'
import type { AutomationMailProps } from './notification-render.mjs'
import { renderAutomation } from './notification-render.mjs'

const SUBJECTS = {
  AUTOMATION_DONE: 'pronta',
  AUTOMATION_FAILED: 'falhou',
  AUTOMATION_PAUSED: 'pausada',
} as const satisfies Record<AutomationMailProps['kind'], string>

/**
 * The e-mail that tells the owner an automation's run ended: the automation's name and the address
 * to open, and nothing of the answer or the company's figures (founder G1).
 */
export async function automationMail(
  input: AutomationMailProps & { to: Email },
): Promise<MailMessage> {
  return {
    to: input.to,
    subject: `Automação ${input.name}: ${SUBJECTS[input.kind]}`,
    ...(await renderAutomation(input)),
  }
}
