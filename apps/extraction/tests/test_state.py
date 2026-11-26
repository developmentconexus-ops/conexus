from __future__ import annotations

import json
import typing as t
from decimal import Decimal

import pytest

from conexus_extraction.contract import Spec
from tests.conftest import COMPANY, Task

NOTAS = ("TGFCAB", "sankhya_notas")
NFE = ("TGFNFE", "sankhya_notas_nfe")
STATE_ID = "copia:tap-conexus-to-target-conexus"


def _counts(task: Task) -> dict[str, dict[str, t.Any]]:
    return {table["name"]: table for table in task.aws.sent[-1]["tables"]}


def _stopping_point(task: Task, connection: str) -> dict[str, t.Any]:
    saved = json.loads((task.state / COMPANY / connection / STATE_ID / "state.json").read_text())
    return t.cast("dict[str, t.Any]", saved["completed"]["singer_state"]["bookmarks"])


def _from_point(task: Task, spec: Spec) -> int:
    saved = _stopping_point(task, spec["connectionId"])["sankhya_notas"]["replication_key_value"]
    return len(
        [row for row in task.source(spec)["sankhya_notas"] if (row["dtalter"] or "") >= saved]
    )


def test_a_segunda_rodada(task: Task) -> None:
    first = task.spec(NOTAS, NFE, whole=False)
    assert task.run(first) == 0
    before = _counts(task)
    assert before["sankhya_notas"]["whole"] is True
    total = before["sankhya_notas"]["read"]
    assert total > 100
    point = _stopping_point(task, first["connectionId"])["sankhya_notas"]["replication_key_value"]
    assert point.startswith("2026-")
    task.change("notas/100000", {"acao": "ALTERAR"})
    second = task.spec(NOTAS, NFE, whole=False, connection=first["connectionId"])
    assert task.run(second) == 0
    after = _counts(task)
    reread = len(
        [row for row in task.source(second)["sankhya_notas"] if (row["dtalter"] or "") >= point]
    )
    assert 1 < reread < total
    assert (after["sankhya_notas"]["read"], after["sankhya_notas"]["whole"]) == (reread, False)
    assert after["sankhya_notas_nfe"]["read"] == before["sankhya_notas_nfe"]["read"]
    assert after["sankhya_notas"]["rows"] == before["sankhya_notas"]["rows"] == total
    moved = _stopping_point(task, first["connectionId"])["sankhya_notas"]["replication_key_value"]
    assert moved >= point
    current = task.lake.load_table(("current", "sankhya_notas")).scan().to_arrow().to_pylist()
    assert {row["nunota"]: row["vlrnota"] for row in current}[100000] == Decimal("1.000000000")


@pytest.mark.parametrize("batch_size_rows", ["10", "1000"])
def test_a_rodada_parada_guarda_o_ponto_da_ultima_pagina_gravada(
    task: Task, monkeypatch: pytest.MonkeyPatch, batch_size_rows: str
) -> None:
    monkeypatch.setenv("TARGET_CONEXUS_BATCH_SIZE_ROWS", batch_size_rows)
    stopped = task.spec(NOTAS, whole=False)
    task.aws.refuse_after_gets = 3
    task.run(stopped)
    written = task.lake.load_table(("raw", "sankhya_notas")).scan().to_arrow().num_rows
    total = len(task.source(stopped)["sankhya_notas"])
    assert 0 < written < total
    task.aws.refuse_after_gets = None
    again = task.spec(NOTAS, whole=False, connection=stopped["connectionId"])
    assert task.run(again) == 0
    sent = _counts(task)["sankhya_notas"]
    assert (sent["read"], sent["rows"]) == (total - written, total)


def test_o_estado_fica_no_prefixo_da_ligacao(task: Task) -> None:
    spec = task.spec(NOTAS)
    assert task.run(spec) == 0
    files = {
        path.relative_to(task.state).parts[:3] for path in task.state.rglob("*") if path.is_file()
    }
    assert files == {(COMPANY, spec["connectionId"], STATE_ID)}


def test_o_modo_por_tabela(task: Task) -> None:
    first = task.spec(NOTAS, NFE, whole=False)
    assert task.run(first) == 0
    assert {name: table["whole"] for name, table in _counts(task).items()} == {
        "sankhya_notas": True,
        "sankhya_notas_nfe": True,
    }
    again = task.spec(NOTAS, NFE, whole=False, connection=first["connectionId"])
    assert task.run(again) == 0
    sent = _counts(task)
    assert (sent["sankhya_notas"]["read"], sent["sankhya_notas"]["whole"]) == (
        _from_point(task, again),
        False,
    )
    assert (sent["sankhya_notas_nfe"]["read"], sent["sankhya_notas_nfe"]["whole"]) == (3, True)
    asked = task.spec(NOTAS, NFE, whole=True, connection=first["connectionId"])
    assert task.run(asked) == 0
    sent = _counts(task)
    assert sent["sankhya_notas"]["read"] > 100
    assert sent["sankhya_notas"]["whole"] is True
    (task.state / COMPANY / first["connectionId"] / STATE_ID / "state.json").unlink()
    lost = task.spec(NOTAS, NFE, whole=False, connection=first["connectionId"])
    assert task.run(lost) == 0
    sent = _counts(task)
    assert sent["sankhya_notas"]["read"] > 100
    assert sent["sankhya_notas"]["whole"] is True
