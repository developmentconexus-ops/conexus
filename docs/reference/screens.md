# Screens: where each one lives

One line per screen, by address, in the floors of [web W29](../guides/web.md). A step that adds,
moves or removes a screen changes this file in its own pull request; the card's state matrix
([card template](../../.agents/skills/conexus-scope/references/card.md)) owns the states of each
screen, and this file only says where it is. Its ceiling is none ([delivery
L24](../guides/delivery.md)): it grows by one line per screen.

| Screen | Address | Floor | Who sees it |
| --- | --- | --- | --- |
| Sign in | `/login` | Entrada | everyone |
| Recover a password | `/forgot-password` | Entrada | everyone |
| Set a password | `/set-password` | Entrada | the person holding the link |
| Accept an invitation | `/invitations/<id>` | Entrada | the person invited |
| An app refuses a pass | `/apps/open` | Entrada | the person the app refused |
| The way in: the last company opened, else the first, else the Central or "Nenhuma empresa" | `/` | Empresa | every signed-in person |
| Início of a company | `/companies/<c>` | Empresa | owner, administrator, member |
| Todos os projetos | `/companies/<c>/projects` | Empresa | owner, administrator, member |
| Configurações' index: the sections as a list on a phone; a wide screen opens Minha conta | `/companies/<c>/settings` | Empresa | owner, administrator, member |
| Configurações: Minha conta, Minhas contas de modelo, Aparência | `/companies/<c>/settings/account`, `my-model-accounts`, `appearance` | Empresa | owner, administrator, member |
| Configurações: Geral, Pessoas e convites, Contas de modelo | `/companies/<c>/settings/general`, `people`, `model-accounts` | Empresa | owner, administrator, member (reads) |
| The owner's first entry, steps 1 to 4 | `/companies/<c>/welcome/company`, `model-account`, `team`, `build` | Empresa | owner |
| A Projeto, on its latest conversation | `/companies/<c>/projects/<p>` | Projeto | owner, administrator, member |
| A Projeto's conversation, with the tab Prévia or Projeto (`?lens=`) and its section Sobre or Versões (`?section=`) | `/companies/<c>/projects/<p>/conversations/<id>` | Projeto | owner, administrator, member |
| Central, Clientes | `/operations/clients` | Central | whoever operates the installation |
| Estado do Hub | `/operations/status` | Central | whoever operates the installation |
| Cadastrar cliente | `/operations/clients/new` | Central | whoever operates the installation |
| Cliente | `/operations/clients/<c>` | Central | whoever operates the installation |
