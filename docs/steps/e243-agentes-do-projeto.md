# Etapa 24.3: O Construtor e o agente de verdade

Este cartão espera a 24.2. Pela regra L5, entra em `docs/steps/` quando o cartão da 24.2 sair no
fechamento dela; até lá vive no seu pull request. Ele usa o que a 24.1 e a 24.2 construíram: os
controladores do Mastra com a porta das seis rotas, a porta da empresa aos conectores, as contas de
modelo, as automações e o sino. É a primeira etapa da área nova do Projeto que o estudo do
Construtor desenhou (agentes, ferramentas, workflows, automações e canais, um ciclo só: rascunho,
teste, publicar uma versão, rodar, acompanhar).

## A página do fundador

**No fim desta etapa** você abre, num Projeto, a área **Agentes**, conversa com o **Construtor**, e
ele te traz ideias de agentes a partir do que o Projeto tem. Você escolhe uma, ele monta o rascunho
do agente sozinho e o testa; a página do agente se monta ao lado, com a estrutura da página de
agente do Mastra Studio que você mandou: instruções, modelo, memória, ligações, ferramentas e o que
ele lê. Você muda o que quiser ali mesmo, conversa com o rascunho, toca **Publicar** e o agente passa
a atender como versão 1. Mudou, publica a 2; não gostou, volta para a 1. Logo depois, na **24.3.1**,
o agente lê os dados do app do Projeto, uma automação da 24.2 pode rodá-lo, as ferramentas ganham a
aba delas, a área mostra as **Ideias do Construtor** quando ele vê uma falta de verdade, e o Início
ganha a página **Agentes**, com todos os agentes da empresa.

**O roteiro de uso.** Padaria Sol: Ana (dona), Bia (administradora) e Bruno (membro). O Projeto
"Vendas" recebeu a ligação "Matriz" do Sankhya e tem o app "Metas", com a meta de cada vendedor. No
computador e no celular.

1. A Ana abre o Projeto Vendas, entra em **Agentes** e escreve ao Construtor "quero um agente de
   vendas". O Construtor lê o Projeto (a ligação Matriz e o que ela lê, as tabelas do app Metas) e
   responde com duas ou três ideias, cada uma com o que o agente faria, por exemplo "um conferente
   que compara as vendas de ontem com as metas e diz quem ficou abaixo". Ela escolhe a primeira.
2. O Construtor cria o rascunho e, sem perguntar, faz as ferramentas dele (por exemplo "vendas de
   ontem por vendedor", um recorte de uma leitura do Sankhya), escreve as instruções e testa o
   rascunho com uma pergunta. Na conversa aparece o cartão do agente, **Rascunho**, com **Abrir** e
   **Publicar**.
3. Ela toca **Abrir**. A página do agente tem, à esquerda, as conversas dela com ele; no meio, a
   conversa; à direita, o painel da configuração: instruções, modelo, memória, ligações (só as que o
   Projeto recebeu), ferramentas (cada uma com o que lê e os valores fixos), "Lê a web" e, na
   24.3.1, "Lê os dados do app". Ela muda o modelo e uma frase das instruções no painel, e conversa com o
   **rascunho**: "quem ficou abaixo da meta ontem?". O agente mostra as leituras e responde.
4. Ela toca **Publicar**. O cartão e a página mostram **Versão 1 · publicada**. Uma conversa nova
   agora fala com a versão 1. Ela pede ao Construtor "deixa ele mais curto nas respostas"; o
   Construtor muda o rascunho, e a página mostra "Rascunho com mudanças"; ela publica a versão 2,
   não gosta, e em **Versões** toca **Voltar para a versão 1**.
5. **Na 24.3.1**, logo depois: na conversa com o agente ela escreve "todo dia às 7h me manda isso". O cartão da automação diz
   **Roda: Conferente de metas**. Ela toca **Criar automação** e, na página Automações, **Rodar
   agora**: a execução abre uma conversa nova com o agente, marcada "Automação", e o sino avisa.
6. A Bia abre o Projeto: vê o agente, conversa com ele e com o Construtor; as conversas da Ana não
   aparecem para ela. O Bruno (membro) não vê **Agentes**, e o endereço de um agente dá "não
   encontrado". A Ana apaga o agente: a confirmação diz que as conversas de todas as pessoas com ele
   e as automações que o rodam vão junto.

**O que você faz, e quando.**
- **No começo:** aprova esta página (e agora a emenda de 2026-11-02, abaixo). As suas respostas já decidiram a forma: **`A1`** (o agente
  guardado como dados com versões, e cada versão publicada é um `new Agent` do Mastra registrado com
  o próprio nome, como o editor do Mastra faz), **`C1`** (o Construtor cria, muda e testa rascunhos
  sozinho; publicar é sempre um toque seu), **`E1`** (a ordem do roteiro abaixo), "3.A" (agentes
  escondidos do membro), a **B** de 2026-11-02 ("Okay aprovado vamos seguir assim então"), as
  respostas ao protótipo do Construtor, "1A 2A 3A 4A" e "`V1`", e as da emenda, "P1. A" e "R1"
  (2026-11-02). A
  aprovação é também a sua palavra para as permissões das tabelas novas e da função que lê, ao ligar
  o Hub, as empresas com agentes publicados (regra D11), como nas etapas 9, 18, 19 e 24.2.
- **No fim:** faz o roteiro no computador e no celular, diz o que viu e aprova os textos das telas.
  Os nomes já são seus (a 2A): a entrada do Projeto é **Agentes**, com as abas dentro; **Construtor**
  é o nome do agente com quem você conversa ali; **Construir** continua sendo o Builder dos apps.

**O que mudou desde a sua aprovação (emenda de 2026-11-02).** Você aprovou esta página no commit
`bbbbf0c3`. Depois, duas respostas suas mudaram o cartão por dentro, sem mudar nada do que você faz no
roteiro:

- **"P1. A"** (do estudo de arquitetura do código). Hoje cada conversa com um agente é montada à mão:
  a do Construir e a do Assistente repetem quem é o dono da conversa, abrir, conferir se a pessoa
  pode, apagar quando o Projeto sai. A 24.3 ia montar mais duas assim (a do agente e a do
  Construtor). Agora entra uma unidade curta nova, a **U1b**, logo depois da U1: ela escreve essas
  partes uma vez só (o "kit dos controladores") e passa as duas conversas de hoje para ele. A U2 (o
  agente vivo) e a U4 (o Construtor) já nascem usando o kit e ficam menores. Também passa a haver um
  jeito só, em vez de dois, de não criar a mesma conversa duas vezes quando um clique se repete.
  Você não vê diferença nenhuma na tela: a prova são os testes que já existem das duas conversas,
  que passam sem mudar. Tamanho: a U1b tem de ~400 a ~700 linhas, a U2 cai de ~1.000 para ~780 e a U4 de ~750
  para ~600; a 24.3 fica perto do limite de ~4.000 linhas por etapa. Se a U1b sair maior que o
  previsto, o que passar do limite vai para a 24.3.1, e eu te aviso.
- **"R1"** (do estudo da execução das automações). A execução de uma automação manda o pedido ao
  modelo marcado como "vindo de uma automação", para ele não oferecer criar a automação que já
  existe. Quando uma automação rodar um agente (U6, na 24.3.1), o pedido vai com a mesma marca.

**A aprovação que pedimos agora:** que você aprove esta página de novo, com a emenda, por exemplo
"Aprovo a emenda". As suas palavras e o commit novo vão para o livro de aprovações.

**Fica de fora, e onde entra.**
- **Ferramentas em código** (24.4). Nesta etapa as ferramentas são **recortes**: uma
  leitura que o conector já tem, com valores fixos e uma descrição mais estreita. Cada ferramenta tem
  versões, e cada versão do agente guarda a versão de cada ferramenta que usa; as ferramentas moram na
  biblioteca da empresa (a sua `T1`). Onde roda o código
  que o Construtor escrever **não está decidido aqui**: o cartão da 24.4 decide por um protótipo de
  um dia que compara um Worker do Workers for Platforms com um comando na máquina E2B da área de
  trabalho, como o Mastra Factory faz (a sua resposta B). A máquina na conversa do agente entra com
  essa etapa.
- **Pedir para publicar** (a etapa de papéis e pedidos, logo depois desta, pela sua resposta "2"
  de 2026-11-01). Aqui só dono e administrador usam agentes. Lá o membro ganha a área, e o
  **Publicar** dele vira um pedido que qualquer dono ou administrador aprova (a sua resposta "3"):
  publicar e voltar já nascem com a sua própria ação de admissão, `publishAgent`, que aquela etapa
  troca por "pode publicar ou pode pedir". Lá também o desenvolvedor passa a mudar as ferramentas da
  biblioteca (a sua 3A): as rotas das ferramentas usam a ação `manageAgents`, que aquela etapa abre a
  ele.
- **Agentes que gravam** (24.5): toda ferramenta desta etapa só lê. Pedir para gravar recebe "só
  leio". A 24.5 começa pela prova de que o pedido "Aprovar?" (`tool-call-approval`) passa pelo
  controlador "agentes", a parte do protótipo de conversa do estudo (§3.4) que esta etapa, só de
  leitura, não precisa.
- **Workflows, o desenho em balões e as automações na mesma área** (24.6). As automações continuam
  na página delas; só ganham o alvo agente.
- **Canais**, Telegram primeiro pelos Channels do Mastra (24.7, a sua resposta `D1`).
- **Agentes fora de um Projeto**: a sua `J1` põe os agentes no Projeto; a página do Início (`V1`) só os
  mostra.
- **Ideias do Construtor** na área (a sua 4A) entram na **24.3.1**, na U8, porque a 24.3 já está no
  teto de tamanho (regra L2). Uma ideia só aparece quando vem de uma falta que o Construtor vê nos
  dados: um agente publicado preso a uma versão velha de uma ferramenta, ou um agente que usa uma
  ligação que o Projeto não oferece mais. Sem falta, o bloco não aparece. A falta "grava sem
  aprovação" entra com a 24.5, quando houver ferramentas que gravam.
- **Agentes no Início** (a sua `V1`) entra na **24.3.1**, na U9, ao lado da aba Ferramentas. Uma página
  **Agentes** no Início lista todos os agentes da empresa, com o filtro por Projeto e, de cada um, a
  versão, o estado e a última vez que rodou. Ela só mostra: um toque abre a página do agente dentro do
  Projeto dele, onde se muda. **Novo agente** pergunta em qual Projeto, porque um agente sempre nasce
  num Projeto. O membro não vê essa página também (3.A). É a mesma forma das Automações da 24.2, que
  têm uma página no Início e uma em cada Projeto: uma lista e uma leitura só.
- **Comparar versões lado a lado**: a lista de versões mostra quem publicou, quando e a mensagem;
  comparar entra quando você pedir.
- **"Ver código" e o desenho do que o agente usa** (o estudo, §3.6): o `agent.ts` equivalente, só de
  leitura, e o diagrama das ligações, ferramentas e canais entram com a 24.4, quando há código de
  verdade para mostrar e canais a desenhar.
- **Das pendências marcadas para o próximo cartão:** entra a frase velha do texto do Builder que diz
  que os conectores "vêm depois" (a #540), porque a U4 escreve o texto do Construtor ao lado. As
  outras esperam a etapa delas: as da 14.3, 17, 18, 19 e 20 não tocam agentes; a #541 espera o seu
  pedido; a #339 (o fim do Hub no meio de um turno) espera a 16.

**As decisões suas nesta etapa.** Nenhuma nova. As do cartão anterior foram respondidas (`A1`, B,
`C1`, `E1`, 3.A), a da biblioteca de ferramentas também, **`T1`** (2026-11-02), e as quatro do
protótipo: **1A** (o Construtor mora dentro do Projeto, na área **Agentes**, não numa área à parte),
**2A** (os nomes, acima), **3A** (quem muda uma ferramenta da biblioteca, abaixo) e **4A** (as
ideias só de faltas de verdade, na 24.3.1). E a **`V1`** (a página Agentes no Início, só para ver, na
24.3.1). E as da emenda: **P1. A** (o kit dos controladores, na U1b) e **R1** (o pedido de uma
automação marcado, também quando ela roda um agente). O que os estudos deixaram como engenharia (a
forma de conversar com o agente registrado, abaixo, o jeito único de não duplicar a conversa, na
U1b, e onde rodará o código, na 24.4) não é decisão sua.

**A biblioteca de ferramentas (a sua `T1`).** As ferramentas são da empresa, não de um Projeto. Cada
conector traz as leituras dele como ferramentas prontas, e o agente usa só as que precisa. A
ferramenta que o Construtor faz entra na mesma biblioteca e serve a vários agentes. Cada ferramenta
diz o que lê e o que faz (nesta etapa, só ler), e só entra num agente cujo Projeto recebeu aquela
ligação. Cada versão publicada do agente guarda a versão de cada ferramenta, então mudar uma
ferramenta nunca muda um agente publicado; o Construtor propõe a troca para a versão nova. Antes de
fazer uma ferramenta, ele procura na biblioteca e nas automações do Projeto (os workflows que
existem hoje). **Quem muda uma ferramenta da biblioteca** (a sua 3A): dono e administrador agora, e o
desenvolvedor quando a etapa de papéis chegar. Mudar sempre grava uma versão nova; os agentes
publicados continuam na versão que prenderam, e o Construtor propõe a troca. É o que as referências fazem: o Mastra registra cada ferramenta uma vez e o agente a
pega pelo id (`M:packages/editor/src/namespaces/agent.ts:1329-1352`, relay); o Agent Builder pago do
Mastra escolhe o menor conjunto de ferramentas que já existem
(`M:packages/editor/src/ee/agent-builder-agent.ts:30-32`, relay, lido só pelo comportamento: nenhum
código vem dele); o Composio e o Arcade dão ao agente ferramentas avulsas de um kit. Até a 24.3.1,
que traz a aba **Ferramentas**, uma ferramenta só ganha versão nova pelo Construtor; no painel você
escolhe e cria ferramentas.

### Como funciona por dentro

- **O agente é dados com versões.** A linha do agente guarda o **rascunho**, que você e o Construtor
  editam; cada **Publicar** congela o rascunho numa versão nova, que nunca muda. A forma dos campos
  segue a tabela de versões do próprio Mastra, campo por campo.
- **Cada agente publicado é um `new Agent` registrado no Mastra do Hub**, com o id dele, pela
  `mastra.addAgent`, como o editor do Mastra faz com os agentes da tela. Publicar ou voltar troca o
  registrado (`removeAgent` e `addAgent`). O agente registrado roda sozinho: tem o modelo da versão
  e paga pela conta de modelo de quem o chama, como o Assistente. É ele que o Construtor testa, e é
  ele que um workflow (24.6) e o Telegram (24.7) vão chamar pelo id. Ao ligar, o Hub registra
  **todos** os agentes publicados antes de acordar a agenda do Mastra, porque a agenda, que essas
  etapas vão usar, apaga depois de três tiques o que aponta para um agente que não acha (medido no
  estudo de carga).
- **Conversar com o agente** passa pela mesma porta das seis rotas da 24.1: um controlador "agentes",
  cujo único agente pega, a cada pedido, as instruções, as ferramentas e a memória do agente
  registrado que a conversa nomeia (ou do rascunho, na conversa de teste), e o modelo da versão a
  cada turno: publicar uma versão com outro modelo vale no turno seguinte de uma conversa aberta.
  Nenhuma rota nova do Mastra se abre, e as sessões e as telas da 24.1 servem sem mudar.
- **O cérebro roda no Hub; nenhum código da empresa roda nele.** As ferramentas são as leituras que
  já existem, chamadas pela porta dos conectores, que confere a ligação a cada chamada. O estudo de
  carga mediu 1.000 agentes registrados em cerca de 50 MiB; o registro do Hub passa a dizer, a cada
  minuto, o atraso do laço e o processador, os sinais de quando mudar.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | O agente e as ferramentas como dados: as tabelas `builder.agent`, `builder.agent_version`, `builder.tool` e `builder.tool_version` (os recortes, com versões), `builder.agent_tool` e `builder.agent_version_tool` (a versão de cada ferramenta que o rascunho e cada versão usam), as migrações, as permissões e a função das empresas com agentes; as rotas do rascunho, das ferramentas, de publicar, das versões, de voltar e de apagar; a remoção com o Projeto, a pessoa e a empresa | `apps/server/src/builder/agents/`, `apps/server/src/builder/tools/`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `apps/server/src/hub/identity/` (`admission.ts`), `apps/server/src/builder/conversation/` (`public.ts`), `packages/hub-api/src/`, `scripts/removals.json` | [data](../guides/data.md) | a 24.2 fechada |
| U1b | O kit dos controladores (a "P1. A"): `builder/mastra/` (o único `Mastra`, ligar, parar e a remoção em cadeia, com as partes registradas) e `builder/controller-kit/` (o dono do fio, a leitura por pedido, a admissão, abrir a conversa e removê-la, escritos uma vez); o Builder e o Assistente passam para ele; um só jeito de não duplicar a conversa. Nada visível muda | `apps/server/src/builder/mastra/`, `apps/server/src/builder/controller-kit/`, `apps/server/src/builder/conversation/`, `apps/server/src/builder/assistant/`, `apps/server/src/builder/automations/`, `apps/server/src/conversations-of.ts` | [testing](../guides/testing.md) | U1 |
| U2 | O agente vivo: o registro (`addAgent` por agente publicado, ao ligar antes da agenda, ao publicar, ao voltar e ao apagar); o `new Agent` de uma versão, com os recortes; o controlador "agentes" como parte do kit, a tabela `builder.agent_conversation` e a conversa com o publicado e com o rascunho; o fim dos turnos na atualização e a remoção das conversas; o atraso do laço e o processador no `HUB_MEMORY` | `apps/server/src/builder/agents/`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `apps/server/src/builder/controller-kit/` (`kinds.ts`), `apps/server/src/builder/mastra/` (`hub-mastra.ts`), `apps/server/src/builder/model-accounts/` (`turn.ts`), `apps/server/src/platform/` (`memory.ts`), `apps/server/src/conversations-of.ts`, `packages/hub-api/src/` | [testing](../guides/testing.md) | U1b |
| U3 (24.3.1) | Os dados do app: `app_data_read` por um login só de leitura do banco do app | `apps/server/src/platform/` (`company-postgres.ts`), `apps/server/src/hub/apps/`, `apps/server/src/hub/connectors/` (`public.ts`), `apps/server/src/builder/agents/`, `packages/hub-api/src/` (`app-login.ts`, `agents.ts`) | [security](../guides/security.md) | U2 |
| U4 | O Construtor: o terceiro controlador, como parte do kit, as instruções dele e as ferramentas que leem o Projeto, procuram e gravam ferramentas, leem, criam, mudam e testam o rascunho; as conversas dele no Projeto, a remoção delas e o fim delas na atualização | `apps/server/src/builder/construtor/`, `apps/server/src/builder/controller-kit/` (`kinds.ts`), `apps/server/src/builder/conversation/` (`prompt/builder.md`), `apps/server/src/conversations-of.ts`, `packages/hub-api/src/` (`construtor.ts`) | [code](../guides/code.md) C75 | U2 |
| U5 | As telas: a entrada **Agentes** do Projeto, a conversa com o Construtor e o cartão do rascunho, a lista dos agentes, a página do agente com o painel editável, a conversa de teste, as versões, publicar, voltar e apagar | `apps/web/src/builder/agents/`, `apps/web/src/builder/conversation/`, `apps/web/src/hub/projects/` (`project-rail.tsx`), `apps/web/src/routes/_app/companies/$companyId/projects/`, `docs/reference/screens.md` | [web](../guides/web.md) | U2, U4 |
| U6 (24.3.1) | A automação roda um agente: o alvo da automação ganha o agente publicado; o cartão da automação na conversa do agente; apagar o agente leva as automações dele | `apps/server/src/builder/automations/`, `apps/server/src/builder/agents/` (`agent.ts`), `packages/hub-api/src/` (`automations.ts`), `apps/web/src/builder/automations/` | [testing](../guides/testing.md) | U2 |
| U7 (24.3.1) | A aba **Ferramentas** da área: a lista das ferramentas que o Projeto pode usar, as versões de cada uma, a versão nova pelo formulário, apagar com `TOOL_IN_USE`, e no painel do agente o aviso "Versão nova" com **Usar a versão n** | `apps/web/src/builder/tools/`, `apps/web/src/builder/agents/` (`config-panel.tsx`), `apps/web/src/routes/_app/companies/$companyId/projects/`, `docs/reference/screens.md` | [web](../guides/web.md) | U5 |
| U8 (24.3.1) | As **Ideias do Construtor** na área (a 4A): a leitura das faltas que os dados mostram (um agente publicado preso a uma versão velha de uma ferramenta, um agente publicado que usa uma ligação que o Projeto não oferece mais), o bloco que some sem falta e **Pedir ao Construtor** | `apps/server/src/builder/agents/` (`ideas.ts`, `routes.ts`), `packages/hub-api/src/` (`agents.ts`), `apps/web/src/builder/agents/` (`area.tsx`, `ideas.tsx`) | [web](../guides/web.md) | U4, U7 |
| U9 (24.3.1) | A página **Agentes** do Início (a `V1`): a mesma lista da área com todos os agentes da empresa, o filtro por Projeto, a versão, o estado e a última vez que rodou; um toque abre o agente no Projeto dele; **Novo agente** pergunta o Projeto; a entrada no Início, escondida do membro | `apps/server/src/builder/agents/` (`agents.ts`, `agent.ts`), `apps/server/migrations/`, `packages/hub-api/src/` (`agents.ts`), `apps/web/src/builder/agents/` (`agent-list.tsx`, `new-agent.tsx`), `apps/web/src/routes/_app/companies/$companyId/` (`route.tsx`, `agents.index.tsx`) | [web](../guides/web.md) | U5, U6 |

Na 24.3, a U1b anda depois da U1 e antes da U2 (a U2 e a U4 nascem sobre o kit), a U4 anda depois da U2, e a U5 espera a U4, porque o cartão do rascunho é o resultado das
ferramentas do Construtor. Na 24.3.1, a U7 só toca a web, a U8 anda depois dela (o bloco fica na mesma área), a U9 depois da U6 (a última execução conta as
automações), e a U3 e a U6 andam em paralelo: mudam o mesmo arquivo do agente
(`builder/agents/agent.ts`, uma ferramenta cada) num ponto só, e a segunda a entrar refaz a fusão;
`packages/hub-api/src/failures.ts` é o outro ponto de fusão.

**Quando começa** (delivery L1). A U1 começa quando a 24.2 fechar e esta página for aprovada, na
ordem que o firstmate der entre esta etapa e a 13.3 (a Pauta).

**Antes da U1**, nenhuma regra muda. Valem a do `ee`
(https://github.com/developmentconexus-ops/conexus/pull/518: nada do Agent Builder, do editor nem
dos agentes guardados do Mastra) e a `mastra-only-in-builder` (W7): os agentes moram em `builder/`.

**Orçamento de código alterado.** U1: ~1.100 (as ferramentas com versões tomam o lugar dos recortes
por agente: +~100, a tabela das versões, a lista e `TOOL_IN_USE`). U1b: ~400 a ~700 (o estudo de arquitetura, §3.1, mediu ~400; código movido conta duas
vezes, tirado e somado, então o teto é ~700; ~125 a menos no fim). U2: ~780 (era ~1.000; o kit tira o
controlador montado à mão, a abertura, a remoção, o `enum` e o `if` da porta e a parte em
`conversation/public.ts`, ~220 das ~370 que o estudo diz que a U2 e a U4 não escrevem). U3: ~400. U4: ~600
(era ~750, com `tool_search` e `tool_save` no lugar das duas dos recortes; o kit tira ~150). U5: ~1.150 (o painel escolhe e cria
ferramentas; mudar e apagar uma vão para a U7). U6: ~200. U7: ~350 (uma lista, as versões e o
aviso, sobre o formulário da U5). U8: ~300 (uma consulta sobre as tabelas da U1, uma rota e o bloco). U9: ~350 (uma coluna, a
gravação dela a cada turno, o filtro na rota da lista; a rota do Início, a entrada, o filtro e
**Novo agente** sobre a lista da U5, como a página das Automações). Testes, gerados e o OpenAPI ficam fora. Hipótese pelos vizinhos: a U1 da 24.2 (~850, rotas
sobre um serviço), a U3 da 24.2 (~950, um cartão e duas páginas; a U5 tem a área, a página, o
painel de seis seções, o formulário da ferramenta e as versões), a tabela da conversa da 24.1
(`chosen.ts`, 102 linhas), o login do app da 9 e o controlador do Assistente (`assistant.ts`, 371
linhas, só uma parte da U2). O total, ~5.630 a ~5.930, passa do teto da regra L2, então a etapa se divide
antes da construção: a **24.3** é a U1, a U1b, a U2, a U4 e a U5 (~4.030 a ~4.330, no teto; a U1b
tira mais do que soma, e o "Parar se" dela manda o que passar para a 24.3.1), o que a Ana faz nos passos 1 a 4
e 6 do roteiro; a **24.3.1**, logo depois e com este mesmo cartão, é a U3, a U6, a U7, a U8 e a U9 (~1.600), os
dados do app, o passo 5, a aba Ferramentas, as Ideias do Construtor e a página Agentes do Início.
As ideias e a página do Início não cabem na 24.3, que já está nos ~4.000 da L2.
As estimativas da U1b e do que ela poupa à U2 e à U4 são do estudo, sobre contagens lidas, não de uma
extração feita (o estudo, §8); a U1b relata a sua medida, e a U2 e a U4 a conferem. A 24.3.1 não pede página nova: a aprovação desta vale para as duas, e a sua
abertura só confere a base.

## Os critérios de aceite

O aceite da 24.3: a Ana pede um agente ao Construtor, recebe ideias, vê o rascunho feito e testado
por ele, muda o modelo e as instruções na página, conversa com o rascunho, publica a versão 1,
publica a 2, volta para a 1 e conversa com o publicado (critérios 1, 5, 6, 9, 12, 13, 22, 24, 25, 26,
27, e o 37 do kit, que não se vê). O da 24.3.1: o agente lê os dados do app, roda numa automação, a Ana muda uma ferramenta pela aba
dela e a área mostra a ideia de trocar o agente para a versão nova e o Início lista os agentes da empresa (critérios 18, 30, 32, 33, 34, 35, 36).

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `POST /api/companies/{c}/projects/{p}/agents` com nome, pela dona ou administradora, responde 201 com o agente em rascunho (`state: DRAFT`, `draft` com os padrões: instruções vazias, `model: null`, memória observacional ligada, nenhuma ligação, nenhuma ferramenta, `web` e `appData` falsos, `revision: 1`); a mesma chave de tentativa com o mesmo corpo devolve o mesmo agente, também ao mesmo tempo; com outro corpo, `IDEMPOTENCY_CONFLICT` | `apps/server/src/builder/agents/routes.test.ts`, "criar" | must |
| 2 | U1 | `PATCH …/agents/{id}/draft` com `revision` igual à da linha grava os campos mandados e devolve o rascunho com `revision + 1`; com `revision` velha, 409 `AGENT_DRAFT_STALE` e nada muda; uma ligação que o Projeto não oferece, um modelo que o seletor não lista, instruções acima de 8.000 caracteres: `REQUEST_MALFORMED` com o campo | `routes.test.ts`, "o rascunho" | must |
| 3 | U1 | `POST /api/companies/{c}/projects/{p}/tools` grava uma ferramenta na versão 1: uma ligação que o Projeto recebeu, uma operação de leitura dessa ligação (`class: 'read'`), os valores fixos válidos pelo esquema da operação, os campos que o modelo preenche e a descrição; os campos fixos e os abertos não se repetem e cobrem juntos os obrigatórios da operação; uma operação de escrita ou destrutiva, uma ligação que o Projeto não recebeu, um valor fixo que o esquema recusa, um campo nos dois lados, um obrigatório de fora ou um `slug` repetido dão `TOOL_REFUSED` com o motivo; a mesma chave de tentativa com o mesmo corpo devolve a mesma ferramenta, com outro corpo `IDEMPOTENCY_CONFLICT`; a ferramenta e a versão 1 nascem numa transação só; `POST …/tools/{id}/versions`, com chave de tentativa, grava a versão `n+1` com outra descrição, outros valores fixos ou outros campos abertos (a ligação e a operação são da ferramenta e não mudam) e não muda as anteriores; `GET …/tools` lista as da biblioteca da empresa que o Projeto pode usar (a ligação recebida), com o efeito, a versão mais nova e os agentes que usam cada uma, e as leituras prontas das ligações dele que ainda não estão nela; uma ferramenta gravada pelo Projeto A aparece no Projeto B que recebeu a mesma ligação, e não no C, que não recebeu | `apps/server/src/builder/tools/routes.test.ts`, "gravar" e "versões" | must |
| 3a | U1 | `PATCH …/agents/{id}/draft` com `tools` (ids de versões de ferramenta) troca as ferramentas do rascunho e sobe o `revision`; a versão de uma ferramenta que este Projeto não pode usar (de outra empresa, ou de uma ligação que o Projeto não recebeu) ou duas versões da mesma ferramenta dão `AGENT_TOOL_REFUSED`; `AgentDetail.tools` traz de cada uma a versão escolhida e a mais nova | `routes.test.ts`, "as ferramentas do rascunho" | must |
| 3b | U1 | `DELETE …/tools/{id}` responde 204 com a ferramenta sem uso; usada por um rascunho ou por uma versão publicada de algum agente, 409 `TOOL_IN_USE` com os nomes dos agentes, e nada muda; uma ferramenta de outra empresa, ou da empresa mas de uma ligação que este Projeto não recebeu, dá `TOOL_NOT_FOUND` no `GET`, em `versions` e no `DELETE`, que passam todos por `usable(scope)` | `apps/server/src/builder/tools/routes.test.ts`, "apagar" | must |
| 4 | U1 | Recusas de todas as rotas: o membro, `NOT_FOUND` (S10, a resposta "3.A"); um Projeto de outra empresa ou apagado, `NOT_FOUND`; um agente de outro Projeto, `AGENT_NOT_FOUND`; nome vazio ou acima de 80, `REQUEST_MALFORMED` | `routes.test.ts`, "as recusas" | must |
| 5 | U1 | `POST …/agents/{id}/publish` com `revision` e `message` grava a versão `n+1` com uma cópia do rascunho e a versão de cada ferramenta dele, e a torna ativa; publicar de novo o mesmo `revision` devolve a mesma versão; um rascunho sem instruções ou com uma ligação que o Projeto perdeu dá `AGENT_DRAFT_INVALID` com o campo; a versão gravada não muda quando o rascunho ou uma ferramenta dele ganha versão nova depois | `routes.test.ts`, "publicar" | must |
| 6 | U1 | `GET …/agents/{id}/versions` lista as versões (número, quem publicou, quando, mensagem, qual está ativa); `POST …/agents/{id}/versions/{n}/activate` torna a `n` ativa; uma versão que não existe dá `AGENT_VERSION_NOT_FOUND`; o rascunho não muda ao voltar | `routes.test.ts`, "as versões" | must |
| 7 | U1 | `DELETE …/agents/{id}` responde 204: o agente, as versões e as escolhas de ferramentas dele somem, e as ferramentas ficam; as conversas com ele somem para todas as pessoas (a linha do Hub e o fio do Mastra), também uma aberta no mesmo instante, nas três ordens (a linha gravada antes da primeira varredura, entre ela e o `delete`, e depois): nenhum fio fica sem a linha; apagar de novo dá `AGENT_NOT_FOUND`; a remoção do Projeto e da empresa leva os agentes antes das conversas; a da pessoa deixa os agentes com `createdBy: null`, as versões com `publishedBy: null` e as ferramentas e as versões delas com o autor vazio | `apps/server/src/builder/agents/release.test.ts` (as conversas entram com a U2: o teste das três ordens nasce na U2) | must |
| 8 | U1 | As tabelas dos agentes saem com o Projeto e a empresa, as das ferramentas só com a empresa (`releaseOf` apaga os agentes da empresa, `agents.release`, antes da linha da empresa, então nenhuma escolha prende uma ferramenta), a política da empresa recusa ler o agente de outra empresa, `builder.companies_with_agents()` só é executável por `hub_runtime` e devolve só os ids das empresas com um agente publicado, e o catálogo das permissões fecha (`database-grants.sql`) | `apps/server/src/platform/catalog.test.ts`; `release.test.ts`, "as chaves" | must |
| 9 | U2 | Numa conversa com o publicado, o turno depois de publicar a versão 2 recebe as instruções, as ferramentas e o modelo da 2 (o modelo dublê lê o texto do sistema e o modelo pedido); o turno depois de voltar para a 1, os da 1; depois de apagar, a conversa some (critério 7); um id que colidisse com um agente de código (`builder`, `assistant`, `agents`, `construtor`) não existe, porque a chave é `agent-<uuid>` | `apps/server/src/builder/agents/registry.test.ts`, "publicar troca" | must |
| 9a | U2 | O agente registrado roda sem controlador: `generate` com o dono no `requestContext` chama o modelo da versão (ou o primeiro da pessoa, com `model: null`) pela conta de modelo da pessoa, contado na fila dela; sem conta, `MODEL_NO_ACCOUNT` | `registry.test.ts`, "roda sozinho" | must |
| 9b | U2 | Um agente que falta no registro nunca imprime as chaves dos outros: o registro procura pela nossa lista (`listAgents()`), nunca pelo erro de `getAgent` ou `getAgentById`, que lista todas as chaves (`NM:mastra-Da0Czfte.js:1566-1580`); a linha do processo traz só o id pedido | `registry.test.ts`, "sem as chaves dos outros" (lê o registro do processo do teste) | must |
| 10 | U2 | Ao ligar o Hub, todo agente publicado de toda empresa é registrado antes de `startWorkers`: a linha `AGENTS_HYDRATED` (quantos) sai antes de `MASTRA_WORKERS_STARTED`, que `start` passa a imprimir depois de `startWorkers`, e a primeira conversa com um agente depois de ligar não imprime `AGENT_REGISTERED` com `lazy: true`. Nenhuma linha da agenda aponta para um agente nesta etapa (a U6 passa pelo workflow da 24.2); a ordem serve à 24.6 e à 24.7 | `registry.test.ts`, "ao ligar" (o Hub de teste, reiniciado, e o registro do processo) | must |
| 11 | U2 | O registro falhar depois de gravar a versão não perde a versão: o próximo turno que pede o agente o registra pela linha (`AGENT_REGISTERED` com `lazy: true`) | `registry.test.ts`, "o registro atrasado" | must |
| 12 | U2 | `POST …/agents/{id}/conversations` abre uma conversa do controlador "agentes" com o agente publicado; `{ draft: true }` abre a conversa de teste com o rascunho; a conversa nasce com o modelo da versão (ou o da pessoa, com `model: null`), e um modelo sem conta da pessoa dá `MODEL_NO_ACCOUNT`; com o modelo fixado na versão, a caixa não oferece trocar o modelo; um agente sem versão publicada e sem `draft` dá `AGENT_NOT_PUBLISHED` | `apps/server/src/builder/agents/conversation.test.ts`, "abrir" | must |
| 13 | U2 | Num turno da conversa com o publicado, o modelo recebe as instruções do Conexus, depois as da versão ativa, e só as ferramentas da versão: cada ferramenta na versão escolhida (`tool_<slug>`), `connector_read` e `connector_notes` sobre as ligações da versão que o Projeto ainda oferece, `web_search` e `web_fetch` só com `web`, e mais tarde `app_data_read` com `appData` (U3) e `propose_automation` (U6); nunca `propose_app`, `conexus_overview`, uma ferramenta da máquina ou uma que grava; na conversa de teste, as do rascunho e o modelo do rascunho, relidos a cada turno, então uma mudança no painel vale no turno seguinte | `conversation.test.ts`, "as ferramentas" (o modelo dublê da 12 lê a lista e o texto do sistema da chamada) | must |
| 14 | U2 | Uma ferramenta chama a operação pela porta da empresa com os valores fixos por cima do que o modelo mandou (o modelo não troca um valor fixo), contado nas 50 chamadas do turno; uma ligação que o Projeto perdeu responde `NOT_GRANTED` | `conversation.test.ts`, "o recorte" (o dublê do Sankhya da 24.1 grava a entrada que recebeu); uma versão nova da ferramenta não muda o que a versão publicada do agente chama | must |
| 15 | U2 | Com a memória observacional desligada na versão, o turno não chama o observador e lembra as últimas 10 mensagens (o padrão do Mastra); ligada, como a 24.1 | `conversation.test.ts`, "a memória" | must |
| 16 | U2 | As seis rotas da porta servem os controladores `agents` e `construtor` com o dono e a ação `manageAgents` conferidos a cada pedido, e continuam seis (`FIXED_LIST`); uma conversa de agente ou do Construtor de outra pessoa dá `CONVERSATION_NOT_FOUND`; uma administradora rebaixada a membro recebe `CONVERSATION_NOT_FOUND` no pedido seguinte | `apps/server/src/builder/conversation/guard.test.ts`, "os controladores novos" | must |
| 16a | U2 | No `settle` da atualização, um turno de agente em andamento termina antes do fim, como os do Builder e do Assistente, e uma conversa nova recebe `HUB_UPDATING`; a remoção da pessoa, do Projeto e da empresa leva as conversas de agente dela | `apps/server/src/builder/agents/conversation.test.ts`, "a atualização" e "a remoção" | must |
| 17 | U2 | A linha `HUB_MEMORY` traz `loopDelayP99Ms` e `cpuPercent` do minuto | `apps/server/src/platform/memory.test.ts` | must |
| 18 | U3 | Numa conversa de agente com `appData`, `app_data_read` com um `SELECT` devolve as linhas da tabela do app, cortadas como `connector_read`; o login que a roda é o `app_<projeto>_read`, e a consulta não chama a API do Neon; uma resposta acima de 1 MB volta `APP_DATA_TOO_LARGE` ("A consulta trouxe dados demais. Peça menos linhas.") | `apps/server/src/builder/agents/app-data.test.ts`, "lê" | must |
| 19 | U3 | `app_data_read` com `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `SET ROLE` ou dois comandos juntos é recusado pelo banco, nunca por um filtro de texto nosso: `APP_DATA_REFUSED`, e a tabela não muda; depois de um `SET default_transaction_read_only = off`, de um `set_config(...)` ou de um `SET TRANSACTION READ WRITE` sozinhos, um `DELETE` na chamada seguinte continua recusado; uma tabela fora do esquema do app e o livro das migrações também | `app-data.test.ts`, "não grava" | must |
| 20 | U3 | O login de leitura nasce na primeira chamada de um Projeto de antes da U3 e na criação do app de um novo; repetir não falha; a consulta passa do tempo do app (`APP_CALL_LIMITS`) e volta `APP_DATA_TIMEOUT`; sem app no Projeto, a ferramenta não é oferecida; o banco da empresa fora dá `APP_DATA_UNAVAILABLE` sem derrubar o turno | `app-data.test.ts`, "o login", "o tempo", "sem app" | must |
| 21 | U4 | `POST /api/companies/{c}/projects/{p}/construtor/conversations` abre uma conversa do Construtor da pessoa naquele Projeto; `GET` lista as dela, só daquele Projeto; o membro, `NOT_FOUND`; sem conta de modelo, `MODEL_NO_ACCOUNT`; a remoção da pessoa, do Projeto e da empresa leva as conversas do Construtor, e o `settle` espera o turno dele | `apps/server/src/builder/construtor/routes.test.ts` | must |
| 22 | U4 | Num turno do Construtor, o modelo recebe as instruções do Construtor (ler o Projeto, propor ideias antes de construir, criar e testar o rascunho sozinho, nunca publicar) e só as ferramentas `project_read`, `connector_read`, `connector_notes` (sobre as ligações que o Projeto recebeu), `tool_search`, `tool_save`, `agent_read`, `agent_draft`, `agent_set`, `agent_test`, `web_search` e `web_fetch`; nenhuma ferramenta publica nem grava num sistema | `apps/server/src/builder/construtor/construtor.test.ts`, "as ferramentas" | must |
| 23 | U4 | `project_read` devolve o nome do Projeto, as ligações recebidas com as leituras de cada uma, se há app e as tabelas dele (nome e colunas, nunca uma linha), e os agentes do Projeto com o estado | `construtor.test.ts`, "ler o Projeto" | must |
| 24 | U4 | `tool_search` acha pelo `slug` e pela descrição as ferramentas da biblioteca que o Projeto pode usar e as prontas, com a versão mais nova e quem as usa, e as automações do Projeto (nome e pedido); `agent_read` diz de cada ferramenta do rascunho se há versão nova. `tool_save`, `agent_draft` e `agent_set` gravam pelo mesmo serviço da U1 (as mesmas recusas, como resultado ao modelo, nunca uma exceção) e devolvem o rascunho gravado com `revision`; um passo repetido de `agent_draft` acha o mesmo agente; depois que a pessoa muda o painel, `agent_set` com o `revision` velho volta `AGENT_DRAFT_STALE` com o rascunho atual, e o Construtor grava de novo sobre ele (`agent_read` também o lê) | `construtor.test.ts`, "o rascunho pelo Construtor" | must |
| 25 | U4 | `agent_test` roda uma pergunta contra o `Agent` do rascunho (o mesmo `agentOf` do critério 9a), sem controlador e sem conversa guardada, pela conta de modelo da pessoa (contado na fila dela), e devolve a resposta e as ferramentas chamadas; um rascunho inválido devolve `AGENT_DRAFT_INVALID` ao modelo | `construtor.test.ts`, "testar" | must |
| 26 | U5 | A entrada **Agentes** do Projeto abre a área: a conversa com o Construtor (e as anteriores) e a lista dos agentes com o estado (**Rascunho**, **Versão n · publicada**, **Rascunho com mudanças**); o cartão do rascunho na conversa mostra nome, o que faz, o que lê e o estado, com **Abrir** e **Publicar** | `apps/web/src/builder/agents/area.test.tsx` | must |
| 27 | U5 | A página do agente mostra as conversas da pessoa com ele, a conversa e o painel com as seções (Instruções, Modelo, Memória, Ligações, Ferramentas, Lê); cada seção grava pelo `PATCH` com o `revision`, numa fila por agente (duas gravações seguidas da mesma pessoa nunca se recusam uma à outra) e, no `AGENT_DRAFT_STALE` de outra pessoa ou do Construtor, mostra "Outra pessoa ou o Construtor mudou este rascunho. Recarregue."; **Testar rascunho** abre a conversa de teste; **Publicar** pede a mensagem e mostra a versão; **Versões** lista e volta | `apps/web/src/builder/agents/agent-page.test.tsx` | must |
| 28 | U5 | O membro não vê **Agentes**; o endereço de um agente apagado ou de outro Projeto dá a página de não encontrado; **Apagar** pede confirmação com o aviso das conversas e das automações | `agent-page.test.tsx`, "o membro" e "apagar" | must |
| 29 | U5 | As telas novas a 1366 e a 390 px, nos dois temas, sem rolagem lateral (W34 e o QA) | o QA da etapa (testing T25) | must |
| 30 | U6 | Numa conversa com o agente publicado, `propose_automation` sai com `agentId` posto pela ferramenta, nunca pelo modelo; o cartão mostra **Roda: <nome>**; a criação grava o alvo, e `AutomationSummary.agent` o devolve; com o tique curto, a execução abre **uma** conversa do agente do dono, marcada "Automação", com a versão ativa naquele instante, e termina `DONE`; o pedido chega ao modelo marcado `source="automation"`, como na 24.2 (a "R1"); uma linha da 24.2 (a versão 1 do `inputData`) roda o Assistente como antes | `apps/server/src/builder/automations/run.test.ts`, "o agente" e "a linha antiga"; `routes.test.ts`, "o alvo agente" | must |
| 31 | U6 | `POST …/automations` com `agentId` de outro Projeto, de um agente sem versão publicada ou apagado dá `AGENT_NOT_FOUND`; um disparo que chegar a um agente apagado no meio termina `SKIPPED` com `AGENT_GONE`, sem conversa; apagar o agente apaga as automações dele antes das conversas | `run.test.ts`, "o agente apagado"; `apps/server/src/builder/agents/release.test.ts`, "as automações" | must |
| 32 | U7 | A aba **Ferramentas** da área lista as ferramentas que o Projeto pode usar, com o que cada uma lê, a versão e os agentes que a usam; **Nova versão** abre o formulário com a versão de agora e grava a `n+1`; **Apagar** de uma usada mostra "Usada por <agentes>." e não apaga; no painel do agente, uma ferramenta com versão nova mostra "Versão n disponível" e **Usar a versão n**, que grava o rascunho | `apps/web/src/builder/tools/tools-tab.test.tsx`; `apps/web/src/builder/agents/agent-page.test.tsx`, "versão nova" | must |
| 33 | U8 | `GET /api/companies/{c}/projects/{p}/agent-ideas` devolve, de cada agente publicado do Projeto, `TOOL_VERSION_BEHIND` para cada ferramenta da versão ativa cuja versão presa é mais velha que a mais nova, e `CONNECTION_LOST` para cada ligação da versão ativa (em `connections` ou numa ferramenta presa) que o Projeto não oferece mais; sem falta, `{ ideas: [] }`; um rascunho nunca publicado não gera ideia (a página dele já marca); o membro, `NOT_FOUND`; a leitura não chama modelo nem grava nada | `apps/server/src/builder/agents/ideas.test.ts` | must |
| 34 | U8 | A área mostra o bloco **Ideias do Construtor** só com uma ideia ou mais, uma linha por ideia com o agente e a falta; sem ideia, ou com a leitura falhando, o bloco não aparece e o resto da área funciona; **Pedir ao Construtor** abre uma conversa nova do Construtor com o pedido escrito na caixa, sem mandar: quem manda é a pessoa | `apps/web/src/builder/agents/area.test.tsx`, "as ideias" | must |
| 35 | U9 | `GET /api/companies/{c}/agents` sem `projectId` lista os agentes de todos os Projetos vivos da empresa, com `projectId`, só os daquele Projeto; cada `AgentSummary` traz `lastRunAt`, o início do último turno de uma conversa com a versão publicada (de qualquer pessoa, também a aberta por uma automação), `null` sem nenhum; um turno da conversa de teste não muda `lastRunAt`; o membro, `NOT_FOUND`; um `projectId` de outra empresa, `NOT_FOUND` | `apps/server/src/builder/agents/routes.test.ts`, "a lista da empresa"; `conversation.test.ts`, "a última execução" | must |
| 36 | U9 | A página **Agentes** do Início lista os agentes com o Projeto, o estado e a última execução, e filtra por Projeto; o nome abre a página do agente no Projeto dele; a página não tem nenhum botão de mudar; **Novo agente** pede o Projeto e abre a área **Agentes** dele com a conversa do Construtor; o membro não vê a entrada, e o endereço dá "não encontrado" | `apps/web/src/builder/agents/agent-list.test.tsx` | must |
| 37 | U1b | Nada muda para quem usa: os testes das conversas do Builder, do Assistente e das automações, `boot.test.ts` e `main.test.ts` passam sem mudar o que afirmam; criar uma conversa do Builder duas vezes com a mesma chave, também ao mesmo tempo, dá uma conversa, e com outro corpo `IDEMPOTENCY_CONFLICT`; uma chave usada antes da U1b (a linha de id aleatório), uma vez ou duas ao mesmo tempo, devolve o id dessa linha e deixa um fio só no Mastra; o id de uma conversa do Assistente, de uma execução de automação e de uma automação é o de antes, byte a byte | `apps/server/src/builder/controller-kit/open.test.ts`, "o id do Assistente" e "a tentativa antiga"; `conversation-routes.test.ts` e `assistant/routes.test.ts`, sem mudança | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A área **Agentes** | a conversa com o Construtor aberta, com "Conte o que você quer que um agente faça. Eu olho o Projeto e trago ideias."; a lista: "Nenhum agente ainda." | o mesmo | a lista e as conversas em esqueleto | `DATABASE_UNAVAILABLE`: a frase com Tentar de novo | o Projeto apagado: a página de não encontrado | o membro não vê a entrada; o endereço dá "não encontrado" (S10) | — |
| A conversa com o Construtor | a caixa com "Peça ao Construtor…" e a frase da primeira vez da área | — | como a da 24.1 | como a da 24.1; `MODEL_NO_ACCOUNT`: a frase da 24.1 com o caminho das contas | a conversa de outra pessoa ou apagada: a página de não encontrado (`CONVERSATION_NOT_FOUND`) | o membro: não encontrado | `HUB_UPDATING`: a frase da 24.1 |
| O cartão do rascunho (na conversa do Construtor) | o cartão com **Rascunho**, **Abrir** e **Publicar** | — | **Publicar** ocupado | a frase do código; `AGENT_DRAFT_INVALID`: "Falta <campo> para publicar." | o agente apagado: "Este agente foi apagado." sem botões | — | `AGENT_DRAFT_STALE` (o cartão manda o `revision` que mostrou): "O rascunho mudou. Abra o agente para ver." |
| A página do agente | "Ainda não há conversas com este agente." com **Nova conversa** (publicado) e **Testar rascunho** | o mesmo | a página em esqueleto | a frase do código com Tentar de novo | `AGENT_NOT_FOUND`: a página de não encontrado | o membro: não encontrado | `AGENT_DRAFT_STALE`: a frase de recarregar; uma ligação que o Projeto não oferece mais: "O Projeto não oferece mais" ao lado dela, e **Publicar** recusado com o campo |
| Uma seção do painel | os valores do rascunho, cada um editável; ferramentas: as escolhidas, **Escolher** (a lista das que o Projeto pode usar) e **Criar** (o formulário) | ferramentas: "Nenhuma ferramenta. Peça ao Construtor, escolha ou crie aqui." | a seção ocupada ao gravar | `TOOL_REFUSED` e `AGENT_TOOL_REFUSED`: o motivo ao lado do campo | — | — | `MODEL_NO_ACCOUNT` ao abrir a conversa: a frase da 24.1 com o caminho das contas |
| A página **Agentes** do Início (U9) | "Nenhum agente ainda. Os agentes nascem num Projeto." com **Novo agente** | o filtro sem agentes: "Nenhum agente neste Projeto." | a lista em esqueleto | `DATABASE_UNAVAILABLE`: a frase com Tentar de novo | — | o membro não vê a entrada; o endereço dá "não encontrado" (S10) | um Projeto apagado some do filtro |
| As **Ideias do Construtor** na área (U8) | o bloco não aparece | o bloco não aparece | o bloco não aparece até a leitura voltar | o bloco não aparece | — | o membro não vê a área | — |
| A aba **Ferramentas** (U7) | "Nenhuma ferramenta ainda. O Construtor faz as primeiras quando monta um agente." | o mesmo | a lista em esqueleto | a frase do código com Tentar de novo | `TOOL_NOT_FOUND`: a lista recarrega | o membro: não encontrado | `TOOL_IN_USE`: "Usada por <agentes>." |
| **Versões** | "Ainda não publicado." | o mesmo | a lista em esqueleto | a frase do código | `AGENT_VERSION_NOT_FOUND`: a lista recarrega | — | — |
| A conversa com o agente (publicada ou de teste) | a caixa com "Pergunte a <nome>…"; a de teste com a faixa "Conversa de teste com o rascunho" | — | como a da 24.1 | como a da 24.1; depois do agente apagado o fio some, e mandar dá `CONVERSATION_NOT_FOUND` da porta | o agente apagado: a página de não encontrado | como a da 24.1 | sem versão publicada, **Nova conversa** não aparece (`AGENT_NOT_PUBLISHED` só por chamada direta) |
| O cartão da automação na conversa do agente | o cartão da 24.2 com **Roda: <nome>** | — | como na 24.2 | `AGENT_NOT_FOUND`: "Este agente foi apagado." | como na 24.2 | — | como na 24.2 |
| Uma linha de Automações | — | — | como na 24.2 | como na 24.2 | como na 24.2 | — | `SKIPPED` com `AGENT_GONE`: "Não rodou: o agente foi apagado." |

**O desenho das telas** (a caixa só fixa onde fica cada peça; o fundador aprova os textos no fim;
sem captura do Conexus OS, que não tinha agentes). A página do agente segue a estrutura da página de
agente do Mastra Studio capturada pelo fundador em 2026-11-01 (`agent-page-config-panel.jpg`): as
conversas à esquerda, a conversa no meio, o painel **Config** à direita, com Ferramentas, Memória e o
texto do sistema; aqui o painel é editável. Só a estrutura e o fluxo, nunca o estilo.

```text
1280 px, a área Agentes                                     390 px, a área Agentes
 ┌──────────────┬──────────────────────────┬─────────────┐  ┌──────────────────────────┐
 │ Vendas      ⌄│ Construtor               │ Agentes     │  │ ☰  Agentes           🔔1 │
 │ Construir    │ [Nova conversa]          │ Conferente  │  │ [Construtor][Agentes]    │
 │ Conversas    │ ideias… cartão:          │  Versão 1 · │  │ ideias… cartão:          │
 │ Agentes      │ ┌──────────────────────┐ │  publicada  │  │ ┌──────────────────────┐ │
 │ Automações   │ │Conferente · Rascunho │ │ Resumo de   │  │ │Conferente · Rascunho │ │
 │ Sobre        │ │Lê: Sankhya · Matriz  │ │  estoque    │  │ │[Abrir] [Publicar]    │ │
 │              │ │[Abrir] [Publicar]    │ │  Rascunho   │  │ └──────────────────────┘ │
 │              │ └──────────────────────┘ │             │  │ [Peça ao Construtor…]    │
 │              │ [Peça ao Construtor…]    │             │  │                          │
 └──────────────┴──────────────────────────┴─────────────┘  └──────────────────────────┘
1280 px, a página de um agente                              390 px, a página de um agente
 ┌────────────┬──────────────────────────┬──────────────┐  ┌──────────────────────────┐
 │ ← Agentes  │ Conferente · Versão 1    │ Configuração │  │ ← Conferente        [⋯]  │
 │ [Nova      │                          │ Instruções ✎ │  │ [Conversas][Configuração]│
 │  conversa] │  (a conversa da 24.1)    │ Modelo     ✎ │  │ [Nova conversa]          │
 │ [Testar    │                          │ Memória    ✎ │  │ [Testar rascunho]        │
 │  rascunho] │                          │ Ligações   ✎ │  │ Quem ficou abaixo… 02/11 │
 │ Quem ficou │                          │ Ferramentas✎ │  │                          │
 │  abaixo…   │ [Pergunte a Conferente…] │ Lê         ✎ │  │                          │
 │            │                          │ [Publicar]   │  │                          │
 │            │                          │ Versões      │  │                          │
 └────────────┴──────────────────────────┴──────────────┘  └──────────────────────────┘
```

A 390 px a área troca as colunas por duas abas (**Construtor** e **Agentes**), e a página do agente
por duas (**Conversas** e **Configuração**); uma conversa aberta ocupa a tela, como as da 24.1;
**Apagar** e **Versões** vão para o menu **⋯**.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| A linha `builder.agent` (o rascunho, `revision`, `active_version`) | U1 (as rotas); U4 (as ferramentas do Construtor, pelo serviço da U1) | U1, U2 (o registro, a conversa de teste), U4 (`project_read`), U5, U6 |
| A linha `builder.agent_version` (`config` congelada) | U1 (publicar) | U2 (`agentOf`), U1 (versões), U6 |
| As linhas `builder.tool` e `builder.tool_version` (a ferramenta da biblioteca da empresa e as suas versões imutáveis) | U1; U4 (`tool_save`, pelo serviço) | U1 (conferir a escolha, `TOOL_IN_USE`), U2 (`agentOf`), U4 (`tool_search`), U5, U7 |
| As linhas `builder.agent_tool` (as versões escolhidas pelo rascunho) e `builder.agent_version_tool` (as presas a cada versão publicada) | U1 (o rascunho; publicar copia uma para a outra); U4 (`agent_set`, pelo serviço) | U1 (`TOOL_IN_USE`), U2 (`agentOf`), U5, U7 |
| `ToolTarget`, `ToolVersionConfig`, `ToolSummary`, `ToolDetail`, `ReadyTool` | U1 | U2 (`agentOf`), U4, U5, U7 |
| `AgentConfig` (o rascunho e cada versão) | U1 | U2, U3 (`appData`), U5 |
| `AgentSummary`, `AgentDetail`, `AgentVersionSummary` | U1 | U5; U4 (`ConstrutorResult`) |
| `agentKey(id)` (a chave e o id no Mastra) | U2 | U2 (o registro, o resolvedor) |
| `FrozenVersion` (a configuração que vira `Agent`) | U1 (`activeOf`, `draftOf`, `publishedAll`) | U2 (`agentOf`), U4 (`agent_test`) |
| `AgentEvent` (`onChange`) | U1 (publicar, voltar, apagar) | U2 (`replace`, `remove`), U6 (as automações do agente) |
| `AgentConversationSummary` | U2 (as rotas) | U5 (a lista da página do agente) |
| O modelo fixo do `Turn` (`model` da versão) | U2 (o processador do turno do agente) | `accountPick` (a conta e o modelo de cada passo) |
| A linha `builder.agent_conversation` (a conversa, de quem é, `draft`) | U2 (abrir) | U2 (o escopo, a lista, a remoção), U6 (a abertura pela execução) |
| As marcas `conexusAgent` e `conexusAgentDraft` do fio | U2 | U2 (a varredura da remoção pela marca, de todas as pessoas) |
| `AgentRun` no `requestContext` | U2 (o escopo da conversa de agente) | U2 (o agente do controlador), U3 (`app_data_read`), U6 (`propose_automation`) |
| `ConstrutorResult` | U4 | U5 (o cartão) |
| `AgentIdea` (as faltas, `GET …/agent-ideas`) | U8 | U8 (o bloco) |
| `AgentSummary.lastRunAt` e a coluna `builder.agent.last_run_at` | U9 (o turno com a versão publicada) | U9 (a lista) |
| `AutomationTarget` (no `inputData`, versão 2) | U6 | U6 |
| O login `app_<projeto>_read` | U3 | U3 |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Criar uma conversa do Builder ou do Assistente pelo kit (U1b: o id derivado do tipo, da empresa, da pessoa e da chave; a linha do Hub `on conflict do nothing` e reler; depois `createSession`, que acha ou cria pelo id, e `model.switch` só num fio sem modelo) | a mesma chave: uma linha e um fio; o que a linha guardou (o `body_hash` e o Projeto do Builder, o Projeto do Assistente) decide entre a mesma conversa e `IDEMPOTENCY_CONFLICT` | um corte entre a linha e o fio: a repetição acha a linha e cria o fio | banco do Hub fora: `DATABASE_UNAVAILABLE`, nada gravado; banco do Mastra fora depois da linha: a repetição termina | as da 24.1, sem mudança | 37 |
| Criar o agente (`insert` com o id derivado da empresa, da pessoa e da chave de tentativa, `on conflict (id) do nothing`, e reler) | a mesma chave: uma linha; o `body_hash` decide entre o mesmo agente e `IDEMPOTENCY_CONFLICT` | a conferência (papel, Projeto) antes: nada gravado | banco do Hub fora: `DATABASE_UNAVAILABLE` | `AGENT_CREATED` | 1, 4, 24 |
| Mudar o rascunho (numa transação: primeiro `update builder.agent set …, revision = revision + 1 where id = $1 and revision = $2`, depois, com `tools`, trocar as linhas de `builder.agent_tool`, com a conferência das ligações, das ferramentas e do modelo) | dois com o mesmo `revision`: um grava, o outro acha zero linhas e responde `AGENT_DRAFT_STALE` | uma transação só | `DATABASE_UNAVAILABLE`, nada muda | `AGENT_DRAFT_SAVED` (agente, `revision`, por quem: pessoa ou Construtor) | 2, 3a, 24 |
| Gravar uma ferramenta (numa transação: `insert` com o id derivado da empresa, da pessoa e da chave de tentativa, `on conflict (id) do nothing`, reler, e o `insert` da versão 1) ou uma versão nova (numa transação: o id da versão derivado da ferramenta, da pessoa e da chave de tentativa, que acha a mesma versão ao repetir; senão `update builder.tool set current_version = current_version + 1 where id = $1 returning current_version`, depois o `insert` da versão) | a mesma chave: uma ferramenta ou uma versão, e o `body_hash` decide entre a mesma e `IDEMPOTENCY_CONFLICT`; duas versões ao mesmo tempo: a trava da linha as enfileira, `n+1` e `n+2`; o mesmo `slug` no mesmo lugar: a chave única recusa (`23505` → `TOOL_REFUSED`, `slug`) | uma transação só | `DATABASE_UNAVAILABLE`, nada muda | `TOOL_SAVED` (ferramenta, versão, por quem) | 3, 24 |
| Gravar uma ferramenta pronta, ao escolhê-la (o mesmo `insert` da ferramenta e da versão 1, com `bound: {}` e todos os campos em `open`, mas o id derivado só da empresa, da ligação e da operação, nunca da pessoa, e o `slug` pela regra de `readySlug`) | duas pessoas ao mesmo tempo, ou a pessoa e o Construtor: uma linha, e as duas releem a mesma; a mesma operação de duas ligações (Matriz e Filial): dois `slug`, pelo id da ligação | o `slug` já usado por uma ferramenta feita à mão: `23505` → `TOOL_REFUSED` com `slug`, e a pronta não entra | `DATABASE_UNAVAILABLE` | `TOOL_SAVED` (`ready: true`) | 3, 24 |
| Apagar uma ferramenta (`delete from builder.tool where id = $1`, depois de `usable(scope)`, que leva as versões por cascata; as escolhas apontam para a versão com `on delete no action`, então uma usada recusa com `23503`) | duas: uma apaga, a outra acha zero linhas e responde `TOOL_NOT_FOUND` | uma transação; `23503` → `TOOL_IN_USE` com os agentes, relidos depois | `DATABASE_UNAVAILABLE` | `TOOL_DELETED` | 3b |
| Publicar (numa transação: `select … from builder.agent where id = $1 for update`, que espera uma mudança do rascunho em andamento, porque toda mudança grava a linha do agente primeiro; conferir o `revision`, ler as escolhas, conferir, `insert` da versão `n+1` com `on conflict (agent_id, source_revision) do nothing` e reler, a cópia de `builder.agent_tool` para `builder.agent_version_tool`, `update agent set active_version`) e depois registrar (U2) | duas do mesmo `revision`: uma versão; de `revision` diferentes: duas, a última ativa | o registro falhar depois do `commit`: a versão fica; o resolvedor registra no próximo turno | banco fora: nada publicado; o registro não é chamado | `AGENT_PUBLISHED` (agente, versão); `AGENT_REGISTER_FAILED` com o código | 5, 9, 11 |
| Voltar a uma versão (`update agent set active_version` e registrar) | duas: a última vence, e o registro relê a linha antes de trocar | como publicar | como publicar | `AGENT_ACTIVATED` | 6, 9 |
| `mastra.addAgent` e `removeAgent` (o registro, só em memória; a procura por `listAgents()`, nunca pelo erro de `getAgent`, que lista as chaves de todas as empresas) | `replace` em fila por agente, num processo só (C63) | `removeAgent` antes de `addAgent`, porque `addAgent` ignora a chave repetida em silêncio (`NM:mastra-Da0Czfte.js:1873`); um run em andamento segue com o `Agent` antigo (`removeAgent` não o para, `:2142-2158`) | — | `AGENT_REGISTERED` (agente, versão, `lazy`); nunca a lista das chaves | 9, 9b, 11 |
| A carga ao ligar (`builder.companies_with_agents()`, depois as versões ativas por empresa, e `addAgent` de cada) antes de `startWorkers` | uma vez por processo | um agente que falha ao montar fica no log e não para os outros; o Hub liga | banco fora ao ligar: o Hub não liga, como `prepare` (`main.ts:214`) | `AGENTS_HYDRATED` (quantos, ms); `AGENT_REGISTER_FAILED` | 10 |
| Abrir a conversa com o agente (`openSession` do kit: a linha `builder.agent_conversation` com o id derivado, depois `createSession` com as marcas e `model.switch`, como a 24.1) | a mesma chave acha a mesma conversa | a linha antes do fio: um corte deixa a linha, e a repetição cria o fio | o agente apagado entre a leitura e a gravação: a chave estrangeira recusa (`23503` → `AGENT_NOT_FOUND`); sem conta: `MODEL_NO_ACCOUNT` antes de gravar | da 24.1 | 12 |
| O turno com o agente (a configuração do registrado ou do rascunho, a cada pedido) | o turno da 24.1 | o agente apagado no meio: a varredura chama `deleteSession`, que aborta o run | banco fora ao ler o rascunho: o turno falha `DATABASE_UNAVAILABLE` | da 24.1 | 13, 14, 15 |
| Apagar o agente, sem trava atravessando chamada de fora (D22): (1) as automações dele (U6) e os fios das conversas dele, de todas as pessoas, pela marca `{ companyId, conexusAgent }`; (2) numa transação curta, o `delete` da linha, que leva versões, escolhas de ferramentas e `agent_conversation` por cascata; (3) `removeAgent`; (4) a varredura de (1) de novo | a abertura, depois do `createSession`, relê a sua linha; ausente, apaga o próprio fio e responde `AGENT_NOT_FOUND`; a segunda remoção acha a linha apagada, varre e responde `AGENT_NOT_FOUND` | um corte entre os passos: a linha sai só em (2), e a próxima remoção varre de novo | banco do Mastra fora em (1): para antes da linha, nada perdido | `AGENT_DELETED` (quantas conversas e automações) | 7, 31 |
| A remoção da pessoa (`created_by = null` nos agentes, nas ferramentas e nas versões de ferramenta, `published_by = null` nas versões do agente; as conversas dela pela marca da pessoa, como a 24.1) | idempotente | uma transação | como a da 24.1 | nada | 7 |
| A remoção do Projeto e da empresa (as automações, os agentes, depois as conversas; `removeAgent` de cada; as ferramentas ficam com a empresa e saem com a linha dela, depois dos agentes) | não falha de novo | a ordem da 24.1 | como a da 24.1 | `AGENTS_RELEASED` (quantos) | 7, 8 |
| `agent_test` (o `Agent` do rascunho por `agentOf`, sem registro, `generate` sem memória, com o dono no `requestContext`) | dois testes, dois `generate` | o modelo falha: a falha como resultado ao Construtor | a conta de modelo fora: `MODEL_*` da 24.1 | `AGENT_TESTED` (agente, ms, ferramentas chamadas) | 9a, 25 |
| O login de leitura e `app_data_read` | dois turnos criam, o segundo acha "already exists" e relê | uma transação | Neon fora: `APP_DATA_UNAVAILABLE`; o tempo: `APP_DATA_TIMEOUT` | `APP_READ_LOGIN_CREATED`, `APP_DATA_READ` (nunca o SQL nem as linhas, C50) | 18, 19, 20 |
| Criar a automação com alvo agente e o passo `check` | a da 24.2 | o agente conferido antes | a da 24.2 | `AUTOMATION_CREATED` com `agentId`; `AUTOMATION_PAUSED` com `AGENT_GONE` | 30, 31 |

## A tabela de referência

Referências: Mastra como instalado (`@mastra/core` 1.79.0, `@mastra/memory` 1.39.0, `@mastra/pg`
1.32.0; `NM:` é `node_modules/@mastra/core/dist`); o fonte do Mastra, com o Mastra Code e a Factory,
na estante `mastra-1.79` `4c22623e`, a tag `@mastra/core@1.79.0` (`M:`). O Conexus é lido no `main`
`a2b7f58d`. "Lido" é linha reaberta pelo autor deste cartão; "relay" é de um ajudante dos estudos, e
a unidade a reabre antes de usar. Os estudos: o do Construtor (2026-11-02, a arquitetura, §1.2 a
§3.7), o de onde rodam os agentes (§3, `A1` reconferido), o de carga (B4) e o de arquitetura
(2026-11-02, §3.1, §6 e §7, o kit dos controladores).

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O agente como dados com versões | U1 | nada | `AGENTS_SCHEMA` (id, status, `activeVersionId`) e `AGENT_VERSIONS_SCHEMA` (número, instruções, modelo, ferramentas, memória, `changeMessage`) (`M:packages/core/src/storage/constants.ts:224-266`, relay); as rotas de versões listar, criar, ativar (`M:packages/server/src/server/handlers/agent-versions.ts:63,119,259`, relay) | o rascunho e as versões imutáveis, uma ativa | embrulhado: tabelas nossas com a forma do Mastra campo por campo, sob a política da empresa (0039); o `@mastra/editor` fica de fora (o 518; as linhas dele não têm empresa) | o estudo do Construtor §3.1 | `A1` | `builder/agents/tables.ts`, `builder/agents/agents.ts` |
| A ferramenta preset (o recorte), com versões | U1, U2 | as leituras do kit com `class` (`packages/connectors/src/kernel/operation.ts:140-154`, lido); `connector_read` pela porta (`builder/connectors/connector-tools.ts:175-215`, lido) | `createTool` (`M:packages/core/src/tools/tool.ts:750`, relay); o editor resolve as ferramentas por id (`M:packages/editor/src/namespaces/agent.ts:1329-1352`, relay) | a ferramenta existe uma vez, e o agente a pega pelo id | nativo: `createTool` cujo `execute` chama `access.read` com os valores fixos por cima. A ferramenta é uma linha com versões imutáveis (o estudo §3.2), e o agente escolhe as suas e prende a versão de cada uma em cada versão dele. A ferramenta é da empresa, numa biblioteca só (`T1`); o estudo a punha no Projeto. As leituras do kit são as ferramentas prontas. A 24.4 soma as ferramentas em código como o valor `CODE` da coluna `kind` de `builder.tool` (hoje só `PRESET`), sem migrar as linhas | — | "ferramentas específicas por agente" (2026-11-02), lido sob o `T1` do mesmo dia: o agente escolhe as suas na biblioteca da empresa | `builder/tools/tools.ts`, `builder/agents/tools.ts` |
| O `new Agent` de uma versão e o registro | U2 | os agentes de código no construtor do `Mastra` (`builder/conversation/mastra.ts:13-33`, lido) | o editor: `new Agent({ id, … })` e `addAgent(agent, storedAgent.id, { source: 'stored' })` (`M:packages/editor/src/namespaces/agent.ts:1169,1197-1198`), `removeAgent` ao trocar (`:443-446`); `addAgent` (`NM:mastra/index.d.ts:974`), a chave repetida ignorada (`NM:mastra-Da0Czfte.js:1873`), `removeAgent` (`NM:mastra/index.d.ts:1078`; `NM:mastra-Da0Czfte.js:2142-2158`), `listAgents` (`NM:mastra/index.d.ts:894`); o erro de `getAgent` lista todas as chaves (`NM:mastra-Da0Czfte.js:1566-1580`); a chave é o id do agente, um lugar por agente com a versão ativa (o estudo de onde rodam os agentes, §3, correção 1), não `co<c>_ag<a>@v<n>` | um `Agent` registrado por agente guardado, trocado ao mudar | nativo | — | `A1`; a B de 2026-11-02 | `builder/agents/registry.ts`, `builder/agents/agent.ts` |
| Registrar antes da agenda | U2 | `prepare`, `createHub` e `start` (`main.ts:214-216`, lido); `startWorkers` (`builder/conversation/public.ts:185-187`, lido) | `isTargetReady` resolve o agente pelo id e apaga depois de 3 faltas (`NM:worker-BgnTmeB6.js:347-356`, `NM:scheduler-3IjINScC.js:9,146-186`); `startWorkers` (`NM:mastra-Da0Czfte.js:5037`) | a agenda só fala com o que está registrado | nativo: a carga antes de `startWorkers` | — | — | — |
| Ler as empresas com agentes ao ligar | U1 | `apps.companies_with_apps()`, a função da 9 para o conserto ao ligar (`database-grants.sql:19-22`, lido) | — | uma função `SECURITY DEFINER` de um papel sem login, executada só por `hub_runtime` | nativo (o padrão da 9) | — | a aprovação desta página (D11) | a migração |
| Conversar com o agente registrado | U2 | o controlador do Assistente: um agente com instruções, modelo e ferramentas em função do `requestContext` (`builder/assistant/assistant.ts:245-313`, lido) | o controlador tem um agente de apoio (`NM:agent-controller/types.d.ts:216`); controladores só no construtor do `Mastra` (`M:packages/core/src/mastra/index.ts:2042-2049`, relay); os campos dinâmicos (`NM:agent/types.d.ts:567,650,659,745`); `getInstructions` (`NM:agent/agent.d.ts:720`), `getModel` (`:910`), `listTools` (`:840`), `getMemory` (`:589`); um modo sem `availableTools` não filtra (`NM:agent-controller-DO6rGsQm.js:8390-8391`) | um controlador "agentes" cujo agente delega, a cada pedido, ao registrado | nativo: a forma (i) do estudo §3.4, que guarda as sessões da 0050 e as telas da 24.1; a (ii), rotas nossas que chamam `agent.stream`, refaria as duas. A prova de que a aprovação passa pelo controlador é da 24.5 (o primeiro que precisa) | — | — | `builder/agents/controller.ts` |
| A memória por agente | U2 | a memória da conversa com a observacional sempre ligada (`builder/conversation/builder.ts:131-172`, lido) | `memory` dinâmico no agente (`NM:agent/types.d.ts:745`); o controlador passa a dele só a um agente sem memória própria (`M:packages/core/src/agent-controller/agent-controller.ts:1622-1625`, relay); `observationalMemory` (`NM:memory/types.d.ts:956`); `lastMessages` 10 por padrão (`node_modules/@mastra/core/dist/agent-tuAMgHe3.js:21615`) e obsoleto (`NM:memory/types.d.ts:870-875`) | a memória escolhida pelo agente | nativo: duas `Memory` no mesmo armazenamento, com e sem a observacional, escolhidas pela versão; nenhum `lastMessages` na tela (obsoleto) | — | "memória editável" (2026-11-02) | — |
| O modelo por agente | U2 | `openConversation` com `model` e `conversationStart` (`builder/assistant/open.ts:111-150`; `builder/model-accounts/defaults.ts:86-111`, lidos) | `session.model.switch` (`open.ts:146`, lido) | o modelo da sessão | nativo: o modelo da versão vira o `model` da abertura; sem conta, `MODEL_NO_ACCOUNT` | — | "modelo por agente" (2026-11-02) | — |
| A porta das rotas | U1b, U2, U4 | `FIXED_LIST` e `Params.controllerId` (`builder/conversation/guard.ts:20-44`, lido), com o `if` por tipo (`:137-138`, lido) | `@mastra/fastify` `registerRoute` com `access: 'session'` (a 14.2); as rotas de sessão do Mastra acham a sessão só pelo id, sem dono (`node_modules/@mastra/server/dist/server/handlers/agent-controller.js:84-104`, relay); a Factory guarda um controlador só (`M:mastracode/factory/src/routes/session-access.ts`, relay) | as rotas dos controladores, parametrizadas pela chave | embrulhado: a U1b tira o `enum` de `CONTROLLER_KINDS` e troca o `if` por `part.admit`; a U2 e a U4 só somam um tipo; as rotas continuam seis | sem referência para um guarda de vários controladores; o dono é nosso (o estudo de arquitetura, §3.1) | "okay sibre auth" (2026-11-01) | — |
| O único `Mastra` e as partes | U1b | `conversation/public.ts` dono do `Mastra`, do ciclo e da remoção, com `AssistantPart` e `AutomationPart` (`:48-63,83-102,131-211`, lido) | `new Mastra({ agentControllers, workflows })` (`builder/conversation/mastra.ts:13-33`, lido); o registro de módulos do n8n (`packages/cli/src/modules/modules.manifest.ts:6-17` em `2e855356`) e do activepieces (`packages/server/api/src/app/app.ts:236-250` em `f34c43cd`), relay | um registro próprio, nunca um assunto que é o registro dos outros | embrulhado: o Mastra registra; a ordem de ligar, parar e remover é nossa (`mastra.shutdown` não drena controladores, `NM:mastra-Da0Czfte.js:5521-5551`, relay) | o estudo de arquitetura, §3.1 | "P1. A" | `builder/mastra/hub-mastra.ts` |
| O que toda conversa repete | U1b | o dono, a leitura por pedido, a admissão, a abertura e a remoção, nos dois controladores (a tabela do estudo, §3.1; as linhas na U1b, lidas) | `createSession({ tags })` e `listThreads({ filter: { metadata } })` (`NM:agent-controller/agent-controller.d.ts:119-146,289-293`, relay) | o nativo, chamado de um lugar só | embrulhado: um kit nosso sobre as peças nativas | as ~250 linhas de mesma forma (o estudo, §2.2 e §3.1) | "P1. A" | `builder/controller-kit/` |
| Não duplicar a conversa | U1b | dois jeitos: a linha do Builder com `attempt_key` sob `transactionLock` (`conversation/store.ts:72-131`, lido) e o id derivado do Assistente (`assistant/open.ts:84-92`, `chosen.ts:28-56`, lidos) | `createSession` acha ou cria pelo id (`conversation/routes.ts:28-44`, lido) | o id da conversa decide a repetição | nativo: o id derivado da tentativa e o `createSession` do Mastra; a linha do Hub guarda o que a primeira tentativa mandou (C37, D17) | — | — | `builder/controller-kit/open.ts` |
| O atraso do laço e o processador | U2 | `logMemory` (`platform/memory.ts:10-26`, lido) | `monitorEventLoopDelay` e `process.cpuUsage` do Node (o `bench/measure.ts` do estudo de carga) | medir no próprio processo | nativo | — | — | — |
| O Construtor | U4 | o Builder e o Assistente, dois controladores (`builder/conversation/public.ts:131-137`, lido) | o agente aberto que monta workflows e o seu manual (`M:packages/core/src/workflows/builder/agent.ts:13-24`, `authoring-playbook.ts:37-40`, relay); a ferramenta que grava e confere o que voltou (`M:mastracode/sdk/src/tools/workflows/create-workflow.ts:61-120`, relay) | um agente com ferramentas pequenas e validadas, nunca regenerar tudo | nativo: um terceiro controlador no construtor do `Mastra` | — | `C1` | `builder/construtor/construtor.ts`, `builder/construtor/prompt/construtor.md` |
| Testar o rascunho | U4 | — | `Agent.generate` (`NM:agent/agent.d.ts`; a U4 reabre a linha) | o agente montado e chamado uma vez | nativo | — | `C1` | `builder/construtor/test-draft.ts` |
| Os dados do app | U3 | o login do app e o de migração (`packages/hub-api/src/app-login.ts:8-15`, lido); as permissões do esquema (`apps/server/src/platform/company-postgres.ts:148-170`, lido) | Postgres 17: `default_transaction_read_only`, `GRANT SELECT`, `ALTER DEFAULT PRIVILEGES`; a senha derivada (0043) | um login só de leitura, a recusa no banco | nativo | — | — | `builder/agents/app-data.ts` |
| O alvo da automação | U6 | `AutomationInput` versão 1 (`builder/automations/run.ts:37-50`, lido; o comentário diz que a versão deixa um alvo novo entrar); `conversed` abre a conversa (`run.ts:96-142`, lido) | a agenda com alvo agente chama o agente direto (`dist/docs/references/reference-schedules-overview.md:43,57`) | o alvo agente da agenda pula a conversa | nativo: o mesmo workflow da 24.2, que abre a conversa do agente; nunca o alvo agente da agenda, que pularia a conversa marcada (`C1` da 24.2) | — | `A1`, `C1` da 24.2 | — |
| As telas | U5 | a conversa do Assistente no Projeto (`routes/_app/companies/$companyId/projects/$projectId_.assistant.*`); a barra (`hub/projects/project-rail.tsx:111-175`, lido) | a página de agente do Studio: conversas, conversa, painel Config (`agent-page-config-panel.jpg`; `M:packages/playground-ui/.../agent-overview-panel.tsx:134-240`, relay) | estrutura e fluxo | nativo: as peças da 24.1; nenhum estilo do Studio | — | "estrutura e fluxo, nunca o estilo" (2026-11-01) | `apps/web/src/builder/agents/` |
| As Ideias do Construtor | U8 | `agent_read` diz de cada ferramenta do rascunho se há versão nova (U4); a página marca a ligação que o Projeto não oferece mais (U5) | nenhuma referência tem o bloco; a tela 1 do protótipo do Construtor (2026-11-02) dá o lugar, e o próprio protótipo avisa que ideias genéricas viram ruído | uma leitura das faltas, nunca uma sugestão gerada | nativo: uma consulta às tabelas da U1 (`builder.agent_version_tool` contra `builder.tool.current_version`, as ligações da versão ativa contra `connectors.connections(scope)`); nenhuma chamada de modelo ao abrir a área, e o Construtor entra só quando a pessoa pede | — | "4A" (2026-11-02) | `builder/agents/ideas.ts`, `apps/web/src/builder/agents/ideas.tsx` |
| A página Agentes do Início | U9 | as Automações: uma rota com `projectId` opcional (`packages/hub-api/src/automations.ts:137,149-155`; `apps/server/src/builder/automations/routes.ts:23`, lidos), um componente `Automations({ companyId, projectId? })` (`apps/web/src/builder/automations/automations.tsx:245-259`, lido) com o lugar de cada linha (`PlaceName`, `place.tsx:10`, lido), duas rotas finas (`routes/_app/companies/$companyId/automations.index.tsx` e `projects/$projectId_.automations.index.tsx`, lidas) e a entrada do Início escondida do membro (`routes/_app/companies/$companyId/route.tsx:75-82`, lido) | a lista do Studio, todos os agentes, um clique abre a página do agente (`REF:mastra-studio`, a lista de agentes) | uma lista, o lugar em cada linha, a edição na página do agente | nativo: a mesma rota e o mesmo componente com o filtro, como as Automações; nenhuma segunda lógica, nenhuma edição no Início | — | "`V1`" (2026-11-02) | `apps/web/src/builder/agents/agent-list.tsx`, `new-agent.tsx`, `routes/_app/companies/$companyId/agents.index.tsx` |

**A medida do transplante.** Nada vem do repositório antigo: ele não tinha agentes de Projeto. Do
cartão anterior deste pull request ficam a U2 dele (os dados do app, agora a U3), a remoção em
passos sem trava e o alvo da automação (agora a U6).

**A dívida.**
- Os agentes não têm teto por Projeto: nenhuma referência ou medida dá um número; a lista lê todos os
  agentes do Projeto. Gatilho: um Projeto com mais de 50 agentes.
- As instruções vão inteiras ao modelo a cada turno, até 8.000 caracteres: o dobro do pedido da
  automação (`AUTOMATION_PROMPT_MAX`), porque o texto do sistema do starter do Mastra que o fundador
  capturou passa de 4.000 (a U1 mede o arquivo `templates/template-starter-agent` na estante e
  grava o número no teste). Gatilho: uma recusa de tamanho no uso.
- Uma ferramenta preset fixa valores de primeiro nível da entrada da operação. "Pedidos do cliente
  X" é um recorte de `pedidos`, com `codigoCliente` aberto
  (`packages/connectors/src/sankhya/operations/vendas.ts:8-14`, lido). O limite são os valores
  relativos ("ontem", "últimos 90 dias"): um valor fixo é literal, então uma data relativa fica aberta
  (o modelo a preenche pela data do bloco da conversa) ou é uma consulta fixa de `consultar` com
  `CURRENT_DATE` (`packages/connectors/src/sankhya/door.ts:123-131`, lido). Nunca montar SQL por
  texto. Gatilho: o fundador pedir datas relativas fixas.
- As ferramentas não têm teto por agente nem por empresa: nenhuma referência dá um número; a lista e
  `tool_search` leem todas as que o Projeto pode usar. Gatilho: um agente com mais de 30 ferramentas,
  ou uma lista com mais de 200.
- Uma ferramenta presa a uma versão publicada não sai enquanto o agente existir (`TOOL_IN_USE`), porque
  voltar para aquela versão precisa dela. Gatilho: o fundador pedir para limpar ferramentas velhas.
- `tool_search` procura por texto no `slug` e na descrição, sem busca semântica. Gatilho: o Construtor
  refazer uma ferramenta que já existia.
- Apagar o agente no meio de um turno aborta o turno. A confirmação avisa.
- O registro é por processo (C63). Gatilho: um segundo processo do Hub.
- As Ideias do Construtor não têm teto nem ordem por importância: a leitura devolve todas, pelo nome do
  agente. Gatilho: um Projeto com mais de 10 ideias ao mesmo tempo.

**Issues futuras** (a abrir no fechamento).
- O id de cada agente nos rastros fica para a 21.1.
- O login de leitura pode tomar travas consultivas da sessão; o HTTP do Neon fecha a sessão a cada
  pedido. Gatilho: o transporte manter conexões.
- Espalhar as automações das 7h por alguns minutos (o estudo de carga, B4: a agenda dispara até 600
  por minuto). Gatilho: mais de 100 disparos no mesmo minuto.

## U1 O agente como dados

**Base e modelo.** `main` depois do fechamento da 24.2. Opus: seis tabelas novas
com a palavra D11, a concorrência do rascunho e das versões de ferramenta, e a remoção.

### As linhas da tabela

- **O modelo de tabela.** `builder.assistant_conversation` (`apps/server/src/builder/assistant/tables.ts:14`,
  lido): tabela de `builder`, só o Hub escreve, chaves estrangeiras com a empresa e o Projeto. Cumpre
  C21, C23 e C26. A política é a da empresa, sem pessoa, como `OWN_COMPANY` de
  `hub/projects/tables.ts:23,56` (lido); nunca a regra por pessoa das conversas.
- **A forma do Mastra.** `AGENT_VERSIONS_SCHEMA` (`M:packages/core/src/storage/constants.ts:236-266`,
  relay): os campos que esta etapa usa (instruções, modelo, ferramentas, memória, `changeMessage`);
  os outros (scorers, processors, skills, workspace) não entram até um consumidor (D18).
- **A função ao ligar.** `apps.companies_with_apps()` (`database-grants.sql:19-22`, lido) e a sua
  migração da 9: o mesmo desenho, `builder.companies_with_agents()`, de um papel sem login que lê só
  `company_id` e `active_version` de `builder.agent`.
- **A remoção.** `builder/automations/release.ts` (66 linhas, relay) e `releaseOf`
  (`builder/conversation/public.ts:83-104`, lido): os agentes saem depois das automações e antes das
  conversas.
- **A admissão.** `hub/identity/admission.ts:71-74` (lido): `manageConnections` trava; `askAssistant`
  não.
- **A operação do kit.** `Operation` (`packages/connectors/src/kernel/operation.ts:140-154`, lido):
  `id`, `class` e `input` (Zod), que conferem a ferramenta.
- **A ferramenta pelo id.** O editor do Mastra resolve as ferramentas de um agente pelo id
  (`M:packages/editor/src/namespaces/agent.ts:1329-1352`, relay): aqui o agente guarda ids de versões
  de ferramenta, nunca uma cópia da configuração.

### O raio da mudança

Nada sai do `main`.

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/agents/` | Cria `tables.ts`, `agents.ts` (o serviço: criar, ler, listar, mudar o rascunho e as escolhas de ferramentas, publicar, versões, ativar, apagar), `routes.ts`, `release.ts`, `public.ts` | a U2, a U4, a U6 |
| `apps/server/src/builder/tools/` | Cria `tables.ts`, `tools.ts` (o serviço: gravar, versão nova, listar as que um Projeto pode usar, procurar, apagar, e `usable(scope, versionIds)`, que o serviço dos agentes chama), `routes.ts`, `public.ts` | `builder/agents/`, a U4 |
| `apps/server/migrations/` | Cria `<data>_e243_agents` (as seis tabelas) e, num commit próprio, `<data>_e243_agents_grants` (as permissões e a função) (D11) | `npm run check-migrations` |
| `apps/server/database-grants.sql` | Muda: `hub_company` com `SELECT, INSERT, UPDATE, DELETE` em `builder.agent`, `builder.tool` e `builder.agent_tool`, `SELECT, INSERT, DELETE` e `UPDATE(published_by)` em `builder.agent_version`, `SELECT, INSERT, DELETE` e `UPDATE(created_by)` em `builder.tool_version` (a remoção da pessoa), `SELECT, INSERT, DELETE` em `builder.agent_version_tool`; a função e o seu papel sem login; `EXECUTE` só a `hub_runtime` | `catalog.test.ts` |
| `apps/server/src/hub/identity/admission.ts` | Muda: as ações `manageAgents` e `publishAgent`, as duas com `MANAGE_CONNECTIONS` e trava nas gravações, como `manageConnections` (a etapa de papéis troca a declaração de `publishAgent`) | `builder/agents/` |
| `apps/server/src/builder/conversation/public.ts` | Muda `releaseOf`: `agents.release` depois das automações e antes das conversas (a U1b move a remoção para `builder/mastra/hub-mastra.ts`, com `agents.release` em `releaseFirst`) | as remoções |
| `packages/hub-api/src/agents.ts`, `packages/hub-api/src/tools.ts`, `packages/hub-api/src/agent-ids.ts` | Cria os contratos abaixo; muda `index.ts`, `failures.ts` (os códigos e as frases), o OpenAPI gerado | a U2, a U4, a U5, a U6, a U7 |
| `scripts/removals.json` | Muda: as proteções novas (o membro recusado, o agente de outro Projeto, o `revision` velho, a operação de escrita numa ferramenta, a ferramenta usada que não sai), cada uma com o teste que a pega | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/agents.ts
const BASE = '/api/companies/{companyId}/projects/{projectId}/agents'
// GET    /api/companies/{companyId}/agents?projectId= -> { agents: AgentSummary[] }   acesso manageAgents; uma rota só para a área do
//        Projeto (com `projectId`, obrigatório na 24.3) e para a página do Início da U9 (sem: a U9 o deixa opcional), como `listAutomations` (`packages/hub-api/src/automations.ts:137,149-155`)
// POST   BASE  CreateAgent, attemptKey: true       -> 201 { agent: AgentDetail }
// GET    BASE/{agentId}                            -> { agent: AgentDetail }
// PATCH  BASE/{agentId}/draft  DraftPatch          -> { agent: AgentDetail }            AGENT_DRAFT_STALE (409), REQUEST_MALFORMED, AGENT_TOOL_REFUSED
// POST   BASE/{agentId}/publish  Publish           -> { agent: AgentDetail, version: AgentVersionSummary }   acesso publishAgent; AGENT_DRAFT_INVALID, AGENT_DRAFT_STALE
// GET    BASE/{agentId}/versions                   -> { versions: AgentVersionSummary[] }
// POST   BASE/{agentId}/versions/{number}/activate -> { agent: AgentDetail }           acesso publishAgent; AGENT_VERSION_NOT_FOUND
// DELETE BASE/{agentId}                            -> 204
// falhas de todas: NOT_FOUND, SESSION_REQUIRED, DATABASE_UNAVAILABLE, AGENT_NOT_FOUND
export const AGENT_NAME_MAX = 80                   // o da automação: a mesma linha nas listas
export const AGENT_INSTRUCTIONS_MAX = 8000         // a dívida
// AgentId, de agent-ids.ts: conferido em agents.ts pela empresa e o Projeto (C23)
export const AgentMemory = z.object({ observational: z.boolean() })
export const AgentConfig = z.object({
  name: z.string().trim().min(1).max(AGENT_NAME_MAX),
  description: z.string().trim().max(280),                     // as duas linhas do cartão e da lista
  instructions: z.string().max(AGENT_INSTRUCTIONS_MAX),        // vazio só no rascunho; publicar exige (AGENT_DRAFT_INVALID)
  model: ModelId.nullable(),                                   // null: o modelo de quem conversa
  memory: AgentMemory,
  connections: z.array(ConnectionId).max(CONNECTIONS_MAX)      // um subconjunto das ligações do Projeto; CONNECTIONS_MAX sai de automations.ts para um dono só (C26)
    .refine((ids) => new Set(ids).size === ids.length),        // sem repetidas
  web: z.boolean(), appData: z.boolean(),
})
export const CreateAgent = z.object({ name: AgentConfig.shape.name, description: AgentConfig.shape.description.optional() })
export const DraftPatch = AgentConfig.partial().extend({
  revision: z.int().positive(),
  tools: z.array(ToolVersionId).refine((ids) => new Set(ids).size === ids.length).optional(),   // troca as escolhas inteiras
  ready: z.array(ToolTarget).optional(),                       // prontas a somar: o serviço as grava na biblioteca (a regra das prontas)
})
export const Publish = z.object({ revision: z.int().positive(), message: z.string().trim().max(280) })
export const AgentState = z.discriminatedUnion('kind', [                                  // C21
  z.object({ kind: z.literal('DRAFT') }),                                                  // nunca publicado
  z.object({ kind: z.literal('PUBLISHED'), version: z.int().positive(), changed: z.boolean() }),   // changed: o rascunho difere da ativa
])
export const AgentSummary = z.object({ id: AgentId, projectId: ProjectId, name: z.string(), description: z.string(), state: AgentState, updatedAt: z.iso.datetime() })
export const AgentDetail = AgentSummary.extend({
  draft: AgentConfig, revision: z.int(),
  tools: z.array(ToolSummary.pick({ id: true, slug: true, connectionId: true, operation: true, effect: true, latest: true }).extend({ version: ToolVersionDetail })),   // a escolhida e a mais nova
  offered: z.array(z.object({ connectionId: ConnectionId, connector: z.string(), name: z.string(), reads: z.array(z.object({ operation: z.string(), summary: z.string() })) })),
  createdBy: z.object({ personId: PersonId, name: z.string() }).nullable(),
})
export const AgentVersionSummary = z.object({ number: z.int().positive(), message: z.string(), active: z.boolean(), publishedAt: z.iso.datetime(), publishedBy: z.object({ personId: PersonId, name: z.string() }).nullable() })
```

```ts
// packages/hub-api/src/tools.ts (a biblioteca é da empresa, `T1`; a rota pelo Projeto devolve o que ele pode usar)
const TOOLS = '/api/companies/{companyId}/projects/{projectId}/tools'
// GET    TOOLS                                -> { tools: ToolSummary[], ready: ReadyTool[] }   acesso manageAgents; as da biblioteca que este Projeto pode usar e as leituras prontas das ligações dele ainda fora dela
// POST   TOOLS  ToolInput, attemptKey: true   -> 201 { tool: ToolDetail }    TOOL_REFUSED
// GET    TOOLS/{toolId}                       -> { tool: ToolDetail }        TOOL_NOT_FOUND
// POST   TOOLS/{toolId}/versions  ToolVersionConfig, attemptKey: true -> 201 { tool: ToolDetail }   TOOL_REFUSED, TOOL_NOT_FOUND, IDEMPOTENCY_CONFLICT
// DELETE TOOLS/{toolId}                       -> 204                         TOOL_IN_USE (409, { agents: { id, name }[] }), TOOL_NOT_FOUND
// GET, versions e DELETE passam por `usable(scope)`: uma ferramenta que este Projeto não pode usar é TOOL_NOT_FOUND.
// Os ids moram em `packages/hub-api/src/agent-ids.ts` (`AgentId`, `ToolId`, `ToolVersionId`): `agents.ts` importa
// `tools.ts` e `agent-ids.ts`; `tools.ts` importa só `agent-ids.ts`, nunca `agents.ts` (sem ciclo entre constantes Zod).
export const ToolSlug = z.string().regex(/^[a-z][a-z0-9_]{0,39}$/)   // o nome que o modelo vê: `tool_<slug>`; não muda entre versões
export const ToolTarget = z.object({                          // da ferramenta; não muda entre versões
  connectionId: ConnectionId, operation: OperationId,          // a marca do kit (`kernel/operation.ts`); uma leitura (class 'read'), conferida no serviço
})
export const ToolVersionConfig = z.object({                   // de cada versão
  description: z.string().trim().min(1).max(500),
  bound: z.record(z.string(), z.unknown()),                    // os valores fixos, conferidos pelo esquema da operação
  open: z.array(z.string()),                                   // os campos de primeiro nível que o modelo preenche; fora de `bound`
})
// O esquema que o modelo vê: `operation.input.pick(open)`; a entrada que a operação recebe:
// `{ ...doModelo, ...bound }`. `bound` e `open` não se cruzam e cobrem os obrigatórios (TOOL_REFUSED).
// Uma leitura do kit como está é `bound: {}` com todos os campos em `open`: a ferramenta pronta do conector.
// Escolher uma pronta grava-a na biblioteca (o id derivado da empresa, da ligação e da operação, nunca da
// pessoa) e depois no rascunho. `readySlug`: a operação em minúsculas, com `.` e `-` trocados por `_`,
// mais `_` e os seis primeiros caracteres do id da ligação, cortado em 40 (Matriz e Filial dão dois).
export const ToolInput = ToolTarget.extend(ToolVersionConfig.shape).extend({ slug: ToolSlug })
export const ToolEffect = z.enum(['READ'])                     // o que a ferramenta faz, pela `class` da operação; a 24.5 soma as que gravam
export const ReadyTool = z.object({ connectionId: ConnectionId, operation: OperationId, summary: z.string(), slug: ToolSlug })
export const ToolVersionDetail = ToolVersionConfig.extend({ id: ToolVersionId, number: z.int().positive() })
export const ToolSummary = ToolTarget.extend({
  id: ToolId, slug: ToolSlug, description: z.string(), effect: ToolEffect,   // o que lê (a ligação e a operação) e o que faz
  latest: z.object({ id: ToolVersionId, number: z.int().positive() }),
  usedBy: z.array(z.object({ id: AgentId, name: z.string() })),   // rascunhos e versões publicadas
})
export const ToolDetail = ToolSummary.extend({ versions: z.array(ToolVersionDetail) })
```

```ts
// apps/server/src/builder/agents/tables.ts (a política da empresa em todas, como OWN_COMPANY)
// builder.agent: id uuid pk; company_id -> companies (cascade); project_id -> projects (cascade);
//   draft jsonb not null (AgentConfig); revision int not null default 1; active_version int null;
//   created_by text null, sem chave estrangeira (D17); body_hash text not null; created_at, updated_at
// builder.agent_version: agent_id -> builder.agent (cascade); number int; company_id; config jsonb not null
//   (AgentConfig); source_revision int not null; message text not null;
//   published_by text null; published_at; primary key (agent_id, number); unique (agent_id, source_revision)
// apps/server/src/builder/tools/tables.ts
// builder.tool: id uuid pk; company_id -> companies (cascade), sem Projeto (`T1`: a biblioteca da empresa);
//   kind text not null default 'PRESET'; connection_id uuid not null e operation text not null (ToolTarget,
//   sem chave estrangeira: a ligação perdida recusa no uso, como no rascunho); slug text; current_version int not null default 1; created_by
//   text null (D17); body_hash text; created_at, updated_at; unique (company_id, slug)
// builder.tool_version: id uuid pk; tool_id -> builder.tool (cascade); company_id; number int; config jsonb
//   not null (ToolVersionConfig); created_by text null; body_hash text; created_at; unique (tool_id, number);
//   unique (tool_id, id); unique (company_id, id)
// builder.agent_tool: agent_id -> builder.agent (cascade); tool_id; tool_version_id; company_id;
//   (tool_id, tool_version_id) -> builder.tool_version (tool_id, id) e (company_id, tool_version_id) ->
//   builder.tool_version (company_id, id), as duas `no action`; primary key (agent_id, tool_version_id);
//   unique (agent_id, tool_id)
// builder.agent_version_tool: (agent_id, number) -> builder.agent_version (cascade); tool_version_id;
//   company_id; (company_id, tool_version_id) -> builder.tool_version (company_id, id) `no action`;
//   primary key (agent_id, number, tool_version_id)
// Uma ferramenta usada recusa sair (23503 -> TOOL_IN_USE). A remoção da empresa não depende da ordem das
// cascatas: `releaseOf` apaga os agentes (`agents.release`) antes da linha da empresa.
// apps/server/src/builder/agents/public.ts
export type FrozenVersion = AgentConfig & {
  tools: readonly (ToolTarget & ToolVersionConfig & { slug: ToolSlug })[]   // lidas pelas versões presas, que nunca mudam
  source: { kind: 'VERSION'; number: number } | { kind: 'DRAFT'; revision: number }   // C21
}
export type AgentEvent =
  | { kind: 'ACTIVATED'; companyId: CompanyId; agentId: AgentId; version: number }   // publicar e voltar
  | { kind: 'DELETED'; companyId: CompanyId; agentId: AgentId }
export type Agents = {
  routes: (app: FastifyInstance) => void
  service: AgentService                                   // o que a U4 chama, com as mesmas recusas
  activeOf: (scope: OfProject, agentId: AgentId) => Promise<FrozenVersion | null>   // a U2 e a U6
  draftOf: (scope: OfProject, agentId: AgentId) => Promise<FrozenVersion>          // a conversa de teste e agent_test
  publishedAll: () => Promise<readonly (FrozenVersion & OfProject & { agentId: AgentId })[]>   // a carga ao ligar
  release: (scope: { companyId: CompanyId; projectId?: ProjectId; personId?: PersonId }) => Promise<number>
  onChange: (hook: (event: AgentEvent) => Promise<void>) => void   // a U2 (o registro) e a U6 (as automações)
}
```

O serviço confere numa transação só, com a admissão (S8): as ligações do rascunho contra as que o
Projeto oferece agora (`connectors.connections(scope)`); a operação de uma ferramenta contra as
leituras da ligação e a classe pela definição do kit; `bound` pelo esquema da operação
(`input.partial()`); cada versão de ferramenta escolhida por `tools.usable`: da empresa e de uma ligação que
o Projeto recebeu. A ligação de uma ferramenta escolhida não precisa estar em `draft.connections`: a
ferramenta basta; `draft.connections` decide só `connector_read` e `connector_notes`. O modelo por
`isChoosable`. Uma ligação que o Projeto perdeu depois fica no rascunho, e numa ferramenta escolhida,
e recusa só publicar (`AGENT_DRAFT_INVALID`), para a página marcá-la. Publicar copia o rascunho do
mesmo `revision` para `config` e as escolhas para `builder.agent_version_tool`; `state.changed` compara o `revision` do rascunho com o
`source_revision` da ativa.

### As skills e a leitura

`mastra` (a forma das versões), `fastify-best-practices`, `pstack:tdd`; as linhas de
`docs/reference/stack.md` para `apps/server/src/builder/` e `apps/server/migrations/`.
[data](../guides/data.md) D11, D17, D18, D22; [testing](../guides/testing.md) T5, T12.

### A ordem do trabalho

1. **A prova primeiro.** `routes.test.ts`, "publicar": cria uma ferramenta e um agente, escolhe a
   ferramenta, publica, grava a versão 2 da ferramenta e muda o rascunho, lê a versão 1 do agente igual,
   com a versão 1 da ferramenta; falha hoje.
2. A migração das tabelas; num commit próprio, a das permissões, da função e `database-grants.sql`
   (D11). `npm run check-migrations`.
3. `tools/tools.ts` e as rotas das ferramentas; `agents.ts` e `routes.ts`, com o `revision`; os
   contratos do `hub-api` e o OpenAPI. Regras: C21,
   C23, C26, C27, S8, S10.
4. `release.ts`, `onChange` e a ordem em `releaseOf`. Regras: D17, D22, T12.

### Como se prova

Cada critério da U1 pelo teste da sua linha, pelo servidor de teste e o Postgres de teste com os
dois bancos. O teste que falha hoje: "publicar". Comando: os testes tocados, `npm run typecheck`,
`npm run lint`, `npm run check-migrations`.

### Parar se

- Conferir `bound` pelo esquema da operação pede o kit dentro de `builder/` de um jeito que a regra
  das pastas recusa: relata o caminho que a porta dos conectores oferece.
- A função ao ligar precisa ler mais que `company_id` e `active_version`: para; a palavra D11 é
  dessa forma.

## U1b O kit dos controladores

**Base e modelo.** `main` depois da U1. Opus: move o dono do único `Mastra` e o que as duas conversas
repetem para dois assuntos novos, sem mudar nada que a pessoa vê, e troca dois jeitos de não duplicar
a conversa por um. A resposta do fundador "P1. A" (2026-11-02), sobre o estudo de arquitetura do
mesmo dia (§3.1, §6, §7): a U2 e a U4 nascem sobre o kit.

### As linhas da tabela

- **O dono do `Mastra`.** `builder/conversation/public.ts` (lido) é ao mesmo tempo a conversa do
  Builder e o dono do único `Mastra`: `createMastra` (`:131-137`), o fim dos turnos (`watchRuns`,
  `:138-150`), `prepare`, `start`, `settle` e `close` (`:173-211`), a remoção em cadeia (`releaseOf`,
  `:83-102`) e as "partes" dos outros (`AssistantPart`, `AutomationPart`, `:48-63`), ligadas em
  `conversations-of.ts:30-92` (lido). O Mastra já é o registro: `new Mastra({ agentControllers,
  workflows })` (`builder/conversation/mastra.ts:13-33`, lido); o que falta é a nossa ordem de
  ligar, parar e remover. As referências registram cada módulo num lugar só (n8n
  `packages/cli/src/modules/modules.manifest.ts:6-17` em `2e855356`; activepieces
  `packages/server/api/src/app/app.ts:236-250` em `f34c43cd`; relay do estudo).
- **O dono do fio.** `memoryOwner` (`builder/conversation/builder.ts:115-117`, lido),
  `assistantOwner` (`builder/assistant/context.ts:25-30`, lido) e o regex que decodifica os dois
  (`builder/conversation/turn-of.ts:12-13,26-37`, lido), com os dois tipos fixos.
- **A porta das seis rotas.** `Params.controllerId` com os dois ids (`guard.ts:41-44`, o `enum` em `:42`, lido) e o `if`
  por tipo (`guard.ts:137-138`, lido): o Builder confere o índice do Hub (`store.mine`), o
  Assistente a ação `askAssistant`.
- **A admissão escrita uma vez.** `askAssistant` em três lugares de `builder/`
  (`conversation/public.ts:73`, `assistant/assistant.ts:124`, `assistant/open.ts:51`, lidos); o
  quarto, `hub/connectors/assistant-port.ts:82`, é de outro assunto e fica.
- **Uma leitura por pedido.** Três `WeakMap<RequestContext, Promise<…>>` à mão
  (`conversation/builder.ts:84`, `assistant/context.ts:76`, `assistant/assistant.ts:228`, lidos); o
  de `assistant.ts:207` (`readsOfRun`) é um contador e fica.
- **As fábricas.** A configuração do agente (`inputProcessors`, `outputProcessors`,
  `errorProcessors`, `maxRetries: 0`, `maxProcessorRetries`, o tempo do modelo, a memória) e o
  `new AgentController` (id, storage, memory, agent, um modo, `disableBuiltinTools`, `initialState`)
  escritos duas vezes (`conversation/builder.ts:234-263`, `assistant/assistant.ts:304-343`, lidos).
- **Não duplicar a conversa (C37), hoje de dois jeitos.** O Builder: um id aleatório, a chave de
  tentativa e o `body_hash` na linha, sob `transactionLock` (`conversation/store.ts:72-131`,
  `tables.ts:20-21,40`, lidos). O Assistente: o id derivado da empresa, da pessoa e da chave
  (`conversationIdOf`, `assistant/open.ts:84-92`, lido), a linha `on conflict do nothing` com a
  conferência do Projeto (`assistant/chosen.ts:28-56`, lido), e o `createSession` do Mastra, que acha
  ou cria pelo id (`conversation/routes.ts:28-44`, lido). As execuções das automações dependem do id
  derivado: o passo repetido acha o mesmo fio sem rota nem tentativa (`automations/run.ts:112`,
  `automations/runs.ts:143`, lidos).
- **A remoção por marcas.** `releaseConversations` do Assistente (`assistant/release.ts:15-39`,
  lido): `listThreads` pela marca, e por fio `deleteSession`, a máquina, `deleteThread`.

Os números de linha acima são do `main` antes da U1; a U1 muda `releaseOf`, e a U1b os reabre.

**O jeito único de não duplicar.** O estudo recomenda a linha de tentativa do Hub; este cartão a
escreve com o id derivado, que é o caso dela onde a chave decide o id. Fica o id derivado, porque já é
o jeito deste cartão para o agente e a ferramenta (a tabela de falhas: o `insert` com o id derivado,
`on conflict (id) do nothing`, e reler), porque as execuções das automações precisam dele sem rota, e
porque o `createSession` do Mastra já acha o fio pelo id (nativo, C75). A linha do Hub guarda o que a
primeira tentativa mandou (o `body_hash` ou o Projeto), escrita antes do fio (D17). O Builder passa a
ele: a linha nova recebe o id derivado e continua com `attempt_key` e `body_hash` (nenhuma migração);
o `insert` sem alvo de conflito e a releitura pela chave acham também uma linha de antes da U1b, de id
aleatório, e o `keep` devolve o id da linha, que `openSession` usa no `createSession`, no
`model.switch` e na resposta (nunca o id derivado de uma linha que já existia). A `transactionLock`
sai: no READ COMMITTED, o segundo `insert` espera no índice único até o primeiro gravar, não faz
nada, e a releitura vê a linha gravada; a admissão, o `insert` e a releitura ficam no mesmo
`database.command`. Os ids do
Assistente não mudam: `attemptIdOf` copia `conversationIdOf` inteiro, o sha256 e a forma de uuid
versão 8 (os pedaços 8-4-`8`xxx-variante-12, com os bits da variante), e com o tipo `assistant` dá o
mesmo id byte a byte. As três chaves de hoje continuam: a da rota (`attemptKey`), a da execução
(`runId`, `run.ts:112` e `runs.ts:143`) e a do id da automação (`automation:<chave>`,
`automations.ts:53`, que o embrulha num `AutomationId`).

**As fábricas entram** (o estudo, §3.1): `agentDefaults(queue, turn)` dá a configuração comum do
agente e `controllerOf(...)` o `new AgentController` com os padrões, e cada conversa passa só o que é
dela (instruções, ferramentas, modo, máquina, `initialState`). Sem elas a U2 e a U4 refariam essas
linhas, e a economia que o estudo mediu não viria.

**Fica de fora.** O turno de cada conversa (`turn-of.ts:59-103`, `assistant/turn.ts:15-93`): o do
Builder trava o Projeto e lê o índice, o do Assistente não; a U2 escreve o do agente sobre
`turnOfOwner`. O `getThreadSetting` do Mastra no lugar do regex (o estudo, ~15 linhas): o codificador
do kit mantém os donos de hoje, e trocar a leitura não muda o que a 24.3 constrói. A pasta `testing/`,
as palavras dos conectores e as telas lendo do contrato: a janela entre etapas, cada uma com o seu
cartão curto (a pergunta 2 do estudo).

### O raio da mudança

Nada visível muda; nenhuma migração, nenhuma rota, nenhum contrato do `hub-api`.

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/mastra/` | Cria `mastra.ts` (o `createMastra` de `conversation/mastra.ts`, movido com o `BuilderLogger`), `hub-mastra.ts` (as partes registradas, `prepare`, `start`, `settle`, `close` e a remoção em cadeia, de `conversation/public.ts:83-102,131-211`), `public.ts` | `conversations-of.ts`, `main.ts` (pela mesma forma de hoje), a U2, a U4, a U6 |
| `apps/server/src/builder/controller-kit/` | Cria `kinds.ts` (`CONTROLLER_KINDS`, `resourceOf`, `ownerOfResource`), `once.ts` (`oncePerRun`), `factories.ts` (`agentDefaults`, `controllerOf`), `admission.ts` (`admitAsker`), `open.ts` (`attemptIdOf`, `openSession`), `release.ts` (`releaseThreads`, `threadsByMarks`), `public.ts` | `conversation/`, `assistant/`, `automations/`, a U2, a U4 |
| `apps/server/src/builder/conversation/` | Muda `public.ts` (só a conversa do Builder: a sua parte, as rotas), `guard.ts` (o `enum` de `CONTROLLER_KINDS`, `part.admit` no lugar do `if`), `store.ts` (o `keep` pelo id derivado; sai `transactionLock`), `routes.ts` (`created` por `openSession`), `builder.ts` (`resourceOf`, `oncePerRun`), `turn-of.ts` (o regex sai para o kit); apaga `mastra.ts` | `builder/mastra/` |
| `apps/server/src/builder/assistant/` | Muda `open.ts` (`openSession`; sai `conversationIdOf`), `context.ts`, `assistant.ts` (`resourceOf`, `oncePerRun`, `admitAsker`), `release.ts` (`threadsByMarks` e `releaseThreads`), `public.ts` (a parte dele) | `builder/mastra/` |
| `apps/server/src/builder/automations/` | Muda `run.ts:112` e `runs.ts:143` (a chave `runId`) e `automations.ts:53` (a chave `automation:<chave>`, embrulhada num `AutomationId`): `attemptIdOf('assistant', …)` no lugar de `conversationIdOf`, o mesmo id | — |
| `apps/server/src/conversations-of.ts` | Muda: monta as partes e as passa ao `createHubMastra`, na ordem da remoção | `main.ts` |

### Os contratos que a unidade cria

```ts
// apps/server/src/builder/controller-kit/kinds.ts
/** Cada controlador: a chave dele no Mastra e o prefixo do dono do fio. Os donos de hoje não mudam. */
export const CONTROLLER_KINDS = {
  builder: { id: BUILDER_CONTROLLER, prefix: '' },          // 'company:<c>:person:<p>'
  assistant: { id: ASSISTANT_CONTROLLER, prefix: 'assistant:' },
} as const satisfies Record<string, { id: string; prefix: string }>
// a U2 soma `agents: { id: AGENTS_CONTROLLER, prefix: 'agents:' }`; a U4, `construtor: { id: CONSTRUTOR_CONTROLLER, prefix: 'construtor:' }`
export type ControllerKind = keyof typeof CONTROLLER_KINDS
export type Owner = { companyId: CompanyId; personId: PersonId }
export type ResourceOwner = Owner & { kind: ControllerKind }
export function resourceOf(kind: ControllerKind, owner: Owner): string
/** O regex nasce dos prefixos; um prefixo que é começo de outro é recusado ao carregar o módulo. */
export function ownerOfResource(resourceId: unknown): ResourceOwner | undefined

// apps/server/src/builder/controller-kit/once.ts
/** Lê uma vez por `RequestContext` (um run, ou um run retomado com contexto novo). */
export function oncePerRun<T>(read: (context: RequestContext) => Promise<T>): (context: RequestContext) => Promise<T>

// apps/server/src/builder/controller-kit/admission.ts
/** A pessoa pode perguntar ao Assistente e aos agentes agora: o único `action: 'askAssistant'` de `builder/`. */
export function admitAsker(identity: IdentityPorts, tx: ReadTx, owner: Owner): Promise<void>

// apps/server/src/builder/controller-kit/open.ts
/** O id de uma conversa pela tentativa (C37): sha256 de `${kind}:${companyId}:${personId}:${key}`. */
export function attemptIdOf(kind: ControllerKind, owner: Owner, key: string): ConversationId
/** O que a primeira tentativa guardou no Hub, antes do fio (D17). */
export type Kept = { made: true } | { made: false; same: boolean; id: ConversationId }   // `id`: o da linha que já existia
export function openSession(
  deps: { controller: AgentController; memory: MastraMemory; queue: QueueDeps },
  input: {
    kind: ControllerKind; owner: Owner; id: ConversationId; tags?: Record<string, string>
    /** A linha do Hub; sem ela (o Construtor da U4), `same` compara as marcas de um fio anterior com `tags`. */
    keep?: () => Promise<Kept>
    model?: ModelId; effort?: Effort
  },
): Promise<{ made: boolean; session: AgentControllerSession; model: ModelId }>
// `same: false` → IDEMPOTENCY_CONFLICT; um esforço que o modelo não tem → EFFORT_UNSUPPORTED;
// `createSession` acha ou cria pelo id (o da linha, quando `made: false`); `model.switch` só num fio sem modelo.

// apps/server/src/builder/controller-kit/factories.ts
/** O comum dos agentes de conversa: o turno e a conta, `maxRetries: 0`, `maxProcessorRetries`, o tempo do modelo. */
export function agentDefaults(queue: QueueDeps, turn: InputProcessor): Pick<AgentConfig,
  'inputProcessors' | 'outputProcessors' | 'errorProcessors' | 'maxRetries' | 'maxProcessorRetries' | 'defaultOptions'>
/** O `new AgentController` com `storage`, um modo e `disableBuiltinTools`; a conversa passa o resto. */
export function controllerOf(input: {
  kind: ControllerKind; storage: PostgresStore; memory: MastraMemory; agent: Agent
  mode: { id: string; availableTools?: string[] }; workspace?: AgentControllerConfig['workspace']
  tools?: Record<string, Tool>; initialState: Record<string, unknown>
}): AgentController

// apps/server/src/builder/controller-kit/release.ts
/** Por fio: `deleteSession` (aborta o run), o passo do dono (a máquina do Assistente), `deleteThread` (D17). */
export function releaseThreads(
  deps: { controller: AgentController; memory: MastraMemory },
  ids: readonly string[],
  each?: (id: ConversationId) => Promise<void>,
): Promise<number>
/** Os fios de uma empresa, pessoa ou Projeto pelas marcas, todas as páginas. */
export function threadsByMarks(memory: MastraMemory, marks: Record<string, string>): Promise<string[]>

// apps/server/src/builder/mastra/hub-mastra.ts
export type Part = {
  kind: ControllerKind
  controller: AgentController
  memory: MastraMemory
  /** A porta das seis rotas, a cada pedido: o dono já conferido pelo fio; `NOT_FOUND` vira `CONVERSATION_NOT_FOUND`. */
  admit(input: { person: Person; companyId: CompanyId; conversationId: ConversationId }): Promise<void>
  release(scope: ReleaseScope): Promise<void>
  /** O fim do turno do Builder (`finish`, `onPhase`); sem ele, `watchRuns` só guarda a falha dita. */
  ends?: Pick<Watched, 'finish' | 'onPhase'>
  /** O que tem de existir antes de a agenda acordar; a U2 põe aqui `agents.hydrate()`. */
  beforeWorkers?(): Promise<void>
  close?(): Promise<void>
}
export function createHubMastra(deps: {
  storage: PostgresStore; log: FailureLog
  parts: readonly Part[]                                    // a ordem é a da remoção e a do `close`
  workflows: Readonly<Record<string, AnyWorkflow>>; schedulerTickMs: number | undefined
  /** O que sai antes das conversas: as automações (24.2) e, depois da U1, os agentes. */
  releaseFirst: readonly ((scope: ReleaseScope) => Promise<void>)[]
  /** O que para depois do `Mastra`: as chamadas do Google (C62). */
  closeLast: readonly (() => Promise<void>)[]
}): {
  mastra: Mastra
  part(kind: ControllerKind): Part | undefined              // o que a porta consulta
  updating(): boolean
  release(scope: ReleaseScope): Promise<void>
  prepare(): Promise<void>; start(): Promise<void>; settle(bound: AbortSignal): Promise<void>; close(): Promise<void>
}
```

`start`: todos os `beforeWorkers`, depois `startWorkers`. `close`, na ordem de hoje
(`conversation/public.ts:202-211`): drenar os runs, fechar os fluxos abertos e `runs.stop()` (o
`close` da parte do Builder, dona dos fluxos e das execuções), o `close` das outras partes (o
Assistente), `memory.settled()`, `mastra.shutdown()` e por fim `closeLast` (`google.stop()`).
`releaseFirst` e `Part.ends` não são forma nova: são a ordem e o fim do turno que o `releaseOf` e o
`watchRuns` de hoje já fazem, ditos no contrato. `ReleaseScope` muda de `conversation/store.ts` para
`builder/mastra/`. O `keep` do Builder:
`insert … on conflict do nothing` (sem alvo, então a chave única de `attempt_key` também segura uma
tentativa de antes da U1b) e reler pela empresa, pessoa e `attempt_key`; `same` quando o `body_hash`
e o Projeto são os da linha, e `id` o da linha. O do Assistente: o `keep` de `chosen.ts` de hoje, `same` quando o Projeto
é o da linha. As linhas de log de hoje (`CONVERSATIONS_RELEASED`, `ASSISTANT_CONVERSATIONS_RELEASED`,
`MASTRA_STORAGE_READY`) não mudam.

### As skills e a leitura

`mastra` (o `Mastra`, o `AgentController` e o `createSession` na versão instalada), `pstack:tdd`,
`pstack:principle-subtract-before-you-add`. [code](../guides/code.md) C37, C62, C63, C75;
[testing](../guides/testing.md) T5, T12.

### A ordem do trabalho

1. **A prova primeiro.** `controller-kit/open.test.ts`: "o id do Assistente", um vetor fixo
   (empresa, pessoa) com as três formas de chave de hoje (`attemptKey`, `runId` e
   `automation:<chave>`) e o id que `conversationIdOf` dá a cada uma, gravados antes de mover; "a
   tentativa antiga", uma linha do Builder de id aleatório e a mesma `attempt_key`, uma vez e duas ao
   mesmo tempo: a resposta traz o id da linha antiga e o Mastra tem um fio só; falha hoje (o kit não
   existe).
2. **`builder/mastra/`** (o K1 do estudo): mover `createMastra`, `prepare`/`start`/`settle`/`close`,
   `watchRuns` e a remoção em cadeia; `conversations-of.ts` monta as partes. Os testes de
   `builder/conversation`, `builder/assistant` e `builder/automations`, `boot.test.ts` e
   `main.test.ts` passam sem mudar. Um commit.
3. **O kit e o Assistente** (o K2): `kinds.ts`, `once.ts`, `admission.ts`, `factories.ts`,
   `release.ts`; o Assistente usa os cinco. Um commit.
4. **O Builder no kit e um só "não duplicar"** (o K3): `attemptIdOf` e `openSession`; o Builder e o
   Assistente abrem por eles e o Builder usa `factories.ts`; as automações chamam `attemptIdOf`;
   `guard.ts` consulta `part`. Um commit.

### Como se prova

Os testes que já existem, sem mudar o que afirmam: os de `builder/conversation/` (`guard.test.ts`,
`conversation-routes.test.ts`, `conversations.test.ts`, `conversations-removal.test.ts`,
`drain.test.ts`, `conversation-update.test.ts`), de `builder/assistant/` (`routes.test.ts`,
`release.test.ts`, `assistant.test.ts`), de `builder/automations/` (`run.test.ts`, `race.test.ts`,
`release.test.ts`, `scheduler.test.ts`), `boot.test.ts` e `main.test.ts`; mais o teste novo da ordem
1. E, lidos no diff: `git grep -n "action: 'askAssistant'" -- apps/server/src/builder` dá uma linha;
`transactionLock` e `conversationIdOf` não aparecem mais em `builder/`; `guard.ts` não tem `if` por
tipo; `conversation/public.ts` não importa `Mastra`. Comando: os testes tocados, `npm run typecheck`,
`npm run lint`, `npm run deps`, `npm run knip`.

### Parar se

- Um teste que já existe precisa mudar o que afirma para passar: para e relata; a U1b não muda
  comportamento.
- O id derivado do Assistente difere de `conversationIdOf` num vetor: para; as execuções das
  automações já gravadas perderiam o fio.
- O `keep` do Builder pede uma migração: para; a unidade não muda o catálogo.
- O diff passa de ~700 linhas alteradas (somadas e tiradas, `git diff --stat`, sem testes): relata
  antes da U2; a U2 e a U4 refazem a conta, e o que levar a 24.3 acima de ~4.000 vai para a 24.3.1
  por uma emenda deste cartão.

## U2 O agente vivo

**Base e modelo.** `main` depois da U1b. Opus: o registro, a ordem ao ligar e o controlador que
delega cruzam quatro módulos. O controlador nasce sobre o kit da U1b: a U2 não monta à mão o dono,
a abertura, a remoção nem a porta.

### As linhas da tabela

- **O editor do Mastra**, a forma a seguir: `M:packages/editor/src/namespaces/agent.ts:1169-1199`
  (`new Agent`, `addAgent` com `source: 'stored'`, só se não houver agente de código com o id) e
  `:438-446` (`removeAgent` ao trocar). Escrito por nós sobre o core aberto; o editor não é
  instalado.
- **O controlador do Assistente**, o modelo do controlador "agentes": `assistant.ts:245-371` (lido):
  `BUILTIN_TOOLS` desligadas, `yolo: true` (0053), a memória, `accountPick` e os processadores. O
  modo dos agentes **não** lista `availableTools`: a lista fechada é a da versão, que só o nosso
  código monta (`NM:agent-controller-DO6rGsQm.js:8390-8391`).
- **O kit (U1b).** `agents` em `CONTROLLER_KINDS` (o dono `agents:company:<c>:person:<p>`, o `enum`
  da porta); a parte dos agentes em `createHubMastra` (`admit` com o dono e `manageAgents`, `release`,
  o fim dos turnos, `beforeWorkers` com `agents.hydrate()`); `agentDefaults` e `controllerOf` para o
  agente que delega e o controlador; `oncePerRun` para a leitura por pedido; `openSession` com `attemptIdOf('agents', …)`
  e o `keep` da linha `builder.agent_conversation`; `threadsByMarks` e `releaseThreads` na remoção.
- **O escopo por pedido.** `sessionScopes` e `SESSION_MARK` (`builder/assistant/context.ts:13-19,60-85`,
  lido em parte): a conversa de agente tem o seu par, com `agentId` e `draft`.
- **A abertura.** `openSession` do kit com o modelo da versão: a linha do Hub, `createSession` com as
  marcas, `model.switch` só num fio novo.
- **A ordem ao ligar.** `main.ts:214-216` (lido) e `start`, que a U1b leva para
  `builder/mastra/hub-mastra.ts` (hoje `builder/conversation/public.ts:185-187`, lido): a carga entra
  em `start`, antes de `startWorkers`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/agents/` | Cria `agent.ts` (`agentOf`: o `Agent` de uma versão), `tools.ts` (as ferramentas preset de uma versão), `registry.ts`, `controller.ts` (o controlador "agentes", o seu agente que delega e a sua `Part`), `open.ts` (o `keep` da linha e `openSession`), `conversation-routes.ts`; muda `tables.ts` (`builder.agent_conversation`) | `conversations-of.ts`, a U3, a U6 |
| `apps/server/migrations/`, `apps/server/database-grants.sql` | Cria a tabela `builder.agent_conversation` (id, empresa, pessoa, agente com `on delete cascade`, `draft`); as permissões num commit próprio (D11) | `catalog.test.ts` |
| `apps/server/src/builder/controller-kit/kinds.ts` | Muda: `agents` em `CONTROLLER_KINDS`, que dá à porta o `enum` e o dono | `guard.ts`, `ownerOfResource` |
| `apps/server/src/builder/mastra/hub-mastra.ts` | Muda: `start` imprime `MASTRA_WORKERS_STARTED` depois de `startWorkers` (critério 10) | `main.ts` |
| `apps/server/src/builder/model-accounts/turn.ts` | Muda: `Turn` aceita um modelo fixo (`model?: { id: ModelId; effort: Effort }`), lido por `modelId` antes do da sessão (`chosenModel`, `:64-71`), porque um agente fora de um controlador não tem sessão | `accountPick` |
| `apps/server/src/conversations-of.ts` | Muda: monta os agentes e passa a parte deles ao `createHubMastra`, depois da do Assistente (a ordem da remoção) | `main.ts` |
| `apps/server/src/platform/memory.ts` | Muda: `loopDelayP99Ms` e `cpuPercent` na linha | — |
| `packages/hub-api/src/agents.ts` | Muda: `AGENTS_CONTROLLER = 'agents'`, as rotas da conversa, `AgentConversationSummary` | a U5 |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/agents.ts (U2)
export const AGENTS_CONTROLLER = 'agents'
// POST BASE/{agentId}/conversations { draft?: boolean }, attemptKey: true -> 201 { conversation: AgentConversationSummary }
//      falhas: AGENT_NOT_FOUND, AGENT_NOT_PUBLISHED, MODEL_NO_ACCOUNT, MODEL_UNKNOWN
// GET  BASE/{agentId}/conversations -> { conversations: AgentConversationSummary[] }   só as da pessoa
export const AgentConversationSummary = z.object({ id: ConversationId, agentId: AgentId, draft: z.boolean(), title: z.string(), updatedAt: z.iso.datetime() })
// apps/server/src/builder/agents/agent.ts
/** A chave e o id no Mastra: nunca colide com `builder`, `assistant`, `agents` nem `construtor`. */
export function agentKey(id: AgentId): `agent-${string}`
export function agentOf(deps: AgentDeps, frozen: FrozenVersion & OfProject & { agentId: AgentId }): Agent
// apps/server/src/builder/agents/registry.ts
export type Registry = {
  hydrate(): Promise<{ count: number }>              // antes de startWorkers; nunca lança por um agente só
  replace(agentId: AgentId, companyId: CompanyId): Promise<void>   // relê a ativa; removeAgent e addAgent; em fila por agente
  remove(agentId: AgentId): void
  resolve(run: AgentRun): Promise<Agent>             // o registrado (registra se faltar: `lazy`), ou o do rascunho, montado por turno
}
/** O que a conversa roda, no requestContext (C21). */
export type AgentRun =
  | { kind: 'PUBLISHED'; scope: OfProject & { personId: PersonId }; agentId: AgentId }
  | { kind: 'DRAFT'; scope: OfProject & { personId: PersonId }; agentId: AgentId }
```

**O `Agent` de uma versão roda sozinho** (`agentOf`): `model` é o da versão, ou o primeiro da pessoa
(`conversationStart`) com `model: null`; `inputProcessors` são um processador do turno que monta o
`Turn` do dono pelo `AgentRun` do `requestContext` (`turnOfOwner`, `conversation/turn-of.ts:59-62`,
lido), com o modelo fixo, e `accountPick(queue)`, que troca o modelo de cada passo pelo da conta
(`model-accounts/processors.ts:197-218`, lido) e aborta `NO_TURN` sem turno; `errorProcessors` são
`accountErrorProcessors(queue)`; `maxRetries: 0`, como o Assistente. Assim `agent_test` (U4), a 24.6 e
a 24.7 chamam o agente registrado sem controlador.

**No controlador "agentes"** os processadores são os do agente do controlador (o turno pela sessão,
como `assistant/turn.ts:58-70`, mais `accountPick`), com o modelo fixo do `Turn` vindo da versão a
cada turno; os do `Agent` registrado não rodam ali. O agente do controlador: `instructions`, `tools`
e `memory` são funções do `requestContext` que chamam `registry.resolve(run)` (uma vez por pedido, por `oncePerRun` do kit) e devolvem `getInstructions`,
`listTools` e `getMemory` do resolvido; `model` é o da versão (o mesmo do `Turn`). O registro procura
sempre por `mastra.listAgents()[agentKey(id)]` (`NM:mastra/index.d.ts:894`), nunca por
`getAgent` ou `getAgentById`, cujo erro lista as chaves de todas as empresas
(`NM:mastra-Da0Czfte.js:1566-1580`; o estudo de carga, B1; S40). As instruções de `agentOf` são a mensagem fixa do
Conexus (o mesmo `conexus.md` da 24.1), o bloco da conversa (empresa, pessoa, data, Projeto,
ligações) e as instruções da versão, com uma frase fixa: o agente só lê e diz isso quando pedirem
para gravar. As ferramentas de `agentOf`: as preset, pela versão presa de cada uma (`tool_<slug>`), `connectorTools` sobre as
ligações da versão que o Projeto ainda oferece, com `noteSave: false` e sem `savedAt` (sem máquina),
e `toolsOf(model)` só com `web`. A memória: a `conversationMemory` da 24.1, com a observacional, ou
uma `new Memory({ storage })` sem ela, as duas criadas uma vez.

### As skills e a leitura

`mastra` (o registro, o controlador e a agenda na versão instalada), `pstack:tdd`, `node`
(`perf_hooks`). [testing](../guides/testing.md) T5, T12, T26; [code](../guides/code.md) C63.

### A ordem do trabalho

1. **A prova primeiro.** `registry.test.ts`, "ao ligar": publica um agente, cria uma linha da agenda
   com o `agentId` dele, reinicia o Hub de teste e conta a linha depois de quatro tiques; falha hoje.
2. `agent.ts`, `tools.ts`, `registry.ts`; o `onChange` da U1 chama `replace` e `remove`.
3. `controller.ts` e a parte no kit (`agents` em `CONTROLLER_KINDS`), `open.ts` sobre `openSession`,
   as rotas; a migração da `agent_conversation`; o teste das três ordens de `release.test.ts`
   (critério 7). Regras: C21, C26, S10, S39.
4. A carga pela `beforeWorkers` da parte, que o `start` da U1b chama; `HUB_MEMORY`.

### Como se prova

O Hub de teste com o tique curto e o modelo dublê da 12; o dublê do Sankhya da 24.1. O teste que
falha hoje: "ao ligar". Comando: os testes tocados, `npm run typecheck`, `npm run lint`,
`npm run check-migrations`.

### Parar se

- O controlador não passa ao agente que delega a memória escolhida pela versão (o fio lido por uma
  `Memory` e gravado por outra): para e relata com o teste "a memória"; a saída é uma memória só por
  controlador e a escolha por chamada (`AgentMemoryOption.options`, `NM:agent/types.d.ts:969-974`).
- O `Turn` com modelo fixo muda o pedido do modelo de uma conversa do Builder ou do Assistente (o
  modelo da sessão deixa de valer ali): para; o modelo fixo só existe no turno de um agente.
- A carga de 1.000 agentes passa de 1 s no Hub de teste (o estudo mediu 230 ms): relata o número.
- Uma peça do kit não serve ao controlador que delega (o dono, a abertura, a remoção): relata o que
  falta; nunca uma cópia ao lado do kit.

## U3 Os dados do app

**Base e modelo.** `main` depois da U2. Sonnet: um login e uma ferramenta, sobre o login do app da
9, com a regra de segurança escrita aqui.

### As linhas da tabela

- `appLogin` e `appLoginPassword` (`packages/hub-api/src/app-login.ts:8-36`, lido; decisão 0043).
- `schemaStatements` e `ensureApp` (`apps/server/src/platform/company-postgres.ts:148-187`, lido).
- `neonTransport` e `asLogin` (`company-postgres.ts:65-118`, relay); o endereço do login sem a API do
  Neon, como o edge (`apps/edge/src/db.ts:35-60`), com o `host` de `readyDatabaseOf` e
  `COMPANY_DATABASE` (`hub/apps/handoff.ts:271-282`). `openAppDatabase`
  (`hub/apps/app-database.ts:24-55`) chama a API do Neon, então só cria o login que falta.
- O corte: `CUT_ROWS` e `CUT_BYTES` (`hub/connectors/cut.ts:4-6`), exportados por
  `hub/connectors/public.ts`, nunca copiados (C26).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/app-login.ts` | Muda: `readLogin: app_<projeto>_read` | `company-postgres.ts` |
| `apps/server/src/platform/company-postgres.ts` | Muda: `ensureApp` cria os três logins; o de leitura só com `USAGE` e `SELECT` (sem o livro das migrações), `default_transaction_read_only = on` e os tempos do app; a porta ganha `readApp` (cada consulta em `sql.transaction([…], { readOnly: true })`) e `ensureReadLogin`, recebendo o endereço, nunca a empresa (C7) | `hub/apps/` |
| `apps/server/src/hub/apps/` | Muda `app-database.ts` e `public.ts`: `readAppData` | `builder/agents/app-data.ts` |
| `apps/server/src/hub/connectors/public.ts` | Muda: exporta `CUT_ROWS` e `CUT_BYTES` | `builder/agents/app-data.ts` |
| `apps/server/src/builder/agents/` | Cria `app-data.ts`; muda `agent.ts` (a ferramenta com `appData` e app no Projeto) | — |
| `packages/hub-api/src/agents.ts` | Muda: `AGENT_TOOL.appDataRead = 'app_data_read'` | a web (a linha "Lendo dados do app") |

### Os contratos que a unidade cria

```ts
// apps/server/src/platform/company-postgres.ts (porta CompanyPostgres)
readApp(read: DatabaseUrl, sql: string, signal: AbortSignal): Promise<AppRead>
ensureReadLogin(owner: DatabaseUrl, projectId: ProjectId): Promise<SqlAnswer>
// apps/server/src/hub/apps/public.ts
readAppData(input: { scope: SessionScope; projectId: ProjectId; sql: string; signal: AbortSignal }): Promise<AppRead>
export type AppRead =
  | { kind: 'ROWS'; columns: readonly string[]; rows: readonly unknown[][] }
  | { kind: 'REFUSED'; code: 'APP_DATA_REFUSED' }     // 25006, 42501, 42601
  | { kind: 'FAILED'; code: 'APP_DATA_UNAVAILABLE' | 'APP_DATA_TIMEOUT' | 'APP_DATA_NO_APP' | 'APP_DATA_TOO_LARGE' }   // TOO_LARGE: acima de REPLY_CAP_BYTES, 1 MB (company-postgres.ts:49-58), C59
// apps/server/src/builder/agents/app-data.ts
export const AppDataInput = z.object({ sql: z.string().trim().min(1).max(4000) })
```

A barreira é a permissão: o login só tem `SELECT`; a transação de leitura e o padrão do login são
profundidade. O SQL e as linhas nunca vão ao registro do processo (C50).

### As skills e a leitura

`node`, `pstack:tdd`; o PostgreSQL 17 para `ALTER ROLE … SET`, `ALTER DEFAULT PRIVILEGES` e `GRANT`.
[security](../guides/security.md).

### A ordem do trabalho

1. **A prova primeiro.** `app-data.test.ts`, "não grava": um `DELETE` pela ferramenta e a tabela
   inteira depois; falha hoje.
2. `readLogin`; os três logins em `ensureApp`; as permissões do de leitura.
3. `ensureReadLogin`, `readApp`, `readAppData`.
4. `app-data.ts` em `agentOf`.

### Como se prova

O Postgres de teste no lugar do Neon pela porta `CompanyPostgres`; cada recusa do critério 19 é uma
consulta e a releitura da tabela. Comando: os testes tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- Um comando de escrita passa pelo login de leitura em qualquer forma: para.
- `SELECT 1; SELECT 2` por `readApp` volta um código diferente de 42601: relata o código e ajusta a
  frase do critério, nunca um filtro.
- O transporte não aceita `readOnly` na transação: relata; a permissão continua a barreira.
- O login de leitura pede uma permissão que o dono do banco não pode dar sem a palavra D11: para.

## U4 O Construtor

**Base e modelo.** `main` depois da U2. Sonnet: um controlador sobre o kit da U1b e ferramentas
sobre o serviço da U1.

### As linhas da tabela

- **O controlador.** O do Assistente (`assistant.ts:333-344`, lido): um modo, a lista fechada de
  ferramentas, `BUILTIN_TOOLS` desligadas, `yolo: true` (`C1`: o rascunho sem perguntar; nenhuma
  ferramenta publica). Sem máquina nesta etapa.
- **O manual.** O do agente de workflows do Mastra (`M:packages/core/src/workflows/builder/agent.ts:13-24`,
  `authoring-playbook.ts:37-40`, relay): ler o que existe, propor, montar por operações pequenas,
  conferir o que voltou. Escrito por nós, em português, em `prompt/construtor.md`.
- **Conferir o que voltou.** `create-workflow` do Mastra Code
  (`M:mastracode/sdk/src/tools/workflows/create-workflow.ts:61-120`, relay).
- **O kit (U1b).** `construtor` em `CONTROLLER_KINDS` (o dono `construtor:company:<c>:person:<p>`, o
  `enum` da porta); a parte do Construtor em `createHubMastra` (`admit` com o dono e `manageAgents`,
  `release` por `threadsByMarks` e `releaseThreads`, o fim dos turnos); `agentDefaults` e `controllerOf`; `openSession` com
  `attemptIdOf('construtor', …)` e sem `keep`: uma repetição acha o mesmo fio, e uma com outro Projeto
  dá `IDEMPOTENCY_CONFLICT` pelas marcas.
- **As conversas.** As do Assistente, listadas pela marca (`builder/assistant/routes.ts:173-200`,
  lido em parte), com a marca do Projeto; nenhuma tabela do Hub (o Construtor não escolhe ligações:
  vê as que o Projeto recebeu).
- **A #540.** A linha do texto do Builder que diz que os conectores "vêm depois"
  (`builder/conversation/prompt/builder.md`), corrigida.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/construtor/` | Cria `construtor.ts` (o agente, o controlador e a sua `Part`), `tools.ts`, `test-draft.ts`, `open.ts` (sobre `openSession`), `routes.ts`, `prompt/construtor.md` | `conversations-of.ts` |
| `apps/server/src/builder/controller-kit/kinds.ts` | Muda: `construtor` em `CONTROLLER_KINDS` | `guard.ts`, `ownerOfResource` |
| `apps/server/src/builder/conversation/prompt/builder.md` | Muda: a #540 | — |
| `apps/server/src/conversations-of.ts` | Muda: monta o Construtor com o serviço dos agentes, o das ferramentas e a lista das automações do Projeto (para `tool_search`), e passa a parte dele ao `createHubMastra` | — |
| `packages/hub-api/src/construtor.ts` | Cria: `CONSTRUTOR_CONTROLLER = 'construtor'`, `CONSTRUTOR_TOOL`, as rotas, `ConstrutorResult` | a U5 |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/construtor.ts
export const CONSTRUTOR_CONTROLLER = 'construtor'
export const CONSTRUTOR_TOOL = {
  projectRead: 'project_read', toolSearch: 'tool_search', toolSave: 'tool_save',
  agentRead: 'agent_read', agentDraft: 'agent_draft', agentSet: 'agent_set', agentTest: 'agent_test',
} as const
// POST /api/companies/{c}/projects/{p}/construtor/conversations, attemptKey: true -> 201 { conversation }   acesso manageAgents
// GET  /api/companies/{c}/projects/{p}/construtor/conversations -> { conversations }
/** O que agent_read, agent_draft e agent_set devolvem: o rascunho gravado, ou a recusa (C21). */
export const ConstrutorResult = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('SAVED'), agent: AgentDetail }),
  z.object({ kind: z.literal('REFUSED'), code: FailureCode, field: z.string().optional(),
    current: AgentDetail.optional() }),                         // no AGENT_DRAFT_STALE: o rascunho de agora, para gravar sobre ele
])
// agent_read:        { agentId }                           -> ConstrutorResult  (SAVED com o rascunho de agora)
// agent_draft:       { name, description }                 -> ConstrutorResult  (cria pelo serviço; a chave de tentativa sai do toolCallId)
// agent_set:         DraftPatch & { agentId }              -> ConstrutorResult  (`tools` escolhe as versões)
// tool_search:       { query?: string(..200) }             -> { tools: ToolSummary[], ready: ReadyTool[], automations: { id, name, prompt }[] }
//                    (a biblioteca que o Projeto pode usar, as prontas e os workflows que existem hoje, as automações da 24.2)
// tool_save:         (ToolInput & { toolId?: never }) | (ToolVersionConfig & { toolId })   -> { kind: 'SAVED', tool: ToolDetail } | { kind: 'REFUSED', code, field? }
//                    (sem toolId cria, com toolId grava a versão n+1; nos dois, a chave de tentativa sai do toolCallId,
//                    então um passo repetido acha a mesma ferramenta ou a mesma versão)
// escolher uma pronta: agent_set com `ready: { connectionId, operation }[]` ao lado de `tools`; o serviço a grava
//                    na biblioteca pela regra das prontas e a soma às escolhas
// agent_test:        { agentId, question: string(1..2000) } -> { kind: 'ANSWERED', text, tools: string[] } | { kind: 'REFUSED', code }
// project_read:      {}                                    -> { project, offered, app: { tables } | null, agents: AgentSummary[] }
```

Toda ferramenta recebe a pessoa e o Projeto do escopo da conversa, nunca do modelo (C23), e um
`agentId` de outro Projeto volta `AGENT_NOT_FOUND`.

### As skills e a leitura

`mastra` (o controlador, `Agent.generate`), `pstack:tdd`. [code](../guides/code.md) C75.

### A ordem do trabalho

1. **A prova primeiro.** `construtor.test.ts`, "o rascunho pelo Construtor": o modelo dublê chama
   `agent_draft` e `agent_set`; a rota da U1 lê o rascunho; falha hoje.
2. `construtor.ts`, o controlador e a parte no kit (`construtor` em `CONTROLLER_KINDS`).
3. `tools.ts` e `test-draft.ts` sobre `agents.service` e `agentOf` com `draftOf`.
4. `prompt/construtor.md` (ideias antes de construir; `tool_search` antes de fazer uma ferramenta, e
   uma pronta ou da biblioteca antes de uma nova;
   recortes estreitos; uma ferramenta com versão nova: dizer à pessoa, trocar no rascunho e testar;
   nunca publicar, dizer à pessoa para tocar **Publicar**); a #540.

### Como se prova

O modelo dublê da 12 com as chamadas de ferramenta roteirizadas; o dublê do Sankhya da 24.1.
Comando: os testes tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- `agent_test` não consegue chamar o `Agent` do rascunho sem um controlador (o critério 9a da U2
  falhou): para; nunca abrir uma conversa escondida para testar.
- O Construtor precisa de uma ferramenta que grava num sistema da empresa: para; é a 24.5.

## U5 As telas

**Base e modelo.** `main` depois da U4. Sonnet: telas sobre contratos prontos.

### As linhas da tabela

- A barra do Projeto (`apps/web/src/hub/projects/project-rail.tsx:111-175`, lido): **Agentes** entra
  depois de **Conversas**, escondida do membro como **Automações** (`role !== 'member'`).
- As conversas da 24.1 (`apps/web/src/builder/assistant/`, `apps/web/src/builder/conversation/`) e o
  registro das ferramentas (`tool-registry.ts`, `tool-spec.ts`, relay): o cartão do rascunho é o
  desenho do `ConstrutorResult` de `agent_draft` e `agent_set`.
- A página de agente do Studio, só a estrutura (a captura; `agent-overview-panel.tsx:134-240`, relay).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/agents/` | Cria `area.tsx`, `agent-page.tsx`, `config-panel.tsx` (as seções; ferramentas: escolher e criar), `tool-form.tsx` (a U7 o usa para a versão nova), `versions.tsx`, `draft-card.tsx`, `queries.ts`, `text.ts` | as rotas |
| `apps/web/src/builder/conversation/` | Muda o registro das ferramentas: o cartão do rascunho e as linhas de `tool_<slug>` e `app_data_read` | — |
| `apps/web/src/hub/projects/project-rail.tsx` | Muda: a entrada | — |
| `apps/web/src/routes/_app/companies/$companyId/projects/` | Cria `$projectId_.agents.index.tsx`, `$projectId_.agents.construtor.$conversationId.tsx`, `$projectId_.agents.$agentId.tsx`, `$projectId_.agents.$agentId.$conversationId.tsx` | — |
| `docs/reference/screens.md` | Muda: as telas novas | — |

### Os contratos que a unidade cria

Nenhum contrato novo do servidor. Na web: `agentQuery`, `agentsQuery`, `versionsQuery`, `toolsQuery` em
`queries.ts`; as gravações do rascunho de um agente andam numa fila (uma por vez, cada uma com o
`revision` que a anterior devolveu), e só um `AGENT_DRAFT_STALE` vindo de fora invalida `agentQuery`.

### As skills e a leitura

`shadcn`, `impeccable`, `pstack:tdd`; as linhas de `docs/reference/stack.md` para `apps/web/src/`.
[web](../guides/web.md) W7, W30, W31, W34; [design](../guides/design.md) e
[Impeccable](../reference/impeccable.md).

### A ordem do trabalho

1. **A prova primeiro.** `agent-page.test.tsx`: muda o modelo no painel, recebe `AGENT_DRAFT_STALE`
   do servidor dublê e mostra a frase; falha hoje.
2. A área e a entrada; o cartão do rascunho.
3. A página, o painel (escolher e criar ferramentas), as versões, publicar e voltar, apagar.
4. `docs/reference/screens.md`. Regras: W7, W30, W34, C21.

### Como se prova

Os testes de `apps/web` com o servidor dublê de cada tela; o QA da etapa para larguras e temas.
Comando: os testes tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- A conversa com o agente não cabe nas peças da conversa da 24.1 sem uma segunda conversa: para; a
  página reusa a conversa, nunca a copia.
- O painel precisa de um campo que a U1 não devolve: relata; nunca ler outra rota para montá-lo.

## U6 A automação roda um agente

**Base e modelo.** `main` depois da U2. A "R1" já está no `main`
(https://github.com/developmentconexus-ops/conexus/pull/556, o sinal em `run.ts:132-138`). Sonnet: um campo novo num contrato que já tem a sua versão.

### As linhas da tabela

- `AutomationInput` versão 1 (`builder/automations/run.ts:37-50`, lido) e `AUTOMATION_WORKFLOW`
  (`:21-27`: renomear apaga as linhas).
- `conversed` (`run.ts:96-156`, lido): a conversa aberta por `deps.assistant.open`; o alvo agente a
  abre pela abertura da U2, com o mesmo id derivado do `runId` (`attemptIdOf`, U1b).
- **O pedido marcado** (a resposta "R1" do fundador, 2026-11-02, do estudo da execução das
  automações; https://github.com/developmentconexus-ops/conexus/pull/556): a execução manda o pedido
  como sinal `{ type: 'user', tagName: 'user', contents, attributes: { source: 'automation',
  automationName } }` com `requireDelivery: true`, e um sinal aceito que não acorda nem entra num
  turno termina `FAILED` com `INTERRUPTED` (`run.ts:128-145`, lido); a do agente manda o mesmo sinal
  pela sessão do agente, com a mesma marca e a mesma conferência.
- `propose_automation` (`builder/assistant/propose-automation.ts:12-29`, lido): o controlador
  "agentes" também a oferece, com o `agentId` posto pela ferramenta.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/automations/` | Muda `run.ts` (a união das versões, `targetOf`, `check` e `conversed` com o alvo), `automations.ts` (a criação com `agentId`), `release.ts` (as automações de um agente, pelo `onChange` `DELETED`) | — |
| `apps/server/src/builder/agents/` | Muda `agent.ts`: `propose_automation` no conjunto, com o alvo | — |
| `packages/hub-api/src/automations.ts` | Muda: `CreateAutomation.agentId?`, `AutomationSummary.agent`, `RunOutcome` `SKIPPED` com `AGENT_GONE` | a web |
| `apps/web/src/builder/automations/` | Muda: **Roda: <nome>** no cartão e na linha; "Não rodou: o agente foi apagado." | — |

### Os contratos que a unidade cria

```ts
// apps/server/src/builder/automations/run.ts
export const AutomationTarget = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('ASSISTANT') }),
  z.object({ kind: z.literal('AGENT'), agentId: AgentId }),
])
const V2 = AutomationInputV1.extend({ version: z.literal(2), target: AutomationTarget })
export const AutomationInput = z.discriminatedUnion('version', [AutomationInputV1, V2])
export function targetOf(input: AutomationInput): AutomationTarget   // V1: ASSISTANT; um dono só (C26)
// packages/hub-api/src/automations.ts
// RunOutcome SKIPPED: reason: z.enum(['OWNER_CANNOT_ASK', 'AGENT_GONE'])
// AutomationSummary: agent: z.object({ agentId: AgentId, name: z.string() }).nullable()
```

Uma automação com alvo agente é do Projeto do agente e grava `connections: []` (as ligações vêm da
versão ativa); o nome no resumo é lido da linha do agente. A execução roda a versão ativa no
instante do disparo.

### As skills e a leitura

`mastra` (a agenda e o workflow da 24.2), `pstack:tdd`. [testing](../guides/testing.md) T5, T12, T26.

### A ordem do trabalho

1. **A prova primeiro.** `run.test.ts`, "a linha antiga" e "o agente"; o segundo falha hoje.
2. A união e `targetOf`; `check` e `conversed`.
3. A criação, a recusa, o resumo, `propose_automation`; `release.ts`; as telas.

### Como se prova

A agenda de verdade num Postgres de teste com o tique curto, o modelo dublê. Comando: os testes
tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- Uma linha da agenda da 24.2 deixa de ser lida (a versão 1): para; mudar `AUTOMATION_WORKFLOW`
  apagaria todas as linhas.
- O nome do agente precisa ser guardado na automação: relata; a linha do agente é a dona.
- A execução do agente precisa de outra marca que não a `source="automation"` da 24.2: para; a marca
  é uma só para as duas.

## U7 A aba Ferramentas

**Base e modelo.** `main` depois da U5, na 24.3.1. Sonnet: uma aba sobre as rotas da U1 e o
formulário da U5.

### As linhas da tabela

- A ferramenta preset com versões (a linha da tabela de referência): a web só lê e grava pelas rotas
  `TOOLS` da U1; nenhum contrato novo.
- A área da U5 (`apps/web/src/builder/agents/area.tsx`): a aba entra ao lado de **Construtor** e
  **Agentes**, a 390 px também.
- O formulário da U5 (`apps/web/src/builder/agents/tool-form.tsx`): na versão nova, a ligação e a
  operação aparecem só para ler (são da ferramenta), e a descrição, os valores fixos e os campos
  abertos vêm da versão mais nova.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/tools/` | Cria `tools-tab.tsx` (a lista: o `slug`, a descrição, o que lê, o efeito, a versão, os agentes que usam), `tool-page.tsx` (as versões e **Nova versão**), `queries.ts` (`toolQuery`; `toolsQuery` vem da U5) | as rotas |
| `apps/web/src/builder/agents/` | Muda `config-panel.tsx`: uma ferramenta escolhida com `latest.number > version.number` mostra "Versão n disponível" e **Usar a versão n**, que grava pelo `PATCH …/draft` com `tools` trocando o id da versão, na fila de gravação da U5; muda `area.tsx`: a aba | — |
| `apps/web/src/routes/_app/companies/$companyId/projects/` | Cria `$projectId_.agents.tools.tsx`, `$projectId_.agents.tools.$toolId.tsx` | — |
| `docs/reference/screens.md` | Muda: a aba e a página da ferramenta | — |

### Os contratos que a unidade cria

Nenhum do servidor. **Nova versão** manda `ToolVersionConfig` a `POST TOOLS/{toolId}/versions` com uma
chave de tentativa por envio do formulário. **Apagar** manda `DELETE TOOLS/{toolId}`; no 409
`TOOL_IN_USE`, o corpo `{ agents: { id, name }[] }` vira "Usada por <nomes>." com um link para cada
agente, e nada sai da lista. `TOOL_NOT_FOUND` recarrega a lista.

### As skills e a leitura

`shadcn`, `impeccable`, `pstack:tdd`; as linhas de `docs/reference/stack.md` para `apps/web/src/`.
[web](../guides/web.md) W7, W30, W34; [design](../guides/design.md).

### A ordem do trabalho

1. **A prova primeiro.** `tools-tab.test.tsx`: **Apagar** uma ferramenta usada recebe `TOOL_IN_USE`
   do servidor dublê e mostra os nomes; falha hoje.
2. A aba e a lista; a página da ferramenta e **Nova versão**.
3. "Versão n disponível" e **Usar a versão n** no painel (`agent-page.test.tsx`, "versão nova").
4. `docs/reference/screens.md`. Regras: W7, W30, W34, C21.

### Como se prova

O critério 32 pelos testes de `apps/web` com o servidor dublê; larguras e temas pelo QA da etapa.
Comando: os testes tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- A lista precisa de um campo que `ToolSummary` não traz: relata; nunca ler outra rota para montá-la.
- Mudar a ligação ou a operação de uma ferramenta parece necessário: para; é uma ferramenta nova.

## U8 As Ideias do Construtor

**Base e modelo.** `main` depois da U7, na 24.3.1. Sonnet: uma leitura sobre as tabelas da U1, uma
rota e um bloco na área.

### As linhas da tabela

- A palavra do fundador, a 4A (2026-11-02): uma ideia só aparece quando vem de uma falta de verdade
  que o Construtor vê; sem falta, o bloco não aparece. As faltas desta etapa são as duas que os dados
  já mostram. A falta "grava sem aprovação" é da 24.5.
- As versões presas: `builder.agent_version_tool` da versão ativa contra `builder.tool.current_version`
  (as tabelas da U1); a mesma comparação que `agent_read` faz no rascunho (U4).
- As ligações que o Projeto oferece: `connectors.connections(scope)`, a mesma conferência do serviço
  da U1 e da marca da página da U5.
- A conversa do Construtor: `POST …/construtor/conversations` (U4); a caixa da conversa da 24.1 recebe
  o texto inicial sem mandar.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/agents/` | Cria `ideas.ts` (`ideasOf(scope)`: uma consulta, nenhuma gravação); muda `routes.ts`: `GET …/agent-ideas`, acesso `manageAgents` | a web |
| `packages/hub-api/src/agents.ts` | Muda: `AgentIdea` e a rota; o OpenAPI gerado | a web |
| `apps/web/src/builder/agents/` | Cria `ideas.tsx` (o bloco e **Pedir ao Construtor**); muda `area.tsx` (o bloco acima da lista) e `queries.ts` (`ideasQuery`) | — |
| `docs/reference/screens.md` | Muda: o bloco na área | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/agents.ts
// GET /api/companies/{companyId}/projects/{projectId}/agent-ideas -> { ideas: AgentIdea[] }   acesso manageAgents
const AgentRef = z.object({ id: AgentId, name: z.string() })
export const AgentIdea = z.discriminatedUnion('kind', [                                   // C21
  z.object({ kind: z.literal('TOOL_VERSION_BEHIND'), agent: AgentRef,
    tool: z.object({ id: ToolId, slug: ToolSlug }), pinned: z.int().positive(), latest: z.int().positive() }),
  z.object({ kind: z.literal('CONNECTION_LOST'), agent: AgentRef,
    connectionId: ConnectionId, name: z.string().nullable() }),                            // null: a ligação foi apagada
])
// apps/server/src/builder/agents/ideas.ts
export function ideasOf(scope: OfProject): Promise<readonly AgentIdea[]>   // só versões ativas; pelo nome do agente
```

O texto que **Pedir ao Construtor** escreve na caixa sai da web, por tipo: "Troque <slug> do <agente>
para a versão <n> e teste." e "O <agente> usa a ligação <nome>, que o Projeto não oferece mais. O que
fazemos?". O Construtor faz a troca no rascunho e testa (`C1`); publicar continua o toque da pessoa.

### As skills e a leitura

`shadcn`, `impeccable`, `pstack:tdd`. [web](../guides/web.md) W7, W30, W34; [testing](../guides/testing.md) T5.

### A ordem do trabalho

1. **A prova primeiro.** `ideas.test.ts`: publica um agente com a versão 1 de uma ferramenta, grava a
   versão 2 da ferramenta e lê `TOOL_VERSION_BEHIND`; tira a ligação do Projeto e lê `CONNECTION_LOST`;
   falha hoje.
2. `ideasOf` e a rota; o contrato e o OpenAPI.
3. O bloco, **Pedir ao Construtor** e `area.test.tsx`, "as ideias".
4. `docs/reference/screens.md`. Regras: W7, W30, W34, C21.

### Como se prova

O critério 33 pelo servidor de teste e o Postgres de teste; o 34 pelos testes de `apps/web` com o
servidor dublê; larguras e temas pelo QA da etapa. Comando: os testes tocados, `npm run typecheck`,
`npm run lint`.

### Parar se

- Uma ideia parece precisar de uma chamada de modelo para existir: para; a 4A pede uma falta que os
  dados mostram, nunca uma sugestão gerada.
- A caixa da conversa da 24.1 não aceita um texto inicial sem mandar: relata o que ela oferece;
  nunca uma segunda caixa.
- Aparece uma terceira falta que os dados mostram: relata; ela entra com a palavra do fundador, não
  pela unidade.

## U9 A página Agentes do Início

**Base e modelo.** `main` depois da U6, na 24.3.1. Sonnet: uma coluna, um filtro numa rota que já
existe e uma página que repete a das Automações.

### As linhas da tabela

- A palavra do fundador, a `V1` (2026-11-02): no Início, uma página **Agentes** com todos os agentes da
  empresa, o filtro por Projeto e, de cada um, a versão, o estado e a última execução; só para ver;
  um toque abre a página do agente no Projeto dele; **Novo agente** pergunta o Projeto; nenhum
  agente fora de um Projeto; o membro não vê (3.A).
- A forma a repetir, a das Automações da 24.2: a rota `listAutomations` com `projectId` opcional
  (`packages/hub-api/src/automations.ts:137,149-155`, lido), o componente único
  `Automations({ companyId, projectId? })` (`apps/web/src/builder/automations/automations.tsx:245-259`,
  lido), o lugar de cada linha por `PlaceName` (`apps/web/src/builder/automations/place.tsx:10`,
  lido), as duas rotas finas que só passam ou não o `projectId`
  (`apps/web/src/routes/_app/companies/$companyId/automations.index.tsx` e
  `.../projects/$projectId_.automations.index.tsx`, lidas) e a entrada do Início com
  `role !== 'member'` (`apps/web/src/routes/_app/companies/$companyId/route.tsx:75-82`, lido). Uma
  diferença: a lista das Automações sem `projectId` mostra as do Início; a dos agentes sem `projectId`
  mostra as de todos os Projetos, porque nenhum agente mora no Início.
- A última execução: o processador do turno do controlador "agentes" (U2, `builder/agents/agent.ts`)
  grava `last_run_at = now()` na linha do agente no começo de um turno com a versão publicada; a
  conversa aberta por uma automação (U6) passa pelo mesmo turno. A conversa de teste não grava.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/migrations/` | Cria `<data>_e2431_agent_last_run` (a coluna `last_run_at timestamptz null`; as permissões não mudam: `hub_company` já tem `UPDATE` em `builder.agent`) | `npm run check-migrations` |
| `apps/server/src/builder/agents/` | Muda `agents.ts` (a lista com `projectId` opcional, só Projetos vivos; `lastRunAt` no resumo) e `agent.ts` (a gravação no começo do turno publicado) | a web |
| `packages/hub-api/src/agents.ts` | Muda: `projectId` opcional na lista; `AgentSummary.lastRunAt: z.iso.datetime().nullable()`; o OpenAPI gerado | a web |
| `apps/web/src/builder/agents/` | Cria `agent-list.tsx` (a lista que sai de `area.tsx`, com o Projeto em cada linha quando não há filtro) e `new-agent.tsx` (a escolha do Projeto); muda `area.tsx` (usa `agent-list.tsx`) e `queries.ts` (`agentsQuery(companyId, projectId?)`) | as duas rotas |
| `apps/web/src/routes/_app/companies/$companyId/` | Cria `agents.index.tsx` (passa nenhum `projectId`; o filtro é um parâmetro de busca do endereço); muda `route.tsx` (a entrada **Agentes** ao lado de **Automações**, com `role !== 'member'`) | — |
| `docs/reference/screens.md` | Muda: a página do Início | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/agents.ts
// GET /api/companies/{companyId}/agents?projectId=   projectId passa a opcional: sem ele, os agentes de todos os Projetos vivos
export const AgentSummary = /* o da U1 */ .extend({ lastRunAt: z.iso.datetime().nullable() })   // null: nunca rodou publicado
// apps/web/src/builder/agents/queries.ts
export function agentsQuery(companyId: CompanyId, projectId: ProjectId | undefined)   // como automationsQuery
// apps/web/src/builder/agents/agent-list.tsx
export function AgentList(props: { companyId: CompanyId; projectId?: ProjectId })     // um componente, as duas páginas
```

A página do Início não muda nada: a linha leva à página do agente no Projeto dele, e **Novo agente**
leva à área **Agentes** do Projeto escolhido, onde o Construtor começa a conversa.

### As skills e a leitura

`shadcn`, `impeccable`, `pstack:tdd`; as linhas de `docs/reference/stack.md` para `apps/web/src/`.
[web](../guides/web.md) W7, W29, W30, W34; [data](../guides/data.md) D11; [testing](../guides/testing.md) T5.

### A ordem do trabalho

1. **A prova primeiro.** `routes.test.ts`, "a lista da empresa": dois Projetos com um agente cada; a
   lista sem `projectId` traz os dois, com `projectId`, um; falha hoje.
2. A migração; `lastRunAt` e a gravação no turno (`conversation.test.ts`, "a última execução").
3. `agent-list.tsx` tirado de `area.tsx`, sem mudar a área; a rota do Início, o filtro, **Novo
   agente** e a entrada.
4. `docs/reference/screens.md`. Regras: W7, W29, W34, C21, C26.

### Como se prova

O critério 35 pelo servidor de teste e o Postgres de teste; o 36 pelos testes de `apps/web` com o
servidor dublê; larguras e temas pelo QA da etapa. Comando: os testes tocados, `npm run typecheck`,
`npm run lint`, `npm run check-migrations`.

### Parar se

- A página do Início parece precisar de uma segunda leitura ou de um segundo componente de lista:
  para; a `V1` pede a forma das Automações, uma de cada.
- Gravar `last_run_at` a cada turno aparece no atraso do laço do `HUB_MEMORY`: relata o número; não
  inventar um intervalo.
