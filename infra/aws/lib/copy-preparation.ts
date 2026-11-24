import type { Stack } from 'aws-cdk-lib'
import { aws_ecr as ecr, aws_iam as iam, RemovalPolicy } from 'aws-cdk-lib'
import { LOG_GROUP_ACTIONS } from './actions.ts'
import {
  COPY_CLUSTER,
  COPY_LOGS,
  COPY_QUEUE,
  COPY_REPOSITORY,
  COPY_TASK_FAMILY,
  PLATFORM_STACK,
} from './names.ts'

/**
 * The copy platform's pieces (card U6, criterion 29): what each resource type's CloudFormation
 * handlers call, as `cloudformation describe-type` lists them, without the KMS and account-setting
 * calls of options the platform does not use. The image repository is the preparation's own.
 */
const COPY_CLUSTER_ACTIONS = [
  'ecs:CreateCluster',
  'ecs:DeleteCluster',
  'ecs:DescribeClusters',
  'ecs:UpdateCluster',
  'ecs:UpdateClusterSettings',
  'ecs:PutClusterCapacityProviders',
  'ecs:TagResource',
  'ecs:UntagResource',
  'ecs:ListTagsForResource',
]

const COPY_QUEUE_ACTIONS = [
  'sqs:CreateQueue',
  'sqs:DeleteQueue',
  'sqs:GetQueueAttributes',
  'sqs:SetQueueAttributes',
  'sqs:GetQueueUrl',
  'sqs:TagQueue',
  'sqs:UntagQueue',
  'sqs:ListQueueTags',
]

const COPY_RULE_ACTIONS = [
  'events:PutRule',
  'events:DeleteRule',
  'events:DescribeRule',
  'events:PutTargets',
  'events:RemoveTargets',
  'events:ListTargetsByRule',
  'events:TagResource',
  'events:UntagResource',
  'events:ListTagsForResource',
]

const COPY_NETWORK_ACTIONS = [
  'ec2:CreateVpc',
  'ec2:DeleteVpc',
  'ec2:DescribeVpcs',
  'ec2:DescribeVpcAttribute',
  'ec2:ModifyVpcAttribute',
  'ec2:DescribeVpcEncryptionControls',
  'ec2:CreateSubnet',
  'ec2:DeleteSubnet',
  'ec2:DescribeSubnets',
  'ec2:ModifySubnetAttribute',
  'ec2:DescribeNetworkAcls',
  'ec2:DescribeAvailabilityZones',
  'ec2:CreateInternetGateway',
  'ec2:DeleteInternetGateway',
  'ec2:DescribeInternetGateways',
  'ec2:AttachInternetGateway',
  'ec2:DetachInternetGateway',
  'ec2:CreateRouteTable',
  'ec2:DeleteRouteTable',
  'ec2:DescribeRouteTables',
  'ec2:AssociateRouteTable',
  'ec2:DisassociateRouteTable',
  'ec2:CreateRoute',
  'ec2:DeleteRoute',
  'ec2:ReplaceRoute',
  'ec2:DescribeNetworkInterfaces',
  'ec2:CreateSecurityGroup',
  'ec2:DeleteSecurityGroup',
  'ec2:DescribeSecurityGroups',
  'ec2:AuthorizeSecurityGroupEgress',
  'ec2:RevokeSecurityGroupEgress',
  'ec2:DescribeInstances',
  'ec2:CreateTags',
  'ec2:DeleteTags',
]

/**
 * The copy task's images (card U6, criterion 34): the Release publishes here before the platform,
 * so the repository exists before the first Release, and the Release may push only to it.
 */
export function copyImages(stack: Stack, release: iam.Role): void {
  const images = new ecr.Repository(stack, 'CopyRepository', {
    repositoryName: COPY_REPOSITORY,
    imageTagMutability: ecr.TagMutability.IMMUTABLE,
    removalPolicy: RemovalPolicy.RETAIN,
  })
  images.grantPush(release)
  images.grant(release, 'ecr:DescribeImages')
}

export function copyPlatformStatements(stack: Stack): iam.PolicyStatement[] {
  function arn(service: string, resource: string): string {
    return `arn:${stack.partition}:${service}:*:${stack.account}:${resource}`
  }
  return [
    new iam.PolicyStatement({
      sid: 'TheCopyCluster',
      actions: COPY_CLUSTER_ACTIONS,
      resources: [arn('ecs', `cluster/${COPY_CLUSTER}`)],
    }),
    new iam.PolicyStatement({
      sid: 'TheCopyTaskDefinition',
      actions: ['ecs:RegisterTaskDefinition', 'ecs:TagResource', 'ecs:UntagResource'],
      resources: [arn('ecs', `task-definition/${COPY_TASK_FAMILY}:*`)],
    }),
    new iam.PolicyStatement({
      sid: 'TaskDefinitionsHaveNoResource',
      actions: ['ecs:DeregisterTaskDefinition', 'ecs:DescribeTaskDefinition'],
      resources: ['*'],
    }),
    new iam.PolicyStatement({
      sid: 'TheCopyQueues',
      actions: COPY_QUEUE_ACTIONS,
      resources: [arn('sqs', `${COPY_QUEUE}*`)],
    }),
    new iam.PolicyStatement({
      sid: 'TheCopyRule',
      actions: COPY_RULE_ACTIONS,
      resources: [arn('events', `rule/${PLATFORM_STACK}-*`)],
    }),
    new iam.PolicyStatement({
      sid: 'TheCopyNetwork',
      actions: COPY_NETWORK_ACTIONS,
      resources: ['*'],
    }),
    new iam.PolicyStatement({
      sid: 'TheCopyLogs',
      actions: LOG_GROUP_ACTIONS,
      resources: [arn('logs', `log-group:${COPY_LOGS}`), arn('logs', `log-group:${COPY_LOGS}:*`)],
    }),
  ]
}
