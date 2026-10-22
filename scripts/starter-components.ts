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
// e0353c36) but chart and calendar, which need libraries the starter does not hold (recharts,
// react-day-picker): 28. The card (U3) asks for "componentes shadcn base-nova".
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
] as const

const SRC = resolve(import.meta.dirname, '../packages/app/starter/src')
// The run took 17.8 s on 2026-10-22; seven times that leaves room for a slow registry.
const DEADLINE_MS = 120_000

const HEADER = `/*
 * shadcn/ui (https://github.com/shadcn-ui/ui), MIT License, Copyright (c) 2023 shadcn.
 * Generated with shadcn ${SHADCN_CLI_VERSION}, style "${SHADCN_STYLE}". The license text is in LICENSE-shadcn-ui.txt.
 */
`

/** The registry imports `cn` as a package, and overlays paint with the raw color `bg-black`; the app takes both from its own files and tokens. */
export function patched(source: string): string {
  return `${HEADER}${source.replaceAll('from "cn"', 'from "@/lib/utils"').replaceAll('bg-black', 'bg-scrim')}`
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
          patched(readFileSync(join(work, 'src', folder, name), 'utf8')),
        )
      }
    }
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) generate()
