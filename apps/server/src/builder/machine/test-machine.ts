import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { LocalSandbox } from '@mastra/core/workspace'
import type { Kit, KitFactory } from './kit.ts'
import { SandboxId } from './kit.ts'

/** What the provider does, for a test to choose: the outcome of a start, and how the start goes. */
export type Control = {
  outcome: 'created' | 'connected'
  start: 'ok' | 'gone' | 'hang' | 'unreachable'
  /** Whether the provider still holds the recorded machine. */
  exists: boolean
  networkClosed: number
  /** How long the machine takes to come up after it says it runs, as E2B's start does. */
  upMs: number
  /** Starts the latest machine again as the provider does after it died: its `onStart` runs once more. */
  restart: () => Promise<void>
  /** The ids the machines asked the provider to reattach. */
  reattached: (string | undefined)[]
  /** The deadline each machine was asked for. */
  deadlines: Date[]
  /** How many times a machine was paused. */
  stops: number
  /** The provider killed the machine: pausing it fails as E2B's does, until a start makes a new one. */
  killed: boolean
}

export function newControl(): Control {
  return {
    outcome: 'created',
    start: 'ok',
    exists: true,
    networkClosed: 0,
    upMs: 0,
    restart: async () => undefined,
    reattached: [],
    deadlines: [],
    stops: 0,
    killed: false,
  }
}

/** A machine that is a folder of this computer: E2B's start, its outcome and its failures made by hand. */
export function localKit(folder: string, control: Control): KitFactory {
  return (options): Kit => {
    mkdirSync(folder, { recursive: true })
    control.deadlines.push(options.deadline)
    control.reattached.push(options.sandboxId)
    const sandbox = new LocalSandbox({
      workingDirectory: folder,
      onStart: async (started) => {
        await new Promise((up) => setTimeout(up, control.upMs))
        await options.onStart({ ...started, outcome: control.outcome })
      },
    })
    control.restart = () => Promise.resolve(options.onStart({ sandbox, outcome: control.outcome }))
    const start = sandbox.start.bind(sandbox)
    sandbox.start = async (...args) => {
      if (control.start === 'hang') return new Promise<never>(() => undefined)
      if (control.start === 'gone')
        throw Object.assign(new Error('gone'), { code: 'SANDBOX_REATTACH_FAILED' })
      if (control.start === 'unreachable') throw new Error('502 Bad Gateway')
      control.killed = false
      return start(...args)
    }
    const stop = sandbox.stop.bind(sandbox)
    sandbox.stop = async () => {
      if (control.killed) throw new Error('Sandbox local-machine not found')
      control.stops += 1
      return stop()
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
