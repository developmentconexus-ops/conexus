# Web guide

How the Hub's screens are organized and written. Each rule uses
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119): **must** and **must not** state a requirement;
**should** and **should not** need a stated reason to break; **may** is a free choice. Brackets name
the enforcing machine, "rule to write" for a promised check, or "review". Guidance does not reopen
approved behavior; [delivery L12](delivery.md) decides whether a finding blocks. Library usage
belongs to maintainers' skills, checked against the installed version. Where none exists, read
the installed library's documentation.

Owners next door: [design](design.md) for appearance, [code](code.md) for imports, boundaries and
errors, [security](security.md) for authority and CSP, [testing](testing.md) for proof.

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

The router plugin owns generated tree shape and route tokens. [Code C26](code.md) owns shared
behavior and [testing T6](testing.md) tests beside the owner; no second file tree is needed here.

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

## 3. Calling the Hub

- **W9.** A screen **must** call the Hub only through `platform/hub.ts`, which builds the address
  from the operation in `packages/hub-api`, sends cookies same-origin and parses the reply with the
  operation's schema. `platform/hub.ts` exports that one `fetch`: a library client that calls the
  Hub, such as Better Auth's, **must** receive it as its fetch, and **must not** keep its own cache
  of a fact TanStack Query holds, so Better Auth's `useSession` is not used. [Biome, review]
- **W10.** Only a subject's `queries.ts` **may** use `hubQuery` and `hubMutation`. [rule to write]
- **W11.** Nobody **may** write a query key; it derives from the operation and its input. [rule to
  write]
- **W12.** Cache updates after writes **should** be centralized in `MutationCache`, retaining the
  current invalidate-all policy with explicit `meta` exceptions and the conversation outside it.
  Failure: saving in one screen leaves another displaying an old version. TanStack does not
  invalidate that data automatically. [review]
- **W13.** `platform/hub.ts` **must not** know a subject. [dependency-cruiser]

One declaration supplies address, schema and query identity. Better Auth's own session atom is a
second owner, so its `useSession` is not a substitute for the shared cache.

## 4. Routes and state

- **W15.** Session entry, expiry and exit **should** be centralized in the frame's `beforeLoad`
  and shared 401 handling, not each screen. Any read/write 401 drops cache and returns to sign-in
  with the return address. After "Sair" or expiry, the approved sign-in page explains which
  happened above the form, then returns after sign-in; there is no separate signed-out page.
  Founder, 2026-10-14: "A". Failure: a mutation's 401 leaves another person's cached data visible.
  [review]
- **W17.** A route **should** load its main read in its `loader`, setting shared pending, error and
  not-found components and explicit pending delays. Failure: a failed loader displays
  "Something went wrong" in English or a blank first second. Native router options serve this;
  checking property names cannot prove the experience. [review]
- **W18.** Shareable list state **should** live in the address, including page and filter. Failure:
  copying a link opens a different page/filter. `validateSearch` cannot choose meaningful filters
  for the product. [review]
- **W28.** After sign-in the session entry **must** be removed from the cache, not only invalidated,
  before `router.invalidate()`; after sign-out the cache **must** be cleared. [review, and a test per
  flow]

`ensureQueryData` can return a cached session even when stale. Invalidation alone once left the
person on sign-in after the correct password; the flow tests retain that concrete distinction.

## 5. Pieces and forms

- **W21.** Shared visual pieces **should** use the selected native source, adapted once in `ui/`,
  not copied into variants per screen: Conexus's own shadcn pieces on Base UI and brand tokens
  [0033]. Read copied code; aliases do not bypass [0003]. Failure: a manual `FieldError` loses the
  alert behavior its native piece already has. The choice remains; a CLI ritual is not another
  correctness rule. [review]
- **W22.** Shared loading/error/empty states and pieces **should** work under the actual CSP,
  including error output: root Base UI `CSPProvider` with `disableStyleElements`, Base UI toast,
  no injected style elements. Fonts remain local to the brand, without a CDN. Failure: sonner
  injects a style element and the browser blocks the notification. Source `noInlineStyles` does
  not inspect vendor DOM; observe uncaught errors and CSP violations in the browser, distinguishing
  expected refusals shown by the screen. [review]
- **W23.** Forms **should** reuse `ui/` Form/Field, React Hook Form and the contract's body schema,
  showing refusal on its field or form as appropriate. Sign-in errors stay on the form without
  disclosing which credential failed; 429 has its own status-based sentence. Failure: a message
  without alert semantics gives a screen-reader user no feedback. [review]
- **W24.** Every write that creates something **must** use the attempt key: two clicks, one request.
  The key **must** end only on an answer the browser read whole from the Hub that settles the
  outcome: the success body, or a failure whose row says it settles (C48). No reply, a cut or
  unreadable body, a reply that is not the Hub's, or a failure that does not settle **must** keep it
  for the next attempt. [review, a test per form, and one on a real socket]
- **W27.** `platform/jitless.ts` **must** set Zod's `jitless` before any schema exists: Zod 4 builds
  its first schema with `new Function`, which the CSP of [security S24](security.md) refuses. The
  build puts it in the chunk that holds Zod, because that chunk runs before the entry's body; an
  import at the top of `main.tsx` is not enough once the build splits code.
  [`platform/cache.test.tsx`, `vite.config.test.ts`]

[Design V23](design.md) owns style reuse and the width-token collision; its existing GritQL plugin
stays enabled. [Code C37](code.md) owns attempt identity end to end, while the mixed rule above
retains the form/socket proof already required. No new checker is claimed for semantic judgment.
