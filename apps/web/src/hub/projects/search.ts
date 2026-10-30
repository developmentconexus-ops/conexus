import { z } from 'zod'

/** The Construir area's tab, a value of the address (web W18). */
export const Lens = z.enum(['preview', 'code'])

/** The part of Sobre the page shows, a value of the address (web W18). */
export const AboutPart = z.enum(['about', 'versions'])

/** How the Prévia shows the app, a value of the address (web W18). */
export const View = z.enum(['computer', 'phone'])
