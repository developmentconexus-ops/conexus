from __future__ import annotations

import time
import typing as t
from collections.abc import Callable, Sequence

from pyiceberg.catalog import Catalog

from conexus_extraction.target import COMPLETE_VERSION, CURRENT, RAW

UP_TO = "conexus.atualizado_ate"
APPLIED = "conexus.passada.aplicada"
SEQUENCE = "_sdc_sequence"
VERSION = "_sdc_table_version"
POLL_SECONDS = 0.2
FINISHED = {"SUCCEEDED", "FAILED", "CANCELLED"}


class Mode(t.TypedDict, total=False):
    kind: t.Required[t.Literal["CHANGED", "WINDOW", "FULL"]]
    column: str
    reread: int


class UpdateCounts(t.NamedTuple):
    """The rows `current` holds, and whether the pass applied read the whole table."""

    rows: int
    whole: bool


class UpdateFailed(Exception):
    """`code` is Athena's error type, never its sentence; `cause` names any other failure."""

    def __init__(self, code: int | None, cause: str | None = None) -> None:
        super().__init__(code, cause)
        self.code = code
        self.cause = cause


class Athena:
    """The company's workgroup: one statement at a time, to its end."""

    def __init__(
        self,
        client: t.Any,
        workgroup: str,
        catalog: str,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        self._client = client
        self._workgroup = workgroup
        self._catalog = catalog
        self._sleep = sleep

    def run(self, sql: str) -> str:
        query: str = self._client.start_query_execution(
            QueryString=sql,
            WorkGroup=self._workgroup,
            QueryExecutionContext={"Catalog": self._catalog, "Database": CURRENT},
        )["QueryExecutionId"]
        self._finished(query)
        return query

    def text(self, sql: str) -> str | None:
        """The one cell of a query that selects one; null when it is null."""
        rows = self._client.get_query_results(QueryExecutionId=self.run(sql))["ResultSet"]["Rows"]
        cell: str | None = rows[1]["Data"][0].get("VarCharValue")
        return cell

    def number(self, sql: str) -> int:
        cell = self.text(sql)
        return 0 if cell is None else int(cell)

    def _finished(self, query: str) -> None:
        while True:
            status = self._client.get_query_execution(QueryExecutionId=query)["QueryExecution"][
                "Status"
            ]
            if status["State"] in FINISHED:
                break
            self._sleep(POLL_SECONDS)
        if status["State"] != "SUCCEEDED":
            raise UpdateFailed(status.get("AthenaError", {}).get("ErrorType"))


def _name(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def _month_of(column: str) -> str:
    return f"substr(CAST({_name(column)} AS varchar), 1, 7)"


def _slice(table: str, key: Sequence[str], mode: Mode, bounds: tuple[int, int]) -> str:
    """The latest raw row of each key that has not entered `current`, by change, then arrival."""
    keys = ", ".join(_name(column) for column in key)
    after, up_to = bounds
    changed = (
        f"{_name(mode['column'].lower())} DESC NULLS LAST, " if mode["kind"] == "CHANGED" else ""
    )
    return (
        f"(SELECT * FROM (SELECT b.*, row_number() OVER (PARTITION BY {keys} "
        f"ORDER BY {changed}{SEQUENCE} DESC) AS rn FROM {_name(RAW)}.{_name(table)} b "
        f"WHERE {SEQUENCE} > {after} AND {SEQUENCE} <= {up_to}) WHERE rn = 1)"
    )


def _merges(
    table: str, key: Sequence[str], columns: Sequence[str], mode: Mode, bounds: tuple[int, int]
) -> list[str]:
    """One case per statement: Athena fails a `MERGE` of two cases on a wide table."""
    on = " AND ".join(f"a.{_name(column)} = s.{_name(column)}" for column in key)
    head = (
        f"MERGE INTO {_name(CURRENT)}.{_name(table)} a USING {_slice(table, key, mode, bounds)} s "
        f"ON ({on}) "
    )
    sets = ", ".join(f"{_name(c)} = s.{_name(c)}" for c in columns if c not in key)
    names = ", ".join(_name(column) for column in columns)
    values = ", ".join(f"s.{_name(column)}" for column in columns)
    return [
        f"{head}WHEN MATCHED THEN UPDATE SET {sets}",
        f"{head}WHEN NOT MATCHED THEN INSERT ({names}) VALUES ({values})",
    ]


class Updater:
    """`current` follows `raw` at the mode's grain, then `raw` is cleaned."""

    def __init__(self, catalog: Catalog, athena: Athena) -> None:
        self._catalog = catalog
        self._athena = athena

    def update(
        self,
        table: str,
        *,
        key: Sequence[str],
        mode: Mode,
        history: bool,
        since: str | None,
    ) -> UpdateCounts:
        try:
            return self._update(table, key=key, mode=mode, history=history, since=since)
        except UpdateFailed:
            raise
        except Exception as error:
            raise UpdateFailed(None, type(error).__name__) from error

    def _update(
        self,
        table: str,
        *,
        key: Sequence[str],
        mode: Mode,
        history: bool,
        since: str | None,
    ) -> UpdateCounts:
        raw = self._catalog.load_table((RAW, table))
        with self._catalog.load_table((CURRENT, table)).update_schema() as evolving:
            evolving.union_by_name(raw.schema())
        current = self._catalog.load_table((CURRENT, table))
        columns = [field.name for field in current.schema().fields]
        after = int(current.properties.get(UP_TO, "0"))
        top = self._athena.number(f"SELECT max({SEQUENCE}) FROM {_name(RAW)}.{_name(table)}")
        complete = raw.properties.get(COMPLETE_VERSION)
        whole = complete is not None and complete != current.properties.get(APPLIED)
        bounds = (after, max(after, top))
        if top > after:
            for statement in _merges(table, key, columns, mode, bounds):
                self._athena.run(statement)
        if whole:
            scope = ""
            if mode["kind"] == "WINDOW" and since is not None:
                scope = f" AND {_month_of(mode['column'].lower())} >= '{since[:7]}'"
            self._athena.run(self._absent(table, int(t.cast("str", complete))) + scope)
        elif mode["kind"] == "WINDOW" and top > after:
            self._athena.run(self._absent_in_months(table, mode, bounds))
        saved = {UP_TO: str(bounds[1])}
        if whole:
            saved[APPLIED] = t.cast("str", complete)
        with current.transaction() as transaction:
            transaction.set_properties(saved)
        if not history and bounds[1] > 0:
            self._athena.run(
                f"DELETE FROM {_name(RAW)}.{_name(table)} WHERE {SEQUENCE} <= {bounds[1]}"
            )
        rows = self._athena.number(f"SELECT count(*) FROM {_name(CURRENT)}.{_name(table)}")
        return UpdateCounts(rows=rows, whole=whole)

    def _absent(self, table: str, version: int) -> str:
        """A row the whole pass did not rewrite keeps an older version: the source lost it."""
        return f"DELETE FROM {_name(CURRENT)}.{_name(table)} WHERE {VERSION} < {version}"

    def _absent_in_months(self, table: str, mode: Mode, bounds: tuple[int, int]) -> str:
        """A window pass deletes, in the months it brought, the rows it did not rewrite."""
        month = _month_of(mode["column"].lower())
        after, up_to = bounds
        return (
            f"DELETE FROM {_name(CURRENT)}.{_name(table)} WHERE {month} IN "
            f"(SELECT {month} FROM {_name(RAW)}.{_name(table)} "
            f"WHERE {SEQUENCE} > {after} AND {SEQUENCE} <= {up_to}) AND {SEQUENCE} <= {after}"
        )
