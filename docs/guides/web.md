# Web guide

How the Hub's screens are organized and written. Each rule uses the words of
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119): **must** and **must not** are defects in review;
**should** and **should not** need a stated reason to break; **may** is a free choice. Each rule ends
with the machine that refuses a violation, "rule to write" when the check is promised and not yet
written, or "review". How to use a library is its maintainers' skill, read before these rules. Only
shadcn and Better Auth have one, installed at user level rather than in this repository; TanStack
Router, TanStack Query, React Hook Form and Tailwind have none, so read their documentation at the
version `apps/web` installs.

Owners next door: [design](design.md) for how screens look and speak, [code](code.md) for the
import law and errors, [testing](testing.md) for the test tools.

## 1. The tree

- **W1.** `apps/web/src` **must** have this shape, and subject folders **must** carry the names of
  the server's. Page addresses, like file and folder names, **must** be English words; founder,
  2026-10-14: "prefiro em ingles". [dependency-cruiser; rule to write for `routeTree.gen.ts`, which
  `web-tree-shape` refuses today; review for addresses]

```text
main.tsx          imports platform/jitless.ts first, then mounts the router and the cache
routeTree.gen.ts  written by the router plugin; never edited; ignored by Biome and knip
routes/           one file per address: who enters, what loads, which screen opens
  __root.tsx      the router's context, holding the query client; nothing visible
  _public/        route.tsx (the centred column); sign in, accept an invitation, recover a password
  _app/           route.tsx: beforeLoad checks the session, its component is the frame; index.tsx
hub/              public.ts and one folder per subject
builder/          public.ts and one folder per subject
ui/               pieces with no subject: cn.ts, button, input, label, field, form, alert-dialog,
                  dropdown-menu, avatar, sheet, toast, skeleton, states, frame
platform/         jitless.ts, hub.ts (the only fetch), cache, attempt key, failure reader,
                  auth.ts (the Better Auth client, if step 3 keeps it), theme, dates
brand/            tokens, fonts, mark
```

- **W2.** A subject **must** hold its `queries.ts`, its screens, its pure logic, each test beside its
  file, and a `public.ts`, with no subfolder by kind. [review]
- **W3.** A component **must** live in the subject that owns the data it shows. It **must** move to
  `ui/` when it knows no subject and a second subject needs it, and it is moved, never copied.
  [review]

**Why.** One map serves the person, the agent and the checker: whoever opens `hub/projects` on the
server finds the screens in `hub/projects` on the web. The route tree and `route.tsx` sit where
`@tanstack/router-plugin` 1.168.46 puts them by default (`generatedRouteTree`, `routeToken`), so a
layout reads in one folder. A pathless folder such as `_public` never reaches the address.

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
  operation's schema. `platform/hub.ts` exports that one `fetch`: a library client that calls the
  Hub, such as Better Auth's, **must** receive it as its fetch, and **must not** keep its own cache
  of a fact TanStack Query holds, so Better Auth's `useSession` is not used. [Biome, review]
- **W10.** Only a subject's `queries.ts` **may** use `hubQuery` and `hubMutation`. [rule to write]
- **W11.** Nobody **may** write a query key; it derives from the operation and its input. [rule to
  write]
- **W12.** After a write, the `MutationCache` **should** invalidate every query, with an exit by
  `meta`; the conversation stays out of it. [review]
- **W13.** `platform/hub.ts` **must not** know a subject. [dependency-cruiser]

**Why.** One `fetch` that checks every reply against the contract means a changed shape fails at the
edge, and a key derived from the operation cannot drift from the call it caches. Better Auth 1.7.8
takes a fetch through `fetchOptions.customFetchImpl` (`client/config.mjs:46`) and keeps the session
in an atom of its own (`client/session-atom.mjs:50-55`), a second owner of one fact
([code C26](code.md)).

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
  **may** ask whether the person is signed in. A 401 on any read or write **must** drop the cache
  and send the person to sign-in with the return address; no screen handles it. After "Sair", or
  when the session ends, the person **must** land on the sign-in page with one line above the form
  saying which happened, and return to that address after signing in; there is no separate
  signed-out page. Founder, 2026-10-14: "A". [review]
- **W16.** Route and search parameters **must** be checked in the route, with Zod. A return address
  in the search **must** be parsed as a same-origin path ([security S24](security.md)). [review]
- **W17.** A route's main read **should** be fetched by its `loader`. The router **must** set
  `defaultPendingComponent`, `defaultErrorComponent` and `defaultNotFoundComponent` from `ui/`, and
  set `defaultPendingMs` and `defaultPendingMinMs` itself. [review]
- **W18.** Every list **must** keep its page and filter in the address, so a link reopens the same
  list. [review]
- **W19.** There **must not** be state at module level. Server data lives in TanStack Query,
  shareable state in the address, the rest in the component, and the live stream in a reducer. A
  per-browser preference, such as the theme or the last company, **may** live in `localStorage`,
  read and written inside `try`. [review]
- **W20.** A screen **must not** decide a product rule; it shows what the Hub says. [review]
- **W28.** After sign-in the session entry **must** be removed from the cache, not only invalidated,
  before `router.invalidate()`; after sign-out the cache **must** be cleared. [review, and a test per
  flow]

**Why.** Seventeen copies of the frame and ten of the sign-in gate were the old screens' largest
repetition; one `beforeLoad` and one frame remove them by construction. The router sees a session
that ended only at the next navigation or `router.invalidate()` (`@tanstack/router-core` 1.171.37,
`router.d.ts:766`), so the 401 has to trigger it. `ensureQueryData` returns a cached entry even when
stale: a proof with only an invalidation kept the person on the sign-in page after the right
password. Without the three components the router shows English, "Not Found" and "Something went
wrong!" (`@tanstack/react-router` 1.170.44, `not-found.js:41`, `CatchBoundary.js:56`), and its
default pending delay shows a blank first second (`router-core`, `router.d.ts:105,113`).

**Right.** `validateSearch: z.object({ lens: z.enum(['preview', 'code']) })` in the route, and the
version number read from the Hub's reply.

**Wrong.** A screen that computes the app's version from its own list, differently from another
screen.

## 5. Pieces and forms

- **W21.** Visual pieces **must** be Conexus's own, copied from shadcn into `ui/` on Base UI and
  painted with the brand [0033]. A new piece **must** be born in `ui/` ([code C72](code.md)). A
  piece is copied from the registry by hand, read with `shadcn view`, never written by `shadcn add`.
  shadcn's color names **may** exist only as `@theme inline` aliases of brand tokens. [review]
- **W22.** "Loading", "error" and "empty" **must** come from `ui/`. The root **must** set Base UI's
  `CSPProvider` with `disableStyleElements`, no piece **may** inject a `<style>` element, sonner
  included, and a toast **must** be the Base UI `toast` piece. [review]
- **W23.** A form **must** use the `Form` and `Field` of `ui/`, React Hook Form with the body schema
  `packages/hub-api` already has, and the server's refusal **must** land on its field. A sign-in
  refusal **must** land on the form, not on a field, and **must not** say which of e-mail or password
  was wrong; a 429 reads its own sentence by its status. [review]
- **W24.** Every write that creates something **must** use the attempt key: two clicks, one request.
  [review, and a test per form]
- **W25.** Styles **must** be Tailwind with the brand tokens in `@theme`; the component is the unit
  of reuse, and there **must not** be a stylesheet per screen. A named width utility **must not**
  use a brand spacing name (`xs` to `2xl`), and a layout cap **must** be a `--container-*` token
  with a name of its own: Tailwind 4 reads `max-w-*`, `w-*` and `min-w-*` through `--spacing-*`
  before `--container-*`, so `max-w-sm` is the brand's 0.5rem. Numeric, intrinsic and zero widths,
  such as `min-w-48`, `size-8` and `min-w-0`, stay valid. [review]
- **W26.** Logic without React **should** live in a pure `.ts` file, apart from the screen. [review]
- **W27.** `platform/jitless.ts` **must** set Zod's `jitless` before any schema exists: Zod 4 builds
  its first schema with `new Function`, which the CSP of [security S26](security.md) refuses. The
  build puts it in the chunk that holds Zod, because that chunk runs before the entry's body; an
  import at the top of `main.tsx` is not enough once the build splits code.
  [`platform/cache.test.tsx`, `vite.config.test.ts`]

**Why.** Eleven forms written by hand in two ways checked only "not empty"; one form piece with the
contract's schema gives the browser the server's limits. No reference app sends an attempt key; it
exists for the retry after a lost reply, which `isSubmitting` does not cover. By its skill, the
shadcn CLI writes through path aliases in `components.json`, which
[0003](../decisions/0003-repository-shape.md) forbids, and aliases keep raw values in the brand
folder ([design V3](design.md)). The Hub sends `style-src 'self'`
(`apps/server/src/platform/http.ts:28`), and sonner 2.0.8 injects a `<style>` when imported
(`dist/index.mjs:2-5`). Better Auth 1.7.8 answers `INVALID_EMAIL_OR_PASSWORD` for either mistake
(`sign-in.mjs:322-336`) and its 429 carries no code (`api/rate-limiter/index.mjs:64-71`).

**Right.** `<Form schema={createProject.body} onSubmit={submit}>` with the refusal set by
`setError`.

**Wrong.** A `useState` per field and an `if (!name)` before the request.
