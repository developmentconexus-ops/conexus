# Documento de requisitos: parte 1, o dado guardado e o catálogo

## Introdução

No fim desta parte, quem administra a empresa abre **Dados** no trilho e vê cada tabela copiada, agrupada pelo sistema de onde veio, com a descrição da tabela, o que cada coluna guarda, uma amostra de 5 linhas e a hora da última cópia. A página Dados toma o lugar da página Cópias. Por baixo, o Hub passa a implementar `DataSources.catalog` e `DataSources.rows` do contrato de acesso, e todo agente que descrever o catálogo recebe as mesmas tabelas com as mesmas descrições. As decisões vêm do escopo aprovado pelo fundador em 2026-11-14 (seção 3, decisões `T1`, `T2`, `T6`, `T7` e E1a) e do `design.md` desta pasta.

## Glossário

- **Hub**: o programa servidor do Conexus (`apps/server`), com as suas rotas.
- **Kit**: o pacote de conectores `packages/connectors`, com `defineConnector` e as cópias prontas de cada conector.
- **Modelo**: uma cópia pronta do Kit (`CopyModel`), como as cinco do Sankhya.
- **Construtor**: o agente que propõe uma cópia pela ferramenta `copy_propose`.
- **Proposta**: a resposta do Hub a `copy_propose`, aceita (`PROPOSED`) ou recusada (`MALFORMED` e as outras).
- **Cópia**: a tabela que o Hub mantém no esquema `sync` do banco da empresa, descrita por uma definição da versão 1 (consulta) ou da versão 2 (leitura de lista).
- **Rodada**: uma execução de uma Cópia, que termina `COMPLETE`, `PARTIAL`, `ERROR` ou `INTERRUPTED`.
- **Passada_Inteira**: a passada de uma fonte, dentro de uma mesma Rodada, que começa do início (sem posição guardada) e lê a origem inteira: ou não tem filtro de alteração (`since` nulo), ou a definição da Cópia não declara `changedSince`.
- **Banco_do_Hub**: o banco PostgreSQL do Hub, com o esquema `copies`.
- **Banco_da_Empresa**: o banco PostgreSQL de cada empresa, com o esquema `sync`.
- **Login_de_Leitura**: o login `conexus_read` do Banco_da_Empresa.
- **Rota_de_Amostra**: a operação `sampleCopy`, `GET /api/companies/{companyId}/copies/{copyId}/sample`.
- **Catálogo**: a função `catalog` das fontes que `createCompanyData` monta, e o `describe()` do contrato sobre ela.
- **Leitor_de_Tabela**: a função `rows` das mesmas fontes, e o `read({ kind: 'TABLE' })` do contrato sobre ela.
- **Contrato**: os esquemas de `packages/hub-api/src/company-data.ts` e `packages/hub-api/src/copy-shown.ts`.
- **Conformidade**: as leis de `packages/hub-api/src/company-data-conformance.ts`.
- **Página_Dados**: a página `/companies/<c>/data` de `apps/web`.
- **Página_da_Tabela**: a página `/companies/<c>/data/<copyId>` de `apps/web`.
- **Trilho**: a coluna de ícones à esquerda do Hub.

## Requisitos

### Requisito 1: o nome com o sistema na frente

**História de usuário:** Como dono da empresa, quero que cada tabela copiada traga o sistema no nome, para saber de onde ela veio sem abrir a tabela.

#### Critérios de aceite

1. QUANDO uma pessoa liga um Modelo de uma conexão, O Hub DEVE dar à Cópia o nome do conector com `-` trocado por `_`, seguido de `_` e do id do Modelo (`sankhya` e `vendas` dão `sankhya_vendas`; `mercado-livre` e `pedidos` dão `mercado_livre_pedidos`).
2. SE o Construtor propõe uma Cópia cujo nome não começa com o prefixo do conector das conexões propostas, ENTÃO O Hub DEVE recusar a Proposta com `MALFORMED`, com um item que começa por `name:` e cita `COPY_NAME_PREFIX` e o prefixo esperado, sem gravar nada.
3. QUANDO o Construtor propõe uma Cópia cujo nome começa com o prefixo do conector, O Hub DEVE aceitar o nome como foi escrito.
4. SE o nome proposto passa de 40 caracteres, ENTÃO O Hub DEVE recusar a Proposta com `MALFORMED`, com um item que começa por `name:`, sem gravar nada.
5. O Hub DEVE manter o nome das Cópias que existiam antes desta parte.

### Requisito 2: a descrição de toda tabela e de toda coluna

**História de usuário:** Como dono da empresa, quero ler o que cada tabela e cada coluna guarda, para saber o que os agentes e os apps leem.

#### Critérios de aceite

1. SE um conector declara um Modelo sem descrição de tabela ou sem descrição de alguma coluna, ENTÃO O Kit DEVE recusar o conector em `defineConnector`, com o id do Modelo na mensagem.
2. O Kit DEVE dar às cinco cópias do Sankhya as descrições de tabela e de coluna da tabela "As descrições das cinco cópias do Sankhya" do `design.md`, letra por letra.
3. SE o Construtor propõe uma Cópia com uma coluna sem descrição, ENTÃO O Hub DEVE recusar a Proposta com `MALFORMED`, com um item por coluna que cita `COPY_COLUMN_UNDESCRIBED` e o caminho `definition.columns.<i>.description`, sem gravar nada.
4. QUANDO uma Rodada começa numa Cópia ligada de um Modelo cuja definição guardada não tem alguma descrição que o Modelo de hoje tem, O Hub DEVE copiar do Modelo só as descrições que faltam e manter iguais as que existem.
5. O Hub DEVE mostrar na lista de Cópias, em `shown.description` e em cada `shown.columns[].description`, a descrição guardada da versão 1 e da versão 2.
6. QUANDO uma Rodada preenche descrições, O Hub DEVE gravar no Banco_da_Empresa o `COMMENT ON` da tabela e de cada coluna descrita antes de gravar a definição no Banco_do_Hub.
7. SE o Modelo de uma Cópia não existe mais no Kit, ENTÃO O Hub DEVE seguir a Rodada sem preencher e registrar `COPY_MODEL_GONE` uma vez por Rodada.

### Requisito 3: o login de leitura

**História de usuário:** Como dono da empresa, quero que o Hub leia as cópias com um login que só lê, para que nenhuma leitura do catálogo mude o dado da empresa.

#### Critérios de aceite

1. SE uma consulta enviada como Login_de_Leitura tenta escrever numa tabela de `sync`, ENTÃO O Banco_da_Empresa DEVE recusar a consulta.
2. SE uma consulta enviada como Login_de_Leitura lê uma tabela fora de `sync`, ENTÃO O Banco_da_Empresa DEVE recusar a consulta com `42501`.
3. QUANDO uma pessoa liga uma Cópia, O Hub DEVE criar o Login_de_Leitura, ou refazer as suas permissões, depois do esquema `sync`.
4. QUANDO uma leitura como Login_de_Leitura recebe a resposta de login ausente, O Hub DEVE criar o Login_de_Leitura com o dono do banco, registrar `COPY_READER_MADE` e tentar a leitura uma vez de novo.
5. SE o Banco_da_Empresa recusa a criação do Login_de_Leitura, ENTÃO O Hub DEVE registrar `COPY_DATABASE_FAILED` com o SQLSTATE e responder `COPY_DATABASE_UNAVAILABLE` a quem pediu.
6. O Login_de_Leitura DEVE ler as tabelas de `sync` criadas depois dele sem nova concessão.

### Requisito 4: a amostra de uma tabela

**História de usuário:** Como dono da empresa, quero ver 5 linhas de uma tabela copiada, para conferir o que ela guarda.

#### Critérios de aceite

1. QUANDO o dono ou um administrador pede a Rota_de_Amostra de uma Cópia, O Hub DEVE responder 200 com no máximo 5 linhas e `complete: false` quando a tabela tem mais de 5 linhas.
2. SE um desenvolvedor, um membro ou alguém de fora da empresa pede a Rota_de_Amostra, ENTÃO O Hub DEVE responder `NOT_FOUND`.
3. O Hub DEVE responder na Rota_de_Amostra só as colunas da definição, sem `_pass`, `_account` nem `_account_name`.
4. ENQUANTO a tabela da Cópia ainda não existe no Banco_da_Empresa, O Hub DEVE responder a Rota_de_Amostra com nenhuma linha e `complete: true`.
5. SE o Banco_da_Empresa não responde, passa do prazo ou do tamanho na Rota_de_Amostra, ENTÃO O Hub DEVE responder 503 `COPY_DATABASE_UNAVAILABLE` e registrar `COPY_SAMPLE_FAILED` com o motivo.
6. SE a Cópia pedida não existe na empresa, ENTÃO O Hub DEVE responder `COPY_NOT_FOUND`.

### Requisito 5: a coluna que some na origem

**História de usuário:** Como dono da empresa, quero ver quando um sistema parou de mandar uma coluna, para não confiar num dado que deixou de chegar.

#### Critérios de aceite

1. QUANDO uma Rodada `COMPLETE` de uma Cópia da versão 2 em que toda fonte fez uma Passada_Inteira e trouxe ao menos uma linha não recebe uma coluna em linha nenhuma, e essa coluna veio numa passada anterior, O Hub DEVE marcar a coluna inativa desde o começo dessa Rodada.
2. SE uma coluna nunca veio numa passada, ENTÃO O Hub DEVE mantê-la ativa, mesmo que ela não venha na Passada_Inteira.
3. QUANDO uma coluna inativa vem numa linha de qualquer passada de uma Rodada `COMPLETE`, O Hub DEVE marcá-la ativa de novo.
4. SE a Rodada leu só o alterado, retomou uma passada de outra Rodada ou não trouxe linha nenhuma, ENTÃO O Hub DEVE manter inativa só a coluna que já estava inativa.
5. ENQUANTO uma coluna está inativa, O Hub DEVE listá-la em `shown.columns` com `inactiveSince` preenchido, e DEVE mantê-la na tabela do Banco_da_Empresa.
6. O Hub DEVE responder `inactiveSince: null` em toda coluna de uma Cópia da versão 1.

### Requisito 6: o catálogo e a leitura de uma tabela pelo contrato

**História de usuário:** Como agente da empresa, quero descrever o catálogo e ler uma tabela pelo contrato, para responder com o dado guardado e a sua origem.

#### Critérios de aceite

1. QUANDO um consumidor chama `describe()`, O Catálogo DEVE listar cada conexão `ACTIVE` que o lugar oferece (toda a da empresa no lugar empresa, as liberadas ao Projeto no lugar Projeto) com o conector, o nome, as leituras e as ações que o Kit declara.
2. O Catálogo DEVE devolver toda tabela com `description` de ao menos um caractere: a descrição guardada, ou o rótulo da Cópia quando ela não tem descrição.
3. ONDE o lugar é um Projeto, O Catálogo DEVE listar exatamente as Cópias liberadas a esse Projeto.
4. ONDE o lugar é a empresa, O Catálogo DEVE listar toda Cópia da empresa para o dono e o administrador, e nenhuma para os outros papéis.
5. O Catálogo DEVE pôr em `kept.lastRun` a última Rodada que terminou, e `null` antes da primeira.
6. SE o Banco_do_Hub não responde, ENTÃO O Catálogo DEVE responder `CATALOG_UNAVAILABLE` e registrar `DATA_CATALOG_FAILED`.
7. QUANDO um consumidor lê uma tabela do Catálogo, O Leitor_de_Tabela DEVE devolver no máximo 200 linhas (`TABLE_PAGE_ROWS`), cada uma como objeto coluna e valor, e `complete: false` quando a tabela tem mais.
8. SE o Banco_da_Empresa não responde, passa do prazo ou do tamanho, ou a tabela ainda não existe, ENTÃO O Leitor_de_Tabela DEVE responder `TABLE_UNAVAILABLE`, registrar `DATA_ROWS_FAILED` com o motivo e não ler o sistema ao vivo.
9. QUANDO um consumidor pede uma leitura ao vivo ou uma ação, O Hub DEVE responder `NOT_GRANTED` nesta parte.

### Requisito 7: o contrato e a conformidade

**História de usuário:** Como trilha Agentes e Apps, quero que o contrato diga o rótulo, a descrição obrigatória e a coluna inativa, para que todo consumidor receba a mesma forma.

#### Critérios de aceite

1. SE uma tabela do catálogo chega sem descrição, ENTÃO O Contrato DEVE recusar o catálogo no `Catalog.parse`.
2. O Contrato DEVE levar em `CatalogTable` o campo `label`, o rótulo da Cópia.
3. O Contrato DEVE levar em cada coluna de `CopyShown` o campo `inactiveSince`, um instante ou `null`.
4. O Contrato DEVE exportar `TABLE_PAGE_ROWS` igual a 200.
5. SE o mundo de teste da Conformidade devolve uma tabela do catálogo sem descrição, ENTÃO A Conformidade DEVE falhar a lei "descreve os sistemas e as tabelas, cada tabela com a descrição".

### Requisito 8: a página Dados, a lista

**História de usuário:** Como dono da empresa, quero uma página só com tudo que foi copiado, agrupado por sistema, para achar uma tabela sem saber o nome dela.

#### Critérios de aceite

1. ONDE o papel é dono, administrador ou desenvolvedor, O Trilho DEVE mostrar o item **Dados** no lugar do item **Cópias**.
2. QUANDO a pessoa abre **Dados**, A Página_Dados DEVE abrir na camada **Bruto**, com as abas **Bruto**, **Negócio** e **Apps** e o texto "O que os agentes e os apps da empresa podem ler: cada tabela, de qual sistema veio, o que guarda e de quando é."
3. A Página_Dados DEVE agrupar as Cópias da camada Bruto por sistema, com o cabeçalho "<sistema> · <ligações> · <n> tabelas".
4. A Página_Dados DEVE mostrar em cada linha da camada Bruto o nome, a descrição (ou o rótulo), o estado em palavras, a hora da última Rodada, as linhas, o intervalo e os Projetos.
5. ENQUANTO há Propostas abertas do Construtor, A Página_Dados DEVE mostrá-las no topo da camada Bruto, com **Ligar** e **Dispensar**.
6. QUANDO a pessoa escreve em "Buscar tabela ou coluna", A Página_Dados DEVE mostrar só as tabelas cujo nome, descrição ou nome de coluna contém o texto, sem diferença de acento nem de caixa.
7. ENQUANTO a empresa não tem conexão `ACTIVE`, A Página_Dados DEVE mostrar "Nenhum sistema ligado ainda" e o link **Ligar um sistema** para Integrações.
8. ENQUANTO um sistema ligado não tem Cópia, A Página_Dados DEVE mostrar o sistema com "Nenhuma tabela copiada".
9. ENQUANTO a lista carrega, A Página_Dados DEVE mostrar o quadro da página e as linhas em esqueleto.
10. SE a leitura da lista falha, ENTÃO A Página_Dados DEVE mostrar "Não deu para ler o catálogo agora. Nada foi apagado. Tente de novo em instantes." com **Tentar de novo**, sem dado anterior.
11. QUANDO a pessoa abre a camada **Negócio**, A Página_Dados DEVE mostrar "Nenhum conceito aprovado ainda" e o que um conceito é.
12. QUANDO alguém abre `/companies/<c>/copies` ou `/companies/<c>/copies/<copyId>`, O Hub DEVE levar ao endereço correspondente em `/data`.
13. SE um membro abre o endereço da Página_Dados, ENTÃO A Página_Dados DEVE mostrar "Não encontramos o que você procurou." sem pedir a lista ao Hub.
14. A Página_Dados DEVE guardar a camada aberta no endereço.

### Requisito 9: a página de uma tabela

**História de usuário:** Como dono da empresa, quero abrir uma tabela e ver as colunas, uma amostra e as rodadas, para entender o dado antes de usá-lo.

#### Critérios de aceite

1. QUANDO a pessoa abre uma tabela, A Página_da_Tabela DEVE abrir na aba **Colunas**, com cada coluna, o tipo em palavras, a marca **Chave** nas colunas da chave e a descrição, e ao lado o sistema, a ligação, a chave, o modo, o intervalo, a última Rodada, as linhas e a camada.
2. ONDE o papel é dono ou administrador, A Página_da_Tabela DEVE mostrar a aba **Amostra**.
3. QUANDO a pessoa abre **Amostra**, A Página_da_Tabela DEVE mostrar "Cinco linhas da cópia." e as linhas da Rota_de_Amostra, e uma frase de que há mais linhas quando `complete` é falso.
4. ENQUANTO uma coluna está inativa, A Página_da_Tabela DEVE mostrar no topo "O <sistema> parou de enviar a coluna <nome> desde <dd/mm>. Ela fica aqui, inativa, e nada foi apagado." e a marca **Inativa desde <dd/mm>** na coluna.
5. QUANDO a pessoa abre **Rodadas**, A Página_da_Tabela DEVE mostrar cada Rodada com quando, duração, lidas, gravadas e resultado, 20 por página.
6. A Página_da_Tabela DEVE guardar a aba aberta no endereço.
7. SE a Rota_de_Amostra falha, ENTÃO A Página_da_Tabela DEVE mostrar a frase do erro com **Tentar de novo** dentro da aba.
8. SE a Rota_de_Amostra responde sem linhas, ENTÃO A Página_da_Tabela DEVE mostrar "A cópia ainda não tem linhas."

### Requisito 10: a camada Apps

**História de usuário:** Como dono da empresa, quero ver as tabelas que cada app guarda, na mesma página, para saber o que existe sem abrir cada Projeto.

#### Critérios de aceite

1. QUANDO a pessoa abre a camada **Apps**, A Página_Dados DEVE mostrar "As tabelas que cada app guarda. Elas são do Projeto e ficam aqui só para leitura." e, por Projeto com app, o cabeçalho "<Projeto> · <n> tabelas", e cada tabela do app com o nome, a versão e as linhas.
2. A Página_Dados DEVE escrever a versão como "Publicado · v<n>" quando o Projeto tem versão publicada, e "Em construção · v<n>" quando não tem.
3. A Página_Dados DEVE dar a cada Projeto o link **Abrir o Projeto** para a página Dados do Projeto.
4. ENQUANTO nenhum Projeto tem app com tabela, A Página_Dados DEVE mostrar "Nenhum app guarda tabelas ainda."
5. SE a contagem de uma tabela do app não responde, ENTÃO A Página_Dados DEVE mostrar "indisponível" no lugar das linhas.
