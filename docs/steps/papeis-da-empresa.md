# Etapa Papéis da empresa

O roteiro chama esta etapa de "Papéis da empresa. A empresa cria papéis e escolhe o que cada um, o
Membro também, usa de cada conector." Ela vem depois da 24.3.5 e antes da 24.5, pela resposta "5.
Sim" do fundador (2026-11-03). Pela regra L5, este cartão espera em rascunho a vaga da fronteira, e a
verificação `second-card` fica vermelha nele de propósito. Cada linha citada foi relida no `main` em
`1b20614d`, com `better-auth` 1.7.8 e `@mastra/core` 1.82.0. O construtor de cada unidade reabre as
linhas no `main` do dia.

Este cartão é também o modelo de governança que a plataforma inteira usa. Três perguntas, cada uma
com um dono, e nenhum segundo motor:

| Pergunta | Dono | Quem constrói |
| --- | --- | --- |
| **Quem** pode usar uma operação de um conector | O papel da pessoa, nos papéis dinâmicos do Better Auth | Esta etapa |
| **Onde** a operação vale | A ligação liberada ao Projeto (`connectors.project_connection`) | Já existe |
| **Se o agente pergunta antes** de uma operação | Uma chave por ferramenta, guardada na versão publicada do agente e lida pela regra nativa `requireApproval` da ferramenta | A 24.5 |

Nada disso mora no estado de sessão do Mastra: as regras de permissão dele não duram um reinício se
o anfitrião não as restaurar (`@mastra/core` 1.82.0, `reference-agent-controller-session.md:650`).
Os pedidos da 24.3.4 e as ferramentas da biblioteca e em código (24.4) leem o mesmo papel.

## A página do fundador

**No fim desta etapa** você cria um papel na sua empresa, escolhe nele o que a pessoa usa de cada
conector, por assunto e com o detalhe de cada operação, faz o mesmo com o Membro, e vê o Assistente
de quem tem esse papel recusar o que o papel não deixa.

**O roteiro de uso.** Você é a Ana (dona). A ligação do Sankhya está liberada ao Projeto "Vendas", e o
Bruno é Membro.

1. Em **Configurações › Papéis**, aparecem os quatro papéis de hoje. Dono e Administrador dizem "Usa
   tudo de todos os conectores". Desenvolvedor e Membro dizem "Lê tudo de todos os conectores",
   porque é o que eles fazem hoje.
2. Toque **Novo papel**, escreva "Atendente". Aparece a lista dos conectores. Em Sankhya, marque o
   assunto **Vendas**. Abra o detalhe: aparecem as operações de Vendas, cada uma com "lê", "escreve"
   ou "apaga". Deixe só **Listar pedidos**. Salve. A linha diz "Sankhya: 1 operação de Vendas".
3. Abra o **Membro**. Em Sankhya, desmarque o assunto **Financeiro** e a **Porta de leitura** (a
   consulta livre). Salve.
4. Em **Pessoas**, no Bruno, troque o papel para **Atendente**.
5. Entre como o Bruno, no Projeto "Vendas", e peça ao Assistente "me mostra os pedidos de ontem".
   Ele mostra. Peça "quanto faturamos este mês". Ele responde que o seu papel não usa essa parte do
   Sankhya e diz a quem pedir.
6. Volte como Ana e tente apagar o papel Atendente: o Conexus diz que o Bruno ainda o usa. Troque o
   Bruno para Membro e apague.

**O que você faz, e quando.** Antes: nada. No começo: responde às decisões abaixo e aprova esta
página. No fim: faz o roteiro na sua empresa, diz o que viu e aprova os textos das telas.

**O que o estudo mostrou** (2026-11-06, desta máquina, com modelo de mentira e Postgres 18 local).

- **Sobre a sua pergunta A, o "nativo do Mastra"** (medido). Você estava certo: era sintoma. A perda
  de 12 leituras em 200 do cartão da 24.5 vinha de como o teste ligou o Mastra. Do jeito que estava,
  o Mastra para toda chamada, inclusive leitura, e se aprova sozinho logo em seguida; essa aprovação
  instantânea perde a corrida da trava da decisão 0053. Quando cada ferramenta diz por si se precisa
  perguntar (`requireApproval` como função, a palavra final do Mastra para aquela ferramenta), a
  leitura nem para: **200 de 200**. Com metade das escritas perguntando e metade rodando sozinha, as
  200 escritas saíram também. O defeito vai ao Mastra com um relato pronto, ainda não mandado.
- **Sobre a B, a autonomia** (lido nas páginas e no código, 2026-11-06). Todo mundo dá autonomia por
  ferramenta: OpenAI (`needsApproval`), LangChain (`interrupt_on`), Google ADK
  (`require_confirmation`), n8n, Copilot Studio ("Ask the end user before running", **desligado** por
  padrão), Agentforce, ServiceNow ("Autonomous" ou "Supervised" por ferramenta), Claude Code e o
  Mastra Code (ler livre, editar e rodar perguntam). Quem decide é quem monta o agente, dentro do
  teto da empresa. Para um cliente no WhatsApp sem ninguém olhando, ninguém documenta uma fila de
  funcionários aprovando. Ou a ação roda sozinha dentro de limites, ou a ferramenta nem existe até o
  cliente se identificar (Sierra), ou o caso passa a uma pessoa. O ServiceNow diz que uma ferramenta
  supervisionada, numa execução sem ninguém, para e espera.
- **Sobre a C, a coerência**: o papel diz quem, a liberação diz onde, a versão do agente diz se
  pergunta. A 24.5 só acrescenta a terceira, sem mudar as outras.
- **Sobre a D, o pedido no Sankhya** (lido na documentação pública, sem chamar o Sankhya). Lançar um
  pedido é `POST /v1/vendas/pedidos`, e ele nasce "a confirmar". Desfazer pela API é **cancelar**,
  com um motivo; apagar de vez não está na API, e um pedido faturado não cancela. Está no anexo "O
  que muda na 24.5", no relatório.

**Fica de fora.**

- **A chave "pergunta antes" ou "roda sozinho" nas ferramentas de um agente**, e o cartão
  **Aprovar?**. É a 24.5, já neste modelo (decisão D).
- **Um papel por ligação** ("o Bruno lê o Sankhya da matriz, mas não o da filial"). O Better Auth
  diz conector, não ligação; o "onde" continua na liberação ao Projeto (decisão A).
- **Mudar os direitos do Dono e do Administrador** sobre os conectores. Eles usam tudo, sempre, para
  ninguém se trancar fora (decisão B).
- **Um agente num canal de cliente** (WhatsApp, Telegram). É a 24.7; a decisão D diz como ele herda
  este modelo.
- **Os avisos guardados para um cartão** (`next-card`): nenhum toca papéis de conector. O buraco do
  estudo de autorização das ferramentas (todo membro roda a consulta livre do Sankhya) é fechado por
  esta etapa, pelo passo 3 do roteiro.

**As decisões suas nesta etapa.** A recomendação vem primeiro em cada uma.

- **A. O papel escolhe por conector ou por ligação?**
  - `A1` (recomendo): por conector, com o assunto e a operação. Caso real: o Claude Enterprise dá a
    cada papel os conectores e as ações, e o Activepieces escolhe as ações por projeto; ninguém lido
    escolhe por conta. Exemplo: "Atendente lê pedidos do Sankhya", valendo para qualquer ligação do
    Sankhya que o Projeto tenha. Objetivo: uma tela só, que acompanha o kit. Nativo:
    `createAccessControl` com um recurso por conector e as operações como ações, e
    `dynamicAccessControl` do Better Auth 1.7.8.
  - `A2`: por ligação. Seria nosso (uma tabela de papel por ligação e uma tela em Ligações), porque o
    Better Auth não sabe dizer "esta ligação". Mais 900 a 1.300 linhas.
- **B. Os quatro papéis fixos.**
  - `B1` (recomendo): Dono e Administrador usam tudo, fixo; Desenvolvedor e Membro se editam como um
    papel criado, e começam lendo tudo, como hoje. Uma operação nova que o kit ganhar chega ao Dono e
    ao Administrador, e aos outros só quando você marcar. Caso real: o Claude Enterprise, onde a
    política da empresa é o teto e o administrador não se tranca. Exemplo: você tira o Financeiro do
    Membro, e ninguém da empresa perde o acesso de administrar. Nativo: o Better Auth soma a linha
    guardada ao papel fixo de mesmo nome; o Conexus só semeia, uma vez por empresa, a primeira linha
    do Membro e do Desenvolvedor, porque o Better Auth recusa criar um papel com nome de fixo
    (provado).
  - `B2`: os quatro editáveis. Um dono poderia tirar de si mesmo o acesso e ficar sem saída.
- **C. Quando um agente publicado conversa, ele age com o papel de quem?**
  - `C1` (recomendo): com o que a versão do agente declara. Quem publica precisa poder cada operação
    que a versão usa, como o seu "8. Sim" para os apps. Quem só conversa com o agente não precisa
    do papel. O Assistente, que não tem versão, age com o papel de quem conversa. Caso real: no
    Copilot Studio a ferramenta roda com a credencial do criador ou de quem conversa, à escolha; no
    Agentforce o agente de atendimento roda como um usuário próprio, com as permissões dele.
    Exemplo: o agente "Atendimento", publicado pela Ana, lê pedidos para um cliente que não é da
    empresa. Objetivo: um agente funciona para quem não tem papel nenhum, como um cliente no WhatsApp.
    Nativo: a conferência de publicar que já existe (`ungranted`), mais o papel.
  - `C2`: sempre com o papel de quem conversa. Um cliente no WhatsApp não tem papel, e o agente não
    faria nada para ele.
- **D. A autonomia de um agente, que a 24.5 constrói.**
  - `D1` (recomendo): cada ferramenta de um agente tem a chave **pergunta antes** ou **roda
    sozinho**. Ler roda sozinho sempre. Escrever começa em "pergunta antes". Quem publica escolhe,
    e só pode deixar uma escrita "roda sozinho" se o papel dele tiver a ação **Publicar agente que
    escreve sozinho**, que o Dono e o Administrador têm e que você dá a outros papéis se quiser. Onde
    ninguém da empresa está olhando (um cliente no WhatsApp, uma automação), uma escrita que pergunta
    não é oferecida ao agente até a 24.6 e a 24.7 decidirem a fila. Caso real: Copilot Studio
    (por ferramenta, desligado por padrão), ServiceNow (Autonomous ou Supervised por ferramenta;
    supervisionada sem ninguém para e espera), Claude Code (o administrador manda acima de todos).
    Exemplo: o agente "Pedidos" lança o pedido no Sankhya sozinho à noite, porque você publicou assim;
    o "Atendimento" pergunta antes. Nativo: `requireApproval` como função em cada ferramenta, com o
    `yolo` desligado nos agentes e no Assistente; medido sem perda.
  - `D2`: toda escrita pergunta sempre, sem autonomia (a recomendação antiga da 24.5). Mais simples,
    mas um agente sem ninguém olhando nunca escreveria.
  - `D3`: a autonomia por valor (até R$ 1.000 roda sozinho). O Mastra deixa (a regra recebe os
    argumentos), mas é uma tela a mais; fica para depois.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 Os papéis no servidor | `dynamicAccessControl` ligado; os recursos de conector montados do kit; a tabela `auth.organization_role` e as linhas semeadas do Membro e do Desenvolvedor; `Role` aberto a nome conferido; as rotas de listar, criar, mudar e apagar um papel; dar um papel próprio a uma pessoa e convidar com ele | `apps/server/src/hub/identity/`, `packages/hub-api/src/{roles,identity,failures}.ts`, `apps/server/migrations/` | [security](../guides/security.md) | esta página aprovada |
| U2 O papel vale em toda porta | Uma função `mayUse` sobre o `hasPermission` nativo; a lista do modelo só com o que a pessoa pode (Builder e Assistente); a recusa na hora de rodar (leitura, porta de leitura, ferramenta da biblioteca, ferramenta em código, caderno); a conferência de publicar (quem publica pode cada operação da versão) | `apps/server/src/hub/connectors/`, `apps/server/src/builder/{assistant,agents,tools,connectors}/` | [security](../guides/security.md) | U1 |
| U3 A tela | **Configurações › Papéis**: a lista, o papel novo, a edição por conector, assunto e operação; **Pessoas**: os papéis próprios na troca e no convite | `apps/web/src/hub/identity/`, `docs/reference/screens.md` | [web](../guides/web.md) | U1 |

A U2 e a U3 correm em paralelo depois da U1: não dividem pasta.

**Orçamento de código alterado.** U1: ~1.100 (a configuração e os recursos, a migração e a semente,
o `Role` aberto em hub-api, admissão, `rankAllows` e `mayInviteAs`, as quatro rotas, as falhas). U2:
~700 (a função, cinco portas, a conferência de publicar, os textos de recusa ao modelo). U3: ~1.200
(duas telas, o diálogo de apagar, a troca de papel). Total da etapa: ~3.000, dentro da regra L2.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `GET /api/companies/{c}/roles` traz os quatro fixos e os da empresa, cada um com `connectors: { [connectorId]: operationId[] }`; numa empresa nova, Membro e Desenvolvedor trazem toda operação `read` do kit, Dono e Administrador toda operação | `hub/identity/roles.test.ts`, "a lista dos papéis" | must |
| 2 | U1 | Dono ou administrador cria "Atendente" com `{ sankhya: ['pedidos_listar'] }` (ids do kit); a lista o traz; uma segunda criação igual responde `ROLE_NAME_TAKEN` e não grava | `hub/identity/roles.test.ts`, "criar um papel" | must |
| 3 | U1 | Recusa: Desenvolvedor e Membro recebem `NOT_FOUND` ao criar, mudar ou apagar papel (S10); um conector ou operação fora do kit dá `REQUEST_MALFORMED` antes de chamar o Better Auth; o nome de um fixo dá `ROLE_NAME_TAKEN`; mudar Dono ou Administrador dá `ROLE_FIXED`; nada muda | `hub/identity/roles.test.ts`, "o papel recusado" | must |
| 4 | U1 | Mudar o Membro tira o assunto Financeiro: a lista o traz sem as operações dele, e a resposta seguinte de `mayUse` para um Membro é `false` (critério 8 cruza as unidades) | `hub/identity/roles.test.ts`, "mudar o Membro" | must |
| 5 | U1 | Apagar um papel que alguém usa, ou que um convite aberto usa, dá `ROLE_IN_USE` e não apaga; sem ninguém, apaga, e a lista não o traz | `hub/identity/roles.test.ts`, "apagar um papel" | must |
| 6 | U1 | Trocar o papel de uma pessoa para "Atendente" e convidar como "Atendente" funcionam; um nome que não existe na empresa dá `ROLE_NOT_FOUND`; `rankAllows` trata um papel próprio abaixo do Administrador | `hub/identity/memberships.test.ts`, "papel próprio"; `invitations.test.ts`, "convite com papel próprio" | must |
| 7 | U1 | A migração semeia, em cada empresa existente, as linhas de `member` e `developer` com toda leitura do kit; rodar de novo não duplica | `hub/identity/roles.test.ts`, "a semente" | must |
| 8 | U2 | No Assistente de um Atendente, no Projeto com a ligação do Sankhya, o modelo recebe só `pedidos_listar` na descrição das ligações; pedir outra operação pelo id dá ao modelo `NOT_IN_ROLE` com o nome do papel, e o dublê do Sankhya não recebe nada | `hub/connectors/assistant-port.test.ts`, "o papel na leitura" | must |
| 9 | U2 | Igual no Builder (`described` e a leitura) e na porta de leitura do Sankhya (`carregar`, `consultar`): sem a operação da porta no papel, ela não aparece e é recusada | `hub/connectors/builder-port.test.ts`, "o papel na leitura"; `door.test.ts`, "a porta pelo papel" | must |
| 10 | U2 | Uma ferramenta da biblioteca ou em código num agente publicado roda para quem conversa sem papel (decisão `C1`), e publicar uma versão cuja ferramenta usa uma operação que o papel de quem publica não tem dá `NOT_IN_ROLE` com a operação | `builder/agents/publish.test.ts`, "publicar pelo papel" | must |
| 11 | U2 | A troca de papel vale no turno seguinte, sem reiniciar a conversa: tirar a operação no meio da conversa faz a próxima chamada recusar | `hub/connectors/assistant-port.test.ts`, "o papel muda" | must |
| 12 | U2 | O caderno: anotar continua exigindo `manageConnections`, e ler as notas segue o papel na operação | `builder/assistant/notes.test.ts`, "notas pelo papel" | should |
| 13 | U3 | Em Configurações › Papéis, o dono cria "Atendente", marca Vendas e deixa só Listar pedidos, salva, e a linha diz "Sankhya: 1 operação de Vendas"; o Membro e o Desenvolvedor não veem o item Papéis | `apps/web/src/hub/identity/roles.test.tsx`, "criar um papel" | must |
| 14 | U3 | Apagar um papel em uso mostra quem o usa e não apaga; em Pessoas, a troca e o convite listam os papéis próprios | `apps/web/src/hub/identity/roles.test.tsx`, "apagar"; `people.test.tsx`, "papel próprio" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Configurações › Papéis | Os quatro fixos, sem papel próprio, e o botão **Novo papel** | "Sua empresa ainda não criou papéis." abaixo dos fixos | A lista em esqueleto | "Não deu para carregar os papéis." com **Tentar de novo** | — | O item não aparece para Desenvolvedor e Membro | — |
| O papel aberto | Os conectores do kit, cada um com os assuntos | Um conector sem operação que o papel use mostra "Não usa" | Os conectores em esqueleto | O erro ao salvar fica na tela, com o que foi marcado | "Este papel não existe mais." ao abrir um apagado | Dono e Administrador abertos só para ler | `ROLE_NAME_TAKEN`, `ROLE_IN_USE` com quem usa |
| Pessoas, troca de papel | Os quatro fixos e os próprios | — | — | O erro na linha da pessoa | `ROLE_NOT_FOUND` se o papel foi apagado | Como hoje | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Role` (nome do papel, fixo ou próprio) | U1, `packages/hub-api/src/roles.ts` | U1 (admissão), U3 (Pessoas, convite) |
| `RoleView.connectors` (conector → operações) | U1, rota de papéis | U3 (a tela), U1 (critério 1) |
| `RoleView.fixed` (`ALL`, `EDITABLE`, `CUSTOM`) | U1 | U3 (o que se edita) |
| `RoleView.members` (quantas pessoas usam) | U1 | U3 (apagar) |
| `NOT_IN_ROLE` (falha ao modelo e à rota de publicar) | U2 | O modelo; U3 não lê |

As caixas das telas, a 1280 e a 390 px, são desenhadas pela U3 em `docs/reference/screens.md` antes
do código, seguindo a tela de Pessoas de hoje e as regras de Impeccable; o produto antigo não tinha
papéis próprios.

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio | Uma dependência fora | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Criar papel (`auth.api.createOrgRole`) | A segunda dá `ROLE_NAME_TAKEN` (índice único de empresa e nome na migração) | Nada gravado: uma transação | Banco fora: `DATABASE_UNAVAILABLE`, nada gravado | `ROLE_CREATED` com empresa, papel e quem, sem as operações | 2, 3 |
| Mudar papel (`updateOrgRole`) | A última vale; a tela relê depois de salvar | Nada gravado | Igual | `ROLE_UPDATED` | 4 |
| Apagar papel (`deleteOrgRole`) | A segunda dá `ROLE_NOT_FOUND` | A conferência de uso e o apagar na mesma transação, com a linha da empresa travada | Igual | `ROLE_DELETED` | 5 |
| Trocar o papel de uma pessoa (`updateMemberRole`) | Como hoje (`memberships-race.test.ts`) | Como hoje | Igual | `MEMBER_ROLE_CHANGED`, como hoje | 6 |
| Semear as linhas fixas (migração) | Uma vez só: `on conflict do nothing` no índice único | A migração inteira numa transação (0046) | — | O resumo da migração | 7 |
| Uma leitura recusada pelo papel | — | Nada vai ao fornecedor | — | `CONNECTOR_READ_REFUSED` com operação e papel, sem a entrada (S40) | 8, 9 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A empresa cria, muda e apaga um papel | U1 | nenhum: `Role` fechado (`packages/hub-api/src/roles.ts:4`); `dynamicAccessControl` desligado (`apps/server/src/hub/identity/auth.ts:254-255`) | `better-auth@1.7.8` `plugins/organization/routes/crud-access-control.mjs:30-140`, `:199-214`, `:453-600`; `organization.mjs:665-700` | Linha por empresa com o nome e o JSON das ações; quem cria precisa ter cada ação que dá (lido; provado) | embrulhado: as rotas do Hub chamam `auth.api.*`, porque o Hub não expõe `/api/auth/*` (0050) | não precisa | "6. Sim", 2026-11-03 | `apps/server/src/hub/identity/company-roles.ts` |
| Escolher o que o Membro e o Desenvolvedor usam | U1 | nenhum | `better-auth@1.7.8` `has-permission.mjs:7-32` (soma a linha guardada ao fixo de mesmo nome); `crud-access-control.mjs:52-57` (recusa criar com nome de fixo) | O fixo fica sem ação de conector; a linha semeada dá o conjunto; `update-role` muda | embrulhado: só a primeira linha de `member` e `developer` é nossa, na migração e na criação da empresa | estudo, a prova dos papéis: `listar` falso antes, `ROLE_NAME_IS_ALREADY_TAKEN` ao criar, verdadeiro com a linha, `update-role` ok | "6. ... selecionar para o Membro", 2026-11-03; decisão B | `apps/server/migrations/<data>_company_roles/` |
| O que se marca: conector, assunto, operação | U1 | `packages/connectors/src/kernel/definition.ts:28-49`, `kernel/operation.ts:3-4` | `better-auth@1.7.8` `plugins/access/access.mjs:45-76` | Um recurso por conector, as operações do kit como ações, montados ao ligar o servidor | nativo | não precisa | "7. Sim" | `apps/server/src/hub/identity/roles.ts` |
| Conferir se a pessoa pode uma operação | U2 | nenhum: as portas não leem papel (`hub/connectors/builder-port.ts`, `assistant-port.ts`); `allows()` lê só os fixos (`hub/identity/admission.ts:130-134`) | `better-auth@1.7.8` `has-permission.mjs:7-32` | Lê as linhas da empresa a cada chamada | embrulhado: `mayUse` chama o nativo dentro da transação do Hub, uma leitura só (C26) | não precisa | "2. ... configurável" | `apps/server/src/hub/identity/may-use.ts` |
| O modelo só vê o que a pessoa pode | U2 | `builder-port.ts:135-158`; `builder/assistant/assistant.ts:240-270` | `@mastra/core@1.82.0` `tools` por chamada; ferramenta ausente dá "Tool not found" | Fora do papel, fora da lista | nativo | não precisa | não precisa | — |
| Ferramenta da biblioteca ou em código | U2 | `builder/agents/tools.ts:33-75`, `builder/agents/code-tools.ts`, `hub/connectors/grants.ts ungranted()` | Copilot Studio credencial do criador; Agentforce usuário do agente (documentado, 2026-11-06) | O agente age com o que o dono declarou | embrulhado: publicar confere o papel de quem publica | não precisa | "8. Sim"; decisão C | — |
| Papel próprio numa pessoa e num convite | U1 | `admission.ts:146 rankAllows`; `mayInviteAs` | `better-auth@1.7.8` `routes/crud-members.mjs:311-330`, `crud-invites.mjs:108` | Aceita um nome que exista na empresa | nativo | não precisa | não precisa | — |
| A tela dos papéis | U3 | `apps/web/src/hub/identity/people.tsx`, `role-badge.tsx` | Claude Enterprise, papéis com conectores e ações (documentado, 2026-11-05); Activepieces, ações por projeto | Lista de papéis; dentro, conectores com ações marcadas | nativo nos componentes da casa (0033) | não precisa | "7. Sim" | `apps/web/src/hub/identity/roles.tsx` |
| Se o agente pergunta antes (24.5) | fica de fora: 24.5 | `initialState: { yolo: true }` em `builder/agents/controller.ts:269`, `assistant.ts:305` | `@mastra/core@1.82.0` `createTool({ requireApproval: fn })`, `agent-BP9OWM6D.js:15124-15143`; `docs-agents-human-in-the-loop.md:155-157` | A regra da ferramenta é a palavra final | nativo, com `yolo: false` nos agentes e no Assistente | estudo, a medida do controlador, P2 e P3: 0 de 200 perdidas | decisão D | — |
| Aprovar sozinho pela política da sessão | fica de fora: não se usa | nenhum (0053) | `agent-controller-BDds1y5w.js:904`, `:6382-6386`, `:8643` | Suspende e se aprova; perde a corrida | nativo, e rejeitado: é ele que perde chamadas | estudo, P1: 12 de 200; P5: 20 de 200 | não precisa | — |
| Quem aprova num canal sem ninguém da empresa | fica de fora: 24.6 e 24.7 | nenhum | Mastra `toolApprovers: 'requester'` (`reference-agents-channels.md:115`); ServiceNow "stalls"; n8n `inline-agent-config.schema.ts:14` (`2e855356`) | Ninguém documenta fila de funcionários | nativo (o canal do Mastra), decidido na 24.7; até lá, sem escrita que pergunta | não precisa | decisão D | — |
| O Builder e o Construtor | fica de fora: sem mudança | `builder/conversation/permissions.ts:60`, `construtor.ts:275` | Mastra Code `sdk/src/index.ts:1129` (`mastra-1.82`, `6e8dfcb8`) | Ferramentas de desenvolvimento sem pergunta | nativo | não precisa | 0053 | — |
| Os pedidos da 24.3.4 | fica de fora: sem mudança | `hub/requests/tables.ts:59`, `roles.ts:24-30` | herdado | Um papel próprio recebe `request: decide` como qualquer ação | nativo | não precisa | não precisa | — |

**A medida do transplante.** Nada vem do produto antigo: ele não tinha papéis próprios.

**A dívida.** Nenhuma nova. O relato do defeito do Mastra fica fora do repositório, pronto para o
firstmate mandar quando autorizar.

## U1 Os papéis no servidor

**Base e modelo.** `main` do dia. Sonnet: o desenho está decidido aqui, e cada passo segue uma API
nativa.

### As linhas da tabela

"A empresa cria, muda e apaga um papel", "Escolher o que o Membro e o Desenvolvedor usam", "O que se
marca", "Papel próprio numa pessoa e num convite". Leia na base `apps/server/src/hub/identity/roles.ts`
(inteiro), `auth.ts:250-370`, `admission.ts:48-150`, `packages/hub-api/src/roles.ts`, e no Better
Auth 1.7.8 `plugins/organization/routes/crud-access-control.mjs` e `has-permission.mjs`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/` | Muda `roles.ts`, `auth.ts`, `admission.ts`, `memberships.ts`, `invitation-create.ts`; cria `company-roles.ts` | `hub/requests`, `builder/tools/access.ts`, `builder/assistant` |
| `packages/hub-api/src/roles.ts`, `identity.ts`, `failures.ts` | Muda `Role`, cria `RoleView` e as rotas | `apps/web/src/hub/identity/` |
| `apps/server/migrations/` e `database-grants.sql` | Cria a tabela, o índice único, a política de linha e a semente | `scripts/check-migrations.ts` |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/roles.ts
export const FIXED_ROLES = ['owner', 'admin', 'developer', 'member'] as const
export const Role = z.string().trim().min(1).max(40).brand<'Role'>() // conferido contra a empresa no servidor
export type RoleKind = 'ALL' | 'EDITABLE' | 'CUSTOM' // owner/admin, developer/member, os da empresa
export const RoleView = z.object({
  role: Role, label: z.string(), kind: z.enum(['ALL', 'EDITABLE', 'CUSTOM']),
  connectors: z.record(z.string(), z.array(z.string())), members: z.number().int(),
})
// Rotas (acesso: admissão `manageRoles`, que Dono e Administrador têm):
// GET    /api/companies/{companyId}/roles                 -> RoleView[]
// POST   /api/companies/{companyId}/roles                 { label, connectors } -> RoleView | ROLE_NAME_TAKEN | REQUEST_MALFORMED
// PUT    /api/companies/{companyId}/roles/{role}          { connectors } -> RoleView | ROLE_FIXED | ROLE_NOT_FOUND
// DELETE /api/companies/{companyId}/roles/{role}          -> 204 | ROLE_IN_USE | ROLE_FIXED | ROLE_NOT_FOUND
```

- O recurso de cada conector é `connector_<id>`, e as ações são os ids das operações do kit. O dono
  da lista é o kit (`CONNECTORS`); `roles.ts` só a monta (C26).
- O nome guardado é a partir do rótulo, minúsculo e sem acento; o rótulo fica num campo extra da
  linha (`additionalFields` do `organizationRole`).
- `ROLE_FIXED` para Dono e Administrador; Desenvolvedor e Membro são `EDITABLE`.
- A entrada externa é o corpo da rota, com o esquema Zod acima; os ids são conferidos contra o kit
  antes de chamar o Better Auth, porque ele só confere o recurso.

### As skills e a leitura

`organization-best-practices` e `better-auth-best-practices` (linha `better-auth` de
`docs/reference/stack.md`). A versão instalada vale sobre a skill: a 1.7.8 liga só com
`dynamicAccessControl: { enabled }`, e o pacote `@better-auth/organization` da skill não está
instalado.

### A ordem do trabalho

1. Apagar de `COMPANY_ROLES.developer` e `.member` toda ação de conector (hoje nenhuma), e dar a
   `owner` e `admin` todas as do kit. Regras: C26, S6.
2. Ligar `dynamicAccessControl: { enabled: true }` e somar os recursos do kit a `ACCESS_CONTROL`.
3. A migração: a tabela do `organizationRole` no esquema `auth`, o índice único de empresa e nome, a
   política de linha da empresa (0039), as permissões em `database-grants.sql`, e a semente de
   `member` e `developer` com toda leitura do kit em cada empresa. A criação de empresa semeia
   também.
4. `company-roles.ts`: as quatro rotas sobre `auth.api.createOrgRole`, `updateOrgRole`,
   `deleteOrgRole`, `listOrgRoles`, dentro de `libraryCommand`; a contagem de uso antes de apagar.
5. Abrir `Role` em hub-api, admissão, `rankAllows` e `mayInviteAs`; um papel próprio fica abaixo do
   Administrador.

### Como se prova

Os critérios 1 a 7, pelas rotas do Hub (T5), com o banco de teste. O teste do critério 7 roda a
migração duas vezes.

### Parar se

- O Better Auth 1.7.8 não somar a linha semeada sob o adaptador Drizzle como somou no de memória: o
  estudo provou só no de memória. Pare e reporte; a alternativa é a `B` voltar ao fundador.
- Apagar papel em uso já for recusado pelo Better Auth com outra falha: use a dele.

## U2 O papel vale em toda porta

**Base e modelo.** `main` do dia, com a U1. Sonnet.

### As linhas da tabela

"Conferir se a pessoa pode uma operação", "O modelo só vê o que a pessoa pode", "Ferramenta da
biblioteca ou em código". Leia `hub/connectors/builder-port.ts:60-160`, `assistant-port.ts`,
`grants.ts:20-60` e `:200-240`, `builder/assistant/assistant.ts:240-270`,
`builder/agents/tools.ts`, `code-tools.ts`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/may-use.ts` | Cria | as portas abaixo |
| `apps/server/src/hub/connectors/` | Muda `builder-port.ts`, `assistant-port.ts`, `grants.ts`, `tool-door.ts` | `builder/` |
| `apps/server/src/builder/{assistant,agents,tools,connectors}/` | Muda a montagem das ferramentas e a conferência de publicar | as conversas |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/identity/may-use.ts
export type Speaker = { kind: 'PERSON'; personId: PersonId; role: Role } | { kind: 'VERSION'; versionId: AgentVersionId }
export function mayUse(tx: CompanyTx, speaker: Speaker, connectorId: ConnectorId, operationId: OperationId): Promise<boolean>
```

- `VERSION` é o agente publicado (decisão `C1`): ele pode o que a versão declara, conferido ao
  publicar.
- A falha ao modelo é `NOT_IN_ROLE`, com o nome do papel e sem a entrada (S40).

### A ordem do trabalho

1. `mayUse` sobre `auth.api.hasPermission`, sem cache próprio: o Better Auth lê a tabela a cada
   chamada, e a troca vale no turno seguinte (critério 11).
2. As portas: `described` e a leitura do Builder, `connections` e `read` do Assistente, a porta de
   leitura, as notas.
3. Publicar: `ungranted` passa a conferir também o papel de quem publica.

### Como se prova

Os critérios 8 a 12, pelas portas públicas e pelo dublê do Sankhya, contando os pedidos que ele
recebe.

### Parar se

- Uma porta não tiver a pessoa à mão na hora de rodar (uma automação): pare e reporte; a decisão D
  diz que uma automação usa a versão.

## U3 A tela

**Base e modelo.** `main` do dia, com a U1. Sonnet.

### As linhas da tabela

"A tela dos papéis". Leia `apps/web/src/hub/identity/people.tsx`, `member-actions.tsx`,
`invite-form.tsx`, `role-badge.tsx`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/identity/` | Cria `roles.tsx`; muda `people.tsx`, `member-actions.tsx`, `invite-form.tsx`, `role-badge.tsx`, `queries.ts` | as rotas de Configurações |
| `docs/reference/screens.md` | As caixas das duas telas | a QA |

### A ordem do trabalho

1. As caixas a 1280 e a 390 px em `screens.md`.
2. A lista e o papel aberto: conector, assuntos com caixa de marcar, o detalhe por operação com "lê",
   "escreve" ou "apaga". Regras: W da [web](../guides/web.md) para formulários e erros.
3. Pessoas: a troca e o convite com os papéis próprios; apagar com quem usa.

### Como se prova

Os critérios 13 e 14, e a QA da etapa nas duas larguras e nos dois temas.

### Parar se

- O texto de um assunto do kit não servir para uma pessoa ler: reporte; o kit é o dono do rótulo.
