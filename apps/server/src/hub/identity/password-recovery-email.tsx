import { render, toPlainText } from '@react-email/render'
import { Heading, Text } from 'react-email'
import type {
  PasswordRecoveryMailProps,
  renderPasswordRecovery as RenderPasswordRecovery,
} from './invitation-render.mjs'
import { COLORS, MailAction, MailCard, MailFallbackLink, MailFrame } from './mail-frame.tsx'

function PasswordRecoveryEmail(props: PasswordRecoveryMailProps) {
  return (
    <MailFrame
      preview="Crie uma senha nova para entrar no Conexus."
      note={`Este pedido foi feito para ${props.to}. Se não foi você, pode ignorar esta mensagem: a sua senha continua a mesma.`}
    >
      <MailCard>
        <Heading
          className="text"
          style={{ color: COLORS.text, fontSize: 26, lineHeight: '32px', margin: '0 0 16px' }}
        >
          Esqueceu a senha?
        </Heading>
        <Text className="text" style={{ color: COLORS.text, fontSize: 16, lineHeight: '25px' }}>
          {props.name}, use o botão para criar uma senha nova.
        </Text>
        <MailAction href={props.link}>Criar senha nova</MailAction>
        <Text
          className="muted"
          style={{ color: COLORS.muted, fontSize: 14, lineHeight: '22px', marginTop: 24 }}
        >
          O link vale {props.validity} e só pode ser usado uma vez.
        </Text>
        <MailFallbackLink href={props.link} />
      </MailCard>
    </MailFrame>
  )
}

export async function renderPasswordRecovery(
  props: PasswordRecoveryMailProps,
): ReturnType<typeof RenderPasswordRecovery> {
  const html = await render(<PasswordRecoveryEmail {...props} />)
  return { html, text: toPlainText(html) }
}
