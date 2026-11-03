# Etapa 24.3.4: Papéis e pedidos

O roteiro chama esta etapa só de "Papéis e pedidos", logo depois da 24.3.1 e antes da 24.4; o número
24.3.4 é o nome do arquivo que a conferência `check-approval` lê, e o roteiro passa a usá-lo. Pela
regra L5 o cartão entra em `docs/steps/` quando o cartão da 24.3.1 sair no fechamento dela; até lá
vive no seu pull request, e a verificação `second-card` de `check-docs` fica vermelha nele de
propósito. Cada linha citada abaixo foi lida no `main` em `beebd1f9`; o construtor a reabre no `main`
do dia antes de usar, porque a 24.3.2, a 24.3.3 e a 24.3.1 entram antes.

## A página do fundador

**No fim desta etapa** a empresa tem um quarto papel, **Desenvolvedor**, que cria e publica apps,
agentes e automações sem pedir; o **Membro** conversa com o Assistente e, quando quer publicar uma
versão de um app, toca **Pedir para publicar**; um dono ou um administrador vê o pedido no sino e
publica ou recusa. Quem pediu nunca decide o próprio pedido.

**O roteiro de uso.** Padaria Sol: Ana (dona), Bia (administradora), Diego e Bruno (membros). O
Projeto "Encomendas" tem o app na versão 3 publicada. No computador e no celular.

1. A Ana abre **Configurações › Pessoas**, toca **Mudar papel** no Diego e escolhe
   **Desenvolvedor**. O Diego recarrega: no Projeto aparecem **Agentes** e **Automações**, que ele
   antes não via. Ele pede uma mudança ao Builder, a versão 4 fica pronta, ele toca **Publicar** e o
   app abre na versão 4. Ele publica um agente do Projeto, como a Ana faz hoje.
2. O Bruno (membro) abre o Início e conversa com o Assistente, que antes só a Ana e a Bia usavam.
   Ele pede "todo dia às 7h me mande as vendas de ontem": o cartão da automação diz "Só o dono, os
   administradores e os desenvolvedores criam automações." e não tem botão.
3. O Bruno pede ao Builder uma mudança no app; a versão 5 fica pronta. Onde havia **Publicar**
   aparece **Pedir para publicar**. Ele toca, escreve "pronta para a loja" e envia. A linha do
   Projeto mostra "Você pediu para publicar a versão 5." com **Cancelar pedido**.
4. A Ana vê **1** no sino: "Bruno pede para publicar a versão 5 de Encomendas." Ela toca e abre o
   Projeto, com o pedido em cima: a mensagem do Bruno, **Publicar a versão 5** e **Recusar**. Ela
   publica. O Bruno vê no sino "Ana publicou a versão 5 que você pediu." O Diego vê o pedido, mas
   sem os botões: "Só o dono e os administradores decidem pedidos."
5. O Bruno pede a versão 6; a Bia toca **Recusar** e escreve "falta o logo". O Bruno vê no sino
   "Bia recusou publicar a versão 6: falta o logo." Ele pede a versão 7, e o Diego publica a 8
   direto: o pedido da 7 fecha sozinho, e o Bruno vê "Outra versão de Encomendas foi publicada; o
   seu pedido da versão 7 fechou."

**O que você faz, e quando.** Antes: nada; o roteiro precisa de duas pessoas além de você na
empresa, um membro e alguém para virar desenvolvedor. No começo: aprova esta página e responde às
decisões abaixo. No fim: faz o roteiro, diz o que viu e aprova os textos das telas. As suas
respostas de 2026-11-01 já decidiram a forma: a etapa curta logo depois da 24.3 ("2"), quem aprova
é qualquer dono ou administrador ("3"), com o motor o membro pede para publicar e dono,
administrador e desenvolvedor publicam direto ("4 Confirmo"), e o membro conversa com o Assistente
("5"). E a de 2026-11-02, "3A": uma ferramenta da biblioteca é mudada por dono e administrador, e
pelo desenvolvedor quando esta etapa chegar.

**Fica de fora.**
- **Prazo do pedido.** Um pedido espera até alguém decidir, cancelar ou publicar outra versão. Entra
  quando um pedido esquecido aparecer no uso.
- **E-mail do pedido.** O aviso é o sino e a linha do Projeto; o e-mail das automações (24.2) não
  muda. Entra se você pedir.
- **Um liberador por tipo de pedido, uma fila de liberadores, um limite em valor**, como a
  liberação de limites do Sankhya; e **papéis inventados por empresa**. Nenhuma empresa pediu.
- **A escrita com aprovação** ("Aprovar?" antes de um agente gravar) é a 24.5; ela soma um tipo de
  pedido a esta mesma tabela.
- O que as decisões A e B deixam para depois, se você seguir as recomendações.

**O que as referências fazem.** O Appsmith já tem o Desenvolvedor: cria e publica, e quem só vê não
publica; o Mastra, nos papéis dele, deixa publicar o administrador e não o membro. O Activepieces faz
o que você pediu: para quem não publica, o botão **Publish** vira **Request approval**, a versão antiga
segue no ar, quem pediu pode retirar o pedido e quem recusa escreve um motivo, se quiser. O n8n proíbe
quem pediu de aprovar o próprio pedido. Nenhuma faz o pedido vencer sozinho. O Better Auth e o Mastra
não guardam pedidos nem quem aprovou: essa tabela é nossa, feita como a do sino.

**As decisões suas nesta etapa.**

**A. O membro e os agentes.** O roteiro diz "o membro pede para publicar", e a sua resposta "4" fala
de apps. Hoje o membro nem vê **Agentes** ("3.A"), e o Construtor dele gravaria ferramentas na
biblioteca, que pela "3A" só dono, administrador e desenvolvedor mudam.
- **A1. Só apps nesta etapa (recomendo).** O membro pede para publicar versões de app; agentes ficam
  com dono, administrador e desenvolvedor, e o membro continua sem vê-los. Uma etapa curta depois
  soma o pedido de agente à mesma tabela, quando você decidir o que o membro pode num rascunho (mudar
  o de outra pessoa? apagar?). Nativo: o mesmo `newRole` do Better Auth e a mesma tabela de pedidos.
- A2. Agentes também agora: o membro vê **Agentes**, monta rascunhos com o Construtor (sem gravar
  ferramenta nova) e pede para publicar. Mais uma unidade, cerca de 800 linhas, e a exceção da regra
  W34 do guia da web muda no fechamento.

**B. O membro e as automações.** Conversando com o Assistente, o membro vai pedir automações.
- **B1. O cartão diz quem cria (recomendo).** "Só o dono, os administradores e os desenvolvedores
  criam automações.", sem botão; **Automações** continua escondida do membro, como a sua "1 A".
  Segue a regra W34 (mostrar e dizer quem pode). Nativo: o Hub diz no `may` da empresa se a pessoa
  cria automações, e o cartão lê isso.
- B2. O membro pede a automação: o cartão vira **Pedir a um administrador**, e quem aprova cria a
  automação, que roda como o membro. Desfaz a "1 A" (ele passa a ver as suas automações) e soma um
  tipo de pedido.

**C. O desenvolvedor e as automações.** O seu pedido original diz que o desenvolvedor "cria
automações, apps e agentes e publica sozinho". O livro de aprovações registrou a sua resposta "3"
como "qualquer dono ou administrador criar e apagar automações", mas a pergunta 3 do estudo era
quem aprova um pedido; o cartão lê a "3" como a pergunta: quem aprova é dono ou administrador.
- **`C1`. O desenvolvedor cria e apaga as suas automações (recomendo, pelas suas palavras).** Quem
  aprova pedidos continua sendo só dono e administrador.
- `C2`. Só dono e administrador criam automações; o desenvolvedor cria apps e agentes.

**D. Onde o pedido aparece.** As referências se dividem: o Activepieces, o mais parecido (o botão
**Publish** vira **Request approval**), mostra o pedido no próprio fluxo e também numa lista
"Pending approvals" na barra lateral; o GitHub mostra só na execução que espera; o Sankhya tem uma
tela central de liberações.
- **`D1`. No Projeto e no sino (recomendo).** O pedido aparece em cima da área do Projeto e na lista
  de versões, onde se publica hoje; o sino leva até ele. Nenhuma página nova.
- `D2`. Também uma página **Pedidos** da empresa, com os pendentes e os decididos. Mais uma tela; faz
  mais sentido quando a 24.5 trouxer pedidos de vários agentes.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 Os papéis | O papel `developer` (Desenvolvedor) e as capacidades por ação: publicar app, agentes e ferramentas, automações, decidir pedidos; o membro conversa com o Assistente; a empresa responde o `may` de cada pessoa e as telas leem dele, não do papel; o cartão da automação para quem não cria | `packages/hub-api/src/` (`companies.ts`, `failures.ts`), `apps/server/src/hub/identity/`, `apps/server/src/builder/{assistant,automations,agents,tools,controller-kit}/`, `apps/web/src/hub/identity/`, `apps/web/src/routes/_app/companies/$companyId/`, `apps/web/src/hub/projects/project-rail.tsx`, `apps/web/src/builder/{assistant,agents,automations}/` | [security](../guides/security.md) | a 24.3.1 no ar |
| U2 O pedido | A tabela `requests.request`, as rotas de pedir, decidir e cancelar, publicar ao aprovar pelo mesmo `publishVersion`, o pedido que fecha quando outra versão é publicada, e as notificações `REQUEST_OPENED` e `REQUEST_DECIDED` na tabela do sino | `packages/hub-api/src/` (`requests.ts`, `projects.ts`, `notifications.ts`, `failures.ts`, `index.ts`), `apps/server/src/hub/requests/`, `apps/server/src/hub/apps/`, `apps/server/src/hub/projects/`, `apps/server/src/hub/notifications/`, `apps/server/migrations/`, `apps/server/src/main.ts` | [data](../guides/data.md) | U1 |
| U3 As telas do pedido | **Pedir para publicar** onde hoje há **Publicar**; o pedido em cima da área do Projeto e nas Versões, com **Cancelar pedido** para quem pediu e **Publicar a versão n** e **Recusar** para quem decide; as duas linhas novas do sino | `apps/web/src/hub/apps/`, `apps/web/src/hub/projects/`, `apps/web/src/hub/requests/`, `apps/web/src/hub/notifications/`, `docs/reference/screens.md` | [web](../guides/web.md) | U2 |

Nenhuma corre em paralelo: a U2 usa as capacidades da U1, e a U3 as rotas da U2.

**Quando começa** (delivery L1). Depois que o cartão da 24.3.1 sair no fechamento dela e esta página
for aprovada.

**Orçamento de código alterado.** U1: ~650 (o papel, as capacidades e as ações, o `may` da empresa e
a troca das oito leituras de papel na web, o cartão da automação). U2: ~1.100 (uma tabela e duas
migrações, três rotas, a transação de decidir, a notificação geral). U3: ~600 (o botão, a linha do
pedido, a decisão com motivo, o sino). Total da etapa: ~2.350, dentro da regra L2. Testes, gerados e
o OpenAPI ficam fora. Com a A2, mais uma U4 de cerca de 800.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `PATCH /api/companies/{c}/members/{p}` com `role: 'developer'` grava o papel; quem o dá é o dono ou um administrador; um membro ou um desenvolvedor que tenta, `NOT_FOUND` (S10); `mayChangeTo` de cada pessoa da lista inclui `developer` para dono e administrador; o convite aceita `developer`; o rótulo é "Desenvolvedor" | `apps/server/src/hub/identity/memberships.test.ts`, "o desenvolvedor"; `invitations.test.ts` | must |
| 2 | U1 | `PUT …/projects/{p}/published-version` publica para dono, administrador e desenvolvedor; o membro recebe `NOT_FOUND` e a versão publicada não muda | `apps/server/src/hub/apps/publish.test.ts`, "quem publica" | must |
| 3 | U1 | As rotas de agentes e de ferramentas da 24.3 (`…/agents`, `…/agents/{a}/publish`, `…/tools`) respondem ao desenvolvedor como ao administrador; o membro, `NOT_FOUND` em todas, como hoje | `apps/server/src/builder/agents/routes.test.ts` e `builder/tools/routes.test.ts`, "o desenvolvedor" | must |
| 4 | U1 | O membro conversa com o Assistente no Início e no Projeto (`askAssistant` sem capacidade); a mesma conversa de outra pessoa continua `NOT_FOUND` | `apps/server/src/builder/assistant/routes.test.ts`, "o membro conversa" | must |
| 5 | U1 | `POST /api/companies/{c}/automations` cria para dono, administrador e desenvolvedor (com a `C1`); o membro recebe `NOT_FOUND`; a automação de quem virou membro, no próximo disparo, pausa com `SKIPPED`/`OWNER_CANNOT_ASK` como hoje | `apps/server/src/builder/automations/routes.test.ts`, "o desenvolvedor"; `run.test.ts`, "o dono virou membro" | must |
| 6 | U1 | `GET /api/companies/{c}` devolve `may: { publishApps, manageAgents, manageAutomations, decideRequests }`, lido de `allows`, para cada um dos quatro papéis | `apps/server/src/hub/identity/companies.test.ts`, "o que a pessoa pode" | must |
| 6b | U1 | Nenhum arquivo de `apps/web/src` compara `role` com um papel para decidir o que mostrar: as oito leituras de hoje passam a ler `may` | a revisão, por `grep -rnE "role (===|!==) '" apps/web/src --include=*.tsx`, vazio fora dos testes | should |
| 7 | U1 | Na web, o membro vê no Início a caixa do Assistente e as conversas (não mais só os Projetos); não vê **Agentes** nem **Automações** (com A1 e B1); o desenvolvedor vê os dois; o cartão de uma automação proposta a quem não cria mostra "Só o dono, os administradores e os desenvolvedores criam automações." sem botão | `apps/web/src/routes/_app/companies/$companyId/route.test.tsx`, "o membro" e "o desenvolvedor"; `apps/web/src/builder/automations/proposal.test.tsx`, "quem não cria" | must |
| 8 | U2 | `POST /api/companies/{c}/projects/{p}/publish-request` com `{ number, message }` e uma chave de tentativa, por quem não publica, grava um pedido `PENDING` e responde 201 com ele; repetido com a mesma chave, a mesma resposta; uma versão que não está pronta, `APP_VERSION_NOT_FOUND`; com outro pedido aberto no Projeto, 409 `REQUEST_ALREADY_OPEN` com o aberto no corpo; quem publica direto recebe 409 `REQUEST_NOT_NEEDED` | `apps/server/src/hub/requests/requests.test.ts`, "pedir" | must |
| 9 | U2 | Ao abrir o pedido, cada dono e administrador da empresa recebe uma notificação `REQUEST_OPENED` no mesmo commit; quem pediu não recebe; o desenvolvedor não recebe | `requests.test.ts`, "quem é avisado" | must |
| 10 | U2 | `POST /api/companies/{c}/requests/{r}/decision` com `APPROVE` publica a versão pedida pelo mesmo caminho de `PUT …/published-version`, marca o pedido `APPROVED` com quem decidiu e quando, e notifica quem pediu com `REQUEST_DECIDED`, tudo num commit; com `DECLINE` e um motivo opcional (até 280 caracteres), marca `DECLINED` e notifica sem publicar | `requests.test.ts`, "decidir" | must |
| 11 | U2 | Decidir é só de dono e administrador: o desenvolvedor e o membro recebem `NOT_FOUND`; a pessoa que pediu (por exemplo, promovida a administradora depois) recebe 409 `REQUEST_OWN`; um pedido já decidido, cancelado ou fechado, 409 `REQUEST_CLOSED`; duas decisões ao mesmo tempo: uma vale e a outra recebe `REQUEST_CLOSED` | `requests.test.ts`, "quem decide" e "duas decisões" | must |
| 12 | U2 | Aprovar uma versão cuja ligação o Projeto não oferece mais responde `CONNECTOR_NOT_GRANTED`, como publicar; o pedido continua `PENDING` e nada é notificado | `requests.test.ts`, "aprovar o que não publica" | must |
| 13 | U2 | `POST …/requests/{r}/cancel` por quem pediu marca `CANCELLED`, sem notificar; outra pessoa, `NOT_FOUND`; um pedido fechado, `REQUEST_CLOSED` | `requests.test.ts`, "cancelar" | must |
| 14 | U2 | Publicar qualquer versão do Projeto (direto ou por outra aprovação) fecha o pedido aberto dele como `SUPERSEDED` e notifica quem pediu, no mesmo commit da publicação | `requests.test.ts`, "outra versão publicada" | must |
| 15 | U2 | `GET …/projects/{p}` traz `mayPublish` e `publishRequest` (o pedido aberto, com quem pediu, a versão, a mensagem e `mayDecide`/`mayCancel`), ou `null`; um pedido de outra empresa nunca aparece (política de linha) | `apps/server/src/hub/projects/projects.test.ts`, "o pedido aberto"; `apps/server/src/platform/isolation.test.ts`, a tabela nova | must |
| 16 | U2 | `GET /api/companies/{c}/notifications` devolve as linhas `REQUEST_OPENED` e `REQUEST_DECIDED` com o Projeto, a versão, quem pediu ou decidiu e o motivo; as linhas das automações não mudam; tirar da empresa quem pediu apaga os seus pedidos e as notificações deles | `apps/server/src/hub/notifications/notifications.test.ts`, "pedidos"; `requests.test.ts`, "quem sai" | must |
| 17 | U3 | Para quem não publica, o botão de cima da área e o das Versões dizem **Pedir para publicar** e abrem a caixa com a mensagem; depois, a linha "Você pediu para publicar a versão n." com **Cancelar pedido**; com outro pedido aberto, a linha diz quem pediu e não oferece botão; para quem publica, **Publicar** como hoje | `apps/web/src/hub/requests/publish-request.test.tsx`, "pedir para publicar" | must |
| 18 | U3 | Para dono e administrador, o pedido aberto aparece em cima da área com a mensagem, **Publicar a versão n** e **Recusar** (com o motivo opcional); para o desenvolvedor, a linha sem botões e "Só o dono e os administradores decidem pedidos."; `REQUEST_CLOSED` recarrega o Projeto e diz "Este pedido já foi decidido."; `CONNECTOR_NOT_GRANTED` mostra a frase de publicar | `apps/web/src/hub/requests/request-line.test.tsx` | must |
| 19 | U3 | O sino mostra "<nome> pede para publicar a versão n de <Projeto>." e, para quem pediu, "<nome> publicou a versão n que você pediu.", "<nome> recusou publicar a versão n: <motivo>." e "Outra versão de <Projeto> foi publicada; o seu pedido da versão n fechou."; o toque abre a área do Projeto | `apps/web/src/hub/notifications/bell.test.tsx`, "pedidos" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| O botão de publicar (U3), na área do Projeto e nas Versões | sem versão pronta, nenhum botão, como hoje | — | o botão desligado com "Enviando…" | a frase do código na caixa, com Tentar de novo | `APP_VERSION_NOT_FOUND`: a frase de hoje (`onStale`) | quem não publica vê **Pedir para publicar**; com outro pedido aberto, a linha do pedido sem botão | — |
| A linha do pedido (U3), em cima da área | — | sem pedido aberto, a linha não aparece | a área já carrega o Projeto; a linha vem com ele | a decisão que falha: a frase na linha, com Tentar de novo | `REQUEST_CLOSED`: recarrega o Projeto e diz "Este pedido já foi decidido." | o desenvolvedor e outro membro: a linha sem botões, com quem decide | `DECLINED`, `CANCELLED`, `SUPERSEDED`: a linha some; quem pediu lê o desfecho no sino |
| A caixa de recusar (U3) | — | o motivo é opcional | "Recusando…" | a frase na caixa | `REQUEST_CLOSED` como acima | — | — |
| O sino (U3), linhas novas | as linhas de automação de hoje | "Nada por aqui." de hoje | o de hoje | o de hoje | o Projeto apagado: a linha abre "não encontrado" de hoje | cada pessoa lê só as suas | — |
| O cartão da automação proposta (U1) | — | — | — | o de hoje | — | quem não cria: a frase sem botão | — |
| O Início do membro (U1) | a caixa do Assistente, como a da Ana, sem o cartão "Termine de preparar a empresa" | o de hoje | o de hoje | o de hoje | — | **Agentes** e **Automações** não aparecem (A1, B1) | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Role` com `developer`, `ROLE_LABELS.developer` | U1 | a web (Pessoas, convite, o selo do papel), o servidor (`COMPANY_ROLES`, `rankAllows`, `ROLE_WORDS`) |
| `CompanyRead.may` (`publishApps`, `manageAgents`, `manageAutomations`, `decideRequests`) | U1 (`companies.ts`, de `allows`) | a web: o menu da empresa, o do Projeto, o Início, o cartão da automação, a linha do pedido (U3) |
| `Project.mayPublish` | U2 (`projects.ts`, `rightsOf`) | U3 (o botão) |
| `Project.publishRequest` (`PublishRequest`: `id`, `number`, `message`, `requestedBy`, `createdAt`, `mayDecide`, `mayCancel`) | U2 | U3 (a linha) |
| A linha `requests.request` | U2 (pedir, decidir, cancelar, fechar ao publicar) | U2 (o Projeto, as notificações) |
| `NotificationRow` `REQUEST_OPENED` e `REQUEST_DECIDED` | U2 | U3 (o sino) |

**Os desenhos de caixas.** Nenhuma página nova (`D1`). A linha do pedido fica em cima da área do
Projeto, abaixo da linha da versão, na largura da área:

```text
1280                                                     390
| Versão 5 · não publicada        [Abrir app] [Pedir…] | | Versão 5 · não publicada  |
| ┌ Bruno pede para publicar a versão 5 · há 2 min ──┐ | | [Abrir app] [Pedir…]      |
| │ "pronta para a loja"                              │ | | ┌ Bruno pede a versão 5 ┐ |
| │                [Recusar] [Publicar a versão 5]    │ | | │ "pronta para a loja"   │ |
| └───────────────────────────────────────────────────┘ | | │ [Recusar] [Publicar]   │ |
                                                          | └────────────────────────┘ |
```

O protótipo do Construtor não tem esta tela; a linha segue a peça de aviso da Pauta (`DESIGN.md`) e
a linha da versão de hoje (`apps/web/src/hub/projects/area.tsx:70-99`). O construtor da U3 a
desenha nas duas larguras e nos dois temas antes de construir e põe as capturas no pull request.

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Mudar o papel para `developer` (U1; o comando é o de hoje, `changeMemberRole`) | o de hoje: `MEMBER_STALE` pelo `from` | o de hoje: uma transação | `DATABASE_UNAVAILABLE` de hoje | o de hoje | 1 |
| Pedir para publicar (U2) | a mesma chave: a mesma resposta (`attemptKey`); duas chaves: o índice único de um pedido aberto por Projeto deixa um, e a outra recebe `REQUEST_ALREADY_OPEN` | o pedido e as notificações são um commit: nada fica pela metade; a resposta cortada, a tela relê o Projeto e acha o pedido | `DATABASE_UNAVAILABLE`; a tela diz e oferece Tentar de novo | `PUBLISH_REQUESTED` com empresa, Projeto, versão e quem | 8, 9 |
| Decidir (U2) | a linha do pedido é lida com `for update`; a segunda vê o estado novo e recebe `REQUEST_CLOSED` | aprovar publica, fecha e notifica num commit; uma recusa de publicar (`CONNECTOR_NOT_GRANTED`, `APP_VERSION_NOT_FOUND`) desfaz tudo e o pedido segue `PENDING`; a resposta cortada, a tela relê e vê o pedido fechado | `DATABASE_UNAVAILABLE` | `REQUEST_DECIDED` com o desfecho; `APP_VERSION_PUBLISHED` de hoje, com `by` de quem aprovou | 10, 11, 12 |
| Cancelar (U2) | `for update`; a segunda, `REQUEST_CLOSED` | um commit | `DATABASE_UNAVAILABLE` | `REQUEST_CANCELLED` | 13 |
| Publicar direto com um pedido aberto (U2, em `publishVersion`) | dois publicares: o `lockApp` de hoje os põe em fila; o segundo não acha pedido aberto | publicar e fechar o pedido são um commit | o de hoje | `APP_VERSION_PUBLISHED` e `REQUEST_SUPERSEDED` | 14 |
| Pessoa tirada da empresa com pedido aberto (o comando de hoje) | o de hoje | a cascata das chaves estrangeiras apaga o pedido e as suas notificações no mesmo commit | o de hoje | o de hoje | 16 |

## A tabela de referência

Referências lidas nesta etapa: Better Auth 1.7.8 (`node_modules/better-auth`); Mastra `@mastra/core`
1.79.0 (`node_modules/@mastra/core`) e a estante `mastra-1.79` em `4c22623e` (abreviada `M:`); as
outras na estante, cada uma com o seu commit. "lido" é uma linha que o autor do cartão abriu; "relay"
é de um leitor auxiliar, conferida por amostra.

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O papel Desenvolvedor | U1 | três papéis: `Role` (`packages/hub-api/src/companies.ts:15`), `ROLE_LABELS` (`:22-26`), `COMPANY_ROLES` (`apps/server/src/hub/identity/roles.ts:34-42`), passados ao plugin (`auth.ts:254-255`); `member.role` é `text` sem checagem (`hub/identity/tables.ts:236`), lidos | `better-auth@1.7.8`: `newRole` (`dist/plugins/access/access.mjs:71`, lido); Appsmith `fd78f12`: o Developer cria e publica (`AppsmithRole.java:44-52`, `WORKSPACE_PUBLISH_APPLICATIONS`, lido), o App Viewer só lê (`:58-65`, relay); Mastra `M:packages/_internals/auth/src/ee/defaults/roles.ts:32-48`: o admin tem `*:publish` e o member só `*:read`, `*:execute` (lido) | um papel a mais, uma lista de capacidades no código, sem banco | nativo: um `newRole` a mais, um valor em `Role`, um rótulo, um `case` em `rankAllows`; nenhuma migração | — | o pedido do Desenvolvedor (estudo de 2026-11-01); "4 Confirmo"; "3A" (2026-11-02) | — |
| As capacidades por ação (publicar app, agentes e ferramentas, automações, decidir pedidos) | U1 | `ACTIONS` (`admission.ts:42-92`): publicar sem declaração (`:52`), Assistente, agentes e ferramentas emprestando `connection: ['manage']` (`:74,78-80`), lidos; as automações admitem `askAssistant` (`builder/automations/automations.ts:249-253`, `controller-kit/admission.ts:10-13`, lidos) | `better-auth@1.7.8`: `createAccessControl` (`roles.ts:10-17` o usa); n8n `2e855356`: `workflow:publish` é capacidade própria do editor e do admin do projeto (`packages/@n8n/permissions/src/roles/scopes/project-scopes.ee.ts:30,187`, lido); ToolJet `aa67409`: `appRelease` separado de editar (`server/src/entities/group_permissions.entity.ts:82-86`, relay); Dify `8857292`: `APP_RELEASE_AND_VERSION` (`api/controllers/console/app/workflow.py:1331`, relay) | publicar é uma capacidade separada de editar | nativo: quatro declarações novas no `createAccessControl` (`app: publish`, `agent: manage, publish`, `automation: manage`, `request: decide`), cada ação com a sua; o Assistente sem declaração; acaba o empréstimo de `connection: ['manage']` | — | "4 Confirmo", "5 Sua recomendacao" (2026-11-01); "3A" (2026-11-02) | — |
| Quem dá o papel Desenvolvedor | U1 | `rankAllows` (`admission.ts:126-138`), `mayChangeTo` (`hub/identity/memberships.ts:46-55`), `mayInviteAs` (`admission.ts:351-362`), lidos (relay conferido) | `better-auth@1.7.8`: o papel do membro é um texto que o plugin grava (`hub/identity/tables.ts:236`, lido) | o administrador muda papéis abaixo dele | nativo: o `switch` exaustivo ganha `developer`, que não muda ninguém, como o membro; o seletor e o convite leem `Role.options` sozinhos | — | as respostas da etapa 6 sobre quem muda quem | — |
| A tela lê do Hub o que a pessoa pode | U1 | oito leituras de papel na web: `routes/_app/companies/$companyId/route.tsx:64,112`, `index.tsx:23`, `hub/projects/project-rail.tsx:113,121`, `builder/agents/area.tsx:188`, `builder/assistant/project.tsx:27` (lidas as duas primeiras, as outras relay conferido); o Hub já responde `mayDelete` (`hub/projects/projects.ts:60-62`, lido) | Langfuse `8ee97c4`: um mapa só, lido pelo servidor e pela tela (`packages/shared/src/features/rbac/projectAccessRights.ts:118-313`, relay); n8n: `viewerCanDecide` e a razão numa união fechada (`get-workflow-review-request-detail.dto.ts:37-40,58-62`, relay) | a tela recebe a resposta do servidor | nativo: `may` na leitura da empresa, de `allows`, como `mayDelete` (C26) | — | não precisa | — |
| O membro conversa com o Assistente | U1 | `askAssistant` com `MANAGE_CONNECTIONS` (`admission.ts:72-74`, lido); a frase do membro (`builder/assistant/text.ts:63`, relay); o Início do membro mostra o começo do Builder (`index.tsx:20-34`, lido) | Mastra `M:.../defaults/roles.ts:48`: o member executa agentes (`*:execute`, lido) | quem é da empresa usa o agente | nativo: `askAssistant` sem declaração ("toda filiação basta", `admission.ts:110-114`); o Início do membro passa a ser o da dona sem o cartão de preparo | — | "5 Sua recomendacao" (2026-11-01) | — |
| As automações de quem não cria | U1 | a pausa `OWNER_CANNOT_ASK` (`builder/automations/run.ts:79-90,205-215`, lido); o cartão da proposta (`builder/automations/proposal.tsx`, relay); a entrada escondida do membro (`route.tsx:64`, lido) | Mastra `@mastra/core@1.79.0`: `schedules.pause` e `resume` (`dist/docs/references/reference-schedules-overview.md:161-182`, relay) | a agenda pausa e retoma | nativo: a mesma pausa, agora pela ação `manageAutomations`; o cartão lê `may.manageAutomations` e diz quem cria (W34, V29) | — | "1 A" (2026-11-01); a decisão B e a C desta página | — |
| O pedido guardado | U2 | nenhum pedido no Hub (busca por `request`, `approval`, `pedido`, relay); a tabela do sino como modelo (`hub/notifications/tables.ts:30-83`, lido) | Activepieces `f34c43cd`: `flow_approval_request` com quem pediu, a versão, quem decidiu, quando, o estado e o motivo (`packages/core/shared/src/lib/ee/flow-approval/index.ts:5-24`, lido), um pendente por fluxo por índice único parcial (`packages/server/api/src/app/ee/flows/flow-approval/flow-approval-request.entity.ts:70-74`, lido); n8n `workflow_review_request` (relay); Cal.com: o pedido no próprio agendamento, `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED` (`packages/prisma/schema.prisma:843-849`, lido); o Better Auth 1.7.8 não tem fluxo de pedido (estudo de 2026-11-01, `dist/plugins`) e o Mastra 1.79 não guarda quem aprova (`M:packages/core/src/loop/shared/steps/tool-result-commit-core.ts:118`, relay) | uma linha por pedido, um aberto por objeto | embrulhado: uma tabela do Hub pelo Drizzle, com a política da empresa, como a do sino; ela soma ao Activepieces quem decide nunca ser quem pediu, o `CANCELLED` guardado (o Cal.com guarda, o Activepieces apaga) e o `SUPERSEDED` | critérios 8, 13, 15 | "2 Sua rewcomendação" (2026-11-01) | `hub/requests/tables.ts` |
| Quem decide, nunca quem pediu | U2 | — | n8n: "Authors cannot decide on their own review request" (`packages/cli/src/modules/workflow-reviews.ee/workflow-review-request-decision.service.ts:364-366`, lido), mas o admin decide o seu (`workflow-review-authorization.service.ts:64-68`, lido); Activepieces não confere (relay); o GitLab proíbe por padrão (estudo de 2026-11-01, página pública) | uma regra no servidor | embrulhado: `decideRequest` (`request: decide`, dono e administrador) e `decided_by <> requested_by`, sem a exceção do n8n | critério 11 | "3 Por agora qualquer dono ou admnistrador" (2026-11-01) | `hub/requests/requests.ts` |
| Publicar ao aprovar, e o pedido que fecha quando outra versão é publicada | U2 | `publishVersion` (`hub/apps/live.ts:25-65`, lido): admite, tranca o app, confere a versão e as ligações, grava `publishedVersionId` | Activepieces: aprovar publica a versão presa e grava `approverId` (`flow-approval-request.service.ts:110-142`, relay); n8n publica como quem pediu (`decision.service.ts:277-278`, lido) e bloqueia publicar direto com revisão aberta (`workflow-review-publish-guard.service.ts:17-33`, lido); a Factory do Mastra atribui a execução a quem aprovou (`M:mastracode/factory/src/storage/domains/work-items/base.ts:258-262`, lido) e tem `superseded` automático (`:166`, relay) | aprovar executa a ação de publicar | nativo sobre o nosso: o mesmo corpo de `publishVersion` (`publishIn`) na transação da decisão, com quem aprova como quem publica, como a Factory; publicar direto fecha o pedido aberto (`SUPERSEDED`) em vez de bloquear, como o `superseded` da Factory | critérios 10, 12, 14 | "4 Confirmo" (2026-11-01) | `hub/apps/live.ts` |
| O aviso no sino | U2 (servidor), U3 (tela) | `notifications.notification` só de automações: `automation_id`, `automation_name`, `run_id` obrigatórios e três tipos (`hub/notifications/tables.ts:30-83`, lido); `NotificationRow` (`packages/hub-api/src/notifications.ts:22-35`, lido); a política `OWN` (`tables.ts:21,81`, lido); o sino (`apps/web/src/hub/notifications/bell.tsx:48-53`, relay) | Activepieces: só a contagem na barra lateral (`docs/flows/flow-approvals.mdx:34`, lido); Cal.com: e-mail e o selo "Unconfirmed" (relay); n8n: uma caixa de entrada (relay) | quem decide sabe que há pedido | embrulhado: a mesma tabela do sino, com dois tipos e `request_id`, e uma política de inserir da empresa, porque quem avisa não é quem lê | critérios 9, 16, 19 | `C1` da 24.2 (o sino, 2026-11-01) | — |
| A tela do pedido | U3 | **Publicar** sem checagem de papel (`apps/web/src/hub/apps/publish.tsx:17-88`, `hub/projects/area.tsx:91-99`, `hub/apps/versions.tsx:48-50`, relay conferido) | Activepieces: o botão vira "Request approval" (`packages/web/src/app/builder/flow-canvas/widgets/publish-flow-reminder-widget.tsx:183`, lido), a faixa "Approval pending" e a versão antiga segue no ar, quem pediu retira o pedido (`docs/flows/flow-approvals.mdx:24-30`, lido), recusar com motivo opcional (`:38-39`, lido); Cal.com: um corpo de decidir com `confirmed` e `reason` opcional (`packages/prisma/zod-utils.ts:310-319`, lido) | o botão muda de nome; o pedido aparece onde se publica | nativo: as peças da Pauta (`apps/web/src/ui/`); a linha do pedido em cima da área (`D1`) | critérios 17, 18 | a decisão D desta página | `apps/web/src/hub/requests/request-line.tsx`, `publish-request.tsx` |
| O prazo do pedido | fica de fora: nenhuma referência de publicação vence | — | Activepieces, n8n e Cal.com não vencem (relay, buscas por `expire`, `ttl`, `timeout`); só o formulário humano do Dify (relay) | — | nativo quando entrar: uma agenda do Mastra (`mastra.schedules`) que fecha o pedido velho | — | não precisa | — |
| Papéis inventados por empresa | fica de fora: ninguém pediu | — | `better-auth@1.7.8`: `dynamicAccessControl` (`dist/plugins/organization/organization.mjs:570-579`, lido) | papéis no banco, por empresa | nativo quando entrar: `dynamicAccessControl` | — | não precisa | — |
| A página Pedidos da empresa | fica de fora com a `D1` | — | Activepieces: "Pending approvals" na barra lateral (`docs/flows/flow-approvals.mdx:34`, lido); n8n: a caixa de revisões (relay) | uma lista central | nativo quando entrar: uma lista sobre a mesma tabela | — | a decisão D desta página | — |

Buscado: Better Auth 1.7.8 e Mastra 1.79.0 instalados; na estante, Appsmith `fd78f12`, ToolJet `aa67409`,
Lowcoder `81f1134`, Budibase `624d68a`, n8n `2e855356`, Activepieces `f34c43cd`, Dify `8857292`,
Langfuse `8ee97c4`, Cal.com `54343aa`, Twenty `b76d0217`, Open WebUI `f7ac7ee`, Documenso `cd0cc5f`,
Supabase `cb52c0f4`, a Factory do Mastra em `mastra-1.79`. Deixados de lado: os construtores de app por
IA da estante (bolt.diy, dyad, open-lovable, chef, vibesdk) não têm papéis de empresa nem pedido de
publicação; o Sankhya, o GitHub e o GitLab ficam como no estudo de 2026-11-01 (páginas públicas).
O Mastra tem um controle de papéis próprio (`server.rbac`, com `stored-agents:publish`), mas é da
edição paga (`M:ee/LICENSE`) e autoriza as rotas dele, não as nossas (relay); não serve aqui.

**A medida do transplante.** Nada vem do repositório antigo.

**A dívida.**
- Um pedido sem prazo pode ficar esquecido. Gatilho: o primeiro pedido aberto há mais de 7 dias no
  uso.
- Quem entra como administrador depois de aberto o pedido não recebe a notificação dele; vê o pedido
  na área do Projeto. Gatilho: uma empresa com mais de três pessoas que decidem.

As issues `next-card`: esta etapa toma o item "Who publishes is every member" da
https://github.com/developmentconexus-ops/conexus/issues/440 (o fechamento o tira da issue). As
outras abertas não tocam os papéis nem a publicação e esperam as suas etapas.

## U1 Os papéis

**Base e modelo.** `main` depois da 24.3.1. Sonnet: um papel e capacidades no Better Auth, as ações
da admissão e as leituras da web; nada de concorrência nova.

### As linhas da tabela

O papel Desenvolvedor, as capacidades por ação, quem muda quem, o `may` da empresa, o membro com o
Assistente, as automações de quem não cria (as seis primeiras linhas da tabela de referência).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/companies.ts` | Muda: `Role` ganha `developer` entre `admin` e `member` (a ordem é a do maior ao menor, `companies.ts:14-15`); `ROLE_LABELS.developer = 'Desenvolvedor'`; `CompanyRead` (`getCompany`, `:134-147`) ganha `may` | o servidor e a web inteiros |
| `apps/server/src/hub/identity/` | Muda `roles.ts` (as declarações e o papel), `admission.ts` (`ACTIONS`, `ActionRule`, `rankAllows`), `companies.ts` (`may` em `:88-92`) | `auth.ts:254-255` passa os papéis ao plugin, sem mudar |
| `apps/server/src/builder/controller-kit/admission.ts` | Muda: `admitAsker` segue em `askAssistant`; cria `admitAutomationOwner` (`manageAutomations`) | `builder/assistant/`, `builder/automations/` |
| `apps/server/src/builder/automations/` | Muda `automations.ts` (cada operação admite `manageAutomations`, comentário `:249-253`), `run.ts` (`mayAsk`, `:79-90`, passa a `manageAutomations`), `routes.ts:20` | — |
| `apps/server/src/builder/assistant/instructions.ts` | Muda `ROLE_WORDS` (`:23-27`): `developer: 'developer'` | `assistant.ts:119` |
| `apps/server/src/builder/tools/tools.ts`, `builder/agents/` | Nada além dos nomes: as ações `readAgents`, `manageAgents`, `publishAgent` mudam de declaração na admissão | — |
| `apps/web/src/routes/_app/companies/$companyId/` | Muda `route.tsx:64,112` e `index.tsx:23-33`: leem `may` do contexto; o membro ganha a caixa do Assistente e as conversas; o contexto da rota passa `may` (`enter-company.ts`) | — |
| `apps/web/src/hub/projects/project-rail.tsx` | Muda `:113,121`: `may.manageAgents`, `may.manageAutomations` | — |
| `apps/web/src/builder/agents/area.tsx`, `builder/assistant/project.tsx`, `builder/automations/proposal.tsx`, os `text.ts` deles | Muda: `area.tsx:188` e `project.tsx:27` leem `may`; a frase do membro na conversa do Projeto sai (ele conversa); o cartão da proposta mostra a frase de quem cria quando `may.manageAutomations` é falso; `MEMBERS_CANNOT` de agentes vira "Só o dono, os administradores e os desenvolvedores usam os agentes do Projeto." | — |
| `apps/web/src/hub/identity/` | Nada além do que `Role.options` já dá: o seletor de papel (`member-actions.tsx:152-179`) e o convite (`invite-form.tsx:23-24`) listam o Desenvolvedor sozinhos; o convite continua com o último da lista (Membro) por padrão | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/companies.ts
export const Role = z.enum(['owner', 'admin', 'developer', 'member'])
export const CompanyMay = z.object({
  publishApps: z.boolean(),
  manageAgents: z.boolean(),
  manageAutomations: z.boolean(),
  decideRequests: z.boolean(),
})
// getCompany.success.body: { company, role, mayInviteAs, may: CompanyMay }

// apps/server/src/hub/identity/roles.ts: as declarações a mais em ACCESS_CONTROL
//   app: ['publish'], agent: ['manage', 'publish'], automation: ['manage'], request: ['decide']
// owner e admin: as de hoje + todas essas; developer: memberAc + project: ['create'] + app, agent,
// automation (sem request, sem connection, sem modelAccount, sem appAccess); member: as de hoje.

// apps/server/src/hub/identity/admission.ts, as ações que mudam ou nascem
//   publishAppVersion: APP_PUBLISH (era: nenhuma)
//   askAssistant: nenhuma (era: MANAGE_CONNECTIONS)
//   readAgents, manageAgents: AGENT_MANAGE; publishAgent: AGENT_PUBLISH (eram: MANAGE_CONNECTIONS)
//   manageAutomations (nova): AUTOMATION_MANAGE, locks: true
//   decideRequest (nova): REQUEST_DECIDE, locks: true   (usada pela U2)
// rankAllows: case 'developer': return false (como o membro); o administrador muda entre
// administrador, desenvolvedor e membro.
```

- **O dono de cada fato** (C26): quem pode o quê é `COMPANY_ROLES` e `ACTIONS`; `may` é lido de
  `allows` em `companies.ts`, como `mayDelete` em `hub/projects/projects.ts:60-62` (o arquivo
  modelo: cumpre C26; o `rightsOf` dele é a forma). A web nunca compara `role`.
- **O estado**: nenhum novo; `Role` é a união.
- **Saem**: a frase `MEMBERS_CANNOT` de `builder/assistant/text.ts:63` e o comentário de
  `admission.ts:75-77` ("The step of roles and requests makes `publishAgent` ...").

### As skills e a leitura

`organization-best-practices`, `better-auth-best-practices`, `pstack:tdd`; as linhas de
`docs/reference/stack.md` para `apps/server/src/hub/identity/` e `apps/web/src/`.
[security](../guides/security.md) S6 a S12; [web](../guides/web.md) W34.

### A ordem do trabalho

1. **A prova primeiro.** `memberships.test.ts`, "o desenvolvedor": a dona muda Diego para
   `developer` e `publish.test.ts`, "quem publica": o desenvolvedor publica e o membro recebe
   `NOT_FOUND`. Falham hoje.
2. `companies.ts` (hub-api), `roles.ts`, `admission.ts`. Regras: S6, S7, S10, C26. Funções:
   `better-auth@1.7.8`: `createAccessControl`, `newRole` (`dist/plugins/access/access.mjs:71`).
3. `controller-kit/admission.ts`, `automations/` e `run.ts`: as automações passam a
   `manageAutomations`; `mayAsk` continua devolvendo `MAY_NOT` quando a pessoa não pode, e o motivo
   `OWNER_CANNOT_ASK` não muda de nome (é um código já guardado nas execuções).
4. `companies.ts` (servidor): `may`. Depois a web: o contexto da rota da empresa e as oito leituras.
5. O cartão da proposta (`proposal.tsx`) e os textos. Regras: W34, V29.

### Como se prova

Os critérios 1 a 7 pelos testes nomeados, na porta pública (as rotas, T5). Comando: os testes
tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- Um teste de hoje que espera `NOT_FOUND` do membro no Assistente: é o comportamento que esta
  etapa muda pela resposta "5"; atualizar o teste e dizer no pull request quais.
- Alguma rota lê `connection: ['manage']` para algo que não é gerir ligações: relatar antes de mudar.

## U2 O pedido

**Base e modelo.** `main` depois da U1. Opus: uma transação que cruza `hub/apps`, `hub/projects` e
`hub/notifications`, com duas decisões concorrentes e a publicação que fecha o pedido.

### As linhas da tabela

O pedido guardado, quem decide, publicar ao aprovar e fechar ao publicar, o aviso no sino (servidor).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/requests/` | Cria `tables.ts` (schema `requests`, tabela `request`), `requests.ts` (pedir, decidir, cancelar, fechar), `routes.ts`, `public.ts` | `main.ts`; `hub/apps/` pela porta `closeRequests` |
| `apps/server/src/hub/apps/live.ts` | Muda: `publishVersion` (`:25-65`) separa o corpo numa `publishIn(tx, deps, input)` que a decisão chama na sua transação; recebe a porta `closeRequests(tx, project, by)`, como já recebe `ungranted` | `hub/apps/routes.ts:81-83`, `hub/requests/` |
| `apps/server/src/hub/projects/projects.ts` | Muda: `rightsOf` (`:60-62`) ganha `mayPublish`; o Projeto traz `publishRequest` pela porta de `hub/requests` | `projects/routes.ts:58` |
| `apps/server/src/hub/notifications/` | Muda `tables.ts` (as colunas de automação passam a opcionais, `request_id` com chave estrangeira em cascata, os tipos novos e as suas checagens), `notifications.ts` (a porta `requestChanged`, o `list`), `public.ts` | `hub/requests/` |
| `apps/server/migrations/` | Cria `…_e2434_requests` (a tabela, a mudança das notificações) e `…_e2434_requests_grants` (o SQL das permissões, D10, D11) | — |
| `apps/server/database-grants.sql` e o retrato do catálogo | Muda: as permissões novas | `catalog.test.ts` |
| `packages/hub-api/src/` | Cria `requests.ts` (o contrato); muda `projects.ts` (`Project`), `notifications.ts` (`NotificationRow`), `failures.ts`, `index.ts` | a web |
| `apps/server/src/main.ts` | Muda: liga `hub/requests` a `hub/apps`, `hub/projects` e `hub/notifications` | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/requests.ts
export const RequestId = z.uuid().brand('RequestId')
export const REQUEST_MESSAGE_MAX = 280
export const RequestState = z.enum(['PENDING', 'APPROVED', 'DECLINED', 'CANCELLED', 'SUPERSEDED'])
export const PublishRequest = z.object({
  id: RequestId,
  kind: z.literal('PUBLISH_APP_VERSION'),
  number: z.int().positive(),
  message: z.string().max(REQUEST_MESSAGE_MAX),
  requestedBy: z.object({ id: PersonId, name: z.string() }),
  createdAt: z.iso.datetime(),
  mayDecide: z.boolean(),
  mayCancel: z.boolean(),
})
// POST /api/companies/{companyId}/projects/{projectId}/publish-request, attemptKey: true
//   body { number, message }; 201 { request: PublishRequest }
//   falhas: NOT_FOUND, APP_VERSION_NOT_FOUND, REQUEST_ALREADY_OPEN (409, corpo { request }),
//           REQUEST_NOT_NEEDED (409), IDEMPOTENCY_CONFLICT, SESSION_REQUIRED, DATABASE_UNAVAILABLE
// POST /api/companies/{companyId}/requests/{requestId}/decision
//   body { decision: 'APPROVE' } | { decision: 'DECLINE', reason?: string (até 280) }
//   200 { state: 'APPROVED' | 'DECLINED' }
//   falhas: NOT_FOUND, REQUEST_CLOSED (409), REQUEST_OWN (409), APP_VERSION_NOT_FOUND,
//           CONNECTOR_NOT_GRANTED, SESSION_REQUIRED, DATABASE_UNAVAILABLE
// POST /api/companies/{companyId}/requests/{requestId}/cancel
//   204; falhas: NOT_FOUND, REQUEST_CLOSED, SESSION_REQUIRED, DATABASE_UNAVAILABLE

// packages/hub-api/src/projects.ts
//   Project ganha mayPublish: z.boolean(), publishRequest: PublishRequest.nullable()

// packages/hub-api/src/notifications.ts, NotificationRow ganha
//   { kind: 'REQUEST_OPENED', id, createdAt, read, projectId: ProjectId, projectName, number,
//     requestedBy: { id, name } }
//   { kind: 'REQUEST_DECIDED', id, createdAt, read, projectId, projectName, number,
//     outcome: 'APPROVED' | 'DECLINED' | 'SUPERSEDED', decidedBy: { id, name } | null,
//     reason: string | null }
// `OfNotification.automation` sai do comum e vai para os três tipos de automação.
```

A tabela `requests.request`:

| Coluna | Tipo e restrição |
| --- | --- |
| `id` | `uuid` chave primária |
| `attempt_key` | `text not null`, `unique (company_id, attempt_key)`, como `connection_attempt_key` (`hub/connectors/tables.ts:60,84`): a mesma chave devolve o mesmo pedido |
| `company_id`, `requested_by` | `text not null`; chave estrangeira `(company_id, requested_by)` para `auth.member` com cascata (D17); `company_id` para `auth.company` com cascata |
| `project_id` | `text not null`, chave estrangeira para o Projeto com cascata |
| `kind` | `text not null`, `check (kind in ('PUBLISH_APP_VERSION'))`; a 24.5 soma o seu |
| `number` | `integer not null check (number > 0)`: a versão pedida |
| `message` | `text not null default ''`, `check (char_length(message) <= 280)` |
| `state` | `text not null`, `check` nos cinco estados |
| `decided_by`, `decided_at`, `reason` | `text`, `timestamptz`, `text`; `check ((state in ('PENDING','CANCELLED')) = (decided_at is null))`; `decided_by` sem chave estrangeira (fica quando quem decidiu sai) |
| `created_at` | `timestamptz not null` |
| índice único | `(company_id, project_id) where state = 'PENDING'`: um pedido aberto por Projeto |
| política | `policy(SCOPE_ROLES.COMPANY, 'all', company_id = scoped.companyId)` |

As notificações: `automation_id`, `automation_name` e `run_id` perdem o `not null`; nasce
`request_id uuid` com chave estrangeira para `requests.request` em cascata; a checagem
`notification_kind` soma os dois tipos; cada tipo novo exige `request_id` e nenhuma coluna de
automação, e os três antigos exigem as de automação e nenhum `request_id`; `unique (request_id,
person_id, kind)`. A política `OWN` continua para ler e marcar como lida; uma política de inserir com
`company_id = scoped.companyId` deixa quem pede avisar quem decide (a chave estrangeira para o membro
continua conferindo que a pessoa é da empresa).

As permissões (o segundo arquivo de migração, D10, D11, com a palavra do fundador na aprovação deste
cartão): `GRANT USAGE ON SCHEMA requests TO hub_company`; `GRANT SELECT, INSERT ON requests.request`;
`GRANT UPDATE (state, decided_by, decided_at, reason) ON requests.request`. Nas notificações, nenhuma
permissão nova: a política de inserir é estrutura da migração da tabela.

- **Cada estado** como união (C21): `RequestState`; a decisão como união em `decision`.
- **Cada id** com a sua marca (C23): `RequestId`, parseado na rota.
- **O dono de cada fato** (C26): o pedido aberto de um Projeto é a linha `PENDING`, lida só em
  `hub/requests`; quem decide é `allows(role, 'decideRequest')` e `decided_by <> requested_by`;
  publicar é só `publishIn`.
- **O esquema de cada entrada** (C27): os corpos acima, em `requests.ts`.
- **O arquivo modelo**: `hub/notifications/tables.ts` para a tabela e a política (cumpre C21 nas
  checagens por tipo, C26); `hub/apps/live.ts` para a transação de publicar (cumpre C26; não tem id
  novo).

### As skills e a leitura

`fastify-best-practices`, `pstack:tdd`; as linhas de `docs/reference/stack.md` para
`apps/server/src/hub/` e `migrations/`. [data](../guides/data.md) D5, D6, D10, D11, D15, D17, D22;
[security](../guides/security.md) S7, S8, S10.

### A ordem do trabalho

1. **A prova primeiro.** `requests.test.ts`, "decidir": o membro pede, a dona aprova, a versão fica
   publicada e o pedido `APPROVED`. Falha hoje (a rota não existe).
2. A tabela e as migrações (`npm run generate -w apps/server` para a tabela, o SQL das permissões à mão). Rodar
   `npm run migrations` localmente (uma migração de teste com `SET` solto é recusada).
3. `publishIn` em `live.ts`, sem mudar o que `PUT …/published-version` responde
   (`publish.test.ts` continua passando sem mudar).
4. `hub/requests/requests.ts`: pedir (a versão `ready`, `REQUEST_NOT_NEEDED` para quem tem
   `publishAppVersion`, o índice único), decidir (`decideRequest` com `locks: true`, a linha com
   `for update`, `REQUEST_OWN`, `publishIn` com quem decide, a notificação), cancelar, e
   `closeRequests` (o `SUPERSEDED` dentro de `publishIn`). Regras: S8, D22.
5. As notificações: a migração, a porta `requestChanged`, o `list` com o Projeto e as pessoas.
6. O Projeto: `mayPublish`, `publishRequest`. As rotas e `main.ts`.

### Como se prova

Os critérios 8 a 16 pelos testes nomeados, contra o PostgreSQL de teste (`docs/how-to/local-database.md`),
na porta pública. "duas decisões": duas transações que aprovam e recusam ao mesmo tempo, uma vence.
`isolation.test.ts`: um pedido de outra empresa não aparece nem se decide. Comando: os testes
tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- A política de inserir das notificações pedir mais do que a linha acima: relatar; é uma permissão
  (D11).
- Aprovar precisar de outra regra de publicar além de `publishIn`: parar; dois donos de uma regra.
- Uma notificação de automação de hoje deixar de ser lida pelo `list`: parar; é um defeito do sino
  no ar.

## U3 As telas do pedido

**Base e modelo.** `main` depois da U2. Sonnet: um botão, uma linha e as linhas do sino sobre rotas
prontas.

### As linhas da tabela

A tela do pedido; o aviso no sino (a web).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/requests/` | Cria `publish-request.tsx` (a caixa de pedir, com a mensagem), `request-line.tsx` (a linha do pedido: quem pediu, a mensagem, **Cancelar pedido**, **Publicar a versão n**, **Recusar** com o motivo), `queries.ts`, `text.ts`, `public.ts` | `hub/projects/area.tsx`, `hub/apps/versions.tsx` |
| `apps/web/src/hub/apps/` | Muda `publish.tsx` (`:17-88`): com `project.mayPublish` falso, o botão é **Pedir para publicar** e abre a caixa de `hub/requests`; `versions.tsx:48-50` ("Pedir esta") | — |
| `apps/web/src/hub/projects/area.tsx` | Muda `:70-99`: a linha do pedido abaixo da linha da versão | — |
| `apps/web/src/hub/notifications/bell.tsx` | Muda `:48-53,61,93`: os dois tipos novos, o toque abre a área do Projeto | — |
| `docs/reference/screens.md` | Muda: a linha do pedido | — |

### Os contratos que a unidade cria

Nenhum do servidor. Pedir manda `{ number, message }` com uma chave de tentativa por envio da caixa;
no 409 `REQUEST_ALREADY_OPEN` a tela relê o Projeto e mostra a linha do pedido aberto. Decidir e
cancelar, no `REQUEST_CLOSED`, relêem o Projeto e mostram "Este pedido já foi decidido.". Os textos
desta página do fundador são os da tela; os novos vão à aprovação dele no fim.

### As skills e a leitura

`shadcn`, `impeccable`, `pstack:tdd`; as linhas de `docs/reference/stack.md` para `apps/web/src/`.
[web](../guides/web.md) W7, W30, W34; [design](../guides/design.md) V29.

### A ordem do trabalho

1. **A prova primeiro.** `publish-request.test.tsx`: o membro toca **Pedir para publicar**, manda a
   mensagem e vê "Você pediu para publicar a versão 5." com **Cancelar pedido**, contra o servidor
   dublê (`apps/web/src/platform/test-hub-versions.tsx`). Falha hoje.
2. A caixa e a linha; o botão de `publish.tsx` e de `versions.tsx`.
3. A decisão: **Publicar a versão n** e **Recusar** com o motivo; `REQUEST_CLOSED` e
   `CONNECTOR_NOT_GRANTED`.
4. O sino. As capturas a 1280 e 390, claro e escuro, no pull request.

### Como se prova

Os critérios 17 a 19 pelos testes de `apps/web` com o servidor dublê; larguras e temas pela QA da
etapa. Comando: os testes tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- A linha precisa de um campo que `PublishRequest` não traz: relatar; nunca ler outra rota para
  montá-la.
- O desenho da linha pedir uma peça que a Pauta não tem: relatar, com a captura.
