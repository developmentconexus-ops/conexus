# 0022. App logins are secrets of the dispatcher

## Context

Under [0020] the dispatcher calls Neon directly with the app's login.

## Decision

Each app login is a secret of the dispatcher Worker; the Hub writes a new one when an app is created. Basis: Only tested so: three alternatives named, none built. Accepted until the ceiling, with the exit named.

## Criterion

None written before. Brought from earlier work.

## Result

A leaked app login reaches only that app's schema.

## Consequences

App logins leave our server and live at Cloudflare. A Worker holds 128 secrets and variables.

## Reopens when

Near 100 app logins; the exit is one dispatcher per company.

## State

Superseded by [0043].
