import '../../brand/tokens.css'
import { createRoot } from 'react-dom/client'
import { applyChosenTheme } from '../../platform/theme.ts'
import { Bubble, BubbleContent } from '../../ui/bubble.tsx'
import { Markdown } from './markdown.tsx'

// A page of answers with a mermaid block, for the browser tests of the drawing (built only by the
// layout harness, never by `npm run build`). `?case=` picks the answer.
const FLOW =
  'flowchart TD\n  A[Pedido] --> B{Estoque?}\n  B -->|sim| C[Separar]\n  B -->|não| D[Comprar]'
const WIDE =
  'flowchart LR\n  A[Pedido] --> B[Conferir] --> C[Separar] --> D[Embalar] --> E[Enviar] --> F[Entregar] --> G[Cobrar] --> H[Encerrar]'
const CASES: Record<string, string> = {
  wide: `Veja o fluxo:\n\n\`\`\`mermaid\n${WIDE}\n\`\`\`\n`,
  flow: `Veja o fluxo:\n\n\`\`\`mermaid\n${FLOW}\n\`\`\`\n\nPronto.`,
  open: `\`\`\`mermaid\n${FLOW}\n\`\`\``,
  image: [
    'Veja:',
    '',
    '```mermaid',
    'flowchart TD',
    '  A --> C@{ img: "https://evil.test/a.png", label: "fora" }',
    '```',
    '',
  ].join('\n'),
  bad: 'Veja:\n\n```mermaid\nflowchart TD\n  A --> \n```\n',
  hostile: [
    'Veja:',
    '',
    '```mermaid',
    '%%{init: {"themeCSS": "@import url(https://evil.test/x.css); .node rect { fill: url(https://evil.test/b.png) }"}}%%',
    'flowchart TD',
    '  A["<img src=x onerror=window.pwned=1>"] --> B["<script>window.pwned=1</script>"]',
    '  B --> C["fora"]',
    '  click A call pwned()',
    '  click B href "javascript:window.pwned=1"',
    '```',
    '',
  ].join('\n'),
}

applyChosenTheme()
const params = new URLSearchParams(location.search)
const streaming = params.has('streaming')
// The answer sits where the transcript puts it: a ghost bubble in a column.
const answer = (
  <div id="column" className="flex flex-col">
    <Bubble variant="ghost">
      <BubbleContent>
        <Markdown text={CASES[params.get('case') ?? 'flow'] ?? ''} streaming={streaming} />
      </BubbleContent>
    </Bubble>
  </div>
)
const root = document.getElementById('root')
const page = root ? createRoot(root) : undefined
// `?hold` shows the answer only when the test says so, after it has set its routes.
if (params.has('hold')) Object.assign(window, { showAnswer: () => page?.render(answer) })
else page?.render(answer)
