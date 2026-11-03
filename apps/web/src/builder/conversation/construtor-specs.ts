import { CONSTRUTOR_TOOL } from '@conexus/hub-api'
import { BotIcon, BuildingIcon, FlaskConicalIcon } from 'lucide-react'
import type { ConstrutorRowTool, ToolSpec } from './tool-spec.ts'

/** The rows of the Construtor's own tools (step 24.3, U5): the person reads what was done to the agent, never a tool's name. */
export const CONSTRUTOR_SPECS: Record<ConstrutorRowTool, ToolSpec> = {
  [CONSTRUTOR_TOOL.projectRead]: {
    icon: BuildingIcon,
    running: 'Olhando o Projeto',
    done: 'Olhou o Projeto',
    failed: 'Não conseguiu olhar o Projeto',
    verb: 'olhou o Projeto',
    body: 'generic',
    groups: true,
  },
  [CONSTRUTOR_TOOL.agentDraft]: {
    icon: BotIcon,
    running: 'Montando o rascunho do agente',
    done: 'Montou o rascunho do agente',
    failed: 'Não conseguiu montar o rascunho',
    verb: 'montou o rascunho',
    body: 'agent',
    groups: false,
  },
  [CONSTRUTOR_TOOL.agentSet]: {
    icon: BotIcon,
    running: 'Ajustando o rascunho do agente',
    done: 'Ajustou o rascunho do agente',
    failed: 'Não conseguiu ajustar o rascunho',
    verb: 'ajustou o rascunho',
    body: 'agent',
    groups: false,
  },
  [CONSTRUTOR_TOOL.agentTest]: {
    icon: FlaskConicalIcon,
    running: 'Testando o agente',
    done: 'Testou o agente',
    failed: 'Não conseguiu testar o agente',
    verb: 'testou',
    body: 'generic',
    groups: true,
  },
}
