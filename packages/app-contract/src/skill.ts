import { APP_CALL_LIMITS, APP_LIMITS } from './limits.ts'
import { ASSETS_FOLDER } from './manifest.ts'

/**
 * The skill the Builder reads before it writes an app (card, U6): the contract of version 1 in the
 * words the model needs, with its numbers taken from the contract itself, so the two cannot drift.
 * It is text, not a file: nothing of it is written into a Projeto's machine.
 */
export const APP_SKILL = Object.freeze({
  name: 'conexus-app',
  description:
    'Use before writing or changing the business app of a Projeto: what a version of an app contains and what its code may do.',
  instructions: `# A Conexus app, contract 1

A version of an app is a folder with:

- \`manifest.json\`: \`contract\` (always 1), \`entry\` (a \`.js\` module of the folder), \`operations\`
  (1 to 32, each with an \`input\` and an \`output\` shape), \`migrations\` and \`assets\`.
- the entry module: it calls \`serveApp({ manifest, handlers })\` and has one handler per operation,
  \`handler(input, { db, caller })\`.
- \`${ASSETS_FOLDER}/\`: the static files (HTML, CSS, JS) the person opens. Each is listed in \`assets\`.

Shapes: \`string\` (\`enum\`, \`minLength\`, \`maxLength\`), \`integer\`, \`number\`, \`boolean\`, \`array\` (\`items\`),
\`object\` (\`properties\`, \`required\`), at most 6 levels, each one may add \`nullable: true\`. The runtime
checks every input and output against them.

The browser calls an operation with \`POST /api/<operation>\` and a JSON body.

## The database

\`db.query(text, values)\` only reads. Every write of a call goes in one \`db.batch([{ text, values }])\`,
one transaction, all or nothing. A statement never carries a value in its text: use \`$1\`, \`$2\`.
Migrations are \`{ id, statements: [...] }\`, one SQL statement per item, with no \`BEGIN\`, \`COMMIT\`,
\`SET\` or other transaction control.

## What a call may use

CPU ${APP_CALL_LIMITS.cpuMs} ms, ${APP_CALL_LIMITS.dbCallsPerCall} database calls, ${APP_CALL_LIMITS.callDeadlineMs / 1000} s in all,
${APP_CALL_LIMITS.statementTimeoutMs / 1000} s a statement. A version has at most ${APP_LIMITS.files} files and ${APP_LIMITS.bytes / 1024 / 1024} MB.
\`caller\` holds the person's id and name and the Projeto's id and name, nothing else.

## How you work

Write the files with the file tools and check them with commands in the machine. Do not run \`git push\`:
the server saves the version when the turn ends.`,
})
