# v0.24.136

Esta versão publica o que entrou no `main` depois da v0.24.135. São o tratamento do lago, da etapa
**O primeiro modelo vira tabela tratada**, o cartão e a tela de internet dos agentes e um documento do
projeto.

**A receita do lago não muda nesta versão.** Se você apagou e criou o lago depois da v0.24.135, não
precisa repetir. Se ainda não fez isso, siga antes os passos da nota daquela versão, que também diz o
que se perde (https://github.com/developmentconexus-ops/conexus/releases/tag/v0.24.135). Sem esse
passo, o lago antigo não trata, e a **Central** diz **Este lago é de uma receita anterior. Para tratar o
dado, apague e crie o lago de novo.**

**Dados ganhou as camadas do lago.** **Bruto** passa a se chamar **Copiado**, e entram **Tratado** e
**Negócio**. Só o dono e o administrador usam as duas camadas novas. Os outros papéis leem **Seu papel
ainda não lê nenhuma tabela. Peça a quem administra a empresa.**
(https://github.com/developmentconexus-ops/conexus/pull/1471,
https://github.com/developmentconexus-ops/conexus/pull/1475,
https://github.com/developmentconexus-ops/conexus/pull/1482 e
https://github.com/developmentconexus-ops/conexus/pull/1486)

**Tratado: as tabelas limpas do Sankhya.**

- São **Notas e pedidos**, **Itens das notas**, **Parceiros (clientes e fornecedores)** e **Produtos**.
  Cada uma aparece quando a tabela de origem está na cópia.
- Você não liga nada. Quando a cópia de uma delas termina bem, o Conexus abre uma rodada e grava a
  tabela tratada. Antes disso, a linha diz **Esperando a próxima cópia**. Depois, mostra quantas linhas
  a tabela tem e a hora.
- Ao abrir uma tabela, você vê **Visão geral**, **Colunas** (nome, tipo em português e a descrição que
  veio da cópia), **De onde vem** e **Quem lê**.
- **Tratar agora** roda tudo o que há para tratar. Durante a rodada, **Parar** fica ao lado e pede
  confirmação. O botão vira **Parando…**, e depois o topo de **Tratado** diz **Parada por**, com o nome
  de quem parou e a hora. O que a rodada já gravou fica.

**Negócio: a sua regra em SQL.**

- **Novo tratamento** pede o nome, o que conta como a tabela e um `SELECT`. No SQL, cada tabela leva a
  área na frente, que é `current` (o que foi copiado), `tratado` ou `negocio`. O Conexus confere o SQL
  ao salvar e recusa, por exemplo, uma tabela que a empresa não tem ou um erro de escrita.
- Salvar cria uma **Proposta, à espera do sim**, e nada roda. **Ligar** mostra o SQL e as tabelas que
  ele lê. Nada roda nesse clique. Para gravar a tabela em `negocio` na hora, clique **Tratar agora** na
  camada **Tratado**. A cópia seguinte das tabelas de que ela depende também a grava.
- **Propor mudança** cria uma versão nova. A versão ligada continua valendo até você ligar a nova. A
  aba **Versões** mostra quem propôs e quem ligou cada uma.
- O SQL roda com o acesso de tratamento da AWS, que não alcança a senha do sistema de origem.

**O que saber antes de usar o tratamento.**

- Cada rodada apaga e cria de novo as tabelas que grava. Enquanto uma tabela é regravada, ela fica fora.
  Na prova do laboratório, uma tabela de 100 mil linhas e 450 colunas ficou fora por cerca de 25
  segundos.
- Se o SQL de uma tabela falha, ela fica fora até a próxima rodada boa, mesmo que existisse antes.
  **Dados** mostra **A última rodada falhou**, com o motivo. As tabelas que dependem dela não rodam
  nessa vez.
- Tirar uma tabela da cópia apaga também a tratada dela. Apagar o lago apaga todas. Os tratamentos e as
  versões ficam no Conexus e voltam a rodar no lago novo.
- Ainda não dá para apagar um tratamento. Também não há conferência de qualidade que trave a tabela,
  prévia antes de ligar nem agente de dados. O Assistente e os apps ainda não leem **Tratado** nem
  **Negócio**.
- Há ajustes de tela para depois (https://github.com/developmentconexus-ops/conexus/issues/1491). Um
  deles aparece logo no uso. Um tratamento proposto e nunca ligado diz **Esperando a próxima cópia**,
  mas só roda depois do seu sim.

**A internet dos agentes ganhou o cartão e a tela** que faltavam na v0.24.135
(https://github.com/developmentconexus-ops/conexus/pull/1478).

- Quando um agente pede um domínio fechado, a conversa mostra o cartão **O Conexus quer acessar a
  internet**, com os domínios e o motivo. O dono e o administrador escolhem **Liberar nesta conversa**,
  **Liberar para a empresa** ou **Recusar**. O desenvolvedor libera só na conversa.
- Um membro não tem botões para liberar, e uma automação também não. O Conexus diz quem pode.
- **Configurações, Internet** mostra a lista que vem com o Conexus, a chave **Internet toda** e a
  **Lista da empresa**. Só o dono liga a internet toda, depois de ler o aviso. O dono e o administrador
  adicionam e removem domínios da lista da empresa. Os outros só leem.

A publicação aplica no banco de dados as migrações do tratamento.

**Documento do projeto.** Entrou a regra de tela da casca nova do Hub, que ainda não foi construída
(https://github.com/developmentconexus-ops/conexus/pull/1474). Nada muda no Conexus que você usa.

**O que ainda não está provado no ar.** Quando esta nota foi escrita, o motor do tratamento só tinha
rodado na AWS na prova do laboratório, com dado gerado. A rodada inteira, do fim da cópia à tabela em
**Dados**, e o **Parar** dela só tinham sido testados com um substituto da AWS. O cartão e a tela de
internet só tinham sido testados com substitutos, sem a máquina de verdade. As telas novas foram vistas
no Chromium, e faltam os outros navegadores e um celular de verdade. A conferência no Hub vem depois da
publicação.

A etapa O primeiro modelo vira tabela tratada fecha depois que você a usar pelo roteiro do cartão. As
etapas A rede e o navegador sob pedido e A base visual e o movimento também seguem abertas.
