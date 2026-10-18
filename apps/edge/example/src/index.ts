import type { AppProps } from '@conexus/app-contract'

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escaped(text: string): string {
  return text.replaceAll(/[&<>"']/g, (character) => ESCAPES[character] ?? character)
}

/** The example app: it greets the person the platform names in `props`, and runs no script. */
export default {
  fetch(_request: Request, _env: unknown, ctx: { props: AppProps }) {
    const { personName, projectName } = ctx.props.caller
    const html = [
      '<!doctype html>',
      '<html lang="pt-BR">',
      '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
      `<title>${escaped(projectName)}</title></head>`,
      `<body><p>Olá, ${escaped(personName)}. Este é o app do Projeto ${escaped(projectName)}.</p></body>`,
      '</html>',
    ].join('\n')
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  },
} satisfies ExportedHandler<unknown, unknown, unknown, AppProps>
