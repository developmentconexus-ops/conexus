import { E2BSandbox } from '@mastra/e2b'
import { ALL_TRAFFIC, Sandbox } from 'e2b'
import type { Config } from '../../platform/config.ts'
import type { Kit, KitFactory, MachineApi } from './kit.ts'
import { ALLOWED_HOSTS, MARK } from './kit.ts'

/** E2B's free plan keeps a machine up an hour at most; it pauses then, and the next start resumes it. */
const TIMEOUT_MS = 60 * 60 * 1000
const CALL_MS = 30_000

type Credentials = Pick<Config, 'e2bApiKey' | 'machineTemplate'>

/** The one adapter to E2B for a machine (code C56): the SDK, and nothing of ours inside it. */
export function createE2bKit(config: Credentials): KitFactory {
  return (options): Kit => {
    const sandbox = new E2BSandbox({
      id: options.id,
      template: config.machineTemplate,
      apiKey: config.e2bApiKey.reveal(),
      timeout: TIMEOUT_MS,
      lifecycle: { onTimeout: 'pause' },
      network: { allowOut: ALLOWED_HOSTS, denyOut: [ALL_TRAFFIC] },
      metadata: options.metadata,
      onStart: options.onStart,
      workingDirectory: options.workingDirectory,
      instructions: options.instructions,
    })
    return {
      sandbox,
      transport: {
        write: (path, bytes) => sandbox.writeFiles([{ path, content: Buffer.from(bytes) }]),
        read: (path) => sandbox.e2b.files.read(path, { format: 'stream' }),
      },
      closeNetwork: () =>
        sandbox.e2b.updateNetwork({ allowOut: ALLOWED_HOSTS, denyOut: [ALL_TRAFFIC] }),
    }
  }
}

/**
 * Kills by the mark this installation puts on every machine and the conversation's id (security
 * S36): every machine listed, running or paused, for a failed find can have made a second one of
 * the same name. Never the sandbox's own `destroy()`, which swallows a failed list and kills one.
 */
export function createE2bApi(
  config: Credentials,
  mark: Record<string, string>,
  apiUrl?: string,
): MachineApi {
  const apiKey = config.e2bApiKey.reveal()
  const where = { apiKey, ...(apiUrl === undefined ? {} : { apiUrl }), requestTimeoutMs: CALL_MS }
  return {
    async kill(conversationId) {
      let killed = 0
      const pages = Sandbox.list({
        ...where,
        query: { metadata: { ...mark, [MARK.conversation]: conversationId } },
      })
      while (pages.hasNext) {
        for (const item of await pages.nextItems()) {
          if (await Sandbox.kill(item.sandboxId, where)) killed += 1
        }
      }
      return killed
    },
  }
}
