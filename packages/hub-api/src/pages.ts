/**
 * The addresses the screens' router answers, as the router writes them: `$name` is a parameter.
 * The Hub opens the screens' page on each, and a web test holds the router to this list, so a new
 * screen cannot open with 404 (web W1).
 */
export const PAGES = [
  '/',
  '/login',
  '/set-password',
  '/forgot-password',
  '/companies/$companyId',
  '/companies/$companyId/projects',
  '/companies/$companyId/projects/$projectId',
  '/companies/$companyId/projects/$projectId/about',
  '/companies/$companyId/projects/$projectId/access',
  '/companies/$companyId/projects/$projectId/integrations',
  '/companies/$companyId/projects/$projectId/data',
  '/companies/$companyId/projects/$projectId/data/$table',
  '/companies/$companyId/projects/$projectId/data/copies/$table',
  '/companies/$companyId/projects/$projectId/conversations/$conversationId',
  '/companies/$companyId/projects/$projectId/assistant',
  '/companies/$companyId/projects/$projectId/assistant/$conversationId',
  '/companies/$companyId/projects/$projectId/automations',
  '/companies/$companyId/projects/$projectId/automations/$automationId',
  '/companies/$companyId/projects/$projectId/agents',
  '/companies/$companyId/projects/$projectId/agents/tools',
  '/companies/$companyId/projects/$projectId/agents/tools/$toolId',
  '/companies/$companyId/projects/$projectId/agents/$agentId',
  '/companies/$companyId/projects/$projectId/agents/$agentId/$conversationId',
  '/companies/$companyId/projects/$projectId/agents/construtor/$conversationId',
  '/companies/$companyId/conversations/$conversationId',
  '/companies/$companyId/agents',
  '/companies/$companyId/copies',
  '/companies/$companyId/copies/$copyId',
  '/companies/$companyId/automations',
  '/companies/$companyId/automations/$automationId',
  '/companies/$companyId/integrations',
  '/companies/$companyId/integrations/$connectionId',
  '/companies/$companyId/settings',
  '/companies/$companyId/settings/account',
  '/companies/$companyId/settings/my-defaults',
  '/companies/$companyId/settings/general',
  '/companies/$companyId/settings/people',
  '/companies/$companyId/settings/roles',
  '/companies/$companyId/settings/model-accounts',
  '/companies/$companyId/settings/observational-memory',
  '/companies/$companyId/settings/defaults',
  '/companies/$companyId/welcome',
  '/companies/$companyId/welcome/company',
  '/companies/$companyId/welcome/model-account',
  '/companies/$companyId/welcome/team',
  '/companies/$companyId/welcome/build',
  '/operations',
  '/operations/status',
  '/operations/clients',
  '/operations/clients/new',
  '/operations/clients/$companyId',
  '/invitations/$invitationId',
  '/integrations/return',
] as const

/** Where a provider sends the person back after an OAuth authorization: the Hub's redirect address is its public origin plus this (C26). */
export const REDIRECT_PATH = '/integrations/return'

/**
 * The drawing frame of the conversation: the one page the Hub frames from its own origin. It runs
 * the diagram library in a sandbox of an opaque origin, under its own policy, so the Hub's page
 * keeps `style-src 'self'`; the page hears the drawn picture from it as a message (security S24).
 */
export const DIAGRAM_FRAME = {
  path: '/diagram-frame.html',
  policy:
    "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src data:; frame-ancestors 'self'; base-uri 'none'; form-action 'none'",
} as const
