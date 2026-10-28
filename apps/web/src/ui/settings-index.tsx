import type { LinkProps } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { FrameLink } from './frame.tsx'
import { SidebarGroup, SidebarGroupLabel, SidebarInput, SidebarMenu } from './sidebar.tsx'
import { Empty } from './states.tsx'

/** What a section's route declares in `staticData.section` (web W32). */
export type SectionMeta = {
  group: 'you' | 'company'
  label: string
  icon: LucideIcon
  /** One sentence under the page's title: what the section is for. */
  summary: string
  order: number
  keywords?: readonly string[]
}

export type SettingsSection = Pick<LinkProps, 'to' | 'params'> & SectionMeta

/** Lower case without accents, so "convite" finds "Convites" and "aparencia" finds "Aparência". */
function folded(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/**
 * The index of Configurações in place of the sidebar (web W32): a search over the sections' names
 * and keywords, and two groups, Você and the company named `groupName`. The sections come in the
 * order given.
 */
export function SettingsIndex(props: { sections: readonly SettingsSection[]; groupName: string }) {
  const [query, setQuery] = useState('')
  const wanted = folded(query.trim())
  const found = props.sections.filter((section) =>
    [section.label, ...(section.keywords ?? [])].some((word) => folded(word).includes(wanted)),
  )
  const groups = [
    { group: 'you', name: 'Você' },
    { group: 'company', name: props.groupName },
  ] as const
  return (
    <>
      <div className="relative px-sm group-data-[collapsible=icon]:hidden">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-md size-4 -translate-y-1/2 text-text-2"
        />
        <SidebarInput
          type="search"
          aria-label="Buscar nas configurações"
          placeholder="Buscar nas configurações"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-[2rem]"
        />
      </div>
      {found.length === 0 && (
        <div className="px-md py-sm">
          <Empty>Nenhuma seção encontrada.</Empty>
        </div>
      )}
      {groups.map(({ group, name }) => {
        const shown = found.filter((section) => section.group === group)
        if (shown.length === 0) return null
        return (
          <SidebarGroup key={group}>
            <SidebarGroupLabel title={name} className="block truncate leading-8">
              {name}
            </SidebarGroupLabel>
            <SidebarMenu>
              {shown.map((section) => (
                <FrameLink
                  key={section.label}
                  to={section.to}
                  params={section.params}
                  label={section.label}
                  icon={section.icon}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )
      })}
    </>
  )
}
