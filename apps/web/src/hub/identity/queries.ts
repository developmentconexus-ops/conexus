import { createSession, deleteSession, getSession, setPassword } from '@conexus/hub-api'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

export const sessionQuery = hubQuery(getSession)
export const signIn = hubMutation(createSession)
export const signOut = hubMutation(deleteSession)
export const choosePassword = hubMutation(setPassword)
