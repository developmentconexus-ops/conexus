# O primeiro modelo vira tabela tratada

Trilha Dados, a etapa `T1` do tratamento do lago, a primeira da ordem que o fundador decidiu em
2026-11-25 (Q8 e Q9 do quadro do estudo): Lago 2, **`T1`**, `T2`, T3a, T3b, `T4`, as etapas de entrada, o
Negócio, o Brain, o Lago 3 e o Lago 4. A pergunta: "Depois de cada cópia, o Conexus grava a tabela
Notas tratada e a Venda com a regra que eu liguei, e eu vejo em Dados as três camadas e de onde cada
tabela veio?"

O estudo fica fora do repositório (delivery L21): `conexus-lago-tratamento-estudo`, de 2026-11-25,
com o quadro em que o fundador respondeu as nove perguntas, Q1 a Q9, todas pela letra (a), em quatro
rodadas do mesmo dia; a Q3 (a) da rodada 4 é "sem token". `EST:N` é a linha `N` do relatório
`data/conexus-lago-tratamento-estudo/report.md` do firstmate; `EST/medalhao:N` é o estudo anterior
`conexus-tratamento-medalhao`; `N:<página>:N` é a cópia da documentação da Nekt de 2026-11-14,
conferida de novo em 2026-11-25 (`EST:802-810`).

Cada linha do `main` citada foi lida em `def26dd9`, o merge do G5 da etapa 2 (pull request 1403).
O G5 mudou `apps/extraction/` e o cartão da etapa 2; as linhas que o estudo citou de antes dele foram
conferidas de novo, e as que andaram estão corrigidas aqui (a tabela "O que o G5 mudou", no fim da
tabela de referência). O `main` andou para `57b81538` (a v0.24.131 e o conserto da
issue 1413) sem tocar nenhum arquivo que o cartão cita.

As versões que a construção instala:

- `dbt-core` 1.12.7 e `dbt-athena` 1.11.2, com o `dbt-adapters` 1.24.6 e o `dbt-common` 1.39.0 que
  eles puxam, lidos nos wheels; Python 3.13, como a cópia;
- `dt-sql-parser` 4.6.1 (npm), o leitor de SQL do Trino no Hub, lido no pacote.

**Antes da construção.**

1. **As palavras do fundador nos textos do repositório** (delivery L6, no mesmo dia): a ordem nova em
   `docs/steps/trilhas/dados.md:70-83` e `:158-163` e em `docs/roadmap.md:87`; e
   `docs/conhecimento/lago-e-aws.md:64-65` e `:102` deixam de dizer que o dbt caiu com a 0080, que só
   decide como a camada atual se refaz (`docs/decisions/0080-copy-declared-per-table-raw-appends.md:14-15`).
   É um pull request só de documentos, do firstmate, antes deste cartão entrar.
2. **A U1, a prova na conta de laboratório.** O fundador já deu a palavra sobre o gasto (a decisão 1,
   (a)). A U2, a U3 e o G2 não começam antes de ela responder: o que ela medir fixa as concessões da
   U2, o perfil da U3 e as gravações que os testes da U3 e da U5b leem. A U4 não depende dela.
3. **A etapa 2 fecha antes ou ao lado.** Pela delivery L1, as unidades deste cartão que não tocam os
   arquivos dos consertos da etapa 2 podem começar depois da aprovação desta página. A U2 toca
   `apps/server/src/platform/aws-copy-queue.ts` e `apps/server/src/hub/copies/lake-copy.ts`, a U3 toca
   `apps/extraction/src/conexus_extraction/entry.py` e `contract.py`, e a U5b toca `lake-close.ts`,
   `lake-queue.ts` e `apps/server/src/platform/aws-copy.ts`: cada uma espera os consertos da etapa 2
   nesses arquivos.

## A página do fundador

**No fim desta etapa** você liga uma regra de venda escrita em SQL, e depois de cada cópia o Conexus
grava sozinho as tabelas tratadas do Sankhya e a sua Venda. Em Dados você vê as três camadas, Copiado,
Tratado e Negócio, e em cada tabela de onde ela veio e quem a lê.

**O roteiro de uso.**

1. Na Central, você abre a sua empresa. O bloco Lago de dados diz "Este lago é de uma receita
   anterior. Para tratar o dado, apague e crie o lago de novo." Você clica **Apagar o lago**, digita o
   nome da empresa, e depois **Criar o lago**. Em poucos minutos o bloco diz "Pronto".
2. Em Dados, você marca de novo as tabelas do Sankhya, porque as cópias e os relógios saem com o lago
   (critério 48 da etapa 2). A primeira carga roda. No lugar de "Bruto" há três camadas: **Copiado**,
   **Tratado** e **Negócio**. Em Tratado estão Notas e pedidos, Itens das notas, Parceiros e
   Produtos do Sankhya, cada uma com "Esperando a próxima cópia".
3. Quando a cópia termina, as quatro tabelas de Tratado mostram quantas linhas têm e a hora. Ao abrir
   Notas e pedidos, a aba **De onde vem** mostra Copiado › `sankhya_notas`, e a aba Colunas mostra
   os nomes e os tipos em português (texto, número, data, data e hora), cada coluna com a descrição
   da coluna copiada de que ela sai.
4. Em Negócio, você clica **Novo tratamento**, dá o nome `venda`, escreve em uma frase o que conta como
   venda, cola o `SELECT` da sua regra (o firstmate o escreve com você a partir das suas palavras) e
   salva. Aparece "Proposta, à espera do sim", com as tabelas que o SQL lê. Um nome de tabela errado é
   recusado na hora, com o nome que faltou.
5. Você clica **Ligar**. O cartão mostra o SQL, as tabelas que ele lê e o que acontece depois. Você
   liga, clica **Tratar agora**, e a tabela `negocio.venda` aparece com as linhas e a hora. Na aba De
   onde vem: Tratado › Notas e pedidos. Em Notas e pedidos, a aba Quem lê mostra Venda. Enquanto
   uma rodada roda, **Parar** fica ao lado de Tratar agora; se você para, o botão vira "Parando…"
   e depois o topo de Tratado diz "Parada por <você> às <HH:MM>".
6. Em Venda, você clica **Propor mudança**, muda a regra (por exemplo, tirar a nota cancelada) e salva.
   Venda continua com a versão ligada até você ligar a nova, e a aba **Versões** mostra as duas, quem
   propôs e quem ligou.

**O que você faz, e quando.** Antes: escreve com o firstmate a sua regra de venda. A página já tem o
seu sim, com as decisões do quadro (2026-11-26); a emenda de 2026-11-26 (abaixo) espera o seu sim antes
do G2. Depois da U1: confirma a lista de permissões que ela mediu (decisão 4.2). Depois que o G1 publicar:
apaga e cria o lago de novo (passo 1). No fim: faz o roteiro na nuvem, diz o que viu e aprova os
textos das telas.

**A visão.** A etapa serve a estas linhas da `VISION.md`:

- "A Ontologia, por cima do catálogo, é a única fonte de significado" (`VISION.md:57`): o Negócio
  nasce como tabela com uma regra só, para a Ontologia apontar para ela na etapa do Negócio (Q4 a);
- "Um número calculado no lago mostra a regra e as fontes de que saiu, e não toma o lugar do número do
  ERP" (`VISION.md:24`): cada tabela tratada mostra o SQL ligado e de onde veio;
- "o lago é a única fonte dele: nenhum caminho paralelo copia o mesmo dado para outro lugar"
  (`VISION.md:51`): o tratamento lê e grava só no lago da empresa;
- "o que um agente aprendeu aparece como proposta, não como fato" (`VISION.md:58`): nada vale antes
  do sim de uma pessoa (Q2 a, Q7 a).

Nada cruza a visão.

**Fica de fora.**

- **Atualizar a receita no lugar.** Pela sua decisão 2 b, nenhuma unidade constrói essa atualização.
  A próxima etapa que mudar a receita (a T3b, com a área `previa`, ou o Lago 3, com o leitor nas
  áreas novas) traz a atualização, ou pede de novo apagar e criar. Depois desta etapa, apagar o lago
  apaga também as tabelas tratadas, e as rodadas de um lago apagado deixam de contar (critério 11). Os
  tratamentos e as versões ficam no Hub e rodam de novo na primeira cópia do lago novo.
- **A qualidade que trava** (`T2`): os testes por camada, a conferência com a fonte, a quarentena, o
  aviso e a troca segura da tabela (a decisão 5).
- **O Explorer, com a consulta com teto e o salvar como tratamento** (T3a). Nesta etapa você cola o
  SQL num campo. Ele é conferido ao salvar, mas só roda na próxima rodada.
- **O agente de dados** (T3b), a prévia antes de ligar e a área `previa` do lago.
- **O histórico de um registro e o notebook** (`T4`).
- **O conceito, a métrica e a fonte `LAKE` da Ontologia** (o Negócio, Q4 e Q5), e o Brain.
- **Qualquer papel além de Dono e Administrador** ver Tratado e Negócio (Q6 a), e o Assistente ou um
  app ler essas tabelas (Lago 3 e Lago 4).
- **O molde de outro sistema.** Só o Sankhya ganha o seu, nas quatro tabelas de venda. O Mercado
  Livre e o HubSpot ficam com Copiado até a Fábrica escrever o deles.
- **Sugerir descrições**, a etapa própria depois desta que você pediu ("2 Okay também quero",
  2026-11-26): um botão que pede ao modelo de IA uma descrição para a tabela e as colunas, que a
  pessoa revisa antes de gravar, só metadado. É como a Databricks faz: "After Databricks generates a
  suggested comment, you can review it and either accept it as-is or edit it before saving"
  (docs.databricks.com/aws/en/comments/ai-comments, lida em 2026-11-26). Nesta etapa a coluna tratada
  só herda a descrição da coluna copiada.
- **Mudar a limpeza do molde pela tela**, e **apagar um tratamento**. O molde é código revisado. Uma
  regra da empresa vai no Negócio. Um tratamento que não serve mais fica com a versão ligada até a
  etapa que trouxer o apagar.
- **As issues `next-card` das pastas da etapa.** Nenhuma tem gatilho nas peças novas. Esperam:
  - a #1263 e a #1264, do diário da criação do lago: a U2 não muda o caminho da criação;
  - a #1126, a #1116, a #1124 e a #1125 (a Amostra, o placar do dado copiado, a origem e as linhas da
    conversa), pela etapa 3 e pela outra trilha;
  - a #1136, a #1135, a #1140, a #943, a #944 e a #946, das cópias, pelo fechamento da etapa 2;
  - a #1237, a #1220, a #1218, a #1217, a #1215 e a #1181, do Registro de dados, que esta etapa não
    toca;
  - a #961 (o app declara o que lê), pela etapa 4.

**A sua pergunta: vamos ter mais de um lago por empresa?** Não. Cada empresa tem um lago só, e as
camadas são áreas dentro dele. Apagar e criar acontece uma vez agora, porque a receita do lago ganhou
duas áreas e ainda não sabe se atualizar. As referências fazem igual:

- **Databricks.** "You can have only one metastore per region. All workspaces in that region share
  that metastore" (docs.databricks.com/aws/en/data-governance/unity-catalog/best-practices). As
  camadas são esquemas dentro de um catálogo: "Each layer is stored in a different schema of the ops
  catalog" (docs.databricks.com/aws/en/lakehouse/medallion). O isolamento entre clientes ou unidades
  começa no catálogo ("Data isolation typically begins at the catalog level", mesma página de best
  practices). O nosso lago da empresa é o catálogo deles, e as nossas áreas são os esquemas.
- **Nekt.** Um lakehouse por workspace, num depósito `nekt-lakehouse-{your_company_slug}`
  (`N:integrations__metabase:92`). A camada "is both a storage boundary and a permission boundary:
  tables live inside a Layer" (`N:catalog__layers:9`). Mais isolamento é outro workspace, "each with
  its own cloud, Catalog, and access" (`N:organizations:11`), nunca um segundo lago no mesmo.
- **Os dois acrescentam uma camada sem recriar nada.** Na Databricks, `CREATE SCHEMA` pede só
  `USE CATALOG` e `CREATE SCHEMA` (docs.databricks.com/aws/en/sql/language-manual/sql-ref-syntax-ddl-create-schema).
  Na Nekt, o `create_layer` cria a camada no lakehouse que existe (`N:mcp-server__tools:193-210`). É a
  atualização no lugar que fica de fora desta etapa.
- **O `S3 Tables` cabe nesse desenho.** Uma área do lago é um namespace do depósito de tabelas, e cada
  depósito aceita 10.000 namespaces e 10.000 tabelas; a conta aceita 100 depósitos por região, todos
  ajustáveis (docs.aws.amazon.com/AmazonS3/latest/userguide/s3-tables-regions-quotas.html). O exemplo
  da própria AWS de medalhão no `S3 Tables` usa um depósito só
  (aws.amazon.com/blogs/big-data/building-medallion-architecture-with-iceberg-materialized-views-in-amazon-sagemaker/).
  O guia da AWS que pede um bucket por camada é para arquivos num `S3` comum, por causa do ciclo de vida
  por bucket, e não vale para o `S3 Tables` (inferido).
- **No `main`.** Um depósito de tabelas por empresa (`infra/aws/lib/lake.ts:47-50`), com as áreas
  `raw` e `current` dentro dele (`:51-58`). A U2 acrescenta `tratado` e `negocio` no mesmo depósito.

**O que você já decidiu nesta etapa** (o quadro do cartão, rodadas de 2026-11-25 e 2026-11-26):

- **Decisão 1, o gasto da prova U1: (a).** O firstmate roda a prova na conta de laboratório, com teto
  de US$ 1, só com dado gerado.
- **Decisão 2, como o lago ganha as áreas novas: (b).** Apagar e criar o lago de novo. A primeira
  carga roda outra vez.
- **Decisão 3, o nome das áreas no SQL: (a).** `tratado` e `negocio`. Copiado continua `current`.
- **Decisão 4.1, quem pode propor e ligar um tratamento: (a).** Uma permissão nova do Better Auth,
  `treatment`, com `propose` e `approve`, só para Dono e Administrador. É o molde de
  `request: ['create', 'decide']` (`apps/server/src/hub/identity/roles.ts:72-119`), e cada rota entra
  por uma linha de `ACTIONS` (`apps/server/src/hub/identity/admission.ts:47-121`). A T3b dá `propose`
  ao agente sem lhe dar `approve`. A U5a a constrói.
- **Decisão 5, a tabela tratada quando o SQL dela falha: (a).** A `T1` aceita a janela: o dbt-athena,
  no `S3 Tables`, apaga e cria (`dbt-athena@1.11.2 table.sql:102-112`), porque ali não há
  `ALTER TABLE RENAME` (`:103-105`), e a tabela fica fora até a próxima rodada boa, com o motivo em
  Dados. Todas as referências constroem ao lado e trocam (`dbt-adapters@1.24.6 table.sql:30-59`;
  docs.databricks.com/aws/en/delta/drop-table). A troca pelo `RenameTable` do `S3 Tables`
  (docs.aws.amazon.com/AmazonS3/latest/API/API_s3Buckets_RenameTable.html) nasce na `T2`, com os testes
  entre construir e trocar. A U1 já a mede, e a U3 escreve a entrada de `docs/reference/boundaries.md`.
- **A estrutura: (a).** Um cartão por etapa, e este cobre só a `T1`.
- **O cartão: aprovado** com as decisões do quadro (2026-11-26).
- **Decisão 4.2, com que credencial da AWS o SQL roda: (a)** (2026-11-26), com a lista das permissões
  confirmada por você depois da U1 ("Sim", 2026-11-26). A pergunta, a prova e o porquê estão abaixo.
- **A descrição da coluna tratada** ("1 okay", 2026-11-26): ela herda a descrição da coluna copiada de
  que sai, e o molde não escreve descrição de coluna. A herança vai pela coluna de origem, e não pelo
  nome novo: um molde que renomeie uma coluna leva junto a descrição dela.
- **Parar a rodada de tratamento** ("4. Okay", Q4 do estudo do Parar cópia, 2026-11-26): entra nesta
  etapa, na U5b e na U6, na mesma forma do Parar cópia. Quem pode Tratar agora pode Parar, e a rodada
  parada diz "Parada por Fulano às HH:MM".

**O que mudou nesta emenda** (2026-11-26, depois da revisão do G1 e do estudo do Parar cópia):

1. A coluna tratada herda a descrição da coluna copiada (critérios 15 e 25, U4 e U5a), e a etapa
   Sugerir descrições entra em "Fica de fora".
2. O Parar da rodada de tratamento (critérios 38 e 39, U5b e U6, linha 33 da tabela de referência e
   a decisão F14). O Parar cópia, a U0 desta etapa ("1. Agora", Q1 do mesmo estudo), é entregue no seu
   pull request próprio, https://github.com/developmentconexus-ops/conexus/pull/1433, fora do G1 e do
   G2.
3. Duas decisões técnicas do firstmate que o G1 já seguiu (F12 e F13): o tipo do erro do Athena e a
   linha do seu SQL, lidos como a prova U1 os gravou; e o nome de tabela do lago declarado no kit, preso
   por teste ao do Hub.
4. Uma pergunta do G2, já respondida pelo firstmate (decisão F15, a issue
   https://github.com/developmentconexus-ops/conexus/issues/1431): a próxima mudança da receita do
   lago não faz um lago que já tem as áreas do tratamento parar de tratar.
5. O orçamento do G2 sobe 110 linhas pelo Parar.

**4.2. Com que credencial da AWS o SQL roda.** (a), a escolhida: um papel próprio do tratamento, um por lago, no
molde do escritor de hoje. Ele lê `current`, cria e refaz tabelas só em `tratado` e `negocio`, não lê
os parâmetros da cópia (onde fica a senha do sistema) e não toca `raw`. Vem com quatro consertos que
o estudo achou (abaixo). (b) O papel que copia hoje, com as permissões estendidas às duas áreas novas.

**A sua pergunta: é por isso que a Nekt tem Manager, Editor e Viewer?** Não, esses três níveis
respondem à 4.1, e não à 4.2. Eles são o que a pessoa pode fazer dentro do app. A credencial com que a
rodada roda é outra peça, e a Nekt e a Databricks têm as duas.

- *Os três níveis da Nekt são da pessoa, por camada, pasta ou tabela.* Viewer "Can see the resource
  and use it in read-only ways". Editor "Can change the resource and create dependent resources (e.g.
  new tables in the layer)". Manager pode também apagar e dar Viewer ou Editor a outros
  (`N:workspaces__permissions:21-25`). Para uma transformação: "To edit, activate, or trigger it, they
  need Editor on the tables it writes to. To delete it, they need Manager on those tables" (`:41`). Os
  níveis só valem nos planos Growth e Custom. No Starter, "every Member can access all data", e os
  Admins "bypass all resource permissions" (`:9`, `:13`).
- *A rodada da Nekt roda com um papel de máquina na conta do cliente.* "EMR Service Roles: Allow
  sources and transformations to access your data catalog and perform data operations"
  (`N:get-started__setup:82`). É um papel só para toda transformação, qualquer que seja o nível de quem
  a escreveu. Nenhuma página da cópia da documentação liga o nível da pessoa à credencial da rodada. A
  chave que "inherit[s] the permissions of the user who created them" é a da API da Nekt, não a da
  AWS (`N:workspaces__permissions:95`). E a conta de serviço deles existe para não depender de uma
  pessoa: "it does not depend on any person staying in the workspace" (`N:workspaces__service-accounts:9`).
- *A Databricks separa as mesmas duas peças com nomes próprios.* Para a pessoa, os níveis do job: CAN
  VIEW ("Can view job run results"), CAN MANAGE RUN ("Can trigger and cancel job runs"), CAN EDIT,
  CAN MANAGE e IS OWNER. Para a rodada, o Run as: "The Run as user's privileges are used when the job
  is run", e "If user C runs the job, the job still runs with user B's privileges"
  (docs.databricks.com/aws/en/jobs/privileges).
- *O aviso que decide a 4.2 está na mesma página.* "A user who edits a job's tasks changes the code
  that the job runs, and the job keeps running with the Run as user's privileges." Quem pode mudar o
  SQL alcança tudo o que a credencial da rodada alcança. O nível da pessoa escolhe quem chega à
  credencial, e a credencial é o teto do que qualquer SQL faz.

Os dois andares, lado a lado:

| O que se decide | Nekt | Databricks | Conexus nesta etapa |
| --- | --- | --- | --- |
| Quem vê a tabela tratada | Viewer | `SELECT` no esquema, CAN VIEW no job | Dono e Administrador (Q6 a) |
| Quem propõe e liga o SQL | Editor nas tabelas que ele grava | CAN EDIT, CAN MANAGE RUN | `treatment`, `propose` e `approve`, só Dono e Administrador (4.1 a) |
| Quem apaga e dá acesso | Manager; dar Manager, só Admin | CAN MANAGE, `MANAGE` | apagar um tratamento fica de fora; dar acesso é o papel da empresa, como hoje |
| Com que credencial a rodada roda | o papel EMR da conta do cliente | o Run as, de preferência um service principal | **a 4.2** |

Os níveis por tabela, como os da Nekt no Growth, chegam quando outro papel passar a ler Tratado e
Negócio, no Lago 3. Nesta etapa só Dono e Administrador entram, como os Admins da Nekt, que não
precisam de nível.

- *Como as referências fazem a credencial.* Todas rodam a rodada agendada com uma identidade de
  serviço, nunca com a da pessoa que escreveu o SQL. A Databricks: "Databricks recommends changing the
  Run as user to a service principal, so that privileges can be controlled separately from the
  owner's privileges" (docs.databricks.com/aws/en/jobs/privileges). O dbt Cloud: "We recommend that
  the data warehouse credentials be for a dedicated user or service principal"
  (docs.getdbt.com/docs/deploy/deploy-environments). O dlt passa ao dbt só a credencial do destino,
  nunca a da fonte ("destinations credentials are passed to dbt via environment variables",
  `dlt@8fa90a97 dlt/pipeline/dbt.py:71-74`). A Nekt separa os papéis dos conectores (ECS) e das
  transformações (EMR) (`N:get-started__setup:81-82`), mas o papel EMR também serve às fontes (`:82`),
  e a cópia da documentação não diz se ele lê a senha das fontes. Nisso a Nekt fica mais perto da (b).
- *O nativo da AWS.* O `RunTask` já troca o papel da tarefa pelo `overrides.taskRoleArn`
  (`apps/server/src/platform/aws-copy.ts:80`), então o papel novo usa a mesma definição de tarefa. O
  Lake Formation concede por tabela do `S3 Tables` "SELECT, INSERT, DELETE, DESCRIBE, ALTER, DROP, ALL,
  and SUPER" (docs.aws.amazon.com/lake-formation/latest/dg/s3-tables-grant-permissions.html), e quem
  cria uma tabela tem todas as permissões nela
  (docs.aws.amazon.com/lake-formation/latest/dg/implicit-permissions.html). O IAM filtra a criação e a
  gravação de tabela por área com a condição `s3tables:namespace`.
- *A prova do risco da (b).* O papel que copia lê o parâmetro com a senha da fonte
  (`infra/aws/lib/writer.ts:84-88`) e tem `DELETE` e `ALTER` em `raw` e `current`
  (`infra/aws/lib/actions.ts:34`). A regra de segurança S36 pede que cada adaptador com privilégio
  tenha a sua credencial e que a credencial durável fique longe do que o pedido controla
  (`docs/guides/security.md:135-140`). O SQL da pessoa só poder ser um `SELECT` sem Jinja é uma
  proibição de sintaxe, e a mesma regra avisa, no caso do token, que uma proibição de sintaxe não
  prova o caminho do segredo (`:139`). Pelo aviso da Databricks, quem liga o SQL alcança tudo o que o
  papel alcança. Só a credencial sem acesso ao parâmetro prova.
- *Os quatro consertos que entram com a (a)*, todos vistos no `main`:
  1. A pilha da plataforma recusaria o papel novo. O papel de serviço só cria papéis leitor e escritor
     (`infra/aws/lib/platform.ts:164`), o limite não tem `glue:CreateTable` nem `glue:DeleteTable`
     (`:117-160`), a fila do resultado só aceita o envio do escritor e nega o de todo outro papel
     (`infra/aws/lib/copy.ts:163-186`), e o Hub só passa à tarefa o papel do escritor
     (`infra/aws/lib/hub.ts:155`). A U2 muda a plataforma, e ela publica antes de você criar o lago de
     novo.
  2. A lista das áreas serve a dois donos. `AREAS` (`actions.ts:36`) dá `glue:UpdateTable` ao escritor
     (`writer.ts:76`) e ao limite (`platform.ts:134`). Se ela passasse a quatro áreas, o escritor
     ganharia as áreas novas. A U2 faz uma lista por papel.
  3. O escritor grava em qualquer área do depósito: `PutTableData` e `CreateTable` sem condição de
     área (`writer.ts:57-61`). A U2 o prende a `raw` e `current` pela `s3tables:namespace`.
  4. A especificação da rodada, com o SQL, ficaria numa pasta que a cópia grava e apaga
     (`writer.ts:94-98`, `<empresa>/*`). A U2 a põe numa raiz própria, `tratamento/<empresa>/`, que o
     Hub grava e o papel do tratamento só lê.
- *Por que a (a).* A sua pergunta mostra o desenho das duas referências: o nível da pessoa
  decide quem liga, e uma identidade de máquina, separada, decide o que o SQL ligado alcança. A 4.1 (a)
  já é o primeiro andar. A (a) da 4.2 faz o segundo andar do tamanho do tratamento, como o service
  principal da Databricks, e não do tamanho da cópia. A S36 pede uma credencial própria para o
  adaptador com privilégio. É o mesmo molde do leitor e do escritor de hoje
  (`infra/aws/lib/lake.ts:59-60`, `writer.ts:108-134`), um terceiro papel e nada de lógica nova. Um
  papel só basta para as duas áreas, porque é a tarefa que escolhe onde grava, e não o SQL. A lista
  exata das permissões sai da U1, e você a confirma antes da U2.
- *Exemplo.* Em (a), um SQL que tentasse ler `raw` ou apagar uma tabela copiada é recusado pela AWS,
  qualquer que seja o texto e qualquer que seja o papel de quem o ligou. Em (b), só a conferência do
  Hub o impede.
- *Veredito:* nativo (um papel do IAM com as concessões do Lake Formation por área, passado no
  `RunTask` pelo `taskRoleArn`). O como: `infra/aws/lib/treater.ts`, no molde de `writer.ts`.

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| — | U1 A prova do motor no lago | O dbt-athena grava, refaz e lê nas áreas novas da conta de laboratório; as permissões, a janela, a tabela pela metade, o `RenameTable` e as gravações | nenhuma pasta de produto; `apps/extraction/tests/recordings/` recebe as gravações | testing | a decisão 4 |
| G1 | U2 As áreas novas e o papel do tratamento | As áreas `tratado` e `negocio`, o papel do tratamento com os quatro consertos da decisão 4.2, uma lista de áreas por papel, e a frase da receita anterior na Central | `infra/aws/lib/`, `apps/server/src/hub/lake/lake.ts`, `apps/server/src/platform/`, `apps/server/src/hub/copies/lake-copy.ts`, `packages/hub-api/src/lakes.ts`, `apps/web/src/hub/operations/lake.tsx` | security | U1 |
| G1 | U4 O molde do Sankhya no kit | A declaração `treated` no kit, o `SELECT` que ela gera, e as quatro tabelas de venda do Sankhya | `packages/connectors/src/kernel/`, `packages/connectors/src/sankhya/` | data | — |
| G1 | U3 A tarefa que trata | O contrato da rodada de tratamento, o projeto dbt que a tarefa escreve e roda, e o resultado na fila | `apps/extraction/`, `apps/server/src/hub/treatment/treat-task.ts`, `docs/reference/stack.md` | testing | U1 |
| G2 | U5a Os tratamentos no Hub | As tabelas dos modelos, das versões e das rodadas; a permissão `treatment` (decisão 4.1); propor, ligar e listar; o SQL lido ao salvar | `apps/server/src/hub/treatment/`, `apps/server/src/hub/identity/roles.ts`, `admission.ts`, `packages/hub-api/src/treatment.ts`, `apps/server/database-grants.sql`, uma migração, `docs/reference/stack.md` | data | G1 |
| G2 | U5b A rodada de tratamento | O Hub dispara uma rodada por empresa no fim de cada cópia, junta as que chegam durante ela, fecha pelo resultado, pelo fim da tarefa e pelo varredor; Tratar agora e Parar | `apps/server/src/hub/treatment/`, `apps/server/src/hub/copies/lake-close.ts`, `lake-queue.ts`, `apps/server/src/platform/aws-copy.ts`, `aws-copy-queue.ts` | data | U5a |
| G2 | U6 As camadas em Dados | Copiado, Tratado e Negócio; a tabela tratada com De onde vem, Quem lê e Versões; Novo tratamento, Propor mudança, Ligar, Tratar agora e Parar | `apps/web/src/hub/copies/`, `apps/web/src/hub/treatment/`, `apps/web/src/routes/_app/companies/$companyId/` | web | U5a, U5b |

São dois pull requests (delivery L9: os menos que a L2 permite), um commit por unidade. O G1 junta as
três unidades que não dependem de nada do Hub novo; o G2, as três que usam as tabelas da U5a. Uma
unidade nunca atravessa os dois.

**O que não depende de outra unidade**, porque não divide arquivo nem contrato: a U2, a U4 e a U3,
depois da U1. A delivery L9 não divide um grupo para construir ao mesmo tempo, então o construtor do
G1 as faz em ordem, mas nenhuma espera a outra; se o firstmate preferir três pull requests, o G1 se
divide em U2 sozinha e U4 com U3 sem mudar nenhuma seção abaixo. No G2 a ordem é U5a, U5b e U6.

**O Parar cópia** é a U0 desta etapa (Q1 do estudo do Parar cópia, "1. Agora"), entregue antes do G1
no seu pull request próprio, https://github.com/developmentconexus-ops/conexus/pull/1433. Nenhuma
seção abaixo a constrói; a U5b usa a mesma forma.

**Orçamento de código alterado** (estimado, sem testes nem gerados). U1: 0 de produto. U2: 300. U4: 250. U3: 450. U5a: 880. U5b: 880, com 80 do Parar. U6: 980, com 30 do Parar. Total da
etapa: 3.740, dentro da delivery L2. Se a soma medida no fim do G1 passar de 1.150, ou a do G2 passar
de 2.850 (os dois tetos somam os 4.000 da L2), o firstmate tira Propor mudança e Versões da U6 para a `T2` antes do G2, e a página volta ao
fundador com o passo 6 do roteiro fora. A troca pelo `RenameTable` não entra: a decisão 5 (a) a
deixa para a `T2`.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Na conta de laboratório, um modelo `materialized='table'` grava `tratado.<t>` lendo `current.<t>` pelo papel de teste do tratamento, no workgroup do tratamento, e um segundo `build` o refaz; o registro mede a janela sem tabela e a lista mínima de permissões, e diz se o erro do Athena ecoa o SQL (security S41) | o registro da U1 e as gravações `apps/extraction/tests/recordings/treat-*.jsonl` | must |
| 2 | U1 | Um modelo com a linha `-- depends_on: {{ ref(...) }}` roda depois do modelo de que depende | o registro da U1 | must |
| 3 | U1 | O `dbt build` não cria banco no catálogo da conta nem área no `S3 Tables`; com a área ausente, o modelo falha com o código do Athena | o registro da U1 | must |
| 4 | U1 | Um `CREATE TABLE AS` que falha no meio deixa ou não uma tabela pela metade, e o apagar pelo Glue do `build` seguinte a tira; um `RenameTable` de `<t>__nova` para `<t>` é visto na hora pelo Athena, com as concessões do Lake Formation; um `RenameTable` para um nome que existe é recusado; o escritor, preso a `raw` e `current` pela `s3tables:namespace`, é recusado em `tratado` | o registro da U1 | must |
| 5 | U2 | Um lago criado pela receita nova tem as áreas `raw`, `current`, `tratado` e `negocio`, e o papel do tratamento tem só as concessões que a U1 mediu e o fundador confirmou: nada em `raw`, só leitura em `current`, nenhum `ssm:GetParameter`, `s3:GetObject` só em `tratamento/<empresa>/*` | `infra/aws/test/lake.test.ts` (o modelo da receita) | must |
| 6 | U2 | A pilha da plataforma deixa o papel de serviço criar o papel do tratamento só com o limite, e o limite dá ao tratamento `glue:CreateTable`, `glue:DeleteTable` e `glue:UpdateTable` só em `tratado` e `negocio`; o escritor segue sem eles nas áreas novas | `infra/aws/test/platform.test.ts` | must |
| 7 | U2 | Na Central, um lago pronto com uma receita anterior à desta imagem diz "Este lago é de uma receita anterior. Para tratar o dado, apague e crie o lago de novo."; um lago com a receita de hoje não diz | `apps/web/src/hub/operations/lake.test.tsx`; `apps/server/src/hub/lake/lake.test.ts` | must |
| 8 | U2 | O escritor só cria e grava tabela em `raw` e `current`: a condição `s3tables:namespace` está nas duas permissões de tabela dele, e `glue:UpdateTable` vem da lista de áreas do escritor, não da do tratamento | `infra/aws/test/lake.test.ts` | must |
| 9 | U2 | O Hub grava a especificação em `tratamento/<empresa da sessão>/*` do depósito de estado, preso pela etiqueta da empresa; o escritor não grava nem apaga nessa raiz | `infra/aws/test/platform.test.ts`; `lake.test.ts` | must |
| 10 | U2 | A fila do resultado aceita o envio do papel do tratamento e do escritor e segue negando o de outro papel; o Hub passa à tarefa só esses dois papéis | `infra/aws/test/platform.test.ts` | must |
| 11 | U5b | Uma rodada guarda o lago em que gravou; depois de apagar e criar o lago, Tratado mostra "Esperando a próxima cópia" e a seleção trata cada modelo como nunca gravado, sem ler as rodadas do lago apagado | `treatment-run.test.ts`, caso "lago novo"; `treatment-routes.test.ts` | must |
| 12 | U2 | Com uma tabela em `tratado` no depósito, a lista das tabelas do lago e o apagar do lago seguem funcionando, e tirar uma tabela da cópia apaga também a sua tabela em `tratado` | `apps/server/src/hub/lake/lake-remove.test.ts`; `apps/server/src/hub/copies/lake-copy.test.ts` | must |
| 13 | U4 | O `SELECT` gerado pelo kit para uma tabela tratada lê `"current"."<nome no lago>"`, dá a cada coluna o nome em minúsculas e o tipo declarado, e não tem filtro nem junção | `packages/connectors/src/kernel/tables-treated.test.ts` | must |
| 14 | U4 | A conformidade recusa um molde com uma coluna que a tabela não tem nas gravações, um nome repetido ou um nome fora de `[a-z][a-z0-9_]*` | `packages/connectors/src/kernel/conformance-tables.test.ts` | must |
| 15 | U4 | O Sankhya declara `treated` em `notas`, `notas_itens`, `parceiros` e `produtos`, cada uma com a descrição da tabela não vazia e cada coluna do molde (`column`) existente na tabela copiada; a coluna do molde não tem descrição própria, porque herda a da coluna copiada pela coluna de origem (`column`), nunca pelo nome novo (`as`) | `packages/connectors/src/sankhya/copy-tables.test.ts` | must |
| 16 | U3 | Com a especificação de uma rodada, a tarefa escreve um projeto dbt, roda `dbt build` pelos modelos pedidos, conta as linhas de cada tabela gravada e manda à fila um `TREAT_RESULT` com cada modelo `BUILT`, `FAILED` ou `SKIPPED` | `apps/extraction/tests/test_treat.py`, pela entrada `conexus-copy` com `CONEXUS_TREAT_OBJECT`, caso "duas camadas" | must |
| 17 | U3 | Um modelo que falha no Athena volta `FAILED` com o tipo do erro (por exemplo `COLUMN_NOT_FOUND`) e a linha, nunca o texto do erro; os que dependem dele voltam `SKIPPED`; os outros rodam | `test_treat.py`, caso "falha no meio" | must |
| 18 | U3 | Uma especificação com `{{`, `{%` ou `{#` no SQL de um modelo, ou fora do esquema, termina a rodada em `ERROR` com `TREAT_SPEC_INVALID`, sem rodar modelo nenhum; o esquema JSON gerado leva a recusa como `pattern` | `test_treat.py`, caso "recusa a especificação"; `treat-task.test.ts` | must |
| 19 | U3 | A rodada de cópia segue igual: a mesma imagem, sem a variável da especificação do tratamento, faz a cópia como antes | `apps/extraction/tests/test_entry.py`, os casos de hoje sem mudança | must |
| 20 | U5a | Propor um tratamento com nome, descrição e um `SELECT` que lê tabelas da empresa cria o modelo e a versão 1, guarda as tabelas que o SQL lê e responde 201; nada roda | `apps/server/src/hub/treatment/treatment-routes.test.ts` | must |
| 21 | U5a | A proposta é recusada, com o código e sem gravar: SQL que não abre (`TREATMENT_SQL_INVALID`, com a posição), mais de um comando ou um comando que não é consulta (`TREATMENT_SQL_NOT_A_QUERY`), `{{`, `{%` ou `{#` (`TREATMENT_SQL_TEMPLATE`), tabela sem área ou fora de `current`, `tratado` e `negocio` (`TREATMENT_INPUT_UNQUALIFIED`), tabela que a empresa não tem (`TREATMENT_INPUT_UNKNOWN`, com o nome), ciclo (`TREATMENT_INPUT_CYCLE`), nome já usado (`TREATMENT_NAME_TAKEN`), e um lago ausente ou de receita anterior (`LAKE_NOT_READY`) | `treatment-routes.test.ts`, um caso por código | must |
| 22 | U5a | Ligar uma versão com o hash que a tela leu a torna a versão ligada, com quem ligou e quando; ligar com um hash diferente, ou uma versão que não é a última proposta, responde `TREATMENT_VERSION_CHANGED`; duas propostas ao mesmo tempo no mesmo modelo dão os números 2 e 3, ou a segunda responde `TREATMENT_VERSION_CHANGED` | `treatment-routes.test.ts` | must |
| 23 | U5a | A versão ligada é a de maior número com o sim; uma versão nova não troca a ligada até ser ligada; a lista mostra a ligada e a proposta, e o modelo traz todas as versões com quem propôs e quem ligou | `treatment-routes.test.ts` | must |
| 24 | U5a | Toda rota do tratamento recusa quem não tem a permissão `treatment` (`FORBIDDEN`): as de leitura e propor pedem `propose`, ligar e Tratar agora pedem `approve`; só Dono e Administrador têm as duas, e um papel próprio da empresa não tem nenhuma; e uma empresa não lê nem liga o modelo de outra (`NOT_FOUND`); a política de linha recusa a outra empresa nas quatro tabelas | `treatment-routes.test.ts`; `apps/server/src/hub/treatment/tables.test.ts` | must |
| 25 | U5a | A lista de Tratado traz uma tabela por tabela copiada cujo conector declara molde, com o nome no lago e as colunas do molde, cada coluna com a descrição da coluna copiada de mesma `column` (nula quando a copiada não tem), também quando o molde a renomeia, nada para uma tabela sem molde, e diz se o lago tem a receita nova | `treatment-routes.test.ts` | must |
| 26 | U5b | O fim de uma rodada de cópia `COMPLETE` de uma tabela com molde, ou lida por um modelo ligado, abre uma rodada de tratamento da empresa que pede só os modelos abaixo das tabelas copiadas, mais os nunca gravados e os que falharam por último; sem nada a tratar, nenhuma rodada abre | `apps/server/src/hub/treatment/treatment-run.test.ts` | must |
| 27 | U5b | Com uma rodada de tratamento aberta, o fim de outra cópia da empresa não abre uma segunda: guarda as tabelas, e quando a aberta fecha, uma nova roda só por elas | `treatment-run.test.ts`, caso "duas ligações" | must |
| 28 | U5b | O `TREAT_RESULT` fecha a rodada e grava o estado, as linhas e o motivo de cada modelo; um fim de tarefa sem resultado e sem pedido de Parar fecha com `TREAT_TASK_STOPPED` (com o pedido, o critério 38); um resultado repetido não muda nada; o varredor fecha uma rodada aberta sem tarefa viva com `TREAT_TASK_STOPPED` | `treatment-run.test.ts`; `apps/server/src/hub/copies/lake-queue.test.ts`; `treatment-sweep.test.ts` | must |
| 29 | U5b | Nenhuma rodada, de cópia ou de Tratar agora, pede um modelo que lê, direto ou por outro modelo, uma tabela marcada cuja primeira cópia não terminou; a tabela tirada da cópia não segura modelo nenhum. Tratar agora abre uma rodada com todos os outros modelos da empresa; responde `ALREADY_RUNNING` com uma aberta, `LAKE_NOT_READY` com o lago sem a receita nova, `NOTHING_TO_TREAT` sem modelo e `TREATMENT_WAITING_COPY` quando todos esperam a primeira cópia | `treatment-routes.test.ts`; `treatment-run.test.ts` | must |
| 30 | U5b | A especificação vai num objeto em `tratamento/<empresa>/` do depósito de estado, e a tarefa a acha pela variável `CONEXUS_TREAT_OBJECT`; o `RunTask` é o da cópia, com o papel do tratamento; uma partida que falha depois das tentativas fecha com `TREAT_START_FAILED` | `apps/server/src/platform/aws-copy.test.ts`; `treatment-run.test.ts` | must |
| 31 | U6 | Em Dados, Dono e Administrador veem Copiado, Tratado e Negócio; outro papel vê em Tratado e em Negócio "Seu papel ainda não lê nenhuma tabela."; com o lago numa receita anterior, Tratado diz "Apague e crie o lago de novo na Central para tratar" | `apps/web/src/hub/copies/data-page.test.tsx` | must |
| 32 | U6 | Uma tabela tratada mostra as linhas e a hora da última rodada boa, "Esperando a próxima cópia" antes da primeira, e "A última rodada falhou" com o motivo pelo código e a linha do SQL, com a tabela fora; uma rodada que não terminou mostra o motivo dela no topo de Tratado | `apps/web/src/hub/treatment/treated-table.test.tsx` | must |
| 33 | U6 | A aba De onde vem lista cada tabela que o SQL lê, com o link para ela; a aba Quem lê lista os modelos que a leem | `treated-table.test.tsx` | must |
| 34 | U6 | Novo tratamento e Propor mudança salvam e mostram "Proposta, à espera do sim"; cada recusa do critério 21 aparece no campo, com o texto da tela, e o que foi digitado fica; a aba Versões lista as versões com quem propôs e quem ligou | `apps/web/src/hub/treatment/new-treatment.test.tsx`; `treated-table.test.tsx` | must |
| 35 | U6 | Ligar abre o cartão com o SQL, as tabelas lidas e a frase do que acontece; com a versão mudada por outra pessoa, o cartão diz que a proposta mudou e mostra a nova | `apps/web/src/hub/treatment/approve.test.tsx` | must |
| 36 | U6 | A 390 px, a lista, a tabela tratada, Novo tratamento e o cartão cabem sem rolagem lateral, nos dois temas | a QA (testing T25) | should |
| 37 | todas | O roteiro de uso, feito na nuvem pelo fundador, sem terminal | o uso | must |
| 38 | U5b | Parar, com uma rodada de tratamento aberta, grava quem pediu em `stopped_by` (quem pede primeiro fica), pede o `StopTask` e responde 202 sem esperar; sem rodada aberta responde 200 e não grava nada; sem tarefa para parar, a rodada fecha na hora. O fim pedido fecha `STOPPED`, com quem parou, e não `TREAT_TASK_STOPPED`; um `TREAT_RESULT` que chega depois do pedido vale; as tabelas em `pending` não abrem a próxima rodada, e os modelos do `select` da rodada parada entram na próxima seleção como os que falharam. A rota pede `approveTreatment`, a mesma do Tratar agora (`FORBIDDEN` sem ela) | `apps/server/src/hub/treatment/treatment-stop.test.ts` | must |
| 39 | U6 | Com uma rodada aberta, **Parar** fica ao lado de Tratar agora; o clique pede confirmação, e depois o botão vira "Parando…" com o foco do teclado até a rodada fechar; a rodada parada mostra no topo de Tratado "Parada por <nome> às <HH:MM>"; um pedido recusado mostra a frase e o botão volta | `apps/web/src/hub/treatment/treatment-stop.test.tsx` | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Central, bloco Lago de dados | os seis estados de hoje; em Pronto, com uma receita anterior, "Este lago é de uma receita anterior. Para tratar o dado, apague e crie o lago de novo." | o de hoje | o de hoje | o de hoje | o de hoje | o de hoje | o de hoje |
| Dados, Tratado | "Esperando a próxima cópia" em cada tabela | "Nenhuma tabela tratada. As tabelas de um sistema com molde aparecem aqui quando ele copia." | o esqueleto da lista de hoje | `CATALOG_FAILED`, como hoje; uma rodada que não terminou, com o motivo; uma rodada parada, "Parada por <nome> às <HH:MM>"; com o pedido feito, Parar vira "Parando…" | — | `NO_TABLE_OF_ROLE` | a receita anterior: "Apague e crie o lago de novo na Central para tratar" |
| Dados, Negócio | — | "Nenhum tratamento ainda" e Novo tratamento | o esqueleto | `CATALOG_FAILED` | — | `NO_TABLE_OF_ROLE` | — |
| Tabela tratada (as abas) | sem linhas: "Esperando a próxima cópia" | — | o esqueleto das abas | a última rodada falhou, com o motivo e a linha | a tabela do molde cuja cópia saiu: "Esta tabela não existe mais" e o caminho para Dados | `NO_TABLE_OF_ROLE` | — |
| Novo tratamento e Propor mudança | o formulário vazio, ou com a versão ligada | — | Salvar ocupado | cada código do critério 21 no campo; `LAKE_NOT_READY` e `DATABASE_UNAVAILABLE` acima do botão | o modelo de outro endereço: `NOT_FOUND` | o formulário não abre | `TREATMENT_VERSION_CHANGED` numa proposta ao mesmo tempo |
| Cartão Ligar | — | — | Ligar ocupado | a falha acima dos botões, o cartão fica | — | o botão não aparece | `TREATMENT_VERSION_CHANGED`: mostra a versão nova |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `ClientLake.READY.outdated` | U2, `hub/lake/lake.ts` (a receita da linha contra a da configuração) | a Central (U2) |
| `TableDeclaration.treated` | U4, cada conector | U5a (a lista de Tratado e o modelo do molde) |
| `TreatTaskSpec.models[].after` | U5a (as tabelas lidas, guardadas na versão), U5b (monta a especificação) | U3 (as linhas `depends_on`) |
| `TreatTaskSpec.select` | U5b (a seleção) | U3 (`dbt build --select`) |
| `TreatTaskResult.models[]` | U3 | U5b (grava `treatment.model_run`) |
| `treatment.version.inputs` | U5a, ao salvar | U5b (a seleção), U6 (De onde vem e Quem lê) |
| `treatment.version.hash` | U5a | U6 (manda ao ligar), U5a (confere) |
| `treatment.run.pending` | U5b, numa cópia durante uma rodada aberta | U5b, ao fechar |
| `treatment.run.failure` | U5b | U6 (o topo de Tratado) |
| `treatment.run.stopped_by` | U5b, o Parar (quem pede primeiro fica) | U5b (o fim `STOPPED`), U6 ("Parada por" e "Parando…") |
| `TreatedTable.columns[].description` | U5a, da coluna copiada de mesma `column` (`copies.lake_table.columns`) | U6 (a aba Colunas) |
| `treatment.model_run.failure`, `line` | U5b, do resultado | U6 (o motivo pelo código e a linha) |
| `TreatedTables.lake` | U5a (a receita do lago) | U6 (a célula Vencido de Tratado) |

**O desenho.** A 1280 px:

```
┌ Dados ───────────────────────────────────────────────────────────┐
│ [Copiado] [Tratado] [Negócio] [Apps]              [Tratar agora] │
│ Sankhya · sankhya                                                │
│  Notas e pedidos  128.402 linhas · tratada às 14:05              │
│  Itens das notas  901.233 linhas · tratada às 14:05              │
│  Parceiros        A última rodada falhou: coluna que não existe, │
│                   na linha 3                                     │
└──────────────────────────────────────────────────────────────────┘
┌ Notas e pedidos ────────────────────────────────────────────────┐
│ [Visão geral] [Colunas] [De onde vem] [Quem lê]                  │
│ De onde vem: Copiado › sankhya_notas                             │
└──────────────────────────────────────────────────────────────────┘
┌ Negócio ────────────────────────────────── [Novo tratamento] ────┐
│  venda   Ligada: v1 · ligada por <pessoa> em 25/11 · 133 mil     │
│          Proposta: v2, à espera do sim                [Ligar]    │
└──────────────────────────────────────────────────────────────────┘
┌ venda ──────────────────────────────────── [Propor mudança] ─────┐
│ [Visão geral] [SQL] [De onde vem] [Quem lê] [Versões]            │
│ v2  proposta por <pessoa> em 25/11 15:10                          │
│ v1  proposta por <pessoa>, ligada por <pessoa> em 25/11 14:30     │
└──────────────────────────────────────────────────────────────────┘
```

A 390 px as abas viram o seletor de hoje (`ui/tabs.tsx`), a linha de cada tabela quebra em duas, e o
cartão Ligar ocupa a tela (`ui/alert-dialog.tsx`). As peças de `ui/` são as de hoje: `page-header`,
`tabs`, `list`, `badge`, `button`, `field`, `input`, `textarea`, `code-block`, `alert`,
`alert-dialog`, `skeleton`, `states`. Nenhuma peça nova. O modelo de tela é a Nekt: o catálogo por
camada com as abas da tabela (`EST:231`), o detalhe da Query com Input tables e Output tables e o
código só de leitura (`EST:234`).

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `DeleteTable` da tabela tratada ao tirar uma cópia (U2, no `dropTables` de hoje) | o de hoje | a tabela tratada que sobrar é apagada pelo próximo `dropTables` ou pelo apagar do lago | o de hoje | o de hoje | 12 |
| `INSERT` de `treatment.model` e `treatment.version` (U5a) | o índice único do nome por empresa e o de `(model_id, number)`; o segundo vê `TREATMENT_NAME_TAKEN` ou `TREATMENT_VERSION_CHANGED` | uma transação só (data D22) | `DATABASE_UNAVAILABLE`, nada gravado | `TREATMENT_PROPOSED` com o id e o número | 20, 21, 22 |
| O `UPDATE` que liga uma versão (U5a) | condicional ao hash e a ser a última proposta; o segundo vê `TREATMENT_VERSION_CHANGED` | uma transação | `DATABASE_UNAVAILABLE` | `TREATMENT_APPROVED` com quem ligou | 22, 23 |
| `INSERT` de `treatment.run` (U5b) | o índice único da rodada aberta por empresa; o perdedor grava as tabelas em `pending` da aberta | a linha nasce antes do objeto e do `RunTask`; o varredor fecha uma linha sem tarefa | o banco fora no fim da cópia: a cópia fecha como hoje, e a próxima cópia ou Tratar agora abre a rodada | `TREATMENT_RUN_OPENED`, `TREATMENT_RUN_COALESCED` | 26, 27 |
| O fechamento: `UPDATE` de `treatment.run`, `INSERT` de `treatment.model_run`, e a próxima rodada pelo `pending` (U5b) | condicional a `ended_at is null`: o segundo resultado não muda nada | uma transação só (data D22); a partida da próxima vem depois dela | o banco fora: a mensagem fica na fila e volta | `TREATMENT_RUN_CLOSED` com a contagem por estado | 27, 28 |
| `PutObject` da especificação (U5b) | a chave é a rodada e a tentativa | sobrescrito na tentativa seguinte | a AWS fora: tenta como a cópia tenta (`lake-run.ts:115-121`), depois fecha com `TREAT_START_FAILED` | `TREATMENT_SPEC_WRITTEN` com a chave, nunca o SQL | 30 |
| `RunTask` (U5b) | o `clientToken` é a rodada e a tentativa, como na cópia | uma tarefa que não partiu: o `findTask` por `startedBy` decide, como na cópia | `TREAT_START_FAILED` depois das tentativas | o de hoje, com o tipo da rodada | 28, 30 |
| As instruções do dbt no Athena e no Glue: apagar a tabela e o `CREATE TABLE AS` (U3, da biblioteca) | uma rodada aberta por empresa: nunca duas tarefas na mesma tabela | o `CREATE TABLE AS` que falha depois de apagar deixa a tabela fora (`table.sql:106-107`; decisão 5); a próxima rodada boa a recria | o Athena fora: o modelo volta `FAILED` com o tipo do erro; a rodada termina `COMPLETE` com os modelos | o log do dbt vai ao log da tarefa da empresa, o mesmo da cópia; o resultado leva só o tipo do erro e a linha | 16, 17 |
| O Parar: `UPDATE` de `stopped_by` e o `StopTask` (U5b) | `coalesce`: quem pede primeiro fica, e o segundo pedido só pede o `StopTask` de novo | o `UPDATE` vem antes do `StopTask`; o `StopTask` que falha deixa a rodada aberta com o pedido, e o fim da tarefa ou o varredor a fecha `STOPPED`, porque houve pedido | a AWS fora: a resposta diz a frase, e o botão volta a pedir | `TREATMENT_STOP_ASKED` com quem pediu | 38, 39 |
| `SendMessage` do resultado (U3) | o Hub ignora um resultado repetido pela rodada e a tentativa | a tarefa caída antes de mandar: o fim da tarefa, ou o varredor, fecha com `TREAT_TASK_STOPPED` | a fila fora: o fim da tarefa fecha a rodada | `TREAT_RESULT_SENT` | 28 |

## A tabela de referência

Veredito pelo código C75: **nativo**, **embrulhado** ou **remendo**. As 23 linhas do estudo
(`EST:627-651`) vêm primeiro, com a unidade; as linhas 24 a 32 são as que o cartão acrescentou, e as 33 e 34 as da emenda de 2026-11-26; as 35 e 36 são do defeito de 2026-11-27
(https://github.com/developmentconexus-ops/conexus/issues/1498).
**Nenhuma linha fica sem referência.** A linha 26 (a conferência do SQL ao salvar) é a mais nova: a
referência é a do produto (Nekt) e a da ferramenta (SQLMesh), e a biblioteca escolhida foi lida só na
declaração de tipos (abaixo).

| # | Peça | O que o fundador já decidiu | Hoje no `main` (`def26dd9`) | Referência (situação) | Veredito | Prova, se não for nativo | Unidade e arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | A bruta | 0080 | `apps/extraction/src/conexus_extraction/target.py:19` (`RAW`) | Nekt, Lakeflow Connect (mesma) | nativo | — | fica de fora: etapa 2 |
| 2 | A atual | 0080 | `update.py:156-184`, o atualizar do G5 | AUTO CDC SCD 1 (mesma) | remendo da 0080 | a da etapa 2: 449 de 449 tabelas com diferença zero, e o `MERGE` de um caso passa com 450 colunas (`a-primeira-copia-chega-ao-lago.md`, linha 28 da tabela dela); `airbyte` 2.0.0 lido lá | fica de fora: etapa 2; o tratamento lê dela |
| 3 | As áreas `tratado` e `negocio` | Q1 (a); decisão 3 | `infra/aws/lib/lake.ts:51-58` só `raw` e `current`; `infra/aws/lib/actions.ts:36` `AREAS`; um segundo dono em `apps/server/src/platform/aws-copy-queue.ts:34` e outro em `apps/server/src/hub/copies/lake-copy.ts:32` | camadas da Nekt, "fronteira de armazenamento e de permissão" (`N:catalog__layers:9-11`); "dbt doesn't create `S3 Tables` namespaces for you" (docs.getdbt.com, `website/docs/reference/resource-configs/athena-configs.md:366`) | nativo (`CfnNamespace`) | — | U2: `infra/aws/lib/lake.ts`; `apps/server/src/platform/lake-areas.ts`, o dono da lista no servidor; a área `previa` fica para a T3a |
| 4 | O motor: dbt-core 1.12.7 com dbt-athena 1.11.2 | técnica, do firstmate (`EST:727`) | nenhum | `dbt-athena@1.11.2 catalogs/_s3_tables.py:8-36` (o catálogo `s3_tables`); `catalog_name` em `dbt-adapters@1.24.6 base/impl.py:402-410`; o modelo Python recusado em `create_table_as.sql:57-65` | nativo | — | U3: `apps/extraction/src/conexus_extraction/treat.py`; a prova na U1 |
| 5 | Onde roda | 0076 (o Hub dá o quando) | a tarefa da cópia, `entry.py:271-330` | a mesma imagem, uma rodada própria por empresa: Databricks Jobs, "By default, the maximum concurrent runs for all new jobs is 1" e "When capacity is available, the job run is dequeued and run" (docs.databricks.com/aws/en/jobs/settings, lido em 2026-11-25); o Meltano junta na mesma corrida (`meltano run tap target dbt-athena:build`, `EST/medalhao:522-525`) | nativo | — | U3 e U5b. **Diferença do estudo**, que punha o tratamento dentro da cópia (`EST:633`): duas ligações da mesma empresa copiam ao mesmo tempo (o índice `lake_run_open_key` é por ligação, `apps/server/src/hub/copies/tables.ts:130`), e duas cópias tratando ao mesmo tempo gravariam a mesma tabela. Decisão F1 |
| 6 | O gatilho: o fim da cópia | 0076 | o fim pela fila, `aws-copy-queue.ts:90-110`, `lake-close.ts:186` | Event da Nekt, "quando um ou mais pipelines terminam com sucesso" (`N:runs__scheduling-and-triggers:21-37`); "Triggers a job run when source tables are updated" (docs.databricks.com/aws/en/jobs/triggers) | nativo | — | U5b: `apps/server/src/hub/treatment/treatment-run.ts` |
| 7 | A prévia | Q9 (a): T3a e T3b | nenhuma | alvos do dbt; Run 10 da Nekt | nativo | — | fica de fora: T3a e T3b |
| 8 | A versão no Hub, com proposta e sim | Q7 (a) | o padrão da Ontologia, só tabelas: `apps/server/src/hub/ontology/tables.ts:185` (`proposal`), `:283` (`revision`, `approvedBy`, `hash`) | Nekt com GitHub, "Until it is merged, runs keep using the published code" (`N:queries__versioning:53`); 0064 | embrulhado | a versão ligada não muda até o sim (critérios da U5a); o molde da Ontologia já no `main` | U5a: `apps/server/src/hub/treatment/tables.ts` |
| 9 | Os testes de dado | Q2 (a); `T2` | nenhum | `dbt build` pula o que vem abaixo de um teste que erra (`dbt-core@1.12.7 task/build.py:202-209`) | nativo | — | fica de fora: `T2` |
| 10 | A conferência com a fonte | `T2` | nenhuma | a régua do trilho (`EST/medalhao:389-396`) | embrulhado | fica de fora: a etapa `T2` traz a sua prova | fica de fora: `T2` |
| 11 | A quarentena | `T2` | nenhuma | `store_failures` (`dbt-adapters` `test.sql:16-25`) | nativo | — | fica de fora: `T2` |
| 12 | O histórico SCD 2 | "ligado por tabela" (2026-11-18) | nenhum | `snapshot` (`dbt-athena@1.11.2 snapshot.sql:194-200`) | nativo | — | fica de fora: `T4` |
| 13 | A linhagem de tabela | Q1 (a) | nenhuma | Input tables e Output tables da Nekt, "deduzidas do SQL" (`EST:234`); o `depends_on.nodes` do `manifest.json` (`dbt-core@1.12.7 artifacts/resources/v1/components.py:283-287`) | embrulhado | o `depends_on.nodes` do `dbt-core` 1.12.7 lido no wheel; as entradas tiradas do SQL ao salvar (linha 26) | U5a guarda as entradas na versão; U6 mostra: `apps/web/src/hub/treatment/treated-table.tsx` |
| 14 | O notebook | Q3 (a, rodada 4) | nenhum | Nekt Notebook; marimo | nativo | — | fica de fora: `T4` |
| 15 | O molde da limpeza por conector | Q2 (a): "a Fábrica escreve a limpeza" | nenhum; o kit declara a tabela em `packages/connectors/src/kernel/tables.ts:86-98` | o staging do dbt: "Renaming", "Type casting", sem junção nem agregação (`dbt-docs@fc5b50c website/docs/best-practices/how-we-structure/2-staging.md:90-95`), gerado pelo codegen (`:122`); um pacote dbt por fonte da Fivetran (`EST/medalhao:421`) | nativo | — | U4: `packages/connectors/src/kernel/tables-treated.ts`. **Diferença**: o staging do dbt é visão (`:96`); o `S3 Tables` não tem visão, e o molde é tabela (a decisão 5) |
| 16 | O agente de dados | Q2 (a); Q9 (a) | `apps/server/src/harness/spec/kinds.ts:19-24`, quatro controladores | Genie Code; dbt MCP; Nekt MCP | nativo | — | fica de fora: T3b |
| 17 | Ler e perfilar o lago pelo Hub | 0078; Q6 (a) | o Hub não chama o Athena (nenhum `StartQueryExecution` em `apps/server/src`) | Nekt `explore_tables` | embrulhado | fica de fora: a etapa T3a traz a sua prova | fica de fora: T3a |
| 18 | O resultado na máquina como arquivo | Q3 (a, rodada 4) | `apps/server/src/harness/machine/e2b.ts:51` | `writeFile` do Mastra | embrulhado | fica de fora: a etapa T3b traz a sua prova | fica de fora: T3b |
| 19 | O sim antes de ligar | Q2 (a), Q7 (a) | o cartão de aprovação das escritas | Nekt `confirm=True` (`N:mcp-server__tools:383-417`); Genie "asks for your approval before proceeding" | nativo | — | U5a (a rota de ligar, com o hash) e U6 (o cartão): `apps/web/src/hub/treatment/approve.tsx` |
| 20 | A fonte `LAKE` do conceito | Q4 (a) | `packages/hub-api/src/ontology.ts:46-50`, só `DOOR` | Palantir, "backing datasources" | nativo | — | fica de fora: o Negócio |
| 21 | A métrica | Q5 (a) | nada | metric views, MetricFlow, Cube | nativo | — | fica de fora: o Negócio |
| 22 | O texto da regra no Brain | 0067 | nada | Genie Ontology | nativo | — | fica de fora: o Brain |
| 23 | As camadas em Dados | Q1 (a) | `apps/web/src/hub/copies/text.ts:22` (`Bruto`, `Negócio`, `Apps`); `data-page.tsx:101-122` | o catálogo por camada da Nekt (`EST:231`) | nativo | — | U6: `apps/web/src/hub/copies/data-page.tsx` muda; `apps/web/src/hub/treatment/` novo |
| 24 | O lago de uma receita anterior | decisão 2 (b): apagar e criar de novo | só `CreateStack` (`apps/server/src/platform/aws.ts:64`); a linha guarda a receita com que nasceu (`apps/server/src/hub/lake/tables.ts:21`) e um lago novo nasce com a da imagem (`lake.ts:253`); apagar o lago leva as tabelas, as cópias e os relógios (critério 48 da etapa 2, `docs/steps/a-primeira-copia-chega-ao-lago.md:728`) | uma camada nova é uma área nova no mesmo lago: `CREATE SCHEMA` na Databricks (docs.databricks.com/aws/en/sql/language-manual/sql-ref-syntax-ddl-create-schema), `create_layer` na Nekt (`N:mcp-server__tools:193-210`); a atualização no lugar, que as duas fazem, fica para a próxima etapa que mudar a receita | nativo (o apagar e o criar de hoje) | — | U2: a frase da receita anterior em `apps/server/src/hub/lake/lake.ts` e `apps/web/src/hub/operations/lake.tsx`; a recusa `LAKE_NOT_READY` do tratamento na U5b |
| 25 | O papel do tratamento e as concessões das áreas novas | decisão 4.2 | dois papéis por lago, o leitor e o escritor (`infra/aws/lib/lake.ts:59-60`); `writerGrants` (`infra/aws/lib/writer.ts:108-133`), `WRITER_GRANTS` (`actions.ts:34`); o escritor grava tabela sem condição de área (`writer.ts:57-61`) e lê o parâmetro com a senha da fonte (`:84-88`); `AREAS` serve ao escritor e ao limite (`actions.ts:36`, `writer.ts:76`, `platform.ts:134`); o papel de serviço só cria o leitor e o escritor (`platform.ts:164`) | "Databricks recommends changing the Run as user to a service principal" (docs.databricks.com/aws/en/jobs/privileges); "a dedicated user or service principal" (docs.getdbt.com/docs/deploy/deploy-environments); o dlt dá ao dbt só a credencial do destino (`dlt@8fa90a97 dlt/pipeline/dbt.py:71-74`); a Nekt separa os papéis dos conectores e das transformações (`N:get-started__setup:79-84`); o nível da pessoa fica no app e não vira credencial: Viewer, Editor e Manager da Nekt (`N:workspaces__permissions:21-25`, `:41`) ao lado do papel EMR da rodada (`N:get-started__setup:82`), e na Databricks "the job keeps running with the Run as user's privileges" depois de quem edita as tarefas (docs.databricks.com/aws/en/jobs/privileges); as concessões do Lake Formation numa tabela do `S3 Tables` (docs.aws.amazon.com/lake-formation/latest/dg/s3-tables-grant-permissions.html) e as de quem cria (…/implicit-permissions.html); o dbt apaga pelo Glue (`dbt-athena@1.11.2 macros/adapters/relation.sql:7-8`, `:22-30`, `impl.py:1528-1548`) e cria por `CREATE TABLE AS` (`create_table_as.sql:134-165`) | nativo | — | U2: `infra/aws/lib/treater.ts`, com a lista da U1; os quatro consertos da decisão 4.2 em `writer.ts`, `actions.ts`, `platform.ts` e `hub.ts` |
| 26 | O SQL lido ao salvar | Q7 (a): a versão no Hub | o Hub só lê SQL do PostgreSQL (`libpg-query`, `apps/server/package.json:49`) | Nekt: "Entradas e saídas deduzidas do SQL" (`EST:1151`); SQLMesh tira as tabelas do SQL simples (`sqlmesh@0.236.4 sqlmesh/core/model/definition.py:1309-1322`, `sqlmesh/core/dialect.py:1579-1597`, com as CTE de fora); `dt-sql-parser@4.6.1` traz o leitor do Trino com `validate`, `splitSQLByStatement` e `getAllEntities` (`dist/parser/common/basicSQL.d.ts:111`, `:141`, `:194`; `dist/parser/trino/trinoEntityCollector.js`) | embrulhado | `dt-sql-parser` 4.6.1 lido só na declaração de tipos; a U5a prova `validate` e `getAllEntities` no Trino antes de usá-los (o "Parar se" dela) | U5a: `apps/server/src/hub/treatment/sql.ts`. Usa `validate` e `splitSQLByStatement`; troca `getAllEntities`, que na 4.6.1 imprime no console num `join ... on true` válido, por `parse` + `listen` + `TrinoEntityCollector`, de `dist/parser/trino/index.js`, com os tipos do próprio pacote (`trino-parser.d.mts`). Rever a composição na próxima versão do `dt-sql-parser` (`docs/reference/stack.md`). O `;` final sai antes de guardar e do hash (U5b, Fechamento 2 da revisão do PR 1475) |
| 27 | O SQL da pessoa sem Jinja, com a ordem pelo `depends_on` | Q2 (a) | nenhum | "use a SQL comment instead of a Jinja comment" e "dbt still evaluates Jinja inside SQL comments" (docs.getdbt.com/reference/dbt-jinja-functions/ref, "Forcing dependencies") | embrulhado | a prova U1, critério 2, com `dbt-core` 1.12.7 e `dbt-athena` 1.11.2: o SQL sem Jinja roda na ordem do `depends_on` | U3: `treat.py`; a U1 prova (critério 2) |
| 28 | A especificação da rodada num objeto | 0076 | a cópia põe a especificação num parâmetro do SSM (`aws-copy.ts:153-160`), de até 8 KB | o dlt passa as credenciais ao dbt pelo ambiente e o projeto pelo disco (`dlt@8fa90a97 dlt/helpers/dbt/runner.py:173-175`, `:380-418`) | embrulhado | o dlt da estante (`dlt@8fa90a97`); o parâmetro do SSM tem teto de 8 KB (`aws-copy.ts:153-160`), e um objeto do `S3` não | U5b escreve; U3 lê. O Hub grava e lê na pasta da empresa do depósito de estado (`infra/aws/lib/hub.ts:173-185`), mas o escritor também grava e apaga nela (`writer.ts:94-98`): a especificação vai numa raiz própria, `tratamento/<empresa>/*`, que o Hub grava preso pela etiqueta da empresa e o papel do tratamento só lê (decisão 4.2, conserto 4) |
| 29 | O resultado de cada modelo | — | `CopyTaskResult` (`apps/server/src/hub/copies/lake-task.ts:37-64`) | `dbtRunner().invoke` e o resultado por nó (`dlt@8fa90a97 dlt/helpers/dbt/dbt_utils.py:73-87`, `:128-131`); os campos por nó em `dbt-core@1.12.7 artifacts/schemas/results.py:97-104`; a mensagem do nó tem o nome do modelo na primeira linha e o texto do Athena na segunda (`dbt-common@1.39.0 exceptions/base.py:135-150`, `:236-246`); a U1 gravou a primeira como "Runtime Error in model <nome> (<caminho>)", e a segunda começa pelo tipo do erro, com ou sem `line N:M` (`TABLE_NOT_FOUND: line 10:20: …`, `DIVISION_BY_ZERO: Division by zero. …`); uma recusa que o Athena dá antes de rodar tem uma linha só, sem tipo (registro da U1, seção 7.1) | nativo | — | U3: `treat.py`, o tipo e a linha pela decisão F12; o contrato em `apps/server/src/hub/treatment/treat-task.ts` |
| 30 | Juntar as cópias que chegam durante uma rodada | — | a cópia pula a segunda com `ALREADY_RUNNING` (`lake-run.ts:278-279`) | Databricks, "the run is queued" quando o máximo de rodadas simultâneas é atingido (docs.databricks.com/aws/en/jobs/settings); "Wait after last change", com as mudanças durante a espera reiniciando o tempo (…/jobs/trigger-table-update) | embrulhado | a coluna `pending` (U5b): uma segunda cópia durante a rodada marca a próxima, provada nos testes da U5b | U5b: a coluna `pending` em `treatment.run` |
| 31 | O varredor das rodadas de tratamento | 0076 | o varredor da cópia, `apps/server/src/hub/copies/lake-sweep.ts` | o de hoje, que fecha a rodada de cópia sem tarefa viva | nativo (a mesma forma) | — | U5b: `apps/server/src/hub/treatment/treatment-sweep.ts` |
| 32 | Refazer a tabela tratada quando o SQL muda ou falha | decisão 5 | nenhum | construir ao lado e trocar: `dbt-adapters@1.24.6 macros/materializations/models/table.sql:30-32`, `:42`, `:46`, `:59`; o dbt-athena no Iceberg do Glue (`dbt-athena@1.11.2 table.sql:124-169`); "there is never a time when the table doesn't exist" (docs.databricks.com/aws/en/delta/drop-table); o SQLMesh, "reduced to reference swapping" (sqlmesh.readthedocs.io/en/stable/concepts/plans/). No `S3 Tables` o dbt-athena apaga e cria (`table.sql:102-112`, o porquê em `:103-105`); o Athena não renomeia nem cria visão ali (docs.aws.amazon.com/athena/latest/ug/gdc-register-s3-table-bucket-cat.html); a API do `S3 Tables` renomeia (`RenameTable`, docs.aws.amazon.com/AmazonS3/latest/API/API_s3Buckets_RenameTable.html) | remendo nesta etapa (a janela aceita, com a entrada em `docs/reference/boundaries.md`); a troca pelo `RenameTable` na `T2` | `dbt-athena` 1.11.2, `table.sql:102-112`: no `S3 Tables` apaga e cria, e a tabela fica fora quando o SQL falha (`:106-107`); a U1 mede a janela, a tabela pela metade e o `RenameTable`; a entrada em `docs/reference/boundaries.md` | U3: o `materialized='table'` e a entrada de `boundaries.md`; a U1 mede a janela, a tabela pela metade e o `RenameTable` |
| 33 | Parar a rodada de tratamento | Q4 do estudo do Parar cópia, "4. Okay": na U5b e na U6, na mesma forma do Parar cópia | o Parar cópia, https://github.com/developmentconexus-ops/conexus/pull/1433 (`apps/server/src/hub/copies/lake-stop.ts`: `stopped_by` com `coalesce`, o `StopTask`, 202 sem esperar, fechar na hora sem tarefa); antes dele, nenhuma parada de rodada | a Nekt pede a parada e não espera: `POST /api/v1/runs/{id}/cancel/`, com `cancel_requested_at` e `cancel_requested_by` e os estados `cancelling` e `canceled` (a OpenAPI da Nekt lida em 2026-11-14); a Databricks, `runs/cancel`, "canceled asynchronously"; o Airbyte dá "Start/cancel syncs" ao mesmo papel que dispara (`airbyte@82db089b docs/platform/access-management/rbac.md:30`); o `StopTask` do ECS (`@aws-sdk/client-ecs@3.1175.0 models_1.d.ts:3447-3474`). Os três lidos no estudo do Parar cópia, de 2026-11-26 (fora do repositório, delivery L21) | embrulhado | a forma do PR do Parar cópia, com os testes dele; a U5b prova os seus pelos critérios 38 e 39 | U5b: `apps/server/src/hub/treatment/treatment-stop.ts`; U6: o botão em `treated-layer.tsx` |
| 34 | A descrição da coluna tratada | "1 okay" (2026-11-26): herda a da coluna copiada; "2 Okay também quero": Sugerir descrições numa etapa própria | a descrição da coluna copiada, gravada pela cópia em `copies.lake_table.columns` (`apps/server/src/hub/copies/tables.ts:144`) e mostrada em `LakeTableSummary.columns` (`packages/hub-api/src/lake-copies.ts:164-166`); o G1 já tirou `description` de `TreatedColumn` (https://github.com/developmentconexus-ops/conexus/pull/1430, `packages/connectors/src/kernel/tables-treated.ts:10-14`) | a descrição tem um dono só, a coluna copiada (code C26); na Databricks o comentário mora na coluna, e o sugerido pela IA é revisto antes de gravar ("you can review it and either accept it as-is or edit it before saving", docs.databricks.com/aws/en/comments/ai-comments) | nativo | — | U4: nenhuma descrição de coluna no molde; U5a: a coluna da lista de Tratado lê a da coluna copiada pela `column` |
| 35 | A rodada que não pede o que espera a primeira cópia | `D1`: "a" (2026-11-27) | Tratar agora e o fim de uma cópia pediam todo modelo nunca gravado, e a `current` criada vazia pela cópia era lida como pronta | o dlt testa as fontes antes e não roda o pacote cuja fonte pode ainda não existir (`dlt@8fa90a97 dlt/helpers/dbt/runner.py:292-297`) | embrulhado | a marca de copiada é `copies.lake_table.rows`, que a cópia só grava depois de aplicar a `current`; critério 29 | U5b: `apps/server/src/hub/treatment/select.ts` |
| 36 | O papel do tratamento acha o banco `current` | `D2`: "sim" (2026-11-27) | o papel tinha só `glue:GetTable` em `current`, e a tabela ausente voltava como acesso negado | Athena, "you need permissions to call this action on the resource (table or database) and all ancestors" (docs.aws.amazon.com/athena/latest/ug/fine-grained-access-to-glue-resources.html, lido em 2026-11-27) | nativo | — | U2: `infra/aws/lib/treater.ts` |

**O que o G5 mudou nas linhas do estudo.** O estudo citou `main` em `99b5eceb`. Conferidas em
`def26dd9`: a linha 2 já existe (`update.py`, que o estudo dava como "a construir"); "Atualizar a
receita de um lago que já tem dado" está em `a-primeira-copia-chega-ao-lago.md:381-382`, não em `:372`;
o texto "one PostgreSQL SELECT" das ferramentas de dados está em `harness/tools/data/tools.ts:55` e
`:58`; o leitor da pilha nasce em `infra/aws/lib/lake.ts:102-166`. As outras linhas citadas não andaram.

**A medida do transplante.** Nada vem do repositório antigo.

**A dívida.**

- A tabela tratada some quando o seu `CREATE TABLE AS` falha, até a próxima rodada boa
  (`dbt-athena@1.11.2 table.sql:106-107`; decisão 5). A `T2` a fecha.
- Tirar uma tabela da cópia deixa um modelo de Negócio ligado que a lê sem a entrada: a rodada seguinte
  o marca `FAILED` com o tipo do erro do Athena, e Dados mostra o motivo. Avisar antes de tirar a cópia
  fica para a etapa que trouxer o apagar de um tratamento.
- O `on_schema_change` e o `--full-refresh` do incremental não têm caminho provado no `S3 Tables`
  (docs.getdbt.com, `aws-iceberg-support.md:166-168`, `:204-218`); esta etapa só usa `table`.
- O log do dbt traz o texto do erro do Athena, que pode ter o valor de uma célula, para o log da
  tarefa da empresa, o mesmo da cópia de hoje. O resultado na fila nunca o leva (decisão F7). A U1 diz se o texto ecoa o SQL (security S41).
- A lista de áreas tem um dono na infraestrutura (`infra/aws/lib/actions.ts`) e um no servidor
  (`apps/server/src/platform/lake-areas.ts`), porque os dois pacotes não se importam; o teste da
  receita confere que as duas listas são iguais.

## As decisões do firstmate

| # | Decisão reversível ([delivery L6](../guides/delivery.md)) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| F1 | O tratamento é uma rodada própria por empresa, na mesma imagem e na mesma definição de tarefa da cópia, e não um passo dentro de cada cópia | Duas ligações da mesma empresa copiam ao mesmo tempo (`copies/tables.ts:130`, o índice aberto é por ligação), e um modelo de Negócio lê tabelas de mais de uma; uma rodada aberta por empresa tira a gravação dividida (Databricks, máximo de 1 com fila). Custa uma partida de tarefa a mais por cópia | chamar o tratamento depois do atualizar em `entry.py:324-325`, com uma trava por empresa |
| F2 | Toda tabela tratada é `materialized='table'`: apaga e cria de novo | O `merge` incremental não tira a linha que sumiu da atual: o `MERGE` do Athena só tem `WHEN MATCHED` e `WHEN NOT MATCHED` (docs.aws.amazon.com/athena/latest/ug/merge-into-statement.html), e as passadas inteiras e de janela apagam linhas da atual (0080). A Query da Nekt também reescreve a tabela inteira (`EST:1150`). O custo é a janela da decisão 5 e a leitura inteira a cada rodada | `incremental` com `merge` por modelo, quando a `T2` trouxer a troca segura |
| F3 | O Hub lê o SQL ao salvar, com o `dt-sql-parser`, e guarda as tabelas lidas na versão; a tarefa não lê SQL | Um dono só para "o que este modelo lê" (C26): o cartão Ligar mostra as entradas antes do sim, como a Nekt, e a tarefa só escreve as linhas `depends_on` | ler na tarefa com o `sqlglot` (o que o SQLMesh usa), e mostrar as entradas só depois da primeira rodada |
| F4 | O SQL da pessoa é um `SELECT` do Trino, sem Jinja: o Hub recusa `{{`, `{%` e `{#` ao salvar, e a tarefa recusa de novo pelo esquema | O Jinja do dbt roda `run_query` e lê o ambiente da tarefa; o texto de uma pessoa não pode virar código. Com as duas recusas, um bloco `{% raw %}` em volta do SQL não acrescenta nada, e fica de fora | aceitar `ref()` quando o agente da T3b escrever modelos, com a sua própria guarda |
| F5 | A especificação da rodada vai num objeto do depósito de estado, na raiz `tratamento/<empresa>/` | O SQL dos modelos passa dos 8 KB do parâmetro do SSM; a raiz fica fora do que o escritor grava (`writer.ts:94-98`) | o parâmetro do SSM, com um teto de tamanho |
| F6 | O molde é uma declaração de colunas no kit, que o kit transforma em `SELECT`, e não um arquivo SQL | O kit é a única fonte de um sistema (0069), a conformidade confere a declaração contra as gravações, e é o staging do dbt (renomear e tipar) que o codegen gera | arquivos `.sql` na pasta do conector, lidos pelo kit |
| F7 | O motivo de uma falha é o tipo do erro do Athena e a linha, nunca o texto | O texto de um erro de conversão traz o valor da célula; o resultado nunca leva o conteúdo de uma linha (`lake-task.ts:36`) | nenhum: só se amplia a lista de tipos |
| F8 | Um lago de receita anterior não trata: a Central diz para apagar e criar, e o tratamento recusa com `LAKE_NOT_READY` | A decisão 2 (b) tirou a atualização; o tratamento pede as áreas `tratado` e `negocio`, que o lago antigo não tem, e a receita da linha (`tables.ts:21`) contra a da imagem (`lake.ts:253`) diz qual é qual, sem nada novo na linha | a atualização no lugar, numa etapa seguinte |
| F9 | Tirar uma tabela da cópia apaga também a sua tabela em `tratado` | O molde só existe sobre a tabela copiada; uma tabela tratada sem fonte confunde Dados | deixar a tabela tratada até o apagar do lago |
| F10 | O tratamento roda num workgroup próprio do lago, `<nome do depósito>-tratamento` | O workgroup de hoje tem teto de 1 GiB por consulta e é dividido pelo leitor e pelo escritor (`infra/aws/lib/lake.ts:24-25`, `:61-71`); o `CREATE TABLE AS` lê a tabela inteira, e o teto próprio sai da medida da U1. Cabe no padrão `workgroup/conexus-*` que a plataforma já aceita | o workgroup de hoje, com o teto subido |
| F11 | Cada rodada guarda o `lake_id` do lago em que gravou, e a seleção e Tratado só leem as rodadas do lago de agora | Apagar e criar o lago (decisão 2, (b)) leva as tabelas, mas o Hub guarda as rodadas; ler uma rodada `BUILT` do lago apagado pularia o modelo no lago novo. Guardar o lago na rodada não pede que o módulo do lago apague linhas do tratamento | apagar as rodadas da empresa junto com o lago, no `remove` de `lake.ts` |
| F12 | O tipo do erro do Athena é o `^([A-Z][A-Z_]{2,63}):` no começo da segunda linha da mensagem do nó; a linha é a do primeiro `line N:M` dessa linha, menos as linhas que o dbt-athena põe antes do SQL da pessoa (9, mais uma por `-- depends_on`), e só vale dentro do tamanho do SQL; sem tipo, o modelo volta `TREAT_ENGINE_FAILED`; o texto do Athena nunca sai | A U1 gravou a primeira linha como "Runtime Error in model", e não "Database Error"; o regex que pedia `: line` perde `DIVISION_BY_ZERO` e `INVALID_CAST_ARGUMENT`, que não têm linha (registro da U1, seção 7.1). O G1 aplicou assim (https://github.com/developmentconexus-ops/conexus/pull/1430, `apps/extraction/src/conexus_extraction/treat.py:29-33`, `:109-121`), com teste sobre as sete gravações da U1, com e sem `depends_on`; o 9 é uma peça à mão, registrada em `docs/reference/boundaries.md` com a hora de rever (uma versão nova do dbt-athena) | o regex do cartão anterior, com `TREAT_ENGINE_FAILED` nos tipos sem linha |
| F13 | O kit declara o seu próprio `LakeTableName` (`packages/connectors/src/kernel/tables-treated.ts:3-6`), com a mesma regex e a mesma marca do contrato do Hub (`packages/hub-api/src/lake-copies.ts:13-14`), e um teste prende as duas (`apps/server/src/hub/connectors/copy-source.test.ts`, "o nome no lago que o kit faz é o do contrato do Hub") | O kit não importa `hub-api`, que já importa o kit: importar faria um ciclo (code C6). O padrão `LAKE_NAME_PATTERN` é o único dono do teto de 60 no kit (o G1, `d8aabb03`) | o kit importar o tipo de um pacote de contratos que nenhum dos dois importe |
| F14 | Uma rodada de tratamento parada fecha `STOPPED`, com quem parou; o seu `pending` não abre a próxima rodada sozinho, e os modelos do seu `select` entram na próxima seleção como os que falharam por último | Parar e logo reabrir seria o contrário do que a pessoa pediu (estudo do Parar cópia, seção 3). Um modelo parado no meio do seu `CREATE TABLE AS` pode ter a tabela fora (decisão 5), e sem resultado a seleção o daria por gravado na rodada anterior; contá-lo como falho faz a próxima cópia ou o Tratar agora o refazer. `STOPPED` separado de `FAILED` segue a Nekt (`canceled` distinto de `failed`) e o Parar cópia (`INTERRUPTED` com `stoppedBy`) | o `pending` abrir a próxima, e o modelo parado esperar a próxima cópia da sua entrada |
| F15 | Um lago trata quando a receita com que nasceu está na lista das receitas que têm `tratado` e `negocio`: a receita da imagem e as anteriores que já as tinham, uma lista no config do Hub (`apps/server/src/platform/config-aws.ts`), sem migração. A mesma lista decide a frase da receita anterior na Central (`apps/server/src/hub/lake/lake.ts`), que fala de tratar | O tratamento guarda pelo que precisa, as duas áreas, e não pela receita inteira: comparar o sha256 inteiro (`lake.ts:84` contra `config-aws.ts:88-90`) faria a primeira edição de `lake.template.json` depois do G1 recusar Tratar agora e a proposta em todo lago, com `LAKE_NOT_READY`, até apagar e criar de novo (a issue 1431, a raiz do achado 5 da revisão do https://github.com/developmentconexus-ops/conexus/pull/1430). Quem muda a receita põe a anterior na lista; um teste prende que a receita da imagem tem as duas áreas. `lake.ts` e `config-aws.ts` ficam fora do raio da U5b e entram declarados (delivery L7) | gravar na linha a receita nova depois de um `UpdateStack` (https://github.com/developmentconexus-ops/conexus/issues/1424) |

## U1 A prova do motor no lago

**Base e modelo.** `def26dd9`. O firstmate, com Sonnet, na conta de laboratório, com teto de US$ 1 e só
dado gerado (decisão 1, (a)); nenhuma linha de produto.

### As linhas da tabela

As linhas 3, 4, 25 e 27. A U1 roda o que o wheel diz (`dbt-athena@1.11.2 table.sql:94-112`,
`create_table_as.sql:134-165`, `relation.sql:7-30`, `catalogs/_s3_tables.py:8-36`) contra um depósito de
tabelas da conta de laboratório, com dado gerado. Mede também o `RenameTable` do `S3 Tables`
(docs.aws.amazon.com/AmazonS3/latest/API/API_s3Buckets_RenameTable.html), para a troca segura da `T2`
(decisão 5) partir de uma medida.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/extraction/tests/recordings/` | Cria `treat-*.jsonl` | `apps/extraction/tests/test_treat.py` (U3) |

### Os contratos que a unidade cria

Nenhum. As gravações seguem a testing T26 e a T29, com os valores inventados (security S40).

### As skills e a leitura

`aws-sdk-python-usage`, `aws-iam`; a linha `boto3` do `docs/reference/stack.md`; o estudo, seção 12.1;
as páginas da linha 25.

### A ordem do trabalho

1. **Uma pilha de laboratório com a receita da U2 em rascunho**: as quatro áreas, o papel do tratamento
   e o escritor com a condição `s3tables:namespace`, criados pelo mesmo caminho do Hub (`CreateStack`).
   Critério: 4.
2. **As permissões mínimas do papel do tratamento.** Critérios: 1, 3. Começa com `DESCRIBE` e
   `SELECT` em `current`, e `DESCRIBE` e `CREATE_TABLE` em `tratado` e `negocio`; o que faltar ao
   `CREATE TABLE AS`, ao apagar pelo Glue e ao `s3:GetObject` da especificação entra uma permissão por
   vez, e o registro guarda a lista final, para a decisão 4.2. Diz se o dbt pede `s3_staging_dir` com
   os resultados gerenciados do workgroup.
3. **Um projeto dbt à mão**, com o perfil `athena` (`region_name`, `work_group`, o `catalogs.yml` com
   `type: s3_tables` e `use_catalogs_v2: true`), o `generate_schema_name` que devolve a área como é, um
   modelo em `tratado` que lê `current` e um em `negocio` que lê o de `tratado` pelo `-- depends_on`;
   depois o mesmo modelo com a área ausente, e a lista dos bancos do catálogo da conta antes e depois.
   Critérios: 1, 2, 3.
4. **Medir**: a janela sem tabela num segundo `build` (dez vezes, a mediana e o máximo), os bytes lidos
   numa tabela gerada de 450 colunas e 100 mil linhas (o que decide o teto do workgroup do tratamento),
   o tamanho da imagem com o dbt e o tempo de partida da tarefa (`EST:742-745`, P1, P2 e P4).
   Critérios: 1, 3.
5. **A falha e a troca.** Critério: 4. Um `CREATE TABLE AS` que falha depois de ler (uma divisão por
   zero numa linha gerada): sobra tabela pela metade? O `build` seguinte a apaga pelo Glue
   (`relation.sql:22-30`), ou ela só sai pelo `DeleteTable` do `S3 Tables`, como avisa
   docs.aws.amazon.com/athena/latest/ug/gdc-register-s3-table-bucket-cat.html? Depois, um
   `RenameTable` de `<t>__nova` para `<t>` com `<t>` apagada antes: o tempo entre as duas chamadas, o
   Athena lendo o nome novo na hora, as concessões do Lake Formation que seguem ou não; e um
   `RenameTable` para um nome que existe.
6. **O escritor preso.** Critério: 4. O papel do escritor com a condição tenta `CreateTable` e
   `PutTableData` em `tratado`, e é recusado; em `raw` e `current` segue.
7. **Gravar** as respostas do Athena e do Glue de cada chamada do dbt, com os valores trocados por
   inventados, para o dublê da U3, e o texto de um erro do Athena, para saber se ecoa o SQL
   (security S41). Critério: 1.

### Como se prova

O registro na pasta da tarefa do firstmate, com os comandos e as saídas, e as gravações no repositório,
que os testes da U3 leem.

### Parar se

- O dbt-athena não grava no `S3 Tables` com nenhum conjunto de permissões: a etapa volta ao estudo, e o
  motor passa a ser o `CREATE TABLE AS` mandado pela tarefa (`EST:742`).
- O `dbt build` cria um banco no catálogo da conta (critério 3): o projeto da U3 sobrescreve a macro
  `athena__create_schema` para não fazer nada, e a U1 prova de novo.
- O `-- depends_on` não ordena os modelos (critério 2): a tarefa da U3 roda os modelos camada por
  camada, `tratado` antes de `negocio`, e o firstmate reescreve o passo 2 da U3.
- A tabela pela metade de um `CREATE TABLE AS` que falha não sai pelo apagar do Glue: a U3 ganha o
  passo de apagá-la pelo `DeleteTable` antes do `build`, e o papel do tratamento ganha
  `s3tables:DeleteTable` nas duas áreas; o firstmate emenda a U3 antes do G1.
- A condição `s3tables:namespace` não prende o escritor: a U2 para, e o conserto 3 da decisão 4.2 volta
  ao fundador com a medida.
- A janela sem tabela passa de um minuto: o fundador revê a decisão 5.
- O gasto passa de US$ 1.

## U2 As áreas novas e o papel do tratamento

**Base e modelo.** `def26dd9`. Sonnet: a receita, a plataforma e uma frase da Central, sem estado novo.

### As linhas da tabela

- **3.** `infra/aws/lib/lake.ts:51-58` ganha `Tratado` e `Negocio` (`CfnNamespace`), como `Raw` e
  `Current`. A lista das áreas tem um dono no servidor: `aws-copy-queue.ts:34` e `lake-copy.ts:32`
  passam a ler dele.
- **24.** A receita da linha (`apps/server/src/hub/lake/tables.ts:21`) contra a da imagem
  (`lake.ts:253`) dá a frase da Central. O apagar e o criar são os de hoje.
- **25.** O papel do tratamento, na forma do escritor (`infra/aws/lib/writer.ts:19-133`), com a lista
  da U1 confirmada pelo fundador (decisão 4.2), e os quatro consertos da mesma decisão.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `infra/aws/lib/` | Cria `treater.ts`; muda `copy.ts` (a fila aceita o papel do tratamento), `place.ts` e `names.ts` (o padrão do nome do papel), `lake.ts` (as áreas, o terceiro papel), `actions.ts` (uma lista de áreas por papel), `writer.ts` (a condição `s3tables:namespace` e a lista do escritor), `platform.ts` (o papel de serviço cria o do tratamento com o limite, e o limite dá ao tratamento o Glue das áreas novas), `hub.ts` (o `PassRole` aceita o papel do tratamento; o Hub grava em `tratamento/<empresa>/*`) | o `cdk synth` da receita e da plataforma; `infra/aws/test/` |
| `apps/server/src/platform/` | Cria `lake-areas.ts`; muda `aws-names.ts` (o nome do papel do tratamento), `aws-copy-queue.ts:34` | `apps/server/src/hub/lake/`; `apps/server/src/hub/copies/` |
| `apps/server/src/hub/lake/lake.ts` | Muda: `outdated` no `READY` | a Central |
| `apps/server/src/hub/copies/lake-copy.ts` | Muda: `AREAS` sai, lê `lake-areas.ts`; `dropTables` apaga também a tabela em `tratado` | a escrita da cópia |
| `packages/hub-api/src/lakes.ts` | Muda `ClientLake.READY` | `apps/web/src/hub/operations/lake.tsx` |
| `apps/web/src/hub/operations/lake.tsx` | Muda: a frase da receita anterior em Pronto | a página do cliente na Central |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/lakes.ts
export const ClientLake = z.discriminatedUnion('state', [
  /* NONE, CREATING, FAILED, DELETING, DELETE_FAILED como hoje */
  z.object({ state: z.literal('READY'), bucket: z.string(), region: z.string(), readyAt: At,
    outdated: z.boolean() }),
])

// apps/server/src/platform/lake-areas.ts, o dono da lista no servidor (C26)
export const LAKE_AREAS = ['raw', 'current', 'tratado', 'negocio'] as const
export const LakeArea = z.enum(LAKE_AREAS)

// infra/aws/lib/actions.ts, uma lista por papel
export const COPY_AREAS = ['raw', 'current'] as const
export const TREAT_AREAS = ['tratado', 'negocio'] as const
export const TREAT_READS = ['current'] as const
```

- **`outdated`** tem um dono: `lake.ts` compara a receita da linha com `config.aws.templateVersion`
  (`lake.ts:253`). Nenhuma coluna nova, nenhuma migração.
- **O papel do tratamento** (`treater.ts`), no molde de `writerGrants`: `DESCRIBE` e `SELECT` em
  `current`; `DESCRIBE` e `CREATE_TABLE` em `tratado` e `negocio`, mais o que a U1 provar; nada em
  `raw`; o Glue para criar, apagar e mudar tabela só nas duas áreas, e em `current` só
  `GetDatabase` e `GetTable`; o Athena só no workgroup do
  tratamento, `<nome do depósito>-tratamento` (decisão F10), com o teto que a U1 medir; `s3:GetObject` só em
  `tratamento/<empresa>/*`; `sqs:SendMessage` na fila; nenhum `ssm:GetParameter`.
- **O modelo de arquivo**: `infra/aws/lib/writer.ts` para `treater.ts`.

### As skills e a leitura

As linhas do `docs/reference/stack.md` de `infra/aws`: `aws-cdk`, `aws-iam`, `aws-cloudformation`; o
guia de segurança (S15, S36, S40).

### A ordem do trabalho

1. **Um dono da lista de áreas.** Critério: 12. **Arquivos:** cria `platform/lake-areas.ts`; muda
   `aws-copy-queue.ts:34`, `lake-copy.ts:32`. **O que sai:** o `z.enum(['raw', 'current'])` e o
   `AREAS` de `lake-copy.ts`. **O que entra:** `dropTables` apaga a tabela de mesmo nome em `tratado`.
   **Testes:** `lake-remove.test.ts` com uma tabela em `tratado` no dublê; `lake-copy.test.ts`.
   **Mutações à mão:** voltar o `enum` a duas áreas, e o caso fica vermelho.
2. **As listas por papel e o escritor preso.** Critério: 8. **Arquivos:** `actions.ts`, `writer.ts`.
   **O que sai:** `AREAS` (`actions.ts:36`). **O que entra:** `COPY_AREAS` no `glue:UpdateTable` do
   escritor (`writer.ts:76`) e do limite (`platform.ts:134`); a condição `s3tables:namespace` em
   `WriteTheCompanyTables` (`writer.ts:57-61`), com `COPY_AREAS`. Regras: S36. **Testes:** o modelo
   da receita em `infra/aws/test/lake.test.ts`. **Mutações à mão:** tirar a condição, e o teste fica
   vermelho.
3. **As áreas e o papel do tratamento.** Critério: 5. **Arquivos:** `lake.ts`, cria `treater.ts`.
   **Referência a seguir:** `lake.ts:51-60`, `writer.ts:19-133`. **O que entra:** as duas áreas, o
   workgroup do tratamento e o papel, com a lista da U1. **Testes:** o modelo da receita, e a igualdade
   entre `LAKE_AREAS` e a soma das listas de `actions.ts`. **Mutações à mão:** dar `INSERT` em
   `current` ao papel, e o teste fica vermelho.
4. **A plataforma e o Hub.** Critérios: 6, 9, 10. **Arquivos:** `platform.ts`, `hub.ts`, `copy.ts`,
   `place.ts`, `names.ts`. **O que entra:** um `place.treaters`, como `place.writers`
   (`place.ts:25`), e o sufixo do papel em `names.ts`; o papel de serviço cria e cuida do papel do
   tratamento só com o limite (`platform.ts:164`, `:176-186`); o limite ganha `glue:CreateTable`,
   `glue:DeleteTable` e `glue:UpdateTable` só em `TREAT_AREAS` (`:117-160`), e o Athena no workgroup
   do tratamento; a fila do resultado aceita o envio de `place.treaters` ao lado de `place.writers`, e
   a negação passa a excluir os dois (`copy.ts:163-186`); o `PassRole` da tarefa aceita o papel do
   tratamento (`hub.ts:155`); o Hub grava `s3:PutObject` em
   `tratamento/${aws:PrincipalTag/<empresa>}/*`, como em `hub.ts:173-185`. Regras: S36. **Testes:** `infra/aws/test/platform.test.ts`. **Mutações à
   mão:** tirar o limite da criação do papel do tratamento, e o teste fica vermelho.
5. **A Central.** Critério: 7. **Arquivos:** `lake.ts` (`outdated`), `packages/hub-api/src/lakes.ts`,
   `apps/web/src/hub/operations/lake.tsx`. **O que entra:** a frase em Pronto quando `outdated`.
   **Testes:** `lake.test.tsx` e o caso de leitura em `apps/server/src/hub/lake/lake.test.ts`.

### Como se prova

O `cdk synth` da receita e da plataforma pelos testes de `infra/aws`; a Central pelo dublê do lago com
as duas receitas.

### Parar se

- Um parâmetro novo na receita: a receita de hoje só tem `LakeId` e `CompanyId`, e a U2 não cria
  outro.
- A U1 mostrou que a condição `s3tables:namespace` não prende o escritor.
- A plataforma não consegue dar o Glue ao tratamento sem dar também ao escritor: a U2 para, e a
  pergunta vai ao firstmate antes de abrir a permissão.

## U4 O molde do Sankhya no kit

**Base e modelo.** `def26dd9`. Sonnet.

### As linhas da tabela

- **15.** `packages/connectors/src/kernel/tables.ts:86-98` (`TableDeclaration`) e
  `packages/connectors/src/sankhya/copy-tables.ts:20-80` (`notas`, `notas_itens`, `parceiros`,
  `produtos`); a referência é `2-staging.md:90-95`: renomear e tipar, sem junção, sem agregação.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Cria `tables-treated.ts`; muda `tables.ts`, `conformance-tables.ts` e o índice | `apps/server/src/hub/treatment/` (U5a) |
| `packages/connectors/src/sankhya/` | Muda `copy-tables.ts` | o kit |

### Os contratos que a unidade cria

```ts
// packages/connectors/src/kernel/tables-treated.ts
export const LakeTableName = z.string().regex(LAKE_NAME_PATTERN).brand('LakeTableName') // F13
export type TreatedCast = 'KEEP' | 'TEXT' | 'INTEGER' | 'DATE' | 'TIMESTAMP'
export type TreatedColumn = Readonly<{
  column: string      // a coluna da fonte, em minúsculas, como a cópia a grava
  as: string          // o nome na tabela tratada, [a-z][a-z0-9_]*
  cast: TreatedCast   // KEEP deixa o tipo da cópia; dinheiro fica decimal(38, 9) (0083)
}>  // sem descrição: a coluna tratada herda a da coluna copiada pela `column` ("1 okay")
export type TreatedTable = Readonly<{ description: string; columns: readonly TreatedColumn[] }>
/** O único dono do SELECT de um molde: lê "current"."<nome no lago>", sem filtro nem junção. */
export function treatedSelect(lakeName: LakeTableName, treated: TreatedTable): string
```

`TableDeclaration` ganha `treated?: TreatedTable`. O nome da tabela tratada é o nome da tabela no lago
(`tratado.sankhya_notas`): uma tabela por ligação, como a cópia. Nenhum filtro de empresa, nenhum
`tipmov` fixo: a regra de venda é do Negócio. O modelo de arquivo é `kernel/tables.ts`, que cumpre C21
(as uniões `TableSource`, `TableMode`) e C26; o nome no lago entra já conferido (`LakeTableName`, C23).
A tabela tratada guarda a descrição da tabela; a coluna, não: a descrição de uma coluna tem um dono, a
coluna copiada com o dicionário, e a U5a a lê pela `column`, nunca pelo `as` (C26; o fundador, "1 okay",
2026-11-26). O G1 já é assim (https://github.com/developmentconexus-ops/conexus/pull/1430,
`tables-treated.ts:10-14`).

### As skills e a leitura

`conexus-connector` (kit, lake e checklist); o guia de dados.

### A ordem do trabalho

1. **A declaração e o `SELECT`.** Critério: 13. **Arquivos:** cria `tables-treated.ts`; muda
   `tables.ts`. **O que entra:** `treatedSelect` com os identificadores entre aspas duplas. **Testes:**
   `tables-treated.test.ts`. **Mutações à mão:** trocar `current` por `raw`, e o teste fica vermelho.
2. **A conformidade.** Critério: 14. **O que entra:** cada `column` existe nas colunas descobertas da
   gravação da tabela; `as` único e no formato. **Testes:** `conformance-tables.test.ts`, um caso por
   recusa.
3. **O Sankhya.** Critério: 15. **Arquivos:** `copy-tables.ts`. **O que entra:** `treated` nas quatro
   tabelas, com as colunas de negócio que as gravações do dicionário trazem: em `notas` as do exemplo do
   estudo (`EST:486-498`), com `dtneg` em `DATE` e o dinheiro em `KEEP`, e a descrição de cada tabela;
   nenhuma descrição de coluna. **Pronto quando:** a conformidade passa nas quatro.

### Como se prova

A conformidade lê as gravações do dicionário do Sankhya que a etapa 2 já guardou (testing T29).

### Parar se

- Uma coluna do exemplo do estudo não está na gravação do dicionário: a coluna sai do molde, e o
  construtor diz qual.

## U3 A tarefa que trata

**Base e modelo.** `def26dd9`, no ramo do G1 depois da U4 (a U3 não toca as pastas da U2 nem da U4).
Sonnet.

### As linhas da tabela

- **4.** `dbt-athena@1.11.2 catalogs/_s3_tables.py:8-36`; o perfil em `connections.py:82-106`; o
  contexto da consulta em `connections.py:300-311`.
- **27.** O `-- depends_on` da página do `ref`, provado na U1.
- **29.** `dlt@8fa90a97 dlt/helpers/dbt/dbt_utils.py:73-87` e `:128-131`: `dbtRunner().invoke` e o
  resultado por nó; a forma da mensagem em `dbt-common@1.39.0 exceptions/base.py:135-150`, `:236-246`.
- Na base: `apps/extraction/src/conexus_extraction/entry.py:351-385` (ler a especificação, mandar o
  resultado), `update.py:41-63` (a classe `Athena`), `contract.py:15-92`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/treatment/treat-task.ts` | Cria: o contrato e o gerador do esquema | U5b; `apps/extraction/contract/treat-task.schema.json` |
| `apps/extraction/` | Cria `treat.py`; muda `entry.py`, `contract.py`, `pyproject.toml`, `uv.lock`, `Dockerfile` | a tarefa |
| `docs/reference/stack.md` | Cria as linhas `dbt-core` e `dbt-athena` | `check-docs` |
| `docs/reference/boundaries.md` | Cria a seção `dbt-athena 1.11.2`: no `S3 Tables`, refazer uma tabela é apagar e criar (`table.sql:102-112`), e a tabela fica fora quando o SQL falha; a saída nativa (`RenameTable`) e a etapa que a traz (code C75, decisão 5) | `check-docs` |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/treatment/treat-task.ts
export const TreatmentRunId = z.uuid().brand('TreatmentRunId')   // como o LakeRunId; a fila separa pelo type e pela tabela que acha o id
export const ModelName = z.string().regex(/^(tratado|negocio)__[a-z][a-z0-9_]{0,59}$/).brand('ModelName')
const NoTemplate = /^(?![\s\S]*\{[{%#])[\s\S]+$/                   // vai ao esquema JSON como pattern
export const TreatModel = z.object({
  name: ModelName,
  layer: z.enum(['tratado', 'negocio']),
  table: LakeTableName,
  sql: z.string().max(20_000).regex(NoTemplate),
  after: z.array(ModelName),          // os modelos que ele lê; vira -- depends_on
})
export const TreatTaskSpec = z.object({
  version: z.literal(1), runId: TreatmentRunId, attempt: z.int().min(1), companyId: CompanyId,
  lake: z.object({ bucketArn: z.string(), region: AwsRegion }), queueUrl: z.url(),
  models: z.array(TreatModel).min(1).max(200),
  select: z.array(ModelName).min(1),  // o que esta rodada grava
})
export const TreatFailureCode = z.string().regex(/^[A-Z][A-Z_]{2,63}$/)  // o tipo do erro do Athena
export const TreatTaskResult = z.object({
  type: z.literal('TREAT_RESULT'), version: z.literal(1), runId: TreatmentRunId, attempt: z.int().min(1),
  outcome: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('COMPLETE') }),
    z.object({ kind: z.literal('ERROR'), code: z.enum(['TREAT_SPEC_INVALID', 'TREAT_ENGINE_FAILED']) }),
  ]),
  models: z.array(z.discriminatedUnion('status', [
    z.object({ name: ModelName, status: z.literal('BUILT'), rows: z.int().min(0) }),
    z.object({ name: ModelName, status: z.literal('FAILED'), failure: TreatFailureCode, line: z.int().min(1).nullable() }),
    z.object({ name: ModelName, status: z.literal('SKIPPED') }),
  ])),
})
```

O esquema JSON vai em `apps/extraction/contract/treat-task.schema.json`, gerado como o da cópia
(`lake-task.ts:66-75`); o `contract.py` ganha os `TypedDict` das duas formas. A tarefa escolhe o
caminho pela variável: `CONEXUS_TREAT_OBJECT` trata, `CONEXUS_RUN_PARAMETER` copia; as duas, ou
nenhuma, é `TREAT_SPEC_INVALID` sem rodar nada. O modelo de arquivo é `lake-task.ts`, que cumpre C21
(o `outcome` pelo `kind`), C23 e C26.

### As skills e a leitura

As linhas do `docs/reference/stack.md` de `apps/extraction`: `boto3` (`aws-sdk-python-usage`), `uv`,
`ruff`, `mypy`, `pytest`, `duckdb`, `jsonschema`; o guia de testes.

### A ordem do trabalho

1. **O contrato.** Critério: 18. **Arquivos:** cria `treat-task.ts` e o esquema; muda `contract.py`.
   **Referência a seguir:** `lake-task.ts:17-75`. **Testes:** `treat-task.test.ts`: o esquema gerado
   tem o `pattern` do SQL. **Mutações à mão:** trocar o `regex` por um `refine`, e o teste fica vermelho.
2. **O projeto dbt.** Critérios: 16, 18. **Arquivos:** cria `treat.py`. **O que entra:** a
   especificação pelo esquema antes de tudo (C27); num diretório temporário, `dbt_project.yml` (com
   `flags: {use_catalogs_v2: true}`), `catalogs.yml`, `profiles.yml` (`work_group` é o nome do
   depósito com `-tratamento`, o workgroup do tratamento da decisão F10; a cópia usa o nome do depósito,
   `entry.py:367`), o `generate_schema_name` que devolve a área, e um
   `models/<camada>/<nome>.sql` por modelo: a linha
   `{{ config(materialized='table', catalog_name='lago', schema='<camada>', alias='<tabela>') }}`, uma
   linha `-- depends_on: {{ ref('<after>') }}` por entrada, e o SQL.
3. **Rodar e ler.** Critérios: 16, 17. **Referência a seguir:** `dbt_utils.py:128-131`. **O que
   entra:** `dbtRunner().invoke(['build', '--select', *select, ...])`; cada nó vira `BUILT`, `FAILED` ou
   `SKIPPED`; numa falha, pela decisão F12, o tipo é o `^([A-Z][A-Z_]{2,63}):` no começo da segunda
   linha da mensagem do nó (a primeira é "Runtime Error in model <nome> (<caminho>)", como a U1
   gravou; `exceptions/base.py:236-246`), e a linha é o primeiro `line N:M` da segunda linha menos as
   linhas que o dbt-athena põe antes do SQL da pessoa (9, mais uma por `-- depends_on`), só quando cai
   dentro do SQL; sem tipo, `TREAT_ENGINE_FAILED` no modelo; o resto da mensagem só no log; as linhas de cada tabela
   gravada por `count(*)`, com a classe `Athena` de `update.py:41-63`. **Testes:** a leitura sobre as
   sete mensagens gravadas pela U1, com e sem `depends_on`. **Mutações à mão:** mandar a mensagem
   inteira em `failure`, e o caso "falha no meio" fica vermelho pela forma; tirar o desconto das linhas,
   e o caso da linha fica vermelho.
4. **A imagem e a entrada.** Critério: 19. **Arquivos:** `entry.py`, `pyproject.toml`, `uv.lock`,
   `Dockerfile`, `docs/reference/stack.md`. **O que entra:** `dbt-core==1.12.7` e `dbt-athena==1.11.2`; a
   escolha do caminho pela variável. **Testes:** os de `test_entry.py` sem mudança.

### Como se prova

`test_treat.py` entra pela porta da tarefa, a função de `entry.py` que o `conexus-copy` chama, com
`CONEXUS_TREAT_OBJECT` apontando para um objeto do dublê. O `dbt build` roda de verdade contra o dublê
do Athena e do Glue (`tests/athena_double.py`, estendido), que responde com as gravações da U1 e
executa no DuckDB o SQL que recebe (a linha `duckdb` do `stack.md` diz que o dialeto não é o do Trino,
e a U1 prova as instruções no Athena).

### Parar se

- O dublê precisa responder a mais de vinte chamadas diferentes do dbt-athena para um `build`: o
  construtor para e leva ao firstmate a lista, antes de escrever um dublê grande.
- O tipo do erro do Athena não aparece na mensagem do nó para algum erro das gravações da U1.

## G1 O ponto de conferência

Depois da U3, antes do pull request: o `cdk synth` da receita e o da plataforma, e o diff contra os de
`def26dd9`, com as áreas, o papel do tratamento e os quatro consertos e nada mais; a Central com um lago
de receita anterior e um de hoje, a 1280 e a 390 px; a imagem construída com o dbt e o tamanho dela
contra o da U1; `test_treat.py` e os testes de hoje de `apps/extraction`; `npm run check` e os testes
de `infra/aws`, `apps/server/src/hub/lake`, `apps/server/src/hub/copies` e `packages/connectors`; a
linha de remoção de cada proteção tocada.

## U5a Os tratamentos no Hub

**Base e modelo.** O ramo do G2, com o G1 mesclado. Sonnet.

### As linhas da tabela

- **8.** `apps/server/src/hub/ontology/tables.ts:185-283` (proposta, revisão, quem aprovou e o hash):
  a mesma forma, num dono novo.
- **13 e 26.** `dt-sql-parser@4.6.1 basicSQL.d.ts:111`, `:141`, `:194` e o coletor do Trino; a
  referência de comportamento é `sqlmesh@0.236.4 sqlmesh/core/dialect.py:1579-1597` (as tabelas do SQL,
  sem as CTE).
- **15 e 25.** A lista de Tratado lê `TableDeclaration.treated` pelo índice do kit e as tabelas
  copiadas de `copies.lake_table` (`apps/server/src/hub/copies/tables.ts:135`), com as colunas e as
  descrições que a cópia gravou (`:144`).
- **34.** A descrição de cada coluna tratada é a da coluna copiada de mesma `column`.
- **19.** O sim pela rota, com o hash, como a 0064 ("the approval is a route").

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/treatment/` | Cria `tables.ts`, `sql.ts`, `models.ts`, `routes.ts`, `public.ts` | as rotas do Hub; U5b |
| `apps/server/src/hub/identity/` | Muda `roles.ts` (a instrução `treatment`) e `admission.ts` (as duas ações) | as rotas do tratamento; o `allows` da tela |
| `packages/hub-api/src/treatment.ts` | Cria as operações e os tipos | `apps/web` (U6) |
| `apps/server/database-grants.sql` | Muda: o dono e as concessões do esquema `treatment` | `catalog.test.ts` |
| `apps/server/migrations/` | Cria a migração do esquema `treatment` | `migrate` |
| `apps/server/package.json`, `package-lock.json`, `docs/reference/stack.md` | Muda: `dt-sql-parser` 4.6.1 | o Hub |

### Os contratos que a unidade cria

**As tabelas**, no esquema `treatment` (data D4), cada uma com `company_id` e a política da empresa
(`policy(SCOPE_ROLES.COMPANY, ...)`), e as concessões a `hub_company`:

| Tabela | Coluna | Tipo e restrição | Ao apagar |
| --- | --- | --- | --- |
| `model` | `id` | `text` chave, `TreatmentModelId` | — |
| | `company_id` | `text not null` | sem chave estrangeira (data D17) |
| | `name` | `text not null`, `^[a-z][a-z0-9_]{0,59}$`, único por `(company_id, name)` | — |
| | `description` | `text not null`, até 500 | — |
| | `created_by`, `created_at` | `text not null`, `timestamptz not null` | — |
| `version` | `id` | `text` chave | — |
| | `model_id` | `text not null references model(id)` | `on delete cascade`, como as tabelas de cópia (`copies/tables.ts:59`) |
| | `company_id` | `text not null` | — |
| | `number` | `int not null`, único por `(model_id, number)` | — |
| | `sql` | `text not null`, até 20.000 | — |
| | `inputs` | `jsonb not null`, `[{ layer, table }]` | — |
| | `hash` | `text not null`, `^[0-9a-f]{64}$`, o sha256 do SQL e das entradas | — |
| | `proposed_by`, `proposed_at` | `text not null`, `timestamptz not null` | — |
| | `approved_by`, `approved_at` | nulos juntos (`check`) | — |
| `run` | `id` | `text` chave, `TreatmentRunId` | — |
| | `company_id` | `text not null`; índice único `where ended_at is null` | — |
| | `lake_id` | `text not null`, o `LakeId` do lago em que a rodada gravou | — |
| | `cause` | `'COPY' \| 'NOW'` | — |
| | `state` | `'STARTING' \| 'RUNNING' \| 'DONE' \| 'FAILED' \| 'STOPPED'` | — |
| | `select` | `jsonb not null`, os `ModelName` | — |
| | `pending` | `jsonb not null default '[]'`, as tabelas copiadas durante a rodada | — |
| | `failure` | `TreatmentRunFailure`, não nulo só em `FAILED` | — |
| | `stopped_by` | `text`, nulo; quem pediu o Parar primeiro, escrito pela U5b, como `copies.lake_run.stopped_by` do Parar cópia | — |
| | `attempt`, `task`, `started_at`, `ended_at` | como `copies.lake_run` | — |
| `model_run` | `run_id` | `text not null references run(id)` | `on delete cascade` |
| | `company_id` | `text not null` | — |
| | `name` | `text not null`, `ModelName`; chave `(run_id, name)` | — |
| | `version_id` | `text references version(id)`, nulo num molde | `on delete set null` |
| | `status`, `rows`, `failure`, `line` | os do `TreatTaskResult` | — |

Nenhuma rota apaga um modelo nesta etapa; as cascatas servem ao apagar das linhas da empresa, como nas
cópias. A versão ligada é a de maior `number` com `approved_at`; nada mais a define (C26).

**A permissão** (decisão 4.1, (a)): uma instrução nova do plugin de organização do Better Auth,
`treatment: ['propose', 'approve']`, declarada em `createAccessControl` e dada só a `owner` e `admin`,
como `request: ['create', 'decide']` (`apps/server/src/hub/identity/roles.ts:29`, `:72-119`). Na tabela
`ACTIONS` (`apps/server/src/hub/identity/admission.ts:47-121`) entram `proposeTreatment` e
`approveTreatment`, `by: 'MEMBER'`, com `locks: true` nas escritas (security S8), e o `allows` de hoje
(`:142-147`) as confere. Nenhuma lista paralela.

**As rotas** (`packages/hub-api/src/treatment.ts`), todas `access: 'session'`. As de leitura e as de
propor pedem `proposeTreatment`; ligar e Tratar agora (U5b) pedem `approveTreatment`:

| Operação | Método e caminho | Entrada | Saída | Falhas |
| --- | --- | --- | --- | --- |
| `listTreatedTables` | `GET /api/companies/{companyId}/data/treated` | — | `TreatedTables` | `FORBIDDEN`, `DATABASE_UNAVAILABLE` |
| `getTreatmentModel` | `GET …/data/treated/models/{modelId}` | — | o modelo, as versões e as rodadas | `NOT_FOUND`, `FORBIDDEN` |
| `proposeTreatment` | `POST …/data/treated/models` | `{ name, description, sql }` | 201, o modelo e a versão 1 | as do critério 21, `LAKE_NOT_READY`, `FORBIDDEN` |
| `proposeTreatmentVersion` | `POST …/data/treated/models/{modelId}/versions` | `{ sql, description }` | 201, a versão | as do critério 21 menos o nome, `TREATMENT_VERSION_CHANGED`, `NOT_FOUND` |
| `approveTreatmentVersion` | `POST …/versions/{number}/approve` | `{ hash }` | 200, a versão ligada | `TREATMENT_VERSION_CHANGED`, `NOT_FOUND`, `FORBIDDEN` |

```ts
export const TreatmentModelId = z.uuid().brand('TreatmentModelId')
export const TreatmentRunFailure = z.enum(['TREAT_START_FAILED', 'TREAT_TASK_STOPPED', 'TREAT_SPEC_INVALID', 'TREAT_ENGINE_FAILED'])
export const TableRef = z.object({ layer: z.enum(['current', 'tratado', 'negocio']), table: LakeTableName })
export const ModelRunView = z.discriminatedUnion('status', [/* BUILT com rows e at; FAILED com failure, line e at; SKIPPED com at */])
export const RunView = z.discriminatedUnion('state', [/* STARTING e RUNNING com since e stopping; DONE com at; FAILED com failure e at; STOPPED com stoppedBy ({ name } ou nulo) e at */])
export const TreatedTable = z.discriminatedUnion('layer', [
  z.object({ layer: z.literal('tratado'), name: LakeTableName, connectionId: ConnectionId, description: z.string(),
    columns: z.array(z.object({ name: z.string(), description: z.string().nullable() })), readBy: z.array(TableRef), lastRun: ModelRunView.nullable() }),
  z.object({ layer: z.literal('negocio'), id: TreatmentModelId, name: LakeTableName, description: z.string(),
    active: VersionView.nullable(), proposal: VersionView.nullable(), readBy: z.array(TableRef), lastRun: ModelRunView.nullable() }),
])
export const TreatedTables = z.object({ lake: z.enum(['CURRENT', 'OUTDATED', 'NONE']), lastRun: RunView.nullable(), tables: z.array(TreatedTable) })
// VersionView: number, sql, inputs: TableRef[], hash, proposedBy (o nome), proposedAt, approvedBy, approvedAt
```

- **Os ids**: `TreatmentModelId` e `TreatmentRunId` com marca, conferidos no parse da rota (C23).
- **O dono de "o que um modelo lê"**: `treatment/sql.ts` (C26). Ele devolve
  `{ kind: 'QUERY', inputs } | { kind: 'REFUSED', code, detail }`, e nada mais lê SQL.
- **A descrição da coluna tratada**: `name` é o `as` do molde, e `description` é a da coluna copiada
  cuja `name` é a `column` do molde, lida em `copies.lake_table.columns`; nula quando a copiada não tem
  descrição, como `LakeTableSummary.columns` (`packages/hub-api/src/lake-copies.ts:164-166`). Nunca
  pelo `as`: no Sankhya os dois são iguais, mas um molde que renomeie perderia a descrição (a revisão do
  G1, achado 3).
- **O dono do modelo de um molde**: `treatment/models.ts` monta, para cada tabela copiada com
  `treated`, o `TreatModel` `tratado__<nome>` com `treatedSelect` (U4); para cada modelo de Negócio
  ligado, o da versão ligada.
- **O esquema Zod** de cada corpo, na operação (C27).
- **O arquivo modelo**: `apps/server/src/hub/copies/tables.ts`, que cumpre C21 e C26.

### As skills e a leitura

As linhas do `docs/reference/stack.md` de `apps/server/src/hub`: Fastify (`fastify-best-practices`),
Drizzle, Zod, Neon (`neon-postgres`), Better Auth (`better-auth-best-practices`,
`organization-best-practices`); o guia de dados e as regras S8 e S13 do de segurança.

### A ordem do trabalho

1. **O leitor de SQL.** Critério: 21. **Arquivos:** cria `sql.ts`; muda `apps/server/package.json`,
   `package-lock.json`, `docs/reference/stack.md`. **O que entra:** recusar `{{`, `{%` e `{#` antes de
   ler; `splitSQLByStatement` com um só comando; `validate` sem erro; o primeiro comando é `SELECT` ou
   `WITH`; `getAllEntities` dá as tabelas, menos os nomes das CTE; cada uma com área. **Testes:** um caso
   por recusa e um por forma do Trino que o roteiro usa (`with`, junção, subconsulta, `date_trunc`,
   `try_cast`, uma expressão `x -> x`). **Mutações à mão:** deixar passar dois comandos, e o caso fica
   vermelho.
2. **A permissão.** Critério: 24. **Arquivos:** `roles.ts`, `admission.ts`. **Referência a seguir:**
   `request: ['create', 'decide']` (`roles.ts:29`, `:34-35`) e a skill `organization-best-practices`.
   **Testes:** os de hoje de `admission` e um caso por papel: Dono e Administrador com as duas ações,
   Desenvolvedor, Membro e um papel próprio com nenhuma. **Mutações à mão:** dar `propose` ao
   `member`, e o caso fica vermelho.
3. **As tabelas e a migração.** Critérios: 20, 24. **Arquivos:** `tables.ts`, a migração,
   `database-grants.sql`. Regras: D4, D6, D10, D11, D15, D17. **Testes:** `catalog.test.ts`;
   `apps/server/src/hub/treatment/tables.test.ts`, a política de linha nas quatro tabelas.
4. **Propor e ligar.** Critérios: 20 a 24. **Arquivos:** `routes.ts`, `public.ts`,
   `packages/hub-api/src/treatment.ts`. **O que entra:** conferir as entradas contra as tabelas
   copiadas da empresa, os moldes e os modelos de Negócio; o ciclo pelo grafo das versões propostas e
   ligadas; o número da versão pelo índice único, e o conflito vira `TREATMENT_VERSION_CHANGED`; ligar
   condicional ao hash e a ser a última proposta. Regras: D22. **Mutações à mão:** ligar sem conferir o
   hash, e o critério 22 fica vermelho.
5. **A lista de Tratado e de Negócio.** Critério: 25. **Arquivos:** `models.ts`, `routes.ts`.
   **Testes:** pela rota, com o Sankhya do dublê e uma tabela do HubSpot sem molde; um molde de teste
   que renomeia uma coluna (`column` diferente de `as`) e mostra a descrição da copiada.
   **Mutações à mão:** procurar a descrição pelo `as`, e o caso do molde que renomeia fica vermelho.

### Como se prova

Pela porta do Hub (T5): as rotas com a sessão de um Dono, de um Administrador e de outro papel.

### Parar se

- O `dt-sql-parser` erra uma das formas do Trino do teste do passo 1, ou conta o nome de uma CTE como
  tabela sem jeito de separar: o construtor para; a saída é ler no Athena pelo `EXPLAIN (TYPE IO)`, que
  pede o leitor da etapa 3, e volta ao firstmate.
- O pacote pesa no início do Hub mais que um segundo, medido no `npm run check` do servidor.

## U5b A rodada de tratamento

**Base e modelo.** O ramo do G2 com a U5a. Opus: duas cópias da mesma empresa terminam ao mesmo tempo,
e a rodada tem de juntar, nunca dobrar nem perder.

### As linhas da tabela

- **5, 6 e 30.** `apps/server/src/hub/copies/lake-run.ts:115-121`, `:143-188`, `:249-279` (tentar,
  partir, parar e o `ALREADY_RUNNING`); `lake-close.ts:186` (`closeLakeRun`); `lake-queue.ts:20-47`,
  `:64`, `:74` (a fila lê `CopyTaskResult | EcsStopped`, com o `startedBy` como `LakeRunId`); a
  referência é a fila da Databricks e o "Wait after last change" citados na linha 30.
- **28.** `apps/server/src/platform/aws-copy.ts:62-88` (`runTaskInput`), com a variável nova no lugar do
  parâmetro e o papel do tratamento no lugar do escritor.
- **31.** `apps/server/src/hub/copies/lake-sweep.ts`, a forma do varredor.
- **33.** O Parar cópia (https://github.com/developmentconexus-ops/conexus/pull/1433):
  `apps/server/src/hub/copies/lake-stop.ts` (`createLakeStop`, `requestTaskStop`), `lake-routes.ts`
  (`stopLakeCopyRun`, 202 e 200), `lake-close.ts` (o fim sem resultado depois do pedido fecha
  `INTERRUPTED` com a causa `PERSON`) e `packages/hub-api/src/lake-copies.ts` (`stopping`, `stoppedBy`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/treatment/` | Cria `treatment-run.ts`, `treatment-sweep.ts`, `treatment-stop.ts`, `select.ts`; muda `routes.ts` | `lake-close.ts`, `lake-queue.ts`, o início do Hub |
| `apps/server/src/hub/copies/lake-close.ts` | Muda: avisa o tratamento no fim `COMPLETE` | — |
| `apps/server/src/hub/copies/lake-queue.ts` | Muda: lê também `TreatTaskResult`; o `EcsStopped` acha a rodada pelo id na cópia ou no tratamento | `aws-copy-queue.ts` |
| `apps/server/src/platform/aws-copy.ts`, `aws-copy-queue.ts` | Muda: `treatTaskInput`, `putTreatObject`; a mensagem da fila aceita os dois tipos | `treatment-run.ts` |
| `packages/hub-api/src/treatment.ts` | Cria `runTreatmentNow` e `stopTreatmentRun` | U6 |
| `apps/server/src/hub/copies/lake-stop.ts` | Muda, se preciso: `requestTaskStop` recebe só os campos do log, para o tratamento chamá-lo sem `connectionId` | `lake-stop.ts`, `treatment-stop.ts` |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/treatment.ts
export const runTreatmentNow = defineOperation({
  id: 'runTreatmentNow', access: 'session', method: 'POST',
  path: '/api/companies/{companyId}/data/treated/run',
  success: { status: 202, body: z.object({ run: TreatmentRunId }) },
  failures: ['FORBIDDEN', 'ALREADY_RUNNING', 'LAKE_NOT_READY', 'NOTHING_TO_TREAT', 'TREATMENT_WAITING_COPY',
    'DATABASE_UNAVAILABLE'],
})
// a forma de stopLakeCopyRun: sem corpo; 202 { stopping: true } com o pedido feito, 200 { stopping: false } sem rodada aberta
export const stopTreatmentRun = defineOperation({
  id: 'stopTreatmentRun', access: 'session', method: 'POST',
  path: '/api/companies/{companyId}/data/treated/run/stop',
  success: { status: 202, body: z.object({ stopping: z.boolean() }) },
  failures: ['FORBIDDEN', 'DATABASE_UNAVAILABLE'],
})

// apps/server/src/hub/treatment/select.ts, puro
export function selection(graph: ModelGraph, changed: readonly TableRef[], last: ReadonlyMap<ModelName, 'BUILT' | 'FAILED' | 'SKIPPED'>): readonly ModelName[]
export function awaitingFirstCopy(graph: ModelGraph, uncopied: readonly TableRef[]): ReadonlySet<string>

// apps/server/src/hub/treatment/treatment-run.ts
export type AfterCopy = (companyId: CompanyId, copied: readonly LakeTableName[]) => Promise<
  | Readonly<{ kind: 'OPENED'; run: TreatmentRunId }>
  | Readonly<{ kind: 'COALESCED'; run: TreatmentRunId }>
  | Readonly<{ kind: 'NOTHING_TO_TREAT' }>
  | Readonly<{ kind: 'LAKE_OUTDATED' }>
>
```

- **O estado da rodada** como união pelo `state` (C21), com um dono, `treatment-run.ts`; o motivo de
  uma rodada que falha é `TreatmentRunFailure` (U5a), e nenhum outro texto.
- **O fim** fecha uma vez: o resultado pela rodada e a tentativa, o `EcsStopped` sem resultado, ou o
  varredor, os dois últimos com `TREAT_TASK_STOPPED`; o segundo não muda nada (C21; make operations
  idempotent).
- **`pending`**: o perdedor do índice único acrescenta as suas tabelas à aberta numa transação; ao
  fechar, se `pending` não está vazio, a mesma transação abre a próxima com `selection(pending)`.
- **O Parar** (decisão F14): a mesma forma do Parar cópia. Grava `stopped_by` com `coalesce` numa
  rodada aberta, pede o `StopTask` pela mesma chamada da cópia (`requestTaskStop`, sem segunda
  implementação) e responde sem esperar; sem tarefa, fecha `STOPPED` na hora, e a partida em curso
  desfaz a própria tarefa. O `EcsStopped` ou o varredor de uma rodada com `stopped_by` fecha `STOPPED`,
  e não `FAILED` com `TREAT_TASK_STOPPED`; um `TREAT_RESULT` que chega antes do fim vale, como no Parar
  cópia. O fecho `STOPPED` não abre a próxima pelo `pending`.
- **A especificação**: `s3://<estado>/tratamento/<companyId>/<runId>-<tentativa>.json`, fora da pasta `<companyId>/*` que o escritor grava e apaga (decisão 4.2, conserto 4), escrita antes do
  `RunTask`, nunca no log.
- **O modelo de arquivo**: `lake-run.ts`, que cumpre C21 (o `ALREADY_RUNNING` como variante) e C23.

### As skills e a leitura

As linhas do `docs/reference/stack.md` de `@aws-sdk/client-ecs`, `client-sqs`, `client-s3`
(`aws-sdk-js-v3-usage`); o guia de dados (D22, D25, D27).

### A ordem do trabalho

1. **A seleção.** Critérios: 11, 26. **Arquivos:** cria `select.ts`. **O que entra:** os modelos abaixo
   das tabelas copiadas, mais os nunca gravados e os que falharam por último, lendo só as rodadas do
   lago de agora (`run.lake_id`); um modelo de Negócio só se ligado; vazio quando nada a tratar. **Testes:** a função, com o grafo do roteiro. **Mutações à mão:**
   tirar os que falharam, e o caso fica vermelho.
2. **Abrir e juntar.** Critérios: 26, 27. **Arquivos:** `treatment-run.ts`, `lake-close.ts`.
   **Referência a seguir:** `lake-run.ts:249-279`. **O que entra:** o fim `COMPLETE` da cópia chama
   `AfterCopy` depois da transação da cópia, nunca dentro dela; o índice único decide quem abre.
   **Testes:** `treatment-run.test.ts`, "duas ligações": as duas cópias terminam juntas, uma rodada abre e
   a segunda cai em `pending`. **Mutações à mão:** ignorar o conflito do índice, e o caso fica vermelho.
3. **Partir.** Critério: 30. **Arquivos:** `aws-copy.ts`. **Referência a seguir:**
   `aws-copy.ts:62-88`, `:153-160`. **O que entra:** o `RunTask` da cópia com `CONEXUS_TREAT_OBJECT` no
   lugar de `CONEXUS_RUN_PARAMETER` e o papel do tratamento; as tentativas de `lake-run.ts:115-121`;
   `TREAT_START_FAILED` depois delas.
4. **Fechar.** Critério: 28. **Arquivos:** `lake-queue.ts`, `aws-copy-queue.ts`, `treatment-run.ts`.
   **O que entra:** a fila separa os dois resultados pelo `type`; o `EcsStopped` procura o id em
   `copies.lake_run` e depois em `treatment.run`; grava `model_run`; abre a próxima pelo `pending`.
   **Testes:** `lake-queue.test.ts` com os dois resultados misturados e um `EcsStopped` de cada.
5. **O varredor.** Critério: 28. **Arquivos:** cria `treatment-sweep.ts`. **Referência a seguir:**
   `lake-sweep.ts`. **O que entra:** no início do Hub e no mesmo ritmo do varredor da cópia, uma rodada
   aberta cuja tarefa não está viva fecha com `TREAT_TASK_STOPPED`. **Testes:** `treatment-sweep.test.ts`.
6. **Tratar agora.** Critério: 29. **Arquivos:** `routes.ts`. **O que entra:** a guarda do lago com a
   receita nova (`outdated` falso), da rodada aberta e de haver modelo; a rota pede `approveTreatment`
   (decisão 4.1). A guarda do lago é a da decisão F15 (a resposta à
   https://github.com/developmentconexus-ops/conexus/issues/1431): o lago trata quando a sua receita
   está na lista das receitas que têm `tratado` e `negocio`, e não só quando é a receita da imagem.
7. **Parar.** Critério: 38. **Arquivos:** cria `treatment-stop.ts`; muda `routes.ts`,
   `treatment-run.ts`, `treatment-sweep.ts`, `select.ts`. **Referência a seguir:** `lake-stop.ts` e o
   fecho de `lake-close.ts` do Parar cópia. **O que entra:** a rota com `approveTreatment`; o fim
   `STOPPED` com quem parou; o `pending` que não reabre; os modelos do `select` da rodada parada na
   próxima seleção. **Testes:** `treatment-stop.test.ts`: com e sem rodada, sem tarefa, dois pedidos, o
   fim pela fila e pelo varredor depois do pedido, o resultado que chega depois do pedido, e um papel
   sem `approve`. **Mutações à mão:** gravar `stopped_by` sem `coalesce`; fechar `FAILED` no fim depois
   do pedido; abrir a próxima pelo `pending`; tirar da seleção os modelos parados. Cada uma deixa um
   caso vermelho.

### Como se prova

O dublê da AWS de hoje (o `RunTask`, a fila e o `PutObject`) e o banco de teste; os dois fins pela fila
gravada; a corrida das duas cópias com duas transações abertas ao mesmo tempo.

### Parar se

- A fila da cópia não separa os dois tipos sem mudar o `CopyTaskResult`: o contrato da cópia não muda
  nesta etapa, e volta ao firstmate.
- O varredor da cópia (`lake-sweep.ts`) fecha uma rodada de tratamento como se fosse de cópia.

## U6 As camadas em Dados

**Base e modelo.** O ramo do G2 com a U5b. Sonnet.

### As linhas da tabela

- **23.** `apps/web/src/hub/copies/text.ts:22` (`DATA_LAYERS`), `search.ts:4` (`DataLayer`),
  `data-page.tsx:101-122`, `data-tree.tsx:104-113`, `lake-detail.tsx:88`, `lake-tabs.tsx`; o modelo da
  Nekt na linha.
- **13 e 19.** As abas De onde vem, Quem lê e Versões, e o cartão Ligar, sobre a lista da U5a.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/copies/` | Muda `text.ts`, `search.ts`, `data-page.tsx`, `data-tree.tsx` | a rota de Dados |
| `apps/web/src/hub/treatment/` | Cria `treated-layer.tsx`, `treated-table.tsx`, `business-layer.tsx`, `new-treatment.tsx`, `approve.tsx`, `treatment-stop.tsx`, `queries.ts`, `text.ts` | `data-page.tsx`; as rotas |
| `apps/web/src/routes/_app/companies/$companyId/` | Cria `data.treated.$name.tsx`, `data.business.$modelId.tsx` | o roteador |

### Os contratos que a unidade cria

- `DataLayer` ganha `treated`; o valor `raw` fica, para não quebrar os endereços de hoje, e o texto
  passa a "Copiado": `DATA_LAYERS = { raw: 'Copiado', treated: 'Tratado', business: 'Negócio', apps: 'Apps' }`.
- A camada Negócio deixa de mostrar o aviso dos conceitos (`NO_CONCEPT`, `CONCEPT_HINT`): o conceito
  chega com a etapa do Negócio, por cima destas tabelas. As duas frases saem.
- O texto do motivo por código tem um dono, `treatment/text.ts` (C26), para `TreatFailureCode` e
  `TreatmentRunFailure`; um código que a tela não conhece mostra "O Athena recusou o SQL (<código>)",
  e a linha, quando há, entra como ", na linha N".
- O modelo de arquivo é `apps/web/src/hub/copies/lake-detail.tsx`, que cumpre C22 (os estados da
  tabela pela união da resposta) e C26.

### As skills e a leitura

As linhas do `docs/reference/stack.md` de `apps/web/src`: TanStack Router e Query, `@base-ui/react`,
`shadcn`, `tailwindcss`; `impeccable`; o guia de web e o de desenho (V62).

### A ordem do trabalho

1. **As camadas.** Critério: 31. **Arquivos:** `text.ts`, `search.ts`, `data-page.tsx`. **O que sai:**
   `NO_CONCEPT` e `CONCEPT_HINT` com o `BusinessLayer` de hoje (`data-page.tsx:29`). **Testes:**
   `data-page.test.tsx`, com as três sessões e o lago numa receita anterior.
2. **Tratado e a tabela tratada.** Critérios: 32, 33. **Arquivos:** `treated-layer.tsx`,
   `treated-table.tsx`, a rota. **Referência a seguir:** `lake-detail.tsx:88` e `lake-tabs.tsx`.
3. **Negócio, Novo tratamento, Propor mudança, Versões e Ligar.** Critérios: 34, 35. **Arquivos:**
   `business-layer.tsx`, `new-treatment.tsx`, `approve.tsx`, a rota do modelo. **O que entra:** o
   formulário em `ui/field`, `ui/input`, `ui/textarea` (monoespaçado), aberto vazio ou com a versão
   ligada; a aba Versões em `ui/list`; o cartão em `ui/alert-dialog` com `ui/code-block`; o hash lido
   vai no corpo de `approveTreatmentVersion`.
4. **Tratar agora.** Critério: 29 pela tela. **Arquivos:** `treated-layer.tsx`.
5. **Parar.** Critério: 39. **Arquivos:** cria `treatment-stop.tsx`; muda `treated-layer.tsx`.
   **Referência a seguir:** o botão do Parar cópia
   (https://github.com/developmentconexus-ops/conexus/pull/1433,
   `apps/web/src/hub/connectors/lake-copied-controls.tsx`): a confirmação em `ui/alert-dialog`,
   "Parando…" com `focusableWhenDisabled` (`@base-ui/react@1.9.0 button/Button.d.ts:21`), a releitura
   pelo `MutationCache.onSettled` (web W12) e "Parada por <nome> às <HH:MM>". **Testes:**
   `treatment-stop.test.tsx`. **Mutações à mão:** tirar o foco de "Parando…", e o caso fica vermelho.

### Como se prova

Os testes de tela com o `msw` respondendo as operações da U5a e da U5b (testing T14); a QA a 1280 e a
390 px nos dois temas (T25).

### Parar se

- Uma tela pede uma peça de `ui/` que não existe: ela entra com a sua linha de referência (design V62)
  e volta ao firstmate antes.

## G2 O ponto de conferência

Depois da U6, antes do pull request: a migração do `treatment` pelo `migrate` e o `catalog.test.ts` com
o banco de teste (o superusuário `postgres` e o dono `conexus_owner`, como a CI); o Hub local com os
dublês, o roteiro inteiro do passo 2 ao 6 numa empresa de teste, com um Parar no passo 5 (o dublê da AWS responde o `RunTask` e
a fila com o `TREAT_RESULT` gravado), a 1280 e a 390 px nos dois temas; `npm run check`,
`npm run migrations`, os testes de `apps/server/src/hub/treatment`, `apps/server/src/hub/copies` e
`apps/web/src/hub`; a linha de remoção de cada proteção tocada.
