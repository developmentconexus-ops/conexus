import { z } from 'zod'

/**
 * The shape of an id that the Hub's library makes (a company, an invitation, a Projeto, a version
 * of an app), in a file of its own so that every contract shares it without a cycle.
 */
export const LIBRARY_ID = /^[A-Za-z0-9]{32}$/

export const ProjectId = z.string().regex(LIBRARY_ID).brand('ProjectId')
export type ProjectId = z.infer<typeof ProjectId>
