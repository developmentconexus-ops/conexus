from __future__ import annotations

import json
import time
import typing as t
from collections.abc import Callable
from pathlib import Path

import pytest
from botocore.exceptions import ClientError

from conexus_extraction.contract import Progress, checked_progress
from conexus_extraction.progress import Beat
from tests.conftest import Task

NOTAS = ("TGFCAB", "sankhya_notas")
NFE = ("TGFNFE", "sankhya_notas_nfe")
SPEC = {
    "runId": "0f7c3a52-5c6e-4d1a-9b3e-2a6f1c8d4e70",
    "attempt": 1,
    "tables": [
        {"source": "TGFCAB", "name": "notas", "whole": True},
        {"source": "TGFITE", "name": "itens", "whole": True},
    ],
}
STARTED = "2026-11-27T17:00:00.000Z"
ENDED = "2026-11-27T17:01:00.000Z"


def _report(path: Path, **fields: t.Any) -> None:
    body = {"tables": {}, "closed": False, "failed": None, "ended": [], **fields}
    path.write_text(json.dumps(body))


def _until(done: Callable[[], bool], seconds: float = 5.0) -> None:
    deadline = time.monotonic() + seconds
    while not done():
        assert time.monotonic() < deadline, "the beat did not come"
        time.sleep(0.01)


def _beat(
    tmp_path: Path, send: Callable[[Progress], None], log: Callable[..., None], period: float
) -> tuple[Beat, Path]:
    report = tmp_path / "report.json"
    return Beat.start(t.cast("t.Any", SPEC), report, send, log, period), report


def test_o_batedor_manda_o_placar(tmp_path: Path) -> None:
    sent: list[Progress] = []
    beat, report = _beat(tmp_path, sent.append, lambda *_a, **_k: None, period=0.05)
    _report(
        report,
        tables={
            "notas": {
                "read": 9,
                "written": 6,
                "rounded": 0,
                "startedAt": STARTED,
                "endedAt": None,
            }
        },
    )
    _until(lambda: len(sent) >= 3)
    beat.stop()
    for progress in sent:
        assert checked_progress(progress) is progress
    assert [p["seq"] for p in sent] == list(range(1, len(sent) + 1))
    assert sent[-1]["phase"] == {"kind": "COPYING"}
    assert sent[-1]["tables"] == [
        {
            "name": "notas",
            "read": 9,
            "written": 6,
            "startedAt": STARTED,
            "endedAt": None,
            "failed": False,
        },
        {
            "name": "itens",
            "read": 0,
            "written": 0,
            "startedAt": None,
            "endedAt": None,
            "failed": False,
        },
    ]


def test_a_tabela_que_termina_sai_logo_e_a_fase_vai_junto(tmp_path: Path) -> None:
    sent: list[Progress] = []
    beat, report = _beat(tmp_path, sent.append, lambda *_a, **_k: None, period=60)
    counts = {"read": 3, "written": 3, "rounded": 0, "startedAt": STARTED, "endedAt": ENDED}
    _report(report, tables={"notas": counts}, ended=["notas"])
    _until(lambda: len(sent) == 1)
    assert sent[0]["tables"][0]["endedAt"] == ENDED
    beat.updating("notas")
    beat.stop()
    assert [p["phase"] for p in sent] == [
        {"kind": "COPYING"},
        {"kind": "UPDATING", "table": "notas"},
    ]
    assert [p["seq"] for p in sent] == [1, 2]


def test_a_fila_recusa_e_a_rodada_segue(tmp_path: Path, capfd: pytest.CaptureFixture[str]) -> None:
    sent: list[Progress] = []
    logged: list[dict[str, t.Any]] = []
    refusals = 2

    def send(progress: Progress) -> None:
        nonlocal refusals
        if refusals:
            refusals -= 1
            raise ClientError({"Error": {"Code": "AccessDenied"}}, "SendMessage")
        sent.append(progress)

    beat, report = _beat(
        tmp_path, send, lambda event, **fields: logged.append({"event": event, **fields}), 0.05
    )
    _report(report)
    _until(lambda: len(sent) >= 1)
    beat.stop()
    assert (
        logged[:2]
        == [{"event": "PROGRESS_NOT_SENT", "runId": SPEC["runId"], "error": "ClientError"}] * 2
    )
    assert sent[0]["seq"] == 3
    assert [table["name"] for table in sent[0]["tables"]] == ["notas", "itens"]


def test_o_relatorio_ilegivel_nao_para_o_batedor(tmp_path: Path) -> None:
    sent: list[Progress] = []
    logged: list[str] = []
    beat, report = _beat(
        tmp_path, sent.append, lambda event, **_fields: logged.append(event), period=0.05
    )
    report.write_text('{"tables": {"notas": {"re')
    _until(lambda: "PROGRESS_REPORT_UNREADABLE" in logged)
    assert sent == []
    _report(report)
    _until(lambda: len(sent) >= 1)
    beat.stop()
    assert sent[0]["seq"] == 1


def test_nada_sai_depois_de_parar(tmp_path: Path) -> None:
    sent: list[Progress] = []
    beat, report = _beat(tmp_path, sent.append, lambda *_a, **_k: None, period=0.05)
    _report(report)
    _until(lambda: len(sent) >= 1)
    beat.stop()
    count = len(sent)
    beat.updating("notas")
    beat.ended()
    time.sleep(0.2)
    assert len(sent) == count


def test_o_placar_nao_leva_linha(task: Task) -> None:
    spec = task.spec(NOTAS, NFE)
    assert task.run(spec) == 0
    source = task.source(spec)
    progress = task.aws.progress
    assert progress
    text = json.dumps(progress)
    for rows in source.values():
        for row in rows:
            for value in row.values():
                if isinstance(value, str) and len(value) > 5 and any(c.isalpha() for c in value):
                    assert value not in text
    for message in progress:
        assert set(message) == {
            "type",
            "version",
            "runId",
            "attempt",
            "seq",
            "at",
            "phase",
            "tables",
        }
        assert {name for table in message["tables"] for name in table} == {
            "name",
            "read",
            "written",
            "startedAt",
            "endedAt",
            "failed",
        }
        checked_progress(t.cast("Progress", message))
