import { CompanyAccounts, CompanySwitch } from './company-accounts.tsx'
import { MyAccounts } from './my-accounts.tsx'

/**
 * "Contas de modelo": the person's own accounts on top, the company's below them, then the
 * automatic switch between models.
 */
export function ModelAccounts() {
  return (
    <div className="flex flex-col gap-xl">
      <MyAccounts />
      <CompanyAccounts />
      <CompanySwitch />
    </div>
  )
}
