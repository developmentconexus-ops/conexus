import type { WireAnswer } from './test-aws.ts'
import { awsRecording } from './test-aws.ts'

/**
 * The state bucket as S3 answers a GET and a PUT of one key (T29): the recorded answers, with the
 * body the double holds for the key, or the recorded missing key.
 */
export function objectAnswer(
  objects: Map<string, string>,
  method: string,
  key: string,
  text: string,
  calls: string[],
): WireAnswer {
  if (!key.includes('/')) return { status: 501, body: '' }
  if (method === 'PUT') {
    calls.push('PutObject')
    objects.set(key, text)
    return awsRecording('put-object')
  }
  if (method !== 'GET') return { status: 501, body: '' }
  calls.push('GetObject')
  const held = objects.get(key)
  return held === undefined
    ? awsRecording('get-object-ausente')
    : { ...awsRecording('get-object'), body: held }
}
