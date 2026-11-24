import type { Stack } from 'aws-cdk-lib'
import {
  CfnOutput,
  CfnParameter,
  Duration,
  aws_ec2 as ec2,
  aws_ecr as ecr,
  aws_ecs as ecs,
  aws_events as events,
  aws_iam as iam,
  aws_logs as logs,
  aws_sqs as sqs,
  aws_events_targets as targets,
} from 'aws-cdk-lib'
import {
  COPY_CLUSTER,
  COPY_DEAD_LETTERS,
  COPY_EXECUTION_ROLE,
  COPY_LOGS,
  COPY_QUEUE,
  COPY_REPOSITORY,
  COPY_TASK_FAMILY,
} from './names.ts'
import type { Place } from './place.ts'

export type CopyPlatform = {
  cluster: ecs.Cluster
  taskFamily: string
  queue: sqs.Queue
  executionRole: iam.Role
}

/**
 * The copy task's platform (decision 0076, card T.6, T.14): public subnets with no NAT, the cluster,
 * the one task definition of 1 vCPU and 2 GB on x86 with no task role (the Hub passes the company's
 * writer on each `RunTask`), pointing by digest at the image the Release published to the
 * preparation's repository, and the queue where the task's result and the rule's `STOPPED` event meet.
 */
export function copyPlatform(stack: Stack, place: Place): CopyPlatform {
  const digest = new CfnParameter(stack, 'CopyImageDigest', {
    type: 'String',
    allowedPattern: '^sha256:[a-f0-9]{64}$',
  })
  const { network, outbound } = copyNetwork(stack)
  const cluster = new ecs.Cluster(stack, 'CopyCluster', {
    clusterName: COPY_CLUSTER,
    vpc: network,
  })
  const repository = ecr.Repository.fromRepositoryName(stack, 'CopyRepository', COPY_REPOSITORY)
  const taskLogs = new logs.LogGroup(stack, 'CopyLogs', { logGroupName: COPY_LOGS })
  const executionRole = new iam.Role(stack, 'CopyExecutionRole', {
    roleName: COPY_EXECUTION_ROLE,
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com').withConditions({
      StringEquals: { 'aws:SourceAccount': stack.account },
    }),
  })
  repository.grantPull(executionRole)
  taskLogs.grantWrite(executionRole)
  new ecs.CfnTaskDefinition(stack, 'CopyTask', {
    family: COPY_TASK_FAMILY,
    requiresCompatibilities: ['FARGATE'],
    networkMode: 'awsvpc',
    cpu: '1024',
    memory: '2048',
    runtimePlatform: { cpuArchitecture: 'X86_64', operatingSystemFamily: 'LINUX' },
    executionRoleArn: executionRole.roleArn,
    containerDefinitions: [
      {
        name: 'copia',
        image: repository.repositoryUriForDigest(digest.valueAsString),
        essential: true,
        // The ECS init passes the stop's SIGTERM to the entry, which passes it on to Meltano.
        linuxParameters: { initProcessEnabled: true },
        logConfiguration: {
          logDriver: 'awslogs',
          options: {
            'awslogs-group': taskLogs.logGroupName,
            'awslogs-region': stack.region,
            'awslogs-stream-prefix': 'copia',
          },
        },
      },
    ],
  })
  const queue = copyQueue(stack, place, cluster)
  new CfnOutput(stack, 'CopyClusterArn', { value: cluster.clusterArn })
  new CfnOutput(stack, 'CopyTaskFamily', { value: COPY_TASK_FAMILY })
  new CfnOutput(stack, 'CopyQueueUrl', { value: queue.queueUrl })
  new CfnOutput(stack, 'CopySubnets', {
    value: network.publicSubnets.map((subnet) => subnet.subnetId).join(','),
  })
  new CfnOutput(stack, 'CopySecurityGroup', { value: outbound.securityGroupId })
  return { cluster, taskFamily: COPY_TASK_FAMILY, queue, executionRole }
}

function copyNetwork(stack: Stack): { network: ec2.Vpc; outbound: ec2.SecurityGroup } {
  const network = new ec2.Vpc(stack, 'CopyNetwork', {
    natGateways: 0,
    maxAzs: 2,
    subnetConfiguration: [{ name: 'publica', subnetType: ec2.SubnetType.PUBLIC }],
    restrictDefaultSecurityGroup: false,
  })
  const outbound = new ec2.SecurityGroup(stack, 'CopyOutbound', {
    vpc: network,
    allowAllOutbound: false,
    description: 'conexus copia: only HTTPS out',
  })
  outbound.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443))
  return { network, outbound }
}

/**
 * Where the task's result and its `STOPPED` event meet: the rule sends the cluster's stops, the
 * writers send the result, and a message the Hub fails three times goes to the dead letters (T.14).
 */
function copyQueue(stack: Stack, place: Place, cluster: ecs.Cluster): sqs.Queue {
  const deadLetters = new sqs.Queue(stack, 'CopyDeadLetters', {
    queueName: COPY_DEAD_LETTERS,
    retentionPeriod: Duration.days(14),
    encryption: sqs.QueueEncryption.SQS_MANAGED,
    enforceSSL: true,
  })
  const queue = new sqs.Queue(stack, 'CopyQueue', {
    queueName: COPY_QUEUE,
    retentionPeriod: Duration.days(14),
    encryption: sqs.QueueEncryption.SQS_MANAGED,
    enforceSSL: true,
    deadLetterQueue: { queue: deadLetters, maxReceiveCount: 3 },
  })
  const stopped = new events.Rule(stack, 'CopyStopped', {
    eventPattern: {
      source: ['aws.ecs'],
      detailType: ['ECS Task State Change'],
      detail: { clusterArn: [cluster.clusterArn], lastStatus: ['STOPPED'] },
    },
    targets: [new targets.SqsQueue(queue, { deadLetterQueue: deadLetters })],
  })
  queue.addToResourcePolicy(
    new iam.PolicyStatement({
      sid: 'TheWritersSendTheResult',
      principals: [new iam.AccountRootPrincipal()],
      actions: ['sqs:SendMessage'],
      resources: [queue.queueArn],
      conditions: { ArnLike: { 'aws:PrincipalArn': place.writers } },
    }),
  )
  queue.addToResourcePolicy(
    new iam.PolicyStatement({
      sid: 'OnlyTheRuleAndTheWriters',
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['sqs:SendMessage'],
      resources: [queue.queueArn],
      conditions: {
        ArnNotLike: { 'aws:PrincipalArn': place.writers },
        ArnNotEquals: { 'aws:SourceArn': stopped.ruleArn },
      },
    }),
  )
  return queue
}
