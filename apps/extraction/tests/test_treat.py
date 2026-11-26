from __future__ import annotations

import json
import os
import signal
import typing as t
import uuid
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from pathlib import Path

import pyarrow as pa
import pytest
from pyiceberg.catalog import load_catalog

from conexus_extraction import entry
from conexus_extraction.contract import Lake, TreatModel, TreatSpec
from tests.athena_double import AthenaDouble, Refusal
from tests.conftest import COMPANY, QUEUE, REGION, Aws

BUCKET = "conexus-k3x9a0b1c2d3"
STATE = "conexus-estado-111122223333-us-east-2"
PEOPLE = (
    "select codparc as parceiro, nomeparc as nome, cast(limite as decimal(15,2)) as limite, "
    'dtcad as cadastrado_em from "current"."sankhya_parceiros"'
)
PER_DAY = (
    "select cadastrado_em, count(*) as parceiros, sum(limite) as limite "
    'from "tratado"."parceiros" group by 1'
)


def model(
    layer: t.Literal["tratado", "negocio"], table: str, sql: str, after: tuple[str, ...] = ()
) -> TreatModel:
    return {
        "name": f"{layer}__{table}",
        "layer": layer,
        "table": table,
        "sql": sql,
        "after": list(after),
    }


def recorded_model_statements(scenario: str) -> list[str]:
    recorded = (Path(__file__).parent / "recordings" / f"{scenario}.jsonl").read_text()
    sent = [
        json.loads(line["request"])["QueryString"]
        for line in map(json.loads, recorded.splitlines()[1:])
        if line["api"] == "StartQueryExecution"
    ]
    return [statement for statement in sent if "\ncreate table " in statement]


@dataclass
class Treatment:
    aws: Aws
    athena: AthenaDouble

    def spec(self, *models: TreatModel, select: tuple[str, ...] | None = None) -> TreatSpec:
        return {
            "version": 1,
            "runId": str(uuid.uuid4()),
            "attempt": 1,
            "companyId": COMPANY,
            "lake": {
                "bucketArn": f"arn:aws:s3tables:{REGION}:111122223333:bucket/{BUCKET}",
                "region": REGION,
            },
            "queueUrl": QUEUE,
            "models": list(models),
            "select": list(select or (each["name"] for each in models)),
        }

    def run(self, spec: object, **variables: str) -> int:
        key = f"tratamento/{COMPANY}/{uuid.uuid4()}-1.json"
        self.aws.objects[f"{STATE}/{key}"] = json.dumps(spec)
        environ = {name: v for name, v in os.environ.items() if name != entry.RUN_PARAMETER}
        environ = {**environ, entry.TREAT_OBJECT: f"s3://{STATE}/{key}", **variables}
        return entry.run(environ, no_copy_catalog)

    def statements(self) -> list[str]:
        return [sql for sql in self.athena.statements if "\ncreate table " in sql]

    def rows(self, space: str, table: str) -> list[dict[str, object]]:
        loaded = self.athena.catalog.load_table((space, table))
        return list(loaded.scan().to_arrow().to_pylist())


def no_copy_catalog(lake: Lake) -> dict[str, str]:
    raise AssertionError("a treatment run opens no copy catalog")


@pytest.fixture
def treat(aws: Aws, tmp_path: Path) -> Treatment:
    catalog = load_catalog(
        "lake",
        type="sql",
        uri=f"sqlite:///{tmp_path}/catalog.db",
        warehouse=f"file://{tmp_path}/warehouse",
    )
    for space in ("raw", "current", "tratado", "negocio"):
        catalog.create_namespace(space)
    people = pa.table(
        {
            "codparc": [1, 2, 3],
            "nomeparc": ["alfa peça 1", "beta peça 2", "gama peça 3"],
            "limite": [Decimal("10.00"), Decimal("20.50"), Decimal("30.25")],
            "dtcad": [date(2026, 11, 1), date(2026, 11, 1), date(2026, 11, 2)],
        }
    )
    notes = pa.table({"nunota": [1, 2], "divisor": [1, 0]})
    for name, rows in (("sankhya_parceiros", people), ("sankhya_notas", notes)):
        catalog.create_table(("current", name), schema=rows.schema).append(rows)
    aws.athena = AthenaDouble(catalog)
    return Treatment(aws, aws.athena)


def test_two_layers_are_built_in_order_and_rebuilt_by_dropping_each(treat: Treatment) -> None:
    people = model("tratado", "parceiros", PEOPLE)
    per_day = model("negocio", "limite_por_dia", PER_DAY, after=(people["name"],))
    spec = treat.spec(per_day, people)

    assert treat.run(spec) == 0

    [result] = treat.aws.sent
    assert result == {
        "type": "TREAT_RESULT",
        "version": 1,
        "runId": spec["runId"],
        "attempt": 1,
        "outcome": {"kind": "COMPLETE"},
        "models": [
            {"name": per_day["name"], "status": "BUILT", "rows": 2},
            {"name": people["name"], "status": "BUILT", "rows": 3},
        ],
    }
    assert treat.statements() == recorded_model_statements("treat-first-build")
    assert treat.athena.workgroups == {f"{BUCKET}-tratamento"}
    assert treat.athena.dropped == []

    assert treat.run(treat.spec(per_day, people)) == 0

    assert treat.athena.dropped == ["tratado.parceiros", "negocio.limite_por_dia"]
    assert treat.aws.sent[1]["models"] == result["models"]
    assert len(treat.rows("negocio", "limite_por_dia")) == 2


def test_a_failure_in_the_middle_skips_what_reads_it_and_builds_the_rest(
    treat: Treatment,
) -> None:
    people = model("tratado", "parceiros", PEOPLE)
    ratio = model(
        "tratado",
        "falha",
        'select "nunota" as nota, "nunota" / "divisor" as razao from "current"."sankhya_notas"',
    )
    on_ratio = model(
        "negocio", "razao", 'select nota from "tratado"."falha"', after=(ratio["name"],)
    )
    per_day = model("negocio", "limite_por_dia", PER_DAY, after=(people["name"],))
    treat.athena.refusals["falha"] = Refusal("treat-ctas-failed")

    assert treat.run(treat.spec(people, ratio, on_ratio, per_day)) == 0

    [result] = treat.aws.sent
    assert result["outcome"] == {"kind": "COMPLETE"}
    assert result["models"] == [
        {"name": people["name"], "status": "BUILT", "rows": 3},
        {"name": ratio["name"], "status": "FAILED", "failure": "DIVISION_BY_ZERO", "line": None},
        {"name": on_ratio["name"], "status": "SKIPPED"},
        {"name": per_day["name"], "status": "BUILT", "rows": 2},
    ]
    assert "Division" not in json.dumps(result)


@pytest.mark.parametrize(
    ("scenario", "failed", "code", "line"),
    [
        (
            "treat-cast-failed",
            model(
                "tratado",
                "conversao",
                'select cast("nomeparc" as integer) as numero from "current"."sankhya_parceiros"',
            ),
            "INVALID_CAST_ARGUMENT",
            None,
        ),
        (
            "treat-column-missing",
            model(
                "tratado",
                "sem_coluna",
                'select "coluna_que_nao_existe" from "current"."sankhya_parceiros"',
            ),
            "COLUMN_NOT_FOUND",
            1,
        ),
        (
            "treat-source-missing",
            model("tratado", "sem_origem", 'select codigo from "current"."tabela_que_nao_existe"'),
            "TABLE_NOT_FOUND",
            1,
        ),
        (
            "treat-syntax-error",
            model(
                "tratado",
                "sintaxe",
                'select codparc as segredo_do_sql from "current"."sankhya_parceiros" where where',
            ),
            "TREAT_ENGINE_FAILED",
            1,
        ),
    ],
)
def test_each_recorded_failure_gives_athenas_type_and_the_line_of_the_persons_sql(
    treat: Treatment, scenario: str, failed: TreatModel, code: str, line: int | None
) -> None:
    treat.athena.refusals[failed["table"]] = Refusal(scenario)

    assert treat.run(treat.spec(failed)) == 0

    [result] = treat.aws.sent
    assert result["models"] == [
        {"name": failed["name"], "status": "FAILED", "failure": code, "line": line}
    ]
    assert treat.statements() == recorded_model_statements(scenario)


@pytest.mark.parametrize(
    ("at", "line"),
    [("coluna_que_nao_existe", 3), ("format='parquet'", None)],
)
def test_the_line_discounts_what_dbt_puts_before_the_sql(
    treat: Treatment, at: str, line: int | None
) -> None:
    people = model("tratado", "parceiros", PEOPLE)
    notes = model("tratado", "notas", 'select nunota from "current"."sankhya_notas"')
    lines = model(
        "negocio",
        "linhas",
        '\nselect parceiro,\n  coluna_que_nao_existe\nfrom "tratado"."parceiros"',
        after=(people["name"], notes["name"]),
    )
    treat.athena.refusals["linhas"] = Refusal("treat-column-missing", line_of=at)

    assert treat.run(treat.spec(people, notes, lines)) == 0

    [result] = treat.aws.sent
    assert result["models"][2] == {
        "name": lines["name"],
        "status": "FAILED",
        "failure": "COLUMN_NOT_FOUND",
        "line": line,
    }


def test_a_missing_area_gives_no_athena_type(treat: Treatment) -> None:
    people = model("tratado", "parceiros", PEOPLE)
    per_day = model("negocio", "limite_por_dia", PER_DAY, after=(people["name"],))
    treat.athena.refusals["limite_por_dia"] = Refusal("treat-area-absent")

    assert treat.run(treat.spec(people, per_day)) == 0

    assert treat.aws.sent[0]["models"][1] == {
        "name": per_day["name"],
        "status": "FAILED",
        "failure": "TREAT_ENGINE_FAILED",
        "line": None,
    }
    assert treat.statements() == recorded_model_statements("treat-area-absent")


@pytest.mark.parametrize(
    ("change", "variables"),
    [
        ({"models": [model("tratado", "parceiros", 'select {{ env_var("HOME") }}')]}, {}),
        ({"companyId": "outra"}, {}),
        ({}, {entry.RUN_PARAMETER: "/conexus/copia/x/y"}),
    ],
)
def test_a_refused_specification_runs_nothing_and_is_answered(
    treat: Treatment, change: dict[str, object], variables: dict[str, str]
) -> None:
    spec = {**treat.spec(model("tratado", "parceiros", PEOPLE)), **change}

    assert treat.run(spec, **variables) == 0

    assert treat.aws.sent == [
        {
            "type": "TREAT_RESULT",
            "version": 1,
            "runId": spec["runId"],
            "attempt": 1,
            "outcome": {"kind": "ERROR", "code": "TREAT_SPEC_INVALID"},
            "models": [],
        }
    ]
    assert treat.athena.statements == []


def test_a_model_whose_rows_cannot_be_counted_is_not_reported_built(treat: Treatment) -> None:
    people = model("tratado", "parceiros", PEOPLE)
    treat.athena.refuse = lambda sql: sql.startswith("SELECT count(*)")

    assert treat.run(treat.spec(people)) == 0

    assert treat.aws.sent[0]["models"] == [
        {"name": people["name"], "status": "FAILED", "failure": "TREAT_ENGINE_FAILED", "line": None}
    ]


def test_a_task_asked_to_stop_during_the_build_sends_no_result(treat: Treatment) -> None:
    def stop(_sql: str) -> bool:
        os.kill(os.getpid(), signal.SIGTERM)
        return False

    treat.athena.refuse = stop

    assert treat.run(treat.spec(model("tratado", "parceiros", PEOPLE))) == 1

    assert treat.aws.sent == []


def test_with_no_address_to_answer_the_task_only_fails(
    treat: Treatment, monkeypatch: pytest.MonkeyPatch
) -> None:
    spec = treat.spec(model("tratado", "parceiros", PEOPLE))

    assert treat.run({**spec, "queueUrl": None}) == 1
    treat.aws.objects.clear()
    monkeypatch.delenv(entry.RUN_PARAMETER, raising=False)
    unread = {**os.environ, entry.TREAT_OBJECT: f"s3://{STATE}/tratamento/nada.json"}
    assert entry.run(unread, no_copy_catalog) == 1
    assert entry.run(dict(os.environ), no_copy_catalog) == 1

    assert treat.aws.sent == []
    assert treat.athena.statements == []


def test_a_build_dbt_cannot_start_ends_the_run_in_engine_failed(treat: Treatment) -> None:
    broken = model("negocio", "orfao", "select 1 as um", after=("tratado__que_nao_veio",))

    assert treat.run(treat.spec(broken)) == 0

    assert treat.aws.sent[0]["outcome"] == {"kind": "ERROR", "code": "TREAT_ENGINE_FAILED"}
    assert treat.aws.sent[0]["models"] == []
