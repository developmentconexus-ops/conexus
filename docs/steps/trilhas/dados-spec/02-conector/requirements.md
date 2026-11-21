# Documento de requisitos: parte 2, o conector, com a entrada conversada

**Emenda de 2026-11-21: a marca "só ao vivo" sai.** O fundador decidiu (B1, "a") que a marca `liveOnly` sai do kit, do contrato de acesso e desta spec, junto com a lei da conformidade que a confere. A regra "nunca copiar" passa a ser da ligação de pessoa, que ainda não existe, e entra com o cartão que a criar. Até lá, nesta parte não valem: o requisito 1.1 e o 1.3 na marca `liveOnly`, o requisito 2 inteiro, a 3.3 na parte do conector só ao vivo e o `liveOnly: true` do requisito 8.2; no plano, a unidade 1.2, o grupo 2 e o `liveOnly` da 3.1. A lei saiu no G3 do cartão Registro e conformidade (`packages/hub-api/src/company-data-conformance.ts`), e o campo, de `CatalogSystem` (`packages/hub-api/src/company-data.ts`).

## Introdução

No fim desta parte a dona da empresa liga o Sankhya, o HubSpot e o Gmail pelo mesmo caminho de quatro passos: sistema, acesso, o que copiar e revisão. Todo conector é do kit do Conexus, com o login do kit (decisão do fundador, P3 do índice, registro 0069). Quem não tem a senha recebe um link de 30 minutos e preenche só os campos pedidos. Um sistema só ao vivo, como o Gmail, nunca é copiado, e a tela e a máquina dizem isso. Uma empresa nova entra por uma conversa que aprende a empresa, mostra as etapas e os documentos e leva a ligar o primeiro sistema. As decisões vêm do `design.md` desta pasta, do escopo aprovado (seção 4, telas `p2-01` a `p2-15`, decisões E2a, `T2` e `T3`) e das palavras do fundador ali citadas. O Sankhya real não é lido nesta parte.

## Glossário

- **Kit**: o pacote `packages/connectors`, com a definição de cada conector, as operações, os modelos de cópia, os dublês e a conformidade.
- **Descrição_do_Sistema**: o `SystemDescriptor` que `descriptorOf` tira de um conector do Kit.
- **Conformidade_do_Kit**: `runConformance` de `packages/connectors/src/kernel/conformance.ts`, que todo conector passa contra o seu dublê.
- **Hub**: o servidor `apps/server`, com as rotas de `packages/hub-api`.
- **Banco_do_Hub**: o Postgres do Hub, com as políticas por empresa e a lista de permissões de `apps/server/database-grants.sql`.
- **Contrato_de_Acesso**: `packages/hub-api/src/company-data.ts`, os três verbos descrever, ler e agir.
- **Conformidade_do_Contrato**: `runDataConformance` de `packages/hub-api/src/company-data-conformance.ts`.
- **Construtor**: o agente que constrói apps (Builder) e propõe cópias por `copy_propose`.
- **Página_Integrações**: a página `/companies/{companyId}/integrations` do Hub.
- **Janela_Ligar**: a janela que o botão Ligar abre, com os quatro passos.
- **Página_Dados**: a página do catálogo que a parte 1 constrói no lugar de Cópias.
- **Página_do_Link**: a página pública que o link para outra pessoa abre, sem sessão.
- **App_de_Login**: o app que a instalação registra num sistema de login por autorização, com as chaves no arquivo de `HUB_CONNECTOR_APPS_FILE`.
- **Origem_de_Login**: a origem a que o kit manda a troca e a renovação do token: a do conector, ou a que o login declara em `token.origin`.
- **Conversa_da_Entrada**: a conversa do Assistente marcada `entry`, do cartão da Entrada conversada (PR 982).
- **Assistente**: o agente do Início que conduz a Conversa_da_Entrada.
- **Membro**: uma pessoa da empresa sem a permissão `manageConnections` (nem dona nem administradora).

## Requisitos

### Requisito 1: A descrição do sistema

**História de usuário:** Como dona da empresa, quero ver cada sistema descrito do mesmo jeito, entre por chave ou por autorização, para escolher o que ligar sem saber como ele entra.

#### Critérios de aceite

1. O Kit DEVE dar, para todo conector, uma Descrição_do_Sistema com id, nome, versão, categoria, resumo, logo, `perProject`, assuntos, operações, forma de acesso e a marca `liveOnly`, sem o login, o endereço nem a leitura de cópia.
2. QUANDO uma pessoa abre a Página_Integrações, A Página_Integrações DEVE mostrar, para o Sankhya e para o Mercado Livre, o mesmo nome, categoria, resumo, logo, assuntos e campos que mostra no `main` de `0d4c5730`.
3. QUANDO `listConnections` é pedido, O Hub DEVE responder cada conector com `access` (`FIELDS` com os campos, ou `SIGN_IN`) e `liveOnly`, e sem os campos `auth` e `fields`.
4. SE uma ligação fica precisando religar, ENTÃO A Página_Integrações DEVE mostrar "Pede para conectar de novo" num sistema de acesso `SIGN_IN` e "Chaves recusadas" num sistema de acesso `FIELDS`.

### Requisito 2: A declaração "só ao vivo"

**História de usuário:** Como dona da empresa, quero que um sistema como o Gmail nunca seja copiado, para que nenhum agente leve o meu correio para o banco.

#### Critérios de aceite

1. QUANDO `listConnectionObjects` é pedido numa ligação de sistema só ao vivo, O Hub DEVE responder a lista de tabelas vazia.
2. SE um conector declara `liveOnly` e `copy` juntos, ENTÃO O Kit DEVE recusar o conector em `defineConnector`.
3. SE o Construtor propõe uma cópia de uma ligação de sistema só ao vivo, ENTÃO O Hub DEVE responder `COPY_LIVE_ONLY` e não gravar proposta nenhuma.
4. QUANDO o teste de uma ligação de sistema só ao vivo passa, A Janela_Ligar DEVE pular os passos O que copiar e Revisão e mostrar "nunca é copiado" com o que os agentes consultam na hora (`p2-15`).
5. QUANDO o Contrato_de_Acesso descreve o catálogo, O Contrato_de_Acesso DEVE trazer `liveOnly` em cada sistema.
6. SE uma implementação do Contrato_de_Acesso devolve uma tabela cuja origem é a ligação de um sistema com `liveOnly: true`, ENTÃO A Conformidade_do_Contrato DEVE falhar.
7. A Página_Integrações DEVE mostrar a marca "só ao vivo" em cada sistema que a declara (`p2-04`).
8. ONDE a Página_Dados da parte 1 existe, A Página_Dados DEVE mostrar o sistema só ao vivo ligado com a frase "nunca é copiado" (`p1-01`).

### Requisito 3: O que o sistema oferece para copiar

**História de usuário:** Como dona da empresa, quero ver as tabelas que o sistema oferece, com a descrição e uma amostra, para escolher o que copiar antes da primeira rodada.

#### Critérios de aceite

1. QUANDO quem administra conexões pede `listConnectionObjects` numa ligação ativa, O Hub DEVE responder cada tabela dos modelos de cópia do conector com id, rótulo, descrição, chave, coluna de mudança e colunas com tipo e descrição.
2. QUANDO a empresa já tem a cópia de uma tabela oferecida por aquela ligação, O Hub DEVE responder a tabela com o id dessa cópia em `copy`.
3. SE um conector que não é só ao vivo declara `copy` e não oferece tabela, ou um conector só ao vivo oferece uma tabela, ENTÃO A Conformidade_do_Kit DEVE falhar.
4. SE uma tabela oferecida não tem descrição, uma coluna não tem descrição, a chave falta, a coluna de mudança não está entre as colunas, ou o dublê não responde a primeira página com ao menos uma linha nos tipos das colunas, ENTÃO A Conformidade_do_Kit DEVE falhar.
5. QUANDO quem administra conexões pede `previewConnectionObject`, O Hub DEVE responder no máximo 5 linhas lidas do sistema naquela hora, como o sistema as manda.
6. SE a ligação não está ativa, ENTÃO O Hub DEVE responder 409 `CONNECTION_NOT_READY` a `listConnectionObjects` e a `previewConnectionObject`.
7. SE o sistema recusa a leitura da amostra, ENTÃO O Hub DEVE responder `CONNECTOR_REFUSED` com o status, o código e o corpo que o sistema mandou (code C79), e registrar a linha `CONNECTOR_CALLED`.
8. SE um Membro pede `listConnectionObjects` ou `previewConnectionObject`, ENTÃO O Hub DEVE responder 404 `NOT_FOUND` (security S10).

### Requisito 4: A janela Ligar em quatro passos

**História de usuário:** Como dona da empresa, quero ligar um sistema, escolher o que copiar e revisar numa janela só, para sair dela com o dado chegando.

#### Critérios de aceite

1. QUANDO uma pessoa abre a Página_Integrações, A Página_Integrações DEVE mostrar as ligadas, com o estado de cada uma, e os sistemas para ligar, com um campo de busca que filtra pelo nome (`p2-04`).
2. QUANDO quem administra toca Ligar num sistema de acesso `FIELDS`, A Janela_Ligar DEVE mostrar os campos do sistema, o link "Onde achar" de cada campo e o botão Enviar link (`p2-05`).
3. QUANDO quem administra toca Ligar num sistema de acesso `SIGN_IN`, A Janela_Ligar DEVE mostrar o botão "Entrar com <nome>" e os assuntos que o Conexus vai poder ler (`p2-06`).
4. QUANDO as chaves são salvas, A Janela_Ligar DEVE mostrar "Testando a ligação…" e, depois do teste que passa, "Lendo o que o <nome> oferece" (`p2-10`).
5. SE o sistema recusa as chaves, ENTÃO A Janela_Ligar DEVE mostrar "O <nome> recusou as chaves" com a resposta do sistema por extenso, os campos para corrigir e o botão Enviar link (`p2-11`).
6. SE o sistema não responde ao teste, ENTÃO A Janela_Ligar DEVE mostrar "O <nome> não respondeu. Tente de novo em alguns minutos."
7. QUANDO o teste passa e o sistema oferece tabelas, A Janela_Ligar DEVE listar cada tabela com a descrição, a chave e o modo, cada uma com uma caixa de marcar, e marcar **já copiada** a que tem `copy` (`p2-12`).
8. QUANDO a pessoa toca Ver a amostra numa tabela, A Janela_Ligar DEVE mostrar as linhas que `previewConnectionObject` respondeu.
9. QUANDO a pessoa continua com ao menos uma tabela marcada, A Janela_Ligar DEVE mostrar a Revisão com duas linhas, as tabelas marcadas e o intervalo, que começa em 30 minutos, e o botão "Ligar e copiar agora" (`p2-13`).
10. QUANDO o teste passa num sistema que não é só ao vivo e não oferece tabela, A Janela_Ligar DEVE ir direto ao Ligado, sem os passos O que copiar e Revisão, e sem cópia listada.
11. QUANDO a pessoa toca "Ligar e copiar agora", A Janela_Ligar DEVE pedir `enableCopy` uma vez por tabela marcada, cada pedido com a sua chave de tentativa.
12. SE `enableCopy` falha numa tabela, ENTÃO A Janela_Ligar DEVE nomear a tabela e o motivo e seguir com as outras.
13. QUANDO as cópias nascem, A Janela_Ligar DEVE mostrar a primeira rodada de cada tabela e a frase "Pergunte ao Assistente sobre as vendas.", com Perguntar ao Assistente e Ver em Dados (`p2-14`).
14. SE a pessoa fecha a janela depois de ligar e antes de "Ligar e copiar agora", ENTÃO O Hub DEVE manter a ligação e nenhuma cópia.
15. ENQUANTO a pessoa é Membro, A Página_Integrações DEVE mostrar "Só o dono ou um administrador liga, testa e desliga." e nenhum botão Ligar.
16. ENQUANTO a empresa não tem ligação, A Página_Integrações DEVE mostrar "Nenhuma integração ligada ainda." e a lista para ligar.
17. A Janela_Ligar DEVE caber a 1366 e a 390 px, nos dois temas, sem rolagem lateral, em cada passo e estado (testing T23, `T25`).

### Requisito 5: O link para outra pessoa

**História de usuário:** Como dona da empresa, quero mandar um link para quem tem a senha do sistema, para que essa pessoa preencha só o que falta numa ligação nova, sem conta no Conexus.

#### Critérios de aceite

1. QUANDO dona ou administradora cria um link, O Hub DEVE responder o endereço uma vez e o prazo, 30 minutos depois da criação.
2. QUANDO alguém abre a Página_do_Link, A Página_do_Link DEVE mostrar quem pediu, o sistema e só os campos pedidos, e nunca um valor que quem pediu já preencheu (`p2-08`).
3. QUANDO a pessoa do link envia os campos, O Hub DEVE juntar com os campos já selados, criar a ligação com `linked_by` de quem pediu e testar uma vez.
4. SE o link já foi gasto, passou do prazo ou o segredo não confere, ENTÃO O Hub DEVE responder 404 `NOT_FOUND` a `readConnectionLink` e a `answerConnectionLink`, e registrar `CONNECTION_LINK_REFUSED` sem o segredo.
5. O Hub DEVE manter o segredo do link fora de toda linha do Banco_do_Hub e de toda linha de log (security S41).
6. SE a Página_do_Link recebe "não encontrado", ENTÃO A Página_do_Link DEVE mostrar a frase do link vencido (`p2-09`).
7. SE o sistema recusa as chaves enviadas pelo link, ENTÃO A Página_do_Link DEVE mostrar a resposta do sistema, e O Hub DEVE manter o link valendo até o prazo.
8. SE o sistema é de acesso `SIGN_IN`, ENTÃO A Janela_Ligar DEVE esconder o botão Enviar link, e O Hub DEVE recusar `createConnectionLink` com 409 `LINK_NOT_FOR_SIGN_IN`.
9. QUANDO quem administra toca Enviar link, A Janela_Ligar DEVE listar os campos do sistema para marcar os que a outra pessoa preenche e, depois de Gerar o link, mostrar o endereço e o prazo (`p2-07`).
10. SE quem pede o link é Membro, ENTÃO O Hub DEVE responder 404 `NOT_FOUND`.
11. SE o mesmo endereço passa do limite de tentativas em `readConnectionLink` ou `answerConnectionLink`, ENTÃO O Hub DEVE responder 429 `SIGN_IN_ATTEMPTS_EXCEEDED`.
12. SE quem pediu o link perdeu a permissão `manageConnections`, ENTÃO O Hub DEVE responder 404 `NOT_FOUND` ao envio do link e não criar a ligação.

### Requisito 6: O login do kit no HubSpot e no Gmail

**História de usuário:** Como dona da empresa, quero entrar com a minha conta do HubSpot ou do Google sem colar chave, para ligar esses sistemas pela tela do Conexus.

#### Critérios de aceite

1. O Kit DEVE trazer `hubspot` e `google-mail` com o login por autorização do kit, o App_de_Login da instalação, PKCE `S256` e as páginas de autorização e de token do `providers.yaml` da Nango.
2. QUANDO quem administra toca "Entrar com <nome>" no HubSpot ou no Gmail e a instalação tem o App_de_Login, O Hub DEVE mandar a pessoa à página do sistema com o endereço de retorno `/integrations/return` e, na volta, gravar a ligação selada.
3. ENQUANTO a instalação não tem o App_de_Login de um desses sistemas, O Hub DEVE responder `CONNECTOR_NOT_CONFIGURED` ao Ligar.
4. QUANDO o token de uma ligação do HubSpot ou do Gmail chega perto do fim, O Hub DEVE renová-lo pelo kit antes da chamada.
5. O Kit DEVE mandar a troca e a renovação do token só à Origem_de_Login do conector, ou à origem do dublê que a instalação configura.
6. SE o sistema recusa a renovação, ENTÃO O Hub DEVE marcar a ligação como `NEEDS_REAUTH`.
7. QUANDO quem administra desliga uma ligação do HubSpot ou do Gmail, O Hub DEVE apagar a linha e as chaves seladas, sem chamada de revogação.

### Requisito 7: O HubSpot pela porta de hoje

**História de usuário:** Como Construtor, quero ler e escrever no HubSpot do mesmo jeito que no Mercado Livre, para usar uma regra só de papéis, recusa e aprovação.

#### Critérios de aceite

1. QUANDO o Construtor lê contatos, empresas ou negócios do HubSpot, O Hub DEVE responder a leitura com a mesma forma de uma leitura de outro conector do kit.
2. SE o HubSpot recusa uma leitura, ENTÃO O Hub DEVE responder o status e o corpo do sistema como vieram (code C79).
3. SE o HubSpot responde 401, ENTÃO O Hub DEVE marcar a ligação como `NEEDS_REAUTH`.
4. QUANDO um agente pede a escrita de uma nota num contato, O Hub DEVE mostrar o cartão de aprovação e enviar a escrita uma vez.
5. O Hub DEVE contar as chamadas do HubSpot no mesmo limite por turno das chamadas de outro conector.
6. O HubSpot NÃO DEVE declarar dado pessoal: o Hub entrega o e-mail e o telefone dos contatos como o sistema os manda.

### Requisito 8: O primeiro sistema comum e o primeiro só ao vivo

**História de usuário:** Como fundador, quero o HubSpot e o Gmail ligados pelo login do kit numa empresa de teste, para fechar o marco `D1` com o Sankhya e o Mercado Livre funcionando.

#### Critérios de aceite

1. O Kit DEVE trazer o conector `hubspot`, com leituras de lista de contatos, empresas e negócios e a escrita que cria uma nota num contato, aprovado na Conformidade_do_Kit.
2. O Kit DEVE trazer o conector `google-mail`, com `liveOnly: true`, a busca de mensagens e a leitura de uma mensagem, aprovado na Conformidade_do_Kit.
3. O dublê de `hubspot` e o de `google-mail` DEVEM responder com corpos gravados do serviço real, com valores inventados (testing T29, security S40).
4. QUANDO `hubspot` e `google-mail` entram no catálogo, O Hub DEVE manter o Sankhya e o Mercado Livre aprovados nos testes de hoje.
5. QUANDO o fundador usa uma empresa de teste na instalação da nuvem, O Hub DEVE ligar o HubSpot pelo login do kit, deixar o Construtor ler e mostrar o cartão numa escrita (delivery L17).

### Requisito 9: A entrada conversada (cumpridos pelo cartão do PR 982)

**História de usuário:** Como dona de uma empresa nova, quero uma conversa que aprenda a empresa e me leve a ligar o primeiro sistema, para começar sem preencher formulário.

Estes critérios não viram tarefa deste plano. O cartão da Entrada conversada, reescrito no PR 982 pela skill `conexus-scope`, os carrega e os constrói (decisão E2a).

#### Critérios de aceite

1. QUANDO a Conversa_da_Entrada abre, A Conversa_da_Entrada DEVE mostrar no topo as etapas Empresa, Desafios, Objetivos, Sistemas e Salvar, com a etapa atual na primeira tarefa aberta (`p2-01`).
2. A Conversa_da_Entrada DEVE mostrar à direita as páginas Empresa, Clientes, Desafios e objetivos, Sistemas e Glossário, cada uma esperando, proposta ou salva.
3. QUANDO o Assistente propõe uma página, A Conversa_da_Entrada DEVE mostrar o texto com cada suposição marcada "(suposição, confirmar)" e o botão Salvar (`p2-03`).
4. O Hub DEVE manter cada página da Memória da empresa como estava até o toque em Salvar (`B1`).
5. QUANDO quem pode mudar a Memória da empresa toca Salvar todos, O Hub DEVE gravar as cinco páginas propostas.
6. QUANDO a conversa chega à etapa Sistemas, A Conversa_da_Entrada DEVE mostrar um cartão com os sistemas citados que o Conexus liga, cada um marcado Cópia ou Ao vivo e com Ligar, que abre a Janela_Ligar sem sair da conversa (`p2-02`).
7. SE um sistema citado não é um que o Conexus liga, ENTÃO A Conversa_da_Entrada DEVE mostrá-lo em "ainda não ligamos", e O Assistente DEVE deixá-lo como pergunta em aberto.
8. A entrada DEVE manter o passo "Ligue seus sistemas" antes da conversa, com Fazer depois (`J1`), e a etapa Sistemas DEVE mostrar como ligados os sistemas ligados nesse passo.
