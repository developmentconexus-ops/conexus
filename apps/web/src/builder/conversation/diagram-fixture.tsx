import '../../brand/tokens.css'
import { createRoot } from 'react-dom/client'
import { applyChosenTheme } from '../../platform/theme.ts'
import { Markdown } from './markdown.tsx'

// A page of answers with a mermaid block, for the browser tests of the drawing (built only by the
// layout harness, never by `npm run build`). `?case=` picks the answer.
const FLOW =
  'flowchart TD\n  A[Pedido] --> B{Estoque?}\n  B -->|sim| C[Separar]\n  B -->|não| D[Comprar]'
const CASES: Record<string, string> = {
  flow: `Veja o fluxo:\n\n\`\`\`mermaid\n${FLOW}\n\`\`\`\n\nPronto.`,
  open: `\`\`\`mermaid\n${FLOW}\n\`\`\``,
  bad: 'Veja:\n\n```mermaid\nflowchart TD\n  A --> \n```\n',
  hostile: [
    'Veja:',
    '',
    '```mermaid',
    'flowchart TD',
    '  A["<img src=x onerror=window.pwned=1>"] --> B["<script>window.pwned=1</script>"]',
    '  B --> C["https://evil.test/a.png"]',
    '  click A call window.pwned()',
    '  style A fill:#fff,stroke:#000,background:url(https://evil.test/b.png)',
    '```',
    '',
  ].join('\n'),
}

applyChosenTheme()
const name = new URLSearchParams(location.search).get('case') ?? 'flow'
const streaming = new URLSearchParams(location.search).has('streaming')
const root = document.getElementById('root')
if (root) createRoot(root).render(<Markdown text={CASES[name] ?? ''} streaming={streaming} />)
