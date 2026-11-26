from __future__ import annotations

import base64
import contextlib
import functools
import json
import threading
import typing as t
from collections.abc import Iterator, Mapping, Sequence
from decimal import ROUND_HALF_UP, Context, Decimal
from pathlib import Path

import boto3
import pyarrow as pa
from pyiceberg.catalog import Catalog, load_catalog
from singer_sdk import BatchSink, Target
from singer_sdk import typing as th

RAW = "raw"
CURRENT = "current"
COMPLETE_VERSION = "conexus.versao_completa"

DECIMAL = pa.decimal128(38, 9)
ROUNDING = Context(prec=2 * 38, rounding=ROUND_HALF_UP)


class RunClosed(Exception):
    pass


def _decimal_type(prop: Mapping[str, t.Any]) -> pa.DataType:
    precision, scale = prop.get("precision"), prop.get("scale")
    if precision is None or scale is None:
        return DECIMAL
    return pa.decimal128(precision, scale)


def _arrow_type(prop: Mapping[str, t.Any]) -> pa.DataType:
    types = set(prop.get("type", []))
    fmt = prop.get("format")
    if types & {"object", "array"}:
        return pa.string()
    if "integer" in types:
        return pa.int64()
    if "boolean" in types:
        return pa.bool_()
    if fmt == "x-singer.decimal" or "number" in types:
        return _decimal_type(prop)
    if prop.get("contentEncoding") == "base64":
        return pa.binary()
    if fmt == "date":
        return pa.date32()
    if fmt == "date-time":
        return pa.timestamp("us")
    return pa.string()


def arrow_schema(schema: Mapping[str, t.Any]) -> pa.Schema:
    return pa.schema(
        pa.field(name, _arrow_type(prop), nullable=True)
        for name, prop in schema["properties"].items()
    )


def _cell(kind: pa.DataType, value: t.Any) -> tuple[t.Any, bool]:
    """The value as Arrow takes it, and whether rounding it to the default scale changed it."""
    if value is None:
        return None, False
    if pa.types.is_decimal(kind):
        number = Decimal(value) if isinstance(value, str) else value
        if kind != DECIMAL or not isinstance(number, Decimal):
            return number, False
        fitted = number.quantize(Decimal(1).scaleb(-DECIMAL.scale), context=ROUNDING)
        return fitted, fitted != number
    if pa.types.is_binary(kind):
        return base64.b64decode(value), False
    if pa.types.is_string(kind) and not isinstance(value, str):
        return json.dumps(value, default=str, ensure_ascii=False), False
    return value, False


class Batch(t.NamedTuple):
    table: pa.Table
    rounded: int


def arrow_table(schema: pa.Schema, records: Sequence[Mapping[str, t.Any]]) -> Batch:
    columns: dict[str, pa.Array] = {}
    rounded = 0
    for field in schema:
        cells = [_cell(field.type, record.get(field.name)) for record in records]
        rounded += sum(changed for _, changed in cells)
        columns[field.name] = pa.array([cell for cell, _ in cells], type=field.type)
    return Batch(pa.Table.from_pydict(columns, schema=schema), rounded)


class LakeSink(BatchSink):
    def __init__(
        self,
        target: TargetConexus,
        stream_name: str,
        schema: dict[str, t.Any],
        key_properties: Sequence[str] | None,
    ) -> None:
        self.lake = target
        super().__init__(target, stream_name, schema, key_properties)

    def setup(self) -> None:
        super().setup()
        self._arrow = arrow_schema(self.schema)
        properties = self.lake.properties_of(self.stream_name)
        with self.lake.writing(self.stream_name):
            self.lake.confirm_run()
            catalog = self.lake.catalog
            for namespace in (CURRENT, RAW):
                catalog.create_table_if_not_exists(
                    (namespace, self.stream_name),
                    schema=self._arrow,
                    properties=properties,
                )
            raw = catalog.load_table((RAW, self.stream_name))
            with raw.update_schema() as update:
                update.union_by_name(self._arrow)
        self._raw = raw

    def process_record(self, record: dict[str, t.Any], context: dict[str, t.Any]) -> None:
        super().process_record(record, context)
        self.lake.count(self.stream_name, read=1)

    def process_batch(self, context: dict[str, t.Any]) -> None:
        records = context.get("records", [])
        if not records:
            return
        with self.lake.writing(self.stream_name):
            batch = arrow_table(self._arrow, records)
            self.lake.confirm_run()
            self._raw.append(batch.table)
        self.lake.count(self.stream_name, written=len(records), rounded=batch.rounded)

    def activate_version(self, new_version: int) -> None:
        # The SDK calls this without draining the sink (target_base.py:448).
        self.lake.drain_one(self)
        with (
            self.lake.writing(self.stream_name),
            self._raw.transaction() as transaction,
        ):
            transaction.set_properties({COMPLETE_VERSION: str(new_version)})


class TargetConexus(Target):
    name = "target-conexus"
    default_sink_class = LakeSink
    config_jsonschema = th.PropertiesList(
        # Text, not an object: Meltano drops an object's dotted keys, such as rest.sigv4-enabled.
        th.Property("catalog", th.StringType, required=True),
        th.Property(
            "tables",
            th.ObjectType(
                additional_properties=th.ObjectType(
                    th.Property("origin", th.StringType, required=True),
                    th.Property("label", th.StringType, required=True),
                    th.Property("meanings", th.ObjectType(additional_properties=th.StringType)),
                )
            ),
            required=True,
        ),
        th.Property("run_parameter", th.StringType, required=True),
        th.Property("region", th.StringType, required=True),
        th.Property("report_path", th.StringType, required=True),
    ).to_dict()

    def __init__(self, *args: t.Any, **kwargs: t.Any) -> None:
        super().__init__(*args, **kwargs)
        self._ssm = boto3.client("ssm", region_name=self.config["region"])
        self._lock = threading.Lock()
        self._report: dict[str, t.Any] = {
            "tables": {},
            "closed": False,
            "failed": None,
            "ended": [],
        }

    def _process_state_message(self, message_dict: dict[str, t.Any]) -> None:
        super()._process_state_message(message_dict)
        # Without this the SDK hands a state on at the input's end or past 5 minutes, and a stopped
        # round loses the point of the rows it wrote.
        self.drain_all()
        for stream, bookmark in message_dict["value"].get("bookmarks", {}).items():
            if self._pass_just_ended(stream, bookmark):
                self.report(ended=[*self._report["ended"], stream])

    def _pass_just_ended(self, stream: str, bookmark: Mapping[str, t.Any]) -> bool:
        unmarked = stream not in self._report["ended"]
        return "pass" not in bookmark and unmarked and self.sink_exists(stream)

    @functools.cached_property
    def catalog(self) -> Catalog:
        return load_catalog("lake", **json.loads(self.config["catalog"]))

    @contextlib.contextmanager
    def writing(self, stream: str) -> Iterator[None]:
        try:
            yield
        except RunClosed:
            self.report(closed=True)
            raise
        except Exception:
            self.report(failed={"table": stream})
            raise

    def properties_of(self, stream: str) -> dict[str, str]:
        table = self.config["tables"][stream]
        meanings = table.get("meanings") or {}
        return {
            "conexus.origem": table["origin"],
            "conexus.rotulo": table["label"],
            **{f"conexus.significado.{column.lower()}": m for column, m in meanings.items()},
        }

    def confirm_run(self) -> None:
        try:
            self._ssm.get_parameter(Name=self.config["run_parameter"])
        except self._ssm.exceptions.ParameterNotFound as gone:
            raise RunClosed from gone

    def count(self, stream: str, *, read: int = 0, written: int = 0, rounded: int = 0) -> None:
        with self._lock:
            counts = self._report["tables"].setdefault(
                stream, {"read": 0, "written": 0, "rounded": 0}
            )
            counts["read"] += read
            counts["written"] += written
            counts["rounded"] += rounded
            if written:
                self._write_report()

    def report(self, **fields: t.Any) -> None:
        with self._lock:
            self._report.update(fields)
            self._write_report()

    def _write_report(self) -> None:
        Path(self.config["report_path"]).write_text(json.dumps(self._report))
