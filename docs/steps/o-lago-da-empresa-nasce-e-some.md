# O lago da empresa nasce e some

Trilha Dados, a etapa 1 do lago, na ordem de [trilhas/dados.md](trilhas/dados.md). A pergunta:
"O Conexus cria e apaga sozinho o lago isolado de uma empresa, sem ninguém abrir o console da AWS?"
O estudo da etapa fica fora do repositório (delivery L21), com as sondas, as notas e os sete testes
que rodaram na conta de laboratório em 2026-11-21; este cartão cita dele só o que a construção
precisa. As cinco letras do fundador ao estudo já estão dadas: "6.a 7a 8a 9a 10a" (2026-11-21),
que são as decisões A a E abaixo. Em 2026-11-22, sobre o cartão: "2. A" (escrito à noite, aprovado
de manhã, lendo).

Cada linha do `main` citada foi lida em `4d143a99`. As versões que a construção instala são as que o
estudo leu: `aws-cdk-lib` 2.278.0, `aws-cdk` 2.1149.0, `constructs` da faixa que o `aws-cdk-lib`
pede, e `@aws-sdk/client-cloudformation`, `@aws-sdk/client-s3tables`, `@aws-sdk/client-sts` e
`@aws-sdk/credential-providers` 3.1175.0. O `main` instala hoje só `@aws-sdk/client-s3`, na 3.1146.0.

**Antes da construção.** Esta etapa constrói só depois de duas coisas no `main`: o fechamento do
Registro e conformidade, e a mudança de método que a [trilha Dados](trilhas/dados.md) põe antes da
etapa 1 (delivery L20). Da mudança de método, a etapa usa: a regra do dublê da AWS no guia de
testes (a porta de memória para o Hub e a QA; o adaptador testado com respostas gravadas da AWS,
entrando pelo `requestHandler` do SDK); a conferência de `infra/aws/` na CI; a regra C56 nomeando os
dois donos de `@aws-sdk/*`; a forma da chave da AWS na S31 (o arquivo de credenciais, com o caminho
em `AWS_SHARED_CREDENTIALS_FILE`); e a D25 reescrita pelo motivo dela. Se a mudança de método mesclar
com outra forma, a unidade que a usa segue a forma mesclada e o firstmate relê esta seção.

A medida: cerca de 1.950 linhas alteradas em 6 unidades, abaixo das 4.000 da delivery L2.

## A página do fundador

**No fim desta etapa** você cria e apaga o lago de uma empresa por um botão na Central, na página do
cliente, sem abrir o console da AWS. O lago é o lugar, na AWS, onde as cópias daquela empresa vão
morar a partir da etapa 2: um depósito de tabelas só dela, um papel de leitura que só aceita a
própria empresa, e um grupo de consultas próprio. Nesta etapa ele nasce vazio. Nada é copiado ainda.

**O roteiro de uso.** No Hub da nuvem, com duas empresas de teste já cadastradas, "Empresa Teste A"
e "Empresa Teste B".

1. Na Central, abra o cliente "Empresa Teste A". Há um bloco novo, **Lago de dados**, com "Esta
   empresa ainda não tem lago." e o botão **Criar o lago**.
2. Clique. O bloco diz "Criando o lago…". Em menos de um minuto ele diz **Pronto**, com o nome do
   lago, a região e a hora.
3. Se quiser, abra o console da AWS só para olhar: o depósito de tabelas daquela empresa está lá,
   com o mesmo nome.
4. Repita com "Empresa Teste B".
5. O firstmate roda na sua frente três tentativas da empresa A de alcançar o lago da B. A AWS recusa
   as três.
6. Em A, clique **Apagar o lago**, digite o nome da empresa e confirme. O bloco diz "Apagando o
   lago…" e volta a "Esta empresa ainda não tem lago.". No console, sumiu.
7. Crie o lago de A de novo, na mesma hora. Funciona.

Os tempos vêm dos testes de 21/11, no modelo desta etapa: de 23 a 27 s para criar e de 15 a 21 s
para apagar. Uma criação que falha leva de 2 a 3 minutos até a AWS desfazer tudo; nesse tempo o
bloco continua em "Criando o lago…" e termina em "Não deu para criar o lago.", com **Tentar de
novo**.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página e responde às decisões F e
G. Na construção do primeiro grupo: dá a palavra para o firstmate preparar a conta de laboratório
pelo passo a passo guardado (a sua "9a"); a palavra cobre também tirar duas peças que foram feitas
à mão na conta em 19/11, a ligação do `S3 Tables` com o Athena e o orçamento, que passam a ser código
da plataforma. No fim: faz o roteiro, diz o que viu e aprova os textos do bloco, que o pull request
do último grupo lista.

**As suas decisões que o estudo já levou, e as suas respostas** (2026-11-21, "6.a 7a 8a 9a 10a"):

- **A ("6.a").** O lago aparece na Central, na página do cliente. Só o operador cria e apaga, por
  botão.
- **B ("7a").** Apagar o lago apaga na hora, sem volta, digitando o nome da empresa. Apagar o
  cliente leva o lago junto.
- **C ("8a").** O isolamento você confere no roteiro, com o firstmate mostrando as recusas da AWS.
  Nenhum botão novo.
- **D ("9a").** O firstmate prepara a conta uma vez, com a sua palavra, por um passo a passo
  guardado no repositório. O orçamento de hoje, US$ 75 por mês, e o alarme passam a ser escritos na
  plataforma; o valor e o e-mail ficam fora do repositório, numa variável da Release.
- **E ("10a").** Depois de uma criação que falha, o Hub procura o depósito daquele lago que tenha
  sobrado e o apaga.

**O que muda em relação ao estudo, e por quê.** Três coisas técnicas, do firstmate (tabela "As
decisões do firstmate"). Nenhuma muda o que você vê:

- **O teste da ligação em modo Lake Formation (o P2) roda na construção, numa região da conta de
  laboratório que ainda não tem a ligação.** Em us-east-2 ela já existe, feita à mão; por isso o
  passo a passo a tira antes de a plataforma a criar como código.
- **O papel de serviço do CloudFormation vira administrador do lago, como código da plataforma.** O
  teste de 21/11 mostrou que, sem isso, a pilha não consegue dar ao papel de leitura da empresa as
  duas permissões de enxergar o catálogo. Quatro formas mais estreitas foram tentadas e falharam. A
  plataforma acrescenta o papel à lista de administradores, sem tirar quem já está nela.
- **O id do lago é novo a cada tentativa, também depois de uma criação que falhou.** O teste mostrou
  que o nome do depósito fica preso mesmo quando a criação falha.

**Fica de fora.**

- **Atualizar o lago de todas as empresas quando o modelo muda.** Na etapa 1 não há modelo anterior.
  A etapa grava a versão do modelo em cada lago, para a primeira etapa que o mudar saber o que
  atualizar.
- **O papel que escreve a cópia e o que publica para os apps.** Entram com as etapas 2 e 4, cada um
  por uma atualização da pilha de cada empresa.
- **As permissões por tabela de quem lê.** São da etapa 3; nesta, ninguém lê nada.
- **Um aviso de que a conta chegou perto das 100 empresas.** O registro 0070 reabre perto de 90; a
  falha de cota aparece hoje como "Não deu para criar o lago.", e o motivo fica no registro do Hub.
- **Um botão "Conferir isolamento"** (a sua C (a)).
- **A conta oficial da AWS e o certificado no lugar da chave** (registro 0072).
- **As issues `next-card` abertas.** Nenhuma trata do lago; cada uma espera a etapa da sua pasta.

**As decisões suas nesta etapa.** Duas novas, F e G.

- **F. Por onde o modelo do lago chega à AWS.** Quando o Hub cria um lago, ele manda à AWS o modelo
  da pilha. O teste de 21/11 achou que o papel de serviço, que executa o modelo, precisa ser
  administrador do lago, e administrador do lago pode dar leitura de qualquer lago da conta. Se o
  modelo vai dentro do pedido, quem roubar a chave do Hub, do endereço do servidor, pode mandar outro
  modelo, e esse modelo pode criar um papel que alguém de fora da AWS assume para ler todas as
  empresas. O registro 0075 já aceita que a chave roubada escolhe a empresa; esta é uma porta a mais,
  que dura depois de a chave ser trocada.
  - **(a)** O modelo fica num depósito da plataforma que só a Release escreve, e a permissão do Hub
    só cria pilha a partir de um endereço desse depósito. A chave roubada só cria lagos do nosso
    modelo. Exemplo: a Release publica `lago/<versão>.json`; o Hub pede "crie a pilha deste
    endereço"; um pedido com outro modelo é recusado pela AWS antes de rodar. **Recomendo a.** É o que
    faz o ParallelCluster, o programa da AWS que cria uma pilha por cluster, na mesma situação: ele
    guarda o modelo num depósito e manda o endereço. Custa um depósito, que fica vazio a não ser pelos
    modelos, e um passo na Release. Veredito: nativo; a AWS documenta a condição
    `cloudformation:TemplateUrl` para isso.
  - **(b)** O modelo vai dentro do pedido nesta etapa, como o estudo propunha, e passa ao endereço
    fixo antes da primeira cópia, na etapa 2. Nesta etapa o lago não tem dado nenhum.
- **G. A permissão do Hub na tabela nova do lago** (data D11). O Hub guarda uma linha por empresa
  com lago: qual é o lago, em que conta e região, a pilha, a versão do modelo e o último estado visto.
  - **(a)** O login do Hub como operador lê, grava, muda as colunas de estado e apaga essas linhas; o
    login da empresa não as vê. Exemplo: o operador cria o lago de A, a linha nasce; apaga, a linha
    sai. **Recomendo a**, a mesma forma do banco da empresa (`company_database`). Veredito: nativo
    (as permissões do PostgreSQL por SQL, data D10).
  - **(b)** Outra forma, que você diga.

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 A plataforma na conta (um PR) | U1 A plataforma e o modelo | `infra/aws/` como pacote: o aplicativo CDK com a pilha da plataforma (o papel do Hub, o papel de serviço, o limite de permissão, o papel de serviço como administrador do lago, a ligação do `S3 Tables` em modo Lake Formation, o depósito dos modelos, o orçamento) e o modelo do lago de uma empresa, sintetizado e guardado em `infra/aws/lake.template.json`; o P2 e o P3 rodados na conta de laboratório | `infra/aws/` (novo), `package.json`, `package-lock.json`, `knip.json`, `.dependency-cruiser.cjs`, `docs/reference/stack.md` | security (S36, S40) | o `main` depois da mudança de método |
| G1 | U2 A Release e a preparação da conta | O workflow `aws-platform.yml`, chamado pela Release antes do `deploy`: entra na AWS pelo OIDC do GitHub, publica a plataforma e o modelo em `lago/<versão>.json`; a imagem do Hub leva o modelo; o passo a passo da preparação, em português; o P4 | `.github/workflows/` (`aws-platform.yml` novo, `publish.yml`, `ci.yml` só no job `image`), `infra/hub.Dockerfile`, `docs/how-to/` (`aws-conta-de-laboratorio.md` novo), `docs/index.md`, `scripts/` (só a conferência dos workflows, se ela recusar o job novo) | delivery (L17) | U1 |
| G2 A tabela do lago (um PR, data D11) | U3 A linha do lago | O esquema `lake`, a tabela `lake.company_lake`, a migração, as permissões do login do operador e a foto do catálogo | `apps/server/src/hub/lake/` (só `tables.ts`), `apps/server/migrations/`, `apps/server/database-grants.sql` | data (D4, D10, D11, D15, D17) | o `main` depois da mudança de método |
| G3 O lago pelo Hub (um PR) | U4 O adaptador da AWS | `platform/aws.ts`: a porta `LakeStacks` e o adaptador único, a sessão de 15 minutos com a etiqueta da empresa, os prazos e as três respostas; o dublê de memória e o servidor de respostas gravadas em `platform/test-aws.ts`; as gravações | `apps/server/src/platform/` (`aws.ts`, `test-aws.ts`, `config.ts`, `recordings/aws/`), `apps/server/package.json`, `package-lock.json`, `.dependency-cruiser.cjs` | testing (T5, T14, T29) | G1 e G2 mesclados |
| G3 | U5 O lago no Hub | As três rotas, a admissão, o estado lido da pilha, o motivo da falha, a conferência do que sobrou, e o lago como segundo recurso de fora na exclusão do cliente | `apps/server/src/hub/lake/` (novo), `apps/server/src/hub/operations/` (`clients.ts`, `routes.ts`, `public.ts`), `apps/server/src/hub/projects/public.ts`, `apps/server/src/hub/identity/admission.ts`, `packages/hub-api/src/` (`lakes.ts` novo, `index.ts`, `failures.ts`, `project-failures.ts`), `apps/server/src/main.ts`, `scripts/rerun-never.json` | data (D22); security (S8, S10, S41) | U4 |
| G3 | U6 O bloco na Central | O bloco **Lago de dados** na página do cliente, com os seis estados, os dois botões e a confirmação pelo nome | `apps/web/src/hub/operations/` (`lake.tsx` novo, `queries.ts`, `client.tsx`), `apps/web/src/routes/_app/operations/clients/$companyId.tsx`, `apps/web/sweep-replies.ts`, `apps/web/sweep-states.ts`, `docs/reference/telas.md` (só TB24) | web, design | U5 |

Três grupos, um pull request cada ([delivery L9](../guides/delivery.md)), um commit por unidade.

- **A linha principal.** G1 e G2 em paralelo: não dividem pasta. G3 parte dos dois mesclados, porque
  o adaptador usa os nomes que a plataforma fixa e o lago usa a tabela.
- **O G2 é só a tabela e as permissões**, num pull request próprio com a palavra do fundador (data
  D11; decisão G). Nenhum outro grupo cria ou tira permissão no banco do Hub.
- **O que toca a outra trilha.** Nenhum arquivo de `builder/`. A U5 muda `packages/hub-api` (operações
  novas e o texto de `CLIENT_DELETION_PENDING`) e `hub/operations/clients.ts`, que é da Plataforma; o
  pull request do G3 avisa a trilha Agentes e Apps (delivery L27, por analogia).
- **A QA** ([testing T25](../guides/testing.md)) roda depois do G3, pelo roteiro de uso e pela matriz
  de estados, no Hub local com o servidor de respostas gravadas da U4.
- **Os modelos.** U1, U4 e U5 em Opus (permissões da AWS entre dois papéis; a tradução dos erros do
  SDK; o estado entre o banco do Hub e a pilha). U2, U3 e U6 em Sonnet.

**Orçamento de código alterado.** Linhas mudadas, as tiradas também, sem testes nem gerados (o
`lake.template.json` é gerado).

- U1: ~620 (`bin/app.ts` ≈30; `lib/platform.ts` ≈330, os quatro papéis e as suas políticas, a ligação,
  o depósito, o orçamento; `lib/lake.ts` ≈170, o modelo; `lib/names.ts` ≈30; `package.json`,
  `tsconfig.json` e `cdk.json` ≈40; `knip.json`, `.dependency-cruiser.cjs` ≈10; `stack.md` ≈10).
- U2: ~260 (`aws-platform.yml` ≈90; `publish.yml` ≈10; `hub.Dockerfile` 2; o passo a passo ≈150 linhas
  de texto; `docs/index.md` 1).
- U3: ~80 (`tables.ts` ≈45; as duas migrações ≈20, uma gerada; `database-grants.sql` ≈15).
- U4: ~380 (`aws.ts` ≈260; `test-aws.ts` ≈90, que conta, porque o servidor serve a QA; `config.ts` ≈25;
  `package.json` 4; `.dependency-cruiser.cjs` ≈8).
- U5: ~420 (`hub/lake/lake.ts` ≈190, criar, ler e apagar; `settle.ts` ≈60, a função de estado;
  `routes.ts` ≈45; `public.ts` ≈25; `hub-api/lakes.ts` ≈60; `failures.ts` ≈10; `admission.ts` 2;
  `clients.ts` ≈20, o recurso de fora; `projects/public.ts` ≈5; `main.ts` ≈6).
- U6: ~190 (`lake.tsx` ≈140; `queries.ts` ≈15; `client.tsx` ≈5; a rota ≈5; `sweep-replies.ts` ≈20;
  `telas.md` ≈5).

**Total da etapa:** cerca de 1.950 linhas alteradas.

## Os critérios de aceite

Faixas: G1 de 1 a 19, G2 de 20 a 29, G3 de 30 a 79. "Ao vivo" é uma prova na conta de laboratório,
com a credencial do firstmate, com o comando e a saída no pull request (testing T14); nenhum teste da
CI chega à AWS.

### G1

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `npm run synth -w @conexus/infra-aws` roda sem conta da AWS e escreve `infra/aws/lake.template.json` igual ao do repositório; um modelo mudado sem sintetizar deixa a conferência vermelha | `infra/aws/test/lake.test.ts`, "o modelo guardado é o que a síntese escreve" | must |
| 2 | U1 | O modelo do lago só tem `Parameters` (`LakeId`, `CompanyId`), `Resources` e `Outputs`: nenhum `BootstrapVersion`, `Rules`, `CDKMetadata` nem arquivo anexo; os recursos são o depósito `conexus-<LakeId>` com a etiqueta `conexus-empresa`, as áreas `raw` e `current`, o papel leitor com o limite de permissão, o grupo do Athena com os resultados geridos e o teto de bytes, e as duas concessões de `DESCRIBE` ao papel leitor, pelo nome, no catálogo da empresa e no banco `current` | `lake.test.ts`, "o modelo leva só as sete peças da empresa" | must |
| 3 | U1 | A confiança do papel leitor só aceita o papel do Hub, e só com `conexus-empresa` igual ao `CompanyId` e `conexus-leitor` presente, com `ForAllValues` e um `Null` sobre as chaves; recusa: uma terceira chave de etiqueta | `lake.test.ts`, "o leitor só confia no Hub com as duas etiquetas"; ao vivo no passo 5 do roteiro | must |
| 4 | U1 | A política do papel do Hub: `CreateStack` só com `RoleARN` do papel de serviço, `TemplateURL` no depósito dos modelos (decisão F (a)) e a etiqueta `conexus-empresa` igual à da sessão; ler, ler os eventos e apagar só a pilha com a etiqueta da sessão; `PassRole` só do papel de serviço ao CloudFormation; apagar áreas e depósito de tabelas só com a etiqueta da sessão; nenhum `iam:Create*`, nenhum `s3tables:CreateTableBucket`, nenhum `cloudformation:UpdateStack` | `infra/aws/test/platform.test.ts`, "o Hub só cria do modelo, pelo papel de serviço, na própria empresa"; ao vivo, o P3 de novo com a plataforma de verdade: as sete recusas da tabela B.4 do estudo | must |
| 5 | U1 | O papel de serviço só cria papel com o limite de permissão preso, nunca o tira, e entra na lista de administradores do lago com `MutationType: APPEND`: quem já era administrador continua | `platform.test.ts`, "o papel de serviço só cria papel com o limite"; ao vivo: a lista de administradores antes e depois do primeiro `cdk deploy` | must |
| 6 | U1 | O P2: numa região da conta de laboratório sem a ligação, a plataforma cria o `s3tablescatalog` em modo Lake Formation (as duas permissões padrão vazias, `AllowFullTableExternalDataAccess` em `"False"`), um lago novo aparece como catálogo filho, e um papel com IAM completo e sem concessão do Lake Formation não lê tabela nenhuma; apagada a pilha da plataforma, a região volta como estava | ao vivo, no pull request do G1 | must |
| 7 | U1 | O orçamento mensal e o alarme por e-mail nascem da plataforma, com o valor e o e-mail lidos de parâmetros; nenhum número de conta, e-mail, endereço de servidor ou valor em dólar no repositório | `platform.test.ts`, "o orçamento lê o valor e o e-mail de parâmetros"; `lake.test.ts`, "nenhum número de conta no modelo" | must |
| 10 | U2 | A Release chama `aws-platform.yml` antes do `deploy`: o job entra na AWS pelo OIDC, sem chave guardada, no ambiente `production`; publica a plataforma; e grava o modelo em `lago/<sha-256 do arquivo>.json`, sem sobrescrever uma versão já publicada | a conferência dos workflows (`npm run check:workflows`); ao vivo, o P4: o workflow disparado à mão no `main` depois do G1 mesclado, sem gastar nome de Release (delivery L17) | must |
| 11 | U2 | A confiança do papel da Release recusa um job fora do ambiente `production` (a condição `sub`) | ao vivo, no P4: o mesmo workflow num ramo sem o ambiente recebe a recusa | must |
| 12 | U2 | A imagem do Hub leva `lake.template.json` e não leva o CDK | o job `image` de `.github/workflows/ci.yml`, um passo novo: "a imagem tem o modelo do lago e não tem aws-cdk-lib" | should |
| 13 | U2 | O passo a passo da preparação diz, na ordem, as cinco coisas que só um administrador faz uma vez, cada uma com o comando e o que ver depois | leitura do firstmate, que o segue na conta de laboratório | must |

### G2

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 20 | U3 | A migração cria `lake.company_lake`; a foto do catálogo traz só as permissões da decisão G; o login da empresa não lê a tabela | `apps/server/src/platform/catalog.test.ts`, de hoje, contra a foto nova; `apps/server/src/hub/lake/tables.test.ts`, "a empresa não lê o lago" | must |
| 21 | U3 | O banco recusa: um `lake_id` fora de `^[a-z0-9]{12}$`; dois lagos com o mesmo `lake_id`; `failed` sem `failure`, ou `failure` fora de `failed`; `ready`, `deleting` ou `delete_failed` sem `stack_id` | `tables.test.ts`, "cada regra recusa a linha errada" | must |

### G3

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 30 | U4 | `create` manda um `CreateStack` com o nome `conexus-lago-<lakeId>`, `ClientRequestToken` igual ao `lakeId`, `OnFailure: DELETE`, o `RoleARN` do papel de serviço, o `TemplateURL` da versão, os dois parâmetros e as etiquetas `conexus-empresa` e `conexus-modelo`; a resposta gravada vira `DONE` com o id da pilha | `apps/server/src/platform/aws.test.ts`, "criar manda o pedido inteiro e lê o id" | must |
| 31 | U4 | Toda chamada vai por uma sessão do papel do Hub com a etiqueta `conexus-empresa` da empresa do pedido e 900 s; o `AssumeRole` recusado vira `REFUSED`, sem chamada ao CloudFormation | `aws.test.ts`, "a sessão leva a etiqueta da empresa" e "a sessão recusada não chama a pilha" | must |
| 32 | U4 | Limitação de taxa e erro 500 são repetidos pelo SDK e, esgotados, viram `NO_ANSWER`; `AccessDenied` e `ValidationError` viram `REFUSED` na primeira; uma AWS que não responde vira `NO_ANSWER` dentro do prazo da chamada | `aws.test.ts`, "a repetição é a do SDK", "a recusa não repete", "a AWS calada responde dentro do prazo" | must |
| 33 | U4 | Ler e apagar recebem só o id da pilha (`StackId`), nunca o nome; a pilha apagada, lida pelo id, volta `DELETE_COMPLETE` | `aws.test.ts`, "a pilha apagada lida pelo id" | must |
| 34 | U4 | `firstFailure` devolve o recurso e o tipo do primeiro evento `_FAILED`; a frase da AWS não sai do adaptador | `aws.test.ts`, "o primeiro evento de falha, sem a frase" | must |
| 35 | U4 | `leftover` acha o depósito `conexus-<lakeId>`, apaga as áreas e depois o depósito, e responde `DELETED`; sem depósito, `NONE`; o depósito que a AWS diz não existir conta como apagado | `aws.test.ts`, "o depósito que sobrou sai" | must |
| 36 | U4 | Só `platform/aws.ts` importa `@aws-sdk/client-cloudformation`, `client-s3tables`, `client-sts` e `credential-providers`; o registrador do SDK fica o padrão, e o modelo, a credencial e a frase da AWS não aparecem no registro do Hub | `npm run deps`; `aws.test.ts`, "o registro do Hub não leva o pedido" | must |
| 37 | U4 | O Hub não sobe com `AWS_ACCESS_KEY_ID` ou `AWS_SECRET_ACCESS_KEY` no ambiente (`CONFIG_INVALID`); lê a chave do arquivo de `AWS_SHARED_CREDENTIALS_FILE`, recusado se outros o leem (S31) | `apps/server/src/platform/config.test.ts`, "a chave da AWS só por arquivo" | must |
| 40 | U5 | O operador cria: `POST /api/clients/{companyId}/lake` responde 202 com `CREATING`; a linha nasce com um `lakeId` novo; um `CreateStack`. Recusa: quem não opera a instalação, o Dono da empresa incluído, recebe 404, como `getClient` | `apps/server/src/hub/lake/lake.test.ts`, "o operador cria; o dono recebe não encontrado" | must |
| 41 | U5 | Dois pedidos de criar ao mesmo tempo: os dois respondem o mesmo lago, e há um `CreateStack` | `lake.test.ts`, "dois cliques criam um lago" | must |
| 42 | U5 | `GET …/lake` com a linha em `creating` lê a pilha pelo id; `CREATE_COMPLETE` vira `READY` com o depósito, a região e a hora; com a linha em `ready`, a leitura não chama a AWS | `lake.test.ts`, "a leitura acerta a linha e para de perguntar" | must |
| 43 | U5 | A resposta do `CreateStack` perdida (`NO_ANSWER`): a linha fica sem pilha; a leitura seguinte manda o mesmo pedido com a mesma chave e guarda o id; há uma pilha só | `lake.test.ts`, "a resposta cortada não cria duas pilhas" | must |
| 44 | U5 | A criação que falha: a pilha some (`DELETE_COMPLETE` com a linha em `creating`); a leitura grava `FAILED` com `LAKE_CREATE_FAILED`, registra o recurso do primeiro evento de falha, e apaga o depósito que sobrou | `lake.test.ts`, "a falha mostra o código e apaga o que sobrou" | must |
| 45 | U5 | Criar depois de uma falha usa um `lakeId` novo, e um nome de pilha e de depósito novos | `lake.test.ts`, "tentar de novo troca o id" | must |
| 46 | U5 | Apagar: um nome que não é o da empresa recebe 422 `CLIENT_NAME_MISMATCH`, sem chamada à AWS; o nome certo, 202 `DELETING` e um `DeleteStack`; a pilha apagada leva a linha, e a leitura volta `NONE`. Recusa: apagar com a linha em `creating` ou `deleting` recebe 409 `LAKE_BUSY` | `lake.test.ts`, "apagar pede o nome e leva a linha" | must |
| 47 | U5 | A resposta do `DeleteStack` perdida: a leitura acha a pilha ainda pronta com a linha em `deleting` e manda o `DeleteStack` de novo | `lake.test.ts`, "o apagar cortado é retomado" | must |
| 48 | U5 | `DELETE_FAILED` vira `DELETE_FAILED`; apagar de novo manda outro `DeleteStack` | `lake.test.ts`, "o apagar que falhou se tenta de novo" | must |
| 49 | U5 | A AWS calada na leitura: 200 com o último estado da linha, nenhuma falha na tela; o registro `LAKE_AWS_SILENT` com a chamada | `lake.test.ts`, "a AWS calada não derruba a leitura" | must |
| 50 | U5 | Criar, apagar e criar de novo a mesma empresa, em seguida, funciona: o segundo lago tem outro id e não esbarra no nome preso | `lake.test.ts`, "criar de novo na mesma hora"; ao vivo, o passo 7 do roteiro | must |
| 51 | U5 | Apagar o cliente com lago: a primeira tentativa manda o `DeleteStack` e responde 503 `CLIENT_DELETION_PENDING`; depois de a pilha sumir, o mesmo pedido apaga o cliente (204) e a linha do lago. Um cliente sem banco e sem lago sai na hora, como hoje | `apps/server/src/hub/operations/clients-lake.test.ts`, "o cliente leva o lago" | must |
| 52 | U5 | Apagar o cliente com o lago em `creating`: `CLIENT_DELETION_PENDING`, sem `DeleteStack`, até o lago ficar pronto ou falhar | `clients-lake.test.ts`, "o cliente espera o lago nascer" | must |
| 53 | U5 | Cada chamada à AWS de um pedido vai pela sessão da empresa daquele pedido: o dublê recusa a chamada de A pela pilha de B, e o Hub nunca a faz | `lake.test.ts`, "o Hub só chama a pilha da empresa do pedido" | must |
| 54 | U5 | O registro do Hub leva só `companyId`, `lakeId`, a chamada, o código e o recurso que falhou; nenhuma frase da AWS, nenhum id de conta | `lake.test.ts`, "o registro do lago só tem campos escolhidos" | must |
| 60 | U6 | Sem lago: "Esta empresa ainda não tem lago." e **Criar o lago**; o clique mostra "Criando o lago…", a tela pergunta de novo a cada 5 s, e para em **Pronto** com o nome, a região e a hora | `apps/web/src/hub/operations/lake.test.tsx`, "do sem lago ao pronto"; QA | must |
| 61 | U6 | Falhou: "Não deu para criar o lago." e **Tentar de novo**, que cria outro | `lake.test.tsx`, "a falha oferece tentar de novo" | must |
| 62 | U6 | **Apagar o lago** abre a confirmação; o botão fica desligado até o nome exato; o nome recusado pelo Hub aparece no campo; confirmado, "Apagando o lago…" e depois o sem lago | `lake.test.tsx`, "apagar pede o nome" | must |
| 63 | U6 | Não deu para apagar: a frase e **Tentar apagar de novo**; `LAKE_BUSY` mostra a frase do Hub | `lake.test.tsx`, "o apagar que falhou" | must |
| 64 | U6 | A leitura do lago falha: "Não deu para ler o lago agora." com **Tentar de novo** no bloco; o resto da página fica | `lake.test.tsx`, "o erro fica no bloco" | must |
| 65 | U6 | Cliente em exclusão: o bloco não aparece; a frase de `CLIENT_DELETION_PENDING` nomeia o banco ou o lago | `lake.test.tsx`, "o cliente em exclusão não mostra o lago" | must |
| 66 | U6 | A 390 px o bloco cabe sem rolar de lado, nos dois temas, em cada estado | `apps/web/sweep-states.ts`, os estados do lago; QA | should |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| O bloco **Lago de dados**, na página do cliente (TB24) | o sem lago: "Esta empresa ainda não tem lago." e **Criar o lago** | o mesmo | esqueleto de duas linhas no bloco, enquanto a primeira leitura não volta | "Não deu para ler o lago agora." com **Tentar de novo**, só no bloco | o cliente que não existe mais: a página de hoje ("não existe mais", TB24) | quem não opera não abre a Central; a rota responde 404, como `getClient` (S10) | sessão vencida: o de hoje da plataforma |
| Criando | — | — | "Criando o lago…" (`role="status"`), "Começou às {hora}."; a tela pergunta de novo a cada 5 s | a leitura que falha no meio: o estado de antes fica, e a próxima pergunta tenta de novo | — | — | — |
| Pronto: "Pronto. O lago `conexus-{id}` está em {região} desde {data e hora}." e **Apagar o lago** | — | — | — | — | — | — | — |
| Não deu para criar | — | — | — | "Não deu para criar o lago. A AWS desfez o que tinha começado." e **Tentar de novo** | — | — | — |
| Apagando | — | — | "Apagando o lago…" (`role="status"`); pergunta a cada 5 s | — | — | — | — |
| Não deu para apagar | — | — | — | "Não deu para apagar o lago." e **Tentar apagar de novo** | — | — | — |
| A confirmação "Apagar o lago de {nome}?" | — | — | "Apagando…" no botão | o nome recusado: no campo; `LAKE_BUSY` e o resto: a frase do Hub no diálogo | — | — | — |
| Cliente em exclusão | — | — | — | o bloco some; **Tentar concluir exclusão** de hoje, com a frase de `CLIENT_DELETION_PENDING` que nomeia o banco ou o lago | — | — | — |

O texto da confirmação: "Tudo o que for copiado para o lago desta empresa sai, sem volta. O dado
continua nos sistemas da empresa." O campo: "Digite {nome} para confirmar". O botão: **Apagar o
lago**, desligado até o nome exato, como **Apagar cliente** (`delete-client-dialog.tsx:19-32`). A
nova frase de `CLIENT_DELETION_PENDING`: "A exclusão começou, mas o banco ou o lago da empresa ainda
não saiu." Os textos vão ao fundador no pull request do G3.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `ClientLake` (a união por `state`: `NONE`, `CREATING {since}`, `READY {bucket, region, readyAt}`, `FAILED {code, at}`, `DELETING {since}`, `DELETE_FAILED {at}`) | `hub/lake/lake.ts` (U5), da linha | o bloco (U6) |
| `lake.company_lake.lake_id` | `create` (U5), sorteado a cada tentativa | o nome da pilha e do depósito (U4), `leftover` (U4) |
| `lake.company_lake.state`, `since` | `create`, `remove`, `settle` (U5) | `read` (U5); `releaseCompanyLake` (U5) |
| `lake.company_lake.account`, `region` | `create` (U5), da configuração | toda chamada à AWS daquele lago (U4); `READY.region` (U6) |
| `lake.company_lake.template` | `create` (U5), o sha-256 do modelo da imagem | o `TemplateURL` (U4); a etapa que primeiro mudar o modelo (L.8) |
| `lake.company_lake.stack_id` | `create` (U5), da resposta do `CreateStack` | `read` e `remove` (U5), por id (B.4 do estudo) |
| `lake.company_lake.failure` | `settle` (U5), `LAKE_CREATE_FAILED` | `FAILED.code` (U6, a frase); o registro |
| A etiqueta `conexus-modelo` da pilha | `create` (U4) | a etapa que primeiro mudar o modelo |

```text
1280 px, a página do cliente (Central)
┌ Central ┬─────────────────────────────────────────────────────────────────┐
│ Clientes│ Empresa Teste A                                      Ativo      │
│ Estado  │ CNPJ …  Razão social …  Cadastrado em …  Ativo desde …           │
│         │ Pessoas (de hoje) · Tipos de conta (de hoje)                    │
│         │ ┌ Lago de dados ──────────────────────────────────────────────┐ │
│         │ │ Pronto. O lago conexus-k3x9… está em us-east-2              │ │
│         │ │ desde 22/11/2026 10:42.                     [Apagar o lago] │ │
│         │ └─────────────────────────────────────────────────────────────┘ │
│         │                                              [Apagar cliente]   │
└─────────┴─────────────────────────────────────────────────────────────────┘
390 px: o bloco ocupa a largura; a frase quebra em linhas; o botão vai para baixo dela,
na largura inteira; o nome do lago quebra sem rolar de lado.
```

O bloco fica depois de Pessoas e Tipos de conta e antes de **Apagar cliente**, para o cliente ativo
ou aguardando o Dono, e some quando o cliente está em exclusão. O estudo não tem captura de outro
produto nem do antigo, que não tinha lago (a seção 6 dele); a forma segue as peças da página de hoje
e o "pronto em alguns minutos" e o "digite o identificador para confirmar" da Nekt Express, que está
na mesma situação.

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Criar: a linha `creating` (U5), numa transação com a trava da empresa | a trava serializa; o segundo acha a linha e devolve o mesmo lago | a linha gravou e o `CreateStack` não saiu: a leitura manda com a mesma chave | o Hub calado: 503 `DATABASE_UNAVAILABLE`, nada na AWS | `LAKE_CREATE_REQUESTED` (`companyId`, `lakeId`) | 40, 41, 43 |
| `CreateStack` (U4), fora da transação | a mesma chave devolve a mesma pilha enquanto ela existe (P6) | a resposta perdida: a linha sem `stack_id`; a leitura repete com a mesma chave | `NO_ANSWER`: a linha fica `creating`; `REFUSED`: `FAILED` | `LAKE_AWS_SILENT` ou `LAKE_AWS_REFUSED` (a chamada, o código do erro, as tentativas) | 30, 32, 43 |
| Gravar o `stack_id` (U5) | `update … where stack_id is null`: grava uma vez | perdido: a próxima leitura refaz o `CreateStack` com a mesma chave e acha o mesmo id | o Hub calado: igual | — | 43 |
| Ler a pilha e acertar a linha (`settle`, U5) | duas leituras: o `update` leva `where state = <o lido>`, e só uma muda a linha | nada a desfazer: a próxima leitura acerta | `NO_ANSWER`: o estado da linha volta como está | `LAKE_READY`, `LAKE_AWS_SILENT` | 42, 49 |
| O motivo da falha e o que sobrou (U4, U5) | duas leituras acham a pilha sumida: as duas apagam o depósito; a segunda recebe "não existe" e conta como apagado; uma só grava `FAILED` | o depósito saiu e a linha não gravou: a próxima leitura acha nada a apagar e grava | `NO_ANSWER`: a linha fica `creating`, e a próxima leitura tenta de novo | `LAKE_CREATE_FAILED` (`lakeId`, o recurso e o tipo do primeiro evento de falha); `LAKE_LEFTOVER_DELETED` | 34, 35, 44 |
| Apagar: a linha `deleting` e o `DeleteStack` (U5, U4) | a trava serializa; o segundo recebe `LAKE_BUSY` | a linha `deleting` e o `DeleteStack` perdido: a leitura acha a pilha pronta e manda de novo | `NO_ANSWER`: a linha fica `deleting`; a leitura repete | `LAKE_DELETE_REQUESTED`, `LAKE_DELETED` | 46, 47, 48 |
| Apagar o cliente com lago (U5, na exclusão em fases de hoje) | a trava da empresa, como hoje | a primeira transação marcou `DELETING`; o lago ainda não saiu: `CLIENT_DELETION_PENDING` e o mesmo pedido retoma | a AWS calada: `CLIENT_DELETION_PENDING` | o de hoje | 51, 52 |
| `cdk deploy` da plataforma (U2), pela Release | o CloudFormation recusa a segunda atualização da mesma pilha; o job falha e se roda de novo | o CloudFormation desfaz a atualização da plataforma; o `deploy` do Hub não roda | a AWS calada: o job falha, o Hub não muda | o do CDK, no job | 10 |
| O modelo em `lago/<sha-256>.json` (U2) | a mesma chave e os mesmos bytes | o arquivo não subiu: o `deploy` não roda, e o Hub antigo segue com o modelo antigo | igual | o do job | 10 |
| A migração de `lake.company_lake` (U3) | `LOCK_BUSY` e uma nova tentativa (`platform/migrate.ts`) | uma transação | a implantação para antes de servir | o de hoje | 20 |

## A tabela de referência

A tabela do estudo, uma linha por peça do roteiro de uso, com a unidade e o arquivo novo. As células
encurtam as do estudo e guardam as citações. Os caminhos curtos: `PC` é
`pypi:aws-parallelcluster==3.16.3 pcluster/`; `PF` é `pypi:prefect-aws==0.8.1 prefect_aws/_cli/`;
`SAM` é `pypi:aws-sam-cli==1.174.0 samcli/`; `SBT` é `npm:@cdklabs/sbt-aws@0.9.5`; `CFN` é
`npm:@aws-sdk/client-cloudformation@3.1175.0`; `CDK` é `npm:aws-cdk-lib@2.278.0`; `NK` é a
documentação da Nekt salva em 2026-11-19, fora do repositório. A situação: o ParallelCluster é um
servidor da AWS na frente do CloudFormation, uma pilha por cluster, **mesma situação**; o
prefect-aws manda um modelo que viaja no pacote, **mesma situação** para isso; o SAM e o
prefect-aws esperam num terminal, **situação diferente** para a espera; o SBT provisiona de dentro
da AWS, e a pilha por cliente só aparece no exemplo dele, **situação diferente**; a Nekt Express
hospeda o lago do cliente na conta dela, **mesma situação** para o que a pessoa vê.

| # | Peça | Unidade | Hoje no main | Como as referências fazem | Veredito | Prova, se não for nativo | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | O bloco **Lago de dados**: os seis estados e os dois botões | U6 | `apps/web/src/hub/operations/client.tsx:50-97` (`Client`); a confirmação pelo nome em `delete-client-dialog.tsx:27-72`; a pergunta de novo em `apps/web/src/hub/copies/queries.ts:50-60` (`refetchInterval`) | `PC api/controllers/cluster_operations_controller.py:80`, `:140`: 202 com `CREATE_IN_PROGRESS`, o cliente pergunta de novo; `PC api/converters.py:17-28`: os estados de desfazer viram um. Nekt Express: "provisioned and ready in a few minutes" (`NK:7663`); apagar pede o identificador (`NK:195511-195520`) | embrulhado: `refetchInterval` do TanStack Query e o diálogo de hoje; o nosso é o bloco | — | A ("6.a"), B ("7a") | `apps/web/src/hub/operations/lake.tsx` |
| 2 | As três rotas e a admissão, só o operador | U5 | `packages/hub-api/src/operations.ts:82-92` (`getClient`), `:140-161` (`deleteClient`); `apps/server/src/hub/operations/routes.ts:18-60`; `apps/server/src/hub/identity/admission.ts:118-122` | `PC api/controllers/cluster_operations_controller.py:179-186`: apagar responde 202 e pula se já está apagando; `PC api/controllers/common.py:144-147`: o apagado responde 404 | embrulhado: o molde das rotas da Central; o nosso são três operações e duas ações | — | A | `packages/hub-api/src/lakes.ts`, `apps/server/src/hub/lake/routes.ts` |
| 3 | A linha do lago no banco do Hub | U3, U5 | `apps/server/src/hub/projects/tables.ts:130-155` (`companyDatabase`, o análogo) | `PC models/cluster.py:316`: o estado é o da pilha; `PC aws/cfn.py:152-154`: a lista pelas etiquetas. `SBT resources/functions/tenant-registrations/index.py:53-62`: uma linha por cliente, sem estado de criação | embrulhado: a pilha é a verdade; a linha guarda o que o CloudFormation não sabe (a empresa, a conta, a região, a versão) | — | L.2; registro 0072; decisão G | `apps/server/src/hub/lake/tables.ts` |
| 4 | O adaptador da AWS: porta, prazos, erros | U4 | `apps/server/src/platform/neon.ts:39-52` (`NeonAnswer`, a porta), `:61-67` (prazos, teto), `:95-108` (`mapped`); o único cliente do SDK, `apps/server/src/builder/git/copy/copy.ts:78-88` | O SDK repete 3 vezes, só limitação de taxa e erro passageiro (`npm:@smithy/core dist-cjs/submodules/retry/index.js:468-469`, `:559-561`), e não tem prazo por padrão (`npm:@smithy/node-http-handler dist-cjs/index.js:232`); provado pela sonda do estudo | embrulhado: os prazos (C57) e as três respostas da porta | — | — | `apps/server/src/platform/aws.ts` |
| 5 | A credencial: a cadeia padrão, o papel do Hub, a sessão de 15 minutos com a etiqueta | U4 | `apps/server/src/platform/config.ts:249-256` (`readSecret`), `:310` | A cadeia lê o ambiente e depois os arquivos (`npm:@aws-sdk/credential-provider-node dist-types/defaultProvider.d.ts:14-27`), o caminho em `AWS_SHARED_CREDENTIALS_FILE` (`npm:@smithy/core dist-es/submodules/config/shared-ini-file-loader/getCredentialsFilepath.js:3-4`); `fromTemporaryCredentials` aceita `Tags` e encadeia (`npm:@aws-sdk/credential-providers@3.1175.0 dist-types/fromTemporaryCredentials.base.d.ts:5-8`). `SBT lib/point-solutions/libraries/src/token-vending-machine/src/token-vending-machine.js:58-66`: `AssumeRole` com `Tags` por cliente | nativo | — | registro 0075 (F-B "A") | — |
| 6 | Criar: uma chamada que se pode repetir | U4, U5 | `apps/server/src/hub/projects/company-database.ts:23-48` (`claimDatabase`); os dois motivos dele em `docs/reference/boundaries.md:894-909` | A chave de repetição (`CFN dist-types/models/models_0.d.ts:2117-2134`). As referências usam só o nome: `PC aws/cfn.py:65-71`, `PF utils.py:314-320`, `SBT lib/core-app-plane/integ.default.js:90` | nativo: o nome único e a `ClientRequestToken`. **A posse com prazo do `main` não vem** | — | L.4; P6 do estudo | — |
| 7 | Saber que acabou | U5 | `apps/server/src/hub/projects/projects.ts` (`create`, que espera o Neon dentro do pedido) | Divergem. `PC api/controllers/cluster_operations_controller.py:140` e `PC models/cluster.py:316`: responde na hora e lê a pilha quando perguntam. `PF utils.py:324-331` e `SAM lib/deploy/deployer.py:626-634`: o esperador, num terminal. `SBT lib/core-app-plane/script-job.js:155-160`: um evento | embrulhado, na forma do ParallelCluster: ler a pilha quando alguém lê o lago em `creating` ou `deleting` | — | L.3, L.12 | `apps/server/src/hub/lake/settle.ts` |
| 8 | O motivo da falha | U4, U5 | nenhum | `SAM lib/deploy/deployer.py:534`: cada evento com o motivo; `PC models/cluster_resources.py:104-113`: a falha de um recurso; a skill `aws-cdk`: "the first `_FAILED` event is the cause" | embrulhado: `DescribeStackEvents` pelo id; o nosso é o primeiro `_FAILED` e um código, nunca a frase (C51) | — | — | — |
| 9 | A conferência do que sobrou | U4, U5 | nenhum | Nenhuma faz: `SBT` (sem `rollback`, `cleanup`, `orphan`), `PC models/cluster.py:408-410` (só os próprios arquivos), `SAM lib/deploy/deployer.py:906-913` (`--on-failure DELETE`) | embrulhado, sem referência, em volta do `OnFailure: DELETE` | o depósito órfão visto uma vez com 8 criações em paralelo, na prova de 20/11; a entrada em `boundaries.md` entra no fechamento | E ("10a") | — |
| 10 | Apagar o lago | U4, U5 | `apps/server/src/hub/projects/company-deletion.ts:28-56` (`releaseCompanyDatabase`) | `PC aws/cfn.py:76`: `delete_stack` só com a identidade; `SAM commands/delete/delete_context.py:311-318`: no `DELETE_FAILED`, tenta de novo | nativo | — | B | — |
| 11 | Apagar o cliente leva o lago | U5 | `apps/server/src/hub/operations/clients.ts:212-242` (`remove`), `:221` (`hasCompanyDatabase`) | Nekt Express: "the workspace and all of its data are deleted" (`NK:195515`). `SBT lib/core-app-plane/integ.default.js:143-144`: a saída roda `delete-stack` | embrulhado: a exclusão em fases de hoje; o lago entra como segundo recurso de fora, numa lista | — | B | — |
| 12 | O modelo do lago de uma empresa | U1 | nenhum; `infra/` só tem roteiros de shell e o Dockerfile | `CDK aws-s3tables/lib/s3tables.generated.d.ts:1099` (`CfnTableBucket`), `CDK aws-athena/lib/athena.generated.d.ts:974` (`CfnWorkGroup`), `CDK aws-iam/lib/role.d.ts:74` (o limite). Sintetizado pelo estudo sem conta: 1.156 bytes, só `Parameters`, `Resources` e `Outputs` | nativo. O pacote alfa do `S3 Tables` **não** entra: ele retém o depósito por padrão (provado pelo estudo) | — | L.1, L.7 | `infra/aws/lib/lake.ts`, `infra/aws/lake.template.json` |
| 13 | Os nomes na AWS: o id do lago | U4, U5 | `packages/hub-api/src/library-ids.ts:7` (o id da empresa tem maiúsculas); `apps/server/src/platform/neon.ts:23-28` | A AWS: nome de depósito só com minúsculas, números e hífen, de 3 a 63 (documentado). `PC models/cluster.py:226-236`: o nome mais 16 caracteres sorteados | embrulhado: um `lakeId` de 12 minúsculas, sorteado a cada tentativa; o "sufixo de geração" do 0073 deixa de existir | — | L.4 | `apps/server/src/hub/lake/lake-id.ts` |
| 14 | As duas permissões de `DESCRIBE` | U1 | nenhum | `CDK aws-lakeformation/lib/lakeformation.generated.d.ts:1387-1411`: cinco propriedades, nenhuma condição; a concessão por etiqueta não dá `DESCRIBE` ao banco nem ao catálogo (documentado) | nativo: `CfnPrincipalPermissions` ao papel leitor, pelo nome, na pilha | o P1 do estudo: o leitor lê o que recebeu por etiqueta; sem as duas, `CATALOG_NOT_FOUND` | L.5; emenda do 0073 | — |
| 15 | A plataforma: o `S3 Tables` ligado ao Athena em modo Lake Formation | U1 | nenhum; na conta, feita à mão em 2026-11-19 | A integração passou a nascer em modo IAM por padrão; o modo Lake Formation pede o papel de serviço, o registro com federação e o catálogo com as permissões padrão vazias (documentado). O CloudFormation tem `AWS::LakeFormation::Resource` e `AWS::Glue::Catalog` | nativo se o P2 passar; o recuo, `AwsCustomResource` do CDK com as mesmas duas chamadas | o P2, na construção (critério 6) | L.6, L.10 | — |
| 16 | A plataforma: o papel do Hub, o papel de serviço, o limite e o papel de serviço como administrador do lago | U1 | nenhum | "If you specify a service role, CloudFormation uses that role's credentials" (documentado); `SAM lib/deploy/deployer.py:273-277`: o papel opcional. `AWS::LakeFormation::DataLakeSettings` com `Admins` e `MutationType` `APPEND` ou `REPLACE` (documentado, lido em 2026-11-22) | nativo | o P3 do estudo: com o papel de serviço administrador do lago, `CREATE_COMPLETE`; quatro formas mais estreitas falharam; as sete recusas da tabela B.4 | registro 0073 (os quatro ajustes); L.9 | `infra/aws/lib/platform.ts` |
| 17 | O orçamento e o alarme, como código | U1 | nenhum | `CDK aws-budgets/lib/budgets.generated.d.ts:687`, `:695` (`CfnBudget`) | nativo | — | D ("9a") | — |
| 18 | A preparação do CDK e a Release sem chave guardada | U2 | `.github/workflows/publish.yml`: o `deploy` no ambiente `production` (`:155`); nenhum `id-token` | `npm:aws-cdk@2.1149.0 lib/api/bootstrap/bootstrap-template.yaml:14-18`, `:45-48`: as políticas do papel que cria pilhas e o limite; o IAM exige a condição `sub` do GitHub (documentado) | nativo | a confiança sem `sub` foi recusada na prova de 20/11; o job de verdade é o P4 (critério 10) | D | `.github/workflows/aws-platform.yml`, `docs/how-to/aws-conta-de-laboratorio.md` |
| 19 | O modelo chega à AWS por um endereço fixo | U1, U2, U4 | `infra/hub.Dockerfile:4-19` (o estágio `build`) | Divergem. `PC models/cluster.py:388-391`: guarda o modelo no `S3` e manda o endereço. `PF utils.py:69-70`, `PF ecs_worker.py:239`: no corpo do pedido. `SAM commands/deploy/deploy_context.py:115`: no corpo até 51.200 bytes. A AWS documenta a condição `cloudformation:TemplateUrl` em `CreateStack` (lido em 2026-11-22) | nativo, na forma do ParallelCluster: `TemplateURL`, com a política do Hub presa ao depósito | — | F (a) | — |
| 20 | O dublê da AWS nos testes e na QA | U4 | `apps/server/src/platform/test-neon.ts:60-143` (`fakeNeon`), `:152` (`neonServer`); `neon.test.ts:51-85` | `npm:aws-sdk-client-mock@4.1.0 dist/cjs/mockClient.js:9-25`: troca só o `send`, e o STS interno de `fromTemporaryCredentials` escapa (provado pelo estudo); `pypi:moto==5.2.5 moto/cloudformation/parsing.py:277-279`: declara criada a pilha de recursos que não conhece | embrulhado: a porta de memória e o servidor de respostas gravadas, na forma do Neon; as respostas entram pelo `requestHandler` do SDK | a sonda do estudo: o `requestHandler` exercita a repetição e as classes de erro | a regra da mudança de método | `apps/server/src/platform/test-aws.ts` |
| 21 | As gravações da AWS | U4 | `npm run record` só grava o Mastra (testing T26); testing T29 para conectores | Não se aplica | embrulhado: as respostas gravadas da AWS que o dublê devolve, na forma da regra da mudança de método | as 13 respostas do P5 do estudo, com valores inventados; as do `S3 Tables` gravadas na prova da U4 | a regra da mudança de método | `apps/server/src/platform/recordings/aws/` |
| 22 | Mudar todas as empresas quando o modelo muda | fica de fora: na etapa 1 não há modelo anterior | nenhum | `PC api/controllers/cluster_operations_controller.py:372-378`: só atualiza a pilha da mesma versão; `PF utils.py:298-311`: "No updates are to be performed" é sucesso | nativo quando entrar (`UpdateStack`); fica de fora nesta etapa, e a versão vai na linha e na etiqueta `conexus-modelo` | — | L.8 | — |
| 23 | As recusas do roteiro: a etiqueta de outra empresa e outro endereço | fica de fora: é a prova da garantia, não uma peça | nenhum | Não se aplica | nativo: a recusa é da AWS, sem código de produto | 16 de 16 na prova de 20/11; refeitas no P1 e no P3 de 21/11; ao vivo no passo 5 | C ("8a") | — |

**A medida do transplante.** Nenhuma parte vem do repositório antigo: ele não tinha lago nem AWS (a
biblioteca de estudos lista para ele só o `S3` para arquivos de app). Do `main` não se copia nada; o
protocolo de reivindicar e adotar de `company-database.ts` fica onde está, porque o motivo dele
(`boundaries.md:894-909`) não vale para o CloudFormation.

**A dívida.** O órfão de papel ou de grupo do Athena depois de uma criação que falhou não foi visto;
o Hub não tem `iam:` nem `athena:` para conferi-lo, e a etapa que o vir decide. A mensagem própria
para a cota de 100 lagos fica para quando a conta passar de 80. Os dois vão para a seção 11 da
arquitetura no fechamento.

## As decisões do firstmate

| # | Decisão reversível ([delivery L6](../guides/delivery.md)) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| L.1 | A pilha da etapa 1 leva o depósito, as áreas `raw` e `current`, o papel leitor, o grupo do Athena e as duas permissões; o papel de escrita vem na etapa 2 e o publicador na 4 | Nada na etapa 1 escreve nem publica; a permissão de `DESCRIBE` no banco precisa do banco; o 0073 diz que mudar todas as empresas é "one `UpdateStack` each" | Uma atualização da pilha acrescenta ou tira |
| L.2 | Uma linha por lago no banco do Hub: conta, região, `lakeId`, `stack_id`, versão do modelo, estado e hora | O ParallelCluster vive sem linha, mas não precisa saber de que cliente é a pilha; o 0072 quer conta e região como dado | A tabela é nova e ninguém mais a lê |
| L.3 | Ler a pilha quando alguém lê o lago, sem esperar nem relógio | O ParallelCluster, mesma situação; nenhum pedido fica aberto 25 s; nada roda quando ninguém olha (a ideia da data D27) | Um aviso por fila, quando a etapa 2 trouxer a fila |
| L.4 | `lakeId` de 12 minúsculas e números, por `crypto.randomInt`, novo a cada tentativa; `ClientRequestToken` igual a ele; o Hub manda o `CreateStack` de novo só quando não guardou o `stack_id` | O P6 do estudo: a mesma chave depois de uma pilha que falhou e sumiu cria uma pilha nova, e o nome do depósito fica preso mesmo depois da falha | Outro formato antes da primeira tabela |
| L.5 | As duas permissões de `DESCRIBE` por nome, ao papel leitor, dentro da pilha | O P1 do estudo passou, com o controle | A concessão pelo Hub depois de criar |
| L.6 | O P2 roda na construção da U1, numa região da conta de laboratório que não tem `s3tablescatalog` (o builder confere antes, e registra qual) | Em us-east-2 a ligação existe, feita à mão, e o estudo não a apagou; uma região vazia testa a forma sem tocar a que existe | Rodar o P2 na conta oficial |
| L.7 | O modelo sintetizado fica no repositório, em `infra/aws/lake.template.json`, conferido contra a síntese; a versão é o sha-256 do arquivo; o CDK é só dependência de montagem | A diferença do modelo aparece no pull request, e a imagem e a Release usam os mesmos bytes sem sintetizar duas vezes; a síntese roda sem conta (provado pelo estudo) | Sintetizar na montagem da imagem |
| L.8 | Sem caminho de atualização; a versão vai na linha e na etiqueta `conexus-modelo` | Não há modelo anterior; o ParallelCluster só atualiza a pilha da mesma versão, então a versão precisa estar gravada desde o começo | A etapa que mudar o modelo constrói o caminho |
| L.9 | O papel de serviço entra como administrador do lago por `AWS::LakeFormation::DataLakeSettings` com `MutationType: APPEND`, na pilha da plataforma | O P3 do estudo: quatro formas mais estreitas falharam; `APPEND` não tira quem já administra (documentado). O que acontece com a lista quando a pilha da plataforma sai é provado na U1 (critérios 5 e 6) | Tirar o papel da lista |
| L.10 | Em us-east-2, o passo a passo tira a ligação feita à mão (o catálogo e o registro) e o orçamento feito à mão antes do primeiro `cdk deploy`; a plataforma os recria | A pilha não cria um catálogo que já existe (B.2 do estudo); nenhum lago usa a ligação hoje (o inventário do estudo: nenhum catálogo filho) | Recriar à mão pelas duas chamadas que o estudo anotou |
| L.11 | O lago mora num assunto novo, `apps/server/src/hub/lake/`, com o esquema `lake` (data D4); o fechamento põe a pasta na lista da trilha Dados | Nenhuma pasta de hoje é dona do lago; `hub/data/` é o contrato de acesso | Mover para `hub/data/` |
| L.12 | A leitura `GET …/lake` acerta a linha quando a pilha mudou | É o "lê o estado quando perguntam" do ParallelCluster com a linha de L.2; o `update` leva o estado lido na condição, e duas leituras não brigam | Uma rota de acerto separada |
| L.13 | Na exclusão do cliente, `clients.ts` recebe uma lista de recursos de fora, cada um com `has` e `release`; o banco da empresa e o lago são os dois; a cada tentativa todos são pedidos, e o pedido responde `CLIENT_DELETION_PENDING` se algum não saiu | A lente do estudo: `clients.ts:221` testa um caso só, e o lago seria um segundo `if` | Voltar a dois testes |
| L.14 | Só o orçamento vira código; o monitor de anomalia feito à mão fica na conta de laboratório como está | O monitor é da conta, não do lago, e a linha 17 da tabela do estudo só traz o orçamento; dois monitores do mesmo tipo pedem conferência que o estudo não fez | Um `CfnAnomalyMonitor` na plataforma |
| L.15 | Um código só para a criação que falha, `LAKE_CREATE_FAILED`; o recurso e o tipo do primeiro evento de falha vão ao registro | O motivo da AWS é texto, e a regra C52 manda separar por campo estável; o evento não traz código | Um código por tipo de recurso que falhou |
| L.16 | A conferência do que sobrou olha só o depósito de tabelas, pela etiqueta da empresa | O órfão visto foi o depósito; o Hub não tem `iam:` nem `athena:` | A etapa que vir outro órfão |
| L.17 | O dublê da AWS tem duas formas, como o do Neon: a porta de memória para os testes do Hub e um servidor HTTP local de respostas gravadas para o Hub rodado como programa e a QA, pelo endereço em `HUB_AWS_ENDPOINT` | O Neon faz igual (`test-neon.ts:14`, `:152`); a QA roda o Hub como programa | Só a porta de memória |
| L.18 | O Hub não sobe com chave da AWS no ambiente | A S31 pede o segredo em arquivo e a exceção só por decisão escrita; a cadeia padrão leria o ambiente primeiro | Aceitar o ambiente, por decisão escrita |
| L.19 | Apagar só do estado pronto ou do que não deu para apagar; em `creating` e `deleting`, 409 `LAKE_BUSY` | Apagar uma pilha no meio da criação mistura dois desfazer; o ParallelCluster pula só o apagar que já roda | Aceitar o apagar em `creating` |

## U1 A plataforma e o modelo

**Base e modelo.** O `main` depois da mudança de método. Opus: as políticas do IAM e do Lake
Formation decidem o isolamento, e um erro nelas não aparece em teste local.

### As linhas da tabela

Linhas 12, 14, 15, 16, 17 e 19. Leia na base: `infra/` (só roteiros de shell e o Dockerfile); o
registro 0073 e o 0075 inteiros. No estudo, fora do repositório, o firstmate entrega ao builder o
modelo e as políticas dos testes P1 e P3 (`lago-p1.template.json`, `lago-p3.template.json`,
`p3-politicas.json`), que são o ponto de partida das políticas, e a tabela B.4 das recusas.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `infra/aws/` (novo: `bin/app.ts`, `lib/platform.ts`, `lib/lake.ts`, `lib/names.ts`, `test/`, `lake.template.json`, `package.json`, `tsconfig.json`, `cdk.json`) | Cria o pacote `@conexus/infra-aws` | a Release (U2); a imagem (U2) copia `lake.template.json`; a U4 lê os nomes de `names.ts` só como texto na configuração |
| `package.json`, `package-lock.json` | Muda: `infra/aws` entra nos workspaces; `aws-cdk-lib`, `aws-cdk`, `constructs` como dependências de montagem | `npm ci` |
| `knip.json`, `.dependency-cruiser.cjs` | Muda: a pasta nova entra; `aws-cdk-lib` só em `infra/aws/` | `npm run knip`, `npm run deps` |
| `docs/reference/stack.md` | Muda: as linhas de `aws-cdk-lib`, `aws-cdk` e `constructs`, se a mudança de método não as trouxe | — |

### Os contratos que a unidade cria

```ts
// infra/aws/lib/names.ts — o dono único dos nomes que o Hub e a plataforma dividem (C26)
export const STACK_PREFIX = 'conexus-lago-'        // a pilha: conexus-lago-<lakeId>
export const BUCKET_PREFIX = 'conexus-'            // o depósito: conexus-<lakeId>
export const TAG_COMPANY = 'conexus-empresa'       // a sessão do Hub, a pilha, o depósito
export const TAG_READER = 'conexus-leitor'         // só na sessão do leitor (etapa 3)
export const TAG_TEMPLATE = 'conexus-modelo'       // a versão do modelo, na pilha
export const TEMPLATE_PREFIX = 'lago/'             // lago/<sha-256>.json no depósito dos modelos

// infra/aws/lib/lake.ts
export class LakeStack extends Stack               // Parameters: LakeId, CompanyId; synthesizer sem BootstrapVersion
// infra/aws/lib/platform.ts
export class PlatformStack extends Stack           // Parameters: BudgetUsd, AlarmEmail, HubSourceIp, HubUserName
```

O `names.ts` fica do lado da plataforma; a U4 repete os prefixos em `platform/aws.ts` e um teste da
U4 lê `lake.template.json` e confere que eles batem (critério 30), porque o servidor não importa de
`infra/`. Os recursos de `PlatformStack`:

- **O papel do Hub** (`conexus-hub`). Confia só no usuário da chave base (o parâmetro `HubUserName`),
  com `aws:SourceIp` igual a `HubSourceIp` na própria confiança (registro 0075), e com
  `sts:TagSession` só para a chave `conexus-empresa`. A política, a do critério 4: `CreateStack` com
  `cloudformation:RoleArn` igual ao papel de serviço, `cloudformation:TemplateUrl` no depósito dos
  modelos sob `lago/`, `aws:RequestTag/conexus-empresa` igual a `${aws:PrincipalTag/conexus-empresa}`
  e o recurso `stack/conexus-lago-*`; `DescribeStacks`, `DescribeStackEvents` e `DeleteStack` com
  `aws:ResourceTag/conexus-empresa` igual à etiqueta da sessão; `iam:PassRole` do papel de serviço com
  `iam:PassedToService` igual a `cloudformation.amazonaws.com`; `s3:GetObject` em `lago/*` do depósito
  dos modelos; `s3tables:GetTableBucket`, `ListNamespaces`, `DeleteNamespace` e `DeleteTableBucket` em
  `bucket/conexus-*` com a etiqueta da sessão; e `sts:AssumeRole` e `sts:TagSession` nos papéis leitores
  `conexus-*-leitor`, para a etapa 3.
- **O papel de serviço** (`conexus-cfn`). Confia só no CloudFormation, com `aws:SourceAccount`. A
  política do P3: `s3tables:*` em `bucket/conexus-*`; `iam:CreateRole` só com
  `iam:PermissionsBoundary` igual ao limite; as ações de cuidar dos papéis `conexus-*`; a recusa de
  tirar ou trocar o limite; o Athena em `workgroup/conexus-*`; e as concessões do Lake Formation.
- **O limite de permissão** (`conexus-limite`): o máximo de um papel de empresa: o Athena nos grupos
  `conexus-*`, a leitura do Glue e `lakeformation:GetDataAccess`.
- **O papel de serviço administrador do lago**: `CfnDataLakeSettings` com `admins` = [o papel de
  serviço] e `mutationType: 'APPEND'` (L.9).
- **A ligação do `S3 Tables` com o Athena em modo Lake Formation**: o papel que o Lake Formation usa
  para o `S3 Tables`, `CfnResource` do Lake Formation com o ARN `bucket/*` e `withFederation`, e o
  `CfnCatalog` do Glue `s3tablescatalog` com `CreateDatabaseDefaultPermissions` e
  `CreateTableDefaultPermissions` vazios e `AllowFullTableExternalDataAccess` `"False"` (as opções da
  tabela do estudo). Se o P2 recusar a forma, o recuo é `AwsCustomResource` com as duas chamadas.
- **O depósito dos modelos**: `S3`, bloqueado ao público, com `s3:PutObject` só para o papel da
  Release (U2) e `s3:GetObject` para o Hub; o `RemovalPolicy` é `RETAIN`, porque uma pilha que
  falhou ainda pode ser lida pelo modelo dela.
- **O orçamento**: `CfnBudget` mensal com o valor de `BudgetUsd` e uma notificação por e-mail a
  `AlarmEmail` em 80% do real e 100% do previsto.

### As skills e a leitura

`aws-cdk` (a skill dos mantenedores; o `cdk-nag` 3 deixou de ser Aspect, `npm:cdk-nag@3.1.0
README.md:53`, e não entra sem a mudança de método); `aws-iam` (a forma `ForAllValues` com `Null`, a
confiança com `aws:SourceIp`); `aws-cloudformation`. Ler primeiro `node_modules/aws-cdk-lib/README.md`
na versão instalada, a parte de `DefaultStackSynthesizer` e de `assertions`.

### A ordem do trabalho

1. **O pacote e a síntese.** Critérios: 1, 2, 7.
   - **Arquivos:** cria `infra/aws/` com `package.json` (`"private": true`, os scripts `synth` e
     `test`), `bin/app.ts`, `lib/names.ts`, `lib/lake.ts`; muda os workspaces, `knip.json` e
     `.dependency-cruiser.cjs`.
   - **Referência a seguir:** `CDK core/lib/stack-synthesizers/default-synthesizer.d.ts:132-140`
     (`generateBootstrapVersionRule: false`); `App({ analyticsReporting: false })`; o modelo
     sintetizado pela sonda do estudo.
   - **O que entra:** `synth` roda `cdk synth LakeStack --json` e grava `lake.template.json`, com as
     chaves em ordem estável. Sem `CfnTableBucket` do pacote alfa (linha 12).
   - **Testes:** `infra/aws/test/lake.test.ts`, com `Template.fromStack` de `aws-cdk-lib/assertions` e
     `node:test`.
   - **Mutações à mão:** volte `generateBootstrapVersionRule` ao padrão (critério 2 fica vermelho);
     mude o modelo sem sintetizar (critério 1).
   - **Pronto quando:** `npm run synth -w @conexus/infra-aws && git diff --exit-code infra/aws` passa.
2. **O modelo do lago.** Critérios: 2, 3.
   - **Arquivos:** `lib/lake.ts`.
   - **Referência a seguir:** `lago-p1.template.json` do estudo (sete recursos);
     `CDK aws-lakeformation/lib/lakeformation.generated.d.ts:1387-1411`.
   - **O que entra:** o depósito com `Tags` `conexus-empresa`; `CfnNamespace` `raw` e `current`; o papel
     leitor `conexus-<LakeId>-leitor` com `permissionsBoundary` e a confiança no papel do Hub pelo
     nome; `CfnWorkGroup` com `managedQueryResultsConfiguration.enabled: true`,
     `bytesScannedCutoffPerQuery` e `recursiveDeleteOption: true`; as duas `CfnPrincipalPermissions`.
   - **Testes:** `lake.test.ts`, critérios 2 e 3.
   - **Mutações à mão:** tire o `Null` da confiança (critério 3).
3. **A plataforma.** Critérios: 4, 5, 7.
   - **Arquivos:** `lib/platform.ts`, `test/platform.test.ts`.
   - **Referência a seguir:** `p3-politicas.json` do estudo; a condição `cloudformation:TemplateUrl`
     (guia do usuário do CloudFormation, "Require a specific template URL").
   - **Testes:** `platform.test.ts`, um caso por recusa do critério 4.
   - **Mutações à mão:** tire a condição de `RoleArn` (critério 4); troque `APPEND` por `REPLACE`
     (critério 5).
4. **A prova na conta de laboratório.** Critérios: 4, 5, 6. Roda o firstmate, com a credencial de
   laboratório, depois da palavra do fundador para a preparação (decisão D).
   - **O P2:** na região vazia (L.6), `cdk deploy PlatformStack`, um lago criado com o modelo, as três
     conferências do critério 6, e `cdk destroy`; a lista de administradores do lago lida antes, depois
     do deploy e depois do destroy.
   - **O P3 de novo:** em us-east-2, com a plataforma de verdade, as sete recusas da tabela B.4.
   - **O que sai:** os comandos e as saídas, com o número da conta trocado, num comentário do pull
     request (security S40).

### Como se prova

Os critérios 1 a 5 e 7 por `npm run test -w @conexus/infra-aws`, que roda na CI sem conta. O 4, o 5 e
o 6 também ao vivo, no passo 4. Hoje nenhum falha porque `infra/aws/` não existe.

### Parar se

- O P2 recusa `AWS::Glue::Catalog` para o `S3 Tables`: use o recuo da linha 15 e registre no pull
  request; um recuo que também falhe volta ao firstmate.
- O `APPEND` tira alguém da lista, ou o `cdk destroy` esvazia a lista de administradores: pare. É
  segurança da conta, e volta ao firstmate antes de qualquer deploy em us-east-2.
- O `S3 Tables` não respeita `aws:ResourceTag` em `DeleteTableBucket`: pare; sem isso o Hub de uma
  empresa apagaria o depósito de outra (critério 4).

## U2 A Release e a preparação da conta

**Base e modelo.** O `main` com a U1. Sonnet: workflow e texto, sem desenho entre módulos.

### As linhas da tabela

Linhas 18 e 19. Leia na base: `.github/workflows/publish.yml` (os jobs `image` em `:24`, `template` em
`:81`, `deploy` em `:152`, no ambiente `production` em `:155`); `infra/hub.Dockerfile:4-19`; o job
`image` de `.github/workflows/ci.yml:445`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `.github/workflows/aws-platform.yml` | Cria: `on: workflow_call` e `workflow_dispatch`; `environment: production`; `permissions: id-token: write, contents: read` | `publish.yml` |
| `.github/workflows/publish.yml` | Muda: um job que chama `aws-platform.yml`; o `deploy` passa a esperar por ele | a Release |
| `.github/workflows/ci.yml` | Muda: um passo no job `image` (critério 12) | — |
| `infra/hub.Dockerfile` | Muda: copia `infra/aws/lake.template.json` para a imagem | o Hub (U5 lê o arquivo) |
| `docs/how-to/aws-conta-de-laboratorio.md`, `docs/index.md` | Cria o passo a passo; a linha no índice (delivery L24) | o firstmate |

### Os contratos que a unidade cria

O job, em passos: entrar pela ação `aws-actions/configure-aws-credentials` presa ao commit da última
versão publicada, com o papel da Release e a região das variáveis do ambiente `production`
(`vars.AWS_ROLE_ARN`, `vars.AWS_REGION`); `npm ci -w @conexus/infra-aws`; `cdk deploy PlatformStack
--require-approval never` com os parâmetros das variáveis (`vars.AWS_BUDGET_USD`,
`vars.AWS_ALARM_EMAIL`, `vars.HUB_SOURCE_IP`, `vars.AWS_HUB_USER`); e `aws s3api put-object` do modelo
em `lago/<sha-256>.json` com `--if-none-match '*'`, para nunca sobrescrever: o 412 de uma versão
que já existe conta como feito. Nenhum número de conta no
repositório. O passo a passo, em português, abaixo de 800 palavras, nesta ordem:

1. A preparação do CDK com uma política própria no lugar do acesso de administrador
   (`--cloudformation-execution-policies`, `npm:aws-cdk@2.1149.0 lib/api/bootstrap/bootstrap-template.yaml:14-18`).
2. O provedor OIDC do GitHub e o papel da Release, com a condição `sub` presa ao ambiente
   `production` deste repositório, que só assume os papéis da preparação do CDK e escreve em `lago/`.
3. O usuário da chave base, que só assume o papel do Hub, e a chave num arquivo de modo 600 na VPS,
   com o caminho em `AWS_SHARED_CREDENTIALS_FILE` (S31).
4. Em us-east-2: tirar a ligação feita à mão e o orçamento feito à mão (L.10), conferindo antes que
   não há catálogo filho.
5. As variáveis do ambiente `production` e o primeiro disparo de `aws-platform.yml`.

### As skills e a leitura

`aws-iam` (a confiança do OIDC com `sub`); `aws-cdk` (a preparação). O guia de entrega, L17 (nenhum
nome de Release gasto pela prova).

### A ordem do trabalho

1. **O workflow.** Critérios: 10, 11.
   - **Arquivos:** cria `aws-platform.yml`; muda `publish.yml`.
   - **Referência a seguir:** a página do IAM sobre o OIDC do GitHub (a condição `sub`); o job
     `deploy` de hoje, para o ambiente.
   - **Testes:** `npm run check:workflows`.
   - **Pronto quando:** a conferência dos workflows passa com o job novo.
2. **A imagem.** Critério: 12. Muda o Dockerfile e o passo do job `image`.
3. **O passo a passo.** Critério: 13.
4. **O P4.** Critérios: 10, 11. Depois do G1 mesclado, o firstmate segue o passo a passo e dispara
   `aws-platform.yml` à mão no `main`; depois, num ramo sem o ambiente, e vê a recusa.

### Como se prova

O critério 12 pela CI. O 10, o 11 e o 13 ao vivo, no P4, com a saída no pull request do G1 ou num
comentário dele depois de mesclado.

### Parar se

- A conferência dos workflows recusa `id-token: write`: ela é verificação (delivery L20) e muda num
  pull request próprio antes deste; volte ao firstmate.
- A ação de credenciais não tem versão publicada que a conferência aceite: use
  `aws sts assume-role-with-web-identity` com o token do GitHub, e registre.

## G1 O ponto de conferência

Depois da U2: `npm run test -w @conexus/infra-aws`, `npm run synth -w @conexus/infra-aws && git diff
--exit-code`, `npm run check`, `docker build` da imagem; o P2 e o P3 do passo 4 da U1, com as saídas
no pull request. O P4 roda depois do merge.

## U3 A linha do lago

**Base e modelo.** O `main` depois da mudança de método. Sonnet: uma tabela e as permissões, no molde
de `company_database`.

### As linhas da tabela

Linha 3. Leia na base: `apps/server/src/hub/projects/tables.ts:19-23` (o esquema e o comentário de
D17) e `:130-155` (`companyDatabase`: as regras e as políticas); `apps/server/database-grants.sql:118` e
`:497-504`; a migração de permissões `apps/server/migrations/20261115223016_copy_alerts_grants/migration.sql`
(o SQL à mão, data D5); `apps/server/src/platform/catalog.test.ts:15`, `:96`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/lake/tables.ts`, `tables.test.ts` | Cria o esquema `lake` e `companyLake` | `hub/lake/` (U5) |
| `apps/server/migrations/` | Cria duas: a tabela (`npm run db:generate`) e as permissões (à mão) | `migrate` |
| `apps/server/database-grants.sql` | Muda: a tabela, o dono e as permissões | `catalog.test.ts` |

### Os contratos que a unidade cria

`lake.company_lake`, uma linha por empresa com lago:

| Coluna | Tipo | Restrição | Ao apagar |
| --- | --- | --- | --- |
| `company_id` | `text` | chave primária; sem chave estrangeira, como `company_database` (data D17) | — |
| `lake_id` | `text` | não nulo, único, `^[a-z0-9]{12}$` | — |
| `state` | `text` | não nulo, `creating`, `ready`, `failed`, `deleting` ou `delete_failed` | — |
| `account` | `text` | não nulo, `^[0-9]{12}$` | — |
| `region` | `text` | não nulo, `^[a-z]{2}-[a-z]+-[0-9]$` | — |
| `template` | `text` | não nulo, `^[0-9a-f]{64}$` | — |
| `stack_id` | `text` | único; não nulo em `ready`, `deleting` e `delete_failed` | — |
| `since` | `timestamptz` | não nulo, a hora da última mudança de estado | — |
| `failure` | `text` | não nulo só em `failed`, `LAKE_CREATE_FAILED` | — |

A política por linha: só o escopo `OPERATOR` lê e escreve, como as de `company_database` para o
operador (`tables.ts:151-153`). As permissões (decisão G): o login do operador com `SELECT`,
`INSERT`, `DELETE` e `UPDATE` em `lake_id`, `state`, `template`, `stack_id`, `since` e `failure`;
`account`, `region` e `company_id` não mudam. O login da empresa, nada. Sem chave estrangeira, nenhum
"ao apagar"; a linha sai pela U5, quando a pilha sai.

### As skills e a leitura

`drizzle` (de `node_modules/drizzle-kit/skills/`); o guia de dados (D4, D5, D10, D11, D15, D17).

### A ordem do trabalho

1. **A tabela.** Critério: 21.
   - **Arquivos:** cria `hub/lake/tables.ts` e `tables.test.ts`; gera a migração.
   - **Referência a seguir:** `companyDatabase`, `tables.ts:130-155`.
   - **Testes:** `tables.test.ts`, um caso por regra, contra o banco de teste.
   - **Mutações à mão:** tire a regra de `failure` (critério 21).
2. **As permissões e a foto.** Critério: 20.
   - **Arquivos:** a migração à mão; `database-grants.sql`.
   - **Testes:** `catalog.test.ts` de hoje; `tables.test.ts`, "a empresa não lê o lago".
   - **Pronto quando:** `npm run test -w @conexus/server -- catalog` passa.

### Como se prova

`catalog.test.ts` compara o catálogo depois da migração com a foto; `tables.test.ts` tenta cada linha
errada. Hoje a tabela não existe.

### Parar se

- O login do operador não tem como ler a linha por uma política de `OPERATOR` sem uma permissão a
  mais: volte ao firstmate; a decisão G é do fundador.

## G2 O ponto de conferência

Depois da U3: `npm run migrations -- --base origin/main`, `npm run test -w @conexus/server -- catalog
tables`, `npm run check`. O pull request leva no corpo a palavra do fundador para a decisão G.

## U4 O adaptador da AWS

**Base e modelo.** O `main` com o G1 e o G2. Opus: a tradução dos erros do SDK, os prazos e a cadeia
de credenciais decidem o que o Hub faz quando a AWS falha.

### As linhas da tabela

Linhas 4, 5, 6, 8, 9, 13, 20 e 21. Leia na base: `apps/server/src/platform/neon.ts:39-52`, `:61-67`,
`:72-88`, `:95-108`, `:111-193` (o molde inteiro); `test-neon.ts:14`, `:60-143`, `:152`;
`neon.test.ts:51-85`; `config.ts:217-227`, `:249-256`, `:310`; `builder/git/copy/copy.ts:73-88` (o
`abortSignal` por chamada); a regra `s3-only-in-the-git-copy` de `.dependency-cruiser.cjs:202-207`. Do
estudo, fora do repositório: as 13 gravações do P5 e as sondas do SDK.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/aws.ts`, `aws.test.ts` | Cria a porta `LakeStacks` e o adaptador | `hub/lake/` (U5), `main.ts` |
| `apps/server/src/platform/test-aws.ts` | Cria `fakeAws()` e `awsServer(t)` | os testes da U5; a QA |
| `apps/server/src/platform/recordings/aws/` | Cria as gravações, cada uma com a linha do serviço, da API, da versão do SDK e da data | `aws.test.ts`, `test-aws.ts` |
| `apps/server/src/platform/config.ts`, `config.test.ts` | Muda: as variáveis da AWS e a recusa da chave no ambiente | `main.ts` |
| `apps/server/package.json`, `package-lock.json` | Muda: os quatro pacotes do SDK na 3.1175.0 | — |
| `.dependency-cruiser.cjs` | Cria a regra `aws-sdk-only-in-the-aws-adapter` | `npm run deps` |

### Os contratos que a unidade cria

```ts
// apps/server/src/platform/aws.ts
export const LakeId = z.string().regex(/^[a-z0-9]{12}$/).brand('LakeId')       // C23
export const StackId = z.string().startsWith('arn:aws:cloudformation:').brand('StackId')
export const AwsAccount = z.string().regex(/^[0-9]{12}$/).brand('AwsAccount')
export const AwsRegion = z.string().regex(/^[a-z]{2}-[a-z]+-[0-9]$/).brand('AwsRegion')
export type AwsAnswer<T> =
  | { kind: 'DONE'; value: T }
  | { kind: 'REFUSED'; code: string }      // o `name` do erro do SDK; só para o registro
  | { kind: 'NO_ANSWER' }
export type Where = Readonly<{ company: CompanyId; account: AwsAccount; region: AwsRegion }>
/** One adapter for every AWS call the Hub makes (C56); each call runs in a 15-minute session tagged with the company. */
export type LakeStacks = {
  create(at: Where, lake: { id: LakeId; template: TemplateVersion }): Promise<AwsAnswer<StackId>>
  status(at: Where, stack: StackId): Promise<AwsAnswer<StackStatus>>         // StackStatus do SDK
  firstFailure(at: Where, stack: StackId): Promise<AwsAnswer<{ logicalId: string; type: string } | null>>
  remove(at: Where, stack: StackId): Promise<AwsAnswer<void>>
  leftover(at: Where, lake: LakeId): Promise<AwsAnswer<'NONE' | 'DELETED'>>
}
export const TemplateVersion = z.string().regex(/^[0-9a-f]{64}$/).brand('TemplateVersion')
export function createLakeStacks(deps: { config: Config; log: Log }): LakeStacks

// apps/server/src/platform/test-aws.ts
export function fakeAws(): { aws: LakeStacks; calls: readonly Call[]; script(call, answer, takesEffect?): void;
  finish(stack: StackId, status: 'CREATE_COMPLETE' | 'DELETE_COMPLETE' | 'DELETE_FAILED', failure?): void;
  plantLeftover(lake: LakeId): void }
export function awsServer(t: TestContext): Promise<{ endpoint: URL }>   // CloudFormation, STS e S3 Tables gravados
```

A configuração, em `ServeEnvironment` (`config.ts:217`): `HUB_AWS_ACCOUNT`, `HUB_AWS_REGION`,
`HUB_AWS_HUB_ROLE_ARN`, `HUB_AWS_SERVICE_ROLE_ARN`, `HUB_AWS_TEMPLATE_BUCKET`,
`AWS_SHARED_CREDENTIALS_FILE` (o arquivo lido como a S31 pede), e `HUB_AWS_ENDPOINT` só fora de
produção (L.17). A versão do modelo é o sha-256 de `infra/aws/lake.template.json` na imagem, lido uma
vez na subida; sem o arquivo, o Hub não sobe (`CONFIG_INVALID`).

- **Cada estado.** `AwsAnswer` por `kind`; `StackStatus` é o tipo do SDK, sem cópia (C26).
- **Cada id.** `LakeId`, `StackId`, `AwsAccount`, `AwsRegion`, `TemplateVersion` com marca, parseados
  na borda (C23, C27): o `StackId` na resposta do `CreateStack`, o resto na configuração e na linha.
- **O dono de cada fato.** Os prefixos e as etiquetas: `infra/aws/lib/names.ts` (U1), repetidos aqui e
  conferidos contra o modelo (critério 30); o prazo de cada chamada: uma constante em `aws.ts`.
- **O arquivo modelo.** `neon.ts`, que cumpre C21, C23 e C26.

### As skills e a leitura

`aws-sdk-js-v3-usage` (os prazos do `requestHandler`, `abortSignal`, `fromTemporaryCredentials`);
`aws-iam` (a sessão encadeada não passa de 1 hora). Ler primeiro
`node_modules/@aws-sdk/client-cloudformation/README.md` e
`node_modules/@smithy/node-http-handler/dist-types/` na versão instalada. A regra do dublê da AWS da
mudança de método.

### A ordem do trabalho

1. **A sessão e o cliente.** Critérios: 31, 37.
   - **Arquivos:** cria `aws.ts`; muda `config.ts` e `config.test.ts`.
   - **Referência a seguir:** `npm:@aws-sdk/credential-providers@3.1175.0
     dist-types/fromTemporaryCredentials.base.d.ts:5-8`; a sonda do estudo da cadeia de dois papéis.
   - **O que entra:** um cliente por empresa, guardado num `Map` do adaptador, com
     `fromTemporaryCredentials({ params: { RoleArn, RoleSessionName: 'hub-' + company, Tags: [{ Key:
     'conexus-empresa', Value: company }], DurationSeconds: 900 }, clientConfig: { region,
     requestHandler } })`; o mesmo `requestHandler` (`requestTimeout`, `connectionTimeout`,
     `throwOnRequestTimeout: true`) no CloudFormation, no `S3 Tables` e no STS interno, e um
     `AbortSignal.timeout` por chamada. Nenhum `logger`. Regras: C56, C57, S31, S36.
   - **Testes:** `aws.test.ts`, as gravações `assume-role-*` entrando pelo `requestHandler`.
   - **Mutações à mão:** tire `Tags` (critério 31); aceite `AWS_ACCESS_KEY_ID` (critério 37).
2. **As cinco chamadas e a tradução.** Critérios: 30, 32 a 35.
   - **Referência a seguir:** `neon.ts:95-108` (`mapped`); as classes de erro do estudo:
     `AlreadyExistsException`, `ValidationError` com "does not exist", o resto pelo `name` e pelo
     `$metadata.httpStatusCode` (C52).
   - **O que entra:** `status` e `remove` só pelo `StackId`; `remove` conta "does not exist" como
     `DONE`; `firstFailure` lê no máximo 5 páginas de eventos (C59: a página é o teto da API);
     `leftover` lista as áreas, apaga cada uma e o depósito, e conta `NotFoundException` como feito.
   - **Testes:** `aws.test.ts`, um caso por gravação; as respostas do `S3 Tables` usam o envelope mais
     próximo gravado do CloudFormation até a prova do passo 4 gravá-las (testing T29).
   - **Mutações à mão:** trate `Throttling` como recusa (critério 32); leia a pilha pelo nome (critério 33).
3. **Os dublês.** Critérios: 30 a 35 pela U5.
   - **Arquivos:** cria `test-aws.ts`.
   - **Referência a seguir:** `test-neon.ts:60-143` e `:152`.
   - **O que entra:** `fakeAws` guarda as pilhas por id, com a etiqueta da empresa, e recusa a chamada
     de uma empresa à pilha de outra (critério 53); o nome do depósito fica preso 610 s depois de
     apagado, como a prova de 20/11 mediu. `awsServer` responde as gravações, com estado.
4. **A prova que grava.** Critério: 35. Com a credencial do firstmate, na conta de laboratório: um
   depósito órfão plantado, as respostas de `GetTableBucket`, `ListNamespaces`, `DeleteNamespace` e
   `DeleteTableBucket` gravadas pelo Hub de teste, com os valores trocados (S40).

### Como se prova

`aws.test.ts` passa as gravações pelo `requestHandler`, então a repetição e as classes de erro do SDK
rodam de verdade; `npm run deps` recusa outro importador. Hoje nenhum arquivo existe.

### Parar se

- O `requestHandler` dado em `clientConfig` não chega ao STS interno de `fromTemporaryCredentials` na
  3.1175.0: pare; a sonda do estudo diz que chega, e o contrário muda o dublê.
- A gravação mostra uma classe de erro que o estudo não listou: trate como `REFUSED`, registre e
  avise no relatório.

## U5 O lago no Hub

**Base e modelo.** O `main` com o G1 e o G2, e a U4 no ramo. Opus: o estado divide-se entre a linha
do Hub e a pilha, e a exclusão do cliente muda de forma.

### As linhas da tabela

Linhas 2, 3, 6, 7, 8, 9, 10, 11 e 13. Leia na base: `packages/hub-api/src/operation.ts:15-42`,
`operations.ts:68`, `:82-92`, `:140-161`; `failures.ts:17`, `:200-208`; `project-failures.ts:61-68`;
`apps/server/src/hub/operations/routes.ts:18-60`, `public.ts:15-27`; `clients.ts:25-31`, `:184-242`;
`apps/server/src/hub/projects/company-deletion.ts:14-56`, `public.ts:70-80`;
`apps/server/src/hub/identity/admission.ts:33-37`, `:118-122`, `:394-402`; `apps/server/src/main.ts:175-184`,
`:229-253`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/lake/` (`lake.ts`, `settle.ts`, `lake-id.ts`, `routes.ts`, `public.ts`, `lake.test.ts`, `settle.test.ts`) | Cria o assunto | `main.ts`; `hub/operations/` pela porta |
| `apps/server/src/hub/operations/` (`clients.ts`, `public.ts`, `clients-lake.test.ts`) | Muda: a lista de recursos de fora (L.13) | `main.ts` |
| `apps/server/src/hub/projects/public.ts` | Muda: `ports` dá o banco da empresa como um recurso de fora | `hub/operations/` |
| `apps/server/src/hub/identity/admission.ts` | Muda: `createClientLake` e `deleteClientLake`, `by: 'OPERATOR'`, `locks: true` | `hub/lake/` |
| `packages/hub-api/src/` (`lakes.ts`, `index.ts`, `failures.ts`, `project-failures.ts`) | Cria as três operações e `LAKE_BUSY`; muda a frase de `CLIENT_DELETION_PENDING` | a tela (U6); o OpenAPI (`npm run openapi`) |
| `apps/server/src/main.ts` | Muda: `createLakeStacks` e `createLake` entram em `subjectsOf` | — |
| `scripts/rerun-never.json` | Muda, se a regra pedir os testes novos | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/lakes.ts
export const ClientLake = z.discriminatedUnion('state', [
  z.object({ state: z.literal('NONE') }),
  z.object({ state: z.literal('CREATING'), since: z.iso.datetime({ offset: true }) }),
  z.object({ state: z.literal('READY'), bucket: z.string(), region: z.string(), readyAt: z.iso.datetime({ offset: true }) }),
  z.object({ state: z.literal('FAILED'), code: z.literal('LAKE_CREATE_FAILED'), at: z.iso.datetime({ offset: true }) }),
  z.object({ state: z.literal('DELETING'), since: z.iso.datetime({ offset: true }) }),
  z.object({ state: z.literal('DELETE_FAILED'), at: z.iso.datetime({ offset: true }) }),
])
export const getClientLake     // GET    /api/clients/{companyId}/lake  session  200 { lake }  NOT_FOUND, SESSION_REQUIRED, DATABASE_UNAVAILABLE
export const createClientLake  // POST   /api/clients/{companyId}/lake  session  202 { lake }  NOT_FOUND, LAKE_BUSY, SESSION_REQUIRED, DATABASE_UNAVAILABLE
export const deleteClientLake  // DELETE /api/clients/{companyId}/lake  session  body { name: CompanyName }
                               //        202 { lake }  NOT_FOUND, CLIENT_NAME_MISMATCH, LAKE_BUSY, SESSION_REQUIRED, DATABASE_UNAVAILABLE
// failures: LAKE_BUSY, 409, USER, "O lago está mudando agora. Espere terminar.", sem ação

// apps/server/src/hub/lake/settle.ts — a função pura do estado (C21), testada sem banco
type Row = { state: 'creating' | 'ready' | 'failed' | 'deleting' | 'delete_failed'; stackId: StackId | null }
export type Step =
  | { do: 'KEEP' }
  | { do: 'RESEND_CREATE' }                  // creating sem stack_id
  | { do: 'READY' }
  | { do: 'FAIL' }                           // creating e a pilha DELETE_COMPLETE: o motivo e o que sobrou
  | { do: 'RESEND_DELETE' }                  // deleting e a pilha ainda CREATE_COMPLETE
  | { do: 'GONE' }                           // deleting e DELETE_COMPLETE: a linha sai
  | { do: 'DELETE_FAILED' }
export function settle(row: Row, status: StackStatus | null): Step

// apps/server/src/hub/lake/public.ts
export type LakePorts = {
  read(input: { person: PersonId; companyId: CompanyId }): Promise<ClientLake>
  create(input: { person: PersonId; companyId: CompanyId }): Promise<ClientLake>
  remove(input: { person: PersonId; companyId: CompanyId; name: CompanyName }): Promise<ClientLake>
  outside: OutsideResource                   // o lago na exclusão do cliente
}
// apps/server/src/hub/operations/clients.ts
export type OutsideResource = {
  has(tx: ReadTx, input: { admitted: OperatorProof; companyId: CompanyId }): Promise<boolean>
  release(input: { admitted: OperatorProof; companyId: CompanyId }): Promise<'GONE' | 'PENDING'>
}
// sai: projects.hasCompanyDatabase e projects.releaseCompanyDatabase de Deps; entra outside: readonly OutsideResource[]
```

- **Cada estado.** A linha por `state` (cinco valores, a regra do banco da U3); a resposta por
  `ClientLake.state`; o passo por `Step.do`. Um dono só da passagem: `settle` (C21).
- **Cada id.** `LakeId` nasce em `lake-id.ts` (`crypto.randomInt` sobre `[a-z0-9]`, 12 vezes) e é
  conferido pelo esquema da U4; `CompanyId` vem da rota por `OfClient` (`operations.ts:68`).
- **O dono de cada fato.** O nome do depósito, `conexus-<lakeId>`, só em `platform/aws.ts` (U4), e a
  resposta o recebe dali; a frase de `LAKE_BUSY` em `failures.ts`; quem pode, as ações de
  `admission.ts`.
- **O arquivo modelo.** `clients.ts:212-242` para a exclusão em fases e as duas transações; não é
  modelo para o `if` de `:221`, que a lista substitui.

A ordem de cada operação, sem trava durante a chamada à AWS (data D22):

```text
create  tx: lockCompany, admitOperator(createClientLake), o cliente existe e não está em exclusão,
            a linha FOR UPDATE: creating ou ready → devolve a linha; deleting ou delete_failed →
            LAKE_BUSY; sem linha ou failed → grava creating com um lakeId novo, a conta, a região
            e a versão
        fora: aws.create; DONE → update stack_id where stack_id is null; NO_ANSWER → nada
read    tx: admitOperator(operateClients), a linha; ready, failed, sem linha → responde
        fora: creating sem stack_id → aws.create de novo (a mesma chave); com stack_id → aws.status
            e settle; FAIL → aws.firstFailure, aws.leftover, update failed where state = 'creating'
remove  tx: lockCompany, admitOperator(deleteClientLake), o nome (`identity.companyNameOf`),
            a linha: ready ou delete_failed → deleting; sem linha → NONE; o resto → LAKE_BUSY
        fora: aws.remove; a leitura acerta o resto
```

### As skills e a leitura

`fastify-best-practices`; `drizzle`. O guia de dados (D22) e o de segurança (S8, S10, S41).

### A ordem do trabalho

1. **A função de estado.** Critérios: 42 a 48.
   - **Arquivos:** cria `settle.ts`, `settle.test.ts`, `lake-id.ts`.
   - **Referência a seguir:** `PC api/converters.py:17-28` (os estados de desfazer num só).
   - **Testes:** `settle.test.ts`, a tabela inteira de linha por estado da pilha.
   - **Mutações à mão:** faça `creating` com `DELETE_COMPLETE` dar `GONE` (critério 44).
2. **As rotas e a admissão.** Critérios: 40, 41, 46, 49, 53, 54.
   - **Arquivos:** cria `lakes.ts`, `lake.ts`, `routes.ts`, `public.ts`, `lake.test.ts`; muda
     `admission.ts`, `failures.ts`, `index.ts`, `main.ts`.
   - **Referência a seguir:** `operations/routes.ts:18-60`; `clients.ts:212-227` (a trava e a
     admissão).
   - **Testes:** `lake.test.ts`, pelo Hub de teste e `fakeAws` (T5).
   - **Mutações à mão:** tire o `lockCompany` do `create` (critério 41); responda 403 a quem não opera
     (critério 40).
3. **A falha e o que sobrou.** Critérios: 43 a 45, 50.
   - **Testes:** `lake.test.ts`, com `script` e `plantLeftover` do dublê.
   - **Mutações à mão:** reuse o `lakeId` da falha (critério 45); não chame `leftover` (critério 44).
4. **O cliente leva o lago.** Critérios: 51, 52, 65.
   - **Arquivos:** muda `clients.ts`, `operations/public.ts`, `projects/public.ts`, `project-failures.ts`
     (a frase); cria `clients-lake.test.ts`.
   - **O que entra:** `remove` pergunta `has` a cada recurso dentro da primeira transação; com algum,
     marca `DELETING`; fora, chama `release` de todos e lança `CLIENT_DELETION_PENDING` se algum
     respondeu `PENDING`. O lago responde `PENDING` em `creating` e `deleting` (mandando o
     `DeleteStack` se estava `ready`), e `GONE` quando a pilha saiu e a linha foi apagada.
   - **Testes:** os testes de hoje da exclusão do cliente passam sem mudança; `clients-lake.test.ts`.
   - **Mutações à mão:** pule o lago da lista (critério 51).

### Como se prova

`lake.test.ts` e `clients-lake.test.ts` entram pela rota, com o Hub de teste e o dublê de memória;
`settle.test.ts` prova a tabela de estados sem banco. Ao vivo, o roteiro de uso inteiro (delivery
L17). Hoje as rotas não existem.

### Parar se

- A política `OPERATOR` da U3 não deixa o `update` condicional da leitura: volte ao firstmate.
- A leitura pede uma escrita no banco que `getClient` não faz hoje e uma regra recusa um `GET` que
  grava: registre a regra e siga L.12; se for regra de máquina, volte ao firstmate.

## U6 O bloco na Central

**Base e modelo.** O `main` com o G1 e o G2, e a U5 no ramo. Sonnet: uma peça numa página que já
existe.

### As linhas da tabela

Linha 1. Leia na base: `apps/web/src/hub/operations/client.tsx:50-97`; `delete-client-dialog.tsx:15-86`;
`finish-deletion.tsx:13-38`; `queries.ts:144-150`; `apps/web/src/hub/copies/queries.ts:20`, `:50-60`; a
rota `apps/web/src/routes/_app/operations/clients/$companyId.tsx:9-39`; `apps/web/sweep-replies.ts:310-325`;
`sweep-states.ts:72-120`; `docs/reference/telas.md:344-354` (TB24).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/operations/` (`lake.tsx`, `lake.test.tsx`, `queries.ts`, `client.tsx`) | Cria o bloco; muda a página | a rota |
| `apps/web/src/routes/_app/operations/clients/$companyId.tsx` | Muda: o carregador lê o lago quando o cliente não está em exclusão | — |
| `apps/web/sweep-replies.ts`, `sweep-states.ts` | Muda: as respostas e os estados do lago | `npm run sweep` |
| `docs/reference/telas.md` | Muda: o bloco em TB24 | — |

### Os contratos que a unidade cria

```ts
// apps/web/src/hub/operations/queries.ts
export const clientLakeQuery = (companyId: CompanyId) => queryOptions({
  ...hubQuery(getClientLake, { params: { companyId } }),
  refetchInterval: (query) => isMoving(query.state.data?.lake) ? WHILE_MOVING : false,   // 5_000
})
export const sendLakeCreation = hubMutation(createClientLake)
export const sendLakeDeletion = hubMutation(deleteClientLake)
// apps/web/src/hub/operations/lake.tsx
export function ClientLakeBlock(props: { client: Client }): ReactNode
```

O dono das frases é `lake.tsx`, como as de `client.tsx` (nenhum `text.ts` em `hub/operations/`); as
frases das falhas vêm do Hub (`sentenceOf`).

### As skills e a leitura

As linhas de `apps/web/src` em `docs/reference/stack.md` (TanStack Query e Router, Base UI); o guia web
e o de design; [Impeccable](../reference/impeccable.md).

### A ordem do trabalho

1. **A leitura e os estados.** Critérios: 60, 61, 64, 65.
   - **Referência a seguir:** `copies/queries.ts:50-60`; `finish-deletion.tsx:31-35` (o `role="status"`
     e o `Alert`).
   - **Testes:** `lake.test.tsx`, com as respostas de `sweep-replies.ts`.
2. **Os dois botões e a confirmação.** Critérios: 62, 63.
   - **Referência a seguir:** `delete-client-dialog.tsx:27-72`, com `z.literal(client.name)`.
   - **Mutações à mão:** ligue o botão antes do nome exato (critério 62).
3. **Os estados na varredura.** Critério: 66. Os seis estados, o erro e a confirmação em
   `sweep-states.ts`, a 1366 e a 390 px, nos dois temas.

### Como se prova

`lake.test.tsx` pelos componentes com as respostas da varredura; a QA no Hub local com `awsServer`
(L.17), pelo roteiro e pela matriz.

### Parar se

- Um estado da matriz pede um texto que o cartão não dá: use o mais curto no tom dos de hoje e
  liste-o no pull request para o fundador aprovar.

## G3 O ponto de conferência

Depois da U6: `npm run test -w @conexus/server -- aws lake clients`, `npm run test -w @conexus/web --
lake`, `npm run openapi`, `npm run check`; o Hub local com `awsServer`: criar, ler até pronto, apagar,
e o cliente apagado com lago; a prova que grava da U4, passo 4, com a credencial do firstmate.
