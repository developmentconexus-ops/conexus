# 0024. One host per app and environment

## Context

The browser separates cookies and storage by host.

## Decision

Each app and environment has its own host, one level under the apps' domain. A wildcard route sends every host to the dispatcher, which picks the app by name. Basis: Purpose, by reasoning: with one host per company, one app's code could call another app with the person's session. Cloudflare's free certificate covers one level.

The host is `<projeto>--<apelido>`: the Projeto's name without accents, lowercase, hyphenated and
cut to fit 63 characters, then the company's nickname, as in `estoque--metal-nobre.<domain>`. It is
stored and unique; renaming the Projeto does not change it; a name needs three letters or digits.
The owner chooses the nickname in the company's first setup; it stays fixed, and a change through
the Central waits for a request. `packages/hub-api/src/address.ts` alone owns the rule.

## Criterion

None written before. Brought from earlier work.

## Result

Not run. Login tests LT2 and LT13 assume it.

## Consequences

Changing later breaks addresses people saved.

## Reopens when

A need for nested hosts or a company's own domain.

## State

Brought. Decided in the architecture of 2026-10-13; the domain name is the founder's.
The address, founder, 2026-10-17: "2A mas estoque-metal-nobre.<dominio>", then "Sim" to `--`; the
nickname: "Entraria no fluxo inicial de configuração", fixed with "A", reserved names "A"; short
names: "Nome A".
