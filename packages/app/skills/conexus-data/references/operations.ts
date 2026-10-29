// In the app: shared/operations.ts
import { defineOperations, defineRoles } from '@conexus/app'
import { z } from 'zod'

// One owner for the statuses: the handlers, the client and the screens all read this list.
export const TICKET_STATUSES = ['open', 'in_progress', 'waiting', 'done'] as const
const Status = z.enum(TICKET_STATUSES)

export const Ticket = z.object({
  id: z.int(),
  subject: z.string(),
  status: Status,
  requesterName: z.string(),
  openedAt: z.string(),
})

const Change = z.object({
  id: z.int(),
  status: Status,
  note: z.string(),
  byName: z.string(),
  at: z.string(),
})

// The app's roles: a name, and the label a person reads in Quem usa o app. An app without roles has none of this.
export const roles = defineRoles({ agent: 'Atendente', manager: 'Gerente' })

// Every operation of an app with roles says who calls it: the roles it names, or 'everyone' with access.
const WORKERS = ['agent', 'manager'] as const
const MANAGERS = ['manager'] as const

export const operations = defineOperations({
  listTickets: {
    roles: WORKERS,
    input: z.object({ status: Status.optional(), search: z.string().max(100).optional() }),
    output: z.array(Ticket).max(500),
  },
  countTickets: {
    roles: WORKERS,
    input: z.object({ search: z.string().max(100).optional() }),
    output: z.array(z.object({ status: Status, total: z.int() })),
  },
  getTicket: {
    roles: WORKERS,
    input: z.object({ id: z.int().min(1) }),
    // A ticket that does not exist is data, not a failure: the field is left out.
    output: z.object({
      ticket: Ticket.extend({ description: z.string(), history: z.array(Change) }).optional(),
    }),
  },
  createTicket: {
    roles: WORKERS,
    input: z.object({
      subject: z.string().min(1).max(200),
      description: z.string().max(2000),
      priority: z.enum(['low', 'normal', 'high']),
    }),
    output: z.object({ id: z.int() }),
  },
  changeTicketStatus: {
    roles: MANAGERS,
    input: z.object({ id: z.int().min(1), status: Status, note: z.string().max(500) }),
    output: z.object({ id: z.int() }),
  },
  ticketSummary: {
    roles: MANAGERS,
    input: z.object({}),
    output: z.object({ open: z.int(), waiting: z.int(), resolvedLastWeek: z.int() }),
  },
  ticketsByWeek: {
    roles: MANAGERS,
    input: z.object({ weeks: z.int().min(1).max(52) }),
    output: z.array(z.object({ week: z.string(), total: z.int() })),
  },
})

export type TicketStatus = z.output<typeof Status>
export type Ticket = z.output<typeof Ticket>
export type TicketDetail = NonNullable<z.output<typeof operations.getTicket.output>['ticket']>
export type NewTicket = z.input<typeof operations.createTicket.input>
export type StatusChange = z.input<typeof operations.changeTicketStatus.input>
