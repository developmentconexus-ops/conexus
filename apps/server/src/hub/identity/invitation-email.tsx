import { render, toPlainText } from '@react-email/render'
import { Heading, Text } from 'react-email'
import { COLORS, MailAction, MailCard, MailFallbackLink, MailFrame } from './mail-frame.tsx'

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
        {props.invited.kind === 'APP'
          ? `Convite para usar ${props.invited.appName}`
          : `Convite para ${props.companyName}`}
      </Heading>
      <Text className="text" style={{ color: COLORS.text, fontSize: 16, lineHeight: '25px' }}>
        <InvitationText {...props} />
      </Text>
      <MailAction href={props.link}>Ver convite</MailAction>
      <Text
        className="muted"
        style={{ color: COLORS.muted, fontSize: 14, lineHeight: '22px', marginTop: 24 }}
      >
        Na página do convite você cria sua senha, se ainda não tiver uma, e decide se entra. O
        convite vale até {props.expiresOn}.
      </Text>
      <MailFallbackLink href={props.link} />
    </MailCard>
  )
}

function InvitationEmail(props: InvitationMailProps) {
  const unanswered = props.invited.kind === 'APP' ? 'ninguém usa o app' : 'ninguém entra na empresa'
  return (
    <MailFrame
      preview={invitationSentence(props)}
      note={`Este convite foi enviado para ${props.to}. Se você não esperava por ele, pode ignorar esta mensagem: ${unanswered} sem a sua resposta.`}
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
