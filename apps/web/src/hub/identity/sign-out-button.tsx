import { sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { useSignOut } from './sign-out.ts'

/** "Sair do Conexus" as a button, for a page with no account menu; a failure says why beside it. */
export function SignOutButton() {
  const signOut = useSignOut()
  return (
    <>
      {signOut.error !== undefined && (
        <p role="alert" className="text-label text-danger">
          {sentenceOf(signOut.error)}
        </p>
      )}
      <Button variant="ghost" disabled={signOut.pending} onClick={signOut.leave}>
        {signOut.pending ? 'Saindo…' : 'Sair do Conexus'}
      </Button>
    </>
  )
}
