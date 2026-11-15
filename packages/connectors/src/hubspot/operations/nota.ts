import { z } from 'zod'
import type { Answered, ProviderAnswer } from '../../kernel/operation.ts'
import { defineOperation, post, shapeOf } from '../../kernel/operation.ts'
import { failureOf } from './shared.ts'

/** HubSpot keeps a note's text to 65,536 characters; the Hub checks it again with the mark added, so the mark's room is the person's to leave. */
const BODY_MAX = 65_536

const NotaInput = z.object({
  contactId: z.string().regex(/^[0-9]{1,20}$/),
  body: z.string().min(1).max(BODY_MAX),
})

/** The id of the note HubSpot created, the one thing a log may print. */
const Created = z.looseObject({ id: z.string().min(1) }).transform(({ id }) => ({ id }))

/** The association type of a note to a contact, HubSpot's own (create-note.ts of the shelf). */
const NOTE_TO_CONTACT = 202

/**
 * A note's create: a status outside 2xx is read as a read's is. Only a 2xx with the created `id` is
 * a success; any other 2xx is unreadable, since the note may exist.
 */
function answer(answer: ProviderAnswer): Answered<z.infer<typeof Created>> {
  const failure = failureOf(answer)
  if (failure) return failure
  const created = Created.safeParse(answer.body)
  return created.success
    ? { kind: 'OK', value: created.data }
    : {
        kind: 'UNREADABLE',
        native: {
          status: answer.status,
          code: null,
          message: null,
          body: null,
          reason: shapeOf(created.error, answer.body),
        },
      }
}

export const notaNoContato = defineOperation({
  id: 'notaNoContato',
  class: 'write' as const,
  subject: 'contatos',
  idempotent: false,
  summary:
    'Cria uma nota no contato do HubSpot: o id do contato (leia em `contatos`) e o texto da nota, até 65.536 caracteres contando a marca do Conexus (17), que entra no fim. Devolve o id da nota.',
  label: 'Nota no contato',
  input: NotaInput,
  output: Created,
  probe: () => ({ contactId: '1', body: 'Nota de teste.' }),
  request: (input, _account, at) =>
    post('/crm/v3/objects/notes', {
      properties: { hs_note_body: input.body, hs_timestamp: at.toISOString() },
      associations: [
        {
          to: { id: input.contactId },
          types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: NOTE_TO_CONTACT }],
        },
      ],
    }),
  answer,
  // A refusal of HubSpot always says the note was not taken; a cut or a 5xx is uncertain before the kit is asked (wrote.ts).
  uncertain: () => false,
  mark: (input, mark) => ({ ...input, body: `${input.body} ${mark}` }),
  idOf: (value) => value.id,
})
