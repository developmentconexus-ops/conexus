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

/** The sentence a list of Projetos says when it holds none: Início's block and the empty page's sentence. */
export const NO_PROJECTS = 'Nenhum projeto ainda.'
/** The empty page's title, the same fact as `NO_PROJECTS` without its full stop. */
export const NO_PROJECTS_TITLE = 'Nenhum projeto ainda'
/** What "Todos os projetos" says under its title. */
export const PROJECTS_SENTENCE = 'Cada Projeto guarda um app, as conversas e as ligações dele.'
/** The way out of the empty page, to where a person asks for an app. */
export const ASK_ON_HOME = 'ou peça um app no Início'

/** The tone of a state's stamp: only a published app is a success. */
export function projectStateTone(state: ProjectState): 'success' | 'neutral' {
  return state.kind === 'PUBLISHED' ? 'success' : 'neutral'
}

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
