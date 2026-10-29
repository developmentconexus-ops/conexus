import { render, toPlainText } from '@react-email/render'
import { Button, Heading, Hr, Link, Section, Text } from 'react-email'
import { COLORS, MailFrame } from './mail-frame.tsx'

export { renderPasswordRecovery } from './password-recovery-email.tsx'

import type {
  InvitationMailProps,
  renderInvitation as RenderInvitation,
} from './invitation-render.mjs'

/** The sentence of the invitation, the same in the preview and in the body. */
function invitationSentence(props: InvitationMailProps): string {
  switch (props.invited.kind) {
    case 'FIRST_OWNER':
      return `${props.inviterName} convidou você para ser o primeiro dono de ${props.companyName}.`
    case 'COMPANY':
      return `${props.inviterName} convidou você para ${props.companyName} no Conexus.`
    case 'APP':
      return `${props.inviterName} convidou você para usar o app ${props.invited.appName}, da ${props.companyName}.`
    default:
      return props.invited satisfies never
  }
}

function InvitationText(props: InvitationMailProps) {
  switch (props.invited.kind) {
    case 'FIRST_OWNER':
      return (
        <>
          {props.inviterName} convidou você para ser o primeiro dono de{' '}
          <strong>{props.companyName}</strong>.
        </>
      )
    case 'COMPANY':
      return (
        <>
          {props.inviterName} convidou você para entrar em <strong>{props.companyName}</strong> no
          Conexus, como {props.invited.roleLabel}.
        </>
      )
    case 'APP':
      return (
        <>
          {props.inviterName} convidou você para usar o app <strong>{props.invited.appName}</strong>
          , da {props.companyName}.
        </>
      )
    default:
      return props.invited satisfies never
  }
}

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
        {props.invited.kind === 'APP'
          ? `Convite para usar ${props.invited.appName}`
          : `Convite para ${props.companyName}`}
      </Heading>
      <Text className="text" style={{ color: COLORS.text, fontSize: 16, lineHeight: '25px' }}>
        <InvitationText {...props} />
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
    <MailFrame
      preview={invitationSentence(props)}
      note={`Este convite foi enviado para ${props.to}. Se você não esperava por ele, pode ignorar esta mensagem: ninguém entra na empresa sem a sua resposta.`}
    >
      <InvitationContent {...props} />
    </MailFrame>
  )
}

export async function renderInvitation(
  props: InvitationMailProps,
): ReturnType<typeof RenderInvitation> {
  const html = await render(<InvitationEmail {...props} />)
  return { html, text: toPlainText(html) }
}
