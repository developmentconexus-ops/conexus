# A segunda preparação da conta da AWS: a plataforma da cópia

O que só um administrador faz, depois da [primeira preparação](aws-conta-de-laboratorio.md), para a
Release publicar a plataforma da cópia (decisão E). Roda o firstmate, com a palavra do fundador.
Nunca na conta oficial.

Uma vez, depois que a Release já publica a plataforma e antes da primeira que traz a cópia
([a primeira cópia chega ao lago](../approvals/a-primeira-copia-chega-ao-lago.md), U6). Os comandos rodam no commit que traz
a U6, na região de `AWS_REGION`, a mesma da pilha `conexus-preparacao`.

1. O papel vinculado do ECS, que a política de execução do CDK não cria:
   `aws iam get-role --role-name AWSServiceRoleForECS`. Se responder `NoSuchEntity`:
   `aws iam create-service-linked-role --aws-service-name ecs.amazonaws.com`.
2. O que muda, antes de mudar:

   ```sh
   npx cdk diff PreparationStack --profile <perfil> --region <região>
   ```

   Depois: só três mudanças. O depósito `CopyRepository` entra, a política
   `ReleaseRoleDefaultPolicy` entra com o envio ao depósito, e entra a política
   `conexus-cdk-execucao-copia` (`CdkCopyExecution`), com `TheCopyCluster`, `TheCopyTaskDefinition`,
   `TaskDefinitionsHaveNoResource`, `TheCopyQueues`, `TheCopyRule`, `ReadTheCopyNetwork`,
   `CreateTheCopyNetwork`, `TagTheCopyNetworkOnCreate`, `TheCopyNetwork` e `TheCopyLogs`. Ela fica
   fora de `conexus-cdk-execucao` porque uma política gerenciada cabe em 6.144 caracteres. Qualquer
   outra mudança volta ao firstmate.
3. A preparação de novo, com o comando do passo 1 da primeira e `--region <região>`. Depois:
   `conexus-preparacao` em `UPDATE_COMPLETE`, e
   `aws ecr describe-repositories --repository-names conexus-copia` mostra `IMMUTABLE`.
4. O bootstrap de novo, só na região da plataforma, com as duas políticas:

   ```sh
   npx cdk bootstrap aws://<conta>/<região> --profile <perfil> \
     --cloudformation-execution-policies \
     arn:aws:iam::<conta>:policy/conexus-cdk-execucao,arn:aws:iam::<conta>:policy/conexus-cdk-execucao-copia
   ```

   Depois: o papel `cdk-hnb659fds-cfn-exec-role-<conta>-<região>` com as duas, e nada mais.
5. A primeira Release depois disso monta a imagem, publica-a em `conexus-copia` e só então publica a
   plataforma. Depois: `conexus-plataforma` em `UPDATE_COMPLETE`, com as saídas `CopyClusterArn`,
   `CopyTaskFamily`, `CopyQueueUrl`, `CopySubnets` e `CopySecurityGroup`.
6. Os lagos que já existem não têm o papel que escreve. Eles são apagados e criados de novo pelo
   botão da Central (T.5 do cartão).

## Os poderes que valem em `*`

A rede da cópia é a única peça cujo nome o CDK não fixa, e cada ação do EC2 só é limitada à região
da pilha. O que muda ou apaga a rede (`TheCopyNetwork`) vale só onde a etiqueta
`aws:cloudformation:stack-name` é `conexus-plataforma`. O CloudFormation põe essa etiqueta na
própria chamada que cria cada peça, e ninguém escreve uma etiqueta que começa com `aws:`. A VPC
padrão da conta fica fora do alcance.

Ficam em `*`, porque a peça ainda não existe para ter etiqueta:

- **As leituras** (`ReadTheCopyNetwork`), só `Describe*`.
- **As criações** (`CreateTheCopyNetwork`): a VPC, a sub-rede, o gateway, a tabela de rotas e o
  grupo de segurança.
- **A etiqueta na criação** (`TagTheCopyNetworkOnCreate`), só quando `ec2:CreateAction` é uma
  dessas criações.

`ecs:DeregisterTaskDefinition` e `ecs:DescribeTaskDefinition` também ficam em `*`: o ECS não aceita
o ARN de uma família nessas duas ações, nem condição por etiqueta.
