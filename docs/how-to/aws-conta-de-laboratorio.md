# Preparar a conta de laboratório da AWS

O que só um administrador faz, uma vez, para o Publish publicar a plataforma do lago sem chave
guardada. Decisões: [0073](../decisions/0073-platform-by-cdk-one-stack-per-company.md) e
[0075](../decisions/0075-how-the-hub-reaches-aws.md). Roda o firstmate, com a palavra do fundador.
Nunca na conta oficial.

Os comandos rodam em `infra/aws/`, depois de `npm ci`. `<vazia>` é a região sem a ligação do
`S3 Tables` com o Athena, `<perfil>` o de administrador, e `<parâmetros>` são `--parameters BudgetUsd=<valor> --parameters AlarmEmail=<e-mail> --parameters
HubSourceIp=<endereço do servidor>/32`. Nada disso entra no repositório. Nos retratos do Lake Formation,
`AuthorizedSessionTagValueList` vazio equivale a ausente
([DataLakeSettings](https://docs.aws.amazon.com/lake-formation/latest/APIReference/API_DataLakeSettings.html)):
compare-os por `jq -S '.DataLakeSettings | .AuthorizedSessionTagValueList //= []'`.

## 1. A preparação

```sh
npx cdk deploy PreparationStack --profile <perfil> --parameters GitHubRepository=developmentconexus-ops/conexus
```

Depois: `conexus-preparacao` em `CREATE_COMPLETE`, com o provedor OIDC do GitHub, o papel
`conexus-release`, o usuário `conexus-hub-chave` sem chave e a política `conexus-cdk-execucao`.

## 2. A preparação do CDK, nas duas regiões

Escolha `<vazia>`: uma região em que `aws glue get-catalog --catalog-id s3tablescatalog`
responde `EntityNotFoundException`; anote-a no pull request. Se a conta recusar toda região fora de
us-east-2, o teste da ligação (P2) volta ao firstmate.

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
(security S31). Depois: `stat` o confirma, e a chave não fica em outro arquivo.

## 4. Em us-east-2, a troca das peças feitas à mão (decisão H)

Orçamento e monitor valem para a conta inteira, então só uma plataforma fica de pé por vez: o
passo 6 termina antes deste e já tirou o monitor feito à mão:

1. `aws lakeformation get-data-lake-settings --region us-east-2 > antes.json`.
2. Confira que nenhum lago usa a ligação: `aws glue get-catalogs --parent-catalog-id s3tablescatalog`
   volta vazio. Então apague o catálogo (`aws glue delete-catalog --catalog-id s3tablescatalog`), as
   concessões de `list-permissions --resource-type DATA_LOCATION` em
   `arn:aws:s3tables:us-east-2:<conta>:bucket/*` e enfim o registro
   (`aws lakeformation deregister-resource`). Depois: `list-permissions` vazio.

   ```sh
   aws lakeformation revoke-permissions --region us-east-2 --principal DataLakePrincipalIdentifier=<principal> \
     --permissions DATA_LOCATION_ACCESS --permissions-with-grant-option DATA_LOCATION_ACCESS \
     --resource '{"DataLocation":{"ResourceArn":"arn:aws:s3tables:us-east-2:<conta>:bucket/*"}}'
   ```
3. O monitor de antes do passo 6 de novo, e então
   `npx cdk deploy PlatformStack --region us-east-2 --profile <perfil> <parâmetros>`.
4. Confira que o orçamento `conexus-orcamento-mensal` e o monitor `conexus-gasto-fora-do-normal`
   existem e que o e-mail de aviso chega. Só então apague o orçamento `conexus-lab-mensal` e o papel
   `conexus-lab-lf-s3tables`.
5. `get-data-lake-settings` de novo: igual a `antes.json`, com só `conexus-cfn` a mais em
   `DataLakeAdmins`.

## 5. As variáveis do ambiente `production`

```sh
gh variable set AWS_ROLE_ARN --env production --body arn:aws:iam::<conta>:role/conexus-release
gh variable set AWS_REGION --env production --body us-east-2
gh variable set AWS_BUDGET_USD --env production --body <valor>
gh variable set AWS_ALARM_EMAIL --env production --body <e-mail>
gh variable set HUB_SOURCE_IP --env production --body <endereço do servidor>/32
```

Depois: `gh variable list --env production` mostra as cinco.

O papel da Release confia em todo job do ambiente, que só aceita o `main` e as tags:

```sh
gh api repos/developmentconexus-ops/conexus/environments/production/deployment-branch-policies \
  --jq '.branch_policies[] | [.type, .name] | @tsv'
```

Depois: só `branch main` e `tag v*`. A que faltar entra por `gh api -X POST` ali, com
`-f name=main -f type=branch` ou `-f name='v*' -f type=tag`.

## 6. Na região vazia: o teste da ligação e a saída

A conta aceita um só monitor de gasto dos serviços, e a cota não sobe: antes de cada deploy da
plataforma, o monitor de `aws ce get-anomaly-monitors` com `MonitorDimension` `SERVICE` sai
(`aws ce delete-anomaly-monitor --monitor-arn <arn>`), e o orçamento feito à mão cobre o intervalo
(L.14 do cartão).

```sh
export AWS_REGION=<vazia> AWS_PROFILE=<perfil>
aws lakeformation get-data-lake-settings > antes.json
npx cdk deploy PlatformStack <parâmetros>
aws lakeformation get-data-lake-settings > depois.json
```

Depois: `depois.json` é `antes.json` com só `conexus-cfn` a mais em `DataLakeAdmins`;
`get-catalog` mostra as duas permissões padrão vazias e
`AllowFullTableExternalDataAccess` em `False`. Feito o teste:

```sh
npx cdk destroy PlatformStack
aws cloudformation delete-stack --stack-name CDKToolkit
for b in conexus-receitas-<conta>-<vazia> cdk-hnb659fds-assets-<conta>-<vazia>; do
  for kind in Versions DeleteMarkers; do
    objects="$(aws s3api list-object-versions --bucket "$b" --output json \
      --query "{Objects: ${kind}[].{Key: Key, VersionId: VersionId}}")"
    if [ "$(jq '.Objects | length' <<<"$objects")" -gt 0 ]; then
      aws s3api delete-objects --bucket "$b" --delete "$objects"
    fi
  done
  aws s3api delete-bucket --bucket "$b"
done
```

Depois: `get-data-lake-settings` igual a `antes.json`, `get-catalog` com
`EntityNotFoundException`, `list-resources`, `list-permissions --resource-type DATA_LOCATION` e
`describe-log-groups --log-group-name-prefix conexus-` vazios, nenhuma pilha nem depósito `conexus-`
ou `cdk-` na região. Nenhum deploy posterior roda nela. Um `destroy` parado em
`TableBucketsLocationGrant` volta ao firstmate, que revoga a concessão.
