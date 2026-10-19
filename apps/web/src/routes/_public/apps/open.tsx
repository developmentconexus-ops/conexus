import { createFileRoute } from '@tanstack/react-router'
import { AppRefused } from '../../../hub/apps/public.ts'

// The Hub answers this address itself and opens the screens here only when it refuses the pass.
export const Route = createFileRoute('/_public/apps/open')({ component: AppRefused })
