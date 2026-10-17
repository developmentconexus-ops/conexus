import { render, toPlainText } from '@react-email/render'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'react-email'
import type {
  InvitationMailProps,
  renderInvitation as RenderInvitation,
} from './invitation-render.mjs'

const COLORS = {
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

function InvitationContent(props: InvitationMailProps) {
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
        Convite para {props.companyName}
      </Heading>
      <Text className="text" style={{ color: COLORS.text, fontSize: 16, lineHeight: '25px' }}>
        {props.firstOwner ? (
          <>
            {props.inviterName} convidou você para ser o primeiro dono de{' '}
            <strong>{props.companyName}</strong>.
          </>
        ) : (
          <>
            {props.inviterName} convidou você para entrar em <strong>{props.companyName}</strong> no
            Conexus, como {props.roleLabel}.
          </>
        )}
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
        Ver convite
      </Button>
      <Text
        className="muted"
        style={{ color: COLORS.muted, fontSize: 14, lineHeight: '22px', marginTop: 24 }}
      >
        Na página do convite você cria sua senha, se ainda não tiver uma, e decide se entra. O
        convite vale até {props.expiresOn}.
      </Text>
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
  )
}

function InvitationEmail(props: InvitationMailProps) {
  return (
    <Html lang="pt-BR">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <style>{DARK}</style>
      </Head>
      <Preview>
        {props.firstOwner
          ? `${props.inviterName} convidou você para ser o primeiro dono de ${props.companyName}.`
          : `${props.inviterName} convidou você para ${props.companyName} no Conexus.`}
      </Preview>
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
          <InvitationContent {...props} />
          <Text
            className="muted"
            style={{
              color: COLORS.muted,
              fontSize: 12,
              lineHeight: '19px',
              overflowWrap: 'anywhere',
            }}
          >
            Este convite foi enviado para {props.to}. Se você não esperava por ele, pode ignorar
            esta mensagem: ninguém entra na empresa sem a sua resposta.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export async function renderInvitation(
  props: InvitationMailProps,
): ReturnType<typeof RenderInvitation> {
  const html = await render(<InvitationEmail {...props} />)
  return { html, text: toPlainText(html) }
}
