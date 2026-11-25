# A terceira preparação da conta da AWS: o depósito do ponto de parada

O que só um administrador faz, depois da [segunda preparação](aws-segunda-preparacao.md), para a
Release criar o depósito `conexus-estado-<conta>-<região>`, onde a cópia guarda o ponto de parada.
Sem ela, o Publish para em `s3:CreateBucket` negado e a plataforma volta atrás (issue 1413). Roda o
firstmate, com a palavra do fundador. Nunca na conta oficial.

Uma vez, antes do próximo Publish. Os comandos rodam em `infra/aws/`, depois de `npm ci`, num commit
do `main` que já traz a instrução `TheStoppingPointsBucket`, na região de `AWS_REGION`, a mesma da
pilha `conexus-preparacao`.

1. O que o Publish que falhou deixou:

   ```sh
   aws cloudformation describe-stacks --stack-name conexus-plataforma \
     --query 'Stacks[0].StackStatus' --output text --profile <perfil> --region <região>
   aws s3api head-bucket --bucket conexus-estado-<conta>-<região> \
     --profile <perfil> --region <região>
   ```

   Depois: `UPDATE_ROLLBACK_COMPLETE`, e o `head-bucket` responde `404`: o depósito não nasceu.
   Qualquer outra resposta volta ao firstmate. A pilha guarda o depósito que criou (`Retain`), e um
   que tenha ficado faria o Publish parar em nome já usado.
2. O que muda, antes de mudar:

   ```sh
   npx cdk diff PreparationStack --profile <perfil> --region <região>
   ```

   Depois: um só recurso muda, `[~] AWS::IAM::ManagedPolicy CdkCopyExecution`, a política
   `conexus-cdk-execucao-copia`. No `PolicyDocument`, depois de `TheCopyLogs`, entra a instrução
   `TheStoppingPointsBucket`: `Allow`, no recurso
   `arn:${AWS::Partition}:s3:::conexus-estado-${AWS::AccountId}-${AWS::Region}`, com estas ações e
   nenhuma outra:

   ```text
   s3:CreateBucket
   s3:DeleteBucket
   s3:PutEncryptionConfiguration
   s3:PutLifecycleConfiguration
   s3:PutBucketPublicAccessBlock
   s3:PutBucketVersioning
   s3:PutBucketPolicy
   s3:DeleteBucketPolicy
   s3:PutBucketTagging
   s3:TagResource
   s3:UntagResource
   s3:ListBucket
   s3:ListTagsForResource
   s3:GetAccelerateConfiguration
   s3:GetAnalyticsConfiguration
   s3:GetBucketAbac
   s3:GetBucketAcl
   s3:GetBucketCORS
   s3:GetBucketLogging
   s3:GetBucketMetadataTableConfiguration
   s3:GetBucketNotification
   s3:GetBucketObjectLockConfiguration
   s3:GetBucketOwnershipControls
   s3:GetBucketPolicy
   s3:GetBucketPublicAccessBlock
   s3:GetBucketTagging
   s3:GetBucketVersioning
   s3:GetBucketWebsite
   s3:GetEncryptionConfiguration
   s3:GetIntelligentTieringConfiguration
   s3:GetInventoryConfiguration
   s3:GetLifecycleConfiguration
   s3:GetMetricsConfiguration
   s3:GetReplicationConfiguration
   ```

   Qualquer outra mudança volta ao firstmate.
3. A preparação de novo, com o comando do passo 1 da
   [primeira](aws-conta-de-laboratorio.md) e `--region <região>`. Depois: `conexus-preparacao` em
   `UPDATE_COMPLETE`. O bootstrap não roda de novo: o papel de execução já tem a política.
4. O que o CloudFormation passa a poder:

   ```sh
   aws iam simulate-principal-policy --profile <perfil> \
     --policy-source-arn arn:aws:iam::<conta>:role/cdk-hnb659fds-cfn-exec-role-<conta>-<região> \
     --resource-arns arn:aws:s3:::conexus-estado-<conta>-<região> \
     --action-names s3:CreateBucket s3:PutEncryptionConfiguration s3:PutLifecycleConfiguration \
       s3:PutBucketPublicAccessBlock s3:PutBucketVersioning s3:PutBucketPolicy s3:PutBucketTagging \
     --query 'EvaluationResults[].[EvalActionName,EvalDecision]' --output text
   ```

   Depois: as sete com `allowed`.
5. O próximo Publish publica a plataforma. Depois: `conexus-plataforma` em `UPDATE_COMPLETE`, e
   `aws s3api get-bucket-versioning --bucket conexus-estado-<conta>-<região>` responde `Enabled`. Se
   ele parar de novo em permissão negada, o evento do CloudFormation volta ao firstmate, e o passo 1
   se repete antes de outra tentativa.

## O que a instrução alcança

Só o depósito desse nome, e nenhuma ação sobre um objeto: o CloudFormation não lê, escreve nem apaga
um ponto de parada. `s3:ListBucket` deixa listar os nomes dos objetos, e o CloudFormation precisa
dele para saber se o depósito existe. `s3:PutBucketPolicy` deixa mudar quem entra no depósito, o
preço de o CloudFormation configurá-lo.
