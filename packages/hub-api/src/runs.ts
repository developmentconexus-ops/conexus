import { z } from 'zod'

/** One Builder turn that may write files; the Git takes its candidate under this id. */
export const RunId = z.uuid().brand('RunId')
export type RunId = z.infer<typeof RunId>
