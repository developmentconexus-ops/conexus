# Etapa 24.3.4: Papéis e pedidos

O roteiro chama esta etapa de "24.3.4 Papéis e pedidos", logo depois da 24.3.1 e antes da 24.4; o
número é o nome do arquivo que a conferência `check-approval` lê. Pela regra L5 o cartão entra em
`docs/steps/` só quando o cartão da 24.3.1 sair no fechamento dela: os dois juntos no `main` fariam
a verificação `second-card` de `check-docs` recusar o trilho. Até lá vive no seu pull request. Cada
linha citada abaixo foi lida no `main` em `beebd1f9`; o construtor a reabre no `main` do dia antes
de usar, porque a 24.3.2, a 24.3.3 e a 24.3.1 entram antes.

## A página do fundador

**No fim desta etapa** a empresa tem um quarto papel, **Desenvolvedor**, que cria e publica apps,
agentes e automações sem pedir; o **Membro** conversa com o Assistente e, quando quer publicar uma
versão de um app, toca **Pedir para publicar**; um dono ou um administrador vê o pedido no sino e
publica ou recusa. Quem pediu nunca decide o próprio pedido.

**O roteiro de uso.** Padaria Sol: você é a Ana (dona); o Diego e o Bruno são membros. O Projeto
"Encomendas" tem o app na versão 3 publicada. Três navegadores (ou três perfis) lado a lado, um por
pessoa; num deles, a largura do celular. Cada versão nova é uma mudança pequena pedida ao Builder.

1. A Ana abre **Configurações › Pessoas**, toca **Mudar papel** no Diego e escolhe
   **Desenvolvedor**. O Diego recarrega: no Projeto aparecem **Agentes** e **Automações**, que ele
   antes não via. Ele pede uma mudança ao Builder, a versão 4 fica pronta, ele toca **Publicar** e o
   app abre na versão 4.
2. O Bruno (membro) abre o Início e conversa com o Assistente, que antes só a Ana usava. Ele pede
   "todo dia às 7h me lembre de conferir o caixa": o cartão da automação diz "Só o dono, os
   administradores e os desenvolvedores criam automações." e não tem botão.
3. O Bruno pede ao Builder uma mudança no app; a versão 5 fica pronta. Onde havia **Publicar**
   aparece **Pedir para publicar**. Ele toca, escreve "pronta para a loja" e envia. A área do
   Projeto mostra "Você pediu para publicar a versão 5." com **Cancelar pedido**. O Diego, no
   navegador dele, vê o pedido sem botões: "Só o dono e os administradores decidem pedidos."
4. A Ana vê **1** no sino: "Bruno pede para publicar a versão 5 de Encomendas." Ela toca, abre o
   Projeto com o pedido em cima e toca **Publicar a versão 5**. O Bruno vê no sino "Ana publicou a
   versão 5 que você pediu."
5. O Bruno pede a versão 6; a Ana toca **Recusar** e escreve "falta o logo". O Bruno vê "Ana recusou
   publicar a versão 6: falta o logo." Ele pede a versão 6 de novo. O Diego faz a versão 7 e a
   publica direto: o pedido da 6 fecha sozinho, e o Bruno vê "Outra versão de Encomendas foi
   publicada; o seu pedido da versão 6 fechou."

**O que você faz, e quando.** Antes: nada; o roteiro precisa de duas pessoas além de você na
empresa, dois membros, um dos quais vira desenvolvedor. No começo: aprova esta página e responde às
decisões abaixo. No fim: faz o roteiro, diz o que viu e aprova os textos das telas. As suas
respostas de 2026-11-01 já decidiram a forma: a etapa curta logo depois da 24.3 ("2"), quem aprova
é qualquer dono ou administrador ("3"), com o motor o membro pede para publicar e dono,
administrador e desenvolvedor publicam direto ("4 Confirmo"), e o membro conversa com o Assistente
("5"). E a de 2026-11-02, "3A": uma ferramenta da biblioteca é mudada por dono e administrador, e
pelo desenvolvedor quando esta etapa chegar.

**A sua palavra sobre as permissões do banco (regra D11).** Aprovar esta página é também a sua
palavra para duas permissões novas do Hub: ler, criar e mudar o estado dos pedidos
(`requests.request`), e ler, criar e marcar como lidos os avisos de pedido
(`notifications.request_notice`). Nenhuma permissão de hoje muda.

**Fica de fora.**
- **Prazo do pedido.** Um pedido espera até alguém decidir, cancelar ou publicar outra versão. Entra
  quando um pedido esquecido aparecer no uso.
- **E-mail do pedido.** O aviso é o sino e a área do Projeto; o e-mail das automações (24.2) não
  muda. Entra se você pedir.
- **Um liberador por tipo de pedido, uma fila de liberadores, um limite em valor**, como a
  liberação de limites do Sankhya; e **papéis inventados por empresa**. Nenhuma empresa pediu.
- **A escrita com aprovação** ("Aprovar?" antes de um agente gravar) é a 24.5; ela soma um tipo de
  pedido a esta mesma tabela.
- O que as decisões A, B e D deixam para depois, se você seguir as recomendações.

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
- **`A1`. Só apps nesta etapa (recomendo).** O membro pede para publicar versões de app; agentes
  ficam com dono, administrador e desenvolvedor, e o membro continua sem vê-los. Uma etapa curta
  depois soma o pedido de agente à mesma tabela, quando você decidir o que o membro pode num
  rascunho (mudar o de outra pessoa? apagar?). Nativo: o papel é o do Better Auth, e a tabela de
  pedidos é a mesma.
- `A2`. Agentes também agora: o membro vê **Agentes**, monta rascunhos com o Construtor (sem gravar
  ferramenta nova) e pede para publicar. Mais uma unidade, cerca de 800 linhas, e a exceção da regra
  W34 do guia da web muda no fechamento.

**B. O membro e as automações.** Conversando com o Assistente, o membro vai pedir automações.
- **`B1`. O cartão diz quem cria (recomendo).** "Só o dono, os administradores e os desenvolvedores
  criam automações.", sem botão; **Automações** continua escondida do membro, como a sua "1 A".
  Segue a regra W34 (mostrar e dizer quem pode). Nativo: o Hub diz à tela se a pessoa cria
  automações, e o cartão lê isso.
- `B2`. O membro pede a automação: o cartão vira **Pedir a um administrador**, e quem aprova cria a
  automação, que roda como o membro. Desfaz a "1 A" (ele passa a ver as suas automações) e soma um
  tipo de pedido.

**C. O desenvolvedor e as automações.** O seu pedido original diz que o desenvolvedor "cria
automações, apps e agentes e publica sozinho". O livro de aprovações registrou a sua resposta "3"
como "qualquer dono ou administrador criar e apagar automações", mas a pergunta 3 do estudo era
quem aprova um pedido. O cartão lê a "3" como a pergunta: quem aprova é dono ou administrador. Se
você confirmar, o commit de aprovação emenda a linha do livro, como o cartão da 24.2 fez com o "3".
- **`C1`. O desenvolvedor cria e apaga as suas automações (recomendo, pelas suas palavras).** Quem
  aprova pedidos continua sendo só dono e administrador.
- `C2`. Só dono e administrador criam automações; o desenvolvedor cria apps e agentes.

**D. Onde o pedido aparece.** As referências se dividem: o Activepieces, o mais parecido, mostra o
pedido no próprio fluxo e também numa lista "Pending approvals" na barra lateral; o GitHub mostra só
na execução que espera; o Sankhya tem uma tela central de liberações.
- **`D1`. No Projeto e no sino (recomendo).** O pedido aparece em cima da área do Projeto e na lista
  de versões, onde se publica hoje; o sino leva até ele. Nenhuma página nova.
- `D2`. Também uma página **Pedidos** da empresa, com os pendentes e os decididos. Mais uma tela; faz
  mais sentido quando a 24.5 trouxer pedidos de vários agentes.

**E. O que o Assistente do membro lê.** Hoje só quem gere as ligações conversa com o Assistente, e
ele lê os dados de toda ligação da empresa (o ERP, as vendas). Abrir a conversa ao membro ("5"),
sem mais nada, daria a qualquer membro a leitura desses dados no Início, sem que um administrador
os libere para ele.
- **`E1`. O membro lê só o que o Projeto libera (recomendo).** No Início, o Assistente do membro não
  lê nenhuma ligação (ele conversa, pede automações e apps); na conversa de um Projeto, lê as
  ligações que o administrador liberou para aquele Projeto, como o app lê. Dono, administrador e
  desenvolvedor leem no Início como hoje.
- `E2`. O membro lê todas as ligações da empresa no Início, como o dono.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 Os papéis | O papel `developer` (Desenvolvedor) e uma declaração por ação: publicar app, agentes e ferramentas, automações, o Assistente; o membro conversa com o Assistente e lê só o que o Projeto libera (`E1`); a empresa diz à tela o que a pessoa pode, e a tela lê disso, não do papel; o cartão da automação para quem não cria | `packages/hub-api/src/companies.ts`, `apps/server/src/hub/identity/`, `apps/server/src/hub/connectors/`, `apps/server/src/builder/`, `apps/web/src/hub/identity/`, `apps/web/src/routes/_app/companies/$companyId/`, `apps/web/src/hub/projects/project-rail.tsx`, `apps/web/src/builder/`, `apps/web/src/platform/`, `apps/web/src/hub/connectors/test-hub.tsx`, `scripts/removals.json`, `docs/reference/screens.md` | [security](../guides/security.md) | a 24.3.1 no ar |
| U2 O pedido | A tabela `requests.request`, as rotas de pedir, decidir e cancelar, publicar ao aprovar pelo mesmo corpo de `publishVersion`, o pedido que fecha quando outra versão é publicada, a tabela `notifications.request_notice` com os avisos `REQUEST_OPENED` e `REQUEST_DECIDED`, e as duas linhas novas do sino | `packages/hub-api/src/`, `apps/server/src/hub/{requests,apps,projects,notifications,identity}/`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `apps/server/src/main.ts`, `apps/web/src/hub/notifications/`, `apps/web/src/platform/`, `apps/web/src/builder/conversation/`, `apps/web/sweep-*.ts`, `scripts/removals.json` | [data](../guides/data.md) | U1 |
| U3 As telas do pedido | **Pedir para publicar** onde hoje há **Publicar**; o pedido em cima da área do Projeto e nas Versões, com **Cancelar pedido** para quem pediu e **Publicar a versão n** e **Recusar** para quem decide | `apps/web/src/hub/{apps,projects,requests}/`, `docs/reference/screens.md` | [web](../guides/web.md) | U2 |

Nenhuma corre em paralelo: a U2 usa as declarações da U1, e a U3 as rotas da U2. Cada unidade
termina verde sozinha: o contrato que muda desce com o primeiro implementador, junto com as dublês
da web que o leem.

**Quando começa** (delivery L1). Depois que o cartão da 24.3.1 sair no fechamento dela e esta página
for aprovada.

**Orçamento de código alterado.** U1: ~750 (o papel e as declarações, as ações, o `may` da empresa e
a troca das sete leituras de papel na web, o recorte das ligações do membro, o cartão da automação,
as dublês). U2: ~1.300 (duas tabelas e duas migrações, três rotas, a transação de decidir, a porta
de publicar, os avisos, o `list` do sino e as suas duas linhas na tela). U3: ~500 (o botão, a linha
do pedido, as caixas de pedir e de recusar). Total da etapa: ~2.550, dentro da regra L2. Testes,
gerados e o OpenAPI ficam fora. Com a `A2`, mais uma U4 de cerca de 800.

**O que o fechamento muda** (L20): o guia da web, W30 (o desenvolvedor vê **Automações**; o Início
do membro passa a ter a conversa) e W34 (a exceção de **Automações** e **Agentes** passa a dizer
"o membro", com o desenvolvedor de fora dela); a linha do livro para o "3" (decisão C) entra no
commit de aprovação, não no fechamento.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `PATCH /api/companies/{c}/members/{p}` com `role: 'developer'` grava o papel; quem o dá é o dono ou um administrador; um membro ou um desenvolvedor que tenta, `NOT_FOUND` (S10); `mayChangeTo` de cada pessoa da lista inclui `developer` para dono e administrador; `POST /api/companies/{c}/invitations` aceita `developer`; o rótulo é "Desenvolvedor" | `apps/server/src/hub/identity/memberships.test.ts`, "o desenvolvedor"; `invitations.test.ts`, "convidar desenvolvedor" | must |
| 2 | U1 | `PUT /api/companies/{c}/projects/{p}/published-version` publica para dono, administrador e desenvolvedor; o membro recebe `NOT_FOUND` e a versão publicada não muda | `apps/server/src/hub/apps/publish.test.ts`, "quem publica" | must |
| 3 | U1 | As rotas de agentes e de ferramentas da 24.3 (`…/agents`, `…/agents/{a}/publish`, `…/tools`) respondem ao desenvolvedor como ao administrador; o membro, `NOT_FOUND` em todas, como hoje | `apps/server/src/builder/agents/routes.test.ts` e `builder/tools/routes.test.ts`, "o desenvolvedor" | must |
| 4 | U1 | O membro abre e escreve uma conversa em `…/assistant/conversations` e na rota do Mastra `/agent-controller/assistant/…`, no Início e no Projeto; a conversa de outra pessoa continua `NOT_FOUND` | `apps/server/src/builder/assistant/routes.test.ts`, "o membro conversa" | must |
| 5 | U1 | Com a `E1`: na conversa do Início de um membro, `GET …/assistant/connections` não oferece nenhuma ligação e a leitura de uma ligação da empresa responde `NOT_GRANTED`; na conversa de um Projeto, só as ligações liberadas a ele; dono, administrador e desenvolvedor no Início, todas as usáveis, como hoje | `apps/server/src/hub/connectors/assistant-port.test.ts`, "o membro" | must |
| 6 | U1 | `POST /api/companies/{c}/automations` cria para dono, administrador e desenvolvedor (com a `C1`); o membro recebe `NOT_FOUND`; a automação de quem virou membro, no próximo disparo, pausa com `SKIPPED`/`OWNER_CANNOT_ASK` como hoje | `apps/server/src/builder/automations/routes.test.ts`, "o desenvolvedor"; `run.test.ts`, "o dono virou membro" | must |
| 7 | U1 | `GET /api/companies/{c}` devolve `may: { manageAgents, manageAutomations }`, lido de `allows`, para cada um dos quatro papéis | `apps/server/src/hub/identity/companies.test.ts`, "o que a pessoa pode" | must |
| 8 | U1 | Nenhum arquivo de `apps/web/src` fora dos testes e das dublês compara `role` com um papel para decidir o que mostrar: as sete leituras de hoje passam a ler `may`; fica só `hub/identity/enter-company.ts:49`, o apelido, que é do dono por regra própria | a revisão, por `grep -rnE "role (===\|!==) '" apps/web/src --include=*.ts --include=*.tsx \| grep -vE "\.test\.tsx?:\|/test-[^/]*:"` | should |
| 9 | U1 | Na web, o membro vê no Início a caixa do Assistente e as conversas (não mais só os Projetos) e escreve na conversa do Projeto; não vê **Agentes** nem **Automações** (com `A1` e `B1`); o desenvolvedor vê os dois; o cartão de uma automação proposta a quem não cria mostra "Só o dono, os administradores e os desenvolvedores criam automações." sem botão | `apps/web/src/routes/_app/companies/$companyId/route.test.tsx`, "o membro" e "o desenvolvedor"; `apps/web/src/builder/automations/proposal.test.tsx`, "quem não cria" | must |
| 10 | U2 | `POST /api/companies/{c}/projects/{p}/publish-request` com `{ number, message }` e uma chave de tentativa, por quem não publica, grava um pedido `PENDING` e responde 201 com ele; a mesma chave, a mesma resposta; a mesma chave com outro corpo, `IDEMPOTENCY_CONFLICT`; uma mensagem de 281 caracteres, `REQUEST_MALFORMED`; uma versão que não está pronta, `APP_VERSION_NOT_FOUND`; a versão já publicada, 409 `PUBLISH_REQUEST_ALREADY_LIVE`; com outro pedido aberto no Projeto, 409 `PUBLISH_REQUEST_ALREADY_OPEN`; quem publica direto, 409 `PUBLISH_REQUEST_NOT_NEEDED` | `apps/server/src/hub/requests/requests.test.ts`, "pedir" | must |
| 11 | U2 | Ao abrir o pedido, cada dono e administrador da empresa recebe um aviso `REQUEST_OPENED` no mesmo commit; quem pediu e o desenvolvedor não recebem | `requests.test.ts`, "quem é avisado" | must |
| 12 | U2 | `POST /api/companies/{c}/requests/{r}/decision` com `APPROVE` publica a versão pedida pelo mesmo corpo de `PUT …/published-version`, marca o pedido `APPROVED` com quem decidiu e deixa exatamente um aviso `REQUEST_DECIDED` para quem pediu, num commit; com `DECLINE` e um motivo opcional (281 caracteres: `REQUEST_MALFORMED`), marca `DECLINED` e avisa sem publicar | `requests.test.ts`, "decidir" | must |
| 13 | U2 | Decidir é só de dono e administrador: o desenvolvedor e o membro recebem `NOT_FOUND`; a pessoa que pediu (promovida a administradora depois) recebe 409 `PUBLISH_REQUEST_OWN`; um pedido já fechado, 409 `PUBLISH_REQUEST_CLOSED`; duas decisões ao mesmo tempo: uma vale e a outra recebe `PUBLISH_REQUEST_CLOSED` | `requests.test.ts`, "quem decide" e "duas decisões" | must |
| 14 | U2 | Decidir e publicar direto ao mesmo tempo: nenhum dos dois recebe erro de banco; se o publicar vem antes, a decisão recebe `PUBLISH_REQUEST_CLOSED`; se a aprovação vem antes, o publicar publica a sua versão sobre ela | `requests.test.ts`, "decidir e publicar ao mesmo tempo" | must |
| 15 | U2 | Aprovar uma versão cuja ligação o Projeto não oferece mais responde `CONNECTOR_NOT_GRANTED`, como publicar; o pedido continua `PENDING` e nenhum aviso nasce | `requests.test.ts`, "aprovar o que não publica" | must |
| 16 | U2 | `POST /api/companies/{c}/requests/{r}/cancel` por quem pediu marca `CANCELLED`, sem aviso; outra pessoa recebe `NOT_FOUND`, com o pedido aberto ou fechado (quem pediu é conferido antes do estado, S10); quem pediu, num pedido fechado, `PUBLISH_REQUEST_CLOSED` | `requests.test.ts`, "cancelar" | must |
| 17 | U2 | Publicar direto a versão pedida fecha o pedido como `APPROVED` por quem publicou, com o aviso "publicou a versão n que você pediu"; publicar outra versão o fecha como `SUPERSEDED`, com o seu aviso; publicar de novo a versão já publicada não muda nada; quem fecha o próprio pedido não recebe aviso | `requests.test.ts`, "publicar com um pedido aberto" | must |
| 18 | U2 | `GET …/projects/{p}` e `POST …/projects` trazem `mayPublish` e `publishRequest` (o pedido aberto, com o nome de quem pediu, a versão, a mensagem e `mayDecide`/`mayCancel` de quem lê), ou `null`; um pedido de outra empresa nunca aparece nem se decide (política de linha) | `apps/server/src/hub/projects/projects.test.ts`, "o pedido aberto"; `apps/server/src/platform/isolation.test.ts`, as tabelas novas | must |
| 19 | U2 | `GET /api/companies/{c}/notifications` devolve as linhas `REQUEST_OPENED` e `REQUEST_DECIDED` com o Projeto, a versão, quem pediu ou decidiu (`null` para quem saiu) e o motivo, junto das de automação, que não mudam; tirar da empresa quem pediu, ou apagar o Projeto, apaga os pedidos e os seus avisos | `apps/server/src/hub/notifications/notifications.test.ts`, "pedidos"; `requests.test.ts`, "quem sai" | must |
| 20 | U2 | O sino mostra "<nome> pede para publicar a versão n de <Projeto>." e, para quem pediu, "<nome> publicou a versão n que você pediu.", "<nome> recusou publicar a versão n: <motivo>." (sem motivo, termina em "n."), "Outra versão de <Projeto> foi publicada; o seu pedido da versão n fechou." e, quando quem decidiu saiu da empresa, "A versão n que você pediu foi publicada." e "O pedido da versão n foi recusado."; o toque abre a área do Projeto | `apps/web/src/hub/notifications/bell.test.tsx`, "pedidos" | must |
| 21 | U3 | Para quem não publica, o botão de cima da área e o das Versões dizem **Pedir para publicar** e abrem a caixa com a mensagem; depois, a linha "Você pediu para publicar a versão n." com **Cancelar pedido**; com outro pedido aberto, a linha diz quem pediu e não oferece botão; `PUBLISH_REQUEST_ALREADY_OPEN` relê o Projeto e mostra a linha; para quem publica, **Publicar** como hoje | `apps/web/src/hub/requests/publish-request.test.tsx`, "pedir para publicar" | must |
| 22 | U3 | Para dono e administrador, o pedido aparece em cima da área com a mensagem, **Publicar a versão n** e **Recusar** (com o motivo opcional); para o desenvolvedor e outro membro, a linha sem botões e "Só o dono e os administradores decidem pedidos."; `PUBLISH_REQUEST_CLOSED` relê o Projeto e diz "Este pedido já foi decidido."; `CONNECTOR_NOT_GRANTED` mostra a frase de publicar | `apps/web/src/hub/requests/request-line.test.tsx` | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pessoas e o convite (U1) | — | o de hoje | o de hoje | o de hoje | o de hoje (`MEMBER_STALE`) | o membro e o desenvolvedor não veem **Mudar papel** nem o convite, como o membro hoje | — |
| O Início do membro (U1) | a caixa do Assistente, como a da Ana, sem o cartão "Termine de preparar a empresa" | o de hoje | o de hoje | o de hoje | — | **Agentes** e **Automações** não aparecem (`A1`, `B1`) | — |
| A conversa do Projeto do membro (U1) | a de hoje do dono | a de hoje | a de hoje | a de hoje | a de hoje | sai a frase de hoje que o impede; ele escreve | — |
| A área de Agentes de quem mudou de papel (U1) | — | — | — | — | — | quem virou membro lê "Só o dono, os administradores e os desenvolvedores usam os agentes do Projeto." | — |
| O cartão da automação proposta (U1) | — | — | — | o de hoje | — | quem não cria: a frase sem botão | — |
| O sino, linhas novas (U2) | as linhas de automação de hoje | "Nada por aqui." de hoje | o de hoje | o de hoje | o Projeto apagado leva o aviso junto (a cascata); nada a abrir | cada pessoa lê só os seus | quem decidiu saiu: a frase sem nome |
| O botão de publicar (U3), na área do Projeto e nas Versões | sem versão pronta, nenhum botão, como hoje | — | o botão desligado com "Enviando…" | a frase do código na caixa, com Tentar de novo | `APP_VERSION_NOT_FOUND`: a frase de hoje (`onStale`) | quem não publica vê **Pedir para publicar**; com outro pedido aberto, a linha do pedido sem botão | `PUBLISH_REQUEST_ALREADY_LIVE`: relê o Projeto |
| A caixa de pedir (U3) | — | a mensagem é opcional | "Enviando…" | a frase na caixa | `PUBLISH_REQUEST_ALREADY_OPEN`: fecha e relê | — | — |
| A linha do pedido (U3), em cima da área | — | sem pedido aberto, a linha não aparece | vem com o Projeto | a decisão que falha: a frase na linha, com Tentar de novo | `PUBLISH_REQUEST_CLOSED`: relê o Projeto e diz "Este pedido já foi decidido." | o desenvolvedor e outro membro: a linha sem botões, com quem decide | `DECLINED`, `CANCELLED`, `SUPERSEDED`: a linha some; quem pediu lê o desfecho no sino |
| A caixa de recusar (U3) | — | o motivo é opcional | "Recusando…" | a frase na caixa | `PUBLISH_REQUEST_CLOSED` como acima | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Role` com `developer`, `ROLE_LABELS.developer` | U1 | a web (Pessoas, convite, o selo do papel), o servidor (`COMPANY_ROLES`, `rankAllows`, `ROLE_WORDS`) |
| `CompanyRead.may` (`manageAgents`, `manageAutomations`) | U1 (`hub/identity/companies.ts`, de `allows`) | a web: o menu da empresa, o do Projeto, o Início, a área de Agentes, o cartão da automação |
| `Project.mayPublish` | U2 (`hub/projects/projects.ts`, `rightsOf`) | U3 (o botão) |
| `Project.publishRequest` (`PublishRequest`: `id`, `number`, `message`, `requestedBy`, `createdAt`, `mayDecide`, `mayCancel`) | U2 (`hub/requests`, pela porta de `hub/projects`) | U3 (a linha) |
| A linha `requests.request` | U2 (pedir, decidir, cancelar, fechar ao publicar) | U2 (o Projeto, o `list` do sino) |
| A linha `notifications.request_notice` | U2 (`hub/notifications`, pela porta de `hub/requests`) | U2 (o `list`, a tela do sino) |
| `NotificationRow` `REQUEST_OPENED` e `REQUEST_DECIDED` | U2 | U2 (o sino) |

**Os desenhos de caixas.** Nenhuma página nova (`D1`). A linha do pedido fica em cima da área do
Projeto, abaixo da linha da versão, na largura da área; para quem decide:

```text
1280                                                     390
| Versão 5 · não publicada                 [Abrir app] | | Versão 5 · não publicada  |
| ┌ Bruno pede para publicar a versão 5 · há 2 min ──┐ | | [Abrir app]               |
| │ "pronta para a loja"                              │ | | ┌ Bruno pede a versão 5 ┐ |
| │                [Recusar] [Publicar a versão 5]    │ | | │ "pronta para a loja"   │ |
| └───────────────────────────────────────────────────┘ | | │ [Recusar] [Publicar]   │ |
                                                          | └────────────────────────┘ |
```

Para quem pediu, e para quem não decide:

```text
| ┌ Você pediu para publicar a versão 5 · há 2 min ──┐ |   | ┌ Bruno pede a versão 5 ┐ |
| │ "pronta para a loja"          [Cancelar pedido]   │ |   | │ Só o dono e os         │ |
| └───────────────────────────────────────────────────┘ |   | │ administradores        │ |
                                                            | │ decidem pedidos.       │ |
                                                            | └────────────────────────┘ |
```

A caixa de pedir e a de recusar são a caixa de diálogo da Pauta, nas duas larguras:

```text
┌ Pedir para publicar a versão 5 ──────┐   ┌ Recusar a versão 5 ─────────────────┐
│ Um dono ou um administrador decide.  │   │ Motivo (opcional)                    │
│ Mensagem (opcional)                  │   │ [ falta o logo                     ] │
│ [ pronta para a loja               ] │   │                                      │
│            [Cancelar] [Pedir]        │   │            [Voltar] [Recusar]        │
└──────────────────────────────────────┘   └──────────────────────────────────────┘
```

O seletor de papel de Pessoas e o convite ganham a linha **Desenvolvedor** entre **Administrador** e
**Membro**, sem mudar de forma; as linhas novas do sino têm a forma das de automação de hoje (o ícone,
a frase, o tempo). O protótipo do Construtor não tem estas telas; a linha segue a peça de aviso da
Pauta (`DESIGN.md`) e a linha da versão de hoje (`apps/web/src/hub/projects/area.tsx:70-99`). O
construtor da U3 as desenha nas duas larguras e nos dois temas antes de construir e põe as capturas
no pull request.

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Mudar o papel para `developer` (U1; o comando é o de hoje, `changeMemberRole`) | o de hoje: `MEMBER_STALE` pelo `from` | o de hoje: uma transação | `DATABASE_UNAVAILABLE` de hoje | o de hoje | 1 |
| Pedir para publicar (U2) | a mesma chave: a mesma resposta; duas chaves: as duas trancam o app (`lockApp`) e o índice único de um pedido aberto por Projeto deixa um; a outra recebe `PUBLISH_REQUEST_ALREADY_OPEN` | o pedido e os avisos são um commit; os decisores são lidos com `for key share`, e quem sai da empresa no meio espera o commit; a resposta cortada, a tela relê o Projeto e acha o pedido | `DATABASE_UNAVAILABLE`; a tela diz e oferece Tentar de novo | `PUBLISH_REQUESTED` com empresa, Projeto, versão e quem | 10, 11 |
| Decidir (U2) | as trancas vão numa ordem só, o app antes do pedido, nos três caminhos (pedir, decidir, publicar): a decisão tranca o app, depois o pedido com `for update`, e confere de novo `PENDING`; a segunda decisão vê o estado novo e recebe `PUBLISH_REQUEST_CLOSED` | aprovar grava `APPROVED`, publica e avisa num commit; uma recusa de publicar (`CONNECTOR_NOT_GRANTED`, `APP_VERSION_NOT_FOUND`) desfaz tudo e o pedido segue `PENDING`; a resposta cortada, a tela relê e vê o pedido fechado | `DATABASE_UNAVAILABLE` | `PUBLISH_REQUEST_DECIDED` com o desfecho; `APP_VERSION_PUBLISHED` de hoje, com `by` de quem aprovou | 12, 13, 14, 15 |
| Cancelar (U2) | o pedido com `for update`; o segundo, `PUBLISH_REQUEST_CLOSED`; cancelar não tranca o app e não forma ciclo | um commit | `DATABASE_UNAVAILABLE` | `PUBLISH_REQUEST_CANCELLED` | 16 |
| Publicar direto com um pedido aberto (U2, em `publishIn`) | dois publicares: o `lockApp` de hoje os põe em fila; o segundo não acha pedido aberto; contra uma decisão, a ordem das trancas acima | publicar e fechar o pedido são um commit | o de hoje | `APP_VERSION_PUBLISHED` e `PUBLISH_REQUEST_CLOSED_BY_PUBLISH` com o desfecho | 14, 17 |
| Pessoa tirada da empresa com pedido aberto (o comando de hoje) | o de hoje | a cascata das chaves estrangeiras apaga o pedido e os seus avisos no mesmo commit | o de hoje | o de hoje | 19 |

## A tabela de referência

Referências lidas nesta etapa: Better Auth 1.7.8 (`node_modules/better-auth`); Mastra `@mastra/core`
1.79.0 (`node_modules/@mastra/core`) e a estante `mastra-1.79` em `4c22623e` (abreviada `M:`); as
outras na estante, cada uma com o seu commit. "lido" é uma linha que o autor do cartão abriu; "relay"
é de um leitor auxiliar, conferida por amostra.

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O papel Desenvolvedor | U1 | três papéis: `Role` (`packages/hub-api/src/companies.ts:15`), `ROLE_LABELS` (`:22-26`), `COMPANY_ROLES` (`apps/server/src/hub/identity/roles.ts:34-42`), passados ao plugin (`auth.ts:254-255`); `member.role` é `text` sem checagem (`hub/identity/tables.ts:236`), lidos | `better-auth@1.7.8`: `newRole` (`dist/plugins/access/access.mjs:71`, lido); Appsmith `fd78f12`: o Developer cria e publica (`AppsmithRole.java:44-57`, `WORKSPACE_PUBLISH_APPLICATIONS` em `:52`, lido), o App Viewer só lê (`:58-65`, relay); Mastra `M:packages/_internals/auth/src/ee/defaults/roles.ts:32-48`: o admin tem `*:publish` e o member só `*:read`, `*:execute` (lido) | um papel a mais, uma lista de capacidades no código, sem banco | nativo: um `newRole` a mais, um valor em `Role`, um rótulo, um `case` em `rankAllows`; nenhuma migração | — | o pedido do Desenvolvedor (estudo de 2026-11-01); "4 Confirmo"; "3A" (2026-11-02) | — |
| As capacidades por ação (publicar app, agentes e ferramentas, automações, o Assistente, pedir e decidir) | U1, U2 | `ACTIONS` (`admission.ts:42-92`): publicar sem declaração (`:52`), Assistente, agentes e ferramentas emprestando `connection: ['manage']` (`:74,78-80`), lidos; as automações admitem `askAssistant` (`builder/automations/automations.ts:249-253`, `controller-kit/admission.ts:10-13`, lidos) | `better-auth@1.7.8`: `createAccessControl` (`roles.ts:10-17` o usa); n8n `2e855356`: `workflow:publish` é capacidade própria do editor e do admin do projeto (`packages/@n8n/permissions/src/roles/scopes/project-scopes.ee.ts:30,187`, lido); ToolJet `aa67409`: `appRelease` separado de editar (`server/src/entities/group_permissions.entity.ts:82-86`, relay); Dify `8857292`: `APP_RELEASE_AND_VERSION` (`api/controllers/console/app/workflow.py:1331`, relay) | publicar é uma capacidade separada de editar | nativo: declarações novas no `createAccessControl` (`app: publish`, `agent: manage, publish`, `automation: manage`, `assistant: ask, readCompany` na U1; `request: create, decide` na U2), cada ação com a sua; acaba o empréstimo de `connection: ['manage']` | — | "4 Confirmo", "5 Sua recomendacao" (2026-11-01); "3A" (2026-11-02) | — |
| Quem dá o papel Desenvolvedor | U1 | `rankAllows` (`admission.ts:126-138`), `mayChangeTo` (`hub/identity/memberships.ts:46-55`), `mayInviteAs` (`admission.ts:351-362`), lidos (relay conferido) | `better-auth@1.7.8`: o papel do membro é um texto que o plugin grava (`hub/identity/tables.ts:236`, lido) | o administrador muda papéis abaixo dele | nativo: o `switch` exaustivo ganha `developer`, que não muda ninguém, como o membro; o seletor e o convite leem `Role.options` sozinhos | — | as respostas da etapa 6 sobre quem muda quem | — |
| A tela lê do Hub o que a pessoa pode | U1 | sete leituras de papel na web: `routes/_app/companies/$companyId/route.tsx:64,112`, `index.tsx:23`, `hub/projects/project-rail.tsx:113,121`, `builder/agents/area.tsx:188`, `builder/assistant/project.tsx:27` (lidas as duas primeiras, as outras relay conferido); o Hub já responde `mayDelete` (`hub/projects/projects.ts:60-62`, lido) | Langfuse `8ee97c4`: um mapa só, lido pelo servidor e pela tela (`packages/shared/src/features/rbac/projectAccessRights.ts:118-313`, relay); n8n: `viewerCanDecide` e a razão numa união fechada (`get-workflow-review-request-detail.dto.ts:37-40,58-62`, relay) | a tela recebe a resposta do servidor | nativo: `may` na leitura da empresa, de `allows`, como `mayDelete` (C26) | — | não precisa | — |
| O membro conversa com o Assistente | U1 | `askAssistant` com `MANAGE_CONNECTIONS` (`admission.ts:72-74`, lido); a frase do membro (`builder/assistant/text.ts:63`, relay); o Início do membro mostra o começo do Builder (`index.tsx:20-34`, lido) | Mastra `M:.../defaults/roles.ts:48`: o member executa agentes (`*:execute`, lido) | quem é da empresa usa o agente | nativo: `askAssistant` com `assistant: ['ask']`, dado aos quatro papéis; o Início do membro passa a ser o da dona sem o cartão de preparo | — | "5 Sua recomendacao" (2026-11-01) | — |
| O que o Assistente do membro lê | U1 | `mayAsk` admite por `askAssistant` e `readable` só confere isso (`hub/connectors/assistant-port.ts:85-130`, lido); `offeredIn` sem Projeto oferece toda ligação usável da empresa, com Projeto só as liberadas (`hub/connectors/builder-port.ts:73-103`, lido) | Mastra `M:.../defaults/roles.ts:48`: executar um agente não dá as credenciais dele (relay); o app do Projeto lê só o que o Projeto libera (`builder-port.ts:73-103`, lido) | o lugar decide o que se lê | nativo: `offered` e `readable` pedem `assistantReadCompany` (`assistant: ['readCompany']`, dono, administrador e desenvolvedor) no Início; o Projeto segue com o recorte de hoje | — | a decisão E desta página | — |
| As automações de quem não cria | U1 | a pausa `OWNER_CANNOT_ASK` (`builder/automations/run.ts:79-90,205-215`, lido); o cartão da proposta (`builder/automations/proposal.tsx`, relay); a entrada escondida do membro (`route.tsx:64`, lido) | Mastra `@mastra/core@1.79.0`: `schedules.pause` e `resume` (`dist/docs/references/reference-schedules-overview.md:161-182`, relay) | a agenda pausa e retoma | nativo: a mesma pausa, agora pela ação `manageAutomations`; o cartão lê `may.manageAutomations` e diz quem cria (W34, V29) | — | "1 A" (2026-11-01); as decisões B e C desta página | — |
| O pedido guardado | U2 | nenhum pedido no Hub (busca por `request`, `approval`, `pedido`, relay); a tabela do sino como modelo (`hub/notifications/tables.ts:30-83`, lido) | Activepieces `f34c43cd`: `flow_approval_request` com quem pediu, a versão, quem decidiu, quando, o estado e o motivo (`packages/core/shared/src/lib/ee/flow-approval/index.ts:5-24`, lido), um pendente por fluxo por índice único parcial (`packages/server/api/src/app/ee/flows/flow-approval/flow-approval-request.entity.ts:70-74`, lido); n8n `workflow_review_request` (relay); Cal.com `54343aa`: o pedido no próprio agendamento, `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED` (`packages/prisma/schema.prisma:843-849`, lido); o Better Auth 1.7.8 não tem fluxo de pedido (estudo de 2026-11-01, `dist/plugins`) e o Mastra 1.79 não guarda quem aprova (`M:packages/core/src/loop/shared/steps/tool-result-commit-core.ts:118`, relay) | uma linha por pedido, um aberto por objeto | embrulhado: uma tabela do Hub pelo Drizzle, com a política da empresa, como a do sino; ela soma ao Activepieces quem decide nunca ser quem pediu, o `CANCELLED` guardado (o Cal.com guarda, o Activepieces apaga) e o `SUPERSEDED` | critérios 10, 16, 18 | "2 Sua rewcomendação" (2026-11-01) | `hub/requests/tables.ts`, `requests.ts`, `routes.ts`, `public.ts` |
| Quem decide, nunca quem pediu | U2 | — | n8n: "Authors cannot decide on their own review request" (`packages/cli/src/modules/workflow-reviews.ee/workflow-review-request-decision.service.ts:364-366`, lido), mas o admin decide o seu (`workflow-review-authorization.service.ts:64-68`, lido); Activepieces não confere (relay); o GitLab proíbe por padrão (estudo de 2026-11-01, página pública) | uma regra no servidor | embrulhado: `decideRequest` (`request: decide`, dono e administrador) e `PUBLISH_REQUEST_OWN` no código, sem a exceção do n8n e sem checagem na tabela | critério 13 | "3 Por agora qualquer dono ou admnistrador" (2026-11-01) | — |
| Publicar ao aprovar, e o pedido que fecha quando outra versão é publicada | U2 | `publishVersion` (`hub/apps/live.ts:25-65`, lido): admite, tranca o app, confere a versão e as ligações, grava `publishedVersionId` | Activepieces: aprovar publica a versão presa e grava `approverId` (`flow-approval-request.service.ts:110-142`, relay); n8n publica como quem pediu (`decision.service.ts:278-279`, lido) e bloqueia publicar direto com revisão aberta (`workflow-review-publish-guard.service.ts:17-33`, lido); a Factory do Mastra atribui a execução a quem aprovou (`M:mastracode/factory/src/storage/domains/work-items/base.ts:259-262`, lido) e tem `superseded` automático (`:166`, relay) | aprovar executa a ação de publicar | nativo sobre o nosso: o corpo de `publishVersion` vira `publishIn`, chamado na transação da decisão com quem aprova como quem publica, como a Factory; publicar direto fecha o pedido aberto em vez de bloquear, como o `superseded` da Factory | critérios 12, 14, 15, 17 | "4 Confirmo" (2026-11-01) | — |
| O aviso no sino | U2 | `notifications.notification` só de automações: `automation_id`, `automation_name`, `run_id` obrigatórios e três tipos (`hub/notifications/tables.ts:30-83`, lido); `NotificationRow` (`packages/hub-api/src/notifications.ts:22-35`, lido); a política `OWN` (`tables.ts:21,81`, lido); o sino (`apps/web/src/hub/notifications/bell.tsx:47-64`, relay conferido) | Activepieces: só a contagem na barra lateral (`docs/flows/flow-approvals.mdx:34`, lido); Cal.com: e-mail e o selo "Unconfirmed" (relay); n8n: uma caixa de entrada (relay) | quem decide sabe que há pedido | embrulhado: uma tabela ao lado da do sino, só aditiva (D6), com a política de inserir da empresa porque quem avisa não é quem lê; o `list` junta as duas; as linhas de automação não mudam | critérios 11, 19, 20 | `C1` da 24.2 (o sino, 2026-11-01) | `hub/notifications/request-notices.ts` |
| A tela do pedido | U3 | **Publicar** sem checagem de papel (`apps/web/src/hub/apps/publish.tsx:17-88`, `hub/projects/area.tsx:91-99`, `hub/apps/versions.tsx:48-50`, relay conferido) | Activepieces: o botão vira "Request approval" (`packages/web/src/app/builder/flow-canvas/widgets/publish-flow-reminder-widget.tsx:183`, lido), a faixa "Approval pending" e a versão antiga segue no ar, quem pediu retira o pedido (`docs/flows/flow-approvals.mdx:24-30`, lido), recusar com motivo opcional (`:38-39`, lido); Cal.com: um corpo de decidir com `confirmed` e `reason` opcional (`packages/prisma/zod-utils.ts:310-319`, lido) | o botão muda de nome; o pedido aparece onde se publica | nativo: as peças da Pauta (`apps/web/src/ui/`); a linha do pedido em cima da área (`D1`) | critérios 21, 22 | a decisão D desta página | `apps/web/src/hub/requests/request-line.tsx`, `publish-request.tsx` |
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
- Quem entra como administrador depois de aberto o pedido não recebe o aviso dele; vê o pedido na
  área do Projeto. Gatilho: uma empresa com mais de três pessoas que decidem.

As issues `next-card`: esta etapa toma o item "Who publishes is every member" da
https://github.com/developmentconexus-ops/conexus/issues/440 (o fechamento o tira da issue). As
outras abertas não tocam os papéis nem a publicação e esperam as suas etapas.

## U1 Os papéis

**Base e modelo.** `main` depois da 24.3.1. Sonnet: um papel e declarações no Better Auth, as ações
da admissão, o recorte de uma leitura e as leituras da web; nada de concorrência nova.

### As linhas da tabela

O papel Desenvolvedor, as capacidades por ação (as da U1), quem muda quem, a tela lê do Hub, o
membro com o Assistente, o que o Assistente do membro lê, as automações de quem não cria.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/companies.ts` | Muda: `Role` ganha `developer` entre `admin` e `member` (a ordem é a do maior ao menor, `companies.ts:14-15`); `ROLE_LABELS.developer = 'Desenvolvedor'`; `CompanyRead` (`getCompany`, `:134-147`) ganha `may` | o servidor e a web inteiros |
| `apps/server/src/hub/identity/` | Muda `roles.ts` (as declarações e o papel), `admission.ts` (`ACTIONS`, `rankAllows`), `companies.ts` (`may` em `:88-92`) | `auth.ts:254-255` passa os papéis ao plugin, sem mudar |
| `apps/server/src/hub/connectors/assistant-port.ts` | Muda: `offered` e `readable` (`:104-130`) pedem `assistantReadCompany` quando o lugar é o Início; `builder-port.ts` não muda | `builder/assistant/` |
| `apps/server/src/builder/controller-kit/admission.ts` | Muda: `admitAsker` segue em `askAssistant`; cria `admitAutomationOwner` (`manageAutomations`) | `builder/assistant/`, `builder/automations/` |
| `apps/server/src/builder/automations/` | Muda `automations.ts` (cada operação admite `manageAutomations`, comentário `:249-253`), `run.ts` (`mayAsk`, `:79-90`, passa a `manageAutomations`), `routes.ts:20` | — |
| `apps/server/src/builder/assistant/` | Muda `instructions.ts` (`ROLE_WORDS`, `:23-27`: `developer: 'developer'`) | `assistant.ts:119` |
| `apps/server/src/builder/tools/tools.ts`, `builder/agents/` | Nada além dos nomes: as ações `readAgents`, `manageAgents`, `publishAgent` mudam de declaração na admissão | — |
| `apps/web/src/hub/identity/` | Muda `enter-company.ts` (`enterHouse`, `:33-43`, devolve `may` ao contexto da rota) e as dublês `test-*.tsx` que leem `getCompany`; o seletor de papel (`member-actions.tsx:152-179`) e o convite (`invite-form.tsx:23-24`) listam o Desenvolvedor sozinhos por `Role.options`, e o convite segue com Membro por padrão | `routes/_app/companies/$companyId/` |
| `apps/web/src/routes/_app/companies/$companyId/` | Muda `route.tsx:64,112` e `index.tsx:23-33`: leem `may` do contexto; o membro ganha a caixa do Assistente e as conversas | — |
| `apps/web/src/hub/projects/project-rail.tsx` | Muda `:113,121`: `may.manageAgents`, `may.manageAutomations` | — |
| `apps/web/src/builder/` | Muda `agents/area.tsx:188` e `assistant/project.tsx:27` (leem `may`); `builder/assistant/text.ts` (sai a frase do membro na conversa do Projeto); `builder/agents/text.ts` (`MEMBERS_CANNOT` vira "Só o dono, os administradores e os desenvolvedores usam os agentes do Projeto."); `builder/automations/proposal.tsx` e `builder/automations/text.ts` (a frase de quem não cria); as dublês `builder/model-accounts/test-*` | — |
| `apps/web/src/platform/test-hub.tsx`, `apps/web/src/hub/connectors/test-hub.tsx` | Muda: `companyRead` (`platform/test-hub.tsx:57-80`) devolve `may` | os testes da web |
| `scripts/removals.json` (T12) | Cria as proteções: o `NOT_FOUND` do membro em publicar, em agentes e em automações; o recorte do Início em `offered` | `npm run removals` |
| `docs/reference/screens.md` | Muda: o Início do membro, a conversa do Projeto, as colunas de papéis com o desenvolvedor | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/companies.ts
export const Role = z.enum(['owner', 'admin', 'developer', 'member'])
export const CompanyMay = z.object({ manageAgents: z.boolean(), manageAutomations: z.boolean() })
// getCompany.success.body: { company, role, mayInviteAs, may: CompanyMay }

// apps/server/src/hub/identity/roles.ts: as declarações a mais em ACCESS_CONTROL
//   app: ['publish'], agent: ['manage', 'publish'], automation: ['manage'],
//   assistant: ['ask', 'readCompany']
// owner, admin: as de hoje + todas essas;
// developer: memberAc + project: ['create'] + app, agent, automation, assistant (sem connection,
//   sem modelAccount, sem appAccess);
// member: as de hoje + assistant: ['ask'].

// apps/server/src/hub/identity/admission.ts, as ações que mudam ou nascem
//   publishAppVersion: { app: ['publish'] }                (era: nenhuma)
//   askAssistant: { assistant: ['ask'] }                   (era: MANAGE_CONNECTIONS)
//   assistantReadCompany (nova): { assistant: ['readCompany'] }
//   readAgents, manageAgents: { agent: ['manage'] }; publishAgent: { agent: ['publish'] }
//                                                          (eram: MANAGE_CONNECTIONS)
//   manageAutomations (nova): { automation: ['manage'] }, locks: true
// rankAllows: case 'developer': return false (como o membro); o administrador muda entre
// administrador, desenvolvedor e membro.

// apps/server/src/hub/identity/companies.ts
//   may = { manageAgents: allows(role, 'manageAgents'), manageAutomations: allows(role, 'manageAutomations') }
```

- **Cada estado** (C21): nenhum novo; `Role` é a união. **Cada id** (C23): nenhum novo. **Cada
  entrada externa** (C27): nenhuma nova; o `PATCH` e o convite já parseiam `Role`.
- **O dono de cada fato** (C26): quem pode o quê é `COMPANY_ROLES` e `ACTIONS`; `may` é lido de
  `allows`, como `mayDelete` em `hub/projects/projects.ts:60-62`. A web nunca compara `role`.
- **O arquivo modelo**: `hub/projects/projects.ts`, cujo `rightsOf` é a forma (cumpre C26; não tem
  estado nem id novo).
- **Saem**: a frase `MEMBERS_CANNOT` de `builder/assistant/text.ts:63`, o comentário de
  `admission.ts:75-77` ("The step of roles and requests makes `publishAgent` ...") e o empréstimo de
  `MANAGE_CONNECTIONS` em cinco ações.

### As skills e a leitura

`organization-best-practices`, `better-auth-best-practices`, `pstack:tdd`; as linhas de
`docs/reference/stack.md` para `apps/server/src/hub/identity/` e `apps/web/src/`.
[security](../guides/security.md) S6 a S12; [web](../guides/web.md) W29, W34;
[testing](../guides/testing.md) T5, T12.

### A ordem do trabalho

1. **A prova primeiro.** `memberships.test.ts`, "o desenvolvedor": a dona muda Diego para
   `developer`; e `publish.test.ts`, "quem publica": o desenvolvedor publica e o membro recebe
   `NOT_FOUND`. Falham hoje.
2. `companies.ts` (hub-api), `roles.ts`, `admission.ts`. Regras: S6, S7, S10, C26. Funções:
   `better-auth@1.7.8`: `createAccessControl`, `newRole` (`dist/plugins/access/access.mjs:71`).
3. `assistant-port.ts`: o recorte do Início (critério 5).
4. `controller-kit/admission.ts`, `automations/` e `run.ts`: as automações passam a
   `manageAutomations`; `mayAsk` continua devolvendo `MAY_NOT` quando a pessoa não pode, e o motivo
   `OWNER_CANNOT_ASK` não muda de nome (é um código já guardado nas execuções).
5. `companies.ts` (servidor): `may`. Depois a web: `enter-company.ts`, o contexto da rota da
   empresa, as sete leituras e as dublês.
6. O cartão da proposta e os textos. Regras: W34, V29. As proteções de `scripts/removals.json` e a
   linha de `screens.md`.

### Como se prova

Os critérios 1 a 9 pelos testes nomeados, na porta pública (as rotas, T5). Comando: os testes
tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- Um teste de hoje que espera `NOT_FOUND` do membro no Assistente: é o comportamento que esta
  etapa muda pela resposta "5"; atualizar o teste e dizer no pull request quais.
- Alguma rota lê `connection: ['manage']` para algo que não é gerir ligações e não está nas cinco
  ações acima: relatar antes de mudar.
- O fundador responder `E2`: o critério 5 muda para "o membro lê como o dono", e
  `assistant: ['readCompany']` vai também ao membro; nada mais muda.

## U2 O pedido

**Base e modelo.** `main` depois da U1. Opus: uma transação que cruza `hub/apps`, `hub/projects`,
`hub/identity` e `hub/notifications`, com decisões e publicações concorrentes numa ordem de trancas
só, e quatro portas que não podem formar ciclo.

### As linhas da tabela

As capacidades por ação (as da U2), o pedido guardado, quem decide, publicar ao aprovar e fechar ao
publicar, o aviso no sino.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/requests/` | Cria `tables.ts` (schema `requests`, tabela `request`), `requests.ts` (pedir, decidir, cancelar, `closeRequests`, `publishRequestOf`), `routes.ts`, `public.ts`, `requests.test.ts` | `main.ts`; `hub/notifications/` importa a tabela |
| `apps/server/src/hub/apps/` | Muda `live.ts`: `publishVersion` (`:25-65`) fica com a admissão e chama `publishIn`, que tem o resto do corpo e chama a porta `CloseRequests`; `public.ts` exporta `publishIn`, `lockApp` e o tipo `CloseRequests` | `hub/apps/routes.ts:81-83`, `hub/requests/` |
| `apps/server/src/hub/projects/` | Muda `projects.ts`: `rightsOf` (`:60-62`) ganha `mayPublish`; `getProject` e `createProject` trazem `publishRequest` pela porta `PublishRequestOf`, definida aqui | `projects/routes.ts:58` |
| `apps/server/src/hub/identity/` | Muda `roles.ts` (`request: ['create', 'decide']`), `admission.ts` (`requestPublish`, `cancelRequest`, `decideRequest`), `memberships.ts` e `public.ts` (a porta `membersAllowed`) | `hub/requests/` |
| `apps/server/src/hub/notifications/` | Cria `request-notices.ts` (a tabela `request_notice` e o escritor `NoticeRequests`); muda `notifications.ts` (o `list` junta as duas tabelas), `public.ts`; as linhas de automação não mudam | `main.ts` |
| `apps/server/migrations/` | Cria `…_e2434_requests` (as duas tabelas, só aditivas, D6) e `…_e2434_requests_grants` (o SQL das permissões e o `snapshot.json` do Drizzle, num commit próprio, D10, D11) | — |
| `apps/server/database-grants.sql` | Muda: as permissões e os donos (`ALTER SCHEMA requests OWNER`, `ALTER TABLE … OWNER`, como `:13,77` para `notifications`) | `catalog.test.ts` |
| `packages/hub-api/src/` | Cria `requests.ts` (o contrato) e `request-failures.ts` (os códigos, como `agent-failures.ts`, espalhados em `failures.ts:238`); muda `projects.ts` (`Project`), `notifications.ts` (`NotificationRow`), `failures.ts`, `index.ts` | a web |
| `apps/server/src/main.ts` | Muda: liga as portas com fecho tardio, como `ungranted` (`:174-176`) | — |
| `apps/web/src/hub/notifications/` | Muda `bell.tsx` (`:47-64`: `automation` sai do comum; as frases dos dois tipos; o toque abre a área do Projeto) e o seu `text.ts` | — |
| As dublês da web | Muda `apps/web/src/platform/test-hub.tsx` (`:306-318`), `apps/web/src/builder/conversation/test-hub.tsx:205` e `test-start.tsx:58`, `apps/web/sweep-replies.ts:222`, `apps/web/sweep-project-states.ts:34`: `mayPublish` e `publishRequest: null` | os testes da web |
| `.dependency-cruiser.cjs` | Muda, se nascer uma porta de teste `hub/requests/test-requests.ts`: a lista `TEST_DATABASE` (`:10`) | — |
| `scripts/removals.json` (T12) | Cria as proteções: decidir só por dono e administrador, `PUBLISH_REQUEST_OWN`, o `for update` do pedido, a ordem app antes do pedido, a política de `requests.request`, a de inserir de `request_notice` | `npm run removals` |

### As portas, sem ciclo

As setas de importação ficam `requests → apps`, `requests → projects`, `requests → identity`,
`notifications → requests`; nenhuma volta. Cada tipo mora no lado que o consome, e `main.ts` liga o
implementador com um fecho tardio, como `Ungranted` (`hub/apps/live.ts:12-16`, `main.ts:174-176`),
na ordem projects, apps, requests, notifications.

```ts
// hub/apps/live.ts (exportado por hub/apps/public.ts)
export type CloseRequests = (
  tx: Tx,
  input: { companyId: CompanyId; projectId: ProjectId; number: number; by: PersonId },
) => Promise<void>
export type PublishInput = { companyId: CompanyId; projectId: ProjectId; number: number; by: PersonId }
/** O corpo de publishVersion sem a admissão: tranca o app, confere a versão e as ligações, grava, fecha o pedido. */
export function publishIn(
  tx: Tx,
  deps: { ungranted: Ungranted; closeRequests: CloseRequests; log: Logger },
  input: PublishInput,
): Promise<AppVersion>
// publishVersion = database.command(admitPublisher, depois publishIn); lockApp segue exportado

// hub/projects/projects.ts
export type PublishRequestOf = (
  tx: ReadTx,
  input: { companyId: CompanyId; projectId: ProjectId; personId: PersonId; role: Role },
) => Promise<PublishRequest | null>
// rightsOf(deps, role) => { mayDelete, mayPublish }

// hub/identity/public.ts, em IdentityPorts
membersAllowed(
  tx: Tx,
  input: { companyId: CompanyId; action: ActionName },
): Promise<readonly PersonId[]> // lido com `for key share` nos membros

// hub/requests/requests.ts
export type NoticeRequests = (
  tx: Tx,
  notices: readonly {
    companyId: CompanyId
    personId: PersonId
    requestId: RequestId
    kind: 'REQUEST_OPENED' | 'REQUEST_DECIDED'
  }[],
) => Promise<void> // implementado em hub/notifications: insert … on conflict do nothing, sem returning
```

### A ordem de cada comando

- **Pedir**: admite `requestPublish`; confere o Projeto vivo (`liveProjectOf`); quem tem
  `publishAppVersion` recebe `PUBLISH_REQUEST_NOT_NEEDED`; `lockApp`; a versão `ready`, senão
  `APP_VERSION_NOT_FOUND`; a publicada, `PUBLISH_REQUEST_ALREADY_LIVE`; insere `PENDING` (o índice
  único dá `PUBLISH_REQUEST_ALREADY_OPEN`); `membersAllowed(decideRequest)`; `REQUEST_OPENED` para
  cada um.
- **Decidir**: admite `decideRequest` (`locks: true`, o papel fica preso, S8); lê o pedido sem
  trancar (`NOT_FOUND` se não há); confere o Projeto vivo; `lockApp`; tranca o pedido com
  `for update` e confere de novo `PENDING` (`PUBLISH_REQUEST_CLOSED`); quem decide é quem pediu,
  `PUBLISH_REQUEST_OWN`. `APPROVE`: grava `APPROVED` com `decided_by` **antes** de chamar `publishIn`,
  e assim `closeRequests`, que só toca `PENDING`, não acha nada. `DECLINE`: grava `DECLINED` com o
  motivo. Depois, um `REQUEST_DECIDED` para quem pediu.
- **Cancelar**: admite `cancelRequest` (toda filiação); tranca o pedido com `for update`; quem
  pediu é outro, `NOT_FOUND` (antes do estado, S10); fechado, `PUBLISH_REQUEST_CLOSED`; grava
  `CANCELLED`.
- **Fechar ao publicar** (`closeRequests`, dentro de `publishIn`, depois de gravar
  `publishedVersionId`): o pedido `PENDING` do Projeto, se há, vira `APPROVED` por quem publicou
  quando o número é o pedido, `SUPERSEDED` quando não; um `REQUEST_DECIDED` para quem pediu, salvo
  quando quem publicou é quem pediu. Publicar de novo a versão publicada sai antes, sem chamar
  `closeRequests` (`live.ts:19-24`).

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/requests.ts
export const RequestId = z.uuid().brand('RequestId')
export const REQUEST_MESSAGE_MAX = 280
export const RequestState = z.enum(['PENDING', 'APPROVED', 'DECLINED', 'CANCELLED', 'SUPERSEDED'])
export const PublishRequest = z.object({
  id: RequestId,
  number: z.int().positive(),
  message: z.string().max(REQUEST_MESSAGE_MAX),
  requestedBy: z.object({ name: z.string() }),
  createdAt: z.iso.datetime(),
  mayDecide: z.boolean(),
  mayCancel: z.boolean(),
})
export const Decision = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('APPROVE') }),
  z.object({ decision: z.literal('DECLINE'), reason: z.string().max(REQUEST_MESSAGE_MAX).optional() }),
])
// POST /api/companies/{companyId}/projects/{projectId}/publish-request, attemptKey: true
//   body { number, message }; 201 { request: PublishRequest }
//   falhas: NOT_FOUND, APP_VERSION_NOT_FOUND, PUBLISH_REQUEST_ALREADY_LIVE (409),
//           PUBLISH_REQUEST_ALREADY_OPEN (409), PUBLISH_REQUEST_NOT_NEEDED (409),
//           IDEMPOTENCY_CONFLICT, REQUEST_MALFORMED, SESSION_REQUIRED, DATABASE_UNAVAILABLE
// POST /api/companies/{companyId}/requests/{requestId}/decision
//   body Decision; 200 { state: 'APPROVED' | 'DECLINED' }
//   falhas: NOT_FOUND, PUBLISH_REQUEST_CLOSED (409), PUBLISH_REQUEST_OWN (409),
//           APP_VERSION_NOT_FOUND, CONNECTOR_NOT_GRANTED, REQUEST_MALFORMED, SESSION_REQUIRED,
//           DATABASE_UNAVAILABLE
// POST /api/companies/{companyId}/requests/{requestId}/cancel
//   204; falhas: NOT_FOUND, PUBLISH_REQUEST_CLOSED, SESSION_REQUIRED, DATABASE_UNAVAILABLE

// packages/hub-api/src/request-failures.ts: os cinco códigos PUBLISH_REQUEST_*, com a frase e a
// ação de cada um, na forma de AGENT_FAILURES

// packages/hub-api/src/projects.ts
//   Project ganha mayPublish: z.boolean(), publishRequest: PublishRequest.nullable()

// packages/hub-api/src/notifications.ts, NotificationRow ganha
//   { kind: 'REQUEST_OPENED', id, createdAt, read, projectId: ProjectId, projectName, number,
//     requestedBy: { name } }
//   { kind: 'REQUEST_DECIDED', id, createdAt, read, projectId, projectName, number,
//     outcome: 'APPROVED' | 'DECLINED' | 'SUPERSEDED', decidedBy: { name } | null,
//     reason: string | null }
// `automation` sai da parte comum e vai para os três tipos de automação.
```

A tabela `requests.request`:

| Coluna | Tipo e restrição |
| --- | --- |
| `id` | `uuid` chave primária |
| `attempt_key` | `text not null`, `unique (company_id, attempt_key)`, como `connection_attempt_key` (`hub/connectors/tables.ts:60,84`): a mesma chave devolve o mesmo pedido |
| `company_id`, `requested_by` | `text not null`; chave estrangeira `(company_id, requested_by)` para `auth.member` com cascata (D17); `company_id` para `auth.company` com cascata |
| `project_id` | `text not null`, chave estrangeira para o Projeto com cascata |
| `kind` | `text not null`, `check (kind in ('PUBLISH_APP_VERSION'))`; a 24.5 soma o seu; nenhum contrato o expõe ainda |
| `number` | `integer not null check (number > 0)`: a versão pedida |
| `message` | `text not null default ''`, `check (char_length(message) <= 280)` |
| `state` | `text not null`, `check` nos cinco estados |
| `decided_by`, `reason` | `text`, `text`; `check ((state in ('PENDING','CANCELLED')) = (decided_by is null))`; `decided_by` sem chave estrangeira (fica quando quem decidiu sai); `reason` só com `DECLINED`; nenhuma checagem de `decided_by <> requested_by` (é regra do código) |
| `created_at` | `timestamptz not null` |
| índice único | `(company_id, project_id) where state = 'PENDING'`: um pedido aberto por Projeto |
| política | `policy(SCOPE_ROLES.COMPANY, 'all', company_id = scoped.companyId)` |

A tabela `notifications.request_notice`, nova e só aditiva (D6): `id uuid` chave primária;
`company_id`, `person_id` com chave estrangeira para `auth.member` em cascata; `request_id` para
`requests.request` em cascata; `kind text not null check (kind in ('REQUEST_OPENED',
'REQUEST_DECIDED'))`; `created_at`, `read_at`; `unique (request_id, person_id, kind)`. Políticas:
ler e marcar como lido, `OWN` (`company_id` e `person_id`), como a do sino; inserir, `company_id =
scoped.companyId`, porque quem pede avisa quem decide. A tabela de hoje não muda.

As permissões (o segundo arquivo de migração, num commit próprio, D10, D11, com a palavra do
fundador nesta página): `GRANT USAGE ON SCHEMA requests TO hub_company`;
`GRANT SELECT, INSERT ON requests.request`; `GRANT UPDATE (state, decided_by, reason) ON
requests.request`; `GRANT SELECT, INSERT ON notifications.request_notice`;
`GRANT UPDATE (read_at) ON notifications.request_notice`.

- **Cada estado** como união (C21): `RequestState`; a decisão como união em `Decision`; o desfecho
  como união em `outcome`.
- **Cada id** com a sua marca (C23): `RequestId`, parseado na rota.
- **O dono de cada fato** (C26): o pedido aberto de um Projeto é a linha `PENDING`, lida só em
  `hub/requests`; quem decide é `allows(role, 'decideRequest')` e `PUBLISH_REQUEST_OWN`; publicar é
  só `publishIn`; quem é avisado é `membersAllowed`.
- **O esquema de cada entrada** (C27): os corpos acima, em `requests.ts`.
- **O arquivo modelo**: `hub/notifications/tables.ts` para a tabela e a política (cumpre C21 nas
  checagens por tipo e C26; não marca os seus ids, e a U2 marca `RequestId`, C23);
  `hub/apps/live.ts` para a transação de publicar e a porta tardia (cumpre C26).

### As skills e a leitura

`fastify-best-practices`, `pstack:tdd`; as linhas de `docs/reference/stack.md` para
`apps/server/src/hub/` e `migrations/`. [data](../guides/data.md) D5, D6, D10, D11, D15, D17, D22;
[security](../guides/security.md) S7, S8, S10; [testing](../guides/testing.md) T5, T12.

### A ordem do trabalho

1. **A prova primeiro.** `requests.test.ts`, "decidir": o membro pede, a dona aprova, a versão fica
   publicada, o pedido `APPROVED` e há um aviso para quem pediu. Falha hoje (a rota não existe).
2. As duas tabelas e as migrações (`npm run generate -w apps/server` para as tabelas; o SQL das
   permissões à mão, num commit próprio). Rodar `npm run migrations` localmente (uma migração ou um
   teste com `SET` solto é recusado).
3. `publishIn` em `live.ts`, sem mudar o que `PUT …/published-version` responde
   (`publish.test.ts` continua passando sem mudar).
4. `membersAllowed` e as três ações na identidade.
5. `hub/requests/requests.ts` na ordem de cada comando acima, e o teste "decidir e publicar ao
   mesmo tempo" com duas transações reais. Regras: S8, D22.
6. Os avisos: `request-notices.ts`, o `list` que junta as duas tabelas, as frases do sino e as
   dublês da web.
7. O Projeto: `mayPublish`, `publishRequest`. As rotas, `main.ts` e as proteções de
   `scripts/removals.json`.

### Como se prova

Os critérios 10 a 20 pelos testes nomeados, contra o PostgreSQL de teste
(`docs/how-to/local-database.md`), na porta pública. "duas decisões" e "decidir e publicar ao mesmo
tempo": duas transações abertas juntas, uma vence, nenhuma recebe `40P01`. `isolation.test.ts`: um
pedido e um aviso de outra empresa não aparecem nem se decidem. Comando: os testes tocados,
`npm run typecheck`, `npm run lint`, `npm run migrations`.

### Parar se

- Uma política pedir mais do que as linhas acima: relatar; é uma permissão (D11).
- Aprovar precisar de outra regra de publicar além de `publishIn`: parar; dois donos de uma regra.
- Uma porta só fechar com uma importação de volta: parar; o tipo está do lado errado.
- Uma notificação de automação de hoje deixar de ser lida pelo `list`: parar; é um defeito do sino
  no ar.

## U3 As telas do pedido

**Base e modelo.** `main` depois da U2. Sonnet: um botão, uma linha e duas caixas sobre rotas
prontas.

### As linhas da tabela

A tela do pedido.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/requests/` | Cria `publish-request.tsx` (a caixa de pedir), `request-line.tsx` (a linha do pedido: quem pediu, a mensagem, **Cancelar pedido**, **Publicar a versão n**, **Recusar** com a caixa do motivo), `queries.ts`, `text.ts`, `public.ts` e os testes; recebe `onChanged` por propriedade e nunca importa `hub/projects` nem `hub/apps` | `hub/projects/area.tsx`, `hub/apps/publish.tsx`, `hub/apps/versions.tsx` |
| `apps/web/src/hub/apps/` | Muda `publish.tsx` (`:17-88`): com `project.mayPublish` falso, o botão é **Pedir para publicar** e abre a caixa de `hub/requests`; `versions.tsx:48-50` ("Pedir esta") | — |
| `apps/web/src/hub/projects/area.tsx` | Muda `:70-99`: a linha do pedido abaixo da linha da versão; passa `onChanged`, que relê o Projeto, como `onStale` hoje | — |
| `docs/reference/screens.md` | Muda: a linha do pedido e as duas caixas | — |

### Os contratos que a unidade cria

Nenhum do servidor. Pedir manda `{ number, message }` com uma chave de tentativa por envio da caixa;
no 409 `PUBLISH_REQUEST_ALREADY_OPEN` ou `PUBLISH_REQUEST_ALREADY_LIVE` a tela chama `onChanged`, e
o Projeto relido mostra o estado. Decidir e cancelar, no `PUBLISH_REQUEST_CLOSED`, chamam
`onChanged` e mostram "Este pedido já foi decidido.". Os textos desta página do fundador são os da
tela; os novos vão à aprovação dele no fim.

### As skills e a leitura

`shadcn`, `impeccable`, `pstack:tdd`; as linhas de `docs/reference/stack.md` para `apps/web/src/`.
[web](../guides/web.md) W7, W29, W30, W34; [design](../guides/design.md) V29.

### A ordem do trabalho

1. **A prova primeiro.** `publish-request.test.tsx`: o membro toca **Pedir para publicar**, manda a
   mensagem e vê "Você pediu para publicar a versão 5." com **Cancelar pedido**, contra o servidor
   dublê (`apps/web/src/platform/test-hub-versions.tsx`). Falha hoje.
2. A caixa e a linha; o botão de `publish.tsx` e de `versions.tsx`.
3. A decisão: **Publicar a versão n** e **Recusar** com o motivo; `PUBLISH_REQUEST_CLOSED` e
   `CONNECTOR_NOT_GRANTED`.
4. As capturas a 1280 e 390, claro e escuro, no pull request.

### Como se prova

Os critérios 21 e 22 pelos testes de `apps/web` com o servidor dublê; larguras e temas pela QA da
etapa. Comando: os testes tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- A linha precisa de um campo que `PublishRequest` não traz: relatar; nunca ler outra rota para
  montá-la.
- O desenho da linha pedir uma peça que a Pauta não tem: relatar, com a captura.
