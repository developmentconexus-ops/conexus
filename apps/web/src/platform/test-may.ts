/** What the Hub says the role may do (`may` of `getCompany`): the roles that build, and the member, who does not. */
export function mayOf(role: string) {
  const builds = role !== 'member'
  return { manageAgents: builds, manageAutomations: builds }
}
