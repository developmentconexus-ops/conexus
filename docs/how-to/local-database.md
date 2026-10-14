# Run the server tests on a local database

How a developer gets the disposable PostgreSQL 18 that the server tests need. Rules: [data](../guides/data.md) D9 and [testing](../guides/testing.md) T19. Decision: [0037](../decisions/0037-postgresql-18-and-drizzle-1-for-the-hub-database.md).

## Start the database

1. Start PostgreSQL 18 with a throwaway superuser, on a port that is free on your machine:
   `docker run --rm -d --name conexus-test-db -e POSTGRES_PASSWORD=local-superuser -p 127.0.0.1:55432:5432 postgres:18`
2. Create the login that owns the test databases. It is not a superuser, as in CI:
   `docker exec conexus-test-db psql -U postgres -c "create role conexus_owner login createdb createrole password 'local-owner'"`
3. Export the three variables the tests read, the same ones CI sets (the third names the container, whose `pg_dump` 18 takes the catalog snapshot):
   `export CONEXUS_TEST_DATABASE_URL=postgres://conexus_owner:local-owner@127.0.0.1:55432/postgres`
   `export CONEXUS_TEST_RUNTIME_PASSWORD=local-runtime`
   `export CONEXUS_TEST_DATABASE_CONTAINER=conexus-test-db`
4. Run `npm test -w @conexus/server`.

Each suite creates its own database named `conexus_test_` and a random suffix, migrates it, and drops it at the end. The password of `hub_runtime` is the second variable, so the suites that run at once agree on it.

## Stop it

`docker stop conexus-test-db`. The `--rm` flag removes the container. The role `hub_runtime` belongs to the server, not to a database, so it dies with the container.
