# Set up the invitation mail

How the Hub gets the token and the addresses it sends invitations with. Decision:
[0017](../decisions/0017-invitation-email-cloudflare.md). The server itself is set up by
[hub-server](hub-server.md).

## Prepare the sender

The founder onboards a subdomain of the Hub's domain in Cloudflare's dashboard, under Email Sending,
and creates an API token that can only do "Email Sending: Edit".

## Write the token and the addresses

Firstmate writes two files as root, with owner uid 1000 and mode 0400, while port 22 is open:

- `/etc/conexus/secrets/hub_mail_token`, the token. `deploy.sh` refuses to run without it.
- `/etc/conexus/hub.env`, two lines kept out of Git because the address names the account:
  `HUB_MAIL_API_URL=https://api.cloudflare.com/client/v4/accounts/<account id>/email/sending/send`
  and `HUB_MAIL_FROM=<sender>@<onboarded subdomain>`.

Compose refuses to start without `hub.env`. The Hub refuses to start with `CONFIG_INVALID` naming a
missing or malformed variable, or a token file others can read, and `deploy.sh` brings the earlier
image back.

A new token or address takes effect with Reiniciar o Hub. The Hub sends each message once, with a
10 s deadline, and never retries: a failed send answers "O e-mail não pôde ser enviado agora." and
the invitation stays.

## Para o fundador

- No painel da Cloudflare, em Email Sending, faça "Onboard Domain" com um subdomínio do Hub e crie
  um token só com "Email Sending: Edit". Entregue o token ao Firstmate.
- Enquanto o Firstmate grava o token, abra a porta 22 no firewall do provedor e feche-a depois.
