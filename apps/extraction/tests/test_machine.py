from __future__ import annotations

import time
import typing as t

import pytest

from conexus_extraction import machine
from conexus_extraction.machine import Meter
from tests.conftest import Metadata, docker_stats, fargate

MIB = 1024 * 1024


class Lines:
    def __init__(self) -> None:
        self.seen: list[tuple[str, dict[str, object]]] = []

    def __call__(self, event: str, **fields: object) -> None:
        self.seen.append((event, fields))

    def events(self) -> list[str]:
        return [event for event, _ in self.seen]


def measured(url: str, log: Lines, reads: int) -> Meter:
    meter = Meter.start({machine.ENDPOINT: url}, log, period=3600)
    for _ in range(reads):
        meter.sample()
    return meter


def only(body: object) -> dict[str, t.Any]:
    [container] = t.cast("dict[str, dict[str, t.Any]]", body).values()
    return container


def cores_between(first: dict[str, t.Any], second: dict[str, t.Any]) -> float:
    spent = (
        second["cpu_stats"]["cpu_usage"]["total_usage"]
        - first["cpu_stats"]["cpu_usage"]["total_usage"]
    )
    return float(spent / 1e9)


@pytest.mark.parametrize(("vcpu", "memory"), [(1, 2048), (2, 4096)])
def test_o_pico_da_rodada_no_fargate(metadata: Metadata, vcpu: int, memory: int) -> None:
    task, [zeroed, repeated, fresh] = fargate(vcpu)
    metadata.serve(task, zeroed, repeated, fresh)
    log = Lines()
    result = measured(metadata.url, log, reads=3).stop()
    assert result is not None
    assert only(fresh)["cpu_stats"]["online_cpus"] == 2
    assert result["allocated"] == {"vcpu": vcpu, "memoryMib": memory}
    expected = cores_between(only(zeroed), only(fresh))
    window = 10.0
    assert result["peak"]["vcpu"] == pytest.approx(expected / window, abs=0.02)
    assert result["samples"] == [
        [pytest.approx(expected / window, abs=0.02), only(fresh)["memory_stats"]["usage"] // MIB]
    ]
    top = only(fresh)["memory_stats"]["max_usage"]
    assert top > only(fresh)["memory_stats"]["usage"]
    assert result["peak"]["memoryMib"] == top // MIB
    assert log.events() == []


def test_o_total_inactive_file_vale_antes_do_inactive_file(metadata: Metadata) -> None:
    task, [_, _, fresh] = fargate(1)
    body = only(fresh)
    body["memory_stats"]["stats"].update(total_inactive_file=40 * MIB, inactive_file=10 * MIB)
    usage = body["memory_stats"]["usage"]
    body["memory_stats"]["usage"] = usage + 100 * MIB
    body["memory_stats"]["max_usage"] = usage + 100 * MIB
    metadata.serve(task, fresh)
    result = measured(metadata.url, Lines(), reads=1).stop()
    assert result is not None
    assert result["peak"]["memoryMib"] == (usage + 60 * MIB) // MIB


def test_o_pico_da_rodada_no_docker_local(metadata: Metadata) -> None:
    bodies = [docker_stats(n) for n in (1, 2, 3)]
    metadata.serve_docker(*bodies)
    log = Lines()
    result = measured(metadata.url, log, reads=3).stop()
    assert result is not None
    used = [
        b["memory_stats"]["usage"] - b["memory_stats"]["stats"]["inactive_file"] for b in bodies
    ]
    assert "max_usage" not in bodies[0]["memory_stats"]
    assert result["peak"]["memoryMib"] == max(used) // MIB
    assert max(used) // MIB < bodies[2]["memory_stats"]["usage"] // MIB
    assert [mib for _, mib in result["samples"]] == [u // MIB for u in used]
    assert bodies[0]["cpu_stats"]["online_cpus"] == 10
    assert result["peak"]["vcpu"] == pytest.approx(1.0, abs=0.1)
    assert log.events() == []


def test_o_read_repetido_nao_e_amostra(metadata: Metadata) -> None:
    task, [zeroed, _, fresh] = fargate(1)
    metadata.serve(task, zeroed, zeroed, zeroed, fresh, fresh)
    result = measured(metadata.url, Lines(), reads=5).stop()
    assert result is not None
    assert len(result["samples"]) == 1


def test_a_primeira_leitura_zerada_nao_da_cpu(metadata: Metadata) -> None:
    task, [zeroed, *_] = fargate(1)
    metadata.serve(task, zeroed)
    result = measured(metadata.url, Lines(), reads=2).stop()
    assert result is not None
    assert (result["peak"]["vcpu"], result["samples"]) == (0, [])
    assert result["peak"]["memoryMib"] == only(zeroed)["memory_stats"]["max_usage"] // MIB


def test_361_amostras_viram_181_e_o_intervalo_dobra(metadata: Metadata) -> None:
    metadata.advance(docker_stats(1))
    full = measured(metadata.url, Lines(), reads=360).stop()
    assert full is not None
    assert (len(full["samples"]), full["everySeconds"]) == (360, 3600)
    meter = measured(metadata.url, Lines(), reads=362)
    halved = meter.stop()
    assert halved is not None
    assert (len(halved["samples"]), halved["everySeconds"]) == (181, 7200)
    meter.sample()
    meter.sample()
    assert len(meter._samples) == 182, "one in two readings is kept from there on"


def test_a_linha_de_execucao_le_sozinha(metadata: Metadata) -> None:
    metadata.advance(docker_stats(1))
    meter = Meter.start({machine.ENDPOINT: metadata.url}, Lines(), period=0.05)
    deadline = time.monotonic() + 5
    while metadata.asked.count("/task/stats") < 4 and time.monotonic() < deadline:
        time.sleep(0.01)
    result = meter.stop()
    assert result is not None
    assert len(result["samples"]) >= 3


def test_medir_nao_derruba_a_rodada_sem_a_variavel() -> None:
    log = Lines()
    meter = Meter.start({}, log)
    meter.sample()
    assert meter.stop() is None
    assert log.events() == []


@pytest.mark.parametrize(
    "broken",
    ["status", "slow", "not_json", "wrong_shape", "no_limits", "no_containers", "unreachable"],
)
def test_medir_nao_derruba_a_rodada(
    broken: str, metadata: Metadata, monkeypatch: pytest.MonkeyPatch
) -> None:
    task, [zeroed, _, fresh] = fargate(1)
    metadata.serve(task, zeroed, fresh)
    url = metadata.url
    monkeypatch.setattr(machine, "TIMEOUT", 0.2)
    if broken == "status":
        metadata.status = 500
    elif broken == "slow":
        metadata.delay = 0.6
    elif broken == "not_json":
        metadata.task, metadata.stats = b"<html>", [b"<html>"]
    elif broken == "wrong_shape":
        metadata.stats = [["not", "a", "map"], {"a": {"memory_stats": 1}}, {"a": {}}]
    elif broken == "no_limits":
        metadata.task = {"Limits": {"CPU": 0, "Memory": 0}}
    elif broken == "no_containers":
        metadata.stats = [{}]
    else:
        url = "http://127.0.0.1:1"
    log = Lines()
    meter = Meter.start({machine.ENDPOINT: url}, log, period=3600)
    for _ in range(3):
        meter.sample()
    assert meter.stop() is None
    assert set(log.events()) <= {
        "MACHINE_NOT_MEASURED",
        "MACHINE_READ_FAILED",
        "MACHINE_READS_FAILED",
    }
    assert log.events(), "the failure is logged, never swallowed"


def test_uma_leitura_que_falha_no_meio_nao_apaga_as_outras(metadata: Metadata) -> None:
    task, [zeroed, _, fresh] = fargate(1)
    metadata.serve(task, zeroed, b"<html>", fresh)
    log = Lines()
    result = measured(metadata.url, log, reads=3).stop()
    assert result is not None
    assert len(result["samples"]) == 1
    assert log.events().count("MACHINE_READ_FAILED") == 1
    assert dict(log.seen)["MACHINE_READS_FAILED"]["count"] == 1
