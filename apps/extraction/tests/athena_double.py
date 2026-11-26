from __future__ import annotations

import json
import re
import typing as t
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path

import duckdb
import pyarrow as pa
from pyiceberg.catalog import Catalog
from pyiceberg.expressions import AlwaysTrue

RECORDINGS = Path(__file__).parents[3] / "apps/server/src/platform/recordings/aws"
U1 = Path(__file__).parent / "recordings"
DBT = '-- /* {"app": "dbt"'
REFUSED_AT_START = "treat-syntax-error"
CTAS = re.compile(
    r'create table "[^"]+"\."(tratado|negocio)"\."([a-z0-9_]+)"\s+with \([^)]*\)\s+as\s(.*)',
    re.DOTALL,
)
TARGET = re.compile(r'^\s*(?:MERGE INTO|DELETE FROM)\s+"(raw|current)"\."([a-z0-9_]+)"')


def recording(name: str) -> dict[str, t.Any]:
    return t.cast("dict[str, t.Any]", json.loads((RECORDINGS / f"{name}.json").read_text()))


def recorded_answer(
    scenario: str, api: str, *, status: int = 200, state: str | None = None
) -> dict[str, t.Any]:
    for line in (U1 / f"{scenario}.jsonl").read_text().splitlines()[1:]:
        answer = t.cast("dict[str, t.Any]", json.loads(line))
        if (answer["api"], answer["status"]) == (api, status) and (
            state is None
            or json.loads(answer["body"])["QueryExecution"]["Status"]["State"] == state
        ):
            return answer
    raise AssertionError(f"{scenario} holds no {api} {status} {state}")


@dataclass(frozen=True)
class Refusal:
    recording: str
    line_of: str | None = None

    def said(self, body: str, sql: str) -> str:
        if self.line_of is None:
            return body
        line = sql[: sql.index(self.line_of)].count("\n") + 1
        return re.sub(r"line \d+:", f"line {line}:", body)


@dataclass
class Execution:
    sql: str
    failed: bool
    rows: list[tuple[t.Any, ...]] = field(default_factory=list)
    refusal: Refusal | None = None


@dataclass
class AthenaDouble:
    """Athena, and the Glue catalog dbt reads, as the laboratory recorded them (the envelopes), with
    the statements run by DuckDB on the local Iceberg tables: Trino's dialect is proved on the
    laboratory, not here."""

    catalog: Catalog
    executions: dict[str, Execution] = field(default_factory=dict)
    refuse: Callable[[str], bool] = lambda _sql: False
    keep_raw: bool = False
    refusals: dict[str, Refusal] = field(default_factory=dict)
    workgroups: set[str] = field(default_factory=set)
    dropped: list[str] = field(default_factory=list)

    @property
    def statements(self) -> list[str]:
        return [execution.sql for execution in self.executions.values()]

    def answer(self, target: str, request: dict[str, t.Any]) -> tuple[dict[str, t.Any], str]:
        match target.removeprefix("AmazonAthena."):
            case "StartQueryExecution":
                self.workgroups.add(request["WorkGroup"])
                return self._start(request["QueryString"])
            case "GetQueryExecution":
                return self._execution(self.executions[request["QueryExecutionId"]], request)
            case "GetQueryResults":
                return self._results(self.executions[request["QueryExecutionId"]], request)
            case other:
                raise AssertionError(other)

    def glue(self, target: str, request: dict[str, t.Any]) -> tuple[dict[str, t.Any], str]:
        space = request.get("DatabaseName", "")
        match target.removeprefix("AWSGlue."):
            case "GetDatabases":
                found = recorded_answer("treat-first-build", "GetDatabases")
                return found, found["body"]
            case "GetTables" if (space,) not in self.catalog.list_namespaces():
                absent = recorded_answer("treat-area-absent", "GetTables", status=400)
                return absent, absent["body"]
            case "GetTables":
                found = recorded_answer("treat-rebuild", "GetTables")
                shape = json.loads(found["body"])["TableList"][0]
                tables = [
                    self._table(shape, space, name) for _, name in self.catalog.list_tables(space)
                ]
                return found, json.dumps({"TableList": tables})
            case "GetTable":
                found = recorded_answer("treat-rebuild", "GetTable")
                shape = json.loads(found["body"])["Table"]
                return found, json.dumps({"Table": self._table(shape, space, request["Name"])})
            case "DeleteTable":
                self.catalog.drop_table((space, request["Name"]))
                self.dropped.append(f"{space}.{request['Name']}")
                gone = recorded_answer("treat-rebuild", "DeleteTable")
                return gone, gone["body"]
            case other:
                raise AssertionError(other)

    def _table(self, shape: dict[str, t.Any], space: str, name: str) -> dict[str, t.Any]:
        federated = {**shape["FederatedTable"], "DatabaseIdentifier": space, "Identifier": name}
        return {**shape, "DatabaseName": space, "Name": name, "FederatedTable": federated}

    def _start(self, sql: str) -> tuple[dict[str, t.Any], str]:
        ctas = CTAS.search(sql)
        refusal = None if ctas is None else self.refusals.get(ctas.group(2))
        query_id = f"00000000-0000-4000-8000-{len(self.executions) + 1:012x}"
        if refusal is not None and refusal.recording == REFUSED_AT_START:
            self.executions[query_id] = Execution(sql, failed=True)
            refused = recorded_answer(refusal.recording, "StartQueryExecution", status=400)
            return refused, refusal.said(refused["body"], sql)
        started = recording("start-query-execution")
        self.executions[query_id] = (
            self._run(sql) if refusal is None else Execution(sql, failed=True, refusal=refusal)
        )
        return started, json.dumps({**json.loads(started["body"]), "QueryExecutionId": query_id})

    def _execution(
        self, execution: Execution, request: dict[str, t.Any]
    ) -> tuple[dict[str, t.Any], str]:
        refusal = execution.refusal
        if refusal is not None:
            found = recorded_answer(refusal.recording, "GetQueryExecution", state="FAILED")
        elif execution.sql.startswith(DBT) and not execution.failed:
            found = recorded_answer("treat-first-build", "GetQueryExecution", state="SUCCEEDED")
        else:
            outcome = "failed" if execution.failed else "succeeded"
            found = recording(f"get-query-execution-{outcome}")
        body = json.loads(
            found["body"] if refusal is None else refusal.said(found["body"], execution.sql)
        )
        for name in ("QueryExecution", "QueryExecutionDetail"):
            if name in body:
                body[name].update(QueryExecutionId=request["QueryExecutionId"], Query=execution.sql)
        return found, json.dumps(body)

    def _results(
        self, execution: Execution, request: dict[str, t.Any]
    ) -> tuple[dict[str, t.Any], str]:
        [[cell]] = execution.rows
        if CTAS.search(execution.sql) is not None:
            written = recorded_answer("treat-first-build", "GetQueryResults")
            return written, json.dumps({**json.loads(written["body"]), "UpdateCount": cell})
        found = recording("get-query-results")
        body = json.loads(found["body"])
        shown = {} if cell is None else {"VarCharValue": str(cell)}
        body["ResultSet"]["Rows"][1] = {"Data": [shown]}
        return found, json.dumps(body)

    def _run(self, sql: str) -> Execution:
        if self.refuse(sql):
            return Execution(sql, failed=True)
        if self.keep_raw and sql.startswith('DELETE FROM "raw"'):
            return Execution(sql, failed=False)
        connection = duckdb.connect()
        for (space,) in self.catalog.list_namespaces():
            connection.execute(f'CREATE SCHEMA "{space}"')
            for _, name in self.catalog.list_tables(space):
                table = self.catalog.load_table((space, name))
                connection.register("loaded", table.scan().to_arrow())
                connection.execute(f'CREATE TABLE "{space}"."{name}" AS SELECT * FROM loaded')
                connection.unregister("loaded")
        statement = sql.split("\n", 1)[1] if sql.startswith(DBT) else sql
        ctas = CTAS.search(statement)
        try:
            if ctas is not None:
                return self._created(connection, sql, ctas)
            result = connection.execute(statement)
            rows = result.fetchall() if statement.lstrip().upper().startswith("SELECT") else []
        except duckdb.Error:
            return Execution(sql, failed=True)
        changed = TARGET.match(sql)
        if changed is not None:
            space, name = changed.groups()
            table = self.catalog.load_table((space, name))
            after = connection.sql(f'SELECT * FROM "{space}"."{name}"').to_arrow_table()
            with table.transaction() as transaction:
                if table.current_snapshot() is not None:
                    transaction.delete(AlwaysTrue())
                if after.num_rows:
                    transaction.append(after.cast(pa.schema(table.schema().as_arrow())))
        return Execution(sql, failed=False, rows=rows)

    def _created(
        self, connection: duckdb.DuckDBPyConnection, sql: str, ctas: re.Match[str]
    ) -> Execution:
        space, name, select = ctas.groups()
        written = connection.sql(select).to_arrow_table()
        self.catalog.create_table((space, name), schema=written.schema).append(written)
        return Execution(sql, failed=False, rows=[(written.num_rows,)])
