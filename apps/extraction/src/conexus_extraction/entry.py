from __future__ import annotations

import json
import os
import signal
import subprocess
import sys
import tempfile
import typing as t
from collections.abc import Callable, Mapping
from pathlib import Path

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from conexus_extraction.contract import (
    PROJECT,
    Complete,
    Failed,
    Lake,
    Result,
    Spec,
    SpecInvalid,
    checked,
    parse_spec,
)

MELTANO = str(Path(sys.executable).with_name("meltano"))

CatalogOf = Callable[[Lake], dict[str, str]]


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
        self.report = work / "target-report.json"
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
            return {"tables": {}, "closed": False, "failed": None}
        return t.cast("dict[str, t.Any]", json.loads(self.report.read_text()))


def _chosen(catalog: dict[str, t.Any], spec: Spec) -> tuple[dict[str, object], str | None]:
    asked = {table["source"]: table for table in spec["tables"]}
    found = {stream["table_name"]: stream for stream in catalog["streams"]}
    missing = next(
        (table["name"] for table in spec["tables"] if table["source"] not in found),
        None,
    )
    tables: dict[str, object] = {}
    for source, stream in found.items():
        top = next(entry["metadata"] for entry in stream["metadata"] if entry["breadcrumb"] == [])
        top["selected"] = source in asked
        if source in asked:
            tables[asked[source]["name"]] = {
                "origin": source,
                "label": top["conexus-label"],
                "meanings": top.get("conexus-meanings") or {},
            }
    return tables, missing


def _result(spec: Spec, outcome: Complete | Failed, report: Mapping[str, t.Any]) -> Result:
    counts = report["tables"]
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
                    "rows": None,
                    "whole": asked["whole"],
                }
                for asked in spec["tables"]
            ],
        }
    )


def copied(
    spec: Spec, work: Path, base: Mapping[str, str], catalog_of: CatalogOf, stopping: Stopping
) -> Result | None:
    try:
        round_ = Round(spec, work, base, stopping)
    except OSError:
        log("SECRET_NOT_WRITTEN", runId=spec["runId"])
        return None
    discovered = round_.discovered()
    if discovered is None:
        failure = round_.tap_failure()
        return None if failure is None else _result(spec, failure, round_.target_report())
    tables, missing = _chosen(discovered, spec)
    if missing is not None:
        unreadable: Failed = {
            "kind": "ERROR",
            "code": "COPY_SOURCE_UNREADABLE",
            "table": missing,
            "system": None,
        }
        return _result(spec, unreadable, round_.target_report())
    target = {
        "catalog": catalog_of(spec["lake"]),
        "tables": tables,
        "run_parameter": base["CONEXUS_RUN_PARAMETER"],
        "region": base["AWS_REGION"],
    }
    code = round_.run(discovered, target)
    if stopping.asked:
        return None
    report = round_.target_report()
    if report["closed"]:
        log("RUN_CLOSED", runId=spec["runId"])
        return None
    failure = round_.tap_failure()
    if failure is None and report["failed"] is not None:
        failure = {
            "kind": "ERROR",
            "code": "COPY_LAKE_WRITE_FAILED",
            "table": report["failed"]["table"],
            "system": None,
        }
    if failure is not None:
        return _result(spec, failure, report)
    if code != 0:
        log("RUN_UNEXPLAINED", runId=spec["runId"], meltano=code)
        return None
    return _result(spec, {"kind": "COMPLETE"}, report)


def run(environ: Mapping[str, str], catalog_of: CatalogOf) -> int:
    stopping = Stopping()
    previous = signal.signal(signal.SIGTERM, stopping)
    try:
        return _round(environ, catalog_of, stopping)
    finally:
        signal.signal(signal.SIGTERM, previous)


def _round(environ: Mapping[str, str], catalog_of: CatalogOf, stopping: Stopping) -> int:
    parameter, region = environ["CONEXUS_RUN_PARAMETER"], environ["AWS_REGION"]
    aws = boto3.session.Session(region_name=region)
    ssm = aws.client("ssm")
    try:
        answer = ssm.get_parameter(Name=parameter, WithDecryption=True)
    except ssm.exceptions.ParameterNotFound:
        log("RUN_CLOSED", parameter=parameter)
        return 0
    try:
        spec = parse_spec(answer["Parameter"]["Value"])
    except SpecInvalid as invalid:
        log("SPEC_INVALID", field=str(invalid))
        return 1
    with tempfile.TemporaryDirectory(prefix="copia-") as work:
        result = copied(spec, Path(work), environ, catalog_of, stopping)
    if stopping.asked:
        log("RUN_STOPPED", runId=spec["runId"])
        return 1
    if result is None:
        return 1
    try:
        aws.client("sqs").send_message(QueueUrl=spec["queueUrl"], MessageBody=json.dumps(result))
    except (BotoCoreError, ClientError) as error:
        log("RESULT_NOT_SENT", runId=spec["runId"], error=type(error).__name__)
        return 1
    log("RESULT_SENT", runId=spec["runId"], outcome=result["outcome"]["kind"])
    return 0


def main() -> int:
    return run(os.environ, s3_tables_catalog)


if __name__ == "__main__":
    sys.exit(main())
