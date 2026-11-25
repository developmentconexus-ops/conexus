from __future__ import annotations

import json
import typing as t
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

PROJECT = Path(__file__).parents[2]
_SCHEMA = json.loads((PROJECT / "contract" / "copy-task.schema.json").read_text())
_SPEC = Draft202012Validator(_SCHEMA["spec"], format_checker=FormatChecker())
_RESULT = Draft202012Validator(_SCHEMA["result"], format_checker=FormatChecker())


class SpecTable(t.TypedDict):
    source: str
    name: str
    whole: bool


class Lake(t.TypedDict):
    bucketArn: str
    region: str


class Spec(t.TypedDict):
    version: t.Literal[1]
    runId: str
    attempt: int
    companyId: str
    connector: str
    connectionId: str
    account: str | None
    startDate: str | None
    credential: dict[str, str]
    tables: list[SpecTable]
    lake: Lake
    queueUrl: str


class SystemMessage(t.TypedDict):
    status: int | None
    code: str | None
    message: str | None


class Complete(t.TypedDict):
    kind: t.Literal["COMPLETE"]


class Failed(t.TypedDict):
    kind: t.Literal["ERROR"]
    code: str
    table: str | None
    system: SystemMessage | None


class TableCounts(t.TypedDict):
    name: str
    read: int
    written: int
    rounded: int
    rows: int | None
    whole: bool


class Allocated(t.TypedDict):
    vcpu: float
    memoryMib: int


class Peak(t.TypedDict):
    vcpu: float
    memoryMib: int


class Machine(t.TypedDict):
    allocated: Allocated
    peak: Peak
    everySeconds: int
    samples: list[list[float]]


class Result(t.TypedDict):
    type: t.Literal["RESULT"]
    version: t.Literal[1]
    runId: str
    attempt: int
    outcome: Complete | Failed
    tables: list[TableCounts]
    machine: t.NotRequired[Machine | None]


class SpecInvalid(Exception):
    pass


def parse_spec(text: str) -> Spec:
    try:
        value = json.loads(text)
    except json.JSONDecodeError:
        raise SpecInvalid("not JSON") from None
    wrong = next(iter(_SPEC.iter_errors(value)), None)
    if wrong is not None:
        raise SpecInvalid(str(wrong.absolute_path[0]) if wrong.absolute_path else "(root)")
    return t.cast("Spec", value)


def checked(result: Result) -> Result:
    _RESULT.validate(result)
    return result
