import { useSuspenseQuery } from '@tanstack/react-query'
import { Column } from '../../ui/frame.tsx'
import { List, PageTitle, Row, rowBody } from '../../ui/list.tsx'
import { myAppsQuery } from './queries.ts'
import { SignOutButton } from './sign-out-button.tsx'

/**
 * "/" for a person in no company the Hub lets them open, who does not operate the Central: the apps
 * they use, if any (step 18, F1), else the plain statement.
 */
export function NoCompany() {
  const { apps } = useSuspenseQuery(myAppsQuery).data
  return (
    <Column>
      {apps.length === 0 ? (
        <PageTitle className="text-center">Você ainda não está em nenhuma empresa.</PageTitle>
      ) : (
        <>
          <PageTitle className="text-center">Seus apps</PageTitle>
          <div className="w-full">
            <List>
              {apps.map((app) => (
                <Row key={app.address}>
                  <a href={`https://${app.address}/`} className={rowBody({ kind: 'link' })}>
                    <span className="flex min-w-0 flex-col">
                      <span>{app.projectName}</span>
                      <span className="text-label text-text-2">{app.companyName}</span>
                    </span>
                  </a>
                </Row>
              ))}
            </List>
          </div>
        </>
      )}
      <SignOutButton />
    </Column>
  )
}
