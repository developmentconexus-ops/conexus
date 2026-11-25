from __future__ import annotations

import json
import urllib.request
from decimal import Decimal

from pyiceberg.serializers import FromInputFile
from pyiceberg.table import Table

from tests.conftest import Task

NOTAS = ("TGFCAB", "sankhya_notas")
NFE = ("TGFNFE", "sankhya_notas_nfe")
SDC = {
    "_sdc_extracted_at",
    "_sdc_received_at",
    "_sdc_batched_at",
    "_sdc_deleted_at",
    "_sdc_sequence",
    "_sdc_table_version",
    "_sdc_sync_started_at",
}


def _rows_when_marked(table: Table) -> int | None:
    log = table.metadata.metadata_log
    logged = (FromInputFile.table_metadata(table.io.new_input(e.metadata_file)) for e in log)
    for metadata in (*logged, table.metadata):
        if "conexus.versao_completa" in metadata.properties:
            snapshot = metadata.current_snapshot()
            summary = None if snapshot is None else snapshot.summary
            return 0 if summary is None else int(summary["total-records"] or 0)
    return None


def test_a_passada_inteira_chega_a_bruta(task: Task) -> None:
    spec = task.spec(NOTAS)
    assert task.run(spec) == 0
    source = task.source(spec)["sankhya_notas"]
    raw = task.lake.load_table(("raw", "sankhya_notas"))
    lake = raw.scan().to_arrow()
    assert lake.num_rows == len(source)
    assert {"_sdc_sequence", "_sdc_table_version"} <= set(lake.column_names)
    [version] = set(lake.column("_sdc_table_version").to_pylist())
    assert raw.properties["conexus.versao_completa"] == str(version)
    assert _rows_when_marked(raw) == len(source)
    assert str(lake.schema.field("vlrnota").type) == "decimal128(38, 9)"
    assert sum(lake.column("vlrnota").to_pylist()) == sum(Decimal(r["vlrnota"]) for r in source)
    assert Decimal("1234567890123.123456") in lake.column("vlrnota").to_pylist()


def test_a_tabela_larga(task: Task) -> None:
    spec = task.spec(NOTAS)
    assert task.run(spec) == 0
    source = task.source(spec)["sankhya_notas"]
    lake = task.lake.load_table(("raw", "sankhya_notas")).scan().to_arrow()
    assert len(set(lake.column_names) - SDC) == 450
    assert set(lake.column_names) - SDC == set(source[0])
    assert lake.num_rows == len(source)


def test_a_origem_e_o_rotulo_no_catalogo(task: Task) -> None:
    assert task.run(task.spec(NOTAS, NFE)) == 0
    for area in ("raw", "current"):
        notas = task.lake.load_table((area, "sankhya_notas")).properties
        assert notas["conexus.origem"] == "TGFCAB"
        assert notas["conexus.rotulo"] == "Notas e pedidos"
        nfe = task.lake.load_table((area, "sankhya_notas_nfe")).properties
        assert nfe["conexus.significado.xml"] == "NFE_XML"
        assert "conexus.significado.xml" not in notas


def test_o_xml_inteiro(task: Task) -> None:
    spec = task.spec(NFE)
    assert task.run(spec) == 0
    source = {row["nunota"]: row["xml"] for row in task.source(spec)["sankhya_notas_nfe"]}
    lake = task.lake.load_table(("raw", "sankhya_notas_nfe")).scan().to_arrow()
    copied = dict(
        zip(lake.column("nunota").to_pylist(), lake.column("xml").to_pylist(), strict=True)
    )
    assert copied == source
    assert max(len(xml.encode()) for xml in copied.values()) > 1_048_576


def test_o_valor_com_dez_casas_e_arredondado_e_contado(task: Task) -> None:
    report = task.feed("arredonda.jsonl", {"teste_decimal": "TESTE"})
    assert report["failed"] is None
    assert report["tables"]["teste_decimal"] == {"read": 7, "written": 7, "rounded": 5}
    lake = task.lake.load_table(("raw", "teste_decimal")).scan().to_arrow()
    assert str(lake.schema.field("valor").type) == "decimal128(38, 9)"
    assert dict(
        zip(lake.column("codigo").to_pylist(), lake.column("valor").to_pylist(), strict=True)
    ) == {
        1: Decimal("0.123456789"),
        2: Decimal("0.123456790"),
        3: Decimal("1.5"),
        4: Decimal("-0.123456790"),
        5: Decimal("0.333333333"),
        6: None,
        7: Decimal("0.123456789"),
    }


def test_a_contagem_soma_os_lotes_da_tabela(task: Task) -> None:
    report = task.feed("arredonda.jsonl", {"teste_decimal": "TESTE"}, batch_size_rows=3)
    assert report["failed"] is None
    assert report["tables"]["teste_decimal"] == {"read": 7, "written": 7, "rounded": 5}
    lake = task.lake.load_table(("raw", "teste_decimal"))
    assert len(lake.inspect.snapshots()) == 3


def test_a_escala_do_dicionario(task: Task) -> None:
    report = task.feed("escala-declarada.jsonl", {"teste_decimal": "TESTE"})
    assert report["failed"] is None
    assert report["tables"]["teste_decimal"]["rounded"] == 0
    lake = task.lake.load_table(("raw", "teste_decimal")).scan().to_arrow()
    assert str(lake.schema.field("valor").type) == "decimal128(18, 4)"
    assert sorted(lake.column("valor").to_pylist()) == [
        Decimal("0.5000"),
        Decimal("1234567890123.1234"),
    ]


def test_a_escala_declarada_acima_de_nove_chega_exata(task: Task) -> None:
    report = task.feed("escala-doze.jsonl", {"teste_decimal": "TESTE"})
    assert report["failed"] is None
    assert report["tables"]["teste_decimal"]["rounded"] == 0
    lake = task.lake.load_table(("raw", "teste_decimal")).scan().to_arrow()
    assert str(lake.schema.field("valor").type) == "decimal128(38, 12)"
    assert lake.column("valor").to_pylist() == [Decimal("0.123456789012")]


def test_a_escala_declarada_que_o_valor_quebra_derruba_o_lote(task: Task) -> None:
    report = task.feed("escala-quebrada.jsonl", {"teste_decimal": "TESTE"})
    assert report["failed"] == {"table": "teste_decimal"}
    assert task.lake.load_table(("raw", "teste_decimal")).scan().to_arrow().num_rows == 0


def test_o_valor_que_nao_cabe(task: Task) -> None:
    report = task.feed("nao-cabe.jsonl", {"teste_numero": "TESTE"})
    assert report["failed"] == {"table": "teste_numero"}
    assert task.lake.load_table(("raw", "teste_numero")).scan().to_arrow().num_rows == 0


def test_o_binario_chega_igual(task: Task) -> None:
    report = task.feed("binario.jsonl", {"teste_binario": "TESTE"})
    assert report["failed"] is None
    lake = task.lake.load_table(("raw", "teste_binario")).scan().to_arrow()
    assert str(lake.schema.field("imagem").type) == "binary"
    assert lake.column("imagem").to_pylist() == [
        bytes([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 255]),
        None,
    ]


def test_a_coluna_nova(task: Task) -> None:
    spec = task.spec(NOTAS)
    assert task.run(spec) == 0
    before = task.lake.load_table(("raw", "sankhya_notas")).scan().to_arrow().num_rows
    added = urllib.request.urlopen(
        urllib.request.Request(f"{task.double.origin}/__teste/colunas", method="POST")
    )
    column = json.loads(added.read())["coluna"].lower()
    assert task.run(task.spec(NOTAS)) == 0
    lake = task.lake.load_table(("raw", "sankhya_notas")).scan().to_arrow()
    assert column in lake.column_names
    assert lake.column(column).to_pylist()[:before] == [None] * before


def test_a_coluna_que_some_fica(task: Task) -> None:
    report = task.feed("coluna-some.jsonl", {"teste_colunas": "TESTE"})
    assert report["failed"] is None
    lake = task.lake.load_table(("raw", "teste_colunas")).scan().to_arrow()
    rows = {row["codigo"]: row["extra"] for row in lake.to_pylist()}
    assert rows == {1: "x", 2: None}
