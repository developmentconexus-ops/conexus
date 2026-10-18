# Set up the companies' databases

How the Hub gets the key that creates and deletes each company's Neon project. Decision:
[0040](../decisions/0040-company-database-through-neon.md). The server itself is set up by
[hub-server](hub-server.md).

## Two organizations

Neon holds two organizations of Conexus's own. The Hub's project lives in the first; every
company's project lives in the second, named "Conexus empresas", on the free plan. The Hub holds a
key of the second only, so the key cannot read, change or delete the Hub's own project.

## Write the key and the organization

Firstmate writes two things as root, while port 22 is open:

- `/etc/conexus/secrets/hub_neon_api_key`, the key of the companies' organization, with owner uid
  1000 and mode 0400. `deploy.sh` refuses to run without it.
- One more line in `/etc/conexus/hub.env`: `HUB_NEON_ORG_ID=<the companies' organization id>`. It
  stays out of Git because it names the account.

The Hub refuses to start with `CONFIG_INVALID` naming `HUB_NEON_API_KEY_FILE` when the key file is
missing, empty or readable by others, and naming `HUB_NEON_ORG_ID` when the line is missing. The
API address, `HUB_NEON_API_URL`, is in `compose.yaml`; it must be https.

A new key takes effect with Reiniciar o Hub. Each call to Neon has a budget of 60 s, split between the
request and the wait for Neon to finish.

## After the release

Create a test company with a person who can create a Projeto, create the first Projeto, and look for
a project named `cx-<company id>` in the companies' organization in Neon's console. Then delete the
company in the Central: the project leaves the console.

## When something is off

- **Two projects with the same name.** The Hub refuses to pick one and answers 500 to the person. In
  the console, delete the extra one by hand. Deleting the company deletes every project with its
  name, so nothing remains.
- **The company shows "Exclusão em andamento".** Neon did not answer. Open the company in the Central
  and use **Tentar concluir exclusão**; nothing else finishes it.
- **A refused key.** The Hub answers 500 and logs the failure without the key. Write a new key as above.

## Restore a company

A restore of a company's Neon project to an earlier point can take an app's schema, logins and
migrations with it. In Neon's console, restore the project's branch to the chosen time, then
Reiniciar o Hub. At start the Hub's repair (architecture §8) brings each live app back: its Worker,
if Cloudflare lost it, then its schema and logins, then the live version's migrations, each one at
most once by its ledger. The log has `APP_REPAIRED` with the company's id; `APP_REPAIR_FAILED`
leaves that company for the next start, and the others go on. The app's rows are those of the
restored point.

## Para o fundador

- No console do Neon, crie a organização "Conexus empresas" no plano grátis e uma chave de API dela.
  Entregue a chave ao Firstmate; nunca a cole em Git ou em pull request.
- Se o Neon recusar a segunda organização ou a chave dela, avise o Firstmate: a decisão volta a você.
- Restaurar uma empresa volta os dados dos apps dela ao instante escolhido; o que foi gravado depois
  se perde. Escolha o instante com o Firstmate.
