# 0021. One Neon project per company, a schema and a login per app

## Context

Restoring one company must not move another, and an app must not read another app.

## Decision

Each company has its own Neon project. Inside it, each app has one schema per environment and two logins: one runs it, one migrates it. Basis: Purpose.

## Criterion

None written before. Brought from earlier work.

## Result

App 1 did not read app 2; company A did not read company B; restoring company A did not restart company B. A project was usable 6 s after the API call.

## Consequences

A project to create, and later pay for, per company. The project's address is public: the password is the wall.

## Reopens when

The project limit of the paid plan.

## State

Brought. From the cloud study of 2026-10-09; recalled by the founder on 2026-10-11: "cada empresa teria seu propria database para os apps".
