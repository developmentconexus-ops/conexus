import { getStatus } from '@conexus/hub-api'
import { hubQuery } from '../../platform/hub.ts'

export const statusQuery = hubQuery(getStatus)
