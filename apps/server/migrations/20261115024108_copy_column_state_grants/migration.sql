-- Custom SQL: Drizzle cannot generate a grant (data D5). Parte 1 da camada de dados, with
-- the founder's word of 2026-11-15 in a pull request of its own (data D11): a run writes the state of each source
-- column of its copy, and fills the descriptions a template gives that the stored definition lacks.
GRANT UPDATE (column_state, definition) ON TABLE copies.copy TO hub_company;
