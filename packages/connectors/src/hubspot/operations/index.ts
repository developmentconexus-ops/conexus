import { readsOf } from '../../kernel/definition.ts'
import { contatos } from './contatos.ts'
import { empresas } from './empresas.ts'
import { negocios } from './negocios.ts'

const ready = readsOf({ contatos, empresas, negocios })

/** The ready reads, in order: what the connector declares as its `operations`. */
export const hubspotOperations = Object.values(ready)

/** The subjects and their labels; each has a part of the skill. */
export const hubspotSubjects = {
  contatos: 'Contatos',
  empresas: 'Empresas',
  negocios: 'Negócios',
} as const
