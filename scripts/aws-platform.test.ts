import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'
import { parse } from 'yaml'
import { z } from 'zod'
import { COPY_REPOSITORY } from '../infra/aws/lib/names.ts'

const Step = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  uses: z.string().optional(),
  run: z.string().optional(),
  with: z.record(z.string(), z.unknown()).optional(),
  env: z.record(z.string(), z.string()).optional(),
})
const Job = z.object({
  'runs-on': z.unknown().optional(),
  environment: z.string().optional(),
  permissions: z.record(z.string(), z.string()).optional(),
  uses: z.string().optional(),
  steps: z.array(Step).default([]),
})
const Workflow = z.object({ jobs: z.record(z.string(), Job) })

function text(name: string): string {
  return readFileSync(resolve(import.meta.dirname, '../.github/workflows', name), 'utf8')
}

const awsPlatform = Workflow.parse(parse(text('aws-platform.yml')))
const publish = Workflow.parse(parse(text('publish.yml')))

test('a plataforma da AWS entra pelo OIDC do ambiente production, sem chave guardada, e não reescreve uma receita', () => {
  const platform = awsPlatform.jobs.platform
  assert.equal(platform?.['runs-on'], 'ubuntu-24.04')
  assert.equal(platform?.environment, 'production')
  assert.deepEqual(platform?.permissions, { contents: 'read', 'id-token': 'write' })
  assert.deepEqual(publish.jobs['aws-platform']?.permissions, platform?.permissions)
  const enter = platform?.steps.find((step) =>
    step.uses?.startsWith('aws-actions/configure-aws-credentials@'),
  )
  assert.equal(enter?.with?.['role-to-assume'], ['${{', 'vars.AWS_ROLE_ARN', '}}'].join(' '))
  const deploy = platform?.steps.find((step) => step.run?.includes('cdk deploy PlatformStack'))
  assert.match(deploy?.run ?? '', /--outputs-file "\$RUNNER_TEMP\/platform\.json"/)
  const put = platform?.steps.find((step) => step.run?.includes('aws s3api put-object'))
  for (const output of ['TemplatesBucket', 'TemplatesPrefix']) {
    assert.match(put?.run ?? '', new RegExp(`first\\(\\.\\[\\]\\)\\.${output}`))
  }
  // No stored key; the bucket and the folder come from the platform's outputs (names.ts owns them).
  assert.doesNotMatch(
    text('aws-platform.yml'),
    /\bsecrets\b|aws-access-key-id|conexus-receitas|lago\//,
  )
  assert.match(put?.run ?? '', /--key "\$prefix\$version\.json"[\s\S]*--if-none-match '\*'/)
})

test('a imagem responde antes de sair', () => {
  const script =
    awsPlatform.jobs.platform?.steps.find((step) => step.id === 'copy-image')?.run ?? ''
  const order = [
    'docker build --platform linux/amd64 --file apps/extraction/Dockerfile',
    'docker run --rm --entrypoint tap-conexus "$image" --about',
    'docker run --rm --entrypoint meltano "$image" --version',
    'docker push "$image"',
  ].map((line) => script.indexOf(line))
  assert.ok(order[0] !== undefined && order[0] >= 0, String(order))
  assert.deepEqual(
    order,
    order.toSorted((a, b) => a - b),
  )
})

test('a imagem da cópia antes da plataforma', () => {
  const steps = awsPlatform.jobs.platform?.steps ?? []
  const image = steps.findIndex((step) => step.id === 'copy-image')
  const platform = steps.findIndex((step) => step.run?.includes('cdk deploy PlatformStack'))
  assert.ok(image >= 0 && image < platform)
  assert.equal(steps[image]?.env?.REPOSITORY, COPY_REPOSITORY)
  assert.equal(
    steps[platform]?.env?.COPY_IMAGE_DIGEST,
    ['${{', 'steps.copy-image.outputs.digest', '}}'].join(' '),
  )
  assert.match(steps[platform]?.run ?? '', /--parameters "CopyImageDigest=\$COPY_IMAGE_DIGEST"/)
})
