# Preparar a conta de laboratório da AWS

O que só um administrador faz na conta de laboratório, uma vez, para a Release publicar a
plataforma do lago sem chave guardada. Decisões: [0073](../decisions/0073-platform-by-cdk-one-stack-per-company.md)
e [0075](../decisions/0075-how-the-hub-reaches-aws.md). Quem roda é o firstmate, com o perfil de
administrador do laboratório e a palavra do fundador. Nunca na conta oficial.

Os comandos rodam em `infra/aws/`, depois de `npm ci`. `<conta>` é o número da conta, `<vazia>` a
região sem a ligação do `S3 Tables` com o Athena, `<perfil>` o perfil de administrador, e
`<parâmetros>` são `--parameters BudgetUsd=<valor> --parameters AlarmEmail=<e-mail> --parameters
HubSourceIp=<endereço do servidor>/32`. Nada disso entra no repositório.

## 1. A preparação

```sh
npx cdk deploy PreparationStack --profile <perfil> --parameters GitHubRepository=developmentconexus-ops/conexus
```

Depois: a pilha `conexus-preparacao` em `CREATE_COMPLETE`; o provedor OIDC
`token.actions.githubusercontent.com`, o papel `conexus-release`, o usuário `conexus-hub-chave` sem
chave e a política `conexus-cdk-execucao`. A pilha vai no próprio pedido, sem preparação do CDK.

## 2. A preparação do CDK, nas duas regiões

Antes, escolha `<vazia>`: uma região em que `aws glue get-catalog --catalog-id s3tablescatalog`
responde `EntityNotFoundException`, e anote qual no pull request. Se a conta recusar toda região fora
de us-east-2, pare: o teste da ligação (P2) volta ao firstmate.

```sh
for region in <vazia> us-east-2; do
  npx cdk bootstrap aws://<conta>/$region --profile <perfil> \
    --cloudformation-execution-policies arn:aws:iam::<conta>:policy/conexus-cdk-execucao
done
```

Depois: a pilha `CDKToolkit` em cada região, e o papel `cdk-hnb659fds-cfn-exec-role-<conta>-<região>`
só com `conexus-cdk-execucao`, sem `AdministratorAccess`.

## 3. A chave do Hub, só antes de o Hub usar o lago

Com a palavra do fundador e a porta do servidor aberta por ele:

```sh
aws iam create-access-key --user-name conexus-hub-chave --profile <perfil>
```

A chave vai, na forma do arquivo de credenciais do SDK, para `/etc/conexus/secrets/hub_aws_credentials`
no servidor, com dono uid 1000 e modo 600; o Hub lê o caminho de `AWS_SHARED_CREDENTIALS_FILE`
(security S31). Depois: `stat` mostra o modo 600, e a chave não fica em outro arquivo nem na pilha.

## 4. Em us-east-2, a troca das peças feitas à mão (decisão H)

O orçamento e o monitor valem para a conta inteira, então só uma plataforma fica de pé por vez: o
passo 6 termina antes deste. Na ordem:

1. `aws lakeformation get-data-lake-settings --region us-east-2 > antes.json`.
2. Confira que nenhum lago usa a ligação: `aws glue get-catalogs --parent-catalog-id s3tablescatalog`
   volta vazio. Então apague o catálogo (`aws glue delete-catalog --catalog-id s3tablescatalog`) e o
   registro de `arn:aws:s3tables:us-east-2:<conta>:bucket/*` (`aws lakeformation deregister-resource`).
3. `npx cdk deploy PlatformStack --region us-east-2 --profile <perfil> <parâmetros>`. Se o monitor
   for recusado por já existir um igual, o feito à mão sai antes, e o deploy roda de novo (L.14 do
   cartão).
4. Confira que o orçamento `conexus-orcamento-mensal` e o monitor `conexus-gasto-fora-do-normal`
   existem e que o e-mail de aviso chega. Só então apague o orçamento `conexus-lab-mensal`, o monitor
   feito à mão e o papel `conexus-lab-lf-s3tables`.
5. `get-data-lake-settings` de novo: igual a `antes.json`, com só `conexus-cfn` a mais em
   `DataLakeAdmins`.

Nunca fica sem orçamento: por alguns minutos, os dois existem juntos.

## 5. As variáveis do ambiente `production`

```sh
gh variable set AWS_ROLE_ARN --env production --body arn:aws:iam::<conta>:role/conexus-release
gh variable set AWS_REGION --env production --body us-east-2
gh variable set AWS_BUDGET_USD --env production --body <valor>
gh variable set AWS_ALARM_EMAIL --env production --body <e-mail>
gh variable set HUB_SOURCE_IP --env production --body <endereço do servidor>/32
```

Depois: `gh variable list --env production` mostra as cinco. Nenhuma vai ao repositório.

## 6. Na região vazia: o teste da ligação e a saída

```sh
aws lakeformation get-data-lake-settings --region <vazia> --profile <perfil> > antes.json
npx cdk deploy PlatformStack --region <vazia> --profile <perfil> <parâmetros>
aws lakeformation get-data-lake-settings --region <vazia> --profile <perfil> > depois.json
```

Depois: `depois.json` é `antes.json` com só `conexus-cfn` a mais em `DataLakeAdmins`;
`aws glue get-catalog --catalog-id s3tablescatalog` mostra as duas permissões padrão vazias e
`AllowFullTableExternalDataAccess` em `False`. Feito o teste:

```sh
npx cdk destroy PlatformStack --region <vazia> --profile <perfil>
aws s3api delete-bucket --bucket conexus-receitas-<conta>-<vazia> --region <vazia> --profile <perfil>
aws cloudformation delete-stack --stack-name CDKToolkit --region <vazia> --profile <perfil>
```

O depósito das receitas fica quando a pilha sai, de propósito, e por isso sai à mão; o depósito de
arquivos do `CDKToolkit` também fica, e sai por `aws s3 rb --force`. Depois: `get-data-lake-settings`
igual a `antes.json`, `get-catalog` de novo `EntityNotFoundException`, nenhuma pilha nem depósito
`conexus-` ou `cdk-` na região. Nenhum deploy posterior roda nela.
