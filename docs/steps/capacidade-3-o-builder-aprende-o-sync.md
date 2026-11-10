# Capacidade 3: O Builder aprende o Sync

O roteiro diz: "**Capacidade 3. O Builder aprende o Sync.** Pede o acompanhamento de vendedor; o
gestor vê vendas, metas e clientes de todos. O Builder vê colunas e conteúdo copiados e roda as
leituras do app nos dados reais, vendo só contagens." Este cartão escreve o estudo da capacidade com
as correções do parecer de arquitetura de código, que vence onde corrige o estudo, e as palavras do
fundador de 2026-11-09 e 2026-11-10. A Capacidade 3 é construída sobre a 1 (o banco do app, pull
request 928) e a 2 (o Sync da empresa, cartão no pull request 932): o que este cartão cita delas são
os seus cartões, e o construtor de cada unidade reabre as linhas no `main` do dia. Cada linha do
`main` citada foi lida em `f24c3fcf`, com `@mastra/core` 1.82.0, `@neondatabase/serverless` 1.2.0,
`better-auth` 1.7.8, `zod` 4.6.5, `@tanstack/react-router` 1.170.44, `@tanstack/react-query` 5.104.0
e PostgreSQL 18.

Nenhuma peça desta capacidade fala de um sistema de origem pelo nome. O Builder investiga o sistema
com o que a conexão oferece; a proposta de cópia é a definição que a Capacidade 2 já guarda como dado
da empresa; só uma conexão cujo conector diz que sabe copiar recebe a ferramenta de propor.

## A página do fundador

**No fim desta capacidade** você pede ao Builder, num Projeto, o acompanhamento de vendedores, e ele
já sabe quais cópias da empresa o Projeto pode ler e as colunas de cada uma; olha umas poucas linhas
de exemplo; roda cada leitura do app nos dados reais vendo só quantas linhas voltaram; e, se falta um
dado, propõe a cópia que falta, que aparece na página **Cópias** para você ligar.

**O roteiro de uso.** Você é dono da empresa. Na página Cópias estão ligadas **vendas**,
**vendedores** e **clientes**, de um sistema da empresa que sabe copiar, e as três estão liberadas
ao Projeto novo "Vendedores", que ainda não tem app (isso é a Capacidade 2).

1. No Projeto "Vendedores", peça ao Builder: "quero acompanhar meus vendedores: vendas do mês, meta
   e clientes de cada um". Sem perguntar, ele já sabe que o Projeto lê as cópias `sync.vendas`,
   `sync.vendedores` e `sync.clientes`, e as colunas de cada uma com o tipo.
2. Ele olha o conteúdo: umas poucas linhas de exemplo de cada cópia (no máximo 20) e contagens,
   como "quantas vendas por tipo de operação este ano". No plano ele diz de onde vem cada número:
   "vendas e clientes vêm das cópias; a meta não existe no sistema de vocês, então o gestor digita a
   meta no app".
3. Enquanto constrói, ele roda cada leitura do app nos dados reais e vê só **quantas linhas**
   voltaram, as colunas e o tempo: "a lista de vendedores trouxe 38 linhas em 40 ms". Nunca as
   linhas. Na mensagem final ele diz quais leituras rodaram nos dados reais, e que as gravações não
   rodaram.
4. Se falta um dado (por exemplo, devoluções), o Builder investiga o sistema, escreve a cópia que
   faltaria, testa uma página contando, e avisa no chat. Na página **Cópias** aparece uma linha
   **Proposta**, com a consulta, a chave e quantas linhas a página de teste trouxe. Toque **Ligar**:
   escolha o intervalo, e a cópia começa a rodar, já liberada ao Projeto "Vendedores". **Dispensar**
   tira a proposta.
5. Entre como uma pessoa que é **Membro** da empresa e converse com o Builder no mesmo Projeto: ele
   ainda roda as leituras contando, mas não mostra linhas de exemplo, porque quem é membro não vê o
   banco do app.

**O que você faz, e quando.** Antes: nada além da Capacidade 2 no ar. No começo: aprova esta
página. Quando a lista de permissões do banco do Conexus ganhar a tabela das propostas: diz sim
nesse pull request, que vem sozinho ([data D11](../guides/data.md)). Antes da U4, se você a quiser:
autoriza a chamada paga que refaz o molde da máquina do Builder. No fim: faz o roteiro, diz o que
viu e aprova os textos das telas.

**Fica de fora.**

- **O vendedor vendo só o seu.** É a Capacidade 4.
- **Ligar uma cópia pelo chat.** O Builder roda sem pedir aprovação no meio da conversa (decisão
  0053), e a página Cópias já é o lugar de ligar.
- **O número de linhas e a hora da última rodada no começo da conversa.** Sua resposta abaixo.
- **Índices pedidos pelo Builder.** A conferência devolve o tempo de cada leitura; se uma leitura
  sobre uma cópia passar de 1 segundo no seu uso, abre-se o aviso, e o índice entra na definição da
  cópia depois.
- **Uma proposta de cópia de uma API** (por exemplo, o Mercado Livre). O Builder investiga a API
  com as leituras do conector, mas a ferramenta de propor só aparece numa conexão cujo conector sabe
  copiar; hoje o único é o Sankhya. A forma "leitura do conector com as suas páginas" entra na
  definição no dia em que um conector de API oferecer cópia, sem mudar o motor nem a proposta.
- **Os avisos guardados para um cartão** (`next-card`, 139 abertos em 2026-11-10): três tocam o
  assunto e esperam. A #814 (quem grava no caderno do Builder) não muda: a proposta não grava no
  caderno, e ligar é de dono, administrador e desenvolvedor. A #815 (a memória do app e o caderno)
  é de outro assunto. A #148 (o cache de instruções do provedor da assinatura) não muda o bloco de
  dados, que nasce estável de qualquer forma.

**As decisões suas nesta capacidade.** Todas já respondidas, e a página as escreve como você
decidiu:

- **O Builder propõe a cópia que falta (A1).** Em 2026-11-09, lembrando que o Sankhya é só o primeiro
  conector: "Ele investiga o sistema, né? Por exemplo, vamos supor que é um Mercado Livre. Concorda?
  Ele vai investigar o Mercado Livre". O desenho acima não tem nome de sistema em nenhuma peça.
- **Pergunta 1: o que o Builder sabe no começo de cada conversa.** Os nomes e as colunas com tipo
  das cópias liberadas ao Projeto, e só o nome das cópias da empresa que o Projeto ainda não liberou;
  sem número de linhas e sem hora da última rodada. A base: sem o nome o Builder nem sabe que a
  cópia existe, e as colunas são o que ele usa em toda leitura que escreve; o número de linhas muda
  a cada rodada, e um texto de instrução que muda faz o modelo reler a conversa inteira sem
  desconto, então ele conta quando precisa. Em 2026-11-10: "Pergunta 1, Okay".
- **Pergunta 2: no máximo 20 linhas de exemplo, e 16 KB.** O mesmo corte que o Builder já usa ao
  ler um sistema da empresa, pelo mesmo código: 20 linhas inteiras mostram a variação do dado real,
  e 16 KB ficam entre o teto de resposta de ferramenta do Mastra e o do Codex. Ele olha linhas para
  entender a forma do dado; para analisar, conta e agrupa. Em 2026-11-10: "Pergunta 2, Aprovado".
- **Ligar uma proposta libera a cópia ao Projeto que a pediu.** Sem isso o Builder ficaria sem ver
  a cópia até um segundo clique, em Integrações. Em 2026-11-10: "3. Sim".

Falta a sua palavra em duas coisas, cada uma no seu momento: a lista de permissões da tabela nova
das propostas (D11), e a chamada paga que refaz o molde da máquina do Builder, que só a U4 pede. A
U4 é a última e é opcional: sem ela, o banco já recusa a um app a cópia não liberada; ela só faz
publicar dizer antes qual cópia falta.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 Conferir e ver | O assunto `builder/app-data/` (com `agents/app-data.ts` movido para ele); `app_data_check` e `app_data_read` no Builder; a porta do Builder em `hub/apps` com a permissão conferida no Hub; a conferência em `hub/apps/app-check.ts`; os tipos das colunas na leitura de `platform/`; os nomes em `hub-api`; as linhas das ferramentas na conversa; o texto de conferir em `conexus-build` e `conexus-data` | `apps/server/src/builder/{app-data,agents,construtor,conversation}/`, `apps/server/src/hub/apps/`, `apps/server/src/platform/`, `apps/server/src/conversations-of.ts`, `packages/hub-api/src/`, `packages/app/skills/{conexus-build,conexus-data}/`, `apps/web/src/builder/conversation/`, `docs/explanation/builder-turn.md` | [data](../guides/data.md) | esta página aprovada; a Capacidade 1 no `main` (`viewAppData`, `readApp` com `SqlStatement`, `RowCount`) |
| U2 O Builder sabe das cópias | O bloco "## Data" das instruções; a vista das cópias "do Projeto" em `hub/copies`; liberar a um Projeto sem app cria o banco dele; a regra de qual fonte usar no prompt e em `conexus-data`; a descrição de `app_data_read` dos agentes | `apps/server/src/builder/{app-data,conversation}/`, `apps/server/src/hub/{copies,apps}/`, `apps/server/src/conversations-of.ts`, `apps/server/src/main.ts`, `packages/app/skills/conexus-data/`, `docs/reference/builder-prompt.md`, `docs/explanation/hub-apps.md` | [data](../guides/data.md) | U1; a Capacidade 2 no `main` |
| U3 Propor cópia | A tabela `copies.copy_proposal`; propor, ligar a partir da proposta (com a liberação ao Projeto) e dispensar; a prova de uma página pela porta do Builder; `copy_propose`; a linha **Proposta** na página Cópias | `apps/server/src/hub/{copies,connectors}/`, `apps/server/src/builder/connectors/`, `apps/server/migrations/`, `packages/hub-api/src/`, `apps/web/src/hub/copies/`, `apps/web/src/builder/conversation/` | [security](../guides/security.md) | U2; a lista de permissões da tabela nova, num pull request só dela (D11) |
| U4 O app declara as cópias (opcional) | `copies` no manifesto; `defineCopies`; a conferência leva a lista ao manifesto; publicar recusa a cópia não liberada com `COPY_NOT_RELEASED`; o texto da skill; o molde da máquina refeito | `packages/app-contract/src/`, `packages/app/src/`, `packages/app/skills/conexus-data/`, `apps/server/src/hub/{apps,copies}/`, `apps/server/src/main.ts`, `packages/hub-api/src/` | [code](../guides/code.md) apenas | U2; a palavra do fundador sobre a chamada paga do molde |

**A ordem.** U1, U2 e U3 vão num pull request de construção, um commit por unidade, nessa ordem,
como a Capacidade 1 fez (mudança de método anunciada pelo fundador em 2026-11-09); cada commit
termina verde sozinho. A U1 não precisa da Capacidade 2 e pode começar assim que a Capacidade 1
estiver no `main` ([delivery L1](../guides/delivery.md)); a U2 e a U3 esperam a Capacidade 2 no
`main`. A U4, se o fundador autorizar o molde, vem num pull request seu, depois. Nenhuma unidade corre
em paralelo com outra: cada uma lê o contrato da anterior.

**A lista de permissões, sozinha.** A migração da U3 (a tabela, a política por linha e as permissões
do login do Hub em `apps/server/database-grants.sql` e no `snapshot.json`) entra num pull request só
dela, antes do de construção, com a palavra do fundador ([data D11](../guides/data.md)), como a
Capacidade 2 faz com as suas três tabelas.

**Os trilhos.** Nenhuma unidade muda `packages/connectors/src/<provider>/` (o trilho do molde,
[delivery L27](../guides/delivery.md)) nem `apps/web/src/{brand,ui}/` (o trilho de desenho): o que
o Builder aprende sobre propor está na descrição de `copy_propose` e no prompt, que não nomeiam
sistema algum. Se uma unidade precisar mudar uma peça de `ui/`, para e espera a unidade de desenho.

**Orçamento de código alterado.** U1: ~700 linhas (o assunto movido ~40, a conferência ~180, a porta
do Builder e a admissão ~120, os tipos na leitura ~60, as ferramentas ~120, os nomes e as linhas da
conversa ~60, as skills e o documento ~40, as ligações ~80). U2: ~400 (o bloco ~90, a vista das cópias
~90, o banco ao liberar ~110, as ligações ~40, o prompt, a skill e os documentos ~70). U3: ~900 (a
tabela e o estado ~120, propor com a prova ~200, ligar a partir da proposta e dispensar ~200, o
contrato e as falhas ~120, `copy_propose` ~90, a linha Proposta e o diálogo ~170). U4: ~250. Total
da capacidade: ~2.250 linhas, abaixo do orçamento de [delivery L2](../guides/delivery.md).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `app_data_check` sobre uma leitura de uma tabela do app devolve `rows` `EXACT` com o número abaixo de 10.001, `OVER` a partir de 10.001, as colunas com o nome e o tipo (`integer`, `numeric`, `bigint`, `date`, `text`) e os milissegundos; nunca uma linha nem um valor de célula | `apps/server/src/builder/app-data/check.test.ts`, "conferir: conta, colunas e tempo" | must |
| 2 | U1 | A conferência liga os valores: `{ sql: '… where id = $1', values: [7] }` conta 1; uma leitura que termina em `-- comentário` conta certo; uma que já tem `order by … limit 5` conta 5; duas colunas de mesmo nome contam | `check.test.ts`, "conferir: valores, comentário, limite e nomes repetidos" | must |
| 3 | U1 | O texto que fecha o parêntese e emenda `union all select …` responde `CHECK_NOT_A_COUNT` e nenhum número; uma escrita responde `25006`; tabela que não existe, `42P01`; tabela sem `GRANT`, `42501`; `;` no fim, `42601`; passado o prazo de 5 s, `57014`; cada recusa leva a mensagem do PostgreSQL inteira ([code C79](../guides/code.md)) | `check.test.ts`, "conferir: o que não é contagem e as recusas do banco" | must |
| 4 | U1 | Uma leitura que não traz linha devolve `EXACT 0` e as colunas com o tipo | `check.test.ts`, "conferir: zero linhas mantém as colunas" | must |
| 5 | U1 | Num turno de dono, administrador ou desenvolvedor o Builder oferece `app_data_read` e `app_data_check`; num turno de membro oferece só `app_data_check`; a porta do Hub chamada como membro para ler linhas responde `NOT_FOUND`, igual a um Projeto que não existe (S10), e para conferir responde a contagem | `apps/server/src/builder/app-data/access.test.ts`, "quem vê linhas e quem só conta" | must |
| 6 | U1 | `app_data_read` do Builder corta em 20 linhas e 16 KB pelo mesmo `shaped` das leituras de conector; a ferramenta dos agentes continua com o mesmo id e o mesmo resultado; `apps/server/src/builder/agents/app-data.ts` não existe mais | `apps/server/src/builder/agents/app-data.test.ts`, os casos de hoje sem mudar; `access.test.ts`, "o Builder lê com o corte das leituras de conector"; `git ls-files` | must |
| 7 | U1 | Num Projeto sem banco, as duas ferramentas respondem `APP_DATA_NO_APP` | `access.test.ts`, "Projeto sem banco" | must |
| 8 | U1 | O registro de cada conferência leva só ids, o tipo da resposta e os milissegundos (`APP_DATA_CHECKED`), nunca o SQL, um valor ligado nem uma linha (S41) | `check.test.ts`, "o registro não leva dado" | must |
| 9 | U1 | Na conversa, `app_data_check` aparece como "Conferiu uma leitura do app" com a contagem e `app_data_read` como "Consultou os dados do app"; a recusa aparece como falha, e o detalhe abre os argumentos e o resultado | `apps/web/src/builder/conversation/app-data-specs.test.ts`, "as linhas de conferir e de ver" | must |
| 10 | U2 | As instruções do turno têm o bloco "## Data": cada cópia liberada ao Projeto como `sync.<nome>` com as colunas e o tipo de cada uma, e o nome de cada cópia da empresa não liberada; nenhum número de linhas nem hora | `apps/server/src/builder/app-data/context.test.ts`, "o bloco das cópias" | must |
| 11 | U2 | Duas montagens das instruções com uma rodada de cópia entre elas (as linhas e a última rodada mudaram) dão o mesmo texto; liberar outra cópia muda o bloco | `context.test.ts`, "o bloco não muda com a rodada" | must |
| 12 | U2 | Passados 8 KB, as cópias seguintes aparecem só pelo nome, com a frase de que `app_data_check` sobre `select * from sync.<nome>` devolve as colunas | `context.test.ts`, "o teto do bloco" | must |
| 13 | U2 | Com o banco do Hub falhando na vista das cópias, o turno começa e o bloco diz que as cópias não responderam agora (C22); nenhuma cópia liberada, nenhum bloco | `context.test.ts`, "as cópias não responderam" | must |
| 14 | U2 | Liberar uma cópia a um Projeto sem app cria o esquema e os logins do Projeto e dá o `GRANT`; em seguida `app_data_check` sobre `select * from sync.<nome>` conta, sem nenhuma versão enviada. Substitui o critério 20 da Capacidade 2 | `apps/server/src/hub/copies/grants.test.ts`, "liberar antes do app abre o banco do Projeto" | must |
| 15 | U2 | Um turno com o modelo dublê chama cada ferramenta que o turno oferece: o dono conta e lê `sync.vendas`; o membro conta, e `app_data_read` não está entre as ferramentas que o pedido ao modelo leva ([testing T24, T28](../guides/testing.md)) | `apps/server/src/builder/conversation/data-turn.test.ts`, "um turno lê e conta as cópias" | must |
| 16 | U2 | O agente do Projeto lê uma cópia liberada por `app_data_read` (`sync.<nome>`) e recebe `42501` numa cópia não liberada | `apps/server/src/builder/agents/app-data.test.ts`, "o agente lê a cópia liberada" | must |
| 17 | U3 | `copy_propose` existe no turno só quando uma conexão liberada ao Projeto é de um conector com `copy` e `readDoor`; num Projeto só com outra conexão, não existe | `apps/server/src/builder/connectors/copy-propose.test.ts`, "a ferramenta só onde se copia" | must |
| 18 | U3 | Propor roda uma página pela leitura de cópia do conector, grava a proposta `OPEN` com as linhas da página de teste e se havia mais, e devolve só esses dois números; nenhuma linha vai ao modelo nem à tabela; a chamada conta na conta de 50 da rodada | `apps/server/src/hub/copies/propose.test.ts`, "propor: prova uma página e guarda só a contagem" | must |
| 19 | U3 | Propor recusa: a definição que `CopyDefinition` recusa, com o caminho do erro; um nome que já é cópia da empresa (`EXISTS`, dizendo se está liberada ao Projeto) ou proposta aberta (`EXISTS`); a recusa do sistema, com a resposta dele inteira (C79); a pessoa cujo papel não usa a porta de leitura da conexão (`NOT_IN_ROLE`); a conexão não liberada (`NOT_GRANTED`); em nenhuma recusa algo é gravado | `propose.test.ts`, "propor: as recusas" | must |
| 20 | U3 | `listCopies` traz `proposals`: cada proposta aberta com a conexão, o nome, o rótulo, a consulta, a chave, a janela, as linhas da página de teste, quem propôs e o Projeto; dispensada ou ligada não aparece | `apps/server/src/hub/copies/routes.test.ts`, "a lista com as propostas" | must |
| 21 | U3 | `enableCopy` com `{ from: 'PROPOSAL' }` liga a cópia com a definição da proposta, igual byte a byte, marca a proposta `ACCEPTED` com a cópia, libera ao Projeto da proposta (`project_copy` e `GRANT`) e começa a primeira rodada; a mesma chave de tentativa repetida dá a mesma cópia | `apps/server/src/hub/copies/accept.test.ts`, "ligar a proposta libera ao Projeto" | must |
| 22 | U3 | Dois `enableCopy` da mesma proposta ao mesmo tempo, com chaves diferentes, dão uma cópia só; o outro responde 409 `COPY_PROPOSAL_DECIDED`; ligar uma proposta dispensada responde o mesmo ([code C65](../guides/code.md)) | `accept.test.ts`, "dois cliques em duas abas" | must |
| 23 | U3 | Ligar a proposta como desenvolvedor cujo papel não usa a porta de leitura da conexão responde 403 `NOT_IN_ROLE` com o nome da leitura; como membro, 404 `NOT_FOUND` (S10) | `accept.test.ts`, "quem liga precisa poder ler" | must |
| 24 | U3 | `dismissCopyProposal` marca `DISMISSED`; repetir responde 200 igual; numa ligada responde 409 `COPY_PROPOSAL_DECIDED` | `accept.test.ts`, "dispensar" | must |
| 25 | U3 | Apagar o Projeto ou a conexão de uma proposta apaga a proposta | `propose.test.ts`, "a proposta sai com o Projeto e com a conexão" | must |
| 26 | U3 | O registro de propor, ligar e dispensar leva só ids, as linhas da página de teste e o código (`COPY_PROPOSED`, `COPY_ENABLED` com a origem, `COPY_PROPOSAL_DISMISSED`), nunca a consulta nem uma linha (S41) | `propose.test.ts`, "o registro não leva dado" | must |
| 27 | U3 | A página Cópias mostra cada proposta numa linha com **Proposta** em palavras, o dado, a fonte, as linhas da página de teste e o Projeto, e **Ligar** e **Dispensar**; **Ligar** abre o diálogo com a consulta, a chave e o intervalo; dois cliques mandam um pedido só (W24); 409 mostra a frase; ligada, a linha vira a cópia com o Projeto na coluna Projetos | `apps/web/src/hub/copies/copy-proposal.test.tsx`, "a proposta: ligar e dispensar" | must |
| 28 | U3 | A 390 px a linha da proposta quebra como as das cópias, e a página não rola de lado (V18) | `copy-proposal.test.tsx`, "no celular"; captura de QA a 390 px | must |
| 29 | U3 | QA percorre o roteiro de uso nos dois temas, a 1366 e a 390 px, com o modelo dublê | relatório de QA ([testing T25](../guides/testing.md)) | should |
| 30 | U4 | `defineCopies(['vendas'])` em `shared/operations.ts` leva `copies: ['vendas']` ao manifesto pela conferência; um nome repetido ou fora de `CopyName` reprova a conferência; um manifesto sem `copies` continua válido | `packages/app/src/check/manifest.test.ts`, "as cópias que o app lê" | must |
| 31 | U4 | Publicar uma versão que declara uma cópia não liberada ao Projeto responde 409 `COPY_NOT_RELEASED` com o nome da cópia; liberada, publica | `apps/server/src/hub/apps/live.test.ts`, "publicar com cópia não liberada" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A linha de `app_data_check` na conversa | "Conferindo uma leitura do app" | não se aplica | O mesmo, com o indicador de ferramenta rodando | "Não conseguiu conferir a leitura"; o detalhe abre os argumentos e a recusa (SQLSTATE e mensagem) | não se aplica | Não acontece: todo o que conversa confere | `CHECK_NOT_A_COUNT` e `57014`: falha, com a recusa no detalhe |
| A linha de `app_data_read` do Builder | A linha de hoje dos agentes, "Consultando os dados do app" | Zero linhas: "Consultou os dados do app" e o detalhe com as colunas | O mesmo da primeira vez | A falha de hoje (`appDataRefusal`) | não se aplica | A ferramenta não está no turno do membro; o controlador recusa a chamada | A recusa do banco no detalhe |
| A linha de `copy_propose` | "Propondo uma cópia" | não se aplica | O mesmo | "Não conseguiu propor a cópia", o detalhe com a recusa do sistema ou o erro da definição | `NOT_GRANTED` como falha | `NOT_IN_ROLE` como falha, com o nome da leitura | `EXISTS` como falha, com a frase de pedir a liberação |
| Cópias, a linha **Proposta** (`…/copies`) | Uma proposta e nenhuma cópia: a lista com a linha, sem a frase de primeira vez | Sem proposta: a lista da Capacidade 2 | A lista inteira em esqueleto, como hoje | Falha de leitura da lista: a da Capacidade 2 | não se aplica | Membro: a página não aparece (Capacidade 2) | Ligada ou dispensada em outra aba: o clique recebe 409 `COPY_PROPOSAL_DECIDED`, a frase e a lista relida |
| Ligar a proposta (o diálogo) | A consulta em mono, a chave, a janela e o intervalo (30 minutos marcado) | não se aplica | O botão **Ligar** ocupado, um pedido só (W24) | 503 `COPY_DATABASE_UNAVAILABLE`: a frase e o botão de novo, com a mesma chave | Proposta que sumiu (Projeto ou conexão apagados): `NOT_FOUND` no diálogo | `NOT_IN_ROLE`: a frase com o nome da leitura | `COPY_PROPOSAL_DECIDED`: a frase, o diálogo fecha e a lista é relida |
| Dados de um Projeto com cópias liberadas e sem app (`…/data`, Capacidades 1 e 2) | Muda: o banco do Projeto já existe, então aparece **Cópias liberadas** com as cópias e **Tabelas do app** com a frase "O app ainda não criou tabelas." | O mesmo | Como na Capacidade 1 | Como na Capacidade 1 | Como na Capacidade 1 | Como na Capacidade 1 | não se aplica |

As frases entre aspas são a proposta do cartão; o fundador aprova os textos das telas no fim
([delivery L23](../guides/delivery.md)). O detalhe de cada linha de ferramenta abre os argumentos, o
resultado e a recusa, como toda linha `generic` ([screens](../../.agents/skills/conexus-scope/references/screens.md),
item 5): nenhuma célula declara "sem detalhe".

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `AppDataCheck` → `rows` (`RowCount`), `columns[]` (`name`, `type`), `ms` | U1, `hub/apps/app-check.ts` | U1, o modelo pela ferramenta; a linha da conversa (o número) |
| `BuilderDataAccess.viewRows` | U1, `hub/apps/builder-data.ts` por `allows(role, 'viewAppData')` | U1, `builder/conversation/builder.ts` (oferecer `app_data_read`) |
| `ProjectCopiesView` → `released[]` (`name`, `columns`), `unreleased[]` | U2, `hub/copies/project-view.ts`, das linhas `project_copy` e da definição | U2, `builder/app-data/context.ts` (o bloco) |
| `GrantedConnection.copies` | U3, `hub/connectors/builder-port.ts`, de `Connector.copy` e `Connector.readDoor` | U3, `builder/connectors/connector-tools.ts` (oferecer `copy_propose`) |
| `CopyProposalSummary` (`id`, `name`, `label`, `connection`, `project`, `shown`, `proved`, `proposedBy`) | U3, `hub/copies/store.ts` | U3, `apps/web/src/hub/copies/copy-proposal.tsx` |
| `EnableCopy.from` (`MODEL` ou `PROPOSAL`) | U3, o diálogo Ligar da Capacidade 2 (`MODEL`) e o da proposta (`PROPOSAL`) | U3, `hub/copies/enable.ts` |
| `Manifest.copies` | U4, a conferência do app | U4, `hub/apps/live.ts` ao publicar |

**O desenho de caixas.** O produto antigo não tinha Sync nem proposta (estudo da Capacidade 2,
`e0353c36`), então não há captura a seguir. A linha **Proposta** segue a linha de cópia da
Capacidade 2, com o estado em palavras (V35) e as duas ações à direita.

```
1280 px, …/copies
┌ ⌂ ─┬────────────────────┬──────────────────────────────────────────────────────────────────┐
│    │ Nova conversa      │ Cópias                                          [ Ligar uma cópia ] │
│    │                    │ Dado          Fonte     Estado      Última rodada  Linhas  Projetos  │
│    │                    │ devolucoes    ERP       Proposta    teste: 37 linhas       Vendedores│
│    │                    │   Proposta pelo Builder           [ Ligar ]  [ Dispensar ]          │
│    │                    │ vendas        ERP       Em dia      14:30, 12 s    118.402 Vendedores│
│    │                    │ vendedores    ERP       Em dia      14:30, 1 s          38 Vendedores│
└────┴────────────────────┴──────────────────────────────────────────────────────────────────┘

390 px, …/copies                         Ligar a proposta (diálogo)
┌──────────────────────────┐            ┌──────────────────────────────┐
│ ☰  Cópias  [Ligar]       │            │ Ligar a cópia devolucoes     │
│ devolucoes   Proposta    │            │ Consulta  select … (mono)    │
│ ERP · teste: 37          │            │ Chave     ID_DEVOLUCAO       │
│ Vendedores               │            │ Intervalo [ 30 minutos ▾ ]   │
│ [ Ligar ] [ Dispensar ]  │            │ Libera ao Projeto Vendedores │
│ vendas       Em dia      │            │        [ Cancelar ] [ Ligar ]│
└──────────────────────────┘            └──────────────────────────────┘
```

"ERP" no desenho é o nome que a empresa deu à conexão, um dado; nada da tela o escreve.

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Propor (`copy_propose`): a página de prova, depois a linha `copy_proposal` | O índice único parcial `(company_id, name) where state = 'OPEN'`: a segunda recebe `EXISTS`, sem segunda linha | A prova leu e a gravação falhou: nada fica, a ferramenta devolve `DATABASE_UNAVAILABLE`; nenhuma linha do sistema foi guardada em lugar algum | O sistema sem resposta ou recusando: a resposta dele inteira ao modelo, nada gravado; o banco do Hub: `DATABASE_UNAVAILABLE` | `COPY_PROPOSED` com ids e as linhas da prova; `BUILDER_READ_REFUSED` como hoje | 18, 19, 26 |
| Ligar a proposta (`enableCopy` `PROPOSAL`): na transação do Hub, a proposta travada (`FOR UPDATE`), a linha da cópia, a proposta `ACCEPTED` e o `project_copy`; depois os passos da Capacidade 2 e o `GRANT` | A trava da linha da proposta: a segunda vê `ACCEPTED` e responde `COPY_PROPOSAL_DECIDED`, ou, com a mesma chave, a mesma cópia | A transação do Hub é tudo ou nada (D22); os passos de fora retomam pela chave de tentativa, como na Capacidade 2; o `GRANT` é repetível | O banco da empresa ou o Neon: 503 `COPY_DATABASE_UNAVAILABLE`, a chave fica; o banco do Mastra: 503 `DATABASE_UNAVAILABLE` | `COPY_ENABLED` com a origem e ids; `COPY_ENABLE_FAILED` com o passo | 21, 22, 23, 27 |
| Dispensar (`dismissCopyProposal`) | `UPDATE … where state = 'OPEN'`: a segunda vê `DISMISSED` e responde 200 | Uma instrução só | O banco do Hub: 503 `DATABASE_UNAVAILABLE` | `COPY_PROPOSAL_DISMISSED` | 24 |
| Liberar a um Projeto sem app: o esquema e os logins do Projeto (`ensureApp`), `database_ready`, depois o `GRANT` | `ensureApp` é repetível (`missingLogins`, `42710` lido de novo); `database_ready` é `true` nas duas | Os logins feitos e a marca não gravada: a liberação seguinte refaz e marca; o `GRANT` é repetível | O dono não responde: 503 `COPY_DATABASE_UNAVAILABLE`, a linha `project_copy` fica e o botão continua **Liberar** (Capacidade 2) | `APP_DATABASE_READY`, `COPY_GRANTED` | 14 |
| `ensureReadLogin`, herdada, na primeira conferência de um app antigo sem login de leitura | Como na Capacidade 1 | Como na Capacidade 1 | `APP_DATA_UNAVAILABLE` ao modelo | Como na Capacidade 1 | 7 |
| Conferir e ver (`app_data_check`, `app_data_read`) | Só leitura, numa transação só de leitura | — | O banco do app sem resposta: `APP_DATA_UNAVAILABLE` ou `APP_DATA_TIMEOUT` ao modelo | `APP_DATA_CHECKED`, `APP_DATA_READ` | 1 a 8 |
| Publicar com `copies` (U4): nenhuma gravação nova, a recusa dentro da transação de publicar de hoje | Como hoje (`lockApp`) | A recusa antes de qualquer gravação | Como hoje | a falha `COPY_NOT_RELEASED` | 31 |

## A tabela de referência

A tabela do estudo, com as correções do parecer ("Muda" na coluna do veredito diz o que mudou) e as
linhas que o parecer acrescentou.

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O que o Builder sabe no começo: as cópias liberadas e as colunas | U2 | `apps/server/src/builder/conversation/prompt/prompt.ts:163-178` `connectionsContext` (só as ligações, com o caderno); `conversation/instructions.ts:36-51` (instruções como função do turno); `builder/controller-kit/instructions.ts:1-8` (cache de 1 hora) | `@mastra/core@1.82.0` `dist/docs/docs-guides-context-engineering.md:41,63` (nas instruções o que é estável; o que muda vai por ferramenta, senão perde o cache); `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/instructions.ts:9-95`; `conexus-os@e0353c36` `docs/research/mitra/influence-on-conexus.md:2142` ("tabelas-núcleo com colunas; demais só nomes") | Mastra e Mastra Code: só o estável no começo; Mitra: colunas das principais, as outras pelo nome | nativo: um bloco "## Data" ao lado de `connectionsContext`, pela mesma função do turno, com o teto de 8 KB de `cutToBytes` (`prompt.ts:82-87`). **Muda** do estudo: sem linhas e sem última rodada; as colunas vêm da definição da cópia (Capacidade 2), não do catálogo | | 2026-11-10: "Pergunta 1, Okay" | `apps/server/src/builder/app-data/context.ts`; `apps/server/src/hub/copies/project-view.ts` |
| As cópias da empresa que o Projeto não liberou | U2 | `prompt/builder.md:16` (sistema sem ligação: dizer que precisa ligar e liberar) | `conexus-os@e0353c36` `influence-on-conexus.md:1419` | O agente vê o que existe fora do projeto como contexto | nativo: só os nomes, da tabela `copy` da empresa; a frase de hoje vira "peça a liberação" | | 2026-11-10: "Pergunta 1, Okay" | (o mesmo) |
| Ver o conteúdo de uma cópia (linhas de exemplo) | U1 | `apps/server/src/builder/agents/app-data.ts:43-75` `app_data_read`, só dos agentes; `hub/connectors/cut.ts:3-8` (20 linhas, 16 KB, `MAX_TEXT` 600) | `conexus-os@e0353c36` `influence-on-conexus.md:2155` (`LIMIT 200` forçado); vibesdk `9da158d` `space/src/space/inspector-wrapper.ts:55-119` (só a pessoa vê) | Mitra dá ao agente SQL livre com teto; vibesdk não dá nada ao agente | nativo: a mesma `app_data_read`, com o mesmo id e o mesmo corte, dada ao Builder quando a pessoa tem `viewAppData`. **Muda** do estudo: uma ferramenta, não duas | | 2026-11-10: "Pergunta 2, Aprovado"; resposta 5 de 2026-11-09 (quem vê o banco do app) | `apps/server/src/builder/app-data/tools.ts` |
| Rodar a leitura do app nos dados reais, só contagens | U1 | nenhum: `packages/app/skills/conexus-build/SKILL.md:18` ("nothing here calls it … say it was not run") | PostgreSQL 18 (`count(*)` sobre subconsulta, `default_transaction_read_only`); `conexus-os@e0353c36` `influence-on-conexus.md:2778-2792` (testa em produção com a saída inteira) | Mitra roda as funções em produção vendo todas as linhas | embrulhado: `select count(*) from (select 1 from (\n<leitura>\n) leitura limit 10001) contada` e `select * from (\n<leitura>\n) leitura limit 0` na mesma transação só de leitura; a resposta conferida por Zod (uma linha, uma coluna, um inteiro). **Muda** do estudo: o fechamento numa linha nova e `select 1` | Parecer, PostgreSQL 18 local com login só de `SELECT`: a leitura com `-- comentário` quebrava o embrulho na mesma linha e conta `10001` com a linha nova; o escape com `union all` deu duas linhas (`1` e `11`), que a conferência Zod recusa; sem `GRANT`, `permission denied` | "roda as leituras do app nos dados reais, vendo só contagens", roteiro | `apps/server/src/hub/apps/app-check.ts`; `apps/server/src/builder/app-data/tools.ts` |
| Os tipos das colunas | U1 | `apps/server/src/platform/company-postgres.ts:86-98` (`fullResults`, só `name` dos `fields`, só `results[0]`) | `@neondatabase/serverless@1.2.0` `index.d.ts:419-426` (`FieldDef.dataTypeID`), `:1241-1250` (`types.builtins`); `pg-types` `lib/builtins.js:16,53` | O driver devolve o OID de cada coluna e exporta o mapa de OID para nome | nativo: a leitura devolve cada resultado com o OID das colunas; o nome sai de `types.builtins`, e um OID fora dele aparece como `oid <n>` | | não precisa | — |
| O que o modelo recebe de uma ferramenta | U1 | `builder/agents/app-data.ts:30-37` (corta antes de devolver) | `@mastra/core@1.82.0` `dist/docs/references/reference-tools-create-tool.md:71`, `dist/docs/docs-agents-tools.md:273,313` (`toModelOutput` guarda o resultado inteiro) | O `execute` é o que fica guardado | nativo: o `execute` devolve só a contagem; `toModelOutput` não entra | | não precisa | — |
| Quem pode o quê no Builder com dados | U1 | `hub/identity/admission.ts:83` `useConversations` (todo membro conversa); cartão da Capacidade 1, `viewAppData` | `better-auth@1.7.8` `createAccessControl` (uso em `hub/identity/roles.ts:67`) | O papel é a lista de permissões do plugin | nativo: ver linhas pede `viewAppData`, conferido na porta do Hub a cada chamada; contar pede `useConversations`. **Muda** do estudo: a recusa está na porta, esconder a ferramenta é cortesia | | resposta 5 de 2026-11-09 | `apps/server/src/hub/apps/builder-data.ts` |
| Escrever a leitura do app sobre uma cópia | U2 | `packages/app/skills/conexus-data/SKILL.md:31` ("do not prefix them with a schema name") | PostgreSQL 18, nome qualificado `esquema.tabela`; `ml-vigia@0c0749f1` `ARCHITECTURE.md:261` (a fonte por pergunta) | A fonte é escolhida por pergunta | nativo: `sync.<nome>`, a exceção na skill e a regra de quando ler a cópia ou o sistema ao vivo | Estudo, P1 local: uma leitura junta uma tabela do app sem esquema e uma cópia qualificada | não precisa | — |
| O banco do Projeto antes do primeiro app | U2 | `hub/apps/app-database.ts:107-123` `appDatabaseOf` (sem `database_ready`, nenhum banco); `:32-62` `openAppDatabase`; `hub/apps/send.ts:173-184` (a marca só no primeiro envio); cartão da Capacidade 2, critério 20 (o `GRANT` espera os logins) | `platform/company-postgres.ts` `ensureApp` (decisão 0043) | — | nativo: liberar chama `openAppDatabase` com `databaseReady: false` e grava `database_ready`, antes do `GRANT`. **Acrescentado** pelo parecer | | o roteiro (Projeto novo) | — |
| O app declara as cópias que lê; publicar recusa a não liberada | U4 | `packages/app-contract/src/manifest.ts:44-58` (`connectors`); `packages/app/src/connectors.ts`; `hub/apps/live.ts:59-71` (`ungranted`) | `conexus-os@e0353c36` `influence-on-conexus.md:2270` | Cada leitura é artefato nomeado | nativo: `copies` no manifesto e `defineCopies`, conferidos no mesmo publicar. **Muda** do estudo o peso: o banco já recusa; a declaração não protege a Prévia, e o molde da máquina precisa ser refeito (chamada paga) | | a chamada paga do molde, a pedir | `packages/app/src/copies.ts` |
| Propor a cópia que falta | U3 | `builder/connectors/connector-tools.ts:243-270` `connector_note_save` (roda a prova uma vez e guarda a contagem); `hub/connectors/builder-port.ts:113-120` `admit`, `:188-190` a conta de 50 | `conexus-os@e0353c36` `influence-on-conexus.md:969` (`DataLoader`); `nango@e6c6131` (catálogo que se copia, do parecer da Capacidade 2); `ml-vigia@0c0749f1` `app/consultor/consultas.py:1-6` (o agente propõe, a pessoa confirma na tela) | No Mitra o agente cria e liga; no ML-VIGIA o agente propõe e a pessoa confirma | embrulhado: a linha própria `copy_proposal` com a `CopyDefinition` da Capacidade 2, provada por uma página da leitura de cópia do conector; ligar é o `enableCopy` da Capacidade 2 com a origem `PROPOSAL`. **Muda** do estudo: tabela própria, não cópia "em estado proposta"; a prova pela leitura de cópia, não pela gravação do caderno | | 2026-11-09: "Ele investiga o sistema, né?"; 2026-11-10: "3. Sim" | `apps/server/src/hub/copies/propose.ts`, `accept.ts`; `apps/server/src/builder/connectors/copy-propose.ts`; `apps/web/src/hub/copies/copy-proposal.tsx` |
| Investigar o sistema antes de propor | fica de fora | `packages/connectors/src/sankhya/skill/SKILL.md:56-65` (investigar em etapas, medir com contagens, nunca as linhas) | `conexus-os@e0353c36` `docs/research/mitra/full-study.md:729-738` | A descoberta derrubou suposições | nativo: herdado, cada conector com a sua skill; fica de fora | | não precisa | — |
| Dizer o que rodou | U1 | `conexus-build/SKILL.md:18,49` | `conexus-os@e0353c36` `full-study.md:1187-1190` | Declara o que não conseguiu, com número | nativo: texto da skill: as leituras conferidas "rodaram nos dados reais", as gravações não | | não precisa | — |
| Ausência não é zero; corte não é total | U1 | cartão da Capacidade 1 (`EXACT`, `OVER`, `UNKNOWN`) | `ml-vigia@0c0749f1` `ARCHITECTURE.md:221,278` | Ausência não é zero; o lote cortado não é o total | nativo: o `RowCount` e o `ROW_COUNT_CAP` da Capacidade 1 | | não precisa | — |

**A medida do transplante.** Nenhuma peça vem do produto antigo: ele não tinha Sync nem leitura de
dado pelo Builder (estudo da Capacidade 2, `e0353c36`).

**A dívida.**

- "Só contagens" é higiene, não segredo contra o modelo: com `count(*) where valor > X` ele descobre
  qualquer número. A regra garante que nenhuma linha entra na conversa nem no que o Mastra guarda; a
  descrição da ferramenta e o comentário dizem só isso ([code C70](../guides/code.md)).
- Que o proxy HTTP do Neon devolve `fields` numa resposta sem linhas não foi medido; o teste usa o
  PostgreSQL local, e o primeiro turno real do Builder ([testing T14](../guides/testing.md)) mostra.
- A conta de 600 palavras-máquina para três cópias de 25 colunas é inferida; o primeiro turno real
  mostra o tamanho do bloco.

## U1 Conferir e ver

**Base e modelo.** O `main` com a Capacidade 1. Sonnet: liga camadas que existem, com os contratos
escritos abaixo.

### As linhas da tabela

- **Ver o conteúdo; o que o modelo recebe.** Ler `apps/server/src/builder/agents/app-data.ts`
  inteiro (o que se move), `agents/agent.ts:284` (onde se liga), `agents/public.ts`,
  `builder/construtor/app-tables.ts:3` (que importa a porta), `hub/connectors/cut.ts:1-12`
  (`shaped`). Referência: `@mastra/core@1.82.0` `dist/docs/docs-agents-tools.md:273,313`.
- **Rodar a leitura, só contagens; os tipos.** Ler `apps/server/src/platform/app-read.ts:22-27`
  (`AppReadAnswer`), `:108-143` (`readApp`), `platform/company-postgres.ts:69-108`
  (`neonTransport`), `platform/app-sql.ts:4` (`SqlStatement`), `hub/apps/app-database.ts:125-193`
  (`readAppData` e o registro). Referência: `@neondatabase/serverless@1.2.0` `index.d.ts:419-426`,
  `:1241-1250`.
- **Quem pode o quê.** Ler `hub/identity/admission.ts:59-118,139-144`, o `viewAppData` da
  Capacidade 1, `builder/conversation/builder.ts:30-60,103-116` (o `oncePerRun` das ligações e as
  ferramentas por turno), `conversation/permissions.ts:21-60`, `packages/hub-api/src/tools.ts:35-58`,
  `packages/hub-api/src/agents.ts:164`.
- **Dizer o que rodou.** `packages/app/skills/conexus-build/SKILL.md:14-21,49`,
  `packages/app/skills/conexus-data/SKILL.md:28-34`.
- **Na conversa.** `apps/web/src/builder/conversation/connector-specs.ts` (o modelo de linha),
  `construtor-specs.ts:200-212` (`AGENT_SPECS`, a linha de `app_data_read`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/app-data/` | Cria `port.ts`, `tools.ts`, `public.ts`, `check.test.ts`, `access.test.ts` | `builder/agents`, `builder/construtor`, `builder/conversation`, `conversations-of.ts` |
| `apps/server/src/builder/agents/` | Apaga `app-data.ts`; muda `agent.ts`, `public.ts` (importam de `builder/app-data/public.ts`) | — |
| `apps/server/src/builder/construtor/app-tables.ts` | Muda o import da porta | — |
| `apps/server/src/builder/conversation/{builder,permissions}.ts` | Muda (as duas ferramentas no turno e no conjunto fechado) | o controlador |
| `apps/server/src/hub/apps/` | Cria `app-check.ts`, `builder-data.ts`; muda `public.ts` (a porta `builderData`), `app-database.ts` (a leitura com várias instruções) | `conversations-of.ts` |
| `apps/server/src/platform/{app-read,company-postgres}.ts`, `test-company-postgres.ts` | Muda (cada resultado, com o OID das colunas) | `hub/apps` |
| `apps/server/src/conversations-of.ts` | Muda (liga `builderData`) | `main.ts` |
| `packages/hub-api/src/{tools,agents}.ts` | Muda (`APP_DATA_TOOL`, um dono dos dois nomes) | `apps/server`, `apps/web` |
| `packages/app/skills/{conexus-build,conexus-data}/SKILL.md` | Muda (conferir uma leitura; os tipos) | o Builder, pelo servidor |
| `apps/web/src/builder/conversation/` | Cria `app-data-specs.ts` e o teste; muda onde as linhas se juntam | a conversa |
| `docs/explanation/builder-turn.md` | Muda a tabela de ferramentas | — |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** `apps/server/src/builder/agents/app-data.ts` (vai para
`builder/app-data/`); `AGENT_TOOL.appDataRead` como dono do nome (passa a referir `APP_DATA_TOOL`);
"An operation: nothing here calls it" de `conexus-build/SKILL.md:18` para as leituras.

`packages/hub-api/src/tools.ts`:

```ts
/** The app-data tools, the Builder's and the agents' (one name per tool, code C26). */
export const APP_DATA_TOOL = { read: 'app_data_read', check: 'app_data_check' } as const
// BUILDER_TOOL gains appDataRead: APP_DATA_TOOL.read and appDataCheck: APP_DATA_TOOL.check
// AGENT_TOOL (agents.ts:164) becomes { appDataRead: APP_DATA_TOOL.read }
```

`apps/server/src/platform/app-read.ts`, `company-postgres.ts`:

```ts
/** One statement's answer: its columns with the type's OID, and its rows as arrays. */
export type ReadResult = { columns: { name: string; typeId: number }[]; rows: unknown[][] }
// CompanyPostgres.readApp takes readonly SqlStatement[] and answers { kind: 'READ'; results: ReadResult[] }
// readApp keeps answering the first result to its callers of today (Capacity 1's list, rows, agents)
```

`apps/server/src/hub/apps/app-check.ts` (camada de loja, [code C13](../guides/code.md)):

```ts
export type AppCheck =
  | { kind: 'COUNTED'; rows: RowCount; columns: { name: string; type: string }[]; ms: number }
  | { kind: 'REFUSED'; code: string; message: string } // the SQLSTATE and PostgreSQL's message
  | { kind: 'NOT_A_COUNT' } // the answer was not one row of one integer
  | { kind: 'FAILED'; code: 'APP_DATA_NO_APP' | 'APP_DATA_UNAVAILABLE' | 'APP_DATA_TIMEOUT' }

export function checkAppRead(deps: AppDatabaseDeps, input: AppReadInput & { statement: SqlStatement }): Promise<AppCheck>
```

`RowCount` e `ROW_COUNT_CAP` são os da Capacidade 1 (`packages/hub-api/src/app-data.ts`); `EXACT 0`
quando a contagem é zero, nunca `UNKNOWN` numa contagem que rodou.

`apps/server/src/hub/apps/builder-data.ts`, exposto em `createApps` como `builderData`:

```ts
type Ids = { companyId: CompanyId; projectId: ProjectId; personId: PersonId }
export type BuilderDataAccess = { kind: 'ADMITTED'; viewRows: boolean } | { kind: 'NOT_FOUND' }
export type BuilderData = {
  access(ids: Ids): Promise<BuilderDataAccess>                                       // useConversations
  read(ids: Ids, statement: SqlStatement, signal: AbortSignal): Promise<AppRead | { kind: 'REFUSED'; code: 'NOT_FOUND' }> // viewAppData
  check(ids: Ids, statement: SqlStatement, signal: AbortSignal): Promise<AppCheck | { kind: 'REFUSED'; code: 'NOT_FOUND' }> // useConversations
}
```

Cada chamada admite a pessoa numa leitura do Hub antes de tocar o banco do app (S7, S8, D22), como
as rotas da Capacidade 1; a recusa de admissão é `NOT_FOUND`, igual a um Projeto que não existe
(S10). A leitura dos agentes (`apps.readAppData`) fica como está.

`apps/server/src/builder/app-data/tools.ts`:

```ts
const AppDataCheckInput = z.object({
  sql: z.string().trim().min(1).max(4000),
  values: z.array(z.union([z.string().max(1000), z.number(), z.boolean(), z.null()])).max(20).default([]),
})
export function builderAppDataTools(deps: { data: BuilderData; ids: Ids; viewRows: boolean }): ToolsInput
// app_data_check always; app_data_read only when viewRows; the read cuts with `shaped` as today's agent tool
```

`builder/conversation/builder.ts`: `access` lido uma vez por rodada com `oncePerRun`, como
`granted` (`builder.ts:40-48`); `NOT_FOUND` não oferece nenhuma das duas. `permissions.ts`: as duas
em `READ`.

A forma de cada coisa:

- **Estados.** `AppCheck`, `BuilderDataAccess` e `RowCount` discriminam por `kind` (C21, C22).
- **Ids.** `CompanyId`, `ProjectId`, `PersonId` com marca, lidos do `requestContext` como hoje (C23).
- **Donos.** Os nomes em `APP_DATA_TOOL`; `ROW_COUNT_CAP` da Capacidade 1; o corte de `cut.ts`; o
  embrulho só em `app-check.ts` (C26).
- **Entrada externa.** A entrada da ferramenta pelo esquema acima; a resposta da contagem do banco
  por `z.tuple([z.tuple([z.coerce.number().int().min(0)])])` sobre as linhas, e nada mais (C27).
- **Modelo.** `hub/apps/app-versions.ts` `list` (admissão numa leitura do Hub, depois o trabalho)
  cumpre C21, C23 e C26. `builder/agents/app-data.ts` não é modelo de porta: sua porta não confere
  papel.

### As skills e a leitura

- `mastra` (`@mastra/core`, `apps/server/src/builder`): `createTool`, ferramentas por
  `requestContext`; ler primeiro `node_modules/@mastra/core/dist/docs/references/reference-tools-create-tool.md`.
- `neon:neon-postgres` (`@neondatabase/serverless`, `apps/server/src/platform`): `fullResults`,
  `fields`, `types`.
- `zod.dev/llms.txt` para `tuple` e `coerce` em Zod 4.

### A ordem do trabalho

1. **Mover.** `builder/agents/app-data.ts` para `builder/app-data/{port,tools,public}.ts`; os
   importadores passam a `builder/app-data/public.ts`. Os testes dos agentes passam sem mudar o que
   veem. Regras: C3, C4, C74.
2. **Os nomes.** `APP_DATA_TOOL` em `tools.ts`; `BUILDER_TOOL` e `AGENT_TOOL` o referem. Regras: C26,
   C69.
3. **A leitura com cada resultado.** `neonTransport` devolve cada resultado de `sql.transaction`
   com `fields[].dataTypeID`; o dublê `test-company-postgres.ts` também, pelo `pg`. Regras: D19.
4. **A conferência.** `app-check.ts`: as duas instruções numa transação só de leitura, os valores
   ligados nas duas (D20); a primeira conferida por Zod; os tipos por `types.builtins` invertido
   (`INT8` vira `bigint`, `NUMERIC` vira `numeric`, e assim por diante, em minúsculas); o tempo
   medido em volta da chamada. Uma recusa do banco vem com o SQLSTATE e a mensagem inteira (C79,
   C52). O registro `APP_DATA_CHECKED` com ids, `kind` e `ms`. O embrulho:

   ```sql
   select count(*) from (select 1 from (
   <leitura>
   ) leitura limit 10001) contada
   ```

5. **A porta do Builder.** `builder-data.ts` e a ligação em `public.ts` e `conversations-of.ts`.
   Regras: S7, S8, S10, D22, C57 (o prazo `APP_CALL_LIMITS.callDeadlineMs`).
6. **As ferramentas no turno.** `builder.ts` e `permissions.ts`. A descrição de `app_data_check` diz
   que roda o SQL e os valores de um caso real do handler, devolve só a contagem, as colunas com tipo
   e o tempo, e nunca uma linha; a de `app_data_read`, a de hoje.
7. **As skills.** `conexus-build`: uma leitura é provada com `app_data_check` sobre o mesmo texto e
   valores do handler, e a mensagem final diz quais leituras rodaram nos dados reais; uma gravação
   continua não rodada. `conexus-data`: `app_data_check` confirma os tipos (`bigint`, `count` e
   `numeric` chegam como texto).
8. **Na conversa.** `app-data-specs.ts`: a linha de `app_data_check` e a de `app_data_read` (a mesma
   dos agentes, importada de onde mora), `body: 'generic'`, `groups: true`.
9. **Documento.** `docs/explanation/builder-turn.md`: a tabela de ferramentas.

### Como se prova

- Critérios 1 a 4 e 8: `check.test.ts`, chamando a porta `builderData` do Hub de teste sobre
  `createCompanyDatabase` de `platform/test-company-postgres.ts`, com o app criado por `send` de
  `hub/apps/test-versions.ts`, como `builder/agents/app-data.test.ts:40-55` (T5). As migrações do
  teste criam uma tabela de 10.001 linhas, uma de colunas `integer`, `numeric`, `bigint`, `date` e
  `text`, e uma vazia. O prazo de 5 s com `pg_sleep(6)`.
- Critérios 5 a 7: `access.test.ts`, com os papéis por `test-may` e o turno montado pelo
  `builderAgent` de teste.
- Critério 9: `app-data-specs.test.ts`, como os testes de `connector-specs.ts`.
- O critério 1 falha hoje: não há `app_data_check`. O critério 6 falha hoje:
  `builder/agents/app-data.ts` existe.
- T26: a forma de `fields` do driver do Neon não é escrita à mão no teste; o dublê a tira do `pg`,
  que tem o mesmo `dataTypeID`. O proxy do Neon numa resposta vazia fica na dívida.
- Local: os testes tocados, `npm run typecheck`, `npm run lint`, `npm run docs`.

### Parar se

- O `sql.transaction` do driver instalado não devolver `fields` por resultado com `fullResults`:
  parar e dizer o que devolve; o tipo das colunas muda de fonte.
- A conferência com `pg_sleep(6)` não responder `57014` pelo login de leitura: parar; é premissa do
  estudo (o prazo do login).
- Um papel próprio da empresa receber `viewRows` verdadeiro: parar; contraria a resposta 5.

## U2 O Builder sabe das cópias

**Base e modelo.** O commit da U1, com a Capacidade 2 no `main`. Opus: atravessa `hub/copies`,
`hub/apps` e o Builder, e muda uma regra da Capacidade 2 (o banco ao liberar).

### As linhas da tabela

- **O que o Builder sabe no começo; as não liberadas.** Ler `prompt/prompt.ts:82-120` (`cutToBytes`
  e os tetos), `:163-178` (`connectionsContext`), `prompt/builder.md:16,66`,
  `conversation/instructions.ts:28-64`, `builder/controller-kit/instructions.ts:1-8`. Da Capacidade 2:
  `hub/copies/tables.ts` (`copy`, `project_copy`), `CopyDefinition` (`columns`), `hub/copies/public.ts`.
  Referência: `@mastra/core@1.82.0` `dist/docs/docs-guides-context-engineering.md:41,63`.
- **Escrever a leitura sobre uma cópia.** `packages/app/skills/conexus-data/SKILL.md:28-34`.
- **O banco do Projeto antes do primeiro app.** `hub/apps/app-database.ts:25-62,107-123`,
  `hub/apps/send.ts:160-185`, `platform/company-postgres.ts` `ensureApp`; da Capacidade 2,
  `hub/copies/grants.ts` e `applyGrants`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/copies/` | Cria `project-view.ts`; muda `grants.ts` (abre o banco do Projeto antes do `GRANT`), `public.ts` (a vista e a dependência de `hub/apps`), `grants.test.ts` (o critério 20 da Capacidade 2 vira o 14 deste) | `conversations-of.ts`, `main.ts` |
| `apps/server/src/hub/apps/` | Cria `ensureAppDatabase` em `app-database.ts`, exposta em `public.ts` | `hub/copies` (por dependência ligada em `main.ts`) |
| `apps/server/src/builder/app-data/` | Cria `context.ts`, `context.test.ts`; muda `port.ts` | `builder/conversation` |
| `apps/server/src/builder/conversation/` | Muda `instructions.ts`, `prompt/prompt.ts` (o lugar `{data}`), `prompt/builder.md`, `builder.ts`; cria `data-turn.test.ts` | o controlador |
| `apps/server/src/builder/agents/` | Muda a descrição de `app_data_read` em `builder/app-data/tools.ts`, que os agentes usam | — |
| `apps/server/src/{conversations-of,main}.ts` | Muda (liga a vista e `ensureAppDatabase`) | — |
| `packages/app/skills/conexus-data/SKILL.md` | Muda (as cópias por `sync.<nome>`; quando ler a cópia ou o sistema ao vivo) | o Builder |
| `docs/reference/builder-prompt.md`, `docs/explanation/hub-apps.md` | Muda (o bloco "## Data"; o banco ao liberar) | — |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** a frase "Tables live in this app's own schema: do not
prefix them with a schema name" sem exceção (`conexus-data/SKILL.md:31`); o comportamento do
critério 20 da Capacidade 2 (o `GRANT` esperando o primeiro envio) e o seu teste.

`apps/server/src/hub/copies/project-view.ts`, exposto em `createCopies` como `projectView`:

```ts
/** What a Projeto may read of the company's copies: the released ones with their columns, the others by name. */
export type ProjectCopiesView =
  | { kind: 'COPIES'; released: { name: CopyName; columns: { name: string; type: CopyColumnType }[] }[]; unreleased: CopyName[] }
  | { kind: 'FAILED' } // the Hub's database did not answer
export function projectView(input: { companyId: CompanyId; projectId: ProjectId }): Promise<ProjectCopiesView>
```

As colunas vêm da `CopyDefinition` guardada, parseada (C27), a dona das colunas da tabela que
`ensureCopyTable` cria (C26); nunca do banco da empresa, que o turno então não acorda (D27). Ordem
por nome. **Muda** do parecer, que lia as colunas pelo catálogo com o login de leitura: a definição
é a dona, e o bloco não pode falhar com o banco da empresa calado.

`apps/server/src/builder/app-data/context.ts`:

```ts
/** The "## Data" block (founder, 2026-11-10: "Pergunta 1, Okay"): stable between copy runs, so the instructions keep their cache. */
export function dataContext(view: ProjectCopiesView): string
```

Sem cópia liberada nem não liberada, `''`. `FAILED` vira uma linha: "The company's copies did not
answer now; do not assume there are none." Com cópias, `## Data`, uma linha de como ler
(`sync.<name>`, só leitura, `app_data_check` para contar, `app_data_read` para ver quando oferecida),
uma linha por cópia liberada com as colunas `nome tipo`, e a linha "Released to other Projects or not
yet released here: <nomes>. Ask the owner to release one; never propose a copy that exists." Teto de
8 KB por `cutToBytes`; passado, as cópias que faltam pelo nome, com a frase de que `app_data_check`
sobre `select * from sync.<nome>` devolve as colunas. A frase da fonte: lista e soma sobre muitas
linhas, a cópia; um registro que precisa ser de agora, a leitura ao vivo da conexão.

`builder/conversation/builder.ts`: `projectView` lido uma vez por rodada com `oncePerRun`, como
`granted`; `instructions.ts` passa `dataContext(view)` a `fillPrompt` no lugar `{data}`, depois de
`{connections}` (`builder.md:66`). `builder.md:16`: "Every value an app shows comes from what people
save in the app, from the company copies released to this Project, or from what the person tells
you in this chat."

`apps/server/src/hub/apps/app-database.ts`:

```ts
/** The Projeto's schema and logins before its first version, for a copy released to it: made once, marked ready. */
export function ensureAppDatabase(deps: AppDatabaseDeps, input: { scope: Scope; companyId: CompanyId; projectId: ProjectId }): Promise<{ kind: 'READY' } | { kind: 'FAILED' }>
```

Lê a linha `app` do Projeto; `database_ready` verdadeiro: `READY` sem tocar o Neon. Senão
`openAppDatabase` com `databaseReady: false` e, numa transação do Hub, a linha `app` do Projeto
criada se não existe e `database_ready = true`. `hub/copies/grants.ts` a chama antes do `GRANT`;
`FAILED` vira `COPY_DATABASE_UNAVAILABLE`, com a linha `project_copy` mantida (a tabela de falhas da
Capacidade 2).

A forma de cada coisa:

- **Estados.** `ProjectCopiesView` por `kind`; "nenhuma cópia" é `COPIES` com listas vazias, não
  falha (C22).
- **Ids.** `CopyName` com marca, da Capacidade 2.
- **Donos.** As colunas, da `CopyDefinition`; a liberação, de `project_copy`; o teto, de
  `prompt.ts` (C26).
- **Entrada externa.** A definição lida do banco do Hub passa pela `CopyDefinition` (C27).
- **Modelo.** `connectionsContext` (`prompt.ts:163-178`) cumpre C26 e serve de modelo do bloco.

### As skills e a leitura

- `mastra`: instruções por `requestContext` e o cache (`docs-guides-context-engineering.md`).
- `neon:neon-postgres`: só para `ensureApp`, que não muda.

### A ordem do trabalho

1. `ensureAppDatabase` e a chamada em `grants.ts`; o teste da Capacidade 2 "liberar antes do app"
   vira o critério 14. Regras: D22, C49.
2. `projectView` em `hub/copies`. Regras: C8 (as tabelas pelo dono), C27.
3. `dataContext` e o lugar `{data}`; `builder.md:16`. Regras: C26.
4. `builder.ts`: a vista com `oncePerRun`.
5. A descrição de `app_data_read`: as tabelas do app pelo nome, e as cópias liberadas por
   `sync.<nome>`.
6. `conexus-data`: a exceção das cópias e a regra da fonte.
7. Documentos: `builder-prompt.md`, `hub-apps.md`.

### Como se prova

- Critérios 10 a 13: `context.test.ts`, montando as instruções pela função do turno com o Hub de
  teste e cópias ligadas e liberadas pela porta de `hub/copies` (T5). O critério 11 muda `rows` e
  `last_run_id` da cópia por uma rodada do motor entre as duas montagens.
- Critério 14: `grants.test.ts`, num Projeto sem app.
- Critério 15: `data-turn.test.ts`, com o modelo dublê que chama cada ferramenta oferecida no turno,
  com argumentos tirados só da chamada (T24, T28).
- Critério 16: `builder/agents/app-data.test.ts`.
- O critério 14 falha hoje: o `GRANT` espera os logins (Capacidade 2, critério 20).
- Local: os testes tocados, `npm run typecheck`, `npm run lint`, `npm run docs`.

### Parar se

- Algum leitor tratar a linha `app` ou `database_ready` como "o Projeto tem uma versão" (a Prévia, a
  lista de Projetos, o Construtor): parar e dizer qual; criar a linha antes do primeiro envio
  mudaria o que a pessoa vê ali.
- A Capacidade 2 entrar no `main` com a liberação já abrindo o banco do Projeto: seguir o `main` e
  apagar o passo 1.
- A Capacidade 2 entrar sem as colunas na definição: parar; a fonte do bloco muda.

## U3 Propor cópia

**Base e modelo.** O commit da U2. Opus: a corrida de dois aceites e o desenho entre `hub/copies`,
`hub/connectors` e o Builder.

### As linhas da tabela

- **Propor.** Ler `builder/connectors/connector-tools.ts:243-270` (`connector_note_save`, o modelo de
  ferramenta que prova uma vez), `hub/connectors/builder-port.ts:24-30` (`GrantedConnection`),
  `:113-120` (`admit`), `:150-160` (o que vai a `granted`), `:184-192` (falante, conta de 50,
  `readThrough`), `hub/connectors/read.ts:139-206`, `hub/connectors/grants.ts:30-35` (a operação da
  porta de leitura), `hub/connectors/publish-check.ts:40-60` (`mayUseEach`). Da Capacidade 2:
  `kernel/copy.ts` (`ConnectorCopy`, `PageInput`, `CopyPage`), `hub/connectors/copy-port.ts`.
  Referência: `ml-vigia@0c0749f1` `app/consultor/consultas.py:1-6`.
- **Ligar a proposta; dispensar.** Da Capacidade 2: `hub/copies/enable.ts`, `grants.ts`,
  `packages/hub-api/src/copies.ts` (`EnableCopy`, `enableCopy`), `copy-failures.ts`. A decisão 0053.
- **A linha Proposta.** Da Capacidade 2: `apps/web/src/hub/copies/copy-list.tsx`, `new-copy.tsx`,
  `queries.ts`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/copies/` | Cria `propose.ts`, `accept.ts`, `propose.test.ts`, `accept.test.ts`; muda `tables.ts` (`copy_proposal`), `enable.ts` (a origem), `store.ts` (as propostas na lista), `routes.ts` (dispensar), `public.ts` | `hub/connectors` (pela porta `propose`), `main.ts` |
| `apps/server/src/hub/connectors/` | Muda `builder-port.ts` (`GrantedConnection.copies`, `provePage`, `propose`), `public.ts` | `builder/connectors`, `conversations-of.ts` |
| `apps/server/src/builder/connectors/` | Cria `copy-propose.ts`, `copy-propose.test.ts`; muda `connector-tools.ts` (oferece a ferramenta) | `builder/conversation` |
| `apps/server/src/builder/conversation/permissions.ts` | Muda (`copy_propose` em `READ`) | o controlador |
| `apps/server/migrations/`, `apps/server/database-grants.sql`, o `snapshot.json` | Cria a migração de `copy_proposal`; muda as permissões, num pull request só dele (D11) | `migrate`, `catalog.test.ts` |
| `packages/hub-api/src/{copies,copy-failures,tools}.ts` | Muda (`EnableCopy` com a origem, `CopyProposalSummary`, `dismissCopyProposal`, `COPY_PROPOSAL_DECIDED`, `BUILDER_TOOL.copyPropose`) | `apps/server`, `apps/web` |
| `apps/web/src/hub/copies/` | Cria `copy-proposal.tsx` e o teste; muda `copy-list.tsx`, `queries.ts` | a rota `…/copies` |
| `apps/web/src/builder/conversation/connector-specs.ts` | Muda (a linha de `copy_propose`) | a conversa |
| `docs/reference/screens.md` | Muda a linha da página Cópias | — |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** `EnableCopy` como objeto só de modelo (vira a união
abaixo, e o diálogo Ligar da Capacidade 2 manda `from: 'MODEL'`).

A tabela, em `hub/copies/tables.ts`, esquema `copies`, com a coluna de empresa e a política por linha
(decisão 0039):

| Coluna | Tipo e restrição |
| --- | --- |
| `id` | `uuid`, chave primária |
| `company_id` | → a empresa, em cascata |
| `connection_id` | → `connectors.connection`, em cascata |
| `project_id` | → o Projeto, em cascata |
| `name`, `label` | `text`; `name` é um `CopyName` |
| `definition` | `jsonb`, a `CopyDefinition` da Capacidade 2 |
| `proposed_by` | a pessoa |
| `proved_rows`, `proved_more` | `integer` entre 0 e o limite da página de prova; `boolean` |
| `proposed_at` | `timestamptz` |
| `state` | `text`, `OPEN`, `ACCEPTED` ou `DISMISSED` |
| `copy_id` | `uuid null` → `copies.copy`, `on delete set null` |
| `decided_by`, `decided_at` | nulos enquanto `OPEN` |

Restrições: `check ((state = 'OPEN') = (decided_by is null and decided_at is null))` e
`check (state = 'ACCEPTED' or copy_id is null)`; índice único parcial `(company_id, name) where
state = 'OPEN'`. A cópia apagada depois deixa a proposta `ACCEPTED` com
`copy_id` nulo, que ninguém lê (D15).

`packages/hub-api/src/copies.ts`:

```ts
export const CopyProposalId = z.uuid().brand<'CopyProposalId'>()
export const EnableCopy = z.discriminatedUnion('from', [
  z.object({ from: z.literal('MODEL'), connectionId: ConnectionId, model: z.string().max(40), interval: CopyInterval }),
  z.object({ from: z.literal('PROPOSAL'), proposalId: CopyProposalId, interval: CopyInterval }),
])
export const CopyProposalSummary = z.object({
  id: CopyProposalId,
  name: z.string(),
  label: z.string(),
  connection: z.object({ id: ConnectionId, name: z.string(), connector: ConnectorId }),
  project: z.object({ id: ProjectId, name: z.string() }),
  shown: CopySummary.shape.shown, // the query, the key, the window
  proved: z.object({ rows: z.int().min(0), more: z.boolean() }),
  proposedBy: z.object({ id: PersonId, name: z.string() }),
})
// listCopies answers { copies: CopySummary[]; proposals: CopyProposalSummary[] }
```

| Operação | Método e caminho | Entrada | Sucesso | Falhas além das da Capacidade 2 |
| --- | --- | --- | --- | --- |
| `enableCopy` | `POST /api/companies/{companyId}/copies` | `EnableCopy`, `attemptKey: true` | 201 `{ copy: CopySummary }` | `COPY_PROPOSAL_DECIDED`, `NOT_IN_ROLE` |
| `dismissCopyProposal` | `POST /api/companies/{companyId}/copy-proposals/{proposalId}/dismiss` | — | 200 `{}` | `COPY_PROPOSAL_DECIDED` |

`copy-failures.ts`: `COPY_PROPOSAL_DECIDED`, `USER`, `settles` sim, 409, "Esta proposta já foi
ligada ou dispensada.", "Veja a lista de cópias.", `NONE`. As duas rotas admitem `manageCopies`, com
trava; uma proposta de outra empresa é `NOT_FOUND` (S10).

`apps/server/src/hub/connectors/builder-port.ts`:

```ts
// GrantedConnection gains copies: boolean — the connector has `copy` and a `readDoor`
/** One page of the copy read, as the person may read the connection: the count, never a row. */
provePage(ids: OfProject, a: { connectionId: ConnectionId; personId: PersonId; runId: string; definition: CopyDefinition; signal: AbortSignal }): Promise<
  | { kind: 'PROVED'; rows: number; more: boolean }
  | BuilderReadRefusal // NOT_GRANTED, NOT_IN_ROLE, CALLS_SPENT, the source's refusal with its whole answer, as connector_read gets it
>
```

`provePage` admite como `admit` (a conexão liberada ao Projeto), confere por `mayUseEach` que o papel
da pessoa usa as operações de `Connector.readDoor` daquela conexão (a mesma conferência de
`connector_read`), gasta uma da conta de 50 (`spend`), e chama `readThrough` com a leitura de
`Connector.copy`, `PageInput` `{ definition, after: null, since: '1900-01-01', windowFrom: <hoje − a
janela, ou null>, limit: 50 }`, `by: 'builder'` e o falante `{ kind: 'VERSION', declared: [{
connectionId, operation: copy.read.id }] }`, porque a leitura da cópia fica fora dos papéis
(Capacidade 2). A recusa do sistema volta inteira, como em `connector_read` (C79). As linhas da
página nunca saem da função.

`apps/server/src/hub/copies/propose.ts`:

```ts
export type ProposeAnswer =
  | { kind: 'PROPOSED'; name: CopyName; rows: number; more: boolean }
  | { kind: 'EXISTS'; name: CopyName; releasedHere: boolean } // a copy or an open proposal of that name
  | { kind: 'MALFORMED'; issues: string[] }                   // CopyDefinition's paths and messages
  | Exclude<Awaited<ReturnType<BuilderConnectors['provePage']>>, { kind: 'PROVED' }>
export function propose(deps: CopiesDeps, input: { ids: OfProject; personId: PersonId; runId: string; connectionId: ConnectionId; name: string; label: string; definition: unknown; signal: AbortSignal }): Promise<ProposeAnswer>
```

Ordem: a definição pela `CopyDefinition` e o nome pelo `CopyName`; o nome contra `copy` e as
propostas abertas da empresa; `provePage`; a linha, que o índice parcial protege. `hub/connectors`
recebe `propose` por dependência ligada em `main.ts` e a entrega ao Builder em
`BuilderConnectors.propose`; o Builder não importa `hub/copies` (C4).

`apps/server/src/hub/copies/accept.ts`, chamado por `enable.ts` quando `from` é `PROPOSAL`: na
transação do Hub com a admissão `manageCopies`, a proposta `FOR UPDATE` (não `OPEN`:
`COPY_PROPOSAL_DECIDED`, a não ser a mesma chave de tentativa, que devolve a mesma cópia), o papel de
quem liga sobre as operações de `Connector.readDoor` da conexão por `mayUseEach` (recusa:
`NOT_IN_ROLE` com o nome da leitura), a linha `copy` com a definição da proposta, a proposta
`ACCEPTED` com `copy_id`, `decided_by` e `decided_at`, e a linha `project_copy` do Projeto da
proposta. Depois, fora da transação (D22), os passos de ligar da Capacidade 2 e o `GRANT` (com
`ensureAppDatabase` da U2). O registro `COPY_ENABLED` com `from`.

`apps/server/src/builder/connectors/copy-propose.ts`: `copy_propose`, oferecida só quando alguma
conexão de `granted` tem `copies`, com a entrada `{ connection, connector, name, label, definition }`
(`definition` como `z.unknown()` na ferramenta; o Hub parseia, para a mensagem do erro voltar ao
modelo). A descrição diz: investigue o sistema da conexão com `connector_read` antes; a proposta roda
uma página de prova e guarda só a contagem; uma pessoa liga na página Cópias; diga à pessoa que a
proposta está lá e siga com o que não depende dela.

A forma de cada coisa:

- **Estados.** O ciclo `OPEN` → `ACCEPTED` ou `DISMISSED` tem um dono, `hub/copies` (`propose.ts`
  cria, `accept.ts` e a rota de dispensar decidem), e a coluna `state` com as restrições (C21);
  `ProposeAnswer` e `EnableCopy` por `kind` e `from` (C22).
- **Ids.** `CopyProposalId` com marca, conferido pela entrada do contrato e pela linha da empresa
  (C23); `CopyName` da Capacidade 2.
- **Donos.** A forma da definição, de `CopyDefinition`; ligar, de `enable.ts` (um caminho para o
  modelo e para a proposta); o falante da leitura de cópia, de `hub/connectors` (C26).
- **Entrada externa.** A entrada da ferramenta e a definição pela `CopyDefinition` no Hub (C27).
- **Modelo.** `hub/copies/enable.ts` da Capacidade 2 (C21, C23, C26 pelo cartão dela).

### As skills e a leitura

- `mastra`: `createTool`.
- `organization-best-practices` (`better-auth`): `mayUseEach` não muda; só a leitura.
- `shadcn`: linha de lista, botões e diálogo.
- `router-core`: nada novo (a rota `…/copies` é da Capacidade 2).

### A ordem do trabalho

1. A migração de `copy_proposal` e as permissões, no pull request da D11. Regras: D4, D6, D10, D11,
   D15.
2. `propose.ts` e `provePage`. Regras: S2, S7, C79, D20, D22.
3. `EnableCopy` com a origem, `accept.ts`, dispensar e as falhas. Regras: C37, C48, C65, S8.
4. `copy_propose` no Builder e em `permissions.ts`; a linha da conversa.
5. A linha **Proposta** e o diálogo em `copy-proposal.tsx`, com `hubMutation` em `queries.ts`.
   Regras: W10, W12, W24, V29, V35.
6. `docs/reference/screens.md`.

### Como se prova

- Critérios 17 a 19, 25 e 26: `copy-propose.test.ts` e `propose.test.ts`, pelo turno de teste do
  Builder e pela porta do Hub, com o dublê do conector que tem `copy` (T29) e um conector de teste
  sem `copy`.
- Critérios 20 a 24: `routes.test.ts` e `accept.test.ts`, pela porta HTTP do Hub de teste (T5). O
  critério 22 dispara os dois pedidos juntos e espera os dois (C65).
- Critérios 27 e 28: `copy-proposal.test.tsx`, pelo roteador de teste da web com o Hub dublê.
- Critério 29: QA ([testing T25](../guides/testing.md)).
- Local: os testes tocados, `npm run typecheck`, `npm run lint`, `npm run docs`.

### Parar se

- A Capacidade 2 entrar com a leitura de cópia dentro dos papéis: trocar a conferência da porta de
  leitura por `mayUseEach` sobre a leitura de cópia, e dizer no relatório.
- O dublê do conector não tiver a leitura de cópia gravada: parar; T29 pede a gravação do serviço
  real, que é chamada a um serviço de fora.
- `enableCopy` da Capacidade 2 não aceitar a origem sem mudar a chave de tentativa (`body_hash`):
  parar e dizer.

## U4 O app declara as cópias (opcional)

**Base e modelo.** O commit da U2 no `main`, e a palavra do fundador sobre a chamada paga do molde.
Sonnet.

### As linhas da tabela

- `packages/app-contract/src/manifest.ts:44-58` (`connectors`, opcional para manifestos antigos);
  `packages/app/src/connectors.ts` (`defineConnectors`, `Declared`); `packages/app/src/check/manifest.ts:52-58,75,159-171`;
  `hub/apps/live.ts:55-71` (`ungranted`), `main.ts:170-174`; `docs/explanation/app-package.md:43-47,73-84`
  (as skills vêm do servidor; o pacote vem do molde da máquina).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/app-contract/src/manifest.ts` | Muda (`copies`) | `packages/app`, `apps/server` |
| `packages/app/src/` | Cria `copies.ts` (`defineCopies`); muda `check/manifest.ts`, o índice | os apps gerados |
| `packages/app/skills/conexus-data/SKILL.md` | Muda (declarar as cópias) | o Builder |
| `apps/server/src/hub/{apps,copies}/`, `main.ts` | Muda `live.ts` (`unreleasedCopies`); cria `unreleasedCopies` em `hub/copies` | `main.ts` |
| `packages/hub-api/src/copy-failures.ts` | Muda (`COPY_NOT_RELEASED`) | `apps/server`, `apps/web` |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** nada.

`manifest.ts`: `copies: z.array(CopyName).max(50).refine(unique).optional()`. `packages/app`:
`defineCopies(names: readonly string[])`, separado de `defineConnectors`, porque `Declared` é tipado
pelas leituras do kit e uma cópia é dado da empresa. `hub/copies`: `unreleasedCopies(tx, ids,
declared): Promise<CopyName[]>`; `live.ts` a chama ao lado de `ungranted` e recusa com
`COPY_NOT_RELEASED` (`USER`, 409, "Este app lê uma cópia que o Projeto não liberou: {copy}.",
"Libere a cópia em Integrações do Projeto.", `NONE`) e `named: { copy }` (C48).

### A ordem do trabalho

1. O manifesto e `defineCopies`; a conferência leva a lista.
2. `unreleasedCopies` e a recusa em `live.ts`.
3. A skill.
4. O molde da máquina, refeito só com a autorização da chamada paga, por quem a recebeu.

### Como se prova

- Critério 30: `packages/app/src/check/manifest.test.ts`.
- Critério 31: `apps/server/src/hub/apps/live.test.ts`, pela porta HTTP do Hub de teste.
- O molde: o primeiro turno real depois dele mostra `defineCopies` na máquina (T14).

### Parar se

- A autorização do molde não vier: a unidade não começa, e o cartão fecha sem ela.
