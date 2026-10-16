# Set up the invitation mail

How the Hub gets the token and the addresses it sends invitations with. Decision:
[0017](../decisions/0017-invitation-email-cloudflare.md). The server itself is set up by
[hub-server](hub-server.md).

## Prepare the sender

The founder onboards a subdomain of the Hub's domain in Cloudflare's dashboard, under Email Sending,
and creates an API token that can only do "Email Sending: Edit".

## Write the token and the addresses

Firstmate writes two files as root, while port 22 is open:

- `/etc/conexus/secrets/hub_mail_token`, the token, with owner uid 1000 and mode 0400.
  `deploy.sh` refuses to run without it.
- `/etc/conexus/hub.env`, with owner `runner` and mode 0400, because Compose reads it as the user
  that runs `deploy.sh`, not inside the Hub's container. Two lines, kept out of Git because the
  address names the account:
  `HUB_MAIL_API_URL=https://api.cloudflare.com/client/v4/accounts/<account id>/email/sending/send`
  and `HUB_MAIL_FROM=<sender>@<onboarded subdomain>`.

`deploy.sh` refuses to run when `hub.env` is missing or `runner` cannot read it. The Hub refuses to
start with `CONFIG_INVALID` naming a missing or malformed variable, or a token file others can read,
and `deploy.sh` brings the earlier image back.

A new token or address takes effect with Reiniciar o Hub. The Hub sends each message
once per request, with a 10 s deadline, and never retries inside it. A replay of a request whose
invitation was never marked as answered sends again. A failed send answers "O e-mail não pôde ser
enviado agora." and the invitation stays.

## Directory access

The setup creates `/etc/conexus` with mode 0711 so `runner` can traverse it to read its own
`hub.env`; it cannot list that directory. `/etc/conexus/secrets` stays 0700 and token files stay
0400 with their named owners. On an existing installation, Firstmate checks only the parent
permission and the deploy preflight, without opening or relaxing the secrets directory.

## Para o fundador

- No painel da Cloudflare, em Email Sending, faça "Onboard Domain" com um subdomínio do Hub e crie
  um token só com "Email Sending: Edit". Entregue o token ao Firstmate.
- Enquanto o Firstmate grava o token, abra a porta 22 no firewall do provedor e feche-a depois.

### Conferir a entrega no Microsoft 365

Esta conferência usa envio real e só começa depois da sua autorização. Os testes locais usam um
provedor HTTP falso; eles não comprovam entrega no Microsoft 365 nem aparência no Outlook.

1. Abra uma empresa no Hub e convide um endereço de teste que você controla no Microsoft 365.
2. Confira a caixa de entrada e o lixo eletrônico. Verifique remetente Conexus, empresa, quem
   convidou, papel, prazo, botão **Ver convite** e endereço alternativo. Confira também tema claro
   e escuro e uma janela estreita no Outlook disponível para o teste.
3. Abra o convite em uma janela sem sessão. Crie nome e senha, confirme a senha e confira
   **Senha criada. Você já entrou.** A entrada na empresa ainda exige **Aceitar convite**.
4. Aceite e confira as duas pessoas na empresa. Com outro convite, confira recusa, cancelamento,
   reenvio e o comportamento do endereço antigo. Reenviar um convite vivo mantém o endereço;
   reenviar um vencido cria outro. Pode haver entrega duplicada quando a resposta do provedor
   se perde; isso não é uma segunda entrada na empresa.
5. Diga ao Firstmate se chegou, se foi para lixo eletrônico e qual Outlook você usou. Não envie
   token, endereço do convite, cabeçalhos completos nem dados da empresa para Git ou pull request.
   O resultado autorizado e sem dados sensíveis é registrado na decisão 0017.

Se não chegar, não repita envios em série: avise o Firstmate para conferir o provedor e a
configuração do domínio. A aprovação visual e a entrega real permanecem pendentes até este uso.
