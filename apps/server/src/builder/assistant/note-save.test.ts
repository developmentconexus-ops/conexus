import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { Sent } from '../../platform/test-anthropic.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { assisting, created, said, talking } from './test-assistant.ts'

const SAVE = 'connector_note_save'
const NOTE = {
  connection: 'Matriz',
  concept: 'TOP 1100',
  mapping: 'CODTIPOPER 1100 é venda de balcão',
  provingQuery: 'SELECT COUNT(*) AS N FROM TGFTOP WHERE CODTIPOPER = 1100',
}
const ASK = 'o tipo de operação 1100 é venda de balcão; anota isso no caderno'

/** The suspended calls Mastra tells the model of in its system text, with `autoResumeSuspendedTools`. */
function suspendedIn(asked: Sent): { toolCallId: string; toolName: string }[] {
  const found = /Analyse the suspended tools: (\[.*?\]), using/s.exec(asked.system)
  return found?.[1] === undefined ? [] : JSON.parse(found[1])
}

/**
 * The model as the person's words lead it: asked to note, it calls the save; told of a suspended
 * save, it reads the person's answer as `confirmed`, or says something else for a new question;
 * after a tool's result it says it is done.
 */
function modelReading(answers: Record<string, boolean | 'other'>) {
  return (asked: Sent) => {
    if (!asked.stream) return { kind: 'text', text: 'Título' } as const
    const last = asked.texts.at(-1) ?? ''
    const suspended = suspendedIn(asked).filter((each) => each.toolName === SAVE)
    const answer = answers[last]
    if (last === ASK) return { kind: 'blocks', blocks: [tool(SAVE, NOTE)] } as const
    if (suspended[0] !== undefined && typeof answer === 'boolean') {
      const resumed = { suspendedToolCallId: suspended[0].toolCallId, resumeData: { confirmed: answer } }
      return { kind: 'blocks', blocks: [tool(SAVE, { ...NOTE, ...resumed })] } as const
    }
    if (answer === 'other') return { kind: 'blocks', blocks: [said('O 1101 é devolução.')] } as const
    return { kind: 'blocks', blocks: [said('Pronto.')] } as const
  }
}

async function noting(t: TestContext, answers: Record<string, boolean | 'other'>) {
  const on = await assisting(t, modelReading(answers))
  const saves: unknown[] = []
  const door = on.hub.connectors.assistant
  door.saveNote = async (_scope, call) => {
    saves.push(call)
    return { kind: 'SAVED', provedRows: 1 }
  }
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const talk = await talking(t, on.hub, on.ana, url)
  return { ...on, saves, ...talk }
}

for (const [reply, confirmed] of [
  ['sim', true],
  ['não, deixa', false],
] as const) {
  test(`a prova: "${reply}" retoma a chamada suspensa com confirmed: ${confirmed}`, async (t) => {
    const on = await noting(t, { [reply]: confirmed })
    const first = await on.say(ASK)
    console.log('first end', endOf(first))
    assert.deepEqual(on.saves, [], 'the call suspends before saving')
    const second = await on.say(reply)
    console.log('second end', endOf(second))
    console.log(JSON.stringify(second.map((e) => ({ ...e, ...(e.type === 'message_update' ? { message: undefined } : {}) }))).slice(0, 6000))
    assert.equal(on.saves.length, confirmed ? 1 : 0)
    console.log(on.calls.map((c) => c.texts.at(-1)))
  })
}

test('a prova: uma pergunta nova não grava', async (t) => {
  const on = await noting(t, { 'espera, e o 1101?': 'other' })
  await on.say(ASK)
  const second = await on.say('espera, e o 1101?')
  console.log('second end', endOf(second))
  assert.deepEqual(on.saves, [])
})
