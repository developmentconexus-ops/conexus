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

O lago da empresa nasce e some, a etapa 1 do lago, fechou em 2026-11-23: o fundador o usou na
nuvem, na v0.24.110, e a linha de fechamento está no
[arquivo de aprovação](../../approvals/o-lago-da-empresa-nasce-e-some.md). O operador cria e apaga o
lago de uma empresa pela Central, e apagar o cliente leva o lago. O cartão está no histórico do
`main`, no commit `0a3e4d1c`, o último que o mudou. A trilha está sem cartão em `docs/steps/` até o
cartão da etapa seguinte entrar.

A etapa seguinte é a 2 do lago, A primeira cópia chega ao lago: o cartão dela está em
[a-primeira-copia-chega-ao-lago.md](../a-primeira-copia-chega-ao-lago.md), à espera da aprovação do
fundador. Ele vem em cinco partes: a parte 0, em que o legado sai do banco da empresa; a etapa O
conector no padrão novo; e as partes 1 a 3 da cópia.

As etapas anteriores fecharam: a pergunta respondida com a origem, em 2026-11-16
([aprovação](../../approvals/a-pergunta-respondida-com-a-origem.md)); cada papel lê só o seu, com
a porta única, em 2026-11-17 ([aprovação](../../approvals/cada-papel-le-so-o-seu.md)); e o Registro
e conformidade, em 2026-11-22 ([aprovação](../../approvals/registro-e-conformidade.md)).

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

A janela Ligar em quatro passos, a descrição do sistema e o link de 30 minutos (spec 02) vêm numa
etapa própria logo depois da etapa 2. O passo "o que copiar" dessa janela é a seção Tabelas no lago,
que a etapa 2 cria.

| Etapa | A pergunta que o fundador responde na tela | Prova com |
| --- | --- | --- |
| 1. O lago da empresa nasce e some | O Conexus cria e apaga sozinho o lago isolado de uma empresa, sem ninguém abrir o console da AWS? | Nenhum conector |
| 2. A primeira cópia chega ao lago | Uma tabela de um sistema ligado chega inteira, a mudança de hoje aparece na rodada seguinte, e eu vejo isso na página Dados? | Uma tabela do Sankhya; o dublê do HubSpot na mesma bateria, para o adaptador não aprender um sistema só |
| O conector no padrão novo, entre a parte 0 e a parte 1 da etapa 2 | O Assistente continua lendo o Sankhya e o Mercado Livre enquanto cada conector é refeito, e cada um nasce de uma definição só, com a sua skill e a classe da credencial? | O Sankhya e o Mercado Livre, um pull request por conector |
| 3. O agente responde pelo lago | Pergunto ao Assistente e ele responde do lago, diz de quando é, e recusa o que o meu papel não lê? É o `D2` | Qualquer tabela copiada |
| 4. O app lê o que foi publicado | Um app publicado mostra o dado do lago sem nunca ver uma tabela pela metade? | Qualquer tabela copiada |
| 5. A segunda classe pelo mesmo caminho | Uma lista de um sistema de outro tipo entra pelo mesmo caminho, sem código novo no adaptador? | O Mercado Livre, a lista de vendas. O estudo usa o conector dele numa plataforma de referência e o que já rodamos |
| 6. Escolher o que copiar | Eu marco o que quero copiar de cada sistema, com as tabelas e os campos da minha empresa, e nada vem marcado? | O Sankhya pelo dicionário, o Mercado Livre pela lista declarada |
| 7. A tabela grande e sem coluna de alteração | As fiscais e as contábeis entram, a primeira carga termina numa tarde, e o que sumiu da fonte some do lago? | As fiscais e contábeis do Sankhya; as listas do Mercado Livre sem filtro de alteração |

Antes da etapa 1 entrou a mudança de método que dá ao
repositório regra, teste e conferência para Python, para a infraestrutura da AWS e para testar o
Hub sem a AWS (delivery L20); nela a regra D25 é reescrita pelo motivo dela, sem exceção. Antes de
qualquer outra empresa entra a etapa da conta oficial da AWS, que está no
[roteiro](../../roadmap.md): até lá o lago roda na conta de laboratório, que é provisória
([0072](../../decisions/0072-the-lab-aws-account-is-provisional.md)), só com dado gerado e com o da
empresa do fundador.

A etapa 1 deixa às seguintes o que o estudo dela achou e o cartão não construiu:

- **Para o cartão da etapa 2.** Apagar uma área do depósito com tabela dentro falha ("namespace not
  empty"); o apagar do lago e o do que sobrou de uma criação que falha hoje só encontram áreas
  vazias.
- **Para o cartão da etapa 3.** A recusa por `DESCRIBE` e a recusa por `SELECT` têm de virar o mesmo
  "não encontrado" (security S10), como a https://github.com/developmentconexus-ops/conexus/issues/1226
  pede para o nome e as colunas.
- **Para a primeira etapa que usar o lago.** A linha em `ready` não relê a AWS: uma pilha mudada ou
  apagada por fora só aparece quando alguém apaga o lago. Essa etapa decide quando reler: antes de
  agir na pilha, como o exemplo serverless da AWS, ou por um relógio, como o Crossplane. Uma pilha
  sem linha, que só nasce de um banco do Hub restaurado de cópia, acha-se pelas etiquetas
  `conexus-empresa` e `conexus-modelo`; nenhuma etapa constrói esse inventário (0073).

Depois da etapa 7 vêm duas frentes, cada etapa com estudo e cartão próprios:

- **Os conectores por classe**, nesta ordem: o TOTVS, criado pela Fábrica, como fonte do lago; o
  Gmail com a Agenda e o Drive como ferramenta do agente, que é o `D1`; a planilha do Drive no lago;
  o e-mail e a agenda do Outlook; o SharePoint; a NF-e; e o Sicoob. O TOTVS espera o fundador dizer
  qual e de que empresa vem o acesso; o Google e a Microsoft esperam o app de login de cada um.
- **A porta de fora**, para sistemas e agentes de fora lerem o lago pelo Hub (2026-11-21: "P3
  sim"). Ela é desenhada quando chegar; chave de API, por ora, não entra.

A ordem entre as duas frentes é decidida quando a etapa 7 fechar.

O cartão da etapa 2 leva o aviso de cópia parada, que saiu do Registro e conformidade (2026-11-21,
"R1 a R2 a"): o aviso vai a quem pode consertar a cópia e à lista de e-mails da empresa; a unidade é
a parada, e não a rodada, com um aviso quando a cópia para e um lembrete por dia enquanto ela
continuar parada; o botão Seguir só entra se alguém pedir. O estudo da etapa decide se a parada é da
conexão ou da tabela, com a rodada do lago na mão, e se usa as tabelas `copy_follower`,
`alert_recipient` e `copy_notice`, que estão no `main` sem uso.

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
seguintes.

Ficam para depois do lago implementado, por palavra do fundador em 2026-11-20: o tratamento e a
qualidade dos dados, a camada Negócio no lago e o agente de dados. Por decisões anteriores: o
BigQuery e o dado na nuvem do cliente, os gatilhos (`D5`), a medição por empresa (`D6`, que espera
a conta oficial) e os bancos de dados por tap pronto. Os taps prontos da loja do Meltano ficam fora
até um sistema pedir, e são ponto de partida do estudo de cada conector (2026-11-21: "G2 a"). Os
documentos do Drive, do SharePoint e do Gmail não viram tabela: a planilha vai para o lago; o
documento guarda o original, com uma linha por arquivo no catálogo do lago, e o texto vai para o
Knowledge, na etapa das fontes de conhecimento do Brain (2026-11-21: "g3 a").

As decisões do fundador que chegam com a etapa delas, e não antes:

| A decisão | Chega em |
| --- | --- |
| Por quanto tempo a camada bruta guarda o histórico (a decisão de 2026-11-18: histórico desligado por padrão, ligado por tabela) | O cartão da etapa 2 |
| Por onde a tarefa pede ao Hub a credencial exclusiva ([0077](../../decisions/0077-how-a-credential-reaches-the-copy-task.md)) | O estudo da etapa 5 |
| A fila justa de consultas no Hub, peça nossa sem referência (delivery L28) | Quando a segunda empresa entrar |
| A ligação por pessoa: cada funcionário liga o próprio Gmail ao agente | O estudo da etapa do Google |
| Qual TOTVS, Protheus ou RM, e de qual empresa | O estudo da etapa do TOTVS |
| Com a permissão de quem o agente lê quando roda sozinho | O marco `D5` |
| A coluna por leitor e a linha por pessoa no lago | A etapa que pedir, com prova ou estudo antes |

## O que a trilha possui

- `packages/connectors/`, o nosso kit de conectores.
- `apps/extraction/`, a cópia: o projeto Python do Meltano, o tap gerado do kit e o target do lago
  ([0074](../../decisions/0074-python-for-extraction-in-apps-extraction.md)).
- `infra/aws/`, a plataforma em CDK e o modelo da pilha de cada empresa
  ([0073](../../decisions/0073-platform-by-cdk-one-stack-per-company.md)).
- `apps/server/src/hub/connectors/`, `apps/server/src/hub/copies/`, `apps/server/src/hub/ontology/`, `apps/server/src/hub/data/` e `apps/server/src/hub/lake/`, o lago de cada empresa.
- `apps/server/src/builder/copy-clock/` e `apps/server/src/platform/copy-sql.ts`.
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
   fica guardado, com uma linha por arquivo no catálogo do lago, e o texto vai para o Knowledge.
   Antes do cartão: fechar a 0057, decidir a retenção do que a fonte apagou, escolher quem converte
   PDF e DOCX em texto e ajustar a frase da 0065 sobre dado de conector.
9. **A revisão semanal**, que só propõe.
10. **A busca por significado**, quando a medida pedir.
