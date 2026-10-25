import { CompanyId, ProjectId } from '@conexus/hub-api'
import { E2BSandbox } from '@mastra/e2b'
import { ALL_TRAFFIC, Sandbox } from 'e2b'
import type { Config } from '../../platform/config.ts'
import type { Kit, KitFactory, MachineApi } from './kit.ts'
import { ALLOWED_HOSTS, MARK, SandboxId } from './kit.ts'

/** E2B's free plan keeps a machine up an hour at most; it pauses then, and the next start resumes it. */
const TIMEOUT_MS = 60 * 60 * 1000
const CALL_MS = 30_000

type Credentials = Pick<Config, 'e2bApiKey' | 'machineTemplate'>

/** The one adapter to E2B for a machine (code C56): the SDK, and nothing of ours inside it. */
export function createE2bKit(config: Credentials): KitFactory {
  return (options): Kit => {
    const sandbox = new E2BSandbox({
      id: options.id,
      ...(options.sandboxId === undefined
        ? {}
        : { sandboxId: options.sandboxId, reattach: 'required' as const }),
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
      sandboxId: () =>
        sandbox.sandboxId === undefined ? undefined : SandboxId.parse(sandbox.sandboxId),
      closeNetwork: () =>
        sandbox.e2b.updateNetwork({ allowOut: ALLOWED_HOSTS, denyOut: [ALL_TRAFFIC] }),
    }
  }
}

/** Lists and kills by the mark this installation puts on every machine (security S36). */
export function createE2bApi(
  config: Credentials,
  mark: Record<string, string>,
  apiUrl?: string,
): MachineApi {
  const apiKey = config.e2bApiKey.reveal()
  const where = apiUrl === undefined ? {} : { apiUrl }
  return {
    async list() {
      const found: { id: SandboxId; companyId: CompanyId; projectId: ProjectId }[] = []
      const pages = Sandbox.list({
        apiKey,
        ...where,
        query: { metadata: mark },
        requestTimeoutMs: CALL_MS,
      })
      while (pages.hasNext) {
        for (const item of await pages.nextItems()) {
          const project = ProjectId.safeParse(item.metadata[MARK.project])
          const company = CompanyId.safeParse(item.metadata[MARK.company])
          if (!project.success || !company.success) continue
          found.push({
            id: SandboxId.parse(item.sandboxId),
            companyId: company.data,
            projectId: project.data,
          })
        }
      }
      return found
    },
    async kill(id) {
      await Sandbox.kill(id, { apiKey, ...where, requestTimeoutMs: CALL_MS })
    },
  }
}
