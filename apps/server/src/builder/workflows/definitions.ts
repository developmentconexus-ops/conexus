import type { WorkflowId } from '@conexus/hub-api'
import type { Mastra } from '@mastra/core/mastra'
import { databaseFailure } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { parseMastraWorkflowId } from './ids.ts'

/** A call to Mastra's storage, its failure read by the database's map (code C52). */
export async function stored<T>(work: Promise<T>): Promise<T> {
  try {
    return await work
  } catch (error) {
    throw databaseFailure(error)
  }
}

function definitionsOf(mastra: Mastra) {
  const definitions = mastra.getStorage()?.stores?.workflowDefinitions
  if (definitions === undefined) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'MASTRA_DEFINITIONS_MISSING' } })
  }
  return definitions
}

/** Every definition `wf-*` Mastra holds that is not a test's, by its id. */
export async function versionDefinitionIds(mastra: Mastra): Promise<string[]> {
  const { definitions } = await stored(definitionsOf(mastra).list())
  return definitions
    .map((each) => each.id)
    .filter((id) => parseMastraWorkflowId(id)?.kind === 'VERSION')
}

/** Drops definitions from Mastra: the live registry and the stored row, a definition at a time. */
export async function dropDefinitions(mastra: Mastra, ids: readonly string[]): Promise<void> {
  const definitions = definitionsOf(mastra)
  for (const id of ids) {
    mastra.removeWorkflow(id)
    await stored(definitions.delete(id))
  }
}

/** Drops every definition of a workflow, each version's and each path's. */
export async function dropWorkflow(mastra: Mastra, id: WorkflowId): Promise<number> {
  const ids = (await versionDefinitionIds(mastra)).filter(
    (each) => parseMastraWorkflowId(each)?.workflowId === id,
  )
  await dropDefinitions(mastra, ids)
  return ids.length
}
