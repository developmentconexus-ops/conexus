# A Ontologia da empresa

O fundador, em 2026-11-12, sobre o cartão anterior, e a régua deste: "tem que ter tudo isso, tá? Tem
que ter, senão a gente perde as informações. E verificar como que a gente vai implementar isso".

É a etapa 3 da lista "O Brain e a Ontologia" do [roteiro](../roadmap.md), no trilho de frente, logo
depois do Sync de qualquer conector e antes da Capacidade 4 (`A1`). Espera no seu rascunho até o Sync
fechar e o cartão da entrada conversada (PR 982) ser aprovado (delivery L5); por isso a verificação
`second-card` fica vermelha no pull request dele, como no PR 982.

Seis estudos, fora do repositório (delivery L21), traçaram as referências: os quatro do Brain e da
Ontologia que fundaram as decisões 0064 a 0066, o estudo da Ontologia (o princípio, a modelagem, o
lugar no código e quem a usa) e o estudo do exemplo, que rodou um CRM sobre um ERP real de ponta a
ponta num protótipo descartável e decidiu trinta escolhas. Os estudos do G4 OS ensinam só estrutura:
nenhum texto dele entra aqui. O que vale para as etapas seguintes está nas decisões
[0064](../decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md) e
[0065](../decisions/0065-brain-on-mastra-knowledge-behind-our-isolation.md); o que vale para esta
etapa está aqui.

Cada linha citada foi lida no código do dia: `main` em `ac468d16` (2026-11-12, depois do PR 983), o
ramo do PR 982 em `90a64c5e` e o ramo do Alinhamento do Assistente (PR 976) em `3372c312`, marcado
**PR976:** onde a linha só existe nele. As versões: `@mastra/core` 1.82.0, `@mastra/pg` 1.35.0,
`drizzle-orm` 1.0.0-rc.4, `zod` 4.6.5. A prateleira: `twenty@b76d0217`, `budibase@624d68a`,
`airbyte@8aed3123`, `palantir/osdk-ts@9ca39db0`; as páginas públicas do Palantir Foundry foram lidas
em 2026-11-12. O builder de cada unidade parte do commit que fechar o Sync, com o Alinhamento
fechado (a U5 e a U6 tocam o que ele muda: `assistant.ts`, `instructions.ts`, `company-memory.ts`,
`connector-tools.ts`), e relê nele cada linha citada.

O exemplo do CRM (Cliente, Pedido, Vendedor) ilustra; nunca é regra. Os códigos, as contagens e os
nomes de pessoa do exemplo são inventados. Nenhum nome de tabela, coluna, código ou contagem do ERP
da empresa entra no repositório; onde um builder precisa do nome de uma tabela do dicionário do
Sankhya, ele está na skill do conector (`packages/connectors/src/sankhya/skill/SKILL.md:45-54`).

## As palavras do fundador e as decisões

Todas de 2026-11-12. As anteriores, que este cartão herda, estão nas decisões 0064 a 0066.

- `"A1 B1 C1"`, `"F1"`, "D Aprovado" (decisão 0064): a Ontologia entra depois do Sync e antes da
  Capacidade 4; nada do que um agente aprende vale antes de uma pessoa aprovar; ao ligar um sistema
  só o inventário mecânico, e a proposta nasce com a primeira demanda; o dono aprova a primeira
  revisão.
- `"J1 K1"`, ao cartão da entrada conversada. As duas letras decidem o passo "Ligue seus sistemas" e
  a permissão no banco da lista "Em aberto", que são daquele cartão; nada da Ontologia muda com elas.
  A forma da `K1` (a permissão no banco num pull request próprio, dados D11) é a que a `P1` segue
  aqui. A palavra "J1" também aparece, de uma etapa antiga, no comentário do caderno
  (`apps/server/src/hub/connectors/notes.ts:16`, "names and codes, never a value"): é outra J.
- Ao estudo da Ontologia: "L1" (uma permissão nova, "Conceitos da empresa", de dono e administrador,
  aprova as revisões depois da primeira); "P1" (o Hub lê e acrescenta; muda só o estado e a decisão;
  uma revisão e uma prova nunca mudam); e, sobre a M: "Pare de focar nos apps, primeiro vamos fazer a
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

## A página do fundador

**No fim desta etapa** você pede um CRM ao Builder e ele propõe, com a prova, os conceitos que o CRM
precisa (o que é um Cliente, um Pedido, um Vendedor na sua empresa, os campos, o que cada código quer
dizer e de onde cada um é lido); você aprova numa tela, e daí em diante o Builder e o Assistente
respondem pelos conceitos aprovados, sem reler o ERP a cada conversa.

**O roteiro de uso**, no Hub no ar, numa empresa de teste com o Sankhya de teste ligado.

1. Na página da conexão do Sankhya aparece "Inventário: 812 tabelas, 9.310 campos, 2.140 códigos,
   lido em 12/11 às 09:00" e o botão **Ler de novo**. Em Configurações › Conceitos da empresa:
   "Nenhum conceito aprovado ainda."
2. Você pede o CRM ao Builder. Ele diz que leu o inventário, pergunta só o que o dicionário não diz
   ("o que é a operação 101 na sua empresa?") e mostra o cartão "Proposta: 3 conceitos para Um CRM",
   com a fonte e as linhas da prova de cada um, e **Revisar e aprovar**.
3. Em Conceitos da empresa › Para revisar, você aprova tudo menos um código ("Bonificação não é
   pedido") e toca **Aprovar 31 e recusar 1**. A lista Conceitos mostra Cliente, Pedido e Vendedor,
   e Histórico mostra "Revisão 1, proposta pelo Builder na conversa de Dono, aprovada por Dono".
4. Um administrador e um membro entram. Os dois veem **Sugerir mudança** num código; o membro propõe
   "a 101 é o pedido do representante". O membro vê "aguarda quem cuida dos conceitos" e nenhum botão
   de aprovar; o administrador aprova, e Histórico mostra "Revisão 2, proposta por Membro, aprovada
   por Administrador".
5. Você pergunta ao Assistente "quantos pedidos o vendedor 42 tem neste mês, por tipo de operação?".
   A resposta traz cada tipo com o seu significado ("101, Pedido do representante"), e o registro da
   conversa mostra a ferramenta `concept_query`.
6. Você pergunta ao Assistente "o que é um Pedido aqui?" e ele responde pela página do Pedido no
   Brain: os campos, os códigos e as ligações, sem nenhum valor dos seus dados.
7. A página da conexão não mostra mais o caderno. As notas antigas estão em Para revisar como "Do
   caderno", à espera de serem refeitas com prova.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página (as palavras de que ela
depende, `L1`, `P1`, `M`, `Q1` e `R1`, você já deu em 2026-11-12). Ao montar U1: a lista de
permissões do banco das tabelas novas vai num pull request próprio, com a sua palavra (dados D11);
ela é a `P1` escrita linha a linha. No fim: faz o roteiro na empresa de teste e na sua, diz o que viu
e aprova os textos das telas.

**Fica de fora.**

- **Os apps pelos conceitos** (a visão `ontologia.<conceito>` no banco da empresa, `concepts` no
  manifesto, `defineConcepts`, o arquivo `shared/ontologia.ts` gerado, a checagem na publicação e o
  login de leitura do Assistente): pela sua `M`, depois da harness do Builder e das capacidades. O
  estudo do exemplo deixou as respostas prontas para esse cartão; elas estão em "O que os estudos
  deixaram", e nada aqui as constrói.
- **A saúde da Ontologia** (a prova refeita todo dia, o aviso no Início): a etapa 4 da lista. Esta
  etapa grava as provas que ela vai ler, e já tira dos agentes um campo cuja coluna uma prova nova viu
  mudar de tipo.
- **Duas fontes para um conceito**, as ligações sugeridas pelo inventário e as escritas ligadas a um
  conceito: etapas próprias.
- **A contagem de linhas por tabela no inventário.** Contar cada tabela do ERP seria uma consulta por
  tabela; nenhum estudo achou uma leitura só que dê o número. As contagens nascem com a prova de cada
  demanda. Por isso o passo 1 diz tabelas, campos e códigos, e não "com dados".
- **Três perguntas do G4 OS, não decididas** (o G4 só ensina estrutura): um fato que vence (lá a
  memória é confirmada, recusada, substituída, vencida ou apagada); uma memória pessoal separada da
  da empresa; e as pessoas e áreas da empresa como parte do conhecimento. Hoje existem, sem decisão
  sua: a memória de trabalho de cada pessoa no Assistente (**PR976:**
  `apps/server/src/builder/assistant/profile-memory.ts`) e o cargo e a área de cada membro
  (`apps/server/src/hub/identity/tables.ts:240-241`). Esta etapa não muda nenhuma das duas.
- **Os avisos guardados para um cartão** (`next-card`): esta etapa leva o #814 (quem grava no caderno:
  com a proposta, todo membro propõe e só "Conceitos da empresa" aprova, pela `Q1`) e o #815 (a
  memória do app guardando códigos que o caderno prova: o Builder passa a ler o código com o seu
  significado pelo conceito). Os outros são de cópias, apps, papéis, ferramentas e da 24.6, e esperam
  o cartão de cada um.

**As decisões suas nesta etapa.** Nenhuma nova. As escolhas técnicas convergem nas referências e
estão na tabela de referência; as três perguntas do G4 ficam registradas como não decididas, sem
resposta inventada.

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
| 19 | O caminho no Brain: `conceitos/<chave>` e `conceitos/<chave>/<campo>` | igual | U6 |
| 20 | O número da revisão fora do corpo da página | igual | U6 |
| 21 | O link sempre com área; nome solto recusado; nunca `read: 'all'` | igual (issue 984) | U6 |
| 22 | Quem é avisado quando um significado muda | fica para a saúde; a U6 grava os links que a tornam possível | U6 |
| 23 | A saúde é uma visão sobre as provas | a visão fica para a etapa da saúde; a U1 grava as provas | — |
| 24 | Coluna que mudou de tipo sai dos descritores | igual | U5 |
| 25 a 29 | A visão do app: ordem das colunas, campo aposentado, campo fora da cópia, `GRANT` por visão, tipos como texto | ficam para os apps, com estas respostas | — |
| 30 | A página do Brain se refaz depois da transação e é idempotente | igual | U6 |

O que o cartão dos apps já tem pronto, para não decidir do zero: a visão `ontologia.<conceito>` com
`security_invoker = true`, dona `conexus_sync`, só cresce no fim (`CREATE OR REPLACE VIEW` recusa
trocar nome, tirar coluna e trocar tipo com `42P16`, medido); cada campo fica no lugar da revisão em
que entrou; o aposentado fica com `@deprecated` no tipo; um campo que a cópia não tem fica fora da
visão e do tipo, com a ligação que depende dele; `GRANT SELECT` só nas visões declaradas, na
publicação; inteiros e decimais chegam como texto, um código como a união dos valores com
`(string & {})`; o que um significado novo faz num app já publicado decide-se pelo uso do CRM.

### Correções aos estudos, contra o código de hoje

- **Não há "Configurações › Conhecimento" nem "Atividade".** As Configurações são uma seção por
  arquivo de rota (**PR976:** `apps/web/src/routes/_app/companies/$companyId_/settings/route.tsx:26-45`,
  web W32); a memória da empresa é "Memória da empresa", no grupo `company` (**PR976:**
  `settings/company-memory.tsx`). A tela nova é Configurações › Conceitos da empresa, e a revisão
  aparece em Histórico, dentro dela. Nenhuma tela do Hub mostra o Brain por área: a página `ontologia:`
  é dos agentes, e o passo 6 do roteiro a vê pela resposta do Assistente.
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
- **Sem a role, a admissão diz `NOT_FOUND`, não `NOT_IN_ROLE`** (`apps/server/src/hub/identity/admission.ts:326-329`,
  segurança S10). Para a tela dizer "seu papel não aprova", a rota admite como membro e confere o papel
  depois, como a memória da empresa faz (**PR976:** `company-memory-routes.ts:26-37`).
- **A página não tem `pular`.** O dublê do Sankhya roda a página só como `OFFSET 0`
  (`packages/connectors/src/sankhya/fake-sales.ts:175-177`), e o `pageSql` do kit só escreve essa forma
  (`packages/connectors/src/sankhya/search-sql.ts:84-88`). O agente filtra ou mede, como já faz no
  `connector_read`.
- **O compilador reusa o kit.** O protótipo escrevia os literais à mão; o kit já tem o escape de texto,
  `containing`, `inList`, `between`, `flag`, `digits` (`search-sql.ts:23-70`) e a data de `dated`
  (`copy-read.ts:30-33`). O `conceptRead` os usa.
- **O motor do banco não entra no inventário.** Nenhum leitor dele neste cartão: o kit escreve a data
  do Oracle, como a leitura das cópias (`copy-read.ts:30-33`, decisão 0063). A skill já diz como achar
  o motor (`SKILL.md:59`).
- **Os nomes das ferramentas** seguem o repositório (`packages/hub-api/src/tools.ts:51-52`, em inglês):
  `concept_propose`, `concept_read`, `concept_query`, não `conceito_ler`.
- **A frase da memória do app mudou de linha**: o #815 cita `builder.md:44`; hoje é
  `apps/server/src/builder/conversation/prompt/builder.md:46`.
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
só quando o agente pede (`concept_read`). As três outras peças são as perguntas não decididas da
página do fundador.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 As tabelas | o esquema `ontology` em versões e visões, a política por linha, as permissões da `P1` num pull request próprio, os testes de isolamento | `apps/server/src/hub/ontology/`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `apps/server/src/platform/` | dados | o Sync fechado |
| U2 O inventário | a capacidade `inventory` no kit, o workflow sem modelo ao ligar e em **Ler de novo**, o resumo na página da conexão | `packages/connectors/src/kernel/`, `packages/connectors/src/sankhya/`, `apps/server/src/hub/ontology/`, `apps/server/src/hub/connectors/`, `apps/server/src/builder/ontology/`, `apps/web/src/hub/connectors/`, `packages/hub-api/src/` | dados | U1 |
| U3 A proposta com prova | a prova pela porta (contagem e forma), o `conceptRead` do kit, `concept_propose` nos dois agentes no lugar de `connector_note_save`, as notas como itens `NOTE`, a saída do caderno da tela | `packages/connectors/src/kernel/`, `packages/connectors/src/sankhya/`, `apps/server/src/hub/ontology/`, `apps/server/src/hub/connectors/`, `apps/server/src/builder/connectors/`, `apps/server/src/builder/assistant/`, `apps/server/src/builder/conversation/prompt/`, `apps/server/migrations/`, `apps/web/src/hub/connectors/`, `packages/hub-api/src/` | testes | U1 |
| U4 A aprovação e as telas | a permissão "Conceitos da empresa" (`L1`), a rota de decidir, a primeira revisão do dono, **Sugerir mudança** (`Q1`, `R1`), as telas Conceitos, Para revisar, Histórico e o cartão da proposta na conversa | `apps/server/src/hub/ontology/`, `apps/server/src/hub/identity/`, `packages/hub-api/src/`, `apps/web/src/hub/ontology/`, `apps/web/src/routes/`, `apps/web/src/builder/conversation/` | web | U3 |
| U5 As ferramentas | os descritores por turno, `concept_read` e `concept_query` no Builder e no Assistente, o catálogo no contexto | `apps/server/src/hub/ontology/`, `apps/server/src/builder/ontology/`, `apps/server/src/builder/conversation/`, `apps/server/src/builder/assistant/`, `packages/hub-api/src/` | testes | U4 e o Alinhamento fechado |
| U6 O Brain | as páginas `ontologia:<empresa>#conceitos/…` depois de cada aprovação, as regras de link da issue 984, o comando que refaz | `apps/server/src/builder/assistant/` (o módulo único do Knowledge), `apps/server/src/hub/ontology/`, `apps/server/src/main.ts`, `apps/server/src/conversations-of.ts` | segurança | U4 e a U9 do Alinhamento fechada |

Nenhuma corre em paralelo: U2 a U5 dividem `apps/server/src/hub/ontology/`. A U6 pode correr ao lado
da U5 se a U5 não tocar `company-memory.ts`, e não toca.

**Orçamento de código alterado** (sem testes nem gerados; a base são os arquivos parecidos de hoje,
medidos com `wc -l`: `hub/copies/tables.ts` 230, `propose.ts` 229, `grants.ts` 164, `notes.ts` 162,
`connector-tools.ts` 309, `copy-read.ts` 140, `search-sql.ts` 89, `copy-clock/workflow.ts` 90).
U1: 450. U2: 600. U3: 750. U4: 1.250. U5: 650. U6: 250. Total da etapa: cerca de 3.950, no teto da
delivery L2. Se a U4 passar de 1.300, ela se divide em duas (a rota e as telas) antes de seguir.

## Os critérios de aceite

Todos falham hoje: o esquema `ontology`, as rotas e as ferramentas não existem.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Como `hub_company`, com as outras camadas desligadas, `UPDATE` e `DELETE` numa revisão, numa prova, numa versão de conceito, campo, código, ligação ou fonte, e `UPDATE` do conteúdo de um item, recusam com `42501`; só `proposal.state` e as quatro colunas de decisão de `proposal_item` mudam | `apps/server/src/platform/isolation-ontology.test.ts`, "a P1 no banco" | must |
| 2 | U1 | A empresa B não lista, não lê e não grava conceito, proposta, item, revisão, prova nem inventário da A, pelo banco com a política por linha (`new row violates row-level security`) e pelas rotas (`NOT_FOUND`) | `isolation-ontology.test.ts`, "a B não vê a A" | must |
| 3 | U1 | A visão de um elemento devolve a versão mais nova de cada chave, e a Ontologia "como estava na revisão N" sai de uma consulta só às versões | `apps/server/src/hub/ontology/tables.test.ts`, "o atual e o da revisão N" | must |
| 4 | U2 | Ligar o Sankhya do dublê grava um inventário `COMPLETE` sem conta de modelo, com tabelas, campos (o próprio da empresa marcado) e códigos com o rótulo do dicionário, e nenhum valor de linha; a página da conexão mostra as três contagens e a data | `apps/server/src/hub/ontology/inventory.test.ts`, "ao ligar"; `apps/web/src/hub/connectors/inventory.test.tsx` | must |
| 5 | U2 | **Ler de novo** troca o inventário: a rodada nova `COMPLETE` fica, as antigas da conexão saem; pedido por quem não gerencia as ligações, `POST .../inventories/{connectionId}/runs` responde `NOT_FOUND`; com uma rodada aberta, `INVENTORY_RUNNING` | `inventory.test.ts`, "ler de novo" | must |
| 6 | U2 | Um conector sem dicionário (o Mercado Livre) tem inventário só das suas declarações, sem nenhuma chamada ao fornecedor | `inventory.test.ts`, "das declarações" | must |
| 7 | U2 | O dicionário que a porta recusa, ou que cai no meio, termina a rodada `FAILED` com o tipo da resposta, e o inventário anterior continua o que a página mostra; o teto de páginas termina `PARTIAL` com `CAP` | `inventory.test.ts`, "recusa e teto" | must |
| 8 | U3 | `concept_propose` com uma fonte grava uma prova com a contagem e a forma (nome e tipo de cada coluna) e nenhuma linha, conferida contra os dados inventados do dublê | `apps/server/src/hub/ontology/propose.test.ts`, "a prova sem linha" | must |
| 9 | U3 | Um campo cuja coluna não está na forma da prova volta em `refused` com `FIELD_NOT_IN_PROOF`; um código que a contagem não acha, com `CODE_UNSEEN`; uma prova que a porta recusa, com `PROOF_FAILED` e o tipo da resposta; o mesmo alvo pendente duas vezes, com `ITEM_REPEATED` | `propose.test.ts`, "as recusas por item" | must |
| 10 | U3 | Toda nota do caderno vira um item `NOTE` pendente, com a mesma consulta, o mapeamento e quem escreveu; nenhuma vale antes de uma decisão, e nenhum código lê `connection.notes` depois da U3 | `apps/server/src/hub/ontology/notebook-import.test.ts`; `git grep` no critério da revisão | must |
| 11 | U3 | A SQL que o `conceptRead` compila passa por `isOneReadStatement`, e cada injeção no texto, num código, num número ou numa data volta recusada antes de virar SQL | `packages/connectors/src/sankhya/concept-read.test.ts`, "injeções" | must |
| 12 | U3 | Um membro sem `manageConnections` propõe pelo Builder e pelo Assistente (o #814); numa rodada de automação o Assistente não tem `concept_propose` | `apps/server/src/builder/connectors/concept-propose.test.ts` | must |
| 13 | U4 | A primeira revisão de uma empresa recusa quem não é dono com `FIRST_REVISION_OWNER` (`POST .../ontology/proposals/{id}/decisions`), e nada se grava | `apps/server/src/hub/ontology/decide.test.ts`, "a primeira é do dono" | must |
| 14 | U4 | Depois da primeira, um membro ou um desenvolvedor recebe `NOT_IN_ROLE` ao decidir; dono e administrador aprovam; quem propôs aprova a própria proposta, e a revisão guarda os dois nomes | `decide.test.ts`, "L1 e R1" | must |
| 15 | U4 | Uma decisão com `expectedRevision` velha recusa com `REVISION_STALE` e não grava nada; duas decisões ao mesmo tempo sobre a mesma base: uma grava, a outra `REVISION_STALE` | `decide.test.ts`, "a revisão esperada" | must |
| 16 | U4 | Aprovar um conceito sem a sua fonte, um campo sem o seu conceito ou um código sem o seu campo, nem na proposta nem no ativo, recusa com `DECISION_INCOMPLETE` e os itens; aprovar um item `NOTE` recusa com `ITEM_NOT_APPROVABLE`; um item já decidido, `ITEM_DECIDED` | `decide.test.ts`, "o conjunto fechado" | must |
| 17 | U4 | Todo membro vê **Sugerir mudança**; a sugestão de um membro vira proposta aberta com quem propôs; a mesma chave de tentativa duas vezes dá uma proposta só | `apps/server/src/hub/ontology/suggest.test.ts`; `apps/web/src/hub/ontology/suggest.test.tsx` | must |
| 18 | U4 | Para quem não aprova, Para revisar não mostra os botões e diz "Aguarda quem cuida dos conceitos."; na primeira revisão, "Aguarda o dono." | `apps/web/src/hub/ontology/review.test.tsx` | must |
| 19 | U5 | Um conceito recusado, um aposentado e um de outra empresa não aparecem no catálogo nem em `concept_read`; chamado assim mesmo em `concept_query`, `CONCEPT_UNKNOWN` | `apps/server/src/builder/ontology/tools.test.ts`, "o catálogo" | must |
| 20 | U5 | Uma pessoa cujo papel não tem `consultar` do Sankhya, ou um Projeto sem a conexão liberada, não vê o conceito; a ferramenta responde `CONCEPT_UNKNOWN`, e a porta, se alcançada, `NOT_IN_ROLE` | `tools.test.ts`, "a permissão da fonte" | must |
| 21 | U5 | `concept_query` com contagem, soma e agrupamento por código devolve cada código com `{ value, meaning }`; um valor sem significado aprovado volta com `meaning: null`; uma entrada fora do esquema volta `INPUT_INVALID` com o caminho | `tools.test.ts`, "a consulta" | must |
| 22 | U5 | Uma prova mais nova que vê a coluna de um campo com outro tipo tira só esse campo do descritor, com o aviso, e o resto do conceito responde; depois de uma revisão que decide, o campo volta | `tools.test.ts`, "a coluna que mudou" | must |
| 23 | U5 | O prompt do Builder não tem mais "Notebook:"; tem "Concepts:" por conexão, uma linha por conceito, e o Assistente tem o mesmo catálogo | `apps/server/src/builder/conversation/prompt.test.ts`; `apps/server/src/builder/assistant/instructions.test.ts` | must |
| 24 | U6 | Cada revisão aprovada grava as páginas `ontologia:<empresa>#conceitos/<chave>` e `…/<campo>` dos campos com códigos, com campos, códigos e ligações e nenhum valor | `apps/server/src/builder/assistant/company-memory-ontology.test.ts`, "as páginas" | must |
| 25 | U6 | Mudar só um significado deixa as outras páginas `unchanged`, e o corpo de nenhuma página leva o número da revisão | `company-memory-ontology.test.ts`, "só o que mudou" | must |
| 26 | U6 | A página `ontologia:` da A não aparece na busca nem na leitura da B, e os agentes não escrevem nela | `company-memory-ontology.test.ts`, "isolamento" | must |
| 27 | U6 | Todo link que o servidor escreve leva área e caminho; com "Devolução" só na empresa B, nenhuma gravação do servidor nem da pessoa na empresa A deixa um `[[Devolução]]` sem área chegar ao armazenamento, e nenhuma leitura de A ou de B mostra aresta entre as duas; nenhum código chama a leitura com `read: 'all'` | `company-memory-ontology.test.ts`, "a issue 984" | must |
| 28 | U6 | Uma página escrita por pessoa com `[[…]]` sem área, ou com a área de outra empresa, é recusada com `COMPANY_MEMORY_LINK_INVALID` | `apps/server/src/builder/assistant/company-memory-routes.test.ts`, "o link" | must |
| 29 | U6 | Se a gravação das páginas falha depois da aprovação, a revisão fica, a falha vai ao log, e o comando `reproject-ontology` (ou a aprovação seguinte) completa as páginas | `company-memory-ontology.test.ts`, "refazer" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Página da conexão, bloco Inventário | "Lendo o inventário…" enquanto a primeira rodada corre | conector sem dicionário: "Inventário: 12 leituras declaradas" | o bloco em esqueleto (W34) | rodada `FAILED`: "Não foi possível ler o inventário." e, para quem gerencia, **Ler de novo** | a conexão que saiu: a página de não encontrado de hoje | quem não gerencia as ligações vê o resumo, sem **Ler de novo** | `PARTIAL`: "Inventário parcial: lido até o limite." e **Ler de novo** |
| Conceitos da empresa › Conceitos | "Nenhum conceito aprovado ainda. O Builder propõe conceitos quando você pede um app." | o mesmo | a lista em esqueleto | a falha da leitura com **Tentar de novo** (W17) | — | todo membro lê | — |
| Conceitos da empresa › página de um conceito | — | conceito sem códigos: a coluna Códigos vazia | esqueleto | **Tentar de novo** | "Este conceito não existe." | todo membro lê e vê **Sugerir mudança** | aposentado: "Aposentado em 12/11: use Pedido." no topo |
| Conceitos da empresa › código, **Sugerir mudança** | o formulário com "Quer dizer", "Explicação" e "Por quê" | — | o botão em espera depois do toque | a frase da falha e **Tentar de novo**, a chave guardada (W24) | o código que saiu: "Este código não existe mais." | todo membro propõe | — |
| Conceitos da empresa › Para revisar | "Nada para revisar." | o mesmo | esqueleto | **Tentar de novo** | a proposta que fechou: "Esta proposta já foi decidida." | sem a permissão: "Aguarda quem cuida dos conceitos."; na primeira revisão: "Aguarda o dono." | `REVISION_STALE`: "Os conceitos mudaram enquanto você revisava." e **Ver de novo**; `DECISION_INCOMPLETE`: os itens que faltam marcados |
| Conceitos da empresa › Histórico | "Nenhuma revisão ainda." | o mesmo | esqueleto | **Tentar de novo** | — | todo membro lê | — |
| Conversa, cartão "Proposta: N conceitos" | os conceitos, as linhas da prova e **Revisar e aprovar** | todos os itens recusados: "Nada a propor: o Builder explica na conversa." | — | — | a proposta que fechou: "Esta proposta já foi decidida." | o mesmo cartão; o botão leva a Para revisar, onde a frase de permissão aparece | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `inventory_run`, `inventory_entry` | o workflow do inventário (U2) | o resumo da conexão (U2), `concept_propose` pela descrição da ferramenta e a skill (U3) |
| `proof_run` | a prova da proposta (U3) | a decisão (U4), o descritor (U5), a etapa da saúde |
| `proposal`, `proposal_item` | `concept_propose` (U3), **Sugerir mudança** (U4), a migração das notas (U3) | Para revisar e o cartão (U4), `connector_notes` (U3) |
| `proposal_item.decision`, `reason`, `decided_by`, `decided_at`; `proposal.state` | a rota de decidir (U4) | Para revisar, Histórico (U4) |
| `revision` | a rota de decidir (U4) | Conceitos e Histórico (U4), os descritores (U5), as páginas (U6) |
| `concept_version`, `field_version`, `code_version`, `relation_version`, `source_version` | a rota de decidir (U4) | as visões atuais, lidas por U4, U5 e U6 |
| `revision.hash` | a rota de decidir (U4) | Histórico (U4); o arquivo dos apps, depois |

### Os desenhos de caixas

A 1280 px, Configurações › Conceitos da empresa:

```
┌ ← Voltar   Conceitos da empresa ───────────────────────────────────────────────┐
│ [ Conceitos ]  [ Para revisar  2 ]  [ Histórico ]                                │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Conceito    Lido de                   Campos  Códigos  Desde a revisão  Estado   │
│ Cliente     Sankhya · parceiros          4       2           1          ativo    │
│ Pedido      Sankhya · notas              9       5           1          ativo    │
│ Vendedor    Sankhya · vendedores         2       0           1          ativo    │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Revisão atual: 2, aprovada por Administrador em 12/11 · Ver o histórico          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

A página de um conceito:

```
┌ Pedido ──────────────────────────────────────────────────────────────────────────┐
│ Pedido de venda de um cliente, antes de virar nota. Um por número único.         │
│ Também: pedido de venda, venda · chave: Número único · mostra: Número do pedido  │
│ Lido de   Sankhya, cabeçalho da nota, só pedidos de venda · Ver a consulta       │
│ Prova     1.240 linhas em 12/11 10:02                                            │
│ Campo              Tipo            No sistema   Códigos                          │
│ Número único       código          (coluna)                                      │
│ Tipo de operação   lista           (coluna)     2 · Ver e sugerir                │
│ Situação           lista           (coluna)     3 (do ERP)                       │
│ Valor              dinheiro (R$)   (coluna)                                      │
│ Ligações  é de um Cliente · é de um Vendedor                                     │
│                                                          [ Sugerir mudança ]     │
└──────────────────────────────────────────────────────────────────────────────────┘
```

O código, ao tocar **Ver e sugerir**:

```
┌ Pedido › Tipo de operação ───────────────────────────────────────────────────────┐
│ Código  Quer dizer               Explicação                       Origem         │
│ 100     Pedido de balcão         Venda feita na loja.             empresa        │
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
│ "Um CRM: clientes, pedidos e vendedores" · pelo Builder, conversa de Dono       │
│ 32 itens · base: nenhuma revisão                     [ Aprovar todos ] [ Ver ]   │
│ Pedido                                                         ☑ aprovar         │
│   Lido de: Sankhya, cabeçalho da nota · Prova: 1.240 linhas · Ver a consulta    │
│   Campos  Número único (chave) · Número do pedido · Data · Cliente · Vendedor ·  │
│           Valor (R$) · Situação · Tipo de operação                               │
│   Tipo de operação  100 Pedido de balcão  ☑ · 101 Pedido externo  ☑ ·            │
│                     120 Bonificação  ☐ recusar: [ Não é pedido, é brinde ]       │
│ Ligações  o Pedido é de um Cliente · o Pedido é de um Vendedor   ☑ aprovar       │
│                                           [ Aprovar 31 e recusar 1 ]             │
│ ● "O 101 é o pedido do representante" · por Membro · base: revisão 1             │
│   antes  Pedido externo · depois  Pedido do representante    [Recusar…][Aprovar] │
│ ○ Do caderno: "vendas" · por Membro · nota antiga, a refazer com prova [Recusar…]│
└──────────────────────────────────────────────────────────────────────────────────┘
```

A 390 px, as mesmas telas em uma coluna: as abas viram um seletor; cada conceito, um cartão com nome,
fonte e as três contagens; a tabela de campos vira uma lista de linhas "Nome · tipo"; em Para
revisar, cada item é um cartão com a sua caixa de marcar, e o botão de decidir fica fixo no pé. O
produto antigo não tem estas telas: nenhuma captura a seguir.

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| A rodada do inventário (workflow do Mastra) | a segunda vê a rodada aberta da conexão e termina `INVENTORY_RUNNING` (índice único parcial) | a porta recusa uma página: a rodada termina `FAILED` com o tipo; as entradas da rodada ficam invisíveis, a anterior vale | o Sankhya fora: `FAILED` com `UNREACHABLE` ou `DEADLINE`; o banco fora: o passo do workflow falha e o Mastra registra a rodada com erro | `ONTOLOGY_INVENTORY_ENDED` com a conexão, o resultado e as páginas | 4, 5, 7 |
| **Ler de novo** (rota) | duas rodadas: a segunda, `INVENTORY_RUNNING` (409) | — | o banco fora: `DATABASE_UNAVAILABLE`, a tela diz e oferece **Tentar de novo** | `ONTOLOGY_INVENTORY_STARTED` | 5 |
| A prova (`proof_run`) | duas provas da mesma consulta gravam duas linhas; a decisão usa a da proposta | a contagem passa e a página da forma falha: a prova é `FAILED` com o tipo, o item volta `PROOF_FAILED` | o Sankhya fora: `PROOF_FAILED` com `UNREACHABLE`; a chamada fora da transação (D22) | `ONTOLOGY_PROOF_RAN` com a conexão, o resultado e as linhas | 8, 9 |
| `concept_propose` (ferramenta) | duas chamadas na mesma conversa acrescentam à mesma proposta aberta; o mesmo alvo pendente, `ITEM_REPEATED` | um item recusado não impede os outros; a resposta lista os dois | o banco fora: a ferramenta responde `DATABASE_UNAVAILABLE` e o modelo diz que não propôs | `ONTOLOGY_PROPOSED` com os números de itens | 8, 9, 12 |
| **Sugerir mudança** (rota) | a mesma `Idempotency-Key`: uma proposta (C37); outra chave e o mesmo corpo: duas propostas | — | resposta cortada ou 502/503: a tela tenta de novo com a mesma chave e recebe a mesma proposta | `ONTOLOGY_SUGGESTED` | 17 |
| A decisão (rota) | duas sobre a mesma base: a segunda `23505` vira `REVISION_STALE` (C38) | uma recusa (`DECISION_INCOMPLETE`, `FIRST_REVISION_OWNER`) desfaz a transação inteira | resposta cortada ou 502/503: a tela relê a proposta; decidida, mostra "Esta proposta já foi decidida." e não manda de novo | `ONTOLOGY_DECIDED` com a revisão e os números | 13 a 16 |
| A migração das notas | roda uma vez (o histórico de migrações) | uma nota ilegível no jsonb para a migração inteira (nada é engolido) | — | — | 10 |
| As páginas do Brain (`upsertPage` do Mastra) | duas gravações da mesma página: a última ganha, e as duas vêm do mesmo conjunto ativo | uma página falha no meio: as outras ficam; a próxima aprovação ou o comando completam | o banco do Mastra fora: a falha vai ao log com `logFailure`; a revisão já gravada fica | `ONTOLOGY_PROJECTED` com a empresa e as contagens `created`, `updated`, `unchanged` | 24, 25, 29 |
| `reproject-ontology` (comando) | dois ao mesmo tempo gravam o mesmo conteúdo, idempotente | — | o banco fora: o comando sai com código diferente de zero e a falha | uma linha por empresa | 29 |

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
| A primeira revisão do dono e a permissão L1 | U4 | `apps/server/src/hub/identity/roles.ts` (**PR976:** `:24-31`, `companyMemory: ['manage']`) | `twenty@b76d0217` `useSetNextOnboardingStatus.ts:74` (só o criador); Palantir aprova pelo "editor or owner of the underlying resource" | a regra na rota, uma checagem de papel | nativo (`createAccessControl` do Better Auth, `organization-best-practices`) | — | "D Aprovado", "L1" | —  |
| A decisão com a revisão esperada | U4 | `copies/accept.ts:22-45` (a linha travada, a chave de tentativa) | código C38, C65 | a chave única da revisão serializa | nativo | — | não precisa | `apps/server/src/hub/ontology/decide.ts`  |
| As telas | U4 | Configurações por arquivo de rota (**PR976:** `settings/route.tsx:26-45`); a memória da empresa (**PR976:** `apps/web/src/builder/assistant/company-memory.tsx`) | Palantir, a revisão de propostas da Ontologia; o desenho do estudo do exemplo, seção 8.1 | lista, página, fila de revisão, histórico | embrulhado | os desenhos do estudo do exemplo, seção 8.1 | "Q1 / R1"; os textos, no fim | `apps/web/src/hub/ontology/`, `apps/web/src/routes/_app/companies/$companyId_/settings/concepts.tsx`  |
| Ferramentas geradas dos metadados | U5 | `apps/server/src/builder/connectors/connector-tools.ts:289-309` | `twenty@b76d0217` `engine/core-modules/tool-provider/providers/database-tool.provider.ts:193-218` (descritor com `executionRef`), `tool-provider/services/tool-registry.service.ts:340-367` (refaz o catálogo de quem chama), `record-crud/json-schemas/record-properties.json-schema.ts:121-125` (enum dos códigos) | descritores como dado, filtrados pelo papel, executor genérico | embrulhado: duas ferramentas fixas sobre os descritores (o trio `get_tool_catalog`, `learn_tools`, `execute_tool` do Twenty com o catálogo no contexto); o alvo é a porta do conector | o protótipo do estudo do exemplo (fora do repositório, `@mastra/core` 1.82.0 e `drizzle-orm` 1.0.0-rc.4): o descritor do Pedido e a SQL compilada pela porta do dublê | `"A1 B1 C1"` (0064) | `apps/server/src/builder/ontology/tools.ts`, `apps/server/src/hub/ontology/descriptors.ts`  |
| O recorte do SDK | U5 (a forma), apps (depois) | `packages/app/src/connectors.ts:40-64` (`defineConnectors`, `connectorsOf`) | `palantir/osdk-ts@9ca39db0` `packages/e2e.generated.catchall/src/generatedNoCheck/ontology/objects/Employee.ts:18-213`; Palantir `ontology-sdk/overview/` ("based on just the subset") | só o recorte que o leitor alcança | nativo (a forma); a biblioteca de consulta fica de fora | — | `M` (os apps, depois) | —  |
| A página projetada | U6 | **PR976:** `apps/server/src/builder/assistant/company-memory.ts:47-55` (as áreas), `:104-115` | `@mastra/core@1.82.0` `dist/knowledge/host-writes.d.ts:12-31` (`upsertPage`, `unchanged` "writes nothing"); `dist/knowledge/links.d.ts:4-11` (o nome solto resolve na área, "else to the one in the whole store") | `upsertPage` idempotente; `[[área#caminho]]` com índice | nativo, com as regras da issue 984 | — | "Pode" (issue 984) | `apps/server/src/builder/assistant/ontology-pages.ts`  |

A memória em dois lugares e o contexto da empresa do G4 OS (só estrutura) ficam fora da tabela: são
as três perguntas não decididas da página do fundador, sem unidade.

**A medida do transplante.** Nada vem do `conexus-os`: a Ontologia não existe no produto antigo.

**A dívida.**

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
| `apps/server/src/hub/ontology/` | cria `tables.ts`, `public-tables.ts`, `public.ts` | U2 a U6 |
| `apps/server/migrations/` | cria a migração das tabelas e, no pull request próprio, a das permissões | o Hub ao subir |
| `apps/server/database-grants.sql` | muda: o dono do esquema e das tabelas, as permissões da `P1` | `apps/server/src/platform/catalog.test.ts` |
| `apps/server/src/platform/` | cria `isolation-ontology.test.ts` | — |
| `apps/server/drizzle.config.ts` | muda: o esquema `ontology` na lista, se a lista existe | `drizzle-kit` |

### Os contratos que a unidade cria

O esquema `ontology` no banco do Hub. Toda tabela tem `company_id text NOT NULL` com chave
estrangeira para `auth.company` (`onDelete: 'cascade'`, como `copies.copy`) e
`policy(SCOPE_ROLES.COMPANY, 'all', sql\`company_id = ${scoped.companyId}\`)`. Uma chave é
`text CHECK (key ~ '^[a-z][a-z0-9_]{0,39}$')`. Os limites copiam os de hoje: descrição de conceito 500
e de campo 200 (`copy.ts:122,129`), consulta 4.000 (`notes.ts:19`), chave de 1 a 4 (`copy.ts:65`).

| Tabela | Colunas, com restrição | Chave |
| --- | --- | --- |
| `inventory_run` | `id uuid`; `connection_id uuid`; `connector_version text`; `started_at`, `ended_at timestamptz`; `outcome text` (`NULL` aberta, `COMPLETE`, `PARTIAL`, `FAILED`); `reason text` (`CAP`, ou o tipo da resposta: `REFUSED`, `AUTH_REFUSED`, `UNREADABLE`, `BUSY`, `UNREACHABLE`, `DEADLINE`, `NOT_IN_ROLE`); `pages integer`; `CHECK ((ended_at IS NULL) = (outcome IS NULL))` | `id`; único `(company_id, id)`; único parcial `(connection_id) WHERE ended_at IS NULL` |
| `inventory_entry` | `run_id uuid`; `kind text` (`TABLE`, `FIELD`, `CODE`, `OPERATION`); `name text` (até 200: `TABELA`, `TABELA.CAMPO`, `TABELA.CAMPO=valor`, ou o id da operação); `type text` (até 20, o tipo do dicionário); `label text` (até 200); `custom boolean` | `(run_id, kind, name)`; estrangeira `(company_id, run_id)` com `cascade` |
| `proof_run` | `id uuid`; `connection_id uuid`; `query text` (até 4.000); `ran_at`; `outcome` (`OK`, `FAILED`); `reason` (os tipos da resposta, ou `NO_ROWS`); `rows bigint`; `shape jsonb` (`[{ "column", "type" }]`, `type` pode ser `null`); `connector_version text`; `ran_by text` (o id da pessoa); `CHECK ((outcome = 'OK') = (reason IS NULL))` | `id`; único `(company_id, id)` |
| `proposal` | `id uuid`; `demand text` (1 a 500); `proposed_by text`; `agent text` (`builder`, `assistant` ou `NULL` pela tela ou pela migração); `conversation_id text`; `base_revision integer`; `created_at`; `state` (`OPEN`, `CLOSED`); `attempt_key text`, `body_hash text` (a tela, C37) | `id`; único `(company_id, id)`; único `(company_id, attempt_key)`; único parcial `(company_id, conversation_id) WHERE state = 'OPEN' AND conversation_id IS NOT NULL` |
| `proposal_item` | `proposal_id uuid`; `n integer`; `kind` (`ADD_CONCEPT`, `ADD_FIELD`, `SET_CODE`, `ADD_RELATION`, `SET_SOURCE`, `RENAME_LABEL`, `DEPRECATE`, `NOTE`); `target text` (o endereço: `pedido`, `pedido.tipo_operacao`, `pedido.tipo_operacao=101`, `pedido_vendedor`); `content jsonb`; `proof_run_id uuid`; `decision` (`PENDING`, `APPROVED`, `REFUSED`); `reason text` (até 500); `decided_by text`; `decided_at`; `CHECK ((decision = 'PENDING') = (decided_at IS NULL))` | `(proposal_id, n)`; estrangeiras para `proposal` e `proof_run` |
| `revision` | `number integer CHECK (number >= 1)`; `proposal_id uuid`; `proposed_by text`; `approved_by text`; `approved_at`; `hash text` (sha-256 hexadecimal) | `(company_id, number)` |
| `concept_version` | `key`; `revision`; `name` (até 80); `plural` (até 80); `description` (até 500); `synonyms text[]`; `title_field`; `key_fields text[]` (`cardinality BETWEEN 1 AND 4`); `state` (`EXPERIMENTAL`, `ACTIVE`, `DEPRECATED`); `replaced_by` | `(company_id, key, revision)`; estrangeira `(company_id, revision)` para `revision` |
| `field_version` | `concept`; `key`; `revision`; `name` (até 80); `description` (até 200); `type` (`ID`, `TEXT`, `INTEGER`, `DECIMAL`, `MONEY`, `DATE`, `TIMESTAMP`, `BOOLEAN`, `CODE`); `currency` (`^[A-Z]{3}$`); `unit` (até 12); `column_name` (até 128); `state`; `CHECK ((type = 'MONEY') = (currency IS NOT NULL))` | `(company_id, concept, key, revision)` |
| `code_version` | `concept`; `field`; `value` (até 40); `revision`; `label` (até 80); `description` (até 200); `origin` (`DICTIONARY`, `PERSON`); `state` (`ACTIVE`, `DEPRECATED`) | `(company_id, concept, field, value, revision)` |
| `relation_version` | `key`; `revision`; `from_concept`; `to_concept`; `cardinality` (`MANY_TO_ONE`, `ONE_TO_ONE`, `MANY_TO_MANY`); `pairs jsonb` (1 a 4 pares `[campo_de, campo_para]`); `from_name`, `to_name`; `through`; `state`; `CHECK ((cardinality = 'MANY_TO_MANY') = (through IS NOT NULL))` | `(company_id, key, revision)` |
| `source_version` | `concept`; `revision`; `connection_id uuid`; `read jsonb` (`{ "kind": "DOOR", "sql": … }`); `proof_run_id uuid` | `(company_id, concept, revision)` |

As visões atuais, com `security_invoker = true`: `concept`, `field`, `code`, `relation`, `source`,
cada uma `SELECT DISTINCT ON (company_id, <chave>) * FROM <tabela>_version ORDER BY company_id,
<chave>, revision DESC`, em Drizzle com `pgSchema('ontology').view(name).with({ securityInvoker: true }).as((qb) => qb.selectDistinctOn([...]).from(...).orderBy(...))`.

As permissões (`P1`), no pull request próprio, como linhas do catálogo:

```sql
GRANT USAGE ON SCHEMA ontology TO hub_company;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA ontology TO hub_company;  -- as onze tabelas, uma linha cada no catálogo
GRANT SELECT ON ontology.concept, ontology.field, ontology.code, ontology.relation, ontology.source TO hub_company;
GRANT UPDATE (state) ON ontology.proposal TO hub_company;
GRANT UPDATE (decision, reason, decided_by, decided_at) ON ontology.proposal_item TO hub_company;
-- The inventory is replaced by run (P1): the older runs of a connection go when a new one completes.
GRANT DELETE ON ontology.inventory_run, ontology.inventory_entry TO hub_company;
```

Nenhuma outra permissão de `UPDATE` ou `DELETE`; a saída da empresa apaga por `cascade` a partir de
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
| `apps/server/src/builder/ontology/` | cria `inventory-workflow.ts`, `public.ts` | `conversations-of.ts` |
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
export type InventoryClock = { start(input: { companyId: CompanyId; connectionId: ConnectionId }): Promise<void> }
export type Ontology = {
  inventory: {
    run(input: { companyId: CompanyId; connectionId: ConnectionId }, signal: AbortSignal): Promise<InventoryEnd>
  }
  routes(app: FastifyInstance): void
}
export type InventoryEnd =
  | Readonly<{ kind: 'COMPLETE' | 'PARTIAL'; entries: number }>
  | Readonly<{ kind: 'FAILED'; reason: string }>
  | Readonly<{ kind: 'RUNNING' | 'GONE' }>
```

A rodada: abre `inventory_run` (o índice parcial recusa a segunda: `RUNNING`), lê as páginas por
`hub/connectors` (falando como versão que declara só a leitura do inventário, com `viewer` a pessoa
que ligou, `connection.linked_by`, como `readAsCopy`), grava as entradas de cada página, para no
teto de `run.ts:16-17` (`PARTIAL`, `CAP`), e na transação final marca o resultado e, se `COMPLETE`,
apaga as rodadas anteriores da conexão. Um conector sem `inventory` grava `declaredInventory` numa
rodada só.

O workflow `conexus-source-inventory` (nome guardado, como `COPY_WORKFLOW`): um passo que lê
`{ version: 1, companyId, connectionId }` com Zod e chama `ontology.inventory.run`;
`autoRestartActiveRuns: false`. O relógio faz `createRun()` e `startAsync({ inputData })`.

As rotas, em `packages/hub-api/src/ontology.ts`, `BASE = '/api/companies/{companyId}/ontology'`:

| Método e caminho | Acesso | Saída | Falhas |
| --- | --- | --- | --- |
| `GET ${BASE}/inventories/{connectionId}` | todo membro (`readConnections`) | `{ inventory: { readAt, outcome, reason, tables, fields, codes, operations } \| null, running: boolean, mayRead: boolean }` | `NOT_FOUND`, `SESSION_REQUIRED`, `DATABASE_UNAVAILABLE` |
| `POST ${BASE}/inventories/{connectionId}/runs` | `manageConnections` | `202 { started: true }` | as de cima, `INVENTORY_RUNNING` (409) |

Os códigos de falha (C48), em `packages/hub-api/src/ontology-failures.ts`, espalhados em `FAILURES`
(`failures.ts:279-287`): `INVENTORY_RUNNING` (`USER`, 409, "O inventário desta conexão já está
sendo lido.", "Espere terminar.").

### As skills e a leitura

As linhas `@mastra/core` (skill `mastra`, `node_modules/@mastra/core/dist/docs/`), `zod`, `fastify`
(`fastify-best-practices`), `react` e `@tanstack/react-query` de `docs/reference/stack.md`. O guia de
dados (D22: a chamada ao Sankhya fora da transação; D25: nenhuma trava de sessão).

### A ordem do trabalho

1. Apagar nada. Criar `kernel/inventory.ts` e a checagem em `definition.ts`. Regras: C23, C27.
2. `sankhya/inventory.ts`: as três fases pelas tabelas que `SKILL.md:49-51` nomeia, cada uma com
   `pageSql` e a chave da tabela; o campo próprio pela marca de `SKILL.md:50`. O dublê ganha as
   tabelas do dicionário com linhas inventadas, coerentes com as tabelas de `fake-sales.ts:118-132`.
3. `hub/connectors/inventory-port.ts`: a leitura como versão, cópia de `readAsCopy` sem o caminho
   do lote da cópia (o Sankhya conta por conta).
4. `hub/ontology/inventory.ts`: a rodada, com o teto e a troca. Depois de ligar (`routes.ts:49`, só
   quando `made.created`) e em **Ler de novo**, `deps.inventory().start(...)`; a falha do `start` vai
   ao log com `logFailure` e a ligação responde como hoje.
5. O workflow e o relógio em `builder/ontology/`, ligados em `conversations-of.ts` como o
   `copyClockOf`.
6. A rota e o bloco Inventário na página da conexão.

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
  `apps/server/src/builder/connectors/connector-tools.ts:235-309`; `apps/server/src/builder/assistant/assistant.ts:253-275`
  (`mayNote`, que sai); `apps/server/src/builder/assistant/prompt/assistant.md:45-47`;
  `apps/server/src/builder/conversation/prompt/prompt.ts:159-178` (a linha "Notebook:");
  `apps/server/src/builder/conversation/prompt/builder.md:46` (o `source` da memória do app, #815);
  `packages/connectors/src/sankhya/door.ts:102-142`; `refusals.ts:54-57`; `fake-data.ts:107-125`;
  `fake-sales.ts:175-208`; `read-only-sql.ts:1-10` e `isOneReadStatement`; `search-sql.ts:1-88`;
  `copy-read.ts:25-60`; `apps/server/src/hub/connectors/read.ts:16-32`, `:139-181`;
  `apps/server/src/hub/copies/propose.ts:214` e `builder/connectors/copy-propose.ts` (a forma da
  ferramenta que propõe e da resposta); `apps/web/src/hub/connectors/notes.tsx` (o que sai).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | cria `concepts.ts` (o contrato `ConceptRead`); muda `definition.ts` | o Sankhya; `hub/connectors` |
| `packages/connectors/src/sankhya/` | cria `concept-read.ts` e `concept-read.test.ts`; muda `door.ts` (`colunas` na saída de `consultar`), `fake-data.ts` (o `userType`), `definition.ts`, `skill/SKILL.md` (as linhas 63-65: propor com `concept_propose`) | o Sankhya |
| `apps/server/src/hub/connectors/` | apaga `notes.ts`; cria `concept-port.ts` (a prova e a consulta pela porta, `readThrough`); muda `public.ts`, `builder-port.ts`, `assistant-port.ts` | `hub/ontology`, o Builder |
| `apps/server/src/hub/ontology/` | cria `propose.ts`, `proof.ts`, `items.ts` (os esquemas), `notebook.ts` (os itens `NOTE` para `connector_notes`) | os agentes |
| `apps/server/migrations/` | cria a migração que copia as notas para itens `NOTE` | — |
| `apps/server/src/builder/connectors/` | cria `concept-propose.ts`; muda `connector-tools.ts` (sai `noteSaveTool`; `notesTool` lê os itens `NOTE`) | `conversation/builder.ts`, `assistant/connector-access.ts` |
| `apps/server/src/builder/assistant/` | muda `connector-access.ts` (sai `mayNote`), `assistant.ts`, `prompt/assistant.md` | — |
| `apps/server/src/builder/conversation/` | muda `builder.ts:94`, `permissions.ts:31-32`, `prompt/prompt.ts:170`, `prompt/builder.md:46` | — |
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
  compile(call: ConceptCall): string
}>
```

`Connector` ganha `conceptRead?: ConceptRead`. O Sankhya (`concept-read.ts`): a consulta entra como
`(<sql>) Q`; um número sai de `Number.isInteger` ou `Number.isFinite` e nunca é texto; um código passa
pelo enum do esquema antes (U5) e aqui só por `digits` ou pelo escape de `search-sql.ts:23-27`; uma
data, por `z.iso.date()` e `dated`; um texto, por `SearchText` e `containing` (`search-sql.ts:35-48`);
um `in`, por `inList` (até 50); a página, por `pageSql` com a ordem da chave; a medida, `COUNT(*) AS
"count"`, `SUM(Q.X) AS "sum_<campo>"`, `GROUP BY` só de colunas `ID` ou `CODE`. Toda saída passa por
`isOneReadStatement` antes de sair (a porta confere de novo, `door.ts:103`). `count(sql)` é `SELECT
COUNT(*) AS N FROM (<sql>) Q`; `shape(sql)` é a página de uma linha.

`consultar` (`door.ts:124-142`) responde também `colunas: { nome: string; tipo: string | null }[]`,
de `fieldsMetadata` (`name`, `userType`).

No Hub, os itens, em `packages/hub-api/src/ontology.ts` (uma união pelo campo `kind`, C21):

```ts
export const ConceptKey = z.string().regex(/^[a-z][a-z0-9_]{0,39}$/).brand<'ConceptKey'>()
export const FieldKey = ConceptKey.brand<'FieldKey'>() // same pattern, its own brand
export const RelationKey = ConceptKey.brand<'RelationKey'>()
export const OntologyProposalId = z.uuid().brand<'OntologyProposalId'>()
export const ProofRunId = z.uuid().brand<'ProofRunId'>()
export const ProposedItem = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('ADD_CONCEPT'), concept: z.object({ key: ConceptKey, name, plural, description, synonyms, titleField: FieldKey, keyFields: z.array(FieldKey).min(1).max(4) }) }),
  z.object({ kind: z.literal('ADD_FIELD'), concept: ConceptKey, field: z.object({ key: FieldKey, name, description, type: FieldType, currency: z.string().regex(/^[A-Z]{3}$/).optional(), unit: z.string().max(12).optional(), column: z.string().max(128) }) }),
  z.object({ kind: z.literal('SET_CODE'), concept: ConceptKey, field: FieldKey, value: z.string().min(1).max(40), label: z.string().max(80), description: z.string().max(200).optional(), origin: z.enum(['DICTIONARY', 'PERSON']) }),
  z.object({ kind: z.literal('ADD_RELATION'), relation: z.object({ key: RelationKey, from: ConceptKey, to: ConceptKey, cardinality, pairs: z.array(z.tuple([FieldKey, FieldKey])).min(1).max(4), fromName, toName, through: ConceptKey.optional() }) }),
  z.object({ kind: z.literal('SET_SOURCE'), concept: ConceptKey, sql: z.string().min(1).max(4000) }),
  z.object({ kind: z.literal('RENAME_LABEL'), target: Target, name: z.string().max(80), description: z.string().max(500).optional() }),
  z.object({ kind: z.literal('DEPRECATE'), target: Target, reason: z.string().max(500), replacedBy: z.string().optional() }),
])
// NOTE is written only by the migration; no tool or route accepts it.
```

A ferramenta `concept_propose` (`BUILDER_TOOL.conceptPropose = 'concept_propose'`): entrada
`{ connection, connector, demand, items: ProposedItem[] (1 a 40) }`; resposta
`{ kind: 'PROPOSED', proposalId, baseRevision, items: { n, target, proof?: { rows, columns } }[], refused: { target, reason }[] }`
ou a recusa da porta como ela vem (`NOT_GRANTED`, `NOT_IN_ROLE`, `DATABASE_UNAVAILABLE`). As regras
de prova, em `hub/ontology/propose.ts`:

| Item | A prova | A recusa |
| --- | --- | --- |
| `SET_SOURCE` | `count` e `shape` pela porta, gravados num `proof_run` | `PROOF_FAILED` com o tipo da resposta |
| `ADD_CONCEPT` | uma fonte na proposta ou ativa; os campos da chave e do título nos itens ou no ativo | `CONCEPT_INCOMPLETE` |
| `ADD_FIELD` | a coluna na forma da prova da fonte do conceito (a da proposta, ou a mais nova `OK` da ativa) | `FIELD_NOT_IN_PROOF` |
| `SET_CODE` | um valor novo: a contagem `compile({ filters: [{ column, op: 'equals', value }], measure: { count: true } })` maior que zero; um valor ativo que só muda o rótulo: nenhuma chamada | `CODE_UNSEEN` |
| `ADD_RELATION` | os dois conceitos e os campos dos pares, na proposta ou no ativo | `RELATION_INVALID` |
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

1. Apagar primeiro: `noteSaveTool` (`connector-tools.ts:255-282`), `provedAndSaved` e `save`
   (`notes.ts:78-151`), `erase` (`:153-162`) e a rota dele, `mayNote` (`assistant.ts:260-263`), a
   seção "# Notes on a connection" (`assistant.md:45-47`), `BUILDER_TOOL.connectorNoteSave` e o
   `Notebook` da página da conexão. Regras: C75, delivery L7.
2. A saída de `consultar` com `colunas`, e o dublê com `userType` (de `INTEGER` `I`, `TEXT` `S`,
   `REAL` `F`, `DATE` `D`), com um teste que lê a resposta gravada de `refusals.ts:54-57`.
3. `concept-read.ts` e os testes de injeção, no molde de `read-only-sql.test.ts`: aspas, `;`,
   comentário, palavra de comando, `q'`, `%`, `_`, `\` e `[` num texto (o #929), um número com letra,
   uma data fora do formato, um código fora do enum, uma coluna que não é do conceito, `in` com 51
   valores. Cada caso volta recusado antes de virar SQL, e a SQL boa passa por `isOneReadStatement`.
4. `hub/connectors/concept-port.ts`: `prove(opened, sql)` e `query(opened, call)`, os dois por
   `readThrough` com o `speaker` de quem fala (a pessoa, ou o papel do turno), nunca como versão.
5. `hub/ontology/propose.ts` e `proof.ts`: a prova fora da transação (D22), a proposta e os itens
   numa transação. Regras: C21, C27, C48, C49.
6. `concept-propose.ts` nos dois agentes; a linha "Notebook:" vira "Old notes to prove again: …"
   (U5 acrescenta "Concepts:"); `builder.md:46` manda o `source` da memória do app só para o que é do
   app, e o código com significado para `concept_propose` (o #815).
7. A migração das notas e `notesTool` lendo os itens `NOTE`.
8. A skill do Sankhya, `SKILL.md:63-65`: "Record what you proved" vira "propose it with
   `concept_propose`".

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
- Ler: **PR976:** `apps/server/src/hub/identity/roles.ts:24-31`, `:71-85`, `:86-110`;
  **PR976:** `apps/server/src/hub/identity/admission.ts:27`, `:109`; `admission.ts:150` (`allows`),
  `:326-355` (`admit`, o `NOT_FOUND` sem a role); **PR976:**
  `apps/server/src/builder/assistant/company-memory-routes.ts:26-37` (o membro admitido, a role
  conferida depois, `NOT_IN_ROLE` com o nome da operação); `apps/server/src/hub/copies/accept.ts:19-45`
  (a linha travada, a tentativa); `apps/server/src/platform/database.ts:171` (`violatedConstraint`);
  `packages/hub-api/src/failures.ts:270-277` (`NOT_IN_ROLE`), `:279-287`; **PR976:**
  `packages/hub-api/src/company-memory.ts:74-108` (a forma de `defineOperation`); **PR976:**
  `settings/route.tsx:26-45` e `settings/company-memory.tsx` (uma seção, um arquivo); o cartão do
  `copy_propose` na conversa (`apps/web/src/builder/conversation/`, a peça que desenha o resultado
  dele).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/` | muda `roles.ts` (`ontology: ['approve']` em `MANAGE_COMPANY` e no `createAccessControl`), `admission.ts` (`proposeConcepts`, `approveConcepts`) | `hub/ontology` |
| `apps/server/src/hub/ontology/` | cria `decide.ts`, `suggest.ts`, `active.ts` (o conjunto ativo e o hash), `reads.ts`; muda `routes.ts`, `public.ts` | a web; U5, U6 |
| `packages/hub-api/src/` | muda `ontology.ts`, `ontology-failures.ts` | a web |
| `apps/web/src/hub/ontology/` | cria a lista, a página, o código, Para revisar, Histórico, `queries.ts`, `text.ts`, `public.ts` | a rota |
| `apps/web/src/routes/_app/companies/$companyId_/settings/` | cria `concepts.tsx` | o gerador de rotas (`routeTree.gen.ts`) |
| `apps/web/src/builder/conversation/` | cria o cartão do resultado de `concept_propose` | — |

### Os contratos que a unidade cria

As ações (`admission.ts`): `proposeConcepts: { by: 'MEMBER', statement: undefined, locks: true }`
(todo membro, `Q1`; trava a linha do membro até gravar, S8) e `approveConcepts: { by: 'MEMBER',
statement: { ontology: ['approve'] }, locks: true }`. O papel da empresa criado pela empresa não
recebe `ontology` (ele guarda só conectores, `roles.ts`, `memberBase`).

As rotas, `BASE = '/api/companies/{companyId}/ontology'`:

| Método e caminho | Acesso | Entrada | Saída | Falhas |
| --- | --- | --- | --- | --- |
| `GET ${BASE}` | todo membro | — | `{ revision: { number, hash, proposedBy, approvedBy, approvedAt } \| null, concepts: ConceptRow[], toReview: number, mayApprove: boolean, awaits: 'OWNER' \| 'APPROVER' \| null }` | `NOT_FOUND`, `SESSION_REQUIRED`, `DATABASE_UNAVAILABLE` |
| `GET ${BASE}/concepts/{concept}` | todo membro | — | o conceito com campos, códigos, ligações, a fonte (a conexão pelo nome, a consulta, a prova: linhas e quando) | as de cima |
| `GET ${BASE}/proposals` | todo membro | `?state=OPEN` | as propostas com os itens, o antes e o depois de cada um | as de cima |
| `GET ${BASE}/revisions` | todo membro | — | as revisões, mais nova primeiro, com quem propôs e quem aprovou | as de cima |
| `POST ${BASE}/proposals` | todo membro (`proposeConcepts`) | `Idempotency-Key`; `{ why: 1 a 500, items: (SET_CODE \| RENAME_LABEL \| DEPRECATE)[] (1 a 10) }` | `201 { proposalId }` | as de cima, `REQUEST_MALFORMED`, `IDEMPOTENCY_CONFLICT`, `CODE_UNSEEN`, `TARGET_UNKNOWN` |
| `POST ${BASE}/proposals/{proposalId}/decisions` | `proposeConcepts`, e o papel conferido depois | `{ approved: int[], refused: { n, reason }[], expectedRevision: int }`, ao menos um item | `200 { revision: number \| null }` | as de cima, `FIRST_REVISION_OWNER` (403), `NOT_IN_ROLE` (409), `REVISION_STALE` (412), `DECISION_INCOMPLETE` (422, com os itens), `ITEM_NOT_APPROVABLE` (409), `ITEM_DECIDED` (409) |

Os códigos novos (C48), com a frase: `FIRST_REVISION_OWNER` "Só o dono aprova a primeira revisão
dos conceitos."; `REVISION_STALE` "Os conceitos mudaram enquanto você revisava.", "Veja de novo.";
`DECISION_INCOMPLETE` "Falta aprovar o que estes itens precisam."; `ITEM_NOT_APPROVABLE` "Uma nota do
caderno não se aprova: o Builder a refaz com prova."; `ITEM_DECIDED` "Este item já foi decidido.";
`CODE_UNSEEN` "Este código não aparece no sistema."; `TARGET_UNKNOWN` "Isto não existe mais nos
conceitos.". O `NOT_IN_ROLE` leva `operation` "os conceitos da empresa".

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
const missing = incomplete(next) // a concept with no source, a field with no concept, a code with no field
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
aberta (D22), `deps.projection().project(companyId)` (U6; até a U6, uma porta que não faz nada).

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
5. As leituras e as telas: a seção `concepts.tsx` (grupo `company`, rótulo "Conceitos da empresa",
   ordem 46, depois da memória da empresa), a lista, a página, o código com **Sugerir mudança**, Para
   revisar e Histórico, cada estado da matriz.
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
Assistente (**PR976:** `apps/server/src/builder/connectors/typed-reads.ts`) e de `connector-tools.ts`.

### As linhas da tabela

- Ferramentas geradas dos metadados, o recorte do SDK (a forma).
- Ler: `connector-tools.ts:1-120` (o acesso, `runIn`, o `NOT_GRANTED`), **PR976:** `:188-216`
  (`answerWords`, `readOn`); `assistant.ts:253-275`; `apps/server/src/hub/identity/role-statements.ts:14-24`
  (a operação de cada papel); `apps/server/src/builder/conversation/prompt/prompt.ts:159-178`;
  **PR976:** `apps/server/src/builder/assistant/instructions.ts`; o Twenty nas linhas da tabela de
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
  fields: readonly Readonly<{ key: FieldKey; name: string; type: FieldType; codes?: readonly { value: string; meaning: string }[] }>[]
  relations: readonly Readonly<{ key: RelationKey; to: ConceptKey; name: string; pairs: readonly [FieldKey, FieldKey][] }>[]
  source: Readonly<{ connectionId: ConnectionId; connector: ConnectorId; operation: OperationId; provedAt: string; rows: number }>
  warning?: string // a field whose column a newer proof saw with another type is left out, by name
}>
/** The active concepts the reader reaches: active revision ∩ the role holds the source's door operation ∩ (in a Projeto) the connection is released to it. */
export function descriptorsFor(input: { companyId: CompanyId; speaker: Speaker; connections: readonly ConnectionId[] }): Promise<ConceptDescriptor[]>
```

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
  ("Concepts: Pedido, Cliente, Vendedor") e nas instruções do Assistente, saídas de uma função só
  (`catalog.ts`, C26).

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
  `fake-sales.ts:175-208`, nunca o compilador para caber no dublê.

## U6 O Brain

**Base e modelo.** O commit da U4, com a U9 do Alinhamento fechada. Sonnet, no molde de
`company-memory.ts` do PR976.

### As linhas da tabela

- A página projetada, com as regras da issue 984.
- Ler: **PR976:** `apps/server/src/builder/assistant/company-memory.ts:24-55` (as ferramentas só de
  leitura, as áreas), `:104-115` (`knowledgeOf`), `:345-356` (`companyScopes`); **PR976:**
  `company-memory-routes.ts` (as gravações de pessoa); `node_modules/@mastra/core/dist/knowledge/host-writes.d.ts:12-31`;
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
o número da revisão nem um valor. Todo link é `[[ontologia:<companyId>#conceitos/…]]`. Um conceito
aposentado fica com "Aposentado em <data>: use <outro>.". O autor de cada gravação é `host`.

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
3. A ligação tardia no `decide.ts` e o comando `reproject-ontology` (todas as empresas com revisão).
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
