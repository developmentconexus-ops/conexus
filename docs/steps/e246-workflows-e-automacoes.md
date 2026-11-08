# Etapa 24.6: Workflows e automações

O roteiro chama esta etapa de "24.6 Workflows e automações. Monta conversando o fluxo do orçamento
do Sankhya e o vê como trem de balões", com "Workflows dinâmicos do Mastra. Seu orçamento é o
aceite", e na linha 71 "Sai: o pg-boss; a agenda do Mastra, gatilho de toda automação, e os
workflows o substituem". Ela vem depois da 24.5 e da 24.5.1 e se apoia nas duas: toda escrita, na
conversa ou num workflow, passa pela mesma decisão **Pergunta antes / Faz sozinho**, pelo mesmo
funil e pelo mesmo registro de envios. Esta é a terceira rodada do cartão (r2), feita contra o
cartão em `ef048874`: as respostas do fundador de 2026-11-08, o estudo de gatilhos e o estudo `T2`, o
preparo do fluxo completo (provas P14 e P15), o estudo da 24.5.1 e o estudo da causa da versão do
turno. Cada linha citada do Conexus foi relida em `668f9151` (o `main` em `a6185687`, com a 24.5
inteira: PRs 841, 843, 844, 845 e 846), com `@mastra/core` 1.82.0, `@mastra/pg` 1.35.0 e
`@mastra/server` 1.82.0. As linhas marcadas "24.5.1" são do cartão da 24.5.1 (ramo
`feat/conexus-e2451-card`, `fa6a7ef2`), que ainda não está no `main`. O construtor de cada unidade
reabre as linhas no `main` do dia.

## A página do fundador

**No fim desta etapa** você monta, conversando com o Construtor dentro de um Projeto, o fluxo do
orçamento: quando um orçamento novo entra no Sankhya, o Conexus confere o cliente com um workflow que
você já tem, um agente faz a triagem, acima de um valor pede a sua aprovação e lança o pedido, senão
avisa outra pessoa, e no fim avisa alguém. Você vê o fluxo ao lado da conversa como um canvas de
balões, igual ao do painel do Mastra e ao do n8n: clica num balão para ver quem ele é, como está
configurado, o que recebe, o que devolve e a definição dele como código, e arrasta um balão para
outro lugar do fluxo. Depois de publicar, vê cada execução com os balões acesos e aprova a que
espera você.

**O roteiro de uso.** Você é a Ana (dona). A ligação do Sankhya está liberada ao Projeto
"Compras", o agente "Triagem de orçamento" está publicado nele, e o workflow "Conferir cliente"
(gatilho manual: lê a ficha de um cliente e devolve um texto) também, montado antes com o
Construtor.

1. No Projeto "Compras", abra o Construtor e escreva "quando entrar um orçamento novo no Sankhya,
   olhando a cada 15 minutos, usa o Conferir cliente, o agente Triagem vê se o cliente está bom;
   acima de R$ 20 mil me pede para aprovar e lança o pedido, senão avisa a Carla; no fim avisa o
   Bruno". Ao lado da conversa aparece o canvas **Workflow: Orçamento novo**, marcado "rascunho",
   com os balões **Gatilho** (orçamento novo no Sankhya, a cada 15 minutos), **Conferir cliente**
   (outro workflow, versão 1), **Triagem de orçamento** (agente), **Valor acima de R$ 20.000?** com
   o caminho "se sim" (**Aprovar? (Ana)** e **Lançar o pedido**) e o caminho "senão" (**Avisar a
   Carla**), e **Avisar o Bruno**. Se faltar algo (quais tipos de operação são orçamento, quem
   avisar), o Construtor pergunta antes de montar.
2. Clique em **Triagem de orçamento**: abre ao lado o painel com **Quem é** (o agente e a versão
   publicada que o fluxo usa), **Configuração** (o pedido ao agente e quem aprova uma escrita
   dele), **O que recebe** (o texto, com o cliente que o Conferir cliente devolveu), **O que
   devolve** (o texto da triagem) e **Código** (a definição do balão, só para ler). Clique em
   **Lançar o pedido**: a configuração mostra a operação, os campos e **Pergunta antes**. Arraste
   **Avisar o Bruno** para antes do **Valor acima de R$ 20.000?**: o fluxo se reorganiza e
   continua "rascunho". Arraste de volta. Se um balão tem um problema (por exemplo, uma pessoa que
   saiu da empresa), ele aparece marcado, e **Publicar** espera você resolver.
3. Escreva "testa com o último orçamento". Os balões acendem um a um sobre o orçamento mais
   recente; o teste para antes de lançar o pedido e ninguém é avisado. Toque **Publicar**. O
   workflow aparece em Automações do Projeto, ligado.
4. Lance no Sankhya um orçamento de teste acima de R$ 20.000. Em até 15 minutos o sino e o seu
   e-mail mostram "O workflow Orçamento novo espera sua aprovação". Abra: os balões feitos em verde,
   a triagem com o texto do agente, e o cartão **Aprovar?** com o orçamento. Toque **Aprovar**:
   **Lançar o pedido** mostra o pedido que vai lançar e pede a sua aprovação (ele está em
   **Pergunta antes**); aprove, e o pedido aparece no Sankhya com a marca do Conexus na observação.
   **Avisar o Bruno** acende, e o Bruno recebe o aviso. Lance outro de R$ 5.000: o caminho "senão"
   acende, a Carla recebe o aviso, e o "se sim" aparece "pulado".
5. Peça ao Construtor "acima de R$ 50 mil em vez de 20" e, antes de publicar, lance um orçamento de
   R$ 30.000: ele ainda pede a sua aprovação, porque a versão publicada continua a de antes.
   Publique e lance outro de R$ 30.000: agora ele vai pelo "senão".
6. No Projeto, em Integrações, tire a liberação da ligação do Sankhya e lance um orçamento: a
   página do workflow mostra "A última olhada no Sankhya falhou" com o motivo, e você recebe um
   aviso, uma vez só. Libere de novo: na olhada seguinte o orçamento dispara, uma vez só, e você
   recebe "Voltou a olhar o Sankhya". Em Automações, pause o workflow; ao religar, só os orçamentos
   lançados depois de religar disparam.

**O que você faz, e quando.** Antes: nada (os tipos de operação de orçamento você diz ao
Construtor no passo 1, porque o que conta como orçamento novo é configuração de cada workflow). No
começo: aprova esta página. No fim: faz o roteiro no Sankhya de verdade da sua empresa, grava a
leitura nova só lendo (a gravação de verdade da U4), diz o que viu e aprova os textos das telas.

**O que o estudo mostrou** (2026-11-07 e 2026-11-08, com modelo de mentira e um banco local, sem
chamar nada de fora; as provas P1 a P15 do estudo, a prova do estudo de gatilhos e a do estudo `T2`).

- O Mastra guarda um fluxo montado na hora e o carrega de novo depois de um reinício, sozinho. É o
  "workflow dinâmico" do roteiro, que o Mastra ainda marca Beta.
- O Mastra aponta, sem rodar, o que não serve num desenho, balão por balão. Por isso um rascunho
  com problema é guardado, os problemas aparecem no canvas, e só testar e publicar esperam.
- O Mastra tem todas as formas de fluxo: caminhos, coisas ao mesmo tempo, repetir para cada item,
  repetir até, esperar, e um workflow dentro de outro (P14). Uma aprovação dentro de qualquer uma
  delas sobrevive a um reinício (P15). Elas têm quatro regras de montagem que o Conexus segue (por
  exemplo, o "Se" do Mastra roda todos os caminhos verdadeiros, então o "senão" é montado como o
  contrário do "se").
- Uma aprovação no meio do fluxo sobrevive a um reinício do Conexus, também dentro de um caminho.
- Recusar termina a execução. **Tentar de novo** continua do balão que falhou, sem refazer os
  anteriores. Uma execução cortada por um reinício termina depois, do balão em que estava.
- O Mastra não guarda versões de um workflow. Por isso cada publicação é uma versão própria, como
  nos agentes, e a execução fica na versão em que começou e com quem a ativou.
- Um agente que escreve pode ser um balão: o fluxo para e espera a aprovação, também depois de um
  reinício. A conversa, o balão de agente e o balão de escrita usam a mesma decisão e o mesmo
  registro de envios.
- A agenda do Mastra dispara a versão publicada direto. Uma Automação da 24.2 (um horário e uma
  pergunta ao Assistente) é um workflow de dois balões.
- O Sankhya não avisa sozinho. O gatilho é o Conexus olhar de tempos em tempos e lembrar o que já
  viu, como Zapier, Make, n8n, activepieces e Pipedream fazem. Quem diz o que pode ser gatilho é o
  conector; o workflow escolhe; o Conexus guarda até onde olhou e o que já entrou. O mesmo caminho
  recebe, na 20.2, o aviso de um fornecedor que avisa (o Mercado Livre). O Mastra roda duas vezes
  uma execução pedida duas vezes com a mesma id, então lembrar o que já entrou é do Conexus.

**O que mudou nesta emenda** (r2, contra o cartão em `ef048874`):

- **A leitura de outro modelo** (2026-11-08) achou três defeitos que bloqueavam a construção, e o
  cartão os corrige: o **Para cada** passa a ter a forma que as provas P14 e P15 rodaram; a primeira
  olhada de um gatilho que não acha nenhum item não engole mais o primeiro orçamento real; e a
  escrita de um agente dentro de um balão diz o motivo, a ligação, a operação e quem aprova.
- **Os gatilhos** (as suas decisões `T1a` a `T8a`, 2026-11-08). O gatilho deixa de ser um
  `poll.ts` só do Sankhya: o kit de conectores ganha a declaração de gatilho, e o Conexus, uma
  caixa de eventos com chave única e uma volta que olha por gatilho. A cadência é escolhida no
  gatilho (15 minutos por padrão, 5 no mínimo). Uma volta que falha avisa o dono uma vez, e outra
  quando volta a ler. "O que conta como novo" sai das suas decisões e vira configuração de cada
  workflow: o conector oferece os modos de olhar, e o primeiro é "novo pelo número que cresce". As
  antigas decisões B e C saem: foram substituídas por estas. A U4 cresce de ~550 para ~750
  linhas sem os testes (~1.050 com eles, `T8a`).
- **A base nasce completa** (a sua resposta, 2026-11-08, a opção G-a do preparo do fluxo completo).
  O documento do workflow passa a ser recursivo desde a U1: um balão pode ter caminhos, e cada
  caminho é uma lista de balões. A compilação segue as quatro regras das provas P14 e P15 para
  todas as formas que o Mastra tem. O canvas desta etapa entrega a lista, o **Se** com **senão** e
  o **Usar outro workflow**; **Ao mesmo tempo** e **Para cada** vêm na 24.6.2, e **Repetir**,
  **Esperar** e **Esperar até** na 24.6.3.
- **O painel do balão** (a sua explicação de "informações", 2026-11-08). A antiga decisão I sai:
  "informações" é o painel. Ele mostra **Quem é**, a **Configuração** de cada espécie de balão,
  **O que recebe**, **O que devolve** e o **Código** do balão, só para ler; renomeia, move e apaga.
- **A coesão com a 24.5.1** (a sua `1A`, 2026-11-08). A 24.6 começa depois da 24.5.1 no `main` e
  usa o que ela cria (a regra de escrita com um dono, o kit de conversa, o hash de tentativa, as
  frases e o título, os ajudantes de teste) sem copiar. A U2 encolhe para acrescentar o workflow
  como terceiro autor.
- **A versão presa à execução** (a sua aceitação para a 24.5, 2026-11-08). Uma execução fica na
  versão do workflow e com quem a ativou, do começo ao fim, também depois de esperar uma
  aprovação, de um reinício e de **Tentar de novo**. Um balão de agente fica na versão do agente
  que o workflow fixou ao publicar, e a escrita desse agente é respondida por quem ativou o
  workflow (decisão `A1`, abaixo).
- **O código relido.** Três leitores releram o código em `668f9151`; os números de linha errados
  foram corrigidos, e cinco desencontros foram resolvidos: o nome do arquivo do gatilho, o
  celular (o canvas abre na gaveta que o Conexus já tem, e não em abas), o sentido do import entre
  Automações e workflows, as listas de testes de navegador e de ponta a ponta, e as gravações (a
  execução de workflow é lida do Mastra de verdade nos testes do servidor, sem gravação nova).
- **O tamanho.** Cerca de 5.900 linhas, estimado pela leitura, uns 48% acima das 4.000 da regra L2.
  A divisão G-a que você aceitou tira desta etapa ~3.000 linhas (24.6.2 e 24.6.3).

**Fica de fora.**

- **24.6.1**: as Automações da 24.2 viram workflows (a sua `G1`). No início do Conexus, cada
  Automação vira um workflow com **Gatilho: horário** e um balão **Assistente** com a mesma
  pergunta e as mesmas ligações, publicado em nome do dono; a agenda nova nasce antes de a antiga
  sair; as execuções antigas continuam na mesma lista; o workflow fixo de hoje sai quando não
  sobrar Automação sobre ele. Também na 24.6.1: a lista de versões e "voltar a esta versão", que
  passa pelas conferências de publicar e grava quem ativou. Nesta etapa as Automações continuam
  como estão, na mesma lista, ao lado dos workflows.
- **24.6.2**: **Ao mesmo tempo** (caminhos lado a lado) e **Para cada** ("para cada item do
  orçamento", com "2 de 3" na execução). O documento e a compilação já os têm nesta etapa; o canvas,
  o Construtor e a execução por item vêm lá.
- **24.6.3**: **Repetir** ("até o status ser pago", no máximo N vezes), **Esperar** e **Esperar
  até**. O documento já tem **Repetir**; **Esperar** e **Esperar até** entram com o mecanismo que a
  24.6.3 escolher (o preparo do fluxo completo deixa duas opções, e nenhuma rodou junta).
- **20.2**: o aviso de um fornecedor que avisa (o Mercado Livre e os outros, a sua `T7a`): a rota de
  entrada, a campainha e a assinatura do conector. A caixa de eventos desta etapa é a que ela
  chama.
- **Mudar os campos de um balão pelo painel.** O painel mostra tudo, renomeia, move e apaga; o
  que o balão faz você muda conversando com o Construtor (a sua resposta, 2026-11-08).
- **Novos e alterados.** O primeiro modo de olhar é "novo pelo número que cresce"; "alterado" pede
  uma coluna do Sankhya que a documentação não dá e tem de ser medida na sua gravação.
- **Separar por tipo** e **escolher um caminho entre vários.** Nenhuma etapa os tem ainda; o
  documento os aceita depois sem mudar o que já existe.
- **Um balão em qualquer ponto da tela** (posição livre, `F2b`): o arranjo é sempre calculado.
- **Gravar uma linha num app**, e um balão que lê a tabela de um app: vêm com a escrita dos apps, a
  antiga 20.1.
- **O Membro aprovar ou publicar um workflow.** Hoje só Dono, Administrador e Desenvolvedor abrem
  Automações; por isso quem um **Aprovar?** nomeia é um deles. O pedido do Membro vem com os
  papéis da 24.7.
- **Os avisos guardados para o próximo cartão**: esta etapa leva dois, o do teste da agenda que
  espera o relógio de verdade (#754) e o do Sankhya de mentira que recusa a consulta (#819), porque
  os gatilhos usam os dois; nenhum outro toca workflows ou automações.

**Aprovar esta página é também a sua palavra** para três mecanismos do Conexus onde o Mastra não
tem um (a regra C75): uma id do Mastra por versão publicada; a caixa de eventos e a linha do
gatilho, que guardam até onde o Conexus olhou e o que já entrou; e um balão contador no fim de todo
**Repetir**, que para o laço no número de voltas que a pessoa disse. Também para o uso do workflow
dinâmico do Mastra, que ele ainda marca Beta; para a biblioteca nova do canvas, `@xyflow/react`
(com a sua `F2a`); para as permissões das tabelas novas e da função que lista as empresas com
workflow no início do Conexus, da mudança no registro de envios da 24.5, e da chave e das colunas
novas dos avisos (a regra D11); para a lista de cadências do gatilho (5, 15, 30 ou 60 minutos, a
recomendação `T4a` do estudo de gatilhos, com o seu padrão de 15 e o seu mínimo de 5); e para três
limites: um workflow ligado com horário ou com gatilho de conector conta nas 30 automações da
empresa (o limite da 24.2, que conta as agendas ativas), e um workflow só manual não conta; uma olhada
começa no máximo 20 execuções e deixa o resto para a seguinte, e um teste nunca avisa ninguém e
para antes de qualquer escrita.

**As decisões tomadas** (as suas palavras, sem edição).

- **A. Quem é o dono do workflow, e quem aprova.** 2026-11-08: "A1". Quem publica é o dono. O
  workflow lê e escreve com o papel de quem ativou a versão, e cada execução confere de novo, no
  começo, se essa pessoa ainda está na empresa, ainda cuida de automações e ainda tem cada leitura
  do fluxo; se não, o workflow pausa, como a Automação da 24.2. Cada **Aprovar?** nomeia uma
  pessoa, por padrão quem ativou a versão (quem publicou, até a 24.6.1 trazer "voltar a esta
  versão"). Uma escrita em **Faz sozinho** cujo dono perdeu o direito volta a perguntar, ao dono.
  - **O balão de agente, decidido aqui pela `A1`.** A escrita de um agente dentro de um balão é uma
    escrita do workflow, então quem responde por ela (a regra `D2-a`) é quem ativou a versão do
    workflow que a execução roda, e não quem ativou a versão do agente. Por quê: a `A1` diz "o
    workflow lê e escreve com o papel dele"; quem publicou o workflow viu o agente fixado na versão
    ao publicar; e é o desenho que as referências convergem, a autoridade resolvida a partir da
    execução que começou (o n8n: "Deliberately not the workflow row's `activeVersionId`", lido no
    estudo da causa da versão do turno). A escolha **Pergunta antes / Faz sozinho** de cada escrita
    continua a da versão do agente. Se quem ativou o workflow não pode deixar uma escrita sozinha,
    ela pergunta.
- **D. Um "Aprovar?" que ninguém responde.** 2026-11-08: "D1". Espera sem prazo, aparece em
  Automações como "Esperando aprovação", com o sino e o e-mail na hora em que começa a esperar.
- **E. Um balão que escreve no Sankhya.** 2026-11-08: "E1". Entra, e um agente com escrita também
  pode ser balão, com a mesma chave **Pergunta antes / Faz sozinho** da 24.5.
- **F. Como o fluxo aparece.** 2026-11-08: "F2a". Um canvas como o do painel do Mastra e o do n8n,
  com o arranjo calculado pelo Conexus. A construção da U6 começa provando a biblioteca sob a
  proteção de página do Conexus (a regra W22); se falhar, volta a você com `F1`.
- **G. As Automações da 24.2 e o fluxo completo.** 2026-11-08: "G1" e "Base nasce completa". As
  Automações viram workflows na 24.6.1. O fluxo completo do Mastra se divide como a opção G-a: o
  documento e a compilação de todas as formas nesta etapa; o canvas com a lista, o **Se** com
  **senão** e o **Usar outro workflow**; depois a 24.6.2 e a 24.6.3.
- **H. Onde o workflow mora.** 2026-11-08: "H1". Nos mesmos lugares da Automação: a empresa (o
  Início) e o Projeto. O Construtor monta dentro de um Projeto.
- **O painel do balão** (a antiga I). 2026-11-08: "Não, eu acho que o que eu falei é tipo assim, a
  gente tá criando os balões, né? Só que cada balão, ele tem uma informação. Então eu falo, tipo,
  na hora da gente clicar no balão e aparecer o que ele é, as informações dele, entendeu? Tipo, se
  for um evento, eu não sei, aparece o código, por exemplo, as peças, configuração do balão,
  entendeu o ponto?" e, sobre editar no painel ou só ver: "Aceito suas recomendações".
- **Os gatilhos.** 2026-11-08: "T1a"; "`T2` c"; "T3A É, mas isso pra mim não tem que ficar definido
  agora, né? Isso daqui, na verdade, vai ser o que o construtor de agentes, de workflow, enfim, vai
  construir, concorda? E aí eu falaria isso com ele."; "T4 Ah, isso tem que ser configurável. Pode
  ser eu começar com 15 minutos, mas isso daí tem que ser configurável. Podemos ter esse mínimo
  aí, então." e "E o mínimo da T4 pode colocar 5 minutos."; "T5a"; "T6A"; "T7A"; "T8A".
  - `T1a`: o conector declara o que pode ser gatilho e como olhar; o workflow escolhe; o Conexus
    roda.
  - `T2c`: olhar e ser avisado entram na mesma caixa; o aviso de fora (20.2) só toca a campainha, e
    a volta que olha é a única que admite um item.
  - `T3`: o que conta como novo é configuração do workflow, montada com o Construtor.
  - `T4`: a cadência é configurável por gatilho, 15 minutos por padrão, 5 no mínimo.
  - `T5a`: a primeira olhada marca o agora e não dispara os orçamentos antigos; o teste usa o mais
    recente.
  - `T6a`: uma volta que falha avisa o dono uma vez, e outra quando volta a ler; o cursor não anda.
  - `T7a`: o aviso de fora entra na 20.2.
  - `T8a`: a U4 constrói o gatilho genérico do kit e a caixa de eventos.
- **A coesão.** 2026-11-08: "A" (a decisão 1 da 24.5.1): a arrumação entra na etapa 24.5.1, antes
  desta.
- **A versão presa.** 2026-11-08, para a 24.5, aceita por você: "quem responde é quem ativou a
  versão que o turno roda, preso ao turno. Um turno parado num cartão retoma na versão em que
  começou." A execução de um workflow segue a mesma regra.

**As decisões em aberto nesta etapa.** Nenhuma. O único ponto novo, quem responde pela escrita de
um balão de agente, a `A1` decide (acima).

## Depende de

A 24.6 começa depois de duas coisas no `main`:

- **A 24.5.1** (o cartão no PR 847). Cada unidade usa o que ela cria e não faz cópia:
  - U1: `bodyHashOf` de `platform/attempt.ts` (a chave de tentativa de `createWorkflow`, C37);
    `speakerOf` de `hub/identity` e `mayLeaveAlone` de `hub/connectors/approval.ts` (o papel de quem
    publica e o `WRITE_AUTO_NOT_ALLOWED`, no `World` dos problemas).
  - U2: `hub/connectors/approval.ts` com `mustAsk`, `mayApprove`, `answererLeavesAlone`,
    `WriteAuthorOf` e `WriteTarget`, que a U2 só estende (`where: RUN` em `mustAsk`; o autor
    `WORKFLOW` entra no funil e em `Speaker`, e `WriteAuthorOf` fica como está).
  - U3: `mustAsk` e `mayApprove` (os balões que escrevem e a rota de responder), `speakerOf`
    (`conferir`, ler), `publisherOf` (o agente), `stepped` e `forward` (o modelo de mentira com o
    pedido de aprovação, o dublê do Sankhya).
  - U4: `speakerOf`, `forward`.
  - U5: `stepped` (o modelo de mentira do Construtor).
  - U6: `unconfirmedText` e o `titleOf` único da web. A 24.5.1 tirou `useCreate` e
    `<ConversationRoom>`, e a 24.6 não depende deles.
- **A correção da 24.5 que prende quem responde à versão** (a opção A do estudo da causa da versão
  do turno), **já no `main`**: o PR 848 (`087f27df`). Quem responde vem lido com a versão
  (`builder/agents/frozen.ts:133,146`), o autor `VERSION` leva `answeredBy`
  (`builder/agents/tools.ts:30`), e `publisherLeavesAlone` virou `answererLeavesAlone(deps,
  companyId, answeredBy, target)` (`builder/agents/publish.ts:240-252`). O que falta, e a U3 faz: o
  `AgentRun` não leva o número da versão (`builder/agents/agent.ts:62-66`) e o registro só monta a
  ativa (`registry.ts:120-135`). A U3 acrescenta o leitor de uma versão por número (`versionOf`) e
  a montagem de uma versão fixada no registro, como o ramo do rascunho já faz
  (`registry.ts:121-124`). Se um PR da 24.5 entrar antes com a retomada fixada (a parte B), a U3 a
  usa e não faz outra. O cartão da 24.5.1 foi escrito antes do PR 848 e ainda chama a função de
  `publisherLeavesAlone`; o nome que vale é o do `main`.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 O workflow como dado | O documento recursivo dos balões (folhas e caminhos), dos problemas e das falhas; as tabelas `workflow` (com `active_version` e `active_by`) e `workflow_version`, a migração e as permissões; a lista de problemas (as regras do Conexus e `validateDynamicWorkflow` do Mastra sobre o índice que o Hub monta); a compilação de uma versão em definições do Mastra com as quatro regras (cada caminho um workflow aninhado; um `mapping` antes de todo balão, salvo o **Para cada**, que vem logo depois da lista; predicados que se excluem; `outputSchema: {}` quando o fim é uma lista) para o **Se** com **senão**, **Ao mesmo tempo**, **Para cada**, **Repetir** e **Usar outro workflow**; o agente e o outro workflow fixados na versão ao publicar; as oito ferramentas registradas com as suas ids e esquemas (o corpo do contador já aqui; as outras falham até a U3); as operações de criar, ler, gravar o rascunho, publicar e apagar; a função que lista as empresas com workflow; apagar no início as definições sem versão | `packages/hub-api/src/`, `apps/server/src/builder/workflows/`, `apps/server/src/builder/mastra/`, `apps/server/src/conversations-of.ts`, `apps/server/src/main.ts`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `docs/reference/boundaries.md` | [data](../guides/data.md) | esta página aprovada; a 24.5.1 no `main` |
| U2 O workflow como terceiro autor | O autor `WORKFLOW` em `mustAsk` e no funil, nas leituras (`SessionScope.speaksAs`), no registro e em `mayUse`; `where` (`CONVERSATION` ou `RUN`) e `callKey` no `WriteRequest`; a tentativa de um balão que nunca manda duas vezes (`earlierAttempt`); a escrita de um agente dentro de uma execução no livro da execução; a migração do registro; as marcas de id dos workflows | `apps/server/src/hub/connectors/`, `apps/server/src/hub/identity/`, `apps/server/src/builder/agents/`, `packages/hub-api/src/workflow-ids.ts`, `apps/server/migrations/` | [data](../guides/data.md) | a 24.5.1 no `main` |
| U3 O executor e as execuções | O corpo das sete ferramentas (conferir, ler, ler a lista, agente, aprovar, escrever, avisar); a identidade da execução no `requestContext`, com a versão e quem a ativou; o agente fixado numa versão que não é a ativa (`versionOf` e a montagem fixada no registro); o **Usar outro workflow** rodando a versão fixada do outro; o gatilho de horário e o manual; a tabela `workflow_run` com a tentativa, e as decisões; a lista e a vista das execuções pelo retrato; responder (aprovar e recusar); **Tentar de novo**, também dentro de um caminho; a interrompida; pausar, religar, apagar; o teste do rascunho, que roda como uma execução; os avisos novos e a chave nova dos avisos; a passagem do início por empresa | `apps/server/src/builder/workflows/`, `apps/server/src/builder/agents/`, `apps/server/src/builder/automations/`, `apps/server/src/builder/mastra/`, `apps/server/src/main.ts`, `apps/server/src/conversations-of.ts`, `apps/server/src/hub/notifications/`, `packages/hub-api/src/`, `apps/server/migrations/`, `apps/server/database-grants.sql` | [testing](../guides/testing.md) | U1, U2; a correção da 24.5 do turno no `main` |
| U4 O gatilho do kit e a caixa de eventos | `kernel/trigger.ts` e `Connector.triggers` no kit, conferidos por `defineConnector` e pela conformidade; o gatilho `orcamentoNovo` do Sankhya, a leitura nova e o seu dublê; as tabelas `workflow_trigger` e `trigger_event`; o workflow fixo `conexus-trigger-look` e uma agenda por gatilho, com a cadência escolhida; a primeira olhada que marca o agora; a admissão com chave única e o cursor que só anda depois; o aviso ao dono na falha e na volta; o item mais recente para o teste | `packages/connectors/src/kernel/`, `packages/connectors/src/sankhya/`, `apps/server/src/hub/connectors/`, `apps/server/src/builder/workflows/`, `apps/server/src/builder/mastra/`, `apps/server/src/conversations-of.ts`, `apps/server/src/main.ts`, `apps/server/src/hub/notifications/`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `docs/reference/boundaries.md` | [testing](../guides/testing.md) | U3 |
| U5 O Construtor monta | As quatro ferramentas `workflow_catalog`, `workflow_read`, `workflow_save`, `workflow_test`; o vocabulário desta etapa (as folhas, o **Se** com **senão**, o **Usar outro workflow**, o gatilho com o modo de olhar e a cadência); o texto do Construtor; a linha de cada ferramenta na conversa | `apps/server/src/builder/construtor/`, `packages/hub-api/src/construtor.ts`, `apps/web/src/builder/conversation/construtor-specs.ts`, `apps/web/src/builder/conversation/tool-spec.ts` | [security](../guides/security.md) | U3 (o gatilho do catálogo, da U4, entra quando a U4 estiver no `main`) |
| U6 O canvas | A prova de CSP do `@xyflow/react`; o canvas e as suas peças, com o arranjo recursivo; o **Se** com os dois caminhos; o **Usar outro workflow**; o painel do balão (quem é, configuração, o que recebe, o que devolve, código); arrastar para encaixar; o "+"; a execução acesa; os problemas; o celular em coluna; o canvas ao lado do Construtor; o cartão de aprovação dividido em peça e dois adaptadores; o workflow na lista de Automações | `apps/web/src/builder/workflows/` (novo), `apps/web/src/builder/conversation/`, `apps/web/src/builder/automations/`, `apps/web/src/builder/agents/construtor-chat.tsx`, `apps/web/src/routes/_app/companies/$companyId/`, `apps/web/package.json`, `package.json`, `package-lock.json`, `.dependency-cruiser.cjs`, `scripts/rules.test.ts`, `docs/reference/stack.md`, `docs/reference/screens.md`, `tests/e2e/` | [web](../guides/web.md) | U3 |

A U1 e a U2 correm em paralelo, e cada uma tem a sua migração. Elas dividem quatro arquivos:
`packages/hub-api/src/workflow-ids.ts` (as marcas, com o texto fixo na seção da U2) é da U2, e a U1
começa com um `cherry-pick` do commit da U2 que só cria esse arquivo, que o rebase deduplica;
`apps/server/src/conversations-of.ts`, em linhas diferentes (a U1 acrescenta a parte dos
workflows, as ferramentas e o `releaseFirst`, `:165-176`; a U2 muda só a porta `openWrites`,
`:43`); o retrato do catálogo (`catalog.test.ts`); e `packages/hub-api/src/index.ts`. A segunda a
entrar faz o rebase de `conversations-of.ts`, regenera o retrato e junta as exportações. A
U3 começa com as duas e a correção da 24.5 do turno no `main`. A U4, a U5 e a U6 correm juntas
depois da U3: a U4 fica no kit e em `builder/workflows/trigger*.ts`, a U5 no Construtor, a U6 em
`apps/web`; a U5 muda só `construtor-specs.ts` e `tool-spec.ts` em
`apps/web/src/builder/conversation/`, e a U6 outros arquivos dessa pasta. O catálogo da U5 lista os
gatilhos do kit pela porta que a U4 cria; até a U4 entrar, ele lista só `SCHEDULE` e `MANUAL`.

**O que cada unidade apaga.**

- U1: nada.
- U2: `agentVersion` de `SessionScope` (passa a `speaksAs`), `threadId` e `toolCallId` de
  `WriteRequest` (passam a `where` e `callKey`), `threadId` e `except` de `OpenWritesKey`, e o
  parâmetro `threadId` de `mustAsk` da 24.5.1 (passa a `where`).
- U3: a espera do minuto do relógio de verdade no teste da agenda (#754); o filtro por
  `AUTOMATION_WORKFLOW` em `atLimit` (`builder/automations/automations.ts:108-114`), que passa a
  somar as agendas dos workflows.
- U4: a entrada "the trigger remembers what it has seen" de `docs/reference/boundaries.md:1266-1283`
  é reescrita para o desenho novo (os nomes `trigger.ts`, `workflow_trigger`, `trigger_event`).
- U5: nada.
- U6: a fonte de dados presa dentro de `apps/web/src/builder/conversation/approval-card.tsx`
  (`ApprovalCard` em `:177`, `useReply` em `:31-51`).

Nenhum código de pg-boss existe para apagar; o texto sai no fechamento (abaixo, "A dívida").

**O método das unidades.** Cada unidade segue o `pstack:poteto-mode` como as skills do repositório
já o chamam ([`conexus-scope`](../../.agents/skills/conexus-scope/SKILL.md), passo 4;
[`conexus-build`](../../.agents/skills/conexus-build/SKILL.md)). O cartão não repete o método.

**Orçamento de código alterado** (estimado pela leitura, sem protótipo, sem testes nem gerados).

| Unidade | Linhas | De onde vem o número |
| --- | --- | --- |
| U1 | ~1.350 | ~800 do cartão anterior, mais ~550 do documento recursivo, das quatro regras e dos caminhos (o preparo do fluxo completo estima ~700 para todas as formas; a U1 não leva a execução por item nem as esperas) |
| U2 | ~350 | ~450 do cartão anterior, menos ~150 que a 24.5.1 leva (o cartão dela, decisão 1), mais ~60 da escrita do agente no livro da execução (a leitura do caminho de escrita, M7) |
| U3 | ~1.500 | ~1.350 do cartão anterior, mais ~60 de `versionOf` e da montagem fixada, ~20 da ativação na identidade, ~70 do **senão**, do **Usar outro workflow** e de **Tentar de novo** num caminho aninhado |
| U4 | ~750 | o estudo de gatilhos, seção 5.7 (`T8a`): ~1.050, menos ~300 de testes |
| U5 | ~450 | ~400 do cartão anterior, mais ~50 do vocabulário do **senão** e do **Usar outro workflow** |
| U6 | ~1.500 | ~1.200 do cartão anterior, mais ~150 do painel (a configuração por espécie e o código) e ~150 do **senão** e do **Usar outro workflow** no arranjo recursivo |
| **Total** | **~5.900** | |

O total passa a regra L2 (~4.000) em cerca de 48% (~1.900 linhas). Você aceitou a divisão G-a, que já tira desta
etapa ~3.000 linhas (a 24.6.2, ~1.500, e a 24.6.3, ~1.300, pelo preparo do fluxo completo); aprovar
esta página com esse tamanho é aceitar o excesso que fica. O construtor de cada unidade para e
relata se a sua passar de um terço do seu número.

## Os critérios de aceite

Os caminhos são de `apps/server/src/` quando não dizem outro. `BASE` é
`/api/companies/{companyId}/workflows`.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `POST BASE` (`createWorkflow`, com `Idempotency-Key`) com `{ place, draft }` cria o workflow e responde 201 com o `WorkflowView`; a mesma chave com o mesmo corpo responde o mesmo workflow, e com outro corpo `IDEMPOTENCY_CONFLICT`; `PUT BASE/{w}/draft` (`saveWorkflowDraft`) com um corpo que `SaveDraftBody` aceita grava o rascunho, sobe `revision` e devolve o `WorkflowView` com `problems`; um rascunho com problemas de sentido também grava, e cada um vem com o código, o balão e o caminho: um `READ` com operação de escrita (`OPERATION_WRONG_CLASS`), um `AGENT` de agente de outro Projeto (`AGENT_OTHER_PROJECT`), um `AGENT` de agente publicado num workflow da empresa (`AGENT_IN_COMPANY`), uma referência `{{b9.texto}}` a um balão que não vem antes (`REF_NOT_BEFORE`), um `IF` sobre um campo que não é número (`IF_FIELD_NOT_NUMBER`), um `IF` sem balão no "se sim" (`IF_EMPTY`), um balão depois do `IF` que usa a saída de um de dentro de um caminho (`REF_INSIDE_BRANCH`), um balão do "+" sem ligação (`BALLOON_INCOMPLETE`), um `USE` de um workflow sem versão publicada (`USE_NOT_PUBLISHED`), dele mesmo (`USE_ITSELF`) ou de outro lugar (`USE_OTHER_PLACE`), um `PARALLEL`, `FOREACH` ou `LOOP` (`BALLOON_KIND_LATER`), um `FOREACH` cujo balão de antes não devolve uma lista (`FOREACH_NOT_A_LIST`), 51 balões contando os de dentro dos caminhos (`WORKFLOW_TOO_MANY_BALLOONS`, o rascunho grava); um corpo que o esquema recusa responde `REQUEST_MALFORMED` (C51) e não grava; uma `revision` que não é a atual responde `WORKFLOW_DRAFT_STALE` e não grava; um `{w}` que não existe responde `WORKFLOW_NOT_FOUND` | `builder/workflows/routes.test.ts` (novo), "o rascunho" | must |
| 2 | U1 | A lista de problemas junta a validação do Mastra: com o índice montado sem a ferramenta `conexus-ler`, um rascunho com um `READ` tem um problema `GRAPH_MISSING_REFERENCE` no balão do `READ`, também quando o `READ` está no "senão", com a mensagem em português e sem nome de passo do Mastra; com o índice inteiro, o mesmo rascunho não tem problema `GRAPH_*` | `builder/workflows/problems.test.ts` (novo), "a validação do Mastra" | must |
| 3 | U1 | `POST BASE/{w}/publish` recusa com `WORKFLOW_HAS_PROBLEMS` enquanto houver um problema `ERROR`, inclusive os de papel calculados para quem publica (uma operação fora do papel dele, também dentro do workflow que um `USE` usa, `OPERATION_NOT_IN_ROLE`; um `WRITE` em **Faz sozinho** sem `agent: publishUnattendedWrite`, `WRITE_AUTO_NOT_ALLOWED`, pelo `mayLeaveAlone` da 24.5.1; uma ligação não liberada, `CONNECTION_NOT_OFFERED`; uma pessoa fora da empresa, `PERSON_NOT_FOUND`); sem `manageAutomations`, `NOT_IN_ROLE`; nada se grava e nada vai ao Mastra | `builder/workflows/publish.test.ts` (novo), "a publicação recusada" | must |
| 4 | U1 | Publicar sem problema grava a versão `n+1` com o `frozen` (o desenho, o agente de cada `AGENT` fixado na versão ativa dele, o outro workflow de cada `USE` fixado na versão ativa dele, o que a versão declara, inclusive o declarado dos workflows usados), põe `active_version = n+1` e `active_by` = quem publicou num só `UPDATE`, registra no Mastra `wf-<w>-v<n+1>` e um `wf-<w>-v<n+1>-<caminho>` por caminho, e as linhas aparecem em `mastra.mastra_workflow_definitions` com `status = 'active'`; o `addDynamicWorkflows` aceita a primeira entrada `conferir` contra o `inputSchema` do gatilho sem `incompatible-schema` (prova P13c do estudo); as da versão `n` continuam `active`; publicar de novo sem mudar o rascunho responde a mesma versão; publicar o agente ou o workflow usado de novo depois não muda o `frozen` da versão | `publish.test.ts`, "publicar" | must |
| 5 | U1 | Depois de um reinício (um Hub novo ao lado do mesmo banco, por `hubBeside`), cada versão publicada está no Mastra, achada por `listWorkflows()['wf-<w>-v<n>']` e nunca por `getWorkflow` ou `getWorkflowById`, sem código do Conexus a registrar (o Mastra as carrega em `startWorkers`); uma definição `wf-*` sem versão no Hub, de qualquer empresa, é apagada pela passagem do início, que percorre as empresas por `builder.companies_with_workflows()` e roda depois de o Hub ouvir; `DELETE BASE/{w}` apaga as definições e depois responde `WORKFLOW_NOT_FOUND`; um `{w}` de outra empresa ou desconhecido responde `WORKFLOW_NOT_FOUND` sem nenhum nome de workflow do Mastra no corpo nem no log (S40) | `publish.test.ts`, "depois do reinício" e "apagar" | must |
| 38 | U1 | A compilação, sem I/O, contra as formas das provas P8, P14 e P15: um **Se** com **senão** dá um `conditional` de dois passos (`bK_0` e `bK_1`), com o predicado do "senão" igual a `{ op: 'not', arg: <o do se> }`; cada caminho é um workflow aninhado, e nenhum `mapping` fica dentro de um `conditional`, `parallel`, `foreach` ou `loop`; todo balão tipado vem depois do seu `mapping` `bN-in`, também o que vem logo depois de um `APPROVAL`, salvo o `FOREACH`; um `PARALLEL` de dois caminhos, um `FOREACH` logo depois de um `READ` de muitas linhas (`conexus-ler-lista`, sem `bK-in` entre os dois, sem `concurrency`, o padrão 1 do Mastra, e com o corpo `bK_0` um workflow aninhado que começa pelo `mapping` do item, as formas de P14 `p14-lane` e P15 `p15-foreach`) e um `LOOP` (com `conexus-contar` no fim do corpo) são aceitos por `addDynamicWorkflows` com as ferramentas de teste; o principal e o caminho têm `outputSchema: {}` quando o último balão devolve uma lista (um `READ` de muitas linhas ou um `FOREACH`, P15); um `mapping` `bN-in` de 2.000 caracteres volta inteiro de `mastra_workflow_definitions`; a mesma versão compila sempre nas mesmas definições | `builder/workflows/compile.test.ts` (novo) | must |
| 39 | U1 | A ferramenta `conexus-contar`, rodada num `LOOP` compilado com `max: 3` e um predicado que nunca para: o corpo roda três vezes e a execução termina `failed` com `WORKFLOW_LOOP_LIMIT` no balão do `LOOP`; com um predicado que para na segunda volta, termina `success` com `volta: 2` | `compile.test.ts`, "o contador" | must |
| 6 | U2 | Os testes da 24.5 e da 24.5.1 sobre "pergunta ou faz" (`builder/agents/autonomy.test.ts`, os mundos `test-approval.ts` e `test-agents.ts`, os testes de `hub/connectors/approval.test.ts` da 24.5.1) passam sem mudar a asserção; `mustAsk` com `where: { kind: 'RUN' }` e uma escrita aberta da mesma ligação e operação na mesma execução devolve `{ kind: 'ASK', reason: 'OPEN_WRITE' }`, e com uma escrita aberta numa conversa, não | `hub/connectors/approval.test.ts` | must |
| 7 | U2 | `writeThrough` com `speaker: WORKFLOW`, `where: { kind: 'RUN' }` e `callKey` `b5#0` envia ao dublê do Sankhya uma vez e grava a linha de `connector_write` com `thread_id` igual à execução, `tool_call_id` igual a `b5#0`, `workflow_id` e `workflow_version`, e `agent_id`, `version_number` e `person_id` nulos; a mesma chave de novo não envia e devolve o que o registro diz; a tentativa seguinte (`b5#1`) depois de uma `b5#0` `DONE` com a mesma entrada devolve a resposta guardada e não envia, e com outra entrada responde `IDEMPOTENCY_CONFLICT`; depois de uma `b5#0` `SENDING` ou `UNCERTAIN` devolve `WRITE_UNCERTAIN` com a marca da `b5#0` e não envia; depois de uma `b5#0` `REFUSED` envia uma vez; um `INSERT` direto com dois autores é recusado pelo `CHECK` `connector_write_speaker` (23514); uma operação que a versão não declara responde `NOT_IN_ROLE`, uma ligação não liberada `NOT_GRANTED` | `hub/connectors/write.test.ts`, "o workflow escreve" e "a tentativa seguinte" | must |
| 8 | U2 | A migração `e246_connector_write_workflow` passa `npm run migrations` com a sua linha `-- contract:`; uma linha da 24.5 gravada antes dela continua lida igual depois | `hub/connectors/connector-write-table.test.ts`, "o terceiro autor" | must |
| 40 | U2 | A escrita de um agente dentro de uma execução: com a chamada da execução no `requestContext` (`conexus.run.call` com a execução, o balão e a tentativa), a ferramenta de escrita do agente grava com `where: RUN` e `callKey` `b3#0#<toolCallId>`, e a marca é `markOf(<execução>, b3#0#<toolCallId>)`; uma segunda conversa do mesmo balão na tentativa `1`, que pede a mesma operação na mesma ligação, encontra a linha `SENDING` ou `UNCERTAIN` da tentativa `0` e pergunta (`WRITE_OPEN`), sem enviar; sem a chamada da execução no `requestContext`, a escrita grava com `where: CONVERSATION` como hoje | `hub/connectors/write.test.ts`, "o agente num workflow" | must |
| 9 | U3 | A conferência no começo de cada execução: com quem ativou a versão (`RunIdentity.answeredBy`) fora da empresa, sem `manageAutomations` no papel dele hoje, ou sem uma leitura que a versão declara nesse papel, a execução termina `FAILED` no balão `conferir` com `WORKFLOW_OWNER_CANNOT_RUN`, nenhum balão depois roda (o dublê não recebe leitura), o workflow fica `PAUSED_OWNER`, a agenda pausa e o dono recebe o aviso `WORKFLOW_PAUSED`; a execução aparece em `workflow_run` com o `label`, `attempt = 0`, a versão e `answered_by`; uma execução começada com um `requestContext` que `RunIdentity` recusa, ou cujo `workflowId` e `version` não são os da id do Mastra, falha em `conferir` com `INTERNAL_UNEXPECTED` e não grava nada | `builder/workflows/balloons.test.ts` (novo), "conferir" | must |
| 10 | U3 | O balão `READ` lê pelo funil com o autor `WORKFLOW` (o `speaksAs` de `SessionScope`) e quem ativou a versão: o dublê recebe a leitura e a saída do balão traz `resultado`; uma operação que a versão não declara responde `NOT_IN_ROLE` sem ler o papel de ninguém; uma entrada que não serve à operação falha o balão com `REQUEST_MALFORMED` (a ferramenta lança; nunca devolve `{ error: true }` como sucesso, prova P2 do estudo) | `balloons.test.ts`, "ler" | must |
| 11 | U3 | O balão `AGENT` de um agente publicado abre uma conversa do agente com a etiqueta `AGENT_MARK.workflow` igual à id do workflow, de id tirada da execução, do balão e da tentativa, e roda a versão fixada no `frozen`, também quando o agente já tem outra versão ativa (`versionOf` e a montagem fixada, como o ramo `DRAFT` de `registry.resolve`); o `AgentRun` do turno leva `number` igual à versão fixada e `answeredBy` igual ao da execução; o balão devolve `texto` e `conversationId`; **Tentar de novo** num balão de agente que falhou abre uma conversa nova; o balão `AGENT` com o Assistente abre uma conversa do Assistente como a Automação abre (`builder/automations/run.ts:112-142`); um turno que falha ou passa de 15 minutos falha o balão com o código do turno; um agente apagado depois de publicar falha o balão com `AGENT_NOT_FOUND` | `balloons.test.ts`, "o agente" | must |
| 12 | U3 | Um agente com escrita em **Pergunta antes** num balão: o balão drena o stream e, no pedido de aprovação, a execução fica `WAITING` com `waiting.kind = 'AGENT_WRITE'`, `reason: 'CHOSEN'`, o `approver` do balão, e a `connectionId`, a `operation` e os `fields` da chamada, achados pela ferramenta `tool_<slug>` da versão fixada do agente, e o dublê não recebe nada; a resposta aprovada retoma, chama `approveToolCall` na versão fixada (que não é a ativa) com `APPROVED_CALL` no `requestContext`, e a escrita vai ao dublê uma vez no livro da execução (critério 40); recusada, o Hub grava a decisão e chama `run.cancel()`: a execução termina `DECLINED`, o modelo de mentira não recebe nenhuma chamada depois da recusa, e a conversa do agente mostra a chamada sem cartão; o mesmo depois de um reinício entre a espera e a resposta; em **Faz sozinho**, com quem ativou o workflow sem `publishUnattendedWrite`, a execução espera com `waiting.reason: 'PUBLISHER_LOST_RIGHT'` e `waiting.approver` igual a quem ativou o workflow, e quem ativou o agente não entra na conta | `balloons.test.ts`, "o agente que escreve" | must |
| 13 | U3 | O balão `APPROVAL` para a execução (`WAITING`, `waiting.kind = 'APPROVAL'`, com a pessoa e a pergunta) e nada depois dele roda; no mesmo instante a pessoa recebe o aviso `WORKFLOW_WAITING` no sino e por e-mail; uma execução que espera e depois, aprovada, avisa no `NOTIFY` dois avisados grava os três avisos (um `WORKFLOW_WAITING` e dois `WORKFLOW_NOTICE`); o mesmo balão `NOTIFY` rodado de novo na mesma tentativa (a mesma chave do aviso) não grava outro; um aviso da 24.2 gravado antes da migração continua no sino; um balão que falha avisa `WORKFLOW_FAILED` a quem ativou, e a mesma execução que falha de novo depois de **Tentar de novo** avisa de novo (a chave tem a tentativa); um `TEST` que falha não avisa; num `IF` cujo valor não passa, os balões do "se sim" aparecem `SKIPPED` e os do "senão" rodam; num que passa, o contrário | `balloons.test.ts`, "aprovar espera", "avisar" e "os dois caminhos"; `hub/notifications/notifications.test.ts`, "os avisos do workflow" | must |
| 14 | U3 | `POST BASE/{w}/runs/{r}/balloons/{b}/answer` com `approved: true` pela pessoa do balão retoma a execução; com `approved: false` num `APPROVAL`, num `WRITE` ou num `AGENT_WRITE`, a execução termina `DECLINED` (o Mastra guarda `canceled`) e nada depois roda; a decisão fica em `workflow_run_decision` com a tentativa e `iteration = ''`; uma segunda resposta ao mesmo pedido responde `RUN_NOT_WAITING`; outra pessoa recebe `NOT_APPROVER`; num `WRITE` ou num `AGENT_WRITE`, a pessoa do balão sem a escrita no papel recebe `NOT_IN_ROLE` (`D3-a`, `mayApprove`) e nada roda; no exemplo do roteiro, um `WRITE` do "se sim" que falhou e **Tentar de novo** refazem o `APPROVAL` do caminho (prova P8), que espera de novo e aceita a resposta da tentativa nova; uma decisão gravada cuja retomada não aconteceu (o Hub morreu no meio) é retomada pela passagem do início só se a sua tentativa é a da execução; uma execução que espera continua esperando depois de um reinício, e a resposta funciona, também dentro do "senão" e dentro de um `USE` | `builder/workflows/runs.test.ts` (novo), "responder" | must |
| 15 | U3 | Uma execução que espera na versão `n`, ativada pela Ana, continua na versão `n` e com a Ana depois de o Carlos publicar a `n+1` com um balão a mais antes do que espera: aprovada, roda só os balões da versão `n`, a escrita é respondida pela Ana (`D2-a` com o papel dela, lido agora), e `RunIdentity.answeredBy` volta igual na retomada, no `restart` e no `timeTravel` (prova P13) | `runs.test.ts`, "a versão e quem a ativou" | must |
| 16 | U3 | O balão `WRITE` em **Pergunta antes** espera (`waiting.kind = 'WRITE'`, `reason: 'CHOSEN'`) e o dublê não recebe nada; aprovado, envia uma vez pelo funil com o autor `WORKFLOW` e a chave `<balão>#<tentativa>`; em **Faz sozinho** envia sem parar; **Tentar de novo** depois de um envio feito não envia de novo e devolve o que o registro diz; depois de um envio recusado pelo Sankhya, envia de novo uma vez; depois de um envio de fim incerto, espera com `reason: 'UNCERTAIN'` e a marca; a recusa do Sankhya falha o balão com `BALLOON_SYSTEM_REFUSED` e o Sankhya fora com `BALLOON_SYSTEM_UNREACHABLE` | `balloons.test.ts`, "escrever" | must |
| 17 | U3 | `D2-a` num workflow: um `WRITE` em **Faz sozinho** cuja pessoa que ativou a versão perdeu `publishUnattendedWrite` ou a escrita depois de publicar espera com `reason: 'PUBLISHER_LOST_RIGHT'` e a pessoa que espera é ela; a versão não muda | `balloons.test.ts`, "o dono perdeu o direito" | must |
| 18 | U3 | `POST BASE/{w}/runs/{r}/retry` numa execução `FAILED` sobe `workflow_run.attempt` e retoma do balão que falhou (`timeTravel` com `attempt` no `requestContext`) sem rodar os anteriores (o dublê conta uma leitura); num balão dentro de um caminho, passa `step` igual ao id do balão do caminho e refaz o caminho do primeiro balão dele e segue (prova P8 do estudo); uma execução `running` de antes do início do Hub aparece `INTERRUPTED` ao ser lida, como `builder/automations/runs.ts:82-99`, e **Tentar de novo** a termina com `restart()` do balão em que estava; antes de vencer a posse do Mastra responde `RUN_STILL_OWNED`; dois **Tentar de novo** ao mesmo tempo sobem a tentativa uma vez e o segundo responde `RUN_NOT_FAILED`; numa execução que não falhou nem foi interrompida, ou num teste, `RUN_NOT_FAILED` | `runs.test.ts`, "tentar de novo" e "a interrompida" | must |
| 19 | U3 | O gatilho de horário: publicar um workflow com `SCHEDULE` cria a agenda `schedule_wf-<w>-v<n>` sobre `wf-<w>-v<n>` com o `cron` de `cronOf` e o `requestContext` `RunIdentity` (`startedBy: 'SCHEDULE'`, a versão e `answeredBy`); um disparo (relógio injetado) é uma execução de id `sched_schedule_wf-<w>-v<n>_<ms>` cujas ferramentas leem a empresa do `requestContext`; publicar a `n+1` cria a agenda da `n+1` antes de apagar a da `n`; o limite de 30 da 24.2 conta, por empresa, as agendas da Automação e as `schedule_wf-*` ativas cujo `requestContext.companyId` é a empresa (`AUTOMATION_LIMIT` ao publicar ou religar a 31ª), e um workflow `MANUAL` ligado não conta; o teste da agenda não espera o minuto do relógio de verdade (#754) | `builder/workflows/schedule.test.ts` (novo) | must |
| 20 | U3 | `POST BASE/{w}/run` responde 202 com o `runId` e começa uma execução da versão ativa com `startedBy` igual à pessoa e `answeredBy` igual a `active_by`, lidos na mesma linha; sem versão publicada, `WORKFLOW_NOT_PUBLISHED`; pausar pausa a agenda e `run` responde `WORKFLOW_PAUSED`; religar a religa; apagar o workflow apaga a agenda, as execuções no Mastra e as definições, e responde `WORKFLOW_NOT_FOUND` depois; apagar o Projeto ou a empresa faz o mesmo pelo `releaseFirst`; quem sai da empresa deixa `active_by` nulo; com o Hub atualizando, `run`, `publish` e `answer` respondem `HUB_UPDATING` | `builder/workflows/routes.test.ts`, "rodar, pausar, religar, apagar" | must |
| 21 | U3 | `GET BASE/{w}/runs` devolve as execuções de todas as versões (de `workflow_run`, sem as de teste), 20 por página, mais novas primeiro, cada uma com a versão, o `label` ("Orçamento nº 1043" no gatilho do Sankhya, "Rodado por Ana" no manual, a hora do disparo no horário), o estado e quantas esperam; `GET BASE/{w}/runs/{r}` traz o estado e a saída de cada balão, também os de um caminho e o de um `USE`, e também de um teste; lido de outra conexão antes do fim, um balão aparece `RUNNING` e os anteriores `DONE` (prova P10 do estudo); `GET BASE?place=` devolve os workflows do lugar com o estado, a última execução e `waitingCount` | `runs.test.ts`, "a lista e a vista" | must |
| 22 | U3 | `POST BASE/{w}/test` responde 202 com o `runId`: compila o rascunho com os agentes e os workflows usados fixados nas versões ativas para `workflow.test_draft`, registra `wf-<w>-teste` e começa uma execução sobre a entrada de `TestInput` (o item mais recente do gatilho, U4; `{}` para `SCHEDULE` e `MANUAL`), gravada em `workflow_run` com `kind = 'TEST'` e `answered_by` igual a quem começou o teste; `GET BASE/{w}/runs/{r}` a lê e acende como qualquer execução; um `APPROVAL` espera quem começou o teste, que responde pela mesma rota, sem aviso no sino; o `NOTIFY` não avisa ninguém; um `WRITE`, ou a escrita de um agente mesmo em **Faz sozinho**, não envia e o teste termina `STOPPED_BEFORE_WRITE` ("parou antes de escrever"); um segundo teste cancela a execução de teste ainda aberta e substitui a definição; um rascunho com problema `ERROR` responde `WORKFLOW_HAS_PROBLEMS` | `runs.test.ts`, "o teste" | must |
| 41 | U3 | O **Usar outro workflow**: um `USE` do workflow "Conferir cliente" fixado na versão 1 roda os balões da versão 1 dele dentro da execução, mesmo depois de o outro publicar a versão 2; a saída do `USE` é a saída do outro; a conferência de quem ativou não roda de novo dentro dele (o `conferir` do caminho só confere que a versão fixada do outro existe); uma escrita dentro do outro é respondida por quem ativou o workflow de fora; apagar o outro workflow depois faz o `USE` falhar com `WORKFLOW_NOT_FOUND` | `balloons.test.ts`, "usar outro workflow" | must |
| 23 | U4 | Ao ligar (publicar a primeira vez com um gatilho de conector, ou religar), a primeira olhada (`last_ok_at` nulo) lê só o item mais novo, grava o cursor nele e `last_ok_at`, e não dispara nada (`T5a`); o dublê com três orçamentos novos dos tipos escolhidos depois dela dá três execuções da versão ativa, cada uma com a linha do orçamento na entrada e o `label` "Orçamento nº <número>"; a olhada seguinte, com os mesmos três e um novo, dá uma; um orçamento de outro tipo não dispara; com mais de 20 itens novos numa olhada, todos entram na caixa, 20 execuções começam e o resto começa na olhada seguinte, antes dos novos; o cursor só anda depois de todos os itens da leitura estarem na caixa | `builder/workflows/trigger.test.ts` (novo), "orçamentos novos" | must |
| 46 | U4 | A primeira olhada sem nenhum item: com o dublê sem orçamento dos tipos escolhidos, a primeira olhada grava `last_ok_at`, deixa o cursor nulo e não dispara nada, e `WorkflowView.trigger.state` passa de `WAITING_FIRST` a `READING`; depois entra um orçamento, e a olhada seguinte lê desde o começo (`since` com o cursor nulo) e dá exatamente uma execução, com o cursor no número dele; a terceira olhada, sem orçamento novo, não dá nenhuma | `trigger.test.ts`, "a primeira olhada vazia" | must |
| 24 | U4 | Duas olhadas ao mesmo tempo para o mesmo gatilho dão uma execução por orçamento (`trigger_event` com `UNIQUE (trigger_id, item_key)` e a linha do gatilho travada com `FOR NO KEY UPDATE SKIP LOCKED` só na admissão), e o cursor nunca volta: uma olhada que leu antes da outra gravar não o põe num número menor; o Hub morto depois de admitir e antes de começar a execução: a olhada seguinte acha a execução `trg_<gatilho>_<chave>` no Mastra, se ela começou, e não a começa de novo; a leitura recusada (`NOT_GRANTED` com a liberação tirada, `UNREACHABLE`, ou o dublê que recusa a consulta, #819) não anda o cursor, grava a falha na linha do gatilho, imprime `WORKFLOW_TRIGGER_FAILED`, e a olhada seguinte, com a liberação de volta, dispara o mesmo orçamento uma vez | `trigger.test.ts`, "duas olhadas" e "a olhada que falhou" | must |
| 25 | U4 | Cada olhada confere quem ativou a versão antes de ler: sem `manageAutomations`, fora da empresa, ou sem a leitura do gatilho no papel, nenhuma execução começa, a agenda pausa e o workflow fica `PAUSED_OWNER`; pausar e religar: religar zera o cursor e `last_ok_at`, e um orçamento lançado durante a pausa não dispara | `trigger.test.ts`, "o dono perdeu o papel" e "pausar" | must |
| 37 | U4 | `TestInput` para um gatilho de conector: com o dublê com três orçamentos dos tipos escolhidos e um de outro tipo, `POST BASE/{w}/test` começa a execução com a linha do orçamento mais novo dos tipos escolhidos e não grava nenhuma linha em `trigger_event`; sem nenhum orçamento, responde `WORKFLOW_TEST_NO_ITEM` e nada começa | `trigger.test.ts`, "o item do teste" | must |
| 42 | U4 | O kit: `defineConnector` recusa, ao carregar, um gatilho cujo `look.read` não é uma leitura do próprio conector, ou duas ids de gatilho iguais; `runConformance` confere cada gatilho declarado (a leitura existe, é `read`, e `keyOf` dá uma chave no formato de `AccountRef` para cada linha do dublê); o Sankhya declara `orcamentoNovo` com o modo `NEW_BY_ID` | `packages/connectors/src/kernel/definition.test.ts`, "o gatilho"; a conformidade do Sankhya | must |
| 43 | U4 | `T6a`: a primeira olhada que falha com `failing_since` nulo (depois de uma que deu certo, ou a primeira de todas) avisa o dono (`WORKFLOW_TRIGGER_FAILING`, sino e e-mail) uma vez; as falhas seguintes não avisam; a primeira que dá certo depois avisa `WORKFLOW_TRIGGER_BACK` uma vez; duas olhadas ao mesmo tempo na passagem avisam uma vez | `trigger.test.ts`, "o aviso da falha" | must |
| 44 | U4 | A cadência: um gatilho de conector com `everyMinutes` 5, 15, 30 ou 60 cria a agenda `schedule_look-<gatilho>` com `*/5 * * * *`, `*/15 * * * *`, `*/30 * * * *` ou `0 * * * *` e o fuso `AUTOMATION_TIMEZONE`; sem `everyMinutes`, o rascunho grava 15; outro número é recusado pelo esquema com `REQUEST_MALFORMED`; o limite de 30 da 24.2 soma também as `schedule_look-*` ativas da empresa (`AUTOMATION_LIMIT` ao publicar ou religar a 31ª) | `trigger.test.ts`, "a cadência"; `packages/hub-api/src/workflows.test.ts` | must |
| 26 | U5 | O Construtor tem `workflow_catalog`, `workflow_read`, `workflow_save` e `workflow_test`, e nenhuma ferramenta que publica; com o modelo de mentira, um pedido completo grava o rascunho, com o **Se**, o **senão** e o **Usar outro workflow**; um desenho com problemas grava e volta com a lista, e o Construtor o corrige na chamada seguinte com a `revision` nova; depois de 3 gravações seguidas que ainda voltam com problema `ERROR`, o Construtor para de gravar e pergunta à pessoa o que falta (o teto de 3 tentativas do estudo do Kiro do fundador); um pedido sem tipo de operação faz o Construtor perguntar, sem gravar; uma `revision` velha volta `STALE` com o rascunho atual; o catálogo não oferece `PARALLEL`, `FOREACH` nem `LOOP` | `builder/construtor/workflow-tools.test.ts` (novo) | must |
| 27 | U5 | Avaliação com o modelo de verdade (opt-in): o pedido do roteiro, passo 1, termina num rascunho sem problema `ERROR`, com os balões na ordem, o `USE` do Conferir cliente, o `APPROVAL` e o `WRITE` no "se sim" do `IF` do valor, o `NOTIFY` da Carla no "senão", e o `WRITE` em **Pergunta antes** | `builder/construtor/construtor.eval.test.ts`, "o fluxo do orçamento" | should |
| 28 | U6 | O canvas carrega sob a CSP de verdade do Hub (`style-src 'self'`, `apps/server/src/platform/http.ts:39`, W22) no Chromium sem cabeça com zero violações no console, ao abrir, ao arrastar e ao dar zoom | `tests/e2e/workflow-canvas.test.ts` (novo), "sob a CSP" | must |
| 29 | U6 | O canvas mostra cada balão com o ícone e a palavra da espécie ("gatilho", "lê", "agente", "se", "aprovação", "escreve", "avisa", "outro workflow"), o título e quem; as setas; os caminhos "se sim" e "senão" lado a lado sob o **Se**, juntando depois; o "+" em cada seta, também dentro de um caminho; a marca "rascunho"; o arranjo é o mesmo para o mesmo rascunho; a 390 px aparece a coluna (`train.tsx`), com cada caminho sob o seu rótulo, sem nada fora da tela | `apps/web/src/builder/workflows/canvas.test.tsx` (novo); `apps/web/src/builder/workflows/workflows.layout.test.ts` (novo) | must |
| 30 | U6 | Clicar num balão (ou Enter nele) abre o painel com **Quem é**, **Configuração** (por espécie: a ligação e a operação de um `READ` ou `WRITE` com os campos e **Pergunta antes / Faz sozinho**; o agente, a versão, o pedido e quem aprova de um `AGENT`; a pergunta e a pessoa de um `APPROVAL`; as pessoas e a mensagem de um `NOTIFY`; a condição de um **Se**; o workflow e a versão de um `USE`; o conector, o gatilho, os tipos e a cadência do **Gatilho**), **O que recebe**, **O que devolve** (com os valores da execução quando há) e **Código** (a definição do balão no documento, só para ler, sem campo editável); **Renomear**, **Mover para cima / para baixo** e **Apagar** gravam o rascunho; Esc fecha e devolve o foco | `apps/web/src/builder/workflows/panel.test.tsx` (novo) | must |
| 31 | U6 | Arrastar um balão para outro encaixe, também para dentro ou para fora de um caminho, ou **Mover para cima / para baixo** no painel, grava o rascunho inteiro com a `revision`, a lista de problemas é recalculada, e o canvas mostra a nova ordem; levar **Avisar o Bruno**, que usa `{{b3.texto}}`, para antes de **Triagem** (`b3`) cria o problema `REF_NOT_BEFORE` no balão movido e **Publicar** desliga (o estudo do Kiro do fundador: reordenar quebra a ordem de quem produz antes de quem usa); o "+" abre as espécies desta etapa e acrescenta um balão, que aparece com o problema `BALLOON_INCOMPLETE`; um `WORKFLOW_DRAFT_STALE` relê o rascunho e diz "O rascunho mudou; veja de novo"; numa execução ou numa versão publicada o canvas não arrasta | `apps/web/src/builder/workflows/canvas.test.tsx`, "arrastar" e "o +" | must |
| 32 | U6 | Os problemas: o botão "N pontos a resolver" abre a lista balão e frase; tocar num leva ao balão e abre o painel; **Publicar** fica desligado com o primeiro problema como motivo; sem problema, "Tudo certo"; uma recusa de publicar mostra a frase da falha | `apps/web/src/builder/workflows/problems.test.tsx` (novo) | must |
| 33 | U6 | A execução acesa: cada balão com o seu estado em palavra e ponto (esperando, rodando, feito, falhou, esperando você, pulado); a tela relê a execução a cada 5 s enquanto ela não termina e para ao terminar (o intervalo injetado no teste, T20); o balão que falhou traz o motivo e **Tentar de novo**; o cartão **Aprovar?** só para a pessoa do balão; para outra, "Esperando a aprovação de Ana" | `apps/web/src/builder/workflows/run-view.test.tsx` (novo) | must |
| 34 | U6 | O cartão de aprovação da conversa da 24.5 continua igual (os testes do PR 841 passam sem mudar) depois de dividido em peça e dois adaptadores; o adaptador da execução manda `answer` | `apps/web/src/builder/agents/approval-card.test.tsx` (PR 841) | must |
| 35 | U6 | Ao lado do Construtor, o resultado de `workflow_save` abre o canvas do workflow no `Beside`, e cada gravação o relê; no celular, o canvas abre na gaveta do `Beside` e a conversa fica | `apps/web/src/builder/agents/construtor-card.test.tsx`, "o workflow ao lado" | must |
| 36 | U6 | Em Automações do Projeto e do Início, cada workflow aparece com o gatilho em palavras, ligado ou pausado (com o motivo), a última execução e quantas esperam aprovação, ao lado das Automações da 24.2; o Membro não vê Automações (W34) | `apps/web/src/builder/automations/automations.test.tsx`, "o workflow na lista" | must |
| 45 | U6 | Um balão **Usar outro workflow** mostra o nome e a versão do outro; **Abrir** leva à página do outro na versão fixada, só para ler | `apps/web/src/builder/workflows/canvas.test.tsx`, "outro workflow" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| O canvas ao lado do Construtor (U6) | "Peça um fluxo ao Construtor" no lugar do canvas | o mesmo | o esqueleto dos balões | "Não foi possível abrir o workflow" e "Tentar de novo" | apagado em outra aba: "Este workflow foi apagado" | o Membro não chega ao Construtor (W34) | o rascunho mudou em outra aba: "O rascunho mudou; veja de novo" |
| A página do workflow, com o canvas (U6) | a versão publicada e "Nenhuma execução ainda. A primeira vem com o próximo orçamento." | um rascunho nunca publicado: "Rascunho" e **Publicar** | o esqueleto | "Tentar de novo" | "Voltar ao início" | o Membro: não encontrado (W34) | "Pausado porque quem publicou não pode mais"; "A última olhada no Sankhya falhou" com o motivo e a hora; a recusa de publicar com a frase |
| O painel do balão (U6) | **Quem é**, **Configuração**, **O que recebe**, **O que devolve** e **Código** do rascunho | um balão do "+" sem nada: "Diga ao Construtor o que este balão faz", e o **Código** com o que existe | o esqueleto das cinco partes | o valor que não abriu: "Não foi possível ler este valor" | o balão saiu do rascunho: o painel fecha | numa execução ou numa versão publicada: **Renomear**, **Mover** e **Apagar** não aparecem | um balão com problema: a frase do problema no topo |
| O balão **Usar outro workflow** (U6) | o nome e a versão do outro | — | — | — | o outro foi apagado: "Este workflow não existe mais" e o problema | o outro está noutro lugar: o problema `USE_OTHER_PLACE` | — |
| Os problemas (U6) | "Tudo certo" | o mesmo | — | — | — | — | a lista balão e frase |
| A execução acesa (U6) | os balões com o estado | — | o esqueleto | "Tentar de novo" | "Voltar ao início" | quem não é a pessoa do balão: "Esperando a aprovação de Ana", sem botões | "Não aprovado", "Interrompida", "Cancelada", num teste "Parou antes de escrever", o balão que falhou com o motivo |
| O cartão **Aprovar?** na execução (U6) | a pergunta, ou a escrita com os campos, e os dois botões | — | "Aprovando…" ou "Recusando…" | a falha dita | respondido em outra aba: o estado que a execução diz | sem a escrita no papel: "Seu papel não permite aprovar esta escrita" | "Aprovado por você", "Recusado por você" |
| A lista de execuções (U6) | "Nenhuma execução ainda" | o mesmo | o esqueleto | "Tentar de novo" | — | o Membro: não encontrado (W34) | a execução que falhou com o motivo em palavras |
| A lista de Automações (U6) | "Nenhuma automação ainda" e como pedir uma | o mesmo | o esqueleto | "Tentar de novo" | — | o Membro: não encontrado (W34) | um workflow pausado com o motivo; um gatilho que falha, com "A última olhada falhou" |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `WorkflowDraft` (`name`, `trigger`, `balloons`, recursivo) | `workflow_save` (U5), o canvas por `POST BASE` e `PUT …/draft` (U6), pelas operações da U1 | os problemas e a compilação (U1), o canvas e o painel (U6) |
| `WorkflowView.revision` | a rota do rascunho (U1) | `workflow_save` (U5), o canvas (U6) |
| `WorkflowView.problems` | `problemsOf` a cada leitura (U1) | `workflow_save` e `workflow_read` (U5), os problemas e **Publicar** (U6) |
| `workflow_version.frozen` (o desenho, `agents`, `uses`, `declared`) | publicar (U1) | as ferramentas pela id do Mastra (U3), o gatilho (U4), a página e o painel (U6) |
| `workflow.active_version`, `workflow.active_by` | publicar (U1), num só `UPDATE`; `active_by` nulo quando a pessoa sai (U3, `release.ts`) | quem começa uma execução (U3, U4), a página (U6) |
| `workflow_version.published_by` | publicar (U1); nulo quando a pessoa sai | a página (U6) |
| `WorkflowView.state` (`ON`, `PAUSED`, `PAUSED_OWNER`) | pausar e religar (U3), `conferir` (U3), a olhada (U4) | a página e a lista (U6), a agenda (U3, U4) |
| `WorkflowView.trigger` (`TriggerHealth`) | a olhada (U4) | a página e a lista (U6) |
| `workflow_trigger.cursor`, `.failing_since`, `.last_ok_at`, `.last_error` | publicar e religar (U4) zeram o cursor e `last_ok_at`; a olhada (U4) | a olhada (U4), `WorkflowView.trigger` (U4) |
| `trigger_event` (`item_key`, `run_id`, `started`) | a admissão da olhada (U4) | a olhada (U4), a vista da execução (`RunView.item`, U3) |
| `workflow_run` (`kind`, `label`, `started_by`, `version`, `answered_by`) | `conferir` no começo de cada execução, do `requestContext` (U3) | a lista de execuções, sem as `TEST` (U3); a vista (U3) |
| `workflow_run.attempt` | `conferir` grava 0; **Tentar de novo** soma 1 antes de `timeTravel` ou `restart` (U3) | as chaves do balão de escrita, do de agente e da decisão (U3); a passagem do início (U3) |
| O `requestContext` da execução (`RunIdentity`) | a agenda ao publicar (U3), a olhada (U4), `run` e `test` (U3); o Mastra o devolve na retomada, no `restart` e no `timeTravel` (prova P13) | as oito ferramentas (U1, U3) |
| `conexus.run.call` no `requestContext` do turno do agente | o balão `AGENT` (U3) | a ferramenta de escrita do agente (U2) |
| `AgentRun.number`, `AgentRun.answeredBy` | o balão `AGENT` (U3), da execução e do `frozen.agents` | o registro e a escrita do agente (a correção da 24.5, U3) |
| `workflow.test_draft` (um `FrozenWorkflow`) | o teste (U3) | as ferramentas numa id `TEST` (U3) |
| `RunView.state`, `RunView.balloons[].state` | o retrato do Mastra e `workflow_run_decision`, lidos por `runs.ts` (U3) | a execução acesa e a lista (U6), `workflow_test` (U5) |
| `RunView.balloons[].output`, `.conversationId` | o retrato (U3) | o painel (U6) |
| `RunView.waiting` | o `suspendPayload` de `aprovar`, `escrever` e `agente` (U3) | o cartão (U6) |
| `AnswerBody.approved` | o cartão (U6) | a rota de responder (U3) |
| `workflow_run_decision` (chave execução, balão, tentativa, volta e chamada) | a rota de responder (U3) | `runs.ts` e a passagem do início (U3) |
| `WorkflowSummary.waitingCount`, `.lastRun`, `.trigger` | `GET BASE` (U3, U4) | a lista de Automações (U6) |
| A linha de `connector_write` com `workflow_id` | o funil (U2) | o funil (U2), `escrever` (U3) |
| Os avisos `WORKFLOW_WAITING`, `WORKFLOW_NOTICE`, `WORKFLOW_PAUSED`, `WORKFLOW_FAILED`, `WORKFLOW_TRIGGER_FAILING`, `WORKFLOW_TRIGGER_BACK`, com `workflow_id`, `workflow_name`, `balloon_id` e `subject_key` | as ferramentas e `conferir` (U3), a olhada (U4) | o sino e o e-mail (U3, `hub/notifications`) |

**O desenho do canvas**, a 1280 e a 390 px, sobre as peças de `ui/`. A 390 px o canvas é a coluna
(`train.tsx`), aberta na gaveta que o `Beside` já tem no celular
(`apps/web/src/builder/conversation/beside.tsx:25-38`: um `Sheet` com `side="right"`, o título só
para leitor de tela em `:32` e `className="p-0"` em `:34`). O `Sheet` da direita ocupa a largura
toda e rola sozinho (`w-full max-w-message overflow-y-auto`, `apps/web/src/ui/sheet.tsx:23-24`), e
o seu **Fechar** fica no canto de cima (`absolute top-md right-md`): a primeira linha da coluna, com o
nome do workflow, reserva `SHEET_CLOSE_ROOM` (`ui/sheet.tsx:7-12`) para o ✕ não cobrir nada. O
painel de um balão abre embaixo dele, na própria coluna (`Collapsible`), e não numa segunda gaveta.

```text
1280                                                                         390
┌ Construtor · Compras ──────┐┌ Workflow: Orçamento novo [rascunho] [2 pontos] [Publicar] ┐  ┌ Orçamento novo ──────── ✕ ┐
│ quando entrar um orçamento ││                              [+][-][ajustar]              │  │ [rascunho] [Publicar]     │
│ ...                        ││        ┌──────────────────────────┐ ┌ Triagem de orçamento ┐│  │ ⏱ Orçamento novo, 15 min  │
│ Montei o workflow ao lado. ││        │ ⏱ gatilho                 │ │ Quem é               ││  │ ↓                         │
│                            ││        │ Orçamento novo · 15 min   │ │  agente, versão 3    ││  │ ⧉ Conferir cliente (v1)   │
│                            ││        └────────────┬─────────────┘ │ Configuração         ││  │ ↓                         │
│                            ││        ┌────────────┴─────────────┐ │  pedido, quem aprova ││  │ 🤖 Triagem                │
│                            ││        │ ⧉ outro · Conferir (v1)   │ │ O que recebe         ││  │  ▾ Quem é · Configuração  │
│                            ││        └────────────┬─────────────┘ │  texto + cliente     ││  │    Recebe · Devolve · Cód.│
│                            ││        ┌────────────┴─────────────┐ │ O que devolve        ││  │ ↓                         │
│                            ││        │ 🤖 agente · Triagem       │ │  texto               ││  │ ◇ Valor > R$ 20.000?      │
│                            ││        └────────────┬─────────────┘ │ Código               ││  │  se sim                   │
│                            ││        ┌────────────┴─────────────┐ │  { "kind": "AGENT" … ││  │   ✋ Aprovar? (Ana)        │
│                            ││        │ ◇ se · Valor > R$ 20.000? │ │ [Renomear] [Mover ↑↓]││  │   ✍ Lançar o pedido       │
│                            ││        └──┬────────────────────┬──┘ │ [Apagar]             ││  │  senão                    │
│                            ││     se sim│                    │senão└──────────────────────┘│  │   📣 Avisar a Carla       │
│                            ││  ✋ Aprovar? (Ana)       📣 Avisar a Carla                   │  │ ↓                         │
│                            ││  ✍ Lançar o pedido                                          │  │ 📣 Avisar o Bruno         │
│                            ││           └─────────┬──────────┘                            │  └───────────────────────────┘
│                            ││        ┌────────────┴─────────────┐                         │
│ [Fale com o Construtor...] ││        │ 📣 avisa · Avisar o Bruno │                         │
└────────────────────────────┘└───────────────────────────────────────────────────────────┘
```

Os ícones do desenho são lugares: a U6 usa os do `lucide-react` já instalado. As capturas das
referências (o canvas do activepieces, o do painel do Mastra, o painel do nó do n8n) a 1280 e a 390
px são tiradas pela U6 antes de construir, como manda o estudo de uma tela; o estudo não as tirou.

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Gravar o rascunho (`UPDATE workflow` com `revision`) | a `revision` deixa uma; a outra recebe `WORKFLOW_DRAFT_STALE` | — | o banco fora: `DATABASE_UNAVAILABLE`, nada gravado | — | 1, 26, 31 |
| Publicar (`INSERT workflow_version`, `UPDATE workflow SET active_version, active_by` e, na mesma transação antes do `COMMIT`, `addDynamicWorkflows` dos caminhos e do principal) | o `for update` da linha do workflow deixa um; a chave `(workflow_id, source_revision)` faz o segundo responder a versão que existe | o Mastra recusa a definição: a transação volta, `WORKFLOW_PUBLISH_REFUSED` (um defeito da compilação, logado com o `[code] path` do Mastra); o `COMMIT` falha depois do Mastra: a definição fica sem versão no Hub, as ferramentas a recusam (`WORKFLOW_NOT_FOUND`) e a passagem do início a apaga | o banco fora: nada publicado | `WORKFLOW_PUBLISHED` com workflow, versão e quem ativou | 3, 4, 5 |
| A agenda de horário (`mastra.schedules.create`, `pause`, `resume`, `delete`) | uma linha por versão ativa, id `schedule_wf-<w>-v<n>`; criar de novo é idempotente, como `builder/automations/automations.ts:143-188` | o Hub morre entre criar a da `n+1` e apagar a da `n`: na passagem do início, a agenda de uma versão que não é a ativa sai, e um workflow `ON` sem agenda ganha a sua | o banco fora: a falha à tela, o estado não muda | `WORKFLOW_SCHEDULED`, `_PAUSED`, `_RESUMED` | 19, 20 |
| O disparo da agenda (o Mastra começa `wf-<w>-v<n>` ou `conexus-trigger-look`) | a id da execução vem da agenda e da hora: um disparo, uma execução (prova P12 do estudo) | o agendador perde um disparo depois de três falhas (`docs-workflows-scheduled-workflows.md:45`; D27): no horário, a execução não acontece; na olhada, a seguinte lê desde o mesmo cursor | o banco fora: o disparo falha e o Mastra tenta de novo na volta seguinte | o do Mastra | 19, 23 |
| `conferir` (`INSERT workflow_run … ON CONFLICT DO NOTHING` com o `requestContext`, a reconferência de quem ativou, e na falha `UPDATE workflow.state`, `schedules.pause`, o aviso) | um `restart()` refaz `conferir`: o `ON CONFLICT` deixa uma linha, e o aviso `WORKFLOW_PAUSED` tem a chave `(company_id, run_id, person_id, kind, subject_key)` com `subject_key` vazio | o Hub morre depois de pausar e antes do aviso: o workflow já está `PAUSED_OWNER`; o aviso não sai (aceito: a página diz o motivo) | o banco fora: o balão falha com `DATABASE_UNAVAILABLE` e a execução fica `FAILED`, sem ler nada | `WORKFLOW_OWNER_CANNOT_RUN` com workflow e versão | 9 |
| A olhada (`conexus-trigger-look`: a leitura do gatilho; na admissão, `SELECT … FOR NO KEY UPDATE SKIP LOCKED` da linha do gatilho, `INSERT trigger_event … ON CONFLICT DO NOTHING`, o cursor; depois do `COMMIT`, `createRun({ runId: 'trg_<gatilho>_<chave>' }).start()` e `UPDATE trigger_event SET started`) | duas olhadas leem as duas; a admissão da segunda acha a linha travada e sai sem admitir (a próxima lê desde o cursor); a chave `(trigger_id, item_key)` deixa um evento por item; o cursor grava o maior dos dois (`GREATEST`), e nunca volta | o Hub morre depois do `COMMIT` e antes de começar: o evento fica `started = false`, e a olhada seguinte o começa antes dos novos, depois de conferir no Mastra se `trg_<gatilho>_<chave>` já existe (o Mastra roda duas vezes a mesma id, prova 6.2 do estudo de gatilhos) | o Sankhya fora ou a liberação tirada: o cursor não anda, `failing_since` é marcado na passagem e o dono é avisado uma vez (`T6a`); o banco fora: nada é admitido | `WORKFLOW_TRIGGER_FAILED` com workflow e código, sem as linhas (S40); `WORKFLOW_TRIGGER_BACK` | 23, 24, 25, 43 |
| O aviso da falha e da volta do gatilho | a passagem é um `UPDATE workflow_trigger SET failing_since = now() WHERE failing_since IS NULL` (e o inverso na volta): só quem o faz avisa | o Hub morre depois do `UPDATE` e antes do aviso: o aviso não sai (aceito: a página diz a falha) | o e-mail fora: o sino fica | `WORKFLOW_NOTIFIED` | 43 |
| A conversa do balão `AGENT` (a conversa nova, o stream drenado) | uma por execução, balão e tentativa: a id da conversa vem das três, e o mesmo passo rodado de novo na mesma tentativa encontra a mesma e não pergunta duas vezes (`workflowAsked`, como `builder/automations/run.ts:112-142`); **Tentar de novo** sobe a tentativa e abre outra | o turno falha: o balão falha com o código; o Hub morre no meio: a execução fica `INTERRUPTED` | o modelo fora: o código do turno | o mesmo da conversa de hoje, com a execução | 11 |
| A suspensão do balão de agente (`approveToolCall` na retomada aprovada; na recusa, nada no agente) | a retomada é reivindicada pelo Mastra (`WORKFLOW_RESUME_ALREADY_CLAIMED`): a segunda resposta recebe `RUN_NOT_WAITING` | suspender antes de drenar faz a retomada falhar com `AGENT_RESUME_TOOL_CALL_NOT_SUSPENDED` (prova P11 do estudo): o balão drena sempre antes; o Hub morre depois da decisão e antes da retomada: como responder; a corrida suspensa do próprio agente fica como está depois de uma recusa, e nada a retoma | o banco fora: a execução continua esperando | `WORKFLOW_APPROVED` ou `_DECLINED` com execução, balão e pessoa | 12, 14 |
| A escrita do agente num workflow (`writeThrough` com `where: RUN` e `callKey` `<balão>#<tentativa>#<toolCallId>`) | a chave no registro: a segunda chamada lê a linha e não envia; a conversa de outra tentativa vê a linha aberta pelo `heldBy` da execução (`WRITE_OPEN`) | os casos de `WRITE_UNCERTAIN` da 24.5, iguais | os da 24.5, iguais | os da 24.5, com workflow e versão | 12, 40 |
| O aviso de esperar e o do `NOTIFY` (o sino e o e-mail) | um por execução, pessoa, espécie e `subject_key` (`<balão>#<tentativa>`, mais `#<iteração>` dentro de um contêiner e `#<toolCallId>` no agente): o mesmo pedido na mesma tentativa não avisa de novo; **Tentar de novo** que refaz um caminho com um `NOTIFY` dentro avisa de novo na tentativa nova, e um corte no meio do envio pode mandar o e-mail duas vezes (aceito: um aviso a mais, nada escrito) | o e-mail falha: o sino fica e o balão termina | o envio de e-mail fora: igual | `WORKFLOW_NOTIFIED` | 13 |
| Responder (`INSERT workflow_run_decision`, depois `run.resume`; na recusa de `APPROVAL`, `WRITE` e `AGENT_WRITE`, `run.cancel()`, sem chamar o agente) | a chave `(run_id, balloon_id, attempt, iteration, call)` deixa uma decisão; a outra recebe `RUN_NOT_WAITING`; o Mastra recusa a segunda retomada (`WORKFLOW_RESUME_ALREADY_CLAIMED`) | o Hub morre entre a decisão e a retomada: a execução continua `suspended` com a decisão gravada; na passagem do início, o Hub retoma cada decisão gravada da tentativa atual cuja execução ainda espera naquele balão; uma de tentativa velha fica só como história | o banco fora: a falha ao cartão, a execução continua esperando | `WORKFLOW_APPROVED`, `WORKFLOW_DECLINED` | 14 |
| Tentar de novo (`UPDATE workflow_run SET attempt = attempt + 1 WHERE attempt = <a lida>`, depois `run.timeTravel` numa falha ou `run.restart` numa interrompida, com `attempt` no `requestContext`) | o `UPDATE` deixa um; o outro recebe `RUN_NOT_FAILED`; o Mastra também deixa um (`WORKFLOW_TIME_TRAVEL_ALREADY_CLAIMED`, `WORKFLOW_RESTART_RUN_OWNED`) | o Mastra recusa depois do `UPDATE` (`RUN_STILL_OWNED`): a tentativa fica gasta sem nada rodar, e o próximo **Tentar de novo** sobe outra (as chaves dela nunca foram usadas); a definição não muda, porque cada versão é uma id | o banco fora: a falha à tela | `WORKFLOW_RETRIED` com a tentativa | 18 |
| O teste (`UPDATE workflow.test_draft`, `addDynamicWorkflows` de `wf-<w>-teste`, `createRun().start()` com `RunIdentity`) | o segundo teste cancela a execução de teste ainda aberta (`run.cancel()`) e só então substitui a definição | o teste falha num balão: a vista diz o balão e o motivo; um `WRITE` lança `WORKFLOW_TEST_STOPPED_AT_WRITE` antes de chamar o funil, e a vista diz "parou antes de escrever" | o Sankhya fora: o teste falha na leitura do item | `WORKFLOW_TESTED` | 22, 26, 37 |
| Rodar agora, pausar, religar, apagar (`createRun().start()`, `UPDATE workflow.state`, a agenda; religar também zera o cursor do gatilho; apagar também as execuções no Mastra, as definições por `store.delete` e `removeWorkflow`, e as linhas do Hub) | a última vence; dois "rodar agora" dão duas execuções (é o que a pessoa pediu) | o Hub morre entre o Hub e o Mastra: na passagem do início, a agenda segue o `state` do Hub, e as definições de um workflow apagado saem | o banco fora: nada muda | `WORKFLOW_RAN`, `_PAUSED`, `_RESUMED`, `_DELETED` | 20, 25 |
| O balão que escreve (`writeThrough` com `WORKFLOW`, `where: RUN` e `callKey` `<balão>#<tentativa>`) | a chave execução e `callKey` no registro: a segunda chamada lê a linha e não envia; uma tentativa nova lê as linhas das anteriores do mesmo balão (`earlierAttempt`): `DONE` com a mesma entrada devolve a resposta, `SENDING` ou `UNCERTAIN` dá `WRITE_UNCERTAIN`, só `REFUSED` deixa enviar | os casos de `WRITE_UNCERTAIN` da 24.5, iguais: o balão espera a pessoa com `reason: 'UNCERTAIN'` e a marca | os da 24.5, iguais | os da 24.5, com workflow e versão | 7, 16, 17 |
| A migração do registro (`e246_connector_write_workflow`: duas colunas e o `CHECK` trocado) | — | o `CHECK` novo é criado na mesma transação em que o velho sai | — | — | 8 |
| As migrações dos avisos (`e246_notification_workflow`: a chave nova ao lado da velha, duas colunas que aceitam nulo, quatro colunas novas, os `CHECK` alargados; depois `e246_notification_run_key_drop`: a chave velha sai) | — | os `CHECK` novos são criados na mesma transação em que os velhos saem; as linhas da 24.2 passam nos novos (`subject_key` vazio); a chave velha só sai no PR seguinte, depois de a imagem com `onConflictDoNothing()` sem alvo estar no ar, e a imagem anterior nunca encontra o alvo sumido | — | — | 13, 43 |
| As migrações do workflow e do gatilho (`e246_workflow`, `e246_workflow_run`, `e246_workflow_trigger`, e as de permissões) | — | só acrescentam (D6) | — | — | 4, 9, 23 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O documento do workflow (balões e caminhos, rascunho, versões) | U1 | o agente: rascunho e uma versão por publicação (`builder/agents/tables.ts:29-41,73`) | activepieces `f34c43cd` `flow-version.ts:16-23` (DRAFT e LOCKED); n8n `2e855356` `workflow-history.ts:12-27`; o estudo do Kiro do fundador, seção 6 (revisões com `expected_revision`); Mastra 1.82 sem versão (`storage/constants.ts:374-389`); as entradas do grafo em `dist/docs/references/reference-workflows-dynamic-workflow-definition.md` | Um documento tipado, de vocabulário fechado, recursivo (um balão pode ter caminhos, cada caminho uma lista), com rascunho e versões imutáveis | embrulhado: o documento e as versões são nossos; o grafo é do Mastra | P2, P14 | "Base nasce completa" | `packages/hub-api/src/workflows.ts`, `builder/workflows/tables.ts` |
| Compilar uma versão para o Mastra | U1 | nenhum | `@mastra/core@1.82.0` `addDynamicWorkflows` (`dist/mastra/index.d.ts:2069`; `dist/mastra-D4MXu5BN.js:4255-4297`), `toStorableGraph` (`dynamic/serialize.ts:55`), `rehydrateWorkflow`; o caminho como workflow aninhado (`builder/authoring-playbook.ts:7,373`) | Balões viram entradas `tool`, `mapping`, `conditional`, `parallel`, `foreach`, `loop` e `workflow`, com as quatro regras das provas P14 e P15; cada versão é `wf-<id>-v<n>`; cada caminho é `wf-<id>-v<n>-<caminho>` | nativo (Beta) | P1, P2, P5, P8, P9, P14, P15 | a palavra pelo Beta | `builder/workflows/compile.ts` |
| Uma versão publicada é a sua id do Mastra | U1 | o agente: uma versão por publicação (`builder/agents/tables.ts:73`) | Mastra 1.82: a definição não tem versão (`constants.ts:374-389`); a execução copia o grafo vivo ao ser criada (`workflows/workflow.ts:3083`); `addWorkflow` ignora uma id que já existe (`dist/mastra-D4MXu5BN.js:3995`) | Com a mesma id, a retomada depois do reinício roda o grafo novo; cada versão publicada é uma id própria, `active` enquanto o workflow existe | remendo | `@mastra/core@1.82.0`, prova P2 do estudo; critério 15; [boundaries](../reference/boundaries.md), "a published workflow version is its own workflow id" | a aprovação desta página | `builder/workflows/ids.ts` |
| O **Se** com **senão** | U1, U3, U6 | nenhum | `@mastra/core@1.82.0` `conditional` roda todos os ramos verdadeiros, e `{ not }` faz um só (prova P14); o predicado em `dist/predicate/index.d.ts:13` | Dois passos no `conditional`, o do "senão" com a negação do "se"; cada caminho um workflow aninhado | nativo | — | não precisa | `compile.ts` |
| **Ao mesmo tempo**, **Para cada** e **Repetir** no documento e na compilação | U1 (o canvas e a execução por item ficam para a 24.6.2 e a 24.6.3) | nenhum | `@mastra/core@1.82.0` `parallel`, `foreach` (`concurrency` padrão 1), `loop` `dowhile`/`dountil` (provas P14 e P15); um contêiner aceita um passo por caminho e nunca um `mapping` (P14 `invalid-map-placement`); um `parallel` direto dentro de outro derruba o validador (P14) | Cada caminho é um workflow aninhado; a compilação nunca põe um `parallel` direto dentro de outro | nativo | P14, P15 | "Base nasce completa" | `compile.ts` |
| O teto de um **Repetir** | U1 | nenhum | `@mastra/core@1.82.0` `loop` não tem teto: um predicado sempre verdadeiro rodou até a ferramenta falhar na volta 50, e o predicado não lê um contador (prova P14) | A ferramenta `conexus-contar` no fim do corpo carrega a volta nos dados e falha ao passar do número que o balão diz | remendo | `@mastra/core@1.82.0`, prova P14 do estudo; critério 39; [boundaries](../reference/boundaries.md), "a loop stops at its count", entrada nova que a U1 escreve (o texto na seção da U1) | a aprovação desta página | `builder/workflows/tools.ts` |
| **Usar outro workflow** | U1, U3, U6 | nenhum | `@mastra/core@1.82.0` a entrada `workflow` aninhada (prova P14); a retomada de uma aprovação lá dentro passa o caminho (prova P15) | A versão publicada do outro, fixada ao publicar como o agente, é copiada no `frozen` e compilada como um caminho desta versão (`wf-<w>-v<n>-bK_0`), sem referência a uma definição do outro no Mastra | nativo | P14, P15; o caso publicado é o primeiro passo da U3 | "Base nasce completa" | `compile.ts`, `balloons/check.ts` |
| A lista de problemas antes de rodar | U1, U5, U6 | o Construtor recusa um campo por vez (`builder/construtor/tools.ts:104-238`) | `validateDynamicWorkflow` (`dist/workflows/dynamic/validate/index.d.ts:17`), 16 códigos (`validate/types.d.ts:12`), o índice `WorkflowRegistryIndex` (`:71-76`, "chave ausente, sem conferência"); activepieces `valid:false` e `invalidSteps` (`ap-build-flow.ts:194-215`); Dify checklist (`header/checklist/index.tsx`); o estudo do Kiro do fundador, seções 1 e 2 (a validação antes de rodar e o laço de 3 reparos) | Grava o rascunho mesmo com problema, lista cada um pelo balão, e só bloqueia testar e publicar | nativo (a validação do Mastra) mais as regras nossas (papel, liberação, pessoa) | P9 | não precisa | `builder/workflows/problems.ts`, `builder/workflows/index.ts` |
| Ler um sistema num balão | U3 | `readThrough` (`hub/connectors/read.ts:135`), a porta `read` do Assistente (`hub/connectors/assistant-port.ts:281-306`) | Mastra: a entrada `tool` resolve por id (`dynamic/rehydrate.ts:418-425`) e chama `tool.execute` (`run-tool-entry.ts:58`) | A ferramenta `conexus-ler` acha o balão pela `workflowId` e lê pelo funil de hoje com o autor `WORKFLOW` (o declarado da versão), admitida como quem ativou a versão | embrulhado | — | não precisa | `builder/workflows/balloons/read.ts` |
| A conferência no começo de cada execução | U3 | a Automação reconfere o dono a cada execução (`builder/automations/run.ts:189-219`); o autor `VERSION` só confere o declarado (`hub/identity/may-use.ts:76`) | Mastra: a primeira entrada `tool` do grafo | A ferramenta `conexus-conferir` confere que quem ativou a versão está na empresa e tem cada leitura declarada; senão pausa | embrulhado | — | a decisão A | `builder/workflows/balloons/check.ts` |
| A versão e quem a ativou presas à execução | U1, U3 | o agente, depois do PR 848: quem responde vem lido com a versão (`builder/agents/frozen.ts:133,146`, `tools.ts:30`) e `answererLeavesAlone` o recebe (`builder/agents/publish.ts:240-252`); o `AgentRun` do turno ainda não leva o número da versão (`builder/agents/agent.ts:62-66`) e o registro só monta a ativa (`registry.ts:120-135`), então a retomada numa versão que deixou de ser a ativa é da U3 | Mastra: o `requestContext` gravado volta na retomada, no `restart` e no `timeTravel` (`workflows/workflow.ts:5374`, `:5715`, `:5863`; prova P13); n8n: a execução leva a versão com que começou ("Deliberately not the workflow row's `activeVersionId`"), lido no estudo da causa da versão do turno | `RunIdentity` leva a versão e quem a ativou, lidas na mesma linha de `workflow` ao começar | nativo (o `requestContext`) | P13 | a versão presa, 2026-11-08 | `builder/workflows/run-identity.ts` |
| O agente fixado numa versão que não é a ativa | U3 | `registry.resolve` monta só a ativa (`builder/agents/registry.ts:120-135`); `frozen.ts` só tem `activeOf`, `draftOf`, `liveOf` e `publishedAll` (`:124-222`) | Mastra: `__agentVersionId` na execução (o estudo da causa da versão do turno, opção B); o ramo `DRAFT` de `registry.ts:121-124`, que monta um `Agent` por turno | `versionOf` lê a versão pelo número; o registro monta a versão fixada por turno quando ela não é a ativa | embrulhado | P11 | a versão presa, 2026-11-08 | `builder/agents/frozen.ts`, `builder/agents/registry.ts` |
| Um agente num balão, com escrita ou não | U3 | a conversa da Automação (`builder/automations/run.ts:112-142`), o agente publicado (`builder/agents/agent.ts:305-351`, `agentOf`) | Mastra: a entrada `agent` e `createStep(agent)` travam numa aprovação (P3, `run-agent-entry.ts:166-173`) | A ferramenta `conexus-agente` abre uma conversa do agente marcada "Workflow", drena o stream, e num pedido de aprovação suspende o workflow; na retomada, `approveToolCall` | embrulhado (a entrada `agent` do Mastra trava) | P3, P11 | a decisão E | `builder/workflows/balloons/agent.ts` |
| "Aprovar?" no meio do fluxo | U3 | o cartão da conversa, só na memória (24.5) | Mastra: `context.workflow.suspend` (`reference-tools-create-tool.md:75-77,105`), `run.resume` (`dist/agent-BP9OWM6D.js:11239`); Dify Human Input, n8n `sendAndWait`, Zapier Request Approval | A ferramenta suspende; a resposta retoma; sobrevive a um reinício, também num caminho aninhado (P15) | nativo | P2, P5, P15 | a decisão A e a D | `builder/workflows/balloons/approval.ts` |
| Escrever num balão | U2, U3 | `writeThrough` (`hub/connectors/write.ts:154-183`), `connector_write` (`hub/connectors/tables.ts:205-247`) | Mastra: `requireApproval` ignorado num passo (P3); n8n, activepieces e Temporal repetem sem garantir escrita única | A mesma decisão `mustAsk` da conversa; suspende quando pergunta; envia pelo `writeThrough` com o autor `WORKFLOW` | embrulhado: o funil da 24.5 | P11 | a decisão E | `builder/workflows/balloons/write.ts` |
| A decisão "pergunta ou faz" e quem aprova | U2 | 24.5.1: `hub/connectors/approval.ts` (`mustAsk`, `mayApprove`, `answererLeavesAlone`, `WriteAuthorOf` com `answeredBy`) | — | Um lugar só, chamado pela conversa, pelos balões e pela rota de responder; a U2 acrescenta `where` | embrulhado (nosso, da 24.5.1) | P11 | não precisa | — |
| O registro de envios com o terceiro autor | U2 | chave empresa, conversa, `toolCallId` (`hub/connectors/tables.ts:205-247`, PK `:239`, `CHECK` `:240-243`) | — | `thread_id` guarda a conversa ou a execução; `tool_call_id` guarda o `toolCallId` ou a chamada do balão; o autor `WORKFLOW` com `workflow_id` e `workflow_version`; o `CHECK` de quem fala com três braços | embrulhado | lido | a regra D11, pela aprovação desta página | migração `e246_connector_write_workflow` |
| A escrita do agente no livro da execução | U2 | a escrita do agente grava a conversa e o `toolCallId` (`builder/agents/tools.ts:148-152`) | — | Com `conexus.run.call` no `requestContext`, a ferramenta do agente grava com `where: RUN`, e o `heldBy` da execução vê as tentativas anteriores | embrulhado | lido | não precisa | `builder/agents/tools.ts` |
| Avisar uma pessoa | U3 | `deps.notify.automationRan` (`hub/notifications/notifications.ts:308-325`), `notifications.notification` (`tables.ts:37-90`) | Zapier e Make por um passo (documentado) | O sino e o e-mail de hoje, com tipos novos | embrulhado | — | não precisa | `builder/workflows/balloons/notify.ts` |
| O gatilho de horário | U3 | `mastra.schedules.create` sobre `conexus-automation-run` (`builder/automations/automations.ts:166-179`) | Mastra `mastra.schedules` (`dist/schedules/schedules.d.ts`), a id da execução por disparo | Uma agenda por versão ativa aponta direto a `wf-<id>-v<n>` | nativo | P12 | não precisa | `builder/workflows/schedule.ts` |
| O gatilho manual e o teste | U3 | o "Rodar agora" da Automação (`automations.ts:227-238`, `schedules.run`) | Mastra `createRun().start()` | Uma execução da versão ativa, ou de `wf-<id>-teste` sobre o rascunho | nativo | — | não precisa | `builder/workflows/runs.ts` |
| O gatilho declarado pelo conector | U4 | `Connector` com `writes` (`packages/connectors/src/kernel/definition.ts:28-51`, `:44`), `defineConnector` (`:62-87`) | Nango, activepieces, n8n, Pipedream, Composio e Airbyte: o conector declara, o workflow escolhe, o motor roda (o estudo de gatilhos, 1.1) | `Connector.triggers`, cada um com a leitura que olha, a chave do item e o cursor | embrulhado: o kit é nosso | — | `T1a` | `packages/connectors/src/kernel/trigger.ts` |
| O cursor e a caixa de eventos | U4 | nenhum | `@mastra/core@1.82.0`: a agenda não guarda cursor (`schedules/schedules.ts:111-112`; `workflows/scheduler/scheduler.ts:18-29`) e o mesmo `runId` roda duas vezes (a prova 6.2 do estudo de gatilhos); activepieces `polling/index.ts:38-141`; n8n `poll-cursor-hooks.ts:1-18` (o cursor só anda depois de dar certo) | `workflow_trigger` guarda o cursor e a saúde; `trigger_event` com `UNIQUE (trigger_id, item_key)` é a deduplicação; o cursor só anda depois de a leitura toda estar na caixa | remendo | `@mastra/core@1.82.0` lido e as provas 6.1 e 6.2 do estudo de gatilhos; critérios 23 e 24; [boundaries](../reference/boundaries.md), "the trigger remembers what it has seen" (a U4 reescreve a entrada) | `T1a`, `T2c`, `T8a`, e a aprovação desta página | `builder/workflows/trigger.ts`, `builder/workflows/trigger-tables.ts` |
| Uma admissão por gatilho de cada vez | U4 | nenhum `SKIP LOCKED` no servidor; o único `FOR UPDATE` é `builder/agents/publish.ts:351` | PostgreSQL 18 `SELECT … FOR NO KEY UPDATE SKIP LOCKED`; o estudo `T2`, 7 (`T2c`: a volta é a única que admite) | A admissão trava a linha do gatilho só enquanto grava os eventos e o cursor; a leitura no fornecedor fica fora da trava (D22) | nativo (do Postgres) | — | `T2c` | `builder/workflows/trigger.ts` |
| A cadência do gatilho | U4 | `cronOf` e `AUTOMATION_TIMEZONE` (`builder/automations/cadence.ts:4,22-39`) | Mastra `mastra.schedules` com `cron`; Pipedream 15 min (`constants.ts:1`), activepieces 5 min (o estudo de gatilhos, 5.5) | Uma agenda por gatilho, `schedule_look-<gatilho>`, com 5, 15, 30 ou 60 minutos | nativo | — | `T4`, e a lista pela aprovação desta página | `builder/workflows/trigger.ts` |
| O aviso ao dono quando a olhada falha | U4 | o aviso da Automação pausada (`hub/notifications/notifications.ts:308-325`) | nenhuma referência avisa (o estudo de gatilhos, 1.5) | Um aviso na passagem de "lendo" para "falhando", e outro na volta | embrulhado | — | `T6a` | `builder/workflows/trigger.ts` |
| A lista de execuções e cada balão aceso | U3, U6 | `builder/automations/runs.ts:76-190` | Mastra `listWorkflowRuns`, `getWorkflowRunById`, o retrato por passo gravado durante a execução; o Studio relê a cada 5 s até terminar (`playground-ui/.../use-persisted-workflow-run.ts:10-23`); n8n `execution-status.ts:1-12` | O estado de cada balão vem do retrato; a tela relê enquanto roda | nativo | P10 | não precisa | `builder/workflows/runs.ts` |
| Tentar de novo | U3 | nenhum | `run.timeTravel` (falha), `run.restart` (interrompida); activepieces `FROM_FAILED_STEP` na mesma versão | Retoma do balão, sem rodar os anteriores | nativo | P4, P6, P7, P8 | não precisa | `runs.ts` |
| Recusar | U3 | nenhum | `run.cancel()`; `agent.declineToolCall` é `resumeStream({ approved: false })`, uma chamada nova ao modelo (`packages/core/src/agent/agent.ts:11888-11900`), por isso não é usado | A decisão gravada e `run.cancel()`: a execução termina `canceled`, nada depois roda, o agente não é chamado | nativo | P6 | não precisa | `runs.ts` |
| Montar conversando | U5 | o Construtor monta agentes (`builder/construtor/tools.ts:104-238`), o rascunho ao lado (`apps/web/src/builder/agents/construtor-chat.tsx:57-140`) | Mastra Code `sdk/src/tools/workflows/create-workflow.ts:30-59`; activepieces `ap_build_flow` (`ap-build-flow.ts:47`); o estudo do Kiro do fundador, seção 1: um agente escreve contra um vocabulário fechado e conserta com os erros | O modelo grava o rascunho inteiro numa ferramenta que valida e devolve os problemas; ele conserta | embrulhado: as ferramentas do Construtor | — | não precisa | `builder/construtor/workflow-tools.ts` |
| O canvas: os balões, os caminhos, clicar, arrastar | U6 | nenhum; `apps/web` sem biblioteca de grafo (`apps/web/package.json:42-66`) | Mastra Studio `workflow-graph-canvas.tsx:91-124` (só leitura, `nodesDraggable=false` em `:100`) e os grupos atrás dos nós (`workflow-graph-groups.tsx`); activepieces `flow-canvas/index.tsx:215-258` (`@xyflow/react` 12.3.5, arranjo próprio, arrastar para encaixar; as arestas `ROUTER_START` e `ROUTER_END`, `flow-canvas/utils/types.ts:9-18`); Dify e Flowise em React Flow 11 | `@xyflow/react` (MIT) só na casca; arranjo puro e recursivo do Conexus; o "+" na ligação; arrastar para um encaixe | nativo de uma biblioteca nova | a prova de CSP é o primeiro passo da U6 (critério 28) | a decisão F | `apps/web/src/builder/workflows/canvas.tsx` e as peças da seção da U6 |
| O painel do balão: quem é, configuração, o que recebe, o que devolve, código | U6 | nenhum; `ui/code-block.tsx:4-7` (a caixa de código, sem cor) | n8n NDV `NodeDetailsView.vue:799-880` (os parâmetros do nó, a entrada e a saída); Mastra inspetor `workflow-data-inspector.tsx:13-34`; activepieces `step-settings/index.tsx` | Cinco partes, com os valores da execução quando há; o código é o balão no documento, só para ler | embrulhado (peças do `ui/`) | — | o painel, 2026-11-08 | `apps/web/src/builder/workflows/panel.tsx` |
| Quem monta, publica e responde | U1, U3 | `manageAutomations` (`hub/identity/admission.ts:23,103`); `agent: publishUnattendedWrite` (`hub/identity/roles.ts:37`) | Zapier e Dify escolhem quem aprova no passo; Copilot Studio e Agentforce: a autoridade é de quem montou | Quem ativa a versão responde por ela; cada execução e cada escrita reconferem; quem aprova é escolhido no balão | embrulhado | — | a decisão A | — |
| As Automações da 24.2 viram workflows | fica de fora (24.6.1, decisão G) | `builder/automations/run.ts`, `automations.ts`, `runs.ts`, `cadence.ts`, `release.ts` | P12; a conversão no boot (as notas de coesão do estudo, seção 5) | Cada linha de agenda vira um workflow com gatilho de horário e um balão Assistente | embrulhado | P12 | a decisão G | — |
| A lista de versões e "voltar a esta versão" | fica de fora (24.6.1): pede a tela de versões, e voltar passa pelas conferências de publicar e grava `active_by` | o agente: `versionBack` (`builder/agents/publish.ts:191-202`) e `makeActive` (`:264-270`) | activepieces `flow-versions-card.tsx:47,115`; Dify `version-history-panel` | Uma lista com o rascunho e as publicadas; voltar copia para o rascunho | embrulhado | — | — | — |
| **Ao mesmo tempo** e **Para cada** no canvas, e a execução por item | fica de fora (24.6.2) | nenhum | P14 (os eventos `workflow-step-progress` com `currentIndex`), P15 (`forEachIndex`) | O canvas com caixas e "2 de 3" | nativo | P14, P15 | "Base nasce completa" | — |
| **Esperar** e **Esperar até** | fica de fora (24.6.3) | nenhum | `@mastra/core@1.82.0` `sleep` é o relógio do processo e não acorda depois de um reinício (prova P15); o preparo do fluxo completo deixa duas opções | Uma espera durável, a escolher na 24.6.3 | embrulhado | P15 | "Base nasce completa" | — |
| O aviso de fora (webhook de conector) | fica de fora (20.2, `T7a`) | nenhum; S48 não tem tipo de acesso para ele | o estudo `T2`, 7 (`T2c`): o aviso só toca a campainha, e a olhada desta etapa é a que admite | A rota, a campainha `trigger_doorbell`, `listen.verify` e `listen.hint` | embrulhado | — | `T2c`, `T7a` | — |

O Kiro é citado pelo estudo do Kiro do fundador e pela seção dele, sem arquivo nem linha: o estudo
leu uma cópia que não é pública. Os números que vêm dele (50 balões, 3 gravações seguidas com
problema, o rótulo da execução) valem pela palavra do fundador ao aprovar a página. As linhas citadas do Mastra sem `dist/` são do `mastra@6e8dfcb8` (a etiqueta
`@mastra/core@1.82.0`), que só tem a fonte na estante; as com `dist/` são do pacote instalado em
`node_modules/@mastra/core`. As do activepieces estão em `f34c43cd`, as do n8n em `2e855356`, as do
Mastra Code e do playground-ui no mesmo `6e8dfcb8`. As provas P1 a P15 rodaram fora do repositório
com `@mastra/core` 1.82.0, `@mastra/pg` 1.35.0 e Postgres 18; as do estudo de gatilhos, em memória,
com o mesmo `@mastra/core`; o relatório de cada estudo guarda os scripts e as saídas.

**A medida do transplante.** Nada vem do produto antigo: ele não tinha workflows.

**A dívida** (o fechamento da etapa, e não este PR, faz as emendas):

- `docs/decisions/0058-provider-limits-and-queues.md:15` diz "With the webhooks step: a Postgres
  queue (pg-boss)"; o roteiro diz "Sai: o pg-boss" (`docs/roadmap.md:71`). Com a `T2c`, a fila é a
  campainha (20.2) e a caixa de eventos (esta etapa): duas tabelas, sem pg-boss. O fechamento emenda
  a 0058.
- A frase do estudo da 24.6 "sem webhook nem evento no Mastra" vira "sem gatilho de workflow por
  webhook; há webhook de agente (Channels, 24.7)". O fechamento emenda o estudo.
- `docs/architecture.md:215` diz que o Mastra lê a agenda a cada 10 s; a regra D27 diz que dorme
  até o próximo disparo. O fechamento acerta a arquitetura.
- Uma versão nunca é arquivada enquanto o workflow existe; com muitas edições, o início carrega
  mais definições. Gatilho: mais de 50 versões num workflow.
- Dentro de um caminho, a página mostra o estado de cada balão, mas a saída só do último (o Mastra
  guarda só o fim do workflow aninhado, prova P5 do estudo). Gatilho: um caminho com mais de um
  balão de leitura.
- A tela relê a execução a cada 5 s; um aviso ao vivo pediria o processo da execução (prova P10 do
  estudo). Gatilho: alguém reclamar do atraso.
- `notifications.notification` é alterada em vez de uma tabela ao lado, como `request_notice`
  (`hub/notifications/tables.ts:92-131`). A gravação da imagem anterior não quebra (a ordem dos dois
  PRs da U3), mas o sino da imagem anterior que encontre uma linha `WORKFLOW_*` recusa a lista até a
  imagem nova subir: essa janela de troca de imagem fica aceita. Gatilho: um sino da imagem anterior
  recusar a lista em produção.

**As notas da leitura para depois** (Issue futura da leitura de outro modelo, 2026-11-07, e da
releitura de 2026-11-08):

- I1. Publicar segura a linha do workflow `for update` enquanto `addDynamicWorkflows` valida e grava
  em `mastra_workflow_definitions`, dentro da transação do Hub (U1, a ordem do trabalho, passo 5).
  É limitado (nenhum terceiro, só o banco do Hub), e por isso fica dentro da regra D22; se um dia o
  Mastra chamar algo de fora ao gravar, a chamada passa para depois do `COMMIT`, com a passagem do
  início apagando a definição sem versão, como já faz. Também em "Parar se" da U1.
- I2. `waitingCount` e `lastRun` de `GET BASE?place=` custam uma leitura do Mastra por workflow (U3,
  "Os contratos"). Gatilho: um lugar com mais de 30 workflows. Uma execução cancelada sem decisão (o
  teste substituído, o workflow apagado) é `CANCELED`.
- I3. A U1 pega `workflow-ids.ts` da U2 por `cherry-pick` (seção "As unidades"). As duas regeneram
  o retrato do catálogo; a segunda a entrar o regenera.
- I4. A regra D11 pede a lista de permissões num PR próprio; a U1, a U3 e a U4 põem as permissões
  ao lado do código, como o passo 4 da skill `conexus-scope` deixa ("uma migração que muda o retrato
  do catálogo entra com a unidade dona de `database-grants.sql`"), e a palavra do fundador vem da
  aprovação desta página (a frase "a regra D11" na página).
- I5. O Mastra deixa a posse de uma execução mudar por variável de ambiente
  (`MASTRA_AGENT_THREAD_LEASE_TTL_MS`, 15 s por padrão, `dist/agent-BP9OWM6D.js:8284,8302`). A U3
  lê a mesma variável com o mesmo padrão para decidir `RUN_STILL_OWNED`, sem número próprio.
- I6. A volta dentro de um **Para cada** ou **Repetir**. A coluna `iteration` da decisão e o
  segmento da volta no aviso e na chave da escrita existem desde a U3, e valem `''` nesta etapa,
  porque nenhum contêiner publica (`BALLOON_KIND_LATER`). A retomada dá o índice (`forEachIndex`,
  prova P15), mas a ferramenta que roda dentro do corpo não o recebe (`dist/tools/types.d.ts` não
  tem `forEachIndex`): a 24.6.2 decide como o balão sabe a sua volta, e a 24.6.3 traz as voltas do
  **Repetir**.
- I7. A divisão G-a "tira ~3.000" linhas; a 24.6.2 (~1.500) e a 24.6.3 (~1.300) somam ~2.800. É
  arredondamento.
- I8. `D1`, `T3` e `T4` são decisões do fundador neste cartão e também ids de regras dos guias
  (`data.md` D1, `testing.md` T3 e T4). No texto, a decisão vem com a palavra "decisão" ou com a
  letra minúscula (`T4a`); a regra, com o guia.
- I9. "Esperando aprovação" não tem prazo (decisão D): uma execução suspensa segura a sua definição
  `wf-*` e a corrida suspensa do agente para sempre. A dívida das versões (acima) cobre as
  definições, não as execuções. Gatilho: o fundador pedir um prazo para esperar.

**O que fica por conferir no fim, com o Sankhya de verdade.** Os nomes dos campos do orçamento em
`CabecalhoNota` (o número da nota, o tipo de operação, a data de negociação, o valor, o cliente),
o filtro por número maior que o cursor junto com os tipos, e a ordem pelo número estão no dublê
como a documentação os dá; a gravação T26 da leitura nova, feita pelo fundador só lendo, confirma.
O Sankhya aceita 1.000 chamadas por minuto (o estudo de gatilhos, 5.5); uma olhada faz uma leitura
por página.

## U1 O workflow como dado

**Base e modelo.** `main` do dia com a 24.5.1 entrada. Sonnet: o contrato está fixo neste cartão,
e a compilação é uma função pura com as formas das provas P8, P14 e P15 do estudo, escritas abaixo.

### As linhas da tabela

- **O documento e as versões.** Modelo: `builder/agents/tables.ts:29-41` (`agent`, com `draft`,
  `revision`, `active_version` e `active_by` em `:39`), `:73-93` (`agent_version`: `published_by`
  em `:82`, `unique (agent_id, source_revision)` em `:93`), e `builder/agents/publish.ts:339-365`
  (`published`: a linha do agente `for update` em `:351`, `republished` em `:285-303` responde a
  versão de uma `source_revision` que já existe, `frozen` em `:306-332`).
- **Compilar.** API: `mastra.addDynamicWorkflows(defs)` (`dist/mastra/index.d.ts:2069`; o corpo em
  `dist/mastra-D4MXu5BN.js:4255-4297`): valida cada definição contra o registro vivo, ordena os
  aninhados, volta atrás se uma falha (`restoreRegistry`), e grava em
  `mastra_workflow_definitions` (`store.upsert`). Os campos da definição e as entradas:
  `dist/docs/references/reference-workflows-dynamic-workflow-definition.md`. O `mapping`: as fontes
  `value`, `template`, `initData` com `path`, `step` com `path`, uma por chave. A forma de cada
  contêiner é a das provas P14 e P15 (o preparo do fluxo completo, seção 0, as quatro regras).
- **Os problemas.** API: `validateDynamicWorkflow(def, index)`, de `@mastra/core/workflows`
  (`dist/workflows/dynamic/validate/index.d.ts:17`), devolve os problemas sem lançar; 16 códigos em
  `validate/types.d.ts:12`; o índice `WorkflowRegistryIndex` (`types.d.ts:71-76`) tem `tools` e
  `workflows` opcionais, e uma chave ausente não é conferida. O índice do Mastra é privado: o
  Conexus monta o seu com `inputSchema` e `outputSchema` de cada ferramenta registrada e as
  definições do mesmo pacote (prova P9 do estudo).
- **O papel de quem publica.** A 24.5.1: `speakerOf` em `hub/identity` (o papel lido agora) e
  `identity.mayUseEach` (`hub/identity/may-use.ts:71-95`); `mayLeaveAlone` em
  `hub/connectors/approval.ts` (a regra D1-a, que a 24.5.1 tira de `builder/agents/publish.ts:166-178`);
  `hub/connectors/publish-check.ts:34` (`ungrantedBy`). Nunca montar
  `{ kind: 'PERSON', role }` à mão: a 24.5.1 tirou as seis montagens.
- **O agente e o outro workflow fixados.** `builder/agents/public.ts:47-49` (`activeOf`) dá a
  versão ativa do agente no momento de publicar; a do outro workflow é `workflow.active_version`
  dele, lida na mesma transação.
- **Apagar uma definição.** `store.delete(id)` no domínio `workflowDefinitions`
  (`storage.getStore('workflowDefinitions')`, `dist/mastra-D4MXu5BN.js:4272`) e
  `mastra.removeWorkflow(id)` (`dist/mastra/index.d.ts:1986`).
- **Achar um workflow do Mastra.** Nunca `getWorkflow` nem `getWorkflowById`: o erro deles lista
  todas as ids registradas, de todas as empresas, o que a regra S40 proíbe; o Hub lê primeiro a
  sua linha (`workflow_version` na empresa da sessão ou do `requestContext`) e só então
  `mastra.listWorkflows()[id]`, que inclui as definições dinâmicas
  (`dist/mastra-D4MXu5BN.js:3912,4033`), como `builder/agents/registry.ts:48-63` faz com
  `listAgents()`. Um erro do Mastra vira uma `Failure` do Hub sem `details`.
- **As empresas no início.** O Hub não tem escopo de sistema; o início percorre as empresas por uma
  função `SECURITY DEFINER` de um papel que não entra, como `builder.companies_with_agents()`
  (`20261102160408_e243_agents_grants`, `builder/agents/frozen.ts:214`, o papel
  `hub_agent_companies` em `builder/agents/tables.ts:21`), e entra em cada uma com
  `{ kind: 'COMPANY', companyId, personId: null }` por `database.installation`, como
  `hub/apps/repair.ts:218-236`.
- **O gancho depois dos workers.** `Part` tem só `beforeWorkers?()`
  (`builder/mastra/hub-mastra.ts:35`), chamado em `start()` antes de `mastra.startWorkers()`
  (`:100-104`). O Mastra recarrega sozinho as definições guardadas em `startWorkers`
  (`#loadDynamicWorkflows`, `dist/mastra-D4MXu5BN.js:5175`): a U1 não recarrega nada, só apaga as
  sem versão, e para isso acrescenta `afterWorkers?()` a `Part`, chamado logo depois de
  `startWorkers()`.
- **As ferramentas no `Mastra`.** `createMastra` (`builder/mastra/mastra.ts:13-33`) e
  `createHubMastra` (`hub-mastra.ts:48-58`) não recebem `tools`; a U1 acrescenta
  `tools: Readonly<Record<string, Tool>>` aos dois e passa ao `new Mastra({ tools })`. O `Mastra` é
  feito depois das partes (`conversations-of.ts:165-176`): cada ferramenta pega as suas
  dependências por função, como `agents` pega `mastra: () => hub.mastra` (`conversations-of.ts:138`).
- **As operações.** `defineOperation` de `packages/hub-api/src/operation.ts`, como
  `packages/hub-api/src/agents.ts` (`createAgent` em `:206`, com `attemptKey` e 201;
  `saveAgentDraft` em `:232`, com `bodyLimit: 65_536`) e `automations.ts:144-215` (`HUB_UPDATING`
  em quem fala com o Mastra); a chave de tentativa pela 24.5.1 (`bodyHashOf` de
  `platform/attempt.ts`, C37); as rotas por `serve(app, operação, …)`, como
  `builder/automations/routes.ts:22`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/workflows.ts`, `workflow-operations.ts`, `workflow-api.ts`, `workflow-failures.ts`, `workflows.test.ts` | Cria (`workflow-api.ts` é só a porta para o índice, como `automation-api.ts`) | o servidor, a web |
| `packages/hub-api/src/failures.ts`, `index.ts` | Muda (espalha `WORKFLOW_FAILURES` ao lado de `AUTOMATION_FAILURES`; uma linha `export * from './workflow-api.ts'`) | todo o Hub |
| `packages/hub-api/src/workflow-ids.ts` | Pega da U2 por `cherry-pick`, sem mudar | — |
| `apps/server/src/builder/workflows/` | Cria `tables.ts`, `store.ts`, `ids.ts`, `compile.ts`, `index.ts`, `problems.ts`, `publish.ts`, `routes.ts`, `release.ts`, `boot.ts`, `public.ts`, `tools.ts` (as oito ferramentas: as ids, os esquemas, o corpo de `conexus-contar`) | `conversations-of.ts`, a U3, a U4, a U5 |
| `apps/server/src/builder/mastra/mastra.ts`, `hub-mastra.ts` | Muda (`tools` em `createMastra` e `createHubMastra`; `afterWorkers?()` em `Part`, chamado depois de `startWorkers()`) | `conversations-of.ts` |
| `apps/server/src/conversations-of.ts`, `apps/server/src/main.ts` | Muda (a parte dos workflows com as rotas e `afterWorkers`; as ferramentas no `createHubMastra`; os workflows no `releaseFirst`, `conversations-of.ts:169-174`; a lista de `part.routes(app)` em `main.ts:80-86`) | — |
| `apps/server/migrations/`, `apps/server/database-grants.sql` | Cria `<ts>_e246_workflow` e `<ts>_e246_workflow_grants` (com o papel `hub_workflow_companies` e a função `builder.companies_with_workflows()`) | o catálogo |
| `apps/server/src/platform/catalog.test.ts` | Muda (o retrato do catálogo) | — |
| `docs/reference/boundaries.md` | Muda (a entrada nova "a loop stops at its count"; a entrada "a published workflow version is its own workflow id", `:1246`, passa a citar `ids.ts`) | a revisão |

### Os contratos que a unidade cria

Em `packages/hub-api/src/workflows.ts` (as marcas vêm de `workflow-ids.ts`, da U2):

```ts
import { WorkflowId, BalloonId } from './workflow-ids.ts'

/** O limite do workflow, com fonte: o Kiro recusa mais de 50 passos (estudo do Kiro do fundador). Passar dele é um problema, não uma recusa. Conta os balões de todos os caminhos. */
export const BALLOONS_MAX = 50
/** Tetos do esquema, só contra um corpo absurdo (acima deles, REQUEST_MALFORMED); não são regras de produto. */
export const BALLOONS_SCHEMA_MAX = 200
export const BRANCH_MAX = 10           // caminhos de um Ao mesmo tempo
export const PEOPLE_MAX = 10
/** Um valor do gatilho ou de um balão anterior: '{{gatilho.valor}}', '{{b2.texto}}'. */
export const Template = z.string().max(2000)
export const Title = z.string().trim().min(1).max(80)
export const FieldName = z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/)

export const WorkflowPlace = z.discriminatedUnion('kind', [          // decisão H
  z.object({ kind: z.literal('COMPANY') }),
  z.object({ kind: z.literal('PROJECT'), projectId: ProjectId }),
])

/** A cadência de um gatilho de conector (`T4`): 15 por padrão, 5 no mínimo, a lista do estudo de gatilhos (`T4a`). */
export const TriggerEvery = z.union([z.literal(5), z.literal(15), z.literal(30), z.literal(60)])
export const Trigger = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('SCHEDULE'), cadence: Cadence }),        // Cadence de automations.ts
  z.object({ kind: z.literal('MANUAL') }),
  z.object({ kind: z.literal('CONNECTOR'), connectionId: ConnectionId.nullable(),
    trigger: TriggerKey.nullable(),            // a id que o kit declara ('orcamentoNovo'), U4
    input: z.record(z.string(), z.unknown()),  // conferido pelo esquema `input` do gatilho do kit, nos problemas
    everyMinutes: TriggerEvery.default(15) }),
])

/** Quem responde a um pedido (decisão A): por padrão quem ativou a versão que a execução roda (RunIdentity.answeredBy). */
export const Approver = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('ACTIVATED_BY') }),
  z.object({ kind: z.literal('PERSON'), personId: PersonId }),
])
export const AgentTarget = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('PUBLISHED'), agentId: AgentId }),
  z.object({ kind: z.literal('ASSISTANT'), connections: z.array(ConnectionId).max(CONNECTIONS_MAX) }),
])
/** O predicado do Mastra, só a forma que o Conexus usa: um campo de número do gatilho contra um número. */
export const Condition = z.object({ field: FieldName, op: z.enum(['gt', 'gte', 'lt', 'lte', 'eq', 'ne']),
  than: z.number().nullable() })

/** O tipo escrito à mão, porque a união é recursiva e z.infer não a deduz (a documentação de z.lazy do Zod 4). */
export type Balloon =
  | { kind: 'READ'; id: BalloonId; title: string; connectionId: ConnectionId | null; operation: OperationId | null; input: Record<string, string> }
  | { kind: 'AGENT'; id: BalloonId; title: string; agent: z.infer<typeof AgentTarget> | null; prompt: string; approver: z.infer<typeof Approver> }
  | { kind: 'APPROVAL'; id: BalloonId; title: string; approver: z.infer<typeof Approver>; question: string }
  | { kind: 'WRITE'; id: BalloonId; title: string; connectionId: ConnectionId | null; operation: OperationId | null;
      input: Record<string, string>; approval: 'ASK' | 'AUTO'; approver: z.infer<typeof Approver> }
  | { kind: 'NOTIFY'; id: BalloonId; title: string; people: PersonId[]; message: string }
  | { kind: 'USE'; id: BalloonId; title: string; workflowId: WorkflowId | null; input: Record<string, string> }
  | { kind: 'IF'; id: BalloonId; title: string; when: z.infer<typeof Condition>; then: Path; else: Path }
  | { kind: 'PARALLEL'; id: BalloonId; title: string; paths: Path[] }
  | { kind: 'FOREACH'; id: BalloonId; title: string; body: Path }
  | { kind: 'LOOP'; id: BalloonId; title: string; until: z.infer<typeof Condition>; max: number; body: Path }
export type Path = Balloon[]
const PathSchema: z.ZodType<Path> = z.lazy(() => z.array(Balloon).max(BALLOONS_SCHEMA_MAX))
export const Balloon: z.ZodType<Balloon> = z.lazy(() => z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('READ'), id: BalloonId, title: Title,
    connectionId: ConnectionId.nullable(), operation: OperationId.nullable(), input: z.record(z.string(), Template) }),
  z.object({ kind: z.literal('AGENT'), id: BalloonId, title: Title,
    agent: AgentTarget.nullable(), prompt: Template, approver: Approver }),
  z.object({ kind: z.literal('APPROVAL'), id: BalloonId, title: Title, approver: Approver, question: Template }),
  z.object({ kind: z.literal('WRITE'), id: BalloonId, title: Title,
    connectionId: ConnectionId.nullable(), operation: OperationId.nullable(),
    input: z.record(z.string(), Template), approval: z.enum(['ASK', 'AUTO']), approver: Approver }),
  z.object({ kind: z.literal('NOTIFY'), id: BalloonId, title: Title,
    people: z.array(PersonId).max(PEOPLE_MAX), message: Template }),
  /** Usar outro workflow: o que o outro lê do gatilho dele, campo a campo. */
  z.object({ kind: z.literal('USE'), id: BalloonId, title: Title,
    workflowId: WorkflowId.nullable(), input: z.record(FieldName, Template) }),
  z.object({ kind: z.literal('IF'), id: BalloonId, title: Title, when: Condition,
    then: PathSchema, else: PathSchema }),                               // "se sim" e "senão"
  z.object({ kind: z.literal('PARALLEL'), id: BalloonId, title: Title,
    paths: z.array(PathSchema).min(2).max(BRANCH_MAX) }),
  /** Para cada: a lista é a saída do balão logo antes, que tem de devolver uma (regra 7). */
  z.object({ kind: z.literal('FOREACH'), id: BalloonId, title: Title, body: PathSchema }),
  z.object({ kind: z.literal('LOOP'), id: BalloonId, title: Title,
    until: Condition, max: z.int().positive(), body: PathSchema }),
]))

/** O rascunho, como a pessoa e o Construtor o gravam: aceita um balão incompleto (o "+"). */
export const WorkflowDraft = z.object({ name: Title, trigger: Trigger, balloons: PathSchema })

export const WorkflowProblemCode = z.enum([
  // as regras do Conexus
  'NO_BALLOONS', 'WORKFLOW_TOO_MANY_BALLOONS', 'DUPLICATE_ID', 'BALLOON_INCOMPLETE', 'BALLOON_KIND_LATER',
  'TRIGGER_UNKNOWN', 'TRIGGER_INPUT_INVALID',
  'CONNECTION_NOT_OFFERED', 'OPERATION_UNKNOWN', 'OPERATION_WRONG_CLASS', 'OPERATION_NOT_IN_ROLE',
  'INPUT_FIELD_UNKNOWN', 'INPUT_FIELD_MISSING', 'INPUT_FIELD_INVALID',
  'REF_BALLOON_UNKNOWN', 'REF_NOT_BEFORE', 'REF_INSIDE_BRANCH', 'REF_FIELD_UNKNOWN',
  'AGENT_NOT_FOUND', 'AGENT_NOT_PUBLISHED', 'AGENT_OTHER_PROJECT', 'AGENT_IN_COMPANY',
  'USE_NOT_PUBLISHED', 'USE_ITSELF', 'USE_OTHER_PLACE', 'USE_INPUT_MISSING',
  'PERSON_NOT_FOUND', 'PERSON_CANNOT_APPROVE', 'IF_FIELD_NOT_NUMBER', 'IF_EMPTY',
  'FOREACH_NOT_A_LIST', 'REF_OUTSIDE_ITEM',
  'WRITE_AUTO_NOT_ALLOWED',
  // a validação do Mastra: três dos 16 códigos com nome próprio, todos os outros em GRAPH_OTHER
  'GRAPH_MISSING_REFERENCE', 'GRAPH_INCOMPATIBLE_SCHEMA', 'GRAPH_INVALID_MAP', 'GRAPH_OTHER',
])
export const WorkflowProblem = z.object({
  code: WorkflowProblemCode,
  severity: z.enum(['ERROR', 'WARNING']),        // ERROR bloqueia testar e publicar
  balloonId: BalloonId.nullable(),                // nulo: o gatilho ou o workflow inteiro
  path: z.string(),                               // 'balloons.3.then.0.input.codigo', ou 'graph:<caminho do Mastra>'
  message: z.string(),                            // a frase em português, com o título do balão
})

export const WorkflowState = z.enum(['ON', 'PAUSED', 'PAUSED_OWNER'])
/** A saúde do gatilho de conector (U4 escreve); nulo nos outros gatilhos. WAITING_FIRST: last_ok_at nulo (nunca olhou). */
export const TriggerHealth = z.object({
  state: z.enum(['WAITING_FIRST', 'READING', 'FAILING']),
  lastOkAt: z.iso.datetime().nullable(), failingSince: z.iso.datetime().nullable(),
  lastError: FailureCodeSchema.nullable(),
})
export const WorkflowView = z.object({
  id: WorkflowId, place: WorkflowPlace, name: z.string(),
  revision: z.int().nonnegative(),
  draft: WorkflowDraft.nullable(),
  problems: z.array(WorkflowProblem),             // recalculados a cada leitura
  published: z.object({ number: z.int().positive(), draft: WorkflowDraft,
    agents: z.array(z.object({ balloonId: BalloonId, agentId: AgentId, versionNumber: z.int().positive() })),
    uses: z.array(z.object({ balloonId: BalloonId, workflowId: WorkflowId, versionNumber: z.int().positive() })),
    publishedBy: PersonId.nullable(), publishedAt: z.iso.datetime() }).nullable(),
  activeBy: PersonId.nullable(),                  // quem ativou a versão ativa (workflow.active_by)
  changed: z.boolean(),                           // o rascunho difere da versão publicada
  state: WorkflowState,
  trigger: TriggerHealth.nullable(),
})
export const CreateWorkflowBody = z.object({ place: WorkflowPlace, draft: WorkflowDraft })
export const SaveDraftBody = z.object({ revision: z.int().nonnegative(), draft: WorkflowDraft })
export const PublishBody = z.object({ revision: z.int().nonnegative() })
```

`OperationId`, `ConnectionId`, `AgentId`, `PersonId`, `ProjectId`, `Cadence`, `CONNECTIONS_MAX` e o
esquema dos códigos de falha já existem em `packages/hub-api/src/`. `TriggerKey` é
`z.string().regex(/^[a-z][a-zA-Z0-9]{1,39}$/)`, a mesma forma de `OperationId`
(`packages/connectors/src/kernel/operation.ts:120-123`), escrita em `workflows.ts` porque o
`hub-api` não importa o kit; a U4 dá ao kit a mesma forma. O "+" do canvas e o Construtor gravam o
mesmo `WorkflowDraft`. Os limites: mais de `BALLOONS_MAX` balões, contando os de todos os caminhos e
os de um `USE` não (o outro workflow conta os seus), dá `WORKFLOW_TOO_MANY_BALLOONS` (`ERROR`) e o
rascunho grava. A profundidade não tem teto próprio: o `bodyLimit` de 65 536 bytes limita o corpo.
`BALLOON_KIND_LATER` (`ERROR`) marca um `PARALLEL`, um `FOREACH` e um `LOOP`: o documento e a
compilação os aceitam desde já, e o canvas, o Construtor e a publicação só na 24.6.2 e na 24.6.3,
que tiram esse problema.

`Approver.ACTIVATED_BY` é quem ativou a versão que a execução roda (`RunIdentity.answeredBy`): hoje
é quem publicou, e depois de "voltar a esta versão" (24.6.1) é quem voltou. O nome diz isso para
que a 24.6.1 não tenha de mudar o contrato.

**O balão de agente e o lugar.** Um agente mora sempre num Projeto (`project_id` não nulo,
`builder/agents/tables.ts:34`), e a conversa dele abre num escopo `InProject` (24.5). A decisão H
põe o workflow na empresa ou num Projeto. Por isso um `AGENT` com `PUBLISHED` só vale num workflow
de Projeto, com um agente desse Projeto: num workflow da empresa ele é o problema
`AGENT_IN_COMPANY` (`ERROR`), e num de outro Projeto, `AGENT_OTHER_PROJECT`. O `AGENT` com o
Assistente vale nos dois lugares, como a Automação da 24.2 no Início.

**O `mapConfig` guardado é inteiro.** O Mastra corta a 1.000 caracteres só o grafo de exibição: o
`truncate` de `dist/agent-BP9OWM6D.js:9744` só alimenta `serializedStepFlow` (`:9764`, `:9802`), que
vai ao `serializedStepGraph` do retrato. O que `addDynamicWorkflows` grava em
`mastra_workflow_definitions` é o `graph` da definição passada, normalizado sem corte
(`dist/mastra-D4MXu5BN.js:4220-4230`, `upsert` em `:4273-4283`). O `snapshot.ts` da U3 não lê
`serializedStepGraph`, e por isso o `Template` de 2.000 caracteres serve; o critério 38 faz a ida e
volta.

Em `apps/server/src/builder/workflows/`, os tipos internos:

```ts
// problems.ts: a única dona dos problemas; chamada ao gravar, ao ler, ao testar e ao publicar.
/** O rascunho sem nenhum problema ERROR, com todos os campos preenchidos: o único que se compila. */
export type ReadyDraft = Brand<WorkflowDraft, 'ReadyDraft'>
export type World = Readonly<{
  offered(place): Promise<readonly OfferedConnection[]>      // as ligações liberadas ao lugar, com o kit de cada uma
  triggersOf(connectorId): readonly KitTrigger[]             // [] até a U4
  agentsOf(place): Promise<readonly ActiveAgent[]>           // ativos, com a versão e o que escrevem
  workflowsOf(place): Promise<readonly UsableWorkflow[]>     // os do lugar com versão ativa e o frozen dela
  people(): Promise<readonly CompanyPerson[]>
  /** O adaptador do speakerOf(tx, companyId, personId) da 24.5.1, numa leitura da empresa do workflow. */
  speakerOf(personId: PersonId): Promise<PersonSpeaker | undefined>
  /** O adaptador do mayLeaveAlone da 24.5.1 (D1-a): true, ou false quando ele lança NOT_IN_ROLE. */
  mayLeaveAlone(personId: PersonId, write: WriteTarget & { slug: string }): Promise<boolean>
  registry: WorkflowRegistryIndex                            // o índice do Mastra, sem as definições do pacote
}>
export async function problemsOf(world: World, self: WorkflowId, draft: WorkflowDraft, publisher: PersonId):
  Promise<{ problems: WorkflowProblem[]; ready: ReadyDraft | null }>

// index.ts: o índice que validateDynamicWorkflow recebe.
export function registryIndexOf(mastra: Mastra, bundle: readonly DynamicWorkflowDefinition[]): WorkflowRegistryIndex

// ids.ts: a dona das ids do Mastra. Um segmento de caminho é '<balão>_<índice>':
// b4_0 é o "se sim" do b4, b4_1 o "senão", b5_2 o terceiro caminho de um Ao mesmo tempo,
// b6_0 o corpo de um Para cada ou Repetir, b7_0 o outro workflow de um USE.
export type PathStep = Readonly<{ balloon: BalloonId; index: number }>
export type MastraWorkflowId =
  | { kind: 'VERSION'; workflowId: WorkflowId; version: number; path: readonly PathStep[] }   // wf-<w>-v<n>[-b4_0[-b7_0…]]
  | { kind: 'TEST'; workflowId: WorkflowId; path: readonly PathStep[] }                       // wf-<w>-teste[-b4_0…]
export function parseMastraWorkflowId(raw: string): MastraWorkflowId | null
export function mastraWorkflowIdOf(id: MastraWorkflowId): string
/** O balão e a lista em que ele mora, achados pela id do Mastra no frozen; null se não existe. */
export function pathOf(frozen: FrozenWorkflow, path: readonly PathStep[]): FrozenPath | null

// compile.ts: sem I/O.
export type FrozenWorkflow = Readonly<{
  draft: ReadyDraft
  agents: ReadonlyArray<{ balloonId: BalloonId; agentId: AgentId; versionNumber: number }>
  /** O outro workflow de cada USE, copiado da versão fixada (o desenho, os agentes e os usos dele). */
  uses: ReadonlyArray<{ balloonId: BalloonId; workflowId: WorkflowId; versionNumber: number; frozen: FrozenWorkflow }>
  declared: ReadonlyArray<{ connectionId: ConnectionId; operation: OperationId }>  // leituras, a do gatilho e escritas, também as dos usos
}>
export function compiled(id: MastraWorkflowId, frozen: FrozenWorkflow, trigger: TriggerShape): DynamicWorkflowDefinition[] // os caminhos primeiro, o principal por último

// tools.ts: as ids.
export const WORKFLOW_TOOL = {
  check: 'conexus-conferir', read: 'conexus-ler', agent: 'conexus-agente', approval: 'conexus-aprovar',
  write: 'conexus-escrever', notify: 'conexus-avisar', count: 'conexus-contar',
  readMany: 'conexus-ler-lista',     // o READ de uma operação cuja saída é uma lista: devolve a lista crua (regra 7)
} as const
```

`World` é a porta e o adaptador: `problems.ts` não abre transação. `speakerOf` dá `undefined` só se
quem publica saiu entre a admissão e a leitura; então cada operação do rascunho dá
`OPERATION_NOT_IN_ROLE`. `mayLeaveAlone` é o da 24.5.1, que a U1 não refaz: o adaptador o chama com
o `WriteTarget` do `WRITE` em **Faz sozinho** e `slug` igual ao id do balão (o `slug` só vai ao
`details` do log), e `false` é o problema `WRITE_AUTO_NOT_ALLOWED`.

`TriggerShape` é o esquema da entrada da execução: o da linha que o gatilho do kit devolve num
`CONNECTOR` (U4; até ela, o problema `TRIGGER_UNKNOWN` impede de chegar à compilação), e `{}` no
`SCHEDULE` e no `MANUAL`. Ele diz que campo de `{{gatilho.campo}}` existe e qual é número
(`IF_FIELD_NOT_NUMBER`).

**A gramática da compilação** (a compilação é a única dona, C26; as formas são as das provas P8,
P13c, P14 e P15 do estudo, escritas aqui porque o construtor não lê os scripts do estudo).

O principal (`wf-<w>-v<n>`) e cada caminho (`wf-<w>-v<n>-<segmentos>`) são uma lista de entradas
de nível de cima. Para cada lista:

1. **O começo.** No principal, a primeira entrada é `{ type: 'tool', id: 'conferir', toolId:
   'conexus-conferir' }`, sem `mapping` antes: a ferramenta tem `inputSchema` e `outputSchema`
   `z.object({}).passthrough()` e devolve a entrada igual, e a validação não acusa
   `incompatible-schema` contra o `inputSchema` do gatilho (prova P13c). O caminho de um `USE`
   começa da mesma forma, com id `conferir` (a U3 faz a ferramenta, ali, só conferir que a versão
   fixada do outro ainda existe). Os outros caminhos não têm `conferir`.
2. **A entrada de cada lista.** O `inputSchema` do principal é o `TriggerShape`. O de um caminho
   leva os campos do gatilho que os balões do caminho (e os de dentro dele) usam, com o mesmo nome
   e o mesmo tipo, mais uma chave `<balão>_<campo>` (`b2_texto`) para cada saída de um balão de
   fora que eles usam, como texto. Assim `{{gatilho.<campo>}}` compila sempre para
   `${initData.<campo>}`, em qualquer profundidade.
3. **Um `mapping` antes de cada balão** (a regra 2 do preparo do fluxo completo, P15). Cada
   balão-folha `bN` vira `{ type: 'mapping', id: 'bN-in', mapConfig }` seguido da entrada do balão.
   O `mapConfig` tem `{ balloon: { value: 'bN' } }` e uma chave por valor que o balão usa: um
   `template` em que `{{gatilho.x}}` vira `${initData.x}`, `{{bJ.x}}` de um balão da mesma lista
   vira `${stepResults.bJ.x}`, e `{{bJ.x}}` de fora da lista vira `${initData.bJ_x}`. Um valor que é
   exatamente uma referência a um campo do gatilho compila para `{ initData: true, path: 'x' }`, e
   guarda o tipo. Nunca uma fonte `step` com `path`: o Mastra a confere contra o esquema de saída e a
   recusa (prova P8). O `mapping` depois de um `APPROVAL` é o mesmo: ele relê os valores, e por isso
   o balão tipado seguinte não recebe a saída genérica da aprovação. A única exceção é o `FOREACH`
   (regra 7).
4. **Os contêineres aceitam um passo por caminho e nunca um `mapping`** (a regra 1, P14
   `invalid-map-placement`). Cada caminho é sempre um workflow aninhado, mesmo com um balão só, e a
   entrada do contêiner é `{ type: 'workflow', id: '<segmento>', workflowId: '<id do caminho>' }`.
   Antes do contêiner vem um `mapping` `bK-in` que monta a entrada do caminho (a regra 2), salvo
   antes de um `foreach` (regra 7). A compilação nunca põe um `parallel` direto dentro de outro (P14: o validador cai com `TypeError`).
5. **O Se** `bK`: `{ type: 'conditional', id: 'bK', steps: [<bK_0>, <bK_1>], predicates: [P,
   { op: 'not', arg: P }] }`, com `P = { op, left: { path: 'inputData.<campo>' }, right: { literal:
   than } }` (a regra 3, P14: o `conditional` roda todos os ramos verdadeiros, e a negação faz rodar
   um só). Um caminho vazio ("senão" sem balão) não entra no `conditional`: ele fica com um passo e
   um predicado. `IF_EMPTY` é o "se sim" vazio. O passo que **Tentar de novo** passa ao Mastra para
   um balão de dentro do caminho é o segmento de fora (`bK_0`), como na prova P8.
6. **Ao mesmo tempo** `bK`: `{ type: 'parallel', id: 'bK', steps: [<bK_0>, …] }` (P14, P15).
7. **Para cada** `bK`: `{ type: 'foreach', id: 'bK', step: { type: 'workflow', id: 'bK_0',
   workflowId: '<id do caminho do item>' } }`, sem `opts` (a concorrência padrão do Mastra é 1,
   P14), posto logo depois da entrada da folha do balão de antes, sem `mapping` `bK-in` entre os
   dois. A entrada de um `foreach` é a lista crua que o passo de antes devolveu (P14 recusa um
   `mapping` antes, "Foreach input must be a raw array"); é a forma de P14 `p14-lane` (uma ferramenta
   que devolve uma lista, seguida direto do `foreach`), e P15 `p15-foreach` roda o mesmo com o corpo
   num workflow aninhado. Por isso o balão de antes tem de devolver uma lista: hoje, só um `READ` de
   muitas linhas (abaixo, as saídas). Qualquer outro, ou nenhum (o `FOREACH` no começo da lista), é
   o problema `FOREACH_NOT_A_LIST` (`ERROR`). O `mapping` do item fica no começo do workflow do
   item, onde um `mapping` de nível de cima é aceito (P15 `p15-body`): o `inputSchema` do caminho do
   item é o de uma linha da lista (`{ type: 'object' }`), um valor `{{item.<campo>}}` dentro do corpo
   compila para `${initData.<campo>}`, e um `{{gatilho.x}}` ou `{{bJ.x}}` de fora do **Para cada**
   dentro do corpo é o problema `REF_OUTSIDE_ITEM` (`ERROR`): o `foreach` passa ao corpo só o item, e
   o que mais o corpo lê de fora é da 24.6.2.
8. **Repetir** `bK`: um `mapping` `bK-in` com `volta: { value: 0 }` e a entrada do corpo; depois
   `{ type: 'loop', id: 'bK', loopType: 'dountil', step: <bK_0>, predicate: <until> }`. O corpo
   `bK_0` termina sempre com `{ type: 'tool', id: 'bK-contar', toolId: 'conexus-contar' }` (P14: o
   `loop` não tem teto, e o predicado não lê um contador).
9. **Usar outro workflow** `bK`: o `frozen` do outro, copiado em `uses` ao publicar, compila como o
   caminho `bK_0` desta versão, com o começo `conferir` da regra 1 e sem nenhuma referência a uma
   definição do outro workflow no Mastra. Assim a versão é inteira: o outro pode publicar, pausar
   ou ser apagado sem mexer na definição desta. Os `{{gatilho.x}}` de dentro do outro leem o
   `input` do `USE` pela regra 2.
10. **O fim.** O principal e cada caminho têm `outputSchema: {}` quando o último balão devolve uma
    lista (um `READ` de muitas linhas ou um `FOREACH`), e `{ type: 'object' }` nos outros (a regra 4,
    P15: um `foreach` cujo workflow tem `outputSchema` objeto é recusado, porque a saída é uma
    lista).

As saídas por espécie, que `REF_FIELD_UNKNOWN` confere e as ferramentas da U3 declaram: `READ`
`{ resultado }`; o `READ` de muitas linhas (uma operação cujo esquema `output` no kit é uma lista,
`z.array`) compila para `conexus-ler-lista` e devolve a lista crua das linhas, sem `{ resultado }`,
porque o `foreach` só aceita a lista crua (P14, "Foreach input must be a raw array"); `AGENT` `{ texto, conversationId }`, `APPROVAL` `{ aprovado, por }`, `WRITE`
`{ resultado, marca }`, `NOTIFY` `{ avisados }`, `USE` a saída do último balão do outro (P5: o
Mastra guarda só o fim do workflow aninhado), `IF` a saída do caminho que rodou, lida com
`{ step: ['bK_0', 'bK_1'] }` (P14), `FOREACH` a lista das saídas do corpo, na ordem da entrada
(P14), `LOOP` `{ volta }`. Um balão depois de um contêiner que usa a
saída de um balão de dentro dele recebe `REF_INSIDE_BRANCH`.

**As oito ferramentas** entram no `new Mastra({ tools })` com as ids de `WORKFLOW_TOOL`;
`conexus-conferir` com os esquemas `passthrough` de cima; `conexus-contar` com `inputSchema`
`z.object({ balloon: z.string(), volta: z.int().nonnegative() }).passthrough()`, `outputSchema` igual,
e o corpo já nesta unidade: acha o `LOOP` pela id do Mastra, soma 1 a `volta` e lança
`Failure('WORKFLOW_LOOP_LIMIT')` quando `volta` passa de `max`; `conexus-ler-lista` com o mesmo
`inputSchema` de `conexus-ler` e o `outputSchema` `z.array(z.record(z.string(), z.unknown()))`, a
forma de `p14-lines`; as outras cinco com o `inputSchema`
`z.object({ balloon: z.string() }).catchall(z.unknown())`, o `outputSchema` da espécie, e um
`execute` que lança `Failure('INTERNAL_UNEXPECTED')` até a U3. Os testes da U1 trocam o `execute`
delas por um que devolve a entrada.

**As operações** (`packages/hub-api/src/workflow-operations.ts`, `defineOperation`, `access:
'session'`; `BASE` = `/api/companies/{companyId}/workflows`; a admissão é `manageAutomations`, a
empresa e a pessoa vêm da sessão, S9; um `{w}` de outra empresa, de um Projeto sem acesso ou
desconhecido responde `WORKFLOW_NOT_FOUND`, lido na linha do Hub antes de qualquer chamada ao
Mastra). `READ_FAILURES` e `ONE_FAILURES` como em `automations.ts:136-142`, com
`WORKFLOW_NOT_FOUND`:

| id | Método e caminho | `bodyLimit` | Entrada | Sucesso | Falhas além das de leitura |
| --- | --- | --- | --- | --- | --- |
| `createWorkflow` | `POST BASE`, `attemptKey: true` | 65_536 | `CreateWorkflowBody` | 201 `{ workflow: WorkflowView }` | `REQUEST_MALFORMED`, `IDEMPOTENCY_CONFLICT`, `NOT_IN_ROLE` |
| `getWorkflow` | `GET BASE/{w}` | 1024 | — | 200 `{ workflow: WorkflowView }` | — |
| `saveWorkflowDraft` | `PUT BASE/{w}/draft` | 65_536 | `SaveDraftBody` | 200 `{ workflow: WorkflowView }` | `REQUEST_MALFORMED`, `WORKFLOW_DRAFT_STALE`, `NOT_IN_ROLE` |
| `publishWorkflow` | `POST BASE/{w}/publish` | 1024 | `PublishBody` | 200 `{ workflow: WorkflowView }` | `WORKFLOW_HAS_PROBLEMS`, `WORKFLOW_DRAFT_STALE`, `NOT_IN_ROLE`, `WORKFLOW_PUBLISH_REFUSED`, `AUTOMATION_LIMIT`, `HUB_UPDATING` |
| `deleteWorkflow` | `DELETE BASE/{w}` | 1024 | — | 204 | `HUB_UPDATING` |

`WORKFLOW_FAILURES` em `packages/hub-api/src/workflow-failures.ts`, cada um com `category`,
`settles`, `status`, `phrase`, `action` e `actionKind`, como `automation-failures.ts` (todos com
`settles: true`, como lá; a categoria é `USER` salvo onde a tabela diz). As frases seguem as de
`automation-failures.ts` e vão ao fundador com os textos das telas, no fim:

| Código | `status` | `phrase` | `action` | `actionKind` |
| --- | --- | --- | --- | --- |
| `WORKFLOW_NOT_FOUND` | 404 | "Não encontramos este workflow." | "Volte às automações." | `INITIAL` |
| `WORKFLOW_DRAFT_STALE` | 409 | "O rascunho mudou." | "Veja de novo." | `RETRY` |
| `WORKFLOW_HAS_PROBLEMS` | 409 | "O workflow tem pontos a resolver." | "Resolva os pontos marcados." | `NONE` |
| `WORKFLOW_PUBLISH_REFUSED` | 500, `SYSTEM` | "Não foi possível publicar o workflow." | "Tente de novo." | `RETRY` |
| `WORKFLOW_NOT_PUBLISHED` | 409 | "Este workflow ainda não foi publicado." | "Publique antes de rodar." | `NONE` |
| `WORKFLOW_PAUSED` | 409 | "Este workflow está pausado." | "Religue para rodar." | `NONE` |
| `WORKFLOW_OWNER_CANNOT_RUN` | 409 | "Quem publicou não pode mais rodar este workflow." | "Publique de novo com o seu papel." | `NONE` |
| `WORKFLOW_TRIGGER_FAILED` | 502, `THIRD_PARTY` | "A última olhada no sistema falhou." | "O Conexus olha de novo na próxima vez." | `NONE` |
| `WORKFLOW_TEST_NO_ITEM` | 409 | "Não há nenhum item para testar." | "Lance um item no sistema e teste de novo." | `NONE` |
| `WORKFLOW_TEST_STOPPED_AT_WRITE` | 409 | "O teste parou antes de escrever." | "Publique para escrever de verdade." | `NONE` |
| `WORKFLOW_LOOP_LIMIT` | 409 | "O Repetir chegou ao número de voltas." | "Mude o número com o Construtor." | `NONE` |
| `BALLOON_SYSTEM_REFUSED` | 502, `THIRD_PARTY` | "O sistema recusou o pedido." | "Tente de novo." | `RETRY` |
| `BALLOON_SYSTEM_UNREACHABLE` | 502, `THIRD_PARTY` | "O sistema não respondeu." | "Tente de novo." | `RETRY` |
| `RUN_NOT_FOUND` | 404 | "Não encontramos esta execução." | "Volte ao workflow." | `INITIAL` |
| `RUN_NOT_WAITING` | 409 | "Este pedido já foi respondido." | "Veja a execução." | `NONE` |
| `NOT_APPROVER` | 403 | "Este pedido espera a aprovação de outra pessoa." | "Avise quem aprova." | `NONE` |
| `RUN_NOT_FAILED` | 409 | "Esta execução não falhou." | "Veja a execução." | `NONE` |
| `RUN_STILL_OWNED` | 409 | "A execução ainda está terminando." | "Tente de novo em alguns segundos." | `RETRY` |

`AGENT_NOT_FOUND`, `NOT_IN_ROLE`, `CONNECTOR_NOT_GRANTED`, `CONNECTION_SIGN_IN_EXPIRED`,
`CONNECTION_CREDENTIAL_INVALID`, `IDEMPOTENCY_CONFLICT`, `REQUEST_MALFORMED`, `INTERRUPTED`,
`DATABASE_UNAVAILABLE`, `INTERNAL_UNEXPECTED`, `HUB_UPDATING` e `AUTOMATION_LIMIT` já existem e são
reusados com as suas frases.

`WorkflowFailureCode`, em `workflows.ts`, é a lista fechada (C21) do que um balão ou `conferir`
lança: o que `RunView.balloons[].failure` mostra e o que o `CHECK` `notification_workflow_failed`
aceita (U3). Um código fora dela vira `INTERNAL_UNEXPECTED`, como `builder/automations/run.ts:66-71` faz na 24.2:

```ts
export const WorkflowFailureCode = z.enum([
  // os novos
  'WORKFLOW_NOT_FOUND', 'WORKFLOW_OWNER_CANNOT_RUN', 'WORKFLOW_LOOP_LIMIT', 'WORKFLOW_TEST_STOPPED_AT_WRITE',
  'BALLOON_SYSTEM_REFUSED', 'BALLOON_SYSTEM_UNREACHABLE',
  // os do funil (a tabela de respostas da U3) e da entrada
  'NOT_IN_ROLE', 'CONNECTOR_NOT_GRANTED', 'CONNECTION_SIGN_IN_EXPIRED', 'CONNECTION_CREDENTIAL_INVALID',
  'IDEMPOTENCY_CONFLICT', 'REQUEST_MALFORMED', 'AGENT_NOT_FOUND',
  // os do turno do agente, os mesmos de AutomationFailureCode (automations.ts:58-70)
  'MODEL_NO_ACCOUNT', 'MODEL_CALL_FAILED', 'MODEL_REFUSED', 'MODEL_ANSWER_CUT',
  'MACHINE_UNAVAILABLE', 'MACHINE_LOST', 'HUB_UPDATED', 'INTERRUPTED',
  'DATABASE_UNAVAILABLE', 'INTERNAL_UNEXPECTED',
] as const satisfies readonly FailureCode[])
```

**Tabelas** (esquema `builder`, `company_id` e a política de linha como as do agente, D11):

- `workflow(id uuid pk, company_id text not null fk company on delete cascade, project_id text null
  fk project on delete cascade, name text not null, draft jsonb null, revision int not null default
  0, test_draft jsonb null, state text not null default 'ON' check in ('ON','PAUSED','PAUSED_OWNER'),
  active_version int null, active_by text null, created_by text null, created_at timestamptz not
  null default now())`; `project_id` nulo é a empresa; `test_draft` é escrito pela U3; `active_by`
  e `created_by` ficam nulos quando a pessoa sai; um `CHECK` exige `active_by` nulo quando
  `active_version` é nulo.
- `workflow_version(workflow_id uuid fk workflow on delete cascade, company_id text not null,
  number int not null, frozen jsonb not null, source_revision int not null, published_by text null,
  published_at timestamptz not null, primary key (workflow_id, number), unique (workflow_id,
  source_revision))`.
- Lidos de volta, `draft` passa por `WorkflowDraft.parse` e `frozen` pelo esquema de
  `FrozenWorkflow` (C27).
- Permissões, na migração `e246_workflow_grants` e no espelho `database-grants.sql`, coluna a
  coluna como `20261107125733_e245_connector_write_grants`: `workflow` com `SELECT, INSERT,
  DELETE` e `UPDATE (name, draft, revision, test_draft, state, active_version, active_by,
  created_by)`; `workflow_version` com `SELECT, INSERT` e `UPDATE (published_by)`.
- A lista das empresas para o início, com os passos de `20261102160408_e243_agents_grants`: o papel
  `hub_workflow_companies` (`NOLOGIN`, `NOBYPASSRLS`), a política `workflow_companies_select` em
  `builder.workflow` para ele (`USING (true)`, gerada de `tables.ts` como `AGENT_COMPANIES`),
  `GRANT SELECT (company_id)` em `builder.workflow`, e a função
  `builder.companies_with_workflows() RETURNS TABLE (company_id text)`, `SECURITY DEFINER`, dona
  `hub_workflow_companies`, `EXECUTE` só para `hub_runtime`.

**O dono de cada fato.** O desenho publicado: `workflow_version.frozen` (o Mastra guarda a
compilação, nunca o desenho). Quem ativou a versão ativa: `workflow.active_by`, escrito com
`active_version` no mesmo `UPDATE`. A classe de cada operação: o kit. As ids do Mastra: `ids.ts`.
Os problemas: `problems.ts`. O modelo: `builder/agents/tables.ts` e `builder/agents/publish.ts`.

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/server/src/builder` (`@mastra/core`,
`@mastra/pg`: a skill `mastra`, com `node_modules/@mastra/core/dist/docs/` primeiro), para
`apps/server/src` (`fastify`: `fastify-best-practices`; `drizzle-orm`: `orm.drizzle.team/llms.txt`)
e para `apps/server` (`drizzle-kit`). Para a união recursiva e as marcas, `typescript-magician` e a
documentação de `z.lazy` do Zod 4 instalado.

### A ordem do trabalho

1. `cherry-pick` do commit da U2 que cria `packages/hub-api/src/workflow-ids.ts`. O contrato e as
   falhas em `hub-api`, com o teste de esquema (o recursivo, a cadência). Regras: C21, C23, C27,
   C28, C51.
2. `tables.ts` e `npm run generate` para `<ts>_e246_workflow`; a migração de permissões à mão e o
   espelho em `database-grants.sql` (D11); `npm run migrations`.
3. `ids.ts` e `compile.ts`, puros, com o teste de mesa contra as formas de P8, P14 e P15
   (critério 38), e `conexus-contar` (critério 39). O pseudocódigo da compilação de uma lista:

   ```text
   compileList(lista, contexto) -> entradas, caminhos
     entradas = contexto.começo        // [conferir] no principal e no caminho de um USE; [] nos outros
     para cada balão b em lista:
       se b é folha:      entradas += mapping(b.id + '-in', valores de b, contexto) + entrada da espécie de b
       se b é IF:         entradas += mapping(b.id + '-in', entrada dos caminhos) + conditional(b, [b_0, b_1 não vazio])
       se b é PARALLEL:   entradas += mapping(...) + parallel(b, b_0..b_k)
       se b é FOREACH:    entradas += foreach(b, b_0 = workflow do item, que começa pelo mapping do item)
                          // sem mapping antes: logo depois da folha anterior, que devolve uma lista (regra 7)
       se b é LOOP:       entradas += mapping(..., volta: 0) + loop(b, b_0 com contar no fim, until)
       se b é USE:        entradas += mapping(b.id + '-in', b.input) + workflow(b_0 = frozen do outro)
       cada caminho filho = compileList(filho, contexto do filho) com id = id de fora + '-' + segmento
     outputSchema = {} se o último balão devolve uma lista, senão { type: 'object' }
   ```

4. `index.ts` e `problems.ts`: primeiro as regras puras (as ids únicas em todo o documento, as
   referências pela ordem e pelo lugar, os campos do gatilho); depois as do mundo atrás da porta
   `World`; por fim, para um rascunho sem problema do Conexus, compilar e chamar
   `validateDynamicWorkflow(def, registryIndexOf(mastra, bundle))` para cada definição e traduzir
   cada problema do Mastra (o balão vem da id da entrada: `bN-in`, `bN`, `bN-contar` e os
   segmentos `bN_<i>` são de `bN`; `conferir` é nulo; o caminho é `graph:<path>`; uma frase por
   código).
5. `publish.ts`: `admitted(..., 'manageAutomations')`; a linha do workflow `for update`;
   `problemsOf` com quem publica; qualquer `ERROR` responde `WORKFLOW_HAS_PROBLEMS`; a mesma
   `source_revision` responde a versão que existe; senão, o `frozen` (os agentes por `activeOf`, os
   usos pela versão ativa de cada um, copiada, e o declarado de tudo), o `INSERT` da versão, o
   `UPDATE workflow SET active_version, active_by` e, antes do `COMMIT`,
   `addDynamicWorkflows(compiled(...))`; recusado, a transação volta e responde
   `WORKFLOW_PUBLISH_REFUSED`. Regras: D22 (nada de terceiro dentro da transação; a nota I1).
6. `tools.ts`, o registro em `mastra.ts` e `hub-mastra.ts`; `afterWorkers?()` em `Part`; `boot.ts`,
   chamado por ele: apagar as definições `wf-*` (fora `wf-*-teste*`) sem versão no Hub, empresa por
   empresa pela lista de `builder.companies_with_workflows()`; uma empresa que falha é logada e fica
   para o próximo início, como `repairApps`.
7. `routes.ts` (as operações por `serve`; cada uma lê a linha do Hub antes do Mastra, e acha a
   definição só por `listWorkflows()`), `release.ts` (apagar as definições de um workflow, de um
   Projeto, de uma empresa), e a parte em `conversations-of.ts` e `main.ts`. Regras: S40, C51.
8. As entradas de `boundaries.md`. Regra: C75. A entrada "a published workflow version is its own
   workflow id" (`:1246`) passa a citar `ids.ts`. A entrada nova, depois dela, com este texto:

   ```text
   ## Mastra 1.82.0: a loop stops at its count (step 24.6)

   - **Library line.** At `@mastra/core` 1.82.0 a dynamic `loop` entry (`dowhile`, `dountil`) has
     no cap of its own, and its predicate cannot read a counter (a predicate on `requestContext` is
     refused with `invalid-predicate-reference`). In the step 24.6 study's P14, an always-true
     `dowhile` ran until its body tool threw at round 50.
   - **Hand-made piece.** The tool `conexus-contar` ends every compiled Repetir body
     (`apps/server/src/builder/workflows/compile.ts`, `tools.ts`): it carries the round in the data
     and throws `WORKFLOW_LOOP_LIMIT` past the balloon's `max`.
   - **Why.** "No máximo N vezes" must stop the run at N, on the balloon that said it.
   - **Proof.** The study's P14 (`p14-runaway`); the card's criterion 39. Founder's word: the
     approval of the step 24.6 card.
     Revisit when Mastra's `loop` takes a maximum.
   ```

### Como se prova

Critérios 1 a 5, 38 e 39, pelo servidor de verdade (`hubBeside`) com o dublê do Sankhya; o critério
5 abre um segundo Hub ao lado do mesmo banco. O critério 2 falha hoje porque não há `problems.ts`;
o 38, porque não há `compile.ts`.

### Parar se

- `addDynamicWorkflows` recusar uma ferramenta registrada no `new Mastra({ tools })`: relatar com a
  saída; não registrar por fora.
- O predicado `{ op: 'not', arg }` sobre um campo que veio do `mapping` como número não rodar um só
  caminho, como rodou na prova P14: relatar; não escrever uma comparação nossa.
- O caminho de um `USE` que começa com `conferir` não passar na validação, ou o `input` do `USE`
  para um campo de número do gatilho do outro chegar como texto e o Mastra recusar
  (`incompatible-schema`): relatar com a saída; não achatar o outro workflow num caminho sem
  `conferir`.
- `addDynamicWorkflows` não puder rodar dentro da transação do Hub (outra conexão do Mastra ao
  mesmo banco espera a transação), ou chamar algo fora do banco ao gravar (D22, a nota I1):
  relatar; a ordem muda só com o cartão.
- `validateDynamicWorkflow` não estiver exportado no 1.82 instalado, ou o seu índice pedir o que as
  ferramentas não dão: relatar com a saída.
- O teto de um **Repetir**: `max` é só um inteiro positivo, sem teto e sem valor padrão, porque
  nenhum dos dois tem fonte (o preparo do fluxo completo: "O número padrão ainda não tem fonte").
  O `LOOP` fica com `BALLOON_KIND_LATER` nesta etapa; a 24.6.3 traz o número ao fundador. Não pôr
  um teto nem um padrão no esquema.

## U2 O workflow como terceiro autor

**Base e modelo.** `main` do dia com a 24.5.1 entrada; a unidade não começa antes. Sonnet: a 24.5.1
já pôs a regra num dono só (`hub/connectors/approval.ts`); esta unidade acrescenta um braço a duas
uniões, troca a chave de uma escrita por `where` e `callKey`, e acrescenta uma leitura ao registro.

### As linhas da tabela

- **A regra.** A 24.5.1, em `hub/connectors/approval.ts`: `mustAsk(deps, { companyId, choice,
  author, scope, threadId, target })`, `mayApprove`, `answererLeavesAlone(deps, companyId,
  answeredBy, target)`, `WriteAuthorOf` (`DRAFT` ou `PUBLISHED` com `answeredBy`), `WriteTarget`,
  `ApprovalDeps`, exportados por `hub/connectors/public.ts`. O corpo de `mustAsk` é o do cartão da
  24.5.1 (a sua U2, passo 3): `CHOSEN`, depois `PUBLISHER_LOST_RIGHT`, depois `OPEN_WRITE` pela
  porta `openWrites` com `threadId`.
- **O registro.** `hub/connectors/tables.ts:205-247` (a chave `(company_id, thread_id,
  tool_call_id)` em `:239`, o `CHECK` `connector_write_speaker` em `:240-243`); em
  `write-record.ts`: `WriteRequest` (`:30`), `Written` (`:53`), `markOf(threadId, toolCallId)`
  (`:67`), `authorOf` e `aboutOf` (`:101`, `:108`), `foundIn` (`:131`, a resposta guardada de uma
  linha `DONE` ou `REFUSED`), `key` (`:137`), `ownRow` (`:146`), `inserted` (`:161`), `heldBy`
  (`:198`), `register` com o `transactionLock` (`:222-241`), `OpenWritesKey` (`:253`), `openRows`
  (`:265`), `openWritesOf` (`:298`), `finish` (`:306`); `write.ts:154-183` (a marca em `:160`). A
  porta `openWrites`: `hub/connectors/assistant-port.ts:63,312` e `apps/server/src/conversations-of.ts:43`.
- **Quem fala.** `hub/identity/may-use.ts:22-27` (`Speaker`), `:64-68` (`declares`), `:76` (o autor
  que não é pessoa só confere o declarado); `hub/connectors/speaking.ts:96` (o outro corte por
  `kind === 'VERSION'`); `hub/connectors/scope.ts:9-19` (`SessionScope`, com `agentVersion?` em
  `:18`); `assistant-port.ts:117` (`mayAsk` devolve `scope.agentVersion ?? PERSON`). Quem preenche
  `agentVersion`: `builder/agents/agent.ts:203`; quem lê: `builder/agents/tools.ts:107`,
  `assistant-port.ts:117`, e os testes de `hub/connectors/role-doors.test.ts`.
- **A escrita do agente.** `builder/agents/tools.ts:148-152`: o `execute` exige `agent.threadId` e
  monta a chave com a conversa e o `toolCallId` (`:153-157`). Dentro de um balão de agente, a
  conversa existe (é a que o balão abre, U3), então a escrita grava hoje no livro da conversa, e
  uma tentativa nova do balão abre outra conversa e não vê a escrita aberta da anterior (a leitura
  do caminho de escrita, M7). Com `conexus.run.call` no `requestContext`, ela grava no livro da
  execução.
- **A migração.** `scripts/check-migrations.ts:16,51`: um `DROP` sem a linha `-- contract:` é
  recusado; trocar um `CHECK` é `DROP CONSTRAINT` e `ADD CONSTRAINT`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/workflow-ids.ts`, `index.ts` | Cria; exporta | a U1, o servidor, a web |
| `apps/server/src/hub/connectors/approval.ts` | Muda (`where` no lugar de `threadId` em `mustAsk`; o autor `WORKFLOW` não muda `WriteAuthorOf`, que já tem `PUBLISHED` com `answeredBy`) | `builder/agents/`, a U3 |
| `apps/server/src/hub/connectors/write-record.ts`, `write.ts`, `tables.ts`, `assistant-port.ts`, `scope.ts`, `speaking.ts`, `public.ts` | Muda (`where`, `callKey`, `earlierAttempt`, o autor `WORKFLOW`, `speaksAs`, as colunas, o `CHECK`) | `builder/agents/`, `conversations-of.ts`, a U3 |
| `apps/server/src/conversations-of.ts` | Muda (`openWrites` com o `OpenWritesKey` novo, `:43`) | `main.ts` |
| `apps/server/src/hub/identity/may-use.ts`, `public.ts` | Muda (o braço `WORKFLOW` de `Speaker`) | `hub/connectors/` |
| `apps/server/src/builder/agents/tools.ts`, `agent.ts`, `conversation-routes.ts` | Muda (`where: CONVERSATION` ou `RUN`; `speaksAs`; `RUN_CALL_KEY`) | o controlador do agente, a U3 |
| `apps/server/src/hub/connectors/*.test.ts`, `builder/agents/*.test.ts` que chamam `markOf` ou `OpenWritesKey` | Muda (os argumentos novos) | — |
| `apps/server/migrations/` | Cria `<ts>_e246_connector_write_workflow` | o catálogo |
| `apps/server/src/platform/catalog.test.ts` | Muda (o retrato do catálogo) | — |

`database-grants.sql` não muda: `connector_write` já tem `SELECT, INSERT` e `UPDATE (state,
answer)` (`database-grants.sql:331-333`), e as colunas novas só são inseridas.

### Os contratos que a unidade cria

Em `packages/hub-api/src/workflow-ids.ts` (texto fixo, que a U1 também usa):

```ts
import { z } from 'zod'
export const WorkflowId = z.uuid().brand<'WorkflowId'>()
export type WorkflowId = z.infer<typeof WorkflowId>
/** Um balão do workflow, a id de entrada da compilação. */
export const BalloonId = z.string().regex(/^b[0-9]{1,3}$/).brand<'BalloonId'>()
export type BalloonId = z.infer<typeof BalloonId>
/** Onde o balão mora numa execução: os segmentos dos USE de fora até ele, e ele ('b3', 'b7_0.b3'). */
export const BalloonAddress = z.string().regex(/^(b[0-9]{1,3}_0\.)*b[0-9]{1,3}$/).brand<'BalloonAddress'>()
export type BalloonAddress = z.infer<typeof BalloonAddress>
/** Uma execução do Mastra: uuid (manual, teste), sched_<agenda>_<ms> (horário) ou trg_<gatilho>_<chave> (U4). */
export const WorkflowRunId = z.string()
  .regex(/^([0-9a-f-]{36}|sched_[A-Za-z0-9_-]+_[0-9]+|trg_[0-9a-f-]{36}_[A-Za-z0-9_-]{1,64})$/)
  .brand<'WorkflowRunId'>()
export type WorkflowRunId = z.infer<typeof WorkflowRunId>
/** A volta de um balão dentro de um Para cada ou Repetir, de fora para dentro ('2', '2.1'); '' fora de um contêiner. */
export const Iteration = z.string().regex(/^([0-9]{1,6}(\.[0-9]{1,6}){0,7})?$/).brand<'Iteration'>()
export type Iteration = z.infer<typeof Iteration>
/** A escrita de um balão numa tentativa: '<endereço>#<tentativa>', '#<iteração>' quando não é '', e '#<toolCallId>' no fim quando é a escrita de um agente. */
export const BalloonCallKey = z.string()
  .regex(/^(b[0-9]{1,3}_0\.)*b[0-9]{1,3}#[0-9]{1,4}(#[0-9]{1,6}(\.[0-9]{1,6}){0,7})?(#.{1,200})?$/)
  .brand<'BalloonCallKey'>()
export type BalloonCallKey = z.infer<typeof BalloonCallKey>
export function balloonCallKeyOf(balloon: BalloonAddress, attempt: number, iteration: Iteration, toolCallId?: ToolCallId): BalloonCallKey
```

Os ids de balão são únicos em todo o documento (o problema `DUPLICATE_ID` da U1); o endereço só
cresce dentro de um `USE`, porque o outro workflow tem os seus próprios `b1`, `b2`. Um endereço é de
uma espécie só, então a chave de um `WRITE` nunca tem `#<toolCallId>` e o segmento depois da
tentativa, nela, é sempre a volta; a de um `AGENT` sempre tem, e ninguém a lê de volta por partes. A volta (`Iteration`) é o caminho dos índices de
`forEachIndex` e das voltas de um **Repetir**, de fora para dentro; nesta etapa ela é sempre `''`
(as notas para depois, I6). O
`trg_<gatilho>_<chave>` usa a forma de `AccountRef` do kit para a chave
(`packages/connectors/src/kernel/operation.ts:129-132`), que a U4 exige de `keyOf`.

Em `hub/connectors/approval.ts`, o que muda no contrato da 24.5.1:

```ts
export type WriteScope =
  | { kind: 'CONVERSATION'; threadId: ConversationId }  // a conversa: callKey é um ToolCallId
  | { kind: 'RUN'; runId: WorkflowRunId }              // o workflow: callKey é um BalloonCallKey
export async function mustAsk(deps: ApprovalDeps, a: Readonly<{
  companyId: CompanyId
  choice: 'ASK' | 'AUTO'
  author: WriteAuthorOf          // o workflow é PUBLISHED com answeredBy = RunIdentity.answeredBy (U3)
  scope: SessionScope
  where: WriteScope              // era threadId
  target: WriteTarget
}>): Promise<Ask>
```

O corpo só troca `threadId: a.threadId` por `where: a.where` na chamada de `openWrites`. Quem chama
hoje (`builder/agents/tools.ts`, `requireApproval`) passa `where: { kind: 'CONVERSATION', threadId
}`, ou `{ kind: 'RUN', runId }` quando há `conexus.run.call`. `mayApprove` e
`answererLeavesAlone` não mudam. O autor `WORKFLOW` não entra em `WriteAuthorOf`: para a regra,
uma versão de workflow é uma versão publicada com quem responde por ela, como a de agente.

Em `hub/connectors/write-record.ts`:

```ts
type Keyed =
  | Readonly<{ where: Extract<WriteScope, { kind: 'CONVERSATION' }>; callKey: ToolCallId }>
  | Readonly<{ where: Extract<WriteScope, { kind: 'RUN' }>; callKey: BalloonCallKey }>
export type WriteRequest = Readonly<{
  scope: SessionScope; connectionId: ConnectionId; operation: OperationId; input: unknown
  approvedBy?: PersonId; turn: TurnKey; signal?: AbortSignal
}> & Keyed & (
  | Readonly<{ speaker: Person }>
  | Readonly<{ speaker: Version; agentId: AgentId; number: number }>
  | Readonly<{ speaker: WorkflowSpeaker; workflowId: WorkflowId; number: number }>
)
/** Quais escritas abertas: as do where, de uma ligação e operação quando nomeadas. */
export type OpenWritesKey = Readonly<{
  scope: SessionScope; where: WriteScope
  connectionId?: ConnectionId; operation?: OperationId
}>
export function markOf(scopeId: ConversationId | WorkflowRunId, callKey: ToolCallId | BalloonCallKey): string
```

`markOf` guarda a mesma conta de hoje (`sha256` de `<conversa>\n<chamada>`), então a marca de uma
escrita da 24.5 não muda. `key`, `ownRow`, `inserted`, `found` e `finish` usam `where` e `callKey`
(`thread_id` é `threadId` ou `runId`); o `transactionLock` de `register` usa o id do `where`, então
as tentativas de uma execução se revezam; `openRows` lê a marca com `ToolCallId.parse` numa
`CONVERSATION` e `BalloonCallKey.parse` num `RUN`; `aboutOf` loga `toolCallId: a.callKey` (o nome do
campo do log não muda) e o autor `WORKFLOW` com `workflowId` e `versionNumber`. Uma função nova:

```ts
/**
 * As linhas do mesmo balão em tentativas anteriores da execução: só para um where RUN.
 * Uma DONE com a mesma entrada devolve a resposta guardada e nunca envia (outra entrada: IDEMPOTENCY_CONFLICT);
 * uma SENDING ou UNCERTAIN devolve WRITE_UNCERTAIN com a marca dela, salvo approvedBy (a pessoa
 * conferiu no sistema e manda enviar); uma REFUSED, ou nenhuma, deixa esta tentativa enviar.
 */
async function earlierAttempt(tx: ReadTx, a: WriteRequest & { where: { kind: 'RUN' } }): Promise<Written | undefined>
```

`register` a chama depois de `ownRow` e antes de `heldBy`, dentro do mesmo `transactionLock`; ela lê
`thread_id = runId` e `starts_with(tool_call_id, '<endereço>#')` com `tool_call_id <> callKey` (sem
`LIKE`: o `_` de `b7_0.b3` é curinga nele), a mais nova primeiro, e fica só com as linhas da mesma
volta, lidas por `BalloonCallKey`; só para uma escrita de balão (`callKey` sem `#<toolCallId>`). A escrita de um agente
numa tentativa nova não passa por ela: o agente decide de novo, e a escrita aberta da tentativa
anterior aparece pelo `heldBy` do `where` `RUN` como `WRITE_OPEN` (critério 40).

Em `hub/connectors/scope.ts`, `SessionScope.agentVersion?` dá lugar a
`speaksAs?: Extract<Speaker, { kind: 'VERSION' } | { kind: 'WORKFLOW' }>`; `mayAsk` devolve
`scope.speaksAs ?? PERSON` depois da mesma admissão; `speaking.ts:96` corta os dois braços. Em
`hub/identity/may-use.ts`, `Speaker` ganha `{ kind: 'WORKFLOW'; declared }`, e `mayUseEach` confere
por `declares` todo autor que não é `PERSON`.

Em `builder/agents/tools.ts`, a escrita do agente lê `RUN_CALL_KEY = 'conexus.run.call'` do
`requestContext`: `RunCall = { runId: WorkflowRunId; balloon: BalloonAddress; attempt: number;
iteration: Iteration }`, lido com o esquema (C27). Presente, `requireApproval` chama `mustAsk` com
`where: { kind: 'RUN', runId }` e o `execute` grava com `where: RUN` e `callKey =
balloonCallKeyOf(balloon, attempt, iteration, toolCallId)`; ausente, como hoje. O autor da linha continua `VERSION` (o agente e a versão fixada),
e o `requestContext` é posto pelo balão de agente (U3).

A migração `<ts>_e246_connector_write_workflow`, gerada de `tables.ts`, com a linha
`-- contract: o CHECK connector_write_speaker ganha o braço WORKFLOW; a imagem anterior não grava esse braço`:
acrescenta `workflow_id uuid null` e `workflow_version int null`; troca o `CHECK`
`connector_write_speaker` por três braços exclusivos (`agent_id` e `version_number` não nulos e os
outros nulos; só `person_id`; `workflow_id` e `workflow_version` não nulos e os outros nulos). A
chave primária `(company_id, thread_id, tool_call_id)` fica.

**O dono de cada fato.** "Pergunta ou faz" e quem pode aprovar: `approval.ts`, da 24.5.1. A chave
de uma escrita: `where` e `callKey`; a tentativa: `workflow_run.attempt` (U3). As formas das ids:
`workflow-ids.ts`. O modelo: `hub/connectors/write-record.ts` (o autor como união, C21).

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/server/src` (`drizzle-orm`), `apps/server`
(`drizzle-kit`), `apps/server/src/builder` (`@mastra/core`: `mastra`, para `requireApproval` e o
`requestContext`); `typescript-magician` para `Keyed`.

### A ordem do trabalho

1. `workflow-ids.ts` num commit só (a U1 o pega). Regras: C23.
2. `approval.ts`: `where` no lugar de `threadId`; quem chama passa `CONVERSATION`. Os testes da 24.5
   e da 24.5.1 passam sem mudar a asserção (critério 6).
3. `write-record.ts`, `write.ts`, `assistant-port.ts`, `conversations-of.ts:43`: `where` e `callKey`;
   `earlierAttempt`; o braço `WORKFLOW` em `authorOf`, `aboutOf`, `inserted`; `admitted` aceita o
   braço; os testes que chamam `markOf` com os argumentos novos. `scope.ts`, `mayAsk`,
   `speaking.ts` e `may-use.ts`: o braço. Regras: C21, C23, C65.
4. `builder/agents/tools.ts`: `RUN_CALL_KEY` (critério 40).
5. `tables.ts`, `npm run generate`, a linha `-- contract:`, `npm run migrations`; o retrato do
   catálogo. Regras: D6, D11.

### Como se prova

Critérios 6 a 8 e 40. O critério 7 falha hoje porque `Speaker` não tem `WORKFLOW` e `WriteRequest`
não tem `where`; "a tentativa seguinte" falha porque `foundIn` só olha a própria chave; o 40,
porque a escrita do agente grava sempre no livro da conversa.

### Parar se

- A 24.5.1 não estiver no `main`, ou o seu `mustAsk` não tiver a forma acima com `threadId`: não
  começar; relatar o que entrou.
- `markOf` com os argumentos novos der outra marca para uma linha da 24.5: relatar; a marca de uma
  escrita feita não muda.
- Um teste da 24.5 ou da 24.5.1 precisar mudar a asserção para passar (fora `markOf`,
  `OpenWritesKey`, `where` e `speaksAs`): relatar com o teste; a regra não muda.
- O `drizzle-kit` não gerar a troca do `CHECK` numa transação só: relatar com o SQL.

## U3 O executor e as execuções

**Base e modelo.** A U1, a U2 e a correção da 24.5 do turno (`AgentRun` com `number` e
`answeredBy`) no `main`. Opus, e o porquê: a retomada através de um reinício, a corrida de duas
respostas, a tentativa, a posse da execução, o agente que suspende numa versão que não é a ativa e
o caminho aninhado cruzam o Mastra, o agente e o funil (concorrência e desenho entre módulos, a
regra de escalar do fundador).

### As linhas da tabela

- **As ferramentas.** O contexto `dist/tools/types.d.ts` (`workflowId`, `runId`, `suspend`,
  `resumeData`, `suspendPayload`) e `context.requestContext`; `suspendSchema` e `resumeSchema`
  (`dist/docs/references/reference-tools-create-tool.md`). Cada ferramenta lê a identidade da
  execução do `requestContext` (`RunIdentity`, abaixo), lê `parseMastraWorkflowId(
  context.workflow.workflowId)` (U1) e confere que a id é da versão da identidade (num `TEST`, de
  `wf-<w>-teste`), lê a linha da versão (`workflow_version.frozen`, ou `workflow.test_draft` numa
  id `TEST`) no escopo `{ kind: 'COMPANY', companyId, personId: null }` como `hub/apps/repair.ts:224`,
  acha o balão por `pathOf` (U1) e o seu endereço; nunca confia em empresa, ligação ou pessoa
  vindas do grafo (S7, S8, S9); confere a própria entrada e lança uma `Failure` (prova P2 do estudo:
  o Mastra devolveria `{ error: true }` como sucesso). O Mastra devolve o `requestContext` gravado na
  retomada, no `restart` e no `timeTravel`, e uma chave passada na chamada vence a gravada (prova
  P13). O escopo de cada leitura e escrita é `SessionScope` com `personId` = `answeredBy`, `place` =
  o lugar do workflow, `chosen` = as ligações declaradas, `speaksAs` = `{ kind: 'WORKFLOW',
  declared }`, e um `TurnKey` novo por execução e tentativa (`hub/connectors/scope.ts:22-23`; as 50
  chamadas do turno em `hub/connectors/builder-port.ts:22,58-69`).
- **A falha de um balão.** Uma ferramenta lança `new Failure(code)` sem `details`: a mensagem é o
  código sozinho (`platform/failure.ts:49-51`), e o Mastra guarda `{ name, message }` do erro
  (prova P4). `runs.ts` lê o código como a primeira palavra de `error.message` por
  `FailureCodeSchema`, e `INTERNAL_UNEXPECTED` quando não é um código. Nada de empresa no erro (S40).
- **Conferir.** O modelo é `builder/automations/run.ts:189-219` (o dono reconferido, a agenda
  pausada). No principal: `answeredBy` nulo, fora da empresa (`speakerOf(tx, companyId,
  answeredBy)` da 24.5.1 dá `undefined`), sem a ação `manageAutomations` no papel lido agora
  (`hub/identity/admission.ts:23,103`, a mesma ação que abre Automações), ou `mayUseEach` falso para
  uma leitura declarada, falha. É uma função só, `ownerMayRun` em `balloons/check.ts`, que a olhada
  da U4 chama também, e por isso as duas conferem o mesmo. Isso fecha, para o workflow, a brecha
  de `may-use.ts:76`. No caminho de um `USE`: só confere que a linha `workflow_version` do
  outro, na versão fixada, ainda existe na empresa (senão `WORKFLOW_NOT_FOUND`), e não grava nem
  pausa nada. Devolve a entrada igual.
- **Ler.** `hub/connectors/read.ts:135` (`readThrough`) pela porta do Assistente
  (`assistant-port.ts:281-306`, `read(scope, call)`), com o `SessionScope` de cima: `mayAsk` admite
  `answeredBy` e devolve o `speaksAs` `WORKFLOW` (U2). A entrada passa antes pelo esquema de entrada
  da operação do kit; recusada, `REQUEST_MALFORMED`.
- **O agente publicado na versão fixada.** `builder/agents/agent.ts:305-351` (`agentOf`, um `Agent`
  por versão) e `:84-89` (`agentRunContext`, "how a workflow, a test or the Construtor calls an
  agent alone"); `AgentRunSchema` (`:62-66`, com `number` e `answeredBy` depois da correção da
  24.5); `registry.resolve` (`builder/agents/registry.ts:120-135`): o ramo `DRAFT` (`:121-124`)
  monta um `Agent` por turno, e o `PUBLISHED` só acha ou registra a versão ativa;
  `builder/agents/frozen.ts:124-137` (`activeOf`, com `pinnedOf` em `:135`). `builder/agents/open.ts:22-46`
  (`keep`, a linha antes da conversa) e `:54-88` (`openAgentConversation`); as etiquetas
  `AGENT_MARK` (`builder/agents/controller.ts:56-62`); `attemptIdOf` (`controller-kit/open.ts:17`,
  exportado em `controller-kit/public.ts:7`, usado em `builder/automations/run.ts:112`). A prova P11
  do estudo: `agent.stream`, drenar, num pedaço `tool-call-approval`
  `context.workflow.suspend({ agentRunId, toolCallId })`; na retomada aprovada
  `agent.approveToolCall({ runId, toolCallId })`, e drenar de novo. Na recusa nada vai ao agente:
  `agent.declineToolCall` é `resumeStream({ approved: false })`, uma chamada nova ao modelo
  (`packages/core/src/agent/agent.ts:11888-11900` do `mastra@6e8dfcb8`).
- **O Assistente.** `builder/automations/run.ts:112-142`: `assistant.open`, `asked`, `turnEnd`,
  `sendSignal` com `requireDelivery`, os 15 minutos.
- **Escrever.** `mustAsk` (24.5.1, U2) com `author: { kind: 'PUBLISHED', answeredBy }` e
  `writeThrough` com `where: { kind: 'RUN', runId }` e `callKey = balloonCallKeyOf(endereço,
  attempt, iteration)` (`iteration` é `''` nesta etapa); aprovado, `approvedBy` = quem respondeu.
- **Avisar.** `hub/notifications/notifications.ts:40-43,308-325` (`automationRan`, o escopo
  `COMPANY` com a pessoa avisada, porque a política da linha é a dela, `tables.ts:28`); a tabela
  `hub/notifications/tables.ts:37-90` e a migração `20261101085955_e242_notification` (as colunas,
  `notification_run_key` `UNIQUE (company_id, run_id)`, os `CHECK` `notification_kind`,
  `notification_done`, `notification_failed` com `AutomationFailureCode` em `tables.ts:25,75`,
  `notification_paused`); o leitor do sino `NotificationRow` (`packages/hub-api/src/notifications.ts`),
  lido em `notifications.ts:281`; os três laços do sino em `notifications.ts:203,272,291`; o
  `INSERT` do aviso da Automação com `onConflictDoNothing({ target: [notification.companyId,
  notification.runId] })` em `notifications.ts:122`, que a ordem das migrações (abaixo) muda.
- **A agenda.** `builder/automations/automations.ts:59-63` (`ownedOf`, que dá `undefined` para uma
  agenda de outro workflow), `:108-114` (`atLimit`, que lista por `workflowId` em `:110`) e `:143-188`
  (criar idempotente, `schedules.create` em `:166-179`); `cadence.ts:4,9,22-39`
  (`AUTOMATION_TIMEZONE`, o limite de 30, `cronOf`), exportados em `automations/public.ts:10`. A
  prova P12 do estudo: `mastra.schedules.create({ id, workflowId, cron, timezone, inputData,
  requestContext })` dispara a versão; a execução é `sched_<agenda>_<ms>`; a linha guarda o
  `requestContext`.
- **As execuções.** `builder/automations/runs.ts:70-190` é o modelo (a página de 20; a interrompida
  decidida ao ler: `running`, `pending` ou `waiting` criada antes de `bootedAt` é `INTERRUPTED`,
  `:94-99`, sem escrever nada no início; `suspended` hoje é tratada como fim em `:100-111`, e no
  workflow é `WAITING`); `getWorkflowRunById(runId, { fields })` (`runs.ts:150`),
  `listWorkflowRuns({ workflowName, resourceId, perPage: false })`
  (`builder/automations/release.ts:25-30`), `run.startAsync`, `run.resume`, `run.cancel`,
  `run.timeTravel`, `run.restart`, a posse de 15 s (I5). As provas P5 a P8, P10, P13 e P15 do estudo
  são as formas que funcionaram. `bootedAt` vem de `conversations-of.ts:185`, tirado ao montar; as
  Automações e os workflows usam o mesmo valor.
- **O início, por empresa.** `boot.ts` (U1), pelo `afterWorkers` e por
  `builder.companies_with_workflows()`.
- **As operações.** Como na U1: `defineOperation` em `packages/hub-api/src/workflow-operations.ts`,
  `serve` em `builder/workflows/run-routes.ts`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/workflows/` | Cria `balloons/{check,read,agent,approval,write,notify}.ts`, `run-identity.ts`, `schedule.ts`, `runs.ts`, `run-routes.ts`, `run-tables.ts`, `snapshot.ts` (o esquema Zod do retrato); muda `tools.ts` (os corpos), `routes.ts` (a lista), `release.ts` (agendas e execuções), `boot.ts` (agendas e decisões) | `conversations-of.ts`, `hub-mastra.ts`, a U4, a U5 |
| `apps/server/src/builder/agents/frozen.ts`, `registry.ts`, `open.ts`, `public.ts`, `controller.ts` | Muda (`versionOf`; `resolve` monta a versão fixada; `openWorkflowConversation`, `workflowAsked`, `workflowTurn`, `approveCall` em `agentsAlive`; `AGENT_MARK.workflow`; `everyWriteAsks` num turno de teste) | `balloons/agent.ts` |
| `apps/server/src/builder/automations/` | Muda (`automations.ts`, `cadence.ts`, `public.ts`: o limite de 30 conta também as agendas `schedule_wf-*` da empresa; o teste da agenda com o relógio injetado, #754) | `schedule.ts` |
| `apps/server/src/main.ts`, `conversations-of.ts` | Muda (as rotas das execuções; `bootedAt` passado aos dois; `workflows` no retorno de `conversationsOf`, `:189`, e em `subjectsOf`, `main.ts:151,185`) | — |
| `apps/server/src/hub/notifications/` | Muda (`notifications.ts`: o alvo do `onConflictDoNothing` em `:122`, no primeiro PR, e a porta `workflowNoticed`; `tables.ts`: as colunas, as chaves, os `CHECK`; `mail.ts`; `public.ts`) | o sino, o e-mail, as ferramentas, a U4 |
| `packages/hub-api/src/workflows.ts`, `workflow-operations.ts`, `notifications.ts` | Muda (`RunView`, `RunPage`, `WorkflowSummary`, `AnswerBody`, `TestResult`; as operações das execuções; as seis variantes `WORKFLOW_*` de `NotificationRow`) | a web |
| `apps/server/migrations/`, `apps/server/database-grants.sql` | Cria `<ts>_e246_notification_workflow` (no primeiro PR), `<ts>_e246_workflow_run`, `<ts>_e246_workflow_run_grants` e `<ts>_e246_notification_run_key_drop` (no segundo) | o catálogo |
| `apps/server/src/platform/catalog.test.ts` | Muda (o retrato do catálogo) | — |

### Os contratos que a unidade cria

Em `builder/workflows/run-identity.ts`, o único canal da empresa, da versão e de quem responde até
as ferramentas (C27: lido uma vez, na entrada de cada ferramenta):

```ts
export const RunIdentity = z.object({
  companyId: CompanyId,
  workflowId: WorkflowId,
  version: z.int().positive().nullable(),            // nulo num TEST
  answeredBy: PersonId.nullable(),                   // workflow.active_by ao começar; num TEST, quem começou
  startedBy: z.union([z.literal('SCHEDULE'), z.literal('TRIGGER'), PersonId]),
  attempt: z.int().nonnegative(),                     // workflow_run.attempt; 0 ao começar
  label: z.string().max(120).optional(),              // 'Rodado por Ana', 'Orçamento nº 1043', 'Teste'; ausente na agenda
})
export type RunIdentity = z.infer<typeof RunIdentity>
/** As chaves no requestContext do Mastra, uma por campo, com o prefixo conexus.run. */
export function requestContextOf(identity: RunIdentity): RequestContext
/** Recusada, ou sem chave: Failure('INTERNAL_UNEXPECTED'), e a ferramenta não lê nada. */
export function identityOf(requestContext: RequestContext | undefined): RunIdentity
```

Quem a escreve, sempre com `version` e `answeredBy` lidos na mesma linha de `workflow`
(`active_version` e `active_by`): a agenda ao publicar ou religar (`startedBy: 'SCHEDULE'`, sem
`label`: `conferir` escreve a hora do disparo, tirada dos `<ms>` da id); `POST …/run` (`startedBy`
= a pessoa, "Rodado por <nome>"); a olhada da U4 (`'TRIGGER'`, o rótulo do item); `POST …/test` (a
pessoa, "Teste", `version` nulo, `answeredBy` = a pessoa); **Tentar de novo** passa só `attempt`, e
o resto volta do retrato (P13). A agenda guarda o `requestContext` de quando foi criada: quem sai da
empresa deixa `active_by` nulo, e o disparo seguinte falha em `conferir` e pausa (critério 9).

Tabelas (esquema `builder`, D11):

- `workflow_run(run_id text pk, company_id text not null, workflow_id uuid not null fk workflow on
  delete cascade, version int null, kind text not null check in ('RUN','TEST'), attempt int not
  null default 0, label text not null, started_by text not null, answered_by text null, item_key
  text null, started_at timestamptz not null)`; `version` nulo só num `TEST`; escrita por `conferir`
  com `ON CONFLICT DO NOTHING`. Permissões `SELECT, INSERT, DELETE` e `UPDATE (attempt,
  answered_by)` (`answered_by` fica nulo quando a pessoa sai).
- `workflow_run_decision(run_id text, balloon_id text, attempt int, iteration text not null
  default '', call text not null default '', company_id text not null, workflow_id uuid not null fk
  workflow on delete cascade, person_id text not null, approved boolean not null, decided_at
  timestamptz not null, primary key (run_id, balloon_id, attempt, iteration, call))`; `balloon_id`
  é o endereço do `APPROVAL`, do `WRITE` ou do `AGENT` que espera; `iteration` é a volta
  (`Iteration`, U2) dentro de um **Para cada** ou **Repetir**, lida na resposta do `forEachIndex`
  que a retomada usa (P15), e `''` fora deles; `call` é o `toolCallId` do agente num balão `AGENT`
  (um agente aprovado pode pedir outra escrita na mesma tentativa, e cada pedido tem a sua decisão)
  e `''` nos outros. A coluna existe desde já, porque a base nasce completa: nesta etapa ela é
  sempre `''`, e as voltas do **Repetir** vêm com a 24.6.3 (as notas para depois, I6). Permissões
  `SELECT, INSERT, DELETE`.
- `notifications.notification`, em duas migrações geradas de `hub/notifications/tables.ts`, em dois
  PRs da U3, nesta ordem (a regra D6: a imagem anterior continua gravando durante a troca de
  imagem, porque `notifications.ts:122` mira `(company_id, run_id)`, e um `ON CONFLICT` cujo alvo
  não tem restrição falha):
  1. **O primeiro PR da U3**, antes de tudo o mais: `notifications.ts:122` passa a
     `onConflictDoNothing()` sem alvo (vale com a chave velha e com a nova, e o aviso da Automação
     continua um por execução, porque ela avisa uma pessoa só), e a migração
     `<ts>_e246_notification_workflow`, que só acrescenta: `ADD CONSTRAINT notification_subject_key
     UNIQUE (company_id, run_id, person_id, kind, subject_key)` ao lado de `notification_run_key`;
     colunas novas `workflow_id uuid null`, `workflow_name text null`, `balloon_id text null`,
     `subject_key text not null default ''`; `automation_id` e `automation_name` `DROP NOT NULL`, e os
     `CHECK` abaixo, com a linha `-- contract: automation_id e automation_name aceitam nulo e os CHECK
     se alargam; a imagem anterior só grava AUTOMATION_*, com os dois preenchidos, e passa em todos`.
     Nenhum aviso `WORKFLOW_*` é gravado neste PR.
  2. **O resto da U3**, num PR seguinte, que entra depois de a imagem do primeiro estar no ar: a
     migração `<ts>_e246_notification_run_key_drop`, com `DROP CONSTRAINT notification_run_key` e a
     linha `-- contract: notification_run_key sai; a imagem no ar já grava com onConflictDoNothing()
     sem alvo`; `notifications.ts:122` e a porta `workflowNoticed` passam a mirar
     `[companyId, runId, personId, kind, subjectKey]`. A janela que fica é a do sino da imagem
     anterior que encontre uma linha `WORKFLOW_*` (a dívida, abaixo).

  `subject_key` é `''` nos avisos da 24.2 (`AUTOMATION_*`) e em `WORKFLOW_PAUSED`; `#<tentativa>`
  (`#0`, `#1`) em `WORKFLOW_FAILED`, para que uma segunda falha depois de **Tentar de novo** avise de
  novo; `<endereço>#<tentativa>` nos de um balão (`WORKFLOW_WAITING`, `WORKFLOW_NOTICE`), mais
  `#<iteração>` dentro de um contêiner (sempre `''` nesta etapa, I6) e `#<toolCallId>` no fim quando
  um balão `AGENT` espera; e a hora da passagem nos do gatilho (`WORKFLOW_TRIGGER_FAILING`, `WORKFLOW_TRIGGER_BACK`, U4, com
  `run_id` igual à id do gatilho). `notification_kind` passa a aceitar as nove espécies (as três da
  24.2 e as seis `WORKFLOW_*`); `notification_done`, `notification_failed` e `notification_paused`
  são reescritos para exigir também `automation_id` e `automation_name` não nulos e `workflow_id`,
  `workflow_name` e `balloon_id` nulos; `CHECK` novos: `notification_workflow_waiting` e
  `notification_workflow_notice` (`workflow_*` e `balloon_id` não nulos, `automation_*`,
  `conversation_id` e `failure_code` nulos), `notification_workflow_paused` e
  `notification_workflow_trigger` (o mesmo sem balão), `notification_workflow_failed`
  (`workflow_*` não nulos, `balloon_id` nulo, `failure_code` em `WorkflowFailureCode`); uma linha da
  24.2 passa em todos. As permissões não mudam: `hub_company` já tem `SELECT, INSERT` e
  `UPDATE (read_at)` (`database-grants.sql:340-341`), e a política `OWN` fica.

Quem avisa: `WORKFLOW_WAITING` à pessoa que espera (`APPROVAL`, `WRITE`, `AGENT_WRITE`, nunca num
`TEST`); `WORKFLOW_NOTICE` a cada pessoa de um `NOTIFY`; `WORKFLOW_PAUSED` ao dono (quem ativou), por
`conferir` e pela olhada; `WORKFLOW_FAILED` a quem ativou, uma vez por tentativa, quando um balão
lança (a ferramenta avisa antes de lançar), como a Automação da 24.2 avisa a sua falha, e nunca num
`TEST` (um teste nunca avisa ninguém, a página); os dois do gatilho, da U4.

O que as ferramentas suspendem e retomam (`suspendSchema` e `resumeSchema`):

```ts
type Suspended =
  | { kind: 'APPROVAL'; balloon: BalloonAddress; approver: PersonId; question: string }
  | { kind: 'WRITE'; balloon: BalloonAddress; approver: PersonId;
      reason: Ask['reason'] | 'UNCERTAIN'; mark: string | null;
      connectionId: ConnectionId; operation: OperationId; fields: Record<string, unknown> }
  | { kind: 'AGENT_WRITE'; balloon: BalloonAddress; approver: PersonId; reason: Ask['reason'];
      agentRunId: string; toolCallId: string;
      connectionId: ConnectionId; operation: OperationId; fields: Record<string, unknown> }
type Resumed = { approved: true; personId: PersonId }   // a recusa nunca retoma: cancela
```

O `approver` sai do `Approver` do balão (`ACTIVATED_BY` é `answeredBy`); num `WRITE` ou
`AGENT_WRITE` com `PUBLISHER_LOST_RIGHT`, é sempre `answeredBy` (decisão A); num `TEST`, quem começou
o teste. `agentRunId` e `toolCallId` ficam no retrato; a vista não os mostra. `Waiting` (abaixo) é
`Suspended` sem `agentRunId` e `toolCallId`: os mesmos campos, com o mesmo nome.

**O motivo e o alvo da escrita de um agente.** O balão só vê o pedaço `tool-call-approval` do stream:
o `toolCallId`, o nome da ferramenta e os argumentos. Quem decidiu perguntar foi o `requireApproval`
da ferramenta do agente (U2), e ninguém devolve o motivo ao balão. Por isso o balão, ao ver o
pedido:

1. acha a ferramenta na versão fixada do agente: `versionOf` com `frozen.agents[b].versionNumber`
   dá as ferramentas da versão, e a de nome `tool_<slug>` é a `PresetFrozenTool` com esse `slug`,
   como `builder/agents/write-of.ts:23-25` acha hoje; ela dá `connectionId`, `operation` e
   `approval` (**Pergunta antes / Faz sozinho**), e o `WriteTarget` sai de `targetOf`
   (`builder/agents/publish.ts:125-136`) com as ligações do lugar. Uma ferramenta que não está na
   versão, ou uma ligação que o lugar não oferece mais, falha o balão com `NOT_IN_ROLE`;
2. chama de novo o dono da regra, `mustAsk` da 24.5.1 com o `where` da U2: `{ companyId, choice:
   tool.approval, author: { kind: 'PUBLISHED', answeredBy }, scope, where: { kind: 'RUN', runId },
   target }`, a mesma chamada que o `requireApproval` fez, só para ler o `reason`. Um `DO` aqui (o
   papel mudou entre as duas leituras) é lido como `CHOSEN`: a ferramenta já perguntou, e o pedido
   espera de qualquer jeito;
3. suspende com `reason`, `connectionId`, `operation` e `fields` (os argumentos da chamada), e com o
   `approver` pela regra de cima.

O `mustAsk` da 24.5.1 (`{ companyId, choice, author, scope, threadId, target }`, com `threadId`
trocado por `where` na U2) recebe isso sem mudar a forma.

O que cada resposta do funil faz com o balão `READ` e `WRITE` (a união `Written` de
`write-record.ts:53` e `Answered` do kit):

| Resposta | O balão |
| --- | --- |
| `OK` | devolve `{ resultado }` (`READ`) ou `{ resultado, marca }` com `markOf(runId, callKey)` (`WRITE`) |
| `WRITE_UNCERTAIN`, `WRITE_OPEN` | suspende `WRITE` com `reason` `UNCERTAIN` ou `OPEN_WRITE` e a marca; aprovado, envia com `approvedBy` |
| `NOT_IN_ROLE` | lança `NOT_IN_ROLE` |
| `NOT_GRANTED` | lança `CONNECTOR_NOT_GRANTED` |
| `TOKEN_EXPIRED` | lança `CONNECTION_SIGN_IN_EXPIRED` |
| `AUTH_REFUSED` | lança `CONNECTION_CREDENTIAL_INVALID` |
| `REFUSED`, `UNREADABLE`, `BUSY` | lança `BALLOON_SYSTEM_REFUSED` |
| `UNREACHABLE`, `DEADLINE` | lança `BALLOON_SYSTEM_UNREACHABLE` |
| `IDEMPOTENCY_CONFLICT` | lança `IDEMPOTENCY_CONFLICT` |
| `CALLS_SPENT` | lança `INTERNAL_UNEXPECTED` (uma execução tem no máximo 50 balões fora dos `USE`; um `USE` de um `USE` pode passar das 50 chamadas do turno, abaixo, "Parar se") |

Em `packages/hub-api/src/workflows.ts`:

```ts
export const RunState = z.enum(['RUNNING', 'WAITING', 'DONE', 'FAILED', 'DECLINED', 'CANCELED',
  'INTERRUPTED', 'STOPPED_BEFORE_WRITE'])               // o último só num TEST
export const BalloonState = z.enum(['PENDING', 'RUNNING', 'DONE', 'FAILED', 'WAITING', 'SKIPPED'])
export const Waiting = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('APPROVAL'), balloon: BalloonAddress, approver: PersonId, question: z.string() }),
  z.object({ kind: z.literal('WRITE'), balloon: BalloonAddress, approver: PersonId,
    reason: z.enum(['CHOSEN', 'PUBLISHER_LOST_RIGHT', 'OPEN_WRITE', 'UNCERTAIN']), mark: z.string().nullable(),
    connectionId: ConnectionId, operation: OperationId, fields: z.record(z.string(), z.unknown()) }),
  z.object({ kind: z.literal('AGENT_WRITE'), balloon: BalloonAddress, approver: PersonId,
    reason: z.enum(['CHOSEN', 'PUBLISHER_LOST_RIGHT', 'OPEN_WRITE']),     // o Ask['reason'] de mustAsk
    connectionId: ConnectionId, operation: OperationId, fields: z.record(z.string(), z.unknown()) }),
])
export const RunView = z.object({
  runId: WorkflowRunId, workflowId: WorkflowId, versionNumber: z.int().positive().nullable(),
  kind: z.enum(['RUN', 'TEST']),
  attempt: z.int().nonnegative(),
  answeredBy: PersonId.nullable(),
  item: z.object({ key: z.string(), label: z.string() }).nullable(),
  label: z.string(),
  state: RunState,
  balloons: z.array(z.object({ address: BalloonAddress, state: BalloonState,
    output: z.unknown().optional(), conversationId: ConversationId.optional(),
    failure: FailureCodeSchema.optional() })),
  waiting: Waiting.nullable(),
  decisions: z.array(z.object({ balloon: BalloonAddress, attempt: z.int().nonnegative(),
    approved: z.boolean(), by: PersonId, at: z.iso.datetime() })),
  startedAt: z.iso.datetime(),
})
export const RunSummary = RunView.pick({ runId: true, versionNumber: true, item: true, label: true, state: true, startedAt: true })
export const RunPage = z.object({ runs: z.array(RunSummary), next: Next.nullable() })
export const WorkflowSummary = z.object({
  id: WorkflowId, place: WorkflowPlace, name: z.string(), trigger: Trigger, health: TriggerHealth.nullable(),
  state: WorkflowState, published: z.int().positive().nullable(),
  lastRun: z.object({ state: RunState, at: z.iso.datetime() }).nullable(),
  waitingCount: z.int().nonnegative(),
})
export const AnswerBody = z.object({ approved: z.boolean() })
/** O que workflow_test (U5) responde: o teste começou, ou o rascunho tem problemas. */
export const TestResult = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('STARTED'), runId: WorkflowRunId }),
  z.object({ kind: z.literal('PROBLEMS'), problems: z.array(WorkflowProblem) }),
])
```

O retrato do Mastra é lido em `snapshot.ts` com um esquema Zod só do que o Conexus usa (`status`,
`suspendedPaths`, `requestContext`, `context[<id>]` com `status`, `output`, `suspendPayload` e
`error`), lido do Mastra de verdade nos testes do servidor (o Hub com o Mastra e o Postgres de
verdade, por `hubBeside`), sem gravação nova: `npm run record` grava a conversa, e o retrato de um
workflow não passa por um provedor. O estado: `suspended` é
`WAITING`; `success` `DONE`; `failed` `FAILED`, e num `TEST` falhado com
`WORKFLOW_TEST_STOPPED_AT_WRITE` `STOPPED_BEFORE_WRITE`; `canceled` com uma decisão recusada da
tentativa atual `DECLINED`, sem ela `CANCELED`; `running`, `pending` ou `waiting` criado antes de
`bootedAt`, `INTERRUPTED`. O de cada balão: o passo `bN` do retrato; um balão de dentro de um caminho
lê o passo do segmento (`bK_0`) e, dentro dele, o retrato aninhado que o Mastra guarda (P5: só a
saída do fim; os do meio aparecem pelo estado, sem saída); um balão de um caminho não tomado num
retrato terminado é `SKIPPED`; um balão sem passo num retrato que roda é `PENDING`. `lastRun` é a
linha mais nova de `workflow_run` (`kind = 'RUN'`) com o seu retrato; `waitingCount` conta as
execuções `suspended` de `listWorkflowRuns({ workflowName, status: 'suspended' })` por versão do
workflow que tem execução (a nota I2).

Em `builder/agents/frozen.ts`, `versionOf(database, ids, agentId, number)`: a mesma leitura de
`activeOf` com `eq(agentVersion.number, number)` no lugar da versão ativa. Em `registry.ts`,
`resolve` de um `PUBLISHED` cujo `run.number` não é a versão ativa monta o `Agent` dessa versão por
turno, com `versionOf`, como o ramo `DRAFT` faz, e não o registra; a versão ativa continua achada ou
registrada como hoje. Se a correção da 24.5 que entrar já fizer isso, a U3 a usa.

Em `builder/agents/public.ts` (`agentsAlive`), para o balão de agente:

```ts
/** A conversa de um agente aberta por um workflow: a linha keep e o thread com AGENT_MARK.workflow, sem sessão do controlador. */
openWorkflowConversation(a: { scope: InProject; agentId: AgentId; versionNumber: number;
  id: ConversationId; workflowId: WorkflowId }): Promise<void>
/** Se o thread já tem a pergunta do balão: o mesmo passo de novo na mesma tentativa não pergunta duas vezes (como assistant.asked, run.ts:119-120). */
workflowAsked(a: { scope: InProject; conversationId: ConversationId }): Promise<boolean>
/** Roda a versão fixada no thread: AgentRun { kind: 'PUBLISHED', number, answeredBy } e RUN_CALL_KEY no requestContext. Num TEST, everyWriteAsks faz toda escrita perguntar. */
workflowTurn(a: { scope: InProject; agentId: AgentId; versionNumber: number; answeredBy: PersonId;
  call: RunCall; conversationId: ConversationId; prompt: string; everyWriteAsks: boolean;
  signal: AbortSignal }): Promise<MastraModelOutput>
/** A retomada aprovada: approveToolCall na mesma versão, com APPROVED_CALL e o mesmo requestContext. A recusa não chama nada. */
approveCall(a: { scope: InProject; agentId: AgentId; versionNumber: number; answeredBy: PersonId;
  call: RunCall; agentRunId: string; toolCallId: string; personId: PersonId; signal: AbortSignal }): Promise<MastraModelOutput>
```

O `scope` `InProject` é o Projeto do workflow: um `AGENT` com `PUBLISHED` só chega aqui num
workflow de Projeto (`AGENT_IN_COMPANY`, U1). A id da conversa é
`attemptIdOf('agents', dono, 'workflow:<execução>:<endereço>:<tentativa>')`,
como `builder/automations/run.ts:112`: o mesmo passo na mesma tentativa encontra a mesma (e
`workflowAsked` faz o balão falhar com `INTERRUPTED` em vez de perguntar de novo), e **Tentar de
novo** abre outra. Dentro do agente, a ferramenta de escrita vê `context.agent` e não
`context.workflow`, então nunca suspende duas vezes (P11); ela grava no livro da execução pela
`RUN_CALL_KEY` (U2), e quem responde pela escrita é `answeredBy` do turno, que é o da execução
(decisão `A1`). Recusada, a corrida suspensa do próprio agente fica como está e nada a retoma; a
conversa do agente mostra a chamada sem cartão, porque nenhuma sessão espera nela
(`apps/web/src/builder/conversation/rows.ts:109-112`, `cardState` dá `'none'` em `:112`), e quem
recusou e quando está na página da execução. Nada muda em `rows.ts`.

As operações das execuções, em `workflow-operations.ts` (`manageAutomations`, menos
`answerWorkflowCall`, que é da pessoa do pedido; `ONE_FAILURES` com `WORKFLOW_NOT_FOUND`):

| id | Método e caminho | `bodyLimit` | Entrada | Sucesso | Falhas além das de leitura |
| --- | --- | --- | --- | --- | --- |
| `listWorkflows` | `GET BASE?place=COMPANY\|<projectId>` | 1024 | `query` | 200 `{ workflows: WorkflowSummary[] }` | — |
| `listWorkflowRuns` | `GET BASE/{w}/runs?page=` | 1024 | `query` | 200 `RunPage` | — |
| `getWorkflowRun` | `GET BASE/{w}/runs/{r}` | 1024 | — | 200 `{ run: RunView }` | `RUN_NOT_FOUND` |
| `answerWorkflowCall` | `POST BASE/{w}/runs/{r}/balloons/{b}/answer` | 1024 | `AnswerBody` | 202 `{ run: RunView }` | `RUN_NOT_FOUND`, `RUN_NOT_WAITING`, `NOT_APPROVER`, `NOT_IN_ROLE`, `HUB_UPDATING` |
| `retryWorkflowRun` | `POST BASE/{w}/runs/{r}/retry` | 1024 | — | 202 `{ run: RunView }` | `RUN_NOT_FOUND`, `RUN_NOT_FAILED`, `RUN_STILL_OWNED`, `HUB_UPDATING` |
| `runWorkflow` | `POST BASE/{w}/run` | 1024 | — | 202 `{ runId }` | `WORKFLOW_NOT_PUBLISHED`, `WORKFLOW_PAUSED`, `HUB_UPDATING` |
| `pauseWorkflow`, `resumeWorkflow` | `POST BASE/{w}/pause`, `POST BASE/{w}/resume` | 1024 | — | 200 `{ workflow: WorkflowView }` | `resume`: `AUTOMATION_LIMIT`, `HUB_UPDATING` |
| `testWorkflow` | `POST BASE/{w}/test` | 1024 | — | 202 `{ runId }` | `WORKFLOW_HAS_PROBLEMS`, `WORKFLOW_TEST_NO_ITEM`, `HUB_UPDATING` |

`{b}` é o endereço do balão. `runWorkflow` e `testWorkflow` usam `run.startAsync` e respondem quando
a execução começou; `answerWorkflowCall` e `retryWorkflowRun` gravam a decisão ou a tentativa,
chamam `resume`, `timeTravel` ou `restart` sem esperar o fim, e respondem com o `RunView` lido logo
depois; uma recusa do Mastra que chegue depois é logada (`WORKFLOW_RESUME_FAILED`) e a próxima
leitura mostra a execução como está. `RUN_STILL_OWNED` é decidido antes de chamar: uma execução
`INTERRUPTED` cujo retrato mudou há menos da posse do Mastra (I5). A retomada de um balão dentro de
caminhos passa `step` como a lista dos segmentos até ele e o balão (P15: `['cada', 'aprovar']`);
**Tentar de novo** passa ao `timeTravel` o segmento de fora (P8).

`schedule.ts`: `scheduleIdOf(workflowId, version)` = `schedule_wf-<w>-v<n>`; ao publicar com
`SCHEDULE`, criar a da versão nova com o `requestContext` de `RunIdentity`, depois apagar a da
anterior; pausar, religar e apagar seguem o `state`; religar cria a agenda de novo com o `active_by`
de agora. O limite de 30, em `cadence.ts` e `automations/public.ts`: `activeOfCompany(mastra,
companyId)` soma as agendas da Automação de `atLimit` e as de `schedules.list({ status: 'active' })`
cuja id começa por `schedule_wf-` e cujo `requestContext.companyId` é a empresa; a U4 acrescenta
`schedule_look-` à mesma soma (critério 44). `atLimit` e a publicação de um workflow usam a mesma
soma. O limite conta agendas ativas, como `atLimit` conta hoje (`builder/automations/automations.ts:107-114`),
pela razão de `cadence.ts:5-9` (cada automação ativa pode mandar um e-mail por dia): um workflow
`MANUAL` ligado não tem agenda e não conta. `runs.ts`: a porta `TestInput`
(`latest(workflow): Promise<unknown | null>`), que a U4 enche para `CONNECTOR`; para os outros,
`{}`; `null` responde `WORKFLOW_TEST_NO_ITEM`.

**O teste.** `POST …/test`: `problemsOf` (um `ERROR` responde `WORKFLOW_HAS_PROBLEMS`); o
`FrozenWorkflow` do rascunho (os agentes e os usos pelas versões ativas agora, o declarado) em
`workflow.test_draft`; `run.cancel()` da execução de teste ainda aberta (a `workflow_run` `TEST` mais
nova, se o retrato não terminou); `addDynamicWorkflows(compiled({ kind: 'TEST', … }))`; `createRun()`
e `startAsync({ inputData: await testInput.latest(workflow), requestContext })`. Num `TEST`:
`notify.ts` não avisa e devolve `{ avisados: [] }`; `approval.ts` espera quem começou e não avisa;
`write.ts` lança `WORKFLOW_TEST_STOPPED_AT_WRITE` antes de chamar `mustAsk`; `agent.ts` roda
`workflowTurn` com `everyWriteAsks: true` e, no pedido de escrita, lança o mesmo código.

**O início do Hub** (`boot.ts`, por `afterWorkers`), para cada empresa de
`builder.companies_with_workflows()`: a agenda de uma versão que não é a ativa sai, e um workflow `ON`
com `SCHEDULE` sem agenda ganha a sua (a U4 faz o mesmo para `schedule_look-<gatilho>`); cada
`workflow_run_decision` aprovada cuja `attempt` é a de `workflow_run` e cuja execução ainda está
`suspended` naquele balão é retomada, e uma recusada nessa condição é cancelada. Nada marca execuções
`INTERRUPTED`: isso é decidido ao ler.

**O dono de cada fato.** O estado de uma execução: o retrato do Mastra, lido por `runs.ts`. A
empresa, a versão, quem responde e a tentativa: `RunIdentity` no `requestContext`, copiada em
`workflow_run`. Quais execuções um workflow tem: `workflow_run`. Uma resposta:
`workflow_run_decision`. A espera: o `suspendPayload`. O modelo: `builder/automations/runs.ts` e
`run.ts` (o desfecho como união, C21).

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/server/src/builder` (`@mastra/core`, `@mastra/pg`,
`@mastra/memory`: a skill `mastra`, com `dist/docs/references/` primeiro:
`reference-workflows-run-methods-{resume,cancel,restart,timeTravel}.md`,
`docs-workflows-scheduled-workflows.md`, `docs-workflows-snapshots.md`), `apps/server/src/hub`
(`react-email` para o e-mail), `apps/server/src` (`fastify`, `drizzle-orm`), e
[testing](../guides/testing.md) T20 (o relógio injetado).

### A ordem do trabalho

1. **As duas provas, antes de tudo.** (a) O agente fixado: com o registro do próprio Hub
   (`versionOf` e a montagem por turno de uma versão publicada que não é a ativa), num processo: o
   turno, o pedido de escrita, o workflow suspenso; num Hub novo ao lado do mesmo banco:
   `approveToolCall` nessa versão, `APPROVED_CALL` chegando à ferramenta de escrita e `approvedBy`
   gravado na linha de `connector_write` com `where: RUN`. Fica como o caso "o agente que escreve"
   depois do reinício (critério 12). (b) O **Usar outro workflow** publicado: um workflow com um
   `USE` de outro que tem um `APPROVAL`, publicado pela U1, espera, e num Hub novo a resposta retoma
   com `step` igual aos segmentos (critério 41). Se uma das duas falhar, parar (abaixo).
2. **O primeiro PR**, sozinho: `notifications.ts:122` com `onConflictDoNothing()` sem alvo e a
   migração `e246_notification_workflow` (só acrescenta, com `-- contract:`), com um teste de que o
   aviso da Automação continua um por execução; `npm run migrations`. O resto da U3 é o segundo PR,
   que só entra depois de a imagem do primeiro estar no ar; nele, as migrações `e246_workflow_run`
   (com permissões e espelho) e `e246_notification_run_key_drop`, e o alvo novo em
   `notifications.ts:122`. Regras: D6, D11.
3. `run-identity.ts`; `balloons/check.ts`: `identityOf`, o `INSERT` em `workflow_run`, a
   reconferência, e na falha `state = PAUSED_OWNER`, `schedules.pause`, o aviso `WORKFLOW_PAUSED` e a
   `Failure` `WORKFLOW_OWNER_CANNOT_RUN`; no caminho de um `USE`, só a versão fixada. Regras: C27, S7,
   S8, S9.
4. `hub/notifications`: a porta `workflowNoticed` com `subject_key`; `balloons/read.ts`,
   `balloons/notify.ts`, `balloons/approval.ts` (suspende com `APPROVAL`, avisa `WORKFLOW_WAITING`; na
   retomada devolve `{ aprovado, por }`); o aviso `WORKFLOW_FAILED` antes de cada ferramenta lançar.
5. `balloons/write.ts`: sem `resumeData`, `mustAsk`; `ASK` suspende com `WRITE` e avisa; `DO` envia
   com a chave `<endereço>#<tentativa>`; cada resposta como a tabela de cima. Com
   `resumeData.approved`, envia com `approvedBy`.
6. `frozen.ts` (`versionOf`), `registry.ts`, `open.ts` e `public.ts` (os quatro de cima);
   `balloons/agent.ts`: o Assistente como `run.ts:112-142`; o publicado abre a conversa, chama
   `workflowTurn`, **drena o stream inteiro**, e só então, se viu um `tool-call-approval`, suspende
   com `AGENT_WRITE` e avisa; na retomada, `approveCall` e drena de novo (o agente pode pedir outra
   escrita: suspende de novo com o `toolCallId` novo). O começo:

   ```text
   output = alive.workflowTurn({ versionNumber: frozen.agents[b].versionNumber, answeredBy, call: { runId, balloon, attempt, iteration: '' }, … })
   asked = nenhum
   para cada pedaço de output.fullStream: se pedaço é 'tool-call-approval': asked = pedaço.payload
   // só depois de drenar (P11: antes, a retomada falha com AGENT_RESUME_TOOL_CALL_NOT_SUSPENDED)
   se asked e TEST: lança WORKFLOW_TEST_STOPPED_AT_WRITE
   se asked:
     tool = a PresetFrozenTool 'tool_<slug>' = asked.toolName da versão fixada (versionOf); sem ela: lança NOT_IN_ROLE
     ask = mustAsk({ companyId, choice: tool.approval, author: { kind: 'PUBLISHED', answeredBy }, scope, where: { kind: 'RUN', runId }, target: targetOf(lugar, tool) })
     reason = ask.kind == 'ASK' ? ask.reason : 'CHOSEN'
     approver = reason == 'PUBLISHER_LOST_RIGHT' ? answeredBy : approverOf(b.approver)
     avisa WORKFLOW_WAITING a approver
     return context.workflow.suspend({ kind: 'AGENT_WRITE', balloon, approver, reason, agentRunId: output.runId,
       toolCallId: asked.toolCallId, connectionId: tool.connectionId, operation: tool.operation, fields: asked.args })
   return { texto, conversationId }
   ```

7. `schedule.ts` e `activeOfCompany`; o #754: o teste da agenda recebe o relógio injetado (T20).
8. `snapshot.ts`; `runs.ts` e `run-routes.ts`: a
   lista (sem `TEST`), a vista, `answer` (`mayApprove` num `WRITE` e num `AGENT_WRITE`; o `INSERT` da
   decisão com a tentativa; aprovada, `resume({ step, resumeData })`; recusada, `cancel()`, nunca o
   agente), `retry` (o `UPDATE … WHERE attempt = <a lida>`, depois `timeTravel({ step,
   requestContext })` ou `restart({ requestContext })` com só `attempt`), `run`, `pause`, `resume`,
   `test`. Regras: C63, C65.
9. `boot.ts` (agendas e decisões); `release.ts` (as agendas, `deleteWorkflowRunById` de cada execução,
   porque guardam a entrada, como `builder/automations/release.ts:22-35`; `active_by` e
   `workflow_run.answered_by` nulos quando a pessoa sai); `GET BASE`.

### Como se prova

Critérios 9 a 22 e 41, com o dublê do Sankhya, o modelo de mentira (`stepped`, da 24.5.1) e o
relógio injetado; os critérios 12, 14, 18 e 41 abrem um segundo Hub ao lado do mesmo banco. O
critério 12 falha hoje porque `registry.resolve` só monta a versão ativa
(`builder/agents/registry.ts:120-135`) e porque a escrita do agente grava no livro da conversa, e não
no da execução (`builder/agents/tools.ts:153-157`); dentro de um balão a conversa existe, então
`CONNECTOR_WRITE_NO_CONTEXT` (`:150`) não é o motivo; o 13, porque `notification_run_key` recusa o segundo aviso da execução.

### Parar se

- A prova (a) falhar: `approveToolCall` num processo novo não achar a corrida do agente montado por
  turno para uma versão que não é a ativa, ou `APPROVED_CALL` não chegar à ferramenta: parar e
  relatar com a saída; não registrar a versão no Mastra por fora, e o critério 12 não passa a should
  sem o cartão.
- A prova (b) falhar (a retomada dentro do caminho de um `USE` não achar o balão, ou o caminho com
  `conferir` no começo não rodar): parar e relatar com a saída; o `USE` não passa a apontar para a
  definição do outro sem o cartão.
- A correção da 24.5 do turno que entrar não tiver `number` e `answeredBy` no `AgentRun`, ou levar
  quem responde por outra via: relatar; a U3 não cria um segundo canal.
- Rodar a versão fixada no thread aberto por `openWorkflowConversation` brigar com o controlador do
  agente (a sessão segura o thread): relatar com a saída; não abrir um segundo formato de conversa.
- Um agente que, aprovado, pede outra escrita na mesma tentativa suspender de novo e a segunda
  decisão não chegar à segunda chamada (a chave é `(run_id, balloon_id, attempt, iteration, call)`,
  e o aviso usa `subject_key` `<endereço>#<tentativa>#<toolCallId>`): relatar com o teste.
- O pedaço `tool-call-approval` do 1.82 instalado não trazer o nome da ferramenta ou os argumentos
  (a prova P11 leu o `toolCallId`): relatar com a saída; não tirar o motivo de outro lugar sem o
  cartão.
- Retomar sem `step` não achar o balão dentro de um caminho no Hub, ou uma execução cortada dentro de
  um caminho não terminar com `restart()` (a prova P7 cortou fora de um caminho): relatar com a
  saída; não escrever uma retomada nossa.
- `listWorkflowRuns` não aceitar `status` no 1.82 instalado (só `workflowName`, `resourceId` e
  `perPage` são usados hoje): relatar; `waitingCount` não passa a ler `workflow_run` com um estado
  nosso sem o cartão.
- `mastra.schedules.create` não guardar o `requestContext` no 1.82 instalado (a prova P12 o leu; o
  código de hoje não o usa): relatar com a saída.
- Uma execução com `USE` dentro de `USE` passar das 50 chamadas do turno
  (`CONNECTOR_CALLS_PER_TURN`, `builder-port.ts:22`): relatar; o teto não muda sem o cartão.
- O Mastra recusar `restart` de uma execução que o Hub julgou fora da posse: relatar; o tempo da
  posse não muda sem o cartão.

## U4 O gatilho do kit e a caixa de eventos

**Base e modelo.** A U3 no `main`. Sonnet: a forma do gatilho é a do estudo de gatilhos (5.1 a 5.3),
a corrida de duas olhadas é resolvida pela chave da caixa e pela trava curta da admissão, e as
regras estão fixas aqui.

### As linhas da tabela

- **O gatilho no kit.** O estudo de gatilhos, 5.1: o conector declara (`look` obrigatório, `listen`
  da 20.2), o workflow escolhe, o Hub guarda o estado; o conector não sabe nada de workflow. O kit
  hoje: `Connector` com `writes` (`packages/connectors/src/kernel/definition.ts:44`),
  `defineConnector` (`:62-87`, com as conferências `assertWritesWrite` e `assertCheckStandsAlone`),
  `declaredOf` (`:89-92`); `Operation` (`kernel/operation.ts:139`) e `defineOperation`
  (`:159-168`); a conformidade (`kernel/conformance.ts:306-336`, um `it` por regra, o das escritas
  em `:324`).
- **A leitura do Sankhya.** A porta `carregar` (`packages/connectors/src/sankhya/door.ts:69-100`,
  o `loadRecords` com `criterio` de `expressao` e `parametros`, uma página por chamada) e o pedido
  `gatewayRequest`, privado em `door.ts:13-20`; `pedidos` e `notasFiscais`
  (`sankhya/operations/vendas.ts:17-30,35-46`, a REST de vendas, sem tipo de operação nem "desde");
  `sankhyaWrites` (`operations/index.ts:56`) é o molde da lista de gatilhos; a definição em
  `sankhya/definition.ts:79-82`. O dublê: `fake-data.ts:58-64` só tem `Empresa`, e o `loadRecords`
  do dublê ignora `criteria` e `offsetPage` (`fake-data.ts:84-105`).
- **A agenda da olhada.** Como a 24.2 (`builder/automations/automations.ts:166-179`): uma agenda por
  gatilho, `schedule_look-<gatilho>`, sobre o workflow fixo `conexus-trigger-look`, com
  `inputData: { triggerId }` e `requestContext` com `companyId`. O id fixo é um contrato guardado,
  como `AUTOMATION_WORKFLOW` (`builder/automations/run.ts:22-27`): renomeá-lo deixa as agendas sem
  alvo. Ele entra ao lado de `AUTOMATION_WORKFLOW` em `conversations-of.ts:167`.
- **Por onde a olhada lê.** Pela mesma porta do balão `READ` (U3): `connectors.assistant.read` com o
  `SessionScope` de quem ativou a versão (`active_by`), `speaksAs` `WORKFLOW` e o declarado da
  versão ativa, que inclui a leitura do gatilho (U1, `FrozenWorkflow.declared`). Cada olhada tem o
  seu `TurnKey`, um `randomUUID()` novo por olhada (`hub/connectors/scope.ts:22-23`): a conta das 50
  chamadas é por chave (`CONNECTOR_CALLS_PER_TURN`, `hub/connectors/builder-port.ts:22`, contada por
  `createSpending` em `:56-69`), então uma olhada não divide as 50 com outra olhada nem com uma
  execução.
- **A trava.** Nenhum `SKIP LOCKED` no servidor hoje; o único `FOR UPDATE` é
  `builder/agents/publish.ts:351`. O Drizzle instalado escreve `.for('no key update', { skipLocked:
  true })` (a leitura do runtime, inferido da API).
- **O relógio.** Uma porta `now: () => Date` nas dependências de `trigger.ts`, a de verdade em
  `main.ts`, a injetada nos testes (T20).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Cria `trigger.ts`; muda `definition.ts` (`triggers?` e a conferência), `conformance.ts` (um `it`), `index.ts` (exporta) | o Sankhya, `hub/connectors/` |
| `packages/connectors/src/sankhya/` | Muda (`door.ts`: exporta `gatewayRequest`; `operations/vendas.ts`: a leitura `orcamentosNovos`; `operations/index.ts`: `sankhyaTriggers`; `definition.ts`: `triggers`; o dublê: as notas de orçamento, o filtro do `loadRecords` e a consulta recusada, #819) | `hub/connectors/` |
| `apps/server/src/hub/connectors/` | Muda (`public.ts`: os gatilhos do kit pela porta do Builder, para `World.triggersOf` e o catálogo da U5) | a U1, a U5 |
| `apps/server/src/builder/workflows/` | Cria `trigger.ts` (a olhada, a admissão, o aviso), `trigger-tables.ts`; muda `publish.ts` (a linha do gatilho ao publicar), `schedule.ts` (as agendas de olhada), `runs.ts` (`TestInput`), `boot.ts`, `release.ts`, `routes.ts` (`WorkflowView.trigger`) | `builder/mastra/` |
| `apps/server/src/builder/automations/` | Muda (`cadence.ts`: `activeOfCompany` soma também as agendas `schedule_look-*` da empresa) | `schedule.ts` |
| `apps/server/src/conversations-of.ts`, `apps/server/src/main.ts` | Muda (o workflow fixo; a porta `now`) | — |
| `apps/server/migrations/`, `apps/server/database-grants.sql` | Cria `<ts>_e246_workflow_trigger` e `<ts>_e246_workflow_trigger_grants` | o catálogo |
| `apps/server/src/platform/catalog.test.ts` | Muda (o retrato do catálogo) | — |
| `docs/reference/boundaries.md` | Muda (a entrada "the trigger remembers what it has seen", `:1266-1283`, reescrita para o desenho novo: `trigger.ts`, `workflow_trigger`, `trigger_event`, as decisões `T1a`, `T2c` e `T8a`) | a revisão |

### Os contratos que a unidade cria

Em `packages/connectors/src/kernel/trigger.ts` (a forma do estudo de gatilhos, 5.1, com o mesmo
nome `input` para o que o workflow escolhe, sem `listen`, que é da 20.2):

```ts
export const TriggerId = z.string().regex(/^[a-z][a-zA-Z0-9]{1,39}$/).brand('TriggerId')
/** Os modos de olhar que o conector oferece; o primeiro é "novo pelo número que cresce" (T3). */
export const LookMode = z.enum(['NEW_BY_ID'])
export type Trigger<C, I, Row> = Readonly<{
  id: TriggerId                       // 'orcamentoNovo'
  label: string                       // "Orçamento novo", o balão Gatilho
  summary: string                     // a frase para o Construtor
  input: z.ZodType<C>                 // o que o workflow escolhe: os tipos de operação (Trigger.input do rascunho)
  row: z.ZodType<Row>                 // a entrada de cada execução: os campos de {{gatilho.campo}}
  look: Readonly<{
    mode: z.infer<typeof LookMode>
    read: Operation<I, unknown, 'read'>   // uma leitura do próprio conector
    latest(input: C): I                    // o item mais novo: a primeira olhada e o teste
    /** Os itens depois do cursor; cursor nulo é "desde o começo" (NEW_BY_ID, o lastItem do estudo). */
    since(input: C, cursor: string | null, page: number): I
    rowsOf(answer: unknown): readonly Row[]   // as linhas, em ordem crescente de chave
    more(answer: unknown): boolean            // há outra página
  }>
  keyOf(row: Row): AccountRef         // a chave única do item, a forma de AccountRef
  cursorOf(row: Row): string          // o valor que avança; em NEW_BY_ID, o número em texto (/^[0-9]+$/)
}>
export function defineTrigger<C, I, Row>(t: Omit<Trigger<C, I, Row>, 'id'> & { id: string }): Trigger<C, I, Row>
```

`Connector` ganha `triggers?: readonly Trigger<unknown, unknown, unknown>[]`; `defineConnector`
recusa, ao carregar, um gatilho cuja `look.read` não é uma leitura de `operations` do próprio
conector, ou duas ids iguais; a conformidade confere, com o dublê, que a leitura existe, é `read`,
que `keyOf` dá uma chave válida e que, num `NEW_BY_ID`, `cursorOf` dá um número em texto para cada
linha (critério 42), porque a olhada compara cursores como número.

O Sankhya: `orcamentoNovo`, `mode: 'NEW_BY_ID'`, `input: z.object({ tipos:
z.array(Code).min(1).max(20) })` (`Code` de `operations/shared.ts`), sobre a leitura nova
`orcamentosNovos` (classe `read`, `idempotent: true`, subject `vendas`), que lê `CabecalhoNota` pelo
`gatewayRequest` do `loadRecords` com o critério dos tipos e do número maior que o cursor, em ordem
crescente de número; `since` com o cursor nulo não põe o filtro do número; `latest` pede o maior
número dos tipos. A linha: `{ numero, tipo, data, valor, cliente }`; `keyOf` e `cursorOf` são o
número em texto. O 20 de `max(20)` é só um teto de esquema contra um corpo absurdo (acima dele,
`REQUEST_MALFORMED`), como `BALLOONS_SCHEMA_MAX`, e não uma regra de produto. A leitura nova é comum: o agente e o Construtor também a veem.

Tabelas (esquema `builder`, D11), em `builder/workflows/trigger-tables.ts`:

- `workflow_trigger(id uuid pk, company_id text not null, workflow_id uuid not null unique fk
  workflow on delete cascade, connection_id text not null, trigger_key text not null, cursor text
  null, last_ok_at timestamptz null, failing_since timestamptz null, last_error text null)`; uma linha
  por workflow com gatilho de conector publicado. Permissões `SELECT, INSERT, DELETE` e `UPDATE
  (connection_id, trigger_key, cursor, last_ok_at, failing_since, last_error)`.
- `trigger_event(trigger_id uuid fk workflow_trigger on delete cascade, company_id text not null,
  item_key text not null, row jsonb not null, received_at timestamptz not null, run_id text null,
  started boolean not null default false, unique (trigger_id, item_key))`. Permissões `SELECT,
  INSERT, DELETE` e `UPDATE (run_id, started)`. `row` é lido de volta pelo esquema `row` do gatilho
  (C27).

**Ao publicar** (`publish.ts`, na mesma transação da U1): com um gatilho `CONNECTOR`, um `INSERT …
ON CONFLICT (workflow_id) DO UPDATE` da linha do gatilho; o `cursor` e `last_ok_at` ficam como
estão, salvo quando a ligação ou o gatilho mudam, e então voltam a nulo; depois do `COMMIT`, a agenda `schedule_look-<id>`
com o `cron` de `everyMinutes` (5, 15 e 30: `*/N * * * *`; 60: `0 * * * *`) e o fuso
`AUTOMATION_TIMEZONE`. Religar zera o cursor e `last_ok_at` e recria a agenda; pausar a pausa; apagar o workflow
apaga a agenda, e o `on delete cascade` apaga as linhas.

**A olhada** (`conexus-trigger-look`, um passo de ferramenta que chama `look(triggerId)` em
`trigger.ts`):

```text
look(triggerId):
  t = a linha do gatilho; w = a linha do workflow (active_version, active_by, state); sem t, ou w não ON: sai
  confere active_by por ownerMayRun, a mesma função de conferir (U3: manageAutomations, na empresa, a leitura do gatilho no papel); senão:
    w.state = PAUSED_OWNER, pausa a agenda, avisa WORKFLOW_PAUSED, sai
  turno = um TurnKey novo, só desta olhada
  se t.last_ok_at é nulo:                               // T5a: a primeira olhada marca o agora, também sem nenhum item
    resposta = lê latest(input); falhou: passagem para FAILING (abaixo); sai
    numa transação curta, com a mesma trava de baixo (sem linha: outra olhada marca, sai):
      cursor = cursorOf(do mais novo) pelo mesmo GREATEST de baixo, ou fica nulo se não há nenhum; last_ok_at = now
    passagem para READING (abaixo); sai sem disparar nada
  página = 0
  repete:
    resposta = lê since(input, t.cursor, página) pela porta de leitura, fora de qualquer trava (D22)
              // cursor nulo depois da primeira olhada: não havia nenhum item, e a leitura é desde o começo
    falhou: passagem para FAILING (abaixo); sai sem andar o cursor
    linhas = rowsOf(resposta)
    numa transação curta:
      SELECT … FROM workflow_trigger WHERE id = t FOR NO KEY UPDATE SKIP LOCKED; sem linha: outra olhada admite, sai
      INSERT INTO trigger_event (cada linha, keyOf) ON CONFLICT (trigger_id, item_key) DO NOTHING
      cursor = GREATEST(cursor::numeric, cursorOf(da última linha)::numeric)::text   // NEW_BY_ID: nunca volta
      last_ok_at = now
    se não more(resposta): para; senão página += 1
  passagem para READING (abaixo)
  começa os eventos com started = false, os mais antigos primeiro, até LOOK_STARTS_MAX
```

**Começar um evento**: a id é `trg_<gatilho>_<chave>`; se `getWorkflowRunById` já acha essa
execução no Mastra (o Hub morreu entre começar e marcar), só marca `started`; senão `createRun({ runId
}).startAsync({ inputData: row, requestContext: RunIdentity })` na versão ativa, com `startedBy:
'TRIGGER'`, o rótulo do item ("Orçamento nº <número>" no Sankhya, de um `labelOf(row)` do gatilho) e
`answeredBy` = `active_by`, e marca `started` e `run_id`. `LOOK_STARTS_MAX = 20`, o teto por volta da
proposta do estudo de gatilhos (5.3), com o número pela aprovação desta página.

**A passagem** (`T6a`): `UPDATE workflow_trigger SET failing_since = now(), last_error = <código>
WHERE id = t AND failing_since IS NULL RETURNING id`; só quem recebeu a linha avisa o dono
(`WORKFLOW_TRIGGER_FAILING`, sino e e-mail, `subject_key` a hora da passagem). Na volta, o inverso com
`failing_since IS NOT NULL`, e o aviso `WORKFLOW_TRIGGER_BACK`. A falha também imprime
`WORKFLOW_TRIGGER_FAILED` com o gatilho e o código. `WorkflowView.trigger` lê a linha: `FAILING`
com `failing_since`; senão `WAITING_FIRST` com `last_ok_at` nulo (nunca olhou: o cursor nulo sozinho
só diz que não havia item); senão `READING`. A passagem avisa em toda primeira falha com
`failing_since` nulo, também a de uma primeira olhada (critério 43).

Duas olhadas sobrepostas (a agenda e um disparo atrasado) leem as duas; a que leu antes de a outra
gravar admite de novo itens que a chave única já tem, e o `GREATEST` não deixa o cursor voltar para a
página mais cedo que ela leu (o `lastItem` do estudo de gatilhos).

**O item do teste** (`TestInput` para `CONNECTOR`): `latest(input)` pela mesma porta, a linha mais
nova, sem gravar nada em `trigger_event`; nenhuma, `null` (`WORKFLOW_TEST_NO_ITEM`, critério 37).

**O início** (`boot.ts`): um workflow `ON` com gatilho de conector sem agenda ganha a sua; a agenda
de um gatilho cujo workflow não existe mais sai.

**O dono de cada fato.** O que pode ser gatilho: o kit (`Connector.triggers`). Até onde o Conexus
olhou: `workflow_trigger.cursor`. O que já entrou: `trigger_event`. A saúde: `failing_since` e
`last_ok_at`. O modelo: `builder/automations/automations.ts` (a agenda) e
`hub/connectors/write-record.ts` (a chave como deduplicação).

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/server/src/builder` (`@mastra/core`: `mastra`,
`docs-workflows-scheduled-workflows.md` primeiro), para `apps/server/src` (`drizzle-orm`, para o
`for('no key update', { skipLocked: true })`) e para `packages/connectors` (as suas linhas e o padrão
do kit, L27); [testing](../guides/testing.md) T20 e T26; a documentação pública do Sankhya
(`developer.sankhya.com.br/llms.txt`) para o `loadRecords`.

### A ordem do trabalho

1. `kernel/trigger.ts`, `definition.ts` e a conformidade, com os testes do kit (critério 42).
2. `orcamentosNovos` e `orcamentoNovo` no Sankhya, e o dublê (as notas de orçamento com tipo e
   número, o filtro do `loadRecords` por tipo e por número, a ordem, a consulta recusada, #819). A
   gravação T26 da leitura no Sankhya de verdade fica para o fundador, no fim.
3. As migrações com as permissões e o espelho (D11); `npm run migrations`.
4. `trigger.ts`: a olhada, a admissão, começar os eventos, a passagem; a linha e a agenda ao
   publicar, pausar, religar e apagar; o workflow fixo; o início; `TestInput`; `WorkflowView.trigger`.
5. A porta dos gatilhos do kit para `World.triggersOf` (U1) e para o catálogo (U5).
6. A entrada de `boundaries.md` (`:1266-1283`), reescrita: a mão é `trigger.ts`, `workflow_trigger`
   e `trigger_event`; a prova, os critérios 23, 24, 43 e 46; a palavra, `T1a`, `T2c` e `T8a`.

### Como se prova

Critérios 23 a 25, 37, 42 a 44 e 46, com o dublê e o relógio injetado. Falham hoje porque não há
gatilho de conector.

### Parar se

- O `loadRecords` do Sankhya não aceitar, num critério, o número maior que um parâmetro junto com os
  tipos, ou não devolver em ordem crescente de número: relatar com a página da documentação; não
  usar `consultar` com SQL escrito pelo modelo, e não ordenar no Hub uma página que veio fora de
  ordem.
- Os nomes dos campos de `CabecalhoNota` (o número, o tipo de operação, a data de negociação, o
  valor, o cliente) forem outros na gravação do fundador: ajustar só o nome, e dizer no relatório.
- O Drizzle instalado não escrever `FOR NO KEY UPDATE SKIP LOCKED`: relatar com a saída; não
  trocar por `FOR UPDATE` sem o cartão.
- Uma olhada com muitas páginas passar das 50 chamadas do turno (`CONNECTOR_CALLS_PER_TURN`): a
  olhada para, o cursor fica na última página admitida e a seguinte continua; se a porta de leitura
  não deixar ver isso como `CALLS_SPENT`, relatar.

## U5 O Construtor monta

**Base e modelo.** A U3 no `main`; os gatilhos do kit entram no catálogo quando a U4 estiver no
`main`. Sonnet.

### As linhas da tabela

- O modelo é o Mastra Code: o desenho inteiro numa ferramenta que devolve os problemas
  (`mastracode/sdk/src/tools/workflows/create-workflow.ts:30-59` no `mastra@6e8dfcb8`); o activepieces
  grava mesmo inválido e diz o que falta (`ap-build-flow.ts:194-215` em `f34c43cd`); o Kiro escreve
  contra um vocabulário fechado e conserta com os erros, no máximo três vezes (o estudo do Kiro do
  fundador). As ferramentas de hoje do Construtor: `builder/construtor/tools.ts:104-238` (presas a
  `InProject`, `:227`; a chave de tentativa é o `toolCallId`, `:85-93`; a recusa `{ kind: 'REFUSED',
  code, field? }`, `:73-83`). O texto: `builder/construtor/prompt/construtor.md` (a regra 8, "Nunca
  publique", `:13`). A lista fechada: `CONSTRUTOR_TOOL` (`packages/hub-api/src/construtor.ts:17-26`)
  e `AVAILABLE_TOOLS` (`builder/construtor/construtor.ts:80-88,270-276`); a porta `automations`,
  preguiçosa (`construtor.ts:101-107`), é o molde da porta `workflows`. A linha de cada ferramenta na
  conversa: `CONSTRUTOR_SPECS` (`apps/web/src/builder/conversation/construtor-specs.ts:117`) e
  `tool-spec.ts`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/construtor/` | Cria `workflow-tools.ts`; muda `construtor.ts` (a porta `workflows`) e `prompt/construtor.md` | o controlador do Construtor |
| `packages/hub-api/src/construtor.ts` | Muda (as quatro ids em `CONSTRUTOR_TOOL`; `WorkflowRef`, ao lado de `ConstrutorResult`, `:29-39`) | a web |
| `apps/web/src/builder/conversation/construtor-specs.ts`, `tool-spec.ts` | Muda (a linha de cada ferramenta: ícone, frase, "N balões, M pontos a resolver") | a conversa |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/construtor.ts
CONSTRUTOR_TOOL.workflowCatalog = 'workflow_catalog'
CONSTRUTOR_TOOL.workflowRead = 'workflow_read'
CONSTRUTOR_TOOL.workflowSave = 'workflow_save'
CONSTRUTOR_TOOL.workflowTest = 'workflow_test'
/** O que workflow_read e workflow_save respondem ao modelo; a web abre o canvas por `workflow.id`. */
export const WorkflowRef = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('SAVED'), workflow: WorkflowView }),
  z.object({ kind: z.literal('STALE'), workflow: WorkflowView }),
  z.object({ kind: z.literal('REFUSED'), code: FailureCodeSchema, path: z.string().optional() }),
])
```

- `workflow_catalog({})` → `{ triggers: [{ kind: 'SCHEDULE' | 'MANUAL' } | { kind: 'CONNECTOR',
  connectionId, trigger, label, summary, input, fields, modes, every: [5, 15, 30, 60] }],
  connections: [{ connectionId, name, reads: [{ operation, label, summary, allowed, input }], writes:
  [a mesma forma] }], agents: [{ agentId, name, activeVersion, writes: boolean }], workflows:
  [{ workflowId, name, activeVersion, reads }], people: [{ personId, name, role }], balloonKinds:
  [{ kind, outputFields }] }`, do lugar do Projeto, com `allowed: false` no que o papel de quem
  conversa não usa. `balloonKinds` tem só as espécies desta etapa (as folhas, `IF` e `USE`); os
  gatilhos de conector vêm da porta da U4 e, antes dela, a lista tem só `SCHEDULE` e `MANUAL`.
- `workflow_read({ workflowId })` → `WorkflowRef` (`SAVED`).
- `workflow_save({ workflowId: WorkflowId | null, revision, draft: WorkflowDraft })` →
  `WorkflowRef`: `SAVED` com os problemas; `STALE` com o atual; `REFUSED` só quando o esquema recusa
  ou o teto de cima. `null` cria no Projeto, com a chave de tentativa do `toolCallId`.
- `workflow_test({ workflowId })` → `TestResult` (U3): `STARTED` com o `runId`, que o canvas ao lado
  acende como uma execução, ou `PROBLEMS`; a ferramenta não espera o fim.
- Nenhuma ferramenta publica, apaga ou pausa.
- O teto do conserto: o texto do Construtor manda parar depois de 3 `workflow_save` seguidos que
  ainda voltam com problema `ERROR` e perguntar à pessoa (`ask_user`); a ferramenta também conta, e
  na quarta seguida com `ERROR` responde `REFUSED` com `WORKFLOW_HAS_PROBLEMS` sem gravar. A conta é
  lida da conversa: os resultados das últimas chamadas de `workflow_save` no thread, pela memória do
  Mastra, desde a última mensagem da pessoa. As ferramentas de hoje não guardam estado por conversa
  (`tools.ts:85-93` só usa o `toolCallId`).

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/server/src/builder` (`@mastra/core`: `mastra`,
`createTool`; `@mastra/memory`, para ler as mensagens do thread) e `ai` (`node_modules/ai/docs/`), e
[security](../guides/security.md) para o que o modelo não escolhe (S7, S8, S9: a empresa, o
Projeto e a pessoa vêm da conversa).

### A ordem do trabalho

1. As quatro ids e `WorkflowRef` em `hub-api`; as linhas em `construtor-specs.ts` e `tool-spec.ts`.
2. `workflow-tools.ts`, chamando as portas da U1 (gravar, ler) e da U3 (testar, `TestResult`).
3. O texto: ler o catálogo primeiro; gravar o rascunho inteiro; ler `problems` e consertar cada um
   antes de dizer que terminou, no máximo 3 gravações seguidas com `ERROR`, depois perguntar;
   perguntar (`ask_user`) o modo de olhar e os tipos de operação do gatilho, a cadência quando a
   pessoa não disse (15 é o padrão), quem aprova, quem avisa, o valor; nunca inventar um tipo de
   operação, uma pessoa, um workflow ou uma operação; um `WRITE` só se a pessoa pediu, e em
   **Pergunta antes** salvo ela dizer outra coisa; nunca publicar.

### Como se prova

Critérios 26 e 27, com o modelo de mentira (`stepped`, da 24.5.1) e, no 27, o modelo de verdade.

### Parar se

- O modelo de verdade não escrever o `IF` com os dois caminhos e o `USE` em três tentativas da
  avaliação: relatar com as saídas; não achatar o contrato sem o cartão.
- A memória do Mastra não deixar ler, de dentro da ferramenta, os resultados das chamadas anteriores
  do mesmo thread: relatar; o teto fica só no texto, e o critério 26 diz isso, só com o cartão.

## U6 O canvas

**Base e modelo.** A U3 no `main` (a U4 e a U5 podem entrar antes ou depois; sem a U4, o canvas
mostra o gatilho de conector só pelo rascunho). Sonnet.

### As linhas da tabela

- **A casca.** Mastra `packages/playground-ui/.../workflow-graph-canvas.tsx:91-124` (só leitura,
  `nodesDraggable=false` em `:100`); activepieces `flow-canvas/index.tsx:215-258` (`@xyflow/react`
  12.3.5, `nodeTypes` e `edgeTypes` fora do componente, `fitView` uma vez). Opções: `minZoom 0.5`,
  `maxZoom 1.5`, `nodesConnectable={false}`, `nodesDraggable` só num rascunho,
  `deleteKeyCode={null}`, `panOnScroll`, `ariaLabelConfig` em português; zoom e ajustar em três
  `Button`; sem `MiniMap`; a folha de estilo do `@xyflow/react` importada como arquivo do app, como
  `apps/web/src/main.tsx:2` importa `brand/tokens.css` (com `assetsInlineLimit: 0` em
  `vite.config.ts:21`). `biome.json:116-122` (`noInlineStyles`) recusa `style={{}}` no nosso código:
  a posição e o tamanho dos nós vêm do xyflow e das classes.
- **O arranjo.** activepieces `utils/layout-consts.ts:13-57`: cartões de tamanho fixo, espaço
  vertical fixo, os caminhos lado a lado sob o balão que os abre, e a junção depois; as arestas
  `ROUTER_START` e `ROUTER_END` (`flow-canvas/utils/types.ts:9-18`). Uma função pura e recursiva que
  devolve x e y de cada balão e de cada encaixe, sem medir o DOM. Sem `dagre`.
- **O balão.** Mastra `workflow-step-card-view.tsx:19-72,107,174` (`data-state`, `role=status`);
  activepieces `step-node/index.tsx:72-239`; as alças escondidas.
- **O "+".** activepieces `edges/add-button.tsx:19-132` (`EdgeLabelRenderer`, `nodrag nopan`).
- **Arrastar.** activepieces arrasta para um encaixe; no xyflow, `onNodeDragStop` e o encaixe mais
  perto, depois o arranjo de novo; o mesmo pelo teclado em **Mover para cima / para baixo**. Mover é
  gravar o rascunho inteiro pela rota da U1 (`PUT …/draft` com a `revision`): o servidor revalida e
  o canvas mostra os problemas que a nova ordem criou; a web nunca decide sozinha se a ordem serve.
- **O painel.** n8n `NodeDetailsView.vue:799-880` (os parâmetros, a entrada e a saída do nó); Mastra
  `workflow-data-inspector.tsx:13-34` (Esc fecha e devolve o foco); activepieces
  `step-settings/index.tsx`. O **Código** é `ui/code-block.tsx:4-7`, a caixa sem cor, com o balão do
  documento em JSON. A conversa de um balão de agente abre pelo link "Abrir a conversa", como
  `apps/web/src/builder/automations/text.ts:13`: o painel não monta `agent-chat.tsx`
  (`:75-142`), que tem o seu próprio `Beside`.
- **A execução acesa.** Mastra `use-persisted-workflow-run.ts:10-23`: `refetchInterval` de 5 s
  enquanto não terminou (TanStack Query, W10), como `apps/web/src/builder/automations/queries.ts:29-33`
  já faz; o intervalo vem de uma constante que o teste injeta (T20).
- **Os problemas.** Dify `header/checklist/index.tsx`; activepieces `incomplete-settings-widget.tsx:10-45`.
- **O cartão.** `apps/web/src/builder/conversation/approval-card.tsx` (227 linhas, do PR 841): a
  fonte de dados presa dentro (`useReply` em `:31-51`, `ApprovalCard` em `:177-226`, com a sala,
  `useApprove`, `WaitingCaption` e `ANSWERED`); `approval-item.ts`, `approval-fields.ts`,
  `approval-text.ts`; `builder-turn.tsx:7,91` usa o cartão; `conversation/public.ts:1-32` não o
  exporta.
- **Ao lado do Construtor.** `apps/web/src/builder/agents/construtor-chat.tsx:57-140` (o estado do
  agente aberto em `:68-70`, `openAgent` em `:76-83`, o `Beside` a partir de `:93` com `side` em
  `:99-103`); `builder/conversation/room.ts:57,59` (`openAgent`, `openedAgent`);
  `builder/conversation/tool-row.tsx:232-266` (`AgentLine`) e `:293` (o `DraftRef.safeParse`);
  `builder/conversation/beside.tsx:10-56` (no celular, `:21-40`, o lado vai num `Sheet` à direita,
  `:25-38`, com o título só para leitor de tela em `:32` e `className="p-0"` em `:34`; o `Sheet` da
  direita é de largura toda, `ui/sheet.tsx:23-24`, e a linha de cima reserva `SHEET_CLOSE_ROOM`,
  `:12`).
- **A lista.** `apps/web/src/builder/automations/automations.tsx:245-270` (a lista), `runs.tsx:30-52`
  (as palavras de estado), `queries.ts:58-62` (`hubMutation`).
- **Os testes.** `.dependency-cruiser.cjs:7-8` (`WEB_BUILDER_TESTS`, que não nomeia `workflows/`) e
  `:18-22` (`no-circular`); `apps/web/package.json:12` (`test:browser`, um arquivo por vez) e
  `package.json:37` (`e2e`, um arquivo por vez); `watchConsole` em `tests/e2e/live-hub.ts:217`; a CSP
  em `apps/server/src/platform/http.ts:39` e o teste que a trava em `http.test.ts:289-305`.

**A direção dos imports.** `workflows/` não importa `automations/`. `automations/automations.tsx`
importa de `workflows/public.ts` a linha do workflow e a consulta `workflowsQuery`, e a lista das
duas fica onde está. Assim `no-circular` não acusa nada.

**As peças**, em `apps/web/src/builder/workflows/`:

| Peça | Segue | Componentes do `ui/` | Arquivo |
| --- | --- | --- | --- |
| A casca: zoom, mover, encaixar ao abrir, só leitura numa execução | Mastra `workflow-graph-canvas.tsx:91-124`; activepieces `flow-canvas/index.tsx:215-258` | `Button`, `Tooltip` | `canvas.tsx` |
| O grafo e o arranjo, recursivos, a partir dos balões | activepieces `createStepGraph`, `buildRouterChildGraph`, `layout-consts.ts` | — | `model.ts`, `layout.ts` |
| O balão: ícone e palavra da espécie, título, quem, estado | Mastra `workflow-step-card-view.tsx:19-72`; activepieces `step-node/index.tsx` | `Card`, `Badge`, `Trace` | `balloon.tsx`, `kinds.ts` |
| A ligação com o "+" | activepieces `edges/add-button.tsx:19-132` | `Button`, `Popover` | `add-edge.tsx` |
| O **Se** com "se sim" e "senão" | Mastra `cards/condition`; activepieces `branch-label.tsx` | `Badge` | `branch.tsx` |
| O **Usar outro workflow**: o nome, a versão, **Abrir** | o balão de agente | `Card`, `Badge`, `Link` | `use.tsx` |
| O painel: quem é, configuração, o que recebe, o que devolve, código | n8n NDV; Mastra `workflow-data-inspector.tsx` | `ResizablePanel`, `Tabs`, `CodeBlock`; a 390 px, `Collapsible` | `panel.tsx`, `config.tsx` |
| A execução acesa | Mastra `use-persisted-workflow-run.ts:10-23`; Dify a borda por estado | `Badge` (palavra e ponto), `TraceLine` | `run-state.ts`, `run-view.tsx` |
| A lista de execuções | 24.2 `automations/runs.tsx` | `List`, `Badge`, `Pager` | `runs-list.tsx` |
| Os problemas | Dify checklist; activepieces `incomplete-settings-widget.tsx` | `Popover`, `List`, `Badge` | `problems.tsx` |
| O gatilho | activepieces `trigger-widget.tsx` | `Card`, `Badge`, `Marker` | `trigger.tsx` |
| O **Aprovar?** | Mastra `workflow-suspended-overlay.tsx`; o cartão da 24.5 | a peça do cartão | `approval.tsx` |
| O arrastar para outro encaixe | activepieces (dnd-kit, `useDraggable`) | — | dentro de `canvas.tsx` |
| No celular | o mesmo modelo em coluna, com os caminhos sob o seu rótulo | `List`, `Collapsible` | `train.tsx` |
| A página, as consultas, as rotas | W8, W10, W17 | `Frame`, `Block` | `page.tsx`, `queries.ts`, `public.ts` |

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/workflows/` | Cria as peças acima e os seus testes | as rotas, `construtor-chat.tsx`, `automations/` |
| `apps/web/src/builder/conversation/approval-card.tsx`, `approval-item.ts`, `approval-fields.ts`, `approval-text.ts`, `public.ts`, `builder-turn.tsx` | Muda (a peça `ApprovalCard` sem fonte, com `onAnswer`; o adaptador `ConversationApproval`, que `builder-turn.tsx` usa; a peça exportada) | a conversa, `workflows/approval.tsx` |
| `apps/web/src/builder/conversation/room.ts`, `tool-row.tsx`, `tool-row.test.tsx` | Muda (uma coisa aberta, `{ kind: 'AGENT' \| 'WORKFLOW', id }`, no lugar de `openAgent` e `openedAgent`; a linha clicável de `AgentLine` generalizada para um `WorkflowRef`) | `construtor-chat.tsx` |
| `apps/web/src/builder/agents/construtor-chat.tsx`, `construtor-card.test.tsx` | Muda (uma coisa aberta: agente ou workflow) | a rota do Construtor |
| `apps/web/src/builder/automations/` | Muda (`automations.tsx` e `text.ts`: os workflows na lista, por `workflows/public.ts`) | as rotas |
| `apps/web/src/routes/_app/companies/$companyId/projects/` | Cria `$projectId_.workflows.$workflowId.tsx` e `$projectId_.workflows.$workflowId.runs.$runId.tsx`, como `$projectId_.automations.$automationId.tsx` | o roteador |
| `apps/web/src/routeTree.gen.ts` | Muda (gerado) | o roteador |
| `apps/web/package.json`, `package-lock.json` | Muda (`@xyflow/react` 12.12.x, a versão exata; `package-lock.json` é o da raiz; `workflows.layout.test.ts` em `test:browser`) | — |
| `package.json` | Muda (`tests/e2e/workflow-canvas.test.ts` na lista de `e2e`) | — |
| `.dependency-cruiser.cjs`, `scripts/rules.test.ts` | Muda (`workflows` em `WEB_BUILDER_TESTS`, e um caso bom plantado) | `npm run deps` |
| `docs/reference/stack.md` | Muda (a linha do `@xyflow/react`, no mesmo PR) | `check-docs` |
| `docs/reference/screens.md` | Muda (as linhas das telas do workflow) | a revisão |
| `tests/e2e/` | Cria `workflow-canvas.test.ts` | — |

### Os contratos que a unidade cria

- `model.ts`: `type CanvasNode = { kind: 'TRIGGER' } | { kind: 'BALLOON'; balloon: Balloon; lane:
  readonly PathStep[] } | { kind: 'SLOT'; lane: readonly PathStep[]; index: number } | { kind:
  'JOIN'; after: BalloonId }`; `layout(draft: WorkflowDraft): { nodes: Positioned[]; edges: Edge[]
  }`, pura, recursiva e determinística. Nesta etapa ela desenha as folhas, o `IF` e o `USE`; um
  `PARALLEL`, `FOREACH` ou `LOOP` aparece como um balão fechado com o problema `BALLOON_KIND_LATER`.
- `run-state.ts`: `balloonStateWord(state: BalloonState): string` (esperando, rodando, feito,
  falhou, esperando você, pulado) e o tom do `Badge`; o estado é palavra e ponto, nunca só cor (V35).
- `queries.ts`: `workflowQuery`, `runQuery` com `refetchInterval: (q) => terminal(q.state.data) ?
  false : RUN_POLL_MS`, `runsQuery`, `workflowsQuery`; as mutações `create`, `saveDraft`, `publish`,
  `answer`, `retry`, `pause`, `resume`, `run`, `test` por `hubMutation` (as quatro últimas e
  `answer` respondem 202, e a tela relê a execução). Um teste é uma execução: o canvas ao lado do
  Construtor a acende pela mesma `runQuery`, e o seu **Aprovar?** é o `RunApproval`.
- O cartão de aprovação: `ApprovalCard` (a peça: a ação, os campos, o aviso de escrita aberta,
  **Aprovar** e **Recusar**, recebendo `onAnswer` e o estado) e dois adaptadores,
  `ConversationApproval` (o de hoje, com a sala e `useApprove`) e `RunApproval` (`answer` da U3).
- Os textos de falha usam `unconfirmedText` e o `titleOf` único da 24.5.1; nada de constante
  `UNCONFIRMED_*` nova.
- A linha nova de `docs/reference/stack.md`: `@xyflow/react` | `apps/web/src/builder/workflows` |
  `reactflow.dev/llms.txt`; README | none | Mastra `packages/playground-ui`
  `workflow-graph-canvas.tsx`; activepieces `flow-canvas` (`f34c43cd`, 12.3.5) | W22, decisão F | a
  folha de estilo é um arquivo do app; a atribuição fica como a licença diz.

**Os testes e as gravações.** Os testes da tela leem as respostas das operações do Hub, que são
formas nossas (`WorkflowView`, `RunView`), escritas como literais; nenhum literal de forma do Mastra
(`scripts/library-shapes.grit`). O canvas ao lado do Construtor usa as gravações de conversa que já
existem para a conversa e o resultado literal de `workflow_save` para a ferramenta.

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/web/src` (`react`, `@tanstack/react-router`: a
skill `router-core`; `@tanstack/react-query`), `apps/web/src/ui` (`@base-ui/react`, `@shadcn/react`:
a skill `shadcn`), `apps/web` (`vitest`, `@testing-library/react`, `msw`), `tests/e2e`
(`playwright-core`: a skill `playwright-cli`); [Impeccable](../reference/impeccable.md) para a tela;
[web](../guides/web.md) W8, W10, W17, W18, W22, W34.

### A ordem do trabalho

1. **A prova de CSP, antes de tudo.** Instalar `@xyflow/react` 12.12.x, montar uma página mínima com
   três balões servida pelo Hub de verdade, abrir no Chromium sem cabeça e ler o console por
   `watchConsole` ao abrir, arrastar e dar zoom: zero violações (critério 28, W22). Se houver uma,
   parar e voltar ao fundador com a decisão F; não relaxar a CSP nem mudar `http.test.ts`. A linha de
   `stack.md` no mesmo PR; `tests/e2e/workflow-canvas.test.ts` na lista de `e2e`.
2. As capturas das referências a 1280 e 390 px.
3. `model.ts` e `layout.ts`, com os testes, sem DOM; `workflows.layout.test.ts` em `test:browser`;
   `workflows` em `WEB_BUILDER_TESTS`.
4. `balloon.tsx`, `kinds.ts`, `branch.tsx`, `use.tsx`, `trigger.tsx`, `train.tsx` (o celular).
5. `canvas.tsx` com `add-edge.tsx` e o arrastar; `panel.tsx` e `config.tsx`; `problems.tsx`.
6. O cartão dividido (os testes do PR 841 passam sem mudar), `approval.tsx`, `run-state.ts`,
   `run-view.tsx`, `runs-list.tsx`, as rotas.
7. Ao lado do Construtor (`room.ts`, `tool-row.tsx`, `construtor-chat.tsx`); a lista de Automações
   por `workflows/public.ts`; `screens.md`.

### Como se prova

Critérios 28 a 36 e 45, e a QA da etapa (T25) pelo roteiro, a 1366 e a 390 px, nos dois temas.

### Parar se

- A prova de CSP mostrar uma violação: parar e voltar ao fundador com a decisão F.
- O toque a 390 px não mover o canvas, ou o canvas e a conversa não caberem a 1366 px: relatar com as
  capturas.
- O `Sheet` do `Beside` no celular não comportar a coluna com o painel aberto embaixo (o desenho
  pede o painel na própria coluna): relatar com as capturas; não abrir uma segunda gaveta nem trocar
  o `Beside` por abas sem o cartão.
- A divisão do cartão de aprovação pedir mudar uma asserção de um teste do PR 841: relatar com o
  teste.
