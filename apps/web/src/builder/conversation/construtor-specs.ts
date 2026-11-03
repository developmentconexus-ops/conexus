import { AGENT_TOOL, CONSTRUTOR_TOOL, ProjectReadResult, ToolSearchResult } from '@conexus/hub-api'
import {
  BotIcon,
  BuildingIcon,
  CircleAlertIcon,
  DatabaseIcon,
  FlaskConicalIcon,
  SearchIcon,
  WrenchIcon,
} from 'lucide-react'
import { z } from 'zod'
import { readRefusal } from './connector-specs.ts'
import { automationsText, tablesText, toolsText } from './text.ts'
import { stringArg } from './tool-args.ts'
import type { ConnectorWords, ConstrutorRowTool, Refusal, ToolSpec } from './tool-spec.ts'
import { headOf } from './tool-spec.ts'

const Refused = z.object({ kind: z.literal('REFUSED') })

/** A result the Hub refused (`{ kind: 'REFUSED' }`): the row says its failed sentence, as the Assistant's do. */
function refusedResult(result: unknown): Refusal | undefined {
  return Refused.safeParse(result).success ? 'SAID' : undefined
}

const AppDataFailed = z.object({ kind: z.enum(['REFUSED', 'FAILED']) })

/** `app_data_read` answers `REFUSED` (the query) or `FAILED` (the app's data, out of reach): both read as failed. */
function appDataRefusal(result: unknown): Refusal | undefined {
  return AppDataFailed.safeParse(result).success ? 'SAID' : undefined
}

type Tool = Parameters<NonNullable<ToolSpec['present']>>[0]

/** A row that says, beside its sentence, what the result holds; a failed or running one says only its sentence. */
function withDetail(
  spec: ToolSpec,
  detailOf: (tool: Tool, words: ConnectorWords) => string | undefined,
): ToolSpec {
  return {
    ...spec,
    present: (tool, status, words) => {
      const failed = status === 'error' || status === 'denied'
      const detail = failed || status === 'running' ? undefined : detailOf(tool, words)
      return {
        icon: failed ? CircleAlertIcon : spec.icon,
        sentence: headOf(spec, status),
        detail,
        beside: detail !== undefined,
      }
    },
  }
}

function projectText(tool: Tool, words: ConnectorWords): string | undefined {
  const read = ProjectReadResult.safeParse(tool.result).data
  if (read === undefined) return undefined
  const parts = [
    ...read.offered.map((one) => `${words.name(one.connector)} · ${one.name}`),
    ...(read.app === null ? [] : [tablesText(read.app.tables.length)]),
  ]
  return parts.length === 0 ? undefined : parts.join(', ')
}

function searchText(tool: Tool): string | undefined {
  const found = ToolSearchResult.safeParse(tool.result).data
  if (found === undefined) return undefined
  const tools = toolsText(found.tools.length + found.ready.length)
  return found.automations.length === 0
    ? tools
    : `${tools}, ${automationsText(found.automations.length)}`
}

/** The rows of the Construtor's own tools (step 24.3, U5): the person reads what was done to the agent, never a tool's name. */
export const CONSTRUTOR_SPECS: Record<ConstrutorRowTool, ToolSpec> = {
  [CONSTRUTOR_TOOL.projectRead]: withDetail(
    {
      icon: BuildingIcon,
      running: 'Olhando o Projeto',
      done: 'Olhou o Projeto',
      failed: 'Não conseguiu olhar o Projeto',
      verb: 'olhou o Projeto',
      body: 'generic',
      groups: true,
    },
    projectText,
  ),
  [CONSTRUTOR_TOOL.toolSearch]: withDetail(
    {
      icon: SearchIcon,
      running: 'Procurando ferramentas',
      done: 'Procurou ferramentas',
      failed: 'Não conseguiu procurar ferramentas',
      verb: 'procurou ferramentas',
      body: 'library',
      groups: true,
    },
    searchText,
  ),
  [CONSTRUTOR_TOOL.toolSave]: {
    icon: WrenchIcon,
    running: 'Fazendo a ferramenta',
    done: 'Fez a ferramenta',
    failed: 'Não conseguiu fazer a ferramenta',
    verb: 'fez a ferramenta',
    body: 'generic',
    groups: false,
    refusal: refusedResult,
  },
  [CONSTRUTOR_TOOL.agentRead]: {
    icon: BotIcon,
    running: 'Lendo o rascunho do agente',
    done: 'Leu o rascunho do agente',
    failed: 'Não conseguiu ler o rascunho',
    verb: 'leu o rascunho',
    body: 'generic',
    groups: true,
    refusal: refusedResult,
  },
  [CONSTRUTOR_TOOL.agentDraft]: {
    icon: BotIcon,
    running: 'Montando o rascunho do agente',
    done: 'Montou o rascunho do agente',
    failed: 'Não conseguiu montar o rascunho',
    verb: 'montou o rascunho',
    body: 'agent',
    groups: false,
    refusal: refusedResult,
  },
  [CONSTRUTOR_TOOL.agentSet]: {
    icon: BotIcon,
    running: 'Ajustando o rascunho do agente',
    done: 'Ajustou o rascunho do agente',
    failed: 'Não conseguiu ajustar o rascunho',
    verb: 'ajustou o rascunho',
    body: 'agent',
    groups: false,
    refusal: refusedResult,
  },
  [CONSTRUTOR_TOOL.agentTest]: withDetail(
    {
      icon: FlaskConicalIcon,
      running: 'Testando o agente',
      done: 'Testou o agente',
      failed: 'Não conseguiu testar o agente',
      verb: 'testou',
      body: 'answer',
      groups: true,
      refusal: refusedResult,
    },
    (tool) => stringArg(tool.args, 'question'),
  ),
}

/** The agent's own tools that are not the library's (step 24.3, U3): it reads the data of the app it sits in. */
export const AGENT_SPECS: Record<(typeof AGENT_TOOL)[keyof typeof AGENT_TOOL], ToolSpec> = {
  [AGENT_TOOL.appDataRead]: {
    icon: DatabaseIcon,
    running: 'Consultando os dados do app',
    done: 'Consultou os dados do app',
    failed: 'Não conseguiu consultar os dados do app',
    verb: 'consultou',
    body: 'generic',
    groups: true,
    refusal: appDataRefusal,
  },
}

/** The agent's own tool, named `tool_<slug>` (step 24.3): its row says what it read, by the tool's description, or the slug's words while the description is not known. */
export function slugToolSpec(slug: string, description?: string): ToolSpec {
  const words = description?.trim() || slug.replace(/_+/g, ' ').trim()
  return {
    icon: WrenchIcon,
    running: `Consultando ${words}`,
    done: `Consultou ${words}`,
    failed: `Não conseguiu consultar ${words}`,
    verb: 'consultou',
    body: 'generic',
    groups: true,
    refusal: readRefusal,
  }
}
