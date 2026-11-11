import mermaid from 'mermaid'

// The drawing frame's script: the only place the diagram library loads. The page frames it as a
// sandbox of an opaque origin under its own policy, and it answers only that page (security S24).
// The page's request is read by hand, not with Zod: Zod in this entry shares a chunk with the
// page's, and the chunk of the page's Zod switch (`jitless.ts`) and the shared one then import each
// other, which breaks every screen (the e2e run of this change).

type Request = { id: number; code: string; themeVariables: Record<string, string> }

function isColors(value: unknown): value is Record<string, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((each) => typeof each === 'string')
  )
}

/** The message as the page sends it, or nothing when it is any other message. */
function requestOf(data: unknown): Request | undefined {
  if (typeof data !== 'object' || data === null) return undefined
  const { id, code, themeVariables } = Object(data)
  if (typeof id !== 'number' || typeof code !== 'string' || !isColors(themeVariables)) {
    return undefined
  }
  return { id, code, themeVariables }
}

window.addEventListener('message', async (event) => {
  if (event.source !== window.parent) return
  const request = requestOf(event.data)
  if (request === undefined) return
  const { id, code, themeVariables } = request
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    themeVariables,
    // The picture has no page fonts, so the measure and the drawing use the same generic family.
    fontFamily: 'sans-serif',
    htmlLabels: false,
    // A drawing that fails leaves no error picture or wrapper in the frame (the library's own cleanup).
    suppressErrorRendering: true,
  })
  try {
    await mermaid.parse(code)
    const { svg } = await mermaid.render(`d${id}`, code)
    window.parent.postMessage({ id, ok: true, svg }, '*')
  } catch {
    // A syntax error is the model's text, which the page shows as code (card, state NOT_DRAWN).
    window.parent.postMessage({ id, ok: false }, '*')
  }
})

window.parent.postMessage({ ready: true }, '*')
