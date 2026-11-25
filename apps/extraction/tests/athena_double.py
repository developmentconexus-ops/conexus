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
SPACES = ("raw", "current")
TARGET = re.compile(r'^\s*(?:MERGE INTO|DELETE FROM)\s+"(raw|current)"\."([a-z0-9_]+)"')


def recording(name: str) -> dict[str, t.Any]:
    return t.cast("dict[str, t.Any]", json.loads((RECORDINGS / f"{name}.json").read_text()))


@dataclass
class Execution:
    sql: str
    failed: bool
    rows: list[tuple[t.Any, ...]] = field(default_factory=list)


@dataclass
class AthenaDouble:
    """Athena as the laboratory recorded it (the envelopes), with the statements run by DuckDB on
    the local Iceberg tables: Trino's dialect is for L.7 to prove."""

    catalog: Catalog
    executions: dict[str, Execution] = field(default_factory=dict)
    refuse: Callable[[str], bool] = lambda _sql: False
    keep_raw: bool = False

    @property
    def statements(self) -> list[str]:
        return [execution.sql for execution in self.executions.values()]

    def answer(self, target: str, request: dict[str, t.Any]) -> tuple[dict[str, t.Any], str]:
        match target.removeprefix("AmazonAthena."):
            case "StartQueryExecution":
                return self._start(request["QueryString"])
            case "GetQueryExecution":
                return self._execution(self.executions[request["QueryExecutionId"]], request)
            case "GetQueryResults":
                return self._results(self.executions[request["QueryExecutionId"]], request)
            case other:
                raise AssertionError(other)

    def _start(self, sql: str) -> tuple[dict[str, t.Any], str]:
        started = recording("start-query-execution")
        query_id = f"00000000-0000-4000-8000-{len(self.executions) + 1:012x}"
        self.executions[query_id] = self._run(sql)
        return started, json.dumps({**json.loads(started["body"]), "QueryExecutionId": query_id})

    def _execution(
        self, execution: Execution, request: dict[str, t.Any]
    ) -> tuple[dict[str, t.Any], str]:
        found = recording(
            "get-query-execution-failed" if execution.failed else "get-query-execution-succeeded"
        )
        body = json.loads(found["body"])
        for part in (body["QueryExecution"], body["QueryExecutionDetail"]):
            part["QueryExecutionId"] = request["QueryExecutionId"]
            part["Query"] = execution.sql
        return found, json.dumps(body)

    def _results(
        self, execution: Execution, request: dict[str, t.Any]
    ) -> tuple[dict[str, t.Any], str]:
        found = recording("get-query-results")
        body = json.loads(found["body"])
        [[cell]] = execution.rows
        shown = {} if cell is None else {"VarCharValue": str(cell)}
        body["ResultSet"]["Rows"][1] = {"Data": [shown]}
        return found, json.dumps(body)

    def _run(self, sql: str) -> Execution:
        if self.refuse(sql):
            return Execution(sql, failed=True)
        if self.keep_raw and sql.startswith('DELETE FROM "raw"'):
            return Execution(sql, failed=False)
        connection = duckdb.connect()
        for space in SPACES:
            connection.execute(f'CREATE SCHEMA "{space}"')
            for _, name in self.catalog.list_tables(space):
                table = self.catalog.load_table((space, name))
                connection.register("loaded", table.scan().to_arrow())
                connection.execute(f'CREATE TABLE "{space}"."{name}" AS SELECT * FROM loaded')
                connection.unregister("loaded")
        try:
            result = connection.execute(sql)
            rows = result.fetchall() if sql.lstrip().upper().startswith("SELECT") else []
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
