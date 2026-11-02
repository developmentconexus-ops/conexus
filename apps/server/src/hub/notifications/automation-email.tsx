import { render, toPlainText } from '@react-email/render'
import { Heading, Text } from 'react-email'
import {
  COLORS,
  MailAction,
  MailCard,
  MailFallbackLink,
  MailFrame,
} from '../identity/mail/public.tsx'
import type {
  AutomationMailProps,
  renderAutomation as RenderAutomation,
} from './notification-render.mjs'

/** The sentence of the e-mail, the same in the preview and in the body; it carries no answer and no figure. */
function sentenceOf(kind: AutomationMailProps['kind'], name: string): string {
  switch (kind) {
    case 'AUTOMATION_DONE':
      return `A automação ${name} terminou e a resposta está esperando por você.`
    case 'AUTOMATION_FAILED':
      return `A automação ${name} não conseguiu terminar.`
    case 'AUTOMATION_PAUSED':
      return `A automação ${name} foi pausada: você não pode mais perguntar ao Assistente da empresa.`
    default:
      return kind satisfies never
  }
}

/** Why the e-mail came, in forms that do not name a gender; a paused automation is not asked to be paused again. */
function noteOf(kind: AutomationMailProps['kind'], to: string): string {
  const why = `Este aviso foi enviado para ${to} porque a automação é sua.`
  switch (kind) {
    case 'AUTOMATION_DONE':
    case 'AUTOMATION_FAILED':
      return `${why} Se você não quer mais recebê-lo, pause ou apague a automação no Conexus.`
    case 'AUTOMATION_PAUSED':
      return why
    default:
      return kind satisfies never
  }
}

function AutomationEmail(props: AutomationMailProps) {
  const sentence = sentenceOf(props.kind, props.name)
  return (
    <MailFrame preview={sentence} note={noteOf(props.kind, props.to)}>
      <MailCard>
        <Heading
          className="text"
          style={{
            color: COLORS.text,
            fontSize: 26,
            lineHeight: '32px',
            margin: '0 0 16px',
            overflowWrap: 'anywhere',
          }}
        >
          {props.name}
        </Heading>
        <Text
          className="text"
          style={{
            color: COLORS.text,
            fontSize: 16,
            lineHeight: '25px',
            overflowWrap: 'anywhere',
          }}
        >
          {sentence}
        </Text>
        <MailAction href={props.link}>Abrir no Conexus</MailAction>
        <MailFallbackLink href={props.link} />
      </MailCard>
    </MailFrame>
  )
}

export async function renderAutomation(
  props: AutomationMailProps,
): ReturnType<typeof RenderAutomation> {
  const html = await render(<AutomationEmail {...props} />)
  return { html, text: toPlainText(html) }
}
