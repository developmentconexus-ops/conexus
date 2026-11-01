import type { Email } from '@conexus/hub-api'
import type { MailMessage } from '../../platform/mail.ts'
import type { AutomationMailKind } from './notification-render.mjs'
import { renderAutomation } from './notification-render.mjs'

const SUBJECTS = {
  DONE: 'pronta',
  FAILED: 'falhou',
  PAUSED: 'pausada',
} as const satisfies Record<AutomationMailKind, string>

/**
 * The e-mail that tells the owner an automation's run ended: the automation's name and the address
 * to open, and nothing of the answer or the company's figures (founder G1).
 */
export async function automationMail(input: {
  to: Email
  name: string
  kind: AutomationMailKind
  link: string
}): Promise<MailMessage> {
  return {
    to: input.to,
    subject: `Automação ${input.name}: ${SUBJECTS[input.kind]}`,
    ...(await renderAutomation(input)),
  }
}
