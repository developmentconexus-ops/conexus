# Etapa 24.5: Os agentes escrevem, com aprovação

O roteiro chama esta etapa de "24.5 Os agentes escrevem, com aprovação. Um agente ou app pede
"Aprovar?" antes de escrever (resposta B, 2026-10-18; leva a 20.1)". Ela vem depois de Papéis da
empresa, que o fundador pôs antes desta ("5. Sim", 2026-11-03), e se apoia nela inteira: o papel
diz **quem** usa uma operação, a liberação ao Projeto diz **onde**, e a versão do agente diz **se
ele pergunta** (Papéis, `D1` e `E4`). Papéis da empresa fechou no `main`, com as três unidades.
Cada linha citada foi relida no `main` em `1f5be4fb`, com `@mastra/core` 1.82.0, `@mastra/server`
1.82.0 e `@mastra/pg` 1.35.0; a emenda de 2026-11-07 foi escrita sobre o `main` em `50503a29`; a
segunda emenda de 2026-11-07 (as decisões `D1-a`, `D2-a` e `D3-a`, a rodada de textos e os pontos
não provados) foi escrita com a U1, a U2 e a U3 no `main` e o código das decisões na
https://github.com/developmentconexus-ops/conexus/pull/843. A terceira emenda, de 2026-11-08 (o
caminho de uma escrita, unidades U4 a U6), foi escrita sobre o `main` em `cfeb4e1b` e relida em
`e3ee6e06`, com a https://github.com/developmentconexus-ops/conexus/pull/856, e `@mastra/core`
1.82.0. O construtor de cada unidade reabre as linhas no `main` do dia.

## A página do fundador

**A emenda de 2026-11-08: a escrita recusada diz por quê.** No pedido de prova, o Sankhya recusou
o pedido e o agente não soube dizer a causa. O Conexus jogou fora a explicação do Sankhya antes de
entregá-la ao modelo, e o pedido não levava local de estoque nem controle. Depois desta emenda:

- o agente lê o estoque do produto, escolhe o local e lança o pedido com a nota modelo que você
  fixou na ferramenta; o modelo nunca escolhe a nota modelo, e um local que você fixar vale para
  todo item;
- se o Sankhya recusar, o modelo recebe a resposta inteira do Sankhya como falha da ferramenta, e
  o cartão diz que o sistema não aceitou e que nada foi lançado, com a mensagem do Sankhya como ele
  a escreveu, sem tradução;
- recarregar a conversa mantém o cartão como ele terminou, com "Aprovado por você".

A arquitetura e as pastas não mudam. Muda um fluxo (a falha volta como erro da ferramenta) e mudam
donos: o que é do Sankhya sai do Hub e da tela e vai para o kit. Entram uma decisão, a 0062, que
emenda a 0056 (https://github.com/developmentconexus-ops/conexus/pull/861), e duas regras nos
guias (https://github.com/developmentconexus-ops/conexus/pull/858), que entram quando a 24.5 fechar
(regra L20); até lá, este cartão leva o comportamento delas.

**O roteiro desta emenda.** Você é a Ana. O "Pedidos" é o do roteiro abaixo, com **Lançar pedido**
em **Pergunta antes**.

1. Em Ferramentas, abra **Lançar pedido**, ponha a nota modelo nos valores fixos (por exemplo
   `{"notaModelo": 12}`) e salve a versão nova. Na página do "Pedidos", marque a leitura
   **Estoque de um produto**, toque **Usar a versão 2** na linha de **Lançar pedido**, tire das
   instruções qualquer frase que peça a nota modelo à pessoa, e publique. Sem a nota modelo
   fixada, publicar é recusado e diz para fixá-la; e uma versão antiga que ainda deixa o modelo
   escolhê-la não lança nada.
2. Peça "lança um pedido para o cliente 1, duas unidades do produto 8 a R$ 10". A conversa mostra a
   leitura **Estoque de um produto** e depois o cartão, com a nota modelo, o cliente e cada item com
   o local e o lote, quando houver. Toque **Aprovar**: o agente diz o número, "a confirmar". Este
   passo é também a prova, no Sankhya real, de que os itens levam o que a API pede; se ele recusar,
   a frase dele diz o campo, e o cartão volta ao firstmate antes de outra unidade.
3. Recarregue a página. O cartão continua "Aprovado por você", e a linha da ferramenta diz que
   escreveu, não que consultou.
4. O pedido de prova seguinte, a sua resposta "Próximo": peça de novo o pedido que o Sankhya
   recusou, como você o pediu. Se o Sankhya recusar, o cartão diz que o sistema não aceitou e que
   nada foi lançado, com a frase do Sankhya, o agente diz a mesma causa sem inventar outra, e depois de recarregar o cartão
   continua assim. O firstmate grava essa resposta do Sankhya, com os valores trocados por
   inventados, no lugar da que o dublê tem hoje.

**As suas respostas de 2026-11-08, e o que mudou por elas.** Cada uma como você escreveu.

- **1.** "a gente tem que analisar o completo ... se a correção é mudar alguma arquitetura, fluxos,
  folder structure, alguma regra ... verificar também nosso parte de do package de conector ...
  como que a gente tem nosso padrão de erro". Analisado: o fluxo e os donos mudam, a arquitetura e
  as pastas não. O padrão de erro do kit passa a guardar a resposta inteira e a montar a mensagem
  dela, como as referências fazem (activepieces, Pipedream, n8n).
- **2.** "Proximo". O passo 4 do roteiro.
- **3.** "eu acho estranho a gente ter que ter uma nota modelo para lançar um pedido". A API oficial
  de pedidos (`POST /v1/vendas/pedidos`) exige a nota modelo: dela o Sankhya tira a empresa, a TOP e
  a natureza. O Sankhya em si não precisa dela; o serviço antigo `CACSP.incluirNota` recebe a TOP
  direto. Você escolheu a API oficial ("`D1` API oficial").
- **4.** "Sim" (guardar o corpo da recusa no registro). O registro guarda a resposta inteira de uma
  recusa, dentro do teto de 2 MiB que o executor já tem. A coluna nova de quem aprovou entra numa
  migração própria; aprovar esta página é a sua palavra para ela (regra D11).
- **5.** "a nossa ferramenta que tem que ter isso, concorda?" Concordo: o `lancarPedido` passa a
  levar local de estoque e controle por item, e o kit numera os itens.
- **`D1`** "API oficial", **`D2`** "gostei", **`D3`** "okay", **`D4`** "okay", **`D5`** "okay". A nota modelo
  fica fixa na ferramenta; o local vem da leitura do estoque, e quem configura pode fixar um, que
  vale para todo item; as
  duas regras e a decisão 0062, que emenda a 0056; as unidades U4, U5 e U6; nada de `RESERVA` agora.
- **`D6`** "Então, mas aí é que a gente tem que ver, porque se a gente for querer traduzir cada erro
  para cada conector, para cada erro, a gente teria que montar uma frase. Eu não sei se faz
  sentido ... ao invés de voltar ao erro original." Lido pelo firstmate: nenhuma tradução por
  conector ou por erro. O cartão e o modelo mostram a mensagem original do sistema, sob um rótulo
  só do estado. O rótulo vai à rodada de textos: "Recusado" já quer dizer "você recusou", então a
  proposta nomeia o sistema, "O {sistema} não aceitou. Nada foi lançado.".
- **`D7`** "depois". O X-Token fica para uma tarefa própria.

**Fica de fora desta emenda.** `RESERVA` (`D5`: espera um pedido de prova mostrar se falta); o
`CACSP.incluirNota` (`D1`); "Lançar pedido" duas vezes na página do agente, que vai como correção
avulsa; o rótulo de cada campo do cartão declarado pelo kit, que vem depois; as recusas gravadas do
Mercado Livre, que entram quando a primeira for gravada.

**No fim desta etapa** um agente seu lança um pedido de venda no Sankhya. Quando a ferramenta está
em **Pergunta antes**, você vê na conversa o pedido inteiro e só depois do seu **Aprovar** ele é
lançado. Quando está em **Faz sozinho**, ele lança e diz o número.

**O roteiro de uso.** Você é a Ana (dona). A ligação do Sankhya está liberada ao Projeto "Vendas",
e o agente "Pedidos" existe nele.

1. Na página do "Pedidos", selecione a ligação do Sankhya. Embaixo aparecem as ferramentas dela,
   nenhuma marcada, e no fim do grupo a escrita **Lançar pedido**, marcada "escreve". Marque-a. Na
   linha dela aparece a chave **Pergunta antes** (já escolhida) ou **Faz sozinho**. Publique.
2. Na conversa do "Pedidos", peça "lança um pedido para o cliente 1, duas unidades do produto 8 a
   R$ 10, no modelo de nota 12". Aparece o cartão **O Pedidos quer lançar um pedido no Sankhya**, com
   o cliente, os itens e o total. Toque **Aprovar**. O cartão passa a "Aprovado por
   você", e o agente diz o número do pedido, "a confirmar".
3. Peça outro pedido. Em vez de tocar no cartão, escreva "espera, são três unidades". O cartão passa
   a "Recusado porque você mandou outra mensagem", e o agente faz um cartão novo com três.
4. Toque **Recusar** nesse cartão. Nada é lançado, e o agente diz que não lançou.
5. Peça mais um, feche a página e abra a conversa de novo: o cartão continua esperando, e
   **Aprovar** funciona.
6. Volte à página do "Pedidos", mude **Lançar pedido** para **Faz sozinho** e publique. Peça um
   pedido: ele é lançado sem cartão, e a conversa mostra a linha da ferramenta com o número. Apague
   ou cancele os pedidos de teste pela tela do Sankhya.

**O que você faz, e quando.** Antes: nada. No começo: responde às decisões abaixo e aprova esta
página. No fim: faz o roteiro no Sankhya de verdade da sua empresa, diz o que viu e aprova os textos
das telas.

**As suas respostas ao rascunho de 2026-11-06, e o que mudou por elas.** Cada uma como você
escreveu.

- **A.** "quero entender melhor se não tem mastra nativo por causa de nossa decisão ou se tem outro
  caminho entendeu?" Era sintoma, e agora é o nativo. A perda de leituras vinha de um defeito do
  Mastra que aparece só quando ele **se aprova sozinho** na hora (o relatório da causa, issue
  #27831 do Mastra, fechada lá sem conserto). O caminho nativo tem dois pedaços: cada ferramenta diz
  por si se pergunta (`requireApproval` como função, que o Mastra trata como a palavra final dela) e
  o `yolo` fica desligado no controlador dos agentes. Assim uma leitura nem para, e uma escrita que
  pergunta espera você: medido, 0 de 200 perdidas. A `suspend()` do rascunho saiu.
- **B.** "se eu colocar um agente para ele ... conversar com uma pessoa no WhatsApp, ou eu quiser
  dar autonomia para ele, eu duvido que LangChain, Google, N8N e outros, eles não têm isso de ...
  dar autonomia, dependendo da coisa." Têm, e por ferramenta. É a sua `D1` de Papéis: cada
  ferramenta do agente tem a chave **Pergunta antes** ou **Faz sozinho**. Ler faz sozinho sempre.
  Escrever começa em "Pergunta antes", e só quem tem **Publicar agente que escreve sozinho** deixa
  uma escrita em "Faz sozinho": o Dono e o Administrador sempre, e o Desenvolvedor quando a empresa
  der a ação a ele (a sua `D1-a`, de 2026-11-07, abaixo). O Membro e os papéis próprios não a
  recebem, e pedir a ação para eles é recusado. O "sempre permitir" do rascunho saiu.
- **C.** "a gente tem que estar coeso a nossa plataforma inteira ... Também não pode querer criar
  uma coisa que não faz sentido em enrijecer." A escrita entra como mais uma linha de ferramenta, no
  mesmo lugar das leituras (a `E4`), com o mesmo teto (o papel de quem publica, a `C1`) e o mesmo
  funil que confere o papel em toda leitura. A liberação de escrita por Projeto do rascunho saiu da
  recomendação: seria um quarto lugar. Você decidiu sem ela (decisão `A`, "A1").
- **D.** "responder uma pergunta do Mercado Livre pelo agente depende muito de vir uma pergunta ...
  Poderia ser lançar um pedido no Sunker, que aí eu consigo deletar depois." A primeira escrita é
  lançar um pedido no Sankhya. Pela API, o pedido nasce "a confirmar"; desfazer pela API é
  **cancelar**, com um motivo, e um pedido faturado não cancela. Nesta etapa você apaga ou cancela
  pela tela do Sankhya; cancelar pelo agente vem depois, como mais uma escrita.

**O que o estudo mostrou** (2026-11-05 a 07, com modelo de mentira e Postgres local).

- **O caminho nativo pergunta e espera.** **Aprovar** roda uma vez; **Recusar** não roda; dois
  toques ao mesmo tempo rodam uma vez; uma mensagem sua recusa o pedido aberto; 20 conversas
  aprovadas ao mesmo tempo rodaram cada escrita uma vez.
- **Uma resposta no mesmo instante do cartão** (mais rápida que uma pessoa) pode deixar a conversa
  parada sem lançar nada, até a próxima mensagem; respondendo depois de ler, nenhuma perdida. É o
  defeito do Mastra; o relato está pronto e espera a autorização do firstmate.
- **Se o Conexus for atualizado enquanto um cartão espera**, o cartão não volta e o pedido não é
  lançado: você pede de novo. É o mesmo do cartão do plano do Builder hoje.
- **O Sankhya não tem chave contra repetição.** Se a resposta se perde depois do envio, o pedido
  talvez exista. O Conexus guarda cada envio antes de mandar, numa tabela nova, e nunca manda de novo
  a mesma chamada: diz que não sabe se lançou e põe na observação do pedido uma marca "Conexus" para
  você achá-lo. Aprovar esta página é também a sua palavra para as permissões dessa tabela (regra
  D11). As linhas dessa tabela não vencem nesta etapa e saem quando a empresa é apagada.
- **Um pedido sem resposta faz o agente perguntar.** Se um pedido foi enviado e não se sabe se
  entrou, e na mesma conversa vem outro pedido na mesma ligação (com os mesmos campos ou não), o
  agente pergunta antes, mesmo em **Faz sozinho**. O cartão traz uma linha a mais, por exemplo "Um
  pedido foi enviado às 10h12 e não sabemos se entrou. Confira no Sankhya pela marca Conexus 7F3A
  antes de aprovar." Isso vale enquanto a conversa existir: nesta etapa nada marca esse envio como
  conferido, e para escrever sozinho de novo você abre outra conversa. O texto final vai com os
  textos das telas.
- **O que as empresas fazem** (17 fornecedores, relidos para Papéis). Autonomia por ferramenta
  (OpenAI, LangChain, Google ADK, n8n, Copilot Studio, Agentforce, ServiceNow, Claude Code). O
  cartão mostra a ação e o que vai ser escrito. Quem aprova é quem está na conversa, e a autoridade
  é a do agente, dada por quem o montou (Copilot Studio, Agentforce): é a sua `C1`. Pela `D3-a`
  (abaixo), quem aprova precisa também poder usar a escrita no próprio papel. Hoje conversam com
  agentes o Dono, o Administrador e o Desenvolvedor; o Membro não chega à conversa de um agente.

**Fica de fora.**

- **O app que escreve** (a antiga 20.1). Usa o mesmo funil de escrita, numa etapa curta depois.
- **Escrever sem ninguém da empresa olhando** (uma automação, um cliente no WhatsApp ou Telegram).
  Pela `D1` de Papéis, ali uma escrita que pergunta não é oferecida; a 24.6 e a 24.7 decidem quem
  responde. Hoje nenhum agente roda sem uma pessoa da empresa na conversa.
- **O Assistente escrevendo num sistema.** Ele continua só lendo; o `yolo` dele não muda.
- **Uma regra por valor** ("até R$ 1.000 faz sozinho", a `D3` de Papéis) e um limite de escritas por
  resposta. Uma escrita conta nas 50 chamadas de conector de cada resposta, como uma leitura.
- **Cancelar o pedido pelo agente.** A API cancela com um motivo e não apaga; se cancela um pedido
  ainda "a confirmar" não está documentado. Vem depois, como mais uma escrita.
- **Editar os campos no cartão antes de aprovar.** Você recusa escrevendo o que muda, como no passo 3.
- **Um prazo para o cartão.** Nenhuma referência lida tem; ele espera até você responder, mandar
  outra mensagem ou parar a conversa.
- **Os avisos guardados para um cartão** (`next-card`): nenhum toca a escrita de um agente.

**A decisão sua nesta etapa.** Decidida em 2026-11-07: "A1".

- **A. Liberar a ligação ao Projeto deixa os agentes dele escreverem, ou a escrita pede uma
  liberação à parte?** Hoje "Liberar" é "Liberar para ler" (a sua `S1`), e o roteiro diz "Escrita
  nova pede nova liberação".
  - `A1` (decidida): não pede à parte. O papel já diz quem usa cada escrita, e uma escrita nova do
    kit chega só ao Dono e ao Administrador até você marcá-la em outro papel (`B1` de Papéis): é a
    "nova liberação" do roteiro. Caso real: o Claude Enterprise dá a cada papel os conectores e as
    ações, sem segundo lugar. Exemplo: a ligação do Sankhya já liberada ao "Vendas" serve ao
    "Pedidos" para lançar, se quem publica tem **Lançar pedido** no papel. Objetivo: três donos,
    nenhum repetido, como você pediu na C. Nativo: nada novo além da linha da ferramenta; o texto
    da confirmação de "Liberar" deixa de dizer que é só para ler.

**As suas respostas de 2026-11-07, ao registro de escritas, e o que mudou por elas.** Cada uma como
você escreveu.

- **O registro.** "1. Sim": a tabela fica como está neste cartão.
- **Por quanto tempo.** "3. Okay": as linhas não vencem nesta etapa.
- **Quando a empresa sai.** "A gente vai apagar, sim, mas o que eu preciso entender é o que é essa
  tabela, entendeu?" As linhas saem com a empresa, como a ligação e as conversas.
- **O pedido sem resposta.** "Sim, esse cuidado, mas eu quero entender como que você vai
  implementar isso corretamente. Essa é a minha dúvida. Eu aprovo, mas primeiro eu quero entender
  como que você vai implementar isso do Conexus verificar primeiro." Como fica: antes de cada
  escrita, o Conexus procura na mesma conversa um envio da mesma escrita que ficou sem resposta,
  com os mesmos campos ou não (com outros campos ele pode ser o mesmo pedido corrigido). Se acha, a
  ferramenta pede o cartão (a função `requireApproval` do Mastra, a mesma da chave), o cartão mostra
  o aviso com a hora e a marca, e o envio só sai depois do seu **Aprovar**. A conferência fica no
  Hub, num lugar só, e roda de novo na hora de mandar.

**As suas respostas de 2026-11-07, ao estudo dos papéis e da autonomia, e o que mudou por elas.**
Cada uma como você escreveu: "`D1` a `D2` a  `D3` a".

- **`D1-a`.** A ação **Publicar agente que escreve sozinho** é do Dono e do Administrador sempre, e
  do Desenvolvedor quando a empresa dá. O Membro e os papéis próprios não a recebem (a resposta B
  acima e o critério 17).
- **`D2-a`.** Uma escrita publicada em **Faz sozinho** volta a perguntar, na chamada seguinte,
  quando quem publicou a versão perde a ação, perde a escrita no papel ou sai da empresa. A versão
  não muda, e o agente não para: só passa a perguntar (critério 24).
- **`D3-a`.** Quem toca **Aprovar** precisa poder usar a escrita no próprio papel, e restaurar uma
  versão conta como publicar, com as mesmas conferências (critérios 25 e 26).

**A opção A, restaurar, decidida em 2026-11-08.** Sobre quem passa a responder por uma versão
restaurada (a: quem publicou na origem, b: quem restaurou) você disse: "Decisoes 24.5 / - por luna /
- b, mas me explica melhor". Fica a (b): quem restaura passa a responder pela versão ativa para a
`D2-a`. O como: uma coluna `agent.active_by`, gravada por `makeActive` (publicar, restaurar, publicar
de novo a revisão de uma versão) e lida por `publisherLeavesAlone`; `agent_version.published_by` não
muda, porque a versão é imutável e a lista de versões mostra quem a publicou; quem sai da empresa
perde `active_by` como hoje perde `published_by`; a migração preenche `active_by` com o
`published_by` da versão ativa de cada agente. Exemplo: Ana publica a v1 em **Faz sozinho**, Bruno
publica a v2 e restaura a v1; se Ana perde a ação, a escrita continua rodando sem cartão, e se Bruno
perde a ação, ela pergunta (critério 25).

**Os pontos que o estudo deixou sem prova, e a sua palavra.** Sobre eles você disse: "1. aceito 2.
Ok, mas isso daí é uma ocasião quase impossível ... Só a gente estruturar o teste corretamente. 3.
Pode testar".

1. O Sankhya provado só pelo dublê até o seu roteiro final: aceito. O roteiro de uso no Sankhya da
   sua empresa, no fim, é a prova que falta.
2. A corrida do Mastra (#27831), em que uma resposta no mesmo instante do cartão deixa a conversa
   parada sem lançar nada (7 de 100 na medida, nenhuma escrita duas vezes): aceito como ocasião
   quase impossível para uma pessoa. O que a etapa faz é estruturar o teste da carga (critério 11)
   com a resposta 1,5 s depois do cartão, o ritmo de uma pessoa, sem aumentar a espera para passar.
3. O OpenAI sem prova de não repetir `toolCallId` (a
   https://github.com/developmentconexus-ops/conexus/issues/840): testado. A
   https://github.com/developmentconexus-ops/conexus/pull/844 rodou o caso com o modelo
   `openai/gpt-5.6-luna` pela Assinatura ChatGPT, em três rodadas: 5, 5 e 6 chamadas, todas com
   `toolCallId` diferentes, as duas escritas de cada rodada `DONE` e os dois pedidos no dublê. O
   OpenAI não repetiu em nenhuma. A pergunta de produto que a PR deixa (o primeiro modelo da lista de partida, `openai/gpt-5`, é recusado numa conta só com a Assinatura) você respondeu em 2026-11-08: "por luna". Entra `openai/gpt-5.6-luna` no lugar de `openai/gpt-5` em `STARTER_MODELS`. Essa mudança e a coluna `agent.active_by` entram num pull request desta etapa, que ainda não tem número.

## Rodada de textos, para o fundador

Cada texto como está no código hoje e como a proposta o diz. Esta página não decide: você escolhe, e
o texto escolhido entra com os textos das telas (critérios 13 a 17 e 21).

| Onde | Como está no código | A proposta |
| --- | --- | --- |
| O título do cartão | "O Pedidos quer lançar pedido no Sankhya" (`apps/web/src/builder/conversation/approval-text.ts:22-24`, que tira a maiúscula do rótulo da operação, "Lançar pedido") | "O Pedidos quer lançar **um** pedido no Sankhya", como a página do fundador e o roteiro de uso já dizem |
| O botão e o estado da liberação ao Projeto (a `A1`: liberar não é só para ler) | "Liberar para ler" e o estado "lê" (`apps/web/src/hub/connectors/text.ts:180-182`); só a confirmação deixou de dizer que é para ler | "Liberar" e o estado "liberado", porque a liberação serve a toda operação que o papel der; "liberado, mas não lê até a ligação funcionar" (`:183`) pede nova frase se "liberado" ficar |
| O aviso do envio aberto da mesma escrita | "Um pedido foi enviado às {hora} e não sabemos se entrou. Confira no Sankhya pela marca {marca} antes de aprovar." (`approval-text.ts:33`) | O mesmo texto, que o cartão já tinha de exemplo; fica a escolha entre dizer só a hora, como hoje, ou o dia também quando o envio não foi hoje |
| A ação fora do papel, na linha da escrita | "Seu papel não publica escrita que faz sozinha" (`apps/web/src/builder/agents/text.ts:56`) | O mesmo, com a `D1-a` dizendo a quem pedir: "Seu papel não publica escrita que faz sozinha. Peça ao Dono ou a um Administrador." |
| Quem não pode aprovar (a `D3-a`, achado 3 da revisão da https://github.com/developmentconexus-ops/conexus/pull/843) | "Seu papel não pode usar a ferramenta essa operação." e "Peça a quem tem esse acesso para publicar, ou tire a ferramenta.", com **Aprovar** e **Recusar** acesos (`packages/hub-api/src/failures.ts:265-272,306-310`, mostrados por `approval-card.tsx:44-45`) | "Seu papel não permite aprovar esta escrita", como o estudo propõe, sem os botões |
| A linha de uma escrita na conversa (U6) | "Consultando …", "Consultou …", "Não conseguiu consultar …" para toda `tool_<slug>` (`apps/web/src/builder/conversation/construtor-specs.ts:214-226`) | "Escrevendo no {sistema}: {ação}", "Escreveu no {sistema}: {ação}", "Não conseguiu escrever no {sistema}: {ação}", com o verbo "escrever" da marca "escreve" que a página do agente já usa |
| Um campo que só quem configura fixa (a nota modelo), sem valor (o motivo novo `NOT_FIXED`, U5, U6) | nenhum; o vizinho `REQUIRED_MISSING` diz "Falta um campo obrigatório da operação." (`apps/web/src/builder/agents/text.ts:113`) | "Esta operação pede um valor fixo de quem configura. Preencha-o nos valores fixos da ferramenta.", um texto só para todo conector |
| O rótulo de uma escrita que o sistema recusou (U6; a `D6`: um rótulo só do estado, e abaixo a mensagem do sistema como ele a escreveu) | "Não conseguiu lançar", com a falha dita (critério 15, U3) | "O {sistema} não aceitou. Nada foi lançado." "Recusado, nada foi lançado.", o exemplo do firstmate, colide com o "Recusado" que quer dizer "você recusou" (critério 15), e em **Faz sozinho** não há "Aprovado por você" para separar os dois |

Nos critérios e nas seções abaixo, "o rótulo da recusa" é o texto que o fundador escolher nesta
linha; os testes o leem de um dono só (`text.ts` da conversa).

## O que a emenda de 2026-11-07 muda

O que você vê: o aviso do pedido sem resposta no cartão, e o agente em **Faz sozinho** que pergunta
nesse caso. Por baixo, sem mudar o que você vê (emendas técnicas do firstmate, regra L9): a escrita se
chama `lancarPedido` no kit; uma resposta de sucesso sem o número do pedido legível é "não deu para
saber", e não "recusado"; o registro guarda a versão como agente e número, porque a versão não tem
outro id; a mesma chamada com outra entrada responde `IDEMPOTENCY_CONFLICT` (regra C37); uma falha
de rede ou de prazo só é "não deu para saber" depois do envio; o registro abre e fecha em duas
transações curtas, e a marca vai no fim da observação; a escrita lê o papel na hora, sem o cache de
papéis da biblioteca.

## O que este cartão tira do rascunho de 2026-11-06

A `suspend()` na ferramenta que escreve, a conferência nossa de "a pessoa mandou outra mensagem" e
o motivo escrito ao recusar (a rota nativa não leva motivo; você escreve uma mensagem); a resposta
de uma pergunta do Mercado Livre, a sua operação e o dublê; a coluna `writes` em
`project_connection`, a caixa **Liberar para escrever** e a sua permissão D11 (pela `A1`); a marca
**Pede aprovação** na biblioteca e as três formas de "sempre permitir"; o critério da carga com a
`suspend()`; o 401 repetido numa escrita; a decisão de cancelar pelo agente, que foi para "Fica de
fora".

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 A escrita no Sankhya | A operação `lancarPedido` (classe `write`) e o dublê dos pedidos; o funil de escrita `writeThrough`, gêmeo do `readThrough`, com o mesmo `mayUse`; o registro de cada envio por conversa e `toolCallId` antes de mandar (a tabela nova, que sai com a empresa, e as suas permissões, D11, num pull request próprio da unidade); a consulta dos envios abertos da mesma conversa, ligação e operação, e a trava que não manda quando há um sem aprovação de pessoa; o executor que nunca repete uma escrita depois de enviada | `packages/connectors/src/{kernel,sankhya}/`, `apps/server/src/hub/connectors/`, `apps/server/migrations/`, `apps/server/database-grants.sql` | [data](../guides/data.md) | esta página aprovada; Papéis U2 no `main` |
| U2 O agente pergunta ou faz sozinho | O `yolo` desligado no controlador dos agentes; `requireApproval` em função em toda ferramenta do agente; a ferramenta da escrita com a chave da versão ou um envio aberto da mesma escrita; a ação **Publicar agente que escreve sozinho** e a conferência ao publicar; a escrita fora do programa; a rota `tool-approval` na lista fixa; os registros; as gravações do Mastra | `apps/server/src/builder/{agents,conversation,machine}/`, `apps/server/src/hub/identity/`, `apps/server/src/platform/recordings/mastra/`, `packages/hub-api/src/{agents,tools,roles}.ts` | [security](../guides/security.md) | U1; Papéis U2 e U3 no `main` |
| U3 As telas | A chave **Pergunta antes / Faz sozinho** na linha da escrita da página do agente; o cartão **Aprovar?** na conversa do agente, os seus estados e o aviso do envio aberto da mesma escrita; a ação nova na tela de Papéis; o texto da confirmação de "Liberar" | `apps/web/src/builder/{agents,conversation}/`, `apps/web/src/hub/{identity,connectors}/`, `docs/reference/screens.md` | [web](../guides/web.md) | U2 |
| U4 O kit sabe o que é do Sankhya | O leitor de recusas que lê `error.details`; `sankhya/refusals.ts`, as recusas gravadas, que o dublê importa; a conformidade que confere cada recusa gravada; os itens de `lancarPedido` com `sequencia` preenchida pelo kit, `codigoLocalEstoque` e `controle`; a nota modelo declarada como campo fixo; a leitura nova **Estoque de um produto**; a escrita que declara `uncertain`, `mark` e `idOf` (a decisão 0062, que emenda a 0056), e o Hub que passa a perguntá-los | `packages/connectors/src/{kernel,sankhya}/`, `apps/server/src/hub/connectors/{wrote,write}.ts` | [testing](../guides/testing.md) | esta emenda aprovada; U1 a U3 no `main` |
| U5 A falha chega inteira ao modelo | O funil que entrega a resposta inteira; o registro que guarda o corpo de uma recusa e quem aprovou (a coluna `approved_by`, numa migração em pull request próprio, D11); a ferramenta que lança a falha nativa do Mastra com a resposta inteira, e `WRITE_UNCERTAIN`, `WRITE_OPEN` e `IDEMPOTENCY_CONFLICT` que continuam resultados; a leitura do agente pela mesma regra; a rota `listWrites` ao lado de `listOpenWrites`, que só a U6 apaga; a publicação que recusa um campo fixo sem valor, e a chamada que o recusa numa versão ativa que o deixa aberto | `apps/server/src/hub/connectors/`, `apps/server/src/builder/{agents,tools}/`, `apps/server/migrations/`, `packages/hub-api/src/{open-writes,agent-failures}.ts` | [security](../guides/security.md) | U4 |
| U6 A escrita na conversa, também depois de recarregar | O cartão que lê o desfecho e quem aprovou do registro da escrita (`listWrites`), o rótulo da recusa com a mensagem do sistema; a nota modelo, o local e o lote no cartão; a linha de uma escrita com os verbos de escrita, e as linhas de leitura e de escrita que lançaram, lidas pelo `kind` da falha; **Usar a versão N** na linha da escrita; o texto do campo fixo sem valor; a troca de `listOpenWrites` por `listWrites` na web, e o antigo apagado | `apps/web/src/builder/{conversation,agents}/`, `apps/web/agent-file.layout.test.ts`, `packages/hub-api/src/{open-writes,index}.ts`, `apps/server/src/builder/agents/conversation-routes.ts` | [web](../guides/web.md) | U5 |

Correm em fila: a U2 chama o funil da U1, e a U3 lê o contrato e o evento da U2. A U4, a U5 e a U6
também: a U5 lê o que a U4 declara, e a U6 lê a rota da U5. A correção avulsa de "Lançar pedido"
duas vezes na página do agente vai antes, fora desta emenda.

**O método das unidades.** Cada unidade segue o `pstack:poteto-mode` como as skills do repositório
já o chamam ([`conexus-scope`](../../.agents/skills/conexus-scope/SKILL.md), passo 4;
[`conexus-build`](../../.agents/skills/conexus-build/SKILL.md)). O cartão não repete o método.

**Orçamento de código alterado.** U1: ~830 (a operação e o dublê dos pedidos, o funil, o registro e
a sua migração, a consulta dos envios abertos e a trava, o executor sem repetição). U2: ~560 (o
controlador, as regras de cada tipo de ferramenta, a ferramenta da escrita, a coluna da chave, a ação e a conferência de publicar, o
programa sem escrita, a rota, os registros, as gravações). U3: ~630 (a chave na linha, o cartão e
os seus estados com o aviso, a ação na tela de Papéis, o texto). Total da etapa: ~2.000, dentro da regra L2
(estimado pela leitura, sem protótipo). A emenda de 2026-11-08: U4 ~160 (o leitor +15,
`refusals.ts` ~40, `vendas.ts` +35, `estoque.ts` +15, a conformidade +30, o dublê ~10 trocadas, o
Hub −15 e +10); U5 ~195 (o funil −25 e +10, `wrote.ts` −5, o registro +15, a leitura e as portas
+20, a ferramenta +50, com a recusa na chamada, a rota +30, a publicação +25, a migração ~10); U6
~140 (o cartão +35, as linhas de escrita e de leitura +35, **Usar a versão N** na escrita +15, a
troca de `listOpenWrites` em seis arquivos +20, o texto +10, a sala +10, a página do agente +15).
Cada número soma as linhas que saem e as que entram, como a L2 conta as linhas alteradas. Total da
emenda: ~495; da etapa, ~2.495.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `writeThrough` com uma versão (`speaker: VERSION`), ou com a pessoa num rascunho (`speaker: PERSON`), que declara `lancarPedido` manda ao dublê do Sankhya um `POST /v1/vendas/pedidos` com os campos e devolve `{ kind: 'OK', value: { codigoPedido } }`; o dublê guarda o pedido "a confirmar" com a marca `Conexus <id>` no fim da observação; a linha do registro guarda a versão como `agent_id` e `version_number`, ou a pessoa, nunca os dois; imprime `CONNECTOR_WRITE_SENT` com ligação, operação, versão e `codigoPedido`, sem os campos (S40) | `hub/connectors/write.test.ts` (novo), "o pedido sai" | must |
| 2 | U1 | Recusa antes de enviar: sem a operação no papel (o `mayUse` de Papéis) dá `NOT_IN_ROLE`; a ligação não liberada ao Projeto, ou de outro Projeto ou empresa, dá `NOT_GRANTED` (T10); uma operação `read` pedida ao funil de escrita dá `REQUEST_MALFORMED`; tirar `lancarPedido` do papel pela rota de Papéis faz a chamada seguinte dar `NOT_IN_ROLE` (o papel lido na hora, sem o cache de papéis do Better Auth, issue 828); o dublê não recebe nada e nada se grava no registro | `hub/connectors/write.test.ts`, "a escrita recusada" e "o papel se lê de novo" | must |
| 3 | U1 | Uma escrita nunca se repete: um corte depois do envio, um 502, 503, 504 ou o `GTW3503` dão `WRITE_UNCERTAIN` com a marca, e o dublê conta um só pedido; uma segunda chamada com a mesma conversa (`threadId`) e o mesmo `toolCallId` não envia e devolve o que o registro diz (o `codigoPedido` guardado, ou `WRITE_UNCERTAIN`), e com a mesma chave e outra entrada dá `IDEMPOTENCY_CONFLICT` sem enviar (C37), com o texto ao modelo que também diz para não chamar de novo; o mesmo `toolCallId` noutra conversa é outra escrita; uma falha antes do envio (a ligação recusa a conexão, `UNREACHABLE`, ou o prazo vence na fila, `DEADLINE`) e o `TOKEN_EXPIRED` do gateway dão a falha ao modelo, sem repetir e sem `WRITE_UNCERTAIN`; o texto de `WRITE_UNCERTAIN` ao modelo diz para não chamar de novo e contar à pessoa a marca | `packages/connectors/src/sankhya/operations.test.ts`, "lançar pedido"; `hub/connectors/write.test.ts`, "a resposta perdida" e "o mesmo toolCallId" | must |
| 4 | U1 | Um 200 com `[CORE_E…]` na mensagem e um 400 `INVALID_REQUEST` dão `REFUSED` com o texto do Sankhya ao modelo; um 2xx cujo `retorno.codigoPedido` não se lê dá `WRITE_UNCERTAIN` com a marca (o pedido pode ter entrado: "não deu para ler"), nunca `REFUSED`; nada fica "enviado com sucesso" no registro sem o `codigoPedido` | `packages/connectors/src/sankhya/operations.test.ts`, "o pedido recusado" | must |
| 5 | U2 | Numa conversa do agente com `yolo: false`, a escrita em **Pergunta antes** não envia: o stream traz `tool_approval_required` com `toolName` e `args`, o estado da sessão traz o pedido em `pendingApprovals`, e o dublê não recebe nada; o teste percorre o mapa de ferramentas de verdade de `runToolsOf` de um agente com leitura, ferramenta em código, app, `web_fetch`, `web_search`, `show_file`, programa e Computador, e cada uma roda sem `tool_approval_required` | `builder/agents/approval.test.ts` (novo), "a escrita espera, o resto não" | must |
| 6 | U2 | `POST …/sessions/{id}/tool-approval` com `approved: true` roda a escrita uma vez e o turno termina; com `approved: false`, nada roda e o modelo recebe a recusa; uma segunda resposta ao mesmo pedido responde `ok: false`; uma mensagem nova da pessoa recusa o pedido aberto, e aprovar depois dela responde `ok: false` sem rodar; Parar recusa | `builder/agents/approval.test.ts`, "aprovar, recusar, mensagem, Parar" | must |
| 7 | U2 | Recusa na rota: outra pessoa, ou a mesma em outra conversa, recebe `CONVERSATION_NOT_FOUND` (o `guard.ts`); um corpo com `alwaysAllowCategory` recebe `REQUEST_MALFORMED`; uma resposta a um `toolCallId` que não é um portão vivo da sessão (`session.approval.isArmed`) recebe `ok: false, reason: 'not_pending'` sem chegar ao caminho guardado do Mastra; nada roda | `builder/conversation/guard.test.ts`, "a resposta de aprovação" | must |
| 8 | U2 | Depois de um reinício (um Hub novo ao lado do mesmo banco, por `hubBeside`), o estado da sessão não traz o pedido (`pendingApprovals` vazio, como `pendingSuspensions` em `conversation-update.test.ts:65`); um **Aprovar** com o `toolCallId` velho responde `ok: false` e o dublê não recebe nada; a mensagem seguinte da pessoa roda um turno novo normal | `builder/agents/approval.test.ts`, "depois do reinício" | must |
| 9 | U2 | Em **Faz sozinho**, a escrita roda sem `tool_approval_required`; publicar uma versão com uma escrita em **Faz sozinho** por quem não tem a ação `agent: publishUnattendedWrite` dá `NOT_IN_ROLE` e não publica; gravar o rascunho confere a ação só quando a gravação **põe** **Faz sozinho** (uma escrita que já estava nele, num rascunho anterior, não se confere de novo ao gravar), e a publicação é a porta que confere sempre, de modo que um Desenvolvedor com **Lançar pedido** e sem a ação que testa a conversa de um rascunho já em **Faz sozinho** lança sem cartão até publicar; em **Pergunta antes**, grava e publica | `builder/agents/publish.test.ts`, "a escrita que faz sozinha" | must |
| 10 | U2 | O programa da 24.4 não tem a escrita: a lista de ferramentas do `execute_typescript` de um agente com **Lançar pedido** não traz `tool_<slug>` da escrita, e um programa que a chama recebe "not available in Code Mode", sem pedido ao dublê | `builder/agents/code-mode.test.ts`, "a escrita fica fora do programa" | must |
| 11 | U2 | A carga: 20 conversas ao mesmo tempo no `PostgresStore`, 10 rodadas, cada uma com uma leitura, uma escrita em **Faz sozinho** e uma em **Pergunta antes** respondida 1,5 s depois do `tool_approval_required`: as 600 chamadas terminam, cada escrita uma vez, nenhuma `AGENT_RESUME_ALREADY_CLAIMED` | `builder/agents/approval-load.test.ts` (novo) | must |
| 12 | U2 | O Builder, o Construtor e o Assistente não recebem ferramenta de escrita e continuam em `yolo`; o texto fixo do agente deixa de dizer que ele só lê quando a versão tem uma escrita (`agent.ts:37-38`, `:247`), e continua dizendo numa versão sem escrita | `builder/conversation/permissions.test.ts` (os casos de hoje passam sem mudar); `builder/assistant/assistant.test.ts`, "sem escrita"; `builder/agents/agent.test.ts`, "o texto da escrita" | must |
| 13 | U3 | Na página do agente, a escrita aparece no grupo da ligação, desmarcada, marcada "escreve"; "Marcar todas as leituras" não a marca; marcada, a linha mostra **Pergunta antes** escolhida e **Faz sozinho**; para quem não tem a ação, **Faz sozinho** aparece desligada com "Seu papel não publica escrita que faz sozinha" | `apps/web/src/builder/agents/chooser.test.tsx`, "a escrita na linha" | must |
| 14 | U3 | O cartão mostra o agente, o logotipo e o nome da ligação, a ação ("Lançar pedido") e cada campo, **Aprovar** e **Recusar**, e sob a caixa "Escrever outra mensagem recusa este pedido."; os botões acendem só quando o estado da sessão traz o `toolCallId` | `apps/web/src/builder/conversation/approval-card.test.tsx` (novo) | must |
| 15 | U3 | Depois de **Aprovar**: "Aprovado por você" e o resultado na linha; **Recusar**: "Recusado"; mensagem: "Recusado porque você mandou outra mensagem"; Parar: "Recusado porque você parou a conversa"; `WRITE_UNCERTAIN`: "Não deu para saber se o pedido foi lançado. Procure no Sankhya a observação Conexus …"; `UNREACHABLE` e `DEADLINE` (antes do envio): "Não conseguiu lançar" com a falha dita | `approval-card.test.tsx`, os seis estados | must |
| 16 | U3 | Recarregar ou abrir em outra aba, com o mesmo Hub, traz o cartão esperando; responder numa aba fecha o cartão na outra quando o estado da sessão chega | `apps/web/src/builder/agents/approval-card.test.tsx`, "ao reabrir, a escrita decidida em outra aba aparece decidida…", "ao reabrir, a escrita ainda guardada como aberta volta com os botões acesos só quando a sessão a segura" e "Aprovar que a Mastra já não espera (ok: false: outra aba respondeu)…" | must |
| 17 | U3 | Na tela de Papéis, a ação **Publicar agente que escreve sozinho** aparece marcada e fixa no Dono e no Administrador, marcada ou desmarcada e **editável só no Desenvolvedor**, e não aparece no Membro nem num papel próprio; marcada no Desenvolvedor, **Faz sozinho** acende para ele e o critério 9 passa, desmarcada, apaga; um `PUT` com a ação para o Membro ou para um papel próprio dá `REQUEST_MALFORMED` (`UNATTENDED_NOT_BUILDER`, `hub/identity/company-roles.ts`), e um papel próprio criado não a tem (a `D1-a`) | `apps/web/src/hub/identity/roles.test.tsx`, "a ação da escrita sozinha: marcada e fixa no Dono e no Administrador, editável no Desenvolvedor…"; `hub/identity/roles.test.ts`, "a ação da escrita sozinha (D1-a)…" e "a ação da escrita sozinha: pedida para o Membro ou para um papel próprio, 400 REQUEST_MALFORMED…" | must |
| 18 | U2 | Avaliação com o modelo de verdade (opt-in): o pedido termina no cartão; recusado, o agente diz que não lançou e não chama a escrita de novo no mesmo turno; com `WRITE_UNCERTAIN` (o dublê `lostAfterStore`), em **Faz sozinho**, ele não chama de novo e diz a marca | `builder/agents/agents.eval.test.ts`, "a escrita" | should |
| 19 | U1 | O pedido sem resposta, em casos nomeados: (a) "o foi?": uma escrita cortada depois do envio deixa a linha `SENDING`; na mesma conversa, uma chamada com outro `toolCallId`, a mesma ligação e a mesma operação, com `approved: false`, não envia, não grava linha e devolve `WRITE_OPEN` com a marca e a hora do envio aberto, cujo texto ao modelo diz para não chamar de novo e pedir à pessoa que confira a marca; o dublê conta um pedido; (b) uma linha `UNCERTAIN` trava do mesmo jeito, com os mesmos campos ou outros; (c) uma linha `DONE` ou `REFUSED` não trava; (d) outra operação, outra ligação ou outra conversa não travam; (e) a mesma chamada com `approved: true` envia, e o dublê conta dois; (f) o mesmo `toolCallId` com a sua linha `SENDING` devolve `WRITE_UNCERTAIN`, não `WRITE_OPEN`; (g) duas chamadas da mesma escrita ao mesmo tempo, sem linha antes, com `approved: false`: uma envia, a outra devolve `WRITE_OPEN`, e o dublê conta um | `hub/connectors/write.test.ts`, "o pedido sem resposta" (a) a (g) | must |
| 20 | U2 | Com uma linha aberta da mesma escrita na conversa A, a escrita em **Faz sozinho** traz `tool_approval_required` e o dublê não recebe nada; **Aprovar** a envia uma vez; na conversa B, sem linha aberta, a mesma escrita roda sem cartão | `builder/agents/approval.test.ts`, "o pedido sem resposta pergunta" | must |
| 23 | U2 | `listOpenWrites` de uma conversa devolve cada envio aberto com a ligação, a operação, o estado, a hora e a marca, sem os campos da escrita (S40); uma linha `DONE` ou `REFUSED` não aparece; outra pessoa, ou a mesma em outra conversa, recebe `CONVERSATION_NOT_FOUND` | `builder/agents/conversation-routes.test.ts`, "os envios abertos" | must |
| 21 | U3 | O cartão de uma escrita com um envio aberto da mesma escrita na conversa mostra, acima dos botões, a linha com a hora e a marca ("Um pedido foi enviado às 10h12 e não sabemos se entrou. Confira no Sankhya pela marca Conexus 7F3A antes de aprovar."); sem envio aberto, não mostra | `approval-card.test.tsx`, "o aviso do pedido igual" | must |
| 22 | U1 | Apagar a empresa apaga as suas linhas de `connector_write` pela cascata da chave estrangeira, e as de outra empresa ficam; um `DELETE` direto em `connector_write` como `hub_company` é recusado por falta de permissão. O teste apaga a empresa como o dono do banco (`delete from auth.company`), não pelo caminho de `hub/operations/clients.ts`, que o `client-deletion-database.test.ts` percorre e que não toca esta tabela; a cascata é a mesma chave estrangeira | `hub/connectors/connector-write-table.test.ts`, "o registro de um envio sai com a empresa, apagada pelo dono: a chave estrangeira em cascata" e o caso do `DELETE` recusado | must |
| 24 | U2 | A `D2-a`: publicada em **Faz sozinho** por quem tem a ação e a escrita no papel, a escrita roda sem cartão; tirada a ação do papel de quem publicou, a chamada seguinte traz `tool_approval_required` e o dublê não recebe nada até o **Aprovar**; o mesmo quando quem publicou perde só a escrita (`lancarPedido`) no papel, guardando a ação, e quando sai da empresa; na dúvida (a leitura do papel falha), pergunta; a versão não muda e o agente não para | `builder/agents/autonomy.test.ts` (novo, na https://github.com/developmentconexus-ops/conexus/pull/843), "quem publicou perde a ação…", "quem publicou perde a ação e a escrita no papel…" e "quem publicou sai da empresa…"; o caso do Desenvolvedor que guarda a ação e perde só `lancarPedido`, que derruba a mutação da linha do `mayUse` de quem publicou, entra com o teste do achado 2 da revisão | must |
| 25 | U2 | Restaurar uma versão é publicar: voltar (`activate`) a uma versão com uma escrita em **Faz sozinho**, ou com uma operação fora do papel, por quem não tem a ação ou a operação, dá `NOT_IN_ROLE`, e a versão ativa não muda; `AGENT_ACTIVATED` leva quem restaurou. Quem restaura passa a responder pela versão ativa para a `D2-a` (a opção b, "b, mas me explica melhor", 2026-11-08): `makeActive` grava `agent.active_by` ao publicar, restaurar ou publicar de novo uma revisão, `publisherLeavesAlone` o lê, `agent_version.published_by` não muda, quem sai da empresa perde `active_by`, e a migração o preenche com o `published_by` da versão ativa. Ana publica a v1 em **Faz sozinho**, Bruno publica a v2 e restaura a v1: Ana perde a ação e a escrita ainda roda sem cartão; Bruno perde a ação e ela pergunta | `builder/agents/autonomy.test.ts`, "restaurar é publicar…" (a ação, a operação e publicar de novo a revisão de uma versão) e o caso novo de Ana e Bruno | must |
| 26 | U2 | A `D3-a`: quem toca **Aprovar** sem a escrita no próprio papel recebe `NOT_IN_ROLE`, e nada roda nem se grava; o **Recusar** não pede a escrita; com a escrita no papel, **Aprovar** roda uma vez | `builder/agents/autonomy.test.ts`, "quem aprova precisa ter a escrita no próprio papel…" | must |
| 27 | U4 | A recusa gravada: `sankhya/refusals.ts` exporta o 400 do `addPedido` no envelope do gateway, `{"statusCode":400,"error":{"code":"BAD_REQUEST","message":"Ocorreu algum erro inesperado!","details":"O produto [999] enviado não existe."}}` (o envelope medido no 404 real, o código e a mensagem do 400 real que o registro guardou, a causa inventada, S40); `lancarPedido.answer` sobre ela dá `REFUSED` com `native.code` `BAD_REQUEST`, `native.message` com a mensagem **e** a causa, e `native.body` igual ao corpo inteiro | `packages/connectors/src/sankhya/answers.test.ts`, "a recusa gravada do addPedido" (falha hoje: a causa some) | must |
| 28 | U4 | A conformidade: para cada recusa gravada que um conector exporta, `operation.answer` dá o `kind` gravado ao lado dela, e cada texto do corpo aparece em `native.message`; com o leitor de hoje, que não lê `error.details`, o caso falha | `packages/connectors/src/kernel/kernel.test.ts`, "as recusas gravadas" | must |
| 29 | U4 | O dublê dos pedidos responde a todo produto que não está no seu catálogo com a recusa gravada, importada de `refusals.ts` como ela está (a causa nomeia o produto inventado 999, que o catálogo do dublê não tem, e o teste pede esse); o dublê não escreve recusa sua; o formato da documentação (`mensagem: {…}`) sai, e a recusa "Pedido sem cliente ou sem itens." (`fake-orders.ts:60`) também, porque o esquema do kit recusa esse pedido antes de enviar | `packages/connectors/src/sankhya/operations.test.ts`, "o pedido recusado" | must |
| 30 | U4 | O pedido que o kit monta: cada item leva `sequencia` 1, 2, 3 na ordem, `controle` (o dado, ou `''`) e um local: o do cabeçalho quando ele vem, que vence o do item, ou o do item; com `bound: { codigoLocalEstoque: 3 }` e o modelo mandando 5 num item, o pedido leva 3 em todo item (a `D2`); sem nenhum local, o esquema recusa antes de enviar com um texto que manda ler o estoque do produto, e o dublê não recebe nada; um produto sem linha de estoque (o `OK` vazio do critério 31) e sem local fixo não se lança, e o modelo diz à pessoa que o produto não tem estoque lido; o modelo não manda `sequencia`; `notaModelo` está na lista `fixed` da operação. Se `''` em `controle` ou um item com local ficar errado no Sankhya real, o passo 2 do roteiro mostra a frase dele, e o cartão volta antes da U5 | `packages/connectors/src/sankhya/operations.test.ts`, "o pedido que o kit monta" e "o local fixo vale para todo item" | must |
| 31 | U4 | **Estoque de um produto** (`estoqueDoProduto`, classe `read`): `GET /v1/estoque/produtos/{codigoProduto}` devolve as linhas com empresa, local, controle e saldo; o 404 sem linhas é `OK` vazio, como as outras leituras; a página entra em `spec-source.ts`, e o job `sankhya-docs` a confere | `packages/connectors/src/sankhya/operations.test.ts`, "o estoque de um produto" | must |
| 32 | U4 | A escrita declara o que é dela: `lancarPedido.uncertain` é verdadeiro só para o `GTW3503`; `mark` põe a marca no fim de `observacao`; `idOf` lê `codigoPedido`. Os critérios 1, 3 e 4 passam sem mudar os seus testes, com o Hub perguntando à operação | `packages/connectors/src/sankhya/operations.test.ts`, "o que a escrita declara"; `hub/connectors/write.test.ts` de hoje | must |
| 33 | U5 | O funil entrega a resposta inteira: com a recusa gravada no dublê, o `Written` de `writeThrough` traz `native.body` igual ao corpo gravado, e a linha de `connector_write` guarda o mesmo em `answer`; um corpo acima do teto do executor continua `UNREADABLE` `TOO_LARGE`, sem corpo; o app (a porta de `app-calls.ts`) continua recebendo só `status`, `code` e `message` (C51) | `hub/connectors/write.test.ts`, "a recusa inteira"; o teste da porta do app de hoje | must |
| 34 | U5 | A falha nativa: numa conversa do agente com o dublê do modelo (T24), uma escrita recusada termina a chamada como erro da ferramenta, e o pedido seguinte ao modelo traz um `tool_result` com `is_error` cujo texto é o JSON `{kind, status, code, message, body}` com a causa gravada; o turno continua; o log traz `CONNECTOR_WRITE_REFUSED` e a linha do erro do Mastra só com escalares, sem a causa (S41) | `builder/agents/approval.test.ts`, "a recusa chega inteira ao modelo" | must |
| 35 | U5 | Continuam resultados, sem `is_error`: `OK`, `WRITE_UNCERTAIN`, `WRITE_OPEN` e `IDEMPOTENCY_CONFLICT`, com a instrução de não chamar de novo; todo o resto que certamente não foi aceito lança (`REFUSED`, `AUTH_REFUSED`, `TOKEN_EXPIRED`, `UNREADABLE`, `BUSY`, `NOT_IN_ROLE`, `NOT_GRANTED`, `UNREACHABLE`, `DEADLINE`, `CALLS_SPENT`) | `builder/agents/approval.test.ts`, "o que lança e o que responde" | must |
| 36 | U5 | A leitura do agente segue a mesma regra: uma leitura recusada lança com a resposta inteira, e o modelo recebe `is_error` com o corpo; uma leitura `OK` não muda | `builder/agents/agent.test.ts`, "a leitura recusada" | must |
| 37 | U5 | Quem aprovou: a linha de `connector_write` de uma escrita aprovada guarda em `approved_by` a pessoa que tocou **Aprovar**; em **Faz sozinho**, `null`; a migração vem num pull request próprio (D11) | `hub/connectors/write.test.ts`, "quem aprovou" | must |
| 38 | U5 | `listWrites` de uma conversa devolve cada escrita dela: `toolCallId`, a ligação, a operação, o estado, a hora, a marca, se foi aprovada por uma pessoa e, numa recusa, a mensagem do sistema (`native.message`); nunca os campos da escrita (S40); outra pessoa, ou a mesma em outra conversa, recebe `CONVERSATION_NOT_FOUND`; `listOpenWrites` continua nesta unidade, porque a web o importa; a U6 o apaga (critério 46) | `builder/agents/conversation-routes.test.ts`, "as escritas da conversa" | must |
| 39 | U5 | O campo fixo: a versão pronta de uma escrita não abre ao modelo os campos `fixed` do kit, e o esquema que o modelo recebe não tem `notaModelo`; uma versão de **Lançar pedido** com `notaModelo` em `open`, ou sem ela nos valores fixos, não cabe na operação (`misfitOf`, `builder/tools/check.ts`): gravá-la dá `TOOL_REFUSED` com `{ field: 'bound', reason: 'NOT_FIXED' }`, e publicar um agente com uma versão assim é recusado com o mesmo motivo, sem publicar | `builder/tools/routes.test.ts`, "o campo que só quem configura fixa"; `builder/agents/publish.test.ts`, "a escrita sem o valor fixo" | must |
| 40 | U6 | Depois de recarregar: uma escrita aprovada e recusada mostra "Aprovado por você" e o rótulo da recusa com a mensagem do sistema como ela veio; uma aprovada e lançada, "Aprovado por você" e o número; uma em **Faz sozinho** não diz "Aprovado"; a linha diz "Não conseguiu escrever no Sankhya: Lançar pedido", nunca "consultar" | `apps/web/src/builder/agents/approval-card.test.tsx`, "depois de recarregar, o desfecho vem do registro" | must |
| 41 | U6 | Ao vivo, a recusa lançada (`output-error`) leva o cartão ao mesmo estado do critério 40, lido de `listWrites` quando a chamada termina, nunca do `errorText` do modelo | `approval-card.test.tsx`, "a recusa ao vivo" | must |
| 42 | U6 | O cartão mostra a nota modelo (dos valores fixos da versão), o cliente e cada item com quantidade, produto, preço, local e lote, quando houver; a linha de **Lançar pedido** na página do agente mostra **Usar a versão N** quando a biblioteca tem uma versão mais nova, e trocar não desmarca nem muda a chave **Pergunta antes / Faz sozinho**; ela mostra o texto do campo fixo sem valor quando a publicação o recusa | `approval-card.test.tsx`, "o pedido com a nota modelo e os locais"; `apps/web/src/builder/agents/write-lines.test.tsx` (novo), "o campo fixo sem valor" e "a escrita usa a versão nova" | must |
| 43 | U5 | Avaliação com o modelo de verdade (opt-in): com a recusa gravada, o agente diz à pessoa a causa que está em `details`, sem inventar outra, e não chama a escrita de novo com a mesma entrada | `builder/agents/agents.eval.test.ts`, "a recusa com a causa" | should |
| 44 | U5 | A recusa na chamada: uma versão ativa publicada antes da U5, cuja escrita deixa `notaModelo` em `open` ou não a fixa, não envia nada; o modelo não recebe `notaModelo` no esquema da ferramenta e, se chamar, recebe a falha lançada `{ kind: 'NOT_FIXED', field: 'notaModelo' }`; nenhuma linha se grava em `connector_write`, o log traz `CONNECTOR_WRITE_NOT_FIXED`, e o dublê conta zero pedidos | `builder/agents/approval.test.ts`, "a versão antiga que deixa o campo fixo aberto" | must |
| 45 | U6 | As linhas que lançaram (`output-error`): a leitura com `AUTH_REFUSED` ou `TOKEN_EXPIRED` continua dizendo para ligar de novo (`RECONNECT`), e as outras falhas dizem que o sistema recusou; a escrita diz "Não conseguiu escrever no Sankhya: Lançar pedido"; o estado vem do `kind` do texto da falha, lido por um esquema Zod na borda da tela, nunca pela frase; aberto, o detalhe da linha mostra o rótulo da recusa e a mensagem do sistema, nunca o JSON | `apps/web/src/builder/conversation/tool-row.test.tsx`, "a leitura que lançou pede ligar de novo" e "o detalhe não mostra o JSON" | must |
| 46 | U6 | A web lê o aviso do envio aberto e o desfecho pela mesma `listWrites`; `listOpenWrites` e `OpenWrite` saem do contrato, do servidor e da web juntos (C45), e os testes do critério 21 passam sem mudar o que verificam | `apps/web/src/builder/agents/approval-card.test.tsx`, "o aviso do pedido igual"; `npm run typecheck` | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A escrita na linha da página do agente (U3) | desmarcada, "escreve" | o conector sem escrita: nenhuma linha "escreve" | como a lista de Papéis | o erro ao salvar fica na tela, como hoje | a ligação deixou de ser oferecida: como hoje (`NOT_OFFERED`) | fora do papel de quem edita: sem poder marcar (Papéis, critério 24); sem a ação: **Faz sozinho** desligada com o motivo | `NOT_IN_ROLE` ao publicar, com a ferramenta |
| O cartão **Aprovar?** (U3) | o pedido inteiro e os dois botões; com um envio aberto da mesma escrita, a linha do aviso com a hora e a marca | — | "Aprovando…" ou "Recusando…", botões desligados | "Não conseguiu lançar", a falha dita (também `UNREACHABLE` e `DEADLINE`); para `REFUSED`, a U6 troca isso pelo rótulo da recusa e a mensagem do sistema; `WRITE_UNCERTAIN` com a marca | já respondido em outra aba: o estado que a sessão diz | o Membro não chega à conversa de agente (`manageAgents`); quem não tem a escrita no papel não aprova: `NOT_IN_ROLE`, e o cartão diz o texto escolhido na rodada de textos, sem os botões (critério 26) | "Recusado", "Recusado porque você mandou outra mensagem", "Recusado porque você parou a conversa" |
| A ação na tela de Papéis (U3) | marcada e fixa no Dono e no Administrador | — | como a tela | como a tela | como a tela | como a tela | — |
| O cartão depois de recarregar (U6) | o desfecho lido de `listWrites`: "Aprovado por você" e o número, ou o rótulo da recusa com a mensagem do sistema; em **Faz sozinho**, sem "Aprovado" | uma chamada sem linha no registro (recusada antes de gravar, como `NOT_IN_ROLE`): o que o Mastra guardou da chamada, sem "Aprovado" | o cartão como estava até `listWrites` chegar | `listWrites` falha: o cartão diz o que o Mastra guardou, sem inventar desfecho | a conversa de outra pessoa: `CONVERSATION_NOT_FOUND`, como hoje | como a conversa | `UNCERTAIN` ou `SENDING`: "Não deu para saber se o pedido foi lançado…" com a marca, como o critério 15 |
| A linha de uma escrita na conversa (U6) | "Escrevendo no {sistema}: {ação}" | — | "Escrevendo…" | "Não conseguiu escrever no {sistema}: {ação}"; aberto, o rótulo da recusa e a mensagem do sistema, nunca o JSON (`tool-row.tsx:76-84` hoje desenha o `errorText`) | — | — | — |
| A linha de uma leitura do agente que lançou (U6) | — | — | como hoje | `AUTH_REFUSED` ou `TOKEN_EXPIRED`: o pedido de ligar de novo (`RECONNECT`, `connector-specs.ts:94-110` hoje, por um resultado); as outras: que o sistema recusou; aberto, a mensagem do sistema, nunca o JSON | — | `NOT_IN_ROLE` e `NOT_GRANTED`: como hoje, pelo `kind` | — |
| A escrita de uma versão ativa que deixa um campo fixo aberto ou sem valor (U5) | — | — | — | a linha da escrita diz que não conseguiu escrever, e o modelo recebe `NOT_FIXED`; nada é enviado | — | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `ToolEffect` `'WRITE'` | a ferramenta do kit, pela classe da operação (U2) | a página do agente (U3), a montagem da ferramenta (U2) |
| `AgentToolChoice.approval` (`'ASK' \| 'AUTO'`, só numa escrita) | a página do agente (U3) | a gravação da versão e a conferência de publicar (U2), a regra `requireApproval` (U2) |
| `agent: publishUnattendedWrite` | os papéis (U2, `roles.ts`) | a conferência de publicar (U2), a tela de Papéis e a página do agente (U3) |
| `Written` (a resposta do funil de escrita) | `writeThrough` (U1) | a ferramenta da escrita (U2), que a diz ao modelo; o cartão (U3), pelo resultado |
| O envio aberto da mesma escrita (`openWritesOf`: estado, hora, marca) | o registro (U1) | a trava do funil (U1), a função `requireApproval` (U2), o aviso do cartão (U3) |
| `pendingApprovals` do estado da sessão (só na memória do Hub) | o Mastra | o cartão depois de recarregar, no mesmo Hub (U3) |
| O corpo da rota `{ toolCallId, approved }` | o cartão (U3) | o handler nativo do Mastra (U2) |
| A recusa gravada (`refusals.ts`: o corpo e o `kind` que dá) | quem grava o corpo real, com valores inventados (U4; o firstmate depois do pedido de prova) | o dublê, a conformidade e os testes (U4, U5) |
| `fixed` da operação (os campos que só quem configura fixa) | o kit (U4) | a versão pronta, `misfitOf` e a ferramenta em execução (U5), a página do agente pelo motivo `NOT_FIXED` (U6) |
| `uncertain`, `mark` e `idOf` da escrita | o kit (U4) | o funil de escrita do Hub (U4, `wrote.ts` e `write.ts`) |
| A falha lançada ao modelo (`ConnectorRefused`, a mensagem com `{kind, status, code, message, body}`) | a ferramenta do agente (U5) | o modelo, pelo `is_error` do Mastra; a tela lê dela só o `kind`, por um esquema na borda, para a linha de leitura (U6, C49), e o desfecho de uma escrita vem do registro |
| `connector_write.answer` com o corpo da recusa, e `approved_by` | o funil (U5) | `listWrites` (U5), o cartão (U6) |
| `listWrites` (`WrittenRow`: `toolCallId`, ligação, operação, estado, hora, marca, `approved`, `message`) | a rota (U5) | o cartão e o aviso do envio aberto (U6); `listOpenWrites` vive até a U6 trocar a web e apagá-lo |

**O desenho do cartão**, a 1280 e a 390 px, sobre as peças de `ui/` e o cartão do plano de hoje
(`plan-card.tsx`):

```text
1280                                                    390
┌─────────────────────────────────────────────┐         ┌──────────────────────────┐
│ [logo] O Pedidos quer lançar um pedido no   │         │ [logo] O Pedidos quer    │
│        Sankhya · Sankhya matriz             │         │ lançar um pedido no      │
│ Cliente      1                              │         │ Sankhya · Sankhya matriz │
│ Itens        2 × produto 8 a R$ 10,00       │         │ Cliente 1                │
│ Total        R$ 20,00                       │         │ Itens                    │
│                                             │         │ 2 × produto 8 a R$ 10,00 │
│                    [Recusar]  [Aprovar]     │         │ Total R$ 20,00           │
└─────────────────────────────────────────────┘         │ [Recusar]     [Aprovar]  │
 Escrever outra mensagem recusa este pedido.            └──────────────────────────┘
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| O registro do envio (`INSERT` em `connector_write` com `SENDING`, numa transação curta confirmada antes de chamar o Sankhya; a admissão é outra transação curta antes dela) | a mesma conversa e o mesmo `toolCallId`: a chave primária deixa um só; o segundo lê a linha e não envia; a mesma chave com outra entrada (o hash não bate): `IDEMPOTENCY_CONFLICT`, sem enviar; outro `toolCallId` com uma linha `SENDING` ou `UNCERTAIN` da mesma ligação e operação na conversa, sem aprovação de pessoa: `WRITE_OPEN`, sem gravar nem enviar; duas chamadas da mesma escrita ao mesmo tempo, cada uma com o seu `toolCallId`: a consulta e o `INSERT` correm na mesma transação curta sob `pg_advisory_xact_lock` da empresa, conversa, ligação e operação, então a segunda vê a linha da primeira e devolve `WRITE_OPEN` | o processo morre depois do `INSERT` e antes da resposta: a linha fica `SENDING`, e uma retomada do Mastra que rode a chamada de novo (`agent-BP9OWM6D.js:84330-84336`) recebe `WRITE_UNCERTAIN` sem enviar | o banco fora: nada é enviado, a falha sobe | `CONNECTOR_WRITE_SENT`, `_UNCERTAIN` ou `_REFUSED` com ligação, operação, versão e `toolCallId`, sem os campos | 1, 3, 19, 20, 22 |
| O pedido no Sankhya (`POST /v1/vendas/pedidos`, pelo executor) | duas chamadas diferentes são dois pedidos, cada uma com o seu cartão ou a sua linha | corte, 502, 503, 504 ou `GTW3503` depois de enviar: `WRITE_UNCERTAIN`, sem repetir; um 2xx sem `codigoPedido` legível: `WRITE_UNCERTAIN`; um 200 com `[CORE_E…]` ou um 400: `REFUSED`; `UNREACHABLE` ou `DEADLINE` antes do envio: a falha ao modelo | o Sankhya fora: a falha do fornecedor ao modelo; o token vencido (`TOKEN_EXPIRED`): a falha ao modelo, sem repetir; a chave se renova na próxima chamada pelo caminho de hoje do executor | o mesmo acima | 3, 4 |
| O fim do registro (`UPDATE` de `connector_write` para `DONE`, `REFUSED` ou `UNCERTAIN`, depois da resposta) | — | o banco cai depois de um envio com sucesso: `CONNECTOR_WRITE_SENT` já foi impresso com o `codigoPedido` antes do `UPDATE`, o modelo recebe o `OK` que está na memória, e a linha fica `SENDING` (uma repetição da mesma chamada recebe `WRITE_UNCERTAIN`, e uma escrita nova da mesma escrita na conversa pergunta, critérios 19 e 20) | o banco fora: imprime `CONNECTOR_WRITE_UNRECORDED` com a chave | `CONNECTOR_WRITE_UNRECORDED` | 3 |
| A aprovação guardada (o Mastra suspende a execução e guarda a espera) | duas escritas no mesmo turno são dois cartões, cada um pelo seu `toolCallId` | ninguém responde: espera sem prazo; Parar ou uma mensagem nova recusam, e uma resposta depois não roda nada; o Hub reinicia: o portão vivo some, a espera fica guardada no Mastra sem cartão, e o guarda recusa respondê-la | o banco do Mastra fora: a rodada falha como hoje, nada enviado | nada novo | 5, 6, 8 |
| A resposta ao cartão (`tool-approval`, nativa, pela lista fixa) | duas abas ou dois cliques: uma vale, a outra `ok: false` | chega no mesmo instante do cartão: pode perder a corrida do Mastra (#27831), nada roda e a conversa fica parada até a próxima mensagem; os botões acendem só quando o estado da sessão traz o pedido, o que dá à pessoa o tempo de ler e não fecha a janela | o banco fora: a falha da rota; o pedido continua guardado | `CONNECTOR_WRITE_APPROVED` ou `_DECLINED` com a pessoa, a ligação, a operação e o `toolCallId` | 6, 7, 11, 14 |
| A leitura do papel de quem publicou, na hora da escrita (a função `requireApproval` da escrita em **Faz sozinho**, `aloneByPublisher`) | duas chamadas ao mesmo tempo leem cada uma o papel na hora, sem cache; uma muda o papel no meio, e a chamada seguinte vê o novo | quem publicou perde a ação, a escrita no papel ou sai da empresa depois de a versão ficar ativa: a chamada seguinte pergunta (`tool_approval_required`), o dublê não recebe nada até o **Aprovar**, e a versão não muda | a leitura do papel falha ou lança: falha fechada, a função devolve `true` e o Mastra pergunta (`agent-BP9OWM6D.js:15129-15142`); nada é enviado sem o **Aprovar** | nada novo: a pergunta sai pelo `CONNECTOR_WRITE_APPROVED` ou `_DECLINED` de hoje | 24, 26 |
| Gravar o rascunho e publicar a versão com a coluna `approval` de `agent_version_tool` | a fila de gravação do rascunho de hoje (`use-draft-save-queue`) e a regra de versão de hoje | sem a ação, uma escrita em **Faz sozinho**: `NOT_IN_ROLE`, nada gravado nem publicado | o banco fora: a falha sobe | a linha de hoje da gravação e da publicação | 9 |
| O fim do registro com o corpo da recusa e quem aprovou (`approved_by` no `INSERT` de `SENDING`, o corpo no `UPDATE` final de `answer`) | o mesmo da linha do registro: a chave primária deixa um só | o banco cai depois de uma recusa: a linha fica `SENDING`, o modelo recebe a falha lançada que está na memória, e o processo imprime `CONNECTOR_WRITE_UNRECORDED` | o banco fora: o mesmo | `CONNECTOR_WRITE_REFUSED` só com escalares; o corpo nunca vai ao log (S41) | 33, 37 |
| A falha lançada da ferramenta (o Mastra a embrulha em `TOOL_EXECUTION_FAILED` e a relança, `@mastra/core@1.82.0` `packages/core/src/tools/tool-builder/builder.ts:1051-1072`) | duas escritas recusadas no mesmo turno: duas falhas, cada uma no seu `toolCallId` | depois de um **Aprovar**, o Mastra só guarda `approval` num sucesso (`loop/workflows/agentic-execution/tool-call-step.ts:930-936`), então o cartão lê quem aprovou do registro (critério 40) | o banco do Mastra fora: a rodada falha como hoje | a linha do erro do Mastra (`builder/mastra/logger.ts`, só escalares) e `CONNECTOR_WRITE_REFUSED` | 34, 35, 40, 41 |
| A escrita de uma versão ativa com um campo `fixed` aberto ou sem valor (a versão publicada antes da U5) | duas chamadas: cada uma recusa, nenhuma envia | — | — | `CONNECTOR_WRITE_NOT_FIXED` com a ferramenta e o campo, só escalares; a ferramenta recusa antes do funil | 44 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A operação que lança o pedido | U1 | `packages/connectors/src/kernel/operation.ts:3-4` (`write` existe), `:141-143` (`class`, `idempotent`); toda operação do Sankhya lê (`sankhya/operations/vendas.ts:16-28`) | Sankhya `addPedido`, `POST /v1/vendas/pedidos`, escopo `write:vendas/pedidos`, Sankhya Om 4.34; resposta `retorno.codigoPedido`; recusa 400 `INVALID_REQUEST` ou 200 com `[CORE_E…]` (developer.sankhya.com.br, lido em 2026-11-06) | a operação declara a classe e o esquema; o executor manda pela origem fixa | nativo (o kit, decisão 0056) | o passo 1 da U1 confere o mínimo real dos campos | "Poderia ser lançar um pedido no Sunker" | — |
| O dublê dos pedidos | U1 | `sankhya/fake.ts:20-47` (as chaves), `:112-135` (todo serviço desconhecido responde `status "0"`); não guarda pedido | o próprio repositório (T26) | um estado por pedido e as chaves "perdida depois de gravar" e "perdida antes de gravar" | nativo | — | não precisa | `packages/connectors/src/sankhya/fake-orders.ts` |
| O funil de escrita | U1 | `hub/connectors/read.ts` (`readThrough`, os seus quatro chamadores) e o `mayUse` de Papéis (U2 dela) | o próprio funil de leitura | o pedido leva o `speaker`, e o papel se confere antes do executor | nativo: um gêmeo, `writeThrough`, com o **mesmo** `mayUse`; gêmeo porque a escrita não repete e grava o envio antes | — | "coeso a nossa plataforma inteira" | `apps/server/src/hub/connectors/write.ts` |
| Nunca duas vezes | U1 | `executor.ts:268` (`repeat: operation.idempotent`); `read.ts` repete o 401 | Mastra: uma retomada de processo morto roda de novo a ferramenta em voo (`agent-BP9OWM6D.js:84330-84336`); o Sankhya não tem chave de idempotência (boas práticas, 2026-11-06) | quem chama guarda o envio; o Mastra manda deduplicar o efeito de fora (`dist/docs/references/docs-harness-durable-agents.md:287,410`, `reference-agents-durable-agent.md:403`); Stripe, AWS Builders' Library e Brandur ("idempotency keys"): a chave e o hash da entrada gravados antes, a mesma chave devolve o guardado, outra entrada é recusada; Nango (`proxy.service.ts:268`, `retries ?? 0`, nango@e6c6131) e Composio (`ts/packages/core/src/utils/retries.ts:7-12`, composio@2c528ab): a escrita não se repete | embrulhado: o registro por conversa (`threadId`, que o contexto da ferramenta traz, `@mastra/core` `tools/types.d.ts:172-200`, onde não há `runId`) e `toolCallId`, com o hash da entrada, é nosso, porque nem o Mastra nem o Sankhya garantem uma vez; um `toolCallId` repetido na conversa com outra entrada dá `IDEMPOTENCY_CONFLICT` (C37), nunca um `OK` de outro pedido | os critérios 3 e 11 | "1. Sim" | migração `connector_write` |
| O pedido sem resposta (outro `toolCallId`) | U1, U2, U3 | nenhum | OpenAI Agents SDK, human-in-the-loop: "Reconcile completed or uncertain tool side effects before initiating recovery or another run"; LangGraph, functional API: "check existing results before writing"; Temporal e Inngest: a chave estável entre tentativas, nunca a da tentativa; Mastra 1.82 `createTool({ requireApproval: fn })`, a função lê a entrada e o `requestContext` (`tools/types.d.ts:671-674`), e `beforeApproval` não roda na retomada, "keep validating inside `execute`" (`:676-683`) | reconciliar antes de outra escrita, e entregar o incerto a uma pessoa | embrulhado: a consulta `openWritesOf` no registro (U1); a função `requireApproval` da escrita devolve `true` com a versão em **Pergunta antes** ou com um envio aberto da mesma escrita (U2); o funil confere de novo dentro de `execute` e não manda sem aprovação de pessoa (U1); o aviso no cartão (U3); tudo no funil do Hub, nada no kit | os critérios 19, 20 e 21 | "Sim, esse cuidado ... Eu aprovo" | — |
| Quanto tempo a linha fica, e quando sai | U1 | as tabelas da empresa saem pela cascata (`connectors.connection`, `notifications.notification`, `requests.request`); `docs/guides/data.md` D17 | Stripe guarda a chave 24 h; Trigger.dev 30 dias; AWS o tempo de vida do recurso; vibesdk `audit_logs` com `SET NULL` (`worker/database/schema.ts:466-471`, `9da158d`); better-auth apaga com a organização | a chave vive enquanto pode haver repetição | nativo: `company_id` com chave estrangeira para `auth.company` e `ON DELETE CASCADE`, como as tabelas irmãs; nenhuma expiração nesta etapa | o critério 22 | "3. Okay"; "A gente vai apagar, sim" | — |
| Quem usa a escrita | U1 | o papel de Papéis (`createAccessControl` com as operações do kit como ações) | `better-auth@1.7.8` `has-permission.mjs:7-32` | a ação `lancarPedido` no recurso `connector_sankhya` | nativo | — | `B1` de Papéis | — |
| A escrita como linha de ferramenta | U2, U3 | a página do agente de Papéis (`E4`): as ferramentas da ligação selecionada, nada marcado | Mastra Connect `tools()` com `allowTools` (`reference/connect/tools.mdx:123-139`, `6e8dfcb8`) | a ferramenta existe para o modelo só se marcada | nativo | — | `E4` | — |
| A chave **Pergunta antes / Faz sozinho** | U2 | `builder.agent_version_tool` (`builder/agents/tables.ts:137-162`), sem coluna de aprovação | `@mastra/core@1.82.0` `createTool({ requireApproval: fn })`, a palavra final da ferramenta (`agent-BP9OWM6D.js:15114-15143`; `docs-agents-human-in-the-loop.md:109,157`); OpenAI `needsApproval`, Copilot Studio "Ask the end user before running" (Papéis, `market/autonomy.md`) | por ferramenta, lida a cada chamada | nativo: a coluna `approval` na linha da versão, lida pela função | Papéis P2 e P3: 0 de 200 | `D1` de Papéis | — |
| O `yolo` desligado nos agentes | U2 | `builder/agents/controller.ts:269` (`initialState: { yolo: true }`, decisão 0053) | `agent-controller-BDds1y5w.js:8638-8643` (`requireToolApproval: !isYolo`), `:5174-5187` (`resolveToolApproval`: sem regra, "ask") | sem `yolo`, toda ferramenta sem regra própria pede; a regra própria decide | nativo | Papéis P2 e P3; o critério 5 | `D1` de Papéis | — |
| A regra em toda ferramenta do agente | U2 | `builder/agents/agent.ts:164-205` (conector, app, biblioteca, código, web, `show_file`, programa); o Computador (`builder/machine/machines.ts:249`) | `createTool({ requireApproval })`; uma regra booleana `false` não vence a global, só a função (`agent-BP9OWM6D.js:15135`); a área de trabalho aceita `tools.requireApproval` em função (`reference-workspace-workspace-class.md:64,116`); o `web_fetch` do Mastra é um `createTool` compartilhado, sem regra (`tools-BVDic2bB.js:763-792`); o `web_search` é um marcador sem `execute` (`:794-795`), que sai antes da aprovação (`agent-BP9OWM6D.js:19408`) | `() => false` em toda leitura | nativo: o `web_fetch` do agente é uma cópia por `createTool` com a regra (o Builder usa o mesmo objeto, `builder.ts:61`); o `web_search` não precisa | o critério 5 | não precisa | — |
| Aprovar sozinho pela regra da sessão | fica de fora: não se usa | nenhum | `agent-controller-BDds1y5w.js:899-905` (a regra `allow` aprova na hora) | suspende e se aprova; perde a corrida | nativo, e rejeitado | Papéis P1 (12 de 200) e P5 (20 de 200); a causa, `agent.ts:8522` do Mastra | não precisa | — |
| A escrita fora do programa | U2 | `builder/agents/agent.ts:184-192` (o programa recebe `ofTheAgent`) | `tools-BVDic2bB.js:480-482` (o programa chama `tool.execute` direto, sem a pergunta) | o programa não passa pela aprovação | nativo: a escrita fica só direta, como o Computador e o `web_fetch` | o critério 10 | não precisa | — |
| Quem publica uma escrita que faz sozinha | U2 | `hub/identity/admission.ts:20-21,96-97` (`agent: manage`, `publish`) | `better-auth@1.7.8` `createAccessControl` | uma ação a mais no recurso `agent` | nativo: a ação é do Dono e do Administrador sempre e do Desenvolvedor quando a empresa a marca; `company-roles.ts` a recusa (`REQUEST_MALFORMED`, `UNATTENDED_NOT_BUILDER`) no Membro e nos papéis próprios, e a conferência lê a linha de cada papel, sem lista fixa | os critérios 9 e 17 | `D1` de Papéis; `D1-a`, 2026-11-07 | — |
| A rota da resposta | U2 | `builder/conversation/guard.ts:24-31` (a lista fixa, sem `tool-approval`), `:120-147` | `@mastra/server@1.82.0` `dist/server/handlers/agent-controller.js:194-207,709-760` (aprova o portão vivo ou, depois de reiniciar, a espera guardada por `respondToPersistedToolApproval`) | o corpo leva `toolCallId` e `approved` | embrulhado: o guarda recusa `alwaysAllowCategory`, porque a autonomia mora só na versão, recusa o **Aprovar** de quem não tem a escrita no papel (a linha "Quem aprova"), e só deixa passar a resposta a um portão vivo (`session.approval.isArmed`), porque depois de um reinício o cartão não volta e uma mensagem nova não recusa a espera guardada (`agent-controller-BDds1y5w.js:5440-5449` só solta portões vivos) | a medida H7; os critérios 7 e 8 | não precisa | — |
| Mensagem nova recusa, Parar recusa | U2 | — | `agent-controller-BDds1y5w.js:5447-5456` (`interrupted_by_user_message`), `:5227-5229` | a mensagem e o Parar soltam o portão vivo como recusa | nativo | a medida H6, no Postgres | não precisa | — |
| O reinício | U2 | `builder/conversation/conversation-update.test.ts:63-65` (o cartão do plano não volta depois de um reinício) | `agent-controller-BDds1y5w.js:4393-4394` (`pendingApprovals` só na memória), `:5233-5272` (`respondToPersistedToolApproval`, para um cartão que o anfitrião reconstrói) | o Mastra responde a espera guardada se o anfitrião souber o `toolCallId` | nativo no que o Mastra guarda; o cartão não volta, como o do plano, e o guarda recusa responder a espera guardada (linha acima) | o critério 8 | não precisa | — |
| O texto fixo do agente | U2 | `builder/agents/agent.ts:37-38` (`READ_ONLY`: "You only read…"), `:247`; a frase das ligações "this agent reads" (`:179`) | o próprio repositório | o modelo sabe o que as ferramentas fazem | nativo: o texto diz que a escrita passa pela ferramenta e pode pedir aprovação, só numa versão com escrita | o critério 12 | não precisa | — |
| Quem aprova | U2 | `builder/agents/conversation-routes.ts:33-40` (a conversa de agente pede `manageAgents`); o guarda da rota (`builder/conversation/guard.ts`) não confere o papel de quem aprova | Mastra canais `toolApprovers: 'requester'` (`reference-agents-channels.md:115`); Copilot Studio e Agentforce, a autoridade do agente; `better-auth@1.7.8` `hasPermission` (`has-permission.mjs:7-32`) | quem conversa responde, e quem responde precisa poder usar o que aprova | embrulhado: o guarda da rota (`guard.ts`, `refuseApprover`, na https://github.com/developmentconexus-ops/conexus/pull/843) confere `mayUse` com a PESSOA que toca **Aprovar**, para a operação da escrita (o mesmo `mayUse` do funil, `hub/identity/may-use.ts`), e responde `NOT_IN_ROLE` sem passar à rota nativa; **Recusar** não confere; nenhuma regra nova de papel, só a conferência no lugar que a rota já guardava | o critério 26 | `D3-a`, 2026-11-07 (substitui a `C1` de Papéis só nisto) | — |
| A escrita depois que a permissão sai | U2 | `builder/agents/tools.ts` (a função `requireApproval` da escrita: a chave `ASK`, ou um envio aberto da mesma escrita); `agent_version.published_by` já gravado em `publish.ts` e não lido | `@mastra/core@1.82.0` `createTool({ requireApproval: fn })`, a função que lança vira "perguntar" (`agent-BP9OWM6D.js:15129-15142`); `better-auth@1.7.8` `hasPermission` sem cache (`may-use.ts`, `useMemoryCache: false`); OpenAI, Copilot Studio e Agentforce: a autoridade do agente é a de quem o montou | a função lê a cada chamada, e na dúvida pergunta | nativo: dentro da mesma função, `aloneByPublisher` lê o papel de quem publicou a versão ativa (`mayPublishUnattended` e `mayUse` com uma PESSOA; quem saiu da empresa conta como sem a ação); nada novo no Mastra, e a versão não muda | o critério 24 | `D2-a`, 2026-11-07 | — |
| Restaurar uma versão | U2 | `builder/agents/agents.ts` (`activate` confere `refuseByRole` de hoje só para a leitura); `makeActive` não toca `published_by` | `better-auth@1.7.8` `hasPermission`; a regra de publicar do próprio cartão | restaurar passa pelas mesmas conferências de publicar | nativo: `activate` chama a mesma conferência de publicar (`refuseUnheld`, `publish.ts`), por quem restaura e sobre a configuração da versão que volta; `AGENT_ACTIVATED` leva `by`. Quem restaura passa a responder pela versão ativa: a coluna `agent.active_by`, gravada por `makeActive` e lida por `publisherLeavesAlone`; `published_by` não muda (a versão é imutável) | o critério 25 | `D3-a`, "restaurar uma versão é publicar"; a opção (b), 2026-11-08: "b, mas me explica melhor" | — |
| Quem aprovou, no registro | U2 | `hub/connectors/routes.ts` (as linhas de log da liberação) | Claude Code, o evento `tool_decision` (relato) | uma linha por decisão | embrulhado (a linha é nossa) | — | não precisa | — |
| O cartão | U3 | `apps/web/src/builder/conversation/plan-card.tsx`, `question-card.tsx` | bolt.diy `app/components/chat/ToolApprovalTray.tsx:43-110` (`353b44c`); Glean (o sistema, o registro e os campos) | o que vai ser escrito e dois botões | nativo (as peças da casa) | — | não precisa | `apps/web/src/builder/conversation/approval-card.tsx` |
| O cartão depois de recarregar | U3 | `apps/web/src/builder/conversation/session-state.ts` (o cartão do plano volta por `pendingSuspensions`) | `@mastra/server` `agent-controller.js:542-543` (`pendingApprovals` no estado da sessão) | o estado traz os pedidos abertos | nativo | o critério 16 | não precisa | — |
| A liberação ao Projeto | U3 (o texto) | `apps/server/src/hub/connectors/tables.ts:170` ("to read, the whole connection"); `apps/web/src/hub/connectors/text.ts:182,216` | Claude Enterprise (papel com conectores e ações); Activepieces (ações por projeto) | um lugar para quem, outro para onde | nativo | — | "A1", 2026-11-07 | — |
| Cancelar pelo agente | fica de fora: uma escrita depois, o comportamento num pedido "a confirmar" não documentado | — | Sankhya `POST /v1/vendas/pedidos/{codigoPedido}/cancela` com `{ motivo }`; "Pedidos faturados não serão cancelados" | cancela, não apaga | nativo (o kit), quando vier | — | "que aí eu consigo deletar depois" | — |
| O Builder, o Construtor e o Assistente | fica de fora: sem mudança | `construtor.ts:275`, `conversation/permissions.ts:60`, `assistant.ts:305` | Mastra Code começa em `yolo` (`mastracode/sdk/src/index.ts:1129`, `6e8dfcb8`) | ferramentas sem pergunta | nativo | — | 0053 | — |
| O leitor de recusas do Sankhya | U4 | `packages/connectors/src/sankhya/answers.ts:8-55`: o esquema `Refusal.error` só tem `code` e `message`, e `error.details`, onde o gateway real põe a causa, se perde; o corpo fica só em `native.body` (`:57-63`) | activepieces@f34c43cd `packages/pieces/common/src/lib/http/core/http-error.ts:1-49`; pipedream@05b24f0e `platform/lib/axios.ts:150-205`; n8n@2e855356 `packages/workflow/src/errors/node-api.error.ts:52-75` | guardam o corpo inteiro e compõem a mensagem a partir dele; nenhuma tem um esquema de erro por fornecedor | nativo: o leitor do kit, um esquema por conector com a união dos formatos medidos; no Sankhya, `error.message` e `error.details` | os critérios 27 e 28 | resposta 1; `D3` "okay" | — |
| O dublê com as recusas gravadas | U4 | `sankhya/fake-orders.ts:29-40` responde no formato da documentação (`mensagem: {code, message, details}`), que o leitor lê bem; `answers.test.ts:105-113` usa o formato real e não confere `details` | a T24 para provedores de modelo; o `nothingFound` do próprio dublê, no formato medido no real (`sankhya/fake-data.ts:35-45`) | o dublê manda o que o serviço real manda, gravado, com valores inventados | nativo (a regra nova do guia de testes, `D3` b) | os critérios 27 a 29 | `D3` "okay" | `packages/connectors/src/sankhya/refusals.ts` |
| Os itens do pedido | U4 | `sankhya/operations/vendas.ts:104-136`: o item só tem `codigoProduto`, `quantidade` e `valorUnitario`, e o pedido vai como o modelo o deu (`:135`) | Sankhya `addPedido` (developer.sankhya.com.br, página `addpedido`): o item pede `sequencia`, `codigoLocalEstoque`, `controle`, `codigoProduto`, `quantidade` e `valorUnitario`; o local, "quando existe controle de estoque envolvendo local" | o pedido leva cada item numerado, com local e controle | nativo: o `request` do kit numera e põe o local do item ou o do cabeçalho, função pura | o critério 30 | resposta 5 | — |
| A nota modelo | U4, U5, U6 | `vendas.ts`: `notaModelo` aberta ao modelo; a versão pronta deixa todo campo aberto (`builder/tools/check.ts:112-114`); `misfitOf` (`:80-101`) já confere uma versão contra a operação | Sankhya `addPedido`: `notaModelo` obrigatória, de onde vêm empresa, TOP e natureza; os valores fixos de uma versão (`ToolVersionConfig.bound`, `packages/hub-api/src/tools.ts:76-87`, "Valores fixos (JSON)" em `apps/web/src/builder/agents/tool-form.tsx:169`) | quem configura fixa o molde; o modelo nunca o escolhe | embrulhado: o kit declara `fixed: ['notaModelo']`; a versão pronta não o abre, `misfitOf` recusa uma versão que o abre ou não o fixa (`NOT_FIXED`), e a ferramenta em execução recusa uma versão ativa assim, publicada antes (`builder/agents/tools.ts:56-61`, `openOf`, lê o `open` gravado) | os critérios 39, 42 e 44 | `D1` "API oficial" | — |
| Estoque de um produto | U4 | `sankhya/operations/estoque.ts:6-31`: `estoque` lê a lista inteira, sem filtro de produto | Sankhya `GET /v1/estoque/produtos/{codigoProduto}`, chamado em 2026-11-08 com um produto de teste: 200 com `{estoque: [{codigoProduto, codigoEmpresa, codigoLocal, controle, estoque}]}` | uma leitura por produto | nativo (o kit) | o critério 31 | `D2` "gostei" | — |
| O incerto, a marca e o id de uma escrita | U4 | o Hub sabe três coisas do Sankhya: `GTW3503` (`hub/connectors/wrote.ts:17-27`), o campo `observacao` (`write.ts`, `markedInput`) e `codigoPedido` (`write.ts`, `logSent`) | a decisão 0056: um conector é uma definição, e o kit declara o que é do fornecedor | o kit declara; o funil pergunta | nativo: a escrita declara `uncertain`, `mark` e `idOf` (a decisão 0062, que emenda a 0056) | o critério 32 | `D3` "okay" | — |
| O funil entrega a resposta inteira | U5 | `write.ts` (`writtenOf` com `plain(native)`, `body: null`), `write-record.ts:76-95` (`Plain`, `body: z.null()`), `read.ts:38-41` (`summaryOf`), cada um citando a S41, que trata de logs e spans | pipedream@05b24f0e `platform/lib/axios.ts:150-205` (`err.message` é o corpo inteiro); n8n@2e855356 `packages/@n8n/nodes-langchain/nodes/tools/ToolHttpRequest/utils.ts:857-872` (o corpo vai ao modelo para ele não inventar a causa) | a resposta inteira a quem pediu; cada consumidor corta na sua borda | nativo: o funil devolve `native` inteiro; o app corta na sua porta (C51), o log só tem escalares (S41) | os critérios 33 e 36 | resposta 4 | — |
| A falha nativa do Mastra | U5 | `builder/agents/tools.ts`, `toldOf` e `readTool`: toda falha volta como resultado comum, que o modelo lê como sucesso | `@mastra/core@1.82.0` `packages/core/src/tools/tool-builder/builder.ts:1051-1072` (o erro vira `TOOL_EXECUTION_FAILED` com a mensagem e é relançado; o modelo recebe o texto com `is_error`); o cliente MCP do Mastra mantém o envelope inteiro de um `isError` (`packages/mcp/src/client/client.ts:1857-1882`); `dist/docs/references/docs-agents-tools.md:150`, um efeito que já aconteceu não se devolve como falha | lança o que certamente não foi aceito, com a resposta inteira no texto; o que pode ter entrado continua resultado | nativo | os critérios 34, 35 e 43 | resposta 1; `D3` "okay" | — |
| Quem aprovou e o desfecho, no registro | U5, U6 | `connector_write` sem quem aprovou (`hub/connectors/tables.ts:217-247`; `approvedBy` só na requisição, `builder/agents/tools.ts`); `approvalItem` some sem `inv.approval` (`apps/web/src/builder/conversation/approval-item.ts:113-115`) | `@mastra/core@1.82.0` `tool-call-step.ts:930-936`: `approval` só num sucesso aprovado | o histórico de uma escrita fica no dono durável (C63) | embrulhado: a coluna `approved_by` e a rota `listWrites`, no lugar de `listOpenWrites`; o cartão lê o registro | os critérios 37, 38, 40 e 41 | resposta 4 | migração `approved_by` |
| A linha de uma escrita na conversa | U6 | `slugToolSpec` diz "consultar" para toda `tool_<slug>` (`construtor-specs.ts:214-226`, por `tool-registry.ts:240-245`); a sala já sabe que é escrita (`room.ts:63`, `writeOf`); uma linha `output-error` é só `'error'` (`tool-registry.ts:258-259`) e desenha o `errorText` (`tool-row.tsx:76-84`); o `RECONNECT` de uma leitura vem do resultado (`connector-specs.ts:94-110`) | a Mastra UI desenha o histórico como linha comum (relido pelo estudo) | — | nativo (as peças da casa); o `kind` da falha lida por um esquema na borda | os critérios 40 e 45 | não precisa | — |
| A escrita na versão nova da biblioteca | U6 | `WriteLines` não dá `newer` à `Line` (`apps/web/src/builder/agents/write-lines.tsx:60-103`); só a linha de uma leitura oferece "Usar a versão N" (`connection-tools.tsx:69,104,170`, `tool-line.tsx:24-25,51-55`); a https://github.com/developmentconexus-ops/conexus/pull/856 tirou a escrita das linhas próprias, onde ela tinha o botão; hoje só desmarcar e marcar de novo troca a versão (`write-lines.tsx:78-79`) | as peças da casa | a linha oferece a versão mais nova da ferramenta escolhida | nativo: a `Line` da escrita recebe o mesmo `newerOf` | o critério 42 | não precisa | — |

**As medidas** (2026-11-05 e 06, `@mastra/core` 1.82.0, `@mastra/pg` 1.35.0, Postgres 18 local,
modelo de mentira; os roteiros e as saídas ficam fora do repositório, com o firstmate). Com o `yolo`
desligado e uma escrita com `requireApproval`: H1, aprovar roda uma vez; H2, recusar não roda; H4,
aprovar uma chamada não aprova a seguinte; H5, depois de um controlador novo no mesmo banco, a
espera guardada se responde por `toolCallId` e roda uma vez; H6, uma mensagem da pessoa recusa o
pedido aberto, e a resposta atrasada recebe `stale_tool_call`; H7, duas respostas ao mesmo tempo
rodam uma vez; H10, 20 conversas aprovadas ao mesmo tempo terminam, cada escrita uma vez; a carga
de 200 com a aprovação 1,5 s depois do pedido, 0 perdidas, e com a aprovação no mesmo instante, 7
de 100 presas sem rodar, nenhuma duas vezes; H11, na
memória, a chamada recusada pela mensagem não fica guardada para um **Aprovar** depois do
reinício. As medidas de Papéis: P1, a regra `allow` da sessão, 12 de 200 perdidas; P2 e P3, a regra
em cada ferramenta, 0 de 200; P5, `yolo` ligado com uma regra que devolve `true`, 20 de 200. A
causa (o relatório da corrida, 2026-11-06): a segunda gravação da mesma suspensão no Mastra
(`packages/core/src/agent/agent.ts:8522`, `workflows/default.ts:1153-1178`, 1.82.0), só quando a
aprovação vem na hora.

**A medida do transplante.** Nada vem do repositório antigo: ele não tinha escrita de agente. O
cartão segue o desenho do cartão do plano do `main`.

**A dívida.** Um envio `SENDING` ou `UNCERTAIN` não sai do registro depois que a pessoa o confere:
a escrita da mesma ligação e operação continua perguntando naquela conversa enquanto ela existir
(a página diz isso). Um estado "conferido" é outro cartão, quando o uso pedir. A corrida da resposta no mesmo instante do cartão é do Mastra (#27831, fechada lá sem
conserto); o relato pronto fica fora do repositório, esperando a autorização do firstmate para
mandar. A decisão 0053 continua para o Builder, o Construtor e o Assistente; no fechamento ela ganha
uma nota de escopo: o controlador dos agentes sai dela.

A dívida da emenda de 2026-11-08. A resposta inteira vai ao modelo sem teto próprio: o teto é o
de 2 MiB do executor (`apps/server/src/hub/connectors/wire.ts:10`, `RESPONSE_CAP_BYTES`; 0056, `N`), e uma recusa grande de outro fornecedor ocuparia o contexto do modelo; volta ao
fundador quando um conector a mostrar (https://github.com/developmentconexus-ops/conexus/issues/859).
A lista `fixed` de uma operação não está em decisão nenhuma; a decisão 0062 leva só o que a `D3`
aprovou (https://github.com/developmentconexus-ops/conexus/issues/860). Quando o rastreamento da decisão 0052 entrar, a lista de
atributos permitidos (S42) corta a mensagem do erro da ferramenta, porque o corpo estará nela; hoje
não há spans (`builder/mastra/mastra.ts`, sem `observability`). A checagem da documentação
(`sankhya/spec.test.ts`) não confere os obrigatórios que o kit não manda; ela pede uma lista declarada
das exceções, como os campos de NF-e do cabeçalho. O 400 real do `addPedido` nunca foi gravado: o
envelope da recusa gravada é o do 404 real, e o pedido de prova do roteiro o troca pelo real.

## U1 A escrita no Sankhya

**Base e modelo.** O `main` do dia, com Papéis. Sonnet: segue o funil de leitura e o kit, sem
desenho novo entre módulos.

### As linhas da tabela

A operação que lança o pedido, o dublê dos pedidos, o funil de escrita, nunca duas vezes, o pedido
igual sem resposta (a consulta e a trava), quanto tempo a linha fica, quem usa a escrita.

Leia na base `packages/connectors/src/kernel/{operation,definition}.ts`,
`sankhya/{definition,fake,fake-data,spec-source}.ts`, `sankhya/operations/vendas.ts`,
`apps/server/src/hub/connectors/{read,executor}.ts` e o `may-use.ts` de Papéis.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Muda `definition.ts`: as escritas do conector, uma lista lida pelo funil de escrita (a porta de leitura continua recusando `write`, `:117`) | o kit, a conformidade, o Hub |
| `packages/connectors/src/sankhya/` | Muda `operations/vendas.ts` (`lancarPedido`), `operations/index.ts`, `spec-source.ts` (a página `addpedido`); cria `fake-orders.ts`; muda `fake.ts` | o kit |
| `apps/server/src/hub/connectors/` | Cria `write.ts` e `write-record.ts` (o registro e `openWritesOf`); muda `executor.ts` (a escrita sem repetição), `tables.ts` (`connectorWrite`), `public.ts` (C4) | a ferramenta da escrita (U2) |
| `apps/server/migrations/`, `apps/server/database-grants.sql` | Cria a tabela `connectors.connector_write` e as suas permissões, num pull request próprio (D11; a aprovação desta página é a palavra do fundador) | o Drizzle, `catalog.test.ts` |

### Os contratos que a unidade cria

```ts
// packages/connectors/src/sankhya/operations/vendas.ts
export const lancarPedido // defineOperation({ id: 'lancarPedido', class: 'write', idempotent: false, subject: 'vendas', label: 'Lançar pedido', … })
LancarPedidoInput = z.object({
  notaModelo: z.number().int().positive(),
  codigoCliente: z.number().int().positive(),
  codigoVendedor: z.number().int().positive().optional(),
  observacao: z.string().max(150).optional(), // o funil acrescenta a marca de markOf(); o tamanho do campo no Sankhya, passo 1
  itens: z.array(z.object({ codigoProduto: z.number().int().positive(), quantidade: z.number().positive(), valorUnitario: z.number().nonnegative().optional() })).min(1),
})
// answer: OK only with retorno.codigoPedido; [CORE_E…] or 400 INVALID_REQUEST → REFUSED with the text

// apps/server/src/hub/connectors/write.ts
// ToolCallId: packages/hub-api/src/questions.ts:4 (já existe); TurnKey: hub/connectors/assistant-port.ts:39
export type WriteRequest = Readonly<{ speaker: Speaker; scope: SessionScope; connectionId: ConnectionId; operation: OperationId; input: unknown; threadId: ConversationId; toolCallId: ToolCallId; turn: TurnKey; approved: boolean; signal?: AbortSignal }>
// speaker VERSION carries { agentId: AgentId, number }: a version has no id of its own (builder.agent_version, primary key (agent_id, number))
// approved: a person answered Aprovar for this toolCallId (U2 reads it in execute, step 1a); false when no card was shown
export function markOf(threadId: ConversationId, toolCallId: ToolCallId): string // "Conexus " + 8 caracteres de um hash dos dois; o dono único da marca
export type Written =
  | Readonly<{ kind: 'OK'; value: unknown }>
  | Readonly<{ kind: 'NOT_IN_ROLE' }>
  | Readonly<{ kind: 'NOT_GRANTED' }>
  | Readonly<{ kind: 'WRITE_UNCERTAIN'; mark: string }>
  | Readonly<{ kind: 'WRITE_OPEN'; mark: string; sentAt: Instant }> // an open write of the same connection and operation in the conversation
  | Readonly<{ kind: 'IDEMPOTENCY_CONFLICT' }> // the same key with another input (C37)
  | Readonly<{ kind: 'UNREACHABLE' | 'DEADLINE' }> // only before the send
  | Exclude<Answered<unknown>, { kind: 'OK' }>
export function writeThrough(deps: WriteDeps, request: WriteRequest): Promise<Written>

// apps/server/src/hub/connectors/write-record.ts, exported through public.ts for U2
export type OpenWrite = Readonly<{ state: 'SENDING' | 'UNCERTAIN'; sentAt: Instant; mark: string }>
export type OpenWrite = … & Readonly<{ connectionId: ConnectionId; operation: OperationId }>
export function openWritesOf(deps: Deps, key: Readonly<{ companyId: CompanyId; threadId: ConversationId; connectionId?: ConnectionId; operation?: OperationId; except?: ToolCallId }>): Promise<readonly OpenWrite[]>
// except: the call's own toolCallId, whose row is read by the key and never blocks itself

// apps/server/src/hub/connectors/tables.ts
connectors.connector_write (
  company_id text not null references auth.company(id) on delete cascade,
  thread_id text not null, tool_call_id text not null,
  connection_id uuid not null, operation_id text not null, input_hash text not null,
  agent_id uuid null, version_number integer null, person_id text null, -- a versão publicada inteira, ou a pessoa num rascunho
  check ((agent_id is not null and version_number is not null and person_id is null)
      or (agent_id is null and version_number is null and person_id is not null)),
  state text not null check (state in ('SENDING', 'DONE', 'REFUSED', 'UNCERTAIN')),
  answer jsonb null, created_at timestamptz not null,
  primary key (company_id, thread_id, tool_call_id)
) // política de linha da empresa (0039); hub_company: SELECT, INSERT, UPDATE (state, answer); sem DELETE: a linha sai pela cascata, sem expiração nesta etapa
```

- O estado do envio é a união `state`, e o `Written` é separado por `kind` (C21).
- Os ids são `ConnectionId`, `OperationId`, `ToolCallId` (o de `packages/hub-api/src/questions.ts:4`,
  sem segundo dono) e `TurnKey` (C23).
- Quem fala: numa versão publicada, `VERSION` (a `C1` de Papéis); num rascunho, que não tem versão,
  `PERSON`, a pessoa que conversa com o rascunho e o edita. Se Papéis ficou de outro jeito no `main`,
  siga o `main` e diga.
- O dono das escritas de um conector é a lista do kit, pela classe; o funil não tem outra (C26).
- A entrada é o esquema Zod da operação (C27).
- O arquivo tomado como modelo é `read.ts` (`readThrough`) com o `speaker` de Papéis; ele cumpre
  C21 e C26 depois de Papéis. A diferença é uma só: a linha do registro, confirmada antes do
  executor, fora da transação curta da admissão (D22: nenhum lock atravessa a chamada ao Sankhya).
- `CONNECTOR_WRITE_SENT` é impresso com o `codigoPedido` antes do `UPDATE` final; se o `UPDATE` falha,
  o modelo recebe o `OK` e o processo imprime `CONNECTOR_WRITE_UNRECORDED`.
- O texto de `WRITE_UNCERTAIN` ao modelo diz: não chame de novo; conte à pessoa a marca para ela
  procurar o pedido no Sankhya. `IDEMPOTENCY_CONFLICT` e `WRITE_OPEN` também dizem para não chamar de
  novo; o `WRITE_OPEN` diz a marca e a hora e pede à pessoa que confira. Um dono só para cada texto,
  como `uncertainText`.
- `openWritesOf` usa o começo da chave primária (`company_id`, `thread_id`); índice novo só se o
  `EXPLAIN` pedir.
- A trava mora no funil do Hub, nunca num kit: antes do `INSERT`, com linhas abertas de outras
  chamadas e `approved` falso, o funil devolve `WRITE_OPEN` e não grava nem envia. É ela que confere de novo
  dentro do `execute` da ferramenta (a documentação do Mastra: o que muda durante a espera se
  confere de novo no `execute`).

### As skills e a leitura

As linhas de `docs/reference/stack.md` das pastas da unidade: `node`, o Drizzle da casa
(`data.md`). A skill `mastra` não: esta unidade não toca o Mastra.

### A ordem do trabalho

1. A API: acrescente `addpedido` e `postcancelapedido` às páginas de `spec-source.ts` e leia-as
   pelo kit, como as leituras foram lidas. A página lista campos de NF-e como obrigatórios, o que o
   texto contradiz: escreva no relatório da construção o mínimo que o esquema do kit aceita, e o
   dublê segue o texto. Nada é chamado no Sankhya.
2. O kit: `lancarPedido` com o esquema acima; as escritas do conector numa lista que a conformidade
   confere (só `class: 'write'`). Regras: C21, C27.
3. O dublê: `fake-orders.ts` guarda pedidos por `codigoPedido` com o estado e a observação; as
   chaves `lostAfterStore` e `lostBeforeStore`; o 400 `INVALID_REQUEST` com um produto que não
   existe; o 200 com `[CORE_E…]`.
4. A migração e as permissões de `connector_write`, com a chave estrangeira da empresa em cascata,
   no seu pull request (D11).
5. `write.ts`: numa transação curta, a admissão (`speaker`, `mayUse` com o papel lido na hora, sem o
   cache de papéis do Better Auth, a ligação oferecida ao Projeto, a escrita na lista do conector);
   numa segunda transação curta, sob `pg_advisory_xact_lock` de um hash da empresa, conversa,
   ligação e operação: primeiro a linha da própria chave (igual: devolve o que ela diz; outro hash:
   `IDEMPOTENCY_CONFLICT`), depois `openWritesOf` sem a própria chamada e a trava, e só então o
   `INSERT` com `SENDING`, confirmado antes da chamada (nenhum lock atravessa a chamada, D22); a chamada ao executor com a marca no fim da observação
   (um texto que não cabe com a marca é recusado com o espaço que sobra); depois, o `UPDATE` para
   `DONE`, `REFUSED` ou `UNCERTAIN` com a resposta. A linha da própria chave nunca se envia de novo
   (`SENDING` vira `WRITE_UNCERTAIN`).
6. `executor.ts`: uma escrita não repete. Corte, 5xx, `GTW3503` e um 2xx sem `codigoPedido` legível
   depois do envio viram `WRITE_UNCERTAIN`; `UNREACHABLE` e `DEADLINE` antes do envio são a falha ao
   modelo; o `TOKEN_EXPIRED` do gateway marca a chave para renovar e devolve a falha.

### Como se prova

Os critérios 1 a 4, 19 e 22, pelo funil e pelo dublê, contando os pedidos que ele recebe. Hoje falham
todos.

### Parar se

- A página do `addPedido` lida pelo kit disser que um campo do esquema acima não existe, ou que o
  pedido não nasce "a confirmar": escreva o que leu e pare antes do dublê.
- O `mayUse` de Papéis não estiver no `main`: pare; não se cria uma regra provisória.
- O funil de leitura de Papéis tiver ficado diferente do que este cartão supõe (`speaker` em
  `ReadRequest`): siga o que estiver no `main` e diga a diferença.

## U2 O agente pergunta ou faz sozinho

**Base e modelo.** O `main` com a U1. Opus: cruza o controlador, todas as ferramentas do agente, a
conferência de publicar e a rota, e a carga é concorrência.

### As linhas da tabela

A escrita como linha de ferramenta, a chave, o `yolo` desligado, a regra em toda ferramenta, o pedido
sem resposta (a função, a aprovação no `execute` e `listOpenWrites`), a escrita fora do
programa, quem publica uma escrita que faz sozinha, a rota da resposta, mensagem nova e Parar, o reinício, quem aprova, quem aprovou no registro.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/agents/` | Muda `controller.ts` (`yolo: false`), `agent.ts` (a escrita fora do programa; a regra em cada ferramenta), `tools.ts` (a ferramenta da escrita sobre `writeThrough`), `code-tools.ts`, `publish.ts` e a gravação do rascunho (a ação), `tables.ts` (a coluna `approval`), `frozen.ts`; cria `approval.test.ts`, `approval-load.test.ts` | o controlador "agentes" |
| `apps/server/src/builder/agents/conversation-routes.ts` | Serve `listOpenWrites`, a leitura do aviso | o cartão (U3) |
| `apps/server/src/builder/conversation/` | Muda `guard.ts` (a rota `tool-approval` na lista fixa; recusa `alwaysAllowCategory`), `builder.ts` (`web_fetch` e `web_search` com a regra) | o servidor do Mastra no Hub |
| `apps/server/src/builder/machine/` | Muda a área de trabalho dos agentes: `tools.requireApproval: () => false` | as conversas com Computador |
| `apps/server/src/hub/identity/` | Muda `roles.ts` e `admission.ts` (a ação `agent: publishUnattendedWrite`) | a publicação, a tela de Papéis |
| `apps/server/migrations/` | A coluna `approval` em `builder.agent_version_tool` (a permissão de tabela de hoje cobre; D11 não muda) | o Drizzle |
| `packages/hub-api/src/{tools,agents,roles}.ts` | `ToolEffect` com `'WRITE'`; `approval` na escolha da ferramenta; `listOpenWrites`; a ação | a web, o servidor |
| `apps/server/src/platform/recordings/mastra/` | As gravações do `tool_approval_required` e do `pendingApprovals` (T26) | os testes da U2 e da U3 |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/tools.ts
export const ToolEffect = z.enum(['READ', 'WRITE']) // from the operation's class (C26)
// packages/hub-api/src/agents.ts
export const ToolApproval = z.enum(['ASK', 'AUTO']) // only on a WRITE tool; absent on a read
// the agent's tool choice gains `approval?: ToolApproval`; a WRITE without it is saved as 'ASK'

// apps/server/src/builder/agents/tables.ts
agent_version_tool.approval text null check (approval in ('ASK', 'AUTO'))

// apps/server/src/hub/identity/roles.ts
agent: ['manage', 'publish', 'publishUnattendedWrite'] // owner and admin always; the developer when the company marks it (D1-a); never the member or a custom role

// apps/server/src/builder/agents/tools.ts: the tool of a WRITE operation
createTool({
  id: `tool_${slug}`,
  requireApproval: async (_input, { requestContext }) =>
    tool.approval === 'ASK' || (await openWritesOf(…, keyFrom(requestContext))).length > 0,
  execute: (input, { agent }) =>
    writeThrough(…, { toolCallId: agent.toolCallId, threadId: agent.threadId, speaker: { kind: 'VERSION', agentId, number }, approved }),
})
// requestContext here is a plain object (Object.fromEntries, agent-BP9OWM6D.js:15110), read by key, never .get(); absent ctx or a throw makes Mastra ask (true)
// approved: true only on the execute that follows a person's Aprovar on this toolCallId; the person is in CONNECTOR_WRITE_APPROVED, printed by the guard

// packages/hub-api/src/agents.ts, served in builder/agents/conversation-routes.ts with serve(), like listAgentConversations (agents.ts:305)
export const listOpenWrites // GET `${BASE}/{agentId}/conversations/{conversationId}/open-writes` → { writes: OpenWrite[] }
// the card matches its tool_<slug> to the connection and operation through the version's tool list it already reads
// the same manageAgents admission as the other agent conversation routes; only state, time and mark, never the write's fields (S40)
// every other tool of the agent: requireApproval: () => false
```

- A chave é a união `ToolApproval`, só na escrita (C21).
- O `toolCallId` vem do contexto da ferramenta e vira `ToolCallId` com marca no funil (C23).
- A classe da operação tem um dono, o kit, e o `ToolEffect` deriva dela; a autonomia tem um dono, a
  versão; nada no estado de sessão do Mastra (C26).
- O corpo da rota passa pelo esquema nativo e pelo guarda (C27).
- O arquivo tomado como modelo é `tools.ts` (`presetTools`): cumpre C21 e C26; recebe `operation`
  sem marca, e a ferramenta nova a recebe com marca (C23).

### As skills e a leitura

`mastra` (no `node_modules/@mastra/core/dist/docs` 1.82.0: `docs-agents-human-in-the-loop.md`
100-160, `docs-harness-agent-controller.md` 266-470, `reference-workspace-workspace-class.md` 60-135),
`node`, `typescript-magician`, as linhas de `docs/reference/stack.md` das pastas.

### A ordem do trabalho

1. A prova, antes do código de produto, pelo controlador "agentes" de verdade e o `PostgresStore`
   do banco de teste: com `yolo: false`, cada tipo de ferramenta do agente com a sua regra roda sem
   `tool_approval_required` (critério 5); a mensagem nova recusa e o **Aprovar** atrasado não roda
   (critério 6, que a medida H11 só provou na memória); a retomada depois de **Aprovar** leva o
   `conexus-agent-run` e a chave do turno (`conexus-agent-turn-key`, que só o `processInput` põe,
   `agent.ts:219-231`, e a retomada não passa por ele), e o `threadId` e o `toolCallId` do contexto da ferramenta na retomada são os da chamada; que os modelos que o Hub usa não repetem um `toolCallId` numa conversa (as gravações de Anthropic, OpenAI e Google); o
   reinício do critério 8, com a mensagem seguinte rodando normal ao lado da espera guardada.
1a. Antes do código da função, confirme que o `requestContext` que chega à função `requireApproval`
   da ferramenta (`@mastra/core` `tools/types.d.ts:671-674`) traz a empresa e a conversa, numa
   primeira chamada e na retomada (o Mastra põe a conversa em `MASTRA_THREAD_ID_KEY`; o Hub põe a
   execução em `conexus-agent-run`, `agent.ts:53,75`). Se faltar uma, ponha-a no `requestContext`
   pelo caminho nativo, onde o Hub já põe a execução; nada de estado guardado ao lado. Prove também
   como o `execute` sabe que esta chamada passou por um **Aprovar** (o contexto da retomada traz
   `resumeData`, `tools/types.d.ts:131,185`; ou o guarda da rota põe a marca no `requestContext` da
   retomada), e que um `execute` sem cartão o lê falso.
2. `ToolEffect`, a coluna `approval` e a escolha da ferramenta; a gravação da versão grava `ASK`
   numa escrita sem a chave.
3. A ação `publishUnattendedWrite` em `roles.ts` e `admission.ts`; a conferência em `publish.ts`.
4. `tools.ts`: a ferramenta da escrita; `agent.ts`: a regra `() => false` em toda outra ferramenta
   (o `web_fetch` numa cópia por `createTool`, sem mudar o objeto do Mastra que o Builder usa), a
   escrita fora de `ofTheAgent` do programa, e o `READ_ONLY` só numa versão sem escrita; a área de
   trabalho com `tools.requireApproval`. A gravação do rascunho e a publicação recusam `AUTO` sem a
   ação.
   `controller.ts`: `yolo: false`, e o comentário da 0053 sai.
5. `guard.ts`: `POST ${SESSION}/tool-approval` na lista fixa (S39), recusando `alwaysAllowCategory`
   e respondendo `ok: false, reason: 'not_pending'` quando o `toolCallId` do corpo já lido não é um
   portão vivo da sessão, antes do handler do Mastra: a sessão vem de
   `mastra.getAgentController(CONTROLLER_KINDS[kind].id)?.getSession(conversationId)` (como
   `construtor/routes.test.ts:185`), e `session.approval.isArmed({ toolCallId })`
   (`agent-controller-BDds1y5w.js:3084`); sem sessão, o mesmo `not_pending`. O gancho de hoje só
   lança `Failure`; aqui ele responde com `reply.send` e para a cadeia.
   Imprima `CONNECTOR_WRITE_APPROVED` ou `_DECLINED`.
6. As gravações do Mastra (T26) e os testes sobre elas.

### Como se prova

Os critérios 5 a 12, 18, 20 e 23. O 11 roda no `PostgresStore` do banco de teste, como a medida de Papéis;
o 8 sobe um Hub novo ao lado do mesmo banco. Os testes de `permissions.test.ts` passam sem mudar.

### Parar se

- Um tipo de ferramenta do agente não aceitar a regra e suspender com `yolo: false`: diga qual e
  pare; não se põe regra na sessão (é ela que perde chamadas).
- A retomada perder o `conexus-agent-run`, a chave do turno, o `threadId` ou o `toolCallId`: diga onde e pare.
- A função `requireApproval` não receber a empresa e a conversa, e o `requestContext` não as aceitar
  pelo caminho nativo; ou o `execute` não souber distinguir uma chamada aprovada de uma sem cartão:
  diga onde e pare.
- Um modelo que o Hub usa repetir um `toolCallId` na mesma conversa: diga qual e pare; a chave do registro volta ao estudo.
- A mensagem nova não recusar no Postgres, ou um **Aprovar** atrasado rodar a escrita: pare com os
  números.
- O critério 11 perder uma chamada, ou uma escrita rodar duas vezes: volte ao firstmate com os
  números. A espera de 1,5 s do teste é o ritmo de uma pessoa, não um conserto; não se aumenta para
  passar.

## U3 As telas

**Base e modelo.** O `main` com a U2. Sonnet.

### As linhas da tabela

A escrita como linha de ferramenta, a chave, o cartão, o cartão depois de recarregar, o pedido sem
resposta (o aviso), a liberação ao Projeto (o texto).

Leia `apps/web/src/builder/agents/chooser.tsx` e `connections-section.tsx` como
Papéis os deixou, `apps/web/src/builder/conversation/{plan-card,rows,session-state,text}.ts(x)`,
`apps/web/src/hub/identity/roles.tsx`, `apps/web/src/hub/connectors/text.ts:182,216`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/agents/` | Muda `chooser.tsx` (a linha "escreve" com a chave; "Marcar todas as leituras" a ignora) | a página do agente |
| `apps/web/src/builder/conversation/` | Cria `approval-card.tsx`; muda `rows.ts` (o `tool_approval_required` vira o cartão), `session-state.ts` (`pendingApprovals`), `text.ts` | a sala do agente |
| `apps/web/src/hub/identity/` | Muda `roles.tsx` (a ação, fixa no Dono e no Administrador) | Configurações › Papéis |
| `apps/web/src/hub/connectors/` | Muda `text.ts` (a confirmação de "Liberar", pela `A1`) | Integrações do Projeto |
| `docs/reference/screens.md` | As caixas do cartão e da linha da escrita | a QA |

### A ordem do trabalho

1. As caixas a 1280 e a 390 px em `screens.md`.
2. `approval-card.tsx` sobre o desenho de `plan-card.tsx`, com as peças de `ui/`: o logotipo e o
   nome da ligação, a ação e os campos dos `args`, a linha do aviso quando há um envio aberto da mesma escrita
   (a hora e a marca, lidas por `listOpenWrites` da U2 quando o cartão aparece),
   **Aprovar** e **Recusar**, e a frase sob a caixa.
   As respostas vão pela rota `tool-approval`. Os botões acendem só quando o `pendingApprovals` lido
   traz o `toolCallId`.
3. `rows.ts` e `session-state.ts`: o cartão volta pelo `pendingApprovals`; os estados do critério 15
   vêm do resultado da ferramenta e da recusa (`interrupted_by_user_message`, o Parar).
4. A linha da escrita na página do agente e a ação na tela de Papéis.
5. Os textos: "O {agente} quer {ação} no {sistema}", "Aprovar", "Recusar", "Aprovado por você",
   "Recusado", "Recusado porque você mandou outra mensagem", "Recusado porque você parou a conversa",
   "Não conseguiu lançar", "Não deu para saber se o pedido foi lançado. Procure no Sankhya a
   observação Conexus …", "Um pedido foi enviado às {hora} e não sabemos se entrou. Confira no
   Sankhya pela marca {marca} antes de aprovar.", "Escrever outra mensagem recusa este pedido.", "escreve", "Pergunta antes",
   "Faz sozinho", "Seu papel não publica escrita que faz sozinha", "Publicar agente que escreve
   sozinho", e a confirmação de "Liberar". Vão ao fundador no fim.

### Como se prova

Os critérios 13 a 17 e 21, e a QA curta da página do agente e da sala nos dois temas, a 1366 e 390 px.
O 18 roda com o modelo de verdade, pelo firstmate.

### Parar se

- A sala trava a caixa de mensagem durante a aprovação: diga onde; não se cria um estado novo.
- A tela de Papéis não tiver lugar para uma ação que não é de conector: diga onde; o fundador
  aprova o lugar.

## U4 O kit sabe o que é do Sankhya

**Base e modelo.** O `main` do dia, com a U1 a U3. Sonnet: o leitor, o dublê e a operação seguem
o kit, e o Hub só passa a perguntar à operação.

### As linhas da tabela

O leitor de recusas do Sankhya, o dublê com as recusas gravadas, os itens do pedido, a nota modelo
(o campo `fixed`), Estoque de um produto, o incerto, a marca e o id de uma escrita.

Leia na base `packages/connectors/src/kernel/{operation,conformance,request}.ts`,
`sankhya/{answers,fake-orders,fake-data,spec-source}.ts`, `sankhya/operations/{vendas,estoque}.ts`,
`apps/server/src/hub/connectors/{wrote,write}.ts`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Muda `operation.ts` (a escrita declara `uncertain`, `mark`, `idOf`; toda operação pode declarar `fixed`), `conformance.ts` (as recusas gravadas) | o kit, o Hub |
| `packages/connectors/src/sankhya/` | Cria `refusals.ts`; muda `answers.ts` (`error.details`), `operations/vendas.ts` (os itens, `fixed`, as três declarações), `operations/estoque.ts` (`estoqueDoProduto`), `spec-source.ts` (a página do estoque de um produto), `fake-orders.ts` (importa a recusa) e o dublê do estoque | o kit |
| `apps/server/src/hub/connectors/` | Muda `wrote.ts` (apaga `GATEWAY_TIMEOUT`; pergunta `operation.uncertain`) e `write.ts` (apaga `markedInput`, `Observed` e `OrderCode`; chama `operation.mark` e `operation.idOf`) | a ferramenta da escrita |

### Os contratos que a unidade cria

```ts
// packages/connectors/src/kernel/operation.ts
// every operation may name the fields only whoever configures the tool sets; the model never fills them
fixed?: readonly string[] // keys of the input's top level; the conformance checks each one exists
export type WriteOperation<I, O> = Operation<I, O, 'write'> & Readonly<{
  uncertain(native: Native): boolean // the provider's answer leaves the write's end unknown (Sankhya: GTW3503)
  mark(input: I, mark: string): unknown // the input with the mark where the person finds the write; parsed again by `input`
  idOf(value: O): string | number | null // the one scalar the log may print (Sankhya: codigoPedido)
}>
// defineOperation with class 'write' requires the three (TypeScript refuses a write without them)

// packages/connectors/src/sankhya/refusals.ts
export const refusals: readonly Readonly<{ operation: OperationId; status: number; body: unknown; kind: Failure['kind'] }>[]
// each body recorded from the real gateway, values invented (S40); a comment names the route, the date and what was measured

// packages/connectors/src/sankhya/operations/vendas.ts
LancarPedidoInput = z.object({
  notaModelo: z.number().int().positive(), // fixed
  codigoCliente, codigoVendedor?, observacao?, // as today
  codigoLocalEstoque: z.number().int().positive().optional(), // the order's place; at the top so `bound` can fix it, and when given it wins over every item's (`D2`)
  itens: z.array(z.object({
    codigoProduto, quantidade,
    valorUnitario: z.number().nonnegative(), // required, as the page asks
    codigoLocalEstoque: z.number().int().positive().optional(),
    controle: z.string().optional(),
  })).min(1),
}) // refused when an item has no place of its own and the order none: the message tells the model to read the product's stock
// request: each item with sequencia 1..n, the order's place when given or else its own, controle given or ''

// packages/connectors/src/sankhya/operations/estoque.ts
export const estoqueDoProduto // read, GET /v1/estoque/produtos/{codigoProduto}: lines { codigoEmpresa, codigoLocal, controle, estoque }
```

- A recusa é a união `Failure`, separada por `kind`, e o estado da escrita continua o do funil (C21).
- O dono de cada fato do Sankhya é o kit: o incerto, o campo da marca, o id do que foi escrito, os campos fixos e o
  formato da recusa (C26). Nada disso fica no Hub nem na tela.
- O corpo da resposta é parseado uma vez, na borda do kit (C27).
- O arquivo tomado como modelo é `answers.ts` com o `NothingFound` (`:83-89`), que já lê `details`
  no envelope real; ele cumpre C21 e C26. O dublê toma `fake-data.ts:35-45` como modelo.

### As skills e a leitura

As linhas de `docs/reference/stack.md` das pastas: `node`, `typescript-magician`. A skill `mastra`
não: a unidade não toca o Mastra.

### A ordem do trabalho

1. `refusals.ts` com a recusa do critério 27 e o `kind` ao lado; o comentário diz de onde veio cada
   parte (o envelope do 404 real, o código e a mensagem do 400 real, a causa inventada).
2. `answers.ts`: `error` como objeto ganha `details`, e `locate` junta `message` e `details` sem
   repetir. Regras: C27, C52.
3. A conformidade: cada recusa gravada passa por `operation.answer`, com o `kind` gravado, e cada
   texto do corpo aparece em `native.message`. Plante o leitor de hoje e veja o caso falhar.
4. `fake-orders.ts` responde a todo produto fora do catálogo com a recusa gravada, como ela está
   (a causa nomeia o produto inventado 999); o formato da documentação sai, e a recusa "Pedido sem
   cliente ou sem itens." (`fake-orders.ts:60`) também, porque o esquema do kit não deixa esse
   pedido sair.
5. `vendas.ts`: o esquema acima, o `request` que numera e põe local e controle (o do cabeçalho
   vence), `fixed`, e as três declarações; o `probe` (`vendas.ts:134`) passa a mandar `valorUnitario`
   e um local, para caber no esquema novo. `estoque.ts`: `estoqueDoProduto`, e a página em `spec-source.ts`.
6. O Hub: `wrote.ts` pergunta `operation.uncertain(native)` no lugar do `GTW3503`; `write.ts` chama
   `operation.mark` no lugar de `markedInput` (o `roomLeft` de hoje continua: o esquema da operação
   julga o texto com a marca) e `operation.idOf` no lugar de `OrderCode`. Os testes de
   `write.test.ts` passam sem mudar.

### Como se prova

Os critérios 27 a 32, pelo kit e pelo dublê. O 27 e o 28 falham hoje.

### Parar se

- A página do estoque de um produto, lida pelo kit, não tiver a rota ou os campos acima: escreva o
  que leu e pare antes da leitura.
- O esquema de `defineOperation` não puder exigir as três declarações só na escrita sem `as`: diga
  onde e pare.

## U5 A falha chega inteira ao modelo

**Base e modelo.** O `main` com a U4. Opus: cruza o funil, o registro, a ferramenta do agente, as
portas de leitura, a rota e a publicação.

### As linhas da tabela

O funil entrega a resposta inteira, a falha nativa do Mastra, quem aprovou e o desfecho no registro
(a coluna e a rota), a nota modelo (a versão pronta e `misfitOf`).

Leia na base `apps/server/src/hub/connectors/{write,write-record,read,app-calls,builder-port,assistant-port,tables,public}.ts`,
`apps/server/src/builder/agents/{tools,publish,conversation-routes}.ts`,
`apps/server/src/builder/tools/check.ts`, `packages/hub-api/src/{open-writes,agent-failures}.ts`,
`apps/server/src/builder/mastra/logger.ts`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/connectors/` | Muda `write.ts` (apaga `plain`; o `Written` com `native` inteiro), `write-record.ts` (`Stored` com `body: z.unknown()`; `approved_by`; a leitura de `listWrites`; o comentário de `:76`), `read.ts` (`readThrough` devolve `native` inteiro; `summaryOf` vai para a porta do app; o comentário de `:38`), `app-calls.ts` (o corte do app, C51), `tables.ts` (`approvedBy`), `public.ts` | a ferramenta, a rota, o app |
| `apps/server/migrations/` | A coluna `connector_write.approved_by text null`, num pull request próprio (D11; a aprovação desta emenda é a palavra do fundador) | o Drizzle, `catalog.test.ts` |
| `apps/server/src/builder/agents/` | Muda `tools.ts` (a escrita e a leitura lançam `ConnectorRefused`; `toldOf` só para os resultados; `openOf` tira os campos `fixed` e a escrita recusa `NOT_FIXED` antes do funil), `conversation-routes.ts` (serve `listWrites` ao lado de `listOpenWrites`), `publish.ts` (o motivo `NOT_FIXED`) | o controlador "agentes" |
| `apps/server/src/builder/tools/` | Muda `check.ts` (`readyConfig` sem os campos `fixed`; `misfitOf` recusa `fixed` aberto ou sem valor) | a biblioteca, a publicação |
| `packages/hub-api/src/` | Muda `open-writes.ts` (acrescenta `listWrites` e `WrittenRow`; `listOpenWrites` e `OpenWrite` ficam, porque seis arquivos da web os importam, e a U6 os apaga), `agent-failures.ts` (`NOT_FIXED`) | a web, o servidor |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/open-writes.ts: added beside listOpenWrites and OpenWrite, which U6 deletes with the web's move
export const WrittenRow = z.object({
  toolCallId: ToolCallId, connectionId: ConnectionId, operation: OperationId,
  state: z.enum(['SENDING', 'DONE', 'REFUSED', 'UNCERTAIN']),
  sentAt: z.iso.datetime(), mark: z.string(),
  approved: z.boolean(), // a person answered Aprovar for this call
  message: z.string().nullable(), // on REFUSED, the system's message as it came; never the write's fields (S40)
})
export const listWrites // GET `${…}/agents/{agentId}/conversations/{conversationId}/writes` → { writes: WrittenRow[] }, oldest first

// packages/hub-api/src/agent-failures.ts
ProblemReason gains 'NOT_FIXED' // a version leaves open, or does not fix, a field the operation declares `fixed`

// apps/server/src/builder/agents/tools.ts
class ConnectorRefused extends Error // name 'ConnectorRefused'; message: JSON.stringify({ kind, status, code, message, body })
// thrown for every answer that was surely not taken (criterion 35); OK, WRITE_UNCERTAIN, WRITE_OPEN and IDEMPOTENCY_CONFLICT are returned
// also thrown, before the funnel, as { kind: 'NOT_FIXED', field } when the active version leaves a `fixed` field open or unbound (criterion 44)

// apps/server/src/hub/connectors/tables.ts
connector_write.approved_by text null // the person of Aprovar; null in Faz sozinho; written with SENDING
```

- O estado da escrita continua a união `state`; `WrittenRow.state` deriva dela (C21, C26).
- O dono do corte é cada consumidor na sua borda: o app (C51), o log (S41), o modelo recebe tudo.
- `ConnectorRefused` é uma classe para a ferramenta e os testes a reconhecerem. No log ela não
  aparece pelo nome: `fieldsOf` (`builder/mastra/logger.ts:9-25`) toma o primeiro nome da cadeia, o
  do `MastraError` (`"Error"`, com `mastra: TOOL_EXECUTION_FAILED`). A linha que diz a recusa é
  `CONNECTOR_WRITE_REFUSED`, do funil.
- A saída de `listWrites` passa pelo esquema do contrato (C31).
- O arquivo tomado como modelo é `open-writes.ts` com a sua rota em `conversation-routes.ts`: cumpre
  C21 e C26.

### As skills e a leitura

`mastra` (no `node_modules/@mastra/core/dist/docs` 1.82.0: `docs-agents-tools.md` 140-160, e o
`builder.ts` citado na tabela), `node`, `typescript-magician`, as linhas de `docs/reference/stack.md`
das pastas.

### A ordem do trabalho

1. A migração de `approved_by`, no seu pull request (D11).
2. O funil: `writtenOf` passa `native` inteiro; `Stored` guarda o corpo; o `INSERT` grava
   `approved_by`. O corpo continua dentro do teto do executor (C59; `RESPONSE_CAP_BYTES`,
   `hub/connectors/wire.ts:10`). Corrija os comentários de
   `write-record.ts:76` e `read.ts:38`, que citam a S41 para tirar o corpo de quem não é log.
3. `readThrough` devolve `native` inteiro; a porta do app corta para `status`, `code` e `message`
   (C51); as portas do Builder e do Assistente passam inteiro.
4. `tools.ts`: `ConnectorRefused`, lançado pela escrita e pela leitura do agente para o que
   certamente não foi aceito; os resultados do critério 35 continuam com a instrução. Confira no
   log que a linha do erro do Mastra só traz escalares (S41). `openOf` tira os campos `fixed` do
   esquema do modelo, mesmo quando o `open` gravado numa versão antiga os traz, e a escrita recusa
   `NOT_FIXED` antes do funil quando o `bound` não os fixa (critério 44).
5. `listWrites` ao lado de `listOpenWrites`; o critério 23 continua passando pelo antigo até a U6.
6. `check.ts`: `readyConfig` sem os campos `fixed`; `misfitOf` com `NOT_FIXED`; a publicação recusa
   uma versão que não cabe.
7. A gravação do dublê do modelo (T24) com o `tool_result` de `is_error`, e os testes sobre ela.

### Como se prova

Os critérios 33 a 39, 43 e 44. O 34 lê o pedido seguinte ao modelo pelo dublê gravado (T24, T26).

### Parar se

- O texto que o modelo recebe de uma falha lançada não for a mensagem inteira: diga o que chegou e
  pare.
- O logger do Mastra imprimir a mensagem da falha: pare; o log só tem escalares (S41).
- A biblioteca recusar uma versão nova de uma escrita pronta com valores fixos: diga onde e pare.

## U6 A escrita na conversa, também depois de recarregar

**Base e modelo.** O `main` com a U5. Sonnet.

### As linhas da tabela

Quem aprovou e o desfecho no registro (o cartão), a linha de uma escrita na conversa (e a de uma
leitura que lançou), a escrita na versão nova da biblioteca, a nota modelo (o cartão e o motivo
`NOT_FIXED`).

Leia `apps/web/src/builder/conversation/{approval-item,approval-card,approval-fields,approval-text,construtor-specs,connector-specs,tool-registry,tool-row,room}.ts(x)`,
`apps/web/src/builder/agents/{queries,write-lines,tool-line,connection-tools,agent-chat,text}.ts(x)`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/conversation/` | Muda `approval-item.ts` (o desfecho e quem aprovou vêm de `listWrites`, não de `inv.approval` nem do resultado), `approval-card.tsx` (o rótulo da recusa e a mensagem), `approval-fields.ts` (a nota modelo dos valores fixos, o local e o lote), `construtor-specs.ts` e `tool-registry.ts` (a linha de uma escrita, e o estado de uma linha `output-error` pelo `kind`), `connector-specs.ts` (o `RECONNECT` também de uma falha lançada), `tool-row.tsx` (o detalhe aberto sem o JSON), `room.ts` (`listWrites` no lugar de `listOpenWrites`), `text.ts` (o rótulo da recusa) | a sala do agente |
| `apps/web/src/builder/agents/` | Muda `queries.ts`, `agent-chat.tsx`, `test-approval.tsx` e `test-hub-tools.tsx` (`listWrites` no lugar de `listOpenWrites`), `write-lines.tsx` (`newer` na linha da escrita), `text.ts` (`NOT_FIXED`); cria `write-lines.test.tsx` | a página do agente |
| `apps/web/agent-file.layout.test.ts` | `listWrites` no lugar de `listOpenWrites` | a verificação de layout |
| `packages/hub-api/src/{open-writes,index}.ts`, `apps/server/src/builder/agents/conversation-routes.ts` | Apaga `listOpenWrites` e `OpenWrite` do contrato e a rota antiga do servidor, com os casos dela em `conversation-routes.test.ts` passados para `listWrites` | a web, o servidor |

### As skills e a leitura

As linhas de `docs/reference/stack.md` das pastas da unidade: `shadcn` para as peças de `ui/` que o
cartão e as linhas já usam, `typescript-magician`, e [Impeccable](../reference/impeccable.md) para a
QA curta. Nenhuma peça nova do shadcn entra.

### A ordem do trabalho

1. A troca de `listOpenWrites` por `listWrites` nos seis arquivos da web; o aviso do envio aberto
   filtra `SENDING` e `UNCERTAIN`; depois `listOpenWrites`, `OpenWrite` e a rota antiga saem (C45).
2. `approval-item.ts`: o desfecho de uma escrita que pediu o cartão vem da linha de `listWrites`
   pelo `toolCallId`; sem linha, o que o Mastra guardou, sem "Aprovado".
3. `approval-card.tsx`: o rótulo da recusa e, abaixo, `message` como veio.
4. `approval-fields.ts`: os campos são `{ ...args, ...bound }` da versão que a conversa roda (a
   ativa, numa conversa com a versão publicada; o rascunho, numa conversa com o rascunho), a mesma
   cuja lista de ferramentas a sala já lê, como o `execute` manda.
5. A linha de uma escrita usa os verbos de escrita, pela `writeOf` da sala. Uma linha `output-error`
   lê o `kind` do `errorText` por um esquema Zod na borda (C27); a leitura com `AUTH_REFUSED` ou
   `TOKEN_EXPIRED` diz `RECONNECT`; o detalhe aberto mostra o rótulo e a mensagem, nunca o JSON.
6. `write-lines.tsx`: a `Line` da escrita recebe `newerOf`, como a de uma leitura
   (`connection-tools.tsx:69`); usar a versão nova guarda a chave **Pergunta antes / Faz sozinho**.
7. Os textos novos vão ao fundador com a rodada de textos.

### Como se prova

Os critérios 40 a 42, 45 e 46, e a QA curta da sala e da página do agente nos dois temas, a 1366 e
390 px.

### Parar se

- O cartão precisar interpretar o `errorText` do modelo para saber o desfecho de uma escrita: pare;
  o desfecho vem do registro (C49). Da linha de leitura, só o `kind`, por esquema.
- Usar a versão nova da escrita perder a chave da versão anterior: diga onde e pare.
