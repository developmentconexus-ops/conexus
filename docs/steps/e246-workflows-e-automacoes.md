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
triagem, e acima de um valor ele pede a sua aprovação antes de avisar alguém. Você vê o fluxo ao
lado da conversa como um trem de balões, publica, e depois vê cada execução com os balões acesos e
aprova a que espera você.

**O roteiro de uso.** Você é a Ana (dona). A ligação do Sankhya está liberada ao Projeto
"Compras", e o agente "Triagem de orçamento" está publicado nele, só com leituras.

1. No Projeto "Compras", abra o Construtor e escreva "quando lançar um orçamento no Sankhya, quero
   que o agente Triagem veja se o cliente está bom; acima de R$ 20 mil, me pede para aprovar antes
   de avisar o Bruno". Ao lado da conversa aparece **Workflow: Orçamento lançado**, marcado
   "rascunho", com os balões: **Gatilho** (orçamentos novos no Sankhya), **Ler o cliente**,
   **Triagem de orçamento** (agente), **Valor acima de R$ 20.000?** com **Aprovar? (Ana)**
   recuado embaixo, e **Avisar o Bruno**. Se faltar algo (qual tipo de operação é orçamento, quem
   avisar), o Construtor pergunta antes de montar.
2. Escreva "testa com o último orçamento". O trem acende balão por balão sobre o orçamento mais
   recente, e no fim o Construtor diz o que cada balão fez. Num teste ninguém é avisado.
3. Toque **Publicar**. O workflow aparece em Automações do Projeto, ligado. Lance um orçamento de
   teste no Sankhya, acima de R$ 20.000. Na próxima olhada do Conexus, o sino e o seu e-mail
   mostram "O workflow Orçamento lançado espera sua aprovação". Abra: a execução mostra os balões
   feitos em verde, a triagem com o texto do agente, e o cartão **Aprovar?** com o orçamento.
   Toque **Aprovar**: o balão **Avisar o Bruno** acende e o Bruno recebe o aviso.
4. Peça ao Construtor "acima de R$ 50 mil em vez de 20" e lance outro orçamento de R$ 30.000 antes
   de publicar: ele ainda pede a sua aprovação, porque a versão publicada continua a de antes.
   Publique a mudança. Lance um orçamento de R$ 30.000: agora ele vai direto ao aviso, e o balão
   **Aprovar?** aparece como "pulado".
5. No Projeto, em Integrações, tire a liberação da ligação do Sankhya e lance um orçamento. A
   página do workflow mostra "A última olhada no Sankhya falhou" com o motivo. Libere de novo: na
   olhada seguinte o orçamento que você lançou dispara, uma vez só.
6. Em Automações, pause o workflow. Nenhum orçamento novo dispara enquanto ele está pausado; ao
   religar, só os orçamentos lançados depois de religar disparam.

**O que você faz, e quando.** Antes: diz **o gatilho do Sankhya** (a decisão B): quais tipos de
operação (TOP) são orçamento na sua empresa e em qual ligação. No começo: responde às decisões
abaixo e aprova esta página. No fim: faz o roteiro no Sankhya de verdade da sua empresa, diz o que
viu e aprova os textos das telas.

**O que o estudo mostrou** (2026-11-07, com modelo de mentira e um banco local, sem chamar nada de
fora).

- **O Mastra guarda um workflow montado na hora e o carrega de novo depois de um reinício.** É o
  "workflow dinâmico" do roteiro, marcado Beta no Mastra 1.82. Medido: montado de uma lista, ele
  roda, fica no banco, e o Conexus, ao reiniciar, o encontra sozinho.
- **Uma aprovação no meio do workflow sobrevive a um reinício do Conexus**, também dentro do ramo
  "acima de R$ 20 mil". Medido: o workflow parou esperando, o Conexus parou, outro o retomou com a
  aprovação e terminou. Na conversa da 24.5 é diferente: lá o cartão some num reinício.
- **Recusar termina a execução**, e nada depois do balão roda. Medido.
- **Uma execução cortada por um reinício termina depois**, do balão em que estava, sem repetir os
  anteriores. Medido (o Conexus espera 15 segundos, o tempo em que o Mastra ainda a considera do
  processo que parou).
- **Um agente que pergunta antes de escrever trava dentro de um workflow.** Medido: o passo nunca
  termina. Por isso, num workflow, o agente só lê e analisa; uma escrita é um balão próprio, com a
  sua aprovação.
- **O Mastra não tem versão de workflow.** Medido: se o mesmo workflow muda, uma execução que
  esperava continua no desenho novo. Por isso cada publicação é uma versão própria, como nos
  agentes, e a execução fica na versão em que começou.
- **O Sankhya não avisa sozinho.** A documentação pública do Sankhya não tem aviso para fora. O
  gatilho é o Conexus olhar de tempos em tempos os orçamentos novos, como Zapier, Make, n8n,
  activepieces e Pipedream fazem, e lembrar quais já viu.
- **O pg-boss nunca foi instalado.** A 24.2 já usa a agenda do Mastra; sai só o texto que ainda
  fala dele, no fechamento.
- **Montar conversando é o que os produtos fazem.** Zapier, Make, n8n, activepieces e o Mastra
  Code: o modelo escreve a lista de passos inteira, e o produto confere e devolve o que não serve.
  O construtor de workflows do painel do Mastra é pago e proibido em produção; o Conexus não o usa.

**Fica de fora.**

- **Mudar as Automações da 24.2.** Elas continuam como estão (um horário e uma pergunta ao
  Assistente) e aparecem na mesma lista de Automações, ao lado dos workflows.
- **Um agente que escreve dentro de um workflow.** Pelo travamento medido; a escrita é um balão.
- **Gravar uma linha num app** ("linha no app Orçamentos" do esboço). É a escrita dos apps, a
  antiga 20.1, que vem depois.
- **Avisar o vendedor do Sankhya pelo código dele.** O balão **Avisar** avisa pessoas da empresa
  escolhidas no balão; ligar o vendedor do Sankhya a uma pessoa do Conexus vem depois.
- **Um ramo dentro de outro ramo, laços, passos em paralelo, esperar um tempo, outros gatilhos**
  (um aviso de um fornecedor, um e-mail). O Mastra tem; entram quando um fluxo seu pedir. Os avisos
  de fornecedor são a 20.2.
- **O Membro pedir para publicar um workflow.** Hoje só Dono, Administrador e Desenvolvedor
  montam automações; o pedido do Membro, como o da 24.3.4, vem depois.
- **Os avisos guardados para o próximo cartão**: esta etapa leva dois, o do teste da agenda que
  espera o relógio de verdade (#754) e o do Sankhya de mentira que recusa a consulta (#819), porque
  o gatilho usa os dois; nenhum outro toca workflows ou automações.

**Aprovar esta página é também a sua palavra** para dois mecanismos do Conexus onde o Mastra não
tem um (a regra C75): uma versão do Mastra por publicação, e a tabela que lembra os orçamentos
vistos (com a decisão `B1`); para o uso do workflow dinâmico do Mastra, que ele ainda marca Beta; e
para as permissões das seis tabelas novas e da mudança no registro de envios da 24.5 (a regra D11).

**As decisões suas nesta etapa.**

- **A. Quem é o dono do workflow, e quem aprova?** (a sua H3 de 2026-11-02: "a decisão do dono
  do workflow").
  - `A1` (recomendada): quem publica é o dono. O workflow lê e escreve com o papel dele, como o
    agente publicado (a sua `C1`), e cada execução confere o papel de novo: se ele não pode mais
    montar automações, o workflow pausa, como a automação da 24.2 já faz. Cada balão **Aprovar?**
    nomeia uma pessoa, por padrão quem publicou; ela precisa estar na empresa na hora, e, num
    balão que escreve, ter a escrita no papel. Caso real: o "Request Approval" do Zapier e o
    "Human Input" do Dify escolhem no passo quem responde; no Copilot Studio e no Agentforce o
    agente age com a autoridade de quem o montou. Exemplo: o Desenvolvedor Bruno publica o fluxo e
    põe a Ana no **Aprovar?**. Objetivo: um dono só, e quem aprova visível no balão. Veredito:
    nativo; o workflow para e espera pelo próprio Mastra, e só a pessoa do balão o retoma.
  - `A2`: aprova qualquer pessoa de um papel escolhido no balão (por exemplo, Administradores). Caso
    real: o Zapier aceita vários aprovadores. Mais gente vê, e a primeira resposta vale.
  - `A3`: só quem publicou aprova. Mais simples, mas o esboço já punha "Aprovar? (Ana)" para outra
    pessoa.
- **B. O gatilho do Sankhya.** Pela documentação lida, o Sankhya não chama ninguém quando um
  orçamento entra.
  - `B1` (recomendada): o Conexus olha de tempos em tempos as notas novas dos tipos de operação de
    orçamento que você disser, só lendo, e lembra cada uma pelo número da nota numa tabela nova do
    Conexus, para nunca disparar duas vezes o mesmo orçamento. Ao ligar, só valem os orçamentos
    lançados dali em diante. Nada a ligar no seu Sankhya. Caso real: o activepieces guarda a
    última olhada e começa no "agora" ao ligar; o n8n guarda "a última vez que olhei"; Zapier e
    Pipedream lembram pelo número de cada item. Exemplo: o tipo de operação 999 "Orçamento de
    venda", na ligação "Sankhya matriz". Objetivo: funcionar sem mexer no seu Sankhya. Veredito:
    remendo (a agenda que dispara é do Mastra; lembrar os vistos é do Conexus, porque o Mastra não
    guarda isso).
  - `B2`: usar o registro de alterações do Sankhya. Precisa ligar um parâmetro nas preferências do
    Sankhya Om, guarda só de 3 a 7 dias e diz "mudou", não "nasceu": uma segunda leitura separa o
    novo do editado. Mais leve para o Sankhya, mais coisa para ligar. Veredito: remendo também.
  - `B3`: um programa instalado no seu Sankhya chama o Conexus. Precisa de quem programe no Sankhya
    e de o Conexus receber avisos de fora, que é a 20.2.
  - **E diga**: quais tipos de operação são orçamento, e em qual ligação.
- **C. De quanto em quanto tempo olhar, e o banco acordado.** Cada olhada acorda o banco do Hub (a
  regra D27); a decisão 0009 diz que, acordado o tempo todo, o plano grátis acaba perto do dia 17.
  - `C1` (recomendada agora): a cada 15 minutos, no plano grátis. É o padrão do Make, o do
    Pipedream e o do plano grátis do Zapier. O banco acorda 96 vezes por dia e dorme entre elas
    (estimado, não medido no Neon). Veredito: nativo (a agenda do Mastra).
  - `C2`: a cada 5 minutos, como no esboço, com o plano Launch do Neon (cerca de US$ 19,35 por mês,
    a sua `D1` da 24.2). O Zapier pago olha a cada 2 minutos. Veredito: nativo.
  - `C3`: quem monta escolhe no gatilho (5, 15, 30 ou 60 minutos), e o plano segue o menor que
    estiver ligado. Veredito: nativo.
- **D. Um "Aprovar?" que ninguém responde.**
  - `D1` (recomendada): espera sem prazo, como o cartão da 24.5, e aparece em Automações como
    "Esperando aprovação", com o sino e o e-mail na hora em que começa a esperar. Veredito: nativo.
  - `D2`: vence em 3 dias (o padrão do Dify; o Zapier deixa escolher) e a execução termina como
    "Não aprovado", sem fazer o resto. Veredito: embrulhado (uma volta do Conexus recusa as
    vencidas).
- **E. Um balão que escreve no Sankhya entra já nesta etapa?**
  - `E1` (recomendada): entra. Qualquer escrita do kit que o papel de quem publica usa (hoje
    **Lançar pedido**) vira um balão com a chave **Pergunta antes** (já escolhida) ou **Faz
    sozinho**, a mesma da 24.5: em **Pergunta antes** o workflow espera o **Aprovar** da pessoa do
    balão; em **Faz sozinho** só publica quem tem **Publicar agente que escreve sozinho**. O envio
    passa pelo mesmo funil e pelo mesmo registro, e **Tentar de novo** nunca manda duas vezes.
    Exemplo: depois da aprovação, "lançar o pedido a partir do orçamento". Objetivo: a escrita
    igual em toda a plataforma. Custa cerca de 400 linhas. Veredito: embrulhado (o funil da 24.5).
  - `E2`: fica para a etapa da escrita dos apps. O fluxo do orçamento desta etapa só lê, analisa,
    pede aprovação e avisa.
- **F. Como o trem aparece.** As referências divergem no que a pessoa vê.
  - `F1` (recomendada): cartões em coluna ligados por setas, como no esboço 5 e no editor do
    Zapier; o ramo "se sim" aparece recuado embaixo do balão da pergunta; no celular, a mesma
    coluna. Cada balão mostra o seu estado na execução (esperando, rodando, feito, falhou,
    esperando você, pulado). Você muda conversando, não arrastando. Veredito: embrulhado (as peças
    de tela do Conexus, sem biblioteca de desenho).
  - `F2`: uma tela de caixas e setas que se arrastam, como o n8n, o activepieces e o painel do
    Mastra. Serve melhor a laços e passos em paralelo, que ficam de fora agora, e pede outro
    desenho no celular. Veredito: nativo de uma biblioteca nova (`@xyflow/react`).

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 O workflow como dado | O contrato dos balões e as falhas novas; as tabelas `workflow` e `workflow_version`, a migração e as permissões; a compilação de uma versão para as definições dinâmicas do Mastra (o principal e um por ramo) e o `addDynamicWorkflows` ao publicar; as cinco ferramentas registradas com as suas ids, que falham até a U2; as rotas do rascunho, de publicar e de apagar; quem fala `WORKFLOW` no funil de escrita e a chave execução e balão no registro de envios, com a migração e as permissões | `packages/hub-api/src/`, `apps/server/src/builder/workflows/`, `apps/server/src/builder/mastra/`, `apps/server/src/conversations-of.ts`, `apps/server/src/hub/connectors/`, `apps/server/migrations/`, `apps/server/database-grants.sql` | [data](../guides/data.md) | esta página aprovada; 24.5 U1 e U2 no `main` |
| U2 O gatilho e as execuções | As cinco ferramentas dos balões registradas no `Mastra`; o gatilho dos orçamentos novos (a leitura nova do kit e o seu dublê, o workflow fixo `conexus-workflow-poll`, as tabelas do gatilho), a agenda por workflow, pausar e religar; uma execução por orçamento; a lista e a vista das execuções pelo retrato do Mastra; aprovar e recusar; **Tentar de novo**; a execução cortada por um reinício; o teste com o último orçamento; a lista de Automações com as duas espécies; o sino | `apps/server/src/builder/workflows/`, `apps/server/src/builder/mastra/`, `apps/server/src/builder/automations/`, `apps/server/src/hub/notifications/`, `packages/connectors/src/sankhya/`, `packages/hub-api/src/`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `apps/server/src/main.ts`, `apps/server/src/platform/recordings/` | [testing](../guides/testing.md) | U1 |
| U3 O Construtor monta | As ferramentas do Construtor para workflows (o catálogo, gravar o rascunho inteiro com o que não serve pelo caminho, testar), o seu texto, perguntar quando falta | `apps/server/src/builder/construtor/` | [security](../guides/security.md) | U1, U2 |
| U4 As telas | O trem de balões ao lado da conversa do Construtor e na página do workflow; a página da execução com os balões acesos e o cartão **Aprovar?**; **Publicar**, **Pausar**, **Tentar de novo**; o workflow na lista de Automações | `apps/web/src/builder/workflows/` (novo), `apps/web/src/builder/{automations,agents}/`, `apps/web/src/routes/_app/companies/$companyId/projects/`, `docs/reference/screens.md` | [web](../guides/web.md) | U1, U2 |

Correm em fila: a U2 começa pelo contrato da U1; entre a U1 e a U2 nenhuma execução começa (não há gatilho nem rota de execução), e as ferramentas registradas pela U1 falham com `INTERNAL_UNEXPECTED` se chamadas; a U3 e a U4 correm juntas depois da U2, porque não
dividem pasta. Os textos das falhas novas e das telas ficam em `packages/hub-api` (U1, U2) e na U4.

**O que cada unidade apaga.** U1: nada. U2: a espera do minuto do relógio de verdade no teste da
agenda (#754). U3 e U4: nada. Nenhum código de pg-boss existe para apagar; o texto sai no
fechamento.

**O método das unidades.** Cada unidade segue o `pstack:poteto-mode` como as skills do repositório
já o chamam ([`conexus-scope`](../../.agents/skills/conexus-scope/SKILL.md), passo 4;
[`conexus-build`](../../.agents/skills/conexus-build/SKILL.md)). O cartão não repete o método.

**Orçamento de código alterado.** U1: ~850 (o contrato e as falhas, as tabelas e as duas
migrações, a compilação, publicar, as rotas, quem fala `WORKFLOW` no funil). U2: ~1.450 (as cinco
ferramentas, a leitura nova do kit e o seu dublê, o gatilho e as suas tabelas, a agenda, as
execuções, aprovar e recusar, tentar de novo, o reinício, o teste, a lista, o sino). U3: ~450. U4:
~1.100. Total da etapa: ~3.850, dentro da regra L2 (estimado pela leitura, sem protótipo). Com a
decisão `E2`, a U1 perde ~150 (a migração `e246_workflow_write` e quem fala `WORKFLOW` saem) e a U2 ~250 (a ferramenta de escrever), e saem os critérios 5 e 13 e a última linha da tabela de falhas.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `PUT …/projects/{p}/workflows/{w}/draft` com um `WorkflowDraft` válido grava o rascunho e devolve `{ kind: 'SAVED', workflow }`; um desenho que o esquema aceita mas não serve (um `READ` com operação de escrita, um `AGENT` de agente de outro Projeto ou cuja versão publicada tem escrita, uma referência `{{b9.texto}}` a um balão que não vem antes, um `IF` sobre um campo do gatilho que não é número, um balão depois do `IF` que usa a saída de um balão de dentro do ramo) devolve `{ kind: 'INVALID', issues: [{ path: 'balloons.2.input', message }] }` e não grava; um corpo que o esquema recusa responde `REQUEST_MALFORMED` (C51) | `builder/workflows/routes.test.ts` (novo), "o rascunho" | must |
| 2 | U1 | `POST …/workflows/{w}/publish` grava a versão `n+1`, registra no Mastra `wf-<w>-v<n+1>` e um `wf-<w>-v<n+1>-<balão>` por `IF`, e as linhas aparecem em `mastra.mastra_workflow_definitions` com `status = 'active'`; as da versão `n` continuam `active`; publicar de novo sem mudança no rascunho responde a mesma versão | `builder/workflows/publish.test.ts` (novo), "publicar" | must |
| 3 | U1 | Recusa ao publicar: sem `manageAutomations`, `NOT_IN_ROLE`; uma operação fora do papel de quem publica, `NOT_IN_ROLE`; um `WRITE` em **Faz sozinho** sem `agent: publishUnattendedWrite`, `NOT_IN_ROLE`; uma ligação não liberada ao Projeto, `NOT_GRANTED`; uma pessoa de `APPROVAL` ou `NOTIFY` fora da empresa, `PERSON_NOT_FOUND`; nada se grava e nada vai ao Mastra | `publish.test.ts`, "a publicação recusada" | must |
| 4 | U1 | Depois de um reinício (um Hub novo ao lado do mesmo banco, por `hubBeside`), cada versão publicada está no `Mastra` (`getWorkflowById('wf-<w>-v<n>')`) sem código do Conexus a registrar: o `startWorkers()` a recarrega; uma definição `wf-*` sem versão no Hub é apagada no início (`store.delete` e `removeWorkflow`, como o Mastra apaga uma definição) | `publish.test.ts`, "depois do reinício" | must |
| 5 | U1 | `writeThrough` com `speaker: WORKFLOW` e a chave `RUN` envia ao dublê do Sankhya uma vez e grava a linha de `connector_write` com o workflow, a versão, a execução e o balão; a mesma chave de novo não envia e devolve o que o registro diz; uma linha com chave de conversa e uma com chave de execução nunca se confundem; as recusas da 24.5 (`NOT_IN_ROLE`, `NOT_GRANTED`) valem para quem publicou | `hub/connectors/write.test.ts`, "o workflow escreve" | must (só com `E1`) |
| 6 | U2 | O gatilho: ao ligar (publicar a primeira vez ou religar), uma leitura de base grava como vistas as notas que já existem na janela, sem disparar; um orçamento lançado depois dela, mesmo antes da primeira volta, dispara na volta seguinte; o dublê com três orçamentos novos dos tipos escolhidos dá três execuções, cada uma com o número da nota na entrada; a volta seguinte, com os mesmos três e um novo, dá uma; uma nota de outro tipo não dispara; mais de 20 novos numa volta disparam 20 e o resto na volta seguinte; uma volta que deu certo avança o começo para a hora em que começou, e as notas vistas de mais de dois dias antes do começo saem, sem que uma nota antiga volte a disparar (o relógio injetado passa 10 dias) | `builder/workflows/trigger.test.ts` (novo), "orçamentos novos" | must |
| 7 | U2 | Duas voltas ao mesmo tempo para o mesmo workflow dão uma execução por orçamento; a leitura recusada (`NOT_GRANTED` com a liberação tirada, ou `UNREACHABLE`) não avança o começo, grava a última volta como falha com o código, imprime `WORKFLOW_TRIGGER_FAILED`, e a volta seguinte, com a liberação de volta, dispara o mesmo orçamento uma vez | `trigger.test.ts`, "duas voltas" e "a volta que falhou" | must |
| 8 | U2 | O balão `READ` lê pelo `readThrough` com o papel de quem publicou: o dublê recebe a leitura e a saída do balão traz as linhas; com a operação tirada do papel dele, o balão falha com `NOT_IN_ROLE` e a execução fica `FAILED` nele; uma entrada que não serve à operação falha o balão (a ferramenta recusa, nunca devolve `{ error: true }` como sucesso) | `builder/workflows/tools.test.ts` (novo), "ler" | must |
| 9 | U2 | O balão `AGENT` abre uma conversa nova do agente marcada "Workflow", manda o texto do balão com as referências trocadas pelos valores, e devolve o texto final; a conversa aparece na lista do agente com a marca; um turno que falha ou passa de 15 minutos falha o balão com o código do turno; um agente apagado depois de publicar falha o balão com `AGENT_NOT_FOUND` | `tools.test.ts`, "o agente" | must |
| 10 | U2 | O balão `APPROVAL` para a execução (`WAITING`, com a pessoa e a pergunta) e nada depois dele roda; no mesmo instante a pessoa recebe a notificação "espera sua aprovação" no sino e por e-mail; num `IF` cujo valor não passa, o balão do ramo aparece `SKIPPED` e a execução segue | `tools.test.ts`, "aprovar espera" e "o ramo pulado" | must |
| 11 | U2 | `POST …/runs/{r}/approval` com `approved: true` pela pessoa do balão retoma a execução e o balão seguinte roda; com `approved: false` a execução termina `DECLINED` (o Mastra guarda `canceled`) e nada depois roda; a decisão fica em `workflow_run_decision` com o balão, a pessoa e a hora; uma segunda resposta ao mesmo balão responde `RUN_NOT_WAITING`, e uma execução com dois balões que pedem aprovação recebe uma decisão por balão; uma decisão gravada cuja retomada não aconteceu (o Hub morreu no meio) é retomada no início do Hub; outra pessoa recebe `NOT_APPROVER`; num balão que escreve, a pessoa sem a escrita no papel recebe `NOT_IN_ROLE`; uma execução que espera continua esperando depois de um reinício, e a resposta depois dele funciona, também dentro de um ramo | `builder/workflows/runs.test.ts` (novo), "aprovar e recusar" | must |
| 12 | U2 | Uma execução que espera na versão `n` continua na versão `n` depois de publicada a `n+1` com um balão a mais antes do que espera: aprovada, roda só os balões da versão `n` | `runs.test.ts`, "a versão em que começou" | must |
| 13 | U2 | O balão `WRITE` em **Pergunta antes** para antes de enviar, e o dublê não recebe nada; aprovado, envia uma vez pelo `writeThrough` com `WORKFLOW`; em **Faz sozinho** envia sem parar; **Tentar de novo** depois de um envio não envia de novo e devolve o que o registro diz | `tools.test.ts`, "escrever" | must (só com `E1`) |
| 14 | U2 | `POST …/runs/{r}/retry` numa execução `FAILED` retoma do balão que falhou (`timeTravel`) sem rodar os anteriores (o dublê conta uma leitura do cliente); num balão dentro de um ramo, retoma o ramo do primeiro balão dele e segue (prova P8 do estudo); numa execução que não falhou nem foi interrompida responde `RUN_NOT_FAILED` | `runs.test.ts`, "tentar de novo" | must |
| 15 | U2 | Uma execução `running` de antes do início do Hub aparece `INTERRUPTED`; **Tentar de novo** a termina (`restart()`), do balão em que estava, sem rodar os anteriores; antes de vencer o prazo de posse do Mastra responde `RUN_STILL_OWNED` | `runs.test.ts`, "a interrompida" | must |
| 16 | U2 | Cada volta confere o papel de quem publicou antes de ler: sem `manageAutomations`, nenhuma execução começa, a agenda pausa e o workflow fica `PAUSED_OWNER`, como `run.ts:189-219`; dentro de uma execução, cada balão lê e escreve com o papel dele na hora (critério 8) | `trigger.test.ts`, "o dono perdeu o papel" | must |
| 17 | U2 | `GET …/workflows/{w}/runs` devolve as execuções de todas as versões (pela tabela `workflow_run`, gravada ao começar cada execução), 20 por página, mais novas primeiro, cada uma com a versão, o orçamento, o estado e o de cada balão; `GET …/runs/{r}` traz a saída de cada balão fora de um ramo | `runs.test.ts`, "a lista e a vista" | must |
| 18 | U2 | `POST …/workflows/{w}/test` copia o rascunho para `workflow.test_draft` e o roda como `wf-<w>-teste` sobre o orçamento mais recente dos tipos escolhidos; o `NOTIFY` não avisa, um `WRITE` sempre para antes de enviar, e o teste não entra na lista; um segundo teste substitui a definição de teste | `runs.test.ts`, "o teste" | must |
| 19 | U2 | Pausar o workflow pausa a agenda e nenhuma volta roda; religar marca um começo novo, e um orçamento lançado durante a pausa não dispara; apagar o workflow apaga a agenda e as tabelas do gatilho, apaga as definições no Mastra (`store.delete` e `removeWorkflow`) e responde `WORKFLOW_NOT_FOUND` depois; apagar o Projeto ou a empresa faz o mesmo pelo `releaseFirst` | `builder/workflows/routes.test.ts`, "pausar, religar, apagar" | must |
| 20 | U2 | `GET …/automations` devolve as Automações da 24.2 e os workflows com gatilho numa lista só, cada item com `kind`; as respostas da 24.2 não mudam | `builder/automations/routes.test.ts` (os casos de hoje passam sem mudar), "com os workflows" | must |
| 21 | U3 | O Construtor tem `workflow_catalog`, `save_workflow_draft` e `test_workflow`; com o modelo de mentira, um pedido completo grava o rascunho; um desenho que não serve volta com os problemas pelo caminho e o Construtor o corrige; um pedido sem tipo de operação faz o Construtor perguntar, sem gravar | `builder/construtor/workflow-tools.test.ts` (novo) | must |
| 22 | U3 | Avaliação com o modelo de verdade (opt-in): o pedido do roteiro, passo 1, termina num rascunho com os balões na ordem, o `APPROVAL` dentro do `IF` do valor, e nenhum `WRITE` | `builder/construtor/construtor.eval.test.ts`, "o fluxo do orçamento" | should |
| 23 | U4 | O trem mostra cada balão com o ícone e a marca da espécie ("código", "agente", "aprovação", "escreve"), o seu título, as setas e o ramo "se sim" recuado; o rascunho traz a marca "rascunho"; a 390 px nada sai da tela | `apps/web/src/builder/workflows/train.test.tsx` (novo) | must |
| 24 | U4 | A página da execução mostra cada balão com o seu estado, a saída de um feito ao abrir, o motivo de um que falhou com **Tentar de novo**, e o cartão **Aprovar?** só para a pessoa do balão; para outra pessoa, "Esperando a aprovação de Ana" | `apps/web/src/builder/workflows/run.test.tsx` (novo) | must |
| 25 | U4 | **Publicar** aparece quando o rascunho difere da versão publicada; uma recusa do critério 3 mostra a frase da falha; a página mostra a última volta do gatilho e, se falhou, o motivo | `apps/web/src/builder/workflows/workflow-page.test.tsx` (novo) | must |
| 26 | U4 | Em Automações do Projeto, o workflow aparece com o gatilho, ligado ou pausado, a última execução e quantas esperam aprovação; o Membro não vê Automações (W34) | `apps/web/src/builder/automations/automations.test.tsx`, "o workflow na lista" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| O trem ao lado do Construtor (U4) | "Peça um fluxo ao Construtor" no lugar do trem | o mesmo | o esqueleto do trem | um desenho que não serve: o Construtor diz o problema na conversa | apagado em outra aba: "Este workflow foi apagado" | o Membro não chega ao Construtor (W34) | — |
| A página do workflow (U4) | a versão publicada e "Nenhuma execução ainda. A primeira vem com o próximo orçamento." | o mesmo | o esqueleto | "Tentar de novo" | "Voltar ao início" | o Membro: não encontrado (W34) | "Pausado porque quem publicou não pode mais"; "A última olhada no Sankhya falhou" com o motivo; a recusa de publicar com a frase |
| A página da execução (U4) | os balões com o estado | — | o esqueleto | "Tentar de novo" | "Voltar ao início" | quem não é a pessoa do balão: "Esperando a aprovação de Ana", sem botões | "Não aprovado", "Interrompida", o balão que falhou com o motivo |
| O cartão **Aprovar?** (U4) | a pergunta, o orçamento e os dois botões | — | "Aprovando…" ou "Recusando…" | a falha dita | respondido em outra aba: o estado que a execução diz | sem a escrita no papel: "Seu papel não permite aprovar esta escrita" | "Aprovado por você", "Recusado por você" |
| A lista de Automações (U4) | "Nenhuma automação ainda" e como pedir uma | o mesmo | o esqueleto | "Tentar de novo" | — | o Membro: não encontrado (W34) | um workflow pausado com o motivo |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `WorkflowDraft` (`trigger`, `balloons`) | o Construtor por `save_workflow_draft` (U3), pela rota do rascunho (U1) | a compilação (U1), as ferramentas (U2), o trem (U4) |
| `workflow_version.draft` | publicar (U1) | as ferramentas pela id do Mastra (U2), o gatilho (U2), a página (U4) |
| `WorkflowView.state` (`ON`, `PAUSED`, `PAUSED_OWNER`) | pausar e religar (U2), a reconferência (U2) | a página e a lista (U4), o gatilho (U2) |
| `WorkflowView.lastLap` | a volta do gatilho (U2) | a página (U4) |
| `workflow_trigger.since` | ligar, religar e cada volta que deu certo (U2) | a volta do gatilho (U2) |
| `workflow_trigger_seen` | a volta do gatilho (U2) | a volta do gatilho (U2) |
| `workflow_run` (a execução, a versão, o orçamento, a hora) | a volta do gatilho (U2) | a lista de execuções (U2) |
| `workflow.test_draft` | o teste (U2) | as ferramentas numa id `TEST` (U2) |
| `RunView.state`, `RunView.balloons[].state` | o retrato do Mastra e `workflow_run_decision`, lidos por `runs.ts` (U2) | a página da execução e a lista (U4) |
| `RunView.item`, `RunView.startedAt` | a entrada da execução e o retrato (U2) | a página da execução e a lista (U4) |
| `RunView.waiting` (balão, pessoa, pergunta) | o `suspendPayload` do balão (U2) | o cartão (U4) |
| A notificação "espera sua aprovação" | a ferramenta de aprovar (U2) | o sino e o e-mail (U2, `hub/notifications`) |
| O corpo `{ approved }` | o cartão (U4) | a rota (U2) |
| `workflow_run_decision` | a rota de aprovar (U2) | `runs.ts` (U2) |
| `AutomationSummary.kind`, `waitingCount` | a lista (U2) | a lista de Automações (U4) |
| A linha de `connector_write` com execução e balão | o funil (U1) | o funil (U1), a ferramenta de escrever (U2) |

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
│ [Fale com o Construtor...] ││ 📣 Avisar o Bruno  código  [Publicar]  │   │ 📣 Avisar   [Publicar]   │
└────────────────────────────┘└────────────────────────────────────────┘   └──────────────────────────┘
```

No celular, a conversa e o trem são duas abas, "Conversa" e "Workflow". As capturas das
referências (o editor do Zapier, o do activepieces) a 1280 e a 390 px são tiradas pela U4 antes de
construir, como manda o estudo de uma tela; o estudo não as tirou.

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Gravar o rascunho (`UPDATE workflow.draft`) | a última gravação vence, como o rascunho do agente | — | o banco fora: a falha à conversa, nada gravado | — | 1, 21 |
| Publicar (`INSERT workflow_version` e, na mesma transação antes do `COMMIT`, `addDynamicWorkflows` do ramo e do principal) | a chave `(workflow_id, number)` deixa uma; a outra relê e responde a versão que existe | o Mastra recusa a definição: a transação volta, nada publicado, `WORKFLOW_PUBLISH_REFUSED`; o `COMMIT` falha depois do Mastra: a definição fica sem versão no Hub, as ferramentas a recusam (`WORKFLOW_NOT_FOUND`) e o início a apaga | o banco fora: nada publicado | `WORKFLOW_PUBLISHED` com workflow e versão | 2, 3, 4 |
| A agenda (`mastra.schedules.create`, `pause`, `resume`, `delete`) | uma linha por workflow, id `schedule_wf-<w>`; criar de novo é idempotente, como `automations.ts:143-188` | o Hub morre depois de publicar e antes da agenda: no início, um workflow `ON` sem agenda ganha a sua | o banco fora: a falha à tela, e o estado não muda | `WORKFLOW_SCHEDULED`, `_PAUSED`, `_RESUMED` | 2, 19 |
| A volta do gatilho (a leitura, `INSERT … ON CONFLICT DO NOTHING RETURNING` em `workflow_trigger_seen`, `INSERT workflow_run` e `createRun().start()`, a limpeza das vistas de mais de dois dias antes do começo, o `UPDATE` do começo e da última volta); a leitura de base ao ligar | duas voltas: a chave `(workflow_id, item_key)` deixa uma execução por orçamento | o Hub morre depois do `INSERT` e antes de começar a execução: a linha fica com `run_id` nulo e `baseline` falso; a volta seguinte começa as execuções dessas linhas | o Sankhya fora ou a liberação tirada: o começo não avança, a última volta guarda a falha; o banco fora: nada dispara | `WORKFLOW_TRIGGER_FAILED` com workflow e código, sem as linhas (S40) | 6, 7 |
| A conversa do balão `AGENT` (a conversa nova do agente) | uma por execução e balão: um **Tentar de novo** abre outra | o turno falha: o balão falha com o código; o Hub morre: a execução fica `INTERRUPTED` | o modelo fora: o código do turno | o mesmo da conversa de hoje, com a execução | 9 |
| A notificação de aprovar e o aviso do `NOTIFY` (o sino e o e-mail) | uma por balão e execução; um **Tentar de novo** depois de um balão feito não avisa de novo; um corte no meio do envio e um **Tentar de novo** podem avisar duas vezes (aceito: um aviso a mais, nada escrito) | o e-mail falha: o sino fica e o balão termina com "o e-mail não saiu" | o envio de e-mail fora: igual | `WORKFLOW_NOTIFIED` | 10 |
| Aprovar (`INSERT workflow_run_decision`, depois `run.resume`) | a chave `(run_id, balloon_id)` deixa uma decisão; a outra recebe `RUN_NOT_WAITING`; o Mastra recusa a segunda retomada (`WORKFLOW_RESUME_ALREADY_CLAIMED`) | o Hub morre entre a decisão e a retomada: a execução continua `suspended` com a decisão gravada; no início, o Hub retoma cada decisão gravada cuja execução ainda espera | o banco fora: a falha ao cartão, a execução continua esperando | `WORKFLOW_APPROVED` com execução, balão e pessoa | 11 |
| Recusar (`INSERT workflow_run_decision`, depois `run.cancel()`) | como aprovar | o Hub morre entre a decisão e o `cancel()`: como aprovar | o banco fora: igual | `WORKFLOW_DECLINED` | 11 |
| Tentar de novo (`run.timeTravel` numa falha, `run.restart` numa interrompida) | o Mastra deixa um (`WORKFLOW_TIME_TRAVEL_ALREADY_CLAIMED`, `WORKFLOW_RESTART_RUN_OWNED`); o outro recebe `RUN_NOT_FAILED` ou `RUN_STILL_OWNED` | a definição mudou: não muda, porque cada versão é um id | o banco fora: a falha à tela | `WORKFLOW_RETRIED` | 14, 15 |
| O teste (`addDynamicWorkflow` de `wf-<w>-teste`, depois uma execução) | o segundo teste substitui a definição | o teste falha num balão: o Construtor diz o balão e o motivo | o Sankhya fora: o teste falha na leitura | `WORKFLOW_TESTED` | 18 |
| Pausar, religar, apagar (`UPDATE workflow.state`, a agenda, a leitura de base ao religar; apagar também as tabelas do gatilho e as definições, por `store.delete` e `removeWorkflow`) | a última vence | o Hub morre entre o Hub e o Mastra: no início, a agenda segue o `state` do Hub, e as definições de um workflow apagado saem | o banco fora: nada muda | `WORKFLOW_PAUSED`, `_RESUMED`, `_DELETED` | 19 |
| O balão que escreve (`writeThrough` com `WORKFLOW`) | a chave execução e balão: a segunda chamada lê a linha e não envia | os casos de `WRITE_UNCERTAIN` da 24.5, iguais | os da 24.5, iguais | os da 24.5, com workflow, versão, execução e balão | 5, 13 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O workflow guardado como dado e carregado de novo depois de um reinício | U1 | nenhum: o único `createWorkflow` é o fixo da 24.2, `builder/automations/run.ts:248-256` | `@mastra/core@1.82.0`: `addDynamicWorkflow` (`dist/mastra-D4MXu5BN.js:4180`), `#loadDynamicWorkflows` em `startWorkers()` (`:4305`, `:5175`); `packages/core/src/mastra/index.ts:5909-6045`, `:6054-6119`; `mastra_workflow_definitions` (`packages/core/src/storage/constants.ts:374-389`); doc `dist/docs/references/docs-workflows-dynamic-workflows.md:7-11` (Beta) | A definição em JSON é validada contra o registro vivo, vira um `Workflow` e fica no Postgres; `startWorkers()` a recarrega. Provado no estudo (P1, P2) | nativo (Beta) | — | não precisa | `apps/server/src/builder/workflows/compile.ts` |
| Uma versão publicada não muda debaixo de uma execução aberta | U1 | o agente: uma versão por publicação (`builder/agents/tables.ts:71`) | Mastra 1.82: a definição não tem versão (`constants.ts:374-389`); a execução copia o grafo vivo ao ser criada (`workflows/workflow.ts:3083`); activepieces `packages/core/execution/src/lib/flows/flow-version.ts:16-23`; n8n `@n8n/db/src/entities/workflow-history.ts:12-27`; Vercel Workflow prende a execução ao deploy em que começou (documentado) | Provado no estudo (P2): com o mesmo id, a retomada depois do reinício roda o grafo novo. Cada versão publicada é um id próprio, `wf-<w>-v<n>`, `active` enquanto o workflow existe | remendo | P2 com `@mastra/core@1.82.0`; critério 12; [boundaries](../reference/boundaries.md), "a published workflow version is its own workflow id" | a aprovação desta página | `apps/server/src/builder/workflows/tables.ts` |
| Os balões e as ligações entre eles | U1 | nenhum | Mastra 1.82: as entradas da definição (`dist/docs/references/reference-workflows-dynamic-workflow-definition.md:52-68`); o mapeamento declarativo (`packages/core/src/workflows/dynamic/mapping-config.ts:51-60`); o `conditional` e o seu predicado, e um ramo com mais de um passo como workflow aninhado (`workflows/builder/authoring-playbook.ts:7`, `:310-343`, `:373`); activepieces, uma lista de passos com o ramo por ROUTER (`flows/actions/action.ts:7-13`) | Cada balão vira um `mapping` (o id do balão e os valores que ele usa) seguido de um `tool` do Conexus; um `IF` vira um `mapping` de cima com o que o ramo usa, e um `conditional` com um ramo, um `workflow` aninhado com os balões do ramo, que leem `initData`. Provado no estudo: espera dentro do ramo e retoma num processo novo, e o ramo não tomado fica fora de `steps` (P5); o ramo recebe os valores de fora pelo `mapping` de cima, e uma fonte `step` + `path` que a saída da ferramenta não declara é recusada, enquanto `template` passa (P8) | embrulhado: o balão e a compilação são nossos; o grafo e a execução são do Mastra | — | não precisa | `packages/hub-api/src/workflows.ts`, `compile.ts` |
| Ler um sistema num balão | U2 | `readThrough` (`hub/connectors/read.ts`), as leituras do Sankhya (`packages/connectors/src/sankhya/operations/index.ts:19-44`) | Mastra 1.82: a entrada `tool` resolve por `mastra.getTool` (`workflows/dynamic/rehydrate.ts:418-425`); a entrada chama `tool.execute` direto (`workflows/entry-executors/run-tool-entry.ts:58`); o contexto traz `workflowId` e `runId` (`dist/tools/types.d.ts:202-212`); provado no estudo (P2): uma entrada inválida volta `{ error: true }` e a execução termina `success` | A ferramenta `conexus-ler` acha o balão pela id do Mastra do contexto, confere a própria entrada e lança uma falha, e lê pelo funil de hoje com o papel de quem publicou | embrulhado: o funil de leitura de hoje | — | não precisa | `apps/server/src/builder/workflows/tools.ts` |
| Um agente num balão | U2 | a conversa nova da automação, `run.ts:220-229`, e o agente publicado (`builder/agents/registry.ts:49-69`) | Mastra 1.82: `createStep(agent)` chama `agent.stream` sem tratar aprovação (`workflows/entry-executors/run-agent-entry.ts:166-173`); provado no estudo (P3): com uma ferramenta que pergunta, o passo nunca termina | O balão abre uma conversa nova do agente, marcada "Workflow", como a automação abre a do Assistente, e devolve o texto final; um agente cuja versão tem escrita não entra | embrulhado: o passo `converse` da 24.2 sobre a conversa do agente | P3 | não precisa | `tools.ts` |
| "Aprovar?" no meio do workflow, e recusar | U2 | o cartão da conversa (24.5), só na memória do Hub | Mastra 1.82: uma ferramenta suspende por `context.workflow.suspend` (`dist/docs/references/reference-tools-create-tool.md:75-77,105`); `run.resume` (`dist/agent-BP9OWM6D.js:11239`) e a segunda retomada recusada (`reference-workflows-run-methods-resume.md:102-122`); `run.cancel` guarda `canceled` (`workflows/workflow.ts:4087-4126`); o roteiro de autoria diz que um grafo guardado não suspende (`authoring-playbook.ts:566`), mas uma ferramenta registrada suspende; Zapier "Request Approval" e Dify "Human Input" (documentados, 2026-11-07); n8n `nodes-base/utils/sendAndWait/utils.ts` | Provado no estudo: suspenso num processo, retomado noutro (P2), também dentro de um ramo (P5); `cancel()` num processo novo guarda `canceled` e nada depois roda (P6) | nativo | — | a decisão A e a D | `tools.ts`, `runs.ts` |
| Escrever num sistema num balão | U1, U2 | `writeThrough` (`hub/connectors/write.ts:154-183`), `connector_write` com chave empresa, conversa e `toolCallId` (`hub/connectors/tables.ts:205-250`), a chave da 24.5 (`builder/agents/tools.ts:110-142`) | Mastra 1.82: `requireApproval` não vale num passo de workflow (nenhuma ocorrência em `packages/core/src/workflows` fora de testes); provado no estudo (P3): a ferramenta roda sem perguntar; `resolveToolApprovalVerdict` só no laço do agente (`dist/agent-BP9OWM6D.js:15127`) | A ferramenta `conexus-escrever` suspende antes de enviar em **Pergunta antes** e envia pelo `writeThrough` com `WORKFLOW` e a chave execução e balão | embrulhado: o funil da 24.5 com uma chave nova | P3 | a decisão E; as permissões pela aprovação desta página | migração `e246_workflow_write` |
| Avisar uma pessoa | U2 | `deps.notify.automationRan` (`run.ts:230-247`), `hub/notifications` (24.2) | Zapier e Make mandam e-mail ou mensagem por um passo (documentados) | O sino e o e-mail de hoje, com dois tipos novos (aprovar, avisar) | embrulhado | — | não precisa | `tools.ts` |
| O gatilho: orçamentos novos no Sankhya | U2 | as Automações disparam só por horário (`builder/automations/cadence.ts:22`, `cronOf`) | Sankhya: nenhuma página de aviso para fora no índice `developer.sankhya.com.br/llms.txt`; `logAlteracoesTabelas` pede o parâmetro LOGTABOPER e guarda 3 a 7 dias (documentado, 2026-11-07); activepieces `packages/pieces/common/src/lib/polling/index.ts:38-140` (o começo em `Date.now()` ao ligar, `:119-134`); n8n `nodes-base/nodes/Airtable/AirtableTrigger.node.ts:249,274`; Pipedream `dedupe: "unique"`; Zapier deduplica pelo `id` (documentado) | Olhar de tempos em tempos as notas dos tipos escolhidos, lembrar as vistas pelo número da nota, e começar uma execução por orçamento novo | remendo: o agendador do Mastra só publica `workflow.start` e não guarda cursor (`workflows/scheduler/scheduler.ts:18-29`) | `@mastra/core@1.82.0` lido: sem cursor; critérios 6 e 7 com o dublê; [boundaries](../reference/boundaries.md), "the trigger remembers what it has seen" | a decisão B | `apps/server/src/builder/workflows/trigger.ts`, migração `e246_workflow_trigger` |
| A agenda do gatilho | U2 | `mastra.schedules.create` (`builder/automations/automations.ts:143-188`), data D27 | Mastra 1.82 `mastra.schedules` (`dist/schedules/schedules.d.ts:181-189`); um disparo perdido não volta (`docs-workflows-scheduled-workflows.md:45`) | Uma linha de agenda por workflow ligado, no workflow fixo `conexus-workflow-poll` | nativo | — | a decisão C | `trigger.ts` |
| A lista de execuções e cada balão aceso | U2, U4 | `builder/automations/runs.ts:122-190` | Mastra 1.82 `listWorkflowRuns` (`workflows/workflow.ts:3517`), `WorkflowRunState` (`workflows/types.ts:409-450`), os estados (`:305-316`); n8n `packages/workflow/src/execution-status.ts:1-12`; activepieces `flow-execution.ts:5-23`; provado no estudo (P5): só o principal tem retrato, e o ramo guarda a saída final e a retomada | O estado de cada balão vem do retrato do Mastra (fora de um ramo, por passo; dentro, pelo caminho suspenso e pelo fim do ramo) e da decisão gravada; a lista de uma workflow com várias versões vem de `workflow_run`, porque `listWorkflowRuns` é por id | embrulhado: o índice `workflow_run` | — | não precisa | `apps/server/src/builder/workflows/runs.ts` |
| Tentar de novo | U2 | nenhum (a 24.2 não repete) | Mastra 1.82 `run.timeTravel` (`dist/agent-BP9OWM6D.js:11833`), `run.restart` (`:11267`), a posse de 15 s (`packages/core/src/agent/run-ownership.ts:9`, `workflows/run-ownership.ts:6`) | Provado no estudo: `timeTravel` termina uma falha sem rodar os anteriores (P4, P6), e num balão de dentro de um ramo refaz o ramo do começo (P8); numa execução que ficou `running`, `timeTravel` recusa e `restart()` a termina depois da posse vencer (P7, fora de um ramo) | nativo | — | não precisa | `runs.ts` |
| Montar o workflow conversando | U3 | o Construtor monta agentes (`builder/construtor/tools.ts:105-238`) | Mastra Code: `create-workflow` entrega o pedido a um subagente (`mastracode/sdk/src/tools/workflows/create-workflow.ts:30-59`) que grava o desenho inteiro com `save-workflow` (`save-workflow.ts:41`); `createWorkflowBuilderAgent` (`packages/core/src/workflows/builder/agent.ts:17-24`); activepieces `ap_build_flow` (`packages/server/api/src/app/mcp/tools/ap-build-flow.ts:47`); Zapier Copilot e Make Maia (documentados) | O modelo grava o desenho inteiro numa ferramenta que valida e devolve os problemas pelo caminho; o roteiro do Mastra escreve o grafo cru e diz que não suspende, por isso o Construtor escreve balões | embrulhado: as ferramentas do Construtor | — | não precisa | `apps/server/src/builder/construtor/workflow-tools.ts` |
| O trem de balões na tela | U4 | nenhum | painel do Mastra `@xyflow/react` e `@dagrejs/dagre` (`packages/playground-ui/package.json:194,206`); activepieces `@xyflow/react` 12.3.5; n8n Vue Flow 1.48; Zapier, lista vertical (documentado); o esboço 5 | Cartões em coluna ligados por setas, o ramo "se sim" recuado | embrulhado: as peças de `ui/`, sem biblioteca de desenho (com `F1`) | — | a decisão F | `apps/web/src/builder/workflows/train.tsx` |
| Quem monta, publica e responde | U1, U2 | `manageAutomations` (`hub/identity/admission.ts:103`); `agent: publishUnattendedWrite` (`hub/identity/roles.ts:37`); a reconferência, `run.ts:189-219` | Zapier e Dify escolhem quem aprova no passo; no Copilot Studio e no Agentforce, a autoridade é de quem montou (cartão da 24.5) | Quem publica é o dono; cada volta e cada execução reconferem; quem aprova é escolhido no balão | embrulhado | — | a decisão A | — |
| As Automações da 24.2 | fica de fora: continuam como estão | uma linha de agenda sobre `conexus-automation-run`, sem tabela do Hub (`automations.ts:249-251`); o pg-boss não aparece em nenhum `package.json` nem no `package-lock.json` | — | A lista de Automações mostra as duas espécies (U2, U4); o texto do pg-boss sai no fechamento (`roadmap.md:71`, `decisions/0058:15`) | nativo, sem mudança | — | não precisa | — |

As linhas citadas do Mastra sem `dist/` são do `mastra@6e8dfcb8` (a etiqueta `@mastra/core@1.82.0`);
as do activepieces em `f34c43cd`, as do n8n em `2e855356`, as do Mastra Code no mesmo `6e8dfcb8`.
As provas P1 a P7 rodaram fora do repositório com `@mastra/core` 1.82.0, `@mastra/pg` 1.35.0 e
Postgres 18; o relatório do estudo guarda os scripts e as saídas.

**A medida do transplante.** Nada vem do produto antigo: ele não tinha workflows.

**A dívida.**

- `docs/architecture.md:215` diz que o Mastra lê a agenda a cada 10 s; a regra D27 diz que dorme
  até o próximo disparo. O fechamento acerta a arquitetura.
- O texto do pg-boss (`roadmap.md:71`, `decisions/0058:15`) sai no fechamento.
- Uma versão nunca é arquivada enquanto o workflow existe; com muitas edições, o início carrega
  mais definições. Gatilho: mais de 50 versões num workflow.
- Dentro de um ramo, a página mostra o estado de cada balão, mas a saída só do último (o Mastra
  guarda só o fim do ramo). Gatilho: um ramo com mais de um balão de leitura.

**O que fica por conferir no fim, com o Sankhya de verdade.** Os nomes dos campos do orçamento em
`CabecalhoNota` (o número, o tipo de operação, a data de negociação, o valor, o cliente) estão no
dublê como a documentação os dá; a gravação T26 da leitura nova, feita pelo fundador só lendo,
confirma. O limite de chamadas do Sankhya não está documentado; uma volta faz uma leitura.

## U1 O workflow como dado

**Base e modelo.** `main` do dia, depois da 24.5. Opus: o contrato cruza o Hub, o Mastra e o funil
de escrita, e a chave nova do registro de envios é concorrência.

### As linhas da tabela

- **O workflow guardado.** Ler `builder/mastra/mastra.ts:20-28` (o `new Mastra`) e `hub-mastra.ts:46-125`
  (o `start`, que chama `startWorkers()` em `:100`). API: `mastra.addDynamicWorkflows(defs)`
  (`dist/mastra-D4MXu5BN.js:4213`), que ordena os aninhados e volta atrás se um falha; os campos
  da definição (`reference-workflows-dynamic-workflow-definition.md:13-24`) e as entradas
  (`:52-68`); a validação devolve problemas com caminho (`:336-344`).
- **A versão.** Modelo: `builder/agents/tables.ts:29` (`agent`), `:71` (`agentVersion`) e
  `publish.ts`.
- **Os balões.** O `conditional` com um ramo `workflow` (`authoring-playbook.ts:7`, `:310-343`,
  `:373`) e o predicado declarativo; o `mapping` (`mapping-config.ts:51-60`), cujas fontes são
  `value`, `template`, `initData` e `step` + `path`. A prova P5 do estudo (`p5-defs.mjs`) é a forma
  que funcionou.
- **Escrever.** `hub/connectors/write.ts:154-183`, `write-record.ts:222` (`register`), `:298`
  (`openWritesOf`), `tables.ts:205-250` (a chave e o `check` `connector_write_speaker`), `markOf`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/workflows.ts`, `workflow-failures.ts` | Cria | o servidor, a web |
| `packages/hub-api/src/failures.ts` | Muda (espalha `WORKFLOW_FAILURES`) | todo o Hub |
| `apps/server/src/builder/workflows/` | Cria (`tables.ts`, `ids.ts`, `compile.ts`, `publish.ts`, `routes.ts`, `public.ts`, `tools.ts` só com as ids) | `conversations-of.ts`, a U2, a U3 |
| `apps/server/src/conversations-of.ts` | Muda (as rotas) | `main.ts` |
| `apps/server/src/builder/mastra/` | Muda (`mastra.ts`: as `tools`; `hub-mastra.ts`: apagar as definições sem versão no início) | `main.ts` |
| `apps/server/src/hub/connectors/` | Muda (`write.ts`, `write-record.ts`, `tables.ts`: `WORKFLOW` e a chave `RUN`) | `builder/agents/tools.ts`, a U2 |
| `apps/server/migrations/`, `database-grants.sql` | Cria (`e246_workflow`, `e246_workflow_write`) | o catálogo (`catalog.test.ts`) |

### Os contratos que a unidade cria

Em `packages/hub-api/src/workflows.ts`:

```ts
export const WorkflowId = z.uuid().brand<'WorkflowId'>()
export const BalloonId = z.string().regex(/^b[0-9]{1,3}$/).brand<'BalloonId'>()

/** Um valor do gatilho ou de um balão anterior: '{{gatilho.valor}}', '{{b2.texto}}'. */
export const Template = z.string().max(2000)
/** Um campo do orçamento que disparou, o único lugar de onde um `IF` lê um número (prova P8). */
export const TriggerField = z.enum(['valor'])
/** O que o gatilho entrega a cada execução: a entrada do workflow, com o esquema declarado. */
export const QuoteInput = z.object({
  numero: z.number().int().positive(), tipo: z.number().int().positive(),
  data: z.iso.date(), valor: z.number(), cliente: z.number().int().positive(),
})

export const Trigger = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('SANKHYA_NEW'),
    connectionId: ConnectionId,
    operationTypes: z.array(z.number().int().positive()).min(1).max(20),
    everyMinutes: z.literal(15), // a decisão C: C2 troca por 5; C3 por z.union de 5, 15, 30 e 60
  }),
])

const Leaf = [
  z.object({ kind: z.literal('READ'), id: BalloonId, title: z.string().min(1).max(80),
    connectionId: ConnectionId, operation: OperationName, input: z.record(z.string(), Template) }),
  z.object({ kind: z.literal('AGENT'), id: BalloonId, title: z.string().min(1).max(80),
    agentId: AgentId, prompt: Template }),
  z.object({ kind: z.literal('APPROVAL'), id: BalloonId, title: z.string().min(1).max(80),
    approver: PersonId, question: Template }),
  z.object({ kind: z.literal('WRITE'), id: BalloonId, title: z.string().min(1).max(80),
    connectionId: ConnectionId, operation: OperationName, input: z.record(z.string(), Template),
    approval: z.enum(['ASK', 'AUTO']), approver: PersonId }), // só com E1
  z.object({ kind: z.literal('NOTIFY'), id: BalloonId, title: z.string().min(1).max(80),
    people: z.array(PersonId).min(1).max(10), message: Template }),
] as const
export const LeafBalloon = z.discriminatedUnion('kind', Leaf)
export const Balloon = z.discriminatedUnion('kind', [
  ...Leaf,
  z.object({ kind: z.literal('IF'), id: BalloonId, title: z.string().min(1).max(80),
    value: TriggerField, op: z.enum(['GT', 'GTE', 'LT', 'LTE', 'EQ', 'NEQ']), than: z.number(),
    then: z.array(LeafBalloon).min(1).max(10) }),
])

export const WorkflowDraft = z.object({
  name: z.string().min(1).max(80),
  trigger: Trigger,
  balloons: z.array(Balloon).min(1).max(20),
})

export const WorkflowState = z.enum(['ON', 'PAUSED', 'PAUSED_OWNER'])
export const WorkflowView = z.object({
  id: WorkflowId, projectId: ProjectId, name: z.string(),
  draft: WorkflowDraft.nullable(),
  published: z.object({ number: z.number().int().positive(), draft: WorkflowDraft,
    publishedBy: PersonId, publishedAt: z.iso.datetime() }).nullable(),
  state: WorkflowState,
  lastLap: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('OK'), at: z.iso.datetime(), started: z.number().int() }),
    z.object({ kind: z.literal('FAILED'), at: z.iso.datetime(), code: z.string() }),
  ]).nullable(), // escrito pela U2
})

export const DraftSaved = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('SAVED'), workflow: WorkflowView }),
  z.object({ kind: z.literal('INVALID'), issues: z.array(z.object({ path: z.string(), message: z.string() })) }),
])
```

`OperationName` é o nome de operação do kit de hoje (`packages/connectors`), conferido contra a
lista do conector e a classe (`read` num `READ`, `write` num `WRITE`) na validação do rascunho.
Um `IF` não tem `IF` dentro, e nenhum balão depois de um `IF` usa a saída de um balão de dentro do
ramo. O texto `{{gatilho.<campo>}}` vira o `template` do Mastra com `${initData.<campo>}` e
`{{bN.<campo>}}` com `${stepResults.<id do passo de bN>.<campo>}`; nunca uma fonte `step` + `path`,
que o Mastra confere contra o esquema de saída da ferramenta e recusa (prova P8). Antes de cada
`conditional`, um `mapping` de cima entrega ao ramo, com nomes próprios, cada valor de fora que os
balões do ramo usam (como `template`) e o campo do `IF` (como `initData` + `path`); dentro do ramo,
as referências de fora viram `${initData.<nome>}`. A compilação é a única dona dessa gramática
(C26).

Em `apps/server/src/builder/workflows/ids.ts`, a dona dos ids do Mastra:

```ts
export type MastraWorkflowId =
  | { kind: 'VERSION'; workflowId: WorkflowId; version: number }        // wf-<w>-v<n>
  | { kind: 'BRANCH'; workflowId: WorkflowId; version: number; balloon: BalloonId } // wf-<w>-v<n>-<b>
  | { kind: 'TEST'; workflowId: WorkflowId; branch: BalloonId | null }   // wf-<w>-teste[-<b>], lê workflow.test_draft
export function parseMastraWorkflowId(raw: string): MastraWorkflowId | null
export function mastraWorkflowIdOf(id: MastraWorkflowId): string
```

Rotas (acesso `manageAutomations` no Projeto; a empresa, o Projeto e a pessoa vêm da sessão, S9):

- `GET /api/companies/{c}/projects/{p}/workflows/{w}` → `WorkflowView`; `WORKFLOW_NOT_FOUND`.
- `PUT …/workflows/{w}/draft` corpo `WorkflowDraft` (um `{w}` novo cria o workflow) →
  `DraftSaved`; `REQUEST_MALFORMED` quando o esquema recusa.
- `POST …/workflows/{w}/publish` → `WorkflowView`; `NOT_IN_ROLE`, `NOT_GRANTED`,
  `PERSON_NOT_FOUND`, `WORKFLOW_PUBLISH_REFUSED`.
- `DELETE …/workflows/{w}` → 204.

`WORKFLOW_FAILURES` em `packages/hub-api/src/workflow-failures.ts`, cada um com categoria, estado
HTTP, frase e ação, como `automation-failures.ts`: `WORKFLOW_NOT_FOUND` (404),
`WORKFLOW_PUBLISH_REFUSED` (409), `PERSON_NOT_FOUND` (409), `RUN_NOT_FOUND` (404),
`RUN_NOT_WAITING` (409), `NOT_APPROVER` (403), `RUN_NOT_FAILED` (409), `RUN_STILL_OWNED` (409);
`AGENT_NOT_FOUND` já existe (`agent-failures.ts:11`) e é reusado. As frases vão com os textos das telas ao fundador.

Tabelas (esquema do Hub, `company_id` e a política de linha como as do agente, regra D11; as
permissões num pull request próprio da unidade):

- `workflow(id uuid pk, company_id, project_id fk on delete cascade, name text not null, draft jsonb
  null, test_draft jsonb null, state text not null check in ('ON','PAUSED','PAUSED_OWNER'),
  created_by, created_at)`; `test_draft` é escrito pela U2.
- `workflow_version(workflow_id fk on delete cascade, number int, draft jsonb not null,
  published_by not null, published_at not null, primary key (workflow_id, number))`.
- Lidas de volta, `draft` passa por `WorkflowDraft.parse` (C27).

O funil de escrita (`hub/connectors/write.ts`):

```ts
type Speaker =
  | { kind: 'PERSON'; personId: PersonId }
  | { kind: 'VERSION'; agentId: AgentId; versionNumber: number }
  | { kind: 'WORKFLOW'; workflowId: WorkflowId; versionNumber: number; publishedBy: PersonId }
type WriteKey =
  | { kind: 'CONVERSATION'; threadId: ConversationId; toolCallId: string }
  | { kind: 'RUN'; runId: WorkflowRunId; balloonId: BalloonId }
```

`WorkflowRunId` é a id de execução do Mastra (uuid), com marca, em `packages/hub-api/src/workflows.ts`.
A migração `e246_workflow_write` em `connector_write`: tira a chave primária
`(company_id, thread_id, tool_call_id)`; deixa `thread_id` e `tool_call_id` aceitarem nulo;
acrescenta `run_id text`, `balloon_id text`, `workflow_id uuid` e `workflow_version int`; põe dois
índices únicos parciais, `(company_id, thread_id, tool_call_id) where run_id is null` e
`(company_id, run_id, balloon_id) where run_id is not null`; um `check` que exige exatamente uma das
duas chaves; e reescreve `connector_write_speaker` para as três espécies. `markOf` recebe `WriteKey`.
`openWritesOf` continua só por conversa.

**O dono de cada fato.** O desenho publicado: `workflow_version.draft` (o Mastra guarda a
compilação, nunca o desenho). Quem publicou: `workflow_version.published_by`. A classe de cada
operação: o kit, como na 24.5. Os ids do Mastra: `ids.ts`. O arquivo tomado como modelo:
`builder/agents/tables.ts` e `publish.ts`, que cumprem C21, C23 e C26.

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/server/src/builder/` e `packages/hub-api`: a
skill `mastra` (com a doc instalada primeiro), `fastify-best-practices`, `typescript-magician`.

### A ordem do trabalho

1. O contrato e as falhas em `hub-api`, com o teste de esquema. Regras: C21, C23, C27, C28, C51.
2. As tabelas e a migração `e246_workflow`; as permissões num pull request próprio (D11).
3. `ids.ts` e a compilação (`compile.ts`): `WorkflowDraft` e a versão → as definições do Mastra
   (o principal, com `inputSchema` de `QuoteInput`, e um por `IF`), sem I/O, com teste de mesa.
   Cada balão-folha vira `mapping` (`{ balloon: { value: '<id>' }, …os valores do template… }`) e
   `tool`; cada `IF`, o `mapping` de cima e o `conditional` com o ramo aninhado. A forma é a da
   prova P8 do estudo (`p8.mjs`). As ferramentas são as da U2 (`conexus-ler`, `conexus-agente`,
   `conexus-aprovar`, `conexus-escrever`, `conexus-avisar`); os testes da U1 trocam o `execute`
   por um que devolve a entrada.
4. A validação do rascunho: o esquema, depois as regras que pedem o banco (o agente, a ligação, a
   operação e a classe, as referências que vêm antes, o campo numérico do `IF`).
5. Publicar (`publish.ts`): a conferência do papel; na transação, o `INSERT` da versão e, antes do
   `COMMIT`, `addDynamicWorkflows` com o ramo e o principal; recusado, a transação volta. No início
   (`hub-mastra.ts`, depois de `startWorkers()`), apagar as definições `wf-*` sem versão no Hub como
   o Mastra apaga uma (`store.delete(id)` no domínio `workflowDefinitions` e `mastra.removeWorkflow(id)`,
   `packages/server/src/server/handlers/dynamic-workflows.ts:161-185` em `6e8dfcb8`).
   As cinco ferramentas entram no `new Mastra({ tools })` com as suas ids e um `execute` que lança
   `INTERNAL_UNEXPECTED` até a U2.
6. A migração `e246_workflow_write` e quem fala `WORKFLOW` no funil.

### Como se prova

Critérios 1 a 5, pelo servidor de verdade (`hubBeside`) e o dublê do Sankhya; o critério 4 abre um
segundo Hub ao lado do mesmo banco.

### Parar se

- O `addDynamicWorkflows` recusar uma ferramenta registrada no `new Mastra({ tools })`: relatar com
  a saída; não registrar por fora.
- O predicado do `conditional` não comparar o número de um `TriggerField` entregue pelo `mapping`
  de cima: relatar; não escrever uma comparação nossa sem o cartão.
- `addDynamicWorkflows` não puder rodar dentro da transação do Hub (outra conexão do Mastra ao mesmo
  banco espera a transação): relatar; a ordem muda só com o cartão.

## U2 O gatilho e as execuções

**Base e modelo.** A U1 no `main`. Opus: duas voltas ao mesmo tempo, a retomada e o reinício.

### As linhas da tabela

- **As ferramentas.** O contexto `dist/tools/types.d.ts:202-212` (`workflowId`, `runId`,
  `suspend`, `resumeData`); `suspendSchema` e `resumeSchema` (`reference-tools-create-tool.md:75-77`);
  as provas P2 e P5 do estudo (`gateTool`). Ler: `hub/connectors/read.ts`. O agente:
  `builder/automations/run.ts:220-229` e a função `conversed`; `builder/agents/registry.ts:49-69`.
  Escrever: o funil da U1. Avisar: `run.ts:230-247` e `hub/notifications`. Cada ferramenta tem
  `inputSchema: z.unknown()`, confere a entrada ela mesma e lança uma `Failure` (prova P2: o Mastra
  devolveria `{ error: true }` como sucesso).
- **O gatilho.** O modelo é o activepieces (`packages/pieces/common/src/lib/polling/index.ts:38-140`):
  ao ligar, o começo é o agora (`:119-134`); cada volta lê, guarda o que é novo e dispara. A leitura
  nova do kit, `orcamentosNovos` (classe `read`, sem oferta ao modelo), lê `CabecalhoNota` pela
  porta `carregar` (`packages/connectors/src/sankhya/door.ts:69-100`, o `loadRecords`) com o
  critério dos tipos e da data de negociação desde o começo menos um dia (a data é sem hora; o
  número da nota tira a repetição). O dublê ganha as notas de orçamento (o #819).
- **A agenda.** `builder/automations/automations.ts:143-188` (criar idempotente), `run.ts` (um
  workflow fixo que a agenda dispara, e a reconferência `:189-219`). O id fixo
  `conexus-workflow-poll` é um contrato guardado, como `AUTOMATION_WORKFLOW` (`run.ts:22-27`).
- **As execuções.** `builder/automations/runs.ts:70-190` é o modelo; `getWorkflowRunById`,
  `listWorkflowRuns`, `run.resume`, `run.cancel`, `run.timeTravel`, `run.restart` (as linhas da
  tabela). As provas P5 a P7 do estudo são as formas que funcionaram: retomar sem `step` acha o
  caminho suspenso; recusar é `cancel()`; a interrompida é `restart()` depois da posse.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/sankhya/` | Muda (`operations/vendas.ts`: `orcamentosNovos`; o dublê) | `hub/connectors/` |
| `apps/server/src/builder/workflows/` | Cria (`tools.ts`, `trigger.ts`, `runs.ts`, `run-routes.ts`) | `conversations-of.ts` |
| `apps/server/src/builder/mastra/` | Muda (`mastra.ts`: as `tools`; `hub-mastra.ts`: a agenda segue o `state` no início, e o `releaseFirst` dos workflows) | `main.ts` |
| `apps/server/src/main.ts` | Muda (os workflows no `releaseFirst` e no início) | — |
| `apps/server/src/builder/automations/` | Muda (`routes.ts`: a lista com as duas espécies) | a web |
| `apps/server/src/hub/notifications/` | Muda (dois tipos novos) | o sino, o e-mail |
| `packages/hub-api/src/{workflows,automations,workflow-failures}.ts` | Muda | o servidor, a web |
| `apps/server/migrations/`, `database-grants.sql` | Cria (`e246_workflow_trigger`) | o catálogo |
| `apps/server/src/platform/recordings/` | Cria as gravações do retrato do Mastra | os testes |

### Os contratos que a unidade cria

- Tabelas: `workflow_trigger(workflow_id pk fk on delete cascade, since timestamptz not null,
  last_lap jsonb null)`, `workflow_trigger_seen(workflow_id fk on delete cascade, item_key text,
  run_id text null, seen_at timestamptz not null, baseline boolean not null, primary key
  (workflow_id, item_key))`, `workflow_run(run_id text pk, workflow_id fk on delete cascade,
  version int not null, item_key text not null, item_label text not null, started_at timestamptz
  not null)`, `workflow_run_decision(run_id text, balloon_id text, workflow_id fk on delete
  cascade, person_id not null, approved boolean not null, decided_at timestamptz not null, primary
  key (run_id, balloon_id))`. `since` avança, a cada volta que deu certo, para a hora em que ela
  começou; a volta lê as notas com data de negociação desde o dia de `since` menos um; as vistas
  com `seen_at` de mais de dois dias antes de `since` saem na própria volta. A leitura de base, ao
  ligar e ao religar, grava as notas da janela com `baseline = true` e sem execução.
- O que a ferramenta de aprovar suspende (`suspendSchema`) e retoma (`resumeSchema`):
  `{ balloonId, approver: PersonId, question: string }` e `{ approved: true }`.
- `RunView` em `hub-api`:

```ts
export const RunState = z.enum(['RUNNING', 'WAITING', 'DONE', 'FAILED', 'DECLINED', 'INTERRUPTED'])
export const BalloonState = z.enum(['PENDING', 'RUNNING', 'DONE', 'FAILED', 'WAITING', 'SKIPPED'])
export const RunView = z.object({
  runId: WorkflowRunId, versionNumber: z.number().int().positive(),
  item: z.object({ key: z.string(), label: z.string() }).nullable(),
  state: RunState,
  balloons: z.array(z.object({ id: BalloonId, state: BalloonState,
    output: z.unknown().optional(), failure: z.string().optional() })),
  waiting: z.object({ balloonId: BalloonId, approver: PersonId, question: z.string() }).nullable(),
  decision: z.object({ approved: z.boolean(), by: PersonId, at: z.iso.datetime() }).nullable(),
  startedAt: z.iso.datetime(),
})
```

  O retrato do Mastra é lido com um esquema Zod do que o Conexus usa (o estado, `suspendedPaths`,
  o `suspendPayload`, a saída e o erro de cada passo), gravado com `npm run record` (T26) num
  `suspended`, `success`, `failed`, `canceled` e `running`.
- Rotas: `GET …/workflows/{w}/runs?page=`, `GET …/runs/{r}`, `POST …/runs/{r}/approval`
  `{ approved: boolean }`, `POST …/runs/{r}/retry` (o balão vem do retrato), `POST
  …/workflows/{w}/pause`, `…/resume`, `POST …/workflows/{w}/test`.
- `AutomationSummary` ganha `kind: 'ASSISTANT' | 'WORKFLOW'` e, num workflow, `waitingCount`.

### As skills e a leitura

As da U1, e [testing](../guides/testing.md) T26 para as gravações.

### A ordem do trabalho

1. `orcamentosNovos` no kit e o dublê; a gravação T26 da leitura no Sankhya de verdade fica para o
   fundador, no fim.
2. A migração `e246_workflow_trigger`; as permissões num pull request próprio (D11).
3. As cinco ferramentas (`tools.ts`), cada uma achando a versão por `parseMastraWorkflowId` do
   contexto e o balão pela id na entrada, nunca confiando em empresa, ligação ou pessoa vindas do
   grafo (S7, S8, S9).
4. `trigger.ts`: o workflow fixo; a leitura de base; a volta (a reconferência, ler, `INSERT … ON
   CONFLICT DO NOTHING RETURNING`, `INSERT workflow_run` e começar as execuções das linhas sem
   `run_id` e sem `baseline`, até 20, avançar `since`, limpar, a última volta); a agenda ao ligar,
   pausar, religar e apagar; o início (a agenda segue o `state`, e as decisões gravadas sem
   retomada são retomadas).
5. `runs.ts`: a lista, a vista, aprovar e recusar, tentar de novo, a interrompida, o teste.
6. A lista de Automações com as duas espécies. O #754: o teste da agenda recebe o relógio
   injetado (testing T20).

### Como se prova

Critérios 6 a 20, com o dublê e o relógio injetado; os critérios 11 e 15 abrem um segundo Hub ao
lado do mesmo banco.

### Parar se

- A doc do `loadRecords` não deixar filtrar por tipo de operação e data juntos: relatar com a
  página; não usar `consultar` com SQL escrito pelo modelo.
- O campo do valor do orçamento ou do tipo de operação tiver outro nome na gravação do fundador:
  ajustar só o nome, e dizer no relatório.
- Retomar sem `step` não achar o caminho dentro de um ramo no Hub: relatar com a saída.
- Uma execução cortada dentro de um ramo não terminar com `restart()` (a prova P7 cortou fora de
  um ramo): relatar com a saída; não escrever uma retomada nossa sem o cartão.

## U3 O Construtor monta

**Base e modelo.** A U1 e a U2 no `main`. Sonnet.

### As linhas da tabela

- O modelo é o Mastra Code: o desenho inteiro numa ferramenta que devolve os problemas
  (`mastracode/sdk/src/tools/workflows/save-workflow.ts:41`); o do activepieces (`ap-build-flow.ts:47`),
  o gatilho e os passos numa chamada. As ferramentas de hoje do Construtor:
  `builder/construtor/tools.ts:105-238`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/construtor/` | Cria `workflow-tools.ts`; muda `construtor.ts` e o texto em `prompt/` | o controlador do Construtor |

### Os contratos que a unidade cria

- `workflow_catalog()` → as ligações do Projeto com as operações (nome, título, classe) que o
  papel de quem conversa usa, os agentes publicados do Projeto sem escrita, as pessoas da empresa
  (nome e id).
- `save_workflow_draft({ workflowId: WorkflowId | null, draft: WorkflowDraft })` → `DraftSaved`,
  pela porta da U1.
- `test_workflow({ workflowId: WorkflowId })` → o `RunView` do teste, pela porta da U2.

### A ordem do trabalho

1. As três ferramentas, chamando as portas da U1 e da U2.
2. O texto: perguntar o que falta (os tipos de operação, quem aprova, quem avisa); nunca inventar
   um tipo de operação, uma pessoa ou uma operação.

### Como se prova

Critérios 21 e 22.

### Parar se

- O modelo de verdade não escrever o `IF` com o ramo em três tentativas da avaliação: relatar com as
  saídas; não achatar o contrato sem o cartão.

## U4 As telas

**Base e modelo.** A U1 e a U2 no `main`; a 24.5 U3 no `main`. Sonnet.

### As linhas da tabela

- O trem: o desenho de caixas acima, sobre `apps/web/src/ui/`; nenhuma biblioteca de grafo (com
  `F1`). Antes de construir, as capturas das referências a 1280 e 390 px.
- O cartão **Aprovar?**: as peças da 24.5 U3 (`apps/web/src/builder/conversation/approval-card.tsx`
  e os seus textos), com a execução no lugar da conversa.
- A lista: `apps/web/src/builder/automations/automations.tsx`, `runs.tsx`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/workflows/` | Cria (`train.tsx`, `run.tsx`, `workflow-page.tsx`, `queries.ts`) | as rotas |
| `apps/web/src/builder/{automations,agents}/` | Muda (a lista; o trem ao lado do Construtor) | as rotas |
| `apps/web/src/routes/_app/companies/$companyId/projects/` | Cria `$projectId_.workflows.$workflowId.tsx` e `$projectId_.workflows.$workflowId.runs.$runId.tsx` | o roteador |
| `docs/reference/screens.md` | Muda | a revisão |

### A ordem do trabalho

1. O trem (`train.tsx`), com a matriz de estados e as duas larguras.
2. O trem ao lado da conversa do Construtor, e as abas no celular.
3. A página do workflow e a da execução, o cartão, os botões.
4. A lista de Automações.

### Como se prova

Critérios 23 a 26, e a QA da etapa (testing T25) pelo roteiro.

### Parar se

- O trem precisar de laço, de passos em paralelo ou de um ramo dentro de outro: ficam de fora;
  relatar.
