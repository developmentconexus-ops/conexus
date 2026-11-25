from __future__ import annotations

import json
import os
import signal
import threading
import time
from pathlib import Path

import pytest

from conexus_extraction.contract import Machine
from conexus_extraction.machine import Meter
from tests.conftest import Metadata, Task, fargate

NOTAS = ("TGFCAB", "sankhya_notas")


def test_o_segredo_fica_no_arquivo(task: Task, capfd: pytest.CaptureFixture[str]) -> None:
    assert task.run(task.spec(NOTAS)) == 0
    logged = "".join(capfd.readouterr())
    seen = [task.seen("tap.env"), task.seen("target.env"), task.seen("tap.config"), logged]
    for value in task.double.credential.values():
        assert all(value not in text for text in seen)
    assert "TAP_CONEXUS_SECRET_PATH=" in task.seen("tap.env")
    assert set(task.seen("secret.mode").split()) == {"600"}


def test_um_resultado_por_rodada(task: Task, metadata: Metadata) -> None:
    task_body, stats = fargate(1)
    metadata.serve(task_body, *stats)
    spec = task.spec(NOTAS, ("TGFNFE", "sankhya_notas_nfe"))
    assert task.run(spec) == 0
    assert len(task.aws.sent) == 1
    [result] = task.aws.sent
    assert result["runId"] == spec["runId"]
    assert result["outcome"] == {"kind": "COMPLETE"}
    rows = {name: len(r) for name, r in task.source(spec).items()}
    assert result["tables"] == [
        {"name": name, "read": rows[name], "written": rows[name], "rows": None, "whole": True}
        for name in ("sankhya_notas", "sankhya_notas_nfe")
    ]
    assert "1234567890123" not in json.dumps(result)
    machine = result["machine"]
    assert machine["allocated"] == {"vcpu": 1, "memoryMib": 2048}
    assert set(machine) == {"allocated", "peak", "everySeconds", "samples"}
    assert machine["peak"]["memoryMib"] > 0
    assert set(result) == {"type", "version", "runId", "attempt", "outcome", "tables", "machine"}


def test_o_resultado_sai_igual_sem_a_medida(
    task: Task, metadata: Metadata, capfd: pytest.CaptureFixture[str]
) -> None:
    metadata.status = 500
    spec = task.spec(NOTAS)
    assert task.run(spec) == 0
    [result] = task.aws.sent
    assert result["machine"] is None
    assert result["outcome"] == {"kind": "COMPLETE"}
    assert result["tables"][0]["written"] > 0
    assert "MACHINE_NOT_MEASURED" in capfd.readouterr().err


def test_uma_medida_fora_do_esquema_sai_sem_a_medida(
    task: Task, monkeypatch: pytest.MonkeyPatch, capfd: pytest.CaptureFixture[str]
) -> None:
    invalid: Machine = {
        "allocated": {"vcpu": 1, "memoryMib": -1},
        "peak": {"vcpu": 0, "memoryMib": 0},
        "everySeconds": 10,
        "samples": [],
    }
    monkeypatch.setattr(Meter, "stop", lambda self: invalid)
    spec = task.spec(NOTAS)
    assert task.run(spec) == 0
    [result] = task.aws.sent
    assert result["machine"] is None
    assert result["outcome"] == {"kind": "COMPLETE"}
    assert result["tables"][0]["written"] > 0
    assert "MACHINE_INVALID" in capfd.readouterr().err


def test_a_falha_do_leitor_da_o_codigo_dele(task: Task) -> None:
    spec = task.spec(NOTAS)
    spec["credential"] = {**spec["credential"], **dict.fromkeys(spec["credential"], "trocada")}
    assert task.run(spec) == 0
    [result] = task.aws.sent
    failure = json.loads(task.seen("tap.result"))
    assert result["outcome"] == {
        "kind": "ERROR",
        "code": "COPY_SOURCE_NEEDS_REAUTH",
        "table": None,
        "system": failure["system"],
    }
    assert failure["code"] == "COPY_SOURCE_NEEDS_REAUTH"


def test_a_falha_do_gravador(task: Task) -> None:
    task.lake.drop_namespace("current")
    assert task.run(task.spec(NOTAS)) == 0
    [result] = task.aws.sent
    assert result["outcome"] == {
        "kind": "ERROR",
        "code": "COPY_LAKE_WRITE_FAILED",
        "table": "sankhya_notas",
        "system": None,
    }


def test_a_rodada_fechada_para_a_tarefa(task: Task, capfd: pytest.CaptureFixture[str]) -> None:
    task.aws.refuse_after_gets = 1
    task.run(task.spec(NOTAS))
    assert task.aws.sent == []
    assert not task.lake.table_exists(("raw", "sankhya_notas"))
    assert not task.lake.table_exists(("current", "sankhya_notas"))
    assert '"event": "RUN_CLOSED"' in "".join(capfd.readouterr())


def test_a_rodada_fechada_no_meio_da_copia(
    task: Task, monkeypatch: pytest.MonkeyPatch, capfd: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setenv("TARGET_CONEXUS_BATCH_SIZE_ROWS", "100")
    task.aws.refuse_after_gets = 3
    task.run(task.spec(NOTAS))
    assert task.aws.sent == []
    assert task.lake.load_table(("raw", "sankhya_notas")).scan().to_arrow().num_rows == 100
    assert '"event": "RUN_CLOSED"' in "".join(capfd.readouterr())


def test_o_stoptask_para_o_meltano_e_nao_manda_resultado(
    task: Task, capfd: pytest.CaptureFixture[str]
) -> None:
    started, stopped = task.dumps / "target.started", task.dumps / "target.stopped"
    (task.plugins / "target-conexus").write_text(
        "\n".join(
            [
                "#!/bin/sh",
                f"trap 'touch \"{stopped}\"; exit 143' TERM",
                f'touch "{started}"',
                "for _ in $(seq 300); do sleep 0.1; done",
            ]
        )
    )
    threading.Thread(target=_stop_when, args=(started,), daemon=True).start()
    assert task.run(task.spec(NOTAS)) == 1
    assert task.aws.sent == []
    assert stopped.exists()
    logged = "".join(capfd.readouterr())
    assert '"event": "RUN_STOPPED"' in logged
    assert "RUN_UNEXPLAINED" not in logged


def _stop_when(started: Path) -> None:
    while not started.exists():
        time.sleep(0.05)
    os.kill(os.getpid(), signal.SIGTERM)


def test_a_conferencia_recusada_e_falha_do_gravador(task: Task) -> None:
    task.aws.refuse_after_gets = 1
    task.aws.refusal = "get-parameter-recusado"
    assert task.run(task.spec(NOTAS)) == 0
    [result] = task.aws.sent
    assert result["outcome"] == {
        "kind": "ERROR",
        "code": "COPY_LAKE_WRITE_FAILED",
        "table": "sankhya_notas",
        "system": None,
    }


def test_a_data_vai_ao_leitor(task: Task) -> None:
    assert task.run(task.spec(NOTAS, start_date="2026-01-01")) == 0
    assert "TAP_CONEXUS_START_DATE=2026-01-01" in task.seen("tap.env")
    assert all(json.loads(c)["start_date"] == "2026-01-01" for c in _configs(task))


def test_sem_data_a_configuracao_nao_a_tem(task: Task) -> None:
    assert task.run(task.spec(NOTAS)) == 0
    assert "TAP_CONEXUS_START_DATE" not in task.seen("tap.env")
    assert all("start_date" not in json.loads(c) for c in _configs(task))


def _configs(task: Task) -> list[str]:
    return task.seen("tap.config").splitlines()


def test_o_catalogo_chega_inteiro_ao_gravador(task: Task) -> None:
    assert task.run(task.spec(("TGFCAB", "sankhya_notas"))) == 0
    assert json.loads(json.loads(task.seen("target.config"))["catalog"]) == task.catalog
