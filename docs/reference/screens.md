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
| Início of a company: the box to the Assistant, its bar of connections and the recent conversations; the card that prepares the company only for whoever invites | `/companies/<c>` | Empresa | owner, administrator, developer, member |
| A conversation with the Assistant born on Início, with the file it shows beside the chat | `/companies/<c>/conversations/<id>` | Empresa | owner, administrator, developer, member |
| Todos os projetos | `/companies/<c>/projects` | Empresa | owner, administrator, developer, member |
| Agentes of the Início: every agent of the company's live Projetos, view only, each with its Projeto, version and state, and when it last ran; filtered by Projeto in the address; the name opens the agent in its Projeto; Novo agente asks the Projeto and opens its Agentes area | `/companies/<c>/agents?projectId=<p>` | Empresa | owner, administrator, developer |
| Automações of the Início: the person's own, with state, next time and actions | `/companies/<c>/automations` | Empresa | owner, administrator, developer |
| The history of one automation of the Início, with its runs | `/companies/<c>/automations/<id>` | Empresa | owner, administrator, developer |
| Cópias: every copy of the company with its source, mode, state, last run, duration, rows, interval and Projetos; Ligar uma cópia; Rodar agora, Pausar or Retomar and Intervalo on each row; the Builder's open proposals, each a Proposta row with Ligar (released to its Projeto) and Dispensar | `/companies/<c>/copies` | Empresa | owner, administrator, developer |
| One copy: what it copies (the query, the key, the mode and what it rereads) and its runs, 20 to a page | `/companies/<c>/copies/<id>` | Empresa | owner, administrator, developer |
| Integrações: the connectors the company can link and its connections, grouped by connector, with the window to link | `/companies/<c>/integrations` | Empresa | owner, administrator, developer (reads), member (reads) |
| A connection: its state, who tested it and when, Testar with its one-sentence result, its Caderno with Apagar, and Desligar | `/companies/<c>/integrations/<connectionId>` | Empresa | owner, administrator, developer (reads), member (reads) |
| Configurações' index: the sections as a list on a phone; a wide screen opens Minha conta | `/companies/<c>/settings` | Empresa | owner, administrator, developer, member |
| Configurações: Minha conta, Contas de modelo, Meus padrões | `/companies/<c>/settings/account`, `model-accounts`, `my-defaults` | Empresa | owner, administrator, developer, member |
| Configurações: Geral, Pessoas e convites (with Quem usa os apps), Padrões da empresa | `/companies/<c>/settings/general`, `people`, `defaults` | Empresa | owner, administrator, developer (reads), member (reads) |
| Configurações: Papéis, the four roles and the company's own with what each uses of each connector; `?new=true` makes one, `?role=<name>` opens one with its connectors, subjects and operations (lê, escreve, apaga), the action Publicar agente que escreve sozinho and Apagar papel | `/companies/<c>/settings/roles` | Empresa | owner, administrator |
| The owner's first entry, steps 1 to 4 | `/companies/<c>/welcome/company`, `model-account`, `team`, `build` | Empresa | owner |
| A Projeto, on its latest conversation; above the area, its open publish request (who asked, the message, Cancelar pedido for the asker, Publicar a versão n and Recusar for an owner or an administrator) and, for whoever does not publish, Pedir para publicar with its box | `/companies/<c>/projects/<p>` | Projeto | owner, administrator, developer, member |
| A Projeto's conversation, with the tab Prévia or Código (`?lens=`) | `/companies/<c>/projects/<p>/conversations/<id>` | Projeto | owner, administrator, developer, member |
| Conversas of a Projeto: the box to the Assistant with the Projeto's connections, and its conversations | `/companies/<c>/projects/<p>/assistant` | Projeto | owner, administrator, developer, member |
| A conversation with the Assistant in a Projeto, with the file it shows beside the chat | `/companies/<c>/projects/<p>/assistant/<id>` | Projeto | owner, administrator, developer, member |
| Agentes of a Projeto: the box to the Construtor, its earlier conversations and the Projeto's agents with their state | `/companies/<c>/projects/<p>/agents` | Projeto | owner, administrator, developer |
| Ferramentas of a Projeto, the tab beside Agentes: the library's tools it may use, each with what it reads, its latest version and the agents that use it, Nova versão and Apagar; a tool the Construtor wrote carries the badge Em código and has no Nova versão | `/companies/<c>/projects/<p>/agents/tools` | Projeto | owner, administrator, developer |
| A tool of the library: its versions, newest first, and Nova versão; a code tool shows each version's code, what it reads and its test result | `/companies/<c>/projects/<p>/agents/tools/<tool>` | Projeto | owner, administrator, developer |
| A conversation with the Construtor, with the draft card of the agent it makes | `/companies/<c>/projects/<p>/agents/construtor/<id>` | Projeto | owner, administrator, developer |
| An agent: the person's conversations with it, the editable configuration (Ligações as selectors, each selected one with its tools beneath, none marked, a write marked `escreve` with its key Pergunta antes / Faz sozinho, Marcar todas as leituras and the free query last with its warning), Publicar and Versões | `/companies/<c>/projects/<p>/agents/<agent>` | Projeto | owner, administrator, developer |
| A conversation with an agent, published or the test one with its draft, inside the agent's page; a write that asks the person is the card Aprovar? in the chat | `/companies/<c>/projects/<p>/agents/<agent>/<id>` | Projeto | owner, administrator, developer |
| Automações of a Projeto: the person's own, with state, next time and actions | `/companies/<c>/projects/<p>/automations` | Projeto | owner, administrator, developer |
| The history of one automation of a Projeto, with its runs | `/companies/<c>/projects/<p>/automations/<id>` | Projeto | owner, administrator, developer |
| Sobre, with its parts Sobre and Versões (`?part=`), where a version is published, or asked to be (Pedir esta) with the open request above the list | `/companies/<c>/projects/<p>/about` | Projeto | owner, administrator, developer, member |
| Quem usa o app | `/companies/<c>/projects/<p>/access` | Projeto | owner, administrator, developer (reads), member (reads) |
| Integrações do Projeto: each connected connection with whether the Projeto may read it, Liberar (whose confirmation says what app, Builder and agents may do) and Tirar | `/companies/<c>/projects/<p>/integrations` | Projeto | owner, administrator, developer (reads), member (reads) |
| Dados do Projeto: the tables of the Projeto's app (Tabelas do app) and the copies released to it (Cópias liberadas), with their row counts | `/companies/<c>/projects/<p>/data` | Projeto | owner, administrator, developer |
| The rows of one table of the app, 50 at a time, read only | `/companies/<c>/projects/<p>/data/<table>` | Projeto | owner, administrator, developer |
| The rows of one copy released to the Projeto, 50 at a time, read only | `/companies/<c>/projects/<p>/data/copies/<table>` | Projeto | owner, administrator, developer |
| Central, Clientes | `/operations/clients` | Central | whoever operates the installation |
| Estado do Hub | `/operations/status` | Central | whoever operates the installation |
| Cadastrar cliente | `/operations/clients/new` | Central | whoever operates the installation |
| Cliente | `/operations/clients/<c>` | Central | whoever operates the installation |

## Boxes of Papéis da empresa (U3)

At 1280 px the sidebar of Configurações is on the left and the page beside it; at 390 px the page
takes the width and the index is the list of Configurações.

```text
1280                                         390
Papéis                    [+ Novo papel]     Papéis        [+ Novo papel]
Papéis de fábrica                            ───────────────────────────
 Dono            Usa tudo ...   1 pessoa     Dono
 Membro          Lê tudo ...    1 pessoa     Usa tudo de todos os conectores
Papéis da empresa                            1 pessoa
 Atendente  Sankhya: 1 operação de Vendas    ...

Papel aberto / Novo papel
 ← Papéis                                    ← Papéis
 Nome do papel [____________]                Nome do papel [________]
 ┌ Sankhya ───────────────────────────┐      ┌ Sankhya ───────────────┐
 │ [x] Vendas  1 de 3       [Detalhe] │      │ [x] Vendas 1 de 3 [Det]│
 │      [x] Pedidos  lê               │      │   [x] Pedidos  lê      │
 │ [ ] Financeiro 0 de 1    [Detalhe] │      └────────────────────────┘
 └────────────────────────────────────┘      [Criar papel]
 [Criar papel]   [Apagar papel]

Agente, Ligações
 [x] Sankhya · Matriz  Funcionando
     [ ] Pedidos
     [ ] Consulta   Consulta livre: roda qualquer SQL no banco inteiro
     [Marcar todas as leituras]
```

## Boxes of the write that asks (24.5 U3)

The card is the plan card's design: the same width as the chat column at 1280 px and the whole
column at 390 px; the buttons stay side by side at 390 px.

```text
Na conversa do agente (1280)                       (390)
 ┌ [logo] O Pedidos quer lançar pedido no  ┐      ┌ [logo] O Pedidos quer      ┐
 │        Sankhya · Matriz                 │      │        lançar pedido no    │
 │ Cliente            1                    │      │        Sankhya · Matriz    │
 │ Itens              2 × produto 11 a R$ 10,00│      │ Cliente            1       │
 │ Total              R$ 20,00             │      │ Itens  2 × produto 11 ...  │
 │ ┃ Um pedido foi enviado às 10:12 e não  │      │ Total              R$ 20,00│
 │ ┃ sabemos se entrou. Confira no ...     │      │ ┃ aviso (só com envio      │
 │                   [Recusar] [Aprovar]   │      │ ┃ aberto da mesma escrita) │
 └─────────────────────────────────────────┘      │      [Recusar] [Aprovar]   │
 Escrever outra mensagem recusa este pedido.      └────────────────────────────┘

Decidido: o título e os campos ficam; no lugar dos botões, uma linha
 Aprovado por você · Pedido 98001 lançado, a confirmar.
 Recusado | Recusado porque você mandou outra mensagem
 | Recusado porque você parou a conversa | Não conseguiu lançar
 | Sem confirmação automática. Veja o que o agente leu e confira a observação Conexus …

Página do agente, Ligações
 [x] Sankhya · Matriz  Funcionando
     [ ] Pedidos
     [x] Lançar pedido  escreve     (Pergunta antes | Faz sozinho)
          o motivo, sob a chave, para quem não tem a ação
```

The key is lit on Pergunta antes by default. Faz sozinho is off for whoever lacks the action, with
the reason under the key.
