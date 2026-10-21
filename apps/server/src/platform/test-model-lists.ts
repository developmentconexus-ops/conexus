type Lifetime = { after(cleanup: () => Promise<void> | void): void }

/** One read of a provider's model list the Hub made, as the double saw it. */
export type ListRead = { provider: 'anthropic' | 'openai' | 'google'; secret: string }

/**
 * What the fakes of the providers' model lists answer (testing T14): `served` holds, by the
 * credential that asks (an API key or a subscription's access token), the ids it lists; a
 * credential not in it is answered 404, as a provider with no list for it would. `pageSize` makes
 * Anthropic's list come in pages, to follow `has_more`.
 */
export type ModelLists = {
  served: Map<string, string[]>
  pageSize: number | undefined
  reads: ListRead[]
}

const ANTHROPIC = 'https://api.anthropic.com/v1/models'
const OPENAI = 'https://api.openai.com/v1/models'
const GOOGLE = 'https://generativelanguage.googleapis.com/v1beta/models'

/** Whether the address is a provider's model list, which the fakes of the calls leave to this one. */
export function isModelList(url: string): boolean {
  return [ANTHROPIC, OPENAI, GOOGLE].some((list) => url === list || url.startsWith(`${list}?`))
}

function secretOf(headers: Headers): string {
  const bearer = headers.get('authorization')?.replace(/^Bearer /, '')
  return bearer ?? headers.get('x-api-key') ?? headers.get('x-goog-api-key') ?? ''
}

function anthropicPage(ids: string[], url: URL, pageSize: number | undefined): Response {
  const size = pageSize ?? Number(url.searchParams.get('limit') ?? ids.length)
  const after = url.searchParams.get('after_id')
  const start = after === null ? 0 : ids.indexOf(after) + 1
  const page = ids.slice(start, start + size)
  const data = page.map((id) => ({ type: 'model', id, display_name: id }))
  const more = start + size < ids.length
  return Response.json({
    data,
    has_more: more,
    first_id: page[0] ?? null,
    last_id: page.at(-1) ?? null,
  })
}

/**
 * Stands in for the model lists of Anthropic, OpenAI and Google at `fetch` (testing T14), so no
 * test reaches a real provider when it links an account.
 */
export function plantModelLists(t: Lifetime): ModelLists {
  const lists: ModelLists = { served: new Map(), pageSize: undefined, reads: [] }
  const real = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input)
    if (!isModelList(url)) return await real(input, init)
    const address = new URL(url)
    const secret = secretOf(new Headers(init?.headers))
    const provider = address.hostname.includes('anthropic')
      ? 'anthropic'
      : address.hostname.includes('openai')
        ? 'openai'
        : 'google'
    lists.reads.push({ provider, secret })
    const ids = lists.served.get(secret)
    if (ids === undefined) return Response.json({ error: 'not found' }, { status: 404 })
    if (provider === 'anthropic') return anthropicPage(ids, address, lists.pageSize)
    if (provider === 'openai')
      return Response.json({ object: 'list', data: ids.map((id) => ({ id })) })
    return Response.json({ models: ids.map((id) => ({ name: `models/${id}` })) })
  }
  t.after(() => {
    globalThis.fetch = real
  })
  return lists
}
