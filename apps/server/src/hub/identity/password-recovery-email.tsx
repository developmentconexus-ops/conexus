import { render, toPlainText } from '@react-email/render'
import { Button, Heading, Hr, Link, Section, Text } from 'react-email'
import type {
  PasswordRecoveryMailProps,
  renderPasswordRecovery as RenderPasswordRecovery,
} from './invitation-render.mjs'
import { COLORS, MailFrame } from './mail-frame.tsx'

function PasswordRecoveryEmail(props: PasswordRecoveryMailProps) {
  return (
    <MailFrame
      preview="Crie uma senha nova para entrar no Conexus."
      note={`Este pedido foi feito para ${props.to}. Se não foi você, pode ignorar esta mensagem: a sua senha continua a mesma.`}
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
          style={{ color: COLORS.text, fontSize: 26, lineHeight: '32px', margin: '0 0 16px' }}
        >
          Esqueceu a senha?
        </Heading>
        <Text className="text" style={{ color: COLORS.text, fontSize: 16, lineHeight: '25px' }}>
          {props.name}, use o botão para criar uma senha nova.
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
          Criar senha nova
        </Button>
        <Text
          className="muted"
          style={{ color: COLORS.muted, fontSize: 14, lineHeight: '22px', marginTop: 24 }}
        >
          O link vale {props.validity} e só pode ser usado uma vez.
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
    </MailFrame>
  )
}

export async function renderPasswordRecovery(
  props: PasswordRecoveryMailProps,
): ReturnType<typeof RenderPasswordRecovery> {
  const html = await render(<PasswordRecoveryEmail {...props} />)
  return { html, text: toPlainText(html) }
}
