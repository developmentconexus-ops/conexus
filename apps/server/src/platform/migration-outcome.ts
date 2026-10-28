// The outcome check of a version's migrations (B, 2026-10-27), proven on PostgreSQL 18.6 by the
// step 15 card: the copies carry the table's oid in their name, so a 63-letter name is not cut; the
// catalog's functions carry `pg_catalog.`, so an app function of the same name does not replace
// them; values compare as text, because `json`, `point` and `xml` have no equality; a new type
// passes only by a binary cast to a type with no limit. Names are the catalog's own, never a cast's
// text, which quotes a name with capitals: the schema `app_P…` and a table such as `"Caixa"`.

/** The app schema before its pending migrations, copied in the same transaction (decision 0046). */
export const OUTCOME_BEFORE = {
  text: `
DO $cx$
DECLARE t record;
BEGIN
  CREATE TEMP TABLE cx_col ON COMMIT DROP AS
    SELECT c.oid AS rel, c.relname AS tab, a.attname AS col, a.atttypid AS typ, a.atttypmod AS typmod,
           pg_catalog.format_type(a.atttypid, a.atttypmod) AS typname,
           (a.attnotnull AND NOT a.atthasdef AND a.attidentity = '' AND a.attgenerated = '') AS required
    FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
    WHERE c.relnamespace = pg_catalog.quote_ident(pg_catalog.current_schema())::regnamespace AND c.relkind = 'r'
      AND c.relname <> 'conexus_migration' AND a.attnum > 0 AND NOT a.attisdropped;
  CREATE TEMP TABLE cx_check ON COMMIT DROP AS
    SELECT conrelid, pg_catalog.pg_get_constraintdef(oid) AS def FROM pg_catalog.pg_constraint
    WHERE connamespace = pg_catalog.quote_ident(pg_catalog.current_schema())::regnamespace AND contype IN ('c', 'f');
  FOR t IN SELECT DISTINCT rel, tab FROM cx_col LOOP
    EXECUTE format('CREATE TEMP TABLE %I ON COMMIT DROP AS SELECT * FROM %I', 'cx_rows_' || t.rel, t.tab);
  END LOOP;
END
$cx$
`,
}

/** Refuses the transaction when a saved value or the previous version's schema did not survive. */
export const OUTCOME_AFTER = {
  text: `
DO $cx$
DECLARE c record; lost bigint; now_typ oid; now_mod int;
BEGIN
  FOR c IN SELECT * FROM cx_col LOOP
    SELECT a.atttypid, a.atttypmod INTO now_typ, now_mod FROM pg_catalog.pg_attribute a
      WHERE a.attrelid = pg_catalog.to_regclass(quote_ident(c.tab)) AND a.attname = c.col AND NOT a.attisdropped;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'previous version breaks: %.% is gone', c.tab, c.col
        USING ERRCODE = 'CX001', TABLE = c.tab, COLUMN = c.col;
    END IF;
    IF now_typ <> c.typ AND (now_mod <> -1 OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_cast
         WHERE castsource = c.typ AND casttarget = now_typ AND castmethod = 'b'))
       OR now_typ = c.typ AND now_mod <> -1 AND now_mod < c.typmod THEN
      RAISE EXCEPTION 'previous version breaks: %.% no longer takes every % value', c.tab, c.col, c.typname
        USING ERRCODE = 'CX001', TABLE = c.tab, COLUMN = c.col;
    END IF;
    BEGIN
      EXECUTE format('SELECT count(*) FROM (SELECT %1$I::text FROM %2$I WHERE %1$I IS NOT NULL
                      EXCEPT ALL SELECT %1$I::%3$s::text FROM %4$I WHERE %1$I IS NOT NULL) lost',
                     c.col, 'cx_rows_' || c.rel, c.typname, c.tab) INTO lost;
    EXCEPTION WHEN OTHERS THEN lost := -1;
    END;
    IF lost <> 0 THEN
      RAISE EXCEPTION 'data lost: % saved value(s) of %.% changed or removed',
        CASE WHEN lost < 0 THEN 'some' ELSE lost::text END, c.tab, c.col
        USING ERRCODE = 'CX002', TABLE = c.tab, COLUMN = c.col;
    END IF;
  END LOOP;
  FOR c IN SELECT (SELECT r.relname FROM pg_catalog.pg_class r WHERE r.oid = a.attrelid) AS tab, a.attname AS col FROM pg_catalog.pg_attribute a
           WHERE a.attrelid IN (SELECT pg_catalog.to_regclass(quote_ident(tab)) FROM cx_col)
             AND a.attnum > 0 AND NOT a.attisdropped
             AND a.attnotnull AND NOT a.atthasdef AND a.attidentity = '' AND a.attgenerated = ''
           EXCEPT SELECT tab, col FROM cx_col WHERE required LOOP
    RAISE EXCEPTION 'previous version breaks: %.% is now required with no default, and the previous version saves without it', c.tab, c.col
      USING ERRCODE = 'CX001', TABLE = c.tab, COLUMN = c.col;
  END LOOP;
  FOR c IN SELECT (SELECT r.relname FROM pg_catalog.pg_class r WHERE r.oid = k.conrelid) AS tab, k.conname FROM pg_catalog.pg_constraint k
           WHERE k.contype IN ('c', 'f') AND k.conrelid IN (SELECT pg_catalog.to_regclass(quote_ident(tab)) FROM cx_col)
             AND NOT EXISTS (SELECT 1 FROM cx_check o WHERE o.conrelid = k.conrelid
                             AND o.def = pg_catalog.pg_get_constraintdef(k.oid))
             AND EXISTS (SELECT 1 FROM pg_catalog.pg_attribute a JOIN cx_col o
                           ON o.tab = (SELECT r.relname FROM pg_catalog.pg_class r WHERE r.oid = k.conrelid) AND o.col = a.attname
                         WHERE a.attrelid = k.conrelid AND a.attnum = ANY (k.conkey)) LOOP
    RAISE EXCEPTION 'previous version breaks: new rule % on saved columns of %', c.conname, c.tab
      USING ERRCODE = 'CX001', TABLE = c.tab, CONSTRAINT = c.conname;
  END LOOP;
END
$cx$
`,
}
