import type { RequestContext } from '@mastra/core/request-context'

/**
 * What differs between the agents' conversation machines: the one parameter of
 * `createConversationMachines`, which each agent states beside the kit's own deps.
 */
export type MachineSpec = {
  /** The hosts the machine may reach, the user's decision (the Assistant's: 0059). */
  hosts: readonly string[]
  /**
   * What a machine made from another template meets: `'replace'` kills it and makes a new one (the
   * Builder's, whose tools the template carries); `'resume'` wakes it by its id with its files.
   */
  otherTemplate: 'resume' | 'replace'
  /** The media types `read_file` hands the model as media; absent, Mastra's default (a PDF included). */
  readMedia?: readonly string[]
  /**
   * The marks of the conversation's company and place, which its machine carries (security S36);
   * undefined outside a conversation the user serves, which gets no machine.
   */
  marks(requestContext: RequestContext): Promise<Record<string, string> | undefined>
}
