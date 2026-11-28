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
  '/companies/$companyId/copies',
  '/companies/$companyId/copies/$copyId',
  '/companies/$companyId/data',
  '/companies/$companyId/data/$copyId',
  '/companies/$companyId/data/lake/$tableId',
  '/companies/$companyId/data/treated/$name',
  '/companies/$companyId/data/business/$modelId',
  '/companies/$companyId/integrations',
  '/companies/$companyId/integrations/$connectionId',
  '/companies/$companyId/settings',
  '/companies/$companyId/settings/account',
  '/companies/$companyId/settings/my-defaults',
  '/companies/$companyId/settings/general',
  '/companies/$companyId/settings/people',
  '/companies/$companyId/settings/roles',
  '/companies/$companyId/settings/data-reads',
  '/companies/$companyId/settings/model-accounts',
  '/companies/$companyId/settings/observational-memory',
  '/companies/$companyId/settings/network',
  '/companies/$companyId/settings/defaults',
  '/companies/$companyId/welcome',
  '/companies/$companyId/welcome/company',
  '/companies/$companyId/welcome/model-account',
  '/companies/$companyId/welcome/team',
  '/operations',
  '/operations/status',
  '/operations/clients',
  '/operations/clients/new',
  '/operations/clients/$companyId',
  '/invitations/$invitationId',
  '/connection-links/$secret',
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
