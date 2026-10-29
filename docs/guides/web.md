# Web guide

How the Hub's screens are organized and written. Rules read as the opening of the
[delivery guide](delivery.md) says.

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
  _app/           route.tsx: beforeLoad checks the session; index.tsx opens the last company; the
                  company, Configurações, first entry and Central layouts each draw their frame
hub/              public.ts and one folder per subject
builder/          public.ts and one folder per subject
ui/               pieces with no subject: cn.ts, button, input, label, field, form, alert-dialog,
                  dropdown-menu, avatar, sheet, toast, skeleton, states, frame
platform/         jitless.ts, hub.ts (the only fetch), cache, attempt key, failure reader,
                  auth.ts (the Better Auth client), theme, dates
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
  import Mastra's client, with the `fetch` of `platform/hub.ts`. [dependency-cruiser]
- **W8.** A screen **must** read route parameters and data through `getRouteApi`, never by importing
  the route. A piece drawn above the route that owns the parameter, such as the Workbench drawn by
  the Projeto route reading a conversation's id, reads it with `useParams({ strict: false, select })`,
  TanStack Router's documented form for a shared component; `getRouteApi` there would fail on the
  parent route, where the child is absent. [dependency-cruiser, review]

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

`ensureQueryData` can return a cached session even when stale. The flow tests retain that
distinction.

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
- **W27.** `platform/jitless.ts` **must** set Zod's `jitless` before any schema exists, in the
  chunk that holds Zod. [`platform/cache.test.tsx`, `vite.config.test.ts`]

[Design V23](design.md) owns style reuse and the width-token collision; its existing GritQL plugin
stays enabled. [Code C37](code.md) owns attempt identity end to end, while the mixed rule above
retains the form/socket proof already required. No new checker is claimed for semantic judgment.

## 6. Information architecture

Where each screen lives. Founder, 2026-10-19, on the review page of the screen structure: "Aprovado
tudo". The lines of [screens](../reference/screens.md) say which screen is on which floor.

- **W29.** Every screen **must** live on one floor, and `docs/reference/screens.md` **must** carry
  its line: Entrada (`/login`, `/set-password`, `/invitations/…`, one centred column); Primeira
  entrada (`/companies/<e>/welcome/<step>`, the owner, once); Empresa (`/companies/<e>`: Início and
  its Projetos); Projeto (`/companies/<e>/projects/<p>/<tab>`); Configurações
  (`/companies/<e>/settings/<section>`); Central (`/operations/…`). A person who only uses an app
  sees only "Seus apps" at `/` and never enters them. [review]
- **W30.** The frame **should** be one sidebar on the left and no top bar: the company with its
  switcher, Início, up to five recent Projetos with "Todos os projetos", Integrações, Configurações, and the
  account (name, theme, Central for whoever operates it, Sair). It collapses to icons inside a
  Projeto and returns on leaving; on a phone it is a drawer opened from the top button (design
  V56). A person with two companies opens the last one used; "Suas empresas" is the switcher's
  menu. [review]
- **W31.** A Projeto **should** open on its Prévia with the latest conversation on the right; a new
  one focuses the composer. The top line holds Company / Name ▾ on the left, the tabs Prévia,
  Código, Alterações and Projeto in the middle, and Versão ▾, Abrir app and Publicar on the right.
  A control appears only when its step exists, never as "em breve". The tab Projeto lists
  sections, each added by its step: Sobre, Versões, Quem usa o app, Dados da empresa,
  Publicação. [review]
- **W32.** Configurações **should** swap the sidebar for an index with "← Voltar" and a search, in
  two groups: Você (Minha conta, Contas de modelo, Meus padrões; the theme lives in the account menu) and the company's,
  headed by its name (Geral, Pessoas e convites, Padrões da empresa, Memória observacional); founder,
  2026-10-20: "1. A"; 2026-10-27: "Opcao C", "1. Sim 2. Antes", "Aprovado". Integrações is not
  there: it is a company sidebar entry between Projetos and Configurações (founder, 2026-10-28, on
  the connectors study: "O1"). Owner and administrator change the company's group; a member reads Pessoas.
  Atividade and Uso have their place reserved there and appear only when a card asks for them. [review]
- **W33.** An owner's first entry **should** be four steps with progress, "Voltar" and "Sair":
  Sua empresa, Ligue uma conta de modelo, Convide sua equipe, O que vamos construir primeiro? Steps
  two and three are skippable; what was skipped becomes the card "Termine de preparar a empresa" on
  Início, for owner and administrator, until done. An invited member sets a password and lands on
  Início with no steps. [review]
- **W34.** Every card's state matrix **must** carry the columns 'primeira vez' and 'sem
  permissão' beside its other states. Loading shows the frame at once and a skeleton only in the
  content; an error stays in the content area with "Tentar de novo"; not found offers "Voltar ao
  início" ([code C48](code.md); founder, 2026-10-20: "2. A"); a missing permission shows the page
  and says who can (design V29), and never hides it. Failure: a screen that hides what a person may
  not do leaves them guessing. [review]
- **W35.** The Hub added to the iPhone home screen (iOS 26.1 or newer) draws a blurred band under
  the status bar: WebKit bug 301994, with no fix in the page. The page **must not** carry a
  workaround for it, such as a fixed padding or a status-bar style, and each iOS release is
  retested in issue #387. Founder, 2026-10-27, offered a fixed padding and a retest: "A" (keep the
  issue, retest). Failure: a fixed offset tuned to one iPhone leaves a gap on the next. [review]
