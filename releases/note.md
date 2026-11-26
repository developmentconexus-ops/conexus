# v0.24.132

Esta versão publica o que entrou no `main` em 25 e 26/11 depois da v0.24.131: o conserto da gravação da
cópia no lago, o fechamento da etapa "Uma sala e os nomes certos" e o conserto de uma permissão que
tinha parado a publicação anterior. A cópia e o lago são da etapa "A primeira cópia chega ao lago".

**A cópia na nuvem não gravava a versão de hoje de cada tabela.** Na v0.24.131, a primeira cópia feita
pela máquina de cópia na nuvem leu e guardou as tabelas marcadas, mas parou antes de atualizar a versão
de hoje, e nenhuma tabela chegou a ela. A rodada terminava com **Não deu para gravar no lago. A próxima
rodada tenta de novo.**, mas as seguintes parariam no mesmo ponto. Faltava uma permissão na AWS, e esta
versão a dá (https://github.com/developmentconexus-ops/conexus/issues/1422).

**Um lago que já existe precisa ser apagado e criado de novo.** O conserto só vale num lago criado
depois desta publicação, porque o Conexus ainda não atualiza um lago já criado
(https://github.com/developmentconexus-ops/conexus/issues/1424). Um lago criado antes continua
falhando. Para trocar o lago:

1. Na **Central**, em **Clientes**, abra a empresa. Em **Lago de dados**, clique **Apagar o lago**,
   digite o nome da empresa e confirme.
2. Quando aparecer **Esta empresa ainda não tem lago.**, clique **Criar o lago** e espere o **Pronto**.
3. Na empresa, em **Integrações**, abra cada ligação que copiava, vá à aba **Tabelas** e clique
   **Escolher o que copiar**. Marque as tabelas, escolha a data em **Desde**, escolha o **Intervalo** e
   clique **Ligar e copiar agora**.

**O que se perde ao apagar o lago.** Sai tudo o que foi copiado para ele, sem volta. Saem também, de
cada ligação, as tabelas marcadas, o intervalo, a data e o histórico de rodadas. As ligações ficam, e o
dado continua nos sistemas da empresa. A primeira rodada no lago novo lê tudo outra vez, desde a data
escolhida, e pode levar horas.

**Como a cópia funciona no lago novo.** Estas regras vieram na v0.24.131. Na nuvem, as que falam da
versão de hoje dependem da gravação que este conserto corrige.

- Depois da primeira cópia inteira, cada cópia seguinte lê só o que mudou numa tabela em **Só o que
  mudou**. Numa tabela em **Janela por mês**, lê de novo os meses recentes e os que passaram desde a
  rodada anterior. Uma tabela **Inteira** é lida toda a cada rodada.
- O lago fica com uma linha por registro, com o valor de hoje do sistema de origem. Uma linha apagada na
  origem sai numa leitura inteira da tabela ou, numa **Janela por mês**, quando o mês dela é lido de
  novo. Se a origem esvaziou um mês inteiro, as linhas dele só saem numa leitura inteira.
- Quando a leitura de uma tabela falha, as tabelas lidas até o fim naquela rodada entram no lago. A que
  parou no meio e as que nem começaram ficam como estavam. A tela mostra a falha, com **Parou em** e o
  nome da tabela, seguido do motivo.
- Desmarcar uma tabela e **Desligar** uma ligação funcionam também quando a cópia nunca guardou até onde
  leu.
- A tabela de notas NF-e é copiada inteira. Uma cópia real, feita antes da v0.24.131 com o conserto
  dessa tabela, leu e gravou 261.444 linhas, sem nenhum erro 500.

**O que ainda não está provado no ar.** Falta ver a máquina de cópia na nuvem gravar no lago a versão de
hoje de cada tabela. Os testes automáticos conferem as permissões como estão escritas, e não o que a AWS
faz com elas. Se a AWS recusar outro passo da gravação, a rodada volta a terminar com **Não deu para
gravar no lago.** Isso é conferido logo depois desta publicação.

**O agente da empresa trabalha com o ícone de agente.** Na conversa com um agente salvo, a linha de
trabalho, como **Vendas trabalhando**, e a linha **esperando sua resposta** levam o ícone de agente,
igual à assinatura da resposta. No celular, vale também para a linha de espera no alto do cartão. As
conversas com o Conexus, em **Construir**, **Agentes** e **Conversas**, continuam com a marca dele.

**O Conexus chama o botão pelo nome da tela.** Quando o Conexus propõe uma mudança no app de um Projeto,
ele agora cita o botão **Mandar para Construir**. Antes falava em "Mandar ao Construtor de apps", um nome
que o botão não tem. Com estas duas mudanças, a etapa "Uma sala e os nomes certos" fecha. O resto do
fechamento é documentação do projeto e não muda tela.

**A publicação da v0.24.131.** A primeira tentativa parou porque a conta da AWS não deixava criar o lugar
onde a cópia guarda até onde leu (https://github.com/developmentconexus-ops/conexus/pull/1414). A
permissão foi dada à conta, a v0.24.131 entrou no ar na segunda tentativa, e esta publicação não pede
outro passo na conta antes de sair.

Segue a etapa A primeira cópia chega ao lago.
