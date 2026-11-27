import { LakeTableName } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { TreatedTablePage } from '../../../../hub/treatment/public.ts'
import { idOrNotFound } from '../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/companies/$companyId/data/treated/$name')({
  staticData: { place: 'Dados' },
  params: {
    parse: (raw) => ({ name: idOrNotFound(LakeTableName, raw.name) }),
    stringify: (p) => p,
  },
  component: TreatedTablePage,
})
