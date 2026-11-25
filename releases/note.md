# v0.24.129

Esta versão publica o que entrou no `main` em 25/11 depois da v0.24.128: o conserto que faltava para a
cópia de uma tabela com números de muitas casas decimais, da etapa "A primeira cópia chega ao lago", e a
máquina das conversas montada num lugar só.

**A cópia não para mais num número de muitas casas decimais.** A primeira cópia real do Sankhya parou
na primeira tabela, com as linhas lidas e nenhuma gravada no lago, porque um valor tinha mais casas
decimais do que a coluna comportava
(https://github.com/developmentconexus-ops/conexus/issues/1380). Agora a cópia lê do dicionário do
Sankhya quantas casas cada coluna declara e grava o número com essa escala. Um número cuja coluna não
declara escala é arredondado na nona casa decimal, para cima a partir de 5, e a cópia segue. O resultado
da rodada diz quantas células foram arredondadas, por tabela.

**O que continua parando a cópia.** Um número cuja parte inteira tem mais de 29 dígitos ainda derruba a
rodada, e nada dessa leva de linhas é gravado. Uma coluna que declara escala e recebe um valor com mais
casas do que ela declarou também derruba a leva: a cópia mostra o erro em vez de arredondar em silêncio.

**O que muda na tela.** Nada. Nenhuma tela mudou nesta versão. A contagem de células arredondadas fica
no resultado da rodada e no registro do servidor, e não aparece em **Dados**; mostrá-la ali é a issue
https://github.com/developmentconexus-ops/conexus/issues/1388.

**O que ainda não funciona.** Numa tabela do lago que já tem dados, trocar a escala de uma coluna ainda
não é tratado: o lago mantém o tipo antigo da coluna sem avisar
(https://github.com/developmentconexus-ops/conexus/issues/1387). As duas tabelas vazias que o laboratório
já tinha criado para as notas foram apagadas antes da primeira rodada com dados, para nascerem com a
escala certa.

**O que ainda não foi provado.** Uma cópia real com os dados da empresa ainda não rodou nesta versão. Os
testes cobrem os números de dez casas, a escala declarada e a parte inteira grande, mas só uma nova
rodada real confirma que a tabela das notas chega ao lago.

**A máquina das conversas, num lugar só.** Nada muda na tela. A máquina do **Assistente**, do **Construtor
de agentes** e de um agente salvo passa a ser montada num lugar só, a partir da ficha de cada agente, em
vez de repetida em cada um. Ter um Workspace por sessão no **Construtor de apps** fica para depois, guardado na issue
https://github.com/developmentconexus-ops/conexus/issues/1395.

Segue a etapa A primeira cópia chega ao lago.
