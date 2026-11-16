# Documento de requisitos: parte 3, a leitura para análise

> Os grupos 3 e 4 desta parte foram construídos pelo cartão A pergunta respondida com a origem, fechado em 2026-11-16, e o que ele decidiu vale sobre este texto. Uma tabela cuja conexão não está em `systems` é lida, e a origem vem do registro gravado da cópia, com o estado da conexão (`NAMED` ou `NOT_GIVEN`): onde esta parte manda responder `CATALOG_UNAVAILABLE` e registrar `DATA_ORIGIN_UNREAD` nesse caso, o texto está superado (a emenda de 2026-11-15, "1. A"). O registro do cartão está em [aprovações](../../../../approvals/a-pergunta-respondida-com-a-origem.md).

## Introdução

No fim desta parte a pessoa pergunta ao Assistente "Quanto vendi em outubro?" e recebe o número em negrito. Embaixo da resposta, o bloco Fontes diz o sistema, a tabela e a hora da cópia: Sankhya, `sankhya_vendas`, copiado hoje às 08:45. Quem abre as linhas de ferramenta vê o catálogo consultado, as 5 linhas que o agente olhou e a consulta, com **Copiar a consulta**. O Builder e um agente salvo usam as mesmas duas ferramentas. É o marco `D2` do roteiro (`docs/roadmap.md:46`). As decisões vêm do escopo aprovado, seção 5 (telas `p3-01` a `p3-07`): `T5` (a origem no bloco Fontes), `T7` (a amostra de 5 linhas) e E3a (a consulta visível a quem lê a tabela, recolhida). O como está no `design.md` desta pasta, que parte da parte 1 construída.

## Glossário

- **Assistente**: o agente da conversa do Início, `apps/server/src/builder/assistant/`.
- **Builder**: o agente da conversa de um Projeto, `apps/server/src/builder/conversation/builder.ts`.
- **Agente_Salvo**: um agente publicado ou em rascunho de um Projeto, `apps/server/src/builder/agents/agent.ts`.
- **Construtor**: o agente que monta agentes salvos, `apps/server/src/builder/construtor/`.
- **Ferramenta_Descrever**: a ferramenta `data_describe`.
- **Ferramenta_Consultar**: a ferramenta `data_query`.
- **Contrato**: o `CompanyData` de `packages/hub-api/src/company-data.ts`, já preso a quem pergunta e onde.
- **Fontes_de_Dados**: a implementação de `DataSources` em `apps/server/src/hub/data/`.
- **Catálogo**: a resposta `CATALOG` de `describe()`, com os sistemas e as tabelas que o lugar pode ler.
- **Lugar**: o `place` do escopo da conversa, `COMPANY` (o Início) ou `PROJECT` (um Projeto).
- **Banco_da_Empresa**: o PostgreSQL da empresa, com as cópias no esquema `sync`.
- **Login_de_Leitura**: `conexus_read` no Lugar `COMPANY` (parte 1), o login de leitura do Projeto no Lugar `PROJECT`.
- **Origem**: o sistema, o conector dele, a tabela, a hora em que a última rodada terminou e o estado dessa rodada, que o resultado de uma ferramenta de dado leva.
- **Ordem_do_Agente**: o texto `## Company data` de `dataOrder()`.
- **Tela_da_Conversa**: a conversa no navegador, `apps/web/src/builder/conversation/`.
- **Linha_da_Ferramenta**: a linha recolhida de uma chamada de ferramenta na Tela_da_Conversa.
- **Bloco_Fontes**: a seção "Fontes" embaixo de uma resposta.
- **Lista_de_Migração**: `CONTRACT_MIGRATION` em `.dependency-cruiser.cjs`.
- **Bloco_de_Dados**: o bloco "## Data" das instruções do Builder.
- **Conformidade**: `runDataConformance` em `packages/hub-api/src/company-data-conformance.ts`.
- **Placar**: as perguntas com resposta conhecida de `apps/server/src/builder/assistant/test-scorecard.ts`.

## Requisitos

### Requisito 1: as mesmas duas ferramentas nos três agentes

**História de usuário:** Como pessoa da empresa, quero que o Assistente, o Builder e um agente salvo leiam o dado copiado do mesmo jeito, para receber a mesma resposta de qualquer um deles.

#### Critérios de aceite

1. O Assistente, o Builder e o Agente_Salvo DEVEM receber a Ferramenta_Descrever e a Ferramenta_Consultar com o mesmo nome, a mesma descrição e o mesmo esquema de entrada.
2. O Construtor DEVE receber o mesmo conjunto de ferramentas de hoje, sem a Ferramenta_Descrever e sem a Ferramenta_Consultar.
3. SE a conversa não tem escopo, ENTÃO a Ferramenta_Descrever e a Ferramenta_Consultar DEVEM devolver `NOT_GRANTED` sem chamar o Contrato.
4. O Assistente, o Builder e o Agente_Salvo DEVEM receber a Ordem_do_Agente nas instruções, com o texto do `design.md`, `C4`, também num Projeto sem cópia.
5. QUANDO o agente chama a Ferramenta_Descrever sem tabela, a Ferramenta_Descrever DEVE devolver `CATALOG` com cada sistema (nome, conector e leituras) e cada tabela (nome, rótulo, descrição, sistema, conector, hora da última cópia e estado da última rodada), sem as colunas.
6. QUANDO o agente chama a Ferramenta_Descrever com uma tabela do Catálogo, a Ferramenta_Descrever DEVE devolver `TABLE` com as colunas (nome, tipo, descrição e `inactiveSince`), no máximo 5 linhas da tabela, a marca `more` verdadeira quando a tabela tem mais linhas, e a Origem.
7. ONDE o Lugar é `COMPANY`, o Catálogo DEVE listar as tabelas que o papel da pessoa lê: nesta parte, todas as cópias da empresa para dono e administrador, e nenhuma para os outros papéis.
8. ONDE o Lugar é `PROJECT`, o Catálogo DEVE listar exatamente as cópias liberadas ao Projeto.
9. QUANDO a empresa não tem sistema ligado nem cópia, a Ferramenta_Descrever DEVE devolver `CATALOG` com a lista de sistemas e a de tabelas vazias.

### Requisito 2: a consulta só de leitura

**História de usuário:** Como pessoa da empresa, quero que o agente calcule o número com uma consulta sobre a cópia, para ter a resposta sem que nada mude no dado.

#### Critérios de aceite

1. QUANDO o agente chama a Ferramenta_Consultar com um `SELECT` sobre tabelas do Catálogo, a Ferramenta_Consultar DEVE devolver `ROWS` com as colunas, as linhas e a Origem de cada tabela lida.
2. QUANDO uma consulta lê duas tabelas do Catálogo numa junção, a resposta DEVE trazer as duas tabelas na Origem, cada uma com o sistema que a guarda e a sua última rodada.
3. SE a consulta escreve com `INSERT`, `UPDATE` ou `DELETE`, ENTÃO o Banco_da_Empresa DEVE recusá-la, a Ferramenta_Consultar DEVE devolver `NOT_IN_ROLE` e nenhuma linha do Banco_da_Empresa DEVE mudar.
4. SE o texto da consulta tem mais de uma instrução ou é um `CREATE`, ENTÃO o Banco_da_Empresa DEVE recusar o texto inteiro, a Ferramenta_Consultar DEVE devolver `QUERY_REFUSED` com `42601` e nenhuma das instruções DEVE rodar.
5. QUANDO a consulta traz mais de 200 linhas, a Ferramenta_Consultar DEVE devolver as primeiras 200 e `complete: false`.
6. SE o texto da consulta passa de 4000 caracteres ou está vazio, ENTÃO a Ferramenta_Consultar DEVE recusar a chamada pelo esquema de entrada, sem chegar ao Banco_da_Empresa.
7. O resultado da Ferramenta_Consultar DEVE trazer as colunas sem a coluna `_pass` do motor de cópia.
8. O Banco_da_Empresa DEVE rodar a consulta como o Login_de_Leitura do Lugar, numa transação só de leitura.

### Requisito 3: toda linha tem origem no catálogo

**História de usuário:** Como pessoa da empresa, quero que cada número venha de uma tabela que o catálogo me mostra, para saber de onde ele saiu.

#### Critérios de aceite

1. SE a consulta leu uma tabela que não está no Catálogo de quem pergunta, ENTÃO o Contrato DEVE devolver `NOT_IN_CATALOG` sem linha nenhuma.
2. SE o Catálogo não responde, ENTÃO o Contrato DEVE devolver `CATALOG_UNAVAILABLE` sem chegar ao Banco_da_Empresa.
3. QUANDO o plano da consulta não nomeia tabela nenhuma de `sync`, a Ferramenta_Consultar DEVE devolver as linhas com a Origem vazia e a frase ao modelo de que a origem não foi identificada.
4. QUANDO a conversa é cancelada, o Contrato DEVE passar o sinal de cancelamento à consulta.
5. SE o agente pede a Ferramenta_Descrever de uma tabela fora do Catálogo, ENTÃO a Ferramenta_Descrever DEVE devolver `NOT_IN_CATALOG` com a frase "No such table in the catalog. Call data_describe with no table to list them."
6. SE o plano devolvido pelo banco não tem a forma esperada, ENTÃO a Ferramenta_Consultar DEVE falhar com `INTERNAL_UNEXPECTED` sem devolver linha, e o servidor DEVE registrar `DATA_PLAN_UNREAD`.
7. SE uma tabela do Catálogo nomeia uma conexão que não está entre os sistemas do Catálogo, ENTÃO a Ferramenta_Descrever e a Ferramenta_Consultar DEVEM devolver `CATALOG_UNAVAILABLE` sem linha, e o servidor DEVE registrar `DATA_ORIGIN_UNREAD`.

### Requisito 4: a resposta com origem na tela

**História de usuário:** Como pessoa da empresa, quero ver embaixo da resposta de onde veio o número e como o agente chegou a ele, para confiar nele ou conferir.

#### Critérios de aceite

1. QUANDO a resposta leu uma tabela copiada, o Bloco_Fontes DEVE mostrar, para cada tabela lida uma vez, o sistema, a tabela e a hora da cópia, como "Sankhya · sankhya_vendas · copiado hoje às 08:45" (tela `p3-01`).
2. ENQUANTO a última rodada da tabela foi parcial, o Bloco_Fontes DEVE dizer "rodada parcial" junto da hora (tela `p3-04`).
3. ENQUANTO a última rodada da tabela terminou em erro ou foi interrompida, o Bloco_Fontes DEVE dizer "parada" junto da hora (tela `p3-04`).
4. QUANDO a resposta leu um sistema ao vivo, o Bloco_Fontes DEVE dizer "lido agora, às 10:02", com a hora em que a leitura voltou (tela `p3-05`).
5. A Linha_da_Ferramenta da Ferramenta_Descrever sem tabela DEVE dizer "Consultando o catálogo" enquanto roda e "Consultou o catálogo" com o número de tabelas depois (tela `p3-02`).
6. A Linha_da_Ferramenta da Ferramenta_Descrever com tabela DEVE dizer "Vendo sankhya_vendas" enquanto roda e "Viu sankhya_vendas" com "5 linhas, há mais" depois (tela `p3-02`).
7. A Linha_da_Ferramenta da Ferramenta_Consultar DEVE dizer "Consultando os dados" enquanto roda e "Consultou sankhya_vendas" com o número de linhas depois (tela `p3-02`).
8. A Linha_da_Ferramenta DEVE nascer recolhida, e o corpo aberto da Ferramenta_Consultar DEVE mostrar a consulta e o botão **Copiar a consulta** (decisão E3a, tela `p3-02`).
9. QUANDO a pessoa toca **Copiar a consulta**, a Tela_da_Conversa DEVE pôr o texto inteiro da consulta na área de transferência.
10. SE o resultado guardado de uma ferramenta de dado não passa no esquema, ENTÃO a Tela_da_Conversa DEVE mostrar a linha genérica da ferramenta e nenhuma fonte.
11. ONDE a conversa é do Builder, a Tela_da_Conversa DEVE mostrar as mesmas linhas das duas ferramentas (tela `p3-07`).
12. ENQUANTO uma ferramenta de dado roda, a Linha_da_Ferramenta DEVE aparecer com a frase de "rodando".

### Requisito 5: as recusas e as falhas

**História de usuário:** Como pessoa da empresa, quero saber quando o agente não conseguiu ler e por quê, para tentar de novo ou pedir acesso, sem receber um número de outro lugar.

#### Critérios de aceite

1. SE o Banco_da_Empresa recusa a consulta, ENTÃO a Ferramenta_Consultar DEVE devolver `QUERY_REFUSED` com o SQLSTATE inteiro e a frase ao modelo do `design.md`, `C3`.
2. SE o Banco_da_Empresa recusa a consulta com `42501`, ENTÃO a Ferramenta_Consultar DEVE devolver `NOT_IN_ROLE`, e o servidor DEVE registrar `DATA_READ_REFUSED` com a pessoa e sem a consulta.
3. SE o Banco_da_Empresa não responde, ENTÃO a Ferramenta_Consultar DEVE devolver `TABLE_UNAVAILABLE`, nenhuma leitura ao vivo do sistema DEVE acontecer no lugar, e o servidor DEVE registrar `DATA_QUERY_FAILED` (tela `p3-06`).
4. SE a resposta da consulta passa de 1 MiB, ENTÃO a Ferramenta_Consultar DEVE devolver `QUERY_TOO_LARGE`.
5. SE a consulta passa do prazo da chamada, ENTÃO a Ferramenta_Consultar DEVE devolver `DEADLINE`, e o servidor DEVE registrar `DATA_QUERY_FAILED` com `TIMEOUT`.
6. SE o Catálogo não responde, ENTÃO a Ferramenta_Descrever e a Ferramenta_Consultar DEVEM devolver `CATALOG_UNAVAILABLE`.
7. QUANDO uma ferramenta de dado devolve uma recusa, a Linha_da_Ferramenta DEVE dizer o texto da tabela do `design.md`, `C5`: "Seu papel não lê esta tabela. Peça a quem administra a empresa." (`NOT_IN_ROLE`), "Não conseguiu ler a tabela agora." (`TABLE_UNAVAILABLE`, `CATALOG_UNAVAILABLE`), "A consulta não rodou." (`QUERY_REFUSED`), "A consulta trouxe dados demais." (`QUERY_TOO_LARGE`), "A consulta demorou demais." (`DEADLINE`) e "Essa tabela não está no catálogo." (`NOT_IN_CATALOG`).
8. QUANDO nenhuma tabela do Catálogo guarda o que foi perguntado, o agente DEVE responder em prosa o que não achou e o que existe de parecido, e nenhuma ferramenta DEVE falhar (tela `p3-03`).

### Requisito 6: a lista de migração só diminui

**História de usuário:** Como quem mantém o Conexus, quero que nenhum arquivo novo chegue ao dado por fora do contrato, para que a porta única fique de pé.

#### Critérios de aceite

1. SE um arquivo entra na Lista_de_Migração, ENTÃO o teste das portas DEVE falhar com o nome do arquivo.
2. ENQUANTO o Bloco_de_Dados do Builder usa as propostas e a liberação de cópias, `apps/server/src/builder/app-data/context.ts` DEVE ficar na Lista_de_Migração, e nenhum outro arquivo DEVE entrar nela.
3. A pasta `apps/server/src/builder/data-tools/` DEVE estar entre as pastas de agente do verificador de dependências e fora da Lista_de_Migração.

### Requisito 7: a leitura ao vivo, o funil e a conformidade inteira

**História de usuário:** Como quem constrói a parte 5, quero as quatro fontes do contrato implementadas e provadas pela conformidade, para pôr consumidores sobre elas sem lógica paralela.

#### Critérios de aceite

1. O servidor DEVE passar em todas as leis de `runDataConformance`, as de hoje e as cinco desta parte, contra as Fontes_de_Dados reais, com o Hub de teste e os dublês do kit.
2. QUANDO o Contrato pede uma leitura ao vivo, as Fontes_de_Dados DEVEM chamar a porta de leitura dos conectores e devolver cada resposta dela com o seu par no Contrato.
3. QUANDO o Contrato pede uma ação, as Fontes_de_Dados DEVEM passá-la uma vez pelo funil de escrita e devolver a resposta do funil.

### Requisito 8: as perguntas com resposta conhecida

**História de usuário:** Como fundador, quero perguntas sobre o dado copiado com o número certo conhecido, para medir se o agente responde certo e com a origem.

#### Critérios de aceite

1. O Placar DEVE ter as perguntas sobre dado copiado do `design.md` (estratégia de teste), cada uma com a tabela, o número e a Origem esperados.
2. QUANDO o agente responde uma pergunta do Placar sobre dado copiado, o Placar DEVE conferir a ferramenta chamada, a tabela na Origem e o número no texto.
3. O Placar DEVE calcular cada número esperado do banco de vendas do dublê do Sankhya, e não de um valor escrito à mão.
4. ONDE `CONEXUS_EVAL_REAL_MODEL` está ligada, o Placar DEVE rodar as perguntas sobre dado copiado com o modelo real contra o dublê do Sankhya.
5. SE `CONEXUS_EVAL_REAL_MODEL` não está ligada, ENTÃO o caso do modelo real DEVE pular com uma razão que começa com `opt-in:`.
