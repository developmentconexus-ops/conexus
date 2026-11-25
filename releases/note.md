# v0.24.131

Esta versão publica o que entrou no `main` em 25/11 depois da v0.24.130: a cópia que lê só o que mudou, o
lago com a versão de hoje de cada tabela, o conserto da tabela de notas NF-e e correções nos testes do
projeto. A cópia e o lago são da etapa "A primeira cópia chega ao lago".

**Da segunda cópia em diante, a leitura é só do que mudou, conforme a tabela.** A primeira rodada de
cada ligação depois desta publicação ainda lê as tabelas por inteiro, porque nenhuma cópia guardou até
onde leu. A partir da seguinte, a leitura segue o **Modo** de cada tabela:

- Em **Só o que mudou**, a rodada continua do ponto em que a anterior parou.
- Em **Janela por mês**, a rodada lê de novo os meses recentes e os que passaram desde a rodada anterior,
  e troca esses meses no lago.
- Em **Inteira**, a rodada lê a tabela toda, como antes.

Uma tabela recém-marcada começa com uma leitura inteira. **Rodar agora** segue as mesmas regras, e **Ler
de novo desde a data** relê por inteiro, desde a data, as tabelas que ela limita. Na aba **Rodadas** de uma
tabela, a coluna **Tipo** diz se a rodada leu a tabela inteira ou só o que mudou.

**O lago fica com uma linha por registro, com o valor de hoje.** Um registro que mudou no sistema de origem
substitui a linha antiga em vez de somar outra. Uma linha apagada na origem sai do lago assim:

- Numa tabela **Inteira**, na rodada seguinte.
- Numa tabela **Janela por mês**, quando o mês dela é lido de novo. Se a origem esvaziou o mês inteiro, só
  numa leitura inteira da tabela.
- Numa tabela **Só o que mudou**, só numa leitura inteira dela, como a de **Ler de novo desde a data** nas
  tabelas que a data limita.

**Linhas no lago**, na **Visão geral** de uma tabela, e a coluna **Linhas** da lista em **Dados** passam a
dizer quantas linhas a tabela tem no lago depois da rodada. Antes mostravam um traço.

**Quando uma tabela falha, as que terminaram entram no lago.** As tabelas lidas até o fim naquela rodada
são atualizadas, com as contagens delas. A que parou no meio e as que nem começaram ficam como estavam. A
rodada continua fechando com erro, e a tela diz em qual tabela parou, em **Parou em <tabela>.**, com o
motivo.

**Desmarcar uma tabela e desligar uma ligação.** Desmarcar agora apaga também o registro de até onde a
cópia da tabela leu, e a tabela marcada de novo começa inteira. Desmarcar e **Desligar** funcionam também
quando a cópia nunca guardou esse registro, como nas ligações copiadas antes desta versão.

**A tabela de notas NF-e agora é copiada inteira.** Na v0.24.129, o Sankhya respondeu a essa tabela com um
erro 500 e nada dela chegou ao lago, e a v0.24.130 deixou o problema aberto
(https://github.com/developmentconexus-ops/conexus/issues/1400). Agora a cópia de uma tabela do Sankhya
começa pedindo poucas linhas e ajusta os pedidos seguintes ao tamanho dos dados. Se o Sankhya responde com
erro de servidor ou demora mais de 2 minutos, a cópia pede metade das linhas a partir do mesmo ponto, sem
pular nenhuma. Textos longos, como o XML da nota, chegam inteiros. Se nem uma linha passar, a tabela falha
como antes. Uma cópia real feita com este conserto, antes desta publicação, leu e gravou a tabela por
inteiro, com 261.444 linhas e sem nenhum erro 500.

**O que ainda não está provado no ar.** Falta ver a máquina de cópia na nuvem gravar no lago a versão de
hoje de cada tabela. Isso é conferido logo depois desta publicação.

**Testes do projeto.** As correções nos testes automáticos
(https://github.com/developmentconexus-ops/conexus/pull/1402) não mudam nenhuma tela.

Segue a etapa A primeira cópia chega ao lago.
