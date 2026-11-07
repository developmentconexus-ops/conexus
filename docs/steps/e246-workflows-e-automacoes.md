# Etapa 24.6: Workflows e automações

O roteiro chama esta etapa de "24.6 Workflows e automações. Monta conversando o fluxo do orçamento
do Sankhya e o vê como trem de balões", com "Workflows dinâmicos do Mastra. Seu orçamento é o
aceite", e na linha 71 "Sai: o pg-boss; a agenda do Mastra, gatilho de toda automação, e os
workflows o substituem". Ela vem depois da 24.5 e se apoia nela: um balão que escreve passa pelo
mesmo funil de escrita, o mesmo registro de envios e a mesma chave **Pergunta antes / Faz
sozinho**. Cada linha citada foi lida no `main` em `62234c74`, com `@mastra/core` 1.82.0,
`@mastra/pg` 1.35.0 e `@mastra/server` 1.82.0. A 24.5 U3 (as telas, pull request 841) ainda não
estava no `main`; a U4 desta etapa reabre os seus arquivos no `main` do dia. O construtor de cada
unidade reabre as linhas no `main` do dia.

## A página do fundador

**No fim desta etapa** você monta, conversando com o Construtor dentro de um Projeto, o fluxo do
orçamento: quando um orçamento novo entra no Sankhya, o Conexus lê o cliente, um agente faz a
triagem, e acima de um valor ele pede a sua aprovação antes de avisar o vendedor. Você vê o fluxo
ao lado da conversa como um trem de balões, publica, e depois vê cada execução com os balões
acesos, aprova a que espera você e tenta de novo a que falhou.

**O roteiro de uso.** Você é a Ana (dona). A ligação do Sankhya está liberada ao Projeto
"Compras", e o agente "Triagem de orçamento" está publicado nele, só com leituras.

1. No Projeto "Compras", abra o Construtor e escreva "quando lançar um orçamento no Sankhya, quero
   que o agente Triagem veja se o cliente está bom; acima de R$ 20 mil, me pede para aprovar antes
   de avisar o vendedor". Ao lado da conversa aparece **Workflow: Orçamento lançado**, marcado
   "rascunho", com os balões: **Gatilho** (a cada 15 min, orçamentos novos no Sankhya), **Ler o
   cliente**, **Triagem de orçamento** (agente), **Valor acima de R$ 20.000?** com **Aprovar?
   (Ana)** recuado embaixo, e **Avisar**. Se faltar algo (qual tipo de operação é orçamento, quem
   avisar), o Construtor pergunta antes de montar.
2. Escreva "testa com o último orçamento". O trem acende balão por balão sobre o orçamento mais
   recente, e no fim o Construtor diz o que cada balão fez. Nada é avisado a ninguém num teste.
3. Toque **Publicar**. O workflow aparece em Automações do Projeto, ligado. Lance um orçamento de
   teste no Sankhya, acima de R$ 20.000. Em até 15 minutos o sino mostra "O workflow Orçamento
   lançado espera sua aprovação". Abra: a execução mostra os balões já feitos em verde, a triagem
   com o texto do agente, e o cartão **Aprovar?** com o orçamento. Toque **Aprovar**: o balão
   **Avisar** acende e a pessoa escolhida recebe o aviso.
4. Peça ao Construtor "acima de R$ 50 mil em vez de 20". O trem mostra a mudança como rascunho; a
   versão publicada continua rodando até você publicar de novo, e uma execução que já esperava
   sua aprovação continua na versão em que começou.
5. Tire do agente "Triagem" a leitura que ele usa e publique-o. A execução seguinte para no balão
   da triagem, em vermelho, com o motivo. Devolva a leitura, publique o agente, e na execução toque
   **Tentar de novo deste balão**: ela termina sem ler o cliente de novo.
6. Em Automações, pause o workflow. Nenhum orçamento novo dispara enquanto ele está pausado; ao
   religar, só os orçamentos lançados depois de religar disparam.

**O que você faz, e quando.** Antes: diz **o gatilho do Sankhya** (a decisão B): quais tipos de
operação (TOP) são orçamento na sua empresa, em qual ligação, e de quanto em quanto tempo olhar.
No começo: responde às decisões abaixo e aprova esta página. No fim: faz o roteiro no Sankhya de
verdade da sua empresa, diz o que viu e aprova os textos das telas.

**O que o estudo mostrou** (2026-11-07, com modelo de mentira e Postgres local, sem chamar nada
de fora).

- **O Mastra guarda um workflow montado na hora e o carrega de novo depois de um reinício.** É o
  "workflow dinâmico" do roteiro (no Mastra 1.82, marcado Beta). Medido: montado de uma lista, ele
  roda, fica no banco, e um processo novo o encontra sozinho.
- **Uma aprovação no meio do workflow sobrevive a um reinício do Conexus.** Medido: o workflow
  parou esperando, o processo morreu, outro processo o retomou com a aprovação e terminou. Na
  conversa da 24.5 é diferente: lá o cartão some num reinício.
- **Um agente que pergunta antes de escrever trava dentro de um workflow.** Medido: o passo nunca
  termina. Por isso, num workflow, o agente só lê e analisa; uma escrita é um balão próprio, com
  a sua própria aprovação.
- **O Mastra não tem versão de workflow.** Medido: se o mesmo workflow muda, uma execução que
  esperava continua no desenho novo, até com um passo novo antes do que esperava. Por isso cada
  publicação é uma versão própria, como os agentes, e a execução fica na versão em que começou.
- **O Sankhya não avisa sozinho.** A documentação do Sankhya não tem webhook. O gatilho é o
  Conexus olhar de tempos em tempos os orçamentos novos, como fazem Zapier, Make, n8n,
  activepieces e Pipedream, e lembrar quais já viu.
- **O pg-boss nunca foi instalado.** A 24.2 já usa a agenda do Mastra; o que sai é só o texto que
  ainda fala dele, no fechamento.
- **Montar conversando é o que os produtos fazem.** Zapier (Copilot), Make (Maia), n8n (AI
  Workflow Builder), activepieces (pelo MCP) e o Mastra Code: o modelo escreve a lista de passos
  inteira numa ferramenta que confere e devolve os problemas. O construtor de workflows do Studio
  do Mastra é da licença Enterprise, que não permite uso em produção; o Conexus não o usa.

**Fica de fora.**

- **Mudar as Automações da 24.2.** Elas continuam como estão (um horário e uma pergunta ao
  Assistente) e aparecem na mesma tela Automações, ao lado dos workflows.
- **Um agente que escreve dentro de um workflow.** Pelo travamento medido; a escrita é um balão.
- **Gravar uma linha num app** ("linha no app Orçamentos" do esboço). É a escrita dos apps, a
  antiga 20.1, que vem depois.
- **Avisar o vendedor do Sankhya pelo código dele.** O balão **Avisar** avisa uma pessoa da
  empresa escolhida no balão; ligar o vendedor do Sankhya a uma pessoa do Conexus vem depois.
- **Laços, passos em paralelo, esperar um tempo, outros gatilhos** (webhook de um fornecedor, um
  e-mail). O Mastra tem; entram quando um fluxo seu pedir. Webhooks são a 20.2.
- **O Membro pedir para publicar um workflow.** Hoje só Dono, Administrador e Desenvolvedor
  montam automações (`manageAutomations`); o pedido do Membro é o mesmo da 24.3.4 e vem depois.
- **Os avisos guardados para um cartão** (`next-card`): esta etapa leva o #754 (o teste do
  agendador espera o minuto do relógio de verdade) e o #819 (o dublê do Sankhya recusa o SQL do
  dialeto), porque o gatilho usa os dois; nenhum outro toca workflows ou automações.

**As decisões suas nesta etapa.**

- **A. Quem é o dono do workflow, e quem aprova?** (a sua H3 de 2026-11-02: "a decisão do dono
  do workflow").
  - `A1` (recomendada): quem publica é o dono. O workflow lê e escreve com o papel dele, como o
    agente publicado (a sua `C1`), e cada execução confere o papel de novo: se ele perdeu a
    permissão, o workflow pausa, como a automação da 24.2 já faz. Cada balão **Aprovar?** nomeia
    uma pessoa, por padrão quem publicou, que precisa ter a operação no papel na hora de aprovar.
    Caso real: o "Request Approval" do Zapier e o "Human Input" do Dify escolhem quem responde no
    próprio passo; Copilot Studio e Agentforce dão ao agente a autoridade de quem o montou.
    Exemplo: o Desenvolvedor Bruno publica o fluxo e põe a Ana no **Aprovar?**. Objetivo: um dono
    só, e o aprovador visível no balão. Nativo: a ferramenta do balão suspende o workflow
    (`context.workflow.suspend` do Mastra), e só a pessoa do balão o retoma.
  - `A2`: aprova qualquer pessoa de um papel escolhido no balão (por exemplo, Administradores).
    Caso real: a lista de aprovadores do Zapier aceita vários e-mails. Mais pessoas veem, e a
    primeira resposta vale.
  - `A3`: só quem publicou aprova, sempre. Mais simples, mas o esboço já punha "Aprovar? (Ana)"
    para outra pessoa.
- **B. O gatilho do Sankhya.** Pela documentação lida, o Sankhya não chama ninguém quando um
  orçamento entra.
  - `B1` (recomendada): o Conexus olha de tempos em tempos as notas novas dos tipos de operação de
    orçamento que você disser, só lendo, e lembra cada uma pelo número único (`NUNOTA`) numa tabela
    nova do Conexus, para nunca disparar duas vezes o mesmo orçamento. Ao ligar, só valem os
    orçamentos lançados dali em diante. Nada para ligar no seu Sankhya. Caso real: activepieces
    guarda a última olhada e começa no "agora" ao ligar; n8n guarda o "última vez que olhei";
    Zapier e Pipedream lembram pelo `id`. Exemplo: TOP 999 "Orçamento de venda", na ligação
    "Sankhya matriz". Objetivo: funcionar sem mexer no seu Sankhya. Como: a agenda do Mastra
    (nativa) dispara a leitura; a tabela que lembra os vistos é do Conexus, porque o Mastra não
    guarda cursor de gatilho (é um remendo, e esta escolha é a sua palavra para ele).
  - `B2`: usar o log de alterações do Sankhya (`logAlteracoesTabelas`). Precisa ligar o parâmetro
    LOGTABOPER nas preferências do Sankhya Om, guarda só de 3 a 7 dias, e diz "mudou", não
    "nasceu": uma segunda leitura separa o novo do editado. Mais leve para o Sankhya, mais coisa
    para ligar.
  - `B3`: um add-on Java no Sankhya chama um endereço do Conexus. Precisa de quem programe no
    Sankhya (o Add-on Studio) e de webhooks no Conexus, que são a 20.2.
  - **E diga**: quais TOP são orçamento, e em qual ligação.
- **C. De quanto em quanto tempo olhar, e o banco acordado.** Cada olhada acorda o banco do Hub
  (regra D27; o Neon dorme depois de alguns minutos parado). A decisão 0009 diz que, acordado o
  tempo todo, o plano grátis acaba perto do dia 17 do mês.
  - `C1` (recomendada agora): a cada 15 minutos, no plano grátis. É o padrão do Make e do
    Pipedream e o do plano grátis do Zapier. O banco acorda 96 vezes por dia e dorme entre elas
    (estimado, não medido no Neon).
  - `C2`: a cada 5 minutos, como no esboço, com o plano Launch do Neon (cerca de US$ 19,35 por
    mês, a sua `D1` da 24.2). Zapier pago olha a cada 2 minutos.
  - `C3`: a pessoa escolhe no balão (5, 15, 30 ou 60 minutos), e o plano segue o menor que estiver
    ligado.
- **D. Um "Aprovar?" que ninguém responde.**
  - `D1` (recomendada): espera sem prazo, como o cartão da 24.5, e aparece em Automações como
    "Esperando aprovação", com o sino e o e-mail na hora em que começa a esperar.
  - `D2`: vence em 3 dias (o padrão do Dify; o Zapier deixa escolher) e a execução termina como
    "Não aprovado", sem fazer o resto.
- **E. Um balão que escreve no Sankhya entra já nesta etapa?**
  - `E1` (recomendada): entra. Qualquer escrita do kit que o seu papel usa (hoje **Lançar
    pedido**) vira um balão com a chave **Pergunta antes** (já escolhida) ou **Faz sozinho**, a
    mesma da 24.5: em **Pergunta antes** o workflow espera o **Aprovar** da pessoa do balão; em
    **Faz sozinho** só publica quem tem **Publicar agente que escreve sozinho**. O envio passa pelo
    mesmo funil e pelo mesmo registro, e **Tentar de novo** nunca manda duas vezes. Exemplo: depois
    da aprovação, "lançar o pedido a partir do orçamento". Objetivo: a escrita igual em toda a
    plataforma. Custa cerca de 400 linhas.
  - `E2`: fica para a etapa da escrita dos apps. O fluxo do orçamento desta etapa só lê, analisa,
    pede aprovação e avisa.
- **F. Como o trem aparece.** As referências divergem no que a pessoa vê.
  - `F1` (recomendada): cartões em coluna ligados por setas, como no esboço 5 e no editor do
    Zapier; um ramo "se sim" aparece recuado embaixo do balão da pergunta; no celular, a mesma
    coluna. Cada balão mostra o seu estado na execução (esperando, rodando, feito, falhou,
    esperando você, pulado). Você muda conversando, não arrastando.
  - `F2`: uma tela de nós e setas que se arrasta, como o n8n, o activepieces e o Studio do Mastra
    (`@xyflow/react`). Serve melhor a laços e passos em paralelo, que ficam de fora agora, e pede
    outro desenho no celular.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 O workflow como dado | O contrato dos balões; as tabelas `workflow` e `workflow_version` e a migração; a compilação de uma versão para a definição dinâmica do Mastra e o `addDynamicWorkflow` ao publicar; as cinco ferramentas do Conexus (`conexus-ler`, `conexus-agente`, `conexus-aprovar`, `conexus-escrever`, `conexus-avisar`) registradas no `Mastra`; quem fala `WORKFLOW` no funil de escrita e a chave execução e balão no registro de envios, com a migração e as permissões (D11); as rotas do rascunho, de publicar e de apagar | `packages/hub-api/src/workflows.ts`, `apps/server/src/builder/workflows/`, `apps/server/src/builder/mastra/`, `apps/server/src/hub/connectors/`, `apps/server/migrations/`, `apps/server/database-grants.sql` | [data](../guides/data.md) | esta página aprovada; 24.5 U1 e U2 no `main` |
| U2 O gatilho e as execuções | O gatilho dos orçamentos novos (a leitura nova do kit, o workflow fixo `conexus-workflow-poll`, a tabela dos vistos), a agenda por versão publicada, pausar e religar; uma execução por orçamento; a lista de execuções e o estado de cada balão pelo retrato do Mastra; aprovar e recusar (retomar); **Tentar de novo deste balão** (`timeTravel`); a execução cortada por um reinício; o teste com o último orçamento; a tela Automações com as duas espécies na rota de lista | `apps/server/src/builder/workflows/`, `apps/server/src/builder/automations/`, `packages/connectors/src/sankhya/`, `packages/hub-api/src/{workflows,automations}.ts`, `apps/server/migrations/`, `apps/server/database-grants.sql` | [testing](../guides/testing.md) | U1 |
| U3 O Construtor monta | As ferramentas do Construtor para workflows (o catálogo, gravar o rascunho inteiro com os problemas pelo caminho, testar), o texto do Construtor, perguntar quando falta | `apps/server/src/builder/construtor/` | [security](../guides/security.md) | U1; U2 para testar |
| U4 As telas | O trem de balões ao lado da conversa do Construtor e na página do workflow; a página da execução com os balões acesos e o cartão **Aprovar?**; **Publicar**, **Pausar**, **Tentar de novo deste balão**; o workflow na lista de Automações; o sino | `apps/web/src/builder/workflows/` (novo), `apps/web/src/builder/{automations,agents}/`, `apps/web/src/routes/_app/companies/$companyId/projects/`, `docs/reference/screens.md` | [web](../guides/web.md) | U1, U2 |

Correm em fila: U2 começa pelo contrato da U1; U3 e U4 correm juntas depois da U2, porque não
dividem pasta.

**O método das unidades.** Cada unidade segue o `pstack:poteto-mode` como as skills do repositório
já o chamam ([`conexus-scope`](../../.agents/skills/conexus-scope/SKILL.md), passo 4;
[`conexus-build`](../../.agents/skills/conexus-build/SKILL.md)). O cartão não repete o método.

**Orçamento de código alterado.** U1: ~1.250 (o contrato, as tabelas e as duas migrações, a
compilação, as cinco ferramentas, quem fala `WORKFLOW` no funil, as rotas). U2: ~1.000 (a leitura
nova do kit e o seu dublê, o gatilho e a tabela dos vistos, a agenda, as execuções, aprovar,
tentar de novo, o reinício, o teste, a lista). U3: ~450. U4: ~1.100. Total da etapa: ~3.800,
dentro da regra L2 (estimado pela leitura, sem protótipo). Com a decisão `E2`, a U1 perde ~400.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `PUT …/projects/{p}/workflows/{w}/draft` com uma lista de balões válida grava o rascunho e devolve a lista; uma lista inválida (um balão `READ` com operação que não é leitura, um `AGENT` de agente de outro Projeto, uma referência `{{b9.texto}}` a um balão que não vem antes, um `APPROVAL` sem pessoa) responde `REQUEST_MALFORMED` com cada problema e o seu caminho (`balloons.2.input`), e não grava | `builder/workflows/routes.test.ts` (novo), "o rascunho" | must |
| 2 | U1 | `POST …/workflows/{w}/publish` grava a versão `n+1`, chama `addDynamicWorkflow` com o id `wf-<w>-v<n+1>`, e a linha aparece em `mastra.mastra_workflow_definitions` com `status = 'active'`; a versão `n` continua `active`; publicar de novo o mesmo rascunho sem mudança responde `ok` com a mesma versão | `builder/workflows/publish.test.ts` (novo), "publicar" | must |
| 3 | U1 | Recusa ao publicar: quem não tem `manageAutomations` recebe `NOT_IN_ROLE`; um balão com uma operação fora do papel de quem publica dá `NOT_IN_ROLE` com a operação; um `AGENT` cuja versão publicada tem uma escrita dá `AGENT_WRITES`; um `WRITE` em **Faz sozinho** por quem não tem `agent: publishUnattendedWrite` dá `NOT_IN_ROLE`; uma ligação não liberada ao Projeto dá `NOT_GRANTED`; nada se grava e nada vai ao Mastra | `publish.test.ts`, "a publicação recusada" | must |
| 4 | U1 | Depois de um reinício (um Hub novo ao lado do mesmo banco, por `hubBeside`), cada versão publicada está no `Mastra` de novo (`getWorkflowById('wf-<w>-v<n>')`) sem código do Conexus a registrar: o `startWorkers()` a recarrega | `publish.test.ts`, "depois do reinício" | must |
| 5 | U1 | O balão `READ` lê pelo `readThrough` com o papel de quem publicou: o dublê recebe a leitura e o balão devolve as linhas; tirar a operação do papel dele faz o balão seguinte falhar com `NOT_IN_ROLE` e a execução parar nele, `failed` | `builder/workflows/tools.test.ts` (novo), "ler" | must |
| 6 | U1 | O balão `AGENT` abre uma conversa nova do agente marcada "Workflow", manda o texto do balão com as referências trocadas pelos valores, e devolve o texto final; com o modelo de mentira, a conversa existe na lista do agente com a marca | `tools.test.ts`, "o agente" | must |
| 7 | U1 | O balão `APPROVAL` suspende a execução com a pessoa e a pergunta; a execução fica `suspended` em `mastra_workflow_snapshot`; nenhum balão depois dele roda | `tools.test.ts`, "aprovar espera" | must |
| 8 | U1 | O balão `WRITE` em **Pergunta antes** suspende antes de enviar, e o dublê não recebe nada; retomado com `approved: true` envia uma vez pelo `writeThrough` com quem fala `WORKFLOW` e a chave da execução e do balão, e a linha de `connector_write` guarda o workflow, a versão, a execução e o balão; em **Faz sozinho** envia sem suspender; o mesmo balão da mesma execução rodado de novo (`timeTravel`) não envia e devolve o que o registro diz, `codigoPedido` ou `WRITE_UNCERTAIN`; uma linha com conversa e uma com execução na mesma tabela nunca se confundem | `hub/connectors/write.test.ts`, "o workflow escreve"; `tools.test.ts`, "escrever" | must (só com `E1`) |
| 9 | U2 | O gatilho: a primeira volta depois de publicar não dispara nada e marca o começo; o dublê com três orçamentos novos dos tipos escolhidos dá três execuções, cada uma com o seu `NUNOTA` na entrada; a volta seguinte, com os mesmos três e um novo, dá uma execução; uma nota de outro tipo não dispara; mais de 20 novos numa volta disparam 20 e o resto na volta seguinte | `builder/workflows/trigger.test.ts` (novo), "orçamentos novos" | must |
| 10 | U2 | Duas voltas do gatilho ao mesmo tempo para o mesmo workflow dão uma execução por orçamento (a chave primária de `workflow_trigger_seen`); o Sankhya fora numa volta (`UNREACHABLE`) não avança o começo, imprime `WORKFLOW_TRIGGER_FAILED` e a volta seguinte acha os mesmos orçamentos | `trigger.test.ts`, "duas voltas" e "o Sankhya fora" | must |
| 11 | U2 | Pausar o workflow pausa a sua linha de agenda e nenhuma volta roda; religar marca um começo novo, e um orçamento lançado durante a pausa não dispara; apagar o workflow apaga a agenda, arquiva as versões no Mastra e responde `WORKFLOW_NOT_FOUND` depois | `builder/workflows/routes.test.ts`, "pausar, religar, apagar" | must |
| 12 | U2 | `GET …/workflows/{w}/runs` devolve as execuções de todas as versões, 20 por página, cada uma com a versão, o orçamento, o estado e o estado de cada balão (`waiting`, `running`, `success`, `failed`, `suspended`, `skipped`) lido do retrato do Mastra | `builder/workflows/runs.test.ts` (novo), "a lista" | must |
| 13 | U2 | `POST …/runs/{r}/approval` com `approved: true` pela pessoa do balão retoma a execução e o balão seguinte roda; com `approved: false` a execução termina "Não aprovado" e nada depois roda; uma segunda resposta responde `RUN_NOT_WAITING`; outra pessoa recebe `NOT_APPROVER`; a pessoa do balão sem a operação no papel naquela hora recebe `NOT_IN_ROLE`; uma execução que espera continua esperando depois de um reinício, e a resposta depois dele funciona | `runs.test.ts`, "aprovar" | must |
| 14 | U2 | `POST …/runs/{r}/retry` com o balão que falhou retoma a execução daquele balão (`timeTravel`) sem rodar de novo os anteriores (o dublê conta uma leitura do cliente); numa execução que não falhou responde `RUN_NOT_FAILED` | `runs.test.ts`, "tentar de novo" | must |
| 15 | U2 | Uma execução `running` de antes do início do Hub aparece "Interrompida", e **Tentar de novo** a retoma do balão em que estava | `runs.test.ts`, "a interrompida" | must |
| 16 | U2 | Cada execução confere o papel de quem publicou: se ele perdeu `manageAutomations`, a execução termina "Pausada porque quem publicou não pode mais" e a agenda pausa, como `run.ts:189-219` | `trigger.test.ts`, "o dono perdeu o papel" | must |
| 17 | U2 | O teste com o último orçamento roda o rascunho como `wf-<w>-teste` sobre o orçamento mais recente dos tipos escolhidos; o balão `NOTIFY` não avisa ninguém, um `WRITE` sempre espera **Aprovar** mesmo em **Faz sozinho**, e o teste não entra na lista de execuções | `runs.test.ts`, "o teste" | must |
| 18 | U2 | `GET …/automations` devolve as Automações da 24.2 e os workflows com gatilho, numa lista só, cada item com a sua espécie; as rotas da 24.2 respondem como hoje | `builder/automations/routes.test.ts` (os casos de hoje passam sem mudar), "com os workflows" | must |
| 19 | U3 | O Construtor tem `workflow_catalog` (as leituras e escritas que o papel de quem conversa usa nas ligações do Projeto, os agentes publicados do Projeto sem escrita, as pessoas da empresa) e `save_workflow_draft` (a lista inteira; os problemas voltam pelo caminho, como no critério 1); com o modelo de mentira, um pedido completo grava o rascunho, e um pedido sem tipo de operação faz o Construtor perguntar sem gravar | `builder/construtor/workflow-tools.test.ts` (novo) | must |
| 20 | U3 | Avaliação com o modelo de verdade (opt-in): o pedido do roteiro, passo 1, termina num rascunho com os cinco balões na ordem, o `APPROVAL` dentro do ramo do valor, e nenhum `WRITE` | `builder/construtor/construtor.eval.test.ts`, "o fluxo do orçamento" | should |
| 21 | U4 | O trem mostra cada balão com o ícone e a marca da espécie ("código", "agente", "aprovação", "escreve"), o texto do balão, as setas, e o ramo "se sim" recuado; o rascunho traz a marca "rascunho"; a 390 px nada sai da tela | `apps/web/src/builder/workflows/train.test.tsx` (novo) | must |
| 22 | U4 | A página da execução mostra cada balão com o seu estado, a saída de um feito ao abrir, o motivo de um que falhou com **Tentar de novo deste balão**, e o cartão **Aprovar?** só para a pessoa do balão; para outra pessoa, "Esperando a aprovação de Ana" | `apps/web/src/builder/workflows/run.test.tsx` (novo) | must |
| 23 | U4 | **Publicar** aparece quando o rascunho difere da versão publicada; publicar com uma recusa do critério 3 mostra a frase da recusa e o balão que a causou | `apps/web/src/builder/workflows/publish.test.tsx` (novo) | must |
| 24 | U4 | Em Automações do Projeto, o workflow aparece com o gatilho, ligado ou pausado, a última execução e quantas esperam aprovação; o Membro não vê Automações (W34) | `apps/web/src/builder/automations/automations.test.tsx`, "o workflow na lista" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| O trem ao lado do Construtor (U4) | "Peça um fluxo ao Construtor" no lugar do trem | o mesmo | o esqueleto do trem | o erro ao gravar fica na conversa, dito pelo Construtor | o workflow apagado em outra aba: "Este workflow foi apagado" | o Membro não chega ao Construtor (W34) | a recusa de publicar com o balão marcado |
| A página do workflow (U4) | a versão publicada e as execuções vazias: "Nenhuma execução ainda. A primeira vem com o próximo orçamento." | o mesmo | o esqueleto | "Tentar de novo" | "Voltar ao início" | o Membro: não encontrado (W34) | "Pausado porque quem publicou não pode mais" |
| A página da execução (U4) | os balões com o estado | — | o esqueleto | "Tentar de novo" | "Voltar ao início" | sem ser a pessoa do balão: "Esperando a aprovação de Ana", sem botões | "Não aprovado", "Interrompida", o balão que falhou com o motivo |
| O cartão **Aprovar?** (U4) | a pergunta, o orçamento e os dois botões | — | "Aprovando…" ou "Recusando…" | a falha dita | já respondido em outra aba: o estado que a execução diz | sem a operação no papel: "Seu papel não permite aprovar esta escrita" | "Aprovado por você", "Recusado por você" |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Balloon` (a união por `kind`) | o Construtor por `save_workflow_draft` (U3), a rota do rascunho (U1) | a compilação (U1), as ferramentas (U1), o trem (U4) |
| `workflow_version.balloons` | a publicação (U1) | as ferramentas pela `workflowId` do contexto (U1), o gatilho (U2), a página (U4) |
| `Trigger` (`SANKHYA_NEW`: ligação, tipos, minutos) | o Construtor (U3) | o gatilho e a agenda (U2), o trem (U4) |
| `RunView.balloons[].state` | o retrato do Mastra, lido por `runs.ts` (U2) | a página da execução (U4) |
| `RunView.waiting` (pessoa e pergunta) | o `suspendPayload` do balão (U1) | o cartão (U4), o sino (U2) |
| O corpo `{ approved }` da aprovação | o cartão (U4) | a rota (U2), que retoma no Mastra |
| `workflow_trigger_seen` | o gatilho (U2) | o gatilho (U2) |
| A linha de `connector_write` com execução e balão | o funil (U1) | o funil (U1), a retomada (U2) |

**O desenho do trem**, a 1280 e a 390 px, sobre as peças de `ui/` (o esboço 5 do estudo da
estrutura dos agentes):

```text
1280                                                         390
┌ Construtor · Compras ─────┐┌ Workflow: Orçamento lançado [rascunho] ┐   ┌ Workflow: Orçamento ─────┐
│ quando lançar um orçamento ││ ⏱ Gatilho  código                      │   │ lançado [rascunho]       │
│ ...                        ││ A cada 15 min: orçamentos novos ·      │   │ ⏱ Gatilho  código        │
│ Montei o trem ao lado...   ││ Sankhya matriz                         │   │ A cada 15 min ...        │
│                            ││ ↓ para cada orçamento                  │   │ ↓                        │
│                            ││ 🔎 Ler o cliente  código               │   │ 🔎 Ler o cliente         │
│                            ││ ↓                                      │   │ ↓                        │
│                            ││ 🤖 Triagem de orçamento  agente        │   │ 🤖 Triagem  agente       │
│                            ││ ↓                                      │   │ ↓                        │
│                            ││ ◇ Valor acima de R$ 20.000?  código    │   │ ◇ Valor > R$ 20.000?     │
│                            ││    └ se sim: ✋ Aprovar? (Ana)          │   │   └ ✋ Aprovar? (Ana)     │
│                            ││ ↓                                      │   │ ↓                        │
│ [Fale com o Construtor...] ││ 📣 Avisar  código        [Publicar]    │   │ 📣 Avisar   [Publicar]   │
└────────────────────────────┘└────────────────────────────────────────┘   └──────────────────────────┘
```

No celular, a conversa e o trem são duas abas, "Conversa" e "Workflow".

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Gravar o rascunho (`UPDATE workflow.draft`) | a última gravação vence, como o rascunho do agente | — | o banco fora: a falha à conversa, nada gravado | — | 1 |
| Publicar (`INSERT workflow_version`, depois `addDynamicWorkflow`) | duas publicações ao mesmo tempo: a chave única `(workflow_id, number)` deixa uma; a outra relê e responde a versão que existe | o `addDynamicWorkflow` recusa (a validação do Mastra): a transação do Hub volta, nada publicado, `WORKFLOW_PUBLISH_REFUSED` com os problemas; o Hub morre entre o `INSERT` e o `addDynamicWorkflow`: no início, a versão sem definição no Mastra é registrada de novo antes de `startWorkers()` | o banco fora: nada publicado | `WORKFLOW_PUBLISHED` com workflow e versão | 2, 3, 4 |
| A agenda (`mastra.schedules.create`, `pause`, `resume`, `delete`) | a agenda é por versão publicada, com id `schedule_wf-<w>`; criar de novo é idempotente como `automations.ts:143-188` | o Hub morre depois de publicar e antes da agenda: no início, uma versão publicada sem agenda ganha a sua | o banco fora: a falha à tela | `WORKFLOW_SCHEDULED` | 2, 11 |
| A volta do gatilho (a leitura no Sankhya, depois `INSERT … ON CONFLICT DO NOTHING` em `workflow_trigger_seen`, depois `createRun().start()`) | duas voltas: a chave primária `(workflow_id, item_key)` deixa uma execução por orçamento | o Hub morre depois do `INSERT` e antes de começar a execução: a linha guarda `run_id` nulo; a volta seguinte começa as execuções das linhas sem `run_id` | o Sankhya fora: o começo não avança, a volta seguinte relê; o banco fora: nada dispara | `WORKFLOW_TRIGGER_FAILED` com workflow e código, sem as linhas (S40) | 9, 10 |
| Aprovar (`run.resume`) | duas respostas: o Mastra deixa uma (`WORKFLOW_RESUME_ALREADY_CLAIMED`), a outra recebe `RUN_NOT_WAITING` | o Hub morre durante a retomada: a execução fica `running`, aparece "Interrompida", e **Tentar de novo** retoma | o banco fora: a falha ao cartão, a execução continua esperando | `WORKFLOW_APPROVED` ou `_DECLINED` com execução, balão e pessoa | 13 |
| Tentar de novo (`run.timeTravel`) | o Mastra deixa um (`WORKFLOW_TIME_TRAVEL_ALREADY_CLAIMED`), o outro recebe `RUN_NOT_FAILED` | a definição mudou: o Mastra recusa, e não muda, porque cada versão é um id | o banco fora: a falha à tela | `WORKFLOW_RETRIED` | 14, 15 |
| O balão que escreve (`writeThrough` com `WORKFLOW`) | a chave execução e balão: a segunda chamada lê a linha e não envia | os casos de `WRITE_UNCERTAIN` da 24.5, iguais | os da 24.5, iguais | os da 24.5, com workflow, versão, execução e balão | 8 |
| Avisar (o sino e o e-mail) | uma execução avisa uma vez por balão; um **Tentar de novo** depois de um aviso feito não avisa de novo (o balão já está `success`) | o e-mail falha: o sino fica, e o balão termina `success` com "o e-mail não saiu" | o envio de e-mail fora: igual | `WORKFLOW_NOTIFIED` | 12 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O workflow guardado como dado e carregado de novo depois de um reinício | U1 | nenhum: o único `createWorkflow` é o fixo da 24.2, `builder/automations/run.ts:248-256` | `@mastra/core@1.82.0`: `addDynamicWorkflow` (`dist/mastra-D4MXu5BN.js:4180`), `#loadDynamicWorkflows` em `startWorkers()` (`:4305`, `:5175`); `mastra@6e8dfcb8 packages/core/src/mastra/index.ts:5909-6045`, `:6054-6119`; tabela `mastra_workflow_definitions` (`packages/core/src/storage/constants.ts:374-389`); doc `dist/docs/references/docs-workflows-dynamic-workflows.md:7-11` (Beta) | A definição em JSON é validada contra o registro vivo, vira um `Workflow` de verdade e fica no Postgres; `startWorkers()` a recarrega. Provado no estudo, P1 e P2 | nativo (Beta) | — | não precisa | `apps/server/src/builder/workflows/compile.ts` |
| Uma versão publicada não muda debaixo de uma execução aberta | U1 | o agente: uma versão por publicação (`builder/agents/tables.ts:71`) | Mastra 1.82 não tem versão de workflow: a definição não tem coluna de versão (`constants.ts:374-389`); a execução copia o grafo vivo ao ser criada (`workflows/workflow.ts:3083`); activepieces `f34c43cd` `packages/core/execution/src/lib/flows/flow-version.ts:16-23`; n8n `2e855356` `@n8n/db/src/entities/workflow-history.ts:12-27`; Vercel Workflow prende a execução ao deploy em que começou (documentado) | Provado no estudo, P2: com o mesmo id, a retomada depois do reinício roda o grafo novo, até um passo inserido antes do que esperava. Por isso cada versão publicada é um id próprio do Mastra, `wf-<id>-v<n>`, e fica `active` enquanto o workflow existe | embrulhado: o id por versão é nosso; o Mastra guarda e carrega cada uma | P2 | não precisa | `apps/server/src/builder/workflows/tables.ts` |
| Os balões e as ligações entre eles | U1 | nenhum | Mastra 1.82, tipos de entrada `packages/core/src/workflows/dynamic/graph.ts:25-44`; mapeamento declarativo `dynamic/mapping-config.ts:51-60` (`value`, `template`, `initData`, `step` + `path`); activepieces: uma lista ligada por `nextAction`, ramo só por ROUTER e LOOP (`flows/actions/action.ts:7-13`) | Cada balão vira um `mapping` (o id do balão e as saídas anteriores) seguido de um `tool` do Conexus; "valor acima de" vira `conditional` com o predicado declarativo | embrulhado: o balão e a compilação são nossos; o grafo e a execução são do Mastra | — | não precisa | `packages/hub-api/src/workflows.ts`, `compile.ts` |
| Ler um sistema num balão | U1 | `readThrough` (`hub/connectors/read.ts`), as 22 leituras do Sankhya (`packages/connectors/src/sankhya/operations/index.ts:19-44`) | Mastra 1.82: a entrada `tool` resolve por `mastra.getTool(id)` (`dynamic/rehydrate.ts:418-425`); `createStep(tool)` chama `tool.execute` direto (`entry-executors/run-tool-entry.ts:58`); o contexto da ferramenta traz `workflowId` e `runId` (`dist/tools/types.d.ts:202-212`) | A ferramenta `conexus-ler` acha o balão pela `workflowId` do contexto e lê pelo funil de hoje, com o papel de quem publicou | embrulhado: o funil de leitura de hoje | — | não precisa | `apps/server/src/builder/workflows/tools.ts` |
| Um agente num balão | U1 | a conversa nova da automação, `run.ts:221-229`, e o agente publicado (`builder/agents/registry.ts:49-69`) | Mastra 1.82: `createStep(agent)` chama `agent.stream` sem tratar aprovação (`entry-executors/run-agent-entry.ts:166-173`); provado no estudo, P3: com uma ferramenta que pergunta, o passo nunca termina | O balão abre uma conversa nova do agente, marcada "Workflow", como a automação abre a do Assistente, e devolve o texto final; um agente cuja versão tem escrita não entra | embrulhado: o passo `converse` da 24.2 aplicado à conversa do agente | P3 | não precisa | `tools.ts` |
| "Aprovar?" no meio do workflow | U1, U2 | o cartão da conversa (24.5), só na memória do Hub | Mastra 1.82: uma ferramenta suspende pelo `context.workflow.suspend` (`dist/docs/references/reference-tools-create-tool.md:75-77,105`); `run.resume` (`dist/agent-BP9OWM6D.js:11239`); a segunda retomada perde com `WORKFLOW_RESUME_ALREADY_CLAIMED` (`reference-workflows-run-methods-resume.md:102-122`); o roteiro de autoria do Mastra diz que um grafo guardado não suspende (`workflows/builder/authoring-playbook.ts:566`), mas uma ferramenta registrada suspende; Zapier "Request Approval" e Dify "Human Input" escolhem quem responde (documentados, 2026-11-07); n8n `nodes-base/utils/sendAndWait/utils.ts` | Provado no estudo, P2: suspenso no processo 1, retomado no processo 2, `success` | nativo | — | a decisão A e a D | `tools.ts` |
| Escrever num sistema num balão | U1 | `writeThrough` (`hub/connectors/write.ts:154-183`), o registro `connector_write` com chave empresa, conversa e `toolCallId` (`hub/connectors/tables.ts:205-250`), a chave da 24.5 (`builder/agents/tools.ts:110-142`) | Mastra 1.82: `requireApproval` não vale num passo de workflow (nenhuma ocorrência em `packages/core/src/workflows`, fora de testes); provado no estudo, P3: a ferramenta roda sem perguntar; `resolveToolApprovalVerdict` só no laço do agente (`dist/agent-BP9OWM6D.js:15127`) | A ferramenta `conexus-escrever` suspende antes de enviar em **Pergunta antes** e envia pelo `writeThrough` com quem fala `WORKFLOW` e a chave execução e balão | embrulhado: o funil da 24.5 com uma chave nova | P3 | a decisão E; o registro, regra D11, pela aprovação desta página | migração `e246_workflow_write` |
| Avisar uma pessoa | U1 | `deps.notify.automationRan` (`run.ts:230-247`), `notifications.notification` (24.2) | Zapier e Make mandam e-mail ou mensagem por um passo (documentados) | O sino e o e-mail de hoje, com um tipo novo | embrulhado | — | não precisa | `tools.ts` |
| O gatilho: orçamentos novos no Sankhya | U2 | as Automações disparam só por horário, `builder/automations/cadence.ts:279-297` | Sankhya: nenhuma página de webhook no índice `developer.sankhya.com.br/llms.txt`; `logAlteracoesTabelas` pede LOGTABOPER e guarda 3 a 7 dias (documentado, 2026-11-07); activepieces `packages/pieces/common/src/lib/polling/index.ts:38-140` (o cursor nasce em `Date.now()` ao ligar, `:119-134`); n8n `nodes-base/nodes/Airtable/AirtableTrigger.node.ts:249,259,274`; Pipedream `dedupe: "unique"`; Zapier deduplica pelo `id` (documentado) | Olhar de tempos em tempos as notas novas dos tipos escolhidos, lembrar as vistas pelo `NUNOTA`, e começar uma execução por orçamento novo | remendo: o agendador do Mastra só publica `workflow.start` e não guarda cursor (`workflows/scheduler/scheduler.ts:18-29`) | `@mastra/core@1.82.0` lido: nenhum cursor de gatilho; os critérios 9 e 10 provam a tabela com o dublê; a entrada na [boundaries](../reference/boundaries.md) vem no fechamento | a decisão B | `apps/server/src/builder/workflows/trigger.ts`, migração `e246_workflow_trigger` |
| A agenda do gatilho | U2 | `mastra.schedules.create` (`builder/automations/automations.ts:143-188`), data D27 | Mastra 1.82 `mastra.schedules` (`dist/schedules/schedules.d.ts:181-189`); entrega sem garantia, um disparo perdido não volta (`docs-workflows-scheduled-workflows.md:45`) | Uma linha de agenda por workflow publicado com gatilho, no workflow fixo `conexus-workflow-poll` | nativo | — | a decisão C | `trigger.ts` |
| A lista de execuções e cada balão aceso | U2, U4 | `builder/automations/runs.ts:122-190` | Mastra 1.82 `listWorkflowRuns` (`workflow.ts:3517`), o retrato `WorkflowRunState` (`workflows/types.ts:409-450`), os estados (`:305-316`); n8n `packages/workflow/src/execution-status.ts:1-12`; activepieces `flow-execution.ts:5-23` | O estado de cada balão vem do retrato do Mastra; nenhuma tabela nossa repete | nativo | — | não precisa | `apps/server/src/builder/workflows/runs.ts` |
| Tentar de novo a partir do balão que falhou | U2 | nenhum (a 24.2 não repete) | Mastra 1.82 `run.timeTravel` (`dist/agent-BP9OWM6D.js:11833`), recusa se a definição mudou (`docs-workflows-time-travel.md:20`) | Provado no estudo, P4: num processo novo terminou a execução sem rodar o passo 1 de novo | nativo | — | não precisa | `runs.ts` |
| Uma execução cortada por um reinício | U2 | `builder/automations/runs.ts:70-115` | Mastra 1.82 `restartAllActiveWorkflowRuns` só no servidor do Mastra (`workflow.ts:3545`); provado no estudo, P4: `restart()` numa falha só devolve a falha | Igual à 24.2: "Interrompida", e **Tentar de novo** retoma do balão | nativo | — | não precisa | `runs.ts` |
| Montar o workflow conversando | U3 | o Construtor monta agentes (`builder/construtor/tools.ts:105-238`) | Mastra Code `mastracode/sdk/src/tools/workflows/create-workflow.ts:30-59`, `save-workflow.ts:41`; `createWorkflowBuilderAgent` (`packages/core/src/workflows/builder/agent.ts:17-24`); activepieces `ap_build_flow` (`packages/server/api/src/app/mcp/tools/ap-build-flow.ts:47`); Zapier Copilot e Make Maia (documentados) | O modelo escreve a lista inteira numa ferramenta que valida e devolve os problemas pelo caminho; o roteiro do Mastra escreve o grafo cru e diz que não suspende, por isso o Construtor escreve balões | embrulhado: as ferramentas do Construtor | — | não precisa | `apps/server/src/builder/construtor/workflow-tools.ts` |
| O trem de balões na tela | U4 | nenhum | Mastra Studio `@xyflow/react` e `@dagrejs/dagre` (`packages/playground-ui/package.json:194,206`); activepieces `@xyflow/react` 12.3.5; n8n Vue Flow 1.48; Zapier, lista vertical (documentado); o esboço 5 | Cartões em coluna ligados por setas, o ramo "se sim" recuado | embrulhado: as peças de `ui/`, sem biblioteca de grafo (com `F1`) | — | a decisão F | `apps/web/src/builder/workflows/train.tsx` |
| Quem monta, publica e responde | U1, U2 | `manageAutomations` (`hub/identity/admission.ts:103`); `agent: publishUnattendedWrite` (`hub/identity/roles.ts:37`); a reconferência, `run.ts:189-219` | Zapier e Dify escolhem quem aprova no passo; Copilot Studio e Agentforce, a autoridade de quem montou | Quem publica é o dono; cada execução reconfere; quem aprova é escolhido no balão | embrulhado | — | a decisão A | — |
| As Automações da 24.2 | fica de fora: continuam como estão | uma linha de agenda sobre `conexus-automation-run`, sem tabela do Hub (`automations.ts:249-251`); o pg-boss nunca foi instalado (`apps/server/package.json:26-31`) | — | A tela Automações lista as duas espécies (U2, U4); o texto do pg-boss sai no fechamento (`roadmap.md:71`, `decisions/0058:15`) | nativo, sem mudança | — | não precisa | — |

As linhas citadas do Mastra sem `dist/` são do `mastra@6e8dfcb8` (a etiqueta `@mastra/core@1.82.0`),
`packages/core/src/`; as do activepieces em `f34c43cd`, as do n8n em `2e855356`. As provas P1 a
P4 rodaram fora do repositório com `@mastra/core` 1.82.0, `@mastra/pg` 1.35.0 e Postgres 18; o
relatório do estudo guarda os scripts e as saídas.

**A medida do transplante.** Nada vem do produto antigo: ele não tinha workflows.

**A dívida.**

- `docs/architecture.md:215` diz que o Mastra lê a agenda a cada 10 s; a regra D27 diz que dorme
  até o próximo disparo. O fechamento acerta a arquitetura.
- O texto do pg-boss (`roadmap.md:71`, `decisions/0058:15`) sai no fechamento.
- Uma versão nunca é arquivada no Mastra enquanto o workflow existe; com muitas edições, o boot
  carrega mais definições. Gatilho: mais de 50 versões num workflow.

## U1 O workflow como dado

**Base e modelo.** `main` do dia, depois da 24.5. Opus: o contrato cruza o Hub, o Mastra e o funil
de escrita, e a chave nova do registro de envios é concorrência.

### As linhas da tabela

- **O workflow guardado.** Ler `builder/mastra/mastra.ts:20-28` (o `new Mastra`), `hub-mastra.ts:46-125`
  (o `start`, que chama `startWorkers()` em `:100`, e o gancho `beforeWorkers`). API:
  `mastra.addDynamicWorkflow(def)` (`dist/mastra-D4MXu5BN.js:4180`); a doc
  `dist/docs/references/reference-workflows-dynamic-workflow-definition.md:13-24` (os campos) e
  `:52-68` (as entradas); a validação devolve problemas com caminho (`:336-344`). As ferramentas do
  Conexus entram no `new Mastra({ tools })`, porque a entrada `tool` resolve por `mastra.getTool`
  (`mastra@6e8dfcb8 packages/core/src/workflows/dynamic/rehydrate.ts:418-425`).
- **A versão.** Modelo: `builder/agents/tables.ts:29` (`agent`) e `:71` (`agentVersion`),
  `publish.ts`. O id do Mastra é `wf-<workflowId>-v<number>`.
- **Os balões.** As entradas `mapping` (`dynamic/mapping-config.ts:51-60`), `tool`, `conditional`
  com o predicado declarativo (`authoring-playbook.ts`, a seção do predicado). Um balão =
  `mapping` com `{ balloon: { value: '<id>' }, vars: { step: … } }` seguido do `tool`.
- **Ler, o agente, aprovar, escrever, avisar.** O contexto da ferramenta: `dist/tools/types.d.ts:202-212`
  (`workflowId`, `runId`, `suspend`, `resumeData`). Ler: `hub/connectors/read.ts` (`readThrough`).
  O agente: `builder/automations/run.ts:221-229` e a função `conversed` que ele chama, para a
  conversa nova; `builder/agents/registry.ts:49-69` para achar o agente. Aprovar e escrever:
  `suspendSchema` e `resumeSchema` no `createTool` (`reference-tools-create-tool.md:75-77`), a
  prova P2 do estudo (`gateTool`). Escrever: `hub/connectors/write.ts:154-183`,
  `write-record.ts:222` (`register`), `tables.ts:205-250`. Avisar: `run.ts:230-247`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/workflows.ts` | Cria | o servidor, a web |
| `apps/server/src/builder/workflows/` | Cria (`tables.ts`, `balloons.ts`, `compile.ts`, `tools.ts`, `publish.ts`, `routes.ts`, `public.ts`) | `conversations-of.ts`, a U2, a U3 |
| `apps/server/src/builder/mastra/` | Muda (`mastra.ts`: as `tools`; `hub-mastra.ts`: registrar as versões sem definição antes de `startWorkers()`) | `main.ts` |
| `apps/server/src/hub/connectors/` | Muda (`write.ts`, `write-record.ts`, `tables.ts`: quem fala `WORKFLOW`) | `builder/agents/tools.ts`, `builder/workflows/tools.ts` |
| `apps/server/migrations/`, `database-grants.sql` | Cria (`e246_workflow`, `e246_workflow_write`) | o catálogo |
| `apps/server/src/builder/conversations-of.ts` | Muda (as rotas e as ferramentas) | `main.ts` |

### Os contratos que a unidade cria

Em `packages/hub-api/src/workflows.ts`:

```ts
export const WorkflowId = z.uuid().brand<'WorkflowId'>()
export const BalloonId = z.string().regex(/^b[0-9]{1,3}$/).brand<'BalloonId'>()

/** Um valor de um balão anterior ou do gatilho: '{{gatilho.NUNOTA}}', '{{b2.texto}}'. */
export const Template = z.string().max(2000)

export const Trigger = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('SANKHYA_NEW'),
    connectionId: ConnectionId,
    operationTypes: z.array(z.number().int().positive()).min(1).max(20),
    everyMinutes: z.literal(15), // a decisão C muda este literal
  }),
])

export const Balloon = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('READ'), id: BalloonId, title: z.string().max(80),
    connectionId: ConnectionId, operation: z.string(), input: z.record(z.string(), Template) }),
  z.object({ kind: z.literal('AGENT'), id: BalloonId, title: z.string().max(80),
    agentId: AgentId, prompt: Template }),
  z.object({ kind: z.literal('IF'), id: BalloonId, title: z.string().max(80),
    value: Template, op: z.enum(['GT', 'GTE', 'LT', 'LTE', 'EQ', 'NEQ']), than: z.number(),
    then: z.array(z.lazy(() => Balloon)).min(1).max(10) }),
  z.object({ kind: z.literal('APPROVAL'), id: BalloonId, title: z.string().max(80),
    approver: PersonId, question: Template }),
  z.object({ kind: z.literal('WRITE'), id: BalloonId, title: z.string().max(80),
    connectionId: ConnectionId, operation: z.string(), input: z.record(z.string(), Template),
    approval: z.enum(['ASK', 'AUTO']) }), // só com a decisão E1
  z.object({ kind: z.literal('NOTIFY'), id: BalloonId, title: z.string().max(80),
    people: z.array(PersonId).min(1).max(10), message: Template }),
])

export const WorkflowDraft = z.object({
  name: z.string().min(1).max(80),
  trigger: Trigger,
  balloons: z.array(Balloon).min(1).max(20),
})

export const WorkflowView = z.object({
  id: WorkflowId, projectId: ProjectId, name: z.string(),
  draft: WorkflowDraft.nullable(),
  published: z.object({ number: z.number().int().positive(), draft: WorkflowDraft,
    publishedBy: PersonId, publishedAt: z.iso.datetime() }).nullable(),
  state: z.enum(['ON', 'PAUSED', 'PAUSED_OWNER']),
})
```

Rotas (acesso `manageAutomations` no Projeto):

- `GET /api/companies/{c}/projects/{p}/workflows/{w}` → `WorkflowView`; `WORKFLOW_NOT_FOUND`.
- `PUT …/workflows/{w}/draft` corpo `WorkflowDraft` → `WorkflowView`; `REQUEST_MALFORMED` com
  `issues: [{ path, message }]`.
- `POST …/workflows/{w}/publish` → `WorkflowView`; `NOT_IN_ROLE`, `NOT_GRANTED`, `AGENT_WRITES`,
  `WORKFLOW_PUBLISH_REFUSED`.
- `DELETE …/workflows/{w}` → 204.

Tabelas (esquema do Hub, com `company_id` e a política de linha como as do agente, regra D11):

- `workflow(id uuid pk, company_id, project_id, name text, draft jsonb null, state text check in
  ('ON','PAUSED','PAUSED_OWNER'), created_by, created_at)`, que sai com o Projeto e com a empresa.
- `workflow_version(workflow_id fk on delete cascade, number int, draft jsonb not null,
  published_by, published_at, primary key (workflow_id, number))`.

Funil de escrita (`hub/connectors/write.ts`): o pedido ganha quem fala

```ts
type Speaker =
  | { kind: 'PERSON'; personId: PersonId }
  | { kind: 'VERSION'; agentId: AgentId; versionNumber: number }
  | { kind: 'WORKFLOW'; workflowId: WorkflowId; versionNumber: number; publishedBy: PersonId }
type WriteKey =
  | { kind: 'CONVERSATION'; threadId: ConversationId; toolCallId: string }
  | { kind: 'RUN'; runId: WorkflowRunId; balloonId: BalloonId }
```

`connector_write` ganha `run_id text null`, `balloon_id text null`, `workflow_id uuid null`,
`workflow_version int null`, e a chave passa a ser uma de duas: `(company_id, thread_id,
tool_call_id)` ou `(company_id, run_id, balloon_id)`, por dois índices únicos parciais e um `check`
que exige exatamente uma das duas. A marca `Conexus <id>` sai da chave como hoje (`markOf`).

**O dono de cada fato.** O desenho publicado: `workflow_version.draft` (o Mastra guarda a
compilação, nunca o desenho). Quem publicou: `workflow_version.published_by`. A espécie de cada
operação (leitura ou escrita): o kit, como na 24.5. O estado de cada balão: o retrato do Mastra.
O arquivo tomado como modelo: `builder/agents/tables.ts` e `publish.ts`, que cumprem C21, C23 e C26.

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/server/src/builder/` e `packages/hub-api`: a
skill `mastra` (com a doc instalada primeiro), `fastify-best-practices`, `typescript-magician`.

### A ordem do trabalho

1. O contrato em `hub-api` e o seu teste de esquema. Regras: C21, C23, C27, C28.
2. As tabelas e a migração `e246_workflow`, com as permissões num pull request próprio da unidade
   (D11), como na 24.5.
3. A compilação (`compile.ts`): `WorkflowDraft` → `WorkflowDefinition` do Mastra, sem I/O, com
   teste de mesa. Um `IF` compila para `conditional` com um ramo; a saída do ramo não tomado é
   `skipped`.
4. As cinco ferramentas (`tools.ts`), cada uma achando o balão por `context.workflow.workflowId` e
   o id do balão na entrada, nunca confiando em empresa, ligação ou pessoa vindas do grafo (S7,
   S8, S9): a empresa, o Projeto e quem publicou vêm de `workflow_version` pela `workflowId`.
5. Publicar (`publish.ts`): a conferência do papel, a transação do Hub, depois `addDynamicWorkflow`;
   recusado, a transação volta.
6. No `hub-mastra.ts`, antes de `startWorkers()`, registrar a versão publicada que não tiver
   definição no Mastra (o Hub morreu entre os dois).
7. A migração `e246_workflow_write` e quem fala `WORKFLOW` no funil.

### Como se prova

Critérios 1 a 8, pelo servidor de verdade (`hubBeside`) e o dublê do Sankhya, com o modelo de
mentira para o agente; o critério 4 abre um segundo Hub ao lado do mesmo banco.

### Parar se

- O `addDynamicWorkflow` recusar uma ferramenta registrada no `new Mastra({ tools })` antes de
  `startWorkers()`: relatar com a saída; não registrar por fora.
- O predicado declarativo não comparar um número vindo de um `template` (texto): relatar; não
  escrever uma comparação nossa sem a palavra do cartão.
- A política de linha não cobrir a leitura das ferramentas, que rodam sem pessoa: relatar.

## U2 O gatilho e as execuções

**Base e modelo.** A U1 no `main`. Opus: duas voltas ao mesmo tempo, a retomada e o reinício.

### As linhas da tabela

- **O gatilho.** O modelo é o activepieces (`packages/pieces/common/src/lib/polling/index.ts:38-140`):
  ao ligar, o começo é o agora (`:119-134`); cada volta lê, guarda o que é novo e dispara. A leitura
  nova do kit, `orcamentosNovos` (classe `read`, sem oferta ao modelo), lê `CabecalhoNota` pela
  porta `carregar` (`packages/connectors/src/sankhya/door.ts:69-100`, o `loadRecords`) com o
  critério dos tipos e da data de negociação desde o começo menos um dia; a doc do `loadRecords` e
  dos critérios está no relatório do estudo. O dublê ganha as notas de orçamento (o #819).
- **A agenda.** `builder/automations/automations.ts:143-188` (criar idempotente), `run.ts` (um
  workflow fixo que a agenda dispara, e a reconferência `:189-219`). O id fixo
  `conexus-workflow-poll` é um contrato guardado, como `AUTOMATION_WORKFLOW` (`run.ts:22-27`).
- **As execuções.** `runs.ts:70-190` da 24.2 é o modelo; API `getWorkflowRunById`,
  `listWorkflowRuns`, `run.resume`, `run.timeTravel` (as linhas da tabela).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/sankhya/` | Muda (`operations/vendas.ts`: `orcamentosNovos`; o dublê) | `hub/connectors/` |
| `apps/server/src/builder/workflows/` | Cria (`trigger.ts`, `runs.ts`, `run-routes.ts`) | `conversations-of.ts` |
| `apps/server/src/builder/automations/` | Muda (`routes.ts`, a lista com as duas espécies) | a web |
| `packages/hub-api/src/{workflows,automations}.ts` | Muda | o servidor, a web |
| `apps/server/migrations/`, `database-grants.sql` | Cria (`e246_workflow_trigger`) | o catálogo |

### Os contratos que a unidade cria

- `workflow_trigger(workflow_id pk fk on delete cascade, since timestamptz not null)` e
  `workflow_trigger_seen(workflow_id fk on delete cascade, item_key text, run_id text null,
  seen_at timestamptz, primary key (workflow_id, item_key))`; as linhas de mais de 7 dias saem na
  própria volta.
- `RunView = { runId, versionNumber, item: { key, label } | null, state: 'RUNNING' | 'WAITING' |
  'DONE' | 'FAILED' | 'DECLINED' | 'INTERRUPTED' | 'PAUSED_OWNER', balloons: { id, state:
  'waiting' | 'running' | 'success' | 'failed' | 'suspended' | 'skipped', output?, error? }[],
  waiting: { balloonId, approver: PersonId, question: string } | null, startedAt }`.
- Rotas: `GET …/workflows/{w}/runs?page=`, `GET …/runs/{r}`, `POST …/runs/{r}/approval`
  `{ approved: boolean }` (`RUN_NOT_WAITING`, `NOT_APPROVER`, `NOT_IN_ROLE`), `POST …/runs/{r}/retry`
  `{ balloonId }` (`RUN_NOT_FAILED`), `POST …/workflows/{w}/pause`, `…/resume`, `POST
  …/workflows/{w}/test`.
- `AutomationItem` ganha `kind: 'ASSISTANT' | 'WORKFLOW'` e, num workflow, `waitingCount`.

### As skills e a leitura

As da U1, e [testing](../guides/testing.md) T26 para gravar a leitura do Sankhya.

### A ordem do trabalho

1. `orcamentosNovos` no kit e o dublê, com a gravação (T26) feita no fim pelo fundador.
2. A migração `e246_workflow_trigger`, com as permissões num pull request próprio (D11).
3. `trigger.ts`: o workflow fixo, a volta (ler, `INSERT … ON CONFLICT DO NOTHING RETURNING`,
   começar as execuções das linhas sem `run_id`), o limite de 20 por volta, a reconferência.
4. A agenda ao publicar, pausar, religar e apagar (a U1 chama a U2 por uma porta).
5. `runs.ts`: a lista, a vista, aprovar, tentar de novo, a interrompida, o teste.
6. A lista de Automações com as duas espécies, sem mudar as respostas da 24.2. O #754: o teste do
   agendador recebe o relógio injetado (testing T20).

### Como se prova

Critérios 9 a 18, com o dublê e o relógio injetado; o critério 13 abre um segundo Hub ao lado do
mesmo banco.

### Parar se

- A doc do `loadRecords` não deixar filtrar por tipo de operação e data juntos: relatar com a
  página; não usar `consultar` com SQL escrito pelo modelo.
- O campo do valor do orçamento ou do tipo de operação tiver outro nome na gravação do fundador:
  ajustar só o nome, e dizer no relatório.

## U3 O Construtor monta

**Base e modelo.** A U1 e a U2 no `main`. Sonnet.

### As linhas da tabela

- O modelo é o Mastra Code: uma ferramenta que recebe o desenho inteiro e devolve os problemas
  (`mastracode/sdk/src/tools/workflows/save-workflow.ts:41`); a do activepieces
  (`ap-build-flow.ts:47`), o gatilho e os passos numa chamada. As ferramentas de hoje do
  Construtor: `builder/construtor/tools.ts:105-238`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/construtor/` | Cria `workflow-tools.ts`; muda `construtor.ts` e o texto em `prompt/` | o controlador do Construtor |

### Os contratos que a unidade cria

- `workflow_catalog()` → as ligações do Projeto com as operações (leitura ou escrita) que o papel
  de quem conversa usa, os agentes publicados do Projeto sem escrita, as pessoas da empresa (nome e
  id).
- `save_workflow_draft({ workflowId?, draft: WorkflowDraft })` → `{ ok: true, workflowId }` ou
  `{ ok: false, issues }`, pela rota da U1.
- `test_workflow({ workflowId })` → o resultado do teste da U2.

### A ordem do trabalho

1. As três ferramentas, chamando as portas da U1 e da U2.
2. O texto: perguntar o que falta (os tipos de operação, quem aprova, quem avisa), como a skill da
   automação já pergunta; nunca inventar um tipo de operação.

### Como se prova

Critérios 19 e 20.

### Parar se

- O modelo de verdade não escrever a lista com o `IF` aninhado em três tentativas da avaliação:
  relatar com as saídas; não achatar o contrato sem o cartão.

## U4 As telas

**Base e modelo.** A U1 e a U2 no `main`; a 24.5 U3 no `main`. Sonnet.

### As linhas da tabela

- O trem: o desenho de caixas acima, sobre `apps/web/src/ui/`; nenhuma biblioteca de grafo (a
  decisão F1).
- O cartão **Aprovar?**: as peças da 24.5 U3 (`apps/web/src/builder/conversation/approval-card.tsx`
  e os seus textos), com a execução no lugar da conversa.
- A lista: `apps/web/src/builder/automations/automations.tsx`, `runs.tsx`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/workflows/` | Cria (`train.tsx`, `run.tsx`, `workflow-page.tsx`, `queries.ts`) | as rotas |
| `apps/web/src/builder/{automations,agents}/` | Muda (a lista; o trem ao lado do Construtor) | as rotas |
| `apps/web/src/routes/_app/companies/$companyId/projects/` | Cria `$projectId_.workflows.$workflowId.tsx` e `…runs.$runId.tsx` | o roteador |
| `docs/reference/screens.md` | Muda | a revisão |

### A ordem do trabalho

1. O trem (`train.tsx`), com a matriz de estados e as duas larguras.
2. O trem ao lado da conversa do Construtor, e as abas no celular.
3. A página do workflow e a da execução, o cartão, os botões.
4. A lista de Automações.

### Como se prova

Critérios 21 a 24, e a QA da etapa (testing T25) pelo roteiro.

### Parar se

- O trem precisar de laço ou de passos em paralelo: ficam de fora; relatar.
