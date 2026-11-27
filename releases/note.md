# v0.24.137

Esta versão publica o que entrou no `main` depois da v0.24.136. É o conserto de um defeito do
tratamento do lago, achado no roteiro de uso da etapa **O primeiro modelo vira tabela tratada**
(https://github.com/developmentconexus-ops/conexus/issues/1498 e
https://github.com/developmentconexus-ops/conexus/pull/1499).

**O que acontecia.** Num lago recém-criado, **Tratado** mostrava **Notas e pedidos** com 0 linhas, e
**Itens das notas**, **Parceiros (clientes e fornecedores)** e **Produtos** com **A última rodada
falhou: o motor de tratamento falhou**. A cópia cria a tabela vazia no começo e grava o dado só depois
de ler todas as tabelas. Uma rodada de tratamento aberta nesse intervalo tratava a tabela ainda vazia,
que saía com 0 linhas, e falhava nas que ainda não existiam. A mensagem também escondia a causa. O
acesso de tratamento da AWS não podia consultar o banco de **Copiado**, e a falta de uma tabela voltava
como acesso negado.

**O que muda.**

- Uma rodada, aberta por uma cópia ou por **Tratar agora**, deixa de fora o tratamento que lê uma
  tabela cuja primeira cópia não terminou. Vale também para quem a lê por meio de outro tratamento. A
  tabela que nunca rodou continua em **Esperando a próxima cópia**, e a rodada da cópia que terminar
  bem a grava.
- Se você clica **Tratar agora** e todos os tratamentos ainda esperam a primeira cópia, nada roda, e a
  tela diz **A primeira cópia das tabelas ainda não terminou. O tratamento roda quando ela terminar.**
  Se só alguns esperam, os outros rodam.
- Uma tabela que você tirou da cópia não segura ninguém. O tratamento que a lê entra na rodada e mostra
  a falha.
- Num lago criado a partir desta versão, a falta de uma tabela de **Copiado** aparece como **o Athena
  recusou o SQL (TABLE_NOT_FOUND)**, e não como **o motor de tratamento falhou**.

**Não precisa apagar nem recriar o lago.** Um lago criado na v0.24.135 ou na v0.24.136 continua
tratando. Ele só não ganha a mensagem nova da tabela que falta. Um lago de antes da v0.24.135 ainda
precisa dos passos da nota daquela versão, que também diz o que se perde
(https://github.com/developmentconexus-ops/conexus/releases/tag/v0.24.135).

**Se o seu lago mostra o defeito.** Espere a cópia das tabelas terminar em **Copiado**. Depois, na
camada **Tratado**, clique **Tratar agora**. A rodada apaga e grava de novo as tabelas tratadas que já
podem rodar, e cada uma fica fora enquanto é regravada.

A publicação não muda nenhuma tabela do banco de dados.

**Documento do projeto.** A frase nova da tela e a emenda do cartão da etapa estão no arquivo de
aprovação.

**O que ainda não está provado no ar.** Quando esta nota foi escrita, **Tratar agora** e o fim de uma
cópia com o código novo só tinham sido testados com um substituto da AWS. A permissão nova foi provada
na AWS num lago de teste do laboratório, com empresa inventada. A frase nova passou em teste de tela e
não foi vista no navegador. Não houve cópia real do Sankhya com o código novo. A conferência no Hub vem
depois da publicação.

A etapa O primeiro modelo vira tabela tratada continua aberta até você a usar pelo roteiro do cartão.
