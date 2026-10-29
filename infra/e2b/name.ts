import { MachineTemplate } from '../../apps/server/src/platform/config-machine.ts'

/** The template's name in E2B; every build adds its own tag, so no build replaces another. */
export const TEMPLATE = 'conexus-builder'

/** `conexus-builder:<commit>`: what HUB_E2B_TEMPLATE holds, and the name a rollback goes back to. */
export function templateName(commit: string): MachineTemplate {
  if (!/^[0-9a-f]{7,40}$/.test(commit)) throw new Error(`not a commit: ${commit}`)
  return MachineTemplate.parse(`${TEMPLATE}:${commit}`)
}

/**
 * The last line the build prints, which Publish hands to the deploy: the name the build was asked
 * for, never one put back together from E2B's answer, whose `name` already carries the tag.
 */
export function templateLine(name: MachineTemplate): string {
  return `HUB_E2B_TEMPLATE=${name}`
}
