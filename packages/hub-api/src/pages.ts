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
  '/companies/$companyId/setup',
  '/companies/$companyId/projects',
  '/companies/$companyId/projects/$projectId',
  '/companies/$companyId/projects/$projectId/settings',
  '/companies/$companyId/people',
  '/companies/$companyId/model-account',
  '/operations/clients',
  '/operations/clients/new',
  '/operations/clients/$companyId',
  '/invitations/$invitationId',
] as const
