# v0.24.134

Esta versão publica o que entrou no `main` em 26/11 depois da v0.24.133: um conserto de segurança nos
cartões dos agentes, a primeira parte da etapa "A rede e o navegador sob pedido", duas emendas ao plano
dessa etapa e um ajuste numa conferência automática do projeto.

**Um agente não responde mais por você num cartão que ele abriu.** Em alguns cartões o agente para e
espera a sua resposta, como numa pergunta, num plano, com **Aprovar e construir** e **Pedir ajustes**, ou
em **Gravar no Caderno?**. O trabalho desse cartão só continua com a resposta que a pessoa deu. Um passo
que chega com uma resposta que ninguém deu é recusado, e o Conexus não o executa. Para você, os cartões
aparecem e são respondidos como antes.

**Entrou a base das listas de domínios, ainda sem tela.** O Conexus passa a ter onde guardar os
domínios da internet liberados, numa lista da empresa e numa lista de cada conversa
(https://github.com/developmentconexus-ops/conexus/pull/1437). Entraram também os caminhos internos para
a lista da empresa: o dono e o administrador podem mudá-la, e todo membro pode lê-la
(https://github.com/developmentconexus-ops/conexus/pull/1438).

**Essas listas ainda não têm tela e não mudam nada do que você vê.** Os agentes alcançam na internet o
mesmo de antes, porque as máquinas deles ainda não consultam as listas. A publicação aplica no banco de
dados as migrações que criam as duas listas e as permissões delas. As listas começam vazias.

**O plano da rede ganhou duas emendas.** São só documentos: nada do que elas descrevem está nesta versão.

- A primeira registra o que foi aprovado em 26/11. O plano passa a prever que o Construtor de apps e o
  Construtor de agentes também peçam domínio pelo cartão, que o desenvolvedor libere um domínio só para
  a conversa em que está, que toda máquina nasça com uma lista pronta de desenvolvimento e que o dono
  possa ligar **Internet toda**, com um aviso
  (https://github.com/developmentconexus-ops/conexus/pull/1449).
- A segunda corrige pontos do plano que não batiam com o programa, sem decisão nova
  (https://github.com/developmentconexus-ops/conexus/pull/1450).

**Um ajuste na conferência automática do projeto.** Uma das conferências que rodam antes de cada mudança
parava quando o plano de uma etapa tinha uma parte numerada com letra. Agora ela lê essas partes
(https://github.com/developmentconexus-ops/conexus/pull/1445). Isso não muda o Conexus que você usa.

**Esta versão não pede nenhum passo seu.** Ela não pede para apagar o lago nem para mexer na conta da
AWS.

**O que ainda não está provado no ar.** Quando esta nota foi escrita, o conserto dos cartões tinha
passado pelos testes automáticos, que usam um substituto no lugar do modelo de inteligência artificial.
Nenhum modelo de verdade tinha sido chamado. A conferência no Hub vem depois da publicação.

Seguem as etapas A primeira cópia chega ao lago e A rede e o navegador sob pedido.
