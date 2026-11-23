import type { Stack } from 'aws-cdk-lib'
import { BUCKET_PREFIX, STACK_PREFIX } from './names.ts'

/** The ARNs every piece of the platform names, in the stack's own account and region. */
export class Place {
  private readonly stack: Stack
  constructor(stack: Stack) {
    this.stack = stack
  }
  arn(service: string, resource: string, region = this.stack.region): string {
    return `arn:${this.stack.partition}:${service}:${region}:${this.stack.account}:${resource}`
  }
  iam(resource: string): string {
    return this.arn('iam', resource, '')
  }
  get lakeStacks(): string {
    return this.arn('cloudformation', `stack/${STACK_PREFIX}*/*`)
  }
  get lakeTableBuckets(): string {
    return this.arn('s3tables', `bucket/${BUCKET_PREFIX}*`)
  }
  get allTableBuckets(): string {
    return this.arn('s3tables', 'bucket/*')
  }
  get workGroups(): string {
    return this.arn('athena', `workgroup/${BUCKET_PREFIX}*`)
  }
}
