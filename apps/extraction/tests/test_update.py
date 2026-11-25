from __future__ import annotations

import re
import typing as t
from datetime import date
from decimal import Decimal

import boto3
import pyarrow as pa
import pyarrow.compute as pc

from conexus_extraction.update import Athena, Mode, Updater
from tests.conftest import REGION, Task

NOTAS = ("TGFCAB", "sankhya_notas")
NFE = ("TGFNFE", "sankhya_notas_nfe")
JANELA = ("TGFEFDVMRSTDIA", "efd_st_media_diaria")
WINDOW: Mode = {"kind": "WINDOW", "column": "DTREF", "reread": 2}
KEY_OF_WINDOW = ["codemp", "dtref", "codprod", "tipimposto", "tipmedia", "dtmov"]


def _rows(task: Task, space: str, name: str) -> list[dict[str, t.Any]]:
    rows: list[dict[str, t.Any]] = task.lake.load_table((space, name)).scan().to_arrow().to_pylist()
    return rows


def _updater(task: Task, today: date) -> Updater:
    athena = Athena(boto3.client("athena", region_name=REGION), "conexus-lago", "catalogo")
    return Updater(task.lake, athena, lambda: today)


def _source(task: Task, spec: t.Any, name: str) -> dict[int, dict[str, t.Any]]:
    return {row["nunota"]: row for row in task.source(spec)[name]}


def test_a_atual_segue_a_fonte(task: Task) -> None:
    first = task.spec(NOTAS, whole=False)
    assert task.run(first) == 0
    task.change("notas/100000", {"acao": "ALTERAR"})
    task.change("notas/199999", {"acao": "CRIAR"})
    second = task.spec(NOTAS, whole=False, connection=first["connectionId"])
    assert task.run(second) == 0
    current = {row["nunota"]: row for row in _rows(task, "current", "sankhya_notas")}
    source = _source(task, second, "sankhya_notas")
    assert current.keys() == source.keys()
    assert {n: row["vlrnota"] for n, row in current.items()} == {
        n: Decimal(row["vlrnota"]).quantize(Decimal("1.000000000")) for n, row in source.items()
    }
    assert current[100000]["vlrnota"] == Decimal("1.000000000")
    assert task.aws.sent[-1]["tables"][0]["rows"] == len(source)
    merges = [sql for sql in task.athena.statements if sql.startswith("MERGE")]
    assert merges
    assert all(len(re.findall(r"\bWHEN\b", sql)) == 1 for sql in merges)
    widest = max(merges, key=len)
    assert widest.count(" = s.") >= 449


def test_a_limpeza(task: Task) -> None:
    first = task.spec(NOTAS, whole=False)
    assert task.run(first) == 0
    raw = task.lake.load_table(("raw", "sankhya_notas"))
    assert raw.scan().to_arrow().num_rows == 0
    assert raw.properties["conexus.versao_completa"]
    entered = _rows(task, "current", "sankhya_notas")
    assert len(entered) == task.aws.sent[-1]["tables"][0]["rows"]
    task.change("notas/100000", {"acao": "ALTERAR"})
    assert task.run(task.spec(NOTAS, whole=False, connection=first["connectionId"])) == 0
    assert raw.refresh().scan().to_arrow().num_rows == 0
    assert len(_rows(task, "current", "sankhya_notas")) == len(entered)
    cleaned = [sql for sql in task.athena.statements if sql.startswith('DELETE FROM "raw"')]
    assert len(cleaned) == 2


def test_a_inteira_troca_tudo(task: Task) -> None:
    first = task.spec(NFE, whole=False)
    assert task.run(first) == 0
    [nunota] = [row["nunota"] for row in _rows(task, "current", "sankhya_notas_nfe")][:1]
    task.change(f"nfe/{nunota}")
    assert task.run(task.spec(NFE, whole=False, connection=first["connectionId"])) == 0
    current = {row["nunota"]: row for row in _rows(task, "current", "sankhya_notas_nfe")}
    source = _source(task, first, "sankhya_notas_nfe")
    assert current.keys() == source.keys()
    assert current[nunota]["xmlcanc"] == source[nunota]["xmlcanc"]
    assert "cancelamento" in current[nunota]["xmlcanc"]
    assert task.aws.sent[-1]["tables"][0]["whole"] is True


def test_o_xml_sem_historico(task: Task) -> None:
    first = task.spec(NOTAS, NFE, whole=False)
    assert task.run(first) == 0
    nunota = _rows(task, "current", "sankhya_notas_nfe")[0]["nunota"]
    before = {row["nunota"]: row["xmlcanc"] for row in _rows(task, "current", "sankhya_notas_nfe")}
    task.change(f"nfe/{nunota}")
    task.change("notas/100001", {"acao": "APAGAR"})
    forced = task.spec(NOTAS, NFE, whole=True, connection=first["connectionId"])
    assert task.run(forced) == 0
    now = {row["nunota"]: row["xmlcanc"] for row in _rows(task, "current", "sankhya_notas_nfe")}
    assert now[nunota] != before[nunota]
    assert task.lake.load_table(("raw", "sankhya_notas_nfe")).scan().to_arrow().num_rows == 0
    assert 100001 not in {row["nunota"] for row in _rows(task, "current", "sankhya_notas")}
    assert task.lake.load_table(("raw", "sankhya_notas")).scan().to_arrow().num_rows == 0


def test_a_limpeza_pula_o_historico(task: Task) -> None:
    task.athena.keep_raw = True
    first = task.spec(NOTAS, whole=False)
    assert task.run(first) == 0
    raw = task.lake.load_table(("raw", "sankhya_notas"))
    kept = raw.scan().to_arrow().num_rows
    assert kept > 0
    task.athena.executions.clear()
    task.athena.keep_raw = False
    columns = {"nunota"}
    updated = _updater(task, date(2026, 11, 25)).update(
        "sankhya_notas", key=sorted(columns), mode={"kind": "FULL"}, history=True, since=None
    )
    assert updated.rows == kept
    assert not [sql for sql in task.athena.statements if sql.startswith('DELETE FROM "raw"')]
    assert raw.refresh().scan().to_arrow().num_rows == kept
    _updater(task, date(2026, 11, 25)).update(
        "sankhya_notas", key=sorted(columns), mode={"kind": "FULL"}, history=False, since=None
    )
    assert raw.refresh().scan().to_arrow().num_rows == 0


def _window_pass(task: Task, months: list[str], value: str) -> None:
    current = task.lake.load_table(("current", "efd_st_media_diaria")).scan().to_arrow()
    month = pc.utf8_slice_codeunits(pc.cast(current["dtref"], pa.string()), 0, 7)
    wanted = pc.and_(pc.is_in(month, pa.array(months)), pc.equal(current["codprod"], 1))
    brought = current.filter(wanted)
    count = brought.num_rows
    brought = brought.set_column(
        brought.schema.get_field_index("vlrmedia"),
        "vlrmedia",
        pa.array([Decimal(value)] * count, type=brought.schema.field("vlrmedia").type),
    )
    brought = brought.set_column(
        brought.schema.get_field_index("_sdc_sequence"),
        "_sdc_sequence",
        pa.array([10**15 + n for n in range(count)], type=pa.int64()),
    )
    task.lake.load_table(("raw", "efd_st_media_diaria")).append(brought)


def test_a_janela_troca_o_que_leu(task: Task) -> None:
    first = task.spec(JANELA, whole=False)
    assert task.run(first) == 0
    before = _rows(task, "current", "efd_st_media_diaria")
    assert len(before) == 12
    _window_pass(task, ["2026-10", "2026-11"], "99")
    updater = _updater(task, date(2026, 11, 25))
    updated = updater.update(
        "efd_st_media_diaria", key=KEY_OF_WINDOW, mode=WINDOW, history=False, since=None
    )
    assert updated.whole is False
    now = _rows(task, "current", "efd_st_media_diaria")
    by_month: dict[str, list[dict[str, t.Any]]] = {}
    for row in now:
        by_month.setdefault(row["dtref"].isoformat()[:7], []).append(row)
    assert {month: len(rows) for month, rows in by_month.items()} == {
        "0208-12": 2,
        "2026-08": 2,
        "2026-09": 2,
        "2026-10": 1,
        "2026-11": 1,
        "2109-07": 2,
    }
    assert {row["vlrmedia"] for row in by_month["2026-11"]} == {Decimal("99")}
    outside = [row for row in now if row["dtref"].isoformat()[:7] not in {"2026-10", "2026-11"}]
    assert sorted(outside, key=lambda r: (r["dtref"], r["codprod"])) == sorted(
        [row for row in before if row["dtref"].isoformat()[:7] not in {"2026-10", "2026-11"}],
        key=lambda r: (r["dtref"], r["codprod"]),
    )
    assert updated.rows == 10


def test_a_coluna_nova_na_atual(task: Task) -> None:
    first = task.spec(NOTAS, whole=False)
    assert task.run(first) == 0
    column = task.change("colunas")["coluna"].lower()
    assert column not in task.lake.load_table(("current", "sankhya_notas")).schema().column_names
    again = task.spec(NOTAS, whole=False, connection=first["connectionId"])
    assert task.run(again) == 0
    current = task.lake.load_table(("current", "sankhya_notas")).scan().to_arrow()
    assert column in current.column_names
    assert current.num_rows == task.aws.sent[-1]["tables"][0]["rows"]
    assert current.column(column).null_count >= current.num_rows - 4


def test_o_athena_recusa(task: Task) -> None:
    task.athena.refuse = lambda sql: sql.startswith("MERGE")
    spec = task.spec(NOTAS)
    assert task.run(spec) == 0
    [result] = task.aws.sent
    assert result["outcome"]["code"] == "COPY_LAKE_WRITE_FAILED"
    assert result["outcome"]["table"] == "sankhya_notas"
    assert result["tables"][0]["rows"] is None
    assert task.lake.load_table(("raw", "sankhya_notas")).scan().to_arrow().num_rows > 100
