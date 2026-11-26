import { LakeTableId } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { LakeDetail } from '../../../../hub/copies/public.ts'
import { idOrNotFound } from '../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/companies/$companyId/data/lake/$tableId')({
  staticData: { place: 'Dados' },
  params: {
    parse: (raw) => ({ tableId: idOrNotFound(LakeTableId, raw.tableId) }),
    stringify: (p) => p,
  },
  component: LakeDetail,
})
