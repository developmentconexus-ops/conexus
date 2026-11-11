import { z } from 'zod'

// The two messages between the page and its drawing frame, read once at each end (code C27).

/** What the page asks the frame to draw. */
export const DrawRequest = z.object({
  id: z.number(),
  code: z.string(),
  themeVariables: z.record(z.string(), z.string()),
})

/** The frame's answer to one request: the drawn SVG, or that it could not be drawn. */
export const Reply = z.object({ id: z.number(), ok: z.boolean(), svg: z.string().optional() })
export type Reply = z.infer<typeof Reply>

/** What the frame says: that it is ready, or the answer to one request. */
export const FrameMessage = z.union([z.object({ ready: z.literal(true) }), Reply])
