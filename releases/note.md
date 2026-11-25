# v0.24.130

Esta versão publica o que entrou no `main` em 25/11 depois da v0.24.129: o protótipo da seção **Tabelas no
lago**, a regra do que **Dados** lista e as ações que ficam à vista, desligadas, para quem não gerencia
cópias. Todas são da etapa "A primeira cópia chega ao lago".

**Dados lista só o que pode ir para o lago.** Antes, toda ligação ativa aparecia em **Dados**, e a do
Mercado Livre mostrava "Escolha o que copiar na página da ligação" numa página onde não há o que escolher
(https://github.com/developmentconexus-ops/conexus/issues/1394). Agora **Dados**, na página e na árvore,
lista a ligação ativa cujas tabelas podem ir para o lago e a ligação, de qualquer estado, que já tem
tabela no lago. O Mercado Livre e o HubSpot deixam de aparecer. Uma ligação parada que nunca teve tabela
no lago também não aparece. Sem nenhuma ligação na lista, a página e a árvore dizem "Nenhum sistema ligado
ainda".

**Quem não gerencia cópias vê as ações e sabe quem pode.** **Escolher o que copiar** e **Ler de novo desde
a data** ficam à vista e desligados para quem não gerencia cópias, com a frase "Só quem gerencia as cópias
muda o que se copia." **Outras tabelas** continua escondido para essa
pessoa. O painel do link gerado diz a quem não gerencia cópias: "Peça a quem gerencia as cópias para
escolher o que copiar."

**A seção Tabelas no lago fala como o protótipo.** A seção abre com "As linhas ficam no lago da empresa.
Marque outra tabela e salve: ela começa inteira, numa rodada só dela. O nome das que já existem não muda
mais." Numa ligação sem cópia, quem gerencia cópias lê "Escolha as tabelas do <sistema>, quando copiar e
desde que data. As linhas ficam no lago da empresa." e quem não gerencia lê só "As linhas ficam no lago da
empresa." Havendo data, a linha de cada tabela diz "· desde <data>", e a tabela que a data não limita diz
"· todo o histórico". Os detalhes e o resumo ao lado de **Salvar** seguem com "Desde <data>".

**As abas cabem no celular.** A faixa de abas da página de uma tabela em **Dados** não mostra mais as
setas de rolagem vertical que apareciam em navegadores com barra de rolagem clássica
(https://github.com/developmentconexus-ops/conexus/issues/1385). Em telas estreitas, as abas encolhem para
caber, como as abas do Projeto, e a página não estoura de lado.

**O passo Acesso da janela Ligar.** Tem só **Continuar** e o X. O botão **Cancelar** saiu.

**O que a segunda cópia real mostrou na v0.24.129.** O conserto do decimal funcionou. Com a cópia de três
tabelas do Sankhya, as notas (2.685 linhas de 2.685) e as de EFD (226.064 de 226.064) foram lidas e
gravadas no lago. A tabela de notas NFe parou: o Sankhya respondeu com um erro 500 (Internal Server
Error), a rodada fechou com erro e nada dessa tabela chegou ao lago (0 de 0). O Hub mostra isso como "a
próxima rodada tenta de novo", e a tela não deixa ver que a tabela pode falhar sempre. Ainda não se sabe se
o erro vem do Sankhya ou do que a cópia pede. Isso segue aberto, na issue
https://github.com/developmentconexus-ops/conexus/issues/1400, e esta versão não muda nada nisso.

Segue a etapa A primeira cópia chega ao lago.
