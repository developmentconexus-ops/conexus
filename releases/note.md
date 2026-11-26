# v0.24.133

Esta versão publica o que entrou no `main` em 26/11 depois da v0.24.132: o botão **Parar cópia** na
ligação e o método do redesenho das telas, que não muda tela. A cópia e o lago são da etapa "A primeira
cópia chega ao lago".

**Dá para parar uma cópia em andamento.** Em **Integrações**, abra a ligação e vá à aba **Tabelas**.
Enquanto uma rodada está aberta, **Parar cópia** aparece ao lado de **Rodar agora**.

1. Clique **Parar cópia**.
2. Leia a confirmação **Parar a cópia?**. Se alguma tabela ainda não terminou a primeira carga, a
   confirmação diz o nome de cada uma e avisa que a próxima cópia as começa do zero.
3. Confirme em **Parar cópia**. **Cancelar** deixa a rodada continuar.

O botão vira **Parando…** até a rodada fechar. Depois, cada tabela marcada mostra **Interrompida.**, e ao
lado dos botões aparece quem parou e a que horas, como **Parada por Fulano às HH:MM**. A linha mostra a
hora, sem o dia.

Só quem gerencia as cópias pode parar uma rodada. Para as outras pessoas, o botão aparece desligado, como o
**Rodar agora**. Se o Conexus recusa o pedido, a tela diz o motivo e o botão volta. Se o resultado da
rodada chega depois do pedido, vale o resultado.

**O que acontece com o que a rodada já leu.**

- As linhas que a rodada já gravou ficam no lago. A rodada parada não leva à versão de hoje as tabelas
  que ainda não tinha atualizado, mesmo as que já tinha acabado de ler. Uma tabela que a rodada já tinha
  atualizado antes da parada continua atualizada.
- Uma tabela que ainda não terminou a primeira carga **começa do zero** na próxima cópia, mesmo que a
  rodada parada já tivesse lido parte dela ou toda ela. Retomar de onde parou não está nesta versão
  (https://github.com/developmentconexus-ops/conexus/issues/1429).
- Numa tabela que já terminou a primeira carga, a próxima cópia continua de onde parou, e as linhas já
  gravadas chegam à versão de hoje numa rodada seguinte. Uma tabela **Inteira** é lida outra vez desde o
  começo, como em toda rodada.

**Dois pontos em que a tela ainda engana.**

- Parar uma rodada de **Ler de novo desde a data** abandona a releitura. A confirmação diz que a próxima
  cópia continua de onde parou, mas as cópias seguintes não trocam a tabela pela releitura. Para
  refazê-la, clique **Ler de novo desde a data** outra vez
  (https://github.com/developmentconexus-ops/conexus/issues/1434).
- Uma rodada parada pode aparecer com zero linhas lidas e gravadas, embora tenha gravado linhas no lago
  (https://github.com/developmentconexus-ops/conexus/issues/1435).

**Esta versão não pede para apagar o lago.** Também não pede nenhum passo seu na conta da AWS. Um lago
criado antes da v0.24.132 continua precisando ser apagado e criado de novo, como a nota daquela versão
explica (https://github.com/developmentconexus-ops/conexus/issues/1424).

**As regras da cópia que continuam valendo.** Elas vieram na v0.24.131 e não mudam agora.

- Depois da primeira cópia inteira, cada cópia seguinte lê só o que mudou numa tabela em **Só o que
  mudou**. Numa tabela em **Janela por mês**, lê de novo os meses recentes e os que passaram desde a
  rodada anterior. Uma tabela **Inteira** é lida toda a cada rodada.
- O lago fica com uma linha por registro, com o valor de hoje do sistema de origem. Uma linha apagada na
  origem sai numa leitura inteira da tabela ou, numa **Janela por mês**, quando o mês dela é lido de
  novo. Se a origem esvaziou um mês inteiro, as linhas dele só saem numa leitura inteira.
- Quando a leitura de uma tabela falha, as tabelas lidas até o fim naquela rodada chegam à versão de
  hoje. A que parou no meio e as que nem começaram ficam como estavam. A tela mostra a falha, com
  **Parou em** e o nome da tabela, seguido do motivo.
- Desmarcar uma tabela e **Desligar** uma ligação funcionam também quando a cópia nunca guardou até onde
  leu.
- A tabela de notas NF-e é copiada inteira. Uma cópia real, feita antes da v0.24.131 com o conserto
  dessa tabela, leu e gravou 261.444 linhas, sem nenhum erro 500.

**O que ainda não está provado no ar.** Quando esta nota foi escrita, faltava ver a máquina de cópia na
nuvem gravar no lago a versão de hoje de cada tabela. Faltava também apertar o **Parar cópia** na nuvem:
ele foi testado com um substituto da AWS. As duas coisas são conferidas logo depois desta publicação.

**O método do redesenho das telas.** Entraram no projeto o guia de design na nova direção visual e os
documentos que preparam o redesenho (https://github.com/developmentconexus-ops/conexus/pull/1428). São
só documentos: nenhuma tela muda nesta versão por causa deles.

Segue a etapa A primeira cópia chega ao lago.
