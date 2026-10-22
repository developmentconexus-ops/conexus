import { z } from 'zod'

// A date travels as `YYYY-MM-DD` text and is a `Date` in the handler or the screen. A codec runs
// both ways, so the output that returns to the network is encoded back (zod `codecs`; the study
// proof `shared/operations.ts:2-5`). Declare a date field as `isoDate` in `shared/operations.ts`.
export const isoDate = z.codec(z.iso.date(), z.date(), {
  decode: (text) => new Date(`${text}T00:00:00Z`),
  encode: (date) => date.toISOString().slice(0, 10),
})
