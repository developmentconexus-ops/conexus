# Registro e conformidade

Trilha Dados, a etapa seguinte a Cada papel lê só o seu, na ordem de
[trilhas/dados.md](trilhas/dados.md). É a unidade U4 do estudo da arquitetura de permissões (a
licença e o Registro, que nasce da porta `hub/access`), com os grupos G1 a G5 do estudo do Registro e
conformidade, a letra C(b) do mesmo estudo e a H2a do redesenho da harness (ligar `live` e `funnel`
no contrato de dados), que o fundador pôs aqui em 2026-11-17 ("R3 ... A", depois da explicação). As
letras dele para esta etapa já estão dadas: A(b), B(a) e C(b) (quadro do estudo do Registro,
2026-11-16), e as quatro do estudo único, 1(a), 2(a), 3(d) e 4(b), confirmadas com "Sim". Os estudos
e as capturas das plataformas de referência ficam fora do repositório (delivery L21); a tabela de
referência diz a situação e o que elas fazem sem nomeá-las.

Cada linha citada foi lida no `main` em `f4ccc150`, com `@mastra/core` 1.83.0, `better-auth` 1.7.8 e
`@neondatabase/serverless` 1.2.0. A medida: cerca de 2.400 linhas alteradas em 13 unidades, abaixo das
4.000 da delivery L2; o realinhamento estimava 2.900 com a H2a.

Este cartão substitui, da spec do repositório, a parte 4 (requisitos 6 e 7, `C6` e o grupo 9 de
`04-governanca-minima/tasks.md`) e a parte 3, grupos 5 e 6 (`03-leitura-para-analise/tasks.md:631-720`);
e, de fora dela, o item (b) da spec 3, requisitos 4 a 6 (Seguir, Avisos e o aviso na primeira falha),
cujo texto as unidades U11 a U13 trazem inteiro. O requisito 7.2 da parte 4 ("não encontrado" a quem
não é Dono nem Administrador) já não vale: cada pessoa vê as próprias leituras (2026-11-15, "3. Sim").
O fechamento emenda esses trechos (delivery L19).

## A página do fundador

**No fim desta etapa** cada leitura que um agente ou um app faz do dado da empresa deixa uma linha no
**Registro de dados**, em Configurações. A linha diz quem perguntou, por qual agente, o que foi lido,
a consulta, o resultado e quantas linhas voltaram. Ela nunca guarda o resultado. A consulta fica como
foi escrita, até 4.000 caracteres, e pode trazer um valor que o próprio agente digitou nela. Cada
pessoa vê as próprias leituras, e Dono e Administrador veem todas, sem prazo. Uma leitura recusada
também deixa linha. Se o Registro não conseguir gravar a linha, a leitura não devolve nada.

Entram também quatro coisas que você já escolheu:
- **A(b).** Cada consulta que um app publicado faz ao banco deixa uma linha `APP`, com quem abriu o
  app e o Projeto.
- **C(b).** Numa conversa dentro de um Projeto, o agente lê só o que o Projeto recebeu **e** o papel de
  quem conversa lê. A tabela liberada ao Projeto que o seu papel não lê não aparece para você ali.
- **4(b).** O Hub recusa a consulta de um agente ao catálogo interno do banco. "Que tabelas existem?"
  pelo SQL deixa de mostrar o nome de uma tabela que o papel não lê, e a recusa deixa uma linha.
- **Seguir uma cópia, a seção Avisos e o aviso na primeira falha**, que a etapa da origem deixou para
  esta.

E uma prova roda na CI de cada pull request da trilha. Ela mostra que o Assistente, o Construtor e o
agente salvo leem e escrevem pelo mesmo contrato, contra o banco de verdade, na Empresa e num Projeto,
e que nenhum caminho novo escapa dele. Ler um sistema ao vivo e agir passam a existir no contrato (a
H2a). Os agentes passam a usá-los numa etapa da trilha Agentes e Apps (a H2b); até lá, nada muda na
conversa.

**Exemplo.** Bruno, do papel Vendas, pergunta ao Assistente "quanto vendemos ontem?" e depois "quantos
clientes temos?". Em Configurações, Registro de dados, ele vê duas linhas dele: a leitura de
`sankhya_vendas`, com 1 linha e a consulta, e a de clientes, "não encontrada", sem nenhuma linha. Você,
como dono, vê as linhas de todo mundo, filtra por Bruno, abre uma e toca em **Abrir a conversa**.

**O que muda em relação aos estudos, e por quê.** São mudanças técnicas, decididas pelo firstmate
(tabela "As decisões do firstmate"). Nenhuma muda o que você vê:
- Uma linha por leitura, gravada depois de ler e antes de devolver. O estudo único propunha duas
  (intenção e desfecho). As referências gravam uma, e o banco da empresa responde por um pedido só por
  transação, sem um intervalo onde caberia gravar a intenção. A garantia que você aprovou fica igual:
  nunca uma leitura sem linha.
- A escrita continua com o registro que já tem (o funil de escrita grava antes de mandar). O Registro
  de dados é só de leituras.

**O roteiro de uso.** Na empresa de teste do Hub no ar, com o Sankhya, as cópias de vendas e de
clientes, um Projeto que recebeu as duas, e uma segunda pessoa no papel Membro que lê só
`sankhya_vendas`.

1. Como o Membro, pergunte ao Assistente "quanto vendemos ontem?" e depois "quantos clientes temos?".
   Pergunte também "que tabelas existem no banco?": ele responde com as tabelas que você lê e não
   nomeia `sankhya_clientes`.
2. Ainda como ele, abra Configurações, **Registro de dados**. Aparecem só as leituras dele: a de
   vendas com a contagem, a de clientes como não encontrada, e a consulta ao catálogo como recusada,
   todas sem nenhuma linha do resultado.
3. Ainda como ele, converse com o Assistente dentro do Projeto e pergunte pelos clientes. Ele diz que
   não achou: o Projeto recebeu a tabela, mas o papel dele não a lê.
4. Como dono, abra o Registro. Aparecem as leituras de todos. Filtre por essa pessoa, abra uma linha e
   veja a consulta, sem nenhuma linha do resultado. Toque em **Abrir a conversa**, volte e toque em
   **Exportar**.
5. Abra um app publicado do Projeto que lê a tabela de vendas. No Registro aparece uma linha `APP`,
   com o seu nome e o Projeto.
6. Na página de `sankhya_vendas`, toque em **Seguir**. Em Configurações, **Avisos**, ponha um e-mail
   na lista. O firstmate faz a cópia falhar: chega o sino e o e-mail. Na segunda falha seguida, não
   chega nada.
7. Diga o que viu e aprove os textos das telas.

**O que você faz, e quando.** Antes: nada; o firstmate convida a segunda pessoa e prepara o Projeto e
a falha da cópia. No começo: aprova esta página (as decisões abaixo já têm a sua resposta). Antes da U9 e da U13:
julga o protótipo da tela do Registro e o da seção Avisos (estão pendentes: a U9 e a U13 não começam
sem eles). No meio: a palavra de merge do pull request do G2, que muda uma permissão de funções no
banco da empresa, e a autorização de uma chamada a um ramo de teste do banco da empresa para provar
essa mudança (sem ela, o G2 sai e fica a recusa do Hub, U3). No fim: faz o roteiro, diz o que viu e
aprova os textos das telas, que cada pull request lista.

**Fica de fora.**

- **O agente salvo e a automação como teto** (a versão deixa de substituir a pessoa) e as ferramentas,
  as skills e o prompt saindo da porta. É o U3 do estudo único, que você mandou para a trilha Agentes e
  Apps (R2, "a"). Até lá, o agente salvo segue lendo pelo que a versão declara.
- **Os consumidores passando a chamar `live` e `act` do contrato** (a H2b). É de Agentes e Apps: ela
  migra os 30 arquivos de `builder/` e esvazia a lista de migração. Esta etapa liga os dois verbos e os
  prova; a lista não cresce.
- **A Amostra que uma pessoa abre na página Dados** não entra no Registro (a sua B(a)).
- **Os argumentos de uma leitura ao vivo** não entram na linha: a tela aprovada (`p4-05`) não os
  mostra, e eles trazem valores da empresa. A linha leva a conexão, a operação, o resultado e o tempo.
- **A aba Leituras de uma tabela** (`p4-02`): nenhuma referência tem registro por tabela; o filtro por
  tabela do Registro responde a mesma pergunta.
- **O aviso de volta ao normal**: a referência só avisa a falha.
- **A tabela de concessões, o sujeito Todos e a conexão nova fechada** (a sua 2(a)) e **a conexão
  MCP**. Entram com o cartão que precisar de instância ou de MCP.
- **As pendências**. A etapa toma a **1135** (o código da rodada sem corte nem regra no banco), porque
  o aviso da U12 lê essas colunas da rodada. Esperam: a **1124** (a origem e o bloco Fontes, que esta
  etapa não toca); a **1136** e a **1140** (a ferramenta `copy_runs`, de `builder/assistant/`, da trilha
  Agentes e Apps); a **1122** (o gatilho é uma contagem de reconciliações; as recusas que o Registro
  passa a gravar são só um limite de cima dela); a **1123** (o gatilho é a próxima etapa que criar ou
  mudar logins, e esta só lê pelo login do papel, que já existe). A **1147** e a **1148** são de Agentes
  e Apps.

**As decisões suas nesta etapa.** Três, respondidas por você no quadro em 2026-11-17, as três com a
recomendação: "F1. O Construtor num Projeto lê com o papel de quem conversa: a", "F2. Quem segue uma
cópia e vê Avisos: a", "F3. A guarda do Registro: a". As opções ficam abaixo como foram postas.

- **F1. O Construtor num Projeto lê com o papel de quem conversa?** Respondida: (a). A sua C(b), no quadro do Registro,
  dizia "o Builder segue lendo pela liberação do Projeto". Depois, na decisão 1 do estudo único, que
  você confirmou com "Sim", a consequência escrita era outra: "vale para todo consumidor de conversa, o
  Construtor incluído". Os dois textos divergem, e só você decide.
  - (a) O Construtor também lê só o que o Projeto recebeu **e** o papel de quem conversa lê. O app que
    ele constrói continua lendo pela liberação do Projeto (a sua 3(d)). Exemplo: Carla, Desenvolvedora
    num Projeto que recebeu `sankhya_clientes`, pede ao Construtor uma amostra dos clientes; o papel dela
    não lê clientes, e o Construtor diz que não achou. O app que ela constrói lê clientes quando
    publicado. **Recomendo a**: é a sua regra "fora do papel ninguém vê, nem o Desenvolvedor" (opção 1,
    2026-11-16) e o "Aprovado tudo" do PR 1137, que já faz o Construtor listar só as cópias do papel.
    Veredito nativo: o login do papel já existe; o Hub confere o lugar.
  - (b) O Construtor lê pela liberação do Projeto, como hoje. Carla vê a amostra dos clientes no
    Construtor.
- **F2. Quem segue uma cópia e vê a seção Avisos, depois de "fora do papel ninguém vê".** Respondida:
  (a). A spec do
  aviso dá **Seguir** e **Avisos** a quem administra cópias, e ela foi escrita quando o Desenvolvedor
  ainda administrava. Desde a U13 de Cada papel, só Dono e Administrador administram; o Membro e o
  Desenvolvedor veem na página Dados as tabelas do papel.
  - (a) Quem vê a tabela segue a tabela, e todo membro vê em **Avisos** as cópias que segue. A lista de
    e-mails da empresa fica só com Dono e Administrador. O aviso vai a quem segue e ainda lê a tabela.
    Exemplo: Bruno segue `sankhya_vendas` e recebe o aviso quando ela falha; não vê a lista de e-mails.
    **Recomendo a**: é o que a referência de ingestão faz (cada pessoa liga o aviso das fontes que segue;
    Dono e Administrador têm a lista da empresa) e o que a tela `b4-avisos-dev-vazio` já desenhava para
    quem não administra. Veredito nativo: o módulo de notificações e a porta `hub/access`.
  - (b) Só Dono e Administrador seguem e veem Avisos. Bruno não recebe aviso.
- **F3. A guarda do Registro.** Respondida: (a); o texto da issue de gatilho está logo abaixo, e o
  firstmate a abre quando esta página for aprovada. A sua E4a diz "sem prazo por ora". O estudo único lembrou que a linha
  guarda o texto da consulta, que pode trazer um valor da empresa digitado pelo agente, e deixou a guarda
  sem dono.
  - (a) Sem prazo, como a E4a. Uma issue com gatilho (a tabela passar de um milhão de linhas numa
    empresa) abre a conversa do prazo. **Recomendo a**: hoje a tabela está vazia, e as referências
    guardam de 7 a 365 dias, por plano.
  - (b) Um prazo agora, com uma tarefa diária que apaga as linhas mais velhas. Pede uma permissão de
    apagar na tabela (data D11) e um número seu.

**A issue de gatilho da F3.** Título: "Registro de dados: o prazo de guarda de `data.data_read` quando
uma empresa passar de um milhão de linhas". Corpo:

> O Registro de dados guarda cada leitura sem prazo (E4a, confirmada na F3 (a) do cartão Registro e
> conformidade, 2026-11-17). A linha leva o texto da consulta, até 4.000 caracteres, que pode trazer
> um valor da empresa digitado pelo agente; nunca o resultado.
>
> **Gatilho.** Uma empresa passa de 1.000.000 de linhas em `data.data_read`, contadas por
> `SELECT company_id, count(*) FROM data.data_read GROUP BY company_id`.
>
> **O que se decide então.** O prazo de guarda (as referências guardam de 7 a 365 dias, conforme o
> plano), se ele varia por plano, e se a consulta sai da linha antes da linha inteira.
>
> **O que a decisão pede.** Uma permissão de apagar em `data.data_read`, num pull request só dela
> (data D11); uma tarefa diária que apaga as linhas mais velhas que o prazo; e a palavra do fundador
> com o número.
>
> **Até lá.** Nada apaga linha do Registro; o login do Hub segura só `SELECT` e `INSERT` nela.

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 O Registro grava (um PR) | U1 O gravador e o contrato | `recordReadOf`, o único que grava em `data.data_read`; o contrato grava cada leitura de tabela e consulta e cada recusa; sem linha, sem leitura; `DataContext` com a conversa; os três `dataOf` de `builder/` passam a conversa | `apps/server/src/hub/data/`, `apps/server/src/main.ts`, `apps/server/migrations/`, `apps/server/src/builder/data-tools/`, `apps/server/src/builder/assistant/` (só `assistant.ts`), `apps/server/src/builder/conversation/` (só `builder.ts`), `apps/server/src/builder/agents/` (só `agent.ts`), `.dependency-cruiser.cjs`, `scripts/rerun-never.json` | data (D15, D18, D22); testing (T5, T27); security S40 | o `main` em `f4ccc150` |
| G1 | U2 A leitura ao vivo e o esquema do app | `readThrough` grava `LIVE` pela porta atrasada `recordRead`, pulando a cópia; a leitura do esquema do app pelo Construtor e pelo agente grava `QUERY` | `apps/server/src/hub/connectors/` (`read.ts`, `rows.ts`, `public.ts`), `apps/server/src/hub/apps/` (`builder-data.ts`, `public.ts`), `apps/server/src/builder/app-data/` (só `tools.ts`), `apps/server/src/main.ts`, `scripts/rerun-never.json` | data (D22); testing (T5, T27) | U1 |
| G1 | U3 O plano lê só `sync` | A consulta do agente que lê fora de `sync` (catálogo do sistema, `information_schema`) ou chama uma função da lista recusada volta `NOT_IN_CATALOG` sem linha, e deixa linha no Registro (a sua 4(b)) | `apps/server/src/hub/data/` (`query.ts`, `plan.ts` novo), `scripts/rerun-never.json` | data (D20); testing (T5, T13, T27); security S10 | U1 |
| G2 A permissão de funções (um PR próprio; palavra de merge) | U4 `EXECUTE` das funções que leem por texto | `ensureSync` tira de `PUBLIC` o `EXECUTE` de `query_to_xml` e das irmãs no banco da empresa; a prova num ramo de teste autorizado | `apps/server/src/platform/` (`copy-sql.ts`), `scripts/rerun-never.json` | data (D10, D13); testing (T13); security S41 | U3 mesclado; a autorização do fundador para o ramo de teste |
| G3 O lugar e o contrato inteiro (um PR) | U5 A conversa num Projeto com o papel | No lugar Projeto, o catálogo é o que o Projeto recebeu cruzado com o que o papel lê; a consulta e a página de tabela leem pelo login do papel (a sua C(b), com a F1 (a)) | `apps/server/src/hub/copies/` (`access-source.ts`), `apps/server/src/hub/data/` (`query.ts`, `rows.ts`), `scripts/rerun-never.json` | data (D22); testing (T5, T27); security S10 | G1 mesclado |
| G3 | U6 `live` e `funnel` ligados (a H2a) | `liveOf` e `funnelOf` sobre a porta do Assistente de `hub/connectors`; `TurnBinding` com quem aprovou; `NOT_GRANTED` só sem turno | `apps/server/src/hub/data/` (`live.ts`, `funnel.ts` novos, `public.ts`, `deps.ts`), `apps/server/src/hub/connectors/` (`assistant-port.ts`, `public.ts`), `apps/server/src/main.ts` | data (D22); testing (T5, T26, T27) | U5 |
| G3 | U7 A prova contra o banco de verdade | `runDataConformance` com `make(t)` assíncrono e o contrato vinculado; as 22 leis e duas novas contra o mundo real na Empresa e num Projeto; as leis (c), (d) e (f) da porta; a lista de migração que não cresce | `packages/hub-api/src/` (`company-data-conformance.ts`, `company-data-world.ts`, `company-data.test.ts`), `apps/server/src/hub/data/` (`conformance.test.ts` novo, `test-world.ts` novo), `apps/server/src/hub/access/` (só `conformance.test.ts`), `scripts/rules-doors.test.ts`, `scripts/rerun-never.json` | testing (T4, T5, T27); code C3 a C8; L27 (muda `packages/hub-api`) | U6 |
| G4 O Registro na tela (um PR) | U8 As rotas do Registro | `listDataReads` e `exportDataReads`, recortadas por pessoa (Dono e Administrador tudo); a página por chave (hora, id), da mais nova; os índices | `packages/hub-api/src/` (`data-reads.ts` novo, `index.ts`, `failures.ts` se preciso), `apps/server/src/hub/data/` (`reads.ts`, `routes.ts` novos, `public.ts`, `tables.ts`), `apps/server/migrations/`, `apps/server/src/main.ts`, `apps/web/sweep-replies.ts` | data (D15, D19); testing (T5, T6, T10); security S8, S10; L27 | G1 mesclado |
| G4 | U9 A página Registro de dados (`p4-04` a `p4-06`) | Configurações, **Registro de dados**: 50 por página, filtros no endereço, a linha aberta, **Abrir a conversa**, **Copiar a consulta**, **Exportar** em CSV; a versão do membro | `apps/web/src/routes/_app/companies/$companyId_/settings/` (`data-reads.tsx` novo), `apps/web/src/hub/data/` (novo), `apps/web/sweep-data-reads-states.ts` (novo), `docs/reference/` (só `screens.md`) | web, design, testing | U8; o protótipo julgado |
| G5 O app no Registro (um PR) | U10 A borda avisa o Hub | Depois de cada `db.query` de um app, a borda manda ao Hub a consulta, a contagem e o tempo, com um id dela; o Hub grava `APP` sem repetir; a consulta recusada também | `apps/edge/src/` (`db.ts`, `dispatcher.ts`, `dispatch.ts`, `hub.ts`), `packages/hub-api/src/` (`apps.ts`), `apps/server/src/hub/apps/` (`routes.ts`, `read-notice.ts` novo, `public.ts`), `apps/server/src/main.ts`, `scripts/rerun-never.json` | security (S8, S40); testing (T5, T13, T27); L27 | G1 mesclado |
| G6 Seguir e Avisos (um PR) | U11 Seguir e a lista da empresa | O contrato `copy-alerts.ts` (seguir, deixar de seguir, a lista, pôr e tirar e-mail); a ação `manageCopyAlerts`; `CopySummary.following`; quem segue pela porta (F2 (a)) | `packages/hub-api/src/` (`copy-alerts.ts` novo, `copies.ts`, `roles.ts`, `failures.ts`, `index.ts`), `apps/server/src/hub/notifications/` (`copy-alerts.ts` novo, `routes.ts`, `public.ts`), `apps/server/src/hub/identity/` (`admission.ts`, `companies.ts`), `apps/server/src/hub/copies/` (`list.ts`), `apps/web/src/platform/test-may.ts`, `apps/web/sweep-replies.ts` | security (S8, S10); testing (T5, T10); L27 | o `main` |
| G6 | U12 O aviso na primeira falha | Em `ended`, a primeira falha seguida avisa no sino e por e-mail quem segue e ainda lê a tabela, e cada e-mail da lista; a segunda não; o corte e a regra de `system_code` (1135) | `apps/server/src/hub/copies/` (`run.ts`, `store.ts`, `tables.ts`), `apps/server/src/hub/notifications/` (`notifications.ts`, `copy-email.tsx` novo, `mail.ts`, `notification-render.mjs` gerado), `packages/hub-api/src/` (`notifications.ts`), `apps/server/migrations/`, `apps/server/package.json` (o script `build`), `apps/server/src/main.ts`, `scripts/rerun-never.json` | data (D6, D15, D22); security S40; testing (T5, T10, T27) | U11 |
| G6 | U13 As telas de Seguir e Avisos (`v06`, `b3` a `b5`) | **Seguir** na página da tabela; a seção **Avisos**; o aviso `COPY_FAILED` no sino | `apps/web/src/hub/copies/` (`copy-detail.tsx`, `text.ts`, `queries.ts`), `apps/web/src/hub/notifications/` (`bell.tsx`, `copy-alerts.tsx` novo), `apps/web/src/routes/_app/companies/$companyId_/settings/` (`alerts.tsx` novo), `apps/web/sweep-alerts-states.ts` (novo), `docs/reference/` (só `screens.md`) | web, design, testing | U11, U12; o protótipo julgado |

Seis grupos, um pull request cada ([delivery L9](../guides/delivery.md)), um commit por unidade.

- **A linha principal.** G1, depois G3 e G4 em paralelo (não dividem pasta: G3 muda `hub/data/query.ts`,
  `rows.ts`, `public.ts` e `deps.ts`; G4 cria `reads.ts` e `routes.ts` e muda `public.ts` só na linha da
  porta das rotas, por isso G4 rebaseia sobre G3 se G3 mesclar antes). G5 parte de G1 mesclado.
- **Ao lado, desde o começo.** G6 não toca `hub/data` nem a borda e corre do `main`.
- **O G2** só mescla com a sua palavra de merge (L6; data D11 por analogia: muda uma permissão no banco
  da empresa) e só depois da prova no ramo de teste que você autorizar. O G1, o G3 e o G5 não criam nem
  tiram permissão: o login do Hub já segura `SELECT` e `INSERT` em `data.data_read`
  (`apps/server/database-grants.sql:437`), e o C(b) lê pelo login do papel que já existe.
- **O que toca a outra trilha.** A U1 muda uma linha em cada um dos três `dataOf` de `builder/` e a U2
  uma em `builder/app-data/tools.ts`, para passar a conversa; a U7 e a U8 mudam `packages/hub-api`. A
  trilha Agentes e Apps não tem etapa em construção nesses arquivos hoje (L1); o pull request avisa a
  trilha (L27). A H1 dela toca `hub/connectors/scope.ts`, que esta etapa não muda.
- **A QA** ([testing T25](../guides/testing.md)) roda depois de G4 e de G6, pelo roteiro de uso e pela
  matriz de estados.
- **Os modelos.** U1, U6 e U10 em Opus (contrato entre módulos; a ordem entre dois bancos; a borda e o
  Hub); as outras em Sonnet.

**Orçamento de código alterado.** Linhas mudadas, as tiradas também, sem testes nem gerados.

- U1: ~170 (`record.ts` novo ≈70; `public.ts` ≈45, o embrulho e o contexto; `tables.ts` 2; a migração do
  índice ≈4; `deps.ts` 2; `main.ts` 4; `data-tools/tools.ts` ≈12, `threadOf`; os três `dataOf` 3 cada;
  `.dependency-cruiser.cjs` ≈8).
- U2: ~90 (`read.ts` ≈30; `rows.ts` 3; `connectors/public.ts` 4; `builder-data.ts` ≈15; `apps/public.ts`
  ≈15; `app-data/tools.ts` ≈8; `main.ts` 4).
- U3: ~90 (`plan.ts` novo ≈60; `query.ts` ≈30).
- U4: ~30 (`copy-sql.ts` ≈30, o bloco `DO`).
- U5: ~110 (`access-source.ts` ≈15; `query.ts` −45 e +20, sai `projectRead`; `rows.ts` ≈15; `deps.ts` 2;
  ajustes de tipo ≈10).
- U6: ~220 (`live.ts` novo ≈60; `funnel.ts` novo ≈70; `public.ts` ≈30; `deps.ts` 4;
  `assistant-port.ts` ≈30, a conversa na leitura; `connectors/public.ts` 4; `main.ts` 4; `read.ts` ≈10).
- U7: ~110 (`company-data-conformance.ts` ≈60, o `make` assíncrono, o contrato vinculado e as duas leis;
  `company-data-world.ts` ≈20; `.dependency-cruiser.cjs` 0; o resto é teste, ≈400 linhas que não contam).
- U8: ~240 (`data-reads.ts` novo ≈70; `reads.ts` novo ≈110; `routes.ts` novo ≈30; `tables.ts` ≈4; a
  migração ≈6; `public.ts` 4; `main.ts` 4; `index.ts` 2; `sweep-replies.ts` ≈10).
- U9: ~330 (`data-reads.tsx` da rota ≈40; `hub/data/data-reads.tsx` ≈150; `read-detail.tsx` ≈70;
  `queries.ts` ≈20; `csv.ts` ≈30; `text.ts` ≈20).
- U10: ~200 (`db.ts` ≈45; `dispatcher.ts` ≈15; `dispatch.ts` ≈10; `hub.ts` ≈20; `hub-api/apps.ts` ≈25;
  `read-notice.ts` novo ≈60; `routes.ts` ≈10; `public.ts` 5; `main.ts` 4; `wrangler` nenhuma).
- U11: ~280 (`copy-alerts.ts` do contrato ≈70; `copy-alerts.ts` do servidor ≈130; `routes.ts` ≈15;
  `admission.ts` 2; `companies.ts` 2; `roles.ts` 2; `failures.ts` ≈12; `copies.ts` 2; `list.ts` ≈15;
  `test-may.ts` 1; `sweep-replies.ts` ≈20).
- U12: ~260 (`run.ts` ≈40; `store.ts` 3; `notifications.ts` ≈110; `copy-email.tsx` novo ≈50; `mail.ts`
  ≈20; `hub-api/notifications.ts` ≈10; `tables.ts` de copies ≈4 e a migração do check ≈4; o script
  `build` 2; `main.ts` 3; `source-pass.ts` ou `run.ts`, o corte de `system_code`, ≈5).
- U13: ~260 (`copy-detail.tsx` ≈20; `text.ts` ≈20; `queries.ts` ≈25; `bell.tsx` ≈15; `copy-alerts.tsx`
  novo ≈140; `alerts.tsx` da rota ≈30; `screens.md` 2 linhas).

**Total da etapa:** cerca de 2.390 linhas alteradas.

## Os critérios de aceite

Cada grupo tem a sua faixa: G1 de 1 a 29, G2 de 30 a 39, G3 de 40 a 69, G4 de 70 a 99, G5 de 100 a
109, G6 de 110 a 149. Os números que sobram ficam livres para a leitura do cartão.

### G1

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Bruno (Vendas, lê `sankhya_vendas`) lê a tabela pelo contrato no Assistente: `data.data_read` ganha uma linha `SAMPLE` com `person_id` dele, `agent` `ASSISTANT`, `tables` `{sankhya_vendas}`, `outcome` `TABLE`, `rows` igual ao número de linhas devolvidas e `thread_id` da conversa | `apps/server/src/hub/data/record.test.ts`, "a leitura de tabela deixa uma linha SAMPLE com a conversa" | must |
| 2 | U1 | A consulta pelo contrato grava uma linha `QUERY` com o texto como foi pedido, `tables` com as tabelas da resposta, `outcome` `QUERY` e a contagem | `record.test.ts`, "a consulta deixa uma linha QUERY com o texto e as tabelas" | must |
| 3 | U1 | A recusa grava: a tabela fora do catálogo (`NOT_IN_CATALOG`), a consulta que o banco recusa (`QUERY_REFUSED`, `NOT_IN_ROLE`) e o catálogo calado (`CATALOG_UNAVAILABLE`) deixam cada uma uma linha com `rows` nulo. Recusa: nenhuma delas devolve linha de dado | `record.test.ts`, "cada recusa deixa uma linha sem contagem" | must |
| 4 | U1 | Nenhuma coluna da linha guarda uma célula lida: com uma tabela de valores marcados (`'MARCA-<n>'`), nenhum campo de nenhuma linha de `data.data_read` contém `MARCA-`, a consulta incluída quando ela não traz o literal | `record.test.ts`, "a linha não guarda nenhum valor lido" | must |
| 5 | U1 | Com a gravação derrubada (o mundo de teste faz o `insert` falhar), a leitura de tabela e a consulta respondem `TABLE_UNAVAILABLE`, sem linha de dado, e o log tem `DATA_READ_UNRECORDED` com `companyId` e `verb`, sem a consulta | `record.test.ts`, "sem linha no Registro, nenhuma linha de dado" | must |
| 6 | U1 | `describe` e a lista do catálogo não gravam linha | `record.test.ts`, "descrever não grava" | must |
| 7 | U1 | Uma leitura `OPERATION` que o catálogo serve por uma tabela grava `SAMPLE`; a recusada antes de chamar o sistema (`NOT_IN_CATALOG`) grava `LIVE` com a conexão e a operação; nenhuma leitura grava duas linhas | `record.test.ts`, "a leitura de operação deixa exatamente uma linha" | must |
| 8 | U1 | O agente da linha sai do lugar e da versão: na Empresa `ASSISTANT`, no Projeto sem versão `BUILDER`, com versão `AGENT` com `agent_id`; `project_id` só no Projeto | `record.test.ts`, "o agente e o Projeto da linha vêm do escopo" | must |
| 9 | U1 | Só `apps/server/src/hub/data/record.ts` importa a tabela `dataRead`: um arquivo plantado que a importe faz `npm run deps` falhar com a regra `data-read-only-through-the-recorder` | `scripts/rules-doors.test.ts`, "só o gravador escreve no Registro" | must |
| 10 | U1 | Uma consulta de 4.000 caracteres grava a linha inteira; o contrato já recusa uma maior (`QUERY_SQL_MAX`, `packages/hub-api/src/company-data.ts:93`) | `record.test.ts`, "a consulta no limite cabe na linha" | should |
| 11 | U2 | A leitura ao vivo de um sistema pelo Assistente grava uma linha `LIVE` com `connection_id`, `operation`, `outcome` `OK` e `rows` nulo; a do app grava `APP` | `apps/server/src/hub/connectors/read-record.test.ts`, "a leitura ao vivo deixa uma linha LIVE" | must |
| 12 | U2 | A rodada de uma cópia (`by: 'copy'`) não grava | `read-record.test.ts`, "a cópia não entra no Registro" | must |
| 13 | U2 | A leitura ao vivo recusada pelo papel (`NOT_IN_ROLE`) grava uma linha com esse resultado, sem chamar o sistema | `read-record.test.ts`, "a leitura ao vivo recusada deixa linha" | must |
| 14 | U2 | Com a gravação derrubada, a leitura ao vivo responde `UNREACHABLE` e o valor lido não volta; `DATA_READ_UNRECORDED` no log | `read-record.test.ts`, "sem linha, a leitura ao vivo não devolve o valor" | must |
| 15 | U2 | `app_data_read` do Construtor e do agente grava uma linha `QUERY` com o texto, `tables` vazio, o resultado e a contagem; a lista de tabelas e a contagem de linhas da página Dados (`apps/server/src/hub/apps/app-tables.ts:73`, `:157`) não gravam | `apps/server/src/hub/apps/app-data-record.test.ts`, "a leitura do esquema do app pelo agente deixa linha" e "a página Dados não entra no Registro" | must |
| 16 | U3 | Como Bruno, `select relname from pg_class`, `select table_name from information_schema.tables` e `select * from pg_catalog.pg_roles` voltam `NOT_IN_CATALOG`, sem linha, e cada uma grava uma linha `QUERY` com esse resultado | `apps/server/src/hub/data/plan.test.ts`, "o catálogo do sistema é recusado e deixa linha" | must |
| 17 | U3 | `select query_to_xml('select * from sync.sankhya_clientes', true, false, '')`, `select to_regclass('sync.sankhya_clientes')` e `select 'sync.sankhya_clientes'::regclass` voltam `NOT_IN_CATALOG`, sem linha | `plan.test.ts`, "a função e o tipo que leem por nome são recusados" | must |
| 18 | U3 | As consultas de hoje continuam: `select date_trunc('day', ...), sum(...) ... group by 1` e `select count(*) from sync.sankhya_vendas` passam | `plan.test.ts`, "a consulta comum passa" | must |
| 19 | U3 | Uma `view` que alguém crie fora de `sync` não abre caminho: o plano que lê qualquer esquema fora de `sync` é recusado | `plan.test.ts`, "o plano fora de sync é recusado" | must |

### G2

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 30 | U4 | Depois de `ensureSync`, o login de um papel recebe `42501` em `select query_to_xml('select 1', true, false, '')`, `cursor_to_xml`, `table_to_xml`, `schema_to_xml` e `database_to_xml`; `conexus_sync` continua com tudo o que precisa | `apps/server/src/platform/copy-functions.test.ts`, "o login de papel não executa as funções que leem por texto" | must |
| 31 | U4 | `ensureSync` duas vezes deixa `pg_proc.proacl` dessas funções como na primeira | `copy-functions.test.ts`, "tirar duas vezes deixa igual" | must |
| 32 | U4 | No ramo de teste autorizado do banco da empresa, a mesma instrução passa sem `42501` do dono das funções; o resultado vai no corpo do pull request, com o comando | a prova da plataforma (L28), sem teste no repositório | must |

### G3

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 40 | U5 | Num Projeto que recebeu `sankhya_vendas` e `sankhya_clientes`, o catálogo do Assistente e do agente salvo de Bruno lista só `sankhya_vendas`; o de Dono e Administrador lista as duas | `apps/server/src/hub/data/place-role.test.ts`, "no Projeto, o catálogo é o que o Projeto recebeu e o papel lê" | must |
| 41 | U5 | No mesmo Projeto, `read({kind:'TABLE', table:'sankhya_clientes'})` de Bruno volta `NOT_IN_CATALOG`; a consulta `select * from sync.sankhya_clientes` volta `NOT_IN_ROLE` ou `NOT_IN_CATALOG`, sem linha | `place-role.test.ts`, "no Projeto, a tabela fora do papel é recusada" | must |
| 42 | U5 | No Projeto, uma consulta de Bruno roda como `conexus_role_<id do papel>` (`current_user`), e uma tabela que o papel lê mas o Projeto não recebeu volta `NOT_IN_CATALOG` | `place-role.test.ts`, "no Projeto, o banco segura o papel e o Hub o lugar" | must |
| 43 | U5 | O Construtor de Carla, sem o papel que lê clientes, recebe o catálogo sem `sankhya_clientes` (F1 (a)) | `place-role.test.ts`, "o Construtor no Projeto segue a F1" | must |
| 44 | U5 | O app publicado do Projeto continua lendo as duas tabelas pelo login do Projeto (a sua 3(d)) | `apps/server/src/hub/apps/app-read-place.test.ts`, "o app lê pela liberação do Projeto" | must |
| 45 | U6 | Com um turno vinculado, `read({kind:'OPERATION'})` de uma leitura que nenhuma tabela guarda chama o sistema uma vez e volta `LIVE` com o valor; sem turno, `NOT_GRANTED` | `apps/server/src/hub/data/live.test.ts`, "a leitura ao vivo pelo contrato chama o sistema com o turno" | must |
| 46 | U6 | A leitura ao vivo pelo contrato gasta o mesmo limite de chamadas do turno que a ferramenta de hoje: na chamada além do limite volta `CALLS_SPENT` | `live.test.ts`, "o contrato gasta o limite do turno" | must |
| 47 | U6 | `act` de uma ação declarada, com o turno e quem aprovou, grava em `connector_write` e volta `OK`; repetir a mesma chamada (`thread`, `toolCall`) volta a mesma resposta sem mandar de novo; a mesma chamada com outra entrada volta `IDEMPOTENCY_CONFLICT` | `apps/server/src/hub/data/funnel.test.ts`, "agir pelo contrato passa pelo funil e não repete" | must |
| 48 | U6 | `act` de uma operação que o papel não usa volta `NOT_IN_ROLE` e não grava em `connector_write` | `funnel.test.ts`, "agir fora do papel é recusado sem registro de escrita" | must |
| 49 | U6 | `WRITE_OPEN` volta com `since` em ISO; nenhum campo `Date` escapa do contrato (o esquema `ActAnswer` aceita a resposta) | `funnel.test.ts`, "a resposta do funil passa no esquema do contrato" | must |
| 50 | U6 | O caso de hoje que fixa `NOT_GRANTED` em `live` e `act` (`apps/server/src/hub/data/data.test.ts:227-248`) passa a afirmá-lo só sem turno | `data.test.ts`, o caso reescrito | must |
| 51 | U7 | `runDataConformance` aceita `make(t)` assíncrono e um contrato vinculado; o mundo falso de hoje passa as 22 leis como antes | `packages/hub-api/src/company-data.test.ts`, "a conformidade espera o mundo assíncrono e passa o TestContext" | must |
| 52 | U7 | Lei nova "toda leitura deixa exatamente uma linha, sem nenhuma célula": para cada leitura das leis, o mundo devolve uma linha, e nenhuma linha contém um valor plantado | `company-data.test.ts` (mundo falso) e `apps/server/src/hub/data/conformance.test.ts` (mundo real) | must |
| 53 | U7 | Lei nova "a gravação derrubada não devolve linha": com `world.failRecord()`, nenhuma leitura devolve dado | os mesmos dois arquivos | must |
| 54 | U7 | As 24 leis passam contra o mundo real em dois lugares: a Empresa (papel Vendas) e um Projeto (o que recebeu cruzado com o papel) | `apps/server/src/hub/data/conformance.test.ts`, "empresa" e "projeto" | must |
| 55 | U7 | As leis (c) e (d) da porta, por consumidor (Assistente, Construtor, agente): toda leitura aceita deixa uma linha; o login usado tem `SELECT` só nas tabelas do papel | `apps/server/src/hub/access/conformance.test.ts`, os cenários estendidos | must |
| 56 | U7 | A lei (f) da porta: `query_to_xml` e uma consulta ao catálogo do sistema recusam e deixam linha, por consumidor | `apps/server/src/hub/access/conformance.test.ts`, "a consulta que lê por fora recusa" | must |
| 57 | U7 | Um nome a mais na lista de migração (`.dependency-cruiser-migration.cjs`) faz o teste falhar; um a menos passa | `scripts/rules-doors.test.ts`, "a lista de migração do contrato não cresce" e "um nome novo na lista falha" | must |

### G4

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 70 | U8 | `GET /api/companies/{companyId}/data-reads` como Dono devolve as linhas de todos, da mais nova para a mais antiga, 50 por página, com `next`; a segunda página continua sem repetir nem pular, mesmo com duas linhas na mesma hora | `apps/server/src/hub/data/reads.test.ts`, "o dono lê todas, por página, sem repetir" | must |
| 71 | U8 | Como Bruno, a mesma rota devolve só as linhas dele; `person=<outra pessoa>` devolve a página vazia. Recusa: nenhuma linha de outra pessoa sai, nem na exportação | `reads.test.ts`, "cada pessoa lê só as suas" | must |
| 72 | U8 | Os filtros `person`, `agent`, `table` e `outcome` (`OK`, `REFUSED`) recortam; `table` acha a linha `QUERY` que leu a tabela entre outras | `reads.test.ts`, "os filtros recortam" | must |
| 73 | U8 | Cada linha leva o nome da pessoa e o do Projeto, lidos num lote por página (no máximo uma leitura de nomes por página) | `reads.test.ts`, "os nomes vêm num lote" | should |
| 74 | U8 | `GET .../data-reads/export` devolve até 5.000 linhas do filtro, com `complete` falso quando há mais | `reads.test.ts`, "a exportação para em 5.000" | must |
| 75 | U8 | Quem não é membro da empresa recebe 404 `NOT_FOUND` nas duas rotas (security S10); uma página com `page` malformado recebe 400 | `reads.test.ts`, "fora da empresa, não encontrado" | must |
| 76 | U8 | Nenhuma linha da resposta tem um campo de valor lido: o esquema `DataReadEntry` não tem campo de linhas, e a resposta passa nele | `reads.test.ts`, "a resposta passa no esquema sem linhas" | must |
| 77 | U9 | O índice de Configurações mostra **Registro de dados** para todo membro; o Dono vê o filtro de pessoa e o Membro não | `apps/web/src/hub/data/data-reads.test.tsx`, "o item e o filtro de pessoa" | must |
| 78 | U9 | A lista mostra quando, quem, qual agente, o que foi lido, o resultado e quantas linhas; o filtro escolhido fica no endereço e volta ao recarregar | `data-reads.test.tsx`, "a lista e o filtro no endereço" | must |
| 79 | U9 | A linha aberta mostra quem, o agente, a conversa, as tabelas ou a operação, a consulta, o resultado, as linhas e o tempo, com **Abrir a conversa** quando a conversa é conhecida e **Copiar a consulta** quando há consulta; nada mais | `data-reads.test.tsx`, "a linha aberta" | must |
| 80 | U9 | **Exportar** baixa um CSV com as linhas do filtro; uma consulta que começa com `=`, `+`, `-` ou `@` sai com um apóstrofo na frente | `apps/web/src/hub/data/csv.test.ts`, "o CSV desarma fórmula" | must |
| 81 | U9 | Vazio: "Nenhuma leitura ainda." e o que vai aparecer ali; carregando: esqueletos; erro: "Não deu para ler o registro agora." com **Tentar de novo** | `data-reads.test.tsx`, os três estados, e `apps/web/sweep-data-reads-states.ts` | must |

### G5

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 100 | U10 | Um app que faz `db.query` deixa uma linha `APP` com a pessoa que abriu o app, o Projeto, a consulta, a contagem e o tempo, e `tables` vazio | `apps/server/src/hub/apps/read-notice.test.ts`, "a consulta do app deixa uma linha APP" | must |
| 101 | U10 | O mesmo aviso duas vezes (mesmo id) grava uma linha só | `read-notice.test.ts`, "o aviso repetido não duplica" | must |
| 102 | U10 | A consulta recusada pelo banco também avisa, com o código do PostgreSQL como resultado; `db.batch` não avisa | `apps/edge/src/db.test.ts`, "a consulta recusada avisa; o batch não" | must |
| 103 | U10 | O aviso não atrasa o app: a resposta de `db.query` volta antes de o aviso terminar, e um Hub calado não muda a resposta; a borda tenta mais uma vez e, sem resposta, imprime `EDGE_READ_UNRECORDED` sem a consulta | `db.test.ts`, "o aviso vai depois e não muda a resposta" | must |
| 104 | U10 | Pessoa, empresa e Projeto saem da sessão do app no Hub, nunca do corpo do aviso: um corpo com outro `projectId` é recusado com 400 | `read-notice.test.ts`, "o aviso não escolhe a pessoa nem o Projeto" | must |
| 105 | U10 | Uma consulta de mais de 4.000 caracteres grava os 4.000 primeiros | `read-notice.test.ts`, "a consulta longa é cortada" | should |

### G6

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 110 | U11 | `PUT .../copies/{copyId}/follow` como Bruno, numa cópia que o papel dele lê, segue; `DELETE` deixa de seguir; repetir cada um responde igual. Recusa: a cópia que o papel não lê dá 404 `COPY_NOT_FOUND` (F2 (a)) | `apps/server/src/hub/notifications/copy-alerts.test.ts`, "seguir e deixar de seguir" | must |
| 111 | U11 | Ninguém segue por outro: a rota não tem campo de pessoa, e a regra do banco recusa um `insert` com outra pessoa | `copy-alerts.test.ts`, "ninguém segue por outro" | must |
| 112 | U11 | `GET .../copy-alerts` devolve as cópias que a pessoa segue e ainda lê, e `recipients` só para Dono e Administrador (nulo para os outros) | `copy-alerts.test.ts`, "a lista de quem segue e a lista da empresa" | must |
| 113 | U11 | Pôr na lista: o e-mail repetido (qualquer caixa) dá 409 `ALERT_RECIPIENT_TAKEN`; o 21º dá 409 `ALERT_RECIPIENTS_FULL`; tirar um que não existe dá 404. Recusa: o Membro recebe 404 em pôr e tirar | `copy-alerts.test.ts`, "a lista da empresa" | must |
| 114 | U11 | `listCopies` traz `following` por cópia | `apps/server/src/hub/copies/list.test.ts`, "a cópia diz se a pessoa a segue" | must |
| 115 | U11 | Quem sai da empresa ou a cópia apagada leva o seguir junto | `copy-alerts.test.ts`, "o seguir sai com a pessoa e com a cópia" | must |
| 116 | U12 | A rodada que termina em `ERROR` depois de uma que não terminou em `ERROR` cria uma notificação `COPY_FAILED` para cada pessoa que segue e ainda lê a tabela, e manda um e-mail a cada uma e a cada endereço da lista, um por endereço | `apps/server/src/hub/copies/copy-failed.test.ts`, "a primeira falha avisa no sino e por e-mail" | must |
| 117 | U12 | A segunda falha seguida não avisa; `ERROR`, `COMPLETE`, `ERROR` avisa de novo; `INTERRUPTED` e a parada pedida não contam como rodada anterior | `copy-failed.test.ts`, "a segunda falha não avisa" e "depois de voltar, avisa de novo" | must |
| 118 | U12 | O texto é "A cópia {nome} parou. {frase} {o que fazer}", com o link da aba Rodadas; o e-mail não leva a mensagem do sistema nem número da empresa | `copy-failed.test.ts`, "o texto do aviso" | must |
| 119 | U12 | E-mail recusado pelo provedor: a notificação e a rodada ficam, e o log tem `COPY_MAIL_FAILED` sem o endereço; notificação que não grava: a rodada termina como terminou e o log registra | `copy-failed.test.ts`, "o e-mail que falha não muda a rodada" | must |
| 120 | U12 | Quem segue e perdeu a leitura da tabela não é avisado | `copy-failed.test.ts`, "quem não lê mais a tabela não é avisado" | must |
| 121 | U12 | `system_code` maior que 100 caracteres é cortado em `systemOf` e a regra `copy_run_system_code` do banco recusa um maior (a 1135) | `apps/server/src/hub/copies/system-code.test.ts`, "o código do sistema tem corte e regra" | must |
| 122 | U13 | A página da tabela mostra **Seguir** ao lado de **Rodar agora** para quem pode seguir; seguida, **Seguindo** com `aria-pressed`; um toque deixa de seguir | `apps/web/src/hub/copies/copy-follow.test.tsx`, "seguir na página da tabela" | must |
| 123 | U13 | Configurações, **Avisos**: o Dono vê a lista com "Pôr na lista" e "Tirar {e-mail}" sem confirmação, o e-mail sem conta mostra "e-mail sem conta no Conexus"; todos veem "Cópias que você segue" com o interruptor "Seguir {nome}"; sem cópia: "Você não segue nenhuma cópia. Siga uma na página dela." | `apps/web/src/hub/notifications/copy-alerts.test.tsx`, os casos da seção | must |
| 124 | U13 | O sino mostra o aviso `COPY_FAILED` com o texto do critério 118 e leva à aba Rodadas da cópia | `apps/web/src/hub/notifications/bell.test.tsx`, "o aviso de cópia" | must |

## A matriz de estados

### G1, G2, G3 e G5

Não criam tela. A recusa do catálogo do sistema chega à conversa pela linha que a ferramenta já mostra
para `NOT_IN_CATALOG` (de hoje).

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `data.data_read` (todas as colunas; já no `main`) | só `recordReadOf` (U1), chamado pelo embrulho do contrato (U1), por `readThrough` e pela leitura do esquema do app (U2), e pelo aviso da borda (U10) | `listDataReads` e `exportDataReads` (U8); as leis (U7) |
| `DataContext.thread` e `agentId` | os três `dataOf` de `builder/` (U1), `builder/app-data/tools.ts` (U2) | o embrulho (U1) e a linha |
| `TurnBinding` (`turn`, `speaker`, `agentId`, `number`, `approvedBy`) | ninguém de produção nesta etapa (a H2b); o mundo real da U7 | `liveOf` e `funnelOf` (U6) |
| `ReadEntry` | o embrulho, `readThrough`, `app-data`, `read-notice` | `recordReadOf` |
| `RecordRead` → `'RECORDED' \| 'UNRECORDED'` | `recordReadOf` (U1) | o embrulho, `readThrough`, `app-data` (U2), `read-notice` (U10) |
| `recordAppRead` (o corpo: `id`, `query`, `outcome`, `rows`, `ms`) | a borda (U10) | `read-notice.ts` (U10) |

### G4

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Registro de dados, Dono e Administrador (`p4-04`) | o vazio | "Nenhuma leitura ainda." e "Cada leitura que um agente ou um app fizer do dado da empresa aparece aqui, sem o resultado." (`p4-06`) | esqueletos nas linhas | "Não deu para ler o registro agora." com **Tentar de novo** | — (o item existe para todo membro) | quem não é membro: a página de não encontrado (S10) | sessão vencida: o de hoje da plataforma |
| Registro de dados, Membro (protótipo pendente) | o vazio | "Nenhuma leitura sua ainda." e a mesma frase | esqueletos | o mesmo | — | o mesmo | o mesmo |
| Filtro sem resultado | — | "Nenhuma leitura com esses filtros." com **Limpar os filtros** | esqueletos | o mesmo | — | — | — |
| A linha aberta (`p4-05`) | — | — | esqueleto do painel | o mesmo, no painel | a linha de outra pessoa pelo endereço, para o Membro: "Leitura não encontrada." | — | — |
| Exportar | — | sem linhas: o botão fica desligado | "Exportando…" no botão | a frase do Hub, ao lado do botão | — | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `DataReadEntry` (`id`, `at`, `person {id, name}`, `agent`, `project {id, name} \| null`, `agentId`, `threadId`, `verb`, `tables`, `connection`, `operation`, `query`, `outcome`, `rows`, `ms`) | `reads.ts` (U8) | a lista e a linha aberta (U9) |
| `next` (o id da última linha) | `reads.ts` | o `Pager` (U9) |
| `complete` da exportação | `reads.ts` | **Exportar** (U9): "As primeiras 5.000 leituras." quando falso |

### G6

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Seguir** na página da tabela | **Seguir** | — | "Seguindo…" no botão pendente | a frase do Hub ao lado | — | quem não lê a tabela não a vê, e não há botão (F2 (a)) | o de hoje |
| Avisos, Dono e Administrador (`b3-avisos`, `v06`) | a lista vazia: "Nenhum e-mail na lista." e o campo | "Você não segue nenhuma cópia. Siga uma na página dela." | esqueletos | "Não deu para ler os avisos agora." com **Tentar de novo** | — | — | o de hoje |
| Avisos, quem não administra (`b4-avisos-dev-vazio`; o Membro, pela F2 (a), é protótipo pendente) | só "Cópias que você segue" | o mesmo vazio | esqueletos | o mesmo | — | — | o de hoje |
| Pôr na lista (`b5-avisos-repetido`) | — | — | "Pondo…" | "Esse e-mail já está na lista." ou "A lista já tem 20 e-mails. Tire um para pôr outro." | — | — | — |
| O aviso no sino | — | — | — | — | a cópia apagada: o aviso sai com ela (cascata) | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `CopySummary.following` | `list.ts` (U11) | **Seguir** (U13) |
| `CopyAlerts.following[]`, `recipients[] \| null` | `copy-alerts.ts` do servidor (U11) | a seção Avisos (U13) |
| `notifications.copy_notice` (já no `main`) | `copyFailed` (U12) | `list` e `markRead` do sino (U12), `bell.tsx` (U13) |
| `NotificationRow` `COPY_FAILED` (`copy {id, name}`, `code`) | `list` (U12) | `bell.tsx` (U13) |
| `copies.copy_run.system_code` com corte | `systemOf` (U12) | a aba Rodadas e `copy_runs` (de hoje) |

Uma etapa com tela leva o desenho de caixas de cada tela a 1280 e 390 px. Os desenhos aprovados são os
da proposta (`p4-04` a `p4-06`, `v06`) e os do kit da spec 3 (`b3` a `b5`), fora do repositório
(delivery L21). As duas versões novas, o Registro do Membro e Avisos do Membro pela F2 (a), são o
protótipo pendente `registro-e-avisos-do-membro`, que o fundador julga antes da U9 e da U13
([screens](../../.agents/skills/conexus-scope/references/screens.md)).

```text
1280 px, Registro de dados (Dono)
┌ Configurações ┬──────────────────────────────────────────────────────────────┐
│ Empresa       │ Registro de dados                              [Exportar]    │
│  Geral        │ Cada leitura que um agente ou um app fez, sem o resultado.  │
│  Pessoas      │ [Pessoa ▾] [Agente ▾] [Tabela ▾] [Resultado ▾]               │
│  Registro …   │ Quando        Quem    Agente      O que         Resultado L. │
│  Avisos       │ hoje 10:02    Bruno   Assistente  sankhya_vendas  Leu      1 │
│               │ hoje 10:01    Bruno   Assistente  clientes        Recusada – │
│               │                                     ‹ 1 2 › (Pager)           │
└───────────────┴──────────────────────────────────────────────────────────────┘
390 px: os filtros num menu "Filtros (2)"; cada linha vira um cartão de duas linhas
(quando · quem · agente / o que · resultado · linhas); a linha aberta ocupa a tela.
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `recordReadOf`: um `insert` em `data.data_read` (U1), depois da leitura e antes de devolver | duas leituras, duas linhas; ids diferentes, feitos por quem grava | a leitura no banco da empresa já rodou; sem a linha, nada volta (a regra "sem registro, sem leitura") | Hub calado: `UNRECORDED`; a leitura responde `TABLE_UNAVAILABLE` ou `UNREACHABLE` | `DATA_READ_UNRECORDED` (error, `companyId`, `verb`, a causa, nunca a consulta) | 5, 14, 53 |
| O pior caso de ordem: a linha gravou e a resposta se perdeu | — | uma linha a mais, nunca uma a menos | — | nada novo | 5 |
| `readThrough` com a gravação (U2) | como hoje, pela fila da conexão | o sistema respondeu e a linha não gravou: `UNREACHABLE`, o valor não volta | o sistema calado: a linha grava o resultado `UNREACHABLE` | `CONNECTOR_CALLED` de hoje; `DATA_READ_UNRECORDED` | 11, 13, 14 |
| A consulta recusada pelo plano (U3) | independentes | nada roda depois do `EXPLAIN` além da consulta que já rodou no mesmo pedido; as linhas não saem | o banco da empresa calado: `TABLE_UNAVAILABLE`, como hoje | `DATA_READ_REFUSED` (info, `companyId`, `personId`, sem a consulta) | 16, 17, 19 |
| `ensureSync` com o `REVOKE` (U4) | `ROLES_LOCK`, como hoje | uma transação: o esquema e o `REVOKE` entram juntos ou não entram | o dono das funções recusa (`42501`): a U4 para (Parar se) | o de hoje | 30, 31, 32 |
| `funnelOf` → `writeThrough` (U6; o registro de escrita é o de hoje) | `register` com a trava da conversa e a chave (`thread`, `toolCall`): a segunda volta a primeira resposta | `SENDING` gravado e o sistema calado: `WRITE_UNCERTAIN` com a marca | o sistema recusa: `REFUSED` com o nativo | `CONNECTOR_WRITE_*` de hoje | 47, 48, 49 |
| `listDataReads`, `exportDataReads` (U8, só leitura) | independentes | nada a desfazer | Hub calado: 503 `DATABASE_UNAVAILABLE` | nada novo | 70 a 75 |
| **Exportar** (U9), o CSV montado na tela | dois toques: o botão pendente | — | Hub calado: a frase do Hub | nada | 80 |
| `recordAppRead` da borda ao Hub (U10) | o mesmo id duas vezes: `insert ... on conflict do nothing`, uma linha | a borda mandou e a resposta se perdeu: a segunda tentativa não duplica | Hub calado duas vezes: a linha falta; a borda imprime `EDGE_READ_UNRECORDED`. A garantia aqui é "pelo menos uma vez, com uma nova tentativa", dita na página | `EDGE_READ_UNRECORDED` (borda); `APP_READ_RECORDED` não existe: a linha é o registro | 101, 103 |
| `followCopy`, `unfollowCopy` (U11) | o segundo `PUT` responde igual (`on conflict do nothing`); o segundo `DELETE` também | uma instrução só | Hub calado: 503 | nada | 110, 111 |
| `addAlertRecipient`, `removeAlertRecipient` (U11) | dois `POST` do mesmo e-mail: o índice único (`alert_recipient_key`) dá `23505` ao segundo, que vira 409 `ALERT_RECIPIENT_TAKEN`; o limite de 20 conta numa transação com `lockCompany` | uma transação | Hub calado: 503 | `ALERT_RECIPIENT_ADDED` e `_REMOVED` (info, `companyId`, nunca o endereço) | 113 |
| `ended` com a leitura da rodada anterior (U12) | só quem segura a concessão grava (`held`), como hoje | a transação da rodada é a de hoje; o aviso vai depois do commit | — | `COPY_RUN_ENDED` de hoje | 116, 117 |
| `copyFailed`: os `insert` em `copy_notice` e os e-mails (U12) | a chave única (`run_id`, `person_id`) e `on conflict do nothing`: uma notificação por pessoa e rodada | uma notificação gravada e outra não: cada uma na sua transação; a rodada não muda | provedor de e-mail calado ou recusando: a notificação fica | `COPY_NOTICE_CREATED` (info); `COPY_NOTICE_FAILED` (error); `COPY_MAIL_FAILED` (error, sem o endereço) | 116, 119 |
| A migração da regra de `system_code` (U12) | a segunda implantação recebe `LOCK_BUSY` e tenta de novo (`apps/server/src/platform/migrate.ts`) | uma transação | Hub calado: a implantação para antes de servir | o de hoje | 121 |
| A migração dos índices de `data.data_read` (U1, U8) | como acima | como acima | como acima | o de hoje | 70 |

## A tabela de referência

Uma linha por peça do roteiro de uso. "Como as referências fazem" diz o que fazem a plataforma de
ingestão, a de catálogo e a de operações, um banco de grafos aberto e duas ferramentas internas
abertas, sem nomeá-las; a citação literal fica no relatório do firstmate, fora do repositório (L21).
Onde a peça destoa das referências ou não tem referência, a coluna Decisão nomeia a decisão do fundador
ou a tela aprovada que a traz (L28).

| Peça | Unidade | Hoje no main | Como as referências fazem | Veredito | Prova, se não for nativo | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A leitura de tabela e a consulta deixam uma linha (`SAMPLE`, `QUERY`) | U1 | `createCompanyData` em `apps/server/src/hub/data/public.ts:33-38`; `sourcesFor(deps, scope, _context)` ignora o contexto (`:56`); nenhum `insert` em `data.data_read` | A de ingestão grava uma linha por pedido de token, com o SQL e sem a resposta (visto); a de catálogo guarda o texto, quem rodou, em nome de quem e quantas linhas, nunca as linhas (documentado); uma ferramenta interna aberta grava uma linha por execução, num ponto só (lido) | embrulhado: a tabela nossa, gravada num embrulho do `read` do contrato; nenhuma biblioteca do stack registra acesso a dado | o rastro do Mastra guarda a saída das ferramentas e expira em 14 dias (`apps/server/src/builder/conversation/storage.ts:5`; a saída no span, lida na 1.82 pelo estudo, relay); o banco da empresa não registra o texto das consultas e não tem extensão de auditoria (documentado) | E4a; spec parte 4, requisito 6 | `apps/server/src/hub/data/record.ts` |
| Uma linha por leitura, gravada depois de ler e antes de devolver | U1 | — | As referências gravam uma linha por pedido; a ferramenta interna aberta grava depois de rodar (lido); um cofre aberto grava por fila, com `on conflict do nothing` (lido) | nativo (`insert` do Drizzle por `database.command`, como `connector_write`, `apps/server/src/hub/connectors/write-record.ts:156-177`) | — | decisão do firstmate R.1 | — |
| A recusa deixa uma linha | U1, U2, U3 | só log: `DATA_READ_REFUSED` (`apps/server/src/hub/data/query.ts:52`) e `CONNECTOR_READ_REFUSED` (`apps/server/src/hub/connectors/read.ts:153`) | A de ingestão grava a consulta fora do escopo como linha de erro (visto); o banco de grafos registra a decisão negada só no log (lido) | embrulhado | — | spec parte 4, requisito 6 | — |
| A leitura ao vivo deixa uma linha (`LIVE`) | U2 | `readThrough` em `apps/server/src/hub/connectors/read.ts:139`, só o log `CONNECTOR_CALLED` (`:203`); chamadores `app-calls.ts:108`, `assistant-port.ts:318`, `builder-port.ts:276`, `copy-port.ts:121` (fica fora), `notes.ts:127` | A de ingestão: o pedido de uma ferramenta ao vivo é uma linha (visto) | embrulhado: a porta atrasada `recordRead`, como `copies: () => ConnectionCopies` (`apps/server/src/hub/connectors/rows.ts:56`), porque `hub/connectors` não importa `hub/data` | — | spec parte 4, requisito 6.3 e 6.7 | — |
| A leitura do esquema do app pelo Construtor e pelo agente | U2 | `readAppData` (`apps/server/src/hub/apps/app-database.ts:228`), log `APP_DATA_READ` sem SQL (`:242-260`); chamada por `builder-data.ts:49` e `apps/public.ts:100`; e por `app-tables.ts:73` e `:157`, que ficam fora | A de ingestão: todo `execute_sql` vira linha (visto) | embrulhado: a mesma gravação, verbo `QUERY` | — | requisito 6 | — |
| O plano lê só `sync`; a função e o tipo que leem por nome são recusados | U3 | `syncRelations` filtra só `sync` e não recusa o resto (`apps/server/src/hub/data/query.ts:26-37`); o `EXPLAIN (VERBOSE, FORMAT JSON)` já roda junto (`:140`) | A de ingestão esconde as tabelas de fora do escopo e dá SQL; a de catálogo mostra o nome sem o dado (documentado). A recusa de função não tem referência; o analisador de SQL que o Hub já usa é o de um servidor MCP de banco aberto (`libpg-query`, `docs/reference/stack.md`, data D6) | embrulhado: o plano do PostgreSQL e o `libpg-query` | os critérios 16 a 19 | a sua 4(b) (quadro, 2026-11-16, "Sim") | `apps/server/src/hub/data/plan.ts` |
| O `EXECUTE` das funções que leem por texto | U4 | nenhum `REVOKE` de função em `apps/server/src/platform/copy-sql.ts` | Sem referência; o PostgreSQL dá `EXECUTE` a `PUBLIC` por padrão | nativo (`REVOKE EXECUTE ... FROM PUBLIC`) | a prova no ramo de teste (critério 32); se o dono das funções no serviço não for o login dono, não cabe | U4 do estudo único; L28 | `apps/server/src/platform/copy-functions.test.ts` |
| A conversa num Projeto lê com o papel | U5 | no Projeto, as tabelas são só as liberadas (`apps/server/src/hub/copies/access-source.ts:10-11`); a consulta lê como o Projeto (`apps/server/src/hub/data/query.ts:57-76`, `:143-145`); a página lê com `{ kind: 'ALL' }` (`apps/server/src/hub/data/rows.ts:18-20`) | A de catálogo: a conversa avalia o dado com o usuário final (documentado); os apps dela no modo do usuário (documentado) | nativo: o login do papel (`apps/server/src/platform/copy-reader.ts:26`) e o cruzamento com `copiesReadBy` | — | a sua C(b); F1 desta página | `apps/server/src/hub/data/place-role.test.ts` |
| `live` e `funnel` ligados no contrato | U6 | `NOT_GRANTED` fixo (`apps/server/src/hub/data/public.ts:60`, `:62`); a porta do Assistente lê e escreve (`apps/server/src/hub/connectors/assistant-port.ts:307-336`) | O banco de grafos faz cada ferramenta chamar o mesmo handler da rota e testa a igualdade (lido) | nativo: a porta que já existe, desenhada na spec parte 3, 6.2 (`docs/steps/trilhas/dados-spec/03-leitura-para-analise/tasks.md:666-720`) | — | R3 "A" | `live.ts`, `funnel.ts` |
| As leis contra a implementação real | U7 | `runDataConformance` (`packages/hub-api/src/company-data-conformance.ts:316`), `make` síncrono, só contra o mundo falso (`company-data.test.ts:211`); a porta já tem as leis (a), (b) e (e) contra o banco de teste (`apps/server/src/hub/access/conformance.test.ts`) | O banco de grafos tem o teste de paridade entre as duas portas (lido); as plataformas não têm (procurado) | embrulhado: `node:test` e as nossas leis | — | spec parte 3, grupos 5 e 6 | `apps/server/src/hub/data/conformance.test.ts` |
| Nenhum caminho novo fora do contrato | U7 | 30 nomes em `.dependency-cruiser-migration.cjs` e `packages/app/src/connectors.ts`; a regra em `.dependency-cruiser.cjs:69` | nenhuma faz | nativo: `dependency-cruiser` e um teste que impede a lista de crescer | — | spec parte 3, 6.1 | — |
| Quem vê o Registro: cada pessoa as suas, Dono e Administrador todas | U8 | nenhuma rota; `readsAll` (`packages/hub-api/src/roles.ts:36`); `seeData` aberto a todo membro (`apps/server/src/hub/identity/admission.ts:104`) | A de ingestão: dono e admin veem tudo, o membro vê as linhas dos tokens que criou (documentado) | nativo: a admissão de hoje e o recorte na consulta | — | E4a emendada ("3. Sim", 2026-11-15) | `apps/server/src/hub/data/reads.ts` |
| A página por chave, da mais nova | U8 | `pageOf`, `pageKey` e `after` (`apps/server/src/platform/pages.ts:12`, `:30`, `:47`), só crescente; o cursor composto de `apps/server/src/builder/automations/runs.ts:37-49` | — | nativo: a chave (hora, id) do PostgreSQL, com o índice | — | — | — |
| A página: lista de 50, filtros, linha aberta, exportar | U9 | nenhuma; `FramedTable` (`apps/web/src/ui/table.tsx:70`), `Pager` (`ui/pager.tsx:9`), `Empty` (`ui/states.tsx:125`); a seção por `staticData.section` (`settings/route.tsx:30-45`) | A de ingestão: filtros por token, status e data, detalhe com o SQL, exportar (visto) | nativo: as peças de `apps/web/src/ui/` | — | telas `p4-04` a `p4-06`; o protótipo do Membro, pendente | `apps/web/src/hub/data/data-reads.tsx` |
| O CSV | U9 | nenhum; o único download é por `Blob` (`apps/web/src/builder/conversation/shown-file.tsx:39-48`) | A de ingestão exporta arquivo (documentado) | nativo: `Blob` e `<a download>` | o critério 80 (fórmula desarmada) | — | `apps/web/src/hub/data/csv.ts` |
| A consulta do app publicado | U10 | `db.query` numa transação só de leitura (`apps/edge/src/db.ts:49-61`); `DbProps` sem pessoa (`:10`); a pessoa e o Projeto estão em `call.caller` (`apps/edge/src/dispatch.ts:145-160`) | As duas plataformas registram a leitura de um app no próprio portão, que está no caminho (documentado); aqui o Hub não está no caminho | embrulhado: uma operação nova da borda ao Hub, pela porta que já existe (`apps/edge/src/hub.ts`, `access: 'edge'`), com o id da borda | os critérios 100 a 104 | a sua A(b); 3(d); a decisão D do estudo (uma linha por consulta, sem a lista de tabelas) | `apps/server/src/hub/apps/read-notice.ts` |
| Seguir uma cópia e a lista da empresa | U11 | tabelas e permissões no `main` (`apps/server/migrations/20261115191116_copy_alerts`, `20261115223016_copy_alerts_grants`; `apps/server/database-grants.sql:444-447`); nenhuma rota | A de ingestão: cada pessoa liga o aviso das fontes que segue; dono e admin têm a lista da empresa (documentado) | nativo: o módulo de notificações (`apps/server/src/hub/notifications/`) | — | spec 3, item (b), requisitos 5 e 6; F2 | `apps/server/src/hub/notifications/copy-alerts.ts` |
| O aviso na primeira falha | U12 | `ended` (`apps/server/src/hub/copies/run.ts:116-165`) não lê a rodada anterior; o aviso da automação (`apps/server/src/hub/notifications/notifications.ts:306`) | A de ingestão avisa toda falha e não avisa a volta (documentado); a de catálogo cala até a última tentativa (relay) | embrulhado: um tipo novo no sino e no e-mail | — | spec 3, item (b), requisito 4; `v06` | `apps/server/src/hub/notifications/copy-email.tsx` |
| As telas de Seguir e Avisos | U13 | nenhuma seção Avisos; `RunNowButton` em `apps/web/src/hub/copies/copy-list.tsx:111`; o sino em `apps/web/src/hub/notifications/bell.tsx:66`, `:82` | — | nativo: as peças de `ui/` | — | `v06`, `b3` a `b5`; o protótipo do Membro (F2 (a)), pendente | `apps/web/src/hub/notifications/copy-alerts.tsx` |
| A Amostra de uma pessoa na página Dados | fica de fora | `sampleCopy` não passa pelo contrato | As referências divergem | nativo: fica como hoje, fora do Registro | — | a sua B(a) | — |
| A aba Leituras de uma tabela | fica de fora | nenhuma | nenhuma faz por tabela | nativo: o filtro por tabela do Registro (U9) responde | — | corte do estudo | — |

**A medida do transplante.** Nenhuma parte vem do repositório antigo: o `git grep` de
`audit|data_read|read_log|access_log` no commit `e0353c36` não achou registro de leitura.

**A dívida.** O desenho de duas linhas por ato (intenção e desfecho) do estudo único fica para quando
uma escrita passar pela porta com custo (a marca `metered`): ali a intenção antes do efeito vale. Vai
para a seção 11 da arquitetura no fechamento.

## As decisões do firstmate

| # | Decisão reversível ([delivery L6](../guides/delivery.md)) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| R.1 | Uma linha por leitura, gravada depois de ler e antes de devolver, no lugar do par `ISSUED` e `SETTLED` do estudo único (seção 4.4 dele) | O banco da empresa responde por um pedido HTTP por transação (`neonTransport`, `apps/server/src/platform/company-postgres.ts:106`, decisão 0043): o `EXPLAIN` e a consulta vão juntos, e não há como gravar a intenção entre os dois. As referências gravam uma linha por pedido. A garantia aprovada ("nunca uma leitura sem linha") fica | Uma coluna `state` e uma segunda linha antes da leitura |
| R.2 | Sem tipo `Permit` no leitor e no executor nesta etapa: a gravação tem um dono só (regra do `dependency-cruiser`, critério 9) e a lei "toda leitura deixa uma linha" (critério 52) | O `Permit` comprava a intenção antes do efeito (R.1); para a escrita, o funil já grava antes de mandar (`register`, `write-record.ts:219`) e confere o papel de novo | O tipo `Permit` com a marca privada, como `Principal` |
| R.3 | A recusa do plano (U3) é uma lista de recusa (`query_to_*`, `cursor_to_*`, `table_to_*`, `schema_to_*`, `database_to_*`, `pg_*`, `to_reg*`, `has_*_privilege`, `current_setting`, `set_config`, e o tipo `reg*`) mais "o plano lê só `sync`", não uma lista de funções permitidas | Uma lista de permitidas recusaria o SQL comum que o modelo escreve (`date_trunc`, `sum`, `coalesce`) sem referência que a sustente; a barreira do motor é o login do papel (critério 5 de Cada papel) e a U4 | Trocar por uma lista de permitidas em `plan.ts` |
| R.4 | A linha da consulta do app não leva a lista de tabelas | A borda não sabe que tabelas a consulta leu, e um `EXPLAIN` por consulta dobraria o custo do app (estudo, decisão D) | Um `EXPLAIN` antes no Hub |
| R.5 | A hora da linha é a do Hub (`statement_timestamp()`), também no aviso da borda | `connector_write` faz igual (`write-record.ts:156-177`); uma linha da borda chega no máximo alguns segundos depois | Mandar a hora da borda no corpo |
| R.6 | O agente da linha sai do lugar e da versão (`contextOf`, `apps/server/src/hub/data/public.ts:41-54`), e `ReadBy` (`:14-18`) sai; o contexto passa só a conversa e, no agente salvo, o id dele | Um dono só do consumidor (C26): a porta já resolve assistente, construtor e agente do escopo | Um campo `agent` no contexto |
| R.7 | `DataContext` deixa de ser opcional em `createCompanyData`: o compilador acha os três chamadores | A spec o deixava opcional (`design.md` da parte 4, `C6`); sem a conversa, "Abrir a conversa" não existe | Voltar ao opcional, com a linha sem conversa |
| R.8 | O Membro que pede `person=<outra pessoa>` recebe a página vazia, não um 404 | A página vazia não diz se a pessoa existe nem se leu algo; um 404 por filtro diria | Responder 404 `NOT_FOUND` |
| R.9 | `next` é só o id da última linha, e a consulta busca a hora dela | `PageToken` tem no máximo 64 caracteres (`apps/server/src/platform/pages.ts`); hora e id juntos passariam | Um token de hora e id |
| R.10 | O CSV é montado na tela, a partir do JSON de `exportDataReads` | O contrato só serve JSON (`packages/hub-api/src/operation.ts:15-34`) | Uma rota de arquivo |
| R.11 | Os índices novos de `data.data_read`: (empresa, hora desc, id desc) e (empresa, pessoa, hora desc, id desc), numa migração da U8; o de hoje, (empresa, hora), sai na mesma migração | A página e o recorte por pessoa leem por eles; o de hoje fica coberto pelo primeiro | Manter o de hoje |
| R.12 | A U12 toma a 1135: `systemOf` corta `system_code` em 100 caracteres e a regra `copy_run_system_code` entra | O aviso lê as colunas da rodada; a 1135 tem o rótulo `next-card` e pede exatamente isso | Tirar a regra numa migração |
| R.13 | Quem segue e quem é avisado saem da porta `hub/access` (a lista de tabelas da pessoa), não de `readCopies` | code C81: toda lista de dado sai da porta; `readCopies` hoje é o mesmo `statement` de `manageCopies` (`admission.ts:100-101`), que só Dono e Administrador têm | Voltar a `readCopies`, se o fundador mudar a F2 para (b) |
| R.14 | O aviso da borda vai por `ctx.waitUntil` do `Db` (`apps/edge/src/dispatcher.ts:26`), com uma nova tentativa | O app não espera o Registro (critério 103); o Worker continua até o aviso terminar | Esperar o aviso antes de responder |

## U1 O gravador e o contrato

**Base e modelo.** O `main` em `f4ccc150`. Opus: muda o contrato de `hub/data` que três agentes de
outra trilha chamam, e fixa a ordem entre o banco da empresa e o do Hub.

### As linhas da tabela

- **O contrato de hoje.** `createCompanyData` e `sourcesFor` (`apps/server/src/hub/data/public.ts:33-38`,
  `:56-64`); `ReadBy`, `TurnBinding` e `DataContext` (`:14-30`); `contextOf` (`:41-54`). O contrato
  `companyData`, `read` e `act` (`packages/hub-api/src/company-data.ts:312-349`); `ReadAnswer`
  (`:124-160`); `QueryPage.used` (`:209-219`); `queried` (`:290-310`).
- **A tabela.** `dataRead` e as regras (`apps/server/src/hub/data/tables.ts:35-79`): `data_read_live`,
  `data_read_query` (consulta só em `QUERY`, até 4.000), `data_read_counts`; a política por empresa
  (`:77`); `SELECT, INSERT` para `hub_company` (`apps/server/database-grants.sql:437`).
- **O molde.** O `insert` de `connector_write` por `database.command`, com `statement_timestamp()`
  (`apps/server/src/hub/connectors/write-record.ts:156-177`) e o seu teste de tabela
  (`apps/server/src/hub/connectors/connector-write-table.test.ts`).
- **A conversa.** `MASTRA_THREAD_ID_KEY` (`@mastra/core@1.83.0`, `dist/request-context/index.d.ts:1`,
  `"mastra__threadId"` em `dist/request-context-COnZHt2-.js:27`), já lida em
  `apps/server/src/builder/agents/tools.ts:204`. Os três `dataOf`: `builderDataOf`
  (`apps/server/src/builder/conversation/builder.ts:72-87`), `dataOfScope`
  (`apps/server/src/builder/assistant/assistant.ts:184-188`) e o do agente
  (`apps/server/src/builder/agents/agent.ts:273`). `DataOf` (`apps/server/src/builder/data-tools/tools.ts:10`).
  `reachedBy` (`apps/server/src/builder/assistant/overview.ts:98-100`) só descreve.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/data/` (`record.ts` novo, `record.test.ts` novo, `public.ts`, `deps.ts`, `tables.ts`, `data.test.ts`) | Cria o gravador; muda o contrato vinculado | `main.ts`; `builder/` pelos três `dataOf` |
| `apps/server/migrations/` | Cria nenhuma nesta unidade (os índices são da U8) | — |
| `apps/server/src/builder/data-tools/` (`tools.ts`, `public.ts`) | Muda: exporta `threadOf(requestContext)` | os três `dataOf` |
| `apps/server/src/builder/assistant/assistant.ts`, `conversation/builder.ts`, `agents/agent.ts` | Muda uma linha cada: passam o contexto | — |
| `.dependency-cruiser.cjs` | Cria a regra `data-read-only-through-the-recorder` | `npm run deps` |
| `scripts/rules-doors.test.ts`, `scripts/rerun-never.json` | Muda: o caso da regra; `record.test.ts` em `files` | `scripts/rerun-exempt.test.ts` |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/data/record.ts
export const DataReadId = z.uuid().brand('DataReadId')          // feito por quem grava (C23)
export type DataReadId = z.infer<typeof DataReadId>
type Who = Readonly<{
  id: DataReadId
  companyId: CompanyId
  personId: PersonId
  agent: (typeof DATA_READ_AGENTS)[number]                       // dono: tables.ts:83
  projectId: ProjectId | null
  agentId: AgentId | null
  threadId: ConversationId | null
}>
/** One read, as the row keeps it: names, the query, the outcome, the count and the time; never a cell. */
export type ReadEntry = Who &
  Readonly<
    | { verb: 'SAMPLE'; tables: readonly [string]; query: null; connectionId: null; operation: null }
    | { verb: 'QUERY'; tables: readonly string[]; query: string; connectionId: null; operation: null }
    | { verb: 'LIVE'; tables: readonly []; query: null; connectionId: ConnectionId; operation: OperationId }
  > &
  Readonly<{ outcome: string; rows: number | null; ms: number }>   // outcome: o `kind` da resposta
export type Recorded = 'RECORDED' | 'UNRECORDED'
export type RecordRead = (entry: ReadEntry) => Promise<Recorded>
/** The one writer of data.data_read: one insert in the Hub's database, never in the caller's transaction. */
export function recordReadOf(deps: Pick<DataDeps, 'database' | 'log'>): RecordRead

// apps/server/src/hub/data/public.ts
export type DataContext = Readonly<{
  thread: ConversationId | null                                  // de requestContext[MASTRA_THREAD_ID_KEY]
  agentId?: AgentId                                              // só o agente salvo
  turn?: TurnBinding                                             // a U6 lê
}>
export function createCompanyData(deps: DataDeps): (scope: SessionScope, context: DataContext) => CompanyData
export const recordRead: (deps: DataDeps) => RecordRead          // a porta que main.ts entrega a hub/connectors e hub/apps (U2)
// sai: ReadBy

// apps/server/src/builder/data-tools/tools.ts
export function threadOf(requestContext: RequestContext | undefined): ConversationId | null
```

- **Cada estado.** `ReadEntry` separa por `verb`, a mesma divisão das regras do banco (C21, C22).
- **Cada id.** `DataReadId` nasce em `recordReadOf` (`randomUUID`) e é conferido pelo esquema na U10.
- **O dono de cada fato.** Os agentes e os verbos: `DATA_READ_AGENTS` e `DATA_READ_VERBS`
  (`tables.ts:83-84`); o limite da consulta: `DATA_READ_QUERY_MAX` (`tables.ts:85`), igual a
  `QUERY_SQL_MAX`; o mapeamento consumidor → agente: uma tabela `Record<Consumer, Agent>` em `record.ts`.
- **O arquivo modelo.** `write-record.ts` para o `insert` (cumpre C21 e C26); não é modelo para a falha
  engolida (`:333-343`), que aqui fecha a leitura.

### As skills e a leitura

`docs/reference/stack.md`, linhas de `apps/server/src` e `apps/server/src/builder`: `fastify-best-practices`,
`mastra` (ler `node_modules/@mastra/core/dist/docs/` primeiro), `drizzle` (de
`node_modules/drizzle-kit/skills/`), `pstack:typescript-best-practices`. O guia de dados (D15, D18, D22).

### A ordem do trabalho

1. **O gravador.** Critérios: 1, 4, 6, 10.
   - **Arquivos:** cria `record.ts` e `record.test.ts`; muda `deps.ts`.
   - **Referência a seguir:** `write-record.ts:156-177` (o `insert` com `statement_timestamp()`).
   - **O que entra:** `recordReadOf` faz `deps.database.command(companyScope, tx => tx.insert(dataRead).values(...))`; uma `Failure` do banco vira `UNRECORDED` com `DATA_READ_UNRECORDED`; nenhum outro erro é engolido. Regras: D22 (fora da transação do chamador), S40.
   - **Testes:** `record.test.ts`, por `createTestHub` e o contrato vinculado (T5).
   - **Mutações à mão:** tire o `insert` (o critério 1 fica vermelho); grave `rows` como o número pedido e não o devolvido (critério 1).
2. **O embrulho do contrato.** Critérios: 1 a 3, 5, 7, 8.
   - **Arquivos:** muda `public.ts`, `data.test.ts`.
   - **O que sai:** `ReadBy` e o `_context` ignorado; o `?` de `context`.
   - **O que entra:** `createCompanyData` devolve `recorded(companyData(...), entryOf)`: `read` mede o tempo, chama o contrato, monta a linha pelo `kind` (TABLE → `SAMPLE`; QUERY → `QUERY` com `tables` da resposta ou `[]`; OPERATION servida por tabela → `SAMPLE`; OPERATION recusada pelo catálogo → `LIVE`; a OPERATION que chega ao sistema é gravada por `readThrough`, U2), grava e só então devolve; `UNRECORDED` troca a resposta por `TABLE_UNAVAILABLE`. `describe` e `act` passam sem gravar.
   - **Testes:** `record.test.ts`, critérios 1 a 8.
   - **Mutações à mão:** devolva antes de gravar (critério 5); grave também a OPERATION que chegou ao sistema (critério 7, duas linhas).
3. **A conversa nos três agentes.** Critérios: 1, 8.
   - **Arquivos:** muda `data-tools/tools.ts`, `data-tools/public.ts`, `assistant.ts`, `builder.ts`, `agent.ts`.
   - **O que entra:** `threadOf` lê `MASTRA_THREAD_ID_KEY` por `ConversationId.safeParse`; cada `dataOf` passa `{ thread: threadOf(requestContext) }`, e o do agente também `agentId`. `reachedBy` passa `{ thread: null }` (só descreve).
   - **Pronto quando:** `npm run typecheck` acha os três e mais nenhum.
4. **A regra do gravador.** Critério: 9.
   - **Arquivos:** muda `.dependency-cruiser.cjs`, `scripts/rules-doors.test.ts`.
   - **Referência a seguir:** a regra `describe-lists-only-through-access` (`.dependency-cruiser.cjs:91`) e o diretório plantado de `scripts/rules-doors.test.ts`.
   - **Mutações à mão:** tire o `pathNot` de `record.ts` (o caso fica vermelho porque `record.ts` mesmo é recusado).

### Como se prova

Os critérios 1 a 10 tocam o banco de teste do Hub e o mundo de cópias de hoje (`rolesWorld`,
`apps/server/src/hub/copies/test-readers.ts:58`). Hoje `data.data_read` fica vazia depois de qualquer
leitura: os critérios 1 a 3 falham no `main`.

### Parar se

- O `insert` precisar de uma permissão além de `SELECT, INSERT`: para e reporta (data D11).
- Um quarto chamador de `createCompanyData` aparecer no `typecheck`: para e reporta, com o arquivo.

## U2 A leitura ao vivo e o esquema do app

**Base e modelo.** A U1. Sonnet.

### As linhas da tabela

- `readThrough` (`apps/server/src/hub/connectors/read.ts:139`), `ReadRequest` (`:19-32`, `by` sem `AGENT`),
  a recusa do papel (`:148-155`), o comentário D22 (`:132-136`) e `CONNECTOR_CALLED` (`:187-203`); a porta
  atrasada `copies` (`rows.ts:56`) e a sua ligação em `apps/server/src/main.ts`.
- `readAppData` (`apps/server/src/hub/apps/app-database.ts:228-260`); `builder-data.ts:46-50`;
  `apps/server/src/hub/apps/public.ts:100`; a ferramenta `app_data_read` (`apps/server/src/builder/app-data/tools.ts:65-86`, `:108-117`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/connectors/` (`read.ts`, `rows.ts`, `public.ts`, `read-record.test.ts` novo) | Muda: `Deps.recordRead` atrasado; a linha `LIVE` | os cinco chamadores de `readThrough` |
| `apps/server/src/hub/apps/` (`builder-data.ts`, `public.ts`, `app-data-record.test.ts` novo) | Muda: a leitura do esquema grava | `conversations-of.ts:93`, a ferramenta |
| `apps/server/src/builder/app-data/tools.ts` | Muda: passa a conversa | — |
| `apps/server/src/main.ts` | Muda: entrega `recordRead(deps)` às duas portas | — |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/connectors/rows.ts (Deps)
recordRead: () => RecordRead                       // tarde, como copies
// apps/server/src/hub/connectors/read.ts (ReadRequest)
thread?: ConversationId                            // a U6 passa; os outros chamadores não têm
// apps/server/src/hub/apps/public.ts e builder-data.ts
readAppData(input & { thread: ConversationId | null; agentId?: AgentId })
```

O agente da linha `LIVE`: `by: 'app'` → `APP`; `'builder'` → `BUILDER`; `'assistant'` com `speaker.kind`
`VERSION` → `AGENT`, senão `ASSISTANT`; `'copy'` não grava. Uma tabela `Record<ReadBy, ...>` em `read.ts`.

### As skills e a leitura

As da U1. O guia de dados (D22).

### A ordem do trabalho

1. **`LIVE` em `readThrough`.** Critérios: 11 a 14.
   - **O que entra:** depois da resposta do executor (e na recusa do papel, antes de chamar), `recordRead()(entry)`; `UNRECORDED` troca a resposta por `{ kind: 'UNREACHABLE' }`. Nenhuma conexão do banco aberta durante a chamada (D22).
   - **Mutações à mão:** grave também `by: 'copy'` (critério 12); devolva o valor com `UNRECORDED` (critério 14).
2. **`QUERY` do esquema do app.** Critério: 15.
   - **O que entra:** o embrulho fica nas duas portas que um agente usa (`builder-data.ts:49`, `apps/public.ts:100`), nunca em `readAppData`, que `app-tables.ts` também chama.
   - **Mutações à mão:** grave dentro de `readAppData` (o caso "a página Dados não entra" fica vermelho).

### Como se prova

O conector falso do kit e o mundo de teste das conexões de hoje (`apps/server/src/hub/connectors/testing.ts`).

### Parar se

- `notes.ts:127` passar um `by` que não cabe na tabela: para e reporta.

## U3 O plano lê só `sync`

**Base e modelo.** A U1. Sonnet.

### As linhas da tabela

- `PlanNode`, `syncRelations`, `relationsOf` (`apps/server/src/hub/data/query.ts:15-37`); o `EXPLAIN` no
  mesmo pedido (`:140`); `refused` e `DATA_READ_REFUSED` (`:51-54`); `rowsOfRead` (`:78-93`).
- O analisador `libpg-query` (`docs/reference/stack.md`, linha `libpg-query`: carregar com `loadModule()`
  antes do primeiro `parseSync`); o uso de hoje em `apps/server/src/platform/migration-rule.ts`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/data/` (`plan.ts` novo, `plan.test.ts` novo, `query.ts`) | Cria a regra do plano; muda `rowsOfRead` | `queryOf` |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/data/plan.ts
export type PlanVerdict = Readonly<
  | { kind: 'READS'; tables: readonly string[] }                     // só sync
  | { kind: 'OUTSIDE'; reason: 'SCHEMA' | 'FUNCTION' | 'REG_TYPE' }
>
export function planVerdict(sql: string, explained: ReadResult): PlanVerdict
export const REFUSED_FUNCTIONS: readonly RegExp[]                    // o dono da lista (decisão R.3)
```

`OUTSIDE` vira `NOT_IN_CATALOG` no contrato (a resposta de hoje para a tabela de fora,
`company-data.ts:298-299`), e a linha grava esse resultado.

### As skills e a leitura

As da U1, e a linha `libpg-query` de `docs/reference/stack.md`. O guia de dados (D20).

### A ordem do trabalho

1. **O plano e a consulta.** Critérios: 16 a 19.
   - **O que entra:** `planVerdict` lê toda relação do plano com `Schema` diferente de `sync` (`SCHEMA`), todo `FuncCall` do analisador cujo nome bate em `REFUSED_FUNCTIONS` (`FUNCTION`) e todo `TypeCast` para `reg*` (`REG_TYPE`). `rowsOfRead` o chama antes de montar as linhas.
   - **Mutações à mão:** tire `pg_*` da lista (critério 17 vermelho); aceite qualquer `Schema` (critério 16 vermelho).

### Como se prova

O banco de teste do Hub com o mundo de papéis; o ataque direto (T13) como Bruno.

### Parar se

- Uma consulta das gravações de hoje dos agentes (`npm run record`) cair na lista: para e reporta a
  consulta.

## G1 O ponto de conferência

Depois da U3: os testes tocados de `hub/data`, `hub/connectors`, `hub/apps`, `builder/data-tools`,
`builder/app-data` e `scripts/rules-doors.test.ts`; `npm run typecheck`, `npm run deps`, `npm run check`;
o Hub local com os dublês: uma pergunta ao Assistente e a linha em `data.data_read` lida com `psql`.

## U4 `EXECUTE` das funções que leem por texto

**Base e modelo.** A U3 mesclada. Sonnet.

### As linhas da tabela

- `ensureSync` e `ROLES_LOCK` (`apps/server/src/platform/copy-sql.ts:117`, `:150`); o teste do ataque
  direto de hoje (`apps/server/src/platform/copy-role-readers.test.ts`, o caso de `query_to_xml`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/copy-sql.ts`, `copy-functions.test.ts` novo | Muda: o bloco `DO` do `REVOKE` em `ensureSync` | toda rodada e todo `ensureReader` |

### Os contratos que a unidade cria

Nenhum tipo novo. O bloco `DO` percorre `pg_proc` por nome e assinatura exatos (data D13) e roda
`REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC` para as cinco famílias `*_to_xml`, `*_to_xmlschema` e
`*_to_xml_and_xmlschema`.

### As skills e a leitura

`neon:neon-postgres` (a linha `@neondatabase/serverless`). O guia de dados (D10, D13).

### A ordem do trabalho

1. **O `REVOKE`.** Critérios: 30, 31.
   - **Mutações à mão:** tire uma das famílias (critério 30 vermelho).
2. **A prova no ramo de teste.** Critério: 32. Só com a autorização do fundador, escrita no pull request.

### Como se prova

O PostgreSQL de teste local (o mesmo da CI) e o ramo de teste autorizado.

### Parar se

- O ramo de teste responder `42501` ao `REVOKE` (o dono das funções é do serviço): a U4 sai, o pull
  request fecha sem mesclar e a página o diz no fechamento.

## G2 O ponto de conferência

`copy-functions.test.ts`, `copy-role-readers.test.ts` e os testes de `hub/data`; `npm run check`; o
resultado do ramo de teste no corpo do pull request. Mescla só com a palavra do fundador.

## U5 A conversa num Projeto com o papel

**Base e modelo.** O G1 mesclado. Sonnet.

### As linhas da tabela

- `accessTables` (`apps/server/src/hub/copies/access-source.ts:7-21`); `copiesReadBy` (`readers.ts`).
- `queryOf` e `projectRead` (`apps/server/src/hub/data/query.ts:57-76`, `:116-150`); `rowsOf`
  (`apps/server/src/hub/data/rows.ts:11-36`); `readers.readAs` e `readerOf`.
- A leitura do app pelo login do Projeto (`apps/server/src/hub/apps/handoff.ts:281`), que fica.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/copies/access-source.ts` | Muda: no Projeto, liberadas ∩ papel, para todo consumidor, o `builder` incluído (F1 (a)) | a porta `hub/access` |
| `apps/server/src/hub/data/` (`query.ts`, `rows.ts`, `place-role.test.ts` novo) | Muda: no Projeto, o login do papel; sai `projectRead` (F1 (a)) | o contrato |
| `apps/server/src/hub/apps/app-read-place.test.ts` novo | Cria | — |

### Os contratos que a unidade cria

Nenhum. `AccessSources.tables` (`apps/server/src/hub/access/model.ts:45`) não muda: com a F1 (a), o
consumidor não entra no cruzamento.

### As skills e a leitura

As da U1. O guia de dados (D22).

### A ordem do trabalho

1. **O catálogo do lugar.** Critérios: 40, 43.
   - **Mutações à mão:** devolva só as liberadas (critério 40 vermelho).
2. **A leitura pelo papel.** Critérios: 41, 42, 44.
   - **O que sai:** `projectRead` e o ramo `PROJECT` de `queryOf` e `rowsOf` (F1 (a)).
   - **Mutações à mão:** leia com `{ kind: 'ALL' }` em `rowsOf` (critério 41 vermelho).

### Como se prova

O mundo de papéis com um Projeto que recebeu as duas cópias (`plantedBy`, `apps/server/src/hub/copies/test-sources.ts:215`).

### Parar se

- O login do papel não existir para quem conversa num Projeto (`NO_LOGIN`) e o conserto de hoje não o
  criar: para e reporta.

## U6 `live` e `funnel` ligados (a H2a)

**Base e modelo.** A U5. Opus: a ordem de turno, aprovação e idempotência entre dois módulos.

### As linhas da tabela

- O desenho da spec parte 3, 6.2 (`docs/steps/trilhas/dados-spec/03-leitura-para-analise/tasks.md:666-720`).
- `AssistantConnectors.read` e `write` (`apps/server/src/hub/connectors/assistant-port.ts:307-336`);
  `WriteRequest` e `Written` (`write-record.ts:32-62`); `register` (`:219`), `finish` (`:311`); `writeThrough`
  (`write.ts:158`); `mustAsk` (`approval.ts:101`).
- `TurnKey` (`apps/server/src/hub/connectors/scope.ts:23`); `TurnBinding` (`apps/server/src/hub/data/public.ts:20-28`).
- `DataSources.live` e `funnel` (`packages/hub-api/src/company-data.ts:228`, `:232`); `ActAnswer` (`:175-183`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/data/` (`live.ts`, `funnel.ts`, `live.test.ts`, `funnel.test.ts` novos; `public.ts`, `deps.ts`, `data.test.ts`) | Cria e muda | o contrato |
| `apps/server/src/hub/connectors/` (`assistant-port.ts`, `public.ts`) | Muda: a leitura leva a conversa até `readThrough` | `hub/data` pela porta pública |
| `apps/server/src/main.ts` | Muda: `DataDeps.connectors` | — |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/data/public.ts
type TurnBinding = Readonly<{ turn: TurnKey; approvedBy?: PersonId }> & (PersonTurn | VersionTurn)  // + approvedBy
// apps/server/src/hub/data/deps.ts
connectors: () => Pick<Connectors, 'assistant'>
// apps/server/src/hub/data/live.ts
export function liveOf(deps: DataDeps, scope: SessionScope, bound: Readonly<{ turn: TurnBinding; thread: ConversationId | null }>,
  a: Signal & OperationRead): Promise<LiveAnswer>
// apps/server/src/hub/data/funnel.ts
export function funnelOf(deps: DataDeps, scope: SessionScope, turn: TurnBinding,
  a: Signal & ActRequest): Promise<Exclude<ActAnswer, { kind: 'NOT_IN_CATALOG' | 'CATALOG_UNAVAILABLE' }>>
```

O mapeamento de cada `kind` de `Written` e da leitura ao vivo para o contrato é um `switch` exaustivo
(`satisfies never`), e `since` sai em ISO.

### As skills e a leitura

As da U1. O guia de testes (T26: a leitura ao vivo e a escrita pelo conector falso já gravado).

### A ordem do trabalho

1. **`liveOf`.** Critérios: 45, 46, 50. **Mutações à mão:** devolva `NOT_GRANTED` com turno (45 vermelho).
2. **`funnelOf`.** Critérios: 47 a 49. **Mutações à mão:** troque `call.toolCall` por um id novo (47 vermelho).

### Como se prova

O conector falso do kit e o mundo de conexões de hoje; nenhum consumidor de produção chama `live` nem
`act` nesta etapa (a H2b).

### Parar se

- `write` pedir um campo do turno que `TurnBinding` não tem: para e reporta, sem inventar.

## U7 A prova contra o banco de verdade

**Base e modelo.** A U6. Sonnet.

### As linhas da tabela

- `runDataConformance` e `LAWS` (`packages/hub-api/src/company-data-conformance.ts:265-316`); `DataWorld`
  (`company-data-world.ts`); o mundo falso (`company-data.test.ts:102-144`, `:211`).
- A spec parte 3, 5.1 e 6.1 (`03-leitura-para-analise/tasks.md:631-664`).
- A conformidade da porta (`apps/server/src/hub/access/conformance.test.ts`) e o mundo de papéis.
- A lista de migração (`.dependency-cruiser-migration.cjs`) e a regra (`.dependency-cruiser.cjs:69`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/` (`company-data-conformance.ts`, `company-data-world.ts`, `company-data.test.ts`) | Muda: `make(t)` assíncrono; `data?`, `reads()`, `failRecord()` no mundo; duas leis | os dois mundos |
| `apps/server/src/hub/data/` (`conformance.test.ts`, `test-world.ts` novos) | Cria o mundo real | — |
| `apps/server/src/hub/access/conformance.test.ts` | Muda: leis (c), (d), (f) | — |
| `scripts/rules-doors.test.ts` | Muda: a lista que não cresce | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/company-data-world.ts
export type DataWorld = Readonly<{
  sources: DataSources
  data?: CompanyData                                     // o contrato como a implementação o vincula
  reads(): Promise<readonly Readonly<Record<string, unknown>>[]>   // as linhas gravadas
  failRecord(): void
  /* ...os campos de hoje... */
}>
export function runDataConformance(name: string, make: (t: TestContext) => DataWorld | Promise<DataWorld>): void
```

### As skills e a leitura

As da U1; L27 (muda `packages/hub-api`, lido pela trilha Agentes e Apps).

### A ordem do trabalho

1. **O `make` assíncrono e o contrato vinculado.** Critério: 51.
2. **As duas leis e o mundo falso que grava.** Critérios: 52, 53.
3. **O mundo real nos dois lugares.** Critério: 54.
4. **As leis da porta.** Critérios: 55, 56.
5. **A lista que não cresce.** Critério: 57.
   - **Mutações à mão:** em cada passo, a mutação da spec (tire o `await` de `make(t)`; acrescente um nome à lista).

### Como se prova

`npm test -w @conexus/hub-api` e o servidor com o banco de teste.

### Parar se

- Uma das 22 leis de hoje não passar no mundo real: para e reporta a lei; nenhuma lei pula.

## G3 O ponto de conferência

Os testes de `hub/data`, `hub/copies`, `hub/access`, `hub/connectors`, `hub/apps` e de `packages/hub-api`;
`npm run deps` com a lista sem crescer; `npm run check`; o Hub local: Bruno num Projeto pergunta pelos
clientes e não acha.

## U8 As rotas do Registro

**Base e modelo.** O G1 mesclado. Sonnet.

### As linhas da tabela

- A spec parte 4, `C6`, as rotas (`docs/steps/trilhas/dados-spec/04-governanca-minima/design.md:296-400`).
- O molde de lista paginada: `listCompanyAppAccess` (`packages/hub-api/src/app-access.ts:147`), `Page` e
  `PAGE_SIZE` (`packages/hub-api/src/companies.ts:81-87`), `serve` (`apps/server/src/hub/projects/routes.ts:30`).
- `seenBy` (`apps/server/src/hub/copies/list.ts:147-150`): `admitMember('seeData')` e o ramo do papel;
  `readsAll` (`packages/hub-api/src/roles.ts:36`).
- `pages.ts` (`:12`, `:30`, `:47`) e o cursor composto (`apps/server/src/builder/automations/runs.ts:37-49`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/data-reads.ts` novo, `index.ts` | Cria o contrato | o servidor e a tela |
| `apps/server/src/hub/data/` (`reads.ts`, `routes.ts`, `reads.test.ts` novos; `public.ts`, `tables.ts`) | Cria as rotas; muda os índices | `main.ts` |
| `apps/server/migrations/` | Cria a migração dos índices | — |
| `apps/web/sweep-replies.ts` | Muda: as duas respostas | a varredura |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/data-reads.ts
export const DataReadEntry = z.object({
  id: z.uuid(), at: z.iso.datetime(), person: z.object({ id: PersonId, name: z.string() }),
  agent: z.enum(['ASSISTANT', 'BUILDER', 'AGENT', 'APP']),
  project: z.object({ id: ProjectId, name: z.string() }).nullable(),
  agentId: z.string().nullable(), threadId: ConversationId.nullable(),
  verb: z.enum(['SAMPLE', 'QUERY', 'LIVE']), tables: z.array(z.string()),
  connection: z.string().nullable(), operation: z.string().nullable(),
  query: z.string().nullable(), outcome: z.string(), rows: z.int().nullable(), ms: z.int(),
})                                                            // nenhum campo de linhas (critério 76)
export const REFUSED_OUTCOMES: readonly string[]             // o dono de "recusada" (C26)
const Filters = z.object({ person: PersonId.optional(), agent: ..., table: z.string().max(63).optional(),
  outcome: z.enum(['OK', 'REFUSED']).optional() })
export const listDataReads = defineOperation({ id: 'listDataReads', method: 'GET',
  path: '/api/companies/{companyId}/data-reads', input: { params: InCompany, query: Filters.extend({ page: PageToken.optional() }) },
  success: { status: 200, body: z.object({ reads: z.array(DataReadEntry), next: PageToken.nullable() }) },
  failures: ['NOT_FOUND', 'REQUEST_MALFORMED', 'DATABASE_UNAVAILABLE'] })
export const exportDataReads = defineOperation({ id: 'exportDataReads', method: 'GET',
  path: '/api/companies/{companyId}/data-reads/export', input: { params: InCompany, query: Filters },
  success: { status: 200, body: z.object({ reads: z.array(DataReadEntry).max(5000), complete: z.boolean() }) } })
```

O recorte: `readsAll(role)` lê tudo; os outros, `person_id = quem pede`, sempre, antes de qualquer
filtro. Os nomes: um lote de pessoas e um de Projetos por página.

### As skills e a leitura

`fastify-best-practices`, `drizzle`, `pstack:typescript-best-practices`. O guia de dados (D15, D19).

### A ordem do trabalho

1. **O contrato e a migração.** Critérios: 76.
2. **`reads.ts` e o recorte.** Critérios: 70 a 75. **Mutações à mão:** tire o recorte por pessoa (71
   vermelho); ordene só por hora (70 vermelho com duas linhas na mesma hora).

### Como se prova

O banco de teste do Hub com linhas gravadas por `recordReadOf` (U1), nunca por `insert` à mão no teste
de rota (T5).

### Parar se

- O nome da pessoa não sair num lote pela porta da identidade: para e reporta.

## U9 A página Registro de dados (`p4-04` a `p4-06`)

**Base e modelo.** A U8 e o protótipo julgado. Sonnet.

### As linhas da tabela

- A seção por `staticData.section` (`apps/web/src/routes/_app/companies/$companyId_/settings/route.tsx:30-45`)
  e a de Pessoas (`settings/people.tsx`); `FramedTable`, `Pager`, `Empty`, `Select`, `Sheet`, `CodeBlock`
  de `apps/web/src/ui/`; o download por `Blob` (`apps/web/src/builder/conversation/shown-file.tsx:39-48`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/routes/_app/companies/$companyId_/settings/data-reads.tsx` novo | Cria a rota | o índice de Configurações |
| `apps/web/src/hub/data/` novo (`data-reads.tsx`, `read-detail.tsx`, `queries.ts`, `csv.ts`, `text.ts`, `public.ts`) | Cria | a rota |
| `apps/web/sweep-data-reads-states.ts` novo; `docs/reference/screens.md` | Cria; muda 2 linhas | a varredura |

### Os contratos que a unidade cria

Nenhum do servidor. Os textos em `text.ts`, um dono (C26).

### As skills e a leitura

A linha `apps/web/src` de `docs/reference/stack.md`: `shadcn`, TanStack Router e Query, `impeccable`
(só os comandos que `docs/reference/impeccable.md` permite). O guia web.

### A ordem do trabalho

1. **A lista e os filtros.** Critérios: 77, 78, 81.
2. **A linha aberta.** Critério: 79.
3. **Exportar.** Critério: 80.
   - **Mutações à mão:** tire o apóstrofo do CSV (80 vermelho).
   - **Pronto quando:** a tela olhada a 1366 e 390 px nos dois temas bate com o protótipo julgado.

### Como se prova

A varredura de estados e os testes de navegador de hoje (`npm test -w @conexus/web`).

### Parar se

- A conversa de um `threadId` não tiver endereço conhecido para um agente: a linha mostra a conversa
  sem **Abrir a conversa**, e o pull request o diz.

## G4 O ponto de conferência

Os testes de `hub/data` e de `apps/web/src/hub/data`; `npm run check`; a QA começa depois deste e do G6.

## U10 A borda avisa o Hub

**Base e modelo.** O G1 mesclado. Opus: a borda e o Hub, com repetição e sem o app esperar.

### As linhas da tabela

- `dbOf` e `DbProps` (`apps/edge/src/db.ts:10`, `:35-77`); `Db` (`apps/edge/src/dispatcher.ts:26`);
  `toApp` (`apps/edge/src/dispatch.ts:145-160`); `hubOf` (`apps/edge/src/hub.ts`).
- `admitCall` (`apps/server/src/hub/apps/handoff.ts:140-193`); as rotas `access: 'edge'`
  (`apps/server/src/hub/apps/routes.ts:104-113`; `apps/server/src/platform/access.ts:116`).
- `recordReadOf` (U1).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/edge/src/` (`db.ts`, `dispatcher.ts`, `dispatch.ts`, `hub.ts`, `db.test.ts`) | Muda: `DbProps` com a sessão e o host; o aviso depois de `query` | os apps |
| `packages/hub-api/src/apps.ts` | Cria `recordAppRead` | a borda e o Hub |
| `apps/server/src/hub/apps/` (`read-notice.ts` novo, `routes.ts`, `public.ts`, `read-notice.test.ts` novo) | Cria a rota da borda | `main.ts` |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/apps.ts
export const recordAppRead = defineOperation({ id: 'recordAppRead', method: 'POST',
  path: '/edge/app-reads', access: 'edge',
  input: { body: z.object({ id: z.uuid(), query: z.string().max(4000), outcome: z.string().max(40),
    rows: z.int().nonnegative().nullable(), ms: z.int().nonnegative() }).strict() },   // sem pessoa nem Projeto
  success: { status: 204 } })
// apps/edge/src/db.ts
export type DbProps = Readonly<{ login; host; database; endsAt; session: AppSessionToken; label: string }>
```

A pessoa, a empresa e o Projeto saem de `admitCall` pela sessão (`X-Conexus-App-Session`); a linha é
`APP`, `QUERY`, `tables` vazio; o `insert` com `on conflict do nothing` pelo id.

### As skills e a leitura

`cloudflare:wrangler`, `cloudflare:workers-best-practices` (a linha `wrangler`); `neon:neon-postgres`.
Os guias de segurança (S8, S40) e de testes (T13).

### A ordem do trabalho

1. **A rota do Hub.** Critérios: 100, 101, 104, 105.
2. **A borda.** Critérios: 102, 103. **Mutações à mão:** espere o aviso antes de responder (103
   vermelho); mande o `projectId` no corpo (104 vermelho).

### Como se prova

O teste da borda com o Hub falso de hoje e o teste do Hub com a sessão de app de hoje.

### Parar se

- `admitCall` recusar o aviso logo depois do fim da sessão em mais de um caso de teste: para e reporta,
  sem estender a sessão.

## U11 Seguir e a lista da empresa

**Base e modelo.** O `main`. Sonnet.

### As linhas da tabela

- As tabelas `alert_recipient`, `copy_follower`, `copy_notice` (`apps/server/src/hub/notifications/tables.ts`)
  e as permissões (`apps/server/database-grants.sql:444-447`).
- A spec 3, item (b), requisitos 5 e 6, cujo texto é este: **Seguir** ao lado de **Rodar agora**,
  **Seguindo** depois, um toque deixa de seguir; ninguém segue por outro; o seguir sai com a pessoa e
  com a cópia; a lista da empresa com no máximo 20 endereços, sem repetir, "Pôr na lista", "Tirar
  {e-mail}" sem confirmação, "e-mail sem conta no Conexus" para quem não tem conta. As rotas são as do
  desenho dela, `C7`: `followCopy` e `unfollowCopy` (`PUT`, `DELETE` em `.../copies/{copyId}/follow`),
  `listCopyAlerts` (`GET .../copy-alerts`), `addAlertRecipient` e `removeAlertRecipient`
  (`POST .../copy-alerts/recipients`, `DELETE .../copy-alerts/recipients/{recipientId}`).
- A porta `hub/access` (`createAccess().viewOf`, `apps/server/src/hub/access/public.ts`) para "quem lê".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/` (`copy-alerts.ts` novo, `copies.ts`, `roles.ts`, `failures.ts`, `index.ts`) | Cria e muda | o servidor e a tela |
| `apps/server/src/hub/notifications/` (`copy-alerts.ts`, `copy-alerts.test.ts` novos; `routes.ts`, `public.ts`) | Cria | `main.ts` |
| `apps/server/src/hub/identity/` (`admission.ts`, `companies.ts`) | Muda: `manageCopyAlerts` | — |
| `apps/server/src/hub/copies/list.ts` | Muda: `following` | `listCopies` |

### Os contratos que a unidade cria

As cinco operações acima; `CopySummary.following: boolean`; `CompanyMay.manageCopyAlerts`;
`ALERT_RECIPIENT_TAKEN` ("Esse e-mail já está na lista.") e `ALERT_RECIPIENTS_FULL` ("A lista já tem 20
e-mails. Tire um para pôr outro."), 409.

### As skills e a leitura

`fastify-best-practices`, `drizzle`, `better-auth-best-practices` (a ação nova). Os guias de segurança
(S8, S10).

### A ordem do trabalho

1. **Seguir.** Critérios: 110, 111, 114, 115.
2. **A lista.** Critérios: 112, 113. **Mutações à mão:** tire o `lockCompany` da conta de 20 (113 com dois
   `POST` simultâneos).

### Como se prova

`notifying(t)` e o mundo de cópias de hoje (`apps/server/src/hub/notifications/test-notifications.ts:23-31`).

### Parar se

- O fundador mudar a F2 para (b): `followCopy` passa a pedir `manageCopyAlerts`, e a R.13 cai.

## U12 O aviso na primeira falha

**Base e modelo.** A U11. Sonnet.

### As linhas da tabela

- `ended` (`apps/server/src/hub/copies/run.ts:116-165`), `systemColumnsOf` (`:106-113`); `CopiesDeps`
  (`store.ts:96-109`).
- `Notify` e `automationRan` (`apps/server/src/hub/notifications/notifications.ts:42`, `:306`),
  `recorded` (`:104`), `mailed` (`:151`); `NotificationRow` (`packages/hub-api/src/notifications.ts:38-64`).
- A spec 3, item (b), requisito 4, cujo texto é este: na primeira falha (a rodada `ERROR` cuja última
  rodada terminada antes não terminou `ERROR`; `INTERRUPTED` e a parada pedida não contam), uma
  notificação `COPY_FAILED` a cada pessoa que segue e ainda lê, e um e-mail a cada uma e a cada endereço
  da lista, um por endereço; "A cópia {nome} parou. {frase} {o que fazer}", com o link; o e-mail sem a
  mensagem do sistema; a segunda falha não avisa; e-mail que falha: `COPY_MAIL_FAILED` sem o endereço.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/copies/` (`run.ts`, `store.ts`, `tables.ts`, `copy-failed.test.ts`, `system-code.test.ts` novos) | Muda | o relógio |
| `apps/server/src/hub/notifications/` (`notifications.ts`, `copy-email.tsx` novo, `mail.ts`) | Muda: `notify.copyFailed`; `list` e `markRead` com `copy_notice` | `hub/copies` pela porta |
| `packages/hub-api/src/notifications.ts` | Muda: `COPY_FAILED` | a tela |
| `apps/server/migrations/`, `apps/server/package.json` | Cria a regra; o terceiro `esbuild` | — |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/notifications/notifications.ts
export type Notify = { automationRan(ran: AutomationRan): Promise<void>; copyFailed(failed: CopyFailed): Promise<void> }
export type CopyFailed = Readonly<{ companyId: CompanyId; copyId: CopyId; runId: CopyRunId; name: string; code: CopyRunFailureCode }>
// packages/hub-api/src/notifications.ts
z.object({ kind: z.literal('COPY_FAILED'), ...OfNotification, copy: z.object({ id: CopyId, name: z.string() }), code: CopyRunFailureCode })
```

### As skills e a leitura

`drizzle`, `react-email` (a linha de `apps/server/src/hub`). O guia de dados (D6, D15, D22).

### A ordem do trabalho

1. **A primeira falha em `ended`.** Critérios: 116, 117. A rodada anterior lida na mesma transação, antes
   do `UPDATE`; o aviso depois do commit e do log.
2. **`copyFailed`, o sino e o e-mail.** Critérios: 116, 118 a 120.
3. **A 1135.** Critério: 121.
   - **Mutações à mão:** compare com a rodada anterior qualquer (117 vermelho); avise sem conferir a
     leitura (120 vermelho).

### Como se prova

O servidor falso do provedor de e-mail (`mailServer`) e o conector falso que recusa.

### Parar se

- Ler a rodada anterior dentro de `ended` mudar o resultado de `COPY_CLAIM_LOST`: para e reporta.

## U13 As telas de Seguir e Avisos (`v06`, `b3` a `b5`)

**Base e modelo.** A U11, a U12 e o protótipo julgado. Sonnet.

### As linhas da tabela

- A barra da página da tabela (`apps/web/src/hub/copies/copy-detail.tsx`, a `div` de `RunNowButton`);
  `RunNowButton` (`copy-list.tsx:111`); `bell.tsx` (`textOf` `:66`, `pathOf` `:82`); a seção por
  `staticData.section`.
- A spec 3, item (b), requisito 6: a seção abre com "Quando uma cópia falha, o Conexus avisa no sino e
  por e-mail, na primeira falha seguida." e termina com o exemplo do aviso; "Cópias que você segue" com o
  nome em mono e "{sistema} · {conta}" embaixo.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/copies/` (`copy-detail.tsx`, `text.ts`, `queries.ts`, `copy-follow.test.tsx` novo) | Muda | a página da tabela |
| `apps/web/src/hub/notifications/` (`bell.tsx`, `copy-alerts.tsx` novo, testes) | Muda e cria | a rota |
| `apps/web/src/routes/_app/companies/$companyId_/settings/alerts.tsx` novo | Cria | o índice |
| `apps/web/sweep-alerts-states.ts` novo; `docs/reference/screens.md` | Cria; muda 2 linhas | a varredura |

### Os contratos que a unidade cria

Nenhum do servidor.

### As skills e a leitura

As da U9.

### A ordem do trabalho

1. **Seguir.** Critério: 122.
2. **Avisos.** Critério: 123.
3. **O sino.** Critério: 124.
   - **Pronto quando:** a 1366 e 390 px, nos dois temas, bate com `v06`, `b3` a `b5` e o protótipo do
     Membro.

### Como se prova

A varredura de estados e os testes de navegador.

### Parar se

- O protótipo do Membro (F2 (a)) não estiver julgado: a U13 constrói só as telas de `b3` a `b5` e para.

## G5 O ponto de conferência

Os testes da borda e de `hub/apps`; `npm run check`; o Hub local com a borda local (`wrangler dev`) e um
app de exemplo que consulta: a linha `APP` lida com `psql`.

## G6 O ponto de conferência

Os testes de `hub/notifications`, `hub/copies` e das telas; `npm run check`; o Hub local com o provedor
de e-mail falso: uma falha, um aviso, a segunda falha sem aviso.
