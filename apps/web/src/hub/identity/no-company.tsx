import { Column } from '../../ui/frame.tsx'
import { PageTitle } from '../../ui/list.tsx'
import { SignOutButton } from './sign-out-button.tsx'

/** "/" for a person in no company the Hub lets them open, who does not operate the Central. */
export function NoCompany() {
  return (
    <Column>
      <PageTitle className="text-center">Você ainda não está em nenhuma empresa.</PageTitle>
      <SignOutButton />
    </Column>
  )
}
