# Trilha Dados

O fundador, em 2026-11-14, ao parecer do conselheiro de produto: "1A. Duas trilhas" e "2A. Catálogo
primeiro, Ontologia por cima". Esta página não é um cartão de etapa (delivery L5). Ela diz o que
a trilha possui, onde ela está e como a outra trilha conversa com ela. Os marcos, em ordem,
estão no [roteiro](../../roadmap.md).

## O que a trilha entrega, e para quem

A trilha Dados entrega para a trilha Agentes e Apps e para a pessoa que liga os sistemas da empresa.
Ela é dona do contrato de acesso e mede o sucesso em sistemas reais que passam na mesma prova.

## O primeiro marco

| Marco | O que a pessoa vê | Pronto quando |
| --- | --- | --- |
| **`D1`. O primeiro sistema de catálogo** | Liga o HubSpot ou o Gmail pela tela do Conexus, sem colar chave | Numa empresa de teste, a conexão nasce pelo login do nosso kit. O Construtor lê. Uma escrita mostra o cartão. Sankhya e Mercado Livre seguem funcionando. |

Depois de `D1`, a trilha segue o método leve da fila do molde (delivery L27).

## O cartão de hoje

A primeira cópia chega ao lago, a etapa 2 do lago, fechou em 2026-11-26, com as provas na v0.24.133 e a
v0.24.134 no ar, e a linha de fechamento está no [arquivo de aprovação](../../approvals/a-primeira-copia-chega-ao-lago.md). A
pessoa liga um sistema numa janela só, escolhe as tabelas e quando copiar, a cópia chega ao lago da
empresa, e a página Dados a mostra. O cartão está no histórico do `main`, no commit `50aae548`, o
último que o mudou. A trilha está sem cartão em `docs/steps/` até o cartão seguinte entrar: o do
aviso de cópia parada vem primeiro.

As etapas anteriores fecharam: o lago da empresa nasce e some, a etapa 1 do lago, em 2026-11-23, na
v0.24.110 ([aprovação](../../approvals/o-lago-da-empresa-nasce-e-some.md)); a pergunta respondida
com a origem, em 2026-11-16 ([aprovação](../../approvals/a-pergunta-respondida-com-a-origem.md));
cada papel lê só o seu, com a porta única, em 2026-11-17
([aprovação](../../approvals/cada-papel-le-so-o-seu.md)); e o Registro e conformidade, em
2026-11-22 ([aprovação](../../approvals/registro-e-conformidade.md)).

As concessões por instância entram quando o primeiro cartão precisar de instância. A conexão MCP
tem cartão próprio quando a primeira ferramenta de IA entrar.

A Ontologia volta como a etapa do Negócio, com estudo e cartão próprios; o PR 1030, fechado sem
mesclar em 2026-11-16 com o ramo guardado, é a fonte dela, e o cartão antigo da Ontologia,
aposentado em 2026-11-15 ("Aposentar"), está no histórico do `main`, no commit `8ced9430`.

## O lago: o dado copiado muda de casa

Em 2026-11-19 o fundador decidiu que o dado copiado mora num lago na AWS e, em 2026-11-20, um por
empresa ([0070](../../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md)). Em 2026-11-20, sobre
o foco: "a gente já está colocando muita coisa em paralelo, sem ter a base consolidada e sem nem
estar começando a implementação". Em 2026-11-21, sobre o desenho: "o Connexus não é só o Sankhya é
um conector de exemplo". A arquitetura foi validada por provas antes de qualquer cartão; cada
registro, do 0070 ao 0080, traz o critério, o resultado medido e o que a prova não cobriu.

As etapas, em ordem (2026-11-21: "G1 b e lembrar que mercado livre tem na Nekt como referencia e ja
usamos"). Cada etapa tem o nome de uma capacidade que vale para toda classe de conector; o sistema
que a prova fica ao lado. Uma capacidade nova nasce desenhada com duas classes. Cada etapa tem estudo e cartão próprios e fecha quando o fundador a usa. A etapa O conector no padrão
novo é a exceção: ela é uma seção do cartão da etapa 2, porque fica entre duas partes dele, e
`docs/steps/` guarda um cartão por trilha (delivery L5). O fundador, 2026-11-23, ao estudo do ao vivo
(`conexus-ao-vivo-estudo`): "Aprovado suas recomendacoes conector". A recomendação aprovada:

- **A (a).** As pastas do Sankhya e do Mercado Livre são refeitas do zero, e também cada peça do Hub
  que diverge do decidido. As peças do Hub que já são o decidido ficam (o executor, o login por
  autorização, as leituras como ferramentas e a escrita com o cartão). A Fábrica é provada no TOTVS.
- **B (a).** Na etapa nova, gravar no Caderno pede o sim de quem gerencia a ligação. O Caderno sai na
  etapa do Negócio ([0064](../../decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md)).
- **C (a).** A etapa própria fica entre a parte 0 e a parte 1 da etapa 2, com um pull request por
  conector, sem o Assistente perder as leituras ao vivo.
- **Uma tabela por ligação** no lago (`conexus-n5-duas-ligacoes`).

A janela Ligar, com o fluxo da Nekt, e o link de 30 minutos (spec 02) entram na etapa 2. O
fundador, 2026-11-23: "Sim, é esse" e "Já no Lago 2". A descrição do sistema (spec 02, `C1`) fica
para a etapa que a pedir.

A ordem mudou em 2026-11-25. No quadro do estudo do tratamento do lago, o fundador respondeu "Q8: a:
Lago 2, `T1`, `T2`, `T3`, etapas de entrada (3a, XML, 5, 6, 7), `T4`, Negócio, Brain, Lago 3, Lago 4" e
"Q9: a: duas portas para o mesmo tratamento: Explorer com Salvar como tratamento (T3a) e o agente
(T3b)" ([aprovação](../../approvals/o-primeiro-modelo-vira-tabela-tratada.md)). Lago 2, 3 e 4 são as
etapas 2, 3 e 4 da tabela. Em 2026-11-26, sobre a ordem, o fundador respondeu "A": a `T1` primeiro,
depois A passada inteira agendada, com o cartão no pull request
https://github.com/developmentconexus-ops/conexus/pull/1463. A tabela segue essa ordem; a etapa que
ainda não está nela entra com o seu cartão.

Em 2026-11-27, o fundador pediu ver a cópia enquanto ela roda ("eu não consigo saber o que está
acontecendo agora enquanto está sendo copiado fazendo os syncs entende? Como a Nekt faz?") e pôs a
etapa A rodada que se vê depois da `T1` e antes da `T2` ("Okay"). Às cinco decisões do estudo
`conexus-rodada-que-se-ve` ele respondeu "A recomendado, B Sim, C Sim, D Sim, E Deixar como issue": o
placar pela fila da cópia, a cada 10 s; os estados Na fila, Copiando, Copiada, Atualizando o lago e Com
erro; a aba Rodadas na ligação; os logs na tela depois; e a tabela com erro que não para a rodada na
issue https://github.com/developmentconexus-ops/conexus/issues/1501.

| Etapa | A pergunta que o fundador responde na tela | Prova com |
| --- | --- | --- |
| 1. O lago da empresa nasce e some | O Conexus cria e apaga sozinho o lago isolado de uma empresa, sem ninguém abrir o console da AWS? | Nenhum conector |
| 2. A primeira cópia chega ao lago | Eu ligo o Sankhya numa janela só, escolho as tabelas e quando copiar, elas chegam inteiras ao lago, a mudança de hoje aparece na rodada seguinte, e eu vejo isso na página Dados? | O Sankhya completo, núcleo, fiscal e contábil, e o XML da NF-e; o dublê do HubSpot na mesma bateria, para o adaptador não aprender um sistema só |
| O conector no padrão novo, entre a parte 0 e a parte 1 da etapa 2 | O Assistente continua lendo o Sankhya e o Mercado Livre enquanto cada conector é refeito, e cada um nasce de uma definição só, com a sua skill e a classe da credencial? | O Sankhya e o Mercado Livre, um pull request por conector |
| `T1`. O primeiro modelo vira tabela tratada | Depois de cada cópia, o Conexus grava a tabela Notas tratada e a Venda com a regra que eu liguei, e eu vejo em Dados as três camadas e de onde cada tabela veio? | O Sankhya, nas quatro tabelas de venda |
| A rodada que se vê ([cartão](../a-rodada-que-se-ve.md), aprovado, espera a `T1`) | Enquanto o Sankhya copia, eu vejo em Dados qual tabela está indo, quantas linhas já foram, quais já terminaram e quais esperam, e depois abro cada rodada com as tabelas dela? | O Sankhya; o dublê nos testes |
| 3a. O arquivo chega ao lago, ligado à sua linha | Pergunto ao Assistente por uma linha e abro o arquivo ligado a ela, e quem não lê a tabela não abre o arquivo? | Uma leitura de API que baixa o arquivo (um documento ou anexo do Mercado Livre, se a prova PM1 confirmar; senão, o dublê do HubSpot) e uma coluna binária grande de banco (um anexo do Sankhya, se a sonda PS1 achar) |
| O XML lido em linhas, depois da 3a | Pergunto ao Assistente se a nota que lançamos bate com o XML do fornecedor, e ele responde item por item, com as duas origens? | O XML da NF-e do Sankhya, guardado na etapa 2, lido em `nfe_notas` e `nfe_itens`; o dublê do conector NF-e |
| 5. A segunda classe pelo mesmo caminho | Uma lista de um sistema de outro tipo entra pelo mesmo caminho, sem código novo no adaptador? | O Mercado Livre, a lista de vendas. O estudo usa o conector dele numa plataforma de referência e o que já rodamos |
| 6. Escolher o que copiar | Eu acho no dicionário uma tabela que o kit não declara e escolho os campos de cada tabela, e nada vem marcado? A escolha das tabelas do kit, na janela, entra na etapa 2 | O Sankhya pelo dicionário, o Mercado Livre pela lista declarada |
| 7. A tabela grande e sem coluna de alteração | A primeira carga termina numa tarde, e o que sumiu da fonte some do lago? As fiscais e as contábeis já entram na etapa 2 | As fiscais e contábeis do Sankhya; as listas do Mercado Livre sem filtro de alteração |
| 3. O agente responde pelo lago | Pergunto ao Assistente e ele responde do lago, diz de quando é, e recusa o que o meu papel não lê? É o `D2` | Qualquer tabela copiada |
| 4. O app lê o que foi publicado | Um app publicado mostra o dado do lago sem nunca ver uma tabela pela metade? | Qualquer tabela copiada |

Antes da etapa 1 entrou a mudança de método que dá ao
repositório regra, teste e conferência para Python, para a infraestrutura da AWS e para testar o
Hub sem a AWS (delivery L20); nela a regra D25 é reescrita pelo motivo dela, sem exceção. Antes de
qualquer outra empresa entra a etapa da conta oficial da AWS, que está no
[roteiro](../../roadmap.md): até lá o lago roda na conta de laboratório, que é provisória
([0072](../../decisions/0072-the-lab-aws-account-is-provisional.md)), só com dado gerado e com o da
empresa do fundador.

A etapa 1 deixa às seguintes o que o estudo dela achou e o cartão não construiu:

- **Para o cartão da etapa 3.** A recusa por `DESCRIBE` e a recusa por `SELECT` têm de virar o mesmo
  "não encontrado" (security S10), como a https://github.com/developmentconexus-ops/conexus/issues/1226
  pede para o nome e as colunas.
- **Para uma etapa seguinte do lago.** A linha em `ready` não relê a AWS: uma pilha mudada ou
  apagada por fora só aparece quando alguém apaga o lago. A etapa 2 não decidiu quando reler: antes
  de agir na pilha, como o exemplo serverless da AWS, ou por um relógio, como o Crossplane. Uma pilha
  sem linha, que só nasce de um banco do Hub restaurado de cópia, acha-se pelas etiquetas
  `conexus-empresa` e `conexus-modelo`; nenhuma etapa constrói esse inventário (0073).

A etapa 2 deixa às seguintes:

- **A NF-e lida inteira a cada rodada.** As decisões do fundador de 2026-11-26 (as notas novas pelo
  número em cada rodada, o resto numa passada inteira agendada, opção por ligação, e a nota
  cancelada saindo nela) e o que falta decidir estão na
  [issue 1460](https://github.com/developmentconexus-ops/conexus/issues/1460).
- **Para a etapa 5.** A tarefa só provou a renovação da credencial no Sankhya: o dublê do HubSpot
  invalida a chave anterior a cada renovação, e a bateria não a renova.
- **Para medir depois.** A imagem em ARM (T.6 do cartão).
- O `connector_read` genérico do ajudante de pesquisa, do Builder e do Construtor fica ao lado das
  leituras tipadas do Assistente (`EST/ao-vivo-estudo:149`), e a H2b da outra trilha segue aberta.

Depois da etapa 7 vêm duas frentes, cada etapa com estudo e cartão próprios:

- **Os conectores por classe**, nesta ordem: o TOTVS, criado pela Fábrica, como fonte do lago; o
  Gmail com a Agenda e o Drive como ferramenta do agente, que é o `D1`; a planilha do Drive no lago;
  o e-mail e a agenda do Outlook; o SharePoint; a NF-e; e o Sicoob. O TOTVS espera o fundador dizer
  qual e de que empresa vem o acesso; o Google e a Microsoft esperam o app de login de cada um.
- **A porta de fora**, para sistemas e agentes de fora lerem o lago pelo Hub (2026-11-21: "P3
  sim"). Ela é desenhada quando chegar; chave de API, por ora, não entra.

A ordem entre as duas frentes é decidida quando a etapa 7 fechar.

O aviso de cópia parada, que saiu do Registro e conformidade (2026-11-21, "R1 a R2 a"), tem cartão
próprio, logo depois do da etapa 2, pelo tamanho dela. A unidade é a parada, e não a rodada, com um
aviso quando a cópia para e um lembrete por dia enquanto ela continuar parada; o botão Seguir só entra
se alguém pedir. O fundador, 2026-11-23, na entrevista do Lago 2: "Por ligação, na janela". Os
e-mails do aviso são da ligação, no passo Quando copiar da janela, já com quem liga, e mudam depois na
página da ligação. Isso substitui a lista de e-mails da empresa em Configurações (a I (a) de
2026-11-21 e de 2026-11-23). As tabelas `copy_follower` e `copy_notice` saem na parte 0 da etapa 2;
`alert_recipient` fica sem uso até o cartão do aviso.

O motor de cópias de hoje sai inteiro na parte 0 da etapa 2, antes de o padrão novo entrar, porque o
lago é a única fonte e nenhuma tabela mora em dois lugares. O fundador, 2026-11-23: "nao e pra ter
essa opcao [...] nossa fonte e o lago"; "o que a gente tem atualmente... do Legacy, de Sunk, Mercado
Livre, tem que ser desfeito para entrar o novo jeito"; e, ao estudo do conector no estilo novo, "sim"
para tirar na parte 0 também o que lê o banco da empresa. Saem na parte 0:

- o que cria cópia no banco da empresa;
- a leitura do contrato pelo banco da empresa, a Amostra e os logins de leitura por papel;
- a liberação a Projetos, o esquema `sync` e os logins `conexus_sync` e `conexus_read`;
- as tabelas das cópias no banco do Hub.

Até a etapa 3, o Assistente lê os sistemas só ao vivo; até a etapa 4, os apps ficam sem a tabela
copiada.

No lago, o nome de uma tabela é de negócio, em português, declarado no kit: `sankhya_notas`, com o
rótulo "Notas e pedidos" e a `TGFCAB` ao lado, como origem. Uma tabela que o kit não declara fica com
o código. Duas ligações do mesmo sistema dão duas tabelas. O fundador respondeu em 2026-11-23, ao
estudo `conexus-conector-estilo-novo-estudo`, com "okay" às duas primeiras letras e "sim" às duas
seguintes. No mesmo dia, na entrevista do Lago 2, ele aprovou ("Aprovo") que o nome do kit é
sugestão, e não regra: a janela sugere o nome do kit com um prefixo para todas, a pessoa troca ao
ligar, e o nome fica fixo depois de criado, como na Nekt. Cada tabela guarda no catálogo a origem e o
rótulo do kit, para os agentes acharem a tabela pela origem; a parte gerada da skill usa os nomes
reais; a segunda ligação do mesmo sistema vem sugerida com o nome dela, e um nome repetido é
recusado.

Em 2026-11-20 o fundador pôs o tratamento e a qualidade dos dados, a camada Negócio no lago e o
agente de dados depois do lago implementado. A ordem de 2026-11-25 (acima) traz os três para antes das
etapas 3 e 4. Ficam para depois do lago implementado, por decisões anteriores: o
BigQuery e o dado na nuvem do cliente, os gatilhos (`D5`), a medição por empresa (`D6`, que espera
a conta oficial) e os bancos de dados por tap pronto. Os taps prontos da loja do Meltano ficam fora
até um sistema pedir, e são ponto de partida do estudo de cada conector (2026-11-21: "G2 a"). Os
documentos do Drive, do SharePoint e do Gmail não viram tabela: a planilha vai para o lago; o
documento guarda o original no depósito de arquivos do lago da empresa, com a sua linha numa tabela
do lago (a etapa 3a), e o texto vai para o Knowledge, na etapa das fontes de conhecimento do Brain (2026-11-21: "g3 a").

O lago guarda também arquivos. O fundador, 2026-11-23: "Pra mim e totalmente errado lakehouse nao e
so dados [...] ter o XML e crucial ( nao so ele)". Da regra de 2026-11-19 ("Anexos, índices, logs e
cópias de backup datadas ficam fora") sai a parte dos anexos: anexos e colunas de arquivo entram no
lago; índices, logs e cópias de backup datadas continuam fora (`conexus-arquivos-no-lago`). O XML da
NF-e entra na etapa 2 ("Já no Lago 2, como a Nekt") como uma coluna de texto da tabela dos dados da
NF-e (`sankhya_notas_nfe`, a `TGFNFE`), e não numa tabela própria (2026-11-23, à recomendação do
firstmate: "E, não, beleza"). A tabela fica sem histórico (2026-11-24: "vamos deixar sem o
histórico, porque eu acho que o jeito que você está querendo montar o histórico não é como as
referências fazem"). Vale para todo conector
uma regra só, pelo tipo que a descoberta lê: texto longo (`CLOB`, `NCLOB`, `LONG`) vira texto, e
binário (`BLOB`, `RAW`, `LONG RAW`) vira o tipo binário do Iceberg; ninguém marca arquivo à mão, e o
kit pode declarar o significado de uma coluna só como metadado. O XML é lido em `nfe_notas` e
`nfe_itens` numa etapa própria depois da 3 ("Etapa própria, depois da 3").

O lakehouse guarda tabelas e arquivos, como fundação (`conexus-lakehouse-arquivos`). O fundador,
2026-11-23: "Pra mim e totalmente errado lakehouse nao e so dados [...] a Next, por exemplo, dava a
possibilidade da gente já linkar os anexos. Google Drive é a mesma coisa com itens"; e, às duas
perguntas do estudo, "F1. A F2. A":

- **F1 (a).** Os arquivos entram numa etapa própria, a 3a, "O arquivo chega ao lago, ligado à sua
  linha", logo depois da 3 e antes do XML lido em linhas. A etapa 2 segue no seu escopo e não fecha
  nenhuma porta para os arquivos. O desenho está no registro
  [0082](../../decisions/0082-the-lake-holds-tables-and-files.md), que emenda a 0070, a 0071, a 0073,
  a 0078 e a 0080: os arquivos moram num depósito `S3` de uso geral da empresa, na mesma pilha, cada um com a sua linha numa tabela do lago; o kit
  declara a linha de origem e a leitura que baixa os bytes; o nosso target grava o arquivo antes da
  linha; e quem lê a tabela abre os arquivos dela, sempre pelo Hub. A regra pelo tipo fica, e o
  binário acima de um teto vai ao depósito pela regra de tamanho, na 3a. O contrato ganhar "abrir o
  arquivo de uma linha" (0079, pela issue `contrato`) e o ajuste da frase da 0065 sobre dado de
  conector entram com o cartão da 3a.
- **F2 (a).** A AWS da empresa ganha os poderes de `S3` só no depósito de arquivos de cada empresa: o
  papel que escreve grava e lista, o papel leitor lê, o Hub lista e apaga nos depósitos `conexus-*`, e
  o papel de serviço do CloudFormation e o teto criam e apagam esse depósito. Eles entram na etapa
  3a, pelo mesmo passo a passo da conta.

As decisões do fundador que chegam com a etapa delas, e não antes:

| A decisão | Chega em |
| --- | --- |
| Por onde a tarefa pede ao Hub a credencial exclusiva ([0077](../../decisions/0077-how-a-credential-reaches-the-copy-task.md)) | O estudo da etapa 5 |
| A fila justa de consultas no Hub, peça nossa sem referência (delivery L28) | Quando a segunda empresa entrar |
| A ligação por pessoa: cada funcionário liga o próprio Gmail ao agente | O estudo da etapa do Google |
| Qual TOTVS, Protheus ou RM, e de qual empresa | O estudo da etapa do TOTVS |
| Com a permissão de quem o agente lê quando roda sozinho | O marco `D5` |
| A coluna por leitor e a linha por pessoa no lago | A etapa que pedir, com prova ou estudo antes |

## As palavras do fundador sobre o Lago 2, em 2026-11-23

Ao cartão refeito no commit `6c159a4d`: "isso você tá se baseado em decisões antigas, em estrutura
antiga e me trazendo para eu decidir baseado nisso. O que a gente tinha combinado é que a gente tá
reformulando tudo para seguir conforme a gente fez todo o estudo da Next [...] a gente utilizou de
Databricks". E: "Se você tiver dúvidas, me entreviste pra gente alinhar perfeitamente o que deve ser
implementado". Regra daqui em diante: antes de um cartão de etapa grande, o firstmate monta o mapa do
desenho e entrevista o fundador; o cartão só é escrito depois do alinhamento.

As respostas da entrevista, que o cartão da etapa 2 segue:

- o fluxo de ligar numa janela só, como a Nekt: "Sim, é esse";
- a máquina: "2 vCPU na primeira carga", e 1 vCPU e 2 GB nas rodadas seguintes;
- o Sankhya: "So as que o kit declara, mas nao quero que declara somente a TGFCAB nao se ja estamos
  fazendo o conector do sankhya vamos fazer ele completo" e "Sim, núcleo+fiscal+contábil";
- o intervalo: "24 h, como a Nekt";
- o nome da tabela: "Aprovo" (acima);
- o link de 30 minutos: "Já no Lago 2";
- o aviso de cópia parada: "Por ligação, na janela" (acima);
- o desenho, na página https://claude.ai/artifact/NPjMLzXJeMDM62E1ATqGkA: "Não, eu confirmo o
  desenho";
- o relógio das cópias: "(a) Hub, só o 'quando'" (o disparo e o **Rodar agora** pela mesma chamada,
  a poda do rastro do Mastra, o intervalo contado da hora de ligar, uma partida por vez), sem
  framework agora;
- a primeira carga: "Na hora, com prova antes" (uma sonda num dia útil de guarda);
- o usuário de integração do Sankhya: "Seguir como está";
- o XML: "Já no Lago 2, como a Nekt", "Etapa própria, depois da 3", ao histórico, "Okay", e, à
  coluna de texto no lugar da tabela própria, "E, não, beleza" (acima);
- os arquivos no lakehouse: "F1. A F2. A" (acima).

## O que a trilha possui

- `packages/connectors/`, o nosso kit de conectores.
- `apps/extraction/`, a cópia: o projeto Python do Meltano, o tap gerado do kit e o target do lago
  ([0074](../../decisions/0074-python-for-extraction-in-apps-extraction.md)).
- `infra/aws/`, a plataforma em CDK e o modelo da pilha de cada empresa
  ([0073](../../decisions/0073-platform-by-cdk-one-stack-per-company.md)).
- `apps/server/src/hub/connectors/`, `apps/server/src/hub/copies/`, `apps/server/src/hub/ontology/`, `apps/server/src/hub/data/` e `apps/server/src/hub/lake/`, o lago de cada empresa.
- `apps/server/src/harness/copy-clock/` e `apps/server/src/platform/copy-sql.ts`.
- As telas de Integrações, Dados (que toma o lugar de Cópias, resposta E1a) e Conhecimento.
- O contrato de acesso, com o teste de conformidade dele.

A Plataforma (identidade, Projetos, publicação, `apps/server/src/platform/` menos `copy-sql.ts`, e
`apps/edge/`) não é trilha. É manutenção: um defeito ali entra na frente da fila da trilha que o
achou (delivery L4). Toda pasta que nenhuma página de trilha nomeia é da Plataforma.

## A interface: o contrato de acesso

O Assistente, o Builder, os agentes da empresa e os apps publicados chegam ao dado da empresa por um
contrato só, com três verbos, em `packages/hub-api/`, com o teste de conformidade.

| Verbo | O que responde | De onde vem |
| --- | --- | --- |
| **Descrever** | Quais sistemas estão ligados, quais tabelas e ações existem, o que cada coluna significa, quando cada cópia rodou e se foi parcial | Um catálogo que a plataforma monta sozinha de cada cópia. A Ontologia acrescenta o significado aprovado por cima |
| **Ler** | Linhas | Da cópia quando há cópia: hoje no banco da empresa, no lago a partir da etapa 3 do lago, com o dialeto vindo do catálogo. Do sistema ao vivo quando não há. Quem decide é o contrato, pelo catálogo, nunca uma frase de prompt |
| **Agir** | O resultado de uma escrita ou de uma ação ao vivo | Sempre pelo funil de escrita, com o cartão de aprovação |

Quem lê o quê no lago o Hub decide e a AWS impõe, por etiqueta de quem lê
([0078](../../decisions/0078-how-the-lake-knows-who-reads.md)). A partir da etapa 4 do lago, o app
publicado lê do banco da empresa, que recebe do lago só o que um app declara
([0079](../../decisions/0079-the-agent-reads-the-lake-neon-serves-apps.md)).

Ler não espera a Ontologia. A Ontologia continua a única fonte de significado (decisão
[0064](../../decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md)), e um sistema
ligado hoje já serve pelo catálogo.

Uma regra do `dependency-cruiser` proíbe a trilha Agentes e Apps de importar de dados qualquer coisa
que não seja o contrato.

## A spec da camada de dados

A spec do armazenar e do interagir, no formato do Kiro (`requirements.md`, `design.md` e `tasks.md`
por parte), está em [dados-spec/](dados-spec/README.md). Ela cobre as partes 1 a 4: o dado guardado e
o catálogo, o conector, a leitura para análise e a governança mínima. O motor que ela descreve é o
banco da empresa; o lago o substitui para o dado copiado, e cada cartão do lago troca a sua parte
(fundador, 2026-11-20: "5 sim"). O fundador aprovou o escopo
em 2026-11-14 ("Aprovado", E1a a E5a) e respondeu às três perguntas da spec: P1 ("P1 OKAY"), P2 ("P2
Okay") e P3, a fonte única de conectores, o kit (decisão
[0069](../../decisions/0069-connectors-one-source-the-kit.md)). A entrada conversada entra pelo
cartão em rascunho do PR 982 (E2a). A consulta fica visível a quem lê a tabela, recolhida (E3a). O
Registro de dados é só do dono e do administrador, sem prazo por ora (E4a; 2026-11-21, `"D1 a D2 a"`).

## Como a outra trilha pede uma mudança no contrato

1. A trilha Agentes e Apps abre uma issue com o rótulo `contrato`. A issue diz o que a pessoa veria,
   qual verbo muda e traz um exemplo.
2. A trilha Dados responde com um pull request pequeno que muda só o contrato e o teste de
   conformidade.
3. O consumidor entra depois, em outro pull request da trilha Agentes e Apps.

## Os sistemas de `D3`

O fundador, 2026-11-23: "Conector eu quero: - Sankhya - Mercado Livre - Hubspot - TOTVS - Gmail com
Agenda - Outlook email - Outlook Calendar - google drive - Sharepoint - NF-e - Sicoob". São onze, e a
lista substitui a da antiga fila do molde (2026-10-30: "1. Sim 2. Sim 3. Sim") e a que o estudo do ao
vivo recomendava. Os de fora (Bling, Omie, Conta Azul, Shopee, Nuvemshop, os extratos de banco e a
Jet) voltam quando um cliente pedir, como declaração do kit. Há uma
fonte só de conectores, o nosso kit (decisão
[0069](../../decisions/0069-connectors-one-source-the-kit.md), emendada pela
[0071](../../decisions/0071-connectors-kit-live-copies-singer.md)): o kit serve o ao vivo, a
escrita, o login e a renovação, e a cópia de todo sistema de API roda como um tap Singer gerado do
kit por um adaptador só, que lê a declaração de cópia de cada tabela
([0080](../../decisions/0080-copy-declared-per-table-raw-appends.md)). A Fábrica de conectores gera
declarações do kit, escritas pela IA a partir da documentação do sistema e conferidas com uma
leitura de teste.

1. O Sankhya e o Mercado Livre, refeitos no padrão novo na etapa 2.
2. O HubSpot, no `D1`.
3. O TOTVS, feito pela Fábrica.
4. O Gmail com a Agenda e o Google Drive.
5. O e-mail e a agenda do Outlook, e o SharePoint.
6. A NF-e e o Sicoob.

Em espera: 19.2 Central de Ajuda.

## O Brain e a Ontologia, depois de `D4`

A ordem de 2026-11-12 (`"A1 B1 C1"`, `"E1"`, `"F1"`, "D Aprovado", `"H1"`, `"I1"`, "1. A"; decisões
[0064](../../decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md),
[0065](../../decisions/0065-brain-on-mastra-knowledge-behind-our-isolation.md) e
[0067](../../decisions/0067-ontology-metamodel-palantir-core-roles-and-named-links.md)). A Ontologia
da empresa, o item 1, volta como a etapa do Negócio, com cartão próprio, e passa a ler do catálogo em `D4`. Os itens 5 a 7 são
consumidos pela trilha Agentes e Apps.

1. **A Ontologia da empresa**: os conceitos de cada demanda, provados e aprovados na página Conhecimento.
   As anotações do Caderno viram propostas a provar de novo, e o Caderno sai (2026-11-23, B do
   conector).
2. **O fluxo da empresa**: os estados e as passagens, lidos dos documentos ou do histórico; entre dois sistemas, sem ligação.
3. **A saúde da Ontologia**: a prova refeita todo dia e o aviso no Início.
4. **Ligações e duas fontes**; sobe antes da saúde se o próximo cliente tiver dois sistemas no fluxo principal.
5. **O Brain do Builder e dos Projetos**, com o Mapa da página Conhecimento ("2 Okay").
6. **A entrada conversada**, o onboarding que aprende o começo: "quando tiver definido a ontologia, o brand".
7. **Os agentes da empresa nos dois**, com a Capacidade 6.
8. **Fontes de conhecimento**: arquivos, depois pastas por conector. O original de cada documento
   fica no depósito de arquivos do lago, com a sua linha numa tabela do lago (a etapa 3a), e o texto
   vai para o Knowledge, lido dali.
   Antes do cartão: fechar a 0057, decidir a retenção do que a fonte apagou, escolher quem converte
   PDF e DOCX em texto e ajustar a frase da 0065 sobre dado de conector.
9. **A revisão semanal**, que só propõe.
10. **A busca por significado**, quando a medida pedir.
