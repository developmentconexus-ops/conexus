import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'
import { companyEntry, enterWelcome, SignOutButton } from '../../../../../hub/identity/public.ts'
import { WelcomeFrame } from '../../../../../ui/welcome-frame.tsx'

// Each step goes back to the one before it; step 2 has none, as step 1 does not open again.
const BACK = {
  3: '/companies/$companyId/welcome/model-account',
  4: '/companies/$companyId/welcome/team',
} as const

/**
 * The steps' frame around a step that opened, with the step and title from its route (web W33). A
 * step still loading, failed or not found stands alone, as anywhere outside a frame (web W17).
 */
function Steps() {
  const params = Route.useParams()
  const step = useMatches({
    select: (matches) => {
      const leaf = matches.at(-1)
      return leaf?.status === 'success' ? leaf.staticData : undefined
    },
  })
  if (step?.step === undefined || step.place === undefined) return <Outlet />
  const back = step.step === 3 || step.step === 4 ? BACK[step.step] : undefined
  return (
    <WelcomeFrame
      step={step.step}
      title={step.place}
      back={back && { to: back, params }}
      exit={<SignOutButton />}
    >
      <Outlet />
    </WelcomeFrame>
  )
}

// The owner's first entry, outside the company's frame: anyone else goes to Início.
export const Route = createFileRoute('/_app/companies/$companyId_/welcome')({
  ...companyEntry,
  // Inline, so the router types `matches`; the guard returns nothing for the context to carry.
  beforeLoad: async ({ context, params, matches }) => {
    const atStepOne = matches.some(
      (match) => match.routeId === '/_app/companies/$companyId_/welcome/company',
    )
    await enterWelcome({ context, companyId: params.companyId, atStepOne })
  },
  component: Steps,
})
