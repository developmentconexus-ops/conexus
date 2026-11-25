from __future__ import annotations

import re
import typing as t
from datetime import UTC, datetime
from decimal import Decimal

import boto3
import pyarrow as pa
import pyarrow.compute as pc

from conexus_extraction.update import UP_TO, Athena, Mode, Updater
from tests.conftest import REGION, Task

NOTAS = ("TGFCAB", "sankhya_notas")
NFE = ("TGFNFE", "sankhya_notas_nfe")
JANELA = ("TGFEFDVMRSTDIA", "efd_st_media_diaria")
WINDOW: Mode = {"kind": "WINDOW", "column": "DTREF", "reread": 2}
KEY_OF_WINDOW = ["codemp", "dtref", "codprod", "tipimposto", "tipmedia", "dtmov"]


def _rows(task: Task, space: str, name: str) -> list[dict[str, t.Any]]:
    rows: list[dict[str, t.Any]] = task.lake.load_table((space, name)).scan().to_arrow().to_pylist()
    return rows


def _updater(task: Task) -> Updater:
    athena = Athena(boto3.client("athena", region_name=REGION), "conexus-lago", "catalogo")
    return Updater(task.lake, athena)


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
    updated = _updater(task).update(
        "sankhya_notas", key=sorted(columns), mode={"kind": "FULL"}, history=True, since=None
    )
    assert updated.rows == kept
    assert not [sql for sql in task.athena.statements if sql.startswith('DELETE FROM "raw"')]
    assert raw.refresh().scan().to_arrow().num_rows == kept
    _updater(task).update(
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
    updater = _updater(task)
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


def test_a_inteira_nao_aplicada_nao_apaga_o_que_veio_depois(task: Task) -> None:
    task.athena.refuse = lambda sql: sql.startswith("MERGE")
    first = task.spec(NOTAS, whole=False)
    assert task.run(first) == 0
    assert task.aws.sent[-1]["outcome"]["code"] == "COPY_LAKE_WRITE_FAILED"
    task.athena.refuse = lambda _sql: False
    task.change("notas/199998", {"acao": "CRIAR"})
    task.change("notas/100000", {"acao": "ALTERAR"})
    second = task.spec(NOTAS, whole=False, connection=first["connectionId"])
    assert task.run(second) == 0
    current = {row["nunota"]: row for row in _rows(task, "current", "sankhya_notas")}
    source = _source(task, second, "sankhya_notas")
    assert current.keys() == source.keys()
    assert current[100000]["vlrnota"] == Decimal("1.000000000")
    assert task.aws.sent[-1]["tables"][0]["rows"] == len(source)


def _keys(task: Task, name: str = "sankhya_notas") -> list[int]:
    return [row["nunota"] for row in _rows(task, "current", name)]


def _changed_on(rows: t.Iterable[dict[str, t.Any]], day: str, *, since: bool) -> set[int]:
    return {row["nunota"] for row in rows if (str(row["dtalter"])[:10] >= day) == since}


def test_a_data_mais_antiga_relida(task: Task) -> None:
    first = task.spec(NOTAS, whole=True, start_date="2026-10-01")
    assert task.run(first) == 0
    assert set(_keys(task)) == _changed_on(
        _source(task, first, "sankhya_notas").values(), "2026-10-01", since=True
    )
    older = task.spec(NOTAS, whole=True, start_date="2026-09-01", connection=first["connectionId"])
    assert task.run(older) == 0
    source = _source(task, older, "sankhya_notas").values()
    keys = _keys(task)
    assert len(keys) == len(set(keys))
    assert set(keys) == _changed_on(source, "2026-09-01", since=True)
    assert _changed_on(source, "2026-09-01", since=False)


def test_a_data_mais_nova_relida(task: Task) -> None:
    first = task.spec(NOTAS, whole=True)
    assert task.run(first) == 0
    source = _source(task, first, "sankhya_notas").values()
    assert set(_keys(task)) == {row["nunota"] for row in source}
    newer = task.spec(NOTAS, whole=True, start_date="2026-10-01", connection=first["connectionId"])
    assert task.run(newer) == 0
    assert set(_keys(task)) == _changed_on(source, "2026-10-01", since=True)
    assert _changed_on(source, "2026-10-01", since=False)


def test_a_data_mais_nova_nao_apaga(task: Task) -> None:
    first = task.spec(NOTAS, whole=True)
    assert task.run(first) == 0
    before = set(_keys(task))
    task.change("notas/100000", {"acao": "ALTERAR"})
    newer = task.spec(NOTAS, whole=False, start_date="2026-10-15", connection=first["connectionId"])
    assert task.run(newer) == 0
    assert set(_keys(task)) == before
    assert task.aws.sent[-1]["tables"][0]["whole"] is False


def _stale(task: Task, month: str, key: int) -> None:
    current = task.lake.load_table(("current", "efd_st_media_diaria"))
    rows = current.scan().to_arrow()
    where = pc.and_(
        pc.equal(pc.utf8_slice_codeunits(pc.cast(rows["dtref"], pa.string()), 0, 7), month),
        pc.equal(rows["codprod"], 1),
    )
    stale = rows.filter(where)
    for column, value in (("codprod", key), ("_sdc_table_version", 1)):
        at = stale.schema.get_field_index(column)
        stale = stale.set_column(
            at, column, pa.array([value] * stale.num_rows, type=stale.schema.field(column).type)
        )
    current.append(stale)


def test_a_janela_relida_desde_a_data(task: Task) -> None:
    first = task.spec(JANELA, whole=True)
    assert task.run(first) == 0
    _stale(task, "2026-09", 9001)
    _stale(task, "2026-11", 9002)
    again = task.spec(JANELA, whole=True, start_date="2026-10-10", connection=first["connectionId"])
    assert task.run(again) == 0
    now = _rows(task, "current", "efd_st_media_diaria")
    stale = {row["codprod"]: row["dtref"].isoformat()[:7] for row in now if row["codprod"] > 9000}
    assert stale == {9001: "2026-09"}
    months = {row["dtref"].isoformat()[:7] for row in now}
    assert {"2026-08", "2026-09", "2026-10", "2026-11"} <= months


def test_a_data_mais_nova_nao_apaga_a_janela(task: Task) -> None:
    assert task.run(task.spec(JANELA, whole=False)) == 0
    october = [
        row
        for row in _rows(task, "current", "efd_st_media_diaria")
        if row["dtref"].isoformat()[:7] == "2026-10"
    ]
    _window_pass(task, ["2026-11"], "99")
    _updater(task).update(
        "efd_st_media_diaria", key=KEY_OF_WINDOW, mode=WINDOW, history=False, since="2026-11-10"
    )
    now = [
        row
        for row in _rows(task, "current", "efd_st_media_diaria")
        if row["dtref"].isoformat()[:7] == "2026-10"
    ]
    assert len(now) == len(october)


def _raw_row(task: Task, nunota: int, **values: t.Any) -> None:
    """A raw row of a note `current` already has, with `values` set and the newest sequence."""
    rows = task.lake.load_table(("current", "sankhya_notas")).scan().to_arrow()
    row = rows.filter(pc.equal(rows["nunota"], nunota))
    values.setdefault("_sdc_sequence", 10**15 + len(task.athena.statements))
    for column, value in values.items():
        at = row.schema.get_field_index(column)
        row = row.set_column(at, column, pa.array([value], type=row.schema.field(column).type))
    task.lake.load_table(("raw", "sankhya_notas")).append(row)


def _update_notas(task: Task) -> None:
    _updater(task).update(
        "sankhya_notas",
        key=["nunota"],
        mode={"kind": "CHANGED", "column": "DTALTER"},
        history=False,
        since=None,
    )


def test_o_marcado_apagado_sai_da_atual(task: Task) -> None:
    first = task.spec(NOTAS, whole=False)
    assert task.run(first) == 0
    [gone, kept, *_] = _keys(task)
    _raw_row(task, gone, _sdc_deleted_at=datetime(2026, 11, 25, 12, 0, tzinfo=UTC))
    _update_notas(task)
    assert gone not in _keys(task)
    assert kept in _keys(task)
    assert any(sql.startswith("MERGE") and "THEN DELETE" in sql for sql in task.athena.statements)


def test_a_mesma_chave_duas_vezes_fica_com_a_mudanca_mais_nova(task: Task) -> None:
    first = task.spec(NOTAS, whole=False)
    assert task.run(first) == 0
    [nunota, *_] = _keys(task)
    newer = datetime(2026, 11, 20, tzinfo=UTC)
    older = datetime(2026, 11, 1, tzinfo=UTC)
    _raw_row(task, nunota, dtalter=newer, vlrnota=Decimal("5"), _sdc_sequence=10**15 + 1)
    _raw_row(task, nunota, dtalter=older, vlrnota=Decimal("7"), _sdc_sequence=10**15 + 2)
    _update_notas(task)
    [row] = [r for r in _rows(task, "current", "sankhya_notas") if r["nunota"] == nunota]
    assert row["vlrnota"] == Decimal("5")


def test_o_historico_nao_devolve_a_nota_apagada(task: Task) -> None:
    task.athena.keep_raw = True
    first = task.spec(NOTAS, whole=False)
    assert task.run(first) == 0
    assert 100001 in _keys(task)
    task.change("notas/100001", {"acao": "APAGAR"})
    forced = task.spec(NOTAS, whole=True, connection=first["connectionId"])
    assert task.run(forced) == 0
    assert 100001 not in _keys(task)
    task.change("notas/100000", {"acao": "ALTERAR"})
    assert task.run(task.spec(NOTAS, whole=False, connection=first["connectionId"])) == 0
    assert 100001 not in _keys(task)
    raw = task.lake.load_table(("raw", "sankhya_notas"))
    assert raw.scan().to_arrow().num_rows > len(_keys(task))
    after = int(task.lake.load_table(("current", "sankhya_notas")).properties[UP_TO])
    assert after == max(raw.scan().to_arrow().column("_sdc_sequence").to_pylist())
