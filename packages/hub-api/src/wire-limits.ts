/**
 * What the Hub keeps of a tool call or a command's output before it leaves for the screen (card of
 * step 14.2, U2), the base of step 14's limits: a text's start, and a command output's last lines
 * and bytes. `wire.ts` in the server is the only place that cuts.
 */
export const WIRE_LIMITS = { text: 2000, outputLines: 20, outputBytes: 4096 } as const
