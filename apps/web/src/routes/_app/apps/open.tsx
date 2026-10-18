import { createAppHandoff } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { OpenApp } from '../../../hub/apps/public.ts'

// A link that does not parse names no app: the screen says so, as it does for an app it refuses.
const Search = z.object({
  host: createAppHandoff.input.body.shape.host.optional().catch(undefined),
  binding: createAppHandoff.input.body.shape.binding.optional().catch(undefined),
})

export const Route = createFileRoute('/_app/apps/open')({
  staticData: { place: 'Abrir app' },
  validateSearch: Search,
  component: OpenApp,
})
