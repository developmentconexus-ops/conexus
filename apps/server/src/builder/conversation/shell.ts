/** A running command's lines are said at most this often; all of them once more when it exits. */
export const SAID_EVERY_MS = 1000

/** When a running command's lines were last said, by its tool call. */
export type ShellSaid = Map<string, number>
