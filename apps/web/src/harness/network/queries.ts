import type { CompanyId } from '@conexus/hub-api'
import {
  addNetworkDomain,
  closeAllNetwork,
  listNetworkDomains,
  openAllNetwork,
  readOpenAllNetwork,
  removeNetworkDomain,
} from '@conexus/hub-api'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

export function networkDomainsQuery(companyId: CompanyId) {
  return hubQuery(listNetworkDomains, { params: { companyId } })
}

export function openAllNetworkQuery(companyId: CompanyId) {
  return hubQuery(readOpenAllNetwork, { params: { companyId } })
}

export const addNetworkDomainMutation = hubMutation(addNetworkDomain)
export const removeNetworkDomainMutation = hubMutation(removeNetworkDomain)
export const openAllNetworkMutation = hubMutation(openAllNetwork)
export const closeAllNetworkMutation = hubMutation(closeAllNetwork)
