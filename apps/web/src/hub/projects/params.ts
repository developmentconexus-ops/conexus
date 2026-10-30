import { ProjectId } from '@conexus/hub-api'
import { idOrNotFound } from '../../platform/hub.ts'

/** The `$projectId` of every route of a Projeto: a value that is not an id is the not-found page. */
export const projectParams = {
  parse: (raw: { projectId: string }) => ({ projectId: idOrNotFound(ProjectId, raw.projectId) }),
  stringify: (p: { projectId: ProjectId }) => p,
}
