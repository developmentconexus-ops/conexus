import { AGENT_TOOL, APP_DATA_TOOL, RowCount } from '@conexus/hub-api'
import { ClipboardCheckIcon } from 'lucide-react'
import { z } from 'zod'
import { AGENT_SPECS, withDetail } from './construtor-specs.ts'
import { checkedRowsText } from './text.ts'
import type { Refusal, ToolSpec } from './tool-spec.ts'

/** What `app_data_check` answers when the read was counted. */
const Counted = z.object({ kind: z.literal('COUNTED'), rows: RowCount })
const Failed = z.object({ kind: z.enum(['REFUSED', 'FAILED']) })

/** A check the database refused, or that was not a count or could not run: the row says it failed. */
function checkRefusal(result: unknown): Refusal | undefined {
  return Failed.safeParse(result).success ? 'SAID' : undefined
}

/**
 * The rows of the tools that read the Projeto's app data: `app_data_read` is the agents' own row
 * (one name, one row), and `app_data_check` says how many rows the checked read gave.
 */
export const APP_DATA_SPECS: Record<(typeof APP_DATA_TOOL)[keyof typeof APP_DATA_TOOL], ToolSpec> =
  {
    [APP_DATA_TOOL.read]: AGENT_SPECS[AGENT_TOOL.appDataRead],
    [APP_DATA_TOOL.check]: withDetail(
      {
        icon: ClipboardCheckIcon,
        running: 'Conferindo uma leitura do app',
        done: 'Conferiu uma leitura do app',
        failed: 'Não conseguiu conferir a leitura',
        verb: 'conferiu leitura',
        body: 'generic',
        groups: true,
        refusal: checkRefusal,
      },
      (tool) => {
        const counted = Counted.safeParse(tool.result)
        return counted.success && counted.data.rows.kind !== 'UNKNOWN'
          ? checkedRowsText(counted.data.rows)
          : undefined
      },
    ),
  }
