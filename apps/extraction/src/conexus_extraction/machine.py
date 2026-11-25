from __future__ import annotations

import http.client
import json
import threading
import typing as t
import urllib.error
import urllib.request
from collections.abc import Callable, Mapping
from datetime import datetime

from conexus_extraction.contract import Machine

ENDPOINT = "ECS_CONTAINER_METADATA_URI_V4"
# The endpoint renews its stats about every 10 s (a read 5 s later brings the same `read`), so the
# beat is 10 s: one fresh reading per beat, and `everySeconds` says the interval really kept.
PERIOD = 10.0
TIMEOUT = 1.0
SAMPLES_MAX = 360
_MIB = 1024 * 1024
_WINDOW_MAX = 60.0
_BODY_MAX = 4 * _MIB

Log = Callable[..., None]

_UNREADABLE = (
    OSError,
    urllib.error.URLError,
    TimeoutError,
    http.client.HTTPException,
    ValueError,
    KeyError,
    TypeError,
    OverflowError,
)

_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def _get(url: str) -> object:
    with _OPENER.open(url, timeout=TIMEOUT) as answer:
        body: bytes = answer.read(_BODY_MAX)
    return json.loads(body)


def _object(value: object) -> Mapping[str, t.Any]:
    if not isinstance(value, dict):
        raise ValueError("not an object")
    return value


def _number(value: object) -> float:
    if isinstance(value, bool) or not isinstance(value, int | float):
        raise ValueError("not a number")
    return float(value)


def _moment(text: object) -> datetime:
    if not isinstance(text, str):
        raise ValueError("not a time")
    return datetime.fromisoformat(text)


def _used(stats: Mapping[str, t.Any]) -> tuple[int, int]:
    """Memory as `docker stats` counts it: the cgroup's usage without the inactive file cache.

    Returns the use and the peak ceiling. v1 has `total_inactive_file` (the whole group's) and
    `max_usage`; v2 has only `inactive_file` and no `max_usage`, so its peak is the samples'.
    """
    memory = _object(stats["memory_stats"])
    detail = _object(memory.get("stats", {}))
    cache = int(_number(detail.get("total_inactive_file", detail.get("inactive_file", 0))))
    used = int(_number(memory["usage"])) - cache
    raw_peak = memory.get("max_usage")
    return used, used if raw_peak is None else int(_number(raw_peak)) - cache


def _total(stats: Mapping[str, t.Any], key: str) -> float:
    return _number(_object(_object(stats[key])["cpu_usage"])["total_usage"])


def _cores(spent: float, window: float) -> float | None:
    """Cores used over `window` seconds; `online_cpus` is the machine's, not the quota."""
    if not 0 < window <= _WINDOW_MAX:
        return None
    return max(spent, 0.0) / 1e9 / window


class Meter:
    """The task's own machine, read from the endpoint of the task's metadata at a steady beat."""

    def __init__(self, base: str | None, log: Log, period: float = PERIOD) -> None:
        self._base = base
        self._log = log
        self._period = period
        self._lock = threading.Lock()
        self._done = threading.Event()
        self._thread: threading.Thread | None = None
        self._allocated: tuple[float, int] | None = None
        self._peak_cores = 0.0
        self._peak_bytes = 0
        self._samples: list[tuple[float, int]] = []
        self._beats = 0
        self._read = 0
        self._step = 1
        self._failed = 0
        self._last: dict[str, tuple[datetime, float]] = {}

    @classmethod
    def start(cls, environ: Mapping[str, str], log: Log, period: float = PERIOD) -> Meter:
        base = environ.get(ENDPOINT)
        if base is None or not base.startswith(("http://", "https://")):
            return cls(None, log, period)
        meter = cls(base.rstrip("/"), log, period)
        try:
            task = _object(_get(f"{meter._base}/task"))
            limits = _object(task["Limits"])
            cpu, memory = _number(limits["CPU"]), int(_number(limits["Memory"]))
            if cpu <= 0 or memory <= 0:
                raise ValueError("no limits")
        except _UNREADABLE as error:
            log("MACHINE_NOT_MEASURED", where="task", error=type(error).__name__)
            return cls(None, log, period)
        meter._allocated = (cpu, memory)
        meter._thread = threading.Thread(target=meter._beat, name="machine-meter", daemon=True)
        meter._thread.start()
        return meter

    def _beat(self) -> None:
        while not self._done.wait(self._period):
            self.sample()

    def sample(self, series: bool = True) -> None:
        """One reading: the peaks take every one, the series one in `_step`."""
        if self._base is None:
            return
        with self._lock:
            beat = self._beats
            self._beats += 1
        try:
            body = _object(_get(f"{self._base}/task/stats"))
            if not body:
                raise ValueError("no containers")
            used = ceiling = 0
            cores: float | None = None
            fresh = False
            seen: dict[str, tuple[datetime, float]] = {}
            with self._lock:
                last = dict(self._last)
            for name, container in body.items():
                stats = _object(container)
                memory, top = _used(stats)
                used += memory
                ceiling += top
                at, total = _moment(stats["read"]), _total(stats, "cpu_stats")
                seen[name] = (at, total)
                before = last.get(name)
                if before is not None and at <= before[0]:
                    continue
                fresh = True
                if before is not None:
                    spent = (total - before[1], (at - before[0]).total_seconds())
                else:
                    # The first reading has no reading of ours to differ from: only a real
                    # `precpu_stats` helps (the Fargate's first comes zeroed, `preread` in year 1).
                    spent = (
                        total - _total(stats, "precpu_stats"),
                        (at - _moment(stats["preread"])).total_seconds(),
                    )
                core = _cores(*spent)
                if core is not None:
                    cores = (cores or 0.0) + core
            if not fresh:
                return
        except _UNREADABLE as error:
            with self._lock:
                self._failed += 1
                first = self._failed == 1
            if first:
                self._log("MACHINE_READ_FAILED", where="stats", error=type(error).__name__)
            return
        with self._lock:
            self._last.update(seen)
            self._read += 1
            self._peak_bytes = max(self._peak_bytes, used, ceiling)
            if cores is None:
                return
            self._peak_cores = max(self._peak_cores, cores)
            if series and beat % self._step == 0:
                self._samples.append((cores, used))
                if len(self._samples) > SAMPLES_MAX:
                    self._samples = self._samples[::2]
                    self._step *= 2

    def stop(self) -> Machine | None:
        """Ends the beat, reads once more, gives `machine`, or None if nothing was read."""
        self._done.set()
        if self._thread is not None:
            self._thread.join(timeout=2 * TIMEOUT)
        self.sample(series=False)
        with self._lock:
            if self._failed:
                self._log("MACHINE_READS_FAILED", count=self._failed, ok=self._read)
            if self._allocated is None or self._read == 0:
                return None
            cpu, memory = self._allocated
            return {
                "allocated": {"vcpu": cpu, "memoryMib": memory},
                "peak": {
                    "vcpu": round(self._peak_cores, 2),
                    "memoryMib": self._peak_bytes // _MIB,
                },
                "everySeconds": int(self._period * self._step),
                "samples": [[round(cores, 2), used // _MIB] for cores, used in self._samples],
            }
