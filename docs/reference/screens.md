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
| Início, the list of the person's companies | `/` | Empresa | every signed-in person |
| A company's Projetos | `/companies/<c>/projects` | Empresa | owner, administrator, member |
| Pessoas | `/companies/<c>/people` | Empresa | owner, administrator, member |
| Minha conta de modelo | `/companies/<c>/model-account` | Empresa | owner, administrator, member |
| Configurar a empresa | `/companies/<c>/setup` | Empresa | owner, administrator |
| A Projeto | `/companies/<c>/projects/<p>` | Projeto | owner, administrator, member |
| A Projeto's Configurações | `/companies/<c>/projects/<p>/settings` | Projeto | owner, administrator, member |
| Conversas | `/companies/<c>/projects/<p>/conversations` | Projeto | owner, administrator, member |
| A conversa | `/companies/<c>/projects/<p>/conversations/<id>` | Projeto | owner, administrator, member |
| Central de Operação | `/operations/clients` | Central | whoever operates the installation |
| Cadastrar cliente | `/operations/clients/new` | Central | whoever operates the installation |
| Cliente | `/operations/clients/<c>` | Central | whoever operates the installation |
