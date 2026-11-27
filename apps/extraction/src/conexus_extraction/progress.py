from __future__ import annotations

import json
import threading
import time
import typing as t
from collections.abc import Callable, Mapping
from pathlib import Path

from botocore.exceptions import BotoCoreError, ClientError

from conexus_extraction.contract import (
    Copying,
    Progress,
    ProgressTable,
    Spec,
    Updating,
    checked_progress,
    utc_now,
)

# One report per 10 s, like the machine's meter and Airbyte's `persistenceFlushPeriodSec`.
PERIOD = 10.0
# A table that ends is sent within this wait, not at the next period.
WATCH = 0.5

Log = Callable[..., None]
Send = Callable[[Progress], None]

_EMPTY: dict[str, t.Any] = {"tables": {}, "failed": None, "ended": []}


class Beat:
    """The task's scoreboard, read from the target's report and sent at a steady beat."""

    def __init__(self, spec: Spec, report: Path, send: Send, log: Log, period: float) -> None:
        self._spec = spec
        self._report = report
        self._send = send
        self._log = log
        self._period = period
        self._lock = threading.Lock()
        self._done = threading.Event()
        self._thread: threading.Thread | None = None
        self._seq = 0
        self._phase: Copying | Updating = {"kind": "COPYING"}
        self._ended = 0
        self._last = time.monotonic()

    @classmethod
    def start(cls, spec: Spec, report: Path, send: Send, log: Log, period: float = PERIOD) -> Beat:
        beat = cls(spec, report, send, log, period)
        beat._thread = threading.Thread(target=beat._watch, name="progress-beat", daemon=True)
        beat._thread.start()
        return beat

    def updating(self, table: str) -> None:
        self._emit(phase={"kind": "UPDATING", "table": table})

    def ended(self) -> None:
        self._emit()

    def stop(self) -> None:
        with self._lock:
            self._done.set()
        if self._thread is not None:
            self._thread.join()

    def _watch(self) -> None:
        while not self._done.wait(min(WATCH, self._period)):
            report = self._read()
            if report is None:
                continue
            if len(report["ended"]) > self._ended:
                self.ended()
            elif time.monotonic() - self._last >= self._period:
                self._emit()

    def _read(self) -> Mapping[str, t.Any] | None:
        try:
            return t.cast("Mapping[str, t.Any]", json.loads(self._report.read_text()))
        except FileNotFoundError:
            return _EMPTY
        except (OSError, ValueError):
            self._log("PROGRESS_REPORT_UNREADABLE", runId=self._spec["runId"])
            return None

    def _emit(self, phase: Copying | Updating | None = None) -> None:
        with self._lock:
            if self._done.is_set():
                return
            report = self._read()
            if phase is not None:
                self._phase = phase
            if report is None:
                return
            self._seq += 1
            self._ended = len(report["ended"])
            self._last = time.monotonic()
            progress = checked_progress(
                {
                    "type": "PROGRESS",
                    "version": 1,
                    "runId": self._spec["runId"],
                    "attempt": self._spec["attempt"],
                    "seq": self._seq,
                    "at": utc_now(),
                    "phase": self._phase,
                    "tables": self._tables(report),
                }
            )
            try:
                self._send(progress)
            except (BotoCoreError, ClientError) as error:
                self._log(
                    "PROGRESS_NOT_SENT",
                    runId=self._spec["runId"],
                    error=type(error).__name__,
                )

    def _tables(self, report: Mapping[str, t.Any]) -> list[ProgressTable]:
        failed = (report["failed"] or {}).get("table")
        counts = report["tables"]
        return [
            {
                "name": asked["name"],
                "read": counts.get(asked["name"], {}).get("read", 0),
                "written": counts.get(asked["name"], {}).get("written", 0),
                "startedAt": counts.get(asked["name"], {}).get("startedAt"),
                "endedAt": counts.get(asked["name"], {}).get("endedAt"),
                "failed": asked["name"] == failed,
            }
            for asked in self._spec["tables"]
        ]
