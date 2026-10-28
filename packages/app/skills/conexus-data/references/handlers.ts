// In the app: server/handlers.ts
import { can, defineHandlers, query, write } from '@conexus/app'
import { z } from 'zod'
import { operations, TICKET_STATUSES, Ticket } from '../shared/operations'

// Applied in order, each once, in one transaction with the version that brings it. Never edit
// one that a sent version carried: add the next.
export const migrations = [
  {
    id: '001_ticket',
    statements: [
      `CREATE TABLE ticket (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        subject text NOT NULL,
        description text NOT NULL,
        priority text NOT NULL,
        status text NOT NULL DEFAULT 'open',
        requester_id text NOT NULL,
        requester_name text NOT NULL,
        opened_at timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE ticket_history (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        ticket_id integer NOT NULL REFERENCES ticket (id),
        status text NOT NULL,
        note text NOT NULL,
        by_id text NOT NULL,
        by_name text NOT NULL,
        at timestamptz NOT NULL DEFAULT now()
      )`,
    ],
  },
]

// A timestamptz may come as a Date or as text; the output says ISO text, which the screens format.
const When = z.coerce.date().transform((date) => date.toISOString())
const Status = z.enum(TICKET_STATUSES)

const TicketRow = Ticket.extend({ openedAt: When })
const DetailRow = TicketRow.extend({ description: z.string() })
const ChangeRow = z.object({
  id: z.int(),
  status: Status,
  note: z.string(),
  byName: z.string(),
  at: When,
})
const Created = z.object({ id: z.int() })

const TICKET_COLUMNS = `id, subject, status, requester_name AS "requesterName", opened_at AS "openedAt"`
// $1 is the search text or null; the same filter feeds the list and its counts.
const MATCHES = `($1::text IS NULL OR subject ILIKE '%' || $1 || '%' OR requester_name ILIKE '%' || $1 || '%')`

// The role locks the operation; this narrows the rows. A manager sees every ticket, an agent only the ones they opened.
function ownerOf(caller: { access: Parameters<typeof can>[0]; personId: string }) {
  return can(caller.access, 'manager') ? null : caller.personId
}

export const handlers = defineHandlers(operations, {
  listTickets({ status, search }, { db, caller }) {
    return query(
      db,
      TicketRow,
      `SELECT ${TICKET_COLUMNS} FROM ticket WHERE ${MATCHES} AND ($2::text IS NULL OR status = $2)
         AND ($3::text IS NULL OR requester_id = $3)
       ORDER BY opened_at DESC LIMIT 500`,
      [search ?? null, status ?? null, ownerOf(caller)],
    )
  },
  countTickets({ search }, { db, caller }) {
    const counted = z.object({ status: Status, total: z.int() })
    // count(*) is a bigint, which arrives as text: cast it to integer in SQL.
    return query(
      db,
      counted,
      `SELECT status, count(*)::int AS total FROM ticket WHERE ${MATCHES} AND ($2::text IS NULL OR requester_id = $2)
       GROUP BY status`,
      [search ?? null, ownerOf(caller)],
    )
  },
  async getTicket({ id }, { db, caller }) {
    const [ticket] = await query(
      db,
      DetailRow,
      `SELECT ${TICKET_COLUMNS}, description FROM ticket
       WHERE id = $1 AND ($2::text IS NULL OR requester_id = $2)`,
      [id, ownerOf(caller)],
    )
    if (ticket === undefined) return {}
    const history = await query(
      db,
      ChangeRow,
      `SELECT id, status, note, by_name AS "byName", at FROM ticket_history
       WHERE ticket_id = $1 ORDER BY at DESC`,
      [id],
    )
    return { ticket: { ...ticket, history } }
  },
  async createTicket({ subject, description, priority }, { db, caller }) {
    // Who opened it comes from `caller`, which the platform sets from the sign-in: never an input.
    const [inserted] = await write(db, [
      {
        text: `INSERT INTO ticket (subject, description, priority, requester_id, requester_name)
               VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        values: [subject, description, priority, caller.personId, caller.personName],
      },
    ])
    return Created.parse(inserted?.[0])
  },
  async changeTicketStatus({ id, status, note }, { db, caller }) {
    // The change and its history row are one write: both are saved or neither is.
    await write(db, [
      { text: 'UPDATE ticket SET status = $2 WHERE id = $1', values: [id, status] },
      {
        text: `INSERT INTO ticket_history (ticket_id, status, note, by_id, by_name)
               VALUES ($1, $2, $3, $4, $5)`,
        values: [id, status, note, caller.personId, caller.personName],
      },
    ])
    return { id }
  },
  async ticketSummary(_input, { db }) {
    const Summary = z.object({ open: z.int(), waiting: z.int(), resolvedLastWeek: z.int() })
    const [summary] = await query(
      db,
      Summary,
      `SELECT count(*) FILTER (WHERE status <> 'done')::int AS open,
              count(*) FILTER (WHERE status = 'waiting')::int AS waiting,
              (SELECT count(*)::int FROM ticket_history
               WHERE status = 'done' AND at > now() - interval '7 days') AS "resolvedLastWeek"
       FROM ticket`,
    )
    return summary ?? { open: 0, waiting: 0, resolvedLastWeek: 0 }
  },
  ticketsByWeek({ weeks }, { db }) {
    const Week = z.object({ week: When, total: z.int() })
    return query(
      db,
      Week,
      `SELECT date_trunc('week', opened_at) AS week, count(*)::int AS total FROM ticket
       WHERE opened_at > now() - make_interval(weeks => $1) GROUP BY 1 ORDER BY 1`,
      [weeks],
    )
  },
})
