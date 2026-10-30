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
  '/companies/$companyId/projects/$projectId/conversations/$conversationId',
  '/companies/$companyId/integrations',
  '/companies/$companyId/integrations/$connectionId',
  '/companies/$companyId/settings',
  '/companies/$companyId/settings/account',
  '/companies/$companyId/settings/my-defaults',
  '/companies/$companyId/settings/general',
  '/companies/$companyId/settings/people',
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
