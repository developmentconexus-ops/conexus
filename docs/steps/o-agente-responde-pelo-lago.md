# O agente responde pelo lago

Trilha Dados, a etapa 3 do lago, com a porta MCP: o primeiro passo das respostas do fundador ao estudo
Data & Context, em 2026-11-27 (`"D1. A D2. A D3. A D4. A onde ja roda atualmente D5. Prefiro ja ir rodando em paralelo"`). A pergunta da trilha: "Pergunto ao Assistente e ele responde do lago, diz de
quando é, e recusa o que o meu papel não lê?" (`docs/steps/trilhas/dados.md`, a linha da etapa 3). O
Assistente desta etapa é o do Mastra Studio, no repositório `conexus-studio`, e ele chega ao lago só por
uma URL e um token.

Os estudos ficam fora do repositório (delivery L21). `EST:N` é a linha `N` do relatório
`conexus-lago3-estudo` (2026-11-25, o desenho da leitura). `DC:N` é a linha `N` do relatório
`conexus-data-context-arquitetura` (2026-11-27, a porta, os repositórios e o primeiro passo). `NK/<pasta>:N`
é a linha `N` de um estudo da Nekt ou do Databricks em `conexus-estudos/estudos/`; `TN:N` é a linha `N`
do relatório do teste da Nekt que rodamos (`conexus-referencias-testes-nekt`). `LL:N` é a linha `N` do
relatório `conexus-lago-leitores-areas-estudo` (2026-11-27, quem lê o lago e quais áreas o agente lê, o
estudo das decisões 1 e 2 desta página).

Cada linha do `main` citada foi lida em `beea44cef`. As versões:

- `@mastra/mcp` 2.11.0, a estável mais recente (`npm view`, 2026-11-27). Ela pede `@mastra/core`
  `>=1.83.0-0 <2.0.0-0`, e o Hub instala 1.83.0 (`apps/server/package.json:32`): a porta não pede
  subir o core. Ela puxa `@modelcontextprotocol/node` 2.1.2 e fala a revisão `2026-07-28` do MCP;
  outra revisão é recusada (`@mastra/mcp@2.11.0 dist/index.js:25255-25258`).
- `@aws-sdk/client-athena` e `@aws-sdk/client-glue` 3.1175.0, o pino das outras peças da AWS
  (`apps/server/package.json:18-24`; `npm view`).
- `better-auth` 1.7.8, já instalado, com o plugin `bearer` que ele traz.
- No `conexus-studio`: `@mastra/core` 1.86.0, a versão do pull request 1 dele, e `@mastra/mcp` 2.11.0.

**Antes da construção.**

1. **A palavra do fundador sobre esta página** (delivery L6). As três decisões dela já foram dadas, em
   2026-11-27 (a seção "As decisões suas nesta etapa").
2. **A U1, a prova no laboratório.** O G1 e o G2 não começam antes dela: o que ela medir fixa as
   concessões da U2 e as gravações que os testes da U3 leem.
3. **A etapa `T1` fechou** (delivery L1 e L5) com o pull request
   https://github.com/developmentconexus-ops/conexus/pull/1513, em 2026-11-28. Nenhuma unidade deste
   cartão toca os arquivos dos consertos da `T1`.

## A página do fundador

**No fim desta etapa** você abre o Mastra Studio no seu computador, pergunta ao Assistente do
`conexus-studio` algo do lago da empresa de teste, vê ele achar a tabela e consultar, e recebe o número
com a data da cópia. Com o token de uma pessoa que não lê aquela tabela, a mesma pergunta volta "não
encontrei". A mesma porta publica um app: o agente do Studio manda a pasta do app, e o Hub a põe no ar na
Cloudflare pela mesma função do botão Publicar.

**O roteiro de uso.**

1. No Hub no ar, você entra como a pessoa Dona da empresa de teste, abre as ferramentas do navegador e
   copia o valor do cookie da sessão. Esse é o token de teste. Você o cola no `.env` do
   `conexus-studio`, ao lado da URL da porta, que o firstmate lhe passa.
2. No terminal do `conexus-studio`, você roda `npm run dev` e abre o Studio em `http://localhost:4111`.
   Em Agents aparece o Assistente, com as ferramentas `conexus_data_describe` e `conexus_data_query`
   (o `MCPClient` põe o nome do servidor na frente, `reference-tools-mcp-client.md:439-443`).
3. Você pergunta, por exemplo, "quantas notas tivemos em novembro?". Na conversa aparecem duas chamadas:
   `conexus_data_describe`, com as tabelas que a Dona lê, e `conexus_data_query`, com o SQL que o
   Assistente escreveu.
   A resposta traz o número e diz de quando é a cópia, por exemplo "copiado hoje às 04:12".
4. Você troca o token pelo de uma pessoa Membro da mesma empresa e faz a mesma pergunta.
   `conexus_data_describe` volta sem tabela, e o Assistente responde que não encontrou essa tabela no que a
   pessoa pode ler. Se você pedir a tabela pelo nome, a resposta é a mesma de uma tabela que não existe.
5. De volta ao token da Dona, você abre no Hub um Projeto da empresa de teste e copia o endereço da página
   dele. No Studio, você pede ao agente de teste da publicação que publique o app de exemplo nesse
   Projeto. Na conversa aparece a chamada `conexus_publish`, e a resposta traz o número da versão e o
   endereço do app. Você abre o endereço e vê o app. Na aba Versões do Projeto, no Hub, a versão aparece
   publicada, como se você tivesse apertado Publicar.

**O que você faz, e quando.** Antes: aprova esta página e o nome novo do Registro de dados,
**"Agente de fora (MCP)"**, e convida uma pessoa Membro na empresa de teste. As três decisões da página
você já deu. Depois do G1: apaga e cria de novo o lago da empresa de
teste na Central e marca as tabelas, porque a receita do lago muda (a mesma regra da sua decisão 2 b da
`T1`; a atualização no lugar é a issue 1424). No fim: faz o roteiro e diz o que viu. O merge do G1 é
palavra sua, porque ele dá ao Hub uma permissão nova na AWS.

**O que já é decisão sua e entra como está.**

- O Studio recebe só uma URL e um token pelo ambiente; nenhum código do Conexus no agente (`D1` a).
- A porta MCP mora no Hub, com o token do Better Auth agora e o OAuth na fase 2; o agente usa o
  `MCPClient` (`D2` a). O token desta fase é a sessão de uma pessoa: ela vale 30 minutos parada e 8 horas
  no total (`apps/server/src/hub/identity/auth.ts:80`, security S18), e depois disso você copia outra.
- Dois repositórios: `conexus-studio` com os agentes, `conexus` com o Hub e Data & Context (`D3` a).
- O Hub roda onde já roda, no servidor de São Paulo (`D4` a). A auditoria do lago corre em paralelo (`D5`).
- O dado novo nasce lido só por Dono e Administrador (b2, `docs/approvals/cada-papel-le-so-o-seu.md:3`).
- O que o papel não lê não aparece, e o nome e as colunas também ficam escondidos ("1 B",
  https://github.com/developmentconexus-ops/conexus/issues/1226).
- O agente lê o lago pelo Athena, e o dialeto vem do catálogo (0079).
- A publicação pelo Studio passa pelo Hub: "Okay publicacao pelo hub" (2026-11-27). Publicar é do
  Conexus, e a ferramenta do agente e o botão chamam a mesma função. A empresa de teste mora na mesma
  conta da Cloudflare, como uma empresa comum ("Usar mesma conta como se fosse uma empresa, para ser a de
  teste"). O `conexus-studio` não ganha código de publicação nem token da Cloudflare.

**O que as referências fazem, em palavras simples.**

- **Nekt**: tem uma porta MCP em `mcp.nekt.com/mcp`, com o token de uma pessoa. A consulta roda com o
  que essa pessoa vê. No nosso teste, a tabela fora do token voltou "não está no catálogo; pode ser uma
  tabela que este token não vê" (`TN:385`). No nosso teste, a lista de tabelas da porta não trouxe a data da cópia (`TN:383`).
- **Databricks**: as portas MCP gerenciadas rodam o SQL "com as permissões do Unity Catalog de quem
  chama" (`NK/conexus-nekt-structure-study/notes/round3-databricks.md:106`). Também não mostram a data.
- **AWS (Athena com Lake Formation)**: a própria AWS esconde a tabela que o papel não lê, com a mesma
  recusa de uma tabela que não existe, medido na nossa conta (`EST:126`).

A data da cópia é onde vamos além das duas: nenhuma a mostra pela porta.

**A visão.** A etapa serve a estas linhas da `VISION.md`:

- "o lago é a única fonte dele" (`VISION.md:51`): o agente lê a cópia no lago, nunca outro lugar;
- a regra em camadas da 0078 ("the Hub decides, AWS enforces at each query"): quem recusa a tabela
  fora do papel é a AWS, e o Hub só traduz a recusa.

Nada cruza a visão.

**Fica de fora.**

- **Quem lê**: marcar outro papel numa tabela, a aba da tabela e a reconciliação com a AWS. Até essa
  etapa, só Dono e Administrador leem tabela copiada (b2). As issues
  https://github.com/developmentconexus-ops/conexus/issues/1125 e a Amostra esperam a mesma etapa, porque
  são telas do Hub. A única mudança numa tela do Hub é o nome novo de quem leu no Registro de dados.
- **O Assistente do Hub** ler o lago. Ele segue com as leituras ao vivo; as ferramentas são as mesmas e
  passam a responder do lago quando o Hub as ligar, na etapa que trouxer o bloco Fontes de volta.
- **O OAuth completo** (fase 2): o `@better-auth/mcp`, os metadados, e os clientes de fora, como o Claude
  e o ChatGPT. Também o token por pessoa vindo do login do Studio.
- **Agir** pela porta (as escritas nos sistemas da empresa), **os arquivos do lago** (etapa 3a), **o corte por Projeto** e **o Knowledge e a
  Ontologia** como capacidades da porta.
- **A fila justa de consultas**, que espera a segunda empresa (`docs/steps/trilhas/dados.md`).
- **O Construtor do Studio** construindo o app que publica. Ele é o item 1 do plano de validação no
  Studio e usa a mesma ferramenta `publish`; aqui a prova é um agente de teste com uma pasta de exemplo.
- **Criar um Projeto pela porta**: o Projeto nasce no Hub, como hoje.

**As decisões suas nesta etapa.** Você as deu em 2026-11-27. Na primeira leitura, aprovou a 3 e
mandou estudar a 1 e a 2: "1. Estude, foi decisão mal feita, valide melhor e me traga a proposta de
acordo com códigos de referencia, orientações e documentação cloudflare. Quero fontes / 2. Como a Nekt
faz e databricks, tenha certeza do que fazer, leia não assuma nada de memoria, nem por apenas ler uma
seção. / 3. Aprovado". Depois do estudo (`LL`), respondeu "Decisão 1: A / 2: A".

1. **Como Dono e Administrador leem toda tabela, inclusive a que nasce amanhã: (a).**
   - **O que estava mal feito.** A 0078 usa a concessão por tabela, com a condição sobre a etiqueta da
     sessão de quem lê (medida 16 de 16, `EST:120`), para dois casos diferentes: "um papel lê esta
     tabela" e "um papel lê a área inteira, inclusive o que nascer depois". Ela também deixa implícito
     quem concede. O CloudFormation não escreve essa condição: o recurso tem principal, recurso e
     permissões (`aws-cdk-lib@2.278.0 aws-lakeformation/lib/lakeformation.generated.d.ts:1387-1411`). E
     a AWS não deixa delegar uma concessão por atributo: "Grantable permissions are not available with
     ABAC" (`LL:17-24,157-163`).
   - **A escolha.** Duas formas de leitura, cada uma com o dono certo (`LL:26-33`). Quem lê uma área
     inteira, hoje Dono e Administrador, entra num segundo leitor por empresa. Esse leitor recebe da
     pilha da empresa `SELECT` e `DESCRIBE` em `TableWildcard` de `current`, `tratado` e `negocio`, como
     o papel do tratamento já recebe (`infra/aws/lib/treater.ts:138-139`). O Hub não ganha poder de
     conceder: só entra nos dois leitores. Quem lê só tabelas marcadas segue a concessão por tabela da
     0078, e quem faz essas concessões fica para a etapa Quem lê, que traz a primeira delas. A 0078
     ganha a emenda das duas formas (U2).
   - **As fontes.** O CloudFormation escreve a concessão com `TableWildcard`
     (aws-resource-lakeformation-principalpermissions); "A wildcard object representing every table under
     a database" (API_TableWildcard); com curinga, um nome de tabela que apareceu depois da concessão foi
     lido na primeira consulta, 5 de 5, no estudo da `T1` (`LL:135`). A Nekt e o Databricks dão a mesma
     forma: a concessão na camada ou no schema cobre o que nascer dentro dele, "A grant on a Layer also
     covers Folders, Tables, and Volumes created there later" e "automatically applies to all current
     and future child objects" (`LL:237-238,274-277`). O exemplo SaaS mais próximo da AWS, um agente de
     dados com Athena e Lake Formation, também tem um papel IAM por tipo de leitura, a concessão escrita
     pela pilha e o servidor sem poder de conceder (`LL:167-178`).
   - **O que ficou de fora.** A etiqueta do Lake Formation (LF-Tag) no banco não traz nada a mais para
     Dono e Administrador, e a associação dela num banco de `s3tablescatalog` pelo CloudFormation não está
     documentada (`LL:44-49`). Um leitor só, com o Hub concedendo como administrador do lago, daria ao Hub
     o poder de conceder em todo catálogo da conta (`LL:50-52,162-163`).
   - **O que a U1 mede.** Nenhuma frase oficial diz que o `TableWildcard` cobre a tabela criada depois, e
     a medida da `T1` usou o papel que criou a tabela (`LL:313-317,325-328`). O critério 1 mede o caso
     desta etapa: o leitor de tudo lê uma tabela que o tratamento criou depois da pilha.
2. **Quais áreas o agente lê: (a), `current`, `tratado` e `negocio`, sem `raw`.**
   - **A escolha.** O agente lê como a pessoa (0078), então as áreas que ele lê são as que o papel da
     pessoa lê. Para Dono e Administrador, são as três que o leitor de tudo recebe. Exemplo: "quanto
     vendemos em outubro" lê `negocio.venda`. A `raw` fica de fora, porque é a camada de máquina da cópia
     (`LL:68-73`).
   - **As fontes.** Nenhuma das duas referências escolhe camadas para o agente: a permissão de quem
     pergunta decide. Na Nekt, a camada é "both a **storage boundary** and a **permission boundary**", a
     de cima é "Business-ready data for analytics, AI agents, and Destinations", e o servidor MCP mostra
     as camadas que o dono do token vê (`LL:234-252`). No Databricks, a bronze "Is intended for
     consumption by workloads that enrich data for silver tables, not for access by analysts and data
     scientists", e a gold "is designed for business users"; o Genie e o servidor MCP de SQL leem com as
     permissões do Unity Catalog de quem pergunta (`LL:258-273`).
   - **O que ficou de fora.** Só `current` vai contra as duas referências. As quatro áreas dobrariam o
     que o agente vê, e a `raw` só tem histórico ligado numa tabela (`LL:74-78`, `EST:71-75`).
3. **O gasto da U1: sim.** A prova roda na conta de laboratório, com dado gerado, teto de US$ 1. Uma
   consulta custa cerca de US$ 0,00005 em us-east-2 (`EST:288`).

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| antes | U1 A prova no laboratório | As concessões do leitor de tudo e do leitor por papel, o catálogo do Glue filtrado, a bateria da #1226, os tempos, e as gravações | `apps/server/src/platform/recordings/aws/` (os arquivos entram no commit da U3) | testing | a página |
| G1 | U2 Os dois leitores e a permissão do Hub | O leitor de tudo na pilha, as áreas novas no leitor por papel, o Hub entrando nos dois, a receita nova | `infra/aws/`, `apps/server/src/platform/config-aws.ts`, `docs/decisions/0078-*.md` | security | U1 |
| G2 | U3 O lago no adaptador da AWS | A sessão do leitor, o catálogo do Glue, a consulta no Athena com prazo e teto, o mapa de recusas | `apps/server/src/platform/` | data | U2 |
| G2 | U4 A fonte `lake` do contrato | O catálogo com as tabelas e o dialeto, a resposta `ROWS` com a origem, a recusa `QUERY_REFUSED`, as ferramentas com o texto novo | `packages/hub-api/src/`, `apps/server/src/hub/data/`, `apps/server/src/hub/access/`, `apps/server/src/hub/copies/public.ts`, `apps/server/src/hub/treatment/public.ts`, `apps/server/migrations/`, `apps/web/src/hub/data/`, `apps/server/src/harness/tools/data/` | data | U3 |
| G2 | U5 A porta MCP | O `MCPServer` na rota da empresa, o token do Better Auth, as duas ferramentas sobre o `CompanyData` de quem chamou | `apps/server/src/harness/mcp/`, `apps/server/src/platform/access.ts`, `apps/server/src/platform/http.ts`, `packages/hub-api/src/operation.ts`, `apps/server/src/hub/identity/`, `.dependency-cruiser.cjs`, `apps/server/src/main.ts` | security | U4 |
| G2 | U7 A publicação pela porta | A ferramenta `publish` na porta MCP, sobre as funções de hoje do envio e do botão Publicar | `apps/server/src/harness/mcp/`, `apps/server/src/hub/apps/public.ts` | security | U5 |
| G3 | U6 O Assistente no `conexus-studio` | O agente com o `MCPClient`, as instruções sem nome de tabela, o `.env.example` | `conexus-studio`: `src/mastra/agents/assistant/` | — | U5 publicada |

O G1 é um pull request só dele, com a palavra de merge do fundador (permissão nova na AWS, F11). O G2
é um pull request de quatro unidades. O G3 é um pull request no `conexus-studio`, depois do G2 no ar.

**Orçamento de código alterado.** U2: 180. U3: 350. U4: 500. U5: 280. U7: 160. U6: 160. Total da etapa: cerca de
1.630 linhas, abaixo da delivery L2.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Uma sessão do leitor de tudo lê com `SELECT` uma tabela de `current`, de `tratado` e de `negocio` criada depois da pilha; uma sessão do leitor por papel com a etiqueta `member` recebe a mesma recusa de uma tabela inexistente, em todos os casos da bateria P4 (`EST:262-277`) | registro da U1 | must |
| 2 | U1 | O `GetTables` do Glue, na sessão de cada leitor, lista só as tabelas que o leitor lê: todas para o de tudo, nenhuma para o de `member` | registro da U1; gravação `lake-tables-*.jsonl` | must |
| 3 | U2 | A pilha tem o leitor de tudo, que só confia numa sessão do Hub com a etiqueta da empresa e `conexus-leitor` igual a `owner` ou `admin`; com `member`, com outra empresa ou sem a etiqueta, a STS recusa | `infra/aws/test/lake-reader.test.ts` | must |
| 4 | U2 | O leitor de tudo tem `SELECT` e `DESCRIBE` em toda tabela de `current`, `tratado` e `negocio`, e nada em `raw`; o leitor por papel tem só `DESCRIBE` no catálogo e nas três áreas, e nenhum `SELECT` | `infra/aws/test/lake.test.ts` (o modelo da receita) | must |
| 5 | U2 | O papel do Hub entra nos dois leitores da empresa da sessão, e só neles: o teste de `lake-reader.test.ts:66` passa a ver o Hub entrar no leitor de A e continua recusando o de B | `infra/aws/test/lake-reader.test.ts` | must |
| 6 | U3 | Um lago de receita anterior, sem o leitor de tudo, responde à leitura com `TABLE_UNAVAILABLE` (a STS recusa entrar num papel que não existe), e o tratamento dele segue (U2, `TREATABLE_BEFORE`) | `apps/server/src/platform/aws.test.ts`, pela gravação da U1 | must |
| 7 | U3 | A sessão do leitor leva as duas etiquetas, dura 15 minutos e é guardada por empresa e papel; a de Dono e Administrador entra no leitor de tudo, a de outro papel no leitor por papel | `apps/server/src/platform/aws.test.ts` | must |
| 8 | U3 | Uma consulta roda no grupo `conexus-<lago>`, no catálogo `s3tablescatalog/conexus-<lago>` e na área `current`, com o plano em paralelo; devolve no máximo 200 linhas e diz se cortou; um resultado que passa de 1 MiB responde `QUERY_REFUSED` com "resultado grande demais: peça menos colunas ou linhas" | `apps/server/src/platform/aws.test.ts`, pelas gravações da U1 | must |
| 9 | U3 | Passado o prazo de 5 s, ou com o sinal cancelado, o Hub chama `StopQueryExecution` e responde `DEADLINE` | `apps/server/src/platform/aws.test.ts` | must |
| 10 | U3 | Tabela, área ou catálogo não achado, e a falta de permissão do Lake Formation, viram a mesma recusa, sem a mensagem da AWS; outro erro de SQL vira `QUERY_REFUSED` com a mensagem; o limite de consultas vira `BUSY`; a AWS fora vira `TABLE_UNAVAILABLE`. Um `INSERT`, `DROP`, `CREATE TABLE AS` ou `UNLOAD` é recusado pela AWS e o lago não muda | `apps/server/src/platform/aws.test.ts`, um caso por linha da tabela de falhas | must |
| 11 | U4 | `describe` traz, além dos sistemas, as tabelas que o papel lê, cada uma com o nome a escrever no SQL (`<área>.<tabela>`), o rótulo, as colunas com o tipo, a área, a origem e a última rodada; e o dialeto `TRINO`. Membro recebe a lista vazia | `packages/hub-api/src/company-data-conformance.ts`, lei nova; `apps/server/src/hub/data/conformance.test.ts` | must |
| 12 | U4 | `read({kind:'QUERY'})` responde `ROWS {columns, rows, complete, origin[]}`; `origin` traz, por tabela que o plano nomeou, o nome, o rótulo, o sistema e a última rodada terminada (`COMPLETE`, `ERROR` ou `INTERRUPTED`, com a hora) ou `NONE` | conformidade, lei nova | must |
| 13 | U4 | Para Membro, uma tabela que só Dono lê e uma que não existe dão a mesma resposta, `NOT_IN_CATALOG`, em `read({kind:'TABLE'})` e em `read({kind:'QUERY'})`, sem nome nem coluna | conformidade, a lei 3 reescrita | must |
| 14 | U4 | Cada leitura do lago grava a sua linha no registro antes de responder, com o SQL, as tabelas do plano e quem pediu; sem a linha, a resposta é `TABLE_UNAVAILABLE` | `packages/hub-api/src/company-data-record-conformance.ts` | must |
| 14a | U4 | O Registro de dados mostra a leitura pela porta com quem leu "Agente de fora (MCP)", e o filtro por quem leu a acha | `apps/server/src/hub/data/routes.test.ts`; `apps/web/src/hub/data/read-detail.test.tsx` | must |
| 15 | U4 | O texto de `data_describe` e de `data_query` não nomeia tabela nem dialeto: remete ao campo do catálogo (code C80); "PostgreSQL" e "No table is kept yet" saem | `apps/server/src/harness/tools/data/tools.test.ts` | must |
| 16 | U4 | A origem só aceita os estados de uma rodada terminada e `NONE` (a #1124, item 1) | `packages/hub-api/src/company-data.test.ts` | must |
| 17 | U5 | Um `POST` em `/api/companies/<empresa>/mcp` com `Authorization: Bearer <sessão>` de uma pessoa da empresa lista `data_describe` e `data_query`, e cada uma responde pelo `CompanyData` daquela pessoa, daquela empresa | `apps/server/src/harness/mcp/mcp.test.ts`, com o `MCPClient` 2.11.0 do lado de lá | must |
| 18 | U5 | Sem token, com token vencido, ou com o token de quem não é da empresa da URL, a porta responde 401 e não chama o contrato | `mcp.test.ts` | must |
| 19 | U5 | Uma rota de sessão, uma de `entry` com sessão opcional e a de `handoff`, com só `Authorization: Bearer` e sem cookie, respondem como sem sessão: o token só vale na porta MCP | `apps/server/src/platform/access.test.ts` | must |
| 20 | U5 | A porta não lê cookie: com só o cookie da sessão e sem `Authorization`, responde 401 | `mcp.test.ts` | must |
| 21 | U5 | Uma recusa do contrato chega ao cliente MCP como resultado com `isError: true` e o motivo, nunca como 500 | `mcp.test.ts` | must |
| 22 | U5 | A leitura pela porta grava no registro com o consumidor `mcp`; as leituras ao vivo e Agir com o consumidor `mcp` respondem `NOT_GRANTED` | `mcp.test.ts` (o registro); `company-data-conformance.ts` (o `NOT_GRANTED`) | must |
| 23 | U6 | O `conexus-studio` não tem nome de tabela, URL do Hub, token nem caminho de máquina; o `.env.example` só tem `CONEXUS_MCP_URL` e `CONEXUS_MCP_TOKEN` | leitura do pull request; `git grep` no G3 | must |
| 24 | U6 | Com as duas variáveis, o Studio lista o Assistente com `conexus_data_describe` e `conexus_data_query`, vindas da porta; sem elas, o Assistente sobe sem ferramentas e diz que a porta não está configurada | `src/mastra/agents/assistant/assistant.test.ts` no `conexus-studio` | must |
| 25 | todas | O roteiro de uso, passos 1 a 5, no Hub publicado e no Studio local, com a resposta e a data no passo 3, a recusa no passo 4 e o app no ar no passo 5 | a conferência ao vivo do firstmate (delivery L17) e o uso do fundador | must |
| 26 | U7 | `publish` com o id de um Projeto da empresa e uma pasta válida, pela Dona, envia a versão (o Worker na Cloudflare, `uploadVersion`), a publica pela função do botão e responde o número e o endereço do app; a aba Versões a mostra publicada | `apps/server/src/harness/mcp/mcp.test.ts`, com o dublê da Cloudflare (`apps/server/src/platform/test-cloudflare.ts`) | must |
| 27 | U7 | Uma pessoa sem a ação `publishAppVersion` recebe `isError` com `NOT_IN_ROLE`, e nada é enviado nem publicado: a admissão vem antes do envio | `mcp.test.ts` | must |
| 28 | U7 | A mesma pasta mandada duas vezes, ou repetida pelo cliente depois de uma resposta perdida, gera uma versão só, e a segunda resposta é igual à primeira | `mcp.test.ts` | must |
| 29 | U7 | Um Projeto de outra empresa, apagado ou inexistente responde `NOT_FOUND`, igual nos três | `mcp.test.ts` | must |
| 30 | U7 | A Cloudflare fora ou recusando o Worker responde `APP_VERSION_FAILED`, o Worker enviado sai, e a versão publicada segue a de antes | `mcp.test.ts` | must |
| 31 | U7 | Uma pasta fora do `Manifest` ou de `APP_LIMITS` (`@conexus/app-contract`) responde a recusa com o motivo, sem enviar nada | `mcp.test.ts` | must |

## A matriz de estados

A tela da etapa é a do Mastra Studio, que o `conexus-studio` não desenha. No Hub, só o Registro de dados
ganha o nome "Agente de fora (MCP)" em quem leu (`apps/web/src/hub/data/text.ts:15`), com os estados de
hoje.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Catalog.tables[]` (`ref`, `area`, `label`, `system`, `columns`, `lastRun`) | U4, a fonte `lake` (U3) | `data_describe` (U4), o modelo pela porta (U5) |
| `Catalog.dialect` | U4 | `data_describe`; o modelo escreve o SQL nele |
| `ReadAnswer.ROWS.columns`, `rows`, `complete` | U3, pela U4 | `data_query`; o modelo |
| `ReadAnswer.ROWS.origin[]` | U4 (o banco do Hub) | `data_query`; o modelo diz a data |
| `ReadAnswer.QUERY_REFUSED.message` | U3 (o texto do Athena) | `data_query`; o modelo corrige o SQL |
| `DataReadAgent.MCP` no registro | U4 (a lista), U5 (quem grava) | a página Registro de dados (U4) |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `AssumeRole` do leitor, com as etiquetas | duas consultas da mesma empresa e papel usam a mesma sessão guardada; a segunda espera a primeira entrar | a STS recusa: `TABLE_UNAVAILABLE`, nada roda | STS fora: `TABLE_UNAVAILABLE` | o código da recusa, sem o ARN da sessão | 7, 10 |
| `StartQueryExecution` (plano e consulta; uma escrita mandada como SQL é recusada pela AWS, critério 10) | consultas independentes; a conta tem 20 ativas (`EST:132`): a 21ª vira `BUSY` | o sinal cancela depois do início: `StopQueryExecution`, `DEADLINE` | Athena fora: `TABLE_UNAVAILABLE` | o id da execução e o `ErrorType`, nunca o SQL nem o texto do erro (security S41) | 8, 9, 10 |
| `GetTables` do Glue | leituras, sem efeito | — | Glue fora: `CATALOG_UNAVAILABLE` | o código | 2, 11 |
| a linha do registro de dados (existente) | uma linha por leitura | — | banco fora: `TABLE_UNAVAILABLE`, como hoje (`recorded.ts:68`) | — | 14 |
| a sessão do Better Auth lida pelo token, que a renova (`updateAge`, `auth.ts:317-318`) | duas chamadas em paralelo renovam a mesma linha; a biblioteca grava a última, como numa aba com dois pedidos | — | banco fora: 503, como as rotas de sessão | o código | 18 |
| `publish`: o envio (`sendVersion`, `apps/server/src/hub/apps/send.ts:233`) e a publicação (`publishVersion`, `apps/server/src/hub/apps/live.ts:93-104`) | a chave da tentativa é `mcp:` mais o resumo da pasta, e o número repetido é recusado pela chave (`versions.ts:149-151`): a segunda chamada acha a versão e só publica | o envio que cai abandona a versão e tira o Worker (`send.ts:178-183`); a publicação é uma transação | Cloudflare fora: `APP_VERSION_FAILED`, sem mudar a versão publicada | `APP_VERSION_RECEIVED`, `APP_VERSION_PUBLISHED` | 26, 28, 30 |
| a migração do `CHECK` de `data_read.agent` | uma vez, pela ordem das migrações | a transação da migração volta inteira | banco fora: o Hub não sobe, como em toda migração | o nome da migração | 14a |

## A tabela de referência

Veredito pelo código C75. As linhas do estudo (`EST:117-137`) entram com a unidade; as linhas 20 a 26
são da porta e vêm do estudo Data & Context (`DC:101-110`) e dos estudos da Nekt e do Databricks.

| # | Peça | O que o fundador já decidiu | Hoje no `main` (`beea44cef`) | Referência (situação) | Veredito | Prova, se não for nativo | Unidade e arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | O Hub entra no leitor da empresa | 0078 | o leitor e a confiança prontos (`infra/aws/lib/lake.ts:115-179`); o Hub sem `sts:AssumeRole` nele (`infra/aws/lib/hub.ts:64-133`); o comentário "none does before step 3" (`lake.ts:110-114`) | STS com etiquetas, mesma, medido 33 de 33 (`EST:119`); SBT `token-vending-machine.js:58-66` | nativo | — | U2 `infra/aws/lib/hub.ts`; U3 `apps/server/src/platform/aws.ts` |
| 2 | Dono e Administrador leem toda tabela | b2; decisão 1 | nenhum | `CfnPrincipalPermissions` com `tableWildcard`, como o papel do tratamento (`treater.ts:138-139`), em uso desde a `T1`; um nome que apareceu depois do curinga foi lido na primeira consulta, 5 de 5, pelo papel que o criou (`LL:135,313-317`); Nekt e Databricks concedem no recipiente, que cobre o que nascer nele (`LL:237-238,274-277`) | nativo (decisão 1 (a)) | U1, critério 1: outro papel lê a tabela criada depois | U2 `infra/aws/lib/lake.ts` (o leitor de tudo) |
| 3 | A concessão por tabela e papel | 0078; b2 | nenhuma | LF com condição de etiqueta, medido 16 de 16 (`EST:120`) | nativo | — | fica de fora: Quem lê |
| 4 | Quem concede no Lake Formation | 0078 | só o papel de serviço do CloudFormation (`infra/aws/lib/platform.ts:229-237`) | `EST:122`; a concessão por atributo não se delega (`LL:157-163`) | embrulhado | — | fica de fora com a decisão 1 (a): quem concede por tabela é decidido na etapa Quem lê (`LL:206-214`) |
| 5 | A reconciliação das marcas | 0078 | nenhuma | Crossplane (`EST:123`) | embrulhado | — | fica de fora: Quem lê |
| 6 | O catálogo (Descrever) | dados.md, o catálogo montado de cada cópia; 1 B | `catalogOf` só com sistemas (`apps/server/src/hub/data/catalog.ts:7-19`); `lake_table` com nome, rótulo e colunas (`apps/server/src/hub/copies/tables.ts:137-175`) | Glue `GetTables` filtrado pelo Lake Formation, como o `information_schema` medido (`EST:126`, `fase1b:169`); Nekt `list_tables` (`TN:383`) | nativo | U1, critério 2 | U3 `platform/aws.ts`; U4 `apps/server/src/hub/data/lake-source.ts` |
| 7 | A consulta (Ler, `QUERY`) | 0079 | `ReadRequest.QUERY` com até 4.000 caracteres e nada que o sirva (`packages/hub-api/src/company-data.ts:40-52,150`) | Athena v3, plano e consulta em paralelo, medido (`EST:125`) | nativo | — | U3 `platform/aws.ts`; U4 `lake-source.ts` |
| 8 | A recusa igual | "1 B"; S10 | — | a tabela sem concessão e a inexistente dão `TABLE_NOT_FOUND`, medido (`EST:126`); Nekt "could also be a table this token cannot see" (`TN:385`) | nativo, mais o mapa de erros | U1, critério 1 (a bateria P4) | U3 `platform/aws.ts` |
| 9 | O dialeto e o nome a escrever | 0079 | "one PostgreSQL SELECT" (`apps/server/src/harness/tools/data/tools.ts:57-58`) | os 9 SQL do Postgres falham (`EST:127`); devolver o nome pronto para copiar (`NK/conexus-agente-ferramentas-de-dados-referencias/report.md:259-263`) | nativo | — | U4 |
| 10 | De quando é | a tela A e "copiado <quando>" (2026-11-16) | `lake_table.last_run_id` e `lake_run.ended_at`, `outcome` (`copies/tables.ts:70-78,148`); a rodada do tratamento (`apps/server/src/hub/treatment/tables.ts:92,135`) | nenhuma referência mostra pela porta (`TN:383`; `round3-databricks.md`) | embrulhado, já aprovado na etapa da origem | o precedente aprovado (L28 cumprido em 2026-11-16) | U4 `lake-source.ts` |
| 11 | As ferramentas | duas ferramentas (`EST:129`) | `dataTools({data})` (`tools.ts:79-98`) | Mastra `createTool`; o modelo `template-text-to-sql` (`EST:129`); Nekt `list_tables` e `execute_sql` (`NK/...referencias/report.md:122-129`) | nativo | — | U4 `tools.ts` |
| 12 | Code Mode | — | só nos agentes salvos | `EST:130` | nativo | — | fica de fora: o Studio não liga o Code Mode |
| 13 | Prazo, teto e custo | 1 GiB por consulta (`lake.ts:26,79`); o prazo de 5 s é decisão técnica (F12) | o teto de 1 MiB por resposta da AWS (`apps/server/src/platform/aws-session.ts:54`) | Athena pricing (`EST:131`) | nativo | — | U3 |
| 14 | A fila justa | dados.md | nenhuma | 20 consultas ativas por conta (`EST:132`) | nativo | — | fica de fora; a U3 só traduz o limite em `BUSY` |
| 15 | O reuso de resultado | — | — | "not supported for Lake Formation governed tables" (`EST:133`) | nativo | — | fica de fora: não existe para nós |
| 16 | Fontes, a linha recusada, Quem lê e Amostra | tela A; B1 | `apps/web/src/harness/room/sources.ts` | `EST:134-136` | nativo | — | fica de fora: nenhuma tela do Hub |
| 17 | O placar com modelo de verdade | C80, T30 | `apps/server/src/agents/assistant/assistant.scorecard.test.ts` | — | nativo | — | fica de fora: o modelo do Studio é a prova (critério 25) |
| 18 | As áreas lidas | decisão 2 | `lake.ts:53-68` cria as quatro | a camada como fronteira de permissão, na Nekt (`LL:234-252`); a bronze reservada a quem trata dado, no Databricks (`LL:258-262`) | nativo (decisão 2 (a)) | — | U2, U4 |
| 19 | O papel da pessoa no leitor | 0078: "a person's role" | `roleOf` lê o nome guardado em `member.role` (`apps/server/src/hub/identity/admission.ts:312-324`); `READS_ALL` (`packages/hub-api/src/roles.ts:8`) | — | nativo (o dono de hoje) | — | U3, U4 |
| 20 | A porta MCP | `D2` a | nenhuma | `MCPServer.startHTTP`, Streamable HTTP sem estado, com `req` e `res` do Node e o corpo em `req.body` (`@mastra/mcp@2.11.0 dist/index.js:25259-25277`; `dist/docs/references/reference-tools-mcp-server.md:397-446`); Nekt `mcp.nekt.com/mcp` (`NK/conexus-nekt-structure-study/notes/round3-nekt.md:52-53`); Databricks `/api/2.0/mcp/sql` (`round3-databricks.md:41-43`) | nativo | — | U5 `apps/server/src/harness/mcp/mcp.ts` |
| 21 | A porta no Fastify | — | `ConversationServer` do `@mastra/fastify` (`apps/server/src/harness/routes/stream.ts:163`) | `reply.hijack()` (`fastify@5.12.5 docs/Reference/Reply.md:637-645`); o exemplo do `startHTTP` num servidor Node (`reference-tools-mcp-server.md:427-443`) | nativo | — | U5 `mcp.ts` |
| 22 | O token da fase 1 | `D2` a: o token do Better Auth | Better Auth sem `bearer` (`apps/server/src/hub/identity/auth.ts:348-354`) | o plugin `bearer` com `requireSignature` (`better-auth@1.7.8 dist/plugins/bearer/index.mjs:28-36`); Nekt, o token de uma pessoa, com as permissões dela (`round2-n3-permissions.md:22`) | nativo | — | U5 `auth.ts`, `platform/access.ts` |
| 23 | Quem chama, dentro da ferramenta | o contrato "already bound to who asks and where" (`company-data.ts:8-14`) | o `CompanyData` montado por rodada (`apps/server/src/agents/assistant/assistant.ts:107`) | o que a rota põe em `req.auth` chega como `context.mcp.extra.authInfo` (`@modelcontextprotocol/node@2.1.2 dist/index.mjs:311`; `@mastra/mcp@2.11.0 dist/index.js:20114-20125`; `reference-tools-mcp-server.md:224-235,1070-1077`) | nativo | — | U5 `mcp.ts` |
| 24 | A recusa pela porta | — | `DataRefused` lançado (`tools.ts:14-28`) | o erro da ferramenta vira `isError: true`, com o texto do `MastraError` em JSON (`@mastra/mcp@2.11.0 dist/index.js:24338-24343`, o ajudante em `:25540-25547`) | nativo | — | U5 |
| 25 | O cliente no agente | `D1` a; `D2` a | nenhum | `MCPClient` com `requestInit.headers` (`@mastra/mcp@2.11.0 dist/client/types.d.ts:554,575-582`; `reference-tools-mcp-client.md:247`) | nativo | — | U6 `src/mastra/agents/assistant/conexus.ts` |
| 26 | A empresa da porta | a empresa nunca vem do agente (`DC:126-128`) | as rotas `/api/companies/{companyId}/...` (`packages/hub-api/src/data-reads.ts:100`) | Databricks, um caminho por recurso (`round3-databricks.md:41-43`) | nativo | — | U5 |
| 27 | A forma da consulta: SQL ou métrica tipada | 0078: "The agent writes free SQL, so the lake itself must refuse"; Q5 (a) da `T1`: a métrica é peça da Ontologia | `data_query` com um `SELECT` (`tools.ts:91-97`) | `template-genui-data-explorer` do Mastra em `949c592b`: a ferramenta `analyze` recebe uma métrica tipada, "Never submit SQL" (`src/mastra/agent.ts:42-44`), validada antes de abrir a fonte (`docs/architecture.md:51-58`), com 5 s, 1.000 linhas e 1 MiB (`:68-69`); as métricas são escritas à mão para um conjunto de dados só (`data-sources/sales/churn-metrics.ts`, `opportunity-metrics.ts`), e o template diz "No public deployment or multi-tenant isolation" (`:144`). Nekt `execute_sql` e o DBSQL MCP do Databricks recebem SQL (linha 20) | nativo (SQL, F10) | — | U4; a métrica tipada fica para a Ontologia |
| 28 | Publicar um app pelo agente | "Okay publicacao pelo hub"; "Publicar é do Conexus, ferramenta do agente e botão chamam a mesma função" | o botão chama a rota `publishAppVersion` (`PUT /api/companies/{companyId}/projects/{projectId}/published-version`, `packages/hub-api/src/apps.ts:226-230`), que chama `publishVersion` (`apps/server/src/hub/apps/live.ts:93-104`, por `app-versions.ts:60`); a versão chega à Cloudflare antes, por `sendVersion` (`send.ts:233`), que sobe o Worker com `uploadVersion` (`send.ts:96-111`), as marcas da empresa e do Projeto (0043) | o Hub de hoje | nativo | — | U7 `apps/server/src/harness/mcp/publish.ts` |
| 29 | Uma escrita como ferramenta MCP | `D2` a | nenhuma | a ferramenta do `MCPServer` é uma `createTool` com `execute` (`reference-tools-mcp-server.md:220-235`); o erro vira `isError` (linha 24) | nativo | — | U7 |

**A medida do transplante.** Nada vem do produto antigo. O caminho Postgres antigo (`f5225013^`) não
volta: o lago o substitui.

**A dívida.**

- O registro de uma consulta recusada segue sem tabelas
  (https://github.com/developmentconexus-ops/conexus/issues/1218): o plano também é recusado, e o nome
  pedido não pode ser gravado como tabela que existe.
- A sessão como token vence em 8 horas (S18); a fase 2 troca pelo OAuth.

## As decisões do firstmate

| # | Decisão reversível ([delivery L6](../guides/delivery.md)) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| F1 | A porta mora em `apps/server/src/harness/mcp/`, e não em `apps/server/src/hub/mcp/`, como o estudo escreveu (`DC:253`) | O `@mastra/*` só entra em `harness/` e `agents/` (`.dependency-cruiser.cjs:189-197`, W7, 0033), e o `hub/` não importa `harness/` (`:131-135`). A porta usa o `MCPServer`, então ela é do `harness`, e recebe o `CompanyData` injetado, como o Assistente (`main.ts:242`) | mudar a regra W7 por pull request de método, e mover a pasta |
| F2 | O catálogo das tabelas vem do Glue, na sessão do leitor de quem pergunta, e o banco do Hub só junta a origem | Um dono só para "quem lê o quê": o Lake Formation (C26). Montar a lista do banco do Hub repetiria a regra "Dono e Administrador leem tudo" num segundo lugar (L12, dois donos) | montar do banco do Hub quando Quem lê guardar as marcas |
| F3 | A etiqueta `conexus-leitor` leva o papel guardado em `member.role` (`owner`, `admin`, `developer`, `member` ou o da empresa) | É o que `roleOf` já lê (`admission.ts:312-324`); os dois papéis que leem tudo não têm linha em `auth.organization_role` (`apps/server/src/hub/identity/tables.ts:297`), então o id da 0078 não existe para eles. Nenhuma concessão por papel nasce nesta etapa | Quem lê troca pelo `RoleId` antes da primeira concessão |
| F4 | A empresa vai no caminho da porta, `/api/companies/<empresa>/mcp`, e o Hub confere que a pessoa do token é dela | Uma pessoa pode estar em mais de uma empresa; o caminho é o das rotas de hoje | a empresa ativa da sessão do Better Auth |
| F5 | O plugin `bearer` com `requireSignature: true`; um tipo de acesso novo, `mcp`, que lê só `Authorization`; todo outro tipo deixa de passar `Authorization` à leitura da sessão (`access.ts:145-152`), porque o plugin a vira cookie em qualquer `getSession` (`better-auth@1.7.8 dist/plugins/bearer/index.mjs:23-48`) | O token só vale na porta (critérios 19 e 20); a porta não lê cookie, então as conferências de origem do navegador (`access.ts:81,102`) não se aplicam a ela | tirar o plugin e ler a sessão pelo cookie |
| F6 | Plano e consulta em paralelo, sempre | É o que coube em 5 s (`EST:228`) | o plano depois da consulta |
| F7 | As instruções do Assistente dizem "não encontrei no que você pode ler" e, se a pessoa insistir, sugerem falar com quem administra o Conexus; nunca confirmam que a tabela existe | É o jeito da Nekt (`TN:385`) e a E3 (a) do estudo (`EST:76-80`); cumpre o "1 B" | a resposta vazia do Genie |
| F8 | A data é o fim da última rodada que escreveu a tabela, pelo banco do Hub | A manutenção do `S3 Tables` também faz commits no Iceberg (`EST:243-245`) | o `committed_at` do snapshot de `append` |
| F9 | As ferramentas seguem lançando `DataRefused`; pela porta, a recusa chega como `isError: true` | É a convenção do dono de hoje (`tools.ts:14-28`) e o que o `MCPServer` faz com um erro (linha 24) | devolver a recusa como resultado |
| F10 | O primeiro passo usa SQL (`data_query`), e não a métrica tipada do `template-genui-data-explorer` | Uma métrica tipada pede alguém que a escreva para cada tabela; o template tem um conjunto de dados fixo com as métricas escritas à mão (linha 27), e o Conexus lê qualquer tabela que qualquer conector copiou. Quem recusa aqui é o Lake Formation, e não o texto da ferramenta (0078), então o SQL livre não abre leitura nova. Os limites do template batem com os nossos: 5 s, 1 MiB, e 200 linhas contra 1.000. A métrica tipada é a peça da Ontologia (Q5 (a) da `T1`) e entra como terceira ferramenta na etapa do Negócio | trocar `data_query` pela métrica tipada quando a Ontologia tiver as métricas |
| F11 | O G1 é um pull request só dele, embora a delivery L9 peça o menor número de pull requests | A permissão nova do Hub na AWS é segurança, que o fundador guarda (delivery L6), e o estudo pediu a palavra de merge dele num pull request só dela (`EST:239-240`); lido sozinho, o diff da AWS fica do tamanho de uma revisão | juntar a U2 ao G2 |
| F12 | O prazo de uma consulta é 5 s, do pedido à resposta, num dono só na U3; cada chamada à AWS segue com o prazo de 3 s da porta de hoje (`aws-session.ts:47`), e a espera do `GetQueryExecution` é uma série de chamadas curtas dentro dos 5 s | É o que coube nas medidas do servidor, mediana de 2,1 a 3,8 s (`EST:125`), e o mesmo limite do `template-genui-data-explorer` (`docs/architecture.md:68`) | outro valor na constante |
| F13 | `publish` recebe o id do Projeto, o `manifest` e os arquivos em base64, na forma de `VersionFolder` (`apps/server/src/hub/apps/versions.ts:39`); o número é o seguinte ao maior do Projeto, e a chave da tentativa é `mcp:` mais o resumo da pasta (`receiveVersion`, `versions.ts:42`) | Reusa as duas funções sem mudar nenhuma; a chave pelo resumo faz a repetição não duplicar (critério 28); um Projeto que a porta criasse seria tela e regra novas | um `projects` para listar os Projetos, ou o envio e a publicação em duas ferramentas |

## U1 A prova no laboratório

**Base e modelo.** `beea44cef`. O firstmate, com Sonnet, na conta de laboratório, teto de US$ 1, só dado
gerado (decisão 3); papéis de prova criados para a prova e apagados no fim, como as provas da 0078.
Nenhuma linha de produto.

### As linhas da tabela

As linhas 2, 6 e 8. A U1 roda o que a pilha da U2 vai criar, em rascunho, contra um depósito de tabelas
da conta de laboratório.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/recordings/aws/` | Cria `assume-role-leitor-*.json`, `glue-get-tables-*.json`, `athena-*.json`, na forma que `awsRecording()` lê (`apps/server/src/platform/test-aws.ts:92`); os arquivos entram no commit da U3 | `apps/server/src/platform/aws.test.ts` (U3) |

### Os contratos que a unidade cria

Nenhum. As gravações seguem a testing T26 e a T29, com os valores inventados (security S40).

### As skills e a leitura

`aws-iam`, `aws-sdk-js-v3-usage`, `querying-data-lake`, `managing-data-asset-access`; as linhas
`aws-cdk-lib` e `@aws-sdk/credential-providers` do `docs/reference/stack.md`; o estudo, seção 4.3.

### A ordem do trabalho

1. **Uma pilha de laboratório com a receita da U2 em rascunho**: o leitor de tudo com `tableWildcard`
   em `current`, `tratado` e `negocio`, e o leitor por papel com `DESCRIBE` nas três áreas. Critério: 1.
2. **Tabelas criadas depois**: uma em cada área, criada pelo papel do tratamento depois da pilha.
   Critério: 1.
3. **A bateria P4** (`EST:262-277`) na sessão do leitor por papel com `member`, contra uma tabela
   existente e uma inexistente; as 18 consultas na sessão do leitor de tudo; e, nas duas sessões, um
   `INSERT`, um `DROP TABLE`, um `CREATE TABLE AS` e um `UNLOAD`, com o lago conferido depois.
   Critérios: 1, 10.
4. **O `GetTables` do Glue** em cada área, nas duas sessões. Critério: 2.
5. **Medir** o `AssumeRole`, o `GetTables` e a consulta com o plano em paralelo. Critério: 8.
6. **Gravar** as respostas da STS, do Glue e do Athena, com os valores trocados por inventados, e a STS
   recusando um leitor de tudo que não existe (o lago de receita anterior). Critérios: 6, 8, 10.

### Como se prova

O registro na pasta da tarefa do firstmate, com os comandos e as saídas; as gravações no repositório.

### Parar se

- O `tableWildcard` não cobre uma tabela de `tratado` criada pelo papel do tratamento: a U2 concede por
  área no Hub, e a decisão 1 volta ao fundador com a medida.
- Uma tabela de metadado do Iceberg (`"X$snapshots"`) fura o Lake Formation: a U3 recusa `$` no nome
  antes da AWS.
- O `GetTables` não filtra pelo Lake Formation: o catálogo usa `information_schema.tables` na sessão
  do leitor (F2), e a U3 muda o passo 3.
- O gasto passa de US$ 1.

## U2 Os dois leitores e a permissão do Hub

**Base e modelo.** O merge da `T1`. Sonnet: mudança de pilha com o padrão do papel do tratamento.

### As linhas da tabela

As linhas 1, 2, 18. Ler `infra/aws/lib/lake.ts:85-179` (as concessões e o leitor), `treater.ts:115-146`
(o padrão das concessões por área), `hub.ts:64-133` (`hubStatements`), `platform.ts:178-180` (os papéis
da empresa no papel de serviço) e `infra/aws/test/lake-reader.test.ts:66-80`, que já modela o passo.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `infra/aws/lib/lake.ts`, `names.ts`, `hub.ts`, `platform.ts` | Muda | `infra/aws/bin/`, os testes |
| `infra/aws/lake.template.json` | Muda (gerado) | `apps/server/src/platform/config-aws.ts` |
| `apps/server/src/platform/config-aws.ts` | Muda: o sha-256 anterior em `TREATABLE_BEFORE` (`:94`) | o Hub |
| `docs/decisions/0078-how-the-lake-knows-who-reads.md` | Muda: a emenda das duas formas de leitura | — |

### Os contratos que a unidade cria

- `READER_ALL_SUFFIX = '-tudo-leitor'` em `infra/aws/lib/names.ts`, para que o padrão
  `role/conexus-*-leitor` da política do Hub e do papel de serviço cubra os dois leitores.
- O leitor de tudo: confiança igual à do leitor por papel (`lake.ts:137-177`) mais
  `StringEquals aws:RequestTag/conexus-leitor` em `READS_ALL`; a mesma política em linha e o mesmo
  limite `conexus-limite`.
- No papel do Hub: `sts:AssumeRole` e `sts:TagSession` em `role/conexus-*-leitor`, e a chave
  `conexus-leitor` aceita no `TagSession` da sessão que entra no leitor.
- A lista `READS_ALL` tem um dono no servidor (`packages/hub-api/src/roles.ts:8`); a pilha guarda a
  cópia dela com o teste que compara as duas.

### As skills e a leitura

`aws-cdk`, `aws-iam`; as linhas `aws-cdk-lib`, `aws-cdk` e `constructs` do `docs/reference/stack.md`.

### A ordem do trabalho

1. **O leitor por papel ganha `DESCRIBE` em `tratado` e `negocio`.** Critério: 4.
   - **Arquivos:** muda `infra/aws/lib/lake.ts`.
   - **Referência a seguir:** as duas concessões de hoje (`lake.ts:88-101`).
   - **Testes:** `lake.test.ts`.
2. **O leitor de tudo.** Critérios: 3, 4.
   - **Arquivos:** muda `lake.ts`, `names.ts`.
   - **Referência a seguir:** `treater.ts:120-146`, `grant` por área com `tableWildcard`.
   - **Mutações à mão:** tirar `tratado` da lista; trocar `owner` por `member` na confiança.
3. **O Hub entra nos dois.** Critério: 5.
   - **Arquivos:** muda `hub.ts`; o comentário de `lake.ts:110-114` passa a dizer o que a política faz.
   - **Testes:** `lake-reader.test.ts:66`, o modelo do passo vira a política real.
4. **A receita nova.** Critério: 6. Gera `lake.template.json` e põe o sha-256 anterior em
   `TREATABLE_BEFORE`.
5. **A emenda da 0078** (decisão 1 (a), `LL:206-217`). A 0078 ganha este texto, com a data da decisão:

   > Amended 2026-11-27. Two ways to read. A role that reads a whole area (today Owner and Admin) reads
   > through a second reader role per company, granted every table of each read area by table wildcard
   > in the company's stack; a grant on the container covers the tables created in it later. A role
   > that reads marked tables reads through the tagged reader with a grant per table conditioned on the
   > session tag. Who makes those per-table grants is decided with the step that brings the first one.

   O plano B da 0078 ("one IAM role per reader") deixa de ser a saída geral: fica só para os papéis que
   leem uma área inteira, onde vira a regra.

### Como se prova

`npm run test -w infra/aws` e o `cdk synth` igual ao modelo guardado (`lake.test.ts:10`).

### Parar se

- Um teste da 0075 ou da 0078 muda de resultado além do critério 5.
- O papel de serviço não cria o leitor de tudo por causa do nome: voltar ao firstmate antes de mudar
  `platform.ts`.

## G1 O ponto de conferência

Os passos 6 e 7 de `conexus-build` com `npm run test -w infra/aws`, o `cdk synth`, e a remoção da linha
`sts:AssumeRole` deixando o critério 5 vermelho. Pull request só da U2, com a palavra de merge do
fundador.

## U3 O lago no adaptador da AWS

**Base e modelo.** O merge do G1. Sonnet.

### As linhas da tabela

As linhas 1, 6, 7, 8, 13, 14, 19. Ler `apps/server/src/platform/aws-session.ts:128-221` (a sessão do
Hub, `attemptsOf`, os prazos e o teto de 1 MiB) e `apps/server/src/platform/aws.ts`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/aws.ts`, `aws-session.ts`, `aws-names.ts`, `lake-areas.ts` | Muda | `apps/server/src/hub/data/` (U4) |
| `apps/server/src/platform/test-aws.ts`, `test-aws-server.ts`, `test-aws-wire.ts`, `test-aws-scripts.ts` | Muda: o dublê aprende as etiquetas da STS, o Glue e o Athena | `aws.test.ts` |
| `apps/server/src/platform/recordings/aws/` | Cria: as gravações da U1 | `test-aws.ts` |
| `.dependency-cruiser-adapters.cjs` | Muda: `client-glue` na regra `aws-sdk-only-in-the-aws-adapter` (`:40-47`) | `npm run deps` |
| `apps/server/package.json`, `package-lock.json` | Muda: `@aws-sdk/client-athena` e `@aws-sdk/client-glue` 3.1175.0 | — |
| `docs/reference/stack.md` | Muda: as duas linhas novas | `check-docs` |

### Os contratos que a unidade cria

Em `apps/server/src/platform/aws.ts`:

```ts
type LakeReader = Readonly<{ companyId: CompanyId; lakeId: LakeId; role: Role }>
type LakeTables = { kind: 'TABLES'; tables: LakeTableSeen[] } | { kind: 'UNAVAILABLE' }
type LakeTableSeen = Readonly<{ area: ReadArea; name: string; columns: { name: string; type: string }[] }>
type LakeQueryAnswer =
  | { kind: 'ROWS'; columns: string[]; rows: unknown[][]; complete: boolean; read: { area: ReadArea; name: string }[] }
  | { kind: 'NOT_FOUND' } | { kind: 'REFUSED'; message: string } | { kind: 'DEADLINE' }
  | { kind: 'BUSY' } | { kind: 'UNAVAILABLE' }
lakeTables(reader: LakeReader, signal: AbortSignal): Promise<LakeTables>
lakeQuery(reader: LakeReader, sql: string, signal: AbortSignal): Promise<LakeQueryAnswer>
```

`READ_AREAS = ['current', 'tratado', 'negocio'] as const` e `type ReadArea` entram em
`apps/server/src/platform/lake-areas.ts`, ao lado de `LakeArea` (`:7-9`), que tem também `raw`: um dono
só para as áreas que o agente lê. O leitor escolhido é `READS_ALL.includes(role)`. A saída do `EXPLAIN
(TYPE IO, FORMAT JSON)` é dado de fora: um esquema Zod `ExplainIo` nesse arquivo lê só as tabelas do
plano (`catalog`, `schema`, `table`), e uma saída que não passa vira `UNAVAILABLE` (code C27).

### As skills e a leitura

`aws-sdk-js-v3-usage`, `aws-iam`, `querying-data-lake`; as linhas `@aws-sdk/credential-providers` e
`@smithy/node-http-handler` do `docs/reference/stack.md`.

### A ordem do trabalho

1. **A sessão do leitor.** Critério: 7. Um segundo `fromTemporaryCredentials` sobre a sessão do Hub,
   como `aws-session.ts:156-165`, com `RoleArn` do leitor, `Tags` `conexus-empresa` e
   `conexus-leitor`, 900 s, guardado por `(empresa, papel)`.
2. **O catálogo.** Critério: 2. `GetTables` por área, com `CatalogId` `<conta>:s3tablescatalog/conexus-<lago>`.
3. **A consulta.** Critérios: 8, 9. `StartQueryExecution` da consulta e de `EXPLAIN (TYPE IO, FORMAT
   JSON)` em paralelo; `GetQueryExecution` até o fim ou o prazo (F12); `GetQueryResults` com
   `MaxResults` 201, para saber se cortou, e devolve 200; uma resposta que passa do teto de 1 MiB da
   porta (`aws-session.ts:54,65-75`) vira `REFUSED` com "resultado grande demais: peça menos colunas ou
   linhas", e não `UNAVAILABLE`; `StopQueryExecution` no prazo ou no sinal.
4. **O mapa de recusas.** Critérios: 6, 10. Lê `Status.AthenaError.ErrorType` e `StateChangeReason` de
   `GetQueryExecution` (`EST:166-167`): `TABLE_NOT_FOUND`, `SCHEMA_NOT_FOUND`, `CATALOG_NOT_FOUND` e
   "Insufficient Lake Formation permission(s)" viram `NOT_FOUND`; `TooManyRequestsException` vira
   `BUSY`; o resto do SQL vira `REFUSED` com a mensagem.
   - **Mutações à mão:** tirar `SCHEMA_NOT_FOUND` do mapa; a gravação da U1 do caso `raw.X` fica
     vermelha. Tirar o caso do papel inexistente; o critério 6 fica vermelho.

### Como se prova

`apps/server/src/platform/aws.test.ts` pelas gravações da U1, um caso por critério.

### Parar se

- Uma gravação da U1 mostra uma recusa de permissão fora do mapa: o caso entra no mapa com a gravação,
  sem casar texto novo.

## U4 A fonte `lake` do contrato

**Base e modelo.** O commit da U3. Opus: muda o contrato que a outra trilha lê (delivery L27).

### As linhas da tabela

As linhas 6, 7, 8, 9, 10, 11, 18, 19. Ler `packages/hub-api/src/company-data.ts` inteiro,
`company-data-conformance.ts:100-140`, `apps/server/src/hub/data/recorded.ts:33-109`,
`apps/server/src/hub/access/public.ts:37-60` e `apps/server/src/harness/tools/data/tools.ts`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/company-data.ts`, `company-data-conformance.ts`, `assistant.ts` | Muda | o servidor, a outra trilha |
| `apps/server/src/hub/data/` | Cria `lake-source.ts`; muda `recorded.ts`, `catalog.ts`, `deps.ts` | `main.ts`, os agentes |
| `apps/server/src/hub/access/model.ts`, `principal.ts` | Muda: o consumidor `mcp`, com o lugar da empresa e a escolha `ANY` | U5 |
| `packages/hub-api/src/data-reads.ts` | Muda: `MCP` em `DATA_READ_AGENTS` (`:12`) | o registro, a tela |
| `apps/server/src/hub/data/tables.ts`, `apps/server/migrations/<data>_data_read_mcp/` | Muda: o `CHECK` `data_read_agent` (`tables.ts:73`), por migração | o registro |
| `apps/web/src/hub/data/text.ts`, `read-detail.tsx` | Muda: `MCP: 'Agente de fora (MCP)'` em `AGENT_WORD` (`text.ts:15`) | a página Registro de dados |
| `apps/server/src/hub/copies/public.ts`, `apps/server/src/hub/treatment/public.ts` | Muda: a leitura da última rodada por nome de tabela, pela porta pública (C8) | `lake-source.ts` |
| `apps/server/src/harness/tools/data/tools.ts`, `order.ts` | Muda: o texto, o resultado `ROWS` | o Assistente, o Builder, a U5 |

### Os contratos que a unidade cria

Em `packages/hub-api/src/company-data.ts`:

```ts
const LastRun = z.discriminatedUnion('kind', [
  z.object({ kind: z.enum(['COMPLETE', 'ERROR', 'INTERRUPTED']), endedAt: z.iso.datetime() }),
  z.object({ kind: z.literal('NONE') }),
])
const CatalogTable = z.object({
  ref: z.string(), area: z.enum(LAKE_AREAS), label: z.string().nullable(), system: z.string().nullable(),
  columns: z.array(z.object({ name: z.string(), type: z.string() })), lastRun: LastRun,
})
// Catalog ganha: tables: CatalogTable[], dialect: z.literal('TRINO')
// ReadAnswer ganha:
//   { kind: 'ROWS', columns, rows, complete, origin: Pick<CatalogTable, 'ref' | 'label' | 'system' | 'lastRun'>[] }
//   { kind: 'QUERY_REFUSED', message: string }
// DataSources ganha:
//   tables(a: Signal): Promise<{ kind: 'TABLES'; tables: CatalogTable[] } | { kind: 'CATALOG_UNAVAILABLE' }>
//   query(a: Signal & { sql: string }): Promise<Extract<ReadAnswer, { kind: 'ROWS' | 'QUERY_REFUSED' | 'NOT_IN_CATALOG' | 'DEADLINE' | 'BUSY' | 'TABLE_UNAVAILABLE' }>>
```

O estado de cada resposta é uma união por `kind` (C21). `ref` é texto montado por quem lê o catálogo, e
nunca vem do modelo; a empresa e o lago vêm do `Principal` (C23). `READ_AREAS` e `READS_ALL` têm um dono
cada (C26). O arquivo modelo é `packages/hub-api/src/company-data.ts`: cumpre C21 e C26; os ids de
sistema seguem com as marcas de hoje (`ConnectionId`), então cumpre C23.

O `NOT_IN_CATALOG` da linha 150 sai: `TABLE` responde pela lista de `tables` (fora dela, `NOT_IN_CATALOG`;
dentro, as colunas), e `QUERY` vai à fonte. A lei 3 da conformidade ("recusa, sem chamar nada, a
tabela, a consulta", `company-data-conformance.ts:108`) passa a dizer "recusa a tabela fora do papel
igual à inexistente". `DataResult` (`assistant.ts:81-91`) ganha `tables` e `dialect`. O consumidor
`{ consumer: 'mcp'; companyId; personId }` entra em `ConsumerContext` (`hub/access/model.ts:25`), com o
lugar da empresa.

### As skills e a leitura

`mastra` (a skill do `node_modules/@mastra/core/dist/docs`), `pstack:typescript-best-practices`; as
linhas `@mastra/core` e `zod` do `docs/reference/stack.md`; o guia data.

### A ordem do trabalho

1. **O contrato e a conformidade.** Critérios: 11, 12, 13, 16. O dublê (`company-data-world.ts`) ganha
   duas tabelas, uma que Dono lê e uma que ninguém lê.
2. **A fonte `lake`.** Critérios: 11, 12. `lake-source.ts` lê a linha do lago da empresa
   (`apps/server/src/hub/lake/public.ts`), o papel pela prova de `admitMember` (como `access/public.ts:40-46`),
   chama a U3 e junta a origem por nome: `current` por `lake_table`, `tratado` e `negocio` pela rodada
   do tratamento.
3. **O registro.** Critérios: 14, 14a. `entryOf` (`recorded.ts:33`) grava as tabelas do plano no
   `ROWS`; `MCP` entra em `DATA_READ_AGENTS`, no `CHECK` por migração (`npm run migrations`) e no nome
   da tela.
4. **As ferramentas.** Critério: 15. O texto remete a `dialect` e a `ref` (C80); `data_query` devolve
   `ROWS` com a origem. `dataTools` passa a receber `data: (context) => CompanyData`, para a U5 usar a
   mesma definição.
   - **Mutações à mão:** devolver a lista sem filtro do Glue no dublê; o critério 13 fica vermelho.

### Como se prova

A conformidade no dublê e no banco real (`apps/server/src/hub/data/conformance.test.ts`), e
`tools.test.ts`.

### Parar se

- A outra trilha tem um consumidor de `Catalog` que quebra com o campo novo: abrir a issue `contrato`.

## U5 A porta MCP

**Base e modelo.** O commit da U4. Opus: segurança e uma rota fora do padrão de sessão.

### As linhas da tabela

As linhas 20 a 24, 26. Ler `apps/server/src/platform/access.ts:37-160`,
`apps/server/src/hub/identity/session.ts:15-34`, `auth.ts:295-364`, e no `@mastra/mcp` 2.11.0
`reference-tools-mcp-server.md:200-330,395-500,1060-1080`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/harness/mcp/` | Cria `mcp.ts`, `public.ts`, `mcp.test.ts` | `main.ts` |
| `packages/hub-api/src/operation.ts` | Muda: `mcp` em `AccessKind` (`:13`) | `access.ts`, `http.ts` |
| `apps/server/src/platform/access.ts`, `http.ts` | Muda: o tipo `mcp` em `AccessConfig` (`access.ts:9`) e `ALLOWED` (`:37`); a leitura sem `Authorization` para os outros tipos; o ramo de `http.ts:306` | todas as rotas |
| `apps/server/src/hub/identity/public.ts` | Muda: exporta a leitura da sessão por token e `admitMember` para a porta | `harness/mcp/` |
| `.dependency-cruiser.cjs` | Muda: `harness/mcp/` entra em `AGENTS_AND_APPS` (`:22`), para a porta chegar ao dado só pelo contrato | `npm run deps` |
| `apps/server/src/hub/identity/auth.ts`, `session.ts` | Muda: o plugin `bearer`; a leitura da sessão por token | `access.ts` |
| `apps/server/src/main.ts` | Muda: monta a porta com `createCompanyData` | — |
| `apps/server/package.json`, `package-lock.json`, `docs/reference/stack.md` | Muda: `@mastra/mcp` 2.11.0 | — |

### Os contratos que a unidade cria

- A rota `POST` e `GET` `/api/companies/:companyId/mcp`, acesso `mcp`: entrada, o corpo JSON-RPC do MCP
  `2026-07-28`; saídas, as do `MCPServer`; falhas, 401 sem token válido ou fora da empresa.
- `type McpCaller = Readonly<{ companyId: CompanyId; personId: PersonId }>`, posto em `req.auth.extra`
  pela rota depois de ler a sessão e conferir `admitMember`; a ferramenta lê de
  `context.mcp.extra.authInfo` e monta o `CompanyData` com o consumidor `mcp`.
- O `MCPServer` tem `data_describe` e `data_query`, da definição da U4, e a `publish` da U7.

### As skills e a leitura

`mastra` (o `node_modules/@mastra/mcp/dist/docs`), `better-auth-best-practices`,
`better-auth-security-best-practices`, `fastify-best-practices`; o guia security.

### A ordem do trabalho

1. **O token.** Critérios: 18, 19, 20. O plugin `bearer({ requireSignature: true })`; o tipo `mcp` em
   `ALLOWED` (`access.ts:37-45`) lê só `Authorization`, e todo outro tipo passa a ler a sessão sem ele
   (F5).
2. **A rota.** Critério: 17. Fastify com `reply.hijack()`, `request.raw.body = request.body`,
   `request.raw.auth = { token, clientId: personId, scopes: [], extra: caller }` (o `AuthInfo` pede
   `scopes`), e
   `server.startHTTP({ url, httpPath, req: request.raw, res: reply.raw })`.
3. **As ferramentas.** Critérios: 21, 22.
   - **Mutações à mão:** montar o `CompanyData` com a empresa da URL sem conferir a pessoa; o
     critério 18 fica vermelho.

### Como se prova

`mcp.test.ts` sobe o Hub de teste e fala com ele pelo `MCPClient` 2.11.0, pela porta pública (testing T5).

### Parar se

- A borda (`apps/edge`) corta a resposta em fluxo do MCP: voltar ao firstmate com a medida.
- O `startHTTP` não aceita o `req` do Fastify depois do `hijack`: o firstmate traz o caso ao fundador
  antes de qualquer adaptador próprio (delivery L28).

## U7 A publicação pela porta

**Base e modelo.** O commit da U5. Opus: uma escrita nova pela porta, que mexe na Cloudflare.

### As linhas da tabela

As linhas 28 e 29. Ler `apps/server/src/hub/apps/live.ts:56-104`, `send.ts:53-111,228-262`,
`versions.ts:39-60,113-190`, `app-versions.ts:25-70` e `packages/app-contract/src/manifest.ts`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/harness/mcp/` | Cria `publish.ts`; muda `mcp.ts`, `mcp.test.ts` | o `MCPServer` da U5 |
| `apps/server/src/hub/apps/public.ts` | Muda: exporta para a porta o envio e a publicação de hoje, sem mudar as duas funções | `harness/mcp/` |
| `apps/server/src/main.ts` | Muda: passa as versões dos apps à porta | — |

### Os contratos que a unidade cria

- A ferramenta `publish`: entrada `{ projectId: ProjectId; manifest: Manifest; files: VersionFileInput[] }`,
  validada pelo `Manifest` e por `APP_LIMITS` de `@conexus/app-contract`; saída
  `{ number: number; address: string }`, o endereço por `addressesOf`
  (`apps/server/src/hub/projects/hosts.ts:45`); falhas, as de `PreviewFailure` e de `publishVersion`
  (`NOT_FOUND`, `NOT_IN_ROLE`, `CONNECTOR_NOT_GRANTED`, `APP_VERSION_FAILED`), em `isError`.
- O teto do corpo da rota `/mcp` passa a caber uma pasta em `APP_LIMITS`, em base64.

### As skills e a leitura

`mastra` (o `node_modules/@mastra/mcp/dist/docs`), `cloudflare:workers-best-practices` só para ler o
dublê; o guia security.

### A ordem do trabalho

1. **A admissão antes de tudo.** Critério: 27. A ferramenta lê `admitPublisher` (`send.ts:73-75`) numa
   leitura, antes do envio.
2. **O envio e a publicação.** Critérios: 26, 28, 29, 30. `sendVersion` com o número seguinte e a chave
   `mcp:<resumo>`; depois `publishVersion` com o mesmo número. A chave repetida acha a versão guardada e
   só publica.
3. **A recusa da pasta.** Critério: 31.
   - **Mutações à mão:** chamar o envio antes da admissão; o critério 27 fica vermelho. Tirar a chave
     pelo resumo; o critério 28 fica vermelho.

### Como se prova

`mcp.test.ts` pelo `MCPClient`, com o dublê da Cloudflare e o banco real de teste.

### Parar se

- `sendVersion` pede algo que só a rodada do Construtor tem: voltar ao firstmate antes de mudar a função
  (F13).

## G2 O ponto de conferência

Os passos 6 e 7 de `conexus-build`: a conformidade no dublê e no banco, `mcp.test.ts`, `npm run check`,
`npm run deps`, e a remoção da conferência da empresa deixando o critério 18 vermelho. Depois do merge,
o firstmate publica pelo fluxo de hoje (0081) e confere a porta no ar com o token de teste.

## U6 O Assistente no `conexus-studio`

**Base e modelo.** O `main` do `conexus-studio` depois do pull request 1 dele. Sonnet.

### As linhas da tabela

As linhas 25 e 28. Ler no `@mastra/mcp` 2.11.0 `reference-tools-mcp-client.md:60-80,240-250,439-450`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `src/mastra/conexus.ts` | Cria: o único `MCPClient` | os dois agentes |
| `src/mastra/agents/assistant/` | Cria `index.ts`, `instructions.ts`, `memory.ts` | `src/mastra/index.ts` |
| `src/mastra/agents/publish-test/` | Cria `index.ts`, `example-app/`: o agente de teste que publica a pasta de exemplo | `src/mastra/index.ts` |
| `.env.example`, `package.json` | Muda | — |

### Os contratos que a unidade cria

`src/mastra/conexus.ts` é o único arquivo que sabe do Conexus: lê `CONEXUS_MCP_URL` e `CONEXUS_MCP_TOKEN` e monta o
`MCPClient` com `requestInit.headers.Authorization`. As instruções falam de "a empresa", acham a tabela
por `data_describe` antes de `data_query`, dizem a data da origem e seguem F7. O repositório é público:
nada de nome de tabela, URL, token ou caminho de máquina (critério 23).

### As skills e a leitura

`mastra` (o `node_modules/@mastra/core/dist/docs` e o `@mastra/mcp` 2.11.0).

### A ordem do trabalho

1. **O cliente.** Critério: 24.
2. **O agente e as instruções.** Critérios: 23, 24.
3. **O agente de teste da publicação.** Critério: 25 (passo 5). Só a ferramenta `conexus_publish`, e uma
   pasta de exemplo sem dado de empresa.

### Como se prova

`npm run dev`, o roteiro de uso; o teste do critério 24 com o cliente apontado para um servidor MCP de
teste.

### Parar se

- O pull request 1 do `conexus-studio` não entrou: a U6 espera.

## G3 O ponto de conferência

O teste do critério 24, o `git grep` do critério 23, e o roteiro de uso com o Hub no ar, passos 1 a 5
(critério 25).
