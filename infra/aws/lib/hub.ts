import type { Stack, aws_s3 as s3 } from 'aws-cdk-lib'
import { Duration, aws_iam as iam } from 'aws-cdk-lib'
import type { CopyPlatform } from './copy.ts'
import {
  COPY_CLUSTER,
  HUB_KEY_USER,
  HUB_ROLE,
  stateBucket,
  TAG_COMPANY,
  TEMPLATE_PREFIX,
  templateBucket,
  templateUrlPattern,
} from './names.ts'
import type { Place } from './place.ts'

/** The template-changing actions the Hub is refused unless the address is one of ours (decision F). */
const TEMPLATE_ACTIONS = [
  'cloudformation:CreateStack',
  'cloudformation:UpdateStack',
  'cloudformation:CreateChangeSet',
  'cloudformation:CreateStackSet',
  'cloudformation:UpdateStackSet',
]

/**
 * The Hub's role: the base key assumes it only from the server's address, tagged with one company;
 * the session creates only from our template, through the service role, in its own company.
 */
export function hubRole(
  stack: Stack,
  place: Place,
  of: { service: iam.Role; templates: s3.Bucket; copy: CopyPlatform; sourceIp: string },
): iam.Role {
  const fromTheServer = { IpAddress: { 'aws:SourceIp': of.sourceIp } }
  const keyUser = new iam.ArnPrincipal(place.iam(`user/${HUB_KEY_USER}`))
  const hub = new iam.Role(stack, 'HubRole', {
    roleName: HUB_ROLE,
    maxSessionDuration: Duration.hours(1),
    assumedBy: keyUser.withConditions({
      ...fromTheServer,
      Null: { [`aws:RequestTag/${TAG_COMPANY}`]: 'false' },
    }),
    inlinePolicies: {
      conexus: new iam.PolicyDocument({
        statements: [...hubStatements(stack, place, of), ...copyStatements(stack, place, of.copy)],
      }),
    },
  })
  hub.assumeRolePolicy?.addStatements(
    new iam.PolicyStatement({
      actions: ['sts:TagSession'],
      principals: [keyUser],
      conditions: {
        ...fromTheServer,
        'ForAllValues:StringEquals': { 'aws:TagKeys': [TAG_COMPANY] },
        Null: { 'aws:TagKeys': 'false' },
      },
    }),
  )
  return hub
}

function hubStatements(
  stack: Stack,
  place: Place,
  of: { service: iam.Role; templates: s3.Bucket },
): iam.PolicyStatement[] {
  const sessionCompany = `\${aws:PrincipalTag/${TAG_COMPANY}}`
  const ourTemplates = templateUrlPattern(templateBucket(stack.account, stack.region), stack.region)
  const theSessionCompany = { [`aws:RequestTag/${TAG_COMPANY}`]: sessionCompany }
  const taggedWithTheSessionCompany = {
    StringEquals: { [`aws:ResourceTag/${TAG_COMPANY}`]: sessionCompany },
  }
  return [
    new iam.PolicyStatement({
      sid: 'CreateFromOurTemplateThroughTheServiceRole',
      actions: ['cloudformation:CreateStack'],
      resources: [place.lakeStacks],
      conditions: {
        StringEquals: { 'cloudformation:RoleArn': of.service.roleArn, ...theSessionCompany },
        StringLike: { 'cloudformation:TemplateUrl': ourTemplates },
      },
    }),
    new iam.PolicyStatement({
      sid: 'TagOnlyAtCreation',
      actions: ['cloudformation:TagResource'],
      resources: [place.lakeStacks],
      conditions: {
        StringEquals: { 'cloudformation:CreateAction': 'CreateStack', ...theSessionCompany },
      },
    }),
    new iam.PolicyStatement({
      sid: 'NoOtherTemplate',
      effect: iam.Effect.DENY,
      actions: TEMPLATE_ACTIONS,
      resources: ['*'],
      conditions: { StringNotLike: { 'cloudformation:TemplateUrl': ourTemplates } },
    }),
    new iam.PolicyStatement({
      sid: 'ReadAndDeleteTheSessionCompanyStack',
      actions: [
        'cloudformation:DescribeStacks',
        'cloudformation:DescribeStackEvents',
        'cloudformation:DeleteStack',
      ],
      resources: [place.lakeStacks],
      conditions: taggedWithTheSessionCompany,
    }),
    new iam.PolicyStatement({
      sid: 'PassOnlyTheServiceRole',
      actions: ['iam:PassRole'],
      resources: [of.service.roleArn],
      conditions: { StringEquals: { 'iam:PassedToService': 'cloudformation.amazonaws.com' } },
    }),
    new iam.PolicyStatement({
      sid: 'ReadOurTemplates',
      actions: ['s3:GetObject'],
      resources: [of.templates.arnForObjects(`${TEMPLATE_PREFIX}*`)],
    }),
    new iam.PolicyStatement({
      sid: 'ClearTheSessionCompanyLeftover',
      actions: [
        's3tables:GetTableBucket',
        's3tables:ListNamespaces',
        's3tables:DeleteNamespace',
        's3tables:DeleteTableBucket',
      ],
      resources: [place.lakeTableBuckets],
      conditions: taggedWithTheSessionCompany,
    }),
  ]
}

function copyStatements(stack: Stack, place: Place, copy: CopyPlatform): iam.PolicyStatement[] {
  const inTheCluster = { ArnEquals: { 'ecs:cluster': copy.cluster.clusterArn } }
  return [
    new iam.PolicyStatement({
      sid: 'StartOnlyTheCopyTask',
      actions: ['ecs:RunTask'],
      resources: [place.arn('ecs', `task-definition/${copy.taskFamily}:*`)],
      conditions: inTheCluster,
    }),
    new iam.PolicyStatement({
      sid: 'StopAndReadTheCopyTasks',
      actions: ['ecs:StopTask', 'ecs:DescribeTasks', 'ecs:ListTasks'],
      resources: [
        place.arn('ecs', `task/${COPY_CLUSTER}/*`),
        place.arn('ecs', `container-instance/${COPY_CLUSTER}/*`),
      ],
      conditions: inTheCluster,
    }),
    new iam.PolicyStatement({
      sid: 'PassOnlyTheWritersToTheTask',
      actions: ['iam:PassRole'],
      resources: [place.writers, copy.executionRole.roleArn],
      conditions: { StringEquals: { 'iam:PassedToService': 'ecs-tasks.amazonaws.com' } },
    }),
    new iam.PolicyStatement({
      sid: 'WriteAndDeleteTheRunParameters',
      actions: ['ssm:PutParameter', 'ssm:DeleteParameter'],
      resources: [place.runParameters],
    }),
    new iam.PolicyStatement({
      sid: 'HearTheCopyQueue',
      actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage'],
      resources: [copy.queue.queueArn],
    }),
    new iam.PolicyStatement({
      sid: 'ListAndDeleteLakeTables',
      actions: ['s3tables:ListTables', 's3tables:DeleteTable'],
      resources: [place.lakeTableBuckets, `${place.lakeTableBuckets}/table/*`],
    }),
    new iam.PolicyStatement({
      sid: 'ReadAndWriteTheCompanyStoppingPoints',
      actions: ['s3:GetObject', 's3:PutObject'],
      resources: [
        `arn:${stack.partition}:s3:::${stateBucket(stack.account, stack.region)}/\${aws:PrincipalTag/${TAG_COMPANY}}/*`,
      ],
    }),
    new iam.PolicyStatement({
      sid: 'ListTheCompanyStoppingPoints',
      actions: ['s3:ListBucket'],
      resources: [`arn:${stack.partition}:s3:::${stateBucket(stack.account, stack.region)}`],
      conditions: { StringLike: { 's3:prefix': `\${aws:PrincipalTag/${TAG_COMPANY}}/*` } },
    }),
  ]
}
