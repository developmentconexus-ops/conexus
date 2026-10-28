import type { CompanyId } from '@conexus/hub-api'
import {
  assignModelAccount,
  changeModelAccount,
  clearMyModelDefault,
  completeModelAccountSignIn,
  connectModelAccount,
  getAccountKinds,
  listModelAccounts,
  listModelProviders,
  orderModelAccounts,
  removeModelAccount,
  setAccountKinds,
  setDefaultModel,
  setModelFallback,
  setMyModelDefault,
  startModelAccountSignIn,
} from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

export function accountsQuery(companyId: CompanyId) {
  return hubQuery(listModelAccounts, { params: { companyId } })
}
export const providersQuery = hubQuery(listModelProviders)

/** What the pages of the defaults read: the company's accounts view and every provider's models. */
export function useAccountsView(companyId: CompanyId) {
  const accounts = useSuspenseQuery(accountsQuery(companyId)).data
  const { providers } = useSuspenseQuery(providersQuery).data
  return { ...accounts, providers }
}
export function kindsQuery(companyId: CompanyId) {
  return hubQuery(getAccountKinds, { params: { companyId } })
}

export const sendConnection = hubMutation(connectModelAccount)
export const sendChange = hubMutation(changeModelAccount)
export const sendAssignees = hubMutation(assignModelAccount)
export const sendDefaultModel = hubMutation(setDefaultModel)
export const sendMyDefault = hubMutation(setMyModelDefault)
export const sendMyDefaultCleared = hubMutation(clearMyModelDefault)
export const sendFallback = hubMutation(setModelFallback)
export const sendOrder = hubMutation(orderModelAccounts)
export const sendRemoval = hubMutation(removeModelAccount)
export const sendKinds = hubMutation(setAccountKinds)
export const sendSignInStart = hubMutation(startModelAccountSignIn)
export const sendSignInCompletion = hubMutation(completeModelAccountSignIn)
