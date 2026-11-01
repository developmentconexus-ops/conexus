import { render, toPlainText } from '@react-email/render'
import { Button, Heading, Hr, Link, Section, Text } from 'react-email'
import { COLORS, MailFrame } from '../identity/mail/public.tsx'
import type {
  AutomationMailKind,
  AutomationMailProps,
  renderAutomation as RenderAutomation,
} from './notification-render.mjs'

/** The sentence of the e-mail, the same in the preview and in the body; it carries no answer and no figure. */
function sentenceOf(kind: AutomationMailKind, name: string): string {
  switch (kind) {
    case 'DONE':
      return `A automação ${name} terminou e a resposta está esperando por você.`
    case 'FAILED':
      return `A automação ${name} não conseguiu terminar.`
    case 'PAUSED':
      return `A automação ${name} foi pausada: você não pode mais perguntar ao Assistente da empresa.`
    default:
      return kind satisfies never
  }
}

function AutomationEmail(props: AutomationMailProps) {
  const sentence = sentenceOf(props.kind, props.name)
  return (
    <MailFrame
      preview={sentence}
      note={`Este aviso foi enviado para ${props.to}, dono da automação. Se você não quer mais recebê-lo, pause ou apague a automação no Conexus.`}
    >
      <Section
        className="content"
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.line}`,
          borderRadius: 14,
          padding: 24,
        }}
      >
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
        <Button
          className="action"
          href={props.link}
          style={{
            backgroundColor: COLORS.text,
            color: COLORS.surface,
            borderRadius: 6,
            padding: '14px 24px',
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          Abrir no Conexus
        </Button>
        <Hr className="line" style={{ borderColor: COLORS.line, margin: '24px 0 16px' }} />
        <Text className="muted" style={{ color: COLORS.muted, fontSize: 13, lineHeight: '20px' }}>
          Se o botão não abrir, copie este endereço no navegador:
        </Text>
        <Link
          className="muted"
          href={props.link}
          style={{
            color: COLORS.muted,
            fontFamily: 'Consolas, monospace',
            fontSize: 12,
            wordBreak: 'break-all',
          }}
        >
          {props.link}
        </Link>
      </Section>
    </MailFrame>
  )
}

export async function renderAutomation(
  props: AutomationMailProps,
): ReturnType<typeof RenderAutomation> {
  const html = await render(<AutomationEmail {...props} />)
  return { html, text: toPlainText(html) }
}
