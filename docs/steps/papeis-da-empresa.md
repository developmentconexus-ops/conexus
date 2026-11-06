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
   ou "apaga". Deixe só **Pedidos**. Salve. A linha diz "Sankhya: 1 operação de Vendas". O papel novo faz o resto como o Membro: conversa
   com o Assistente, cria Projeto e pede para publicar.
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
- **Sobre a sua pergunta, "um agente com computador consegue usar o DB Explorer do Sankhya se o
  papel não deixa?"** (lido no código do `main` de 2026-11-06 e provado num protótipo antes de
  construir). Depois desta etapa, não. Hoje, sim: qualquer membro chega à consulta livre pelo
  Assistente e pelo Builder, e é isso que esta etapa fecha. Toda leitura de qualquer conector passa
  por um funil só no Hub, e o papel é conferido ali, então não há uma segunda porta. A volta por fora
  já está fechada hoje:
  - o computador do agente não sai para a internet, só para os repositórios de pacotes;
  - nenhuma senha de conector chega ao computador nem ao agente;
  - a ferramenta em código roda atrás de um muro que recusa toda saída;
  - o `web_fetch` do agente recusa o Hub e os endereços internos, e não manda senha nenhuma.

  No protótipo, um papel sem a consulta livre não a viu na lista e foi recusado pela leitura comum
  e pela ferramenta em código. Tirar a consulta do Membro valeu já na chamada seguinte.

  A conferência no Hub no ar, em 2026-11-06, confirmou a rede fechada: do Computador, nem um site
  público nem o Hub responderam, e a máquina não guarda chave, token nem o endereço do Hub. Mas o
  agente de teste, configurado só com a leitura de pedidos e o Computador, ainda tinha entre as
  ferramentas o `connector_read` com a consulta livre: hoje só o modelo o manteve longe dela. Ela
  chegou pela chave **Ligações › Sankhya** da versão, que dá ao agente toda leitura da ligação e na
  tela só diz "Sankhya · Sankhya, Funcionando". Esta etapa fecha isso pela estrutura, com o `mayUse`
  dentro de `readThrough` e a decisão `E1`: ao ligar uma ligação no agente, aparecem as leituras
  dela, cada uma com a sua chave; as do kit vêm ligadas e a consulta livre vem desligada, com o texto
  "consulta livre: SQL no banco inteiro". O agente de teste, publicado de novo assim, não teria a
  consulta livre na lista, e um pedido dela seria recusado no funil.
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

**As decisões suas nesta etapa.** Decididas em 2026-11-06: `A1`, `B1`, `C1` e `D1`. Primeiro "A um,
B um, C um", e depois, com os exemplos, "confirma o seu 1 e D1". A página foi aprovada no mesmo dia
("Aprovo tudo"), e a `E1` entrou depois, por emenda, depois do teste ao vivo: "Ah, entendi. Tá, pode
ser um, então, aprovado." As opções ficam abaixo como foram apresentadas, com a recomendação
primeiro.

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
    (provado). Um papel novo começa como o Membro em tudo que não é conector (conversar com o
    Assistente, criar Projeto, pedir para publicar); nesta etapa a tela muda só os conectores.
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
- **E. O que a chave Ligações dá a um agente.** O agente nunca recebe mais que o papel de quem
  publica (`C1`); a E diz o que quem publica escolhe abaixo desse teto.
  - `E1` (recomendo, decidida): a versão guarda as operações escolhidas em cada ligação. Ligar uma
    ligação mostra as leituras dela, cada uma com a sua chave: as do kit vêm ligadas; a consulta
    livre (a Porta de leitura do conector) vem desligada, com o texto "consulta livre: SQL no banco
    inteiro". Quem publica liga se quiser: aberto se o dono quer aberto, como a autonomia por
    ferramenta da `D1`. Uma operação que o papel de quem publica não tem não liga (`NOT_IN_ROLE` ao
    publicar). As versões que já existem passam a ter todas as leituras do kit, sem a consulta
    livre. Exemplo: o agente de teste do Hub no ar, com Sankhya ligado, teria `pedidos` e as outras
    leituras, e não a consulta livre. Nativo: a mesma lista de operações do kit que a tela de papéis
    usa, e o `z.enum` do `connector_read` do Mastra só com as operações da versão.
  - `E2`: a chave dá só as leituras do kit, e a consulta livre é uma segunda chave embaixo de cada
    ligação. Mais curto, mas não deixa escolher uma leitura sozinha.
  - `E3`: a chave dá tudo o que o papel de quem publica tem, e a tela só avisa. Não fecha pela
    estrutura: o agente de um Membro continuaria com a consulta livre.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 Os papéis no servidor | `dynamicAccessControl` ligado; os recursos de conector montados do kit; a tabela `auth.organization_role` e as linhas semeadas do Membro e do Desenvolvedor; `Role` aberto a nome conferido; as rotas de listar, criar, mudar e apagar um papel; dar um papel próprio a uma pessoa e convidar com ele | `apps/server/src/hub/identity/`, `packages/hub-api/src/{roles,identity,failures}.ts`, `apps/server/migrations/` | [security](../guides/security.md) | esta página aprovada |
| U2 O papel vale em toda porta | Uma função `mayUse` sobre o `hasPermission` nativo; a lista do modelo só com o que a pessoa pode (Builder e Assistente); a recusa na hora de rodar (leitura, porta de leitura, ferramenta da biblioteca, ferramenta em código, caderno); a conferência de publicar (quem publica pode cada operação da versão); a versão do agente com as operações escolhidas por ligação (decisão `E1`) | `apps/server/src/hub/connectors/`, `apps/server/src/builder/{assistant,agents,tools,connectors}/`, `packages/hub-api/src/agents.ts` | [security](../guides/security.md) | U1 |
| U3 A tela | **Configurações › Papéis**: a lista, o papel novo, a edição por conector, assunto e operação; **Pessoas**: os papéis próprios na troca e no convite; **o agente › Ligações**: as operações de cada ligação, com a consulta livre desligada (decisão `E1`) | `apps/web/src/hub/identity/`, `apps/web/src/builder/agents/`, `docs/reference/screens.md` | [web](../guides/web.md) | U1; a tela do agente, também o contrato de `AgentConfig.connections` da U2 |

A U2 e a U3 correm em paralelo depois da U1: não dividem pasta.

**Orçamento de código alterado.** U1: ~1.200 (a configuração e os recursos sem ações de conector nos fixos
editáveis, a migração e a semente, o `Role` aberto em hub-api, admissão, `rankAllows` e
`mayInviteAs`, `manageRoles`, as quatro rotas, as falhas). U2:
~1.100 (a função; `allows` para papéis próprios; o `Speaker` obrigatório no pedido de leitura e o
`mayUse` dentro de `readThrough`; a lista do modelo filtrada no Builder e no Assistente; a versão
do agente congelando as suas leituras; a conferência nova de publicar agente e app; os textos de
recusa ao modelo; ~150 da `E1`: a forma por ligação, a leitura das versões antigas e o `z.enum`). U3:
~1.350 (duas telas, o diálogo de apagar, a troca de papel; ~150 da `E1`: as operações na seção
Ligações do agente). Total da etapa: ~3.800, dentro da regra L2.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `GET /api/companies/{c}/roles` traz os quatro fixos e os da empresa, cada um com `connectors: { [connectorId]: operationId[] }`; numa empresa nova, Membro e Desenvolvedor trazem toda operação `read` do kit, Dono e Administrador toda operação | `hub/identity/roles.test.ts` (novo), "a lista dos papéis" | must |
| 2 | U1 | Dono ou administrador cria "Atendente" com `{ sankhya: ['pedidos'] }` (ids do kit, `packages/connectors/src/sankhya/operations/vendas.ts:17`); ele conversa com o Assistente, cria Projeto e pede para publicar, como o Membro; a lista o traz; uma segunda criação igual responde `ROLE_NAME_TAKEN` e não grava | `hub/identity/roles.test.ts`, "criar um papel" | must |
| 3 | U1 | Recusa: Desenvolvedor e Membro recebem `NOT_FOUND` ao criar, mudar ou apagar papel (S10); um conector ou operação fora do kit dá `REQUEST_MALFORMED` antes de chamar o Better Auth; o nome de um fixo dá `ROLE_NAME_TAKEN`; mudar Dono ou Administrador dá `ROLE_FIXED`; nada muda | `hub/identity/roles.test.ts`, "o papel recusado" | must |
| 4 | U1, U2 | Mudar o Membro tira o assunto Financeiro: a lista o traz sem as operações dele, e a leitura seguinte de `contasAReceber` pelo Assistente de um Membro dá `NOT_IN_ROLE` ao modelo, sem pedido ao dublê (cruza as unidades) | `hub/identity/roles.test.ts`, "mudar o Membro" (novo), pela rota de papéis e pela porta do Assistente | must |
| 5 | U1 | Apagar um papel que alguém usa (o Better Auth recusa com `ROLE_IS_ASSIGNED_TO_MEMBERS`) ou que um convite aberto usa (o Better Auth não confere: é nosso) dá `ROLE_IN_USE` e não apaga; sem ninguém, apaga, e a lista não o traz | `hub/identity/roles.test.ts`, "apagar um papel" | must |
| 6 | U1 | Trocar o papel de uma pessoa para "Atendente" e convidar como "Atendente" funcionam, e quem aceita o convite entra com ele; um nome que não existe na empresa dá `ROLE_NOT_FOUND`; `rankAllows` trata um papel próprio abaixo do Administrador | `hub/identity/memberships.test.ts`, "papel próprio"; `invitations.test.ts`, "convite com papel próprio" | must |
| 7 | U1 | A migração semeia, em cada empresa existente, as linhas de `member` e `developer` com toda leitura do kit; rodar de novo não duplica | `hub/identity/roles.test.ts`, "a semente" | must |
| 8 | U2 | No Assistente de um Atendente, no Projeto com a ligação do Sankhya, o modelo recebe só `pedidos` na descrição das ligações; pedir outra operação pelo id dá ao modelo `NOT_IN_ROLE` com o nome do papel, e o dublê do Sankhya não recebe nada | `hub/connectors/assistant-port.test.ts` (novo), "o papel na leitura" | must |
| 9 | U2 | Igual no Builder (`described` e a leitura) e na porta de leitura do Sankhya (`carregar`, `consultar`): sem a operação da porta no papel, ela não aparece e é recusada | `hub/connectors/builder-port.test.ts` (novo), "o papel na leitura" e "a porta de leitura pelo papel" | must |
| 10 | U2 | Uma ferramenta da biblioteca ou em código num agente publicado roda para quem conversa sem papel (decisão `C1`), e publicar uma versão cuja ferramenta usa uma operação que o papel de quem publica não tem dá `NOT_IN_ROLE` com a operação | `builder/agents/publish.test.ts` (novo, ou o teste de publicar do dia), "publicar pelo papel" | must |
| 11 | U2 | A troca de papel vale no turno seguinte, sem reiniciar a conversa: tirar a operação no meio da conversa faz a próxima chamada recusar | `hub/connectors/assistant-port.test.ts` (novo), "o papel muda" | must |
| 12 | U2 | O caderno: anotar continua exigindo `manageConnections`, e ler as notas segue o papel na operação | `hub/connectors/notes.test.ts`, "notas pelo papel" | should |
| 13 | U3 | Em Configurações › Papéis, o dono cria "Atendente", marca Vendas e deixa só Pedidos, salva, e a linha diz "Sankhya: 1 operação de Vendas"; o Membro e o Desenvolvedor não veem o item Papéis | `apps/web/src/hub/identity/roles.test.tsx` (novo), "criar um papel" | must |
| 14 | U3 | Apagar um papel em uso mostra quem o usa e não apaga; em Pessoas, a troca e o convite listam os papéis próprios | `apps/web/src/hub/identity/roles.test.tsx`, "apagar"; `people.test.tsx`, "papel próprio" | must |
| 15 | U2 | O funil: `ReadRequest` de `hub/connectors/read.ts` exige o `speaker`, e `readThrough` chama `mayUse` antes do executor; um pedido sem `speaker` não compila (o `npm run typecheck` prova), e um `speaker` sem a operação dá `NOT_IN_ROLE` sem pedido ao dublê | `hub/connectors/read.test.ts` (novo), "o funil confere o papel" | must |
| 16 | U2 | A ferramenta da biblioteca presa à consulta livre: publicar a versão por quem não tem `consultar` dá `NOT_IN_ROLE`; publicada por quem tem, ela roda para quem conversa, e uma versão que não declara `consultar` é recusada no funil | `builder/agents/publish.test.ts` (novo), "a ferramenta presa à Porta" | must |
| 17 | U2 | A ferramenta em código: uma leitura que a versão não declarou continua `NOT_DECLARED` (`tool-door.ts:45-61`); declarar `consultar` e publicar sem ter a operação dá `NOT_IN_ROLE`; o Worker continua sem saída (o muro de `apps/edge/src/outbound.ts`, `outbound.test.ts`) | `hub/connectors/tool-door.test.ts`, "o papel na ferramenta em código"; `apps/edge/src/outbound.test.ts` | must |
| 18 | U2 | O `connector_read` de um agente publicado (`builder/agents/agent.ts:177`) só lê as leituras que a versão congelou ao publicar, conferidas contra o papel de quem publicou (decisão `C1`); pedir outra dá `NOT_IN_ROLE` | `builder/agents/agent-read.test.ts` (novo), "o agente lê o que a versão declara" | must |
| 19 | U2 | O app publicado: publicar uma versão cujo manifesto declara uma operação que o papel de quem publica não tem dá `NOT_IN_ROLE`; quem só usa o app continua usando (o "8. Sim"); `app-calls.ts` continua recusando o que o manifesto não declara | `hub/apps/live.test.ts` (novo), "publicar pelo papel"; `hub/connectors/app-calls.test.ts`, "a versão no funil" | must |
| 20 | U2 | O caderno: num papel sem `consultar`, gravar uma nota pelo Builder ou pelo Assistente dá `NOT_IN_ROLE`, e o dublê não recebe a consulta de prova | `hub/connectors/notes.test.ts`, "a prova do caderno pelo papel" | must |
| 21 | U2 | A automação roda como o dono dela (`builder/automations/run.ts:113`), com o papel dele: tirar a operação do papel do dono faz a próxima execução recusar | `builder/automations/run.test.ts`, "a automação pelo papel do dono" | should |
| 22 | U2 | Os muros de fora continuam: a máquina nasce sem variáveis de ambiente e com `denyOut: ['0.0.0.0/0']` (`builder/machine/machine-e2b.test.ts`, já existe); o `web_fetch` recusa `127.0.0.1`, `localhost`, `[::1]`, `10.0.0.0/8` e `169.254.169.254`, e um servidor local que imita o Hub recebe zero pedidos | `builder/machine/machine-e2b.test.ts`; `builder/conversation/web-fetch.test.ts` (novo), "o web_fetch não alcança o Hub" | must |
| 23 | U2 | A chave Ligações (decisão `E1`): uma versão com a ligação do Sankhya ligada e a consulta livre desligada não tem `consultar` no `z.enum` do `connector_read`, e um pedido de `sankhya.consultar` pelo funil dá `NOT_IN_ROLE` sem pedido ao dublê; ligar `consultar` e publicar por quem não o tem no papel dá `NOT_IN_ROLE` e não publica; uma versão gravada antes (a lista de ligações) lê como todas as leituras do kit, sem a Porta de leitura | `builder/agents/agent-read.test.ts` (novo), "a chave Ligações não dá a consulta livre"; `builder/agents/publish.test.ts`, "ligar a consulta livre pelo papel" | must |
| 24 | U3 | No agente, em Ligações, ligar Sankhya mostra as leituras dele: as do kit ligadas e "consulta livre: SQL no banco inteiro" desligada; uma operação fora do papel de quem edita aparece desligada e sem poder ligar | `apps/web/src/builder/agents/connections-section.test.tsx` (novo), "as operações da ligação" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Configurações › Papéis | Os quatro fixos, sem papel próprio, e o botão **Novo papel** | "Sua empresa ainda não criou papéis." abaixo dos fixos | A lista em esqueleto | "Não deu para carregar os papéis." com **Tentar de novo** | — | O item não aparece para Desenvolvedor e Membro | — |
| O papel aberto | Os conectores do kit, cada um com os assuntos | Um conector sem operação que o papel use mostra "Não usa" | Os conectores em esqueleto | O erro ao salvar fica na tela, com o que foi marcado | "Este papel não existe mais." ao abrir um apagado | Dono e Administrador abertos só para ler | `ROLE_NAME_TAKEN`, `ROLE_IN_USE` com quem usa |
| Pessoas, troca de papel | Os quatro fixos e os próprios | — | — | O erro na linha da pessoa | `ROLE_NOT_FOUND` se o papel foi apagado | Como hoje | — |
| O agente › Ligações, uma ligação ligada | As leituras do kit ligadas; "consulta livre: SQL no banco inteiro" desligada | Um conector sem Porta de leitura mostra só as leituras do kit | Como hoje | O erro ao salvar fica na tela, como hoje | A ligação deixou de ser oferecida ao Projeto: como hoje (`NOT_OFFERED`) | Uma operação fora do papel de quem edita aparece desligada, sem poder ligar | `NOT_IN_ROLE` ao publicar, com a operação |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Role` (nome do papel, fixo ou próprio) | U1, `packages/hub-api/src/roles.ts` | U1 (admissão), U3 (Pessoas, convite) |
| `RoleView.connectors` (conector → operações) | U1, rota de papéis | U3 (a tela), U1 (critério 1) |
| `RoleView.role` (o nome guardado) | U1 | U3 (Pessoas, convite, as rotas de mudar e apagar) |
| `RoleView.label` (o rótulo da pessoa) | U1 | U3 (a lista, Pessoas) |
| `RoleView.kind` (`ALL`, `EDITABLE`, `CUSTOM`) | U1 | U3 (o que se edita) |
| `RoleView.members` (quantas pessoas usam) | U1 | U3 (apagar) |
| `NOT_IN_ROLE` (falha ao modelo e à rota de publicar) | U2 | O modelo; U3 (a operação recusada ao publicar o agente) |
| `AgentConfig.connections` (ligação → operações, decisão `E1`) | U2, `packages/hub-api/src/agents.ts` | U2 (o `connector_read` do agente), U3 (o agente › Ligações) |

As caixas das telas, a 1280 e a 390 px, são desenhadas pela U3 em `docs/reference/screens.md` antes
do código, seguindo a tela de Pessoas de hoje e as regras de Impeccable; o produto antigo não tinha
papéis próprios.

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio | Uma dependência fora | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Criar papel (`auth.api.createOrgRole`) | A segunda dá `ROLE_NAME_TAKEN` (índice único de empresa e nome na migração) | Nada gravado: uma transação | Banco fora: `DATABASE_UNAVAILABLE`, nada gravado | `ROLE_CREATED` com empresa, papel e quem, sem as operações | 2, 3 |
| Mudar papel (`updateOrgRole`) | A última vale; a tela relê depois de salvar | Nada gravado | Igual | `ROLE_UPDATED` | 4 |
| Apagar papel (`deleteOrgRole`) | A segunda dá `ROLE_NOT_FOUND` | A conferência de uso e o apagar na mesma transação, com a linha da empresa travada | Igual | `ROLE_DELETED` | 5 |
| Apagar um papel enquanto alguém troca uma pessoa para ele ou convida com ele | A linha da empresa travada nas três gravações; quem chega depois vê `ROLE_NOT_FOUND` ou `ROLE_IN_USE` | Nada gravado pela recusada | Igual | `ROLE_DELETE_REFUSED` com o motivo | 5, 6 |
| Convidar com um papel próprio | Como hoje | Como hoje | Igual | Como hoje | 6 |
| Trocar o papel de uma pessoa (`updateMemberRole`) | Como hoje (`memberships-race.test.ts`) | Como hoje | Igual | `MEMBER_ROLE_CHANGED`, como hoje | 6 |
| Semear as linhas fixas (migração) | Uma vez só: `on conflict do nothing` no índice único | A migração inteira numa transação (0046) | — | O resumo da migração | 7 |
| Uma leitura recusada pelo papel | — | Nada vai ao fornecedor | — | `CONNECTOR_READ_REFUSED` com operação e papel, sem a entrada (S40) | 8, 9 |
| Gravar o rascunho do agente com as operações de uma ligação | Como hoje (a fila de gravação do rascunho, `use-draft-save-queue`) | Nada gravado | Igual | Como hoje | 23, 24 |
| Ler uma versão gravada antes da `E1` | — | — | — | Nada: a leitura a converte, sem gravar | 23 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A empresa cria, muda e apaga um papel | U1 | nenhum: `Role` fechado (`packages/hub-api/src/roles.ts:4`); `ORGANIZATION` sem `dynamicAccessControl` (`apps/server/src/hub/identity/auth.ts:254-255`) | `better-auth@1.7.8` `plugins/organization/routes/crud-access-control.mjs:30-140`, `:199-214`, `:453-600`; `organization.mjs:665-700` | Linha por empresa com o nome e o JSON das ações; quem cria precisa ter cada ação que dá (lido; provado) | embrulhado: as rotas do Hub chamam `auth.api.*`, porque o Hub não expõe as rotas do plugin (`apps/server/src/hub/identity/routes.ts:43`) | não precisa | "6. Sim", 2026-11-03 | `apps/server/src/hub/identity/company-roles.ts` |
| Escolher o que o Membro e o Desenvolvedor usam | U1 | nenhum | `better-auth@1.7.8` `has-permission.mjs:7-32` (soma a linha guardada ao fixo de mesmo nome); `crud-access-control.mjs:52-57` (recusa criar com nome de fixo) | O fixo fica sem ação de conector; a linha semeada dá o conjunto; `update-role` muda | embrulhado: só a primeira linha de `member` e `developer` é nossa, na migração e na criação da empresa | estudo, a prova dos papéis: `listar` falso antes, `ROLE_NAME_IS_ALREADY_TAKEN` ao criar, verdadeiro com a linha, `update-role` ok | "6. ... selecionar para o Membro", 2026-11-03; decisão B | `apps/server/migrations/<data>_company_roles/` |
| O que se marca: conector, assunto, operação | U1 | `packages/connectors/src/kernel/definition.ts:28-49`, `kernel/operation.ts:3-4` | `better-auth@1.7.8` `plugins/access/access.mjs:45-76` | Um recurso por conector, as operações do kit como ações, montados ao ligar o servidor | nativo | não precisa | "7. Sim" | `apps/server/src/hub/identity/roles.ts` |
| Conferir se a pessoa pode uma operação | U2 | nenhum: as portas não leem papel (`hub/connectors/builder-port.ts`, `assistant-port.ts`); `allows()` lê só os fixos (`hub/identity/admission.ts:130-134`) | `better-auth@1.7.8` `has-permission.mjs:7-32` | Lê as linhas da empresa a cada chamada | embrulhado: `mayUse` chama a função `hasPermission` do plugin (sem sessão, com o adaptador de `organizationAdapter`, `auth.ts:291-294`), fora da transação do Hub; uma leitura só (C26) | não precisa | "2. ... configurável" | `apps/server/src/hub/identity/may-use.ts` |
| O modelo só vê o que a pessoa pode | U2 | `builder-port.ts:135-158`; `builder/assistant/assistant.ts:240-270` | `@mastra/core@1.82.0` `tools` por chamada; ferramenta ausente dá "Tool not found" | Fora do papel, fora da lista | nativo | não precisa | não precisa | — |
| Ferramenta da biblioteca ou em código | U2 | `builder/agents/tools.ts:33-75`, `builder/agents/code-tools.ts`; `hub/connectors/grants.ts:215 ungranted()` só nos apps e nos pedidos | Copilot Studio credencial do criador; Agentforce usuário do agente (documentado, 2026-11-06) | O agente age com o que o dono declarou | embrulhado: uma conferência nova ao publicar um agente, pelo papel de quem publica | não precisa | "8. Sim"; decisão C | — |
| O que a chave Ligações dá a um agente | U2, U3 | `AgentConfig.connections` é lista de ligações (`packages/hub-api/src/agents.ts:37-41`); `new Set(frozen.connections)` (`builder/agents/agent.ts:234`) vira o acesso (`:175`) e o `connectorTools` (`:185`); o `z.enum` do `connector_read` traz toda leitura, a Porta incluída (`builder/connectors/connector-tools.ts:177-193`, `:275-277`); a tela só diz o nome e "Funcionando" (`apps/web/src/builder/agents/connections-section.tsx`) | Copilot Studio e ServiceNow: ação por ação, desligada por padrão (documentado, 2026-11-06); `@mastra/core@1.82.0` `createTool` com `inputSchema` (a lista que o modelo vê); a Porta marcada no kit (`packages/connectors/src/kernel/definition.ts:42` `readDoor`) | Cada ferramenta ou ação se escolhe; o que não foi escolhido não existe para o modelo | embrulhado: a versão guarda ligação → operações (a forma do `RoleConnectors`), o `z.enum` recebe só essas; a versão antiga se lê como as leituras do kit sem a `readDoor`, como o `machine` lê `false` (`agents.ts:44`) | não precisa | "Ah, entendi. Tá, pode ser um, então, aprovado.", 2026-11-06; decisão E | — |
| Papel próprio numa pessoa e num convite | U1 | `admission.ts:146 rankAllows`; `mayInviteAs` | `better-auth@1.7.8` `routes/crud-members.mjs:311-330`, `crud-invites.mjs:101-122` | Aceita um nome que exista na empresa | nativo | não precisa | não precisa | — |
| A tela dos papéis | U3 | `apps/web/src/hub/identity/people.tsx`, `role-badge.tsx` | Claude Enterprise, papéis com conectores e ações (documentado, 2026-11-05); Activepieces, ações por projeto | Lista de papéis; dentro, conectores com ações marcadas | nativo nos componentes da casa (0033) | não precisa | "7. Sim" | `apps/web/src/hub/identity/roles.tsx` |
| Se o agente pergunta antes (24.5) | fica de fora: 24.5 | `initialState: { yolo: true }` em `builder/agents/controller.ts:269`, `assistant.ts:305` | `@mastra/core@1.82.0` `createTool({ requireApproval: fn })`, `agent-BP9OWM6D.js:15124-15143`; `docs-agents-human-in-the-loop.md:155-157` | A regra da ferramenta é a palavra final | nativo, com `yolo: false` nos agentes e no Assistente | estudo, a medida do controlador, P2 e P3: 0 de 200 perdidas | decisão D | — |
| Aprovar sozinho pela política da sessão | fica de fora: não se usa | nenhum (0053) | `agent-controller-BDds1y5w.js:904`, `:6382-6386`, `:8643` | Suspende e se aprova; perde a corrida | nativo, e rejeitado: é ele que perde chamadas | estudo, P1: 12 de 200; P5: 20 de 200 | não precisa | — |
| Quem aprova num canal sem ninguém da empresa | fica de fora: 24.6 e 24.7 | nenhum | Mastra `toolApprovers: 'requester'` (`reference-agents-channels.md:115`); ServiceNow "stalls"; n8n `inline-agent-config.schema.ts:14` (`2e855356`) | Ninguém documenta fila de funcionários | nativo (o canal do Mastra), decidido na 24.7; até lá, sem escrita que pergunta | não precisa | decisão D | — |
| O Builder e o Construtor | fica de fora: sem mudança | `builder/conversation/permissions.ts:60`, `construtor.ts:275` | Mastra Code `sdk/src/index.ts:1129` (`mastra-1.82`, `6e8dfcb8`) | Ferramentas de desenvolvimento sem pergunta | nativo | não precisa | 0053 | — |
| Os pedidos da 24.3.4 | fica de fora: sem mudança | `hub/requests/tables.ts:59` (o `check` de `kind`), `hub/identity/roles.ts:24-30` (`request: decide`) | herdado | Um papel próprio recebe `request: decide` como qualquer ação | nativo | não precisa | não precisa | — |

**A medida do transplante.** Nada vem do produto antigo: ele não tinha papéis próprios.

**A dívida.** O limite de papéis por empresa fica no padrão do Better Auth, sem limite
(`crud-access-control.mjs:10`), e cada conferência lê e interpreta todas as linhas da empresa
(`has-permission.mjs:10-27`). Nenhum número foi medido; a 21.1 mede quando houver empresas com
muitos papéis. O relato do defeito do Mastra fica fora do repositório, pronto para o
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
export const RoleKind = z.enum(['ALL', 'EDITABLE', 'CUSTOM']) // owner/admin, developer/member, os da empresa
export type RoleKind = z.infer<typeof RoleKind>
// ConnectorId e OperationId: as marcas que @conexus/connectors já exporta, conferidas contra o kit (C23)
export const RoleConnectors = z.record(ConnectorId, z.array(OperationId))
export const RoleView = z.object({
  role: Role, label: z.string(), kind: RoleKind, connectors: RoleConnectors, members: z.number().int(),
})
export const RoleCreate = z.object({ label: z.string().trim().min(1).max(40), connectors: RoleConnectors })
export const RoleChange = z.object({ connectors: RoleConnectors })
// Rotas (acesso: admissão `manageRoles`, que Dono e Administrador têm):
// GET    /api/companies/{companyId}/roles                 -> RoleView[]
// POST   /api/companies/{companyId}/roles                 RoleCreate -> RoleView | ROLE_NAME_TAKEN | REQUEST_MALFORMED
// PUT    /api/companies/{companyId}/roles/{role}          RoleChange -> RoleView | ROLE_FIXED | ROLE_NOT_FOUND
// DELETE /api/companies/{companyId}/roles/{role}          -> 204 | ROLE_IN_USE | ROLE_FIXED | ROLE_NOT_FOUND
```

- O recurso de cada conector é `connector_<id>`, e as ações são os ids das operações do kit. O dono
  da lista é o kit (`CONNECTORS`); `roles.ts` só a monta (C26).
- O nome guardado é a partir do rótulo, minúsculo e sem acento; o rótulo fica num campo extra da
  linha (`additionalFields` do `organizationRole`).
- `ROLE_FIXED` para Dono e Administrador; Desenvolvedor e Membro são `EDITABLE`.
- Um papel próprio guarda, na sua linha, a base do Membro de `roles.ts` (`memberAc`, `project:
  create`, `assistant: ask`, `request: create`) mais os conectores; o Hub escreve a base, a tela não
  a mostra (decisão `B1`). Quem cria precisa ter cada ação, e Dono e Administrador têm.
- As falhas do Better Auth (`ROLE_NAME_IS_ALREADY_TAKEN`, `ROLE_NOT_FOUND`,
  `ROLE_IS_ASSIGNED_TO_MEMBERS`, `CANNOT_DELETE_A_PRE_DEFINED_ROLE`, `FORBIDDEN`) viram as do Hub
  num lugar só, `company-roles.ts` (C50).
- O arquivo tomado como modelo é `hub/requests/requests.ts` com `packages/hub-api/src/requests.ts`:
  estados em união (C21), ids com marca (C23), dono único das falhas (C26).
- A entrada externa é o corpo da rota, com o esquema Zod acima; os ids são conferidos contra o kit
  antes de chamar o Better Auth, porque ele só confere o recurso.

### As skills e a leitura

`organization-best-practices` e `better-auth-best-practices` (linha `better-auth` de
`docs/reference/stack.md`). A versão instalada vale sobre a skill: a 1.7.8 liga só com
`dynamicAccessControl: { enabled }`, e o pacote `@better-auth/organization` da skill não está
instalado.

### A ordem do trabalho

0. Primeiro, um teste que prova a soma da linha semeada sob o adaptador Drizzle do Hub (o estudo
   provou no de memória). Se falhar, pare (veja Parar se).
1. Apagar de `COMPANY_ROLES.developer` e `.member` toda ação de conector (hoje nenhuma), e dar a
   `owner` e `admin` todas as do kit. Regras: C26, S6.
2. Ligar `dynamicAccessControl: { enabled: true }` e somar os recursos do kit a `ACCESS_CONTROL`.
3. A migração: a tabela do `organizationRole` no esquema `auth`, o índice único de empresa e nome, a
   política de linha da empresa (0039), as permissões em `database-grants.sql`, e a semente de
   `member` e `developer` com toda leitura do kit em cada empresa. A criação de empresa semeia
   também.
4. A ação `manageRoles` na tabela `ACTIONS` de `admission.ts`, sobre o `ac` nativo
   (`ac: create, update, delete`), que Dono e Administrador têm.
5. `company-roles.ts`: as quatro rotas sobre `auth.api.createOrgRole`, `updateOrgRole`,
   `deleteOrgRole`, `listOrgRoles`, dentro de `libraryCommand`; a contagem de uso antes de apagar.
6. Abrir `Role` em hub-api, admissão, `rankAllows` e `mayInviteAs`; um papel próprio fica abaixo do
   Administrador.

### Como se prova

Os critérios 1 a 7, pelas rotas do Hub (T5), com o banco de teste. O teste do critério 7 roda a
migração duas vezes. Os critérios 1, 4, 7 e 8 a 11 dependem do passo 0.

### Parar se

- O Better Auth 1.7.8 não somar a linha semeada sob o adaptador Drizzle como somou no de memória: o
  estudo provou só no de memória. Pare e reporte; a alternativa é a `B` voltar ao fundador.
- Apagar papel em uso já for recusado pelo Better Auth com outra falha: use a dele.

## U2 O papel vale em toda porta

**Base e modelo.** `main` do dia, com a U1. Sonnet.

### As linhas da tabela

"Conferir se a pessoa pode uma operação", "O modelo só vê o que a pessoa pode", "Ferramenta da
biblioteca ou em código", "O que a chave Ligações dá a um agente". Leia
`packages/hub-api/src/agents.ts:30-46`, `builder/agents/{agents,agent,publish}.ts`,
`builder/connectors/connector-tools.ts:170-280`, `hub/connectors/read.ts:100-160` (o funil, `readThrough`, e os seus
quatro chamadores: `assistant-port.ts:228`, `builder-port.ts:177`, `notes.ts:126`,
`app-calls.ts:87`), `hub/connectors/builder-port.ts:60-160`, `assistant-port.ts`,
`grants.ts:20-60` e `:200-240`, `builder/assistant/assistant.ts:240-270`,
`builder/agents/tools.ts`, `code-tools.ts`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/may-use.ts` | Cria | as portas abaixo |
| `apps/server/src/hub/connectors/` | Muda `read.ts` (o `speaker` em `ReadRequest` e o `mayUse` em `readThrough`), `builder-port.ts`, `assistant-port.ts`, `notes.ts`, `app-calls.ts`, `tool-door.ts` (o `speaker` vem da chamada aberta, `LiveToolCall`) | `builder/`, `hub/apps/` |
| `apps/server/src/hub/apps/` | Muda a conferência de publicar um app (`live.ts:51`) | as rotas de publicar |
| `apps/server/src/hub/identity/admission.ts` | Muda `allows` para papéis próprios | todo módulo que admite |
| `apps/server/src/builder/{assistant,agents,tools,connectors}/` | Muda a montagem das ferramentas e a conferência de publicar; `agents.ts`, `agent.ts`, `publish.ts` e `connector-tools.ts` com as operações por ligação | as conversas |
| `packages/hub-api/src/agents.ts` | Muda `AgentConfig.connections` para ligação → operações | a U3 (o agente › Ligações), as rotas do agente |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/identity/may-use.ts
export type Speaker = { kind: 'PERSON'; personId: PersonId; role: Role } | { kind: 'VERSION'; versionId: AgentVersionId }
export function mayUse(tx: CompanyTx, speaker: Speaker, connectorId: ConnectorId, operationId: OperationId): Promise<boolean>
```

- `VERSION` é o agente ou o app publicado (decisão `C1`): ele pode o que a versão declara,
  conferido ao publicar contra o papel de quem publica. Para o `connector_read` de um agente, a
  versão declara, por ligação, as operações que quem publica escolheu (decisão `E1`), nunca mais que
  o papel dele; ligar uma ligação nunca dá a Porta de leitura sem que ela seja escolhida.

```ts
// packages/hub-api/src/agents.ts
connections: z.record(ConnectionId, z.array(OperationId).min(1)) // ligação → operações escolhidas
```

- Uma versão gravada antes, com `connections` como lista de ligações, se lê como todas as leituras
  do kit de cada ligação, sem as da `readDoor` (`packages/connectors/src/kernel/definition.ts:42`).
  A leitura converte; nada se regrava.
- `ReadRequest` (`hub/connectors/read.ts`) ganha `speaker: Speaker`, obrigatório: é o que faz um
  caminho novo que esqueça o papel não compilar.
- A função `hasPermission` do plugin devolve um booleano (`permission.mjs:2-11`), e não
  `{ success }`; o protótipo do estudo errou nisso primeiro.
- A falha ao modelo é `NOT_IN_ROLE`, com o nome do papel e sem a entrada (S40).

### A ordem do trabalho

1. `mayUse` sobre a função `hasPermission` exportada por `better-auth/plugins`
   (`plugins/index.mjs:42`, `has-permission.mjs:7-32`), e não a rota `auth.api.hasPermission`, que
   pede sessão: a ferramenta roda no turno do Mastra só com o `requestContext`, e o agente publicado
   não tem sessão. Ela recebe `{ options: ORGANIZATION, organizationId, role, permissions }` e o
   contexto do Better Auth (`auth.$context`), lê pelo adaptador dele, fora da transação do Hub, e sem
   cache próprio (`useMemoryCache` desligado): a troca vale no turno seguinte (critério 11).
2. `allows()` (`admission.ts:130-134`) passa a usar a mesma função para um papel próprio: hoje ele
   faz `COMPANY_ROLES[role].authorize`, que não existe para "atendente", e quebraria
   `assistant.ts:251,255` e `memberships.ts:123`.
3. O funil: `speaker` em `ReadRequest` e `mayUse` em `readThrough`, antes do executor. Cada um dos
   quatro chamadores passa o seu: a pessoa (Assistente, Builder, caderno, Construtor, automação como
   o dono) ou a versão (ferramenta da biblioteca, ferramenta em código pela chamada aberta,
   `connector_read` do agente, app).
4. As listas do modelo: `described` no Builder e `connections` no Assistente mostram só o que o
   papel deixa, para o modelo nem tentar.
5. Publicar um agente: conferência nova em `builder/agents/publish.ts`: cada operação escolhida em
   cada ligação (`AgentConfig.connections`, decisão `E1`) e cada leitura das ferramentas precisa
   estar no papel de quem publica, senão `NOT_IN_ROLE` com a operação. Ao rodar, `agent.ts:175`,
   `:185` e `:234` passam ao `connectorTools` as operações da versão, e o `z.enum` do
   `connector_read` (`connector-tools.ts:177-193`) só as traz. Um rascunho novo que liga uma ligação
   recebe as leituras do kit que o papel de quem edita tem, sem a `readDoor`. Publicar um app: `ungranted` (`grants.ts:215`, chamado em
   `hub/apps/live.ts:51`) passa a receber quem publica. Nos dois, quem publica pode cada operação que
   a versão declara.

### Como se prova

Os critérios 8 a 12 e 15 a 23, pelas portas públicas e pelo dublê do Sankhya, contando os pedidos que ele
recebe.

### Parar se

- A função `hasPermission` não puder ser chamada fora de uma rota do Better Auth na 1.7.8: pare e
  reporte, com o erro.
- Um chamador do funil não tiver nem a pessoa nem a versão à mão: pare e reporte. A automação roda
  como o dono (`builder/automations/run.ts:113`), e é ele quem fala.
- Aparecer um quinto chamador de `readThrough`, ou um caminho até `Executor.call` que não passe por
  ele (hoje só o Testar da ligação, `check.ts:43`, que exige `manageConnections`): pare e reporte.

## U3 A tela

**Base e modelo.** `main` do dia, com a U1. Sonnet.

### As linhas da tabela

"A tela dos papéis", "O que a chave Ligações dá a um agente". Leia
`apps/web/src/hub/identity/people.tsx`, `member-actions.tsx`, `invite-form.tsx`, `role-badge.tsx`,
`apps/web/src/builder/agents/connections-section.tsx`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/identity/` | Cria `roles.tsx`; muda `people.tsx`, `member-actions.tsx`, `invite-form.tsx`, `role-badge.tsx`, `queries.ts` | as rotas de Configurações |
| `apps/web/src/builder/agents/` | Muda `connections-section.tsx`: as operações de cada ligação ligada | o painel do rascunho (`draft-panel.tsx`) |
| `docs/reference/screens.md` | As caixas das duas telas e da seção Ligações do agente | a QA |

### A ordem do trabalho

1. As caixas a 1280 e a 390 px em `screens.md`.
2. A lista e o papel aberto: conector, assuntos com caixa de marcar, o detalhe por operação com "lê",
   "escreve" ou "apaga". Regras: W da [web](../guides/web.md) para formulários e erros.
3. Pessoas: a troca e o convite com os papéis próprios; apagar com quem usa.
4. O agente › Ligações (decisão `E1`): cada ligação ligada abre as suas leituras, cada uma com uma
   chave; a consulta livre vem desligada, com o texto "consulta livre: SQL no banco inteiro"; uma
   operação fora do papel de quem edita aparece desligada e sem poder ligar.

### Como se prova

Os critérios 13, 14 e 24, e a QA da etapa nas duas larguras e nos dois temas.

### Parar se

- O texto de um assunto do kit não servir para uma pessoa ler: reporte; o kit é o dono do rótulo.
