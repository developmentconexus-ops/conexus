# Etapa 24.7: Canais

Rascunho, à espera da vez na fila da frente (regra L5): a 24.5.1 e a 24.6 constroem antes. Cada
linha citada foi lida no `main` em `44fb4040`, com `@mastra/core` 1.82.0, `@mastra/memory` 1.41.0,
`@mastra/pg` 1.35.0 e `chat` 4.44.0, e na estante do Mastra na tag `@mastra/core@1.82.0`
(`6e8dfcb8`), onde mora o `@mastra/telegram` 0.2.5 (`channels/telegram/`) e o
`@chat-adapter/telegram` 4.44.0 que ele usa. O construtor de cada unidade reabre as linhas no `main`
do dia: a 24.5.1 muda a regra de quem aprova de lugar, e a 24.6 muda o `AgentRun`.

## A página do fundador

**No fim desta etapa** você liga um bot do Telegram ao agente "Pedidos", liga o seu Telegram ao seu
nome no Conexus com um toque, e conversa com o agente pelo celular. Quando ele quer lançar um
pedido, o Telegram mostra **Aprovar?** com dois botões, e só você, que pediu, aprova. A conversa
aparece no Hub, na lista do agente, com a marca **Telegram**. Quem não está ligado recebe uma frase,
e o agente não roda para essa pessoa.

**O roteiro de uso.** Você é a Ana (dona), no Conexus da nuvem, com o celular na mão.

1. No Telegram, abra o **@BotFather**, mande `/newbot`, dê um nome e copie o token que ele devolve.
2. No Hub, abra o agente "Pedidos" (publicado), seção **Canais**. Em **Telegram**, cole o token e
   toque **Ligar**. Aparece "Ligado: @pedidos_da_empresa_bot" e o botão **Desligar**.
3. Na mesma seção, toque **Ligar meu Telegram**. O Telegram abre o bot; toque **Começar**. O bot
   responde "Pronto, Ana. Pode conversar comigo por aqui."
4. Pergunte no Telegram "quais pedidos entraram hoje?". Ele mostra "digitando…" e responde com os
   números da leitura. Peça "lance um pedido para o cliente 1: 2 unidades do produto 11 a R$ 10,00".
   Aparece **Aprovar lançar pedido?** com o que vai ser escrito e os botões **Aprovar** e
   **Recusar**. Toque **Aprovar**: o cartão vira "Aprovado por você", e ele diz o número do pedido.
5. Peça outro pedido e, em vez de tocar no cartão, escreva "deixa, não lança". O cartão vira
   "Recusado", nada é lançado, e ele responde à mensagem nova.
6. No Hub, em **Conversas** do agente, a conversa aparece com a marca **Telegram**. Abra: as
   mensagens e o pedido lançado estão lá; a caixa de escrever diz "Esta conversa é do Telegram.
   Responda por lá." De outro Telegram, que não é o seu, mande "oi" ao bot: ele responde uma frase
   só, e nada mais acontece. Volte à seção **Canais** e toque **Desligar**: o bot para de responder.

**O que você faz, e quando.** Antes: nada além do passo 1, que é seu e do seu Telegram. No começo:
responde às decisões abaixo e aprova esta página. No fim: faz o roteiro, diz o que viu e aprova os
textos das telas e do bot.

**O que as referências fazem.**

- **O Mastra tem o canal pronto.** Recebe a mensagem, abre uma conversa por pessoa do Telegram,
  mostra o "digitando…", posta a resposta e desenha o cartão de aprovação com botões. Por padrão, só
  quem pediu aprova (`toolApprovers: 'requester'`). Medi tudo isso aqui, com um Telegram falso e um
  modelo falso, sem bot de verdade.
- **O n8n é o caso mais completo de agente no Telegram.** O token mora no cofre de credenciais, um
  bot responde por um agente só, e quem não está na lista de permitidos não recebe resposta.
- **Ninguém liga um remetente do Telegram a uma pessoa da empresa por código.** O próprio Telegram
  documenta o link `t.me/<bot>?start=<código>` para "ligar a conta do Telegram à conta em outra
  plataforma". É o que a decisão A recomenda.

**Três coisas que medi e que mudam o que se constrói.**

- **O modo de texto do pacote do Telegram deixa a escrita parada para sempre.** O
  `@mastra/telegram` mostra as ferramentas como texto, sem botão. Uma escrita que pede aprovação fica
  esperando, e nem escrever "sim, pode lançar" a solta. Por isso o cartão é nosso, em português, com
  os botões nativos.
- **No Telegram o cartão vale depois de um reinício do Conexus.** No Hub, o cartão some no reinício
  e um Aprovar velho não roda nada (24.5). No Telegram o cartão continua na conversa: medi um clique
  depois do reinício, e a escrita roda uma vez; um segundo clique no mesmo cartão não repete. Quem
  aprova é conferido de novo na hora do clique.
- **Um botão do Telegram leva no máximo 64 bytes.** Se a chamada da ferramenta tiver uma id comprida,
  o cartão não sai, a pessoa não vê nada e nada roda. O Conexus confere esse tamanho e, se passar,
  responde com uma frase em vez de calar.

**Fica de fora.**

- **O agente atendendo qualquer pessoa, como atendimento de cliente.** Seria "ninguém da empresa
  olhando". Pela `D1` de Papéis, ali uma escrita que pergunta não é oferecida, e ainda falta decidir
  qual conta de modelo paga e onde fica a memória de quem é de fora. Vem numa etapa própria.
- **Grupos do Telegram.** O "só quem pediu aprova" e o modo de privacidade do Telegram pedem desenho
  próprio. Num grupo, o bot não responde.
- **Áudio, vídeo e arquivos além de foto e PDF.** O canal do Mastra manda foto e PDF ao modelo, e
  descreve o resto em texto. Nada se constrói para isso nesta etapa.
- **Responder pelo Hub uma conversa do Telegram.** As duas pontas escrevendo na mesma conversa pedem
  uma regra de quem fala. Por agora, no Hub ela se lê.
- **WhatsApp e Slack.** O mesmo canal do Mastra serve; cada um é uma etapa curta depois.
- **Um agente com o Computador ligado (24.4).** A versão com o Computador roda pela conversa do Hub;
  no Telegram, o **Ligar** recusa esse agente com uma frase.

**As decisões suas nesta etapa.**

**A. Como alguém do Telegram vira uma pessoa da empresa.**

- **A1. O código no link do Telegram (recomendado).** Na seção **Canais**, a pessoa toca **Ligar meu
  Telegram**. O Conexus gera um código de uso único e abre `t.me/<bot>?start=<código>`. O Telegram
  manda ao bot `/start <código>`, e o Conexus liga aquele Telegram àquela pessoa. Caso real: a
  documentação do Telegram, "Deep linking", nomeia esse uso. Exemplo: a Ana toca, o bot diz "Pronto,
  Ana". Objetivo: saber quem fala sem a pessoa digitar nada nem descobrir o próprio número do
  Telegram. Como nativo: o parâmetro `start` do Telegram (até 64 caracteres) e o
  `handlers.onDirectMessage` do Mastra, onde ele diz que se decide "which user a platform sender
  maps to". Veredito: embrulhado (a ligação é nossa, guardada no Hub).
- **A2. Uma lista de quem pode falar, digitada no Hub.** O administrador digita o número de usuário
  ou o @ de cada pessoa. Caso real: o n8n (`allowedUsers`), e o próprio adaptador do Telegram
  (`allowedUserIds`). Exemplo: o administrador copia "@ana_vendas". Objetivo: simples de montar.
  Contra: ninguém sabe o próprio número do Telegram, o @ muda quando a pessoa quer, e a lista não
  diz qual pessoa da empresa é, que é o que decide o papel, a conta de modelo e quem aprova. Como
  nativo: `allowedUserIds` do `@chat-adapter/telegram`.
- **A3. O telefone.** O bot pede "compartilhar contato" e casa o número com o da pessoa. Nenhuma
  referência faz; o Conexus não guarda o telefone de quem é da empresa. O dify registra a regra
  "casar um atributo nunca substitui a identidade".

**B. O que o agente responde a quem não está ligado.**

- **B1. Uma frase fixa, sem rodar o modelo (recomendado).** "Este bot é de uma empresa no Conexus.
  Para conversar, peça a quem cuida do Conexus para ligar o seu Telegram." Medido: a frase sai, a
  conversa não é criada e nada é cobrado da conta de modelo. Objetivo: alguém da empresa que ainda
  não ligou entende o que fazer. Como nativo: o handler não chama o padrão.
- **B2. Silêncio.** Caso real: o n8n, o Cloudflare Agents e o próprio Mastra (o `resolveSession` que
  recusa "deixa a conversa em silêncio"). Objetivo: não dizer a um estranho que ali há uma empresa.
  Contra: quem é da empresa e esqueceu de ligar acha que o bot está quebrado.
- **B3. O agente conversa com qualquer um**, como atendimento. Fica de fora desta etapa (acima).

**M. Uma mensagem nova enquanto o cartão Aprovar? está aberto.**

- **M1. Ela recusa o cartão, como no Hub (recomendado).** É a regra da 24.5 ("outra mensagem
  recusa o cartão aberto"). Medido: o cartão vira "Recusado", nada é lançado, e o agente responde à
  mensagem nova. Objetivo: uma lógica só no Hub e no Telegram, como a 24.5.1 pediu. Como: o handler
  da mensagem recusa a espera pela função nativa `declineToolCall` antes de entregar a mensagem.
  Veredito: embrulhado.
- **M2. Ela espera o cartão**, o comportamento nativo do canal. Medido: a mensagem não tem resposta
  até alguém tocar no cartão; depois do Aprovar, o pedido é lançado e só então ele responde. Contra:
  quem escreve em vez de tocar acha que o bot travou.

**Q. Quem pode ligar um bot a um agente.**

- **Q1. Dono e Administrador (recomendado)**, como as ligações da etapa 19. O token é uma credencial
  da empresa, e o bot põe o agente na internet. Caso real: o activepieces guarda o bot como uma
  ligação, com a permissão de editar ligações.
- **Q2. Quem publica o agente** (Dono, Administrador e Desenvolvedor). Caso real: o n8n exige a
  permissão de editar o agente para ligar e desligar o canal.

**Aprovar esta página é também a sua palavra para três coisas sem escolha.**

- **Um tipo de acesso novo, `webhook`, no guia de segurança (a regra S48).** É para a rota que o
  Telegram chama. Os seis tipos de hoje pedem sessão ou a origem do navegador, e o Telegram não manda
  nenhum dos dois. A rota nova confere só o segredo que o Telegram devolve em cada chamada. A emenda
  do guia vai num pull request de documentos, antes da U1 (a regra L20).
- **As permissões das duas tabelas novas e da coluna nova (a regra D11).**
- **O pacote novo `@mastra/telegram`** (a regra L16), do próprio Mastra.

**Os avisos guardados para o próximo cartão.** Nenhuma issue `next-card` toca canais.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U0 O tipo de acesso `webhook` | A emenda de S48 e de C33 no guia, com a palavra do fundador | `docs/guides/security.md`, `docs/guides/code.md` | [delivery](../guides/delivery.md) | esta página aprovada |
| U1 O bot ligado ao agente | As tabelas `builder.agent_channel` e `builder.channel_link`, a coluna `agent_conversation.channel` e as permissões (D11), num pull request próprio dentro da unidade; o propósito novo do selo; as rotas de ler, ligar e desligar; a rota do Telegram com o tipo `webhook`; o `AgentChannels` posto no `Agent` de cada versão com canal; uma mensagem de qualquer remetente recebe a frase da `B1` | `apps/server/src/builder/channels/` (nova), `apps/server/src/builder/agents/`, `apps/server/src/platform/`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `packages/hub-api/src/` | [security](../guides/security.md) | U0; a 24.6 no `main` |
| U2 A pessoa no Telegram | O código de ligação e o `/start`; o remetente ligado que roda o agente como a pessoa; a conversa com dono, id do Hub e marca de canal, na lista do agente; as frases de quem não está ligado e de quem não tem acesso; a frase de falha; as mensagens longas em partes; grupos desligados | `apps/server/src/builder/channels/`, `apps/server/src/builder/agents/`, `apps/server/src/platform/recordings/mastra/`, `packages/hub-api/src/` | [security](../guides/security.md) | U1 |
| U3 Aprovar no Telegram | O cartão em português com os botões nativos e os textos de aprovado e recusado; o clique conferido pela regra de quem aprova (24.5.1) e carimbado com quem aprovou; a mensagem nova que recusa o cartão aberto (`M1`); o clique atrasado com frase; o tamanho do botão | `apps/server/src/builder/channels/`, `apps/server/src/builder/conversation/` | [security](../guides/security.md) | U2; a 24.5.1 no `main` |
| U4 As telas | A seção **Canais** da página do agente (ligar, ligado, desligar, ligar meu Telegram); a marca **Telegram** na lista de conversas e a conversa só de leitura | `apps/web/src/builder/agents/`, `apps/web/src/builder/conversation/`, `docs/reference/screens.md` | [web](../guides/web.md) | U1 (rotas); U2 (a lista) |

Correm em fila: a U2 usa a rota e o canal da U1; a U3 usa o handler da U2. A U4 pode começar depois
da U1, porque não divide pasta com a U2 nem com a U3; a parte da lista espera a U2.

**O método das unidades.** Cada unidade segue o `pstack:poteto-mode` como as skills do repositório
já o chamam ([`conexus-scope`](../../.agents/skills/conexus-scope/SKILL.md), passo 4;
[`conexus-build`](../../.agents/skills/conexus-build/SKILL.md)). O cartão não repete o método.

**Orçamento de código alterado** (estimado pela leitura e pela prova, sem testes nem gerados). U0:
documentos. U1: ~900 (as tabelas, a função de busca e as permissões ~150, o selo ~20, o contrato
~120, as rotas e o serviço de ligar ~260, o tipo de acesso ~40, o canal posto no agente ~180, o
dependency e a frase ~130). U2: ~650 (o código e o `/start` ~180, o handler e o `AgentRun` ~200, a
conversa e a lista ~150, as frases e as opções do adaptador ~120). U3: ~380 (o cartão ~120, o clique
~140, a recusa por mensagem ~80, o clique atrasado e o tamanho ~40). U4: ~620 (a seção ~380, a lista
e a conversa só de leitura ~160, os textos ~80). Total da etapa: ~2.550, dentro da regra L2.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `PUT /api/companies/{companyId}/projects/{projectId}/agents/{agentId}/channels/telegram` com um token que o Bot API falso aceita, por um Dono, chama `getMe`, depois `setWebhook` com a URL `<origem pública>/api/channels/telegram/<webhookId>`, um `secret_token` novo, `allowed_updates` `["message","callback_query"]` e `drop_pending_updates: true`, guarda a linha e responde 200 `{ state: 'ON', botUsername }`; a linha não tem o token em claro (só `sealed` e `key_id`) | `builder/channels/connect.test.ts` (novo), "liga o bot" | must |
| 2 | U1 | O mesmo `PUT` por um Desenvolvedor (com `Q1`) responde `NOT_IN_ROLE` e não chama o Bot API; por alguém de outra empresa, `NOT_FOUND` (S10) | `connect.test.ts`, "só Dono e Administrador" | must |
| 3 | U1 | Um token que o `getMe` recusa responde `CHANNEL_TOKEN_REFUSED` e não grava; o Bot API fora do ar (o falso desligado) responde `CHANNEL_UNAVAILABLE` e não grava; um `setWebhook` recusado depois do `getMe` não grava | `connect.test.ts`, "token recusado", "Telegram fora" | must |
| 4 | U1 | O mesmo bot (o mesmo `id` do `getMe`) num segundo agente, da mesma empresa ou de outra, responde `CHANNEL_BOT_TAKEN` e não chama `setWebhook` | `connect.test.ts`, "um bot, um agente" | must |
| 5 | U1 | Ligar um agente sem versão ativa responde `CHANNEL_AGENT_UNPUBLISHED`; um agente cuja versão ativa tem o Computador responde `CHANNEL_AGENT_MACHINE`; nenhum chama o Bot API | `connect.test.ts`, "agente que não serve" | must |
| 6 | U1 | `DELETE …/channels/telegram` por um Dono chama `deleteWebhook` com `drop_pending_updates: true` e apaga a linha; com o Bot API fora, a linha sai mesmo assim e o log imprime `CHANNEL_WEBHOOK_NOT_DELETED`; depois disso, uma chamada à rota do Telegram com o `webhookId` antigo responde 404 | `connect.test.ts`, "desliga" | must |
| 7 | U1 | `POST /api/channels/telegram/{webhookId}` sem o cabeçalho `X-Telegram-Bot-Api-Secret-Token`, ou com um errado, responde 401 e não roda nada; com um `webhookId` que não existe, 404; sem `Origin` e sem sessão, com o segredo certo, responde 200 | `builder/channels/webhook.test.ts` (novo), "o segredo"; `platform/access.test.ts`, "o tipo webhook" | must |
| 8 | U1 | O servidor recusa começar com uma rota `webhook` fora de `/api/channels/`, ou com método diferente de `POST` (C33) | `platform/access.test.ts`, "webhook só POST em /api/channels" | must |
| 9 | U1 | Com o bot ligado, uma mensagem de um remetente sem ligação recebe pelo Bot API falso exatamente a frase da `B1` (ou nada, com `B2`), nenhuma conversa é criada no Mastra e nenhum modelo é chamado | `webhook.test.ts`, "quem não está ligado" | must |
| 10 | U1 | Publicar uma versão nova do agente mantém o canal: a mensagem seguinte chega ao `Agent` da versão nova; apagar o agente chama `deleteWebhook` e apaga a linha pela cascata | `builder/channels/registry.test.ts` (novo), "versão nova", "agente apagado" | must |
| 11 | U2 | `POST …/agents/{agentId}/channels/telegram/links` pela pessoa com `manageAgents` devolve `{ url: 'https://t.me/<botUsername>?start=<código>' }`, com o código de 43 caracteres `A-Za-z0-9_-`; um segundo pedido troca o código, e o primeiro passa a não valer; sem o bot ligado, `CHANNEL_OFF` | `builder/channels/link.test.ts` (novo), "o link" | must |
| 12 | U2 | `/start <código>` do remetente 111 liga 111 à pessoa e responde "Pronto, <nome>. Pode conversar comigo por aqui."; o mesmo código de novo, ou um código trocado, responde "Este código já foi usado ou foi trocado. Gere outro no Conexus." e não liga | `link.test.ts`, "o /start" | must |
| 13 | U2 | Um Telegram já ligado a outra pessoa da mesma empresa, com o código de uma segunda pessoa, responde "Este Telegram já está ligado a outra pessoa da empresa." e não muda nada | `link.test.ts`, "um Telegram, uma pessoa" | must |
| 14 | U2 | Uma mensagem do remetente ligado roda o `Agent` da versão como a pessoa: a leitura do conector vai pela porta da empresa com o papel da pessoa, a conta de modelo é a da pessoa, e a resposta chega pelo Bot API falso; a conversa no Mastra tem o dono `agents:company:<c>:person:<p>`, a id é uma `ConversationId` com a linha `agent_conversation` (`channel: 'telegram'`, `draft: false`); a segunda mensagem cai na mesma conversa | `builder/channels/message.test.ts` (novo), "a pessoa conversa" | must |
| 15 | U2 | Dois remetentes ligados, de duas pessoas, têm duas conversas, cada uma com o seu dono; a lista `listAgentConversations` de cada pessoa mostra só a sua, com `channel: 'telegram'` | `message.test.ts`, "uma conversa por pessoa" | must |
| 16 | U2 | O remetente ligado cuja pessoa perdeu `manageAgents` recebe "Seu papel na empresa não conversa com este agente." e nada roda; a pessoa desativada ou tirada da empresa perde a ligação (a cascata do membro) e recebe a frase da `B1` | `message.test.ts`, "o papel muda", "a pessoa sai" | must |
| 17 | U2 | Uma falha do turno (a fila da conta cheia, o modelo fora) posta a frase "Não consegui responder agora. Tente de novo em alguns minutos." e nunca o texto do erro; o log imprime o código da falha | `message.test.ts`, "a falha" | must |
| 18 | U2 | Uma resposta de 9.000 caracteres chega em três mensagens, na ordem, sem corte; uma mensagem num grupo não roda nada e não posta nada | `message.test.ts`, "resposta longa", "grupo" | should |
| 19 | U2 | A conversa do Telegram aberta pela rota de mensagens do Hub mostra as mensagens da pessoa e do agente; mandar uma mensagem por essa conversa no Hub responde `CHANNEL_CONVERSATION` e não roda nada | `builder/agents/conversation-routes.test.ts`, "conversa do Telegram só se lê" | must |
| 20 | U3 | Uma escrita em **Pergunta antes** posta pelo Bot API falso uma mensagem com `reply_markup.inline_keyboard` de dois botões, "Aprovar" e "Recusar", título "Aprovar <rótulo da escrita>?" e os campos abertos; nada é mandado ao conector | `builder/channels/approval.test.ts` (novo), "o cartão" | must |
| 21 | U3 | O clique **Aprovar** de outro remetente, ligado ou não, não roda nada; o de quem pediu edita o cartão para "Aprovado por você", roda a escrita uma vez pelo funil, e a linha `connector_write` guarda `approved_by` com a pessoa | `approval.test.ts`, "só quem pediu", "aprovado" | must |
| 22 | U3 | O clique **Aprovar** de quem pediu, se o papel dela não tem mais a escrita, edita o cartão para "Seu papel não tem mais esta escrita." e não roda nada (a regra de quem aprova da 24.5.1, `D3-a`) | `approval.test.ts`, "o papel perdeu a escrita" | must |
| 23 | U3 | **Recusar** edita o cartão para "Recusado" e nada é mandado; o agente responde depois da recusa | `approval.test.ts`, "recusado" | must |
| 24 | U3 | Com `M1`: uma mensagem nova com o cartão aberto edita o cartão para "Recusado", nada é mandado, e a resposta à mensagem nova chega; um clique depois disso no cartão antigo posta "Este cartão já foi respondido." e não roda nada | `approval.test.ts`, "a mensagem nova recusa" | must |
| 25 | U3 | O cartão respondido depois de um reinício do Hub (outro processo, o mesmo banco) roda a escrita uma vez; um segundo clique no mesmo cartão posta "Este cartão já foi respondido." e não repete | `approval.test.ts`, "depois do reinício" | must |
| 26 | U3 | Uma chamada cuja id não cabe no botão (mais de 38 bytes) não posta cartão quebrado: posta "Não consegui mostrar o pedido de aprovação. Peça de novo." e recusa a espera; nada é mandado | `approval.test.ts`, "id comprida" | must |
| 27 | U4 | A seção **Canais** mostra, conforme a matriz de estados: desligado com o campo do token e **Ligar**; ligando; ligado com o @ do bot, **Desligar** e **Ligar meu Telegram**; as recusas dos critérios 2 a 5 em frase; para quem não liga (com `Q1`), o estado só de leitura | `apps/web/src/builder/agents/channels-section.test.tsx` (novo) | must |
| 28 | U4 | A lista de conversas do agente mostra a marca **Telegram**; a conversa aberta não tem caixa de escrever e diz "Esta conversa é do Telegram. Responda por lá." | `apps/web/src/builder/agents/agent-chat.test.tsx`, "conversa do Telegram" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Seção **Canais** (página do agente) | "Ligue um bot do Telegram a este agente." com os três passos do BotFather, o campo do token e **Ligar** | o mesmo da primeira vez | **Ligando…** no botão, campo travado | "O Telegram não respondeu. Tente de novo." (`CHANNEL_UNAVAILABLE`) | a página do agente responde 404 | só leitura: "Ligado: @bot" ou "Desligado", sem campo nem botões (`NOT_IN_ROLE`) | "O Telegram não reconheceu este token." (`CHANNEL_TOKEN_REFUSED`); "Este bot já responde por outro agente." (`CHANNEL_BOT_TAKEN`); "Publique o agente antes de ligar o Telegram." (`CHANNEL_AGENT_UNPUBLISHED`); "Este agente usa o Computador, que ainda não roda pelo Telegram." (`CHANNEL_AGENT_MACHINE`) |
| **Ligar meu Telegram** (na seção) | o botão | — | **Abrindo…** | "Não consegui gerar o link. Tente de novo." | — | some para quem não tem `manageAgents` | "Ligado como <nome do Telegram>" com **Desligar meu Telegram** |
| Conversa do Telegram (no Hub) | — | — | o da conversa de hoje | o da conversa de hoje | 404 da conversa de hoje | 404 (S10) | a caixa de escrever trocada pela frase |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `TelegramChannel.state`, `botUsername`, `connectedAt` | `connectTelegram`, `disconnectTelegram` (U1) | a seção **Canais** (U4) |
| `MyTelegram.state`, `telegramName` | o `/start` (U2), `deleteMyTelegram` (U2) | a seção **Canais** (U4) |
| `createTelegramLink` → `url` | U2 | a seção (U4), que abre o link |
| `AgentConversationListed.channel` | a criação da conversa pelo canal (U2) | a lista e a conversa (U4) |
| `builder.agent_channel.webhook_id` | `connectTelegram` (U1) | a rota do Telegram (U1), por `builder.channel_of` |
| `builder.channel_link` (`PENDING` com `code_hash`, `LINKED` com `external_user_id`) | `createTelegramLink`, o `/start` (U2) | o handler da mensagem (U2) e do clique (U3) |

**As telas a 1280 e a 390 px** (o desenho de caixas; a U4 segue `docs/reference/screens.md` e a seção
de Conexões da página do agente, `connections-section.tsx`, como modelo do bloco):

```text
1280                                             390
┌ Canais ──────────────────────────────────┐     ┌ Canais ─────────────────┐
│ Telegram                     [Desligado] │     │ Telegram     [Desligado]│
│ 1. No Telegram, abra o @BotFather        │     │ 1. Abra o @BotFather    │
│ 2. Mande /newbot e dê um nome            │     │ 2. Mande /newbot        │
│ 3. Copie o token e cole aqui             │     │ 3. Cole o token aqui    │
│ [ token do bot ................ ] [Ligar]│     │ [ token do bot ...... ] │
└──────────────────────────────────────────┘     │ [Ligar]                 │
                                                 └─────────────────────────┘
┌ Canais ──────────────────────────────────┐     ┌ Canais ─────────────────┐
│ Telegram   Ligado: @pedidos_bot [Deslig.]│     │ Telegram  Ligado        │
│ Seu Telegram: não ligado                 │     │ @pedidos_bot            │
│ [Ligar meu Telegram]                     │     │ [Ligar meu Telegram]    │
└──────────────────────────────────────────┘     │ [Desligar]              │
                                                 └─────────────────────────┘
```

O produto antigo não tinha canal; não há captura a seguir.

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Ligar o bot (`getMe`, `setWebhook`, a linha) | a chave única `(company_id, agent_id, platform)` e `bot_user_id` recusam a segunda; a segunda resposta é `CHANNEL_BOT_TAKEN` | `setWebhook` recusado depois do `getMe`: nada gravado; a linha recusada pelo banco depois do `setWebhook`: o Hub chama `deleteWebhook` e responde `DATABASE_UNAVAILABLE` | Bot API fora: `CHANNEL_UNAVAILABLE`, nada gravado; banco fora: `DATABASE_UNAVAILABLE` depois do `deleteWebhook` | `CHANNEL_CONNECTED` com agente e `bot_user_id`; `CHANNEL_CONNECT_FAILED` com o código | 1, 3, 4 |
| Desligar o bot (`deleteWebhook`, apagar a linha) | o segundo `DELETE` responde 204 sem chamar o Bot API (a linha já saiu) | `deleteWebhook` recusado: a linha sai e o log avisa | Bot API fora: a linha sai, `CHANNEL_WEBHOOK_NOT_DELETED`; banco fora: `DATABASE_UNAVAILABLE`, o webhook já foi apagado e o próximo `DELETE` termina | `CHANNEL_DISCONNECTED` | 6 |
| Gerar o código (`channel_link` `PENDING`) | a última escrita vence: um código por pessoa por canal (chave única), o anterior deixa de valer | — | banco fora: `DATABASE_UNAVAILABLE` | `CHANNEL_LINK_CREATED` sem o código (S40) | 11 |
| Consumir o código (`/start`) | o `UPDATE … WHERE state = 'PENDING' AND code_hash = $1` só uma vez; o segundo vê "já foi usado" | a ligação recusada pela chave do Telegram já ligado: a frase do critério 13 | banco fora: a frase do critério 17 | `CHANNEL_LINKED` com pessoa, sem o id do Telegram | 12, 13 |
| A mensagem do Telegram (a rota, o canal, o agente) | o Telegram repete a entrega: o canal deduplica pelo estado no Mastra (best effort, `docs-channels.md:320`); a escrita não se repete pelo registro da 24.5 (`thread_id`, `tool_call_id`) | a rota responde 200 antes de o agente terminar; um erro depois vai à frase do critério 17 | banco fora antes do 200: 503 do adaptador, e o Telegram reentrega (`docs-channels.md:298`); modelo fora: a frase | `CHANNEL_MESSAGE_REFUSED` (não ligado, papel) com o motivo; os registros do turno de hoje | 7, 9, 14, 16, 17 |
| O clique **Aprovar** / **Recusar** (a retomada nativa) | o segundo clique acha a espera consumida: "Este cartão já foi respondido." | papel sem a escrita: o cartão editado, nada roda; a escrita recusada pelo funil: o resultado de hoje (24.5) | banco fora: a frase do critério 17 | `CHANNEL_APPROVAL_REFUSED` com o motivo; `CONNECTOR_WRITE_SENT` de hoje | 21, 22, 24, 25 |
| A mensagem que recusa o cartão aberto (`declineToolCall`) | uma segunda mensagem acha nada pendente e só é entregue | a recusa falha: a mensagem não é entregue e a frase do critério 17 sai | banco fora: a frase | `CHANNEL_APPROVAL_DECLINED_BY_MESSAGE` | 24 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O canal do agente (receber, conversa por remetente, digitando, responder) | U1, U2 | nenhum; o `Mastra` não tem `channels` (`builder/mastra/mastra.ts:20`) | `@mastra/core@1.82.0` `AgentChannels` (`dist/docs/references/reference-agents-channels.md:32-62`; estante `packages/core/src/channels/agent-channels.ts:1507-1522`) e `@chat-adapter/telegram@4.44.0` | o adaptador lê o update, o canal acha ou cria a conversa (`resourceId` padrão `telegram:<userId>`, `channel_externalThreadId` `telegram:<chatId>`), manda ao agente e posta a resposta | nativo | provado: P1 (`telegram:111` e `telegram:222`, uma conversa cada, reaberta) | "sempre usar nativo" (a decisão `D1` do estudo do Construtor) | `apps/server/src/builder/channels/telegram.ts` |
| Ligar e desligar o bot (`getMe`, `setWebhook`, `deleteWebhook`) | U1 | nenhum | `@mastra/telegram@0.2.5` `getMe`, `setWebhook`, `deleteWebhook`, `generateSecretToken` (`channels/telegram/src/index.ts:3`), o ciclo do `TelegramProvider.connect` (`telegram-provider.ts:312-422`) e `disconnect` (`:425-472`); n8n `telegram-integration.ts:212-242` (relay) | valida o token pelo `getMe`, recusa um bot já ligado por `botUserId`, registra o webhook com segredo e `drop_pending_updates`, só grava depois; desligar apaga o webhook e a linha mesmo com o Bot API fora | embrulhado: as funções do pacote como estão; o nosso é guardar no Hub (S32) em vez do `TelegramInstallStore`, que guarda no Mastra com `MASTRA_ENCRYPTION_KEY` (`telegram-provider.ts:694-698`) | o critério 1 | não precisa (convergem) | `apps/server/src/builder/channels/connect.ts` |
| O token e o segredo no cofre | U1 | `platform/seal.ts:49-50` (quatro propósitos) | o próprio `seal.ts`; n8n credencial `telegramApi` do tipo senha (`TelegramApi.credentials.ts:10-28`, relay); activepieces `EncryptedObject` (relay) | o token mora no cofre, a linha do canal guarda a referência | nativo (o nosso cofre, S32): um propósito novo `channel`, ligado à linha | o critério 1 | não precisa | — |
| Um bot, um agente | U1 | nenhum | `TelegramProvider` (`telegram-provider.ts:379-388`); n8n `credential-claim.ts:15-32` (relay); activepieces "One webhook per bot" (relay) | o segundo agente no mesmo bot é recusado | nativo (a chave única no banco faz o que o provider faz em memória) | o critério 4 | não precisa (convergem) | — |
| A rota que o Telegram chama | U0, U1 | `platform/access.ts:9,37-44,142-147` (seis tipos; todos menos `page` conferem origem e site) | `TelegramProvider.getRoutes` (`telegram-provider.ts:112-129`, `requiresAuth: false`, 404 para `webhookId` desconhecido em `:523-526`); o adaptador confere o segredo em tempo constante (`@chat-adapter/telegram` `dist/index.js:1543-1563`); Telegram `secret_token` 1-256 `A-Za-z0-9_-` (doc lida em 2026-11-08) | uma rota sem sessão, por id opaco, o segredo no cabeçalho, nunca na URL | embrulhado: nossa rota no Hub (S39 manda a lista fixa), com o tipo `webhook`, que entrega o `Request` a `AgentChannels.handleWebhookEvent` | provado: P1 (segredo errado, 401) | a palavra desta página (U0) | `apps/server/src/builder/channels/webhook-route.ts` |
| O canal posto no `Agent` da versão | U1 | `builder/agents/registry.ts:85` (`addAgent`), `controller.ts:315-333` (troca e remoção) | `TelegramProvider.#createAgentChannels` (`telegram-provider.ts:644-679`), `agent.setChannels` | cria um `AgentChannels` com o adaptador do bot e o põe no agente; refaz quando o agente muda | embrulhado: o registro, ao construir o agente de uma versão com canal, põe o canal | o critério 10 | não precisa | — |
| O cartão de aprovação no Telegram | U3 | o cartão do Hub `apps/web/src/builder/conversation/approval-card.tsx:189` | `toolDisplay` em função (`reference-agents-channels.md:113,150,173-231`); os botões `tool_approve:<id>` / `tool_deny:<id>`; o adaptador faz deles `inline_keyboard` (`dist/index.js:36-80`); o padrão do `TelegramProvider` é `'text'` (`telegram-provider.ts:655`) | o cartão vem de uma função que devolve `{ kind: 'post', message }` com dois botões; aprovado e recusado vêm dos eventos `approved` e `denied` | embrulhado: nossa função em português, com o rótulo e os campos da escrita | provado: P1 (o cartão com dois botões; com `'text'` a escrita fica parada) | não precisa | `apps/server/src/builder/channels/approval-card.ts` |
| Só quem pediu aprova | U3 | `builder/agents/write-of.ts:47-70` (`mayApproveAgents`); a 24.5.1 move a regra para `hub/connectors/approval.ts` | `toolApprovers` padrão `'requester'` (`reference-agents-channels.md:115`; `agent-channels.ts:817-826`) | o clique de outro usuário é ignorado | embrulhado: o nativo fica; o nosso `onAction` confere a ligação e a regra de quem aprova da 24.5.1, e carimba quem aprovou (`guard.ts:40-45,236`, `APPROVED_CALL`) | provado: P1 (o clique de 222 não roda, o de 111 roda; o aprovador chega à ferramenta) | "`toolApprovers: 'requester'`" (roteiro, linha da 24.7) | `apps/server/src/builder/channels/approval.ts` |
| O cartão depois de um reinício | U3 | o Hub responde `not_pending` (`builder/conversation/guard.ts:197-217`) | `agent-channels.ts:731-810` (acha a espera nas mensagens guardadas) e `approveToolCall` (`:405-420`) | a espera vive no armazenamento; o clique depois do reinício retoma | nativo | provado: P2 (roda uma vez; o segundo clique não repete) | não precisa (fato medido, na página) | — |
| Mensagem nova com o cartão aberto | U3 | o Hub recusa o cartão (24.5, roteiro da 24.5.1, passo 3) | no canal, a mensagem espera (P4); `Agent.declineToolCall` (`agent-channels.ts:427-442`) | `M1`: o handler recusa a espera e entrega a mensagem; `M2`: nada | embrulhado (`M1`) | provado: P5 (recusa e responde; o clique atrasado tem de ter frase) | a decisão `M` | — |
| O remetente vira pessoa | U2 | nenhum; `agent_conversation.person_id` exige membro (`builder/agents/tables.ts:197-201`) | Telegram "Deep linking" (doc lida em 2026-11-08); `handlers.onDirectMessage` e `ctx.requestContext` (`reference-agents-channels.md:298-357`); dify `IMBinding` (relay); n8n `allowedUsers` (relay) | a ligação é do produto; o Mastra dá o lugar (o handler) | embrulhado: o código de uso único e a tabela `channel_link` são nossos; o handler e o `requestContext` são nativos | provado: P1 (o handler põe a pessoa e o dono da conversa) | a decisão `A` | `apps/server/src/builder/channels/link.ts` |
| Quem não está ligado | U1, U2 | nenhum | n8n silêncio (`agent-chat-bridge.ts:511-513`, relay); Mastra `resolveSession` (`docs-harness-agent-controller.md:421`) | `B2` silêncio; `B1` a frase | embrulhado: o handler posta a frase e não chama o padrão | provado: P1 (a frase sai, nenhuma conversa) | a decisão `B` | — |
| A pessoa roda o agente da versão | U2 | `builder/agents/agent.ts:59,76,305-333` (`conexus-agent-run`; sem ele, `NO_TURN`); `controller.ts:66-84` (`keptRun`) | `ctx.requestContext` antes do padrão (`reference-agents-channels.md:348-357`); `resolveResourceId` e `resolveThreadId` (`:363-449`) | o handler põe o que a corrida lê; a conversa nasce com o dono e a id escolhidos | embrulhado: o `AgentRun` e a linha `agent_conversation` são nossos | o critério 14 | não precisa | `apps/server/src/builder/channels/message.ts` |
| A conversa no Hub | U2, U4 | `builder/agents/conversation-routes.ts:248-262` (lista por dono e marca) | n8n lista as conversas por agente, com a origem (`agent-execution.entity.ts:150-151`, relay) | a conversa do canal aparece com a marca do canal | embrulhado: a coluna `channel` e a conversa só de leitura | os critérios 15, 19 e 28 | não precisa | — |
| A frase de falha | U2 | nenhum | `formatError` (`reference-agents-channels.md:103`; padrão `"❌ Error: <message>"`) | uma função que devolve a mensagem | nativo (a opção), com nossa frase | provado: P5 (o padrão mostra o erro cru em inglês) | não precisa | — |
| Mensagens longas | U2 | nenhum | `@chat-adapter/telegram` `longMessages` padrão `"truncate"`, limite 4096 (`dist/index.js:132,1434`), `"split"` espaça e espera o `retry_after` (`:2410-2459`) | `"split"` manda em partes | nativo (a opção `"split"`) | o critério 18 | não precisa | — |
| O tamanho do botão | U3 | `ToolCallId` até 200 (`packages/hub-api/src/questions.ts:4`) | `callback_data` 64 bytes (`@chat-adapter/telegram` `dist/index.js:32,82-95`) | lança um erro de validação; nada sai | embrulhado: nossa função confere o tamanho antes e posta a frase | provado: P3 (id de 52: nada sai, nada roda, nenhum erro visível) | não precisa | — |
| Grupos | U2 | nenhum | `onMention: false` (`reference-agents-channels.md:298-304`); privacy mode do Telegram (doc lida) | o handler desligado não roda | nativo | o critério 18 | não precisa | — |

**A medida do transplante.** Nada vem do produto antigo: ele não tinha canal.

**A dívida.**

- O registro (`registry.ts`) e o canal ficam em memória por processo: com dois processos do Hub, o
  Telegram chega a um só. Gatilho: a etapa 16 (atualizar sem cortar).
- O `TelegramProvider` do Mastra não serve como está (o token fora do cofre, a rota fora da lista e o
  modo de texto). Gatilho: uma versão do `@mastra/telegram` com `tokenResolver` por bot e rota
  montável pelo anfitrião; aí a U1 encolhe.
- A corrida de aprovação medida na 24.5 (o clique no mesmo instante do cartão) não foi medida no
  canal. Gatilho: um clique perdido visto no uso.

## U0 O tipo de acesso `webhook`

**Base e modelo.** `main` do dia; Sonnet (documento).

### As linhas da tabela

"A rota que o Telegram chama".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/guides/security.md` (S48) | muda: sete tipos; `webhook` é um `POST` em `/api/channels/`, sem sessão, cookie, `Origin` nem `Sec-Fetch-*`, conferido só pelo segredo do provedor em tempo constante | a U1 |
| `docs/guides/code.md` (C33) | muda só a contagem de tipos, se a regra a cita | a U1 |

### A ordem do trabalho

1. Emendar S48 com uma frase para `webhook`, sem restaurar as outras. Regras: L20, L24.
2. `npm run docs`; abrir como pull request de documentos com a palavra do fundador (esta página).

### Como se prova

`npm run docs` verde.

### Parar se

A emenda muda o que outro tipo faz.

## U1 O bot ligado ao agente

**Base e modelo.** `main` com a 24.6; Opus, porque cruza o registro de agentes, o acesso e o selo.

### As linhas da tabela

- **O canal do agente.** Ler `builder/agents/registry.ts:60-110` (o `build` e o `addAgent`) e
  `controller.ts:248-330`. Copiar a forma de `TelegramProvider.#getOrCreateAdapter` e
  `#createAgentChannels` (`telegram-provider.ts:611-679`): `createTelegramAdapter({ botToken,
  secretToken, userName, mode: 'webhook' })` e `new AgentChannels({ adapters: { telegram: { adapter,
  toolDisplay, streaming: false } }, handlers, resolveResourceId, resolveThreadId, threadContext: {
  maxMessages: 0 } })`, depois `agent.setChannels(channels)` e `await channels.initialize(mastra)`.
- **Ligar e desligar.** As funções `getMe`, `setWebhook`, `deleteWebhook`, `generateSecretToken` de
  `@mastra/telegram@0.2.5`, com `apiBaseUrl` vindo da configuração (o falso nos testes). A ordem de
  `connect` em `telegram-provider.ts:360-418`: o `getMe`, a recusa de bot repetido, o `setWebhook`, e
  só então gravar.
- **O token e o segredo no cofre.** `seal.ts:47-70`: o propósito `channel`, com `rowId` a id da linha
  e `companyId`. O conteúdo selado é `{ botToken, secretToken }` (C26: um dono).
- **A rota que o Telegram chama.** `access.ts:9,37-44,142-158`: o tipo `webhook` em `ALLOWED`
  `{ methods: ['POST'], path: /^\/api\/channels\// }`, sem `checkSite`, `checkWrite` nem sessão.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/channels/` | cria | o servidor (a rota), o registro de agentes |
| `apps/server/src/builder/agents/registry.ts`, `controller.ts` | muda: o `build` põe o canal; a remoção e a troca o refazem | a U2, a U3 |
| `apps/server/src/platform/access.ts`, `seal.ts` | muda: o tipo `webhook`; o propósito `channel` | todas as rotas; o selo |
| `apps/server/migrations/`, `apps/server/database-grants.sql`, o retrato do catálogo | cria a migração e as permissões, num pull request próprio dentro da unidade (D11) | `catalog.test.ts` |
| `packages/hub-api/src/channels.ts` (novo), `index.ts`, os códigos de falha | cria | o servidor, a web (U4) |
| `package.json`, `package-lock.json` da raiz e de `apps/server` | muda: `@mastra/telegram@0.2.5`, que traz `@chat-adapter/telegram@^4.44.0` | CI (L16) |

### Os contratos que a unidade cria

Em `packages/hub-api/src/channels.ts`:

```ts
export const ChannelPlatform = z.enum(['telegram'])
export const WebhookId = z.uuid().brand('WebhookId')
/** O formato do token que o BotFather dá; quem confere é o `getMe`. */
export const BotToken = z.string().min(1).max(256).regex(/^\d+:[A-Za-z0-9_-]+$/)

export const TelegramChannel = z.discriminatedUnion('state', [
  z.object({ state: z.literal('OFF') }),
  z.object({ state: z.literal('ON'), botUsername: z.string(), connectedAt: z.iso.datetime() }),
])

export const getAgentChannels // GET `${BASE}/{agentId}/channels`, session (readAgents)
//   → 200 { telegram: TelegramChannel, mine: MyTelegram }   (MyTelegram é da U2; na U1, { state: 'NONE' })
export const connectTelegram // PUT `${BASE}/{agentId}/channels/telegram`, session, body { token: BotToken }
//   → 200 TelegramChannel; falhas: NOT_FOUND, AGENT_NOT_FOUND, NOT_IN_ROLE, CHANNEL_TOKEN_REFUSED,
//     CHANNEL_BOT_TAKEN, CHANNEL_AGENT_UNPUBLISHED, CHANNEL_AGENT_MACHINE, CHANNEL_UNAVAILABLE,
//     DATABASE_UNAVAILABLE
export const disconnectTelegram // DELETE `${BASE}/{agentId}/channels/telegram`, session → 204
export const receiveTelegram // POST `/api/channels/telegram/{webhookId}`, webhook, bodyLimit o padrão
//   do Fastify (1 MiB) → a resposta do adaptador (200, 400, 401) ou 404
```

O acesso de ligar e desligar é `manageConnections` com `Q1`, ou `publishAgent` com `Q2`
(`hub/identity/admission.ts:90-100`), conferido na rota e de novo na gravação (S8).

Tabelas, no esquema `builder` (modelo: `builder/agents/tables.ts:177-210`, que cumpre C23 e C26 pela
chave composta com a empresa; a política `OWN` de empresa):

- `agent_channel`: `id uuid pk`, `company_id text not null` (FK `company`, cascata),
  `agent_id uuid not null` (FK `(company_id, agent_id)` para `agent`, cascata),
  `platform text not null check (platform = 'telegram')`, `webhook_id uuid not null unique`,
  `bot_user_id bigint not null unique`, `bot_username text not null`, `sealed bytea not null`,
  `key_id text not null`, `connected_by text not null`, `connected_at timestamptz not null default
  now()`; `unique (company_id, agent_id, platform)`.
- `channel_link` (a U2 usa; nasce aqui para um pull request só de permissões): `company_id`,
  `person_id` (FK `(company_id, person_id)` para `member`, cascata, como `agent_conversation`),
  `platform`, `state text check (state in ('PENDING','LINKED'))`, `code_hash bytea`,
  `external_user_id text`, `external_name text`, `updated_at`; `check` que `PENDING` tem
  `code_hash` e não `external_user_id`, e `LINKED` o contrário (C21 no banco);
  `unique (company_id, person_id, platform)`, `unique (code_hash)`,
  `unique (company_id, platform, external_user_id)`.
- `agent_conversation.channel text null check (channel in ('telegram'))` (D6: só acrescenta).
- `builder.channel_of(webhook uuid) RETURNS TABLE (company_id text, agent_id uuid, sealed bytea,
  key_id text)`, `SECURITY DEFINER`, o único leitor sem empresa, no modelo de
  `connectors.sealed_of` (`migrations/20261029024300_e19_connection_grants/migration.sql:17`).

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/server/src/builder/` e `platform/` (Mastra,
Fastify, Drizzle). Ler primeiro `docs-channels.md` e `reference-agents-channels.md` do Mastra
instalado.

### A ordem do trabalho

1. A migração, o retrato do catálogo e `database-grants.sql`, num pull request próprio (D6, D11,
   D12).
2. O tipo `webhook` em `access.ts` com o seu teste (C33).
3. O propósito `channel` em `seal.ts`.
4. `channels.ts` no hub-api e os códigos de falha.
5. `builder/channels/connect.ts`: ligar e desligar, como a ordem de `connect` do provider. A linha
   recusada pelo banco depois do `setWebhook` chama `deleteWebhook` (a tabela de falhas).
6. `builder/channels/telegram.ts`: o adaptador e o `AgentChannels` de uma linha; o registro chama
   isso no `build` de um agente com canal, e o `followed` refaz no `ACTIVATED` e apaga no `DELETED`.
   O handler `onDirectMessage` desta unidade posta a frase da `B1` (ou nada, com `B2`) e retorna.
7. `builder/channels/webhook-route.ts`: `channel_of`, 404 sem linha, o `Request` ao canal.

### Como se prova

Um Bot API falso local, no modelo de `proof/fake-telegram.mjs` do estudo, como dublê de teste em
`builder/channels/test-telegram.ts`, ligado por `apiBaseUrl`. Os critérios 1 a 10, pela porta
pública (T5). A gravação T26 `channel-telegram-message` (`npm run record`) dá a forma das mensagens
guardadas que a U2 lê.

### Parar se

- O `AgentChannels` posto no `Agent` da versão não recebe a mensagem pelo `handleWebhookEvent`
  chamado pela nossa rota (o canal pede `initialize(mastra)` antes): parar e mostrar o log.
- O registro troca o `Agent` sem passar por um ponto onde o canal possa ser posto.

## U2 A pessoa no Telegram

**Base e modelo.** `main` com a U1; Opus, porque toca o turno, a conta de modelo e o dono da
conversa.

### As linhas da tabela

- **O remetente vira pessoa.** `onDirectMessage(thread, message, defaultHandler, ctx)`
  (`reference-agents-channels.md:321-357`): o `/start <código>` e a ligação; depois a pessoa.
- **A pessoa roda o agente da versão.** `agent.ts:59,76` (`conexus-agent-run`), o `AgentRun`
  `{ kind: 'PUBLISHED', scope: { companyId, projectId, personId }, agentId }` (com o `number` e o
  `answeredBy` que a 24.6 acrescenta, `e246` linhas 1829-1875), posto em `ctx.requestContext` antes do
  padrão. `resolveResourceId` devolve `resourceOf('agents', owner)` (`controller-kit/kinds.ts:56`);
  `resolveThreadId` cria a `ConversationId` e a linha `agent_conversation` com `channel: 'telegram'`.
- **A conversa no Hub.** `conversation-routes.ts:220-262`: a lista lê a coluna nova; mandar mensagem
  numa conversa com `channel` responde `CHANNEL_CONVERSATION`.
- **A frase de falha** e **mensagens longas**: `formatError` e `longMessages: 'split'`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/channels/` | muda | a rota da U1 |
| `apps/server/src/builder/agents/conversation-routes.ts`, `open.ts` | muda: a coluna `channel` na lista; a recusa de mensagem | a web |
| `apps/server/src/builder/conversation/guard.ts` | muda: `CHANNEL_CONVERSATION` antes de rodar | as sete rotas |
| `apps/server/src/platform/recordings/mastra/` | cria a gravação `channel-telegram-message` | os testes |
| `packages/hub-api/src/channels.ts`, `agents.ts` | muda: `MyTelegram`, `createTelegramLink`, `deleteMyTelegram`, `AgentConversationListed.channel` | a web |

### Os contratos que a unidade cria

```ts
export const MyTelegram = z.discriminatedUnion('state', [
  z.object({ state: z.literal('NONE') }),
  z.object({ state: z.literal('LINKED'), telegramName: z.string() }),
])
export const createTelegramLink // POST `${BASE}/{agentId}/channels/telegram/links`, session (manageAgents)
//   → 201 { url: string }; falhas: CHANNEL_OFF, NOT_IN_ROLE, NOT_FOUND
export const deleteMyTelegram // DELETE `/api/companies/{companyId}/channel-links/telegram`, session → 204
// AgentConversationListed ganha `channel: ChannelPlatform.nullable()`
// falha nova: CHANNEL_CONVERSATION
```

O código: 32 bytes aleatórios em base64url (43 caracteres, dentro dos 64 do `start`); guarda-se só o
SHA-256 (`code_hash`). Um código vale até ser usado ou trocado; nenhum prazo inventado.

O remetente é o `message.author.userId` do adaptador (`dist/index.js:3858`), uma `string`; na tabela,
`external_user_id`. As frases fixas vivem num só arquivo (`builder/channels/sentences.ts`, C26).

### As skills e a leitura

As mesmas da U1.

### A ordem do trabalho

1. `link.ts`: gerar o código e consumir o `/start` com um `UPDATE` condicional (a tabela de falhas).
2. `message.ts`: o handler. Em ordem, sem chamar o padrão salvo no último caso: grupo (não é DM) →
   nada; `/start <código>` → ligar e responder; sem ligação → a frase da `B1`; sem `manageAgents` →
   a frase do papel; senão, o `AgentRun` e o padrão. Admissão em toda mensagem (S7, S8).
3. `resolveResourceId` e `resolveThreadId`: o dono e a linha `agent_conversation`.
4. `formatError` com a frase do critério 17; `onMention: false`; `longMessages: 'split'`.
5. A lista e a recusa `CHANNEL_CONVERSATION`.
6. A gravação T26 e os testes.

### Como se prova

Os critérios 11 a 19, pela rota pública da U1 com o Bot API falso e o modelo de teste dos agentes
(`builder/agents/test-agents.ts`). O critério 14 confere a conta de modelo da pessoa pela fila
(`model-accounts`), como os testes de hoje das conversas de agente.

### Parar se

- O turno não está posto quando a resposta chega depois de uma ferramenta (a retomada não chama o
  `processInput`, a memória medida na 14.2): a U3 põe o turno no `onAction`; se a primeira mensagem
  também falhar, parar e mostrar.
- A conversa do canal aberta pela rota do Hub não mostra a mensagem da pessoa (o canal guarda a
  mensagem com o papel `signal`, prova P4): parar e trazer a gravação, sem escrever conversão à mão.

## U3 Aprovar no Telegram

**Base e modelo.** `main` com a U2 e a 24.5.1; Opus, pela retomada e a regra de quem aprova.

### As linhas da tabela

- **O cartão.** `toolDisplay(event, ctx)`: `approval` → `{ kind: 'post', message: card }` com
  `tool_approve:<toolCallId>` e `tool_deny:<toolCallId>` (`reference-agents-channels.md:173-231`);
  `approved` → "Aprovado por você"; `denied` → "Recusado"; `running`, `result` e `error` →
  `undefined`, como o modo de hoje das ferramentas na conversa do Hub, que não mostra cada leitura.
- **Só quem pediu.** `handlers.onAction(event, defaultHandler, ctx)`: a ligação de
  `event.user.userId`, a regra de quem aprova da 24.5.1 (o lugar único que ela cria em
  `hub/connectors/approval.ts`), `ctx.requestContext.set('conexus-approved-call', { toolCallId,
  personId })` (`guard.ts:40-45`; exportar um `approvedCallSet` de lá, C26), o `AgentRun` e o turno, e
  `await defaultHandler()`.
- **Mensagem nova com o cartão aberto** (`M1`): no handler da U2, antes do padrão, achar a espera
  como o canal acha (`agent-channels.ts:755-809`: as mensagens da conversa, `pendingToolApprovals`),
  chamar `agent.declineToolCall({ runId, toolCallId, memory })`, consumir o fluxo e editar o cartão
  para "Recusado" pelo adaptador (`adapter.editMessage`).
- **O clique atrasado.** O erro "could not find a suspended run" (P5) e "No snapshot found"
  (`agent-channels.ts:975-978`) viram "Este cartão já foi respondido." pelo `formatError`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/channels/` | cria `approval-card.ts`, `approval.ts`; muda `message.ts` | a U2 |
| `apps/server/src/builder/conversation/guard.ts` | muda: exporta quem põe o `APPROVED_CALL` | `agents/tools.ts` |

### Os contratos que a unidade cria

Nenhuma rota. A forma do cartão: `{ type: 'card', title, children: [{ type: 'section', children:
[os campos abertos] }, { type: 'actions', children: [Aprovar, Recusar] }] }`, com o rótulo da escrita
lido como o cartão do Hub o lê (a operação do kit). O tamanho: `Buffer.byteLength('chat:{"a":"tool_approve:' + id + '"}') <= 64`; se não cabe, a frase do critério 26 e a recusa da espera.

### As skills e a leitura

As mesmas da U1.

### A ordem do trabalho

1. `approval-card.ts` e o teste do cartão (critério 20).
2. `approval.ts`, o `onAction` (critérios 21 a 23, 25).
3. A recusa por mensagem nova no `message.ts` (critério 24).
4. O tamanho do botão (critério 26).

### Como se prova

Os critérios 20 a 26 com o Bot API falso; o critério 25 com dois `Mastra` sobre o mesmo banco de
teste, como a prova P2. A gravação T26 `channel-telegram-approval` dá a forma de
`pendingToolApprovals` que o passo 3 lê.

### Parar se

- A regra de quem aprova da 24.5.1 não está no `main`: usar `mayApproveAgents`
  (`write-of.ts:47`) e dizer no relatório.
- O `editMessage` do cartão recusado precisa do id da mensagem que o canal não guarda: parar e
  mostrar onde ele está.

## U4 As telas

**Base e modelo.** `main` com a U1 (a seção) e a U2 (a lista); Sonnet.

### As linhas da tabela

"A conversa no Hub" e os estados da matriz.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/agents/` | cria `channels-section.tsx`; muda `agent-page.tsx`, `queries.ts`, `agent-chat.tsx` | a página do agente |
| `apps/web/src/builder/conversation/` | muda: a caixa trocada pela frase numa conversa com `channel` | a conversa do agente |
| `docs/reference/screens.md` | muda: a seção **Canais** | QA |

### A ordem do trabalho

1. `channels-section.tsx` no modelo de `connections-section.tsx`, com os estados da matriz.
2. **Ligar meu Telegram** abre a `url` numa aba nova (o Telegram abre o app no celular).
3. A marca na lista e a conversa só de leitura.

### Como se prova

Os critérios 27 e 28; QA a 1280 e a 390 px, nos dois temas (T25).

### Parar se

Um texto da tela não está nesta página ou na matriz: perguntar, não inventar.
