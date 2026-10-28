// The migrations the step 15 study measured against Voltar, with the outcome proven on PostgreSQL
// 18.6, and the fixed list's probes proven on libpg-query 18.1.5. The data is invented (S40). Each
// table is the study's own: one line each, its fields split by ` | `, statements by ` ;; `.

function rows(table: string): string[][] {
  return table
    .trim()
    .split('\n')
    .map((line) => line.split(' | '))
}

/** Three small businesses' saved tables and rows: a bakery, a garage and a salon. */
export const SEED = {
  id: '001_semente',
  statements: `
CREATE TABLE encomenda (id serial PRIMARY KEY, cliente text NOT NULL, telefone text, produto text, preco text, entrega text, status text NOT NULL DEFAULT 'aberta' CONSTRAINT encomenda_status_check CHECK (status IN ('aberta', 'pronta', 'entregue')))
INSERT INTO encomenda (cliente, telefone, produto, preco, entrega) VALUES ('Maria', '(11) 99999-0000', 'bolo de cenoura', 'R$ 45,00', '25/10/2026'), ('João', NULL, 'pão de queijo', '12,5', '2026-10-26'), ('Carla', '(11) 99999-0000', 'torta de limão', 'R$ 1.200,00', 'amanhã')
CREATE TABLE encomenda_teste (id serial PRIMARY KEY, nota text)
INSERT INTO encomenda_teste (nota) VALUES ('teste')
CREATE TABLE ordem_servico (id serial PRIMARY KEY, cliente_nome text NOT NULL, telefone text, placa text, servico text, valor text, observacao varchar(100), mecanico text, qtd int)
INSERT INTO ordem_servico (cliente_nome, telefone, placa, servico, valor, observacao, mecanico, qtd) VALUES ('José da Silva', '(11) 98888-0000', 'ABC1D23', 'revisão', '200', 'ok', 'Rui', 1), ('José da Silva', '(11) 98888-0000', 'ABC1D23', 'freio', '150', NULL, NULL, 2), ('Ana Paula Souza Lima', NULL, 'XYZ9K87', 'óleo', '350', 'troca', NULL, 1), ('Pedro', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
CREATE TABLE cliente (id serial PRIMARY KEY, nome text, telefone text, email text)
INSERT INTO cliente (nome, telefone, email) VALUES ('Beatriz', '(11) 97777-0000', 'bia@exemplo.com'), ('Lúcia', NULL, 'lu@exemplo.com')
CREATE TABLE contato (id serial PRIMARY KEY, nome text, whatsapp text, instagram text)
INSERT INTO contato (nome, whatsapp, instagram) VALUES ('Beatriz', '(11) 97777-0000', '@bia'), ('Renata', '(11) 96666-0000', '@re')
CREATE TABLE agendamento (id serial PRIMARY KEY, cliente_id int REFERENCES cliente (id), servico text, quando text, duracao_min int)
INSERT INTO agendamento (cliente_id, servico, quando, duracao_min) VALUES (1, 'corte', 'sexta', NULL), (2, 'escova', 'sábado', NULL), (1, 'cor', 'domingo', 90)
CREATE TABLE comissao (id serial PRIMARY KEY, valor numeric, taxa numeric(12,2), forma varchar, pago_em timestamp)
INSERT INTO comissao (valor, taxa, forma, pago_em) VALUES (10.50, 1.5, 'pix', '2026-10-25 14:30:00')
CREATE TABLE registro (id serial PRIMARY KEY, extra json, pos point, x xml)
INSERT INTO registro (extra, pos, x) VALUES ('{"a":1}', '(1,2)', '<a>1</a>')
CREATE TABLE "Caixa" (id serial PRIMARY KEY, nota text NOT NULL)
INSERT INTO "Caixa" (nota) VALUES ('abertura')
`
    .trim()
    .split('\n'),
}

/** What the version before the migration does on every table: reads its columns, saves a new row. */
export const PREVIOUS_VERSION = `
SELECT id, cliente, telefone, produto, preco, entrega, status FROM encomenda
INSERT INTO encomenda (cliente, telefone, produto, preco, entrega) VALUES ('Nova', NULL, 'pão', '1', 'hoje')
SELECT id, nota FROM encomenda_teste
INSERT INTO encomenda_teste (nota) VALUES ('nova')
SELECT id, cliente_nome, telefone, placa, servico, valor, observacao, mecanico, qtd FROM ordem_servico
INSERT INTO ordem_servico (cliente_nome, observacao, qtd) VALUES ('Nova', 'nova', 1)
SELECT id, nome, telefone, email FROM cliente
INSERT INTO cliente (nome, telefone, email) VALUES ('Nova', NULL, 'nova@exemplo.com')
SELECT id, nome, whatsapp, instagram FROM contato
INSERT INTO contato (nome, whatsapp) VALUES ('Nova', '(11) 95555-0000')
SELECT id, cliente_id, servico, quando, duracao_min FROM agendamento
INSERT INTO agendamento (cliente_id, servico, quando) VALUES (1, 'corte', 'segunda')
SELECT id, valor, taxa, forma, pago_em FROM comissao
INSERT INTO comissao (valor) VALUES (5)
SELECT id, extra, pos, x FROM registro
INSERT INTO registro (extra) VALUES ('{}')
SELECT id, nota FROM "Caixa"
INSERT INTO "Caixa" (nota) VALUES ('fechamento')
`
  .trim()
  .split('\n')

const OUTCOMES = ['PASS', 'CX001', 'CX002', '23502', '23505', '22P02', '22008', '2BP01'] as const

/** What the version's migration transaction answers: it passes, or the SQLSTATE that refused it. */
export type Outcome = (typeof OUTCOMES)[number]

function isOutcome(value: string | undefined): value is Outcome {
  return OUTCOMES.some((one) => one === value)
}

/** One migration of the study, after the seed: its statements and its proven outcome. */
export type MigrationCase = Readonly<{ name: string; outcome: Outcome; statements: string[] }>

// The study's names; `checkNotValid` is its `P3_brecha`, and `capitalsNewRule` reads a quoted name.
// `swapRows` passes: the card's debt, a check by column and not by row.
export const MIGRATION_CASES: readonly MigrationCase[] = rows(String.raw`
P1 | CX001 | ALTER TABLE encomenda RENAME COLUMN telefone TO whatsapp
P1_reescrita | PASS | ALTER TABLE encomenda ADD COLUMN whatsapp text ;; UPDATE encomenda SET whatsapp = telefone
P2 | CX001 | ALTER TABLE encomenda DROP COLUMN produto
P3 | 23502 | ALTER TABLE encomenda ALTER COLUMN telefone SET NOT NULL
checkNotValid | CX001 | ALTER TABLE encomenda ADD CONSTRAINT encomenda_telefone_obrigatorio CHECK (telefone IS NOT NULL) NOT VALID
P4 | 23505 | CREATE UNIQUE INDEX encomenda_telefone_key ON encomenda (telefone)
P5 | 22P02 | ALTER TABLE encomenda ALTER COLUMN preco TYPE numeric(12,2) USING preco::numeric
P5_reescrita | PASS | ALTER TABLE encomenda ADD COLUMN preco_valor numeric(12,2) ;; UPDATE encomenda SET preco_valor = CASE WHEN preco ~ '^\s*(R\$)?\s*[0-9.]+(,[0-9]{1,2})?\s*$' THEN replace(replace(regexp_replace(preco,'[R$[:space:]]','','g'),'.',''),',','.')::numeric(12,2) END
P6 | 22008 | ALTER TABLE encomenda ALTER COLUMN entrega TYPE date USING entrega::date
P6_reescrita | PASS | ALTER TABLE encomenda ADD COLUMN entrega_dia date ;; UPDATE encomenda SET entrega_dia = CASE WHEN entrega ~ '^\d{2}/\d{2}/\d{4}$' THEN to_date(entrega,'DD/MM/YYYY') WHEN entrega ~ '^\d{4}-\d{2}-\d{2}$' THEN entrega::date END
P7 | CX001 | ALTER TABLE encomenda DROP CONSTRAINT encomenda_status_check ;; ALTER TABLE encomenda ADD CONSTRAINT encomenda_status_check CHECK (status IN ('aberta','pronta','entregue','cancelada'))
P7_reescrita | PASS | ALTER TABLE encomenda ADD COLUMN situacao text NOT NULL DEFAULT 'aberta' CHECK (situacao IN ('aberta','pronta','entregue','cancelada')) ;; UPDATE encomenda SET situacao = status
P7_soltar | PASS | ALTER TABLE encomenda DROP CONSTRAINT encomenda_status_check
P8 | CX002 | DROP TABLE encomenda_teste ;; DELETE FROM encomenda WHERE cliente = 'João'
P9 | CX002 | UPDATE encomenda SET preco = 'R$ 50,00' WHERE produto = 'bolo de cenoura'
O1 | CX001 | ALTER TABLE ordem_servico ADD COLUMN nome text ;; ALTER TABLE ordem_servico ADD COLUMN sobrenome text ;; UPDATE ordem_servico SET nome = split_part(cliente_nome,' ',1), sobrenome = nullif(substr(cliente_nome, length(split_part(cliente_nome,' ',1)) + 2), '') ;; ALTER TABLE ordem_servico DROP COLUMN cliente_nome
O1_reescrita | PASS | ALTER TABLE ordem_servico ADD COLUMN nome text ;; ALTER TABLE ordem_servico ADD COLUMN sobrenome text ;; UPDATE ordem_servico SET nome = split_part(cliente_nome,' ',1), sobrenome = nullif(substr(cliente_nome, length(split_part(cliente_nome,' ',1)) + 2), '')
O2 | CX001 | CREATE TABLE cliente_os (id serial PRIMARY KEY, nome text NOT NULL, telefone text) ;; INSERT INTO cliente_os (nome, telefone) SELECT DISTINCT cliente_nome, telefone FROM ordem_servico ;; ALTER TABLE ordem_servico ADD COLUMN cliente_id int REFERENCES cliente_os(id) ;; UPDATE ordem_servico o SET cliente_id = c.id FROM cliente_os c WHERE c.nome = o.cliente_nome AND c.telefone IS NOT DISTINCT FROM o.telefone ;; ALTER TABLE ordem_servico DROP COLUMN cliente_nome ;; ALTER TABLE ordem_servico DROP COLUMN telefone
O2_reescrita | PASS | CREATE TABLE cliente_os (id serial PRIMARY KEY, nome text NOT NULL, telefone text) ;; INSERT INTO cliente_os (nome, telefone) SELECT DISTINCT cliente_nome, telefone FROM ordem_servico ;; ALTER TABLE ordem_servico ADD COLUMN cliente_id int REFERENCES cliente_os(id) ;; UPDATE ordem_servico o SET cliente_id = c.id FROM cliente_os c WHERE c.nome = o.cliente_nome AND c.telefone IS NOT DISTINCT FROM o.telefone
O3 | 23505 | ALTER TABLE ordem_servico ADD CONSTRAINT ordem_servico_placa_key UNIQUE (placa)
O3_reescrita | PASS | CREATE TABLE veiculo (placa text PRIMARY KEY) ;; INSERT INTO veiculo (placa) SELECT DISTINCT placa FROM ordem_servico WHERE placa IS NOT NULL
O4 | PASS | ALTER TABLE ordem_servico ALTER COLUMN observacao TYPE text
O5 | CX001 | ALTER TABLE ordem_servico RENAME TO servico
O6 | 23502 | ALTER TABLE ordem_servico ALTER COLUMN mecanico SET NOT NULL
O6_reescrita | PASS | ALTER TABLE ordem_servico ALTER COLUMN mecanico SET DEFAULT 'não informado'
Sa1 | 2BP01 | CREATE TABLE pessoa (id serial PRIMARY KEY, nome text, telefone text, instagram text) ;; INSERT INTO pessoa (nome, telefone) SELECT nome, telefone FROM cliente ;; INSERT INTO pessoa (nome, telefone, instagram) SELECT nome, whatsapp, instagram FROM contato ;; DROP TABLE contato ;; DROP TABLE cliente
Sa1_reescrita | PASS | ALTER TABLE cliente ADD COLUMN instagram text ;; UPDATE cliente c SET instagram = k.instagram FROM contato k WHERE k.whatsapp = c.telefone ;; INSERT INTO cliente (nome, telefone, instagram) SELECT k.nome, k.whatsapp, k.instagram FROM contato k WHERE NOT EXISTS (SELECT 1 FROM cliente c WHERE c.telefone = k.whatsapp)
Sa2 | CX001 | CREATE TABLE cliente_telefone (id serial PRIMARY KEY, cliente_id int REFERENCES cliente(id), numero text) ;; INSERT INTO cliente_telefone (cliente_id, numero) SELECT id, telefone FROM cliente WHERE telefone IS NOT NULL ;; ALTER TABLE cliente DROP COLUMN telefone
Sa2_reescrita | PASS | CREATE TABLE cliente_telefone (id serial PRIMARY KEY, cliente_id int REFERENCES cliente(id), numero text) ;; INSERT INTO cliente_telefone (cliente_id, numero) SELECT id, telefone FROM cliente WHERE telefone IS NOT NULL
Sa3 | CX001 | DROP TABLE comissao
Sa4 | PASS | UPDATE agendamento SET duracao_min = 60 WHERE duracao_min IS NULL
Sa4_reescrita | PASS | ALTER TABLE agendamento ALTER COLUMN duracao_min SET DEFAULT 60
Sa5 | PASS | CREATE UNIQUE INDEX cliente_email_key ON cliente (lower(email))
Sa6 | PASS | ALTER TABLE agendamento ADD COLUMN status text NOT NULL DEFAULT 'marcado'
truncate | CX002 | TRUNCATE encomenda_teste
dropDefault | CX001 | ALTER TABLE encomenda ALTER COLUMN status DROP DEFAULT
varcharWiden | PASS | ALTER TABLE ordem_servico ALTER COLUMN observacao TYPE varchar(200)
numericLimit | CX001 | ALTER TABLE comissao ALTER COLUMN valor TYPE numeric(12,2)
numericScale | CX001 | ALTER TABLE comissao ALTER COLUMN taxa TYPE numeric(12,4)
numericWiden | PASS | ALTER TABLE comissao ALTER COLUMN taxa TYPE numeric(14,2)
varcharLimit | CX001 | ALTER TABLE comissao ALTER COLUMN forma TYPE varchar(3)
timestampLimit | CX001 | ALTER TABLE comissao ALTER COLUMN pago_em TYPE timestamp(0)
formatOverload | CX002 | CREATE FUNCTION format(text, name, text, text, name) RETURNS text LANGUAGE sql AS $$ SELECT 'SELECT 0' $$ ;; DELETE FROM encomenda_teste
json_noop | PASS | SELECT 1
json_add_column | PASS | ALTER TABLE encomenda ADD COLUMN whatsapp text
json_overwrite | CX002 | UPDATE registro SET extra = '{"a":2}'
xml_point_kept | PASS | ALTER TABLE registro ADD COLUMN nota text
fkNotValid | CX001 | CREATE TABLE fone (n text PRIMARY KEY) ;; ALTER TABLE encomenda ADD CONSTRAINT encomenda_fone_fk FOREIGN KEY (telefone) REFERENCES fone(n) NOT VALID
capitalsNewRule | CX001 | ALTER TABLE "Caixa" ADD CONSTRAINT caixa_nota_curta CHECK (length(nota) < 5) NOT VALID
textToVarchar3 | CX001 | ALTER TABLE ordem_servico ALTER COLUMN placa TYPE varchar(7)
intToBigint | CX001 | ALTER TABLE ordem_servico ALTER COLUMN qtd TYPE bigint
swapRows | PASS | UPDATE encomenda SET produto = CASE cliente WHEN 'Maria' THEN 'torta de limão' WHEN 'Carla' THEN 'bolo de cenoura' ELSE produto END
`).map(([name = '', outcome, statements = '']) => {
  if (!isOutcome(outcome)) throw new Error(`case ${name}: outcome ${outcome}`)
  return { name, outcome, statements: statements.split(' ;; ') }
})

/** Statements the fixed list refuses, each with the plain name the person reads; none reaches the database. */
export const REFUSED_PROBES = rows(`
rls | ligar a segurança por linha | ALTER TABLE encomenda ENABLE ROW LEVEL SECURITY
forceRls | forçar a segurança por linha | ALTER TABLE encomenda FORCE ROW LEVEL SECURITY
policy | criar regra de acesso por linha | CREATE POLICY p ON encomenda USING (false)
rule | criar regra que reescreve comandos | CREATE RULE r AS ON INSERT TO encomenda DO INSTEAD NOTHING
alterFunctionDefiner | alterar uma função já criada | ALTER FUNCTION f() SECURITY DEFINER
alterDefaultPrivileges | mudar as permissões padrão | ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO public
seqRestart | alterar uma sequência | ALTER SEQUENCE encomenda_id_seq RESTART 1
setUnlogged | tornar a tabela sem registro (UNLOGGED) | ALTER TABLE encomenda SET UNLOGGED
ownerTo | trocar o dono da tabela | ALTER TABLE encomenda OWNER TO someone
createUnlogged | criar tabela sem registro (UNLOGGED) | CREATE UNLOGGED TABLE t (id int)
createTemp | criar tabela temporária | CREATE TEMP TABLE t (id int)
cxCol | nome do Conexus (cx_col) | DELETE FROM cx_col
pgTempCxCol | tabela de outro esquema (pg_temp.cx_col) | DELETE FROM pg_temp.cx_col
ledger | nome do Conexus (conexus_migration) | DELETE FROM conexus_migration
fnSnapshot | nome do Conexus (cx_check) | CREATE FUNCTION f() RETURNS int LANGUAGE sql AS $$ INSERT INTO cx_check (def) VALUES ('x') RETURNING 1 $$
qualified | tabela de outro esquema (app.encomenda) | INSERT INTO app.encomenda (cliente) VALUES ('x')
doBlock | rodar um bloco de código solto (DO) | DO $$ BEGIN DELETE FROM encomenda; END $$
view | criar uma visão (view) | CREATE VIEW v AS SELECT * FROM encomenda
grant | dar ou tirar permissão de acesso | GRANT SELECT ON encomenda TO public
revoke | dar ou tirar permissão de acesso | REVOKE SELECT ON encomenda FROM public
begin | controlar a transação (BEGIN, COMMIT) | BEGIN
commit | controlar a transação (BEGIN, COMMIT) | COMMIT
set | mudar configuração do banco (SET) | SET statement_timeout = 0
reset | mudar configuração do banco (SET) | RESET ALL
discard | descartar o estado da conexão | DISCARD TEMP
definer | função com o poder do dono (SECURITY DEFINER) | CREATE FUNCTION f() RETURNS int LANGUAGE sql SECURITY DEFINER AS $$ SELECT 1 $$
fnDelete | função que apaga linhas | CREATE FUNCTION f() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN DELETE FROM encomenda; RETURN NEW; END $$
fnCteDelete | função que apaga linhas | CREATE FUNCTION f() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN WITH d AS (DELETE FROM encomenda RETURNING 1) SELECT 1; RETURN NEW; END $$
fnUpsert | função que muda linha existente (ON CONFLICT) | CREATE FUNCTION f() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN INSERT INTO veiculo VALUES (NEW.placa) ON CONFLICT (placa) DO UPDATE SET placa = NULL; RETURN NEW; END $$
fnDynamic | SQL montado na hora (EXECUTE) | CREATE FUNCTION f() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN EXECUTE 'DELETE FROM encomenda'; RETURN NEW; END $$
trigRaise | erro lançado por um gatilho (RAISE EXCEPTION) | CREATE FUNCTION f() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'não'; END $$
trigNull | gatilho que não termina em RETURN NEW | CREATE FUNCTION f() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NULL; END $$
trigAssert | conferência ASSERT num gatilho | CREATE FUNCTION f() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN ASSERT NEW.cliente <> ''; RETURN NEW; END $$
trigFallsOff | gatilho que não termina em RETURN NEW | CREATE FUNCTION f() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.cliente := upper(NEW.cliente); END $$
sqlBody | função com corpo BEGIN ATOMIC | CREATE FUNCTION g() RETURNS void LANGUAGE sql BEGIN ATOMIC DELETE FROM encomenda; END
language | função em outra linguagem (c) | CREATE FUNCTION g() RETURNS int LANGUAGE c AS 'x', 'y'
dropFunction | apagar uma função | DROP FUNCTION f()
dropTrigger | apagar um gatilho | DROP TRIGGER t ON encomenda
dropView | apagar uma visão | DROP VIEW v
selectInto | SELECT ... INTO, que cria uma tabela | SELECT * INTO copia FROM encomenda
ctas | criar tabela a partir de consulta | CREATE TABLE copia AS SELECT * FROM encomenda
enumType | criar um tipo de lista (ENUM) | CREATE TYPE s AS ENUM ('a')
extension | instalar uma extensão | CREATE EXTENSION unaccent
sequence | criar uma sequência (SEQUENCE) | CREATE SEQUENCE s
twoInOne | mais de um comando no mesmo item | SELECT 1; SELECT 2
unreadable | um comando que o Conexus não consegue ler | ALTER TABLE encomenda ADD COLUMN
`).map(([name = '', subject = '', statement = '']) => ({ name, subject, statement }))

/** Statements the fixed list lets through: the outcome check sees what they do. */
export const ALLOWED_PROBES = rows(`
touchFunction | CREATE FUNCTION touch() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.atualizado := now(); RETURN NEW; END $$
noticeFunction | CREATE FUNCTION f() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE NOTICE 'gravando'; RETURN NEW; END $$
logFunction | CREATE FUNCTION registra() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN INSERT INTO historico (nota) VALUES (NEW.cliente); RETURN NEW; END $$
sqlFunction | CREATE FUNCTION total() RETURNS bigint LANGUAGE sql AS $$ SELECT count(*) FROM encomenda $$
touchTrigger | CREATE TRIGGER t BEFORE UPDATE ON encomenda FOR EACH ROW EXECUTE FUNCTION touch()
comment | COMMENT ON TABLE encomenda IS 'x'
identity | CREATE TABLE p (id int GENERATED ALWAYS AS IDENTITY (START WITH 1000) PRIMARY KEY)
generated | ALTER TABLE encomenda ADD COLUMN cliente_minusculo text GENERATED ALWAYS AS (lower(cliente)) STORED
insertOnConflictNothing | INSERT INTO veiculo (placa) VALUES ('X') ON CONFLICT DO NOTHING
validateConstraint | ALTER TABLE encomenda VALIDATE CONSTRAINT c
dropIndex | DROP INDEX encomenda_telefone_key
`).map(([name = '', statement = '']) => ({ name, statement }))
