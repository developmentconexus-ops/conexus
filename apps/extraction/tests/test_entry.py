from __future__ import annotations

import json
import os
import signal
import threading
import time
import typing as t
from decimal import Decimal
from pathlib import Path

import pyarrow as pa
import pytest

from conexus_extraction.contract import Machine
from conexus_extraction.entry import Round
from conexus_extraction.machine import Meter
from tests.conftest import TAP_DOUBLE, Metadata, Task, fargate

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
        {
            "name": name,
            "read": rows[name],
            "written": rows[name],
            "rounded": rounded,
            "rows": rows[name],
            "whole": True,
        }
        for name, rounded in (("sankhya_notas", 1), ("sankhya_notas_nfe", 0))
    ]
    assert "1234567890123" not in json.dumps(result)
    machine = result["machine"]
    assert machine["allocated"] == {"vcpu": 1, "memoryMib": 2048}
    assert set(machine) == {"allocated", "peak", "everySeconds", "samples"}
    assert machine["peak"]["memoryMib"] > 0
    assert set(result) == {"type", "version", "runId", "attempt", "outcome", "tables", "machine"}


def test_o_resultado_leva_as_celulas_arredondadas_de_cada_tabela(task: Task) -> None:
    spec = task.spec(NOTAS, ("TGFNFE", "sankhya_notas_nfe"))
    assert task.run(spec) == 0
    [result] = task.aws.sent
    assert [(table["name"], table["rounded"]) for table in result["tables"]] == [
        ("sankhya_notas", 1),
        ("sankhya_notas_nfe", 0),
    ]
    lake = task.lake.load_table(("current", "sankhya_notas")).scan().to_arrow()
    assert Decimal("2.123456790") in lake.column("campo003").to_pylist()


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


def test_a_rodada_fechada_antes_da_atualizacao_nao_toca_a_atual(
    task: Task, monkeypatch: pytest.MonkeyPatch, capfd: pytest.CaptureFixture[str]
) -> None:
    copy = Round.run

    def closed_after_the_copy(self: Round, *args: t.Any) -> int:
        code = copy(self, *args)
        task.aws.parameters.clear()
        return code

    monkeypatch.setattr(Round, "run", closed_after_the_copy)
    task.run(task.spec(NOTAS))
    assert task.lake.load_table(("raw", "sankhya_notas")).scan().to_arrow().num_rows
    assert task.aws.sent == []
    assert not task.athena.statements
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


ITENS = ("TGFITE", "sankhya_itens")
NFE = ("TGFNFE", "sankhya_notas_nfe")
JANELA = ("TGFEFDVMRSTDIA", "efd_st_media_diaria")


def test_a_tabela_que_falha_nao_trava_a_atual_das_que_terminaram(task: Task) -> None:
    task.lake.create_table(("raw", "sankhya_itens"), schema=pa.schema([("nunota", pa.string())]))
    spec = task.spec(NOTAS, ITENS, whole=False)
    assert task.run(spec) == 0
    [result] = task.aws.sent
    assert result["outcome"] == {
        "kind": "ERROR",
        "code": "COPY_LAKE_WRITE_FAILED",
        "table": "sankhya_itens",
        "system": None,
    }
    notas = task.lake.load_table(("current", "sankhya_notas")).scan().to_arrow()
    assert notas.num_rows == len(task.source(spec)["sankhya_notas"])
    by_name = {table["name"]: table for table in result["tables"]}
    assert by_name["sankhya_notas"]["rows"] == notas.num_rows
    assert by_name["sankhya_itens"]["rows"] is None
    assert not task.lake.load_table(("current", "sankhya_itens")).scan().to_arrow().num_rows


def test_a_falha_dita_e_a_da_tabela_mesmo_se_a_atualizacao_tambem_falha(task: Task) -> None:
    _unwritable(task, "sankhya_itens")
    task.athena.refuse = lambda sql: sql.startswith("MERGE")
    assert task.run(task.spec(NOTAS, ITENS, whole=False)) == 0
    assert task.aws.sent[-1]["outcome"]["table"] == "sankhya_itens"
    assert task.aws.sent[-1]["tables"][0]["rows"] is None


def test_a_tabela_nunca_comecada_nao_trava_a_atual_das_que_terminaram(task: Task) -> None:
    _unwritable(task, "sankhya_itens")
    spec = task.spec(JANELA, ITENS, NOTAS, whole=False)
    assert task.run(spec) == 0
    [result] = task.aws.sent
    assert result["outcome"]["table"] == "sankhya_itens"
    rows = {table["name"]: table["rows"] for table in result["tables"]}
    assert rows == {
        "efd_st_media_diaria": None,
        "sankhya_itens": None,
        "sankhya_notas": len(task.source(spec)["sankhya_notas"]),
    }


def test_a_tabela_que_terminou_com_linhas_no_lote_entra_inteira(
    task: Task, monkeypatch: pytest.MonkeyPatch
) -> None:
    first = task.spec(JANELA, whole=False)
    assert task.run(first) == 0
    before = _window_keys(task)
    monkeypatch.setenv("TARGET_CONEXUS_BATCH_SIZE_ROWS", "3")
    _unwritable(task, "sankhya_notas_nfe")
    second = task.spec(JANELA, NFE, whole=False, connection=first["connectionId"])
    assert task.run(second) == 0
    assert task.aws.sent[-1]["outcome"]["table"] == "sankhya_notas_nfe"
    assert _window_keys(task) == before
    assert task.aws.sent[-1]["tables"][0]["rows"] == len(before)


def test_a_passada_parada_no_meio_nao_entra_na_atual(task: Task) -> None:
    first = task.spec(JANELA, whole=False)
    assert task.run(first) == 0
    before = _window_keys(task)
    task.athena.executions.clear()
    _tap_stops_after(task, "STATE")
    second = task.spec(JANELA, whole=False, connection=first["connectionId"])
    assert task.run(second) == 0
    assert task.aws.sent[-1]["outcome"]["code"] == "COPY_SOURCE_UNREACHABLE"
    assert task.aws.sent[-1]["tables"][0]["rows"] is None
    assert not task.athena.statements
    assert _window_keys(task) == before


def test_a_falha_antes_do_primeiro_ponto_chega_no_resultado(task: Task) -> None:
    _tap_stops_after(task, "SCHEMA")
    assert task.run(task.spec(NOTAS)) == 0
    [result] = task.aws.sent
    assert result["outcome"]["code"] == "COPY_SOURCE_UNREACHABLE"
    assert result["tables"][0]["rows"] is None


def _unwritable(task: Task, name: str) -> None:
    """A raw table whose key has another type, so the writer fails on that table."""
    task.lake.create_table(("raw", name), schema=pa.schema([("nunota", pa.string())]))


def _window_keys(task: Task) -> list[str]:
    table = task.lake.load_table(("current", "efd_st_media_diaria")).scan().to_arrow()
    columns = ("codemp", "dtref", "codprod", "tipimposto", "tipmedia", "dtmov")
    return sorted(str([row[column] for column in columns]) for row in table.to_pylist())


def _tap_stops_after(task: Task, kind: str) -> None:
    """The tap's own lines up to the first of `kind`, then the reader's failure."""
    program = task.plugins / "tap-conexus"
    failure = {"code": "COPY_SOURCE_UNREACHABLE", "table": "", "system": None}
    tap = f'node "{TAP_DOUBLE}" --origin "{task.double.origin}" "$@"'
    program.write_text(
        "\n".join(
            [
                "#!/bin/sh",
                f'case "$*" in *--discover*) exec {tap} ;; esac',
                f'{tap} | awk \'{{print}} /"type":"{kind}"/ {{exit}}\'',
                f"echo '{json.dumps(failure)}' > \"$TAP_CONEXUS_RESULT_PATH\"",
                "exit 1",
            ]
        )
    )
