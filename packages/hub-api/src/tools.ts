/** The tool of each card the person answers, as the controller names the call it parks. */
export const CARD_TOOLS = { question: 'ask_user', plan: 'submit_plan' } as const

/** The controller's tools that keep the task list, which the screen shows as one list and not as calls. */
export const TASK_TOOLS = ['task_write', 'task_update', 'task_complete', 'task_check'] as const

/** The tools that load a skill, which the Builder calls on its own. */
export const SKILL_TOOLS = ['skill', 'skill_read', 'skill_search'] as const
