/** What the Hub says the role may do (`may` of `getCompany`): the roles that build, and the member, who does not. */
export function mayOf(role: string) {
  const builds = role !== 'member'
  const governs = role === 'owner' || role === 'admin'
  return {
    manageAgents: builds,
    manageAutomations: builds,
    manageCopies: builds,
    manageRoles: governs,
    publishUnattendedWrite: governs,
  }
}
