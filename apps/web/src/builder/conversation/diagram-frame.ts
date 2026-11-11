import mermaid from 'mermaid'
import { DrawRequest } from './diagram-messages.ts'

// The drawing frame's script: the only place the diagram library loads. The page frames it as a
// sandbox of an opaque origin under its own policy, and it answers only that page (security S24).

window.addEventListener('message', async (event) => {
  if (event.source !== window.parent) return
  const request = DrawRequest.safeParse(event.data)
  if (!request.success) return
  const { id, code, themeVariables } = request.data
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
