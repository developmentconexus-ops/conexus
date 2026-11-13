# A Ontologia da empresa

O fundador, em 2026-11-12, sobre o cartão anterior, e a régua deste: "tem que ter tudo isso, tá? Tem
que ter, senão a gente perde as informações. E verificar como que a gente vai implementar isso".

É a etapa 1 da lista "O Brain e a Ontologia" do [roteiro](../roadmap.md), no trilho de frente,
depois da política de dados pessoais dos conectores e antes da Capacidade 4 (`A1` e a ordem dos
cartões de 2026-11-12). O Sync de qualquer conector fechou (PR 991). Este cartão espera no seu
rascunho até a política de dados pessoais fechar (delivery L5); até lá a verificação `second-card`
fica vermelha, porque o trilho de frente tem o cartão da política e este.

Sete estudos, fora do repositório (delivery L21), traçaram as referências: os quatro do Brain e da
Ontologia que fundaram as decisões 0064 e 0065, o estudo da Ontologia (o princípio, a modelagem, o
lugar no código e quem a usa), o estudo do exemplo, que rodou um CRM sobre um ERP real de ponta a
ponta num protótipo descartável e decidiu trinta escolhas, e o estudo do metamodelo, que comparou
peça por peça o Palantir (a documentação e os dois SDKs), o Fabric IQ, o OCEL 2.0, o SAP e o
schema.org. O fundador adotou o metamodelo como a referência oficial da Ontologia ("1. Sim"). Os
estudos do G4 OS ensinam só estrutura: nenhum texto dele entra aqui. O que vale para as etapas
seguintes está nas decisões
[0064](../decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md),
[0065](../decisions/0065-brain-on-mastra-knowledge-behind-our-isolation.md) e
[0067](../decisions/0067-ontology-metamodel-palantir-core-roles-and-named-links.md); o que vale para
esta etapa está aqui.

Cada linha citada foi lida no código do dia: `main` em `0bcea104` (2026-11-12, com o Alinhamento do
Assistente, PR 976, e o fechamento do Sync, PR 991). As versões:
`@mastra/core` 1.82.0, `@mastra/pg` 1.35.0, `drizzle-orm` 1.0.0-rc.4, `zod` 4.6.5. A prateleira:
`twenty@b76d0217`, `budibase@624d68a`, `airbyte@8aed3123` e os dois SDKs do Palantir,
`osdk-ts@2e21feec` e `foundry-platform-typescript@75fe1c05`. As páginas públicas do Palantir
Foundry, do Fabric IQ (learn.microsoft.com), do OCEL 2.0 (ocel-standard.org e o artigo
arxiv.org/html/2403.01975) e do schema.org foram lidas em 2026-11-12. O builder de cada unidade
parte do commit que fechar a política de dados pessoais, com o Alinhamento fechado (a U5 toca o que ele
mudou: `assistant.ts`, `instructions.ts`, `connector-tools.ts`), e relê nele cada linha citada.

O exemplo do roteiro, uma distribuidora inventada que pede um painel de vendas por representante,
ilustra; nunca é regra. O metamodelo é genérico: nenhuma peça nasce do caso de uma empresa, e qual
forma um papel toma numa empresa é proposta do Builder pelos dados dela (o princípio, abaixo). Os
códigos, as contagens e os nomes de pessoa do exemplo são inventados. Nenhum nome de tabela, coluna, código ou contagem do ERP
da empresa entra no repositório; onde um builder precisa do nome de uma tabela do dicionário do
Sankhya, ele está na skill do conector (`packages/connectors/src/sankhya/skill/SKILL.md:45-54`).

## As palavras do fundador e as decisões

Todas de 2026-11-12. As anteriores, que este cartão herda, estão nas decisões 0064 e 0065.

- `"A1 B1 C1"`, `"F1"`, "D Aprovado" (decisão 0064): a Ontologia entra depois do Sync e antes da
  Capacidade 4; nada do que um agente aprende vale antes de uma pessoa aprovar; ao ligar um sistema
  só o inventário mecânico, e a proposta nasce com a primeira demanda; o dono aprova a primeira
  revisão.
- Ao estudo da Ontologia: "L1" (uma permissão nova, "Conceitos da empresa", de dono e administrador,
  aprova as revisões depois da primeira); "P1" (o Hub lê e acrescenta; muda só o estado e a decisão; uma
  revisão e uma prova nunca mudam nem saem; o inventário se troca por rodada; nada se apaga, salvo
  na saída da empresa); e, sobre a M: "Pare de focar nos apps, primeiro vamos fazer a
  harness completa do builder e suas capacidades, e temos até isso no roadmap, temos as capacidades a
  implementar e depois de acordo com estudos profundo que fizemso de Kiro, Mitra e outros
  desenvolvimentos montar como realmente vamos utilizar a harness do builder para construção de apps
  objetivo é adicionar todos os recursos necessários primeiro".
- Logo depois, o pedido do exemplo: "Pegar um exemplo real, como que isso vai ser, como que isso vai
  ser em código, como que, por exemplo, dentro do app eu editaria, eu veria isso. [...] Ou tá muito
  mal planejado e o builder que teria que decidir isso, sabe? A gente não pode deixar na mão, a gente
  tem que decidir tudo."
- Ao estudo do exemplo: "Q1 / R1" (`Q1`: qualquer membro propõe uma mudança pela tela; só quem tem
  "Conceitos da empresa" aprova. `R1`: quem propôs pode aprovar a própria proposta; a revisão grava
  quem propôs e quem aprovou).
- À issue 984 (o link sem área no Brain): "Pode".
- A Ontologia é da empresa: um módulo do Hub, como as Cópias, nunca definida dentro de um app. Um app,
  depois, só declara os conceitos que lê e recebe os tipos gerados.
- À ordem dos cartões: "Tudo o que voce recomenda" (a política de dados pessoais antes da
  Ontologia).
- Ao protótipo da página Conhecimento: "1. Aprovado" (uma página própria, Conhecimento, no menu da
  esquerda depois de Cópias, aberta a todo membro, e não dentro de Configurações) e "2. Em faixas"
  (o grafo dela abre em faixas: memória, conceitos, sistemas). Antes, sobre o protótipo que punha
  tudo em Configurações: "o que eu queria era mais uma página, igual a gente tem a página de cópias".
- Ao estudo do alinhamento, que testou o metamodelo em seis tipos de empresa: "1. A" e "2. A". A
  primeira mantém a ordem (esta etapa, depois o fluxo, depois a saúde): a etapa do fluxo marca a
  passagem entre dois sistemas como sem ligação (`NONE`), e "Ligações e duas fontes" vem logo depois
  da saúde, subindo antes dela se o próximo cliente tiver dois sistemas no fluxo principal. A
  segunda organiza a página Conhecimento em duas metades, "Como a empresa é" e "O que a empresa
  sabe", juntas no conceito e no passo do fluxo; o desenho já tem o lugar do fluxo, vazio até a
  etapa do fluxo, e esta etapa constrói as abas que já tinha. A terceira pergunta do estudo (se a
  entrada escreve um mapa da empresa) espera a entrada conversada, que volta depois do Brain e da
  Ontologia.
- Ao desenho v3: "Cara, eu acho que ficou bom as telas. Só que eu criei uma tela inicial em que
  mostra todos os conhecimentos, igual a tela que eu te mostrei do Mastra, Studio sobre o
  Knowledge. [...] tipo um Obsidian, sabe? [...] Era vários tipos de documento, bolinhas e por
  setor". Depois: "Lembrando, eu não quero que você copie o que eles têm, eu quero que você seja
  criativo", a pergunta de como a Ontologia entra no desenho ("Não sei se é agora que a gente já vai
  pensar nisso, né? Mas se for depois, a gente espera.") e a licença para olhar bibliotecas como o
  three.js. As telas v3 ficam como estão; o Mapa é a tela que abre Conhecimento e leva a elas.
- Às duas decisões do Mapa, em 2026-11-13: "1. Não gostei de nenhum tudo ficou muito básico, sem
  design" (as direções A, B e C saem, e o desenho do Mapa volta para uma rodada nova) e "2 Okay" (o
  Mapa se constrói com o cartão do Brain).
- Ao estudo do metamodelo: "1. Sim" (adotar o metamodelo como a referência oficial). Sobre o caso da
  empresa dele: "Quero etnender melhor, porque não quero criar uma solução fraca pensando
  especificamente nesse caso de exemplo que é minha empresa" e "Mas porque estamos vendo esse caso
  da [empresa dele]? Tipo porque está perguntando isso? Para levantar o exemplo?". Antes: "não é
  para a gente querer criar uma ontologia dos zeros [...] Quero utilizar coisas que são validadas,
  estudadas e consolidadas".
- Às três perguntas do G4 que este cartão deixava abertas. Ao estudo da memória do G4: "B Sim" (a
  nota pessoal vale na hora e a pessoa corrige na tela), "C sim" (o que vale para a empresa toda o
  Assistente oferece no cartão `propose_company_memory`), "D Por agora não" (um fato não vence). Ao
  estudo de vínculos: "E1a. Sim" e "E1b. Sim" (as áreas são as equipes do Better Auth; os membros
  leem a pasta da área, e a responsável e o administrador escrevem); a E2a e a E2b, "Não, beleza,
  eu concordo com você" e, logo depois, "Vamos fazer igual você falou, então" (o vínculo de um
  usuário de um sistema a um membro mora numa tabela do Hub e só se constrói quando o primeiro app
  pedir "o meu"; quem entra com a própria conta não precisa de vínculo).

## A página do fundador

**No fim desta etapa** você pede um app de vendas ao Builder e ele propõe, com a prova, os conceitos
que o app precisa: as coisas do negócio (um Parceiro, um Documento), os papéis delas (um Cliente é um
recorte do Parceiro), os conceitos com dados próprios ligados a outro (um Representante, com o seu
cadastro, ligado ao seu Parceiro), os campos, o que cada código quer dizer, as ligações com nome
("veio de", "atendido por") e de onde cada um é lido. Você aprova na página Conhecimento, e daí em
diante o Builder e o Assistente respondem pelos conceitos aprovados, sem reler o ERP a cada conversa.

**O roteiro de uso**, no Hub no ar, numa empresa de teste com o Sankhya de teste ligado. A empresa é
uma distribuidora inventada; os nomes, os códigos e as contagens também.

1. Na página da conexão do Sankhya aparece "Inventário: 812 tabelas, 9.310 campos, 2.140 códigos,
   lido em 12/11 às 09:00" e o botão **Ler de novo**. No menu da esquerda, depois de Cópias, está
   **Conhecimento**, aberta na metade **Como a empresa é**: o lugar dos fluxos diz "Nenhum fluxo
   ainda.", e a aba Conceitos diz "Nenhum conceito aprovado ainda."
2. Você pede ao Builder "um painel de vendas por representante". Ele diz que leu o inventário,
   pergunta só o que o dicionário não diz ("o que é a operação 101 na sua empresa?") e mostra o cartão
   "Proposta: 5 conceitos para Um painel de vendas por representante" (Parceiro; Cliente, papel de
   Parceiro; Representante, ligado ao seu Parceiro; Documento; Origem do item, a junção que diz de que
   documento um documento veio), com a fonte e as linhas da prova de cada um, e **Revisar e aprovar**.
3. Em Conhecimento › Para revisar, você aprova tudo menos um código ("Bonificação não é venda") e
   toca **Aprovar 29 e recusar 1**. A aba Conceitos mostra Parceiro, "Cliente · papel de Parceiro",
   Representante, Documento e Origem do item, e Histórico mostra "Revisão 1, proposta pelo Builder na
   conversa de Dono, aprovada por Dono".
4. Um administrador e um membro entram. Os dois veem Conhecimento e **Sugerir mudança** num código; o
   membro propõe "a 101 é o pedido do representante". O membro vê "aguarda quem cuida dos conceitos"
   e nenhum botão de aprovar; o administrador aprova, e Histórico mostra "Revisão 2, proposta por
   Membro, aprovada por Administrador".
5. Você pergunta ao Assistente "quantos documentos deste mês o representante 42 atendeu, por tipo de
   operação?" e "quantos clientes temos?". A primeira traz cada tipo com o seu significado ("101,
   Pedido do representante"); a segunda conta o papel pela fonte dele. O registro da conversa mostra
   a ferramenta `concept_query` nas duas.
6. Você pergunta "o que é um Cliente aqui?" e ele responde pelo conceito aprovado (o registro mostra
   `concept_read`): "um papel de Parceiro: o parceiro marcado como cliente", com os campos e as
   ligações, sem nenhum valor dos seus dados.
7. A página da conexão não mostra mais o caderno. As notas antigas estão em Para revisar como "Do
   caderno", à espera de serem refeitas com prova.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página (as palavras de que ela
depende, `L1`, `P1`, `M`, `Q1`, `R1`, o metamodelo, a página Conhecimento e as duas metades
dela, você já deu em 2026-11-12). Ao montar U1: a lista de permissões do banco das tabelas novas vai num pull request
próprio, com a sua palavra (dados D11); ela é a `P1` escrita linha a linha. No fim: faz o roteiro na
empresa de teste e na sua, diz o que viu e aprova os textos das telas.

**Fica de fora.**

- **Os apps pelos conceitos** (a visão `ontologia.<conceito>` no banco da empresa, `concepts` no
  manifesto, `defineConcepts`, o arquivo `shared/ontologia.ts` gerado, a checagem na publicação e o
  login de leitura do Assistente): pela sua `M`, depois da harness do Builder e das capacidades. O
  estudo do exemplo deixou as respostas prontas para esse cartão; elas estão em "O que os estudos
  deixaram", e nada aqui as constrói.
- **O fluxo da empresa** (os estados de uma coisa, as passagens e o que move cada uma, e a
  pergunta que atravessa ligações, como "quantos orçamentos viraram pedido"): a etapa seguinte, no
  molde do Machinery do Palantir. A passagem se lê dos documentos, como no OCEL, ou do histórico de
  mudanças do sistema, onde o estado muda no mesmo registro; uma coisa pode ter mais de um fluxo, e
  cada passagem diz em palavras o que a move (até a data). Esta etapa só desenha o lugar do fluxo,
  vazio. `concept_query` não atravessa ligações, de propósito.
- **A metade "O que a empresa sabe"** da página Conhecimento ("2. A"): as páginas do Brain por
  área, e, na página de um conceito, as páginas que o citam. Entra com o cartão do Brain, que leva
  para ela a memória da empresa de Configurações. Esta etapa constrói a metade "Como a empresa é"
  (as abas Conceitos, Para revisar e Histórico, e o lugar do fluxo, vazio), e a página abre nela.
- **O Mapa**, a tela que abre Conhecimento, construído com o cartão do Brain ("2 Okay"). É um grafo de
  tudo o que a empresa é e sabe. As coisas da Ontologia ficam entre as áreas que as citam, e as
  páginas do Brain ficam dentro da ilha da sua área, cada tipo com o seu ponto. As ligações levam o
  "um" e o "muitos". O primeiro toque abre a lente da coisa (os papéis, as ligações, os códigos e o
  lugar do fluxo, vazio), e o segundo abre a tela v3 dela. O Mapa chega inteiro com o cartão do
  Brain, que traz as páginas e as áreas. Esta etapa não o constrói e não muda nada do que já
  constrói: a página continua abrindo em "Como a empresa é". O desenho está em "Os desenhos de
  caixas", e ele substitui o "2. Em faixas".
- **A saúde da Ontologia** (a prova refeita todo dia, o aviso no Início): a etapa 4 da lista. Esta
  etapa grava as provas que ela vai ler, e já tira dos agentes um campo cuja coluna uma prova nova viu
  mudar de tipo.
- **As páginas dos conceitos no Brain** (a antiga U6: as páginas `ontologia:` depois de cada
  aprovação e as regras de link da issue 984): vão para o cartão seguinte do Brain. Com o metamodelo,
  a etapa passou do orçamento, e a regra da própria etapa manda tirar esta unidade primeiro; ela
  está escrita inteira na última seção, para aquele cartão partir dela. Até lá o Assistente responde
  "o que é" pelo conceito aprovado, não por uma página do Brain.
- **Em aberto: as ligações que o dicionário declara, no inventário** (um tipo `LINK` ao lado de
  tabela, campo, código e operação). O estudo do metamodelo recomenda guardá-las, para o Builder
  propor uma ligação certa na primeira vez, mas não gravou a forma das tabelas de ligação do
  dicionário; sem ela, um builder teria de pesquisar. Fica aberta até um estudo gravar essa forma,
  e entra no mais tardar com "Ligações e duas fontes".
- **Duas fontes para um conceito**, a interface (uma forma comum a dois conceitos, como o cliente de
  um ERP e o comprador de uma loja virtual), as ligações sugeridas pelo inventário e as escritas
  ligadas a um conceito: etapas próprias.
- **A contagem de linhas por tabela no inventário.** Contar cada tabela do ERP seria uma consulta por
  tabela; nenhum estudo achou uma leitura só que dê o número. As contagens nascem com a prova de cada
  demanda. Por isso o passo 1 diz tabelas, campos e códigos, e não "com dados".
- **As três perguntas do G4 OS**, que você respondeu em 2026-11-12 (as suas palavras, acima): um fato
  aprendido não vence, por agora; a memória de cada pessoa fica separada da da empresa (ela já
  existe, `apps/server/src/builder/assistant/profile-memory.ts`); as pessoas e as áreas não são
  conceitos da Ontologia: as áreas são as equipes do Better Auth, e o vínculo de um usuário de sistema
  a um membro é uma tabela do Hub do primeiro app que pedir "o meu". Nada disso se constrói aqui: é
  do cartão do Brain e do cartão dos apps. O cargo e a área de cada membro continuam onde estão
  (`apps/server/src/hub/identity/tables.ts:240-241`).
- **Os avisos guardados para um cartão** (`next-card`): esta etapa leva o #814 (quem grava no caderno:
  com a proposta, todo membro propõe e só "Conceitos da empresa" aprova, pela `Q1`) e o #815 (a
  memória do app guardando códigos que o caderno prova: o Builder passa a ler o código com o seu
  significado pelo conceito). Os outros são de cópias, apps, papéis, ferramentas e da 24.6, e esperam
  o cartão de cada um.

**O que mudou nesta versão** (2026-11-12, as suas respostas "1. A" e "2. A" ao estudo do
alinhamento): a página Conhecimento ganha as duas metades e o lugar do fluxo, vazio (o roteiro, o
passo 1); o fluxo, que fica de fora, se lê também do histórico do sistema; o cartão não espera mais o
da entrada conversada, só a política de dados pessoais. Depois, ao desenho v3: o Mapa, a tela que
abre Conhecimento, desenhado aqui e construído com o Brain. Em 2026-11-13, as suas respostas às duas
decisões do Mapa: o Mapa se constrói com o cartão do Brain, e as direções A, B e C saem.

**As decisões suas nesta etapa.** Uma, sobre o Mapa, e ela não muda o que esta etapa constrói.

- **Qual desenho.** Em aberto: você recusou as direções A (Linhas), B (Arquipélago) e C (Roda)
  ("tudo ficou muito básico, sem design"), e as novas direções chegam numa rodada própria. Qualquer
  uma guarda a verdade dos dados: uma coisa não tem setor, só a página tem área.
- **Quando ele se constrói: decidido**, com o cartão do Brain ("2 Okay", 2026-11-13). Sem as
  páginas e as áreas, o Mapa desta etapa seria cinco pontos soltos, e esta etapa não ganha uma U6.

O three.js volta a ser opção na rodada nova, se a direção pedir e o Mapa continuar legível e
acessível, no celular também.

As escolhas técnicas convergem nas referências e
estão no metamodelo e na tabela de referência. A forma de cada papel numa empresa (recorte ou
conceito ligado) é proposta do Builder, provada pelos dados dela, e decisão de quem cuida dos
conceitos, nunca uma regra do produto.

## O que os estudos deixaram para esta etapa

### O princípio

A Ontologia é o dicionário aprovado do negócio da empresa: que coisas existem, os campos e o que cada
código quer dizer, como uma se liga à outra e de onde cada uma é lida, com a consulta que provou. É o
serviço de metadados do Palantir sem o banco de objetos: o banco de objetos do Conexus já existe, são
as cópias do Sync no banco da empresa (`apps/server/src/platform/copy-sql.ts:8-12`), e o serviço de
ações é o funil de escrita dos conectores (decisão 0062). Ela não guarda dados (só nomes e códigos),
não é o Brain (o Brain é texto; uma regra do Brain cita um conceito), não é uma cópia do ERP (só entra
o que uma demanda precisou, foi provado e aprovado) e não é o inventário (o inventário é a lista
mecânica do que cada sistema declara).

É um assunto do Hub, `apps/server/src/hub/ontology/`, sem pacote novo: a regra C5 só pede pacote entre
programas, e nenhum outro programa roda código dela. Reabre quando um segundo programa precisar do
modelo (por exemplo uma porta MCP, como o OMCP do Palantir).

As regras de fronteira: só `hub/ontology` escreve nas tabelas `ontology.*` (C8); o kit de conectores
nunca conhece a Ontologia (recebe uma consulta provada, colunas e filtros tipados); o modelo nunca
grava uma revisão (só a rota de aprovação); toda leitura de dados que nasce de um conceito roda por um
caminho que já existe, a porta do conector e o executor único (decisão 0056).

### O metamodelo

A Ontologia modela as coisas, os papéis e as ligações com nome; o fluxo é a etapa seguinte. O
metamodelo segue o Palantir no núcleo, o SAP e a herança do Fabric IQ no papel, e o OCEL 2.0 nas
ligações de um documento; o fluxo, na etapa "O fluxo da empresa", segue o Machinery do Palantir
(decisão [0067](../decisions/0067-ontology-metamodel-palantir-core-roles-and-named-links.md)). O
Palantir é a única referência com o ciclo inteiro em produção (o tipo, a ligação, o estado do tipo, a
proposta, a ação e o fluxo); as outras completam o que ele não tem como peça.

| Peça | A referência, nas suas palavras | No Conexus | Unidade |
| --- | --- | --- | --- |
| Conceito | Palantir, object type: "the schema definition of a real-world entity or event" (`object-link-types/object-types-overview/`) | `concept_version` | U1 |
| Campo | Palantir, property; o valor no tempo do OCEL não, porque a Ontologia não guarda valor | `field_version` | U1 |
| Código com significado | o Palantir não tem pronto; Twenty, `{value, label, position}` | `code_version` | U1 |
| Ligação | Palantir, link type, "exactly two sides", por chave estrangeira ou tabela de junção (`object-link-types/create-link-type/`) | `relation_version`; uma ligação por junção pode ligar um conceito a ele mesmo | U1, U3 |
| Ligação com dados | Palantir, object-backed link: "carries its own metadata (dates, roles, status, allocation)" (`ontology/ontology-structural-guidance/`) | a junção já é um conceito (`through`) | U1 |
| Papel | Fabric IQ, herança: "a derived entity type has at most one base entity type" (`how-to-use-inheritance`); SAP, o papel do parceiro de negócio; Palantir, "Customer (single canonical type)" (`ontology/ontology-best-practices/`) | `concept_version.base`, nas duas formas abaixo | U1, U3 a U5 |
| O papel numa ligação de um documento | OCEL 2.0, o qualificador, "in which role an object takes part in an event" (arxiv.org/html/2403.01975, a tabela `event_object`) | o nome de cada lado da ligação (`from_name`, `to_name`): "atendido por", "veio de" | U1 |
| Estado do conceito | Palantir, statuses; o deprecated leva "A description for why" e "The resource that is meant to replace" (`object-link-types/metadata-statuses/`) | `state` e `replaced_by`; o prazo do Palantir não, porque nenhum app lê conceitos ainda (`M`) | U1, U4 |
| Proposta e revisão | Palantir, "analogous to a Pull Request" (`ontologies/review-ontology-proposals/`); Fabric IQ, "a proposal-first model" | `proposal`, `revision` | U3, U4 |
| Fonte com prova | Fabric IQ, "Source data remains in the system that owns it" (`how-to-bind-data`); Palantir, "A single datasource can only be used to back one object type" | `source_version` e `proof_run` | U1, U3 |
| Regra em texto | Fabric IQ, rule: "Ontology doesn't run the rule against data or execute actions" (`how-to-use-rules`) | uma página do Brain que cita o conceito por link (0065) | o Brain, depois |
| Estado do negócio, passagem, fluxo | Palantir Machinery: os estados "must be enumerable", e as ações "are the cause of state transitions"; o que não cabe num estado só, "a process hierarchy" (`machinery/core-concepts/`), e o histórico de mudanças como fonte; OCEL, o log | a etapa "O fluxo da empresa": a passagem lida dos documentos ou do histórico, mais de um fluxo por conceito, o que move cada passagem em palavras | depois |
| Ação | Palantir, action type | a escrita declarada do conector (0062), ligada a um conceito depois | depois |
| Interface, campo compartilhado, tipo de valor, grupo de tipos | Palantir (`interfaces/interface-overview/`, `shared-property-overview/`, `value-types-overview/`, `type-groups/`) | fora agora: nenhum segundo leitor; a interface reabre em "Ligações e duas fontes" | — |
| Banco de objetos, biblioteca de consulta do SDK | Palantir, Funnel e Object Set Service; no OSDK, `where`, `fetchPage`, `$link` | fora: o banco de objetos são as cópias do Sync, e a consulta dos apps é o `db` | — |

As páginas do Palantir estão sob `https://www.palantir.com/docs/foundry/`, as do Fabric IQ sob
`https://learn.microsoft.com/en-us/fabric/iq/ontology/`. As frases do OCEL, do SAP e do schema.org
passaram por um leitor que resume a página (o estudo do metamodelo diz o limite).

**As duas formas do papel.** As referências usam duas, e o Conexus tem as duas, para qualquer
empresa:

- **O papel como recorte de um conceito base** (Fabric IQ e SAP). "Cliente, papel de Parceiro": o
  conceito declara `base`, tem a mesma chave da base e a sua própria fonte provada, e a prova extra é
  uma contagem: as linhas do papel sem par na base devem ser zero (`ROLE_NOT_SUBSET`). Como no Fabric,
  ele herda o "é um", não a fonte nem as ligações: o agente segue o "é um" até a base. Não nasce um
  segundo tipo sobre a mesma coisa, que o Palantir proíbe; nasce um recorte nomeado e provado de um
  tipo só.
- **O conceito com chave própria ligado a outro** (o papel com dados próprios do SAP; no Palantir, um
  tipo distinto ligado ao canônico). "Representante": um conceito comum, com o seu cadastro, a sua
  chave e os seus campos, e a ligação "é o parceiro" até o Parceiro. Esta forma já cabe nas peças do
  cartão; a emenda só a nomeia.

Qual forma um papel toma numa empresa sai dos dados dela, nunca do produto: o Builder propõe a forma
que o inventário e a prova mostram (um recorte, quando o papel é uma marca ou um perfil do cadastro
base; um conceito ligado, quando o papel tem um cadastro próprio, com a sua chave), e quem tem
"Conceitos da empresa" aprova. Nenhum nome de papel vem pronto, e nenhuma regra do produto escolhe
entre as duas. Três conceitos soltos para a mesma coisa seriam o que o Palantir chama de "Department
Silos", "Each department creates their own version of shared entities", e o agente contaria a mesma
pessoa três vezes; a interface só serve a dois tipos diferentes com uma forma comum, e hoje nenhum
leitor a pede.

### As trinta escolhas do exemplo, e onde cada uma entra

| # | Escolha | Neste cartão | Onde |
| --- | --- | --- | --- |
| 1 | Cada elemento é uma versão imutável por revisão; o atual é uma visão; aposentar é uma versão | igual | U1 |
| 2 | A revisão leva o hash sem ser alterada | **corrigida**: a revisão entra primeiro, com o hash calculado no servidor antes das versões; o Drizzle instalado não declara chave adiada | U1, U4 |
| 3 | Duas aprovações ao mesmo tempo | igual: a chave `(company_id, number)`; o `23505` vira `REVISION_STALE` | U4 |
| 4 | O tipo `ID`: filtra por igual e lista, agrupa, nunca soma | igual | U1, U5 |
| 5 | Uma linha por código, com origem `DICTIONARY` ou `PERSON` | igual | U1 |
| 6 | O rótulo do dicionário quando ele tem; a pessoa quando não; os dois por proposta | igual | U2, U3 |
| 7 | A chave do Pedido é o número único, nunca o número que a pessoa vê | exemplo; a regra geral é "uma lista de 1 a 4 campos que não se repete" | U1 |
| 8 | O campo se prova pela forma da prova da fonte; o código pelo inventário ou por uma contagem | **corrigida**: o código se prova por uma contagem; o inventário não conta linhas | U3 |
| 9 | Uma fonte por conceito, de um sistema | igual; a cópia da fonte fica para os apps | U1 |
| 10 | O filtro da cópia estruturado, nunca SQL livre | fica para os apps | — |
| 11 | Duas ferramentas fixas sobre descritores | igual, com os nomes do repositório: `concept_read` e `concept_query` | U5 |
| 12 | Zod montado das linhas; o JSON por `z.toJSONSchema` | igual | U5 |
| 13 | A SQL ao vivo é uma capacidade do kit, `conceptRead` | igual; **entra na U3**, a primeira que a usa (a contagem de um código) | U3 |
| 14 | Data e página no Sankhya | **corrigida**: só `OFFSET 0 ROWS FETCH NEXT`, sem `pular`; o kit e o dublê só escrevem e rodam essa forma | U3, U5 |
| 15 | `measure: { count, sum, groupBy }` | igual | U3, U5 |
| 16 | Um código volta ao agente como `{ value, meaning }` | igual | U5 |
| 17 | O catálogo é a interseção e é refeito na execução | igual | U5 |
| 18 | A permissão L1 | igual na regra; **corrigida** no lugar: a rota responde `mayApprove`, como a memória da empresa, sem campo novo em `CompanyMay` | U4 |
| 19 | O caminho no Brain: `conceitos/<chave>` e `conceitos/<chave>/<campo>` | igual | o cartão do Brain (a antiga U6) |
| 20 | O número da revisão fora do corpo da página | igual | o cartão do Brain (a antiga U6) |
| 21 | O link sempre com área; nome solto recusado; nunca `read: 'all'` | igual (issue 984) | o cartão do Brain (a antiga U6) |
| 22 | Quem é avisado quando um significado muda | fica para a saúde; a projeção no Brain grava os links que a tornam possível | o cartão do Brain |
| 23 | A saúde é uma visão sobre as provas | a visão fica para a etapa da saúde; a U1 grava as provas | — |
| 24 | Coluna que mudou de tipo sai dos descritores | igual | U5 |
| 25 a 29 | A visão do app: ordem das colunas, campo aposentado, campo fora da cópia, `GRANT` por visão, tipos como texto | ficam para os apps, com estas respostas | — |
| 30 | A página do Brain se refaz depois da transação e é idempotente | igual | o cartão do Brain (a antiga U6) |

O que o cartão dos apps já tem pronto, para não decidir do zero: a visão `ontologia.<conceito>` com
`security_invoker = true`, dona `conexus_sync`, só cresce no fim (`CREATE OR REPLACE VIEW` recusa
trocar nome, tirar coluna e trocar tipo com `42P16`, medido); cada campo fica no lugar da revisão em
que entrou; o aposentado fica com `@deprecated` no tipo; um campo que a cópia não tem fica fora da
visão e do tipo, com a ligação que depende dele; `GRANT SELECT` só nas visões declaradas, na
publicação; inteiros e decimais chegam como texto, um código como a união dos valores com
`(string & {})`; o que um significado novo faz num app já publicado decide-se pelo uso do CRM.

### Correções aos estudos, contra o código de hoje

- **A tela é a página Conhecimento, no menu da esquerda, e não uma seção de Configurações** (o
  fundador, "1. Aprovado"; a versão anterior deste cartão a punha em Configurações › Conceitos da
  empresa). O menu é `RailPlaces`
  (`apps/web/src/routes/_app/companies/$companyId/route.tsx:43-96`); Cópias, a última, aparece só com
  `may.manageCopies` (`:87-94`), e Conhecimento vem depois dela, sem condição: todo membro a vê. As
  rotas novas ficam ao lado de `copies.index.tsx` e `copies.$copyId.tsx`: `knowledge.index.tsx` (as
  abas) e `knowledge.$concept.tsx` (um conceito). Configurações continua com o que é dela (os papéis,
  as pessoas, a Memória da empresa, `settings/route.tsx:26-45` e `settings/company-memory.tsx`).
  Nenhuma tela do Hub mostra o Brain por área nesta etapa, e as páginas `ontologia:` do Brain são do
  cartão seguinte do Brain.
- **A ligação por junção era ambígua.** A versão anterior dizia "pares `[campo_de, campo_para]`" e "o
  conceito `through`" sem dizer como os pares atravessam a junção; o "veio de" de um documento não
  tinha como ser declarado. Com `through`, `pairs` é `[campo_de, campo_da_junção]` e `through_pairs`,
  `[campo_da_junção, campo_para]`: o "Join table dataset relationship type" do Palantir
  (`object-link-types/create-link-type/`).
- **Os SDKs do Palantir estão na prateleira** desde o estudo do alinhamento: `osdk-ts@2e21feec` e
  `foundry-platform-typescript@75fe1c05`. As versões anteriores deste cartão citavam clones à parte
  (`osdk-ts@9ca39db0` e `@3371bee3`).
- **As rotas moram em `/api/companies/{companyId}/…`**, como todas (`packages/hub-api/src/copies.ts:155`),
  e não em `/api/ontology/…`.
- **A prova conta mal hoje.** O caderno grava `provedRows` como o número de linhas que a resposta
  trouxe (`notes.ts:135`), e o DbExplorer corta a resposta (`completo`,
  `packages/connectors/src/sankhya/door.ts:112-117`). A prova passa a ser uma contagem
  (`SELECT COUNT(*) AS N FROM (<consulta>) Q`) e uma página de uma linha para a forma.
- **A porta joga fora o tipo das colunas.** O DbExplorer manda `userType` em cada coluna (a resposta
  gravada em `packages/connectors/src/sankhya/refusals.ts:54-57`), e `QueriedRows` guarda só o nome
  (`door.ts:112-117`). A U3 leva o tipo à saída de `consultar`; o dublê passa a mandá-lo
  (`fake-data.ts:121` manda só `name`).
- **A chave adiada não existe no Drizzle instalado** (`node_modules/drizzle-orm/pg-core/foreign-keys.d.ts`
  não tem `deferrable`). O protótipo adiava a chave das versões para a revisão entrar por último com o
  hash; aqui o servidor calcula o conjunto ativo depois da aprovação em memória, grava a revisão com o
  hash e depois as versões, numa transação.
- **Sem a role, a admissão diz `NOT_FOUND`, não `NOT_IN_ROLE`** (`apps/server/src/hub/identity/admission.ts:333-336`,
  segurança S10). Para a tela dizer "seu papel não aprova", a rota admite como membro e confere o papel
  depois, como a memória da empresa faz (`company-memory-routes.ts:26-37`).
- **A página não tem `pular`.** O dublê do Sankhya roda a página só como `OFFSET 0`
  (`packages/connectors/src/sankhya/fake-sales.ts:178-180`), e o `pageSql` do kit só escreve essa forma
  (`packages/connectors/src/sankhya/search-sql.ts:84-88`). O agente filtra ou mede, como já faz no
  `connector_read`.
- **O compilador reusa o kit.** O protótipo escrevia os literais à mão; o kit já tem o escape de texto,
  `containing`, `inList`, `between`, `flag`, `digits` (`search-sql.ts:23-70`) e a data de `dated`
  (`copy-read.ts:30-33`). O `conceptRead` os usa.
- **O motor do banco não entra no inventário.** Nenhum leitor dele neste cartão: o kit escreve a data
  do Oracle, como a leitura das cópias (`copy-read.ts:30-33`, decisão 0063). A skill já diz como achar
  o motor (`SKILL.md:59`).
- **Os nomes das ferramentas** seguem o repositório (`packages/hub-api/src/tools.ts:54-55`, em inglês):
  `concept_propose`, `concept_read`, `concept_query`, não `conceito_ler`.
- **A frase da memória do app mudou de linha**: o #815 cita `builder.md:44`; no `main` é
  `apps/server/src/builder/conversation/prompt/builder.md:47`.
- **Não há trilha de auditoria no Hub** (nenhuma tabela de `operations`, `requests` ou
  `notifications` guarda histórico de mudança). A trilha da Ontologia é a sua própria tabela de
  revisões (`P1`).
- **As notas do caderno não viram propostas aprovadas** (corrige o primeiro estudo, pela `B1` e a
  `D`), e também não viram conceitos: uma nota é texto livre (`mapping`, até 500 caracteres,
  `notes.ts:17-23`), sem campos. Elas entram como itens `NOTE`, pendentes, que se leem e se recusam,
  nunca se aprovam: o Builder as refaz como proposta com prova.

### Como o G4 organiza a memória (só estrutura)

O G4 tem dois lugares: a memória da pessoa, que o agente propõe e a pessoa confirma, recusa, substitui,
deixa vencer ou apaga; e o contexto da empresa, com áreas, documentos e pessoas com papel e área, que
só muda por pedido de mudança que um administrador aprova. O agente lê o contexto da empresa
"primeiro o estado, depois só o documento que precisa". Deste cartão, o Conexus toma só o último
ponto, e ele já é o desenho: o catálogo de uma linha por conceito no contexto, e o descritor inteiro
só quando o agente pede (`concept_read`). As três outras peças o fundador respondeu em 2026-11-12, e
nenhuma é desta etapa (a página do fundador, "Fica de fora"). O G4 não modela o fluxo nem os papéis:
o grafo dele é o desenho das ligações entre as fichas da memória pessoal, sem extrair entidades, e
os "workflows" dele são texto de instrução. Ele ensina a metade do Brain (0065), e nada da metade da
Ontologia.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 As tabelas | o esquema `ontology` em versões e visões, o papel (`base`) e a ligação por junção (`through_pairs`), a política por linha, as permissões da `P1` num pull request próprio, os testes de isolamento | `apps/server/src/hub/ontology/`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `apps/server/src/platform/` | dados | a política de dados pessoais fechada |
| U2 O inventário | a capacidade `inventory` no kit, o workflow sem modelo ao ligar e em **Ler de novo**, o resumo na página da conexão | `packages/connectors/src/kernel/`, `packages/connectors/src/sankhya/`, `apps/server/src/hub/ontology/`, `apps/server/src/hub/connectors/`, `apps/server/src/builder/ontology/`, `apps/web/src/hub/connectors/`, `packages/hub-api/src/` | dados | U1 |
| U3 A proposta com prova | a prova pela porta (contagem e forma, e o subconjunto de um papel), o `conceptRead` do kit, `concept_propose` nos dois agentes no lugar de `connector_note_save`, as notas como itens `NOTE`, a saída do caderno da tela | `packages/connectors/src/kernel/`, `packages/connectors/src/sankhya/`, `apps/server/src/hub/ontology/`, `apps/server/src/hub/connectors/`, `apps/server/src/builder/connectors/`, `apps/server/src/builder/assistant/`, `apps/server/src/builder/conversation/prompt/`, `apps/server/migrations/`, `apps/web/src/hub/connectors/`, `packages/hub-api/src/` | testes | U1 |
| U4 A aprovação e as telas | a permissão "Conceitos da empresa" (`L1`), a rota de decidir, a primeira revisão do dono, **Sugerir mudança** (`Q1`, `R1`), a página Conhecimento no menu com as abas Conceitos, Para revisar e Histórico, e o cartão da proposta na conversa | `apps/server/src/hub/ontology/`, `apps/server/src/hub/identity/`, `packages/hub-api/src/`, `apps/web/src/hub/ontology/`, `apps/web/src/routes/`, `apps/web/src/builder/conversation/` | web | U3 |
| U5 As ferramentas | os descritores por turno, `concept_read` e `concept_query` no Builder e no Assistente, o catálogo no contexto | `apps/server/src/hub/ontology/`, `apps/server/src/builder/ontology/`, `apps/server/src/builder/conversation/`, `apps/server/src/builder/assistant/`, `packages/hub-api/src/` | testes | U4 e o Alinhamento fechado |

Nenhuma corre em paralelo: U2 a U5 dividem `apps/server/src/hub/ontology/`.

**Orçamento de código alterado** (sem testes nem gerados; a base são os arquivos parecidos de hoje,
medidos com `wc -l` no `main`: `hub/copies/tables.ts` 320 (sete tabelas), `propose.ts` 271,
`grants.ts` 164, `notes.ts` 162, `connector-tools.ts` 309, `copy-read.ts` 166, `search-sql.ts` 89,
`copy-clock/workflow.ts` 84).
U1: 520. U2: 700. U3: 1.000. U4: 1.275. U5: 680. Total da etapa: cerca de 4.175, acima dos cerca de
4.000 da delivery L2. A válvula foi aplicada no cartão: o metamodelo acrescentou cerca de 300 linhas
(o estudo do metamodelo estima de 250 a 350), e o acumulado estimado depois da U4 ficou em cerca de
3.500, acima dos 3.300 da válvula; por isso a antiga U6 (as páginas do Brain, 260) foi para o cartão
seguinte do Brain (a última seção). Se a U4 passar de 1.300, ela se divide em duas (a rota e as
telas) antes de seguir.

## Os critérios de aceite

Todos falham hoje: o esquema `ontology`, as rotas e as ferramentas não existem.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Como `hub_company`, com as outras camadas desligadas, `UPDATE` e `DELETE` numa revisão, numa prova, numa versão de conceito, campo, código, ligação ou fonte, `UPDATE` do conteúdo de um item e `UPDATE` de qualquer linha do inventário, recusam com `42501`; só `proposal.state` e as quatro colunas de decisão de `proposal_item` mudam, e só as três tabelas do inventário aceitam `DELETE` | `apps/server/src/platform/isolation-ontology.test.ts`, "a P1 no banco" | must |
| 2 | U1 | A empresa B não lista, não lê e não grava conceito, proposta, item, revisão, prova nem inventário da A, pelo banco com a política por linha (`new row violates row-level security`) e pelas rotas (`NOT_FOUND`) | `isolation-ontology.test.ts`, "a B não vê a A" | must |
| 3 | U1 | A visão de um elemento devolve a versão mais nova de cada chave, e a Ontologia "como estava na revisão N" sai de uma consulta só às versões | `apps/server/src/platform/isolation-ontology.test.ts`, "o atual e o da revisão N" (entra como `hub_company`, como os outros testes de isolamento; a U4 repete pela rota de decidir) | must |
| 4 | U2 | Ligar o Sankhya do dublê grava um inventário `COMPLETE` sem conta de modelo, com tabelas, campos (o próprio da empresa marcado) e códigos com o rótulo do dicionário, e nenhum valor de linha; a página da conexão mostra as três contagens e a data | `apps/server/src/hub/ontology/inventory.test.ts`, "ao ligar"; `apps/web/src/hub/connectors/inventory.test.tsx` | must |
| 5 | U2 | **Ler de novo** troca o inventário: a rodada nova `COMPLETE` fica, as antigas da conexão saem; pedido por quem não gerencia as ligações, `POST .../inventories/{connectionId}/runs` responde `NOT_FOUND`; com uma rodada aberta, `INVENTORY_RUNNING` | `inventory.test.ts`, "ler de novo" | must |
| 6 | U2 | Um conector sem dicionário (o Mercado Livre) tem inventário só das suas declarações, sem nenhuma chamada ao fornecedor; `inventory_search` devolve ao Builder e ao Assistente as entradas do inventário da conexão que casam com o texto, com o tipo, o rótulo e a marca de campo próprio, e `NOT_GRANTED` para uma conexão fora do acesso | `inventory.test.ts`, "das declarações"; `apps/server/src/builder/ontology/inventory-tool.test.ts` | must |
| 7 | U2 | O dicionário que a porta recusa, ou que cai no meio, termina a rodada `FAILED` com o tipo da resposta, e o inventário anterior continua o que a página mostra; o teto de páginas termina `PARTIAL` com `CAP`; uma rodada aberta há mais de 15 minutos sem fim (o processo caiu) não impede **Ler de novo**, e fica `INTERRUPTED` | `inventory.test.ts`, "recusa, teto e prazo" | must |
| 8 | U3 | `concept_propose` com uma fonte grava uma prova com a contagem e a forma (nome e tipo de cada coluna) e nenhuma linha, conferida contra os dados inventados do dublê | `apps/server/src/hub/ontology/propose.test.ts`, "a prova sem linha" | must |
| 9 | U3 | Um campo cuja coluna não está na forma da prova volta em `refused` com `FIELD_NOT_IN_PROOF`; um código que a contagem não acha, com `CODE_UNSEEN`; uma prova que a porta recusa, com `PROOF_FAILED` e o tipo da resposta; o mesmo alvo pendente duas vezes, com `ITEM_REPEATED` | `propose.test.ts`, "as recusas por item" | must |
| 10 | U3 | Toda nota do caderno vira um item `NOTE` pendente, com a mesma consulta, o mapeamento e quem escreveu; nenhuma vale antes de uma decisão, e nenhum código lê `connection.notes` depois da U3 | `apps/server/src/hub/ontology/notebook-import.test.ts`; `git grep` no critério da revisão | must |
| 11 | U3 | A SQL que o `conceptRead` compila passa por `isOneReadStatement`, e cada injeção no texto, num código, num número ou numa data volta recusada antes de virar SQL | `packages/connectors/src/sankhya/concept-read.test.ts`, "injeções" | must |
| 12 | U3 | Um membro sem `manageConnections`, num papel da empresa que tem `consultar` do Sankhya, propõe pelo Builder e pelo Assistente (o #814); um membro de papel sem `consultar` propõe um `RENAME_LABEL`, e um `SET_SOURCE` dele volta em `refused` com `NOT_IN_ROLE` (a prova nunca lê o que o papel não lê); numa rodada de automação o Assistente não tem `concept_propose`; `origin` de um código é `DICTIONARY` só quando a entrada citada está no inventário com o valor, nunca pelo que o modelo diz | `apps/server/src/builder/connectors/concept-propose.test.ts` | must |
| 13 | U4 | A primeira revisão de uma empresa recusa quem não é dono com `FIRST_REVISION_OWNER` (`POST .../ontology/proposals/{id}/decisions`), e nada se grava | `apps/server/src/hub/ontology/decide.test.ts`, "a primeira é do dono" | must |
| 14 | U4 | Depois da primeira, um membro ou um desenvolvedor recebe `NOT_IN_ROLE` ao decidir; dono e administrador aprovam; quem propôs aprova a própria proposta, e a revisão guarda os dois nomes | `decide.test.ts`, "L1 e R1" | must |
| 15 | U4 | Uma decisão com `expectedRevision` velha recusa com `REVISION_STALE` e não grava nada; duas decisões ao mesmo tempo sobre a mesma base: uma grava, a outra `REVISION_STALE` | `decide.test.ts`, "a revisão esperada" | must |
| 16 | U4 | Aprovar um conceito sem a sua fonte ou sem os campos do título e da chave, um campo sem o seu conceito, um código sem o seu campo, uma ligação sem os seus conceitos, os campos dos pares ou o conceito `through`, ou um `DEPRECATE` cujo `replacedBy` não existe, nem na proposta nem no ativo, recusa com `DECISION_INCOMPLETE` e os itens; aprovar um item `NOTE` recusa com `ITEM_NOT_APPROVABLE`; um item já decidido, `ITEM_DECIDED` (o papel e a base: o critério 31) | `decide.test.ts`, "o conjunto fechado" | must |
| 17 | U4 | Todo membro vê **Sugerir mudança**; a sugestão de um membro vira proposta aberta com quem propôs; a mesma chave de tentativa duas vezes dá uma proposta só | `apps/server/src/hub/ontology/suggest.test.ts`; `apps/web/src/hub/ontology/suggest.test.tsx` | must |
| 18 | U4 | Para quem não aprova, Para revisar não mostra os botões e diz "Aguarda quem cuida dos conceitos."; na primeira revisão, "Aguarda o dono." | `apps/web/src/hub/ontology/review.test.tsx` | must |
| 19 | U5 | Um conceito recusado, um aposentado e um de outra empresa não aparecem no catálogo nem em `concept_read`; chamado assim mesmo em `concept_query`, `CONCEPT_UNKNOWN` | `apps/server/src/builder/ontology/tools.test.ts`, "o catálogo" | must |
| 20 | U5 | Uma pessoa cujo papel não tem `consultar` do Sankhya, ou um Projeto sem a conexão liberada, não vê o conceito; a ferramenta responde `CONCEPT_UNKNOWN`, e a porta, se alcançada, `NOT_IN_ROLE` | `tools.test.ts`, "a permissão da fonte" | must |
| 21 | U5 | `concept_query` com contagem, soma e agrupamento por código devolve cada código com `{ value, meaning }`; um valor sem significado aprovado volta com `meaning: null`; uma entrada fora do esquema volta `INPUT_INVALID` com o caminho | `tools.test.ts`, "a consulta" | must |
| 22 | U5 | Uma prova mais nova que vê a coluna de um campo com outro tipo tira só esse campo do descritor, com o aviso, e o resto do conceito responde; depois de uma revisão que decide, o campo volta | `tools.test.ts`, "a coluna que mudou" | must |
| 23 | U5 | O prompt do Builder não tem mais "Notebook:"; tem "Concepts:" por conexão, uma linha por conceito, e o Assistente tem o mesmo catálogo | `apps/server/src/builder/conversation/prompt.test.ts`; `apps/server/src/builder/assistant/instructions.test.ts` | must |
| 30 | U3 | `concept_propose` de um papel (`ADD_CONCEPT` com `base`) cuja fonte traz uma chave fora da fonte da base volta em `refused` com `ROLE_NOT_SUBSET` e a contagem em `detail`; com o número de campos de chave diferente do da base, `ROLE_KEY_MISMATCH`; com a base nem ativa nem na proposta, `CONCEPT_INCOMPLETE`; o papel cuja contagem dá zero é aceito, com a prova gravada | `apps/server/src/hub/ontology/propose.test.ts`, "o papel"; `packages/connectors/src/sankhya/concept-read.test.ts`, "o subconjunto" | must |
| 31 | U4 | Aprovar um papel sem aprovar a base (nem ela estar ativa), ou aprovar um `DEPRECATE` de uma base que tem papel ativo, recusa com `DECISION_INCOMPLETE` e os itens (no segundo, os papéis), e nada se grava | `apps/server/src/hub/ontology/decide.test.ts`, "o papel e a base" | must |
| 32 | U3, U4 | Uma ligação de Documento com Documento pela junção Origem do item, com `pairs` e `throughPairs`, é provada, aprovada e aparece no descritor com os dois nomes e a junção; sem `throughPairs` com `through`, ou com um campo de par fora da junção, volta `RELATION_INVALID` | `propose.test.ts`, "a junção"; `decide.test.ts`, "a junção" | must |
| 33 | U5 | O catálogo diz "Cliente (papel de Parceiro)", e o descritor do papel traz `base`; uma ligação por junção aparece no descritor dos dois lados, com a junção | `apps/server/src/builder/ontology/tools.test.ts`, "o papel" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Página da conexão, bloco Inventário | "Lendo o inventário…" enquanto a primeira rodada corre | conector sem dicionário: "Inventário: 12 leituras declaradas" | o bloco em esqueleto (W34) | rodada `FAILED` ou `INTERRUPTED`: "Não foi possível ler o inventário." e, para quem gerencia, **Ler de novo** | a conexão que saiu: a página de não encontrado de hoje | quem não gerencia as ligações vê o resumo, sem **Ler de novo** | `PARTIAL`: "Inventário parcial: lido até o limite." e **Ler de novo** |
| Conhecimento › o lugar do fluxo (no alto de Conceitos e na página de um conceito) | "Nenhum fluxo ainda." e, embaixo, "Os estados, as passagens e o que move cada uma entram com a etapa O fluxo da empresa." | o mesmo, até a etapa do fluxo | — | — | — | todo membro lê | — |
| Conhecimento › Conceitos | "Nenhum conceito aprovado ainda. O Builder propõe conceitos quando você pede um app." | o mesmo | a lista em esqueleto | a falha da leitura com **Tentar de novo** (W17) | — | todo membro lê | — |
| Conhecimento › página de um conceito | — | conceito sem códigos: a coluna Códigos vazia | esqueleto | **Tentar de novo** | "Este conceito não existe." e **Voltar aos conceitos** | todo membro lê e vê **Sugerir mudança** | aposentado: "Aposentado em 12/11: use Documento." no topo; um papel: "Papel de Parceiro" no topo, com o link para a base |
| Conhecimento › código, **Sugerir mudança** | o formulário com "Quer dizer", "Explicação" e "Por quê" | — | o botão em espera depois do toque | a frase da falha e **Tentar de novo**, a chave guardada (W24) | o código que saiu: "Este código não existe mais." e **Voltar ao conceito** | todo membro propõe | — |
| Conhecimento › Para revisar | "Nada para revisar." | o mesmo | esqueleto | **Tentar de novo** | a proposta que fechou: "Esta proposta já foi decidida." e **Ver o histórico** | sem a permissão: "Aguarda quem cuida dos conceitos."; na primeira revisão: "Aguarda o dono." | `REVISION_STALE`: "Os conceitos mudaram enquanto você revisava." e **Ver de novo**; `DECISION_INCOMPLETE`: os itens que faltam marcados |
| Conhecimento › Histórico | "Nenhuma revisão ainda." | o mesmo | esqueleto | **Tentar de novo** | — | todo membro lê | — |
| Conversa, cartão "Proposta: N conceitos" | os conceitos, as linhas da prova e **Revisar e aprovar** | todos os itens recusados: "Nada a propor: o Builder explica na conversa." | — | — | a proposta que fechou: "Esta proposta já foi decidida." | o mesmo cartão; o botão leva a Para revisar, onde a frase de permissão aparece | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `inventory_run`, `inventory_end`, `inventory_entry` | a abertura e o workflow do inventário (U2) | o resumo da conexão e `inventory_search` (U2), a origem de um código em `concept_propose` (U3) |
| `proof_run` | a prova da proposta (U3) | Para revisar e a página do conceito (linhas e quando, U4), o descritor (a forma mais nova, U5), a etapa da saúde |
| `proposal`, `proposal_item` | `concept_propose` (U3), **Sugerir mudança** (U4), a migração das notas (U3) | Para revisar e o cartão (U4), `connector_notes` (U3) |
| `proposal_item.decision`, `reason`, `decided_by`, `decided_at`; `proposal.state` | a rota de decidir (U4) | Para revisar, Histórico (U4) |
| `revision` | a rota de decidir (U4) | Conceitos e Histórico (U4), os descritores (U5), o Brain, depois |
| `concept_version`, `field_version`, `code_version`, `relation_version`, `source_version` | a rota de decidir (U4) | as visões atuais, lidas por U4 e U5 |
| `revision.hash` | a rota de decidir (U4) | Histórico (U4); o arquivo dos apps, depois |

### Os desenhos de caixas

A 1280 px, Conhecimento, no menu da esquerda depois de Cópias, aberta na metade "Como a empresa é"
("2. A"). A troca para "O que a empresa sabe" entra com o cartão do Brain; até lá, o nome da metade
fica sobre as abas, sem troca:

```
┌ Conhecimento ────────────────────────────────────────────────────────────────────┐
│ Como a empresa é                                                                 │
│ [ Conceitos ]  [ Para revisar  2 ]  [ Histórico ]                                │
├──────────────────────────────────────────────────────────────────────────────────┤
│ ┌╌ Fluxos ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐ │
│ ╎ (  ) ── (  ) ── (  )   Nenhum fluxo ainda. Os estados, as passagens e o que  ╎ │
│ ╎                        move cada uma entram com a etapa O fluxo da empresa.  ╎ │
│ └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘ │
│ Conceito          É               Lido de                Campos  Códigos  Estado │
│ Parceiro          —               Sankhya · parceiros       5       0     ativo  │
│ Cliente           papel de        Sankhya · parceiros       2       0     ativo  │
│                   Parceiro                                                       │
│ Representante     —               Sankhya · vendedores      4       0     ativo  │
│ Documento         —               Sankhya · cabeçalhos      9       5     ativo  │
│ Origem do item    junção          Sankhya · origens         4       0     ativo  │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Revisão atual: 2, aprovada por Administrador em 12/11 · Ver o histórico          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

A página de um conceito, e a de um papel:

```
┌ Documento ───────────────────────────────────────────────────────────────────────┐
│ Um documento de venda: orçamento, pedido ou nota. Um por número único.           │
│ Também: venda, nota · chave: Número único · mostra: Número do documento          │
│ Lido de   Sankhya, cabeçalho dos documentos de venda · Ver a consulta            │
│ Prova     1.240 linhas em 12/11 10:02                                            │
│ ┌╌ Fluxo do Documento ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐ │
│ ╎ Nenhum fluxo ainda. (o mesmo lugar, vazio)                                   ╎ │
│ └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘ │
│ Campo              Tipo            No sistema   Códigos                          │
│ Número único       código          (coluna)                                      │
│ Tipo de operação   lista           (coluna)     2 · Ver e sugerir                │
│ Representante      código          (coluna)                                      │
│ Valor              dinheiro (R$)   (coluna)                                      │
│ Ligações  é de um Parceiro · atendido por um Representante ·                     │
│           veio de um Documento (pela Origem do item)                             │
│                                                          [ Sugerir mudança ]     │
└──────────────────────────────────────────────────────────────────────────────────┘
┌ Cliente ─────────────────────────────────────────────────────────────────────────┐
│ Papel de Parceiro: o parceiro marcado como cliente.                              │
│ Lido de   Sankhya, parceiros com a marca de cliente · Ver a consulta             │
│ Prova     812 linhas, todas em Parceiro, em 12/11 10:02                          │
│ Campos    Código do parceiro (chave) · Nome                                      │
│ Ligações  as do Parceiro                                    [ Sugerir mudança ]  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

O código, ao tocar **Ver e sugerir**:

```
┌ Documento › Tipo de operação ────────────────────────────────────────────────────┐
│ Código  Quer dizer               Explicação                       Origem         │
│ 100     Venda de balcão          Venda feita na loja.             empresa        │
│ 101     Pedido externo           Venda tirada fora da loja.       empresa        │
│ ┌ Sugerir mudança no 101 ─────────────────────────────────────────────────────┐  │
│ │ Quer dizer   [ Pedido do representante                         ]           │  │
│ │ Explicação   [ Tirado pelo representante na visita ao cliente. ]           │  │
│ │ Por quê      [ O 101 é o pedido do representante               ]           │  │
│ │ Isto vira uma proposta. Quem tem "Conceitos da empresa" aprova.            │  │
│ │                                         [ Cancelar ]  [ Propor a mudança ] │  │
│ └─────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

Para revisar:

```
┌ Para revisar ────────────────────────────────────────────────────────────────────┐
│ "Um painel de vendas por representante" · pelo Builder, conversa de Dono         │
│ 30 itens · base: nenhuma revisão                     [ Aprovar todos ] [ Ver ]   │
│ Cliente · papel de Parceiro                                    ☑ aprovar         │
│   Lido de: Sankhya, parceiros · Prova: 812 linhas, 0 fora de Parceiro            │
│ Documento                                                      ☑ aprovar         │
│   Lido de: Sankhya, cabeçalho · Prova: 1.240 linhas · Ver a consulta             │
│   Tipo de operação  100 Venda de balcão  ☑ · 101 Pedido externo  ☑ ·             │
│                     120 Bonificação  ☐ recusar: [ Não é venda, é brinde ]        │
│ Ligações  atendido por um Representante · veio de um Documento   ☑ aprovar      │
│                                           [ Aprovar 29 e recusar 1 ]             │
│ ● "O 101 é o pedido do representante" · por Membro · base: revisão 1             │
│   antes  Pedido externo · depois  Pedido do representante    [Recusar…][Aprovar] │
│ ○ Do caderno: "vendas" · por Membro · nota antiga, a refazer com prova [Recusar…]│
└──────────────────────────────────────────────────────────────────────────────────┘
```

A 390 px, as mesmas telas em uma coluna: o lugar do fluxo fica no alto, com a frase sob os passos
vazios; as abas viram um seletor; cada conceito, um cartão com nome,
fonte e as três contagens; a tabela de campos vira uma lista de linhas "Nome · tipo"; em Para
revisar, cada item é um cartão com a sua caixa de marcar, e o botão de decidir fica fixo no pé. O
produto antigo não tem estas telas: nenhuma captura a seguir. O protótipo v3 com as duas metades
(fora do repositório) desenha também a metade "O que a empresa sabe" e as duas junções, para o
cartão do Brain e para a etapa do fluxo.

O Mapa, desenhado aqui e construído com o cartão do Brain (a decisão do fundador, acima), no
desenho B. A 1280 px, Conhecimento ganha um terceiro segmento, **Mapa**, antes das duas metades, e
abre nele. As duas camadas ligam e desligam, e uma área escolhida põe as outras em cinza:

```
┌ Conhecimento ────────────────────────────────────────────────────────────────────────┐
│ [ Mapa ] [ Como a empresa é ] [ O que a empresa sabe ]                               │
│ Camadas (● Como a empresa é 9) (▪ O que a empresa sabe 10)   Áreas (Comercial) …     │
│                                                                     [ − ][ + ][ ⛶ ]  │
├──────────────────────────────────────────────────────────────────────────────────────┤
│   COMERCIAL                                                  FINANCEIRO              │
│   ▪ Comissão do representante    ● Representante             ▪ Prazo de pagamento    │
│   ▪ Bonificação não é venda      1│        ○ Cliente          ▪ Cobrança de atraso   │
│   ▪ Tabela de preços             N⋔                 ● Título a receber               │
│                               ● Documento ────⋔──── ● Parceiro                       │
│   EMPRESA                     ◇ Origem do item           ┊           ESTOQUE         │
│   ▪ Como vendemos                              ○ Fornecedor       ▪ Quando comprar   │
│   ▪ Regras de cadastro             ● Produto ────⋔──── ● Saldo   ▪ Inventário mensal │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ Legenda  ● coisa  ○ papel  ◇ junção  ▪ página, na cor da área  ─⋔ o "muitos"         │
│          ╌ a página cita a coisa   ◌ o fluxo: chega com a etapa O fluxo da empresa   │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

O primeiro toque numa coisa abre a lente e o painel; o segundo, ou **Abrir em Como a empresa é**,
abre a página v3 da coisa. Numa página, o segundo toque abre a página em "O que a empresa sabe":

```
┌ Mapa · Documento escolhido ──────────────────────────────────────────────────────────┐
│                 ● Representante              │ Documento                             │
│                 1│ atende                    │ Coisa · lido de Sankhya · cabeçalhos  │
│    ╭╌╌ fluxo: na etapa O fluxo da empresa ╌╮ │ 9 campos · 2 códigos · 1.240 linhas   │
│    ┆            N⋔        cobra um          ┆ │ Ligações e papéis                    │
│    ┆          ◉ Documento ──⋔── ● Título    ┆ │   é de um Parceiro            N : 1  │
│    ┆   é de um │N                           ┆ │   ligado por Representante    N : 1  │
│    ╰╌╌╌╌╌╌╌╌╌╌╌⋔╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯ │   veio de um Origem do item   1 : N   │
│  (100 · Venda de balcão)  1┼ ● Parceiro      │ Códigos  100 Venda de balcão          │
│  (101 · Pedido do repr.)   ◇ Origem do item  │          101 Pedido do representante  │
│             (o resto do mapa recua)          │ O que a empresa sabe: 3 páginas       │
│                                              │ ┆ Fluxo. Ainda sem fluxo.          ┆  │
│                                              │ [ Abrir em Como a empresa é ]         │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

A 390 px, o mapa fica em retrato, com as áreas empilhadas, a barra de camadas e áreas vira uma
linha que rola, a legenda fica fechada num botão, e o painel desce sob o mapa. Os códigos ficam só no
painel. Com movimento reduzido o mapa chega parado. Sem ele, o conhecimento nasce no centro e se
espalha até as suas áreas, com a câmera parada. O protótipo do Mapa e as suas capturas estão fora do
repositório, ao lado do v3.

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| A rodada do inventário (workflow do Mastra) | a abertura é única por conexão (a trava da transação e o prazo de 15 minutos); a segunda abertura responde `RUNNING` | a porta recusa uma página: a rodada termina `FAILED` com o tipo; a página continua mostrando a rodada anterior | o Sankhya fora: `FAILED` com `UNREACHABLE` ou `DEADLINE`; o banco ou o processo fora: a rodada fica sem fim, e a abertura seguinte, passado o prazo, a fecha `INTERRUPTED` | `ONTOLOGY_INVENTORY_ENDED` com a conexão, o resultado e as páginas | 4, 5, 7 |
| A abertura da rodada ao ligar | — | a abertura falha: a ligação responde como hoje, a falha vai ao log, e **Ler de novo** abre depois | o relógio não inicia o workflow: a rodada aberta vence em 15 minutos e fica `INTERRUPTED` | `ONTOLOGY_INVENTORY_STARTED` | 4, 7 |
| **Ler de novo** (rota) | duas rodadas: a segunda, `INVENTORY_RUNNING` (409) | — | o banco fora: `DATABASE_UNAVAILABLE`, a tela diz e oferece **Tentar de novo** | `ONTOLOGY_INVENTORY_STARTED` | 5 |
| A prova (`proof_run`) | duas provas da mesma consulta gravam duas linhas; a decisão usa a da proposta | a contagem passa e a página da forma falha: a prova é `FAILED` com o tipo, o item volta `PROOF_FAILED` | o Sankhya fora: `PROOF_FAILED` com `UNREACHABLE`; a chamada fora da transação (D22) | `ONTOLOGY_PROOF_RAN` com a conexão, o resultado e as linhas | 8, 9 |
| `concept_propose` (ferramenta) | duas chamadas na mesma conversa acrescentam à mesma proposta aberta; o mesmo alvo pendente, `ITEM_REPEATED` | um item recusado não impede os outros; a resposta lista os dois | o banco fora: a ferramenta responde `DATABASE_UNAVAILABLE` e o modelo diz que não propôs | `ONTOLOGY_PROPOSED` com os números de itens | 8, 9, 12 |
| **Sugerir mudança** (rota) | a mesma `Idempotency-Key`: uma proposta (C37); outra chave e o mesmo corpo: duas propostas | — | resposta cortada ou 502/503: a tela tenta de novo com a mesma chave e recebe a mesma proposta | `ONTOLOGY_SUGGESTED` | 17 |
| A decisão (rota) | duas sobre a mesma base: a segunda `23505` vira `REVISION_STALE` (C38) | uma recusa (`DECISION_INCOMPLETE`, `FIRST_REVISION_OWNER`) desfaz a transação inteira | resposta cortada ou 502/503: a tela relê a proposta; decidida, mostra "Esta proposta já foi decidida." e não manda de novo | `ONTOLOGY_DECIDED` com a revisão e os números | 13 a 16 |
| A migração das notas | roda uma vez (o histórico de migrações) | uma nota ilegível no jsonb para a migração inteira (nada é engolido) | — | — | 10 |

## A tabela de referência

| Peça | Unidade | Hoje no `main` | Referência | Como faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Metadados como linhas por empresa | U1 | o caderno, jsonb na conexão (`apps/server/src/hub/connectors/notes.ts:16-37`, `tables.ts:59`) | `twenty@b76d0217` `packages/twenty-server/src/engine/metadata-modules/object-metadata/object-metadata.entity.ts`, `field-metadata/field-metadata.entity.ts:50-228`; Palantir, `object-link-types/object-type-metadata/` (nome de API, título, estado) | objetos, campos e relações como linhas com chave estável | embrulhado: as versões, a fonte com prova e a revisão são nossas, porque nenhuma referência guarda histórico nem aponta para tabela de fora | o protótipo do estudo do exemplo (fora do repositório, `@mastra/core` 1.82.0 e `drizzle-orm` 1.0.0-rc.4): o CRM de ponta a ponta sobre um ERP real | `"A1 B1 C1"` (0064) | `apps/server/src/hub/ontology/tables.ts`  |
| A versão imutável e o atual como visão | U1 | as visões são só dos apps (`apps/server/src/platform/copy-sql.ts`); o Hub não tem visão | Palantir, "restaurar é uma revisão nova" (`object-edits/`); Twenty não guarda versões (`workspace-migration-runner.service.ts:108`, só o contador) | uma versão por revisão; o atual é a mais nova de cada chave | embrulhado (`P1`; Drizzle `pgSchema.view(...).with({ securityInvoker: true })`, `node_modules/drizzle-orm/pg-core/view.d.ts:16`) | o protótipo do estudo do exemplo (fora do repositório, `@mastra/core` 1.82.0 e `drizzle-orm` 1.0.0-rc.4); `security_invoker` e o `42P16` medidos no PostgreSQL (estudo da Ontologia, Apêndice A) | "P1" | `tables.ts`  |
| A chave composta | U1 | `packages/connectors/src/kernel/copy.ts:65` (1 a 4 colunas) | `budibase@624d68a` `packages/types/src/documents/workspace/table/table.ts:21`; `airbyte@8aed3123` `JdbcAirbyteStreamFactory.kt:33` | lista de colunas | nativo (a forma da cópia) | — | não precisa | —  |
| Códigos com significado | U1, U3 | o `mapping` livre do caderno (`notes.ts:18`) | `twenty@b76d0217` `packages/twenty-shared/src/types/FieldMetadataOptions.ts:5-20` (`{value, label, position}` no campo) | uma linha por código, com a origem | embrulhado: a linha por código, a origem e a entrada por proposta são nossas | o protótipo do estudo do exemplo (fora do repositório, `@mastra/core` 1.82.0 e `drizzle-orm` 1.0.0-rc.4): os códigos com origem `DICTIONARY` e `PERSON` | não precisa | —  |
| A política por linha e as permissões | U1 | `apps/server/src/hub/copies/tables.ts:88-89` (`policy(SCOPE_ROLES.COMPANY, 'all', …)`); `apps/server/database-grants.sql:353-384` | decisão 0039; dados D11, D12 | política por empresa; verbos e colunas estreitos | nativo | — | "P1", num pull request próprio (dados D11) | `apps/server/migrations/<data>_ontology_grants/`  |
| O inventário | U2 | nenhum; a skill manda ler o dicionário à mão (`packages/connectors/src/sankhya/skill/SKILL.md:45-54`) | `airbyte@8aed3123` `docs/platform/using-airbyte/configuring-schema.md:21-23` (descobre tudo, a pessoa escolhe); Palantir HyperAuto | lê tudo o que a fonte declara, sem modelo | nativo para o kit (uma capacidade opcional fora de `operations`, como `copy`, `kernel/definition.ts:59-60`) | — | `"F1"` | `packages/connectors/src/kernel/inventory.ts`, `packages/connectors/src/sankhya/inventory.ts`, `apps/server/src/hub/ontology/inventory.ts`  |
| O workflow sem modelo | U2 | `apps/server/src/builder/copy-clock/workflow.ts:41-76` | `@mastra/core@1.82.0` `dist/docs/references/docs-workflows-overview.md:13` ("clearly defined upfront"); `reference-workflows-run-methods-startAsync.md` | `createWorkflow`, `createRun`, `startAsync` | nativo | — | `"F1"` | `apps/server/src/builder/ontology/inventory-workflow.ts`  |
| A proposta por item e em lote | U3, U4 | `copy_propose` e o cartão Ligar (`apps/server/src/hub/copies/propose.ts:214`, `tables.ts:160-185`) | Palantir, propostas "analogous to a Pull Request", uma tarefa por recurso, "one at a time or in bulk" | itens decididos um a um ou juntos | embrulhado | o protótipo do estudo do exemplo (fora do repositório, `@mastra/core` 1.82.0 e `drizzle-orm` 1.0.0-rc.4): a proposta do CRM decidida item a item | `"B1"`, "Q1 / R1" | `apps/server/src/hub/ontology/propose.ts`  |
| A prova sem linha | U3 | `notes.ts:115-151` (conta as linhas devolvidas); `app_data_check` "never a row" (`apps/server/src/builder/app-data/tools.ts:27`) | o próprio Conexus | contagem e colunas com tipo, nunca a linha | nativo | — | `"B1"` | `apps/server/src/hub/ontology/proof.ts`  |
| A SQL do conceito no dialeto do conector | U3 | `copy-read.ts:25-60` (a consulta guardada como `Q`, `dated`, `pageSql`); `search-sql.ts:23-88` | Twenty `record-crud/json-schemas/find-tool.json-schema.ts:10-61` (filtros por campo); o protótipo do exemplo | a consulta provada como subconsulta, filtros tipados, uma linha a mais | nativo para o kit (reusa `search-sql.ts`) | — | não precisa | `packages/connectors/src/sankhya/concept-read.ts`  |
| O papel como recorte provado | U1, U3 a U5 | nenhum: um conceito não diz de qual é papel | Fabric IQ, `how-to-use-inheritance` ("a derived entity type has at most one base entity type"; não herda a fonte nem as ligações); SAP, o papel do parceiro de negócio; Palantir, `ontology/ontology-best-practices/` ("Customer (single canonical type)") e "A single datasource can only be used to back one object type" | um recorte nomeado de um tipo só, com "é um" até a base | embrulhado: a prova de subconjunto é nossa, porque nenhuma referência prova o recorte contra a fonte | o estudo do metamodelo, seções 3.1 e 3.3 (fora do repositório) | "1. Sim" (o metamodelo) | — |
| A ligação por junção, também de um conceito com ele mesmo | U1, U3 | `relation_version` com `through` e pares ambíguos (a versão anterior deste cartão) | Palantir, `object-link-types/create-link-type/` ("Join table dataset relationship type"); OCEL 2.0, a ligação objeto-objeto (`object_object`, arxiv.org/html/2403.01975, seção 6) | os pares de um lado até a junção e da junção até o outro | nativo da forma deste cartão | — | "1. Sim" (o metamodelo) | — |
| A primeira revisão do dono e a permissão L1 | U4 | `apps/server/src/hub/identity/roles.ts` (`:24-31`, `companyMemory: ['manage']`) | Palantir aprova pelo "editor or owner of the underlying resource" | a regra na rota, uma checagem de papel | nativo (`createAccessControl` do Better Auth, `organization-best-practices`) | — | "D Aprovado", "L1" | —  |
| A decisão com a revisão esperada | U4 | `copies/accept.ts:22-45` (a linha travada, a chave de tentativa) | código C38, C65 | a chave única da revisão serializa | nativo | — | não precisa | `apps/server/src/hub/ontology/decide.ts`  |
| As telas | U4 | o menu da esquerda (`apps/web/src/routes/_app/companies/$companyId/route.tsx:43-96`) e a página de Cópias (`copies.index.tsx`, `copies.$copyId.tsx`); a memória da empresa (`apps/web/src/builder/assistant/company-memory.tsx`) | Palantir, a revisão de propostas da Ontologia; o Mastra Studio, a tela Knowledge (a página própria, que o fundador mandou); os desenhos do estudo do exemplo, seção 8.1, e o protótipo da página Conhecimento, o v3 com as duas metades | uma página no menu, em duas metades: lista, página do conceito, fila de revisão, histórico | embrulhado | os desenhos do estudo do exemplo, seção 8.1, e o protótipo da página Conhecimento (fora do repositório) | "Q1 / R1", "1. Aprovado", "2. A"; os textos, no fim | `apps/web/src/hub/ontology/`, `apps/web/src/routes/_app/companies/$companyId/knowledge.index.tsx`, `knowledge.$concept.tsx`  |
| O Mapa (desenhado aqui, construído com o cartão do Brain) | nenhuma | nenhum grafo no `apps/web`; o `mermaid` 11.17.2 já traz `d3-force` 3.0.1 em `node_modules` | Mastra Studio 1.82, Knowledge (`mastra-1.82@6e8dfcb8`): o layout com d3-force, semente em espiral e 300 passos (`packages/playground-ui/src/domains/knowledge/lib/layout.ts:42-112`), a forma a partir do foco (`lib/graphShape.ts:104`), a legenda do que está na tela (`components/KnowledgePageGraph.tsx:587-812`), o primeiro toque escolhe e o segundo abre (`:1424-1430`), o React Flow sem arrastar nem ligar (`:1511-1540`), `@xyflow/react` ^12.12.0 e `d3-force` ^3.0.0 (`packages/playground-ui/package.json:206`, `:226`); Obsidian e Quartz, os grafos de notas; Palantir Vertex, o painel do objeto clicado | um grafo de forças: as coisas da Ontologia entre as áreas que as citam e as páginas na ilha da sua área; a lente da coisa escolhida; o foco numa área; a entrada do centro para as áreas | nativo (`d3-force` para o layout e `@xyflow/react` para mover, aproximar, clicar e o teclado, como o Studio); entram em `docs/reference/stack.md` com o cartão do Brain; o three.js, o sigma.js e o cosmos.gl, avaliados e deixados de fora | o protótipo do Mapa ao lado do v3 (fora do repositório), com o `d3-force` 3.0.1 embutido, as capturas em claro e escuro, a 1280 e a 390 px, e a entrada quadro a quadro | o pedido do Mapa ao desenho v3 (2026-11-12); o desenho e quando se constrói, as duas decisões da página | o cartão do Brain |
| Ferramentas geradas dos metadados | U5 | `apps/server/src/builder/connectors/connector-tools.ts:312-332` | `twenty@b76d0217` `engine/core-modules/tool-provider/providers/database-tool.provider.ts:193-218` (descritor com `executionRef`), `tool-provider/services/tool-registry.service.ts:340-367` (refaz o catálogo de quem chama), `record-crud/json-schemas/record-properties.json-schema.ts:121-125` (enum dos códigos) | descritores como dado, filtrados pelo papel, executor genérico | embrulhado: duas ferramentas fixas sobre os descritores (o trio `get_tool_catalog`, `learn_tools`, `execute_tool` do Twenty com o catálogo no contexto); o alvo é a porta do conector | o protótipo do estudo do exemplo (fora do repositório, `@mastra/core` 1.82.0 e `drizzle-orm` 1.0.0-rc.4): o descritor do Pedido e a SQL compilada pela porta do dublê | `"A1 B1 C1"` (0064) | `apps/server/src/builder/ontology/tools.ts`, `apps/server/src/hub/ontology/descriptors.ts`  |
| O recorte do SDK | U5 (a forma), apps (depois) | `packages/app/src/connectors.ts:40-64` (`defineConnectors`, `connectorsOf`) | `osdk-ts@2e21feec` `packages/e2e.generated.catchall/src/generatedNoCheck/ontology/objects/Employee.ts:18-213`; Palantir `ontology-sdk/overview/` ("based on just the subset") | só o recorte que o leitor alcança | nativo (a forma); a biblioteca de consulta fica de fora | — | `M` (os apps, depois) | —  |

A memória em dois lugares e o contexto da empresa do G4 OS (só estrutura) ficam fora da tabela: são
as três perguntas que o fundador respondeu em 2026-11-12, sem unidade nesta etapa.

**A medida do transplante.** Nada vem do `conexus-os`: a Ontologia não existe no produto antigo.

**A dívida.**

- Desligar uma conexão deixa o inventário, as provas e a fonte dela: o conceito some do catálogo
  (a interseção da U5) e a rota do inventário responde `NOT_FOUND`; apagar essas linhas fica para a
  etapa da saúde, que já lê as provas.
- A ferramenta `connector_notes` fica enquanto houver item `NOTE` aberto; sai num fechamento depois
  que a empresa do fundador não tiver nenhum.
- A coluna `connectors.connection.notes` sai por uma migração posterior (dados D6), depois que nenhum
  código a lê.
- A árvore de `docs/architecture.md` não mostra `packages/app` nem `packages/connectors`; o
  fechamento acrescenta `hub/ontology` junto.

## U1 As tabelas

**Base e modelo.** O commit que fecha o Sync. Sonnet: tabelas e testes de banco, no molde de
`hub/copies/tables.ts`.

### As linhas da tabela

- Metadados como linhas, a versão imutável, a chave composta, os códigos e a política por linha.
- Ler: `apps/server/src/hub/copies/tables.ts:1-30` (o `pgSchema`, `instant`, a política),
  `:38-95` (chaves compostas `(company_id, id)`, `check`, `policy`); `apps/server/database-grants.sql:7-17`,
  `:78-84`, `:353-384`; a migração de permissões mais nova
  (`apps/server/migrations/20261112030433_member_profile_grants/migration.sql`, o comentário com a
  palavra do fundador).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/ontology/` | cria `tables.ts`, `public-tables.ts`, `public.ts` | U2 a U5 |
| `apps/server/migrations/` | cria a migração das tabelas e, no pull request próprio, a das permissões | o Hub ao subir |
| `apps/server/database-grants.sql` | muda: o dono do esquema e das tabelas, as permissões da `P1` | `apps/server/src/platform/catalog.test.ts` |
| `apps/server/src/platform/` | cria `isolation-ontology.test.ts` | — |

### Os contratos que a unidade cria

O esquema `ontology` no banco do Hub. Toda tabela tem `company_id text NOT NULL` com chave
estrangeira para `auth.company` (`onDelete: 'cascade'`, como `copies.copy`) e
`policy(SCOPE_ROLES.COMPANY, 'all', sql\`company_id = ${scoped.companyId}\`)`. Uma chave é
`text CHECK (key ~ '^[a-z][a-z0-9_]{0,39}$')`. Toda coluna `jsonb` tem o seu esquema Zod nomeado em `packages/hub-api/src/ontology.ts`, lido na
entrada e na saída do banco (C27): `ProofShape` (`{ column: string; type: string | null }[]`, até
200, o tipo bruto do sistema, como `consultar` o dá; vira `FieldType` só na tabela de compatibilidade da U5), `SourceRead` (`{ kind: 'DOOR'; sql: string }`), `RelationPairs` (1 a 4 `[FieldKey, FieldKey]`, em `pairs` e em `through_pairs`),
`ItemContent` (o `ProposedItem` sem `kind`, ou `NoteContent`: `{ connectionId, concept, mapping,
provingQuery, provedAt, provedRows }`, a forma de `notes.ts:16-23`). Os limites copiam os de hoje: descrição de conceito 500
e de campo 200 (`copy.ts:122,129`), consulta 4.000 (`notes.ts:19`), chave de 1 a 4 (`copy.ts:65`).

| Tabela | Colunas, com restrição | Chave |
| --- | --- | --- |
| `inventory_run` | `id uuid` (`InventoryRunId`); `connection_id uuid`; `started_at timestamptz` | `id`; único `(company_id, id)`; índice `(company_id, connection_id, started_at DESC)` |
| `inventory_end` | `run_id uuid`; `ended_at timestamptz`; `outcome text` (`COMPLETE`, `PARTIAL`, `FAILED`, `INTERRUPTED`); `reason text` (`InventoryReason`: `CAP`, ou o tipo da resposta: `REFUSED`, `AUTH_REFUSED`, `UNREADABLE`, `BUSY`, `UNREACHABLE`, `DEADLINE`, `NOT_IN_ROLE`); `pages integer`; `CHECK ((reason IS NULL) = (outcome IN ('COMPLETE', 'INTERRUPTED')))` | `run_id`; estrangeira `(company_id, run_id)` com `cascade` |
| `inventory_entry` | `run_id uuid`; `kind text` (`TABLE`, `FIELD`, `CODE`, `OPERATION`); `name text` (até 200: `TABELA`, `TABELA.CAMPO`, `TABELA.CAMPO=valor`, ou o id da operação); `type text` (até 20, o tipo do dicionário); `label text` (até 200); `custom boolean` | `(run_id, kind, name)`; estrangeira `(company_id, run_id)` com `cascade` |
| `proof_run` | `id uuid`; `connection_id uuid`; `query text` (até 4.000); `ran_at`; `outcome` (`OK`, `FAILED`); `reason` (os tipos da resposta); `rows bigint` (zero é uma prova: Para revisar mostra "0 linhas"); `shape jsonb` (`ProofShape`); `outside_base bigint` (só na prova da fonte de um papel: as linhas sem par na base, pela `subset` da U3; `NULL` nas outras); `CHECK ((outcome = 'OK') = (reason IS NULL))` | `id`; único `(company_id, id)`; `query_hash text` (sha-256 da consulta); índice `(company_id, connection_id, query_hash, ran_at DESC)` (a prova mais nova da mesma consulta, U5; a consulta inteira passa do limite de uma entrada de btree) |
| `proposal` | `id uuid`; `demand text` (1 a 500); `proposed_by text`; `agent text` (`builder`, `assistant` ou `NULL` pela tela ou pela migração); `conversation_id text`; `base_revision integer`; `created_at`; `state` (`OPEN`, `CLOSED`); `attempt_key text`, `body_hash text` (a tela, C37) | `id`; único `(company_id, id)`; único `(company_id, attempt_key)`; único parcial `(company_id, conversation_id) WHERE state = 'OPEN' AND conversation_id IS NOT NULL` |
| `proposal_item` | `proposal_id uuid`; `n integer`; `kind` (`ADD_CONCEPT`, `ADD_FIELD`, `SET_CODE`, `ADD_RELATION`, `SET_SOURCE`, `RENAME_LABEL`, `DEPRECATE`, `NOTE`); `target text` (o endereço: `pedido`, `pedido.tipo_operacao`, `pedido.tipo_operacao=101`, `@pedido_vendedor`); `content jsonb`; `proof_run_id uuid`; `decision` (`PENDING`, `APPROVED`, `REFUSED`); `reason text` (até 500); `decided_by text`; `decided_at`; `CHECK ((decision = 'PENDING') = (decided_at IS NULL))` | `(proposal_id, n)`; estrangeiras para `proposal` e `proof_run` |
| `revision` | `number integer CHECK (number >= 1)`; `proposal_id uuid`; `proposed_by text`; `approved_by text`; `approved_at`; `hash text` (sha-256 hexadecimal) | `(company_id, number)` |
| `concept_version` | `key`; `revision`; `name` (até 80); `plural` (até 80); `description` (até 500); `synonyms text[]`; `title_field`; `key_fields text[]` (`cardinality BETWEEN 1 AND 4`); `base` (a chave do conceito de que este é um papel, ou `NULL`; `CHECK (base IS NULL OR base <> key)`); `state` (`EXPERIMENTAL`, `ACTIVE`, `DEPRECATED`); `replaced_by` | `(company_id, key, revision)`; estrangeira `(company_id, revision)` para `revision` |
| `field_version` | `concept`; `key`; `revision`; `name` (até 80); `description` (até 200); `type` (`ID`, `TEXT`, `INTEGER`, `DECIMAL`, `MONEY`, `DATE`, `TIMESTAMP`, `BOOLEAN`, `CODE`); `currency` (`^[A-Z]{3}$`); `unit` (até 12); `column_name` (até 128); `state`; `CHECK ((type = 'MONEY') = (currency IS NOT NULL))` | `(company_id, concept, key, revision)` |
| `code_version` | `concept`; `field`; `value` (até 40); `revision`; `label` (até 80); `description` (até 200); `origin` (`DICTIONARY`, `PERSON`); `state` (`ACTIVE`, `DEPRECATED`) | `(company_id, concept, field, value, revision)` |
| `relation_version` | `key`; `revision`; `from_concept`; `to_concept`; `cardinality` (`MANY_TO_ONE`, `ONE_TO_ONE`, `MANY_TO_MANY`); `pairs jsonb` (1 a 4 pares `[campo_de, campo_para]`; com `through`, `[campo_de, campo_da_junção]`); `from_name`, `to_name` (o nome de cada lado, que é o papel na ligação: "atendido por", "veio de"); `through`; `through_pairs jsonb` (1 a 4 pares `[campo_da_junção, campo_para]`); `state`; `CHECK ((cardinality = 'MANY_TO_MANY') = (through IS NOT NULL))`; `CHECK ((through IS NULL) = (through_pairs IS NULL))`; `from_concept = to_concept` é permitido (o "veio de" de um documento, pela junção) | `(company_id, key, revision)` |
| `source_version` | `concept`; `revision`; `connection_id uuid`; `read jsonb` (`{ "kind": "DOOR", "sql": … }`); `proof_run_id uuid` | `(company_id, concept, revision)` |

As visões atuais, com `security_invoker = true`: `concept`, `field`, `code`, `relation`, `source`,
cada uma `SELECT DISTINCT ON (company_id, <chave>) * FROM <tabela>_version ORDER BY company_id,
<chave>, revision DESC`, em Drizzle com `pgSchema('ontology').view(name).with({ securityInvoker: true }).as((qb) => qb.selectDistinctOn([...]).from(...).orderBy(...))`.

As permissões (`P1`), no pull request próprio, como linhas do catálogo:

```sql
GRANT USAGE ON SCHEMA ontology TO hub_company;
-- One line per table in the catalog, never ALL TABLES: that would grant INSERT on the five views.
GRANT SELECT, INSERT ON ontology.inventory_run, ontology.inventory_end, ontology.inventory_entry,
  ontology.proof_run, ontology.proposal, ontology.proposal_item, ontology.revision,
  ontology.concept_version, ontology.field_version, ontology.code_version,
  ontology.relation_version, ontology.source_version TO hub_company;
GRANT SELECT ON ontology.concept, ontology.field, ontology.code, ontology.relation, ontology.source TO hub_company;
GRANT UPDATE (state) ON ontology.proposal TO hub_company;
GRANT UPDATE (decision, reason, decided_by, decided_at) ON ontology.proposal_item TO hub_company;
-- The inventory is replaced by run (P1, "o inventário se troca por rodada"): the older runs go.
GRANT DELETE ON ontology.inventory_run, ontology.inventory_end, ontology.inventory_entry TO hub_company;
```

Nenhuma outra permissão de `UPDATE` ou `DELETE`: a rodada do inventário fecha por um `INSERT` em
`inventory_end`, nunca por `UPDATE`; a saída da empresa apaga por `cascade` a partir de
`auth.company`, como as cópias.

Os tipos exportados, em `apps/server/src/hub/ontology/public-tables.ts`: as tabelas para as
estrangeiras de outros donos (nenhuma neste cartão). O modelo: `hub/copies/tables.ts` cumpre C21
(estados em `enum` com `check`), C23 (ids de `@conexus/hub-api`) e C26 (uma tabela, um dono).

### As skills e a leitura

As linhas `drizzle-orm` e `drizzle-kit` de `docs/reference/stack.md`: `orm.drizzle.team/llms.txt`
(as visões, `selectDistinctOn`) e a skill `drizzle` de `node_modules/drizzle-kit/skills/`. O guia de
dados: D1, D6, D11, D12. O código C8, C21, C23, C26.

### A ordem do trabalho

1. `tables.ts`: as onze tabelas e as cinco visões, como acima. Regras: C8, C21, dados D1.
2. A migração das tabelas pelo `drizzle-kit generate`; conferir o SQL das visões (`security_invoker`).
   Regra: D6 (só acrescenta).
3. Num pull request próprio, com a palavra do fundador (`P1`, 2026-11-12, citada no comentário da
   migração, como em `20261112030433_member_profile_grants/migration.sql:1-4`): a migração das
   permissões e as linhas de `database-grants.sql`. Regra: D11.
4. `isolation-ontology.test.ts`: os critérios 1 e 2 pelo banco, entrando como `hub_company` com a
   empresa da transação, como os outros `isolation-*.test.ts`.

### Como se prova

Critério 1: o teste tenta cada `UPDATE` e `DELETE` e espera `42501`; falha hoje porque o esquema não
existe. Critério 2: duas empresas, cada uma com uma revisão; a B lê zero e a gravação com o
`company_id` da A recusa pela política. Critério 3: três revisões gravadas direto; a visão devolve a
mais nova, e a consulta às versões com `revision <= 2` devolve a da revisão 2. Comando: `npm test -w
apps/server -- src/platform/isolation-ontology.test.ts src/hub/ontology/tables.test.ts`, depois do
`npm ci` e do build do servidor.

### Parar se

- O `catalog.test.ts` acusa uma diferença que não é das linhas acima: parar e relatar.
- O Drizzle gera a visão sem `security_invoker`: escrever a visão como SQL na migração, marcada como
  feita à mão, e relatar.

## U2 O inventário

**Base e modelo.** O commit da U1. Sonnet: o molde é a capacidade `copy` do kit e o relógio das
cópias.

### As linhas da tabela

- O inventário e o workflow sem modelo.
- Ler: `packages/connectors/src/kernel/definition.ts:42-71` (o `Connector`; `copy?` fora de
  `operations`, `:59-60`), `:132-139` (`assertCopy`); `kernel/copy.ts:6` (`PAGE_ROWS = 500`),
  `:203-206` (`ConnectorCopy`); `packages/connectors/src/sankhya/copy-read.ts:43-60` (`pastKey`,
  `pageStatement`); `search-sql.ts:84-88` (`pageSql`); `sankhya/skill/SKILL.md:45-54` (as tabelas
  do dicionário e o que cada uma diz); `apps/server/src/hub/connectors/copy-port.ts:101-134`
  (`readAsCopy`: falar como versão, no lugar das cópias); `apps/server/src/hub/copies/run.ts:16-17`
  (o teto de 200 páginas e 10 minutos); `apps/server/src/builder/copy-clock/workflow.ts:9-76` (o nome
  guardado do workflow, o passo que lê a entrada com Zod); `hub/copies/store.ts:47` e `:99` (a porta
  `CopyClock`, dada tarde pelo `main.ts`); `apps/server/src/hub/connectors/routes.ts:47-59` (o ligar);
  `apps/web/src/hub/connectors/connection-page.tsx:333-336`.
- Mastra: `node_modules/@mastra/core/dist/docs/references/reference-workflows-workflow-methods-create-run.md`,
  `reference-workflows-run-methods-startAsync.md`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | cria `inventory.ts`; muda `definition.ts` (o campo `inventory?` e a sua checagem) | o Sankhya; `hub/connectors` |
| `packages/connectors/src/sankhya/` | cria `inventory.ts`; muda `definition.ts`; o dublê ganha as tabelas do dicionário com linhas inventadas (`fake-sales.ts`) | o Sankhya |
| `apps/server/src/hub/connectors/` | cria `inventory-port.ts` (a leitura como versão); muda `public.ts` e `routes.ts` (depois de ligar, `inventory().start`) | `hub/ontology` |
| `apps/server/src/hub/ontology/` | cria `inventory.ts`, `routes.ts`; muda `public.ts` | `main.ts` |
| `apps/server/src/builder/ontology/` | cria `inventory-workflow.ts`, `inventory-tool.ts`, `public.ts` | `conversations-of.ts`, `conversation/builder.ts`, `assistant/assistant.ts` |
| `apps/server/src/builder/conversation/`, `apps/server/src/builder/assistant/` | muda: `inventory_search` nas ferramentas por turno e em `permissions.ts` | — |
| `apps/server/src/main.ts`, `conversations-of.ts` | muda: a ligação tardia do relógio do inventário | — |
| `packages/hub-api/src/` | cria `ontology.ts` (as rotas do inventário), `ontology-failures.ts`; muda `index.ts`, `failures.ts` | o Hub, a web |
| `apps/web/src/hub/connectors/` | cria `inventory.tsx`; muda `connection-page.tsx` | — |

### Os contratos que a unidade cria

No kit, `packages/connectors/src/kernel/inventory.ts`:

```ts
export type InventoryEntry = Readonly<{
  kind: 'TABLE' | 'FIELD' | 'CODE' | 'OPERATION'
  name: string // TABELA, TABELA.CAMPO, TABELA.CAMPO=valor, or the operation's id
  type: string | null
  label: string | null
  custom: boolean
}>
export type InventoryPage = Readonly<{ entries: readonly InventoryEntry[]; next: string | null }>
/** One read of a system's dictionary, paged; outside `operations`, so no role, tool or probe sees it (as `copy`). */
export type ConnectorInventory = Readonly<{
  read: Operation<{ cursor: string | null; limit: number }, InventoryPage, 'read'>
}>
/** The entries of a connector with no dictionary: its declared operations, no call. */
export function declaredInventory(connector: Connector): InventoryEntry[]
```

`Connector` ganha `inventory?: ConnectorInventory`; `defineConnector` recusa uma leitura que não é
`read` ou repete um id, como `assertCopy`. O Sankhya pagina o dicionário em três fases (tabelas,
campos, opções), cada uma em ordem de chave com `pageSql` e `PAGE_ROWS`; o `cursor` é
`{ fase, depois }` em JSON, lido com Zod.

No Hub, `hub/ontology/public.ts` exporta:

```ts
export const InventoryRunId = z.uuid().brand<'InventoryRunId'>() // packages/hub-api/src/ontology.ts
export type InventoryReason = 'CAP' | 'REFUSED' | 'AUTH_REFUSED' | 'UNREADABLE' | 'BUSY' | 'UNREACHABLE' | 'DEADLINE' | 'NOT_IN_ROLE'
/** Starts the workflow of a run already opened; a failure to start is logged, and the run's lease ends it. */
export type InventoryClock = { start(input: { companyId: CompanyId; connectionId: ConnectionId; runId: InventoryRunId }): Promise<void> }
export type Opened = Readonly<{ kind: 'OPENED'; runId: InventoryRunId }> | Readonly<{ kind: 'RUNNING' }>
export type Ontology = {
  inventory: {
    /** In one transaction: `pg_advisory_xact_lock` on the connection, an open run inside its lease answers RUNNING, else a run row. */
    open(input: { companyId: CompanyId; connectionId: ConnectionId }): Promise<Opened>
    run(input: { companyId: CompanyId; runId: InventoryRunId }, signal: AbortSignal): Promise<InventoryEnd>
  }
  routes(app: FastifyInstance): void
}
export type InventoryEnd =
  | Readonly<{ kind: 'COMPLETE' | 'PARTIAL'; entries: number }>
  | Readonly<{ kind: 'FAILED'; reason: InventoryReason }>
  | Readonly<{ kind: 'GONE' }> // the connection or the run left
```

A abertura e o prazo: uma rodada está aberta enquanto não tem linha em `inventory_end` e
`started_at` tem menos de 15 minutos (o teto de 10 de `run.ts:17` mais folga; nenhuma renovação, porque
a rodada para sozinha no teto). A trava `pg_advisory_xact_lock` é da transação, não da sessão (D25).
Uma rodada vencida sem fim conta como `INTERRUPTED`: a abertura seguinte grava o `inventory_end` dela
antes de abrir a nova. A rota de ligar e **Ler de novo** abrem a rodada e só então chamam o relógio,
então o 409 sai da rota.

A rodada: lê as páginas por
`hub/connectors` (falando como versão que declara só a leitura do inventário, com `viewer` a pessoa
que ligou, `connection.linked_by`, como `readAsCopy`), grava as entradas de cada página, para no
teto de `run.ts:16-17` (`PARTIAL`, `CAP`), e na transação final grava o `inventory_end`. Um fim
`COMPLETE` apaga todas as rodadas anteriores da conexão; um `PARTIAL` apaga as anteriores que não são
`COMPLETE`; um `FAILED` não apaga nada. A página mostra a `COMPLETE` mais nova, ou, se não há, a
`PARTIAL` mais nova, e diz em uma linha o estado da última rodada. Um conector sem `inventory` grava `declaredInventory` numa
rodada só.

O workflow `conexus-source-inventory` (nome guardado, como `COPY_WORKFLOW`): um passo que lê
`{ version: 1, companyId, runId }` com Zod e chama `ontology.inventory.run`;
`autoRestartActiveRuns: false`. O relógio faz `createRun()` e `startAsync({ inputData })`.

As rotas, em `packages/hub-api/src/ontology.ts`, `BASE = '/api/companies/{companyId}/ontology'`:

| Método e caminho | Acesso | Saída | Falhas |
| --- | --- | --- | --- |
| `GET ${BASE}/inventories/{connectionId}` | todo membro (`readConnections`) | `{ inventory: { readAt, outcome, reason, tables, fields, codes, operations } \| null, last: { outcome, reason } \| null, running: boolean, mayRun: boolean }` | `NOT_FOUND`, `SESSION_REQUIRED`, `DATABASE_UNAVAILABLE` |
| `POST ${BASE}/inventories/{connectionId}/runs` | `manageConnections` | `202 { started: true }` | as de cima, `INVENTORY_RUNNING` (409) |

Sem `Idempotency-Key` (web W24 se cumpre pela abertura única: a segunda tentativa recebe 409 e a
tela relê o estado).

Os códigos de falha (C48), em `packages/hub-api/src/ontology-failures.ts`, espalhados em `FAILURES`
(`failures.ts:273-282`): `INVENTORY_RUNNING` (`USER`, 409, "O inventário desta conexão já está
sendo lido.", "Espere terminar.").

### As skills e a leitura

As linhas `@mastra/core` (skill `mastra`, `node_modules/@mastra/core/dist/docs/`), `zod`, `fastify`
(`fastify-best-practices`), `react` e `@tanstack/react-query` de `docs/reference/stack.md`. O guia de
dados (D22: a chamada ao Sankhya fora da transação; D25: só a trava da transação, e o prazo da rodada).

### A ordem do trabalho

1. Apagar nada. Criar `kernel/inventory.ts` e a checagem em `definition.ts`. Regras: C23, C27.
2. `sankhya/inventory.ts`: as três fases pelas tabelas que `SKILL.md:49-51` nomeia, cada uma com
   `pageSql` e a chave da tabela; o campo próprio pela marca de `SKILL.md:50`. O dublê ganha as
   tabelas do dicionário com linhas inventadas, coerentes com as tabelas de `fake-sales.ts:121-135`.
3. `hub/connectors/inventory-port.ts`: a leitura como versão, cópia de `readAsCopy` sem o caminho
   do lote da cópia (o Sankhya conta por conta).
4. `hub/ontology/inventory.ts`: a rodada, com o teto e a troca. Depois de ligar (`routes.ts:49`, só
   quando `made.created`) e em **Ler de novo**, `ontology.inventory.open(...)` e, aberta,
   `deps.inventory().start({ ..., runId })`; ao ligar, a falha de qualquer dos dois vai ao log com
   `logFailure` e a ligação responde como hoje.
5. O workflow e o relógio em `builder/ontology/`, ligados em `conversations-of.ts` como o
   `copyClockOf`.
6. A rota e o bloco Inventário na página da conexão.
7. A ferramenta `inventory_search` nos dois agentes (o leitor do inventário): entrada `{ connection,
   text: SearchText, kind?: 'TABLE' | 'FIELD' | 'CODE' | 'OPERATION', limit: 1 a 50 }`; resposta
   `{ kind: 'OK', readAt, entries: InventoryEntry[], more }`, ou `NOT_GRANTED`, ou
   `{ kind: 'EMPTY' }` (nenhuma rodada `COMPLETE` ou `PARTIAL`), um resultado da ferramenta e não
   uma falha de rota. O acesso é o mesmo de `connector_notes` (`runIn`,
   `connector-tools.ts`), sem chamada ao sistema. A skill do Sankhya passa a dizer "read the inventory
   first; ask the person only what it does not say". `BUILDER_TOOL.inventorySearch`, no `READ` de
   `permissions.ts`.

### Como se prova

Critérios 4 a 7, pelo Hub de teste com o dublê do Sankhya e do Mercado Livre (testes T5: pela porta
pública; T26: a resposta do dublê na forma que o DbExplorer manda, com `userType`). O critério 7
usa a recusa gravada do kit. Falham hoje: a rota responde 404.

### Parar se

- O dicionário de uma empresa passa de 200 páginas de 500 linhas: o inventário fica `PARTIAL`;
  relatar o número na rodada do fechamento, sem mudar o teto.
- O Sankhya conta o limite pelo app: aí a leitura entra na fila das cópias (`copy-port.ts:126-133`);
  relatar antes de construir a fila.

## U3 A proposta com prova

**Base e modelo.** O commit da U2. Opus: a unidade cruza o kit, o Hub e os dois agentes, e o
compilador de SQL é a peça de segurança da etapa.

### As linhas da tabela

- A proposta por item, a prova sem linha, a SQL do conceito no dialeto do conector, os códigos com
  significado.
- Ler: `apps/server/src/hub/connectors/notes.ts:1-162` inteiro (o que sai);
  `apps/server/src/builder/connectors/connector-tools.ts:258-332`;
  `apps/server/src/builder/assistant/assistant.ts:212` (`maysFor`), `:237-247` (o `note`, que
  sai); `apps/server/src/builder/assistant/prompt/assistant.md:60-62`;
  `apps/server/src/builder/conversation/prompt/prompt.ts:159-178` (a linha "Notebook:");
  `apps/server/src/builder/conversation/prompt/builder.md:47` (o `source` da memória do app, #815);
  `packages/connectors/src/sankhya/door.ts:102-142`; `refusals.ts:54-57`; `fake-data.ts:107-125`;
  `fake-sales.ts:178-211`; `read-only-sql.ts:1-10` e `isOneReadStatement`; `search-sql.ts:1-88`;
  `copy-read.ts:25-60`; `apps/server/src/hub/connectors/read.ts:16-32`, `:139-181`;
  `apps/server/src/hub/copies/propose.ts:214` e `builder/connectors/copy-propose.ts` (a forma da
  ferramenta que propõe e da resposta); `apps/web/src/hub/connectors/notes.tsx` (o que sai).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | cria `concepts.ts` (o contrato `ConceptRead`); muda `definition.ts` | o Sankhya; `hub/connectors` |
| `packages/connectors/src/sankhya/` | cria `concept-read.ts` e `concept-read.test.ts`; muda `door.ts` (`colunas` na saída de `consultar`), `fake-data.ts` (o `userType`), `fake-sales.ts` (o parceiro do vendedor e a origem do item), `definition.ts`, `skill/SKILL.md` (as linhas 63-65: propor com `concept_propose`, e as duas formas do papel) | o Sankhya |
| `apps/server/src/hub/connectors/` | apaga `notes.ts`; cria `concept-port.ts` (a prova e a consulta pela porta, `readThrough`); muda `public.ts`, `builder-port.ts`, `assistant-port.ts` | `hub/ontology`, o Builder |
| `apps/server/src/hub/ontology/` | cria `propose.ts`, `proof.ts`, `items.ts` (os esquemas), `notebook.ts` (os itens `NOTE` para `connector_notes`) | os agentes |
| `apps/server/migrations/` | cria a migração que copia as notas para itens `NOTE` | — |
| `apps/server/src/builder/connectors/` | cria `concept-propose.ts`; muda `connector-tools.ts` (sai `noteSaveTool`; `notesTool` lê os itens `NOTE`) | `conversation/builder.ts`, `assistant/connector-access.ts` |
| `apps/server/src/builder/assistant/` | muda `connector-access.ts` (sai `mayNote`), `assistant.ts`, `prompt/assistant.md` | — |
| `apps/server/src/builder/conversation/` | muda `builder.ts:94`, `permissions.ts:31-32`, `prompt/prompt.ts:170`, `prompt/builder.md:47` | — |
| `packages/hub-api/src/` | muda `tools.ts` (sai `connectorNoteSave`, entra `conceptPropose`), `ontology.ts`, `ontology-failures.ts` | o Hub, a web |
| `apps/web/src/hub/connectors/` | apaga `notes.tsx`; muda `connection-page.tsx`, `text.ts` | — |

### Os contratos que a unidade cria

No kit, `packages/connectors/src/kernel/concepts.ts`:

```ts
export type ConceptColumn = Readonly<{ column: string; type: 'ID' | 'TEXT' | 'INTEGER' | 'DECIMAL' | 'MONEY' | 'DATE' | 'TIMESTAMP' | 'BOOLEAN' | 'CODE' }>
export type ConceptFilter =
  | Readonly<{ column: string; op: 'equals'; value: string | number | boolean }>
  | Readonly<{ column: string; op: 'in'; values: readonly (string | number)[] }>
  | Readonly<{ column: string; op: 'from' | 'to'; value: string | number }>
  | Readonly<{ column: string; op: 'contains'; text: string }>
export type ConceptMeasure = Readonly<{ count: boolean; sum: readonly string[]; groupBy: readonly string[] }>
export type ConceptCall = Readonly<{
  sql: string // the proved query, as stored
  columns: readonly ConceptColumn[] // the concept's fields, by their column
  select: readonly string[]
  filters: readonly ConceptFilter[]
  measure?: ConceptMeasure
  limit: number // 1 to 100; one row more says there are more
  order: readonly string[] // the concept's key columns
}>
/** The connector's dialect for a concept's read; the kit never sees a concept, only a proved query and typed columns. */
export type ConceptRead = Readonly<{
  door: string // the door operation that runs the statements (Sankhya: 'consultar')
  count(sql: string): string
  shape(sql: string): string
  /** The rows of a role's read with no pair in its base's read, counted; zero proves the role is a subset. Keys pair by position. */
  subset(role: string, base: string, keys: readonly (readonly [string, string])[]): string
  compile(call: ConceptCall): string
}>
```

`Connector` ganha `conceptRead?: ConceptRead`. O Sankhya (`concept-read.ts`): a consulta entra como
`(<sql>) Q`; um número sai de `Number.isInteger` ou `Number.isFinite` e nunca é texto; um código, que é
texto exato (o `escaped` de `search-sql.ts:23-27` dobra a caixa e tira o acento, feito para `LIKE`, e
não serve), por uma função nova do kit em `search-sql.ts`, `exact(value)`: `CodeText` (1 a 40
caracteres de `[\p{L}\p{N} ._/-]`, sem `MARKS`) e a aspa dobrada (um código com outro caractere
volta como recusa do item, `CODE_UNSEEN`, e é um caso do teste "injeções"), e `inExact(column, values)` para o
`in` de texto; `inList` (`search-sql.ts:51-53`) fica para números. Uma data, por `z.iso.date()` e
`dated`; um texto, por `SearchText` e `containing` (`search-sql.ts:35-48`). Sem medida, a página é
`pageSql({ from: '(<sql>) Q', order: <as colunas da chave> })`. Com medida, a agregação vira o
`from` da página: `pageSql({ select: ['M.*'], from: '(SELECT <groupBy>, COUNT(*) AS "count", SUM(Q.X)
AS "sum_<campo>" FROM (<sql>) Q WHERE … GROUP BY <groupBy>) M', order: <groupBy, ou "count"> })`;
`groupBy` só de colunas `ID` ou `CODE`, até 2; sem `groupBy`, uma linha só, ordem `"count"`. `more`
é a linha `EXTRA = 'S'` ou `completo: false` da porta (`door.ts:116`). Toda saída passa por
`isOneReadStatement` antes de sair (a porta confere de novo, `door.ts:103`). `count(sql)` é `SELECT
COUNT(*) AS N FROM (<sql>) Q`; `shape(sql)` é a página de uma linha. `subset(role, base, keys)` é
`SELECT COUNT(*) AS N FROM (<role>) R WHERE NOT EXISTS (SELECT 1 FROM (<base>) B WHERE B.<b1> = R.<r1>
AND …)`, de 1 a 4 pares; cada coluna de chave tem de estar na forma da prova do seu lado e casar
`^[A-Za-z_][A-Za-z0-9_]{0,127}$`, senão a função recusa antes de escrever a SQL, e a saída passa por
`isOneReadStatement` como as outras.

`consultar` (`door.ts:124-142`) responde também `colunas: { nome: string; tipo: string | null }[]`,
de `fieldsMetadata` (`name`, `userType`).

No Hub, os itens, em `packages/hub-api/src/ontology.ts` (uma união pelo campo `kind`, C21):

```ts
const Key = z.string().regex(/^[a-z][a-z0-9_]{0,39}$/) // no brand: each key brands it once
export const ConceptKey = Key.brand<'ConceptKey'>()
export const FieldKey = Key.brand<'FieldKey'>()
export const RelationKey = Key.brand<'RelationKey'>()
export const FieldType = z.enum(['ID', 'TEXT', 'INTEGER', 'DECIMAL', 'MONEY', 'DATE', 'TIMESTAMP', 'BOOLEAN', 'CODE'])
export const Cardinality = z.enum(['MANY_TO_ONE', 'ONE_TO_ONE', 'MANY_TO_MANY'])
/** The address of an active element: `pedido`, `pedido.tipo_operacao`, `pedido.tipo_operacao=101`, `@pedido_vendedor`. */
export const Target = z.string().max(130).regex(/^(@[a-z][a-z0-9_]{0,39}|[a-z][a-z0-9_]{0,39}(\.[a-z][a-z0-9_]{0,39}(=[^\s]{1,40})?)?)$/).brand<'OntologyTarget'>()
const Name = z.string().min(1).max(80)
export const OntologyProposalId = z.uuid().brand<'OntologyProposalId'>()
export const ProofRunId = z.uuid().brand<'ProofRunId'>()
export const ProposedItem = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('ADD_CONCEPT'), concept: z.object({ key: ConceptKey, name: Name, plural: Name, description: z.string().max(500), synonyms: z.array(Name).max(10), titleField: FieldKey, keyFields: z.array(FieldKey).min(1).max(4), base: ConceptKey.optional(), state: z.enum(['EXPERIMENTAL', 'ACTIVE']) }) }), // base: this concept is a role of that one
  z.object({ kind: z.literal('ADD_FIELD'), concept: ConceptKey, field: z.object({ key: FieldKey, name: Name, description: z.string().max(200), type: FieldType, currency: z.string().regex(/^[A-Z]{3}$/).optional(), unit: z.string().max(12).optional(), column: z.string().max(128) }) }),
  z.object({ kind: z.literal('SET_CODE'), concept: ConceptKey, field: FieldKey, value: z.string().min(1).max(40), label: z.string().max(80), description: z.string().max(200).optional(), dictionary: z.string().max(200).optional() }), // the inventory entry the agent cites; origin is the server's
  z.object({ kind: z.literal('ADD_RELATION'), relation: z.object({ key: RelationKey, from: ConceptKey, to: ConceptKey, cardinality: Cardinality, pairs: RelationPairs, fromName: Name, toName: Name, through: ConceptKey.optional(), throughPairs: RelationPairs.optional() }) }), // with through: pairs reach the join, throughPairs leave it
  z.object({ kind: z.literal('SET_SOURCE'), concept: ConceptKey, sql: z.string().min(1).max(4000) }),
  z.object({ kind: z.literal('RENAME_LABEL'), target: Target, name: z.string().max(80), description: z.string().max(500).optional() }),
  z.object({ kind: z.literal('DEPRECATE'), target: Target, reason: z.string().max(500), replacedBy: Target.optional() }),
])
// NOTE is written only by the migration; no tool or route accepts it.
```

A ferramenta `concept_propose` (`BUILDER_TOOL.conceptPropose = 'concept_propose'`): entrada
`{ connection, demand, items: ProposedItem[] (1 a 40) }` (o conector sai da conexão); resposta
`{ kind: 'PROPOSED', proposalId, baseRevision, items: { n, target, proof?: { rows, columns } }[], refused: { target, reason: ItemRefusal }[] }`,
com `ItemRefusal = 'CONCEPT_INCOMPLETE' | 'FIELD_NOT_IN_PROOF' | 'CODE_UNSEEN' | 'PROOF_FAILED' |
'NOT_IN_ROLE' | 'RELATION_INVALID' | 'TARGET_UNKNOWN' | 'ITEM_REPEATED' | 'ROLE_NOT_SUBSET' |
'ROLE_KEY_MISMATCH'` (e, para `PROOF_FAILED`, o tipo da resposta em `detail`; para `ROLE_NOT_SUBSET`,
a contagem das linhas fora da base), ou a recusa da conexão como ela vem (`NOT_GRANTED`,
`DATABASE_UNAVAILABLE`). A prova roda com o papel de quem fala: um item que precisa da porta e cujo
papel não tem `consultar` volta `NOT_IN_ROLE`, e os outros itens seguem. As regras
de prova, em `hub/ontology/propose.ts`:

| Item | A prova | A recusa |
| --- | --- | --- |
| `SET_SOURCE` | `count` e `shape` pela porta, gravados num `proof_run` | `PROOF_FAILED` com o tipo da resposta; `NOT_IN_ROLE` sem `consultar` |
| `ADD_CONCEPT` | uma fonte na proposta ou ativa; os campos da chave e do título nos itens ou no ativo | `CONCEPT_INCOMPLETE` |
| `ADD_FIELD` | a coluna na forma da prova da fonte do conceito (a da proposta, ou a mais nova `OK` da ativa) | `FIELD_NOT_IN_PROOF` |
| `SET_CODE` | um valor novo: a contagem `compile({ filters: [{ column, op: 'equals', value }], measure: { count: true } })` maior que zero; um valor ativo que só muda o rótulo: nenhuma chamada. A origem: `DICTIONARY` se `dictionary` nomeia uma entrada `CODE` do inventário da conexão que termina em `=<valor>`, senão `PERSON`; a sugestão pela tela é sempre `PERSON` | `CODE_UNSEEN`; `NOT_IN_ROLE` sem `consultar` |
| `ADD_CONCEPT` com `base` | a base ativa ou na proposta, e o mesmo número de campos de chave que ela; o `SET_SOURCE` do papel roda também `subset(sqlDoPapel, sqlDaBase, chaves)`, gravado no mesmo `proof_run` em `outside_base`, e ela tem de dar zero. A fonte da base é a da proposta ou a ativa | `CONCEPT_INCOMPLETE` sem a base; `ROLE_KEY_MISMATCH`; `ROLE_NOT_SUBSET` com a contagem |
| `ADD_RELATION` | os dois conceitos e os campos dos pares, na proposta ou no ativo; com `through`, a junção e `throughPairs`: os campos de `pairs` são do conceito de origem e da junção, os de `throughPairs` da junção e do conceito de destino; `from` igual a `to` vale | `RELATION_INVALID` |
| `RENAME_LABEL`, `DEPRECATE` | o alvo ativo | `TARGET_UNKNOWN` |
| qualquer | o mesmo `target` pendente na mesma proposta | `ITEM_REPEATED` |

A primeira chamada de uma conversa abre a proposta; as seguintes acrescentam (o índice parcial da
U1). Os dois agentes têm a ferramenta para todo membro; o Assistente, nunca numa rodada de automação.

A migração das notas: para cada `(conexão, conceito)` de `connectors.connection.notes`, uma proposta
(`demand` "Do caderno: <conceito>", `proposed_by` o `writtenBy`, `agent` `NULL`, `base_revision`
0) com um item `NOTE` cujo `content` é `{ connectionId, concept, mapping, provingQuery, provedAt,
provedRows }`. A ferramenta `connector_notes` passa a ler esses itens, com a mesma forma de resposta
de hoje e a descrição "notas antigas, não aprovadas: proponha cada uma de novo com
`concept_propose` e uma prova".

### As skills e a leitura

As linhas `@mastra/core` (skill `mastra`: `createTool`), `zod`, `drizzle-orm`, `fastify` e `react` de
`docs/reference/stack.md`. O guia de testes (T5, T13, T26). Segurança S40.

### A ordem do trabalho

1. Apagar primeiro: `noteSaveTool` (`connector-tools.ts:278-305`), `provedAndSaved` e `save`
   (`notes.ts:78-151`), `erase` (`:153-162`) e a rota dele, o `note` de `maysFor`
   (`assistant.ts:237-247`), a seção "# Notes on a connection" (`assistant.md:60-62`), `BUILDER_TOOL.connectorNoteSave` e o
   `Notebook` da página da conexão. Regras: C75, delivery L7.
2. A saída de `consultar` com `colunas`, e o dublê com `userType` (de `INTEGER` `I`, `TEXT` `S`,
   `REAL` `F`, `DATE` `D`), com um teste que lê a resposta gravada de `refusals.ts:54-57`.
3. `concept-read.ts` e os testes de injeção, no molde de `read-only-sql.test.ts`: aspas, `;`,
   comentário, palavra de comando, `q'`, `%`, `_`, `\` e `[` num texto (o #929), um número com letra,
   uma data fora do formato, um código fora do enum, uma coluna que não é do conceito, `in` com 51
   valores, e, na `subset`, uma coluna de chave fora da forma da prova, com aspa, espaço ou palavra
   de comando, e 5 pares. Cada caso volta recusado antes de virar SQL, e a SQL boa passa por
   `isOneReadStatement`.
3a. O dublê do Sankhya ganha, com dados inventados e as colunas do esquema público do Sankhya, o que o
   roteiro usa: o parceiro de cada vendedor (`TGFVEN.CODPARC`), alguns parceiros que não são clientes
   (a marca `CLIENTE` de `TGFPAR` já existe, `fake-sales.ts:125-127`) e a origem de cada item
   (`TGFVAR`: `NUNOTA`, `SEQUENCIA`, `NUNOTAORIG`, `SEQUENCIAORIG`), coerentes com as linhas de hoje
   e com uma linha de papel fora da base para o critério 30.
4. `hub/connectors/concept-port.ts`: `prove(opened, sql)` e `query(opened, call)`, os dois por
   `readThrough` com o `speaker` de quem fala (a pessoa, ou o papel do turno), nunca como versão.
5. `hub/ontology/propose.ts` e `proof.ts`: a prova fora da transação (D22), a proposta e os itens
   numa transação. Regras: C21, C27, C48, C49.
6. `concept-propose.ts` nos dois agentes; a linha "Notebook:" vira "Old notes to prove again: …"
   (U5 acrescenta "Concepts:"); `builder.md:47` manda o `source` da memória do app só para o que é do
   app, e o código com significado para `concept_propose` (o #815).
7. A migração das notas e `notesTool` lendo os itens `NOTE`.
8. A skill do Sankhya, `SKILL.md:63-65`: "Record what you proved" vira "propose it with
   `concept_propose`". A descrição de `concept_propose`, que vale para qualquer conector, diz as duas
   formas do papel (o princípio): "A role is either a slice of a base concept (`base`: the same key,
   its own read, proved a subset of the base) or a concept with its own key, linked to the other.
   Choose by what the inventory and the proof show, never by a fixed rule; ask the person only what
   the data cannot settle." Nenhum nome de papel entra na skill nem na descrição.

### Como se prova

Critérios 8 a 12. O 8 e o 9 pelo Builder de teste com o modelo dublê chamando `concept_propose`
(T24) e o Sankhya dublê; o 10 pela migração sobre um banco com notas gravadas pelo caminho de hoje
antes dela; o 11 em `concept-read.test.ts` sem servidor (é uma função do kit); o 12 com um membro
sem `manageConnections`. O critério 10 tem também `git grep -n "connection.notes\|\.notes)" apps/server/src`
vazio, que o revisor roda.

### Parar se

- O DbExplorer de verdade não manda `userType` numa resposta sem linha: a forma guarda `type: null`;
  relatar, porque a etapa da saúde depende do tipo.
- Um item de proposta precisa de um campo que o esquema acima não tem: parar; não inventar.

## U4 A aprovação e as telas

**Base e modelo.** O commit da U3. Opus para a rota de decidir (concorrência e a regra do dono);
Sonnet para as telas, se a unidade se dividir.

### As linhas da tabela

- A proposta por item e em lote, a primeira revisão do dono e a permissão L1, a decisão com a
  revisão esperada, as telas.
- Ler: `apps/server/src/hub/identity/roles.ts:24-31`, `:71-85`, `:86-110`;
  `apps/server/src/hub/identity/admission.ts:27`, `:109`; `admission.ts:157` (`allows`),
  `:333-362` (`admit`, o `NOT_FOUND` sem a role); `apps/server/src/builder/assistant/company-memory-routes.ts:26-37` (o membro admitido, a role
  conferida depois, `NOT_IN_ROLE` com o nome da operação); `apps/server/src/hub/copies/accept.ts:19-45`
  (a linha travada, a tentativa); `apps/server/src/platform/database.ts:171` (`violatedConstraint`);
  `packages/hub-api/src/failures.ts:265-272` (`NOT_IN_ROLE`), `:273-282`; `packages/hub-api/src/company-memory.ts:74-108` (a forma de `defineOperation`); `apps/web/src/routes/_app/companies/$companyId/route.tsx:43-96` (`RailPlaces`, o menu) e
  `copies.index.tsx`, `copies.$copyId.tsx` (a página de Cópias, o molde); o cartão do
  `copy_propose` na conversa (`apps/web/src/builder/conversation/`, a peça que desenha o resultado
  dele).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/` | muda `roles.ts` (`ontology: ['approve']` em `MANAGE_COMPANY` e no `createAccessControl`), `admission.ts` (`proposeConcepts`, `approveConcepts`) | `hub/ontology` |
| `apps/server/src/hub/ontology/` | cria `decide.ts`, `suggest.ts`, `active.ts` (o conjunto ativo e o hash), `reads.ts`; muda `routes.ts`, `public.ts` | a web; U5 |
| `packages/hub-api/src/` | muda `ontology.ts`, `ontology-failures.ts` | a web |
| `apps/web/src/hub/ontology/` | cria a lista, a página, o código, Para revisar, Histórico, `queries.ts`, `text.ts`, `public.ts` | a rota |
| `apps/web/src/routes/_app/companies/$companyId/` | cria `knowledge.index.tsx`, `knowledge.$concept.tsx`; muda `route.tsx` (o botão Conhecimento em `RailPlaces`, depois de Cópias, sem condição) | o gerador de rotas (`routeTree.gen.ts`) |
| `apps/web/src/builder/conversation/` | cria o cartão do resultado de `concept_propose` | — |

### Os contratos que a unidade cria

As ações (`admission.ts`): `proposeConcepts: { by: 'MEMBER', statement: undefined, locks: true }`
(todo membro, `Q1`; trava a linha do membro até gravar, S8) e `approveConcepts: { by: 'MEMBER',
statement: { ontology: ['approve'] }, locks: true }`. As leituras (`GET`) admitem com
`readCompany`, sem trava, como a memória da empresa (`company-memory-routes.ts:29`). O papel da empresa criado pela empresa não
recebe `ontology` (ele guarda só conectores, `roles.ts`, `memberBase`).

As rotas, `BASE = '/api/companies/{companyId}/ontology'`:

| Método e caminho | Acesso | Entrada | Saída | Falhas |
| --- | --- | --- | --- | --- |
| `GET ${BASE}` | todo membro (`readCompany`) | — | `{ revision: { number, hash, proposedBy, approvedBy, approvedAt } \| null, concepts: ConceptRow[], toReview: number, mayApprove: boolean, awaits: 'OWNER' \| 'APPROVER' \| null }` | `NOT_FOUND`, `SESSION_REQUIRED`, `DATABASE_UNAVAILABLE` |
| `GET ${BASE}/concepts/{concept}` | todo membro | — | o conceito com campos, códigos, ligações, a fonte (a conexão pelo nome, a consulta, a prova: linhas e quando) | as de cima |
| `GET ${BASE}/proposals` | todo membro | `?state=OPEN` | as propostas com os itens, o antes e o depois de cada um | as de cima |
| `GET ${BASE}/revisions` | todo membro | — | as revisões, mais nova primeiro, com quem propôs e quem aprovou | as de cima |
| `POST ${BASE}/proposals` | todo membro (`proposeConcepts`) | `Idempotency-Key`; `{ why: 1 a 500, items: (SET_CODE \| RENAME_LABEL \| DEPRECATE)[] (1 a 10) }` | `201 { proposalId }` | as de cima, `REQUEST_MALFORMED`, `IDEMPOTENCY_CONFLICT`, `CODE_UNSEEN`, `TARGET_UNKNOWN`, e as da porta para um código novo: `NOT_IN_ROLE`, `NOT_GRANTED`, `PROOF_FAILED` |
| `POST ${BASE}/proposals/{proposalId}/decisions` | `proposeConcepts`, e o papel conferido depois | `{ approved: int[], refused: { n, reason }[], expectedRevision: int }`, ao menos um item | `200 { revision: number \| null }`; sem `Idempotency-Key`: `expectedRevision` e `ITEM_DECIDED` tornam a repetição inofensiva (web W24) | as de cima, `FIRST_REVISION_OWNER` (403), `NOT_IN_ROLE` (409), `REVISION_STALE` (412), `DECISION_INCOMPLETE` (422, com os itens), `ITEM_NOT_APPROVABLE` (409), `ITEM_DECIDED` (409) |

Os códigos novos (C48), em `ontology-failures.ts`, todos `settles: true` e `actionKind: 'NONE'`
salvo `REVISION_STALE` (`'RETRY'`, a tela relê):

| Código | Categoria, status | Frase | Ação |
| --- | --- | --- | --- |
| `INVENTORY_RUNNING` | `USER`, 409 | O inventário desta conexão já está sendo lido. | Espere terminar. |
| `FIRST_REVISION_OWNER` | `USER`, 403 | Só o dono aprova a primeira revisão dos conceitos. | Peça ao dono. |
| `REVISION_STALE` | `USER`, 412 | Os conceitos mudaram enquanto você revisava. | Veja de novo. |
| `DECISION_INCOMPLETE` | `USER`, 422 | Falta aprovar o que estes itens precisam. | Aprove ou recuse os itens marcados. |
| `ITEM_NOT_APPROVABLE` | `USER`, 409 | Uma nota do caderno não se aprova: o Builder a refaz com prova. | Recuse a nota. |
| `ITEM_DECIDED` | `USER`, 409 | Este item já foi decidido. | Veja de novo. |
| `CODE_UNSEEN` | `USER`, 422 | Este código não aparece no sistema. | Confira o valor. |
| `TARGET_UNKNOWN` | `USER`, 404 | Isto não existe mais nos conceitos. | Veja de novo. |
| `PROOF_FAILED` | `THIRD_PARTY`, 502 | Não foi possível provar no sistema. | Tente de novo. |
| `CONCEPT_UNKNOWN` | `USER`, 404 | Este conceito não existe para você. | Leia o catálogo. |

O `NOT_IN_ROLE` leva `operation` "os conceitos da empresa". Os outros motivos de item
(`CONCEPT_INCOMPLETE`, `FIELD_NOT_IN_PROOF`, `RELATION_INVALID`, `ITEM_REPEATED`) só voltam dentro
de `refused` da ferramenta, para o modelo, e não são falhas de rota.

A decisão, em `decide.ts`, numa transação (`database.command(companyScope(...))`):

```ts
const admitted = await identity.admit({ tx, personId, companyId, action: 'proposeConcepts' })
const current = await currentRevision(tx) // max(number), or 0
if (current === 0 && fixedNameOf(admitted.role) !== 'owner') throw new Failure('FIRST_REVISION_OWNER')
if (current > 0 && !identity.allows(admitted.role, 'approveConcepts'))
  throw new Failure('NOT_IN_ROLE', { named: { operation: 'os conceitos da empresa' } })
if (current !== input.expectedRevision) throw new Failure('REVISION_STALE')
const items = await pendingItems(tx, proposalId, numbers) // SELECT … FOR UPDATE; a decided one: ITEM_DECIDED
const versions = versionsOf(approvedItems, current + 1) // pure; a switch on `kind`, exhaustive (C22); NOTE: ITEM_NOT_APPROVABLE
const next = applied(await activeSet(tx), versions) // pure
const missing = incomplete(next) // a concept with no source or no title/key field; a field with no concept; a code with no field;
// a relation with no concepts, pair fields, `through` or `throughPairs`; a DEPRECATE whose replacedBy is not active;
// a role whose base is not active; a DEPRECATE of a base that still has an active role (the items name the roles)
if (missing.length > 0) throw new Failure('DECISION_INCOMPLETE', { details: { items: missing } })
if (versions.length > 0) {
  await insertRevision(tx, { number: current + 1, hash: hashOf(next), proposalId, proposedBy, approvedBy: personId })
  // 23505 on revision_pkey (violatedConstraint) → REVISION_STALE
  await insertVersions(tx, versions)
}
await markDecisions(tx, …) // and CLOSED when none is PENDING
```

`hashOf`: sha-256 (`node:crypto`) do JSON do conjunto ativo sem `company_id` e `revision`, cada
lista em ordem de chave e cada objeto com as chaves em ordem fixa. Depois da transação, sem ela
aberta (D22): nada mais nesta etapa; o cartão do Brain liga ali a projeção (a antiga U6).

### As skills e a leitura

As linhas `better-auth` (`organization-best-practices`, `better-auth-best-practices`), `fastify`,
`zod`, `react`, `@tanstack/react-router` (as skills `router-core`), `@tanstack/react-query` e
`@base-ui/react` de `docs/reference/stack.md`; `docs/reference/impeccable.md` para as telas. O guia
web (W17, W24, W32, W34). Segurança S6, S8, S10.

### A ordem do trabalho

1. A permissão e as duas ações. Regras: S6, C26.
2. `active.ts` (o conjunto, `applied`, `incomplete`, `hashOf`), puro e testado sem banco.
3. `decide.ts` e a rota, com os critérios 13 a 16. Regras: C38, C65, D22.
4. `suggest.ts` e a rota, com a chave de tentativa (C37) e as regras de prova da U3 para os três
   tipos de item.
5. As leituras e as telas: a página Conhecimento, no molde de `copies.index.tsx:6-13`
   (`createFileRoute('/_app/companies/$companyId/knowledge/')`, `staticData: { place: 'Conhecimento' }`,
   o `loader` com a leitura de `GET ${BASE}`, `pendingComponent: Loading`, `errorComponent:
   RouteReadFailure`), sem `beforeLoad` de permissão, porque todo membro a vê; o botão
   `SidebarRailButton` "Conhecimento" em `RailPlaces` depois do de Cópias, fora de qualquer `may.*`.
   A aba fica no endereço (`validateSearch`, `?aba=conceitos|revisar|historico`, `conceitos` por
   padrão) e a página de um conceito em `knowledge.$concept.tsx`, o código aberto por `?campo=` (web
   W18: cada vista tem endereço); a lista, a página (um papel com "Papel de <base>" e o link), o código
   com **Sugerir mudança**, Para revisar e Histórico, cada estado da matriz; cada "não encontrado" com
   **Voltar aos conceitos** (W34). A página abre na metade "Como a empresa é" (o nome da metade
   sobre as abas, "2. A"), com o lugar do fluxo, vazio, no alto de Conceitos e na página de um
   conceito, a frase da matriz; a troca para "O que a empresa sabe" e as páginas do Brain que citam
   o conceito são do cartão do Brain. O grafo não entra (a página do fundador).
6. O cartão do resultado de `concept_propose` na conversa, com **Revisar e aprovar** para Para
   revisar.

### Como se prova

Critérios 13 a 18. A corrida do 15 com duas transações abertas sobre a mesma base, a segunda depois
da primeira gravar (código C65: provar a corrida). As telas com Vitest e a página de teste do Hub
(`apps/web/src/platform/test-hub.tsx`), a 1280 e a 390 px e nos dois temas, no QA da etapa.

### Parar se

- Um texto de tela que esta seção não escreve: usar as frases da matriz; uma frase nova vai ao
  fundador no fim, com os textos das telas.
- A U4 passa de 1.300 linhas: dividir em U4a (as rotas) e U4b (as telas) antes de seguir.

## U5 As ferramentas

**Base e modelo.** O commit da U4, com o Alinhamento fechado. Sonnet, no molde das leituras tipadas do
Assistente (`apps/server/src/builder/connectors/typed-reads.ts`) e de `connector-tools.ts`.

### As linhas da tabela

- Ferramentas geradas dos metadados, o recorte do SDK (a forma).
- Ler: `connector-tools.ts:1-120` (o acesso, `runIn`, o `NOT_GRANTED`), `:188-216`
  (`answerWords`, `readOn`); `assistant.ts:234-249` (as ferramentas por turno); `apps/server/src/hub/identity/role-statements.ts:14-24`
  (a operação de cada papel); `apps/server/src/builder/conversation/prompt/prompt.ts:159-178`;
  `apps/server/src/builder/assistant/instructions.ts`; o Twenty nas linhas da tabela de
  referência; `node_modules/zod` (`z.toJSONSchema`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/ontology/` | cria `descriptors.ts`; muda `public.ts` (a porta `descriptorsFor`) | o Builder |
| `apps/server/src/builder/ontology/` | cria `tools.ts`, `catalog.ts` | `conversation/builder.ts`, `assistant/assistant.ts` |
| `apps/server/src/builder/conversation/` | muda `builder.ts`, `permissions.ts` (as duas no `READ`), `prompt/prompt.ts` ("Concepts:") | — |
| `apps/server/src/builder/assistant/` | muda `assistant.ts`, `instructions.ts` (o catálogo) | — |
| `packages/hub-api/src/` | muda `tools.ts` (`conceptRead`, `conceptQuery`) | o Hub, a web |

### Os contratos que a unidade cria

```ts
// hub/ontology/descriptors.ts
export type ConceptDescriptor = Readonly<{
  concept: ConceptKey
  name: string
  plural: string
  description: string
  revision: number
  base?: ConceptKey // a role of this concept; the reader follows it for the base's relations
  fields: readonly Readonly<{ key: FieldKey; name: string; type: FieldType; codes?: readonly { value: string; meaning: string }[] }>[]
  relations: readonly Readonly<{ key: RelationKey; to: ConceptKey; name: string; pairs: readonly [FieldKey, FieldKey][]; through?: Readonly<{ concept: ConceptKey; pairs: readonly [FieldKey, FieldKey][] }> }>[]
  source: Readonly<{ connectionId: ConnectionId; connector: ConnectorId; operation: OperationId; provedAt: string; rows: number }>
  state: 'EXPERIMENTAL' | 'ACTIVE'
  warning?: string // a field whose column a newer proof saw with another type is left out, by name
}>
/** The active concepts the reader reaches: active revision ∩ the role holds the source's door operation ∩ (in a Projeto) the connection is released to it. */
export function descriptorsFor(input: { companyId: CompanyId; speaker: Speaker; connections: readonly ConnectionId[] }): Promise<ConceptDescriptor[]>
```

A coluna que mudou: a prova mais nova da mesma `(connection_id, query)` da fonte ativa (o índice da
U1) dá o tipo bruto de cada coluna; o tipo do campo é compatível com ele por uma tabela só, em
`descriptors.ts`: `I` com `ID`, `INTEGER`, `CODE`, `BOOLEAN`; `F` com `DECIMAL`, `MONEY`, `INTEGER`,
`CODE`; `S` com `TEXT`, `ID`, `CODE`, `BOOLEAN`; `D` com `DATE`; `H` com `TIMESTAMP` e `DATE`
(`refusals.ts:54-57` grava `H` e `F`); `null` é compatível com tudo. Uma prova só tira um campo do
descritor, nunca acrescenta: a máquina detecta e a pessoa decide (0064). O dublê manda `D` para as
datas que guarda como texto (`fake-sales.ts:184-188`).

As ferramentas, em `builder/ontology/tools.ts`:

- `concept_read({ concept })`: o descritor, ou `CONCEPT_UNKNOWN`.
- `concept_query({ concept, fields, filters, measure, limit })`: o esquema é o Zod montado do
  descritor (campos em `enum`; um filtro por campo, pelo tipo: `ID` e `INTEGER` `equals` e `in`
  até 50, `TEXT` `equals` e `contains` de 2 a 60, `DECIMAL`, `MONEY`, `DATE` e `TIMESTAMP` `from` e
  `to`, `BOOLEAN` `equals`, `CODE` `equals` e `in` no enum dos códigos aprovados; `measure` com
  `count`, `sum` só de `MONEY`, `DECIMAL` e `INTEGER`, `groupBy` até 2 de `ID` ou `CODE`; `limit` de 1
  a 100, 20 por padrão). A ferramenta refaz o catálogo de quem chama, valida com o esquema
  (`INPUT_INVALID` com o caminho do Zod), monta o `ConceptCall` e roda pela porta da U3. A resposta:
  `{ kind: 'OK', concept, revision, rows: Record<string, unknown>[], more: boolean }`, cada código como
  `{ value, meaning }` (`meaning: null` sem significado aprovado), ou a recusa da porta como vem.
- O esquema de entrada que o modelo vê é fixo (`concept`, e o resto como objeto); o esquema do
  conceito vai na resposta de `concept_read` por `z.toJSONSchema`. A lista de ferramentas não muda
  quando a Ontologia muda.
- O catálogo: uma linha por conceito, nome, plural e descrição, no bloco "## Connections" do Builder
  ("Concepts: Parceiro, Cliente (papel de Parceiro), Representante, Documento, Origem do item") e nas
  instruções do Assistente, saídas de uma função só (`catalog.ts`, C26). Um papel diz de qual conceito
  é papel; uma ligação por junção aparece no descritor dos dois lados, com a junção.
- `concept_query` lê um conceito só e não atravessa ligações: a pergunta que atravessa é da etapa do
  fluxo. Um papel se consulta pela própria fonte ("quantos clientes temos?").

### As skills e a leitura

As linhas `@mastra/core` (skill `mastra`: `createTool`, ferramentas por turno) e `zod` de
`docs/reference/stack.md`. O guia de testes (T5, T24, T26).

### A ordem do trabalho

1. `descriptors.ts`, com a interseção e o campo tirado pela forma mais nova.
2. `tools.ts` e `catalog.ts`; ligar no Builder (`builder.ts`) e no Assistente (`assistant.ts`, as
   ferramentas por turno).
3. "Concepts:" no prompt e o catálogo nas instruções; `permissions.ts`.

### Como se prova

Critérios 19 a 23, pelo Builder e pelo Assistente de teste com o modelo dublê e o Sankhya dublê, com a
revisão gravada pela rota da U4 (T5).

### Parar se

- Um provedor recusa o esquema das ferramentas: relatar com a resposta; não mudar a forma.
- O dublê do Sankhya recusa uma SQL que o compilador escreve (o #819): consertar o dublê no molde de
  `fake-sales.ts:178-211`, nunca o compilador para caber no dublê.

## A antiga U6, levada ao cartão do Brain

Esta etapa não a constrói. Pela válvula do orçamento (a seção das unidades), a projeção da Ontologia
no Brain vai para o cartão seguinte do Brain (a etapa 6 do roteiro, "O Brain do Builder e dos
Projetos"), que parte dela como está escrita aqui, com os critérios, as linhas da tabela de falhas e
a de referência abaixo, e as regras de link da issue 984 que a decisão 0065 já guarda. Os números
dos critérios ficam os de quando o cartão nasceu.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 24 | U6 | Cada revisão aprovada grava as páginas `ontologia:<empresa>#conceitos/<chave>` e `…/<campo>` dos campos com códigos, com campos, códigos e ligações e nenhum valor | `apps/server/src/builder/assistant/company-memory-ontology.test.ts`, "as páginas" | must |
| 25 | U6 | Mudar só um significado deixa as outras páginas `unchanged`, e o corpo de nenhuma página leva o número da revisão | `company-memory-ontology.test.ts`, "só o que mudou" | must |
| 26 | U6 | A página `ontologia:` da A não aparece na busca nem na leitura da B, e os agentes não escrevem nela | `company-memory-ontology.test.ts`, "isolamento" | must |
| 27 | U6 | Todo link que o servidor escreve leva área e caminho; com "Devolução" só na empresa B, nenhuma gravação do servidor nem da pessoa na empresa A deixa um `[[Devolução]]` sem área chegar ao armazenamento, e nenhuma leitura de A ou de B mostra aresta entre as duas; nenhum código chama a leitura com `read: 'all'` | `company-memory-ontology.test.ts`, "a issue 984" | must |
| 28 | U6 | Uma página escrita por pessoa com `[[…]]` sem área, ou com a área de outra empresa, é recusada com `COMPANY_MEMORY_LINK_INVALID` | `apps/server/src/builder/assistant/company-memory-routes.test.ts`, "o link" | must |
| 29 | U6 | Se a gravação das páginas falha depois da aprovação, a revisão fica, a falha vai ao log, e o comando `reproject-ontology` (ou a aprovação seguinte) completa as páginas | `company-memory-ontology.test.ts`, "refazer" | must |
| 33b | antiga U6 | A página de um papel no Brain começa por "Papel de [[ontologia:<empresa>#conceitos/parceiro]]", com a área e o caminho | `company-memory-ontology.test.ts`, "o papel" | must |

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| As páginas do Brain (`upsertPage` do Mastra) | duas gravações da mesma página: a última ganha, e as duas vêm do mesmo conjunto ativo | uma página falha no meio: as outras ficam; a próxima aprovação ou o comando completam | o banco do Mastra fora: a falha vai ao log com `logFailure`; a revisão já gravada fica | `ONTOLOGY_PROJECTED` com a empresa e as contagens `created`, `updated`, `unchanged` | 24, 25, 29 |
| `reproject-ontology` (comando) | dois ao mesmo tempo gravam o mesmo conteúdo, idempotente | — | o banco fora: o comando sai com código diferente de zero e a falha | uma linha por empresa | 29 |

| Peça | Unidade | Hoje no `main` | Referência | Como faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A página projetada | U6 | `apps/server/src/builder/assistant/company-memory.ts:47-55` (as áreas), `:104-115` | `@mastra/core@1.82.0` `dist/knowledge/host-writes.d.ts:12-31` (`upsertPage`, `unchanged` "writes nothing"); `dist/knowledge/links.d.ts:4-11` (o nome solto resolve na área, "else to the one in the whole store") | `upsertPage` idempotente; `[[área#caminho]]` com índice | nativo, com as regras da issue 984 | — | "Pode" (issue 984) | `apps/server/src/builder/assistant/ontology-pages.ts`  |

O que ela pede, quando for construída: o commit que fechar esta etapa, com a U9 do Alinhamento
fechada; Sonnet, no molde de `company-memory.ts`; a porta `OntologyProjection` chamada por
`decide.ts` depois da transação.

### As linhas da tabela

- A página projetada, com as regras da issue 984.
- Ler: `apps/server/src/builder/assistant/company-memory.ts:24-55` (as ferramentas só de
  leitura, as áreas), `:104-115` (`knowledgeOf`), `:345-356` (`companyScopes`); `company-memory-routes.ts` (as gravações de pessoa); `node_modules/@mastra/core/dist/knowledge/host-writes.d.ts:12-31`;
  `dist/knowledge/links.d.ts:4-11`; `dist/knowledge/index.d.ts:78-88`; `apps/server/src/main.ts:318`
  (a tabela de comandos, `reseal`) e `apps/server/src/reseal.ts`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/assistant/` | cria `ontology-pages.ts`; muda `company-memory.ts` (a área `ontologia:$orgId`, só `viewer`; nas leituras, só as áreas da empresa), `company-memory-routes.ts` (a recusa do link) | `conversations-of.ts` |
| `apps/server/src/hub/ontology/` | muda `public.ts` (a porta `OntologyProjection`, dada tarde, e `activeOf`) | `decide.ts` |
| `apps/server/src/main.ts`, `conversations-of.ts` | muda: a projeção ligada, o comando `reproject-ontology` | — |
| `packages/hub-api/src/` | muda `assistant-failures.ts` (`COMPANY_MEMORY_LINK_INVALID`) | a web |

### Os contratos que a unidade cria

```ts
// hub/ontology/public.ts
export type OntologyProjection = { project(companyId: CompanyId): Promise<void> }
// builder/assistant/ontology-pages.ts
export function ontologyPages(active: ActiveSet, companyId: CompanyId): readonly { path: string; name: string; body: string }[]
export function projectOntology(deps: { memory: CompanyMemory; ontology: Pick<Ontology, 'activeOf'>; log: FailureLog }): OntologyProjection
```

Os caminhos: `conceitos/<chave>` (nome: o do conceito) e `conceitos/<chave>/<campo>` (nome: "<Conceito>:
<Campo>") para cada campo `CODE`. O corpo: o nome, a descrição, os sinônimos, a chave e o título, os
campos com o tipo e a descrição, o link da lista de códigos, as ligações; nunca a consulta, a prova,
o número da revisão nem um valor. Todo link é `[[ontologia:<companyId>#conceitos/…]]`. A página de
um papel começa por "Papel de [[ontologia:<companyId>#conceitos/<base>]]." e não repete as ligações
da base. Um conceito
aposentado fica com "Aposentado em <data>: use <outro>.". O autor de cada gravação é `host`. O `upsertPage` cria a página pai `conceitos` com o nome da chave
(`host-writes.d.ts:14-15`); a projeção a grava antes, com o nome "Conceitos" e um corpo que lista os
conceitos. Cada página leva `description` curta (o nome e o plural), que a busca usa.

A área, em `SCOPES`: `'ontologia:$orgId': { access: [{ principal: 'self', role: 'viewer' }] }`;
`companyScopes` acrescenta `ontologia:<companyId>`. A regra de link da pessoa (`company-memory-routes.ts`,
nas gravações de página e de nota): cada `[[…]]` do corpo (`knowledgeBodyLinkRefs`, `links.d.ts:3`)
tem de começar por `org:<companyId>#` ou `ontologia:<companyId>#`; senão `COMPANY_MEMORY_LINK_INVALID`
(`USER`, 422, "Um link precisa dizer a área da sua empresa.").

### As skills e a leitura

A linha `@mastra/core` (skill `mastra`: Knowledge, `upsertPage`, as áreas) de
`docs/reference/stack.md`. O guia de segurança (S39, S40) e os testes de ataque (T13) que a decisão
0065 manda rodar.

### A ordem do trabalho

1. A área e `ontology-pages.ts`, puro, testado sem Mastra.
2. `projectOntology`: lê o ativo, `upsertPage` de cada página, `removePage` nenhuma (o aposentado
   fica); a falha de uma página vai ao log com `logFailure` e as outras seguem; a linha
   `ONTOLOGY_PROJECTED`.
3. A ligação tardia no `decide.ts` e o comando `reproject-ontology` (todas as empresas com revisão),
   na tabela `COMMANDS` de `main.ts:316-320`; como `runReseal` (`apps/server/src/reseal.ts:8-11`), o
   comando abre o banco (`openDatabase`) e o `PostgresStore` ele mesmo, fora de `runServer`, e monta
   `CompanyMemory` e `projectOntology` com eles.
4. A recusa do link nas gravações de pessoa, e o teste de ataque da issue 984.

### Como se prova

Critérios 24 a 29, com o `PostgresStore` de teste (`test-mastra-database.ts`) e duas empresas. O 27
tenta gravar na empresa A, pela projeção e pela rota da pessoa, uma página com `[[Devolução]]`, com
"Devolução" só na B: a projeção nunca escreve link sem área (o teste lê o corpo gravado), a rota
recusa, e nenhuma leitura com as áreas da A ou da B mostra aresta. O Mastra resolve o link na
gravação (`links.d.ts:4-11`), então a defesa é nunca deixar o link chegar ao armazenamento. Nenhum
código do servidor passa `read: 'all'` (`git grep -n "read: 'all'" apps/server/src` vazio).

### Parar se

- O índice de links grava a aresta mesmo com as leituras fechadas: a recusa na gravação de pessoa é
  a defesa; relatar o que o Mastra guarda, sem ler o índice com `read: 'all'` para provar.
- O Mastra recusa a área `ontologia:` por nome: a decisão 0065 fixa o nome no primeiro cartão que a
  escreve, que é este; relatar antes de renomear.
