# Etapa 24.6: Workflows e automações

O roteiro chama esta etapa de "24.6 Workflows e automações. Monta conversando o fluxo do orçamento
do Sankhya e o vê como trem de balões", com "Workflows dinâmicos do Mastra. Seu orçamento é o
aceite", e na linha 71 "Sai: o pg-boss; a agenda do Mastra, gatilho de toda automação, e os
workflows o substituem". Ela vem depois da 24.5 e se apoia nela: toda escrita, na conversa ou num
workflow, passa pela mesma decisão **Pergunta antes / Faz sozinho**, pelo mesmo funil e pelo mesmo
registro de envios. Cada linha citada foi lida no `main` em `62234c74`, com `@mastra/core` 1.82.0,
`@mastra/pg` 1.35.0 e `@mastra/server` 1.82.0; as linhas marcadas "PR 843" são do ramo
`feat/conexus-e245-autonomy` (`D2-a` e `D3-a` da 24.5), e as marcadas "PR 841" do ramo
`feat/conexus-e245-u3` (as telas da 24.5). Esta é a segunda rodada do cartão (estudo deep-1,
2026-11-07), depois de o fundador pedir o canvas, os dois tipos de workflow, o Construtor no
contexto e "um dono, uma lógica, um fluxo". O construtor de cada unidade reabre as linhas no `main`
do dia.

## A página do fundador

**No fim desta etapa** você monta, conversando com o Construtor dentro de um Projeto, o fluxo do
orçamento: quando um orçamento novo entra no Sankhya, o Conexus lê o cliente, um agente faz a
triagem, acima de um valor pede a sua aprovação, lança o pedido e avisa alguém. Você vê o fluxo ao
lado da conversa como um canvas de balões, igual ao do painel do Mastra e ao do n8n: clica num
balão para ver quem ele é, o que recebe e o que devolve, e arrasta um balão para outro lugar do
fluxo. Depois de publicar, vê cada execução com os balões acesos e aprova a que espera você.

**O roteiro de uso.** Você é a Ana (dona). A ligação do Sankhya está liberada ao Projeto
"Compras", e o agente "Triagem de orçamento" está publicado nele.

1. No Projeto "Compras", abra o Construtor e escreva "quando lançar um orçamento no Sankhya, quero
   que o agente Triagem veja se o cliente está bom; acima de R$ 20 mil, me pede para aprovar, lança
   o pedido e avisa o Bruno". Ao lado da conversa aparece o canvas **Workflow: Orçamento lançado**,
   marcado "rascunho", com os balões **Gatilho** (orçamentos novos no Sankhya, a cada 15 minutos),
   **Ler o cliente**, **Triagem de orçamento** (agente), **Valor acima de R$ 20.000?** com o ramo
   "se sim" (**Aprovar? (Ana)** e **Lançar o pedido**), e **Avisar o Bruno**. Se faltar algo (qual
   tipo de operação é orçamento, quem avisar), o Construtor pergunta antes de montar.
2. Clique em **Triagem de orçamento**: abre ao lado o painel com **Quem é** (o agente e a versão
   publicada que o fluxo usa), **O que recebe** (o texto, com o cliente lido no balão anterior) e
   **O que devolve** (o texto da triagem). Arraste **Avisar o Bruno** para antes do **Valor acima
   de R$ 20.000?**: o fluxo se reorganiza e continua "rascunho". Arraste de volta. Se um balão tem
   um problema (por exemplo, uma pessoa que saiu da empresa), ele aparece marcado, e **Publicar**
   espera você resolver.
3. Escreva "testa com o último orçamento". Os balões acendem um a um sobre o orçamento mais
   recente; o teste para antes de lançar o pedido e ninguém é avisado. Toque **Publicar**. O
   workflow aparece em Automações do Projeto, ligado.
4. Lance um orçamento de teste no Sankhya acima de R$ 20.000. Na próxima olhada do Conexus, o sino
   e o seu e-mail mostram "O workflow Orçamento lançado espera sua aprovação". Abra: os balões
   feitos em verde, a triagem com o texto do agente, e o cartão **Aprovar?** com o orçamento.
   Toque **Aprovar**: **Lançar o pedido** mostra o pedido que vai lançar e pede a sua aprovação
   (ele está em **Pergunta antes**); aprove, e o pedido aparece no Sankhya com a marca do Conexus
   na observação. **Avisar o Bruno** acende, e o Bruno recebe o aviso.
5. Peça ao Construtor "acima de R$ 50 mil em vez de 20" e, antes de publicar, lance um orçamento
   de R$ 30.000: ele ainda pede a sua aprovação, porque a versão publicada continua a de antes.
   Publique e lance outro de R$ 30.000: agora o fluxo vai direto ao aviso, e o ramo aparece como
   "pulado".
6. No Projeto, em Integrações, tire a liberação da ligação do Sankhya e lance um orçamento: a
   página do workflow mostra "A última olhada no Sankhya falhou" com o motivo. Libere de novo: na
   olhada seguinte o orçamento dispara, uma vez só. Em Automações, pause o workflow; ao religar,
   só os orçamentos lançados depois de religar disparam.

**O que você faz, e quando.** Antes: diz **o gatilho do Sankhya** (decisão B): quais tipos de
operação (TOP) são orçamento na sua empresa, e em qual ligação; e diz o que chamou de
"informações" (decisão I). No começo: responde às decisões abaixo e aprova esta página. No fim:
faz o roteiro no Sankhya de verdade da sua empresa, diz o que viu e aprova os textos das telas.

**O que o estudo mostrou** (2026-11-07, com modelo de mentira e um banco local, sem chamar nada de
fora; as provas P1 a P12 do estudo).

- **O Mastra guarda um workflow montado na hora e o carrega de novo depois de um reinício.** É o
  "workflow dinâmico" do roteiro, que o Mastra 1.82 ainda marca Beta. Medido (P1, P2).
- **O fluxo que o Conexus monta e o que o Mastra guarda são a mesma linguagem**, e o próprio
  Mastra aponta o que não serve num desenho, balão por balão, sem rodar: um balão repetido, uma
  ferramenta que não existe, um valor que não encaixa. Medido (P9). Por isso um rascunho com
  problema é guardado e os problemas aparecem no canvas; só testar e publicar esperam.
- **Uma aprovação no meio do fluxo sobrevive a um reinício do Conexus**, também dentro do ramo
  "se sim". Medido (P2, P5). Na conversa da 24.5 é diferente: lá o cartão some num reinício.
- **Recusar termina a execução; tentar de novo continua do balão que falhou, sem refazer os
  anteriores; uma execução cortada por um reinício termina depois**, do balão em que estava (o
  Conexus espera 15 segundos, o tempo em que o Mastra ainda a considera do processo que parou).
  Medido (P4, P6, P7, P8).
- **O Mastra não tem versão de workflow.** Medido: se o mesmo workflow muda, uma execução que
  esperava continua no desenho novo (P2). Por isso cada publicação é uma versão própria, como nos
  agentes, e a execução fica na versão em que começou.
- **Um agente que escreve pode ser um balão.** A peça pronta do Mastra para pôr um agente num
  workflow trava quando o agente pede para escrever (P3). O Conexus roda o agente ele mesmo, e
  quando o agente pede para escrever o workflow para e espera a aprovação; aprovado, o agente
  escreve uma vez, também depois de um reinício (P11). A mesma decisão e o mesmo registro servem a
  conversa, o balão de agente e o balão de escrita.
- **A tela acende cada balão enquanto o fluxo roda**, relendo a execução a cada 5 segundos, como
  o painel do Mastra faz (P10).
- **A agenda do Mastra dispara a versão publicada direto**, e um disparo é uma execução (P12). Uma
  Automação da 24.2 (um horário e uma pergunta ao Assistente) é um workflow de dois balões.
- **O Sankhya não avisa sozinho.** A documentação pública dele não tem aviso para fora; o gatilho
  é o Conexus olhar de tempos em tempos e lembrar o que já viu, como Zapier, Make, n8n,
  activepieces e Pipedream fazem.
- **O canvas vem de uma biblioteca aberta.** O painel do Mastra e o activepieces desenham com
  `@xyflow/react` (licença MIT). Nenhum dos dois deixa largar um balão em qualquer ponto: o fluxo
  é uma lista com ramos, e arrastar é encaixar o balão noutro lugar da lista.
- **O pg-boss nunca foi instalado.** A 24.2 já usa a agenda do Mastra; sai só o texto que ainda
  fala dele, no fechamento.
- **Um pedido que espera é uma coisa só.** No Kiro, uma permissão, uma pergunta e uma aprovação
  viajam como o mesmo pedido pendente (estudo do Kiro do fundador); é o que o Conexus faz ao pôr a
  conversa, o balão de agente e o balão de escrita num caminho só de aprovação.
- **Montar conversando é o que os produtos fazem.** Mastra Code, activepieces, n8n e o Kiro: o
  modelo escreve o desenho inteiro, o produto confere e devolve o que não serve, e o modelo
  conserta. O construtor de workflows do painel do Mastra é pago; o Conexus não o usa.

**Fica de fora.**

- **As Automações da 24.2 virarem workflows** (decisão G): vai para a etapa 24.6.1, logo depois
  desta. Ela converte cada Automação, no início do Conexus, num workflow com um **Gatilho:
  horário** e um balão **Assistente** com a mesma pergunta e as mesmas ligações, publicado em nome
  do dono; cria a agenda nova antes de apagar a antiga; as execuções antigas continuam na mesma
  lista; e o workflow fixo de hoje sai quando não sobrar nenhuma Automação sobre ele. Nesta etapa
  elas continuam como estão, na mesma lista de Automações, ao lado dos workflows.
- **A lista de versões no canvas, e "voltar a esta versão"**: também na 24.6.1. Ao voltar a uma
  versão antiga, ela passa pelas mesmas conferências de publicar.
- **Mudar os campos de um balão pelo painel.** O painel mostra, renomeia, move e apaga; o que o
  balão faz você muda conversando com o Construtor.
- **Pôr um balão em qualquer ponto da tela** (posição livre, `F2b`): só serve a laços e passos em
  paralelo, que ficam de fora.
- **Um ramo dentro de outro ramo, laços, passos em paralelo, esperar um tempo, outros gatilhos**
  (um aviso de um fornecedor, um e-mail). O Mastra tem; entram quando um fluxo seu pedir. Os avisos
  de fornecedor são a 20.2.
- **Gravar uma linha num app**, e um balão que lê a tabela de um app (decisão I): vêm com a
  escrita dos apps, a antiga 20.1.
- **Avisar o vendedor do Sankhya pelo código dele.** O balão **Avisar** avisa pessoas da empresa
  escolhidas no balão.
- **O Membro aprovar ou publicar um workflow.** Hoje só Dono, Administrador e Desenvolvedor abrem
  Automações; por isso quem um **Aprovar?** nomeia é um deles. O pedido do Membro vem com os
  papéis da 24.7.
- **Um prazo para o "Aprovar?"**, se você escolher `D1`.
- **Os avisos guardados para o próximo cartão**: esta etapa leva dois, o do teste da agenda que
  espera o relógio de verdade (#754) e o do Sankhya de mentira que recusa a consulta (#819), porque
  os gatilhos usam os dois; nenhum outro toca workflows ou automações.

**Aprovar esta página é também a sua palavra** para dois mecanismos do Conexus onde o Mastra não
tem um (a regra C75): uma id do Mastra por versão publicada, e a tabela que lembra os orçamentos
vistos (com a decisão `B1`); para o uso do workflow dinâmico do Mastra, que ele ainda marca Beta;
para a biblioteca nova do canvas, `@xyflow/react` (com a decisão `F2a`); e para as permissões das
seis tabelas novas, da mudança no registro de envios da 24.5 e das colunas novas dos avisos (a
regra D11).

**As decisões suas nesta etapa.**

- **A. Quem é o dono do workflow, e quem aprova?** (a sua H3 de 2026-11-02: "a decisão do dono
  do workflow").
  - `A1` (recomendada): quem publica é o dono. O workflow lê e escreve com o papel dele, como o
    agente publicado (a sua `C1`), e cada execução confere de novo, no começo, se ele ainda está
    na empresa e ainda tem cada leitura do fluxo; se não, o workflow pausa, como a Automação da
    24.2 já faz. Cada **Aprovar?** nomeia uma pessoa, por padrão quem publicou. Uma escrita em
    **Faz sozinho** cujo dono perdeu o direito volta a perguntar, e pergunta ao dono.
    Caso real: o "Request Approval" do Zapier e o "Human Input" do Dify escolhem no passo quem
    responde; no Copilot Studio e no Agentforce o agente age com a autoridade de quem o montou.
    Exemplo: você publica o fluxo e põe o Carlos (Administrador) no **Aprovar?**. Objetivo: um
    dono só, e quem aprova visível no balão. Como nativo: o workflow para pelo próprio Mastra e só
    a pessoa do balão o retoma. Veredito: nativo (a espera) e embrulhado (quem pode responder é
    regra do Conexus).
  - `A2`: aprova qualquer pessoa de um papel escolhido no balão (por exemplo, Administradores).
    Caso real: o Zapier aceita vários aprovadores, e a primeira resposta vale. Mais gente vê; fica
    menos claro quem respondeu por quê.
  - `A3`: só quem publicou aprova. Mais simples, mas o esboço já punha "Aprovar? (Ana)" para outra
    pessoa.
  - **Por que `A1`**: é o que a 24.5 já faz com o agente publicado (o dono reconferido a cada
    chamada, PR 843) e o que a 24.2 faz com a Automação (o dono reconferido a cada execução);
    escolher a pessoa no passo é o que Zapier e Dify convergem.
- **B. O gatilho do Sankhya.** Pela documentação lida, o Sankhya não chama ninguém quando um
  orçamento entra.
  - `B1` (recomendada): o Conexus olha de tempos em tempos as notas novas dos tipos de operação de
    orçamento que você disser, só lendo, e lembra cada uma pelo número da nota numa tabela nova do
    Conexus, para nunca disparar duas vezes o mesmo orçamento. Ao ligar, só valem os orçamentos
    lançados dali em diante. Nada a ligar no seu Sankhya. Caso real: o activepieces guarda a
    última olhada e começa no "agora" ao ligar; o n8n guarda "a última vez que olhei" e só avança
    depois de dar certo; Zapier e Pipedream lembram pelo número de cada item. Exemplo: o tipo de
    operação 999 "Orçamento de venda", na ligação "Sankhya matriz". Objetivo: funcionar sem mexer
    no seu Sankhya. Como nativo: a agenda do Mastra dispara a olhada; lembrar os vistos é do
    Conexus, porque o Mastra não guarda isso. Veredito: remendo.
  - `B2`: usar o registro de alterações do Sankhya. Precisa ligar um parâmetro nas preferências do
    Sankhya Om, guarda só de 3 a 7 dias e diz "mudou", não "nasceu": uma segunda leitura separa o
    novo do editado. Mais leve para o Sankhya, mais coisa para ligar. Veredito: remendo também.
  - `B3`: um programa instalado no seu Sankhya chama o Conexus. Precisa de quem programe no Sankhya
    e de o Conexus receber avisos de fora, que é a 20.2.
  - **Por que `B1`**: é o que todos os produtos lidos fazem com um sistema que não avisa, e não
    depende de nada do seu lado.
  - **E diga**: quais TOP são orçamento, e em qual ligação. É "o gatilho do Sankhya" que você
    fornece.
- **C. De quanto em quanto tempo olhar, e o banco acordado.** Cada olhada acorda o banco do Hub (a
  regra D27); a decisão 0009 diz que, acordado o tempo todo, o plano grátis acaba perto do dia 17.
  - `C1` (recomendada agora): a cada 15 minutos, no plano grátis. Caso real: é o padrão do Make, o
    do Pipedream e o do plano grátis do Zapier. Exemplo: um orçamento lançado às 9h05 dispara até
    as 9h15. Objetivo: o fluxo do orçamento sem custo novo. Como nativo: uma agenda do Mastra de
    15 em 15 minutos. O banco acorda 96 vezes por dia e dorme entre elas (estimado, não medido no
    Neon). Veredito: nativo.
  - `C2`: a cada 5 minutos, como no esboço, com o plano Launch do Neon (cerca de US$ 19,35 por mês,
    a sua `D1` da 24.2). O Zapier pago olha a cada 2 minutos. Veredito: nativo.
  - `C3`: quem monta escolhe no gatilho (5, 15, 30 ou 60 minutos), e o plano segue o menor que
    estiver ligado. Veredito: nativo.
  - **Por que `C1`**: os produtos lidos começam em 15 minutos no plano grátis, e um orçamento não
    pede minutos; `C2` fica para quando um fluxo pedir pressa.
- **D. Um "Aprovar?" que ninguém responde.**
  - `D1` (recomendada): espera sem prazo, como o cartão da 24.5, e aparece em Automações como
    "Esperando aprovação", com o sino e o e-mail na hora em que começa a esperar. Caso real: o
    `sendAndWait` do n8n espera sem prazo se ninguém o põe. Exemplo: o orçamento de sexta espera
    você na segunda. Objetivo: nada se perde por demora. Como nativo: o Mastra guarda a espera sem
    prazo e a retoma quando você responde. Veredito: nativo.
  - `D2`: vence em 3 dias (o padrão do Dify; o Zapier deixa escolher) e a execução termina como
    "Não aprovado", sem fazer o resto. Como nativo: não há; o "esperar" do Mastra é um relógio do
    processo e não sobrevive a um reinício, então uma volta do Conexus recusaria as vencidas.
    Veredito: embrulhado.
  - **Por que `D1`**: é nativo e igual à conversa; o prazo pede uma volta nossa, que entra quando
    um orçamento esquecido custar alguma coisa.
- **E. Um balão que escreve no Sankhya entra já nesta etapa?**
  - `E1` (recomendada): entra, e um agente com escrita também pode ser balão. Qualquer escrita do
    kit que o papel de quem publica usa (hoje **Lançar pedido**) vira um balão com a chave
    **Pergunta antes** (já escolhida) ou **Faz sozinho**, a mesma da 24.5: em **Pergunta antes** o
    workflow espera o **Aprovar** da pessoa do balão; em **Faz sozinho** só publica quem tem
    **Publicar agente que escreve sozinho**. Um agente com escrita no balão pergunta igual. O envio
    passa pelo mesmo funil e pelo mesmo registro, e **Tentar de novo** nunca manda duas vezes.
    Caso real: Zapier, Make e activepieces têm passos que escrevem depois de um "Request
    Approval"; o n8n pede aprovação antes de uma ferramenta de um agente. Exemplo: depois da
    aprovação, "lançar o pedido a partir do orçamento". Objetivo: a escrita igual em toda a
    plataforma, um caminho só. Como nativo: o Mastra suspende o workflow pela ferramenta do balão
    e o Conexus decide perguntar ou fazer com a mesma função da conversa (P11). Veredito:
    embrulhado (o funil da 24.5).
  - `E2`: fica para depois. O fluxo desta etapa só lê, analisa, pede aprovação e avisa; o agente
    do balão só lê.
  - **Por que `E1`**: a prova P11 mostrou o caminho único, e sem ele o "um único fluxo" que você
    pediu teria uma segunda forma de escrever logo depois.
- **F. Como o fluxo aparece.** As referências divergem no que a pessoa vê.
  - `F2a` (recomendada): um canvas como o do painel do Mastra e o do n8n: os balões em caixas
    ligadas por setas, zoom e mover a tela, o "+" na seta para acrescentar, clicar abre o painel,
    arrastar um balão o encaixa noutro lugar do fluxo, e a execução acende os balões. O desenho
    (onde cada caixa fica) é calculado pelo Conexus, sempre igual para o mesmo fluxo. No celular,
    os mesmos balões em coluna. Caso real: o activepieces faz assim (layout próprio e arrastar
    para encaixar); o painel do Mastra desenha com a mesma biblioteca, só para ler. Exemplo: o
    roteiro, passo 2. Objetivo: ver e arrumar o fluxo como no Mastra e no n8n, sem guardar
    posições. Como nativo: `@xyflow/react` (MIT) desenha a tela e os gestos; o lugar de cada caixa
    é nosso. Veredito: nativo de uma biblioteca nova. O primeiro passo da construção prova que ela
    funciona sob a proteção de página do Conexus (a regra W22); se não funcionar, a construção para
    e volta a você com `F1`.
  - `F2b`: posição livre, guardada no fluxo, como no n8n e no Dify. Serve a laços e passos em
    paralelo, que ficam de fora; pede guardar onde cada caixa está. Veredito: nativo da mesma
    biblioteca.
  - `F1`: cartões em coluna ligados por setas, como no editor do Zapier e no Kiro, que mostra o
    fluxo como uma lista com uma barra "Passo 3/7" e uma árvore de passos, sem grafo (estudo do
    Kiro do fundador; é também o precedente da coluna do celular), sem biblioteca; você muda
    conversando, não arrastando. Veredito: embrulhado (as peças de tela do Conexus).
  - **Por que `F2a`**: é o que você pediu ("igual ao Mastra Studio, ao n8n"), e o activepieces
    mostra que um fluxo em lista com ramos não precisa de posição guardada.
- **G. As Automações da 24.2.**
  - `G1` (recomendada): viram workflows na 24.6.1, logo depois desta etapa (o que ela faz está em
    "Fica de fora"). Fica um executor, uma lista de execuções e um caminho de aprovação. Caso real:
    no Zapier e no activepieces um "toda segunda às 7h" é só o gatilho de um fluxo, não outra
    coisa. Exemplo: "Resumo das vendas toda segunda" vira **Gatilho: horário** e **Assistente**.
    Objetivo: uma coisa só chamada Automação. Como nativo: a agenda do Mastra aponta direto à
    versão do workflow (P12). Veredito: embrulhado.
  - `G2`: nesta etapa. Passa bem o tamanho de uma etapa (cerca de 5.700 linhas contra as 4.000
    da regra L2).
  - `G3`: ficam como estão, para sempre ao lado dos workflows: dois executores e duas listas.
  - **Por que `G1`**: a P12 mostrou que a Automação já é um workflow de dois balões; fazê-lo numa
    etapa curta logo depois deixa esta em cerca de 4.570 linhas, uns 14% acima das 4.000 da regra
    L2 (estimado pela leitura); aprovar a página com `G1` é aceitar esse excesso, ou dizer qual
    parte sai (com `F1`, a etapa perde ~300).
- **H. Onde o workflow mora.**
  - `H1` (recomendada): nos mesmos lugares da Automação, a empresa (o Início) e o Projeto. O
    Construtor monta dentro de um Projeto; na empresa, o Assistente propõe como hoje, e na 24.6.1
    as Automações do Início viram workflows do Início. Caso real: a 24.2 já pôs as Automações nos
    dois lugares. Exemplo: "Resumo das vendas da empresa" no Início, "Orçamento lançado" em
    Compras. Objetivo: a Automação não perder o lugar ao virar workflow. Como nativo: nada do
    Mastra; o lugar é do Conexus. Veredito: embrulhado.
  - `H2`: só no Projeto. As Automações do Início ficariam como estão na 24.6.1.
  - **Por que `H1`**: sem ele a decisão G não fecha para as Automações do Início.
- **I. "Informações".** Você falou em "informações" num balão. A palavra não existe no código nem
  nos documentos do Conexus; diga o que é. O que existe:
  - `I1` (recomendada por agora): a informação chega ao fluxo por um balão de agente; o agente lê
    as ligações dele (o Sankhya, o caderno de cada ligação). Exemplo: "veja se o cliente tem
    título vencido". Como nativo: o balão de agente desta etapa. Veredito: embrulhado.
  - `I2`: um balão que lê uma tabela de um app do Projeto. A leitura dos apps hoje não confere o
    papel de quem lê (`hub/apps/app-database.ts:131`), então pede uma porta antes; vem com a
    escrita dos apps (a antiga 20.1).
  - **Por que `I1`**: não precisa de nada novo, e não abre uma leitura sem papel.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 O workflow como dado | O contrato dos balões, dos problemas e das falhas; as tabelas `workflow` e `workflow_version`, a migração e as permissões; a lista de problemas (as regras do Conexus e `validateDynamicWorkflow` do Mastra sobre o índice que o Hub monta); a compilação de uma versão para as definições do Mastra (o principal e um por ramo) e o `addDynamicWorkflows` ao publicar, com o agente fixado na versão; as seis ferramentas registradas com as suas ids e esquemas, que falham até a U3; as rotas de ler, gravar o rascunho, publicar e apagar; apagar no início as definições sem versão | `packages/hub-api/src/`, `apps/server/src/builder/workflows/`, `apps/server/src/builder/mastra/`, `apps/server/src/conversations-of.ts`, `apps/server/migrations/`, `apps/server/database-grants.sql` | [data](../guides/data.md) | esta página aprovada |
| U2 Um caminho de escrita | `hub/connectors/approval.ts` com `mustAsk` e `mayApprove`, movidos de `builder/agents/` (PR 843); a conversa os chama; o `WriteRequest` com `where` e `callKey`; o terceiro autor `WORKFLOW` no funil, no registro e em `mayUse`; a migração do registro; as marcas de id dos workflows | `apps/server/src/hub/connectors/`, `apps/server/src/hub/identity/`, `apps/server/src/builder/agents/`, `apps/server/src/builder/conversation/guard.ts`, `packages/hub-api/src/workflow-ids.ts`, `apps/server/migrations/` | [data](../guides/data.md) | o PR 843 no `main` |
| U3 O executor e as execuções | O corpo das seis ferramentas (conferir, ler, agente, aprovar, escrever, avisar); o gatilho de horário e o manual; a tabela `workflow_run` e as decisões; a lista e a vista das execuções pelo retrato; responder (aprovar e recusar); **Tentar de novo**; a interrompida; pausar, religar, apagar; o teste do rascunho; os avisos novos | `apps/server/src/builder/workflows/`, `apps/server/src/builder/agents/`, `apps/server/src/builder/mastra/`, `apps/server/src/main.ts`, `apps/server/src/conversations-of.ts`, `apps/server/src/hub/notifications/`, `packages/hub-api/src/`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `apps/server/src/platform/recordings/` | [testing](../guides/testing.md) | U1, U2 |
| U4 O gatilho do Sankhya | A leitura nova do kit e o seu dublê; o workflow fixo `conexus-workflow-poll` e a sua agenda por workflow; as tabelas `workflow_trigger` e `workflow_trigger_seen`; a leitura de base, a volta, o começo que avança, as vistas que saem; uma execução por orçamento; a última volta na página; o item mais recente para o teste | `apps/server/src/builder/workflows/`, `packages/connectors/src/sankhya/`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `docs/reference/boundaries.md` | [testing](../guides/testing.md) | U3 |
| U5 O Construtor monta | As quatro ferramentas `workflow_catalog`, `workflow_read`, `workflow_save`, `workflow_test`; o texto do Construtor; a linha de cada ferramenta na conversa | `apps/server/src/builder/construtor/`, `packages/hub-api/src/construtor.ts`, `apps/web/src/builder/conversation/construtor-specs.ts` | [security](../guides/security.md) | U3 |
| U6 O canvas | A prova de CSP do `@xyflow/react`; o canvas e as suas peças; o painel do balão; arrastar para encaixar; o "+"; a execução acesa; os problemas; o celular em coluna; o canvas ao lado do Construtor; o cartão de aprovação dividido em peça e dois adaptadores; o workflow na lista de Automações | `apps/web/src/builder/workflows/` (novo), `apps/web/src/builder/conversation/`, `apps/web/src/builder/automations/`, `apps/web/src/builder/agents/construtor-chat.tsx`, `apps/web/src/routes/_app/companies/$companyId/projects/`, `apps/web/package.json`, `package-lock.json`, `docs/reference/stack.md`, `docs/reference/screens.md`, `tests/e2e/` | [web](../guides/web.md) | U3; PR 841 no `main` |

A U1 e a U2 correm em paralelo: não dividem pasta de código, e cada uma tem a sua migração. A
única peça comum é `packages/hub-api/src/workflow-ids.ts` (as três marcas, com o texto fixo na
seção da U2): é da U2; a U1 começa com um `cherry-pick` do commit da U2 que só cria esse arquivo, e
o rebase o deduplica. As duas mudam o retrato do catálogo (`catalog.test.ts`) e o
`packages/hub-api/src/index.ts`; a segunda a entrar regenera o retrato e junta as exportações. A
U2 pode entrar logo depois do PR 843. A U3 começa com as duas no `main`. A U4, a U5 e a U6 correm
juntas depois da U3: a U4 fica em `builder/workflows/poll.ts` e no kit, a U5 no Construtor, a U6 em
`apps/web`; a U5 muda só `construtor-specs.ts` em `apps/web/src/builder/conversation/`, e a U6
outros arquivos dessa pasta.

**O que cada unidade apaga.** U1: nada. U2: as cópias de `holdsWrite`, `publisherLeavesAlone` e
`aloneByPublisher` em `builder/agents/` (PR 843), e `threadId` e `toolCallId` de `WriteRequest`.
U3: a espera do minuto do relógio de verdade no teste da agenda (#754). U4: nada. U5: nada. U6: a
fonte de dados presa dentro de `approval-card.tsx` (PR 841). Nenhum código de pg-boss existe para
apagar; o texto sai no fechamento.

**O método das unidades.** Cada unidade segue o `pstack:poteto-mode` como as skills do repositório
já o chamam ([`conexus-scope`](../../.agents/skills/conexus-scope/SKILL.md), passo 4;
[`conexus-build`](../../.agents/skills/conexus-build/SKILL.md)). O cartão não repete o método.

**Orçamento de código alterado.** U1: ~800. U2: ~370. U3: ~1.250. U4: ~550. U5: ~400. U6: ~1.200
(o canvas ~1.000, o cartão de aprovação dividido ~80, a lista de Automações ~120). Total da etapa:
~4.570, estimado pela leitura, sem protótipo; passa a regra L2 em cerca de 14%. O construtor de
cada unidade para e relata se a sua passar de um terço do seu número. Com `F1`, a U6 perde ~300
(a casca, o layout e o arrastar); com `E2`, a U3 perde ~250 (a ferramenta de escrever e a
suspensão do agente) e saem os critérios 17 e 19.

## Os critérios de aceite

Os caminhos são de `apps/server/src/` quando não dizem outro. `BASE` é
`/api/companies/{companyId}/workflows`.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `PUT BASE/{w}/draft` com um corpo que o esquema `SaveDraftBody` aceita grava o rascunho, sobe `revision` e devolve o `WorkflowView` com `problems`; um rascunho com problemas de sentido também grava, e cada um vem com o código, o balão e o caminho: um `READ` com operação de escrita (`OPERATION_WRONG_CLASS`), um `AGENT` de agente de outro Projeto (`AGENT_OTHER_PROJECT`), uma referência `{{b9.texto}}` a um balão que não vem antes (`REF_NOT_BEFORE`), um `IF` sobre um campo que não é número (`IF_FIELD_NOT_NUMBER`), um balão depois do `IF` que usa a saída de um de dentro do ramo (`REF_INSIDE_BRANCH`), um balão do "+" sem ligação (`BALLOON_INCOMPLETE`), 51 balões (`WORKFLOW_TOO_MANY_BALLOONS`, o rascunho grava); um corpo que o esquema recusa responde `REQUEST_MALFORMED` (C51) e não grava; uma `revision` que não é a atual responde `WORKFLOW_DRAFT_STALE` e não grava | `builder/workflows/routes.test.ts` (novo), "o rascunho" | must |
| 2 | U1 | A lista de problemas junta a validação do Mastra: com o índice montado sem a ferramenta `conexus-ler`, um rascunho com um `READ` tem um problema `GRAPH_MISSING_REFERENCE` no balão do `READ`, com a mensagem em português e sem nome de passo do Mastra; com o índice inteiro, o mesmo rascunho não tem problema `GRAPH_*` | `builder/workflows/problems.test.ts` (novo), "a validação do Mastra" | must |
| 3 | U1 | `POST BASE/{w}/publish` recusa com `WORKFLOW_HAS_PROBLEMS` enquanto houver um problema `ERROR`, inclusive os de papel calculados para quem publica (uma operação fora do papel dele, `OPERATION_NOT_IN_ROLE`; um `WRITE` em **Faz sozinho** sem `agent: publishUnattendedWrite`, `WRITE_AUTO_NOT_ALLOWED`; uma ligação não liberada, `CONNECTION_NOT_OFFERED`; uma pessoa fora da empresa, `PERSON_NOT_FOUND`); sem `manageAutomations`, `NOT_IN_ROLE`; nada se grava e nada vai ao Mastra | `builder/workflows/publish.test.ts` (novo), "a publicação recusada" | must |
| 4 | U1 | Publicar sem problema grava a versão `n+1` com o `frozen` (o desenho, o agente de cada `AGENT` fixado na versão ativa dele, o que a versão declara), registra no Mastra `wf-<w>-v<n+1>` e um `wf-<w>-v<n+1>-<balão>` por `IF`, e as linhas aparecem em `mastra.mastra_workflow_definitions` com `status = 'active'`; as da versão `n` continuam `active`; publicar de novo sem mudar o rascunho responde a mesma versão; publicar o agente de novo depois não muda o `frozen` da versão do workflow | `publish.test.ts`, "publicar" | must |
| 5 | U1 | Depois de um reinício (um Hub novo ao lado do mesmo banco, por `hubBeside`), cada versão publicada está no `Mastra` (`getWorkflowById('wf-<w>-v<n>')`) sem código do Conexus a registrar; uma definição `wf-*` sem versão no Hub é apagada no início; `DELETE BASE/{w}` apaga as definições e depois responde `WORKFLOW_NOT_FOUND` | `publish.test.ts`, "depois do reinício" e "apagar" | must |
| 6 | U2 | Os testes de `D2-a` e `D3-a` da 24.5 (`builder/agents/autonomy.test.ts`, PR 843) e os do cartão da conversa passam sem mudar, com `holdsWrite` e `publisherLeavesAlone` só em `hub/connectors/approval.ts`; `mustAsk` com `choice: 'AUTO'` e um dono que perdeu `publishUnattendedWrite` devolve `{ kind: 'ASK', reason: 'PUBLISHER_LOST_RIGHT' }`, e com uma escrita aberta da mesma ligação e operação no mesmo `where`, `{ kind: 'ASK', reason: 'OPEN_WRITE' }` | `hub/connectors/approval.test.ts` (novo); `builder/agents/autonomy.test.ts` | must |
| 7 | U2 | `writeThrough` com `speaker: WORKFLOW` e `where: { kind: 'RUN' }` envia ao dublê do Sankhya uma vez e grava a linha de `connector_write` com `thread_id` igual à execução, `tool_call_id` igual ao balão, `workflow_id` e `workflow_version`, e `agent_id`, `version_number` e `person_id` nulos; a mesma chave de novo não envia e devolve o que o registro diz; um `INSERT` direto com dois autores é recusado pelo `CHECK` `connector_write_speaker` (23514); uma operação que a versão não declara responde `NOT_IN_ROLE`, uma ligação não liberada `NOT_GRANTED` | `hub/connectors/write.test.ts`, "o workflow escreve" | must |
| 8 | U2 | A migração `e246_connector_write_workflow` passa `npm run migrations` com a sua linha `-- contract:`; uma linha da 24.5 gravada antes dela continua lida igual depois | `hub/connectors/connector-write-table.test.ts`, "o terceiro autor" | must |
| 9 | U3 | A conferência no começo de cada execução: com quem publicou fora da empresa, ou sem uma leitura que a versão declara no papel dele hoje, a execução termina `FAILED` no balão `conferir` com `WORKFLOW_OWNER_CANNOT_RUN`, nenhum balão depois roda (o dublê não recebe leitura), o workflow fica `PAUSED_OWNER`, a agenda pausa e o dono recebe o aviso `WORKFLOW_PAUSED`; a execução aparece em `workflow_run` | `builder/workflows/balloons.test.ts` (novo), "conferir" | must |
| 10 | U3 | O balão `READ` lê pelo funil com o autor `WORKFLOW` e quem publicou: o dublê recebe a leitura e a saída do balão traz `resultado`; uma entrada que não serve à operação falha o balão com `REQUEST_MALFORMED` (a ferramenta lança; nunca devolve `{ error: true }` como sucesso, prova P2 do estudo) | `balloons.test.ts`, "ler" | must |
| 11 | U3 | O balão `AGENT` de um agente publicado abre uma conversa do agente com a etiqueta `AGENT_MARK.workflow` igual à id do workflow, roda a versão fixada com o texto do balão e as referências trocadas pelos valores, e devolve `texto` e `conversationId`; o balão `AGENT` com o Assistente abre uma conversa do Assistente como a Automação abre (`builder/automations/run.ts:112-142`); um turno que falha ou passa de 15 minutos falha o balão com o código do turno; um agente apagado depois de publicar falha o balão com `AGENT_NOT_FOUND` | `balloons.test.ts`, "o agente" | must |
| 12 | U3 | Um agente com escrita em **Pergunta antes** num balão: o balão drena o stream e, no pedido de aprovação, a execução fica `WAITING` com `waiting.kind = 'AGENT_WRITE'`, a pessoa do balão e os campos da escrita, e o dublê não recebe nada; a resposta aprovada retoma, chama `approveToolCall`, e a escrita vai ao dublê uma vez com a chave da conversa do balão; recusada, `declineToolCall` é a resposta, a execução termina `DECLINED` e o agente não é chamado de novo nem pergunta outra vez na mesma execução (o anti-padrão do estudo do Kiro do fundador: um subagente chamado de novo cinco vezes depois de uma recusa); o mesmo depois de um reinício entre a espera e a resposta | `balloons.test.ts`, "o agente que escreve" | must |
| 13 | U3 | O balão `APPROVAL` para a execução (`WAITING`, `waiting.kind = 'APPROVAL'`, com a pessoa e a pergunta) e nada depois dele roda; no mesmo instante a pessoa recebe o aviso `WORKFLOW_WAITING` no sino e por e-mail; num `IF` cujo valor não passa, os balões do ramo aparecem `SKIPPED` e a execução segue | `balloons.test.ts`, "aprovar espera" e "o ramo pulado" | must |
| 14 | U3 | `POST BASE/{w}/runs/{r}/balloons/{b}/answer` com `approved: true` pela pessoa do balão retoma a execução; com `approved: false` num `APPROVAL`, num `WRITE` ou num `AGENT_WRITE`, a execução termina `DECLINED` (o Mastra guarda `canceled`) e nada depois roda; a decisão fica em `workflow_run_decision`; uma segunda resposta ao mesmo pedido responde `RUN_NOT_WAITING`; outra pessoa recebe `NOT_APPROVER`; num `WRITE` ou num `AGENT_WRITE`, a pessoa do balão sem a escrita no papel recebe `NOT_IN_ROLE` (`D3-a`, `mayApprove`) e nada roda; uma decisão gravada cuja retomada não aconteceu (o Hub morreu no meio) é retomada no início do Hub; uma execução que espera continua esperando depois de um reinício, e a resposta funciona, também dentro de um ramo | `builder/workflows/runs.test.ts` (novo), "responder" | must |
| 15 | U3 | Uma execução que espera na versão `n` continua na versão `n` depois de publicada a `n+1` com um balão a mais antes do que espera: aprovada, roda só os balões da versão `n` | `runs.test.ts`, "a versão em que começou" | must |
| 16 | U3 | O balão `WRITE` em **Pergunta antes** espera (`waiting.kind = 'WRITE'`, `reason: 'CHOSEN'`) e o dublê não recebe nada; aprovado, envia uma vez pelo funil com o autor `WORKFLOW`; em **Faz sozinho** envia sem parar; **Tentar de novo** depois de um envio não envia de novo e devolve o que o registro diz | `balloons.test.ts`, "escrever" | must |
| 17 | U3 | `D2-a` num workflow: um `WRITE` em **Faz sozinho** cujo dono perdeu `publishUnattendedWrite` ou a escrita depois de publicar espera com `reason: 'PUBLISHER_LOST_RIGHT'` e a pessoa que espera é o dono; a versão não muda | `balloons.test.ts`, "o dono perdeu o direito" | must |
| 18 | U3 | `POST BASE/{w}/runs/{r}/retry` numa execução `FAILED` retoma do balão que falhou (`timeTravel`) sem rodar os anteriores (o dublê conta uma leitura do cliente); num balão dentro de um ramo, refaz o ramo do primeiro balão dele e segue (prova P8 do estudo); uma execução `running` de antes do início do Hub aparece `INTERRUPTED`, e **Tentar de novo** a termina com `restart()` do balão em que estava; antes de vencer a posse do Mastra responde `RUN_STILL_OWNED`; numa execução que não falhou nem foi interrompida, `RUN_NOT_FAILED` | `runs.test.ts`, "tentar de novo" e "a interrompida" | must |
| 19 | U3 | O gatilho de horário: publicar um workflow com `SCHEDULE` cria a agenda `schedule_wf-<w>-v<n>` sobre `wf-<w>-v<n>` com o `cron` de `cronOf`; um disparo (relógio injetado) é uma execução de id `sched_schedule_wf-<w>-v<n>_<ms>`; publicar a `n+1` cria a agenda da `n+1` antes de apagar a da `n`; o limite de 30 da 24.2 conta também os workflows ligados (`AUTOMATION_LIMIT`); o teste da agenda não espera o minuto do relógio de verdade (#754) | `builder/workflows/schedule.test.ts` (novo) | must |
| 20 | U3 | `POST BASE/{w}/run` começa uma execução da versão publicada (`MANUAL` e os outros gatilhos); sem versão publicada, `WORKFLOW_NOT_PUBLISHED`; pausar pausa a agenda e `run` responde `WORKFLOW_PAUSED`; religar a religa; apagar o workflow apaga a agenda, as execuções no Mastra e as definições, e responde `WORKFLOW_NOT_FOUND` depois; apagar o Projeto ou a empresa faz o mesmo pelo `releaseFirst` | `builder/workflows/routes.test.ts`, "rodar, pausar, religar, apagar" | must |
| 21 | U3 | `GET BASE/{w}/runs` devolve as execuções de todas as versões (de `workflow_run`), 20 por página, mais novas primeiro, cada uma com a versão, o `label` para a pessoa ("Orçamento nº 1043" no gatilho do Sankhya, "Rodado por Ana" no manual, a hora do disparo no horário, como o `runLabel` do Kiro), o estado e quantas esperam; `GET BASE/{w}/runs/{r}` traz o estado e a saída de cada balão fora de um ramo; lido de outra conexão antes do fim, um balão aparece `RUNNING` e os anteriores `DONE` (prova P10 do estudo); `GET BASE?place=` devolve os workflows do lugar com o estado, a última execução e `waitingCount` | `runs.test.ts`, "a lista e a vista" | must |
| 22 | U3 | `POST BASE/{w}/test` copia o rascunho para `workflow.test_draft` e o roda como `wf-<w>-teste` sobre a entrada do gatilho (o item mais recente da U4, ou nada para `SCHEDULE` e `MANUAL`); o `NOTIFY` não avisa; um `WRITE` e a escrita de um agente param antes de enviar e o teste termina ali, cancelado; o teste não entra em `workflow_run`; um rascunho com problema `ERROR` responde `WORKFLOW_HAS_PROBLEMS`; um segundo teste substitui a definição de teste | `runs.test.ts`, "o teste" | must |
| 23 | U4 | Ao ligar (publicar a primeira vez ou religar), uma leitura de base grava como vistas as notas da janela, sem disparar; um orçamento lançado depois dela, mesmo antes da primeira volta, dispara na volta seguinte; o dublê com três orçamentos novos dos tipos escolhidos dá três execuções, cada uma com o número da nota na entrada; a volta seguinte, com os mesmos três e um novo, dá uma; uma nota de outro tipo não dispara; mais de 20 novos numa volta disparam 20 e o resto na volta seguinte; uma volta que deu certo avança o começo para a hora em que começou, e as vistas de mais de dois dias antes do começo saem, sem que uma nota antiga volte a disparar (o relógio injetado passa 10 dias) | `builder/workflows/poll.test.ts` (novo), "orçamentos novos" | must |
| 24 | U4 | Duas voltas ao mesmo tempo para o mesmo workflow dão uma execução por orçamento; a leitura recusada (`NOT_GRANTED` com a liberação tirada, ou `UNREACHABLE`, ou o dublê que recusa a consulta, #819) não avança o começo, grava a última volta como falha com o código, imprime `WORKFLOW_TRIGGER_FAILED`, e a volta seguinte, com a liberação de volta, dispara o mesmo orçamento uma vez; uma leitura de base que falha deixa `since` nulo e a volta seguinte a tenta de novo, sem disparar | `poll.test.ts`, "duas voltas" e "a volta que falhou" | must |
| 25 | U4 | Cada volta confere quem publicou antes de ler: sem `manageAutomations`, fora da empresa, ou sem a leitura do gatilho no papel, nenhuma execução começa, a agenda pausa e o workflow fica `PAUSED_OWNER`; pausar e religar: um orçamento lançado durante a pausa não dispara | `poll.test.ts`, "o dono perdeu o papel" e "pausar" | must |
| 26 | U5 | O Construtor tem `workflow_catalog`, `workflow_read`, `workflow_save` e `workflow_test`, e nenhuma ferramenta que publica; com o modelo de mentira, um pedido completo grava o rascunho; um desenho com problemas grava e volta com a lista, e o Construtor o corrige na chamada seguinte com a `revision` nova; depois de 3 gravações seguidas que ainda voltam com problema `ERROR`, o Construtor para de gravar e pergunta à pessoa o que falta (o teto de 3 tentativas do estudo do Kiro do fundador); um pedido sem tipo de operação faz o Construtor perguntar, sem gravar; uma `revision` velha volta `STALE` com o rascunho atual | `builder/construtor/workflow-tools.test.ts` (novo) | must |
| 27 | U5 | Avaliação com o modelo de verdade (opt-in): o pedido do roteiro, passo 1, termina num rascunho sem problema `ERROR`, com os balões na ordem, o `APPROVAL` e o `WRITE` dentro do `IF` do valor, e o `WRITE` em **Pergunta antes** | `builder/construtor/construtor.eval.test.ts`, "o fluxo do orçamento" | should |
| 28 | U6 | O canvas carrega sob a CSP de verdade do Hub (`style-src 'self'`, W22) no Chromium sem cabeça com zero violações no console, ao abrir, ao arrastar e ao dar zoom | `tests/e2e/workflow-canvas.test.ts` (novo), "sob a CSP" | must |
| 29 | U6 | O canvas mostra cada balão com o ícone e a palavra da espécie ("gatilho", "lê", "agente", "se", "aprovação", "escreve", "avisa"), o título e quem; as setas; o ramo "se sim" recuado; o "+" em cada seta; a marca "rascunho"; o layout é o mesmo para o mesmo rascunho; a 390 px aparece a coluna (`train.tsx`), sem nada fora da tela | `apps/web/src/builder/workflows/canvas.test.tsx` (novo); `layout.test.ts` (novo) | must |
| 30 | U6 | Clicar num balão (ou Enter nele) abre o painel com **Quem é**, **O que recebe** e **O que devolve**, com os valores da execução quando há; Esc fecha e devolve o foco | `apps/web/src/builder/workflows/panel.test.tsx` (novo) | must |
| 31 | U6 | Arrastar um balão para outro encaixe, ou **Mover para cima / para baixo** no painel, grava o rascunho inteiro com a `revision`, a lista de problemas é recalculada, e o canvas mostra a nova ordem; levar **Avisar o Bruno**, que usa `{{b3.texto}}`, para antes de **Triagem** (`b3`) cria o problema `REF_NOT_BEFORE` no balão movido e **Publicar** desliga (o estudo do Kiro do fundador: reordenar quebra a ordem de quem produz antes de quem usa); o "+" abre as espécies e acrescenta um balão, que aparece com o problema `BALLOON_INCOMPLETE`; um `WORKFLOW_DRAFT_STALE` relê o rascunho e diz "O rascunho mudou; veja de novo"; numa execução ou numa versão publicada o canvas não arrasta | `apps/web/src/builder/workflows/canvas.test.tsx`, "arrastar" e "o +" | must |
| 32 | U6 | Os problemas: o botão "N pontos a resolver" abre a lista balão e frase; tocar num leva ao balão e abre o painel; **Publicar** fica desligado com o primeiro problema como motivo; sem problema, "Tudo certo"; uma recusa de publicar mostra a frase da falha | `apps/web/src/builder/workflows/problems.test.tsx` (novo) | must |
| 33 | U6 | A execução acesa: cada balão com o seu estado em palavra e ponto (esperando, rodando, feito, falhou, esperando você, pulado); a tela relê a execução a cada 5 s enquanto ela não termina e para ao terminar; o balão que falhou traz o motivo e **Tentar de novo**; o cartão **Aprovar?** só para a pessoa do balão; para outra, "Esperando a aprovação de Ana" | `apps/web/src/builder/workflows/run-view.test.tsx` (novo) | must |
| 34 | U6 | O cartão de aprovação da conversa da 24.5 continua igual (os testes do PR 841 passam sem mudar) depois de dividido em peça e dois adaptadores; o adaptador da execução manda `answer` | `apps/web/src/builder/conversation/approval-card.test.tsx` (PR 841) | must |
| 35 | U6 | Ao lado do Construtor, o resultado de `workflow_save` abre o canvas do workflow no `Beside`, e cada gravação o relê; no celular, "Conversa" e "Workflow" | `apps/web/src/builder/agents/construtor-chat.test.tsx`, "o workflow ao lado" | must |
| 36 | U6 | Em Automações do Projeto, cada workflow aparece com o gatilho em palavras, ligado ou pausado (com o motivo), a última execução e quantas esperam aprovação, ao lado das Automações da 24.2; o Membro não vê Automações (W34) | `apps/web/src/builder/automations/automations.test.tsx`, "o workflow na lista" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| O canvas ao lado do Construtor (U6) | "Peça um fluxo ao Construtor" no lugar do canvas | o mesmo | o esqueleto dos balões | "Não foi possível abrir o workflow" e "Tentar de novo" | apagado em outra aba: "Este workflow foi apagado" | o Membro não chega ao Construtor (W34) | o rascunho mudou em outra aba: "O rascunho mudou; veja de novo" |
| A página do workflow, com o canvas (U6) | a versão publicada e "Nenhuma execução ainda. A primeira vem com o próximo orçamento." | um rascunho nunca publicado: "Rascunho" e **Publicar** | o esqueleto | "Tentar de novo" | "Voltar ao início" | o Membro: não encontrado (W34) | "Pausado porque quem publicou não pode mais"; "A última olhada no Sankhya falhou" com o motivo; a recusa de publicar com a frase |
| O painel do balão (U6) | **Quem é**, **O que recebe**, **O que devolve** do rascunho | um balão do "+" sem nada: "Diga ao Construtor o que este balão faz" | o esqueleto das três partes | o valor que não abriu: "Não foi possível ler este valor" | o balão saiu do rascunho: o painel fecha | — | um balão com problema: a frase do problema no topo |
| Os problemas (U6) | "Tudo certo" | o mesmo | — | — | — | — | a lista balão e frase |
| A execução acesa (U6) | os balões com o estado | — | o esqueleto | "Tentar de novo" | "Voltar ao início" | quem não é a pessoa do balão: "Esperando a aprovação de Ana", sem botões | "Não aprovado", "Interrompida", o balão que falhou com o motivo |
| O cartão **Aprovar?** na execução (U6) | a pergunta, ou a escrita com os campos, e os dois botões | — | "Aprovando…" ou "Recusando…" | a falha dita | respondido em outra aba: o estado que a execução diz | sem a escrita no papel: "Seu papel não permite aprovar esta escrita" | "Aprovado por você", "Recusado por você" |
| A lista de execuções (U6) | "Nenhuma execução ainda" | o mesmo | o esqueleto | "Tentar de novo" | — | o Membro: não encontrado (W34) | a execução que falhou com o motivo em palavras |
| A lista de Automações (U6) | "Nenhuma automação ainda" e como pedir uma | o mesmo | o esqueleto | "Tentar de novo" | — | o Membro: não encontrado (W34) | um workflow pausado com o motivo |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `WorkflowDraft` (`name`, `trigger`, `balloons`) | `workflow_save` (U5), o canvas por `PUT …/draft` (U6), pela rota do rascunho (U1) | os problemas e a compilação (U1), o canvas (U6) |
| `WorkflowView.revision` | a rota do rascunho (U1) | `workflow_save` (U5), o canvas (U6) |
| `WorkflowView.problems` | `problemsOf` a cada leitura (U1) | `workflow_save` e `workflow_read` (U5), os problemas e **Publicar** (U6) |
| `workflow_version.frozen` | publicar (U1) | as ferramentas pela id do Mastra (U3), o gatilho (U4), a página (U6) |
| `workflow_version.published_by` | publicar (U1); nulo quando a pessoa sai da empresa | `conferir` e `mustAsk` (U3), a página (U6) |
| `WorkflowView.state` (`ON`, `PAUSED`, `PAUSED_OWNER`) | pausar e religar (U3), `conferir` (U3), a volta do gatilho (U4) | a página e a lista (U6), a agenda (U3, U4) |
| `WorkflowView.lastLap` | a volta do gatilho (U4) | a página (U6) |
| `workflow_trigger.since`, `workflow_trigger_seen` | ligar e religar o põem nulo; a leitura de base e cada volta que deu certo (U4) | a volta do gatilho (U4) |
| `workflow_run` | `conferir` no começo de cada execução (U3) | a lista de execuções (U3) |
| `workflow.test_draft` | o teste (U3) | as ferramentas numa id `TEST` (U3) |
| `RunView.state`, `RunView.balloons[].state` | o retrato do Mastra e `workflow_run_decision`, lidos por `runs.ts` (U3) | a execução acesa e a lista (U6), `workflow_test` (U5) |
| `RunView.balloons[].output`, `.conversationId` | o retrato (U3) | o painel (U6) |
| `RunView.waiting` | o `suspendPayload` de `aprovar`, `escrever` e `agente` (U3) | o cartão (U6) |
| `AnswerBody.approved` | o cartão (U6) | a rota de responder (U3) |
| `workflow_run_decision` | a rota de responder (U3) | `runs.ts` e o início do Hub (U3) |
| `WorkflowSummary.waitingCount`, `.lastRun` | `GET BASE` (U3) | a lista de Automações (U6) |
| A linha de `connector_write` com `workflow_id` | o funil (U2) | o funil (U2), `escrever` (U3) |
| Os avisos `WORKFLOW_WAITING`, `WORKFLOW_NOTICE`, `WORKFLOW_PAUSED`, `WORKFLOW_FAILED` | as ferramentas e `conferir` (U3) | o sino e o e-mail (U3, `hub/notifications`) |

**O desenho do canvas**, a 1280 e a 390 px, sobre as peças de `ui/`:

```text
1280                                                              390
┌ Construtor · Compras ──────┐┌ Workflow: Orçamento lançado [rascunho] [2 pontos] [Publicar] ┐  ┌ Orçamento lançado ──────┐
│ quando lançar um orçamento ││                                    [+][-][ajustar]           │  │ [Conversa] [Workflow]   │
│ ...                        ││        ┌──────────────────────────┐   ┌ Triagem de orçamento ┐│  │ [rascunho] [Publicar]   │
│ Montei o workflow ao lado. ││        │ ⏱ gatilho                 │   │ Quem é               ││  │ ⏱ gatilho               │
│                            ││        │ Orçamentos novos · 15 min │   │  agente, versão 3    ││  │ Orçamentos novos        │
│                            ││        └────────────┬─────────────┘   │ O que recebe         ││  │ ↓                       │
│                            ││                    (+)                │  texto + cliente (b1)││  │ 🔎 Ler o cliente        │
│                            ││        ┌────────────┴─────────────┐   │ O que devolve        ││  │ ↓                       │
│                            ││        │ 🔎 lê · Ler o cliente     │   │  texto               ││  │ 🤖 Triagem              │
│                            ││        └────────────┬─────────────┘   │ [Mover ↑] [Mover ↓]  ││  │ ↓                       │
│                            ││                    (+)                │ [Apagar]             ││  │ ◇ Valor > R$ 20.000?    │
│                            ││        ┌────────────┴─────────────┐   └──────────────────────┘│  │   └ ✋ Aprovar? (Ana)   │
│                            ││        │ 🤖 agente · Triagem       │                           │  │   └ ✍ Lançar o pedido   │
│                            ││        └────────────┬─────────────┘                           │  │ ↓                       │
│                            ││        ┌────────────┴─────────────┐                           │  │ 📣 Avisar o Bruno       │
│                            ││        │ ◇ se · Valor > R$ 20.000? │                           │  └─────────────────────────┘
│                            ││        └──┬───────────────────────┘                           │
│                            ││           │ se sim                                             │
│                            ││           ├ ✋ aprovação · Aprovar? (Ana)                       │
│                            ││           └ ✍ escreve · Lançar o pedido  Pergunta antes         │
│                            ││        ┌──────────────────────────┐                           │
│ [Fale com o Construtor...] ││        │ 📣 avisa · Avisar o Bruno │                           │
└────────────────────────────┘└──────────────────────────────────────────────────────────────┘
```

No celular o painel abre como `Sheet` em tela cheia. As capturas das referências (o canvas do
activepieces, o do painel do Mastra, o painel do nó do n8n) a 1280 e a 390 px são tiradas pela U6
antes de construir, como manda o estudo de uma tela; o estudo não as tirou.

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Gravar o rascunho (`UPDATE workflow` com `revision`) | a `revision` deixa uma; a outra recebe `WORKFLOW_DRAFT_STALE` | — | o banco fora: `DATABASE_UNAVAILABLE`, nada gravado | — | 1, 26, 31 |
| Publicar (`INSERT workflow_version` e, na mesma transação antes do `COMMIT`, `addDynamicWorkflows` dos ramos e do principal) | o `for update` da linha do workflow deixa um; a chave `(workflow_id, source_revision)` faz o segundo responder a versão que existe | o Mastra recusa a definição: a transação volta, `WORKFLOW_PUBLISH_REFUSED` (um defeito da compilação, logado com o `[code] path` do Mastra); o `COMMIT` falha depois do Mastra: a definição fica sem versão no Hub, as ferramentas a recusam (`WORKFLOW_NOT_FOUND`) e o início a apaga | o banco fora: nada publicado | `WORKFLOW_PUBLISHED` com workflow e versão | 3, 4, 5 |
| A agenda de horário (`mastra.schedules.create`, `pause`, `resume`, `delete`) | uma linha por versão ativa, id `schedule_wf-<w>-v<n>`; criar de novo é idempotente, como `builder/automations/automations.ts:143-188` | o Hub morre entre criar a da `n+1` e apagar a da `n`: no início, a agenda de uma versão que não é a ativa sai, e um workflow `ON` sem agenda ganha a sua | o banco fora: a falha à tela, o estado não muda | `WORKFLOW_SCHEDULED`, `_PAUSED`, `_RESUMED` | 19, 20 |
| O disparo da agenda (o Mastra começa `wf-<w>-v<n>`) | a id da execução vem da agenda e da hora: um disparo, uma execução (prova P12 do estudo) | o agendador perde um disparo depois de três falhas (`docs-workflows-scheduled-workflows.md:45`; D27) | o banco fora: o disparo falha e o Mastra tenta de novo na volta seguinte | o do Mastra | 19 |
| `conferir` (`INSERT workflow_run … ON CONFLICT DO NOTHING`, a reconferência do dono, e na falha `UPDATE workflow.state`, `schedules.pause`, o aviso) | um `restart()` refaz `conferir`: o `ON CONFLICT` deixa uma linha, e o aviso tem a chave `(run_id, kind)` | o Hub morre depois de pausar e antes do aviso: o workflow já está `PAUSED_OWNER`; o aviso não sai (aceito: a página diz o motivo) | o banco fora: o balão falha com `DATABASE_UNAVAILABLE` e a execução fica `FAILED`, sem ler nada | `WORKFLOW_OWNER_CANNOT_RUN` com workflow e versão | 9 |
| A volta do gatilho do Sankhya (a leitura, `INSERT … ON CONFLICT DO NOTHING RETURNING` em `workflow_trigger_seen`, `createRun().start()`, a limpeza, o `UPDATE` do começo e da última volta); a leitura de base ao ligar | duas voltas: a chave `(workflow_id, item_key)` deixa uma execução por orçamento | o Hub morre depois do `INSERT` e antes de começar a execução: a linha fica com `run_id` nulo e `baseline` falso; a volta seguinte começa as execuções dessas linhas | o Sankhya fora ou a liberação tirada: o começo não avança, a última volta guarda a falha; na leitura de base, `since` fica nulo e a volta seguinte a tenta de novo, sem disparar; o banco fora: nada dispara | `WORKFLOW_TRIGGER_FAILED` com workflow e código, sem as linhas (S40) | 23, 24, 25 |
| A conversa do balão `AGENT` (a conversa nova, o stream drenado) | uma por execução e balão: a id da conversa vem da execução e do balão, e um `restart()` encontra a mesma e não pergunta duas vezes, como `run.ts:119-120` | o turno falha: o balão falha com o código; o Hub morre no meio: a execução fica `INTERRUPTED` | o modelo fora: o código do turno | o mesmo da conversa de hoje, com a execução | 11 |
| A suspensão do balão de agente (`approveToolCall` ou `declineToolCall` na retomada) | a retomada é reivindicada pelo Mastra (`WORKFLOW_RESUME_ALREADY_CLAIMED`): a segunda resposta recebe `RUN_NOT_WAITING` | suspender antes de drenar faz a retomada falhar com `AGENT_RESUME_TOOL_CALL_NOT_SUSPENDED` (prova P11 do estudo): o balão drena sempre antes; o Hub morre depois da decisão e antes da retomada: como aprovar | o banco fora: a execução continua esperando | `WORKFLOW_APPROVED` ou `_DECLINED` com execução, balão e pessoa | 12, 14 |
| O aviso de esperar e o do `NOTIFY` (o sino e o e-mail) | um por execução, balão e espécie (`unique` de `notifications.notification`); um **Tentar de novo** depois de um balão feito não avisa de novo; um corte no meio do envio e um **Tentar de novo** podem mandar o e-mail duas vezes (aceito: um aviso a mais, nada escrito) | o e-mail falha: o sino fica e o balão termina | o envio de e-mail fora: igual | `WORKFLOW_NOTIFIED` | 13 |
| Responder (`INSERT workflow_run_decision`, depois `run.resume`; na recusa de `APPROVAL`, `WRITE` e `AGENT_WRITE`, `run.cancel()`, este depois do `declineToolCall`) | a chave `(run_id, call_key)` deixa uma decisão; a outra recebe `RUN_NOT_WAITING`; o Mastra recusa a segunda retomada (`WORKFLOW_RESUME_ALREADY_CLAIMED`) | o Hub morre entre a decisão e a retomada: a execução continua `suspended` com a decisão gravada; no início, o Hub retoma cada decisão gravada cuja execução ainda espera naquele pedido | o banco fora: a falha ao cartão, a execução continua esperando | `WORKFLOW_APPROVED`, `WORKFLOW_DECLINED` | 14 |
| Tentar de novo (`run.timeTravel` numa falha, `run.restart` numa interrompida) | o Mastra deixa um (`WORKFLOW_TIME_TRAVEL_ALREADY_CLAIMED`, `WORKFLOW_RESTART_RUN_OWNED`); o outro recebe `RUN_NOT_FAILED` ou `RUN_STILL_OWNED` | a definição não muda, porque cada versão é uma id | o banco fora: a falha à tela | `WORKFLOW_RETRIED` | 18 |
| O teste (`UPDATE workflow.test_draft`, `addDynamicWorkflows` de `wf-<w>-teste`, a execução, o `cancel()` no fim) | o segundo teste substitui a definição; o primeiro, se ainda roda, termina sobre a definição que tinha no processo | o teste falha num balão: a resposta diz o balão e o motivo | o Sankhya fora: o teste falha na leitura | `WORKFLOW_TESTED` | 22, 26 |
| Rodar agora, pausar, religar, apagar (`createRun().start()`, `UPDATE workflow.state`, a agenda; apagar também as execuções no Mastra, as definições por `store.delete` e `removeWorkflow`, e as linhas do Hub) | a última vence; dois "rodar agora" dão duas execuções (é o que a pessoa pediu) | o Hub morre entre o Hub e o Mastra: no início, a agenda segue o `state` do Hub, e as definições de um workflow apagado saem | o banco fora: nada muda | `WORKFLOW_RAN`, `_PAUSED`, `_RESUMED`, `_DELETED` | 20 |
| O balão que escreve (`writeThrough` com `WORKFLOW` e `where: RUN`) | a chave execução e balão no registro: a segunda chamada lê a linha e não envia | os casos de `WRITE_UNCERTAIN` da 24.5, iguais | os da 24.5, iguais | os da 24.5, com workflow e versão | 7, 16, 17 |
| A migração do registro (`e246_connector_write_workflow`: duas colunas e o `CHECK` trocado) | — | o `CHECK` novo é criado na mesma transação em que o velho sai | — | — | 8 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O documento do workflow (balões, rascunho, versões) | U1 | o agente: rascunho e uma versão por publicação (`builder/agents/tables.ts:29,71`) | activepieces `f34c43cd` `flow-version.ts:16-23` (DRAFT e LOCKED); n8n `2e855356` `workflow-history.ts:12-27`; Kiro `library.py:292-331` (revisões, `expected_revision`); Mastra 1.82 sem versão (`storage/constants.ts:374-389`) | Um documento tipado, de vocabulário fechado, com rascunho e versões imutáveis | embrulhado: o documento e as versões são nossos; o grafo é do Mastra | P2 | não precisa | `packages/hub-api/src/workflows.ts`, `builder/workflows/tables.ts` |
| Compilar uma versão para o Mastra | U1 | nenhum | `@mastra/core@1.82.0` `toStorableGraph` (`dynamic/serialize.ts:55`), `addDynamicWorkflows` (`mastra/index.ts:5875-5945`), `rehydrateWorkflow`; o ramo como workflow aninhado (`builder/authoring-playbook.ts:7,373`) | Balões viram entradas `tool`, `mapping` e `conditional`; cada versão é `wf-<id>-v<n>`; o ramo é `wf-<id>-v<n>-<balão>` | nativo (Beta) | P1, P2, P5, P8, P9 | a palavra pelo Beta | `builder/workflows/compile.ts` |
| Uma versão publicada é a sua id do Mastra | U1 | o agente: uma versão por publicação (`builder/agents/tables.ts:71`) | Mastra 1.82: a definição não tem versão (`constants.ts:374-389`); a execução copia o grafo vivo ao ser criada (`workflows/workflow.ts:3083`); `addWorkflow` ignora uma id que já existe (`mastra-D4MXu5BN.js:3996`) | Com a mesma id, a retomada depois do reinício roda o grafo novo; cada versão publicada é uma id própria, `active` enquanto o workflow existe | remendo | `@mastra/core@1.82.0`, prova P2 do estudo; critério 15; [boundaries](../reference/boundaries.md), "a published workflow version is its own workflow id" | a aprovação desta página | `builder/workflows/ids.ts` |
| A lista de problemas antes de rodar | U1, U5, U6 | o Construtor recusa um campo por vez (`builder/construtor/tools.ts:104-238`) | `validateDynamicWorkflow` (`dynamic/validate/index.ts:41`), códigos `validate/types.ts:13-29`, reparos `validate/repair-actions.ts:105`; activepieces `valid:false` e `invalidSteps` (`ap-build-flow.ts:194-215`); Dify checklist (`header/checklist/index.tsx`); Kiro `validate.py:818-852` e o laço de 3 reparos (`service.py:995-1070`) | Grava o rascunho mesmo com problema, lista cada um pelo balão, e só bloqueia testar e publicar | nativo (a validação do Mastra) mais as regras nossas (papel, liberação, pessoa) | P9 | não precisa | `builder/workflows/problems.ts`, `builder/workflows/index.ts` |
| Ler um sistema num balão | U3 | `readThrough` (`hub/connectors/read.ts`), a ferramenta de leitura da biblioteca (`builder/agents/tools.ts:57-76`) | Mastra: a entrada `tool` resolve por id (`dynamic/rehydrate.ts:418-425`) e chama `tool.execute` (`run-tool-entry.ts:58`) | A ferramenta `conexus-ler` acha o balão pela `workflowId` e lê pelo funil de hoje, com quem publicou | embrulhado | — | não precisa | `builder/workflows/balloons/read.ts` |
| A conferência no começo de cada execução | U3 | a Automação reconfere o dono a cada execução (`builder/automations/run.ts:189-219`); o autor `VERSION` só confere o declarado (`hub/identity/may-use.ts:76`) | Mastra: a primeira entrada `tool` do grafo | A ferramenta `conexus-conferir` confere que quem publicou está na empresa e tem cada leitura declarada; senão pausa | embrulhado | — | a decisão A | `builder/workflows/balloons/check.ts` |
| Um agente num balão, com escrita ou não | U3 | a conversa da Automação (`run.ts:112-142`), o agente publicado (`builder/agents/registry.ts:49-69`) | Mastra: a entrada `agent` e `createStep(agent)` travam numa aprovação (P3, `run-agent-entry.ts:166-173`); `.agent()` serializa para a mesma entrada (`reference-workflows-workflow-methods-agent.md:9`) | A ferramenta `conexus-agente` abre uma conversa do agente marcada "Workflow", drena o stream, e num pedido de aprovação suspende o workflow; na retomada, `approveToolCall` | embrulhado (a entrada `agent` do Mastra trava) | P3, P11 | a decisão E | `builder/workflows/balloons/agent.ts` |
| "Aprovar?" no meio do fluxo | U3 | o cartão da conversa, só na memória (24.5, critério 8) | Mastra: `context.workflow.suspend` (`reference-tools-create-tool.md:75-77,105`), `run.resume` (`dist/agent-BP9OWM6D.js:11239`); Dify Human Input, n8n `sendAndWait`, Zapier Request Approval (as notas do estudo sobre os motores) | A ferramenta suspende; a resposta retoma; sobrevive a um reinício | nativo | P2, P5 | a decisão A e a D | `builder/workflows/balloons/approval.ts` |
| Escrever num balão | U2, U3 | `writeThrough` (`hub/connectors/write.ts:154-183`), `connector_write` (`hub/connectors/tables.ts:205-250`), **Pergunta antes / Faz sozinho** (`builder/agents/tools.ts:110-142`) | Mastra: `requireApproval` ignorado num passo (P3); n8n, activepieces e Temporal repetem sem garantir escrita única | A mesma decisão `mustAsk` da conversa; suspende quando pergunta; envia pelo `writeThrough` com o autor `WORKFLOW` | embrulhado: o funil da 24.5 | P11 | a decisão E | `builder/workflows/balloons/write.ts` |
| A decisão "pergunta ou faz" e quem aprova | U2 | `writeTool.requireApproval` (`builder/agents/tools.ts:116-125`); PR 843: `publisherLeavesAlone` (`publish.ts:212`), `holdsWrite` (`:196`), `refuseUnheld` (`:162`) | — | Um lugar só, chamado pela conversa, pelos balões e pela rota de responder | embrulhado (nosso, da 24.5) | P11 | não precisa | `hub/connectors/approval.ts` |
| O registro de envios com o terceiro autor | U2 | chave empresa, conversa, `toolCallId` (`hub/connectors/tables.ts:205-250`) | — | `thread_id` guarda a conversa ou a execução; `tool_call_id` guarda o `toolCallId` ou o balão; o autor `WORKFLOW` com `workflow_id` e `workflow_version`; o `CHECK` de quem fala com três braços | embrulhado | lido | a regra D11, pela aprovação desta página | migração `e246_connector_write_workflow` |
| Avisar uma pessoa | U3 | `deps.notify.automationRan` (`run.ts:230-247`), `notifications.notification` | Zapier e Make por um passo (documentado) | O sino e o e-mail de hoje, com tipos novos | embrulhado | — | não precisa | `builder/workflows/balloons/notify.ts` |
| O gatilho de horário | U3 | `mastra.schedules.create` sobre `conexus-automation-run` (`builder/automations/automations.ts:143-188`) | Mastra `mastra.schedules` (`dist/schedules/schedules.d.ts`), a id da execução por disparo | Uma agenda por workflow publicado aponta direto a `wf-<id>-v<n>` | nativo | P12 | não precisa | `builder/workflows/schedule.ts` |
| O gatilho manual e o teste | U3 | o "Rodar agora" da Automação (`automations.ts:208-246`, `schedules.run`) | Mastra `createRun().start()` | Uma execução da versão ativa, ou de `wf-<id>-teste` sobre o rascunho | nativo | — | não precisa | `builder/workflows/runs.ts` |
| O gatilho: orçamentos novos no Sankhya | U4 | nenhum | Sankhya sem webhook (`developer.sankhya.com.br/llms.txt`, lido 2026-11-07); activepieces `polling/index.ts:38-141`; n8n `AirtableTrigger.node.ts:249-274` e o cursor que só avança depois de dar certo (`poll-cursor-hooks.ts:1-18`); Pipedream `dedupe: "unique"` | A agenda dispara a volta; a volta lê as notas novas dos TOP escolhidos e lembra as vistas pelo `NUNOTA`; uma execução por orçamento | remendo: o Mastra não guarda cursor (`workflows/scheduler/scheduler.ts:18-29`) | `@mastra/core@1.82.0` lido: sem cursor de gatilho; a U4 prova com o dublê; [boundaries](../reference/boundaries.md), "the trigger remembers what it has seen" | a decisão B e o que ele fornece | `builder/workflows/poll.ts`, migração `e246_workflow_trigger` |
| A lista de execuções e cada balão aceso | U3, U6 | `builder/automations/runs.ts:122-190` | Mastra `listWorkflowRuns`, `getWorkflowRunById`, o retrato por passo gravado durante a execução; o Studio relê a cada 5 s até terminar (`playground-ui/.../use-persisted-workflow-run.ts:10-23`); n8n `execution-status.ts:1-12` | O estado de cada balão vem do retrato; a tela relê enquanto roda | nativo | P10 | não precisa | `builder/workflows/runs.ts` |
| Tentar de novo | U3 | nenhum | `run.timeTravel` (falha), `run.restart` (interrompida); activepieces `FROM_FAILED_STEP` na mesma versão | Retoma do balão, sem rodar os anteriores | nativo | P4, P6, P7, P8 | não precisa | `runs.ts` |
| Recusar | U3 | nenhum | `run.cancel()` | A execução termina `canceled`, nada depois roda | nativo | P6 | não precisa | `runs.ts` |
| Montar conversando | U5 | o Construtor monta agentes (`builder/construtor/tools.ts:104-238`), o rascunho ao lado (`apps/web/src/builder/agents/construtor-chat.tsx:57-139`) | Mastra Code `sdk/src/tools/workflows/create-workflow.ts:30-59`; activepieces `ap_build_flow` (`ap-build-flow.ts:47`); n8n AI Builder (`.ee`, só desenho); Kiro: um agente escreve contra um vocabulário fechado e conserta com os erros (`service.py:114-200,995-1070`) | O modelo grava o rascunho inteiro numa ferramenta que valida e devolve os problemas; ele conserta | embrulhado: as ferramentas do Construtor | — | não precisa | `builder/construtor/workflow-tools.ts` |
| O canvas: os balões, clicar, arrastar | U6 | nenhum; `apps/web` sem biblioteca de grafo | Mastra Studio `workflow-graph-canvas.tsx:91-124` (só leitura, `nodesDraggable=false` em `:100`); activepieces `flow-canvas/index.tsx:215-258` (`@xyflow/react` 12.3.5, layout próprio, arrastar para encaixar); Dify e Flowise em React Flow 11; n8n Vue Flow (só referência) | `@xyflow/react` (MIT) só na casca; layout puro do Conexus; o "+" na ligação; arrastar para um encaixe | nativo de uma biblioteca nova | a prova de CSP é o primeiro passo da U6 (critério 28) | a decisão F | `apps/web/src/builder/workflows/canvas.tsx` e as peças da seção da U6 |
| O painel do balão: quem é, o que recebe, o que devolve | U6 | nenhum | n8n NDV `NodeDetailsView.vue:799-880`; Mastra inspetor `workflow-data-inspector.tsx:13-34`; activepieces `step-settings/index.tsx` | Três partes, com os valores da execução quando há | embrulhado (peças do `ui/`) | — | não precisa | `apps/web/src/builder/workflows/panel.tsx` |
| Quem monta, publica e responde | U1, U3 | `manageAutomations` (`hub/identity/admission.ts:47-49`); `agent: publishUnattendedWrite` (`hub/identity/roles.ts:37`) | Zapier e Dify escolhem quem aprova no passo; Copilot Studio e Agentforce: a autoridade é de quem montou | Quem publica é o dono; cada execução e cada escrita reconferem; quem aprova é escolhido no balão | embrulhado | — | a decisão A | — |
| As Automações da 24.2 viram workflows | fica de fora (24.6.1, decisão G) | `run.ts`, `automations.ts`, `runs.ts`, `cadence.ts`, `release.ts` | P12; a conversão no boot (as notas de coesão do estudo, seção 5) | Cada linha de agenda vira um workflow com gatilho de horário e um balão Assistente | embrulhado | P12 | a decisão G | — |
| A lista de versões e "voltar a esta versão" | fica de fora (24.6.1): pede a tela de versões, e voltar passa pelas conferências de publicar | o agente: `versionBack` e `refuseUnheld` (PR 843, `publish.ts:162-169`) | activepieces `flow-versions-card.tsx:47,115`; Dify `version-history-panel` | Uma lista com o rascunho e as publicadas; voltar copia para o rascunho | embrulhado | — | — | — |

As linhas citadas do Mastra sem `dist/` são do `mastra@6e8dfcb8` (a etiqueta `@mastra/core@1.82.0`);
as do activepieces em `f34c43cd`, as do n8n em `2e855356`, as do Mastra Code e do playground-ui no
mesmo `6e8dfcb8`. As provas P1 a P12 rodaram fora do repositório com `@mastra/core` 1.82.0,
`@mastra/pg` 1.35.0 e Postgres 18; o relatório do estudo guarda os scripts e as saídas.

**A medida do transplante.** Nada vem do produto antigo: ele não tinha workflows.

**A dívida.**

- `docs/architecture.md:215` diz que o Mastra lê a agenda a cada 10 s; a regra D27 diz que dorme
  até o próximo disparo. O fechamento acerta a arquitetura.
- O texto do pg-boss (`roadmap.md:71`, `decisions/0058:15`) sai no fechamento.
- Uma versão nunca é arquivada enquanto o workflow existe; com muitas edições, o início carrega
  mais definições. Gatilho: mais de 50 versões num workflow.
- Dentro de um ramo, a página mostra o estado de cada balão, mas a saída só do último (o Mastra
  guarda só o fim do ramo, prova P5 do estudo). Gatilho: um ramo com mais de um balão de leitura.
- A tela relê a execução a cada 5 s; um aviso ao vivo pediria o processo da execução (prova P10 do
  estudo). Gatilho: alguém reclamar do atraso.

**O que fica por conferir no fim, com o Sankhya de verdade.** Os nomes dos campos do orçamento em
`CabecalhoNota` (o número, o tipo de operação, a data de negociação, o valor, o cliente) estão no
dublê como a documentação os dá; a gravação T26 da leitura nova, feita pelo fundador só lendo,
confirma. O limite de chamadas do Sankhya não está documentado; uma volta faz uma leitura.

## U1 O workflow como dado

**Base e modelo.** `main` do dia. Sonnet: o contrato está fixo neste cartão e a compilação é uma
função pura com a forma da prova P8 do estudo.

### As linhas da tabela

- **O documento e as versões.** Modelo: `builder/agents/tables.ts:29-37` (`agent`, com `draft`,
  `revision`, `active_version`), `:71` (`agent_version`, com `source_revision` único e
  `published_by`), e `builder/agents/publish.ts:225-251` (`published`: a linha do agente
  `for update`, a republicação idempotente por `source_revision`, o `frozen()`).
- **Compilar.** API: `mastra.addDynamicWorkflows(defs)` (`packages/core/src/mastra/index.ts:5909-6045`):
  valida cada definição contra o registro vivo, ordena os aninhados, volta atrás se uma falha, e
  grava em `mastra_workflow_definitions`. Os campos da definição e as entradas:
  `dist/docs/references/reference-workflows-dynamic-workflow-definition.md:13-24,52-68`. O
  `mapping` (`dynamic/mapping-config.ts:51-60,86-185`): fontes `value`, `template`, `initData` +
  `path`, `step` + `path`; uma por chave. O `conditional` com um ramo `workflow` aninhado
  (`workflows/builder/authoring-playbook.ts:7,310-343,373`). A forma que funcionou é a das provas
  P5 e P8 do estudo.
- **Os problemas.** API: `validateDynamicWorkflow(def, index)`, exportado de
  `@mastra/core/workflows` (`dynamic/validate/index.ts:41-60`), devolve
  `{ code, path, message, repair? }` sem lançar; os códigos em `validate/types.ts:13-29`; as
  conferências de referência só correm para os registros presentes no índice (`types.ts:79-92`). O
  índice do Mastra é privado (`mastra/index.ts:5745`): o Conexus monta o seu, com
  `toJsonSchemaOrUndefined(tool.inputSchema)` e `outputSchema` de cada ferramenta registrada, e os
  ramos do mesmo pacote (prova P9 do estudo).
- **O papel de quem publica.** `hub/connectors/publish-check.ts:34-60` (`ungrantedBy`),
  `identity.mayUseEach` (`hub/identity/may-use.ts:71-95`), `identity.mayPublishUnattended`
  (`may-use.ts:102-113`). Modelo de uso: `builder/agents/publish.ts:73-115` (`refuseByRole`) e
  `:138-152` (`mayLeaveAlone`).
- **O agente fixado.** `builder/agents/public.ts:47-49` (`activeOf`) dá a versão ativa no momento
  de publicar.
- **Apagar uma definição.** `store.delete(id)` no domínio `workflowDefinitions` e
  `mastra.removeWorkflow(id)`, como o Mastra faz (`packages/server/src/server/handlers/dynamic-workflows.ts:161-185`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/workflows.ts`, `workflow-failures.ts`, `workflows.test.ts` | Cria | o servidor, a web |
| `packages/hub-api/src/failures.ts`, `index.ts` | Muda (espalha `WORKFLOW_FAILURES`; exporta) | todo o Hub |
| `apps/server/src/builder/workflows/` | Cria `tables.ts`, `store.ts`, `ids.ts`, `compile.ts`, `index.ts`, `problems.ts`, `publish.ts`, `routes.ts`, `release.ts`, `public.ts`, `tools.ts` (as seis ferramentas, só ids e esquemas) | `conversations-of.ts`, a U3, a U4, a U5 |
| `apps/server/src/builder/mastra/mastra.ts` | Muda (as seis ferramentas no `new Mastra({ tools })`, `:20-28`) | `main.ts` |
| `apps/server/src/builder/mastra/hub-mastra.ts` | Muda (depois de `startWorkers()`, `:98-110`, apagar as definições `wf-*` sem versão) | `main.ts` |
| `apps/server/src/conversations-of.ts` | Muda (as rotas; os workflows no `releaseFirst`, `:162-174`) | `main.ts` |
| `apps/server/migrations/`, `apps/server/database-grants.sql` | Cria `<ts>_e246_workflow` e `<ts>_e246_workflow_grants` | o catálogo |
| `apps/server/src/platform/catalog.test.ts` | Muda (o retrato do catálogo) | — |
| `packages/hub-api/src/workflow-ids.ts` | Pega da U2 por `cherry-pick`, sem mudar | — |

### Os contratos que a unidade cria

Em `packages/hub-api/src/workflows.ts` (as marcas vêm de `workflow-ids.ts`, da U2):

```ts
import { WorkflowId, BalloonId, WorkflowRunId } from './workflow-ids.ts'

/** O limite do workflow, com fonte: o Kiro recusa mais de 50 passos (estudo do Kiro do fundador). Passar dele é um problema, não uma recusa. */
export const BALLOONS_MAX = 50
/** O teto do esquema, só contra um corpo absurdo: acima dele, REQUEST_MALFORMED. */
export const BALLOONS_SCHEMA_MAX = 200
export const BRANCH_MAX = 10
/** Um valor do gatilho ou de um balão anterior: '{{gatilho.valor}}', '{{b2.texto}}'. */
export const Template = z.string().max(2000)
export const Title = z.string().trim().min(1).max(80)

/** Onde o workflow mora (decisão H): a mesma forma do lugar da Automação. */
export const WorkflowPlace = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('COMPANY') }),
  z.object({ kind: z.literal('PROJECT'), projectId: ProjectId }),
])

/** O que o gatilho do Sankhya entrega a cada execução: a entrada do workflow (U4). */
export const QuoteInput = z.object({
  numero: z.int().positive(), tipo: z.int().positive(),
  data: z.iso.date(), valor: z.number(), cliente: z.int().positive(),
})
/** O único lugar de onde um `IF` lê um número (prova P8 do estudo). */
export const TriggerField = z.enum(['valor'])

export const Trigger = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('SCHEDULE'), cadence: Cadence }),        // Cadence de automations.ts
  z.object({ kind: z.literal('SANKHYA_NEW'), connectionId: ConnectionId.nullable(),
    operationTypes: z.array(z.int().positive()).max(20),
    everyMinutes: z.literal(15) }),      // a decisão C: C2 troca por 5; C3 por 5 | 15 | 30 | 60
  z.object({ kind: z.literal('MANUAL') }),
])

/** Quem responde a um pedido (decisão A): por padrão quem publicou. */
export const Approver = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('PUBLISHER') }),
  z.object({ kind: z.literal('PERSON'), personId: PersonId }),
])
export const AgentTarget = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('PUBLISHED'), agentId: AgentId }),
  z.object({ kind: z.literal('ASSISTANT'), connections: z.array(ConnectionId).max(CONNECTIONS_MAX) }),
])

const Leaf = [
  z.object({ kind: z.literal('READ'), id: BalloonId, title: Title,
    connectionId: ConnectionId.nullable(), operation: OperationId.nullable(),
    input: z.record(z.string(), Template) }),
  z.object({ kind: z.literal('AGENT'), id: BalloonId, title: Title,
    agent: AgentTarget.nullable(), prompt: Template, approver: Approver }),
  z.object({ kind: z.literal('APPROVAL'), id: BalloonId, title: Title,
    approver: Approver, question: Template }),
  z.object({ kind: z.literal('WRITE'), id: BalloonId, title: Title,
    connectionId: ConnectionId.nullable(), operation: OperationId.nullable(),
    input: z.record(z.string(), Template), approval: z.enum(['ASK', 'AUTO']), approver: Approver }),
  z.object({ kind: z.literal('NOTIFY'), id: BalloonId, title: Title,
    people: z.array(PersonId).max(10), message: Template }),
] as const
export const LeafBalloon = z.discriminatedUnion('kind', Leaf)
export const Balloon = z.discriminatedUnion('kind', [
  ...Leaf,
  z.object({ kind: z.literal('IF'), id: BalloonId, title: Title,
    value: TriggerField, op: z.enum(['GT', 'GTE', 'LT', 'LTE', 'EQ', 'NEQ']),
    than: z.number().nullable(), then: z.array(LeafBalloon).max(BRANCH_MAX) }),
])

/** O rascunho, como a pessoa e o Construtor o gravam: aceita um balão incompleto (o "+"). */
export const WorkflowDraft = z.object({
  name: Title, trigger: Trigger, balloons: z.array(Balloon).max(BALLOONS_SCHEMA_MAX),
})

export const WorkflowProblemCode = z.enum([
  // as regras do Conexus
  'NO_BALLOONS', 'WORKFLOW_TOO_MANY_BALLOONS', 'DUPLICATE_ID', 'BALLOON_INCOMPLETE', 'TRIGGER_NO_TYPES',
  'CONNECTION_NOT_OFFERED', 'OPERATION_UNKNOWN', 'OPERATION_WRONG_CLASS', 'OPERATION_NOT_IN_ROLE',
  'INPUT_FIELD_UNKNOWN', 'INPUT_FIELD_MISSING', 'INPUT_FIELD_INVALID',
  'REF_BALLOON_UNKNOWN', 'REF_NOT_BEFORE', 'REF_INSIDE_BRANCH', 'REF_FIELD_UNKNOWN',
  'AGENT_NOT_FOUND', 'AGENT_NOT_PUBLISHED', 'AGENT_OTHER_PROJECT', 'AGENT_VERSION_CHANGED',
  'PERSON_NOT_FOUND', 'PERSON_CANNOT_APPROVE', 'IF_FIELD_NOT_NUMBER', 'IF_EMPTY',
  'WRITE_AUTO_NOT_ALLOWED',
  // a validação do Mastra, um por código de `validate/types.ts:13-29`, os outros em GRAPH_OTHER
  'GRAPH_MISSING_REFERENCE', 'GRAPH_INCOMPATIBLE_SCHEMA', 'GRAPH_INVALID_MAP', 'GRAPH_OTHER',
])
export const WorkflowProblem = z.object({
  code: WorkflowProblemCode,
  severity: z.enum(['ERROR', 'WARNING']),        // ERROR bloqueia testar e publicar
  balloonId: BalloonId.nullable(),                // nulo: o gatilho ou o workflow inteiro
  path: z.string(),                               // 'balloons.2.input.codigo', ou 'graph:<caminho do Mastra>'
  message: z.string(),                            // a frase em português, com o título do balão
})

export const WorkflowState = z.enum(['ON', 'PAUSED', 'PAUSED_OWNER'])
export const LastLap = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('OK'), at: z.iso.datetime(), started: z.int().nonnegative() }),
  z.object({ kind: z.literal('FAILED'), at: z.iso.datetime(), code: FailureCodeSchema }),
])
export const WorkflowView = z.object({
  id: WorkflowId, place: WorkflowPlace, name: z.string(),
  revision: z.int().nonnegative(),
  draft: WorkflowDraft.nullable(),
  problems: z.array(WorkflowProblem),             // recalculados a cada leitura
  published: z.object({ number: z.int().positive(), draft: WorkflowDraft,
    publishedBy: PersonId.nullable(), publishedAt: z.iso.datetime() }).nullable(),
  changed: z.boolean(),                           // o rascunho difere da versão publicada
  state: WorkflowState,
  lastLap: LastLap.nullable(),                    // escrito pela U4; nulo sem gatilho do Sankhya
})
export const SaveDraftBody = z.object({
  place: WorkflowPlace.optional(),                // só ao criar (um {w} novo)
  revision: z.int().nonnegative(),                // 0 ao criar
  draft: WorkflowDraft,
})
export const PublishBody = z.object({ revision: z.int().nonnegative() })
```

`OperationId`, `ConnectionId`, `AgentId`, `PersonId`, `ProjectId`, `Cadence`, `CONNECTIONS_MAX`
e o esquema dos códigos de falha já existem em `packages/hub-api/src/`. O "+" do canvas e o
Construtor gravam o mesmo `WorkflowDraft`. Os limites: mais de `BALLOONS_MAX` balões, contando os
de dentro dos ramos, dá o problema `WORKFLOW_TOO_MANY_BALLOONS` (`ERROR`) e o rascunho grava; um
nível de ramo só nesta etapa (`then` aceita só `LeafBalloon`): o Kiro aninha até 8, mas o grafo
guardado do Mastra não aceita um contêiner dentro de outro (as notas do estudo sobre o Mastra).

Em `apps/server/src/builder/workflows/`, os tipos internos:

```ts
// problems.ts: a única dona dos problemas; chamada ao gravar, ao ler, ao testar e ao publicar.
/** O rascunho sem nenhum problema ERROR, com todos os campos preenchidos: o único que se compila. */
export type ReadyDraft = Brand<WorkflowDraft, 'ReadyDraft'>
export type World = Readonly<{ /* a porta: ligações oferecidas ao lugar, o kit, os agentes ativos
  do lugar, as pessoas da empresa, o papel de quem publica, o índice do Mastra */ }>
export async function problemsOf(world: World, draft: WorkflowDraft, publisher: PersonId):
  Promise<{ problems: WorkflowProblem[]; ready: ReadyDraft | null }>

// index.ts: o índice que validateDynamicWorkflow recebe, montado das ferramentas registradas.
export function registryIndexOf(mastra: Mastra, bundle: readonly DynamicWorkflowDefinition[]): /* o tipo do segundo argumento de validateDynamicWorkflow no 1.82 */

// ids.ts: a dona das ids do Mastra.
export type MastraWorkflowId =
  | { kind: 'VERSION'; workflowId: WorkflowId; version: number }                       // wf-<w>-v<n>
  | { kind: 'BRANCH'; workflowId: WorkflowId; version: number; balloon: BalloonId }    // wf-<w>-v<n>-<b>
  | { kind: 'TEST'; workflowId: WorkflowId; branch: BalloonId | null }                // wf-<w>-teste[-<b>]
export function parseMastraWorkflowId(raw: string): MastraWorkflowId | null
export function mastraWorkflowIdOf(id: MastraWorkflowId): string

// compile.ts: sem I/O.
export type FrozenWorkflow = Readonly<{
  draft: ReadyDraft
  agents: ReadonlyArray<{ balloonId: BalloonId; agentId: AgentId; versionNumber: number }>
  declared: ReadonlyArray<{ connectionId: ConnectionId; operation: OperationId }>  // leituras, a leitura do gatilho e escritas
}>
export function compiled(id: MastraWorkflowId, frozen: FrozenWorkflow): DynamicWorkflowDefinition[] // os ramos primeiro, o principal por último

// tools.ts: as ids, que a U3 enche.
export const WORKFLOW_TOOL = {
  check: 'conexus-conferir', read: 'conexus-ler', agent: 'conexus-agente',
  approval: 'conexus-aprovar', write: 'conexus-escrever', notify: 'conexus-avisar',
} as const
```

**A gramática da compilação** (a compilação é a única dona, C26). A primeira entrada do principal
é `{ type: 'tool', id: 'conferir', toolId: 'conexus-conferir' }`. Cada balão-folha `bN` vira um
`mapping` de id `bN-in` (`{ balloon: { value: 'bN' }, …um template por valor que o balão usa… }`)
seguido de um `tool` de id `bN` com a ferramenta da espécie. `{{gatilho.<campo>}}` vira o
`template` `${initData.<campo>}`; `{{bN.<campo>}}` vira `${stepResults.bN.<campo>}`; nunca uma
fonte `step` + `path`, que o Mastra confere contra o esquema de saída e recusa (prova P8 do
estudo). Um `IF` `bK` vira um `mapping` de cima de id `bK-in`, que entrega ao ramo, com nomes
próprios, cada valor de fora que os balões do ramo usam (como `template`) e o campo do `IF` (como
`initData` + `path`), seguido de um `conditional` de id `bK` com um ramo, a definição aninhada
`wf-<w>-v<n>-bK`; dentro do ramo, as referências de fora viram `${initData.<nome>}`. O
`inputSchema` do principal é `QuoteInput` com `SANKHYA_NEW` e um objeto vazio com `SCHEDULE` e
`MANUAL`. As saídas por espécie, que `REF_FIELD_UNKNOWN` confere e as ferramentas da U3 declaram:
`READ` `{ resultado }`, `AGENT` `{ texto, conversationId }`, `APPROVAL` `{ aprovado, por }`,
`WRITE` `{ resultado, marca }`, `NOTIFY` `{ avisados }`.

**As seis ferramentas** entram no `new Mastra({ tools })` com as ids de `WORKFLOW_TOOL`, o
`inputSchema` `z.object({ balloon: z.string() }).catchall(z.unknown())`, o `outputSchema` da
espécie, e um `execute` que lança `Failure('INTERNAL_UNEXPECTED')` até a U3. Os testes da U1 trocam
o `execute` por um que devolve a entrada.

**Rotas** (`BASE` = `/api/companies/{companyId}/workflows`; acesso `manageAutomations`; a empresa e
a pessoa vêm da sessão, S9; um `{w}` de outra empresa ou de um Projeto sem acesso responde
`WORKFLOW_NOT_FOUND`):

- `GET BASE/{w}` → `WorkflowView`; `WORKFLOW_NOT_FOUND`.
- `PUT BASE/{w}/draft` corpo `SaveDraftBody` (um `{w}` novo cria o workflow no `place`) →
  `WorkflowView`; `REQUEST_MALFORMED`, `WORKFLOW_DRAFT_STALE`, `NOT_IN_ROLE`.
- `POST BASE/{w}/publish` corpo `PublishBody` → `WorkflowView`; `WORKFLOW_HAS_PROBLEMS`,
  `WORKFLOW_DRAFT_STALE`, `NOT_IN_ROLE`, `WORKFLOW_PUBLISH_REFUSED`.
- `DELETE BASE/{w}` → 204.

`WORKFLOW_FAILURES` em `packages/hub-api/src/workflow-failures.ts`, cada um com categoria, estado
HTTP, frase e ação, como `automation-failures.ts`: `WORKFLOW_NOT_FOUND` (404),
`WORKFLOW_DRAFT_STALE` (409), `WORKFLOW_HAS_PROBLEMS` (409), `WORKFLOW_PUBLISH_REFUSED` (500,
categoria `SYSTEM`), `WORKFLOW_NOT_PUBLISHED` (409), `WORKFLOW_PAUSED` (409),
`WORKFLOW_OWNER_CANNOT_RUN` (409), `WORKFLOW_TRIGGER_FAILED` (502), `RUN_NOT_FOUND` (404),
`RUN_NOT_WAITING` (409), `NOT_APPROVER` (403), `RUN_NOT_FAILED` (409), `RUN_STILL_OWNED` (409).
`AGENT_NOT_FOUND` (`agent-failures.ts:11`), `NOT_IN_ROLE`, `NOT_GRANTED` e `AUTOMATION_LIMIT` já
existem e são reusados. As frases vão com os textos das telas ao fundador.

**Tabelas** (esquema `builder`, `company_id` e a política de linha como as do agente, regra D11):

- `workflow(id uuid pk, company_id text not null fk company on delete cascade, project_id text null
  fk project on delete cascade, name text not null, draft jsonb null, revision int not null default
  0, test_draft jsonb null, state text not null default 'ON' check in ('ON','PAUSED','PAUSED_OWNER'),
  active_version int null, created_by text null, created_at timestamptz not null default now())`;
  `project_id` nulo é a empresa; `test_draft` é escrito pela U3; `created_by` fica nulo quando a
  pessoa sai.
- `workflow_version(workflow_id uuid fk workflow on delete cascade, company_id text not null,
  number int not null, frozen jsonb not null, source_revision int not null, published_by text null,
  published_at timestamptz not null, primary key (workflow_id, number), unique (workflow_id,
  source_revision))`; `published_by` fica nulo quando a pessoa sai da empresa, como
  `builder/agents/release.ts:30-35`.
- Lidos de volta, `draft` passa por `WorkflowDraft.parse` e `frozen` pelo esquema de
  `FrozenWorkflow` (C27).
- Permissões, na migração `e246_workflow_grants` e no espelho `database-grants.sql`, como
  `20261107125733_e245_connector_write_grants`: `workflow` com `SELECT, INSERT, DELETE` e
  `UPDATE (name, draft, revision, test_draft, state, active_version, created_by)`;
  `workflow_version` com `SELECT, INSERT` e `UPDATE (published_by)`.

**O dono de cada fato.** O desenho publicado: `workflow_version.frozen` (o Mastra guarda a
compilação, nunca o desenho). Quem publicou: `workflow_version.published_by`. A classe de cada
operação: o kit, como na 24.5. As ids do Mastra: `ids.ts`. Os problemas: `problems.ts`. O arquivo
tomado como modelo: `builder/agents/tables.ts` e `builder/agents/publish.ts`, que cumprem C21, C23
e C26.

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/server/src/builder` (`@mastra/core`,
`@mastra/pg`: a skill `mastra`, com `node_modules/@mastra/core/dist/docs/` primeiro), para
`apps/server/src` (`fastify`: `fastify-best-practices`; `drizzle-orm`: `orm.drizzle.team/llms.txt`)
e para `apps/server` (`drizzle-kit`: a skill `drizzle` do pacote). Para os tipos de marca,
`typescript-magician`.

### A ordem do trabalho

1. `cherry-pick` do commit da U2 que cria `packages/hub-api/src/workflow-ids.ts`. O contrato e as
   falhas em `hub-api`, com o teste de esquema. Regras: C21, C23, C27, C28, C51.
2. `tables.ts` e `npm run generate` para `<ts>_e246_workflow`; a migração de permissões
   `<ts>_e246_workflow_grants` à mão e o espelho em `database-grants.sql` (D11); `npm run
   migrations`.
3. `ids.ts` e `compile.ts`, puros, com teste de mesa contra a forma da prova P8 do estudo.
4. `index.ts` e `problems.ts`: primeiro as regras puras; depois as do mundo atrás da porta
   `World`; por fim, para um rascunho sem problema do Conexus, compilar e chamar
   `validateDynamicWorkflow(def, registryIndexOf(mastra, bundle))` para cada definição, e traduzir
   cada problema do Mastra: o balão vem da id da entrada (`bN-in` e `bN` são de `bN`; `conferir` é
   nulo), o caminho é `graph:<path>`, a frase é uma por código.
5. `publish.ts`: `admitted(..., 'manageAutomations')`; a linha do workflow `for update`;
   `problemsOf` com quem publica; qualquer `ERROR` responde `WORKFLOW_HAS_PROBLEMS`; a mesma
   `source_revision` responde a versão que existe; senão, o `frozen` (os agentes por `activeOf`, o
   declarado), o `INSERT` da versão, `active_version`, e, antes do `COMMIT`,
   `addDynamicWorkflows(compiled(...))`; recusado, a transação volta e responde
   `WORKFLOW_PUBLISH_REFUSED`.
6. `tools.ts` e o registro em `mastra.ts`; em `hub-mastra.ts`, depois de `startWorkers()`, apagar
   as definições `wf-*` (fora `wf-*-teste*`) sem versão no Hub.
7. `routes.ts`, `release.ts` (apagar as definições de um workflow, de um Projeto, de uma empresa),
   e o registro em `conversations-of.ts`.

### Como se prova

Critérios 1 a 5, pelo servidor de verdade (`hubBeside`) com o dublê do Sankhya; o critério 5 abre
um segundo Hub ao lado do mesmo banco. O critério 2 falha hoje porque não há `problems.ts`.

### Parar se

- O `addDynamicWorkflows` recusar uma ferramenta registrada no `new Mastra({ tools })`: relatar com
  a saída; não registrar por fora.
- O predicado do `conditional` não comparar o número de um `TriggerField` entregue pelo `mapping`
  de cima: relatar; não escrever uma comparação nossa sem o cartão.
- `addDynamicWorkflows` não puder rodar dentro da transação do Hub (outra conexão do Mastra ao
  mesmo banco espera a transação): relatar; a ordem muda só com o cartão.
- `validateDynamicWorkflow` não estiver exportado no 1.82 instalado, ou o seu índice pedir o que as
  ferramentas não dão: relatar com a saída.

## U2 Um caminho de escrita

**Base e modelo.** `main` do dia com o PR 843 já entrado; a unidade depende dele e não começa
antes. Sonnet: move funções que já existem e acrescenta um braço a um tipo; a regra está fixa
aqui.

### As linhas da tabela

- **A decisão.** No PR 843: `holdsWrite` (`builder/agents/publish.ts:196-209`),
  `publisherLeavesAlone` (`publish.ts:212-234`, lê `agent_version.published_by`, `roleOf`,
  `mayPublishUnattended`, `mayUse`), `aloneByPublisher` (`builder/agents/tools.ts:120-128`, chamado
  em `writeTool.requireApproval` `:145-147`), `mayApproveAgents` (`builder/agents/write-of.ts`),
  consumido em `builder/conversation/guard.ts:221-223`. No `main`: `writeTool`
  (`builder/agents/tools.ts:110-142`), a escrita aberta (`hub/connectors/write-record.ts:242-298`,
  `openWritesOf`).
- **O registro.** `hub/connectors/tables.ts:205-250` (a chave `(company_id, thread_id,
  tool_call_id)`, o `check` `connector_write_speaker`); `write-record.ts:30-43` (`WriteRequest`),
  `:67-70` (`markOf`), `:108` (`aboutOf`), `:222-240` (`register`); `write.ts:69-106` (`admitted`),
  `:154-183`; `assistant-port.ts:308-310`.
- **Quem fala.** `hub/identity/may-use.ts:64-68` (`declares`), `:76` (o `VERSION` só confere o
  declarado).
- **A migração.** `scripts/check-migrations.ts:16,51`: um `DROP` sem a linha `-- contract:` é
  recusado; trocar um `CHECK` é `DROP CONSTRAINT` e `ADD CONSTRAINT`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/workflow-ids.ts`, `index.ts` | Cria; exporta | a U1, o servidor, a web |
| `apps/server/src/hub/connectors/approval.ts` | Cria | `builder/agents/`, `builder/conversation/guard.ts`, a U3 |
| `apps/server/src/hub/connectors/write-record.ts`, `write.ts`, `tables.ts`, `assistant-port.ts`, `public.ts` | Muda (`where`, `callKey`, o autor `WORKFLOW`, as colunas, o `CHECK`) | `builder/agents/tools.ts`, a U3 |
| `apps/server/src/hub/identity/may-use.ts`, `public.ts` | Muda (o braço `WORKFLOW` de `Speaker`) | `hub/connectors/` |
| `apps/server/src/hub/connectors/{approval,write,connector-write-table}.test.ts`, `test-write.ts` | Cria ou muda (os testes dos critérios 6 a 8) | — |
| `apps/server/src/builder/agents/tools.ts`, `publish.ts`, `write-of.ts`, `agent.ts` | Muda (chamam `approval.ts`; saem as cópias) | o controlador do agente |
| `apps/server/src/builder/conversation/guard.ts` | Muda (`mayApprove` do lugar novo) | a conversa |
| `apps/server/migrations/` | Cria `<ts>_e246_connector_write_workflow` | o catálogo |
| `apps/server/src/platform/catalog.test.ts` | Muda (o retrato do catálogo) | — |

`database-grants.sql` não muda: `connector_write` já tem `SELECT, INSERT` na tabela e
`UPDATE (state, answer)` (`database-grants.sql:331-333`), e as colunas novas só são inseridas.

### Os contratos que a unidade cria

Em `packages/hub-api/src/workflow-ids.ts` (texto fixo, que a U1 também usa):

```ts
import { z } from 'zod'
export const WorkflowId = z.uuid().brand<'WorkflowId'>()
export type WorkflowId = z.infer<typeof WorkflowId>
/** Um balão do workflow, a id de entrada da compilação. */
export const BalloonId = z.string().regex(/^b[0-9]{1,3}$/).brand<'BalloonId'>()
export type BalloonId = z.infer<typeof BalloonId>
/** Uma execução do Mastra: uuid (manual, gatilho do Sankhya, teste) ou sched_<agenda>_<ms> (horário). */
export const WorkflowRunId = z.string().regex(/^([0-9a-f-]{36}|sched_[A-Za-z0-9_-]+_[0-9]+)$/).brand<'WorkflowRunId'>()
export type WorkflowRunId = z.infer<typeof WorkflowRunId>
```

Em `apps/server/src/hub/connectors/approval.ts`, a única dona de "pergunta ou faz" e de quem pode
aprovar uma escrita:

```ts
export type WriteScope =
  | { kind: 'CONVERSATION'; threadId: ConversationId }  // a conversa: callKey é o toolCallId
  | { kind: 'RUN'; runId: WorkflowRunId }              // o workflow: callKey é o balão
export type WriteTarget = Readonly<{ connectionId: ConnectionId; connectorId: ConnectorId; operationId: OperationId }>
export type Ask =
  | { kind: 'DO' }
  | { kind: 'ASK'; reason: 'CHOSEN' | 'PUBLISHER_LOST_RIGHT' | 'OPEN_WRITE' }

/** Pergunta antes; D2-a (quem publicou perdeu o direito, ou saiu); uma escrita aberta no mesmo where. */
export async function mustAsk(deps: ApprovalDeps, a: Readonly<{
  companyId: CompanyId
  choice: 'ASK' | 'AUTO'
  publishedBy: PersonId | null       // quem chama lê: agent_version ou workflow_version
  scope: SessionScope
  where: WriteScope
  target: WriteTarget
}>): Promise<Ask>
/** D3-a: quem aprova tem a escrita no próprio papel, lido agora. */
export async function mayApprove(deps: ApprovalDeps, a: Readonly<{
  companyId: CompanyId; personId: PersonId; target: WriteTarget
}>): Promise<boolean>
```

`holdsWrite` e `publisherLeavesAlone` vêm do PR 843 para este arquivo, sem exportar; `publish.ts`
guarda `refuseUnheld` e `versionBack`, que são do agente, e passa a chamar `mayApprove`.
`writeTool.requireApproval` vira `(await mustAsk({ …, where: { kind: 'CONVERSATION', threadId },
publishedBy })).kind === 'ASK'`, com `publishedBy` lido de `agent_version.published_by` como hoje.

Em `hub/connectors/write-record.ts`, `WriteRequest` troca `threadId` e `toolCallId` por:

```ts
  where: WriteScope
  callKey: string                // o toolCallId, ou a id do balão
  …
} & (
  | Readonly<{ speaker: Person }>
  | Readonly<{ speaker: Version; agentId: AgentId; number: number }>
  | Readonly<{ speaker: WorkflowSpeaker; workflowId: WorkflowId; number: number }>
)
```

`markOf(scopeId: string, callKey: string)` guarda a mesma conta de hoje, então a marca de uma
escrita da 24.5 não muda. Em `hub/identity/may-use.ts`, `Speaker` ganha `{ kind: 'WORKFLOW';
declared }`, conferido por `declares` como o `VERSION`.

A migração `<ts>_e246_connector_write_workflow`, gerada de `tables.ts` com a linha
`-- contract: o CHECK connector_write_speaker ganha o braço WORKFLOW; a imagem anterior não grava esse braço`:
acrescenta `workflow_id uuid null` e `workflow_version int null`; troca o `check`
`connector_write_speaker` por três braços exclusivos (`agent_id` e `version_number` não nulos e os
outros nulos; só `person_id`; `workflow_id` e `workflow_version` não nulos e os outros nulos). A
chave primária `(company_id, thread_id, tool_call_id)` fica: `thread_id` guarda a conversa ou a
execução, `tool_call_id` o `toolCallId` ou o balão. Nada de chave nula, índice parcial ou segunda
chave.

**O dono de cada fato.** "Pergunta ou faz": `approval.ts` `mustAsk`. Quem pode aprovar uma
escrita: `approval.ts` `mayApprove`. A chave de uma escrita: `where` e `callKey`. O arquivo tomado
como modelo: `hub/connectors/write-record.ts`, que cumpre C21 (o autor como união), C23 e C26.

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/server/src` (`drizzle-orm`), `apps/server`
(`drizzle-kit`, a skill `drizzle`), `apps/server/src/hub` (`better-auth`: a skill
`better-auth-best-practices`, para `hasPermission`), `apps/server/src/builder` (`@mastra/core`:
`mastra`, para `requireApproval`).

### A ordem do trabalho

1. `workflow-ids.ts` num commit só (a U1 o pega). Regras: C23.
2. `approval.ts`: mover `holdsWrite` e `publisherLeavesAlone` do PR 843 sem mudar o corpo,
   trocar a leitura de `agent_version.published_by` pelo argumento `publishedBy`; escrever
   `mustAsk` (a ordem: `choice` diferente de `AUTO` dá `CHOSEN`; quem publicou não deixa dá
   `PUBLISHER_LOST_RIGHT`; uma escrita aberta no `where` dá `OPEN_WRITE`) e `mayApprove`. Apagar as
   cópias em `builder/agents/` e chamar o lugar novo de `tools.ts`, `write-of.ts` e `guard.ts`.
   Os testes do PR 843 passam sem mudar (critério 6).
3. `write-record.ts`, `write.ts`, `assistant-port.ts`: `where` e `callKey`; o braço `WORKFLOW` em
   `aboutOf`, `inserted`, `openRows`; `admitted` aceita o braço. `may-use.ts`: o braço.
4. `tables.ts`, `npm run generate`, a linha `-- contract:`, `npm run migrations`; o retrato do
   catálogo. Regras: data D6, D11.

### Como se prova

Critérios 6 a 8. O critério 7 falha hoje porque `Speaker` não tem `WORKFLOW`.

### Parar se

- O PR 843 não estiver no `main`: não começar.
- `markOf` com os argumentos novos der outra marca para uma linha da 24.5: relatar; a marca de uma
  escrita feita não muda.
- O `drizzle-kit` não gerar a troca do `CHECK` numa transação só: relatar com o SQL.

## U3 O executor e as execuções

**Base e modelo.** A U1 e a U2 no `main`. Opus: a retomada através de um reinício, a corrida de
duas respostas, a posse da execução e o agente que suspende cruzam o Mastra, o agente e o funil
(concorrência e desenho entre módulos).

### As linhas da tabela

- **As ferramentas.** O contexto `dist/tools/types.d.ts:202-212` (`workflowId`, `runId`,
  `suspend`, `resumeData`, `suspendPayload`); `suspendSchema` e `resumeSchema`
  (`reference-tools-create-tool.md:75-77,105`). Cada ferramenta acha a versão por
  `parseMastraWorkflowId(context.workflow.workflowId)` e o balão pela id na entrada, lê o `frozen`
  da versão, e nunca confia em empresa, ligação ou pessoa vindas do grafo (S7, S8, S9); confere a
  própria entrada e lança uma `Failure` (prova P2 do estudo: o Mastra devolveria `{ error: true }`
  como sucesso). O escopo de cada chamada é `SessionScope` com `personId` = quem publicou, `chosen`
  = as ligações declaradas, e um `TurnKey` novo por execução (`hub/connectors/builder-port.ts:58-69`).
- **Conferir.** O modelo é `builder/automations/run.ts:189-219` (o dono reconferido, a agenda
  pausada). Lê `published_by`; nulo, ou fora da empresa, ou `mayUseEach` com `{ kind: 'PERSON',
  role }` falso para uma leitura declarada: falha. Isso fecha a brecha de `may-use.ts:76`.
- **Ler.** `hub/connectors/read.ts:135` (`readThrough`) pela porta do Assistente
  (`assistant-port.ts:281-306`), com o autor `WORKFLOW` e o declarado.
- **O agente publicado.** `builder/agents/agent.ts:169-215` (`agentOf`, um `Agent` por versão) e
  `:81-86` (`agentRunContext`, "how a workflow, a test or the Construtor calls an agent alone");
  `builder/agents/open.ts:16-46` (`keep`, a linha antes da conversa) e `:54-88`; as etiquetas
  `AGENT_MARK` (`builder/agents/controller.ts`). A prova P11 do estudo: `agent.stream`, drenar,
  num pedaço `tool-call-approval` `context.workflow.suspend({ agentRunId, toolCallId })`; na
  retomada `agent.approveToolCall({ runId, toolCallId })` ou `declineToolCall`, e drenar de novo.
- **O Assistente.** `builder/automations/run.ts:112-142`: `assistant.open`, `asked`, `turnEnd`,
  `sendSignal` com `requireDelivery`, os 15 minutos.
- **Escrever.** `approval.ts` `mustAsk` (U2) e `writeThrough` com `where: { kind: 'RUN', runId }`
  e `callKey` = o balão; aprovado, `approvedBy` = quem respondeu.
- **Avisar.** `hub/notifications/notifications.ts:40-43,308-325`; a migração
  `20261101085955_e242_notification` (as colunas, o `unique` empresa e execução, os `CHECK` de
  `kind` e `failure_code`).
- **A agenda.** `builder/automations/automations.ts:143-188` (criar idempotente), `cadence.ts:9,22-39`
  (`cronOf`, o limite de 30), `AUTOMATION_TIMEZONE`. A prova P12 do estudo:
  `mastra.schedules.create({ id, workflowId, cron, timezone, inputData, requestContext })` dispara a
  versão; a execução é `sched_<agenda>_<ms>`.
- **As execuções.** `builder/automations/runs.ts:70-190` é o modelo (a página de 20, a interrompida
  cortada no início); `getWorkflowRunById`, `run.resume` (`dist/agent-BP9OWM6D.js:11239`),
  `run.cancel` (`workflows/workflow.ts:4087-4126`), `run.timeTravel`, `run.restart`, a posse de
  15 s (`packages/core/src/agent/run-ownership.ts:9`, `workflows/run-ownership.ts:6`); o retrato
  `WorkflowRunState` (`workflows/types.ts:409-450`). As provas P5 a P8 e P10 do estudo são as formas
  que funcionaram.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/workflows/` | Cria `balloons/{check,read,agent,approval,write,notify}.ts`, `schedule.ts`, `runs.ts`, `run-routes.ts`, `run-tables.ts`; muda `tools.ts` (os corpos), `routes.ts` (a lista), `release.ts` (agendas e execuções) | `conversations-of.ts`, a U4, a U5 |
| `apps/server/src/builder/agents/open.ts`, `public.ts`, `controller.ts` | Muda (`openWorkflowConversation`, `AGENT_MARK.workflow`, `workflowTurn` e `answerCall` em `agentsAlive`) | `balloons/agent.ts` |
| `apps/server/src/builder/automations/` | Muda (`cadence.ts` e `public.ts`: o limite de 30 conta também as agendas `schedule_wf-*`; o teste da agenda com o relógio injetado, #754) | `schedule.ts` |
| `apps/server/src/builder/mastra/hub-mastra.ts` | Muda (no início: a agenda segue o `state`; as decisões gravadas sem retomada são retomadas) | `main.ts` |
| `apps/server/src/main.ts`, `conversations-of.ts` | Muda (as rotas das execuções; os workflows no `releaseFirst`) | — |
| `apps/server/src/hub/notifications/` | Muda (`notifications.ts`, `tables.ts`, `mail.ts`, `public.ts`: quatro espécies novas) | o sino, o e-mail |
| `packages/hub-api/src/workflows.ts`, `notifications.ts` | Muda (`RunView`, `RunPage`, `WorkflowSummary`, `AnswerBody`, `TestResult`; as espécies) | a web |
| `apps/server/migrations/`, `apps/server/database-grants.sql` | Cria `<ts>_e246_workflow_run`, `<ts>_e246_workflow_run_grants`, `<ts>_e246_notification_workflow` | o catálogo |
| `apps/server/src/platform/catalog.test.ts` | Muda (o retrato do catálogo) | — |
| `apps/server/src/platform/recordings/` | Cria as gravações do retrato do Mastra | os testes |

### Os contratos que a unidade cria

Tabelas (esquema `builder`, D11):

- `workflow_run(run_id text pk, company_id text not null, workflow_id uuid not null fk workflow on
  delete cascade, version int not null, item_key text null, item_label text null, started_at
  timestamptz not null)`; escrita por `conferir` com `ON CONFLICT DO NOTHING`; o teste não grava.
  Permissões `SELECT, INSERT, DELETE`.
- `workflow_run_decision(run_id text, call_key text, company_id text not null, workflow_id uuid not
  null fk workflow on delete cascade, balloon_id text not null, person_id text not null, approved
  boolean not null, decided_at timestamptz not null, primary key (run_id, call_key))`; `call_key` é
  o balão num `APPROVAL` ou `WRITE`, e o `toolCallId` num `AGENT`. Permissões `SELECT, INSERT,
  DELETE`.
- `notifications.notification` ganha `workflow_id uuid null` e `workflow_name text null`; o `CHECK`
  de `kind` aceita `WORKFLOW_WAITING`, `WORKFLOW_NOTICE`, `WORKFLOW_PAUSED`, `WORKFLOW_FAILED`; o de
  `failure_code`, os códigos de `WORKFLOW_FAILURES`. Nada se renomeia; os `CHECK` trocados pedem a
  linha `-- contract:`.

O que as ferramentas suspendem e retomam (os esquemas do `suspendSchema` e do `resumeSchema`):

```ts
type Suspended =
  | { kind: 'APPROVAL'; balloonId: BalloonId; approver: PersonId; question: string }
  | { kind: 'WRITE'; balloonId: BalloonId; approver: PersonId; reason: Ask['reason'];
      connectionId: ConnectionId; operation: OperationId; fields: Record<string, unknown> }
  | { kind: 'AGENT_WRITE'; balloonId: BalloonId; approver: PersonId; agentRunId: string;
      toolCallId: string; connectionId: ConnectionId; operation: OperationId; fields: Record<string, unknown> }
type Resumed = { approved: boolean; personId: PersonId }
```

O `approver` sai do `Approver` do balão (`PUBLISHER` é `published_by`); num `WRITE` com
`PUBLISHER_LOST_RIGHT`, é sempre quem publicou (decisão A). `agentRunId` e `toolCallId` ficam no
retrato; a vista não os mostra.

Em `packages/hub-api/src/workflows.ts`:

```ts
export const RunState = z.enum(['RUNNING', 'WAITING', 'DONE', 'FAILED', 'DECLINED', 'INTERRUPTED'])
export const BalloonState = z.enum(['PENDING', 'RUNNING', 'DONE', 'FAILED', 'WAITING', 'SKIPPED'])
export const Waiting = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('APPROVAL'), balloonId: BalloonId, approver: PersonId, question: z.string() }),
  z.object({ kind: z.literal('WRITE'), balloonId: BalloonId, approver: PersonId,
    reason: z.enum(['CHOSEN', 'PUBLISHER_LOST_RIGHT', 'OPEN_WRITE']),
    connectionId: ConnectionId, operation: OperationId, fields: z.record(z.string(), z.unknown()) }),
  z.object({ kind: z.literal('AGENT_WRITE'), balloonId: BalloonId, approver: PersonId,
    connectionId: ConnectionId, operation: OperationId, fields: z.record(z.string(), z.unknown()) }),
])
export const RunView = z.object({
  runId: WorkflowRunId, workflowId: WorkflowId, versionNumber: z.int().positive(),
  item: z.object({ key: z.string(), label: z.string() }).nullable(),
  /** O nome da execução para a pessoa: 'Orçamento nº 1043', 'Rodado por Ana', '10/11 às 7h'. */
  label: z.string(),
  state: RunState,
  balloons: z.array(z.object({ id: BalloonId, state: BalloonState,
    output: z.unknown().optional(), conversationId: ConversationId.optional(),
    failure: FailureCodeSchema.optional() })),
  waiting: Waiting.nullable(),
  decisions: z.array(z.object({ balloonId: BalloonId, approved: z.boolean(), by: PersonId, at: z.iso.datetime() })),
  startedAt: z.iso.datetime(),
})
export const RunSummary = RunView.pick({ runId: true, versionNumber: true, item: true, label: true, state: true, startedAt: true })
export const RunPage = z.object({ runs: z.array(RunSummary), next: Next.nullable() })
export const WorkflowSummary = z.object({
  id: WorkflowId, place: WorkflowPlace, name: z.string(), trigger: Trigger, state: WorkflowState,
  published: z.int().positive().nullable(),
  lastRun: z.object({ state: RunState, at: z.iso.datetime() }).nullable(),
  waitingCount: z.int().nonnegative(),
})
export const AnswerBody = z.object({ approved: z.boolean() })
export const TestResult = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('RAN'), run: RunView }),                   // até o fim, ou até a escrita
  z.object({ kind: z.literal('PROBLEMS'), problems: z.array(WorkflowProblem) }),
])
```

O retrato do Mastra é lido com um esquema Zod só do que o Conexus usa (`status`,
`suspendedPaths`, `context[<id>]` com `status`, `output`, `suspendPayload` e `error`), gravado com
`npm run record` (T26) num `suspended`, `success`, `failed`, `canceled` e `running`. O estado:
`suspended` é `WAITING`; `success` `DONE`; `failed` `FAILED`; `canceled` com uma decisão recusada
`DECLINED`; `running` de antes do início do Hub `INTERRUPTED`. O de cada balão: o passo `bN` do
retrato; um balão de um ramo não tomado num retrato terminado é `SKIPPED` (prova P5 do estudo); um
balão sem passo num retrato que roda é `PENDING`.

Em `builder/agents/public.ts` (`agentsAlive`), para o balão de agente:

```ts
/** A conversa de um agente aberta por um workflow: a linha keep e o thread com AGENT_MARK.workflow, sem sessão do controlador. */
openWorkflowConversation(a: { scope: InProject; agentId: AgentId; versionNumber: number;
  id: ConversationId; workflowId: WorkflowId }): Promise<void>
/** Roda a versão fixada no thread da conversa: o stream do Mastra, que o balão drena. */
workflowTurn(a: { scope: InProject; agentId: AgentId; versionNumber: number;
  conversationId: ConversationId; prompt: string; signal: AbortSignal }): Promise<MastraModelOutput>
/** A retomada: approveToolCall ou declineToolCall na mesma versão, com APPROVED_CALL no requestContext. */
answerCall(a: { scope: InProject; agentId: AgentId; versionNumber: number;
  agentRunId: string; toolCallId: string; approved: boolean; personId: PersonId; signal: AbortSignal }): Promise<MastraModelOutput>
```

A id da conversa vem da execução e do balão (`attemptIdOf` como `run.ts:112`), então um `restart()`
encontra a mesma. Dentro do agente, a ferramenta de escrita vê `context.agent` e não
`context.workflow`, então nunca suspende duas vezes (prova P11 do estudo); a escrita guarda a
chave da conversa, com o autor `VERSION`.

Rotas (`BASE` como na U1; acesso `manageAutomations`, menos `answer`, que é da pessoa do pedido):

- `GET BASE?place=COMPANY|<projectId>` → `{ workflows: WorkflowSummary[] }`.
- `GET BASE/{w}/runs?page=` → `RunPage`; `GET BASE/{w}/runs/{r}` → `RunView`; `RUN_NOT_FOUND`.
- `POST BASE/{w}/runs/{r}/balloons/{b}/answer` corpo `AnswerBody` → `RunView`; `RUN_NOT_WAITING`,
  `NOT_APPROVER`, `NOT_IN_ROLE`.
- `POST BASE/{w}/runs/{r}/retry` → `RunView`; `RUN_NOT_FAILED`, `RUN_STILL_OWNED`.
- `POST BASE/{w}/run` → `{ runId }`; `WORKFLOW_NOT_PUBLISHED`, `WORKFLOW_PAUSED`.
- `POST BASE/{w}/pause`, `POST BASE/{w}/resume` → `WorkflowView`; `AUTOMATION_LIMIT` ao religar
  além de 30.
- `POST BASE/{w}/test` → `TestResult`.

`schedule.ts`: `scheduleIdOf(workflowId, version)` = `schedule_wf-<w>-v<n>`; ao publicar com
`SCHEDULE`, criar a da versão nova, depois apagar a da anterior; pausar, religar e apagar seguem o
`state`. `runs.ts`: a porta `TestInput` (`latest(workflow): Promise<unknown>`), que a U4 enche para
`SANKHYA_NEW`; para os outros, `{}`.

**O dono de cada fato.** O estado de uma execução: o retrato do Mastra, lido por `runs.ts`. Quais
execuções um workflow tem: `workflow_run`. Uma resposta: `workflow_run_decision`. A espera: o
`suspendPayload`. O arquivo tomado como modelo: `builder/automations/runs.ts` e `run.ts`, que
cumprem C21 (o desfecho como união), C23 e C26.

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/server/src/builder` (`@mastra/core`,
`@mastra/pg`, `@mastra/memory`: a skill `mastra`, com `dist/docs/references/` primeiro:
`reference-workflows-run-methods-{resume,cancel,restart,timeTravel}.md`,
`docs-workflows-scheduled-workflows.md`, `docs-workflows-snapshots.md`), `apps/server/src/hub`
(`react-email` para o e-mail), `apps/server/src` (`fastify`, `drizzle-orm`), e
[testing](../guides/testing.md) T20 (o relógio injetado) e T26 (as gravações).

### A ordem do trabalho

1. As migrações `e246_workflow_run` (com permissões e espelho) e `e246_notification_workflow` (com
   `-- contract:`); `npm run migrations`. Regras: data D6, D11.
2. `balloons/check.ts`: o `INSERT` em `workflow_run`, a reconferência, e na falha `state =
   PAUSED_OWNER`, `schedules.pause`, o aviso `WORKFLOW_PAUSED`, e a `Failure`
   `WORKFLOW_OWNER_CANNOT_RUN`.
3. `balloons/read.ts`, `balloons/notify.ts` (nada num `TEST`), `balloons/approval.ts` (suspende
   com `APPROVAL`, avisa `WORKFLOW_WAITING`; na retomada devolve `{ aprovado, por }`).
4. `balloons/write.ts`: sem `resumeData`, `mustAsk`; `ASK`, ou um `TEST`, suspende com `WRITE` e
   avisa (num `TEST` não avisa); `DO` envia. Com `resumeData.approved`, envia com `approvedBy`.
5. `agents/open.ts` e `public.ts` (os três de cima); `balloons/agent.ts`: o Assistente como
   `run.ts:112-142`; o publicado abre a conversa, chama `workflowTurn`, **drena o stream inteiro**,
   e só então, se viu um `tool-call-approval`, suspende com `AGENT_WRITE` e avisa; na retomada,
   aprovado, `answerCall` e drena de novo (o agente pode pedir outra escrita: suspende de novo com o
   `toolCallId` novo); recusado, a rota de responder chama `answerCall` com `approved: false`
   (o `declineToolCall`, para fechar a corrida do agente) e então `run.cancel()`: a execução termina
   `DECLINED` e o agente não é chamado de novo. O começo:

   ```ts
   const output = await alive.workflowTurn({ scope, agentId, versionNumber, conversationId, prompt, signal })
   let asked: { toolCallId: string; toolName: string; args: unknown } | null = null
   for await (const chunk of output.fullStream) {
     if (chunk.type === 'tool-call-approval') asked = chunk.payload
   }
   // só depois de drenar (prova P11: antes, a retomada falha com AGENT_RESUME_TOOL_CALL_NOT_SUSPENDED)
   if (asked !== null) return context.workflow.suspend({ kind: 'AGENT_WRITE', agentRunId: output.runId, … })
   ```

6. `schedule.ts` e o limite de 30 em `cadence.ts`; o #754: o teste da agenda recebe o relógio
   injetado (testing T20).
7. `runs.ts` e `run-routes.ts`: a lista, a vista, `answer` (`mayApprove` num `WRITE` e num
   `AGENT_WRITE`; o `INSERT` da decisão; `resume({ resumeData })`, ou `cancel()` na recusa de um
   `APPROVAL`, `WRITE` ou `AGENT_WRITE`, este depois do `declineToolCall`), `retry`, `run`, `pause`, `resume`, `test` (`test_draft`,
   `addDynamicWorkflows` de `wf-<w>-teste`, a execução, e `cancel()` quando ela para numa escrita).
8. O início em `hub-mastra.ts`; `release.ts` (as agendas, `deleteWorkflowRunById` de cada
   execução, porque guardam a entrada, como `builder/automations/release.ts:22-35`); `GET BASE`.

### Como se prova

Critérios 9 a 22, com o dublê do Sankhya, o modelo de mentira e o relógio injetado; os critérios
12, 14 e 18 abrem um segundo Hub ao lado do mesmo banco. O critério 12 falha hoje porque um agente
com escrita num workflow lança `CONNECTOR_WRITE_NO_CONTEXT` (`builder/agents/tools.ts:127-130`).

### Parar se

- Rodar a versão fixada no thread aberto por `openWorkflowConversation` brigar com o controlador
  do agente (a sessão segura o thread): relatar com a saída; não abrir um segundo formato de
  conversa.
- `approveToolCall` num processo novo não achar a corrida do agente construído por `agentOf` para
  uma versão que não é a ativa: relatar; não registrar a versão no Mastra por fora.
- `approveToolCall` não levar `requestContext`, e por isso a escrita não receber `approvedBy`:
  relatar; o `WRITE_OPEN` da 24.5 decide o que fazer.
- Retomar sem `step` não achar o caminho dentro de um ramo no Hub, ou uma execução cortada dentro
  de um ramo não terminar com `restart()` (a prova P7 do estudo cortou fora de um ramo): relatar
  com a saída; não escrever uma retomada nossa.

## U4 O gatilho do Sankhya

**Base e modelo.** A U3 no `main`. Sonnet: a corrida de duas voltas é resolvida pela chave da
tabela, e as regras estão fixas aqui.

### As linhas da tabela

- **A volta.** O modelo é o activepieces (`packages/pieces/common/src/lib/polling/index.ts:38-140`):
  ao ligar, o começo é o agora (`:119-134`); cada volta lê, guarda o que é novo e dispara. O n8n só
  avança o cursor depois de dar certo (`poll-cursor-hooks.ts:1-18`).
- **A leitura nova do kit.** `orcamentosNovos` (classe `read`, sem oferta ao modelo) em
  `packages/connectors/src/sankhya/operations/vendas.ts`, lê `CabecalhoNota` pela porta `carregar`
  (`packages/connectors/src/sankhya/door.ts:69-100`, o `loadRecords`) com o critério dos tipos e da
  data de negociação desde o dia do começo menos um (a data é sem hora; o número da nota tira a
  repetição). O dublê ganha as notas de orçamento e a consulta recusada (#819).
- **A agenda.** Um workflow fixo `conexus-workflow-poll`, registrado em código, e uma linha de
  agenda `schedule_poll-<w>` por workflow ligado com `SANKHYA_NEW`, com `inputData: { workflowId }`.
  O id fixo é um contrato guardado, como `AUTOMATION_WORKFLOW` (`builder/automations/run.ts:22-27`):
  renomeá-lo apaga as agendas em três voltas.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/sankhya/` | Muda (`operations/vendas.ts`, `operations/index.ts`: `orcamentosNovos`; `fake-sales.ts` ou `fake.ts`: as notas e a recusa) | `hub/connectors/` |
| `apps/server/src/builder/workflows/` | Cria `poll.ts`, `poll-tables.ts`; muda `schedule.ts` (as agendas de volta), `runs.ts` (a porta `TestInput`), `publish.ts` (a leitura de base ao ligar), `release.ts` | `builder/mastra/` |
| `apps/server/src/builder/mastra/mastra.ts`, `hub-mastra.ts` | Muda (o workflow fixo; no início, um workflow `ON` com `SANKHYA_NEW` sem agenda ganha a sua) | `main.ts` |
| `apps/server/migrations/`, `apps/server/database-grants.sql` | Cria `<ts>_e246_workflow_trigger` e `<ts>_e246_workflow_trigger_grants` | o catálogo |
| `apps/server/src/platform/catalog.test.ts` | Muda (o retrato do catálogo) | — |
| `docs/reference/boundaries.md` | Muda (a entrada "the trigger remembers what it has seen" passa a citar `poll.ts`) | a revisão |

### Os contratos que a unidade cria

- Tabelas (esquema `builder`, D11): `workflow_trigger(workflow_id uuid pk fk workflow on delete
  cascade, company_id text not null, since timestamptz null, last_lap jsonb null)`, com
  `SELECT, INSERT, DELETE, UPDATE (since, last_lap)`; `workflow_trigger_seen(workflow_id uuid fk
  workflow on delete cascade, company_id text not null, item_key text not null, run_id text null,
  seen_at timestamptz not null, baseline boolean not null, primary key (workflow_id, item_key))`,
  com `SELECT, INSERT, DELETE, UPDATE (run_id)`. `last_lap` é lido por `LastLap.parse` (C27).
- As regras do começo: `since` avança, a cada volta que deu certo, para a hora em que ela começou;
  a volta lê as notas com data de negociação desde o dia de `since` menos um; as vistas com
  `seen_at` de mais de dois dias antes de `since` saem na própria volta. A leitura de base, ao ligar
  e ao religar, grava as notas da janela com `baseline = true` e sem execução, e só então grava
  `since`; ligar e religar deixam `since` nulo, e uma volta com `since` nulo faz a leitura de base e
  não dispara.
- A volta: confere quem publicou (como `conferir`, e também a leitura do gatilho); lê; `INSERT …
  ON CONFLICT DO NOTHING RETURNING`; começa, até 20, as execuções das linhas sem `run_id` e sem
  `baseline` (`createRun({ runId: randomUUID() })`, grava `run_id`, `start({ inputData:
  QuoteInput })` na versão ativa `wf-<w>-v<n>`); avança `since`; limpa; grava `last_lap`. A
  entrada de cada execução traz o número da nota em `numero`; `item_key` é o número em texto.
- `TestInput` para `SANKHYA_NEW`: a nota mais recente dos tipos escolhidos, sem gravar vista.

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/server/src/builder` (`@mastra/core`: `mastra`,
`docs-workflows-scheduled-workflows.md` primeiro), para `apps/server/src` (`drizzle-orm`) e para
`packages/connectors` (as suas linhas e o padrão do kit, L27); [testing](../guides/testing.md) T20
e T26.

### A ordem do trabalho

1. `orcamentosNovos` no kit e o dublê (#819); a gravação T26 da leitura no Sankhya de verdade fica
   para o fundador, no fim.
2. As migrações com as permissões e o espelho (D11).
3. `poll.ts`: o workflow fixo, a leitura de base, a volta; a agenda ao ligar, pausar, religar e
   apagar (em `schedule.ts`); o início em `hub-mastra.ts`; `TestInput`.
4. A entrada de `boundaries.md`.

### Como se prova

Critérios 23 a 25, com o dublê e o relógio injetado. Falham hoje porque não há gatilho.

### Parar se

- A doc do `loadRecords` não deixar filtrar por tipo de operação e data juntos: relatar com a
  página; não usar `consultar` com SQL escrito pelo modelo.
- O campo do valor do orçamento ou do tipo de operação tiver outro nome na gravação do fundador:
  ajustar só o nome, e dizer no relatório.

## U5 O Construtor monta

**Base e modelo.** A U3 no `main`. Sonnet.

### As linhas da tabela

- O modelo é o Mastra Code: o desenho inteiro numa ferramenta que devolve os problemas
  (`mastracode/sdk/src/tools/workflows/save-workflow.ts:22-44`) e o catálogo inteiro numa chamada
  (`list-available-tools.ts:14-46`); o activepieces grava mesmo inválido e diz o que falta
  (`ap-build-flow.ts:148-165,194-215`). As ferramentas de hoje do Construtor:
  `builder/construtor/tools.ts:104-238` (presas a `InProject`, `:227`; a chave de tentativa é o
  `toolCallId`, `:85-93`; a recusa `{ kind: 'REFUSED', code, field? }`, `:73-83`). O texto:
  `builder/construtor/prompt/construtor.md` (a regra 8, "Nunca publique", `:13`). A lista fechada:
  `CONSTRUTOR_TOOL` (`packages/hub-api/src/construtor.ts:17-26`) e `AVAILABLE_TOOLS`
  (`construtor/construtor.ts:80-88,270-276`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/construtor/` | Cria `workflow-tools.ts`; muda `construtor.ts` (a porta `workflows`, preguiçosa como `automations`, `:101-107`) e `prompt/construtor.md` | o controlador do Construtor |
| `packages/hub-api/src/construtor.ts` | Muda (as quatro ids em `CONSTRUTOR_TOOL`; `WorkflowRef`) | a web |
| `apps/web/src/builder/conversation/construtor-specs.ts` | Muda (a linha de cada ferramenta: ícone, frase, "N balões, M problemas") | a conversa |

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

- `workflow_catalog({})` → `{ triggers, connections: [{ connectionId, name, reads: [{ operation,
  label, summary, allowed, input }], writes: [mesma forma] }], agents: [{ agentId, name,
  activeVersion, writes: boolean }], people: [{ personId, name, role }], balloonKinds: [{ kind,
  outputFields }] }`, do lugar do Projeto, com `allowed: false` no que o papel de quem conversa não
  usa.
- `workflow_read({ workflowId })` → `WorkflowRef` (`SAVED`).
- `workflow_save({ workflowId: WorkflowId | null, revision, draft: WorkflowDraft })` →
  `WorkflowRef`: `SAVED` com os problemas; `STALE` com o atual; `REFUSED` só quando o esquema
  recusa. `null` cria no Projeto, com a chave de tentativa do `toolCallId`.
- `workflow_test({ workflowId })` → `TestResult` (U3).
- Nenhuma ferramenta publica, apaga ou pausa.
- O laço de conserto tem teto: o texto do Construtor manda parar depois de 3 `workflow_save`
  seguidos que ainda voltam com problema `ERROR` e perguntar à pessoa (`ask_user`); a ferramenta
  conta as tentativas da conversa e, na quarta seguida com `ERROR`, responde `REFUSED` com
  `WORKFLOW_HAS_PROBLEMS` sem gravar, para que o teto não dependa só do texto.

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/server/src/builder` (`@mastra/core`: `mastra`,
`createTool`) e `ai` (`node_modules/ai/docs/`), e [security](../guides/security.md) para o que o
modelo não escolhe (S7, S8, S9: a empresa, o Projeto e a pessoa vêm da conversa).

### A ordem do trabalho

1. As quatro ids e `WorkflowRef` em `hub-api`; as linhas em `construtor-specs.ts`.
2. `workflow-tools.ts`, chamando as portas da U1 (gravar, ler) e da U3 (testar, `TestResult`).
3. O texto: ler o catálogo primeiro; gravar o rascunho inteiro; ler `problems` e consertar cada
   um antes de dizer que terminou, no máximo 3 gravações seguidas com `ERROR`, depois perguntar; perguntar (`ask_user`) os tipos de operação, quem aprova, quem
   avisa, o valor; nunca inventar um tipo de operação, uma pessoa ou uma operação; um `WRITE` só se
   a pessoa pediu, e em **Pergunta antes** salvo ela dizer outra coisa; nunca publicar.

### Como se prova

Critérios 26 e 27.

### Parar se

- O modelo de verdade não escrever o `IF` com o ramo em três tentativas da avaliação: relatar com as
  saídas; não achatar o contrato sem o cartão.

## U6 O canvas

**Base e modelo.** A U3 no `main` e o PR 841 no `main`. Sonnet.

### As linhas da tabela

- **A casca.** Mastra `packages/playground-ui/.../workflow-graph-canvas.tsx:91-124` (só leitura,
  `nodesDraggable=false` em `:100`); activepieces `flow-canvas/index.tsx:215-258` (`@xyflow/react`
  12.3.5, `nodeTypes` e `edgeTypes` fora do componente, `fitView` uma vez). Opções: `minZoom 0.5`,
  `maxZoom 1.5`, `nodesConnectable={false}`, `nodesDraggable` só num rascunho, `deleteKeyCode={null}`,
  `panOnScroll`, `ariaLabelConfig` em português; zoom e ajustar em três `Button`; sem `MiniMap`; a
  folha de estilo do `@xyflow/react` importada como arquivo do app.
- **O layout.** activepieces `utils/layout-consts.ts:13-57`: cartões de tamanho fixo, espaço
  vertical fixo, o ramo recuado; uma função pura que devolve x e y de cada balão e de cada encaixe,
  sem medir o DOM. Sem `dagre`.
- **O balão.** Mastra `workflow-step-card-view.tsx:19-72,107,174` (`data-state`, `role=status`);
  activepieces `step-node/index.tsx:72-239`; as alças escondidas.
- **O "+".** activepieces `edges/add-button.tsx:19-132` (`EdgeLabelRenderer`, `nodrag nopan`).
- **Arrastar.** activepieces arrasta para um encaixe; no xyflow, `onNodeDragStop` e o encaixe mais
  perto, depois o layout de novo; o mesmo pelo teclado em **Mover para cima / para baixo**. Mover é
  gravar o rascunho inteiro pela rota da U1 (`PUT …/draft` com a `revision`): o servidor revalida e
  o canvas mostra os problemas que a nova ordem criou; a web nunca decide sozinha se a ordem serve.
- **O painel.** n8n `NodeDetailsView.vue:799-880`; Mastra `workflow-data-inspector.tsx:13-34` (Esc
  fecha e devolve o foco).
- **A execução acesa.** Mastra `use-persisted-workflow-run.ts:10-23`: `refetchInterval` de 5 s
  enquanto não terminou (TanStack Query, W10).
- **Os problemas.** Dify `header/checklist/index.tsx`; activepieces `incomplete-settings-widget.tsx:10-45`.
- **O cartão.** PR 841: `apps/web/src/builder/conversation/approval-card.tsx` (199 linhas) e
  `approval-item`, `approval-fields`, `approval-text`.
- **Ao lado do Construtor.** `apps/web/src/builder/agents/construtor-chat.tsx:57-139` (`openAgent`
  `:76-83`, `Beside` `:93-103`); `builder/conversation/tool-row.tsx:238-254,293`;
  `builder/conversation/room.ts:38-40`.
- **A lista.** `apps/web/src/builder/automations/automations.tsx`, `runs.tsx`.

**As peças**, em `apps/web/src/builder/workflows/`:

| Peça | Segue | Componentes do `ui/` | Arquivo |
| --- | --- | --- | --- |
| A casca: zoom, mover, encaixar ao abrir, só leitura numa execução | Mastra `workflow-graph-canvas.tsx:91-124`; activepieces `flow-canvas/index.tsx:215-258` | `Button`, `Tooltip`, `ResizablePanelGroup`; no celular, `Sheet` | `canvas.tsx` |
| O grafo a partir dos balões | activepieces `createStepGraph`, `buildRouterChildGraph` | — | `graph.ts`, `model.ts` |
| O layout | activepieces `layout-consts.ts` | — | `layout.ts` |
| O balão: ícone e palavra da espécie, título, quem, estado | Mastra `workflow-step-card-view.tsx:19-72`; activepieces `step-node/index.tsx` | `Card`, `Badge`, `Trace` | `balloon.tsx`, `balloon-node.tsx`, `kinds.ts` |
| A ligação com o "+" | activepieces `edges/add-button.tsx:19-132` | `Button`, `Popover` | `add-edge.tsx` |
| O "Se" com o ramo "se sim" | Mastra `cards/condition`; activepieces `branch-label.tsx` | `Badge` | `branch.tsx` |
| O painel: quem é, o que recebe, o que devolve | n8n NDV; Mastra `workflow-data-inspector.tsx` | `Sheet`, `ResizablePanel`, `Tabs`, `CodeBlock` | `panel.tsx` |
| A execução acesa | Mastra `use-persisted-workflow-run.ts:10-23`; Dify a borda por estado | `Badge` (palavra e ponto), `TraceLine` | `run-state.ts`, `run-view.tsx` |
| A lista de execuções | 24.2 `automations/runs.tsx` | `List`, `Badge`, `Pager` | `runs-list.tsx` |
| Os problemas | Dify checklist; activepieces `incomplete-settings-widget.tsx` | `Popover`, `List`, `Badge` | `problems.tsx` |
| O gatilho | activepieces `trigger-widget.tsx` | `Balloon` | `trigger.tsx` |
| O **Aprovar?** | Mastra `workflow-suspended-overlay.tsx`; o cartão da 24.5 | o cartão da 24.5 | `approval.tsx` |
| O arrastar para outro encaixe | activepieces (dnd-kit, `useDraggable`) | — | dentro de `canvas.tsx` |
| No celular | o mesmo modelo em coluna | `List`, `Collapsible` | `train.tsx` |
| A página, as consultas, as rotas | W8, W10, W17 | `Frame`, `Block` | `page.tsx`, `queries.ts`, `public.ts` |

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/workflows/` | Cria as peças acima e os seus testes | as rotas, `construtor-chat.tsx`, `automations/` |
| `apps/web/src/builder/conversation/approval*` | Muda (`approval-card.tsx`, `approval-item`, `approval-fields`, `approval-text` do PR 841: a peça sem fonte; o adaptador da conversa) | a conversa, `workflows/approval.tsx` |
| `apps/web/src/builder/conversation/room.ts`, `tool-row.tsx`, `tool-row.test.tsx` | Muda (`openWorkflow`; um `WorkflowRef` abre o canvas) | `construtor-chat.tsx` |
| `apps/web/src/builder/agents/construtor-chat.tsx`, `construtor-chat.test.tsx` | Muda (uma coisa aberta: agente ou workflow) | a rota do Construtor |
| `apps/web/src/builder/automations/` | Muda (`automations.tsx`, `queries.ts`, `text.ts`: os workflows na lista) | as rotas |
| `apps/web/src/routes/_app/companies/$companyId/projects/` | Cria `$projectId_.workflows.$workflowId.tsx` e `$projectId_.workflows.$workflowId.runs.$runId.tsx` | o roteador |
| `apps/web/src/routeTree.gen.ts` | Muda (gerado) | o roteador |
| `apps/web/package.json`, `package-lock.json` | Muda (`@xyflow/react` 12.12.x; `package-lock.json` é o da raiz) | — |
| `docs/reference/stack.md` | Muda (a linha do `@xyflow/react`, no mesmo PR) | `check-docs` |
| `docs/reference/screens.md` | Muda | a revisão |
| `tests/e2e/` | Cria `workflow-canvas.test.ts` | — |

### Os contratos que a unidade cria

- `apps/web/src/builder/workflows/model.ts`: `type CanvasNode = { kind: 'TRIGGER' } | { kind:
  'BALLOON'; balloon: LeafBalloon | IfBalloon; lane: 'MAIN' | BalloonId } | { kind: 'SLOT'; lane:
  'MAIN' | BalloonId; index: number }`; `layout(draft: WorkflowDraft): { nodes: Positioned[]; edges:
  Edge[] }`, pura e determinística.
- `run-state.ts`: `balloonStateWord(state: BalloonState): string` (esperando, rodando, feito, falhou,
  esperando você, pulado) e o tom do `Badge`; o estado é palavra e ponto, nunca só cor (V35).
- `queries.ts`: `workflowQuery`, `runQuery` com `refetchInterval: (q) => terminal(q.state.data) ?
  false : 5000`, `runsQuery`, `workflowsQuery`; as mutações `saveDraft`, `publish`, `answer`,
  `retry`, `pause`, `resume`, `run`.
- O cartão de aprovação: `ApprovalCard` (a peça: a ação, os campos, o aviso de escrita aberta,
  **Aprovar** e **Recusar**, recebendo `onAnswer`) e dois adaptadores, `ConversationApproval` (o
  de hoje) e `RunApproval` (`answer` da U3).
- A linha nova de `docs/reference/stack.md`: `@xyflow/react` | `apps/web/src/builder/workflows` |
  `reactflow.dev/llms.txt`; README | none | Mastra fork `packages/playground-ui` `workflow-graph-canvas.tsx`;
  activepieces `flow-canvas` (`f34c43cd`, a referência fixa 12.3.5) | W22, decisão F | a folha de
  estilo é um arquivo do app; a atribuição fica como a licença diz.

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/web/src` (`react`, `@tanstack/react-router`: as
skills `router-core`; `@tanstack/react-query`; `react-hook-form`), `apps/web/src/ui` (`@base-ui/react`,
`@shadcn/react`: a skill `shadcn`), `apps/web` (`vitest`, `@testing-library/react`, `msw`),
`tests/e2e` (`playwright-core`: a skill `playwright-cli`); [Impeccable](../reference/impeccable.md)
para a tela; [web](../guides/web.md) W8, W10, W17, W18, W22, W34.

### A ordem do trabalho

1. **A prova de CSP, antes de tudo.** Instalar `@xyflow/react` 12.12.x, montar uma página mínima
   com três balões servida pelo Hub de verdade, abrir no Chromium sem cabeça e ler o console ao
   abrir, arrastar e dar zoom: zero violações (critério 28, W22). Se houver uma, parar e voltar ao
   fundador com `F1`; não relaxar a CSP. A linha de `stack.md` no mesmo PR.
2. As capturas das referências a 1280 e 390 px.
3. `model.ts`, `graph.ts`, `layout.ts`, com os testes, sem DOM.
4. `balloon.tsx`, `kinds.ts`, `branch.tsx`, `trigger.tsx`, `train.tsx` (o celular).
5. `canvas.tsx` com `add-edge.tsx` e o arrastar; `panel.tsx`; `problems.tsx`.
6. O cartão dividido (os testes do PR 841 passam sem mudar), `approval.tsx`, `run-state.ts`,
   `run-view.tsx`, `runs-list.tsx`, as rotas.
7. Ao lado do Construtor (`room.ts`, `tool-row.tsx`, `construtor-chat.tsx`); a lista de
   Automações; `screens.md`.

### Como se prova

Critérios 28 a 36, e a QA da etapa (testing T25) pelo roteiro, a 1366 e a 390 px, nos dois temas.

### Parar se

- A prova de CSP mostrar uma violação: parar e voltar ao fundador com `F1`.
- O toque a 390 px não mover o canvas, ou o canvas e a conversa não caberem a 1366 px: relatar com
  as capturas.
- O fluxo precisar de laço, de passos em paralelo, de um ramo dentro de outro ou de posição livre:
  ficam de fora; relatar.
