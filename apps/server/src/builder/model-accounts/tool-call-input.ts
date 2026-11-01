import type { CompatRule } from '@mastra/core/processors'

/**
 * A tool call Mastra could not parse is stored with no arguments and replayed with no `input`,
 * which Anthropic refuses (`tool_use.input: Field required`) on every later turn. The outbound
 * prompt sends it as `{}`, as the AI SDK does in its own loop (`ai/dist/index.mjs:4392`); the
 * stored messages stay as they are.
 */
export const toolCallInputRequired: CompatRule = {
  name: 'tool-call-input-required',
  applyToPrompt({ prompt }) {
    let changed = false
    const next = prompt.map((message) => {
      if (message.role !== 'assistant') return message
      const content = message.content.map((part) => {
        if (part.type !== 'tool-call' || (part.input !== undefined && part.input !== null)) {
          return part
        }
        changed = true
        return { ...part, input: {} }
      })
      return { ...message, content }
    })
    return changed ? next : undefined
  },
}
