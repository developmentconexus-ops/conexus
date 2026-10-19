# Set up the apps' token and key

The Hub sends each version of an app as a Worker in the namespace, and the dispatcher opens the
app's logins in the company's database. Decision:
[0043](../decisions/0043-app-logins-derived-from-one-key.md). The edge itself is set up by
[apps-edge](apps-edge.md). A Release publishes the key to the dispatcher before its code, and
carries the `recados-*.zip` folders, Recados and its step 10 defects, the versions to send from a
Projeto's Configurações.

1. The Hub's token: in the dashboard, an account-owned API token with only Workers Scripts: Edit
   (account), apart from the publish token. As root on the server, write it to
   `/etc/conexus/secrets/hub_cloudflare_apps_token`, owner uid 1000, mode 0400, and add
   `HUB_CLOUDFLARE_ACCOUNT_ID=<account id>` to `/etc/conexus/hub.env`.
2. The key the apps' login passwords derive from, generated on the server and never typed, as
   root. The runner reads its own copy:

   ```sh
   (umask 077 && openssl rand -hex 32 > /etc/conexus/secrets/hub_app_login_key)
   chown 1000:1000 /etc/conexus/secrets/hub_app_login_key
   chmod 0400 /etc/conexus/secrets/hub_app_login_key
   install -m 0400 -o runner -g runner /etc/conexus/secrets/hub_app_login_key /etc/conexus/app-login-key
   ```

   Both copies must stay the line `openssl` wrote, 64 hexadecimal digits: the Hub and
   `publish-edge.sh` refuse any other character, so the two never derive different passwords.
3. A copy for the founder, kept off the server: `cat` the key once into a file on the founder's
   computer over the same session, and delete it from the scrollback. Without it, a lost server
   loses every app's logins.
4. `deploy.sh` refuses to start the Hub without either secret; the Hub refuses with `CONFIG_INVALID`
   naming the variable when a file is empty, readable by others or not in its format.
   `publish-edge.sh` refuses the runner's copy the same way as the publish token's file, then hands
   it to `wrangler secret put APP_LOGIN_KEY` on its standard input, before the dispatcher's code.

**Rotation.** The token: create a new one, write it over the file, Reiniciar o Hub, then delete the
old one in the dashboard. The key does not rotate: each login's password was set from it when the
app's schema was made, so a new key locks every app out of its database (0043, not covered). A
leaked key returns to the founder.

## Para o fundador

- Antes do Release da etapa 9: crie no painel o token do Hub para os apps, só com Workers Scripts:
  Edit, e entregue o valor ao Firstmate sem colar no chat. O Firstmate gera a chave dos logins dos apps no servidor e
  deixa uma cópia num arquivo no seu computador: guarde-a fora dele. Sem ela, perder o servidor é
  perder o acesso de cada app ao seu banco.
