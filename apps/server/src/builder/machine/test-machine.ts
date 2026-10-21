import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { LocalSandbox } from '@mastra/core/workspace'
import type { Kit, KitFactory } from './kit.ts'
import { SandboxId } from './kit.ts'

/** What the provider does, for a test to choose: the outcome of a start, and how the start goes. */
export type Control = {
  outcome: 'created' | 'connected'
  start: 'ok' | 'gone' | 'hang' | 'unreachable'
  networkClosed: number
  /** The deadline each machine was asked for. */
  deadlines: Date[]
}

export function newControl(): Control {
  return { outcome: 'created', start: 'ok', networkClosed: 0, deadlines: [] }
}

/** A machine that is a folder of this computer: E2B's start, its outcome and its failures made by hand. */
export function localKit(folder: string, control: Control): KitFactory {
  return (options): Kit => {
    mkdirSync(folder, { recursive: true })
    control.deadlines.push(options.deadline)
    const sandbox = new LocalSandbox({
      workingDirectory: folder,
      onStart: (started) => options.onStart({ ...started, outcome: control.outcome }),
    })
    const start = sandbox.start.bind(sandbox)
    sandbox.start = async (...args) => {
      if (control.start === 'hang') return new Promise<never>(() => undefined)
      if (control.start === 'gone')
        throw Object.assign(new Error('gone'), { code: 'SANDBOX_REATTACH_FAILED' })
      if (control.start === 'unreachable') throw new Error('502 Bad Gateway')
      return start(...args)
    }
    return {
      sandbox,
      transport: {
        write: async (path, bytes) => {
          mkdirSync(dirname(path), { recursive: true })
          writeFileSync(path, bytes)
        },
        read: async (path) => readFileSync(path),
      },
      sandboxId: () => SandboxId.parse('local-machine'),
      closeNetwork: async () => {
        control.networkClosed += 1
      },
    }
  }
}
