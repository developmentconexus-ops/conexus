from __future__ import annotations

import hashlib
import json
import os
import signal
import stat
import subprocess
import sys
import threading
import typing as t
import uuid
from collections.abc import Iterator
from dataclasses import dataclass, field
from decimal import Decimal
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import pytest
from pyiceberg.catalog import Catalog, load_catalog

from conexus_extraction import entry
from conexus_extraction.contract import Lake, Spec

REPO = Path(__file__).parents[3]
RECORDINGS = REPO / "apps/server/src/platform/recordings/aws"
TAP_DOUBLE = REPO / "apps/extraction/tap/src/test-double.ts"
REGION = "us-east-2"
COMPANY = "Aa0Bb1Cc2Dd3Ee4Ff5Gg6Hh7Ii8Jj9Kk"
QUEUE = f"https://sqs.{REGION}.amazonaws.com/111122223333/conexus-copia-fim"


def recording(name: str) -> dict[str, t.Any]:
    return t.cast("dict[str, t.Any]", json.loads((RECORDINGS / f"{name}.json").read_text()))


@dataclass
class Aws:
    parameters: dict[str, str] = field(default_factory=dict)
    sent: list[dict[str, t.Any]] = field(default_factory=list)
    gets: int = 0
    delete_after_gets: int | None = None

    def answer(self, target: str, request: dict[str, t.Any]) -> tuple[dict[str, t.Any], str]:
        if target == "AmazonSSM.GetParameter":
            self.gets += 1
            if self.delete_after_gets is not None and self.gets > self.delete_after_gets:
                self.parameters.pop(request["Name"], None)
            value = self.parameters.get(request["Name"])
            if value is None:
                gone = recording("get-parameter-apagado")
                return gone, gone["body"]
            found = recording("get-parameter")
            body = json.loads(found["body"])
            body["Parameter"].update(Name=request["Name"], Value=value)
            return found, json.dumps(body)
        sent = recording("send-message")
        self.sent.append(json.loads(request["MessageBody"]))
        body = json.loads(sent["body"])
        body["MD5OfMessageBody"] = hashlib.md5(request["MessageBody"].encode()).hexdigest()
        return sent, json.dumps(body)


@pytest.fixture
def aws(monkeypatch: pytest.MonkeyPatch) -> Iterator[Aws]:
    state = Aws()

    class Handler(BaseHTTPRequestHandler):
        def do_POST(self) -> None:
            length = int(self.headers["Content-Length"])
            request = json.loads(self.rfile.read(length))
            recorded, body = state.answer(self.headers["X-Amz-Target"], request)
            self.send_response(recorded["status"])
            self.send_header("Content-Type", recorded["contentType"])
            self.end_headers()
            self.wfile.write(body.encode())

        def log_message(self, *_: object) -> None:
            return

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = f"http://127.0.0.1:{server.server_address[1]}"
    for name, value in {
        "AWS_ENDPOINT_URL_SSM": origin,
        "AWS_ENDPOINT_URL_SQS": origin,
        "AWS_ACCESS_KEY_ID": "AKIAINVENTED00000001",
        "AWS_SECRET_ACCESS_KEY": "invented",
        "AWS_REGION": REGION,
    }.items():
        monkeypatch.setenv(name, value)
    yield state
    server.shutdown()


@dataclass(frozen=True)
class Double:
    origin: str
    credential: dict[str, str]


@pytest.fixture
def double() -> Iterator[Double]:
    served = subprocess.Popen(
        ["node", str(TAP_DOUBLE), "serve"], stdout=subprocess.PIPE, text=True, cwd=REPO
    )
    assert served.stdout is not None
    line = json.loads(served.stdout.readline())
    yield Double(origin=line["origin"], credential=line["credential"])
    served.send_signal(signal.SIGTERM)
    served.wait(timeout=10)


def _program(path: Path, text: str) -> None:
    path.write_text(text)
    path.chmod(path.stat().st_mode | stat.S_IXUSR)


@dataclass(frozen=True)
class Task:
    aws: Aws
    double: Double
    dumps: Path
    lake: Catalog
    catalog: dict[str, str]

    def spec(self, *tables: tuple[str, str], start_date: str | None = None) -> Spec:
        return {
            "version": 1,
            "runId": str(uuid.uuid4()),
            "attempt": 1,
            "companyId": COMPANY,
            "connector": "sankhya",
            "connectionId": str(uuid.uuid4()),
            "account": None,
            "startDate": start_date,
            "credential": self.double.credential,
            "tables": [{"source": s, "name": n, "whole": True} for s, n in tables],
            "lake": {
                "bucketArn": f"arn:aws:s3tables:{REGION}:111122223333:bucket/x",
                "region": REGION,
            },
            "queueUrl": QUEUE,
        }

    def run(self, spec: Spec) -> int:
        parameter = f"/conexus/copia/{COMPANY}/{spec['runId']}"
        self.aws.parameters[parameter] = json.dumps(spec)
        os.environ["CONEXUS_RUN_PARAMETER"] = parameter
        return entry.run(os.environ, self.catalog_of)

    def catalog_of(self, lake: Lake) -> dict[str, str]:
        return self.catalog

    def source(self, spec: Spec) -> dict[str, list[dict[str, t.Any]]]:
        work = self.dumps / "source"
        work.mkdir(exist_ok=True)
        config = work / "config.json"
        secret = work / "secret.json"
        secret.write_text(json.dumps(self.double.credential))
        config.write_text(
            json.dumps(
                {
                    "connector": "sankhya",
                    "secret_path": str(secret),
                    "result_path": str(work / "result.json"),
                    "tables": spec["tables"],
                }
            )
        )
        tap = ["node", str(TAP_DOUBLE), "--origin", self.double.origin, "--config", str(config)]
        found = json.loads(subprocess.check_output([*tap, "--discover"], cwd=REPO))
        asked = {table["source"] for table in spec["tables"]}
        for stream in found["streams"]:
            for entry_ in stream["metadata"]:
                if entry_["breadcrumb"] == []:
                    entry_["metadata"]["selected"] = stream["table_name"] in asked
        catalog = work / "catalog.json"
        catalog.write_text(json.dumps(found))
        lines = subprocess.check_output([*tap, "--catalog", str(catalog)], cwd=REPO, text=True)
        rows: dict[str, list[dict[str, t.Any]]] = {}
        for line in lines.splitlines():
            message = json.loads(line, parse_float=Decimal)
            if message["type"] == "RECORD":
                rows.setdefault(message["stream"], []).append(message["record"])
        return rows

    def feed(self, name: str, origins: dict[str, str]) -> dict[str, t.Any]:
        parameter = f"/conexus/copia/{COMPANY}/{uuid.uuid4()}"
        self.aws.parameters[parameter] = "{}"
        report = self.dumps / "report.json"
        config = self.dumps / "target.json"
        tables = {s: {"origin": o, "label": o, "meanings": {}} for s, o in origins.items()}
        config.write_text(
            json.dumps(
                {
                    "catalog": self.catalog,
                    "tables": tables,
                    "run_parameter": parameter,
                    "region": REGION,
                    "report_path": str(report),
                    "add_record_metadata": True,
                }
            )
        )
        lines = (Path(__file__).parent / "recordings" / name).read_text().splitlines()[1:]
        target = Path(sys.executable).with_name("target-conexus")
        subprocess.run(
            [str(target), "--config", str(config)], input="\n".join(lines), text=True, check=False
        )
        return t.cast("dict[str, t.Any]", json.loads(report.read_text()))

    def seen(self, name: str) -> str:
        return (self.dumps / name).read_text()


@pytest.fixture
def task(aws: Aws, double: Double, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Task:
    dumps = tmp_path / "dumps"
    plugins = tmp_path / "bin"
    dumps.mkdir()
    plugins.mkdir()
    target = Path(sys.executable).with_name("target-conexus")
    _program(
        plugins / "tap-conexus",
        "\n".join(
            [
                "#!/bin/sh",
                f'env >> "{dumps}/tap.env"',
                f'{{ tr -d "\\n" < "$2"; echo; }} >> "{dumps}/tap.config"',
                f'stat -c %a "$TAP_CONEXUS_SECRET_PATH" >> "{dumps}/secret.mode"',
                f'node "{TAP_DOUBLE}" --origin "{double.origin}" "$@"',
                "code=$?",
                f'cp "$TAP_CONEXUS_RESULT_PATH" "{dumps}/tap.result" 2>/dev/null',
                "exit $code",
            ]
        ),
    )
    _program(
        plugins / "target-conexus",
        f'#!/bin/sh\nenv >> "{dumps}/target.env"\nexec "{target}" "$@"\n',
    )
    monkeypatch.setenv("PATH", f"{plugins}:{os.environ['PATH']}")
    catalog = {
        "type": "sql",
        "uri": f"sqlite:///{tmp_path}/catalog.db",
        "warehouse": f"file://{tmp_path}/warehouse",
    }
    lake = load_catalog("lake", **catalog)
    for namespace in ("raw", "current"):
        lake.create_namespace(namespace)
    return Task(aws=aws, double=double, dumps=dumps, lake=lake, catalog=catalog)
