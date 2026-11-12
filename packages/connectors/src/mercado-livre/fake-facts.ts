import { ITEMS } from './fake-data.ts'
import { CLAIM_REASON, PERIODS, PROMOTION, questionsOf, TOTAL_VISITS } from './fake-routes-more.ts'

/** What the double holds, for a test to check an answer against: computed from the very rows its routes send. */
export const MERCADO_LIVRE_FACTS = {
  /** Every listing of the double is active. */
  activeListings: ITEMS.length,
  unansweredQuestions: questionsOf().filter((each) => each.status === 'UNANSWERED').length,
  openClaims: 1,
  claimReason: CLAIM_REASON,
  /** The newest billing period's amount, and the one the period's details give. */
  lastPeriodAmount: PERIODS.at(-1)?.amount ?? 0,
  periodDetailsAmount: 120.5,
  totalVisits: TOTAL_VISITS,
  promotion: { name: PROMOTION.name, status: PROMOTION.status },
}
