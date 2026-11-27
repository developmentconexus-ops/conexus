import { TreatmentModelId } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { BusinessModelPage } from '../../../../hub/treatment/public.ts'
import { idOrNotFound } from '../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/companies/$companyId/data/business/$modelId')({
  staticData: { place: 'Dados' },
  params: {
    parse: (raw) => ({ modelId: idOrNotFound(TreatmentModelId, raw.modelId) }),
    stringify: (p) => p,
  },
  component: BusinessModelPage,
})
