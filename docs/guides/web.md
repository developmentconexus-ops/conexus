# Web guide

How the Hub's screens are organized and written. Each rule uses the words of
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119): **must** and **must not** are defects in review;
**should** and **should not** need a stated reason to break; **may** is a free choice. Each rule ends
with the machine that refuses a violation, "rule to write" when the check is promised and not yet
written, or "review". How to use TanStack Router, TanStack Query, React Hook Form, Tailwind or the
shadcn pieces is their maintainers' skills, installed at the root; read them before these rules.

Owners next door: [design](design.md) for how screens look and speak, [code](code.md) for the
import law and errors, [testing](testing.md) for the test tools.

## 1. The tree

- **W1.** `apps/web/src` **must** have this shape, and subject folders **must** carry the names of
  the server's: [dependency-cruiser]

```text
main.tsx      mounts the router and the cache; nothing else
routes/       one file per address: who enters, what loads, which screen opens
  __root.tsx
  _publico/   sign in, accept an invitation, recover a password
  _app/       beforeLoad checks the session; its component is the frame
hub/          public.ts and one folder per subject
builder/      public.ts and one folder per subject
ui/           pieces with no subject: button, field, form, confirmation, states, frame
platform/     hub.ts (the only fetch), cache, attempt key, failure reader, dates
brand/        tokens, fonts, mark
```

- **W2.** A subject **must** hold its `queries.ts`, its screens, its pure logic, each test beside its
  file, and a `public.ts`, with no subfolder by kind. [review]
- **W3.** A component **must** live in the subject that owns the data it shows. It **must** move to
  `ui/` when it knows no subject and a second subject needs it, and it is moved, never copied.
  [review]

**Why.** One map serves the person, the agent and the checker: whoever opens `hub/projects` on the
server finds the screens in `hub/projects` on the web.

**Right.** The Project picker lives in `hub/projects`, sign-out in `hub/identity`, and the `_app`
route joins them in the frame from `ui/`.

**Wrong.** A `components/` folder holding the confirmations of four subjects.

## 2. Walls

- **W4.** A subject **must** reach another only through its `public.ts`, and `hub/` **must not**
  import `builder/`. [dependency-cruiser]
- **W5.** `ui/`, `platform/` and `brand/` **must not** import a subject or a route; `ui/` **may**
  import `platform/`. [dependency-cruiser]
- **W6.** `routes/` **must** reach a subject only through its `public.ts`. [dependency-cruiser]
- **W7.** `@mastra/*` **must** be imported only inside `builder/`; only the conversation **may**
  import Mastra's client, with the `fetch` of `platform/hub.ts`. The conversation's pieces are chosen
  in step 12 with a prototype [0033]. [dependency-cruiser]
- **W8.** A screen **must** read route parameters and data through `getRouteApi`, never by importing
  the route. [dependency-cruiser]

**Why.** A route is to the screens what `main.ts` is to the server: the one place that joins two
subjects. Importing the route from its screen makes a cycle.

**Right.** The route of the Project page imports `hub/projects/public.ts` and
`builder/conversation/public.ts` and places both.

**Wrong.** `hub/projects/prompt-box.tsx` importing `builder/conversation/session.ts`.

## 3. Calling the Hub

- **W9.** A screen **must** call the Hub only through `platform/hub.ts`, which builds the address
  from the operation in `packages/hub-api`, sends cookies same-origin and parses the reply with the
  operation's schema. [Biome]
- **W10.** Only a subject's `queries.ts` **may** use `hubQuery` and `hubMutation`. [rule to write]
- **W11.** Nobody **may** write a query key; it derives from the operation and its input. [rule to
  write]
- **W12.** After a write, the `MutationCache` **should** invalidate every query, with an exit by
  `meta`; the conversation stays out of it. [review]
- **W13.** `platform/hub.ts` **must not** know a subject. [dependency-cruiser]

**Why.** One `fetch` that checks every reply against the contract means a changed shape fails at the
edge, and a key derived from the operation cannot drift from the call it caches.

**Right.**

```ts
export const projectQuery = (projectId: ProjectId) => hubQuery(getProject, { params: { projectId } })
```

in `hub/projects/queries.ts`.

**Wrong.** `useQuery({ queryKey: ['projects'], queryFn: () => fetch('/api/projects') })` in a screen.

## 4. Routes and state

- **W14.** A route file **must not** hold a screen; it says the address, who enters and what loads.
  [review]
- **W15.** Session and permission to enter **must** live in the frame's `beforeLoad`; no screen
  **may** ask whether the person is signed in. [review]
- **W16.** Route and search parameters **must** be checked in the route, with Zod. [review]
- **W17.** A route's main read **should** be fetched by its `loader`, and "loading" and "error"
  **must** be defined once in the router. [review]
- **W18.** Every list **must** keep its page and filter in the address, so a link reopens the same
  list. [review]
- **W19.** There **must not** be state at module level. Server data lives in TanStack Query,
  shareable state in the address, the rest in the component, and the live stream in a reducer.
  [review]
- **W20.** A screen **must not** decide a product rule; it shows what the Hub says. [review]

**Why.** Seventeen copies of the frame and ten of the sign-in gate were the old screens' largest
repetition; one `beforeLoad` and one frame remove them by construction.

**Right.** `validateSearch: z.object({ lente: z.enum(['previa', 'codigo']) })` in the route, and the
version number read from the Hub's reply.

**Wrong.** A screen that computes the app's version from its own list, differently from another
screen.

## 5. Pieces and forms

- **W21.** Visual pieces **must** be Conexus's own, copied from shadcn into `ui/` on Base UI and
  painted with the brand [0033]. A new piece **must** be born in `ui/` ([code C72](code.md)).
  [review]
- **W22.** "Loading", "error" and "empty" **must** come from `ui/`. [review]
- **W23.** A form **must** use the `Form` and `Field` of `ui/`, React Hook Form with the body schema
  `packages/hub-api` already has, and the server's refusal **must** land on its field. [review]
- **W24.** Every write that creates something **must** use the attempt key: two clicks, one request.
  [review, and a test per form]
- **W25.** Styles **must** be Tailwind with the brand tokens in `@theme`; the component is the unit
  of reuse, and there **must not** be a stylesheet per screen. [review]
- **W26.** Logic without React **should** live in a pure `.ts` file, apart from the screen. [review]

**Why.** Eleven forms written by hand in two ways checked only "not empty"; one form piece with the
contract's schema gives the browser the server's limits.

**Right.** `<Form schema={createProject.body} onSubmit={submit}>` with the refusal set by
`setError`.

**Wrong.** A `useState` per field and an `if (!name)` before the request.
