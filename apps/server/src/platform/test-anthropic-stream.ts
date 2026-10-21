import { randomUUID } from 'node:crypto'

/** A search result a text block cites, as the answer after a search cites its pages. */
type Cited = { url: string; title: string }

/**
 * A content block of a streamed answer: thinking, text, which may cite search results, a call of
 * one of the Hub's tools, or the provider's own search with its results (`server_tool_use` and
 * `web_search_tool_result`).
 */
export type Block =
  | { type: 'thinking'; thinking: string }
  | { type: 'text'; text: string; cites?: Cited[] }
  | { type: 'tool_use'; name: string; input: object }
  | { type: 'search'; query: string; results: { url: string; title: string }[] }

/** One block as the Messages API streams it: its start, its deltas, its stop. */
function framesOf(block: Block, index: number): [string, object][] {
  const at = { index }
  function start(content_block: object): [string, object] {
    return ['content_block_start', { type: 'content_block_start', ...at, content_block }]
  }
  function delta(value: object): [string, object] {
    return ['content_block_delta', { type: 'content_block_delta', ...at, delta: value }]
  }
  const stop: [string, object] = ['content_block_stop', { type: 'content_block_stop', ...at }]
  switch (block.type) {
    case 'thinking':
      return [
        start({ type: 'thinking', thinking: '' }),
        delta({ type: 'thinking_delta', thinking: block.thinking }),
        delta({ type: 'signature_delta', signature: 'signature-test' }),
        stop,
      ]
    case 'text': {
      const cites = (block.cites ?? []).map((cited) =>
        delta({
          type: 'citations_delta',
          citation: {
            type: 'web_search_result_location',
            ...cited,
            cited_text: block.text,
            encrypted_index: 'encrypted-test',
          },
        }),
      )
      return [
        start({ type: 'text', text: '', ...(block.cites && { citations: [] }) }),
        ...cites,
        delta({ type: 'text_delta', text: block.text }),
        stop,
      ]
    }
    case 'tool_use': {
      const call = { type: 'tool_use', id: `toolu_${randomUUID()}`, name: block.name, input: {} }
      const input = JSON.stringify(block.input)
      return [start(call), delta({ type: 'input_json_delta', partial_json: input }), stop]
    }
    case 'search':
      return []
    default:
      return block satisfies never
  }
}

/** The provider's search: its call and, as the next block, its results. */
function searchFrames(block: Extract<Block, { type: 'search' }>, index: number) {
  const id = `srvtoolu_${randomUUID()}`
  const call = { type: 'server_tool_use', id, name: 'web_search', input: {} }
  const input = JSON.stringify({ query: block.query })
  const content = block.results.map((result) => ({
    type: 'web_search_result',
    ...result,
    encrypted_content: 'encrypted-test',
    page_age: null,
  }))
  const result = { type: 'web_search_tool_result', tool_use_id: id, content }
  return [
    ['content_block_start', { type: 'content_block_start', index, content_block: call }],
    [
      'content_block_delta',
      {
        type: 'content_block_delta',
        index,
        delta: { type: 'input_json_delta', partial_json: input },
      },
    ],
    ['content_block_stop', { type: 'content_block_stop', index }],
    [
      'content_block_start',
      { type: 'content_block_start', index: index + 1, content_block: result },
    ],
    ['content_block_stop', { type: 'content_block_stop', index: index + 1 }],
  ] satisfies [string, object][]
}

/** A whole answer of `model` as the Messages API streams it: its blocks, then its stop. */
export function events(model: string, blocks: Block[], stop: 'end_turn' | 'tool_use'): string {
  const usage = { input_tokens: 10, output_tokens: 1 }
  const message = { id: 'msg_test', type: 'message', role: 'assistant', model, content: [] }
  let index = 0
  const content = blocks.flatMap((block) => {
    const at = index
    index += block.type === 'search' ? 2 : 1
    return block.type === 'search' ? searchFrames(block, at) : framesOf(block, at)
  })
  const all = [
    ['message_start', { type: 'message_start', message: { ...message, stop_reason: null, usage } }],
    ...content,
    [
      'message_delta',
      { type: 'message_delta', delta: { stop_reason: stop }, usage: { output_tokens: 5 } },
    ],
    ['message_stop', { type: 'message_stop' }],
  ]
  return all.map(([name, data]) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`).join('')
}
