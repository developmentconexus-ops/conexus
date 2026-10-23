import { ChevronRightIcon } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { cn } from '../../ui/cn.ts'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible.tsx'

/** A folder has `children`; a file has none. */
export type TreeNode = { name: string; path: string; children?: TreeNode[] }

/** The pieces of the kit ship their own files; they open only when the person asks. */
const KIT = /(^|\/)components\/ui$/

/** The paths of a version as folders and files, folders first, each level by name. */
export function treeOf(paths: string[]): TreeNode[] {
  const root: TreeNode = { name: '', path: '', children: [] }
  for (const path of paths) {
    let level = root
    const parts = path.split('/')
    for (const [at, name] of parts.entries()) {
      const here = parts.slice(0, at + 1).join('/')
      const last = at === parts.length - 1
      let next = level.children?.find((node) => node.path === here)
      if (next === undefined) {
        next = last ? { name, path: here } : { name, path: here, children: [] }
        level.children?.push(next)
      }
      level = next
    }
  }
  return folderFirst(root.children ?? [])
}

function folderFirst(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .map((node) => (node.children ? { ...node, children: folderFirst(node.children) } : node))
    .sort((a, b) => Number(!!b.children) - Number(!!a.children) || (a.name < b.name ? -1 : 1))
}

/** The first file the person sees: the tree's order, leaving the kit's folder closed. */
export function firstShown(nodes: TreeNode[]): string | undefined {
  for (const node of nodes) {
    if (node.children === undefined) return node.path
    if (KIT.test(node.path)) continue
    const inside = firstShown(node.children)
    if (inside !== undefined) return inside
  }
  return undefined
}

const ROW =
  'flex w-full items-center gap-xs break-all rounded-control px-sm py-xs text-left font-mono text-fact hover:bg-surface-3'

function Nodes(props: { nodes: TreeNode[]; chosen?: string; onChoose: (path: string) => void }) {
  const { nodes, chosen, onChoose } = props
  return nodes.map((node) =>
    node.children === undefined ? (
      <button
        key={node.path}
        type="button"
        role="treeitem"
        aria-selected={node.path === chosen}
        onClick={() => onChoose(node.path)}
        className={cn(ROW, 'pl-lg', node.path === chosen && 'bg-accent-soft text-text')}
      >
        {node.name}
      </button>
    ) : (
      <Collapsible key={node.path} defaultOpen={!KIT.test(node.path)} className="group/folder">
        <CollapsibleTrigger role="treeitem" className={ROW}>
          <ChevronRightIcon
            aria-hidden="true"
            className="size-4 shrink-0 group-data-open/folder:rotate-90"
          />
          {node.name}
        </CollapsibleTrigger>
        <CollapsibleContent
          role="group"
          className="ml-sm flex flex-col gap-xs border-l border-line"
        >
          <Nodes nodes={node.children} chosen={chosen} onChoose={onChoose} />
        </CollapsibleContent>
      </Collapsible>
    ),
  )
}

/** Up and Down walk the rows that show; Right opens a folder and Left closes it (V30). */
function walk(event: KeyboardEvent<HTMLElement>) {
  const rows = [...event.currentTarget.querySelectorAll<HTMLElement>('[role=treeitem]')]
  const row = rows.find((candidate) => candidate === document.activeElement)
  if (row === undefined) return
  const open = row.getAttribute('aria-expanded')
  const step = { ArrowDown: 1, ArrowUp: -1 }[event.key]
  if (step !== undefined) rows[rows.indexOf(row) + step]?.focus()
  else if (
    (event.key === 'ArrowRight' && open === 'false') ||
    (event.key === 'ArrowLeft' && open === 'true')
  )
    row.click()
  else return
  event.preventDefault()
}

export function FileTree(props: {
  nodes: TreeNode[]
  chosen?: string
  onChoose: (path: string) => void
}) {
  return (
    <div
      role="tree"
      aria-label="Arquivos do app"
      onKeyDown={walk}
      className="flex min-w-0 flex-col gap-xs"
    >
      <Nodes {...props} />
    </div>
  )
}
