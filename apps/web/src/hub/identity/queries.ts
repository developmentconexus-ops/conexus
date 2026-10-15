import { createSession, deleteSession, getSession, setPassword } from '@conexus/hub-api'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

/** Who is signed in on this browser; `null` when nobody is. */
export const sessionQuery = hubQuery(getSession, { SESSION_REQUIRED: null })
export const signIn = hubMutation(createSession)
export const signOut = hubMutation(deleteSession)
export const choosePassword = hubMutation(setPassword)
