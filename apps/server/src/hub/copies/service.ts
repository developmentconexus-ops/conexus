import type {
  CompanyId,
  ConnectionId,
  CopyId,
  CopyProposalId,
  OfProject,
  ProjectId,
} from '@conexus/hub-api'
import type { SqlAnswer } from '../../platform/company-postgres.ts'
import type { Proposal } from '../connectors/public.ts'
import type { Accepting } from './accept.ts'
import { dismissProposal } from './accept.ts'
import type { Enabling } from './enable.ts'
import { enableCopy } from './enable.ts'
import type { OfRelease } from './grants.ts'
import { applyGrants, grantCopy, revokeAllOf, revokeCopy } from './grants.ts'
import {
  copiesOfConnection,
  dropEndedCopies,
  endedSourceless,
  leaveCopies,
  lockedCopiesOf,
} from './leave.ts'
import { listed, models, ofProject, runs } from './list.ts'
import { projectView } from './project-view.ts'
import { propose } from './propose.ts'
import { RUN_DEFAULTS, runCopy } from './run.ts'
import { changeInterval, pauseCopy, resumeCopy, runNow, summaryOf } from './schedule.ts'
import type { CopiesDeps, CopyTuning, InCompany } from './store.ts'

type Of = InCompany & { copyId: CopyId }

/** The copies' acts, each bound to its dependencies; the routes and the Hub's own passes call these. */
export function createCopyService(
  deps: Omit<CopiesDeps, 'tuning'> & { tuning?: CopyTuning | undefined },
) {
  const full: CopiesDeps = { ...deps, tuning: { ...RUN_DEFAULTS, ...deps.tuning } }
  return Object.freeze({
    /** Ligar: the row, the company's table and the clock. */
    enable: (input: Enabling) => enableCopy(full, input),
    /** One run of one copy; the clock's workflow calls it. */
    run: (input: { companyId: CompanyId; copyId: CopyId }, signal: AbortSignal) =>
      runCopy(full, input, signal),
    /** The reads, admitting `readCopies`: the copies, the open proposals and those named. */
    list: (input: InCompany & { named: readonly CopyProposalId[] }) => listed(full, input),
    summaryOf: (input: Of) => summaryOf(full, input),
    models: (input: InCompany) => models(full, input),
    runs: (input: Of & { page: string | undefined }) => runs(full, input),
    ofProject: (input: InCompany & { projectId: ProjectId }) => ofProject(full, input),
    /** What the Builder's turn sees of the company's copies for a Projeto; admits nobody, the turn did. */
    projectView: (input: { companyId: CompanyId; projectId: ProjectId }) =>
      projectView(full, input),
    /** The schedule's acts, admitting `manageCopies`. */
    pause: (input: Of) => pauseCopy(full, input),
    resume: (input: Of) => resumeCopy(full, input),
    changeInterval: (input: Of & Parameters<typeof changeInterval>[1]) =>
      changeInterval(full, input),
    runNow: (input: Of) => runNow(full, input),
    /** Propor (Capacidade 3): the Builder's turn, through the connectors' door; admits nobody, the turn did. */
    propose: (ids: OfProject, a: Proposal) => propose(full, ids, a),
    /** Dispensar a proposal, admitting `manageCopies`. */
    dismiss: (input: Omit<Accepting, 'attemptKey'>) => dismissProposal(full, input),
    /** Liberar and Tirar a copy to a Projeto. */
    grant: (input: OfRelease) => grantCopy(full, input),
    revoke: (input: OfRelease) => revokeCopy(full, input),
    /** Before an app's logins are dropped: every release of the Projeto revoked. */
    revokeAllOf: (input: { companyId: CompanyId; projectId: ProjectId }): Promise<SqlAnswer> =>
      revokeAllOf(full, input),
    /** After an app's logins are made: every release of the Projeto granted again (repair only). */
    applyGrants: (input: { companyId: CompanyId; projectId: ProjectId }): Promise<SqlAnswer> =>
      applyGrants(full, input),
    /** What Desligar asks of the copies, through the connectors' lazy port (O Sync de qualquer conector). */
    ofConnections: Object.freeze({
      copiesOf: (input: InCompany & { connectionId: ConnectionId }) =>
        copiesOfConnection(full, input),
      leave: (input: InCompany & { connectionId: ConnectionId }) => leaveCopies(full, input),
      locked: lockedCopiesOf,
      ended: endedSourceless,
      dropEnded: (input: InCompany) => dropEndedCopies(full, input),
    }),
  })
}
export type CopyService = ReturnType<typeof createCopyService>
