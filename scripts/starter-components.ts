// starter-components: regenerates the shadcn components of the app starter (step 14, U3) with the
// shadcn CLI. It needs the network (the CLI reads its registry from ui.shadcn.com and npm): run it
// only to move the pin; the committed files are what the starter ships.
// The files it writes are shipped as the shadcn CLI makes them (biome.json leaves the whole starter out: it is the app's code, not the platform's).
// `node scripts/starter-components.ts`
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { runCommand } from './command.ts'

export const SHADCN_CLI_VERSION = '4.21.0'
export const SHADCN_STYLE = 'base-nova'
// The 30 components of Conexus OS's starter (`scripts/generate-starter-components.mjs:12-17` at
// e0353c36); chart and calendar sit on recharts and react-day-picker, which the starter declares
// (founder, 2026-10-22). The card (U3) asks for "componentes shadcn base-nova".
export const STARTER_COMPONENTS = [
  'button',
  'card',
  'input',
  'label',
  'textarea',
  'select',
  'checkbox',
  'switch',
  'radio-group',
  'field',
  'dialog',
  'alert-dialog',
  'sheet',
  'dropdown-menu',
  'popover',
  'tooltip',
  'tabs',
  'table',
  'badge',
  'skeleton',
  'separator',
  'empty',
  'alert',
  'spinner',
  'pagination',
  'breadcrumb',
  'toast',
  'sidebar',
  'chart',
  'calendar',
] as const

const SRC = resolve(import.meta.dirname, '../packages/app/starter/src')
// The run took 308 s on 2026-10-22 (npx installs the CLI and the libraries chart and calendar need); twice that leaves room for a slow registry.
const DEADLINE_MS = 600_000

const HEADER = `/*
 * shadcn/ui (https://github.com/shadcn-ui/ui), MIT License, Copyright (c) 2023 shadcn.
 * Generated with shadcn ${SHADCN_CLI_VERSION}, style "${SHADCN_STYLE}". The license text is in LICENSE-shadcn-ui.txt.
 */
`

/**
 * The registry's chart writes its colors in a `<style>` element, which the app's policy refuses
 * (decision 0055): they become custom properties on the chart's own container. `light-dark()`
 * follows the page's `color-scheme`, which styles.css sets for both themes.
 */
export function patchedChart(source: string): string {
  const style = source.slice(
    source.indexOf('const ChartStyle ='),
    source.indexOf('const ChartTooltip ='),
  )
  const swaps: [string, string][] = [
    ['  className,\n  children,\n  config,', '  className,\n  style,\n  children,\n  config,'],
    [
      '        data-chart={chartId}\n',
      '        data-chart={chartId}\n        style={{ ...chartColors(config), ...style }}\n',
    ],
    ['        <ChartStyle id={chartId} config={config} />\n', ''],
    [style, CHART_COLORS],
    ['  ChartStyle,\n', ''],
  ]
  return swaps.reduce((text, [from, to]) => {
    if (from === '' || !text.includes(from))
      throw new Error(`chart.tsx changed: ${from.slice(0, 40)}`)
    return text.replace(from, () => to)
  }, source)
}

const CHART_COLORS = `function chartColors(config: ChartConfig): React.CSSProperties {
  const colors: Record<string, string> = {}
  for (const [key, item] of Object.entries(config)) {
    if (item.theme) colors[\`--color-\${key}\`] = \`light-dark(\${item.theme.light}, \${item.theme.dark})\`
    else if (item.color) colors[\`--color-\${key}\`] = item.color
  }
  return colors
}

`

/** The registry imports `cn` as a package, and overlays paint with the raw color `bg-black`; the app takes both from its own files and tokens. */
export function patched(source: string, name = ''): string {
  const own = source
    .replaceAll('from "cn"', 'from "@/lib/utils"')
    .replaceAll('bg-black', 'bg-scrim')
  return `${HEADER}${name === 'chart.tsx' ? patchedChart(own) : own}`
}

function generate(): void {
  const work = mkdtempSync(join(tmpdir(), 'conexus-shadcn-'))
  try {
    mkdirSync(join(work, 'src/lib'), { recursive: true })
    writeFileSync(
      join(work, 'package.json'),
      '{ "name": "shadcn-gen", "private": true, "type": "module" }\n',
    )
    writeFileSync(
      join(work, 'tsconfig.json'),
      '{ "compilerOptions": { "jsx": "react-jsx", "paths": { "@/*": ["./src/*"] } } }\n',
    )
    writeFileSync(join(work, 'src/styles.css'), '@import "tailwindcss";\n')
    const components = {
      $schema: 'https://ui.shadcn.com/schema.json',
      style: SHADCN_STYLE,
      rsc: false,
      tsx: true,
      tailwind: {
        config: '',
        css: 'src/styles.css',
        baseColor: 'neutral',
        cssVariables: true,
        prefix: '',
      },
      iconLibrary: 'lucide',
      aliases: {
        components: '@/components',
        utils: '@/lib/utils',
        ui: '@/components/ui',
        lib: '@/lib',
        hooks: '@/hooks',
      },
    }
    writeFileSync(join(work, 'components.json'), `${JSON.stringify(components, null, 2)}\n`)
    runCommand(
      'npx',
      [
        '--yes',
        `shadcn@${SHADCN_CLI_VERSION}`,
        'add',
        ...STARTER_COMPONENTS,
        '--yes',
        '--cwd',
        work,
      ],
      { cwd: work, deadline: DEADLINE_MS },
    )
    for (const [folder, extension] of [
      ['components/ui', '.tsx'],
      ['hooks', '.ts'],
    ] as const) {
      mkdirSync(join(SRC, folder), { recursive: true })
      for (const name of readdirSync(join(SRC, folder))) {
        if (name.endsWith(extension)) rmSync(join(SRC, folder, name))
      }
      for (const name of readdirSync(join(work, 'src', folder)).sort()) {
        if (!name.endsWith(extension)) continue
        writeFileSync(
          join(SRC, folder, name),
          patched(readFileSync(join(work, 'src', folder, name), 'utf8'), name),
        )
      }
    }
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) generate()
