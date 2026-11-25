# v0.24.123

Esta versão publica o que entrou no `main` em 24 e 25/11 depois da v0.24.122: o Conexus passa a
assinar as respostas e o menu do Projeto ganha grupos, a segunda etapa do harness ("Uma sala e os
nomes certos") avança por dentro, e o Lago ganha a base da primeira cópia, ainda sem tela.

**O Conexus assina.** Em Construir, em Agentes e em Conversas, quem responde passa a ser o **Conexus**,
com a marca dele. Um agente salvo continua assinando com o nome e o ícone dele. Os textos da tela e as
frases de falha que citavam o Builder, o Construtor ou o Assistente agora dizem "Conexus". O botão que
leva um pedido do Assistente para o app passa a se chamar "Mandar para Construir", e o outro, "Abrir
em Construir".

**O menu do Projeto em grupos.** O menu lateral do Projeto tem quatro grupos com título: "O app",
"Agentes", "Dados" e "O Projeto". Um membro do Projeto vê "Agentes" só com Conversas e "Dados" só com
Integrações.

**Conversas.** Começar uma conversa, em qualquer um dos lugares, segue o mesmo caminho e a mesma
recusa de antes. O menu de uma conversa só mostra as ações que a lista oferece: na lista do Assistente
continuam **Renomear** e **Apagar**, e uma lista sem ação não mostra menu. Uma conversa do Construtor
de agentes aberta pelo endereço antigo abre a mesma conversa no endereço novo, e quem não é dono dela
vê a mesma tela de "não achada" nos dois.

**Automações.** O agendador deixa de apagar uma automação por uma falha passageira: só apaga depois de
cinco conferências seguidas sem encontrá-la. Renomear o fluxo de uma automação continua apagando-a, em
cerca de 50 segundos, e isso agora está dito na documentação.

**O Lago.** A primeira cópia de uma ligação para o lago ganhou a base: o kit de conectores declara as
tabelas que uma ligação copia, a tarefa que faz a cópia e a plataforma dela na AWS estão prontas, e o
Hub guarda as cópias e deixa a empresa ler a sua linha do lago. Ainda não há tela nem rodada no Hub.
Uma cópia de prova já rodou de dentro da AWS.

**Por dentro.** O código do servidor e da web foi reorganizado por dono, a etapa O Builder vê o que
construiu foi fechada e o método passou a juntar as unidades de uma etapa em poucos pull requests:
organização interna, sem mudança no que a pessoa vê.

Segue a etapa Uma sala e os nomes certos, e a parte 1 do Lago 2.
