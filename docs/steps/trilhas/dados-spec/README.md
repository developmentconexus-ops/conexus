# Spec da camada de dados do Conexus: índice

Base: `main` do Conexus em `0d4c5730`. Entrada: o escopo aprovado da camada de dados e as respostas do fundador de 2026-11-14. O formato é o do Kiro: cada parte a fundo tem `requirements.md`, `design.md` e `tasks.md`.

**Nota de 2026-11-21: o lago.** O motor que esta spec descreve é o PostgreSQL no banco de cada empresa. Para o dado copiado, o lago na AWS o substitui ([0070](../../../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md)), e cada cartão do lago troca a sua parte quando chegar; as partes não são reescritas agora (fundador, 2026-11-20: "5 sim"). Enquanto isso, o que vale é:

| Parte | O que continua | O que o lago troca |
| --- | --- | --- |
| 1. O dado guardado e o catálogo | A página Dados, com os sistemas e os apps | O catálogo das cópias, a amostra e o login de leitura saíram do banco da empresa (U14 de [a primeira cópia chega ao lago](../../../approvals/a-primeira-copia-chega-ao-lago.md)), e a parte a fundo saiu com eles; a tabela volta pelo lago, com o leitor por etiqueta ([0078](../../../decisions/0078-how-the-lake-knows-who-reads.md)) |
| 2. O conector | O kit, as operações, a janela Ligar e o login; o "só ao vivo" saiu (a emenda de 2026-11-21 em [02-conector/requirements.md](02-conector/requirements.md)) | A cópia roda como tap Singer gerado do kit, pela declaração de cada tabela ([0071](../../../decisions/0071-connectors-kit-live-copies-singer.md), [0080](../../../decisions/0080-copy-declared-per-table-raw-appends.md)) |
| 3. A leitura para análise | O pedido de consulta, as duas ferramentas, a origem até a tela | O dialeto do Athena vem do catálogo. A origem sai do plano do Athena, e não do `EXPLAIN` (`D3`); o estudo da etapa 3 do lago decide a forma |
| 4. A governança mínima | O Registro de dados e a recusa como "não encontrado" | Quem lê é imposto pelo Lake Formation, por etiqueta ([0078](../../../decisions/0078-how-the-lake-knows-who-reads.md)). `D1`, `D11` e `D15` valem só para o PostgreSQL |
| 5 a 7 | Como estão | O conceito aponta para uma tabela do lago |
| 8. A porta de fora | Nada por agora | Vira uma etapa própria depois da etapa 7 do lago, desenhada quando chegar; chave de API, por ora, não (2026-11-21: "P3 sim") |
| 9. As fontes que não são API | Nada por agora | A planilha vira tabela no lago. O documento guarda o original, com uma linha por arquivo no catálogo do lago, e o texto vai para o Knowledge (2026-11-21: "g3 a") |

## Como ler

1. Este índice: as nove partes, a ordem, as suas perguntas e o que decidi sozinho.
2. O `design.md` de uma parte: o que entra, onde, com o trecho do `main` e a referência de cada peça.
3. O `requirements.md` da parte: o que a pessoa e o agente veem, em critérios que um teste confere.
4. O `tasks.md` da parte: os grupos (um PR cada) e as unidades (um commit cada), para um construtor que não pesquisa de novo.

## As nove partes

| Parte | O que ela decide | Marco | Depende de | Nesta spec |
| --- | --- | --- | --- | --- |
| 1. O dado guardado e o catálogo | A regra de nome. A descrição em toda tabela e coluna. O login de leitura. A amostra. A coluna inativa. `catalog` e `rows` do contrato. A página Dados | `D2` | Nada | saiu do código; a parte a fundo saiu com ele |
| 2. O conector, com a entrada conversada | A descrição do sistema. "Só ao vivo". As quatro operações. A janela Ligar em quatro passos. O link para outra pessoa. O HubSpot e o Gmail pelo login do kit. A entrada conversada | `D1`, parte do `D3` | Parte 1 | [a fundo](02-conector/) |
| 3. A leitura para análise | O pedido de consulta no contrato. As duas ferramentas iguais nos três agentes. A ordem do agente. A origem até a tela | `D2` | Parte 1 | [a fundo](03-leitura-para-analise/) |
| 4. A governança mínima | Quem lê cada tabela, garantido pelo banco. A recusa. O Registro de dados | `D2`, `D6` | Partes 1 e 3 | [a fundo](04-governanca-minima/) |
| 5. O Negócio | A fonte do conceito que aponta para uma cópia. `concept_read` e `concept_query`, e qual devolve linhas. A lista dos conceitos no contexto. O destino do PR 1030. Uma fonte por conceito (R1a) | `D4` | Parte 1 | só aqui |
| 6. O Contexto | Os escopos do Knowledge. A tabela do Hub com o antes e o depois. A forma da N2a. O gatilho da busca por significado | itens 5, 6 e 10 | Parte 5, e a entrada conversada da parte 2 | só aqui |
| 7. O escopo por agente | As três listas de um agente salvo: tabelas, ferramentas e contexto. Leitura ligada e escrita desligada por padrão. A tela do dono | item 7 | Partes 4 e 6 | só aqui |
| 8. A porta de fora | O adaptador MCP, o token de empresa, o validador e a decisão de segurança. Desenhar agora, construir depois (R2a) | nenhum hoje | Partes 3, 4 e 7 | só aqui |
| 9. As fontes que não são API | Páginas da web e arquivos: onde o código roda, como se declara o que extrair, onde mora o original (R3a, R3d) | item 8 | Parte 1 | só aqui |

## A ordem de construção

```
parte 1 ──► parte 3 ──► parte 4
   │
   └──────► parte 2, bloco A ──► bloco B (a gravação dos corpos reais espera o app de login no HubSpot e no Google)
                                 bloco C (espera o cartão do PR 982 e o D3)
```

- Os grupos 5 e 6 da parte 3, a conformidade contra a implementação real, entram depois do grupo 6 da parte 4. Assim o mundo real da conformidade já nasce com a tabela retida, e nenhuma lei pula.
- As partes 1, 3 e 4 são o menor começo que mostra o desenho inteiro. A pessoa pergunta, o agente acha a tabela, lê, responde com a origem, respeita o papel e deixa registro.
- A parte 2 anda ao lado, a partir do fim do grupo da parte 1 que traz a descrição nos modelos de cópia.
- Uma mudança no contrato `packages/hub-api/src/company-data.ts` ou na conformidade dele é sempre um PR só dela, pela issue `contrato`. As partes 1, 2 e 4 têm um cada, e a parte 3 tem dois. Onde o PR precisa de uma linha fora do contrato para o repositório compilar, o corpo do PR a lista (`D19`).
- Uma permissão nova no banco do Hub é sempre um PR só dela, com a sua palavra (P2). Onde a permissão não existe sem a coluna, o papel ou a função que ela nomeia, o PR os leva junto, e o registro de decisão quando abre uma porta nova. Na parte 4 as tabelas entram num PR antes, e os dois PRs de permissão levam só a permissão.

## As suas perguntas

Eram três, e as três estão respondidas (2026-11-14: "P1 OKAY / P2 Okay", e a escolha da fonte única para a P3). Nenhuma pergunta está aberta.

### P1. Respondida: num Projeto, o Builder lê pela liberação do Projeto

Hoje o Builder lê num Projeto as cópias que alguém liberou àquele Projeto, e não olha o papel de quem conversa [visto, `apps/server/src/builder/app-data/tools.ts:65-86`, `apps/server/src/platform/copy-sql.ts:331-347`]. A sua decisão N3b põe a permissão por tabela e por papel, e não dizia o que vale dentro de um Projeto.

A sua resposta, opção **a**:

- **O Builder**, num Projeto, lê o que foi liberado ao Projeto, como hoje. É o padrão de um app que age como ele mesmo, com a conta de serviço dele.
- **O agente salvo, numa conversa**, lê com o papel de quem pergunta. É o padrão de um agente que lê com a permissão de quem pergunta.
- **O agente salvo, rodando sozinho por agenda**, lê pela liberação do Projeto. É o padrão de um trabalho agendado, que roda com a identidade fixa que a agenda tem, e não com a de quem o abriu.

As duas regras do agente salvo são entrada da parte 7, o escopo por agente, e não têm tarefa nesta spec. Nas partes 3 e 4 desta spec o agente salvo lê pela liberação do Projeto dele, que é o que o código de hoje faz. Então, até a parte 7, uma pessoa que conversa com um agente salvo pode ler por ele uma tabela liberada ao Projeto que o papel dela não lê. A parte 7 fecha isso.

Consequência que vale dizer: qualquer membro que conversa com o Builder num Projeto lê as cópias liberadas àquele Projeto, mesmo as que o papel dele não lê fora dali. Liberar uma cópia a um Projeto continua um ato de dono ou administrador.

### P2. Respondida: sim para as quatro permissões, cada uma num PR só dela

O guia de dados só deixa mudar a lista de permissões num PR próprio, com a sua palavra (data D11). O que você aprovou, com o que cada PR dá ao login do Hub:

| O que | Parte | O que o login do Hub passa a poder |
| --- | --- | --- |
| `copies.copy`, colunas `column_state` e `definition` | 1 | mudar essas duas colunas: a coluna inativa e a descrição que a rodada preenche. Hoje ele não muda nenhuma das duas [visto, `apps/server/database-grants.sql:373-381`] |
| `copies.copy_reader`, e a coluna `readers_set` de `copies.copy` | 4 | ler, incluir e apagar quais papéis leem cada cópia, e marcar que a cópia já recebeu as marcas |
| `data.data_read`, com o uso do esquema `data` | 4 | só ler e incluir, nunca mudar nem apagar: o Registro de dados |
| `connectors.connection_link`, a função `connectors.link_of` e o papel dono dela | 2 | ler, incluir e apagar o link de 30 minutos. A função deixa a página pública achar o link pelo segredo. Ela pede um papel novo no banco, sem login, que só lê essa tabela, no molde do que já acha o Projeto pelo endereço [visto, `apps/server/src/hub/projects/hosts.ts:23-31`]. O PR mostra o papel e a função por inteiro |

O molde é a permissão do registro de escrita, que já passou por você [visto, `apps/server/migrations/20261107125733_e245_connector_write_grants`].

### P3. Respondida: uma fonte só de conector, o nosso kit (fonte única)

A pergunta era por onde o primeiro sistema da Nango executaria. A sua resposta, em 2026-11-14, foi outra e maior: uma fonte só, o nosso kit. Ela substitui a decisão H5 (duas fontes, Nango e kit).

- Todo conector fica no formato do kit: operações, tabelas, campos e descrição.
- As cópias rodam no nosso motor de cópias.
- O login por autorização, a guarda e a renovação do token são do kit, com o nosso app de login em cada sistema.
- Um sistema novo entra como uma declaração escrita pela IA a partir da documentação da API e conferida com uma leitura de teste. É o padrão dos manifestos do Airbyte, e é a Fábrica de conectores do roteiro.
- A Nango não entra no código. Fica como referência de padrão.

Por quê:

- As plataformas de dados que serviram de referência trazem conectores próprios, e não um serviço de terceiros.
- O que atraía na Nango, as operações prontas, só roda na conta paga.
- As cópias da Nango são temporárias. Usá-las seria ter um segundo motor de cópias.
- O kit já faz o login por autorização e a renovação do token, no Mercado Livre.

O que muda na spec: a parte 2 perde os grupos da Nango. No lugar, o HubSpot e o Gmail entram pelo login do kit, com a mesma porta, os mesmos papéis, o cartão de escrita e a conformidade.

Dois atos seus destravam esse bloco da parte 2, e não são perguntas: criar o app de login no HubSpot e no Google, e emprestar uma conta de teste de cada um para gravar as respostas reais, só de leitura.

## O que decidi sozinho, e por quê

| Nº | Decisão | Por quê |
| --- | --- | --- |
| `D1` | Um login de leitura por papel, ligado direto. Nada de `SET ROLE` por transação | O estudo anterior recomendava o papel assumido por transação. Rodei os dois no Postgres 18: com o papel assumido, uma consulta troca de papel no meio e lê a tabela de outro papel. Com o login por papel, o banco recusa. O teste do ataque direto (testing T13) repete a prova |
| `D2` | A origem da resposta vai no resultado da ferramenta, e não num evento à parte | O estudo anterior recomendava `writer.custom`. O controlador do Mastra descarta esses eventos ao vivo [visto, `@mastra/core` 1.82, `agent-controller/session-run-engine.ts:1618-1619`] |
| `D3` | As tabelas que uma consulta leu saem do `EXPLAIN` do próprio banco | Nenhum leitor de SQL nosso. O banco já sabe o que leu |
| `D4` | As cópias que já existem não mudam de nome. A regra `<sistema>_<tabela>` vale para as novas | Os apps publicados leem as tabelas de hoje por SQL fixo. Renomear quebra app em uso |
| `D5` | A página do contrato tem 200 linhas. A amostra tem 5, na tela e na ferramenta | A lei 2 da conformidade diz que `rows` é a página servida da cópia. A amostra de 5 é a `T7` do escopo |
| `D6` | O login `conexus_read` nasce na parte 1, e não na 3 | A amostra da página Dados já precisa de um login que só lê |
| `D7` | Duas ferramentas, `data_describe` e `data_query`, numa pasta nova, montadas nos três agentes | A pasta `construtor/` está congelada. Uma definição só evita três cópias |
| `D8` | Um membro que abre o endereço de uma tabela que o papel dele não lê recebe "não encontrado" | O guia de segurança manda não confirmar que a coisa existe (security S10). No Assistente a recusa nomeia a tabela, como o escopo pede, porque ali a lista de tabelas retidas já é mostrada |
| `D10` | Sem registro, sem leitura. Se o Registro de dados não grava, a leitura é recusada | Um registro que falha em silêncio não é registro |
| `D11` | Toda mudança de quem lê muda o Hub primeiro e o banco da empresa depois. Duas mudanças ao mesmo tempo são ordenadas por um bilhete tirado no banco da empresa, e a mais velha não desfaz a mais nova. O fim de toda rodada de cópia confere de novo | Sem falha, o banco nunca lê mais do que o Hub diz. Nenhuma transação do Hub fica aberta enquanto o banco da empresa é chamado (data D22). Sobra um caso: tirar uma tabela, o banco da empresa não responder, e a volta atrás no Hub também falhar, ou o servidor cair no meio. Aí o login ainda lê a tabela até a conferência seguinte, no máximo o intervalo da cópia, 30 minutos por padrão. Nesse intervalo a leitura pelo contrato é recusada, e o caso fica no log como erro |
| `D12` | A parte 2 se divide em três blocos: a janela Ligar e o link, o HubSpot e o Gmail pelo login do kit, e o que espera outra coisa. A entrada conversada entra pela reescrita do cartão do PR 982 | O cartão ainda não foi aprovado. Construir a entrada daqui criaria dois donos para a mesma tela |
| `D13` | O login por chave fixa espera o primeiro sistema que o usa | Um modo de login sem conector não tem dublê gravado nem conformidade que o prove |
| `D15` | Uma escrita tentada pela consulta volta como `NOT_IN_ROLE`, e não como `QUERY_REFUSED` | Medido: o login só de leitura recebe `42501` do banco ao tentar escrever, o mesmo código de uma tabela que o papel não lê. A resposta segue o código do banco, sem leitor de SQL nosso. Nada é gravado nos dois casos |
| `D16` | `app-data/context.ts` fica na lista de migração nesta spec. Os primeiros arquivos fora dela são os de `builder/data-tools/` | O bloco de dados do Builder usa as propostas e a liberação de cópias, que são o fluxo de propor, e não a leitura. Pôr isso no catálogo misturaria os dois no contrato |
| `D17` | O turno e quem fala entram junto com o escopo da conversa, e não no contrato | São fatos da conversa. O contrato continua descrevendo só o dado |
| `D18` | Num Projeto, o catálogo lista só os sistemas liberados ao Projeto | É a regra que o Assistente de um Projeto já segue [visto, `apps/server/src/hub/connectors/assistant-port.ts:140-143`] |
| `D19` | O PR do contrato da parte 1 leva também `inactiveSince: null` em `shownOf` e nas fixtures da tela | Sem essas linhas o PR não compila. Elas não carregam comportamento, e o corpo do PR as lista |
| `D20` | A página Dados da parte 1 mantém a coluna Projetos e o botão **Ligar uma cópia**. A aba **Quem lê** de uma tabela entra na parte 4, e o botão **Ligar um sistema** na parte 2. A coluna **Quem lê** da lista e a aba **Leituras** de uma tabela, que os protótipos `p1-01` e `p1-02` mostram, não são construídas nesta spec | Cada peça entra com a parte que a faz funcionar. A coluna e a aba **Leituras** são vistas a mais sobre o que a parte 4 já mostra na aba **Quem lê** e no Registro de dados |
| `D21` | O Registro guarda o id do agente, e a tela mostra o nome pela lista de agentes que o navegador já tem | Nenhuma porta nova no servidor |
| `D22` | O login de um papel apagado sai na reconciliação seguinte | Nenhuma pessoa tem o papel e só o Hub tem a senha. Evita uma chamada nova da identidade para a trilha Dados |
| `D23` | O link para outra pessoa vale só para sistema de chaves coladas. O login por autorização pelo link fica de fora | O login por autorização termina hoje com a sessão de quem começou. Terminá-lo sem sessão é uma porta de segurança própria, com o seu estudo |
| `D24` | A página pública do link acha a linha por uma função do banco, no molde da que acha o Projeto pelo endereço, e conta tentativas | É o molde que o Hub já usa para uma porta sem sessão. Ele pede um papel dono novo, sem login, que o PR da permissão mostra |
| `D25` | A Revisão da janela Ligar tem duas linhas, tabelas e intervalo. A linha **Quem lê** fica para depois | Ela precisa de uma rota que diga os papéis antes de a cópia existir. A cópia já nasce marcada pela N3b-1, e a aba **Quem lê** da parte 4 mostra e muda |
| `D26` | O kit ganha uma origem de login por conector, fixa na definição, só para a troca e a renovação do token | O Google troca o token num endereço e serve o Gmail em outro. A origem é uma constante do conector, nunca um valor de fora, e o token da ligação nunca vai a ela (security S36). A unidade leva um registro de decisão "proposto", que você aceita ou recusa no PR |
| `D27` | O HubSpot e o Gmail não declaram revogação nesta spec. O Gmail não guarda o id da conta | O kit só revoga por um caminho com o id da conta, que nenhum dos dois usa. O único id de conta do Gmail é o e-mail, um dado pessoal |
| `D28` | Os corpos reais do HubSpot e do Gmail são gravados por um modo novo do gravador de conectores, que faz o login do kit e guarda o token só na memória | Testing T29 pede o corpo real. Até a gravação, o dublê usa a forma mais próxima da referência, marcada "a confirmar na gravação" |
| `D14` | A spec está em português, com as palavras do EARS traduzidas (QUANDO, SE, ENTÃO, DEVE) | Delivery L23, e é a língua em que você lê |

## O que o repositório diz diferente do escopo

1. O escopo (`T4`) trata o texto "Seu papel não lê ..." como existente. Ele não existe no `main`. A parte 3 o cria.
2. O estudo anterior punha o login de leitura na parte 3. A spec o cria na parte 1 (`D6`).
3. O estudo anterior punha a descrição do sistema e o "só ao vivo" na parte 1. O escopo os põe na parte 2. Segui o escopo.
4. As leituras que um app publicado faz por `db.query`, na borda, não passam pelo Hub. Elas não aparecem no Registro de dados. O Registro mostra o que os agentes leram.
5. O protótipo `p2-09` diz "Este link venceu. Peça outro a Lea." A página pública não sabe de quem era um link vencido sem confirmar que ele existiu. A spec usa "Peça outro a quem enviou." (security S10).
6. O exemplo do escopo manda o link do Mercado Livre, que é de autorização. A spec só gera link para sistema de chaves coladas (`D23`).
7. A decisão H5 (duas fontes, a Nango e o kit) vivia no roteiro e na página da trilha Dados. Este PR a troca pela fonte única, no roteiro, na página da trilha e na decisão [0069](../../../decisions/0069-connectors-one-source-the-kit.md).

## Os textos que os protótipos não trazem

Cada parte propõe os textos de tela que o escopo não deu, e o PR os lista para a sua palavra no fim da etapa. Estão nas "Notas" de cada `tasks.md`. Exemplos: "A cópia ainda não tem linhas.", "Nenhum app guarda tabelas ainda.", "Não deu para copiar. Selecione a consulta e copie.", "Agente apagado".

## O que fica para specs futuras

- As partes 5 a 9, na ordem da tabela.
- Na parte 2: a Fábrica de conectores (a declaração escrita pela IA a partir da documentação), as cópias do HubSpot, os gatilhos (`D5`), a medição por empresa (`D6`), a nova tentativa em falha passageira e a contagem de novo e mudado.
- Na parte 2: o login por autorização pelo link, religar uma ligação pelo link, e a linha **Quem lê** na Revisão da janela Ligar.
- Na parte 1: a coluna **Quem lê** da lista da página Dados e a aba **Leituras** de uma tabela.
- Na parte 4: o prazo de guarda do Registro de dados (E4a diz sem prazo por ora) e o registro das leituras dos apps na borda.
- A proposta de cópia do Builder pelo verbo `act` do contrato, que tira `app-data/context.ts` e `connectors/copy-propose` da lista de migração.
- A passagem das cópias do Sankhya à versão 2. A spec só acrescenta a descrição à versão 1.

## O que nenhuma conferência provou

- As formas de resposta do HubSpot e do Gmail vêm da referência, e não de uma chamada real. Estão marcadas "a confirmar na gravação", e o grupo 9 da parte 2 grava.
- O `EXPLAIN (VERBOSE, FORMAT JSON)` foi medido num PostgreSQL 17.10. O banco das empresas é o 18, e a unidade 2.1 da parte 3 prova no teste.
- O risco de dois `GRANT` ao mesmo tempo falharem no PostgreSQL é esperado, e não medido. A unidade 4.1 da parte 4 o trata e o testa, e o teste depende de tempo.
- Nada rodou na Neon nem pelo transporte HTTP dela.
