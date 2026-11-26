from __future__ import annotations

import json
import typing as t
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

PROJECT = Path(__file__).parents[2]
_SCHEMA = json.loads((PROJECT / "contract" / "copy-task.schema.json").read_text())
_SPEC = Draft202012Validator(_SCHEMA["spec"], format_checker=FormatChecker())
_RESULT = Draft202012Validator(_SCHEMA["result"], format_checker=FormatChecker())
_TREAT = json.loads((PROJECT / "contract" / "treat-task.schema.json").read_text())
_TREAT_SPEC = Draft202012Validator(_TREAT["spec"], format_checker=FormatChecker())
_TREAT_RESULT = Draft202012Validator(_TREAT["result"], format_checker=FormatChecker())
_ADDRESS = ("runId", "attempt", "queueUrl")
_REPLY_ADDRESS = Draft202012Validator(
    {
        "type": "object",
        "required": list(_ADDRESS),
        "properties": {name: _TREAT["spec"]["properties"][name] for name in _ADDRESS},
    },
    format_checker=FormatChecker(),
)


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


class TreatModel(t.TypedDict):
    name: str
    layer: t.Literal["tratado", "negocio"]
    table: str
    sql: str
    after: list[str]


class TreatSpec(t.TypedDict):
    version: t.Literal[1]
    runId: str
    attempt: int
    companyId: str
    lake: Lake
    queueUrl: str
    models: list[TreatModel]
    select: list[str]


class ReplyAddress(t.TypedDict):
    runId: str
    attempt: int
    queueUrl: str


class TreatError(t.TypedDict):
    kind: t.Literal["ERROR"]
    code: t.Literal["TREAT_SPEC_INVALID", "TREAT_ENGINE_FAILED"]


class Built(t.TypedDict):
    name: str
    status: t.Literal["BUILT"]
    rows: int


class ModelFailed(t.TypedDict):
    name: str
    status: t.Literal["FAILED"]
    failure: str
    line: int | None


class Skipped(t.TypedDict):
    name: str
    status: t.Literal["SKIPPED"]


ModelEnd = Built | ModelFailed | Skipped


class TreatResult(t.TypedDict):
    type: t.Literal["TREAT_RESULT"]
    version: t.Literal[1]
    runId: str
    attempt: int
    outcome: Complete | TreatError
    models: list[ModelEnd]


class SpecInvalid(Exception):
    pass


def _parsed(text: str, schema: Draft202012Validator) -> object:
    try:
        value = json.loads(text)
    except json.JSONDecodeError:
        raise SpecInvalid("not JSON") from None
    wrong = next(iter(schema.iter_errors(value)), None)
    if wrong is not None:
        raise SpecInvalid(str(wrong.absolute_path[0]) if wrong.absolute_path else "(root)")
    return value


def parse_spec(text: str) -> Spec:
    return t.cast("Spec", _parsed(text, _SPEC))


def parse_treat_spec(text: str) -> TreatSpec:
    return t.cast("TreatSpec", _parsed(text, _TREAT_SPEC))


def reply_address(text: str) -> ReplyAddress | None:
    try:
        return t.cast("ReplyAddress", _parsed(text, _REPLY_ADDRESS))
    except SpecInvalid:
        return None


def checked(result: Result) -> Result:
    _RESULT.validate(result)
    return result


def checked_treat(result: TreatResult) -> TreatResult:
    _TREAT_RESULT.validate(result)
    return result
