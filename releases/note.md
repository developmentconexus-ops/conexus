# v0.24.110

Esta versão põe no ar duas etapas juntas e é a primeira publicada pelo merge desta nota.

**A Prévia em endereço próprio.** O app publicado continua no endereço que as pessoas salvam, como
`estoque--metal-nobre.conexusapp.tech`. A Prévia passa a abrir dentro do Hub no seu próprio
endereço, `estoque--metal-nobre--previa.conexusapp.tech`, e a barra da Prévia mostra esse endereço.
Cada endereço guarda a sua entrada, e uma não derruba mais a outra. Nenhuma página, nem o Hub,
mostra mais o app publicado dentro de outra página. Quem abre o endereço da Prévia numa aba vê "A
Prévia abre dentro do Conexus." e o botão **Abrir o Conexus**.

**O lago da empresa nasce e some.** Na Central, a página do cliente ganha o bloco **Lago de dados**.
O operador cria o lago da empresa com **Criar o lago** e o apaga com **Apagar o lago**, digitando o
nome da empresa, sem abrir o console da AWS. O lago nasce vazio: é o lugar só daquela empresa onde
as cópias dos dados vão morar nas próximas etapas. Se uma criação falha, o bloco diz "Não deu para
criar o lago." e oferece **Tentar de novo**, e o Hub apaga o que tiver sobrado.

**A publicação pelo merge da nota.** A versão vai ao ar quando este pull request, que muda só esta
nota, é mesclado: o mesmo workflow cria a tag e a Release com este texto e publica o Hub e a borda.
