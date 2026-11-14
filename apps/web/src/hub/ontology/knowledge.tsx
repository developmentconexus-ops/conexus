import type { CompanyId, OntologyView } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { sentenceOf } from '../../platform/hub.ts'
import { Badge } from '../../ui/badge.tsx'
import { PageTitle } from '../../ui/list.tsx'
import { ChoiceSelect } from '../../ui/select.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { Concepts } from './concepts.tsx'
import { History } from './history.tsx'
import { ontologyQuery } from './queries.ts'
import { Review } from './review.tsx'
import { HALF_TITLE, KNOWLEDGE_TITLE, TAB_LABEL } from './text.ts'
import { Waiting } from './waiting.tsx'

export const TABS = ['conceitos', 'revisar', 'historico'] as const
export type Tab = (typeof TABS)[number]

function tabLabel(tab: Tab, view: OntologyView): string {
  return tab === 'revisar' && view.toReview > 0
    ? `${TAB_LABEL[tab]} ${view.toReview}`
    : TAB_LABEL[tab]
}

/** The three tabs, in the address (web W18): buttons at 1280 px, a select on a phone. */
function TabBar(props: { tab: Tab; view: OntologyView }) {
  const phone = useIsMobile()
  const navigate = useNavigate()
  function open(next: Tab) {
    void navigate({ to: '.', search: { aba: next } })
  }
  if (phone)
    return (
      <ChoiceSelect
        label="Aba"
        value={props.tab}
        items={TABS.map((tab) => ({ value: tab, label: tabLabel(tab, props.view) }))}
        onValueChange={(next) => {
          const found = TABS.find((tab) => tab === next)
          if (found !== undefined) open(found)
        }}
      />
    )
  return (
    <Tabs
      value={props.tab}
      onValueChange={(next) => open(TABS.find((tab) => tab === next) ?? 'conceitos')}
    >
      <TabsList aria-label="Abas">
        {TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab}>
            {TAB_LABEL[tab]}
            {tab === 'revisar' && props.view.toReview > 0 && <Badge>{props.view.toReview}</Badge>}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

function Content(props: { companyId: CompanyId; tab: Tab; view: OntologyView }) {
  switch (props.tab) {
    case 'conceitos':
      return <Concepts companyId={props.companyId} view={props.view} />
    case 'revisar':
      return <Review companyId={props.companyId} />
    case 'historico':
      return <History companyId={props.companyId} />
    default:
      return props.tab satisfies never
  }
}

/**
 * **Conhecimento** (A Ontologia da empresa, U4), the half "Como a empresa é": Conceitos, Para
 * revisar and Histórico, every member reads it.
 */
export function Knowledge(props: { companyId: CompanyId; tab: Tab }) {
  const read = useQuery(ontologyQuery(props.companyId))
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-lg">
      <PageTitle>{KNOWLEDGE_TITLE}</PageTitle>
      <p className="text-text-2">{HALF_TITLE}</p>
      {read.isPending && <Waiting />}
      {read.isError && (
        <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
      )}
      {read.isSuccess && (
        <>
          <TabBar tab={props.tab} view={read.data} />
          <Content companyId={props.companyId} tab={props.tab} view={read.data} />
        </>
      )}
    </div>
  )
}
