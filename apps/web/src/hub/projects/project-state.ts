import type { ProjectSummary } from '@conexus/hub-api'

/** What a Projeto's app is, in the words a person reads: published, still being built, or not begun. */
export type ProjectState =
  | { kind: 'PUBLISHED'; version: number }
  | { kind: 'BUILDING'; version: number }
  | { kind: 'NO_APP' }

export function projectStateOf(
  project: Pick<ProjectSummary, 'appVersion' | 'publishedVersion'>,
): ProjectState {
  if (project.publishedVersion !== null) {
    return { kind: 'PUBLISHED', version: project.publishedVersion }
  }
  if (project.appVersion !== null) return { kind: 'BUILDING', version: project.appVersion }
  return { kind: 'NO_APP' }
}

/** The sentence a list of Projetos says when it holds none. */
export const NO_PROJECTS = 'Nenhum projeto ainda.'
export const NO_PROJECTS_TITLE = 'Nenhum projeto ainda'
export const PROJECTS_SENTENCE = 'Cada Projeto guarda um app, as conversas e as ligações dele.'
export const ASK_ON_HOME = 'ou peça um app no Início'

export function projectStateText(state: ProjectState): string {
  switch (state.kind) {
    case 'PUBLISHED':
      return `Publicado · v${state.version}`
    case 'BUILDING':
      return `Em construção · v${state.version}`
    case 'NO_APP':
      return 'Ainda sem app'
    default:
      return state satisfies never
  }
}
