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
| The way in: the last company opened, else the first, else the Central, else "Seus apps" for a person who only uses apps, or "Nenhuma empresa" | `/` | Empresa | every signed-in person |
| Início of a company: the box to the Builder for a member; for the owner and the administrators the box to the Assistant, its bar of connections and the recent conversations | `/companies/<c>` | Empresa | owner, administrator, member |
| A conversation with the Assistant born on Início, with the file it shows beside the chat | `/companies/<c>/conversations/<id>` | Empresa | owner, administrator |
| Todos os projetos | `/companies/<c>/projects` | Empresa | owner, administrator, member |
| Agentes of the Início: every agent of the company's live Projetos, view only, each with its Projeto, version and state, and when it last ran; filtered by Projeto in the address; the name opens the agent in its Projeto; Novo agente asks the Projeto and opens its Agentes area | `/companies/<c>/agents?projectId=<p>` | Empresa | owner, administrator |
| Automações of the Início: the person's own, with state, next time and actions | `/companies/<c>/automations` | Empresa | owner, administrator |
| The history of one automation of the Início, with its runs | `/companies/<c>/automations/<id>` | Empresa | owner, administrator |
| Integrações: the connectors the company can link and its connections, grouped by connector, with the window to link | `/companies/<c>/integrations` | Empresa | owner, administrator, member (reads) |
| A connection: its state, who tested it and when, Testar with its one-sentence result, its Caderno with Apagar, and Desligar | `/companies/<c>/integrations/<connectionId>` | Empresa | owner, administrator, member (reads) |
| Configurações' index: the sections as a list on a phone; a wide screen opens Minha conta | `/companies/<c>/settings` | Empresa | owner, administrator, member |
| Configurações: Minha conta, Contas de modelo, Meus padrões | `/companies/<c>/settings/account`, `model-accounts`, `my-defaults` | Empresa | owner, administrator, member |
| Configurações: Geral, Pessoas e convites (with Quem usa os apps), Padrões da empresa | `/companies/<c>/settings/general`, `people`, `defaults` | Empresa | owner, administrator, member (reads) |
| The owner's first entry, steps 1 to 4 | `/companies/<c>/welcome/company`, `model-account`, `team`, `build` | Empresa | owner |
| A Projeto, on its latest conversation | `/companies/<c>/projects/<p>` | Projeto | owner, administrator, member |
| A Projeto's conversation, with the tab Prévia or Código (`?lens=`) | `/companies/<c>/projects/<p>/conversations/<id>` | Projeto | owner, administrator, member |
| Conversas of a Projeto: the box to the Assistant with the Projeto's connections, and its conversations; a member reads who can talk there | `/companies/<c>/projects/<p>/assistant` | Projeto | owner, administrator, member (reads) |
| A conversation with the Assistant in a Projeto, with the file it shows beside the chat | `/companies/<c>/projects/<p>/assistant/<id>` | Projeto | owner, administrator |
| Agentes of a Projeto: the box to the Construtor, its earlier conversations and the Projeto's agents with their state | `/companies/<c>/projects/<p>/agents` | Projeto | owner, administrator |
| Ferramentas of a Projeto, the tab beside Agentes: the library's tools it may use, each with what it reads, its latest version and the agents that use it, and Apagar | `/companies/<c>/projects/<p>/agents/tools` | Projeto | owner, administrator |
| A tool of the library: its versions, newest first, and Nova versão | `/companies/<c>/projects/<p>/agents/tools/<tool>` | Projeto | owner, administrator |
| A conversation with the Construtor, with the draft card of the agent it makes | `/companies/<c>/projects/<p>/agents/construtor/<id>` | Projeto | owner, administrator |
| An agent: the person's conversations with it, the editable configuration, Publicar and Versões | `/companies/<c>/projects/<p>/agents/<agent>` | Projeto | owner, administrator |
| A conversation with an agent, published or the test one with its draft, inside the agent's page | `/companies/<c>/projects/<p>/agents/<agent>/<id>` | Projeto | owner, administrator |
| Automações of a Projeto: the person's own, with state, next time and actions | `/companies/<c>/projects/<p>/automations` | Projeto | owner, administrator |
| The history of one automation of a Projeto, with its runs | `/companies/<c>/projects/<p>/automations/<id>` | Projeto | owner, administrator |
| Sobre, with its parts Sobre and Versões (`?part=`) | `/companies/<c>/projects/<p>/about` | Projeto | owner, administrator, member |
| Quem usa o app | `/companies/<c>/projects/<p>/access` | Projeto | owner, administrator, member (reads) |
| Integrações do Projeto: each connected connection with whether the Projeto may read it, Liberar para ler and Tirar | `/companies/<c>/projects/<p>/integrations` | Projeto | owner, administrator, member (reads) |
| Central, Clientes | `/operations/clients` | Central | whoever operates the installation |
| Estado do Hub | `/operations/status` | Central | whoever operates the installation |
| Cadastrar cliente | `/operations/clients/new` | Central | whoever operates the installation |
| Cliente | `/operations/clients/<c>` | Central | whoever operates the installation |
