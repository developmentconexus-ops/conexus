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
  (each with an \`input\` and an \`output\` shape), \`migrations\` and \`assets\`.
- the entry module: it starts with \`import { serveApp } from '@conexus/app-contract'\`, calls
  \`serveApp({ manifest, handlers })\` and has one handler per operation, \`handler(input, { db, caller })\`.
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

## A small app

\`manifest.json\`:

\`\`\`json
{
  "contract": 1,
  "entry": "worker.js",
  "operations": {
    "listarRecados": {
      "input": { "type": "object", "properties": {} },
      "output": {
        "type": "array",
        "maxItems": 100,
        "items": {
          "type": "object",
          "properties": { "id": { "type": "integer" }, "texto": { "type": "string" } },
          "required": ["id", "texto"]
        }
      }
    },
    "escreverRecado": {
      "input": {
        "type": "object",
        "properties": { "texto": { "type": "string", "minLength": 1, "maxLength": 500 } },
        "required": ["texto"]
      },
      "output": { "type": "object", "properties": { "id": { "type": "integer" } }, "required": ["id"] }
    }
  },
  "migrations": [
    {
      "id": "001_recado",
      "statements": [
        "CREATE TABLE recado (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, texto text NOT NULL)"
      ]
    }
  ],
  "assets": ["index.html"]
}
\`\`\`

\`operations\` is an object keyed by the operation's name, not a list. The entry, \`worker.js\`:

\`\`\`js
import { serveApp } from '@conexus/app-contract'
import manifest from './manifest.json' with { type: 'json' }

const handlers = {
  async listarRecados(_input, { db }) {
    const result = await db.query('SELECT id, texto FROM recado ORDER BY id DESC LIMIT 100')
    if ('error' in result) throw new Error('db')
    return result.rows
  },
  async escreverRecado({ texto }, { db }) {
    const result = await db.batch([
      { text: 'INSERT INTO recado (texto) VALUES ($1) RETURNING id', values: [texto] },
    ])
    if ('error' in result) throw new Error('db')
    return { id: result.results[0].rows[0].id }
  },
}

export default serveApp({ manifest, handlers })
\`\`\`

The page in \`${ASSETS_FOLDER}/index.html\` calls \`fetch('/api/listarRecados', { method: 'POST', body: '{}' })\`.

## How you work

The machine does not run or check an app: it has no Conexus runtime, no \`@conexus/app-contract\`
package, no bundler and no database, so do not search for them or try to install them. The server checks
and assembles the version when the turn ends. Write \`manifest.json\`, the entry module and the assets
now, in that order, with the file tools. The one check the machine can do is that the manifest is JSON:
\`node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"\`.

Do not run \`git push\`: the server saves the version when the turn ends.`,
})
