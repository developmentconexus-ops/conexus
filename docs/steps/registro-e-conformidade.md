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

Cada linha citada foi lida no `main` em `f27128fa` (depois dos PRs 1162, 1173 e 1176), com `@mastra/core` 1.83.0, `better-auth` 1.7.8 e
`@neondatabase/serverless` 1.2.0; os trechos que a emenda de 2026-11-21 mudou foram lidos em `4be69739`,
com o G1 e o G5 já no `main`. A medida: cerca de 1.550 linhas alteradas em 9 unidades, abaixo das
4.000 da delivery L2 (eram 2.360 em 12 antes de o G6 sair).

Este cartão substitui, da spec do repositório, a parte 4 (requisitos 6 e 7, `C6` e o grupo 9 de
`04-governanca-minima/tasks.md`) e a parte 3, grupos 5 e 6 (`03-leitura-para-analise/tasks.md:631-720`).
O requisito 7.2 da parte 4 ("não encontrado" a quem não é Dono nem Administrador) volta a valer: só
Dono e Administrador veem o Registro (2026-11-21, `"D1 a D2 a"`). O item (b) da spec 3, requisitos 4 a 6
(Seguir, Avisos e o aviso de falha), saiu deste cartão e é um requisito do cartão da etapa 2 do lago
(2026-11-21, "R1 a R2 a"). O fechamento emenda esses trechos (delivery L19).

## A página do fundador

**No fim desta etapa** cada leitura que um agente ou um app faz do dado da empresa deixa uma linha no
**Registro de dados**, em Configurações. A linha diz quem perguntou, por qual agente, o que foi lido,
a consulta, o resultado e quantas linhas voltaram. Ela nunca guarda o resultado. A consulta fica como
foi escrita, até 4.000 caracteres, e pode trazer um valor que o próprio agente digitou nela. Só Dono e
Administrador veem o Registro, sem prazo, em Configurações, no grupo com o nome da empresa, logo
depois de Papéis. Quem não administra não tem o item: vê a origem de cada leitura na própria conversa, na linha
da ferramenta e no bloco **Fontes**. Toda leitura pedida deixa linha, também a recusada. Se o Registro
não conseguir gravar a linha da leitura de um agente, a leitura não devolve nada. Para a consulta de um
app publicado a garantia é mais fraca: o app recebe a resposta antes, e a borda tenta gravar a linha
duas vezes.

Entram também três coisas que você já escolheu:
- **A(b).** Cada consulta que um app publicado faz ao banco deixa uma linha `APP`, com quem abriu o
  app e o Projeto.
- **C(b).** Numa conversa dentro de um Projeto, o agente lê só o que o Projeto recebeu **e** o papel de
  quem conversa lê. A tabela liberada ao Projeto que o seu papel não lê não aparece para você ali.
- **4(b).** O Hub recusa a consulta de um agente ao catálogo interno do banco. "Que tabelas existem?"
  pelo SQL deixa de mostrar o nome de uma tabela que o papel não lê, e a recusa deixa uma linha.

E uma prova roda na CI de cada pull request da trilha. Ela mostra que o contrato cumpre as mesmas leis
contra o banco de verdade, na Empresa e num Projeto, e que nenhum caminho novo escapa dele. O
Assistente, o Builder e o agente salvo já leem tabela e consulta por ele. Ler um sistema ao vivo e
agir passam a existir no contrato (a H2a), mas os agentes continuam a fazê-los pela porta do
Assistente até uma etapa da trilha Agentes e Apps (a H2b); até lá, nada muda na conversa.

**Exemplo.** Bruno, do papel Vendas, pergunta ao Assistente "quanto vendemos ontem?" e depois "quantos
clientes temos?". Na conversa ele vê "Consultou sankhya_vendas", a consulta se abrir a linha, e no
bloco **Fontes** de quando é a cópia. Em Configurações ele não tem o item Registro de dados. Você, como
dono, abre o Registro e vê as linhas de todo mundo. Filtra por Bruno e vê as duas dele: a leitura de
`sankhya_vendas`, **Lida**, com 1 linha e a consulta, e a de clientes, **Não encontrada**, sem nenhuma
linha. Abre uma e vê a consulta. **Abrir a conversa** aparece só nas suas próprias leituras, porque a
conversa abre só para a pessoa dela.

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

1. Como o Membro, pergunte ao Assistente "quanto vendemos ontem?", "quantos clientes temos?" e "que
   tabelas existem no banco?". Ele vê a origem na conversa, e a última resposta traz as tabelas que
   ele lê, sem nomear `sankhya_clientes`. Em Configurações ele não tem o item **Registro de dados**.
2. Ainda como ele, converse com o Assistente dentro do Projeto e pergunte pelos clientes. Ele diz que
   não achou: o Projeto recebeu a tabela, mas o papel dele não a lê.
3. Como dono, pergunte algo ao Assistente e abra Configurações: no grupo com o nome da empresa, logo
   depois de Papéis, **Registro de dados**. Aparecem as leituras de todos. Filtre por essa pessoa: a
   de vendas **Lida**, com a contagem, e a de clientes e a consulta ao catálogo **Não encontrada**,
   todas sem nenhuma linha do resultado. Abra uma linha e veja a consulta; na leitura dela não há
   **Abrir a conversa**. Tire o filtro, abra a sua leitura, toque em **Abrir a conversa**, volte,
   escolha um período de até 31 dias e toque em **Exportar**.
4. Abra um app publicado do Projeto que lê a tabela de vendas. No Registro aparece uma linha do app,
   com o seu nome e "no Projeto {nome}".
5. Diga o que viu e aprove os textos das telas.

**O que você faz, e quando.** Antes: nada; o firstmate convida a segunda pessoa e prepara o Projeto.
No começo: aprova esta página (as decisões abaixo já têm a sua resposta, e os textos da tela do
Registro também: P3 (a), P7 (a) e P8, 2026-11-21). No fim: faz o roteiro, diz o que viu e aprova os
textos das telas, que o pull request do G4 lista.

**Fica de fora.**

- **O resto do U3 do estudo único**, que você mandou para a trilha Agentes e Apps (R2, "a"). A parte do
  agente salvo já entrou no `main` (U4 de "Um escopo e a fábrica de ferramentas", PR 1173): ele lê com o
  papel de quem o roda e só o que a versão declara (o falante `AGENT`,
  `apps/server/src/hub/identity/may-use.ts:29`). Esta etapa grava essas leituras com o agente `AGENT`.
- **Os consumidores passando a chamar `live` e `act` do contrato** (a H2b). É de Agentes e Apps: ela
  migra os 30 arquivos de `builder/` e esvazia a lista de migração. Esta etapa liga os dois verbos e os
  prova; a lista não cresce.
- **A Amostra que uma pessoa abre na página Dados** não entra no Registro (a sua B(a)).
- **Os argumentos de uma leitura ao vivo** não entram na linha: a tela aprovada (`p4-05`) não os
  mostra, e eles trazem valores da empresa. A linha leva a conexão, a operação, o resultado e o tempo.
- **A aba Leituras de uma tabela** (`p4-02`): nenhuma referência tem registro por tabela; o filtro por
  tabela do Registro responde a mesma pergunta.
- **Seguir uma cópia, a seção Avisos e o aviso de falha** (as antigas U11 a U13). Viram um requisito do
  cartão da etapa 2 do lago, "A primeira cópia chega ao lago" (2026-11-21, "R1 a R2 a"): quando uma
  cópia para, quem pode consertá-la é avisado, e a lista de e-mails da empresa também; um aviso
  quando ela para e um lembrete por dia enquanto continuar parada; **Seguir** só se alguém pedir. Lá o
  aviso nasce no fim de rodada do lago, que não passa pelo motor de cópias de hoje. Até lá ninguém
  recebe e-mail quando uma cópia para; a página Dados e o bloco Fontes mostram a parada, como hoje. As
  tabelas `copy_follower`, `alert_recipient` e `copy_notice`, no `main` desde 2026-11-15 e sem uso,
  ficam paradas; o cartão do lago decide se as usa ou as tira.
- **A tabela de concessões, o sujeito Todos e a conexão nova fechada** (a sua 2(a)) e **a conexão
  MCP**. Entram com o cartão que precisar de instância ou de MCP.
- **As pendências**. A **1135** (o código da rodada sem corte nem regra no banco) volta para a fila,
  com o rótulo que já tem: quem a tomava era o aviso de falha, que saiu. Esperam: a **1124** (a origem e o bloco Fontes, que esta
  etapa não toca); a **1136** e a **1140** (a ferramenta `copy_runs`, de `builder/assistant/`, da trilha
  Agentes e Apps); a **1122** (o gatilho é uma contagem de reconciliações; as recusas que o Registro
  passa a gravar são só um limite de cima dela); a **1123** (o gatilho é a próxima etapa que criar ou
  mudar logins, e esta só lê pelo login do papel, que já existe). A **1147** e a **1148** são de Agentes
  e Apps.

**A emenda de 2026-11-17 ("Tudo A").** Depois da reanálise crítica da etapa, você respondeu "Tudo A"
às quatro perguntas dela. O que mudou nesta página:
- **A U4 e o G2 saíram.** Revogar o `EXECUTE` de `query_to_xml` e das irmãs não tem referência em
  nenhuma plataforma que olhamos, e o dono do banco da empresa não consegue revogá-lo (medido). Saíram
  também a palavra de merge do G2 e a autorização do ramo de teste.
- **A guarda do plano (U3, já no `main`) fica como está e não cresce.** É defesa em profundidade, da
  mesma forma que a ferramenta interna aberta de consulta (lista de funções e de tabelas de sistema proibidas). Ela protege só o
  nome das tabelas; o conteúdo, quem barra é o login do papel.
- **Toda falha da cópia avisa quem a segue**, como a plataforma de ingestão e a de operações, no lugar de "só a primeira falha
  seguida" (U12). Esta regra saiu na emenda de 2026-11-21, com o aviso inteiro.
- **O Exportar do Registro leva no máximo 31 dias por vez**, como a plataforma de ingestão (U9).

**A emenda de 2026-11-21.** Depois de três estudos do cartão contra as referências e o lago, você
respondeu: `"D1 a D2 a D3 a"`, "P3 a p4 a", "P6 b", "P7 a", "P8 okay", "R1 a R2 a" e, sobre o G3,
`"B1 a C1 a C2a"`. O que mudou nesta página:
- **Só Dono e Administrador veem o Registro de dados** (`D1` (a)), **em Configurações, no grupo Pessoas e
  acesso, ao lado de Papéis** (`D2` (a)). A regra "cada pessoa vê as próprias leituras" veio de uma
  frase da plataforma de ingestão sobre os tokens de API, lida fora do lugar; nas referências, quem
  conversa com um agente vê a origem na conversa. O roteiro de uso passou de sete passos para cinco.
- **Seguir, Avisos e o aviso de falha saíram deste cartão** (R1 (a)) e vão para o cartão da etapa 2
  do lago, com quem conserta como destinatário. **O aviso sai quando a cópia para, com um lembrete por
  dia enquanto ela continuar parada** (R2 (a)), e não a cada rodada: com 10 tabelas copiadas de 30 em
  30 minutos, uma conexão quebrada mandaria 480 avisos por dia a cada pessoa. A `D3` (a), a P4 (a) e a
  P6 (b) falavam do botão **Seguir** e deixam de ter efeito aqui; a P5 caiu com a R1.
- **As palavras do Resultado** (P3 (a)): **Lida**; **Não encontrada** para toda tabela fora do catálogo,
  a consulta ao catálogo do banco incluída; **Recusada** para a consulta que o papel ou o banco recusa;
  **Não lida** para o resto.
- **O Projeto e a conversa na linha** (P7 (a)): "no Projeto {nome}" sob o agente; na linha aberta,
  "Conversa: no Início" ou "no Projeto {nome}".
- **Os textos do protótipo** (P8) para Exportar, os filtros e o título da linha aberta, com "As 5.000
  leituras mais novas." quando a exportação para no teto.
- **A marca de sistema "só ao vivo" e a lei dela saíram** do contrato (B1 (a)); a prova roda 23 leis.

**A emenda do fechamento (2026-11-21).** Depois da QA, você respondeu "1. B" ao achado 1. O que mudou
nesta página:
- **A consulta a uma tabela fora do seu catálogo volta Não encontrada** (`NOT_IN_CATALOG`), como a
  tabela que não existe, e não roda. Antes, o banco a recusava pelo papel e o Registro dizia
  **Recusada**, enquanto a conversa dizia que a tabela não está no catálogo. Agora as duas telas dizem
  o mesmo, e a resposta não deixa saber se a tabela existe (security S10), como o lago fará. Os
  critérios 41 e 43 dizem isso.
- **O lugar do item.** A tela não tem um grupo Pessoas e acesso: o item fica no grupo com o nome da
  empresa, logo depois de Papéis, como pede o critério 77. A `D2` (a) vale assim.
- **Abrir a conversa** aparece só nas leituras de quem olha (decisão E4 (a) do G4). O passo 3 do
  roteiro diz isso.

**As decisões suas nesta etapa.** Três, respondidas por você no quadro em 2026-11-17, as três com a
recomendação: "F1. O Construtor num Projeto lê com o papel de quem conversa: a", "F2. Quem segue uma
cópia e vê Avisos: a", "F3. A guarda do Registro: a". A F2 deixou de ter efeito com a R1 (a). As
opções da F1 e da F3 ficam abaixo como foram postas; as de 2026-11-21 estão na emenda acima.

- **F1. O Construtor num Projeto lê com o papel de quem conversa?** Respondida: (a). Nesta pergunta,
  "Construtor" é o Builder, que constrói o app (o consumidor `builder`). O Construtor que edita um agente
  (o consumidor `construtor`) segue a mesma regra no Projeto, porque a U5 cruza o que o Projeto recebeu
  com o papel para todo consumidor. No resto do cartão, Builder é quem constrói o app e Construtor é
  quem edita o agente, como nas telas. A sua C(b), no quadro do Registro,
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
| G1 O Registro grava (um PR) | U1 O gravador e o contrato | `recordReadOf`, o único que grava em `data.data_read`; o contrato grava cada leitura de tabela e consulta e cada recusa; sem linha, sem leitura; o agente da linha pelo consumidor do `Principal`, com `CONSTRUTOR` novo; `DataContext` com a conversa de `RunScope.conversation`; os três `data` da fábrica passam o contexto | `apps/server/src/hub/data/`, `apps/server/src/main.ts`, `apps/server/migrations/`, `apps/server/src/builder/controller-kit/` (só `run.ts`), `apps/server/src/builder/assistant/` (só `assistant.ts`), `apps/server/src/builder/conversation/` (só `builder.ts`), `apps/server/src/builder/agents/` (`company.ts`, `agent.ts`), `.dependency-cruiser.cjs`, `scripts/rerun-never.json` | data (D15, D18, D22); testing (T5, T27); security S40 | o `main` em `f27128fa` |
| G1 | U2 A leitura ao vivo e o esquema do app | `readThrough` grava `LIVE` pela porta atrasada `recordRead`, pulando a cópia; a leitura do esquema do app pelo Builder e pelo agente grava `QUERY` | `apps/server/src/hub/connectors/` (`read.ts`, `rows.ts`, `public.ts`), `apps/server/src/hub/apps/` (`builder-data.ts`, `public.ts`), `apps/server/src/builder/app-data/` (só `tools.ts`), `apps/server/src/main.ts`, `scripts/rerun-never.json` | data (D22); testing (T5, T27) | U1 |
| G1 | U3 O plano lê só `sync` | A consulta do agente que lê fora de `sync` (catálogo do sistema, `information_schema`) ou chama uma função da lista recusada volta `NOT_IN_CATALOG` sem linha, e deixa linha no Registro (a sua 4(b)) | `apps/server/src/hub/data/` (`query.ts`, `plan.ts` novo), `scripts/rerun-never.json` | data (D20); testing (T5, T13, T27); security S10 | U1 |
| G3 O lugar e o contrato inteiro (um PR) | U5 A conversa num Projeto com o papel | No lugar Projeto, o catálogo é o que o Projeto recebeu cruzado com o que o papel lê; a consulta e a página de tabela leem pelo login do papel (a sua C(b), com a F1 (a)) | `apps/server/src/hub/copies/` (`access-source.ts`), `apps/server/src/hub/data/` (`query.ts`, `rows.ts`), `scripts/rerun-never.json` | data (D22); testing (T5, T27); security S10 | G1 mesclado |
| G3 | U6 `live` e `funnel` ligados (a H2a) | `liveOf` e `funnelOf` sobre a porta do Assistente de `hub/connectors`; `TurnBinding` com quem aprovou e o falante `AGENT` (fecha a 1174); `NOT_GRANTED` só sem turno | `apps/server/src/hub/data/` (`live.ts`, `funnel.ts` novos, `public.ts`, `deps.ts`), `apps/server/src/hub/connectors/` (`assistant-port.ts`, `public.ts`), `apps/server/src/main.ts` | data (D22); testing (T5, T26, T27) | U5 |
| G3 | U7 A prova contra o banco de verdade | `runDataConformance` com `make(t)` assíncrono e o contrato vinculado; as 21 leis de hoje (sai a do sistema só ao vivo, B1 (a)) e duas novas, 23, contra o mundo real na Empresa e num Projeto, com as entradas válidas de cada leitura ao vivo declaradas pelo mundo; as leis (c), (d) e (f) da porta; a lista de migração que não cresce | `packages/hub-api/src/` (`company-data-conformance.ts`, `company-data-world.ts`, `company-data.test.ts`), `apps/server/src/hub/data/` (`conformance.test.ts` novo, `test-world.ts` novo), `apps/server/src/hub/access/` (só `conformance.test.ts`), `scripts/rules-doors.test.ts`, `scripts/rerun-never.json` | testing (T4, T5, T27); code C3 a C8; L27 (muda `packages/hub-api`) | U6 |
| G4 O Registro na tela (um PR) | U8 As rotas do Registro | `listDataReads` e `exportDataReads`, só para Dono e Administrador, pela ação `readDataReads` da tabela de admissão, como Papéis (`D1` (a)); quem não a tem recebe 404; `CompanyMay.readDataReads` para a tela; a página por chave (hora, id), da mais nova; os índices | `packages/hub-api/src/` (`data-reads.ts` novo, `index.ts`, `roles.ts`, `failures.ts` se preciso), `apps/server/src/hub/data/` (`reads.ts`, `routes.ts` novos, `public.ts`, `tables.ts`), `apps/server/src/hub/identity/` (`roles.ts`, `admission.ts`, `companies.ts`), `apps/server/migrations/`, `apps/server/src/main.ts`, `apps/web/src/platform/test-may.ts`, `apps/web/sweep-replies.ts` | data (D15, D19); testing (T5, T6, T10); security S8, S10; L27 | G1 mesclado |
| G4 | U9 A página Registro de dados (`p4-04` a `p4-06`) | Configurações, **Registro de dados**: 50 por página, filtros no endereço, a linha aberta, **Abrir a conversa**, **Copiar a consulta**, **Exportar** em CSV de até 31 dias por vez; o item só para quem tem `readDataReads`, no grupo da empresa depois de Papéis (`D2` (a)); os textos da P3 (a), da P7 (a) e da P8 | `apps/web/src/routes/_app/companies/$companyId_/settings/` (`data-reads.tsx` novo), `apps/web/src/hub/data/` (novo), `apps/web/sweep-data-reads-states.ts` (novo), `docs/reference/` (só `screens.md`) | web, design, testing | U8 |
| G5 O app no Registro (um PR) | U10 A borda avisa o Hub | Depois de cada `db.query` de um app, a borda manda ao Hub a consulta, a contagem e o tempo, com um id dela; o Hub grava `APP` sem repetir; a consulta recusada também | `apps/edge/src/` (`db.ts`, `dispatcher.ts`, `dispatch.ts`, `hub.ts`), `packages/hub-api/src/` (`apps.ts`), `apps/server/src/hub/apps/` (`routes.ts`, `read-notice.ts` novo, `public.ts`), `apps/server/src/main.ts`, `scripts/rerun-never.json` | security (S8, S40); testing (T5, T13, T27); L27 | G1 mesclado |

Quatro grupos, um pull request cada ([delivery L9](../guides/delivery.md)), um commit por unidade: o
G2 saiu na emenda de 2026-11-17, e o G6 (Seguir e Avisos, U11 a U13) na de 2026-11-21. O G1 e o G5 já
estão no `main` (PRs 1180 e 1207); o G3 foi construído em dois braços de experimento, e a escolha do
braço é do experimento. Depois do G3 falta só o G4.

- **A linha principal.** G1, depois G3 e G4 em paralelo (não dividem pasta: G3 muda `hub/data/query.ts`,
  `rows.ts`, `public.ts` e `deps.ts`; G4 cria `reads.ts` e `routes.ts` e muda `public.ts` só na linha da
  porta das rotas, por isso G4 rebaseia sobre G3 se G3 mesclar antes). G5 parte de G1 mesclado.
- **Nenhum grupo cria nem tira permissão no banco da empresa** (o G2 saiu na emenda de 2026-11-17). O G1, o G3, o G4 e o G5 não criam nem
  tiram permissão: o login do Hub já segura `SELECT` e `INSERT` em `data.data_read`
  (`apps/server/database-grants.sql:437`), e o C(b) lê pelo login do papel que já existe.
- **O que toca a outra trilha.** A U1 muda uma linha em cada um dos três `data` que os consumidores dão
  à fábrica (`builder/company-tools/factory.ts:35`) e cria `dataContextOf` ao lado de `principalOf`, em
  `builder/controller-kit/run.ts`; a U2 muda `appDataOf` da fábrica (`factory.ts:164-175`), para passar a
  conversa; a U7 e a U8 mudam `packages/hub-api`. A
  trilha Agentes e Apps não tem etapa em construção nesses arquivos hoje (L1); o pull request avisa a
  trilha (L27). A H1 dela toca `hub/connectors/scope.ts`, que esta etapa não muda.
- **A QA** ([testing T25](../guides/testing.md)) roda depois do G4, pelo roteiro de uso e pela
  matriz de estados.
- **Os modelos.** U1, U6 e U10 em Opus (contrato entre módulos; a ordem entre dois bancos; a borda e o
  Hub); as outras em Sonnet.

**Orçamento de código alterado.** Linhas mudadas, as tiradas também, sem testes nem gerados.

- U1: ~175 (`record.ts` novo ≈75, com a tabela do agente; `public.ts` ≈45, o embrulho e o contexto;
  `tables.ts` 2; a migração da regra `data_read_agent` ≈6; `deps.ts` 2; `main.ts` 4; `run.ts` ≈10,
  `dataContextOf`; os três `data` 2 cada e `agent.ts` 1; `.dependency-cruiser.cjs` ≈8).
- U2: ~90 (`read.ts` ≈30; `rows.ts` 3; `connectors/public.ts` 4; `builder-data.ts` ≈15; `apps/public.ts`
  ≈15; `app-data/tools.ts` ≈8; `main.ts` 4).
- U3: ~90 (`plan.ts` novo ≈60; `query.ts` ≈30).
- U5: ~110 (`access-source.ts` ≈15; `query.ts` −45 e +20, sai `projectRead`; `rows.ts` ≈15; `deps.ts` 2;
  ajustes de tipo ≈10).
- U6: ~220 (`live.ts` novo ≈60; `funnel.ts` novo ≈70; `public.ts` ≈30; `deps.ts` 4;
  `assistant-port.ts` ≈30, a conversa na leitura; `connectors/public.ts` 4; `main.ts` 4; `read.ts` ≈10).
- U7: ~110 (`company-data-conformance.ts` ≈60, o `make` assíncrono, o contrato vinculado e as duas leis;
  `company-data-world.ts` ≈20; `.dependency-cruiser.cjs` 0; o resto é teste, ≈400 linhas que não contam).
- U8: ~250 (`data-reads.ts` novo ≈75; `reads.ts` novo ≈105, sem o recorte por pessoa; `routes.ts` novo
  ≈30; `tables.ts` ≈4; a migração ≈6; `public.ts` 4; `main.ts` 4; `index.ts` 2; a ação `readDataReads`
  ≈9: os dois `roles.ts` 2 cada, `admission.ts` 2, `companies.ts` 2, `test-may.ts` 1;
  `sweep-replies.ts` ≈10).
- U9: ~300 (`data-reads.tsx` da rota ≈40; `hub/data/data-reads.tsx` ≈130, uma versão só;
  `read-detail.tsx` ≈65; `queries.ts` ≈20; `csv.ts` ≈30; `text.ts` ≈20; o período do Exportar ≈15).
- U10: ~200 (`db.ts` ≈45; `dispatcher.ts` ≈15; `dispatch.ts` ≈10; `hub.ts` ≈20; `hub-api/apps.ts` ≈25;
  `read-notice.ts` novo ≈60; `routes.ts` ≈10; `public.ts` 5; `main.ts` 4; `wrangler` nenhuma).
**Total da etapa:** cerca de 1.550 linhas alteradas.

## Os critérios de aceite

Cada grupo tem a sua faixa: G1 de 1 a 29, G3 de 40 a 69, G4 de 70 a 99, G5 de 100 a
109. A faixa de 30 a 39, que era do G2, ficou vazia na emenda de 2026-11-17, e a de 110 a 149, que era
do G6, na de 2026-11-21; os números que sobram ficam livres para a leitura do cartão.

### G1

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Bruno (Vendas, lê `sankhya_vendas`) lê a tabela pelo contrato no Assistente: `data.data_read` ganha uma linha `SAMPLE` com `person_id` dele, `agent` `ASSISTANT`, `tables` `{sankhya_vendas}`, `outcome` `TABLE`, `rows` igual ao número de linhas devolvidas e `thread_id` da conversa | `apps/server/src/hub/data/record.test.ts`, "a leitura de tabela deixa uma linha SAMPLE com a conversa" | must |
| 2 | U1 | A consulta pelo contrato grava uma linha `QUERY` com o texto como foi pedido, `tables` com as tabelas da resposta, `outcome` `QUERY` e a contagem | `record.test.ts`, "a consulta deixa uma linha QUERY com o texto e as tabelas" | must |
| 3 | U1 | A recusa grava: a tabela fora do catálogo (`NOT_IN_CATALOG`), a consulta que o banco recusa (`QUERY_REFUSED`, `NOT_IN_ROLE`) e o catálogo calado (`CATALOG_UNAVAILABLE`) deixam cada uma uma linha com `rows` nulo. Recusa: nenhuma delas devolve linha de dado | `record.test.ts`, "cada recusa deixa uma linha sem contagem" | must |
| 4 | U1 | Nenhuma coluna da linha guarda uma célula lida: com uma tabela de valores marcados (`'MARCA-<n>'`), nenhum campo de nenhuma linha de `data.data_read` contém `MARCA-`, a consulta incluída quando ela não traz o literal | `record.test.ts`, "a linha não guarda nenhum valor lido" | must |
| 5 | U1 | Com a gravação derrubada (o mundo de teste faz o `insert` falhar), a leitura de tabela e a consulta respondem `TABLE_UNAVAILABLE`, sem linha de dado, e o log tem `DATA_READ_UNRECORDED` com `companyId` e `verb`, sem a consulta | `record.test.ts`, "sem linha no Registro, nenhuma linha de dado" | must |
| 6 | U1 | `describe` e a lista do catálogo não gravam linha | `record.test.ts`, "descrever não grava" | must |
| 7 | U1 | Uma leitura `OPERATION` que o catálogo serve por uma tabela grava `SAMPLE`; a recusada antes de chamar o sistema (`NOT_IN_CATALOG`, e também `NOT_GRANTED` e `CALLS_SPENT`, com ou sem turno) grava `LIVE` com a conexão e a operação: toda leitura pedida deixa linha; nenhuma leitura grava duas linhas | `record.test.ts`, "a leitura de operação deixa exatamente uma linha" | must |
| 8 | U1 | O agente da linha sai do consumidor do `Principal`: o Assistente `ASSISTANT`, o Builder `BUILDER`, o agente salvo `AGENT` com `agent_id`, o Construtor `CONSTRUTOR`; `project_id` só no Projeto; um consumidor novo em `Consumer` sem valor na tabela não compila. Recusa: o banco recusa um `agent` fora da lista (a regra `data_read_agent`) | `record.test.ts`, "o agente e o Projeto da linha vêm do principal" | must |
| 9 | U1 | Só `apps/server/src/hub/data/record.ts` importa a tabela `dataRead`: um arquivo plantado que a importe faz `npm run deps` falhar com a regra `data-read-only-through-the-recorder` | `scripts/rules-doors.test.ts`, "só o gravador escreve no Registro" | must |
| 10 | U1 | Uma consulta de 4.000 caracteres grava a linha inteira; o contrato já recusa uma maior (`QUERY_SQL_MAX`, `packages/hub-api/src/company-data.ts:93`) | `record.test.ts`, "a consulta no limite cabe na linha" | should |
| 11 | U2 | A leitura ao vivo de um sistema pelo Assistente grava uma linha `LIVE` com `connection_id`, `operation`, `outcome` `OK` e `rows` nulo; a do app grava `APP`; a do Construtor, pela mesma porta do Assistente, grava `CONSTRUTOR`, e a do agente salvo `AGENT` | `apps/server/src/hub/connectors/read-record.test.ts`, "a leitura ao vivo deixa uma linha LIVE" | must |
| 12 | U2 | A rodada de uma cópia (`by: 'copy'`) não grava | `read-record.test.ts`, "a cópia não entra no Registro" | must |
| 13 | U2 | A leitura ao vivo recusada pelo papel (`NOT_IN_ROLE`) grava uma linha com esse resultado, sem chamar o sistema | `read-record.test.ts`, "a leitura ao vivo recusada deixa linha" | must |
| 14 | U2 | Com a gravação derrubada, a leitura ao vivo responde `UNREACHABLE` e o valor lido não volta; `DATA_READ_UNRECORDED` no log | `read-record.test.ts`, "sem linha, a leitura ao vivo não devolve o valor" | must |
| 15 | U2 | `app_data_read` do Builder e do agente grava uma linha `QUERY` com o texto, `tables` vazio, o resultado e a contagem; a lista de tabelas e a contagem de linhas da página Dados (`apps/server/src/hub/apps/app-tables.ts:73`, `:157`) não gravam | `apps/server/src/hub/apps/app-data-record.test.ts`, "a leitura do esquema do app pelo agente deixa linha" e "a página Dados não entra no Registro" | must |
| 16 | U3 | Como Bruno, `select relname from pg_class`, `select table_name from information_schema.tables` e `select * from pg_catalog.pg_roles` voltam `NOT_IN_CATALOG`, sem linha, e cada uma grava uma linha `QUERY` com esse resultado | `apps/server/src/hub/data/plan.test.ts`, "o catálogo do sistema é recusado e deixa linha" | must |
| 17 | U3 | `select query_to_xml('select * from sync.sankhya_clientes', true, false, '')`, `select to_regclass('sync.sankhya_clientes')` e `select 'sync.sankhya_clientes'::regclass` voltam `NOT_IN_CATALOG`, sem linha | `plan.test.ts`, "a função e o tipo que leem por nome são recusados" | must |
| 18 | U3 | As consultas de hoje continuam: `select date_trunc('day', ...), sum(...) ... group by 1` e `select count(*) from sync.sankhya_vendas` passam | `plan.test.ts`, "a consulta comum passa" | must |
| 19 | U3 | Uma `view` que alguém crie fora de `sync` não abre caminho: o plano que lê qualquer esquema fora de `sync` é recusado | `plan.test.ts`, "o plano fora de sync é recusado" | must |

### G3

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 40 | U5 | Num Projeto que recebeu `sankhya_vendas` e `sankhya_clientes`, o catálogo do Assistente e do agente salvo de Bruno lista só `sankhya_vendas`; o de Dono e Administrador lista as duas | `apps/server/src/hub/data/place-role.test.ts`, "no Projeto, o catálogo é o que o Projeto recebeu e o papel lê" | must |
| 41 | U5 | No mesmo Projeto, `read({kind:'TABLE', table:'sankhya_clientes'})` de Bruno volta `NOT_IN_CATALOG`; a consulta `select * from sync.sankhya_clientes` também volta `NOT_IN_CATALOG`, sem linha e sem perguntar ao banco ("1. B") | `place-role.test.ts`, "no Projeto, a tabela fora do papel é recusada" | must |
| 42 | U5 | No Projeto, uma consulta de Bruno roda como `conexus_role_<id do papel>` (`current_user`), e uma tabela que o papel lê mas o Projeto não recebeu volta `NOT_IN_CATALOG` | `place-role.test.ts`, "no Projeto, o banco segura o papel e o Hub o lugar" | must |
| 43 | U5 | O Builder de Bruno, sem o papel que lê clientes, recebe o catálogo sem `sankhya_clientes` e não a lê; o de Carla, de Financeiro, recebe `sankhya_clientes` (F1 (a)) | `place-role.test.ts`, "o Builder no Projeto segue a F1" | must |
| 44 | U5 | O app publicado do Projeto continua lendo as duas tabelas pelo login do Projeto (a sua 3(d)) | `apps/server/src/hub/apps/app-read-place.test.ts`, "o app lê pela liberação do Projeto" | must |
| 45 | U6 | Com um turno vinculado, `read({kind:'OPERATION'})` de uma leitura que nenhuma tabela guarda chama o sistema uma vez e volta `LIVE` com o valor; sem turno, `NOT_GRANTED`, sem chamar o sistema e com a sua linha `LIVE` | `apps/server/src/hub/data/live.test.ts`, "a leitura ao vivo pelo contrato chama o sistema com o turno" | must |
| 46 | U6 | A leitura ao vivo pelo contrato gasta o mesmo limite de chamadas do turno que a ferramenta de hoje: na chamada além do limite volta `CALLS_SPENT`, com a sua linha `LIVE` | `live.test.ts`, "o contrato gasta o limite do turno" | must |
| 47 | U6 | `act` de uma ação declarada, com o turno e quem aprovou, grava em `connector_write` e volta `OK`; repetir a mesma chamada (`thread`, `toolCall`) volta a mesma resposta sem mandar de novo; a mesma chamada com outra entrada volta `IDEMPOTENCY_CONFLICT` | `apps/server/src/hub/data/funnel.test.ts`, "agir pelo contrato passa pelo funil e não repete" | must |
| 48 | U6 | `act` de uma operação que o papel não usa volta `NOT_IN_CATALOG` (a porta não lista a ação fora do papel, e o contrato responde antes do funil; o `NOT_IN_ROLE` do funil já tem o seu teste em `hub/connectors/write.test.ts`), não chama o sistema e não grava em `connector_write` | `funnel.test.ts`, "agir fora do papel é recusado sem registro de escrita" | must |
| 49 | U6 | `WRITE_OPEN` volta com `since` em ISO; nenhum campo `Date` escapa do contrato (o esquema `ActAnswer` aceita a resposta) | `funnel.test.ts`, "a resposta do funil passa no esquema do contrato" | must |
| 50 | U6 | O caso de hoje que fixa `NOT_GRANTED` em `live` e `act` (`apps/server/src/hub/data/data.test.ts:228-249`) passa a afirmá-lo só sem turno | `data.test.ts`, o caso reescrito | must |
| 51 | U7 | `runDataConformance` aceita `make(t)` assíncrono e um contrato vinculado; o mundo falso de hoje passa as 21 leis de hoje como antes (a lei do sistema só ao vivo saiu com a marca, B1 (a)) | `packages/hub-api/src/company-data.test.ts`, "a conformidade espera o mundo assíncrono e passa o TestContext" | must |
| 52 | U7 | Lei nova "toda leitura deixa exatamente uma linha, sem nenhuma célula": para cada leitura das leis, o mundo devolve uma linha, e nenhuma linha contém um valor plantado | `company-data.test.ts` (mundo falso) e `apps/server/src/hub/data/conformance.test.ts` (mundo real) | must |
| 53 | U7 | Lei nova "a gravação derrubada não devolve linha": com `world.failRecord()`, nenhuma leitura devolve dado | os mesmos dois arquivos | must |
| 54 | U7 | As 23 leis passam contra o mundo real em dois lugares: a Empresa (papel Vendas) e um Projeto (o que recebeu cruzado com o papel) | `apps/server/src/hub/data/conformance.test.ts`, "empresa" e "projeto" | must |
| 55 | U7 | As leis (c) e (d) da porta, por consumidor (Assistente, Builder, agente): toda leitura aceita deixa uma linha; o login usado tem `SELECT` só nas tabelas do papel | `apps/server/src/hub/access/conformance.test.ts`, os cenários estendidos | must |
| 56 | U7 | A lei (f) da porta: `query_to_xml` e uma consulta ao catálogo do sistema recusam e deixam linha, por consumidor | `apps/server/src/hub/access/conformance.test.ts`, "a consulta que lê por fora recusa" | must |
| 57 | U7 | Um nome a mais na lista de migração (`.dependency-cruiser-migration.cjs`) faz o teste falhar; um a menos passa | `scripts/rules-doors.test.ts`, "a lista de migração do contrato não cresce" e "um nome novo na lista falha" | must |

### G4

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 70 | U8 | `GET /api/companies/{companyId}/data-reads` como Dono devolve as linhas de todos, da mais nova para a mais antiga, 50 por página, com `next`; a segunda página continua sem repetir nem pular, mesmo com duas linhas na mesma hora | `apps/server/src/hub/data/reads.test.ts`, "o dono lê todas, por página, sem repetir" | must |
| 71 | U8 | Como o Administrador, a mesma rota devolve as linhas de todos, como ao Dono. Recusa: como Bruno (Membro) ou Carla (Desenvolvedora), sem a ação `readDataReads`, a lista e a exportação respondem 404 `NOT_FOUND` (security S10), sem nenhuma linha, nem as deles | `reads.test.ts`, "só Dono e Administrador leem o Registro" | must |
| 72 | U8 | Os filtros `person`, `agent`, `table` e `outcome` (`OK`, `REFUSED`) recortam; `table` acha a linha `QUERY` que leu a tabela entre outras | `reads.test.ts`, "os filtros recortam" | must |
| 73 | U8 | Cada linha leva o nome da pessoa e o do Projeto, lidos num lote por página (no máximo uma leitura de nomes por página) | `reads.test.ts`, "os nomes vêm num lote" | should |
| 74 | U8 | `GET .../data-reads/export` devolve até 5.000 linhas do filtro no período pedido, com `complete` falso quando há mais | `reads.test.ts`, "a exportação para em 5.000" | must |
| 75 | U8 | Quem não é membro da empresa recebe 404 `NOT_FOUND` nas duas rotas (security S10); uma página com `page` malformado recebe 400 | `reads.test.ts`, "fora da empresa, não encontrado" | must |
| 76 | U8 | Nenhuma linha da resposta tem um campo de valor lido: o esquema `DataReadEntry` não tem campo de linhas, e a resposta passa nele | `reads.test.ts`, "a resposta passa no esquema sem linhas" | must |
| 77 | U9 | O índice de Configurações mostra **Registro de dados** no grupo da empresa, logo depois de Papéis, só a quem tem `readDataReads` (Dono e Administrador); para o Membro e o Desenvolvedor o item não existe, e o endereço da página dá a página de não encontrado | `apps/web/src/hub/data/data-reads.test.tsx`, "o item só para quem administra" | must |
| 78 | U9 | A lista mostra quando, quem, qual agente (com "no Projeto {nome}" embaixo, quando há Projeto), o que foi lido, o resultado e quantas linhas. O resultado é uma palavra, com o código no `title`: **Lida**; **Não encontrada** para todo `NOT_IN_CATALOG`; **Recusada** para `NOT_IN_ROLE`, `QUERY_REFUSED` e a consulta de um app que o banco recusa (o código do PostgreSQL; a classe 08, sem conexão, não); **Não lida** para o resto. O filtro escolhido fica no endereço e volta ao recarregar | `data-reads.test.tsx`, "a lista e o filtro no endereço" | must |
| 79 | U9 | A linha aberta, com o título "Leitura de {quando}", mostra quem, o agente, a conversa ("Conversa: no Início" ou "no Projeto {nome}"), as tabelas ou a operação, a consulta, o resultado, as linhas e o tempo, com **Abrir a conversa** quando a conversa é conhecida e **Copiar a consulta** quando há consulta; nada mais | `data-reads.test.tsx`, "a linha aberta" | must |
| 80 | U9 | **Exportar** abre o diálogo "Exportar", "As leituras dos filtros de agora, num arquivo CSV. No máximo 31 dias por vez.", com "De" e "Até" (a tela não deixa escolher mais de 31 dias), e baixa um CSV com as linhas do filtro no período; com `complete` falso, diz "As 5.000 leituras mais novas."; uma consulta que começa com `=`, `+`, `-` ou `@` sai com um apóstrofo na frente | `apps/web/src/hub/data/csv.test.ts`, "o CSV desarma fórmula" | must |
| 81 | U9 | Vazio: "Nenhuma leitura ainda." e o que vai aparecer ali; carregando: esqueletos; erro: "Não deu para ler o registro agora." com **Tentar de novo** | `data-reads.test.tsx`, os três estados, e `apps/web/sweep-data-reads-states.ts` | must |
| 82 | U8 | A exportação pede `from` e `to` e leva no máximo 31 dias: de 31 dias, passa; de 32 dias, `to` antes de `from` ou sem um dos dois, volta 400 `REQUEST_MALFORMED` sem nenhuma linha (a plataforma de ingestão limita a 31 dias) | `reads.test.ts`, "a exportação leva no máximo 31 dias" | must |

### G5

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 100 | U10 | Um app que faz `db.query` deixa uma linha `APP` com a pessoa que abriu o app, o Projeto, a consulta, a contagem e o tempo, e `tables` vazio | `apps/server/src/hub/apps/read-notice.test.ts`, "a consulta do app deixa uma linha APP" | must |
| 101 | U10 | O mesmo aviso duas vezes (mesmo id) grava uma linha só | `read-notice.test.ts`, "o aviso repetido não duplica" | must |
| 102 | U10 | A consulta recusada pelo banco também avisa, com o código do PostgreSQL como resultado; `db.batch` não avisa | `apps/edge/src/db.test.ts`, "a consulta recusada avisa; o batch não" | must |
| 103 | U10 | O aviso não atrasa o app: a resposta de `db.query` volta antes de o aviso terminar, e um Hub calado não muda a resposta; a borda tenta mais uma vez e, sem resposta, imprime `EDGE_READ_UNRECORDED` sem a consulta | `db.test.ts`, "o aviso vai depois e não muda a resposta" | must |
| 104 | U10 | Pessoa, empresa e Projeto saem da sessão do app no Hub, nunca do corpo do aviso: um corpo com outro `projectId` é recusado com 400 | `read-notice.test.ts`, "o aviso não escolhe a pessoa nem o Projeto" | must |
| 105 | U10 | Uma consulta de mais de 4.000 caracteres grava os 4.000 primeiros | `read-notice.test.ts`, "a consulta longa é cortada" | should |

## A matriz de estados

### G1, G3 e G5

Não criam tela. A recusa do catálogo do sistema chega à conversa pela linha que a ferramenta já mostra
para `NOT_IN_CATALOG` (de hoje).

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `data.data_read` (todas as colunas; já no `main`) | só `recordReadOf` (U1), chamado pelo embrulho do contrato (U1), por `readThrough` e pela leitura do esquema do app (U2), e pelo aviso da borda (U10) | `listDataReads` e `exportDataReads` (U8); as leis (U7) |
| `DataContext.thread` e `agentId` | `dataContextOf(run)` (U1), de `RunScope.conversation`, nos três `data` da fábrica (U1) e em `appDataOf` (U2); `agentId` só o do agente salvo | o embrulho (U1) e a linha |
| `TurnBinding` (`turn`, `speaker` `PERSON` ou `AGENT`, `agentId`, `number`, `approvedBy`) | ninguém de produção nesta etapa (a H2b); o mundo real da U7 | `liveOf` e `funnelOf` (U6) |
| `ReadEntry` | o embrulho, `readThrough`, `app-data`, `read-notice` | `recordReadOf` |
| `RecordRead` → `'RECORDED' \| 'UNRECORDED'` | `recordReadOf` (U1) | o embrulho, `readThrough`, `app-data` (U2), `read-notice` (U10) |
| `recordAppRead` (o corpo: `id`, `query`, `outcome`, `rows`, `ms`) | a borda (U10) | `read-notice.ts` (U10) |

### G4

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Registro de dados, Dono e Administrador (`p4-04`) | o vazio | "Nenhuma leitura ainda." e "Cada leitura que um agente ou um app fizer do dado da empresa aparece aqui, sem o resultado." (`p4-06`) | esqueletos nas linhas | "Não deu para ler o registro agora." com **Tentar de novo** | — | o Membro e o Desenvolvedor não têm o item, e o endereço dá a página de não encontrado, como Papéis; quem não é membro: o mesmo (S10) | sessão vencida: o de hoje da plataforma |
| Filtros (a folha "Ver as leituras", com "Todas" e "Todos") | — | "Nenhuma leitura com esses filtros." com **Limpar os filtros** | esqueletos | o mesmo | — | — | — |
| A linha aberta (`p4-05`, "Leitura de {quando}") | — | — | esqueleto do painel | o mesmo, no painel | uma linha que não está mais na página pelo endereço: "Leitura não encontrada." | — | — |
| Exportar (o diálogo "Exportar", com "De" e "Até") | — | sem linhas: o botão fica desligado | "Exportando…" no botão | a frase do Hub, ao lado do botão | — | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `DataReadEntry` (`id`, `at`, `person {id, name}`, `agent`, `project {id, name} \| null`, `agentId`, `threadId`, `verb`, `tables`, `connection`, `operation`, `query`, `outcome`, `rows`, `ms`) | `reads.ts` (U8) | a lista e a linha aberta (U9) |
| `next` (o id da última linha) | `reads.ts` | o `Pager` (U9) |
| `complete` da exportação | `reads.ts` | **Exportar** (U9): "As 5.000 leituras mais novas." quando falso (P8) |
| `CompanyMay.readDataReads` | `companies.ts` (U8), da tabela de admissão | o índice de Configurações e a rota (U9), por `needs`, como Papéis |

Uma etapa com tela leva o desenho de caixas de cada tela a 1280 e 390 px. Os desenhos aprovados são os
da proposta (`p4-04` a `p4-06`), fora do repositório (delivery L21). Os textos que o cartão não dava
vieram do protótipo `registro-e-avisos-do-membro`, aprovados pelo fundador (P3 (a), P7 (a), P8,
2026-11-21); a versão do Membro que ele desenhava deixou de existir com a `D1` (a)
([screens](../../.agents/skills/conexus-scope/references/screens.md)).

```text
1280 px, Registro de dados (Dono)
┌ Configurações ┬──────────────────────────────────────────────────────────────┐
│ Empresa       │ Registro de dados                              [Exportar]    │
│  Geral        │ Cada leitura que um agente ou um app fez, sem o resultado.  │
│  Pessoas      │ [Pessoa ▾] [Agente ▾] [Tabela ▾] [Resultado ▾]               │
│  Papéis       │ Quando        Quem    Agente      O que         Resultado L. │
│  Registro …   │ hoje 10:02    Bruno   Assistente  sankhya_vendas  Lida     1 │
│               │                       no Projeto Vendedores                  │
│               │ hoje 10:01    Bruno   Assistente  clientes  Não encontrada – │
│               │ hoje 09:58    Carla   Construtor  HubSpot·deals   Lida    20 │
│               │                                     Ver mais (Pager)         │
└───────────────┴──────────────────────────────────────────────────────────────┘
390 px: os filtros num menu "Filtros (2)"; cada linha vira um cartão de duas linhas
(quando · quem · agente / o que · resultado · linhas); a linha aberta ocupa a tela.
```

O filtro Agente e a coluna dão um nome a cada valor de `agent`: Assistente, Builder, Construtor, o nome
do agente salvo e App. A terceira linha acima é a do Construtor, uma leitura ao vivo (R.15). O `Pager`
é o de hoje, com "Primeira página" e "Ver mais" (`apps/web/src/ui/pager.tsx:9-35`): a rota pagina por
chave, sem total (critério 70, R.9).

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `recordReadOf`: um `insert` em `data.data_read` (U1), depois da leitura e antes de devolver | duas leituras, duas linhas; ids diferentes, feitos por quem grava | a leitura no banco da empresa já rodou; sem a linha, nada volta (a regra "sem registro, sem leitura") | Hub calado: `UNRECORDED`; a leitura responde `TABLE_UNAVAILABLE` ou `UNREACHABLE` | `DATA_READ_UNRECORDED` (error, `companyId`, `verb`, a causa, nunca a consulta) | 5, 14, 53 |
| O pior caso de ordem: a linha gravou e a resposta se perdeu | — | uma linha a mais, nunca uma a menos | — | nada novo | 5 |
| `readThrough` com a gravação (U2) | como hoje, pela fila da conexão | o sistema respondeu e a linha não gravou: `UNREACHABLE`, o valor não volta | o sistema calado: a linha grava o resultado `UNREACHABLE` | `CONNECTOR_CALLED` de hoje; `DATA_READ_UNRECORDED` | 11, 13, 14 |
| A consulta recusada pelo plano (U3) | independentes | nada roda depois do `EXPLAIN` além da consulta que já rodou no mesmo pedido; as linhas não saem | o banco da empresa calado: `TABLE_UNAVAILABLE`, como hoje | `DATA_READ_REFUSED` (info, `companyId`, `personId`, sem a consulta) | 16, 17, 19 |
| `funnelOf` → `writeThrough` (U6; o registro de escrita é o de hoje) | `register` com a trava da conversa e a chave (`thread`, `toolCall`): a segunda volta a primeira resposta | `SENDING` gravado e o sistema calado: `WRITE_UNCERTAIN` com a marca | o sistema recusa: `REFUSED` com o nativo | `CONNECTOR_WRITE_*` de hoje | 47, 48, 49 |
| `listDataReads`, `exportDataReads` (U8, só leitura) | independentes | nada a desfazer | Hub calado: 503 `DATABASE_UNAVAILABLE` | nada novo | 70 a 75 |
| **Exportar** (U9), o CSV montado na tela | dois toques: o botão pendente | — | Hub calado: a frase do Hub | nada | 80 |
| `recordAppRead` da borda ao Hub (U10) | o mesmo id duas vezes: `insert ... on conflict do nothing`, uma linha | a borda mandou e a resposta se perdeu: a segunda tentativa não duplica | Hub calado duas vezes: a linha falta; a borda imprime `EDGE_READ_UNRECORDED`. A garantia aqui é "pelo menos uma vez, com uma nova tentativa", dita na página | `EDGE_READ_UNRECORDED` (borda); `APP_READ_RECORDED` não existe: a linha é o registro | 101, 103 |
| A migração dos índices de `data.data_read` (U1, U8) | a segunda implantação recebe `LOCK_BUSY` e tenta de novo (`apps/server/src/platform/migrate.ts`) | uma transação | Hub calado: a implantação para antes de servir | o de hoje | 70 |

## A tabela de referência

Uma linha por peça do roteiro de uso. "Como as referências fazem" diz o que fazem a plataforma de
ingestão, a de catálogo e a de operações, um banco de grafos aberto e duas ferramentas internas
abertas, sem nomeá-las; a citação literal fica no relatório do firstmate, fora do repositório (L21).
Onde a peça destoa das referências ou não tem referência, a coluna Decisão nomeia a decisão do fundador
ou a tela aprovada que a traz (L28).

| Peça | Unidade | Hoje no main | Como as referências fazem | Veredito | Prova, se não for nativo | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A leitura de tabela e a consulta deixam uma linha (`SAMPLE`, `QUERY`) | U1 | `createCompanyData` em `apps/server/src/hub/data/public.ts:32-37`; `sourcesFor(deps, principal, _context)` ignora o contexto (`:39`); nenhum `insert` em `data.data_read` | A de ingestão grava uma linha por pedido de token, com o SQL e sem a resposta (visto); a de catálogo guarda o texto, quem rodou, em nome de quem e quantas linhas, nunca as linhas (documentado); uma ferramenta interna aberta grava uma linha por execução, num ponto só (lido) | embrulhado: a tabela nossa, gravada num embrulho do `read` do contrato; nenhuma biblioteca do stack registra acesso a dado | o rastro do Mastra guarda a saída das ferramentas e expira em 14 dias (`apps/server/src/builder/conversation/storage.ts:5`; a saída no span, lida na 1.82 pelo estudo, relay); o banco da empresa não registra o texto das consultas e não tem extensão de auditoria (documentado) | E4a; spec parte 4, requisito 6 | `apps/server/src/hub/data/record.ts` |
| Uma linha por leitura, gravada depois de ler e antes de devolver | U1 | — | As referências gravam uma linha por pedido; a ferramenta interna aberta grava depois de rodar (lido); um cofre aberto grava por fila, com `on conflict do nothing` (lido) | nativo (`insert` do Drizzle por `database.command`, como `connector_write`, `apps/server/src/hub/connectors/write-record.ts:158-180`) | — | decisão do firstmate R.1 | — |
| A recusa deixa uma linha | U1, U2, U3 | só log: `DATA_READ_REFUSED` (`apps/server/src/hub/data/query.ts:52`) e `CONNECTOR_READ_REFUSED` (`apps/server/src/hub/connectors/read.ts:153`) | A de ingestão grava a consulta fora do escopo como linha de erro (visto); o banco de grafos registra a decisão negada só no log (lido) | embrulhado | — | spec parte 4, requisito 6 | — |
| A leitura ao vivo deixa uma linha (`LIVE`) | U2 | `readThrough` em `apps/server/src/hub/connectors/read.ts:139`, só o log `CONNECTOR_CALLED` (`:203`); chamadores `app-calls.ts:108`, `assistant-port.ts:306`, `builder-port.ts:276`, `copy-port.ts:121` (fica fora), `notes.ts:127` | A de ingestão: o pedido de uma ferramenta ao vivo é uma linha (visto) | embrulhado: a porta atrasada `recordRead`, como `copies: () => ConnectionCopies` (`apps/server/src/hub/connectors/rows.ts:56`), porque `hub/connectors` não importa `hub/data` | — | spec parte 4, requisito 6.3 e 6.7 | — |
| A leitura do esquema do app pelo Builder e pelo agente | U2 | `readAppData` (`apps/server/src/hub/apps/app-database.ts:228`), log `APP_DATA_READ` sem SQL (`:242-260`); chamada por `builder-data.ts:49` e `apps/public.ts:100`; e por `app-tables.ts:73` e `:157`, que ficam fora | A de ingestão: todo `execute_sql` vira linha (visto) | embrulhado: a mesma gravação, verbo `QUERY` | — | requisito 6 | — |
| O plano lê só `sync`; a função e o tipo que leem por nome são recusados | U3 | `syncRelations` filtra só `sync` e não recusa o resto (`apps/server/src/hub/data/query.ts:26-37`); o `EXPLAIN (VERBOSE, FORMAT JSON)` já roda junto (`:140`) | A de ingestão esconde as tabelas de fora do escopo e dá SQL; a de catálogo mostra o nome sem o dado (documentado). Uma ferramenta interna aberta de consulta recusa por lista as funções e as tabelas de sistema que leem por fora (lido no commit `f7a06022`: no arquivo de configuração, `:2550` e `:2598-2600`, a lista de funções proibidas, com `query_to_xml`, e `:2721-2757`, a de tabelas de sistema; no do gerenciador de segurança, `:5650-5662`, a consulta que o analisador não entende) | embrulhado: o plano do PostgreSQL e o `libpg-query` (`docs/reference/stack.md`, data D6), na mesma forma da lista da ferramenta interna aberta. É defesa em profundidade e protege só o nome das tabelas; o conteúdo, quem barra é o login do papel (critério 5 de Cada papel). A recusa do tipo `reg*` e das funções `to_reg*` e `has_*_privilege` é nossa, sem referência; a lista não cresce, e um contorno novo é uma issue | os critérios 16 a 19 | a sua 4(b) (quadro, 2026-11-16, "Sim"); "Tudo A", 2026-11-17 | `apps/server/src/hub/data/plan.ts` |
| A conversa num Projeto lê com o papel | U5 | no Projeto, as tabelas são só as liberadas (`apps/server/src/hub/copies/access-source.ts:10-11`); a consulta lê como o Projeto (`apps/server/src/hub/data/query.ts:57-76`, `:143-145`); a página lê com `{ kind: 'ALL' }` (`apps/server/src/hub/data/rows.ts:18-20`) | A de catálogo: a conversa avalia o dado com o usuário final (documentado); os apps dela no modo do usuário (documentado) | nativo: o login do papel (`apps/server/src/platform/copy-reader.ts:26`) e o cruzamento com `copiesReadBy` | — | a sua C(b); F1 desta página | `apps/server/src/hub/data/place-role.test.ts` |
| `live` e `funnel` ligados no contrato | U6 | `NOT_GRANTED` fixo (`apps/server/src/hub/data/public.ts:43`, `:45`); a porta do Assistente lê e escreve (`apps/server/src/hub/connectors/assistant-port.ts:295-324`) | O banco de grafos faz cada ferramenta chamar o mesmo handler da rota e testa a igualdade (lido) | nativo: a porta que já existe, desenhada na spec parte 3, 6.2 (`docs/steps/trilhas/dados-spec/03-leitura-para-analise/tasks.md:666-720`) | — | R3 "A" | `live.ts`, `funnel.ts` |
| As leis contra a implementação real | U7 | `runDataConformance` (`packages/hub-api/src/company-data-conformance.ts:316`), `make` síncrono, só contra o mundo falso (`company-data.test.ts:211`); a porta já tem as leis (a), (b) e (e) contra o banco de teste (`apps/server/src/hub/access/conformance.test.ts`) | O banco de grafos tem o teste de paridade entre as duas portas (lido); as plataformas não têm (procurado) | embrulhado: `node:test` e as nossas leis | — | spec parte 3, grupos 5 e 6 | `apps/server/src/hub/data/conformance.test.ts` |
| Nenhum caminho novo fora do contrato | U7 | 30 nomes em `.dependency-cruiser-migration.cjs` e `packages/app/src/connectors.ts`; a regra em `.dependency-cruiser.cjs:69` | nenhuma faz | embrulhado: `dependency-cruiser`, que o repositório já usa, e um teste que impede a lista de crescer; a regra de a lista não crescer é nossa, sem referência | — | spec parte 3, 6.1 | — |
| Quem vê o Registro: só Dono e Administrador, no grupo da empresa depois de Papéis | U8, U9 | nenhuma rota; `seeData` aberto a todo membro (`apps/server/src/hub/identity/admission.ts:104`); Papéis admite por `manageRoles` (`admission.ts:107`), e a tela esconde a seção por `needs` e responde não encontrado (`apps/web/src/routes/_app/companies/$companyId_/settings/roles.tsx:27`, `:36`) | A de ingestão registra só o que as credenciais de máquina fazem, os tokens de API e de MCP: dono e admin veem todas as linhas, o membro vê as linhas dos tokens que ele criou; a atividade das pessoas é outra tela, só de dono e admin (documentado). Nas outras referências lidas, o registro de todos é de quem administra, ou de quem ele autoriza por papel, e quem conversa com um agente vê a origem na conversa (documentado) | nativo: uma ação da tabela de admissão (`readDataReads`) e `CompanyMay`, como Papéis | — | `D1` (a) e `D2` (a) (`"D1 a D2 a"`, 2026-11-21); spec parte 4, requisito 7.2 | `apps/server/src/hub/data/reads.ts` |
| A página por chave, da mais nova | U8 | `pageOf`, `pageKey` e `after` (`apps/server/src/platform/pages.ts:12`, `:30`, `:47`), só crescente; o cursor composto de `apps/server/src/builder/automations/runs.ts:37-49` | — | nativo: a chave (hora, id) do PostgreSQL, com o índice | — | — | — |
| A página: lista de 50, filtros, linha aberta, exportar | U9 | nenhuma; `FramedTable` (`apps/web/src/ui/table.tsx:70`), `Pager` (`ui/pager.tsx:9`), `Empty` (`ui/states.tsx:125`); a seção por `staticData.section` (`settings/route.tsx:30-45`) | A de ingestão: filtros por token, status e data, detalhe com o SQL, exportar até 31 dias por vez (visto, documentado) | nativo: as peças de `apps/web/src/ui/`; o teto de 31 dias é o da referência | o critério 82 | telas `p4-04` a `p4-06`; P3 (a), P7 (a) e P8 (2026-11-21); "Tudo A", 2026-11-17 | `apps/web/src/hub/data/data-reads.tsx` |
| O CSV | U9 | nenhum; o único download é por `Blob` (`apps/web/src/builder/conversation/shown-file.tsx:39-48`) | A de ingestão exporta arquivo (documentado) | nativo: `Blob` e `<a download>` | o critério 80 (fórmula desarmada) | — | `apps/web/src/hub/data/csv.ts` |
| A consulta do app publicado | U10 | `db.query` numa transação só de leitura (`apps/edge/src/db.ts:49-61`); `DbProps` sem pessoa (`:10`); a pessoa e o Projeto estão em `call.caller` (`apps/edge/src/dispatch.ts:145-160`) | As duas plataformas registram a leitura de um app no próprio portão, que está no caminho (documentado); aqui o Hub não está no caminho | embrulhado: uma operação nova da borda ao Hub, pela porta que já existe (`apps/edge/src/hub.ts`, `access: 'edge'`), com o id da borda; o aviso é nosso, sem referência | os critérios 100 a 104 | a sua A(b); 3(d); a decisão D do estudo (uma linha por consulta, sem a lista de tabelas) | `apps/server/src/hub/apps/read-notice.ts` |
| A Amostra de uma pessoa na página Dados | fica de fora | `sampleCopy` não passa pelo contrato | As referências divergem | nativo: fica como hoje, fora do Registro | — | a sua B(a) | — |
| A aba Leituras de uma tabela | fica de fora | nenhuma | nenhuma faz por tabela | nativo: o filtro por tabela do Registro (U9) responde | — | corte do estudo | — |

**A medida do transplante.** Nenhuma parte vem do repositório antigo: o `git grep` de
`audit|data_read|read_log|access_log` no commit `e0353c36` não achou registro de leitura.

**A dívida.** O desenho de duas linhas por ato (intenção e desfecho) do estudo único fica para quando
uma escrita passar pela porta com custo (a marca `metered`): ali a intenção antes do efeito vale. Vai
para a seção 11 da arquitetura no fechamento.

**O que o lago troca.** A etapa 3 do lago ("O agente responde pelo lago") reescreve, quando o agente
passar a ler do lago: a U3 inteira, porque o catálogo do lago já responde só com as tabelas de quem lê
e a guarda do plano do PostgreSQL deixa de ter o que guardar; o login do papel da U5, que vira a
etiqueta de quem lê ([0078](../decisions/0078-how-the-lake-knows-who-reads.md)); e o mundo de teste da
U7, ao qual se soma um segundo mundo, que passa as mesmas leis. Com elas, os critérios 3 (em parte), 16
a 19, 42, 55 (em parte) e 56. O gravador, a linha e a tela ficam: no lago, só o Hub chama a consulta,
e o histórico de consultas da AWS guarda o texto por 45 dias, mas não a pessoa, o agente nem a
conversa, e não vê a leitura ao vivo nem a do app.

## As decisões do firstmate

| # | Decisão reversível ([delivery L6](../guides/delivery.md)) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| R.1 | Uma linha por leitura, gravada depois de ler e antes de devolver, no lugar do par `ISSUED` e `SETTLED` do estudo único (seção 4.4 dele) | O banco da empresa responde por um pedido HTTP por transação (`neonTransport`, `apps/server/src/platform/company-postgres.ts:106`, decisão 0043): o `EXPLAIN` e a consulta vão juntos, e não há como gravar a intenção entre os dois. As referências gravam uma linha por pedido. A garantia aprovada ("nunca uma leitura sem linha") fica | Uma coluna `state` e uma segunda linha antes da leitura |
| R.2 | Sem tipo `Permit` no leitor e no executor nesta etapa: a gravação tem um dono só (regra do `dependency-cruiser`, critério 9) e a lei "toda leitura deixa uma linha" (critério 52) | O `Permit` comprava a intenção antes do efeito (R.1); para a escrita, o funil já grava antes de mandar (`register`, `write-record.ts:219`) e confere o papel de novo | O tipo `Permit` com a marca privada, como `Principal` |
| R.3 | A recusa do plano (U3) é uma lista de recusa (`query_to_*`, `cursor_to_*`, `table_to_*`, `schema_to_*`, `database_to_*`, `pg_*`, `to_reg*`, `has_*_privilege`, `current_setting`, `set_config`, e o tipo `reg*`) mais "o plano lê só `sync`", não uma lista de funções permitidas | Uma lista de permitidas recusaria o SQL comum que o modelo escreve (`date_trunc`, `sum`, `coalesce`) sem referência que a sustente; a barreira do motor é o login do papel (critério 5 de Cada papel). A forma é a da lista de proibidas da ferramenta interna aberta (linha da tabela de referência); o `REVOKE EXECUTE` que a U4 propunha saiu ("Tudo A", 2026-11-17) | Trocar por uma lista de permitidas em `plan.ts` |
| R.4 | A linha da consulta do app não leva a lista de tabelas | A borda não sabe que tabelas a consulta leu, e um `EXPLAIN` por consulta dobraria o custo do app (estudo, decisão D) | Um `EXPLAIN` antes no Hub |
| R.5 | A hora da linha é a do Hub (`statement_timestamp()`), também no aviso da borda | `connector_write` faz igual (`write-record.ts:156-177`); uma linha da borda chega no máximo alguns segundos depois | Mandar a hora da borda no corpo |
| R.6 | O agente da linha sai do consumidor do `Principal` (`principal.consumer`, `apps/server/src/hub/access/principal.ts:21`) por uma tabela `Record<Consumer \| 'app', DataReadAgent>` em `record.ts`, e `ReadBy` (`apps/server/src/hub/data/public.ts:13-17`) sai; o contexto passa só a conversa, lida de `RunScope.conversation` (`apps/server/src/builder/controller-kit/run.ts:26`) por `dataContextOf`, e, no agente salvo, o id dele | Um dono só do consumidor e um da conversa (C26): a porta já resolve o consumidor (`principalOf`, `run.ts:209-232`), e a conversa já tem dono na execução; ler `MASTRA_THREAD_ID_KEY` de novo seria um segundo dono do mesmo fato | Um campo `agent` no contexto |
| R.7 | `DataContext` deixa de ser opcional em `createCompanyData`: o compilador acha os três `data` da fábrica | A spec o deixava opcional (`design.md` da parte 4, `C6`); sem a conversa, "Abrir a conversa" não existe | Voltar ao opcional, com a linha sem conversa |
| R.9 | `next` é só o id da última linha, e a consulta busca a hora dela | `PageToken` tem no máximo 64 caracteres (`apps/server/src/platform/pages.ts`); hora e id juntos passariam | Um token de hora e id |
| R.10 | O CSV é montado na tela, a partir do JSON de `exportDataReads` | O contrato só serve JSON (`packages/hub-api/src/operation.ts:15-34`) | Uma rota de arquivo |
| R.11 | Os índices novos de `data.data_read`: (empresa, hora desc, id desc) e (empresa, pessoa, hora desc, id desc), numa migração da U8; o de hoje, (empresa, hora), sai na mesma migração | A página e o recorte por pessoa leem por eles; o de hoje fica coberto pelo primeiro | Manter o de hoje |
| R.15 | O Construtor, que edita um agente (o consumidor `construtor`, `apps/server/src/hub/access/model.ts:37`), aparece no Registro com um valor próprio, `CONSTRUTOR`, e a U1 traz a migração que troca a regra `data_read_agent` (`apps/server/src/hub/data/tables.ts:63`); a tabela está vazia no `main`. Ele grava só leituras ao vivo, porque o seu assento não tem as ferramentas de dados (`apps/server/src/builder/company-tools/names.ts:39`) | Um dono só: `Consumer` já separa `builder` e `construtor`, e a tabela `Record<Consumer \| 'app', DataReadAgent>` (R.6) deixa o compilador recusar o consumidor sem valor. As referências gravam qual agente rodou, e o filtro Agente e **Abrir a conversa** precisam disso: a conversa do Construtor mora em outro endereço (`apps/web/src/routes/_app/companies/$companyId/projects/$projectId_.agents.construtor.$conversationId.tsx`) que a do Builder. Com `BUILDER`, o filtro misturaria quem constrói o app e quem edita um agente, e o link abriria a tela errada | Gravar `BUILDER` e tirar a migração |
| R.16 | O Registro admite por uma ação nova da tabela de admissão, `readDataReads` (`{ by: 'MEMBER', statement: { dataRead: ['read'] }, locks: false }`), com o recurso `dataRead` nos papéis de Dono e Administrador de `rolesFor` (`apps/server/src/hub/identity/roles.ts`), e a tela lê `CompanyMay.readDataReads`; não por `readsAll` dentro da rota | Um dono só de "quem pode" (C26), lido pelas rotas e pela tela, como Papéis (`manageRoles`); dar o Registro a mais um papel no futuro é uma linha na tabela, como as referências que deixam o administrador autorizar outros | Um teste `readsAll(role)` em `reads.ts` |
| R.14 | O aviso da borda vai por `ctx.waitUntil` do `Db` (`apps/edge/src/dispatcher.ts:26`), com uma nova tentativa | O app não espera o Registro (critério 103); o Worker continua até o aviso terminar | Esperar o aviso antes de responder |
| R.17 | O critério 48 afirma `NOT_IN_CATALOG` para agir fora do papel (`D2` do G3) | A porta não lista a ação fora do papel (`hub/access/view.ts`, `actions.filter(inReach)`), e o contrato responde antes do funil (`declaresAction`, `packages/hub-api/src/company-data.ts`); o `NOT_IN_ROLE` do funil já tem o seu teste em `hub/connectors/write.test.ts` | Listar a ação fora do papel na porta, o que muda o que o agente vê |
| R.18 | Toda leitura pedida deixa linha: `NOT_GRANTED` e `CALLS_SPENT`, com ou sem turno, gravam `LIVE` como `NOT_IN_CATALOG` (`D3` do G3) | É a regra da página ("Toda leitura pedida deixa linha, também a recusada"); sem isso, a recusa da porta antes de `readThrough` saía sem linha | Tirar os dois da lista do que grava antes do sistema, e o critério 7 volta a contar 2 |
| R.19 | As leis ao vivo usam as entradas válidas que o mundo de teste declara, num campo aditivo de `DataWorld` (`D5` (c) do G3) | As leis liam ao vivo com entradas inventadas, que um sistema real recusa; a chave é a conexão e a operação, porque o mesmo nome de operação existe em dois sistemas | As leis voltam às entradas fixas, e o mundo real monta um sistema que as aceite |

R.8 (a página vazia ao Membro que filtra outra pessoa), R.12 (a 1135 na U12) e R.13 (quem segue pela
porta) caíram na emenda de 2026-11-21, com a `D1` (a) e a R1 (a).

## U1 O gravador e o contrato

**Base e modelo.** O `main` em `f27128fa`. Opus: muda o contrato de `hub/data` que três agentes de
outra trilha chamam, e fixa a ordem entre o banco da empresa e o do Hub.

### As linhas da tabela

- **O contrato de hoje.** `createCompanyData(deps)` devolve `(principal, context?) => CompanyData`, e
  `sourcesFor` ignora o contexto (`apps/server/src/hub/data/public.ts:32-37`, `:39-47`); `ReadBy`,
  `TurnBinding` e `DataContext` (`:13-29`). O `Principal` e o seu `consumer`
  (`apps/server/src/hub/access/principal.ts:20-29`); `ConsumerContext` e `Consumer` (`apps/server/src/hub/access/model.ts:28-48`). O contrato
  `companyData`, `read` e `act` (`packages/hub-api/src/company-data.ts:312-349`); `ReadAnswer`
  (`:124-160`); `QueryPage.used` (`:209-219`); `queried` (`:290-310`).
- **A tabela.** `dataRead` e as regras (`apps/server/src/hub/data/tables.ts:35-79`): `data_read_agent`
  (`:63`, a lista `DATA_READ_AGENTS` de `:19`), `data_read_live`,
  `data_read_query` (consulta só em `QUERY`, até 4.000), `data_read_counts`; a política por empresa
  (`:77`); `SELECT, INSERT` para `hub_company` (`apps/server/database-grants.sql:437`).
- **O molde.** O `insert` de `connector_write` por `database.command`, com `statement_timestamp()`
  (`apps/server/src/hub/connectors/write-record.ts:158-180`) e o seu teste de tabela
  (`apps/server/src/hub/connectors/connector-write-table.test.ts`).
- **A conversa.** O dono é a execução: `RunScope.conversation`, `THREAD` com o id ou `TRIAL` no teste de
  um rascunho (`apps/server/src/builder/controller-kit/run.ts:18-31`), montado em `:193` e, no agente
  salvo, em `apps/server/src/builder/agents/agent.ts:220-224`. `principalOf(run)` (`run.ts:209-232`) é o
  molde de `dataContextOf`.
- **A fábrica.** `CompanyToolDeps.data: (run: RunScope) => CompanyData`
  (`apps/server/src/builder/company-tools/factory.ts:35`), chamada uma vez por execução (`:204`). Os três
  `data`: `apps/server/src/builder/conversation/builder.ts:66`, `apps/server/src/builder/assistant/assistant.ts:150`
  e `apps/server/src/builder/agents/company.ts:43`; o agente salvo conhece o seu id em
  `apps/server/src/builder/agents/agent.ts:281` (`frozen.agentId`, `:173`). O assento do Construtor não tem
  ferramenta de dados (`apps/server/src/builder/company-tools/names.ts:39`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/data/` (`record.ts` novo, `record.test.ts` novo, `public.ts`, `deps.ts`, `tables.ts`, `data.test.ts`) | Cria o gravador; muda o contrato vinculado; `CONSTRUTOR` entra em `DATA_READ_AGENTS` | `main.ts`; `builder/` pelos três `data` da fábrica |
| `apps/server/migrations/` | Cria uma: a regra `data_read_agent` com `CONSTRUTOR` (R.15); os índices são da U8 | — |
| `apps/server/src/builder/controller-kit/run.ts` | Muda: cria `dataContextOf(run)`, ao lado de `principalOf` | os três `data` e `appDataOf` (U2) |
| `apps/server/src/builder/assistant/assistant.ts`, `conversation/builder.ts`, `agents/company.ts`, `agents/agent.ts` | Muda uma linha cada: passam o contexto; o agente, o seu id | — |
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
  by: Consumer | 'app'                                           // dono: hub/access/model.ts:48
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
type DataReadAgent = (typeof DATA_READ_AGENTS)[number]           // dono: tables.ts:19, com CONSTRUTOR
const AGENT_OF = {
  assistant: 'ASSISTANT', builder: 'BUILDER', construtor: 'CONSTRUTOR', agent: 'AGENT', app: 'APP',
} as const satisfies Record<Consumer | 'app', DataReadAgent>
/** The one writer of data.data_read: one insert in the Hub's database, never in the caller's transaction. */
export function recordReadOf(deps: Pick<DataDeps, 'database' | 'log'>): RecordRead

// apps/server/src/hub/data/public.ts
export type DataContext = Readonly<{
  thread: ConversationId | null                                  // de RunScope.conversation; TRIAL → null
  agentId?: AgentId                                              // só o agente salvo
  turn?: TurnBinding                                             // a U6 lê
}>
export function createCompanyData(deps: DataDeps): (principal: Principal, context: DataContext) => CompanyData
export const recordRead: (deps: DataDeps) => RecordRead          // a porta que main.ts entrega a hub/connectors e hub/apps (U2)
// sai: ReadBy (public.ts:13-17) e o `?` de context

// apps/server/src/builder/controller-kit/run.ts
export function dataContextOf(run: RunScope): Pick<DataContext, 'thread'>
```

- **Cada estado.** `ReadEntry` separa por `verb`, a mesma divisão das regras do banco (C21, C22).
- **Cada id.** `DataReadId` nasce em `recordReadOf` (`randomUUID`) e é conferido pelo esquema na U10.
- **O dono de cada fato.** Os agentes e os verbos: `DATA_READ_AGENTS` e `DATA_READ_VERBS`
  (`tables.ts:19-20`); o limite da consulta: `DATA_READ_QUERY_MAX` (`tables.ts:21`), igual a
  `QUERY_SQL_MAX`; o consumidor: `principal.consumer`, nunca um campo do contexto; o mapeamento
  consumidor → agente: `AGENT_OF` em `record.ts` (R.6, R.15); a conversa: `RunScope.conversation`, lida
  só por `dataContextOf`.
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
   - **Arquivos:** muda `public.ts`, `tables.ts`, `data.test.ts`; cria a migração da regra `data_read_agent`
     por `npm run db:generate` (data D15).
   - **O que sai:** `ReadBy` e o `_context` ignorado; o `?` de `context`.
   - **O que entra:** `createCompanyData` devolve `recorded(companyData(...), entryOf)`: `read` mede o tempo, chama o contrato, monta a linha pelo `kind` (TABLE → `SAMPLE`; QUERY → `QUERY` com `tables` da resposta ou `[]`; OPERATION servida por tabela → `SAMPLE`; OPERATION recusada pelo catálogo → `LIVE`; a OPERATION que chega ao sistema é gravada por `readThrough`, U2), grava e só então devolve; `UNRECORDED` troca a resposta por `TABLE_UNAVAILABLE`. `describe` e `act` passam sem gravar.
   - **Testes:** `record.test.ts`, critérios 1 a 8.
   - **Mutações à mão:** devolva antes de gravar (critério 5); grave também a OPERATION que chegou ao sistema (critério 7, duas linhas).
3. **A conversa nos três agentes.** Critérios: 1, 8.
   - **Arquivos:** muda `controller-kit/run.ts`, `assistant.ts`, `builder.ts`, `agents/company.ts`, `agents/agent.ts`.
   - **Referência a seguir:** `principalOf` (`run.ts:209-232`), um `switch` exaustivo sobre o `RunScope`.
   - **O que entra:** `dataContextOf(run)` dá `{ thread: run.conversation.kind === 'THREAD' ? run.conversation.id : null }`; cada `data` passa `deps.companyData(principalOf(run), dataContextOf(run))`; `agentTools` recebe o `agentId` de `frozen` (`agent.ts:281`) e o junta ao contexto. Nenhum leitor de `MASTRA_THREAD_ID_KEY` nasce em `hub/data` nem na fábrica.
   - **Mutações à mão:** passe `thread: null` em `dataContextOf` (critério 1 vermelho, `thread_id` nulo).
   - **Pronto quando:** `npm run typecheck` acha os três `data` e mais nenhum.
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
- O `main` ganhar um consumidor novo em `Consumer` sem valor em `AGENT_OF`: para e reporta, sem
  escolher o valor.

## U2 A leitura ao vivo e o esquema do app

**Base e modelo.** A U1. Sonnet.

### As linhas da tabela

- `readThrough` (`apps/server/src/hub/connectors/read.ts:139`), `ReadRequest` (`:19-32`; `ReadBy` em `:17`),
  a recusa do papel (`:148-155`), o comentário D22 (`:132-136`) e `CONNECTOR_CALLED` (`:187-203`); a porta
  atrasada `copies` (`rows.ts:56`) e a sua ligação em `apps/server/src/main.ts`.
- `readAppData` (`apps/server/src/hub/apps/app-database.ts:228-260`); `builder-data.ts:46-50`;
  `apps/server/src/hub/apps/public.ts:100`; a ferramenta `app_data_read` (`apps/server/src/builder/app-data/tools.ts:70-90`,
  `:112-115`), dada pela fábrica em `appDataOf` (`apps/server/src/builder/company-tools/factory.ts:164-175`).
- A porta do Assistente lê como o `Principal` da execução (`apps/server/src/hub/connectors/assistant-port.ts:295-324`)
  e é também a do agente salvo e a do Construtor (`apps/server/src/builder/construtor/construtor.ts:86`, `:247-251`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/connectors/` (`read.ts`, `rows.ts`, `public.ts`, `read-record.test.ts` novo) | Muda: `Deps.recordRead` atrasado; a linha `LIVE` | os cinco chamadores de `readThrough` |
| `apps/server/src/hub/apps/` (`builder-data.ts`, `public.ts`, `app-data-record.test.ts` novo) | Muda: a leitura do esquema grava | `conversations-of.ts:95`, a ferramenta |
| `apps/server/src/hub/connectors/assistant-port.ts` | Muda: `by: scope.consumer` no lugar de `'assistant'` (`:226`, `:307`) | — |
| `apps/server/src/builder/app-data/tools.ts`, `builder/company-tools/factory.ts` | Muda: `appDataOf` passa `dataContextOf(scope.run)` | — |
| `apps/server/src/main.ts` | Muda: entrega `recordRead(deps)` às duas portas | — |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/connectors/rows.ts (Deps)
recordRead: () => RecordRead                       // tarde, como copies
// apps/server/src/hub/connectors/read.ts (ReadRequest)
by: Consumer | 'app' | 'copy'                      // sai ReadBy; a porta do Assistente passa scope.consumer
thread?: ConversationId                            // a U6 passa; os outros chamadores não têm
// apps/server/src/hub/apps/public.ts e builder-data.ts
readAppData(input & { thread: ConversationId | null; agentId?: AgentId })
```

O agente da linha `LIVE` sai do mesmo `AGENT_OF` da U1, por `by`: a porta do Assistente passa o
consumidor do seu `Principal` (`assistant`, `agent` ou `construtor`), a do Builder `builder`, a do app
`app`; `'copy'` não grava. Nenhum mapeamento pelo falante: o Construtor e o agente salvo falam como
`PERSON` e `AGENT`, mas o que a linha nomeia é o consumidor.

### As skills e a leitura

As da U1. O guia de dados (D22).

### A ordem do trabalho

1. **`LIVE` em `readThrough`.** Critérios: 11 a 14.
   - **O que entra:** depois da resposta do executor (e na recusa do papel, antes de chamar), `recordRead()(entry)`; `UNRECORDED` troca a resposta por `{ kind: 'UNREACHABLE' }`. Nenhuma conexão do banco aberta durante a chamada (D22).
   - **Mutações à mão:** grave também `by: 'copy'` (critério 12); devolva o valor com `UNRECORDED` (critério 14); deixe `by: 'assistant'` fixo na porta (o caso do Construtor do critério 11 grava `ASSISTANT` e fica vermelho).
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

## U5 A conversa num Projeto com o papel

**Base e modelo.** O G1 mesclado. Sonnet.

### As linhas da tabela

- `accessTables` (`apps/server/src/hub/copies/access-source.ts:7-21`); `copiesReadBy` (`readers.ts`).
- `queryOf` e `projectRead` (`apps/server/src/hub/data/query.ts:57-76`, `:116-150`); `rowsOf`
  (`apps/server/src/hub/data/rows.ts:11-47`); `readers.readAs` e `readerOf`.
- A leitura do app pelo login do Projeto (`apps/server/src/hub/apps/handoff.ts:281`), que fica.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/copies/access-source.ts` | Muda: no Projeto, liberadas ∩ papel, para todo consumidor, o `builder` incluído (F1 (a)) | a porta `hub/access` |
| `apps/server/src/hub/data/` (`query.ts`, `rows.ts`, `place-role.test.ts` novo) | Muda: no Projeto, o login do papel; sai `projectRead` (F1 (a)) | o contrato |
| `apps/server/src/hub/apps/app-read-place.test.ts` novo | Cria | — |

### Os contratos que a unidade cria

Nenhum. `AccessSources.tables` (`apps/server/src/hub/access/model.ts:70`) não muda: com a F1 (a), o
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

O mundo de papéis com um Projeto que recebeu as duas cópias (`plantedBy`, `apps/server/src/hub/copies/test-sources.ts:220`).

### Parar se

- O login do papel não existir para quem conversa num Projeto (`NO_LOGIN`) e o conserto de hoje não o
  criar: para e reporta.

## U6 `live` e `funnel` ligados (a H2a)

**Base e modelo.** A U5. Opus: a ordem de turno, aprovação e idempotência entre dois módulos.

### As linhas da tabela

- O desenho da spec parte 3, 6.2 (`docs/steps/trilhas/dados-spec/03-leitura-para-analise/tasks.md:666-720`).
- `AssistantConnectors.read` e `write` (`apps/server/src/hub/connectors/assistant-port.ts:295-324`);
  `WriteRequest` e `Written` (`write-record.ts:34-64`; o par do falante, `PERSON` ou `AGENT` com `agentId`
  e `number`, em `:47`); `register` (`:221`), `finish` (`:326`); `writeThrough` (`write.ts:160`); `mustAsk`
  (`approval.ts:101`).
- `TurnKey` (`apps/server/src/hub/connectors/scope.ts:5-6`); `TurnBinding` (`apps/server/src/hub/data/public.ts:19-27`),
  que ainda nomeia `VERSION` e que ninguém monta: a issue 1174. O falante `AGENT`
  (`apps/server/src/hub/identity/may-use.ts:29`, `AgentSpeaker` em `:34`).
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
type TurnBinding = Readonly<{ turn: TurnKey; approvedBy?: PersonId }> &
  (Readonly<{ speaker: PersonSpeaker }> | Readonly<{ speaker: AgentSpeaker; agentId: AgentId; number: number }>)
  // o mesmo par de WriteRequest (write-record.ts:47); sai VERSION (fecha a 1174)
// apps/server/src/hub/data/deps.ts
connectors: () => Pick<Connectors, 'assistant'>
// apps/server/src/hub/data/live.ts
export function liveOf(deps: DataDeps, principal: Principal, bound: Readonly<{ turn: TurnBinding; thread: ConversationId | null }>,
  a: Signal & OperationRead): Promise<LiveAnswer>
// apps/server/src/hub/data/funnel.ts
export function funnelOf(deps: DataDeps, principal: Principal, turn: TurnBinding,
  a: Signal & ActRequest): Promise<Exclude<ActAnswer, { kind: 'NOT_IN_CATALOG' | 'CATALOG_UNAVAILABLE' }>>
```

O mapeamento de cada `kind` de `Written` e da leitura ao vivo para o contrato é um `switch` exaustivo
(`satisfies never`), e `since` sai em ISO.

### As skills e a leitura

As da U1. O guia de testes (T26: a leitura ao vivo e a escrita pelo conector falso já gravado).

### A ordem do trabalho

1. **`liveOf`.** Critérios: 7, 45, 46, 50. A recusa da porta ou do turno antes do sistema (`NOT_GRANTED`,
   `CALLS_SPENT`) grava a sua linha `LIVE`, como `NOT_IN_CATALOG`: toda leitura pedida deixa linha
   (R.18). **Mutações à mão:** devolva `NOT_GRANTED` com turno (45 vermelho).
2. **`funnelOf`.** Critérios: 47 a 49. **Mutações à mão:** troque `call.toolCall` por um id novo (47 vermelho).
3. **A 1174.** O `TurnBinding` passa a nomear `AGENT`, e o pull request diz "Closes #1174". **Pronto
   quando:** `rg "'VERSION'" apps/server/src/hub/data` não acha nada.

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
| `packages/hub-api/src/` (`company-data-conformance.ts`, `company-data-world.ts`, `company-data.test.ts`) | Muda: `make(t)` assíncrono; `data?`, `reads()`, `failRecord()` e as entradas ao vivo no mundo; duas leis; sai a lei do sistema só ao vivo (B1 (a)) | os dois mundos |
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
  failRecord(): void | Promise<void>                     // o mundo real derruba o insert por um gatilho
  /* as entradas válidas de cada leitura ao vivo, por conexão e operação, que o mundo declara e as
     leis ao vivo usam no lugar de entradas inventadas: um campo aditivo; o nome é o do braço que mesclar */
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

- Uma das 21 leis de hoje não passar no mundo real: para e reporta a lei; nenhuma lei pula.

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
- A admissão de Papéis, o molde da ação nova: `manageRoles` na tabela (`apps/server/src/hub/identity/admission.ts:107`),
  `admitMember({ tx, companyId, personId, action: 'manageRoles' })` (`apps/server/src/hub/copies/role-copies.ts:154`),
  `CompanyMay` (`packages/hub-api/src/roles.ts:52-63`) montado por `allows` (`apps/server/src/hub/identity/companies.ts:98-104`),
  os recursos dos papéis em `rolesFor` (`apps/server/src/hub/identity/roles.ts`) e o dublê `test-may.ts`
  (`apps/web/src/platform/test-may.ts:9`).
- `pages.ts` (`:12`, `:30`, `:47`) e o cursor composto (`apps/server/src/builder/automations/runs.ts:37-49`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/data-reads.ts` novo, `index.ts` | Cria o contrato | o servidor e a tela |
| `apps/server/src/hub/data/` (`reads.ts`, `routes.ts`, `reads.test.ts` novos; `public.ts`, `tables.ts`) | Cria as rotas; muda os índices | `main.ts` |
| `apps/server/migrations/` | Cria a migração dos índices | — |
| `apps/server/src/hub/identity/` (`roles.ts`, `admission.ts`, `companies.ts`); `packages/hub-api/src/roles.ts`; `apps/web/src/platform/test-may.ts` | Muda: a ação `readDataReads` e `CompanyMay.readDataReads` (R.16) | as rotas e a tela |
| `apps/web/sweep-replies.ts` | Muda: as duas respostas | a varredura |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/data-reads.ts
export const DataReadEntry = z.object({
  id: z.uuid(), at: z.iso.datetime(), person: z.object({ id: PersonId, name: z.string() }),
  agent: z.enum(['ASSISTANT', 'BUILDER', 'CONSTRUTOR', 'AGENT', 'APP']),
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
  path: '/api/companies/{companyId}/data-reads/export', input: { params: InCompany, query: Filters.extend({ from: z.iso.date(), to: z.iso.date() }) }, // to - from <= 31 dias (critério 82)
  success: { status: 200, body: z.object({ reads: z.array(DataReadEntry).max(5000), complete: z.boolean() }) },
  failures: ['NOT_FOUND', 'REQUEST_MALFORMED', 'DATABASE_UNAVAILABLE'] })
```

```ts
// apps/server/src/hub/identity/admission.ts
readDataReads: { by: 'MEMBER', statement: { dataRead: ['read'] }, locks: false }  // Dono e Administrador (D1 (a))
// packages/hub-api/src/roles.ts
CompanyMay = z.object({ /* ...os de hoje... */ readDataReads: z.boolean() })
```

A admissão: as duas rotas chamam `admitMember` com `readDataReads` antes de qualquer consulta; quem não
a tem recebe 404 `NOT_FOUND` (S10), e nenhuma linha é lida. Não há recorte por pessoa: o filtro
`person` só recorta para quem lê. Os nomes: um lote de pessoas e um de Projetos por página.

### As skills e a leitura

`fastify-best-practices`, `drizzle`, `better-auth-best-practices` (a ação nova), `pstack:typescript-best-practices`.
O guia de dados (D15, D19).

### A ordem do trabalho

1. **O contrato e a migração.** Critérios: 76.
2. **A ação `readDataReads`.** Critério: 71. **Mutações à mão:** admita por `seeData` (71 vermelho).
3. **`reads.ts`.** Critérios: 70, 72 a 75 e 82. **Mutações à mão:** ordene só por hora (70 vermelho com
   duas linhas na mesma hora); aceite 32 dias (82 vermelho).

### Como se prova

O banco de teste do Hub com linhas gravadas por `recordReadOf` (U1), nunca por `insert` à mão no teste
de rota (T5).

### Parar se

- O nome da pessoa não sair num lote pela porta da identidade: para e reporta.

## U9 A página Registro de dados (`p4-04` a `p4-06`)

**Base e modelo.** A U8. Sonnet.

### As linhas da tabela

- A seção por `staticData.section` (`apps/web/src/routes/_app/companies/$companyId_/settings/route.tsx:30-45`)
  e a de Pessoas (`settings/people.tsx`); `FramedTable`, `Pager`, `Empty`, `Select`, `Sheet`, `CodeBlock`
  de `apps/web/src/ui/`; o download por `Blob` (`apps/web/src/builder/conversation/shown-file.tsx:39-48`).
- A seção escondida de Papéis: `needs: 'manageRoles'` e `if (!may.manageRoles) throw notFound()`
  (`apps/web/src/routes/_app/companies/$companyId_/settings/roles.tsx:27`, `:36`). O Registro faz o
  mesmo com `readDataReads`, `group: 'company'` e `order: 27`, logo depois de Papéis (`order: 25`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/routes/_app/companies/$companyId_/settings/data-reads.tsx` novo | Cria a rota | o índice de Configurações |
| `apps/web/src/hub/data/` novo (`data-reads.tsx`, `read-detail.tsx`, `queries.ts`, `csv.ts`, `text.ts`, `public.ts`) | Cria | a rota |
| `apps/web/sweep-data-reads-states.ts` novo; `docs/reference/screens.md` | Cria; muda 2 linhas | a varredura |

### Os contratos que a unidade cria

Nenhum do servidor. Os textos em `text.ts`, um dono (C26): as palavras do Resultado (P3 (a)): **Lida**,
**Não encontrada** (todo `NOT_IN_CATALOG`), **Recusada** (`NOT_IN_ROLE`, `QUERY_REFUSED` e o código do
PostgreSQL da consulta de um app) e **Não lida** (o resto), com o código no `title`; "no Projeto {nome}" e "Conversa: no Início" (P7 (a)); a folha
"Ver as leituras", com "Todas" e "Todos"; o diálogo "Exportar", "As leituras dos filtros de agora, num
arquivo CSV. No máximo 31 dias por vez.", "De" e "Até"; o título "Leitura de {quando}"; e "As 5.000
leituras mais novas." (P8). A frase sob o título é a do desenho de caixas.

### As skills e a leitura

A linha `apps/web/src` de `docs/reference/stack.md`: `shadcn`, TanStack Router e Query, `impeccable`
(só os comandos que `docs/reference/impeccable.md` permite). O guia web.

### A ordem do trabalho

1. **O item, a lista e os filtros.** Critérios: 77, 78, 81. **Mutações à mão:** tire o `needs` (77 vermelho).
2. **A linha aberta.** Critério: 79.
3. **Exportar.** Critérios: 80 e 82. O seletor de período não passa de 31 dias e manda `from` e `to`.
   - **Mutações à mão:** tire o apóstrofo do CSV (80 vermelho).
   - **Pronto quando:** a tela olhada a 1366 e 390 px nos dois temas bate com `p4-04` a `p4-06` e com os
     textos da P3, da P7 e da P8.

### Como se prova

A varredura de estados e os testes de navegador de hoje (`npm test -w @conexus/web`).

### Parar se

- A conversa de um `threadId` não tiver endereço conhecido para um agente: a linha mostra a conversa
  sem **Abrir a conversa**, e o pull request o diz.

## G4 O ponto de conferência

Os testes de `hub/data`, de `hub/identity` e de `apps/web/src/hub/data`; `npm run check`; a QA começa
depois deste.

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

## G5 O ponto de conferência

Os testes da borda e de `hub/apps`; `npm run check`; o Hub local com a borda local (`wrangler dev`) e um
app de exemplo que consulta: a linha `APP` lida com `psql`.
