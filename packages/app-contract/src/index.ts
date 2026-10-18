// What a Projeto's app receives from the platform (decision 0019, security S4). Everything here is
// visible to the app's code, so it carries only what the app may know. Step 9 adds `db`.

/** Who calls the app: the person and the Projeto, never an e-mail, a company or a role. */
export type Caller = Readonly<{
  personId: string
  personName: string
  projectId: string
  projectName: string
}>

/** The dispatcher's `props` to the app's Worker, which reads them as `ctx.props`. */
export type AppProps = Readonly<{ caller: Caller }>
