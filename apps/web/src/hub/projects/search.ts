import { z } from 'zod'

/** The Projeto area's tab and, under Projeto, its section: values of the address (web W18). */
export const Lens = z.enum(['preview', 'code', 'project'])
export const Section = z.enum(['about', 'versions'])

/** How the Prévia shows the app, a value of the address (web W18). */
export const View = z.enum(['computer', 'phone'])
