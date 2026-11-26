# v0.24.135

Esta versão publica o que entrou no `main` em 26/11 depois da v0.24.134: o conserto do **Parar cópia**,
a internet das máquinas dos agentes pelas listas, ainda sem tela, o começo do tratamento do lago, o
desenho novo do Hub e documentos do projeto.

**Esta versão pede um passo seu. Depois da publicação, apague o lago e crie de novo.** A receita do lago
mudou. Ela ganhou as áreas **Tratado** e **Negócio** e um acesso próprio na AWS para o tratamento, e o
Conexus ainda não atualiza um lago já criado (https://github.com/developmentconexus-ops/conexus/issues/1424).
Num lago criado antes, a **Central** diz **Este lago é de uma receita anterior. Para tratar o dado,
apague e crie o lago de novo.**

1. Na **Central**, em **Clientes**, abra a empresa. Em **Lago de dados**, clique **Apagar o lago**,
   digite o nome da empresa e confirme.
2. Quando aparecer **Esta empresa ainda não tem lago.**, clique **Criar o lago** e espere o **Pronto**.
3. Na empresa, em **Integrações**, abra cada ligação que copiava, vá à aba **Tabelas** e clique
   **Escolher o que copiar**. Marque as tabelas, escolha a data em **Desde**, escolha o **Intervalo** e
   clique **Ligar e copiar agora**.

**O que se perde ao apagar o lago.** Sai tudo o que foi copiado para ele, sem volta. Saem também, de
cada ligação, as tabelas marcadas, o intervalo, a data e o histórico de rodadas. As ligações ficam, e o
dado continua nos sistemas da empresa. A primeira rodada no lago novo lê tudo outra vez, desde a data
escolhida, e pode levar horas. Uma mudança futura na receita do lago pode pedir este passo outra vez.
Como evitar isso ainda não foi decidido (https://github.com/developmentconexus-ops/conexus/issues/1431).
Você não precisa mexer na conta da AWS.

**O Parar cópia foi consertado** (https://github.com/developmentconexus-ops/conexus/pull/1464).

- Numa tabela que já terminou a primeira carga, a cópia parada continua de onde parou, mesmo quando você
  para nos primeiros minutos. Uma tabela que ainda não terminou a primeira carga continua começando do
  zero, e uma tabela **Inteira** continua sendo lida desde o começo.
- Parar uma rodada de **Ler de novo desde a data** não abandona mais a releitura. A próxima cópia a
  continua.
- A rodada parada mostra as linhas que leu e gravou. Se a máquina de cópia não conseguir encerrar a
  tempo, a rodada fica sem a contagem.
- Quando você muda a data da cópia para uma data mais antiga, uma leitura inteira que ficou pela metade é
  planejada de novo, para não pular os meses entre as duas datas.

**As máquinas dos agentes passam a seguir as listas de internet.** Vale para as conversas em
**Conversas**, com um agente salvo, em **Construir** e na construção de agentes
(https://github.com/developmentconexus-ops/conexus/pull/1467).

- Toda máquina nasce com uma lista pronta, que tem os pacotes do npm e do PyPI, o GitHub e os
  repositórios do Debian. Com ela, a máquina alcança mais do que antes. Em **Construir** e na construção
  de agentes, as máquinas alcançavam só o npm. Nas outras conversas, alcançavam o npm e o PyPI. O GitHub
  está na lista por escolha sua, e ele também é um caminho por onde um dado pode sair.
- Além da lista pronta, a máquina abre o que estiver na lista da empresa e na lista da conversa. Com a
  **Internet toda** ligada pelo dono, ela abre qualquer domínio. A internet toda começa desligada
  (https://github.com/developmentconexus-ops/conexus/pull/1458 e
  https://github.com/developmentconexus-ops/conexus/pull/1459).
- O agente ganhou o pedido de acesso a um domínio. O agente salvo sem **Computador** não o tem.

**O pedido de internet ainda não tem tela. Ela vem na parte seguinte da etapa.** Enquanto isso:

- Quando o dono, o administrador ou o desenvolvedor está na conversa e o agente pede um domínio fechado,
  a conversa fica esperando uma resposta e não mostra nenhum botão para dar. Clique **Parar** para
  seguir. O domínio continua fechado.
- Para um membro e numa automação, não há pedido, e o domínio fica fechado. O agente pode dizer que o dono
  ou um administrador libera em **Configurações, Internet**, uma seção que ainda não existe.
- Não há tela para mudar a lista da empresa nem para ligar a internet toda.

A publicação aplica no banco de dados as migrações da internet toda.

**Começou o tratamento do lago** (https://github.com/developmentconexus-ops/conexus/pull/1430). O lago
novo nasce com as áreas **Tratado** e **Negócio**. O acesso do tratamento na AWS lê as tabelas copiadas,
grava só nas duas áreas novas e não alcança a senha do sistema de origem. Entraram o molde das tabelas
tratadas do Sankhya (notas, itens das notas, parceiros e produtos) e a tarefa que vai tratar o dado.
**Nada disso gera tabela ainda.** O Conexus não chama essa tarefa, e a tela de **Dados** continua como
estava.

**O Hub ganhou o desenho novo** (https://github.com/developmentconexus-ops/conexus/pull/1454). O menu e
as áreas continuam os mesmos.

- A barra lateral e a moldura são grafite nos temas claro e escuro. No computador, a página fica encaixada
  na moldura, com os cantos arredondados. As caixas brancas trocam a borda por sombra.
- O amarelo ipê aparece forte no botão principal, na chave e na caixa ligadas, no progresso e no enviar.
  O item aberto na barra tem o fundo mais claro e o ícone em ipê.
- No tema claro, os textos em vermelho, verde e laranja ficaram mais escuros, para ler melhor.
- Em **Configurações**, salvar o modelo em **Meus padrões** ou em **Padrões da empresa** mostra o aviso
  **Padrão salvo**, que some sozinho.

**O Hub também ganhou movimento** (https://github.com/developmentconexus-ops/conexus/pull/1444). Menus,
dicas, janelas, gavetas e painéis entram e saem com um movimento curto, e o botão cede ao toque. Na troca
de tela, a área central esmaece, menos com uma gaveta ou uma janela aberta. Um clique dado nesse
instante pode se perder. Com **reduzir movimento** ligado no seu sistema, nada anima.

**Documentos do projeto.** Nada abaixo muda o Conexus que você usa.

- A primeira parte do lago, **A primeira cópia chega ao lago**, fechou com o registro do seu uso. O que
  ficou aberto está em https://github.com/developmentconexus-ops/conexus/issues/1461
  (https://github.com/developmentconexus-ops/conexus/pull/1466).
- Entrou o plano aprovado da etapa **O primeiro modelo vira tabela tratada**
  (https://github.com/developmentconexus-ops/conexus/pull/1418), e a ordem das etapas do lago foi
  atualizada (https://github.com/developmentconexus-ops/conexus/pull/1470).
- Entrou o plano da etapa **A base visual e o movimento** e das etapas seguintes do redesenho
  (https://github.com/developmentconexus-ops/conexus/pull/1427). O plano de publicar pela nota mudou de
  vaga para essa etapa poder entrar (https://github.com/developmentconexus-ops/conexus/pull/1469).
- Entrou uma conferência mais leve, que roda no computador de quem constrói antes de cada mudança
  (https://github.com/developmentconexus-ops/conexus/pull/1451).

**O que ainda não está provado no ar.** Quando esta nota foi escrita, o conserto do **Parar cópia** tinha
sido testado com um substituto da AWS. As listas de internet tinham sido testadas com substitutos da
máquina e do modelo de inteligência artificial, e o teste com a máquina de verdade não rodou. O lago com
a receita nova ainda não tinha sido criado na instalação da nuvem. O desenho e o movimento só foram
testados no Chromium: faltam Safari, Firefox, um celular de verdade e um leitor de tela. A conferência no
Hub vem depois da publicação.

Seguem as etapas O primeiro modelo vira tabela tratada, A rede e o navegador sob pedido e A base visual
e o movimento.
