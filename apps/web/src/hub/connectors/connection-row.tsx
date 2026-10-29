import type { CompanyId, Connection } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { sentenceOf } from '../../platform/hub.ts'
import { Badge } from '../../ui/badge.tsx'
import { Button } from '../../ui/button.tsx'
import { Row } from '../../ui/list.tsx'
import { sendTest } from './queries.ts'
import { TestResult } from './test-result.tsx'
import {
  linkedText,
  listChanged,
  refusedKeysMemberText,
  refusedKeysText,
  stateBadge,
  testedText,
} from './text.ts'
import { UnlinkDialog } from './unlink-dialog.tsx'

/**
 * A linked connection: who linked it and when, its state in words and, for whoever manages it,
 * Testar and Desligar. What Testar found lives with the row only until the page is read again
 * (the values read never leave the Hub); the state and `testedAt` come from the list.
 */
export function ConnectionRow(props: {
  companyId: CompanyId
  connection: Connection
  name: string
  mayManage: boolean
  onAttempt: () => void
  onSettled: (notice?: string) => void
}) {
  const { companyId, connection, name } = props
  const test = useMutation({
    ...sendTest,
    onError: (error) => {
      if (listChanged(error)) props.onSettled(sentenceOf(error))
    },
  })
  const badge = stateBadge(connection)

  return (
    <Row>
      <div className="flex flex-col gap-sm px-sm py-md">
        <div className="flex flex-wrap items-start justify-between gap-md">
          <div className="flex min-w-0 flex-col gap-xs">
            <span className="flex flex-wrap items-center gap-x-sm gap-y-xs">
              <span className="font-medium">{name}</span>
              {badge && <Badge tone={badge.tone}>{badge.text}</Badge>}
              {connection.testedAt !== null && (
                <span className="text-text-2">{testedText(connection.testedAt)}</span>
              )}
            </span>
            <span className="text-text-2">
              {linkedText(connection)} · conector versão {connection.connectorVersion}
            </span>
          </div>
          {props.mayManage && (
            <div className="flex flex-wrap gap-sm">
              <Button
                size="sm"
                disabled={test.isPending}
                onClick={() => {
                  props.onAttempt()
                  test.mutate({ params: { companyId, connectionId: connection.id } })
                }}
              >
                {test.isPending ? 'Testando…' : 'Testar'}
              </Button>
              <UnlinkDialog
                companyId={companyId}
                connection={connection}
                name={name}
                onAttempt={props.onAttempt}
                onUnlinked={props.onSettled}
              />
            </div>
          )}
        </div>
        {connection.state === 'NEEDS_REAUTH' && (
          <p role="alert" className="text-danger">
            {props.mayManage ? refusedKeysText(name) : refusedKeysMemberText(name)}
          </p>
        )}
        {test.data && <TestResult result={test.data} name={name} />}
        {test.isError && !listChanged(test.error) && (
          <p role="alert" className="text-danger">
            {sentenceOf(test.error)}
          </p>
        )}
      </div>
    </Row>
  )
}
