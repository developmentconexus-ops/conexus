# A segunda preparação da conta da AWS: a plataforma da cópia

O que só um administrador faz, depois da [primeira preparação](aws-conta-de-laboratorio.md), para a
Release publicar a plataforma da cópia (decisão E). Roda o firstmate, com a palavra do fundador.
Nunca na conta oficial.

Uma vez, depois que a Release já publica a plataforma e antes da primeira que traz a cópia
([o cartão](../steps/a-primeira-copia-chega-ao-lago.md), U6). Os comandos rodam no commit que traz
a U6, na região de `AWS_REGION`, a mesma da pilha `conexus-preparacao`.

1. O papel vinculado do ECS, que a política de execução do CDK não cria:
   `aws iam get-role --role-name AWSServiceRoleForECS`. Se responder `NoSuchEntity`:
   `aws iam create-service-linked-role --aws-service-name ecs.amazonaws.com`.
2. O que muda, antes de mudar:

   ```sh
   npx cdk diff PreparationStack --profile <perfil> --region <região>
   ```

   Depois: só três mudanças. O depósito `CopyRepository` entra, a política
   `ReleaseRoleDefaultPolicy` entra com o envio ao depósito, e a política `CdkExecution` ganha
   `TheCopyCluster`, `TheCopyTaskDefinition`, `TaskDefinitionsHaveNoResource`, `TheCopyQueues`,
   `TheCopyRule`, `TheCopyNetwork` e `TheCopyLogs`. Qualquer outra mudança volta ao firstmate.
3. A preparação de novo, com o comando do passo 1 da primeira e `--region <região>`. Depois:
   `conexus-preparacao` em `UPDATE_COMPLETE`, e
   `aws ecr describe-repositories --repository-names conexus-copia` mostra `IMMUTABLE`.
4. A primeira Release depois disso monta a imagem, publica-a em `conexus-copia` e só então publica a
   plataforma. Depois: `conexus-plataforma` em `UPDATE_COMPLETE`, com as saídas `CopyClusterArn`,
   `CopyTaskFamily`, `CopyQueueUrl`, `CopySubnets` e `CopySecurityGroup`.
5. Os lagos que já existem não têm o papel que escreve. Eles são apagados e criados de novo pelo
   botão da Central (T.5 do cartão).
