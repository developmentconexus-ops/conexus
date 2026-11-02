import type { ReactNode } from 'react'
import { Body, Button, Container, Head, Hr, Html, Link, Preview, Section, Text } from 'react-email'

export const COLORS = {
  canvas: '#F6F7F8',
  surface: '#FFFFFF',
  text: '#121518',
  muted: '#59616A',
  line: '#DDE1E5',
  mark: '#C08A12',
}
const FONT = 'Hanken Grotesk, Segoe UI, Arial, sans-serif'
const DARK = `
:root { color-scheme: light dark; supported-color-schemes: light dark; }
@media (prefers-color-scheme: dark) {
  .canvas, .canvas > table > tbody > tr > td { background-color: #0E1012 !important; }
  .content { background-color: #16191C !important; border-color: #2C3237 !important; }
  .text { color: #EEF0F2 !important; }
  .muted { color: #A3ABB3 !important; }
  .action { background-color: #EEF0F2 !important; color: #121518 !important; }
  .line { border-color: #2C3237 !important; }
  .mark { color: #F2B53A !important; }
}
`

/** The page every Conexus e-mail sits in: the wordmark, the content and a note on why it came. */
export function MailFrame(props: { preview: string; note: string; children: ReactNode }) {
  return (
    <Html lang="pt-BR">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <style>{DARK}</style>
      </Head>
      <Preview>{props.preview}</Preview>
      <Body
        className="canvas"
        style={{ backgroundColor: COLORS.canvas, fontFamily: FONT, margin: 0 }}
      >
        <Container style={{ maxWidth: 520, padding: '32px 16px' }}>
          <Text
            className="text"
            style={{ color: COLORS.text, fontSize: 24, fontWeight: 600, margin: '0 0 24px' }}
          >
            Co
            <span className="mark" style={{ color: COLORS.mark }}>
              nexus
            </span>
          </Text>
          {props.children}
          <Text
            className="muted"
            style={{
              color: COLORS.muted,
              fontSize: 12,
              lineHeight: '19px',
              overflowWrap: 'anywhere',
            }}
          >
            {props.note}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

/** The card the content of an e-mail sits in. */
export function MailCard(props: { children: ReactNode }) {
  return (
    <Section
      className="content"
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 14,
        padding: 24,
      }}
    >
      {props.children}
    </Section>
  )
}

/** The one button of an e-mail. */
export function MailAction(props: { href: string; children: ReactNode }) {
  return (
    <Button
      className="action"
      href={props.href}
      style={{
        backgroundColor: COLORS.text,
        color: COLORS.surface,
        borderRadius: 6,
        padding: '14px 24px',
        fontSize: 15,
        fontWeight: 600,
      }}
    >
      {props.children}
    </Button>
  )
}

/** The rule and the address to copy, for the mail client that does not open the button. */
export function MailFallbackLink(props: { href: string }) {
  return (
    <>
      <Hr className="line" style={{ borderColor: COLORS.line, margin: '24px 0 16px' }} />
      <Text className="muted" style={{ color: COLORS.muted, fontSize: 13, lineHeight: '20px' }}>
        Se o botão não abrir, copie este endereço no navegador:
      </Text>
      <Link
        className="muted"
        href={props.href}
        style={{
          color: COLORS.muted,
          fontFamily: 'Consolas, monospace',
          fontSize: 12,
          wordBreak: 'break-all',
        }}
      >
        {props.href}
      </Link>
    </>
  )
}
