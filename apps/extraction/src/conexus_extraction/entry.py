from __future__ import annotations

import json
import os
import signal
import subprocess
import sys
import tempfile
import typing as t
import urllib.parse
from collections.abc import Callable, Mapping, Sequence
from pathlib import Path

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from jsonschema import ValidationError
from pyiceberg.catalog import load_catalog

from conexus_extraction.contract import (
    PROJECT,
    Complete,
    Failed,
    Interrupted,
    Lake,
    Machine,
    Progress,
    Result,
    Spec,
    SpecInvalid,
    TreatResult,
    checked,
    parse_spec,
    parse_treat_spec,
    reply_address,
)
from conexus_extraction.machine import Meter
from conexus_extraction.progress import Beat
from conexus_extraction.treat import database_of, refused, treated, workgroup_of
from conexus_extraction.update import Athena, Mode, UpdateCounts, UpdateFailed, Updater

MELTANO = str(Path(sys.executable).with_name("meltano"))
REPORT = "target-report.json"
RUN_PARAMETER = "CONEXUS_RUN_PARAMETER"
TREAT_OBJECT = "CONEXUS_TREAT_OBJECT"

CatalogOf = Callable[[Lake], dict[str, str]]
StillOpen = Callable[[], bool]


class Plan(t.TypedDict):
    key: list[str]
    mode: Mode
    history: bool


def log(event: str, **fields: str | int | None) -> None:
    print(json.dumps({"event": event, **fields}), file=sys.stderr, flush=True)


def s3_tables_catalog(lake: Lake) -> dict[str, str]:
    region = lake["region"]
    return {
        "type": "rest",
        "uri": f"https://s3tables.{region}.amazonaws.com/iceberg",
        "warehouse": lake["bucketArn"],
        "rest.sigv4-enabled": "true",
        "rest.signing-name": "s3tables",
        "rest.signing-region": region,
        "client.region": region,
    }


def _secret_file(work: Path, credential: Mapping[str, str]) -> Path:
    path = work / "secret.json"
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w") as file:
        json.dump(credential, file)
    return path


def _settings(prefix: str, values: Mapping[str, object]) -> dict[str, str]:
    return {
        f"{prefix}_{name.upper()}": value if isinstance(value, str) else json.dumps(value)
        for name, value in values.items()
        if value is not None
    }


class Stopping:
    def __init__(self) -> None:
        self.asked = False
        self._child: subprocess.Popen[bytes] | None = None

    def __call__(self, signum: int, _frame: object) -> None:
        self.asked = True
        if self._child is not None:
            self._child.send_signal(signum)

    def meltano(self, args: list[str], env: Mapping[str, str], **kwargs: t.Any) -> int:
        with subprocess.Popen([MELTANO, *args], cwd=PROJECT, env=env, **kwargs) as child:
            self._child = child
            try:
                return child.wait()
            finally:
                self._child = None


class Round:
    def __init__(self, spec: Spec, work: Path, base: Mapping[str, str], stopping: Stopping) -> None:
        self.spec = spec
        self.meltano = stopping.meltano
        self.tap_result = work / "tap-result.json"
        self.report = work / REPORT
        self.catalog = work / "catalog.json"
        tap = {
            "connector": spec["connector"],
            "account": spec["account"],
            "secret_path": str(_secret_file(work, spec["credential"])),
            "result_path": str(self.tap_result),
            "start_date": spec["startDate"],
            "tables": spec["tables"],
        }
        self.env = {
            **base,
            "MELTANO_SYS_DIR_ROOT": str(work / "meltano"),
            "MELTANO_STATE_BACKEND_URI": (
                f"{base['CONEXUS_STATE_URI']}/{spec['companyId']}/{spec['connectionId']}"
            ),
            **_settings("TAP_CONEXUS", tap),
        }

    def discovered(self) -> dict[str, t.Any] | None:
        with self.catalog.open("w") as out:
            code = self.meltano(["invoke", "--dump=catalog", "tap-conexus"], self.env, stdout=out)
        return json.loads(self.catalog.read_text()) if code == 0 else None

    def run(self, catalog: dict[str, t.Any], target: Mapping[str, object]) -> int:
        self.catalog.write_text(json.dumps(catalog))
        env = {
            **self.env,
            "TAP_CONEXUS__CATALOG": str(self.catalog),
            **_settings("TARGET_CONEXUS", {**target, "report_path": str(self.report)}),
        }
        return self.meltano(["run", "tap-conexus", "target-conexus"], env)

    def tap_failure(self) -> Failed | None:
        if not self.tap_result.exists():
            return None
        failure = json.loads(self.tap_result.read_text())
        table = failure.get("table") or None
        return {
            "kind": "ERROR",
            "code": failure["code"],
            "table": table,
            "system": failure["system"],
        }

    def target_report(self) -> dict[str, t.Any]:
        if not self.report.exists():
            return {"tables": {}, "closed": False, "failed": None, "ended": []}
        return t.cast("dict[str, t.Any]", json.loads(self.report.read_text()))


def _chosen(
    catalog: dict[str, t.Any], spec: Spec
) -> tuple[dict[str, object], dict[str, Plan], str | None]:
    asked = {table["source"]: table for table in spec["tables"]}
    found = {stream["table_name"]: stream for stream in catalog["streams"]}
    missing = next(
        (table["name"] for table in spec["tables"] if table["source"] not in found),
        None,
    )
    tables: dict[str, object] = {}
    plans: dict[str, Plan] = {}
    for source, stream in found.items():
        top = next(entry["metadata"] for entry in stream["metadata"] if entry["breadcrumb"] == [])
        top["selected"] = source in asked
        if source in asked:
            tables[asked[source]["name"]] = {
                "origin": source,
                "label": top["conexus-label"],
                "meanings": top.get("conexus-meanings") or {},
            }
            plans[asked[source]["name"]] = {
                "key": stream["key_properties"],
                "mode": top["conexus-mode"],
                "history": top["conexus-history"],
            }
    return tables, plans, missing


def _result(
    spec: Spec,
    outcome: Complete | Failed | Interrupted,
    report: Mapping[str, t.Any],
    updated: Mapping[str, UpdateCounts] | None = None,
) -> Result:
    counts = report["tables"]
    applied = updated or {}
    return checked(
        {
            "type": "RESULT",
            "version": 1,
            "runId": spec["runId"],
            "attempt": spec["attempt"],
            "outcome": outcome,
            "tables": [
                {
                    "name": asked["name"],
                    "read": counts.get(asked["name"], {}).get("read", 0),
                    "written": counts.get(asked["name"], {}).get("written", 0),
                    "rounded": counts.get(asked["name"], {}).get("rounded", 0),
                    "rows": applied[asked["name"]].rows if asked["name"] in applied else None,
                    "whole": applied[asked["name"]].whole
                    if asked["name"] in applied
                    else asked["whole"],
                    "startedAt": counts.get(asked["name"], {}).get("startedAt"),
                    "endedAt": counts.get(asked["name"], {}).get("endedAt"),
                }
                for asked in spec["tables"]
            ],
        }
    )


def _measured(result: Result, machine: Machine | None) -> Result:
    try:
        return checked(t.cast("Result", {**result, "machine": machine}))
    except ValidationError:
        log("MACHINE_INVALID", runId=result["runId"])
        return t.cast("Result", {**result, "machine": None})


def _interrupted_if_closed(
    spec: Spec, report: Mapping[str, t.Any], still_open: StillOpen
) -> Result | None:
    if still_open():
        return None
    log("RUN_CLOSED", runId=spec["runId"])
    return _result(spec, {"kind": "INTERRUPTED"}, report)


def _tables_safe_to_apply(
    spec: Spec, report: Mapping[str, t.Any], failed: Failed | None
) -> list[str]:
    names = [asked["name"] for asked in spec["tables"]]
    return names if failed is None else [name for name in names if name in report["ended"]]


def _update_unless_interrupted(
    spec: Spec,
    updater: Updater,
    plans: Mapping[str, Plan],
    guard: tuple[Stopping, StillOpen],
    safe: Sequence[str],
    beat: Beat,
) -> tuple[dict[str, UpdateCounts], Failed | None] | None:
    stopping, still_open = guard
    counts: dict[str, UpdateCounts] = {}
    for asked in spec["tables"]:
        if asked["name"] not in safe:
            continue
        if stopping.asked or not still_open():
            return None
        plan = plans[asked["name"]]
        beat.updating(asked["name"])
        try:
            counts[asked["name"]] = updater.update(
                asked["name"],
                key=plan["key"],
                mode=plan["mode"],
                history=plan["history"],
                since=spec["startDate"],
            )
        except UpdateFailed as failed:
            log(
                "UPDATE_FAILED",
                runId=spec["runId"],
                table=asked["name"],
                athena=failed.code,
                cause=failed.cause,
            )
            return counts, {
                "kind": "ERROR",
                "code": "COPY_LAKE_WRITE_FAILED",
                "table": asked["name"],
                "system": None,
            }
    return counts, None


def copied(
    spec: Spec,
    work: Path,
    base: Mapping[str, str],
    lake: tuple[CatalogOf, Athena],
    guard: tuple[Stopping, StillOpen],
    beat: Beat,
) -> Result | None:
    catalog_of, athena = lake
    stopping, still_open = guard
    try:
        round_ = Round(spec, work, base, stopping)
    except OSError:
        log("SECRET_NOT_WRITTEN", runId=spec["runId"])
        return None
    discovered = round_.discovered()
    if discovered is None:
        failure = round_.tap_failure()
        if failure is None:
            return _interrupted_if_closed(spec, round_.target_report(), still_open)
        return _result(spec, failure, round_.target_report())
    tables, plans, missing = _chosen(discovered, spec)
    if missing is not None:
        unreadable: Failed = {
            "kind": "ERROR",
            "code": "COPY_SOURCE_UNREADABLE",
            "table": missing,
            "system": None,
        }
        return _result(spec, unreadable, round_.target_report())
    catalog = catalog_of(spec["lake"])
    target = {
        "catalog": catalog,
        "tables": tables,
        "run_parameter": base[RUN_PARAMETER],
        "region": base["AWS_REGION"],
    }
    code = round_.run(discovered, target)
    report = round_.target_report()
    if stopping.asked or report["closed"]:
        return _interrupted_if_closed(spec, report, still_open)
    failure = round_.tap_failure()
    if failure is None and report["failed"] is not None:
        failure = {
            "kind": "ERROR",
            "code": "COPY_LAKE_WRITE_FAILED",
            "table": report["failed"]["table"],
            "system": None,
        }
    if failure is None and code != 0:
        log("RUN_UNEXPLAINED", runId=spec["runId"], meltano=code)
        return None
    safe = _tables_safe_to_apply(spec, report, failure)
    updater = Updater(load_catalog("lake", **catalog), athena)
    updated = _update_unless_interrupted(spec, updater, plans, guard, safe, beat)
    if updated is None:
        return _interrupted_if_closed(spec, report, still_open)
    counts, failed = updated
    outcome: Complete | Failed = failure or failed or {"kind": "COMPLETE"}
    return _result(spec, outcome, report, counts)


def run(environ: Mapping[str, str], catalog_of: CatalogOf) -> int:
    stopping = Stopping()
    previous = signal.signal(signal.SIGTERM, stopping)
    try:
        if TREAT_OBJECT in environ:
            return _treatment(environ, stopping)
        if RUN_PARAMETER in environ:
            return _round(environ, catalog_of, stopping)
        log("TREAT_SPEC_INVALID", field="(variable)")
        return 1
    finally:
        signal.signal(signal.SIGTERM, previous)


def _send(aws: boto3.session.Session, queue: str, result: Result | TreatResult) -> int:
    try:
        aws.client("sqs").send_message(QueueUrl=queue, MessageBody=json.dumps(result))
    except (BotoCoreError, ClientError) as error:
        log("RESULT_NOT_SENT", runId=result["runId"], error=type(error).__name__)
        return 1
    log("RESULT_SENT", runId=result["runId"], outcome=result["outcome"]["kind"])
    return 0


def _treatment(environ: Mapping[str, str], stopping: Stopping) -> int:
    aws = boto3.session.Session(region_name=environ["AWS_REGION"])
    address = urllib.parse.urlsplit(environ[TREAT_OBJECT])
    try:
        held = aws.client("s3").get_object(Bucket=address.netloc, Key=address.path.lstrip("/"))
        text = held["Body"].read().decode()
    except (BotoCoreError, ClientError) as error:
        log("TREAT_SPEC_UNREAD", error=type(error).__name__)
        return 1
    try:
        if RUN_PARAMETER in environ:
            raise SpecInvalid("(variable)")
        spec = parse_treat_spec(text)
    except SpecInvalid as invalid:
        log("TREAT_SPEC_INVALID", field=str(invalid))
        answerable = reply_address(text)
        return 1 if answerable is None else _send(aws, answerable["queueUrl"], refused(answerable))
    bucket = spec["lake"]["bucketArn"].rsplit("/", 1)[-1]
    athena = Athena(aws.client("athena"), workgroup_of(bucket), database_of(bucket))
    with tempfile.TemporaryDirectory(prefix="tratamento-") as work:
        result = treated(spec, Path(work), athena, log)
    if stopping.asked:
        log("RUN_STOPPED", runId=spec["runId"])
        return 1
    return _send(aws, spec["queueUrl"], result)


def _sent_to(aws: boto3.session.Session, spec: Spec) -> Callable[[Progress], None]:
    sqs = aws.client("sqs")

    def send(progress: Progress) -> None:
        sqs.send_message(QueueUrl=spec["queueUrl"], MessageBody=json.dumps(progress))

    return send


def _open(ssm: t.Any, parameter: str) -> bool:
    try:
        ssm.get_parameter(Name=parameter)
    except ssm.exceptions.ParameterNotFound:
        return False
    return True


def _round(environ: Mapping[str, str], catalog_of: CatalogOf, stopping: Stopping) -> int:
    parameter, region = environ[RUN_PARAMETER], environ["AWS_REGION"]
    aws = boto3.session.Session(region_name=region)
    ssm = aws.client("ssm")
    try:
        answer = ssm.get_parameter(Name=parameter, WithDecryption=True)
    except ssm.exceptions.ParameterNotFound:
        log("RUN_CLOSED", parameter=parameter)
        return 1
    try:
        spec = parse_spec(answer["Parameter"]["Value"])
    except SpecInvalid as invalid:
        log("SPEC_INVALID", field=str(invalid))
        return 1
    meter = Meter.start(environ, log)
    try:
        with tempfile.TemporaryDirectory(prefix="copia-") as work:
            lake = spec["lake"]["bucketArn"].rsplit("/", 1)[-1]
            athena = Athena(aws.client("athena"), lake, f"s3tablescatalog/{lake}")
            beat = Beat.start(spec, Path(work) / REPORT, _sent_to(aws, spec), log)
            try:
                result = copied(
                    spec,
                    Path(work),
                    environ,
                    (catalog_of, athena),
                    (stopping, lambda: _open(ssm, parameter)),
                    beat,
                )
            finally:
                beat.stop()
    finally:
        machine = meter.stop()
    if result is None:
        if stopping.asked:
            log("RUN_STOPPED", runId=spec["runId"])
        return 1
    return _send(aws, spec["queueUrl"], _measured(result, machine))


def main() -> int:
    return run(os.environ, s3_tables_catalog)


if __name__ == "__main__":
    sys.exit(main())
