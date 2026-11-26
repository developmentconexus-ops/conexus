"""Records the Athena answers the update step reads (`src/conexus_extraction/update.py`).

    AWS_PROFILE=conexus-lab AWS_REGION=us-east-2 uv run --with "botocore[crt]" \
        python tests/record_athena.py <lake id of the laboratory>

It runs two read-only queries in the laboratory lake's workgroup (StartQueryExecution,
GetQueryExecution, GetQueryResults): a `SELECT count(*)` that succeeds and a `SELECT` of a column
that does not exist, which Athena fails. Nothing is written or created in AWS. Each answer is kept
as AWS sent it, with the account and every id and name changed for invented ones (security S40),
in `apps/server/src/platform/recordings/aws/`.
"""

from __future__ import annotations

import json
import re
import sys
import time
import typing as t
from datetime import date
from pathlib import Path

import boto3

FOLDER = Path(__file__).parents[3] / "apps/server/src/platform/recordings/aws"
INVENTED_LAKE = "k3x9a0b1c2d3"
INVENTED_COUNT = "7"
TIMESTAMP = re.compile(r"(\d\.\d{3})\d+E9")
UUID = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")
COUNT = "SELECT count(*) FROM information_schema.tables"
FAILS = "SELECT coluna_que_nao_existe FROM information_schema.tables"
SOURCE = (
    "U10 step 6, tests/record_athena.py from this machine on a read-only query of the "
    "laboratory lake's workgroup, nothing created; ids and names changed (S40)"
)


class Wire:
    def __init__(self) -> None:
        self.last: dict[str, t.Any] = {}

    def __call__(self, response_dict: dict[str, t.Any], **_: object) -> None:
        self.last = {
            "status": response_dict["status_code"],
            "contentType": response_dict["headers"].get("content-type", ""),
            "body": response_dict["body"].decode("utf-8"),
        }


def invented(text: str, lake: str, ids: dict[str, str], count: str) -> str:
    out = TIMESTAMP.sub(r"\1E9", text).replace(lake, INVENTED_LAKE)
    out = out.replace(f'"{count}"', f'"{INVENTED_COUNT}"')
    out = re.sub(rf'(?<=Rows":){count}\b', INVENTED_COUNT, out)
    return UUID.sub(
        lambda found: ids.setdefault(
            found.group(0), f"00000000-0000-4000-8000-{len(ids) + 1:012x}"
        ),
        out,
    )


def finished(athena: t.Any, query_id: str) -> None:
    while True:
        state = athena.get_query_execution(QueryExecutionId=query_id)["QueryExecution"]["Status"]
        if state["State"] in {"SUCCEEDED", "FAILED", "CANCELLED"}:
            return
        time.sleep(0.5)


def main(lake: str) -> None:
    session = boto3.Session(profile_name="conexus-lab", region_name="us-east-2")
    athena = session.client("athena")
    wire = Wire()
    athena.meta.events.register("response-received.athena.*", wire)
    name = f"conexus-{lake}"
    kept: dict[str, tuple[str, dict[str, t.Any]]] = {}

    def start(query: str, file: str) -> str:
        query_id: str = athena.start_query_execution(
            QueryString=query,
            WorkGroup=name,
            QueryExecutionContext={"Catalog": f"s3tablescatalog/{name}", "Database": "raw"},
        )["QueryExecutionId"]
        kept[file] = ("StartQueryExecution", wire.last)
        return query_id

    counted = start(COUNT, "start-query-execution")
    finished(athena, counted)
    kept["get-query-execution-succeeded"] = ("GetQueryExecution", wire.last)
    rows = athena.get_query_results(QueryExecutionId=counted)["ResultSet"]["Rows"]
    kept["get-query-results"] = ("GetQueryResults", wire.last)
    count = rows[1]["Data"][0]["VarCharValue"]
    refused = start(FAILS, "start-query-execution-recusada")
    finished(athena, refused)
    kept["get-query-execution-failed"] = ("GetQueryExecution", wire.last)
    del kept["start-query-execution-recusada"]
    ids: dict[str, str] = {}
    for file, (api, answer) in kept.items():
        recording = {
            "service": "athena",
            "api": api,
            "sdk": f"boto3 {boto3.__version__}",
            "recordedAt": date.today().isoformat(),
            "source": SOURCE,
            **answer,
            "body": invented(answer["body"], lake, ids, count),
        }
        (FOLDER / f"{file}.json").write_text(f"{json.dumps(recording, indent=2)}\n")


if __name__ == "__main__":
    main(sys.argv[1])
