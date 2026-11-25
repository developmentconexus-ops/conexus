import { APP_DATA_TOOL, ASSISTANT_TOOL, BUILDER_TOOL, DATA_TOOL } from '@conexus/hub-api'
import type { ControllerKind } from '../../harness/spec/public.ts'

/** The typed reads (`TYPED_READ_NAMES`) as one entry: the model gets them only through `search_tools`. */
const TYPED_READS = 'typed_reads'

export type CompanyToolName =
  | (typeof DATA_TOOL)[keyof typeof DATA_TOOL]
  | (typeof BUILDER_TOOL)['connectorRead' | 'connectorNotes' | 'connectorNoteSave']
  | (typeof APP_DATA_TOOL)[keyof typeof APP_DATA_TOOL]
  | (typeof ASSISTANT_TOOL)['overview']
  | typeof TYPED_READS

/** Who the tools are made for: a conversation's kind, or the Assistant's research helper. */
export type CompanyToolSeat = ControllerKind | 'research'

/** The company's tools each seat gets, in the order its request lists them: the one table of subsets (C26). */
export const TOOLS_OF = {
  assistant: [
    ASSISTANT_TOOL.overview,
    TYPED_READS,
    BUILDER_TOOL.connectorNotes,
    BUILDER_TOOL.connectorNoteSave,
    DATA_TOOL.describe,
    DATA_TOOL.query,
  ],
  research: [BUILDER_TOOL.connectorRead],
  builder: [
    BUILDER_TOOL.connectorRead,
    BUILDER_TOOL.connectorNotes,
    BUILDER_TOOL.connectorNoteSave,
    APP_DATA_TOOL.read,
    APP_DATA_TOOL.check,
    DATA_TOOL.describe,
    DATA_TOOL.query,
  ],
  construtor: [BUILDER_TOOL.connectorRead, BUILDER_TOOL.connectorNotes],
  agents: [BUILDER_TOOL.connectorNotes, APP_DATA_TOOL.read, DATA_TOOL.describe, DATA_TOOL.query],
} as const satisfies Readonly<Record<CompanyToolSeat, readonly CompanyToolName[]>>
