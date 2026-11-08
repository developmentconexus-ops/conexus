import type { AgentDetail, OfferedConnection, ToolSummary } from '@conexus/hub-api'
import { OperationId, ToolApproval } from '@conexus/hub-api'
import { getRouteApi } from '@tanstack/react-router'
import { useId } from 'react'
import { ToggleGroup, ToggleGroupItem } from '../../ui/toggle-group.tsx'
import {
  ASK_FIRST,
  approvalKeyName,
  NO_UNATTENDED,
  ON_ITS_OWN,
  OUT_OF_ROLE,
  WRITES_WORD,
} from './text.ts'
import { Line, versionsOf } from './tool-line.tsx'
import type { Saving } from './use-draft-save.ts'

const company = getRouteApi('/_app/companies/$companyId')

type Chosen = AgentDetail['tools'][number]

/** The key of a chosen write: it asks first, or it runs alone, and only a role that publishes a write that runs alone can set the second (step 24.5, Papéis `D1`). */
function ApprovalKey(props: { tool: Chosen; title: string; saving: Saving }) {
  const { tool, title, saving } = props
  const { may } = company.useRouteContext()
  const note = useId()
  const approval = tool.kind === 'PRESET' ? (tool.approval ?? 'ASK') : 'ASK'
  return (
    <div className="flex flex-col gap-xs">
      <ToggleGroup
        aria-label={approvalKeyName(title)}
        value={[approval]}
        onValueChange={(next) => {
          const chosen = ToolApproval.safeParse(next[0]).data
          if (chosen !== undefined && chosen !== approval)
            saving.save({ approvals: { [tool.id]: chosen } })
        }}
      >
        <ToggleGroupItem value="ASK">{ASK_FIRST}</ToggleGroupItem>
        <ToggleGroupItem
          value="AUTO"
          disabled={!may.publishUnattendedWrite}
          aria-describedby={may.publishUnattendedWrite ? undefined : note}
        >
          {ON_ITS_OWN}
        </ToggleGroupItem>
      </ToggleGroup>
      {!may.publishUnattendedWrite && (
        <span id={note} className="text-fact text-text-2">
          {NO_UNATTENDED}
        </span>
      )}
    </div>
  )
}

/**
 * The writes of a selected connection, last in its group (step 24.5, decision E4): each marked
 * "escreve", none marked until the person marks it, and a marked one shows its key. A write the
 * library does not hold yet is saved with the draft, as a ready read is, and starts at Pergunta antes.
 */
export function WriteLines(props: {
  connection: OfferedConnection
  agent: AgentDetail
  tools: readonly ToolSummary[]
  saving: Saving
}) {
  const { connection, agent, tools, saving } = props
  const at = connection.connectionId
  return connection.writes.map((write) => {
    function same(one: { kind: string; connectionId?: string; operation?: string }) {
      return one.kind === 'PRESET' && one.connectionId === at && one.operation === write.operation
    }
    const chosen = agent.tools.find(same)
    const library = tools.find(same)
    const allowed = write.allowed !== false
    function change(on: boolean) {
      saving.save((now) => {
        if (!on) return { tools: versionsOf(now, new Set(chosen === undefined ? [] : [chosen.id])) }
        if (library !== undefined) return { tools: [...versionsOf(now), library.latest.id] }
        return {
          tools: versionsOf(now),
          ready: [{ connectionId: at, operation: OperationId.parse(write.operation) }],
        }
      })
    }
    return (
      <Line
        key={write.operation}
        id={`write-${at}-${write.operation}`}
        title={write.label}
        tag={WRITES_WORD}
        detail={allowed ? write.summary : OUT_OF_ROLE}
        checked={chosen !== undefined}
        disabled={!allowed && chosen === undefined}
        onChange={change}
        below={
          chosen === undefined ? undefined : (
            <ApprovalKey tool={chosen} title={write.label} saving={saving} />
          )
        }
      />
    )
  })
}
