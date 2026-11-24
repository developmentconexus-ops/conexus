import type { AutomationSummary } from '@conexus/hub-api'

/** The names of the connections an automation reads, in the order its place offers them. */
export function readNames(automation: Pick<AutomationSummary, 'connections'>): string {
  return automation.connections
    .filter((each) => each.chosen)
    .map((each) => each.name)
    .join(', ')
}
