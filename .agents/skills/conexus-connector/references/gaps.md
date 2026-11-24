# Known gaps

What the kit lacks for the next connectors the founder listed on 2026-11-23 (HubSpot, TOTVS, Gmail
with Calendar, Outlook mail and calendar, Google Drive, SharePoint, NF-e, Sicoob). Each piece enters
with the first connector that needs it, on that connector's card, in the kit, named for no provider.
All depend on U16 (the class, the session, the generated skill), which is on `main`; the table
pieces also depend on U3 ([lake](lake.md)). The source is the study of the nine connectors by class
(sections 3 and 4) and the kit audit of 2026-11-24. References are at the commits [kit](kit.md)
names; Airbyte paths are under airbyte-integrations/connectors/.

## The pieces K1 to K8

| # | Piece | First need | The kit today | Reference | Verdict | Where it gets built |
| --- | --- | --- | --- | --- | --- | --- |
| K1 | Separate fixed origins for the API and the login | Google, Microsoft | One origin; the token on it (`definition.ts`, `oauth.ts`, `request.ts`) | Nango keeps `token_url` and `authorization_url` apart from `base_url` (packages/providers/providers.yaml:16185-16200); Airbyte's Gmail manifest has its own refresh address (source-gmail/manifest.yaml:381) | embrulhado: the list stays fixed and checked (S36) | the first Google or Microsoft card |
| K2 | One login app for several connectors | Google (Gmail with Calendar, Drive), Microsoft (three) | One app per connector, from the apps file (0057) | Nango's `alias: google` and `alias: microsoft` (providers.yaml:16219, :4485) | nativo of the reference | the same card as K1 |
| K3 | A connection that belongs to one person | Gmail with Calendar, Outlook | A connection is the company's | Copilot, Databricks per-user, Gemini with the user's credential | embrulhado, if the founder chooses it | needs the founder's word (study, question 1) |
| K4 | Columns discovered in a paged read | HubSpot, a spreadsheet, a SharePoint list, TOTVS | U3 discovers columns only for a `TABLE` source | Airbyte `DynamicSchemaLoader` (source-google-sheets/manifest.yaml:89-160); Nekt `extra_fields` (NK:177778) | nativo of the reference | U3 can plan for it; else the HubSpot card |
| K5 | An origin the company types, with a user and password login | TOTVS | Fixed origin; pasted fields only | Nango `${connectionConfig.subdomain}` (providers.yaml:290-291); Airbyte `config['domain']` (source-freshdesk/manifest.yaml:1280); Nekt Basic auth (NK:177705) | remendo de segurança | needs the founder's word (study, question 4) |
| K6 | The company's digital certificate (mTLS) | NF-e, Sicoob | None | Nango `require_client_certificate` (providers.yaml:757-775); Nekt `.pfx` and password (NK:35615-35623) | embrulhado, if the founder accepts keeping the certificate | needs the founder's word (study, question 5) |
| K7 | SOAP and XML on the wire | NF-e | JSON or form; a non-JSON 2xx becomes `null` | SPED `Tools.php`; PyNFe; Airbyte `XmlDecoder` on answers only (source-workflowmax/manifest.yaml:23) | embrulhado, NF-e only | the NF-e card |
| K8 | A text answer | an exported Docs file in Drive; the NF-e XML | A non-JSON 2xx becomes `null` (`wire.ts`) | Airbyte's Drive download | embrulhado | the first Drive or NF-e card |

The connector factory is a build step, not a kit piece: an agent writes the kit folder from the
system's documentation, the conformance checks it, a test read runs against the recorded double,
and a person reviews the PR ([0069](../../../../docs/decisions/0069-connectors-one-source-the-kit.md),
not proved). The founder chose to prove it on TOTVS. It depends on the conformance staying the gate.

## Other gaps the audit found

| Gap | What happens | Where it gets built |
| --- | --- | --- |
| Paging by link | Microsoft Graph pages by `@odata.nextLink`, a whole URL. dlt has `JSONLinkPaginator` (paginators.py:717) and `HeaderLinkPaginator` (:665); the kit has `OFFSET`, `CURSOR` and `NONE`, and `toRequest` builds from a path. Unmeasured whether `$skiptoken` fits as a cursor | the first Microsoft card |
| Paging by page number | dlt has `PageNumberPaginator` (:265); the kit does not | the first connector that needs it |
| A retry of a passing 5xx | The executor and the planned task return `UNREACHABLE` with no new attempt | a line in U4, asked by the audit |
| Copying an exclusive credential | No OAuth connector copies to the lake until the task can ask the Hub to renew | stage 5 of the roadmap |
| A reader for `credentialClass` | Only the conformance reads it; the Hub picks the session by login kind | U8 |
| A reader for `callLimit` | Declared and checked, read by nothing since the old engine left | the first copy that counts by app |
| One reader of an exact number back to a number | `Decimal` in `mercado-livre/operations/route.ts` and `Num` in `sankhya/search.ts` do the same thing | the kit, beside `parseExact`, with the next `EXACT` connector |
| Leftovers | `copy.ts`, `list.ts`, `conformance-list.ts`, `list-fixture.ts` (U3 deletes them), `assertNoCopyModels`, `inCopyTurn` | the closing of the connector step, and U3 |

## Stays out

The file download and the original in the file store (stage 3a), e-mail cursors (`deltaLink`,
`historyId`, since e-mail is never copied), and a login by pasted token (the founder asked for
"sem colar chave").
