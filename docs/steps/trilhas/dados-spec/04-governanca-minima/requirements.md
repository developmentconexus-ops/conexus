# Documento de requisitos: parte 4, a governança mínima

## Introdução

No fim desta parte uma pessoa sem o papel pergunta sobre um dado copiado e recebe a recusa com o nome do dado, o dono e o administrador marcam na tela Papéis quais tabelas cada papel lê, o membro vê na página Dados só as tabelas do papel dele, nenhuma cópia guarda o CPF ou o CNPJ do cliente, e o dono e o administrador veem no Registro de dados cada leitura que um agente ou um app fez. As decisões vêm do escopo aprovado (seção 6 e tela `p1-11`, decisões `T4`, `T8`, E4a e E5a, aprovadas em 2026-11-14) e do `design.md` desta pasta. A parte parte do pressuposto de que as partes 1 e 3 estão construídas: o login `conexus_read`, o catálogo, `rowsOf`, `queryOf` e as ferramentas `data_describe` e `data_query`.

## Glossário

- **Hub**: o servidor do Conexus, com as rotas da empresa.
- **Banco_do_Hub**: o PostgreSQL do Hub, onde ficam `copies.copy`, `copies.copy_reader` e `data.data_read`.
- **Banco_da_Empresa**: o PostgreSQL de cada empresa, com o esquema `sync` das cópias.
- **Papel_Editável**: o desenvolvedor, o membro ou um papel próprio da empresa. Cada um tem uma linha em `auth.organization_role`.
- **Dono_ou_Administrador**: os dois papéis fixos que leem toda cópia e não têm linha em `copies.copy_reader`.
- **Login_do_Papel**: o login `conexus_role_<id da linha do papel>` no Banco_da_Empresa.
- **Catálogo**: a resposta de `describe` do contrato de acesso, com `tables` e `withheld`.
- **Contrato**: `companyData` de `packages/hub-api/src/company-data.ts`, com os verbos `describe`, `read` e `act`.
- **Ferramenta_Descrever**: a ferramenta `data_describe` dos agentes.
- **Ferramenta_Consultar**: a ferramenta `data_query` dos agentes.
- **Tela_Papéis**: Configurações > Papéis.
- **Página_Dados**: a página Dados da empresa, que tomou o lugar da página Cópias na parte 1.
- **Aba_Quem_Lê**: a aba nova da página de uma tabela.
- **Prova_da_Proposta**: a página de até 50 linhas que o Builder lê antes de propor uma cópia.
- **Rodada**: uma execução de uma cópia.
- **Kit**: `packages/connectors`, com os modelos de cópia de cada conector.
- **Registro_de_Dados**: a tabela `data.data_read` e as rotas `listDataReads` e `exportDataReads`.
- **Página_Registro**: Configurações > Registro de dados.

## Requisitos

### Requisito 1: quem lê cada tabela

**História de usuário:** Como dono ou administrador, quero dizer quais papéis leem cada tabela copiada, para que cada pessoa e os agentes dela leiam só o que o papel dela pode ler.

#### Critérios de aceite

1. O Banco_do_Hub DEVE guardar cada par de cópia e Papel_Editável que lê a cópia, com quem marcou e quando.
2. QUANDO uma pessoa liga uma cópia, por modelo ou por proposta, O Hub DEVE marcar a cópia, na mesma transação que a cria, para exatamente os Papéis_Editáveis que seguram todas as leituras da origem dela.
3. O Hub DEVE tratar o Dono_ou_Administrador como leitor de toda cópia da empresa.
4. QUANDO o Catálogo ou a Página_Dados é lido numa empresa que tem cópia ligada antes desta parte e ainda não marcada, O Hub DEVE marcar essas cópias pela regra do critério 1.2 uma vez e registrar `COPY_READERS_SEEDED`.
5. SE o Dono_ou_Administrador desmarcou todos os papéis de uma cópia, ENTÃO O Hub DEVE manter a cópia sem leitor nas leituras seguintes.
6. QUANDO um papel ou uma cópia é apagado, O Banco_do_Hub DEVE apagar as marcas dele junto.

### Requisito 2: o banco garante a leitura por papel

**História de usuário:** Como dono, quero que o banco da empresa recuse sozinho a tabela que o papel não lê, para que uma consulta escrita por um modelo não alcance o dado de outro papel.

#### Critérios de aceite

1. O Banco_da_Empresa DEVE dar a cada Papel_Editável um Login_do_Papel que segura `SELECT` só nas tabelas que o Banco_do_Hub marca para o papel.
2. QUANDO a reconciliação roda uma vez ou mais com o mesmo conjunto pedido, O Banco_da_Empresa DEVE ficar com cada Login_do_Papel lendo exatamente as tabelas pedidas.
3. QUANDO o Dono_ou_Administrador tira uma tabela de um papel ou apaga um papel, O Hub DEVE gravar a mudança no Banco_do_Hub primeiro e só depois do commit pegar o bilhete da reconciliação que tira a permissão no Banco_da_Empresa.
4. SE a reconciliação falha depois de o Hub gravar uma tabela tirada de um papel, ENTÃO O Hub DEVE repor as marcas que apagou numa transação do Banco_do_Hub, responder 503 `COPY_DATABASE_UNAVAILABLE`, registrar `COPY_READERS_FAILED` e deixar o papel como estava.
5. SE o Banco_da_Empresa falha depois de o Hub gravar uma tabela dada a um papel, ENTÃO O Hub DEVE responder 200, registrar `COPY_READERS_PENDING`, e o Banco_da_Empresa DEVE recusar a leitura até o conserto.
6. QUANDO uma leitura de uma pessoa com Papel_Editável recebe `42501` ou `NO_LOGIN` e o Catálogo dela lista ao menos uma tabela, O Hub DEVE reconciliar uma vez, tentar a leitura de novo e registrar `COPY_READERS_REPAIRED` quando a segunda passa.
7. SE uma consulta feita como Login_do_Papel pede `SET ROLE`, `set_config('role', ...)`, uma escrita ou uma tabela de outro papel, ENTÃO O Banco_da_Empresa DEVE recusar a consulta.
8. SE o nome do Login_do_Papel passaria de 63 bytes, ENTÃO O Hub DEVE falhar com `INTERNAL_UNEXPECTED` e registrar `COPY_READER_NAME`, sem criar login nenhum.
9. QUANDO um papel deixa de existir no Banco_do_Hub, O Banco_da_Empresa DEVE perder o Login_do_Papel dele na reconciliação seguinte.
10. SE uma reconciliação que pegou o seu bilhete antes de outra chega ao Banco_da_Empresa depois dela, ENTÃO O Banco_da_Empresa DEVE abandonar a reconciliação mais velha sem mudar permissão nenhuma, e O Hub DEVE tratá-la como feita; sem falha, nenhuma intercalação DEVE deixar um Login_do_Papel lendo uma tabela que o Banco_do_Hub tirou do papel depois que o ato de tirar respondeu.
11. QUANDO uma rodada de cópia termina, O Hub DEVE reconciliar cada Login_do_Papel da empresa, e SE essa reconciliação falha, ENTÃO O Hub DEVE só registrar `COPY_READERS_FAILED`, sem mudar o resultado da rodada.
12. SE a reposição das marcas depois de uma reconciliação falha também falha, ENTÃO O Hub DEVE registrar `COPY_READERS_PENDING` como erro, com a empresa e o papel, e responder 503 `COPY_DATABASE_UNAVAILABLE`.

### Requisito 3: o catálogo por papel e a recusa

**História de usuário:** Como membro, quero que o agente me diga que o meu papel não lê uma tabela, para saber a quem pedir e não receber um "não achei" falso.

#### Critérios de aceite

1. ONDE o lugar da conversa é a empresa, O Catálogo DEVE listar em `tables` exatamente as cópias que o papel de quem pergunta lê.
2. O Catálogo de um papel DEVE listar as mesmas tabelas que o Login_do_Papel lê em `information_schema.tables`.
3. ONDE o lugar da conversa é a empresa, O Catálogo DEVE listar em `withheld` o nome e o rótulo de cada cópia que o papel não lê, sem coluna, sem descrição e sem linha.
4. QUANDO um agente pede `read` de uma tabela listada em `withheld`, O Contrato DEVE responder `NOT_IN_ROLE` sem pedir linha nenhuma.
5. QUANDO o Banco_da_Empresa recusa uma consulta por permissão, O Contrato DEVE responder `NOT_IN_ROLE` sem linha nenhuma, e O Hub DEVE registrar `DATA_READ_REFUSED` com a pessoa e sem a consulta.
6. ONDE o lugar da conversa é um Projeto, O Catálogo DEVE listar as cópias liberadas ao Projeto, com `withheld` vazio.

### Requisito 4: as telas de quem lê

**História de usuário:** Como dono ou administrador, quero marcar as tabelas de cada papel na mesma tela das operações, e ver pela tabela quem a lê, para mudar o acesso num lugar só.

#### Critérios de aceite

1. QUANDO o Dono_ou_Administrador abre um Papel_Editável na Tela_Papéis, A Tela_Papéis DEVE mostrar, em cada sistema, o bloco "Dados copiados" com cada cópia daquele sistema e uma caixa marcada para as que o papel lê.
2. QUANDO o Dono_ou_Administrador marca ou desmarca tabelas e toca em **Salvar**, A Tela_Papéis DEVE gravar as operações e as tabelas e voltar à lista de papéis.
3. ENQUANTO o papel aberto é Dono ou Administrador, A Tela_Papéis DEVE mostrar todas as tabelas marcadas e sem caixa que mude, abaixo da frase "Dono e Administrador usam tudo de todos os conectores, sempre. Este papel não muda.".
4. ONDE um sistema do papel não tem cópia, O bloco "Dados copiados" DEVE dizer "Nenhuma tabela copiada".
5. SE gravar as tabelas falha, ENTÃO A Tela_Papéis DEVE mostrar a frase do Hub para a falha e manter as marcas que a pessoa fez.
6. QUANDO uma pessoa abre a Aba_Quem_Lê de uma tabela, A Aba_Quem_Lê DEVE listar Dono, Administrador e cada papel que lê a tabela, com quantas pessoas cada um tem.
7. ONDE quem abre a Aba_Quem_Lê pode mudar papéis, A Aba_Quem_Lê DEVE mostrar **Abrir em Papéis**, que leva ao papel na Tela_Papéis.
8. QUANDO um membro abre a Página_Dados, A Página_Dados DEVE mostrar só as tabelas que o papel dele lê, sem **Ligar um sistema**, sem propostas e sem o menu da linha.
9. SE um membro abre o endereço de uma tabela que o papel dele não lê, ENTÃO O Hub DEVE responder "não encontrado", e A Página_Dados DEVE mostrar a página de não encontrado.
10. QUANDO um desenvolvedor abre a aba Amostra de uma tabela que o papel dele não lê, A Página_Dados DEVE dizer "Seu papel não lê esta tabela. Peça a quem administra a empresa.".
11. QUANDO a Ferramenta_Descrever recebe `NOT_IN_ROLE` de uma tabela com rótulo, A linha da ferramenta na conversa DEVE dizer "Seu papel não lê <rótulo>. Peça a quem administra a empresa.".
12. QUANDO a Ferramenta_Consultar recebe `NOT_IN_ROLE`, A linha da ferramenta na conversa DEVE dizer "Seu papel não lê esta tabela. Peça a quem administra a empresa.".
13. A Tela_Papéis DEVE dizer, sob o bloco "Dados copiados", "Desmarcar uma tabela não tira a leitura ao vivo do sistema. Ela segue as operações marcadas acima.".

### Requisito 5: o documento do cliente fora de toda cópia

**História de usuário:** Como dono, quero que nenhuma cópia guarde o CPF ou o CNPJ de um cliente, para que esse dado nunca chegue a um agente por uma tabela.

#### Critérios de aceite

1. SE a Prova_da_Proposta de uma cópia da versão 1 tem uma coluna em que mais da metade das células não nulas, sendo ao menos 3, é CPF ou CNPJ válido, ENTÃO O Hub DEVE recusar a proposta com `COPY_PERSONAL_NOT_KEPT` e o nome da coluna.
2. SE a Prova_da_Proposta de uma cópia da versão 2 tem uma coluna assim, ENTÃO O Hub DEVE recusar a proposta do mesmo jeito, além da conferência do caminho declarado como `documento`.
3. O modelo `clientes` do Kit do Sankhya DEVE copiar as colunas de hoje sem `CGC_CPF`.
4. QUANDO a Rodada de uma cópia ligada de um modelo encontra na definição guardada uma coluna que o modelo de hoje declara aposentada, A Rodada DEVE tirar a coluna da tabela no Banco_da_Empresa e depois gravar a definição sem ela, antes de copiar.
5. SE tirar a coluna aposentada falha no Banco_da_Empresa, ENTÃO A Rodada DEVE terminar `ERROR` com `COPY_DATABASE_UNAVAILABLE`, registrar `COPY_RETIRE_FAILED` e não copiar linha nenhuma.

### Requisito 6: cada leitura deixa uma linha no registro

**História de usuário:** Como dono, quero que cada leitura de dado por um agente ou um app deixe um registro durável, para saber quem leu o quê, sem que o registro guarde o dado lido.

#### Critérios de aceite

1. QUANDO um agente lê uma tabela pelo Contrato, O Registro_de_Dados DEVE ganhar uma linha `SAMPLE` com a pessoa, o agente, a tabela, o resultado e a contagem de linhas.
2. QUANDO um agente consulta pelo Contrato, O Registro_de_Dados DEVE ganhar uma linha `QUERY` com a consulta de até 4000 caracteres, as tabelas lidas, o resultado e a contagem.
3. QUANDO um agente ou um app lê um sistema ao vivo pelo Hub, O Registro_de_Dados DEVE ganhar uma linha `LIVE` com a conexão, a operação, o resultado e o agente.
4. O Registro_de_Dados DEVE guardar só nomes, a consulta, o resultado, a contagem e o tempo, e nenhum valor das linhas lidas.
5. SE a gravação da linha do Registro_de_Dados falha, ENTÃO O Hub DEVE responder `TABLE_UNAVAILABLE` numa leitura de tabela ou consulta, `UNREACHABLE` numa leitura ao vivo, registrar `DATA_READ_UNRECORDED` e não devolver linha nenhuma.
6. O Hub DEVE manter cada linha do Registro_de_Dados sem prazo, e o login do Hub DEVE segurar só `SELECT` e `INSERT` nela.
7. A leitura que a Rodada de uma cópia faz do sistema DEVE ficar fora do Registro_de_Dados.

### Requisito 7: a página do Registro de dados

**História de usuário:** Como dono ou administrador, quero ver e exportar o que cada agente leu, com filtros, para responder a uma pergunta de acesso sem abrir o banco.

#### Critérios de aceite

1. ONDE quem abre Configurações é Dono_ou_Administrador, O índice de Configurações DEVE mostrar o item "Registro de dados".
2. SE quem abre o endereço do Registro de dados não é Dono_ou_Administrador, ENTÃO O Hub DEVE responder "não encontrado", e O índice de Configurações DEVE esconder o item.
3. QUANDO o Dono_ou_Administrador abre a Página_Registro, A Página_Registro DEVE listar, da mais nova para a mais antiga, 50 leituras por página, cada uma com quando, quem, qual agente, o que foi lido, o resultado e quantas linhas.
4. QUANDO o Dono_ou_Administrador escolhe um filtro de pessoa, agente, tabela ou resultado, A Página_Registro DEVE listar só as leituras que passam no filtro e guardar o filtro no endereço.
5. QUANDO o Dono_ou_Administrador abre uma leitura, A Página_Registro DEVE mostrar quem, qual agente, a conversa, a tabela, a consulta, o resultado, as linhas e o tempo, com **Abrir a conversa** quando a conversa é conhecida e **Copiar a consulta** quando há consulta.
6. QUANDO o Dono_ou_Administrador toca em **Exportar**, A Página_Registro DEVE baixar um arquivo CSV com até 5000 leituras do filtro atual, da mais nova para a mais antiga.
7. ENQUANTO o Registro_de_Dados não tem leitura nenhuma, A Página_Registro DEVE mostrar "Nenhuma leitura ainda." e o que vai aparecer ali.
8. ENQUANTO a Página_Registro carrega, A Página_Registro DEVE mostrar esqueletos nas linhas.
9. SE o Hub não responde, ENTÃO A Página_Registro DEVE mostrar "Não deu para ler o registro agora." com **Tentar de novo**.
10. A Página_Registro DEVE mostrar só os campos do critério 5, sem valor nenhum das linhas lidas.
