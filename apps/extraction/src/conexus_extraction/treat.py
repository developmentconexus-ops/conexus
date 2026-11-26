from __future__ import annotations

import json
import re
import typing as t
from collections.abc import Callable
from pathlib import Path

from botocore.exceptions import BotoCoreError, ClientError

from conexus_extraction.contract import (
    Complete,
    ModelEnd,
    ReplyAddress,
    TreatError,
    TreatModel,
    TreatResult,
    TreatSpec,
    checked_treat,
)
from conexus_extraction.update import Athena, UpdateFailed

if t.TYPE_CHECKING:
    from dbt.artifacts.schemas.run import RunResult
    from dbt.cli.main import dbtRunnerResult

CATALOG = "lago"
PROJECT_NAME = "conexus_tratamento"
# The lines dbt-athena 1.11.2 sends to Athena before a model's first line of SQL: its comment, the
# seven of `create table ... as` and the one the `config` call leaves; each `depends_on` adds one.
LINES_BEFORE_THE_SQL = 9
ATHENA_CODE = re.compile(r"([A-Z][A-Z_]{2,63}):")
ATHENA_LINE = re.compile(r"line (\d+):\d+")
ENGINE_FAILED: t.Final = "TREAT_ENGINE_FAILED"
# The areas are the lake recipe's, and the treatment role may create none: dbt must not try.
MACROS = {
    "generate_schema_name": (
        "{% macro generate_schema_name(custom_schema_name, node) -%}\n"
        "  {{ custom_schema_name | trim }}\n"
        "{%- endmacro %}\n"
    ),
    "athena__create_schema": ("{% macro athena__create_schema(relation) -%}\n{%- endmacro %}\n"),
}

Log = Callable[..., None]


def database_of(bucket: str) -> str:
    return f"s3tablescatalog/{bucket}"


def workgroup_of(bucket: str) -> str:
    return f"{bucket}-tratamento"


def _settings(region: str, bucket: str) -> dict[str, object]:
    """JSON, which dbt reads as YAML, so no value needs quoting."""
    database = database_of(bucket)
    profile = {
        "type": "athena",
        "region_name": region,
        "database": database,
        "schema": "tratado",
        "work_group": workgroup_of(bucket),
        "threads": 1,
    }
    catalog = {
        "name": CATALOG,
        "type": "s3_tables",
        "table_format": "iceberg",
        "config": {"athena": {"catalog_database": database, "file_format": "parquet"}},
    }
    return {
        "dbt_project.yml": {
            "name": PROJECT_NAME,
            "version": "1.0",
            "profile": "conexus",
            "model-paths": ["models"],
            "macro-paths": ["macros"],
            "flags": {"use_catalogs_v2": True},
        },
        "catalogs.yml": {"catalogs": [catalog]},
        "profiles.yml": {"conexus": {"target": "prod", "outputs": {"prod": profile}}},
    }


def _model_file(model: TreatModel) -> str:
    config = (
        f"{{{{ config(materialized='table', catalog_name='{CATALOG}', "
        f"schema='{model['layer']}', alias='{model['table']}') }}}}"
    )
    depends = [f"-- depends_on: {{{{ ref('{name}') }}}}" for name in model["after"]]
    return "\n".join([config, *depends, model["sql"]]) + "\n"


def _write_project(spec: TreatSpec, project: Path) -> None:
    bucket = spec["lake"]["bucketArn"].rsplit("/", 1)[-1]
    for name, content in _settings(spec["lake"]["region"], bucket).items():
        (project / name).write_text(json.dumps(content))
    (project / "macros").mkdir()
    for name, text in MACROS.items():
        (project / "macros" / f"{name}.sql").write_text(text)
    for model in spec["models"]:
        folder = project / "models" / model["layer"]
        folder.mkdir(parents=True, exist_ok=True)
        (folder / f"{model['name']}.sql").write_text(_model_file(model))


def _failure_of(message: str, model: TreatModel) -> tuple[str, int | None]:
    # dbt names the model on the first line and gives the engine's words on the second; Athena's
    # refusal of a statement it never runs is one line.
    lines = message.split("\n")
    said = lines[min(1, len(lines) - 1)].strip()
    code = ATHENA_CODE.match(said)
    at = ATHENA_LINE.search(said)
    line = None
    if at is not None:
        own = int(at.group(1)) - LINES_BEFORE_THE_SQL - len(model["after"])
        if 1 <= own <= len(model["sql"].split("\n")):
            line = own
    return ENGINE_FAILED if code is None else code.group(1), line


def _built(spec: TreatSpec, project: Path) -> dbtRunnerResult:
    # dbt takes about a second to import, which a copy run must not pay.
    from dbt.cli.main import dbtRunner

    folders = ["--project-dir", str(project), "--profiles-dir", str(project)]
    outputs = ["--target-path", str(project / "target"), "--log-path", str(project / "logs")]
    quiet = ["--no-send-anonymous-usage-stats", "--no-version-check", "--log-level-file", "none"]
    return dbtRunner().invoke([*quiet, "build", "--select", *spec["select"], *folders, *outputs])


def _rows(athena: Athena, model: TreatModel) -> int:
    return athena.number(f'SELECT count(*) FROM "{model["layer"]}"."{model["table"]}"')


def _end(node: RunResult | None, model: TreatModel, athena: Athena, run: str, log: Log) -> ModelEnd:
    name = model["name"]
    if node is None or node.status == "skipped":
        return {"name": name, "status": "SKIPPED"}
    if node.status == "success":
        try:
            return {"name": name, "status": "BUILT", "rows": _rows(athena, model)}
        except (UpdateFailed, BotoCoreError, ClientError) as error:
            log("TREAT_COUNT_FAILED", runId=run, model=name, error=type(error).__name__)
            return {"name": name, "status": "FAILED", "failure": ENGINE_FAILED, "line": None}
    code, line = _failure_of(node.message or "", model)
    log("TREAT_MODEL_FAILED", runId=run, model=name, code=code, line=line)
    return {"name": name, "status": "FAILED", "failure": code, "line": line}


def _result(
    address: ReplyAddress | TreatSpec, outcome: Complete | TreatError, models: list[ModelEnd]
) -> TreatResult:
    return checked_treat(
        {
            "type": "TREAT_RESULT",
            "version": 1,
            "runId": address["runId"],
            "attempt": address["attempt"],
            "outcome": outcome,
            "models": models,
        }
    )


def refused(address: ReplyAddress) -> TreatResult:
    return _result(address, {"kind": "ERROR", "code": "TREAT_SPEC_INVALID"}, [])


def treated(spec: TreatSpec, project: Path, athena: Athena, log: Log) -> TreatResult:
    from dbt.artifacts.schemas.run import RunExecutionResult

    _write_project(spec, project)
    done = _built(spec, project)
    if not isinstance(done.result, RunExecutionResult):
        log("TREAT_ENGINE_FAILED", runId=spec["runId"], error=type(done.exception).__name__)
        return _result(spec, {"kind": "ERROR", "code": ENGINE_FAILED}, [])
    ended = {node.node.name: node for node in done.result.results}
    models = {model["name"]: model for model in spec["models"]}
    ends = [
        _end(ended.get(name), models[name], athena, spec["runId"], log) for name in spec["select"]
    ]
    return _result(spec, {"kind": "COMPLETE"}, ends)
