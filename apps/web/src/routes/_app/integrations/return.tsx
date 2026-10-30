import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { SignInReturn } from '../../../hub/connectors/public.ts'

// What the provider appends to the redirect address; anything else in it is ignored, and the page
// takes all of it out of the address before it calls the Hub.
const Search = z.object({
  code: z.string().optional().catch(undefined),
  state: z.string().optional().catch(undefined),
  error: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/_app/integrations/return')({
  staticData: { place: 'Integrações' },
  validateSearch: Search,
  component: SignInReturn,
})
